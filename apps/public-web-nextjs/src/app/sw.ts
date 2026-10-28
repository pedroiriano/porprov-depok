import { defaultCache } from "@serwist/next/worker";
import type { PrecacheEntry, SerwistGlobalConfig } from "serwist";
import { Serwist,NetworkOnly } from "serwist";

// This declares the value of `injectionPoint` to TypeScript.
// `injectionPoint` is the string that points to where the precache manifest should be injected.
declare global {
  interface WorkerGlobalScope extends SerwistGlobalConfig {
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined;
  }
}

declare const self: ServiceWorkerGlobalScope;

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: true,
  // SECURITY: Never resurrect disabled pages or protected/configuration API responses from a runtime cache.
  runtimeCaching: [{matcher:({request,url})=>request.mode==='navigate'||url.pathname.startsWith('/api/')||request.headers.get('accept')?.includes('text/x-component')===true,handler:new NetworkOnly()},...defaultCache],
});

serwist.addEventListeners();
