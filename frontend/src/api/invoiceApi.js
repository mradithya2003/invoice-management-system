import axios from 'axios';

const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  withCredentials: true,
});

export const getInvoices = async () => {
  const { data } = await API.get('/invoices');
  return data;
};

export const getInvoice = async (id) => {
  const { data } = await API.get(`/invoices/${id}`);
  return data;
};

export const getInvoiceStats = async () => {
  const { data } = await API.get('/invoices/stats');
  return data;
};

export const createInvoice = async (invoiceData) => {
  const { data } = await API.post('/invoices', invoiceData);
  return data;
};

export const updateInvoice = async (id, invoiceData) => {
  const { data } = await API.put(`/invoices/${id}`, invoiceData);
  return data;
};

export const deleteInvoice = async (id) => {
  const { data } = await API.delete(`/invoices/${id}`);
  return data;
};

export const addInvoiceItem = async (invoiceId, itemData) => {
  const { data } = await API.post(`/invoices/${invoiceId}?action=item`, itemData);
  return data;
};

export const deleteInvoiceItem = async (invoiceId, itemId) => {
  const { data } = await API.delete(`/invoices/${invoiceId}?item_id=${itemId}`);
  return data;
};
