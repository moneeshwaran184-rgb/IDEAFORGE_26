import React, { useState } from 'react';
import {
  ArrowRight,
  MapPin,
  Check,
  Search,
  ThumbsUp,
  AlertTriangle,
  Lightbulb,
  Clock,
  Compass,
  Layers,
  ArrowUpRight,
  Sparkles,
} from 'lucide-react';
import { CivicReport, CityMetrics } from '../types';
import { COMPLAINT_CATEGORIES, SUGGESTION_CATEGORIES } from '../data/categories';
import { CategoryIcon } from '../components/CategoryIcon';
import { ComplaintHeatMap } from '../components/ComplaintHeatMap';

interface HomePageProps {
  onNavigate: (view: string, categoryId?: string) => void;
  reports: CivicReport[];
  mapReports: CivicReport[];
  metrics: CityMetrics;
  onVote: (reportId: string) => void;
  onSearchTrack: (refNumber: string) => void;
}

export const HomePage: React.FC<HomePageProps> = ({
  onNavigate,
  reports,
  mapReports,
  metrics,
  onVote,
  onSearchTrack,
}) => {
  const [quickRefInput, setQuickRefInput] = useState('');

  const handleQuickTrackSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (quickRefInput.trim()) {
      onSearchTrack(quickRefInput.trim());
    }
  };

  // 3 vivid featured cards for "This week in your neighborhood"
  const recentNeighborhoodIssues = reports.slice(0, 3);

  return (
    <div className="space-y-16 sm:space-y-20 pb-20">
      {/* 1. Asymmetric Editorial Hero with Illustrated Neighborhood Map */}
      <section className="pt-6 sm:pt-10 pb-8 border-b-2 border-[#181615] dark:border-[#737B85]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Masthead Sub-Banner */}
          <div className="flex flex-wrap items-center justify-between gap-3 pb-4 mb-6 border-b border-[#E8E1D5] dark:border-[#39414B] text-xs font-mono">
            <div className="flex items-center gap-2 text-[#4A453F] dark:text-[#CCC5BA]">
              <span className="w-2.5 h-2.5 bg-[#EB4A26] rounded-xs inline-block"></span>
              <span className="font-bold uppercase tracking-wider text-[#181615] dark:text-[#F4EFE6]">
                DISPATCH VOL. 04 · LOCAL ISSUE REGISTER
              </span>
            </div>
            <div className="text-[#857E75] dark:text-[#AAA295]">
              OPEN CIVIC PLATFORM · LOCAL SIMULATION DEMO
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-stretch">
            {/* Left Asymmetric Column: Bold Editorial Typography & Direct Action */}
            <div className="lg:col-span-5 flex flex-col justify-between space-y-6">
              <div className="space-y-4">
                <div className="inline-flex items-center gap-2 px-2.5 py-1 bg-[#FAF7F0] dark:bg-[#1E2125] border border-[#181615] dark:border-[#737B85] rounded-md text-[11px] font-mono font-bold text-[#181615] dark:text-[#F4EFE6] shadow-[2px_2px_0px_#181615]">
                  <span>[ SECTION: COMMUNITY DESK ]</span>
                </div>

                <h1 className="font-editorial text-4xl sm:text-5xl xl:text-6xl font-extrabold text-[#181615] dark:text-[#F4EFE6] tracking-tight leading-[1.05] text-balance">
                  Your street. <br />
                  <span className="italic text-[#EB4A26] dark:text-[#FF8B6D]">Your say.</span>
                </h1>

                <p className="text-sm sm:text-base text-[#4A453F] dark:text-[#CCC5BA] leading-relaxed">
                  Spot a broken streetlight on your commute or have an idea for a protected neighborhood bike corridor? Pin it to the district noticeboard and inspect resolution logs step-by-step.
                </p>
              </div>

              {/* Action Buttons Row */}
              <div className="space-y-3 pt-2">
                <div className="flex flex-col sm:flex-row gap-2.5">
                  <button
                    type="button"
                    onClick={() => onNavigate('complaint')}
                    className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-[#EB4A26] hover:bg-[#D73A17] text-white font-bold text-xs uppercase tracking-wider border-2 border-[#181615] dark:border-[#737B85] shadow-[3px_3px_0px_#181615] hover:shadow-[1px_1px_0px_#181615] hover:translate-x-[1px] hover:translate-y-[1px] transition-all"
                  >
                    <AlertTriangle className="w-4 h-4 stroke-[2.5]" />
                    <span>Report a Street Problem</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>

                  <button
                    type="button"
                    onClick={() => onNavigate('suggestion')}
                    className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-[#FAF7F0] dark:bg-[#1E2125] hover:bg-white text-[#181615] dark:text-[#F4EFE6] font-bold text-xs uppercase tracking-wider border-2 border-[#181615] dark:border-[#737B85] shadow-[3px_3px_0px_#181615] hover:shadow-[1px_1px_0px_#181615] hover:translate-x-[1px] hover:translate-y-[1px] transition-all"
                  >
                    <Lightbulb className="w-4 h-4 text-[#1D4ED8] dark:text-[#93B5FF]" />
                    <span>Propose an Idea</span>
                  </button>
                </div>

                {/* Tracking search ticket */}
                <form
                  onSubmit={handleQuickTrackSubmit}
                  className="mt-4 p-2 bg-[#FAF7F0] dark:bg-[#1E2125] rounded-2xl border-2 border-[#181615] dark:border-[#737B85] shadow-[3px_3px_0px_#181615] flex items-center gap-2"
                >
                  <Search className="w-4 h-4 text-[#857E75] dark:text-[#AAA295] ml-2 shrink-0" />
                  <input
                    type="text"
                    value={quickRefInput}
                    onChange={(e) => setQuickRefInput(e.target.value)}
                    placeholder="Enter reference # (e.g. FMC-2026-1042)"
                    className="w-full bg-transparent text-xs font-mono text-[#181615] dark:text-[#F4EFE6] placeholder-[#857E75] focus:outline-none py-1"
                  />
                  <button
                    type="submit"
                    className="px-3.5 py-1.5 bg-[#181615] hover:bg-[#332F2B] text-white text-[11px] font-mono font-bold rounded-lg shrink-0 transition-colors"
                  >
                    Lookup
                  </button>
                </form>
              </div>

              {/* Quick sample ticket shortcuts */}
              <div className="pt-2 border-t border-[#E8E1D5] dark:border-[#39414B] flex items-center gap-2 text-[11px] font-mono text-[#665F57] dark:text-[#BBB3A7]">
                <span>Sample records:</span>
                <button
                  type="button"
                  onClick={() => onSearchTrack('FMC-2026-1042')}
                  className="font-bold text-[#1D4ED8] dark:text-[#93B5FF] hover:underline"
                >
                  #1042 (Pothole)
                </button>
                <span>·</span>
                <button
                  type="button"
                  onClick={() => onSearchTrack('FMC-SUG-2026-3104')}
                  className="font-bold text-[#1D4ED8] dark:text-[#93B5FF] hover:underline"
                >
                  #3104 (Solar)
                </button>
              </div>
            </div>

            {/* Right Asymmetric Column: Custom Illustrated Neighborhood Map */}
            <div className="lg:col-span-7 flex flex-col justify-center">
              <ComplaintHeatMap reports={mapReports} onNavigate={()=>onNavigate('heat-map')} />
            </div>
          </div>
        </div>
      </section>

      {/* 2. "This week in your neighborhood" (3 Vivid Editorial Cards) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-4 mb-6 border-b-2 border-[#181615] dark:border-[#737B85]">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono font-bold text-[#EB4A26] dark:text-[#FF8B6D] uppercase tracking-wider">
              <span>● LIVE DISPATCH</span>
              <span>·</span>
              <span className="text-[#857E75] dark:text-[#AAA295]">DEMO DATA</span>
            </div>
            <h2 className="font-editorial text-2xl sm:text-3xl font-bold text-[#181615] dark:text-[#F4EFE6] tracking-tight mt-1">
              This week in your neighborhood
            </h2>
          </div>

          <button
            type="button"
            onClick={() => onNavigate('track')}
            className="inline-flex items-center gap-1.5 text-xs font-mono font-bold text-[#181615] dark:text-[#F4EFE6] hover:text-[#1D4ED8] uppercase tracking-wider"
          >
            <span>View Full Ledger</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* 3 Vivid Issue Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {recentNeighborhoodIssues.map((issue, idx) => {
            const isComplaint = issue.type === 'complaint';
            const statusStyle = {
              received: 'bg-[#FFFBEB] dark:bg-[#352F20] text-[#B45309] border-[#FDE68A]',
              under_review: 'bg-[#FFFBEB] dark:bg-[#352F20] text-[#B45309] border-[#FDE68A]',
              assigned: 'bg-[#EFF6FF] dark:bg-[#1B2C46] text-[#1D4ED8] dark:text-[#93B5FF] border-[#BFDBFE]',
              in_progress: 'bg-[#FAF5FF] text-[#7E22CE] border-[#E9D5FF]',
              resolved: 'bg-[#E3EED3] dark:bg-[#253321] text-[#3F6212] border-[#A3C280]',
            }[issue.status] || 'bg-slate-100 text-slate-800 border-slate-300';

            return (
              <div
                key={issue.id}
                className="bg-[#FAF7F0] dark:bg-[#1E2125] rounded-2xl border-2 border-[#181615] dark:border-[#737B85] shadow-[4px_4px_0px_#181615] p-5 flex flex-col justify-between hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[5px_5px_0px_#181615] transition-all group"
              >
                <div>
                  {/* Card Header: Category & Numbered Marker */}
                  <div className="flex items-center justify-between gap-2 pb-3 mb-3 border-b border-[#E8E1D5] dark:border-[#39414B]">
                    <div className="flex items-center gap-1.5">
                      <span
                        className={`w-6 h-6 rounded-md flex items-center justify-center font-mono font-bold text-xs border border-[#181615] dark:border-[#737B85] text-white ${
                          isComplaint ? 'bg-[#EB4A26]' : 'bg-[#1D4ED8]'
                        }`}
                      >
                        0{idx + 1}
                      </span>
                      <span className="font-mono text-[11px] font-bold uppercase tracking-wider text-[#181615] dark:text-[#F4EFE6]">
                        {isComplaint ? 'Problem Report' : 'Civic Proposal'}
                      </span>
                    </div>

                    <span
                      className={`font-mono text-[10px] px-2 py-0.5 rounded border font-bold uppercase ${statusStyle}`}
                    >
                      {issue.status.replace('_', ' ')}
                    </span>
                  </div>

                  {/* Title */}
                  <h3 className="font-editorial text-lg font-bold text-[#181615] dark:text-[#F4EFE6] leading-snug group-hover:text-[#EB4A26] transition-colors mb-2">
                    {issue.title}
                  </h3>

                  {/* Description excerpt */}
                  <p className="text-xs text-[#4A453F] dark:text-[#CCC5BA] leading-relaxed line-clamp-3 mb-4">
                    {issue.description}
                  </p>
                </div>

                <div>
                  {/* Location & Date stamps */}
                  <div className="py-2.5 px-3 bg-white dark:bg-[#22262B] rounded-xl border border-[#E8E1D5] dark:border-[#39414B] mb-4 space-y-1 text-xs">
                    <div className="flex items-center gap-1.5 text-[#181615] dark:text-[#F4EFE6] font-semibold truncate">
                      <MapPin className="w-3.5 h-3.5 text-[#EB4A26] dark:text-[#FF8B6D] shrink-0" />
                      <span className="truncate">{issue.location.address}</span>
                    </div>
                    <div className="flex items-center justify-between text-[11px] font-mono text-[#857E75] dark:text-[#AAA295]">
                      <span>{issue.location.area}</span>
                      <span>{new Date(issue.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>

                  {/* Card Actions: Endorse & View Timeline */}
                  <div className="flex items-center justify-between pt-1">
                    <button
                      type="button"
                      onClick={() => onVote(issue.id)}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#181615] dark:border-[#737B85] text-xs font-mono font-bold transition-colors ${
                        issue.userVoted
                          ? 'bg-[#E3EED3] dark:bg-[#253321] text-[#3F6212]'
                          : 'bg-white dark:bg-[#22262B] hover:bg-[#F4EFE6] text-[#181615] dark:text-[#F4EFE6]'
                      }`}
                    >
                      <ThumbsUp className={`w-3.5 h-3.5 ${issue.userVoted ? 'fill-current' : ''}`} />
                      <span>{issue.votes}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => onSearchTrack(issue.referenceNumber)}
                      className="inline-flex items-center gap-1 text-xs font-bold text-[#1D4ED8] dark:text-[#93B5FF] hover:text-[#181615] hover:underline"
                    >
                      <span>Track Progress</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 3. Colorful Useful Entry Points: Complaint Categories */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-[#FAF7F0] dark:bg-[#1E2125] rounded-3xl border-2 border-[#181615] dark:border-[#737B85] p-6 sm:p-10 shadow-[6px_6px_0px_#181615]">
          <div className="max-w-2xl mb-8">
            <span className="font-mono text-xs font-bold uppercase tracking-wider text-[#EB4A26] dark:text-[#FF8B6D]">
              CIVIC PROBLEM CATALOG
            </span>
            <h2 className="font-editorial text-2xl sm:text-3xl font-extrabold text-[#181615] dark:text-[#F4EFE6] tracking-tight mt-1">
              What needs fixing on your street?
            </h2>
            <p className="text-xs sm:text-sm text-[#4A453F] dark:text-[#CCC5BA] mt-1.5">
              Select an entry point to file a localized ticket with photo verification and map coordinates.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {COMPLAINT_CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => onNavigate('complaint', cat.id)}
                className="p-3.5 rounded-2xl bg-white dark:bg-[#22262B] hover:bg-[#FDFBF7] border-2 border-[#181615] dark:border-[#737B85] shadow-[2px_2px_0px_#181615] hover:shadow-[3px_3px_0px_#181615] hover:translate-x-[-1px] hover:translate-y-[-1px] transition-all text-left group flex items-start gap-3"
              >
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border border-[#181615] dark:border-[#737B85] shadow-xs"
                  style={{ backgroundColor: `${cat.color}20`, color: cat.color }}
                >
                  <CategoryIcon name={cat.iconName} className="w-4 h-4 stroke-[2.2]" />
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-bold text-[#181615] dark:text-[#F4EFE6] group-hover:text-[#EB4A26] transition-colors truncate">
                    {cat.name}
                  </div>
                  <div className="text-[11px] text-[#665F57] dark:text-[#BBB3A7] line-clamp-1 mt-0.5">
                    {cat.shortDesc}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* 4. "How it Works" Editorial Strip */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="border-t-2 border-b-2 border-[#181615] dark:border-[#737B85] py-10 bg-[#F4EFE6]/50">
          <div className="max-w-2xl mb-8">
            <span className="font-mono text-xs font-bold uppercase tracking-wider text-[#181615] dark:text-[#F4EFE6]">
              [ DISPATCH WORKFLOW ]
            </span>
            <h2 className="font-editorial text-2xl sm:text-3xl font-extrabold text-[#181615] dark:text-[#F4EFE6] mt-1">
              From street notice to crew resolution
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
            {/* Step 1 */}
            <div className="space-y-3 p-4 bg-[#FAF7F0] dark:bg-[#1E2125] rounded-2xl border border-[#D6CCBE] dark:border-[#48515C]">
              <div className="flex items-center gap-2">
                <span className="w-7 h-7 rounded-full bg-[#181615] text-[#FAF7F0] font-mono font-bold text-xs flex items-center justify-center">
                  01
                </span>
                <h3 className="font-editorial text-base font-bold text-[#181615] dark:text-[#F4EFE6]">
                  File Street Report
                </h3>
              </div>
              <p className="text-xs text-[#4A453F] dark:text-[#CCC5BA] leading-relaxed">
                Pin the location on the map, provide concise notes, and optionally snap a photo. Pick anonymous or public attribution.
              </p>
              <div className="text-[10px] font-mono text-[#857E75] dark:text-[#AAA295] pt-2 border-t border-[#E8E1D5] dark:border-[#39414B]">
                → Unique ticket reference generated instantly
              </div>
            </div>

            {/* Step 2 */}
            <div className="space-y-3 p-4 bg-[#FAF7F0] dark:bg-[#1E2125] rounded-2xl border border-[#D6CCBE] dark:border-[#48515C]">
              <div className="flex items-center gap-2">
                <span className="w-7 h-7 rounded-full bg-[#181615] text-[#FAF7F0] font-mono font-bold text-xs flex items-center justify-center">
                  02
                </span>
                <h3 className="font-editorial text-base font-bold text-[#181615] dark:text-[#F4EFE6]">
                  Triage & Dispatch
                </h3>
              </div>
              <p className="text-xs text-[#4A453F] dark:text-[#CCC5BA] leading-relaxed">
                In this demo environment, reports route into division queues (Roadbed, Lighting, ADA Ramp, or Active Mobility).
              </p>
              <div className="text-[10px] font-mono text-[#857E75] dark:text-[#AAA295] pt-2 border-t border-[#E8E1D5] dark:border-[#39414B]">
                → Field crew assignment milestone logged
              </div>
            </div>

            {/* Step 3 */}
            <div className="space-y-3 p-4 bg-[#FAF7F0] dark:bg-[#1E2125] rounded-2xl border border-[#D6CCBE] dark:border-[#48515C]">
              <div className="flex items-center gap-2">
                <span className="w-7 h-7 rounded-full bg-[#181615] text-[#FAF7F0] font-mono font-bold text-xs flex items-center justify-center">
                  03
                </span>
                <h3 className="font-editorial text-base font-bold text-[#181615] dark:text-[#F4EFE6]">
                  Open Timeline
                </h3>
              </div>
              <p className="text-xs text-[#4A453F] dark:text-[#CCC5BA] leading-relaxed">
                Inspect dates, maintenance notes, and final closure summaries directly on the public tracking ledger.
              </p>
              <div className="text-[10px] font-mono text-[#857E75] dark:text-[#AAA295] pt-2 border-t border-[#E8E1D5] dark:border-[#39414B]">
                → Transparent public audit log
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 5. Community Impact Snapshot (Clearly Labeled Demo Content) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-[#181615] text-[#FAF7F0] rounded-3xl p-6 sm:p-10 border-2 border-[#181615] dark:border-[#737B85] shadow-[6px_6px_0px_#EB4A26]">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 mb-6 border-b border-[#332F2B]">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="font-mono text-[10px] uppercase tracking-wider px-2 py-0.5 rounded bg-[#332F2B] text-[#D6CCBE]">
                  SIMULATION AUDIT
                </span>
                <span className="font-mono text-[11px] text-[#A89F91]">
                  Demo ledger tallies
                </span>
              </div>
              <h2 className="font-editorial text-2xl sm:text-3xl font-bold tracking-tight">
                Neighborhood Impact Snapshot
              </h2>
            </div>
            <p className="text-xs text-[#A89F91] max-w-sm">
              Demonstration counters showing simulated intake throughput, repair milestones, and neighbor endorsements.
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="border-l-2 border-[#EB4A26] pl-3">
              <div className="font-mono text-3xl sm:text-4xl font-extrabold text-[#FAF7F0] tabular-nums">
                {metrics.totalReports.toLocaleString()}
              </div>
              <div className="text-xs font-bold text-[#D6CCBE] mt-1">
                Simulated Tickets Logged
              </div>
              <div className="text-[10px] font-mono text-[#857E75] dark:text-[#AAA295]">
                Local demonstration session
              </div>
            </div>

            <div className="border-l-2 border-[#84CC16] pl-3">
              <div className="font-mono text-3xl sm:text-4xl font-extrabold text-[#84CC16] tabular-nums">
                {metrics.resolvedIssues.toLocaleString()}
              </div>
              <div className="text-xs font-bold text-[#D6CCBE] mt-1">
                Resolved Street Items
              </div>
              <div className="text-[10px] font-mono text-[#857E75] dark:text-[#AAA295]">
                Sample verified repairs
              </div>
            </div>

            <div className="border-l-2 border-[#1D4ED8] pl-3">
              <div className="font-mono text-3xl sm:text-4xl font-extrabold text-[#60A5FA] tabular-nums">
                {metrics.medianResponseDays}d
              </div>
              <div className="text-xs font-bold text-[#D6CCBE] mt-1">
                Median Triage Window
              </div>
              <div className="text-[10px] font-mono text-[#857E75] dark:text-[#AAA295]">
                Intake to crew dispatch
              </div>
            </div>

            <div className="border-l-2 border-[#FAF7F0] pl-3">
              <div className="font-mono text-3xl sm:text-4xl font-extrabold text-[#FAF7F0] tabular-nums">
                {metrics.communityVotesCast.toLocaleString()}
              </div>
              <div className="text-xs font-bold text-[#D6CCBE] mt-1">
                Community Endorsements
              </div>
              <div className="text-[10px] font-mono text-[#857E75] dark:text-[#AAA295]">
                Resident feedback points
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};



