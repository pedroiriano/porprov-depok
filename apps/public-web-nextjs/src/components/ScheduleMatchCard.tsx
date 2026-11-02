"use client";

import { PortalLink as Link, usePortalConfig } from './PortalProvider';
import {portalTarget} from '../../../../packages/portal-config/config';
import { CalendarDays, Clock3, MapPin } from "lucide-react";
import type { EnrichedMatch } from "@/lib/public-models";
import {matchStatusLabel} from '../../../../packages/portal-config/schedule-calendar';

interface ScheduleMatchCardProps {
  match: EnrichedMatch;
  compact?: boolean;
}

const statusStyles: Record<string, string> = {
  live: "bg-red-100 text-red-700 dark:bg-red-950/60 dark:text-red-300",
  ongoing: "bg-red-100 text-red-700 dark:bg-red-950/60 dark:text-red-300",
  finished: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300",
  completed: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300",
  selesai: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300",
};

export function ScheduleMatchCard({ match, compact = false }: ScheduleMatchCardProps) {
  const portal=usePortalConfig();
  const caborPath=match.caborId?`/cabor/${encodeURIComponent(match.caborId)}`:'';
  const venuePath=match.venueId?`/venue/${encodeURIComponent(match.venueId)}`:'';
  // INFO: Disabled destination modules must not hide the read-only Cabor/location names needed by Jadwal.
  const caborLink=portal&&caborPath&&portalTarget(portal,caborPath);
  const venueLink=portal&&venuePath&&portalTarget(portal,venuePath);
  const date = match.matchDate ? new Date(match.matchDate) : null;
  const validDate = date && !Number.isNaN(date.getTime()) ? date : null;
  const participants = match.participants.slice(0, 2);
  const statusKey = match.status.toLowerCase();

  return (
    <article className="h-full min-w-0 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:border-primary-300 hover:shadow-md dark:border-slate-800 dark:bg-slate-900">
      <div className={`flex h-full min-w-0 flex-col gap-5 ${compact ? "p-4 sm:p-5" : "p-5 sm:p-6"}`}>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex min-w-0 flex-1 items-start gap-3">
            <span className="flex size-11 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-primary-500/10 text-primary-600 dark:text-primary-300">
              {match.caborIconUrl ? (
                // PERFORMANCE: Ikon Media Library ditentukan pada runtime.
                // eslint-disable-next-line @next/next/no-img-element
                <img src={match.caborIconUrl} alt="" loading="lazy" decoding="async" className="size-7 object-contain" />
              ) : <i className="ri-medal-line text-xl" aria-hidden="true" />}
            </span>
            <div className="min-w-0">
              {caborLink ? (
                <Link href={caborPath} className="inline-flex min-h-11 items-center break-words font-black text-slate-900 hover:text-primary-600 dark:text-white dark:hover:text-primary-300">{match.caborName}</Link>
              ) : <p className="font-black">{match.caborName}</p>}
              <p className="mt-1 break-words font-bold text-slate-800 dark:text-slate-100">{match.nomorTandingName}</p>
              <p className="mt-1 break-words text-sm text-slate-600 dark:text-slate-300">{match.round}</p>
            </div>
          </div>
          <span className={`shrink-0 rounded-full px-3 py-1 text-xs font-black ${statusStyles[statusKey] || "bg-primary-500/10 text-primary-700 dark:text-primary-300"}`}>{matchStatusLabel(match.status)}</span>
        </div>

        <div className="grid gap-2 rounded-xl bg-slate-50 p-4 dark:bg-slate-800/60">
          {(participants.length ? participants : [{ id: "tba-1", display_name: "Peserta menunggu konfirmasi" }, { id: "tba-2", display_name: "Lawan menunggu konfirmasi" }]).map((participant) => (
            <div key={participant.id} className="flex items-center gap-3">
              <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-white text-xs font-black text-slate-500 shadow-sm dark:bg-slate-700 dark:text-slate-300">{participant.display_name.charAt(0)}</span>
              <span className="min-w-0 break-words font-bold text-slate-800 dark:text-slate-100">{participant.display_name}</span>
            </div>
          ))}
        </div>

        <dl className="mt-auto grid gap-3 border-t border-slate-200 pt-4 text-sm text-slate-600 sm:grid-cols-2 dark:border-slate-700 dark:text-slate-300">
          <div className="flex items-start gap-2">
            {validDate ? <CalendarDays className="mt-0.5 size-4 shrink-0 text-primary-500" aria-hidden="true" /> : <Clock3 className="mt-0.5 size-4 shrink-0 text-primary-500" aria-hidden="true" />}
            <div className="min-w-0"><dt className="sr-only">Waktu</dt><dd>{validDate ? `${validDate.toLocaleString("id-ID", { weekday: "short", day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit", timeZone: "Asia/Jakarta" })} WIB` : "Waktu menyusul"}</dd></div>
          </div>
          <div className="flex items-start gap-2 sm:justify-end">
            <MapPin className="mt-0.5 size-4 shrink-0 text-primary-500" aria-hidden="true" />
            <div className="min-w-0 break-words"><dt className="sr-only">Lokasi</dt><dd>{venueLink ? <Link href={venuePath} className="inline-flex min-h-11 items-center hover:text-primary-600 dark:hover:text-primary-300">{match.venueName}</Link> : match.venueName}</dd></div>
          </div>
        </dl>
      </div>
    </article>
  );
}
