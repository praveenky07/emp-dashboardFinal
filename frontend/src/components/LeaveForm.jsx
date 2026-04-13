import React, { useState } from 'react';
import api from '../services/api';
import { ChevronRight, CalendarCheck, AlertCircle, Clock } from 'lucide-react';

const LeaveForm = ({ onSuccess, onCancel }) => {
    const [loading, setLoading] = useState(false);
    const [leave, setLeave] = useState({ 
        startDate: new Date().toISOString().split('T')[0], 
        endDate: new Date().toISOString().split('T')[0], 
        reason: '', 
        type: 'Casual',
        isHalfDay: false
    });

    const isPastDate = (date) => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return new Date(date) < today;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (isPastDate(leave.startDate)) {
            alert('Cannot apply for leave on past dates.');
            return;
        }

        if (!leave.startDate || !leave.endDate || !leave.reason) {
            alert('Please fill in all required fields.');
            return;
        }

        try {
            setLoading(true);
            await api.post('/leave/apply', leave);
            if (onSuccess) onSuccess();
        } catch (error) {
            alert(error.response?.data?.error || 'Error applying leave');
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-8 pb-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Leave Type</label>
                    <select 
                        value={leave.type} 
                        onChange={e => setLeave({...leave, type: e.target.value})} 
                        className="w-full p-4 bg-slate-50 border-2 border-transparent rounded-2xl text-slate-900 font-bold focus:border-indigo-600 focus:bg-white transition-all outline-none appearance-none cursor-pointer"
                    >
                        <option value="Casual">Casual Leave</option>
                        <option value="Sick">Sick Leave</option>
                        <option value="Earned">Earned Leave (Paid)</option>
                        <option value="Unpaid">Unpaid Leave (LOP)</option>
                    </select>
                </div>
                <div className="flex items-center gap-3 pt-6 px-2">
                    <input 
                        type="checkbox" 
                        id="halfDay"
                        className="w-5 h-5 accent-indigo-600"
                        checked={leave.isHalfDay} 
                        onChange={e => setLeave({...leave, isHalfDay: e.target.checked, endDate: leave.startDate})} 
                    />
                    <label htmlFor="halfDay" className="text-sm font-bold text-slate-700 flex items-center gap-2 cursor-pointer">
                        <Clock size={16} className="text-indigo-600" /> Half Day Option
                    </label>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Start Date</label>
                    <input 
                        type="date" 
                        value={leave.startDate} 
                        onChange={e => setLeave({...leave, startDate: e.target.value, endDate: leave.isHalfDay ? e.target.value : leave.endDate})} 
                        className="w-full p-4 bg-slate-50 border-2 border-transparent rounded-2xl text-slate-900 font-bold focus:border-indigo-600 focus:bg-white transition-all outline-none" 
                        required 
                    />
                </div>
                {!leave.isHalfDay && (
                <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">End Date</label>
                    <input 
                        type="date" 
                        value={leave.endDate} 
                        onChange={e => setLeave({...leave, endDate: e.target.value})} 
                        className="w-full p-4 bg-slate-50 border-2 border-transparent rounded-2xl text-slate-900 font-bold focus:border-indigo-600 focus:bg-white transition-all outline-none" 
                        required 
                    />
                </div>
                )}
            </div>

            <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Reason for Absence</label>
                <textarea 
                    value={leave.reason} 
                    onChange={e => setLeave({...leave, reason: e.target.value})} 
                    className="w-full p-4 bg-slate-50 border-2 border-transparent rounded-2xl text-slate-900 font-bold focus:border-indigo-600 focus:bg-white transition-all outline-none h-32 resize-none" 
                    placeholder="Describe your reason for leave..." 
                    required 
                />
            </div>

            <div className="p-5 bg-indigo-50/50 rounded-3xl border border-indigo-100 flex items-start gap-4">
                <AlertCircle size={20} className="text-indigo-600 shrink-0 mt-0.5" />
                <p className="text-[11px] font-bold text-indigo-700 leading-relaxed">
                    Calculation excludes weekends and public holidays. Insufficient balance will automatically prompt for Unpaid Leave.
                </p>
            </div>

            <div className="flex gap-4 pt-6">
                <button type="button" onClick={onCancel} className="flex-1 py-4 font-black text-slate-500 hover:bg-slate-100 transition-all rounded-2xl">Cancel</button>
                <button 
                    type="submit" 
                    disabled={loading}
                    className="flex-[2] py-4 bg-indigo-600 text-white rounded-2xl font-black hover:bg-indigo-700 transition-all shadow-xl flex items-center justify-center gap-3 disabled:opacity-70 group"
                >
                    {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <span>Apply Leave</span>}
                    <ChevronRight size={20} className="group-hover:translate-x-1 transition-transform" />
                </button>
            </div>
        </form>
    );
};

export default LeaveForm;
