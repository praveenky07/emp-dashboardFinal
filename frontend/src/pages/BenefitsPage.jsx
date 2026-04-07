import React, { useState, useEffect } from 'react';
import api from '../services/api';
import DetailModal from '../components/DetailModal';
import { handleError } from '../utils/handleError';

import { 
    Gift, 
    ArrowRight, 
    Zap, 
    Info, 
    Briefcase,
    ShieldPlus,
    Plus,
    CheckCircle2,
    Clock
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const BenefitsPage = () => {
    const [plans, setPlans] = useState([]);
    const [myBenefits, setMyBenefits] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showEnrollModal, setShowEnrollModal] = useState(false);
    const [selectedPlan, setSelectedPlan] = useState(null);
    const [enrollAmount, setEnrollAmount] = useState(0);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [plansRes, myRes] = await Promise.all([
                api.get('/benefits/plans'),
                api.get('/benefits/my')
            ]);
            setPlans(Array.isArray(plansRes.data) ? plansRes.data : []);
            setMyBenefits(Array.isArray(myRes.data) ? myRes.data : []);
            console.log('Benefits Loaded:', { plans: plansRes.data, my: myRes.data });
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleEnroll = async (e) => {
        e.preventDefault();
        try {
            await api.post('/benefits/enroll', { benefit_id: selectedPlan.id, amount: enrollAmount });
            setShowEnrollModal(false);
            fetchData();
        } catch (err) { handleError(err); }

    };

    if (loading) return <div className="flex items-center justify-center min-h-[60vh]"><div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" /></div>;

    return (
        <div className="space-y-10 animate-in fade-in duration-700">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                   <h1 className="text-4xl font-black text-slate-900 tracking-tight">Flexi Benefit Plan</h1>
                   <p className="text-slate-500 font-medium tracking-tight">Customize your compensation package with tax-deductible benefits.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                {/* Active Benefits Section */}
                <div className="xl:col-span-2 space-y-8">
                    <section className="bg-white p-10 rounded-[40px] border border-slate-100 shadow-xl shadow-slate-200/50 overflow-hidden relative group">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-50/50 rounded-full blur-3xl -mr-32 -mt-32 transition-transform group-hover:scale-110" />
                        <h2 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-3 relative z-10 mb-10">
                            <ShieldPlus className="text-indigo-600" size={24} />
                            Your Current Elections
                        </h2>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative z-10">
                            {myBenefits.map((benefit) => (
                                <div key={benefit.id} className="p-8 bg-slate-50 border border-slate-100 rounded-[32px] hover:border-indigo-600 transition-all flex flex-col justify-between">
                                    <div className="flex justify-between items-start mb-6">
                                        <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center text-indigo-600 shadow-sm border border-slate-100">
                                            <Gift size={28} />
                                        </div>
                                        <span className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-[10px] font-black uppercase tracking-widest">{benefit.status}</span>
                                    </div>
                                    <h4 className="text-xl font-black text-slate-900">{benefit.name}</h4>
                                    <p className="text-xs text-slate-500 font-medium mt-1 mb-6 truncate">{benefit.description}</p>
                                    <div className="pt-6 border-t border-slate-200/60 flex items-center justify-between">
                                         <div>
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Enrolled Amount</p>
                                            <p className="text-lg font-black text-slate-900">${benefit.amount.toLocaleString()}</p>
                                         </div>
                                         <CheckCircle2 className="text-emerald-500" size={20} />
                                    </div>
                                </div>
                            ))}
                        </div>
                         {myBenefits.length === 0 && <p className="text-center py-20 text-slate-400 font-bold uppercase tracking-widest border-2 border-dashed border-slate-100 rounded-[32px] relative z-10">No benefits elected for this year</p>}
                    </section>

                    <section className="bg-white p-10 rounded-[40px] border border-slate-100 shadow-xl shadow-slate-200/50">
                        <h2 className="text-2xl font-black text-slate-900 tracking-tight mb-8">Available Benefit Plans</h2>
                        <div className="space-y-4">
                            {plans.map((plan) => (
                                <div key={plan.id} className="p-8 bg-slate-50 border border-slate-100 rounded-[32px] flex flex-col md:flex-row md:items-center justify-between gap-6 group hover:border-indigo-600 transition-all">
                                    <div className="flex items-center gap-6">
                                         <div className="w-16 h-16 bg-white rounded-3xl flex items-center justify-center text-indigo-600 shadow-sm border border-slate-50 transition-colors">
                                            <Briefcase size={28} />
                                         </div>
                                         <div>
                                             <h4 className="text-xl font-black text-slate-900">{plan.name}</h4>
                                             <p className="text-sm font-medium text-slate-400 max-w-sm">{plan.description}</p>
                                         </div>
                                    </div>
                                    <div className="flex items-center gap-6">
                                        <div className="text-right">
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Max Limit</p>
                                            <p className="text-xl font-black text-slate-900">${plan.max_limit.toLocaleString()}</p>
                                        </div>
                                        <button 
                                            onClick={() => { setSelectedPlan(plan); setShowEnrollModal(true); setEnrollAmount(plan.max_limit)}}
                                            disabled={myBenefits.some(b => b.benefit_id === plan.id)}
                                            className="p-4 bg-indigo-600 text-white rounded-2xl hover:bg-slate-900 transition-all shadow-lg shadow-indigo-100 disabled:bg-slate-200 disabled:shadow-none"
                                        >
                                            {myBenefits.some(b => b.benefit_id === plan.id) ? 'Enrolled' : <Plus size={22} />}
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>
                </div>

                {/* Info Card */}
                <div className="space-y-8">
                    <section className="bg-indigo-600 p-10 rounded-[40px] text-white shadow-2xl relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-32 -mt-32 transition-transform group-hover:scale-110" />
                        <h2 className="text-2xl font-black mb-8 flex items-center gap-3 relative z-10">
                            <Info className="text-white" size={24} />
                            Policy Rules
                        </h2>
                        <ul className="space-y-6 relative z-10">
                            <li className="flex gap-4">
                                <Zap className="text-indigo-300 mt-1 shrink-0" size={18} />
                                <p className="text-sm font-bold text-indigo-50 leading-relaxed">Changes can only be made during the annual enrollment window (April 1-15).</p>
                            </li>
                            <li className="flex gap-4">
                                <Zap className="text-indigo-300 mt-1 shrink-0" size={18} />
                                <p className="text-sm font-bold text-indigo-50 leading-relaxed">Proof of expense is required to claim reimbursement under tax-free brackets.</p>
                            </li>
                            <li className="flex gap-4">
                                <Zap className="text-indigo-300 mt-1 shrink-0" size={18} />
                                <p className="text-sm font-bold text-indigo-50 leading-relaxed">The total benefit amount is deducted from the gross salary package.</p>
                            </li>
                        </ul>
                    </section>

                    <div className="bg-amber-50 p-8 rounded-[40px] border border-amber-100 flex items-center gap-6">
                        <Clock size={32} className="text-amber-600" />
                        <div>
                             <p className="text-[10px] font-black text-amber-600 uppercase tracking-widest mb-1">Window Status</p>
                             <p className="font-black text-slate-900 leading-tight">Enrollment window opens in 6 days.</p>
                        </div>
                    </div>
                </div>
            </div>

            <DetailModal isOpen={showEnrollModal} onClose={() => setShowEnrollModal(false)} title={`Enroll in ${selectedPlan?.name}`}>
                 <form onSubmit={handleEnroll} className="space-y-8">
                    <div className="p-8 bg-slate-50 rounded-3xl border border-slate-100 flex items-center gap-6">
                         <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center text-indigo-600 shadow-sm border border-slate-50 transition-colors">
                            <Briefcase size={28} />
                         </div>
                         <div>
                             <h4 className="text-xl font-black text-slate-900">{selectedPlan?.name}</h4>
                             <p className="text-sm font-medium text-slate-400">Section limit applies per annual tax policy.</p>
                         </div>
                    </div>
                     <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Proposed Annual Amount</label>
                        <div className="relative">
                            <span className="absolute left-6 top-1/2 -translate-y-1/2 font-black text-2xl text-slate-300">$</span>
                            <input 
                                type="number" 
                                value={enrollAmount}
                                max={selectedPlan?.max_limit}
                                onChange={e => setEnrollAmount(e.target.value)}
                                className="w-full pl-12 pr-6 py-6 bg-slate-50 border-2 border-transparent rounded-3xl text-3xl font-black text-slate-900 focus:border-indigo-600 focus:bg-white transition-all outline-none" 
                                placeholder="0"
                                required 
                            />
                        </div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-3 ml-1">Maximum Eligible: ${selectedPlan?.max_limit.toLocaleString()}</p>
                    </div>
                    
                    <button type="submit" className="w-full bg-slate-900 text-white p-6 rounded-[32px] font-black hover:bg-black transition-all flex items-center justify-center gap-3">
                        Confirm Enrollment
                        <ArrowRight size={22} />
                    </button>
                 </form>
            </DetailModal>
        </div>
    );
};

export default BenefitsPage;
