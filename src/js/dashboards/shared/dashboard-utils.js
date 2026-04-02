/**
 * @fileoverview Shared dashboard utilities — ECharts setup, colors, formatters, scroll reveal
 * @description Extracted from food-insecurity.js for reuse across all dashboard pages.
 */

// Tree-shaken ECharts imports
import * as echarts from 'echarts/core';
import { MapChart, BarChart, LineChart, ScatterChart } from 'echarts/charts';
import {
  TitleComponent,
  TooltipComponent,
  VisualMapComponent,
  GeoComponent,
  GridComponent,
  LegendComponent,
  DataZoomComponent
} from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers';

// Register only what we need
echarts.use([
  MapChart, BarChart, LineChart, ScatterChart,
  TitleComponent, TooltipComponent, VisualMapComponent,
  GeoComponent, GridComponent, LegendComponent, DataZoomComponent,
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
  // Choropleth gradient (green = low insecurity → red = high)
  mapLow: '#2ecc71',
  mapMid: '#f39c12',
  mapHigh: '#e74c3c'
};

// Shared tooltip styling
export const TOOLTIP_STYLE = {
  backgroundColor: 'rgba(10,10,30,0.92)',
  borderColor: COLORS.secondary,
  borderWidth: 1,
  textStyle: { color: COLORS.text, fontSize: 13 }
};

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
