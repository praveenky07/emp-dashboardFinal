import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { Users, Filter, CheckCircle, Shield, Briefcase, Mail } from 'lucide-react';

const UserManagement = () => {
    const [users, setUsers] = useState([]);
    const [selectedRole, setSelectedRole] = useState('All');
    const [loading, setLoading] = useState(true);

    const roles = ['All', 'Admin', 'Manager', 'Employee', 'HR'];

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const url = selectedRole === 'All' ? '/users' : `/users?role=${selectedRole.toLowerCase()}`;
            const res = await api.get(url);
            setUsers(res.data);
        } catch (err) {
            console.error('Failed to fetch users', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, [selectedRole]);

    const getRoleParams = (roleStr) => {
        const r = (roleStr || 'Employee').toLowerCase();
        if (r === 'admin') return { color: 'bg-rose-50 text-rose-600 border-rose-100', icon: Shield, class: 'rose' };
        if (r === 'manager') return { color: 'bg-indigo-50 text-indigo-600 border-indigo-100', icon: Briefcase, class: 'indigo' };
        if (r === 'hr') return { color: 'bg-purple-50 text-purple-600 border-purple-100', icon: Filter, class: 'purple' };
        return { color: 'bg-emerald-50 text-emerald-600 border-emerald-100', icon: Users, class: 'emerald' };
    };

    return (
        <div className="space-y-10 animate-in fade-in duration-700">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-[#e5e7eb]">
                <div>
                    <h1 className="text-3xl font-bold text-[#111827] tracking-tight">User Management</h1>
                    <p className="text-[#6b7280] text-sm font-medium mt-1">Directory of all enterprise users with operational roles.</p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="relative">
                        <select 
                            value={selectedRole}
                            onChange={e => setSelectedRole(e.target.value)}
                            className="appearance-none pl-11 pr-10 py-2.5 bg-white border border-[#e5e7eb] rounded-xl font-bold text-[#374151] hover:border-indigo-600 focus:border-indigo-600 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all shadow-sm cursor-pointer"
                        >
                            {roles.map(r => <option key={r} value={r}>{r}</option>)}
                        </select>
                        <Filter size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                    </div>
                </div>
            </div>

            {loading ? (
                <div className="py-20 flex justify-center"><div className="w-12 h-12 border-4 border-t-indigo-600 border-indigo-100 rounded-full animate-spin"></div></div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {users.map(user => {
                        const rp = getRoleParams(user.role);
                        const RoleIcon = rp.icon;
                        return (
                            <div key={user.id} className="bg-white p-6 rounded-[24px] border border-[#e5e7eb] hover:border-indigo-500 hover:shadow-xl shadow-sm transition-all group overflow-hidden relative">
                                <div className={`absolute top-0 right-0 w-32 h-32 bg-${rp.class}-500/5 rounded-full -mr-16 -mt-16 blur-2xl transition-all group-hover:bg-${rp.class}-500/10`} />
                                
                                <div className="flex items-start justify-between mb-6">
                                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center font-black text-2xl shadow-sm border ${rp.color}`}>
                                        {user.profile_image ? (
                                            <img src={user.profile_image} alt={user.name} className="w-full h-full rounded-2xl object-cover" />
                                        ) : (
                                            user.name[0]?.toUpperCase()
                                        )}
                                    </div>
                                    <span className={`px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border flex items-center gap-1 ${rp.color}`}>
                                        <CheckCircle size={10} /> Active
                                    </span>
                                </div>
                                
                                <div>
                                    <h3 className="text-xl font-black text-[#111827] group-hover:text-indigo-600 transition-colors mb-1 truncate">{user.name}</h3>
                                    
                                    <div className="flex items-center gap-2 mt-3">
                                        <span className={`px-3 py-1 rounded bg-slate-50 text-slate-600 border border-slate-100 flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest`}>
                                            <RoleIcon size={12} /> {user.role || 'EMPLOYEE'}
                                        </span>
                                    </div>
                                </div>

                                <div className="mt-6 pt-6 border-t border-slate-50 flex items-center gap-2 text-slate-500 text-xs font-bold">
                                    <Mail size={14} />
                                    <span className="truncate">{user.email || 'No email provided'}</span>
                                </div>
                            </div>
                        )
                    })}
                    {users.length === 0 && (
                        <div className="col-span-full py-20 text-center bg-white rounded-[24px] border border-dashed border-[#e5e7eb]">
                            <Users size={48} className="mx-auto text-slate-300 mb-4" />
                            <h3 className="text-lg font-black text-slate-900">No users found</h3>
                            <p className="text-slate-500 text-sm font-medium mt-1">Try selecting a different role filter.</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default UserManagement;
