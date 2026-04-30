import api from "./axios";

export const roomsApi = {
    create:   ()     => api.post("/rooms"),
    getRoom:  (code) => api.get(`/rooms/${code}`),
    close:    (code) => api.delete(`/rooms/${code}`),
};
