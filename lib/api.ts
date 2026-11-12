import axios from "axios";

function resolveApiBaseUrl() {
  const configured = (process.env.NEXT_PUBLIC_API_BASE_URL || "").trim();
  if (!configured) return "/api";

  // Ignore localhost URLs in deployed/browser builds and fall back to same-origin API routes.
  if (/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?(\/|$)/i.test(configured)) {
    return "/api";
  }

  return configured;
}

const api = axios.create({
  baseURL: resolveApiBaseUrl(),
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

const localApi = axios.create({
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

let accessToken: string | null = null;

export function setToken(token: string | null) {
  accessToken = token;
  for (const client of [api, localApi]) {
    if (token) {
      client.defaults.headers.common.Authorization = `Bearer ${token}`;
    } else {
      delete client.defaults.headers.common.Authorization;
    }
  };
}

api.interceptors.request.use((config) => {
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  return config;
});

let isRefreshing = false;
let pendingQueue: Array<(token: string | null) => void> = [];

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    const requestUrl = String(originalRequest?.url || "");

    if (
      error.response?.status !== 401 ||
      originalRequest._retry ||
      requestUrl.includes("/auth/login") ||
      requestUrl.includes("/auth/register") ||
      requestUrl.includes("/auth/refresh") ||
      requestUrl.includes("/auth/logout")
    ) {
      throw error;
    }

    originalRequest._retry = true;

    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        pendingQueue.push((token) => {
          if (!token) {
            reject(error);
            return;
          }
          originalRequest.headers.Authorization = `Bearer ${token}`;
          resolve(api(originalRequest));
        });
      });
    }

    try {
      isRefreshing = true;
      const refreshResponse = await api.post("/auth/refresh", {});
      const newToken = refreshResponse.data?.accessToken || null;
      setToken(newToken);
      pendingQueue.forEach((cb) => cb(newToken));
      pendingQueue = [];
      originalRequest.headers.Authorization = `Bearer ${newToken}`;
      return api(originalRequest);
    } catch (refreshError) {
      setToken(null);
      pendingQueue.forEach((cb) => cb(null));
      pendingQueue = [];
      throw refreshError;
    } finally {
      isRefreshing = false;
    }
  },
);

export const authApi = {
  register: (payload: { username: string; email: string; password: string; role: string }) => localApi.post("/api/auth/register", payload),
  login: (payload: { username: string; password: string }) => localApi.post("/api/auth/login", payload),
  refresh: () => localApi.post("/api/auth/refresh", {}),
  logout: () => localApi.post("/api/auth/logout", {}),
  me: () => localApi.get("/api/auth/me"),
  verifyEmail: (token: string) => localApi.post("/api/auth/verify-email", { token }),
  dashboard: async () => {
    const response = await localApi.get("/api/auth/me");
    const walletBalance = Number(response.data?.user?.tokens || 0);
    return {
      data: {
        walletBalance,
      },
    };
  },
};

export const jobsApi = {
  list: () => localApi.get("/api/jobs"),
  byId: (id: string | number) => localApi.get(`/api/jobs/${id}`),
  complete: (id: string | number) => localApi.patch(`/api/jobs/${id}/complete`, {}),
  create: (payload: {
    title: string;
    description: string;
    budget: number;
  }) => localApi.post("/api/jobs", payload),
};

export const proposalsApi = {
  create: (payload: { jobId: number; coverLetter: string }) => localApi.post("/api/proposals", payload),
  listByJob: (jobId: number) => localApi.get(`/api/proposals?jobId=${jobId}`),
  inbox: () => localApi.get("/api/proposals/inbox"),
  updateStatus: (proposalId: number, status: "SHORTLISTED" | "ACCEPTED" | "REJECTED") =>
    localApi.patch(`/api/proposals/${proposalId}/status`, { status }),
};

export const messagesApi = {
  listByProposal: (proposalId: number) => localApi.get(`/api/messages?proposalId=${proposalId}`),
  create: (payload: { proposalId: number; body: string }) => localApi.post("/api/messages", payload),
};

export const notificationsApi = {
  list: (limit = 30) => localApi.get(`/api/notifications?limit=${limit}`),
  markRead: (notificationId: number) => localApi.patch("/api/notifications", { notificationId }),
  markAllRead: () => localApi.patch("/api/notifications", { markAllRead: true }),
};

export const reviewsApi = {
  listByJob: (jobId: number) => localApi.get(`/api/reviews?jobId=${jobId}`),
  listByTargetUser: (targetUserId: number) => localApi.get(`/api/reviews?targetUserId=${targetUserId}`),
  create: (payload: { jobId: number; rating: number; comment: string }) => localApi.post("/api/reviews", payload),
};

export const savedJobsApi = {
  list: () => localApi.get("/api/saved/jobs"),
  toggle: (jobId: number) => localApi.post("/api/saved/jobs", { jobId }),
};

export const savedFreelancersApi = {
  list: () => localApi.get("/api/saved/freelancers"),
  toggle: (freelancerId: number) => localApi.post("/api/saved/freelancers", { freelancerId }),
};

export const freelancersApi = {
  list: () => localApi.get("/api/freelancers"),
};

export const adminApi = {
  overview: () => localApi.get("/api/admin/overview"),
};

export const freelancerProfileApi = {
  me: () => localApi.get("/api/freelancer-profile"),
  byId: (freelancerId: number) => localApi.get(`/api/freelancer-profile/${freelancerId}`),
  save: (payload: {
    professionalTitle: string;
    bio: string;
    skills: string;
    experienceLevel: "ENTRY" | "INTERMEDIATE" | "EXPERT";
    hourlyRateUsd: number;
    country: string;
    city: string;
    phone?: string;
    languages: string;
    portfolioUrl?: string;
    githubUrl?: string;
    linkedinUrl?: string;
    education?: string;
    certifications?: string;
    availability: "FULL_TIME" | "PART_TIME" | "AS_NEEDED";
    preferredWorkingHours?: string;
    responseTime: "WITHIN_HOUR" | "WITHIN_DAY" | "WITHIN_2_DAYS";
  }) => localApi.post("/api/freelancer-profile", payload),
};

export const clientProfileApi = {
  me: () => localApi.get("/api/client-profile"),
  save: (payload: {
    accountType: "INDIVIDUAL" | "COMPANY";
    displayName: string;
    companyName?: string;
    about: string;
    companySize: "SOLO" | "SMALL" | "MID" | "LARGE" | "ENTERPRISE";
    websiteUrl?: string;
    country: string;
    timezone: string;
    phone?: string;
    linkedinUrl?: string;
    preferredLanguages: string;
    budgetRange: "UNDER_1K" | "ONE_TO_FIVE_K" | "FIVE_TO_TEN_K" | "TEN_PLUS";
    hiringGoals: string;
    communicationPreference: "CHAT_EMAIL" | "VIDEO_CALLS" | "FLEXIBLE";
    responseExpectation: "WITHIN_24H" | "WITHIN_3_DAYS" | "FLEXIBLE";
  }) => localApi.post("/api/client-profile", payload),
};

export const projectsApi = {
  list: () => localApi.get("/api/projects"),
  get: (id: number | string) => localApi.get(`/api/projects/${id}`),
  update: (
    id: number | string,
    data: {
      status?: "ACTIVE" | "IN_REVIEW" | "COMPLETED" | "DISPUTED" | "CANCELLED";
      maxRevisions?: number | null;
    },
  ) => localApi.patch(`/api/projects/${id}`, data),
  milestones: {
    list: (projectId: number | string) => localApi.get(`/api/projects/${projectId}/milestones`),
    create: (
      projectId: number | string,
      data: {
        title: string;
        description?: string;
        amount: number;
        dueDate?: string | null;
        fundEscrow?: boolean;
      },
    ) => localApi.post(`/api/projects/${projectId}/milestones`, data),
    update: (
      projectId: number | string,
      milestoneId: number | string,
      data: {
        title?: string;
        description?: string | null;
        amount?: number;
        dueDate?: string | null;
        status?: "PENDING" | "IN_PROGRESS" | "COMPLETED" | "RELEASED";
        action?: "FUND_ESCROW";
      },
    ) => localApi.patch(`/api/projects/${projectId}/milestones/${milestoneId}`, data),
    remove: (projectId: number | string, milestoneId: number | string) =>
      localApi.delete(`/api/projects/${projectId}/milestones/${milestoneId}`),
    release: (projectId: number | string, milestoneId: number | string) =>
      localApi.post(`/api/projects/${projectId}/milestones/${milestoneId}/release`, {}),
  },
  deliverables: {
    list: (projectId: number | string) => localApi.get(`/api/projects/${projectId}/deliverables`),
    get: (projectId: number | string, deliverableId: number | string) =>
      localApi.get(`/api/projects/${projectId}/deliverables/${deliverableId}`),
    create: (
      projectId: number | string,
      data: {
        title: string;
        description?: string;
        milestoneId?: number | null;
        dueDate?: string | null;
        fileUrls?: string[];
        submitNow?: boolean;
      },
    ) => localApi.post(`/api/projects/${projectId}/deliverables`, data),
    update: (
      projectId: number | string,
      deliverableId: number | string,
      data: {
        title?: string;
        description?: string | null;
        milestoneId?: number | null;
        dueDate?: string | null;
        fileUrls?: string[];
        status?: "DRAFT" | "SUBMITTED" | "IN_REVIEW" | "REVISION_REQUESTED" | "RESUBMITTED" | "APPROVED";
        feedback?: string;
      },
    ) => localApi.patch(`/api/projects/${projectId}/deliverables/${deliverableId}`, data),
    remove: (projectId: number | string, deliverableId: number | string) =>
      localApi.delete(`/api/projects/${projectId}/deliverables/${deliverableId}`),
    comments: {
      list: (projectId: number | string, deliverableId: number | string) =>
        localApi.get(`/api/projects/${projectId}/deliverables/${deliverableId}/comments`),
      create: (projectId: number | string, deliverableId: number | string, body: string) =>
        localApi.post(`/api/projects/${projectId}/deliverables/${deliverableId}/comments`, { body }),
    },
  },
  messages: {
    list: (projectId: number | string) => localApi.get(`/api/projects/${projectId}/messages`),
    send: (
      projectId: number | string,
      data: { body: string; fileUrl?: string | null; fileName?: string | null },
    ) => localApi.post(`/api/projects/${projectId}/messages`, data),
  },
  activity: (projectId: number | string) => localApi.get(`/api/projects/${projectId}/activity`),
  uploadFile: (projectId: number | string, file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    return localApi.post(`/api/projects/${projectId}/upload`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },
};

export default api;
