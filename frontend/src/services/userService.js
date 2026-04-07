import api from './api';

export const getUserProfile = async () => {
    const response = await api.get('/users/profile');
    return response.data;
};


export const updateProfile = async (data) => {
    const response = await api.post('/auth/update-profile', data);
    return response.data;
};

export const updatePassword = async (data) => {
    const response = await api.post('/auth/update-password', data);
    return response.data;
};

export const uploadProfileImage = async (file) => {
    const formData = new FormData();
    formData.append('image', file);

    const response = await api.post('/upload/profile', formData, {
        headers: {
            'Content-Type': 'multipart/form-data',
        },
    });
    return response.data;
};
