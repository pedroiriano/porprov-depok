import type { ApexOptions } from 'apexcharts';
import type { Props as ReactApexChartProps } from 'react-apexcharts';
import { lazy, Suspense, useEffect, useMemo, useState, type ComponentType } from 'react';

const ApexChart = lazy(async () => {
  const module = await import('react-apexcharts');
  const exported = module.default as unknown;
  const component = typeof exported === 'function'
    ? exported
    : exported && typeof exported === 'object' && 'default' in exported && typeof exported.default === 'function'
      ? exported.default
      : null;

  // RELIABILITY: react-apexcharts 1.4.1 adalah CommonJS ber-`__esModule`.
  // Dynamic import pada build production dapat membungkus default dua kali;
  // normalisasi ini mencegah React menerima object module sebagai element type.
  if (!component) throw new Error('Komponen grafik Admin tidak tersedia');
  return { default: component as ComponentType<ReactApexChartProps> };
});

type ChartPoint = { label: string; value: number };

export function AdminChart({
  title,
  points,
  type = 'area',
  height = 240,
}: {
  title: string;
  points: ChartPoint[];
  type?: 'area' | 'bar' | 'line' | 'donut';
  height?: number;
}) {
  const [dark, setDark] = useState(() => document.documentElement.classList.contains('dark'));
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  useEffect(() => {
    const observer = new MutationObserver(() => setDark(document.documentElement.classList.contains('dark')));
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);

  const options = useMemo<ApexOptions>(() => ({
    chart: {
      id: title.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      background: dark ? '#0f172a' : '#ffffff',
      fontFamily: 'Nunito Variable, ui-sans-serif, system-ui',
      animations: { enabled: !reducedMotion },
      toolbar: { show: false },
      zoom: { enabled: false },
    },
    colors: ['#2563eb', '#10b981', '#f59e0b', '#7c3aed'],
    dataLabels: { enabled: false },
    fill: type === 'area' ? { type: 'gradient', gradient: { opacityFrom: 0.34, opacityTo: 0.04 } } : undefined,
    grid: { borderColor: dark ? '#334155' : '#e2e8f0', strokeDashArray: 4 },
    labels: type === 'donut' ? points.map((point) => point.label) : undefined,
    legend: { labels: { colors: dark ? '#e2e8f0' : '#334155' }, position: 'bottom' },
    stroke: { curve: 'smooth', width: 3 },
    theme: { mode: dark ? 'dark' : 'light' },
    tooltip: {
      theme: dark ? 'dark' : 'light',
      y: { formatter: (value: number) => `${value.toLocaleString('id-ID')} kunjungan` },
    },
    xaxis: type === 'donut' ? undefined : {
      categories: points.map((point) => point.label),
      labels: { style: { colors: dark ? '#cbd5e1' : '#64748b' } },
      axisBorder: { color: dark ? '#475569' : '#cbd5e1' },
    },
    yaxis: type === 'donut' ? undefined : {
      labels: { formatter: (value: number) => Math.round(value).toLocaleString('id-ID'), style: { colors: [dark ? '#cbd5e1' : '#64748b'] } },
    },
    noData: { text: 'Belum ada data untuk ditampilkan.' },
  }), [dark, points, reducedMotion, title, type]);

  if (points.length === 0) {
    return <p className="grid min-h-44 place-items-center text-center text-sm text-slate-500 dark:text-slate-300">Belum ada data untuk ditampilkan.</p>;
  }

  const series = type === 'donut'
    ? points.map((point) => point.value)
    : [{ name: 'Kunjungan', data: points.map((point) => point.value) }];

  return (
    <div role="img" aria-label={`${title}. ${points.map((point) => `${point.label}: ${point.value.toLocaleString('id-ID')}`).join(', ')}`}>
      <Suspense fallback={<div className="h-60 animate-pulse rounded-xl bg-slate-100 motion-reduce:animate-none dark:bg-slate-800" role="status" aria-label="Memuat grafik" />}>
        <ApexChart options={options} series={series} type={type} height={height} />
      </Suspense>
    </div>
  );
}
