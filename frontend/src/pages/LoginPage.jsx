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
      
      const { token } = data;
      localStorage.setItem('token', token);
      
      const profileRes = await api.get('/users/profile');
      const fullUser = profileRes.data;

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

  // Animation variants for staggered children
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] } }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#fafafa] font-sans relative overflow-hidden selection:bg-indigo-100 selection:text-indigo-900">
      {/* Soft Background Gradients */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-[20%] -left-[10%] w-[60vw] h-[60vw] rounded-full bg-gradient-to-br from-indigo-100/60 to-purple-50/60 blur-[100px] opacity-80 mix-blend-multiply" />
        <div className="absolute top-[40%] -right-[10%] w-[50vw] h-[50vw] rounded-full bg-gradient-to-tl from-cyan-50/60 to-blue-100/50 blur-[100px] opacity-70 mix-blend-multiply" />
      </div>

      <motion.div
        initial="hidden"
        animate="visible"
        variants={containerVariants}
        className="w-full max-w-[420px] px-6 relative z-10"
      >
        <motion.div variants={itemVariants} className="flex flex-col items-center mb-8">
          <div className="w-14 h-14 bg-gradient-to-tr from-indigo-600 to-violet-600 rounded-2xl flex items-center justify-center shadow-xl shadow-indigo-600/20 mb-6">
             <span className="text-white font-black text-2xl tracking-tighter">E</span>
          </div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">EMP PRO</h1>
          <p className="text-slate-500 text-sm font-medium mt-1.5">Enterprise Management Platform</p>
        </motion.div>

        <motion.div 
           variants={itemVariants}
           className="bg-white/80 backdrop-blur-xl p-8 sm:p-10 rounded-[32px] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white"
        >
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Welcome back</h2>
            <p className="text-slate-500 text-sm mt-1.5 font-medium">Please enter your details to sign in</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            <AnimatePresence mode="wait">
              {error && (
                <motion.div
                  initial={{ opacity: 0, height: 0, scale: 0.95 }}
                  animate={{ opacity: 1, height: 'auto', scale: 1 }}
                  exit={{ opacity: 0, height: 0, scale: 0.95 }}
                  className="bg-rose-50 border border-rose-100 rounded-2xl p-4 flex items-start gap-3 text-rose-600 text-sm overflow-hidden"
                >
                  <AlertCircle size={18} className="shrink-0 mt-0.5" />
                  <span className="font-medium leading-tight">{error}</span>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="space-y-1.5">
              <label className="text-[13px] font-bold text-slate-700 tracking-wide ml-1">Email</label>
              <div className="relative group">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 transition-colors group-focus-within:text-indigo-600" size={18} />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@company.com"
                  className="w-full pl-11 pr-4 py-3.5 bg-white border border-slate-200 rounded-[16px] text-slate-900 placeholder:text-slate-400 focus:border-indigo-600 focus:ring-4 focus:ring-indigo-600/10 transition-all outline-none font-medium shadow-sm hover:border-slate-300"
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between ml-1">
                <label className="text-[13px] font-bold text-slate-700 tracking-wide">Password</label>
                <button type="button" className="text-[13px] font-bold text-indigo-600 hover:text-indigo-700 transition-colors">Forgot password?</button>
              </div>
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 transition-colors group-focus-within:text-indigo-600" size={18} />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-11 pr-12 py-3.5 bg-white border border-slate-200 rounded-[16px] text-slate-900 placeholder:text-slate-400 focus:border-indigo-600 focus:ring-4 focus:ring-indigo-600/10 transition-all outline-none font-medium shadow-sm hover:border-slate-300"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-500 transition-colors p-1"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between py-1">
              <label className="flex items-center gap-2.5 cursor-pointer group">
                <div className="relative flex items-center">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={() => setRememberMe(!rememberMe)}
                    className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-600/20 transition-all cursor-pointer"
                  />
                </div>
                <span className="text-[13px] font-medium text-slate-600 group-hover:text-slate-900 transition-colors">Remember device</span>
              </label>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-4 rounded-[16px] transition-all duration-300 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2 group mt-4 shadow-[0_4px_14px_0_rgba(79,70,229,0.39)] hover:shadow-[0_6px_20px_rgba(79,70,229,0.23)] hover:-translate-y-[1px] active:translate-y-[1px]"
            >
              {loading ? (
                <Loader2 className="animate-spin" size={20} />
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform opacity-70 group-hover:opacity-100" />
                </>
              )}
            </button>
          </form>

          <div className="mt-8 pt-8 border-t border-slate-100">
            <button 
              type="button"
              onClick={() => window.location.href = `${api.defaults.baseURL}/auth/github`}
              className="w-full flex items-center justify-center gap-3 py-3.5 border border-slate-200 rounded-[16px] text-slate-700 font-bold text-sm hover:bg-slate-50 hover:border-slate-300 transition-all bg-white shadow-sm hover:shadow active:scale-[0.98]"
            >
               <svg className="w-5 h-5 opacity-80" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
              </svg>
              <span>Continue with GitHub</span>
            </button>
            <p className="text-center text-[13px] text-slate-500 mt-6 font-medium">
              Don't have an account? <span className="text-indigo-600 font-bold cursor-pointer hover:text-indigo-700 transition-colors">Request access</span>
            </p>
          </div>
        </motion.div>

        <motion.div variants={itemVariants} className="mt-8 text-center">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-emerald-50/80 backdrop-blur-sm rounded-full border border-emerald-200/60 shadow-sm">
             <CheckCircle2 size={14} className="text-emerald-500" />
             <span className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider">All systems operational</span>
          </div>
          <p className="text-[12px] font-medium text-slate-400 mt-6">
            © {new Date().getFullYear()} EMP PRO GLOBAL. Built for growth.
          </p>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default LoginPage;

