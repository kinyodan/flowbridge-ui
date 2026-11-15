// services/clientsService.js

import {baseApiClientWithAuth} from "./axios-config";

// Get auth token and return configured API client
const getAuthApi = async () => {
  let token = null;

  if (process.client) {
    const { useCookie } = await import('#imports');
    const cookie = useCookie('auth_token');
    token = cookie.value || null;
  }

  return baseApiClientWithAuth(token);
};

export default {
  // Get all clients/users
  async getClients() {
    const api = await getAuthApi();
    return api.get('/clients');
  },

  // Alternative endpoint for users
  async getUsers() {
    const api = await getAuthApi();
    return api.get('/users');
  },

  // Get single client by ID
  async getClient(clientId) {
    const api = await getAuthApi();
    return api.get(`/clients/${clientId}`);
  },

  // Get client projects
  async getClientProjects(clientId) {
    const api = await getAuthApi();
    return api.get(`/projects?client_id=${clientId}`);
  }
};