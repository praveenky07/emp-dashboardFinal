import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import EmployeeDashboard from './pages/EmployeeDashboard';
import ManagerDashboard from './pages/ManagerDashboard';
import AdminPanel from './pages/AdminPanel';
import LeaveTracker from './pages/LeaveTracker';
import Layout from './components/Layout';

import { AnimatePresence } from 'framer-motion';

const ProtectedRoute = ({ children, allowedRoles }) => {
  const user = JSON.parse(localStorage.getItem('user'));
  const token = localStorage.getItem('token');
  const location = useLocation();

  if (!token || !user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && !allowedRoles.map(r => r.toLowerCase()).includes(user.role?.toLowerCase())) {
    return <Navigate to="/" replace />;
  }

  return children;
};

const RoleBasedRedirect = () => {
    const user = JSON.parse(localStorage.getItem('user'));
    if (!user) return <Navigate to="/login" />;
    
    const role = user.role?.toLowerCase();
    if (role === 'admin') return <Navigate to="/admin" />;
    if (role === 'manager') return <Navigate to="/manager" />;
    return <Navigate to="/dashboard" />;
}

function App() {
  return (
    <Router>
      <AnimatePresence mode="wait">
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          
          <Route path="/" element={
            <ProtectedRoute>
              <Layout>
                <RoleBasedRedirect />
              </Layout>
            </ProtectedRoute>
          } />

          <Route path="/dashboard" element={
            <ProtectedRoute allowedRoles={['employee', 'manager', 'admin']}>
              <Layout>
                <EmployeeDashboard />
              </Layout>
            </ProtectedRoute>
          } />

          <Route path="/manager" element={
            <ProtectedRoute allowedRoles={['manager', 'admin']}>
              <Layout>
                <ManagerDashboard />
              </Layout>
            </ProtectedRoute>
          } />

          <Route path="/admin" element={
            <ProtectedRoute allowedRoles={['admin']}>
              <Layout>
                <AdminPanel />
              </Layout>
            </ProtectedRoute>
          } />

          <Route path="/leave" element={
            <ProtectedRoute allowedRoles={['employee', 'manager', 'admin']}>
              <Layout>
                <LeaveTracker />
              </Layout>
            </ProtectedRoute>
          } />

          
          {/* Default catch-all */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AnimatePresence>
    </Router>
  );
}

export default App;
