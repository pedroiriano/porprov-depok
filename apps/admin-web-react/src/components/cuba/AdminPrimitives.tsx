import {
  AlertCircle,
  CheckCircle2,
  Loader2,
  SearchX,
  Trash2,
  type LucideIcon,
} from 'lucide-react';
import type { ReactNode } from 'react';

export function AdminPageHeader({
  eyebrow,
  title,
  description,
  actions,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: ReactNode;
}) {
  return (
    <header className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        {eyebrow && <p className="text-xs font-black uppercase tracking-[0.18em] text-blue-600 dark:text-blue-300">{eyebrow}</p>}
        <h2 className="mt-1 text-2xl font-black tracking-tight text-slate-950 dark:text-white sm:text-3xl">{title}</h2>
        {description && <p className="mt-2 max-w-3xl text-sm leading-relaxed text-slate-600 dark:text-slate-300">{description}</p>}
      </div>
      {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
    </header>
  );
}

export function AdminAlert({
  tone = 'danger',
  children,
}: {
  tone?: 'danger' | 'warning' | 'success';
  children: ReactNode;
}) {
  const styles = {
    danger: 'border-red-200 bg-red-50 text-red-800 dark:border-red-900 dark:bg-red-950/45 dark:text-red-200',
    warning: 'border-yellow-300 bg-yellow-50 text-yellow-900 dark:border-yellow-800 dark:bg-yellow-950/35 dark:text-yellow-100',
    success: 'border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-200',
  }[tone];
  const Icon = tone === 'success' ? CheckCircle2 : AlertCircle;

  return (
    <div className={`flex items-start gap-2 rounded-xl border p-3 text-sm ${styles}`} role={tone === 'danger' ? 'alert' : 'status'}>
      <Icon className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
      <div className="min-w-0">{children}</div>
    </div>
  );
}

export function AdminLoadingState({ label = 'Memuat data...' }: { label?: string }) {
  return (
    <div className="flex min-h-48 flex-col items-center justify-center gap-3 p-6 text-slate-500 dark:text-slate-300" role="status">
      <Loader2 className="size-8 animate-spin text-blue-600 dark:text-blue-300" aria-hidden="true" />
      <span className="text-sm font-bold">{label}</span>
    </div>
  );
}

export function AdminEmptyState({
  title,
  description,
  action,
  icon: Icon = SearchX,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
  icon?: LucideIcon;
}) {
  return (
    <div className="flex min-h-56 flex-col items-center justify-center px-6 py-10 text-center">
      <span className="grid size-14 place-items-center rounded-2xl bg-blue-50 text-blue-600 dark:bg-blue-950/50 dark:text-blue-200">
        <Icon className="size-7" aria-hidden="true" />
      </span>
      <h3 className="mt-4 text-base font-black text-slate-900 dark:text-white">{title}</h3>
      {description && <p className="mt-1 max-w-md text-sm text-slate-500 dark:text-slate-300">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function AdminErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="flex min-h-56 flex-col items-center justify-center px-6 py-10 text-center" role="alert">
      <span className="grid size-14 place-items-center rounded-2xl bg-red-50 text-red-600 dark:bg-red-950/50 dark:text-red-200">
        <AlertCircle className="size-7" aria-hidden="true" />
      </span>
      <h3 className="mt-4 text-base font-black text-slate-900 dark:text-white">Data belum dapat dimuat</h3>
      <p className="mt-1 max-w-md text-sm text-slate-500 dark:text-slate-300">{message}</p>
      {onRetry && (
        <button type="button" onClick={onRetry} className="mt-4 min-h-11 rounded-xl bg-blue-600 px-4 text-sm font-black text-white hover:bg-blue-700">
          Coba lagi
        </button>
      )}
    </div>
  );
}

export function BulkActionBar({
  selectedCount,
  onClear,
  onDelete,
  onAction,
  deleting = false,
  itemLabel = 'data',
  actionLabel = 'Arsipkan terpilih',
  loadingLabel = 'Mengarsipkan...',
  actionTone = 'danger',
  actionIcon,
}: {
  selectedCount: number;
  onClear: () => void;
  onDelete?: () => void;
  onAction?: () => void;
  deleting?: boolean;
  itemLabel?: string;
  actionLabel?: string;
  loadingLabel?: string;
  actionTone?: 'danger' | 'primary';
  actionIcon?: ReactNode;
}) {
  if (selectedCount === 0) return null;
  const action = onAction ?? onDelete;
  const actionStyles = actionTone === 'primary' ? 'bg-blue-600 hover:bg-blue-700' : 'bg-red-600 hover:bg-red-700';

  return (
    <div className="flex flex-col gap-3 border-b border-blue-200 bg-blue-50 px-4 py-3 sm:flex-row sm:items-center sm:justify-between dark:border-blue-900 dark:bg-blue-950/35" role="status">
      <p className="text-sm font-black text-blue-900 dark:text-blue-100">{selectedCount} {itemLabel} dipilih</p>
      <div className="flex flex-wrap items-center gap-2">
        <button type="button" onClick={onClear} disabled={deleting} className="min-h-11 rounded-xl border border-blue-200 bg-white px-4 text-sm font-bold text-blue-800 hover:bg-blue-100 disabled:opacity-50 dark:border-blue-800 dark:bg-slate-900 dark:text-blue-100 dark:hover:bg-blue-950">
          Batalkan pilihan
        </button>
        {action && (
          <button type="button" onClick={action} disabled={deleting} className={`inline-flex min-h-11 items-center gap-2 rounded-xl px-4 text-sm font-black text-white disabled:opacity-50 ${actionStyles}`}>
            {deleting ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : actionIcon ?? <Trash2 className="size-4" aria-hidden="true" />}
            {deleting ? loadingLabel : actionLabel}
          </button>
        )}
      </div>
    </div>
  );
}
