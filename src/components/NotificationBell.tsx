import React,{useEffect,useRef,useState} from 'react';
import {Bell,RefreshCw,X} from 'lucide-react';
import {supabase} from '../services/auth';
type Notice={id:string;report_id:string;message:string;created_at:string;read_at:string|null};
export function NotificationBell({userId,onOpen}:{userId:string;onOpen:(id:string)=>Promise<void>}){
 const [items,setItems]=useState<Notice[]>([]),[loading,setLoading]=useState(true),[error,setError]=useState(''),[attempt,setAttempt]=useState(0),[open,setOpen]=useState(false),[busy,setBusy]=useState(false);
 const host=useRef<HTMLDivElement>(null),button=useRef<HTMLButtonElement>(null);
 useEffect(()=>{
  let alive=true;let pending=false;
  async function load(){if(pending)return;pending=true;try{
   const {data,error}=await supabase.from('citizen_notifications').select('id,report_id,message,created_at,read_at').eq('user_id',userId).order('created_at',{ascending:false}).limit(100);
   if(alive){if(error)setError('Unable to load notifications. Please retry.');else{setItems(data||[]);setError('');}}
  }catch{if(alive)setError('Unable to load notifications. Please retry.');}finally{pending=false;if(alive)setLoading(false);}}
  void load();const timer=setInterval(()=>void load(),15000);window.addEventListener('focus',load);
  return()=>{alive=false;clearInterval(timer);window.removeEventListener('focus',load);};
 },[userId,attempt]);
 useEffect(()=>{if(!open)return;const close=(e:PointerEvent)=>{if(!host.current?.contains(e.target as Node))setOpen(false);};const escape=(e:KeyboardEvent)=>{if(e.key==='Escape'){setOpen(false);button.current?.focus();}};document.addEventListener('pointerdown',close);document.addEventListener('keydown',escape);return()=>{document.removeEventListener('pointerdown',close);document.removeEventListener('keydown',escape);};},[open]);
 async function markRead(id?:string){setBusy(true);try{const now=new Date().toISOString();let q=supabase.from('citizen_notifications').update({read_at:now}).eq('user_id',userId).is('read_at',null);if(id)q=q.eq('id',id);const {error}=await q;if(error)throw error;setItems(rows=>rows.map(n=>!id||n.id===id?{...n,read_at:n.read_at||now}:n));}catch{setError('Unable to mark notifications as read.');}finally{setBusy(false);}}
 const unread=items.filter(n=>!n.read_at).length;
 return <div ref={host} className="notification-anchor">
 <button ref={button} type="button" className="notification-bell" aria-label={unread?unread+' unread notifications':'Notifications'} aria-expanded={open} aria-controls="citizen-notifications" onClick={()=>setOpen(v=>!v)}><Bell size={20}/>{!loading&&!error&&unread>0&&<span className="notification-badge">{unread>99?'99+':unread}</span>}</button>
 {open&&<section id="citizen-notifications" aria-label="Notifications" className="notification-panel">
 <div className="notification-heading"><h2>Notifications</h2><button type="button" aria-label="Refresh notifications" onClick={()=>setAttempt(n=>n+1)}><RefreshCw size={16}/></button><button type="button" aria-label="Close notifications" onClick={()=>{setOpen(false);button.current?.focus();}}><X size={18}/></button></div>
 {error&&<p role="alert" className="p-4 text-red-500">{error}</p>}
 {loading?<p role="status" className="p-6">Loading updates…</p>:!error&&!items.length?<div className="p-8 text-center"><Bell className="mx-auto mb-3" size={26}/><strong>You're all caught up</strong><p className="text-sm mt-2">Department updates will appear here.</p></div>:<div className="notification-list">{items.map(n=><article key={n.id} className={'notification-item '+(!n.read_at?'is-unread':'')}><p>{n.message}</p><time>{new Date(n.created_at).toLocaleString()}</time><div className="flex gap-4 mt-3"><button disabled={busy} onClick={async()=>{await onOpen(n.report_id);await markRead(n.id);setOpen(false);}}>View report</button>{!n.read_at&&<button disabled={busy} onClick={()=>void markRead(n.id)}>Mark as read</button>}</div></article>)}</div>}
 {unread>0&&<button disabled={busy} className="notification-footer" onClick={()=>void markRead()}>Mark all as read</button>}
 </section>}</div>;
}
