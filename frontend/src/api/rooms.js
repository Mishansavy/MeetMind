import api from "./axios";

export const roomsApi = {
    create:     ()              => api.post("/rooms"),
    getRoom:    (code)          => api.get(`/rooms/${code}`),
    close:      (code)          => api.delete(`/rooms/${code}`),
    transcribe: (code, formData) => api.post(`/rooms/${code}/transcribe`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
    }),
};
