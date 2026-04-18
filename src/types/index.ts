export interface DashboardSummary {
  activeInfections: number;
  patientsAtRisk: number;
  activeOutbreaks: number;
  pendingAlerts: number;
  infectionRateChange: number;
  riskScoreAverage: number;
}

export interface TrendPoint {
  date: string;
  count: number;
  category: string;
}

export interface DashboardTrends {
  infectionTrends: TrendPoint[];
  admissionTrends: TrendPoint[];
}

export interface Infection {
  id: string;
  patientId: string;
  patientName: string;
  organism: string;
  type: string;
  location: string;
  ward: string;
  status: string;
  detectedAt: string;
  resolvedAt: string | null;
  severity: string;
  isHai: boolean;
}

export interface InfectionEvent {
  timestamp: string;
  description: string;
  eventType: string;
}

export interface InfectionDetail {
  infection: Infection;
  riskFactors: string[];
  timeline: InfectionEvent[];
}

export interface Patient {
  id: string;
  name: string;
  age: number;
  gender: string;
  ward: string;
  bedNumber: string;
  admittedAt: string;
  status: string;
  riskScore: number;
  activeInfections: number;
  organisms: string[];
}

export interface RiskFactor {
  name: string;
  contribution: number;
  description: string;
}

export interface PatientRisk {
  patientId: string;
  overallScore: number;
  factors: RiskFactor[];
  riskLevel: string;
}

export interface Outbreak {
  id: string;
  organism: string;
  location: string;
  detectedAt: string;
  resolvedAt: string | null;
  status: string;
  affectedPatients: number;
  severity: string;
  investigationStatus: string;
}

export interface OutbreakTimeline {
  timestamp: string;
  event: string;
  description: string;
}

export interface OutbreakDetail {
  outbreak: Outbreak;
  affectedWards: string[];
  timeline: OutbreakTimeline[];
  screeningGuidance: string[];
}

export interface ForecastRiskScore {
  patientId: string;
  patientName: string;
  ward: string;
  score: number;
  riskLevel: string;
  topFactors: string[];
}

export interface LocationRisk {
  locationId: string;
  name: string;
  type: string;
  riskScore: number;
  activeCases: number;
  capacity: number;
  occupancyRate: number;
}

export interface ForecastTrend {
  date: string;
  predictedCount: number;
  lowerBound: number;
  upperBound: number;
  actualCount: number;
}

export interface Alert {
  id: string;
  title: string;
  description: string;
  severity: string;
  category: string;
  createdAt: string;
  isRead: boolean;
  relatedEntityId: string | null;
  relatedEntityType: string | null;
}

export interface ScreeningCompliance {
  ward: string;
  totalRequired: number;
  completed: number;
  overdue: number;
  complianceRate: number;
}

export interface ScreeningRecord {
  id: string;
  patientId: string;
  patientName: string;
  ward: string;
  screeningType: string;
  status: string;
  dueDate: string;
  completedDate: string | null;
  result: string | null;
}

export interface ResistancePattern {
  organism: string;
  antibiotic: string;
  resistanceRate: number;
  sampleCount: number;
  trend: string;
}

export interface ResistanceSummary {
  organism: string;
  totalIsolates: number;
  mdrRate: number;
  patterns: ResistancePattern[];
}

export interface PrescribingRecord {
  id: string;
  patientId: string;
  patientName: string;
  antibiotic: string;
  indication: string;
  startDate: string;
  endDate: string | null;
  durationDays: number;
  status: string;
  appropriate: boolean;
}

export interface TransmissionNode {
  id: string;
  patientName: string;
  ward: string;
  organism: string;
  detectedAt: string;
  nodeType: string;
}

export interface TransmissionLink {
  sourceId: string;
  targetId: string;
  linkType: string;
  confidence: number;
  evidence: string;
}

export interface TransmissionNetwork {
  nodes: TransmissionNode[];
  links: TransmissionLink[];
  organism: string;
  totalCases: number;
}

export interface DeviceInfection {
  id: string;
  patientId: string;
  patientName: string;
  deviceType: string;
  organism: string;
  ward: string;
  insertionDate: string;
  infectionDate: string;
  daysToInfection: number;
  status: string;
}

export interface DeviceSummary {
  deviceType: string;
  totalDevices: number;
  infections: number;
  infectionRate: number;
  avgDaysToInfection: number;
}

// ---- Request DTOs ----

export interface CreatePatientRequest {
  name: string;
  age: number;
  gender: string;
  ward: string;
  bedNumber: string;
  status?: string;
}

export interface CreateInfectionRequest {
  patientId: string;
  organism: string;
  type: string;
  location: string;
  ward: string;
  severity: string;
  isHai?: boolean;
}

export interface CreateAlertRequest {
  title: string;
  description: string;
  severity: string;
  category: string;
}

export interface CreateOutbreakRequest {
  organism: string;
  location: string;
  severity: string;
  affectedPatients?: number;
}

export interface CreateScreeningRecordRequest {
  patientId: string;
  patientName: string;
  ward: string;
  screeningType: string;
  dueDate: string;
}

export interface CreateDeviceInfectionRequest {
  patientId: string;
  patientName: string;
  deviceType: string;
  organism: string;
  ward: string;
  insertionDate: string;
  infectionDate: string;
}

// ---- Pipeline / Data Flow ----

export interface PipelineNode {
  id: string;
  type: string;
  label: string;
  positionX: number;
  positionY: number;
  config: Record<string, string>;
}

export interface PipelineEdge {
  id: string;
  sourceId: string;
  targetId: string;
  label: string | null;
}

export interface Pipeline {
  id: string;
  name: string;
  description: string;
  status: string;
  createdAt: string;
  lastRunAt: string | null;
  nodes: PipelineNode[];
  edges: PipelineEdge[];
}

export interface CreatePipelineRequest {
  name: string;
  description: string;
  nodes: PipelineNode[];
  edges: PipelineEdge[];
}

// ---- Reports ----

export interface ReportRequest {
  reportType?: string;
  dateRange?: string;
}

export interface ReportMetric {
  label: string;
  value: string;
  change?: string;
  severity?: string;
}

export interface ReportDataSeries {
  name: string;
  values: number[];
  color?: string;
}

export interface ReportChartData {
  chartType: "bar" | "pie" | "line";
  title: string;
  labels: string[];
  series: ReportDataSeries[];
}

export interface ReportTable {
  title: string;
  headers: string[];
  rows: string[][];
}

export interface ReportSection {
  title: string;
  narrative: string;
  keyMetrics: ReportMetric[];
  charts: ReportChartData[];
  tables: ReportTable[];
}

export interface ReportExecutiveSummary {
  narrative: string;
  keyMetrics: ReportMetric[];
  charts: ReportChartData[];
}

export interface ReportResponse {
  title: string;
  generatedAt: string;
  period: string;
  executiveSummary: ReportExecutiveSummary;
  infectionBurden: ReportSection;
  resistancePatterns: ReportSection;
  patientRisk: ReportSection;
  outbreakAnalysis: ReportSection;
  screeningCompliance: ReportSection;
  deviceInfections: ReportSection;
  transmissionAnalysis: ReportSection;
  recommendations: ReportSection;
}

export interface AuthUser {
  id: string;
  email: string;
  displayName: string;
  title?: string | null;
  organization?: string | null;
  isAdmin: boolean;
  createdAt: string;
  lastLoginAt?: string | null;
}

export interface AuthResponse {
  accessToken: string;
  user: AuthUser;
}

export interface TeamSummary {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  myRole: string;
  memberCount: number;
  createdAt: string;
}

export interface TeamMemberDto {
  userId: string;
  displayName: string;
  email: string;
  role: string;
  joinedAt: string;
}

export interface TeamInviteDto {
  id: string;
  email: string;
  role: string;
  token: string;
  createdAt: string;
  expiresAt: string;
}

export interface TeamDetail {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  createdAt: string;
  ownerId: string;
  myRole: string;
  members: TeamMemberDto[];
  pendingInvites: TeamInviteDto[];
}

export interface AdminTeamRow {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  ownerId: string;
  createdAt: string;
  memberCount: number;
}

export interface AdminInviteRow {
  id: string;
  email: string;
  role: number;
  token: string;
  status: string;
  createdAt: string;
  expiresAt: string;
  teamName: string;
}

export interface BlogArticleListItem {
  id: string;
  title: string;
  slug: string;
  category: string;
  summary: string;
  coverImageUrl: string;
  status: string;
  isFeatured: boolean;
  authorName: string;
  publishedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface BlogArticle extends BlogArticleListItem {
  content: string;
  metaTitle: string;
  metaDescription: string;
  keywords: string;
}

export interface ArticleUpsertRequest {
  title?: string;
  slug?: string;
  category?: string;
  summary?: string;
  content?: string;
  coverImageUrl?: string;
  status?: "draft" | "published";
  isFeatured?: boolean;
  publishedAt?: string | null;
  metaTitle?: string;
  metaDescription?: string;
  keywords?: string;
}

export interface GenerateArticleRequest {
  topic: string;
  tone?: string;
  length?: "short" | "medium" | "long";
  category?: string;
  generateImage?: boolean;
}
