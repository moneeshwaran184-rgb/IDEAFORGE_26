import React from 'react';
import {ClipboardList,Lightbulb,ShieldCheck} from 'lucide-react';
export function SuperAdminNavbar({tab,onTab}:{tab:string;onTab:(tab:string)=>void}){
 return <header className="desk-header"><div className="desk-ticker"><span><b>SUPER ADMIN</b> Fix My City · Tamil Nadu</span><span>CITY OPERATIONS</span></div><div className="desk-nav"><a href="/" className="desk-brand"><span className="desk-logo">F</span><span><strong>FIX MY CITY</strong><small>NEIGHBORHOOD GAZETTE</small></span></a><nav aria-label="Super Admin navigation">{[{id:'overview',label:'City dashboard',Icon:ShieldCheck},{id:'reports',label:'All reports',Icon:ClipboardList},{id:'inbox',label:'Email inbox',Icon:Lightbulb}].map(({id,label,Icon})=><button key={id} aria-current={tab===id?'page':undefined} className={tab===id?'active':''} onClick={()=>onTab(id)}><Icon size={16}/>{label}</button>)}</nav></div></header>;
}

