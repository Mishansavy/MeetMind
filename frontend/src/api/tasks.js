import api from "./axios";

export const tasksApi = {
    list: ()                          => api.get("/tasks"),
    create: (payload)                 => api.post("/tasks", payload),
    update: (id, payload)             => api.patch(`/tasks/${id}`, payload),
    remove: (id)                      => api.delete(`/tasks/${id}`),
    extractFromNote: (noteId)         => api.post(`/meetings/${noteId}/extract`),
    bulkSave: (noteId, tasks)         => api.post(`/meetings/${noteId}/tasks`, tasks),
};
