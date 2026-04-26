import api from "./axios";

export const authApi = {
  register: (payload) => api.post("/auth/register", payload),
  login: (payload) => api.post("/auth/login", payload),
  verifyEmail: (token) => api.get(`/auth/verify-email?token=${token}`),
  me: () => api.get("/auth/me"),
};
