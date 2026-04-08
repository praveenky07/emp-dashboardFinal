import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { Shield, Search, Globe, Laptop, Clock, Filter, AlertCircle, History } from 'lucide-react';
import { motion } from 'framer-motion';
import { SkeletonLine } from '../components/Skeleton';

const AuditLogs = () => {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterAction, setFilterAction] = useState('all');

    useEffect(() => {
        fetchLogs();
    }, []);

    const fetchLogs = async () => {
        try {
            const { data } = await api.get('/admin/logs');
            setLogs(data);
        } catch (err) {
            console.error('Failed to fetch audit logs', err);
        } finally {
            setLoading(false);
        }
    };

    const filteredLogs = logs.filter(log => {
        const matchesSearch = 
            log.action?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            log.user_id?.toString().includes(searchTerm) ||
            JSON.stringify(log.metadata).toLowerCase().includes(searchTerm.toLowerCase());
        
        const matchesFilter = filterAction === 'all' || log.action === filterAction;
        
        return matchesSearch && matchesFilter;
    });

    const uniqueActions = ['all', ...new Set(logs.map(l => l.action))];

    if (loading) {
        return (
            <div className="space-y-6">
                <div className="h-20 skeleton rounded-[24px]" />
                <div className="premium-card p-0 overflow-hidden">
                    {[1,2,3,4,5].map(i => (
                        <div key={i} className="p-6 border-b border-slate-50 space-y-2">
                            <SkeletonLine className="w-1/4" />
                            <SkeletonLine className="w-full" />
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Header section with Stats */}
            <div className="bg-white p-8 rounded-[32px] border border-slate-200 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-indigo-100">
                            <Shield size={20} />
                        </div>
                        <h1 className="text-2xl font-black text-slate-900 tracking-tight">System Audit Trail</h1>
                    </div>
                    <p className="text-slate-400 text-sm font-bold uppercase tracking-widest">Forensic Activity Monitoring</p>
                </div>
                
                <div className="flex flex-wrap gap-4 w-full md:w-auto">
                    <div className="flex-1 md:flex-none relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <input 
                            type="text" 
                            placeholder="Search logs..." 
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-12 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl w-full md:w-64 outline-none focus:border-indigo-600 transition-all font-bold text-sm"
                        />
                    </div>
                    <div className="relative">
                        <Filter className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <select 
                            value={filterAction}
                            onChange={(e) => setFilterAction(e.target.value)}
                            className="pl-12 pr-10 py-3 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:border-indigo-600 transition-all font-black text-[10px] uppercase tracking-widest appearance-none cursor-pointer"
                        >
                            {uniqueActions.map(action => (
                                <option key={action} value={action}>{action}</option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>

            {/* Logs Table */}
            <div className="premium-card overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50/50">
                                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Event</th>
                                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Actor</th>
                                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Device Info</th>
                                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Metadata</th>
                                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Timestamp</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {filteredLogs.map((log) => (
                                <tr key={log.id} className="hover:bg-slate-50/50 transition-colors group">
                                    <td className="px-8 py-6">
                                        <div className="flex items-center gap-3">
                                            <span className={`w-2 h-2 rounded-full ${
                                                log.action === 'login' ? 'bg-emerald-500' :
                                                log.action === 'delete_user' ? 'bg-rose-500' :
                                                'bg-indigo-500'
                                            }`} />
                                            <span className="text-sm font-black text-slate-900 uppercase tracking-tight">{log.action}</span>
                                        </div>
                                    </td>
                                    <td className="px-8 py-6">
                                        <div className="flex flex-col">
                                            <span className="text-sm font-bold text-slate-700">User ID: #{log.user_id}</span>
                                        </div>
                                    </td>
                                    <td className="px-8 py-6">
                                        <div className="flex flex-col gap-1.5">
                                            <div className="flex items-center gap-2 text-[10px] font-black text-slate-400">
                                                <Globe size={12} /> {log.ip_address || 'Internal Network'}
                                            </div>
                                            <div className="flex items-center gap-2 text-[10px] font-black text-slate-400">
                                                <Laptop size={12} /> {log.user_agent ? (log.user_agent.length > 30 ? log.user_agent.substring(0, 30) + '...' : log.user_agent) : 'Unknown Device'}
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-8 py-6">
                                        <div className="max-w-xs truncate">
                                            <code className="text-[10px] font-bold bg-slate-100 text-slate-600 px-2 py-1 rounded inline-block">
                                                {JSON.stringify(log.metadata)}
                                            </code>
                                        </div>
                                    </td>
                                    <td className="px-8 py-6 text-right">
                                        <div className="flex flex-col items-end">
                                            <span className="text-sm font-black text-slate-900">{new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{new Date(log.timestamp).toLocaleDateString()}</span>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                {filteredLogs.length === 0 && (
                    <div className="py-24 text-center">
                        <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto text-slate-300 mb-4 border border-dashed border-slate-200">
                            <History size={32} />
                        </div>
                        <h3 className="text-lg font-black text-slate-900 tracking-tight">No events documented</h3>
                        <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mt-1">Adjust filters to broaden search range</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AuditLogs;
