import React from 'react';
import { ClipboardList, Lightbulb, User } from 'lucide-react';
export function DepartmentNavbar({tab,onTab,onAccount}:{tab:string;onTab:(tab:string)=>void;onAccount:()=>void}){
 return <header className="desk-header">
 <div className="desk-ticker"><span><b>DEPARTMENT DESK</b> Fix My City · Tamil Nadu</span><span>REVIEW · RESPOND · RESOLVE</span></div>
 <div className="desk-nav">
 <a href="/" className="desk-brand"><span className="desk-logo">F</span><span><strong>FIX MY CITY</strong><small>NEIGHBORHOOD GAZETTE</small></span></a>
 <nav aria-label="Department navigation">{[{id:'complaint',label:'Complaints',Icon:ClipboardList},{id:'suggestion',label:'Suggestions',Icon:Lightbulb}].map(({id,label,Icon})=><button key={id} aria-current={tab===id?'page':undefined} className={tab===id?'active':''} onClick={()=>onTab(id)}><Icon size={16}/>{label}</button>)}</nav>
 <button className="desk-account" onClick={onAccount}><User size={15}/> My account</button>
 </div></header>;
}
