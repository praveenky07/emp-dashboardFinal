import React, { useState, useEffect } from 'react';
import api from '../services/api';
import DetailModal from '../components/DetailModal';
import { handleError } from '../utils/handleError';

import { 
    LifeBuoy, 
    ArrowRight, 
    Clock, 
    Calendar, 
    AlertTriangle, 
    Plus,
    CheckCircle2,
    XCircle,
    MoreHorizontal
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const SupportPage = () => {
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [form, setForm] = useState({
        date: new Date().toISOString().split('T')[0],
        actual_in: '',
        actual_out: '',
        reason: ''
    });

    const fetchData = async () => {
        try {
            setLoading(true);
            const res = await api.get('/support/regularization/my');
            setRequests(res.data || []);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await api.post('/support/regularization/submit', form);
            setShowModal(false);
            fetchData();
        } catch (err) { handleError(err); }

    };

    const getStatusStyle = (status) => {
        switch (status) {
            case 'Approved': return 'bg-emerald-50 text-emerald-700 border-emerald-100';
            case 'Rejected': return 'bg-red-50 text-red-700 border-red-100';
            default: return 'bg-amber-50 text-amber-700 border-amber-100';
        }
    };

    if (loading) return <div className="flex items-center justify-center min-h-[60vh]"><div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" /></div>;

    return (
        <div className="space-y-10 animate-in fade-in duration-700">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white p-10 rounded-[40px] border border-slate-100 shadow-xl shadow-slate-200/50">
                <div className="flex items-center gap-6">
                    <div className="w-16 h-16 bg-blue-50 rounded-3xl flex items-center justify-center text-blue-600 border-2 border-blue-100">
                        <LifeBuoy size={32} />
                    </div>
                    <div>
                        <h1 className="text-3xl font-black text-slate-900 tracking-tight">Support Hub</h1>
                        <p className="text-slate-500 font-medium tracking-tight">Worktime regularization and attendance correction portal.</p>
                    </div>
                </div>
                <button 
                    onClick={() => setShowModal(true)}
                    className="px-8 py-4 bg-indigo-600 text-white rounded-2xl font-black hover:bg-indigo-700 active:scale-95 transition-all flex items-center gap-3 shadow-2xl shadow-indigo-100 group"
                >
                    <Plus size={20} />
                    <span>New Regularization</span>
                </button>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
                {/* Active Requests */}
                <div className="xl:col-span-3">
                    <section className="bg-white rounded-[40px] border border-slate-100 shadow-xl shadow-slate-200/50 overflow-hidden">
                        <div className="p-8 border-b border-slate-50 flex items-center justify-between">
                             <h2 className="text-xl font-black text-slate-900 flex items-center gap-3">
                                <Clock className="text-indigo-600" size={22} />
                                Regularization Status
                             </h2>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-slate-50/50">
                                    <tr className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                        <th className="px-8 py-6">Incident Date</th>
                                        <th className="px-8 py-6">Correction (In - Out)</th>
                                        <th className="px-8 py-6">Reason</th>
                                        <th className="px-8 py-6">Status</th>
                                        <th className="px-8 py-6 text-center">Audit</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {requests.map(req => (
                                        <tr key={req.id} className="hover:bg-slate-50/50 transition-colors group">
                                            <td className="px-8 py-6">
                                                <div className="flex items-center gap-3">
                                                    <Calendar size={16} className="text-slate-400" />
                                                    <p className="font-black text-slate-900">{req.date}</p>
                                                </div>
                                            </td>
                                            <td className="px-8 py-6">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-sm font-black text-slate-900 uppercase">{new Date(req.actual_in).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                                                    <span className="text-slate-300">→</span>
                                                    <span className="text-sm font-black text-slate-900 uppercase">{new Date(req.actual_out).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                                                </div>
                                            </td>
                                            <td className="px-8 py-6">
                                                <p className="text-sm font-medium text-slate-500 max-w-xs truncate">{req.reason}</p>
                                            </td>
                                            <td className="px-8 py-6">
                                                <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full border text-[9px] font-black uppercase tracking-widest ${getStatusStyle(req.status)}`}>
                                                    {req.status}
                                                </div>
                                            </td>
                                            <td className="px-8 py-6 text-center">
                                                <button className="p-2 text-slate-300 hover:text-indigo-600 transition-all font-black text-xs">VIEW</button>
                                            </td>
                                        </tr>
                                    ))}
                                    {requests.length === 0 && <tr><td colSpan="5" className="px-8 py-20 text-center font-bold text-slate-400 uppercase tracking-widest">No regularization history found</td></tr>}
                                </tbody>
                            </table>
                        </div>
                    </section>
                </div>

                {/* Sidebar Cards */}
                <div className="space-y-8">
                     <section className="bg-amber-50 p-8 rounded-[40px] border border-amber-100 flex flex-col items-center text-center">
                        <div className="w-16 h-16 bg-white rounded-3xl flex items-center justify-center text-amber-500 mb-6 border border-amber-100 shadow-sm">
                            <AlertTriangle size={28} />
                        </div>
                        <h4 className="text-lg font-black text-slate-900 mb-2">Policy Limitation</h4>
                        <p className="text-xs text-amber-700 leading-relaxed font-bold">
                            You can only regularize up to <span className="underline">3 incidents</span> per month. Excess corrections require manager approval via HR ticket.
                        </p>
                    </section>
                </div>
            </div>

            <DetailModal isOpen={showModal} onClose={() => setShowModal(false)} title="Attendance Regularization">
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-2">
                         <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Incident Date</label>
                         <input type="date" value={form.date} onChange={e => setForm({...form, date: e.target.value})} className="w-full p-4.5 bg-slate-50 border-2 border-transparent rounded-2xl font-bold focus:border-indigo-600 outline-none" required />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                             <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Actual Punch In</label>
                             <input 
                                type="time" 
                                value={form.actual_in ? form.actual_in.split('T')[1]?.substring(0, 5) : ''} 
                                onChange={e => setForm({...form, actual_in: `${form.date}T${e.target.value}:00`})} 
                                className="w-full p-4.5 bg-slate-50 border-2 border-transparent rounded-2xl font-bold focus:border-indigo-600 outline-none" 
                                required 
                             />
                        </div>
                        <div className="space-y-2">
                             <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Actual Punch Out</label>
                             <input 
                                type="time" 
                                value={form.actual_out ? form.actual_out.split('T')[1]?.substring(0, 5) : ''} 
                                onChange={e => setForm({...form, actual_out: `${form.date}T${e.target.value}:00`})} 
                                className="w-full p-4.5 bg-slate-50 border-2 border-transparent rounded-2xl font-bold focus:border-indigo-600 outline-none" 
                                required 
                             />
                        </div>
                    </div>
                    <div className="space-y-2">
                         <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Reason for Correction</label>
                         <textarea value={form.reason} onChange={e => setForm({...form, reason: e.target.value})} className="w-full p-4.5 bg-slate-50 border-2 border-transparent rounded-2xl font-bold focus:border-indigo-600 outline-none h-32 resize-none" placeholder="e.g. System glitch, forgot to punch out..." required />
                    </div>
                    <button type="submit" className="w-full bg-slate-900 border border-slate-700 text-white p-6 rounded-[32px] font-black hover:bg-black transition-all flex items-center justify-center gap-3">
                        Submit Correction Request
                        <ArrowRight size={22} />
                    </button>
                </form>
            </DetailModal>
        </div>
    );
};

export default SupportPage;
