import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Database, Activity, FileCheck, ShieldAlert, LogOut, Menu, User, Bell } from 'lucide-react';
import { useState } from 'react';

// Mockup Pages
import DashboardOverview from './pages/DashboardOverview';
import MasterData from './pages/MasterData';
import LiveScoreCenter from './pages/LiveScoreCenter';
import AuditLog from './pages/AuditLog';

// Sidebar Item Component
const SidebarItem = ({ icon: Icon, label, path, isActive }: { icon: any, label: string, path: string, isActive: boolean }) => (
  <Link to={path} className={`flex items-center gap-3 px-4 py-3 mx-2 rounded-lg transition-colors ${isActive ? 'bg-primary-50 text-primary-600 font-semibold' : 'text-text-secondary hover:bg-slate-50'}`}>
    <Icon className={`w-5 h-5 ${isActive ? 'text-primary-600' : 'text-slate-400'}`} />
    <span>{label}</span>
  </Link>
);

// Admin Layout
const AdminLayout = ({ children }: { children: React.ReactNode }) => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const location = useLocation();

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
          <SidebarItem icon={FileCheck} label="Verifikasi" path="/verifikasi" isActive={location.pathname.startsWith('/verifikasi')} />
          <SidebarItem icon={ShieldAlert} label="Audit Log" path="/audit-log" isActive={location.pathname.startsWith('/audit-log')} />
        </div>

        <div className="p-4 border-t border-slate-100">
          <button className="flex items-center gap-3 px-4 py-2 w-full text-left text-danger-500 hover:bg-red-50 rounded-lg transition-colors">
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
          <div className="flex items-center gap-4">
            <button className="relative p-2 rounded-full text-slate-400 hover:bg-slate-100">
              <Bell className="w-5 h-5" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border border-white"></span>
            </button>
            <div className="flex items-center gap-3 border-l border-slate-200 pl-4">
              <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center">
                <User className="w-4 h-4 text-slate-500" />
              </div>
              <div className="hidden md:block text-sm">
                <p className="font-semibold text-text-primary leading-none mb-1">Admin Panitia</p>
                <p className="text-xs text-text-muted leading-none">Superadmin</p>
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
  return (
    <Router>
      <AdminLayout>
        <Routes>
          <Route path="/" element={<DashboardOverview />} />
          <Route path="/master-data" element={<MasterData />} />
          <Route path="/livescore" element={<LiveScoreCenter />} />
          <Route path="/audit-log" element={<AuditLog />} />
          <Route path="*" element={<div className="p-8 text-center text-slate-500">Halaman sedang dalam pengembangan.</div>} />
        </Routes>
      </AdminLayout>
    </Router>
  );
}

export default App;
