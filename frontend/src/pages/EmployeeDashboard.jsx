import React, { useState, useEffect } from 'react';
import api from '../services/api';
import DetailModal from '../components/DetailModal';
import { 
  Play, 
  Square, 
  Coffee, 
  Users, 
  TrendingUp, 
  Clock, 
  Calendar,
  Zap,
  CheckCircle2,
  CalendarCheck2,
  AlertCircle,
  ArrowRight,
  Plus,
  ArrowUpRight,
  Loader2,
  CalendarDays,
  Timer,
  Briefcase
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';

const EmployeeDashboard = () => {
    const [status, setStatus] = useState({ active: false, onBreak: false });
    const [timer, setTimer] = useState(0);
    const [stats, setStats] = useState({ 
        totalWorkTime: 0, 
        totalBreakTime: 0, 
        totalMeetings: 0, 
        weeklyData: [],
        meetingsList: [],
        breaksList: [] 
    });
    const [productivity, setProductivity] = useState({ score: 94, work: 0, breaks: 0 });
    const [override, setOverride] = useState({ type: 'attendance', startTime: '', endTime: '', reason: '' });
    const [workLogs, setWorkLogs] = useState([]);
    const [assignedProjects, setAssignedProjects] = useState([]);
    
    // UI state
    const [meetings, setMeetings] = useState({ title: '', duration: '', type: 'Internal' });
    const [leave, setLeave] = useState({ startDate: '', endDate: '', reason: '' });
    const [loading, setLoading] = useState(false);
    
    // Modal states
    const [activeModal, setActiveModal] = useState(null); // 'meeting', 'leave', 'productivity', 'workHours', 'breaks', 'meetingsList'
    const [leaves, setLeaves] = useState([]);

    const fetchData = async () => {
        try {
            const [statusRes, statsRes, prodRes, leavesRes] = await Promise.all([
                api.get('/time/status'),
                api.get('/time/stats'),
                api.get('/time/productivity'),
                api.get('/leave/my')
            ]);
            setStatus(statusRes.data);
            setStats(statsRes.data);
            setLeaves(leavesRes.data || []);
            
            const pData = prodRes.data || {};
            const totalWork = pData.totalWorkTime || 0;
            const totalBreaks = pData.totalBreakTime || 0;
            const totalMeetings = pData.totalMeetingTime || 0;
            
            // Calculate percentage safely
            const totalTime = totalWork + totalBreaks + totalMeetings;
            const scorePercent = totalTime > 0 
                ? Math.round((totalWork / totalTime) * 100) 
                : 0;

            setProductivity({
                work: totalWork,
                breaks: totalBreaks,
                score: scorePercent
            });
            fetchAssignedProjects();
            
            if (statusRes.data.active && statusRes.data.startTime) {
                const start = new Date(statusRes.data.startTime);
                const now = new Date();
                setTimer(Math.floor((now - start) / 1000));
            }
        } catch (e) {
            console.error('Error fetching dashboard data', e);
        }
    };

    const fetchAssignedProjects = async () => {
        try {
            const { data } = await api.get('/projects');
            setAssignedProjects(data);
        } catch (error) { console.error('Error fetching assigned projects', error); }
    };

    useEffect(() => {
        fetchData();
    }, []);

    useEffect(() => {
        let interval;
        if (status.active && !status.onBreak) {
            interval = setInterval(() => {
                setTimer(prev => prev + 1);
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [status.active, status.onBreak]);

    // Idle detection
    useEffect(() => {
        let idleTimer;
        const resetTimer = () => {
            clearTimeout(idleTimer);
            idleTimer = setTimeout(() => {
                if (status.active && !status.onBreak) {
                    setActiveModal('idle');
                }
            }, 600000); // 10 minutes
        };

        window.addEventListener('mousemove', resetTimer);
        window.addEventListener('keypress', resetTimer);
        resetTimer();

        return () => {
            window.removeEventListener('mousemove', resetTimer);
            window.removeEventListener('keypress', resetTimer);
            clearTimeout(idleTimer);
        };
    }, [status.active, status.onBreak]);

    const formatTime = (seconds) => {
        const safeSeconds = Math.max(0, parseInt(seconds) || 0);
        const h = Math.floor(safeSeconds / 3600);
        const m = Math.floor((safeSeconds % 3600) / 60);
        const s = safeSeconds % 60;
        return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    };

    const handleStartWork = async () => {
        try {
            setLoading(true);
            const { data } = await api.post('/time/start-work');
            setStatus(prev => ({ ...prev, active: true, sessionId: data.sessionId, startTime: new Date().toISOString() }));
            setTimer(0);
            fetchData();
        } catch (error) { alert(error.response?.data?.error || error.response?.data?.message || 'Error starting work'); }
        finally { setLoading(false); }
    };

    const handleStopWork = async () => {
        try {
            setLoading(true);
            await api.post('/time/stop-work');
            setStatus({ active: false, onBreak: false });
            setTimer(0);
            fetchData();
        } catch (error) { alert(error.response?.data?.error || error.response?.data?.message || 'Error stopping work'); }
        finally { setLoading(false); }
    };

    const handleToggleBreak = async (type = 'Short Break') => {
        try {
            setLoading(true);
            if (status.onBreak) {
                await api.post('/time/stop-break');
                setStatus(prev => ({ ...prev, onBreak: false }));
            } else {
                await api.post('/time/start-break', { type });
                setStatus(prev => ({ ...prev, onBreak: true, breakType: type }));
            }
            fetchData();
        } catch (error) { alert(error.response?.data?.error || error.response?.data?.message || 'Error toggling break'); }
        finally { setLoading(false); }
    };

    const handleManualOverride = async (e) => {
        e.preventDefault();
        try {
            await api.post('/time/manual-override', override);
            setActiveModal(null);
            setOverride({ type: 'attendance', startTime: '', endTime: '', reason: '' });
            fetchData();
        } catch (error) { alert(error.response?.data?.error || error.response?.data?.message || 'Error logging manual override'); }
    };

    const handleLogMeeting = async (e) => {
        e.preventDefault();
        try {
            await api.post('/time/log-meeting', meetings);
            setActiveModal(null);
            setMeetings({ title: '', duration: '', type: 'Internal' });
            fetchData();
        } catch (error) { alert(error.response?.data?.error || error.response?.data?.message || 'Error logging meeting'); }
    };

    const handleApplyLeave = async (e) => {
        e.preventDefault();
        try {
            await api.post('/leave/apply', leave);
            setActiveModal(null);
            setLeave({ startDate: '', endDate: '', reason: '' });
        } catch (error) { alert(error.response?.data?.error || error.response?.data?.message || 'Error applying leave'); }
    };

    const fetchWorkLogs = async () => {
        try {
            const { data } = await api.get('/time/work-hours');
            setWorkLogs(data);
            setActiveModal('workHours');
        } catch (error) { console.error(error); }
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-700">
            {/* Main Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Timer Section */}
                <div className="lg:col-span-2 bg-white p-10 rounded-[40px] border border-slate-100 shadow-xl shadow-slate-200/50 flex flex-col items-center justify-center relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-50/50 rounded-full blur-3xl -mr-32 -mt-32 transition-transform group-hover:scale-110" />
                    <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-50/50 rounded-full blur-3xl -ml-32 -mb-32 transition-transform group-hover:scale-110" />

                    <div className="relative z-10 flex flex-col items-center w-full text-center">
                        <div className="flex items-center gap-3 mb-8">
                            <div className={`px-4 py-1.5 rounded-full flex items-center gap-2 border-2 ${status.active ? 'bg-indigo-50 border-indigo-100 text-indigo-700' : 'bg-slate-50 border-slate-100 text-slate-400'}`}>
                                <div className={`w-2 h-2 rounded-full ${status.active ? 'bg-indigo-600 animate-pulse' : 'bg-slate-300'}`} />
                                <span className="text-[10px] font-black uppercase tracking-widest">{status.active ? 'Active Session' : 'Offline'}</span>
                            </div>
                        </div>

                        <h2 className="text-xl font-black text-slate-900 mb-10 tracking-tight flex items-center gap-3 justify-center">
                            <Clock size={24} className="text-indigo-600" />
                            Work Productivity Timer
                        </h2>

                        <div className="text-[120px] font-black text-slate-900 mb-12 tabular-nums tracking-[-0.05em] leading-none drop-shadow-sm select-none">
                            {formatTime(timer)}
                        </div>

                        <div className="flex flex-wrap justify-center gap-5 w-full max-w-lg">
                             {!status.active ? (
                                <button 
                                    onClick={handleStartWork}
                                    disabled={loading}
                                    className="flex-1 min-w-[200px] py-5 px-8 bg-indigo-600 text-white rounded-3xl font-black hover:bg-indigo-700 active:scale-95 transition-all flex items-center justify-center gap-3 shadow-2xl shadow-indigo-200 group group"
                                >
                                    {loading ? <Loader2 className="animate-spin" /> : <Play size={20} className="fill-current" />}
                                    <span className="text-lg">Start Day</span>
                                    <ArrowRight size={20} className="ml-2 group-hover:translate-x-1 transition-transform" />
                                </button>
                            ) : (
                                <>
                                    <div className="flex flex-col gap-2 flex-1 min-w-[200px]">
                                        <button 
                                            onClick={() => status.onBreak ? handleToggleBreak() : setActiveModal('breakType')}
                                            disabled={loading}
                                            className={`w-full py-5 px-8 rounded-3xl font-black active:scale-95 transition-all flex items-center justify-center gap-3 border-2 
                                                ${status.onBreak 
                                                    ? 'bg-emerald-600 border-emerald-600 text-white shadow-xl shadow-emerald-100' 
                                                    : 'bg-white border-slate-100 text-slate-700 hover:border-indigo-200 hover:bg-indigo-50/30'
                                                }
                                            `}
                                        >
                                            <Coffee size={20} />
                                            <span className="text-lg">{status.onBreak ? `End ${status.breakType || 'Break'}` : 'Start Break'}</span>
                                        </button>
                                    </div>
                                    <button 
                                        onClick={handleStopWork}
                                        disabled={loading}
                                        className="flex-1 min-w-[180px] py-5 px-8 bg-slate-900 text-white rounded-3xl font-black hover:bg-black active:scale-95 transition-all flex items-center justify-center gap-3 shadow-xl shadow-slate-200"
                                    >
                                        <Square size={20} className="fill-current" />
                                        <span className="text-lg">End Shift</span>
                                    </button>
                                </>
                            )}
                        </div>
                    </div>
                </div>

                {/* Right Cards */}
                <div className="flex flex-col gap-6">
                    <button 
                        onClick={() => setActiveModal('productivity')}
                        className="bg-indigo-600 p-8 rounded-[40px] text-white shadow-2xl shadow-indigo-200 flex flex-col justify-between h-52 group cursor-pointer text-left"
                    >
                        <div className="flex justify-between items-start">
                            <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-md group-hover:bg-white/30 transition-colors">
                                <Zap className="fill-current" size={24} />
                            </div>
                            <span className="px-3 py-1 bg-white/20 rounded-full text-[10px] font-black uppercase tracking-wider backdrop-blur-md flex items-center gap-1">
                                <TrendingUp size={12} /> View Details
                            </span>
                        </div>
                        <div>
                            <p className="text-indigo-100 text-xs font-black uppercase tracking-widest mb-1">Overall Productivity Score</p>
                            <h3 className="text-4xl font-black tabular-nums">{productivity.score}%</h3>
                        </div>
                        <div className="w-full h-2 bg-indigo-900/30 rounded-full mt-4 overflow-hidden">
                             <motion.div initial={{ width: 0 }} animate={{ width: `${productivity.score}%` }} className="h-full bg-white rounded-full" />
                        </div>
                    </button>

                    <button 
                        onClick={() => setActiveModal('meeting')}
                        className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-lg shadow-slate-200/50 text-left hover:border-indigo-600 transition-all group flex-1 cursor-pointer"
                    >
                        <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600 mb-6 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                            <Users size={24} />
                        </div>
                        <div className="flex justify-between items-end">
                            <div>
                                <h3 className="text-xl font-black text-slate-900 mb-1 group-hover:text-indigo-600 transition-colors">Log Meeting</h3>
                                <p className="text-slate-400 text-sm font-medium">Add manual meeting entry</p>
                            </div>
                            <div className="w-10 h-10 rounded-full border border-slate-100 flex items-center justify-center group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform">
                                <Plus size={20} className="text-slate-300" />
                            </div>
                        </div>
                    </button>
                </div>
            </div>

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard 
                    icon={CheckCircle2} 
                    label="Work Hours" 
                    value={formatTime(stats.totalWorkTime)} 
                    color="bg-emerald-50 text-emerald-600" 
                    onClick={fetchWorkLogs}
                />
                <StatCard 
                    icon={Coffee} 
                    label="Break Time" 
                    value={formatTime(stats.totalBreakTime)} 
                    color="bg-orange-50 text-orange-600" 
                    onClick={() => setActiveModal('breaks')}
                />
                <StatCard 
                    icon={Users} 
                    label="Meetings Logged" 
                    value={stats.totalMeetings} 
                    color="bg-blue-50 text-blue-600" 
                    onClick={() => setActiveModal('meetingsList')}
                />
                <button 
                    onClick={() => setActiveModal('override')}
                    className="p-6 bg-white rounded-3xl border border-slate-100 shadow-md shadow-slate-200/40 flex items-center gap-4 hover:border-orange-600 transition-all group cursor-pointer"
                >
                    <div className="w-14 h-14 bg-orange-50 rounded-2xl flex items-center justify-center text-orange-600 group-hover:bg-orange-600 group-hover:text-white transition-colors">
                        <Timer size={28} />
                    </div>
                    <div>
                        <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest leading-none mb-1">Tools</p>
                        <p className="text-lg font-black text-slate-900">Manual Override</p>
                    </div>
                    <ArrowUpRight size={20} className="ml-auto text-slate-200 group-hover:text-orange-600" />
                </button>
                <button 
                    onClick={() => setActiveModal('leave')}
                    className="p-6 bg-white rounded-3xl border border-slate-100 shadow-md shadow-slate-200/40 flex items-center gap-4 hover:border-purple-600 transition-all group cursor-pointer"
                >
                    <div className="w-14 h-14 bg-purple-50 rounded-2xl flex items-center justify-center text-purple-600 group-hover:bg-purple-600 group-hover:text-white transition-colors">
                        <CalendarCheck2 size={28} />
                    </div>
                    <div>
                        <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest leading-none mb-1">Leave Status</p>
                        <p className="text-lg font-black text-slate-900">Apply Leave</p>
                    </div>
                    <ArrowUpRight size={20} className="ml-auto text-slate-200 group-hover:text-purple-600" />
                </button>
            </div>

            {/* Performance Chart */}
            <div className="bg-white p-10 rounded-[40px] border border-slate-100 shadow-xl shadow-slate-200/50">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-10">
                    <div>
                        <h2 className="text-2xl font-black text-slate-900 tracking-tight">Weekly Performance</h2>
                        <p className="text-slate-400 text-sm font-medium">Your productivity trend for the current week</p>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2 px-4 py-2 bg-indigo-50 border border-indigo-100 rounded-xl">
                             <div className="w-2.5 h-2.5 rounded-full bg-indigo-600" />
                             <span className="text-[11px] font-black text-indigo-700 uppercase tracking-widest">Work Hours</span>
                        </div>
                    </div>
                </div>
                <div className="h-80 w-full font-bold">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={stats.weeklyData.length > 0 ? stats.weeklyData : [
                            { date: 'Mon', work_duration: 0 },
                            { date: 'Tue', work_duration: 0 },
                            { date: 'Wed', work_duration: 32000 },
                        ]}>
                            <defs>
                                <linearGradient id="colorWork" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#4F46E5" stopOpacity={0.15}/>
                                    <stop offset="95%" stopColor="#4F46E5" stopOpacity={0}/>
                                </linearGradient>
                            </defs>
                            <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="#f1f5f9" />
                            <XAxis 
                                dataKey="date" 
                                axisLine={false} 
                                tickLine={false} 
                                tick={{fill: '#94a3b8', fontSize: 12, fontWeight: 700}} 
                                dy={15} 
                            />
                            <YAxis hide />
                            <Tooltip 
                                cursor={{ stroke: '#4F46E5', strokeWidth: 2, strokeDasharray: '4 4' }}
                                contentStyle={{borderRadius: '24px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)', fontWeight: 'bold'}} 
                                formatter={(value) => formatTime(value)}
                            />
                            <Area type="monotone" dataKey="work_duration" stroke="#4F46E5" strokeWidth={4} fillOpacity={1} fill="url(#colorWork)" dot={{ r: 4, fill: '#4F46E5', strokeWidth: 2, stroke: '#fff' }} />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Assigned Projects Section */}
            <div className="bg-white p-10 rounded-[40px] border border-slate-100 shadow-xl shadow-slate-200/50">
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h2 className="text-2xl font-black text-slate-900 tracking-tight">Your Assigned Projects</h2>
                        <p className="text-slate-400 text-sm font-medium">Ongoing tasks and project deadlines</p>
                    </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {assignedProjects.length === 0 ? (
                        <div className="col-span-full py-12 text-center bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200 opacity-50">
                            <p className="font-black uppercase tracking-widest text-xs">No active assignments</p>
                        </div>
                    ) : (
                        assignedProjects.map(project => (
                            <div key={project.id} className="p-6 rounded-3xl bg-slate-50 border border-slate-100 hover:border-indigo-200 transition-all group">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-indigo-600 shadow-sm border border-slate-50">
                                        <Briefcase size={20} />
                                    </div>
                                    <div className="flex items-center gap-1.5 px-3 py-1 bg-white border border-slate-100 rounded-full text-[9px] font-black text-slate-500 uppercase tracking-widest">
                                        <Calendar size={10} className="text-indigo-600" />
                                        {project.deadline ? new Date(project.deadline).toLocaleDateString() : 'No deadline'}
                                    </div>
                                </div>
                                <h4 className="text-lg font-black text-slate-900 mb-1 group-hover:text-indigo-600 transition-colors">{project.name}</h4>
                                <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">{project.description}</p>
                                <div className="mt-6 pt-4 border-t border-slate-200/60 flex items-center justify-between">
                                     <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Status: Active</span>
                                     <ArrowUpRight size={14} className="text-slate-300 group-hover:text-indigo-600 transition-colors" />
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* --- Modals Section --- */}

            {/* Leave History Section */}
            <div className="bg-white rounded-[40px] border border-slate-100 shadow-xl shadow-slate-200/50 overflow-hidden">
                <div className="p-8 border-b border-slate-50 flex items-center justify-between">
                    <div>
                        <h2 className="text-2xl font-black text-slate-900 tracking-tight">Leave History</h2>
                        <p className="text-slate-500 text-sm font-medium">Track your time-off applications</p>
                    </div>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-slate-50/50">
                                <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Date</th>
                                <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Period</th>
                                <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Reason</th>
                                <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {leaves.length > 0 ? leaves.map((lv, i) => (
                                <tr key={lv.id || i} className="hover:bg-slate-50/50 transition-colors">
                                    <td className="px-8 py-5">
                                        <p className="text-sm font-bold text-slate-900">{new Date(lv.created_at).toLocaleDateString()}</p>
                                    </td>
                                    <td className="px-8 py-5">
                                        <div className="flex items-center gap-2 text-sm font-black text-slate-700">
                                            <span>{lv.start_date}</span>
                                            <span className="text-slate-300">→</span>
                                            <span>{lv.end_date}</span>
                                        </div>
                                    </td>
                                    <td className="px-8 py-5">
                                        <p className="text-sm font-medium text-slate-500 truncate max-w-xs">{lv.reason}</p>
                                    </td>
                                    <td className="px-8 py-5">
                                        <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border ${
                                            lv.status === 'Approved' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                                            lv.status === 'Rejected' ? 'bg-red-50 text-red-700 border-red-100' :
                                            'bg-amber-50 text-amber-700 border-amber-100'
                                        }`}>
                                            {lv.status}
                                        </span>
                                    </td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan="4" className="px-8 py-10 text-center text-slate-400 font-bold uppercase tracking-widest">No history found</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
            <DetailModal isOpen={activeModal === 'productivity'} onClose={() => setActiveModal(null)} title="Productivity Breakdown">
                <div className="space-y-8">
                    <div className="grid grid-cols-3 gap-6">
                        <div className="bg-slate-50 p-8 rounded-3xl border border-slate-100 text-center">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">Total Work</p>
                            <p className="text-3xl font-black text-slate-900">{formatTime(productivity.work)}</p>
                        </div>
                        <div className="bg-slate-50 p-8 rounded-3xl border border-slate-100 text-center">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">Total Breaks</p>
                            <p className="text-3xl font-black text-slate-900">{formatTime(productivity.breaks)}</p>
                        </div>
                        <div className="bg-indigo-600 p-8 rounded-3xl text-white text-center shadow-xl shadow-indigo-100">
                            <p className="text-[10px] font-black text-indigo-200 uppercase tracking-[0.2em] mb-2">Score</p>
                            <p className="text-3xl font-black">{productivity.score}%</p>
                        </div>
                    </div>
                    <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm flex items-start gap-6">
                        <div className="w-14 h-14 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600 shrink-0">
                            <TrendingUp size={28} />
                        </div>
                        <div>
                            <h4 className="text-xl font-black text-slate-900 mb-2">How it's calculated</h4>
                            <p className="text-slate-500 font-medium leading-relaxed">
                                Your productivity score is determined by the ratio of active work time to the sum of work and break time. 
                                We aim for a balance that maximizes focus while ensuring mental well-being through optimal break intervals.
                            </p>
                        </div>
                    </div>
                </div>
            </DetailModal>

            {/* Work Hours List */}
            <DetailModal isOpen={activeModal === 'workHours'} onClose={() => setActiveModal(null)} title="Daily Work Logs">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-50">
                                <th className="pb-4 px-2">Date</th>
                                <th className="pb-4 px-2">Started</th>
                                <th className="pb-4 px-2">Ended</th>
                                <th className="pb-4 px-2 text-right">Duration</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {workLogs.map(log => (
                                <tr key={log.id} className="text-sm font-bold text-slate-600">
                                    <td className="py-4 px-2">{new Date(log.start_time).toLocaleDateString()}</td>
                                    <td className="py-4 px-2">{new Date(log.start_time).toLocaleTimeString()}</td>
                                    <td className="py-4 px-2">{log.end_time ? new Date(log.end_time).toLocaleTimeString() : 'In Progress'}</td>
                                    <td className="py-4 px-2 text-right text-slate-900">{formatTime(log.total_duration)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </DetailModal>

            {/* Breaks List */}
            <DetailModal isOpen={activeModal === 'breaks'} onClose={() => setActiveModal(null)} title="Break Intervals">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-50">
                                <th className="pb-4 px-2 text-left">Interval</th>
                                <th className="pb-4 px-2">Type</th>
                                <th className="pb-4 px-2 text-right">Duration</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {stats.breaksList && stats.breaksList.map(b => (
                                <tr key={b.id} className="text-sm font-bold text-slate-600">
                                    <td className="py-4 px-2">
                                        {new Date(b.start_time).toLocaleTimeString()} → {b.end_time ? new Date(b.end_time).toLocaleTimeString() : 'Now'}
                                    </td>
                                    <td className="py-4 px-2">
                                        <span className="px-3 py-1 bg-amber-50 text-amber-700 rounded-full text-[10px] uppercase font-black">{b.type}</span>
                                    </td>
                                    <td className="py-4 px-2 text-right text-slate-900">{formatTime(b.duration)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </DetailModal>

            {/* Meetings List */}
            <DetailModal isOpen={activeModal === 'meetingsList'} onClose={() => setActiveModal(null)} title="Recent Meetings">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {stats.meetingsList && stats.meetingsList.map(m => (
                        <div key={m.id} className="bg-slate-50 p-6 rounded-3xl border border-slate-100 flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-indigo-600 shadow-sm shrink-0">
                                    <Users size={20} />
                                </div>
                                <div>
                                    <p className="font-black text-slate-900 leading-tight">{m.title}</p>
                                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">{m.type}</p>
                                </div>
                            </div>
                            <div className="text-right">
                                <p className="text-sm font-black text-indigo-600">{m.duration}m</p>
                                <p className="text-[10px] text-slate-400 font-bold uppercase mt-1">{new Date(m.created_at).toLocaleDateString()}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </DetailModal>

            {/* Forms */}
            <DetailModal isOpen={activeModal === 'meeting'} onClose={() => setActiveModal(null)} title="Log New Meeting">
                <form onSubmit={handleLogMeeting} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-1.5 md:col-span-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Meeting Purpose</label>
                            <input value={meetings.title} onChange={e => setMeetings({...meetings, title: e.target.value})} className="w-full p-4 bg-slate-50 border-2 border-transparent rounded-2xl text-slate-900 font-bold focus:border-indigo-600 focus:bg-white transition-all outline-none" placeholder="e.g. Design Review" required />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Duration (min)</label>
                            <input type="number" value={meetings.duration} onChange={e => setMeetings({...meetings, duration: e.target.value})} className="w-full p-4 bg-slate-50 border-2 border-transparent rounded-2xl text-slate-900 font-bold focus:border-indigo-600 focus:bg-white transition-all outline-none" required />
                        </div>
                        <div className="space-y-1.5">
                             <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Category</label>
                            <select value={meetings.type} onChange={e => setMeetings({...meetings, type: e.target.value})} className="w-full p-4 bg-slate-50 border-2 border-transparent rounded-2xl text-slate-900 font-bold focus:border-indigo-600 focus:bg-white transition-all outline-none">
                                <option>Internal</option>
                                <option>Client Call</option>
                                <option>Standalone</option>
                            </select>
                        </div>
                    </div>
                    <button type="submit" className="w-full bg-slate-900 text-white p-5 rounded-3xl font-black hover:bg-black transition-all shadow-xl shadow-slate-200 flex items-center justify-center gap-3 group">
                        Confirm Entry
                        <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                    </button>
                </form>
            </DetailModal>

            {/* Break Type selection */}
            <DetailModal isOpen={activeModal === 'breakType'} onClose={() => setActiveModal(null)} title="Select Break Category">
                <div className="grid grid-cols-1 gap-4">
                    {['Lunch', 'Tea', 'Other'].map(type => (
                        <button 
                            key={type}
                            onClick={() => {
                                handleToggleBreak(type);
                                setActiveModal(null);
                            }}
                            className="p-6 bg-slate-50 border-2 border-transparent rounded-3xl font-black text-slate-700 hover:border-indigo-600 hover:bg-white transition-all text-left flex items-center justify-between group"
                        >
                            <span>{type} Break</span>
                            <ArrowRight size={20} className="text-slate-200 group-hover:text-indigo-600 transition-colors" />
                        </button>
                    ))}
                </div>
            </DetailModal>

            {/* Manual Override Form */}
            <DetailModal isOpen={activeModal === 'override'} onClose={() => setActiveModal(null)} title="Manual Time Override">
                <form onSubmit={handleManualOverride} className="space-y-6">
                    <div className="space-y-1.5 font-bold">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Entry Type</label>
                        <select value={override.type} onChange={e => setOverride({...override, type: e.target.value})} className="w-full p-4 bg-slate-50 border-2 border-transparent rounded-2xl outline-none focus:border-indigo-600">
                            <option value="attendance">Work Shift</option>
                            <option value="break">Break Interval</option>
                        </select>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Start Time</label>
                            <input type="datetime-local" value={override.startTime} onChange={e => setOverride({...override, startTime: e.target.value})} className="w-full p-4 bg-slate-50 border-2 border-transparent rounded-2xl font-bold focus:border-indigo-600 outline-none" required />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">End Time</label>
                            <input type="datetime-local" value={override.endTime} onChange={e => setOverride({...override, endTime: e.target.value})} className="w-full p-4 bg-slate-50 border-2 border-transparent rounded-2xl font-bold focus:border-indigo-600 outline-none" required />
                        </div>
                    </div>
                    <div className="space-y-1.5">
                         <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Reason for Override</label>
                         <textarea value={override.reason} onChange={e => setOverride({...override, reason: e.target.value})} className="w-full p-4 bg-slate-50 border-2 border-transparent rounded-2xl font-bold focus:border-indigo-600 outline-none h-24 resize-none" placeholder="Explain why manual bypass is needed..." required />
                    </div>
                    <button type="submit" className="w-full bg-slate-900 text-white p-5 rounded-3xl font-black hover:bg-black transition-all flex items-center justify-center gap-3">
                        Save Manual Entry
                    </button>
                </form>
            </DetailModal>

            {/* Idle Warning Modal */}
            <DetailModal isOpen={activeModal === 'idle'} onClose={() => setActiveModal(null)} title="Inactivity Detected">
                <div className="text-center space-y-6 py-4">
                    <div className="w-20 h-20 bg-amber-50 rounded-full flex items-center justify-center mx-auto text-amber-600 animate-bounce">
                        <Timer size={40} />
                    </div>
                    <div>
                        <h4 className="text-xl font-black text-slate-900 mb-2">Are you still working?</h4>
                        <p className="text-slate-500 font-medium">We've detected no activity for a while. Please confirm to keep the timer running.</p>
                    </div>
                    <button onClick={() => setActiveModal(null)} className="w-full bg-indigo-600 text-white p-5 rounded-3xl font-black hover:bg-indigo-700 transition-all">
                        Yes, I'm here
                    </button>
                </div>
            </DetailModal>

            <DetailModal isOpen={activeModal === 'leave'} onClose={() => setActiveModal(null)} title="Leave Application">
                <form onSubmit={handleApplyLeave} className="space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">From Date</label>
                            <input type="date" value={leave.startDate} onChange={e => setLeave({...leave, startDate: e.target.value})} className="w-full p-4 bg-slate-50 border-2 border-transparent rounded-2xl font-bold focus:border-indigo-600 outline-none" required />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Return Date</label>
                            <input type="date" value={leave.endDate} onChange={e => setLeave({...leave, endDate: e.target.value})} className="w-full p-4 bg-slate-50 border-2 border-transparent rounded-2xl font-bold focus:border-indigo-600 outline-none" required />
                        </div>
                    </div>
                    <div className="space-y-1.5">
                         <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Primary Reason</label>
                         <textarea value={leave.reason} onChange={e => setLeave({...leave, reason: e.target.value})} className="w-full p-4 bg-slate-50 border-2 border-transparent rounded-2xl font-bold focus:border-indigo-600 outline-none h-32 resize-none" placeholder="Please provide details..." required />
                    </div>
                    <button type="submit" className="w-full bg-purple-600 text-white p-5 rounded-3xl font-black hover:bg-purple-700 transition-all shadow-xl shadow-purple-100 flex items-center justify-center gap-3 group">
                        Submit Request
                        <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                    </button>
                </form>
            </DetailModal>
        </div>
    );
};

const StatCard = ({ icon: Icon, label, value, color, onClick }) => (
    <button 
        onClick={onClick}
        className="bg-white p-6 rounded-3xl border border-slate-100 shadow-md shadow-slate-200/40 flex items-center gap-4 group hover:border-indigo-600 transition-all cursor-pointer w-full text-left"
    >
        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-colors group-hover:bg-indigo-600 group-hover:text-white shrink-0 ${color}`}>
            <Icon size={28} />
        </div>
        <div className="min-w-0">
            <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest leading-none mb-1 truncate">{label}</p>
            <p className="text-lg font-black text-slate-900">{value}</p>
        </div>
    </button>
);

export default EmployeeDashboard;
