import api from './api';

export const loginApi = async (email: string, password: string) => {
  const response = await api.post('/api/auth/login', { email, password });
  return response.data;
};

export const logoutApi = async () => {
  const response = await api.post('/api/auth/logout');
  return response.data;
};

export const getMeApi = async () => {
  const response = await api.get('/api/auth/me');
  return response.data;
};
