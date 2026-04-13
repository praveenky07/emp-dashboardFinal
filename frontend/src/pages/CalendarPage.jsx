import React, { useState, useEffect } from 'react';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Plus, X, Edit2, Trash2, Loader2, CalendarDays } from 'lucide-react';
import api from '../services/api';
import socket from '../services/socket';
import { handleError, showToast } from '../utils/handleError';
import { useUser } from '../context/UserContext';
import DetailModal from '../components/DetailModal';

const CalendarPage = () => {
    const { user } = useUser();
    const [currentDate, setCurrentDate] = useState(new Date());
    const [attendance, setAttendance] = useState([]);
    const [holidays, setHolidays] = useState([]);
    const [loading, setLoading] = useState(true);
    
    // Admin Modal State
    const [isHolidayModalOpen, setIsHolidayModalOpen] = useState(false);
    const [holidayForm, setHolidayForm] = useState({ id: '', date: '', title: '', type: 'Company' });
    const [actionLoading, setActionLoading] = useState(false);

    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    const fetchData = async () => {
        setLoading(true);
        try {
            const [attRes, holRes] = await Promise.all([
                api.get('/attendance/my'),
                api.get('/holidays')
            ]);
            setAttendance(attRes.data || []);
            setHolidays(holRes.data || []);
        } catch (error) {
            handleError(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();

        const handleRemoteUpdate = () => fetchData();
        socket.on('attendanceUpdated', handleRemoteUpdate);
        socket.on('attendanceStarted', handleRemoteUpdate);
        socket.on('attendanceEnded', handleRemoteUpdate);

        return () => {
            socket.off('attendanceUpdated', handleRemoteUpdate);
            socket.off('attendanceStarted', handleRemoteUpdate);
            socket.off('attendanceEnded', handleRemoteUpdate);
        };
    }, []);

    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDayOfMonth = new Date(year, month, 1).getDay();

    const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
    const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));

    const handleHolidaySubmit = async (e) => {
        e.preventDefault();
        setActionLoading(true);
        try {
            if (holidayForm.id) {
                await api.put(`/holidays/${holidayForm.id}`, holidayForm);
                showToast('Holiday updated successfully');
            } else {
                await api.post('/holidays', holidayForm);
                showToast('Holiday added successfully');
            }
            setIsHolidayModalOpen(false);
            setHolidayForm({ id: '', date: '', title: '', type: 'Company' });
            fetchData();
        } catch (error) {
            handleError(error);
        } finally {
            setActionLoading(false);
        }
    };

    const handleDeleteHoliday = async (id) => {
        if (!window.confirm('Delete this holiday?')) return;
        try {
            await api.delete(`/holidays/${id}`);
            showToast('Holiday deleted');
            fetchData();
        } catch (error) {
            handleError(error);
        }
    };

    const isAdmin = user?.role?.toLowerCase() === 'admin';

    // Map data for easy lookup
    const attendanceMap = {};
    attendance.forEach(a => {
        if (a.date && a.status !== 'On Leave') {
            attendanceMap[a.date] = a; // Date string format: YYYY-MM-DD
        }
    });

    const holidayMap = {};
    holidays.forEach(h => {
        if (h.date) {
            holidayMap[h.date] = h;
        }
    });

    const getDayInfo = (dayNumber) => {
        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(dayNumber).padStart(2, '0')}`;
        const dayOfWeek = new Date(year, month, dayNumber).getDay();
        const isPast = new Date(year, month, dayNumber) < new Date(new Date().setHours(0,0,0,0));
        
        let type = 'working';
        let label = '';
        let data = null;

        if (dayOfWeek === 0 || dayOfWeek === 6) {
            type = 'weekend';
        } else if (holidayMap[dateStr]) {
            type = 'holiday';
            label = holidayMap[dateStr].title;
            data = holidayMap[dateStr];
        } else if (attendanceMap[dateStr]) {
            type = 'present';
        } else if (isPast) {
            type = 'absent';
        }

        return { type, label, data, dateStr };
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-700">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white p-8 rounded-[24px] border border-[#e5e7eb] shadow-sm">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600 border border-indigo-100 shadow-sm">
                        <CalendarIcon size={24} />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-[#111827] tracking-tight">Company Calendar</h1>
                        <p className="text-[#6b7280] text-sm font-medium">Holidays, weekends, and your attendance pattern.</p>
                    </div>
                </div>
                {isAdmin && (
                    <button 
                        onClick={() => {
                            setHolidayForm({ id: '', date: '', title: '', type: 'Company' });
                            setIsHolidayModalOpen(true);
                        }}
                        className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 active:scale-[0.98] transition-all flex items-center gap-2 shadow-md shadow-indigo-100"
                    >
                        <Plus size={18} /> Add Holiday
                    </button>
                )}
            </div>

            {loading ? (
                <div className="flex justify-center p-20">
                    <Loader2 className="animate-spin text-indigo-600" size={40} />
                </div>
            ) : (
                <div className="bg-white p-6 md:p-8 rounded-[24px] border border-[#e5e7eb] shadow-sm">
                    {/* Calendar Header */}
                    <div className="flex items-center justify-between mb-8">
                        <h2 className="text-xl font-black text-[#111827] uppercase tracking-wider">
                            {new Date(year, month).toLocaleString('default', { month: 'long' })} {year}
                        </h2>
                        <div className="flex gap-2">
                            <button onClick={prevMonth} className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-600 hover:bg-slate-100 transition-colors">
                                <ChevronLeft size={20} />
                            </button>
                            <button onClick={nextMonth} className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-600 hover:bg-slate-100 transition-colors">
                                <ChevronRight size={20} />
                            </button>
                        </div>
                    </div>

                    {/* Legend */}
                    <div className="flex flex-wrap gap-4 mb-6">
                        <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-emerald-500"></div><span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Present</span></div>
                        <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-rose-500"></div><span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Absent</span></div>
                        <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-blue-500"></div><span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Holiday</span></div>
                        <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-slate-300"></div><span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Weekend</span></div>
                    </div>

                    {/* Grid */}
                    <div className="grid grid-cols-7 gap-2 md:gap-4">
                        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
                            <div key={d} className="text-center text-[10px] md:text-xs font-black text-[#9ca3af] uppercase tracking-widest pb-4">
                                {d}
                            </div>
                        ))}

                        {Array.from({ length: firstDayOfMonth }).map((_, i) => (
                            <div key={`blank-${i}`} className="h-24 md:h-32 rounded-2xl bg-transparent border border-transparent"></div>
                        ))}

                        {Array.from({ length: daysInMonth }).map((_, i) => {
                            const dayNumber = i + 1;
                            const { type, label, data } = getDayInfo(dayNumber);
                            
                            let bgClass = "bg-white border-[#f3f4f6]";
                            let textClass = "text-[#111827]";
                            
                            if (type === 'weekend') {
                                bgClass = "bg-slate-50 border-slate-100";
                                textClass = "text-slate-400";
                            } else if (type === 'holiday') {
                                bgClass = "bg-blue-50 border-blue-200 shadow-sm";
                                textClass = "text-blue-700";
                            } else if (type === 'present') {
                                bgClass = "bg-emerald-50 border-emerald-200";
                                textClass = "text-emerald-700";
                            } else if (type === 'absent') {
                                bgClass = "bg-rose-50 border-rose-200";
                                textClass = "text-rose-700";
                            }

                            return (
                                <div key={dayNumber} className={`relative p-2 md:p-3 h-24 md:h-32 rounded-2xl border transition-all ${bgClass} group`}>
                                    <span className={`text-sm md:text-lg font-black ${textClass}`}>
                                        {dayNumber}
                                    </span>
                                    
                                    {type === 'holiday' && (
                                        <div className="mt-1 md:mt-2">
                                            <p className="text-[9px] md:text-[11px] font-bold leading-tight text-blue-600 truncate">{label}</p>
                                        </div>
                                    )}

                                    {type === 'present' && (
                                        <div className="mt-1 md:mt-2">
                                            <p className="text-[9px] md:text-[11px] font-bold leading-tight text-emerald-600 uppercase tracking-wider">Present</p>
                                        </div>
                                    )}

                                    {type === 'absent' && (
                                        <div className="mt-1 md:mt-2">
                                            <p className="text-[9px] md:text-[11px] font-bold leading-tight text-rose-600 uppercase tracking-wider">Absent</p>
                                        </div>
                                    )}

                                    {isAdmin && type === 'holiday' && data && (
                                        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 flex gap-1 transition-opacity">
                                            <button 
                                                onClick={() => {
                                                    setHolidayForm(data);
                                                    setIsHolidayModalOpen(true);
                                                }}
                                                className="w-5 h-5 bg-white rounded flex items-center justify-center text-blue-600 hover:bg-blue-100 shadow-sm"
                                            >
                                                <Edit2 size={10} />
                                            </button>
                                            <button 
                                                onClick={() => handleDeleteHoliday(data.id)}
                                                className="w-5 h-5 bg-white rounded flex items-center justify-center text-rose-600 hover:bg-rose-100 shadow-sm"
                                            >
                                                <Trash2 size={10} />
                                            </button>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Holiday Admin Modal */}
            <DetailModal isOpen={isHolidayModalOpen} onClose={() => setIsHolidayModalOpen(false)} title={holidayForm.id ? "Edit Holiday" : "Add Holiday"}>
                <form onSubmit={handleHolidaySubmit} className="space-y-4">
                    <div>
                        <label className="block text-[11px] font-bold text-[#6b7280] uppercase tracking-wider mb-2">Holiday Date</label>
                        <input 
                            type="date" 
                            required
                            value={holidayForm.date}
                            onChange={e => setHolidayForm({...holidayForm, date: e.target.value})}
                            className="w-full px-4 py-3 rounded-xl border border-[#e5e7eb] focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all font-medium text-[#111827] outline-none"
                        />
                    </div>
                    <div>
                        <label className="block text-[11px] font-bold text-[#6b7280] uppercase tracking-wider mb-2">Title</label>
                        <input 
                            type="text" 
                            required
                            placeholder="e.g. Independence Day"
                            value={holidayForm.title}
                            onChange={e => setHolidayForm({...holidayForm, title: e.target.value})}
                            className="w-full px-4 py-3 rounded-xl border border-[#e5e7eb] focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all font-medium text-[#111827] outline-none"
                        />
                    </div>
                    <div>
                        <label className="block text-[11px] font-bold text-[#6b7280] uppercase tracking-wider mb-2">Type</label>
                        <select 
                            value={holidayForm.type}
                            onChange={e => setHolidayForm({...holidayForm, type: e.target.value})}
                            className="w-full px-4 py-3 rounded-xl border border-[#e5e7eb] focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all font-medium text-[#111827] outline-none"
                        >
                            <option value="Public">Public</option>
                            <option value="Company">Company</option>
                            <option value="Optional">Optional</option>
                        </select>
                    </div>
                    <button 
                        type="submit" 
                        disabled={actionLoading}
                        className="w-full py-4 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 active:scale-[0.98] transition-all flex items-center justify-center gap-2 mt-6"
                    >
                        {actionLoading ? <Loader2 className="animate-spin" size={20} /> : (holidayForm.id ? 'Save Changes' : 'Create Holiday')}
                    </button>
                </form>
            </DetailModal>
        </div>
    );
};

export default CalendarPage;
