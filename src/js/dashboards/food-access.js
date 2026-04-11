/**
 * @fileoverview Food Access & Deserts Dashboard — ECharts visualizations
 * @description Interactive charts: food desert map, urban vs rural, distance,
 *              vehicle access scatter, low-income/low-access overlap.
 */

import {
  echarts, COLORS, TOOLTIP_STYLE, MAP_PALETTES, LEGEND_TEXT_STYLE,
  fmtNum, animateCounters, createChart, getOrCreateChart, linearRegression,
  initScrollReveal, handleResize, updateFreshness,
  REGIONS, REGION_COLORS, REGION_CLASS, getRegion, addExportButton, US_STATES
} from './shared/dashboard-utils.js';
import { initStateSelector } from './shared/state-selector.js';

import {
  createD3Heatmap, buildHeatmapLegend, buildRegionChips, createRankNorm,
  HEATMAP_REGION_COLORS, HEATMAP_REGION_CLASS, sampleGradient, tileTextColor, tileSubTextColor
} from './shared/d3-heatmap.js';

const PAL = MAP_PALETTES.access;

// Module-level cache: restored when back button resets to national desert view
let _lowAccessDefaultInsight = '';

// Desert map state tooltip (pure — depends only on fmtNum)
function desertStateTooltip(params) {
  const d = params.data;
  if (!d) return '';
  return `<strong class="fnf-tooltip-label">${d.name}</strong><br/>
    <span class="csp-text-secondary">Low-Access Tracts:</span> ${d.value}%<br/>
    Population: ${fmtNum(d.population)}<br/>
    Low-Access Population: ${fmtNum(d.lowAccessPopulation)}<br/>
    Avg Distance: ${d.avgDistance} mi<br/>
    <span class="csp-text-secondary-sm">Click to see counties</span>`;
}

// Desert map county tooltip (pure — depends only on fmtNum)
function desertCountyTooltip(params) {
  const d = params.data;
  if (!d) return '';
  if (d._currentData) {
    let html = `<strong class="fnf-tooltip-label">${d.name}</strong><br/>`;
    html += `<span class="csp-text-secondary">Low-Access Tracts:</span> ${d.lowAccessTracts} of ${d.totalTracts} (${d.value}%)<br/>`;
    if (d.lowAccessPopulation) html += `Low-Access Population: ${fmtNum(d.lowAccessPopulation)}<br/>`;
    if (d.avgDistance) html += `Avg Distance to Store: ${d.avgDistance} mi<br/>`;
    html += `Type: ${d.isUrban ? 'Urban' : 'Rural'}`;
    return html;
  }
  return `<strong class="fnf-tooltip-label">${d.name}</strong><br/>
    Population: ${fmtNum(d.population || 0)}<br/>
    ${d.povertyRate != null ? `<span class="csp-text-secondary">Poverty Rate:</span> ${d.povertyRate}%<br/>` : ''}
    ${d.rate != null ? `Food Insecurity: ${d.rate}%<br/>` : ''}
    ${d.mealCost != null ? `Avg Meal Cost: $${d.mealCost}` : ''}`;
}

// -- Chart 1: Food Desert Map (choropleth) with County Drill-Down --
function renderDesertMap(geoJSON, states, accessData) {
  const chart = getOrCreateChart('chart-desert-map');
  if (!chart) return;

  const albersProjection = { project: p => p, unproject: p => p };
  echarts.registerMap('USA-access', geoJSON);

  let currentView = 'national';

  function showNational() {
    currentView = 'national';
    const mapData = states.map(s => ({
      name: s.name, value: s.lowAccessPct, fips: s.fips,
      population: s.totalPopulation || s.population,
      lowAccessPopulation: s.lowAccessPopulation, avgDistance: s.avgDistance
    }));

    const backBtn = document.getElementById('access-map-back-btn');
    if (backBtn) backBtn.classList.add('hidden');
    const mapLabel = document.getElementById('access-map-state-label');
    if (mapLabel) mapLabel.textContent = '';
    const hint = document.querySelector('#chart-desert-map + .dashboard-chart__hint');
    if (hint) hint.textContent = 'Hover for state details \u2014 click any state for county breakdown';
    const lowAccessInsight = document.getElementById('low-access-insight');
    if (lowAccessInsight && _lowAccessDefaultInsight) lowAccessInsight.innerHTML = _lowAccessDefaultInsight;

    chart.setOption({
      tooltip: { trigger: 'item', ...TOOLTIP_STYLE, formatter: desertStateTooltip },
      visualMap: {
        left: 'right', bottom: 20, min: 20, max: 65,
        text: ['More Deserts', 'Fewer Deserts'], calculable: true,
        inRange: { color: [PAL.low, PAL.mid, PAL.high] },
        textStyle: { color: COLORS.text }
      },
      series: [{
        name: 'Low-Access Tracts (%)', type: 'map', map: 'USA-access', roam: false,
        projection: albersProjection, aspectScale: 1, zoom: 1.1, top: 10, left: 'center',
        emphasis: {
          label: { show: true, color: COLORS.text, fontSize: 12, fontWeight: 'bold' },
          itemStyle: { areaColor: COLORS.secondary, borderColor: '#fff', borderWidth: 1.5 }
        },
        itemStyle: { borderColor: COLORS.mapBorder, borderWidth: COLORS.mapBorderWidth, areaColor: 'rgba(255,255,255,0.08)' },
        label: { show: false }, data: mapData, animationDurationUpdate: 500
      }]
    }, true);
  }

  async function drillDown(stateName, stateFips) {
    chart.showLoading({ text: `Loading ${stateName} counties...`, color: COLORS.secondary, textColor: COLORS.text, maskColor: 'rgba(0,0,0,0.6)' });

    try {
      // Always need the GeoJSON for the map geometry
      const geoRes = await fetch(`/data/counties/${stateFips}.json`);
      if (!geoRes.ok) throw new Error(`HTTP ${geoRes.status}`);
      const countyGeo = await geoRes.json();

      // Build county lookup from currentAccessData (consistent with state-level map)
      const stateAccess = accessData?.states?.find(s => s.fips === stateFips);
      const accessByFips = {};
      if (stateAccess?.counties) {
        stateAccess.counties.forEach(c => { accessByFips[c.fips] = c; });
      }
      const hasCurrentAccess = Object.keys(accessByFips).length > 0;

      const mapName = `access-${stateFips}`;
      echarts.registerMap(mapName, countyGeo);

      let countyData, seriesName, vmText, hintText;

      if (hasCurrentAccess) {
        // Use current computed data: low-access tract % per county (consistent with state map)
        countyData = countyGeo.features
          .map(f => {
            const fips5 = f.properties.fips || '';
            const access = accessByFips[fips5];
            if (!access) return null;
            return {
              name: f.properties.name || f.properties.NAME,
              value: access.lowAccessPct,
              _currentData: true,
              lowAccessTracts: access.lowAccessTracts,
              totalTracts: access.totalTracts,
              lowAccessPopulation: access.lowAccessPopulation,
              avgDistance: access.avgDistance,
              isUrban: access.isUrban
            };
          })
          .filter(Boolean);

        seriesName = 'Low-Access Tracts (%)';
        vmText = ['More Low-Access', 'Less Low-Access'];
        hintText = 'Showing current food desert data (distance-only) \u2014 click Back for state-level view';
      } else {
        // Fallback: poverty rate from static county GeoJSON
        countyData = countyGeo.features
          .filter(f => f.properties.povertyRate)
          .map(f => ({
            name: f.properties.name,
            value: f.properties.povertyRate,
            ...f.properties
          }));

        seriesName = 'Poverty Rate';
        vmText = ['High Poverty', 'Low Poverty'];
        hintText = 'Showing poverty rate as proxy for food access risk \u2014 click Back for state-level food desert data';
      }

      const vals = countyData.map(c => c.value).filter(v => typeof v === 'number');
      const min = Math.floor(Math.min(...vals));
      const max = Math.ceil(Math.max(...vals));

      currentView = stateFips;

      const backBtn = document.getElementById('access-map-back-btn');
      if (backBtn) backBtn.classList.remove('hidden');
      const mapLabel = document.getElementById('access-map-state-label');
      if (mapLabel) mapLabel.textContent = stateName;
      const hint = document.querySelector('#chart-desert-map + .dashboard-chart__hint');
      if (hint) hint.textContent = hintText;

      chart.hideLoading();

      chart.setOption({
        tooltip: { trigger: 'item', ...TOOLTIP_STYLE, formatter: desertCountyTooltip },
        visualMap: {
          min, max, text: vmText, calculable: true,
          inRange: { color: [PAL.low, PAL.mid, PAL.high] },
          textStyle: { color: COLORS.text }
        },
        series: [{
          name: seriesName, type: 'map', map: mapName, roam: false,
          projection: albersProjection, aspectScale: 1, zoom: 1, top: 10, left: 'center',
          emphasis: {
            label: { show: true, color: COLORS.text, fontSize: 11, fontWeight: 'bold' },
            itemStyle: { areaColor: COLORS.secondary, borderColor: '#fff', borderWidth: 1 }
          },
          itemStyle: { borderColor: COLORS.countyBorder, borderWidth: COLORS.countyBorderWidth, areaColor: 'rgba(255,255,255,0.05)' },
          label: { show: false }, data: countyData, animationDurationUpdate: 500
        }]
      }, true);
    } catch {
      chart.hideLoading();
    }
  }

  showNational();

  const backBtn = document.getElementById('access-map-back-btn');
  if (backBtn) {
    backBtn.addEventListener('click', () => showNational());
  }

  /** @type {boolean} Set to false to disable click-to-drill-down (e.g., in SNAP view) */
  let drillDownEnabled = true;

  chart.off('click'); // Prevent duplicate listeners on re-render
  chart.on('click', (params) => {
    if (drillDownEnabled && currentView === 'national' && params.data?.fips) {
      drillDown(params.data.name, params.data.fips);
    }
  });

  return { drillDown, showNational, setDrillDown: (v) => { drillDownEnabled = v; } };
}

// -- Chart 2: Urban vs Rural (Grouped Bar) --
function renderUrbanRural(states) {
  const chart = getOrCreateChart('chart-urban-rural');
  if (!chart) return;

  // Compute low-access RATE per geography type from county data — honest metric
  // (tract counts are misleading: there are far more urban tracts, so sharing them distorts the story)
  let urbanLATracts = 0, urbanTotalTracts = 0;
  let ruralLATracts = 0, ruralTotalTracts = 0;
  let urbanDistSum = 0, ruralDistSum = 0;

  for (const state of states) {
    for (const county of (state.counties || [])) {
      if (county.isUrban) {
        urbanLATracts += county.lowAccessTracts;
        urbanTotalTracts += county.totalTracts;
        urbanDistSum += county.avgDistance * county.totalTracts;
      } else {
        ruralLATracts += county.lowAccessTracts;
        ruralTotalTracts += county.totalTracts;
        ruralDistSum += county.avgDistance * county.totalTracts;
      }
    }
  }

  const urbanRate = urbanTotalTracts > 0 ? Math.round(urbanLATracts / urbanTotalTracts * 1000) / 10 : 0;
  const ruralRate = ruralTotalTracts > 0 ? Math.round(ruralLATracts / ruralTotalTracts * 1000) / 10 : 0;
  const urbanDist = urbanTotalTracts > 0 ? Math.round(urbanDistSum / urbanTotalTracts * 100) / 100 : 0;
  const ruralDist = ruralTotalTracts > 0 ? Math.round(ruralDistSum / ruralTotalTracts * 100) / 100 : 0;

  chart.setOption({
    tooltip: {
      ...TOOLTIP_STYLE, trigger: 'axis', axisPointer: { type: 'shadow' },
      formatter: params => {
        const geo = params[0].name;
        const rateP = params.find(p => p.seriesName === 'Low-Access Rate');
        const distP = params.find(p => p.seriesName === 'Avg Distance');
        return `<strong>${geo}</strong><br/>
          Low-Access Rate: <strong>${rateP?.value}%</strong> of tracts<br/>
          Avg Distance to Store: <strong>${distP?.value} mi</strong>`;
      }
    },
    legend: { data: ['Low-Access Rate', 'Avg Distance'], textStyle: LEGEND_TEXT_STYLE, bottom: 0 },
    grid: { left: 60, right: 60, top: 30, bottom: 50 },
    xAxis: {
      type: 'category', data: ['Urban', 'Rural'],
      axisLabel: { color: COLORS.text, fontSize: 13, fontWeight: 'bold' },
      axisLine: { lineStyle: { color: COLORS.gridLine } }
    },
    yAxis: [
      {
        type: 'value', name: 'Low-Access Rate (%)', max: 60,
        nameTextStyle: { color: COLORS.textMuted, fontSize: 10 },
        axisLabel: { color: COLORS.textMuted, formatter: '{value}%' },
        splitLine: { lineStyle: { color: COLORS.gridLine } }
      },
      {
        type: 'value', name: 'Avg Distance (mi)', max: 8,
        nameTextStyle: { color: COLORS.textMuted, fontSize: 10 },
        axisLabel: { color: COLORS.textMuted, formatter: '{value} mi' },
        splitLine: { show: false }
      }
    ],
    series: [
      {
        name: 'Low-Access Rate', type: 'bar', yAxisIndex: 0, barWidth: '28%',
        itemStyle: { color: COLORS.primary },
        data: [urbanRate, ruralRate],
        label: { show: true, position: 'top', formatter: '{c}%', color: COLORS.text, fontSize: 11 },
        animationDuration: 1800
      },
      {
        name: 'Avg Distance', type: 'bar', yAxisIndex: 1, barWidth: '28%',
        itemStyle: { color: COLORS.accent },
        data: [urbanDist, ruralDist],
        label: { show: true, position: 'top', formatter: '{c} mi', color: COLORS.text, fontSize: 11 },
        animationDuration: 1800
      }
    ]
  });
}

// -- Chart 3: Distance to Store (Gradient Area) --
function renderDistance(states) {
  const chart = getOrCreateChart('chart-distance');
  if (!chart) return;

  // Sort ascending; cap Alaska to keep lower-48 distribution readable
  const sorted = [...states].sort((a, b) => a.avgDistance - b.avgDistance);
  const ALASKA_CAP = 10; // Display cap in miles — Alaska (26.8mi) noted in tooltip
  const names = sorted.map(s => s.name);
  const distances = sorted.map(s => Math.min(s.avgDistance, ALASKA_CAP));
  const rawDistances = sorted.map(s => s.avgDistance);

  chart.setOption({
    tooltip: {
      trigger: 'axis', ...TOOLTIP_STYLE,
      formatter: p => {
        const raw = rawDistances[p[0].dataIndex];
        const capped = raw > ALASKA_CAP ? ` <span class="csp-text-muted-xs">(capped at ${ALASKA_CAP} mi for scale)</span>` : '';
        return `<strong>${p[0].name}</strong><br/>Avg centroid distance: <strong>${raw} mi</strong>${capped}`;
      }
    },
    grid: { left: 50, right: 20, top: 20, bottom: 40 },
    xAxis: {
      type: 'category', data: names,
      axisLabel: { color: COLORS.textMuted, rotate: 60, fontSize: window.innerWidth < 640 ? 7 : 9, interval: window.innerWidth < 640 ? 2 : 0 },
      axisLine: { lineStyle: { color: COLORS.gridLine } }
    },
    yAxis: {
      type: 'value', name: 'Miles', max: ALASKA_CAP,
      nameTextStyle: { color: COLORS.textMuted },
      axisLabel: { color: COLORS.textMuted },
      splitLine: { lineStyle: { color: COLORS.gridLine } }
    },
    series: [{
      type: 'line', data: distances, smooth: true, symbol: 'none',
      lineStyle: { width: 2.5, color: COLORS.secondary },
      areaStyle: {
        color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
          { offset: 0, color: 'rgba(0,212,255,0.35)' },
          { offset: 0.5, color: 'rgba(0,212,255,0.12)' },
          { offset: 1, color: 'rgba(0,212,255,0.01)' }
        ])
      },
      // No USDA threshold markLine — state averages mix urban+rural so a single threshold is misleading
      animationDuration: 2000
    }]
  });
}

// -- Chart 4: Distance vs Low-Access (scatter) --
// Positive correlation: states with higher avg distance to stores have more low-access tracts.
function renderVehicle(states) {
  const chart = getOrCreateChart('chart-vehicle');
  if (!chart) return;

  const LABEL_STATES = new Set(['Wyoming', 'Montana', 'North Dakota', 'District of Columbia', 'New Jersey']);

  const points = states.map(s => ({
    value: [s.avgDistance, s.lowAccessPct],
    name: s.name, population: s.population,
    label: LABEL_STATES.has(s.name)
      ? { show: true, formatter: s.state || s.name.slice(0, 2).toUpperCase(), color: COLORS.text, fontSize: 9, position: 'right' }
      : { show: false }
  }));

  const byRegion = {};
  Object.keys(REGION_COLORS).forEach(r => { byRegion[r] = []; });
  points.forEach(p => byRegion[getRegion(p.name)].push(p));

  const reg = linearRegression(points.map(p => p.value));
  const xs = points.map(p => p.value[0]);
  const xMin = Math.min(...xs), xMax = Math.max(...xs);
  const rLine = {
    symbol: 'none', silent: true,
    lineStyle: { color: 'rgba(255,255,255,0.3)', type: 'dashed', width: 1.5 },
    data: [[{ coord: [xMin, reg.slope * xMin + reg.intercept] }, { coord: [xMax, reg.slope * xMax + reg.intercept] }]],
    label: { formatter: `r = ${reg.r.toFixed(2)}`, color: COLORS.textMuted, fontSize: 10, position: 'end' }
  };

  const series = Object.entries(REGION_COLORS).map(([region, color], i) => ({
    name: region, type: 'scatter',
    data: byRegion[region],
    symbolSize: (_, params) => Math.max(8, Math.sqrt(params.data.population / 200000)),
    itemStyle: { color, opacity: 0.85 },
    emphasis: { itemStyle: { opacity: 1 } },
    animationDuration: 2000,
    ...(i === 0 ? { markLine: rLine } : {})
  }));

  chart.setOption({
    legend: { top: 5, right: 10, textStyle: LEGEND_TEXT_STYLE, itemWidth: 10, itemHeight: 10 },
    tooltip: {
      ...TOOLTIP_STYLE,
      formatter: params => {
        const d = params.data;
        const region = getRegion(d.name);
        const note = d.value[0] < 1
          ? '<br/><span class="csp-text-muted-xs">Dense/urban — stores within walking distance</span>'
          : d.value[0] > 3
            ? '<br/><span class="csp-text-muted-xs">Rural distance barrier — car essential for food access</span>'
            : '';
        return `<strong>${d.name}</strong> <span class="${REGION_CLASS[region] || ''}">(${region})</span><br/>
          Avg Distance to Store: ${d.value[0]} mi<br/>
          Low-Access Tracts: ${d.value[1]}% of tracts<br/>
          Population: ${fmtNum(d.population)}${note}`;
      }
    },
    grid: { left: 55, right: 20, top: 35, bottom: 50 },
    xAxis: {
      name: 'Average Distance to Grocery Store (mi)', nameLocation: 'center', nameGap: 35,
      nameTextStyle: { color: COLORS.textMuted },
      axisLabel: { color: COLORS.textMuted, formatter: '{value} mi' },
      splitLine: { lineStyle: { color: COLORS.gridLine } }
    },
    yAxis: {
      name: 'Low-Access Tracts (%)',
      nameTextStyle: { color: COLORS.textMuted },
      axisLabel: { color: COLORS.textMuted, formatter: '{value}%' },
      splitLine: { lineStyle: { color: COLORS.gridLine } }
    },
    series
  });
}

// -- Chart 5: Low-Income + Low-Access (Two-Mode Visualization) --

// Outlier threshold: top 20% by norm get a subtle accent
const DB_OUTLIER_THRESHOLD = 0.80;

/** Create or reuse a shared tooltip element for Mode B tiles */
function ensureDbTileTip() {
  let tip = document.getElementById('db-tile-tip');
  if (!tip) {
    tip = document.createElement('div');
    tip.id = 'db-tile-tip';
    tip.style.cssText = 'position:fixed;background:rgba(10,15,30,0.97);border:1px solid rgba(255,255,255,0.12);border-radius:8px;padding:10px 14px;font-size:13px;color:#E2E8F0;pointer-events:none;opacity:0;transition:opacity 0.12s;z-index:9999;max-width:240px;line-height:1.55;box-shadow:0 8px 24px rgba(0,0,0,0.55)';
    document.body.appendChild(tip);
  }
  return tip;
}

/** Create a single tile DOM element for Mode B double-burden visualization */
function createDoubleBurdenTile(d, rankNorm, tip) {
  const norm = rankNorm(parseFloat(d.pctOfPop) || 0);
  const rgb = sampleGradient(norm);
  const bg = `rgb(${rgb[0]},${rgb[1]},${rgb[2]})`;
  const fg = tileTextColor(norm);
  const subFg = tileSubTextColor(norm);
  const isOutlier = norm >= DB_OUTLIER_THRESHOLD;

  const tile = document.createElement('div');
  tile.style.cssText = [
    'min-height:72px;border-radius:6px;padding:8px 10px',
    `background:${bg}`,
    'display:flex;flex-direction:column;justify-content:space-between',
    isOutlier
      ? 'border:1.5px solid rgba(253,224,71,0.35);box-shadow:0 0 8px rgba(253,224,71,0.08)'
      : 'border:1px solid rgba(255,255,255,0.06)',
    'box-sizing:border-box;cursor:default;position:relative',
    'transition:transform 0.12s,box-shadow 0.12s'
  ].join(';');

  const nameDiv = document.createElement('div');
  nameDiv.style.cssText = `font-size:0.72rem;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;color:${fg};line-height:1.2`;
  nameDiv.textContent = d.name;
  nameDiv.title = d.name;

  const pctDiv = document.createElement('div');
  pctDiv.style.cssText = `font-size:1.15rem;font-weight:700;line-height:1.1;color:${fg}${isOutlier ? ';text-shadow:0 0 6px rgba(253,224,71,0.2)' : ''}`;
  pctDiv.textContent = d.pctOfPop + '%';

  const countDiv = document.createElement('div');
  countDiv.style.cssText = `font-size:0.64rem;color:${subFg};line-height:1.2`;
  countDiv.textContent = fmtNum(d.estimate) + ' people';

  tile.append(nameDiv, pctDiv, countDiv);
  tile.setAttribute('role', 'listitem');
  tile.setAttribute('aria-label', `${d.name}: ${d.pctOfPop}% of population, ${fmtNum(d.estimate)} people`);

  tile.addEventListener('mouseenter', (e) => {
    tile.style.transform = 'scale(1.04)';
    tile.style.boxShadow = '0 4px 16px rgba(0,0,0,0.45)';
    tile.style.zIndex = '2';
    const rc2 = HEATMAP_REGION_COLORS[d.region] || '#888';
    tip.innerHTML = `<strong class="fnf-tooltip-label">${d.name}</strong>
      <span class="csp-swatch-dot" data-color="${rc2}"></span><br/>
      <span class="text-accent-indigo">% of State Pop:</span> <strong>${d.pctOfPop}%</strong><br/>
      <span class="text-accent-indigo">Est. Affected:</span> <strong>${fmtNum(d.estimate)}</strong>
      <hr class="fnf-tooltip-divider">
      <span class="fnf-tooltip-muted">Population: ${fmtNum(d.population)}<br/>Low-Access Tracts: ${d.lowAccessPct}%</span>`;
    tip.querySelectorAll('[data-color]').forEach(el => { el.style.backgroundColor = el.dataset.color; });
    tip.style.left = Math.min(e.clientX + 14, window.innerWidth - 260) + 'px';
    tip.style.top = Math.min(e.clientY - 10, window.innerHeight - 200) + 'px';
    tip.style.opacity = '1';
  });
  tile.addEventListener('mousemove', (e) => {
    tip.style.left = Math.min(e.clientX + 14, window.innerWidth - 260) + 'px';
    tip.style.top = Math.min(e.clientY - 10, window.innerHeight - 200) + 'px';
  });
  tile.addEventListener('mouseleave', () => {
    tile.style.transform = '';
    tile.style.boxShadow = isOutlier ? '0 0 8px rgba(253,224,71,0.08)' : '';
    tile.style.zIndex = '';
    tip.style.opacity = '0';
  });

  return tile;
}

/** Render Mode B: equal-sized tiles sorted by rate desc, grouped by region */
function renderDoubleBurdenTiles(enriched, rankNorm) {
  const container = document.getElementById('chart-double-burden-tiles');
  if (!container) return;
  container.innerHTML = '';

  const tip = ensureDbTileTip();
  const regionOrder = ['South', 'Midwest', 'West', 'Northeast'];

  const containerWidth = container.parentElement?.clientWidth || 700;
  const gap = 5;
  const cols = Math.max(2, Math.floor((containerWidth + gap) / (112 + gap)));

  regionOrder.forEach((region, ri) => {
    const states = enriched
      .filter(s => s.region === region)
      .sort((a, b) => parseFloat(b.pctOfPop) - parseFloat(a.pctOfPop));
    if (!states.length) return;

    const rc = HEATMAP_REGION_COLORS[region] || '#888';
    const section = document.createElement('div');
    section.style.cssText = ri < regionOrder.length - 1
      ? 'margin-bottom:18px;padding-bottom:14px;border-bottom:1px solid rgba(255,255,255,0.04)'
      : 'margin-bottom:6px';

    const header = document.createElement('div');
    header.style.cssText = `font-size:0.78rem;font-weight:700;text-transform:uppercase;letter-spacing:0.06em;color:${rc};margin-bottom:8px;padding:3px 10px;border-left:3px solid ${rc};display:flex;align-items:center;gap:8px`;
    header.textContent = region;
    const count = document.createElement('span');
    count.style.cssText = 'font-size:0.68rem;font-weight:400;opacity:0.5;text-transform:none;letter-spacing:0';
    count.textContent = `${states.length} states`;
    header.appendChild(count);
    section.appendChild(header);

    const grid = document.createElement('div');
    grid.style.cssText = `display:grid;grid-template-columns:repeat(${cols},1fr);gap:${gap}px`;
    grid.setAttribute('role', 'list');

    states.forEach(d => grid.appendChild(createDoubleBurdenTile(d, rankNorm, tip)));

    section.appendChild(grid);
    container.appendChild(section);
  });
}

/** Wire the Total Affected / Rate Comparison toggle */
function initDoubleBurdenModeToggle() {
  const toggleContainer = document.getElementById('double-burden-mode-toggle');
  if (!toggleContainer) return;

  toggleContainer.querySelectorAll('[data-db-mode]').forEach(btn => {
    btn.addEventListener('click', () => {
      const mode = btn.dataset.dbMode;
      toggleContainer.querySelectorAll('[data-db-mode]').forEach(b => {
        b.classList.toggle('dashboard-metric-btn--active', b === btn);
        b.setAttribute('aria-pressed', String(b === btn));
      });

      const treemapEl = document.getElementById('chart-double-burden');
      const tilesEl = document.getElementById('chart-double-burden-tiles');
      const breadcrumb = document.getElementById('double-burden-breadcrumb');
      const encodingTree = document.getElementById('db-encoding-treemap');
      const encodingTile = document.getElementById('db-encoding-tiles');
      const hintEl = document.getElementById('db-hint-text');
      const regionLegend = document.getElementById('double-burden-region-legend');

      const isTreemap = mode === 'treemap';
      if (treemapEl) treemapEl.style.display = isTreemap ? '' : 'none';
      if (isTreemap && treemapEl?._renderTreemapOnce) treemapEl._renderTreemapOnce();
      if (breadcrumb) breadcrumb.style.display = isTreemap ? '' : 'none';
      if (tilesEl) tilesEl.classList.toggle('hidden', isTreemap);
      if (encodingTree) encodingTree.style.display = isTreemap ? '' : 'none';
      if (encodingTile) encodingTile.classList.toggle('hidden', !isTreemap);
      // Region chips redundant in tiles mode — tiles already have labeled region sections
      if (regionLegend) regionLegend.style.display = isTreemap ? '' : 'none';
      if (hintEl) hintEl.textContent = isTreemap
        ? 'Click a region to zoom in. Click breadcrumb to zoom out.'
        : 'Sorted by rate within each region. Hover for details.';
    });
  });
}

function renderDoubleBurden(states) {
  const container = document.getElementById('chart-double-burden');
  if (!container) return;

  // Pre-compute data: sort within each region by estimate DESC for treemap readability
  const enriched = [];
  Object.entries(REGIONS).forEach(([region, stateNames]) => {
    states
      .filter(s => stateNames.includes(s.name))
      .sort((a, b) => {
        const ea = Math.round((a.lowAccessPopulation || 0) * ((a.povertyRate || 0) / 100));
        const eb = Math.round((b.lowAccessPopulation || 0) * ((b.povertyRate || 0) / 100));
        return eb - ea;
      })
      .forEach(s => {
        const pop = s.totalPopulation || s.population || 0;
        const estimate = Math.round((s.lowAccessPopulation || 0) * ((s.povertyRate || 0) / 100));
        const pct = pop > 0 ? (estimate / pop) * 100 : 0;
        enriched.push({
          // sqrt scaling: reduces extreme size ratio (TX/WY from 120:1 to 11:1)
          name: s.name, size: Math.sqrt(Math.max(1, estimate)),
          estimate,
          pctOfPop: pct.toFixed(1),
          population: pop,
          lowAccessPct: s.lowAccessPct,
          region,
          label2: pct.toFixed(1) + '%'
        });
      });
  });

  const pctValues = enriched.map(s => parseFloat(s.pctOfPop));
  if (!pctValues.length) return;
  const pctMin = Math.min(...pctValues), pctMax = Math.max(...pctValues);
  if (!isFinite(pctMin) || !isFinite(pctMax)) return;
  const rankNorm = createRankNorm(pctValues);

  // Mode A: D3 Treemap — deferred until user switches to treemap mode
  // (container starts hidden; D3 needs visible dimensions to layout)
  let treemapRendered = false;
  const renderTreemapOnce = () => {
    if (treemapRendered) return;
    treemapRendered = true;
    createD3Heatmap({
      containerId: 'chart-double-burden',
      breadcrumbId: 'double-burden-breadcrumb',
      hierarchyData: {
        name: 'United States',
        children: Object.keys(REGIONS).map(region => ({
          name: region,
          children: enriched.filter(s => s.region === region)
        }))
      },
      tooltipFn: (leaf) => {
        const d = leaf.data;
        const region = leaf.parent ? leaf.parent.data.name : d.region;
        const rc = HEATMAP_REGION_COLORS[region] || '#888';
        return `<strong class="fnf-tooltip-label">${d.name}</strong>
          <span class="csp-tooltip-inline-flex">
            <svg class="csp-swatch" width="8" height="8"><rect rx="2" width="8" height="8" fill="${rc}"/></svg>
            <span class="${HEATMAP_REGION_CLASS[region] || ''}">${region}</span>
          </span><br/>
          <span class="text-accent-indigo">% of State Pop:</span> <strong>${d.pctOfPop}%</strong><br/>
          <span class="text-accent-indigo">Est. Affected:</span> <strong>${fmtNum(d.estimate)}</strong>
          <hr class="fnf-tooltip-divider">
          <span class="fnf-tooltip-muted">Population: ${fmtNum(d.population)}<br/>
          Low-Access Tracts: ${d.lowAccessPct}%</span>`;
      },
      normFn: (leaf) => rankNorm(parseFloat(leaf.data.pctOfPop) || 0)
    });
  };
  // Expose for the toggle handler
  container._renderTreemapOnce = renderTreemapOnce;

  // Mode B: equal tiles (pre-rendered, toggled by CSS display)
  renderDoubleBurdenTiles(enriched, rankNorm);

  // Re-layout tiles on container resize (Fix #23: columns computed from hidden container)
  const tileContainer = document.getElementById('chart-double-burden-tiles');
  if (tileContainer && typeof ResizeObserver !== 'undefined') {
    let resizeTimer;
    const tileObserver = new ResizeObserver(() => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => renderDoubleBurdenTiles(enriched, rankNorm), 150);
    });
    tileObserver.observe(tileContainer.parentElement || tileContainer);
  }

  // Shared legend (visible in both modes)
  buildHeatmapLegend(
    document.getElementById('treemap-legend-access'),
    pctMin, pctMax, v => v.toFixed(1) + '%'
  );
  buildRegionChips(document.getElementById('double-burden-region-legend'));

  // Wire toggle
  initDoubleBurdenModeToggle();

  // Insight text
  const insightEl = document.getElementById('double-burden-insight');
  if (insightEl && enriched.length) {
    const total = enriched.reduce((sum, s) => sum + s.estimate, 0);
    const topRate = [...enriched].sort((a, b) => parseFloat(b.pctOfPop) - parseFloat(a.pctOfPop))[0];
    const topCount = [...enriched].sort((a, b) => b.estimate - a.estimate)[0];
    insightEl.innerHTML = `An estimated <strong>${fmtNum(Math.round(total / 1000000 * 10) / 10)} million Americans</strong> face overlapping low food access and low income. <strong>${topRate.name}</strong> has the highest rate (${topRate.pctOfPop}%); <strong>${topCount.name}</strong> has the most in absolute terms (~${fmtNum(topCount.estimate)}).`;
  }
}

// -- Food Insecurity Map (CDC PLACES data, 2023) --
function renderInsecurityMap(geoJSON, cdcRecords, accessStates = []) {
  const chart = getOrCreateChart('chart-desert-map');
  if (!chart) return;

  // Map state abbreviations to full names
  const stateNameMap = {};
  US_STATES.forEach(([abbr, name]) => { stateNameMap[abbr] = name; });

  // Build FIPS lookup from access data so county drill-down works in insecurity view
  const fipsByName = {};
  accessStates.forEach(s => { if (s.name && s.fips) fipsByName[s.name] = s.fips; });

  const mapData = cdcRecords
    .filter(r => stateNameMap[r.state])
    .map(r => ({
      name: stateNameMap[r.state],
      value: r.value,
      fips: fipsByName[stateNameMap[r.state]] || null
    }));

  const albersProjection = { project: p => p, unproject: p => p };

  chart.setOption({
    tooltip: {
      trigger: 'item', ...TOOLTIP_STYLE,
      formatter: params => {
        const d = params.data;
        if (!d) return '';
        return `<strong class="fnf-tooltip-label">${d.name}</strong><br/>
          <span class="csp-text-secondary">Food Insecurity:</span> ${d.value}%<br/>
          <span class="csp-text-secondary-sm">Source: CDC PLACES 2023</span><br/>
          <span class="csp-text-muted-sm">Use Food Deserts view for county drill-down</span>`;
      }
    },
    visualMap: {
      left: 'right', bottom: 20, min: 8, max: 25,
      text: ['Higher Insecurity', 'Lower Insecurity'], calculable: true,
      inRange: { color: [PAL.low, PAL.mid, PAL.high] },
      textStyle: { color: COLORS.text }
    },
    series: [{
      name: 'Food Insecurity Rate', type: 'map', map: 'USA-access', roam: false,
      projection: albersProjection, aspectScale: 1, zoom: 1.1, top: 10, left: 'center',
      emphasis: {
        label: { show: true, color: COLORS.text, fontSize: 12, fontWeight: 'bold' },
        itemStyle: { areaColor: COLORS.secondary, borderColor: '#fff', borderWidth: 1.5 }
      },
      itemStyle: { borderColor: COLORS.mapBorder, borderWidth: COLORS.mapBorderWidth, areaColor: 'rgba(255,255,255,0.08)' },
      label: { show: false }, data: mapData, animationDurationUpdate: 500
    }]
  }, true);

  // Dynamic insight
  const sorted = [...mapData].sort((a, b) => b.value - a.value);
  const insightEl = document.getElementById('insecurity-map-insight');
  if (insightEl && sorted.length >= 3) {
    insightEl.innerHTML = `<strong>${sorted[0].name} (${sorted[0].value}%)</strong>, <strong>${sorted[1].name} (${sorted[1].value}%)</strong>, and <strong>${sorted[2].name} (${sorted[2].value}%)</strong> have the highest food insecurity rates — based on 2023 CDC PLACES census-tract data.`;
  }
}

// -- SNAP Retailer Density Map --
function renderSnapRetailers(geoJSON, retailerData, accessStates) {
  // Reuse the desert map chart instance (toggled view)
  const chart = getOrCreateChart('chart-desert-map');
  if (!chart) return;

  echarts.registerMap('USA-snap-retail', geoJSON);

  // Build access lookup for cross-referencing
  const accessByFips = {};
  accessStates.forEach(s => { accessByFips[s.fips] = s; });

  // SNAP palette: red (fewer/danger) → amber → green (more/safe) — semantically clear
  const palSnap = MAP_PALETTES.snap;

  const mapData = retailerData.states.map(s => {
    const access = accessByFips[s.fips] || {};
    const superPct = s.totalRetailers > 0
      ? ((s.supermarkets + s.superStores + s.largeGrocery) / s.totalRetailers * 100).toFixed(1)
      : 0;
    return {
      name: s.name, value: s.retailersPer100K, fips: s.fips,
      totalRetailers: s.totalRetailers,
      supermarkets: s.supermarkets,
      superStores: s.superStores,
      largeGrocery: s.largeGrocery,
      convenience: s.convenience,
      smallGrocery: s.smallGrocery,
      specialty: s.specialty,
      farmersMarkets: s.farmersMarkets,
      population: s.population,
      superPct,
      lowAccessPct: access.lowAccessPct || 'N/A'
    };
  });

  const albersProjection = { project: p => p, unproject: p => p };

  chart.setOption({
    tooltip: {
      trigger: 'item', ...TOOLTIP_STYLE,
      formatter: params => {
        const d = params.data;
        if (!d) return '';
        return `<strong class="fnf-tooltip-label">${d.name}</strong><br/>
          <span class="csp-text-secondary">Retailers per 100K:</span> <strong>${d.value}</strong><br/>
          Total Authorized: ${fmtNum(d.totalRetailers)}<br/>
          <span class="fnf-tooltip-muted">--- Store Types ---</span><br/>
          Supermarkets: ${fmtNum(d.supermarkets)}<br/>
          Super Stores: ${fmtNum(d.superStores)}<br/>
          Large Grocery: ${fmtNum(d.largeGrocery)}<br/>
          Convenience: ${fmtNum(d.convenience)}<br/>
          Small Grocery: ${fmtNum(d.smallGrocery)}<br/>
          Farmers Markets: ${fmtNum(d.farmersMarkets)}<br/>
          <span class="csp-text-secondary">Full-Service Stores:</span> ${d.superPct}%<br/>
          <span class="fnf-tooltip-muted">Food Deserts: ${d.lowAccessPct}%</span>`;
      }
    },
    visualMap: {
      left: 'right', bottom: 20,
      min: 58, max: 125,
      text: ['More Retailers', 'Fewer Retailers'], calculable: true,
      inRange: { color: [palSnap.low, palSnap.mid, palSnap.high] },
      textStyle: { color: COLORS.text }
    },
    series: [{
      name: 'SNAP Retailers per 100K', type: 'map', map: 'USA-snap-retail', roam: false,
      projection: albersProjection, aspectScale: 1, zoom: 1.1, top: 10, left: 'center',
      emphasis: {
        label: { show: true, color: COLORS.text, fontSize: 12, fontWeight: 'bold' },
        itemStyle: { areaColor: COLORS.secondary, borderColor: '#fff', borderWidth: 1.5 }
      },
      itemStyle: { borderColor: COLORS.mapBorder, borderWidth: COLORS.mapBorderWidth, areaColor: 'rgba(255,255,255,0.08)' },
      label: { show: false }, data: mapData, animationDurationUpdate: 500
    }]
  });

  updateFreshness('snap-retailers', { _static: true, _dataYear: 'FY2024' });

  // CSV export for SNAP retailers (on the shared map container)
  addExportButton('chart-desert-map', 'snap-retailers-by-state.csv', () => ({
    headers: ['State', 'Total Retailers', 'Retailers per 100K', 'Supermarkets', 'Super Stores', 'Large Grocery', 'Medium Grocery', 'Small Grocery', 'Convenience', 'Specialty', 'Farmers Markets', 'Other', 'Food Deserts (%)'],
    rows: retailerData.states.map(s => {
      const access = accessByFips[s.fips] || {};
      return [s.name, s.totalRetailers, s.retailersPer100K, s.supermarkets, s.superStores, s.largeGrocery, s.mediumGrocery, s.smallGrocery, s.convenience, s.specialty, s.farmersMarkets, s.totalRetailers - s.supermarkets - s.superStores - s.largeGrocery - s.mediumGrocery - s.smallGrocery - s.convenience - s.specialty - s.farmersMarkets, access.lowAccessPct || ''];
    })
  }));
}

// -- Low Access (Current): state-level computed from FNS + Census tract data --
function renderLowAccessMap(geoJSON, accessData) {
  const chart = getOrCreateChart('chart-desert-map');
  if (!chart) return;

  const mapData = accessData.states.map(s => ({
    name: s.name, value: s.lowAccessPct, fips: s.fips,
    totalTracts: s.totalTracts, lowAccessTracts: s.lowAccessTracts,
    totalPopulation: s.totalPopulation, lowAccessPopulation: s.lowAccessPopulation,
    avgDistance: s.avgDistance
  }));

  const albersProjection = { project: p => p, unproject: p => p };

  chart.setOption({
    tooltip: {
      trigger: 'item', ...TOOLTIP_STYLE,
      formatter: params => {
        const d = params.data;
        if (!d) return '';
        return `<strong class="fnf-tooltip-label">${d.name}</strong><br/>
          <span class="csp-text-secondary">Low-Access Tracts:</span> ${d.value}%<br/>
          Population: ${fmtNum(d.totalPopulation)}<br/>
          Low-Access Pop: ${fmtNum(d.lowAccessPopulation)}<br/>
          Avg Distance: ${d.avgDistance} mi<br/>
          <span class="csp-text-secondary-sm">Click to see counties</span>`;
      }
    },
    visualMap: {
      left: 'right', bottom: 20, min: 20, max: 65,
      text: ['More Low-Access', 'Fewer Low-Access'], calculable: true,
      inRange: { color: [PAL.low, PAL.mid, PAL.high] },
      textStyle: { color: COLORS.text }
    },
    series: [{
      name: 'Low-Access Tracts (%)', type: 'map', map: 'USA-access', roam: false,
      projection: albersProjection, aspectScale: 1, zoom: 1.1, top: 10, left: 'center',
      emphasis: {
        label: { show: true, color: COLORS.text, fontSize: 12, fontWeight: 'bold' },
        itemStyle: { areaColor: COLORS.secondary, borderColor: '#fff', borderWidth: 1.5 }
      },
      itemStyle: { borderColor: COLORS.mapBorder, borderWidth: COLORS.mapBorderWidth, areaColor: 'rgba(255,255,255,0.08)' },
      label: { show: false }, data: mapData, animationDurationUpdate: 500
    }]
  }, true);

  // Dynamic insight
  const sorted = [...mapData].sort((a, b) => b.value - a.value);
  const insightEl = document.getElementById('low-access-insight');
  if (insightEl && sorted.length >= 3) {
    _lowAccessDefaultInsight = `<strong>${sorted[0].name} (${sorted[0].value}%)</strong>, <strong>${sorted[1].name} (${sorted[1].value}%)</strong>, and <strong>${sorted[2].name} (${sorted[2].value}%)</strong> have the highest share of low-access census tracts \u2014 computed from ${accessData.meta.qualifyingRetailerCount?.toLocaleString() || '40K'} current SNAP-authorized grocery stores.`;
    insightEl.innerHTML = _lowAccessDefaultInsight;
  }
}

// -- Low Access county drill-down --
function renderLowAccessCounty(countyGeo, countyData) {
  const chart = getOrCreateChart('chart-desert-map');
  if (!chart) return;

  // Build county lookup by FIPS
  const countyByFips = {};
  countyData.forEach(c => { countyByFips[c.fips] = c; });

  const mapName = chart.__currentMapName || 'USA-access';
  const mapData = countyGeo.features.map(f => {
    const fips = f.properties.fips;
    const c = countyByFips[fips];
    return {
      name: f.properties.name || f.properties.NAME,
      value: c ? c.lowAccessPct : 0,
      totalTracts: c ? c.totalTracts : 0,
      lowAccessTracts: c ? c.lowAccessTracts : 0,
      lowAccessPopulation: c ? c.lowAccessPopulation : 0,
      avgDistance: c ? c.avgDistance : 0,
      isUrban: c ? c.isUrban : null,
      population: c ? c.totalPopulation : (f.properties.population || 0)
    };
  });

  chart.setOption({
    tooltip: {
      trigger: 'item', ...TOOLTIP_STYLE,
      formatter: params => {
        const d = params.data;
        if (!d) return '';
        return `<strong class="fnf-tooltip-label">${d.name}</strong><br/>
          <span class="csp-text-secondary">Low-Access Tracts:</span> ${d.value}%<br/>
          Tracts: ${d.lowAccessTracts} of ${d.totalTracts}<br/>
          Low-Access Pop: ${fmtNum(d.lowAccessPopulation)}<br/>
          Avg Distance: ${d.avgDistance} mi<br/>
          Population: ${fmtNum(d.population)}`;
      }
    },
    visualMap: {
      left: 'right', bottom: 20, min: 0, max: 100,
      text: ['More Low-Access', 'Fewer Low-Access'], calculable: true,
      inRange: { color: [PAL.low, PAL.mid, PAL.high] },
      textStyle: { color: COLORS.text }
    },
    series: [{
      name: 'Low-Access Tracts (%)', type: 'map', map: mapName, roam: false,
      emphasis: {
        label: { show: true, color: COLORS.text, fontSize: 11, fontWeight: 'bold' },
        itemStyle: { areaColor: COLORS.secondary, borderColor: '#fff', borderWidth: 1 }
      },
      itemStyle: { borderColor: COLORS.countyBorder, borderWidth: COLORS.countyBorderWidth, areaColor: 'rgba(255,255,255,0.05)' },
      label: { show: false }, data: mapData, animationDurationUpdate: 500
    }]
  }, true);

  // County click: update low-access insight callout with county-specific narrative
  const insightEl = document.getElementById('low-access-insight');
  chart.off('click');
  chart.on('click', (params) => {
    const d = /** @type {Record<string, *>} */ (params.data);
    if (!d || !insightEl) return;
    const tractInfo = d.totalTracts > 0 ? ` (${d.lowAccessTracts} of ${d.totalTracts} tracts)` : '';
    let urbanSentence = '';
    if (d.isUrban === true) {
      urbanSentence = ' \u2014 Urban low-access areas often reflect income barriers more than physical distance.';
    } else if (d.isUrban === false) {
      urbanSentence = ' \u2014 Rural counties face compounding barriers: distance, vehicle dependency, and limited retailer options.';
    }
    insightEl.textContent = `${d.name} County: ${d.value}% of tracts are low-access${tractInfo}. ${fmtNum(d.lowAccessPopulation)} residents lack easy grocery access${urbanSentence} Average distance to store: ${d.avgDistance} mi.`;
  });
}

// -- Accessible Data Table --
function populateAccessibleTable(states, retailerData) {
  const tbody = document.getElementById('accessible-access-table');
  if (!tbody) return;

  // Build retailer lookup
  const retailerByFips = {};
  if (retailerData?.states) {
    retailerData.states.forEach(s => { retailerByFips[s.fips] = s; });
  }

  states.forEach(s => {
    const r = retailerByFips[s.fips];
    const tr = document.createElement('tr');
    const estimate = Math.round((s.lowAccessPopulation || 0) * ((s.povertyRate || 0) / 100));
    tr.innerHTML = `<td>${s.name}</td><td>${s.lowAccessPct}%</td><td>${s.urbanLowAccess}</td><td>${s.ruralLowAccess}</td><td>${s.avgDistance}</td><td>${fmtNum(s.lowAccessPopulation || 0)}</td><td>${estimate > 0 ? fmtNum(estimate) : 'N/A'}</td><td>${r ? fmtNum(r.totalRetailers) : 'N/A'}</td><td>${r ? r.retailersPer100K : 'N/A'}</td>`;
    tbody.appendChild(tr);
  });
}

// -- Chart 7: Food Deserts vs Food Insecurity Correlation --

// Shared: render the scatter with given points + label info
function drawAccessInsecurityScatter(chart, points, { xLabel, yLabel, tooltipFn, symbolSizeFn, regionBased }) {
  if (!points.length) return null;

  let series, reg;

  if (regionBased) {
    const byRegion = {};
    Object.keys(REGION_COLORS).forEach(r => { byRegion[r] = []; });
    points.forEach(p => byRegion[getRegion(p.name)].push(p));

    reg = linearRegression(points.map(p => p.value));
    const xs = points.map(p => p.value[0]);
    const xMin = Math.min(...xs), xMax = Math.max(...xs);
    const rLine = {
      symbol: 'none', silent: true,
      lineStyle: { color: 'rgba(255,255,255,0.35)', type: 'dashed', width: 1.5 },
      data: [[{ coord: [xMin, reg.slope * xMin + reg.intercept] }, { coord: [xMax, reg.slope * xMax + reg.intercept] }]],
      label: { formatter: `r = ${reg.r.toFixed(2)}`, color: COLORS.textMuted, fontSize: 11, position: 'end' }
    };

    series = Object.entries(REGION_COLORS).map(([region, color], i) => ({
      name: region, type: 'scatter',
      data: byRegion[region],
      symbolSize: symbolSizeFn,
      itemStyle: { color, opacity: 0.85 },
      emphasis: { itemStyle: { opacity: 1 } },
      animationDuration: 2000,
      ...(i === 0 ? { markLine: rLine } : {})
    }));
  } else {
    // Single-series (county view) — color by food insecurity severity
    reg = linearRegression(points.map(p => p.value));
    const xs = points.map(p => p.value[0]);
    const xMin = Math.min(...xs), xMax = Math.max(...xs);
    const rLine = {
      symbol: 'none', silent: true,
      lineStyle: { color: 'rgba(255,255,255,0.35)', type: 'dashed', width: 1.5 },
      data: [[{ coord: [xMin, reg.slope * xMin + reg.intercept] }, { coord: [xMax, reg.slope * xMax + reg.intercept] }]],
      label: { formatter: `r = ${reg.r.toFixed(2)}`, color: COLORS.textMuted, fontSize: 11, position: 'end' }
    };

    series = [{
      name: 'Counties', type: 'scatter',
      data: points,
      symbolSize: symbolSizeFn,
      markLine: rLine,
      animationDuration: 1500
    }];
  }

  const legendOpt = regionBased ? {
    top: 5, right: 10,
    textStyle: { color: COLORS.text, fontSize: 11 },
    itemWidth: 10, itemHeight: 10
  } : { show: false };

  const visualMapOpt = regionBased ? null : [{
    show: true, dimension: 1, min: 5, max: 30,
    inRange: { color: [PAL.low, PAL.mid, PAL.high] },
    text: ['High Insecurity', 'Low'],
    textStyle: { color: COLORS.textMuted, fontSize: 10 },
    right: 10, top: 10, calculable: false, itemWidth: 12, itemHeight: 80
  }];

  chart.setOption({
    legend: legendOpt,
    visualMap: visualMapOpt,
    tooltip: { ...TOOLTIP_STYLE, formatter: tooltipFn },
    grid: { left: 55, right: regionBased ? 20 : 80, top: 35, bottom: 50 },
    xAxis: {
      name: xLabel, nameLocation: 'center', nameGap: 35,
      nameTextStyle: { color: COLORS.textMuted },
      axisLabel: { color: COLORS.textMuted, formatter: '{value}%' },
      splitLine: { lineStyle: { color: COLORS.gridLine } }
    },
    yAxis: {
      name: yLabel,
      nameTextStyle: { color: COLORS.textMuted },
      axisLabel: { color: COLORS.textMuted, formatter: '{value}%' },
      splitLine: { lineStyle: { color: COLORS.gridLine } }
    },
    series
  }, true);

  return reg;
}

// Update insight text based on regression
function updateAccessInsecurityInsight(reg, mode, countyCount, stateName) {
  const insightEl = document.getElementById('access-insecurity-insight');
  if (!insightEl || !reg) return;

  const strength = Math.abs(reg.r) >= 0.7 ? 'Strong' : Math.abs(reg.r) >= 0.4 ? 'Moderate' : 'Weak';

  if (mode === 'county') {
    if (Math.abs(reg.r) < 0.4) {
      insightEl.textContent = `${strength} correlation (r = ${reg.r.toFixed(2)}) across ${countyCount} counties in ${stateName}. At the county level within this state, food desert prevalence is a weak predictor of food insecurity — local economic conditions and poverty appear more strongly associated with outcomes than grocery access.`;
    } else {
      insightEl.textContent = `${strength} correlation (r = ${reg.r.toFixed(2)}) across ${countyCount} counties in ${stateName}. Counties with more food desert tracts do tend to have higher food insecurity — but the scatter shows wide variation, suggesting local factors like poverty and employment may matter just as much.`;
    }
  } else {
    if (Math.abs(reg.r) < 0.4) {
      insightEl.textContent = `${strength} state-level correlation (r = ${reg.r.toFixed(2)}). Poverty (r = 0.931) is the dominant predictor of food insecurity — low food access does not independently drive hunger at the state level. However, access compounds poverty in specific regions where residents face both income and geographic barriers.`;
    } else {
      insightEl.textContent = `${strength} correlation (r = ${reg.r.toFixed(2)}). Low-access prevalence and food insecurity do move together across states, but the relationship is imperfect — local factors like poverty, employment, and income likely play a major role.`;
    }
  }
}

// State-level scatter (original behavior)
function renderStateScatter(chart, accessStates, fiStates) {
  const fiByName = {};
  fiStates.forEach(s => { fiByName[s.name] = s; });

  const points = accessStates
    .map(s => {
      const fi = fiByName[s.name];
      if (!fi) return null;
      return { value: [s.lowAccessPct, fi.rate], name: s.name, population: s.population };
    })
    .filter(Boolean);

  const reg = drawAccessInsecurityScatter(chart, points, {
    xLabel: 'Low-Access Tracts (%)',
    yLabel: 'Food Insecurity Rate (%)',
    regionBased: true,
    symbolSizeFn: (_, params) => Math.max(8, Math.sqrt(params.data.population / 200000)),
    tooltipFn: params => {
      const d = params.data;
      const region = getRegion(d.name);
      return `<strong>${d.name}</strong> <span class="${REGION_CLASS[region] || ''}">(${region})</span><br/>Food Deserts: ${d.value[0]}%<br/>Food Insecurity: ${d.value[1]}%`;
    }
  });

  updateAccessInsecurityInsight(reg, 'state');
}

// County-level scatter for a single state
async function renderCountyScatter(chart, stateFips, stateName, accessData) {
  chart.showLoading({ text: `Loading ${stateName} counties...`, color: COLORS.secondary, textColor: COLORS.text, maskColor: 'rgba(0,0,0,0.6)' });

  try {
    // Fetch county GeoJSON (has food insecurity rate from CHR)
    const geoRes = await fetch(`/data/counties/${stateFips}.json`);
    if (!geoRes.ok) throw new Error(`County data not available for ${stateName}`);
    const countyGeo = await geoRes.json();

    // Build current food access lookup by county FIPS (consistent with state-level map)
    const stateAccess = accessData?.states?.find(s => s.fips === stateFips);
    const accessByFips = {};
    if (stateAccess?.counties) {
      stateAccess.counties.forEach(c => { accessByFips[c.fips] = c; });
    }
    const hasCurrentAccess = Object.keys(accessByFips).length > 0;

    // Build scatter points: x = low-access tract %, y = food insecurity rate
    const points = [];
    countyGeo.features.forEach(f => {
      const props = f.properties;
      if (!props || !props.rate) return; // need food insecurity rate

      const fips5 = props.fips || f.id || '';
      const access = accessByFips[fips5];

      let desertPct;
      if (hasCurrentAccess && access) {
        // Current computed data: % of tracts beyond distance threshold
        desertPct = access.lowAccessPct;
      } else if (props.limitedAccess !== undefined) {
        // Fallback: CHR "limited access to healthy foods" index
        desertPct = props.limitedAccess;
      } else {
        return; // no desert metric available
      }

      points.push({
        value: [desertPct, props.rate],
        name: props.name || props.NAME || 'Unknown',
        population: props.population || 0,
        povertyRate: props.povertyRate
      });
    });

    chart.hideLoading();

    if (!points.length) {
      chart.setOption({ title: { text: `No matching county data for ${stateName}`, left: 'center', top: 'center', textStyle: { color: COLORS.textMuted, fontSize: 14 } }, series: [] }, true);
      updateAccessInsecurityInsight(null, 'county', 0, stateName);
      return;
    }

    const xLabel = hasCurrentAccess ? 'Low-Access Tracts (%)' : 'Limited Food Access Index';

    const reg = drawAccessInsecurityScatter(chart, points, {
      xLabel,
      yLabel: 'Food Insecurity Rate (%)',
      regionBased: false,
      symbolSizeFn: (_, params) => {
        const pop = params.data.population;
        return pop > 0 ? Math.max(5, Math.min(20, Math.sqrt(pop / 5000))) : 6;
      },
      tooltipFn: params => {
        const d = params.data;
        let html = `<strong>${d.name}</strong><br/>`;
        html += `${hasCurrentAccess ? 'Low-Access Tracts' : 'Limited Access'}: ${d.value[0]}%<br/>`;
        html += `Food Insecurity: ${d.value[1]}%<br/>`;
        if (d.povertyRate !== undefined) html += `Poverty Rate: ${d.povertyRate}%<br/>`;
        if (d.population) html += `Population: ${fmtNum(d.population)}`;
        return html;
      }
    });

    updateAccessInsecurityInsight(reg, 'county', points.length, stateName);
  } catch {
    chart.hideLoading();
    chart.setOption({ title: { text: `Could not load county data for ${stateName}`, left: 'center', top: 'center', textStyle: { color: COLORS.textMuted, fontSize: 14 } }, series: [] }, true);
  }
}

// Main entry: set up chart + toggle
function renderAccessInsecurity(accessStates, fiStates, accessData) {
  const chart = getOrCreateChart('chart-access-insecurity');
  if (!chart) return;

  // Build state FIPS lookup: name -> fips
  const fipsByName = {};
  accessStates.forEach(s => { fipsByName[s.name] = s.fips; });

  // Render default state view
  renderStateScatter(chart, accessStates, fiStates);

  // Initialize toggle buttons
  const toggleContainer = document.getElementById('access-insecurity-toggle');
  if (!toggleContainer) return;

  toggleContainer.innerHTML = [
    '<button class="dashboard-metric-btn dashboard-metric-btn--active" data-ai-mode="state" aria-pressed="true">State View (50 states)</button>',
    '<button class="dashboard-metric-btn" data-ai-mode="county" aria-pressed="false">County View</button>'
  ].join('');

  // County state selector (hidden by default)
  const selectorWrap = document.createElement('div');
  selectorWrap.id = 'ai-county-selector';
  selectorWrap.style.cssText = 'display:none;margin-top:0.5rem;text-align:center;';
  selectorWrap.innerHTML = `
    <label for="ai-state-select" class="dashboard-state-selector__label">Select a state:</label>
    <select id="ai-state-select" class="dashboard-state-selector__select">
      <option value="">Choose a state...</option>
      ${US_STATES.map(([code, name]) => `<option value="${code}">${name}</option>`).join('')}
    </select>
  `;
  toggleContainer.appendChild(selectorWrap);

  let currentMode = 'state';

  // Handle toggle clicks
  toggleContainer.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-ai-mode]');
    if (!btn) return;
    const mode = btn.dataset.aiMode;
    if (mode === currentMode) return;

    currentMode = mode;
    toggleContainer.querySelectorAll('.dashboard-metric-btn').forEach(b => {
      b.classList.remove('dashboard-metric-btn--active');
      b.setAttribute('aria-pressed', 'false');
    });
    btn.classList.add('dashboard-metric-btn--active');
    btn.setAttribute('aria-pressed', 'true');

    const selector = document.getElementById('ai-county-selector');
    const stateSelect = document.getElementById('ai-state-select');

    if (mode === 'state') {
      if (selector) selector.style.display = 'none';
      renderStateScatter(chart, accessStates, fiStates);
    } else {
      if (selector) selector.style.display = '';
      // If a state is already selected, load it
      if (stateSelect && stateSelect.value) {
        const stateName = US_STATES.find(([c]) => c === stateSelect.value)?.[1];
        const stateFips = stateName ? fipsByName[stateName] : null;
        if (stateFips) {
          renderCountyScatter(chart, stateFips, stateName, accessData);
        }
      } else {
        // Show prompt to select a state
        chart.setOption({
          title: { text: 'Select a state above to view county-level data', left: 'center', top: 'center', textStyle: { color: COLORS.textMuted, fontSize: 14 } },
          legend: { show: false }, visualMap: null, series: []
        }, true);
        const insightEl = document.getElementById('access-insecurity-insight');
        if (insightEl) insightEl.textContent = 'Choose a state from the dropdown to see county-level correlation between food deserts and food insecurity.';
      }
    }
  });

  // Handle state selector change
  const stateSelect = document.getElementById('ai-state-select');
  if (stateSelect) {
    stateSelect.addEventListener('change', () => {
      if (currentMode !== 'county') return;
      const code = stateSelect.value;
      if (!code) {
        chart.setOption({
          title: { text: 'Select a state above to view county-level data', left: 'center', top: 'center', textStyle: { color: COLORS.textMuted, fontSize: 14 } },
          legend: { show: false }, visualMap: null, series: []
        }, true);
        return;
      }
      const stateName = US_STATES.find(([c]) => c === code)?.[1];
      const stateFips = stateName ? fipsByName[stateName] : null;
      if (stateFips) {
        renderCountyScatter(chart, stateFips, stateName, accessData);
      }
    });
  }
}

// -- Chart 6: SDOH Housing Burden vs Food Access (live Census data, non-blocking) --
async function fetchSDOHAccess(accessStates) {
  try {
    const res = await fetch('/api/dashboard-sdoh.php');
    if (!res.ok) return;
    const sdoh = await res.json();
    if (sdoh.error || !sdoh.states) return;

    const section = document.getElementById('section-sdoh-access');
    if (section) section.classList.remove('hidden');

    const chart = createChart('chart-sdoh-access');
    if (!chart) return;

    // Build lookup from food access atlas data
    const accessByName = {};
    accessStates.forEach(s => { accessByName[s.name] = s; });

    const points = sdoh.states
      .map(s => {
        const a = accessByName[s.name];
        if (!a) return null;
        return {
          value: [s.housingBurdenPct, a.lowAccessPct],
          name: s.name,
          population: s.population,
          noVehicle: s.noVehiclePct,
          uninsured: s.uninsuredPct
        };
      })
      .filter(Boolean);

    const byRegion = {};
    Object.keys(REGION_COLORS).forEach(r => { byRegion[r] = []; });
    points.forEach(p => byRegion[getRegion(p.name)].push(p));

    const reg = linearRegression(points.map(p => p.value));
    const xs = points.map(p => p.value[0]);
    const xMin = Math.min(...xs), xMax = Math.max(...xs);
    const rLine = {
      symbol: 'none', silent: true,
      lineStyle: { color: 'rgba(255,255,255,0.35)', type: 'dashed', width: 1.5 },
      data: [[{ coord: [xMin, reg.slope * xMin + reg.intercept] }, { coord: [xMax, reg.slope * xMax + reg.intercept] }]],
      label: { formatter: `r = ${reg.r.toFixed(2)}`, color: COLORS.textMuted, fontSize: 11, position: 'end' }
    };

    const series = Object.entries(REGION_COLORS).map(([region, color], i) => ({
      name: region, type: 'scatter',
      data: byRegion[region],
      symbolSize: (_, params) => Math.max(8, Math.sqrt(params.data.population / 200000)),
      itemStyle: { color, opacity: 0.85 },
      emphasis: { itemStyle: { opacity: 1 } },
      animationDuration: 1500,
      ...(i === 0 ? { markLine: rLine } : {})
    }));

    chart.setOption({
      legend: {
        top: 5, right: 10,
        textStyle: { color: COLORS.text, fontSize: 11 },
        itemWidth: 10, itemHeight: 10
      },
      tooltip: {
        ...TOOLTIP_STYLE,
        formatter: params => {
          const d = params.data;
          const region = getRegion(d.name);
          return `<strong>${d.name}</strong> <span class="${REGION_CLASS[region] || ''}">(${region})</span><br/>` +
            `Housing Burden (50%+): ${d.value[0]}%<br/>` +
            `Food Deserts: ${d.value[1]}%<br/>` +
            `No Vehicle: ${d.noVehicle}%<br/>` +
            `Uninsured: ${d.uninsured}%`;
        }
      },
      grid: { left: 55, right: 20, top: 35, bottom: 50 },
      xAxis: {
        name: 'Severe Housing Cost Burden (%)', nameLocation: 'center', nameGap: 35,
        nameTextStyle: { color: COLORS.textMuted },
        axisLabel: { color: COLORS.textMuted, formatter: '{value}%' },
        splitLine: { lineStyle: { color: COLORS.gridLine } }
      },
      yAxis: {
        name: 'Low-Access Tracts (%)',
        nameTextStyle: { color: COLORS.textMuted },
        axisLabel: { color: COLORS.textMuted, formatter: '{value}%' },
        splitLine: { lineStyle: { color: COLORS.gridLine } }
      },
      series
    });

    const insightEl = document.getElementById('sdoh-access-insight');
    if (insightEl) {
      const strength = Math.abs(reg.r) >= 0.7 ? 'Strong' : Math.abs(reg.r) >= 0.4 ? 'Moderate' : 'Weak';
      insightEl.textContent = `${strength} correlation (r = ${reg.r.toFixed(2)}) between housing cost burden and food desert prevalence. States where renters are most cost-burdened tend to have more food access challenges.`;
    }

    updateFreshness('sdoh-access', sdoh);
  } catch { /* SDOH is optional — fail silently */ }
}

/** Sync hero stat data-target values from live JSON data */
function syncHeroStats(nat, curStates) {
  const heroTargets = document.querySelectorAll('.dashboard-hero .dashboard-stat__number');
  heroTargets.forEach(el => {
    const label = el.nextElementSibling?.textContent?.trim() || '';
    if (label.includes('Low-Access Population')) el.dataset.target = (nat.lowAccessPopulation / 1e6).toFixed(1);
    else if (label.includes('Low-Access Tracts') && !label.includes('%')) el.dataset.target = String(nat.lowAccessTracts);
    else if (label.includes('Urban Low-Access')) {
      const totalUrban = curStates.reduce((s, st) => s + (st.urbanLowAccess || 0), 0);
      const totalTracts = curStates.reduce((s, st) => s + (st.totalTracts || 0), 0);
      el.dataset.target = totalTracts > 0 ? Math.round(totalUrban / totalTracts * 100) : 44;
    }
    else if (label.includes('Tracts Low-Access')) el.dataset.target = String(nat.lowAccessPct);
  });
}

/** Build narrative insight text for a state drill-down (used by drillDownLowAccess) */
function buildLowAccessInsight(stateName, stateAccess) {
  const pct = stateAccess.lowAccessPct;
  const pop = stateAccess.lowAccessPopulation;
  const dist = stateAccess.avgDistance;
  let distSentence;
  if (dist < 1.0) {
    distSentence = 'well within urban norms, suggesting the burden here is concentrated in specific pockets rather than statewide.';
  } else if (dist < 3.0) {
    distSentence = `near the national average of 2.1 miles, masking county-level variation across ${stateName}.`;
  } else {
    distSentence = `nearly ${(dist / 2.1).toFixed(1)}\xd7 the national average of 2.1 miles, a strong signal of rural food desert conditions.`;
  }
  return `${stateName} has ${pct}% of its census tracts classified as low-access, affecting ${fmtNum(pop)} residents. The average distance to the nearest grocery store is ${dist} miles \u2014 ${distSentence}`;
}

async function init() {
  try {
    const [currentAccessRes, geoRes, fiRes, snapRetailRes] = await Promise.all([
      fetch('/data/current-food-access.json'),
      fetch('/data/us-states-geo.json'),
      fetch('/data/food-insecurity-state.json'),
      fetch('/data/snap-retailers.json')
    ]);
    if (!currentAccessRes.ok || !geoRes.ok) throw new Error('Failed to load data');
    const [currentAccessData, geoJSON] = await Promise.all([currentAccessRes.json(), geoRes.json()]);
    const fiData = fiRes.ok ? await fiRes.json() : null;
    const snapRetailerData = snapRetailRes.ok ? await snapRetailRes.json() : null;

    const curStates = currentAccessData.states.map(s => ({ ...s, population: s.totalPopulation }));

    if (fiData?.states) {
      const fiByName = {};
      fiData.states.forEach(s => { fiByName[s.name] = s.povertyRate; });
      curStates.forEach(s => { if (fiByName[s.name] != null) s.povertyRate = fiByName[s.name]; });
    }

    updateFreshness('access', { _static: true, _dataYear: 'Current' });
    syncHeroStats(currentAccessData.national, curStates);
    animateCounters();
    const mapCtrl = renderDesertMap(geoJSON, currentAccessData.states, currentAccessData);
    renderUrbanRural(curStates);
    renderDistance(curStates);
    renderVehicle(curStates);
    if (fiData?.states) {
      renderDoubleBurden(curStates);
      renderAccessInsecurity(curStates, fiData.states, currentAccessData);
    }
    populateAccessibleTable(curStates, snapRetailerData);

    addExportButton('chart-desert-map', 'food-access-by-state.csv', () => ({
      headers: ['State', 'Low-Access Tracts (%)', 'Urban Low-Access', 'Rural Low-Access', 'Avg Distance (mi)', 'Low-Access Population', 'Low-Income Low-Access Pop (est.)'],
      rows: curStates.map(s => {
        const estimate = Math.round((s.lowAccessPopulation || 0) * ((s.povertyRate || 0) / 100));
        return [s.name, s.lowAccessPct, s.urbanLowAccess, s.ruralLowAccess, s.avgDistance, s.lowAccessPopulation || 0, estimate || ''];
      })
    }));

    // Map view toggle: Food Deserts (default) | Food Insecurity (CDC) | SNAP Retailers
    let currentMapView = 'deserts'; // Default — Food Deserts (current computed data)
    let cdcInsecurityData = null;
    const toggleContainer = document.getElementById('map-view-toggle');

    // Helper: switch to a specific view
    const switchMapView = (view) => {
      currentMapView = view;
      if (toggleContainer) {
        toggleContainer.querySelectorAll('.dashboard-metric-btn').forEach(b => {
          b.classList.remove('dashboard-metric-btn--active');
          b.setAttribute('aria-pressed', 'false');
        });
        const activeBtn = toggleContainer.querySelector(`[data-map-view="${view}"]`);
        if (activeBtn) {
          activeBtn.classList.add('dashboard-metric-btn--active');
          activeBtn.setAttribute('aria-pressed', 'true');
        }
      }

      const infoPanels = ['info-insecurity-mode', 'info-desert-mode', 'info-snap-mode'];
      const hint = document.querySelector('#chart-desert-map + .dashboard-chart__hint');
      const freshAccess = document.getElementById('freshness-access');
      const freshSnap = document.getElementById('freshness-snap-retailers');

      // Update map aria-label for current view
      const mapLabels = { deserts: 'Choropleth map showing low-access food tracts across US states', insecurity: 'Choropleth map showing food insecurity rates across US states', snap: 'Choropleth map showing SNAP retailer density across US states' };
      const mapEl = document.getElementById('chart-desert-map');
      if (mapEl) mapEl.setAttribute('aria-label', mapLabels[view] || mapLabels.deserts);

      // Hide all info panels first
      infoPanels.forEach(id => { const el = document.getElementById(id); if (el) el.classList.add('hidden'); });
      if (freshAccess) freshAccess.classList.remove('hidden');
      if (freshSnap) freshSnap.classList.add('hidden');

      if (view === 'insecurity' && cdcInsecurityData?.records) {
        if (mapCtrl) mapCtrl.setDrillDown(false);
        renderInsecurityMap(geoJSON, cdcInsecurityData.records, currentAccessData?.states || []);
        const el = document.getElementById('info-insecurity-mode'); if (el) el.classList.remove('hidden');
        if (hint) hint.textContent = 'Hover for state details — click any state for county breakdown';
        updateFreshness('access', cdcInsecurityData);
      } else if (view === 'snap' && snapRetailerData?.states) {
        if (mapCtrl) mapCtrl.setDrillDown(false);
        renderSnapRetailers(geoJSON, snapRetailerData, curStates);
        const el = document.getElementById('info-snap-mode'); if (el) el.classList.remove('hidden');
        if (hint) hint.textContent = 'Hover for retailer breakdown by store type';
        if (freshAccess) freshAccess.classList.add('hidden');
        if (freshSnap) freshSnap.classList.remove('hidden');
      } else if (view === 'deserts' && currentAccessData?.states) {
        // Low Access (Current) — computed from FNS + Census tract data
        if (mapCtrl) mapCtrl.setDrillDown(true);
        renderLowAccessMap(geoJSON, currentAccessData);
        const el = document.getElementById('info-desert-mode'); if (el) el.classList.remove('hidden');
        if (hint) hint.textContent = 'Hover for state details — click any state for county breakdown';
        updateFreshness('access', { _static: true, _dataYear: 'Current' });
      } else {
        // Fallback: show static data if computed data unavailable
        if (mapCtrl) { mapCtrl.setDrillDown(true); mapCtrl.showNational(); }
        const el = document.getElementById('info-desert-mode'); if (el) el.classList.remove('hidden');
        if (hint) hint.textContent = 'Hover for state details — click any state for county breakdown';
        updateFreshness('access', { _static: true, _dataYear: 'Current' });
      }
    };

    if (toggleContainer) {
      toggleContainer.addEventListener('click', (e) => {
        const btn = e.target.closest('[data-map-view]');
        if (!btn) return;
        const view = btn.dataset.mapView;
        if (view === currentMapView) return;
        switchMapView(view);
      });
    }

    // Set initial view to Food Deserts (computed data)
    if (currentAccessData?.states) {
      switchMapView('deserts');
    }

    // State deep-dive selector
    if (mapCtrl) {
      initStateSelector('state-selector-container', (stateCode) => {
        if (!stateCode) {
          // Reset to national view for the current mode
          switchMapView(currentMapView);
          return;
        }
        // Switch to a drillable view if in snap mode
        if (currentMapView === 'snap') {
          switchMapView(cdcInsecurityData ? 'insecurity' : 'deserts');
        }
        if (currentMapView === 'deserts' && currentAccessData?.states) {
          drillDownLowAccess(stateCode);
          return;
        }
        const stateName = US_STATES.find(([c]) => c === stateCode)?.[1];
        const match = curStates.find(s => s.name === stateName);
        if (match?.fips) mapCtrl.drillDown(match.name, match.fips);
      });
    }

    // Food Deserts drill-down: use pre-computed county data from current-food-access.json
    const drillDownLowAccess = async (stateCode) => {
      const stateName = US_STATES.find(([c]) => c === stateCode)?.[1];
      const match = curStates.find(s => s.name === stateName);
      if (!match?.fips || !currentAccessData?.states) return;

      const stateAccess = currentAccessData.states.find(s => s.fips === match.fips);
      if (!stateAccess?.counties) return;

      const chart = getOrCreateChart('chart-desert-map');
      if (chart) chart.showLoading({ text: `Loading ${stateName}...`, color: COLORS.secondary, textColor: COLORS.text, maskColor: 'rgba(0,0,0,0.6)' });

      try {
        const countyRes = await fetch(`/data/counties/${match.fips}.json`);
        if (!countyRes.ok) throw new Error('County GeoJSON unavailable');
        const countyGeo = await countyRes.json();

        const mapName = `access-lowaccess-${match.fips}`;
        echarts.registerMap(mapName, countyGeo);
        if (chart) { chart.__currentMapName = mapName; chart.hideLoading(); }

        renderLowAccessCounty(countyGeo, stateAccess.counties);

        const backBtn = document.getElementById('access-map-back-btn');
        if (backBtn) backBtn.classList.remove('hidden');
        const mapLabel = document.getElementById('access-map-state-label');
        if (mapLabel) mapLabel.textContent = stateName;

        const insightEl = document.getElementById('low-access-insight');
        if (insightEl && stateAccess) {
          insightEl.textContent = buildLowAccessInsight(stateName, stateAccess);
        }
      } catch {
        // P3-10: surface a visible error instead of silently leaving the
        // map in its previous state. Matches the existing fallback pattern
        // used by renderAccessInsecurity county drill at line ~1208.
        if (chart) {
          chart.hideLoading();
          chart.setOption({
            title: { text: `Could not load county data for ${stateName}`, left: 'center', top: 'center', textStyle: { color: COLORS.textMuted, fontSize: 14 } },
            series: []
          }, true);
        }
      }
    };

    initScrollReveal();
    window.addEventListener('resize', handleResize);

    // Non-blocking: fetch live SDOH data for housing burden chart
    fetchSDOHAccess(curStates);

    // Non-blocking: fetch CDC PLACES food insecurity for default map view
    fetch('/api/dashboard-places.php?type=food-insecurity')
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (!data || data.error || !data.records?.length) return;
        cdcInsecurityData = data;
        // CDC data ready — user can toggle to Food Insecurity view
      })
      .catch(() => { /* CDC unavailable — desert map stays as default */ });

  } catch {
    document.querySelectorAll('.dashboard-chart').forEach(el => {
      el.innerHTML = '<p class="dashboard-error-state">Unable to load dashboard data. Please refresh the page.</p>';
    });
    const errorEl = document.getElementById('dashboard-error');
    if (errorEl) {
      errorEl.textContent = 'Unable to load dashboard data. Please try refreshing the page.';
      errorEl.hidden = false;
    }
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
