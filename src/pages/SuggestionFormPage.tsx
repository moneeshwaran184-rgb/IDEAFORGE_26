import { assessSuggestion, fingerprint, SuggestionAssessment } from '../services/assessment';
import { LocationSearch } from '../components/LocationSearch';
import React, { useState, useEffect } from 'react';
import {
  Lightbulb,
  MapPin,
  Check,
  ArrowRight,
  Copy,
  Crosshair,
  User,
  EyeOff,
  Compass,
  FileText,
} from 'lucide-react';
import { SUGGESTION_CATEGORIES, CITY_DISTRICTS } from '../data/categories';
import { CategoryIcon } from '../components/CategoryIcon';
import { MapPreviewPlaceholder } from '../components/MapPreviewPlaceholder';
import { CivicService, SuggestionCreateInput } from '../services/civicService';
import { CivicReport } from '../types';

interface SuggestionFormPageProps {
  initialCategoryId?: string;
  onNavigateToTrack: (refNumber: string) => void;
  onReportCreated: (newReport: CivicReport) => void;
}

export const SuggestionFormPage: React.FC<SuggestionFormPageProps> = ({
  initialCategoryId,
  onNavigateToTrack,
  onReportCreated,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>(
    initialCategoryId || ''
  );
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [communityBenefits, setCommunityBenefits] = useState('');

  // Location state
  const [selectedDistrictId, setSelectedDistrictId] = useState<string>(CITY_DISTRICTS[0].id);
  const [address, setAddress] = useState('Central Promenade & 3rd St');
  const [landmark, setLandmark] = useState('');
  const [lat, setLat] = useState<number>(CITY_DISTRICTS[0].defaultLat);
  const [lng, setLng] = useState<number>(CITY_DISTRICTS[0].defaultLng);
  const [isLocating, setIsLocating] = useState(false);
  const [geoNotice, setGeoNotice] = useState<string | null>(null);

  // Privacy preference
  const [contactPreference, setContactPreference] = useState<'public' | 'private' | 'anonymous'>('public');
  const [contactName, setContactName] = useState('Maya Lin');
  const [contactEmail, setContactEmail] = useState('maya.lin@civic.test');

  // Validation & status
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [assessment,setAssessment] = useState<SuggestionAssessment|null>(null);
  const [mergedSuggestion,setMergedSuggestion] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedReport, setSubmittedReport] = useState<CivicReport | null>(null);
  const [copiedRef, setCopiedRef] = useState(false);

  useEffect(() => {
    if (initialCategoryId) {
      setSelectedCategory(initialCategoryId);
    }
  }, [initialCategoryId]);

  const currentDistrict = CITY_DISTRICTS.find((d) => d.id === selectedDistrictId) || CITY_DISTRICTS[0];

  const handleDistrictChange = (distId: string) => {
    setSelectedDistrictId(distId);
    const dist = CITY_DISTRICTS.find((d) => d.id === distId);
    if (dist) {
      setLat(dist.defaultLat);
      setLng(dist.defaultLng);
      setAddress(`${dist.landmarks[0] || 'Civic Corridor'}`);
    }
  };

  const handleUseMyLocation = () => {
    setIsLocating(true);
    setGeoNotice(null);

    if (!navigator.geolocation) {
      setGeoNotice('Geolocation is not supported by your browser. Using simulated city center coordinates.');
      setIsLocating(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setIsLocating(false);
        const userLat = parseFloat(position.coords.latitude.toFixed(5));
        const userLng = parseFloat(position.coords.longitude.toFixed(5));
        setLat(userLat);
        setLng(userLng);
        setAddress(`GPS Pin (${userLat.toFixed(4)}, ${userLng.toFixed(4)})`);
        setGeoNotice('Location accurately acquired via browser sensor.');
      },
      () => {
        setIsLocating(false);
        
        
        
        setGeoNotice('Location permission not granted or timeout. Position placed at Civic Green Corridor.');
      },
      { timeout: 7000 }
    );
  };

  const validate = (): boolean => {
    const errs: Record<string, string> = {}; if (!selectedCategory) errs.form = 'Please select a category.';
    if (!title.trim()) {
      errs.title = 'Please provide a clear title for your proposal.';
    } else if (title.trim().length < 5) {
      errs.title = 'Title must be at least 5 characters.';
    }

    if (!description.trim()) {
      errs.description = 'Please detail your proposal and its benefits.';
    } else if (description.trim().length < 15) {
      errs.description = 'Please describe your idea in a bit more depth (at least 15 characters).';
    }

    if (!address.trim()) {
      errs.address = 'Please specify the street, park, or corridor where this would be situated.';
    }

    if (contactPreference !== 'anonymous' && contactEmail && !contactEmail.includes('@')) {
      errs.contactEmail = 'Please provide a valid email.';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  useEffect(()=>{setAssessment(null);}, [title,description,selectedCategory,communityBenefits,selectedDistrictId,address,lat,lng]);
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    try {
      const fullDescription = communityBenefits.trim()
        ? `${description.trim()}\n\nExpected Neighborhood Impact: ${communityBenefits.trim()}`
        : description.trim();

      const payload: SuggestionCreateInput = {
        category: selectedCategory,
        title,
        description: fullDescription,
        area: currentDistrict.name,
        address,
        lat,
        lng,
        landmark,
        contactPreference,
        contactName: contactPreference === 'anonymous' ? undefined : contactName,
        contactEmail: contactPreference === 'anonymous' ? undefined : contactEmail,
      };

      if (!assessment || assessment.fingerprint !== fingerprint('suggestion',payload)) { setAssessment(await assessSuggestion(payload)); return; }
      payload.assessmentId = assessment.assessmentId;
      const merged = await CivicService.mergeSimilarSuggestion(payload);
      if (merged) {
        setMergedSuggestion(true);
        setSubmittedReport(merged);
        onReportCreated(merged);
        return;
      }
      const created = await CivicService.createSuggestion(payload);
      setMergedSuggestion(false);
      setSubmittedReport(created);
      onReportCreated(created);
    } catch (err) {
      console.error(err);
      setErrors((prev) => ({ ...prev, form: err instanceof Error ? err.message : 'Unable to submit. Please try again.' }));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCopyReference = () => {
    if (submittedReport) {
      navigator.clipboard.writeText(submittedReport.referenceNumber);
      setCopiedRef(true);
      setTimeout(() => setCopiedRef(false), 2000);
    }
  };

  if (submittedReport) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-12">
        <div className="bg-[#FAF7F0] dark:bg-[#1E2125] rounded-3xl border-2 border-[#181615] dark:border-[#737B85] p-8 sm:p-10 shadow-[6px_6px_0px_#181615] text-center">
          <div className="w-14 h-14 rounded-2xl bg-[#EFF6FF] dark:bg-[#1B2C46] text-[#1D4ED8] dark:text-[#93B5FF] border-2 border-[#181615] dark:border-[#737B85] flex items-center justify-center mx-auto mb-5 shadow-[2px_2px_0px_#181615]">
            <Compass className="w-7 h-7 stroke-[2.5]" />
          </div>

          <div className="inline-block px-2.5 py-0.5 bg-[#FAF7F0] dark:bg-[#1E2125] border border-[#181615] dark:border-[#737B85] text-[#181615] dark:text-[#F4EFE6] rounded-md text-[10px] font-mono font-bold uppercase mb-3">
            {mergedSuggestion ? '[ COMMUNITY IDEA JOINED · SHARED DOCKET ]' : '[ CIVIC PROPOSAL DOCKET · DEMO RECORD ]'}
          </div>

          <h2 className="font-editorial text-2xl sm:text-3xl font-extrabold text-[#181615] dark:text-[#F4EFE6]">
            {mergedSuggestion ? 'Your Idea Joined a Similar Proposal' : 'Civic Idea Published'}
          </h2>

          <p className="text-xs sm:text-sm text-[#4A453F] dark:text-[#CCC5BA] max-w-md mx-auto mt-2 mb-6">
            {mergedSuggestion ? 'A similar open suggestion already exists. Your support is now linked to that shared department review, and you can follow its progress here.' : 'Your proposal has been pinned to the public district board. Neighbors can discover it and vote to add community visibility.'}
          </p>

          <div className="bg-white dark:bg-[#22262B] border-2 border-dashed border-[#181615] dark:border-[#737B85] rounded-2xl p-5 max-w-md mx-auto mb-8 text-left space-y-3">
            <div className="flex items-center justify-between border-b border-[#E8E1D5] dark:border-[#39414B] pb-2">
              <span className="font-mono text-[10px] font-bold text-[#1D4ED8] dark:text-[#93B5FF] uppercase">
                PROPOSAL REFERENCE
              </span>
              <span className="font-mono text-[10px] text-[#857E75] dark:text-[#AAA295]">
                VOTES: 1 (INITIAL)
              </span>
            </div>

            <div className="flex items-center justify-between gap-3">
              <span className="font-mono text-2xl font-black text-[#181615] dark:text-[#F4EFE6] tracking-tight">
                {submittedReport.referenceNumber}
              </span>
              <button
                type="button"
                onClick={handleCopyReference}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-bold bg-[#FAF7F0] dark:bg-[#1E2125] hover:bg-[#F4EFE6] border border-[#181615] dark:border-[#737B85] text-[#181615] dark:text-[#F4EFE6]"
              >
                {copiedRef ? <Check className="w-3.5 h-3.5 text-[#1D4ED8] dark:text-[#93B5FF]" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedRef ? 'Copied' : 'Copy'}</span>
              </button>
            </div>

            <div className="pt-2 border-t border-[#E8E1D5] dark:border-[#39414B] text-xs space-y-1 text-[#4A453F] dark:text-[#CCC5BA]">
              <div><strong>Idea:</strong> {submittedReport.title}</div>
              <div><strong>Target:</strong> {submittedReport.location.address}, {submittedReport.location.area}</div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => onNavigateToTrack(submittedReport.referenceNumber)}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-[#1D4ED8] hover:bg-[#1E40AF] text-white font-bold text-xs uppercase tracking-wider border-2 border-[#181615] dark:border-[#737B85] shadow-[3px_3px_0px_#181615]"
            >
              <span>Track Proposal Docket</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>

            <button
              type="button"
              onClick={() => {
                setSubmittedReport(null);
                setMergedSuggestion(false);
                setTitle('');
                setDescription('');
                setCommunityBenefits('');
              }}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-white dark:bg-[#22262B] hover:bg-[#F4EFE6] text-[#181615] dark:text-[#F4EFE6] font-bold text-xs uppercase tracking-wider border-2 border-[#181615] dark:border-[#737B85]"
            >
              <span>Submit Another Idea</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
      <div className="mb-8 border-b-2 border-[#181615] dark:border-[#737B85] pb-5">
        <div className="flex items-center gap-2 font-mono text-xs font-bold text-[#1D4ED8] dark:text-[#93B5FF] uppercase tracking-wider mb-1">
          <span>● COMMUNITY INNOVATION DOCKET</span>
          <span>·</span>
          <span className="text-[#857E75] dark:text-[#AAA295]">PROPOSAL FORM</span>
        </div>
        <h1 className="font-editorial text-3xl sm:text-4xl font-extrabold text-[#181615] dark:text-[#F4EFE6] tracking-tight">
          Submit a Civic Suggestion
        </h1>
        <p className="text-xs sm:text-sm text-[#4A453F] dark:text-[#CCC5BA] mt-1">
          Propose neighborhood upgrades, clean energy corridors, bike networks, and park revitalization.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {errors.form && <p role="alert" className="p-4 border rounded text-red-600">{errors.form}</p>}
        {/* Step 1: Category */}
        <div className="bg-[#FAF7F0] dark:bg-[#1E2125] rounded-3xl border-2 border-[#181615] dark:border-[#737B85] p-6 sm:p-8 shadow-[4px_4px_0px_#181615]">
          <span className="font-mono text-[10px] font-bold text-[#1D4ED8] dark:text-[#93B5FF] uppercase">
            [ STEP 01 ]
          </span>
          <h2 className="font-editorial text-lg font-bold text-[#181615] dark:text-[#F4EFE6] mb-4">
            Select Innovation Category <span className="text-[#EB4A26] dark:text-[#FF8B6D]">*</span>
          </h2>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
            {SUGGESTION_CATEGORIES.map((cat) => {
              const isSelected = selectedCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`p-3 rounded-xl border-2 text-left transition-all flex flex-col justify-between ${
                    isSelected
                      ? 'border-[#181615] dark:border-[#737B85] bg-white dark:bg-[#22262B] shadow-[3px_3px_0px_#181615]'
                      : 'border-[#D6CCBE] dark:border-[#48515C] hover:border-[#181615] bg-[#FDFBF7] dark:bg-[#191C20]'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div
                      className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 border border-[#181615] dark:border-[#737B85]"
                      style={{ backgroundColor: `${cat.color}20`, color: cat.color }}
                    >
                      <CategoryIcon name={cat.iconName} className="w-3.5 h-3.5 stroke-[2.2]" />
                    </div>
                    {isSelected && (
                      <span className="w-2.5 h-2.5 rounded-full bg-[#1D4ED8]"></span>
                    )}
                  </div>
                  <div>
                    <div className="text-xs font-bold text-[#181615] dark:text-[#F4EFE6] leading-snug">
                      {cat.name}
                    </div>
                    <div className="text-[10px] text-[#665F57] dark:text-[#BBB3A7] line-clamp-1 mt-0.5">
                      {cat.shortDesc}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Step 2: Proposal Details */}
        <div className="bg-[#FAF7F0] dark:bg-[#1E2125] rounded-3xl border-2 border-[#181615] dark:border-[#737B85] p-6 sm:p-8 shadow-[4px_4px_0px_#181615] space-y-4">
          <span className="font-mono text-[10px] font-bold text-[#1D4ED8] dark:text-[#93B5FF] uppercase">
            [ STEP 02 ]
          </span>
          <h2 className="font-editorial text-lg font-bold text-[#181615] dark:text-[#F4EFE6]">
            Describe Your Idea
          </h2>

          <div>
            <label className="block text-xs font-mono font-bold text-[#181615] dark:text-[#F4EFE6] mb-1">
              PROPOSAL HEADLINE <span className="text-[#EB4A26] dark:text-[#FF8B6D]">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                if (errors.title) setErrors((prev) => ({ ...prev, title: '' }));
              }}
              placeholder="e.g. Add protected bi-directional bike lanes along Elm Street corridor"
              className={`w-full px-3.5 py-2.5 text-sm rounded-xl border-2 bg-white dark:bg-[#22262B] text-[#181615] dark:text-[#F4EFE6] placeholder-[#857E75] focus:outline-none ${
                errors.title ? 'border-[#EB4A26]' : 'border-[#181615] dark:border-[#737B85]'
              }`}
            />
            {errors.title && (
              <p className="text-xs text-[#EB4A26] dark:text-[#FF8B6D] mt-1 font-mono">{errors.title}</p>
            )}
          </div>

          <div>
            <label className="block text-xs font-mono font-bold text-[#181615] dark:text-[#F4EFE6] mb-1">
              HOW THE PROJECT WORKS & WHAT IT REQUIRES <span className="text-[#EB4A26] dark:text-[#FF8B6D]">*</span>
            </label>
            <textarea
              rows={4}
              value={description}
              onChange={(e) => {
                setDescription(e.target.value);
                if (errors.description) setErrors((prev) => ({ ...prev, description: '' }));
              }}
              placeholder="Explain how this benefits the neighborhood, where fixtures go, and who uses it..."
              className={`w-full px-3.5 py-2.5 text-sm rounded-xl border-2 bg-white dark:bg-[#22262B] text-[#181615] dark:text-[#F4EFE6] placeholder-[#857E75] focus:outline-none ${
                errors.description ? 'border-[#EB4A26]' : 'border-[#181615] dark:border-[#737B85]'
              }`}
            />
            {errors.description && (
              <p className="text-xs text-[#EB4A26] dark:text-[#FF8B6D] mt-1 font-mono">{errors.description}</p>
            )}
          </div>

          <div>
            <label className="block text-xs font-mono font-bold text-[#181615] dark:text-[#F4EFE6] mb-1">
              NEIGHBORHOOD & ENVIRONMENTAL BENEFIT
            </label>
            <textarea
              rows={2}
              value={communityBenefits}
              onChange={(e) => setCommunityBenefits(e.target.value)}
              placeholder="e.g. Lowers car trips by 25%, safe route for two elementary schools..."
              className="w-full px-3.5 py-2 text-sm rounded-xl border-2 border-[#181615] dark:border-[#737B85] bg-white dark:bg-[#22262B] focus:outline-none"
            />
          </div>
        </div>

        {/* Step 3: Location */}
        <div className="bg-[#FAF7F0] dark:bg-[#1E2125] rounded-3xl border-2 border-[#181615] dark:border-[#737B85] p-6 sm:p-8 shadow-[4px_4px_0px_#181615] space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <span className="font-mono text-[10px] font-bold text-[#1D4ED8] dark:text-[#93B5FF] uppercase">
                [ STEP 03 ]
              </span>
              <h2 className="font-editorial text-lg font-bold text-[#181615] dark:text-[#F4EFE6]">
                Target Location or Corridor
              </h2>
            </div>

            <button
              type="button"
              onClick={handleUseMyLocation}
              disabled={isLocating}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-mono font-bold bg-white dark:bg-[#22262B] text-[#181615] dark:text-[#F4EFE6] border-2 border-[#181615] dark:border-[#737B85] hover:bg-[#F4EFE6] transition-colors self-start sm:self-auto shadow-xs"
            >
              <Crosshair className={`w-3.5 h-3.5 text-[#1D4ED8] dark:text-[#93B5FF] ${isLocating ? 'animate-spin' : ''}`} />
              <span>{isLocating ? 'Locating...' : 'Use my GPS'}</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-mono font-bold text-[#181615] dark:text-[#F4EFE6] mb-1">
                CITY / AREA <span className="text-[#EB4A26] dark:text-[#FF8B6D]">*</span>
              </label>
              <select
                value={selectedDistrictId}
                onChange={(e) => handleDistrictChange(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-xl border-2 border-[#181615] dark:border-[#737B85] bg-white dark:bg-[#22262B] text-[#181615] dark:text-[#F4EFE6] focus:outline-none"
              >
                {CITY_DISTRICTS.map((dist) => (
                  <option key={dist.id} value={dist.id}>
                    {dist.name} ({dist.ward})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-mono font-bold text-[#181615] dark:text-[#F4EFE6] mb-1">
                STREET OR PARKWAY <span className="text-[#EB4A26] dark:text-[#FF8B6D]">*</span>
              </label>
              <input
                type="text"
                value={address}
                onChange={(e) => {
                  setAddress(e.target.value);
                  if (errors.address) setErrors((prev) => ({ ...prev, address: '' }));
                }}
                className={`w-full px-3.5 py-2 text-sm rounded-xl border-2 bg-white dark:bg-[#22262B] text-[#181615] dark:text-[#F4EFE6] focus:outline-none ${
                  errors.address ? 'border-[#EB4A26]' : 'border-[#181615] dark:border-[#737B85]'
                }`}
              />
              {errors.address && (
                <p className="text-xs text-[#EB4A26] dark:text-[#FF8B6D] mt-1 font-mono">{errors.address}</p>
              )}
            </div>
          </div>

          <div>
<LocationSearch onSelect={(newLat,newLng,label)=>{setLat(newLat);setLng(newLng);setAddress(label);}} />
            <MapPreviewPlaceholder
              lat={lat}
              lng={lng}
              areaName={currentDistrict.name}
              address={address}
              onLocationChange={(newLat, newLng) => {
                setLat(newLat);
                setLng(newLng);
              }}
              interactive={true}
            />
          </div>
        </div>

        {/* Submit */}
        {assessment && <div role="status" className="desk-record"><span className="ai-priority ai-low">AI relevance: civic suggestion</span><p className="mt-3">{assessment.reason}</p><p className="text-xs mt-2">Review the relevance check, then confirm submission.</p></div>}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t-2 border-[#181615] dark:border-[#737B85]">
          <div className="text-xs font-mono text-[#665F57] dark:text-[#BBB3A7]">
            [ DEMO NOTICE: PROPOSAL COMMITTED TO LOCAL NOTICEBOARD REPOSITORY ]
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-[#1D4ED8] hover:bg-[#1E40AF] text-white font-bold text-xs uppercase tracking-wider border-2 border-[#181615] dark:border-[#737B85] shadow-[4px_4px_0px_#181615] hover:shadow-[2px_2px_0px_#181615] hover:translate-x-[2px] hover:translate-y-[2px] transition-all disabled:opacity-50"
          >
            {isSubmitting ? (assessment ? 'Submitting…' : 'Checking suggestion…') : assessment ? 'Confirm & submit suggestion' : 'Check suggestion relevance'}
          </button>
        </div>
      </form>
    </div>
  );
};




