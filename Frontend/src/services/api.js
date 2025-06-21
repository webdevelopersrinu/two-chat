import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
})

// Add token to requests if it exists
api.interceptors.request.use(
  config => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  error => {
    return Promise.reject(error)
  }
)

export const authService = {
  register: (username, displayName, password) => 
    api.post('/auth/register', { username, displayName, password }),
  login: (username, password) => 
    api.post('/auth/login', { username, password }),
  logout: () => api.post('/auth/logout'),
  getMe: () => api.get('/auth/me')
}

export const userService = {
  searchUsers: (query) => api.get('/users/search', { params: { query } }),
  getUserById: (userId) => api.get(`/users/${userId}`),
  updateProfile: (data) => api.put('/users/profile', data)
}

export const chatService = {
  getConversations: () => api.get('/chat/conversations'),
  getOrCreateConversation: (otherUserId) => 
    api.get(`/chat/conversation/${otherUserId}`),
  getMessages: (conversationId, page = 1) => 
    api.get(`/chat/messages/${conversationId}`, { params: { page } }),
  markAsRead: (conversationId) => 
    api.put(`/chat/messages/${conversationId}/read`)
}

export default api