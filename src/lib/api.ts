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
} from "../types";

const client = axios.create({ baseURL: "/api" });

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
