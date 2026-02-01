import axios from 'axios'

// API Configuration
export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000'

// Create axios instance with base configuration
export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json'
  }
})

// API endpoints
export const API_ENDPOINTS = {
  AUTH: '/api/auth',
  JOBS: '/api/jobs',
  APPLICATIONS: '/api/applications'
}

// Helper to get full URL for file downloads
export const getFileUrl = (path) => {
  if (!path) return '#'
  return `${API_BASE_URL}/${path}`
}
