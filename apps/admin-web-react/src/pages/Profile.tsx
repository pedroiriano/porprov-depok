import { useAuth } from "react-oidc-context";
import { User, Mail, Shield, Key } from "lucide-react";
import { getRealmRoles } from '../lib/auth';

export default function Profile() {
  const auth = useAuth();

  if (!auth.isAuthenticated) {
    return <div className="text-slate-500 dark:text-slate-400">Silakan login.</div>;
  }

  // INFO: Use getRealmRoles to parse from both ID token and Access Token
  const roles = getRealmRoles(auth.user);

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white dark:bg-slate-900 p-8 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800">
        <h1 className="text-2xl font-bold mb-6 flex items-center gap-2 text-slate-800 dark:text-white">
          <User className="text-indigo-600" /> Profil Pengguna
        </h1>
        
        <div className="flex flex-col md:flex-row gap-8">
          <div className="flex-1 space-y-6">
            <div>
              <label className="block text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">Nama Pengguna (Username)</label>
              <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-100 dark:border-slate-700/50">
                <User className="w-5 h-5 text-slate-400" />
                <span className="font-medium text-slate-900 dark:text-white">{auth.user?.profile.preferred_username || auth.user?.profile.name}</span>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">Email</label>
              <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-100 dark:border-slate-700/50">
                <Mail className="w-5 h-5 text-slate-400" />
                <span className="font-medium text-slate-900 dark:text-white">{auth.user?.profile.email || "Tidak ada email"}</span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">Peran (Role)</label>
              <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-100 dark:border-slate-700/50">
                <Shield className="w-5 h-5 text-slate-400" />
                <div className="flex gap-2">
                  {roles && roles.length > 0 ? (
                    roles.map((role: string) => (
                      <span key={role} className="px-2 py-1 bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400 text-xs font-bold rounded">
                        {role}
                      </span>
                    ))
                  ) : (
                    <span className="font-medium text-slate-900 dark:text-white">User Standar</span>
                  )}
                </div>
              </div>
            </div>
          </div>
          
          <div className="w-full md:w-64">
            <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-100 dark:border-slate-700/50 flex flex-col items-center text-center">
              <div className="w-24 h-24 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-full flex items-center justify-center text-4xl font-bold mb-4">
                {String(auth.user?.profile.preferred_username || "U").charAt(0).toUpperCase()}
              </div>
              <h3 className="font-bold text-lg text-slate-900 dark:text-white">{auth.user?.profile.name || auth.user?.profile.preferred_username}</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">Terautentikasi via Keycloak</p>
              
              <button 
                onClick={() => window.open('http://localhost:8080/realms/porprov/account/', '_blank')} 
                className="w-full py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center justify-center gap-2 transition-colors"
              >
                <Key className="w-4 h-4" /> Manajemen Akun
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
