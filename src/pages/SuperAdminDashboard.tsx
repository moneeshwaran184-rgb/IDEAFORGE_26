import {EmailInbox} from '../components/EmailInbox';
import React,{useEffect,useState} from 'react';
import {supabase} from '../services/auth';
type Report={id:string;title:string;type:string;status:string;created_at:string;assigned_department:string|null;reference_number:string};
export function SuperAdminDashboard({tab}:{tab:string}){
 const [rows,setRows]=useState<Report[]>([]),[error,setError]=useState(''),[loading,setLoading]=useState(true);
 const [statusFilter,setStatusFilter]=useState('all');
 const filteredRows=rows.filter(r=>statusFilter==='all'||(statusFilter==='resolved'?r.status==='resolved':statusFilter==='processing'?['under_review','assigned','in_progress'].includes(r.status):r.status!=='resolved'));
 async function load(){
 if(tab==='inbox')return;
 setLoading(true);setError('');
 try{
 const all:Report[]=[];
 for(let offset=0;;offset+=1000){
 const r=await supabase.from('reports').select('id,title,type,status,created_at,assigned_department,reference_number').order('created_at',{ascending:false}).order('id').range(offset,offset+999);
 if(r.error)throw r.error;
 all.push(...(r.data||[]));if(!r.data||r.data.length<1000)break;
 }
 setRows(all);
 }catch{setError('Unable to load reports. Check your connection and admin permissions.');}finally{setLoading(false);}
 }
 useEffect(()=>{void load();},[tab]);
 const pending=rows.filter(r=>r.status==='received'),active=rows.filter(r=>['under_review','assigned','in_progress'].includes(r.status)),done=rows.filter(r=>r.status==='resolved');
 const slices=[{label:'Not started',count:pending.length,color:'#f59e0b'},{label:'Processing',count:active.length,color:'#3b82f6'},{label:'Completed',count:done.length,color:'#10b981'}];
 const other=rows.length-pending.length-active.length-done.length;if(other)slices.push({label:'Other',count:other,color:'#94a3b8'});
 let cumulative=0;const gradient=slices.map(slice=>{const start=cumulative;cumulative+=rows.length?slice.count/rows.length*100:0;return `${slice.color} ${start}% ${cumulative}%`;}).join(',');
 if(tab==='inbox')return <EmailInbox/>;
 return <main className="desk-page"><div className="desk-eyebrow">FIX MY CITY / ADMINISTRATION</div><div className="desk-heading"><div><h1>{tab==='inbox'?'Admin inbox':tab==='reports'?'All city reports':'Super Admin'}<span>.</span></h1><p>Citywide service overview and administrative inbox.</p></div><button className="desk-secondary" onClick={()=>void load()}>Refresh</button></div>
 {error&&<p role="alert">{error}</p>}{loading?<p>Loading…</p>:<>
 {tab==='overview'&&<div className="desk-stats">{[['All reports',rows.length],['Not started',pending.length],['In progress',active.length],['Completed',done.length]].map(([l,n])=><div key={l}><span>{l}</span><strong>{n}</strong></div>)}</div>}
 {tab==='overview'&&<section className="desk-record"><h2>Report status distribution</h2><div className="flex flex-wrap items-center gap-10 py-6"><div role="img" aria-label={slices.map(s=>`${s.label}: ${s.count}`).join(', ')} style={{width:240,height:240,borderRadius:'50%',background:rows.length?`conic-gradient(${gradient})`:'#64748b'}}/><div>{slices.map(s=><p key={s.label} className="flex items-center gap-3 py-2"><span style={{background:s.color,width:14,height:14,borderRadius:4}}/><strong>{s.label}</strong> {s.count} ({rows.length?Math.round(s.count/rows.length*100):0}%)</p>)}{!rows.length&&<p>No reports yet.</p>}</div></div></section>}
 {tab==='reports'&&<div className="desk-record flex flex-wrap items-center gap-4"><label htmlFor="admin-status-filter" className="font-bold">Report status</label><select id="admin-status-filter" value={statusFilter} onChange={e=>setStatusFilter(e.target.value)} className="rounded-lg border px-4 py-2 bg-white text-slate-900 dark:bg-slate-800 dark:text-white"><option value="all">All statuses</option><option value="resolved">Resolved</option><option value="processing">Processing</option><option value="unresolved">Not resolved</option></select><span role="status">Showing {filteredRows.length} of {rows.length} reports</span>{statusFilter==='unresolved'&&<span className="text-sm">Includes not started and processing reports.</span>}</div>}
 {tab==='reports'&&filteredRows.length===0&&<div className="desk-empty">No reports match this status.</div>}
 <div className="desk-section-label">{tab==='overview'?'LATEST REPORTS':'ALL REPORTS'} · {tab==='reports'?filteredRows.length:rows.length}</div>{(tab==='reports'?filteredRows:rows.slice(0,50)).map(r=><article className="desk-record" key={r.id}><div className="desk-record-top"><h2>{r.title}</h2><span className={'desk-status '+(r.status==='resolved'?'complete':'')}>{r.status.replaceAll('_',' ')}</span></div><p className="desk-reference">{r.reference_number} · {r.type} · {r.assigned_department||'Unassigned'} · {new Date(r.created_at).toLocaleString()}</p></article>)}
 </>}</main>;
}
