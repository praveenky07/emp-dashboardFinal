# 🚀 Premium Employee Productivity Dashboard

A state-of-the-art, role-based workforce analytics system built with Node.js, Express, and React. This dashboard empowers organizations to track employee productivity, manage leaves, log meetings, and oversee team performance with a premium, glassmorphism-inspired UI.

## 🛡️ Role-Based Access Control (RBAC)

The system is strictly divided into three tiers of access:

| Role | Access Level | Primary Features |
| :--- | :--- | :--- |
| **Admin** | Full System Control | User Management (CRUD), Bonus Assignment, Global Stats. |
| **Manager** | Team Supervision | Team Directory (View), Leave Approvals, Productivity Metrics. |
| **Employee** | Personal Tracking | Session Tracking (Start/End Work), Break Logging, Leave Application, Meeting Logging. |

---

## ✨ Key Features

### 📊 Dynamic Dashboards
- **Employee View**: Personal "Live Session" timer, pending leave status, and total bonuses earned.
- **Admin/Manager View**: Global overview of present employees, active leaves, and total workforce productivity.

### 👥 User & Team Management
- **Protocol Details**: A comprehensive view for each employee showing their entire activity history (Attendance, Breaks, Leaves, and Meetings).
- **Admin Tools**: Full suite to create, edit, or delete users with secure bcrypt password hashing.

### ⏱️ Workforce Tracking
- **Work Sessions**: Precise start/end logging for daily work sessions.
- **Break Tracker**: Personal and team-wide break monitoring to ensure healthy work-life balance.
- **Meeting Logs**: Archive for logging corporate meetings with duration and descriptions.

### 📅 Resource Planning
- **Leave Management**: Employees apply for leaves; Managers/Admins approve or reject them in real-time.

---

## 🛠️ Tech Stack

- **Frontend**: React 18, React Router 6, Axios, Lucide Icons, Chart.js.
- **Backend**: Node.js, Express.js.
- **Database**: SQLite (Zero-config, embedded).
- **Security**: JWT (JSON Web Tokens) for session management, Bcrypt for password encryption.
- **Styling**: Vanilla CSS with modern Glassmorphism and Backdrop-filter effects.

---

## 🚀 Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) (v16 or higher)
- npm (distributed with Node.js)

### Installation

1. **Clone the repository**:
   ```ps
   cd c:\NewDashboard\employee-dashboard
   ```

2. **Install Backend Dependencies**:
   ```ps
   cd backend
   npm install
   ```

3. **Install Frontend Dependencies**:
   ```ps
   cd ../frontend
   npm install
   ```

### Running the Application

To run both parts of the program simultaneously with a single command (PowerShell):

```powershell
Start-Process node -ArgumentList "server.js" -WorkingDirectory "c:\NewDashboard\employee-dashboard\backend"; Start-Process cmd -ArgumentList "/c set BROWSER=none && npm.cmd start" -WorkingDirectory "c:\NewDashboard\employee-dashboard\frontend"
```

---

## 🔑 Default Credentials

For testing purposes, the following accounts are pre-configured:

| Role | Username | Password |
| :--- | :--- | :--- |
| **Admin** | `admin` | `admin123` |
| **Manager** | `mgr1` | `password123` |
| **Employee** | `emp1` | `password123` |

---

## 📂 Project Structure

```text
employee-dashboard/
├── backend/            # Express Server, API Routes, Logic
│   ├── controllers/    # Request handlers (Attendance, Leaves, etc.)
│   ├── database/       # SQLite database & Schema
│   ├── middleware/     # Auth & RBAC logic
│   └── routes/         # API endpoint definitions
├── frontend/           # React Application
│   ├── src/
│   │   ├── api/        # Axios API service
│   │   ├── components/ # Reusable UI components (Tables, Sidebar)
│   │   ├── pages/      # View components (Dashboard, Management)
│   │   └── styles/     # Premium CSS modules
└── README.md           # You are here!
```

---

## 🎨 Design Philosophy
The UI follows a **Glassmorphism** aesthetic, utilizing:
- **Translucent Backgrounds**: Layered effects for depth.
- **Backdrop-Filters**: High-quality blur for focus and premium feel.
- **Vibrant Gradients**: Indigo-to-Purple transitions for actionable elements.
- **Responsive Layout**: Designed for both clarity and density of information.

---
© 2026 Employee Productivity Dashboard Project.