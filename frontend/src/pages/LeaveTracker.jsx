import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { 
  Calendar, 
  Plus, 
  Search, 
  Filter, 
  ChevronRight, 
  MoreHorizontal,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const LeaveTracker = () => {
    const [leaves, setLeaves] = useState([]);
    const [showApplyModal, setShowApplyModal] = useState(false);
    const [leaveForm, setLeaveForm] = useState({ startDate: '', endDate: '', reason: '' });
    const [loading, setLoading] = useState(false);

    const fetchLeaves = async () => {
        try {
            const { data } = await api.get('/leave/my');
            setLeaves(data);
        } catch (error) {
            console.error('Error fetching leaves', error);
        }
    };

    useEffect(() => {
        fetchLeaves();
    }, []);

    const handleApplyLeave = async (e) => {
        e.preventDefault();
        try {
            setLoading(true);
            await api.post('/leave/apply', leaveForm);
            setShowApplyModal(false);
            setLeaveForm({ startDate: '', endDate: '', reason: '' });
            fetchLeaves();
        } catch (error) {
            alert(error.response?.data?.message || 'Error applying leave');
        } finally {
            setLoading(false);
        }
    };

    const getStatusStyle = (status) => {
        switch (status) {
            case 'Approved':
                return 'bg-emerald-50 text-emerald-700 border-emerald-100';
            case 'Rejected':
                return 'bg-red-50 text-red-700 border-red-100';
            default:
                return 'bg-amber-50 text-amber-700 border-amber-100';
        }
    };

    const getStatusIcon = (status) => {
        switch (status) {
            case 'Approved':
                return <CheckCircle2 size={14} />;
            case 'Rejected':
                return <XCircle size={14} />;
            default:
                return <Clock size={14} />;
        }
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-700">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white p-8 rounded-[40px] border border-slate-100 shadow-xl shadow-slate-200/50">
                <div className="flex items-center gap-5">
                    <div className="w-16 h-16 bg-purple-50 rounded-3xl flex items-center justify-center text-purple-600 border-2 border-purple-100">
                        <Calendar size={32} />
                    </div>
                    <div>
                        <h1 className="text-3xl font-black text-slate-900 tracking-tight">Leave Tracker</h1>
                        <p className="text-slate-500 font-medium">Manage your time off and track application status.</p>
                    </div>
                </div>
                <button 
                    onClick={() => setShowApplyModal(true)}
                    className="px-8 py-4 bg-indigo-600 text-white rounded-2xl font-black hover:bg-indigo-700 active:scale-95 transition-all flex items-center gap-3 shadow-2xl shadow-indigo-100 group"
                >
                    <Plus size={20} />
                    <span>Apply for Leave</span>
                </button>
            </div>

            {/* Content Card */}
            <div className="bg-white rounded-[40px] border border-slate-100 shadow-xl shadow-slate-200/50 overflow-hidden">
                <div className="p-8 border-b border-slate-50 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="relative group flex-1 max-w-md">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors" size={18} />
                        <input 
                            type="text" 
                            placeholder="Search applications..." 
                            className="w-full pl-12 pr-4 py-3 bg-slate-50 border-2 border-transparent rounded-2xl text-slate-900 font-bold focus:border-indigo-600 focus:bg-white transition-all outline-none"
                        />
                    </div>
                    <div className="flex items-center gap-3">
                        <button className="p-3 bg-slate-50 text-slate-500 rounded-2xl border-2 border-transparent hover:border-slate-200 hover:text-slate-900 transition-all flex items-center gap-2 font-bold text-sm px-5">
                            <Filter size={18} />
                            Filter
                        </button>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-slate-50/50">
                                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Application Date</th>
                                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Duration</th>
                                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Reason</th>
                                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Status</th>
                                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-center">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {leaves.length > 0 ? leaves.map((lv, idx) => (
                                <tr key={lv.id || idx} className="hover:bg-slate-50/50 transition-colors group">
                                    <td className="px-8 py-6">
                                        <p className="text-sm font-bold text-slate-900">{new Date(lv.createdAt || Date.now()).toLocaleDateString()}</p>
                                    </td>
                                    <td className="px-8 py-6">
                                        <div className="flex items-center gap-2">
                                            <span className="text-sm font-black text-slate-900">{lv.startDate}</span>
                                            <span className="text-slate-300">→</span>
                                            <span className="text-sm font-black text-slate-900">{lv.endDate}</span>
                                        </div>
                                    </td>
                                    <td className="px-8 py-6">
                                        <p className="text-sm font-medium text-slate-500 max-w-xs truncate">{lv.reason}</p>
                                    </td>
                                    <td className="px-8 py-6">
                                        <div className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full border text-[11px] font-black uppercase tracking-wider ${getStatusStyle(lv.status)}`}>
                                            {getStatusIcon(lv.status)}
                                            {lv.status}
                                        </div>
                                    </td>
                                    <td className="px-8 py-6 text-center">
                                        <button className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all">
                                            <MoreHorizontal size={20} />
                                        </button>
                                    </td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan="5" className="px-8 py-20 text-center">
                                        <div className="flex flex-col items-center gap-4">
                                            <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center text-slate-300">
                                                <Calendar size={40} />
                                            </div>
                                            <div>
                                                <p className="text-lg font-black text-slate-900">No applications found</p>
                                                <p className="text-slate-400 font-medium text-sm">You haven't applied for any leaves yet.</p>
                                            </div>
                                            <button 
                                                onClick={() => setShowApplyModal(true)}
                                                className="mt-4 text-indigo-600 font-black text-sm flex items-center gap-2 hover:gap-3 transition-all"
                                            >
                                                Apply now <ChevronRight size={18} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                <div className="p-8 bg-slate-50/50 border-t border-slate-50">
                    <div className="flex items-center justify-between">
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Showing {leaves.length} Applications</p>
                        <div className="flex items-center gap-2">
                            <button className="p-2.5 bg-white border border-slate-200 rounded-xl text-slate-400 hover:text-slate-900 disabled:opacity-50" disabled>Previous</button>
                            <button className="p-2.5 bg-white border border-slate-200 rounded-xl text-slate-400 hover:text-slate-900 disabled:opacity-50" disabled>Next</button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Apply Modal */}
            <Modal isOpen={showApplyModal} onClose={() => setShowApplyModal(false)} title="New Leave Application">
                <form onSubmit={handleApplyLeave} className="space-y-8">
                    <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Start Date</label>
                            <input 
                                type="date" 
                                value={leaveForm.startDate} 
                                onChange={e => setLeaveForm({...leaveForm, startDate: e.target.value})} 
                                className="w-full p-4.5 bg-slate-50 border-2 border-transparent rounded-2xl text-slate-900 font-bold focus:border-indigo-600 focus:bg-white transition-all outline-none" 
                                required 
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">End Date</label>
                            <input 
                                type="date" 
                                value={leaveForm.endDate} 
                                onChange={e => setLeaveForm({...leaveForm, endDate: e.target.value})} 
                                className="w-full p-4.5 bg-slate-50 border-2 border-transparent rounded-2xl text-slate-900 font-bold focus:border-indigo-600 focus:bg-white transition-all outline-none" 
                                required 
                            />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Reason for Absence</label>
                        <textarea 
                            value={leaveForm.reason} 
                            onChange={e => setLeaveForm({...leaveForm, reason: e.target.value})} 
                            className="w-full p-4.5 bg-slate-50 border-2 border-transparent rounded-2xl text-slate-900 font-bold focus:border-indigo-600 focus:bg-white transition-all outline-none h-40 resize-none" 
                            placeholder="Describe your reason for leave..." 
                            required 
                        />
                    </div>
                    
                    <div className="p-5 bg-indigo-50/50 rounded-3xl border border-indigo-100 flex items-start gap-4">
                        <AlertCircle size={20} className="text-indigo-600 shrink-0 mt-0.5" />
                        <p className="text-[11px] font-bold text-indigo-700 leading-relaxed">
                            Your application will be sent to your manager for approval. You will receive a notification once it's reviewed.
                        </p>
                    </div>

                    <div className="flex gap-4">
                        <button 
                            type="button"
                            onClick={() => setShowApplyModal(false)}
                            className="flex-1 py-4.5 px-8 rounded-2xl font-black text-slate-500 hover:bg-slate-100 transition-all"
                        >
                            Cancel
                        </button>
                        <button 
                            type="submit" 
                            disabled={loading}
                            className="flex-[2] py-4.5 px-8 bg-indigo-600 text-white rounded-2xl font-black hover:bg-indigo-700 active:scale-95 transition-all shadow-xl shadow-indigo-100 flex items-center justify-center gap-3 disabled:opacity-70 group"
                        >
                             {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <span>Submit Application</span>}
                             <ChevronRight size={20} className="group-hover:translate-x-1 transition-transform" />
                        </button>
                    </div>
                </form>
            </Modal>
        </div>
    );
};

const Modal = ({ isOpen, onClose, title, children }) => (
    <AnimatePresence>
        {isOpen && (
            <div className="fixed inset-0 z-[60] flex items-center justify-center p-6">
                <motion.div 
                    initial={{ opacity: 0 }} 
                    animate={{ opacity: 1 }} 
                    exit={{ opacity: 0 }} 
                    onClick={onClose} 
                    className="absolute inset-0 bg-slate-900/40 backdrop-blur-md" 
                />
                <motion.div 
                    initial={{ opacity: 0, scale: 0.95, y: 30 }} 
                    animate={{ opacity: 1, scale: 1, y: 0 }} 
                    exit={{ opacity: 0, scale: 0.95, y: 30 }} 
                    transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                    className="bg-white w-full max-w-2xl rounded-[40px] p-12 relative z-10 shadow-2xl overflow-hidden border border-white"
                >
                    <div className="flex items-center justify-between mb-10">
                        <h3 className="text-3xl font-black text-slate-900 tracking-tight">{title}</h3>
                        <button onClick={onClose} className="p-3 hover:bg-slate-100 rounded-2xl text-slate-400 hover:text-slate-900 transition-all font-black text-2xl">&times;</button>
                    </div>
                    {children}
                </motion.div>
            </div>
        )}
    </AnimatePresence>
);

export default LeaveTracker;
