import { useState } from 'react';
import CabangOlahraga from '../components/master-data/CabangOlahraga';
import VenueDepok from '../components/master-data/VenueDepok';
import JadwalPertandingan from '../components/master-data/JadwalPertandingan';

export default function MasterData() {
  const [activeTab, setActiveTab] = useState('cabor');

  return (
    <div className="flex flex-col gap-6">
      <div className="flex gap-4 border-b border-slate-200">
        <button
          onClick={() => setActiveTab('cabor')}
          className={`px-4 py-2 font-medium text-sm transition-colors ${
            activeTab === 'cabor' 
              ? 'border-b-2 border-primary-600 text-primary-600' 
              : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          Cabang Olahraga
        </button>
        <button
          onClick={() => setActiveTab('venue')}
          className={`px-4 py-2 font-medium text-sm transition-colors ${
            activeTab === 'venue' 
              ? 'border-b-2 border-primary-600 text-primary-600' 
              : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          Venue (Kota Depok)
        </button>
        <button
          onClick={() => setActiveTab('jadwal')}
          className={`px-4 py-2 font-medium text-sm transition-colors ${
            activeTab === 'jadwal' 
              ? 'border-b-2 border-primary-600 text-primary-600' 
              : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          Jadwal Pertandingan
        </button>
      </div>

      <div className="mt-4">
        {activeTab === 'cabor' && <CabangOlahraga />}
        {activeTab === 'venue' && <VenueDepok />}
        {activeTab === 'jadwal' && <JadwalPertandingan />}
      </div>
    </div>
  );
}
