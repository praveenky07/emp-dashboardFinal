import React, { useState, useEffect } from 'react';
import { 
  User, 
  Lock, 
  Bell, 
  Building2, 
  Mail, 
  Shield, 
  Save, 
  Camera, 
  CheckCircle2, 
  AlertCircle,
  Loader2,
  ChevronRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { updateProfile, updatePassword, uploadProfileImage, getUserProfile } from '../services/userService';
import { useUser } from '../context/UserContext';

const Settings = () => {
  const { user, setUser, refreshUser } = useUser();
  const [activeTab, setActiveTab] = useState('profile');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  // Profile State
  const [profileData, setProfileData] = useState({
    name: '',
    email: '',
    role: '',
    profile_image: '',
  });

  // Password State
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  // Notification State
  const [notifications, setNotifications] = useState({
    email: true,
    app: true,
  });

  useEffect(() => {
    if (user) {
      setProfileData({
        name: user.name || '',
        email: user.email || '',
        role: user.role || '',
        profile_image: user.profile_image || '',
      });
    }
  }, [user]);

  useEffect(() => {
    refreshUser();
  }, []);

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!['image/jpeg', 'image/png'].includes(file.type)) {
      return setError('Only JPG/PNG images are allowed');
    }
    
    if (file.size > 2 * 1024 * 1024) {
      return setError('Image must be less than 2MB');
    }

    setLoading(true);
    setError('');
    try {
      const res = await uploadProfileImage(file);
      const newImageUrl = res.imageUrl;
      setUser(prev => ({ ...prev, profile_image: newImageUrl }));
      setProfileData(prev => ({...prev, profile_image: newImageUrl}));
      
      setSuccess('Profile image updated successfully!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error(err);
      setError('Something went wrong');
    } finally {
      setLoading(false);
    }
  };


  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      await updateProfile({ name: profileData.name });
      setSuccess('Profile updated successfully!');
      setUser(prev => ({ ...prev, name: profileData.name }));
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordUpdate = async (e) => {
    e.preventDefault();
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      return setError('Passwords do not match');
    }
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      await updatePassword({
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
      });
      setSuccess('Password updated successfully!');
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update password');
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { id: 'profile', name: 'Profile', icon: User },
    { id: 'security', name: 'Security', icon: Lock },
    { id: 'notifications', name: 'Notifications', icon: Bell },
    { id: 'company', name: 'Company', icon: Building2 },
  ];

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">System Settings</h1>
          <p className="text-slate-500 font-bold uppercase tracking-widest text-[11px] mt-1">Configure your professional workspace</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Navigation Sidebar */}
        <div className="lg:col-span-1 space-y-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-bold transition-all ${
                activeTab === tab.id 
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100' 
                : 'text-slate-500 hover:bg-white hover:text-slate-900'
              }`}
            >
              <tab.icon size={18} />
              <span>{tab.name}</span>
            </button>
          ))}
        </div>

        {/* Content Area */}
        <div className="lg:col-span-3">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              className="bg-white rounded-[32px] border border-slate-100 shadow-sm p-8"
            >
              {/* Profile Section */}
              {activeTab === 'profile' && (
                <div className="space-y-8">
                  <div className="flex items-center gap-6 pb-8 border-b border-slate-50">
                    <div className="relative group">
                      <div className="w-24 h-24 rounded-[32px] bg-indigo-50 flex items-center justify-center text-indigo-600 border border-indigo-100 overflow-hidden shadow-inner">
                        {profileData.profile_image ? (
                          <img src={profileData.profile_image} alt="Profile" className="w-full h-full object-cover" />
                        ) : (
                          <User size={40} />
                        )}
                      </div>
                      <label htmlFor="profile-upload" className="absolute -bottom-2 -right-2 p-2 bg-white rounded-xl border border-slate-200 shadow-sm text-slate-400 hover:text-indigo-600 hover:border-indigo-100 transition-all group-hover:scale-110 cursor-pointer">
                        <Camera size={16} />
                      </label>
                      <input 
                        id="profile-upload" 
                        type="file" 
                        accept="image/png, image/jpeg" 
                        className="hidden" 
                        onChange={handleImageUpload}
                        disabled={loading}
                      />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-slate-900">{profileData.name}</h3>
                      <p className="text-sm font-medium text-slate-400 uppercase tracking-wider">{profileData.role}</p>
                    </div>
                  </div>

                  <form onSubmit={handleProfileUpdate} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider ml-1">Full Identity</label>
                        <div className="relative group">
                          <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-indigo-500 transition-colors" size={18} />
                          <input 
                            type="text" 
                            value={profileData.name}
                            onChange={(e) => setProfileData({...profileData, name: e.target.value})}
                            className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-transparent rounded-2xl outline-none focus:bg-white focus:border-indigo-100 transition-all font-bold text-slate-700"
                            placeholder="Your Name"
                          />
                        </div>
                      </div>
                      <div className="space-y-2 opacity-60">
                        <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider ml-1">Work Email (System Only)</label>
                        <div className="relative">
                          <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                          <input 
                            type="email" 
                            value={profileData.email}
                            readOnly
                            className="w-full pl-12 pr-4 py-4 bg-slate-100 border border-transparent rounded-2xl cursor-not-allowed font-bold text-slate-500"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-6 border-t border-slate-50">
                      <p className="text-xs text-slate-400 font-medium italic">Email modifications require administrator verification</p>
                      <button 
                        type="submit"
                        disabled={loading}
                        className="bg-[#111827] text-white px-8 py-4 rounded-2xl font-bold text-sm hover:scale-105 active:scale-95 transition-all flex items-center gap-2 shadow-lg shadow-slate-200"
                      >
                        {loading ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
                        Update Profile
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* Security Section */}
              {activeTab === 'security' && (
                <div className="space-y-8">
                  <div>
                    <h3 className="text-xl font-bold text-slate-900 mb-1">Credential Security</h3>
                    <p className="text-sm text-slate-400 font-medium">Protect your workspace with frequent password rotations</p>
                  </div>

                  <form onSubmit={handlePasswordUpdate} className="space-y-6">
                    <div className="space-y-2">
                      <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider ml-1">Current Password</label>
                      <div className="relative group">
                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-indigo-500 transition-colors" size={18} />
                        <input 
                          type="password" 
                          value={passwordData.currentPassword}
                          onChange={(e) => setPasswordData({...passwordData, currentPassword: e.target.value})}
                          className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-transparent rounded-2xl outline-none focus:bg-white focus:border-indigo-100 transition-all font-bold text-slate-700"
                          placeholder="••••••••"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider ml-1">New Access PIN</label>
                        <input 
                          type="password" 
                          value={passwordData.newPassword}
                          onChange={(e) => setPasswordData({...passwordData, newPassword: e.target.value})}
                          className="w-full px-5 py-4 bg-slate-50 border border-transparent rounded-2xl outline-none focus:bg-white focus:border-indigo-100 transition-all font-bold text-slate-700"
                          placeholder="••••••••"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider ml-1">Verify PIN</label>
                        <input 
                          type="password" 
                          value={passwordData.confirmPassword}
                          onChange={(e) => setPasswordData({...passwordData, confirmPassword: e.target.value})}
                          className="w-full px-5 py-4 bg-slate-50 border border-transparent rounded-2xl outline-none focus:bg-white focus:border-indigo-100 transition-all font-bold text-slate-700"
                          placeholder="••••••••"
                        />
                      </div>
                    </div>

                    <div className="pt-6 border-t border-slate-50">
                      <button 
                        type="submit"
                        disabled={loading}
                        className="w-full md:w-auto bg-indigo-600 text-white px-8 py-4 rounded-2xl font-bold text-sm hover:scale-105 active:scale-95 transition-all shadow-lg shadow-indigo-100"
                      >
                        Rotate Security Credentials
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* Notifications Section */}
              {activeTab === 'notifications' && (
                <div className="space-y-8">
                  <div>
                    <h3 className="text-xl font-bold text-slate-900 mb-1">Communication Channels</h3>
                    <p className="text-sm text-slate-400 font-medium">Control how you receive session alerts and system updates</p>
                  </div>

                  <div className="space-y-4">
                    {[
                      { id: 'email', name: 'Email Synchronization', icon: Mail, desc: 'Critical alerts, leave approvals and weekly summaries' },
                      { id: 'app', name: 'In-App Notifications', icon: Bell, desc: 'Real-time shift alerts, meeting invites and peer pings' },
                    ].map((pref) => (
                      <div key={pref.id} className="flex items-center justify-between p-6 bg-slate-50 rounded-2xl border border-transparent hover:border-indigo-100 transition-all group">
                        <div className="flex items-center gap-4">
                          <div className="p-3 bg-white rounded-xl text-slate-400 group-hover:text-indigo-600 shadow-sm transition-all">
                            <pref.icon size={20} />
                          </div>
                          <div>
                            <p className="text-sm font-bold text-slate-900">{pref.name}</p>
                            <p className="text-[11px] text-slate-400 font-medium mt-0.5">{pref.desc}</p>
                          </div>
                        </div>
                        <button 
                          onClick={() => setNotifications({...notifications, [pref.id]: !notifications[pref.id]})}
                          className={`w-12 h-6 rounded-full transition-all relative ${notifications[pref.id] ? 'bg-indigo-600' : 'bg-slate-200'}`}
                        >
                          <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${notifications[pref.id] ? 'left-7' : 'left-1'}`} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Company Section */}
              {activeTab === 'company' && (
                <div className="space-y-8">
                  <div className="flex items-center gap-6 p-6 bg-indigo-50 rounded-[32px] border border-indigo-100 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-100 rounded-full blur-3xl opacity-50" />
                    <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center text-indigo-600 shadow-sm relative z-10">
                      <Building2 size={32} />
                    </div>
                    <div className="relative z-10">
                      <h3 className="text-xl font-bold text-indigo-900">EMP PRO Global</h3>
                      <p className="text-xs font-bold text-indigo-400 uppercase tracking-widest mt-1">Enterprise Subscription</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-6 bg-white border border-slate-100 rounded-2xl shadow-sm flex items-center justify-between group">
                      <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Assigned Facility</p>
                        <p className="text-sm font-bold text-slate-900">Main Headquarters</p>
                      </div>
                      <Shield className="text-slate-200 group-hover:text-indigo-600 transition-colors" size={20} />
                    </div>
                    <div className="p-6 bg-white border border-slate-100 rounded-2xl shadow-sm flex items-center justify-between group">
                      <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Deployment Level</p>
                        <p className="text-sm font-bold text-slate-900">{user.role || 'Personnel'}</p>
                      </div>
                      <ChevronRight className="text-slate-200 group-hover:text-indigo-600 transition-colors" size={20} />
                    </div>
                  </div>

                  <div className="bg-amber-50 p-6 rounded-2xl border border-amber-100 flex items-start gap-4">
                    <AlertCircle className="text-amber-600 shrink-0 mt-0.5" size={20} />
                    <div>
                      <h4 className="text-sm font-bold text-amber-900">Enterprise Restricted Area</h4>
                      <p className="text-xs text-amber-700 font-medium mt-1 leading-relaxed">
                        Modifying global company parameters requires Administrative privileges. Please contact the Operations department for hierarchical adjustments.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* Success/Error Toasts */}
      <AnimatePresence>
        {success && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[100] bg-emerald-600 text-white px-8 py-4 rounded-2xl shadow-2xl flex items-center gap-3 border border-emerald-500"
          >
            <CheckCircle2 size={18} />
            <span className="text-sm font-bold tracking-tight">{success}</span>
          </motion.div>
        )}
        {error && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[100] bg-rose-600 text-white px-8 py-4 rounded-2xl shadow-2xl flex items-center gap-3 border border-rose-500"
          >
            <AlertCircle size={18} />
            <span className="text-sm font-bold tracking-tight">{error}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Settings;
