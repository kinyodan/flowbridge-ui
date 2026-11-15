// services/projectsService.js

import {baseApiClient, baseApiClientWithAuth, authApiClient} from "./axios-config";

// This runs ONLY on the client (browser), and useCookie is safe here
const getAuthApi = async (token=null) => {
  return baseApiClientWithAuth(token);
};

export default {
  async authVerify(token) {
    const api = await getAuthApi(token);
    return api.post(`/auth/verify`);
  },

  async tokenAuth(payload) {
    return authApiClient.post(`/token`, payload);
  },

};