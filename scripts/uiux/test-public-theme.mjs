import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

const sourceRoot = new URL('../../apps/public-web-nextjs/src/', import.meta.url);
const read = (path) => readFileSync(new URL(path, sourceRoot), 'utf8');
const css = read('app/globals.css');
const navbar = read('components/Navbar.tsx');

// TEST: Measure canonical CSS tokens rather than a second palette maintained by tests.
function variables(selector) {
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const block = css.match(new RegExp(`${escaped}\\s*\\{([^}]+)\\}`));
  assert.ok(block, `Missing ${selector}`);
  return Object.fromEntries([...block[1].matchAll(/(--[\w-]+):\s*(#[\da-f]{6})/gi)]
    .map(([, name, value]) => [name, value]));
}

function luminance(hex) {
  const channels = hex.slice(1).match(/../g).map((part) => parseInt(part, 16) / 255);
  const linear = channels.map((value) => value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4);
  return linear.reduce((sum, value, index) => sum + value * [0.2126, 0.7152, 0.0722][index], 0);
}

function contrast(foreground, background) {
  const values = [luminance(foreground), luminance(background)].sort((a, b) => b - a);
  return (values[0] + 0.05) / (values[1] + 0.05);
}

for (const selector of ['#topnav', '.dark #topnav', '#topnav[data-appearance="overlay"]']) {
  test(`navbar text, active and controls meet AA: ${selector}`, () => {
    const palette = variables(selector);
    for (const [fg, bg, minimum] of [
      ['--nav-text', '--nav-surface', 4.5],
      ['--nav-accent', '--nav-surface', 4.5],
      ['--nav-accent', '--nav-control', 3],
    ]) {
      assert.ok(contrast(palette[fg], palette[bg]) >= minimum, `${selector}: ${fg}/${bg}`);
    }
  });
}

test('navigation overrides late vendor important colors and transparent background', () => {
  assert.match(css, /#topnav \.navigation-menu > li > \.sub-menu-item\s*\{\s*color: var\(--nav-text\) !important/);
  assert.match(css, /\.sub-menu-item:focus-visible\s*\{\s*color: var\(--nav-accent\) !important/);
  assert.match(css, /#topnav\[data-appearance\]\s*\{[^}]*background-color: var\(--nav-surface\)/);
  assert.doesNotMatch(navbar, /navigation-menu[^"\n]*nav-light/);
});

test('initial theme, restored scroll, active route and keyboard menu remain canonical', () => {
  assert.match(navbar, /resolvedTheme: theme/);
  assert.match(navbar, /setIsSticky\(window.scrollY >= 50\)/);
  assert.match(navbar, /data-appearance=\{isHomePage && !isSticky \? 'overlay' : 'surface'\}/);
  assert.match(navbar, /pathname\.startsWith\(`\$\{href\}\//);
  assert.match(navbar, /event\.key === "Escape"/);
  assert.match(navbar, /aria-expanded=\{isOpen\}/);
  assert.match(navbar, /disabled=\{!mounted\}/);
  assert.match(css, /@custom-variant dark \(&:is\(\.dark, \.dark \*\)\)/);
});

test('search placeholders meet AA in both themes, including reference stylesheet defaults', () => {
  for (const selector of [':root', '.dark']) {
    const palette = variables(selector);
    for (const background of ['--bg-base', '--bg-surface']) {
      assert.ok(contrast(palette['--text-muted'], palette[background]) >= 4.5, `${selector}: ${background}`);
    }
  }
  assert.match(css, /html:root :is\(input, textarea\):not\(:disabled\)::placeholder\s*\{[^}]*opacity: 1/);
});

test('hero status badges use bounded dark surfaces in either theme', () => {
  for (const path of ['app/livescore/page.tsx', 'components/MedalStandings.tsx']) {
    const source = read(path);
    assert.match(source, /bg-emerald-950 text-emerald-200/);
    assert.match(source, /bg-amber-950 text-amber-200/);
  }
  const hero = read('components/HeroSection.tsx');
  const stops = [...hero.matchAll(/rgba\((\d+),(\d+),(\d+),(0\.\d+)\)_\d+%/g)];
  assert.equal(stops.length, 3);
  for (const [, r, g, b, alpha] of stops) {
    const worstBackground = '#' + [r, g, b].map((value) =>
      Math.round(Number(value) * Number(alpha) + 255 * (1 - Number(alpha)))
        .toString(16).padStart(2, '0')).join('');
    assert.ok(contrast('#e2e8f0', worstBackground) >= 4.5, 'Hero description over a white editorial image');
  }
});

test('venue summary labels are not muted on tinted light surfaces', () => {
  const detail = read('app/venue/[id]/page.tsx');
  for (const label of ['Kapasitas', 'Cabang olahraga', 'Jadwal aktif']) {
    assert.ok(detail.includes(`text-slate-600 dark:text-slate-400">${label}</dt>`), label);
  }
  const showcase = read('components/VenueShowcase.tsx');
  assert.ok(showcase.includes('text-emerald-800 dark:text-emerald-400'));
  assert.ok(showcase.includes('text-amber-800 dark:text-amber-400'));
  assert.ok(showcase.includes('text-slate-600 dark:text-slate-400">Menampilkan'));
});

test('interactive accent colors keep explicit dark counterparts', () => {
  for (const path of ['components/CaborDirectory.tsx', 'app/cabor/[id]/page.tsx', 'app/venue/[id]/page.tsx']) {
    assert.ok(read(path).includes('dark:hover:text-primary-300'), path);
  }
  assert.ok(read('components/VenueShowcase.tsx').includes('dark:text-primary-300 dark:hover:text-white'));
  assert.ok(read('app/city-guide/page.tsx').includes('group-hover:text-sky-700 dark:group-hover:text-sky-400'));
});
