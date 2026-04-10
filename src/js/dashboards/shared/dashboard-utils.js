/**
 * @fileoverview Shared dashboard utilities — ECharts setup, colors, formatters, scroll reveal
 * @description Extracted from food-insecurity.js for reuse across all dashboard pages.
 */

// Tree-shaken ECharts imports
import * as echarts from 'echarts/core';
import {
  MapChart, BarChart, LineChart, ScatterChart,
  PieChart, RadarChart, SankeyChart, SunburstChart, GaugeChart, ThemeRiverChart
} from 'echarts/charts';
import {
  TitleComponent,
  TooltipComponent,
  VisualMapComponent,
  GeoComponent,
  GridComponent,
  LegendComponent,
  DataZoomComponent,
  RadarComponent,
  MarkLineComponent,
  MarkAreaComponent,
  SingleAxisComponent
} from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers';

// Register all needed components
echarts.use([
  MapChart, BarChart, LineChart, ScatterChart,
  PieChart, RadarChart, SankeyChart, SunburstChart, GaugeChart, ThemeRiverChart,
  TitleComponent, TooltipComponent, VisualMapComponent,
  GeoComponent, GridComponent, LegendComponent, DataZoomComponent,
  RadarComponent, MarkLineComponent, MarkAreaComponent, SingleAxisComponent,
  CanvasRenderer
]);

// Re-export echarts for page-specific code (registerMap, graphic.LinearGradient, etc.)
export { echarts };

// -- Theme colors matching FNF design tokens --
export const COLORS = {
  primary: '#0176d3',
  secondary: '#00d4ff',
  accent: '#ff6b35',
  text: '#ffffff',
  textMuted: 'rgba(255,255,255,0.65)',
  cardBg: 'rgba(255,255,255,0.06)',
  gridLine: 'rgba(255,255,255,0.08)',
  mapBorder: 'rgba(255,255,255,0.7)',
  mapBorderWidth: 1.5,
  countyBorder: 'rgba(255,255,255,0.55)',
  countyBorderWidth: 1,
  // Legacy map colors (kept for backward compat)
  mapLow: '#2ecc71',
  mapMid: '#f39c12',
  mapHigh: '#e74c3c'
};

// Shared ECharts legend text style — keeps font sizing consistent across all
// dashboards. Audit P3-05: previously inconsistent (10px / 11px / unset).
export const LEGEND_TEXT_STYLE = {
  color: COLORS.text,
  fontSize: 11
};

// Per-dashboard map palettes — each dashboard gets a unique color identity
export const MAP_PALETTES = {
  insecurity: { low: '#60a5fa', mid: '#fbbf24', high: '#ef4444' },  // blue → amber → red
  access:     { low: '#2dd4bf', mid: '#fcd34d', high: '#ea580c' },  // teal → gold → burnt orange
  snap:       { low: '#ef4444', mid: '#fbbf24', high: '#22c55e' },  // red → amber → green (danger to safe)
  prices:     { low: '#3b82f6', mid: '#fbbf24', high: '#ef4444' },  // blue → amber → red (affordable to expensive)
  banks:      { low: '#f59e0b', mid: '#0d9488', high: '#2563eb' }   // amber → teal → blue (sparse to dense)
};

// Shared tooltip styling
export const TOOLTIP_STYLE = {
  backgroundColor: 'rgba(10,10,30,0.92)',
  borderColor: COLORS.secondary,
  borderWidth: 1,
  textStyle: { color: COLORS.text, fontSize: 13 }
};

// US Census region mapping
export const REGIONS = {
  Northeast: ['Connecticut','Maine','Massachusetts','New Hampshire','New Jersey','New York','Pennsylvania','Rhode Island','Vermont'],
  Midwest: ['Illinois','Indiana','Iowa','Kansas','Michigan','Minnesota','Missouri','Nebraska','North Dakota','Ohio','South Dakota','Wisconsin'],
  South: ['Alabama','Arkansas','Delaware','District of Columbia','Florida','Georgia','Kentucky','Louisiana','Maryland','Mississippi','North Carolina','Oklahoma','South Carolina','Tennessee','Texas','Virginia','West Virginia'],
  West: ['Alaska','Arizona','California','Colorado','Hawaii','Idaho','Montana','Nevada','New Mexico','Oregon','Utah','Washington','Wyoming']
};

// P2-25: Bright saturated region palette — used for ECharts legends, scatter plots,
// and region chips. There is a SECOND, DESATURATED palette exported as
// `HEATMAP_REGION_COLORS` from shared/d3-heatmap.js specifically for the D3
// heatmap tiles, where the brighter swatches here would clash with the 7-stop
// value gradient. Do NOT consolidate the two without also re-tuning the heatmap.
export const REGION_COLORS = {
  Northeast: '#60a5fa',
  Midwest: '#f59e0b',
  South: '#f87171',
  West: '#34d399'
};

export function getRegion(stateName) {
  for (const [region, states] of Object.entries(REGIONS)) {
    if (states.includes(stateName)) return region;
  }
  return 'South';
}

// -- Linear regression + correlation for scatter plots --
export function linearRegression(points) {
  const n = points.length;
  if (n < 2) return { slope: 0, intercept: 0, r: 0 };
  const sumX = points.reduce((s, p) => s + p[0], 0);
  const sumY = points.reduce((s, p) => s + p[1], 0);
  const sumXY = points.reduce((s, p) => s + p[0] * p[1], 0);
  const sumXX = points.reduce((s, p) => s + p[0] * p[0], 0);
  const sumYY = points.reduce((s, p) => s + p[1] * p[1], 0);
  const denom = n * sumXX - sumX * sumX;
  const slope = denom ? (n * sumXY - sumX * sumY) / denom : 0;
  const intercept = (sumY - slope * sumX) / n;
  const rNum = n * sumXY - sumX * sumY;
  const rDen = Math.sqrt((n * sumXX - sumX * sumX) * (n * sumYY - sumY * sumY));
  const r = rDen ? rNum / rDen : 0;
  return { slope, intercept, r };
}

// Chart instances for cleanup
const charts = [];

// Format large numbers
export function fmtNum(n) {
  if (n >= 1e9) return (n / 1e9).toFixed(1) + 'B';
  if (n >= 1e6) return (n / 1e6).toFixed(1) + 'M';
  if (n >= 1e3) return (n / 1e3).toFixed(0) + 'K';
  return n.toLocaleString();
}

// -- Animated hero counters --
export function animateCounters() {
  const counters = document.querySelectorAll('.dashboard-stat__number');

  // Respect reduced motion — show final values immediately
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    counters.forEach(el => {
      const target = parseFloat(el.dataset.target);
      const suffix = el.dataset.suffix || '';
      const prefix = el.dataset.prefix || '';
      el.textContent = prefix + target + suffix;
    });
    return;
  }

  counters.forEach(el => {
    const target = parseFloat(el.dataset.target);
    const suffix = el.dataset.suffix || '';
    const prefix = el.dataset.prefix || '';
    const isInteger = Number.isInteger(target);
    const duration = 2000;
    const start = performance.now();

    el.setAttribute('aria-live', 'off');

    function tick(now) {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      // Ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = isInteger ? Math.round(target * eased) : (target * eased).toFixed(1);
      el.textContent = prefix + current + suffix;

      if (progress < 1) {
        requestAnimationFrame(tick);
      } else {
        el.textContent = prefix + target + suffix;
        // P2-09: role="status" is now static in HTML; only flip aria-live back on
        // so the final value announces without spamming the screen reader every tick.
        el.setAttribute('aria-live', 'polite');
      }
    }
    requestAnimationFrame(tick);
  });
}

// -- Create chart with shared defaults --
export function createChart(containerId) {
  const container = document.getElementById(containerId);
  if (!container) return null;
  const chart = echarts.init(container, null, { renderer: 'canvas' });
  chart.setOption({ aria: { enabled: true, decal: { show: false } } });
  charts.push(chart);
  return chart;
}

// -- Get existing chart instance or create a new one (safe for re-renders) --
// P2-23: Lifted from food-access.js for shared use across dashboards.
export function getOrCreateChart(containerId) {
  const el = document.getElementById(containerId);
  if (!el) return null;
  return echarts.getInstanceByDom(el) || createChart(containerId);
}

// -- Dispose all chart instances (call on page unload to free memory) --
export function disposeAllCharts() {
  charts.forEach(c => {
    try { c.dispose(); } catch { /* already disposed */ }
  });
  charts.length = 0;
}

// Auto-cleanup on page navigation or browser close
if (typeof window !== 'undefined') {
  window.addEventListener('pagehide', disposeAllCharts, { once: true });
}

// -- Update data freshness indicator --
export function updateFreshness(source, info) {
  const el = document.getElementById(`freshness-${source}`);
  if (!el) return;
  el.classList.remove('freshness--static', 'freshness--cached', 'freshness--live');
  if (info?._static) {
    el.textContent = `Data: ${info._dataYear || 'Static'}`;
    el.classList.add('freshness--static');
  } else if (info?._stale) {
    el.textContent = 'Cached';
    el.classList.add('freshness--cached');
  } else {
    el.textContent = 'Live';
    el.classList.add('freshness--live');
  }
}

// -- Scroll Reveal (IntersectionObserver) --
export function initScrollReveal() {
  const elements = document.querySelectorAll('.scroll-reveal');
  if (!elements.length) return;

  // Respect reduced motion
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    elements.forEach(el => el.classList.add('is-visible'));
    return;
  }

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target); // Only animate once
      }
    });
  }, {
    threshold: 0.15,
    rootMargin: '0px 0px -50px 0px'
  });

  elements.forEach(el => observer.observe(el));
}

// -- Responsive resize (debounced) --
let resizeTimer = null;
export function handleResize() {
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(() => charts.forEach(c => c.resize()), 150);
}

// -- Fetch with fallback: try live API, fall back to static JSON --
export async function fetchWithFallback(liveUrl, staticUrl) {
  try {
    const res = await fetch(liveUrl);
    if (res.ok) {
      const data = await res.json();
      if (!data.error) return { data, source: 'live' };
    }
  } catch { /* live API unavailable */ }

  // Fallback to static
  const res = await fetch(staticUrl);
  if (!res.ok) throw new Error(`Failed to load ${staticUrl}`);
  return { data: await res.json(), source: 'static' };
}

// -- NTEE code descriptions (for nonprofit directory/profile) --
export const NTEE_MAP = {
  K: 'Food, Agriculture & Nutrition',
  K20: 'Agricultural Programs',
  K25: 'Farmland Preservation',
  K26: 'Community Gardens',
  K30: 'Food Programs',
  K31: 'Food Banks & Food Pantries',
  K34: 'Congregate Meals',
  K35: 'Soup Kitchens',
  K36: 'Meals on Wheels',
  K40: 'Nutrition Programs',
  P: 'Human Services',
  P20: 'Human Service Organizations',
  P60: 'Emergency Assistance',
  P600: 'Emergency Assistance',
  T: 'Philanthropy & Voluntarism',
  T70: 'Federated Giving Programs',
  X: 'Religion-Related',
  X20: 'Christian',
  X21: 'Protestant'
};

export function getNteeName(code) {
  if (!code) return 'Nonprofit';
  const clean = code.replace(/Z$/, '');
  if (NTEE_MAP[clean]) return NTEE_MAP[clean];
  const prefix = clean.charAt(0);
  if (NTEE_MAP[prefix]) return NTEE_MAP[prefix];
  return code;
}

export function isFoodRelated(code) {
  if (!code) return false;
  return code.startsWith('K');
}

export const US_STATES = [
  ['AL','Alabama'],['AK','Alaska'],['AZ','Arizona'],['AR','Arkansas'],['CA','California'],
  ['CO','Colorado'],['CT','Connecticut'],['DE','Delaware'],['DC','District of Columbia'],
  ['FL','Florida'],['GA','Georgia'],['HI','Hawaii'],['ID','Idaho'],['IL','Illinois'],
  ['IN','Indiana'],['IA','Iowa'],['KS','Kansas'],['KY','Kentucky'],['LA','Louisiana'],
  ['ME','Maine'],['MD','Maryland'],['MA','Massachusetts'],['MI','Michigan'],['MN','Minnesota'],
  ['MS','Mississippi'],['MO','Missouri'],['MT','Montana'],['NE','Nebraska'],['NV','Nevada'],
  ['NH','New Hampshire'],['NJ','New Jersey'],['NM','New Mexico'],['NY','New York'],
  ['NC','North Carolina'],['ND','North Dakota'],['OH','Ohio'],['OK','Oklahoma'],['OR','Oregon'],
  ['PA','Pennsylvania'],['RI','Rhode Island'],['SC','South Carolina'],['SD','South Dakota'],
  ['TN','Tennessee'],['TX','Texas'],['UT','Utah'],['VT','Vermont'],['VA','Virginia'],
  ['WA','Washington'],['WV','West Virginia'],['WI','Wisconsin'],['WY','Wyoming']
];

// -- CSV Data Export Utility --
export function exportCSV(filename, headers, rows) {
  const escape = v => {
    const s = String(v ?? '');
    return s.includes(',') || s.includes('"') || s.includes('\n') ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const csv = [headers.map(escape).join(','), ...rows.map(r => r.map(escape).join(','))].join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function addExportButton(containerId, filename, getDataFn) {
  const container = document.getElementById(containerId);
  if (!container) return;
  const card = container.closest('.dashboard-card');
  if (!card) return;
  const header = card.querySelector('.dashboard-card__header');
  if (!header) return;

  // Don't add duplicate buttons
  if (header.querySelector('.dashboard-export-btn')) return;

  const btn = document.createElement('button');
  btn.className = 'dashboard-export-btn';
  btn.textContent = 'CSV';
  btn.title = 'Export chart data as CSV';
  btn.setAttribute('aria-label', `Export ${filename} data as CSV`);
  btn.addEventListener('click', () => {
    const { headers, rows } = getDataFn();
    exportCSV(filename, headers, rows);
  });
  header.appendChild(btn);
}

// -- State Profile Deep-Dive Selector --
// Moved to ./state-selector.js per audit P3-12. Re-exported here for any
// external consumer that still imports from dashboard-utils.js (the five
// dashboard modules import from state-selector.js directly).
export { getSelectedState, initStateSelector } from './state-selector.js';
