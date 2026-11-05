import React, { useState } from 'react';
import { MapPin, Navigation, Eye, ArrowUpRight, Compass, Sparkles } from 'lucide-react';
import { CivicReport } from '../types';

interface IllustratedNeighborhoodMapProps {
  reports: CivicReport[];
  onSelectReport: (refNumber: string) => void;
  className?: string;
}

interface MapMarker {
  id: string;
  num: string;
  title: string;
  category: string;
  area: string;
  x: number; // percentage
  y: number; // percentage
  type: 'complaint' | 'suggestion';
  status: string;
  refNumber: string;
}

export const IllustratedNeighborhoodMap: React.FC<IllustratedNeighborhoodMapProps> = ({
  reports,
  onSelectReport,
  className = '',
}) => {
  const [activePin, setActivePin] = useState<MapMarker | null>(null);

  // Map markers tied to sample reports
  const markers: MapMarker[] = [
    {
      id: 'm1',
      num: '01',
      title: 'Deep asphalt pothole near pedestrian crosswalk',
      category: 'Roads & Potholes',
      area: 'Market Hall Quarter',
      x: 32,
      y: 44,
      type: 'complaint',
      status: 'Assigned',
      refNumber: 'FMC-2026-1042',
    },
    {
      id: 'm2',
      num: '02',
      title: 'Three consecutive flickering streetlights',
      category: 'Streetlights',
      area: 'River Promenade',
      x: 68,
      y: 35,
      type: 'complaint',
      status: 'Resolved',
      refNumber: 'FMC-2026-0988',
    },
    {
      id: 'm3',
      num: '03',
      title: 'Rooftop solar canopies on parking deck',
      category: 'Clean Energy',
      area: 'West End Commons',
      x: 22,
      y: 72,
      type: 'suggestion',
      status: 'Under Review',
      refNumber: 'FMC-SUG-2026-3104',
    },
    {
      id: 'm4',
      num: '04',
      title: 'Protected bike corridor along Waterfront Pier',
      category: 'Transport & Mobility',
      area: 'East Bay Pier',
      x: 82,
      y: 62,
      type: 'suggestion',
      status: 'Assigned',
      refNumber: 'FMC-SUG-2026-2980',
    },
    {
      id: 'm5',
      num: '05',
      title: 'Tactile paving & curb cut restoration',
      category: 'Accessibility',
      area: 'Civic Clock Square',
      x: 52,
      y: 22,
      type: 'complaint',
      status: 'In Progress',
      refNumber: 'FMC-2026-1120',
    },
  ];

  return (
    <div className={`relative bg-[#FAF7F0] dark:bg-[#1E2125] border-2 border-[#181615] dark:border-[#737B85] rounded-3xl overflow-hidden shadow-[4px_4px_0px_#181615] ${className}`}>
      {/* Top Map Header Strip */}
      <div className="bg-[#181615] text-[#FAF7F0] px-4 py-2 flex items-center justify-between text-[11px] font-mono tracking-wider border-b border-[#181615] dark:border-[#737B85]">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[#EB4A26] animate-pulse"></span>
          <span className="font-bold uppercase tracking-widest text-[#FBF9F4]">
            CIVIC ATLAS · DISTRICT MAP
          </span>
        </div>
        <div className="hidden sm:flex items-center gap-4 text-[#A89F91]">
          <span>COORD: 37°46'N · 122°25'W</span>
          <span>SCALE: 1:5000</span>
          <span className="text-[#84CC16]">GRID ACTIVE</span>
        </div>
      </div>

      {/* Main Vector Illustrated Map Graphic */}
      <div className="relative w-full aspect-[4/3] sm:aspect-[16/11] md:aspect-[16/10] bg-[#F4EFE6] dark:bg-[#292E34] overflow-hidden select-none">
        {/* Subtle Map Coordinates & Crosshairs Grid */}
        <div className="absolute inset-0 grid-crosshair opacity-60 pointer-events-none"></div>

        <svg
          viewBox="0 0 800 520"
          className="absolute inset-0 w-full h-full"
          preserveAspectRatio="xMidYMid slice"
        >
          <defs>
            {/* Diagonal hatch for urban blocks */}
            <pattern id="urban-hatch" width="8" height="8" patternTransform="rotate(45 0 0)" patternUnits="userSpaceOnUse">
              <line x1="0" y1="0" x2="0" y2="8" stroke="#D6CCBE" strokeWidth="1" />
            </pattern>
            {/* Park stipple */}
            <pattern id="park-stipple" width="10" height="10" patternUnits="userSpaceOnUse">
              <circle cx="2" cy="2" r="0.8" fill="#65A30D" opacity="0.4" />
              <circle cx="7" cy="7" r="0.8" fill="#65A30D" opacity="0.4" />
            </pattern>
          </defs>

          {/* District Blocks (Warm Paper Architecture) */}
          <g fill="#EFE8DC" stroke="#D1C5B4" strokeWidth="1.5">
            {/* West Blocks */}
            <rect x="40" y="50" width="120" height="100" rx="4" />
            <rect x="40" y="170" width="120" height="120" rx="4" />
            <rect x="40" y="310" width="120" height="150" rx="4" fill="url(#urban-hatch)" />

            {/* Central Blocks */}
            <rect x="180" y="50" width="160" height="90" rx="4" />
            <rect x="230" y="160" width="170" height="130" rx="4" />
            <rect x="180" y="310" width="220" height="150" rx="4" />

            {/* North East Blocks */}
            <rect x="420" y="40" width="150" height="100" rx="4" />
            <rect x="420" y="160" width="130" height="110" rx="4" />

            {/* Far East Waterfront Blocks */}
            <rect x="650" y="80" width="110" height="140" rx="4" />
            <rect x="640" y="240" width="120" height="180" rx="4" fill="url(#urban-hatch)" />
          </g>

          {/* Designated Greenspaces & Parks */}
          <g>
            {/* Central Green Park */}
            <path
              d="M 180,160 L 220,160 L 220,290 L 180,290 Z"
              fill="#E3EED3"
              stroke="#A3C280"
              strokeWidth="1.5"
            />
            {/* Riverbank Meadow Park */}
            <path
              d="M 560,160 Q 610,180 620,280 L 570,300 Q 560,220 560,160 Z"
              fill="#E3EED3"
              stroke="#A3C280"
              strokeWidth="1.5"
            />
            {/* Waterfront Esplanade Park */}
            <rect x="600" y="380" width="160" height="50" fill="#E3EED3" stroke="#A3C280" strokeWidth="1.5" />
          </g>

          {/* Sinuous River / Canal Channel */}
          <g>
            <path
              d="M 590,-10 C 580,120 630,220 580,340 S 520,460 510,540"
              fill="none"
              stroke="#CBE1FB"
              strokeWidth="48"
              strokeLinecap="round"
            />
            <path
              d="M 590,-10 C 580,120 630,220 580,340 S 520,460 510,540"
              fill="none"
              stroke="#1D4ED8"
              strokeWidth="2"
              strokeDasharray="8 6"
              strokeOpacity="0.4"
            />
            {/* Canal Bridges */}
            <rect x="555" y="145" width="60" height="12" rx="2" fill="#FAF7F0" stroke="#181615" strokeWidth="2" />
            <rect x="560" y="295" width="60" height="12" rx="2" fill="#FAF7F0" stroke="#181615" strokeWidth="2" />
          </g>

          {/* Primary Arterial Roadways (Bold White with Fine Ink Outlines) */}
          <g stroke="#FAF7F0" strokeWidth="18" fill="none" strokeLinecap="square">
            {/* Market Street East-West */}
            <path d="M 10,150 L 790,150" />
            {/* 4th Avenue North-South */}
            <path d="M 170,10 L 170,510" />
            {/* Central Parkway */}
            <path d="M 410,10 L 410,510" />
            {/* Broadway South Line */}
            <path d="M 10,300 L 790,300" />
            {/* Harbor Diagonal */}
            <path d="M 560,400 L 790,490" />
          </g>

          {/* Road Fine Ink Centerlines */}
          <g stroke="#D6CCBE" strokeWidth="1.5" fill="none">
            <path d="M 10,150 L 790,150" />
            <path d="M 170,10 L 170,510" />
            <path d="M 410,10 L 410,510" />
            <path d="M 10,300 L 790,300" />
          </g>

          {/* Cobalt Blue Transit Rail Line (M-1) */}
          <g>
            <path
              d="M 20,450 Q 200,430 380,260 T 780,220"
              fill="none"
              stroke="#1D4ED8"
              strokeWidth="4"
              strokeDasharray="12 4"
            />
            {/* Metro Transit Station Circles */}
            <circle cx="160" cy="435" r="5" fill="#FAF7F0" stroke="#1D4ED8" strokeWidth="3" />
            <circle cx="380" cy="260" r="5" fill="#FAF7F0" stroke="#1D4ED8" strokeWidth="3" />
            <circle cx="680" cy="225" r="5" fill="#FAF7F0" stroke="#1D4ED8" strokeWidth="3" />
          </g>

          {/* Printed Map Typographic Labels */}
          <g fill="#181615" className="font-mono text-[9px] font-bold select-none pointer-events-none">
            {/* Street names along roads */}
            <text x="60" y="146" fill="#665F57" letterSpacing="2">MARKET STREET</text>
            <text x="440" y="146" fill="#665F57" letterSpacing="2">MARKET STREET EAST</text>
            <text x="176" y="80" fill="#665F57" letterSpacing="1" transform="rotate(90 176,80)">4TH AVENUE</text>
            <text x="416" y="240" fill="#665F57" letterSpacing="1" transform="rotate(90 416,240)">CENTRAL PKWY</text>
            <text x="60" y="296" fill="#665F57" letterSpacing="2">COMMONS WAY</text>

            {/* Neighborhood / Place Labels with tactile editorial stamps */}
            <text x="60" y="90" fontSize="11" fontFamily="var(--font-serif)" fontWeight="bold" fill="#181615">OLD MILL DISTRICT</text>
            <text x="60" y="210" fontSize="11" fontFamily="var(--font-serif)" fontWeight="bold" fill="#181615">MARKET HALL</text>
            <text x="240" y="200" fontSize="12" fontFamily="var(--font-serif)" fontWeight="bold" fill="#181615">CIVIC SQUARE</text>
            <text x="186" y="225" fontSize="8" fill="#4D7C0F" fontWeight="bold">CENTRAL GREEN</text>
            <text x="435" y="85" fontSize="11" fontFamily="var(--font-serif)" fontWeight="bold" fill="#181615">NORTHSIDE SQUARE</text>
            <text x="660" y="140" fontSize="11" fontFamily="var(--font-serif)" fontWeight="bold" fill="#181615">EAST BAY PIER</text>
            <text x="660" y="320" fontSize="11" fontFamily="var(--font-serif)" fontWeight="bold" fill="#181615">HARBOR QUAY</text>
            <text x="590" y="50" fontSize="8" fill="#1D4ED8" fontWeight="bold" letterSpacing="1">CANAL WATERWAY</text>
            <text x="360" y="278" fontSize="8" fill="#1D4ED8" fontWeight="bold">M-1 CIVIC METRO</text>
          </g>

          {/* Compass Rose Accent */}
          <g transform="translate(735, 45)" stroke="#181615" strokeWidth="1.2">
            <circle cx="0" cy="0" r="16" fill="#FAF7F0" />
            <line x1="0" y1="-14" x2="0" y2="14" />
            <line x1="-14" y1="0" x2="14" y2="0" />
            <polygon points="0,-14 3,-2 0,0 -3,-2" fill="#181615" />
            <text x="0" y="-17" textAnchor="middle" fontSize="8" fontWeight="bold" fontFamily="monospace">N</text>
          </g>
        </svg>

        {/* Interactive Issue Pins Layer */}
        {markers.map((marker) => {
          const isActive = activePin?.id === marker.id;
          const isTomato = marker.type === 'complaint';

          return (
            <div
              key={marker.id}
              className="absolute transform -translate-x-1/2 -translate-y-1/2 z-20 group cursor-pointer"
              style={{ left: `${marker.x}%`, top: `${marker.y}%` }}
              onClick={() => setActivePin(isActive ? null : marker)}
              onMouseEnter={() => setActivePin(marker)}
            >
              {/* Pulsing ring */}
              <div
                className={`absolute -inset-2 rounded-full animate-ping opacity-30 ${
                  isTomato ? 'bg-[#EB4A26]' : 'bg-[#1D4ED8]'
                }`}
              ></div>

              {/* Pin button */}
              <div
                className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center font-mono font-bold text-xs shadow-md border-2 border-[#181615] dark:border-[#737B85] transition-transform duration-200 ${
                  isActive ? 'scale-125 z-30' : 'group-hover:scale-110'
                } ${
                  isTomato
                    ? 'bg-[#EB4A26] text-white'
                    : 'bg-[#1D4ED8] text-white'
                }`}
                title={`${marker.num}: ${marker.title}`}
              >
                {marker.num}
              </div>
            </div>
          );
        })}

        {/* Hover / Active Pin Card Overlay on Map */}
        {activePin && (
          <div
            className="absolute z-30 pointer-events-auto bg-[#FAF7F0] dark:bg-[#1E2125] border-2 border-[#181615] dark:border-[#737B85] rounded-2xl p-4 shadow-[4px_4px_0px_#181615] max-w-[280px] sm:max-w-[320px] animate-in fade-in zoom-in-95 duration-150"
            style={{
              left: `${Math.min(Math.max(activePin.x, 22), 78)}%`,
              top: activePin.y > 55 ? `${activePin.y - 32}%` : `${activePin.y + 12}%`,
              transform: 'translateX(-50%)',
            }}
          >
            <div className="flex items-center justify-between gap-2 pb-2 mb-2 border-b border-[#E8E1D5] dark:border-[#39414B]">
              <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-[#EB4A26] dark:text-[#FF8B6D]">
                ISSUE #{activePin.num} · {activePin.area}
              </span>
              <span
                className={`text-[9px] font-mono px-1.5 py-0.5 rounded border font-bold uppercase ${
                  activePin.status === 'Resolved'
                    ? 'bg-[#E3EED3] dark:bg-[#253321] text-[#3F6212] border-[#A3C280]'
                    : activePin.status === 'Assigned'
                    ? 'bg-[#EFF6FF] dark:bg-[#1B2C46] text-[#1D4ED8] dark:text-[#93B5FF] border-[#BFDBFE]'
                    : 'bg-[#FFFBEB] dark:bg-[#352F20] text-[#B45309] border-[#FDE68A]'
                }`}
              >
                {activePin.status}
              </span>
            </div>

            <h4 className="text-xs font-bold text-[#181615] dark:text-[#F4EFE6] leading-snug line-clamp-2">
              {activePin.title}
            </h4>

            <div className="mt-2.5 pt-2 border-t border-[#E8E1D5] dark:border-[#39414B] flex items-center justify-between">
              <span className="font-mono text-[10px] text-[#665F57] dark:text-[#BBB3A7]">
                {activePin.refNumber}
              </span>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectReport(activePin.refNumber);
                }}
                className="inline-flex items-center gap-1 text-[11px] font-bold text-[#1D4ED8] dark:text-[#93B5FF] hover:text-[#1E40AF] underline decoration-1"
              >
                <span>Inspect Timeline</span>
                <ArrowUpRight className="w-3 h-3" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Map Legend Footer Strip */}
      <div className="bg-[#FAF7F0] dark:bg-[#1E2125] border-t-2 border-[#181615] dark:border-[#737B85] px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 text-xs text-[#4A453F] dark:text-[#CCC5BA]">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-[#EB4A26] border border-[#181615] dark:border-[#737B85] shrink-0"></span>
            <span className="font-mono text-[11px]">Issue Reported</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-[#1D4ED8] border border-[#181615] dark:border-[#737B85] shrink-0"></span>
            <span className="font-mono text-[11px]">Civic Idea</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-5 h-1 bg-[#1D4ED8] shrink-0"></span>
            <span className="font-mono text-[11px]">Transit Corridor M-1</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-[#E3EED3] dark:bg-[#253321] border border-[#A3C280] shrink-0"></span>
            <span className="font-mono text-[11px]">Parkland</span>
          </div>
        </div>

        <div className="text-[11px] font-mono text-[#857E75] dark:text-[#AAA295]">
          Click pin to preview notice
        </div>
      </div>
    </div>
  );
};

