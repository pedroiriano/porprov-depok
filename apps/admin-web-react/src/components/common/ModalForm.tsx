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
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/60 p-2 backdrop-blur-sm animate-fade-in-up sm:p-6"
      onClick={onClose}
    >
      <div 
        className={`flex max-h-[calc(100dvh-1rem)] w-full flex-col overflow-hidden rounded-xl bg-white shadow-xl sm:max-h-[85vh] dark:bg-slate-900 ${size === 'large' ? 'max-w-4xl' : 'max-w-lg'}`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between gap-3 border-b border-slate-200 bg-slate-50 px-4 py-3 sm:px-6 sm:py-4 dark:border-slate-800 dark:bg-slate-800/50">
          <h3 id={`${formId}-title`} className="font-bold text-lg text-slate-900 dark:text-white">
            {title}
          </h3>
          <button 
            onClick={onClose} 
            aria-label="Tutup dialog"
            className="inline-flex size-11 shrink-0 items-center justify-center rounded-full text-2xl leading-none text-slate-500 hover:bg-slate-200 hover:text-slate-800 dark:hover:bg-slate-700 dark:hover:text-white"
            type="button"
          >
            &times;
          </button>
        </div>
        
        {/* Form Body */}
        <div className="overflow-y-auto p-4 custom-scrollbar sm:p-6">
          <form id={formId} onSubmit={onSubmit} className="flex flex-col gap-4">
            {children}
          </form>
        </div>
        
        {/* Footer */}
        <div className="flex flex-col-reverse gap-2 border-t border-slate-200 bg-slate-50 px-4 py-3 sm:flex-row sm:justify-end sm:gap-3 sm:px-6 sm:py-4 dark:border-slate-800 dark:bg-slate-800/50">
          <button 
            type="button"
            onClick={onClose}
            className="min-h-11 w-full rounded-md border border-slate-300 bg-white px-4 py-2 font-medium text-slate-700 transition-colors hover:bg-slate-50 sm:w-auto dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
          >
            Batal
          </button>
          <button 
            type="submit" 
            form={formId}
            disabled={submitting}
            className="flex min-h-11 w-full items-center justify-center gap-2 rounded-md bg-indigo-600 px-4 py-2 font-medium text-white shadow-sm transition-colors hover:bg-indigo-700 disabled:opacity-70 sm:w-auto"
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
