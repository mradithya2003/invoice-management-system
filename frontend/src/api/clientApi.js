import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || '/api'

const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
})

export const getClients = () => api.get('/clients').then(r => r.data)
export const getClient = (id) => api.get(`/clients/${id}`).then(r => r.data)
export const createClient = (data) => api.post('/clients', data).then(r => r.data)
export const updateClient = (id, data) => api.put(`/clients/${id}`, data).then(r => r.data)
export const deleteClient = (id) => api.delete(`/clients/${id}`).then(r => r.data)
