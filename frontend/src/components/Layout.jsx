import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate, useLocation, Outlet } from 'react-router-dom';
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
  Zap as ZapIcon,
  Wallet,
  Gift,
  LifeBuoy,
  Menu,
  Hash,
  Mail,
  Shield,
  Briefcase as DeptIcon,
  Video as VideoIcon
} from 'lucide-react';
import socket, { connectSocket, disconnectSocket } from '../services/socket';
import { motion, AnimatePresence } from 'framer-motion';
import DetailModal from './DetailModal';

const Sidebar = ({ user, isOpen, setIsOpen }) => {
  const role = user.role?.toLowerCase() || '';
  const menuItems = [
    { name: 'Dashboard', icon: LayoutDashboard, path: '/dashboard', roles: ['employee', 'manager', 'admin'] },
    { name: 'Employees', icon: Users, path: '/manager', roles: ['manager', 'admin'] },
    { name: 'Attendance', icon: Clock, path: '/attendance', roles: ['employee', 'manager', 'admin'] },
    { name: 'Payroll', icon: Wallet, path: '/payroll', roles: ['employee', 'manager', 'admin'] },
    { name: 'Benefits', icon: Gift, path: '/benefits', roles: ['employee', 'manager', 'admin'] },
    { name: 'Leave', icon: Calendar, path: '/leave', roles: ['employee', 'manager', 'admin'] },
    { name: 'Meetings', icon: VideoIcon, path: '/meetings', roles: ['employee', 'manager', 'admin'] },
    { name: 'Performance', icon: BarChart3, path: '/performance', roles: ['employee', 'manager', 'admin'] },
    { name: 'Support', icon: LifeBuoy, path: '/support', roles: ['employee', 'manager', 'admin'] },
    { name: 'Settings', icon: Settings, path: '/settings', roles: ['employee', 'manager', 'admin'] },
    { name: 'Admin Panel', icon: ShieldCheck, path: '/admin', roles: ['admin'] },
  ].filter(item => item.roles.includes(role));

  return (
    <aside className={`sidebar ${isOpen ? 'open' : ''} flex flex-col`}>
      <div className="p-6">
        <div className="flex items-center gap-3 mb-10 px-2">
          <div className="w-9 h-9 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold text-lg">
            E
          </div>
          <span className="text-xl font-bold text-[#111827] tracking-tight">EMP PRO</span>
        </div>

        <nav className="space-y-1">
          {menuItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={() => window.innerWidth < 1024 && setIsOpen(false)}
              className={({ isActive }) => `
                flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-bold text-sm
                ${isActive 
                  ? 'bg-indigo-50 text-indigo-600' 
                  : 'text-[#6b7280] hover:bg-slate-50 hover:text-[#111827]'
                }
              `}
            >
              {({ isActive }) => (
                <>
                  <item.icon size={20} strokeWidth={isActive ? 2.5 : 2} />
                  <span>{item.name}</span>
                </>
              )}
            </NavLink>
          ))}
        </nav>
      </div>

      <div className="mt-auto p-6 border-t border-[#e5e7eb]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-[#111827] font-bold text-sm border border-[#e5e7eb] overflow-hidden">
            {user?.profile_image ? (
              <img src={user.profile_image} alt="Profile" className="w-full h-full object-cover" />
            ) : (
              user?.name ? user.name[0] : '?'
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-[#111827] truncate">{user?.name || 'User'}</p>
            <p className="text-[11px] font-bold text-[#6b7280] uppercase tracking-wider">{user?.role || 'Guest'}</p>
          </div>
        </div>
      </div>
    </aside>
  );
};

const Navbar = ({ user, onLogout, toggleSidebar }) => {
  return (
    <header className="h-20 flex items-center justify-between px-8 bg-white border-b border-[#e5e7eb] sticky top-0 z-40">
      <div className="flex items-center gap-4">
        <button onClick={toggleSidebar} className="lg:hidden p-2 text-[#6b7280] hover:bg-slate-50 rounded-lg">
          <Menu size={20} />
        </button>
        <div className="relative hidden md:block">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[#9ca3af]" size={16} />
          <input 
            type="text" 
            placeholder="Search everything..." 
            className="pl-11 pr-4 py-2.5 bg-slate-50 border border-transparent rounded-[12px] text-sm font-bold w-80 focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/5 outline-none transition-all"
          />
        </div>
      </div>
      
      <div className="flex items-center gap-5">
        <button className="p-2.5 text-[#6b7280] hover:bg-slate-50 rounded-full transition-all relative">
          <Bell size={20} />
          <span className="absolute top-2 right-2 w-2 h-2 bg-indigo-500 rounded-full border-2 border-white"></span>
        </button>
        
        <div className="h-8 w-px bg-[#e5e7eb]"></div>

        <div className="flex items-center gap-4">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-bold text-[#111827] leading-none">{user.name}</p>
            <p className="text-[10px] font-bold text-[#6b7280] mt-1.5 uppercase tracking-wider">{user.role}</p>
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={() => window.openProfile && window.openProfile()}
              className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center hover:ring-4 hover:ring-slate-100 transition-all border border-[#e5e7eb] overflow-hidden"
            >
               {user?.profile_image ? (
                 <img src={user.profile_image} alt="Profile" className="w-full h-full object-cover" />
               ) : (
                 <User size={20} className="text-[#6b7280]" />
               )}
            </button>
            <button 
              onClick={onLogout}
              className="p-2 text-[#6b7280] hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
              title="Logout"
            >
              <LogOut size={20} />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}

const Layout = () => {
  const [user, setUser] = useState({ name: 'Guest', role: 'None' });
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showProfile, setShowProfile] = useState(false);

  useEffect(() => {
    let currentUserId = null;
    try {
        const storedUser = localStorage.getItem('user');
        const token = localStorage.getItem('token');
        if (storedUser && token) {
            const parsed = JSON.parse(storedUser);
            currentUserId = parsed.id;
            connectSocket(token);
            socket.emit('userOnline', currentUserId);
            
            // Critical for Mobile: Re-announce online state when recovering from background suspension
            socket.on('connect', () => {
                 socket.emit('userOnline', currentUserId);
            });
        }
    } catch(err) { console.error('Socket init err', err) }

    return () => {
        socket.off('connect');
        disconnectSocket();
    };
  }, []);

  useEffect(() => {
    const loadUser = async () => {
      try {
        const storedUser = localStorage.getItem('user');
        if (storedUser) setUser(JSON.parse(storedUser));
        
        // Fetch fresh data for profile_image and other updates
        const token = localStorage.getItem('token');
        if (token) {
          const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/users/profile`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          if (res.ok) {
            const freshUser = await res.json();
            setUser(prev => ({ ...prev, ...freshUser }));
            localStorage.setItem('user', JSON.stringify({...JSON.parse(storedUser || '{}'), ...freshUser}));
          }
        }
      } catch (err) {
        console.error('Error loading fresh user data in Layout', err);
      }
    };
    loadUser();
    const handleProfileUpdate = () => loadUser();
    window.openProfile = () => setShowProfile(true);
    window.addEventListener('profileUpdated', handleProfileUpdate);
    
    return () => {
        window.removeEventListener('profileUpdated', handleProfileUpdate);
        delete window.openProfile;
    };
  }, [location.pathname]); 

  const handleLogout = () => {
    if (user?.id) socket.emit('userOffline', user.id);
    disconnectSocket();
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.removeEventListener('profileUpdated', () => {});
    navigate('/login');
  };

  return (
    <div className="app-layout">
      <Sidebar user={user} isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />
      
      <div className="main-content">
        <Navbar user={user} onLogout={handleLogout} toggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
        
        <main className="flex-1 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <Outlet />
        </main>

        <DetailModal isOpen={showProfile} onClose={() => setShowProfile(false)} title="Operational Profile">
          <div className="space-y-8 p-2">
            <div className="flex flex-col items-center gap-6">
              <div className="w-20 h-20 rounded-[24px] bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-3xl shadow-sm overflow-hidden">
                 {user?.profile_image ? (
                   <img src={user.profile_image} alt="Profile" className="w-full h-full object-cover" />
                 ) : (
                   user.name ? user.name[0] : '?'
                 )}
              </div>
              <div className="text-center">
                <h3 className="text-2xl font-bold text-[#111827]">{user.name}</h3>
                <p className="text-[#6b7280] font-bold uppercase tracking-wider text-[11px] mt-1">{user.role}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               {[
                 { label: 'Employee ID', value: user.employee_code || 'EMP001', icon: Hash },
                 { label: 'Work Email', value: user.email, icon: Mail },
                 { label: 'Account Role', value: user.role, icon: Shield },
                 { label: 'Join Date', value: user.created_at ? new Date(user.created_at).toLocaleDateString() : 'Mar 25, 2026', icon: Calendar }
               ].map((item, i) => (
                 <div key={i} className="flex items-center gap-4 p-5 bg-[#fcfdfe] rounded-2xl border border-[#e5e7eb] hover:border-indigo-200 transition-all group">
                    <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-[#9ca3af] group-hover:bg-indigo-600 group-hover:text-white transition-all shadow-sm border border-[#e5e7eb]">
                       <item.icon size={18} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[10px] font-bold text-[#6b7280] uppercase tracking-wider leading-none mb-1.5">{item.label}</p>
                      <p className="text-sm font-bold text-[#111827] break-all">{item.value}</p>
                    </div>
                 </div>
               ))}
            </div>
          </div>
        </DetailModal>
      </div>
    </div>
  );
};

export default Layout;
