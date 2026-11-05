import { assessDraft, fingerprint, Assessment } from '../services/assessment';
import { attachToExistingReport, duplicateFingerprint, DuplicateCandidate, DuplicateDraft, findDuplicateReports, findMyDuplicateComplaint, OwnDuplicate } from '../services/duplicates';
import { LocationSearch } from '../components/LocationSearch';
import React, { useState, useEffect } from 'react';
import {
  AlertTriangle,
  MapPin,
  Camera,
  X,
  CheckCircle2,
  ArrowRight,
  Copy,
  Check,
  Crosshair,
  User,
  EyeOff,
  Lock,
  FileText,
} from 'lucide-react';
import { COMPLAINT_CATEGORIES, CITY_DISTRICTS } from '../data/categories';
import { CategoryIcon } from '../components/CategoryIcon';
import { MapPreviewPlaceholder } from '../components/MapPreviewPlaceholder';
import { CivicService, ComplaintCreateInput } from '../services/civicService';
import { CivicReport } from '../types';

interface ComplaintFormPageProps {
  initialCategoryId?: string;
  onNavigateToTrack: (refNumber: string) => void;
  onReportCreated: (newReport: CivicReport) => void;
}

export const ComplaintFormPage: React.FC<ComplaintFormPageProps> = ({
  initialCategoryId,
  onNavigateToTrack,
  onReportCreated,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>(
    initialCategoryId || ''
  );
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');

  // Location state
  const [selectedDistrictId, setSelectedDistrictId] = useState<string>(CITY_DISTRICTS[0].id);
  const [address, setAddress] = useState('Chennai');
  const [landmark, setLandmark] = useState('');
  const [lat, setLat] = useState<number>(CITY_DISTRICTS[0].defaultLat);
  const [lng, setLng] = useState<number>(CITY_DISTRICTS[0].defaultLng);
  const [isLocating, setIsLocating] = useState(false);
  const [geoNotice, setGeoNotice] = useState<string | null>(null);

  // Photo upload
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [photoName, setPhotoName] = useState<string | null>(null);

  // Privacy & contact
  const [contactPreference, setContactPreference] = useState<'public' | 'private' | 'anonymous'>('public');
  const [contactName, setContactName] = useState('Alex Morgan');
  const [contactEmail, setContactEmail] = useState('alex.morgan@neighborhood.test');
  const [contactPhone, setContactPhone] = useState('555-0192');

  // Validation & status
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [assessment,setAssessment] = useState<Assessment|null>(null);
  const [duplicateCandidates, setDuplicateCandidates] = useState<DuplicateCandidate[] | null>(null);
  const [duplicateCheckedKey, setDuplicateCheckedKey] = useState('');
  const [myDuplicate, setMyDuplicate] = useState<OwnDuplicate|null>(null);
  const [myDuplicateCheckedKey, setMyDuplicateCheckedKey] = useState('');
  const [duplicateCheckError, setDuplicateCheckError] = useState('');
  const [attachedReport, setAttachedReport] = useState<DuplicateCandidate | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedReport, setSubmittedReport] = useState<CivicReport | null>(null);
  const [copiedRef, setCopiedRef] = useState(false);

  useEffect(() => {
    if (initialCategoryId) {
      setSelectedCategory(initialCategoryId);
    }
  }, [initialCategoryId]);

  const currentDistrict = CITY_DISTRICTS.find((d) => d.id === selectedDistrictId) || CITY_DISTRICTS[0];

  const makePayload = (): ComplaintCreateInput => ({
    category: selectedCategory,
    title,
    description,
    area: currentDistrict.name,
    address,
    lat,
    lng,
    landmark,
    contactPreference,
    contactName: contactPreference === 'anonymous' ? undefined : contactName,
    contactEmail: contactPreference === 'anonymous' ? undefined : contactEmail,
    contactPhone: contactPreference === 'anonymous' ? undefined : contactPhone,
    photoUrl: photoPreview || undefined,
    photoName: photoName || undefined,
  });

  const handleDistrictChange = (distId: string) => {
    setSelectedDistrictId(distId);
    const dist = CITY_DISTRICTS.find((d) => d.id === distId);
    if (dist) {
      setLat(dist.defaultLat);
      setLng(dist.defaultLng);
      setAddress(`${dist.landmarks[0] || 'Main Corridor'}`);
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
        
        
        
        setGeoNotice('Unable to get GPS location. Select the problem location on the map.');
      },
      { timeout: 7000 }
    );
  };

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 8 * 1024 * 1024) {
        setErrors((prev) => ({ ...prev, photo: 'File size exceeds 8MB limit' }));
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        setPhotoPreview(reader.result as string);
        setPhotoName(file.name);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemovePhoto = () => {
    setPhotoPreview(null);
    setPhotoName(null);
  };

  const validate = (): boolean => {
    const errs: Record<string, string> = {}; if (!selectedCategory) errs.form = 'Please select a category.';
    if (!title.trim()) {
      errs.title = 'Please provide a short summary of the street issue.';
    }

    if (!description.trim()) {
      errs.description = 'Please describe the issue, dimensions, or safety impact.';
    }

    if (!address.trim()) {
      errs.address = 'Please specify a street name, intersection, or landmark.';
    }

    if (contactPreference !== 'anonymous' && contactEmail && !contactEmail.includes('@')) {
      errs.contactEmail = 'Please provide a valid email address.';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  useEffect(()=>{setAssessment(null);setDuplicateCandidates(null);setDuplicateCheckedKey('');setDuplicateCheckError('');setMyDuplicate(null);setMyDuplicateCheckedKey('');}, [title,description,selectedCategory,address,lat,lng]);
  const makeDuplicateDraft = (): DuplicateDraft => ({ category: selectedCategory, title, description, lat, lng });

  const submitSeparateIssue = async (payload: ComplaintCreateInput, recheck = false) => {
    setIsSubmitting(true);
    setErrors((prev) => ({ ...prev, form: '' }));
    try {
      if (!assessment || !validate()) return;
      if (recheck) {
        const draft = makeDuplicateDraft();
        const result = await findDuplicateReports(draft, true);
        const match = result.candidates.find(candidate => candidate.confidence >= 0.90);
        if (match) {
          await attachToExistingReport(match.reportId, draft, assessment.assessmentId);
          setAttachedReport(match);
          return;
        }
      }
      payload.assessmentId = assessment.assessmentId;
      const created = await CivicService.createComplaint(payload);
      setSubmittedReport(created);
      setDuplicateCandidates(null);
      onReportCreated(created);
    } catch (err) {
      console.error(err);
      setErrors((prev) => ({ ...prev, form: err instanceof Error ? err.message : 'Unable to submit. Please try again.' }));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAttachToIssue = async (candidate: DuplicateCandidate) => {
    setIsSubmitting(true);
    setDuplicateCheckError('');
    try {
      if (!assessment) return;
      await attachToExistingReport(candidate.reportId, makeDuplicateDraft(), assessment.assessmentId);
      setAttachedReport(candidate);
    } catch (err) {
      setErrors((prev) => ({ ...prev, form: err instanceof Error ? err.message : 'Unable to attach to the existing issue.' }));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    try {
      const payload = makePayload();

      if (!assessment || assessment.fingerprint !== fingerprint('complaint',payload)) { setAssessment(await assessDraft('complaint',payload)); return; }

      const duplicateDraft = makeDuplicateDraft();
      const duplicateKey = duplicateFingerprint(duplicateDraft);
      if (myDuplicateCheckedKey !== duplicateKey) {
        const previous = await findMyDuplicateComplaint(duplicateDraft, assessment.assessmentId);
        setMyDuplicate(previous);
        setMyDuplicateCheckedKey(duplicateKey);
        if (previous) return;
      } else if (myDuplicate) {
        return;
      }
      if (duplicateCheckedKey !== duplicateKey) {
        setDuplicateCheckError('');
        try {
          const result = await findDuplicateReports(duplicateDraft);
          setDuplicateCandidates(result.candidates);
          setDuplicateCheckedKey(duplicateKey);
          if (result.candidates.length) return;
        } catch (err) {
          setDuplicateCheckError(err instanceof Error ? err.message : 'Duplicate check is unavailable.');
          return;
        }
      } else if (duplicateCandidates?.length) {
        return;
      }

      await submitSeparateIssue(payload);
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

  // Success Confirmation Screen (Styled as an Official Printed Ticket)
  if (submittedReport) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-12">
        <div className="bg-[#FAF7F0] dark:bg-[#1E2125] rounded-3xl border-2 border-[#181615] dark:border-[#737B85] p-8 sm:p-10 shadow-[6px_6px_0px_#181615] text-center">
          <div className="w-14 h-14 rounded-2xl bg-[#E3EED3] dark:bg-[#253321] text-[#3F6212] border-2 border-[#181615] dark:border-[#737B85] flex items-center justify-center mx-auto mb-5 shadow-[2px_2px_0px_#181615]">
            <Check className="w-7 h-7 stroke-[3]" />
          </div>

          <div className="inline-block px-2.5 py-0.5 bg-[#FAF7F0] dark:bg-[#1E2125] border border-[#181615] dark:border-[#737B85] text-[#181615] dark:text-[#F4EFE6] rounded-md text-[10px] font-mono font-bold uppercase mb-3">
            [ TICKET REGISTERED · CITY SERVICES ]
          </div>

          <h2 className="font-editorial text-2xl sm:text-3xl font-extrabold text-[#181615] dark:text-[#F4EFE6]">
            Problem Ticket Logged
          </h2>

          <p className="text-xs sm:text-sm text-[#4A453F] dark:text-[#CCC5BA] max-w-md mx-auto mt-2 mb-6">
            Your complaint has been sent to the responsible department. Track progress through review, work, and completion.
          </p>

          {/* Printed Ticket Card */}
          <div className="bg-white dark:bg-[#22262B] border-2 border-dashed border-[#181615] dark:border-[#737B85] rounded-2xl p-5 max-w-md mx-auto mb-8 text-left space-y-3">
            <div className="flex items-center justify-between border-b border-[#E8E1D5] dark:border-[#39414B] pb-2">
              <span className="font-mono text-[10px] font-bold text-[#EB4A26] dark:text-[#FF8B6D] uppercase">
                REFERENCE TICKET
              </span>
              <span className="font-mono text-[10px] text-[#857E75] dark:text-[#AAA295]">
                STATUS: RECEIVED
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
                {copiedRef ? <Check className="w-3.5 h-3.5 text-[#3F6212]" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedRef ? 'Copied' : 'Copy'}</span>
              </button>
            </div>

            <div className="pt-2 border-t border-[#E8E1D5] dark:border-[#39414B] text-xs space-y-1 text-[#4A453F] dark:text-[#CCC5BA]">
              <div><strong>Item:</strong> {submittedReport.title}</div>
              <div><strong>Location:</strong> {submittedReport.location.address}, {submittedReport.location.area}</div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => onNavigateToTrack(submittedReport.referenceNumber)}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-[#EB4A26] hover:bg-[#D73A17] text-white font-bold text-xs uppercase tracking-wider border-2 border-[#181615] dark:border-[#737B85] shadow-[3px_3px_0px_#181615]"
            >
              <span>Track Ticket Progress</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>

            <button
              type="button"
              onClick={() => {
                setSubmittedReport(null);
                setTitle('');
                setDescription('');
                setPhotoPreview(null);
                setPhotoName(null);
              }}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-white dark:bg-[#22262B] hover:bg-[#F4EFE6] text-[#181615] dark:text-[#F4EFE6] font-bold text-xs uppercase tracking-wider border-2 border-[#181615] dark:border-[#737B85]"
            >
              <span>File Another Notice</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (attachedReport) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-12">
        <div className="bg-[#FAF7F0] dark:bg-[#1E2125] rounded-3xl border-2 border-[#181615] dark:border-[#737B85] p-8 sm:p-10 shadow-[6px_6px_0px_#181615] text-center">
          <div className="w-14 h-14 rounded-2xl bg-[#E3EED3] text-[#3F6212] border-2 border-[#181615] flex items-center justify-center mx-auto mb-5"><Check className="w-7 h-7 stroke-[3]" /></div>
          <span className="inline-block px-3 py-1 rounded-md border text-xs font-bold uppercase mb-3">Added to an existing city issue</span>
          <h2 className="font-editorial text-2xl sm:text-3xl font-extrabold">Your report is attached</h2>
          <p className="text-sm mt-3">The department will keep one work item for this issue. You’ll see its updates in My reports.</p>
          <div className="my-6 p-5 bg-white dark:bg-[#22262B] rounded-2xl border-2 border-dashed text-left">
            <p className="font-mono text-xs font-bold">{attachedReport.referenceNumber}</p>
            <h3 className="font-bold mt-2">{attachedReport.title}</h3>
            <p className="text-sm mt-2">{attachedReport.summary}</p>
          </div>
          <button type="button" onClick={() => onNavigateToTrack(attachedReport.referenceNumber)} className="px-6 py-3 rounded-xl bg-[#EB4A26] text-white font-bold">Track this issue</button>
        </div>
      </div>
    );
  }

  if (myDuplicate && myDuplicateCheckedKey === duplicateFingerprint(makeDuplicateDraft())) {
    return <div className="max-w-2xl mx-auto px-4 py-12"><section className="desk-record space-y-4" role="status"><span className="desk-eyebrow">POSSIBLE REPEAT · CHECKED AGAINST YOUR REPORTS</span><h1 className="font-editorial text-2xl font-bold">You may have already reported this problem</h1><p>{myDuplicate.reason}</p><div className="rounded-xl border p-4"><p className="font-mono text-xs font-bold">{myDuplicate.referenceNumber} · {myDuplicate.status.replaceAll('_',' ')}</p><h2 className="font-bold mt-2">{myDuplicate.title}</h2><p className="text-sm mt-2">{myDuplicate.address}, {myDuplicate.area} · {myDuplicate.distanceMeters} m away</p></div><p className="text-sm">We did not submit another complaint. You can track your existing report below.</p><button type="button" onClick={()=>onNavigateToTrack(myDuplicate.referenceNumber)} className="desk-primary">Track existing report</button></section></div>;
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
      {/* Editorial Page Header */}
      <div className="mb-8 border-b-2 border-[#181615] dark:border-[#737B85] pb-5">
        <div className="flex items-center gap-2 font-mono text-xs font-bold text-[#EB4A26] dark:text-[#FF8B6D] uppercase tracking-wider mb-1">
          <span>● MUNICIPAL INTAKE DESK</span>
          <span>·</span>
          <span className="text-[#857E75] dark:text-[#AAA295]">FORM 01-C</span>
        </div>
        <h1 className="font-editorial text-3xl sm:text-4xl font-extrabold text-[#181615] dark:text-[#F4EFE6] tracking-tight">
          Register a City Complaint
        </h1>
        <p className="text-xs sm:text-sm text-[#4A453F] dark:text-[#CCC5BA] mt-1">
          Report road craters, broken streetlights, water ponding, or accessibility hazards for neighborhood review.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Step 1: Category Picker */}
        <div className="bg-[#FAF7F0] dark:bg-[#1E2125] rounded-3xl border-2 border-[#181615] dark:border-[#737B85] p-6 sm:p-8 shadow-[4px_4px_0px_#181615]">
          <div className="flex items-center justify-between mb-4">
            <div>
              <span className="font-mono text-[10px] font-bold text-[#EB4A26] dark:text-[#FF8B6D] uppercase">
                [ STEP 01 ]
              </span>
              <h2 className="font-editorial text-lg font-bold text-[#181615] dark:text-[#F4EFE6]">
                Select Problem Category <span className="text-[#EB4A26] dark:text-[#FF8B6D]">*</span>
              </h2>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
            {COMPLAINT_CATEGORIES.map((cat) => {
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
                      <span className="w-2.5 h-2.5 rounded-full bg-[#EB4A26]"></span>
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

        {/* Step 2: Description */}
        <div className="bg-[#FAF7F0] dark:bg-[#1E2125] rounded-3xl border-2 border-[#181615] dark:border-[#737B85] p-6 sm:p-8 shadow-[4px_4px_0px_#181615] space-y-4">
          <div>
            <span className="font-mono text-[10px] font-bold text-[#EB4A26] dark:text-[#FF8B6D] uppercase">
              [ STEP 02 ]
            </span>
            <h2 className="font-editorial text-lg font-bold text-[#181615] dark:text-[#F4EFE6]">
              Describe the Problem
            </h2>
          </div>

          <div>
            <label className="block text-xs font-mono font-bold text-[#181615] dark:text-[#F4EFE6] mb-1">
              ISSUE SUMMARY TITLE <span className="text-[#EB4A26] dark:text-[#FF8B6D]">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                if (errors.title) setErrors((prev) => ({ ...prev, title: '' }));
              }}
              placeholder="e.g. Broken streetlight causing dark pedestrian crosswalk on 4th Ave"
              className={`w-full px-3.5 py-2.5 text-sm rounded-xl border-2 bg-white dark:bg-[#22262B] text-[#181615] dark:text-[#F4EFE6] placeholder-[#857E75] focus:outline-none ${
                errors.title ? 'border-[#EB4A26]' : 'border-[#181615] dark:border-[#737B85]'
              }`}
            />
            {errors.title && (
              <p className="text-xs text-[#EB4A26] dark:text-[#FF8B6D] mt-1 font-mono font-bold">{errors.title}</p>
            )}
          </div>

          <div>
            <label className="block text-xs font-mono font-bold text-[#181615] dark:text-[#F4EFE6] mb-1">
              OBSERVATION & SAFETY CONCERNS <span className="text-[#EB4A26] dark:text-[#FF8B6D]">*</span>
            </label>
            <textarea
              rows={4}
              value={description}
              onChange={(e) => {
                setDescription(e.target.value);
                if (errors.description) setErrors((prev) => ({ ...prev, description: '' }));
              }}
              placeholder="Provide exact details: size, depth, how many days it has been broken, pedestrian risk..."
              className={`w-full px-3.5 py-2.5 text-sm rounded-xl border-2 bg-white dark:bg-[#22262B] text-[#181615] dark:text-[#F4EFE6] placeholder-[#857E75] focus:outline-none ${
                errors.description ? 'border-[#EB4A26]' : 'border-[#181615] dark:border-[#737B85]'
              }`}
            />
            {errors.description && (
              <p className="text-xs text-[#EB4A26] dark:text-[#FF8B6D] mt-1 font-mono font-bold">{errors.description}</p>
            )}
          </div>

          <p className="text-xs text-[#665F57] dark:text-[#BBB3A7]">
            Describe the hazard and its impact clearly. Assess priority first, then confirm your submission for department review.
          </p>
        </div>
        {/* Step 3: Location & Map */}
        <div className="bg-[#FAF7F0] dark:bg-[#1E2125] rounded-3xl border-2 border-[#181615] dark:border-[#737B85] p-6 sm:p-8 shadow-[4px_4px_0px_#181615] space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <span className="font-mono text-[10px] font-bold text-[#EB4A26] dark:text-[#FF8B6D] uppercase">
                [ STEP 03 ]
              </span>
              <h2 className="font-editorial text-lg font-bold text-[#181615] dark:text-[#F4EFE6]">
                Pinpoint Street Location
              </h2>
            </div>

            <button
              type="button"
              onClick={handleUseMyLocation}
              disabled={isLocating}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-mono font-bold bg-white dark:bg-[#22262B] text-[#181615] dark:text-[#F4EFE6] border-2 border-[#181615] dark:border-[#737B85] hover:bg-[#F4EFE6] transition-colors self-start sm:self-auto shadow-xs"
            >
              <Crosshair className={`w-3.5 h-3.5 text-[#EB4A26] dark:text-[#FF8B6D] ${isLocating ? 'animate-spin' : ''}`} />
              <span>{isLocating ? 'Locating...' : 'Use my GPS'}</span>
            </button>
          </div>

          {geoNotice && (
            <div className="p-2.5 bg-white dark:bg-[#22262B] border border-[#181615] dark:border-[#737B85] rounded-xl text-xs font-mono text-[#4A453F] dark:text-[#CCC5BA] flex items-center gap-2">
              <MapPin className="w-4 h-4 text-[#EB4A26] dark:text-[#FF8B6D] shrink-0" />
              <span>{geoNotice}</span>
            </div>
          )}

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
                STREET OR CROSSING <span className="text-[#EB4A26] dark:text-[#FF8B6D]">*</span>
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

        {/* Step 4: Photo Evidence (Optional) */}
        <div className="bg-[#FAF7F0] dark:bg-[#1E2125] rounded-3xl border-2 border-[#181615] dark:border-[#737B85] p-6 sm:p-8 shadow-[4px_4px_0px_#181615] space-y-3">
          <div>
            <span className="font-mono text-[10px] font-bold text-[#EB4A26] dark:text-[#FF8B6D] uppercase">
              [ STEP 04 ]
            </span>
            <h2 className="font-editorial text-lg font-bold text-[#181615] dark:text-[#F4EFE6]">
              Photo Evidence (Optional)
            </h2>
          </div>

          {photoPreview ? (
            <div className="relative rounded-2xl overflow-hidden border-2 border-[#181615] dark:border-[#737B85] bg-white dark:bg-[#22262B] p-2 max-w-sm">
              <img src={photoPreview} alt="Evidence" className="w-full h-44 object-cover rounded-xl" />
              <div className="flex items-center justify-between pt-2 px-1 text-xs font-mono text-[#181615] dark:text-[#F4EFE6]">
                <span className="truncate max-w-[200px]">{photoName}</span>
                <button
                  type="button"
                  onClick={handleRemovePhoto}
                  className="text-[#EB4A26] dark:text-[#FF8B6D] hover:underline font-bold flex items-center gap-1"
                >
                  <X className="w-3.5 h-3.5" />
                  <span>Remove</span>
                </button>
              </div>
            </div>
          ) : (
            <label className="flex flex-col items-center justify-center border-2 border-dashed border-[#181615] dark:border-[#737B85] rounded-2xl p-6 cursor-pointer bg-white dark:bg-[#22262B] hover:bg-[#FDFBF7] transition-colors">
              <Camera className="w-7 h-7 text-[#181615] dark:text-[#F4EFE6] mb-2" />
              <span className="text-xs font-bold font-mono text-[#181615] dark:text-[#F4EFE6]">
                CLICK TO ATTACH EVIDENCE PHOTO
              </span>
              <span className="text-[10px] font-mono text-[#857E75] dark:text-[#AAA295] mt-0.5">
                PNG, JPG or WEBP up to 8MB
              </span>
              <input type="file" accept="image/*" onChange={handlePhotoSelect} className="hidden" />
            </label>
          )}
        </div>

        {/* Step 5: Privacy Preference */}
        <div className="bg-[#FAF7F0] dark:bg-[#1E2125] rounded-3xl border-2 border-[#181615] dark:border-[#737B85] p-6 sm:p-8 shadow-[4px_4px_0px_#181615] space-y-4">
          <div>
            <span className="font-mono text-[10px] font-bold text-[#EB4A26] dark:text-[#FF8B6D] uppercase">
              [ STEP 05 ]
            </span>
            <h2 className="font-editorial text-lg font-bold text-[#181615] dark:text-[#F4EFE6]">
              Contact & Privacy
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[
              { id: 'public', title: 'Public Notice', desc: 'Display name shown on community board.' },
              { id: 'private', title: 'Inspector Eyes Only', desc: 'Only triage crew sees your name.' },
              { id: 'anonymous', title: 'Strictly Anonymous', desc: 'No personal identification recorded.' },
            ].map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => setContactPreference(p.id as any)}
                className={`p-3 rounded-xl border-2 text-left transition-all ${
                  contactPreference === p.id
                    ? 'border-[#181615] dark:border-[#737B85] bg-white dark:bg-[#22262B] shadow-[2px_2px_0px_#181615]'
                    : 'border-[#D6CCBE] dark:border-[#48515C] bg-[#FDFBF7] dark:bg-[#191C20] hover:border-[#181615]'
                }`}
              >
                <div className="text-xs font-bold text-[#181615] dark:text-[#F4EFE6]">{p.title}</div>
                <div className="text-[11px] text-[#665F57] dark:text-[#BBB3A7] mt-0.5">{p.desc}</div>
              </button>
            ))}
          </div>

          {contactPreference !== 'anonymous' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
              <div>
                <label className="block text-xs font-mono font-bold text-[#181615] dark:text-[#F4EFE6] mb-1">
                  FULL NAME
                </label>
                <input
                  type="text"
                  value={contactName}
                  onChange={(e) => setContactName(e.target.value)}
                  className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border-2 border-[#181615] dark:border-[#737B85] bg-white dark:bg-[#22262B] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-mono font-bold text-[#181615] dark:text-[#F4EFE6] mb-1">
                  EMAIL FOR STATUS UPDATES
                </label>
                <input
                  type="email"
                  value={contactEmail}
                  onChange={(e) => setContactEmail(e.target.value)}
                  className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border-2 border-[#181615] dark:border-[#737B85] bg-white dark:bg-[#22262B] focus:outline-none"
                />
              </div>
            </div>
          )}
        </div>

        {/* Submit Button */}
        {assessment && <div role="status" className="desk-record"><span className={"ai-priority ai-"+assessment.priority}>AI priority: {assessment.priority}</span><p className="mt-3">{assessment.reason}</p><p className="text-xs mt-2">Review this assessment, then confirm your submission. The department makes the final decision.</p></div>}
        {duplicateCheckError && <div role="alert" className="desk-record border-amber-600"><h2 className="font-bold">Could not check for duplicate reports</h2><p className="mt-2 text-sm">{duplicateCheckError}</p><div className="flex flex-wrap gap-3 mt-3"><button type="button" className="desk-secondary" disabled={isSubmitting} onClick={()=>{setDuplicateCheckError('');setDuplicateCheckedKey('');}}>Retry duplicate check</button><button type="button" className="desk-primary" disabled={isSubmitting||!assessment} onClick={()=>void submitSeparateIssue(makePayload(), true)}>Submit as a separate issue</button></div></div>}
        {myDuplicate && myDuplicateCheckedKey === duplicateFingerprint(makeDuplicateDraft()) && <section className="desk-record border-orange-500 space-y-3" role="status"><h2 className="font-bold">You may have already submitted this problem</h2><p>{myDuplicate.referenceNumber}: {myDuplicate.title} · {myDuplicate.distanceMeters} m away</p><button type="button" className="desk-secondary" onClick={()=>onNavigateToTrack(myDuplicate.referenceNumber)}>Track existing report</button></section>}
        {duplicateCandidates && duplicateCandidates.length > 0 && duplicateCheckedKey === duplicateFingerprint(makeDuplicateDraft()) && <section aria-labelledby="duplicate-match-heading" className="desk-record border-orange-500 space-y-4">
          <div><span className="desk-eyebrow">POSSIBLE MATCHES FOUND</span><h2 id="duplicate-match-heading" className="font-editorial text-xl font-bold mt-1">Is this the same street problem?</h2><p className="text-sm mt-1">AI suggestions can be wrong. Review each case and choose whether to join it or create a separate work item.</p></div>
          {duplicateCandidates.map(candidate=><article key={candidate.reportId} className="rounded-2xl border-2 p-4 bg-white dark:bg-[#22262B] space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-2"><span className="font-mono text-xs font-bold">{candidate.referenceNumber}</span><span className="text-xs uppercase">{candidate.status.replaceAll('_',' ')} · {Math.round(candidate.confidence*100)}% likely match</span></div>
            <h3 className="font-bold">{candidate.title}</h3><p className="text-sm">{candidate.summary}</p><p className="text-xs opacity-75">{candidate.address}, {candidate.area} · {candidate.distanceMeters} m away</p><p className="text-xs"><strong>Why it matched:</strong> {candidate.reason}</p>
            <button type="button" className="desk-primary" disabled={isSubmitting} onClick={()=>void handleAttachToIssue(candidate)}>{isSubmitting?'Saving…':'Attach my report to this issue'}</button>
          </article>)}
          <div className="pt-2 border-t"><p className="text-sm">If this is a different streetlight or a different fault, request a separate issue. AI checks again before filing. A confirmed duplicate joins the existing ticket.</p><button type="button" className="desk-secondary mt-3" disabled={isSubmitting} onClick={()=>void submitSeparateIssue(makePayload(), true)}>Submit as a separate issue</button></div>
        </section>}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t-2 border-[#181615] dark:border-[#737B85]">
          <div className="text-xs font-mono text-[#665F57] dark:text-[#BBB3A7]">
            [ PRIORITY REVIEW · DUPLICATE CHECK · DEPARTMENT ROUTING ]
          </div>

          <button
            type="submit"
            disabled={isSubmitting || !!(myDuplicate && myDuplicateCheckedKey === duplicateFingerprint(makeDuplicateDraft()))}
            className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-[#EB4A26] hover:bg-[#D73A17] text-white font-bold text-xs uppercase tracking-wider border-2 border-[#181615] dark:border-[#737B85] shadow-[4px_4px_0px_#181615] hover:shadow-[2px_2px_0px_#181615] hover:translate-x-[2px] hover:translate-y-[2px] transition-all disabled:opacity-50"
          >
            {isSubmitting ? (assessment ? 'Checking and submitting…' : 'Assessing priority…') : myDuplicate && myDuplicateCheckedKey === duplicateFingerprint(makeDuplicateDraft()) ? 'Already reported' : !assessment ? 'Assess priority' : duplicateCandidates?.length ? 'Choose an option above' : duplicateCheckedKey === duplicateFingerprint(makeDuplicateDraft()) ? 'Confirm & submit report' : 'Check for duplicate reports'}
          </button>
        </div>
        {errors.form && (
          <p role="alert" className="rounded-xl border border-red-400 bg-red-50 p-4 text-sm text-red-900 dark:bg-red-950 dark:text-red-100">
            {errors.form}
          </p>
        )}
      </form>
    </div>
  );
};








