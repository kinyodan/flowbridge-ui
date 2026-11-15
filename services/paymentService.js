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
  async postReference(data) {
    const api = await getAuthApi();
    return api.post(`/payment_reference`, data);
  },
};