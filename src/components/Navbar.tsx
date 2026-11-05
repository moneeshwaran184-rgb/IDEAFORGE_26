import React, { useState, useRef, useEffect } from 'react';
import {
  ChevronDown,
  Menu,
  X,
  Search,
  ArrowRight,
  AlertTriangle,
  Lightbulb,
  MapPin,
  Compass,
  User,
  Plus,
} from 'lucide-react';
import { COMPLAINT_CATEGORIES, SUGGESTION_CATEGORIES } from '../data/categories';
import { CategoryIcon } from './CategoryIcon';

interface NavbarProps {
  currentView: string;
  onNavigate: (view: string, categoryId?: string) => void;
  userProfile: { name: string; isDemoUser: boolean };
  onToggleProfileModal: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentView,
  onNavigate,
  userProfile,
  onToggleProfileModal,
}) => {
  const [activeDropdown, setActiveDropdown] = useState<'complaint' | 'suggestion' | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileExpandedSection, setMobileExpandedSection] = useState<'complaint' | 'suggestion' | null>(null);

  const complaintDropdownRef = useRef<HTMLDivElement>(null);
  const suggestionDropdownRef = useRef<HTMLDivElement>(null);
  const dropdownCloseTimeout = useRef<number | null>(null);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setActiveDropdown(null);
        setMobileMenuOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        complaintDropdownRef.current &&
        !complaintDropdownRef.current.contains(target) &&
        suggestionDropdownRef.current &&
        !suggestionDropdownRef.current.contains(target)
      ) {
        setActiveDropdown(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleMouseEnter = (menu: 'complaint' | 'suggestion') => {
    if (dropdownCloseTimeout.current) {
      window.clearTimeout(dropdownCloseTimeout.current);
      dropdownCloseTimeout.current = null;
    }
    setActiveDropdown(menu);
  };

  const handleMouseLeave = () => {
    dropdownCloseTimeout.current = window.setTimeout(() => {
      setActiveDropdown(null);
    }, 180);
  };

  const handleSelectCategory = (view: 'complaint' | 'suggestion', categoryId: string) => {
    setActiveDropdown(null);
    setMobileMenuOpen(false);
    onNavigate(view, categoryId);
  };

  return (
    <header className="sticky top-0 z-40 bg-[#FDFBF7] dark:bg-[#191C20] border-b-2 border-[#181615] dark:border-[#737B85] transition-all">
      {/* Editorial Civic Masthead Ticker */}
      <div className="bg-[#181615] text-[#FAF7F0] px-4 py-1 text-[11px] font-mono flex items-center justify-between border-b border-[#332F2B]">
        <div className="flex items-center gap-2">
          <span className="px-1.5 py-0.2 bg-[#EB4A26] text-white font-bold rounded-xs text-[10px] uppercase tracking-wider">
            DEMO NOTICE
          </span>
          <span className="hidden sm:inline text-[#D6CCBE]">
            Fix My City · Civic Noticeboard & Neighborhood Triage Simulator
          </span>
          <span className="sm:hidden text-[#D6CCBE]">Civic Noticeboard Demo</span>
        </div>
        <div className="hidden md:flex items-center gap-4 text-[#A89F91]">
          <span>EDITION: LOCAL RESIDENTS</span>
          <span>·</span>
          <span>DISPATCH: DEMO ONLY</span>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 md:h-18 gap-6">
          {/* Distinctive Editorial Wordmark */}
          <div className="flex items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={() => onNavigate('home')}
              className="flex items-center gap-2.5 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1D4ED8] rounded-sm group"
            >
              <div className="w-8 h-8 rounded-lg bg-[#181615] text-[#FDFBF7] flex items-center justify-center font-editorial font-bold text-lg shadow-[2px_2px_0px_#EB4A26] group-hover:scale-105 transition-transform">
                F
              </div>
              <div className="flex flex-col">
                <span className="font-editorial text-xl font-extrabold tracking-tight text-[#181615] dark:text-[#F4EFE6] leading-none">
                  FIX MY CITY
                </span>
                <span className="font-mono text-[10px] uppercase tracking-widest text-[#665F57] dark:text-[#BBB3A7] mt-0.5">
                  Neighborhood Gazette
                </span>
              </div>
            </button>
          </div>

          {/* Center Navigation Links (Desktop) */}
          <nav className="hidden xl:flex items-center gap-1 xl:gap-2 text-sm font-semibold text-[#332F2B] dark:text-[#E3DED5]">
            {/* Home Link */}
            <button
              type="button"
              onClick={() => onNavigate('home')}
              className={`px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap ${
                currentView === 'home'
                  ? 'bg-[#EFE8DC] dark:bg-[#30363D] text-[#181615] dark:text-[#F4EFE6] font-bold'
                  : 'hover:bg-[#F4EFE6] text-[#4A453F] dark:text-[#CCC5BA]'
              }`}
            >
              Dashboard
            </button>

            {!userProfile.isDemoUser && <button onClick={()=>onNavigate('my-reports')} className={'px-3 py-1.5 rounded-lg font-semibold whitespace-nowrap '+(currentView==='my-reports'?'bg-[#EFE8DC] dark:bg-[#30363D]':'hover:bg-[#F4EFE6] dark:hover:bg-[#292E34]')} aria-current={currentView==='my-reports'?'page':undefined}>My reports</button>}
            <button onClick={()=>onNavigate('city-reports')} aria-current={currentView==='city-reports'?'page':undefined} className="px-3 py-1.5 rounded-lg font-semibold whitespace-nowrap">City reports</button>
            <button onClick={()=>onNavigate('heat-map')} aria-current={currentView==='heat-map'?'page':undefined} className="px-3 py-1.5 rounded-lg font-semibold whitespace-nowrap">Heat map</button>
            {/* Complaints Dropdown Panel */}
            <div
              ref={complaintDropdownRef}
              className="relative"
              onMouseEnter={() => handleMouseEnter('complaint')}
              onMouseLeave={handleMouseLeave}
            >
              <button
                type="button"
                onClick={() => setActiveDropdown(activeDropdown === 'complaint' ? null : 'complaint')}
                aria-expanded={activeDropdown === 'complaint'}
                aria-haspopup="true"
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap ${
                  currentView === 'complaint' || activeDropdown === 'complaint'
                    ? 'bg-[#EFE8DC] dark:bg-[#30363D] text-[#181615] dark:text-[#F4EFE6] font-bold'
                    : 'hover:bg-[#F4EFE6] text-[#4A453F] dark:text-[#CCC5BA]'
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-[#EB4A26]"></span>
                <span>Report an Issue</span>
                <ChevronDown
                  className={`w-3.5 h-3.5 transition-transform duration-200 text-[#857E75] dark:text-[#AAA295] ${
                    activeDropdown === 'complaint' ? 'rotate-180 text-[#EB4A26] dark:text-[#FF8B6D]' : ''
                  }`}
                />
              </button>

              {/* Distinctive Category Panel for Complaints */}
              {activeDropdown === 'complaint' && (
                <div
                  className="absolute left-0 mt-2 w-[460px] bg-[#FAF7F0] dark:bg-[#1E2125] rounded-2xl border-2 border-[#181615] dark:border-[#737B85] shadow-[6px_6px_0px_#181615] p-4 transition-all duration-150 animate-in fade-in slide-in-from-top-1 z-50"
                  role="menu"
                >
                  {/* Panel Header */}
                  <div className="pb-3 mb-3 border-b border-[#E8E1D5] dark:border-[#39414B] flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-1.5 text-[10px] font-mono font-bold text-[#EB4A26] dark:text-[#FF8B6D] uppercase tracking-wider">
                        <MapPin className="w-3 h-3" />
                        <span>Municipal Problem Intake</span>
                      </div>
                      <h4 className="font-editorial text-base font-bold text-[#181615] dark:text-[#F4EFE6] mt-0.5">
                        Report a City Issue
                      </h4>
                      <p className="text-[11px] text-[#665F57] dark:text-[#BBB3A7]">
                        Street hazards, road craters, outages, and sanitation dockets
                      </p>
                    </div>

                    <div className="w-8 h-8 rounded-full bg-[#FBEAE5] dark:bg-[#392720] text-[#EB4A26] dark:text-[#FF8B6D] flex items-center justify-center font-bold text-xs shrink-0">
                      9
                    </div>
                  </div>

                  {/* 2-Column Grid of Category Cards */}
                  <div className="grid grid-cols-2 gap-2 max-h-[340px] overflow-y-auto pr-1">
                    {COMPLAINT_CATEGORIES.map((cat) => (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => handleSelectCategory('complaint', cat.id)}
                        className="flex items-start gap-2.5 p-2 rounded-xl bg-white dark:bg-[#22262B] hover:bg-[#F4EFE6] border border-[#E8E1D5] dark:border-[#39414B] hover:border-[#181615] transition-all text-left group"
                        role="menuitem"
                      >
                        <div
                          className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
                          style={{ backgroundColor: `${cat.color}15`, color: cat.color }}
                        >
                          <CategoryIcon name={cat.iconName} className="w-3.5 h-3.5" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-[#181615] dark:text-[#F4EFE6] group-hover:text-[#EB4A26] transition-colors truncate">
                            {cat.name}
                          </p>
                          <p className="text-[10px] text-[#665F57] dark:text-[#BBB3A7] line-clamp-1">
                            {cat.shortDesc}
                          </p>
                        </div>
                      </button>
                    ))}
                  </div>

                  {/* Panel Footer */}
                  <div className="mt-3 pt-2.5 border-t border-[#E8E1D5] dark:border-[#39414B] flex items-center justify-between text-xs">
                    <span className="font-mono text-[10px] text-[#857E75] dark:text-[#AAA295]">
                      Direct triage simulation
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setActiveDropdown(null);
                        onNavigate('complaint');
                      }}
                      className="font-bold text-[#EB4A26] dark:text-[#FF8B6D] hover:underline flex items-center gap-1 text-[11px]"
                    >
                      <span>View All Categories</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Suggestions Dropdown Panel */}
            <div
              ref={suggestionDropdownRef}
              className="relative"
              onMouseEnter={() => handleMouseEnter('suggestion')}
              onMouseLeave={handleMouseLeave}
            >
              <button
                type="button"
                onClick={() => setActiveDropdown(activeDropdown === 'suggestion' ? null : 'suggestion')}
                aria-expanded={activeDropdown === 'suggestion'}
                aria-haspopup="true"
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap ${
                  currentView === 'suggestion' || activeDropdown === 'suggestion'
                    ? 'bg-[#EFE8DC] dark:bg-[#30363D] text-[#181615] dark:text-[#F4EFE6] font-bold'
                    : 'hover:bg-[#F4EFE6] text-[#4A453F] dark:text-[#CCC5BA]'
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-[#1D4ED8]"></span>
                <span>Share an Idea</span>
                <ChevronDown
                  className={`w-3.5 h-3.5 transition-transform duration-200 text-[#857E75] dark:text-[#AAA295] ${
                    activeDropdown === 'suggestion' ? 'rotate-180 text-[#1D4ED8] dark:text-[#93B5FF]' : ''
                  }`}
                />
              </button>

              {/* Distinctive Category Panel for Suggestions */}
              {activeDropdown === 'suggestion' && (
                <div
                  className="absolute left-0 mt-2 w-[460px] bg-[#FAF7F0] dark:bg-[#1E2125] rounded-2xl border-2 border-[#181615] dark:border-[#737B85] shadow-[6px_6px_0px_#181615] p-4 transition-all duration-150 animate-in fade-in slide-in-from-top-1 z-50"
                  role="menu"
                >
                  {/* Panel Header */}
                  <div className="pb-3 mb-3 border-b border-[#E8E1D5] dark:border-[#39414B] flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-1.5 text-[10px] font-mono font-bold text-[#1D4ED8] dark:text-[#93B5FF] uppercase tracking-wider">
                        <Compass className="w-3 h-3" />
                        <span>Civic Innovation Ideas</span>
                      </div>
                      <h4 className="font-editorial text-base font-bold text-[#181615] dark:text-[#F4EFE6] mt-0.5">
                        Propose an Improvement
                      </h4>
                      <p className="text-[11px] text-[#665F57] dark:text-[#BBB3A7]">
                        Bike lanes, solar canopies, community gardens & public spaces
                      </p>
                    </div>

                    <div className="w-8 h-8 rounded-full bg-[#EFF6FF] dark:bg-[#1B2C46] text-[#1D4ED8] dark:text-[#93B5FF] flex items-center justify-center font-bold text-xs shrink-0">
                      7
                    </div>
                  </div>

                  {/* 2-Column Grid */}
                  <div className="grid grid-cols-2 gap-2 max-h-[340px] overflow-y-auto pr-1">
                    {SUGGESTION_CATEGORIES.map((cat) => (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => handleSelectCategory('suggestion', cat.id)}
                        className="flex items-start gap-2.5 p-2 rounded-xl bg-white dark:bg-[#22262B] hover:bg-[#F4EFE6] border border-[#E8E1D5] dark:border-[#39414B] hover:border-[#181615] transition-all text-left group"
                        role="menuitem"
                      >
                        <div
                          className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
                          style={{ backgroundColor: `${cat.color}15`, color: cat.color }}
                        >
                          <CategoryIcon name={cat.iconName} className="w-3.5 h-3.5" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-[#181615] dark:text-[#F4EFE6] group-hover:text-[#1D4ED8] transition-colors truncate">
                            {cat.name}
                          </p>
                          <p className="text-[10px] text-[#665F57] dark:text-[#BBB3A7] line-clamp-1">
                            {cat.shortDesc}
                          </p>
                        </div>
                      </button>
                    ))}
                  </div>

                  {/* Panel Footer */}
                  <div className="mt-3 pt-2.5 border-t border-[#E8E1D5] dark:border-[#39414B] flex items-center justify-between text-xs">
                    <span className="font-mono text-[10px] text-[#857E75] dark:text-[#AAA295]">
                      Community-led suggestions
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setActiveDropdown(null);
                        onNavigate('suggestion');
                      }}
                      className="font-bold text-[#1D4ED8] dark:text-[#93B5FF] hover:underline flex items-center gap-1 text-[11px]"
                    >
                      <span>View All Proposals</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Track a Report */}
            <button
              type="button"
              onClick={() => onNavigate('track')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap ${
                currentView === 'track'
                  ? 'bg-[#EFE8DC] dark:bg-[#30363D] text-[#181615] dark:text-[#F4EFE6] font-bold'
                  : 'hover:bg-[#F4EFE6] text-[#4A453F] dark:text-[#CCC5BA]'
              }`}
            >
              <Search className="w-3.5 h-3.5 text-[#181615] dark:text-[#F4EFE6]" />
              <span>Track a Report</span>
            </button>
          </nav>

          {/* Right Action: Unmistakable Primary CTA + Resident Profile */}
          <div className="flex items-center gap-3 shrink-0">
            {/* Submission links are available in the main navigation. */}{userProfile.isDemoUser && (
            <button
              type="button"
              onClick={() => onNavigate('complaint')}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#EB4A26] hover:bg-[#D73A17] text-white font-bold text-xs uppercase tracking-wider rounded-xl border-2 border-[#181615] dark:border-[#737B85] shadow-[2px_2px_0px_#181615] hover:shadow-[1px_1px_0px_#181615] hover:translate-x-[1px] hover:translate-y-[1px] transition-all whitespace-nowrap"
            >
              <Plus className="w-3.5 h-3.5 stroke-[3]" />
              <span>Report an Issue</span>
            </button>

            )}{/* Resident Badge Button */}
            <button
              type="button"
              onClick={onToggleProfileModal}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border border-[#D6CCBE] dark:border-[#48515C] bg-white dark:bg-[#22262B] hover:bg-[#F4EFE6] transition-colors text-[#181615] dark:text-[#F4EFE6] text-xs font-semibold shadow-xs"
              title="My account"
            >
              <div className="w-5 h-5 rounded-full bg-[#181615] text-white flex items-center justify-center text-[9px] font-mono font-bold">
                {userProfile.name.charAt(0)}
              </div>
              <span className="hidden sm:inline font-mono text-[11px] font-medium text-[#4A453F] dark:text-[#CCC5BA]">
                {userProfile.isDemoUser ? 'Log in' : 'My account'}
              </span>
            </button>

            {/* Mobile Hamburger Button */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="xl:hidden p-2 rounded-xl text-[#181615] dark:text-[#F4EFE6] hover:bg-[#EFE8DC] border border-[#D6CCBE] dark:border-[#48515C]"
              aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="xl:hidden bg-[#FAF7F0] dark:bg-[#1E2125] border-t-2 border-[#181615] dark:border-[#737B85] px-4 pt-4 pb-6 space-y-3 animate-in slide-in-from-top-2 duration-150 shadow-xl max-h-[85vh] overflow-y-auto">
          {!userProfile.isDemoUser && <button onClick={()=>{setMobileMenuOpen(false);onNavigate('my-reports');}} className="w-full text-left px-3 py-2.5 rounded-xl font-bold">My reports</button>}
          <button onClick={()=>{setMobileMenuOpen(false);onNavigate('city-reports');}} className="w-full text-left px-3 py-2.5 font-bold">City reports</button>
          <button onClick={()=>{setMobileMenuOpen(false);onNavigate('heat-map');}} className="w-full text-left px-3 py-2.5 font-bold">Heat map</button>
          {/* Main Links */}
          <div className="space-y-1">
            <button
              type="button"
              onClick={() => {
                setMobileMenuOpen(false);
                onNavigate('home');
              }}
              className={`w-full text-left px-3 py-2.5 rounded-xl text-sm font-bold transition-colors ${
                currentView === 'home' ? 'bg-[#EFE8DC] dark:bg-[#30363D] text-[#181615] dark:text-[#F4EFE6]' : 'hover:bg-[#F4EFE6]'
              }`}
            >
              Dashboard
            </button>

            <button
              type="button"
              onClick={() => {
                setMobileMenuOpen(false);
                onNavigate('track');
              }}
              className={`w-full text-left px-3 py-2.5 rounded-xl text-sm font-bold flex items-center justify-between transition-colors ${
                currentView === 'track' ? 'bg-[#EFE8DC] dark:bg-[#30363D] text-[#181615] dark:text-[#F4EFE6]' : 'hover:bg-[#F4EFE6]'
              }`}
            >
              <span className="flex items-center gap-2">
                <Search className="w-4 h-4 text-[#181615] dark:text-[#F4EFE6]" />
                Track a Report
              </span>
              <span className="font-mono text-[11px] text-[#665F57] dark:text-[#BBB3A7]">Lookup code</span>
            </button>
          </div>

          {/* Expandable Accordion: Register a Complaint */}
          <div className="border-2 border-[#181615] dark:border-[#737B85] rounded-xl overflow-hidden bg-white dark:bg-[#22262B]">
            <button
              type="button"
              onClick={() =>
                setMobileExpandedSection(mobileExpandedSection === 'complaint' ? null : 'complaint')
              }
              className="w-full flex items-center justify-between p-3 bg-[#FAF7F0] dark:bg-[#1E2125] text-left text-xs font-bold text-[#181615] dark:text-[#F4EFE6]"
            >
              <span className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#EB4A26]"></span>
                Report an Issue (9 Categories)
              </span>
              <ChevronDown
                className={`w-4 h-4 transition-transform duration-200 ${
                  mobileExpandedSection === 'complaint' ? 'rotate-180' : ''
                }`}
              />
            </button>

            {mobileExpandedSection === 'complaint' && (
              <div className="p-3 space-y-1.5 bg-white dark:bg-[#22262B] border-t border-[#E8E1D5] dark:border-[#39414B]">
                <button
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    onNavigate('complaint');
                  }}
                  className="w-full text-left p-2 rounded-lg text-xs font-bold text-[#EB4A26] dark:text-[#FF8B6D] bg-[#FBEAE5] dark:bg-[#392720] flex items-center justify-between"
                >
                  <span>Open General Problem Form</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 pt-1">
                  {COMPLAINT_CATEGORIES.map((cat) => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => handleSelectCategory('complaint', cat.id)}
                      className="flex items-center gap-2 p-2 rounded-lg hover:bg-[#F4EFE6] text-left text-xs font-medium text-[#181615] dark:text-[#F4EFE6]"
                    >
                      <div
                        className="w-6 h-6 rounded flex items-center justify-center shrink-0"
                        style={{ backgroundColor: `${cat.color}15`, color: cat.color }}
                      >
                        <CategoryIcon name={cat.iconName} className="w-3 h-3" />
                      </div>
                      <span className="truncate">{cat.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Expandable Accordion: Submit a Suggestion */}
          <div className="border-2 border-[#181615] dark:border-[#737B85] rounded-xl overflow-hidden bg-white dark:bg-[#22262B]">
            <button
              type="button"
              onClick={() =>
                setMobileExpandedSection(mobileExpandedSection === 'suggestion' ? null : 'suggestion')
              }
              className="w-full flex items-center justify-between p-3 bg-[#FAF7F0] dark:bg-[#1E2125] text-left text-xs font-bold text-[#181615] dark:text-[#F4EFE6]"
            >
              <span className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#1D4ED8]"></span>
                Share an Idea (7 Categories)
              </span>
              <ChevronDown
                className={`w-4 h-4 transition-transform duration-200 ${
                  mobileExpandedSection === 'suggestion' ? 'rotate-180' : ''
                }`}
              />
            </button>

            {mobileExpandedSection === 'suggestion' && (
              <div className="p-3 space-y-1.5 bg-white dark:bg-[#22262B] border-t border-[#E8E1D5] dark:border-[#39414B]">
                <button
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    onNavigate('suggestion');
                  }}
                  className="w-full text-left p-2 rounded-lg text-xs font-bold text-[#1D4ED8] dark:text-[#93B5FF] bg-[#EFF6FF] dark:bg-[#1B2C46] flex items-center justify-between"
                >
                  <span>Open Proposal Blank Slate</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 pt-1">
                  {SUGGESTION_CATEGORIES.map((cat) => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => handleSelectCategory('suggestion', cat.id)}
                      className="flex items-center gap-2 p-2 rounded-lg hover:bg-[#F4EFE6] text-left text-xs font-medium text-[#181615] dark:text-[#F4EFE6]"
                    >
                      <div
                        className="w-6 h-6 rounded flex items-center justify-center shrink-0"
                        style={{ backgroundColor: `${cat.color}15`, color: cat.color }}
                      >
                        <CategoryIcon name={cat.iconName} className="w-3 h-3" />
                      </div>
                      <span className="truncate">{cat.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
};





