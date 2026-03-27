import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || '/api'

const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
})

export const getInvoices = () => api.get('/invoices').then(r => r.data)
export const getInvoice = (id) => api.get(`/invoices/${id}`).then(r => r.data)
export const createInvoice = (data) => api.post('/invoices', data).then(r => r.data)
export const updateInvoice = (id, data) => api.put(`/invoices/${id}`, data).then(r => r.data)
export const deleteInvoice = (id) => api.delete(`/invoices/${id}`).then(r => r.data)
export const getInvoiceStats = () => api.get('/invoices/stats').then(r => r.data)

export const addInvoiceItem = (id, data) =>
  api.post(`/invoices/${id}?action=item`, data).then(r => r.data)

export const deleteInvoiceItem = (id, itemId) =>
  api.delete(`/invoices/${id}?action=item&item_id=${itemId}`).then(r => r.data)
