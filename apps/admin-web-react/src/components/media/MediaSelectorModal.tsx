import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useAuth } from 'react-oidc-context';
import { 
  Image as ImageIcon, 
  Upload,
  X
} from 'lucide-react';

interface MediaAsset {
  id: string;
  file_name: string;
  file_url: string;
  mime_type: string;
  file_size: number;
}

interface MediaSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (url: string) => void;
}

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:18002/api/v1';

export default function MediaSelectorModal({ isOpen, onClose, onSelect }: MediaSelectorModalProps) {
  const auth = useAuth();
  const [media, setMedia] = useState<MediaAsset[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      fetchMedia();
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

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
      alert('Hanya file gambar yang diperbolehkan.');
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

  const getFullUrl = (url: string) => {
    if (url.startsWith('/uploads')) {
      const urlObj = new URL(API_BASE_URL);
      return `${urlObj.protocol}//${urlObj.host}${url}`;
    }
    return url;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      ></div>

      {/* Modal */}
      <div className="relative bg-white dark:bg-slate-800 rounded-2xl shadow-xl w-full max-w-4xl max-h-[85vh] flex flex-col overflow-hidden animate-fade-in-up">
        {/* Header */}
        <div className="flex justify-between items-center px-6 py-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80">
          <h2 className="text-xl font-bold text-slate-800 dark:text-white">Pilih Media</h2>
          <div className="flex items-center gap-4">
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
              className="inline-flex items-center gap-2 px-3 py-1.5 bg-indigo-100 hover:bg-indigo-200 text-indigo-700 dark:bg-indigo-500/20 dark:hover:bg-indigo-500/30 dark:text-indigo-400 font-medium rounded-lg transition-colors text-sm"
            >
              {isUploading ? (
                <span className="w-4 h-4 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></span>
              ) : (
                <Upload className="w-4 h-4" />
              )}
              Unggah Baru
            </button>
            <button 
              onClick={onClose}
              className="p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg text-slate-500 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Content / Grid */}
        <div className="p-6 overflow-y-auto flex-1">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {media.map((item) => (
              <div 
                key={item.id} 
                onClick={() => {
                  onSelect(getFullUrl(item.file_url));
                  onClose();
                }}
                className="group relative bg-slate-100 dark:bg-slate-900 rounded-xl overflow-hidden shadow-sm hover:ring-2 hover:ring-indigo-500 cursor-pointer transition-all border border-slate-200 dark:border-slate-700"
              >
                <div className="aspect-square relative flex items-center justify-center">
                  {item.mime_type?.startsWith('image/') ? (
                    <img 
                      src={getFullUrl(item.file_url)} 
                      alt={item.file_name} 
                      className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <ImageIcon className="w-10 h-10 text-slate-400" />
                  )}
                  {/* Select overlay */}
                  <div className="absolute inset-0 bg-indigo-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <span className="bg-indigo-600 text-white px-3 py-1 rounded-full text-sm font-medium shadow-sm">
                      Pilih
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {media.length === 0 && (
            <div className="py-12 text-center text-slate-500 dark:text-slate-400">
              <ImageIcon className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>Belum ada gambar. Silakan unggah gambar baru.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
