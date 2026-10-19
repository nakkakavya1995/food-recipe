import api from './api';
import {
  auth,
  getFirebaseAuth,
  sendPasswordResetEmail,
  isFirebaseLive,
} from '../config/firebase';

export const registerUser = async (userData) => {
  const response = await api.post('/auth/register', userData);
  return response.data;
};

export const loginUser = async (credentials) => {
  const response = await api.post('/auth/login', credentials);

  const data = response.data;
  const token = data.access_token || data.token || data.accessToken;

  if (token) {
    localStorage.setItem('token', token);
  }

  return data;
};

export const loginAdmin = async (credentials) => {
  const response = await api.post('/auth/admin-login', credentials);
  const data = response.data;
  const token = data.access_token || data.token || data.accessToken;

  if (token) {
    localStorage.setItem('token', token);
  }

  return data;
};

export const getCurrentUser = async () => {
  const response = await api.get('/auth/me');
  return response.data;
};

export const logoutUser = () => {
  localStorage.removeItem('token');
};

export const loginWithGoogle = async (googleData) => {
  const response = await api.post('/auth/google', googleData);
  const data = response.data;
  const token = data.access_token || data.token || data.accessToken;

  if (token) {
    localStorage.setItem('token', token);
  }

  return data;
};

export const requestFirebasePasswordReset = async (email) => {
  const activeAuth = getFirebaseAuth() || auth;
  return await sendPasswordResetEmail(activeAuth, email.trim().toLowerCase());
};

export const requestPasswordReset = async (email) => {
  const response = await api.post('/auth/forgot-password', { email: email.trim().toLowerCase() });
  return response.data;
};

export const completePasswordReset = async (email, password, code = '', token = '') => {
  const cleanCode = String(code || token || '').trim();
  const cleanToken = String(token || code || '').trim();
  const response = await api.post('/auth/reset-password', {
    email: email.trim().toLowerCase(),
    password,
    code: cleanCode,
    reset_code: cleanCode,
    token: cleanToken,
    reset_token: cleanToken,
  });
  return response.data;
};

export default {
  registerUser,
  loginUser,
  getCurrentUser,
  logoutUser,
  loginWithGoogle,
  requestFirebasePasswordReset,
  requestPasswordReset,
  completePasswordReset,
};
