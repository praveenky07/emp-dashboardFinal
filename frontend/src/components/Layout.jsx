import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users, 
  Settings, 
  LogOut, 
  Calendar, 
  Clock, 
  BarChart3, 
  ShieldCheck,
  Bell,
  Search,
  User,
  ChevronRight,
  Menu,
  X,
  Zap as ZapIcon
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const Sidebar = ({ user, isOpen, setIsOpen }) => {
  const role = user.role?.toLowerCase() || '';
  const menuItems = [
    { name: 'Dashboard', icon: LayoutDashboard, path: '/dashboard', roles: ['employee', 'manager', 'admin'] },
    { name: 'Leave Tracker', icon: Calendar, path: '/leave', roles: ['employee', 'manager', 'admin'] },
    { name: 'Team Performance', icon: Users, path: '/manager', roles: ['manager', 'admin'] },
    { name: 'Admin Panel', icon: ShieldCheck, path: '/admin', roles: ['admin'] },
  ].filter(item => item.roles.includes(role));

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsOpen(false)}
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40 lg:hidden"
          />
        )}
      </AnimatePresence>

      <motion.aside 
        initial={{ x: -280 }} 
        animate={{ x: isOpen ? 0 : -280 }}
        transition={{ type: 'spring', damping: 20, stiffness: 100 }}
        className={`fixed left-0 top-0 h-screen w-72 bg-white border-r border-slate-200 z-50 flex flex-col shadow-2xl lg:translate-x-0 lg:shadow-none transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}
      >
        <div className="p-8 pb-4">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-200">
              <ZapIcon size={22} className="text-white fill-current" />
            </div>
            <span className="text-xl font-black text-slate-800 tracking-tight">EMP PRO</span>
          </div>

          <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Main Menu</p>
          <nav className="space-y-1.5 ">
            {menuItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={() => window.innerWidth < 1024 && setIsOpen(false)}
                className={({ isActive }) => `
                  flex items-center gap-3 px-4 py-3 rounded-xl transition-all group relative font-bold text-sm
                  ${isActive 
                    ? 'bg-indigo-50 text-indigo-700 shadow-sm' 
                    : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
                  }
                `}
              >
                {({ isActive }) => (
                  <>
                    <item.icon size={20} className={`transition-colors ${isActive ? 'text-indigo-600' : 'text-slate-400 group-hover:text-slate-600'}`} />
                    <span>{item.name}</span>
                    {isActive && (
                      <motion.div 
                        layoutId="activeTab" 
                        className="absolute left-0 w-1 h-6 bg-indigo-600 rounded-r-full"
                        transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                      />
                    )}
                  </>
                )}
              </NavLink>
            ))}
          </nav>
        </div>

        <div className="mt-auto p-6">
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 overflow-hidden">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-black border-2 border-white shadow-sm shrink-0">
                {user.name ? user.name[0] : '?'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-black text-slate-900 truncate">{user.name}</p>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{user.role}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 bg-green-100/50 rounded-full w-fit">
              <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
              <span className="text-[10px] font-black text-green-700 uppercase">Online</span>
            </div>
          </div>
        </div>
      </motion.aside>
    </>
  );
};

const Topbar = ({ user, onLogout, toggleSidebar }) => {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header className={`h-20 flex items-center justify-between px-6 sticky top-0 z-40 transition-all duration-300 border-b ${scrolled ? 'bg-white/80 backdrop-blur-xl border-slate-200 shadow-sm' : 'bg-transparent border-transparent'}`}>
      <div className="flex items-center gap-4">
        <button 
          onClick={toggleSidebar}
          className="lg:hidden p-2 text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
        >
          <Menu size={20} />
        </button>
        <div className="relative hidden md:block">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
          <input 
            type="text" 
            placeholder="Search anything..." 
            className="pl-10 pr-4 py-2 bg-slate-50 border-none rounded-xl text-sm font-bold focus:ring-2 focus:ring-indigo-600 transition-all w-64"
          />
        </div>
      </div>
      
      <div className="flex items-center gap-4">
        <button className="p-2.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all relative">
          <Bell size={20} />
          <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-indigo-600 rounded-full border-2 border-white" />
        </button>
        
        <div className="h-8 w-px bg-slate-200 mx-1" />
        
        <div className="flex items-center gap-3">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-black text-slate-900 leading-none">{user.name}</p>
            <p className="text-[10px] font-bold text-slate-500 mt-1 uppercase tracking-wider leading-none">{user.role}</p>
          </div>
          <div className="w-10 h-10 rounded-full bg-slate-100 border-2 border-white shadow-sm overflow-hidden flex items-center justify-center">
             <User size={20} className="text-slate-400" />
          </div>
          <button 
            onClick={onLogout}
            className="p-2.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
            title="Logout"
          >
            <LogOut size={20} />
          </button>
        </div>
      </div>
    </header>
  );
}

const Layout = ({ children }) => {
  const [user, setUser] = useState({ name: 'Guest', role: 'None' });
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, [location.pathname]); // Update user on navigation

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  return (
    <div className="flex min-h-screen bg-[#F8FAFC]">
      <Sidebar user={user} isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />
      
      <div className="flex-1 lg:ml-72 flex flex-col min-h-screen relative">
        <Topbar user={user} onLogout={handleLogout} toggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
        
        <main className="p-6 lg:p-10 max-w-[1600px] w-full mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;
