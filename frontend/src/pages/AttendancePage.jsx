import React, { useState, useEffect } from 'react';
import api from '../services/api';
import socket from '../services/socket';
import { 
  CalendarDays, 
  Search, 
  ArrowRight,
  Clock,
  Timer,
  TrendingUp,
  Loader2,
  Calendar
} from 'lucide-react';

const AttendancePage = () => {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [balances, setBalances] = useState({ present: 0, totalHours: 0, avgHours: 0 });

    const fetchLogs = async () => {
        try {
            setLoading(true);
            const { data } = await api.get('/attendance/my');
            setLogs(data || []);
            
            // Calculate stats
            if (data?.length > 0) {
                const totalHours = data.reduce((acc, l) => acc + Number(l.total_hours || 0), 0);
                setBalances({
                    present: data.filter(l => l.status === 'Present').length,
                    totalHours: totalHours.toFixed(1),
                    avgHours: (totalHours / data.length).toFixed(1)
                });
            }
        } catch (error) {
            console.error('Error fetching logs', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchLogs();

        const user = JSON.parse(localStorage.getItem('user') || '{}');
        const handleRemoteUpdate = (data) => {
            if (data?.userId === user.id) fetchLogs();
        };

        socket.on('attendanceUpdated', handleRemoteUpdate);
        socket.on('attendanceStarted', handleRemoteUpdate);
        socket.on('attendanceEnded', handleRemoteUpdate);

        return () => {
            socket.off('attendanceUpdated', handleRemoteUpdate);
            socket.off('attendanceStarted', handleRemoteUpdate);
            socket.off('attendanceEnded', handleRemoteUpdate);
        };
    }, []);

    const getStatusStyle = (status) => {
        if (status === 'Present') return 'bg-emerald-50 text-emerald-700 border-emerald-100';
        if (status === 'Half Day') return 'bg-amber-50 text-amber-700 border-amber-100';
        return 'bg-indigo-50 text-indigo-700 border-indigo-100 animate-pulse';
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-700">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white p-8 rounded-[24px] border border-[#e5e7eb] shadow-sm">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-600 border border-emerald-100 shadow-sm">
                        <CalendarDays size={24} />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-[#111827] tracking-tight">Attendance Ledger</h1>
                        <p className="text-[#6b7280] text-sm font-medium">Historical audit of your daily clock-in/out cycles.</p>
                    </div>
                </div>
                <div className="flex gap-4">
                    <button 
                        onClick={fetchLogs}
                        className="px-6 py-3 bg-[#111827] text-white rounded-xl font-bold hover:bg-black active:scale-[0.98] transition-all flex items-center gap-2 shadow-md shadow-slate-100 group"
                    >
                        <TrendingUp size={18} />
                        Sync History
                    </button>
                </div>
            </div>

            {/* Stats grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[
                    { label: 'Days Present', value: `${balances.present} / ${logs.length}`, color: 'text-indigo-600', icon: Calendar },
                    { label: 'Total Hours', value: `${balances.totalHours} hrs`, color: 'text-emerald-600', icon: Clock },
                    { label: 'Average Sync', value: `${balances.avgHours} hrs`, color: 'text-amber-600', icon: Timer }
                ].map((item, idx) => (
                    <div key={idx} className="bg-white p-6 rounded-[24px] border border-[#e5e7eb] shadow-sm flex items-center justify-between group hover:border-indigo-600 transition-all">
                        <div>
                            <p className="text-[11px] font-bold text-[#6b7280] uppercase tracking-wider mb-1">{item.label}</p>
                            <h3 className="text-2xl font-bold text-[#111827] tracking-tight">{item.value}</h3>
                        </div>
                        <div className={`w-12 h-12 bg-slate-50 rounded-xl flex items-center justify-center text-[#9ca3af] group-hover:bg-indigo-600 group-hover:text-white transition-all`}>
                            <item.icon size={24} />
                        </div>
                    </div>
                ))}
            </div>

            {/* Activity Table */}
            <div className="bg-white rounded-[24px] border border-[#e5e7eb] shadow-sm overflow-hidden">
                <div className="px-8 py-6 border-b border-[#f3f4f6]">
                    <h2 className="text-lg font-bold text-[#111827] tracking-tight">Shift Documentation</h2>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-[#fcfdfe]">
                                <th className="px-8 py-4 text-[11px] font-bold text-[#6b7280] uppercase tracking-wider border-b border-[#f3f4f6]">Date Cycle</th>
                                <th className="px-8 py-4 text-[11px] font-bold text-[#6b7280] uppercase tracking-wider border-b border-[#f3f4f6]">Commenced</th>
                                <th className="px-8 py-4 text-[11px] font-bold text-[#6b7280] uppercase tracking-wider border-b border-[#f3f4f6]">Concluded</th>
                                <th className="px-8 py-4 text-[11px] font-bold text-[#6b7280] uppercase tracking-wider border-b border-[#f3f4f6]">Duration</th>
                                <th className="px-8 py-4 text-[11px] font-bold text-[#6b7280] uppercase tracking-wider border-b border-[#f3f4f6] text-right">Metric Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[#f3f4f6]">
                            {loading ? (
                                <tr>
                                    <td colSpan="5" className="px-8 py-20 text-center">
                                        <Loader2 className="animate-spin text-indigo-600 mx-auto" size={40} />
                                    </td>
                                </tr>
                            ) : logs.length > 0 ? logs.map((log, index) => (
                                <tr key={log.id || index} className="hover:bg-[#fcfdfe] transition-colors">
                                    <td className="px-8 py-5 text-sm font-bold text-[#111827]">{log.date || 'N/A'}</td>
                                    <td className="px-8 py-5 text-sm font-medium text-[#374151]">{log.clock_in ? new Date(log.clock_in).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--'}</td>
                                    <td className="px-8 py-5 text-sm font-medium text-[#374151]">{log.clock_out ? new Date(log.clock_out).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--'}</td>
                                    <td className="px-8 py-5 text-sm font-bold text-indigo-600">{log.total_hours || '0.00'} hrs</td>
                                    <td className="px-8 py-5 text-right">
                                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${getStatusStyle(log.status)}`}>
                                            {log.status || (log.clock_out ? 'Present' : 'Active')}
                                        </span>
                                    </td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan="5" className="px-8 py-20 text-center text-[#9ca3af] font-bold uppercase tracking-wider text-xs">No records found</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default AttendancePage;
