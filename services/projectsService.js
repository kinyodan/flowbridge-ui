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
  async getProjects(setClientId) {
    const api = await getAuthApi();
    return api.get(`/datasets?client_id=${setClientId}`);
  },

  async uploadDataset(data) {
    const api = await getAuthApi();
    return api.post(`/upload_dataset`, data);
  },

  async setPackage(data) {
    const api = await getAuthApi();
    return api.post(`/set_package`, data);
  },

  async getPackages(client_id) {
    const api = await getAuthApi();
    return api.get(`/packages/${client_id}`,);
  },

  async getProjectCodeDataset(project_code) {
    const api = await getAuthApi();
    return api.get(`/datasets/${project_code}`);
  },

  async deleteProject(project_id) {
    const api = await getAuthApi();
    return api.post(`/api/projects/${project_id}"`);
  },

  async deleteDataset(dataset_id) {
    const api = await getAuthApi();
    return api.post(`/api/datsets/${dataset_id}"`);
  },

  async archiveProject(year_id) {
    const api = await getAuthApi();
    return api.post(`/api/years/${year_id}/update-a-year`);
  },

  async trashProject(year_id) {
    const api = await getAuthApi();
    return api.post(`/api/years/${year_id}/delete-a-year`);
  },
};