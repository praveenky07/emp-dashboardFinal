import React, { useState, useEffect } from 'react';
import { HashRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useUser } from './context/UserContext';
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
import ChatPage from './pages/ChatPage';
import JoinMeeting from './pages/JoinMeeting';
import VideoCall from './pages/VideoCall';

import Settings from './pages/Settings';
import AuditLogs from './pages/AuditLogs';
import Layout from './components/Layout';
import ErrorBoundary from './components/ErrorBoundary';

import { AnimatePresence } from 'framer-motion';

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, loading } = useUser();
  const token = localStorage.getItem('token');
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
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
    const { user, loading } = useUser();

    if (loading) return null;
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
               <Route path="/chat" element={<ChatPage />} />
               <Route path="/meet/:meetingId" element={<JoinMeeting />} />
               <Route path="/call/:roomId" element={<VideoCall />} />

               <Route path="/settings" element={<Settings />} />
               <Route path="/admin/logs" element={<ProtectedRoute allowedRoles={['admin']}><AuditLogs /></ProtectedRoute>} />
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </AnimatePresence>
      </ErrorBoundary>
    </Router>
  );
}


export default App;
