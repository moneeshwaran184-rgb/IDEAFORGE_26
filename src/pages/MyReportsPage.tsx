import React,{useEffect,useState} from 'react';
import {supabase} from '../services/auth';
import {ArrowUpRight,FileText,MapPin} from 'lucide-react';
type Item={id:string;title:string;type:string;status:string;reference_number:string;created_at:string;assigned_department:string|null;resolution_summary:string|null;location:{address:string;area:string};attached:boolean};
export function MyReportsPage({userId,onTrack}:{userId:string;onTrack:(reference:string)=>void}){
 const [items,setItems]=useState<Item[]>([]),[loading,setLoading]=useState(true),[error,setError]=useState(''),[filter,setFilter]=useState('all'),[attempt,setAttempt]=useState(0);
 useEffect(()=>{let alive=true;setLoading(true);setError('');
 Promise.all([
  supabase.from('reports').select('id,title,type,status,reference_number,created_at,assigned_department,resolution_summary,location,citizen_id').eq('citizen_id',userId).order('created_at',{ascending:false}),
  supabase.from('report_reporters').select('report_id').eq('user_id',userId).eq('relationship','attached'),
 ]).then(async ([ownResult,linkResult])=>{
  if(!alive)return;
  if(ownResult.error||linkResult.error){setError('Unable to load your reports. Please check the database setup and retry.');setLoading(false);return;}
  const linkedIds=(linkResult.data||[]).map(row=>row.report_id);
  const linkedResult=linkedIds.length?await supabase.from('reports').select('id,title,type,status,reference_number,created_at,assigned_department,resolution_summary,location,citizen_id').in('id',linkedIds):{data:[],error:null};
  if(!alive)return;
  if(linkedResult.error){setError('Unable to load reports you joined. Please retry.');setLoading(false);return;}
  const own=(ownResult.data||[]).map(row=>({...row,attached:false}));
  const linked=(linkedResult.data||[]).map(row=>({...row,attached:true}));
  setItems([...own,...linked].sort((a,b)=>new Date(b.created_at).getTime()-new Date(a.created_at).getTime()));setLoading(false);
 }).catch(()=>{if(alive){setError('Unable to load your reports. Please check your connection and retry.');setLoading(false);}});
 return()=>{alive=false;};},[userId,attempt]);
 const visible=items.filter(r=>filter==='all'||r.type===filter);
 return <section className="desk-page"><div className="desk-eyebrow">CITIZEN DESK / YOUR SUBMISSIONS</div><div className="desk-heading"><div><h1>My reports<span>.</span></h1><p>Your complaints and ideas, from submission to resolution.</p></div><button className="desk-secondary" onClick={()=>setAttempt(n=>n+1)}>Refresh</button></div>
 <div className="desk-stats">{[['Submitted',items.length],['In progress',items.filter(r=>r.status!=='resolved').length],['Completed',items.filter(r=>r.status==='resolved').length]].map(([label,n])=><div key={label}><span>{label}</span><strong>{n}</strong></div>)}</div>
 <div className="desk-filter" aria-label="Filter submissions">{[['all','All submissions'],['complaint','Complaints'],['suggestion','Suggestions']].map(([id,label])=><button key={id} aria-pressed={filter===id} className={filter===id?'active':''} onClick={()=>setFilter(id)}>{label}</button>)}</div>
 {loading?<p role="status" className="desk-empty">Loading your submissions and attached reports…</p>:error?<div role="alert" className="desk-empty">{error}<button onClick={()=>setAttempt(n=>n+1)}>Retry</button></div>:!visible.length?<div className="desk-empty"><FileText size={32}/><h2>No submissions yet</h2><p>Your submitted complaints and suggestions will appear here.</p></div>:<div className="desk-records">{visible.map(r=><article className="desk-record" key={r.id}><div className="desk-record-top"><span className="desk-eyebrow">{r.attached?'Joined issue':'Submitted by you'} · {r.type} · {new Date(r.created_at).toLocaleDateString()}</span><span className={'desk-status '+(r.status==='resolved'?'complete':'')}>{r.status.replaceAll('_',' ')}</span></div><h2>{r.title}</h2><p className="desk-location"><MapPin size={15}/>{r.location.address}, {r.location.area}</p><p className="desk-reference">{r.reference_number}</p><div className="desk-record-bottom"><span>{r.assigned_department||'Awaiting assignment'}</span><button onClick={()=>onTrack(r.reference_number)} className="desk-secondary">View progress <ArrowUpRight size={16}/></button></div>{r.resolution_summary&&<p className="desk-resolution">{r.resolution_summary}</p>}</article>)}</div>}
 </section>;
}
