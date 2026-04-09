import React, { useState, useEffect, useRef } from 'react';
import { 
  Plus, 
  Video, 
  User, 
  LogOut, 
  Clock, 
  X, 
  CheckCircle2, 
  AlertCircle,
  Hash,
  Globe,
  Calendar,
  Users as UsersIcon,
  ChevronDown,
  Zap
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  getMeetings, 
  createMeeting, 
  startMeeting, 
  getAvailableUsers 
} from '../services/meetingService';
import MeetingRoom from '../components/MeetingRoom';
import { useNavigate } from 'react-router-dom';

// --- MODAL COMPONENT ---
const CreateMeetingModal = ({ isOpen, onClose, onCreate }) => {
  const [title, setTitle] = useState('');
  const [selectedEmployees, setSelectedEmployees] = useState([]);
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [duration, setDuration] = useState('30');
  const [employees, setEmployees] = useState([]);
  const [showEmployeeDropdown, setShowEmployeeDropdown] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchEmployees();
    }
  }, [isOpen]);

  const fetchEmployees = async () => {
    try {
      const data = await getAvailableUsers();
      setEmployees(data);
    } catch (err) {
      console.error('Error fetching employees:', err);
    }
  };

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title.trim() || !date || !time) return;
    
    const dateTime = `${date}T${time}`;
    onCreate({
      title,
      participants: selectedEmployees,
      dateTime,
      duration: parseInt(duration)
    });
    
    // Reset
    setTitle('');
    setSelectedEmployees([]);
    setDate('');
    setTime('');
    setDuration('30');
  };

  const toggleEmployee = (empId) => {
    setSelectedEmployees(prev => 
      prev.includes(empId) 
        ? prev.filter(id => id !== empId) 
        : [...prev, empId]
    );
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-6 bg-black/60 backdrop-blur-md">
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-white rounded-[2.5rem] p-8 max-w-lg w-full shadow-2xl relative max-h-[90vh] overflow-y-auto"
      >
        <button onClick={onClose} className="absolute top-6 right-6 p-2 text-gray-300 hover:text-black transition-colors">
          <X size={20} />
        </button>

        <h2 className="text-3xl font-black mb-1 leading-none tracking-tighter">New Meeting</h2>
        <p className="text-gray-400 font-bold text-xs uppercase tracking-widest mb-8">Schedule a professional session</p>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Title */}
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-widest text-gray-400 ml-1">Meeting Title</label>
            <input 
              type="text" 
              autoFocus
              required
              placeholder="e.g. Q4 Strategy Call"
              className="w-full bg-gray-50 border-2 border-transparent focus:border-indigo-600 p-4 rounded-2xl outline-none font-bold text-lg transition-all"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          {/* Employee Selection */}
          <div className="space-y-2 relative">
            <label className="text-xs font-bold uppercase tracking-widest text-gray-400 ml-1 flex justify-between">
              <span>Invite Employees</span>
              <span>{selectedEmployees.length} selected</span>
            </label>
            <div 
              onClick={() => setShowEmployeeDropdown(!showEmployeeDropdown)}
              className="w-full bg-gray-50 border-2 border-transparent p-4 rounded-2xl cursor-pointer flex justify-between items-center"
            >
              <div className="flex -space-x-2 overflow-hidden">
                {selectedEmployees.length > 0 ? (
                  employees
                    .filter(e => selectedEmployees.includes(e.id))
                    .slice(0, 5)
                    .map(e => (
                      <div key={e.id} className="w-8 h-8 rounded-full bg-indigo-600 text-white text-[10px] flex items-center justify-center border-2 border-white ring-1 ring-indigo-100 font-bold" title={e.name}>
                        {e.name[0]}
                      </div>
                    ))
                ) : (
                  <span className="text-gray-400 font-bold">Select participants...</span>
                )}
                {selectedEmployees.length > 5 && (
                  <div className="w-8 h-8 rounded-full bg-gray-200 text-gray-600 text-[10px] flex items-center justify-center border-2 border-white font-bold">
                    +{selectedEmployees.length - 5}
                  </div>
                )}
              </div>
              <ChevronDown size={20} className={`text-gray-400 transition-transform ${showEmployeeDropdown ? 'rotate-180' : ''}`} />
            </div>

            <AnimatePresence>
              {showEmployeeDropdown && (
                <motion.div 
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="absolute z-10 w-full mt-2 bg-white border border-gray-100 shadow-2xl rounded-2xl max-h-48 overflow-y-auto p-2"
                >
                  {employees.map(emp => (
                    <div 
                      key={emp.id}
                      onClick={() => toggleEmployee(emp.id)}
                      className={`p-3 rounded-xl flex items-center gap-3 cursor-pointer transition-colors ${selectedEmployees.includes(emp.id) ? 'bg-indigo-50' : 'hover:bg-gray-50'}`}
                    >
                      <div className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-colors ${selectedEmployees.includes(emp.id) ? 'bg-indigo-600 border-indigo-600' : 'border-gray-200'}`}>
                        {selectedEmployees.includes(emp.id) && <CheckCircle2 size={12} className="text-white" />}
                      </div>
                      <span className="font-bold text-sm text-gray-700">{emp.name}</span>
                      <span className="text-[10px] text-gray-400 ml-auto uppercase font-black">{emp.role}</span>
                    </div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Date */}
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-widest text-gray-400 ml-1">Date</label>
              <input 
                type="date" 
                required
                className="w-full bg-gray-50 border-2 border-transparent focus:border-indigo-600 p-4 rounded-2xl outline-none font-bold transition-all text-sm"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>
            {/* Time */}
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-widest text-gray-400 ml-1">Time</label>
              <input 
                type="time" 
                required
                className="w-full bg-gray-50 border-2 border-transparent focus:border-indigo-600 p-4 rounded-2xl outline-none font-bold transition-all text-sm"
                value={time}
                onChange={(e) => setTime(e.target.value)}
              />
            </div>
          </div>

          {/* Duration */}
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-widest text-gray-400 ml-1">Duration (Minutes)</label>
            <select 
              className="w-full bg-gray-50 border-2 border-transparent focus:border-indigo-600 p-4 rounded-2xl outline-none font-bold transition-all text-sm appearance-none cursor-pointer"
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
            >
              <option value="15">15 Minutes</option>
              <option value="30">30 Minutes</option>
              <option value="45">45 Minutes</option>
              <option value="60">60 Minutes</option>
              <option value="90">90 Minutes</option>
            </select>
          </div>

          <div className="flex gap-4 pt-4">
            <button 
              type="button"
              onClick={onClose}
              className="flex-1 py-4 font-bold text-gray-400 hover:text-gray-600 transition-colors"
            >
              Cancel
            </button>
            <button 
              type="submit"
              className="flex-[2] bg-indigo-600 hover:bg-indigo-700 text-white py-4 rounded-[2rem] font-black uppercase tracking-widest shadow-xl transition-all active:scale-95"
            >
              Confirm Meeting
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

// Internal MeetingRoom removed - using shared component

// --- MAIN MEETINGS PAGE ---
const MeetingsPage = () => {
    const [meetings, setMeetings] = useState([]);
    const [activeMeeting, setActiveMeeting] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();
  
    // Fetch user context
    const currentUser = (() => {
      try {
        const data = localStorage.getItem('user');
        return data ? JSON.parse(data) : { name: 'Company Employee', id: 0 };
      } catch {
        return { name: 'Company Employee', id: 0 };
      }
    })();
  
    useEffect(() => {
      fetchMeetings();
    }, []);

    const fetchMeetings = async () => {
      try {
        setLoading(true);
        const data = await getMeetings();
        setMeetings(data);
      } catch (err) {
        console.error('Error fetching meetings:', err);
      } finally {
        setLoading(false);
      }
    };

    const handleCreateMeeting = async (meetingData) => {
      try {
        await createMeeting(meetingData);
        setIsModalOpen(false);
        fetchMeetings();
      } catch (err) {
        console.error('Error creating meeting:', err);
        alert('Failed to create meeting');
      }
    };
  
    const handleStartMeeting = async (meeting) => {
      try {
        await startMeeting(meeting.id);
        setActiveMeeting({ ...meeting, status: 'LIVE' });
      } catch (err) {
        console.error('Error starting meeting:', err);
        // Fallback: still open the room
        setActiveMeeting(meeting);
      }
    };

    const handleJoinMeeting = (meeting) => {
      setActiveMeeting(meeting);
    };
  
    const handleLeaveMeeting = () => {
      setActiveMeeting(null);
      fetchMeetings(); // Refresh list to catch status changes
    };

    const isMeetingJoinable = (meetingDate) => {
        const now = new Date();
        const mDate = new Date(meetingDate);
        return now >= mDate;
    };
  
    return (
      <div className="min-h-screen bg-[#fafafa] p-6 md:p-12 font-sans overflow-x-hidden">
        <div className="max-w-7xl mx-auto">
          
          {/* HEADER */}
          <header className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-8">
            <div className="space-y-2">
              <h1 className="text-5xl font-black tracking-tighter text-black flex items-center gap-4">
                <div className="p-3 bg-black text-white rounded-3xl shadow-xl shadow-black/10">
                   <Video size={32} />
                </div>
                Meetings Hub
              </h1>
              <p className="text-gray-400 font-bold ml-1 text-sm uppercase tracking-[0.2em]">Live Enterprise Collaboration</p>
            </div>
            
            <button 
              onClick={() => setIsModalOpen(true)}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-10 py-5 rounded-[2.5rem] font-black text-xs uppercase tracking-widest transition-all shadow-[0_20px_40px_-5px_rgba(79,70,229,0.3)] hover:scale-105 active:scale-95 group flex items-center gap-3"
            >
              <Plus size={20} className="group-hover:rotate-90 transition-transform duration-300" />
              Create Meeting
            </button>
          </header>
  
          {/* CONTENT */}
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
               {[1,2,3].map(i => (
                 <div key={i} className="h-64 bg-white rounded-[3rem] animate-pulse border border-gray-100" />
               ))}
            </div>
          ) : (
            <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
              {meetings.map((m) => {
                const isHost = m.created_by === currentUser.id;
                const canJoin = isMeetingJoinable(m.dateTime || m.scheduled_at);
                const isLive = m.status === 'LIVE' || m.status === 'ongoing';

                return (
                  <motion.div 
                    key={m.id} 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`bg-white rounded-[3rem] p-8 border border-gray-100 shadow-sm hover:shadow-2xl transition-all duration-500 flex flex-col group relative overflow-hidden ${isLive ? 'ring-4 ring-red-500/10' : ''}`}
                  >
                    <div className={`absolute top-0 right-0 w-32 h-32 ${isLive ? 'bg-red-50/50' : 'bg-indigo-50/30'} rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-700`} />
                    
                    <div className="mb-8 flex justify-between items-center relative z-10">
                      <div className={`w-12 h-12 ${isLive ? 'bg-red-600' : 'bg-black'} rounded-2xl flex items-center justify-center text-white shadow-lg`}>
                         <Video size={20} />
                      </div>
                      <div className={`${isLive ? 'bg-red-50 text-red-600' : 'bg-indigo-50 text-indigo-600'} px-5 py-2 rounded-full text-[10px] font-black uppercase tracking-widest shadow-sm`}>
                         {isLive ? 'Session LIVE' : 'Scheduled'}
                      </div>
                    </div>
      
                    <h3 className="text-2xl font-black mb-3 leading-tight tracking-tight break-words relative z-10">{m.title || m.purpose}</h3>
                    
                    <div className="space-y-3 mb-10 relative z-10">
                      <div className="flex items-center gap-3 text-gray-500 font-bold text-sm">
                        <div className="w-8 h-8 bg-gray-100 rounded-xl flex items-center justify-center text-indigo-600"><User size={16} /></div>
                        <div className="flex flex-col">
                            <span className="text-[10px] uppercase text-gray-400 font-black tracking-widest">Organized by</span>
                            <span>{m.creator_name || 'Host'}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 text-gray-400 font-bold text-[10px] uppercase tracking-[0.2em] pl-1">
                        <Calendar size={12} className="text-indigo-400" />
                        <span>{new Date(m.dateTime || m.scheduled_at).toLocaleDateString()} at {new Date(m.dateTime || m.scheduled_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                    </div>
      
                    <div className="mt-auto space-y-3 relative z-10">
                        {isHost ? (
                          <button 
                            onClick={() => handleStartMeeting(m)}
                            className="w-full bg-black hover:bg-slate-900 text-white p-5 rounded-[2rem] font-black uppercase tracking-widest transition-all shadow-xl active:scale-[0.98] flex items-center justify-center gap-3"
                          >
                            <Zap size={18} className="text-yellow-400 fill-yellow-400" />
                            Start Meeting
                          </button>
                        ) : (
                          <button 
                            disabled={!canJoin && !isLive}
                            onClick={() => handleJoinMeeting(m)}
                            className={`w-full p-5 rounded-[2rem] font-black uppercase tracking-widest transition-all shadow-xl active:scale-[0.98] flex items-center justify-center gap-3 ${
                                canJoin || isLive 
                                ? 'bg-indigo-600 hover:bg-indigo-700 text-white' 
                                : 'bg-gray-100 text-gray-400 cursor-not-allowed shadow-none'
                            }`}
                          >
                            Join Meeting
                          </button>
                        )}
                        {!canJoin && !isLive && !isHost && (
                            <p className="text-center text-[10px] font-bold text-gray-300 uppercase tracking-widest">Opens at meeting time</p>
                        )}
                    </div>
                  </motion.div>
                );
              })}
    
              {/* EMPTY STATE */}
              {meetings.length === 0 && (
                <div className="col-span-full py-32 flex flex-col items-center justify-center bg-white rounded-[4rem] border-2 border-dashed border-gray-100 shadow-inner">
                  <div className="w-24 h-24 bg-gray-50 rounded-[2.5rem] flex items-center justify-center mb-8 border border-gray-100 text-gray-200">
                    <Video size={40} />
                  </div>
                  <p className="text-gray-400 font-black text-2xl tracking-tighter">No Meetings Scheduled</p>
                  <p className="text-gray-300 font-bold text-sm uppercase tracking-widest mt-2">Create a new session to invite participants</p>
                </div>
              )}
            </section>
          )}
  
          {/* CREATE MODAL */}
          <AnimatePresence>
            {isModalOpen && (
              <CreateMeetingModal 
                isOpen={isModalOpen} 
                onClose={() => setIsModalOpen(false)} 
                onCreate={handleCreateMeeting}
              />
            )}
          </AnimatePresence>
  
          {/* VIDEO ROOM */}
          <AnimatePresence>
            {activeMeeting && (
              <MeetingRoom 
                meeting={activeMeeting} 
                currentUser={currentUser}
                onLeave={handleLeaveMeeting} 
              />
            )}
          </AnimatePresence>
  
        </div>
      </div>
    );
};

export default MeetingsPage;