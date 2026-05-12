# AI-Powered Realtime Hospital Management System (MedFlow)

MedFlow is a comprehensive, modern hospital management system built with the MERN stack, featuring real-time capabilities, AI-driven diagnostics, and a robust role-based access control system.

## 🚀 Quick Start

Follow these steps to get the project up and running on your local machine.

### Prerequisites
- [Node.js](https://nodejs.org/) (v18 or higher recommended)
- [MongoDB](https://www.mongodb.com/try/download/community) (Local or Atlas)
- npm or yarn

---

### 🛠️ 1. Backend Setup

1. **Navigate to backend directory:**
   ```bash
   cd backend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure Environment Variables:**
   Create a `.env` file in the `backend` folder and copy content from `.env.example`. Ensure `MONGO_URI` is correctly set.
   ```env
   PORT=5000
   MONGO_URI=your_mongodb_uri
   BETTER_AUTH_SECRET=your_secret
   BETTER_AUTH_URL=http://localhost:5001
   FRONTEND_URL=http://localhost:5173
   GEMINI_KEY=your_google_ai_key
   ```

4. **Seed Admin Account:**
   Run the seed script to create the initial admin user.
   ```bash
   npm run seed
   ```

5. **Start the server:**
   ```bash
   npm run dev
   ```
   The backend will run on `http://localhost:5001`.

---

### 💻 2. Frontend Setup

1. **Navigate to frontend directory:**
   ```bash
   cd ../frontend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure Environment Variables:**
   Create a `.env` file in the `frontend` folder.
   ```env
   VITE_API_URL=http://localhost:5001
   VITE_SOCKET_URL=http://localhost:5001
   ```

4. **Start the development server:**
   ```bash
   npm run dev
   ```
   The frontend will run on `http://localhost:5173`.

---

### 🔑 Admin Credentials

Once the system is running and you have executed the seed script, you can log in with:

- **Email:** `admin@hospital.com`
- **Password:** `123456789`

---

## ✨ Features

- **Real-time Synchronization:** Powered by Socket.io for instant updates across all dashboards.
- **AI Diagnostics:** Integration with Google Gemini for X-Ray analysis and medical assistance.
- **Role-Based Access Control:** Distinct interfaces for Admins, Doctors, Patients, Nurses, and Pharmacists.
- **Inventory Management:** Full tracking of pharmacy stock and medical supplies.
- **Automated Workflows:** Background jobs using Inngest for reminders and notifications.
- **Comprehensive Reporting:** Lab results, invoices, and activity logs.

## 🏗️ Tech Stack

- **Frontend:** React (React Router 7), Tailwind CSS, Lucide Icons, Shadcn/UI.
- **Backend:** Node.js, Express, MongoDB (Mongoose), Better-Auth.
- **Real-time:** Socket.io.
- **AI:** Google Generative AI (Gemini).
- **Workflows:** Inngest.
