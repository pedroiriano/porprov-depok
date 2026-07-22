import { useState } from 'react';
import CabangOlahraga from '../components/master-data/CabangOlahraga';
import VenueDepok from '../components/master-data/VenueDepok';
import JadwalPertandingan from '../components/master-data/JadwalPertandingan';
import Kontingen from '../components/master-data/Kontingen';
import NomorTanding from '../components/master-data/NomorTanding';
import RecycleBin from '../components/master-data/RecycleBin';

const masterTabs = [
  { id: 'nomor-tanding', label: 'Nomor Pertandingan' },
  { id: 'cabor', label: 'Cabang Olahraga' },
  { id: 'venue', label: 'Venue' },
  { id: 'jadwal', label: 'Jadwal Pertandingan' },
  { id: 'kontingen', label: 'Data Kontingen' },
  { id: 'recycle-bin', label: 'Recycle Bin' },
] as const;

type MasterTabId = (typeof masterTabs)[number]['id'];

export default function MasterData() {
  const [activeTab, setActiveTab] = useState<MasterTabId>('cabor');

  return (
    <div className="flex flex-col gap-6">
      <header>
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-indigo-600 dark:text-indigo-400">Sumber Data PORPROV</p>
        <h1 className="mt-2 text-2xl font-black text-slate-900 dark:text-white">Master Data</h1>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">Kelola nomor pertandingan, cabang olahraga, venue, jadwal, kontingen, dan data yang diarsipkan.</p>
      </header>
      <div className="flex gap-2 overflow-x-auto border-b border-slate-200 dark:border-slate-700" role="tablist" aria-label="Kategori Master Data">
        {masterTabs.map((tab) => (
          <button
            key={tab.id}
            id={`tab-${tab.id}`}
            type="button"
            role="tab"
            aria-selected={activeTab === tab.id}
            aria-controls={`panel-${tab.id}`}
            onClick={() => setActiveTab(tab.id)}
            className={`min-h-11 shrink-0 px-4 py-2 text-sm font-bold transition-colors ${
              activeTab === tab.id
                ? 'border-b-2 border-indigo-600 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400'
                : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-100'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div id={`panel-${activeTab}`} className="mt-4" role="tabpanel" aria-labelledby={`tab-${activeTab}`} tabIndex={0}>
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
