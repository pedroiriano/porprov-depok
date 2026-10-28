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
    <PublicPageHero eyebrow="Agenda Resmi" title="Jadwal Pertandingan" description="Lihat rentang pelaksanaan cabang olahraga dan rincian pertandingan yang ditampilkan pengelola." icon="ri-calendar-event-line" breadcrumbs={[{label:'Jadwal'}]}/>
    <div className="container space-y-10 py-14 md:py-20">
      {!config?<p role="alert">Pengaturan jadwal belum tersedia. Muat ulang untuk mencoba kembali.</p>:!sections.length?<div role="status" className="rounded-2xl border border-dashed border-slate-300 p-8 dark:border-slate-700">Belum ada bagian jadwal yang ditampilkan.</div>:sections.map(section=><div key={section.id} id={section.type==='schedule_periods'?'rentang-jadwal':section.type==='schedule_matches'?'rincian-pertandingan':undefined} className={section.variant==='compact'?'scroll-mt-28 [&>section]:p-4 [&>section]:shadow-none [&_.gap-5]:gap-3':'scroll-mt-28'}>
        {section.type==='schedule_periods'?<SchedulePeriods/>:section.type==='schedule_matches'?<ScheduleMatches/>:<EditorialSection section={section}/>}
      </div>)}
    </div>
  </main>;
}
