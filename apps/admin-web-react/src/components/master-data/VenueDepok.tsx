import { useState, useEffect, useRef } from 'react';
import { Search, Plus, Edit, Trash, Loader2, X, Check, ChevronDown } from 'lucide-react';
import axios from 'axios';
import { useAuth } from 'react-oidc-context';

const API_BASE_URL = 'http://localhost:8080/api/v1';

export default function VenueDepok() {
  const [venues, setVenues] = useState<any[]>([]);
  const [cabors, setCabors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const [formData, setFormData] = useState({ 
    name: '', image_url: '', address: '', 
    latitude: -6.4025, longitude: 106.7942, map_route_url: '', 
    capacity: 0, facilities: '', readiness_status: 'Persiapan', contact_person: '',
    cabor_ids: [] as string[], city_guide_ids: [] as string[]
  });
  
  const [submitting, setSubmitting] = useState(false);
  const auth = useAuth();

  // Multi-select Dropdown State
  const [isCaborDropdownOpen, setIsCaborDropdownOpen] = useState(false);
  const [caborSearch, setCaborSearch] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchVenues();
    fetchCabors();
  }, []);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsCaborDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const getAuthConfig = () => {
    return {
      headers: {
        Authorization: `Bearer ${auth.user?.access_token}`
      }
    }
  }

  const fetchVenues = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API_BASE_URL}/venues`, getAuthConfig());
      setVenues(res.data || []);
    } catch (error) {
      console.error('Failed to fetch venues:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCabors = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/master-data/cabors`, getAuthConfig());
      setCabors(res.data || []);
    } catch (error) {
      console.error('Failed to fetch cabors:', error);
    }
  };

  const toggleCaborSelection = (id: string) => {
    setFormData(prev => {
      const isSelected = prev.cabor_ids.includes(id);
      if (isSelected) {
        return { ...prev, cabor_ids: prev.cabor_ids.filter(c => c !== id) };
      } else {
        return { ...prev, cabor_ids: [...prev.cabor_ids, id] };
      }
    });
  };

  const removeCabor = (id: string) => {
    setFormData(prev => ({ ...prev, cabor_ids: prev.cabor_ids.filter(c => c !== id) }));
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      const payload = {
        ...formData,
        capacity: parseInt(formData.capacity.toString(), 10) || 0,
        latitude: parseFloat(formData.latitude.toString()) || 0,
        longitude: parseFloat(formData.longitude.toString()) || 0,
      };
      await axios.post(`${API_BASE_URL}/venues`, payload, getAuthConfig());
      setIsModalOpen(false);
      resetForm();
      fetchVenues();
    } catch (error) {
      console.error('Failed to create venue:', error);
      alert('Gagal menyimpan data venue.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Yakin ingin menghapus venue ini?')) return;
    try {
      await axios.delete(`${API_BASE_URL}/venues/${id}`, getAuthConfig());
      fetchVenues();
    } catch (error) {
      console.error('Failed to delete venue:', error);
      alert('Gagal menghapus data.');
    }
  };

  const resetForm = () => {
    setFormData({ 
      name: '', image_url: '', address: '', 
      latitude: -6.4025, longitude: 106.7942, map_route_url: '', 
      capacity: 0, facilities: '', readiness_status: 'Persiapan', contact_person: '',
      cabor_ids: [], city_guide_ids: [] 
    });
    setCaborSearch('');
    setIsCaborDropdownOpen(false);
  };

  const filteredCabors = cabors.filter(c => c.name.toLowerCase().includes(caborSearch.toLowerCase()));

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">Master Data: Venue Depok</h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Kelola data seluruh lokasi pertandingan di Kota Depok.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg font-medium shadow-sm transition-colors"
        >
          <Plus className="w-5 h-5" /> Tambah Venue
        </button>
      </div>

      <div className="card">
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex flex-col md:flex-row gap-4 justify-between bg-slate-50 dark:bg-slate-800/50 rounded-t-xl">
          <div className="relative w-full md:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="Cari nama venue..." 
              className="form-input pl-9"
            />
          </div>
        </div>

        <div className="overflow-x-auto min-h-[300px]">
          {loading ? (
            <div className="flex justify-center items-center h-48">
              <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
            </div>
          ) : venues.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 text-slate-500">
              <p>Belum ada data Venue.</p>
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800">
                  <th className="p-4 font-semibold text-sm text-slate-600 dark:text-slate-300">ID (UUID)</th>
                  <th className="p-4 font-semibold text-sm text-slate-600 dark:text-slate-300">Nama Venue</th>
                  <th className="p-4 font-semibold text-sm text-slate-600 dark:text-slate-300">Alamat Lengkap</th>
                  <th className="p-4 font-semibold text-sm text-slate-600 dark:text-slate-300">Kapasitas</th>
                  <th className="p-4 font-semibold text-sm text-slate-600 dark:text-slate-300 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {venues.map((item, i) => (
                  <tr key={item.id || i} className="border-b border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="p-4 font-mono text-xs text-text-muted">
                      {(item.id || '').substring(0, 8)}...
                    </td>
                    <td className="p-4 font-semibold text-slate-900 dark:text-white">
                      {item.name}
                    </td>
                    <td className="p-4 text-sm text-slate-600 dark:text-slate-400 truncate max-w-xs">
                      {item.address}
                    </td>
                    <td className="p-4 text-sm text-slate-600 dark:text-slate-400">
                      {item.capacity}
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button className="p-1.5 text-slate-400 hover:text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-md transition-colors">
                          <Edit className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => handleDelete(item.id)}
                          className="p-1.5 text-slate-400 hover:text-danger-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-colors"
                        >
                          <Trash className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {isModalOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => { setIsModalOpen(false); resetForm(); }}
        >
          <div 
            className="bg-white dark:bg-slate-900 rounded-xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-800/50">
              <h3 className="font-bold text-lg text-slate-900 dark:text-white">Tambah Venue Pertandingan</h3>
              <button onClick={() => { setIsModalOpen(false); resetForm(); }} className="text-slate-400 hover:text-slate-700 dark:hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto custom-scrollbar">
              <form id="venue-form" onSubmit={handleCreate} className="flex flex-col gap-5">
                {/* 1. Informasi Dasar */}
                <div className="space-y-4">
                  <h4 className="text-sm font-semibold text-primary-600 dark:text-primary-400 uppercase tracking-wider">1. Informasi Dasar</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Nama Venue</label>
                      <input 
                        type="text" required value={formData.name}
                        onChange={(e) => setFormData({...formData, name: e.target.value})}
                        className="form-input" placeholder="Misal: GOR Kartika Kostrad"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Status Kesiapan</label>
                      <select 
                        value={formData.readiness_status}
                        onChange={(e) => setFormData({...formData, readiness_status: e.target.value})}
                        className="form-input"
                      >
                        <option value="Persiapan">Persiapan</option>
                        <option value="Siap">Siap</option>
                        <option value="Sedang Digunakan">Sedang Digunakan</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Kapasitas (Penonton)</label>
                      <input 
                        type="number" required value={formData.capacity}
                        onChange={(e) => setFormData({...formData, capacity: parseInt(e.target.value)})}
                        className="form-input" placeholder="0"
                      />
                    </div>
                  </div>
                </div>

                {/* 2. Cabang Olahraga */}
                <div className="space-y-4 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <h4 className="text-sm font-semibold text-primary-600 dark:text-primary-400 uppercase tracking-wider">2. Cabang Olahraga (Cabor)</h4>
                  
                  <div className="relative" ref={dropdownRef}>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Pilih Cabor yang Dipertandingkan</label>
                    
                    {/* Selected Badges */}
                    <div 
                      className="min-h-[42px] w-full p-1.5 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-lg flex flex-wrap gap-2 cursor-text focus-within:ring-2 focus-within:ring-primary-500 items-center"
                      onClick={() => setIsCaborDropdownOpen(true)}
                    >
                      {formData.cabor_ids.map(id => {
                        const cabor = cabors.find(c => c.id === id);
                        return cabor ? (
                          <span key={id} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-sm bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 border border-primary-200 dark:border-primary-800">
                            {cabor.name}
                            <button type="button" onClick={(e) => { e.stopPropagation(); removeCabor(id); }} className="hover:bg-primary-200 dark:hover:bg-primary-800 rounded-full p-0.5">
                              <X className="w-3 h-3" />
                            </button>
                          </span>
                        ) : null;
                      })}
                      
                      <div className="flex-1 min-w-[150px] flex items-center">
                        <input
                          type="text"
                          value={caborSearch}
                          onChange={(e) => { setCaborSearch(e.target.value); setIsCaborDropdownOpen(true); }}
                          onFocus={() => setIsCaborDropdownOpen(true)}
                          className="w-full bg-transparent outline-none text-sm text-slate-900 dark:text-white px-2 placeholder:text-slate-400"
                          placeholder={formData.cabor_ids.length === 0 ? "Ketik untuk mencari Cabor..." : ""}
                        />
                        <ChevronDown className="w-4 h-4 text-slate-400 mr-2" />
                      </div>
                    </div>

                    {/* Dropdown Menu */}
                    {isCaborDropdownOpen && (
                      <div className="absolute z-10 w-full mt-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                        {filteredCabors.length === 0 ? (
                          <div className="p-3 text-sm text-slate-500 text-center">Cabor tidak ditemukan</div>
                        ) : (
                          <ul className="py-1">
                            {filteredCabors.map(cabor => {
                              const isSelected = formData.cabor_ids.includes(cabor.id);
                              return (
                                <li 
                                  key={cabor.id}
                                  onClick={() => toggleCaborSelection(cabor.id)}
                                  className="px-4 py-2 hover:bg-slate-50 dark:hover:bg-slate-700/50 cursor-pointer flex items-center gap-3"
                                >
                                  <div className={`w-5 h-5 rounded border flex items-center justify-center ${isSelected ? 'bg-primary-600 border-primary-600 text-white' : 'border-slate-300 dark:border-slate-600'}`}>
                                    {isSelected && <Check className="w-3.5 h-3.5" />}
                                  </div>
                                  <div>
                                    <p className="text-sm font-medium text-slate-900 dark:text-white">{cabor.name}</p>
                                    <p className="text-xs text-slate-500">{cabor.kategori?.String || 'Tidak ada kategori'}</p>
                                  </div>
                                </li>
                              );
                            })}
                          </ul>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* 3. Lokasi & Navigasi */}
                <div className="space-y-4 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <h4 className="text-sm font-semibold text-primary-600 dark:text-primary-400 uppercase tracking-wider">3. Lokasi & Navigasi</h4>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Alamat Lengkap</label>
                    <textarea 
                      rows={2} value={formData.address}
                      onChange={(e) => setFormData({...formData, address: e.target.value})}
                      className="form-input"
                    ></textarea>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Latitude (Kordinat Map)</label>
                      <input 
                        type="number" step="any" value={formData.latitude}
                        onChange={(e) => setFormData({...formData, latitude: parseFloat(e.target.value)})}
                        className="form-input" placeholder="-6.4025"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Longitude (Kordinat Map)</label>
                      <input 
                        type="number" step="any" value={formData.longitude}
                        onChange={(e) => setFormData({...formData, longitude: parseFloat(e.target.value)})}
                        className="form-input" placeholder="106.7942"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">URL Google Maps (Rute)</label>
                      <input 
                        type="text" value={formData.map_route_url}
                        onChange={(e) => setFormData({...formData, map_route_url: e.target.value})}
                        className="form-input" placeholder="https://goo.gl/maps/..."
                      />
                    </div>
                  </div>
                </div>

                {/* 4. Media & Info Lainnya */}
                <div className="space-y-4 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <h4 className="text-sm font-semibold text-primary-600 dark:text-primary-400 uppercase tracking-wider">4. Media & Info Lainnya</h4>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">URL Gambar (Foto)</label>
                    <input 
                      type="text" value={formData.image_url}
                      onChange={(e) => setFormData({...formData, image_url: e.target.value})}
                      className="form-input"
                      placeholder="/assets/images/venue/..."
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Contact Person</label>
                      <input 
                        type="text" value={formData.contact_person}
                        onChange={(e) => setFormData({...formData, contact_person: e.target.value})}
                        className="form-input" placeholder="Nama / No HP"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Fasilitas Utama</label>
                      <input 
                        type="text" value={formData.facilities}
                        onChange={(e) => setFormData({...formData, facilities: e.target.value})}
                        className="form-input"
                        placeholder="Toilet, Parkir, Ruang Medis"
                      />
                    </div>
                  </div>
                </div>
              </form>
            </div>
            
            <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-800 flex gap-3 justify-end bg-slate-50 dark:bg-slate-800/50">
              <button 
                type="button" onClick={() => { setIsModalOpen(false); resetForm(); }}
                className="px-4 py-2 font-medium text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-lg transition-colors"
              >Batal</button>
              <button 
                type="submit" form="venue-form" disabled={submitting}
                className="px-4 py-2 font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-lg transition-colors flex items-center gap-2"
              >
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                Simpan Venue
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
