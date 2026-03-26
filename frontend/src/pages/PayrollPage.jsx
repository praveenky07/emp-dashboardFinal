import React, { useState, useEffect } from 'react';
import api from '../services/api';
import DetailModal from '../components/DetailModal';
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
    History
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const PayrollPage = () => {
    const [payslips, setPayslips] = useState([]);
    const [declarations, setDeclarations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showTaxModal, setShowTaxModal] = useState(false);
    const [taxForm, setTaxForm] = useState({
        financial_year: '2025-26',
        section_80c: 0,
        section_80d: 0,
        house_rent: 0,
        other_investments: 0
    });

    const fetchData = async () => {
        try {
            setLoading(true);
            const [payslipsRes, taxRes] = await Promise.all([
                api.get('/payroll/my'),
                api.get('/tax/my')
            ]);
            setPayslips(payslipsRes.data || []);
            setDeclarations(taxRes.data || []);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleTaxSubmit = async (e) => {
        e.preventDefault();
        try {
            await api.post('/tax/submit', taxForm);
            setShowTaxModal(false);
            fetchData();
        } catch (err) {
            alert('Failed to submit tax declaration');
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
            link.setAttribute('download', `Payslip_${slip.month}_${slip.year}.pdf`);
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (err) {
            console.error('Download failed', err);
            alert('Failed to download PDF payslip');
        }
    };

    if (loading) return <div className="flex items-center justify-center min-h-[60vh]"><div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" /></div>;

    return (
        <div className="space-y-10 animate-in fade-in duration-700">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                   <h1 className="text-4xl font-black text-slate-900 tracking-tight">Financial Portal</h1>
                   <p className="text-slate-500 font-medium tracking-tight">Manage your earnings, tax declarations, and fiscal compliance.</p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="px-5 py-3 bg-emerald-50 border border-emerald-100 rounded-2xl flex items-center gap-3">
                         <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                         <span className="text-[10px] font-black text-emerald-700 uppercase tracking-widest">Next Payday: April 1st</span>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                {/* Payslips Section */}
                <div className="xl:col-span-2 space-y-8">
                    <section className="bg-white p-10 rounded-[40px] border border-slate-100 shadow-xl shadow-slate-200/50">
                        <div className="flex items-center justify-between mb-10">
                            <h2 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                                <Wallet className="text-indigo-600" size={24} />
                                Recent Payslips
                            </h2>
                            <button className="text-indigo-600 font-black text-[10px] uppercase tracking-widest bg-indigo-50 px-4 py-2 rounded-full hover:bg-indigo-100 transition-all">View Full History</button>
                        </div>

                        <div className="space-y-4">
                            {payslips.map((slip) => (
                                <div key={slip.id} className="p-8 rounded-[32px] bg-slate-50 border border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-6 hover:border-indigo-600 transition-all group">
                                    <div className="flex items-center gap-6">
                                        <div className="w-16 h-16 bg-white rounded-3xl flex items-center justify-center text-indigo-600 shadow-sm border border-slate-50 group-hover:bg-indigo-600 group-hover:text-white transition-all">
                                            <FileText size={28} />
                                        </div>
                                        <div>
                                            <h4 className="text-xl font-black text-slate-900">{slip.month} {slip.year}</h4>
                                            <div className="flex items-center gap-3 mt-1 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                                <span>Ref: PAY-{slip.id}-00{slip.month[0]}</span>
                                                <span className="w-1 h-1 rounded-full bg-slate-300" />
                                                <span className="text-emerald-600">{slip.status}</span>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <div className="flex items-center gap-8">
                                        <div className="text-right">
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Net Salary</p>
                                            <p className="text-2xl font-black text-slate-900">${slip.net_salary.toLocaleString()}</p>
                                        </div>
                                        <button onClick={() => handleDownloadPayslip(slip)} className="p-4 bg-white border border-slate-100 rounded-2xl text-slate-400 hover:text-indigo-600 hover:border-indigo-600 transition-all shadow-sm">
                                            <Download size={22} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                            {payslips.length === 0 && <p className="text-center py-20 text-slate-400 font-bold uppercase tracking-widest border-2 border-dashed border-slate-100 rounded-[32px]">No payslips issued yet</p>}
                        </div>
                    </section>

                    <section className="bg-slate-900 p-10 rounded-[40px] text-white shadow-2xl relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full -mr-32 -mt-32 blur-3xl" />
                        <h2 className="text-2xl font-black mb-10 flex items-center gap-3 relative z-10">
                            <TrendingUp className="text-indigo-400" size={24} />
                            Annual Earnings Summary
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative z-10">
                            <SummaryItem label="Gross Earnings" value="$60,000" color="text-white" />
                            <SummaryItem label="Total Deductions" value="$6,200" color="text-red-400" />
                            <SummaryItem label="Net Invoiced" value="$53,800" color="text-emerald-400" />
                        </div>
                    </section>
                </div>

                {/* Tax Section */}
                <div className="space-y-8">
                    <section className="bg-white p-10 rounded-[40px] border border-slate-100 shadow-xl shadow-slate-200/50">
                        <div className="flex items-center justify-between mb-8">
                             <h2 className="text-xl font-black text-slate-900 flex items-center gap-3">
                                <ShieldCheck className="text-indigo-600" size={22} />
                                Tax Compliance
                             </h2>
                             <button 
                                onClick={() => setShowTaxModal(true)}
                                className="w-10 h-10 bg-indigo-50 border border-indigo-100 rounded-xl flex items-center justify-center text-indigo-600 hover:bg-indigo-600 hover:text-white transition-all shadow-sm"
                             >
                                <Plus size={20} />
                             </button>
                        </div>

                        <div className="space-y-4">
                            {declarations.map(tax => (
                                <div key={tax.id} className="p-6 bg-slate-50 border border-slate-100 rounded-3xl group hover:border-indigo-600 transition-all">
                                    <div className="flex justify-between items-center mb-3">
                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">FY {tax.financial_year}</span>
                                        <span className={`px-2 py-1 rounded-full text-[8px] font-black uppercase tracking-widest border ${
                                            tax.status === 'Approved' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-amber-50 text-amber-600 border-amber-100'
                                        }`}>{tax.status}</span>
                                    </div>
                                    <h4 className="font-black text-slate-900 mb-1">Declaration Submitted</h4>
                                    <p className="text-xs text-slate-500 font-medium">Sec. 80C: ${tax.section_80c.toLocaleString()}</p>
                                    <div className="mt-4 pt-4 border-t border-slate-200/60 flex items-center justify-between">
                                         <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Audit ID: {tax.id}X</span>
                                         <ChevronRight size={14} className="text-slate-300 group-hover:text-indigo-600" />
                                    </div>
                                </div>
                            ))}
                            {declarations.length === 0 && <p className="text-center py-10 text-slate-400 font-bold uppercase tracking-widest text-[10px]">No declarations found</p>}
                        </div>
                    </section>

                    <div className="bg-indigo-50 p-8 rounded-[40px] border border-indigo-100">
                        <div className="flex items-center gap-4 mb-4">
                            <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-indigo-600 shadow-sm">
                                <AlertCircle size={24} />
                            </div>
                            <h4 className="font-black text-slate-900 leading-tight">Tax Planning Reminder</h4>
                        </div>
                        <p className="text-xs text-indigo-800 leading-relaxed font-bold">
                            Ensure all investment proofs for Q4 are uploaded by <span className="underline decoration-2 decoration-indigo-300">March 31st</span> to avoid excess tax deductions in your next payslip.
                        </p>
                    </div>
                </div>
            </div>

            <DetailModal isOpen={showTaxModal} onClose={() => setShowTaxModal(false)} title="Tax Investment Declaration">
                <form onSubmit={handleTaxSubmit} className="space-y-6">
                     <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5 col-span-2">
                             <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Financial Year</label>
                             <select value={taxForm.financial_year} onChange={e => setTaxForm({...taxForm, financial_year: e.target.value})} className="w-full p-4.5 bg-slate-50 border-2 border-transparent rounded-2xl font-bold focus:border-indigo-600 outline-none">
                                <option value="2025-26">2025-26</option>
                                <option value="2024-25">2024-25</option>
                             </select>
                        </div>
                        <div className="space-y-1.5">
                             <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Section 80C (PPF/LIC/SIP)</label>
                             <input type="number" value={taxForm.section_80c} onChange={e => setTaxForm({...taxForm, section_80c: e.target.value})} className="w-full p-4.5 bg-slate-50 border-2 border-transparent rounded-2xl font-bold focus:border-indigo-600 outline-none" placeholder="0" />
                        </div>
                        <div className="space-y-1.5">
                             <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Section 80D (Health)</label>
                             <input type="number" value={taxForm.section_80d} onChange={e => setTaxForm({...taxForm, section_80d: e.target.value})} className="w-full p-4.5 bg-slate-50 border-2 border-transparent rounded-2xl font-bold focus:border-indigo-600 outline-none" placeholder="0" />
                        </div>
                        <div className="space-y-1.5">
                             <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">House Rent Allowance</label>
                             <input type="number" value={taxForm.house_rent} onChange={e => setTaxForm({...taxForm, house_rent: e.target.value})} className="w-full p-4.5 bg-slate-50 border-2 border-transparent rounded-2xl font-bold focus:border-indigo-600 outline-none" placeholder="0" />
                        </div>
                         <div className="space-y-1.5">
                             <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Other Investments</label>
                             <input type="number" value={taxForm.other_investments} onChange={e => setTaxForm({...taxForm, other_investments: e.target.value})} className="w-full p-4.5 bg-slate-50 border-2 border-transparent rounded-2xl font-bold focus:border-indigo-600 outline-none" placeholder="0" />
                        </div>
                    </div>
                    <button type="submit" className="w-full bg-slate-900 text-white p-5 rounded-3xl font-black hover:bg-black transition-all flex items-center justify-center gap-3 group shadow-xl">
                        Submit Declaration
                        <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                    </button>
                </form>
            </DetailModal>
        </div>
    );
};

const SummaryItem = ({ label, value, color }) => (
    <div className="p-6 bg-white/5 border border-white/10 rounded-3xl">
        <p className="text-[9px] font-black text-indigo-300 uppercase tracking-widest mb-2">{label}</p>
        <p className={`text-2xl font-black ${color}`}>{value}</p>
    </div>
);

export default PayrollPage;
