import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Database, Activity, FileCheck, ShieldAlert, LogOut, Menu, User, Bell, Moon, Sun } from 'lucide-react';
import { useState } from 'react';
import { useAuth } from 'react-oidc-context';
import { useTheme } from './components/ThemeProvider';

// Mockup Pages
import DashboardOverview from './pages/DashboardOverview';
import MasterData from './pages/MasterData';
import LiveScoreCenter from './pages/LiveScoreCenter';
import AuditLog from './pages/AuditLog';
import Profile from './pages/Profile';
import Medals from './pages/Medals';
import CityGuide from './pages/CityGuide';

// Sidebar Item Component
const SidebarItem = ({ icon: Icon, label, path, isActive }: { icon: any, label: string, path: string, isActive: boolean }) => (
  <li className={isActive ? 'active' : ''}>
    <Link to={path}>
      <Icon className="w-5 h-5 align-middle me-2 inline-block" />
      {label}
    </Link>
  </li>
);

// Admin Layout
const AdminLayout = ({ children, auth }: { children: React.ReactNode, auth: any }) => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const location = useLocation();
  const { theme, setTheme } = useTheme();

  // Parsing roles
  const roles = auth.user?.profile?.realm_access ? (auth.user.profile.realm_access as any).roles : [];
  const isAdmin = roles.includes('admin') || roles.includes('superadmin');

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);

  return (
    <div className={`page-wrapper ${sidebarOpen ? 'toggled' : ''}`}>
      {/* sidebar-wrapper */}
      <nav id="sidebar" className="sidebar-wrapper sidebar-dark">
        <div className="sidebar-content">
          <div className="sidebar-brand">
            <Link to="/"><img src="/assets/images/logo-porprov-dan-tulisan.png" height="24" className="h-8 object-contain brightness-0 invert" alt="Logo" /></Link>
          </div>
          
          <ul className="sidebar-menu border-t border-white/10" style={{ height: 'calc(100% - 70px)' }}>
            <SidebarItem icon={LayoutDashboard} label="Dashboard" path="/" isActive={location.pathname === '/'} />
            <SidebarItem icon={Database} label="Master Data" path="/master-data" isActive={location.pathname.startsWith('/master-data')} />
            <SidebarItem icon={Activity} label="LiveScore Center" path="/livescore" isActive={location.pathname.startsWith('/livescore')} />
            <SidebarItem icon={Activity} label="Perolehan Medali" path="/medals" isActive={location.pathname.startsWith('/medals')} />
            <SidebarItem icon={Database} label="City Guide" path="/city-guide" isActive={location.pathname.startsWith('/city-guide')} />
            {isAdmin && (
              <>
                <SidebarItem icon={FileCheck} label="Verifikasi" path="/verifikasi" isActive={location.pathname.startsWith('/verifikasi')} />
                <SidebarItem icon={ShieldAlert} label="Audit Log" path="/audit-log" isActive={location.pathname.startsWith('/audit-log')} />
              </>
            )}
            <SidebarItem icon={User} label="Profil Akun" path="/profile" isActive={location.pathname === '/profile'} />
          </ul>
        </div>
      </nav>
      {/* sidebar-wrapper */}

      {/* page-content */}
      <main className="page-content bg-slate-50 dark:bg-slate-800">
        {/* Top Header */}
        <div className="top-header">
          <div className="header-bar flex justify-between">
            <div className="flex items-center space-x-1">
              <a href="#" className="sidebar-collapse" onClick={(e) => { e.preventDefault(); toggleSidebar(); }}>
                <i className="ri-menu-line text-2xl align-middle text-slate-800 dark:text-white"></i>
              </a>
            </div>

            <ul className="list-none mb-0 space-x-1">
              <li className="dropdown inline-block relative">
                <button 
                  onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                  className="dropdown-toggle size-8 inline-flex items-center justify-center tracking-wide align-middle duration-500 text-[20px] text-center bg-gray-50 dark:bg-slate-800 hover:bg-gray-100 dark:hover:bg-slate-700 border border-gray-100 dark:border-gray-800 text-slate-900 dark:text-white rounded-full"
                >
                  <i className={theme === 'dark' ? "ri-sun-line text-yellow-500" : "ri-moon-line"}></i>
                </button>
              </li>

              <li className="dropdown inline-block relative">
                <button 
                  onClick={() => {
                    const el = document.getElementById('notification-dropdown');
                    if (el) el.classList.toggle('hidden');
                  }}
                  className="dropdown-toggle size-8 inline-flex items-center justify-center tracking-wide align-middle duration-500 text-[20px] text-center bg-gray-50 dark:bg-slate-800 hover:bg-gray-100 dark:hover:bg-slate-700 border border-gray-100 dark:border-gray-800 text-slate-900 dark:text-white rounded-full"
                >
                  <i className="ri-notification-3-line"></i>
                  <span className="absolute top-0 right-0 flex items-center justify-center bg-red-600 text-white text-[10px] font-bold rounded-full size-2 after:content-[''] after:absolute after:h-2 after:w-2 after:bg-red-600 after:top-0 after:right-0 after:rounded-full after:animate-ping"></span>
                </button>
                <div id="notification-dropdown" className="dropdown-menu absolute right-0 mt-3 w-64 bg-white dark:bg-slate-900 shadow-md dark:shadow-gray-800 rounded-md z-10 hidden">
                  <div className="p-4 border-b border-gray-100 dark:border-gray-800">
                    <h6 className="mb-0 text-slate-900 dark:text-white">Notifications</h6>
                  </div>
                  <div className="p-4">
                    <p className="text-slate-400 text-sm">Tidak ada notifikasi baru</p>
                  </div>
                </div>
              </li>

              <li className="dropdown inline-block relative">
                <button 
                  onClick={() => {
                    const el = document.getElementById('profile-dropdown');
                    if (el) el.classList.toggle('hidden');
                  }}
                  className="dropdown-toggle items-center"
                >
                  <span className="size-8 inline-flex items-center justify-center tracking-wide align-middle duration-500 text-[20px] text-center bg-gray-50 dark:bg-slate-800 hover:bg-gray-100 dark:hover:bg-slate-700 border border-gray-100 dark:border-gray-800 text-slate-900 dark:text-white rounded-full"><i className="ri-user-line"></i></span>
                </button>
                <div id="profile-dropdown" className="dropdown-menu absolute right-0 mt-3 w-44 bg-white dark:bg-slate-900 shadow-md dark:shadow-gray-800 rounded-md z-10 hidden">
                  <ul className="py-2 text-left">
                    <li>
                      <Link to="/profile" className="flex items-center font-medium py-1 px-4 dark:text-white/70 hover:text-primary dark:hover:text-white"><i className="ri-user-line me-2"></i>Profile</Link>
                    </li>
                    <li className="border-t border-gray-100 dark:border-gray-800 my-2"></li>
                    <li>
                      <button onClick={() => auth.signoutRedirect()} className="flex items-center font-medium py-1 px-4 dark:text-white/70 hover:text-primary dark:hover:text-white w-full text-left"><i className="ri-logout-circle-line me-2"></i>Logout</button>
                    </li>
                  </ul>
                </div>
              </li>
            </ul>
          </div>
        </div>
        {/* Top Header */}

        <div className="container-fluid relative px-3">
          <div className="layout-specing">
            {children}
          </div>
        </div>
      </main>
      {/* page-content */}
    </div>
  );
};

export default function App() {
  const auth = useAuth();
  
  if (auth.isLoading) {
    return <div className="h-screen w-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900 text-primary">Loading Auth...</div>;
  }

  if (auth.error) {
    return <div className="h-screen w-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900 text-red-500">Auth Error: {auth.error.message}</div>;
  }

  if (!auth.isAuthenticated) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-900">
        <div className="p-8 bg-white dark:bg-slate-800 shadow-xl rounded-2xl flex flex-col items-center max-w-sm w-full">
          <img src="/assets/images/logo-porprov.png" alt="Logo" className="w-24 h-24 mb-6" />
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Portal PORPROV</h1>
          <p className="text-slate-500 dark:text-slate-400 mb-8 text-center">Silakan masuk menggunakan akun panitia/koresponden Anda.</p>
          <button 
            onClick={() => auth.signinRedirect()} 
            className="w-full bg-primary-600 hover:bg-primary-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors flex items-center justify-center"
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
        <Routes>
          <Route path="/" element={<DashboardOverview />} />
          <Route path="/master-data" element={<MasterData />} />
          <Route path="/livescore" element={<LiveScoreCenter />} />
          <Route path="/audit-log" element={<AuditLog />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/medals" element={<Medals />} />
          <Route path="/city-guide" element={<CityGuide />} />
          <Route path="/verifikasi" element={<div><h1>Verifikasi Kontingen & Atlet</h1></div>} />
        </Routes>
      </AdminLayout>
    </Router>
  );
}
