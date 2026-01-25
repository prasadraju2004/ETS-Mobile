import axios from "axios";

// REPLACE WITH YOUR COMPUTER'S LOCAL IP (Run 'ipconfig' or 'ifconfig' to find it)
// NOTE: 'localhost' will NOT work on Android (it refers to the phone itself).
// Use your computer's IP address (e.g., 192.168.x.x) or "http://10.0.2.2:5000" for the Android Emulator.
// Using LAN IP instead of 10.0.2.2 because emulator localhost wasn't reachable
const API_URL = "http://192.168.0.103:5000";

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
