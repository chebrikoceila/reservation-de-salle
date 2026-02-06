import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});


api.interceptors.request.use(
  (config) => {
    console.log(` ${config.method?.toUpperCase() || 'GET'} ${config.url}`, config.params || '');
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);


api.interceptors.response.use(
  (response) => {
    console.log(` ${response.status} ${response.config.url}`);
    return response.data;
  },
  (error) => {
    console.error(' Erreur API:', error.response?.status, error.response?.data);
    if (error.response?.status === 401) {
      // Token expiré ou invalide
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error.response?.data || { message: 'Erreur serveur' });
  }
);

export const authAPI = {
  register: (userData) => api.post('/auth/register', userData),
  login: (credentials) => api.post('/auth/login', credentials),
  getProfile: () => api.get('/auth/profile'),
  getAllUsers: () => api.get('/auth/users'),
  updateUserRole: (userId, data) => api.put(`/auth/users/${userId}/role`, data),
  deleteUser: (userId) => api.delete(`/auth/users/${userId}`)
};

export const roomAPI = {
  getAll: (params = {}) => {
    const cleanParams = {};
    Object.keys(params).forEach(key => {
      if (params[key] !== '' && params[key] !== null && params[key] !== undefined) {
        cleanParams[key] = params[key];
      }
    });
    
    return api.get('/rooms', { params: cleanParams });
  },
  getById: (id) => api.get(`/rooms/${id}`),
  create: (roomData) => api.post('/rooms', roomData),
  update: (id, roomData) => api.put(`/rooms/${id}`, roomData),
  delete: (id) => api.delete(`/rooms/${id}`),
  getOwnerRooms: () => api.get('/rooms/owner/my-rooms'),
  getOwnerStats: () => api.get('/rooms/owner/stats')
};

export const bookingAPI = {
  create: (bookingData) => api.post('/bookings', bookingData),
  getMyBookings: () => api.get('/bookings/my-bookings'),
  cancel: (id) => api.put(`/bookings/${id}/cancel`),
  getOwnerBookings: () => api.get('/bookings/owner/bookings'),
  confirm: (id) => api.put(`/bookings/${id}/confirm`),
  reject: (id) => api.put(`/bookings/${id}/reject`),
  getAll: () => api.get('/bookings/all')
};

export const reviewAPI = {
  create: (reviewData) => api.post('/reviews', reviewData),
  getRoomReviews: (roomId) => api.get(`/reviews/room/${roomId}`),
  getMyReviews: () => api.get('/reviews/my-reviews')
};

export const adminAPI = {
  getAllUsers: () => api.get('/auth/admin/users'),
  updateUserRole: (userId, data) => api.put(`/auth/users/${userId}/role`, data),
  getAllBookings: () => api.get('/bookings/all'), 
  deleteUser: (userId) => api.delete(`/auth/users/${userId}`) 
};

export default api;