import { ZegoUIKitPrebuilt } from '@zegocloud/zego-uikit-prebuilt';

// In a real app, these should be in your .env
// For ZegoUIKitPrebuilt, you can generate the kitToken on the frontend for development
// using the App ID and Server Secret.

export const ZEGO_APP_ID = 485145823; // Placeholder - replace with your actual ID
export const ZEGO_SERVER_SECRET = "7f7e9f8f8b8e8d8c8b8a898887868584"; // Placeholder - replace with your actual secret

export const generateZegoToken = (userId, roomId, userName = "User") => {
    // This is the kitToken for ZegoUIKitPrebuilt
    return ZegoUIKitPrebuilt.generateKitTokenForTest(
        ZEGO_APP_ID, 
        ZEGO_SERVER_SECRET, 
        roomId, 
        userId, 
        userName
    );
};
