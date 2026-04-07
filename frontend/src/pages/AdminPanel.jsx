import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import socket from '../services/socket';
import DetailModal from '../components/DetailModal';
import { handleError } from '../utils/handleError';

import { 
  ShieldCheck, 
  UserPlus, 
  Trash2, 
  Edit3, 
  Settings, 
  History,
  Activity,
  AlertTriangle,
  Save,
  Lock,
  MoreVertical,
  Users as UsersIcon,
  Search,
  Plus,
  ArrowRight,
  Database,
  Cpu,
  LogOut,
  ChevronRight,
  Clock,
  HardDrive,
  Activity as ActivityIcon,
  Server,
  CloudLightning,
  CheckCircle,
  Download,
  Building2,
  Trash,
  Calendar,
  Heart,
  Coffee,
  Users,
  Film,
  Video as VideoIcon,
  Zap
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// Defined locally to prevent ReferenceError: SnapshotCard is not defined
const SnapshotCard = ({ icon: Icon, label, value, color, bgColor, onClick }) => (
  <div 
    onClick={onClick}
    className="bg-white p-5 rounded-2xl border border-[#e5e7eb] flex items-center gap-4 group hover:border-indigo-500 hover:shadow-md transition-all cursor-pointer w-full text-left"
  >
    <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all group-hover:bg-indigo-600 group-hover:text-white shrink-0 ${bgColor || 'bg-slate-50'} ${color || 'text-slate-600'}`}>
      {Icon && <Icon size={24} />}
    </div>
    <div className="min-w-0">
      <p className="text-[#6b7280] text-[11px] font-bold uppercase tracking-wider mb-1 truncate">{label}</p>
      <p className="text-lg font-bold text-[#111827]">{value || 0}</p>
    </div>
  </div>
);

const AdminPanel = () => {
    const [users, setUsers] = useState([]);
    const [logs, setLogs] = useState([]);
    const [settings, setSettings] = useState([]);
    const [activeSessions, setActiveSessions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [adminStats, setAdminStats] = useState({ totalUsers: 0, activeSessions: 0, pendingLeaves: 0, totalMeetings: 0, totalLeaves: 0 });
    const [onlineUsers, setOnlineUsers] = useState(1);
    const [leaveBalance, setLeaveBalance] = useState({ total_leaves: 0, used_leaves: 0, remaining_leaves: 0 });
    const [allLeaveBalances, setAllLeaveBalances] = useState([]);
    const [allAttendance, setAllAttendance] = useState([]);
    
    // UI state
    const [activeModal, setActiveModal] = useState(null); // 'addUser', 'editUser', 'usersList', 'sessions', 'storage', 'metrics'
    const [newUser, setNewUser] = useState({ name: '', email: '', password: '', role: 'employee', department_id: '', salary: 0 });
    const [editUser, setEditUser] = useState(null);
    const [departments, setDepartments] = useState([]);
    const [salaryHistory, setSalaryHistory] = useState([]);
    const [deptToEdit, setDeptToEdit] = useState(null);
    const [newDeptName, setNewDeptName] = useState('');
    const [backingUp, setBackingUp] = useState(false);
    const [newAdjustment, setNewAdjustment] = useState({ user_id: '', amount: '', type: 'bonus', description: '', month: 'January', year: new Date().getFullYear() });

    const fetchData = async () => {
        try {
            const results = await Promise.allSettled([
                api.get('/admin/users'),
                api.get('/admin/logs'),
                api.get('/admin/settings'),
                api.get('/admin/active-sessions'),
                api.get('/departments'),
                api.get('/leave/balance/my'),
                api.get('/admin/stats'),
                api.get('/attendance/admin'),
                api.get('/leave/balance/all')
            ]);
            
            if (results[0].status === 'fulfilled') setUsers(Array.isArray(results[0].value.data) ? results[0].value.data : []);
            if (results[1].status === 'fulfilled') setLogs(Array.isArray(results[1].value.data) ? results[1].value.data : []);
            if (results[2].status === 'fulfilled') setSettings(Array.isArray(results[2].value.data) ? results[2].value.data : []);
            if (results[3].status === 'fulfilled') setActiveSessions(Array.isArray(results[3].value.data) ? results[3].value.data : []);
            if (results[4].status === 'fulfilled') setDepartments(Array.isArray(results[4].value.data) ? results[4].value.data : []);
            if (results[5].status === 'fulfilled') setLeaveBalance(results[5].value.data || { total_leaves: 0, used_leaves: 0, remaining_leaves: 0 });
            if (results[6].status === 'fulfilled') setAdminStats(results[6].value.data || { totalUsers: 0, activeSessions: 0, pendingLeaves: 0, totalMeetings: 0, totalLeaves: 0 });
            if (results[7].status === 'fulfilled') setAllAttendance(results[7].value.data || []);
            if (results[8].status === 'fulfilled') setAllLeaveBalances(results[8].value.data || []);
            
            // Log any failures
            results.forEach((res, i) => {
                if (res.status === 'rejected') console.warn(`API call ${i} failed:`, res.reason);
            });

        } catch (err) { 
            console.error('Critical failure in admin data fetching', err);
        } finally { 
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();

        const handleRemoteUpdate = () => fetchData();
        
        socket.on('attendanceUpdated', handleRemoteUpdate);
        socket.on('attendanceStarted', handleRemoteUpdate);
        socket.on('attendanceEnded', handleRemoteUpdate);
        socket.on('leaveRequested', handleRemoteUpdate);
        socket.on('leaveApproved', handleRemoteUpdate);
        socket.on('leaveRejected', handleRemoteUpdate);
        socket.on('userCreated', handleRemoteUpdate);
        socket.on('userDeleted', handleRemoteUpdate);
        socket.on('statsUpdated', handleRemoteUpdate);
        
        const handleSessionCount = (count) => setOnlineUsers(count);
        socket.on('activeUsersUpdated', handleSessionCount);

        return () => {
            socket.off('attendanceUpdated', handleRemoteUpdate);
            socket.off('attendanceStarted', handleRemoteUpdate);
            socket.off('attendanceEnded', handleRemoteUpdate);
            socket.off('leaveRequested', handleRemoteUpdate);
            socket.off('leaveApproved', handleRemoteUpdate);
            socket.off('leaveRejected', handleRemoteUpdate);
            socket.off('userCreated', handleRemoteUpdate);
            socket.off('userDeleted', handleRemoteUpdate);
            socket.off('statsUpdated', handleRemoteUpdate);
            socket.off('activeUsersUpdated', handleSessionCount);
        };
    }, []);

    const handleCreateUser = async (e) => {
        e.preventDefault();
        try {
            await api.post('/auth/register', newUser);
            setActiveModal(null);
            setNewUser({ name: '', email: '', password: '', role: 'employee', department_id: departments[0]?.id || '', salary: 0 });
            fetchData();
        } catch (err) { handleError(err) }

    };

    const handleDeleteUser = async (id) => {
        if (!window.confirm('Are you sure you want to delete this user?')) return;
        try {
            await api.delete(`/admin/user/${id}`);
            fetchData();
        } catch (err) { handleError(err) }

    };

    const handleUpdateUser = async (e) => {
        e.preventDefault();
        try {
            await api.post('/admin/update-employee', editUser);
            setActiveModal(null);
            setEditUser(null);
            fetchData();
        } catch (err) { handleError(err) }

    };

    const handleUpdateSetting = async (key, value) => {
        try {
            await api.post('/admin/settings', { key, value });
            fetchData();
        } catch (err) { handleError(err) }

    };

    const fetchSalaryHistory = async (userId) => {
        try {
            const { data } = await api.get(`/admin/salary-history?userId=${userId}`);
            setSalaryHistory(data || []);
            setActiveModal('salaryHistory');
        } catch (err) { handleError(err) }

    };

    const handleBackup = async () => {
        try {
            setBackingUp(true);
            const { data } = await api.post('/admin/backup');
            alert(data.message);
        } catch (err) { handleError(err) }

        finally { setBackingUp(false); }
    };

    const handleAddAdjustment = async (e) => {
        e.preventDefault();
        try {
            await api.post('/adjustments/add', newAdjustment);
            setActiveModal(null);
            setNewAdjustment({ user_id: '', amount: '', type: 'bonus', description: '', month: 'January', year: new Date().getFullYear() });
            alert('Salary adjustment added successfully');
        } catch (err) { handleError(err) }

    };

    const handleCreateDept = async (e) => {
        e.preventDefault();
        try {
            await api.post('/departments', { name: newDeptName });
            setNewDeptName('');
            setActiveModal(null);
            fetchData();
        } catch (err) { handleError(err) }

    };


    const handleUpdateDept = async (e) => {
        e.preventDefault();
        try {
            await api.put(`/departments/${deptToEdit.id}`, { name: deptToEdit.name });
            setDeptToEdit(null);
            setActiveModal(null);
            fetchData();
        } catch (err) { handleError(err) }

    };

    const handleDeleteDept = async (id) => {
        if (!window.confirm('Are you sure you want to delete this department?')) return;
        try {
            await api.delete(`/departments/${id}`);
            fetchData();
        } catch (err) { handleError(err) }

    };

    if (loading) return <div className="flex items-center justify-center min-h-[60vh]"><div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" /></div>;

    return (
        <div className="space-y-10 animate-in fade-in duration-700">
            {/* My Personal Snapshot */}
      <div className="bg-slate-50/50 p-6 rounded-[24px] border border-[#e5e7eb]">
        <div className="flex items-center gap-2 mb-4 ml-1">
          <div className="w-1 h-4 bg-indigo-600 rounded-full" />
          <h2 className="text-sm font-bold text-[#111827] uppercase tracking-wider">System Snapshot</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <SnapshotCard icon={Calendar} label="Remaining Leave" value={leaveBalance.remaining_leaves || 0} color="text-rose-500" bgColor="bg-rose-50" onClick={() => navigate('/leave')} />
          <SnapshotCard icon={Users} label="Online Users" value={`${onlineUsers} Active`} color="text-emerald-500" bgColor="bg-emerald-50" onClick={() => {}} />
          <SnapshotCard icon={Database} label="System Balances" value={allLeaveBalances.length} color="text-indigo-500" bgColor="bg-indigo-50" onClick={() => setActiveModal('allLeaveBalances')} />
          <SnapshotCard icon={Calendar} label="All Attendance" value={allAttendance.length} color="text-emerald-500" bgColor="bg-emerald-50" onClick={() => setActiveModal('allAttendance')} />
          <button 
            onClick={() => navigate('/meetings')}
            className="bg-white p-5 rounded-2xl border border-[#e5e7eb] flex items-center justify-between group hover:border-indigo-500 hover:shadow-md transition-all cursor-pointer"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-all">
                <Users size={20} />
              </div>
              <div>
                <p className="text-[#6b7280] text-[11px] font-bold uppercase tracking-wider leading-none mb-1">Collaboration</p>
                <p className="text-sm font-bold text-[#111827]">Meetings Hub</p>
              </div>
            </div>
            <ArrowRight size={16} className="text-[#9ca3af] group-hover:text-indigo-600 group-hover:translate-x-1 transition-all" />
          </button>
        </div>
      </div>

            {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
           <h1 className="text-3xl font-bold text-[#111827] tracking-tight">Administrator Panel</h1>
           <p className="text-[#6b7280] font-medium mt-1">Global oversight and team management for EMP PRO</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
            <button 
                onClick={handleBackup}
                className="px-5 py-3 bg-white border border-[#e5e7eb] rounded-xl font-bold text-[#374151] hover:bg-slate-50 transition-all shadow-sm flex items-center gap-2"
            >
                 {backingUp ? <div className="w-4 h-4 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" /> : <Database size={16} />}
                 <span>Backup</span>
            </button>
             <button 
                onClick={() => setActiveModal('deptMgmt')}
                className="px-5 py-3 bg-white border border-[#e5e7eb] rounded-xl font-bold text-[#374151] hover:bg-slate-50 transition-all shadow-sm flex items-center gap-2"
            >
                 <Building2 size={16} />
                 <span>Departments</span>
            </button>
             <button 
                onClick={() => setActiveModal('addUser')}
                className="px-5 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-all shadow-md shadow-indigo-100 flex items-center gap-2"
            >
                 <UserPlus size={16} />
                 <span>Add Member</span>
            </button>
        </div>
      </div>

            {/* Admin Header Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <AdminStatCard title="Total Users" value={adminStats.totalUsers} icon={UsersIcon} color="bg-indigo-600" onClick={() => setActiveModal('usersList')} />
        <AdminStatCard title="Active Sessions" value={adminStats.activeSessions} icon={Activity} color="bg-emerald-600" onClick={() => setActiveModal('sessions')} />
        <AdminStatCard title="Total Leaves" value={adminStats.totalLeaves} icon={Calendar} color="bg-indigo-600" onClick={() => navigate('/leave')} />
        <AdminStatCard title="Total Meetings" value={adminStats?.totalMeetings || 0} icon={VideoIcon} color="bg-indigo-600" onClick={() => navigate('/meetings')} />
      </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                {/* User Directory - Preview 5 */}
        <div className="xl:col-span-2 space-y-8">
          <section className="bg-white p-8 rounded-[24px] border border-[#e5e7eb] shadow-sm">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
              <div>
                <h2 className="text-xl font-bold text-[#111827] tracking-tight">Active Team Members</h2>
                <p className="text-sm text-[#6b7280] font-medium mt-1">Manage and track your active workforce</p>
              </div>
              <button 
                onClick={() => setActiveModal('usersList')} 
                className="text-indigo-600 font-bold text-xs uppercase tracking-wider hover:text-indigo-700 transition-colors flex items-center gap-2 bg-indigo-50 px-4 py-2 rounded-full"
              >
                View Full Directory <ArrowRight size={14} />
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="text-[11px] font-bold text-[#6b7280] uppercase tracking-wider border-b border-[#f3f4f6]">
                    <th className="pb-4 px-4">Member</th>
                    <th className="pb-4 px-4">Department / Role</th>
                    <th className="pb-4 px-4">Salary</th>
                    <th className="pb-4 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#f3f4f6]">
                  {users.slice(0, 10).map((user) => (
                    <tr key={user.id} className="group hover:bg-slate-50 transition-colors">
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center font-bold text-[#6b7280] border border-[#e5e7eb]">
                            {user.name ? user.name[0] : '?'}
                          </div>
                          <div>
                            <p className="font-bold text-[#111827] text-sm leading-none mb-1">{user.name}</p>
                            <p className="text-xs text-[#6b7280] font-medium">{user.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                         <div className="flex flex-col gap-1">
                           <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider">{user.role}</span>
                           <span className="text-[11px] font-medium text-[#6b7280]">{user.department_name || 'General'}</span>
                         </div>
                      </td>
                      <td className="py-4 px-4">
                        <p className="font-bold text-[#111827] text-sm leading-none">${(user.salary || 0).toLocaleString()}</p>
                      </td>
                      <td className="py-4 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button onClick={() => { setEditUser(user); setActiveModal('editUser'); }} className="p-2 text-[#9ca3af] hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all" title="Edit"><Edit3 size={16} /></button>
                          <button onClick={() => handleDeleteUser(user.id)} className="p-2 text-[#9ca3af] hover:text-red-500 hover:bg-red-50 rounded-lg transition-all" title="Delete"><Trash2 size={16} /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {users.length === 0 && (
                    <tr>
                      <td colSpan={4} className="py-12 text-center text-[#6b7280] font-medium italic">No members found</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {users.length > 10 && (
              <div className="mt-6 pt-6 border-t border-[#f3f4f6] text-center">
                 <button onClick={() => setActiveModal('usersList')} className="text-sm font-bold text-indigo-600 hover:underline">Show {users.length - 10} more members</button>
              </div>
            )}
          </section>
        </div>

                {/* Sidebar Controls */}
                 <div className="space-y-8 font-sans">
                      <section className="bg-white p-8 rounded-[24px] border border-[#e5e7eb] shadow-sm">
                          <div className="flex items-center gap-2 mb-6 ml-1">
                             <Settings className="text-indigo-600" size={20} />
                             <h2 className="text-sm font-bold text-[#111827] uppercase tracking-wider">Infrastructure</h2>
                          </div>
                          <div className="space-y-6">
                              {settings.map(s => (
                                  <div key={s.key} className="space-y-2">
                                      <div className="flex justify-between items-center text-[11px] font-bold text-[#6b7280] uppercase tracking-wider px-1">
                                          <span>{s.key.replace(/_/g, ' ')}</span>
                                          <span className="text-emerald-500 flex items-center gap-1"><div className="w-1 h-1 rounded-full bg-emerald-500" /> LIVE</span>
                                      </div>
                                      <div className="relative group">
                                          <input 
                                             defaultValue={s.value} 
                                             onBlur={(e) => handleUpdateSetting(s.key, e.target.value)}
                                             className="w-full bg-[#fcfdfe] border border-[#e5e7eb] rounded-xl px-4 py-3 text-sm font-medium text-[#111827] transition-all outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/5" 
                                          />
                                      </div>
                                  </div>
                              ))}
                          </div>
                      </section>

                      <section className="bg-[#111827] p-8 rounded-[24px] text-white shadow-lg relative overflow-hidden group">
                         <div className="absolute top-0 right-0 w-48 h-48 bg-indigo-500/10 rounded-full -mr-24 -mt-24 blur-3xl" />
                         <h2 className="text-sm font-bold flex items-center gap-2 mb-6 uppercase tracking-wider">
                             <History className="text-indigo-400" size={18} /> Audit Stream
                         </h2>
                         <div className="space-y-4 relative z-10 max-h-[350px] overflow-y-auto pr-2 custom-scrollbar">
                              {logs.map((log, idx) => (
                                  <div key={idx} className="flex gap-4 relative group/log border-b border-white/5 pb-4 last:border-0 last:pb-0">
                                      <div className="w-2 h-2 rounded-full bg-indigo-400 mt-1.5 shrink-0" />
                                      <div className="flex-1 min-w-0">
                                           <p className="text-[11px] font-bold text-white uppercase tracking-wider mb-1 line-clamp-1">{log.action ? log.action.replace(/_/g, ' ') : 'ACTION'}</p>
                                           <div className="flex items-center gap-2">
                                              <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">{new Date(log.timestamp).toLocaleTimeString()}</p>
                                              <span className="w-1 h-1 bg-slate-600 rounded-full" />
                                              <p className="text-[10px] text-slate-400 font-medium truncate">ID: {log.user_id}</p>
                                           </div>
                                      </div>
                                  </div>
                              ))}
                         </div>
                      </section>
                 </div>
            </div>

            {/* --- Modals Section --- */}
            
             {/* All Leave Balances Modal */}
            <DetailModal isOpen={activeModal === 'allLeaveBalances'} onClose={() => setActiveModal(null)} title="Global Employee Leave Status">
                <div className="overflow-x-auto">
                     <table className="w-full text-left">
                        <thead>
                            <tr className="text-[11px] font-bold text-[#6b7280] uppercase tracking-wider border-b border-[#f3f4f6]">
                                <th className="pb-4 px-4">Employee</th>
                                <th className="pb-4 px-4">Allocation</th>
                                <th className="pb-4 px-4">Used</th>
                                <th className="pb-4 px-4 text-right">Balance</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[#f3f4f6]">
                            {allLeaveBalances.map((bal) => (
                                <tr key={bal.id} className="hover:bg-slate-50 transition-colors">
                                    <td className="py-4 px-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center font-bold text-[#6b7280] border border-[#e5e7eb]">{bal.user_name ? bal.user_name[0] : '?'}</div>
                                            <p className="font-bold text-[#111827] text-sm">{bal.user_name}</p>
                                        </div>
                                    </td>
                                    <td className="py-4 px-4 text-sm font-medium text-[#374151]">{bal.total_leaves}d</td>
                                    <td className="py-4 px-4 text-sm font-bold text-rose-500">{bal.used_leaves}d</td>
                                    <td className="py-4 px-4 text-right font-bold text-emerald-600">{bal.remaining_leaves}d</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </DetailModal>

            {/* User List Modal */}
            <DetailModal isOpen={activeModal === 'usersList'} onClose={() => setActiveModal(null)} title="Full User Directory">
                <div className="overflow-x-auto">
                     <table className="w-full text-left">
                        <thead>
                            <tr className="text-[11px] font-bold text-[#6b7280] uppercase tracking-wider border-b border-[#f3f4f6]">
                                <th className="pb-4 px-4">Member</th>
                                <th className="pb-4 px-4">Role / Dept</th>
                                <th className="pb-4 px-4">Salary</th>
                                <th className="pb-4 px-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[#f3f4f6]">
                            {users.map((user) => (
                                <tr key={user.id} className="hover:bg-slate-50 transition-colors">
                                    <td className="py-4 px-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center font-bold text-[#6b7280] border border-[#e5e7eb]">{user.name ? user.name[0] : '?'}</div>
                                            <div>
                                                <p className="font-bold text-[#111827] text-sm leading-none mb-1">{user.name}</p>
                                                <p className="text-xs text-[#6b7280] font-medium">{user.email}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="py-4 px-4">
                                        <div className="flex flex-col">
                                            <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider">{user.role}</span>
                                            <span className="text-[11px] text-[#6b7280]">{user.department_name || 'General'}</span>
                                        </div>
                                    </td>
                                    <td className="py-4 px-4 text-sm font-bold text-[#111827]">${(user.salary || 0).toLocaleString()}</td>
                                    <td className="py-4 px-4 text-right">
                                        <div className="flex items-center justify-end gap-1">
                                            <button onClick={() => fetchSalaryHistory(user.id)} className="p-2 text-[#9ca3af] hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all" title="Salary History"><History size={16} /></button>
                                            <button onClick={() => { setEditUser(user); setActiveModal('editUser'); }} className="p-2 text-[#9ca3af] hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all" title="Edit"><Edit3 size={16} /></button>
                                            <button onClick={() => handleDeleteUser(user.id)} className="p-2 text-[#9ca3af] hover:text-red-500 hover:bg-red-50 rounded-lg transition-all" title="Delete"><Trash2 size={16} /></button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </DetailModal>

            {/* Salary History Modal */}
            <DetailModal isOpen={activeModal === 'salaryHistory'} onClose={() => setActiveModal(null)} title="Salary History">
                <div className="space-y-6">
                    {salaryHistory.length > 0 ? (
                        <div className="overflow-hidden border border-slate-100 rounded-[32px]">
                            <table className="w-full text-left">
                                <thead className="bg-slate-50">
                                    <tr className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">
                                        <th className="py-4 px-6">Change Date</th>
                                        <th className="py-4 px-6">Previous</th>
                                        <th className="py-4 px-6">New Salary</th>
                                        <th className="py-4 px-6 text-right">Increment</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {salaryHistory.map((h, i) => {
                                        const prev = salaryHistory[i+1]?.salary || h.old_salary || 0;
                                        const diff = h.salary - prev;
                                        return (
                                            <tr key={h.id} className="hover:bg-slate-50/50 transition-colors">
                                                <td className="py-4 px-6 text-sm font-bold text-slate-600">{new Date(h.changed_at).toLocaleDateString()}</td>
                                                <td className="py-4 px-6 text-sm font-black text-slate-400">${prev.toLocaleString()}</td>
                                                <td className="py-4 px-6 text-sm font-black text-indigo-600">${h.salary.toLocaleString()}</td>
                                                <td className="py-4 px-6 text-right">
                                                    <span className={`text-[10px] font-black px-2 py-1 rounded-md ${diff >= 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
                                                        {diff >= 0 ? '+' : ''}{prev > 0 ? ((diff/prev)*100).toFixed(1) : '100'}%
                                                    </span>
                                                </td>
                                            </tr>
                                        )
                                    })}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="py-20 text-center bg-slate-50 rounded-[40px] border border-slate-100">
                             <p className="text-sm font-black text-slate-400 uppercase tracking-widest">No salary changes recorded yet</p>
                        </div>
                    )}
                </div>
            </DetailModal>

            {/* Active Sessions Modal */}
            <DetailModal isOpen={activeModal === 'sessions'} onClose={() => setActiveModal(null)} title="Active Workforce">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {activeSessions.map(session => (
                        <div key={session.id} className="bg-slate-50 p-8 rounded-[40px] border border-slate-100 flex flex-col items-center text-center group hover:border-emerald-500 transition-all">
                             <div className="relative mb-6">
                                <div className="w-20 h-20 bg-white rounded-[32px] flex items-center justify-center text-3xl font-black text-emerald-600 shadow-sm border-2 border-transparent group-hover:border-emerald-100 transition-all">{session.name ? session.name[0] : '?'}</div>
                                <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-emerald-500 rounded-full border-4 border-slate-50 animate-pulse" />
                             </div>
                             <h4 className="text-lg font-black text-slate-900 mb-1">{session.name}</h4>
                             <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">{session.department_name || session.role}</p>

                             <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-2xl border border-slate-100">
                                 <Clock size={16} className="text-emerald-600" />
                                 <span className="text-xs font-black text-slate-700">{new Date(session.start_time).toLocaleTimeString()}</span>
                             </div>
                        </div>
                    ))}
                    {activeSessions.length === 0 && <p className="text-center py-20 bg-slate-50 rounded-[40px] border border-slate-100 col-span-full font-black text-slate-400 uppercase tracking-widest">No active sessions currently</p>}
                </div>
            </DetailModal>

            {/* Storage Modal */}
            <DetailModal isOpen={activeModal === 'storage'} onClose={() => setActiveModal(null)} title="Infrastructure Storage">
                <div className="space-y-10">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <StorageItem label="DB Instances" usage={65} color="indigo" icon={Database} />
                        <StorageItem label="Audit Logs" usage={12} color="emerald" icon={History} />
                        <StorageItem label="Media Assets" usage={8} color="amber" icon={Server} />
                    </div>
                    <div className="bg-slate-900 p-10 rounded-[40px] text-white">
                        <div className="flex items-center justify-between mb-8">
                             <h4 className="text-xl font-black flex items-center gap-3"><CloudLightning className="text-indigo-400" /> Real-time Node Status</h4>
                             <span className="text-[10px] font-black uppercase text-emerald-400 px-3 py-1 bg-emerald-400/10 rounded-full border border-emerald-400/20">Operational</span>
                        </div>
                        <div className="grid grid-cols-2 gap-8">
                             <div>
                                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Primary Node</p>
                                <div className="flex items-center gap-3">
                                     <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                     <p className="text-xl font-black">Node-01-West</p>
                                </div>
                             </div>
                             <div>
                                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Latency</p>
                                <p className="text-xl font-black">14ms</p>
                             </div>
                        </div>
                    </div>
                </div>
            </DetailModal>

            {/* Department Management Modal */}
            <DetailModal isOpen={activeModal === 'deptMgmt'} onClose={() => setActiveModal(null)} title="Department Infrastructure">
                 <div className="space-y-6">
                    <form onSubmit={handleCreateDept} className="p-6 bg-slate-50 rounded-2xl border border-[#e5e7eb]">
                        <h4 className="text-xs font-bold text-[#111827] mb-4 uppercase tracking-wider">Register New Department</h4>
                        <div className="flex gap-3">
                            <input 
                                required 
                                value={newDeptName}
                                onChange={e => setNewDeptName(e.target.value)}
                                className="flex-1 p-3 bg-white border border-[#e5e7eb] rounded-xl text-sm font-medium focus:border-indigo-500 outline-none"
                                placeholder="e.g. Engineering, Marketing"
                            />
                            <button type="submit" className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-all flex items-center gap-2">
                                <Plus size={16} />
                                <span>Add</span>
                            </button>
                        </div>
                    </form>

                    <div className="space-y-2">
                        {departments.map(dept => (
                            <div key={dept.id} className="p-4 bg-white border border-[#e5e7eb] rounded-2xl flex items-center justify-between group hover:border-indigo-500 transition-all">
                                {deptToEdit?.id === dept.id ? (
                                    <form onSubmit={handleUpdateDept} className="flex-1 flex gap-3">
                                        <input 
                                            autoFocus
                                            value={deptToEdit.name}
                                            onChange={e => setDeptToEdit({...deptToEdit, name: e.target.value})}
                                            className="flex-1 p-2 bg-slate-50 border border-indigo-600 rounded-lg outline-none font-bold"
                                        />
                                        <button type="submit" className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg"><CheckCircle size={18} /></button>
                                        <button type="button" onClick={() => setDeptToEdit(null)} className="p-2 text-[#9ca3af] hover:bg-slate-50 rounded-lg"><LogOut size={18} /></button>
                                    </form>
                                ) : (
                                    <>
                                        <div>
                                            <p className="font-bold text-[#111827]">{dept.name}</p>
                                            <p className="text-[10px] font-bold text-[#6b7280] uppercase tracking-wider">Department ID: {dept.id}</p>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <button onClick={() => setDeptToEdit(dept)} className="p-2 text-[#9ca3af] hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"><Edit3 size={16} /></button>
                                            <button onClick={() => handleDeleteDept(dept.id)} className="p-2 text-[#9ca3af] hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"><Trash2 size={16} /></button>
                                        </div>
                                    </>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </DetailModal>

            {/* Metrics Modal */}
            <DetailModal isOpen={activeModal === 'metrics'} onClose={() => setActiveModal(null)} title="System Consumption">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="bg-slate-50 p-10 rounded-[40px] border border-slate-100 flex flex-col items-center justify-center text-center">
                        <Cpu size={64} className="text-amber-500 mb-6" />
                        <h4 className="text-4xl font-black text-slate-900 mb-2">12.4%</h4>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-8">Average CPU Usage</p>
                        <div className="w-full h-3 bg-white rounded-full overflow-hidden border border-slate-100">
                             <div className="h-full bg-amber-500 rounded-full" style={{width: '12.4%'}} />
                        </div>
                    </div>
                    <div className="bg-slate-50 p-10 rounded-[40px] border border-slate-100 flex flex-col items-center justify-center text-center">
                        <ActivityIcon size={64} className="text-indigo-600 mb-6" />
                        <h4 className="text-4xl font-black text-slate-900 mb-2">1.8GB</h4>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-8">Memory Allocation</p>
                        <div className="w-full h-3 bg-white rounded-full overflow-hidden border border-slate-100">
                             <div className="h-full bg-indigo-600 rounded-full" style={{width: '45%'}} />
                        </div>
                    </div>
                </div>
            </DetailModal>

             <DetailModal isOpen={activeModal === 'editUser'} onClose={() => { setActiveModal(null); setEditUser(null); }} title="Update Member Profile">
                {editUser && (
                    <form onSubmit={handleUpdateUser} className="space-y-5">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <div className="space-y-1.5 md:col-span-2">
                                <label className="text-xs font-bold text-[#374151] ml-1">Full Name</label>
                                <input required value={editUser.name} onChange={e => setEditUser({...editUser, name: e.target.value})} className="w-full px-4 py-3 bg-[#fcfdfe] border border-[#e5e7eb] rounded-xl text-sm font-medium focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/5 outline-none transition-all" />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-[#374151] ml-1">Email Address</label>
                                <input required type="email" value={editUser.email} onChange={e => setEditUser({...editUser, email: e.target.value})} className="w-full px-4 py-3 bg-[#fcfdfe] border border-[#e5e7eb] rounded-xl text-sm font-medium focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/5 outline-none transition-all" />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-[#374151] ml-1">Role Permissions</label>
                                <select value={editUser.role} onChange={e => setEditUser({...editUser, role: e.target.value})} className="w-full px-4 py-3 bg-[#fcfdfe] border border-[#e5e7eb] rounded-xl text-sm font-bold text-[#374151] focus:border-indigo-500 outline-none transition-all cursor-pointer">
                                    <option value="employee">Employee</option>
                                    <option value="manager">Manager</option>
                                    <option value="hr">HR Professional</option>
                                    <option value="admin">Admin</option>
                                </select>
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-[#374151] ml-1">Department</label>
                                <select value={editUser.department_id} onChange={e => setEditUser({...editUser, department_id: e.target.value})} className="w-full px-4 py-3 bg-[#fcfdfe] border border-[#e5e7eb] rounded-xl text-sm font-bold text-[#374151] focus:border-indigo-500 outline-none transition-all cursor-pointer">
                                    {departments.map(dept => (
                                        <option key={dept.id} value={dept.id}>{dept.name}</option>
                                    ))}
                                </select>
                            </div>
                             <div className="space-y-1.5">
                                <label className="text-xs font-bold text-[#374151] ml-1">Reporting Manager</label>
                                <select value={editUser.manager_id || ''} onChange={e => setEditUser({...editUser, manager_id: e.target.value})} className="w-full px-4 py-3 bg-[#fcfdfe] border border-[#e5e7eb] rounded-xl text-sm font-bold text-[#374151] focus:border-indigo-500 outline-none transition-all cursor-pointer">
                                    <option value="">Direct to CEO / None</option>
                                    {users.filter(u => u.role === 'manager' || u.role === 'admin').map(m => (
                                        <option key={m.id} value={m.id}>{m.name} ({m.role})</option>
                                    ))}
                                </select>
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-[#374151] ml-1">Annual Salary ($)</label>
                                <input required type="number" value={editUser.salary} onChange={e => setEditUser({...editUser, salary: e.target.value})} className="w-full px-4 py-3 bg-[#fcfdfe] border border-[#e5e7eb] rounded-xl text-sm font-medium focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/5 outline-none transition-all" />
                            </div>
                        </div>
                        <button type="submit" className="w-full bg-indigo-600 text-white py-4 rounded-xl font-bold hover:bg-indigo-700 transition-all shadow-md shadow-indigo-100 flex items-center justify-center gap-2 mt-4">
                            <Save size={18} />
                            Save Profile Changes
                        </button>
                    </form>
                )}
            </DetailModal>

             <DetailModal isOpen={activeModal === 'addUser'} onClose={() => setActiveModal(null)} title="Add New Team Member">
                <form onSubmit={handleCreateUser} className="space-y-5">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div className="space-y-1.5 md:col-span-2">
                            <label className="text-xs font-bold text-[#374151] ml-1">Full Name</label>
                            <input required value={newUser.name} onChange={e => setNewUser({...newUser, name: e.target.value})} className="w-full px-4 py-3 bg-[#fcfdfe] border border-[#e5e7eb] rounded-xl text-sm font-medium focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/5 outline-none transition-all" placeholder="Enter member name" />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-[#374151] ml-1">Email Address</label>
                            <input required type="email" value={newUser.email} onChange={e => setNewUser({...newUser, email: e.target.value})} className="w-full px-4 py-3 bg-[#fcfdfe] border border-[#e5e7eb] rounded-xl text-sm font-medium focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/5 outline-none transition-all" placeholder="email@company.com" />
                        </div>
                        <div className="space-y-1.5">
                             <label className="text-xs font-bold text-[#374151] ml-1">Temp Password</label>
                             <input required type="password" value={newUser.password} onChange={e => setNewUser({...newUser, password: e.target.value})} className="w-full px-4 py-3 bg-[#fcfdfe] border border-[#e5e7eb] rounded-xl text-sm font-medium focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/5 outline-none transition-all" placeholder="••••••••" />
                        </div>
                         <div className="space-y-1.5">
                             <label className="text-xs font-bold text-[#374151] ml-1">Permissions Tier</label>
                             <select value={newUser.role} onChange={e => setNewUser({...newUser, role: e.target.value})} className="w-full px-4 py-3 bg-[#fcfdfe] border border-[#e5e7eb] rounded-xl text-sm font-bold text-[#374151] focus:border-indigo-500 outline-none cursor-pointer">
                                <option value="employee">Employee</option>
                                <option value="manager">Manager</option>
                                <option value="hr">HR Professional</option>
                                <option value="admin">Admin</option>
                             </select>
                         </div>
                         <div className="space-y-1.5">
                             <label className="text-xs font-bold text-[#374151] ml-1">Department</label>
                             <select required value={newUser.department_id} onChange={e => setNewUser({...newUser, department_id: e.target.value})} className="w-full px-4 py-3 bg-[#fcfdfe] border border-[#e5e7eb] rounded-xl text-sm font-bold text-[#374151] focus:border-indigo-500 outline-none cursor-pointer">
                                 <option value="">Select a Department...</option>
                                 {departments.map(dept => (
                                     <option key={dept.id} value={dept.id}>{dept.name}</option>
                                 ))}
                             </select>
                         </div>
                         <div className="space-y-1.5">
                              <label className="text-xs font-bold text-[#374151] ml-1">Base Salary ($)</label>
                              <input required type="number" value={newUser.salary} onChange={e => setNewUser({...newUser, salary: e.target.value})} className="w-full px-4 py-3 bg-[#fcfdfe] border border-[#e5e7eb] rounded-xl text-sm font-medium focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/5 outline-none transition-all" placeholder="Annual amount" />
                         </div>
                    </div>
                    <button type="submit" className="w-full bg-indigo-600 text-white py-4 rounded-xl font-bold hover:bg-indigo-700 transition-all shadow-md shadow-indigo-100 flex items-center justify-center gap-2 mt-4 group">
                        Confirm Registration
                        <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                    </button>
                </form>
            </DetailModal>

            {/* All Attendance Modal */}
            <DetailModal isOpen={activeModal === 'allAttendance'} onClose={() => setActiveModal(null)} title="Global Attendance Logs">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="text-[11px] font-bold text-[#6b7280] uppercase tracking-wider border-b border-[#f3f4f6]">
                                <th className="pb-4 px-2">Member</th>
                                <th className="pb-4 px-2 text-center">Status</th>
                                <th className="pb-4 px-2 text-right">Hours</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[#f3f4f6]">
                            {allAttendance.map(log => (
                                <tr key={log.id} className="text-sm font-medium text-[#374151] hover:bg-slate-50 transition-colors">
                                    <td className="py-4 px-2">
                                        <p className="font-bold text-[#111827]">{log.user_name}</p>
                                        <p className="text-[10px] text-[#6b7280] uppercase font-bold">{log.date || 'N/A'}</p>
                                    </td>
                                    <td className="py-4 px-2 text-center">
                                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${
                                            log.status === 'Present' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                                            log.status === 'Half Day' ? 'bg-amber-50 text-amber-700 border-amber-100' :
                                            'bg-indigo-50 text-indigo-600 border-indigo-100'
                                        }`}>
                                            {log.status}
                                        </span>
                                    </td>
                                    <td className="py-4 px-2 text-right font-bold text-[#111827]">{log.total_hours || '0.00'}h</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </DetailModal>

            <DetailModal isOpen={activeModal === 'salaryAdjustment'} onClose={() => setActiveModal(null)} title="Audit Financial Adjustment">
                <form onSubmit={handleAddAdjustment} className="space-y-5">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                           <div className="space-y-1.5 md:col-span-2">
                                <label className="text-xs font-bold text-[#374151] ml-1">Target Employee</label>
                                <select 
                                  value={newAdjustment.user_id} 
                                  onChange={e => setNewAdjustment({...newAdjustment, user_id: e.target.value})} 
                                  className="w-full px-4 py-3 bg-[#fcfdfe] border border-[#e5e7eb] rounded-xl text-sm font-bold text-[#374151] focus:border-indigo-500 outline-none transition-all cursor-pointer"
                                  required
                                >
                                   <option value="" disabled>Select User</option>
                                   {users.map(u => (
                                       <option key={u.id} value={u.id}>{u.name} ({u.role})</option>
                                   ))}
                                </select>
                           </div>
                           <div className="space-y-1.5">
                                <label className="text-xs font-bold text-[#374151] ml-1">Amount ($)</label>
                                <input type="number" value={newAdjustment.amount} onChange={e => setNewAdjustment({...newAdjustment, amount: e.target.value})} className="w-full px-4 py-3 bg-[#fcfdfe] border border-[#e5e7eb] rounded-xl text-sm font-medium focus:border-indigo-500 outline-none" required />
                           </div>
                           <div className="space-y-1.5">
                                <label className="text-xs font-bold text-[#374151] ml-1">Adjustment Type</label>
                                <select 
                                  value={newAdjustment.type} 
                                  onChange={e => setNewAdjustment({...newAdjustment, type: e.target.value})} 
                                  className="w-full px-4 py-3 bg-[#fcfdfe] border border-[#e5e7eb] rounded-xl text-sm font-bold text-[#374151] focus:border-indigo-500 outline-none"
                                  required
                                >
                                   <option value="bonus">Performance Bonus</option>
                                   <option value="incentive">Commission / Incentive</option>
                                   <option value="deduction">Recovery / Deduction</option>
                                   <option value="other">Miscellaneous</option>
                                </select>
                           </div>
                           <div className="space-y-1.5 md:col-span-2">
                                <label className="text-xs font-bold text-[#374151] ml-1">Audit Description</label>
                                <textarea 
                                    value={newAdjustment.description} 
                                    onChange={e => setNewAdjustment({...newAdjustment, description: e.target.value})} 
                                    className="w-full px-4 py-3 bg-[#fcfdfe] border border-[#e5e7eb] rounded-xl text-sm font-medium focus:border-indigo-500 outline-none h-24 resize-none"
                                    placeholder="Provide context for this financial change..."
                                    required
                                />
                           </div>
                    </div>
                    <button type="submit" className="w-full bg-indigo-600 text-white py-4 rounded-xl font-bold hover:bg-indigo-700 transition-all shadow-md shadow-indigo-100 flex items-center justify-center gap-2 mt-4">
                        Confirm Audit Entry
                    </button>
                </form>
            </DetailModal>
        </div>
    );
};

const AdminStatCard = ({ title, value, icon: Icon, color, onClick }) => (
  <button 
    onClick={onClick}
    className="bg-white p-7 rounded-[24px] border border-[#e5e7eb] shadow-sm flex items-center justify-between group hover:border-indigo-600 hover:shadow-md transition-all cursor-pointer text-left w-full"
  >
    <div>
      <p className="text-[11px] font-bold text-[#6b7280] uppercase tracking-wider mb-2">{title}</p>
      <h3 className="text-2xl font-bold text-[#111827] tracking-tight">{value}</h3>
    </div>
    <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-white ${color || 'bg-indigo-600'} shadow-sm transition-transform group-hover:scale-105`}>
      {Icon && <Icon size={24} />}
    </div>
  </button>
);

const StorageItem = ({ label, usage, color, icon: Icon }) => (
    <div className="bg-slate-50 p-8 rounded-[40px] border border-slate-100 flex flex-col items-center group hover:border-indigo-600 transition-all">
          <div className={`w-16 h-16 rounded-[28px] bg-white flex items-center justify-center mb-6 shadow-sm border border-slate-100 group-hover:bg-indigo-600 group-hover:text-white transition-all`} style={{color: color === 'indigo' ? '#4f46e5' : color === 'emerald' ? '#10b981' : '#f59e0b'}}>
              {Icon && <Icon size={28} />}
          </div>
         <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{label}</p>
         <h3 className="text-2xl font-black text-slate-900 mb-4">{usage}GB</h3>
         <div className="w-full h-2 bg-white rounded-full overflow-hidden border border-slate-100">
              <div className={`h-full rounded-full`} style={{width: `${(usage/100)*100}%`, backgroundColor: color === 'indigo' ? '#4f46e5' : color === 'emerald' ? '#10b981' : '#f59e0b'}} />
         </div>
    </div>
);

export default AdminPanel;
