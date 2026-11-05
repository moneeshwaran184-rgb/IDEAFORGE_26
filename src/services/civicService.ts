import { supabase } from './auth';
import { cloudReports, createCloudReport } from './supabase';
import { CivicReport, CityMetrics, ReportStatus, ReportType } from '../types';

/**
 * Maps Provider Configuration Placeholder
 * In production or when deploying with a commercial map provider,
 * set VITE_MAPS_API_KEY and replace the mock canvas/vector pin renderer.
 */
export const MAPS_PROVIDER_CONFIG = {
  provider: 'built-in-interactive-canvas',
  isApiKeyConfigured: false,
  attribution: 'Fix My City Vector Cartography (Demo Mode)',
  fallbackCenter: { lat: 37.7749, lng: -122.4194 },
};

const STORAGE_KEY = 'fix_my_city_records_v1';
const VOTES_KEY = 'fix_my_city_user_votes_v1';

const INITIAL_SAMPLE_REPORTS: CivicReport[] = [
  {
    id: 'fmc-sample-1',
    referenceNumber: 'FMC-2026-1042',
    type: 'complaint',
    category: 'roads-potholes',
    title: 'Deep asphalt pothole near pedestrian crosswalk',
    description: 'A roughly 18-inch deep crater in the southbound asphalt right before the zebra crossing. Cyclists and strollers are forced into oncoming traffic.',
    location: {
      area: 'Downtown Civic Core',
      address: '420 Market Street, near 5th Ave',
      lat: 37.7749,
      lng: -122.4194,
      landmark: 'Opposite Civic Center Library entrance',
    },
    status: 'assigned',
    urgency: 'priority',
    contactPreference: 'public',
    contactName: 'Elena Rostova',
    contactEmail: 'elena.rostova@civicmail.test',
    createdAt: '2026-11-01T09:15:00Z',
    updatedAt: '2026-11-02T14:30:00Z',
    votes: 42,
    assignedDepartment: 'Public Works — Pavement & Roadbed Division',
    isUserSubmittedDemo: false,
    timeline: [
      {
        id: 'tl-1',
        status: 'received',
        title: 'Report Received & Verified',
        description: 'Resident report received through mobile intake. Digital triage confirmed geographic coordinates within Ward 1 maintenance perimeter.',
        date: '2026-11-01 09:15',
        actor: 'Civic Intake Portal',
      },
      {
        id: 'tl-2',
        status: 'under_review',
        title: 'Inspector Field Assessment',
        description: 'District 1 road safety inspector conducted visual assessment. Hazard level marked Priority due to high bicycle density.',
        date: '2026-11-01 16:40',
        actor: 'M. Vance (Field Inspector #14)',
        department: 'Bureau of Street Services',
      },
      {
        id: 'tl-3',
        status: 'assigned',
        title: 'Work Order Dispatched to Crew',
        description: 'Cold-patch repaving crew scheduled for asphalt milling and compaction within 48 hours.',
        date: '2026-11-02 14:30',
        actor: 'Dispatch Operations',
        department: 'Public Works — Pavement & Roadbed Division',
      },
    ],
  },
  {
    id: 'fmc-sample-2',
    referenceNumber: 'FMC-2026-0988',
    type: 'complaint',
    category: 'streetlights',
    title: 'Three consecutive flickering streetlights creating dark zone',
    description: 'Poles #22, #23, and #24 along River Promenade have been strobing or dark for four consecutive evenings. Creates safety concern for evening commuters.',
    location: {
      area: 'Riverdale Arts Corridor',
      address: 'River Promenade at Canal Footbridge',
      lat: 37.7812,
      lng: -122.4082,
      landmark: 'Near Old Mill Theater',
    },
    status: 'resolved',
    urgency: 'standard',
    contactPreference: 'public',
    contactName: 'Marcus Chen',
    createdAt: '2026-10-28T20:10:00Z',
    updatedAt: '2026-10-30T11:20:00Z',
    votes: 28,
    assignedDepartment: 'Municipal Lighting & Electrical Services',
    resolutionSummary: 'LED fixture driver replacements completed. Photocell sensors re-calibrated. All three luminaires are operating at full 3000K municipal output.',
    isUserSubmittedDemo: false,
    timeline: [
      {
        id: 'tl-201',
        status: 'received',
        title: 'Report Logged',
        description: 'Report filed by resident with exact lamp pole asset numbers.',
        date: '2026-10-28 20:10',
        actor: 'Automated Lighting Queue',
      },
      {
        id: 'tl-202',
        status: 'under_review',
        title: 'Grid Diagnostics Checked',
        description: 'Telemetry verified voltage drop in feeder line C-4.',
        date: '2026-10-29 08:30',
        actor: 'Electrical Desk',
      },
      {
        id: 'tl-203',
        status: 'assigned',
        title: 'Electrical Line Crew Assigned',
        description: 'Bucket truck crew 3B dispatched.',
        date: '2026-10-29 13:00',
        actor: 'City Works Hub',
      },
      {
        id: 'tl-204',
        status: 'in_progress',
        title: 'Fixture Replacement in Progress',
        description: 'Replacing damaged surge protection capacitor.',
        date: '2026-10-30 09:15',
        actor: 'Crew Lead J. Gomez',
      },
      {
        id: 'tl-205',
        status: 'resolved',
        title: 'All Fixtures Fully Operational',
        description: 'Testing confirmed consistent lumen output. Issue closed with satisfaction verification.',
        date: '2026-10-30 11:20',
        actor: 'Municipal Lighting Desk',
      },
    ],
  },
  {
    id: 'fmc-sample-3',
    referenceNumber: 'FMC-SUG-2026-3104',
    type: 'suggestion',
    category: 'clean-energy',
    title: 'Install rooftop solar canopies on West End community parking deck',
    description: 'Transform the municipal rooftop parking lot into a community solar generation hub with EV level-2 charging stations and shade for vehicles.',
    location: {
      area: 'West End & Residential Commons',
      address: '880 Sunset Parkway Garage',
      lat: 37.7698,
      lng: -122.4467,
      landmark: 'Adjacent to Sunset Elementary',
    },
    status: 'under_review',
    contactPreference: 'public',
    contactName: 'Dr. Sarah Al-Mansoor',
    createdAt: '2026-10-25T11:00:00Z',
    updatedAt: '2026-11-01T10:00:00Z',
    votes: 114,
    assignedDepartment: 'Office of Climate Action & Resilient Infrastructure',
    isUserSubmittedDemo: false,
    timeline: [
      {
        id: 'tl-301',
        status: 'received',
        title: 'Community Suggestion Registered',
        description: 'Proposal met threshold for neighborhood energy initiative review.',
        date: '2026-10-25 11:00',
        actor: 'Civic Innovation Intake',
      },
      {
        id: 'tl-302',
        status: 'under_review',
        title: 'Engineering Feasibility Study Opened',
        description: 'Structural weight load and grid interconnection capacity study added to Q1 Urban Energy docket.',
        date: '2026-11-01 10:00',
        actor: 'Climate Infrastructure Board',
      },
    ],
  },
  {
    id: 'fmc-sample-4',
    referenceNumber: 'FMC-2026-1120',
    type: 'complaint',
    category: 'accessibility',
    title: 'Wheelchair curb cut ramp broken and missing tactile pavers',
    description: 'The pedestrian curb transition has broken aggregate creating a 2-inch vertical lip that blocks wheelchairs and guide canes.',
    location: {
      area: 'Northside Heritage District',
      address: 'Corner of Heritage Way & 4th Street',
      lat: 37.7935,
      lng: -122.4105,
      landmark: 'Next to Historic Clock Tower',
    },
    status: 'in_progress',
    urgency: 'priority',
    contactPreference: 'private',
    createdAt: '2026-10-31T14:22:00Z',
    updatedAt: '2026-11-03T07:45:00Z',
    votes: 35,
    assignedDepartment: 'ADA Compliance & Concrete Rehabilitation',
    isUserSubmittedDemo: false,
    timeline: [
      {
        id: 'tl-401',
        status: 'received',
        title: 'Accessibility Notice Logged',
        description: 'Elevated priority given to ADA Title II compliance pathways.',
        date: '2026-10-31 14:22',
        actor: 'Accessibility Desk',
      },
      {
        id: 'tl-402',
        status: 'assigned',
        title: 'ADA Engineering Specialist Assigned',
        description: 'Site blueprints checked for retrofitting truncated domes.',
        date: '2026-11-01 09:30',
        actor: 'Capital Works',
      },
      {
        id: 'tl-403',
        status: 'in_progress',
        title: 'Formwork and Concrete Pouring Underway',
        description: 'Temporary wooden ramp installed while quick-cure polymer concrete cures.',
        date: '2026-11-03 07:45',
        actor: 'Concrete Restoration Team',
      },
    ],
  },
  {
    id: 'fmc-sample-5',
    referenceNumber: 'FMC-SUG-2026-2980',
    type: 'suggestion',
    category: 'transport-mobility',
    title: 'Continuous bi-directional protected bike corridor along Waterfront Pier',
    description: 'Install concrete planters and flexible bollards to create a continuous 2.4-mile cycleway connecting the ferry terminal with residential waterfront greenway.',
    location: {
      area: 'East Bay Waterfront',
      address: 'Pier 7 to Harbor Boulevard',
      lat: 37.7891,
      lng: -122.3918,
      landmark: 'Ferry Pier 7 Gate',
    },
    status: 'assigned',
    contactPreference: 'public',
    contactName: 'Julian O’Connor',
    createdAt: '2026-10-18T16:00:00Z',
    updatedAt: '2026-10-29T15:00:00Z',
    votes: 189,
    assignedDepartment: 'Department of Transportation — Active Mobility Team',
    isUserSubmittedDemo: false,
    timeline: [
      {
        id: 'tl-501',
        status: 'received',
        title: 'Civic Suggestion Endorsed',
        description: 'Achieved 100+ community votes in under one week.',
        date: '2026-10-18 16:00',
        actor: 'Active Mobility Board',
      },
      {
        id: 'tl-502',
        status: 'assigned',
        title: 'Included in 2027 Capital Improvement Plan',
        description: 'Traffic flow modeling completed. Public comment period scheduled for City Council session.',
        date: '2026-10-29 15:00',
        actor: 'Urban Transit Planning',
      },
    ],
  },
  {
    id: 'fmc-sample-6',
    referenceNumber: 'FMC-2026-0811',
    type: 'complaint',
    category: 'waste-sanitation',
    title: 'Overflowing public recycling bins and broken lids',
    description: 'Two solar compaction recycling units have jammed lids causing cardboard and cans to spill onto the park lawn.',
    location: {
      area: 'South Valley Greenways',
      address: 'Meadowbrook Park West Pavilion',
      lat: 37.7412,
      lng: -122.4211,
      landmark: 'Picnic Grove & Restroom pavilion',
    },
    status: 'resolved',
    urgency: 'standard',
    contactPreference: 'anonymous',
    createdAt: '2026-10-24T08:00:00Z',
    updatedAt: '2026-10-25T13:40:00Z',
    votes: 19,
    assignedDepartment: 'Parks Cleanliness & Resource Recovery',
    resolutionSummary: 'Compactor sensor cleared, lids lubricated and repaired, bins completely sanitized. New collection frequency set to daily on weekends.',
    isUserSubmittedDemo: false,
    timeline: [
      {
        id: 'tl-601',
        status: 'received',
        title: 'Maintenance Alert',
        description: 'Park ranger flagged complaint for priority pickup.',
        date: '2026-10-24 08:00',
        actor: 'Parks Hotline',
      },
      {
        id: 'tl-602',
        status: 'resolved',
        title: 'Cleaned and Serviced',
        description: 'Waste management contractor serviced mechanisms and cleared site.',
        date: '2026-10-25 13:40',
        actor: 'Clean City Crew',
      },
    ],
  },
];

function loadStoredReports(): CivicReport[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, '[]');
      return [];
    }
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length === 0) {
      return [];
    }
    return parsed;
  } catch (e) {
    console.warn('Failed to parse stored civic reports, falling back to initial data', e);
    return [];
  }
}

function saveReports(reports: CivicReport[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(reports));
  } catch (e) {
    console.error('Failed to save civic reports to localStorage', e);
  }
}

function loadUserVotes(): Record<string, boolean> {
  try {
    const raw = localStorage.getItem(VOTES_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveUserVotes(votes: Record<string, boolean>): void {
  try {
    localStorage.setItem(VOTES_KEY, JSON.stringify(votes));
  } catch {
    // Ignore error
  }
}

export interface ComplaintCreateInput {
  assessmentId?: string;
  category: string;
  title: string;
  description: string;
  area: string;
  address: string;
  lat: number;
  lng: number;
  landmark?: string;

  contactPreference: 'public' | 'private' | 'anonymous';
  contactName?: string;
  contactEmail?: string;
  contactPhone?: string;
  photoUrl?: string;
  photoName?: string;
}

export interface SuggestionCreateInput {
  assessmentId?: string;
  category: string;
  title: string;
  description: string;
  area: string;
  address: string;
  lat: number;
  lng: number;
  landmark?: string;
  contactPreference: 'public' | 'private' | 'anonymous';
  contactName?: string;
  contactEmail?: string;
  photoUrl?: string;
  photoName?: string;
}

/**
 * Civic Service Layer
 * Encapsulates all data access and persistence. Ready to switch to real REST / GraphQL / Firebase endpoints.
 */
export const CivicService = { async refresh() { const rows = await cloudReports('?select=*&order=created_at.desc'); saveReports(rows); return this.getAllReports(); },
  getAllReports(): CivicReport[] {
    const reports = loadStoredReports();
    const userVotes = loadUserVotes();
    return reports.map((r) => ({
      ...r,
      userVoted: !!userVotes[r.id],
    }));
  },

  getReportByReference(refNumber: string): CivicReport | null {
    if (!refNumber) return null;
    const clean = refNumber.trim().toUpperCase();
    const all = this.getAllReports();
    return all.find((r) => r.referenceNumber.toUpperCase() === clean) || null;
  },

  async createComplaint(input: ComplaintCreateInput): Promise<CivicReport> {
    // Simulate slight network settling latency for realistic feel
    await new Promise((r) => setTimeout(r, 400));

    const all = loadStoredReports();
    const randomNum = crypto.randomUUID().toUpperCase();
    const year = new Date().getFullYear();
    const referenceNumber = `FMC-${year}-${randomNum}`;
    const id = `user-report-${Date.now()}`;
    const nowIso = new Date().toISOString();
    const formattedDate = new Date().toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

    const newReport: CivicReport = {
      assessmentId: input.assessmentId,
      id,
      referenceNumber,
      type: 'complaint',
      category: input.category,
      title: input.title.trim(),
      description: input.description.trim(),
      location: {
        area: input.area,
        address: input.address.trim(),
        lat: input.lat,
        lng: input.lng,
        landmark: input.landmark?.trim() || undefined,
      },
      status: 'received',

      contactPreference: input.contactPreference,
      contactName: input.contactName?.trim() || (input.contactPreference === 'anonymous' ? 'Anonymous Citizen' : 'Local Resident'),
      contactEmail: input.contactEmail?.trim() || undefined,
      contactPhone: input.contactPhone?.trim() || undefined,
      photoUrl: input.photoUrl,
      photoName: input.photoName,
      createdAt: nowIso,
      updatedAt: nowIso,
      votes: 1,
      isUserSubmittedDemo: false,
      timeline: [
        {
          id: `tl-new-${Date.now()}`,
          status: 'received',
          title: 'Report Received (Local Demo Mode)',
          description: 'Your report was successfully registered in the local demonstration database. A unique tracking ID was generated.',
          date: formattedDate,
          actor: 'Civic Intake Service',
        },
      ],
    };

    const saved = await createCloudReport(newReport); const updatedList = [saved, ...all];
    saveReports(updatedList);
    return saved;
  },

  async createSuggestion(input: SuggestionCreateInput): Promise<CivicReport> {
    await new Promise((r) => setTimeout(r, 400));

    const all = loadStoredReports();
    const randomNum = crypto.randomUUID().toUpperCase();
    const year = new Date().getFullYear();
    const referenceNumber = `FMC-SUG-${year}-${randomNum}`;
    const id = `user-sug-${Date.now()}`;
    const nowIso = new Date().toISOString();
    const formattedDate = new Date().toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

    const newReport: CivicReport = {
      assessmentId: input.assessmentId,
      id,
      referenceNumber,
      type: 'suggestion',
      category: input.category,
      title: input.title.trim(),
      description: input.description.trim(),
      location: {
        area: input.area,
        address: input.address.trim(),
        lat: input.lat,
        lng: input.lng,
        landmark: input.landmark?.trim() || undefined,
      },
      status: 'received',
      contactPreference: input.contactPreference,
      contactName: input.contactName?.trim() || (input.contactPreference === 'anonymous' ? 'Community Contributor' : 'Local Resident'),
      contactEmail: input.contactEmail?.trim() || undefined,
      photoUrl: input.photoUrl,
      photoName: input.photoName,
      createdAt: nowIso,
      updatedAt: nowIso,
      votes: 1,
      isUserSubmittedDemo: false,
      timeline: [
        {
          id: `tl-sug-${Date.now()}`,
          status: 'received',
          title: 'Suggestion Logged for Community Review',
          description: 'Submitted to the municipal civic suggestion repository. Fellow residents can upvote and add visibility.',
          date: formattedDate,
          actor: 'Civic Innovation Engine',
        },
      ],
    };

    const saved = await createCloudReport(newReport); const updatedList = [saved, ...all];
    saveReports(updatedList);
    return saved;
  },

  async toggleVote(reportId: string): Promise<CivicReport | null> {
    const all = loadStoredReports();
    const userVotes = loadUserVotes();
    const index = all.findIndex((r) => r.id === reportId);
    if (index === -1) return null;

    const { data, error } = await supabase.rpc('toggle_report_vote', { target_id: reportId });
    if (error) throw error;
    all[index].votes = data.votes;
    userVotes[reportId] = data.userVoted;
    saveReports(all); saveUserVotes(userVotes);
    return { ...all[index], userVoted: data.userVoted };
  },
  getCityMetrics(): CityMetrics {
    const all = this.getAllReports();
    const totalReports = all.length;
    const resolvedIssues = all.filter(r => r.status === 'resolved').length;
    const activeSuggestions = all.filter((r) => r.type === 'suggestion').length;
    const totalVotes = all.reduce((sum, r) => sum + (r.votes || 0), 0);

    return {
      totalReports,
      resolvedIssues,
      activeSuggestions,
      medianResponseDays: 0,
      citizenSatisfactionPercent: 0,
      communityVotesCast: totalVotes,
    };
  },

  resetDemoData(): void {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(VOTES_KEY);
    localStorage.setItem(STORAGE_KEY, '[]');
  },

  // Future AI integration placeholders
  async suggestCategoryFromText(text: string): Promise<string | null> {
    // Clean integration point for future server-side Gemini API or client classification
    const lower = text.toLowerCase();
    if (lower.includes('pothole') || lower.includes('road') || lower.includes('asphalt') || lower.includes('curb')) {
      return 'roads-potholes';
    }
    if (lower.includes('light') || lower.includes('lamp') || lower.includes('dark') || lower.includes('flicker')) {
      return 'streetlights';
    }
    if (lower.includes('trash') || lower.includes('garbage') || lower.includes('dump') || lower.includes('bin') || lower.includes('waste')) {
      return 'waste-sanitation';
    }
    if (lower.includes('water') || lower.includes('drain') || lower.includes('flood') || lower.includes('leak') || lower.includes('pipe')) {
      return 'water-drainage';
    }
    if (lower.includes('bike') || lower.includes('transit') || lower.includes('bus') || lower.includes('train')) {
      return 'transport-mobility';
    }
    if (lower.includes('solar') || lower.includes('energy') || lower.includes('charger') || lower.includes('electric')) {
      return 'clean-energy';
    }
    if (lower.includes('ramp') || lower.includes('wheelchair') || lower.includes('accessibility') || lower.includes('sidewalk')) {
      return 'accessibility';
    }
    return null;
  },
};




