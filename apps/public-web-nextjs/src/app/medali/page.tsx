import { AlertTriangle, Medal, Trophy } from "lucide-react";
import { publicApiUrl, readPgNumber, readResourceId, resolvePublicAssetUrl, unwrapCollection } from "@/lib/public-api";

export const dynamic = "force-dynamic";

interface RawMedalStanding {
  id?: unknown;
  kontingen_id?: unknown;
  gold?: Parameters<typeof readPgNumber>[0];
  silver?: Parameters<typeof readPgNumber>[0];
  bronze?: Parameters<typeof readPgNumber>[0];
}

interface RawKontingen {
  id?: unknown;
  name?: string;
  logo_url?: Parameters<typeof resolvePublicAssetUrl>[0];
}

interface StandingViewModel {
  id: string;
  kontingenId: string;
  name: string;
  logoUrl: string;
  gold: number;
  silver: number;
  bronze: number;
  total: number;
}

async function getStandings(): Promise<{ data: StandingViewModel[]; error: string }> {
  try {
    const [medalsResponse, contingentsResponse] = await Promise.all([
      fetch(publicApiUrl("/medals/standings"), { cache: "no-store", headers: { Accept: "application/json" } }),
      fetch(publicApiUrl("/master-data/kontingens"), { cache: "no-store", headers: { Accept: "application/json" } }),
    ]);

    if (!medalsResponse.ok) {
      throw new Error(`Medal Standing Service merespons ${medalsResponse.status}`);
    }
    if (!contingentsResponse.ok) {
      throw new Error(`Master Data Service merespons ${contingentsResponse.status}`);
    }

    const medalsPayload: unknown = await medalsResponse.json();
    const contingentsPayload: unknown = await contingentsResponse.json();
    const contingents = unwrapCollection<RawKontingen>(contingentsPayload);
    const contingentMap = new Map(contingents.map((item, index) => {
      const id = readResourceId(item.id, `kontingen-${index}`);
      return [id, { name: item.name?.trim() || "Kontingen PORPROV", logoUrl: resolvePublicAssetUrl(item.logo_url) }];
    }));

    const data = unwrapCollection<RawMedalStanding>(medalsPayload).map((item, index) => {
      const kontingenId = readResourceId(item.kontingen_id, `kontingen-${index}`);
      const contingent = contingentMap.get(kontingenId);
      const gold = readPgNumber(item.gold);
      const silver = readPgNumber(item.silver);
      const bronze = readPgNumber(item.bronze);
      return {
        id: readResourceId(item.id, `standing-${index}`),
        kontingenId,
        name: contingent?.name || "Kontingen PORPROV",
        logoUrl: contingent?.logoUrl || "",
        gold,
        silver,
        bronze,
        total: gold + silver + bronze,
      };
    });

    data.sort((left, right) => right.gold - left.gold || right.silver - left.silver || right.bronze - left.bronze || left.name.localeCompare(right.name, "id"));
    return { data, error: "" };
  } catch (cause) {
    return {
      data: [],
      error: cause instanceof Error ? cause.message : "Data klasemen belum dapat dimuat.",
    };
  }
}

export default async function MedaliPage() {
  const { data: standings, error } = await getStandings();

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8">
        <div className="flex items-center gap-3">
          <span className="flex size-11 items-center justify-center rounded-full bg-amber-100 text-amber-600 dark:bg-amber-950/50 dark:text-amber-300" aria-hidden="true"><Trophy className="size-5" /></span>
          <h1 className="text-3xl font-extrabold tracking-tight">Klasemen Medali</h1>
        </div>
        <p className="mt-3 text-slate-500 dark:text-slate-400">Perolehan medali resmi kontingen PORPROV XV Jawa Barat 2026.</p>
      </div>

      {error ? (
        <div className="flex items-start gap-3 rounded-2xl border border-amber-300 bg-amber-50 p-5 text-amber-950 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-100" role="alert">
          <AlertTriangle className="mt-0.5 size-5 shrink-0" aria-hidden="true" />
          <div><h2 className="font-black">Pembaruan klasemen tertunda</h2><p className="mt-1 text-sm leading-relaxed">{error}. Pastikan migration dan Medal Standing Service telah berjalan.</p></div>
        </div>
      ) : standings.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-6 py-16 text-center dark:border-slate-700 dark:bg-slate-900/60">
          <span className="mx-auto flex size-16 items-center justify-center rounded-full bg-amber-500/10 text-amber-500"><Medal className="size-8" aria-hidden="true" /></span>
          <h2 className="mt-5 text-xl font-black">Klasemen belum tersedia</h2>
          <p className="mx-auto mt-2 max-w-lg text-slate-500 dark:text-slate-400">Data akan tampil setelah hasil medali pertama disahkan oleh panitia.</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-lg dark:border-slate-800 dark:bg-slate-900">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] border-collapse text-left">
              <caption className="sr-only">Klasemen perolehan medali kontingen PORPROV XV Jawa Barat 2026</caption>
              <thead>
                <tr className="border-b border-slate-200 bg-slate-100 text-sm uppercase tracking-wider text-slate-500 dark:border-slate-800 dark:bg-slate-900/80 dark:text-slate-400">
                  <th scope="col" className="w-20 p-5 text-center font-semibold">Peringkat</th>
                  <th scope="col" className="p-5 font-semibold">Kontingen</th>
                  <th scope="col" className="p-5 text-center font-semibold"><span aria-hidden="true">🥇</span><span className="sr-only">Emas</span></th>
                  <th scope="col" className="p-5 text-center font-semibold"><span aria-hidden="true">🥈</span><span className="sr-only">Perak</span></th>
                  <th scope="col" className="p-5 text-center font-semibold"><span aria-hidden="true">🥉</span><span className="sr-only">Perunggu</span></th>
                  <th scope="col" className="p-5 text-center font-semibold">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {standings.map((item, index) => (
                  <tr key={item.id} className={`transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/50 ${index === 0 ? "bg-amber-50/60 dark:bg-amber-950/15" : ""}`}>
                    <td className="p-5 text-center font-black"><span className={`mx-auto flex size-9 items-center justify-center rounded-full ${index === 0 ? "bg-amber-100 text-amber-800" : "text-slate-500 dark:text-slate-400"}`}>{index + 1}</span></td>
                    <th scope="row" className="p-5">
                      <div className="flex items-center gap-4">
                        <span className="flex size-11 shrink-0 items-center justify-center overflow-hidden rounded-full border border-slate-200 bg-white text-sm font-black text-slate-500 dark:border-slate-700 dark:bg-slate-800">
                          {item.logoUrl ? (
                            // PERFORMANCE: Host asset Media Library ditentukan saat runtime.
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={item.logoUrl} alt="" loading="lazy" className="h-full w-full object-contain p-1" />
                          ) : item.name.charAt(0)}
                        </span>
                        <span className="text-lg font-black">{item.name}</span>
                      </div>
                    </th>
                    <td className="p-5 text-center text-xl font-black">{item.gold}</td>
                    <td className="p-5 text-center text-lg font-bold text-slate-700 dark:text-slate-300">{item.silver}</td>
                    <td className="p-5 text-center text-lg font-bold text-slate-500 dark:text-slate-400">{item.bronze}</td>
                    <td className="bg-slate-50 p-5 text-center text-2xl font-black text-primary-600 dark:bg-slate-950/30 dark:text-primary-300">{item.total}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
