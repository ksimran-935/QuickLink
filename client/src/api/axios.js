import axios from "axios";

// Single Axios instance used everywhere in the app.
// baseURL points to /api so all calls just use relative paths like "/auth/login".
const api = axios.create({
  baseURL: `${import.meta.env.VITE_API_URL}/api`,
});

// ── Request interceptor ───────────────────────────────────────────────────────
// Attach the JWT from localStorage to every outgoing request.
// The server's protect middleware reads: Authorization: Bearer <token>
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ── Response interceptor ──────────────────────────────────────────────────────
// If the server returns 401 (token expired / invalid), wipe local auth state
// and redirect to login — no need to handle this in every component.
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

export default api;
