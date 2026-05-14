# ProITBridge — Full Codebase Analysis

> **Generated:** 2026-05-14  
> **Project:** `remix-of-landing-page`  
> **Tech Stack:** React 18 + TypeScript · Vite · Tailwind CSS · shadcn/ui

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Directory Structure](#2-directory-structure)
3. [Routing & Pages](#3-routing--pages)
4. [Component Inventory](#4-component-inventory)
5. [External Services & API Endpoints](#5-external-services--api-endpoints)
6. [Google Sheets / Excel Integration](#6-google-sheets--excel-integration)
7. [User Validation & Access Control](#7-user-validation--access-control)
8. [Payment Flows](#8-payment-flows)
9. [Invoice System](#9-invoice-system)
10. [Meta Pixel / Analytics Tracking](#10-meta-pixel--analytics-tracking)
11. [Video Integration](#11-video-integration)
12. [Context Providers & State Management](#12-context-providers--state-management)
13. [Environment Variables & Secrets](#13-environment-variables--secrets)
14. [Build Configuration](#14-build-configuration)
15. [Known Issues & Observations](#15-known-issues--observations)

---

## 1. Project Overview

This is the **ProITBridge Induction & Enrollment web application** — a marketing and conversion funnel built in React/TypeScript. It serves two primary commercial purposes:

- **Induction Session** (₹89): A gated video session. Users pay ₹89 via Razorpay, then get access to a Vimeo-hosted induction video. Access is validated against a Google Sheet.
- **Course Enrollment** (₹1,000): A full enrollment form where users select a program, fill personal/address details, pay ₹1,000, and receive a GST Tax Invoice PDF auto-downloaded on success.

There is no traditional backend server. All backend logic runs through Google Apps Script (GAS) deployments that read/write Google Sheets, acting as a serverless database.

---

## 2. Directory Structure

```
remix-of-landing-page/
├── .env                          # Environment variables (n8n webhook URL)
├── index.html                    # Entry HTML — Meta Pixel + Razorpay script loaded here
├── package.json
├── vite.config.ts
├── tailwind.config.ts
├── tsconfig.json / tsconfig.app.json / tsconfig.node.json
├── public/
│   ├── favicon.ico
│   ├── robots.txt
│   └── placeholder.svg
└── src/
    ├── main.tsx                  # ReactDOM root mount
    ├── App.tsx                   # Router + Providers
    ├── index.css                 # Global CSS / Tailwind
    ├── vite-env.d.ts
    ├── assets/                   # Images & MP4 videos
    │   ├── proitbridge-logo.jpg / proitbridge-logo-new.png
    │   ├── alumni-video-1.mp4 … alumni-video-6.mp4
    │   ├── landing-page-video.mp4
    │   ├── success-proof-1.png … success-proof-5.png
    │   └── testimonial-*.png (5 images)
    ├── components/
    │   ├── AlertBanner.tsx
    │   ├── AlumniPodcasts.tsx
    │   ├── Contact.tsx
    │   ├── Footer.tsx
    │   ├── Header.tsx
    │   ├── Hero.tsx
    │   ├── LeadCaptureModal.tsx
    │   ├── NavLink.tsx
    │   ├── PaymentModal.tsx
    │   ├── ScrollToTop.tsx
    │   ├── StickyBottomBar.tsx
    │   ├── StudentSuccess.tsx
    │   ├── Testimonials.tsx
    │   ├── TrustBadge.tsx
    │   ├── VideoSection.tsx
    │   └── ui/                   # shadcn/ui components (accordion, dialog, input, etc.)
    ├── context/
    │   ├── PaymentContext.tsx     # Modal open/close state + fbq CTA tracking
    │   └── RazorpayContext.tsx    # Razorpay script loading, warm-up, pre-warm
    ├── hooks/
    │   ├── use-mobile.tsx
    │   ├── use-toast.ts
    │   ├── useRazorpay.ts         # Core Razorpay payment execution hook
    │   └── useYouTubeIframePlayer.ts
    ├── lib/
    │   ├── google-sheets-api.ts   # GAS calls for access control (induction)
    │   ├── invoice-email-sender.ts # n8n webhook invoice dispatch
    │   ├── invoice-generator.ts   # jsPDF GST invoice builder
    │   └── utils.ts               # Tailwind class merge helper
    └── pages/
        ├── Index.tsx              # Landing page (/)
        ├── Induction.tsx          # Gated induction video (/induction)
        ├── Enrollment.tsx         # Course enrollment form (/enrollment)
        ├── EnrollmentConfirmation.tsx  # Post-enrollment confirmation
        ├── ThankYou.tsx           # Legacy thank-you page
        ├── ContactPage.tsx
        ├── Terms.tsx
        ├── Privacy.tsx
        ├── Refund.tsx
        └── NotFound.tsx
```

---

## 3. Routing & Pages

Defined in `App.tsx` using React Router v6 (`BrowserRouter`).

| Route | Component | Purpose |
|---|---|---|
| `/` | `Index` | Landing page — hero, video, testimonials, success proofs, alumni videos |
| `/induction` | `Induction` | Access-gated induction video page (requires payment or valid session) |
| `/enrollment` | `Enrollment` | Full course enrollment form with Razorpay payment |
| `/enrollment-confirmation` | `EnrollmentConfirmation` | Post-enrollment confirmation + auto-invoice download |
| `/thank-you` | `ThankYou` | Legacy thank-you page after booking (references WhatsApp) |
| `/terms` | `Terms` | Terms & Conditions |
| `/privacy` | `Privacy` | Privacy Policy |
| `/refund` | `Refund` | Cancellation & Refund Policy |
| `/contact` | `ContactPage` | Contact page |
| `*` | `NotFound` | 404 fallback |

### Provider Wrapping Order (App.tsx)

```
QueryClientProvider
  └── TooltipProvider
        └── BrowserRouter
              └── RazorpayProvider        ← Loads & warms Razorpay script
                    └── PaymentProvider   ← Modal state + fbq CTA event
                          └── Routes
```

---

## 4. Component Inventory

### Layout / Navigation Components

**`AlertBanner`** — Sticky top bar (`z-50`, `bg-navy`) showing "Working Professionals only!" with a pulsing animation. Present on both landing page and induction page.

**`Header`** — Centered ProITBridge logo only. No navigation links. Uses `proitbridge-logo-new.png`.

**`Footer`** — Links to Terms, Privacy, Refund, Contact. Shows copyright year (dynamic) and `info@proitbridge.com` email.

**`StickyBottomBar`** — Fixed bottom bar with "Get our INDUCTION Session now at ₹89" CTA button. Calls `openPaymentModal()` from `PaymentContext`.

**`ScrollToTop`** — Utility component that scrolls to top on route change.

**`NavLink`** — Generic styled navigation link component.

### Landing Page Sections (`/`)

**`Hero`** — Top headline: "Looking For AI Career Transformation in 2026?" + "Are you Working Professional?" sub-heading.

**`VideoSection`** — Two-column layout. Left: Vimeo iframe (Video ID `1156368541`, autoplay+muted on normal browsers, no autoplay on Meta in-app browsers). Right: "Prerequisites" bullet list + CTA card showing crossed-out ₹299, "Get Now ₹89" button.

**`StudentSuccess`** — Grid of 5 success proof images (`success-proof-1.png` to `success-proof-5.png`) with placement descriptions (EY, NIT Agartala 3 LPA, 7 LPA, 20 LPA Full Stack, 31 LPA AI transition).

**`TrustBadge`** — Reusable CTA box. Used 3 times on the landing page with different motivational headline text. Shows crossed-out ₹299 price and "Get Now ₹89" button.

**`AlumniPodcasts`** — Grid of 6 local MP4 videos (`alumni-video-1.mp4` to `alumni-video-6.mp4`) on a navy background. Handles mutual exclusion: playing one video pauses all others. No download, no playback rate, no PiP controls.

**`Testimonials`** — 5 student testimonials with photos, 5-star ratings. Students: Neha Urade (Collabera), Subhendu (BA), Ashok Behara (Data Scientist), Anagha (Engineer), Viddyasagar (Bosch).

**`Contact`** — Simple section with `info@proitbridge.com` mailto link.

### Modal Components

**`PaymentModal`** — 4-step Dialog for the ₹89 Induction payment:
- **Step `selection`**: Choose "New User — Pay ₹89" or "Already Paid? Login"
- **Step `details`**: Enter Full Name + 10-digit Mobile Number
- **Step `login`**: Enter registered mobile → calls `checkAccess()` GAS API
- **Step `payment`**: Shows user info summary + "Pay ₹89 Securely" button → calls `useRazorpay` hook

**`LeadCaptureModal`** — Legacy/alternative modal. When opened, immediately triggers Razorpay payment (₹89). After payment success, shows a form for name, email, phone. Submits to a separate GAS endpoint. Shows thank-you confirmation. This appears to be an older flow, not currently wired into the main landing page CTAs.

---

## 5. External Services & API Endpoints

### Razorpay (Payment Gateway)

| Property | Value |
|---|---|
| API Key | `rzp_live_SJWXxm7bY9dMx0` (live key, hardcoded) |
| Induction amount | `8900` paise = **₹89** |
| Enrollment amount | `100000` paise = **₹1,000** |
| Currency | `INR` |
| Theme color | `#0B1F3A` (dark navy) |
| Script URL | `https://checkout.razorpay.com/v1/checkout.js` |
| Loading strategy | Synchronously in `<head>` of `index.html` (not async) + DNS prefetch for `checkout.razorpay.com`, `api.razorpay.com`, `lumberjack.razorpay.com` |

### Google Apps Script (GAS) — Acts as serverless backend to Google Sheets

Three separate GAS deployments are used:

| # | Constant / Location | Deployment URL (partial) | Purpose |
|---|---|---|---|
| 1 | `ENDPOINT` in `google-sheets-api.ts` | `...AKfycbww2bQmz4aIdT...` | Access control for Induction (PENDING/SUCCESS) |
| 2 | `GSHEET_URL` in `Enrollment.tsx` | `...AKfycbwcknOQvRIP8u...` | Course enrollment form data + returns Enrollment ID |
| 3 | `GSHEET_URL` in `LeadCaptureModal.tsx` | `...AKfycbzRN7nyvSnKSa...` | Legacy lead capture after ₹89 payment |

### Vimeo (Video Hosting)

| Video | Vimeo ID | Used In |
|---|---|---|
| Landing page promo video | `1156368541` | `VideoSection.tsx` |
| Induction session video | `1156371689` | `Induction.tsx` |

Both use: `badge=0&autopause=0&player_id=0&app_id=58479&loop=1&playsinline=1`

### n8n Webhook (Invoice Email Delivery)

| Property | Value |
|---|---|
| URL | `https://n8n.srv1238772.hstgr.cloud/webhook/payment-invoice` |
| Env variable | `VITE_N8N_WEBHOOK_URL` |
| Trigger | After successful enrollment confirmation |
| Recipient | `ar@proitbridge.com` |
| Payload | Invoice PDF (base64) + customer metadata |

### Meta Pixel (Facebook Ads Tracking)

| Property | Value |
|---|---|
| Pixel ID | `33637779472487574` |
| Script | Loaded inline in `index.html` `<head>` |
| noscript fallback | Yes (1x1 tracking pixel) |

---

## 6. Google Sheets / Excel Integration

There is **no traditional database**. All data storage uses Google Apps Script as a REST-like API layer on top of Google Sheets.

### Sheet 1 — Induction Access Control (`google-sheets-api.ts`)

**GAS Endpoint:** `https://script.google.com/macros/s/AKfycbww2bQmz4aIdTTV4gB_F1eeX2MX8j9gyK77lIn5OlAeKyA2IK9kF5NbCiCAt7ApZ0oS/exec`

Routed via `?action=` query parameter.

| Action | Method | Parameters | Purpose |
|---|---|---|---|
| `register` | GET (`no-cors`) | `fullName`, `mobile`, `status=PENDING`, `paymentId=""` | Write new row before payment |
| `updatePayment` | GET (`no-cors`) | `fullName`, `mobile`, `status=SUCCESS`, `paymentId` | Update row to SUCCESS after Razorpay payment |
| `checkAccess` | GET (normal) | `mobile` | Check if mobile has SUCCESS status — returns JSON `{hasAccess: bool, userName, paymentId}` |

**Note:** `register` and `updatePayment` use `mode: "no-cors"` (fire-and-forget, no response parsed). `checkAccess` uses a normal fetch and parses JSON.

**Expected Sheet Columns:** fullName, mobile, status, paymentId (inferred from API parameters)

### Sheet 2 — Course Enrollment (`Enrollment.tsx`)

**GAS Endpoint:** `https://script.google.com/macros/s/AKfycbwcknOQvRIP8uXmYGLk-a8f1OHPRRO94UmnuwbBnA5Nte1BgOMOJ_MpafqMkj3AQmIxhg/exec`

- **Method:** `POST`
- **Content-Type:** `text/plain` (JSON body sent as text — required to avoid CORS preflight)
- **Response:** JSON `{ status: "success"|"error", message: string, enrollmentId?: string }`

**Payload fields sent to GAS:**

| Field | Source |
|---|---|
| `fullName` | Form input |
| `email` | Form input |
| `mobile` | Form input |
| `countryResidence` | Dropdown (India / Other) |
| `address` | Concatenation of addressLine1, addressLine2, city, state, pincode, country |
| `program` | Radio selection (one of 4 programs) |
| `courseType` | Dropdown (Advance / Premium) |
| `paymentMethod` | `"CARD"` or `"UPI"` |
| `paymentId` | Razorpay payment ID (e.g. `pay_XXXXXXXXXX`) |

**Critical:** The `enrollmentId` MUST be returned by the GAS backend. If absent from the response, the enrollment is treated as failed and an error message directs the user to `info@proitbridge.com`.

**Available Programs:**
- Advanced Data Analyst Program
- Advanced Data Science & AI Program
- Agentic AI & Gen AI Program
- Combo Program

**Course Types:** Advance · Premium

### Sheet 3 — Legacy Lead Capture (`LeadCaptureModal.tsx`)

**GAS Endpoint:** `https://script.google.com/macros/s/AKfycbzRN7nyvSnKSapZjzMSZoAVM1dtkQGX_UCsgmV3GZETAcp3VXGEYrpHfC8kmMl8H0PY_w/exec`

- **Method:** GET with query parameters
- **Mode:** `no-cors` (fire-and-forget)

**Payload fields:**

| Field | Value |
|---|---|
| `name` | User's full name |
| `email` | User's email |
| `phone` | User's phone |
| `paymentId` | Razorpay payment ID |
| `paymentStatus` | `"SUCCESS"` |

---

## 7. User Validation & Access Control

### Authentication Model

There is **no password-based auth**. The system uses **mobile number as identifier** with payment status as the access gate.

### Session Storage (localStorage)

| Key | Value | Set By |
|---|---|---|
| `pib_auth_mobile` | User's 10-digit mobile number | `saveAuthSession()` in `google-sheets-api.ts` |
| `pib_auth_name` | User's full name | `saveAuthSession()` |

Session is set on successful payment or successful login check. Session is cleared (`clearAuthSession()`) if `checkAccess` returns `hasAccess: false`.

### Induction Page Access Check Flow (`Induction.tsx`)

```
Page Load
    │
    ├─ location.state.paymentVerified === true?
    │       └─ YES → Grant access immediately (just paid, skip API call)
    │
    └─ NO → getAuthSession() from localStorage
                │
                ├─ Session missing → navigate("/", replace)
                │
                └─ Session exists → checkAccess(mobile) → GAS API
                            │
                            ├─ hasAccess: true  → setAccessVerified(true), render page
                            │
                            └─ hasAccess: false → clearAuthSession() → navigate("/", replace)
```

### Form Validation Rules

#### PaymentModal (Induction ₹89)

| Field | Rule |
|---|---|
| Full Name | Required, minimum 2 characters |
| Mobile Number | Must match `/^[6-9]\d{9}$/` (Indian mobile format, starts with 6-9, exactly 10 digits) |

#### Enrollment Form (Course ₹1,000)

| Field | Rule |
|---|---|
| Full Name | Required, minimum 3 characters |
| Email | Must contain `@` and `.` |
| Mobile | Must match `/^\d{10}$/` (10 digits) |
| Address Line 1 | Required, non-empty |
| City | Required, non-empty |
| State | Required (dropdown for India, free text for Other) |
| Pincode | Required, must match `/^\d{5,6}$/` |
| Program | Required, one of 4 radio options |
| Course Type | Required, Advance or Premium |

#### LeadCaptureModal (Legacy)

| Field | Rule |
|---|---|
| Name | Minimum 3 characters |
| Email | Must contain `@` and `.` |
| Phone | Exactly 10 digits (`/^\d{10}$/`) |

### UPI Fallback (Pending Payment Detection)

When a UPI payment is initiated, the system stores a pending state in `sessionStorage` (via `RazorpayContext`):

| sessionStorage Key | Value |
|---|---|
| `razorpay_payment_pending` | `"true"` |
| `razorpay_payment_mobile` | User's mobile |
| `razorpay_payment_name` | User's name |
| `razorpay_payment_timestamp` | Unix timestamp (ms) |

Pending state expires after **10 minutes**. The `visibilitychange` and `focus` events are monitored to detect when a user returns from a UPI app. However, the actual resolution still relies on the Razorpay `handler` callback — the pending state is informational.

---

## 8. Payment Flows

### Flow A — Induction Session (₹89)

```
User clicks any CTA on landing page (StickyBottomBar / VideoSection / TrustBadge)
    │
    └─ openPaymentModal() [PaymentContext]
           ├─ fires fbq('trackCustom', 'InductionCTAClicked')
           └─ opens PaymentModal

PaymentModal — Step: "selection"
    ├─ "New User — Pay ₹89" → Step: "details"
    └─ "Already Paid? Login" → Step: "login"

[New User Path]
Step "details" — Enter Name + Mobile → validate → proceed
    └─ preWarmWithDetails(mobile, name) [RazorpayContext]
       fires fbq('track', 'InitiateCheckout', {value:89, currency:'INR'})
    └─ Step: "payment"

Step "payment" — Click "Pay ₹89 Securely"
    └─ useRazorpay.startPayment(mobile, name)
           ├─ sets sessionStorage pending state
           ├─ creates Razorpay instance (key: rzp_live_..., amount: 8900)
           └─ rzp.open() → Razorpay checkout

[Razorpay handler called on success]
    ├─ updatePaymentSuccess(name, mobile, paymentId) → GAS (no-cors, fire-forget)
    ├─ saveAuthSession(mobile, name) → localStorage
    ├─ fbq('track', 'Purchase', {value:89, currency:'INR'})
    ├─ fbq('trackCustom', 'InductionPaymentSuccess', {...})
    ├─ onClose() — closes modal
    └─ navigate("/induction", {state: {paymentId, paymentVerified:true, userName}})

[Existing User Login Path]
Step "login" — Enter mobile
    └─ checkAccess(mobile) → GAS API
           ├─ hasAccess: true  → saveAuthSession → navigate("/induction")
           └─ hasAccess: false → show error "No successful payment found"
```

### Flow B — Course Enrollment (₹1,000)

```
User on /induction page → clicks "Enroll Now" → navigate("/enrollment")

/enrollment page — User fills 4-section form:
    1. Personal Information (name, email, mobile)
    2. Address Information (country, address, city, state, pincode)
    3. Course Information (program radio, course type dropdown)
    4. Payment Information (UPI or Card radio)

User clicks "Enroll Now" button
    └─ validateForm() — client-side validation
           ├─ errors found → toast "Please fill all required fields", highlight fields
           └─ valid → handleRazorpayPayment()

handleRazorpayPayment()
    └─ openRazorpayCheckout()
           ├─ key: rzp_live_SJWXxm7bY9dMx0
           ├─ amount: 100000 (₹1,000)
           ├─ prefill: {name, email, contact}
           └─ rzp.open() → Razorpay checkout

[Payment success handler]
    └─ submitEnrollment(razorpay_payment_id)
           └─ POST to GAS (Content-Type: text/plain, JSON body)
                  ├─ response status: "success" + enrollmentId present
                  │       ├─ fbq('track', 'Purchase', {value:1000, currency:'INR'})
                  │       ├─ fbq('trackCustom', 'EnrollmentPaymentSuccess', {...})
                  │       ├─ toast "Enrollment Successful!"
                  │       └─ navigate("/enrollment-confirmation", {state: all enrollment data})
                  │
                  ├─ response status: "success" but NO enrollmentId
                  │       └─ error: "Enrollment ID not returned, contact info@proitbridge.com"
                  │
                  └─ response status: "error" or network failure
                          └─ paymentError shown with Razorpay payment ID for support

[payment.failed event]
    └─ setPaymentError("Payment failed: {description}. Please try again.")
```

### Flow C — Legacy Lead Capture (LeadCaptureModal — not currently active on main CTAs)

```
Modal opens → immediately calls startPayment() → Razorpay opens (₹89)
    └─ handler: setPaymentId + setShowDetailsModal(true) + fbq('trackCustom', 'PaymentSuccess')

User fills name + email + phone
    └─ submitDetails() → GET to GAS (no-cors)
           └─ setShowThankYou(true) → "Thank you! Your booking is confirmed."
```

---

## 9. Invoice System

Triggered after successful course enrollment (₹1,000). All invoice logic is **client-side only**.

### Generation (`invoice-generator.ts`)

- **Library:** `jsPDF v4`
- **Format:** A4 PDF — "TAX INVOICE"
- **Invoice Number = Enrollment ID** (same value, from GAS response)

**Business Details (hardcoded):**

| Field | Value |
|---|---|
| Company | PROITBRIDGE (OPC) Private Limited |
| GSTIN | `29AANCP0566G1Z3` |
| Address | 304 AECS L/O B Block, Singasandra, Bangalore, Karnataka 560068 |
| Email | Info@proitbridge.com |
| Phone | +91-97402 30130 |
| SAC Code | `999294` |

**GST Calculation Logic:**

```
Total Amount = ₹1,000.00 (fixed)
Taxable Value = 1000 / 1.18 = ~₹847.46 (reverse calculated from 18% GST)
Total Tax = 1000 - 847.46 = ~₹152.54

If customer.state == "karnataka" (case-insensitive):
    CGST (9%) = totalTax / 2
    SGST (9%) = totalTax / 2
    IGST = 0

Otherwise (interstate):
    CGST = 0
    SGST = 0
    IGST (18%) = totalTax
```

**Invoice PDF Layout:**
1. "TAX INVOICE" title (centred, bold)
2. Company header (left) + Invoice # / Date / Place of Supply (right)
3. "Client / Customer / Student" section with full customer details
4. Service description table (program name, SAC code, amount)
5. Payment breakdown (TOTAL-A, DISCOUNT-B, TAXABLE VALUE-C, CGST-D, SGST-E, IGST-F, TOTAL INVOICE VALUE)
6. Enrollment ID + Payment Reference footer
7. "Thank you for your business!" footer

### Delivery

**Auto-download:** `EnrollmentConfirmation.tsx` calls `downloadInvoice()` with a 500ms delay on page load (using `useRef` to prevent double-download). The file is saved as `Invoice_{enrollmentId}.pdf`.

**Email via n8n:** `sendInvoiceEmail()` in `invoice-email-sender.ts`:
1. Generates PDF → converts to base64 via `doc.output("datauristring")`
2. POSTs payload to n8n webhook: `VITE_N8N_WEBHOOK_URL`
3. n8n webhook emails the invoice to `ar@proitbridge.com`
4. This is fire-and-forget — errors are caught and logged but do not block the user

---

## 10. Meta Pixel / Analytics Tracking

**Pixel ID:** `33637779472487574`  
**Initialized in:** `index.html` (synchronous inline script)

| Event | Type | Where Fired | Data |
|---|---|---|---|
| `PageView` | Standard | `index.html` on load | — |
| `ScrollDepth50` | Custom | `Index.tsx` when user scrolls ≥ 50% | — |
| `InductionCTAClicked` | Custom | `PaymentContext.openPaymentModal()` | — |
| `InitiateCheckout` | Standard | `PaymentModal` before payment step | `{value:89, currency:'INR'}` |
| `Purchase` | Standard | `useRazorpay` after ₹89 payment success | `{value:89, currency:'INR'}` |
| `InductionPaymentSuccess` | Custom | `useRazorpay` after ₹89 payment success | `{paymentId, amount:89, currency:'INR'}` |
| `PaymentSuccess` | Custom | `LeadCaptureModal` + `ThankYou.tsx` | — |
| `Purchase` | Standard | `Enrollment.tsx` after ₹1,000 payment | `{value:1000, currency:'INR'}` |
| `EnrollmentPaymentSuccess` | Custom | `Enrollment.tsx` after ₹1,000 payment | `{enrollmentId, paymentMethod, paymentId, value:1000, currency:'INR'}` |
| `EnrollmentComplete` | Custom | `EnrollmentConfirmation.tsx` on load | `{enrollmentId, program}` |

---

## 11. Video Integration

### Vimeo (iframe embed)

Used in `VideoSection.tsx` and `Induction.tsx`.

**Meta In-App Browser Detection** — Both components check `navigator.userAgent` for patterns: `FBAN|FBAV|Instagram|FB_IAB|FBIOS|FBSS|FBDV|FBMD|FBLC|FBSV|FBCR|FBBV|Threads`. If Meta browser detected, `autoplay=1&muted=1` is omitted from the URL to avoid autoplay restrictions in Facebook/Instagram WebViews.

| Component | Vimeo ID | Normal Browser | Meta Browser |
|---|---|---|---|
| `VideoSection` | `1156368541` | autoplay=1, muted=1, loop=1 | loop=1 only |
| `Induction` | `1156371689` | autoplay=1, muted=1, loop=1 | loop=1 only |

### Local MP4 Alumni Videos (`AlumniPodcasts.tsx`)

6 MP4 files bundled in `/src/assets/`. Controls include `controlsList="nodownload noplaybackrate"`, `disablePictureInPicture`, and `onContextMenu` blocked. Mutual exclusion: `handlePlay(currentIndex)` pauses all other videos when one starts.

---

## 12. Context Providers & State Management

### `PaymentContext` (`PaymentContext.tsx`)

Simple open/close state for the `PaymentModal`. Fires `fbq('trackCustom', 'InductionCTAClicked')` on `openPaymentModal()`.

**Exposed via `usePayment()` hook:**
- `openPaymentModal()` — opens modal + tracks event
- `closePaymentModal()` — closes modal
- `isPaymentModalOpen: boolean`

Renders `<PaymentModal>` as a child of the provider.

### `RazorpayContext` (`RazorpayContext.tsx`)

Manages Razorpay script lifecycle, warmup, and pre-warming.

**Key constants (hardcoded):**
- `RAZORPAY_KEY = "rzp_live_SJWXxm7bY9dMx0"`
- `AMOUNT_PAISE = 8900` (₹89)
- `THEME_COLOR = "#0B1F3A"`

**Warmup Strategy:**
1. On mount: polls every 50ms (up to 5s) for `window.Razorpay` to be available
2. Once available: creates a dummy instance (`warmUpRazorpay`) to preload Razorpay's internal resources
3. On first user interaction (scroll/click/touch): re-warms the instance
4. `preWarmWithDetails(mobile, name)`: creates a fully configured instance with user's prefill data ready to open instantly

**sessionStorage helpers exported:**
- `setPaymentPending(mobile, name)` — marks a payment as in-progress
- `clearPaymentPending()` — clears the pending state
- `isPaymentPending()` — checks if pending (expires after 10 minutes)
- `getPendingPaymentDetails()` — returns mobile + name from sessionStorage

### `useRazorpay` Hook (`hooks/useRazorpay.ts`)

Core hook that creates and opens a Razorpay checkout. Handles:
- `isLoading` state to prevent double-click
- Dynamic script loading fallback if `window.Razorpay` is missing
- `payment.failed` event → sets error message
- `ondismiss` → clears loading state
- `hasHandledPaymentRef` guard to prevent duplicate payment success callbacks

### `@tanstack/react-query`

`QueryClient` is set up in `App.tsx` but there are no `useQuery` / `useMutation` calls in the current codebase. It is installed but not actively used.

---

## 13. Environment Variables & Secrets

### `.env` file

```env
VITE_N8N_WEBHOOK_URL=https://n8n.srv1238772.hstgr.cloud/webhook/payment-invoice
```

Only one environment variable is used. The Razorpay live key and all GAS URLs are **hardcoded directly in source files**.

### Hardcoded Secrets / Keys in Source

| Secret | Value | Location |
|---|---|---|
| Razorpay Live Key | `rzp_live_SJWXxm7bY9dMx0` | `useRazorpay.ts`, `RazorpayContext.tsx`, `Enrollment.tsx`, `LeadCaptureModal.tsx` |
| Meta Pixel ID | `33637779472487574` | `index.html` |
| GAS URL (access control) | `AKfycbww2bQ...` | `google-sheets-api.ts` |
| GAS URL (enrollment) | `AKfycbwcknO...` | `Enrollment.tsx` |
| GAS URL (lead capture) | `AKfycbzRN7n...` | `LeadCaptureModal.tsx` |
| Vimeo Video IDs | `1156368541`, `1156371689` | `VideoSection.tsx`, `Induction.tsx` |
| Logo URL | `https://aicourses.proitbridge.com/logo.png` | `useRazorpay.ts`, `RazorpayContext.tsx`, `Enrollment.tsx`, `LeadCaptureModal.tsx` |
| n8n Webhook base URL | `https://n8n.srv1238772.hstgr.cloud/...` | Partially in `.env`, also present in `invoice-email-sender.ts` fallback comment |
| Invoice email recipient | `ar@proitbridge.com` | `invoice-email-sender.ts` |

---

## 14. Build Configuration

### Vite (`vite.config.ts`)

- **Framework plugin:** `@vitejs/plugin-react-swc` (SWC-based fast compilation)
- **Dev server port:** `8080`, host `"::"`
- **Path alias:** `@` → `./src`
- **Dev-only plugin:** `lovable-tagger` (componentTagger) — injected only in development mode

### TypeScript

Three tsconfig files:
- `tsconfig.json` — references app and node configs
- `tsconfig.app.json` — main app TypeScript config
- `tsconfig.node.json` — for Vite config file itself

### Tailwind CSS (`tailwind.config.ts`)

**Custom fonts:**
- `font-sans`: DM Sans, system-ui
- `font-display`: Fraunces (serif) — used for headings

**Custom colors defined via CSS variables:**
- `navy`, `navy-light`, `blue`, `blue-light`, `accent-blue`, `gold`, `cyan`, `soft-bg`
- Standard shadcn tokens: `border`, `input`, `ring`, `background`, `foreground`, `primary`, `secondary`, `destructive`, `muted`, `accent`, `popover`, `card`

**Custom animations:**
- `breathe` — subtle scale + shadow pulse
- `shimmer` — background position sweep
- `pulse-glow` — box-shadow glow effect
- `float` — vertical float
- `fade-up` — opacity + translateY entrance

**Plugin:** `tailwindcss-animate`

---

## 15. Known Issues & Observations

### Security Concerns

1. **Razorpay live key is hardcoded** in 4 different source files. It is exposed in the client bundle. While Razorpay live keys are intended to be public (the secret key is never used client-side), having it in 4 places creates maintenance risk.

2. **No server-side payment verification.** After Razorpay payment, the client calls GAS directly. There is no signature verification (`razorpay_payment_id` + `razorpay_order_id` + `razorpay_signature`). A malicious user could theoretically call `updatePaymentSuccess()` or `submitEnrollment()` with a fake payment ID. The `no-cors` mode on some GAS calls means there is no response validation either.

3. **Google Apps Script URLs exposed in client.** The full GAS deployment URLs are in the client bundle. Anyone can call these endpoints directly.

4. **No CSRF protection** on GAS endpoints.

### Functional Observations

5. **`LeadCaptureModal` is not wired to any active CTA.** No component in the current codebase calls it. It appears to be a legacy component left over from a previous flow.

6. **`useYouTubeIframePlayer.ts` hook exists but is not used.** No component imports it.

7. **`Header.tsx` component exists but is not used** in any page. The landing page and induction page use `AlertBanner` at the top but not `Header`.

8. **`ThankYou.tsx` page** references a WhatsApp number `+919876543210` — this appears to be a placeholder number, not a real business number.

9. **`@tanstack/react-query` is installed** but no queries or mutations are used anywhere in the app.

10. **Razorpay key is duplicated 4 times** across `useRazorpay.ts`, `RazorpayContext.tsx`, `Enrollment.tsx`, and `LeadCaptureModal.tsx`. Should be a single constant.

11. **`EnrollmentConfirmation.tsx`** shows `paymentMethod` in the state type as `"UPI" | "Bank"` but `Enrollment.tsx` passes `"UPI" | "Card"` — minor type mismatch.

12. **Invoice email recipient is hardcoded** as `ar@proitbridge.com` in `invoice-email-sender.ts`. Should be in `.env`.

13. **The `registerPendingUser` function** in `google-sheets-api.ts` is defined but never called in the current codebase. The flow goes directly to `updatePaymentSuccess` after payment, skipping the PENDING registration step for the induction flow.
