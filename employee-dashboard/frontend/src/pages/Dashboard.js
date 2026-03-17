import React, { useState, useEffect } from 'react';
import { Users, UserCheck, CalendarOff, Gift, Clock } from 'lucide-react';
import { dashboardAPI, attendanceAPI } from '../api/api';
import Charts from '../components/Charts';

const Dashboard = () => {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const role = user.role || '';
  
  const [stats, setStats] = useState({
    // Shared or Admin/Manager stats
    totalEmployees: 0,
    employeesPresentToday: 0,
    employeesOnLeave: 0,
    totalBonusesDistributed: 0,
    totalWorkingHoursToday: 0,
    // Employee specifically
    todaySession: null,
    pendingLeaves: 0,
    totalBonuses: 0,
    workHoursToday: 0
  });

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await dashboardAPI.getStats();
      setStats(response.data);
    } catch (error) {
      console.error('Failed to fetch dashboard stats', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div>Loading dashboard...</div>;

  return (
    <div>
      <div className="page-header">
        <h1>{role === 'Employee' ? `Welcome, ${user.name}` : 'Dashboard Overview'}</h1>
        <div style={{ display: 'flex', gap: '1rem' }}>
          {role === 'Employee' && (
            <>
              {!stats.todaySession ? (
                <button 
                  className="btn btn-primary" 
                  style={{ background: 'var(--grad-primary)', border: 'none' }}
                  onClick={async () => {
                    try {
                      const now = new Date();
                      const dateStr = now.toISOString().split('T')[0];
                      const timeStr = now.toISOString().substring(0, 16);
                      await attendanceAPI.checkIn({
                        date: dateStr,
                        check_in_time: timeStr
                      });
                      fetchStats();
                      alert('Session started! Have a productive day.');
                    } catch (err) {
                      alert(err.response?.data?.message || 'Failed to start session');
                    }
                  }}
                >
                  START SESSION
                </button>
              ) : (
                !stats.todaySession.check_out && (
                  <button 
                    className="btn btn-danger" 
                    onClick={async () => {
                      try {
                        const now = new Date();
                        const dateStr = now.toISOString().split('T')[0];
                        const timeStr = now.toISOString().substring(0, 16);
                        
                        const checkinTime = new Date(stats.todaySession.check_in);
                        const diffHrs = (now - checkinTime) / (1000 * 60 * 60);

                        await attendanceAPI.checkOut({
                          date: dateStr,
                          check_out_time: timeStr,
                          work_hours: diffHrs > 0 ? diffHrs : 0
                        });
                        fetchStats();
                        alert('Session concluded successfully!');
                      } catch (err) {
                        alert('Failed to conclude session');
                      }
                    }}
                  >
                    CONCLUDE SESSION
                  </button>
                )
              )}
            </>
          )}
          <button className="btn btn-primary" onClick={fetchStats}>Refresh Data</button>
        </div>
      </div>

      <div className="stats-grid">
        {role === 'Employee' ? (
          <>
            <div className="stat-card">
              <div className="stat-icon primary">
                <Clock size={24} />
              </div>
              <div className="stat-details">
                <h3>Hours Today</h3>
                <p>{parseFloat(stats.workHoursToday).toFixed(1)}h</p>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon warning">
                <CalendarOff size={24} />
              </div>
              <div className="stat-details">
                <h3>Pending Leaves</h3>
                <p>{stats.pendingLeaves}</p>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon success">
                <Gift size={24} />
              </div>
              <div className="stat-details">
                <h3>Total Bonuses</h3>
                <p>${stats.totalBonuses.toLocaleString()}</p>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon primary">
                <UserCheck size={24} />
              </div>
              <div className="stat-details">
                <h3>Status</h3>
                <p>{stats.todaySession ? (stats.todaySession.check_out ? 'Finished' : 'Working') : 'Not Started'}</p>
              </div>
            </div>
          </>
        ) : (
          <>
            <div className="stat-card">
              <div className="stat-icon primary">
                <Users size={24} />
              </div>
              <div className="stat-details">
                <h3>Total Employees</h3>
                <p>{stats.totalEmployees}</p>
              </div>
            </div>
            
            <div className="stat-card">
              <div className="stat-icon success">
                <UserCheck size={24} />
              </div>
              <div className="stat-details">
                <h3>Present Today</h3>
                <p>{stats.employeesPresentToday}</p>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon warning">
                <CalendarOff size={24} />
              </div>
              <div className="stat-details">
                <h3>On Leave</h3>
                <p>{stats.employeesOnLeave}</p>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon danger">
                <Gift size={24} />
              </div>
              <div className="stat-details">
                <h3>Total Bonuses</h3>
                <p>${parseFloat(stats.totalBonusesDistributed).toLocaleString()}</p>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon primary">
                <Clock size={24} />
              </div>
              <div className="stat-details">
                <h3>Total Work Hours</h3>
                <p>{parseFloat(stats.totalWorkingHoursToday).toFixed(1)}h</p>
              </div>
            </div>
          </>
        )}
      </div>

      {role !== 'Employee' && (
        <div className="charts-grid">
          <div className="chart-card">
            <h3>Attendance Trend (Last 5 Days)</h3>
            <div style={{ height: '300px', marginTop: '1rem' }}>
               <Charts type="attendance" data={stats.attendanceTrend} />
            </div>
          </div>
          <div className="chart-card">
            <h3>Leave Distribution</h3>
            <div style={{ height: '300px', marginTop: '1rem' }}>
               <Charts type="leaves" data={stats.leaveDistribution} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
