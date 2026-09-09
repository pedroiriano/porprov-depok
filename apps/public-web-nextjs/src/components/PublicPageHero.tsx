import Link from "next/link";

interface BreadcrumbItem {
  href?: string;
  label: string;
}

interface PublicPageHeroProps {
  eyebrow: string;
  title: string;
  description: string;
  icon?: string;
  breadcrumbs?: BreadcrumbItem[];
  children?: React.ReactNode;
}

export function PublicPageHero({
  eyebrow,
  title,
  description,
  icon = "ri-trophy-line",
  breadcrumbs = [],
  children,
}: PublicPageHeroProps) {
  return (
    <section className="relative isolate overflow-hidden bg-slate-950 pb-16 pt-32 text-white md:pb-20 md:pt-40">
      <div className="absolute inset-0 -z-20 bg-[radial-gradient(circle_at_20%_20%,rgba(14,165,233,0.28),transparent_34%),radial-gradient(circle_at_80%_0%,rgba(245,158,11,0.18),transparent_30%)]" aria-hidden="true" />
      <div className="absolute inset-0 -z-10 opacity-20 [background-image:linear-gradient(rgba(255,255,255,.08)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.08)_1px,transparent_1px)] [background-size:44px_44px]" aria-hidden="true" />
      <div className="container relative">
        {breadcrumbs.length > 0 && (
          <nav aria-label="Breadcrumb" className="mb-8">
            <ol className="flex flex-wrap items-center gap-2 text-sm font-bold text-slate-300">
              <li><Link href="/" className="inline-flex min-h-11 items-center hover:text-white">Beranda</Link></li>
              {breadcrumbs.map((item, index) => (
                <li key={`${item.label}-${index}`} className="flex items-center gap-2">
                  <i className="ri-arrow-right-s-line text-slate-500" aria-hidden="true" />
                  {item.href ? (
                    <Link href={item.href} className="inline-flex min-h-11 items-center hover:text-white">{item.label}</Link>
                  ) : (
                    <span aria-current="page" className="text-white">{item.label}</span>
                  )}
                </li>
              ))}
            </ol>
          </nav>
        )}

        <div className="grid items-end gap-8 lg:grid-cols-[minmax(0,1fr)_auto]">
          <div className="max-w-4xl">
            <p className="inline-flex items-center gap-2 text-sm font-black uppercase tracking-[0.2em] text-sky-300">
              <i className={`${icon} text-lg`} aria-hidden="true" />
              {eyebrow}
            </p>
            <h1 className="mt-4 text-4xl font-black leading-tight tracking-[-0.035em] sm:text-5xl lg:text-6xl">{title}</h1>
            <p className="mt-5 max-w-3xl text-base leading-8 text-slate-200 md:text-lg">{description}</p>
          </div>
          {children && <div className="flex flex-wrap items-center gap-3 lg:justify-end">{children}</div>}
        </div>
      </div>
    </section>
  );
}
