import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

// Create axios instance
const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request interceptor to add auth token
api.interceptors.request.use(
    (config) => {
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

// Response interceptor to handle errors
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            // Token expired or invalid
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            window.location.href = '/';
        }
        return Promise.reject(error);
    }
);

// API methods
const apiService = {
    // Auth
    register: (data) => api.post('/auth/register', data),
    login: (data) => api.post('/auth/login', data),
    logout: () => api.post('/auth/logout'),

    // Student
    getStudentComplaints: (params) => api.get('/api/student/complaints', { params }),
    createComplaint: (data) => api.post('/api/student/complaints', data),
    getComplaintDetails: (id) => api.get(`/api/student/complaints/${id}`),
    submitFeedback: (id, data) => api.post(`/api/student/complaints/${id}/feedback`, data),

    // Worker
    getWorkerComplaints: (params) => api.get('/api/worker/complaints', { params }),
    getWorkerStats: () => api.get('/api/worker/stats'),
    getWorkerComplaintDetails: (id) => api.get(`/api/worker/complaints/${id}`),
    updateComplaintStatus: (id, data) => api.put(`/api/worker/complaints/${id}/status`, data),
    addComplaintNote: (id, data) => api.post(`/api/worker/complaints/${id}/notes`, data),
    reassignComplaint: (id, data) => api.put(`/api/worker/complaints/${id}/reassign`, data),

    // Admin
    getAdminOverview: () => api.get('/api/admin/overview'),
    getAllComplaints: (params) => api.get('/api/admin/complaints', { params }),
    assignComplaint: (id, data) => api.put(`/api/admin/complaints/${id}/assign`, data),
    getAllUsers: (params) => api.get('/api/admin/users', { params }),
    createUser: (data) => api.post('/api/admin/users', data),
    updateUser: (id, data) => api.put(`/api/admin/users/${id}`, data),
    deleteUser: (id) => api.delete(`/api/admin/users/${id}`),
};

export default apiService;
