"use client";

import { Trophy, Calendar, MapPin, ChevronRight, Activity } from "lucide-react";
import { CountdownTimer } from "@/components/CountdownTimer";
import Image from "next/image";
import { motion, Variants } from "framer-motion";

export default function Home() {
  // PORPROV XV starts on November 7, 2026
  const targetDate = "2026-11-07T00:00:00+07:00";

  const fadeUp: Variants = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } }
  };

  const staggerContainer: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.2 }
    }
  };

  return (
    <div className="flex flex-col gap-12 pb-16 bg-slate-950 min-h-screen text-slate-100">
      {/* Hero Section */}
      <section className="relative w-full overflow-hidden min-h-[600px] flex items-center">
        {/* Abstract Background Patterns & Gradient */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-black z-0"></div>
        <div className="absolute inset-0 z-0 opacity-20">
          <div className="absolute top-10 left-10 w-96 h-96 rounded-full bg-primary-600 blur-[100px] mix-blend-screen"></div>
          <div className="absolute bottom-10 right-10 w-[30rem] h-[30rem] rounded-full bg-accent-500 blur-[120px] mix-blend-screen"></div>
        </div>
        
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full py-16 md:py-24 flex flex-col md:flex-row items-center gap-12">
          
          {/* Text Content */}
          <motion.div 
            className="flex-1 text-center md:text-left z-20"
            initial="hidden" animate="visible" variants={staggerContainer}
          >
            <motion.div variants={fadeUp} className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-slate-800/80 border border-slate-700 shadow-[0_0_15px_rgba(59,130,246,0.3)] text-blue-200 text-sm font-semibold mb-6 backdrop-blur-xl">
              <span className="w-2 h-2 rounded-full bg-accent-500 animate-pulse-subtle shadow-[0_0_8px_rgba(245,158,11,1)]"></span>
              Menuju Pembukaan PORPROV XV
            </motion.div>
            
            <motion.h1 variants={fadeUp} className="text-5xl md:text-7xl font-black text-white tracking-tighter leading-[1.1] mb-6 drop-shadow-2xl">
              Semangat Juara di <br className="hidden md:block" />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-accent-500 via-yellow-400 to-amber-300 filter drop-shadow-lg">
                Kota Depok
              </span>
            </motion.h1>
            
            <motion.p variants={fadeUp} className="text-lg md:text-xl text-slate-300 mb-8 max-w-2xl mx-auto md:mx-0 font-medium">
              Saksikan ribuan atlet terbaik Jawa Barat memperebutkan kejayaan dalam 64 cabang olahraga bergengsi dengan fasilitas kelas dunia.
            </motion.p>
            
            <motion.div variants={fadeUp} className="flex flex-col sm:flex-row gap-4 justify-center md:justify-start">
              <button className="px-8 py-4 rounded-xl bg-gradient-to-r from-primary-600 to-primary-500 hover:from-primary-500 hover:to-primary-400 text-white font-bold transition-all shadow-[0_0_20px_rgba(59,130,246,0.5)] hover:shadow-[0_0_30px_rgba(59,130,246,0.7)] hover:-translate-y-1 flex items-center justify-center gap-2">
                Lihat Jadwal <Calendar className="w-5 h-5" />
              </button>
              <button className="px-8 py-4 rounded-xl bg-slate-800/50 hover:bg-slate-700/60 text-white border border-slate-600 font-bold transition-all backdrop-blur-xl hover:border-slate-400 flex items-center justify-center gap-2">
                Jelajahi Venue <MapPin className="w-5 h-5" />
              </button>
            </motion.div>
          </motion.div>
          
          {/* Mascot & Countdown */}
          <motion.div 
            className="w-full md:w-5/12 flex flex-col items-center relative z-20"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          >
            {/* Mascot Image Extracted from PDF */}
            <div className="relative w-64 h-64 md:w-80 md:h-80 mb-6 group">
              <div className="absolute inset-0 bg-accent-500/20 rounded-full blur-3xl group-hover:bg-accent-500/30 transition-all duration-500"></div>
              <Image 
                src="/assets/extracted/page5_img1.png" 
                alt="Maskot PORPROV XV Toca dan Toci" 
                fill
                className="object-contain drop-shadow-2xl z-10 hover:scale-105 transition-transform duration-500"
                priority
              />
            </div>
            
            <div className="w-full p-6 md:p-8 bg-slate-900/60 border border-slate-700/50 text-white rounded-3xl backdrop-blur-2xl shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary-500 to-accent-500"></div>
              <h3 className="text-center font-black text-slate-100 mb-2 uppercase tracking-widest text-sm">Hitung Mundur</h3>
              <p className="text-center text-slate-400 text-xs mb-6 font-medium">Waktu Indonesia Barat (GMT+7)</p>
              <CountdownTimer targetDate={targetDate} />
            </div>
          </motion.div>
        </div>
      </section>

      {/* Live Now Section (Flashscore Inspired, Dark & Premium) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full mt-4">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-slate-900 border border-slate-800 shadow-inner flex items-center justify-center relative overflow-hidden">
              <div className="absolute inset-0 bg-red-500/20 blur-md"></div>
              <Activity className="w-6 h-6 text-red-500 animate-pulse relative z-10" />
            </div>
            <h2 className="text-3xl font-black text-white">Sedang Berlangsung</h2>
          </div>
          <a href="/livescore" className="text-primary-400 font-bold hover:text-primary-300 flex items-center text-sm uppercase tracking-wider group transition-colors">
            Lihat Semua <ChevronRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
          </a>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <motion.div 
              key={i}
              whileHover={{ y: -5, scale: 1.02 }}
              className="group relative bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden shadow-xl"
            >
              <div className="absolute inset-0 bg-gradient-to-b from-slate-800/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <div className="p-5 relative z-10">
                <div className="flex justify-between items-center mb-5 text-xs font-bold text-slate-400">
                  <span className="uppercase tracking-widest text-primary-400">Bulutangkis - Final</span>
                  <span className="text-red-500 flex items-center gap-1.5 bg-red-500/10 px-2 py-1 rounded-md"><span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse"></span> Set 2</span>
                </div>
                <div className="flex flex-col gap-4">
                  <div className="flex justify-between items-center bg-slate-950/50 p-3 rounded-xl border border-slate-800/50">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 shadow-inner"></div>
                      <span className="font-bold text-white text-base">Kota Depok</span>
                    </div>
                    <span className="text-2xl font-black text-accent-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.5)]">21</span>
                  </div>
                  <div className="flex justify-between items-center p-3 rounded-xl">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 shadow-inner"></div>
                      <span className="font-bold text-slate-300 text-base">Kota Bandung</span>
                    </div>
                    <span className="text-2xl font-bold text-slate-500">18</span>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Top Standings Mini */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full mt-8">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center relative overflow-hidden">
               <div className="absolute inset-0 bg-amber-500/20 blur-md"></div>
              <Trophy className="w-6 h-6 text-amber-400 relative z-10" />
            </div>
            <h2 className="text-3xl font-black text-white">Klasemen Medali Sementara</h2>
          </div>
          <a href="/medali" className="text-primary-400 font-bold hover:text-primary-300 flex items-center text-sm uppercase tracking-wider group transition-colors">
            Klasemen Lengkap <ChevronRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
          </a>
        </div>
        
        <div className="bg-slate-900/80 backdrop-blur-xl overflow-hidden border border-slate-800 rounded-3xl shadow-2xl relative">
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary-600/10 blur-3xl rounded-full"></div>
          <div className="overflow-x-auto relative z-10">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-950/80 text-xs uppercase tracking-widest text-slate-400 border-b border-slate-800">
                  <th className="p-5 font-bold w-20 text-center">Pos</th>
                  <th className="p-5 font-bold">Kontingen</th>
                  <th className="p-5 font-bold text-center text-yellow-400"><div className="w-6 h-6 rounded-full bg-yellow-400/20 mx-auto flex items-center justify-center">E</div></th>
                  <th className="p-5 font-bold text-center text-slate-300"><div className="w-6 h-6 rounded-full bg-slate-300/20 mx-auto flex items-center justify-center">P</div></th>
                  <th className="p-5 font-bold text-center text-amber-600"><div className="w-6 h-6 rounded-full bg-amber-600/20 mx-auto flex items-center justify-center">P</div></th>
                  <th className="p-5 font-black text-center text-white">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {[
                  { rank: 1, name: "Kota Depok", gold: 45, silver: 30, bronze: 25 },
                  { rank: 2, name: "Kota Bandung", gold: 42, silver: 35, bronze: 30 },
                  { rank: 3, name: "Kab. Bogor", gold: 38, silver: 20, bronze: 15 },
                ].map((item) => (
                  <tr key={item.rank} className="hover:bg-slate-800/50 transition-colors group">
                    <td className="p-5 text-center">
                      <span className={`inline-flex items-center justify-center w-8 h-8 rounded-lg font-black text-sm ${item.rank === 1 ? 'bg-yellow-400/20 text-yellow-400' : 'text-slate-400'}`}>
                        {item.rank}
                      </span>
                    </td>
                    <td className="p-5 font-bold text-white flex items-center gap-4 text-lg">
                      <div className="w-10 h-10 rounded-full bg-slate-800 border border-slate-700 shadow-inner group-hover:scale-110 transition-transform"></div>
                      {item.name}
                    </td>
                    <td className="p-5 text-center font-black text-yellow-400 text-xl">{item.gold}</td>
                    <td className="p-5 text-center font-bold text-slate-300 text-xl">{item.silver}</td>
                    <td className="p-5 text-center font-bold text-amber-600 text-xl">{item.bronze}</td>
                    <td className="p-5 text-center font-black text-primary-400 text-2xl drop-shadow-[0_0_8px_rgba(96,165,250,0.5)]">
                      {item.gold + item.silver + item.bronze}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </div>
  );
}
