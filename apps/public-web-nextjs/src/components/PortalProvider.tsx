'use client';
import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import Link, { type LinkProps } from 'next/link';
import { usePathname,useRouter } from 'next/navigation';
import type { PortalConfig } from '../../../../packages/portal-config/config';
import { portalTarget, localModule, localFeature } from '../../../../packages/portal-config/config';
import { publicApiUrl } from '../lib/public-api';

const Context=createContext<PortalConfig|null>(null);
export function PortalProvider({initial,children}:{initial:PortalConfig|null;children:ReactNode}){
  const [config,setConfig]=useState(initial);
  const pathname=usePathname();
  const router=useRouter();
  const version=useRef(initial?.version??null);
  useEffect(()=>{
    const controller=new AbortController();
    const refresh=async()=>{
      if(document.visibilityState==='hidden') return;
      try{const response=await fetch(publicApiUrl('/portal/public'),{cache:'no-store',signal:controller.signal});if(response.ok){const next=await response.json() as PortalConfig;if(next.schema_version===1 && Array.isArray(next.modules)&&next.version!==version.current){version.current=next.version;setConfig(next);router.refresh();}}}catch{/* RELIABILITY: Retain the last confirmed publication; API enforcement remains fail-closed. */}
    };
    void refresh();const timer=window.setInterval(()=>void refresh(),15000);
    return()=>{controller.abort();window.clearInterval(timer);};
  },[pathname,router]);
  return <Context.Provider value={config}>{children}</Context.Provider>;
}
export const usePortalConfig=()=>useContext(Context);
export function PortalLink({href,children,...props}:Omit<React.ComponentProps<typeof Link>,'href'>&{href:LinkProps['href']}){
  const config=usePortalConfig();
  const value=typeof href==='string'?href:'';
  const target=config?portalTarget(config,value):value==='/'?'/':null;
  if(!target)return null;
  if(target.startsWith('https://'))return <a {...props} href={target} rel="noopener noreferrer">{children}</a>;
  return <Link {...props} href={target}>{children}</Link>;
}
export function PortalModule({id,children}:{id:string;children:ReactNode}){const config=usePortalConfig();return config&&localModule(config,id)?children:null;}
export function PortalFeature({id,children}:{id:string;children:ReactNode}){const config=usePortalConfig();return config&&localFeature(config,id)?children:null;}
