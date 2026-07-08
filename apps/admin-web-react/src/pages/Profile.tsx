import { useAuth } from "react-oidc-context";
import { User, Mail, Shield, Key } from "lucide-react";

export default function Profile() {
  const auth = useAuth();

  if (!auth.isAuthenticated) {
    return <div>Silakan login.</div>;
  }

  // Parses Keycloak roles if available
  const roles = auth.user?.profile?.realm_access 
    ? (auth.user?.profile?.realm_access as any).roles 
    : [];

  return (
    <div className="max-w-4xl mx-auto">
      <div className="glass-card bg-white p-8 border border-slate-200">
        <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
          <User className="text-primary-600" /> Profil Pengguna
        </h2>
        
        <div className="flex flex-col md:flex-row gap-8">
          <div className="flex-1 space-y-6">
            <div>
              <label className="block text-sm font-medium text-slate-500 mb-1">Nama Pengguna (Username)</label>
              <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg border border-slate-100">
                <User className="w-5 h-5 text-slate-400" />
                <span className="font-medium">{auth.user?.profile.preferred_username || auth.user?.profile.name}</span>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-500 mb-1">Email</label>
              <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg border border-slate-100">
                <Mail className="w-5 h-5 text-slate-400" />
                <span className="font-medium">{auth.user?.profile.email || "Tidak ada email"}</span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-500 mb-1">Peran (Role)</label>
              <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg border border-slate-100">
                <Shield className="w-5 h-5 text-slate-400" />
                <div className="flex gap-2">
                  {roles && roles.length > 0 ? (
                    roles.map((role: string) => (
                      <span key={role} className="px-2 py-1 bg-primary-100 text-primary-700 text-xs font-bold rounded">
                        {role}
                      </span>
                    ))
                  ) : (
                    <span className="font-medium">User Standar</span>
                  )}
                </div>
              </div>
            </div>
          </div>
          
          <div className="w-full md:w-64">
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 flex flex-col items-center text-center">
              <div className="w-24 h-24 bg-primary-100 text-primary-600 rounded-full flex items-center justify-center text-4xl font-bold mb-4">
                {String(auth.user?.profile.preferred_username || "U").charAt(0).toUpperCase()}
              </div>
              <h3 className="font-bold text-lg">{auth.user?.profile.name || auth.user?.profile.preferred_username}</h3>
              <p className="text-sm text-slate-500 mb-4">Terautentikasi via Keycloak</p>
              
              <button 
                onClick={() => auth.signinRedirect()} 
                className="w-full py-2 bg-white border border-slate-300 rounded-lg text-sm font-medium hover:bg-slate-50 flex items-center justify-center gap-2"
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
