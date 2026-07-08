import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Database, Activity, FileCheck, ShieldAlert, LogOut, Menu, User, Bell } from 'lucide-react';
import { useState } from 'react';
import { useAuth } from 'react-oidc-context';

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
  <Link to={path} className={`flex items-center gap-3 px-4 py-3 mx-2 rounded-lg transition-colors ${isActive ? 'bg-primary-50 text-primary-600 font-semibold' : 'text-text-secondary hover:bg-slate-50'}`}>
    <Icon className={`w-5 h-5 ${isActive ? 'text-primary-600' : 'text-slate-400'}`} />
    <span>{label}</span>
  </Link>
);

// Admin Layout
const AdminLayout = ({ children, auth }: { children: React.ReactNode, auth: any }) => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const location = useLocation();

  // Parsing roles
  const roles = auth.user?.profile?.realm_access ? (auth.user.profile.realm_access as any).roles : [];
  const isAdmin = roles.includes('admin') || roles.includes('superadmin');

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden w-full">
      {/* Sidebar */}
      <aside className={`bg-white border-r border-slate-200 flex flex-col transition-all duration-300 ${sidebarOpen ? 'w-64' : 'w-0 -translate-x-full lg:translate-x-0 lg:w-20'} shrink-0 absolute lg:relative z-20 h-full`}>
        <div className="h-16 flex items-center px-6 border-b border-slate-100">
          <div className="w-8 h-8 rounded-md bg-primary-600 flex items-center justify-center font-bold text-white shrink-0">
            P
          </div>
          <span className={`ml-3 font-bold text-lg whitespace-nowrap transition-opacity ${!sidebarOpen ? 'lg:opacity-0 lg:w-0' : 'opacity-100'}`}>PORPROV Admin</span>
        </div>
        
        <div className="flex-1 overflow-y-auto py-4 flex flex-col gap-1">
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
        </div>

        <div className="p-4 border-t border-slate-100">
          <button onClick={() => auth.signoutRedirect()} className="flex items-center gap-3 px-4 py-2 w-full text-left text-danger-500 hover:bg-red-50 rounded-lg transition-colors">
            <LogOut className="w-5 h-5" />
            <span className={`${!sidebarOpen ? 'lg:hidden' : ''}`}>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Header */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 lg:px-8 shrink-0 z-10">
          <div className="flex items-center gap-4">
            <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-2 rounded-md text-slate-500 hover:bg-slate-100 focus:outline-none">
              <Menu className="w-5 h-5" />
            </button>
            <h1 className="text-xl font-bold text-text-primary capitalize">
              {location.pathname === '/' ? 'Dashboard' : location.pathname.split('/')[1].replace('-', ' ')}
            </h1>
          </div>
          <div className="flex items-center gap-4 relative">
            <button 
              onClick={() => {
                const el = document.getElementById('notification-dropdown');
                if (el) el.classList.toggle('hidden');
              }}
              className="relative p-2 rounded-full text-slate-400 hover:bg-slate-100"
            >
              <Bell className="w-5 h-5" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border border-white"></span>
            </button>
            <div id="notification-dropdown" className="hidden absolute top-12 right-0 w-80 bg-white border border-slate-200 rounded-xl shadow-lg z-50 overflow-hidden">
              <div className="px-4 py-3 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
                <h3 className="font-bold text-sm text-text-primary">Notifikasi</h3>
                <span className="text-xs text-primary-600 font-medium cursor-pointer">Tandai semua dibaca</span>
              </div>
              <div className="max-h-64 overflow-y-auto">
                <div className="px-4 py-3 border-b border-slate-50 hover:bg-slate-50 transition-colors">
                  <p className="text-sm font-medium text-text-primary">Selamat datang di Portal PORPROV</p>
                  <p className="text-xs text-text-muted mt-1">Sistem berhasil dikonfigurasi dan siap digunakan.</p>
                </div>
                <div className="px-4 py-3 hover:bg-slate-50 transition-colors">
                  <p className="text-sm font-medium text-text-primary">Perubahan Jadwal: Final Sepak Bola</p>
                  <p className="text-xs text-text-muted mt-1">Admin telah memindahkan jadwal final ke Stadion Merpati.</p>
                </div>
              </div>
              <div className="px-4 py-2 border-t border-slate-100 text-center">
                <span className="text-xs text-primary-600 font-medium cursor-pointer">Lihat semua notifikasi</span>
              </div>
            </div>
            <div className="flex items-center gap-3 border-l border-slate-200 pl-4 relative cursor-pointer"
                 onClick={() => {
                   const el = document.getElementById('user-dropdown');
                   if (el) el.classList.toggle('hidden');
                 }}>
              <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center font-bold text-slate-600">
                {String(auth.user?.profile.preferred_username || "U").charAt(0).toUpperCase()}
              </div>
              <div className="hidden md:block text-sm">
                <p className="font-semibold text-text-primary leading-none mb-1">{auth.user?.profile.preferred_username || auth.user?.profile.name}</p>
                <p className="text-xs text-text-muted leading-none">{isAdmin ? 'Admin' : 'Koresponden'}</p>
              </div>
              
              <div id="user-dropdown" className="hidden absolute top-12 right-0 w-48 bg-white border border-slate-200 rounded-xl shadow-lg z-50 overflow-hidden">
                <div className="px-4 py-2 border-b border-slate-100 hover:bg-slate-50">
                  <a href="http://localhost:8080/realms/porprov/account/" target="_blank" rel="noreferrer" className="text-sm text-text-primary block w-full text-left">Manajemen Akun</a>
                </div>
                <div className="px-4 py-2 hover:bg-red-50">
                  <button onClick={() => auth.signoutRedirect()} className="text-sm text-danger-500 font-medium block w-full text-left">Logout</button>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
          {children}
        </main>
      </div>

      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-slate-900/50 z-10 lg:hidden" onClick={() => setSidebarOpen(false)}></div>
      )}
    </div>
  );
};

function App() {
  const auth = useAuth();

  switch (auth.activeNavigator) {
      case "signinSilent":
          return <div className="h-screen flex items-center justify-center">Signing in...</div>;
      case "signoutRedirect":
          return <div className="h-screen flex items-center justify-center">Signing out...</div>;
  }

  if (auth.isLoading) {
      return <div className="h-screen flex items-center justify-center text-primary-600 font-bold">Memuat...</div>;
  }

  if (auth.error) {
      return <div className="p-8 text-red-500">Oops... {auth.error.message}</div>;
  }

  if (!auth.isAuthenticated) {
      return (
        <div className="h-screen w-full flex items-center justify-center bg-slate-50">
          <div className="glass-card bg-white p-8 border border-slate-200 rounded-2xl max-w-sm w-full text-center">
            <div className="w-16 h-16 bg-primary-600 rounded-2xl mx-auto mb-6 flex items-center justify-center text-white text-2xl font-black">
              P
            </div>
            <h1 className="text-2xl font-bold mb-2">PORPROV XV Admin</h1>
            <p className="text-slate-500 mb-8">Masuk ke Portal Manajemen</p>
            <button 
              onClick={() => void auth.signinRedirect()} 
              className="w-full bg-primary-600 hover:bg-primary-700 text-white font-semibold py-3 px-4 rounded-xl transition-colors"
            >
              Login via Keycloak
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
          <Route path="/medals" element={<Medals />} />
          <Route path="/city-guide" element={<CityGuide />} />
          <Route path="/audit-log" element={<AuditLog />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="*" element={<div className="p-8 text-center text-slate-500">Halaman sedang dalam pengembangan.</div>} />
        </Routes>
      </AdminLayout>
    </Router>
  );
}

export default App;
