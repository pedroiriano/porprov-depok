import { BadgeCheck, ExternalLink, KeyRound, Mail, ShieldCheck, User } from 'lucide-react';
import { useAuth } from 'react-oidc-context';
import { AdminEmptyState, AdminPageHeader } from '../components/cuba/AdminPrimitives';
import { getRealmRoles } from '../lib/auth';

function IdentityField({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800/70">
      <div className="flex items-start gap-3"><span className="grid size-10 shrink-0 place-items-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-200">{icon}</span><div className="min-w-0"><dt className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-300">{label}</dt><dd className="mt-1 break-words font-black text-slate-950 dark:text-white">{value}</dd></div></div>
    </div>
  );
}

export default function Profile() {
  const auth = useAuth();
  if (!auth.isAuthenticated) return <div className="rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900"><AdminEmptyState icon={User} title="Sesi belum tersedia" description="Silakan masuk kembali untuk melihat profil akun." /></div>;

  const profile = auth.user?.profile;
  const roles = getRealmRoles(auth.user);
  const username = String(profile?.preferred_username || profile?.name || 'Pengguna');
  const displayName = String(profile?.name || profile?.preferred_username || 'Pengguna PORPROV');
  const email = String(profile?.email || 'Surel belum tersedia');
  const accountUrl = `${(import.meta.env.VITE_OIDC_AUTHORITY || 'http://localhost:8080/realms/porprov').replace(/\/$/, '')}/account/`;
  const initials = displayName.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part.charAt(0)).join('').toUpperCase() || 'U';

  return (
    <div className="flex flex-col gap-6">
      <AdminPageHeader eyebrow="Identitas operator" title="Profil Akun" description="Informasi ini berasal dari sesi OIDC Keycloak. Perubahan identitas dan keamanan akun dilakukan melalui Account Console." />

      <div className="grid gap-6 xl:grid-cols-[minmax(260px,0.55fr)_minmax(0,1.45fr)]">
        <aside className="h-fit rounded-2xl border border-slate-200 bg-white p-5 text-center shadow-sm dark:border-slate-700 dark:bg-slate-900">
          <div className="mx-auto grid size-24 place-items-center rounded-3xl bg-blue-600 text-3xl font-black text-white shadow-lg shadow-blue-600/20" aria-hidden="true">{initials}</div>
          <h2 className="mt-4 break-words text-xl font-black text-slate-950 dark:text-white">{displayName}</h2>
          <p className="mt-1 break-all text-sm text-slate-500 dark:text-slate-300">@{username}</p>
          <span className="mt-4 inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-black text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-200"><BadgeCheck className="size-4" aria-hidden="true" />Terautentikasi via Keycloak</span>
          <a href={accountUrl} target="_blank" rel="noopener noreferrer" className="mt-5 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 text-sm font-black text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-slate-900"><KeyRound className="size-4" aria-hidden="true" />Manajemen Akun<ExternalLink className="size-3.5" aria-hidden="true" /></a>
          <p className="mt-3 text-xs leading-relaxed text-slate-500 dark:text-slate-400">Account Console dibuka pada tab baru. Portal Admin tidak menyimpan ulang password Anda.</p>
        </aside>

        <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6 dark:border-slate-700 dark:bg-slate-900" aria-labelledby="identity-title">
          <div><h2 id="identity-title" className="text-lg font-black text-slate-950 dark:text-white">Informasi identitas</h2><p className="mt-1 text-sm text-slate-500 dark:text-slate-300">Claim yang aman untuk ditampilkan dari sesi pengguna aktif.</p></div>
          <dl className="mt-5 grid gap-4 sm:grid-cols-2">
            <IdentityField icon={<User className="size-5" aria-hidden="true" />} label="Nama pengguna" value={username} />
            <IdentityField icon={<Mail className="size-5" aria-hidden="true" />} label="Surel" value={email} />
          </dl>

          <div className="mt-6 border-t border-slate-200 pt-5 dark:border-slate-700">
            <h3 className="flex items-center gap-2 font-black text-slate-950 dark:text-white"><ShieldCheck className="size-5 text-blue-600 dark:text-blue-300" aria-hidden="true" />Peran aktif</h3>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-300">Hak akses akun selalu diperiksa kembali pada setiap tindakan.</p>
            {roles.length > 0 ? <ul className="mt-4 flex flex-wrap gap-2" aria-label="Daftar peran akun">{roles.map((role) => <li key={role} className="rounded-full border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-black text-blue-700 dark:border-blue-800 dark:bg-blue-950/50 dark:text-blue-200">{role}</li>)}</ul> : <p className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm font-bold text-amber-900 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-100">Tidak ada realm role aplikasi pada sesi ini.</p>}
          </div>
        </section>
      </div>
    </div>
  );
}
