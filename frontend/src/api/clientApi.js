import axios from 'axios';

const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  withCredentials: true,
});

export const getClients = async () => {
  const { data } = await API.get('/clients');
  return data;
};

export const getClient = async (id) => {
  const { data } = await API.get(`/clients/${id}`);
  return data;
};

export const createClient = async (clientData) => {
  const { data } = await API.post('/clients', clientData);
  return data;
};

export const updateClient = async (id, clientData) => {
  const { data } = await API.put(`/clients/${id}`, clientData);
  return data;
};

export const deleteClient = async (id) => {
  const { data } = await API.delete(`/clients/${id}`);
  return data;
};
