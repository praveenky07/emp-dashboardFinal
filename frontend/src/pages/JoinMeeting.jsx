import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Video as VideoIcon, 
  Users, 
  Calendar, 
  Clock, 
  ChevronLeft, 
  ShieldCheck, 
  Info,
  LogOut,
  Zap,
  Lock,
  ArrowRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { getMeetingById, joinMeeting } from '../services/meetingService';

// --- STABLE MEETING ROOM COMPONENT ---
const MeetingRoom = ({ meeting, onLeave, currentUser }) => {
  return (
    <div className="fixed inset-0 z-[200] bg-gray-900 flex flex-col items-center justify-center font-sans overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10 opacity-20">
         <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-indigo-500 rounded-full blur-[150px]" />
         <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-blue-500 rounded-full blur-[150px]" />
      </div>

      <header className="absolute top-0 left-0 w-full p-8 flex justify-between items-center bg-transparent">
         <div className="flex items-center gap-4">
            <div className="w-4 h-4 bg-red-500 rounded-full animate-pulse shadow-[0_0_15px_rgba(239,68,68,0.8)]" />
            <span className="text-white font-black uppercase tracking-[0.3em] text-xs">Live Session</span>
         </div>
         <button 
           onClick={onLeave}
           className="bg-white/10 hover:bg-red-500 text-white hover:text-white px-8 py-4 rounded-2xl font-black transition-all backdrop-blur-md flex items-center gap-2 group"
         >
           <LogOut size={18} className="group-hover:-translate-x-1 transition-transform" />
           LEAVE SESSION
         </button>
      </header>

      <div className="max-w-4xl w-full p-12 bg-white/5 backdrop-blur-3xl rounded-[4rem] border border-white/10 flex flex-col items-center gap-12 shadow-2xl relative overflow-hidden">
         <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500" />
         
         <div className="w-32 h-32 bg-gradient-to-br from-indigo-600 to-blue-700 rounded-[3rem] flex items-center justify-center text-white shadow-2xl relative">
            <VideoIcon size={48} />
            <div className="absolute -top-2 -right-2 w-8 h-8 bg-black rounded-full border-4 border-white/10 flex items-center justify-center">
               <div className="w-2 h-2 bg-green-500 rounded-full shadow-[0_0_10px_#22c55e]" />
            </div>
         </div>

         <div className="text-center space-y-4">
            <h2 className="text-5xl font-black text-white tracking-tighter">{meeting.title || meeting.purpose}</h2>
            <p className="text-indigo-300 font-bold uppercase tracking-[0.4em] text-xs">Connecting to secure video node...</p>
         </div>

         <div className="grid grid-cols-2 md:grid-cols-4 gap-6 w-full">
            {[1,2,3,4].map(i => (
              <div key={i} className="aspect-square bg-white/10 rounded-[2.5rem] border border-white/5 flex flex-col items-center justify-center gap-4 group hover:bg-white/20 transition-all cursor-pointer">
                 <div className="w-12 h-12 rounded-full bg-indigo-500/20 flex items-center justify-center text-white font-bold opacity-50 group-hover:opacity-100 transition-opacity">
                    {i === 1 ? currentUser.name[0] : '?'}
                 </div>
                 <span className="text-[10px] font-black text-white/40 uppercase tracking-widest">{i === 1 ? 'You' : 'Remote User'}</span>
              </div>
            ))}
         </div>

         <div className="pt-8 flex gap-6">
            <div className="flex flex-col items-center gap-2">
               <div className="w-16 h-16 rounded-full bg-white/10 border border-white/10 flex items-center justify-center text-white hover:bg-white hover:text-black transition-all cursor-pointer">
                  <VideoIcon size={20} />
               </div>
               <span className="text-[10px] font-bold text-white/30 uppercase">Toggle Video</span>
            </div>
            <div className="flex flex-col items-center gap-2">
               <div className="w-16 h-16 rounded-full bg-white/10 border border-white/10 flex items-center justify-center text-white hover:bg-white hover:text-black transition-all cursor-pointer">
                  <Users size={20} />
               </div>
               <span className="text-[10px] font-bold text-white/30 uppercase">Participants List</span>
            </div>
         </div>
      </div>

      <div className="mt-12 flex items-center gap-3 text-white/20 font-black uppercase tracking-[0.5em] text-[10px]">
         <ShieldCheck size={14} />
         Enterprise Infrastructure Verified
      </div>
    </div>
  );
};

const JoinMeeting = () => {
  const { meetingId } = useParams();
  const navigate = useNavigate();
  const [meeting, setMeeting] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isJoining, setIsJoining] = useState(false);

  const currentUser = (() => {
    try {
      const data = localStorage.getItem('user');
      return data ? JSON.parse(data) : { name: 'Guest User' };
    } catch {
        return { name: 'Guest User' };
    }
  })();

  useEffect(() => {
    const fetchMeeting = async () => {
      try {
        const data = await getMeetingById(meetingId);
        setMeeting(data);
      } catch (err) {
        setError(err.message || 'Meeting not found');
      } finally {
        setLoading(false);
      }
    };
    fetchMeeting();
  }, [meetingId]);

  const handleJoin = async () => {
    try {
      await joinMeeting(meetingId);
      setIsJoining(true);
    } catch (err) {
      console.error('Join error:', err);
      setIsJoining(true); // Still try to join
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-indigo-600/20 border-t-indigo-600 rounded-full animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6 text-center space-y-8 font-sans">
        <div className="w-24 h-24 bg-rose-50 rounded-[40px] flex items-center justify-center mx-auto mb-4">
          <Lock size={40} className="text-rose-500" />
        </div>
        <div className="space-y-4">
          <h1 className="text-4xl font-black text-slate-900 tracking-tight">Access Denied</h1>
          <p className="text-slate-500 font-bold uppercase tracking-widest text-[11px] max-w-xs mx-auto">This meeting session has ended or the link is invalid</p>
        </div>
        <button 
          onClick={() => navigate('/dashboard')}
          className="bg-slate-900 text-white px-8 py-4 rounded-3xl font-black text-sm transition-all shadow-xl shadow-slate-200 flex items-center gap-2 hover:scale-105 active:scale-95"
        >
          <ChevronLeft size={18} />
          Back to Dashboard
        </button>
      </div>
    );
  }

  const mDateTime = new Date(meeting.dateTime || meeting.scheduled_at);
  const canJoin = new Date() >= mDateTime || meeting.status === 'LIVE' || meeting.status === 'ongoing';

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 font-sans overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10 opacity-30">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-200 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-emerald-100 rounded-full blur-[120px]" />
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-2xl bg-white rounded-[48px] shadow-2xl p-10 lg:p-16 border border-white/50 relative"
      >
        <div className="space-y-12">
          <div className="space-y-6">
            <div className="flex items-center gap-3">
               <div className="px-4 py-1.5 bg-indigo-50 text-indigo-600 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
                 <ShieldCheck size={12} />
                 Verified Session
               </div>
               {meeting.status === 'LIVE' && (
                 <div className="px-4 py-1.5 bg-red-50 text-red-600 rounded-full text-[10px] font-black uppercase tracking-widest animate-pulse">
                   LIVE NOW
                 </div>
               )}
            </div>
            
            <div className="space-y-2">
              <h1 className="text-4xl lg:text-5xl font-black text-slate-900 tracking-tight leading-tight">
                {meeting.title || meeting.purpose}
              </h1>
              <div className="flex items-center gap-4 text-slate-400 font-bold uppercase tracking-widest text-[11px] pt-2">
                 <div className="flex items-center gap-2">
                   <Clock size={16} className="text-indigo-400" />
                   {meeting.duration} Minutes
                 </div>
                 <div className="w-1 h-1 bg-slate-200 rounded-full" />
                 <div className="flex items-center gap-2">
                   <Calendar size={16} className="text-emerald-400" />
                   {mDateTime.toLocaleDateString()} at {mDateTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                 </div>
              </div>
            </div>
          </div>

          <div className="p-8 bg-slate-50 rounded-[32px] border border-slate-100/50 flex flex-col md:flex-row items-center gap-6">
             <div className="w-16 h-16 rounded-3xl bg-white shadow-xl flex items-center justify-center text-indigo-600 font-black text-2xl relative overflow-hidden">
               <div className="absolute top-0 left-0 w-full h-1 bg-indigo-600" />
               {(meeting.creator_name || 'U')[0]}
             </div>
             <div className="text-center md:text-left flex-1">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-1">Organized by</p>
                <h3 className="text-xl font-black text-slate-800">{meeting.creator_name || 'Host'}</h3>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-tighter">{meeting.category || 'General'}</p>
             </div>
          </div>

          <div className="space-y-6 text-center">
            {!canJoin && (
                <div className="p-4 bg-amber-50 rounded-2xl border border-amber-100 flex items-center gap-3 text-amber-700">
                    <Clock size={20} />
                    <p className="text-xs font-bold">This meeting has not started yet. Please come back at the scheduled time.</p>
                </div>
            )}
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <button 
                disabled={!canJoin}
                onClick={handleJoin}
                className={`group p-6 rounded-[32px] font-black text-sm transition-all duration-500 flex items-center justify-center gap-4 shadow-2xl ${canJoin ? 'bg-slate-900 text-white hover:bg-indigo-600' : 'bg-gray-100 text-gray-400 cursor-not-allowed shadow-none'}`}
              >
                <VideoIcon size={20} />
                <span>Join Now</span>
                <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
              </button>

              <button 
                onClick={() => navigate('/dashboard')}
                className="bg-white border-2 border-slate-100 hover:border-indigo-100 text-slate-600 p-6 rounded-[32px] font-black text-sm transition-all flex items-center justify-center gap-3"
              >
                Back to Portal
              </button>
            </div>
          </div>
        </div>

        <div className="mt-12 pt-10 border-t border-slate-100 flex items-center gap-3 justify-center text-slate-400">
          <Info size={14} />
          <p className="text-[10px] font-bold uppercase tracking-widest">Enterprise Encrypted • Jitsi Video Services</p>
        </div>
      </motion.div>

      <AnimatePresence>
        {isJoining && (
            <MeetingRoom 
                meeting={meeting} 
                currentUser={currentUser} 
                onLeave={() => setIsJoining(false)} 
            />
        )}
      </AnimatePresence>
    </div>
  );
};

export default JoinMeeting;
