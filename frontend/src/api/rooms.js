import api from "./axios";

export const roomsApi = {
    create:     (payload = {})  => api.post("/rooms", payload),
    getRoom:    (code)          => api.get(`/rooms/${code}`),
    close:      (code)          => api.delete(`/rooms/${code}`),
    transcribe: (code, formData) => api.post(`/rooms/${code}/transcribe`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
    }),
    uploadRecording: (code, formData) => api.post(`/rooms/${code}/recordings`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
    }),
    listRecordings: (code) => api.get(`/rooms/${code}/recordings`),
    downloadRecording: (id) => api.get(`/rooms/recordings/${id}/file`, { responseType: "blob" }),
};
