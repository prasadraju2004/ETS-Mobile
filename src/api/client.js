import axios from "axios";

// API URL is now configured in .env file
// Update EXPO_PUBLIC_API_URL in .env when you change networks
// For Android Emulator: use http://10.0.2.2:5000
// For Physical Device: use your computer's LAN IP (e.g., http://192.168.x.x:5000)
const API_URL = process.env.EXPO_PUBLIC_API_URL || "http://localhost:5000";

console.log("API URL:", API_URL); // For debugging

export const client = axios.create({
  baseURL: API_URL,
  timeout: 10000, // 10 second timeout
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor for debugging
client.interceptors.request.use(
  (config) => {
    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

// Response interceptor for debugging
client.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response) {
    } else if (error.request) {
    }
    return Promise.reject(error);
  },
);
