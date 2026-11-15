// services/projectsService.js

import {baseApiClient, baseApiClientWithAuth} from "./axios-config";

// This runs ONLY on the client (browser), and useCookie is safe here
const getAuthApi = async () => {
  let token = null;

  if (process.client) {
    // Correct way in Nuxt 3: dynamic import of composables
    const { useCookie } = await import('#imports');
    const cookie = useCookie('auth_token');
    token = cookie.value || null;
  }

  return baseApiClientWithAuth(token);
};

export default {
  async dataProcessing(params) {
    const api = await getAuthApi();
    return api.post(`/api/process_session_data`, params);
  },

  async uploadDataset(data) {
    const api = await getAuthApi();
    return api.get(`/upload_dataset`, data);
  },

};