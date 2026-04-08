import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import api from '../services/api';
import { motion, AnimatePresence } from 'framer-motion';
import { useUser } from '../context/UserContext';
import { 
  Lock, 
  Mail, 
  Loader2, 
  ArrowRight, 
  AlertCircle, 
  Eye, 
  EyeOff,
  CheckCircle2
} from 'lucide-react';

const LoginPage = () => {
  const { login: setUserLogin } = useUser();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');
    const userData = params.get('user');
    const loginError = params.get('error');

    if (token && userData) {
      try {
        const parsedUser = typeof userData === 'string' ? JSON.parse(userData) : userData;
        setUserLogin(parsedUser, token);
        navigate('/', { replace: true });
      } catch (err) {
        console.error('Failed to parse user data from URL', err);
      }
    } else if (loginError) {
      setError(loginError);
      window.history.replaceState({}, document.title, "/login");
    } else {
      // Clear legacy data if needed, but don't clear everything constantly on every mount
      // unless specifically intended for logout
    }
  }, [navigate]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const { data } = await api.post('/auth/login', { 
        email: email.trim().toLowerCase(), 
        password 
      });
      
      // 1. Get initial data
      const { token } = data;

      // 2. Fetch full profile to ensure we have latest data (Role, EmployeeID, etc)
      // Since we just set the token in localStorage, api.js should pick it up
      localStorage.setItem('token', token);
      const profileRes = await api.get('/users/profile');
      const fullUser = profileRes.data;

      // 3. Store through Context
      setUserLogin(fullUser, token);
      
      const from = location.state?.from?.pathname || '/';
      navigate(from, { replace: true });
    } catch (err) {
      console.error("[LOGIN ERROR]", err);
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      
      let message = 'An unexpected error occurred.';
      if (!err.response) {
        message = 'Server unreachable. Please check your internet connection.';
      } else if (err.response.status === 401) {
        message = 'Invalid email or password. Please try again.';
      } else {
        message = err.response?.data?.error || err.response?.data?.message || 'Login failed.';
      }
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f8fafc] font-sans selection:bg-indigo-100 selection:text-indigo-900">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-indigo-50 rounded-full blur-[120px] opacity-60" />
        <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-violet-50 rounded-full blur-[100px] opacity-60" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-[440px] px-6 relative z-10"
      >
        <div className="flex flex-col items-center mb-10">
          <div className="w-12 h-12 bg-gradient-to-tr from-indigo-600 to-indigo-500 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-200 mb-4">
             <span className="text-white font-black text-xl">E</span>
          </div>
          <h1 className="text-2xl font-black text-[#111827] tracking-tight">EMP PRO</h1>
          <p className="text-[#6b7280] text-sm font-medium mt-1">Management Simplified</p>
        </div>

        <div className="bg-white p-8 md:p-10 rounded-[32px] shadow-[0_20px_50px_rgba(0,0,0,0.04)] border border-[#e5e7eb]">
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-[#111827]">Welcome back</h2>
            <p className="text-[#6b7280] text-sm mt-1">Enter your credentials to access your account</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            <AnimatePresence mode="wait">
              {error && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="bg-red-50 border border-red-100 rounded-xl p-4 flex items-start gap-3 text-red-600 text-sm"
                >
                  <AlertCircle size={18} className="shrink-0 mt-0.5" />
                  <span>{error}</span>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-[#374151] ml-1">Email address</label>
              <div className="relative group">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-[#9ca3af] transition-colors group-focus-within:text-indigo-500" size={18} />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@company.com"
                  className="w-full pl-12 pr-4 py-3.5 bg-[#fcfdfe] border border-[#e5e7eb] rounded-[14px] text-[#111827] placeholder:text-[#9ca3af] focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/5 transition-all outline-none font-medium"
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between ml-1">
                <label className="text-sm font-semibold text-[#374151]">Password</label>
                <button type="button" className="text-sm font-bold text-indigo-600 hover:text-indigo-700 transition-colors">Forgot?</button>
              </div>
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-[#9ca3af] transition-colors group-focus-within:text-indigo-500" size={18} />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-12 pr-12 py-3.5 bg-[#fcfdfe] border border-[#e5e7eb] rounded-[14px] text-[#111827] placeholder:text-[#9ca3af] focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/5 transition-all outline-none font-medium"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-[#d1d5db] hover:text-[#9ca3af] transition-colors p-1"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between py-1">
              <label className="flex items-center gap-2.5 cursor-pointer">
                <div className="relative flex items-center">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={() => setRememberMe(!rememberMe)}
                    className="w-5 h-5 rounded-md border-[#d1d5db] text-indigo-600 focus:ring-indigo-500 transition-all cursor-pointer"
                  />
                </div>
                <span className="text-sm font-medium text-[#6b7280]">Keep me signed in</span>
              </label>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-indigo-600 to-indigo-500 hover:shadow-lg hover:shadow-indigo-200 text-white font-bold py-4 rounded-[14px] transition-all disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2 group mt-4 shadow-md shadow-indigo-100"
            >
              {loading ? (
                <Loader2 className="animate-spin" size={20} />
              ) : (
                <>
                  <span>Sign in</span>
                  <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>

          <div className="mt-8 pt-8 border-t border-[#f3f4f6]">
            <button 
              type="button"
              onClick={() => window.location.href = `${api.defaults.baseURL}/auth/github`}
              className="w-full flex items-center justify-center gap-3 py-3.5 border border-[#e5e7eb] rounded-[14px] text-[#374151] font-bold text-sm hover:bg-[#f9fafb] transition-all bg-white"
            >
               <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
              </svg>
              <span>Continue with GitHub</span>
            </button>
            <p className="text-center text-sm text-[#6b7280] mt-6">
              Don't have an account? <span className="text-indigo-600 font-bold cursor-pointer hover:underline">Request access</span>
            </p>
          </div>
        </div>

        <div className="mt-8 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-50 rounded-full border border-emerald-100">
             <CheckCircle2 size={14} className="text-emerald-500" />
             <span className="text-[11px] font-bold text-emerald-600 uppercase tracking-wider">All systems operational</span>
          </div>
          <p className="text-[12px] text-[#9ca3af] mt-6">
            © 2026 EMP PRO GLOBAL. Built for growth.
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default LoginPage;

