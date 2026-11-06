import React,{useEffect,useState} from 'react';
import {supabase} from '../services/auth';
type Item={id:string;title:string;type:string;status:string;reference_number:string;created_at:string;assigned_department:string|null;department_id:string|null;location:{address:string;area:string}};
export function CityReportsPage({onTrack}:{onTrack:(reference:string)=>void}){
 const [items,setItems]=useState<Item[]>([]),[departments,setDepartments]=useState<{id:string;name:string}[]>([]);
 const [department,setDepartment]=useState(''),[status,setStatus]=useState(''),[type,setType]=useState(''),[from,setFrom]=useState(''),[to,setTo]=useState(''),[sort,setSort]=useState('newest'),[page,setPage]=useState(0),[total,setTotal]=useState(0),[loading,setLoading]=useState(true),[error,setError]=useState(''),[attempt,setAttempt]=useState(0);
 useEffect(()=>{supabase.from('departments').select('id,name').order('name').then(({data,error})=>{if(!error)setDepartments(data||[]);});},[]);
 useEffect(()=>{
  let alive=true;setLoading(true);setError('');
  if(from&&to&&from>to){setError('The end date must be on or after the start date.');setLoading(false);return;}
  let query=supabase.from('reports').select('id,title,type,status,reference_number,created_at,assigned_department,department_id,location',{count:'exact'});
  if(department)query=query.eq('department_id',department);
  if(type)query=query.eq('type',type);
  if(status==='completed')query=query.eq('status','resolved');
  if(status==='open')query=query.neq('status','resolved');
  if(from)query=query.gte('created_at',new Date(from+'T00:00:00').toISOString());
  if(to){const end=new Date(to+'T00:00:00');end.setDate(end.getDate()+1);query=query.lt('created_at',end.toISOString());}
  query.order('created_at',{ascending:sort==='oldest'}).order('id').range(page*20,page*20+19).then(({data,error,count})=>{
   if(!alive)return;
   if(error){setError('Unable to load city reports. Please try again.');setItems([]);}else{setItems(data||[]);setTotal(count||0);}setLoading(false);
  });return()=>{alive=false;};
 },[department,status,type,from,to,sort,page,attempt]);
 function filter(set:(v:string)=>void,value:string){set(value);setPage(0);}
 return <section className="desk-page">
 <div className="desk-eyebrow">COMMUNITY NOTICEBOARD / TAMIL NADU</div><div className="desk-heading"><div><h1>City reports<span>.</span></h1><p>Explore public complaints and suggestions from citizens across Tamil Nadu.</p></div><button className="desk-secondary" onClick={()=>setAttempt(n=>n+1)}>Refresh</button></div>
 <div className="city-filters">
 <label>Department<select value={department} onChange={e=>filter(setDepartment,e.target.value)}><option value="">All departments</option>{departments.map(d=><option key={d.id} value={d.id}>{d.name}</option>)}</select></label>
 <label>Status<select value={status} onChange={e=>filter(setStatus,e.target.value)}><option value="">All statuses</option><option value="open">Not completed</option><option value="completed">Completed</option></select></label>
 <label>Type<select value={type} onChange={e=>filter(setType,e.target.value)}><option value="">Reports & suggestions</option><option value="complaint">Complaints</option><option value="suggestion">Suggestions</option></select></label>
 <label>Submitted from<input type="date" value={from} onChange={e=>filter(setFrom,e.target.value)}/></label>
 <label>Submitted through<input type="date" value={to} onChange={e=>filter(setTo,e.target.value)}/></label>
 <label>Sort by<select value={sort} onChange={e=>filter(setSort,e.target.value)}><option value="newest">Newest first</option><option value="oldest">Oldest first</option></select></label>
 </div><div className="desk-section-label"><span>{loading?'LOADING…':total+' MATCHING SUBMISSIONS'}</span><button onClick={()=>{setDepartment('');setStatus('');setType('');setFrom('');setTo('');setSort('newest');setPage(0);}}>Clear filters</button></div>
 {loading?<p role="status" className="desk-empty">Loading city reports…</p>:error?<div className="desk-empty" role="alert">{error}<button onClick={()=>setAttempt(n=>n+1)}>Retry</button></div>:!items.length?<div className="desk-empty"><h2>No matching reports</h2><p>Try a different department, status, or date range.</p></div>:items.map(r=><article className="desk-record" key={r.id}>
 <div className="desk-record-top"><span className="desk-eyebrow">{r.type} · {new Date(r.created_at).toLocaleString()}</span><span className={'desk-status '+(r.status==='resolved'?'complete':'')}>{r.status==='resolved'?'Completed':r.status.replaceAll('_',' ')}</span></div><h2>{r.title}</h2><p className="desk-location">{r.location.address}, {r.location.area}</p><p className="desk-reference">{r.reference_number}</p><div className="desk-record-bottom"><span>{r.assigned_department||'Awaiting assignment'}</span><button className="desk-secondary" onClick={()=>onTrack(r.reference_number)}>View progress ↗</button></div></article>)}
 {!loading&&!error&&total>20&&<div className="flex justify-between items-center gap-3"><button className="desk-secondary disabled:opacity-40" disabled={page===0} onClick={()=>setPage(p=>p-1)}>Previous</button><span>Page {page+1} of {Math.ceil(total/20)}</span><button className="desk-secondary disabled:opacity-40" disabled={(page+1)*20>=total} onClick={()=>setPage(p=>p+1)}>Next</button></div>}
 </section>;
}
