import {supabase} from './auth';
export interface Assessment {assessmentId:string;priority:string;reason:string;fingerprint:string}
export const fingerprint=(type:string,p:{category:string;title:string;description:string})=>JSON.stringify([type,p.category,p.title.trim(),p.description.trim()]);
export async function assessDraft(type:string,p:{category:string;title:string;description:string}):Promise<Assessment>{
 const {data,error}=await supabase.functions.invoke('assess-draft',{body:{type,category:p.category,title:p.title,description:p.description}});
 if(error){let message='AI assessment unavailable. Check the assess-draft deployment and retry.';try{const body=await error.context?.json();if(body?.error)message=body.error;}catch{}throw new Error(message);}
 if(!data?.assessmentId||!['low','medium','high','critical'].includes(data.priority))throw new Error('AI returned an invalid assessment. Please retry.');
 return {...data,fingerprint:fingerprint(type,p)};
}
