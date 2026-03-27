import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || '/api'

const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
})

export const register = (data) => api.post('/auth/register', data).then(r => r.data)
export const login = (data) => api.post('/auth/login', data).then(r => r.data)
export const logout = () => api.post('/auth/logout').then(r => r.data)
export const getCurrentUser = () => api.get('/auth/user').then(r => r.data)
