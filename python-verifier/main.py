import os
import re
import time
import email
import asyncio
import urllib.request
import hmac
from email.header import decode_header
from email.utils import getaddresses
from contextlib import asynccontextmanager
from fastapi import FastAPI, Header, HTTPException
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from dotenv import load_dotenv
from imapclient import IMAPClient
from datetime import datetime, timezone
import logging

# Silence noisy health check logs from Render's load balancer
class EndpointFilter(logging.Filter):
    def filter(self, record: logging.LogRecord) -> bool:
        msg = record.getMessage()
        return "/health" not in msg

logging.getLogger("uvicorn.access").addFilter(EndpointFilter())

load_dotenv(os.path.join(os.path.dirname(__file__), '..', '.env.local'))

# In-memory shared state for zero-latency verification
_cached_transactions: List[Dict[str, Any]] = []
_last_sync_time: float = 0.0
_idle_running: bool = True
_idle_client: Optional[IMAPClient] = None

def decode_mime_header(val: Optional[str]) -> str:
    """Decodes MIME encoded headers like =?UTF-8?Q?..."""
    if not val:
        return ""
    try:
        parts = decode_header(val)
        res = []
        for part, enc in parts:
            if isinstance(part, bytes):
                res.append(part.decode(enc or "utf-8", errors="ignore"))
            else:
                res.append(str(part))
        return "".join(res)
    except Exception:
        return str(val)

def extract_ref_code(text: str) -> Optional[str]:
    """Extracts unique suedue token/ref_code from transaction purpose or notes."""
    # Pattern 1: SD-XXXX or SDXXXX (e.g. SD7A8B, SD-4K9M)
    sd_m = re.search(r"\b(SD[\-]?[A-Z0-9]{4,6})\b", text, re.IGNORECASE)
    if sd_m:
        return sd_m.group(1).upper().replace("-", "")
    # Pattern 2: suedue XXXX
    suedue_m = re.search(r"suedue[\s\-_]+([A-Z0-9]{4,6})", text, re.IGNORECASE)
    if suedue_m:
        return suedue_m.group(1).upper().replace("-", "")
    return None

def parse_email_message(msg_bytes: bytes) -> Optional[Dict[str, Any]]:
    """Parses raw email bytes into structured FamPay transaction data."""
    try:
        msg = email.message_from_bytes(msg_bytes)
        sender_addresses = [address.lower() for _, address in getaddresses(msg.get_all("From", []))]
        if not any(address.endswith("@famapp.in") for address in sender_addresses):
            return None
        subject = decode_mime_header(msg.get("Subject", ""))
        # Extract plain text body
        body = ""
        if msg.is_multipart():
            for part in msg.walk():
                if part.get_content_type() == "text/plain":
                    payload = part.get_payload(decode=True)
                    if payload:
                        body = payload.decode(errors="ignore")
                    break
        else:
            payload = msg.get_payload(decode=True)
            if payload:
                body = payload.decode(errors="ignore")

        # Verification uses the parsed receipt body. The subject is never
        # treated as proof of payment. Sender-domain validation above is the
        # provider check; receipt wording varies between Fam email templates.
        full_text = body

        # 1. Extract Amount
        amt_match = re.search(r"received\s+₹\s*([\d,]+(?:\.\d+)?)\s+from", full_text, re.IGNORECASE)
        if amt_match:
            amount_rupees = float(amt_match.group(1).replace(",", ""))
        else:
            return None

        amount_paise = int(round(amount_rupees * 100))

        # 2. Extract Token / Ref Code from Purpose or Body (100% exact note match!)
        ref_code = extract_ref_code(full_text)

        # 3. Extract Sender Name
        sender_name = "UPI User"
        name_match = re.search(r"from\s+(.*?)\s+at\s+\d{1,2}:\d{2}", full_text, re.IGNORECASE)
        if name_match:
            sender_name = name_match.group(1).strip()
        else:
            name_match_alt = re.search(
                r"(?:from|received from)\s+([a-zA-Z][a-zA-Z\s]{2,34}?)(?=\s+(?:at|transaction\s+id|date|utr|purpose)\b|$)",
                full_text,
                re.IGNORECASE,
            )
            if name_match_alt:
                sender_name = name_match_alt.group(1).strip()

        sender_name = re.sub(r"\s+with$", "", sender_name, flags=re.IGNORECASE).strip()

        # 4. Extract 12-digit UTR
        utr_match = re.search(r"(?:utr|upi ref no|ref no|reference no)\s*[:\-]?\s*([0-9]{12})", full_text, re.IGNORECASE)
        parsed_utr = utr_match.group(1) if utr_match else None

        # 5. Extract Txn ID
        txn_match = re.search(r"transaction id\s+([A-Za-z0-9]+)", full_text, re.IGNORECASE)
        parsed_txnid = txn_match.group(1) if txn_match else "UNKNOWN_TXN"

        raw_date = msg.get("Date", "")
        return {
            "amount_paise": amount_paise,
            "amount_rupees": amount_rupees,
            "ref_code": ref_code,
            "sender_name": sender_name.title(),
            "utr": parsed_utr,
            "txn_id": parsed_txnid,
            "date": datetime.now(timezone.utc).isoformat(),
            "raw_date": raw_date
        }
    except Exception as e:
        print(f"[suedue-idle] Error parsing email: {e}")
        return None

def fetch_recent_fampay_emails(client: IMAPClient, limit: int = 10) -> List[Dict[str, Any]]:
    """Fetches the latest FamPay receipt emails using IMAPClient."""
    try:
        # Search the newest messages and let the parser identify FamPay receipts.
        # Sender addresses can vary between receipt versions.
        uids = client.search(["FROM", "famapp.in"])
        if not uids:
            return []
        target_uids = uids[-limit:]
        res = client.fetch(target_uids, ["RFC822"])
        
        parsed = []
        for uid in reversed(target_uids):
            data = res.get(uid, {}).get(b"RFC822")
            if data:
                item = parse_email_message(data)
                if item:
                    item["email_id"] = str(uid)
                    parsed.append(item)
        return parsed
    except Exception as e:
        print(f"[suedue-idle] Fetch error: {e}")
        return []

def sync_recent_transactions(client: IMAPClient) -> None:
    """Refresh the cache from fully parsed receipt emails."""
    global _cached_transactions, _last_sync_time

    full_items = fetch_recent_fampay_emails(client)
    if full_items:
        old_items = {item.get("email_id"): item for item in _cached_transactions}
        _cached_transactions = full_items
        _last_sync_time = time.time()
        if any(
            item.get("email_id") not in old_items
            or (not old_items[item.get("email_id")].get("utr") and item.get("utr"))
            for item in full_items
        ):
            trigger_nextjs_verify_webhook()

def trigger_nextjs_verify_webhook():
    """Fires internal webhook to Next.js immediately when a new email arrives."""
    app_url = os.getenv("APP_URL", "http://127.0.0.1:3000")
    try:
        req = urllib.request.Request(f"{app_url}/api/payments/verify", method="POST", data=b"{}")
        req.add_header("Content-Type", "application/json")
        with urllib.request.urlopen(req, timeout=3.0) as resp:
            pass
    except Exception:
        pass

def imap_idle_sync_loop():
    """
    Continuous IMAP IDLE push loop (RFC 2177).
    Google IMAP pushes events over TCP directly to this loop in < 200ms.
    """
    global _cached_transactions, _last_sync_time, _idle_running, _idle_client
    gmail = os.getenv("FAMPAY_GMAIL", "")
    app_pwd = os.getenv("FAMPAY_GMAIL_APP_PASSWORD", "")
    if not gmail or not app_pwd:
        print("[suedue-idle] FAMPAY_GMAIL or FAMPAY_GMAIL_APP_PASSWORD missing!")
        return

    print(f"[suedue-idle] Starting Native IMAP IDLE Push Listener for {gmail}...")

    while _idle_running:
        client = None
        try:
            client = IMAPClient("imap.gmail.com", ssl=True, timeout=15)
            client.login(gmail, app_pwd)
            client.select_folder("INBOX")
            _idle_client = client

            # Initial sync of recent transactions
            init_txns = fetch_recent_fampay_emails(client)
            if init_txns:
                _cached_transactions = init_txns
                _last_sync_time = time.time()
                print(f"[suedue-idle] Initialized cache with {len(init_txns)} transactions")

            print("[suedue-idle] Connected & Entering IMAP IDLE (Push Notification Mode)...")

            while _idle_running:
                # Enter IDLE mode
                client.idle()
                
                # Blocks with ZERO CPU usage until Google pushes '* EXISTS' (new email)
                # or the 2s keepalive expires. Keep IDLE push notifications, but periodically refresh as a
                # fallback when Gmail does not emit EXISTS immediately.
                responses = client.idle_check(timeout=2)
                client.idle_done()

                if responses:
                    print(f"[suedue-idle] ⚡ Push Notification Received from Google IMAP: {responses}")
                    sync_recent_transactions(client)
                else:
                    # Keepalive fallback: refresh even when Gmail omitted a
                    # push event so verification does not wait for the next IDLE cycle.
                    sync_recent_transactions(client)

        except Exception as e:
            print(f"[suedue-idle] Connection dropped or error: {e}. Reconnecting in 3s...")
            time.sleep(3)
        finally:
            if client:
                try:
                    client.logout()
                except Exception:
                    pass
                _idle_client = None

@asynccontextmanager
async def lifespan(app: FastAPI):
    global _idle_running
    _idle_running = True
    
    # Run IMAP IDLE in dedicated background thread
    idle_thread = asyncio.to_thread(imap_idle_sync_loop)
    asyncio.create_task(idle_thread)
    
    yield
    
    _idle_running = False
    if _idle_client:
        try:
            _idle_client.idle_done()
            _idle_client.logout()
        except Exception:
            pass

app = FastAPI(title="Duesly Native IMAP IDLE Fast Verifier", lifespan=lifespan)

@app.api_route("/health", methods=["GET", "HEAD"])
def health_check():
    return {"status": "ok"}

@app.api_route("/", methods=["GET", "HEAD"])
def root():
    return {"status": "ok", "service": "duesly-python-verifier", "docs": "/docs"}

def name_matches(expected: Optional[str], sender: str) -> bool:
    """Checks token overlap between expected person name and UPI sender name."""
    if not expected:
        return True
    exp_tokens = [t.lower() for t in re.findall(r"[a-zA-Z]{3,}", expected)]
    if not exp_tokens:
        return True
    sender_lower = sender.lower()
    return any(token in sender_lower for token in exp_tokens)

# ==================== REQUEST / RESPONSE SCHEMAS ====================

class VerifyRequest(BaseModel):
    amount: float  # in paise
    ref_code: Optional[str] = None
    utr: Optional[str] = None
    transaction_id: Optional[str] = None
    person_name: Optional[str] = None
    used_utrs: Optional[List[str]] = []

class BatchItem(BaseModel):
    id: str
    amount: float  # in paise
    ref_code: Optional[str] = None
    utr: Optional[str] = None
    person_name: Optional[str] = None
    created_at: Optional[str] = None

class BatchVerifyRequest(BaseModel):
    requests: List[BatchItem]
    used_utrs: Optional[List[str]] = []

def require_verifier_secret(provided_secret: Optional[str]) -> None:
    expected_secret = os.getenv("VERIFIER_SHARED_SECRET")
    if not expected_secret or not provided_secret or not hmac.compare_digest(provided_secret, expected_secret):
        raise HTTPException(status_code=401, detail="Unauthorized")

# ==================== ENDPOINTS (ZERO LATENCY - RAM ONLY) ====================

@app.post("/verify")
async def verify_payment(req: VerifyRequest, x_internal_secret: Optional[str] = Header(default=None)):
    """Sub-millisecond verification directly from memory cache."""
    require_verifier_secret(x_internal_secret)
    txns = _cached_transactions
    expected_paise = int(round(req.amount))
    used = set(req.used_utrs or [])
    clean_ref = req.ref_code.upper().replace("-", "") if req.ref_code else None

    for tx in txns:
        utr = tx["utr"]
        if not utr or utr in used:
            continue

        if tx["amount_paise"] != expected_paise:
            continue

        # 1. Primary Fallback: If user submitted a 12-digit UTR, match UTR + Amount directly!
        if req.utr and req.utr.strip():
            if req.utr.strip() == utr:
                return {
                    "status": "VERIFIED",
                    "utr": utr,
                    "amount": tx["amount_paise"],
                    "sender_name": tx["sender_name"],
                    "payment_time": tx["date"],
                    "match_type": "UTR_MATCH"
                }
            else:
                continue

        # 2. Token match: Exact clean ref code without spaces (e.g. SD7A8B)
        if clean_ref and tx.get("ref_code"):
            if clean_ref == tx["ref_code"]:
                return {
                    "status": "VERIFIED",
                    "utr": utr,
                    "amount": tx["amount_paise"],
                    "sender_name": tx["sender_name"],
                    "payment_time": tx["date"],
                    "match_type": "TOKEN_MATCH"
                }
            else:
                continue

        # 3. Fallback: Sender Name match if no token and no UTR
        if req.person_name and name_matches(req.person_name, tx["sender_name"]):
            return {
                "status": "VERIFIED",
                "utr": utr,
                "amount": tx["amount_paise"],
                "sender_name": tx["sender_name"],
                "payment_time": tx["date"],
                "match_type": "NAME_FALLBACK"
            }

    return {
        "status": "NOT_FOUND",
        "message": f"No recent transaction found for ₹{expected_paise / 100:.2f}"
    }

@app.post("/verify-batch")
async def verify_batch(req: BatchVerifyRequest, x_internal_secret: Optional[str] = Header(default=None)):
    """
    Sub-millisecond batch verification for all pending requests.
    Direct memory lookup - 0ms IMAP wait!
    """
    require_verifier_secret(x_internal_secret)
    global _last_request_time
    _last_request_time = time.time()
    txns = _cached_transactions
    used = set(req.used_utrs or [])
    matches = {}
    claimed_in_this_run = set()

    for item in req.requests:
        expected_paise = int(round(item.amount))
        clean_ref = item.ref_code.upper().replace("-", "") if item.ref_code else None
        best_match = None
        match_type = "UNKNOWN"

        for tx in txns:
            utr = tx["utr"]
            if not utr:
                continue

            if utr in used or utr in claimed_in_this_run:
                continue

            if tx["amount_paise"] != expected_paise:
                continue

            # PRIORITY 1: User explicitly submitted 12-digit UTR + Amount
            # Works for ANY banking app that strips or prohibits notes!
            if item.utr and item.utr.strip():
                if item.utr.strip() == utr:
                    best_match = tx
                    match_type = "UTR_MATCH"
                    break
                else:
                    continue

            # PRIORITY 2: Exact token in UPI note (no spaces, e.g. SD7A8B)
            if clean_ref and tx.get("ref_code"):
                if clean_ref == tx["ref_code"]:
                    best_match = tx
                    match_type = "TOKEN_MATCH"
                    break
                else:
                    continue

            # PRIORITY 3: Fallback to sender name overlap
            if item.person_name and name_matches(item.person_name, tx["sender_name"]):
                best_match = tx
                match_type = "NAME_FALLBACK"
                break

        if best_match:
            claimed_in_this_run.add(best_match["utr"])
            matches[item.id] = {
                "status": "VERIFIED",
                "utr": best_match["utr"],
                "amount": best_match["amount_paise"],
                "sender_name": best_match["sender_name"],
                "payment_time": best_match["date"],
                "match_type": match_type
            }

    return {
        "status": "OK",
        "matches": matches,
        "verified_count": len(matches)
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
