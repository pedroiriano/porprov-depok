import Image from 'next/image';
import { PortalLink } from './PortalProvider';
import type { PortalSection } from '../../../../packages/portal-config/config';

// SECURITY: Plain text is escaped by React; no executable HTML, CSS or template scripts.
export function EditorialSection({section}:{section:PortalSection}){
 return <section id={`section-${section.id}`} className={`bg-white px-5 text-slate-950 dark:bg-slate-950 dark:text-slate-100 ${section.variant==='compact'?'py-8':'py-16 md:py-24'}`}>
  <div className="container mx-auto max-w-5xl">
   {section.heading&&<h2 className="text-3xl font-black tracking-tight">{section.heading}</h2>}
   {section.image_url&&<div className="relative mt-6 aspect-video overflow-hidden rounded-2xl"><Image src={section.image_url} alt={section.heading||'Ilustrasi informasi'} fill className="object-cover" sizes="(max-width:768px) 100vw, 1000px" /></div>}
   {section.body&&<p className="mt-5 whitespace-pre-line leading-8 text-slate-700 dark:text-slate-300">{section.body}</p>}
   {section.href&&<PortalLink href={section.href} className="mt-6 inline-flex min-h-11 items-center rounded-xl bg-primary-600 px-5 font-bold text-white hover:bg-primary-700">{section.type==='cta'?section.heading||'Lihat informasi':'Lihat selengkapnya'}</PortalLink>}
  </div>
 </section>;
}
