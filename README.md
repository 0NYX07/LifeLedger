# LifeLedger — Obligation Intelligence & Life Administration

> **LifeLedger** is a personal life administration web application built to help users organize personal obligations, track critical deadlines, identify potential financial consequences before they occur, and manage responsibilities through completion.

Its core differentiator is **Obligation Intelligence**: connecting deadlines, financial commitments, supporting details, and suggested next actions in one centralized, secure ledger.

---

## Key Features

- **Personal Obligation Lifecycle:** Full CRUD management for obligations across 8 life categories: *Subscription*, *Bill / Utility*, *Purchase*, *Return Window*, *Warranty*, *Insurance*, *Document Renewal*, and *Custom*.
- **Deterministic Money Leak Detector:** Transparent, rule-based urgency evaluation that highlights imminent deadlines (overdue, due-today, due-soon within 7 days) and pairs each with a specific suggested action.
- **Financial Outlook & Recurring Projection:** Calculates monthly recurring expenses and annual commitments derived strictly from active records marked with recurrence. Projections are clearly labeled as estimates.
- **Multi-Tenant User Data Isolation:** Private records are strictly scoped to the authenticated user on the server. Unauthorized access attempts return 404 without disclosing resource existence.
- **Search, Filters & Sorting:** Real-time search across titles, descriptions, and notes, combined with category, status, urgency, and sort filters.
- **Secure Authentication:** JWT token authentication with bcrypt password hashing and email normalization.

---

## Technology Stack

- **Frontend:** React 19, Vite, Tailwind CSS, Lucide React, React Router
- **Backend:** Node.js, Express.js
- **Database:** MongoDB & Mongoose
- **Authentication:** JSON Web Tokens (JWT), bcryptjs
- **Validation:** Express Validator with strict request body allowlists

---

## Project Structure

```text
LifeLedger/
├── client/                     # Frontend React + Vite application
│   ├── src/
│   │   ├── api/
│   │   │   └── apiClient.js    # Centralized HTTP client
│   │   ├── components/
│   │   │   ├── ConfirmModal.jsx
│   │   │   ├── MoneyLeakBanner.jsx
│   │   │   ├── Navbar.jsx
│   │   │   ├── ObligationCard.jsx
│   │   │   ├── ObligationFormModal.jsx
│   │   │   └── Toast.jsx
│   │   ├── context/
│   │   │   └── AuthContext.jsx  # Authentication state & session
│   │   ├── pages/
│   │   │   ├── Dashboard.jsx   # Metrics, money leaks, queues
│   │   │   ├── Login.jsx
│   │   │   ├── MoneyOutlook.jsx# Financial commitments & recurring costs
│   │   │   ├── Obligations.jsx # Search, filter, and CRUD
│   │   │   └── Register.jsx
│   │   ├── utils/
│   │   │   └── formatters.js   # Date, currency, badge styling
│   │   ├── App.jsx
│   │   ├── index.css
│   │   └── main.jsx
│   ├── index.html
│   ├── package.json
│   ├── tailwind.config.js
│   └── vite.config.js
├── server/                     # Backend Express API
│   ├── src/
│   │   ├── config/
│   │   │   └── db.js           # Database connection & fallback
│   │   ├── controllers/
│   │   │   ├── auth.controller.js
│   │   │   ├── dashboard.controller.js
│   │   │   └── obligation.controller.js
│   │   ├── middleware/
│   │   │   ├── auth.js         # JWT verification & req.user injection
│   │   │   ├── errorHandler.js # Central error handler
│   │   │   └── validate.js     # Express-validator schemas
│   │   ├── models/
│   │   │   ├── Obligation.js   # Obligation Mongoose schema & indexes
│   │   │   └── User.js         # User model with password hashing
│   │   ├── routes/
│   │   │   ├── auth.routes.js
│   │   │   ├── dashboard.routes.js
│   │   │   └── obligation.routes.js
│   │   ├── services/
│   │   │   └── obligation.service.js # Urgency, money leaks, financials
│   │   ├── app.js
│   │   └── server.js
│   ├── tests/
│   │   ├── helpers/
│   │   │   └── testDb.js
│   │   └── api.test.js         # Integration test suite (21 tests)
│   └── package.json
├── .gitignore
├── package.json                # Root package with workspace convenience scripts
└── README.md
```

---

## Environment Configuration

Configure environment variables locally using `.env` files (excluded from Git).

### Backend Variables (`server/.env`)

| Variable | Description | Default / Example |
|---|---|---|
| `PORT` | Port for Express server | `5000` |
| `NODE_ENV` | Runtime environment | `development` |
| `MONGODB_URI` | MongoDB connection string | `mongodb://localhost:27017/lifeledger` |
| `JWT_SECRET` | Secret key for signing session tokens | `<secure-random-secret>` |
| `CLIENT_ORIGIN` | Allowed CORS origin | `http://localhost:5173` |

*Note: In development, if `MONGODB_URI` is omitted or local MongoDB is not running, the server automatically starts an in-memory MongoDB instance for local testing.*

### Frontend Variables (`client/.env`)

| Variable | Description | Default / Example |
|---|---|---|
| `VITE_API_BASE_URL` | Base URL of backend API (empty in dev when using Vite proxy) | `http://localhost:5000` |

---

## Installation & Running Locally

### 1. Prerequisites
- Node.js (v18+)
- npm (v9+)
- MongoDB (optional for local development, as memory fallback is provided)

### 2. Install Dependencies

From root:
```bash
# Install backend dependencies
cd server && npm install && cd ..

# Install frontend dependencies
cd client && npm install && cd ..
```

### 3. Start Development Servers

Run the backend and frontend simultaneously:

**Terminal 1 (Backend API):**
```bash
npm run server
# Server will run on http://localhost:5000
# Health endpoint: http://localhost:5000/api/health
```

**Terminal 2 (Frontend Client):**
```bash
npm run client
# Client will run on http://localhost:5173
```

---

## Running Automated Tests

LifeLedger includes automated integration tests covering health checks, authentication, authorization, CRUD lifecycle, multi-tenant isolation, money leak detection, and filtering:

```bash
npm test
```

Or from the server directory:
```bash
cd server && npm test
```

---

## Production Build

To build the client bundle for production:

```bash
npm run build
```

The compiled assets will be placed in `client/dist/`.

---

## API Endpoints

### Authentication
- `POST /api/auth/register` — Register a new account
- `POST /api/auth/login` — Sign in and obtain JWT
- `POST /api/auth/logout` — Invalidate session cookie
- `GET /api/auth/me` — Retrieve current user profile

### Obligations (Protected)
- `GET /api/obligations` — List obligations (supports `search`, `category`, `status`, `urgency`, `sort`)
- `POST /api/obligations` — Create new obligation
- `GET /api/obligations/:id` — Retrieve single obligation with urgency calculation
- `PATCH /api/obligations/:id` — Update allowlisted fields
- `PATCH /api/obligations/:id/complete` — Mark obligation completed
- `PATCH /api/obligations/:id/cancel` — Mark obligation cancelled
- `DELETE /api/obligations/:id` — Delete obligation

### Dashboard & Analytics (Protected)
- `GET /api/dashboard/summary` — Retrieve dashboard metrics, Money Leak Detector alerts, and financial estimates
