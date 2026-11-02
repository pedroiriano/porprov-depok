'use client';
import {PublicPageHero} from '@/components/PublicPageHero';
import {SchedulePeriods} from '@/components/SchedulePeriods';
import {ScheduleMatches} from '@/components/ScheduleMatches';
import {EditorialSection} from '@/components/PortalSections';
import {usePortalConfig} from '@/components/PortalProvider';
import {localFeature,sectionFeature} from '@/lib/portal-config';

// INFO: Each native section owns its requests and unmounts when its publication is disabled.
export default function JadwalPage() {
  const config=usePortalConfig();
  const page=config?.pages.find(item=>item.id==='jadwal');
  const sections=page?.sections.filter(section=>section.enabled&&(!sectionFeature(section.type)||config&&localFeature(config,sectionFeature(section.type)!)))??[];
  return <main className="bg-slate-50 pb-20 text-slate-950 dark:bg-slate-950 dark:text-white">
    <PublicPageHero eyebrow="Rencanakan Kunjungan Anda" title="Jadwal PORPROV di Depok" description="Cari kapan Cabor berlangsung, pilih tanggal kunjungan, lalu buka jadwal untuk melihat informasi lengkapnya." icon="ri-calendar-event-line" breadcrumbs={[{label:'Jadwal'}]}/>
    <div className="container space-y-10 py-14 md:py-20">
      {!!sections.length&&<nav aria-label="Pilih informasi jadwal" className="grid gap-3 sm:grid-cols-2">{sections.some(section=>section.type==='schedule_periods')&&<a href="#rentang-jadwal" className="rounded-2xl border border-slate-200 bg-white p-5 focus-visible:outline-2 focus-visible:outline-blue-600 dark:border-slate-700 dark:bg-slate-900"><span className="font-black text-blue-800 dark:text-sky-200">Kapan Cabor berlangsung? →</span><span className="mt-1 block text-sm text-slate-600 dark:text-slate-300">Tanggal mulai dan selesai setiap Cabor</span></a>}{sections.some(section=>section.type==='schedule_matches')&&<a href="#rincian-pertandingan" className="rounded-2xl border border-slate-200 bg-white p-5 focus-visible:outline-2 focus-visible:outline-blue-600 dark:border-slate-700 dark:bg-slate-900"><span className="font-black text-blue-800 dark:text-sky-200">Mau menonton pertandingan? →</span><span className="mt-1 block text-sm text-slate-600 dark:text-slate-300">Jam, peserta, babak, dan lokasi setiap laga</span></a>}</nav>}
      {!config?<p role="alert">Jadwal belum dapat dimuat. Silakan muat ulang halaman.</p>:!sections.length?<div role="status" className="rounded-2xl border border-dashed border-slate-300 p-8 dark:border-slate-700">Jadwal belum tersedia.</div>:sections.map(section=><div key={section.id} id={section.type==='schedule_periods'?'rentang-jadwal':section.type==='schedule_matches'?'rincian-pertandingan':undefined} className={section.variant==='compact'?'scroll-mt-28 [&>section]:p-4 [&>section]:shadow-none [&_.gap-5]:gap-3':'scroll-mt-28'}>
        {section.type==='schedule_periods'?<SchedulePeriods/>:section.type==='schedule_matches'?<ScheduleMatches/>:<EditorialSection section={section}/>}
      </div>)}
    </div>
  </main>;
}
