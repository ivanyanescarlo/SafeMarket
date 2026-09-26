# SafeMarket: Secure Local Online Marketplace & Scam Prevention System

SafeMarket is a functional web application designed for safe peer-to-peer second-hand trading within Philippine local communities. It features automated scam detection powered by **Google Gemini API** (`gemini-3.8-flash`), strict role-based access control, OTP verification, local Philippine location filtering, buyer-seller messaging, community reporting, seller ratings, and a comprehensive administrator moderation center.

---

## 🛠️ Technology Stack

As strictly required by the project proposal, this application uses **ONLY**:

* **React.js** (Frontend with Vite & Tailwind CSS)
* **JavaScript** (Programming Language)
* **Node.js** (Backend Runtime)
* **Express.js** (Backend REST API)
* **MongoDB** (Database running on `localhost:27017`)
* **Gemini API** (`gemini-3.8-flash` AI Listing Risk Analyzer)

> 🚫 **No payment gateways, credit card processing, or escrow systems are used.** SafeMarket facilitates local, safe in-person transactions and scam prevention.

---

## 🛡️ Key Features & Modules

### 1. User Authentication & Security
* **Registration**: Requires First Name, Last Name, Username, Email, Password, Mobile Number, and structured Philippine Location (Province and City/Municipality).
* **OTP Verification**: Simulated secure email/mobile OTP verification with 10-minute expiration and cooldown timer. OTP values are never exposed to the frontend.
* **Role-Based Permissions**: Users register as **Buyer** by default. Users must complete the multi-step **Become a Seller** process to activate Seller Mode.

### 2. Become a Seller Flow
* **Step 1 – Seller Agreement**: Acknowledge truthfulness and anti-scam rules.
* **Step 2 – Listing Guidelines**: 5-point verification for pre-loved products and reasonable pricing.
* **Step 3 – Seller Profile**: Optional bio and profile photo. No credit cards or bank accounts requested.
* **Step 4 – Activation**: Activates Seller Mode in MongoDB, records acceptance, and unlocks the Seller Dashboard and Create Listing tools.

### 3. Gemini AI Listing Risk Analyzer
* Scans listing title, description, price, condition, and location for:
  * Advance payment requests (e.g., GCash reservation deposits before meetup).
  * Unrealistic or too-good-to-be-true pricing (e.g., brand new iPhone 16 Pro for ₱10,000).
  * Artificial urgency ("rush sale today", "hospital emergency").
  * Off-platform communication requests (Telegram, suspicious links).
* Returns structured **Risk Level** (`Low`, `Medium`, `High`), bulleted **Risk Indicators**, and actionable buyer safety recommendations.
* Serves as an **advisory warning** (does not auto-delete listings).

### 4. Marketplace & Search
* Search by keyword, category, price range, condition, and location (Province & City/Municipality).
* Filter by Gemini AI risk level.
* Product detail page with image gallery, seller profile snapshot, AI risk banner, "Message Seller", and "Report Listing" buttons.

### 5. Peer-to-Peer Messaging & Notifications
* Direct buyer-seller conversations linked to product listings.
* Live notification bell with unread badge counter (only shown when unread count > 0).

### 6. Seller Ratings & Scam Reports
* 1–5 star ratings with written reviews (self-rating prohibited).
* Community report modal for flagging suspicious listings.

### 7. Administrator Dashboard
* Overview statistics and live metrics.
* User account management (suspend or activate accounts, toggle roles).
* Listing moderation (take down or restore listings with reasons).
* Scam reports queue (review, resolve, or dismiss reports).
* Gemini AI risk monitoring view (proactively inspect flagged listings).
* System activity logs (audit trail for logins, registrations, listings, and admin actions).

---

## 🔑 Pre-Seeded Accounts for Testing

| Role | Email | Password | Details |
| :--- | :--- | :--- | :--- |
| **Administrator** | `admin@safemarket.ph` | `Admin123!` | Full moderation access (`/admin`) |
| **Verified Seller** | `maria@safemarket.ph` | `Password123!` | Quezon City seller with active listings & ratings |
| **Verified Seller** | `juan@safemarket.ph` | `Password123!` | Cebu City seller with tech & camera items |
| **Buyer** | `carlo@safemarket.ph` | `Password123!` | Normal buyer account (can test "Become a Seller") |

---

## 🚀 How to Run SafeMarket

### 1. Prerequisites
* **Node.js** (v18+ or v22+)
* **MongoDB** running locally on `localhost:27017`

### 2. Start the Backend Server
```bash
cd server
npm install
npm run seed     # Seeds initial accounts, listings, and Gemini risk evaluations
npm start        # Runs on http://localhost:5000
```

### 3. Start the Frontend Application
```bash
cd client
npm install
npm run dev      # Runs on http://localhost:3000
```

Open your browser at `http://localhost:3000` to access SafeMarket.
