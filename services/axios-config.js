import axios from "axios";

// Use runtime config - this works on both client and server side

// Get base URL from config, fallback to localhost for dev
const baseApiUrl =  "https://intraq-backend.onrender.com"
//const baseApiUrl =  "http://localhost:8000"

console.log(`🌐 API Base URL: ${baseApiUrl}`)

export const baseApiClient = axios.create({
  baseURL: `${baseApiUrl}`,
  withCredentials: false, // This is the default
  headers: {

  }
})

export const authApiClient = axios.create({
  baseURL: `${baseApiUrl}`,
  withCredentials: false, // This is the default
  headers: {
    "Content-Type": "application/json",
  }
})

export const baseApiClientWithAuth = (token) => {
  return axios.create({
    baseURL: baseApiUrl,
    withCredentials: false,
    headers: {
      Authorization: token ? `Bearer ${token}` : "",
      'Content-Type': 'multipart/form-data',
    },
  });
};
