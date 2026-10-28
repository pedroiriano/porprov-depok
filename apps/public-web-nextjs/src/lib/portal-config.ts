import { cache } from 'react';
import { publicApiUrl } from './public-api';
export * from '../../../../packages/portal-config/config';
import type { PortalConfig } from '../../../../packages/portal-config/config';
import type { Metadata } from 'next';
import { defaultPortalConfig } from '../../../../packages/portal-config/config';

export async function portalMetadata(id:string,fallback:Metadata):Promise<Metadata>{
 const config=await loadPortalConfig();const page=config?.pages.find(p=>p.id===id);const original=defaultPortalConfig.pages.find(p=>p.id===id);
 if(!page||!original)return {...fallback,robots:{index:false,follow:false}};
 return {...fallback,title:page.title!==original.title?page.title:fallback.title,description:page.description!==original.description?page.description:fallback.description,alternates:{canonical:page.path}};
}

// SECURITY: No default-on fallback after an operational failure; only the service owns the migration baseline.
export const loadPortalConfig = cache(async (): Promise<PortalConfig | null> => {
  try {
    const response=await fetch(publicApiUrl('/portal/public'),{cache:'no-store',signal:AbortSignal.timeout(4000),redirect:'error'});
    if(!response.ok) return null;
    const value=await response.json() as PortalConfig;
    return value.schema_version===1 && Array.isArray(value.modules) && Array.isArray(value.pages) && Array.isArray(value.menus) ? value : null;
  } catch {return null;}
});
