import React, { useEffect, useId, useState } from 'react';
import { createPortal } from 'react-dom';
import { Loader2 } from 'lucide-react';

interface ModalFormProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  onSubmit: (e: React.FormEvent) => void;
  submitting: boolean;
  submitText: string;
  children: React.ReactNode;
  size?: 'default' | 'large';
}

export default function ModalForm({
  isOpen,
  onClose,
  title,
  onSubmit,
  submitting,
  submitText,
  children,
  size = 'default'
}: ModalFormProps) {
  const [mounted, setMounted] = useState(false);
  const generatedFormId = useId();
  const formId = `modal-form-${generatedFormId.replace(/:/g, '')}`;

  useEffect(() => {
    setMounted(true);
  }, []);

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

  useEffect(() => {
    if (!isOpen) return undefined;
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !submitting) onClose();
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose, submitting]);

  if (!isOpen || !mounted) return null;

  const modalContent = (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby={`${formId}-title`}
      className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4 sm:p-6 animate-fade-in-up"
      onClick={onClose}
    >
      <div 
        className={`bg-white dark:bg-slate-900 rounded-xl shadow-xl w-full overflow-hidden flex flex-col max-h-[90vh] sm:max-h-[85vh] ${size === 'large' ? 'max-w-4xl' : 'max-w-lg'}`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-800/50">
          <h3 id={`${formId}-title`} className="font-bold text-lg text-slate-900 dark:text-white">
            {title}
          </h3>
          <button 
            onClick={onClose} 
            aria-label="Tutup dialog"
            className="text-slate-400 hover:text-slate-700 dark:hover:text-white text-2xl leading-none"
            type="button"
          >
            &times;
          </button>
        </div>
        
        {/* Form Body */}
        <div className="p-6 overflow-y-auto custom-scrollbar">
          <form id={formId} onSubmit={onSubmit} className="flex flex-col gap-4">
            {children}
          </form>
        </div>
        
        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-3 bg-slate-50 dark:bg-slate-800/50">
          <button 
            type="button"
            onClick={onClose}
            className="px-4 py-2 font-medium text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-md transition-colors"
          >
            Batal
          </button>
          <button 
            type="submit" 
            form={formId}
            disabled={submitting}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md font-medium shadow-sm transition-colors flex items-center disabled:opacity-70 gap-2"
          >
            {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
            {submitting ? 'Menyimpan...' : submitText}
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
