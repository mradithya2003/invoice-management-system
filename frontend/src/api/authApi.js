import axios from 'axios';

const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  withCredentials: true,
});

export const registerUser = async (name, email, password) => {
  const { data } = await API.post('/auth/register', { name, email, password });
  return data;
};

export const loginUser = async (email, password) => {
  const { data } = await API.post('/auth/login', { email, password });
  return data;
};

export const logoutUser = async () => {
  const { data } = await API.post('/auth/logout');
  return data;
};

export const getCurrentUser = async () => {
  const { data } = await API.get('/auth/user');
  return data;
};
