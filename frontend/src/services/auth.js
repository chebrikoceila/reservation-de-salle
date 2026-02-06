import { authAPI } from './api';

export const authService = {
  login: async (email, password) => {
    try {
      const response = await authAPI.login({ email, password });
      return response;
    } catch (error) {
      return { success: false, message: error.message || 'Erreur de connexion' };
    }
  },

  register: async (userData) => {
    try {
      const response = await authAPI.register(userData);
      return response;
    } catch (error) {
      return { success: false, message: error.message || 'Erreur d\'inscription' };
    }
  },

  getProfile: async () => {
    try {
      const response = await authAPI.getProfile();
      return response;
    } catch (error) {
      return { success: false, message: error.message || 'Erreur de récupération du profil' };
    }
  },

  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  },

  isAuthenticated: () => {
    return !!localStorage.getItem('token');
  },

  getCurrentUser: () => {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  }
};