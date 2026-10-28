'use client';
import type { ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import { usePortalConfig } from './PortalProvider';
import { EditorialSection } from './PortalSections';
import { localModule,portalPageFor } from '../../../../packages/portal-config/config';

export function PortalPageCanvas({children}:{children:ReactNode}){
 const config=usePortalConfig();const path=usePathname();
 if(path==='/'||path.startsWith('/portal-unavailable')||path.startsWith('/rujukan/'))return children;
 if(!config)return children;
 const page=portalPageFor(config,path);
 if(!page)return <section className="container py-40" role="status"><h1 className="text-3xl font-black">Halaman tidak tersedia</h1><p className="mt-4">Halaman ini tidak sedang dipublikasikan.</p></section>;
 if(page.module_id&&!localModule(config,page.module_id))return <section className="container py-40" role="status"><h1 className="text-3xl font-black">Informasi tidak ditampilkan</h1><p className="mt-4">Ketersediaan modul telah diperbarui oleh pengelola portal.</p></section>;
 if(page.id==='jadwal'&&path===page.path)return children;
 if(path.startsWith('/informasi/')||path!==page.path)return children;
 return <>{!page.sections.some(s=>s.type==='content'&&s.enabled)&&<h1 className="sr-only">{page.title}</h1>}{page.sections.map(s=>s.enabled?<div key={s.id} className={s.variant==='compact'?'[&>main>section]:py-8':'contents'}>{s.type==='content'?children:<EditorialSection section={s}/>}</div>:null)}</>;
}
