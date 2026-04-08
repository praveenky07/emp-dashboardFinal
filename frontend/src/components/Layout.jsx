import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate, useLocation, Outlet } from 'react-router-dom';
import api from '../services/api';
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
  Video as VideoIcon,
  MessageSquare
} from 'lucide-react';

import socket, { connectSocket, disconnectSocket } from '../services/socket';
import { motion, AnimatePresence } from 'framer-motion';
import DetailModal from './DetailModal';
import { useUser } from '../context/UserContext';

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
    { name: 'Messages', icon: MessageSquare, path: '/chat', roles: ['employee', 'manager', 'admin'] },
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
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const res = await api.get('/chat/notifications');
        setNotifications(res.data);
        setUnreadCount(res.data.filter(n => !n.is_read).length);
      } catch (err) { console.error('Failed to fetch notifications', err); }
    };

    fetchNotifications();

    socket.on('new_notification', (data) => {
      setNotifications(prev => [data, ...prev]);
      setUnreadCount(prev => prev + 1);
    });

    return () => {
      socket.off('new_notification');
    };
  }, []);

  const handleMarkRead = async () => {
    try {
      await api.post('/chat/notifications/read');
      setUnreadCount(0);
      setNotifications(prev => prev.map(n => ({ ...n, is_read: 1 })));
    } catch (err) { console.error('Mark read failed', err); }
  };

  const handleNotificationClick = (n) => {
      handleMarkRead();
      setShowNotifications(false);
      const metadata = n.metadata ? JSON.parse(n.metadata) : {};
      if (metadata.type === 'private') {
          navigate(`/chat`);
      }
  };

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
        <div className="relative">
            <button 
                onClick={() => {
                    setShowNotifications(!showNotifications);
                    if (!showNotifications && unreadCount > 0) handleMarkRead();
                }}
                className="p-2.5 text-[#6b7280] hover:bg-slate-50 rounded-full transition-all relative"
            >
                <Bell size={20} />
                {unreadCount > 0 && (
                    <span className="absolute top-2 right-2 w-4 h-4 bg-indigo-500 text-white text-[9px] flex items-center justify-center rounded-full border-2 border-white font-black">
                        {unreadCount}
                    </span>
                )}
            </button>

            <AnimatePresence>
                {showNotifications && (
                    <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        className="absolute right-0 mt-4 w-80 bg-white border border-[#e5e7eb] rounded-[24px] shadow-2xl z-50 overflow-hidden"
                    >
                        <div className="p-5 border-b border-[#f3f4f6] flex justify-between items-center bg-slate-50/50">
                            <h3 className="text-sm font-black text-[#111827] uppercase tracking-wider">Alerts Center</h3>
                            <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-full">{unreadCount} New</span>
                        </div>
                        <div className="max-h-[400px] overflow-y-auto custom-scrollbar">
                            {notifications.length > 0 ? (
                                notifications.map((n, i) => (
                                    <div 
                                        key={n.id || i}
                                        onClick={() => handleNotificationClick(n)}
                                        className={`p-5 flex gap-4 hover:bg-slate-50 cursor-pointer border-b border-[#f3f4f6] last:border-0 transition-all ${!n.is_read ? 'bg-indigo-50/30' : ''}`}
                                    >
                                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${!n.is_read ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-400'}`}>
                                            <MessageSquare size={18} />
                                        </div>
                                        <div className="space-y-1">
                                            <p className={`text-sm leading-snug ${!n.is_read ? 'text-[#111827] font-bold' : 'text-slate-500 font-medium'}`}>{n.message}</p>
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{new Date(n.created_at).toLocaleTimeString()}</p>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="p-10 text-center text-slate-400 space-y-3">
                                    <Bell size={32} className="mx-auto opacity-20" />
                                    <p className="text-xs font-bold uppercase tracking-widest">No notifications yet</p>
                                </div>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
        
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
  const { user, logout } = useUser();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showProfile, setShowProfile] = useState(false);

  useEffect(() => {
    if (user?.id) {
        const token = localStorage.getItem('token');
        connectSocket(token);
        socket.emit('userOnline', user.id);
        
        socket.on('connect', () => {
             socket.emit('userOnline', user.id);
        });
    }

    return () => {
        socket.off('connect');
        disconnectSocket();
    };
  }, [user?.id]);

  useEffect(() => {
    window.openProfile = () => setShowProfile(true);
    return () => {
        delete window.openProfile;
    };
  }, []); 

  const handleLogout = () => {
    if (user?.id) socket.emit('userOffline', user.id);
    logout();
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
