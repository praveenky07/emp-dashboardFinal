import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useUser } from '../context/UserContext';
import DetailModal from '../components/DetailModal';
import { handleError } from '../utils/handleError';
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
    ArrowDownRight,
    Wallet,
    Plus,
    UserCheck,
    Coins,
    CheckCircle
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
    const { user } = useUser();
    const role = user?.role?.toLowerCase() || '';
    const isAdminOrManager = role === 'admin' || role === 'manager';
    
    const [stats, setStats] = useState({ 
        chartData: [],
        totalWorkTime: 0,
        totalBreakTime: 0,
        totalMeetingTime: 0
    });
    const [selectedRange, setSelectedRange] = useState('weekly');
    const [productivity, setProductivity] = useState({ score: 0, work: 0, breaks: 0 });
    const [reviews, setReviews] = useState([]);
    const [bonuses, setBonuses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [team, setTeam] = useState([]);
    
    // UI Local State
    const [activeModal, setActiveModal] = useState(null); // 'review', 'bonus'
    const [submitting, setSubmitting] = useState(false);
    const [reviewForm, setReviewForm] = useState({ userId: '', rating: 5, feedback: '', tags: [], period: 'Q1 2026' });
    const [bonusForm, setBonusForm] = useState({ employeeId: '', amount: '', reason: '' });

    const fetchData = async () => {
        try {
            setLoading(true);
            const [statsRes, perfRes, reviewsRes, bonusRes] = await Promise.all([
                api.get(`/time/stats?range=${selectedRange}`),
                api.get(`/performance?range=${selectedRange}`),
                api.get('/performance/reviews/my'),
                api.get('/performance/bonus')
            ]);

            const perfData = perfRes.data || { labels: [], data: [] };
            const transformedChartData = (perfData.labels || []).map((label, index) => ({
                date: label,
                work_duration: perfData.data ? perfData.data[index] : 0
            }));

            setStats({ ...statsRes.data, chartData: transformedChartData });
            
            const totalWork = statsRes.data.totalWorkTime || 0;
            const totalBreaks = statsRes.data.totalBreakTime || 0;
            const totalMeetings = statsRes.data.totalMeetingTime || 0;
            const totalTime = totalWork + totalBreaks + totalMeetings;
            const scorePercent = totalTime > 0 ? Math.round((totalWork / totalTime) * 100) : 0;

            setProductivity({ work: totalWork, breaks: totalBreaks, score: scorePercent });
            setReviews(reviewsRes.data);
            setBonuses(bonusRes.data);

            if (isAdminOrManager) {
                const endpoint = role === 'admin' ? '/admin/users' : '/manager/team';
                const teamRes = await api.get(endpoint);
                setTeam(teamRes.data || []);
            }
        } catch (err) {
            handleError(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [selectedRange]);

    const handleReviewSubmit = async (e) => {
        e.preventDefault();
        try {
            setSubmitting(true);
            await api.post('/performance/submit-review', reviewForm);
            alert('Review submitted successfully');
            setActiveModal(null);
            setReviewForm({ userId: '', rating: 5, feedback: '', tags: [], period: 'Q1 2026' });
            fetchData();
        } catch (err) { handleError(err); }
        finally { setSubmitting(false); }
    };

    const handleBonusSubmit = async (e) => {
        e.preventDefault();
        try {
            setSubmitting(true);
            await api.post('/performance/submit-bonus', bonusForm);
            alert('Bonus awarded successfully');
            setActiveModal(null);
            setBonusForm({ employeeId: '', amount: '', reason: '' });
            fetchData();
        } catch (err) { handleError(err); }
        finally { setSubmitting(false); }
    };

    const formatTime = (seconds) => {
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        return `${h}h ${m}m`;
    };

    const totalCalculatedBonus = bonuses.reduce((acc, b) => acc + (b.amount || 0), 0);

    if (loading) return <div className="flex items-center justify-center min-h-[60vh]"><div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" /></div>;

    const COLORS = ['#4F46E5', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];

    return (
        <div className="space-y-8 animate-in fade-in duration-700">
            {/* Top Bar with Actions */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 bg-white p-8 rounded-[32px] border border-slate-100 shadow-sm">
                <div>
                   <h1 className="text-3xl font-black text-slate-900 tracking-tight">Enterprise Performance</h1>
                   <p className="text-slate-500 font-bold text-sm">Professional evaluation and financial recognition hub.</p>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                    <div className="flex items-center bg-slate-50 p-1.5 rounded-2xl border border-slate-200">
                        {['weekly', 'monthly', 'quarterly'].map((range) => (
                            <button 
                                key={range}
                                onClick={() => setSelectedRange(range)}
                                className={`px-4 py-2 rounded-xl font-black text-[10px] transition-all uppercase tracking-widest ${
                                    selectedRange === range 
                                    ? 'bg-white text-indigo-600 shadow-sm' 
                                    : 'text-slate-400 hover:text-slate-600'
                                }`}
                            >
                                {range}
                            </button>
                        ))}
                    </div>
                    {isAdminOrManager && (
                        <>
                            <button 
                                onClick={() => setActiveModal('review')}
                                className="px-6 py-3.5 bg-indigo-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 flex items-center gap-2"
                            >
                                <UserCheck size={16} /> Give Review
                            </button>
                            <button 
                                onClick={() => setActiveModal('bonus')}
                                className="px-6 py-3.5 bg-emerald-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-100 flex items-center gap-2"
                            >
                                <Coins size={16} /> Give Bonus
                            </button>
                        </>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
                {/* LEFT SIDE: Stats & Trends (7 cols) */}
                <div className="xl:col-span-12 lg:col-span-12 xl:grid xl:grid-cols-12 gap-8">
                     <div className="xl:col-span-4 space-y-8">
                        {/* Score Card */}
                        <div className="bg-slate-900 p-8 rounded-[40px] text-white shadow-2xl relative overflow-hidden group border border-slate-800">
                            <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full -mr-32 -mt-32 blur-3xl opacity-50" />
                            <div className="relative z-10 flex flex-col h-full justify-between">
                                <div>
                                    <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center mb-8 border border-white/10 group-hover:scale-110 transition-transform">
                                        <Award className="text-indigo-400" size={24} />
                                    </div>
                                    <h2 className="text-xl font-black mb-1">Efficiency Score</h2>
                                    <p className="text-indigo-400 text-[10px] font-black uppercase tracking-[0.2em]">Live Productivity Index</p>
                                </div>
                                
                                <div className="my-10 text-center">
                                    <span className="text-7xl font-black tracking-tighter">{productivity.score}<span className="text-3xl text-indigo-500 uppercase ml-1">%</span></span>
                                </div>

                                <div className="space-y-4 pt-6 border-t border-white/5">
                                    <div className="flex justify-between items-center text-[10px] font-black text-slate-500 uppercase tracking-widest">
                                        <span>Work Duration</span>
                                        <span className="text-indigo-400">{formatTime(productivity.work)}</span>
                                    </div>
                                    <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                                        <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${productivity.score}%` }} />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Recent Reviews Preview */}
                        <div className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm flex-1">
                            <h3 className="font-black text-slate-900 mb-6 flex items-center gap-2 uppercase text-xs tracking-widest">
                                <Star className="text-amber-400 fill-amber-400" size={16} /> Latest Feedback
                            </h3>
                            <div className="space-y-4">
                                {reviews.slice(0, 2).map((review) => (
                                    <div key={review.id} className="p-5 bg-slate-50 rounded-3xl border border-slate-100">
                                        <div className="flex gap-0.5 mb-2">
                                            {[...Array(5)].map((_, i) => <Star key={i} size={10} className={i < review.rating ? 'fill-amber-400 text-amber-400' : 'text-slate-200'} />)}
                                        </div>
                                        <p className="text-xs font-bold text-slate-600 line-clamp-2 italic">"{review.feedback}"</p>
                                    </div>
                                ))}
                                {reviews.length === 0 && <p className="text-center text-[10px] font-black text-slate-400 py-4">No reviews yet</p>}
                            </div>
                        </div>
                     </div>

                     {/* Main Trends Chart (8 cols) */}
                     <div className="xl:col-span-8 flex flex-col gap-8">
                        <section className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm flex-1">
                            <div className="flex items-center justify-between mb-8">
                                <h2 className="text-sm font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
                                    <Activity className="text-indigo-600" size={18} /> Trend Matrix
                                </h2>
                                <span className="text-[10px] font-black text-emerald-500 bg-emerald-50 px-3 py-1 rounded-full uppercase tracking-widest">Live Sync</span>
                            </div>
                            <div className="h-[400px] w-full font-bold">
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={stats.chartData}>
                                        <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="#f1f5f9" />
                                        <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10, fontWeight: 900}} dy={15} />
                                        <YAxis hide />
                                        <Tooltip 
                                            contentStyle={{borderRadius: '24px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)', fontWeight: 'black', fontSize: '10px'}}
                                            formatter={(value) => formatTime(value)}
                                        />
                                        <Area type="monotone" dataKey="work_duration" stroke="#4F46E5" strokeWidth={4} fillOpacity={0.05} fill="#4F46E5" dot={{ r: 4, fill: '#4F46E5', strokeWidth: 2, stroke: '#fff' }} />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        </section>
                     </div>
                </div>

                {/* BOTTOM: Detailed Lists */}
                <div className="xl:col-span-6 space-y-8">
                    <section className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm h-full">
                        <div className="flex items-center justify-between mb-8">
                            <h3 className="font-black text-slate-900 flex items-center gap-3 uppercase text-xs tracking-widest">
                                <Award className="text-indigo-600" size={18} /> Performance Reviews
                            </h3>
                            <span className="text-[10px] font-black text-slate-400 bg-slate-50 px-3 py-1 rounded-full uppercase">{reviews.length} Total</span>
                        </div>
                        <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
                            {reviews.map(review => (
                                <div key={review.id} className="p-6 bg-slate-50 rounded-[32px] border border-slate-100 hover:border-indigo-200 transition-all group">
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-2xl bg-white border border-slate-100 flex items-center justify-center text-indigo-600 font-extrabold shadow-sm">
                                                {review.reviewer_name[0]}
                                            </div>
                                            <div>
                                                <p className="text-[11px] font-black text-slate-900 group-hover:text-indigo-600 transition-colors uppercase tracking-tight">{review.reviewer_name}</p>
                                                <div className="flex gap-0.5 mt-0.5">
                                                    {[...Array(5)].map((_, i) => <Star key={i} size={8} className={i < review.rating ? 'fill-amber-400 text-amber-400' : 'text-slate-200'} />)}
                                                </div>
                                            </div>
                                        </div>
                                        <span className="text-[9px] font-black text-indigo-500 bg-white border border-indigo-50 px-3 py-1 rounded-full uppercase tracking-widest">{review.period}</span>
                                    </div>
                                    <p className="text-xs text-slate-600 font-bold leading-relaxed italic animate-in slide-in-from-left duration-500">"{review.feedback}"</p>
                                    <div className="mt-4 flex flex-wrap gap-2">
                                        {review.tags?.map((tag, idx) => (
                                            <span key={idx} className="text-[8px] font-black text-slate-400 bg-white px-2 py-0.5 rounded border border-slate-100 uppercase tracking-widest">{tag}</span>
                                        ))}
                                    </div>
                                </div>
                            ))}
                            {reviews.length === 0 && (
                                <div className="py-20 text-center opacity-30">
                                    <History className="mx-auto mb-4" size={48} />
                                    <p className="font-black uppercase text-xs tracking-widest">No detailed evaluations</p>
                                </div>
                            )}
                        </div>
                    </section>
                </div>

                <div className="xl:col-span-6 space-y-8">
                    <section className="bg-emerald-50/50 p-8 rounded-[40px] border border-emerald-100 shadow-sm h-full">
                        <div className="flex items-center justify-between mb-8">
                            <h3 className="font-black text-slate-900 flex items-center gap-3 uppercase text-xs tracking-widest">
                                <Wallet className="text-emerald-600" size={18} /> Financial Recognition
                            </h3>
                            <div className="text-right">
                                <p className="text-2xl font-black text-slate-900 tracking-tighter leading-none">${totalCalculatedBonus.toLocaleString()}</p>
                                <p className="text-[8px] font-black text-emerald-600 uppercase tracking-[0.2em] mt-1">Life-cycle Bonus</p>
                            </div>
                        </div>
                        <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
                            {bonuses.map(bonus => (
                                <div key={bonus.id} className="p-6 bg-white rounded-[32px] border border-emerald-100 shadow-sm flex items-center justify-between hover:shadow-md transition-all">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-600">
                                            <Coins size={20} />
                                        </div>
                                        <div>
                                            <p className="text-xs font-black text-slate-900 uppercase tracking-tight">{bonus.reason || 'Performance Award'}</p>
                                            <p className="text-[10px] font-bold text-slate-400">{new Date(bonus.created_at).toLocaleDateString()} • {bonus.manager_name}</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-xl font-black text-slate-900 tracking-tighter">${bonus.amount.toLocaleString()}</p>
                                        <p className="text-[8px] font-black text-emerald-500 uppercase tracking-widest">Credit</p>
                                    </div>
                                </div>
                            ))}
                            {bonuses.length === 0 && (
                                <div className="py-20 text-center opacity-30">
                                    <ZapIcon className="mx-auto mb-4" size={48} />
                                    <p className="font-black uppercase text-xs tracking-widest">No financial awards</p>
                                </div>
                            )}
                        </div>
                    </section>
                </div>
            </div>

            {/* MODALS */}
            <DetailModal isOpen={activeModal === 'review'} onClose={() => setActiveModal(null)} title="Author Performance Evaluation">
                <form onSubmit={handleReviewSubmit} className="space-y-6">
                    <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Target Personnel</label>
                        <select 
                            required
                            value={reviewForm.userId}
                            onChange={(e) => setReviewForm({ ...reviewForm, userId: e.target.value })}
                            className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold focus:border-indigo-600 outline-none transition-all cursor-pointer"
                        >
                            <option value="">Select Employee...</option>
                            {team.map(m => <option key={m.id} value={m.id}>{m.name} ({m.email})</option>)}
                        </select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Rating Matrix (1-5)</label>
                            <div className="flex items-center gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-200">
                            {[1, 2, 3, 4, 5].map((star) => (
                                <button
                                    key={star}
                                    type="button"
                                    onClick={() => setReviewForm({ ...reviewForm, rating: star })}
                                    className="focus:outline-none transition-transform active:scale-90"
                                >
                                    <Star 
                                        size={28} 
                                        className={`${
                                            star <= reviewForm.rating 
                                            ? 'fill-amber-400 text-amber-400' 
                                            : 'text-slate-300'
                                        } transition-colors`} 
                                    />
                                </button>
                            ))}
                            <span className="ml-auto text-[10px] font-black text-indigo-600 uppercase tracking-widest bg-indigo-50 px-3 py-1 rounded-full">
                                {reviewForm.rating}/5 Score
                            </span>
                        </div>
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Review Cycle</label>
                            <select 
                                value={reviewForm.period}
                                onChange={(e) => setReviewForm({ ...reviewForm, period: e.target.value })}
                                className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold"
                            >
                                <option value="Q1 2026">Q1 2026 (Jan-Mar)</option>
                                <option value="Q2 2026">Q2 2026 (Apr-Jun)</option>
                                <option value="April 2026">April 2026</option>
                            </select>
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Critical Feedback</label>
                        <textarea 
                            required
                            rows={4}
                            value={reviewForm.feedback}
                            onChange={(e) => setReviewForm({ ...reviewForm, feedback: e.target.value })}
                            className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-[32px] text-xs font-bold focus:border-indigo-600 outline-none transition-all resize-none"
                            placeholder="Provide constructive assessment of targets performance..."
                        />
                    </div>

                    <button 
                        disabled={submitting}
                        className="w-full py-5 bg-indigo-600 text-white rounded-[32px] font-black uppercase tracking-[0.2em] shadow-2xl hover:bg-black transition-all flex items-center justify-center gap-2"
                    >
                        {submitting ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <CheckCircle size={18} />}
                        Confirm Evaluation
                    </button>
                </form>
            </DetailModal>

            <DetailModal isOpen={activeModal === 'bonus'} onClose={() => setActiveModal(null)} title="Authorize Financial Award">
                <form onSubmit={handleBonusSubmit} className="space-y-6">
                    <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Beneficiary</label>
                        <select 
                            required
                            value={bonusForm.employeeId}
                            onChange={(e) => setBonusForm({ ...bonusForm, employeeId: e.target.value })}
                            className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold"
                        >
                            <option value="">Select Employee...</option>
                            {team.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                        </select>
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Award Amount ($)</label>
                        <input 
                            type="number" required placeholder="e.g. 500.00"
                            value={bonusForm.amount}
                            onChange={(e) => setBonusForm({ ...bonusForm, amount: e.target.value })}
                            className="w-full px-5 py-4 bg-emerald-50 border border-emerald-100 rounded-2xl text-xs font-bold focus:border-emerald-600 outline-none"
                        />
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Justification</label>
                        <textarea 
                            required
                            rows={3}
                            value={bonusForm.reason}
                            onChange={(e) => setBonusForm({ ...bonusForm, reason: e.target.value })}
                            className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-[32px] text-xs font-bold focus:border-indigo-600 outline-none transition-all resize-none"
                            placeholder="State reason for financial recognition..."
                        />
                    </div>

                    <button 
                        disabled={submitting}
                        className="w-full py-5 bg-emerald-600 text-white rounded-[32px] font-black uppercase tracking-[0.2em] shadow-2xl hover:bg-black transition-all flex items-center justify-center gap-2"
                    >
                        {submitting ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Coins size={18} />}
                        Credit Personnel
                    </button>
                </form>
            </DetailModal>
        </div>
    );
};

export default PerformancePage;
