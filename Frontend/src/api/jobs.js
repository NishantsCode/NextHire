import { apiClient } from '../config/api';

const API_URL = '/api/jobs';

export const createJob = async (formData) => {
    const response = await apiClient.post(`${API_URL}/create`, formData, {
        headers: {
            'Content-Type': 'multipart/form-data',
        },
    });
    return response.data;
};

export const getJobs = async () => {
    const response = await apiClient.get(API_URL);
    return response.data;
};

export const getJobById = async (id) => {
    const response = await apiClient.get(`${API_URL}/${id}`);
    return response.data;
};

export const updateJob = async (id, data) => {
    const response = await apiClient.put(`${API_URL}/${id}`, data);
    return response.data;
};

export const deleteJob = async (id) => {
    const response = await apiClient.delete(`${API_URL}/${id}`);
    return response.data;
};

export const getAvailableJobs = async () => {
    const response = await apiClient.get('/api/applications/jobs/public');
    return response.data;
};
