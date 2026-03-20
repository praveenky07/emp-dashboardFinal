# EMP PRO | Enterprise Productivity Dashboard

**EMP PRO** is a high-performance, modern, and fully integrated Employee Productivity Management system. Designed with a clean SaaS-style aesthetic, it empowers organizations to manage team capacity, monitor project risks, and streamline HR workflows through specialized dashboards for Employees, Managers, and Admins.

---

## 🚀 Core Features

### 🏢 Role-Based Dashboards
- **Employee Dashboard**: Manage work sessions, track breaks, view productivity history, and submit leave requests.
- **Manager Dashboard**: Comprehensive team overview with Quick Approvals for leave, department-level metrics, and real-time team capacity tracking.
- **Admin Dashboard**: Advanced system control including user management, role assignment, active session monitoring, and automated database backups.

### ⚡ Interactive Team Pulse
The Manager Dashboard features an intelligent **Team Pulse** section that transforms static alerts into actionable insights:
- **Squad Insight**: Click 'Frontend Squad' to reveal a deep-dive modal showing collective synergy scores, individual member productivity, and precise project status updates.
- **Risk Assessment**: Interactive deadline monitoring that automatically flags 'URGENT' projects (within 7 days of deadline) and suggests mitigation strategies.

### 📊 Advanced Analytics
- **Performance Visualization**: Beautiful, interactive charts (via Recharts) displaying department workload distribution.
- **Productivity Scoring**: Algorithmic productivity calculation based on work duration and session quality.

### 🔐 Enterprise Architecture
- **SaaS-Style UI**: Built with **Tailwind CSS**, **Framer Motion**, and **Inter Typography** for a premium, responsive user experience.
- **Robust Backend**: Node.js & Express API with a tiered SQLite database architecture (primary, logs, and backups).
- **Security**: JWT-based authentication and restricted API access via protected routes.

---

## 🛠️ Technology Stack

| Layer | Technologies |
| :--- | :--- |
| **Frontend** | React, Vite, Tailwind CSS, Framer Motion, Recharts, Lucide-React |
| **Backend** | Node.js, Express |
| **Database** | SQLite (via `better-sqlite3`) |
| **Auth** | JWT (JSON Web Tokens), BCrypt.js |

---

## 📥 Installation & Setup

### 1. Prerequisites
- Node.js (v18.x or higher)
- npm or yarn

### 2. Manual Repository Setup
```bash
# Clone the repository (if applicable)
git clone <repository-url>
cd emp-dashboard
```

### 3. Backend Implementation
```bash
cd backend
npm install
node src/index.js
```
*The backend will start at `http://localhost:5000`. It automatically seeds a demo environment with initial users (Admin/Manager/Employee).*

### 4. Frontend Integration
```bash
cd ../frontend
npm install
npm run dev
```
*The frontend will start at `http://localhost:5173`.*

---

## 📂 Project Structure

```text
emp-dashboard/
├── backend/
│   ├── src/
│   │   ├── controllers/   # Route handlers (Pulse, Leave, Auth)
│   │   ├── db/            # SQLite schema and seeding logic
│   │   ├── middleware/    # Auth and error protection
│   │   └── routes/        # API endpoint definitions
│   └── database.sqlite    # Active production data
├── frontend/
│   ├── src/
│   │   ├── components/    # Reusable UI (Modals, Navigation)
│   │   ├── pages/         # Dashboard views (Admin, Manager, Employee)
│   │   ├── services/      # Axios API configuration
│   │   └── index.css      # Tailwind design system
└── README.md              # Documentation
```

---

## 🔑 Credential Profiles (Demo Only)

| Role | Email | Password |
| :--- | :--- | :--- |
| **Admin** | admin@emp.com | admin123 |
| **Manager** | manager@emp.com | manager123 |
| **Employee** | employee@emp.com | employee123 |

---

## 📌 Development Notes
- **Persistence**: Productivity logs and work sessions are calculated server-side in the `database.sqlite` file.
- **Theme**: The application defaults to a "Crystal Light" theme with Indigo highlights for maximum readability and a professional enterprise feel.
- **Resilience**: Frontend modals utilize optional chaining and defensive state management to handle loading transitions smoothly.

---

**© 2026 EMP PRO | Advanced Agentic Coding Project**
