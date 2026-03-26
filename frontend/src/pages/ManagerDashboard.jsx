import React, { useState, useEffect } from 'react';
import api from '../services/api';
import DetailModal from '../components/DetailModal';
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
    Loader2
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
    const [team, setTeam] = useState([]);
    const [leaves, setLeaves] = useState([]);
    const [metrics, setMetrics] = useState([]);
    const [loading, setLoading] = useState(true);
    const [teamLeaves, setTeamLeaves] = useState([]);
    const [teamLogs, setTeamLogs] = useState([]);

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

    const fetchData = async () => {
        try {
            const [teamRes, leavesRes, metricsRes, teamLeavesRes] = await Promise.all([
                api.get('/manager/team'),
                api.get('/leave/all-pending'),
                api.get('/admin/metrics'),
                api.get('/leave/team')
            ]);
            setTeam(teamRes.data || []);
            setLeaves(leavesRes.data);
            setMetrics(metricsRes.data);
            setTeamLeaves(teamLeavesRes.data || []);
            fetchProjects();
            fetchManagedTasks();
        } catch (err) { console.error(err) }
        finally { setLoading(false) }
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
            setNewProject({ name: '', description: '', deadline: '' });
            fetchProjects();
        } catch (err) { alert(err.response?.data?.error || 'Failed to create project'); }
        finally { setProjectLoading(false); }
    };

    const handleAssignProject = async (e) => {
        e.preventDefault();
        try {
            setProjectLoading(true);
            await api.post('/projects/assign', assignment);
            setAssignment({ project_id: '', employee_id: '' });
            fetchProjects();
        } catch (err) { alert(err.response?.data?.error || 'Failed to assign project'); }
        finally { setProjectLoading(false); }
    };

    const handleCreateTask = async (e) => {
        e.preventDefault();
        try {
            setTaskLoading(true);
            await api.post('/tasks', newTask);
            setNewTask({ title: '', description: '', priority: 'Medium', due_date: '', assigned_to: '' });
            fetchManagedTasks();
            alert('Task assigned successfully!');
        } catch (err) { alert(err.response?.data?.error || 'Failed to assign task'); }
        finally { setTaskLoading(false); }
    };

    const COLORS = ['#4F46E5', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];

    if (loading) return <div className="flex items-center justify-center min-h-[60vh]"><Loader2 className="animate-spin text-indigo-600" size={48} /></div>;

    return (
        <div className="space-y-10 animate-in fade-in duration-700">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-4xl font-black text-slate-900 tracking-tight">Team Performance</h1>
                    <p className="text-slate-500 font-medium">Monitoring department productivity and workflows.</p>
                </div>
                <div className="flex items-center gap-3">
                    <button className="px-6 py-3.5 bg-white border border-slate-100 rounded-2xl font-bold text-slate-600 hover:border-indigo-600 hover:text-indigo-600 transition-all shadow-sm flex items-center gap-2">
                        <Filter size={18} />
                        <span>Filters</span>
                    </button>
                </div>

            </div>

            {/* Top Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <ManagerStatCard
                    label="Direct Reports"
                    value={team.length}
                    icon={Users}
                    color="indigo"
                    onClick={() => setActiveModal('reports')}
                />
                <ManagerStatCard
                    label="Pending Approval"
                    value={leaves.length}
                    icon={Hourglass}
                    color="orange"
                    onClick={() => navigate('/leave')}
                />
                <ManagerStatCard
                    label="Avg. Productivity"
                    value="92.1%"
                    icon={TrendingUp}
                    color="emerald"
                    onClick={() => setActiveModal('productivity')}
                />
                <ManagerStatCard
                    label="Team Capacity"
                    value="84%"
                    icon={LayoutGrid}
                    color="purple"
                    onClick={() => setActiveModal('capacity')}
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Main Content Area */}
                <div className="lg:col-span-2 space-y-8">
                    {/* Performance Chart */}
                    <section className="bg-white p-10 rounded-[40px] border border-slate-100 shadow-xl shadow-slate-200/50">
                        <div className="flex items-center justify-between mb-10">
                            <div>
                                <h2 className="text-2xl font-black text-slate-900 tracking-tight">Department Metrics</h2>
                                <p className="text-sm text-slate-400 font-medium uppercase tracking-widest mt-1">Average Weekly Work Duration</p>
                            </div>
                        </div>
                        <div className="h-80 w-full font-bold">
                            <ResponsiveContainer width="100%" height="100%">
                                <ReBarChart data={metrics.length > 0 ? metrics : [
                                    { role: 'Engineering', avg_work_duration: 32000 },
                                    { role: 'Product', avg_work_duration: 28000 },
                                ]}>
                                    <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="#f1f5f9" />
                                    <XAxis dataKey="role" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12, fontWeight: 700 }} dy={15} />
                                    <YAxis hide />
                                    <Tooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: '24px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)', fontWeight: 'bold' }} />
                                    <Bar dataKey="avg_work_duration" radius={[12, 12, 12, 12]} barSize={40}>
                                        {(metrics.length > 0 ? metrics : [1, 2, 3, 4]).map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Bar>
                                </ReBarChart>
                            </ResponsiveContainer>
                        </div>
                    </section>

                    {/* Team Attendance View - NEW */}
                    <section className="bg-white p-10 rounded-[40px] border border-slate-100 shadow-xl shadow-slate-200/50">
                        <div className="flex items-center justify-between mb-8">
                            <div>
                                <h2 className="text-2xl font-black text-slate-900 tracking-tight">Real-time Team Logs</h2>
                                <p className="text-sm text-slate-400 font-medium">Monitoring active sessions and site attendance.</p>
                            </div>
                            <button 
                                onClick={async () => {
                                    try {
                                        const { data } = await api.get('/time/team-hours');
                                        setTeamLogs(data);
                                        setActiveModal('teamLogs');
                                    } catch(e) { console.error(e) }
                                }}
                                className="px-5 py-2.5 bg-indigo-50 border border-indigo-100 rounded-xl font-black text-indigo-600 text-[10px] uppercase tracking-widest hover:bg-indigo-600 hover:text-white transition-all shadow-sm"
                            >
                                View Full History
                            </button>
                        </div>
                        <div className="space-y-4">
                            {(teamLogs || []).slice(0, 5).map(log => (
                                <div key={log.id} className="p-5 bg-slate-50 border border-slate-100 rounded-2xl flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center font-black text-indigo-600 shadow-sm">{log.userName[0]}</div>
                                        <div>
                                            <p className="text-sm font-black text-slate-900 leading-none mb-1">{log.userName}</p>
                                            <p className="text-[9px] text-slate-400 font-bold uppercase">{log.status}</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-[10px] font-black text-slate-900">{log.checkIn ? new Date(log.checkIn).toLocaleTimeString() : '--'}</p>
                                        <p className="text-[8px] text-slate-400 font-black uppercase mt-1">{log.checkOut ? 'COMPLETED' : 'IN PROGRESS'}</p>
                                    </div>
                                </div>
                            ))}
                            {(!teamLogs || teamLogs.length === 0) && <p className="text-center py-10 text-slate-400 font-bold uppercase tracking-widest text-xs border-2 border-dashed border-slate-100 rounded-3xl opacity-50">No recent logs found</p>}
                        </div>
                    </section>
                </div>

                {/* Right Column: Approvals & Pulse */}
                <div className="space-y-8">
                    <section className="bg-indigo-600 p-10 rounded-[40px] text-white shadow-2xl relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32 blur-3xl transition-transform group-hover:scale-110" />
                        <h2 className="text-2xl font-black mb-6 flex items-center gap-3 relative z-10">
                            <Zap className="text-white fill-current" size={24} />
                            Team Efficiency
                        </h2>
                        <p className="text-indigo-100 font-medium mb-8 relative z-10 leading-relaxed text-sm">
                            Department is currently operating at <span className="text-white font-black underline decoration-white/30 decoration-2">92% capacity</span> with optimal resource distribution.
                        </p>
                        <div className="space-y-4 relative z-10">
                            <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-indigo-200">
                                <span>Utilization Rate</span>
                                <span className="text-white">88%</span>
                            </div>
                            <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                                <div className="h-full bg-white rounded-full" style={{ width: '88%' }} />
                            </div>
                        </div>
                    </section>

                    <div className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-xl shadow-slate-200/50">
                        <h4 className="text-lg font-black text-slate-900 mb-6 flex items-center gap-2">
                            <Zap size={20} className="text-indigo-600 fill-current" /> Team Pulse
                        </h4>
                        <div className="space-y-4">
                            <AlertItem text="Frontend Squad at 94% output" type="positive" onClick={() => handlePulseClick('frontend')} />
                            <AlertItem text="3 projects approaching deadline" type="warning" onClick={() => handlePulseClick('deadlines')} />
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
                        <div className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-xl shadow-slate-200/50">
                            <h3 className="text-xl font-black text-slate-900 mb-6 flex items-center gap-2">
                                <Plus size={20} className="text-indigo-600" /> Create New Project
                            </h3>
                            <form onSubmit={handleCreateProject} className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Project Name</label>
                                        <input
                                            value={newProject.name}
                                            onChange={e => setNewProject({ ...newProject, name: e.target.value })}
                                            className="w-full p-4 bg-slate-50 border-2 border-transparent rounded-2xl font-bold focus:border-indigo-600 transition-all outline-none"
                                            placeholder="e.g. Dashboard Redesign"
                                            required
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Deadline</label>
                                        <input
                                            type="date"
                                            value={newProject.deadline}
                                            onChange={e => setNewProject({ ...newProject, deadline: e.target.value })}
                                            className="w-full p-4 bg-slate-50 border-2 border-transparent rounded-2xl font-bold focus:border-indigo-600 transition-all outline-none"
                                            required
                                        />
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Description</label>
                                    <textarea
                                        value={newProject.description}
                                        onChange={e => setNewProject({ ...newProject, description: e.target.value })}
                                        className="w-full p-4 bg-slate-50 border-2 border-transparent rounded-2xl font-bold focus:border-indigo-600 transition-all outline-none min-h-[100px] resize-none"
                                        placeholder="Project details..."
                                    />
                                </div>
                                <button
                                    type="submit"
                                    disabled={projectLoading}
                                    className="w-full bg-indigo-600 text-white p-4 rounded-2xl font-black hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 flex items-center justify-center gap-2"
                                >
                                    {projectLoading ? <Loader2 className="animate-spin" size={20} /> : <CheckCircle size={20} />}
                                    Create Project
                                </button>
                            </form>
                        </div>

                        <div className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-xl shadow-slate-200/50">
                            <h3 className="text-xl font-black text-slate-900 mb-6 flex items-center gap-2">
                                <History size={20} className="text-indigo-600" /> Quick Task Assignment
                            </h3>
                            <form onSubmit={handleCreateTask} className="space-y-4">
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Task Title</label>
                                    <input
                                        value={newTask.title}
                                        onChange={e => setNewTask({ ...newTask, title: e.target.value })}
                                        className="w-full p-4 bg-slate-50 border-2 border-transparent rounded-2xl font-bold focus:border-indigo-600 transition-all outline-none"
                                        placeholder="e.g. Implement API Auth"
                                        required
                                    />
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Assign To</label>
                                        <select
                                            value={newTask.assigned_to}
                                            onChange={e => setNewTask({ ...newTask, assigned_to: e.target.value })}
                                            className="w-full p-4 bg-slate-50 border-2 border-transparent rounded-2xl font-bold focus:border-indigo-600 transition-all outline-none"
                                            required
                                        >
                                            <option value="">Choose employee...</option>
                                            {team.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                                        </select>
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Due Date</label>
                                        <input
                                            type="date"
                                            value={newTask.due_date}
                                            onChange={e => setNewTask({ ...newTask, due_date: e.target.value })}
                                            className="w-full p-4 bg-slate-50 border-2 border-transparent rounded-2xl font-bold focus:border-indigo-600 transition-all outline-none"
                                            required
                                        />
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                     <div className="space-y-1">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Priority</label>
                                        <select
                                            value={newTask.priority}
                                            onChange={e => setNewTask({ ...newTask, priority: e.target.value })}
                                            className="w-full p-4 bg-slate-50 border-2 border-transparent rounded-2xl font-bold focus:border-indigo-600 transition-all outline-none"
                                        >
                                            <option value="Low">Low</option>
                                            <option value="Medium">Medium</option>
                                            <option value="High">High</option>
                                        </select>
                                    </div>
                                </div>
                                <button
                                    type="submit"
                                    disabled={taskLoading}
                                    className="w-full bg-slate-900 text-white p-4 rounded-2xl font-black hover:bg-black transition-all shadow-lg shadow-slate-200 flex items-center justify-center gap-2"
                                >
                                    {taskLoading ? <Loader2 className="animate-spin" size={20} /> : <Plus size={20} />}
                                    Assign Task
                                </button>
                            </form>
                        </div>
                    </div>

                    {/* Task List */}
                    <div className="bg-white p-10 rounded-[40px] border border-slate-100 shadow-xl shadow-slate-200/50">
                        <h3 className="text-2xl font-black text-slate-900 mb-8 flex items-center gap-3">
                            <Target className="text-indigo-600" size={24} /> Managed Tasks
                        </h3>
                        <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
                            {tasks.length === 0 ? (
                                <div className="text-center py-20 opacity-40">
                                    <Target size={48} className="mx-auto mb-4" />
                                    <p className="font-black uppercase tracking-widest text-xs">No tasks assigned yet</p>
                                </div>
                            ) : (
                                tasks.map(task => (
                                    <div key={task.id} className="p-6 rounded-3xl bg-slate-50 border border-slate-100 hover:border-indigo-200 transition-all group">
                                        <div className="flex justify-between items-start mb-4">
                                            <div>
                                                <h4 className="text-lg font-black text-slate-900 group-hover:text-indigo-600 transition-colors">{task.title}</h4>
                                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Assigned to: {task.assigned_to_name}</p>
                                            </div>
                                            <span className={`px-2 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest ${
                                                task.priority === 'High' ? 'bg-red-50 text-red-600' : 
                                                task.priority === 'Medium' ? 'bg-amber-50 text-amber-600' : 
                                                'bg-blue-50 text-blue-600'
                                            }`}>{task.priority}</span>
                                        </div>
                                        <div className="flex justify-between items-center pt-4 border-t border-slate-200/60">
                                            <div className="flex items-center gap-2 font-black text-[10px] text-slate-500 uppercase">
                                                <Clock size={14} /> Due: {task.due_date}
                                            </div>
                                            <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${
                                                task.status === 'Completed' ? 'bg-emerald-100 text-emerald-700' :
                                                task.status === 'In Progress' ? 'bg-indigo-100 text-indigo-700' :
                                                'bg-slate-200 text-slate-700'
                                            }`}>{task.status}</span>
                                        </div>
                                    </div>
                                ))
                            )}
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
                            <div className="text-right shrink-0">
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
                                <tr key={log.id} className="text-sm font-bold text-slate-600">
                                    <td className="py-4 px-2 text-slate-900">{log.userName}</td>
                                    <td className="py-4 px-2">{log.checkIn ? new Date(log.checkIn).toLocaleDateString() : 'N/A'}</td>
                                    <td className="py-4 px-2">{log.checkIn ? new Date(log.checkIn).toLocaleTimeString() : '--'}</td>
                                    <td className="py-4 px-2">{log.checkOut ? new Date(log.checkOut).toLocaleTimeString() : '--'}</td>
                                    <td className="py-4 px-2 text-right">
                                        <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase ${log.status === 'Completed' ? 'bg-emerald-50 text-emerald-600' : 'bg-indigo-50 text-indigo-600 animate-pulse'}`}>
                                            {log.status}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </DetailModal>

        </div>
    );
};

const ManagerStatCard = ({ label, value, icon: Icon, color, onClick }) => (
    <button
        onClick={onClick}
        className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-xl shadow-slate-200/50 relative overflow-hidden group hover:-translate-y-1 transition-all text-left w-full cursor-pointer"
    >
        <div className={`absolute top-0 left-0 w-2 h-full bg-${color}-600`} />
        <div className="flex items-center justify-between mb-6">
            <div className={`w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400 group-hover:bg-${color}-50 group-hover:text-${color}-600 transition-colors`}>
                <Icon size={24} />
            </div>
            <div className="px-2.5 py-1 bg-slate-50 rounded-lg text-[9px] font-black text-slate-400 uppercase tracking-widest group-hover:bg-white transition-colors">Stable</div>
        </div>
        <h4 className="text-3xl font-black text-slate-900 mb-1">{value}</h4>
        <p className="text-xs font-black text-slate-400 uppercase tracking-widest">{label}</p>
    </button>
);

const MetricsSummary = ({ label, value, trend }) => (
    <div className="bg-white p-6 rounded-3xl border border-slate-100 text-center flex flex-col items-center">
        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">{label}</p>
        <p className="text-2xl font-black text-slate-900 mb-1">{value}</p>
        <span className={`text-[9px] font-black uppercase ${trend.startsWith('+') ? 'text-emerald-500' : 'text-red-500'}`}>{trend}</span>
    </div>
);

const CapacityCard = ({ label, value, status, color }) => (
    <div className="bg-slate-50 p-8 rounded-[40px] border border-slate-100 text-center group hover:border-indigo-600 transition-all">
        <div className={`w-16 h-16 rounded-3xl bg-white flex items-center justify-center mx-auto mb-6 text-${color}-600 shadow-sm border border-slate-100 group-hover:bg-indigo-600 group-hover:text-white transition-all`}>
            <LayoutGrid size={28} />
        </div>
        <p className="text-sm font-black text-slate-900 mb-1">{label}</p>
        <h3 className="text-4xl font-black text-slate-900 mb-4">{value}</h3>
        <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest bg-${color}-50 text-${color}-600 border border-${color}-100`}>Status: {status}</span>
    </div>
);



const AlertItem = ({ text, type, onClick }) => {
    const styles = {
        positive: 'bg-emerald-50 text-emerald-700 border-emerald-100',
        warning: 'bg-amber-50 text-amber-700 border-amber-100',
        info: 'bg-blue-50 text-blue-700 border-blue-100'
    };
    return (
        <div
            onClick={onClick}
            className={`flex items-center gap-3 p-4 rounded-2xl border transition-all cursor-pointer hover:shadow-md hover:scale-[1.02] active:scale-[0.98] ${styles[type]}`}
        >
            <div className={`w-2 h-2 rounded-full bg-current ${type === 'warning' ? 'animate-bounce' : 'animate-pulse'}`} />
            <p className="text-xs font-bold leading-tight">{text}</p>
        </div>
    );
}

export default ManagerDashboard;
