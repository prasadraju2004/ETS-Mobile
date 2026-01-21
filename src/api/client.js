import axios from "axios";

// REPLACE WITH YOUR COMPUTER'S LOCAL IP (Run 'ipconfig' or 'ifconfig' to find it)
// NOTE: 'localhost' will NOT work on Android (it refers to the phone itself).
// Use your computer's IP address (e.g., 192.168.x.x) or "http://10.0.2.2:5000" for the Android Emulator.
const API_URL = "http://192.168.0.103:5000";

export const client = axios.create({
  baseURL: API_URL,
});
