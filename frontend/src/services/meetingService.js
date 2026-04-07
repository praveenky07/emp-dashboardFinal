import api from './api';

export const getMeetings = async () => {
    const response = await api.get('/meetings');
    return response.data;
};

export const getMeetingById = async (id) => {
    const response = await api.get(`/meetings/${id}`);
    return response.data;
};

export const createMeeting = async (meetingData) => {
    const response = await api.post('/meetings', meetingData);
    return response.data;
};

export const updateMeeting = async (id, meetingData) => {
    const response = await api.put(`/meetings/${id}`, meetingData);
    return response.data;
};

export const deleteMeeting = async (id) => {
    const response = await api.delete(`/meetings/${id}`);
    return response.data;
};

export const joinMeeting = async (id) => {
    const response = await api.post(`/meetings/${id}/join`);
    return response.data;
};

export const getMeetingAnalytics = async () => {
    const response = await api.get('/meetings/analytics');
    return response.data;
};

export const startMeeting = async (id) => {
    const response = await api.put(`/meetings/${id}`, { status: 'LIVE' });
    return response.data;
};

export const getAvailableUsers = async () => {
    const response = await api.get('/users/available');
    return response.data;
};
