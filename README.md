# 🍃 Leaf Identification System (LeafScan)

[![License: MIT](https://img.shields.io/badge/License-MIT-emerald.svg)](LICENSE)
[![React](https://img.shields.io/badge/Frontend-React%2019%20%2B%20Vite-61DAFB.svg)](https://react.dev/)
[![Express](https://img.shields.io/badge/Backend-Express.js%204-lightgrey.svg)](https://expressjs.com/)
[![FastAPI](https://img.shields.io/badge/AI%20Service-FastAPI-009688.svg)](https://fastapi.tiangolo.com/)
[![YOLOv8](https://img.shields.io/badge/Detection-YOLOv8-FF6F00.svg)](https://github.com/ultralytics/ultralytics)
[![Docker](https://img.shields.io/badge/Deployment-Docker%20Compose-2496ED.svg)](https://www.docker.com/)

A modern, full-stack, AI-powered botanical identification platform. The system leverages **Ultralytics YOLOv8** for real-time leaf localization and single-leaf validation, coupled with a deep **Convolutional Neural Network (CNN)** for fine-grained species classification. Built with a scalable 4-tier microservices architecture, enterprise-grade authentication, role-based access control, privacy-centric thumbnail caching, and an administrative analytics dashboard.

---

## 📑 Table of Contents

- [Key Features in Detail](#-key-features-in-detail)
  - [1. Multi-Stage AI Computer Vision Pipeline](#1-multi-stage-ai-computer-vision-pipeline)
  - [2. Supported Plant Species & Botanical Intelligence](#2-supported-plant-species--botanical-intelligence)
  - [3. Enterprise Authentication & Security](#3-enterprise-authentication--security)
  - [4. Scan History, Analytics & CSV Export](#4-scan-history-analytics--csv-export)
  - [5. Privacy & Data Minimization Architecture](#5-privacy--data-minimization-architecture)
  - [6. Administrative Dashboard & Audit Logging](#6-administrative-dashboard--audit-logging)
  - [7. Modern Responsive UI/UX](#7-modern-responsive-uiux)
  - [8. DevOps, Containerization & High Availability](#8-devops-containerization--high-availability)
- [System Architecture](#-system-architecture)
- [Technology Stack](#-technology-stack)
- [Project Credits](#-project-credits)
- [Getting Started](#-getting-started)
  - [Prerequisites](#prerequisites)
  - [Quick Start with Docker Compose](#quick-start-with-docker-compose)
  - [Manual Local Development Setup](#manual-local-development-setup)
  - [Admin Account Setup](#admin-account-setup)
- [API Reference](#-api-reference)
- [Project Directory Structure](#-project-directory-structure)

---

## 🌟 Key Features in Detail

### 1. Multi-Stage AI Computer Vision Pipeline

The system does not simply pass an unvalidated photo to a classifier. Instead, it implements an orchestrated multi-stage computer vision workflow:

- **Intelligent Preprocessing & Auto-Normalization:**
  - Integrates `Sharp` image processing to automatically parse EXIF orientation tags (auto-rotation).
  - Normalizes arbitrary image resolutions and aspect ratios to standard **640 × 640 pixels** with high-quality containment and neutral padding prior to model inference.
- **YOLOv8 Object Detection & Localization:**
  - High-speed object detection powered by Ultralytics YOLOv8 trained to detect and localize botanical leaf structures.
  - Generates normalized bounding box coordinates (`[x1, y1, x2, y2]`) identifying exact leaf boundaries.
- **Strict Single-Leaf Validation (Quality Assurance):**
  - Enforces single-subject integrity to prevent multi-species confusion and poor classification accuracy.
  - **Zero-Leaf Detection:** Rejects non-botanical images or blurry scans with a `422 Unprocessable Entity` and guidance.
  - **Multi-Leaf Detection:** Rejects images containing multiple leaves (e.g., branches, overlapping foliage), informing the user of the exact count detected and instructing them to isolate a single leaf.
- **Automated Region-of-Interest (ROI) Cropping:**
  - Dynamically extracts the detected leaf's bounding box region, removing extraneous background noise before downstream classification.
- **Deep CNN Species Classification:**
  - Custom deep Convolutional Neural Network (PyTorch) processing the cropped leaf region.
  - Computes a normalized confidence score (0% to 100%) alongside the predicted taxonomic class.
- **Fault-Tolerant Fallback Mechanism:**
  - Built-in resilience: If the external AI microservice experiences downtime or high latency, the backend switches to an intelligent fallback mode using Sharp-based green pixel cluster analysis and heuristic classification, guaranteeing service uptime.

---

### 2. Supported Plant Species & Botanical Intelligence

The classification engine currently targets 5 economically, agriculturally, and medicinally vital species:

| Species Common Name | Scientific (Taxonomic) Name | Botanical Characteristics & Traditional Uses |
|---|---|---|
| **Guava** | *Psidium guajava* | Elliptic/ovate leaves with prominent parallel veins; rich in antioxidants, vitamin C, and flavonoids. |
| **Lemon** | *Citrus limon* | Elliptic, finely toothed evergreen leaves emitting a citrus scent when crushed; antimicrobial properties. |
| **Lychee** | *Litchi chinensis* | Glossy pinnate leaves with vibrant red fruit; rich floral aroma and traditional digestive applications. |
| **Mango** | *Mangifera indica* | Lanceolate, leathery glossy leaves; significant cultural, Ayurvedic, and medicinal importance. |
| **Olive** | *Olea europaea* | Silvery-green lanceolate leaves; renowned for oleuropein, cardiovascular health, and antioxidant activity. |

---

### 3. Enterprise Authentication & Security

- **Two-Step Email OTP Verification:**
  - New user signups and logins can require a 6-digit one-time password (OTP) sent directly to the registered email address via Nodemailer.
  - Prevents automated spam accounts, credential stuffing, and unverified bot registrations.
- **Cryptographic OTP Storage & Timing-Safe Verification:**
  - Plaintext OTPs are **never stored** in the database; only SHA-256 cryptographically hashed tokens are persisted.
  - Verified using Node's `crypto.timingSafeEqual()` to neutralize side-channel timing attack vectors.
  - Automatically expires verification codes after a 10-minute window.
- **Stateless JWT Authorization:**
  - Uses signed JSON Web Tokens (JWT) containing essential claims (`id`, `role`).
  - Frontend Axios interceptors automatically inject the `Authorization: Bearer <token>` header on all protected requests.
- **Self-Service Password Recovery:**
  - Complete "Forgot Password" and "Reset Password" workflows with cryptographically secure, time-bounded tokens sent via email.
- **Defense-in-Depth Middleware:**
  - **Helmet.js:** Enforces HTTP security headers, CSP, frameguards (clickjacking defense), and MIME sniff prevention.
  - **Granular Rate Limiting:** Global rate limiting (100 req/15 min) for DDoS mitigation, stricter auth rate limiting (20 attempts/15 min), and OTP attempt limiting (5 attempts/10 min).
  - **Zod Schema Validation:** All incoming registration, login, and query parameters are strictly validated and sanitized before reaching controller logic.
  - **Bcrypt Password Hashing:** User passwords salted and hashed with 12 rounds of bcrypt.

---

### 4. Scan History, Analytics & CSV Export

- **Personal Prediction History:**
  - Authenticated users have immediate access to their personal chronological scan history.
  - Paginated browsing with smooth page navigation and fast loading.
- **Secure Image Thumbnails:**
  - Visual cards display the cropped leaf thumbnail alongside identified species, timestamp, and confidence rating.
- **Downloadable CSV Reports:**
  - One-click **"Download Report"** feature allowing users to export their entire scan log (`leafscan_report.csv`) with timestamps, species names, and confidence percentages for record-keeping and agricultural research.

---

### 5. Privacy & Data Minimization Architecture

- **Zero Full-Resolution Image Retention:**
  - In accordance with modern data privacy principles and storage efficiency, full-resolution uploaded images are held strictly in temporary RAM (`Multer memoryStorage`) during inference and are **immediately discarded**.
  - No large original images are ever stored on disk or in the database.
- **Lightweight 150 × 150 Thumbnail Generation:**
  - Only a compressed 150 × 150 JPEG thumbnail is saved as a binary buffer within the MongoDB prediction document.
- **Owner-Only Media Isolation (NF.5 Compliance):**
  - Thumbnails can **only** be fetched by the specific user who submitted the scan (`prediction.userId === req.user._id`).
  - System administrators are explicitly denied access to user image files, ensuring user privacy even within administrative tooling.

---

### 6. Administrative Dashboard & Audit Logging

Accessible exclusively to users with `role: "admin"`, the dashboard provides management and governance tools:

- **System Overview & Health Metrics:**
  - High-level metric cards: Total Registered Users, Total Predictions Executed, Total Unique Species Discovered.
- **Visual Species Breakdown:**
  - Dynamic progress bars demonstrating the distribution of scans across all species with real-time percentages.
  - Computes and displays the average model confidence score per species.
- **User Directory & Account Management:**
  - Paginated list of registered users showing username, email, account status, registration date, and individual scan volume.
  - Administrative user deletion (cascades and purges associated prediction records to eliminate orphaned data).
  - Protection guards preventing admin self-deletion.
- **Audit & Activity Logs:**
  - Real-time audit trail of all predictions made across the platform with usernames, species detected, confidence scores, and timestamps.
  - Strictly presents metadata only, honoring privacy rules by excluding image thumbnails.

---

### 7. Modern Responsive UI/UX

- **State-of-the-Art Design Aesthetics:**
  - Designed with Tailwind CSS v4, sleek dark-mode slate styling, and frosted glassmorphism cards (`backdrop-blur`).
  - Vibrant botanical accents with custom HSL-tailored emerald gradients.
- **Interactive Drag-and-Drop Image Uploader:**
  - Supports drag-and-drop file drops or native file browser selection.
  - Client-side format checking (JPEG/PNG) and size verification (< 5 MB).
  - Instant client-side decoded preview with remove/replace functionality.
- **Dynamic Feedback & Badging:**
  - Color-coded `ConfidenceBadge` dynamically adapting to model confidence:
    - 🟢 High Confidence (≥ 80%)
    - 🟡 Moderate Confidence (60% – 79%)
    - 🔴 Low Confidence (< 60%)
- **Route Guards & Role Protection:**
  - Custom `<ProtectedRoute>` component seamlessly handling unauthenticated redirects to `/login` and displaying permission barriers for unauthorized users attempting to access `/admin`.

---

### 8. DevOps, Containerization & High Availability

- **Multi-Stage Docker Builds:**
  - **Frontend:** Multi-stage build (Node 20 Alpine builder → Nginx Alpine server) resulting in an ultra-compact production image (~25MB) with built-in client-side SPA routing (`try_files $uri /index.html`).
  - **Backend:** Node.js Alpine container with minimal production dependencies.
  - **AI Service:** Python 3.11 Slim container pre-configured with CPU-optimized PyTorch wheels to prevent memory bloat and Out-Of-Memory (OOM) errors in resource-constrained environments.
- **One-Command Docker Compose:**
  - Orchestrates MongoDB, Node Backend, FastAPI AI Service, and Nginx Frontend within an isolated Docker network.
  - Automated restart policies (`restart: unless-stopped`) and health-check readiness.

---

## 🏗️ System Architecture

```
                            ┌────────────────────────┐
                            │      User Browser      │
                            └────────────────────────┘
                                        │
                         HTTPS / SPA    │   REST API Requests
                                        ▼
                            ┌────────────────────────┐
                            │    React 19 Frontend   │
                            │ (Vite + Tailwind CSS)  │
                            │   Hosted: Vercel CDN   │
                            └────────────────────────┘
                                        │
                                        │  JSON + Bearer JWT
                                        ▼
                            ┌────────────────────────┐
                            │   Express.js Backend   │
                            │  (Node.js / Port 5000) │
                            │   Auth, RBAC, Multer   │
                            └───────┬────────┬───────┘
                                    │        │
               Cropped Image Buffer │        │ Mongoose ODM
                     (HTTP POST)    │        │
                                    │        ▼
                                    │  ┌───────────────────┐
                                    │  │   MongoDB Atlas   │
                                    │  │  Users & History  │
                                    │  └───────────────────┘
                                    ▼
                        ┌────────────────────────┐
                        │   FastAPI AI Service   │
                        │  (Python / Port 8000)  │
                        │  YOLOv8 + Custom CNN   │
                        └────────────────────────┘
```

---

## 💻 Technology Stack

| Domain | Technology / Library | Purpose |
|---|---|---|
| **Frontend Core** | React 19, Vite 8, React Router v7 | Fast SPA development, client-side routing |
| **Styling** | Tailwind CSS v4 | Responsive layout, dark glassmorphism UI |
| **API Client** | Axios | REST communication with JWT interceptors |
| **Backend Runtime** | Node.js (v18+ / v20) | Asynchronous backend server runtime |
| **Web Framework** | Express.js 4 | RESTful routing, middleware orchestration |
| **Database & ODM** | MongoDB, Mongoose 8 | Document storage, schema enforcement, indexing |
| **Authentication** | JWT (`jsonwebtoken`), `bcryptjs` | Stateless session management & password hashing |
| **Security** | `helmet`, `express-rate-limit`, `zod` | Defensive headers, rate limiting, payload validation |
| **File & Image Processing** | `multer`, `sharp` | In-memory uploads, crop, resizing & thumbnailing |
| **Email Service** | `nodemailer` | 6-digit OTP delivery for signup & verification |
| **AI Inference** | Python 3.11, FastAPI, Uvicorn | High-performance asynchronous ML microservice |
| **Machine Learning** | PyTorch, Ultralytics YOLOv8, Pillow | Leaf detection, bounding box extraction, classification |
| **Containerization** | Docker, Docker Compose, Nginx Alpine | Multi-stage container builds & local orchestration |

---

## 👥 Project Credits

- **Faculty Guide & Mentor:** Prof. Jaidhar C.D.
- **Project Team Members:**
  - **Shashank Gupta** (241IT073)
  - **Manashvi Prajapati** (241IT042)
  - **Maitreya Kulkarni** (241IT041)

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** (v18.0 or later)
- **Python** (v3.10 or later)
- **MongoDB** (Local instance running on `localhost:27017` or MongoDB Atlas URI)
- **Docker & Docker Compose** (Optional, recommended for production simulation)

---

### Quick Start with Docker Compose

To build and spin up all 4 microservices (Frontend, Backend, AI Service, and MongoDB) simultaneously:

```bash
docker compose up --build
```

- **Frontend Web App:** `http://localhost:3000`
- **Backend API:** `http://localhost:5000`
- **AI Microservice Docs:** `http://localhost:8000/docs`
- **MongoDB Database:** `localhost:27017`

---

### Manual Local Development Setup

If you prefer running services directly on your host machine:

#### 1. Backend Service
```bash
cd backend
npm install
cp .env.example .env     # Configure MONGODB_URI, JWT_SECRET, AI_SERVICE_URL, EMAIL config
npm run dev
```

#### 2. Frontend Application
```bash
cd frontend
npm install
npm run dev
```
Open `http://localhost:5173` in your browser.

#### 3. AI Inference Service
```bash
cd ai-service
python -m venv venv

# On Linux/macOS:
source venv/bin/activate
# On Windows:
# .\venv\Scripts\activate

pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```
Open `http://localhost:8000/docs` for interactive Swagger documentation.

---

### Admin Account Setup

To access the `/admin` dashboard, register an account normally through the UI, verify your email OTP, and execute the helper script from the `backend/` folder:

```bash
cd backend
npm run make-admin -- your_registered_email@example.com
```

Sign out and sign back in to refresh your JWT token with admin privileges. The Admin panel will then be available in the top navigation or at `/admin`.

---

## 📡 API Reference

### Auth Endpoints (`/api/auth`)
- `POST /api/auth/register` — Register a new account (triggers OTP).
- `POST /api/auth/login` — Login with email/password (triggers OTP if verification enabled).
- `POST /api/auth/verify-code` — Submit 6-digit OTP to receive JWT access token.
- `POST /api/auth/resend-code` — Request a fresh 6-digit OTP.
- `POST /api/auth/forgot-password` — Request password reset email.
- `POST /api/auth/reset-password` — Complete password reset with token.
- `GET /api/auth/me` — Retrieve currently authenticated user profile *(Requires JWT)*.

### Prediction Endpoints (`/api/predict`)
- `POST /api/predict` — Upload image (`multipart/form-data`, field: `image`). Validates 640×640 normalization, runs YOLOv8 detection, verifies single leaf, runs CNN classification, generates thumbnail, saves record, and returns results *(Requires JWT)*.

### History Endpoints (`/api/history`)
- `GET /api/history?page=1&limit=12` — Paginated user prediction history *(Requires JWT)*.
- `GET /api/history/report` — Download scan history as `leafscan_report.csv` *(Requires JWT)*.
- `GET /api/history/:id/thumbnail` — Fetch owner-isolated thumbnail binary *(Requires JWT, Owner-Only)*.

### Admin Endpoints (`/api/admin`)
- `GET /api/admin/stats` — Aggregate metrics and per-species distribution *(Admin JWT required)*.
- `GET /api/admin/users?page=1&limit=10` — Paginated user directory with scan metrics *(Admin JWT required)*.
- `DELETE /api/admin/users/:id` — Delete user account and cascade delete predictions *(Admin JWT required)*.
- `GET /api/admin/logs?page=1&limit=15` — Metadata-only prediction audit logs *(Admin JWT required)*.

### AI Service Endpoints (Internal / FastAPI)
- `GET /health` — Service health and model memory residency check.
- `POST /detect` — Accepts leaf image; returns `leaf_count` and YOLOv8 bounding boxes.
- `POST /classify` — Accepts cropped leaf image; returns predicted `species` and `confidence`.

---

## 📁 Project Directory Structure

```
Realtime_Leaf_Detection_System/
├── frontend/                     # React 19 SPA
│   ├── src/
│   │   ├── api/                  # Axios instance & interceptors
│   │   ├── components/           # Navbar, ImageUploader, ConfidenceBadge, HistoryCard, etc.
│   │   ├── context/              # AuthContext (state, JWT, user session)
│   │   ├── pages/                # Home, Login, Signup, Upload, Result, History, AdminDashboard, etc.
│   │   ├── App.jsx               # Route definitions & ProtectedRoute wrappers
│   │   └── main.jsx
│   ├── Dockerfile                # Multi-stage build (Node -> Nginx Alpine)
│   └── vite.config.js
│
├── backend/                      # Express.js REST API
│   ├── src/
│   │   ├── config/               # Database connection (Mongoose)
│   │   ├── controllers/          # auth, predict, history, admin controllers
│   │   ├── middleware/           # auth (JWT), upload (Multer), validate (Zod)
│   │   ├── models/               # User.js, Prediction.js
│   │   ├── routes/               # Express route definitions
│   │   ├── scripts/              # make-admin.js CLI utility
│   │   └── server.js             # Express app entry, security headers, rate limiters
│   ├── Dockerfile
│   └── package.json
│
├── ai-service/                   # FastAPI Python ML Microservice
│   ├── models/                   # YOLOv8 weights (.pt) & CNN checkpoint
│   ├── routers/                  # /detect, /classify endpoints
│   ├── services/                 # detector.py (YOLOv8), classifier.py (CNN)
│   ├── main.py                   # FastAPI application with lifespan model caching
│   ├── requirements.txt
│   └── Dockerfile                # Python 3.11 slim container with CPU PyTorch
│
├── docker-compose.yml            # Multi-service local & production orchestration
├── docs/                         # SRS, DFDs, Level-0/1/2 Diagrams, Data Dictionary
└── README.md                     # Comprehensive project documentation
```

---

<div align="center">
  <sub>Built with 🌿 for precise, real-time botanical classification.</sub>
</div>
