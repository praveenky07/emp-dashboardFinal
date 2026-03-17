import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Users, Clock, CalendarDays, Coffee, Gift, LogOut, Video } from 'lucide-react';

const Sidebar = () => {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const role = user.role || '';

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login';
  };

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <h2>EmpDash</h2>
        <div className="user-role-badge">{role}</div>
      </div>
      
      <div className="sidebar-menu">
        <NavLink to="/" className={({isActive}) => isActive ? "menu-item active" : "menu-item"} end>
          <LayoutDashboard /> Dashboard
        </NavLink>

        <NavLink to={`/employee/${user.id}`} className={({isActive}) => isActive ? "menu-item active" : "menu-item"}>
          <Users /> My Profile
        </NavLink>

        {role === 'Admin' && (
          <NavLink to="/employees" className={({isActive}) => isActive ? "menu-item active" : "menu-item"}>
            <Users /> User Management
          </NavLink>
        )}

        {role === 'Manager' && (
          <NavLink to="/employees" className={({isActive}) => isActive ? "menu-item active" : "menu-item"}>
            <Users /> Team Directory
          </NavLink>
        )}

        <NavLink to="/attendance" className={({isActive}) => isActive ? "menu-item active" : "menu-item"}>
          <Clock /> {role === 'Employee' ? 'Session Tracking' : 'Attendance'}
        </NavLink>

        <NavLink to="/leaves" className={({isActive}) => isActive ? "menu-item active" : "menu-item"}>
          <CalendarDays /> {role === 'Employee' ? 'Apply Leave' : 'Leave Approvals'}
        </NavLink>

        <NavLink to="/breaks" className={({isActive}) => isActive ? "menu-item active" : "menu-item"}>
          <Coffee /> {role === 'Employee' ? 'Break Tracker' : 'Team Breaks'}
        </NavLink>

        {(role === 'Admin' || role === 'Manager') && (
          <NavLink to="/bonuses" className={({isActive}) => isActive ? "menu-item active" : "menu-item"}>
            <Gift /> {role === 'Admin' ? 'Bonus Management' : 'Productivity'}
          </NavLink>
        )}

        <NavLink to="/meetings" className={({isActive}) => isActive ? "menu-item active" : "menu-item"}>
          <Video /> {role === 'Employee' ? 'Meeting Logging' : 'Corporate Meetings'}
        </NavLink>
      </div>

      <div style={{ padding: '1.5rem', borderTop: '1px solid var(--border-color)' }}>
        <button onClick={handleLogout} className="menu-item" style={{ width: '100%', padding: '0.75rem 0' }}>
          <LogOut /> Logout
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
