import type {Metadata} from 'next';
import {portalMetadata} from '@/lib/portal-config';
export function generateMetadata():Promise<Metadata>{return portalMetadata('downloads',{title:'Unduhan Dokumen Resmi',description:'Unduh panduan dan dokumen resmi PORPROV XV Jawa Barat 2026 di Kota Depok.',alternates:{canonical:'/unduhan'}})}
export default function DownloadsLayout({children}:{children:React.ReactNode}){return children}
