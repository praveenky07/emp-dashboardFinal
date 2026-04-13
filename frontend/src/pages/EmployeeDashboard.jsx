import React, { useState, useEffect } from 'react';
import api from '../services/api';
import socket from '../services/socket';
import DetailModal from '../components/DetailModal';
import { handleError, showToast } from '../utils/handleError';

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
  Briefcase,
  Wallet,
  ShieldCheck,
  Gift,
  FileText,
  Target,
  History
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
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
import LeaveForm from '../components/LeaveForm';
import { useUser } from '../context/UserContext';
import { SkeletonStat, SkeletonCard } from '../components/Skeleton';

const EmployeeDashboard = () => {
    const { user } = useUser();
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
    const [tasks, setTasks] = useState([]);
    
    // UI state
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);
    
    // Modal states
    const [activeModal, setActiveModal] = useState(null); // 'meeting', 'leave', 'productivity', 'workHours', 'breaks', 'meetingsList'
    const [leaves, setLeaves] = useState([]);
    const [leaveBalances, setLeaveBalances] = useState({ total_leaves: 0, used_leaves: 0, remaining_leaves: 0 });
    const [latestPayslip, setLatestPayslip] = useState(null);
    const [taxStatus, setTaxStatus] = useState('Not Submitted');
    const [benefitsCount, setBenefitsCount] = useState(0);
    const [attendanceStats, setAttendanceStats] = useState({ workingDays: 20, presentDays: 0 });

    const fetchData = async () => {
        if (!loading) setLoading(true);
        try {
            const [statusRes, statsRes, prodRes, leavesRes, balanceRes, payrollRes, taxRes, benefitsRes, attLogsRes] = await Promise.all([
                api.get('/time/status'),
                api.get('/time/stats'), 
                api.get('/time/productivity'),
                api.get('/leave/my'),
                api.get('/leave/balance/my'),
                api.get('/payroll/my'),
                api.get('/tax/my'),
                api.get('/benefits/my'),
                api.get('/attendance/my')
            ]);
            setStatus(statusRes.data || { active: false, onBreak: false });
            setStats(statsRes.data || { totalWorkTime: 0, totalBreakTime: 0, totalMeetings: 0, weeklyData: [], meetingsList: [], breaksList: [] });
            setLeaves(leavesRes.data || []);
            setLeaveBalances(balanceRes.data || { total_leaves: 0, used_leaves: 0, remaining_leaves: 0 });
            setWorkLogs(attLogsRes.data || []);
            
            if (payrollRes.data?.length > 0) setLatestPayslip(payrollRes.data[0]);
            if (taxRes.data?.length > 0) setTaxStatus(taxRes.data[0].status);
            setBenefitsCount(benefitsRes.data?.length || 0);

            try {
                const hStats = await api.get('/holidays/stats');
                setAttendanceStats(hStats.data || { workingDays: 20, presentDays: 0 });
            } catch (e) {
                console.error(e);
            }
            
            const pData = prodRes.data || {};
            const totalWork = pData.totalWorkTime || 0;
            const totalBreaks = pData.totalBreakTime || 0;
            const totalMeetings = pData.totalMeetingTime || 0;
            
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
            fetchMyTasks();
            
            if (statusRes.data.active && statusRes.data.startTime) {
                const start = new Date(statusRes.data.startTime);
                const now = new Date();
                setTimer(Math.floor((now - start) / 1000));
            } else if (statusRes.data.completed && statusRes.data.startTime && statusRes.data.endTime) {
                const start = new Date(statusRes.data.startTime);
                const end = new Date(statusRes.data.endTime);
                setTimer(Math.floor((end - start) / 1000));
            }
        } catch (e) {
            console.error('Error fetching dashboard data', e);
        } finally {
            setLoading(false);
        }
    };

    const fetchAssignedProjects = async () => {
        try {
            const { data } = await api.get('/projects');
            setAssignedProjects(data);
        } catch (error) { console.error('Error fetching assigned projects', error); }
    };

    const fetchMyTasks = async () => {
        try {
            const { data } = await api.get('/tasks/my');
            setTasks(data);
        } catch (error) { console.error('Error fetching tasks', error); }
    };

    const handleUpdateTaskStatus = async (taskId, status) => {
        try {
            await api.put('/tasks/status', { taskId, status });
            fetchMyTasks();
        } catch (error) { handleError(error); }

    };

    useEffect(() => {
        fetchData();
        
        const handleRemoteUpdate = (data) => {
            if (data?.userId === user.id) fetchData();
        };

        socket.on('attendanceUpdated', handleRemoteUpdate);
        socket.on('attendanceStarted', handleRemoteUpdate);
        socket.on('attendanceEnded', handleRemoteUpdate);
        socket.on('leaveRequested', handleRemoteUpdate);
        socket.on('leaveApproved', handleRemoteUpdate);
        socket.on('leaveRejected', handleRemoteUpdate);

        return () => {
            socket.off('attendanceUpdated', handleRemoteUpdate);
            socket.off('attendanceStarted', handleRemoteUpdate);
            socket.off('attendanceEnded', handleRemoteUpdate);
            socket.off('leaveRequested', handleRemoteUpdate);
            socket.off('leaveApproved', handleRemoteUpdate);
            socket.off('leaveRejected', handleRemoteUpdate);
        };
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
            const { data } = await api.post('/attendance/clock-in');
            setStatus(prev => ({ ...prev, active: true, startTime: data.time }));
            setTimer(0);
            fetchData();
        } catch (error) { handleError(error); }

        finally { setLoading(false); }
    };

    const handleStopWork = async () => {
        try {
            setLoading(true);
            await api.post('/attendance/clock-out');
            setStatus({ active: false, onBreak: false });
            setTimer(0);
            fetchData();
        } catch (error) { handleError(error); }

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
        } catch (error) { handleError(error); }

        finally { setLoading(false); }
    };

    const handleManualOverride = async (e) => {
        e.preventDefault();
        try {
            await api.post('/time/manual-override', override);
            setActiveModal(null);
            setOverride({ type: 'attendance', startTime: '', endTime: '', reason: '' });
            fetchData();
        } catch (error) { handleError(error); }

    };


    const onLeaveApplySuccess = () => {
        setActiveModal(null);
        fetchData();
    };

    const fetchWorkLogs = async () => {
        try {
            const { data } = await api.get('/time/work-hours');
            setWorkLogs(data);
            setActiveModal('workHours');
        } catch (error) { console.error(error); }
    };

    const navigate = useNavigate();

    if (loading) {
        return (
            <div className="space-y-10">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {[1, 2, 3, 4].map(i => <SkeletonStat key={i} />)}
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2 h-[450px] skeleton rounded-[32px]" />
                    <div className="flex flex-col gap-6">
                        <div className="h-52 skeleton rounded-[32px]" />
                    </div>
                </div>
                <div className="h-72 skeleton rounded-[32px]" />
            </div>
        );
    }

    return (
        <div className="space-y-10 animate-in fade-in duration-700">
            {/* Quick Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard 
                    icon={CalendarDays} 
                    label="Current Month Attendance" 
                    value={`${attendanceStats.presentDays} Present`} 
                    color="text-emerald-600"
                    bgColor="bg-emerald-50"
                    onClick={() => navigate('/attendance')}
                    trend={`out of ${attendanceStats.workingDays} Working Days`}
                />
                <StatCard 
                    icon={Timer} 
                    label="Avg. Daily Hours" 
                    value={`${workLogs?.length > 0 ? (workLogs.reduce((acc, l) => acc + Number(l.total_hours || 0), 0) / workLogs.length).toFixed(1) : '0.0'} hrs`} 
                    color="text-indigo-600"
                    bgColor="bg-indigo-50"
                    onClick={() => navigate('/attendance')}
                    trend="Target: 8.0h"
                />
                <StatCard 
                    icon={CalendarCheck2} 
                    label="Leave Balance" 
                    value={`${leaveBalances?.remaining_leaves || 0} / ${leaveBalances?.total_leaves || 18} Days`} 
                    color="text-purple-600"
                    bgColor="bg-purple-50"
                    onClick={() => navigate('/leave')}
                />
                {user?.role?.toLowerCase() === 'employee' ? (
                    <button 
                        onClick={() => setActiveModal('leave')}
                        className="premium-card p-6 flex items-center justify-between group cursor-pointer"
                    >
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-indigo-100 group-hover:scale-105 transition-all">
                                <Plus size={24} />
                            </div>
                            <div>
                                <p className="text-[#6b7280] text-[11px] font-bold uppercase tracking-wider leading-none mb-1 text-left">Quick Action</p>
                                <p className="text-sm font-bold text-[#111827]">Apply Leave</p>
                            </div>
                        </div>
                        <ArrowRight size={16} className="text-[#9ca3af] group-hover:text-indigo-600 group-hover:translate-x-1 transition-all" />
                    </button>
                ) : (
                    <StatCard 
                        icon={Users} 
                        label="Meetings Hub" 
                        value={stats.totalMeetings || 0} 
                        color="text-blue-600"
                        bgColor="bg-blue-50"
                        onClick={() => navigate('/meetings')}
                        trend="Team Capacity"
                    />
                )}
            </div>

            {/* Main Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Timer Section */}
                <div className="lg:col-span-2 bg-white p-10 rounded-[32px] border border-slate-200 shadow-sm flex flex-col items-center justify-center relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-50/50 rounded-full -mr-32 -mt-32 blur-3xl transition-all group-hover:bg-indigo-100/50" />
                    
                    <div className="relative z-10 flex flex-col items-center w-full text-center">
                        <div className="flex items-center gap-2 mb-8">
                            <div className={`px-4 py-1.5 rounded-full flex items-center gap-2 border ${status.active ? 'bg-emerald-50 border-emerald-100 text-emerald-700' : 'bg-slate-50 border-slate-100 text-[#6b7280]'}`}>
                                <div className={`w-2 h-2 rounded-full ${status.active ? 'bg-emerald-600 animate-pulse' : 'bg-slate-400'}`} />
                                <span className="text-[10px] font-black uppercase tracking-widest">{status.active ? 'Active Session' : 'Shift Offline'}</span>
                            </div>
                        </div>

                        <h2 className="text-sm font-black text-slate-400 mb-10 uppercase tracking-[0.2em] flex items-center gap-3">
                            <Clock size={16} className="text-indigo-600" /> Professional Continuity Timer
                        </h2>

                        <div className="text-8xl md:text-9xl font-black text-slate-900 mb-12 tabular-nums tracking-tighter leading-none select-none drop-shadow-sm">
                            {formatTime(timer)}
                        </div>

                        <div className="flex flex-wrap justify-center gap-4 w-full max-w-lg">
                            {!status.active && !status.completed ? (
                                <button 
                                    onClick={handleStartWork}
                                    disabled={actionLoading}
                                    className="premium-button-indigo w-full text-lg group py-6"
                                >
                                    {actionLoading ? <Loader2 className="animate-spin" size={24} /> : <Play size={24} className="fill-current" />}
                                    <span>Commence Day Shift</span>
                                    <ArrowRight size={20} className="ml-1 group-hover:translate-x-1 transition-transform" />
                                </button>
                            ) : status.completed ? (
                                <div className="w-full text-center bg-emerald-50 border border-emerald-100 p-6 rounded-[24px]">
                                    <h3 className="text-xl font-black text-emerald-600 mb-2 flex items-center justify-center gap-2"><CheckCircle2 size={24} /> Shift Completed</h3>
                                    <p className="text-sm font-bold text-emerald-700/70">
                                        Logged {status.startTime && !isNaN(new Date(status.startTime).getTime()) ? new Date(status.startTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : '--:--'} - {status.endTime && !isNaN(new Date(status.endTime).getTime()) ? new Date(status.endTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : '--:--'}
                                    </p>
                                </div>
                            ) : (
                                <>
                                    <button 
                                        onClick={() => status.onBreak ? handleToggleBreak() : setActiveModal('breakType')}
                                        disabled={actionLoading}
                                        className={`flex-1 py-5 rounded-2xl font-bold transition-all flex items-center justify-center gap-2 border-2 
                                            ${status.onBreak 
                                                ? 'bg-emerald-600 border-emerald-600 text-white shadow-lg shadow-emerald-100' 
                                                : 'bg-white border-slate-200 text-slate-700 hover:border-indigo-600 hover:text-indigo-600'
                                            }
                                        `}
                                    >
                                        <Coffee size={20} />
                                        <span className="text-lg">{status.onBreak ? `Resume Work` : 'Take Break'}</span>
                                    </button>
                                    <button 
                                        onClick={handleStopWork}
                                        disabled={actionLoading}
                                        className="flex-1 py-5 premium-button-primary"
                                    >
                                        <Square size={18} className="fill-current" />
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
                        className="premium-card p-8 flex flex-col justify-between h-52 group text-left transition-all hover:-translate-y-1 hover:shadow-xl hover:shadow-indigo-500/10"
                    >
                        <div className="flex justify-between items-start">
                            <div className="w-12 h-12 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-all">
                                <Zap size={24} />
                            </div>
                            <span className="px-3 py-1 bg-indigo-50 text-indigo-600 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-1 group-hover:bg-indigo-600 group-hover:text-white transition-all">
                                <TrendingUp size={12} /> Live Score
                            </span>
                        </div>
                        <div>
                            <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-1">Productivity Index</p>
                            <h3 className="text-4xl font-black text-slate-900 tabular-nums tracking-tight">{productivity.score}%</h3>
                        </div>
                        <div className="w-full h-1.5 bg-slate-100 rounded-full mt-2 overflow-hidden">
                            <motion.div initial={{ width: 0 }} animate={{ width: `${productivity.score}%` }} className="h-full bg-indigo-600 rounded-full shadow-[0_0_8px_rgba(79,70,229,0.5)]" />
                        </div>
                    </button>
                    
                    <button 
                        onClick={() => document.getElementById('active-projects-section')?.scrollIntoView({ behavior: 'smooth' })}
                        className="premium-card p-8 flex-1 flex flex-col justify-center gap-2 group text-left cursor-pointer transition-all hover:-translate-y-1 hover:shadow-xl hover:border-indigo-500"
                    >
                        <div className="flex justify-between items-center w-full">
                            <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest">Active Focus</p>
                            <ArrowUpRight size={16} className="text-slate-300 group-hover:text-indigo-600 transition-colors" />
                        </div>
                        <h4 className="text-lg font-bold text-slate-900 leading-tight group-hover:text-indigo-600 transition-colors line-clamp-2">
                             {assignedProjects[0]?.name || 'Engineering Workspace Alpha'}
                        </h4>
                        <div className="flex items-center gap-2 mt-4">
                            <div className="flex -space-x-2">
                                {[1,2,3].map(i => (
                                    <div key={i} className="w-8 h-8 rounded-full border-2 border-white bg-slate-200 flex items-center justify-center text-[10px] font-bold shadow-sm group-hover:border-indigo-50 transition-colors text-slate-500">U{i}</div>
                                ))}
                            </div>
                            <span className="text-xs font-bold text-slate-500 group-hover:text-indigo-600 transition-colors">+ Team Access</span>
                        </div>
                    </button>
                </div>
            </div>

      {/* Performance Chart */}
      <div className="bg-white p-8 rounded-[24px] border border-[#e5e7eb] shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h2 className="text-xl font-bold text-[#111827] tracking-tight">Weekly Performance Trend</h2>
            <p className="text-[#6b7280] text-sm font-medium mt-1">Your productivity analytics for the current cycle</p>
          </div>
          <div className="flex items-center gap-2">
             <div className="w-3 h-3 rounded-full bg-indigo-600" />
             <span className="text-[11px] font-bold text-[#6b7280] uppercase tracking-wider">Work Hours</span>
          </div>
        </div>
        <div className="h-72 w-full font-sans">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={(stats?.weeklyData?.length > 0) ? stats.weeklyData : [
              { date: 'Mon', work_duration: 0 },
              { date: 'Tue', work_duration: 0 },
              { date: 'Wed', work_duration: 0 },
              { date: 'Thu', work_duration: 0 },
              { date: 'Fri', work_duration: 0 },
            ]}>
              <defs>
                <linearGradient id="colorWork" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#4F46E5" stopOpacity={0.1}/>
                  <stop offset="95%" stopColor="#4F46E5" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="#f3f4f6" />
              <XAxis 
                dataKey="date" 
                axisLine={false} 
                tickLine={false} 
                tick={{fill: '#9ca3af', fontSize: 11, fontWeight: 600}} 
                dy={10} 
              />
              <YAxis hide />
              <Tooltip 
                cursor={{ stroke: '#4F46E5', strokeWidth: 1, strokeDasharray: '4 4' }}
                contentStyle={{borderRadius: '12px', border: '1px solid #e5e7eb', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontSize: '12px'}} 
                labelStyle={{fontWeight: 'bold', color: '#111827', marginBottom: '4px'}}
                formatter={(value) => [formatTime(value), 'Work Time']}
              />
              <Area 
                type="monotone" 
                dataKey="work_duration" 
                stroke="#4F46E5" 
                strokeWidth={3} 
                fillOpacity={1} 
                fill="url(#colorWork)" 
                dot={{ r: 4, fill: '#fff', strokeWidth: 2, stroke: '#4F46E5' }} 
                activeDot={{ r: 6, fill: '#4F46E5', stroke: '#fff', strokeWidth: 2 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

            {/* Assigned Projects Section */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        <div className="bg-white p-8 rounded-[24px] border border-[#e5e7eb] shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-bold text-[#111827] tracking-tight">Active Tasks</h2>
              <p className="text-[#6b7280] text-sm font-medium mt-1">Pending operations for your role</p>
            </div>
            <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600">
              <Target size={20} />
            </div>
          </div>
          <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
            {tasks.length === 0 ? (
              <div className="py-12 text-center bg-slate-50 rounded-2xl border border-dashed border-[#e5e7eb]">
                <p className="font-bold text-[#6b7280] text-xs uppercase tracking-wider">No pending tasks</p>
              </div>
            ) : (
              tasks.map(task => (
                <div key={task.id} className="p-5 rounded-2xl bg-white border border-[#f3f4f6] hover:border-indigo-500 hover:shadow-md transition-all group">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1">
                      <h4 className="text-sm font-bold text-[#111827] group-hover:text-indigo-600 transition-colors">{task.title}</h4>
                      <p className="text-[10px] text-[#9ca3af] font-bold uppercase tracking-wider mt-1">Deadline: {task.due_date}</p>
                    </div>
                    <select 
                      value={task.status} 
                      onChange={(e) => handleUpdateTaskStatus(task.id, e.target.value)}
                      className={`px-2 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider border transition-all cursor-pointer outline-none ${
                        task.status === 'Completed' ? 'bg-emerald-50 border-emerald-100 text-emerald-700' :
                        task.status === 'In Progress' ? 'bg-indigo-50 border-indigo-100 text-indigo-700' :
                        'bg-white border-[#e5e7eb] text-[#6b7280]'
                      }`}
                    >
                      <option value="Pending">Pending</option>
                      <option value="In Progress">In Progress</option>
                      <option value="Completed">Completed</option>
                    </select>
                  </div>
                  <div className="flex items-center justify-between pt-3 border-t border-[#f3f4f6]">
                    <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${
                      task.priority === 'High' ? 'bg-rose-50 text-rose-600' : 
                      task.priority === 'Medium' ? 'bg-amber-50 text-amber-600' : 
                      'bg-indigo-50 text-indigo-600'
                    }`}>{task.priority}</span>
                    <p className="text-[10px] font-bold text-[#9ca3af]">By: {task.created_by_name}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div id="active-projects-section" className="bg-white p-8 rounded-[24px] border border-[#e5e7eb] shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-bold text-[#111827] tracking-tight">Active Projects</h2>
              <p className="text-[#6b7280] text-sm font-medium mt-1">Your current project focus</p>
            </div>
            <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600">
               <Briefcase size={20} />
            </div>
          </div>
          <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
            {assignedProjects.length === 0 ? (
              <div className="py-12 text-center bg-slate-50 rounded-2xl border border-dashed border-[#e5e7eb]">
                <p className="font-bold text-[#6b7280] text-xs uppercase tracking-wider">No assignments</p>
              </div>
            ) : (
              assignedProjects.map(project => (
                <div key={project.id} className="p-5 rounded-2xl bg-white border border-[#f3f4f6] hover:border-indigo-500 hover:shadow-md transition-all group">
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="text-sm font-bold text-[#111827] group-hover:text-indigo-600 transition-colors truncate pr-4">{project.name}</h4>
                    <span className="text-[9px] font-bold text-indigo-600 uppercase bg-indigo-50 px-2 py-0.5 rounded-full tracking-wider shrink-0">Live</span>
                  </div>
                  <p className="text-xs text-[#6b7280] line-clamp-2 leading-relaxed mb-4">{project.description}</p>
                  <div className="flex items-center gap-1.5 text-[10px] font-bold text-[#9ca3af] uppercase tracking-wider">
                    <Calendar size={12} className="text-indigo-600" />
                    Deadline: {project.deadline ? new Date(project.deadline).toLocaleDateString() : 'Unset'}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
            </div>

            {/* Work Logs Section */}
            <div className="premium-card overflow-hidden">
                <div className="p-8 border-b border-slate-100 flex items-center justify-between">
                    <div>
                        <h2 className="text-xl font-black text-slate-900 tracking-tight">Recent Sessions</h2>
                        <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">Clock activity & sessions</p>
                    </div>
                    <button onClick={() => navigate('/attendance')} className="text-[10px] font-black uppercase tracking-widest text-indigo-600 hover:text-indigo-700 flex items-center gap-2 bg-indigo-50 px-4 py-2 rounded-full transition-all">
                        Full Audit Trail <ArrowRight size={12} />
                    </button>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50/50">
                                <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Date</th>
                                <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Clock In</th>
                                <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Clock Out</th>
                                <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Duration</th>
                                <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {workLogs.slice(0, 5).map((log, idx) => (
                                <tr key={idx} className="hover:bg-slate-50/50 transition-colors group">
                                    <td className="px-8 py-5 text-sm font-bold text-slate-600">{new Date(log.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</td>
                                    <td className="px-8 py-5">
                                        <div className="flex items-center gap-2">
                                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                            <span className="text-sm font-black text-slate-900">
                                                {log.clock_in && !isNaN(new Date(log.clock_in).getTime()) ? new Date(log.clock_in).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--'}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-8 py-5">
                                        {log.clock_out ? (
                                            <div className="flex items-center gap-2">
                                                <div className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                                                <span className="text-sm font-black text-slate-900">
                                                    {log.clock_out && !isNaN(new Date(log.clock_out).getTime()) ? new Date(log.clock_out).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--'}
                                                </span>
                                            </div>
                                        ) : (
                                            <span className="px-3 py-1 bg-amber-50 text-amber-600 rounded-lg text-[10px] font-black uppercase tracking-widest">In Progress</span>
                                        )}
                                    </td>
                                    <td className="px-8 py-5 text-sm font-black text-slate-900 text-right">{log.total_hours ? `${Number(log.total_hours).toFixed(2)}h` : '--'}</td>
                                    <td className="px-8 py-5 text-right">
                                        <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest ${
                                            log.status === 'Present' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'
                                        }`}>
                                            {log.status}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                            {workLogs.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="px-8 py-20 text-center">
                                        <div className="flex flex-col items-center gap-3">
                                            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center text-slate-300">
                                                <History size={32} />
                                            </div>
                                            <p className="text-sm font-black text-slate-400 uppercase tracking-widest">No activity recorded for this period</p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
            <DetailModal isOpen={activeModal === 'productivity'} onClose={() => setActiveModal(null)} title="Productivity Analysis">
                <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="bg-[#fcfdfe] p-6 rounded-2xl border border-[#e5e7eb] text-center">
                            <p className="text-[10px] font-bold text-[#6b7280] uppercase tracking-wider mb-2">Work Commitment</p>
                            <p className="text-2xl font-bold text-[#111827]">{formatTime(productivity.work)}</p>
                        </div>
                        <div className="bg-[#fcfdfe] p-6 rounded-2xl border border-[#e5e7eb] text-center">
                            <p className="text-[10px] font-bold text-[#6b7280] uppercase tracking-wider mb-2">Recuperation</p>
                            <p className="text-2xl font-bold text-[#111827]">{formatTime(productivity.breaks)}</p>
                        </div>
                        <div className="bg-[#111827] p-6 rounded-2xl text-white text-center shadow-lg shadow-slate-100">
                            <p className="text-[10px] font-bold text-[#9ca3af] uppercase tracking-wider mb-2">Efficiency Rating</p>
                            <p className="text-2xl font-bold">{productivity.score}%</p>
                        </div>
                    </div>
                    <div className="bg-white p-6 rounded-2xl border border-[#e5e7eb] shadow-sm flex items-start gap-5">
                        <div className="w-12 h-12 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600 shrink-0">
                            <TrendingUp size={24} />
                        </div>
                        <div>
                            <h4 className="text-lg font-bold text-[#111827] mb-1">Standard Calculation Method</h4>
                            <p className="text-[#6b7280] text-sm font-medium leading-relaxed">
                                Your productivity score is derived from the ratio of focused engagement to overall session duration. 
                                We encourage a balanced workflow where high-concentration cycles are interleaved with restorative pauses.
                            </p>
                        </div>
                    </div>
                </div>
            </DetailModal>

            {/* Work Hours List */}
            <DetailModal isOpen={activeModal === 'workHours'} onClose={() => setActiveModal(null)} title="Shift Continuity Logs">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="text-[11px] font-bold text-[#6b7280] uppercase tracking-wider border-b border-[#f3f4f6]">
                                <th className="pb-4 px-2">Calendar Cycle</th>
                                <th className="pb-4 px-2">Engagement</th>
                                <th className="pb-4 px-2">Conclusion</th>
                                <th className="pb-4 px-2 text-right">Net Duration</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[#f3f4f6]">
                             {workLogs.length > 0 ? workLogs.map((log, i) => (
                                 <tr key={log.id || i} className="text-sm font-medium text-[#374151] hover:bg-[#fcfdfe] transition-colors">
                                     <td className="py-4 px-2 font-bold text-[#111827]">{log.checkIn ? new Date(log.checkIn).toLocaleDateString() : 'N/A'}</td>
                                     <td className="py-4 px-2">{log.checkIn ? new Date(log.checkIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--'}</td>
                                     <td className="py-4 px-2">{log.checkOut ? new Date(log.checkOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : <span className="text-indigo-600 font-bold animate-pulse">Syncing...</span>}</td>
                                     <td className="py-4 px-2 text-right font-bold text-[#111827]">{formatTime(log.duration)}</td>
                                 </tr>
                             )) : (
                                 <tr>
                                     <td colSpan="4" className="py-12 text-center text-[#9ca3af] font-bold uppercase tracking-wider text-xs">No activity documented</td>
                                 </tr>
                             )}
                        </tbody>
                    </table>
                </div>
            </DetailModal>

            {/* Breaks List */}
            <DetailModal isOpen={activeModal === 'breaks'} onClose={() => setActiveModal(null)} title="Intermission Records">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="text-[11px] font-bold text-[#6b7280] uppercase tracking-wider border-b border-[#f3f4f6]">
                                <th className="pb-4 px-2 text-left">Timeline</th>
                                <th className="pb-4 px-2">Category</th>
                                <th className="pb-4 px-2 text-right">Span</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[#f3f4f6]">
                            {stats.breaksList && stats.breaksList.map(b => (
                                <tr key={b.id} className="text-sm font-medium text-[#374151] hover:bg-[#fcfdfe] transition-colors">
                                    <td className="py-4 px-2">
                                        {new Date(b.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} → {b.end_time ? new Date(b.end_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Ongoing'}
                                    </td>
                                    <td className="py-4 px-2">
                                        <span className="px-2 py-0.5 bg-amber-50 text-amber-700 rounded-full text-[10px] uppercase font-bold border border-amber-100">{b.type}</span>
                                    </td>
                                    <td className="py-4 px-2 text-right font-bold text-[#111827]">{formatTime(b.duration)}</td>
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
            <DetailModal isOpen={activeModal === 'override'} onClose={() => setActiveModal(null)} title="Administrative Correction">
                <form onSubmit={handleManualOverride} className="space-y-6">
                    <div className="space-y-1.5">
                        <label className="text-[11px] font-bold text-[#6b7280] uppercase tracking-wider ml-1">Entity Type</label>
                        <select value={override.type} onChange={e => setOverride({...override, type: e.target.value})} className="w-full p-4 bg-[#fcfdfe] border border-[#e5e7eb] rounded-xl font-bold outline-none focus:border-indigo-600 focus:ring-4 focus:ring-indigo-50">
                            <option value="attendance">Operational Shift</option>
                            <option value="break">Intermission</option>
                        </select>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <label className="text-[11px] font-bold text-[#6b7280] uppercase tracking-wider ml-1">Initiation</label>
                            <input type="datetime-local" value={override.startTime} onChange={e => setOverride({...override, startTime: e.target.value})} className="w-full p-4 bg-[#fcfdfe] border border-[#e5e7eb] rounded-xl font-bold focus:border-indigo-600 outline-none" required />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[11px] font-bold text-[#6b7280] uppercase tracking-wider ml-1">Expiration</label>
                            <input type="datetime-local" value={override.endTime} onChange={e => setOverride({...override, endTime: e.target.value})} className="w-full p-4 bg-[#fcfdfe] border border-[#e5e7eb] rounded-xl font-bold focus:border-indigo-600 outline-none" required />
                        </div>
                    </div>
                    <div className="space-y-1.5">
                         <label className="text-[11px] font-bold text-[#6b7280] uppercase tracking-wider ml-1">Formal Justification</label>
                         <textarea value={override.reason} onChange={e => setOverride({...override, reason: e.target.value})} className="w-full p-4 bg-[#fcfdfe] border border-[#e5e7eb] rounded-xl font-bold focus:border-indigo-600 outline-none h-24 resize-none" placeholder="Provide audit-trail verification for this manual correction..." required />
                    </div>
                    <button type="submit" className="w-full bg-[#111827] text-white p-4 rounded-xl font-bold hover:bg-black transition-all flex items-center justify-center gap-2 shadow-md">
                        Commit Entry
                    </button>
                </form>
            </DetailModal>

            {/* Idle Warning Modal */}
            <DetailModal isOpen={activeModal === 'idle'} onClose={() => setActiveModal(null)} title="Stagnancy Detected">
                <div className="text-center space-y-6 py-4">
                    <div className="w-16 h-16 bg-amber-50 rounded-xl flex items-center justify-center mx-auto text-amber-600 animate-bounce">
                        <Timer size={32} />
                    </div>
                    <div>
                        <h4 className="text-lg font-bold text-[#111827] mb-2">Protocol Verification Requested</h4>
                        <p className="text-[#6b7280] text-sm font-medium">Session inactivity identified. Please confirm active engagement to sustain continuity.</p>
                    </div>
                    <button onClick={() => setActiveModal(null)} className="w-full bg-indigo-600 text-white p-4 rounded-xl font-bold hover:bg-indigo-700 transition-all shadow-md">
                        Confirm Active State
                    </button>
                </div>
            </DetailModal>

            <DetailModal 
                isOpen={activeModal === 'leave'} 
                onClose={() => setActiveModal(null)} 
                title="Apply New Leave"
            >
                <div className="p-2">
                    <LeaveForm 
                        onSuccess={onLeaveApplySuccess} 
                        onCancel={() => setActiveModal(null)} 
                    />
                </div>
            </DetailModal>
        </div>
    );
};

const StatCard = ({ icon: Icon, label, value, color, bgColor, onClick, trend }) => (
  <button 
    onClick={onClick}
    className="bg-white p-6 rounded-[24px] border border-[#e5e7eb] shadow-sm flex items-center gap-4 group hover:border-indigo-600 hover:shadow-md transition-all cursor-pointer w-full text-left"
  >
    <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all group-hover:bg-indigo-600 group-hover:text-white shrink-0 ${bgColor || 'bg-slate-50'} ${color || 'text-[#6b7280]'}`}>
      <Icon size={24} />
    </div>
    <div className="min-w-0 flex-1">
      <p className="text-[#6b7280] text-[11px] font-bold uppercase tracking-wider leading-none mb-2 truncate">{label}</p>
      <p className="text-xl font-bold text-[#111827] tracking-tight leading-none mb-1">{value || 0}</p>
      {trend && <p className="text-[10px] font-medium text-[#9ca3af]">{trend}</p>}
    </div>
  </button>
);

const EnterpriseCard = ({ title, value, subValue, icon: Icon, color, onClick }) => (
    <button 
        onClick={onClick}
        className="bg-white p-8 rounded-[24px] border border-[#e5e7eb] shadow-sm flex items-center justify-between group hover:border-indigo-500 hover:shadow-md transition-all cursor-pointer text-left w-full relative overflow-hidden"
    >
        <div className="absolute top-0 right-0 w-24 h-24 rounded-full blur-3xl opacity-10" style={{ backgroundColor: color }} />
        <div className="relative z-10">
            <p className="text-[11px] font-bold text-[#6b7280] uppercase tracking-wider mb-1">{title}</p>
            <h3 className="text-2xl font-bold text-[#111827] tracking-tight mb-1">{value}</h3>
            <p className="text-xs font-medium text-[#6b7280]">{subValue}</p>
        </div>
        <div className="w-12 h-12 rounded-xl flex items-center justify-center text-white shadow-lg transition-transform group-hover:scale-110 relative z-10" style={{ backgroundColor: color }}>
            <Icon size={24} />
        </div>
    </button>
);

export default EmployeeDashboard;
