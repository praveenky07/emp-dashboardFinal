import React, { useState, useEffect } from 'react';
import { HashRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import EmployeeDashboard from './pages/EmployeeDashboard';
import ManagerDashboard from './pages/ManagerDashboard';
import AdminPanel from './pages/AdminPanel';
import LeaveTracker from './pages/LeaveTracker';
import PayrollPage from './pages/PayrollPage';
import BenefitsPage from './pages/BenefitsPage';
import SupportPage from './pages/SupportPage';
import PerformancePage from './pages/PerformancePage';
import MeetingsPage from './pages/MeetingsPage';
import AttendancePage from './pages/AttendancePage';
import JoinMeeting from './pages/JoinMeeting';
import Settings from './pages/Settings';
import Layout from './components/Layout';
import ErrorBoundary from './components/ErrorBoundary';

import { AnimatePresence } from 'framer-motion';

const ProtectedRoute = ({ children, allowedRoles }) => {
  let user = null;
  const token = localStorage.getItem('token');
  const location = useLocation();

  try {
    const userData = localStorage.getItem('user');
    user = userData ? JSON.parse(userData) : null;
  } catch (err) {
    console.error('Invalid user data in localStorage', err);
    user = null;
  }

  if (!token || !user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && !allowedRoles.map(r => r.toLowerCase()).includes(user.role?.toLowerCase())) {
    return <Navigate to="/" replace />;
  }

  return children;
};

const RoleBasedRedirect = () => {
    let user = null;
    try {
        const userData = localStorage.getItem('user');
        user = userData ? JSON.parse(userData) : null;
    } catch (err) {
        console.error('Invalid user data in redirect', err);
        user = null;
    }

    if (!user) return <Navigate to="/login" />;
    
    const role = user.role?.toLowerCase();
    if (role === 'admin') return <Navigate to="/admin" />;
    if (role === 'manager') return <Navigate to="/manager" />;
    return <Navigate to="/dashboard" />;
}

function App() {
  return (
    <Router>
      <ErrorBoundary>
        <AnimatePresence mode="wait">
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            
            <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
               <Route path="/" element={<RoleBasedRedirect />} />
               <Route path="/dashboard" element={<EmployeeDashboard />} />
               <Route path="/payroll" element={<PayrollPage />} />
               <Route path="/benefits" element={<BenefitsPage />} />
               <Route path="/support" element={<SupportPage />} />
               <Route path="/performance" element={<PerformancePage />} />
               <Route path="/manager" element={<ManagerDashboard />} />
               <Route path="/admin" element={<AdminPanel />} />
               <Route path="/leave" element={<LeaveTracker />} />
               <Route path="/meetings" element={<MeetingsPage />} />
               <Route path="/attendance" element={<AttendancePage />} />
               <Route path="/meet/:meetingId" element={<JoinMeeting />} />
               <Route path="/settings" element={<Settings />} />
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </AnimatePresence>
      </ErrorBoundary>
    </Router>
  );
}


export default App;
