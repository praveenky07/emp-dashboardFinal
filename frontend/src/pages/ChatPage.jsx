import React, { useState, useEffect, useRef } from 'react';
import api from '../services/api';
import socket from '../services/socket';
import { useUser } from '../context/UserContext';
import { 
    Send, 
    User, 
    Users as UsersIcon, 
    Hash, 
    Search, 
    Circle,
    MoreVertical,
    Phone,
    Video,
    Smile,
    Paperclip,
    Download,
    FileText,
    Image as ImageIcon,
    X,
    Mic,
    MicOff,
    VideoOff,
    PhoneOff,
    Maximize2,
    Trash,
    Ship,
    MessageSquare
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

const ChatPage = () => {
    const { user: currentUser } = useUser();
    const [users, setUsers] = useState([]);
    const [selectedChat, setSelectedChat] = useState(null); // { id, name, type: 'private' | 'group' }
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [activeTab, setActiveTab] = useState('private');
    const [searchQuery, setSearchQuery] = useState('');
    const [uploading, setUploading] = useState(false);
    const [onlineUsers, setOnlineUsers] = useState(new Set());
    
    const [callStatus, setCallStatus] = useState('idle'); // idle, incoming
    const [incomingCall, setIncomingCall] = useState(null);
    const [callType, setCallType] = useState('video'); // audio, video
    const [showMenu, setShowMenu] = useState(false);
    const [mobileSidebarOpen, setMobileSidebarOpen] = useState(true);

    const messagesEndRef = useRef(null);
    const fileInputRef = useRef(null);
    const navigate = useNavigate();

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        const fetchUsers = async () => {
            try {
                const res = await api.get('/chat/users');
                setUsers(res.data);
            } catch (err) {
                console.error('Failed to fetch chat users', err);
            }
        };
        fetchUsers();

        socket.on('activeUsersUpdated', (userIds) => {
            setOnlineUsers(new Set(userIds));
        });

        // ZEGO Signaling
        socket.on('incoming-call', (data) => {
            console.log('[ZEGO] Incoming call from:', data.name, 'Room:', data.roomId);
            setIncomingCall(data);
            setCallStatus('incoming');
            setCallType(data.type);
        });

        socket.on('call-rejected', () => {
             console.log('[ZEGO] Call rejected');
             setCallStatus('idle');
             setIncomingCall(null);
        });

        socket.on('call-ended', () => {
             console.log('[ZEGO] Peer ended call');
             setCallStatus('idle');
             setIncomingCall(null);
        });

        return () => {
            socket.off('activeUsersUpdated');
            socket.off('incoming-call');
            socket.off('call-rejected');
            socket.off('call-ended');
        };
    }, []);

    useEffect(() => {
        if (!selectedChat) return;

        const fetchHistory = async () => {
            try {
                const endpoint = selectedChat.type === 'private' 
                    ? `/chat/private/${selectedChat.id}` 
                    : `/chat/group/${selectedChat.id}`;
                const res = await api.get(endpoint);
                setMessages(res.data);
                setTimeout(scrollToBottom, 100);
            } catch (err) {
                console.error('Failed to fetch chat history', err);
            }
        };

        fetchHistory();
        setMobileSidebarOpen(false); // Close on mobile after selection

        if (selectedChat.type === 'group') {
            socket.emit('join_room', selectedChat.id);
        }

        const handlePrivateMessage = (data) => {
            console.log('[SOCKET] Received Private Message:', data);
            // Use String() for safe ID comparison (handle string vs number from DB/Socket)
            const isTargetMessage = String(data.senderId) === String(selectedChat.id) || String(data.senderId) === String(currentUser.id);
            if (selectedChat.type === 'private' && isTargetMessage) {
                setMessages(prev => [...prev, { 
                    ...data, 
                    sender_id: data.senderId,
                    created_at: new Date().toISOString() 
                }]);
            }
        };

        const handleGroupMessage = (data) => {
            console.log('[SOCKET] Received Group Message:', data);
            if (selectedChat.type === 'group' && String(data.groupId) === String(selectedChat.id)) {
                setMessages(prev => [...prev, { 
                    ...data, 
                    sender_id: data.senderId, 
                    group_id: data.groupId,
                    created_at: new Date().toISOString() 
                }]);
            }
        };

        socket.on('private_message', handlePrivateMessage);
        socket.on('group_message', handleGroupMessage);

        return () => {
            socket.off('private_message', handlePrivateMessage);
            socket.off('group_message', handleGroupMessage);
        };
    }, [selectedChat?.id, currentUser.id]);
    
    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleRejectCall = () => {
        if (incomingCall) socket.emit('reject-call', { from: incomingCall.from });
        setCallStatus('idle');
        setIncomingCall(null);
    };

    const startCall = async (type) => {
        if (!selectedChat) return;
        
        // Generate a unique room ID by combining and sorting user IDs
        const ids = [currentUser.id, selectedChat.id].sort();
        const roomId = `room_${ids[0]}_${ids[1]}`;
        
        setCallType(type);
        
        // Send signal to receiver
        socket.emit('call-user', {
            to: selectedChat.id,
            from: currentUser.id,
            name: currentUser.name,
            roomId: roomId,
            type
        });

        // Navigate to call room
        navigate(`/call/${roomId}`, { state: { callType: type } });
    };

    const answerCall = async () => {
        if (!incomingCall) return;
        
        const roomId = incomingCall.roomId;
        const type = incomingCall.type;

        // Navigate to call room
        navigate(`/call/${roomId}`, { state: { callType: type } });
        setCallStatus('idle');
        setIncomingCall(null);
    };

    const handleSendMessage = (e, fileUrl = null, fileType = null) => {
        if (e) e.preventDefault();
        if (!newMessage.trim() && !fileUrl || !selectedChat) return;

        const messageData = {
            senderId: currentUser.id,
            senderName: currentUser.name,
            message: newMessage.trim(),
            file_url: fileUrl,
            file_type: fileType,
            timestamp: new Date().toISOString()
        };

        if (selectedChat.type === 'private') {
            messageData.receiverId = selectedChat.id;
            socket.emit('private_message', messageData);
            // Opt-in UI update for immediate feedback
            setMessages(prev => [...prev, { ...messageData, sender_id: currentUser.id, receiver_id: selectedChat.id }]);
        } else {
            messageData.groupId = selectedChat.id;
            socket.emit('group_message', messageData);
        }

        setNewMessage('');
    };

    const handleFileUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setUploading(true);
        const formData = new FormData();
        formData.append('file', file);

        try {
            const res = await api.post('/upload/file', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            handleSendMessage(null, res.data.fileUrl, res.data.fileType);
        } catch (err) {
            console.error('Upload failed', err);
            alert('File upload failed. Please try again.');
        } finally {
            setUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const filteredUsers = users.filter(u => 
        u.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const groups = [
        { id: 'global', name: 'Global Tech Hub', type: 'group' },
        { id: 'engineering', name: 'Engineering Squad', type: 'group' },
        { id: 'hr', name: 'HR & Operations', type: 'group' }
    ];

    return (
        <div className="h-[calc(100vh-100px)] flex bg-white rounded-[32px] border border-slate-100 shadow-xl overflow-hidden relative">
            {/* Mobile Toggle */}
            <button 
                onClick={() => setMobileSidebarOpen(!mobileSidebarOpen)}
                className="lg:hidden absolute bottom-24 right-6 z-50 p-4 bg-indigo-600 text-white rounded-full shadow-2xl active:scale-95 transition-all"
            >
                <MessageSquare size={24} />
            </button>

            {/* Sidebar */}
            <div className={`
                ${mobileSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
                absolute lg:relative z-40 w-full lg:w-80 h-full border-r border-slate-50 flex flex-col bg-slate-50 transition-transform duration-300 ease-in-out
            `}>
            <div className="p-6 space-y-6">
                    <div className="flex items-center justify-between">
                        <h1 className="text-2xl font-black text-slate-900 tracking-tight">Messages</h1>
                        <button className="p-2 bg-white rounded-xl shadow-sm border border-slate-100 text-slate-400 hover:text-indigo-600 transition-all">
                            <MoreVertical size={18} />
                        </button>
                    </div>

                    <div className="relative group">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors" size={16} />
                        <input 
                            type="text" 
                            placeholder="Search chats..." 
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-3 bg-white border border-slate-100 rounded-2xl text-sm font-medium focus:border-indigo-600 outline-none transition-all"
                        />
                    </div>

                    <div className="flex p-1 bg-white border border-slate-100 rounded-xl">
                        <button 
                            onClick={() => setActiveTab('private')}
                            className={`flex-1 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'private' ? 'bg-indigo-600 text-white shadow-md shadow-indigo-100' : 'text-slate-400 hover:text-slate-600'}`}
                        >
                            Direct
                        </button>
                        <button 
                            onClick={() => setActiveTab('group')}
                            className={`flex-1 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'group' ? 'bg-indigo-600 text-white shadow-md shadow-indigo-100' : 'text-slate-400 hover:text-slate-600'}`}
                        >
                            Groups
                        </button>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto px-4 pb-6 space-y-2 custom-scrollbar">
                    {activeTab === 'private' ? (
                        filteredUsers.map(u => (
                            <button 
                                key={u.id}
                                onClick={() => setSelectedChat({ ...u, type: 'private' })}
                                className={`w-full flex items-center gap-4 p-4 rounded-2xl transition-all group ${selectedChat?.id === u.id ? 'bg-white border border-slate-100 shadow-md translate-x-1' : 'hover:bg-white/50'}`}
                            >
                                <div className="relative">
                                    <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600 font-black text-lg border border-indigo-100">
                                        {u.name[0]}
                                    </div>
                                    <div className={`absolute -bottom-1 -right-1 w-4 h-4 border-4 border-slate-50 rounded-full ${onlineUsers.has(u.id) ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                                </div>
                                <div className="flex-1 text-left overflow-hidden">
                                     <p className={`text-sm font-black truncate ${selectedChat?.id === u.id ? 'text-indigo-600' : 'text-slate-900'}`}>{u.name}</p>
                                     <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest truncate">{u.role}</p>
                                </div>
                            </button>
                        ))
                    ) : (
                        groups.map(g => (
                            <button 
                                key={g.id}
                                onClick={() => setSelectedChat(g)}
                                className={`w-full flex items-center gap-4 p-4 rounded-2xl transition-all group ${selectedChat?.id === g.id ? 'bg-white border border-slate-100 shadow-md translate-x-1' : 'hover:bg-white/50'}`}
                            >
                                <div className="w-12 h-12 bg-amber-50 rounded-2xl flex items-center justify-center text-amber-600 font-black border border-amber-100">
                                    <UsersIcon size={24} />
                                </div>
                                <div className="flex-1 text-left overflow-hidden">
                                     <p className={`text-sm font-black truncate ${selectedChat?.id === g.id ? 'text-indigo-600' : 'text-slate-900'}`}>{g.name}</p>
                                     <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest truncate">Collective Hub</p>
                                </div>
                            </button>
                        ))
                    )}
                </div>
            </div>

            {/* Chat Window */}
            <div className="flex-1 flex flex-col bg-white">
                {selectedChat ? (
                    <>
                        {/* Chat Header */}
                        <div className="p-6 border-b border-slate-50 flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-slate-900 rounded-2xl flex items-center justify-center text-white font-black text-lg">
                                    {selectedChat.type === 'private' ? selectedChat.name[0] : <Hash size={24} />}
                                </div>
                                <div>
                                    <h3 className="text-lg font-black text-slate-900 leading-none mb-1">{selectedChat.name}</h3>
                                    <div className="flex items-center gap-2">
                                        <Circle size={8} className={`fill-current ${onlineUsers.has(selectedChat.id) ? 'text-emerald-500' : 'text-slate-300'}`} />
                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{onlineUsers.has(selectedChat.id) ? 'Active Now' : 'Offline'}</span>
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center gap-2 relative">
                                <button onClick={() => startCall('audio')} className="p-3 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all"><Phone size={20} /></button>
                                <button onClick={() => startCall('video')} className="p-3 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all"><Video size={20} /></button>
                                <button onClick={() => setShowMenu(!showMenu)} className="p-3 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all"><MoreVertical size={20} /></button>
                                
                                <AnimatePresence>
                                    {showMenu && (
                                        <motion.div 
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: 10 }}
                                            className="absolute right-0 top-14 w-48 bg-white rounded-2xl shadow-xl border border-slate-100 z-50 overflow-hidden"
                                        >
                                            <button onClick={() => { setShowMenu(false); window.openProfile?.(); }} className="w-full px-4 py-3 text-left text-sm font-bold text-slate-600 hover:bg-slate-50 flex items-center gap-2"><User size={16} /> View Profile</button>
                                            <button onClick={() => { setShowMenu(false); alert('User blocked.'); }} className="w-full px-4 py-3 text-left text-sm font-bold text-red-600 hover:bg-red-50 flex items-center gap-2"><MicOff size={16} /> Block User</button>
                                            <button onClick={() => { setShowMenu(false); setMessages([]); }} className="w-full px-4 py-3 text-left text-sm font-bold text-slate-600 hover:bg-slate-50 flex items-center gap-2"><Trash size={16} /> Clear Chat</button>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        </div>

                        {/* Messages Area */}
                        <div className="flex-1 overflow-y-auto p-8 space-y-6 bg-slate-50/30 custom-scrollbar">
                            {messages.map((msg, i) => {
                                const isMine = String(msg.sender_id) === String(currentUser.id);
                                return (
                                    <div key={msg.id || i} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                                        <div className={`max-w-md ${isMine ? 'order-1' : 'order-2'}`}>
                                            {!isMine && selectedChat.type === 'group' && (
                                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 ml-1">{msg.sender_name}</p>
                                            )}
                                             <div className={`p-4 rounded-[24px] ${isMine ? 'bg-indigo-600 text-white rounded-tr-none shadow-lg shadow-indigo-100' : 'bg-white border border-slate-100 text-slate-800 rounded-tl-none shadow-sm'}`}>
                                                {msg.file_url && (
                                                    <div className="mb-3">
                                                        {msg.file_type?.startsWith('image/') ? (
                                                            <img src={msg.file_url} alt="Attachment" className="max-w-full rounded-xl border border-white/20 shadow-sm transition-transform hover:scale-[1.02] cursor-pointer" onClick={() => window.open(msg.file_url)} />
                                                        ) : (
                                                            <div className={`p-3 rounded-xl flex items-center gap-3 ${isMine ? 'bg-white/10' : 'bg-slate-50'}`}>
                                                                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${isMine ? 'bg-white/20 text-white' : 'bg-indigo-50 text-indigo-600'}`}>
                                                                    <FileText size={20} />
                                                                </div>
                                                                <div className="flex-1 overflow-hidden">
                                                                    <p className="text-[10px] font-black uppercase tracking-widest opacity-60">Attachment</p>
                                                                    <p className="text-xs font-bold truncate">Document File</p>
                                                                </div>
                                                                <a href={msg.file_url} target="_blank" rel="noreferrer" className={`p-2 rounded-lg ${isMine ? 'hover:bg-white/20' : 'hover:bg-indigo-50 text-indigo-600'}`}>
                                                                    <Download size={18} />
                                                                </a>
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                                {msg.message && <p className="text-sm font-medium leading-relaxed">{msg.message}</p>}
                                            </div>
                                            <p className={`text-[9px] font-bold text-slate-400 mt-2 ${isMine ? 'text-right mr-1' : 'ml-1'}`}>
                                                {new Date(msg.created_at || new Date()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </p>
                                        </div>
                                    </div>
                                );
                            })}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Message Input */}
                        <div className="p-8 border-t border-slate-50">
                            <form onSubmit={handleSendMessage} className="flex items-center gap-4 bg-slate-50 p-2 rounded-[32px] border border-slate-100 focus-within:border-indigo-600 transition-all relative">
                                <input 
                                    type="file" 
                                    ref={fileInputRef}
                                    onChange={handleFileUpload}
                                    className="hidden"
                                />
                                <button 
                                    type="button" 
                                    disabled={uploading}
                                    onClick={() => fileInputRef.current?.click()}
                                    className={`p-3 transition-all ${uploading ? 'text-indigo-400 animate-pulse' : 'text-slate-400 hover:text-indigo-600'}`}
                                >
                                    <Paperclip size={20} />
                                </button>
                                <input 
                                    type="text" 
                                    value={newMessage}
                                    disabled={uploading}
                                    onChange={(e) => setNewMessage(e.target.value)}
                                    placeholder={uploading ? "Uploading file..." : "Type a message..."} 
                                    className="flex-1 bg-transparent border-none outline-none font-bold text-sm px-2 disabled:opacity-50"
                                />
                                <button type="button" className="p-3 text-slate-400 hover:text-indigo-600 transition-all"><Smile size={20} /></button>
                                <button 
                                    type="submit"
                                    disabled={uploading || (!newMessage.trim())}
                                    className="p-4 bg-indigo-600 text-white rounded-[24px] hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 disabled:opacity-50 disabled:shadow-none"
                                >
                                    <Send size={20} />
                                </button>
                            </form>
                        </div>
                    </>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-center p-10 opacity-30">
                        <div className="w-24 h-24 bg-indigo-50 rounded-[40px] flex items-center justify-center text-indigo-200 mb-8 border border-indigo-100">
                             <Hash size={48} />
                        </div>
                        <h3 className="text-2xl font-black text-slate-900 mb-2">Select a Conversation</h3>
                        <p className="text-sm font-bold max-w-xs uppercase tracking-widest leading-loose">Choose a team member or group from the sidebar to start collaborating.</p>
                    </div>
                )}

                {/* Calling UI Overlays */}
                <AnimatePresence>
                    {callStatus === 'incoming' && incomingCall && (
                        <motion.div 
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            className="fixed inset-0 bg-slate-900/90 backdrop-blur-xl z-[100] flex items-center justify-center p-6"
                        >
                            <motion.div 
                                initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }}
                                className="bg-white w-full max-w-sm rounded-[40px] p-8 text-center shadow-2xl"
                            >
                                <div className="w-24 h-24 bg-indigo-600 rounded-[32px] mx-auto mb-6 flex items-center justify-center text-white shadow-xl shadow-indigo-200 animate-pulse">
                                    <Phone size={40} />
                                </div>
                                <h2 className="text-2xl font-black text-slate-900 mb-1">{incomingCall.name}</h2>
                                <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-10">Incoming {incomingCall.type} call...</p>
                                
                                <div className="flex gap-4">
                                    <button 
                                        onClick={handleRejectCall}
                                        className="flex-1 py-4 bg-red-50 text-red-600 rounded-3xl font-black uppercase tracking-widest text-xs hover:bg-red-100 transition-all"
                                    >
                                        Decline
                                    </button>
                                    <button 
                                        onClick={answerCall}
                                        className="flex-1 py-4 bg-emerald-500 text-white rounded-3xl font-black uppercase tracking-widest text-xs hover:bg-emerald-600 shadow-lg shadow-emerald-100 transition-all"
                                    >
                                        Accept
                                    </button>
                                </div>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};

export default ChatPage;
