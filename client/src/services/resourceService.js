import api from './api';
import { API_BASE_URL } from '../utils/constants';

export const resourceService = {
  /**
   * Get approved academic resources with optional keyword search and filters
   * @param {Object} params - { search, department, semester, resourceType, subject, sort, page, limit }
   */
  async getResources(params = {}) {
    const response = await api.get('/resources', { params });
    return response.data;
  },

  /**
   * Execute AI-Powered Semantic Vector Search via SentenceTransformers & ChromaDB
   * @param {string} query - Natural language search prompt
   * @param {number} topK - Number of results to retrieve (default: 6)
   */
  async semanticSearch(query, topK = 6) {
    const response = await api.post('/ai/semantic-search', {
      query,
      top_k: topK,
    });
    return response.data;
  },


  /**
   * Get single resource details by ID
   * @param {string} id - Resource ID
   */
  async getResourceById(id) {
    const response = await api.get(`/resources/${id}`);
    return response.data;
  },

  /**
   * Upload a new resource with PDF multipart form-data
   * @param {FormData} formData
   * @param {Function} onProgress - Upload progress callback
   */
  async uploadResource(formData, onProgress) {
    const response = await api.post('/resources/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: (progressEvent) => {
        if (onProgress && progressEvent.total) {
          const percentCompleted = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          );
          onProgress(percentCompleted);
        }
      },
    });
    return response.data;
  },

  /**
   * Get resources uploaded by logged in user
   */
  async getMyResources() {
    const response = await api.get('/resources/my/uploads');
    return response.data;
  },

  /**
   * Update a resource
   * @param {string} id
   * @param {Object} data
   */
  async updateResource(id, data) {
    const response = await api.put(`/resources/${id}`, data);
    return response.data;
  },

  /**
   * Delete a resource
   * @param {string} id
   */
  async deleteResource(id) {
    const response = await api.delete(`/resources/${id}`);
    return response.data;
  },

  /**
   * Download resource URL helper
   * @param {string} id
   */
  getDownloadUrl(id) {
    return `${API_BASE_URL}/resources/${id}/download`;
  },

  /**
   * Admin: Get all resources with moderation status
   */
  async adminGetResources(params = {}) {
    const response = await api.get('/admin/resources', { params });
    return response.data;
  },

  /**
   * Admin: Update status of resource (approved / rejected / pending)
   */
  async adminUpdateStatus(id, status) {
    const response = await api.patch(`/resources/${id}/status`, { status });
    return response.data;
  },

  /**
   * Admin: Get dashboard analytics statistics
   */
  async adminGetStats() {
    const response = await api.get('/admin/stats');
    return response.data;
  },

  /**
   * Admin: Get all registered users
   */
  async adminGetUsers(params = {}) {
    const response = await api.get('/admin/users', { params });
    return response.data;
  },

  /**
   * Admin: Update user role
   */
  async adminUpdateUserRole(id, role) {
    const response = await api.patch(`/admin/users/${id}/role`, { role });
    return response.data;
  },

  /**
   * Admin: Delete user
   */
  async adminDeleteUser(id) {
    const response = await api.delete(`/admin/users/${id}`);
    return response.data;
  },
};
