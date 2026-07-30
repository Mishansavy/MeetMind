import api from "./axios";

export const employeesApi = {
    create: (payload) => api.post("/employees", payload),
    update: (id, payload) => api.put(`/employees/${id}`, payload),
};
