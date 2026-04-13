import React, { useState, useEffect } from 'react';
import api from '../services/api';
import DetailModal from '../components/DetailModal';
import { handleError } from '../utils/handleError';

import { 
    Wallet, 
    FileText, 
    Download, 
    Plus, 
    ArrowRight, 
    ChevronRight, 
    TrendingUp, 
    ShieldCheck, 
    AlertCircle,
    Calendar,
    Coins,
    History,
    Users,
    Settings,
    CheckCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const PayrollPage = () => {
    const user = JSON.parse(localStorage.getItem('user')) || {};
    const isAdmin = user.role === 'admin' || user.role === 'hr';

    const [payslips, setPayslips] = useState([]);
    const [declarations, setDeclarations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [employees, setEmployees] = useState([]);

    // Admin state
    const [allPayslips, setAllPayslips] = useState([]);
    const [showGenModal, setShowGenModal] = useState(false);
    const [genLoading, setGenLoading] = useState(false);
    const [genForm, setGenForm] = useState({ user_id: '', month: new Date().toISOString().slice(0,7) });
    const [viewMode, setViewMode] = useState('my'); // 'my' or 'all'

    // Totals
    const [totals, setTotals] = useState({ gross: 0, deductions: 0, net: 0, unpaidDays: 0 });

    const fetchData = async () => {
        try {
            setLoading(true);
            const [myRes, taxRes] = await Promise.all([
                api.get('/payroll/my'),
                api.get('/tax/my')
            ]);
            
            const myPayslips = myRes.data || [];
            setPayslips(myPayslips);
            setDeclarations(taxRes.data || []);

            // Calculate totals for Overview Card
            let gross = 0, ded = 0, net = 0, udp = 0;
            myPayslips.forEach(p => {
                gross += (p.gross_salary || 0);
                ded += (p.deduction || 0) + (p.tax || 0);
                net += (p.final_salary || 0);
                udp += (p.unpaid_days || 0);
            });
            setTotals({ gross, deductions: ded, net, unpaidDays: udp });

            if (isAdmin) {
                const [allRes, empRes] = await Promise.all([
                    api.get('/payroll/all'),
                    api.get('/users?role=employee')
                ]);
                setAllPayslips(allRes.data || []);
                setEmployees(empRes.data || []);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleGeneratePayroll = async (e) => {
        e.preventDefault();
        try {
            setGenLoading(true);
            const res = await api.post('/payroll/generate', genForm);
            alert('Payroll Generated successfully!');
            setShowGenModal(false);
            fetchData();
        } catch (err) { 
            if(err.response?.status === 400 && err.response?.data?.error === 'Salary structure not defined for this user.') {
                alert('Warning: User does not have a formal salary structure set! Set it up first.');
            } else {
                handleError(err); 
            }
        } finally {
            setGenLoading(false);
        }
    };

    const handleDownloadPayslip = async (slip) => {
        try {
            const response = await api.get(`/payroll/download/${slip.id}`, {
                responseType: 'blob'
            });
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `Payslip_${slip.month}.pdf`);
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (err) {
            handleError(err);
        }
    };

    if (loading) return <div className="flex items-center justify-center min-h-[60vh]"><div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" /></div>;

    const displayPayslips = viewMode === 'all' ? allPayslips : payslips;

    return (
        <div className="space-y-10 animate-in fade-in duration-700">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                   <h1 className="text-4xl font-black text-slate-900 tracking-tight">Corporate Payroll</h1>
                   <p className="text-slate-500 font-medium tracking-tight">Manage earnings, tax compliance, and automated payslips.</p>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                    {isAdmin && (
                        <div className="flex bg-slate-100 p-1 rounded-2xl mr-4 border border-slate-200">
                            <button onClick={() => setViewMode('my')} className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${viewMode === 'my' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>My Payroll</button>
                            <button onClick={() => setViewMode('all')} className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${viewMode === 'all' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>All Team</button>
                        </div>
                    )}
                    {isAdmin && (
                        <button onClick={() => setShowGenModal(true)} className="px-5 py-3 bg-indigo-600 text-white rounded-2xl font-black uppercase tracking-widest text-[11px] shadow-lg shadow-indigo-200 flex items-center gap-2 hover:bg-indigo-700 hover:scale-105 transition-all">
                            <Plus size={16} /> Generate Payroll
                        </button>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
                {/* Payslips Section */}
                <div className="xl:col-span-3 space-y-8">

                    {viewMode === 'my' && (
                    <section className="bg-slate-900 p-10 rounded-[40px] text-white shadow-2xl relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full -mr-32 -mt-32 blur-3xl" />
                        <h2 className="text-2xl font-black mb-10 flex items-center gap-3 relative z-10">
                            <TrendingUp className="text-indigo-400" size={24} />
                            Annual Earnings Summary
                        </h2>
                        <div className="flex flex-wrap gap-4 md:grid md:grid-cols-4 md:gap-8 relative z-10 w-full">
                            <SummaryItem label="Gross Earnings" value={`₹${totals.gross.toLocaleString('en-IN')}`} color="text-white" />
                            <SummaryItem label="Total Deductions" value={`₹${totals.deductions.toLocaleString('en-IN')}`} color="text-red-400" />
                            <SummaryItem label="Net Paid" value={`₹${totals.net.toLocaleString('en-IN')}`} color="text-emerald-400" />
                            {totals.unpaidDays > 0 ? (
                                <SummaryItem label="Unpaid Leave Days" value={totals.unpaidDays} color="text-amber-400" />
                            ) : (
                                <div className="p-6 bg-white/5 border border-white/10 rounded-3xl flex items-center justify-center flex-1 min-w-[140px]">
                                    <ShieldCheck className="text-emerald-400 mb-2 mr-2" />
                                    <p className="text-[11px] font-black text-emerald-400 uppercase tracking-widest leading-tight">Perfect<br/>Attendance</p>
                                </div>
                            )}
                        </div>
                    </section>
                    )}

                    <section className="bg-white p-10 rounded-[40px] border border-slate-100 shadow-xl shadow-slate-200/50">
                        <div className="flex items-center justify-between mb-10">
                            <h2 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                                <Wallet className="text-indigo-600" size={24} />
                                {viewMode === 'all' ? 'Organization Payroll History' : 'My Salary Breakdown & History'}
                            </h2>
                        </div>

                        <div className="overflow-x-auto custom-scrollbar pr-2 max-h-[600px]">
                            <table className="w-full text-left min-w-[800px]">
                                <thead>
                                    <tr className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">
                                        <th className="pb-4 px-4 sticky top-0 bg-white">Month</th>
                                        {viewMode === 'all' && <th className="pb-4 px-4 sticky top-0 bg-white">Employee</th>}
                                        <th className="pb-4 px-4 sticky top-0 bg-white text-right">Gross Salary</th>
                                        <th className="pb-4 px-4 sticky top-0 bg-white text-right">Deductions</th>
                                        <th className="pb-4 px-4 sticky top-0 bg-white text-right">Net Pay</th>
                                        <th className="pb-4 px-4 sticky top-0 bg-white text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {displayPayslips.map((slip) => (
                                        <tr key={slip.id} className="text-sm font-bold text-slate-600 hover:bg-slate-50/50 transition-colors group">
                                            <td className="py-5 px-4 text-slate-900 border-l-[3px] border-transparent group-hover:border-indigo-600 flex items-center gap-3">
                                                <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center">
                                                    <Calendar size={18} />
                                                </div>
                                                <div>
                                                    <p className="font-black text-slate-900">{slip.month}</p>
                                                    {slip.unpaid_days > 0 ? (
                                                        <p className="text-[9px] font-black text-red-500 uppercase tracking-widest mt-1"><AlertCircle size={10} className="inline mr-1" />{slip.unpaid_days} LOP</p>
                                                    ) : (
                                                        <p className="text-[9px] font-black text-emerald-500 uppercase tracking-widest mt-1"><CheckCircle size={10} className="inline mr-1" />PROCESSED</p>
                                                    )}
                                                </div>
                                            </td>
                                            {viewMode === 'all' && <td className="py-5 px-4 text-indigo-600 font-black">{slip.user_name}</td>}
                                            <td className="py-5 px-4 text-right">₹{slip.gross_salary?.toLocaleString('en-IN')}</td>
                                            <td className="py-5 px-4 text-right text-red-500">-₹{((slip.deduction || 0) + (slip.tax || 0)).toLocaleString('en-IN')}</td>
                                            <td className="py-5 px-4 text-right text-emerald-600 font-black text-lg">₹{slip.final_salary?.toLocaleString('en-IN')}</td>
                                            <td className="py-5 px-4 text-right">
                                                <button onClick={() => handleDownloadPayslip(slip)} className="p-3 bg-white border border-slate-100 rounded-xl text-slate-400 hover:bg-indigo-600 hover:text-white hover:border-indigo-600 transition-all shadow-sm">
                                                    <Download size={18} />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                    {displayPayslips.length === 0 && (
                                        <tr>
                                            <td colSpan={viewMode === 'all' ? 6 : 5} className="py-20 text-center">
                                                <div className="inline-flex flex-col flex-center items-center justify-center p-8 border-2 border-dashed border-slate-200 rounded-[32px]">
                                                    <Wallet size={40} className="text-slate-300 mb-4" />
                                                    <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">No payroll history found for this month.</p>
                                                    {isAdmin ? (
                                                        <div className="mt-4">
                                                            <p className="text-slate-400 font-bold text-[10px] mb-4">Initialize the payroll engine to see real data.</p>
                                                            <button onClick={() => setShowGenModal(true)} className="px-6 py-2 bg-indigo-600 text-white rounded-xl font-bold text-xs">Generate Now</button>
                                                        </div>
                                                    ) : (
                                                        <p className="text-slate-400 font-bold text-[10px] mt-2">Payroll is usually processed at the end of every month. Please check back later.</p>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </section>
                </div>

                {/* Info / Audit Side */}
                <div className="xl:col-span-1 space-y-8">
                    <div className="bg-indigo-50 p-8 rounded-[40px] border border-indigo-100 shadow-xl shadow-indigo-100/50 relative overflow-hidden group">
                        <div className="absolute -right-4 -bottom-4 opacity-10 group-hover:scale-110 transition-transform"><Coins size={120} /></div>
                        <div className="flex items-center gap-4 mb-4 relative z-10">
                            <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-indigo-600 shadow-sm">
                                <AlertCircle size={24} />
                            </div>
                            <h4 className="font-black text-slate-900 leading-tight">Payroll Guidelines</h4>
                        </div>
                        <p className="text-xs text-indigo-800 leading-relaxed font-bold relative z-10">
                            Payroll processing is contingent strictly on approved attendances and filed leaves. Unpaid Days (Absents without leave requests or Unpaid Leaves) will strictly incur algorithmic deductions according to the base rate.
                        </p>
                    </div>

                    <div className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-xl shadow-slate-200/50">
                        <h4 className="font-black text-slate-900 mb-6 flex items-center gap-3"><ShieldCheck className="text-indigo-600" /> Tax Compliance</h4>
                        <p className="text-[11px] uppercase font-black text-slate-400 tracking-widest mb-4">Current FY 2025-26 Status</p>
                        {declarations.length > 0 ? (
                            <div className="flex items-center gap-3 bg-emerald-50 text-emerald-700 p-4 rounded-3xl border border-emerald-100 font-black text-sm">
                                <CheckCircle /> Declarations Filed
                            </div>
                        ) : (
                            <div className="flex items-center justify-between bg-rose-50 text-rose-700 p-4 rounded-3xl border border-rose-100 font-black text-sm">
                                <div className="flex items-center gap-3"><AlertCircle /> Not Filed</div>
                            </div>
                        )}
                        <p className="text-xs text-slate-500 font-medium leading-relaxed mt-5">Please contact HR if you need to update your Sections 80C or 80D compliance documents.</p>
                    </div>
                </div>
            </div>

            {/* Admin Generate Payroll Modal */}
            <DetailModal isOpen={showGenModal} onClose={() => setShowGenModal(false)} title="Generate Corporate Payroll">
                <form onSubmit={handleGeneratePayroll} className="space-y-6">
                     <div className="space-y-6">
                        <div className="space-y-1.5 focus-within:text-indigo-600">
                             <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 transition-colors">Select Employee</label>
                             <select required value={genForm.user_id} onChange={e => setGenForm({...genForm, user_id: e.target.value})} className="w-full p-4.5 bg-slate-50 border-2 border-transparent rounded-2xl font-black text-slate-900 focus:border-indigo-600 focus:bg-white outline-none transition-all cursor-pointer">
                                <option value="" disabled>Select an employee</option>
                                {employees.map(emp => (
                                    <option key={emp.id} value={emp.id}>{emp.name}</option>
                                ))}
                             </select>
                        </div>
                        <div className="space-y-1.5 focus-within:text-indigo-600">
                             <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 transition-colors">Payroll Month</label>
                             <input required type="month" value={genForm.month} onChange={e => setGenForm({...genForm, month: e.target.value})} className="w-full p-4.5 bg-slate-50 border-2 border-transparent rounded-2xl font-black text-slate-900 focus:border-indigo-600 focus:bg-white outline-none transition-all" />
                        </div>
                        
                        <div className="p-5 bg-indigo-50 border border-indigo-100 rounded-3xl">
                            <p className="text-[11px] font-black text-indigo-700 uppercase tracking-widest mb-2 flex items-center gap-2"><Settings size={14} /> Automated Calculation Engine</p>
                            <p className="text-xs font-bold text-indigo-600/80 leading-relaxed">This action calculates unpaid attendances automatically and computes taxes based on standard limits. Ensure all leaves for the selected month are fully approved before processing.</p>
                        </div>
                    </div>
                    
                    <button disabled={genLoading} type="submit" className="w-full bg-slate-900 text-white p-5 rounded-3xl font-black hover:bg-black transition-all flex items-center justify-center gap-3 group shadow-xl z-20 relative disabled:opacity-50 disabled:cursor-not-allowed mt-4">
                        {genLoading ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : 'Run Payroll Engine'}
                    </button>
                </form>
            </DetailModal>
        </div>
    );
};

const SummaryItem = ({ label, value, color }) => (
    <div className="p-6 bg-white/5 border border-white/10 rounded-3xl flex flex-col justify-center transform hover:scale-105 hover:bg-white/10 transition-all cursor-default flex-1 min-w-[200px]">
        <p className="text-[9px] font-black text-indigo-200 uppercase tracking-widest mb-3 opacity-80 whitespace-nowrap">{label}</p>
        <p className={`text-xl md:text-2xl font-black truncate ${color}`}>{value}</p>
    </div>
);

export default PayrollPage;
