import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

const DetailModal = ({ isOpen, onClose, title, children }) => {
    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-6">
                    <motion.div 
                        initial={{ opacity: 0 }} 
                        animate={{ opacity: 1 }} 
                        exit={{ opacity: 0 }} 
                        onClick={onClose} 
                        className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" 
                    />
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.9, y: 40 }} 
                        animate={{ opacity: 1, scale: 1, y: 0 }} 
                        exit={{ opacity: 0, scale: 0.9, y: 40 }} 
                        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                        className="bg-white w-full max-w-2xl lg:max-w-4xl rounded-[40px] p-8 md:p-12 relative z-10 shadow-2xl overflow-hidden border border-white max-h-[90vh] flex flex-col"
                    >
                        <div className="flex items-center justify-between mb-8 shrink-0">
                            <div>
                                <h3 className="text-3xl font-black text-slate-900 tracking-tight">{title}</h3>
                                <div className="h-1.5 w-12 bg-indigo-600 rounded-full mt-2" />
                            </div>
                            <button onClick={onClose} className="p-4 hover:bg-slate-100 rounded-2xl text-slate-400 hover:text-slate-900 transition-all">
                                <X size={24} />
                            </button>
                        </div>
                        <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
                            {children}
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

export default DetailModal;
