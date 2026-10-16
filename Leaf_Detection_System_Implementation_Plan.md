# Implementation Plan — Leaf Identification System

Based on the SRS, DFDs, Structure Chart, and Data Dictionary you shared. This plan turns those requirements into a concrete build: architecture, tech stack, schemas, APIs, ML pipeline, security, and a phased delivery schedule.

---

## 1. System Architecture

Four independent services, matching the SRS product perspective (React frontend, Express/Node backend, MongoDB, Python AI service):

```

┌────────────┐     HTTPS/REST      ┌──────────────┐     internal HTTP     ┌──────────────────┐
│   React    │ ───────────────────▶│  Express.js  │ ─────────────────────▶│  Python AI Service │
│  Frontend  │◀─────────────────── │   Backend    │◀───────────────────── │ (FastAPI/Flask)    │
└────────────┘   JSON + JWT         └──────┬───────┘   JSON (image ref)    │ YOLOv8 + CNN        │
                                            │                                └──────────────────┘
                                            ▼
                                     ┌──────────────┐
                                     │   MongoDB    │
                                     │ Users / Preds│
                                     └──────────────┘
```

- **Frontend (React)** — talks only to the Express backend, never directly to the AI service.
- **Backend (Express/Node.js)** — owns auth, validation, RBAC, orchestration of the AI calls (matches processes 0.1–0.6 in your Level 1 DFD), and all DB writes.
- **AI Service (Python)** — stateless inference microservice exposing two endpoints (detect, classify), matching the "External AI Service" entity invoked twice in your DFD.
- **MongoDB** — two collections, `users` and `predictions`, matching D1 and D2 in your data dictionary.

Keeping the AI service separate (rather than embedding PyTorch in Node) is deliberate: it matches your data dictionary's "External AI Service" entity, lets you scale/deploy the GPU workload independently, and keeps the Node backend lightweight.

---

## 2. Tech Stack

| Layer | Choice | Notes |
|---|---|---|
| Frontend | React 18 + Vite, React Router, Axios, Tailwind CSS | Matches C.3 |
| Backend | Node.js + Express, Mongoose | REST API, JWT auth |
| AI Service | Python 3.10+, FastAPI, PyTorch, Ultralytics YOLOv8 | Two endpoints: `/detect`, `/classify` |
| Database | MongoDB (Atlas or self-hosted) | Users + Prediction History |
| Auth | JWT (access token), bcrypt for password hashing | NF.3 |
| File handling | Multer (backend upload), Sharp (thumbnail generation) | F.8 requires thumbnail-only retention |
| Storage | MongoDB GridFS or local/S3-compatible bucket for thumbnails only | Full-res image deleted post-inference |
| Deployment | Docker Compose (dev), separate containers per service (prod) | CPU/GPU split per C.2 |

---

## 3. Database Schema (MongoDB)

### `users` collection (D1)
```js
{
  _id: ObjectId,
  username: String,          // unique
  email: String,             // unique
  passwordHash: String,      // bcrypt
  role: "user" | "admin",
  accountStatus: "active" | "disabled",
  registrationDate: Date
}
```

### `predictions` collection (D2)
```js
{
  _id: ObjectId,
  userId: ObjectId,          // ref -> users
  species: String,           // one of 5 predefined species
  confidenceScore: Number,   // 0-100
  timestamp: Date,
  thumbnail: {
    data: Buffer,            // or a storage key if using S3/GridFS
    contentType: String
  }
  // NOTE: no full-resolution image field — deleted after inference (F.8)
}
```

Indexes: `users.email` (unique), `users.username` (unique), `predictions.userId` + `timestamp` (compound, for paginated history queries).

---

## 4. Backend API Design (Express)

All protected routes require `Authorization: Bearer <JWT>`. Admin routes additionally check `role === "admin"`.

| Method | Route | Maps to | Description |
|---|---|---|---|
| POST | `/api/auth/register` | F.1 | Create account (name, email, password) |
| POST | `/api/auth/login` | F.1 | Verify credentials, issue JWT |
| POST | `/api/predict` | F.2–F.7 | Upload image → validate → detect → classify → return result |
| GET | `/api/history?page=&limit=` | F.9 | Paginated list of the caller's own predictions |
| GET | `/api/history/:id/thumbnail` | F.9, NF.5 | Owner-only thumbnail fetch |
| GET | `/api/admin/users` | F.10 | List all users (admin only) |
| DELETE | `/api/admin/users/:id` | F.10 | Delete a user account (admin only) |
| GET | `/api/admin/logs?page=&limit=` | F.10 | Prediction logs, metadata only, no images |
| GET | `/api/admin/stats` | F.10 | Aggregate stats: total users, total predictions, per-species counts |

### `/api/predict` orchestration (this is the core pipeline)
1. Multer receives the file → check MIME type (`image/jpeg`, `image/png`) and size limit (e.g. 5 MB) → **F.3**.
2. If invalid → return 400 with a validation error message.
3. Forward image buffer to AI service `POST /detect` → get `{ leafCount, boxes }` → **F.4**.
4. If `leafCount !== 1` → return 422 with a rejection message; skip classification → **F.5**.
5. Crop image to the single detected bounding box (can be done in Node with `sharp`, or the AI service can return the crop directly).
6. Forward cropped image to AI service `POST /classify` → get `{ species, confidence }` → **F.6**.
7. Generate a compressed thumbnail (`sharp`, e.g. 150×150) from the *original* upload; discard the full-resolution buffer immediately after — **F.8**.
8. Write a `predictions` document (userId, species, confidence, timestamp, thumbnail).
9. Return `{ species, confidence, timestamp }` to the frontend — **F.7**.

---

## 5. AI Service Design (Python / FastAPI)

Two stateless endpoints, loaded models kept in memory at startup for latency (NF.4: <5s response):

```python
POST /detect
  in:  multipart image
  out: { "leaf_count": int, "boxes": [[x1,y1,x2,y2], ...] }
  model: YOLOv8 (pretrained/fine-tuned leaf-detector, per Assumption 2.5)

POST /classify
  in:  multipart image (single cropped leaf)
  out: { "species": str, "confidence": float }
  model: custom CNN, trained in-house on the 5-species dataset (per Assumption 2.5)
```

- Species labels fixed: `Neem, Amla, Aloe Vera, Mango, Curry Leaves`.
- Run YOLOv8 inference via Ultralytics' Python API; run the CNN via a saved PyTorch `.pt`/`.pth` checkpoint loaded once at process start.
- Use CUDA if available, fall back to CPU automatically (C.2).
- Add a lightweight `/health` endpoint for container orchestration checks.

### CNN training pipeline (separate offline step, not part of the live service)
1. Collect/label dataset for the 5 species.
2. Standard train/val/test split, data augmentation (rotation, flip, color jitter — leaves vary a lot in lighting).
3. Transfer-learn from a small backbone (ResNet18/MobileNetV2) is a reasonable default even though the SRS specifies in-house training — it still counts as "trained in-house," just not trained from scratch, and will train faster on limited data.
4. Export the best checkpoint and load it into the AI service.

---

## 6. Frontend (React) — Pages & Components

| Page | Route | Auth | Function |
|---|---|---|---|
| Home | `/` | Public | Landing page, project description |
| Login | `/login` | Public | F.1 |
| Signup | `/signup` | Public | F.1 |
| Upload | `/upload` | User | F.2, image preview before submit |
| Result | `/result` | User | F.7 — species, confidence, image |
| History | `/history` | User | F.9 — paginated table/grid with thumbnails |
| Admin Dashboard | `/admin` | Admin | F.10 — user list, stats, logs (no images) |

Key components: `ProtectedRoute` (JWT check + role check), `ImageUploader` (drag-drop + preview), `ConfidenceBadge`, `HistoryCard`, `PaginationControl`, `AdminUserTable`.

State/auth handling: store JWT in memory + `httpOnly` cookie if possible (safer than `localStorage`); Axios interceptor attaches the token and handles 401 → redirect to login (supports C.6 JWT expiration handling).

---

## 7. Security & RBAC Implementation

Directly maps to constraints C.5, C.6, C.7 and NF.3, NF.5:

- Passwords hashed with bcrypt (never stored plaintext).
- JWT signed with a server secret, short expiry (e.g. 1h) + refresh flow, or re-login on expiry.
- Express middleware: `requireAuth` (valid JWT) and `requireRole("admin")` for admin routes.
- Thumbnail endpoint checks `prediction.userId === req.user.id` before serving — admins are explicitly **denied** image access, per F.10/NF.5. Enforce this at the route level, not just in the UI.
- Rate-limit `/api/predict` and `/api/auth/*` to reduce abuse (helps meet NF.4 under load).
- Validate file type/size server-side, not just in the frontend (never trust client-side checks alone).
- Input validation via a library like `zod` or `express-validator` on every route.
- All predictions logged with userId + timestamp for auditability (C.5).

---

## 8. Non-Functional Targets → Implementation Choices

| Requirement | How it's met |
|---|---|
| NF.4 — <5s response, 20 concurrent users | Keep AI models loaded in memory; use async I/O in FastAPI; connection pooling in Mongoose; load-test with `k6` or `locust` before launch |
| NF.1 — cross-platform | Node/React/Python are all OS-independent; containerize with Docker to avoid environment drift |
| NF.2 — no install required | Pure web app, no native client |
| C.2 — GPU optional | AI service auto-detects CUDA (`torch.cuda.is_available()`), degrades gracefully to CPU |
| C.4 — concurrency | Stateless AI service instances can be scaled horizontally behind a queue/load balancer if needed |

---

## 9. Suggested Repository Structure

```
leaf-detection-system/
├── frontend/           # React app
│   └── src/{pages,components,api,context}
├── backend/            # Express app
│   └── src/{routes,controllers,middleware,models,services}
├── ai-service/         # FastAPI app
│   ├── models/          # saved YOLOv8 + CNN weights
│   └── src/{detect.py, classify.py, main.py}
├── docker-compose.yml
└── docs/               # SRS, DFDs, data dictionary (what you already have)
```

---

## 10. Phased Delivery Plan

| Phase | Duration (suggested) | Deliverables |
|---|---|---|
| 1. Setup & Auth | Week 1–2 | Repo scaffolding, MongoDB schema, `/register`, `/login`, JWT middleware, basic React shell with routing |
| 2. AI Service (offline) | Week 2–4 (parallel) | Dataset prep, CNN training, YOLOv8 integration, `/detect` and `/classify` endpoints tested standalone |
| 3. Upload → Predict pipeline | Week 4–5 | `/api/predict` orchestration end-to-end, Upload + Result pages wired up |
| 4. History & Thumbnails | Week 5–6 | Thumbnail generation/storage, `/api/history`, History page with pagination |
| 5. Admin Dashboard | Week 6–7 | Admin routes, stats aggregation, Admin UI, RBAC enforcement tests |
| 6. Hardening | Week 7–8 | Rate limiting, input validation audit, load testing against NF.4, access-control tests (esp. thumbnail isolation) |
| 7. Deployment | Week 8 | Dockerize all three services, deploy (e.g. Vercel/Render for frontend+backend, GPU host or serverless GPU for AI service), CI pipeline |

---

## 11. Testing Strategy

- **Unit tests**: Express controllers (Jest/Supertest), AI service endpoints (pytest).
- **Integration tests**: full `/api/predict` flow with a mocked AI service, then with the real one.
- **Access-control tests**: explicitly verify an admin JWT cannot fetch another user's thumbnail (NF.5 is a hard requirement worth automated regression coverage).
- **Load tests**: simulate 20 concurrent uploads, confirm <5s p95 response time (NF.4).
- **Model evaluation**: precision/recall on a held-out test set for both YOLOv8 (leaf-count accuracy) and the CNN (per-species accuracy, confusion matrix).

---

## 12. Open Decisions to Settle Before Coding

1. Where does the *pretrained* YOLOv8 weight come from — a public leaf-detection dataset, or will you fine-tune it yourselves? (Assumption 2.5 says it's assumed pre-trained/available; confirm the source before Phase 2.)
2. Thumbnail storage: embedded in MongoDB (simple, fine at small scale) vs. GridFS/S3 (better if thumbnails grow large or numerous).
3. Hosting for the GPU-dependent AI service — a GPU VM, or a serverless GPU provider (e.g. Modal, Replicate-style) if you want to avoid running your own GPU box.
4. JWT storage on the frontend — `httpOnly` cookie (more secure, needs CSRF handling) vs. in-memory token (simpler, lost on refresh).

Happy to generate any of the following next: the Mongoose schemas as real code, the Express route skeletons, or the FastAPI service skeleton — just say which one to start with.
