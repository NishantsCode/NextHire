import { apiClient } from '../config/api';

const API_URL = '/api/applications';

export const getAllPublicJobs = async () => {
    const response = await apiClient.get(`${API_URL}/jobs/public`);
    return response.data;
};

export const applyToJob = async (formData) => {
    const response = await apiClient.post(`${API_URL}/apply`, formData, {
        headers: {
            'Content-Type': 'multipart/form-data',
        },
    });
    return response.data;
};

export const getApplicationsByJob = async (jobId) => {
    const response = await apiClient.get(`${API_URL}/job/${jobId}`);
    return response.data;
};

export const updateApplicationStatus = async (id, status) => {
    const response = await apiClient.put(`${API_URL}/${id}/status`, { status });
    return response.data;
};

export const getMyApplications = async () => {
    const response = await apiClient.get(`${API_URL}/my-applications`);
    return response.data;
};

export const getAppliedJobIds = async () => {
    const response = await apiClient.get(`${API_URL}/applied-jobs`);
    return response.data;
};

export const calculateATSScore = async (applicationId) => {
    const response = await apiClient.post(`${API_URL}/ats/calculate/${applicationId}`);
    return response.data;
};

export const calculateJobATSScores = async (jobId) => {
    const response = await apiClient.post(`${API_URL}/ats/calculate-job/${jobId}`);
    return response.data;
};

export const bulkUpdateStatus = async (applicationIds, status) => {
    const response = await apiClient.put(`${API_URL}/bulk/status`, { applicationIds, status });
    return response.data;
};
