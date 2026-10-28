import Link from 'next/link';
export const metadata={title:'Halaman tidak tersedia',robots:{index:false,follow:false}};
export default function PortalUnavailable(){return <main className="container py-40"><h1 className="text-3xl font-black">Halaman tidak tersedia</h1><p className="mt-5">Informasi ini sedang tidak ditampilkan atau layanan sementara belum tersedia.</p><Link href="/" className="mt-6 inline-flex min-h-11 items-center rounded-xl bg-primary-600 px-5 font-bold text-white">Kembali ke Beranda</Link></main>;}
