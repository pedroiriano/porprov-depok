import baseline from './baseline.json' with {type:'json'};

export type PortalModule = { id: string; label: string; mode: 'local' | 'external' | 'disabled'; public_enabled: boolean; admin_enabled: boolean; external_url: string };
export type PortalFeature = {id:string;module_id:string;label:string;public_enabled:boolean;admin_enabled:boolean};
export type PortalSection = { id: string; type: string; enabled: boolean; variant: 'standard' | 'compact'; heading: string; body: string; href: string; image_url: string };
export type PortalPage = { id: string; path: string; title: string; description: string; status: 'published' | 'draft' | 'archived'; module_id: string; sections: PortalSection[] };
export type PortalMenu = { id: string; label: string; location: 'header' | 'footer-primary' | 'footer-info'; target: string; parent_id: string; enabled: boolean };
export type PortalConfig = { schema_version: number; version: number; modules: PortalModule[]; features:PortalFeature[]; pages: PortalPage[]; menus: PortalMenu[] };
export const defaultPortalConfig = baseline as PortalConfig;
// INFO: Existing inner pages retain one functional slot; editorial sections may surround it.
for(const page of defaultPortalConfig.pages)if(page.id!=='home'&&!page.sections.length)page.sections=[{id:'native',type:'content',enabled:true,variant:'standard',heading:'',body:'',href:'',image_url:''}];
export const localModule = (config: PortalConfig, id: string, admin = false) => config.modules.some(m => m.id === id && m.mode === 'local' && (admin ? m.admin_enabled : m.public_enabled));
export const localFeature = (config:PortalConfig,id:string,admin=false) => config.features?.some(f=>f.id===id&&localModule(config,f.module_id,admin)&&(admin?f.admin_enabled:f.public_enabled))??false;
export const sectionFeature = (type:string) => type==='schedule_periods'||type==='schedule_matches'?type:null;

// INFO: Interpret old personal drafts/history consistently with the server, without modifying originals.
export function normalizeLegacyPortalConfig(config:PortalConfig):PortalConfig {
  const copy=structuredClone(config);
  copy.features??=structuredClone(defaultPortalConfig.features);
  for(const page of copy.pages) {
    if(page.id!=='jadwal')continue;
    const templates=defaultPortalConfig.pages.find(p=>p.id==='jadwal')!.sections;
    const old=page.sections??[];const used=new Set(old.filter(s=>s.type!=='content').map(s=>s.id));
    page.sections=old.flatMap(s=>{
      if(s.type!=='content')return [s];
      return templates.map(template=>{const next={...template,enabled:s.enabled,variant:s.variant};for(let n=1;used.has(next.id);n++)next.id=`${template.id}-${n}`;used.add(next.id);return next;});
    });
    if(!old.length)page.sections=templates.map(s=>({...s,enabled:false}));
  }
  return copy;
}
export const portalPageFor = (config: PortalConfig, path: string) => config.pages.filter(p => p.path === path || p.path !== '/' && path.startsWith(`${p.path}/`)).sort((a,b) => b.path.length-a.path.length)[0];
export function portalTarget(config: PortalConfig, href: string): string | null {
  if (href.startsWith('https://')) return href;
  const path=href.split(/[?#]/)[0] || '/';
  const page=portalPageFor(config,path);
  if (!page || page.status !== 'published') return null;
  const module=config.modules.find(m=>m.id===page.module_id);
  if (module && (!module.public_enabled || module.mode==='disabled')) return null;
  if (module?.mode==='external') return module.external_url || null;
  const fragment=href.split('#')[1];
  const anchors: Record<string,string> = {'rentang-jadwal':'schedule_periods','rincian-pertandingan':'schedule_matches','tuan-rumah':'introduction',maskot:'mascot','tentang-porprov':'introduction',informasi:'information','panduan-penonton':'introduction'};
  if (fragment && anchors[fragment] && !page.sections.some(s=>s.type===anchors[fragment] && s.enabled)) return null;
  if(fragment&&anchors[fragment]){const feature=sectionFeature(anchors[fragment]);if(feature&&!localFeature(config,feature))return null;}
  return href;
}
export function portalMenus(config: PortalConfig, location: PortalMenu['location']) {
  return config.menus.filter(m=>m.enabled && m.location===location && portalTarget(config,m.target)).filter(m=>!m.parent_id || config.menus.some(p=>p.id===m.parent_id && p.enabled && portalTarget(config,p.target)));
}
