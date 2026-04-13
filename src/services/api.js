import axios from 'axios';

const API_BASE_URL = 'http://localhost:8080/api';

// Create axios instance with default config
const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests if available
axiosInstance.interceptors.request.use(
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

// Handle 401/403 responses - clear stale auth data and redirect to login
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && (error.response.status === 401 || error.response.status === 403)) {
      const publicPaths = ['/auth/login', '/auth/register'];
      const requestPath = error.config?.url || '';
      const isPublicRequest = publicPaths.some(p => requestPath.includes(p));
      if (!isPublicRequest) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        if (window.location.pathname !== '/login' && window.location.pathname !== '/register') {
          window.location.href = '/login';
        }
      }
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  login: async (credentials) => {
    try {
      const response = await axiosInstance.post('/auth/login', credentials);
      if (response.data.status === 'success' && response.data.data.token) {
        localStorage.setItem('token', response.data.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.data));
      }
      return response.data;
    } catch (error) {
      console.error('Login error:', error);
      return { status: 'error', message: error.response?.data?.message || 'Login failed' };
    }
  },

  register: async (userData) => {
    try {
      const response = await axiosInstance.post('/auth/register', userData);
      if (response.data.status === 'success' && response.data.data.token) {
        localStorage.setItem('token', response.data.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.data));
      }
      return response.data;
    } catch (error) {
      console.error('Registration error:', error);
      return { status: 'error', message: error.response?.data?.message || 'Registration failed' };
    }
  },

  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  },

  getCurrentUser: () => {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  },

  isAuthenticated: () => {
    return !!localStorage.getItem('token');
  },
};

// Product API
export const productAPI = {
  getAll: async () => {
    try {
      const response = await axiosInstance.get('/products');
      return response.data;
    } catch (error) {
      console.error('Error fetching products:', error);
      return { status: 'error', data: [] };
    }
  },

  getPremium: async () => {
    try {
      const response = await axiosInstance.get('/products/premium');
      return response.data;
    } catch (error) {
      console.error('Error fetching premium products:', error);
      return { status: 'error', data: [] };
    }
  },

  getById: async (id) => {
    try {
      const response = await axiosInstance.get(`/products/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching product:', error);
      return { status: 'error', data: null };
    }
  },

  getByCategory: async (category) => {
    try {
      const response = await axiosInstance.get(`/products/category/${category}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching products by category:', error);
      return { status: 'error', data: [] };
    }
  },

  search: async (keyword) => {
    try {
      const response = await axiosInstance.get(`/products/search?keyword=${keyword}`);
      return response.data;
    } catch (error) {
      console.error('Error searching products:', error);
      return { status: 'error', data: [] };
    }
  },
};

// Order API
export const orderAPI = {
  create: async (orderData) => {
    try {
      const response = await axiosInstance.post('/orders', orderData);
      return response.data;
    } catch (error) {
      console.error('Error creating order:', error);
      return { status: 'error', message: error.response?.data?.message || 'Order creation failed' };
    }
  },

  getUserOrders: async (userId) => {
    try {
      const response = await axiosInstance.get(`/orders/user/${userId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching user orders:', error);
      return { status: 'error', data: [] };
    }
  },

  getById: async (orderId) => {
    try {
      const response = await axiosInstance.get(`/orders/${orderId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching order:', error);
      return { status: 'error', data: null };
    }
  },
};

// User API
export const userAPI = {
  getProfile: async (userId) => {
    try {
      const response = await axiosInstance.get(`/users/${userId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching user profile:', error);
      return { status: 'error', data: null };
    }
  },

  updateProfile: async (userId, userData) => {
    try {
      const response = await axiosInstance.put(`/users/${userId}`, userData);
      return response.data;
    } catch (error) {
      console.error('Error updating user profile:', error);
      return { status: 'error', message: error.response?.data?.message || 'Profile update failed' };
    }
  },

  getCurrentProfile: async () => {
    try {
      const response = await axiosInstance.get('/users/profile');
      return response.data;
    } catch (error) {
      console.error('Error fetching current user profile:', error);
      return { status: 'error', data: null };
    }
  },
};

// Wishlist API
export const wishlistAPI = {
  getAll: async (userId) => {
    try {
      const response = await axiosInstance.get(`/wishlist/user/${userId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching wishlist:', error);
      return { status: 'error', data: [] };
    }
  },

  add: async (userId, productId) => {
    try {
      const response = await axiosInstance.post('/wishlist', { userId, productId });
      return response.data;
    } catch (error) {
      console.error('Error adding to wishlist:', error);
      return { status: 'error', message: error.response?.data?.message || 'Failed to add to wishlist' };
    }
  },

  remove: async (wishlistId) => {
    try {
      const response = await axiosInstance.delete(`/wishlist/${wishlistId}`);
      return response.data;
    } catch (error) {
      console.error('Error removing from wishlist:', error);
      return { status: 'error', message: error.response?.data?.message || 'Failed to remove from wishlist' };
    }
  },
};

// Review API
export const reviewAPI = {
  getByProduct: async (productId) => {
    try {
      const response = await axiosInstance.get(`/reviews/product/${productId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching reviews:', error);
      return { status: 'error', data: [] };
    }
  },

  create: async (reviewData) => {
    try {
      const response = await axiosInstance.post('/reviews', reviewData);
      return response.data;
    } catch (error) {
      console.error('Error creating review:', error);
      return { status: 'error', message: error.response?.data?.message || 'Failed to create review' };
    }
  },

  update: async (reviewId, reviewData) => {
    try {
      const response = await axiosInstance.put(`/reviews/${reviewId}`, reviewData);
      return response.data;
    } catch (error) {
      console.error('Error updating review:', error);
      return { status: 'error', message: error.response?.data?.message || 'Failed to update review' };
    }
  },

  delete: async (reviewId) => {
    try {
      const response = await axiosInstance.delete(`/reviews/${reviewId}`);
      return response.data;
    } catch (error) {
      console.error('Error deleting review:', error);
      return { status: 'error', message: error.response?.data?.message || 'Failed to delete review' };
    }
  },
};

// Cart API
export const cartAPI = {
  get: async (userId) => {
    try {
      const response = await axiosInstance.get(`/cart/user/${userId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching cart:', error);
      return { status: 'error', data: null };
    }
  },

  addItem: async (cartData) => {
    try {
      const response = await axiosInstance.post('/cart/items', cartData);
      return response.data;
    } catch (error) {
      console.error('Error adding to cart:', error);
      return { status: 'error', message: error.response?.data?.message || 'Failed to add to cart' };
    }
  },

  updateItem: async (itemId, quantity) => {
    try {
      const response = await axiosInstance.put(`/cart/items/${itemId}`, { quantity });
      return response.data;
    } catch (error) {
      console.error('Error updating cart item:', error);
      return { status: 'error', message: error.response?.data?.message || 'Failed to update cart' };
    }
  },

  removeItem: async (itemId) => {
    try {
      const response = await axiosInstance.delete(`/cart/items/${itemId}`);
      return response.data;
    } catch (error) {
      console.error('Error removing cart item:', error);
      return { status: 'error', message: error.response?.data?.message || 'Failed to remove item' };
    }
  },

  clear: async (cartId) => {
    try {
      const response = await axiosInstance.delete(`/cart/${cartId}`);
      return response.data;
    } catch (error) {
      console.error('Error clearing cart:', error);
      return { status: 'error', message: error.response?.data?.message || 'Failed to clear cart' };
    }
  },
};

// AI Stylist API
export const aiStylistAPI = {
  chat: async (userId, message) => {
    try {
      const response = await axiosInstance.post('/ai-stylist/chat', { prompt: message });
      return response.data;
    } catch (error) {
      console.error('Error chatting with AI stylist:', error);
      return { status: 'error', message: error.response?.data?.message || 'AI chat failed' };
    }
  },

  getHistory: async () => {
    try {
      const response = await axiosInstance.get('/ai-stylist/history');
      return response.data;
    } catch (error) {
      console.error('Error fetching chat history:', error);
      return { status: 'error', data: [] };
    }
  },

  clearHistory: async () => {
    try {
      const response = await axiosInstance.delete('/ai-stylist/history');
      return response.data;
    } catch (error) {
      console.error('Error clearing chat history:', error);
      return { status: 'error', message: error.response?.data?.message || 'Failed to clear history' };
    }
  },
};

// Mock data for development (when backend is not available)
export const mockProducts = [
  {
    id: 1,
    name: 'Diamond Essence Watch',
    price: 12500,
    imageUrl: 'https://images.unsplash.com/photo-1523170335258-f5ed11844a49?w=600&h=800&fit=crop',
    category: 'Timepieces',
    isPremium: true,
    description: 'Exquisite timepiece crafted with precision',
    stockQuantity: 5,
  },
  {
    id: 2,
    name: 'Platinum Chain Necklace',
    price: 8900,
    imageUrl: 'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=600&h=800&fit=crop',
    category: 'Jewelry',
    isPremium: true,
    description: 'Handcrafted platinum necklace',
    stockQuantity: 8,
  },
  {
    id: 3,
    name: 'Italian Leather Briefcase',
    price: 3200,
    imageUrl: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=600&h=800&fit=crop',
    category: 'Accessories',
    isPremium: true,
    description: 'Premium Italian leather briefcase',
    stockQuantity: 12,
  },
];

// Legacy API compatibility
export const api = {
  getProducts: productAPI.getAll,
  getPremiumProducts: productAPI.getPremium,
  getProductById: productAPI.getById,
};
