# LifeLedger — Personal Obligation Intelligence

**Take control of your commitments. Stay ahead of deadlines. Protect your money.**

LifeLedger is a personal life administration and financial awareness application designed to help you organize important responsibilities, track deadlines, manage recurring commitments, and identify potential financial losses before they happen.

Instead of keeping subscriptions, bills, warranties, returns, insurance policies, and renewal dates scattered across different apps, LifeLedger brings them together in one centralized dashboard.

## 🚀 Live Demo

**[Explore LifeLedger](https://life-ledger-gold.vercel.app/login)**

Create an account to access your personal dashboard and manage your obligations.

## ✨ Features

### 📊 Intelligent Dashboard
- Get an overview of active, overdue, upcoming, and completed obligations.
- Monitor important deadlines and financial commitments.
- View key statistics and financial insights in one place.
- Identify responsibilities that need immediate attention.

### 💸 Money Leak Detector
- Highlights overdue obligations and deadlines approaching soon.
- Uses transparent, rule-based urgency detection.
- Provides suggested actions to help reduce avoidable financial losses.
- Helps you stay aware of expiring return windows, unpaid bills, and other time-sensitive commitments.

### 📅 Obligation Management
Create, view, update, complete, cancel, and delete personal obligations across multiple categories:

- Subscriptions
- Bills and utilities
- Purchases and return windows
- Warranties
- Insurance
- Document renewals
- Custom obligations

Each record can include relevant dates, financial details, descriptions, notes, and supporting attachments.

### 🔁 Recurring Commitments
- Track recurring expenses and financial obligations.
- Calculate estimated monthly recurring expenses.
- View projected annual commitments based on active recurring records.
- Understand upcoming financial responsibilities before they become urgent.

*Financial projections are estimates derived from the information recorded in the application.*

### 📈 Money Outlook
Explore financial summaries and visualizations that help you understand recurring commitments, upcoming expenses, and potential money leaks.

### 🔔 Notifications and Activity History
- Keep track of important updates and obligation-related events.
- Review activity history to understand changes made to your records.
- Stay informed about responsibilities that require attention.

### 📎 Attachment Support
Attach supporting documents to relevant obligations, such as receipts, warranty documents, or other records.

### 🔐 Authentication and Data Isolation
- User registration and login.
- Password hashing using bcrypt.
- JWT-based authentication.
- Server-side authorization and user-specific data access.
- Request validation and centralized error handling.

## 🛠️ Tech Stack

| Layer | Technologies |
|---|---|
| Frontend | React 19, Vite |
| Styling | Tailwind CSS |
| Routing | React Router |
| Charts | Recharts |
| Animations | Framer Motion |
| Icons | Lucide React |
| Backend | Node.js, Express.js |
| Database | MongoDB, Mongoose |
| Authentication | JWT, bcryptjs |
| Validation | Express Validator |
| File Storage | Cloudinary |

## 🏗️ Project Structure

```text
LifeLedger/
├── client/
│   ├── src/
│   │   ├── api/             # API client
│   │   ├── components/      # Reusable UI components
│   │   ├── context/         # Authentication context
│   │   ├── pages/           # Application pages
│   │   ├── utils/           # Formatting and utilities
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── index.html
│   ├── package.json
│   └── vite.config.js
│
├── server/
│   ├── src/
│   │   ├── config/          # Database and storage configuration
│   │   ├── controllers/     # Request handlers
│   │   ├── middleware/      # Authentication and validation
│   │   ├── models/          # Mongoose models
│   │   ├── routes/          # API routes
│   │   ├── services/        # Business logic
│   │   ├── app.js
│   │   └── server.js
│   ├── tests/
│   ├── package.json
│   └── example.env
│
├── package.json
└── README.md
```

## ⚙️ Getting Started

### Prerequisites

Install the following:

- Node.js 18 or later
- npm
- A MongoDB instance or MongoDB Atlas account
- A Cloudinary account for attachment storage

### 1. Clone the Repository

```bash
git clone https://github.com/0NYX07/LifeLedger.git
cd LifeLedger
```

### 2. Install Dependencies

Install the backend dependencies:

```bash
cd server
npm install
cd ..
```

Install the frontend dependencies:

```bash
cd client
npm install
cd ..
```

### 3. Configure Environment Variables

Create `server/.env` using `server/example.env` as a reference.

Configure the following variables with your own values:

| Variable | Purpose |
|---|---|
| `PORT` | Local backend port |
| `NODE_ENV` | Runtime environment |
| `MONGODB_URI` | MongoDB connection string |
| `JWT_SECRET` | Secret used for signing JWTs |
| `CLIENT_ORIGIN` | Allowed frontend origin for CORS |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary account cloud name |
| `CLOUDINARY_API_KEY` | Cloudinary API key |
| `CLOUDINARY_API_SECRET` | Cloudinary API secret |
| `MAX_FILE_SIZE_BYTES` | Maximum attachment size in bytes |

For the frontend, configure `client/.env` with the API base URL variable used by the application. In production, it should point to the deployed backend API.

**Security:** Never commit `.env` files, database credentials, JWT secrets, or Cloudinary API secrets to version control.

### 4. Start the Backend

Open a terminal:

```bash
cd server
npm run dev
```

### 5. Start the Frontend

Open another terminal:

```bash
cd client
npm run dev
```

Open the local URL printed by Vite in your terminal.

## 🧪 Testing

Run the backend test suite:

```bash
cd server
npm test
```

Verify the configured Cloudinary credentials:

```bash
npm run verify-cloudinary
```

Build the frontend for production:

```bash
cd client
npm run build
```

## 🌐 Deployment

The frontend is deployed on Vercel.

**[Open the Live Application](https://life-ledger-gold.vercel.app/login)**

The application requires the backend, database, and attachment storage to be configured correctly for all features to work in production. Configure secrets through the deployment platform's environment-variable settings rather than committing them to the repository.

## 🎯 Project Goal

LifeLedger aims to make personal administration more organized, proactive, and financially aware.

By combining obligation tracking, deadline intelligence, recurring expense projections, activity history, and supporting documents in one application, it helps users move from remembering responsibilities manually to managing them systematically.

---

**LifeLedger — Remember what matters. Act before it costs you.**