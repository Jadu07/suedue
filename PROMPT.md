# Build a Personal Bill Splitting & Payment Collection App Called Duesly.

Build a secure, production-ready **personal bill splitting and payment collection web app**.

The app is for personal use. I create a bill, add people and their individual amounts, send each person a payment link through WhatsApp using **OpenWA**, and automatically detect/verify payments using FamPay email notifications through the exact open-source repository below.

## Important integrations

### 1. FamPay payment verification

Use this exact repository:

https://github.com/iflexvault/fampay-verify

This is the **`iflexvault/fampay-verify` Python package**.

Do NOT replace it with another FamPay verification implementation.

Repository purpose:

* Verifies FamPay UPI payments using Gmail/IMAP payment alerts
* Supports dynamic amount verification
* Supports UTR/TxnID verification
* Has a 15-minute verification window
* Returns transaction details such as UTR, amount, sender name and payment time
* Supports sync and async APIs

Because this repository is Python, do NOT try to directly run it inside the Next.js runtime.

Use this architecture:

```text
Next.js App
    |
    | internal API
    v
Python Payment Verification Service
    |
    | fampay-verify
    v
Gmail IMAP
    |
    v
FamPay payment notification
```

The Python service should be small and isolated. The main application remains Next.js.

---

### 2. WhatsApp

Use **OpenWA API directly** for WhatsApp messaging.

Do NOT use:

* WhatsApp `wa.me` links as the sending mechanism
* fake/mock WhatsApp sending
* client-side WhatsApp APIs
* hardcoded WhatsApp credentials

The application should call the OpenWA server-side API to actually send messages.

Architecture:

```text
Next.js Server
      |
      v
OpenWA API
      |
      v
WhatsApp
```

All OpenWA credentials must remain server-side.

---

# Tech Stack

## Main application

* Next.js latest stable
* App Router
* TypeScript
* React
* Tailwind CSS
* shadcn/ui
* Lucide icons
* MongoDB
* Mongoose
* Zod
* React Hook Form
* date-fns

## Payment verification service

* Python 3.9+
* Exact `iflexvault/fampay-verify` package/repository
* FastAPI
* Uvicorn
* Gmail IMAP

## Infrastructure

* MongoDB
* OpenWA
* Gmail/FamPay email
* Next.js deployment can be Vercel/Render/etc.
* Python verifier should run as a persistent service because IMAP/background verification may require a long-running process

Keep the architecture simple. Do not introduce Redis, Kafka, RabbitMQ, Kubernetes, microservice complexity, etc. unless genuinely necessary.

---

# Core concept

The application manages:

```text
People
   ↓
Bills
   ↓
Splits
   ↓
Payment Requests
   ↓
WhatsApp messages
   ↓
Payment
   ↓
Automatic verification OR Manual marking
```

Example:

Bill:

```text
Dinner
Total: ₹3,000
```

People:

```text
Rahul    ₹1,000
Aman     ₹800
Rohit    ₹1,200
```

Each person gets a payment link.

Example WhatsApp message:

```text
Hi Rahul,

You have a pending payment of ₹1,000 for Dinner.

Already paid: ₹0
Remaining: ₹1,000

Pay here:
https://your-domain.com/pay/secure-token

Once the payment is received, it will be automatically verified.

Thank you.
```

---

# Money handling

Never use floating point numbers for money.

Store all monetary values as **integer paise**.

Example:

```text
₹100.50 = 10050 paise
₹500 = 50000 paise
```

Create utilities:

```text
lib/money/
```

with functions for:

* rupees → paise
* paise → rupees
* formatting
* addition
* subtraction
* validation

All calculations must happen using integers.

---

# Authentication

This is a personal/private application.

Create a secure admin authentication system.

The dashboard must never be publicly accessible.

Protect:

```text
/dashboard
/bills
/people
/payments
/settings
/api/*
```

except intentionally public routes such as:

```text
/pay/[token]
```

Use secure HTTP-only cookies.

Never store authentication secrets in client-side JavaScript.

Use an `AUTH_SECRET` environment variable.

The application should support one personal admin account initially, but structure the code so additional users could be added later.

---

# Database models

Use MongoDB with Mongoose.

Create these models.

## User

```text
User
- _id
- name
- email
- passwordHash
- role
- createdAt
- updatedAt
```

Role:

```text
ADMIN
```

---

## Person

Represents someone I owe/request money from.

```text
Person
- _id
- name
- phone
- email
- notes
- isActive
- createdAt
- updatedAt
```

Phone numbers should be normalized.

Examples:

```text
9131211880
+919131211880
91 9131211880
+91 9131211880
```

should normalize to:

```text
+919131211880
```

Create:

```text
lib/phone.ts
```

---

# Bill

```text
Bill
- _id
- title
- description
- totalAmountPaise
- date
- status
- createdAt
- updatedAt
```

Statuses:

```text
OPEN
PARTIALLY_PAID
PAID
CANCELLED
```

---

# Split

Each bill can contain multiple people.

```text
Split
- _id
- billId
- personId
- originalAmountPaise
- status
- createdAt
- updatedAt
```

Statuses:

```text
PENDING
PARTIALLY_PAID
PAID
CANCELLED
```

The amount paid should be calculated from payment transactions rather than trusting a client-side value.

---

# PaymentRequest

Represents a payment link generated for a split.

```text
PaymentRequest
- _id
- splitId
- personId
- billId
- requestedAmountPaise
- secureTokenHash
- expiresAt
- status
- createdAt
- updatedAt
```

Statuses:

```text
ACTIVE
EXPIRED
COMPLETED
CANCELLED
```

Never store the raw public payment token if it can be avoided.

Generate a cryptographically secure random token.

Store its hash in MongoDB.

The raw token is only used in the URL sent to the person.

Example:

```text
/pay/7e8a4d....
```

---

# PaymentTransaction

Every payment must create a transaction.

```text
PaymentTransaction
- _id
- billId
- splitId
- personId
- paymentRequestId
- amountPaise
- method
- status
- utr
- transactionId
- senderName
- paymentTime
- verifiedAt
- verifiedBy
- note
- source
- rawVerificationReference
- createdAt
- updatedAt
```

Payment methods:

```text
FAMPAY
MANUAL
```

Sources:

```text
AUTO_VERIFIED
MANUAL
```

Statuses:

```text
PENDING
PROCESSING
VERIFIED
REJECTED
UNMATCHED
DUPLICATE
```

For manually marked payments:

```text
method = MANUAL
source = MANUAL
status = VERIFIED
verifiedBy = ADMIN
```

For automatic FamPay verification:

```text
method = FAMPAY
source = AUTO_VERIFIED
status = VERIFIED
verifiedBy = SYSTEM
```

This distinction must be clearly visible in the UI.

---

# WhatsAppMessage

Track every OpenWA message.

```text
WhatsAppMessage
- _id
- personId
- billId
- splitId
- paymentRequestId
- phone
- message
- status
- providerMessageId
- error
- sentAt
- createdAt
- updatedAt
```

Statuses:

```text
PENDING
SENT
FAILED
```

Never store OpenWA credentials here.

---

# AuditLog

Every important payment action should be logged.

```text
AuditLog
- _id
- action
- entityType
- entityId
- metadata
- actor
- createdAt
```

Examples:

```text
PAYMENT_VERIFIED
PAYMENT_MANUALLY_ADDED
PAYMENT_REJECTED
PAYMENT_LINK_CREATED
WHATSAPP_SENT
WHATSAPP_FAILED
BILL_CREATED
BILL_UPDATED
SPLIT_CREATED
```

Do not store passwords, API keys or other secrets in audit logs.

---

# Payment calculation rules

These rules must always be enforced server-side.

For a split:

```text
remaining =
originalAmount
-
sum(all verified payments)
```

Example:

```text
Split = ₹1,000

Payment 1 = ₹400
Payment 2 = ₹300

Paid = ₹700
Remaining = ₹300
```

The split is:

```text
PARTIALLY_PAID
```

After another ₹300:

```text
Paid = ₹1,000
Remaining = ₹0
```

The split becomes:

```text
PAID
```

The bill becomes `PAID` only when all required splits are fully paid.

---

# Partial payments

Support partial payments.

Example:

```text
Rahul
Total: ₹1,000
Paid: ₹600
Remaining: ₹400
```

The UI must show:

```text
Total      ₹1,000
Paid       ₹600
Remaining  ₹400
```

The user should be able to send another payment request for the remaining amount.

Never allow the total verified payment to exceed the split amount.

Reject:

```text
₹500 + ₹600
```

for a:

```text
₹1,000
```

split.

---

# Manual payment marking

This is required.

On every unpaid split show:

```text
[Send WhatsApp]
[Add Payment]
[Mark Paid]
```

Example:

```text
Rahul

Total       ₹1,000
Paid          ₹600
Remaining     ₹400

[Send WhatsApp] [Mark Paid]
```

When clicking `Mark Paid`, show:

```text
Mark Payment

Person:
Rahul

Remaining:
₹400

Payment amount:
₹400

Payment method:
Manual

Note:
________________________

[Cancel] [Confirm Payment]
```

The payment amount should default to the remaining amount.

Allow editing if needed, but never allow an amount greater than the remaining amount.

After confirmation:

Create:

```text
PaymentTransaction
```

with:

```text
amountPaise = entered amount
method = MANUAL
source = MANUAL
status = VERIFIED
verifiedBy = ADMIN
```

Then recalculate the split.

Add an audit log.

The payment history should clearly display:

```text
₹400
MANUALLY ADDED
```

rather than making it look like an automatically verified FamPay payment.

---

# FamPay automatic verification

Use exactly:

```text
https://github.com/iflexvault/fampay-verify
```

Do not implement a fake verifier.

The Python service should wrap the package behind an internal HTTP API.

Example:

```text
POST /verify
```

Request:

```json
{
  "amount": 40000,
  "utr": null,
  "transaction_id": null
}
```

The exact request/response structure can be adapted to the package API.

The Python service should use the package's actual verification functionality.

It must connect to Gmail using:

```text
FAMPAY_GMAIL
FAMPAY_GMAIL_APP_PASSWORD
```

Do not expose these values to Next.js client code.

---

# Gmail security

Use a Gmail **App Password**, not the user's normal Gmail password.

Environment variables:

```env
FAMPAY_GMAIL=
FAMPAY_GMAIL_APP_PASSWORD=
```

Never:

* hardcode credentials
* commit credentials
* return credentials through an API
* expose them in browser JavaScript
* log them
* put them in audit logs

Add `.env*` to `.gitignore`.

Provide:

```text
.env.example
```

with placeholders only.

---

# Verification API flow

When a payment needs verification:

```text
Next.js
   |
   | POST internal verification request
   v
Python verifier
   |
   v
fampay-verify
   |
   v
Gmail IMAP
   |
   v
FamPay payment email
```

The Python service returns normalized information such as:

```json
{
  "verified": true,
  "transaction_id": "...",
  "amount": 40000,
  "utr": "...",
  "sender_name": "...",
  "payment_time": "...",
  "message": "...",
  "details": {}
}
```

Adapt this to the exact package response.

Next.js must validate the response with Zod before using it.

---

# Verification matching

Never trust the client to tell the server that a payment happened.

The client can request verification.

Only the server can mark a payment as automatically verified.

Verification must check:

1. Expected amount
2. UTR/transaction ID when available
3. Payment time
4. Whether the transaction was already used
5. Whether the payment belongs to an active payment request
6. Whether the payment exceeds the remaining amount

---

# Duplicate UTR protection

A UTR/transaction ID must not be accepted twice.

Create a unique database index where appropriate.

If a UTR has already been used:

```text
status = DUPLICATE
```

and do not credit the split again.

This must be enforced server-side.

---

# Unmatched payments

Sometimes a FamPay payment may arrive but cannot be matched to a specific payment request.

Create an unmatched payments section:

```text
Payments
 ├── All
 ├── Verified
 ├── Manual
 └── Unmatched
```

Unmatched payments should show:

```text
Amount
UTR
Sender
Payment time
Detected at
Possible matching requests
```

Allow the admin to manually associate an unmatched payment with a split after reviewing it.

Every such action must create an audit log.

---

# Dynamic payment amounts

The `iflexvault/fampay-verify` repository supports dynamic amount verification.

Use this capability where appropriate to make payment matching reliable.

For example, if the actual amount due is:

```text
₹500
```

the system may generate a unique payment amount such as:

```text
₹500.37
```

if the user chooses dynamic amount verification.

However:

* Do not silently change the amount the person owes
* Clearly show the exact amount to pay
* Store both the original split amount and payment-request amount
* Never use an amount that exceeds the person's actual allowed amount
* Do not use dynamic decimal amounts if they create confusion for the user

Make this configurable in settings.

Default behavior should prioritize a simple user experience.

---

# Payment QR

The public payment page should display a UPI QR code.

Generate a UPI URI using:

```text
upi://pay
```

with:

```text
pa
pn
am
cu=INR
```

Configuration:

```env
UPI_ID=
UPI_NAME=
```

The page should show:

```text
[QR CODE]

₹500

[Open UPI App]
```

The QR/payment information must be generated server-side from trusted database values.

Never trust a client-supplied amount.

---

# Public payment page

Create:

```text
/pay/[token]
```

This page does NOT require login.

It should show:

```text
Dinner

Hi Rahul

Amount due
₹1,000

Already paid
₹600

Remaining
₹400

[QR CODE]

[Open UPI App]

Payment will be automatically verified after payment.
```

Do not expose:

* MongoDB IDs
* internal database IDs
* admin information
* API keys
* email credentials
* OpenWA credentials

The secure token must be the only public identifier required.

---

# Payment link security

Generate tokens using a cryptographically secure random generator.

Example concept:

```text
crypto.randomBytes(...)
```

Never use:

```text
billId
personId
timestamp
incrementing IDs
```

as the payment token.

Prefer storing:

```text
hash(token)
```

rather than the raw token.

Payment tokens should also have expiry support.

---

# WhatsApp integration

Create:

```text
lib/openwa/
```

with a clean server-side client.

For example:

```text
sendMessage()
checkSession()
```

The exact API implementation must follow the OpenWA server/API version being used.

Environment variables:

```env
OPENWA_BASE_URL=
OPENWA_API_KEY=
OPENWA_SESSION=
OPENWA_PHONE=
```

Never expose these variables to the browser.

---

# WhatsApp message

When clicking:

```text
Send WhatsApp
```

the server should:

1. Load person
2. Load split
3. Calculate remaining amount
4. Generate/reuse a valid payment request
5. Generate secure public URL
6. Build message
7. Call OpenWA API
8. Save WhatsAppMessage
9. Return success/failure

Example message:

```text
Hi Rahul,

You have a pending payment for Dinner.

Total: ₹1,000
Already paid: ₹600
Remaining: ₹400

Pay securely here:
https://example.com/pay/xxxxx

After payment, the payment will be automatically verified.

Thank you.
```

Use the application's configured base URL.

---

# Phone number normalization

Support Indian numbers.

Examples:

```text
9131211880
+91 9131211880
91-9131211880
```

Normalize to:

```text
+919131211880
```

Validate before sending.

Do not blindly append `91` if the number is already international.

---

# WhatsApp failure handling

If OpenWA fails:

```text
WhatsAppMessage.status = FAILED
```

Store a safe error message.

Do not store API credentials or sensitive request headers.

UI should show:

```text
WhatsApp failed

[Retry]
```

Retrying must not create duplicate payment requests unnecessarily.

---

# Dashboard

Create a clean minimal dashboard.

Show:

```text
Total Outstanding
₹12,450

Collected
₹8,500

Pending
₹3,950

Bills
8

People
14
```

Also show recent activity:

```text
Rahul paid ₹500
AUTO VERIFIED

Aman marked ₹800 as paid
MANUALLY ADDED

WhatsApp sent to Rohit
```

---

# Bills page

Route:

```text
/bills
```

Show:

```text
Bills

[+ New Bill]

Dinner
₹3,000
Paid ₹2,000
Remaining ₹1,000
PARTIALLY PAID
```

Filters:

```text
All
Open
Partially Paid
Paid
Cancelled
```

---

# Create bill

Route:

```text
/bills/new
```

Fields:

```text
Bill name
Description
Date
Total amount
```

Then add people and splits.

Support:

### Equal split

Example:

```text
Total = ₹3,000
3 people

₹1,000 each
```

### Manual split

Example:

```text
Rahul ₹500
Aman ₹800
Rohit ₹1,700
```

Validate that:

```text
sum(splits) <= bill total
```

Allow an unassigned remainder if needed.

---

# Bill details

Route:

```text
/bills/[id]
```

Show:

```text
Dinner
₹3,000

Paid ₹2,000
Remaining ₹1,000
```

Then split list:

```text
Person     Total     Paid     Remaining     Status

Rahul      ₹1,000    ₹1,000   ₹0            PAID
Aman       ₹800      ₹500     ₹300          PARTIALLY PAID
Rohit      ₹1,200    ₹500     ₹700          PARTIALLY PAID
```

Actions:

```text
Send WhatsApp
Mark Paid
Add Payment
View History
```

---

# People page

Route:

```text
/people
```

Show:

```text
Name
Phone
Total owed
Total paid
Outstanding
```

Allow:

```text
Add person
Edit person
Deactivate person
```

Do not delete people if they have historical payment records unless using a safe archive/deactivate flow.

---

# Payments page

Route:

```text
/payments
```

Show every payment.

Columns:

```text
Person
Bill
Amount
Method
Status
UTR
Date
```

Use clear badges:

```text
AUTO VERIFIED
MANUALLY ADDED
UNMATCHED
DUPLICATE
REJECTED
```

Automatic and manual payments must never look identical.

---

# Payment history

Every split should have a payment history.

Example:

```text
Rahul — Dinner

₹400
AUTO VERIFIED
UTR: 123456789012
17 Sep 2026, 10:20 AM

₹300
MANUALLY ADDED
Note: Cash payment
17 Sep 2026, 11:05 AM
```

---

# Settings

Create:

```text
/settings
```

Sections:

### UPI

```text
UPI ID
UPI Name
```

### FamPay/Gmail

Show configuration status only:

```text
Gmail verification
Connected
```

Never display the actual app password.

### OpenWA

Show:

```text
OpenWA
Connected / Disconnected
Session status
```

Never display API keys.

### Payment verification

Options:

```text
Automatic verification
Dynamic payment amounts
Verification timeout
```

---

# API routes

Create secure server-side APIs.

Suggested structure:

```text
/api/auth/*
/api/bills
/api/bills/[id]
/api/people
/api/people/[id]
/api/splits
/api/splits/[id]
/api/payments
/api/payments/verify
/api/payments/manual
/api/payments/unmatched
/api/payment-requests
/api/payment-requests/[id]
/api/whatsapp/send
/api/whatsapp/status
/api/settings
/api/health
```

Protect admin routes.

Public payment APIs should only expose information required by the secure payment token.

---

# Validation

Use Zod for all API input.

Validate:

* amounts
* IDs
* phone numbers
* email addresses
* dates
* payment amounts
* UTR
* payment tokens
* OpenWA responses
* Python verifier responses

Never trust frontend validation alone.

---

# Security requirements

This is a personal payment application, so security is important.

Implement:

* HTTP-only secure cookies
* SameSite cookies
* CSRF protection where applicable
* server-side authorization
* Zod validation
* rate limiting
* secure random tokens
* hashed payment tokens
* unique UTR protection
* idempotent payment verification
* no secrets in client code
* no secrets in Git
* safe error messages
* no sensitive logs
* security headers
* input sanitization
* database indexes
* proper MongoDB connection handling
* protection against duplicate requests
* protection against overpayment

Never trust:

```text
amount
status
personId
billId
payment status
```

from the browser.

Always load authoritative values from MongoDB.

---

# Idempotency

Payment verification must be idempotent.

If the same verification request is sent twice:

```text
POST /api/payments/verify
```

it must not create two payment transactions.

Use:

* UTR/transaction ID
* payment request ID
* idempotency key where appropriate

to prevent duplicate credits.

---

# Rate limiting

Add rate limits to:

```text
login
public payment page
payment verification
manual payment APIs
WhatsApp send API
```

The exact implementation can remain simple.

Do not add a large infrastructure dependency just for rate limiting.

---

# Error handling

Never expose stack traces.

Bad:

```text
MongoServerError: E11000 duplicate key...
```

Good:

```text
This payment has already been processed.
```

Use consistent API responses:

```json
{
  "success": false,
  "error": "Payment already processed"
}
```

and:

```json
{
  "success": true,
  "data": {}
}
```

---

# Environment variables

Create `.env.example`.

Use:

```env
MONGODB_URI=

AUTH_SECRET=

APP_URL=

UPI_ID=
UPI_NAME=

FAMPAY_GMAIL=
FAMPAY_GMAIL_APP_PASSWORD=

OPENWA_BASE_URL=
OPENWA_API_KEY=
OPENWA_SESSION=
OPENWA_PHONE=

PAYMENT_VERIFIER_URL=
PAYMENT_VERIFIER_SECRET=
```

The Python service should have its own environment configuration.

Never commit `.env.local`.

---

# Python verifier service

Create a separate folder:

```text
payment-verifier/
```

Structure:

```text
payment-verifier/
├── app/
│   ├── main.py
│   ├── verifier.py
│   ├── schemas.py
│   └── config.py
├── requirements.txt
├── .env.example
└── README.md
```

Install/use:

```text
fampay-verify
fastapi
uvicorn
pydantic
```

Use the exact repository/package:

```text
iflexvault/fampay-verify
```

Do not copy the entire repository into the Next.js application.

Wrap its API in a clean FastAPI endpoint.

Example:

```text
POST /verify
```

Secure this endpoint with:

```text
PAYMENT_VERIFIER_SECRET
```

so arbitrary external users cannot invoke the verifier.

---

# Python service health endpoint

Create:

```text
GET /health
```

Response:

```json
{
  "status": "ok"
}
```

Do not expose Gmail credentials or other secrets.

---

# Verification timeout

The Next.js server should not hang indefinitely waiting for Gmail.

Use a reasonable timeout.

If verification takes too long:

```text
PROCESSING
```

rather than incorrectly marking the payment as rejected.

Allow the user/admin to retry.

---

# Automatic verification UI

When a person opens a payment page, they should not be able to directly claim payment.

After payment, provide:

```text
I've Paid
```

This starts server-side verification.

Show:

```text
Checking payment...

Please wait.
```

If found:

```text
Payment verified

₹500 received

UTR: ********9012
```

If not found:

```text
Payment not detected yet.

If you have already paid, try again later.
```

Do not claim that a payment succeeded unless the backend verifier confirms it.

---

# Admin payment verification

Admin should be able to enter a UTR manually.

Example:

```text
Verify Payment

Amount
₹500

UTR
______________

[Verify]
```

The server sends this to the Python verifier/package.

If verified:

```text
AUTO VERIFIED
```

If not:

```text
Payment could not be verified.
```

Do not allow the admin frontend to simply set:

```text
status = VERIFIED
```

through a normal automatic verification endpoint.

Use the dedicated manual-payment endpoint for genuinely manual payments.

---

# Manual vs automatic distinction

This is extremely important.

Automatic:

```text
AUTO VERIFIED
```

means:

```text
FamPay/Gmail verification confirmed it.
```

Manual:

```text
MANUALLY ADDED
```

means:

```text
Admin manually recorded the payment.
```

Never represent a manual payment as automatic.

---

# UI design

Keep the UI minimalist.

Use:

* clean cards
* tables
* badges
* dialogs
* forms
* responsive layout
* dark mode
* mobile-friendly public payment page

Avoid unnecessary animations.

Do not overdesign.

The application should feel like a clean personal finance/admin dashboard.

Use shadcn/ui components.

---

# Navigation

Desktop sidebar:

```text
Dashboard
Bills
People
Payments
Unmatched
Settings
```

Mobile should use a suitable mobile navigation.

---

# Status badge colors

Use semantic UI states.

Examples:

```text
PAID
PARTIALLY PAID
PENDING
FAILED
AUTO VERIFIED
MANUALLY ADDED
UNMATCHED
DUPLICATE
```

Do not rely on color alone.

---

# Loading states

Every async operation must have loading states.

Examples:

```text
Sending...
Verifying...
Saving...
```

Disable duplicate submissions while processing.

---

# Empty states

Provide useful empty states.

Example:

```text
No bills yet.

Create your first bill to start collecting payments.

[Create Bill]
```

---

# Toast notifications

Use toast notifications for actions:

```text
Bill created
Payment added
Payment verified
WhatsApp message sent
WhatsApp failed
```

Do not use alerts for normal application actions.

---

# Database indexes

Add appropriate indexes for:

```text
User.email
Person.phone
Bill.status
Split.billId
Split.personId
PaymentTransaction.utr
PaymentTransaction.transactionId
PaymentTransaction.splitId
PaymentTransaction.billId
PaymentRequest.secureTokenHash
PaymentRequest.expiresAt
WhatsAppMessage.status
```

UTR uniqueness must be handled carefully so null/empty UTR values do not create conflicts.

---

# MongoDB consistency

Payment creation and split/bill status updates should be handled safely.

Do not rely on frontend state.

After every payment:

1. Load split
2. Calculate verified payments
3. Calculate remaining
4. Update split status
5. Recalculate affected bill
6. Update bill status
7. Write audit log

Prefer MongoDB transactions where the deployment supports them.

---

# Testing

Add tests for important business logic.

Test:

### Money

```text
₹100 -> 10000 paise
₹100.50 -> 10050 paise
```

### Split

```text
1000 - 400 = 600
1000 - 400 - 600 = 0
```

### Overpayment

```text
1000 split
1100 payment
=> reject
```

### Duplicate UTR

```text
same UTR twice
=> only one credited transaction
```

### Manual payment

```text
manual payment
=> MANUALLY ADDED
```

### Automatic payment

```text
FamPay verification
=> AUTO VERIFIED
```

### Payment token

```text
random token
=> valid
invalid token
=> 404/invalid payment link
```

### Expired payment request

```text
expired token
=> payment unavailable
```

### Bill status

Test:

```text
OPEN
PARTIALLY_PAID
PAID
```

---

# Seed data

Create a development seed script.

Use example data only.

Example:

```text
Person:
Rahul
+919999999999

Bill:
Dinner
₹1,000

Split:
Rahul
₹1,000
```

Do not put real credentials in seed data.

---

# README

Create a complete README explaining:

1. Project architecture
2. Local setup
3. MongoDB setup
4. Next.js setup
5. Python verifier setup
6. `fampay-verify` setup
7. Gmail App Password setup
8. OpenWA setup
9. Environment variables
10. Running locally
11. Production deployment
12. Security considerations
13. Payment verification flow
14. Manual payment flow

Include commands.

Example:

```bash
npm install
npm run dev
```

and for Python:

```bash
cd payment-verifier
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

Adapt commands for Windows if necessary.

---

# Recommended project structure

Use:

```text
project/
│
├── src/
│   ├── app/
│   │   ├── (auth)/
│   │   ├── dashboard/
│   │   ├── bills/
│   │   │   ├── page.tsx
│   │   │   ├── new/
│   │   │   └── [id]/
│   │   ├── people/
│   │   ├── payments/
│   │   ├── settings/
│   │   ├── pay/
│   │   │   └── [token]/
│   │   └── api/
│   │
│   ├── components/
│   │   ├── ui/
│   │   ├── dashboard/
│   │   ├── bills/
│   │   ├── people/
│   │   ├── payments/
│   │   └── whatsapp/
│   │
│   ├── lib/
│   │   ├── db/
│   │   ├── auth/
│   │   ├── money/
│   │   ├── openwa/
│   │   ├── payment-verification/
│   │   ├── security/
│   │   ├── validation/
│   │   └── phone.ts
│   │
│   ├── models/
│   │   ├── User.ts
│   │   ├── Person.ts
│   │   ├── Bill.ts
│   │   ├── Split.ts
│   │   ├── PaymentRequest.ts
│   │   ├── PaymentTransaction.ts
│   │   ├── WhatsAppMessage.ts
│   │   └── AuditLog.ts
│   │
│   ├── types/
│   └── middleware.ts
│
├── payment-verifier/
│   ├── app/
│   │   ├── main.py
│   │   ├── verifier.py
│   │   ├── schemas.py
│   │   └── config.py
│   ├── requirements.txt
│   └── .env.example
│
├── scripts/
│   └── seed.ts
│
├── public/
├── .env.example
├── .gitignore
├── package.json
└── README.md
```

---

# API security architecture

Use this pattern:

```text
Browser
   |
   v
Next.js API
   |
   +---- MongoDB
   |
   +---- OpenWA
   |
   +---- Python verifier
```

Never:

```text
Browser
   |
   +---- OpenWA
   |
   +---- Gmail
```

All external integrations must go through the server.

---

# Important credentials

Do not hardcode any credentials.

Use environment variables.

For example:

```env
OPENWA_API_KEY=...
FAMPAY_GMAIL_APP_PASSWORD=...
AUTH_SECRET=...
MONGODB_URI=...
```

Never put them in:

```text
React components
client-side JavaScript
Git
README
screenshots
logs
database documents
```

---

# Important implementation rules

1. Use the exact `iflexvault/fampay-verify` repository.
2. Remember that it is Python.
3. Use a separate Python verifier service.
4. Use OpenWA directly for WhatsApp sending.
5. Never expose OpenWA credentials to the client.
6. Never expose Gmail/FamPay credentials to the client.
7. Use MongoDB.
8. Store money as integer paise.
9. Support partial payments.
10. Support manual payment marking.
11. Clearly distinguish manual and automatic payments.
12. Never trust client-side payment status.
13. Never allow overpayment.
14. Prevent duplicate UTR processing.
15. Use secure random payment tokens.
16. Hash payment tokens in MongoDB.
17. Use server-side authorization.
18. Use Zod validation.
19. Add audit logs.
20. Add rate limiting.
21. Add proper error handling.
22. Add loading and empty states.
23. Keep the UI minimal.
24. Make the public payment page mobile-friendly.
25. Keep secrets in environment variables.
26. Provide `.env.example`.
27. Provide complete README.
28. Add tests for payment/business logic.
29. Do not fake payment verification.
30. Do not mark a payment as automatically verified unless `fampay-verify` actually confirms it.

---

# Development approach

Build this incrementally.

### Phase 1

Set up:

```text
Next.js
TypeScript
Tailwind
shadcn/ui
MongoDB
authentication
```

### Phase 2

Implement:

```text
People
Bills
Splits
```

### Phase 3

Implement:

```text
PaymentRequest
secure payment tokens
public payment page
UPI QR
```

### Phase 4

Implement:

```text
Manual payments
PaymentTransaction
payment history
audit logs
```

### Phase 5

Implement:

```text
OpenWA integration
WhatsApp message sending
message history
retry handling
```

### Phase 6

Implement the Python service:

```text
FastAPI
fampay-verify
Gmail IMAP
verification endpoint
```

### Phase 7

Connect:

```text
Next.js → Python verifier → FamPay email
```

### Phase 8

Add:

```text
Unmatched payments
duplicate protection
rate limiting
security headers
error handling
```

### Phase 9

Add tests and README.

### Phase 10

Review the entire project for:

```text
security
duplicate payments
overpayments
authentication
secret exposure
database consistency
mobile UI
error handling
```

---

# Final acceptance criteria

The application is considered complete only when this complete flow works:

```text
1. Admin logs in
        ↓
2. Creates a bill
        ↓
3. Adds Rahul
        ↓
4. Assigns Rahul ₹1,000
        ↓
5. Creates secure payment request
        ↓
6. Sends payment link through OpenWA
        ↓
7. Rahul opens /pay/[token]
        ↓
8. Rahul sees ₹1,000 and UPI QR
        ↓
9. Rahul makes payment
        ↓
10. Rahul/admin triggers verification
        ↓
11. Next.js calls Python verifier
        ↓
12. Python uses iflexvault/fampay-verify
        ↓
13. FamPay email is checked
        ↓
14. Payment is confirmed
        ↓
15. PaymentTransaction is created
        ↓
16. Payment is labeled AUTO VERIFIED
        ↓
17. Rahul's split becomes PAID
        ↓
18. Bill status is recalculated
        ↓
19. Audit log is created
```

And this flow must also work:

```text
1. Rahul owes ₹1,000
        ↓
2. Rahul pays ₹600
        ↓
3. ₹600 is automatically verified
        ↓
4. Remaining = ₹400
        ↓
5. Admin clicks Mark Paid
        ↓
6. Admin enters ₹400
        ↓
7. Manual transaction created
        ↓
8. Payment labeled MANUALLY ADDED
        ↓
9. Remaining = ₹0
        ↓
10. Split = PAID
```

The final implementation should be secure, simple, maintainable and actually functional rather than being a UI-only prototype.
