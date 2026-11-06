export type ReportType = 'complaint' | 'suggestion';

export type ReportStatus = 'received' | 'under_review' | 'assigned' | 'in_progress' | 'resolved';

export interface LocationInfo {
  area: string;
  address: string;
  lat: number;
  lng: number;
  landmark?: string;
}

export interface TimelineEvent {
  id: string;
  status: ReportStatus;
  title: string;
  description: string;
  date: string;
  actor: string;
  department?: string;
}

export interface CivicReport {
  assessmentId?: string;
  citizenId?: string;
  id: string;
  referenceNumber: string;
  type: ReportType;
  category: string;
  title: string;
  description: string;
  location: LocationInfo;
  status: ReportStatus;
  urgency?: 'standard' | 'priority' | 'urgent';
  contactPreference: 'public' | 'private' | 'anonymous';
  contactName?: string;
  contactEmail?: string;
  contactPhone?: string;
  createdAt: string;
  updatedAt: string;
  photoUrl?: string;
  photoName?: string;
  votes: number;
  userVoted?: boolean;
  assignedDepartment?: string;
  resolutionSummary?: string;
  isUserSubmittedDemo: boolean;
  timeline: TimelineEvent[];
}

export interface CategoryDefinition {
  id: string;
  name: string;
  shortDesc: string;
  iconName: string;
  color: string;
  badgeBg: string;
  badgeText: string;
}

export interface CityMetrics {
  totalReports: number;
  resolvedIssues: number;
  activeSuggestions: number;
  medianResponseDays: number;
  citizenSatisfactionPercent: number;
  communityVotesCast: number;
}


