import React from 'react';
import { ArrowUpRight } from 'lucide-react';

interface FooterProps {
  onNavigate: (view: string, categoryId?: string) => void;
}

export const Footer: React.FC<FooterProps> = ({ onNavigate }) => {
  return (
    <footer className="bg-[#FAF7F0] dark:bg-[#1E2125] border-t-2 border-[#181615] dark:border-[#737B85] mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 pb-10 border-b-2 border-[#181615] dark:border-[#737B85]">
          {/* Brand Col */}
          <div className="space-y-2.5">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-md bg-[#181615] text-[#FAF7F0] flex items-center justify-center font-editorial font-bold text-sm shadow-[2px_2px_0px_#EB4A26]">
                F
              </div>
              <span className="font-editorial text-lg font-extrabold text-[#181615] dark:text-[#F4EFE6] tracking-tight">
                FIX MY CITY
              </span>
            </div>
            <p className="text-xs text-[#4A453F] dark:text-[#CCC5BA] leading-relaxed">
              A civic noticeboard and local triage platform connecting residents with neighborhood problem tracking.
            </p>
            <div className="pt-1 font-mono text-[10px] text-[#857E75] dark:text-[#AAA295]">
              [ EDITION: LOCAL SIMULATION DEMO ]
            </div>
          </div>

          {/* Quick Nav Col */}
          <div>
            <h4 className="font-mono text-[11px] font-bold text-[#181615] dark:text-[#F4EFE6] uppercase tracking-wider mb-3">
              Noticeboard Navigation
            </h4>
            <ul className="space-y-1.5 text-xs font-semibold text-[#4A453F] dark:text-[#CCC5BA]">
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate('home')}
                  className="hover:text-[#EB4A26] transition-colors"
                >
                  Gazette Noticeboard
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate('complaint')}
                  className="hover:text-[#EB4A26] transition-colors"
                >
                  Report a Street Problem
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate('suggestion')}
                  className="hover:text-[#EB4A26] transition-colors"
                >
                  Propose a Neighborhood Idea
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate('track')}
                  className="hover:text-[#EB4A26] transition-colors"
                >
                  Track an Active Ticket
                </button>
              </li>
            </ul>
          </div>

          {/* Category Shortcuts */}
          <div>
            <h4 className="font-mono text-[11px] font-bold text-[#181615] dark:text-[#F4EFE6] uppercase tracking-wider mb-3">
              Common Issue Dockets
            </h4>
            <ul className="space-y-1.5 text-xs font-semibold text-[#4A453F] dark:text-[#CCC5BA]">
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate('complaint', 'roads-potholes')}
                  className="hover:text-[#EB4A26] transition-colors"
                >
                  Roads & Asphalt Potholes
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate('complaint', 'streetlights')}
                  className="hover:text-[#EB4A26] transition-colors"
                >
                  Streetlight Outages
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate('complaint', 'accessibility')}
                  className="hover:text-[#EB4A26] transition-colors"
                >
                  Tactile Pavers & Curb Cuts
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate('suggestion', 'clean-energy')}
                  className="hover:text-[#EB4A26] transition-colors"
                >
                  Community Solar & EV Canopies
                </button>
              </li>
            </ul>
          </div>

          {/* Civic Notice */}
          <div>
            <h4 className="font-mono text-[11px] font-bold text-[#181615] dark:text-[#F4EFE6] uppercase tracking-wider mb-3">
              Civic Disclaimer
            </h4>
            <p className="text-xs text-[#4A453F] dark:text-[#CCC5BA] leading-relaxed mb-2">
              This interactive demonstration is configured for local evaluation. Data persists in browser storage and does not dispatch emergency response personnel.
            </p>
            <div className="font-mono text-[10px] text-[#EB4A26] dark:text-[#FF8B6D] font-bold">
              FOR LIFE-THREATENING EMERGENCIES: CALL 911
            </div>
          </div>
        </div>

        {/* Bottom Line */}
        <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs font-mono text-[#857E75] dark:text-[#AAA295]">
          <div>
            © 2026 Fix My City. Designed with civic accessibility standards.
          </div>
          <div className="flex items-center gap-3">
            <span>District Atlas</span>
            <span>·</span>
            <span>Local Triage Protocol</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

