import { apiClient } from '../config/api'

const API_URL = '/api/auth'

export const register = async (userData) => {
  const response = await apiClient.post(`${API_URL}/register`, userData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  })
  return response.data
}

export const login = async (credentials) => {
  const response = await apiClient.post(`${API_URL}/login`, credentials)
  return response.data
}

export const logout = async () => {
  const response = await apiClient.post(`${API_URL}/logout`)
  return response.data
}

export const getMe = async () => {
  const response = await apiClient.get(`${API_URL}/me`)
  return response.data
}

export const updateProfile = async (profileData) => {
  const response = await apiClient.put(`${API_URL}/update-profile`, profileData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  })
  return response.data
}
