import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useAuth } from 'react-oidc-context';
import { 
  Upload, 
  Trash2, 
  Copy, 
  Image as ImageIcon,
  X
} from 'lucide-react';

interface MediaAsset {
  id: string;
  file_name: string;
  file_url: string;
  mime_type: string;
  file_size: number;
  created_at: string;
}

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:18002/api/v1';

export default function MediaLibrary() {
  const auth = useAuth();
  const [media, setMedia] = useState<MediaAsset[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchMedia();
  }, []);

  const getAuthConfig = () => {
    return {
      headers: {
        Authorization: `Bearer ${auth.user?.access_token}`
      }
    }
  }

  const fetchMedia = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/media`, getAuthConfig());
      setMedia(res.data || []);
    } catch (error) {
      console.error('Failed to fetch media:', error);
    }
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Hanya file gambar yang diperbolehkan (JPG, PNG, WebP).');
      return;
    }

    const formData = new FormData();
    formData.append('file', file);

    setIsUploading(true);
    try {
      await axios.post(`${API_BASE_URL}/media/upload`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${auth.user?.access_token}`
        }
      });
      fetchMedia();
    } catch (error) {
      console.error('Failed to upload media:', error);
      alert('Gagal mengunggah gambar.');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Apakah Anda yakin ingin menghapus gambar ini?')) return;
    try {
      await axios.delete(`${API_BASE_URL}/media/${id}`, getAuthConfig());
      fetchMedia();
    } catch (error) {
      console.error('Failed to delete media:', error);
      alert('Gagal menghapus gambar.');
    }
  };

  const copyToClipboard = (url: string) => {
    // Determine the full URL (if the API returns a relative URL, prepend the host)
    let fullUrl = url;
    if (url.startsWith('/uploads')) {
      // Assuming API_BASE_URL is something like http://localhost:18002/api/v1
      // We extract the host from API_BASE_URL
      const urlObj = new URL(API_BASE_URL);
      fullUrl = `${urlObj.protocol}//${urlObj.host}${url}`;
    }
    
    navigator.clipboard.writeText(fullUrl);
    alert('URL berhasil disalin ke clipboard!');
  };

  const getFullUrl = (url: string) => {
    if (url.startsWith('/uploads')) {
      const urlObj = new URL(API_BASE_URL);
      return `${urlObj.protocol}//${urlObj.host}${url}`;
    }
    return url;
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Media Library</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-2">Kelola semua gambar dan aset visual di satu tempat.</p>
        </div>
        <div>
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleUpload} 
            accept="image/*" 
            className="hidden" 
          />
          <button 
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg shadow-sm transition-colors disabled:opacity-50"
          >
            {isUploading ? (
              <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
            ) : (
              <Upload className="w-5 h-5" />
            )}
            Unggah Gambar
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6">
        {media.map((item) => (
          <div key={item.id} className="group relative bg-white dark:bg-slate-800 rounded-xl overflow-hidden shadow-sm hover:shadow-md border border-slate-200 dark:border-slate-700 transition-all">
            <div className="aspect-square bg-slate-100 dark:bg-slate-900 relative overflow-hidden flex items-center justify-center">
              {item.mime_type?.startsWith('image/') ? (
                <img 
                  src={getFullUrl(item.file_url)} 
                  alt={item.file_name} 
                  className="object-cover w-full h-full"
                />
              ) : (
                <ImageIcon className="w-12 h-12 text-slate-400" />
              )}
              
              {/* Hover Actions overlay */}
              <div className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                <button 
                  onClick={() => copyToClipboard(item.file_url)}
                  className="p-2 bg-white/10 hover:bg-white/20 rounded-full text-white backdrop-blur-sm transition-colors"
                  title="Copy URL"
                >
                  <Copy className="w-5 h-5" />
                </button>
                <button 
                  onClick={() => handleDelete(item.id)}
                  className="p-2 bg-red-500/80 hover:bg-red-500 rounded-full text-white backdrop-blur-sm transition-colors"
                  title="Hapus"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            </div>
            <div className="p-3">
              <p className="text-sm font-medium text-slate-900 dark:text-white truncate" title={item.file_name}>
                {item.file_name}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                {(item.file_size / 1024).toFixed(1)} KB
              </p>
            </div>
          </div>
        ))}
        {media.length === 0 && (
          <div className="col-span-full py-12 text-center text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-700">
            <ImageIcon className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>Belum ada gambar yang diunggah.</p>
          </div>
        )}
      </div>
    </div>
  );
}
