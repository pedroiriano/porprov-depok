import { useState } from 'react';
import CabangOlahraga from '../components/master-data/CabangOlahraga';
import VenueDepok from '../components/master-data/VenueDepok';
import JadwalPertandingan from '../components/master-data/JadwalPertandingan';
import Kontingen from '../components/master-data/Kontingen';
import NomorTanding from '../components/master-data/NomorTanding';
import RecycleBin from '../components/master-data/RecycleBin';

export default function MasterData() {
  const [activeTab, setActiveTab] = useState('cabor');

  return (
    <div className="flex flex-col gap-6">
      <div className="flex gap-2 overflow-x-auto border-b border-slate-200" role="tablist" aria-label="Kategori Master Data">
        <button
          onClick={() => setActiveTab('nomor-tanding')}
          className={`px-4 py-2 font-medium text-sm transition-colors ${
            activeTab === 'nomor-tanding'
              ? 'border-b-2 border-indigo-600 text-indigo-600'
              : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          Nomor Pertandingan
        </button>
        <button
          onClick={() => setActiveTab('cabor')}
          className={`px-4 py-2 font-medium text-sm transition-colors ${
            activeTab === 'cabor'
              ? 'border-b-2 border-indigo-600 text-indigo-600'
              : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          Cabang Olahraga
        </button>
        <button
          onClick={() => setActiveTab('venue')}
          className={`px-4 py-2 font-medium text-sm transition-colors ${
            activeTab === 'venue'
              ? 'border-b-2 border-indigo-600 text-indigo-600'
              : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          Venue
        </button>
        <button
          onClick={() => setActiveTab('jadwal')}
          className={`px-4 py-2 font-medium text-sm transition-colors ${
            activeTab === 'jadwal'
              ? 'border-b-2 border-indigo-600 text-indigo-600'
              : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          Jadwal Pertandingan
        </button>
        <button
          onClick={() => setActiveTab('kontingen')}
          className={`px-4 py-2 font-medium text-sm transition-colors ${
            activeTab === 'kontingen'
              ? 'border-b-2 border-indigo-600 text-indigo-600'
              : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          Data Kontingen
        </button>
        <button
          onClick={() => setActiveTab('recycle-bin')}
          className={`px-4 py-2 font-medium text-sm transition-colors ${
            activeTab === 'recycle-bin'
              ? 'border-b-2 border-indigo-600 text-indigo-600'
              : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          Recycle Bin
        </button>
      </div>

      <div className="mt-4">
        {activeTab === 'cabor' && <CabangOlahraga />}
        {activeTab === 'venue' && <VenueDepok />}
        {activeTab === 'jadwal' && <JadwalPertandingan />}
        {activeTab === 'kontingen' && <Kontingen />}
        {activeTab === 'nomor-tanding' && <NomorTanding />}
        {activeTab === 'recycle-bin' && <RecycleBin />}
      </div>
    </div>
  );
}
