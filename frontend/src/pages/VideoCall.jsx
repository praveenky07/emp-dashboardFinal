import React, { useEffect, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { ZegoUIKitPrebuilt } from '@zegocloud/zego-uikit-prebuilt';
import { useUser } from '../context/UserContext';
import { generateZegoToken } from '../utils/zego';
import { Ship, X } from 'lucide-react';

const VideoCall = () => {
    const { roomId } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const { user } = useUser();
    const containerRef = useRef(null);

    // Get call type from state or default to video
    const callType = location.state?.callType || 'video';

    useEffect(() => {
        if (!user || !roomId) return;

        const myMeeting = async (element) => {
            const kitToken = generateZegoToken(user.id.toString(), roomId, user.name);

            const zp = ZegoUIKitPrebuilt.create(kitToken);

            zp.joinRoom({
                container: element,
                sharedLinks: [
                    {
                        name: 'Personal link',
                        url: window.location.protocol + '//' + window.location.host + window.location.pathname + '?roomID=' + roomId,
                    },
                ],
                scenario: {
                    mode: ZegoUIKitPrebuilt.OneONoneCall,
                },
                showScreenSharingButton: true,
                turnOnMicrophoneWhenJoining: true,
                turnOnCameraWhenJoining: callType === 'video',
                showMyCameraToggleButton: true,
                showMyMicrophoneToggleButton: true,
                showAudioVideoSettingsButton: true,
                showTextChat: true,
                showUserList: false,
                maxUsers: 2,
                layout: 'Auto',
                showLayoutButton: false,
                onLeaveRoom: () => {
                    navigate('/chat');
                },
            });
        };

        if (containerRef.current) {
            myMeeting(containerRef.current);
        }

        // Cleanup on unmount
        return () => {
            // Zego cleanup is mostly handled by the UI kit, but we navigate back
        };
    }, [user, roomId, navigate, callType]);

    return (
        <div className="w-full h-screen bg-slate-950 flex flex-col relative overflow-hidden">
            {/* Minimal Header */}
            <div className="absolute top-0 left-0 right-0 p-6 flex justify-between items-center z-10 pointer-events-none">
                <div className="flex items-center gap-3 bg-white/5 backdrop-blur-md px-4 py-2 rounded-2xl border border-white/10">
                    <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-black text-sm">
                        ZE
                    </div>
                    <span className="text-white font-black uppercase tracking-widest text-[10px]">Secure Call Room</span>
                </div>
                <button 
                    onClick={() => navigate('/chat')}
                    className="p-3 bg-red-500/20 text-red-500 rounded-xl hover:bg-red-500 hover:text-white transition-all pointer-events-auto border border-red-500/20"
                >
                    <X size={20} />
                </button>
            </div>

            {/* Zego Container */}
            <div 
                ref={containerRef} 
                className="flex-1 w-full h-full"
            />
        </div>
    );
};

export default VideoCall;
