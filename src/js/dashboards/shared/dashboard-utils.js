/**
 * @fileoverview Shared dashboard utilities — ECharts setup, colors, formatters, scroll reveal
 * @description Extracted from food-insecurity.js for reuse across all dashboard pages.
 */

// Tree-shaken ECharts imports
import * as echarts from 'echarts/core';
import {
  MapChart, BarChart, LineChart, ScatterChart,
  PieChart, RadarChart, SankeyChart, SunburstChart, TreemapChart
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
  MarkAreaComponent
} from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers';

// Register all needed components
echarts.use([
  MapChart, BarChart, LineChart, ScatterChart,
  PieChart, RadarChart, SankeyChart, SunburstChart, TreemapChart,
  TitleComponent, TooltipComponent, VisualMapComponent,
  GeoComponent, GridComponent, LegendComponent, DataZoomComponent,
  RadarComponent, MarkLineComponent, MarkAreaComponent,
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
  counters.forEach(el => {
    const target = parseFloat(el.dataset.target);
    const suffix = el.dataset.suffix || '';
    const duration = 2000;
    const start = performance.now();

    el.setAttribute('aria-live', 'off');

    function tick(now) {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      // Ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = (target * eased).toFixed(1);
      el.textContent = current + suffix;

      if (progress < 1) {
        requestAnimationFrame(tick);
      } else {
        el.textContent = target + suffix;
        el.setAttribute('role', 'status');
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
  charts.push(chart);
  return chart;
}

// -- Update data freshness indicator --
export function updateFreshness(source, info) {
  const el = document.getElementById(`freshness-${source}`);
  if (!el) return;
  if (info._cached) {
    const cachedDate = new Date(info._cachedAt || info.fetchedAt);
    const age = Math.round((Date.now() - cachedDate.getTime()) / 3600000);
    el.textContent = `Cached ${age}h ago`;
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

// -- Responsive resize --
export function handleResize() {
  charts.forEach(c => c.resize());
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
