import { useRef, type KeyboardEvent, type ReactNode } from 'react';

export type AdminWorkspaceTab<T extends string> = {
  id: T;
  label: string;
  icon?: ReactNode;
};

export function AdminWorkspaceTabs<T extends string>({
  activeTab,
  ariaLabel,
  onChange,
  tabs,
}: {
  activeTab: T;
  ariaLabel: string;
  onChange: (tab: T) => void;
  tabs: Array<AdminWorkspaceTab<T>>;
}) {
  const tabRefs = useRef(new Map<T, HTMLButtonElement>());

  const focusTab = (index: number) => {
    const tab = tabs[(index + tabs.length) % tabs.length];
    onChange(tab.id);
    window.requestAnimationFrame(() => tabRefs.current.get(tab.id)?.focus());
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
    if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
    event.preventDefault();
    if (event.key === 'Home') focusTab(0);
    else if (event.key === 'End') focusTab(tabs.length - 1);
    else focusTab(index + (event.key === 'ArrowRight' ? 1 : -1));
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-2 shadow-sm dark:border-slate-700 dark:bg-slate-900 sm:p-3">
      <div className="flex flex-wrap items-center justify-center gap-2" role="tablist" aria-label={ariaLabel}>
        {tabs.map((tab, index) => {
          const selected = tab.id === activeTab;
          return (
            <button
              key={tab.id}
              ref={(node) => {
                if (node) tabRefs.current.set(tab.id, node);
                else tabRefs.current.delete(tab.id);
              }}
              id={`tab-${tab.id}`}
              type="button"
              role="tab"
              aria-selected={selected}
              aria-controls={`panel-${tab.id}`}
              tabIndex={selected ? 0 : -1}
              onClick={() => onChange(tab.id)}
              onKeyDown={(event) => handleKeyDown(event, index)}
              className={`inline-flex min-h-11 max-w-full shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-xl px-4 py-2 text-center text-sm font-black transition-colors ${
                selected
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-600 hover:bg-blue-50 hover:text-blue-700 dark:text-slate-300 dark:hover:bg-blue-950/40 dark:hover:text-blue-200'
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
