import { useEffect, useState, type RefObject } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { useModalDialog } from '../hooks/useModalDialog';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | '5xl' | '6xl' | '7xl';
  description?: string;
  closeDisabled?: boolean;
  initialFocusRef?: RefObject<HTMLElement | null>;
}

export default function Modal({
  isOpen,
  onClose,
  title,
  children,
  maxWidth = 'md',
  description,
  closeDisabled = false,
  initialFocusRef,
}: ModalProps) {
  const [mounted, setMounted] = useState(false);
  const { dialogRef, titleId, descriptionId, requestClose } = useModalDialog({
    isOpen: isOpen && mounted,
    onClose,
    closeDisabled,
    initialFocusRef,
  });

  useEffect(() => {
    setMounted(true);
  }, []);

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
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950/60 p-2 backdrop-blur-sm sm:p-6"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) requestClose();
      }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={description ? descriptionId : undefined}
        tabIndex={-1}
        className={`relative flex max-h-[calc(100dvh-1rem)] w-full flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl sm:max-h-[88dvh] dark:border-slate-700 dark:bg-slate-900 ${maxWidthClass}`}
      >
        {/* Header */}
        <div className="flex shrink-0 items-center justify-between gap-3 border-b border-gray-100 p-4 sm:p-6 dark:border-gray-800">
          <div>
            <h3 id={titleId} className="text-lg font-black text-slate-900 dark:text-white">{title}</h3>
            {description && <p id={descriptionId} className="mt-1 text-sm text-slate-500 dark:text-slate-300">{description}</p>}
          </div>
          <button 
            type="button"
            onClick={requestClose}
            disabled={closeDisabled}
            className="inline-flex size-11 shrink-0 items-center justify-center rounded-xl text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-40 dark:hover:bg-slate-800 dark:hover:text-slate-100"
          >
            <span className="sr-only">Tutup</span>
            <X className="size-5" aria-hidden="true" />
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
