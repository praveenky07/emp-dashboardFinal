import React, { useState, useEffect } from 'react';
import api from '../services/api';
import socket from '../services/socket';
import { handleError } from '../utils/handleError';
import { 
  Calendar, 
  Plus, 
  Search, 
  ChevronRight, 
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Filter,
  ArrowUpRight,
  User,
  MoreVertical,
  CalendarCheck
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import DetailModal from '../components/DetailModal';
import LeaveForm from '../components/LeaveForm';

const LeaveTracker = () => {
    const userData = JSON.parse(localStorage.getItem('user') || '{}');
    const isAdmin = ['admin', 'hr'].includes(userData.role?.toLowerCase());
    const isManager = userData.role?.toLowerCase() === 'manager';
    
    const [leaves, setLeaves] = useState([]);
    const [teamLeaves, setTeamLeaves] = useState([]);
    const [balances, setBalances] = useState({ total_leaves: 0, used_leaves: 0, remaining_leaves: 0 });
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState((isAdmin || isManager) ? 'team' : 'my');
    const [showApplyModal, setShowApplyModal] = useState(false);
    const [filter, setFilter] = useState({ status: 'All', type: 'All' });

    const fetchData = async () => {
        try {
            setLoading(true);
            const [myRes, balRes] = await Promise.all([
                api.get('/leave/my'),
                api.get('/leave/balance/my')
            ]);
            setLeaves(myRes.data);
            setBalances(balRes.data);

            if (isAdmin || isManager) {
                const teamRes = await api.get('/leave/team');
                setTeamLeaves(teamRes.data);
            }
        } catch (error) {
            handleError(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();

        const socketListener = () => fetchData();
        socket.on('leaveStatusUpdated', socketListener);
        socket.on('leaveRequested', socketListener);

        return () => {
            socket.off('leaveStatusUpdated', socketListener);
            socket.off('leaveRequested', socketListener);
        };
    }, []);

    const handleAction = async (id, status) => {
        try {
            await api.put('/leave/update-status', { id, status });
            fetchData();
        } catch (error) {
            handleError(error);
        }
    };

    const getStatusStyle = (status) => {
        switch (status) {
            case 'Approved': return 'bg-emerald-50 text-emerald-700 border-emerald-100';
            case 'Rejected': return 'bg-rose-50 text-rose-700 border-rose-100';
            case 'Cancelled': return 'bg-slate-50 text-slate-500 border-slate-100';
            default: return 'bg-amber-50 text-amber-700 border-amber-100';
        }
    };

    const filteredData = (activeTab === 'my' ? leaves : teamLeaves).filter(item => {
        if (filter.status !== 'All' && item.status !== filter.status) return false;
        if (filter.type !== 'All' && item.type !== filter.type) return false;
        return true;
    });

    if (loading) return <div className="flex items-center justify-center min-h-[60vh]"><div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" /></div>;

    return (
        <div className="space-y-8 animate-in fade-in duration-700">
            {/* Context Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                   <h1 className="text-4xl font-black text-slate-900 tracking-tight">Leave Management</h1>
                   <p className="text-slate-500 font-medium">Global workforce absence tracking and capacity planning.</p>
                </div>
                <div className="flex items-center gap-3">
                    {(isAdmin || isManager) && (
                        <div className="flex bg-slate-100 p-1 rounded-2xl border border-slate-200">
                            <button onClick={() => setActiveTab('my')} className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'my' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>Personal</button>
                            <button onClick={() => setActiveTab('team')} className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'team' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>Organization</button>
                        </div>
                    )}
                    <button 
                        onClick={() => setShowApplyModal(true)}
                        className="px-6 py-3.5 bg-indigo-600 text-white rounded-2xl font-black uppercase tracking-widest text-[11px] shadow-xl shadow-indigo-100 hover:bg-slate-900 transition-all flex items-center gap-3"
                    >
                        <Plus size={18} /> New Application
                    </button>
                </div>
            </div>

            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <BalanceCard label="Annual Grant" value={balances.total_leaves} icon={Calendar} color="indigo" />
                <BalanceCard label="Consumption" value={balances.used_leaves} icon={Clock} color="rose" />
                <BalanceCard label="Current Balance" value={balances.remaining_leaves} icon={CheckCircle2} color="emerald" />
            </div>

            {/* Main Content Card */}
            <section className="bg-white rounded-[40px] border border-slate-100 shadow-xl shadow-slate-200/50 overflow-hidden">
                {/* Filters / Toolbar */}
                <div className="p-8 border-b border-slate-50 flex flex-col xl:flex-row xl:items-center justify-between gap-6">
                    <div className="flex items-center gap-4">
                        <div className="relative">
                            <Filter className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                            <select 
                                value={filter.status}
                                onChange={e => setFilter({...filter, status: e.target.value})}
                                className="pl-11 pr-8 py-3 bg-slate-50 border-none rounded-2xl text-[11px] font-black uppercase tracking-widest text-slate-600 outline-none cursor-pointer hover:bg-slate-100 transition-all"
                            >
                                <option value="All">All Status</option>
                                <option value="Pending">Pending</option>
                                <option value="Approved">Approved</option>
                                <option value="Rejected">Rejected</option>
                            </select>
                        </div>
                        <select 
                            value={filter.type}
                            onChange={e => setFilter({...filter, type: e.target.value})}
                            className="px-8 py-3 bg-slate-50 border-none rounded-2xl text-[11px] font-black uppercase tracking-widest text-slate-600 outline-none cursor-pointer hover:bg-slate-100 transition-all"
                        >
                            <option value="All">All Classifications</option>
                            <option value="Casual">Casual</option>
                            <option value="Sick">Sick</option>
                            <option value="Earned">Earned</option>
                            <option value="Unpaid">Unpaid (LOP)</option>
                        </select>
                    </div>

                    <div className="relative group w-full xl:max-w-md">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-indigo-600 transition-colors" size={20} />
                        <input 
                            type="text" 
                            placeholder="Identify specific records or stakeholders..." 
                            className="w-full pl-12 pr-4 py-4 bg-slate-50 border-2 border-transparent rounded-3xl text-sm font-bold text-slate-900 focus:bg-white focus:border-indigo-600 outline-none transition-all placeholder:text-slate-300"
                        />
                    </div>
                </div>

                {/* Table */}
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="border-b border-slate-50">
                                {activeTab === 'team' && <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Stakeholder</th>}
                                <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Timeline & Duration</th>
                                <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Classification</th>
                                <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Protocol Status</th>
                                <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Integrity Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {filteredData.map((lv) => (
                                <tr key={lv.id} className="group hover:bg-slate-50/50 transition-all">
                                    {activeTab === 'team' && (
                                        <td className="px-10 py-6">
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600 font-bold border border-indigo-100">
                                                    {lv.user_name?.[0]}
                                                </div>
                                                <div>
                                                    <p className="font-black text-slate-900 text-sm leading-tight">{lv.user_name}</p>
                                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Global ID: {lv.user_id}</p>
                                                </div>
                                            </div>
                                        </td>
                                    )}
                                    <td className="px-10 py-6">
                                        <div className="flex items-center gap-1.5 mb-1.5 underline decoration-slate-200 underline-offset-4">
                                            <Clock size={14} className="text-slate-400" />
                                            <span className="text-sm font-black text-slate-900">{lv.start_date}</span>
                                            <ChevronRight size={12} className="text-slate-300" />
                                            <span className="text-sm font-black text-slate-900">{lv.end_date}</span>
                                        </div>
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Impact: <span className="text-indigo-600">{lv.total_days} Actual Work Days</span></p>
                                    </td>
                                    <td className="px-10 py-6">
                                        <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border ${
                                            lv.type === 'Unpaid' ? 'bg-rose-50 text-rose-600 border-rose-100' : 'bg-slate-50 text-slate-600 border-slate-100'
                                        }`}>{lv.type}</span>
                                    </td>
                                    <td className="px-10 py-6">
                                        <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-2xl border text-[10px] font-black uppercase tracking-widest ${getStatusStyle(lv.status)}`}>
                                            <div className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
                                            {lv.status}
                                        </div>
                                    </td>
                                    <td className="px-10 py-6 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            {statusActions(lv, activeTab, handleAction)}
                                            <button className="p-3 text-slate-300 hover:text-indigo-600 hover:bg-indigo-50 rounded-2xl transition-all">
                                                <MoreVertical size={18} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {filteredData.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="py-24 text-center">
                                         <div className="inline-flex flex-col items-center p-12 border-2 border-dashed border-slate-100 rounded-[40px] bg-slate-50/50">
                                            <CalendarCheck size={40} className="text-slate-200 mb-4" />
                                            <p className="text-slate-400 font-black uppercase tracking-[0.2em] text-xs">Absence Pipeline Clear</p>
                                            <p className="text-slate-400 text-[10px] mt-2 font-bold max-w-[200px]">No active work-cycle disruptions identified in current filters.</p>
                                         </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                <div className="p-8 bg-slate-50/50 border-t border-slate-50 flex items-center justify-between">
                     <div className="flex items-center gap-6">
                        <div className="flex items-center gap-2">
                            <div className="w-2.5 h-2.5 rounded-full bg-indigo-500" />
                            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Active Requests</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Process Efficiency: 98.4%</span>
                        </div>
                     </div>
                     <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Secure Ledger Reference: {new Date().getFullYear()}/LV-AUDIT</p>
                </div>
            </section>

            <DetailModal isOpen={showApplyModal} onClose={() => setShowApplyModal(false)} title="Operational Absence Logging">
                <LeaveForm onSuccess={() => { setShowApplyModal(false); fetchData(); }} onCancel={() => setShowApplyModal(false)} />
            </DetailModal>
        </div>
    );
};

const BalanceCard = ({ label, value, icon: Icon, color }) => (
    <div className={`p-8 rounded-[40px] border relative overflow-hidden group transition-all hover:scale-[1.02] ${
        color === 'indigo' ? 'bg-indigo-600 border-indigo-700 text-white shadow-xl shadow-indigo-200' :
        color === 'rose' ? 'bg-white border-slate-100 text-slate-900 shadow-xl shadow-slate-200/50' :
        'bg-slate-900 border-slate-800 text-white shadow-xl shadow-slate-900/20'
    }`}>
        <div className="absolute right-0 bottom-0 opacity-10 -mr-6 -mb-6 group-hover:scale-110 transition-transform">
            <Icon size={140} />
        </div>
        <div className="relative z-10">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-6 ${
                color === 'indigo' ? 'bg-white/20 text-white' :
                color === 'rose' ? 'bg-rose-50 text-rose-600' :
                'bg-emerald-500/20 text-emerald-400'
            }`}>
               <Icon size={24} />
            </div>
            <p className={`text-[11px] font-black uppercase tracking-[0.2em] mb-2 ${
                color === 'indigo' ? 'text-indigo-200' : 'text-slate-400'
            }`}>{label}</p>
            <h3 className="text-4xl font-black tracking-tight">{value} <span className="text-sm font-medium opacity-60">Days</span></h3>
        </div>
    </div>
);

const statusActions = (lv, activeTab, handleAction) => {
    if (activeTab === 'team' && lv.status === 'Pending') {
        return (
            <div className="flex gap-2">
                <button 
                    onClick={() => handleAction(lv.id, 'Approved')}
                    className="px-4 py-2 bg-emerald-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-700 transition-all flex items-center gap-2"
                >
                    <ArrowUpRight size={14} /> Commit
                </button>
                <button 
                    onClick={() => handleAction(lv.id, 'Rejected')}
                    className="px-4 py-2 bg-white border border-rose-100 text-rose-600 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-rose-50 transition-all"
                >
                    Reject
                </button>
            </div>
        );
    }
    return null;
};

export default LeaveTracker;
