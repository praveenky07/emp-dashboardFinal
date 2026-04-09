import React, { useEffect, useRef } from 'react';
import { LogOut } from 'lucide-react';

const MeetingRoom = ({ meeting, onLeave, currentUser }) => {
    const jitsiContainerRef = useRef(null);
    const jitsiApiRef = useRef(null);

    useEffect(() => {
        // Wait for Jitsi library to load
        const loadJitsi = () => {
            if (window.JitsiMeetExternalAPI && jitsiContainerRef.current) {
                const domain = "meet.jit.si";
                const options = {
                    roomName: meeting.room_id || `emp-meeting-${meeting.id}`,
                    width: '100%',
                    height: '100%',
                    parentNode: jitsiContainerRef.current,
                    userInfo: {
                        displayName: currentUser.name || "Employee"
                    },
                    configOverwrite: {
                        startWithAudioMuted: true,
                        disableModeratorIndicator: true,
                        startScreenSharing: false,
                        enableEmailInStats: false
                    },
                    interfaceConfigOverwrite: {
                        DISABLE_JOIN_LEAVE_NOTIFICATIONS: false,
                        SHOW_JITSI_WATERMARK: false,
                        DEFAULT_REMOTE_DISPLAY_NAME: 'Participant',
                    }
                };

                const api = new window.JitsiMeetExternalAPI(domain, options);
                jitsiApiRef.current = api;

                api.addEventListener('videoConferenceLeft', () => {
                    onLeave();
                });
            }
        };

        const checkJitsi = setInterval(() => {
            if (window.JitsiMeetExternalAPI) {
                clearInterval(checkJitsi);
                loadJitsi();
            }
        }, 500);

        return () => {
            clearInterval(checkJitsi);
            if (jitsiApiRef.current) {
                jitsiApiRef.current.dispose();
            }
        };
    }, [meeting, currentUser, onLeave]);

    return (
        <div className="fixed inset-0 z-[200] bg-gray-900 flex flex-col items-center justify-center font-sans overflow-hidden">
            <header className="absolute top-0 left-0 w-full p-6 flex justify-between items-center bg-gray-900/80 backdrop-blur-md z-[210] border-b border-white/5">
                <div className="flex items-center gap-4">
                    <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(239,68,68,0.8)]" />
                    <span className="text-white font-black uppercase tracking-[0.2em] text-[10px]">{meeting.title || meeting.purpose} • SECURE CHANNEL</span>
                </div>
                <button 
                    onClick={onLeave}
                    className="bg-red-600 hover:bg-black text-white px-6 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all flex items-center gap-2"
                >
                    <LogOut size={14} />
                    LEAVE SESSION
                </button>
            </header>

            <div ref={jitsiContainerRef} className="w-full h-full pt-20" />
            
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 px-6 py-3 bg-black/40 backdrop-blur-xl border border-white/10 rounded-full text-[9px] font-black text-white/30 uppercase tracking-[0.4em] z-[210] pointer-events-none">
                Enterprise Encrypted Stream Node
            </div>
        </div>
    );
};

export default MeetingRoom;
