'use client';
import {useEffect,useRef,type ReactNode} from 'react';

export type PublicTableColumn<T,K extends string>={key:string;label:string;sortKey?:K;render:(row:T)=>ReactNode};
function SelectionBox({checked,mixed,label,onChange,disabled=false}:{checked:boolean;mixed?:boolean;label:string;onChange:(value:boolean)=>void;disabled?:boolean}){
 const ref=useRef<HTMLInputElement>(null);useEffect(()=>{if(ref.current)ref.current.indeterminate=!!mixed},[mixed]);
 return <input ref={ref} type="checkbox" checked={checked} disabled={disabled} onChange={event=>onChange(event.target.checked)} aria-label={label} className="size-5 accent-blue-600 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-blue-600 disabled:opacity-50"/>;
}

// ACCESSIBILITY: Canonical Public table behavior uses native semantics; visual authority remains Techwind.
export function PublicDataTable<T,K extends string>({caption,rows,columns,id,label,sort,order,onSort,selected,onSelect,selectionLimit=10,rowActions}:{caption:string;rows:T[];columns:PublicTableColumn<T,K>[];id:(row:T)=>string;label:(row:T)=>string;sort:K;order:'asc'|'desc';onSort:(key:K)=>void;selected:Set<string>;onSelect:(value:Set<string>)=>void;selectionLimit?:number;rowActions:(row:T)=>ReactNode}){
 const count=rows.filter(row=>selected.has(id(row))).length;
 return <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900" role="region" aria-label={caption} tabIndex={0}>
 <table className="w-full min-w-[720px] border-collapse text-left text-sm"><caption className="sr-only">{caption}</caption>
 <thead className="bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-100"><tr>
 <th scope="col" className="w-14 p-4"><SelectionBox label={`Pilih hingga ${selectionLimit} dokumen pada halaman ini`} checked={count===Math.min(rows.length,selectionLimit)&&count>0} mixed={count>0&&count<Math.min(rows.length,selectionLimit)} onChange={value=>onSelect(value?new Set(rows.slice(0,selectionLimit).map(id)):new Set())}/></th>
 {columns.map(column=><th key={column.key} scope="col" className="p-4 font-black" aria-sort={column.sortKey===sort?(order==='asc'?'ascending':'descending'):column.sortKey?'none':undefined}>{column.sortKey?<button type="button" onClick={()=>onSort(column.sortKey!)} className="inline-flex min-h-11 items-center gap-2 rounded px-1 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600">{column.label}<span aria-hidden="true">{sort===column.sortKey?(order==='asc'?'↑':'↓'):'↕'}</span></button>:column.label}</th>)}<th scope="col" className="p-4">Tindakan</th></tr></thead>
 <tbody>{rows.map(row=><tr key={id(row)} className="border-t border-slate-200 align-top hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800/60"><td className="p-4"><SelectionBox label={`Pilih ${label(row)}`} checked={selected.has(id(row))} disabled={!selected.has(id(row))&&selected.size>=selectionLimit} onChange={value=>{const next=new Set(selected);if(value)next.add(id(row));else next.delete(id(row));onSelect(next)}}/></td>{columns.map(column=><td key={column.key} className="p-4">{column.render(row)}</td>)}<td className="p-4">{rowActions(row)}</td></tr>)}</tbody>
 </table></div>;
}
