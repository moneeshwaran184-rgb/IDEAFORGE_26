import { cloudReports } from '../services/supabase';
import React, { useState, useEffect } from 'react';
import {
  Search,
  MapPin,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  ThumbsUp,
  Check,
  AlertCircle,
  FileText,
  Compass,
} from 'lucide-react';
import { CivicReport, ReportStatus } from '../types';
import { CategoryIcon } from '../components/CategoryIcon';
import { MapPreviewPlaceholder } from '../components/MapPreviewPlaceholder';
import { COMPLAINT_CATEGORIES, SUGGESTION_CATEGORIES } from '../data/categories';

interface TrackReportPageProps {
  initialRefNumber?: string;
  reports: CivicReport[];
  onVote: (reportId: string) => void;
  onNavigateToForm: (type: 'complaint' | 'suggestion') => void;
}

export const TrackReportPage: React.FC<TrackReportPageProps> = ({
  initialRefNumber,
  reports,
  onVote,
  onNavigateToForm,
}) => {
  const [searchInput, setSearchInput] = useState(initialRefNumber || '');
  const [selectedReport, setSelectedReport] = useState<CivicReport | null>(null);
  const [searchError, setSearchError] = useState<string | null>(null);

  const selectedId = selectedReport?.id;
  useEffect(() => {
    if (!selectedId) return;
    let active = true;
    let loading = false;
    async function refreshStatus() {
      if (loading) return;
      loading = true;
      try {
        const [latest] = await cloudReports('?id=eq.' + encodeURIComponent(selectedId!) + '&select=status,timeline,resolution_summary,updated_at');
        if (active && latest) setSelectedReport(current => current?.id === selectedId ? {...current, ...latest} : current);
      } catch {
        // Keep the last known timeline and retry on the next refresh.
      } finally { loading = false; }
    }
    void refreshStatus();
    const timer = window.setInterval(refreshStatus, 15000);
    return () => { active = false; window.clearInterval(timer); };
  }, [selectedId]);

  // Filters
  const [typeFilter, setTypeFilter] = useState<'all' | 'complaint' | 'suggestion'>('all');
  const [originFilter, setOriginFilter] = useState<'all' | 'user' | 'archive'>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  useEffect(() => {
    if (initialRefNumber) {
      handleSearch(initialRefNumber);
    } else if (reports.length > 0 && !selectedReport) {
      const userReport = reports.find((r) => r.isUserSubmittedDemo);
      setSelectedReport(userReport || reports[0]);
    }
  }, [initialRefNumber, reports]);

  const handleSearch = (query: string) => {
    setSearchError(null);
    const clean = query.trim().toUpperCase();
    if (!clean) {
      setSearchError('Please enter a reference code to search.');
      return;
    }

    const found = reports.find(
      (r) => r.referenceNumber.toUpperCase() === clean || r.id === query.trim()
    );

    if (found) {
      setSelectedReport(found);
      setSearchInput(found.referenceNumber);
    } else {
      setSearchError(`No civic record found matching "${query}". Check the reference format (e.g. FMC-2026-1042).`);
    }
  };

  const handleSelectReport = (rep: CivicReport) => {
    setSelectedReport(rep);
    setSearchInput(rep.referenceNumber);
    setSearchError(null);
    window.scrollTo({ top: 100, behavior: 'smooth' });
  };

  const filteredReports = reports.filter((r) => {
    if (typeFilter !== 'all' && r.type !== typeFilter) return false;
    if (originFilter === 'user' && !r.isUserSubmittedDemo) return false;
    if (originFilter === 'archive' && r.isUserSubmittedDemo) return false;
    if (statusFilter !== 'all' && r.status !== statusFilter) return false;
    return true;
  });

  const statusSteps: { key: ReportStatus; label: string; desc: string }[] = [
    { key: 'received', label: 'Received', desc: 'Queued for intake' },
    { key: 'under_review', label: 'Acknowledged', desc: 'Site evaluation' },
    { key: 'assigned', label: 'Assigned', desc: 'Dispatched to team' },
    { key: 'in_progress', label: 'In Progress', desc: 'Field active' },
    { key: 'resolved', label: 'Resolved', desc: 'Verified & closed' },
  ];

  const getStatusStepIndex = (status: ReportStatus): number => {
    return statusSteps.findIndex((s) => s.key === status);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-10">
      {/* Top Header & Search Box */}
      <div className="bg-[#FAF7F0] dark:bg-[#1E2125] rounded-3xl border-2 border-[#181615] dark:border-[#737B85] p-6 sm:p-8 shadow-[4px_4px_0px_#181615]">
        <div className="max-w-3xl">
          <div className="flex items-center gap-2 font-mono text-xs font-bold text-[#1D4ED8] dark:text-[#93B5FF] uppercase tracking-wider mb-1">
            <span>● PUBLIC DISPATCH LEDGER</span>
            <span>·</span>
            <span className="text-[#857E75] dark:text-[#AAA295]">STATUS TRACKER</span>
          </div>

          <h1 className="font-editorial text-3xl sm:text-4xl font-extrabold text-[#181615] dark:text-[#F4EFE6] tracking-tight">
            Track a Municipal Notice
          </h1>
          <p className="text-xs sm:text-sm text-[#4A453F] dark:text-[#CCC5BA] mt-1">
            Search your reference ticket to inspect inspection milestones, department work orders, and resolution logs.
          </p>

          {/* Search Box */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSearch(searchInput);
            }}
            className="mt-6 flex flex-col sm:flex-row gap-2"
          >
            <div className="relative flex-1">
              <input
                type="text"
                value={searchInput}
                onChange={(e) => {
                  setSearchInput(e.target.value);
                  if (searchError) setSearchError(null);
                }}
                placeholder="Enter reference # (e.g. FMC-2026-1042 or FMC-SUG-2026-3104)"
                className="w-full pl-4 pr-10 py-3 text-sm font-mono rounded-xl border-2 border-[#181615] dark:border-[#737B85] bg-white dark:bg-[#22262B] text-[#181615] dark:text-[#F4EFE6] placeholder-[#857E75] focus:outline-none"
              />
              <Search className="w-4 h-4 text-[#857E75] dark:text-[#AAA295] absolute right-3.5 top-3.5 pointer-events-none" />
            </div>

            <button
              type="submit"
              className="px-6 py-3 bg-[#181615] hover:bg-[#332F2B] text-white font-mono font-bold text-xs uppercase tracking-wider rounded-xl border-2 border-[#181615] dark:border-[#737B85] transition-colors shrink-0"
            >
              Inspect Ticket
            </button>
          </form>

          {searchError && (
            <p className="text-xs font-mono font-bold text-[#EB4A26] dark:text-[#FF8B6D] mt-2 flex items-center gap-1.5">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{searchError}</span>
            </p>
          )}

          {/* Quick preset buttons */}
          <div className="flex flex-wrap items-center gap-2 mt-4 text-xs font-mono">
            <span className="font-bold text-[#181615] dark:text-[#F4EFE6]">SAMPLE TICKETS:</span>
            {reports.slice(0, 4).map((r) => (
              <button
                key={r.id}
                type="button"
                onClick={() => handleSelectReport(r)}
                className={`px-2.5 py-1 rounded-md border text-[11px] transition-colors ${
                  selectedReport?.id === r.id
                    ? 'border-[#181615] dark:border-[#737B85] bg-[#181615] text-[#FAF7F0] font-bold'
                    : 'border-[#D6CCBE] dark:border-[#48515C] bg-white dark:bg-[#22262B] hover:bg-[#F4EFE6] text-[#181615] dark:text-[#F4EFE6]'
                }`}
              >
                {r.referenceNumber}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Selected Report Inspection Docket */}
      {selectedReport && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Main Inspection Column (8 Cols) */}
          <div className="lg:col-span-8 space-y-6">
            <div className="bg-[#FAF7F0] dark:bg-[#1E2125] rounded-3xl border-2 border-[#181615] dark:border-[#737B85] p-6 sm:p-8 shadow-[4px_4px_0px_#181615] space-y-6">
              {/* Header Badge */}
              <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-[#E8E1D5] dark:border-[#39414B]">
                <div className="flex items-center gap-2">
                  <span
                    className={`font-mono text-[10px] font-bold uppercase px-2.5 py-1 rounded border-2 ${
                      selectedReport.isUserSubmittedDemo
                        ? 'bg-[#E3EED3] dark:bg-[#253321] text-[#3F6212] border-[#181615] dark:border-[#737B85]'
                        : 'bg-white dark:bg-[#22262B] text-[#181615] dark:text-[#F4EFE6] border-[#181615] dark:border-[#737B85]'
                    }`}
                  >
                    {selectedReport.isUserSubmittedDemo
                      ? 'Local Session Demo Ticket'
                      : 'City Archive Sample'}
                  </span>
                  <span className="font-mono text-xs text-[#857E75] dark:text-[#AAA295]">
                    {selectedReport.type === 'complaint' ? 'Problem Notice' : 'Civic Proposal'}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <span className="font-mono text-sm font-black text-[#181615] dark:text-[#F4EFE6] bg-white dark:bg-[#22262B] px-2.5 py-1 rounded-md border border-[#181615] dark:border-[#737B85]">
                    {selectedReport.referenceNumber}
                  </span>
                  <button
                    type="button"
                    onClick={() => onVote(selectedReport.id)}
                    className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg border border-[#181615] dark:border-[#737B85] text-xs font-mono font-bold transition-colors ${
                      selectedReport.userVoted
                        ? 'bg-[#E3EED3] dark:bg-[#253321] text-[#3F6212]'
                        : 'bg-white dark:bg-[#22262B] hover:bg-[#F4EFE6] text-[#181615] dark:text-[#F4EFE6]'
                    }`}
                  >
                    <ThumbsUp className={`w-3.5 h-3.5 ${selectedReport.userVoted ? 'fill-current' : ''}`} />
                    <span>{selectedReport.votes}</span>
                  </button>
                </div>
              </div>

              {/* Title & Description */}
              <div>
                <h2 className="font-editorial text-2xl sm:text-3xl font-extrabold text-[#181615] dark:text-[#F4EFE6] tracking-tight">
                  {selectedReport.title}
                </h2>
                <p className="text-sm text-[#4A453F] dark:text-[#CCC5BA] mt-3 leading-relaxed whitespace-pre-line">
                  {selectedReport.description}
                </p>
              </div>

              {selectedReport.photoUrl && (
                <div className="pt-2">
                  <span className="font-mono text-[10px] font-bold uppercase text-[#181615] dark:text-[#F4EFE6] block mb-2">
                    ATTACHED EVIDENCE PHOTO
                  </span>
                  <img
                    src={selectedReport.photoUrl}
                    alt={selectedReport.title}
                    className="max-h-72 w-auto rounded-2xl object-cover border-2 border-[#181615] dark:border-[#737B85]"
                  />
                </div>
              )}

              {/* 5-Stage Lifecycle Stepper */}
              <div className="pt-4 pb-2 border-t border-[#E8E1D5] dark:border-[#39414B]">
                <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-[#665F57] dark:text-[#BBB3A7] block mb-4">
                  LIFECYCLE MILESTONES
                </span>

                <div className="relative">
                  <div className="absolute top-4 left-4 right-4 h-0.5 bg-[#D6CCBE] -z-0"></div>

                  <div className="grid grid-cols-5 relative z-10">
                    {statusSteps.map((step, idx) => {
                      const currentIdx = getStatusStepIndex(selectedReport.status);
                      const isComplete = idx <= currentIdx;
                      const isCurrent = idx === currentIdx;

                      return (
                        <div key={step.key} className="flex flex-col items-center text-center px-1">
                          <div
                            className={`w-8 h-8 rounded-full border-2 border-[#181615] dark:border-[#737B85] flex items-center justify-center font-mono font-bold text-xs transition-colors ${
                              isComplete
                                ? 'bg-[#EB4A26] text-white shadow-xs'
                                : 'bg-[#FAF7F0] dark:bg-[#1E2125] text-[#857E75] dark:text-[#AAA295]'
                            }`}
                          >
                            {isComplete ? <Check className="w-4 h-4 stroke-[3]" /> : idx + 1}
                          </div>
                          <span
                            className={`text-[11px] font-mono mt-2 leading-tight ${
                              isCurrent
                                ? 'text-[#EB4A26] dark:text-[#FF8B6D] font-bold'
                                : isComplete
                                ? 'text-[#181615] dark:text-[#F4EFE6] font-semibold'
                                : 'text-[#857E75] dark:text-[#AAA295]'
                            }`}
                          >
                            {step.label}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Resolution Summary */}
              {selectedReport.status === 'resolved' && (
                <div className="p-4 bg-[#E3EED3] dark:bg-[#253321] border-2 border-[#A3C280] rounded-2xl">
                  <div className="flex items-center gap-2 text-[#3F6212] font-mono font-bold text-xs mb-1">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>CLOSURE & RESOLUTION AUDIT</span>
                  </div>
                  <p className="text-xs text-[#1F2937] leading-relaxed">
                    {selectedReport.resolutionSummary || 'Field crew completed maintenance work and verified operating status according to municipal standards.'}
                  </p>
                </div>
              )}

              {/* Timeline Log */}
              <div className="pt-4 border-t border-[#E8E1D5] dark:border-[#39414B]">
                <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-[#665F57] dark:text-[#BBB3A7] block mb-4">
                  VERIFIED ACTIVITY LOG
                </span>

                <div className="space-y-4">
                  {selectedReport.timeline.map((event, idx) => (
                    <div key={event.id} className="flex gap-3 relative">
                      {idx !== selectedReport.timeline.length - 1 && (
                        <div className="absolute left-3.5 top-7 bottom-0 w-0.5 bg-[#D6CCBE]"></div>
                      )}
                      <div className="w-7 h-7 rounded-full bg-white dark:bg-[#22262B] border-2 border-[#181615] dark:border-[#737B85] text-[#181615] dark:text-[#F4EFE6] flex items-center justify-center shrink-0 z-10 font-mono text-[10px] font-bold">
                        {idx + 1}
                      </div>
                      <div className="flex-1 pb-3">
                        <div className="flex flex-wrap items-baseline justify-between gap-2">
                          <h4 className="font-editorial text-sm font-bold text-[#181615] dark:text-[#F4EFE6]">
                            {event.title}
                          </h4>
                          <span className="font-mono text-[10px] text-[#665F57] dark:text-[#BBB3A7]">
                            {event.date}
                          </span>
                        </div>
                        <p className="text-xs text-[#4A453F] dark:text-[#CCC5BA] mt-1 leading-relaxed">
                          {event.description}
                        </p>
                        <div className="flex items-center gap-2 text-[10px] font-mono text-[#857E75] dark:text-[#AAA295] mt-1.5">
                          <span>OFFICER: {event.actor}</span>
                          {event.department && (
                            <>
                              <span>·</span>
                              <span>{event.department}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Location & Assignment Card (4 Cols) */}
          <div className="lg:col-span-4 space-y-6">
            <div className="bg-[#FAF7F0] dark:bg-[#1E2125] rounded-3xl border-2 border-[#181615] dark:border-[#737B85] p-6 shadow-[4px_4px_0px_#181615] space-y-4">
              <span className="font-mono text-[10px] font-bold text-[#181615] dark:text-[#F4EFE6] uppercase tracking-wider block">
                LOCATION & CARTOGRAPHY
              </span>

              <div className="space-y-1.5 text-xs font-mono">
                <div>
                  <span className="text-[#857E75] dark:text-[#AAA295] block text-[10px]">WARD / DISTRICT</span>
                  <span className="font-bold text-[#181615] dark:text-[#F4EFE6]">{selectedReport.location.area}</span>
                </div>
                <div>
                  <span className="text-[#857E75] dark:text-[#AAA295] block text-[10px]">ADDRESS</span>
                  <span className="font-bold text-[#181615] dark:text-[#F4EFE6]">{selectedReport.location.address}</span>
                </div>
              </div>

              <MapPreviewPlaceholder
                lat={selectedReport.location.lat}
                lng={selectedReport.location.lng}
                areaName={selectedReport.location.area}
                address={selectedReport.location.address}
                interactive={false}
                className="h-44"
              />

              <div className="pt-3 border-t border-[#E8E1D5] dark:border-[#39414B] space-y-2 text-xs font-mono">
                <div>
                  <span className="text-[#857E75] dark:text-[#AAA295] block text-[10px]">ASSIGNED UNIT</span>
                  <span className="font-bold text-[#181615] dark:text-[#F4EFE6]">
                    {selectedReport.assignedDepartment || 'Intake Dispatch & Engineering Triage'}
                  </span>
                </div>

                <div>
                  <span className="text-[#857E75] dark:text-[#AAA295] block text-[10px]">ATTRIBUTION</span>
                  <span className="text-[#4A453F] dark:text-[#CCC5BA]">
                    {selectedReport.contactPreference} ({selectedReport.contactName || 'Anonymous'})
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Registry Browser Table */}
      <div className="bg-[#FAF7F0] dark:bg-[#1E2125] rounded-3xl border-2 border-[#181615] dark:border-[#737B85] p-6 sm:p-8 shadow-[4px_4px_0px_#181615]">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 mb-4 border-b-2 border-[#181615] dark:border-[#737B85]">
          <div>
            <span className="font-mono text-[10px] font-bold text-[#EB4A26] dark:text-[#FF8B6D] uppercase">
              ARCHIVE & ACTIVE NOTICES
            </span>
            <h2 className="font-editorial text-2xl font-bold text-[#181615] dark:text-[#F4EFE6]">
              District Civic Registry
            </h2>
          </div>

          {/* Filters */}
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value as any)}
              className="text-xs font-mono px-2.5 py-1.5 rounded-lg border-2 border-[#181615] dark:border-[#737B85] bg-white dark:bg-[#22262B] text-[#181615] dark:text-[#F4EFE6] focus:outline-none"
            >
              <option value="all">All Types</option>
              <option value="complaint">Complaints only</option>
              <option value="suggestion">Suggestions only</option>
            </select>

            <select
              value={originFilter}
              onChange={(e) => setOriginFilter(e.target.value as any)}
              className="text-xs font-mono px-2.5 py-1.5 rounded-lg border-2 border-[#181615] dark:border-[#737B85] bg-white dark:bg-[#22262B] text-[#181615] dark:text-[#F4EFE6] focus:outline-none"
            >
              <option value="all">All Records</option>
              <option value="user">My Demo Submissions</option>
              <option value="archive">Archive Sample</option>
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="text-xs font-mono px-2.5 py-1.5 rounded-lg border-2 border-[#181615] dark:border-[#737B85] bg-white dark:bg-[#22262B] text-[#181615] dark:text-[#F4EFE6] focus:outline-none"
            >
              <option value="all">All Statuses</option>
              <option value="received">Received</option>
              <option value="under_review">Under Review</option>
              <option value="assigned">Assigned</option>
              <option value="in_progress">In Progress</option>
              <option value="resolved">Resolved</option>
            </select>
          </div>
        </div>

        {/* Ledger Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead>
              <tr className="border-b-2 border-[#181615] dark:border-[#737B85] text-[#181615] dark:text-[#F4EFE6] uppercase tracking-wider text-[10px]">
                <th className="py-2.5 px-3 font-bold">Ticket #</th>
                <th className="py-2.5 px-3 font-bold">Type</th>
                <th className="py-2.5 px-3 font-bold">Title & Location</th>
                <th className="py-2.5 px-3 font-bold">Status</th>
                <th className="py-2.5 px-3 font-bold text-right">Inspect</th>
              </tr>
            </thead>
            <tbody className="divide-y border-b border-[#E8E1D5] dark:border-[#39414B]">
              {filteredReports.map((r) => {
                const isSelected = selectedReport?.id === r.id;
                return (
                  <tr
                    key={r.id}
                    onClick={() => handleSelectReport(r)}
                    className={`cursor-pointer transition-colors ${
                      isSelected ? 'bg-[#EFE8DC] dark:bg-[#30363D] font-bold' : 'hover:bg-white'
                    }`}
                  >
                    <td className="py-3 px-3 font-bold text-[#181615] dark:text-[#F4EFE6] whitespace-nowrap">
                      {r.referenceNumber}
                    </td>
                    <td className="py-3 px-3 whitespace-nowrap">
                      <span className={r.type === 'complaint' ? 'text-[#EB4A26] dark:text-[#FF8B6D]' : 'text-[#1D4ED8] dark:text-[#93B5FF]'}>
                        {r.type === 'complaint' ? 'Complaint' : 'Suggestion'}
                      </span>
                    </td>
                    <td className="py-3 px-3">
                      <div className="font-bold text-[#181615] dark:text-[#F4EFE6] truncate max-w-sm">
                        {r.title}
                      </div>
                      <div className="text-[10px] text-[#665F57] dark:text-[#BBB3A7] truncate">
                        {r.location.area} · {r.location.address}
                      </div>
                    </td>
                    <td className="py-3 px-3 whitespace-nowrap">
                      <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded border border-[#181615] dark:border-[#737B85] bg-white dark:bg-[#22262B]">
                        {r.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right whitespace-nowrap">
                      <span className="font-bold text-[#1D4ED8] dark:text-[#93B5FF] hover:underline">
                        View Log →
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};


