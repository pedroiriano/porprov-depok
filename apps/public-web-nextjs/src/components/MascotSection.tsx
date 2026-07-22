import Image from "next/image";

const mascots = [
  {
    name: "Toca",
    tagline: "Semangat Juang dan Prestasi",
    image: "/assets/images/maskot-toca.png",
    imageAlt: "Toca, maskot merah PORPROV XV Jawa Barat 2026 Kota Depok",
    accent: "red",
    values: [
      "Merah melambangkan keberanian, daya saing, dan energi sportivitas.",
      "Postur tegas mencerminkan ketangguhan, disiplin, dan kesiapan bertanding.",
      "Ekspresi ceria menghadirkan kompetisi yang sehat dan menggembirakan.",
    ],
    closing: "Simbol atlet berprestasi yang pantang menyerah dan menjunjung tinggi fair play.",
  },
  {
    name: "Toci",
    tagline: "Sportivitas dan Keharmonisan",
    image: "/assets/images/maskot-toci.png",
    imageAlt: "Toci, maskot putih PORPROV XV Jawa Barat 2026 Kota Depok",
    accent: "sky",
    values: [
      "Putih melambangkan kejujuran, ketulusan, dan sikap adil.",
      "Gestur tangan menyatu mencerminkan rasa hormat, persaudaraan, dan persatuan.",
      "Ekspresi tenang menggambarkan kedewasaan dalam menang maupun kalah.",
    ],
    closing: "Simbol penyeimbang yang menjaga PORPROV dalam semangat persaudaraan.",
  },
] as const;

export function MascotSection() {
  return (
    <section id="maskot" className="relative scroll-mt-24 overflow-hidden bg-slate-950 py-16 text-white md:py-24" aria-labelledby="mascot-title">
      <div className="absolute inset-0 opacity-30 [background-image:radial-gradient(circle_at_1px_1px,rgba(148,163,184,0.28)_1px,transparent_0)] [background-size:24px_24px]" aria-hidden="true" />
      <div className="absolute -start-32 top-1/4 size-80 rounded-full bg-red-500/15 blur-3xl" aria-hidden="true" />
      <div className="absolute -end-32 bottom-0 size-80 rounded-full bg-sky-500/15 blur-3xl" aria-hidden="true" />

      <div className="container relative">
        <div className="mx-auto max-w-3xl text-center">
          <p className="mb-3 text-sm font-black uppercase tracking-[0.22em] text-sky-300">Maskot Resmi Kota Depok</p>
          <h2 id="mascot-title" className="text-3xl font-black tracking-tight sm:text-4xl md:text-5xl">Kenali Toca dan Toci.</h2>
          <p className="mx-auto mt-5 max-w-2xl text-base leading-8 text-slate-300 md:text-lg">
            Dua karakter yang membawa semangat prestasi, sportivitas, dan persaudaraan dalam PORPROV XV Jawa Barat 2026.
          </p>
        </div>

        <div className="mt-12 grid gap-7 lg:grid-cols-2">
          {mascots.map((mascot) => {
            const isToca = mascot.accent === "red";
            return (
              <article key={mascot.name} className={`group overflow-hidden rounded-[2rem] border bg-white text-slate-950 shadow-2xl transition duration-500 hover:-translate-y-1 dark:bg-slate-900 dark:text-white ${isToca ? "border-red-200/80 dark:border-red-900/70" : "border-sky-200/80 dark:border-sky-900/70"}`}>
                <div className={`relative min-h-[390px] overflow-hidden ${isToca ? "bg-gradient-to-br from-red-50 via-white to-red-100 dark:from-red-950 dark:via-slate-900 dark:to-red-950/60" : "bg-gradient-to-br from-sky-50 via-white to-blue-100 dark:from-sky-950 dark:via-slate-900 dark:to-blue-950/60"}`}>
                  <div className={`absolute start-6 top-6 rounded-full px-4 py-2 text-xs font-black uppercase tracking-[0.2em] ${isToca ? "bg-red-600 text-white" : "bg-sky-600 text-white"}`}>Maskot PORPROV XV</div>
                  <div className={`absolute bottom-8 start-1/2 size-64 -translate-x-1/2 rounded-full blur-2xl ${isToca ? "bg-red-400/25" : "bg-sky-400/25"}`} aria-hidden="true" />
                  <Image src={mascot.image} alt={mascot.imageAlt} fill sizes="(min-width: 1024px) 50vw, 100vw" className="object-contain object-bottom px-8 pt-16 transition duration-500 group-hover:scale-[1.03]" />
                </div>

                <div className="p-6 sm:p-8">
                  <div className="flex flex-wrap items-end justify-between gap-3">
                    <div>
                      <p className={`text-xs font-black uppercase tracking-[0.2em] ${isToca ? "text-red-600 dark:text-red-300" : "text-sky-600 dark:text-sky-300"}`}>{mascot.tagline}</p>
                      <h3 className="mt-1 text-4xl font-black tracking-tight">{mascot.name}</h3>
                    </div>
                    <span className={`flex size-12 items-center justify-center rounded-full text-2xl ${isToca ? "bg-red-500/10 text-red-600 dark:text-red-300" : "bg-sky-500/10 text-sky-600 dark:text-sky-300"}`} aria-hidden="true">
                      <i className={isToca ? "ri-fire-line" : "ri-team-line"} />
                    </span>
                  </div>

                  <ul className="mt-6 space-y-4">
                    {mascot.values.map((value) => (
                      <li key={value} className="flex gap-3 text-sm leading-7 text-slate-600 dark:text-slate-300 sm:text-base">
                        <span className={`mt-2.5 size-2 shrink-0 rounded-full ${isToca ? "bg-red-500" : "bg-sky-500"}`} aria-hidden="true" />
                        <span>{value}</span>
                      </li>
                    ))}
                  </ul>

                  <p className={`mt-6 rounded-2xl border-s-4 p-4 text-sm font-bold leading-7 sm:text-base ${isToca ? "border-red-500 bg-red-50 text-red-950 dark:bg-red-950/50 dark:text-red-100" : "border-sky-500 bg-sky-50 text-sky-950 dark:bg-sky-950/50 dark:text-sky-100"}`}>
                    {mascot.closing}
                  </p>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
