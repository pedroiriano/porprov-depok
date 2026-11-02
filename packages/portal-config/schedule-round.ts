// INFO: Presets are suggestions, not sport rules; existing canonical values stay unchanged.
export const scheduleRounds = [
  {value:'kualifikasi',label:'Kualifikasi'},
  {value:'penyisihan',label:'Penyisihan'},
  {value:'babak_grup',label:'Babak Grup'},
  {value:'64_besar',label:'64 Besar'},
  {value:'32_besar',label:'32 Besar'},
  {value:'16_besar',label:'16 Besar'},
  {value:'perempat_final',label:'Perempat Final'},
  {value:'semifinal',label:'Semifinal'},
  {value:'perebutan_juara_ketiga',label:'Perebutan Juara Ketiga'},
  {value:'final',label:'Final'},
  ...[1,2,3,4].map(round=>({value:`putaran_${round}`,label:`Putaran ${round}`})),
  {value:'putaran_tambahan',label:'Putaran Tambahan (Play-off)'},
] as const;

export function scheduleRoundLabel(value: string): string {
  return scheduleRounds.find(round=>round.value===value)?.label || value;
}

export function scheduleRoundError(value: string): string {
  const round=value.trim();
  // SECURITY: Match PostgreSQL varchar(50) in Unicode characters and reject invisible control/format characters.
  return !round || [...round].length>50 || /[\p{Cc}\p{Cf}\p{Cs}]/u.test(round)
    ? 'Isi babak dengan 1–50 karakter tanpa karakter kontrol.' : '';
}
