import React, { useState, useEffect } from 'react';
import api from '../services/api';
import socket from '../services/socket';
import { handleError } from '../utils/handleError';

import { 
  Calendar, 
  Plus, 
  Search, 
  ChevronRight, 
  MoreHorizontal,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import DetailModal from '../components/DetailModal';
import LeaveForm from '../components/LeaveForm';

const LeaveTracker = () => {
    const [leaves, setLeaves] = useState([]);
    const [teamLeaves, setTeamLeaves] = useState([]);
    const getUser = () => {
        try {
            const userData = localStorage.getItem('user');
            return userData ? JSON.parse(userData) : {};
        } catch (err) {
            console.error('Safe parse error in LeaveTracker', err);
            return {};
        }
    };
    const user = getUser();
    const [activeTab, setActiveTab] = useState(['manager', 'admin'].includes(user.role?.toLowerCase()) ? 'team' : 'my');
    const [showApplyModal, setShowApplyModal] = useState(false);
    const [balances, setBalances] = useState({ total_leaves: 0, used_leaves: 0, remaining_leaves: 0 });
    const [loading, setLoading] = useState(false);
    const isManager = ['manager', 'admin'].includes(user.role?.toLowerCase());

    const fetchLeaves = async () => {
        try {
            const { data } = await api.get('/leave/my');
            setLeaves(data);
        } catch (error) {
            console.error('Error fetching leaves', error);
        }
    };

    const fetchBalances = async () => {
        try {
            const { data } = await api.get('/leave/balance/my');
            setBalances(data);
        } catch (error) {
            console.error('Error fetching balances', error);
        }
    };

    const fetchTeamLeaves = async () => {
        try {
            const { data } = await api.get('/leave/team');
            setTeamLeaves(data);
        } catch (error) {
            console.error('Error fetching team leaves', error);
        }
    };

    useEffect(() => {
        fetchLeaves();
        fetchBalances();
        if (isManager) fetchTeamLeaves();

        const handleRemoteUpdate = (data) => {
            // Check if it involves the user or they are managers
            if (isManager || data?.userId === user.id) {
                fetchLeaves();
                fetchBalances();
                if (isManager) fetchTeamLeaves();
            }
        };

        socket.on('leaveRequested', handleRemoteUpdate);
        socket.on('leaveApproved', handleRemoteUpdate);
        socket.on('leaveRejected', handleRemoteUpdate);

        return () => {
            socket.off('leaveRequested', handleRemoteUpdate);
            socket.off('leaveApproved', handleRemoteUpdate);
            socket.off('leaveRejected', handleRemoteUpdate);
        };
    }, [isManager]);

    const onLeaveApplySuccess = () => {
        setShowApplyModal(false);
        fetchLeaves();
        fetchBalances();
    };

    const handleUpdateStatus = async (id, status) => {
        try {
            setLoading(true);
            await api.put('/leave/update-status', { id, status });
            fetchTeamLeaves();
            fetchLeaves();
            fetchBalances();
        } catch (error) {
            handleError(error);
        } finally {

            setLoading(false);
        }
    }

    const getStatusStyle = (status) => {
        switch (status) {
            case 'Approved':
                return 'bg-emerald-50 text-emerald-700 border-emerald-100';
            case 'Rejected':
                return 'bg-red-50 text-red-700 border-red-100';
            case 'Cancelled':
                return 'bg-slate-50 text-slate-500 border-slate-100';
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
            case 'Cancelled':
                return <AlertCircle size={14} />;
            default:
                return <Clock size={14} />;
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-700">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white p-8 rounded-[24px] border border-[#e5e7eb] shadow-sm">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-purple-50 rounded-xl flex items-center justify-center text-purple-600 border border-purple-100 shadow-sm">
                        <Calendar size={24} />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-[#111827] tracking-tight">Time-Off Protocol</h1>
                        <p className="text-[#6b7280] text-sm font-medium">Coordinate absence cycles and operational bandwidth.</p>
                    </div>
                </div>
                <div className="flex gap-4">
                    {isManager && (
                        <div className="flex p-1 bg-slate-100 rounded-xl">
                            <button 
                                onClick={() => setActiveTab('my')}
                                className={`px-5 py-2 rounded-lg font-bold text-xs transition-all ${activeTab === 'my' ? 'bg-white text-indigo-600 shadow-sm' : 'text-[#6b7280] hover:text-[#111827]'}`}
                            >
                                Personal
                            </button>
                            <button 
                                onClick={() => setActiveTab('team')}
                                className={`px-5 py-2 rounded-lg font-bold text-xs transition-all ${activeTab === 'team' ? 'bg-white text-indigo-600 shadow-sm' : 'text-[#6b7280] hover:text-[#111827]'}`}
                            >
                                Team Operations
                            </button>
                        </div>
                    )}
                    {user.role?.toLowerCase() === 'employee' && (
                        <button 
                            onClick={() => setShowApplyModal(true)}
                            className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 active:scale-[0.98] transition-all flex items-center gap-2 shadow-md shadow-indigo-100"
                        >
                            <Plus size={18} />
                            Log Absence
                        </button>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[
                    { label: 'Annual Entitlement', key: 'total_leaves', color: 'bg-indigo-50 text-indigo-600 border-indigo-100', icon: Calendar },
                    { label: 'Utilized Days', key: 'used_leaves', color: 'bg-rose-50 text-rose-600 border-rose-100', icon: Clock },
                    { label: 'Operational Reserve', key: 'remaining_leaves', color: 'bg-emerald-50 text-emerald-600 border-emerald-100', icon: CheckCircle2 }
                ].map(item => (
                    <div key={item.key} className={`p-6 rounded-[24px] border ${item.color} shadow-sm flex items-center justify-between group hover:border-indigo-600 transition-all`}>
                        <div>
                            <p className="text-[11px] font-bold uppercase tracking-wider opacity-70 mb-1">{item.label}</p>
                            <h3 className="text-2xl font-bold tracking-tight">{balances[item.key] || 0} Days</h3>
                        </div>
                        <item.icon size={28} className="opacity-20 group-hover:opacity-100 transition-opacity" />
                    </div>
                ))}
            </div>

            {/* Content Card */}
            <div className="bg-white rounded-[24px] border border-[#e5e7eb] shadow-sm overflow-hidden">
                <div className="p-6 border-b border-[#f3f4f6] flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <h2 className="text-lg font-bold text-[#111827]">
                        {activeTab === 'my' ? 'Submission History' : 'Organizational Pipeline'}
                    </h2>
                    <div className="relative group flex-1 max-w-sm">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9ca3af] group-focus-within:text-indigo-600 transition-colors" size={16} />
                        <input 
                            type="text" 
                            placeholder="Find records..." 
                            className="w-full pl-10 pr-4 py-2 bg-[#fcfdfe] border border-[#e5e7eb] rounded-xl text-sm font-medium focus:border-indigo-500 transition-all outline-none"
                        />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-[#fcfdfe]">
                                {activeTab === 'team' && <th className="px-8 py-4 text-[11px] font-bold text-[#6b7280] uppercase tracking-wider">Stakeholder</th>}
                                <th className="px-8 py-4 text-[11px] font-bold text-[#6b7280] uppercase tracking-wider">Applied</th>
                                <th className="px-8 py-4 text-[11px] font-bold text-[#6b7280] uppercase tracking-wider">Classification</th>
                                <th className="px-8 py-4 text-[11px] font-bold text-[#6b7280] uppercase tracking-wider">Timeline</th>
                                <th className="px-8 py-4 text-[11px] font-bold text-[#6b7280] uppercase tracking-wider">Justification</th>
                                <th className="px-8 py-4 text-[11px] font-bold text-[#6b7280] uppercase tracking-wider">Phase</th>
                                <th className="px-8 py-4 text-[11px] font-bold text-[#6b7280] uppercase tracking-wider text-center">Protocol</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[#f3f4f6]">
                            {(activeTab === 'my' ? leaves : teamLeaves).length > 0 ? (activeTab === 'my' ? leaves : teamLeaves).map((lv, idx) => (
                                <tr key={lv.id || idx} className="hover:bg-[#fcfdfe] transition-colors group">
                                    {activeTab === 'team' && (
                                        <td className="px-8 py-5">
                                            <p className="text-sm font-bold text-[#111827]">{lv.user_name}</p>
                                        </td>
                                    )}
                                    <td className="px-8 py-5">
                                        <p className="text-sm font-medium text-[#374151]">{new Date(lv.created_at || Date.now()).toLocaleDateString()}</p>
                                    </td>
                                    <td className="px-8 py-5">
                                        <p className="text-[10px] font-bold text-[#6b7280] bg-slate-50 border border-[#e5e7eb] px-2 py-0.5 rounded-full inline-block">{lv.type || 'Casual'}</p>
                                    </td>
                                    <td className="px-8 py-5">
                                        <div className="flex items-center gap-2 text-xs font-bold text-[#111827]">
                                            <span>{lv.start_date}</span>
                                            <ChevronRight size={12} className="text-[#9ca3af]" />
                                            <span>{lv.end_date}</span>
                                        </div>
                                    </td>
                                    <td className="px-8 py-5">
                                        <p className="text-xs font-medium text-[#6b7280] max-w-[180px] truncate">{lv.reason}</p>
                                    </td>
                                    <td className="px-8 py-5">
                                        <div className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full border text-[10px] font-bold uppercase tracking-wider ${getStatusStyle(lv.status)}`}>
                                            {getStatusIcon(lv.status)}
                                            {lv.status}
                                        </div>
                                    </td>
                                    <td className="px-8 py-5 text-center">
                                        <div className="flex items-center justify-center gap-2">
                                            {activeTab === 'my' && lv.status === 'Pending' && (
                                                <button 
                                                    onClick={async () => {
                                                        if(window.confirm('Cancel application?')) {
                                                            try {
                                                                setLoading(true);
                                                                await api.post(`/leave/cancel/${lv.id}`);
                                                                fetchLeaves();
                                                            } catch (error) {
                                                                handleError(error);
                                                            } finally {

                                                                setLoading(false);
                                                            }
                                                        }
                                                    }}
                                                    className="p-2 text-rose-500 hover:bg-rose-50 rounded-lg transition-all"
                                                >
                                                    <XCircle size={16} />
                                                </button>
                                            )}
                                            {activeTab === 'team' && lv.status === 'Pending' && (
                                                <div className="flex gap-1">
                                                    <button 
                                                        onClick={() => handleUpdateStatus(lv.id, 'Approved')}
                                                        className="p-2 text-emerald-500 hover:bg-emerald-50 rounded-lg transition-all"
                                                    >
                                                        <CheckCircle2 size={16} />
                                                    </button>
                                                    <button 
                                                        onClick={() => handleUpdateStatus(lv.id, 'Rejected')}
                                                        className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-all"
                                                    >
                                                        <XCircle size={16} />
                                                    </button>
                                                </div>
                                            )}
                                            <button className="p-2 text-[#9ca3af] hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all">
                                                <MoreHorizontal size={18} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan={activeTab === 'team' ? "7" : "6"} className="px-8 py-20 text-center">
                                        <div className="flex flex-col items-center gap-3">
                                            <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center text-[#9ca3af]">
                                                <Calendar size={24} />
                                            </div>
                                            <p className="text-sm font-bold text-[#111827]">Inbox clear</p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                <div className="p-6 bg-[#fcfdfe] border-t border-[#f3f4f6] flex items-center justify-between">
                    <p className="text-[10px] font-bold text-[#9ca3af] uppercase tracking-wider">Total Cycle Entries: {(activeTab === 'my' ? leaves : teamLeaves).length}</p>
                    <div className="flex items-center gap-2">
                        <button className="px-3 py-1.5 bg-white border border-[#e5e7eb] rounded-lg text-xs font-bold text-[#6b7280] disabled:opacity-50" disabled>PREV</button>
                        <button className="px-3 py-1.5 bg-white border border-[#e5e7eb] rounded-lg text-xs font-bold text-[#6b7280] disabled:opacity-50" disabled>NEXT</button>
                    </div>
                </div>
            </div>

            <DetailModal 
                isOpen={showApplyModal} 
                onClose={() => setShowApplyModal(false)}
                title="Log New Absence"
            >
                <div className="p-2">
                    <LeaveForm 
                        onSuccess={onLeaveApplySuccess} 
                        onCancel={() => setShowApplyModal(false)} 
                    />
                </div>
            </DetailModal>
        </div>
    );
};

export default LeaveTracker;
