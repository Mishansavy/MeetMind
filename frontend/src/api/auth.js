import api from "./axios";

export const authApi = {
    register:       (payload) => api.post("/auth/register", payload),
    login:          (payload) => api.post("/auth/login", payload),
    verifyEmail:    (token)   => api.get(`/auth/verify-email?token=${token}`),
    me:             ()        => api.get("/auth/me"),
    stats:          ()        => api.get("/auth/me/stats"),
    otpRequest:     (email)   => api.post("/auth/otp/request", { email }),
    otpVerify:      (email, otp) => api.post("/auth/otp/verify", { email, otp }),
    forgotPassword: (email)   => api.post("/auth/forgot-password", { email }),
    resetPassword:  (token, new_password) => api.post("/auth/reset-password", { token, new_password }),
};
