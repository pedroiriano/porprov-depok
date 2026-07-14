"use client";

import Image from "next/image";
import Link from "next/link";

export function Footer() {
  return (
    <footer className="relative bg-slate-900 dark:bg-slate-800 text-gray-200 dark:text-gray-200 mt-auto">    
      <div className="container relative">
        <div className="grid grid-cols-12">
          <div className="col-span-12">
            <div className="py-15 px-0">
              <div className="grid md:grid-cols-12 grid-cols-1 gap-7.5">
                <div className="lg:col-span-4 md:col-span-12">
                  <Link href="/" className="text-[22px] focus:outline-none">
                    <Image src="/assets/images/logo-porprov-dan-tulisan.png" className="h-8 w-auto object-contain brightness-0 invert" width={200} height={32} alt="Logo" />
                  </Link>
                  <p className="mt-6 text-gray-300">
                    Portal resmi penyelenggaraan Pekan Olahraga Provinsi (PORPROV) XV Jawa Barat Tahun 2026 di Kota Depok.
                  </p>
                  <ul className="list-none mt-6">
                    <li className="inline"><a href="#" target="_blank" className="size-8 inline-flex justify-center items-center text-gray-400 hover:text-white border border-gray-800 dark:border-gray-700 rounded-md hover:border-indigo-600 dark:hover:border-indigo-600 hover:bg-indigo-600 dark:hover:bg-indigo-600"><i className="ri-facebook-circle-line"></i></a></li>
                    <li className="inline"><a href="#" target="_blank" className="size-8 inline-flex justify-center items-center text-gray-400 hover:text-white border border-gray-800 dark:border-gray-700 rounded-md hover:border-indigo-600 dark:hover:border-indigo-600 hover:bg-indigo-600 dark:hover:bg-indigo-600"><i className="ri-instagram-line"></i></a></li>
                    <li className="inline"><a href="#" target="_blank" className="size-8 inline-flex justify-center items-center text-gray-400 hover:text-white border border-gray-800 dark:border-gray-700 rounded-md hover:border-indigo-600 dark:hover:border-indigo-600 hover:bg-indigo-600 dark:hover:bg-indigo-600"><i className="ri-twitter-x-line"></i></a></li>
                  </ul>
                </div>
                
                <div className="lg:col-span-2 md:col-span-4">
                  <h5 className="tracking-[1px] text-gray-100 font-semibold">Pintasan</h5>
                  <ul className="list-none footer-list mt-6">
                    <li><Link href="/" className="text-gray-300 hover:text-gray-400 duration-500 ease-in-out"><i className="ri-arrow-right-s-line"></i> Beranda</Link></li>
                    <li className="mt-2.5"><Link href="/cabor" className="text-gray-300 hover:text-gray-400 duration-500 ease-in-out"><i className="ri-arrow-right-s-line"></i> Cabang Olahraga</Link></li>
                    <li className="mt-2.5"><Link href="/jadwal" className="text-gray-300 hover:text-gray-400 duration-500 ease-in-out"><i className="ri-arrow-right-s-line"></i> Jadwal Tanding</Link></li>
                    <li className="mt-2.5"><Link href="/medali" className="text-gray-300 hover:text-gray-400 duration-500 ease-in-out"><i className="ri-arrow-right-s-line"></i> Klasemen Medali</Link></li>
                  </ul>
                </div>
                
                <div className="lg:col-span-3 md:col-span-4">
                  <h5 className="tracking-[1px] text-gray-100 font-semibold">Informasi</h5>
                  <ul className="list-none footer-list mt-6">
                    <li><Link href="#" className="text-gray-300 hover:text-gray-400 duration-500 ease-in-out"><i className="ri-arrow-right-s-line"></i> Panduan Depok</Link></li>
                    <li className="mt-2.5"><Link href="#" className="text-gray-300 hover:text-gray-400 duration-500 ease-in-out"><i className="ri-arrow-right-s-line"></i> Berita PORPROV</Link></li>
                    <li className="mt-2.5"><Link href="#" className="text-gray-300 hover:text-gray-400 duration-500 ease-in-out"><i className="ri-arrow-right-s-line"></i> Maskot Toca & Toci</Link></li>
                    <li className="mt-2.5"><Link href="#" className="text-gray-300 hover:text-gray-400 duration-500 ease-in-out"><i className="ri-arrow-right-s-line"></i> Kontak Panitia</Link></li>
                  </ul>
                </div>

                <div className="lg:col-span-3 md:col-span-4">
                  <h5 className="tracking-[1px] text-gray-100 font-semibold">Dukungan</h5>
                  <p className="mt-6 text-gray-300">
                    Dikelola oleh Dinas Komunikasi dan Informatika Kota Depok. Dipersembahkan untuk seluruh masyarakat Jawa Barat.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="py-7.5 px-0 border-t border-gray-800 dark:border-gray-700">
        <div className="container relative text-center">
          <div className="grid md:grid-cols-2 items-center">
            <div className="md:text-start text-center">
              <p className="mb-0 text-gray-100">© {new Date().getFullYear()} PORPROV XV. Dibuat dengan <i className="ri-heart-fill text-red-600"></i> oleh <a href="https://diskominfo.depok.go.id/" target="_blank" className="text-reset">Diskominfo Depok</a>.</p>
            </div>

            <ul className="list-none md:text-end text-center mt-6 md:mt-0">
              <li className="inline"><a href="#" className="text-gray-300 hover:text-gray-400">Syarat & Ketentuan</a></li>
              <li className="inline ms-4"><a href="#" className="text-gray-300 hover:text-gray-400">Privasi</a></li>
            </ul>
          </div>
        </div>
      </div>
    </footer>
  );
}
