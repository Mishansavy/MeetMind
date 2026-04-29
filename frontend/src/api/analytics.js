import api from "./axios";

export const analyticsApi = {
    meetingsPerWeek: () => api.get("/analytics/meetings-per-week"),
    taskCompletion:  () => api.get("/analytics/task-completion"),
    workload:        () => api.get("/analytics/workload"),
};
