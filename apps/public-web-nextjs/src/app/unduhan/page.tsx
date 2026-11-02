import {PublicPageHero} from '@/components/PublicPageHero';
import {DocumentDownloads} from '@/components/DocumentDownloads';
export default function DownloadsPage(){return <main className="bg-slate-50 pb-20 text-slate-950 dark:bg-slate-950 dark:text-white"><PublicPageHero eyebrow="Pusat Dokumen" title="Unduhan" description="Temukan panduan, informasi, dan dokumen resmi PORPROV XV Jawa Barat 2026 di Kota Depok." icon="ri-file-download-line" breadcrumbs={[{label:'Unduhan'}]}/><div className="container py-14 md:py-20"><DocumentDownloads/></div></main>}
