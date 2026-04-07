import React from 'react';

const SnapshotCard = ({ icon: Icon, label, value, color, bgColor }) => {
    return (
        <div className={`bg-white p-6 rounded-3xl border border-slate-100 flex items-center gap-4 group hover:border-indigo-600 transition-all cursor-pointer w-full text-left`}>
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-colors group-hover:bg-indigo-600 group-hover:text-white shrink-0 ${bgColor} ${color}`}>
                <Icon size={28} />
            </div>
            <div className="min-w-0">
                <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest leading-none mb-1 truncate">{label}</p>
                <p className="text-lg font-black text-slate-900">{value} Days</p>
            </div>
        </div>
    );
};

export default SnapshotCard;
