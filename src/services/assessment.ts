import {supabase} from './auth';
export interface Assessment {assessmentId:string;priority:string;reason:string;fingerprint:string}
type AssessmentDraft={category:string;title:string;description:string;area?:string;address?:string;lat?:number;lng?:number};
export const fingerprint=(type:string,p:AssessmentDraft)=>JSON.stringify([type,p.category,p.title.trim(),p.description.trim(),p.area||'',p.address||'',p.lat??null,p.lng??null]);
async function validateComplaintLocation(p:AssessmentDraft){
 const {data,error}=await supabase.functions.invoke('validate-complaint-location',{body:{category:p.category,title:p.title,description:p.description,area:p.area,address:p.address,lat:p.lat,lng:p.lng}});
 if(error){let message='Could not verify this complaint location. Please retry.';try{const body=await error.context?.json();if(body?.error)message=body.error;}catch{}throw new Error(message);}
 if(data?.valid!==true)throw new Error(data?.error||'The selected place does not match this complaint. Choose a relevant location and try again.');
}
export async function assessDraft(type:string,p:AssessmentDraft):Promise<Assessment>{
 if(type==='complaint')await validateComplaintLocation(p);
 const {data,error}=await supabase.functions.invoke('assess-draft',{body:{type,category:p.category,title:p.title,description:p.description}});
 if(error){let message='AI assessment unavailable. Check the assess-draft deployment and retry.';try{const body=await error.context?.json();if(body?.error)message=body.error;}catch{}throw new Error(message);}
 if(!data?.assessmentId||!['low','medium','high','critical'].includes(data.priority))throw new Error('AI returned an invalid assessment. Please retry.');
 return {...data,fingerprint:fingerprint(type,p)};
}
