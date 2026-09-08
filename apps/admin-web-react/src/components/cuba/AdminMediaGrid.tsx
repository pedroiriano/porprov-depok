import { Copy, Image as ImageIcon, Trash2 } from 'lucide-react';
import { resolveMediaUrl } from '../../lib/api';
import { formatMediaSize } from '../../lib/mediaFormat';
import type { MediaAsset } from '../../types/master-data';

export function AdminMediaGrid({
  items,
  onSelect,
  onCopy,
  onArchive,
  busy = false,
}: {
  items: MediaAsset[];
  onSelect?: (item: MediaAsset) => void;
  onCopy?: (item: MediaAsset) => void;
  onArchive?: (item: MediaAsset) => void;
  busy?: boolean;
}) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5">
      {items.map((item) => {
        const previewURL = item.derivatives?.find((derivative) => derivative.variant === 'thumbnail')?.file_url || item.file_url;
        const preview = (
          <span className="relative flex aspect-square items-center justify-center overflow-hidden bg-slate-100 dark:bg-slate-950">
            {item.mime_type?.startsWith('image/') ? (
              <img
                src={resolveMediaUrl(previewURL)}
                alt={onSelect ? '' : item.file_name}
                loading="lazy"
                className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03] group-focus-visible:scale-[1.03]"
              />
            ) : (
              <ImageIcon className="size-12 text-slate-400" aria-hidden="true" />
            )}
            <span className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-slate-950/65 to-transparent" aria-hidden="true" />
          </span>
        );

        if (onSelect) {
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onSelect(item)}
              className="group min-w-0 overflow-hidden rounded-2xl border border-slate-200 bg-white text-left shadow-sm transition hover:-translate-y-0.5 hover:border-blue-300 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:border-slate-700 dark:bg-slate-900 dark:hover:border-blue-600"
              aria-label={`Pilih media ${item.file_name}`}
            >
              {preview}
              <span className="block min-w-0 p-3">
                <span className="block truncate text-sm font-black text-slate-900 dark:text-white" title={item.file_name}>{item.file_name}</span>
                <span className="mt-1 block text-xs text-slate-500 dark:text-slate-300">{formatMediaSize(item.file_size)}</span>
              </span>
            </button>
          );
        }

        return (
          <article key={item.id} className="group min-w-0 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:border-blue-300 hover:shadow-md dark:border-slate-700 dark:bg-slate-900 dark:hover:border-blue-600">
            {preview}
            <div className="min-w-0 p-3">
              <p className="truncate text-sm font-black text-slate-900 dark:text-white" title={item.file_name}>{item.file_name}</p>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-300">{formatMediaSize(item.file_size)}</p>
              <div className="mt-3 grid grid-cols-2 gap-2">
                {onCopy && (
                  <button
                    type="button"
                    onClick={() => onCopy(item)}
                    className="inline-flex min-h-11 items-center justify-center gap-1.5 rounded-xl border border-slate-200 px-2 text-xs font-bold text-slate-700 hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700 dark:border-slate-700 dark:text-slate-200 dark:hover:border-blue-700 dark:hover:bg-blue-950/40 dark:hover:text-blue-200"
                    aria-label={`Salin URL ${item.file_name}`}
                  >
                    <Copy className="size-4" aria-hidden="true" /> Salin
                  </button>
                )}
                {onArchive && (
                  <button
                    type="button"
                    onClick={() => onArchive(item)}
                    disabled={busy}
                    className="inline-flex min-h-11 items-center justify-center gap-1.5 rounded-xl border border-red-200 px-2 text-xs font-bold text-red-700 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-red-900 dark:text-red-300 dark:hover:bg-red-950/40"
                    aria-label={`Arsipkan ${item.file_name}`}
                  >
                    <Trash2 className="size-4" aria-hidden="true" /> Arsipkan
                  </button>
                )}
              </div>
            </div>
          </article>
        );
      })}
    </div>
  );
}
