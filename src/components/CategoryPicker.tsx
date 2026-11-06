import React,{useEffect,useRef} from 'react';
import {COMPLAINT_CATEGORIES,SUGGESTION_CATEGORIES} from '../data/categories';
import {CategoryIcon} from './CategoryIcon';
export function CategoryPicker({type,onSelect,onClose}:{type:'complaint'|'suggestion';onSelect:(id:string)=>void;onClose:()=>void}){
 const dialog=useRef<HTMLDialogElement>(null);
 useEffect(()=>{dialog.current?.showModal();},[]);
 return <dialog ref={dialog} onCancel={onClose} aria-labelledby="choose-category" className="m-auto w-[calc(100%-2rem)] max-w-2xl max-h-[85vh] overflow-auto rounded-3xl border-2 border-[#181615] bg-[#FAF7F0] dark:bg-[#1E2125] dark:text-[#F4EFE6] p-6 backdrop:bg-black/60">
 <div className="flex justify-between gap-4"><div><p className="desk-eyebrow">SELECT A CATEGORY</p><h2 id="choose-category" className="text-2xl font-bold mt-2">{type==='complaint'?'What needs fixing?':'What would you improve?'}</h2></div><button type="button" onClick={onClose} aria-label="Close category selection">✕</button></div><p className="my-4 text-sm">Choose a category to route your submission to the responsible department.</p>
 <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">{(type==='complaint'?COMPLAINT_CATEGORIES:SUGGESTION_CATEGORIES).map(c=><button type="button" key={c.id} onClick={()=>onSelect(c.id)} className="text-left p-4 rounded-xl border border-[#857E75] hover:border-orange-500 hover:bg-orange-500/10"><CategoryIcon name={c.iconName} className="w-5 h-5 mb-2"/><strong>{c.name}</strong><p className="text-xs mt-1">{c.shortDesc}</p></button>)}</div></dialog>;
}
