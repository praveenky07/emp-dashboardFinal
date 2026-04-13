import React, { useState, useEffect } from 'react';
import api from '../services/api';
import socket from '../services/socket';
import DetailModal from '../components/DetailModal';
import { handleError } from '../utils/handleError';

import {
    Users,
    CheckCircle,
    XCircle,
    BarChart,
    TrendingUp,
    Calendar,
    Search,
    ChevronRight,
    UserCheck2,
    Hourglass,
    LayoutGrid,
    Filter,
    Plus,
    ArrowRight,
    MoreVertical,
    Zap,
    Clock,
    Briefcase,
    AlertCircle,
    Flag,
    Target,
    History,
    Loader2,
    Star
} from 'lucide-react';
import {
    BarChart as ReBarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Cell
} from 'recharts';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

const ManagerDashboard = () => {
    const navigate = useNavigate();
    const getUser = () => {
        try {
            const userData = localStorage.getItem('user');
            return userData ? JSON.parse(userData) : { name: 'Manager', role: 'manager' };
        } catch (e) {
            console.error('Safe parse error in ManagerDashboard', e);
            return { name: 'Manager', role: 'manager' };
        }
    };
    const user = getUser();
    const [team, setTeam] = useState([]);
    const [leaves, setLeaves] = useState([]);
    const [metrics, setMetrics] = useState([]);
    const [loading, setLoading] = useState(true);
    const [teamLeaves, setTeamLeaves] = useState([]);
    const [teamLogs, setTeamLogs] = useState([]);
    const [stats, setStats] = useState({ directReports: 0, pendingActions: 0, availability: 0, teamSyncs: 0 });
    const [employeesOptions, setEmployeesOptions] = useState([]);

    // UI state
    const [activeModal, setActiveModal] = useState(null); // 'reports', 'approvals', 'productivity', 'capacity', 'addMember', 'pulseFrontend', 'pulseDeadlines'
    const [pulseData, setPulseData] = useState(null);
    const [pulseLoading, setPulseLoading] = useState(false);
    const [newMember, setNewMember] = useState({ name: '', email: '', password: '', role: 'Employee' });
    const [projects, setProjects] = useState([]);
    const [tasks, setTasks] = useState([]);
    const [newProject, setNewProject] = useState({ name: '', description: '', deadline: '' });
    const [newTask, setNewTask] = useState({ title: '', description: '', priority: 'Medium', due_date: '', assigned_to: '' });
    const [assignment, setAssignment] = useState({ project_id: '', employee_id: '' });
    const [projectLoading, setProjectLoading] = useState(false);
    const [taskLoading, setTaskLoading] = useState(false);
    const [leaveBalance, setLeaveBalance] = useState({ total_leaves: 0, used_leaves: 0, remaining_leaves: 0 });
    const [teamBalances, setTeamBalances] = useState([]);
    const [reviewForm, setReviewForm] = useState({ userId: '', rating: 5, feedback: '', tags: [], period: 'Q1 2026', bonus_amount: 0 });

    const [submittingReview, setSubmittingReview] = useState(false);

    const fetchData = async () => {
        try {
            setLoading(true);
            
            // Execute non-critical stats independently
            api.get('/admin/metrics').then(res => setMetrics(res.data)).catch(() => {});
            api.get('/leave/balance/my').then(res => setLeaveBalance(res.data)).catch(() => {});
            api.get('/leave/balance/all').then(res => setTeamBalances(res.data)).catch(() => {});
            api.get('/manager/stats').then(res => setStats(res.data)).catch(() => {});
            
            // Essential data
            const [teamRes, pendingRes, teamLeavesRes, membersRes] = await Promise.all([
                api.get('/manager/team').catch(() => ({ data: [] })),
                api.get('/leave/all-pending').catch(() => ({ data: [] })),
                api.get('/leave/team').catch(() => ({ data: [] })),
                api.get('/users?role=employee').catch(() => ({ data: [] }))
            ]);

            setTeam(teamRes.data);
            setLeaves(pendingRes.data);
            setTeamLeaves(teamLeavesRes.data);
            setEmployeesOptions(membersRes.data);
            
            // Always fetch projects and tasks
            await Promise.all([
                fetchProjects(),
                fetchManagedTasks()
            ]);
        } catch (err) { 
            console.error('Fetch error:', err);
        } finally { 
            setLoading(false);
        }
    };

    const fetchManagedTasks = async () => {
        try {
            const { data } = await api.get('/tasks/managed');
            setTasks(data);
        } catch (err) { console.error(err); }
    };

    const fetchProjects = async () => {
        try {
            const { data } = await api.get('/projects');
            setProjects(data);
        } catch (err) { console.error(err); }
    };

    useEffect(() => {
        fetchData();

        const handleRemoteUpdate = () => fetchData();

        socket.on('leaveRequested', handleRemoteUpdate);
        socket.on('leaveApproved', handleRemoteUpdate);
        socket.on('leaveRejected', handleRemoteUpdate);
        socket.on('attendanceStarted', handleRemoteUpdate);
        socket.on('attendanceEnded', handleRemoteUpdate);
        socket.on('attendanceUpdated', handleRemoteUpdate);

        return () => {
            socket.off('leaveRequested', handleRemoteUpdate);
            socket.off('leaveApproved', handleRemoteUpdate);
            socket.off('leaveRejected', handleRemoteUpdate);
            socket.off('attendanceStarted', handleRemoteUpdate);
            socket.off('attendanceEnded', handleRemoteUpdate);
            socket.off('attendanceUpdated', handleRemoteUpdate);
        };
    }, []);


    const handlePulseClick = async (type) => {
        setPulseData(null);
        setPulseLoading(true);
        setActiveModal(type === 'frontend' ? 'pulseFrontend' : 'pulseDeadlines');
        try {
            const endpoint = type === 'frontend' ? '/pulse/frontend' : '/pulse/deadlines';
            const { data } = await api.get(endpoint);
            setPulseData(data);
        } catch (err) { console.error(err); }
        finally { setPulseLoading(false); }
    };

    const handleCreateProject = async (e) => {
        e.preventDefault();
        try {
            setProjectLoading(true);
            await api.post('/projects', newProject);
            alert('Project Deployed Successfully!');
            setNewProject({ name: '', description: '', deadline: '', status: 'Planning' });
            fetchData();
        } catch (err) { 
            handleError(err); 
        } finally { 
            setProjectLoading(false); 
        }
    };

    const handleAssignProject = async (e) => {
        e.preventDefault();
        try {
            setProjectLoading(true);
            await api.post('/projects/assign', assignment);
            setAssignment({ project_id: '', employee_id: '' });
            fetchProjects();
        } catch (err) { handleError(err); }

        finally { setProjectLoading(false); }
    };

    const handleCreateTask = async (e) => {
        e.preventDefault();
        try {
            setTaskLoading(true);
            await api.post('/tasks', newTask);
            setNewTask({ title: '', description: '', priority: 'Medium', due_date: '', assigned_to: '' });
            fetchData();
            alert('Task assigned successfully!');
        } catch (err) { handleError(err); }
        finally { setTaskLoading(false); }
    };

    const handleSubmitReview = async (e) => {
        e.preventDefault();
        try {
            setSubmittingReview(true);
            await api.post('/performance/submit-review', reviewForm);
            alert('Review submitted successfully!');
            setActiveModal(null);
            setReviewForm({ userId: '', rating: 5, feedback: '', tags: [], period: 'Q1 2026', bonus_amount: 0 });

        } catch (err) { handleError(err); }
        finally { setSubmittingReview(false); }
    };

    const COLORS = ['#4F46E5', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];

    if (loading) return <div className="flex items-center justify-center min-h-[60vh]"><Loader2 className="animate-spin text-indigo-600" size={48} /></div>;

    return (
        <div className="space-y-10 animate-in fade-in duration-700">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-[#e5e7eb]">
                <div>
                    <h1 className="text-3xl font-bold text-[#111827] tracking-tight">Team Operations</h1>
                    <p className="text-[#6b7280] text-sm font-medium mt-1">Orchestrating department productivity and resource allocation.</p>
                </div>
                <div className="flex items-center gap-3">
                    <button className="px-5 py-2.5 bg-white border border-[#e5e7eb] rounded-xl font-bold text-[#374151] hover:border-indigo-600 hover:text-indigo-600 transition-all shadow-sm flex items-center gap-2">
                        <Filter size={18} />
                        <span>Filter Cycle</span>
                    </button>
                    <button onClick={() => navigate('/meetings')} className="px-5 py-2.5 bg-indigo-600 border border-indigo-600 rounded-xl font-bold text-white hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 flex items-center gap-2">
                        <Plus size={18} />
                        <span>Schedule Sync</span>
                    </button>
                </div>
            </div>

            {/* Top Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
                <ManagerStatCard
                    label="Direct Reports"
                    value={stats.directReports}
                    icon={Users}
                    color="text-indigo-600"
                    bgColor="bg-indigo-50"
                    onClick={() => setActiveModal('reports')}
                />
                <ManagerStatCard
                    label="Pending Actions"
                    value={stats.pendingActions}
                    icon={Hourglass}
                    color="text-amber-600"
                    bgColor="bg-amber-50"
                    onClick={() => navigate('/leave')}
                    trend="Needs Review"
                />
                <ManagerStatCard
                    label="Availability"
                    value={`${stats.availability}d`}
                    icon={Calendar}
                    color="text-purple-600"
                    bgColor="bg-purple-50"
                    onClick={() => navigate('/leave')}
                />
                <ManagerStatCard
                    label="Group Assets"
                    value={teamBalances.length}
                    icon={History}
                    color="text-emerald-600"
                    bgColor="bg-emerald-50"
                    onClick={() => setActiveModal('teamBalances')}
                />
                <ManagerStatCard
                    label="Team Syncs"
                    value={stats.teamSyncs}
                    icon={Users}
                    color="text-blue-600"
                    bgColor="bg-blue-50"
                    onClick={() => navigate('/meetings')}
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Main Content Area */}
                <div className="lg:col-span-2 space-y-8">
                    {/* Performance Chart */}
                    <section className="bg-white p-8 rounded-[24px] border border-[#e5e7eb] shadow-sm">
                        <div className="flex items-center justify-between mb-8">
                            <div>
                                <h2 className="text-xl font-bold text-[#111827] tracking-tight">Utilization Metrics</h2>
                                <p className="text-sm text-[#6b7280] font-medium mt-1">Aggregated team bandwidth and focus hours</p>
                            </div>
                        </div>
                        <div className="h-72 w-full font-sans">
                            {metrics.length > 0 ? (
                                <ResponsiveContainer width="100%" height="100%">
                                    <ReBarChart data={metrics}>
                                        <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="#f3f4f6" />
                                        <XAxis dataKey="role" axisLine={false} tickLine={false} tick={{ fill: '#9ca3af', fontSize: 11, fontWeight: 600 }} dy={10} />
                                        <YAxis hide />
                                        <Tooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: '12px', border: '1px solid #e5e7eb', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontSize: '12px' }} labelStyle={{fontWeight: 'bold', color: '#111827', marginBottom: '4px'}} />
                                        <Bar dataKey="avg_work_duration" radius={[6, 6, 6, 6]} barSize={32}>
                                            {metrics.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} opacity={0.8} />
                                            ))}
                                        </Bar>
                                    </ReBarChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="h-full flex items-center justify-center border border-dashed border-[#e5e7eb] bg-slate-50 rounded-2xl">
                                    <p className="font-bold text-[#6b7280] text-sm uppercase tracking-wider">No data available</p>
                                </div>
                            )}
                        </div>
                    </section>

                    {/* Team Attendance View - NEW */}
                    <section className="bg-white p-8 rounded-[24px] border border-[#e5e7eb] shadow-sm">
                        <div className="flex items-center justify-between mb-8">
                            <div>
                                <h2 className="text-xl font-bold text-[#111827] tracking-tight">Operational Continuity</h2>
                                <p className="text-sm text-[#6b7280] font-medium mt-1">Surveillance of active team worklogs and connectivity.</p>
                            </div>
                            <button 
                                onClick={async () => {
                                    try {
                                        const { data } = await api.get('/attendance/team');
                                        setTeamLogs(data);
                                        setActiveModal('teamLogs');
                                    } catch(e) { console.error(e) }
                                }}
                                className="px-4 py-2 bg-slate-50 border border-[#e5e7eb] rounded-xl font-bold text-[#374151] text-[11px] uppercase tracking-wider hover:bg-slate-100 transition-all"
                            >
                                Audit Full History
                            </button>
                        </div>
                        <div className="space-y-3">
                            {(teamLogs || []).slice(0, 5).map(log => (
                                <div key={log.id} className="p-4 rounded-xl bg-[#fcfdfe] border border-[#f3f4f6] flex items-center justify-between group hover:border-indigo-500 transition-all">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center font-bold text-indigo-600 border border-indigo-100">{log.user_name?.[0] || 'U'}</div>
                                        <div>
                                            <p className="text-sm font-bold text-[#111827] leading-none mb-1">{log.user_name}</p>
                                            <p className="text-[10px] text-[#9ca3af] font-bold uppercase tracking-wider">{log.status || 'Active'}</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-[11px] font-bold text-[#111827]">{log.clock_in ? new Date(log.clock_in).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--'}</p>
                                        <p className={`text-[9px] font-bold uppercase tracking-wider mt-1 ${log.clock_out ? 'text-emerald-600' : 'text-indigo-600 animate-pulse'}`}>
                                            {log.clock_out ? `Shift Ended` : 'In Progress'}
                                        </p>
                                    </div>
                                </div>
                            ))}
                            {(!teamLogs || teamLogs.length === 0) && (
                                <div className="text-center py-8 bg-slate-50 rounded-2xl border border-dashed border-[#e5e7eb] cursor-pointer hover:bg-slate-100 transition-all" onClick={async () => {
                                    try {
                                        const { data } = await api.get('/attendance/team');
                                        setTeamLogs(data);
                                    } catch(e) { console.error(e) }
                                }}>
                                    <p className="text-[#6b7280] font-bold uppercase tracking-wider text-[11px]">Sync team worklogs</p>
                                </div>
                            )}
                        </div>
                    </section>
                </div>

                {/* Right Column: Approvals & Pulse */}
                <div className="space-y-8">
                <div className="space-y-6">
                    <section className="bg-indigo-600 p-8 rounded-[24px] text-white shadow-lg shadow-indigo-100 relative overflow-hidden group">
                        <h2 className="text-xl font-bold mb-6 flex items-center gap-3 relative z-10">
                            <Zap className="text-white fill-current" size={20} />
                            Project Velocity
                        </h2>
                        <p className="text-indigo-100 font-medium mb-8 relative z-10 leading-relaxed text-sm">
                            Your department's output is consistently above the <span className="text-white font-bold opacity-100 underline decoration-indigo-400 decoration-2 underline-offset-4">92% efficiency</span> baseline.
                        </p>
                        <div className="space-y-3 relative z-10">
                            <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-indigo-200">
                                <span>Resource Load</span>
                                <span className="text-white font-bold">88%</span>
                            </div>
                            <div className="w-full h-1.5 bg-indigo-900/30 rounded-full overflow-hidden">
                                <motion.div initial={{ width: 0 }} animate={{ width: '88%' }} className="h-full bg-white rounded-full" />
                            </div>
                        </div>
                    </section>

                    <div className="bg-white p-6 rounded-[24px] border border-[#e5e7eb] shadow-sm">
                        <h4 className="text-base font-bold text-[#111827] mb-6 flex items-center gap-2">
                             Activity Pulse
                        </h4>
                        <div className="space-y-3">
                            <AlertItem text="Frontend Squad optimal (94%)" type="positive" onClick={() => handlePulseClick('frontend')} />
                            <AlertItem text="3 projects approaching deadline" type="warning" onClick={() => handlePulseClick('deadlines')} />
                        </div>
                    </div>
                </div>
                </div>
            </div>

            {/* Project Management Section */}
            <div className="space-y-8">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-3xl font-black text-slate-900 tracking-tight">Project Management</h2>
                        <p className="text-slate-500 font-medium">Create and assign ongoing projects to your team.</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                    {/* Create & Assign Forms */}
                    <div className="space-y-6">
                        <div className="bg-white p-8 rounded-[24px] border border-[#e5e7eb] shadow-sm">
                            <h3 className="text-lg font-bold text-[#111827] mb-6 flex items-center gap-2">
                                <Plus size={20} className="text-indigo-600" /> New Project Initiative
                            </h3>
                            <form onSubmit={handleCreateProject} className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <label className="text-[11px] font-bold text-[#6b7280] uppercase tracking-wider ml-1">Title</label>
                                        <input
                                            value={newProject.name}
                                            onChange={e => setNewProject({ ...newProject, name: e.target.value })}
                                            className="w-full px-4 py-3 bg-[#fcfdfe] border border-[#e5e7eb] rounded-xl text-sm font-medium focus:border-indigo-500 outline-none"
                                            placeholder="System Architecture"
                                            required
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-[11px] font-bold text-[#6b7280] uppercase tracking-wider ml-1">Deadline</label>
                                        <input
                                            type="date"
                                            value={newProject.deadline}
                                            onChange={e => setNewProject({ ...newProject, deadline: e.target.value })}
                                            className="w-full px-4 py-3 bg-[#fcfdfe] border border-[#e5e7eb] rounded-xl text-sm font-medium focus:border-indigo-500 outline-none"
                                            required
                                        />
                                    </div>
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[11px] font-bold text-[#6b7280] uppercase tracking-wider ml-1">Project Specs</label>
                                    <textarea
                                        value={newProject.description}
                                        onChange={e => setNewProject({ ...newProject, description: e.target.value })}
                                        className="w-full px-4 py-3 bg-[#fcfdfe] border border-[#e5e7eb] rounded-xl text-sm font-medium focus:border-indigo-500 outline-none h-24 resize-none"
                                        placeholder="Core requirements and goals..."
                                    />
                                </div>
                                <button
                                    type="submit"
                                    disabled={projectLoading}
                                    className="w-full bg-indigo-600 text-white py-4 rounded-xl font-bold hover:bg-indigo-700 transition-all shadow-md shadow-indigo-100 flex items-center justify-center gap-2"
                                >
                                    {projectLoading ? <Loader2 className="animate-spin" size={20} /> : <CheckCircle size={20} />}
                                    Deploy Project
                                </button>
                            </form>
                        </div>

                        <div className="bg-white p-8 rounded-[24px] border border-[#e5e7eb] shadow-sm">
                            <h3 className="text-lg font-bold text-[#111827] mb-6 flex items-center gap-2">
                                <History size={20} className="text-indigo-600" /> Delegate Single Task
                            </h3>
                            <form onSubmit={handleCreateTask} className="space-y-4">
                                <div className="space-y-1.5">
                                    <label className="text-[11px] font-bold text-[#6b7280] uppercase tracking-wider ml-1">Objective</label>
                                    <input
                                        value={newTask.title}
                                        onChange={e => setNewTask({ ...newTask, title: e.target.value })}
                                        className="w-full px-4 py-3 bg-[#fcfdfe] border border-[#e5e7eb] rounded-xl text-sm font-medium focus:border-indigo-500 outline-none"
                                        placeholder="Review component library"
                                        required
                                    />
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <label className="text-[11px] font-bold text-[#6b7280] uppercase tracking-wider ml-1">Member</label>
                                        <select
                                            value={newTask.assigned_to}
                                            onChange={e => setNewTask({ ...newTask, assigned_to: e.target.value })}
                                            className="w-full px-4 py-3 bg-[#fcfdfe] border border-[#e5e7eb] rounded-xl text-sm font-bold text-[#374151] focus:border-indigo-500 outline-none"
                                            required
                                        >
                                            <option value="">Select Employee...</option>
                                            {employeesOptions.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                                        </select>
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-[11px] font-bold text-[#6b7280] uppercase tracking-wider ml-1">Due</label>
                                        <input
                                            type="date"
                                            value={newTask.due_date}
                                            onChange={e => setNewTask({ ...newTask, due_date: e.target.value })}
                                            className="w-full px-4 py-3 bg-[#fcfdfe] border border-[#e5e7eb] rounded-xl text-sm font-medium focus:border-indigo-500 outline-none"
                                            required
                                        />
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                     <div className="space-y-1.5">
                                        <label className="text-[11px] font-bold text-[#6b7280] uppercase tracking-wider ml-1">Level</label>
                                        <select
                                            value={newTask.priority}
                                            onChange={e => setNewTask({ ...newTask, priority: e.target.value })}
                                            className="w-full px-4 py-3 bg-[#fcfdfe] border border-[#e5e7eb] rounded-xl text-sm font-bold text-[#374151] focus:border-indigo-500 outline-none"
                                        >
                                            <option value="Low">Standard</option>
                                            <option value="Medium">Elevated</option>
                                            <option value="High">Urgent</option>
                                        </select>
                                    </div>
                                </div>
                                <button
                                    type="submit"
                                    disabled={taskLoading}
                                    className="w-full bg-[#111827] text-white py-4 rounded-xl font-bold hover:bg-black transition-all shadow-md flex items-center justify-center gap-2"
                                >
                                    {taskLoading ? <Loader2 className="animate-spin" size={20} /> : <Plus size={20} />}
                                    Authorize Assignment
                                </button>
                            </form>
                        </div>
                    </div>

                    {/* Project & Task Lists */}
                    <div className="space-y-6">
                        {/* Project List */}
                        <div className="bg-white p-8 rounded-[24px] border border-[#e5e7eb] shadow-sm">
                            <h3 className="text-xl font-bold text-[#111827] mb-8 flex items-center gap-3">
                                <Plus className="text-indigo-600" size={24} /> Active Projects
                            </h3>
                            <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                                {projects.length === 0 ? (
                                    <div className="text-center py-10 bg-slate-50 rounded-2xl border border-dashed border-[#e5e7eb]">
                                        <p className="font-bold uppercase tracking-wider text-[11px] text-[#6b7280]">No active projects</p>
                                    </div>
                                ) : (
                                    projects.map(proj => (
                                        <div key={proj.id} className="p-5 rounded-xl bg-white border border-[#f3f4f6] hover:border-indigo-500 hover:shadow-md transition-all group">
                                            <div className="flex justify-between items-start mb-2">
                                                <h4 className="text-sm font-bold text-[#111827] group-hover:text-indigo-600 transition-colors uppercase tracking-tight">{proj.name}</h4>
                                                <span className="px-2 py-0.5 bg-indigo-50 text-indigo-600 rounded text-[9px] font-bold uppercase tracking-wider">PROJECT</span>
                                            </div>
                                            <p className="text-[11px] text-slate-500 font-medium mb-3 line-clamp-2">{proj.description || 'No description provided.'}</p>
                                            <div className="flex justify-between items-center pt-3 border-t border-[#f3f4f6]">
                                                <div className="flex items-center gap-2 font-bold text-[10px] text-[#9ca3af] uppercase tracking-wider">
                                                    <Clock size={12} /> Due: {proj.deadline}
                                                </div>
                                                <span className="text-[10px] font-bold text-slate-500">{proj.assigned_employees || 'Unassigned'}</span>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>

                        {/* Task List */}
                    <div className="bg-white p-8 rounded-[24px] border border-[#e5e7eb] shadow-sm">
                        <h3 className="text-xl font-bold text-[#111827] mb-8 flex items-center gap-3">
                            <Target className="text-indigo-600" size={24} /> Active Assignments
                        </h3>
                        <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
                            {tasks.length === 0 ? (
                                <div className="text-center py-20 bg-slate-50 rounded-2xl border border-dashed border-[#e5e7eb]">
                                    <Target size={40} className="mx-auto mb-4 text-[#9ca3af]" />
                                    <p className="font-bold uppercase tracking-wider text-[11px] text-[#6b7280]">No active delegations</p>
                                </div>
                            ) : (
                                tasks.map(task => (
                                    <div key={task.id} className="p-5 rounded-xl bg-white border border-[#f3f4f6] hover:border-indigo-500 hover:shadow-md transition-all group">
                                        <div className="flex justify-between items-start mb-3">
                                            <div>
                                                <h4 className="text-sm font-bold text-[#111827] group-hover:text-indigo-600 transition-colors uppercase tracking-tight">{task.title}</h4>
                                                <p className="text-[10px] text-[#6b7280] font-bold uppercase tracking-wider mt-1">{task.assigned_to_name}</p>
                                            </div>
                                            <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${
                                                task.priority === 'High' ? 'bg-rose-50 text-rose-600' : 
                                                task.priority === 'Medium' ? 'bg-amber-50 text-amber-600' : 
                                                'bg-indigo-50 text-indigo-600'
                                            }`}>{task.priority}</span>
                                        </div>
                                        <div className="flex justify-between items-center pt-3 border-t border-[#f3f4f6]">
                                            <div className="flex items-center gap-2 font-bold text-[10px] text-[#9ca3af] uppercase tracking-wider">
                                                <Clock size={12} /> Due: {task.due_date}
                                            </div>
                                            <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${
                                                task.status === 'Completed' ? 'bg-emerald-50 text-emerald-700' :
                                                task.status === 'In Progress' ? 'bg-violet-50 text-violet-700' :
                                                'bg-slate-100 text-[#6b7280]'
                                            }`}>{task.status}</span>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                    </div>
                </div>
            </div>

            {/* Pulse: Frontend Squad Detail */}
            <DetailModal isOpen={activeModal === 'pulseFrontend'} onClose={() => setActiveModal(null)} title="Squad Insight: Frontend">
                {pulseLoading ? <div className="py-20 flex justify-center"><Loader2 className="animate-spin text-indigo-600" size={40} /></div> : pulseData && (
                    <div className="space-y-10">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="bg-indigo-600 p-8 rounded-[32px] text-white shadow-xl shadow-indigo-100 flex items-center justify-between">
                                <div>
                                    <p className="text-[10px] font-black uppercase tracking-[0.2em] mb-2 opacity-70">Team Synergy</p>
                                    <h4 className="text-4xl font-black">{pulseData?.overallProductivity}%</h4>
                                </div>
                                <div className="w-16 h-16 bg-white/20 rounded-3xl flex items-center justify-center backdrop-blur-md">
                                    <Zap size={32} className="fill-current" />
                                </div>
                            </div>
                            <div className="bg-slate-50 p-8 rounded-[32px] border border-slate-100 flex items-center justify-between">
                                <div>
                                    <p className="text-[10px] font-black uppercase tracking-[0.2em] mb-2 text-slate-400">Squad Size</p>
                                    <h4 className="text-4xl font-black text-slate-900">{pulseData?.members?.length} Members</h4>
                                </div>
                                <Users className="text-indigo-600 opacity-20" size={48} />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-6">
                                <h5 className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                                    <Target size={14} className="text-indigo-600" /> Active Projects
                                </h5>
                                <div className="space-y-4">
                                    {pulseData?.projects?.map((p, i) => (
                                        <div key={i} className="bg-white border border-slate-100 p-5 rounded-3xl shadow-sm">
                                            <div className="flex justify-between items-center mb-3">
                                                <p className="font-black text-slate-900 text-sm">{p.name}</p>
                                                <span className={`text-[9px] font-black px-2 py-1 rounded-full uppercase ${p.status === 'On Track' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>{p.status}</span>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                                    <div className="h-full bg-indigo-600 rounded-full" style={{ width: `${p.progress}%` }} />
                                                </div>
                                                <span className="text-[10px] font-black text-slate-400">{p.progress}%</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <div className="space-y-6">
                                <h5 className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                                    <Users size={14} className="text-indigo-600" /> Member Focus
                                </h5>
                                <div className="space-y-4">
                                    {pulseData?.members?.map((m, i) => (
                                        <div key={i} className="flex items-center justify-between bg-slate-50/50 p-4 rounded-3xl border border-dashed border-slate-200">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center font-black text-indigo-600 shadow-sm">{m?.name?.[0] || '?'}</div>
                                                <div>
                                                    <p className="text-xs font-black text-slate-900 leading-none mb-1">{m.name}</p>
                                                    <p className="text-[9px] text-slate-400 font-bold uppercase tracking-tighter">{m.role}</p>
                                                </div>
                                            </div>
                                            <span className="text-xs font-black text-indigo-600">{m.productivity_score}%</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="bg-slate-900 p-8 rounded-[40px] text-white">
                            <h5 className="text-xs font-black uppercase tracking-widest text-indigo-400 mb-6 flex items-center gap-2">
                                <History size={14} /> Propagation Stream
                            </h5>
                            <div className="space-y-5">
                                {pulseData?.activityLogs?.map((log, i) => (
                                    <div key={i} className="flex gap-4 border-l border-white/10 pl-6 relative">
                                        <div className="absolute left-[-4.5px] top-1.5 w-2 h-2 rounded-full bg-indigo-500" />
                                        <div>
                                            <p className="text-xs font-bold text-slate-300">{log.user} <span className="text-indigo-400 opacity-60 underline decoration-indigo-500/30 ml-1">{log.action}</span></p>
                                            <p className="text-[9px] text-slate-500 font-bold uppercase mt-1">{new Date(log.timestamp).toLocaleTimeString()}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}
            </DetailModal>

            {/* Pulse: Deadlines Detail */}
            <DetailModal isOpen={activeModal === 'pulseDeadlines'} onClose={() => setActiveModal(null)} title="Risk Assessment: Deadlines">
                {pulseLoading ? <div className="py-20 flex justify-center"><Loader2 className="animate-spin text-indigo-600" size={40} /></div> : (
                    <div className="space-y-8">
                        <div className="grid grid-cols-1 gap-4">
                            {Array.isArray(pulseData) && pulseData.map((project, i) => (
                                <div key={i} className={`p-8 rounded-[40px] border transition-all flex flex-col md:flex-row md:items-center justify-between gap-6 ${project.isUrgent ? 'bg-red-50 border-red-100 shadow-xl shadow-red-100/30' : 'bg-slate-50 border-slate-100'}`}>
                                    <div className="flex items-center gap-6">
                                        <div className={`w-16 h-16 rounded-3xl flex items-center justify-center shadow-sm border-2 ${project.isUrgent ? 'bg-white text-red-600 border-red-50' : 'bg-white text-indigo-600 border-indigo-50'}`}>
                                            <Flag size={32} />
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-3 mb-1">
                                                <h5 className={`text-xl font-black ${project.isUrgent ? 'text-red-900' : 'text-slate-900'}`}>{project.projectName}</h5>
                                                {project.isUrgent && <span className="px-3 py-1 bg-red-600 text-white rounded-full text-[9px] font-black uppercase tracking-widest animate-pulse">URGENT</span>}
                                            </div>
                                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{project.assignedTeam} &bull; Deadline: {project.deadline}</p>
                                        </div>
                                    </div>
                                    <div className="flex flex-col md:items-end gap-3 min-w-[200px]">
                                        <div className="flex justify-between w-full text-[10px] font-black uppercase tracking-widest mb-1">
                                            <span className={project.isUrgent ? 'text-red-600' : 'text-slate-400'}>{project.daysRemaining} Days Left</span>
                                            <span className="text-slate-900">{project.progress}%</span>
                                        </div>
                                        <div className="w-full h-2.5 bg-white rounded-full overflow-hidden border border-slate-200">
                                            <div className={`h-full rounded-full ${project.isUrgent ? 'bg-red-600' : 'bg-indigo-600'}`} style={{ width: `${project.progress}%` }} />
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div className="p-8 bg-black rounded-[40px] text-white flex items-center gap-8 relative overflow-hidden group">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/20 rounded-full -mr-16 -mt-16 blur-3xl" />
                            <div className="w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center shrink-0 backdrop-blur-md">
                                <AlertCircle className="text-amber-400" size={28} />
                            </div>
                            <div>
                                <p className="text-sm font-black text-white mb-1">Risk Mitigation Strategy</p>
                                <p className="text-xs text-slate-400 leading-relaxed font-medium">Auto-suggesting resource reallocation from <span className="text-indigo-400">Design Systems</span> to <span className="text-red-400">Mobile Alpha</span> due to critical timeline pressure.</p>
                            </div>
                        </div>
                    </div>
                )}
            </DetailModal>

            {/* Direct Reports Modal */}
            <DetailModal isOpen={activeModal === 'reports'} onClose={() => setActiveModal(null)} title="Team Directory">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {team.map(member => (
                        <div key={member.id} className="bg-slate-50 p-6 rounded-[32px] border border-slate-100 flex items-center justify-between group hover:border-indigo-600 transition-all">
                            <div className="flex items-center gap-4">
                                <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center font-black text-indigo-600 shadow-sm shrink-0 border-2 border-transparent group-hover:border-indigo-100 transition-all">{member.name[0]}</div>
                                <div className="min-w-0">
                                    <p className="font-black text-slate-900 group-hover:text-indigo-600 transition-colors truncate">{member.name}</p>
                                    <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-1 truncate">{member.role}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                                <button 
                                    onClick={() => {
                                        setReviewForm({ ...reviewForm, userId: member.id });
                                        setActiveModal('submitReview');
                                    }}
                                    className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all"
                                    title="Submit Review"
                                >
                                    <Star size={18} />
                                </button>
                                <span className="px-3 py-1 bg-indigo-50 text-indigo-600 rounded-full text-[9px] font-black uppercase tracking-widest transition-all">ACTIVE</span>
                            </div>
                        </div>
                    ))}
                </div>
            </DetailModal>


            {/* Productivity Modal */}
            <DetailModal isOpen={activeModal === 'productivity'} onClose={() => setActiveModal(null)} title="Avg. Team Productivity">
                <div className="space-y-10">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <MetricsSummary label="Focus Level" value="94%" trend="+2%" />
                        <MetricsSummary label="Daily Output" value="7.8h" trend="+0.4h" />
                        <MetricsSummary label="Task Velocity" value="8.2" trend="+1.1" />
                        <MetricsSummary label="Engagement" value="88%" trend="-1%" />
                    </div>
                    <div className="bg-slate-50 p-8 rounded-[40px] border border-slate-100">
                        <h4 className="text-lg font-black text-slate-900 mb-6 flex items-center gap-2">
                            <Briefcase size={20} className="text-indigo-600" /> Productivity Factors
                        </h4>
                        <div className="space-y-4">
                            {[
                                { factor: 'Internal Communication', score: 92, color: 'bg-indigo-600' },
                                { factor: 'Technical Overhead', score: 14, color: 'bg-red-500' },
                                { factor: 'Meeting Focus', score: 78, color: 'bg-emerald-500' }
                            ].map((f, i) => (
                                <div key={i} className="space-y-2">
                                    <div className="flex justify-between text-[11px] font-black uppercase tracking-widest text-slate-500">
                                        <span>{f.factor}</span>
                                        <span>{f.score}%</span>
                                    </div>
                                    <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                                        <div className={`h-full ${f.color} rounded-full`} style={{ width: `${f.score}%` }} />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </DetailModal>

            {/* Capacity Modal */}
            <DetailModal isOpen={activeModal === 'capacity'} onClose={() => setActiveModal(null)} title="Resource Allocation">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <CapacityCard label="Frontend Team" value="88%" status="Optimal" color="indigo" />
                    <CapacityCard label="Backend Core" value="94%" status="Critical" color="red" />
                    <CapacityCard label="Design Systems" value="65%" status="Available" color="emerald" />
                </div>
            </DetailModal>

            {/* Team Logs Modal */}
            <DetailModal isOpen={activeModal === 'teamLogs'} onClose={() => setActiveModal(null)} title="Department Attendance History">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-50">
                                <th className="pb-4 px-2">Employee</th>
                                <th className="pb-4 px-2">Date</th>
                                <th className="pb-4 px-2">Started</th>
                                <th className="pb-4 px-2">Ended</th>
                                <th className="pb-4 px-2 text-right">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {(teamLogs || []).map(log => (
                                <tr key={log.id} className="text-sm font-bold text-slate-600 hover:bg-slate-50/50 transition-colors">
                                    <td className="py-4 px-2 text-slate-900">{log.user_name}</td>
                                    <td className="py-4 px-2">{log.date || 'N/A'}</td>
                                    <td className="py-4 px-2">{log.clock_in ? new Date(log.clock_in).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--'}</td>
                                    <td className="py-4 px-2">{log.clock_out ? new Date(log.clock_out).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--'}</td>
                                    <td className="py-4 px-2 text-right">
                                        <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest border ${
                                            log.status === 'Present' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                                            log.status === 'Half Day' ? 'bg-amber-50 text-amber-600 border-amber-100' :
                                            'bg-indigo-50 text-indigo-600 animate-pulse border-indigo-100'
                                        }`}>
                                            {log.status || (log.clock_out ? 'Present' : 'Active')}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </DetailModal>

            {/* Team Leave Balances Modal */}
            <DetailModal isOpen={activeModal === 'teamBalances'} onClose={() => setActiveModal(null)} title="Team Leave Balances">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-50">
                                <th className="pb-4 px-2">Member</th>
                                <th className="pb-4 px-2">Total</th>
                                <th className="pb-4 px-2">Used</th>
                                <th className="pb-4 px-2 text-right">Remaining</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {teamBalances.map(bal => (
                                <tr key={bal.id} className="text-sm font-bold text-slate-600 hover:bg-slate-50/50 transition-colors">
                                    <td className="py-4 px-2 text-slate-900 font-black">{bal.user_name}</td>
                                    <td className="py-4 px-2">{bal.total_leaves}</td>
                                    <td className="py-4 px-2 text-rose-500">{bal.used_leaves}</td>
                                    <td className="py-4 px-2 text-right">
                                        <span className="px-2 py-1 bg-emerald-50 text-emerald-600 rounded-lg border border-emerald-100 font-black">
                                            {bal.remaining_leaves} Days
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </DetailModal>

            {/* Submit Performance Review Modal */}
            <DetailModal isOpen={activeModal === 'submitReview'} onClose={() => setActiveModal(null)} title="Author Performance Review">
                 <form onSubmit={handleSubmitReview} className="space-y-6">
                    <div className="bg-indigo-50 p-6 rounded-[32px] border border-indigo-100 flex items-center gap-4">
                        <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-indigo-600 font-extrabold shadow-sm border border-indigo-100">
                             {team.find(m => m.id === reviewForm.userId)?.name?.[0] || '?'}
                        </div>
                        <div>
                             <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Reviewing Subordinate</p>
                             <p className="text-lg font-black text-slate-900 leading-none">{team.find(m => m.id === reviewForm.userId)?.name || 'Direct Report'}</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                         <div className="space-y-1.5">
                            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider ml-1">Evaluation Score (1-5)</label>
                            <input 
                                type="number" 
                                min="1" 
                                max="5" 
                                value={reviewForm.rating}
                                onChange={e => setReviewForm({...reviewForm, rating: e.target.value})}
                                className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-black focus:border-indigo-600 outline-none transition-all"
                            />
                         </div>
                         <div className="space-y-1.5">
                            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider ml-1">Performance Bonus ($)</label>
                            <input 
                                type="number" 
                                min="0"
                                value={reviewForm.bonus_amount}
                                onChange={e => setReviewForm({...reviewForm, bonus_amount: e.target.value})}
                                className="w-full px-5 py-4 bg-emerald-50 border border-emerald-100 rounded-2xl text-sm font-black focus:border-emerald-600 focus:bg-white outline-none transition-all"
                                placeholder="0.00"
                            />
                         </div>
                    </div>
                    <div className="space-y-1.5">
                       <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider ml-1">Review Period</label>
                       <select 
                           value={reviewForm.period}
                           onChange={e => setReviewForm({...reviewForm, period: e.target.value})}
                           className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-black focus:border-indigo-600 outline-none transition-all cursor-pointer"
                       >
                           <option value="Q1 2026">Q1 2026 (Jan - Mar)</option>
                           <option value="Q2 2026">Q2 2026 (Apr - Jun)</option>
                           <option value="April 2026">April 2026</option>
                       </select>
                    </div>


                    <div className="space-y-1.5">
                         <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider ml-1">Qualitative Feedback</label>
                         <textarea 
                            value={reviewForm.feedback}
                            onChange={e => setReviewForm({...reviewForm, feedback: e.target.value})}
                            className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-3xl text-sm font-bold focus:border-indigo-600 outline-none h-32 resize-none"
                            placeholder="Detail player accomplishments, synergy, and growth areas..."
                            required
                         />
                    </div>

                    <div className="space-y-1.5">
                         <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider ml-1">Performance Tags</label>
                         <div className="flex flex-wrap gap-2">
                             {['Top Performer', 'Leadership', 'Technical Excellence', 'Team Player', 'Growth Mindset'].map(tag => (
                                 <button 
                                    key={tag}
                                    type="button"
                                    onClick={() => {
                                        const tags = reviewForm.tags.includes(tag) 
                                            ? reviewForm.tags.filter(t => t !== tag)
                                            : [...reviewForm.tags, tag];
                                        setReviewForm({...reviewForm, tags});
                                    }}
                                    className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border ${
                                        reviewForm.tags.includes(tag) 
                                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-100' 
                                        : 'bg-white text-slate-400 border-slate-100 hover:border-indigo-200'
                                    }`}
                                 >
                                     {tag}
                                 </button>
                             ))}
                         </div>
                    </div>

                    <button 
                        type="submit" 
                        disabled={submittingReview}
                        className="w-full bg-indigo-600 text-white py-5 rounded-3xl font-black uppercase tracking-[0.2em] shadow-2xl shadow-indigo-200 hover:bg-indigo-700 active:scale-[0.98] transition-all flex items-center justify-center gap-3"
                    >
                        {submittingReview ? <Loader2 className="animate-spin" size={20} /> : <Zap size={20} />}
                        Log Final Evaluation
                    </button>
                 </form>
            </DetailModal>
        </div>
    );
};

const ManagerStatCard = ({ label, value, icon: Icon, color, bgColor, onClick, trend }) => (
    <button
        onClick={onClick}
        className="bg-white p-6 rounded-[24px] border border-[#e5e7eb] shadow-sm group hover:border-indigo-600 hover:shadow-md transition-all text-left w-full cursor-pointer"
    >
        <div className="flex items-center justify-between mb-4">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all group-hover:bg-indigo-600 group-hover:text-white ${bgColor || 'bg-slate-50'} ${color || 'text-[#6b7280]'}`}>
                <Icon size={24} />
            </div>
            {trend && <div className="px-2 py-0.5 bg-rose-50 text-rose-600 rounded-lg text-[9px] font-bold uppercase tracking-wider">{trend}</div>}
        </div>
        <h4 className="text-2xl font-bold text-[#111827] mb-1 tracking-tight">{value}</h4>
        <p className="text-[11px] font-bold text-[#6b7280] uppercase tracking-wider">{label}</p>
    </button>
);

const MetricsSummary = ({ label, value, trend }) => (
    <div className="bg-white p-6 rounded-2xl border border-[#e5e7eb] text-center flex flex-col items-center">
        <p className="text-[10px] font-bold text-[#6b7280] uppercase tracking-wider mb-2">{label}</p>
        <p className="text-xl font-bold text-[#111827] mb-1">{value}</p>
        <span className={`text-[10px] font-bold uppercase ${trend.startsWith('+') ? 'text-emerald-600' : 'text-rose-600'}`}>{trend}</span>
    </div>
);

const CapacityCard = ({ label, value, status, color }) => (
    <div className="bg-[#fcfdfe] p-6 rounded-2xl border border-[#e5e7eb] text-center group hover:border-indigo-600 transition-all">
        <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center mx-auto mb-4 text-[#6b7280] shadow-sm border border-[#e5e7eb] group-hover:bg-indigo-600 group-hover:text-white transition-all">
            <LayoutGrid size={20} />
        </div>
        <p className="text-[11px] font-bold text-[#6b7280] uppercase tracking-wider mb-1">{label}</p>
        <h3 className="text-2xl font-bold text-[#111827] mb-2">{value}</h3>
        <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${
            color === 'red' ? 'bg-rose-50 text-rose-600' : 'bg-emerald-50 text-emerald-600'
        }`}>{status}</span>
    </div>
);

const AlertItem = ({ text, type, onClick }) => (
    <button onClick={onClick} className="w-full flex items-center justify-between p-4 bg-[#fcfdfe] hover:bg-slate-50 border border-[#f3f4f6] rounded-xl transition-all group">
         <div className="flex items-center gap-3">
             <div className={`w-2 h-2 rounded-full ${type === 'warning' ? 'bg-amber-500' : 'bg-emerald-500'}`} />
             <span className="text-sm font-medium text-[#374151]">{text}</span>
         </div>
         <ArrowRight size={14} className="text-[#9ca3af] group-hover:text-indigo-600 group-hover:translate-x-1 transition-all" />
    </button>
);

export default ManagerDashboard;
