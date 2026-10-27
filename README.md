# LifeLedger — Personal Obligation Intelligence

**Take control of your commitments. Stay ahead of deadlines. Protect your money.**

LifeLedger is a personal obligation management and financial awareness application that helps users organize important responsibilities, track deadlines, manage recurring commitments, and identify potential financial losses before they happen.

Instead of keeping subscriptions, bills, warranties, return deadlines, and renewals scattered across different places, LifeLedger brings them together in one centralized dashboard.

## 🚀 Live Demo

**https://drive.google.com/file/d/1QaKg6j3gv2f0eKnojw54Qs75yaUB8cx5/view?usp=sharing**

## ✨ Features

### 📊 Intelligent Dashboard
- Overview of active, overdue, upcoming, and completed obligations.
- Key financial statistics and insights.
- Quick visibility into responsibilities requiring attention.

### 💸 Money Leak Detection
- Identify overdue obligations and approaching deadlines.
- Highlight potential avoidable financial losses.
- Prioritize important actions before deadlines are missed.

### 📅 Obligation Management
Manage different types of personal obligations, including:
- Subscriptions and recurring bills
- Product return windows
- Warranties and insurance
- Document renewals
- Custom commitments

Record relevant dates, amounts, descriptions, notes, and supporting attachments.

### 🔁 Recurring Commitments
- Track recurring expenses and financial obligations.
- Estimate monthly recurring expenses.
- View projected annual commitments based on recorded data.

### 📈 Money Outlook
Explore financial summaries and visualizations to understand upcoming expenses, recurring commitments, and potential money leaks.

### 🔔 Notifications and Activity History
- Keep track of important updates.
- Review activity associated with your obligations.
- Stay informed about responsibilities that need attention.

### 📎 Attachment Support
Attach relevant documents, such as receipts and warranty information, to your obligations.

### 🔐 Authentication and Data Security
- User registration and login.
- Password hashing.
- JWT-based authentication.
- User-specific data access and protected routes.

## 🛠️ Tech Stack

| Layer | Technologies |
|---|---|
| Frontend | React, Vite |
| Styling | Tailwind CSS |
| Routing | React Router |
| Charts | Recharts |
| Animations | Framer Motion |
| Icons | Lucide React |
| Backend | Node.js, Express.js |
| Database | MongoDB, Mongoose |
| Authentication | JWT, bcryptjs |
| File Storage | Cloudinary |

## 🏗️ Project Structure

```text
LifeLedger/
├── client/
│   ├── src/
│   │   ├── api/
│   │   ├── components/
│   │   ├── context/
│   │   ├── pages/
│   │   ├── utils/
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── package.json
│   └── vite.config.js
│
├── server/
│   ├── src/
│   │   ├── config/
│   │   ├── controllers/
│   │   ├── middleware/
│   │   ├── models/
│   │   ├── routes/
│   │   ├── services/
│   │   ├── app.js
│   │   └── server.js
│   └── package.json
│
└── README.md
```

## ⚙️ Getting Started

### Prerequisites
- Node.js and npm
- MongoDB or MongoDB Atlas
- Cloudinary account for attachment storage

### 1. Clone the Repository

```bash
git clone https://github.com/0NYX07/LifeLedger.git
cd LifeLedger
```

### 2. Install Dependencies

```bash
cd server && npm install
cd ../client && npm install
```

### 3. Configure Environment Variables

Create the backend environment file at `server/.env` and configure the variables required by the application:

```dotenv
PORT=5000
NODE_ENV=development
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_generated_random_secret
CLIENT_ORIGIN=http://localhost:5173
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
MAX_FILE_SIZE_BYTES=5242880
```

Configure the frontend API base URL using the environment variable expected by the existing client code.

Never commit real credentials or secrets to version control.

### 4. Run the Backend

```bash
cd server
npm run dev
```

### 5. Run the Frontend

In a separate terminal:

```bash
cd client
npm run dev
```

Open the local URL provided by Vite.

## 🌐 Deployment
 
LifeLedger's frontend is deployed on Vercel.
 
The application requires its backend, database, and file-storage services to be configured correctly for all features to function.
 
### Vercel Project Configuration:
- **Framework Preset**: `Vite`
- **Root Directory**: `client`
- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- **Install Command**: `npm install`
- **Environment Variables**:

## 🎯 Project Objective

LifeLedger aims to make personal administration more organized, proactive, and financially aware. By combining obligation tracking, deadline management, recurring expense projections, and supporting documents in one place, it helps users manage their responsibilities systematically.

---

**LifeLedger — Remember what matters. Act before it costs you.**
