import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { 
    TrendingUp, 
    BarChart3, 
    PieChart, 
    Activity, 
    Zap, 
    Clock, 
    Award, 
    Star,
    Target,
    Zap as ZapIcon,
    History,
    ArrowUpRight,
    ArrowDownRight
} from 'lucide-react';
import { 
    AreaChart, 
    Area, 
    XAxis, 
    YAxis, 
    CartesianGrid, 
    Tooltip, 
    ResponsiveContainer,
    BarChart,
    Bar,
    Cell
} from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';

const PerformancePage = () => {
    const [stats, setStats] = useState({ 
        chartData: [],
        totalWorkTime: 0,
        totalBreakTime: 0,
        totalMeetingTime: 0
    });
    const [selectedRange, setSelectedRange] = useState('weekly');
    const [productivity, setProductivity] = useState({ score: 0, work: 0, breaks: 0 });
    const [loading, setLoading] = useState(true);

    const fetchData = async () => {
        try {
            setLoading(true);
            console.log(`[DEBUG] Fetching performance for range: ${selectedRange}`);
            
            const [statsRes, perfRes] = await Promise.all([
                api.get(`/time/stats?range=${selectedRange}`),
                api.get(`/performance?range=${selectedRange}`)
            ]);

            console.log('[DEBUG] Performance Chart API Response:', perfRes.data);

            // Transform [labels, data] into Recharts format
            const transformedChartData = perfRes.data.labels.map((label, index) => ({
                date: label,
                work_duration: perfRes.data.data[index]
            }));

            setStats({
                ...statsRes.data,
                chartData: transformedChartData
            });
            
            const totalWork = statsRes.data.totalWorkTime || 0;
            const totalBreaks = statsRes.data.totalBreakTime || 0;
            const totalMeetings = statsRes.data.totalMeetingTime || 0;
            const totalTime = totalWork + totalBreaks + totalMeetings;
            const scorePercent = totalTime > 0 ? Math.round((totalWork / totalTime) * 100) : 0;

            setProductivity({
                work: totalWork,
                breaks: totalBreaks,
                score: scorePercent
            });
        } catch (err) {
            console.error('[ERROR] Failed to fetch performance metrics:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [selectedRange]);

    const formatTime = (seconds) => {
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        return `${h}h ${m}m`;
    };

    if (loading) return <div className="flex items-center justify-center min-h-[60vh]"><div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" /></div>;

    const COLORS = ['#4F46E5', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];

    return (
        <div className="space-y-10 animate-in fade-in duration-700">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                   <h1 className="text-4xl font-black text-slate-900 tracking-tight">Performance Analytics</h1>
                   <p className="text-slate-500 font-medium tracking-tight">Detailed report on your productivity and goal alignment.</p>
                </div>
                <div className="flex items-center bg-white p-2 rounded-2xl border border-slate-100 shadow-sm">
                    {['weekly', 'monthly', 'quarterly'].map((range) => (
                        <button 
                            key={range}
                            onClick={() => setSelectedRange(range)}
                            className={`px-5 py-2.5 rounded-xl font-black text-xs transition-all capitalize ${
                                selectedRange === range 
                                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100' 
                                : 'text-slate-400 hover:text-slate-900'
                            }`}
                        >
                            {range}
                        </button>
                    ))}
                </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
                {/* Score Card */}
                <div className="xl:col-span-1 space-y-8">
                    <div className="bg-slate-900 p-10 rounded-[40px] text-white shadow-2xl relative overflow-hidden group h-full flex flex-col justify-between">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full -mr-32 -mt-32 blur-3xl opacity-50" />
                        <div>
                            <div className="w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center mb-10 border border-white/10 group-hover:scale-110 transition-transform">
                                <Award className="text-indigo-400" size={28} />
                            </div>
                            <h2 className="text-2xl font-black mb-1">Performance Score</h2>
                            <p className="text-indigo-300 font-bold text-xs uppercase tracking-widest leading-loose">Performance Level</p>
                        </div>
                        
                        <div className="mt-12 text-center relative z-10">
                            <span className="text-8xl font-black tracking-tighter">{productivity.score}<span className="text-4xl text-indigo-400">%</span></span>
                            <div className="mt-6 flex items-center justify-center gap-2 text-emerald-400 font-black text-sm">
                                <ArrowUpRight size={20} />
                                <span>+2.4% vs last {selectedRange === 'weekly' ? 'week' : selectedRange === 'monthly' ? 'month' : 'quarter'}</span>
                            </div>
                        </div>

                        <div className="mt-12 pt-8 border-t border-white/5 space-y-6">
                             <div className="flex justify-between items-center text-xs font-bold text-indigo-200 uppercase tracking-widest">
                                <span>Reported Duration</span>
                                <span>{formatTime(productivity.work)}</span>
                             </div>
                             <div className="flex justify-between items-center text-xs font-bold text-indigo-200 uppercase tracking-widest">
                                <span>Consistency</span>
                                <span>98%</span>
                             </div>
                        </div>
                    </div>
                </div>

                {/* Main Trends */}
                <div className="xl:col-span-3 space-y-8">
                    <section className="bg-white p-10 rounded-[40px] border border-slate-100 shadow-xl shadow-slate-200/50">
                        <div className="flex items-center justify-between mb-10">
                             <h2 className="text-xl font-black text-slate-900 flex items-center gap-3">
                                <Activity className="text-indigo-600" size={22} />
                                Performance Trend
                             </h2>
                        </div>
                        <div className="h-80 w-full font-bold">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={stats.chartData && stats.chartData.length > 0 ? stats.chartData : [
                                    { date: 'Mon', work_duration: 0 },
                                    { date: 'Tue', work_duration: 0 },
                                    { date: 'Wed', work_duration: 0 },
                                ]}>
                                    <defs>
                                        <linearGradient id="pColor" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#4F46E5" stopOpacity={0.2}/>
                                            <stop offset="95%" stopColor="#4F46E5" stopOpacity={0}/>
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="#f1f5f9" />
                                    <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10, fontWeight: 700}} dy={15} />
                                    <YAxis hide />
                                    <Tooltip 
                                        contentStyle={{borderRadius: '24px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)', fontWeight: 'bold'}}
                                        formatter={(value) => formatTime(value)}
                                    />
                                    <Area type="monotone" dataKey="work_duration" stroke="#4F46E5" strokeWidth={5} fillOpacity={1} fill="url(#pColor)" dot={{ r: 6, fill: '#4F46E5', strokeWidth: 3, stroke: '#fff' }} />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </section>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                         <div className="bg-white p-10 rounded-[40px] border border-slate-100 shadow-xl shadow-slate-200/50">
                            <h3 className="font-black text-slate-900 mb-8 flex items-center gap-3">
                                <Target className="text-indigo-600" size={20} />
                                Time Allocation
                            </h3>
                            <div className="h-48 w-full font-bold">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={[
                                        { name: 'Focused', value: stats.totalWorkTime },
                                        { name: 'Breaks', value: stats.totalBreakTime },
                                        { name: 'Meetings', value: stats.totalMeetingTime },
                                    ]}>
                                        <XAxis dataKey="name" hide />
                                        <Tooltip 
                                            cursor={{ fill: 'transparent' }} 
                                            contentStyle={{borderRadius: '20px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontWeight: 'bold'}} 
                                            formatter={(value) => formatTime(value)}
                                        />
                                        <Bar dataKey="value" radius={[12, 12, 12, 12]} barSize={40}>
                                            { [0, 1, 2].map((entry, index) => <Cell key={index} fill={COLORS[index % COLORS.length]} />) }
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                         </div>

                         <div className="bg-indigo-50 p-10 rounded-[40px] border border-indigo-100 flex flex-col justify-between">
                            <div>
                                <h3 className="font-black text-slate-900 mb-2">Manager Feedback</h3>
                                <p className="text-xs text-indigo-800 font-bold leading-relaxed">
                                    "Continuously exceeding expectations. Focused on high-impact objectives and efficient resource allocation."
                                </p>
                            </div>
                            <div className="flex items-center gap-4 mt-8">
                                <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-indigo-600 border border-indigo-100">
                                    <Star className="fill-current" size={18} />
                                </div>
                                <div>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Feedback by</p>
                                    <p className="text-sm font-black text-slate-900">System Analytics</p>
                                </div>
                            </div>
                         </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PerformancePage;
