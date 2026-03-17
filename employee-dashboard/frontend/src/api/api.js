import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

const api = axios.create({
    baseURL: API_URL,
});

// Request interceptor to add token
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
}, (error) => {
    return Promise.reject(error);
});

export const authAPI = {
    login: (credentials) => api.post('/auth/login', credentials),
};

export const employeeAPI = {
    getAll: () => api.get('/employees'),
    getById: (id) => api.get(`/employees/${id}`),
    create: (data) => api.post('/employees', data),
    update: (id, data) => api.put(`/employees/${id}`, data),
    delete: (id) => api.delete(`/employees/${id}`),
};

export const attendanceAPI = {
    getAll: () => api.get('/attendance'),
    checkIn: (data) => api.post('/attendance/checkin', data),
    checkOut: (data) => api.post('/attendance/checkout', data),
};

export const breakAPI = {
    getAll: () => api.get('/breaks'),
    start: (data) => api.post('/breaks/start', data),
    end: (data) => api.post('/breaks/end', data),
};

export const leaveAPI = {
    getAll: () => api.get('/leaves'),
    apply: (data) => api.post('/leaves', data),
    updateStatus: (id, status) => api.put(`/leaves/${id}`, { status }),
};

export const bonusAPI = {
    getAll: () => api.get('/bonuses'),
    assign: (data) => api.post('/bonuses', data),
};

export const dashboardAPI = {
    getStats: () => api.get('/dashboard/stats'),
};

export const meetingAPI = {
    getAll: () => api.get('/meetings'),
    log: (data) => api.post('/meetings/log', data),
    getMy: () => api.get('/meetings/my'),
};

export default api;
