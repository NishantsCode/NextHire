import axios from 'axios'

const API_URL = '/api/auth'

axios.defaults.withCredentials = true

export const register = async (userData) => {
  const response = await axios.post(`${API_URL}/register`, userData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  })
  return response.data
}

export const login = async (credentials) => {
  const response = await axios.post(`${API_URL}/login`, credentials)
  return response.data
}

export const logout = async () => {
  const response = await axios.post(`${API_URL}/logout`)
  return response.data
}

export const getMe = async () => {
  const response = await axios.get(`${API_URL}/me`)
  return response.data
}

export const updateProfile = async (profileData) => {
  const response = await axios.put(`${API_URL}/update-profile`, profileData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  })
  return response.data
}
