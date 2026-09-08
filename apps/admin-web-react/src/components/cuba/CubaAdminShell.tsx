import {
  Activity,
  Bell,
  ChevronRight,
  Database,
  FileCheck,
  Images,
  HeartPulse,
  LayoutDashboard,
  LogOut,
  MapPinned,
  Medal,
  Menu,
  Moon,
  PanelsTopLeft,
  ShieldAlert,
  Sun,
  User,
  Users,
  X,
  type LucideIcon,
} from 'lucide-react';
import { useEffect, useMemo, useState, type ReactNode } from 'react';
import type { AuthContextProps } from 'react-oidc-context';
import { useTheme } from '../../hooks/useTheme';
import { canAccessRole, getRealmRoles } from '../../lib/auth';
import { Link, useLocation } from '../../lib/router';
import './cuba-admin.css';

type NavigationItem = {
  icon: LucideIcon;
  label: string;
  path: string;
  roles?: string[];
};

const navigationGroups: Array<{ label: string; items: NavigationItem[] }> = [
  {
    label: 'Ringkasan',
    items: [
      { icon: LayoutDashboard, label: 'Dasbor', path: '/' },
    ],
  },
  {
    label: 'Operasional',
    items: [
      { icon: Database, label: 'Data Utama', path: '/master-data', roles: ['super_admin'] },
      { icon: PanelsTopLeft, label: 'Tampilan Utama', path: '/hero', roles: ['super_admin'] },
      { icon: Activity, label: 'Pusat Skor Langsung', path: '/livescore', roles: ['koresponden'] },
      { icon: Medal, label: 'Perolehan Medali', path: '/medals', roles: ['koresponden'] },
      { icon: MapPinned, label: 'Panduan Kota', path: '/city-guide', roles: ['super_admin'] },
      { icon: Images, label: 'Pustaka Media', path: '/media', roles: ['super_admin'] },
      { icon: FileCheck, label: 'Verifikasi', path: '/verifikasi', roles: ['verifikator'] },
    ],
  },
  {
    label: 'Administrasi',
    items: [
      { icon: ShieldAlert, label: 'Log Audit', path: '/audit-log', roles: ['auditor'] },
      { icon: HeartPulse, label: 'Kesehatan Integrasi', path: '/integration-health', roles: ['super_admin', 'auditor'] },
      { icon: Users, label: 'Manajemen Akun', path: '/user-management', roles: ['super_admin'] },
      { icon: User, label: 'Profil Akun', path: '/profile' },
    ],
  },
];

const routeIsActive = (pathname: string, path: string) => (
  path === '/' ? pathname === '/' : pathname.startsWith(path)
);

export function CubaAdminShell({
  auth,
  children,
}: {
  auth: AuthContextProps;
  children: ReactNode;
}) {
  const location = useLocation();
  const { theme, setTheme } = useTheme();
  const [isMobile, setIsMobile] = useState(() => window.matchMedia('(max-width: 1023px)').matches);
  const [sidebarOpen, setSidebarOpen] = useState(() => !window.matchMedia('(max-width: 1023px)').matches);
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const roles = useMemo(() => getRealmRoles(auth.user), [auth.user]);

  const visibleGroups = useMemo(() => navigationGroups.map((group) => ({
    ...group,
    items: group.items.filter((item) => !item.roles || canAccessRole(roles, item.roles)),
  })).filter((group) => group.items.length > 0), [roles]);

  const currentPage = visibleGroups
    .flatMap((group) => group.items)
    .find((item) => routeIsActive(location.pathname, item.path));
  const accountName = auth.user?.profile.preferred_username
    || auth.user?.profile.name
    || 'Pengguna Admin';

  useEffect(() => {
    const mediaQuery = window.matchMedia('(max-width: 1023px)');
    const synchronize = (event: MediaQueryListEvent) => {
      setIsMobile(event.matches);
      setSidebarOpen(!event.matches);
    };

    mediaQuery.addEventListener('change', synchronize);
    return () => mediaQuery.removeEventListener('change', synchronize);
  }, []);

  useEffect(() => {
    if (isMobile) setSidebarOpen(false);
    setNotificationOpen(false);
    setProfileOpen(false);
  }, [isMobile, location.pathname]);

  useEffect(() => {
    const closeTransientUi = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      if (isMobile) setSidebarOpen(false);
      setNotificationOpen(false);
      setProfileOpen(false);
    };

    document.addEventListener('keydown', closeTransientUi);
    return () => document.removeEventListener('keydown', closeTransientUi);
  }, [isMobile]);

  return (
    <div className="admin-cuba-shell min-h-dvh bg-[var(--admin-bg)] text-[var(--admin-text)]">
      {isMobile && sidebarOpen && (
        <button
          type="button"
          className="fixed inset-0 z-40 bg-slate-950/60 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
          aria-label="Tutup navigasi Admin"
        />
      )}

      <aside
        id="cuba-admin-sidebar"
        className={`admin-cuba-sidebar fixed inset-y-0 left-0 z-50 flex w-[255px] flex-col overflow-hidden text-white transition-transform duration-200 lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}
        aria-label="Navigasi Admin PORPROV"
        aria-hidden={isMobile && !sidebarOpen}
        inert={isMobile && !sidebarOpen ? true : undefined}
      >
        <div className="flex h-[76px] shrink-0 items-center justify-between border-b border-white/10 px-5">
          <Link to="/" className="flex min-h-11 items-center gap-3" aria-label="Dasbor PORPROV">
            <span className="grid size-10 place-items-center rounded-xl bg-white/15 ring-1 ring-white/20">
              <img
                src={`${import.meta.env.BASE_URL}assets/images/logo-porprov.png`}
                alt=""
                className="size-8 object-contain"
              />
            </span>
            <span>
              <span className="block text-sm font-black tracking-wide">PORPROV DEPOK</span>
              <span className="block text-[10px] font-bold uppercase tracking-[0.18em] text-blue-100">Ruang Kerja Admin</span>
            </span>
          </Link>
          <button
            type="button"
            className="grid size-11 place-items-center rounded-xl text-blue-100 hover:bg-white/10 hover:text-white lg:hidden"
            onClick={() => setSidebarOpen(false)}
            aria-label="Tutup sidebar"
          >
            <X className="size-5" aria-hidden="true" />
          </button>
        </div>

        <nav className="admin-cuba-scrollbar flex-1 overflow-y-auto px-3 py-5">
          {visibleGroups.map((group) => (
            <section key={group.label} className="mb-6" aria-labelledby={`nav-${group.label.toLowerCase()}`}>
              <h2 id={`nav-${group.label.toLowerCase()}`} className="px-3 pb-2 text-[10px] font-black uppercase tracking-[0.2em] text-blue-200/80">
                {group.label}
              </h2>
              <ul className="space-y-1">
                {group.items.map(({ icon: Icon, label, path }) => {
                  const active = routeIsActive(location.pathname, path);
                  return (
                    <li key={path}>
                      <Link
                        to={path}
                        className={`group flex min-h-11 items-center gap-3 rounded-xl px-3 text-sm font-bold transition-colors ${active ? 'bg-white text-blue-700 shadow-lg shadow-blue-950/15' : 'text-blue-50 hover:bg-white/10 hover:text-white'}`}
                        aria-current={active ? 'page' : undefined}
                      >
                        <Icon className={`size-5 shrink-0 ${active ? 'text-blue-600' : 'text-blue-200 group-hover:text-white'}`} aria-hidden="true" />
                        <span className="min-w-0 flex-1 truncate">{label}</span>
                        {active && <ChevronRight className="size-4 text-blue-500" aria-hidden="true" />}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </section>
          ))}
        </nav>

        <div className="border-t border-white/10 p-4">
          <div className="rounded-2xl bg-white/10 p-3 ring-1 ring-white/10">
            <p className="text-xs font-black text-white">PORPROV XV 2026</p>
            <p className="mt-1 text-xs leading-relaxed text-blue-100">Ruang kerja operator Kota Depok</p>
          </div>
        </div>
      </aside>

      <div className="min-h-dvh lg:pl-[255px]">
        <header className="sticky top-0 z-30 border-b border-[var(--admin-border)] bg-[color:var(--admin-surface-translucent)] backdrop-blur-xl">
          <div className="flex min-h-[76px] items-center justify-between gap-3 px-3 sm:px-5 lg:px-7">
            <div className="flex min-w-0 items-center gap-3">
              <button
                type="button"
                className="admin-cuba-icon-button lg:hidden"
                onClick={() => setSidebarOpen(true)}
                aria-label="Buka sidebar"
                aria-expanded={sidebarOpen}
                aria-controls="cuba-admin-sidebar"
              >
                <Menu className="size-5" aria-hidden="true" />
              </button>
              <div className="min-w-0">
                <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[var(--admin-muted)]">Ruang Kerja Admin</p>
                <h1 className="truncate text-lg font-black text-[var(--admin-heading)] sm:text-xl">{currentPage?.label || 'PORPROV Depok'}</h1>
              </div>
            </div>

            <div className="flex items-center gap-1.5 sm:gap-2">
              <span className="hidden rounded-full bg-emerald-50 px-3 py-1 text-xs font-black text-emerald-700 ring-1 ring-emerald-200 sm:inline-flex dark:bg-emerald-950/50 dark:text-emerald-200 dark:ring-emerald-800">Sistem siap</span>
              <button
                type="button"
                className="admin-cuba-icon-button"
                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                aria-label={theme === 'dark' ? 'Aktifkan tema terang' : 'Aktifkan tema gelap'}
              >
                {theme === 'dark' ? <Sun className="size-5 text-yellow-400" aria-hidden="true" /> : <Moon className="size-5" aria-hidden="true" />}
              </button>

              <div className="relative">
                <button
                  type="button"
                  className="admin-cuba-icon-button"
                  onClick={() => { setNotificationOpen((value) => !value); setProfileOpen(false); }}
                  aria-label="Buka notifikasi"
                  aria-expanded={notificationOpen}
                  aria-controls="cuba-notifications"
                >
                  <Bell className="size-5" aria-hidden="true" />
                </button>
                {notificationOpen && (
                  <div id="cuba-notifications" className="admin-cuba-popover w-72" role="status">
                    <p className="font-black text-[var(--admin-heading)]">Notifikasi</p>
                    <p className="mt-2 text-sm text-[var(--admin-muted)]">Tidak ada notifikasi baru.</p>
                  </div>
                )}
              </div>

              <div className="relative">
                <button
                  type="button"
                  className="flex min-h-11 items-center gap-2 rounded-xl border border-[var(--admin-border)] bg-[var(--admin-surface)] px-2 text-left shadow-sm hover:border-blue-300 sm:px-3"
                  onClick={() => { setProfileOpen((value) => !value); setNotificationOpen(false); }}
                  aria-label="Buka menu akun"
                  aria-expanded={profileOpen}
                  aria-controls="cuba-account-menu"
                >
                  <span className="grid size-8 place-items-center rounded-lg bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-200">
                    <User className="size-4" aria-hidden="true" />
                  </span>
                  <span className="hidden max-w-32 truncate text-sm font-black text-[var(--admin-heading)] md:block">{String(accountName)}</span>
                </button>
                {profileOpen && (
                  <div id="cuba-account-menu" className="admin-cuba-popover w-56">
                    <Link to="/profile" className="flex min-h-11 items-center gap-2 rounded-lg px-3 text-sm font-bold hover:bg-[var(--admin-soft)]">
                      <User className="size-4" aria-hidden="true" /> Profil Akun
                    </Link>
                    <button
                      type="button"
                      onClick={() => auth.signoutRedirect()}
                      className="mt-1 flex min-h-11 w-full items-center gap-2 rounded-lg px-3 text-left text-sm font-bold text-red-600 hover:bg-red-50 dark:text-red-300 dark:hover:bg-red-950/40"
                    >
                      <LogOut className="size-4" aria-hidden="true" /> Keluar
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>

        <main id="admin-main-content" className="mx-auto w-full max-w-[1600px] px-3 py-5 sm:px-5 lg:px-7 lg:py-7">
          {children}
        </main>
      </div>
    </div>
  );
}
