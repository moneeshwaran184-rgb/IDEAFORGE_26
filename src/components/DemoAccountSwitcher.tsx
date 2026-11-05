import React,{useEffect,useState} from 'react';
import {ChevronDown,Plus,LogIn} from 'lucide-react';
import {supabase} from '../services/auth';
type Saved={email:string;label:string};
const KEY='fmc-demo-account-emails-v1';
function readSaved():Saved[]{try{const rows=JSON.parse(localStorage.getItem(KEY)||'[]');return Array.isArray(rows)?rows.filter(a=>typeof a?.email==='string'&&typeof a?.label==='string'):[]}catch{return[]}}
export function DemoAccountSwitcher({activeEmail}:{activeEmail:string}){
 const [open,setOpen]=useState(false),[saved,setSaved]=useState(readSaved),[email,setEmail]=useState(''),[password,setPassword]=useState(''),[showAdd,setShowAdd]=useState(false),[error,setError]=useState(''),[busy,setBusy]=useState(false),[query,setQuery]=useState('');
 useEffect(()=>{try{localStorage.setItem(KEY,JSON.stringify(saved))}catch{}},[saved]);
 useEffect(()=>{let alive=true;
  async function sync(){
   if(!activeEmail)return;
   const {data,error:loadError}=await supabase.from('demo_profile_directory').select('email,label').order('created_at');
   if(!alive)return;
   if(loadError){setError('Showing saved profiles from this browser. Run demo-profile-directory.sql to enable the shared demo list.');return;}
   for(const account of readSaved().filter(a=>!(data||[]).some(r=>r.email===a.email))){
    if(!alive)return;
    const {error:uploadError}=await supabase.from('demo_profile_directory').insert(account);
    if(uploadError&&uploadError.code!=='23505'){setError('Some profiles are saved only on this browser. Shared saving could not finish.');return;}
   }
   setSaved(previous=>Array.from(new Map([...previous,...(data||[])].map(a=>[a.email,a])).values()));
  }
  void sync();const timer=setInterval(()=>void sync(),15000);
  const storage=(event:StorageEvent)=>{if(event.key===KEY)setSaved(readSaved());};
  window.addEventListener('storage',storage);
  return()=>{alive=false;clearInterval(timer);window.removeEventListener('storage',storage);};
 },[activeEmail]);
 const add=async()=>{const clean=email.trim().toLowerCase();if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clean)){setError('Enter a valid email address.');return}if(!saved.some(a=>a.email===clean))setSaved(a=>[{email:clean,label:clean.split('@')[0]},...a]);setEmail('');setShowAdd(false);setError('');if(activeEmail){const {error:saveError}=await supabase.from('demo_profile_directory').insert({email:clean,label:clean.split('@')[0]});if(saveError&&saveError.code!=='23505')setError('Saved on this browser. Run demo-profile-directory.sql to share it with everyone.');}};
 async function login(target:string){setBusy(true);setError('');try{const {error}=await supabase.auth.signInWithPassword({email:target,password});if(error)throw error;setOpen(false);setPassword('')}catch(e){setError(e instanceof Error?e.message:'Sign in failed.')}finally{setBusy(false)}}
 return <div className="demo-switcher"><button className="demo-switcher-trigger" aria-expanded={open} onClick={()=>setOpen(v=>!v)}><span className="demo-avatar">{activeEmail.slice(0,1).toUpperCase()||'D'}</span><span className="demo-trigger-label">Demo profiles</span><ChevronDown size={15}/></button>
 {open&&<section className="demo-switcher-menu"><div className="demo-switcher-title"><strong>DEMO ACCOUNT SWITCHER</strong><small>Shared demo emails · saved across account switches</small></div>
 <input className="demo-search" value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search saved email addresses"/>
 <div className="demo-account-list">{saved.filter(a=>a.email.includes(query.toLowerCase())).map(a=><div className="demo-account" key={a.email}><span><strong>{a.label}</strong><small>{a.email}</small></span>{a.email===activeEmail.toLowerCase()?<em>ACTIVE</em>:<button onClick={()=>{setEmail(a.email);setPassword('')}}>Select</button>}</div>)}
 {!saved.length&&<p className="demo-empty">Add demo account email addresses to switch between them.</p>}</div>
 {email&&!showAdd&&<form className="demo-login" onSubmit={e=>{e.preventDefault();void login(email)}}><strong>Sign in as {email}</strong><input type="password" autoComplete="current-password" required value={password} onChange={e=>setPassword(e.target.value)} placeholder="Account password"/><button className="desk-primary" disabled={busy}><LogIn size={14}/>{busy?'Signing in…':'Sign in'}</button></form>}
 {error&&<p role="alert" className="demo-error">{error}</p>}
 {showAdd?<div className="demo-add"><input type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="demo@example.com"/><button onClick={add}>Save email</button><button onClick={()=>setShowAdd(false)}>Cancel</button></div>:<button className="demo-add-toggle" onClick={()=>{setEmail('');setShowAdd(true)}}><Plus size={16}/> Add demo account email</button>}
 </section>}</div>
}

