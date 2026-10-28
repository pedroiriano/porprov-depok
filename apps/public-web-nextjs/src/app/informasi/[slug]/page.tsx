import { notFound } from 'next/navigation';
import { loadPortalConfig,localModule } from '@/lib/portal-config';
import { EditorialSection } from '@/components/PortalSections';
import type { Metadata } from 'next';

type Props={params:Promise<{slug:string}>};
async function pageFor(slug:string){const config=await loadPortalConfig();return config?.pages.find(p=>p.path===`/informasi/${slug}`&&p.status==='published'&&(!p.module_id||localModule(config,p.module_id)));}
export async function generateMetadata({params}:Props):Promise<Metadata>{const page=await pageFor((await params).slug);return page?{title:page.title,description:page.description,alternates:{canonical:page.path},openGraph:{title:page.title,description:page.description}}:{robots:{index:false,follow:false}};}
export default async function InformationPage({params}:Props){const page=await pageFor((await params).slug);if(!page)notFound();return <main><header className="bg-slate-950 px-5 pb-14 pt-36 text-white"><div className="container"><h1 className="text-4xl font-black">{page.title}</h1><p className="mt-5 max-w-3xl text-slate-300">{page.description}</p></div></header>{page.sections.filter(s=>s.enabled).map(s=><EditorialSection key={s.id} section={s}/>)}</main>;}
