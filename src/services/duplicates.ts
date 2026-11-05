import { supabase } from './auth';

export interface DuplicateCandidate {
  reportId: string;
  referenceNumber: string;
  title: string;
  address: string;
  area: string;
  status: string;
  createdAt: string;
  confidence: number;
  summary: string;
  reason: string;
  distanceMeters: number;
}

export interface DuplicateCheck {
  checkedAt: string;
  candidates: DuplicateCandidate[];
}
export interface OwnDuplicate {reportId:string;referenceNumber:string;title:string;address:string;area:string;status:string;createdAt:string;distanceMeters:number;reason:string}

export interface DuplicateDraft {
  category: string;
  title: string;
  description: string;
  lat: number;
  lng: number;
}

export function duplicateFingerprint(draft: DuplicateDraft): string {
  return JSON.stringify([
    draft.category,
    draft.title.trim(),
    draft.description.trim(),
    Number(draft.lat.toFixed(5)),
    Number(draft.lng.toFixed(5)),
  ]);
}

export async function findDuplicateReports(draft: DuplicateDraft, finalReview = false): Promise<DuplicateCheck> {
  const { data, error } = await supabase.functions.invoke('find-duplicate-reports', {
    body: { ...draft, finalReview },
  });
  if (error) {
    let message = 'Duplicate check is unavailable. Retry or submit this as a separate issue.';
    try {
      const body = await error.context?.json();
      if (body?.error) message = body.error;
    } catch {
      // Keep the user friendly fallback.
    }
    throw new Error(message);
  }
  if (!data || !Array.isArray(data.candidates)) {
    throw new Error('The duplicate check returned an invalid response. Retry or submit separately.');
  }
  return { checkedAt: data.checkedAt, candidates: data.candidates };
}

export async function findMyDuplicateComplaint(draft:DuplicateDraft,assessmentId:string):Promise<OwnDuplicate|null>{
 const {data,error}=await supabase.functions.invoke('check-my-duplicate-complaint',{body:{...draft,assessmentId}});
 if(error){let message='Could not check your earlier complaints. Please retry.';try{const body=await error.context?.json();if(body?.error)message=body.error;}catch{}throw new Error(message);}
 if(!data||typeof data.duplicate!=='boolean')throw new Error('Your duplicate check returned an invalid response. Please retry.');
 return data.duplicate?data.report as OwnDuplicate:null;
}

export async function attachToExistingReport(reportId: string, draft: DuplicateDraft, assessmentId: string): Promise<void> {
  const { error } = await supabase.rpc('attach_assessed_complaint', {
    target_report_id: reportId,
    draft_id: assessmentId,
    expected_category: draft.category,
    submitted_lat: draft.lat,
    submitted_lng: draft.lng,
  });
  if (error) throw new Error(error.message || 'Unable to attach your report to the existing issue.');
}

