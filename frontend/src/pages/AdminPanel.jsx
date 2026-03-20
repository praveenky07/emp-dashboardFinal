import React, { useState, useEffect } from 'react';
import api from '../services/api';
import DetailModal from '../components/DetailModal';
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
  Download
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const AdminPanel = () => {
    const [users, setUsers] = useState([]);
    const [logs, setLogs] = useState([]);
    const [settings, setSettings] = useState([]);
    const [activeSessions, setActiveSessions] = useState([]);
    const [loading, setLoading] = useState(true);
    
    // UI state
    const [activeModal, setActiveModal] = useState(null); // 'addUser', 'usersList', 'sessions', 'storage', 'metrics'
    const [newUser, setNewUser] = useState({ name: '', email: '', password: '', role: 'Employee' });
    const [backingUp, setBackingUp] = useState(false);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [usersRes, logsRes, settingsRes, sessionsRes] = await Promise.all([
                api.get('/admin/users'),
                api.get('/admin/logs'),
                api.get('/admin/settings'),
                api.get('/admin/active-sessions')
            ]);
            
            setUsers(Array.isArray(usersRes?.data) ? usersRes.data : []);
            setLogs(Array.isArray(logsRes?.data) ? logsRes.data : []);
            setSettings(Array.isArray(settingsRes?.data) ? settingsRes.data : []);
            setActiveSessions(Array.isArray(sessionsRes?.data) ? sessionsRes.data : []);
        } catch (err) { 
            console.error('Failed to fetch admin data', err);
        } finally { 
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleCreateUser = async (e) => {
        e.preventDefault();
        try {
            await api.post('/auth/register', newUser);
            setActiveModal(null);
            setNewUser({ name: '', email: '', password: '', role: 'Employee' });
            fetchData();
        } catch (err) { alert('Failed to create user') }
    };

    const handleDeleteUser = async (id) => {
        if (!window.confirm('Are you sure you want to delete this user?')) return;
        try {
            await api.delete(`/admin/user/${id}`);
            fetchData();
        } catch (err) { alert('Failed to delete user') }
    };

    const handleUpdateRole = async (id, role) => {
        try {
            await api.post('/admin/user-role', { id, role });
            fetchData();
        } catch (err) { alert('Failed to update role') }
    };

    const handleUpdateSetting = async (key, value) => {
        try {
            await api.post('/admin/settings', { key, value });
            fetchData();
        } catch (err) { alert('Failed to update setting') }
    };

    const handleBackup = async () => {
        try {
            setBackingUp(true);
            const { data } = await api.post('/admin/backup');
            alert(data.message);
        } catch (err) { alert('Backup failed') }
        finally { setBackingUp(false); }
    };

    if (loading) return <div className="flex items-center justify-center min-h-[60vh]"><div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" /></div>;

    return (
        <div className="space-y-10 animate-in fade-in duration-700">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                   <h1 className="text-4xl font-black text-slate-900 tracking-tight">System Controls</h1>
                   <p className="text-slate-500 font-medium">Global administration and infrastructure management.</p>
                </div>
                <div className="flex items-center gap-3">
                    <button 
                        onClick={handleBackup}
                        className="px-6 py-3.5 bg-white border border-slate-100 rounded-2xl font-bold text-slate-600 hover:border-indigo-600 hover:text-indigo-600 transition-all shadow-sm flex items-center gap-2 cursor-pointer"
                    >
                         {backingUp ? <div className="w-4 h-4 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" /> : <Database size={18} />}
                         <span>Backup Data</span>
                    </button>
                    <button 
                        onClick={() => setActiveModal('addUser')}
                        className="px-6 py-3.5 bg-indigo-600 text-white rounded-2xl font-black hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100 flex items-center gap-2 cursor-pointer"
                    >
                         <UserPlus size={18} />
                         <span>Add New User</span>
                    </button>
                </div>
            </div>

            {/* Admin Header Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <AdminStatCard title="Total Users" value={users.length} icon={UsersIcon} color="bg-indigo-600" onClick={() => setActiveModal('usersList')} />
                <AdminStatCard title="Active Sessions" value={activeSessions.length} icon={Activity} color="bg-emerald-600" onClick={() => setActiveModal('sessions')} />
                <AdminStatCard title="Storage" value="84%" icon={Database} color="bg-blue-600" onClick={() => setActiveModal('storage')} />
                <AdminStatCard title="CPU Load" value="12%" icon={Cpu} color="bg-amber-600" onClick={() => setActiveModal('metrics')} />
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                {/* User Directory - Preview 5 */}
                <div className="xl:col-span-2 space-y-8">
                    <section className="bg-white p-10 rounded-[40px] border border-slate-100 shadow-xl shadow-slate-200/50">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
                            <div>
                                <h2 className="text-2xl font-black text-slate-900 tracking-tight">Active Team Snapshot</h2>
                                <p className="text-sm text-slate-400 font-medium uppercase tracking-widest mt-1">Real-time member status</p>
                            </div>
                            <button onClick={() => setActiveModal('usersList')} className="text-indigo-600 font-black text-[10px] uppercase tracking-widest hover:translate-x-1 transition-transform flex items-center gap-2 bg-indigo-50 px-4 py-2 rounded-full">Explore Directory <ArrowRight size={14} /></button>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] border-b border-slate-50">
                                        <th className="pb-6 px-4">Member</th>
                                        <th className="pb-6 px-4">Access Tier</th>
                                        <th className="pb-6 px-4 text-right">Settings</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {users.slice(0, 5).map((user) => (
                                        <tr key={user.id} className="group hover:bg-slate-50/50 transition-colors">
                                            <td className="py-6 px-4">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center font-black text-slate-400 border-2 border-white shadow-sm overflow-hidden group-hover:bg-indigo-600 group-hover:text-white transition-all scale-95 group-hover:scale-100">
                                                        {user.name ? user.name[0] : '?'}
                                                    </div>
                                                    <div>
                                                        <p className="font-black text-slate-900 text-sm leading-none mb-1 group-hover:text-indigo-600 transition-colors">{user.name}</p>
                                                        <p className="text-xs text-slate-400 font-medium letter tracking-tight">{user.email}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="py-6 px-4">
                                                 <span className={`px-3 py-1 bg-slate-100 rounded-full text-[9px] font-black uppercase tracking-widest text-slate-500 group-hover:bg-indigo-50 group-hover:text-indigo-700 transition-colors`}>{user.role}</span>
                                            </td>
                                            <td className="py-6 px-4 text-right">
                                                <button onClick={() => handleDeleteUser(user.id)} className="p-2.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"><Trash2 size={18} /></button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </section>
                </div>

                {/* Sidebar Controls */}
                <div className="space-y-8">
                     <section className="bg-white p-10 rounded-[40px] border border-slate-100 shadow-xl shadow-slate-200/50">
                         <div className="flex items-center gap-3 mb-8">
                            <Settings className="text-indigo-600" size={24} />
                            <h2 className="text-xl font-black text-slate-900 tracking-tight">Infrastructure</h2>
                         </div>
                         <div className="space-y-8">
                             {settings.map(s => (
                                 <div key={s.key} className="space-y-2.5">
                                     <div className="flex justify-between items-center text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">
                                         <span>{s.key.replace(/_/g, ' ')}</span>
                                         <span className="text-emerald-500 flex items-center gap-1"><div className="w-1 h-1 rounded-full bg-emerald-500" /> LIVE</span>
                                     </div>
                                     <div className="relative group">
                                         <input 
                                            defaultValue={s.value} 
                                            onBlur={(e) => handleUpdateSetting(s.key, e.target.value)}
                                            className="w-full bg-slate-50 border-2 border-transparent rounded-2xl px-5 py-3.5 text-sm font-bold text-slate-900 transition-all outline-none focus:border-indigo-600 focus:bg-white" 
                                         />
                                     </div>
                                 </div>
                             ))}
                             <div className="p-5 bg-amber-50 rounded-3xl border border-amber-100 flex items-start gap-4">
                                <AlertTriangle className="text-amber-500 mt-0.5 shrink-0" size={20} />
                                <p className="text-[10px] font-black text-amber-600 leading-relaxed uppercase tracking-[0.2em]">Deployment Propagated</p>
                             </div>
                         </div>
                     </section>

                     <section className="bg-slate-900 p-10 rounded-[40px] text-white shadow-2xl relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 rounded-full -mr-32 -mt-32 blur-3xl transition-transform group-hover:scale-110" />
                        <h2 className="text-xl font-black flex items-center gap-3 mb-8">
                            <History className="text-indigo-400" size={22} /> Audit Stream
                        </h2>
                        <div className="space-y-6 relative z-10 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                             {logs.map((log, idx) => (
                                 <div key={idx} className="flex gap-4 relative group/log">
                                     <div className="w-8 h-8 rounded-xl bg-white/5 flex items-center justify-center shrink-0 mt-0.5 ring-4 ring-slate-900 z-10 group-hover/log:bg-indigo-500/20 transition-all">
                                         <div className="w-2 h-2 rounded-full bg-indigo-400" />
                                     </div>
                                     <div className="flex-1 min-w-0 pb-6">
                                          <p className="text-[10px] font-black text-white uppercase tracking-widest mb-1 group-hover/log:text-indigo-400 transition-colors">{log.action ? log.action.replace(/_/g, ' ') : 'ACTION'}</p>
                                          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">{new Date(log.timestamp).toLocaleTimeString()} &bull; ID: {log.user_id}</p>
                                     </div>
                                 </div>
                             ))}
                        </div>
                     </section>
                </div>
            </div>

            {/* --- Modals Section --- */}
            
            {/* User List Modal */}
            <DetailModal isOpen={activeModal === 'usersList'} onClose={() => setActiveModal(null)} title="Full User Directory">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-50">
                                <th className="pb-6 px-4">Profile</th>
                                <th className="pb-6 px-4">Role</th>
                                <th className="pb-6 px-4">Created</th>
                                <th className="pb-6 px-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {users.map((user) => (
                                <tr key={user.id} className="hover:bg-slate-50/80 transition-all">
                                    <td className="py-6 px-4">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center font-black text-indigo-600 shadow-sm">{user.name[0]}</div>
                                            <div>
                                                <p className="font-black text-slate-900 text-sm whitespace-nowrap">{user.name}</p>
                                                <p className="text-xs text-slate-400 font-medium">{user.email}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="py-6 px-4">
                                        <select 
                                            value={user.role} 
                                            onChange={(e) => handleUpdateRole(user.id, e.target.value)}
                                            className="appearance-none bg-slate-100 border-none rounded-xl px-4 py-2 text-[10px] font-black uppercase tracking-widest focus:ring-2 focus:ring-indigo-600 transition-all outline-none"
                                        >
                                            <option>Employee</option>
                                            <option>Manager</option>
                                            <option>Admin</option>
                                        </select>
                                    </td>
                                    <td className="py-6 px-4 text-xs font-black text-slate-400 uppercase">{new Date(user.created_at).toLocaleDateString()}</td>
                                    <td className="py-6 px-4 text-right">
                                        <button onClick={() => handleDeleteUser(user.id)} className="p-3 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-2xl transition-all"><Trash2 size={20} /></button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </DetailModal>

            {/* Active Sessions Modal */}
            <DetailModal isOpen={activeModal === 'sessions'} onClose={() => setActiveModal(null)} title="Active Workforce">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {activeSessions.map(session => (
                        <div key={session.id} className="bg-slate-50 p-8 rounded-[40px] border border-slate-100 flex flex-col items-center text-center group hover:border-emerald-500 transition-all">
                             <div className="relative mb-6">
                                <div className="w-20 h-20 bg-white rounded-[32px] flex items-center justify-center text-3xl font-black text-emerald-600 shadow-sm border-2 border-transparent group-hover:border-emerald-100 transition-all">{session.name[0]}</div>
                                <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-emerald-500 rounded-full border-4 border-slate-50 animate-pulse" />
                             </div>
                             <h4 className="text-lg font-black text-slate-900 mb-1">{session.name}</h4>
                             <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">{session.role}</p>
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

            {/* Provision User Form */}
            <DetailModal isOpen={activeModal === 'addUser'} onClose={() => setActiveModal(null)} title="Initialize Direct Access">
                <form onSubmit={handleCreateUser} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-1.5 md:col-span-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Member Name</label>
                            <input required value={newUser.name} onChange={e => setNewUser({...newUser, name: e.target.value})} className="w-full p-4.5 bg-slate-50 border-2 border-transparent rounded-2xl font-bold focus:border-indigo-600 outline-none" placeholder="e.g. Jordan Smith" />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">System Email</label>
                            <input required type="email" value={newUser.email} onChange={e => setNewUser({...newUser, email: e.target.value})} className="w-full p-4.5 bg-slate-50 border-2 border-transparent rounded-2xl font-bold focus:border-indigo-600 outline-none" placeholder="jordan@emp.com" />
                        </div>
                        <div className="space-y-1.5">
                             <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Temporary Access Key</label>
                             <input required type="password" value={newUser.password} onChange={e => setNewUser({...newUser, password: e.target.value})} className="w-full p-4.5 bg-slate-50 border-2 border-transparent rounded-2xl font-bold focus:border-indigo-600 outline-none" placeholder="••••••••" />
                        </div>
                         <div className="space-y-1.5 md:col-span-2">
                             <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Permissions Tier</label>
                             <select value={newUser.role} onChange={e => setNewUser({...newUser, role: e.target.value})} className="w-full p-4.5 bg-slate-50 border-2 border-transparent rounded-2xl font-black uppercase tracking-widest focus:border-indigo-600 outline-none">
                                <option>Employee</option>
                                <option>Manager</option>
                                <option>Admin</option>
                             </select>
                        </div>
                    </div>
                    <button type="submit" className="w-full bg-indigo-600 text-white p-5 rounded-3xl font-black hover:bg-slate-900 transition-all shadow-xl shadow-indigo-100 flex items-center justify-center gap-3 group">
                        Confirm Provisioning
                        <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                    </button>
                </form>
            </DetailModal>

        </div>
    );
};

const AdminStatCard = ({ title, value, icon: Icon, color, onClick }) => (
    <button 
        onClick={onClick}
        className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-xl shadow-slate-200/50 flex items-center justify-between group hover:-translate-y-1 transition-all cursor-pointer text-left w-full"
    >
         <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">{title}</p>
            <h3 className="text-3xl font-black text-slate-900 tracking-tight">{value}</h3>
         </div>
         <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-white ${color} shadow-lg transition-transform group-hover:scale-110`}>
            <Icon size={28} />
         </div>
    </button>
);

const StorageItem = ({ label, usage, color, icon: Icon }) => (
    <div className="bg-slate-50 p-8 rounded-[40px] border border-slate-100 flex flex-col items-center group hover:border-indigo-600 transition-all">
         <div className={`w-16 h-16 rounded-[28px] bg-white flex items-center justify-center mb-6 text-${color}-600 shadow-sm border border-slate-100 group-hover:bg-indigo-600 group-hover:text-white transition-all`}>
             <Icon size={28} />
         </div>
         <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{label}</p>
         <h3 className="text-2xl font-black text-slate-900 mb-4">{usage}GB</h3>
         <div className="w-full h-2 bg-white rounded-full overflow-hidden border border-slate-100">
              <div className={`h-full bg-${color}-600 rounded-full`} style={{width: `${(usage/100)*100}%`}} />
         </div>
    </div>
);

export default AdminPanel;
