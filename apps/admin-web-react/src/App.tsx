import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import {
  Activity,
  Bell,
  Database,
  FileCheck,
  Images,
  PanelsTopLeft,
  LayoutDashboard,
  LogOut,
  MapPinned,
  Medal,
  Menu,
  Moon,
  ShieldAlert,
  Sun,
  User,
  Users,
  type LucideIcon,
} from 'lucide-react';
import { lazy, Suspense, useEffect, useState } from 'react';
import { useAuth } from 'react-oidc-context';
import { useTheme } from './hooks/useTheme';
import { canAccessRole, getRealmRoles } from './lib/auth';

// PERFORMANCE: Setiap workspace Admin dimuat saat dibutuhkan agar entry bundle
// tetap ringan tanpa meninggalkan pola application shell Techwind.
const DashboardOverview = lazy(() => import('./pages/DashboardOverview'));
const MasterData = lazy(() => import('./pages/MasterData'));
const LiveScoreCenter = lazy(() => import('./pages/LiveScoreCenter'));
const AuditLog = lazy(() => import('./pages/AuditLog'));
const Profile = lazy(() => import('./pages/Profile'));
const Medals = lazy(() => import('./pages/Medals'));
const CityGuide = lazy(() => import('./pages/CityGuide'));
const UserManagement = lazy(() => import('./pages/UserManagement'));
const MediaLibrary = lazy(() => import('./components/media/MediaLibrary'));
const HeroManagement = lazy(() => import('./pages/HeroManagement'));

// Sidebar Item Component
const SidebarItem = ({ icon: Icon, label, path, isActive }: { icon: LucideIcon, label: string, path: string, isActive: boolean }) => (
  <li className={isActive ? 'active' : ''}>
    <Link to={path} className="flex min-h-11 items-center" aria-current={isActive ? 'page' : undefined}>
      <Icon className="w-5 h-5 align-middle me-2 inline-block" />
      {label}
    </Link>
  </li>
);

// Admin Layout
const AdminLayout = ({ children, auth }: { children: React.ReactNode, auth: any }) => {
  const [isMobile, setIsMobile] = useState(() => window.matchMedia('(max-width: 1023px)').matches);
  const [sidebarOpen, setSidebarOpen] = useState(() => !window.matchMedia('(max-width: 1023px)').matches);
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const location = useLocation();
  const { theme, setTheme } = useTheme();

  // Parsing roles
  // SECURITY: Keycloak dapat menaruh realm_access pada ID token, access token,
  // atau keduanya. Navigasi membaca keduanya agar role Admin tidak hilang hanya
  // karena mapper client berbeda, sementara otorisasi final tetap di API Gateway.
  const roles = getRealmRoles(auth.user);
  const canAudit = canAccessRole(roles, ['auditor']);
  const canOperateScores = canAccessRole(roles, ['koresponden']);
  const canSubmitMedals = canAccessRole(roles, ['koresponden']);
  const canVerifyMedals = canAccessRole(roles, ['verifikator']);

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(max-width: 1023px)');
    const syncBreakpoint = (event: MediaQueryListEvent) => {
      setIsMobile(event.matches);
      setSidebarOpen(!event.matches);
    };

    mediaQuery.addEventListener('change', syncBreakpoint);
    return () => mediaQuery.removeEventListener('change', syncBreakpoint);
  }, []);

  useEffect(() => {
    // CHANGE: Navigasi mempertahankan sidebar desktop dan menutup off-canvas mobile.
    setSidebarOpen(!isMobile);
    setNotificationOpen(false);
    setProfileOpen(false);
  }, [isMobile, location.pathname]);

  // INFO: Class Techwind `toggled` bermakna desktop-open tetapi mobile-closed.
  const wrapperToggled = isMobile ? !sidebarOpen : sidebarOpen;

  return (
    <div className={`page-wrapper ${wrapperToggled ? 'toggled' : ''}`}>
      {isMobile && sidebarOpen && (
        <button
          type="button"
          className="fixed inset-0 z-[998] bg-slate-950/55 backdrop-blur-[1px] lg:hidden"
          onClick={() => setSidebarOpen(false)}
          aria-label="Tutup sidebar"
        />
      )}
      <nav
        id="sidebar"
        className="sidebar-wrapper sidebar-dark"
        aria-label="Navigasi Admin PORPROV"
        aria-hidden={isMobile && !sidebarOpen}
        inert={isMobile && !sidebarOpen ? true : undefined}
      >
        <div className="sidebar-content">
          <div className="sidebar-brand">
            <Link to="/" aria-label="Dashboard PORPROV" className="inline-flex min-h-11 items-center"><img src="/assets/images/logo-porprov-dan-tulisan.png" height="24" className="h-8 object-contain brightness-0 invert" alt="PORPROV XV Jawa Barat 2026" /></Link>
          </div>
          
          <ul className="sidebar-menu border-t border-white/10" style={{ height: 'calc(100% - 70px)' }}>
            <SidebarItem icon={LayoutDashboard} label="Dashboard" path="/" isActive={location.pathname === '/'} />
            <SidebarItem icon={Database} label="Master Data" path="/master-data" isActive={location.pathname.startsWith('/master-data')} />
            <SidebarItem icon={PanelsTopLeft} label="Hero Utama" path="/hero" isActive={location.pathname.startsWith('/hero')} />
            {canOperateScores && <SidebarItem icon={Activity} label="LiveScore Center" path="/livescore" isActive={location.pathname.startsWith('/livescore')} />}
            {canSubmitMedals && <SidebarItem icon={Medal} label="Perolehan Medali" path="/medals" isActive={location.pathname.startsWith('/medals')} />}
            <SidebarItem icon={MapPinned} label="City Guide" path="/city-guide" isActive={location.pathname.startsWith('/city-guide')} />
            <SidebarItem icon={Images} label="Media Library" path="/media" isActive={location.pathname.startsWith('/media')} />
            {canVerifyMedals && (
              <>
                <SidebarItem icon={FileCheck} label="Verifikasi" path="/verifikasi" isActive={location.pathname.startsWith('/verifikasi')} />
              </>
            )}
            {canAudit && (
              <>
                <SidebarItem icon={ShieldAlert} label="Audit Log" path="/audit-log" isActive={location.pathname.startsWith('/audit-log')} />
              </>
            )}
            {canAccessRole(roles, ['super_admin']) && (
              <>
                <SidebarItem icon={Users} label="Manajemen Akun" path="/user-management" isActive={location.pathname.startsWith('/user-management')} />
              </>
            )}
            <SidebarItem icon={User} label="Profil Akun" path="/profile" isActive={location.pathname === '/profile'} />
          </ul>
        </div>
      </nav>
      <main className="page-content bg-slate-50 text-slate-900 dark:bg-slate-800 dark:text-slate-100">
        {/* Top Header */}
        <div className="top-header">
          <div className="header-bar flex justify-between">
            <div className="flex items-center space-x-1">
              <button type="button" className="sidebar-collapse inline-flex min-h-11 min-w-11 items-center justify-center rounded-full text-slate-800 hover:bg-slate-100 dark:text-white dark:hover:bg-slate-800" onClick={toggleSidebar} aria-label={sidebarOpen ? 'Tutup sidebar' : 'Buka sidebar'} aria-expanded={sidebarOpen} aria-controls="sidebar">
                <Menu className="h-6 w-6" aria-hidden="true" />
              </button>
            </div>

            <ul className="mb-0 flex list-none items-center gap-1">
              <li className="dropdown inline-block relative">
                <button 
                  onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                  className="dropdown-toggle size-11 inline-flex items-center justify-center tracking-wide align-middle duration-500 text-center bg-gray-50 dark:bg-slate-800 hover:bg-gray-100 dark:hover:bg-slate-700 border border-gray-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-full"
                  aria-label={theme === 'dark' ? 'Aktifkan tema terang' : 'Aktifkan tema gelap'}
                >
                  {theme === 'dark' ? <Sun className="h-5 w-5 text-amber-400" aria-hidden="true" /> : <Moon className="h-5 w-5" aria-hidden="true" />}
                </button>
              </li>

              <li className="dropdown inline-block relative">
                <button 
                  onClick={() => { setNotificationOpen((current) => !current); setProfileOpen(false); }}
                  className="dropdown-toggle size-11 inline-flex items-center justify-center tracking-wide align-middle duration-500 text-center bg-gray-50 dark:bg-slate-800 hover:bg-gray-100 dark:hover:bg-slate-700 border border-gray-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-full"
                  aria-label="Buka notifikasi"
                  aria-expanded={notificationOpen}
                  aria-controls="notification-dropdown"
                >
                  <Bell className="h-5 w-5" aria-hidden="true" />
                  <span className="absolute top-0 right-0 flex items-center justify-center bg-red-600 text-white text-[10px] font-bold rounded-full size-2 after:content-[''] after:absolute after:h-2 after:w-2 after:bg-red-600 after:top-0 after:right-0 after:rounded-full after:animate-ping"></span>
                </button>
                <div id="notification-dropdown" className={`dropdown-menu absolute right-0 z-10 mt-3 w-64 max-w-[calc(100vw-1.5rem)] rounded-md border border-slate-200 bg-white shadow-md dark:border-slate-700 dark:bg-slate-900 dark:shadow-gray-800 ${notificationOpen ? '' : 'hidden'}`}>
                  <div className="p-4 border-b border-gray-100 dark:border-gray-800">
                    <h2 className="mb-0 font-bold text-slate-900 dark:text-white">Notifikasi</h2>
                  </div>
                  <div className="p-4">
                    <p className="text-slate-600 dark:text-slate-400 text-sm">Tidak ada notifikasi baru</p>
                  </div>
                </div>
              </li>

              <li className="dropdown inline-block relative">
                <button 
                  onClick={() => { setProfileOpen((current) => !current); setNotificationOpen(false); }}
                  className="dropdown-toggle min-h-11 min-w-11 items-center"
                  aria-label="Buka menu akun"
                  aria-expanded={profileOpen}
                  aria-controls="profile-dropdown"
                >
                  <span className="size-11 inline-flex items-center justify-center tracking-wide align-middle duration-500 text-center bg-gray-50 dark:bg-slate-800 hover:bg-gray-100 dark:hover:bg-slate-700 border border-gray-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-full"><User className="h-5 w-5" aria-hidden="true" /></span>
                </button>
                <div id="profile-dropdown" className={`dropdown-menu absolute right-0 z-10 mt-3 w-48 max-w-[calc(100vw-1.5rem)] rounded-md border border-slate-200 bg-white shadow-md dark:border-slate-700 dark:bg-slate-900 dark:shadow-gray-800 ${profileOpen ? '' : 'hidden'}`}>
                  <ul className="py-2 text-left">
                    <li>
                      <Link to="/profile" onClick={() => setProfileOpen(false)} className="flex min-h-11 items-center font-medium py-2 px-4 text-slate-700 dark:text-slate-200 hover:text-indigo-600 dark:hover:text-white"><User className="me-2 h-4 w-4" aria-hidden="true" />Profil Akun</Link>
                    </li>
                    <li className="border-t border-gray-100 dark:border-gray-800 my-2"></li>
                    <li>
                      <button onClick={() => auth.signoutRedirect()} className="flex min-h-11 items-center font-medium py-2 px-4 text-slate-700 dark:text-slate-200 hover:text-red-600 dark:hover:text-red-400 w-full text-left"><LogOut className="me-2 h-4 w-4" aria-hidden="true" />Keluar</button>
                    </li>
                  </ul>
                </div>
              </li>
            </ul>
          </div>
        </div>
        {/* Top Header */}

        <div className="container-fluid relative px-3 sm:px-4 lg:px-6">
          <div className="layout-specing">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
};

export default function App() {
  const auth = useAuth();
  
  if (auth.isLoading) {
    return <div className="flex min-h-dvh w-full items-center justify-center bg-slate-50 px-4 font-semibold text-indigo-600 dark:bg-slate-900 dark:text-indigo-300" role="status">Memuat autentikasi...</div>;
  }

  if (auth.error) {
    return <div className="flex min-h-dvh w-full items-center justify-center bg-slate-50 px-4 text-center text-red-700 dark:bg-slate-900 dark:text-red-300" role="alert">Autentikasi gagal: {auth.error.message}</div>;
  }

  if (!auth.isAuthenticated) {
    return (
      <div className="flex min-h-dvh w-full flex-col items-center justify-center bg-slate-50 px-4 py-8 dark:bg-slate-900">
        <div className="flex w-full max-w-sm flex-col items-center rounded-xl border border-slate-200 bg-white p-6 shadow-xl sm:p-8 dark:border-slate-700 dark:bg-slate-800">
          <img src="/assets/images/logo-porprov.png" alt="PORPROV XV Jawa Barat 2026" className="mb-6 size-24 object-contain" />
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Portal PORPROV</h1>
          <p className="text-slate-500 dark:text-slate-400 mb-8 text-center">Silakan masuk menggunakan akun panitia/koresponden Anda.</p>
          <button 
            onClick={() => auth.signinRedirect()} 
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 px-4 rounded-md transition-colors flex items-center justify-center"
          >
            Masuk dengan SSO
          </button>
        </div>
      </div>
    );
  }

  return (
    <Router>
      <AdminLayout auth={auth}>
        <Suspense fallback={<div className="flex min-h-64 items-center justify-center" role="status"><span className="size-8 animate-spin rounded-full border-4 border-indigo-200 border-t-indigo-600 dark:border-slate-700 dark:border-t-indigo-400" aria-hidden="true" /><span className="sr-only">Memuat halaman Admin</span></div>}>
          <Routes>
          <Route path="/" element={<DashboardOverview />} />
          <Route path="/master-data" element={<MasterData />} />
          <Route path="/hero" element={<HeroManagement />} />
          <Route path="/livescore" element={<LiveScoreCenter />} />
          <Route path="/audit-log" element={<AuditLog />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/medals" element={<Medals />} />
          <Route path="/city-guide" element={<CityGuide />} />
          <Route path="/media" element={<MediaLibrary />} />
          <Route path="/verifikasi" element={<Medals />} />
          <Route path="/user-management" element={<UserManagement />} />
          <Route path="*" element={<section className="rounded-xl border border-slate-200 bg-white p-8 text-center shadow-sm dark:border-slate-700 dark:bg-slate-900"><h1 className="text-2xl font-black">Halaman tidak ditemukan</h1><p className="mt-2 text-slate-600 dark:text-slate-400">Kembali ke dashboard untuk melanjutkan pekerjaan.</p><Link to="/" className="mt-5 inline-flex min-h-11 items-center rounded-md bg-indigo-600 px-5 font-bold text-white hover:bg-indigo-700">Kembali ke Dashboard</Link></section>} />
          </Routes>
        </Suspense>
      </AdminLayout>
    </Router>
  );
}
