import api from "./axios";

export const attendanceApi = {
    getToday: () => api.get("/attendance/me/today"),
    checkIn: () => api.post("/attendance/check-in"),
    checkOut: () => api.post("/attendance/check-out"),
    listAll: (forDate) => api.get("/attendance", { params: forDate ? { for_date: forDate } : {} }),
};
