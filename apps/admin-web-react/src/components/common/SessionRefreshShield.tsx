import { useId, useLayoutEffect, useRef } from 'react';
import { createPortal } from 'react-dom';

export function SessionRefreshShield({ blocked, error, onRetry }: { blocked: boolean; error: string; onRetry: () => Promise<void> }) {
  const ref = useRef<HTMLDivElement>(null);
  const titleId = useId();
  useLayoutEffect(() => {
    if (!blocked) return;
    const focused = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const block = (event: Event) => {
      if (event.target instanceof Node && ref.current?.contains(event.target)) {
        if (event instanceof KeyboardEvent && event.key === 'Tab') {
          event.preventDefault();
          ref.current.querySelector('button')?.focus();
        }
        return;
      }
      // SECURITY: Capture document events because modal forms use portals outside the route DOM.
      event.preventDefault();
      event.stopImmediatePropagation();
    };
    const events = ['click', 'auxclick', 'submit', 'keydown', 'beforeinput', 'pointerdown', 'mousedown', 'drop', 'input', 'change'];
    for (const event of events) document.addEventListener(event, block, true);
    if (error) ref.current?.querySelector('button')?.focus();
    return () => {
      for (const event of events) document.removeEventListener(event, block, true);
      // ACCESSIBILITY: Successful silent renewal keeps the existing input and caret without refocusing.
      if (error && focused?.isConnected) focused.focus();
    };
  }, [blocked, error]);
  if (!blocked) return null;
  return createPortal(<div ref={ref} className="fixed inset-0 z-[12000] grid place-items-center bg-slate-50/95 p-4 dark:bg-slate-950/95" role={error ? 'alertdialog' : 'status'} aria-modal={error ? true : undefined} aria-labelledby={titleId} aria-live={error ? 'assertive' : 'polite'}>
    <div className="max-w-md rounded-2xl border border-slate-300 bg-white p-6 text-center text-slate-950 shadow-xl dark:border-slate-700 dark:bg-slate-900 dark:text-white">
      <h2 id={titleId} className="text-lg font-black">{error ? 'Sesi belum dapat diperiksa' : 'Memeriksa sesi dan hak akses...'}</h2>
      <p className="mt-3 text-sm text-slate-600 dark:text-slate-300">Isian Anda tetap tersedia. Form dapat dilanjutkan setelah pemeriksaan selesai.</p>
      {error && <button type="button" onClick={() => void onRetry()} className="mt-4 min-h-11 rounded-xl bg-blue-700 px-5 font-bold text-white hover:bg-blue-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500">Coba lagi</button>}
    </div>
  </div>, document.body);
}
