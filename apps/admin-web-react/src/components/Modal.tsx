import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | '5xl' | '6xl' | '7xl';
}

export default function Modal({ isOpen, onClose, title, children, maxWidth = 'md' }: ModalProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  // ACCESSIBILITY: Tutup modal saat tekan Escape
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !mounted) return null;

  const maxWidthClass = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
    '3xl': 'max-w-3xl',
    '4xl': 'max-w-4xl',
    '5xl': 'max-w-5xl',
    '6xl': 'max-w-6xl',
    '7xl': 'max-w-7xl',
  }[maxWidth];

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 p-2 backdrop-blur-sm sm:p-6">
      {/* Click outside backdrop */}
      <div className="absolute inset-0" onClick={onClose} aria-hidden="true" />
      
      <div 
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        className={`relative z-10 flex max-h-[calc(100dvh-1rem)] w-full flex-col rounded-xl border border-gray-100 bg-white shadow-2xl dark:border-gray-800 dark:bg-slate-900 ${maxWidthClass}`}
      >
        {/* Header */}
        <div className="flex shrink-0 items-center justify-between gap-3 border-b border-gray-100 p-4 sm:p-6 dark:border-gray-800">
          <h3 id="modal-title" className="text-lg font-semibold text-gray-900 dark:text-white">
            {title}
          </h3>
          <button 
            type="button"
            onClick={onClose} 
            className="inline-flex size-11 shrink-0 items-center justify-center rounded-full text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:hover:bg-gray-800 dark:hover:text-gray-200"
          >
            <span className="sr-only">Tutup</span>
            <X className="w-5 h-5" />
          </button>
        </div>
        
        {/* Body */}
        <div className="overflow-y-auto">
          {children}
        </div>
      </div>
    </div>,
    document.body
  );
}
