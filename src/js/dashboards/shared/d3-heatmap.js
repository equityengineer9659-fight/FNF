/**
 * @fileoverview D3 Zoomable Heatmap — shared module for treemap-style heatmaps
 * @description Replaces ECharts treemaps with D3-powered zoomable heatmaps using
 *              a single continuous value gradient and subtle region grouping.
 */

import { treemap, hierarchy } from 'd3-hierarchy';
import { select } from 'd3-selection';
import { fmtNum } from './dashboard-utils.js';

// ═══════════════════════════════════════════════════════
//  THEME TOKENS
// ═══════════════════════════════════════════════════════

const THEME = {
  bgChart: '#080c16',
  tileRadius: 5,
  tileStroke: 'rgba(0,0,0,0.45)',
  tileStrokeWidth: 1,
  tileGap: 3,
  regionStrokeWidth: 1.5,
  regionStrokeOpacity: 0.62,
  regionRadius: 6,
  regionHeaderHeight: 28,
  hoverBrightness: 1.15,
  hoverShadow: '0 0 12px rgba(255,255,255,0.08)',
  tileDepthLight: 0.055,
  tileDepthDark: 0.055,
};

// ── Value gradient (7 stops, lifted low-end, vivid midtones) ──
const VALUE_STOPS = [
  [0.00, [49, 46, 129]],   // #312E81
  [0.20, [67, 56, 202]],   // #4338CA
  [0.40, [99, 102, 241]],  // #6366F1
  [0.55, [139, 92, 246]],  // #8B5CF6
  [0.70, [236, 72, 153]],  // #EC4899
  [0.85, [249, 115, 22]],  // #F97316
  [1.00, [253, 224, 71]],  // #FDE047
];

// ── Region accents — desaturated for secondary role ──
const HEATMAP_REGION_COLORS = {
  Northeast: '#93B8DE',
  Midwest:   '#D1B862',
  South:     '#D08A8A',
  West:      '#74BFA0',
};

// ═══════════════════════════════════════════════════════
//  COLOR ENGINE
// ═══════════════════════════════════════════════════════

function lerp3(a, b, f) {
  return [
    Math.round(a[0] + (b[0] - a[0]) * f),
    Math.round(a[1] + (b[1] - a[1]) * f),
    Math.round(a[2] + (b[2] - a[2]) * f)
  ];
}

function sampleGradient(t) {
  t = Math.max(0, Math.min(1, t));
  for (let i = 0; i < VALUE_STOPS.length - 1; i++) {
    const [t0, c0] = VALUE_STOPS[i];
    const [t1, c1] = VALUE_STOPS[i + 1];
    if (t >= t0 && t <= t1) {
      return lerp3(c0, c1, (t - t0) / (t1 - t0));
    }
  }
  return VALUE_STOPS[VALUE_STOPS.length - 1][1];
}

function tileGradientColors(t) {
  const rgb = sampleGradient(t);
  const taper = t > 0.6 ? 1 - (t - 0.6) * 1.5 : 1;
  const light = THEME.tileDepthLight * Math.max(0.35, taper);
  const dark = THEME.tileDepthDark * Math.max(0.35, taper);
  return {
    topColor: `rgb(${Math.min(255, Math.round(rgb[0] * (1 + light)))},${Math.min(255, Math.round(rgb[1] * (1 + light)))},${Math.min(255, Math.round(rgb[2] * (1 + light)))})`,
    botColor: `rgb(${Math.round(rgb[0] * (1 - dark))},${Math.round(rgb[1] * (1 - dark))},${Math.round(rgb[2] * (1 - dark))})`
  };
}

function relativeLuminance(t) {
  const rgb = sampleGradient(t);
  return (0.299 * rgb[0] + 0.587 * rgb[1] + 0.114 * rgb[2]) / 255;
}

function tileTextColor(t) {
  return relativeLuminance(t) > 0.6 ? '#111111' : '#FFFFFF';
}

function tileSubTextColor(t) {
  return relativeLuminance(t) > 0.6 ? 'rgba(17,17,17,0.65)' : 'rgba(255,255,255,0.8)';
}

function tileShadow(t) {
  return relativeLuminance(t) > 0.6 ? 'none' : '0 1px 2px rgba(0,0,0,0.3)';
}

// ═══════════════════════════════════════════════════════
//  TOOLTIP
// ═══════════════════════════════════════════════════════

let tooltipEl = null;

function ensureTooltip() {
  if (tooltipEl) return tooltipEl;
  tooltipEl = document.getElementById('d3-heatmap-tooltip');
  if (!tooltipEl) {
    tooltipEl = document.createElement('div');
    tooltipEl.id = 'd3-heatmap-tooltip';
    tooltipEl.style.cssText = `
      position:fixed;pointer-events:none;z-index:1000;max-width:320px;
      background:rgba(8,10,22,0.96);border:1px solid rgba(255,255,255,0.12);
      border-radius:10px;padding:14px 18px;font-size:13px;line-height:1.6;
      color:#E2E8F0;box-shadow:0 12px 40px rgba(0,0,0,0.5),0 0 0 1px rgba(255,255,255,0.04);
      opacity:0;transition:opacity 0.12s;font-family:'Inter','Segoe UI',system-ui,sans-serif;
    `;
    document.body.appendChild(tooltipEl);
  }
  return tooltipEl;
}

function showTooltip(e, html) {
  const tip = ensureTooltip();
  tip.innerHTML = html;
  tip.style.opacity = '1';
  tip.style.left = Math.min(e.clientX + 14, window.innerWidth - 340) + 'px';
  tip.style.top = Math.min(e.clientY - 10, window.innerHeight - 240) + 'px';
}

function hideTooltip() {
  const tip = ensureTooltip();
  tip.style.opacity = '0';
}

// ═══════════════════════════════════════════════════════
//  LEGEND BUILDERS
// ═══════════════════════════════════════════════════════

export function buildHeatmapLegend(container, minVal, maxVal, formatFn) {
  if (!container) return;
  const steps = 5;
  let ticks = '';
  for (let i = 0; i <= steps; i++) {
    const v = minVal + (maxVal - minVal) * (i / steps);
    ticks += `<span style="font-size:0.74rem;color:rgba(225,232,240,0.7);font-variant-numeric:tabular-nums;font-weight:500">${formatFn(v)}</span>`;
  }
  container.innerHTML = `
    <div style="display:flex;align-items:flex-start;justify-content:center;gap:14px;margin-top:8px">
      <span style="font-size:0.82rem;color:#fff;font-weight:600;opacity:0.88;min-width:40px;text-align:right;padding-top:2px">Low</span>
      <div style="display:flex;flex-direction:column;gap:5px;width:320px">
        <div style="width:100%;height:16px;border-radius:8px;background:linear-gradient(to right,#312E81,#4338CA,#6366F1,#8B5CF6,#EC4899,#F97316,#FDE047);border:1px solid rgba(255,255,255,0.06);box-shadow:0 2px 8px rgba(0,0,0,0.3)"></div>
        <div style="display:flex;justify-content:space-between;padding:0 2px">${ticks}</div>
      </div>
      <span style="font-size:0.82rem;color:#fff;font-weight:600;opacity:0.88;min-width:40px;padding-top:2px">High</span>
    </div>
  `;
}

export function buildRegionChips(container) {
  if (!container) return;
  container.innerHTML = Object.entries(HEATMAP_REGION_COLORS).map(([region, color]) =>
    `<span style="display:inline-flex;align-items:center;gap:5px;font-size:0.75rem;color:rgba(255,255,255,0.55);margin-right:16px"><span style="width:10px;height:10px;border-radius:2px;background:${color};display:inline-block;opacity:0.6"></span>${region}</span>`
  ).join('');
}

// ═══════════════════════════════════════════════════════
//  TILE RENDERER
// ═══════════════════════════════════════════════════════

let gradientCounter = 0;

function renderTile(parent, defs, x, y, w, h, leaf, normFn, tooltipFn, onClick, isZoomed) {
  const t = normFn(leaf);
  const textCol = tileTextColor(t);
  const subCol = tileSubTextColor(t);
  const shadow = tileShadow(t);
  const tg = parent.append('g');

  const gradId = 'hm-' + (gradientCounter++);
  const { topColor, botColor } = tileGradientColors(t);
  const grad = defs.append('linearGradient')
    .attr('id', gradId).attr('x1', '0').attr('y1', '0').attr('x2', '0').attr('y2', '1');
  grad.append('stop').attr('offset', '0%').attr('stop-color', topColor);
  grad.append('stop').attr('offset', '100%').attr('stop-color', botColor);

  const rect = tg.append('rect')
    .attr('x', x).attr('y', y).attr('width', w).attr('height', h)
    .attr('fill', `url(#${gradId})`)
    .attr('stroke', THEME.tileStroke).attr('stroke-width', THEME.tileStrokeWidth)
    .attr('rx', THEME.tileRadius)
    .style('cursor', onClick ? 'pointer' : 'default')
    .style('transition', 'filter 0.15s')
    .on('mousemove', (e) => showTooltip(e, tooltipFn(leaf)))
    .on('mouseleave', function () { hideTooltip(); select(this).style('filter', null); })
    .on('mouseenter', function () {
      select(this).style('filter', `brightness(${THEME.hoverBrightness}) drop-shadow(${THEME.hoverShadow})`);
    });

  if (onClick) rect.on('click', (e) => { e.stopPropagation(); onClick(); });

  const isLargeTile = w > 100 && h > 60;
  const isSmallTile = w < 55 || h < 35;
  const nameSizeBase = isZoomed ? 15 : 12;
  const nameSize = isSmallTile
    ? Math.min(9, Math.max(6.5, w / 8))
    : Math.min(nameSizeBase, Math.max(7, w / 7));
  const nameWeight = isLargeTile ? '600' : '500';
  const valSize = isSmallTile
    ? Math.min(8, Math.max(6, w / 10))
    : Math.min(isZoomed ? 12 : 10, Math.max(7, w / 9));
  const valWeight = isLargeTile ? '500' : '400';

  const fullName = leaf.data.name;
  let displayName = fullName;
  const charWidth = isSmallTile ? nameSize * 0.58 : nameSize * 0.62;
  const maxChars = Math.max(2, Math.floor((w - 6) / charWidth));
  if (fullName.length > maxChars) {
    displayName = fullName.substring(0, maxChars - 1).trim() + '.';
  }

  const hasRoom2 = h > (isZoomed ? 36 : 28);

  if (w > 18 && h > 12) {
    tg.append('text')
      .attr('x', x + w / 2).attr('y', y + h / 2 - (hasRoom2 ? (isZoomed ? 7 : 5) : 0))
      .text(displayName).attr('text-anchor', 'middle').attr('dominant-baseline', 'central')
      .attr('fill', textCol).attr('font-size', nameSize + 'px').attr('font-weight', nameWeight)
      .attr('letter-spacing', '-0.02em')
      .style('pointer-events', 'none').style('text-shadow', shadow);
  }

  if (w > 36 && hasRoom2) {
    tg.append('text')
      .attr('x', x + w / 2).attr('y', y + h / 2 + (isZoomed ? 9 : 7))
      .text(leaf.data.label2 || fmtNum(leaf.value))
      .attr('text-anchor', 'middle').attr('dominant-baseline', 'central')
      .attr('fill', subCol).attr('font-size', valSize + 'px').attr('font-weight', valWeight)
      .style('pointer-events', 'none').style('text-shadow', shadow);
  }

  if (isZoomed && w > 65 && h > 60 && leaf.data.label3) {
    tg.append('text')
      .attr('x', x + w / 2).attr('y', y + h / 2 + 24)
      .text(leaf.data.label3)
      .attr('text-anchor', 'middle').attr('dominant-baseline', 'central')
      .attr('fill', subCol).attr('font-size', '10px')
      .style('pointer-events', 'none').style('text-shadow', shadow);
  }
}

// ═══════════════════════════════════════════════════════
//  TOP-LEVEL & ZOOMED RENDERERS
// ═══════════════════════════════════════════════════════

function renderTopLevel(g, defs, root, width, height, normFn, tooltipFn, onRegionClick) {
  const kx = width / (root.x1 - root.x0);
  const ky = height / (root.y1 - root.y0);

  root.children.forEach(regionNode => {
    const rx = (regionNode.x0 - root.x0) * kx;
    const ry = (regionNode.y0 - root.y0) * ky;
    const rw = (regionNode.x1 - regionNode.x0) * kx;
    const rh = (regionNode.y1 - regionNode.y0) * ky;
    const regionColor = HEATMAP_REGION_COLORS[regionNode.data.name] || '#888';
    const rg = g.append('g');

    rg.append('rect')
      .attr('x', rx).attr('y', ry).attr('width', rw).attr('height', rh)
      .attr('fill', 'none').attr('stroke', regionColor)
      .attr('stroke-opacity', THEME.regionStrokeOpacity)
      .attr('stroke-width', THEME.regionStrokeWidth)
      .attr('rx', THEME.regionRadius).style('pointer-events', 'none');

    rg.append('rect')
      .attr('x', rx).attr('y', ry).attr('width', rw).attr('height', 26)
      .attr('fill', 'transparent').style('cursor', 'pointer')
      .on('click', () => onRegionClick(regionNode));

    const labelText = regionNode.data.name;
    const labelG = rg.append('g').style('pointer-events', 'none');
    const pillPad = 7;
    const estWidth = labelText.length * 7.8 + pillPad * 2;
    labelG.append('rect')
      .attr('x', rx + 5).attr('y', ry + 4).attr('width', estWidth).attr('height', 20)
      .attr('rx', THEME.tileRadius).attr('fill', 'rgba(8,12,22,0.7)');
    labelG.append('text')
      .attr('x', rx + 5 + pillPad).attr('y', ry + 18)
      .text(labelText).attr('fill', regionColor)
      .attr('font-size', '13px').attr('font-weight', '700').attr('letter-spacing', '0.01em');

    if (regionNode.children) {
      regionNode.children.forEach(leaf => {
        const lx = (leaf.x0 - root.x0) * kx;
        const ly = (leaf.y0 - root.y0) * ky;
        const lw = (leaf.x1 - leaf.x0) * kx;
        const lh = (leaf.y1 - leaf.y0) * ky;
        if (lw < 3 || lh < 3) return;
        renderTile(rg, defs, lx, ly, lw, lh, leaf, normFn, tooltipFn,
          () => onRegionClick(regionNode));
      });
    }
  });
}

function renderZoomed(g, defs, node, width, height, normFn, tooltipFn) {
  const regionColor = HEATMAP_REGION_COLORS[node.data.name] || '#888';

  const subRoot = hierarchy({ name: node.data.name, children: node.data.children })
    .sum(d => d.size || 0).sort((a, b) => b.value - a.value);

  treemap().size([width, height])
    .paddingTop(6).paddingRight(6).paddingBottom(6).paddingLeft(6)
    .paddingInner(5).round(true)(subRoot);

  g.append('rect')
    .attr('x', 1).attr('y', 1).attr('width', width - 2).attr('height', height - 2)
    .attr('fill', 'none').attr('stroke', regionColor)
    .attr('stroke-opacity', THEME.regionStrokeOpacity)
    .attr('stroke-width', THEME.regionStrokeWidth)
    .attr('rx', THEME.regionRadius).style('pointer-events', 'none');

  if (subRoot.children) {
    subRoot.children.forEach(leaf => {
      const lw = leaf.x1 - leaf.x0, lh = leaf.y1 - leaf.y0;
      if (lw < 3 || lh < 3) return;
      const orig = node.children
        ? node.children.find(c => c.data.name === leaf.data.name) : null;
      renderTile(g, defs, leaf.x0, leaf.y0, lw, lh,
        orig || leaf, normFn, tooltipFn, null, true);
    });
  }
}

// ═══════════════════════════════════════════════════════
//  BREADCRUMB
// ═══════════════════════════════════════════════════════

function updateBreadcrumb(el, node, root, renderFn) {
  if (!el) return;
  const path = [];
  let n = node;
  while (n) { path.unshift(n); n = n.parent; }
  el.innerHTML = '';
  path.forEach((p, i) => {
    if (i > 0) {
      const sep = document.createElement('span');
      sep.textContent = '\u203A';
      sep.style.cssText = 'color:rgba(255,255,255,0.35);padding:0 2px;font-size:0.7rem';
      el.appendChild(sep);
    }
    const span = document.createElement('span');
    span.textContent = p.data.name;
    span.style.cssText = 'padding:3px 10px;border-radius:4px;font-size:0.8rem;cursor:pointer;color:rgba(255,255,255,0.55);transition:color 0.15s,background 0.15s';
    if (i === path.length - 1) {
      span.style.color = '#E2E8F0';
      span.style.cursor = 'default';
      span.style.background = 'rgba(255,255,255,0.05)';
      span.style.fontWeight = '500';
      span.setAttribute('aria-current', 'true');
    } else {
      span.setAttribute('role', 'button');
      span.setAttribute('tabindex', '0');
      span.setAttribute('aria-label', `Navigate to ${p.data.name}`);
      const activate = () => renderFn(p);
      span.addEventListener('click', activate);
      span.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); activate(); } });
      span.addEventListener('mouseenter', () => { span.style.color = '#818CF8'; span.style.background = 'rgba(129,140,248,0.1)'; });
      span.addEventListener('mouseleave', () => { span.style.color = 'rgba(255,255,255,0.55)'; span.style.background = 'none'; });
    }
    el.appendChild(span);
  });
}

// ═══════════════════════════════════════════════════════
//  PUBLIC API
// ═══════════════════════════════════════════════════════

/**
 * Create a zoomable D3 heatmap inside a container element.
 *
 * @param {Object} options
 * @param {string} options.containerId - ID of the chart container div
 * @param {string} [options.breadcrumbId] - ID of the breadcrumb container div
 * @param {Object} options.hierarchyData - { name, children: [{ name, children: [...] }] }
 * @param {Function} options.tooltipFn - (leaf) => HTML string
 * @param {Function} options.normFn - (leaf) => number 0..1 (normalized value for color)
 */
export function createD3Heatmap({ containerId, breadcrumbId, hierarchyData, tooltipFn, normFn }) {
  const container = document.getElementById(containerId);
  if (!container) return;

  // Ensure the SVG stays within the container
  container.style.overflow = 'hidden';
  container.style.position = 'relative';

  const { width, height } = container.getBoundingClientRect();
  if (width < 10 || height < 10) return;

  const svg = select(`#${containerId}`)
    .append('svg')
    .attr('viewBox', `0 0 ${width} ${height}`)
    .attr('preserveAspectRatio', 'xMidYMid meet')
    .style('width', '100%').style('height', '100%')
    .style('display', 'block')
    .style('max-height', height + 'px');

  const defs = svg.append('defs');

  const root = hierarchy(hierarchyData)
    .sum(d => d.size || 0)
    .sort((a, b) => b.value - a.value);

  treemap().size([width, height])
    .paddingTop(THEME.regionHeaderHeight)
    .paddingRight(4).paddingBottom(4).paddingLeft(4)
    .paddingInner(THEME.tileGap).round(true)(root);

  const breadcrumbEl = breadcrumbId ? document.getElementById(breadcrumbId) : null;

  function render(node) {
    const isTop = node === root;
    svg.selectAll('g.content').remove();
    svg.selectAll('rect.bg').remove();
    defs.selectAll('*').remove();
    gradientCounter = 0;

    svg.append('rect').attr('class', 'bg')
      .attr('width', width).attr('height', height)
      .attr('fill', THEME.bgChart).attr('rx', THEME.regionRadius)
      .style('cursor', node.parent ? 'pointer' : 'default')
      .on('click', () => { if (node.parent) render(node.parent); });

    const g = svg.append('g').attr('class', 'content');

    if (isTop) {
      renderTopLevel(g, defs, root, width, height, normFn, tooltipFn, render);
    } else {
      renderZoomed(g, defs, node, width, height, normFn, tooltipFn);
    }

    updateBreadcrumb(breadcrumbEl, node, root, render);
  }

  render(root);

  const ro = new ResizeObserver(() => {
    const r = container.getBoundingClientRect();
    svg.attr('viewBox', `0 0 ${r.width} ${r.height}`);
  });
  ro.observe(container);
}

/**
 * Create a rank-based normalization function that distributes values evenly
 * across the color gradient. Prevents outliers from compressing the scale.
 *
 * @param {number[]} values - All values in the dataset
 * @returns {Function} (value) => number 0..1
 */
export function createRankNorm(values) {
  const sorted = [...values].sort((a, b) => a - b);
  const n = sorted.length;
  return (value) => {
    // Binary search for rank position
    let lo = 0, hi = n - 1;
    while (lo < hi) {
      const mid = (lo + hi) >> 1;
      if (sorted[mid] < value) lo = mid + 1;
      else hi = mid;
    }
    return n > 1 ? lo / (n - 1) : 0.5;
  };
}

export { HEATMAP_REGION_COLORS };
