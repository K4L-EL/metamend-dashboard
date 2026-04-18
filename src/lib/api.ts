import axios from "axios";
import type {
  DashboardSummary,
  DashboardTrends,
  Infection,
  InfectionDetail,
  Patient,
  PatientRisk,
  Outbreak,
  OutbreakDetail,
  ForecastRiskScore,
  LocationRisk,
  ForecastTrend,
  Alert,
  ScreeningCompliance,
  ScreeningRecord,
  ResistanceSummary,
  PrescribingRecord,
  TransmissionNetwork,
  DeviceSummary,
  DeviceInfection,
  CreatePatientRequest,
  CreateInfectionRequest,
  CreateAlertRequest,
  CreateOutbreakRequest,
  CreateScreeningRecordRequest,
  CreateDeviceInfectionRequest,
  Pipeline,
  CreatePipelineRequest,
  ReportRequest,
  ReportResponse,
  AuthResponse,
  AuthUser,
  TeamSummary,
  TeamDetail,
  TeamInviteDto,
  AdminTeamRow,
  AdminInviteRow,
  BlogArticle,
  BlogArticleListItem,
  ArticleUpsertRequest,
  GenerateArticleRequest,
} from "../types";

declare global {
  interface Window {
    __API_BASE__?: string;
  }
}

const apiBase =
  (typeof window !== "undefined" && window.__API_BASE__) || "/api";

const client = axios.create({ baseURL: apiBase });

const TOKEN_KEY = "metamed.session";

client.interceptors.request.use((config) => {
  if (typeof window === "undefined") return config;
  try {
    const raw = localStorage.getItem(TOKEN_KEY);
    if (raw) {
      const session = JSON.parse(raw) as { token?: string };
      if (session?.token) {
        config.headers = config.headers ?? {};
        (config.headers as Record<string, string>).Authorization = `Bearer ${session.token}`;
      }
    }
  } catch {
    // ignore
  }
  return config;
});

client.interceptors.response.use(
  (r) => r,
  (error) => {
    if (typeof window !== "undefined" && error?.response?.status === 401) {
      try {
        localStorage.removeItem(TOKEN_KEY);
      } catch {
        // ignore
      }
      const path = window.location.pathname;
      if (path.startsWith("/app") && !path.startsWith("/login")) {
        window.location.href = `/login?redirect=${encodeURIComponent(path + window.location.search)}`;
      }
    }
    return Promise.reject(error);
  },
);

export const api = {
  dashboard: {
    getSummary: () =>
      client.get<DashboardSummary>("/dashboard/summary").then((r) => r.data),
    getTrends: (days = 30) =>
      client
        .get<DashboardTrends>("/dashboard/trends", { params: { days } })
        .then((r) => r.data),
  },

  infections: {
    getAll: (params?: { status?: string; ward?: string }) =>
      client.get<Infection[]>("/infections", { params }).then((r) => r.data),
    getById: (id: string) =>
      client.get<InfectionDetail>(`/infections/${id}`).then((r) => r.data),
    create: (data: CreateInfectionRequest) =>
      client.post<Infection>("/infections", data).then((r) => r.data),
  },

  patients: {
    getAll: (params?: { ward?: string; status?: string }) =>
      client.get<Patient[]>("/patients", { params }).then((r) => r.data),
    getById: (id: string) =>
      client.get<Patient>(`/patients/${id}`).then((r) => r.data),
    getRisk: (id: string) =>
      client.get<PatientRisk>(`/patients/${id}/risk`).then((r) => r.data),
    create: (data: CreatePatientRequest) =>
      client.post<Patient>("/patients", data).then((r) => r.data),
  },

  outbreaks: {
    getAll: (params?: { status?: string }) =>
      client.get<Outbreak[]>("/outbreaks", { params }).then((r) => r.data),
    getById: (id: string) =>
      client.get<OutbreakDetail>(`/outbreaks/${id}`).then((r) => r.data),
    create: (data: CreateOutbreakRequest) =>
      client.post<Outbreak>("/outbreaks", data).then((r) => r.data),
  },

  forecasts: {
    getRiskScores: () =>
      client
        .get<ForecastRiskScore[]>("/forecasts/risk-scores")
        .then((r) => r.data),
    getLocationRisks: () =>
      client
        .get<LocationRisk[]>("/forecasts/location-risks")
        .then((r) => r.data),
    getTrends: (days = 14) =>
      client
        .get<ForecastTrend[]>("/forecasts/trends", { params: { days } })
        .then((r) => r.data),
  },

  alerts: {
    getAll: (unreadOnly?: boolean) =>
      client
        .get<Alert[]>("/alerts", { params: { unreadOnly } })
        .then((r) => r.data),
    markAsRead: (id: string) =>
      client.patch<Alert>(`/alerts/${id}/read`).then((r) => r.data),
    create: (data: CreateAlertRequest) =>
      client.post<Alert>("/alerts", data).then((r) => r.data),
  },

  screening: {
    getCompliance: () =>
      client.get<ScreeningCompliance[]>("/screening/compliance").then((r) => r.data),
    getRecords: (params?: { ward?: string; status?: string }) =>
      client.get<ScreeningRecord[]>("/screening/records", { params }).then((r) => r.data),
    createRecord: (data: CreateScreeningRecordRequest) =>
      client.post<ScreeningRecord>("/screening/records", data).then((r) => r.data),
  },

  resistance: {
    getSummaries: () =>
      client.get<ResistanceSummary[]>("/resistance/summaries").then((r) => r.data),
    getPrescriptions: (antibiotic?: string) =>
      client.get<PrescribingRecord[]>("/resistance/prescriptions", { params: { antibiotic } }).then((r) => r.data),
  },

  transmission: {
    getNetwork: (organism?: string) =>
      client.get<TransmissionNetwork>("/transmission/network", { params: { organism } }).then((r) => r.data),
  },

  devices: {
    getSummaries: () =>
      client.get<DeviceSummary[]>("/devices/summaries").then((r) => r.data),
    getInfections: (deviceType?: string) =>
      client.get<DeviceInfection[]>("/devices/infections", { params: { deviceType } }).then((r) => r.data),
    createInfection: (data: CreateDeviceInfectionRequest) =>
      client.post<DeviceInfection>("/devices/infections", data).then((r) => r.data),
  },

  ai: {
    chat: (query: string) =>
      client.post<{ response: string }>("/ai/chat", { query }).then((r) => r.data.response),
  },

  reports: {
    generate: (data?: ReportRequest) =>
      client.post<ReportResponse>("/report/generate", data ?? {}).then((r) => r.data),
  },

  auth: {
    register: (data: { email: string; password: string; displayName: string; title?: string; organization?: string; inviteToken?: string }) =>
      client.post<AuthResponse>("/auth/register", data).then((r) => r.data),
    login: (data: { email: string; password: string }) =>
      client.post<AuthResponse>("/auth/login", data).then((r) => r.data),
    logout: () => client.post("/auth/logout").then(() => undefined),
    me: () => client.get<AuthUser>("/auth/me").then((r) => r.data),
  },

  admin: {
    listUsers: (params?: { search?: string; page?: number; pageSize?: number }) =>
      client.get<{ total: number; page: number; pageSize: number; users: AuthUser[] }>("/admin/users", { params }).then((r) => r.data),
    createUser: (data: { email: string; password: string; displayName: string; title?: string; organization?: string; isAdmin: boolean }) =>
      client.post<AuthUser>("/admin/users", data).then((r) => r.data),
    updateUser: (id: string, data: { displayName?: string; title?: string; organization?: string; isAdmin?: boolean }) =>
      client.patch<AuthUser>(`/admin/users/${id}`, data).then((r) => r.data),
    resetPassword: (id: string, newPassword: string) =>
      client.post(`/admin/users/${id}/reset-password`, { newPassword }).then((r) => r.data),
    deleteUser: (id: string) =>
      client.delete(`/admin/users/${id}`).then(() => undefined),
    listAllTeams: () => client.get<AdminTeamRow[]>("/admin/teams").then((r) => r.data),
    listAllInvites: () => client.get<AdminInviteRow[]>("/admin/invites").then((r) => r.data),
  },

  teams: {
    myTeams: () => client.get<TeamSummary[]>("/teams").then((r) => r.data),
    create: (data: { name: string; description?: string }) =>
      client.post<TeamSummary>("/teams", data).then((r) => r.data),
    getTeam: (id: string) => client.get<TeamDetail>(`/teams/${id}`).then((r) => r.data),
    invite: (id: string, data: { email: string; role: string }) =>
      client.post<TeamInviteDto>(`/teams/${id}/invite`, data).then((r) => r.data),
    acceptInvite: (token: string) =>
      client.post<{ teamId: string }>(`/teams/invites/${token}/accept`).then((r) => r.data),
    updateMemberRole: (teamId: string, userId: string, role: string) =>
      client.patch(`/teams/${teamId}/members/${userId}`, { role }).then(() => undefined),
    removeMember: (teamId: string, userId: string) =>
      client.delete(`/teams/${teamId}/members/${userId}`).then(() => undefined),
  },

  articles: {
    listAdmin: () => client.get<BlogArticleListItem[]>("/articles").then((r) => r.data),
    listPublished: () => client.get<BlogArticleListItem[]>("/articles/published").then((r) => r.data),
    getAdmin: (id: string) => client.get<BlogArticle>(`/articles/${id}`).then((r) => r.data),
    getPublishedBySlug: (slug: string) =>
      client.get<BlogArticle>(`/articles/published/${slug}`).then((r) => r.data),
    create: (data: ArticleUpsertRequest) =>
      client.post<{ id: string; slug: string }>("/articles", data).then((r) => r.data),
    update: (id: string, data: ArticleUpsertRequest) =>
      client.put<{ id: string; slug: string }>(`/articles/${id}`, data).then((r) => r.data),
    delete: (id: string) => client.delete(`/articles/${id}`).then(() => undefined),
    generate: (data: GenerateArticleRequest) =>
      client.post<{ id: string; slug: string; title: string }>("/articles/generate", data).then((r) => r.data),
    regenerateImage: (id: string) =>
      client.post<{ coverImageUrl: string }>(`/articles/${id}/regenerate-image`).then((r) => r.data),
    uploadImage: (file: File) => {
      const fd = new FormData();
      fd.append("file", file);
      return client
        .post<{ url: string }>("/articles/upload", fd, {
          headers: { "Content-Type": "multipart/form-data" },
        })
        .then((r) => r.data);
    },
  },

  pipelines: {
    getAll: () =>
      client.get<Pipeline[]>("/pipelines").then((r) => r.data),
    getById: (id: string) =>
      client.get<Pipeline>(`/pipelines/${id}`).then((r) => r.data),
    create: (data: CreatePipelineRequest) =>
      client.post<Pipeline>("/pipelines", data).then((r) => r.data),
    update: (id: string, data: CreatePipelineRequest) =>
      client.put<Pipeline>(`/pipelines/${id}`, data).then((r) => r.data),
  },
};
