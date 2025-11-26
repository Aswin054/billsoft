import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const api = axios.create({
  baseURL: `${API_URL}/api`,
  headers: {
    'Content-Type': 'application/json',
  },
})

export const companiesApi = {
  getAll: () => api.get('/companies'),
  getById: (id) => api.get(`/companies/${id}`),
  create: (data) => api.post('/companies', data),
}

export const partnersApi = {
  create: (companyId, data) => api.post(`/companies/${companyId}/partners`, data),
  getById: (id) => api.get(`/partners/${id}`),
}

export const billsApi = {
  create: (partnerId, data) => api.post(`/partners/${partnerId}/bills`, data),
  getAll: (partnerId) => api.get(`/bills/${partnerId}`),
}

export default api
