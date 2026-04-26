import api from "./axios";

export const meetingsApi = {
    list:    ()               => api.get("/meetings"),
    getOne:  (id)             => api.get(`/meetings/${id}`),
    create:  (payload)        => api.post("/meetings", payload),
    upload:  (title, file)    => {
        const fd = new FormData();
        fd.append("title", title);
        fd.append("file", file);
        return api.post("/meetings/upload", fd, {
            headers: { "Content-Type": "multipart/form-data" },
        });
    },
    remove:  (id)             => api.delete(`/meetings/${id}`),
};
