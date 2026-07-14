"use client";

import Image from "next/image";
import Link from "next/link";
import { CountdownTimer } from "@/components/CountdownTimer";
import { VenueShowcase } from "@/components/VenueShowcase";

export default function Home() {
  return (
    <>
      {/* Start Hero */}
      <section className="relative table w-full h-screen py-36 lg:py-64 bg-[url('/assets/images/alun-alun.png')] bg-no-repeat bg-center bg-cover bg-fixed">
        <div className="absolute inset-0 bg-slate-900/60 bg-gradient-to-t from-slate-900/90 to-slate-900/40"></div>
        <div className="container relative h-full flex items-center">
          <div className="grid md:grid-cols-12 grid-cols-1 items-center mt-10 gap-7.5 w-full">
            <div className="lg:col-span-8 md:col-span-7 md:order-1 order-2">
              <h5 className="text-xl text-white/60 mb-3">7 November 2026</h5>
              <h4 className="font-bold lg:leading-normal leading-normal text-4xl lg:text-5xl mb-5 text-white">
                Pekan Olahraga Provinsi <br /> XV Jawa Barat
              </h4>
              <p className="text-white/60 text-lg max-w-xl">
                Jadilah saksi perhelatan olahraga terbesar di Jawa Barat. Saksikan atlet-atlet terbaik bertanding dan mengharumkan nama daerah di Kota Depok.
              </p>
          
              <div className="mt-8 flex gap-4 flex-wrap">
                <Link href="/jadwal" className="py-2 px-5 inline-block font-semibold tracking-wide border align-middle duration-500 text-base text-center bg-indigo-600 hover:bg-indigo-700 border-indigo-600 hover:border-indigo-700 text-white rounded-md">
                  <i className="ri-calendar-event-line font-normal mr-2"></i> Lihat Jadwal
                </Link>
                <Link href="/cabor" className="py-2 px-5 inline-block font-semibold tracking-wide border align-middle duration-500 text-base text-center bg-transparent hover:bg-indigo-600 border-white hover:border-indigo-600 text-white rounded-md">
                  <i className="ri-map-pin-user-line font-normal mr-2"></i> Jelajahi Venue
                </Link>
              </div>
            </div>

            <div className="lg:col-span-4 md:col-span-5 md:text-center md:order-2 order-1 flex flex-col items-center justify-center">
              {/* Countdown Timer */}
              <div className="bg-slate-900/50 backdrop-blur-sm border border-slate-800 p-6 rounded-md shadow-md w-full max-w-md">
                <h5 className="text-white font-semibold text-lg mb-4 text-center">Menuju Opening Ceremony</h5>
                <CountdownTimer targetDate="2026-11-07T00:00:00" />
              </div>
            </div>
          </div>
        </div>
      </section>
      {/* End Hero */}

      {/* Start Section */}
      <section className="relative md:py-24 py-16">
        <div className="container relative">
          <div className="grid md:grid-cols-12 grid-cols-1 items-center gap-[30px]">
            <div className="md:col-span-6">
              <div className="grid grid-cols-2 gap-4 items-center">
                <div className="grid grid-cols-1 gap-4">
                  <div className="relative overflow-hidden rounded-md shadow dark:shadow-gray-800">
                    <Image src="/assets/images/maskot-toca.png" width={400} height={500} className="w-full h-72 md:h-96 object-contain" alt="Maskot Toca" />
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4">
                  <div className="relative overflow-hidden rounded-md shadow dark:shadow-gray-800">
                    <Image src="/assets/images/maskot-toci.png" width={400} height={500} className="w-full h-72 md:h-96 object-contain" alt="Maskot Toci" />
                  </div>
                </div>
              </div>
            </div>

            <div className="md:col-span-6">
              <div className="lg:ms-5">
                <h6 className="text-indigo-600 text-sm font-bold uppercase mb-2">Tuan Rumah</h6>
                <h3 className="mb-4 md:text-3xl md:leading-normal text-2xl leading-normal font-semibold">
                  Kota Depok, <br /> Berbudaya dan Nyaman.
                </h3>

                <p className="text-slate-400 max-w-xl mb-6">
                  Kota Depok siap menyambut seluruh kontingen dari berbagai kabupaten dan kota di Jawa Barat. Dengan berbagai venue kelas dunia dan fasilitas pendukung yang lengkap.
                </p>

                <div className="flex mt-6 items-center">
                  <div className="w-14 h-14 bg-indigo-600/5 text-indigo-600 rounded-md text-3xl flex align-middle justify-center items-center shadow-sm dark:shadow-gray-800 me-4">
                    <i className="ri-map-pin-line"></i>
                  </div>
                  <div className="">
                    <h5 className="text-xl font-semibold mb-0">Lokasi Utama</h5>
                    <p className="text-slate-400 mt-2">Alun-Alun Kota Depok <br /> Grand Depok City</p>
                  </div>
                </div>
                
                <div className="flex mt-6 items-center">
                  <div className="w-14 h-14 bg-indigo-600/5 text-indigo-600 rounded-md text-3xl flex align-middle justify-center items-center shadow-sm dark:shadow-gray-800 me-4">
                    <i className="ri-medal-line"></i>
                  </div>
                  <div className="">
                    <h5 className="text-xl font-semibold mb-0">Cabang Olahraga</h5>
                    <p className="text-slate-400 mt-2">Lebih dari 40+ Cabang Olahraga <br /> akan dipertandingkan.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      {/* End Section */}

      <VenueShowcase />
    </>
  );
}
