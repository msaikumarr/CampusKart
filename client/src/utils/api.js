import axios from "axios";

const fallbackApiUrl = import.meta.env.DEV ? "http://localhost:5000" : "";
export const API_BASE_URL = import.meta.env.VITE_API_URL || fallbackApiUrl;

const API = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
});

export default API;
