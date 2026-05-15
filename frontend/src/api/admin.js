import api from "./axios";

export const adminApi = {
  getPending: () => api.get("/admin/users/pending"),
  getAllUsers: () => api.get("/admin/users"),
  approveUser: (id) => api.post(`/admin/users/${id}/approve`),
  removeUser: (id) => api.delete(`/admin/users/${id}`),
  getAllTasks: () => api.get("/admin/tasks"),
};
