import React,{useEffect,useState} from 'react';
import {ChevronDown,Plus,LogIn,Trash2} from 'lucide-react';
import {supabase} from '../services/auth';
type Saved={email:string;label:string};
const KEY='fmc-demo-account-emails-v1';
function readSaved():Saved[]{try{return JSON.parse(localStorage.getItem(KEY)||'[]')}catch{return[]}}
export function DemoAccountSwitcher({activeEmail}:{activeEmail:string}){
 const [open,setOpen]=useState(false),[saved,setSaved]=useState(readSaved),[email,setEmail]=useState(''),[password,setPassword]=useState(''),[showAdd,setShowAdd]=useState(false),[error,setError]=useState(''),[busy,setBusy]=useState(false),[query,setQuery]=useState('');
 useEffect(()=>{try{localStorage.setItem(KEY,JSON.stringify(saved))}catch{}},[saved]);
 const add=()=>{const clean=email.trim().toLowerCase();if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clean)){setError('Enter a valid email address.');return}if(!saved.some(a=>a.email===clean))setSaved(a=>[{email:clean,label:clean.split('@')[0]},...a]);setEmail('');setShowAdd(false);setError('')};
 async function login(target:string){setBusy(true);setError('');try{const {error}=await supabase.auth.signInWithPassword({email:target,password});if(error)throw error;setOpen(false);setPassword('')}catch(e){setError(e instanceof Error?e.message:'Sign in failed.')}finally{setBusy(false)}}
 return <div className="demo-switcher"><button className="demo-switcher-trigger" aria-expanded={open} onClick={()=>setOpen(v=>!v)}><span className="demo-avatar">{activeEmail.slice(0,1).toUpperCase()}</span><span className="demo-trigger-label">Demo profiles</span><ChevronDown size={15}/></button>
 {open&&<section className="demo-switcher-menu"><div className="demo-switcher-title"><strong>DEMO ACCOUNT SWITCHER</strong><small>Saved emails only · passwords are never stored</small></div>
 <input className="demo-search" value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search saved email addresses"/>
 <div className="demo-account-list">{saved.filter(a=>a.email.includes(query.toLowerCase())).map(a=><div className="demo-account" key={a.email}><span><strong>{a.label}</strong><small>{a.email}</small></span>{a.email===activeEmail.toLowerCase()?<em>ACTIVE</em>:<button onClick={()=>{setEmail(a.email);setPassword('')}}>Select</button>}</div>)}
 {!saved.length&&<p className="demo-empty">Add demo account email addresses to switch between them.</p>}</div>
 {email&&<form className="demo-login" onSubmit={e=>{e.preventDefault();void login(email)}}><strong>Sign in as {email}</strong><input type="password" autoComplete="current-password" required value={password} onChange={e=>setPassword(e.target.value)} placeholder="Account password"/><button className="desk-primary" disabled={busy}><LogIn size={14}/>{busy?'Signing in…':'Sign in'}</button></form>}
 {error&&<p role="alert" className="demo-error">{error}</p>}
 {showAdd?<div className="demo-add"><input type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="demo@example.com"/><button onClick={add}>Save email</button><button onClick={()=>setShowAdd(false)}>Cancel</button></div>:<button className="demo-add-toggle" onClick={()=>{setEmail('');setShowAdd(true)}}><Plus size={16}/> Add demo account email</button>}
 {saved.some(a=>a.email===activeEmail.toLowerCase())&&<button className="demo-remove" onClick={()=>setSaved(a=>a.filter(x=>x.email!==activeEmail.toLowerCase()))}><Trash2 size={14}/> Remove active email from this device</button>}
 </section>}</div>
}
