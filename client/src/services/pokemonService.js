import axios from 'axios';
import authService from './authService';

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';
const API_URL = `${BASE_URL}/api/pokemon`;

const getAuthHeader = () => {
  const token = authService.getToken();
  return {
    headers: {
      Authorization: `Bearer ${token}`
    }
  };
};

const pokemonService = {
  getAll: async (category = null) => {
    const params = category ? `?category=${category}` : '';
    const response = await axios.get(`${API_URL}${params}`, getAuthHeader());
    return response.data;
  },

  getOne: async (id) => {
    const response = await axios.get(`${API_URL}/${id}`, getAuthHeader());
    return response.data;
  },

  create: async (pokemon) => {
    const response = await axios.post(API_URL, pokemon, getAuthHeader());
    return response.data;
  },

  update: async (id, pokemon) => {
    const response = await axios.put(`${API_URL}/${id}`, pokemon, getAuthHeader());
    return response.data;
  },

  delete: async (id) => {
    const response = await axios.delete(`${API_URL}/${id}`, getAuthHeader());
    return response.data;
  },

  getStats: async () => {
    const response = await axios.get(`${API_URL}/stats`, getAuthHeader());
    return response.data;
  }
};

export default pokemonService;
