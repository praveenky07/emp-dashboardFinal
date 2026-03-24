import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import api from '../services/api';
import { motion } from 'framer-motion';
import { Lock, Mail, Loader2, Zap, ArrowRight, AlertCircle, Info } from 'lucide-react';

const LoginPage = () => {
  const [email, setEmail] = useState('john@emp.com');
  const [password, setPassword] = useState('employee123');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const { data } = await api.post('/auth/login', { email, password });
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      const from = location.state?.from?.pathname || '/';
      navigate(from, { replace: true });
    } catch (err) {
      setError(err.response?.data?.error || err.response?.data?.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }

  };

  const setMock = (e, p) => {
    setEmail(e);
    setPassword(p);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC] relative overflow-hidden font-sans">
      {/* Dynamic Background */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-100/60 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-100/60 rounded-full blur-[120px]" />
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-[460px] px-6 relative z-10"
      >
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-indigo-600 rounded-3xl shadow-2xl shadow-indigo-200 mb-6 group">
            <Zap size={32} className="text-white fill-current group-hover:scale-110 transition-transform" />
          </div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight mb-3">Welcome Back</h1>
          <p className="text-slate-500 font-medium">Log in to EMP PRO to manage your productivity.</p>
        </div>

        <div className="bg-white p-10 rounded-[40px] shadow-2xl shadow-slate-200/60 border border-white">
          <form onSubmit={handleLogin} className="space-y-6">
            {error && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="p-4 bg-red-50 border border-red-100 rounded-2xl flex items-start gap-3 text-red-700 text-sm font-bold"
              >
                <AlertCircle size={18} className="shrink-0 mt-0.5" />
                <span>{error}</span>
              </motion.div>
            )}

            <div className="space-y-2">
              <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Work Email</label>
              <div className="relative group">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-indigo-600 transition-colors" size={20} />
                <input 
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@company.com"
                  className="w-full pl-12 pr-4 py-4 bg-slate-50 border-2 border-transparent rounded-2xl text-slate-900 placeholder:text-slate-300 focus:border-indigo-600 focus:bg-white transition-all outline-none font-bold" 
                  required 
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between ml-1">
                <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Password</label>
                <button type="button" className="text-xs font-bold text-indigo-600 hover:text-indigo-700">Forgot password?</button>
              </div>
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-indigo-600 transition-colors" size={20} />
                <input 
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-12 pr-4 py-4 bg-slate-50 border-2 border-transparent rounded-2xl text-slate-900 placeholder:text-slate-300 focus:border-indigo-600 focus:bg-white transition-all outline-none font-bold" 
                  required 
                />
              </div>
            </div>

            <div className="flex items-center gap-3 ml-1">
              <label className="relative flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={rememberMe} 
                  onChange={() => setRememberMe(!rememberMe)} 
                  className="sr-only peer" 
                />
                <div className="w-6 h-6 bg-slate-100 border-2 border-slate-200 rounded-lg peer-checked:bg-indigo-600 peer-checked:border-indigo-600 transition-all flex items-center justify-center">
                  <div className={`w-3 h-2 border-l-2 border-b-2 border-white -rotate-45 mb-1 ${rememberMe ? 'block' : 'hidden'}`} />
                </div>
                <span className="ml-3 text-sm font-bold text-slate-600">Remember me</span>
              </label>
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className="w-full bg-indigo-600 text-white rounded-[20px] py-4.5 font-black hover:bg-indigo-700 active:scale-[0.98] transition-all shadow-xl shadow-indigo-100 flex items-center justify-center gap-2 group disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {loading ? (
                <Loader2 className="animate-spin" size={22} />
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>
        </div>

        {/* Quick Login Helpers */}
        <div className="mt-8 flex flex-col items-center gap-4">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Quick Access</p>
          <div className="flex flex-wrap gap-2 justify-center">
            {[
              { role: 'Admin', email: 'admin@emp.com', p: 'admin123', color: 'bg-amber-100 text-amber-700' },
              { role: 'Manager', email: 'manager@emp.com', p: 'manager123', color: 'bg-blue-100 text-blue-700' },
              { role: 'Employee', email: 'john@emp.com', p: 'employee123', color: 'bg-emerald-100 text-emerald-700' }
            ].map(mock => (
              <button 
                key={mock.role}
                onClick={() => setMock(mock.email, mock.p)}
                className={`px-4 py-2 rounded-full text-[11px] font-black uppercase tracking-wider transition-all hover:scale-105 active:scale-95 ${mock.color}`}
              >
                {mock.role}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-10 p-5 bg-white rounded-3xl border border-slate-100 flex items-start gap-4">
          <div className="w-10 h-10 shrink-0 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600">
            <Info size={20} />
          </div>
          <p className="text-[11px] font-bold text-slate-500 leading-relaxed">
            By signing in, you agree to our <span className="text-indigo-600 underline cursor-pointer">Terms of Service</span> and <span className="text-indigo-600 underline cursor-pointer">Privacy Policy</span>.
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default LoginPage;

