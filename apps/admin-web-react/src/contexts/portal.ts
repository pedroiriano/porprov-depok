import {createContext,useContext} from 'react';
import type {PortalConfig} from '../../../../packages/portal-config/config';
export const PortalAdminContext=createContext<{config:PortalConfig|null;loading:boolean;error:boolean;refresh:()=>void}>({config:null,loading:true,error:false,refresh:()=>{}});
export const usePortalAdmin=()=>useContext(PortalAdminContext);
export const adminModuleForPath=(path:string)=>path==='/hero'?'home':path.startsWith('/livescore')?'livescore':path.startsWith('/medals')||path.startsWith('/verifikasi')?'medali':path.startsWith('/city-guide')?'city_guide':null;
