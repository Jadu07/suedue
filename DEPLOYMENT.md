# Duesly — Render Production Deployment Guide

This guide details how to deploy **Duesly** on [Render](https://render.com) with high availability, automated health checks, and zero-latency payment verification.

---

## 🏗️ Architecture Overview

The system consists of two primary services:
1. **Next.js Web Application (`duesly-web`)**:
   - Handles the full UI (Bills, People, Payments, Settings, Mobile Bottom Nav).
   - Manages API routes, authentication sessions, bill splits, and WhatsApp dispatch.
   - Hosted as a **Render Web Service** (Node.js runtime).
   - Health Check Endpoint: **`/api/health`**

2. **Python FamPay Verifier (`duesly-verifier`)**:
   - Real-time IMAP IDLE listener (RFC 2177) that detects Google FamPay credit emails in sub-second time.
   - Sub-millisecond in-memory cache lookup for UTRs and tokens.
   - Hosted as a **Render Web Service** (Python runtime).
   - Health Check Endpoint: **`/health`**

---

## 🩺 Health Check Endpoints

Both services feature built-in health check endpoints configured for Render’s automated zero-downtime health probing:

### 1. Next.js Web App Health Point
- **Path:** `/api/health`
- **Method:** `GET`
- **Success Status:** `200 OK`
- **Sample Request:**
  ```bash
  curl -s https://<your-render-duesly-url>.onrender.com/api/health
  ```
- **Response Schema:**
  ```json
  {
    "status": "ok",
    "service": "duesly-web",
    "timestamp": "2026-09-17T16:13:27.705Z",
    "uptimeSeconds": 6379,
    "database": "connected",
    "latencyMs": 0,
    "environment": "production"
  }
  ```

### 2. Python Verifier Health Point
- **Path:** `/health`
- **Method:** `GET`
- **Success Status:** `200 OK`
- **Sample Request:**
  ```bash
  curl -s https://<your-render-verifier-url>.onrender.com/health
  ```
- **Response Schema:**
  ```json
  {
    "status": "ok",
    "service": "duesly-python-verifier",
    "idle_running": true,
    "cached_transactions_count": 3,
    "last_sync_time": 1789661583.79,
    "timestamp": "2026-09-17T16:13:33.817223+00:00"
  }
  ```

---

## 🚀 Option 1: Blueprint Deployment (`render.yaml`) — Recommended

The repository includes a ready-to-use `render.yaml` specification in the root directory.

1. Push your code to your GitHub / GitLab repository.
2. Log in to [dashboard.render.com](https://dashboard.render.com).
3. Click **New +** → **Blueprint**.
4. Select your `Duesly` repository.
5. Render will automatically detect `render.yaml` and configure both services:
   - `duesly-web`
   - `duesly-verifier`
6. Fill in the required secret environment variables prompted by the Render dashboard (see [Environment Variables Reference](#-environment-variables-reference) below).
7. Click **Apply**.

---

## 🛠️ Option 2: Manual Deployment Step-by-Step

### Step 1: Deploy Next.js Web App (`duesly-web`)
1. In Render Dashboard, click **New +** → **Web Service**.
2. Connect your Git repository.
3. Configure the settings:
   - **Name:** `duesly-web`
   - **Region:** Choose closest to your users (e.g., `Singapore`, `Frankfurt`, or `Oregon`)
   - **Branch:** `main` (or your active branch)
   - **Root Directory:** Leave empty (root)
   - **Runtime:** `Node`
   - **Build Command:** `npm install --include=dev && npm run build`
   - **Start Command:** `npm start`
   - **Plan:** `Free` or `Starter`
4. Expand **Advanced**:
   - **Health Check Path:** `/api/health`
   - **Auto-Deploy:** `Yes`
5. Add Environment Variables (see table below).
6. Click **Create Web Service**.

---

### Step 2: Deploy Python Verifier (`duesly-verifier`)
1. In Render Dashboard, click **New +** → **Web Service**.
2. Select the same repository.
3. Configure settings:
   - **Name:** `duesly-verifier`
   - **Region:** Same region as `duesly-web`
   - **Branch:** `main`
   - **Root Directory:** `python-verifier`
   - **Runtime:** `Python 3`
   - **Build Command:** `pip install -r requirements.txt`
   - **Start Command:** `uvicorn main:app --host 0.0.0.0 --port $PORT`
   - **Plan:** `Starter` (recommended for persistent IMAP IDLE socket) or `Free`
4. Expand **Advanced**:
   - **Health Check Path:** `/health`
5. Add Environment Variables:
   - `FAMPAY_GMAIL`: Your Gmail address
   - `FAMPAY_GMAIL_APP_PASSWORD`: 16-character Google App Password
   - `NEXT_PUBLIC_APP_URL`: Your `duesly-web` Render URL (e.g. `https://duesly-web.onrender.com`)
6. Click **Create Web Service**.

---

## 🔑 Environment Variables Reference

### For `duesly-web` (Next.js)

| Variable | Required | Description | Example / Default |
| :--- | :--- | :--- | :--- |
| `NODE_ENV` | Yes | Node environment | `production` |
| `MONGODB_URI` | Yes | MongoDB Atlas connection string | `mongodb+srv://user:pwd@cluster.mongodb.net/duesly` |
| `AUTH_SECRET` | Yes | Secret string for signing JWT tokens | Random 32+ char string |
| `NEXT_PUBLIC_APP_URL` | Yes | Public URL of the deployed web app (used for WhatsApp pay links) | `https://duesly-web.onrender.com` |
| `NEXT_PUBLIC_UPI_ID` | Yes | Admin UPI ID to receive payments | `yourname@fam` |
| `PYTHON_VERIFIER_URL` | Yes | URL of the Python verifier service | `https://duesly-verifier.onrender.com` |
| `DEFAULT_ADMIN_EMAIL` | Optional | Email for default admin profile | `admin@example.com` |
| `DEFAULT_ADMIN_PASSWORD` | Optional | Initial admin login password | `YourSecurePassword` |
| `OPENWA_URL` | Optional | OpenWA WhatsApp REST API endpoint | `https://openwa-0gjr.onrender.com` |
| `OPENWA_API_KEY` | Optional | OpenWA API Key | `owa_k1_...` |
| `OPENWA_SESSION_ID` | Optional | OpenWA session identifier | `8eab27d6-...` |
| `FAMPAY_GMAIL` | Optional | Fallback direct sync Gmail | `your-email@gmail.com` |
| `FAMPAY_GMAIL_APP_PASSWORD` | Optional | Fallback direct sync App Password | `xxxx xxxx xxxx xxxx` |

### For `duesly-verifier` (Python)

| Variable | Required | Description | Example |
| :--- | :--- | :--- | :--- |
| `FAMPAY_GMAIL` | Yes | Gmail receiving FamPay transaction emails | `your-email@gmail.com` |
| `FAMPAY_GMAIL_APP_PASSWORD` | Yes | 16-char Google App Password (2FA) | `xxxx xxxx xxxx xxxx` |
| `NEXT_PUBLIC_APP_URL` | Yes | Web app URL to notify on incoming transactions | `https://duesly-web.onrender.com` |
| `PYTHON_VERSION` | No | Python version pin | `3.11.9` |

---

## ⚠️ Crucial Configuration Checklist

1. **MongoDB Atlas IP Whitelist:**
   - In MongoDB Atlas, go to **Network Access** → **IP Access List**.
   - Ensure `0.0.0.0/0` (Allow Access from Anywhere) is added, because Render uses dynamic outbound IP addresses.

2. **Google App Password Setup:**
   - Go to Google Account → Security → 2-Step Verification → **App passwords**.
   - Generate an App Password for **Mail**.
   - Paste the 16-character code into `FAMPAY_GMAIL_APP_PASSWORD`.

3. **Link Generation:**
   - Always ensure `NEXT_PUBLIC_APP_URL` matches your live Render domain (e.g., `https://duesly.onrender.com`) without a trailing slash, so WhatsApp share links and status polling URLs resolve correctly.

4. **IMAP IDLE Keepalive:**
   - Render Starter plans keep the web service awake 24/7, maintaining the TCP connection for instant push notifications (<200ms).
   - If using Free tier, the service may sleep after 15 minutes of inactivity; hitting `/health` or setting up an external ping keeps it warm.
