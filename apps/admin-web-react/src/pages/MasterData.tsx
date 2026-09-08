import { useState } from 'react';
import { ArchiveRestore, CalendarDays, MapPinned, Medal, Network, UsersRound } from 'lucide-react';
import CabangOlahraga from '../components/master-data/CabangOlahraga';
import VenueDepok from '../components/master-data/VenueDepok';
import JadwalPertandingan from '../components/master-data/JadwalPertandingan';
import Kontingen from '../components/master-data/Kontingen';
import NomorTanding from '../components/master-data/NomorTanding';
import RecycleBin from '../components/master-data/RecycleBin';
import { AdminPageHeader } from '../components/cuba/AdminPrimitives';
import { AdminWorkspaceTabs } from '../components/cuba/AdminWorkspaceTabs';
import { useAuthorization } from '../contexts/authorization';

const masterTabs = [
  { id: 'cabor', label: 'Cabang Olahraga', icon: <Network className="size-4" aria-hidden="true" /> },
  { id: 'nomor-tanding', label: 'Nomor Pertandingan', icon: <Medal className="size-4" aria-hidden="true" /> },
  { id: 'kontingen', label: 'Data Kontingen', icon: <UsersRound className="size-4" aria-hidden="true" /> },
  { id: 'venue', label: 'Lokasi Pertandingan', icon: <MapPinned className="size-4" aria-hidden="true" /> },
  { id: 'jadwal', label: 'Jadwal Pertandingan', icon: <CalendarDays className="size-4" aria-hidden="true" /> },
  { id: 'recycle-bin', label: 'Arsip Terhapus', icon: <ArchiveRestore className="size-4" aria-hidden="true" /> },
] as const;

type MasterTabId = (typeof masterTabs)[number]['id'];

export default function MasterData() {
  const authorization = useAuthorization();
  const visibleTabs = authorization.hasPermission('master_data.restore')
    ? masterTabs
    : masterTabs.filter((tab) => tab.id !== 'recycle-bin');
  const [activeTab, setActiveTab] = useState<MasterTabId>(() => {
    const requestedTab = new URLSearchParams(window.location.search).get('tab');
    return requestedTab !== 'recycle-bin' && masterTabs.some((tab) => tab.id === requestedTab) ? requestedTab as MasterTabId : 'cabor';
  });

  const changeTab = (tab: MasterTabId) => {
    setActiveTab(tab);
    if (!window.location.search) return;
    window.history.replaceState(null, '', window.location.pathname);
  };

  return (
    <div className="flex flex-col gap-6">
      <AdminPageHeader
        eyebrow="Sumber Data PORPROV"
        title="Data Utama"
        description="Kelola cabang olahraga, nomor pertandingan, kontingen, lokasi, jadwal, dan arsip sesuai urutan kerja operator."
      />
      <AdminWorkspaceTabs activeTab={activeTab} ariaLabel="Kategori Data Utama" onChange={changeTab} tabs={[...visibleTabs]} />

      <div id={`panel-${activeTab}`} role="tabpanel" aria-labelledby={`tab-${activeTab}`} tabIndex={0}>
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
