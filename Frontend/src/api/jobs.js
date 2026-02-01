import axios from 'axios';

const API_URL = '/api/jobs';

axios.defaults.withCredentials = true;

export const createJob = async (formData) => {
    const response = await axios.post(`${API_URL}/create`, formData, {
        headers: {
            'Content-Type': 'multipart/form-data',
        },
    });
    return response.data;
};

export const getJobs = async () => {
    const response = await axios.get(API_URL);
    return response.data;
};

export const getJobById = async (id) => {
    const response = await axios.get(`${API_URL}/${id}`);
    return response.data;
};

export const updateJob = async (id, data) => {
    const response = await axios.put(`${API_URL}/${id}`, data);
    return response.data;
};

export const deleteJob = async (id) => {
    const response = await axios.delete(`${API_URL}/${id}`);
    return response.data;
};

export const getAvailableJobs = async () => {
    const response = await axios.get('/api/applications/jobs/public');
    return response.data;
};
