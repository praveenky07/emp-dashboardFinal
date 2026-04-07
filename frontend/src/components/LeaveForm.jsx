import React, { useState } from 'react';
import api from '../services/api';
import { ChevronRight, CalendarCheck, AlertCircle } from 'lucide-react';

const LeaveForm = ({ onSuccess, onCancel }) => {
    const [loading, setLoading] = useState(false);
    const [leave, setLeave] = useState({ 
        startDate: new Date().toISOString().split('T')[0], 
        endDate: new Date().toISOString().split('T')[0], 
        reason: '', 
        type: 'Casual' 
    });

    const handleSubmit = async (e) => {
        e.preventDefault();
        console.log('[DEBUG] Submitting leave request:', leave);
        
        if (!leave.startDate || !leave.endDate || !leave.reason) {
            alert('Please fill in all required fields.');
            return;
        }

        try {
            setLoading(true);
            const { data } = await api.post('/leave/apply', leave);
            console.log('[DEBUG] Leave application success:', data);
            
            if (onSuccess) onSuccess();
        } catch (error) {
            console.error('[DEBUG] Leave application failed:', error);
            alert(error.response?.data?.error || error.response?.data?.message || 'Error applying leave');
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-8 pb-10">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Start Date</label>
                    <input 
                        type="date" 
                        value={leave.startDate} 
                        onChange={e => setLeave({...leave, startDate: e.target.value})} 
                        className="w-full p-4.5 bg-slate-50 border-2 border-transparent rounded-2xl text-slate-900 font-bold focus:border-indigo-600 focus:bg-white transition-all outline-none" 
                        required 
                    />
                </div>
                <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">End Date</label>
                    <input 
                        type="date" 
                        value={leave.endDate} 
                        onChange={e => setLeave({...leave, endDate: e.target.value})} 
                        className="w-full p-4.5 bg-slate-50 border-2 border-transparent rounded-2xl text-slate-900 font-bold focus:border-indigo-600 focus:bg-white transition-all outline-none" 
                        required 
                    />
                </div>
            </div>

            <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Leave Type</label>
                <select 
                    value={leave.type} 
                    onChange={e => setLeave({...leave, type: e.target.value})} 
                    className="w-full p-4.5 bg-slate-50 border-2 border-transparent rounded-2xl text-slate-900 font-bold focus:border-indigo-600 focus:bg-white transition-all outline-none appearance-none cursor-pointer"
                >
                    <option value="Casual">Casual Leave</option>
                    <option value="Sick">Sick Leave</option>
                    <option value="Earned">Earned Leave</option>
                </select>
            </div>

            <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Reason for Absence</label>
                <textarea 
                    value={leave.reason} 
                    onChange={e => setLeave({...leave, reason: e.target.value})} 
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

            <div className="flex gap-4 sticky bottom-0 bg-white pt-6 pb-2 border-t border-slate-50 mt-10">
                <button 
                    type="button"
                    onClick={onCancel}
                    className="flex-1 py-4.5 px-8 rounded-2xl font-black text-slate-500 hover:bg-slate-100 transition-all cursor-pointer"
                >
                    Cancel
                </button>
                <button 
                    type="submit" 
                    disabled={loading}
                    className="flex-[2] py-4.5 px-8 bg-indigo-600 text-white rounded-2xl font-black hover:bg-indigo-700 active:scale-95 transition-all shadow-xl shadow-indigo-100 flex items-center justify-center gap-3 disabled:opacity-70 group cursor-pointer"
                >
                    {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <span>Submit Application</span>}
                    <ChevronRight size={20} className="group-hover:translate-x-1 transition-transform" />
                </button>
            </div>
        </form>
    );
};

export default LeaveForm;
