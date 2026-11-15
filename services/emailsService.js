
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
  // Get all clients/emails
  async getEmails(client_id) {
    const api = await getAuthApi();
    return api.get(`/client/emails/${client_id}`);
  },

  async sendReply(data) {
    const api = await getAuthApi();
    return api.post(`/api/emails/reply`, data);
  },

};