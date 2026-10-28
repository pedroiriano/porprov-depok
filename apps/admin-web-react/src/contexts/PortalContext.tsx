import { type ReactNode } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from 'react-oidc-context';
import { apiClient } from '../lib/api';
import { useLocation } from '../lib/router';
import { getRealmRoles } from '../lib/auth';
import { useAuthorization } from './authorization';
import { PortalAdminContext,usePortalAdmin,adminModuleForPath } from './portal';
import { localModule,type PortalConfig } from '../../../../packages/portal-config/config';

export function PortalAdminProvider({children}:{children:ReactNode}){
 const query=useQuery({queryKey:['portal-publication'],queryFn:async({signal})=>(await apiClient.get<PortalConfig>('/portal/public',{signal})).data,refetchInterval:15000,refetchOnWindowFocus:true,retry:1});
 return <PortalAdminContext.Provider value={{config:query.data??null,loading:query.isPending,error:query.isError,refresh:()=>void query.refetch()}}>{children}</PortalAdminContext.Provider>;
}
export function PortalAdminGate({children}:{children:ReactNode}){
 const {config,loading,error,refresh}=usePortalAdmin();
 const module=adminModuleForPath(useLocation().pathname);
 if(!module)return children;
 if(loading)return <div role="status" className="p-8">Memeriksa ketersediaan modul...</div>;
 if(error||!config)return <div role="alert" className="p-8"><p>Pengaturan portal belum dapat diperiksa.</p><button type="button" className="mt-4 min-h-11 rounded-xl bg-blue-600 px-5 font-bold text-white" onClick={refresh}>Coba lagi</button></div>;
 if(!localModule(config,module,true))return <section className="rounded-2xl border border-slate-300 bg-white p-8 text-slate-950 dark:border-slate-700 dark:bg-slate-900 dark:text-white"><h1 className="text-2xl font-black">Modul tidak dikelola di portal ini</h1><p className="mt-3">Pengaturan portal menonaktifkan pengelolaan lokal. Data yang sudah ada tetap tersimpan dan dapat dipulihkan melalui Pengelolaan Portal oleh Administrator Utama.</p></section>;
 return children;
}
export function PortalOwnerGate({children}:{children:ReactNode}){const auth=useAuth();const access=useAuthorization();return access.active&&access.hasPermission('role.update')&&getRealmRoles(auth.user).includes('super_admin')?children:<section role="alert" className="p-8">Pengelolaan Portal hanya tersedia untuk Administrator Utama aktif.</section>;}
