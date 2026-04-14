/**
 * @fileoverview Food Insecurity Dashboard — ECharts visualizations
 * @description Interactive dashboard with choropleth map, trend line, bar chart,
 *              scatter plot, and meal cost comparison. Tree-shaken ECharts imports.
 */

import {
  echarts, COLORS, accentRgba, TOOLTIP_STYLE, MAP_PALETTES,
  fmtNum, animateCounters, createChart, getOrCreateChart, linearRegression,
  updateFreshness, initScrollReveal, handleResize,
  REGION_COLORS, REGION_CLASS, getRegion, addExportButton, US_STATES
} from './shared/dashboard-utils.js';
import { initStateSelector } from './shared/state-selector.js';
import { handleDashboardError } from './shared/error-handler.js';
import errorTracker from '../monitoring/error-tracker.js';

const PAL = MAP_PALETTES.insecurity;
const LOW_ACCESS_COLOR = '#f59e0b'; // amber — used in Triple Burden + State Deep-Dive

// P2-24: Module-scope cache for state food-insecurity data. Previously lived on
// _stateData as a cross-function data bus within this module — lifted
// to module scope so it can't leak to other scripts or be clobbered globally.
let _stateData = null;

// Metric configuration shared across map views
const MAP_METRICS = {
  rate: { name: 'Food Insecurity Rate', suffix: '%', min: 8, max: 20 },
  childRate: { name: 'Child Food Insecurity', suffix: '%', min: 10, max: 30 },
  persons: { name: 'Food Insecure Persons', suffix: '', min: 0, max: 5000000 },
  mealGap: { name: 'Annual Meal Gap', suffix: '', min: 0, max: 900000000 },
  mealCost: { name: 'Average Meal Cost', suffix: '$', min: 3, max: 5.5 },
  snapCoverage: { name: 'SNAP Coverage Ratio', suffix: '%', min: 40, max: 150 }
};

// State tooltip formatter (pure — depends only on fmtNum)
function stateTooltip(params) {
  const d = params.data;
  if (!d) return '';
  const snapStr = typeof d.snapParticipation === 'number'
    ? `${fmtNum(d.snapParticipation)} (${d.snapCoverage || '—'}% coverage)`
    : '— (data unavailable)';
  return `<strong class="fnf-tooltip-label">${d.name}</strong><br/>
    <span class="csp-text-secondary">Food Insecurity:</span> ${d.rate}%<br/>
    <span class="csp-text-accent">Child Rate:</span> ${d.childRate}%<br/>
    Persons: ${fmtNum(d.persons)}<br/>
    Meal Gap: ${fmtNum(d.mealGap)} meals/yr<br/>
    Avg Meal Cost: $${d.mealCost}<br/>
    Poverty Rate: ${d.povertyRate}%<br/>
    SNAP: ${snapStr}<br/>
    <span class="csp-text-secondary-sm">Click to see counties</span>`;
}

// County tooltip formatter (pure — depends only on fmtNum)
function countyTooltip(params) {
  const d = params.data;
  if (!d) return '';
  return `<strong class="fnf-tooltip-label">${d.name}</strong><br/>
    Population: ${fmtNum(d.population || 0)}<br/>
    <span class="csp-text-secondary">Food Insecurity:</span> ${d.rate}% <span class="fnf-tooltip-muted">(est.)</span><br/>
    <span class="csp-text-accent">Child Rate:</span> ${d.childRate}%<br/>
    Poverty Rate: ${d.povertyRate}%<br/>
    Persons: ${fmtNum(d.persons)}<br/>
    Meal Gap: ${fmtNum(d.mealGap)} meals/yr<br/>
    Avg Meal Cost: $${d.mealCost} <span class="fnf-tooltip-muted">(state avg)</span>`;
}

// Format a metric value for insight text (used by both drillDown and click handler)
function fmtMetricVal(value, metricKey) {
  const cfg = MAP_METRICS[metricKey];
  if (metricKey === 'mealCost') return `$${value}`;
  if (metricKey === 'persons' || metricKey === 'mealGap') return fmtNum(value);
  return `${value}${cfg.suffix}`;
}

// Build insight text comparing a county value to its state average
function buildCountyInsight(countyName, countyValue, stateObj, metricKey) {
  const cfg = MAP_METRICS[metricKey];
  const stateVal = stateObj[metricKey] ?? stateObj.rate;
  const diff = typeof countyValue === 'number' && typeof stateVal === 'number'
    ? (countyValue - stateVal).toFixed(metricKey === 'mealCost' ? 2 : 1)
    : null;
  const sign = diff !== null && diff >= 0 ? '+' : '';
  const diffStr = diff !== null ? ` (${sign}${diff}${metricKey === 'mealCost' ? '' : cfg.suffix} vs. ${stateObj.name} avg of ${fmtMetricVal(stateVal, metricKey)})` : '';
  return `${countyName}: ${cfg.name.toLowerCase()} ${fmtMetricVal(countyValue, metricKey)}${diffStr}. ~${fmtNum(stateObj.persons)} residents affected (modeled estimate).`;
}

// -- Map Chart with County Drill-Down --
function renderMap(geoJSON, data, metric = 'rate', onStateClick, onDrillDownComplete) {
  const chart = createChart('chart-map');
  if (!chart) return;

  const albersProjection = { project: (point) => point, unproject: (point) => point };
  echarts.registerMap('USA', geoJSON);

  // Compute SNAP coverage ratio per state
  data.states.forEach(s => {
    s.snapCoverage = s.persons > 0 ? Math.round((s.snapParticipation / s.persons) * 100) : 0;
  });

  // Drill-down state
  let currentView = 'national';
  let currentMetric = metric;
  let currentStateName = '';
  let lastCountyData = null;

  // Show national (state-level) view
  function showNational() {
    currentView = 'national';
    lastCountyData = null;
    const cfg = MAP_METRICS[currentMetric];
    const mapData = data.states.map(s => ({ name: s.name, value: s[currentMetric], ...s }));

    // Hide back button
    const backBtn = document.getElementById('map-back-btn');
    if (backBtn) backBtn.classList.add('hidden');
    const mapLabel = document.getElementById('map-state-label');
    if (mapLabel) mapLabel.textContent = '';
    currentStateName = '';
    const mapInsight = document.getElementById('map-insight');
    if (mapInsight) {
      const worst = data.states.reduce((a, b) => (b.rate > a.rate ? b : a), data.states[0]);
      mapInsight.textContent = `${worst.name} leads the nation at ${worst.rate}% \u2014 nearly 1 in ${Math.round(100 / worst.rate)} residents.`;
    }
    const hint = document.querySelector('#chart-map + .dashboard-chart__hint');
    if (hint) hint.textContent = 'Hover for state details \u2014 click any state for county breakdown';

    // Update map aria-label for current metric
    const mapEl = document.getElementById('chart-map');
    if (mapEl) mapEl.setAttribute('aria-label', `Choropleth map of ${cfg.name} across US states`);

    chart.setOption({
      tooltip: {
        trigger: 'item',
        ...TOOLTIP_STYLE,
        formatter: stateTooltip
      },
      visualMap: {
        left: 'right',
        bottom: 20,
        min: cfg.min,
        max: cfg.max,
        text: ['High', 'Low'],
        calculable: true,
        inRange: { color: [PAL.low, PAL.mid, PAL.high] },
        textStyle: { color: COLORS.text }
      },
      series: [{
        name: cfg.name,
        type: 'map',
        map: 'USA',
        roam: false,
        projection: albersProjection,
        aspectScale: 1,
        zoom: 1.1,
        top: 10,
        left: 'center',
        emphasis: {
          label: { show: true, color: COLORS.text, fontSize: 12, fontWeight: 'bold' },
          itemStyle: { areaColor: COLORS.secondary, borderColor: '#fff', borderWidth: 1.5 }
        },
        itemStyle: {
          borderColor: COLORS.mapBorder,
          borderWidth: COLORS.mapBorderWidth,
          areaColor: 'rgba(255,255,255,0.08)'
        },
        label: { show: false },
        data: mapData,
        animationDurationUpdate: 500
      }]
    }, true); // true = not merge, replace
  }

  // Drill down into a state's counties
  async function drillDown(stateName, stateFips, highlightCounty) {
    // Clear stale county data so rapid state-A → state-B clicks don't flash
    // A's top-3 in B's deep-dive panel during the ~300ms fetch gap.
    lastCountyData = null;
    // Show loading
    chart.showLoading({ text: `Loading ${stateName} counties...`, color: COLORS.secondary, textColor: COLORS.text, maskColor: 'rgba(0,0,0,0.6)' });

    try {
      const res = await fetch(`/data/counties/${stateFips}.json`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const countyGeo = await res.json();

      // Register county map for this state
      const mapName = `state-${stateFips}`;
      echarts.registerMap(mapName, countyGeo);

      // Extract data from GeoJSON properties
      const countyData = countyGeo.features
        .filter(f => f.properties.rate != null)
        .map(f => ({
          name: f.properties.name,
          value: f.properties[currentMetric] ?? f.properties.rate,
          ...f.properties
        }));
      lastCountyData = countyData;

      // Fire async callback so deep-dive panel can re-render with fresh county data
      if (onDrillDownComplete) {
        const matchedState = US_STATES.find(([, sn]) => sn === stateName);
        if (matchedState) onDrillDownComplete(matchedState[0]);
      }

      // Compute dynamic min/max for this state's counties
      const vals = countyData.map(c => c.value).filter(v => typeof v === 'number');
      const min = Math.floor(Math.min(...vals));
      const max = Math.ceil(Math.max(...vals));

      currentView = stateFips;
      currentStateName = stateName;

      // Show back button
      const backBtn = document.getElementById('map-back-btn');
      if (backBtn) backBtn.classList.remove('hidden');
      const mapLabel = document.getElementById('map-state-label');
      if (mapLabel) mapLabel.textContent = stateName;
      const hint = document.querySelector('#chart-map + .dashboard-chart__hint');
      if (hint) hint.textContent = 'County rates are internal estimates derived from state poverty data (not a direct survey) \u2014 click Back for state-level survey data';

      chart.hideLoading();

      chart.setOption({
        tooltip: {
          trigger: 'item',
          ...TOOLTIP_STYLE,
          formatter: countyTooltip
        },
        visualMap: {
          min,
          max,
          text: ['High', 'Low'],
          calculable: true,
          inRange: { color: [PAL.low, PAL.mid, PAL.high] },
          textStyle: { color: COLORS.text }
        },
        series: [{
          name: MAP_METRICS[currentMetric].name,
          type: 'map',
          map: mapName,
          roam: false,
          projection: albersProjection,
          aspectScale: 1,
          zoom: 1,
          top: 10,
          left: 'center',
          emphasis: {
            label: { show: true, color: COLORS.text, fontSize: 11, fontWeight: 'bold' },
            itemStyle: { areaColor: COLORS.secondary, borderColor: '#fff', borderWidth: 1 }
          },
          itemStyle: {
            borderColor: COLORS.countyBorder,
            borderWidth: COLORS.countyBorderWidth,
            areaColor: 'rgba(255,255,255,0.05)'
          },
          label: { show: false },
          data: countyData,
          animationDurationUpdate: 500
        }]
      }, true);

      // Update insight callout with worst county
      const worst = countyData.reduce((a, b) => (b.value ?? 0) > (a.value ?? 0) ? b : a, countyData[0]);
      const stateObj = data.states.find(s => s.name === stateName);
      const mapInsight = document.getElementById('map-insight');
      if (mapInsight && worst && stateObj) {
        const cfg = MAP_METRICS[currentMetric];
        const stateVal = stateObj[currentMetric] ?? stateObj.rate;
        const diff = typeof worst.value === 'number' && typeof stateVal === 'number'
          ? (worst.value - stateVal).toFixed(currentMetric === 'mealCost' ? 2 : 1)
          : null;
        const sign = diff !== null && diff >= 0 ? '+' : '';
        const diffStr = diff !== null ? ` — ${sign}${diff}${currentMetric === 'mealCost' ? '' : cfg.suffix} vs. state avg` : '';
        mapInsight.textContent = `Within ${stateName}, ${worst.name} has the highest ${cfg.name.toLowerCase()} at ${fmtMetricVal(worst.value, currentMetric)}${diffStr} (modeled estimate).`;
      }

      // Highlight specific county if requested (from search)
      if (highlightCounty) {
        setTimeout(() => {
          const idx = countyData.findIndex(c => c.name === highlightCounty);
          if (idx >= 0) {
            chart.dispatchAction({ type: 'showTip', seriesIndex: 0, dataIndex: idx });
            chart.dispatchAction({ type: 'highlight', seriesIndex: 0, dataIndex: idx });
          }
        }, 600);
      }
    } catch (e) {
      handleDashboardError(chart, e, {
        context: 'food-insecurity-drilldown',
        insightSelector: '#map-insight',
        message: `Unable to load county data for ${stateName}. Please try another state.`,
      });
    }
  }

  // Initial render
  showNational();

  // Click handler: state click → drill down + fire KPI panel; county click → update insight
  chart.on('click', (params) => {
    if (currentView === 'national' && params.data) {
      const stateFips = params.data.fips;
      const stateName = params.data.name;
      if (stateFips) {
        drillDown(stateName, stateFips);
        const stateCode = US_STATES.find(([, n]) => n === stateName)?.[0];
        if (stateCode) onStateClick?.(stateCode);
      }
    } else if (currentView !== 'national' && params.data) {
      const d = /** @type {Record<string, *>} */ (params.data);
      const stateObj = data.states.find(s => s.name === currentStateName);
      const insight = document.getElementById('map-insight');
      if (insight && d.value != null && stateObj) {
        insight.textContent = buildCountyInsight(d.name, d.value, stateObj, currentMetric);
      }
    }
  });

  // Back button
  const backBtn = document.getElementById('map-back-btn');
  if (backBtn) {
    backBtn.addEventListener('click', () => {
      showNational();
      const mapEl = document.getElementById('chart-map');
      if (mapEl) mapEl.focus();
    });
  }

  // Metric selector
  const select = document.getElementById('map-metric');
  if (select) {
    select.addEventListener('change', () => {
      currentMetric = select.value;
      if (currentView === 'national') {
        showNational();
      } else {
        // Re-drill into same state with new metric
        const stateName = document.getElementById('map-state-label')?.textContent;
        drillDown(stateName || '', currentView);
      }
    });
  }

  return { chart, drillDown, showNational, getCountyData: () => lastCountyData };
}

// -- County Search --
function initCountySearch(mapController) {
  const input = document.getElementById('county-search');
  const resultsList = document.getElementById('county-search-results');
  if (!input || !resultsList) return;

  let countyIndex = null; // lazy-loaded
  let selectedIdx = -1;

  // Lazy-load county index on first focus
  input.addEventListener('focus', async () => {
    if (countyIndex) return;
    try {
      const res = await fetch('/data/county-index.json');
      if (res.ok) countyIndex = await res.json();
    } catch { /* ignore */ }
  });

  input.addEventListener('input', () => {
    // Audit 2026-04-12: journey-auditor typed "imperial county" and got zero
    // results. The stored name is "Imperial" (no suffix), so the raw query
    // failed the .includes() check. Strip a trailing " county" suffix so both
    // "imperial" and "imperial county" resolve to the same match set.
    const rawQuery = input.value.trim().toLowerCase();
    const query = rawQuery.replace(/\s+county$/i, '').trim();
    selectedIdx = -1;

    if (!countyIndex || query.length < 2) {
      resultsList.setAttribute('data-visible', 'false');
      input.setAttribute('aria-expanded', 'false');
      resultsList.innerHTML = '';
      return;
    }

    // Search: match county name, limit to 8 results
    const matches = [];
    for (let i = 0; i < countyIndex.length && matches.length < 8; i++) {
      const [name, sFips, sName] = countyIndex[i];
      if (name.toLowerCase().includes(query)) {
        matches.push({ name, stateFips: sFips, stateName: sName });
      }
    }

    if (matches.length === 0) {
      resultsList.innerHTML = '<li class="dashboard-list-item--muted">No counties found</li>';
      resultsList.setAttribute('data-visible', 'true');
      input.setAttribute('aria-expanded', 'true');
      return;
    }

    resultsList.innerHTML = matches.map((m, i) =>
      `<li role="option" data-fips="${m.stateFips}" data-county="${m.name}" data-state="${m.stateName}" id="search-opt-${i}">${m.name}<span class="search-state">${m.stateName}</span></li>`
    ).join('');
    resultsList.setAttribute('data-visible', 'true');
    input.setAttribute('aria-expanded', 'true');

    // Click handler for results
    resultsList.querySelectorAll('li[role="option"]').forEach(li => {
      li.addEventListener('click', () => {
        const sFips = li.dataset.fips;
        const sName = li.dataset.state;
        const countyName = li.dataset.county;
        input.value = `${countyName}, ${sName}`;
        resultsList.setAttribute('data-visible', 'false');
        input.setAttribute('aria-expanded', 'false');
        if (mapController) mapController.drillDown(sName, sFips, countyName);
      });
    });
  });

  // Keyboard navigation
  input.addEventListener('keydown', (e) => {
    const items = resultsList.querySelectorAll('li[role="option"]');
    if (!items.length) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      selectedIdx = Math.min(selectedIdx + 1, items.length - 1);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      selectedIdx = Math.max(selectedIdx - 1, 0);
    } else if (e.key === 'Enter' && selectedIdx >= 0) {
      e.preventDefault();
      items[selectedIdx].click();
      return;
    } else if (e.key === 'Escape') {
      resultsList.setAttribute('data-visible', 'false');
      input.setAttribute('aria-expanded', 'false');
      input.removeAttribute('aria-activedescendant');
      return;
    } else {
      return;
    }

    items.forEach((li, i) => li.setAttribute('aria-selected', i === selectedIdx ? 'true' : 'false'));
    if (items[selectedIdx]) {
      input.setAttribute('aria-activedescendant', items[selectedIdx].id);
    }
    items[selectedIdx]?.scrollIntoView({ block: 'nearest' });
  });

  // Close on outside click
  document.addEventListener('click', (e) => {
    if (!e.target.closest('.dashboard-search__wrapper')) {
      resultsList.setAttribute('data-visible', 'false');
      input.setAttribute('aria-expanded', 'false');
      input.removeAttribute('aria-activedescendant');
    }
  });
}

// -- Trend Line Chart --
function renderTrend(data) {
  const chart = createChart('chart-trend');
  if (!chart) return;

  const years = data.trend.map(t => t.year);
  const rates = data.trend.map(t => t.rate);
  const childRates = data.trend.map(t => t.childRate);

  // Find the boundary between actual and projected data
  const firstProjectedIdx = data.trend.findIndex(t => t.projected);
  const hasProjections = firstProjectedIdx > -1;

  // Split data into actual and projected segments for dashed line rendering
  // Actual data: fill projected years with null; Projected data: fill actual years with null
  // Overlap by 1 point at the boundary so the lines connect
  const actualRates = rates.map((r, i) => (hasProjections && i > firstProjectedIdx) ? null : r);
  const actualChildRates = childRates.map((r, i) => (hasProjections && i > firstProjectedIdx) ? null : r);
  const projectedRates = rates.map((r, i) => (hasProjections && i >= firstProjectedIdx) ? r : null);
  const projectedChildRates = childRates.map((r, i) => (hasProjections && i >= firstProjectedIdx) ? r : null);

  // Key annotation markers
  const markLineData = [];

  // 2021 historic low
  const lowIdx = data.trend.findIndex(t => t.year === 2021);
  if (lowIdx > -1) markLineData.push({
    xAxis: '2021',
    lineStyle: { color: '#22c55e', type: 'dotted', width: 1 },
    label: { formatter: 'Historic Low', color: '#22c55e', fontSize: 9, position: 'insideEndTop' }
  });

  // 2022 post-pandemic surge
  const surgeIdx = data.trend.findIndex(t => t.year === 2022);
  if (surgeIdx > -1) markLineData.push({
    xAxis: '2022',
    lineStyle: { color: COLORS.accent, type: 'dotted', width: 1 },
    label: { formatter: 'Post-Pandemic\nSurge', color: COLORS.accent, fontSize: 9, position: 'insideEndTop' }
  });

  // Projection boundary
  if (hasProjections) markLineData.push({
    xAxis: data.trend[firstProjectedIdx].year.toString(),
    lineStyle: { color: 'rgba(255,255,255,0.5)', type: 'dashed', width: 1.5 },
    label: { formatter: 'USDA Report\nTerminated', color: COLORS.textMuted, fontSize: 10, position: 'insideEndTop' }
  });

  chart.setOption({
    tooltip: {
      trigger: 'axis',
      ...TOOLTIP_STYLE,
      formatter: params => {
        const idx = params[0].dataIndex;
        const isProjected = hasProjections && idx >= firstProjectedIdx;
        const sourceLabel = isProjected ? 'Projected (Columbia University)' : 'Official USDA Data';
        let tip = `<strong>${params[0].axisValue}</strong> <span class="csp-text-muted-sm">${sourceLabel}</span><br/>`;
        // Deduplicate: only show one entry per series name (actual and projected overlap)
        const seen = new Set();
        params.forEach(p => {
          const baseName = p.seriesName.replace(' (Projected)', '');
          if (seen.has(baseName) || p.value == null) return;
          seen.add(baseName);
          const arr = baseName === 'Overall Rate' ? rates : childRates;
          const yoy = idx > 0 ? (p.value - arr[idx - 1]).toFixed(1) : null;
          const yoyStr = yoy !== null ? ` (<span class="${yoy >= 0 ? 'csp-text-accent' : 'text-data-success'}">${yoy >= 0 ? '+' : ''}${yoy}pp</span>)` : '';
          tip += `${p.marker} ${baseName}: <strong>${p.value}%</strong>${yoyStr}<br/>`;
        });
        return tip;
      }
    },
    legend: {
      data: hasProjections
        ? ['Overall Rate', 'Child Rate', 'Overall Rate (Projected)', 'Child Rate (Projected)']
        : ['Overall Rate', 'Child Rate'],
      textStyle: { color: COLORS.text },
      top: 5
    },
    grid: { left: 50, right: 20, top: 40, bottom: 30 },
    xAxis: {
      type: 'category',
      data: years,
      axisLabel: { color: COLORS.textMuted },
      axisLine: { lineStyle: { color: COLORS.gridLine } }
    },
    yAxis: {
      type: 'value',
      name: 'Rate (%)',
      nameLocation: 'middle',
      nameGap: 35,
      nameTextStyle: { color: COLORS.textMuted },
      axisLabel: { color: COLORS.textMuted, formatter: '{value}%' },
      splitLine: { lineStyle: { color: COLORS.gridLine } }
    },
    series: [
      {
        name: 'Overall Rate',
        type: 'line',
        data: actualRates,
        smooth: true,
        symbol: 'circle',
        symbolSize: 8,
        lineStyle: { width: 3, color: COLORS.primary },
        itemStyle: { color: COLORS.primary },
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: 'rgba(1,118,211,0.3)' },
            { offset: 1, color: 'rgba(1,118,211,0.02)' }
          ])
        },
        markLine: markLineData.length ? { data: markLineData, symbol: 'none', silent: true } : undefined,
        connectNulls: false,
        animationDuration: 2000
      },
      {
        name: 'Child Rate',
        type: 'line',
        data: actualChildRates,
        smooth: true,
        symbol: 'diamond',
        symbolSize: 8,
        lineStyle: { width: 3, color: COLORS.accent },
        itemStyle: { color: COLORS.accent },
        connectNulls: false,
        animationDuration: 2000,
        animationDelay: 300
      },
      // Projected series (dashed lines)
      ...(hasProjections ? [
        {
          name: 'Overall Rate (Projected)',
          type: 'line',
          data: projectedRates,
          smooth: true,
          symbol: 'circle',
          symbolSize: 6,
          lineStyle: { width: 2.5, color: COLORS.primary, type: 'dashed' },
          itemStyle: { color: COLORS.primary, opacity: 0.7 },
          areaStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: 'rgba(1,118,211,0.15)' },
              { offset: 1, color: 'rgba(1,118,211,0.01)' }
            ])
          },
          connectNulls: false,
          animationDuration: 1500,
          animationDelay: 500
        },
        {
          name: 'Child Rate (Projected)',
          type: 'line',
          data: projectedChildRates,
          smooth: true,
          symbol: 'diamond',
          symbolSize: 6,
          lineStyle: { width: 2.5, color: COLORS.accent, type: 'dashed' },
          itemStyle: { color: COLORS.accent, opacity: 0.7 },
          connectNulls: false,
          animationDuration: 1500,
          animationDelay: 800
        }
      ] : [])
    ]
  });
}

// -- Radar: Most Affected vs Least Affected States --
function renderRadar(data) {
  const chart = createChart('chart-radar');
  if (!chart) return;

  const sorted = [...data.states].sort((a, b) => b.rate - a.rate);
  const top5 = sorted.slice(0, 5);
  const bottom5 = sorted.slice(-5).reverse();

  const maxRate = 25, maxChild = 30, maxPoverty = 25, maxMeal = 5.5;
  const maxSnap = Math.max(...data.states.map(s => s.snapParticipation));
  function normalize(states) {
    return states.map(s => [
      (s.rate / maxRate * 100).toFixed(0),
      (s.childRate / maxChild * 100).toFixed(0),
      (s.povertyRate / maxPoverty * 100).toFixed(0),
      (s.mealCost / maxMeal * 100).toFixed(0),
      (s.snapParticipation / maxSnap * 100).toFixed(0)
    ].map(Number));
  }
  const top5Avg = normalize(top5).reduce((acc, v) => acc.map((a, i) => a + v[i]), [0,0,0,0,0]).map(v => Math.round(v / 5));
  const bot5Avg = normalize(bottom5).reduce((acc, v) => acc.map((a, i) => a + v[i]), [0,0,0,0,0]).map(v => Math.round(v / 5));

  const indicatorNames = ['Food Insecurity', 'Child Rate', 'Poverty', 'Meal Cost', 'SNAP Usage'];
  const groupMeta = [
    { title: 'Most Affected States', subtitle: top5.map(s => s.name).join(' · '), swatch: 'fnf-tooltip-swatch--high', barFill: '#ef4444' },
    { title: 'Least Affected States', subtitle: bottom5.map(s => s.name).join(' · '), swatch: 'fnf-tooltip-swatch--low', barFill: '#60a5fa' }
  ];
  chart.setOption({
    tooltip: {
      ...TOOLTIP_STYLE,
      extraCssText: 'max-width: 340px;',
      formatter: (params) => {
        const values = Array.isArray(params.value) ? params.value : [];
        const meta = groupMeta[params.dataIndex] || groupMeta[0];
        const rows = indicatorNames
          .map((label, i) => {
            const v = Math.max(0, Math.min(100, Number(values[i]) || 0));
            const bar = `<svg class="fnf-tooltip-bar" width="100" height="6" viewBox="0 0 100 6">
              <rect width="100" height="6" rx="3" fill="rgba(255,255,255,0.08)"/>
              <rect width="${v}" height="6" rx="3" fill="${meta.barFill}"/>
            </svg>`;
            return `<div class="fnf-tooltip-row"><span class="fnf-tooltip-row__label">${label}</span>${bar}<span class="fnf-tooltip-row__value">${values[i] ?? '—'}</span></div>`;
          })
          .join('');
        return `<div class="fnf-tooltip-header"><span class="fnf-tooltip-swatch ${meta.swatch}"></span><strong class="fnf-tooltip-label">${meta.title}</strong></div><div class="fnf-tooltip-subtitle">${meta.subtitle}</div><div class="fnf-tooltip-divider"></div>${rows}<div class="fnf-tooltip-footnote">Normalized 0–100 (higher = worse)</div>`;
      }
    },
    legend: {
      data: [`Most Affected (${top5.map(s => s.name).join(', ')})`, `Least Affected (${bottom5.map(s => s.name).join(', ')})`],
      textStyle: { color: COLORS.text, fontSize: 10 }, bottom: 0
    },
    radar: {
      indicator: indicatorNames.map(name => ({ name, max: 100 })),
      shape: 'polygon', splitNumber: 4,
      axisName: { color: COLORS.text, fontSize: window.innerWidth < 640 ? 9 : 11 },
      radius: window.innerWidth < 640 ? '55%' : '65%',
      splitLine: { lineStyle: { color: COLORS.gridLine } },
      splitArea: { areaStyle: { color: ['rgba(0,212,255,0.02)', 'rgba(0,212,255,0.05)'] } },
      axisLine: { lineStyle: { color: COLORS.gridLine } }
    },
    series: [{
      type: 'radar',
      data: [
        { value: top5Avg, name: `Most Affected (${top5.map(s => s.name).join(', ')})`, areaStyle: { color: 'rgba(239,68,68,0.25)' }, lineStyle: { color: PAL.high, width: 2 }, itemStyle: { color: PAL.high } },
        { value: bot5Avg, name: `Least Affected (${bottom5.map(s => s.name).join(', ')})`, areaStyle: { color: 'rgba(96,165,250,0.25)' }, lineStyle: { color: PAL.low, width: 2 }, itemStyle: { color: PAL.low } }
      ]
    }]
  });
}

// -- Scatter: Poverty vs Food Insecurity --
// Tracks current scatter state so toggles and live data upgrades coordinate
let _scatterMode = 'overall'; // 'overall' or 'child'
let _scatterSource = 'USDA/ACS'; // updated when SAIPE or ACS overlay loads

function renderScatter(data, mode, source) {
  if (mode) _scatterMode = mode;
  if (source) _scatterSource = source;

  // getOrCreateChart: re-called from _trySAIPE()/_tryACSFallback() when live Census data arrives
  const chart = getOrCreateChart('chart-scatter');
  if (!chart) return;

  const isChild = _scatterMode === 'child';

  const points = data.states
    .filter(s => {
      const xVal = isChild ? s.childPovertyRate : s.povertyRate;
      const yVal = isChild ? s.childRate : s.rate;
      return typeof xVal === 'number' && typeof yVal === 'number';
    })
    .map(s => ({
      value: [isChild ? s.childPovertyRate : s.povertyRate, isChild ? s.childRate : s.rate],
      name: s.name,
      persons: s.persons
    }));

  if (isChild && points.length === 0) {
    chart.setOption({
      title: { text: 'Child poverty data requires a live Census connection', left: 'center', top: 'center', textStyle: { color: 'rgba(255,255,255,0.5)', fontSize: 14, fontWeight: 'normal' } },
      xAxis: { show: false }, yAxis: { show: false }, series: []
    });
    return;
  }

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

  const xLabel = isChild ? 'Child Poverty Rate (%)' : 'Poverty Rate (%)';
  const yLabel = isChild ? 'Child Food Insecurity (%)' : 'Food Insecurity (%)';
  const srcTag = _scatterSource;

  const series = Object.entries(REGION_COLORS).map(([region, color], i) => ({
    name: region, type: 'scatter',
    data: byRegion[region],
    symbolSize: (_, params) => Math.max(8, Math.sqrt(params.data.persons / 50000)),
    itemStyle: { color, opacity: 0.85 },
    emphasis: { itemStyle: { opacity: 1 } },
    animationDuration: 2000,
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
        const pLabel = isChild ? 'Child Poverty' : 'Poverty';
        const fiLabel = isChild ? 'Child Food Insecurity' : 'Food Insecurity';
        return `<strong>${d.name}</strong> <span class="${REGION_CLASS[region] || ''}">(${region})</span><br/>${pLabel}: ${d.value[0]}%<br/>${fiLabel}: ${d.value[1]}%<br/><span class="csp-text-muted-sm">Source: ${srcTag}</span>`;
      }
    },
    grid: { left: 55, right: 20, top: 35, bottom: 45 },
    xAxis: {
      name: xLabel,
      nameLocation: 'center',
      nameGap: 30,
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

  // Update insight text with current correlation
  const insightEl = document.getElementById('scatter-insight');
  if (insightEl) {
    const strength = Math.abs(reg.r) >= 0.7 ? 'Strong' : Math.abs(reg.r) >= 0.4 ? 'Moderate' : 'Weak';
    // P1-04: derive the qualitative label from the live r-value rather than making a
    // hard-ranked superlative claim unconditionally. Strong wording only when r is strong.
    const isStrong = Math.abs(reg.r) >= 0.7;
    const subject = isChild ? 'child poverty' : 'poverty';
    const object = isChild ? 'child food insecurity' : 'food insecurity';
    let label;
    if (isStrong) {
      label = `${subject} is a leading predictor of ${object}`;
    } else if (Math.abs(reg.r) >= 0.4) {
      label = `${subject} is a meaningful contributor to ${object}, alongside other drivers`;
    } else {
      label = `${subject} shows only a weak statistical link to ${object} in the current data`;
    }
    insightEl.textContent = `${strength} positive correlation (r \u2248 ${reg.r.toFixed(2)}) \u2014 ${label}. (${srcTag})`;
  }
}

// Initialize scatter toggle buttons (Overall vs Child)
function initScatterToggle() {
  const container = document.getElementById('scatter-toggle-buttons');
  if (!container) return;

  container.innerHTML = [
    '<button class="dashboard-metric-btn dashboard-metric-btn--active" data-scatter-mode="overall" aria-pressed="true">Overall Poverty</button>',
    '<button class="dashboard-metric-btn" data-scatter-mode="child" aria-pressed="false">Child Poverty</button>'
  ].join('');

  container.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-scatter-mode]');
    if (!btn) return;
    container.querySelectorAll('.dashboard-metric-btn').forEach(b => {
      b.classList.remove('dashboard-metric-btn--active');
      b.setAttribute('aria-pressed', 'false');
    });
    btn.classList.add('dashboard-metric-btn--active');
    btn.setAttribute('aria-pressed', 'true');

    const currentData = _stateData;
    if (currentData) renderScatter(currentData, btn.dataset.scatterMode);
  });
}

// -- Poverty-Insecurity Divergence (horizontal diverging bar) --
function renderDivergence(data) {
  const chart = createChart('chart-divergence');
  if (!chart) return;

  const divergences = data.states
    .map(s => ({ name: s.name, divergence: +(s.rate - s.povertyRate).toFixed(1), rate: s.rate, povertyRate: s.povertyRate }))
    .sort((a, b) => a.divergence - b.divergence);

  chart.setOption({
    title: {
      subtext: '\u25a0 Red: insecurity > poverty   \u25a0 Blue: poverty > insecurity',
      subtextStyle: { color: 'rgba(255,255,255,0.5)', fontSize: 11 },
      top: 0, left: 'center'
    },
    tooltip: {
      ...TOOLTIP_STYLE,
      formatter: params => {
        const s = divergences.find(d => d.name === params.name);
        return `<strong>${params.name}</strong><br/>Insecurity Rate: ${s?.rate}%<br/>Poverty Rate: ${s?.povertyRate}%<br/>Divergence: ${s?.divergence >= 0 ? '+' : ''}${s?.divergence} pp`;
      }
    },
    grid: { left: 110, right: 40, top: 25, bottom: 30 },
    xAxis: {
      type: 'value', name: 'Divergence (pp)', nameLocation: 'center', nameGap: 22,
      nameTextStyle: { color: COLORS.textMuted },
      axisLabel: { color: COLORS.textMuted, formatter: v => v >= 0 ? `+${v}` : String(v) },
      splitLine: { lineStyle: { color: COLORS.gridLine } }
    },
    yAxis: {
      type: 'category', data: divergences.map(s => s.name),
      axisLabel: { color: COLORS.text, fontSize: 9 },
      axisLine: { lineStyle: { color: COLORS.gridLine } }
    },
    series: [{
      type: 'bar',
      data: divergences.map(s => ({
        value: s.divergence,
        itemStyle: { color: s.divergence >= 0 ? '#ef4444' : '#3b82f6' }
      })),
      barMaxWidth: 10,
      animationDuration: 2000
    }]
  });

  const insightEl = document.getElementById('divergence-insight');
  if (insightEl) {
    const worst = divergences[divergences.length - 1];
    const best = divergences[0];
    insightEl.textContent = `${worst.name} (+${worst.divergence} pp) has the highest insecurity above its poverty rate, suggesting additional drivers beyond income. ${best.name} (${best.divergence} pp) outperforms its poverty prediction most, likely reflecting stronger safety net participation.`;
  }
}

// -- Meal Cost by State (horizontal bar) --
function renderMealCost(data) {
  const chart = createChart('chart-meal-cost');
  if (!chart) return;

  const sorted = [...data.states].sort((a, b) => a.mealCost - b.mealCost).slice(-25);
  const names = sorted.map(s => s.name);
  const costs = sorted.map(s => s.mealCost);
  const natAvg = data.national.averageMealCost;

  chart.setOption({
    tooltip: {
      ...TOOLTIP_STYLE,
      trigger: 'axis',
      formatter: params => {
        const p = params[0];
        const region = getRegion(p.name);
        const diff = ((p.value - natAvg) / natAvg * 100).toFixed(0);
        return `<strong>${p.name}</strong> <span class="${REGION_CLASS[region] || ''}">(${region})</span><br/>Meal Cost: <strong>$${p.value}</strong><br/>${p.value > natAvg ? '+' : ''}${diff}% vs national avg ($${natAvg})`;
      }
    },
    grid: { left: 110, right: 30, top: 10, bottom: 30 },
    xAxis: {
      type: 'value',
      name: 'Average Meal Cost ($)',
      nameLocation: 'center', nameGap: 22,
      nameTextStyle: { color: COLORS.textMuted },
      axisLabel: { color: COLORS.textMuted, formatter: '${value}' },
      splitLine: { lineStyle: { color: COLORS.gridLine } }
    },
    yAxis: {
      type: 'category',
      data: names,
      axisLabel: { color: COLORS.text, fontSize: 10 },
      axisLine: { lineStyle: { color: COLORS.gridLine } }
    },
    series: [{
      type: 'bar',
      data: costs.map((v, i) => ({
        value: v,
        itemStyle: { color: REGION_COLORS[getRegion(names[i])] }
      })),
      barWidth: '65%',
      itemStyle: { borderRadius: [0, 3, 3, 0] },
      markLine: {
        symbol: 'none', silent: true,
        data: [{ xAxis: natAvg, lineStyle: { color: 'rgba(255,255,255,0.6)', type: 'dashed', width: 1.5 }, label: { formatter: `Nat'l Avg: $${natAvg}`, color: COLORS.textMuted, fontSize: 10, position: 'end' } }]
      },
      animationDuration: 1500
    }]
  });
}

// -- Populate accessible data table --
function populateAccessibleTable(data) {
  const tbody = document.getElementById('accessible-data-table');
  if (!tbody) return;
  data.states.forEach(s => {
    const tr = document.createElement('tr');
    tr.innerHTML = `<td>${s.name}</td><td>${s.rate}%</td><td>${s.childRate}%</td><td>${fmtNum(s.persons)}</td><td>${fmtNum(s.mealGap)}</td>`;
    tbody.appendChild(tr);
  });
}

// -- SNAP Participation vs Food Insecurity --
function renderSnap(data) {
  const chart = createChart('chart-snap');
  if (!chart) return;

  const FI_YEAR = '2024';
  const SNAP_YEAR = 'FA 2023 est.';
  const fiLabel = `Food Insecurity Rate (${FI_YEAR})`;
  const snapLabel = `SNAP Coverage (${SNAP_YEAR})`;

  // Top 15 states by food insecurity, showing SNAP participation alongside
  const sorted = [...data.states].sort((a, b) => b.rate - a.rate).slice(0, 15);
  const names = sorted.map(s => s.name);
  const rates = sorted.map(s => s.rate);
  const snapCoverageRatio = sorted.map(s => s.persons > 0 ? Math.round((s.snapParticipation / s.persons) * 100) : 0);

  chart.setOption({
    tooltip: {
      trigger: 'axis',
      ...TOOLTIP_STYLE,
      formatter: params => {
        let tip = `<strong>${params[0].name}</strong><br/>`;
        params.forEach(p => {
          if (p.value != null) tip += `${p.marker} ${p.seriesName}: <strong>${p.value}%</strong><br/>`;
        });
        return tip;
      }
    },
    legend: {
      data: [fiLabel, snapLabel],
      textStyle: { color: COLORS.text },
      top: 5
    },
    grid: { left: 130, right: 30, top: 40, bottom: 30 },
    xAxis: {
      type: 'value',
      axisLabel: { color: COLORS.textMuted },
      splitLine: { lineStyle: { color: COLORS.gridLine } }
    },
    yAxis: {
      type: 'category',
      data: names.reverse(),
      axisLabel: { color: COLORS.text, fontSize: 11 },
      axisLine: { lineStyle: { color: COLORS.gridLine } }
    },
    series: [
      {
        name: fiLabel,
        type: 'bar',
        data: rates.reverse(),
        barWidth: '35%',
        itemStyle: {
          borderRadius: [0, 3, 3, 0],
          color: new echarts.graphic.LinearGradient(0, 0, 1, 0, [
            { offset: 0, color: accentRgba(0.6) },
            { offset: 1, color: COLORS.accent }
          ])
        },
        animationDuration: 1500
      },
      {
        name: snapLabel,
        type: 'bar',
        data: snapCoverageRatio.reverse(),
        barWidth: '35%',
        itemStyle: {
          borderRadius: [0, 3, 3, 0],
          color: new echarts.graphic.LinearGradient(0, 0, 1, 0, [
            { offset: 0, color: 'rgba(0,212,255,0.5)' },
            { offset: 1, color: COLORS.secondary }
          ])
        },
        animationDuration: 1500,
        animationDelay: 200
      }
    ]
  });
}

// -- Food Price Trend (BLS CPI data) --
function renderFoodPrices(blsData) {
  // getOrCreateChart: re-called from fetchBLSData() on both static-path and live-path renders
  const chart = getOrCreateChart('chart-food-prices');
  if (!chart || !blsData || !blsData.series) return;

  // Find each series
  const foodHome = blsData.series.find(s => s.name === 'Food at Home');
  const foodAway = blsData.series.find(s => s.name === 'Food Away from Home');
  const allItems = blsData.series.find(s => s.name === 'All Items');

  if (!foodHome) return;

  chart.setOption({
    tooltip: {
      trigger: 'axis',
      ...TOOLTIP_STYLE,
      formatter: params => {
        let tip = `<strong>${params[0].axisValue}</strong><br/>`;
        params.forEach(p => {
          tip += `${p.marker} ${p.seriesName}: <strong>${p.value}</strong><br/>`;
        });
        return tip;
      }
    },
    legend: {
      data: ['Food at Home', ...(foodAway ? ['Food Away from Home'] : []), ...(allItems ? ['All Items'] : [])],
      textStyle: { color: COLORS.text },
      top: 5
    },
    grid: { left: 50, right: 20, top: 45, bottom: 60 },
    dataZoom: [{
      type: 'inside',
      start: 50,
      end: 100
    }, {
      type: 'slider',
      start: 50,
      end: 100,
      height: 20,
      bottom: 10,
      textStyle: { color: COLORS.textMuted },
      borderColor: COLORS.gridLine,
      fillerColor: 'rgba(0,212,255,0.1)'
    }],
    xAxis: {
      type: 'category',
      data: foodHome.data.filter(d => d.value !== null).map(d => d.date),
      axisLabel: { color: COLORS.textMuted, rotate: 45, fontSize: 10 },
      axisLine: { lineStyle: { color: COLORS.gridLine } }
    },
    yAxis: {
      type: 'value',
      name: 'CPI Index',
      nameTextStyle: { color: COLORS.textMuted },
      axisLabel: { color: COLORS.textMuted },
      splitLine: { lineStyle: { color: COLORS.gridLine } }
    },
    series: [
      {
        name: 'Food at Home',
        type: 'line',
        data: foodHome.data.filter(d => d.value !== null).map(d => d.value),
        smooth: true,
        lineStyle: { width: 2.5, color: COLORS.accent },
        itemStyle: { color: COLORS.accent },
        symbol: 'none',
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: accentRgba(0.2) },
            { offset: 1, color: accentRgba(0.01) }
          ])
        }
      },
      ...(foodAway ? [{
        name: 'Food Away from Home',
        type: 'line',
        data: foodAway.data.filter(d => d.value !== null).map(d => d.value),
        smooth: true,
        lineStyle: { width: 2, color: COLORS.secondary },
        itemStyle: { color: COLORS.secondary },
        symbol: 'none'
      }] : []),
      ...(allItems ? [{
        name: 'All Items',
        type: 'line',
        data: allItems.data.filter(d => d.value !== null).map(d => d.value),
        smooth: true,
        lineStyle: { width: 1.5, color: 'rgba(255,255,255,0.3)', type: 'dashed' },
        itemStyle: { color: 'rgba(255,255,255,0.3)' },
        symbol: 'none'
      }] : [])
    ]
  }, true);
}

// -- SDOH Scatter (live Census ACS data, non-blocking) --
const SDOH_METRICS = [
  { key: 'uninsuredPct', label: 'Uninsured Rate', axis: 'Uninsured (%)', source: 'census', insight: 'Lack of health insurance is associated with higher food insecurity — medical costs may crowd out food budgets.' },
  { key: 'collegePct', label: 'College Education', axis: 'Bachelor\'s+ (%)', source: 'census', insight: 'Higher education correlates with lower food insecurity — the association likely reflects differences in income and employment stability.', invert: true },
  { key: 'unemploymentPct', label: 'Unemployment', axis: 'Unemployment Rate (%)', source: 'census', insight: 'Unemployment is strongly associated with food insecurity — states with higher joblessness consistently show elevated food insecurity rates in the scatter above.' },
  { key: 'noVehiclePct', label: 'No Vehicle', axis: 'Workers Without Vehicle (%)', source: 'census', insight: 'Transportation barriers are linked to reduced access to affordable food — workers without vehicles face both job and food access challenges.' },
  { key: 'housingBurdenPct', label: 'Housing Burden', axis: 'Severe Housing Cost Burden (%)', source: 'census', insight: 'When rent exceeds 50% of income, food budgets are often the first to shrink — housing cost is closely linked to hunger.' },
  { key: 'obesity', label: 'Adult Obesity (CDC)', axis: 'Obesity Prevalence (%)', source: 'places', insight: 'States with higher food insecurity tend to have higher obesity rates — this may reflect limited access to nutritious options when budgets are tight.' },
  { key: 'diabetes', label: 'Diabetes (CDC)', axis: 'Diabetes Prevalence (%)', source: 'places', insight: 'Food insecurity and diabetes show a reinforcing pattern — poor diet is linked to diabetes risk, and diabetes management costs further strain food budgets.' },
  { key: 'depression', label: 'Depression (CDC)', axis: 'Depression Prevalence (%)', source: 'places', insight: 'Food insecurity is associated with poorer mental health outcomes — states with higher food insecurity show higher depression prevalence.' },
  { key: 'housinsec', label: 'Housing Insecurity (CDC)', axis: 'Housing Insecurity (%)', source: 'places', insight: 'Housing and food insecurity are closely linked — when housing costs rise, food budgets are often the first to shrink.' }
];

let sdohData = null;
let sdohChart = null;

function renderSDOH(sdoh, fiData, metricKey) {
  const metric = SDOH_METRICS.find(m => m.key === metricKey) || SDOH_METRICS[0];
  const section = document.getElementById('section-sdoh');
  if (section) section.classList.remove('hidden');

  if (!sdohChart) {
    sdohChart = createChart('chart-sdoh');
  }
  if (!sdohChart) return;

  // Build lookup from food insecurity state data
  const fiByName = {};
  fiData.states.forEach(s => { fiByName[s.name] = s; });

  // Merge SDOH + food insecurity
  const points = sdoh.states
    .map(s => {
      const fi = fiByName[s.name];
      if (!fi || typeof s[metricKey] !== 'number') return null;
      return {
        value: [s[metricKey], fi.rate],
        name: s.name,
        persons: fi.persons
      };
    })
    .filter(Boolean);

  if (!points.length) return;

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
    symbolSize: (_, params) => Math.max(8, Math.sqrt(params.data.persons / 50000)),
    itemStyle: { color, opacity: 0.85 },
    emphasis: { itemStyle: { opacity: 1 } },
    animationDuration: 1200,
    ...(i === 0 ? { markLine: rLine } : {})
  }));

  sdohChart.setOption({
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
        return `<strong>${d.name}</strong> <span class="${REGION_CLASS[region] || ''}">(${region})</span><br/>${metric.axis}: ${d.value[0]}%<br/>Food Insecurity: ${d.value[1]}%`;
      }
    },
    grid: { left: 55, right: 20, top: 35, bottom: 45 },
    xAxis: {
      name: metric.axis,
      nameLocation: 'center',
      nameGap: 30,
      nameTextStyle: { color: COLORS.textMuted },
      axisLabel: { color: COLORS.textMuted, formatter: '{value}%' },
      splitLine: { lineStyle: { color: COLORS.gridLine } },
      inverse: !!metric.invert
    },
    yAxis: {
      name: 'Food Insecurity (%)',
      nameTextStyle: { color: COLORS.textMuted },
      axisLabel: { color: COLORS.textMuted, formatter: '{value}%' },
      splitLine: { lineStyle: { color: COLORS.gridLine } }
    },
    series
  }, true);

  // Update insight text
  const insightEl = document.getElementById('sdoh-insight');
  const strength = Math.abs(reg.r) >= 0.7 ? 'Strong' : Math.abs(reg.r) >= 0.4 ? 'Moderate' : 'Weak';
  const direction = (metric.invert ? -reg.r : reg.r) > 0 ? 'positive' : 'negative';
  if (insightEl) insightEl.textContent = `${strength} ${direction} correlation (r = ${reg.r.toFixed(2)}). ${metric.insight}`;
}

let sdohButtonHandler = null;

function initSDOHButtons(sdoh, fiData) {
  const container = document.getElementById('sdoh-metric-buttons');
  if (!container) return;

  // Preserve currently active metric when re-rendering (e.g. after PLACES data loads)
  const activeKey = container.querySelector('.dashboard-metric-btn--active')?.dataset.sdohMetric;

  const censusMetrics = SDOH_METRICS.filter(m => m.source === 'census');
  const placesMetrics = SDOH_METRICS.filter(m => m.source === 'places');
  const placesAvailable = sdoh.states.some(s => typeof s.obesity === 'number');

  let html = censusMetrics.map((m, i) => {
    const isActive = activeKey ? m.key === activeKey : i === 0;
    return `<button class="dashboard-metric-btn${isActive ? ' dashboard-metric-btn--active' : ''}" data-sdoh-metric="${m.key}" aria-pressed="${isActive}">${m.label}</button>`;
  }).join('');

  if (placesAvailable && placesMetrics.length) {
    html += '<div class="dashboard-metric-separator" aria-hidden="true">Health Outcomes</div>';
    html += placesMetrics.map(m => {
      const isActive = m.key === activeKey;
      return `<button class="dashboard-metric-btn${isActive ? ' dashboard-metric-btn--active' : ''}" data-sdoh-metric="${m.key}" aria-pressed="${isActive}">${m.label}</button>`;
    }).join('');
  }

  container.innerHTML = html;

  // Remove previous listener to avoid stacking on re-init
  if (sdohButtonHandler) container.removeEventListener('click', sdohButtonHandler);
  sdohButtonHandler = (e) => {
    const btn = e.target.closest('[data-sdoh-metric]');
    if (!btn) return;
    container.querySelectorAll('.dashboard-metric-btn').forEach(b => {
      b.classList.remove('dashboard-metric-btn--active');
      b.setAttribute('aria-pressed', 'false');
    });
    btn.classList.add('dashboard-metric-btn--active');
    btn.setAttribute('aria-pressed', 'true');
    renderSDOH(sdoh, fiData, btn.dataset.sdohMetric);
  };
  container.addEventListener('click', sdohButtonHandler);
}

async function fetchSDOHData() {
  try {
    const res = await fetch('/api/dashboard-sdoh.php');
    if (!res.ok) return;
    const sdoh = await res.json();
    if (sdoh.error || !sdoh.states) return;

    sdohData = sdoh;
    const fiData = _stateData;
    if (!fiData || !fiData.states) return;

    renderSDOH(sdoh, fiData, SDOH_METRICS[0].key);
    initSDOHButtons(sdoh, fiData);
    updateFreshness('sdoh', sdoh);

    // Income distribution ThemeRiver (uses same SDOH data)
    if (sdoh.states.some(s => s.income)) {
      renderIncomeRiver(sdoh, fiData);
    }

    // CDC PLACES health indicators (non-blocking enhancement to SDOH scatter)
    fetchCDCPlacesData();
  } catch {
    // SDOH is optional — show fallback if chart container is still empty
    const sdohChart = document.getElementById('chart-sdoh');
    if (sdohChart && !sdohChart.querySelector('canvas')) {
      sdohChart.innerHTML = '<p class="chart-unavailable">Social determinants data unavailable</p>';
    }
  }
}

// -- CDC PLACES health indicators (non-blocking enhancement) --
async function fetchCDCPlacesData() {
  try {
    const res = await fetch('/api/dashboard-places.php?type=health-indicators');
    if (!res.ok) return;
    const places = await res.json();
    if (places.error || !places.records) return;

    // Wait for SDOH data — PLACES merges into it
    if (!sdohData || !sdohData.states) return;
    const fiData = _stateData;
    if (!fiData || !fiData.states) return;

    // Merge CDC fields into existing SDOH state records
    // API returns { state: "AL", obesity: ..., ... } — keyed by abbreviation
    const placesByName = {};
    places.records.forEach(s => { placesByName[s.state] = s; });
    const nameToAbbr = {};
    US_STATES.forEach(([abbr, name]) => { nameToAbbr[name] = abbr; });
    sdohData.states.forEach(s => {
      const p = placesByName[nameToAbbr[s.name]];
      if (!p) return;
      s.obesity = p.obesity;
      s.diabetes = p.diabetes;
      s.depression = p.depression;
      s.housinsec = p.housinsec;
    });

    // Re-render buttons to include CDC options
    initSDOHButtons(sdohData, fiData);
  } catch { /* CDC PLACES is optional — fail silently */ }
}

// -- Demographic Breakdown: Child vs Overall --
function renderDemographics(data) {
  const chart = createChart('chart-demographics');
  if (!chart) return;

  // Sort by child rate descending, take top 15
  const sorted = [...data.states].sort((a, b) => b.childRate - a.childRate).slice(0, 15).reverse();

  const states = sorted.map(s => s.name);
  const overallRates = sorted.map(s => s.rate);
  const childRates = sorted.map(s => s.childRate);
  chart.setOption({
    legend: {
      top: 5, right: 10,
      textStyle: { color: COLORS.text, fontSize: 11 },
      itemWidth: 12, itemHeight: 12
    },
    tooltip: {
      ...TOOLTIP_STYLE,
      formatter: params => {
        if (!Array.isArray(params)) params = [params];
        const name = params[0].name;
        const s = sorted.find(st => st.name === name);
        if (!s) return '';
        const gap = (s.childRate - s.rate).toFixed(1);
        const multiplier = s.rate > 0 ? (s.childRate / s.rate).toFixed(2) : 'N/A';
        return `<strong>${name}</strong><br/>Overall: ${s.rate}%<br/>Children: ${s.childRate}%<br/>Gap: +${gap} pp (${multiplier}x)`;
      }
    },
    grid: { left: 120, right: 40, top: 35, bottom: 30 },
    xAxis: {
      type: 'value',
      name: 'Food Insecurity Rate (%)',
      nameLocation: 'center',
      nameGap: 22,
      nameTextStyle: { color: COLORS.textMuted },
      axisLabel: { color: COLORS.textMuted, formatter: '{value}%' },
      splitLine: { lineStyle: { color: COLORS.gridLine } }
    },
    yAxis: {
      type: 'category',
      data: states,
      axisLabel: { color: COLORS.text, fontSize: 11 }
    },
    series: [
      {
        name: 'Overall Rate',
        type: 'bar',
        data: overallRates,
        barGap: '10%',
        itemStyle: { color: COLORS.primary, borderRadius: [0, 3, 3, 0] },
        label: { show: true, position: 'right', color: COLORS.textMuted, fontSize: 10, formatter: '{c}%' }
      },
      {
        name: 'Child Rate',
        type: 'bar',
        data: childRates,
        itemStyle: { color: COLORS.accent, borderRadius: [0, 3, 3, 0] },
        label: { show: true, position: 'right', color: COLORS.textMuted, fontSize: 10, formatter: '{c}%' }
      }
    ]
  });

  // Populate insight
  const avgGap = sorted.reduce((sum, s) => sum + (s.childRate - s.rate), 0) / sorted.length;
  const worstState = sorted[sorted.length - 1];
  const insightEl = document.getElementById('demographics-insight');
  if (insightEl) {
    insightEl.textContent = `Among the 15 hardest-hit states, children average ${avgGap.toFixed(1)} percentage points higher food insecurity than the general population. ${worstState.name} has the widest child rate at ${worstState.childRate}%.`;
  }
}

// -- Income Distribution ThemeRiver (live Census ACS, non-blocking) --
const INCOME_BANDS = [
  { key: 'under25k', label: 'Under $25K', color: '#ff6b6b' },
  { key: 'from25to50k', label: '$25K–$50K', color: '#ffa94d' },
  { key: 'from50to100k', label: '$50K–$100K', color: '#69db7c' },
  { key: 'from100to200k', label: '$100K–$200K', color: '#4ecdc4' },
  { key: 'over200k', label: '$200K+', color: '#74c0fc' }
];

function renderIncomeRiver(sdoh, fiData) {
  const section = document.getElementById('section-income-river');
  if (section) section.classList.remove('hidden');

  const chart = createChart('chart-income-river');
  if (!chart) return;

  // Build lookup from food insecurity state data
  const fiByName = {};
  fiData.states.forEach(s => { fiByName[s.name] = s; });

  // Merge and sort by food insecurity rate
  const merged = sdoh.states
    .filter(s => s.income && fiByName[s.name])
    .map(s => ({ ...s, fiRate: fiByName[s.name].rate }))
    .sort((a, b) => a.fiRate - b.fiRate);

  // ThemeRiver data: [index, value, bandName]
  const riverData = [];
  merged.forEach((s, i) => {
    INCOME_BANDS.forEach(band => {
      riverData.push([i, s.income[band.key] ?? 0, band.label]);
    });
  });

  chart.setOption({
    tooltip: {
      ...TOOLTIP_STYLE,
      trigger: 'axis',
      formatter: params => {
        const idx = params[0]?.value?.[0];
        const state = merged[idx];
        if (!state) return '';
        let html = `<strong>${state.name}</strong> (FI: ${state.fiRate}%)<br/>`;
        params.forEach(p => {
          const bandName = p.value[2] || p.dimensionNames?.[1] || p.seriesName;
          html += `<svg class="csp-swatch" width="8" height="8"><circle cx="4" cy="4" r="4" fill="${p.color}"/></svg>${bandName}: ${p.value[1]}%<br/>`;
        });
        return html;
      }
    },
    legend: {
      top: 5,
      textStyle: { color: COLORS.text, fontSize: 11 },
      data: INCOME_BANDS.map(b => b.label)
    },
    singleAxis: {
      type: 'value',
      min: 0,
      max: merged.length - 1,
      bottom: 30,
      top: 45,
      axisLabel: {
        color: COLORS.textMuted,
        formatter: val => {
          const s = merged[Math.round(val)];
          return s ? s.name.slice(0, 2) : '';
        },
        interval: Math.max(1, Math.floor(merged.length / 15))
      },
      axisPointer: {
        label: {
          formatter: ({ value }) => {
            const s = merged[Math.round(value)];
            return s ? `${s.name} (${s.fiRate}%)` : '';
          }
        }
      },
      splitLine: { lineStyle: { color: COLORS.gridLine } }
    },
    series: [{
      type: 'themeRiver',
      data: riverData,
      label: { show: false },
      emphasis: { label: { show: false }, itemStyle: { shadowBlur: 10, shadowColor: 'rgba(0,0,0,0.3)' } },
      color: INCOME_BANDS.map(b => b.color)
    }]
  });

  // Insight
  const lowInsecurity = merged.slice(0, 10);
  const highInsecurity = merged.slice(-10);
  const avgLowPovBand = lowInsecurity.reduce((s, st) => s + st.income.under25k, 0) / lowInsecurity.length;
  const avgHighPovBand = highInsecurity.reduce((s, st) => s + st.income.under25k, 0) / highInsecurity.length;
  const insightEl = document.getElementById('income-river-insight');
  if (insightEl) {
    insightEl.textContent = `In the 10 most food-insecure states, ${avgHighPovBand.toFixed(1)}% of households earn under $25K — compared to ${avgLowPovBand.toFixed(1)}% in the 10 least food-insecure states.`;
  }

  updateFreshness('income-river', sdoh);
}

// -- Triple Burden Vulnerability Index --
function renderTripleBurden(data, accessData) {
  const chart = createChart('chart-triple-burden');
  if (!chart) return;

  // Build lookup of low-access % by state name
  const accessByName = {};
  if (accessData?.states) {
    accessData.states.forEach(s => { accessByName[s.name] = s.lowAccessPct; });
  }

  // Normalize a value to 0-100 scale given min/max
  const norm = (val, min, max) => Math.max(0, Math.min(100, ((val - min) / (max - min)) * 100));

  // Compute composite score for each state
  const rates = data.states.map(s => s.rate);
  const rateMin = Math.min(...rates), rateMax = Math.max(...rates);
  const accessVals = data.states.map(s => accessByName[s.name] || 0).filter(v => v > 0);
  const accMin = accessVals.length ? Math.min(...accessVals) : 0;
  const accMax = accessVals.length ? Math.max(...accessVals) : 1;

  const scored = data.states.map(s => {
    const fiScore = norm(s.rate, rateMin, rateMax);
    const accessPct = accessByName[s.name] || 0;
    const accessScore = accessPct > 0 ? norm(accessPct, accMin, accMax) : 0;
    const coverage = s.persons > 0 ? (s.snapParticipation / s.persons) * 100 : 100;
    const coverageGapScore = norm(100 - Math.min(coverage, 100), 0, 60); // higher gap = higher score
    const total = fiScore + accessScore + coverageGapScore;
    return { name: s.name, total, fiScore, accessScore, coverageGapScore, rate: s.rate, accessPct, coverage: Math.round(coverage) };
  }).sort((a, b) => b.total - a.total).slice(0, 10);

  const names = scored.map(s => s.name).reverse();

  chart.setOption({
    tooltip: {
      ...TOOLTIP_STYLE,
      trigger: 'axis',
      formatter: params => {
        const name = params[0].name;
        const s = scored.find(x => x.name === name);
        return `<strong>${name}</strong><br/>`
          + `<span class="csp-text-accent">■</span> Food Insecurity: ${s.rate}% (score: ${s.fiScore.toFixed(0)})<br/>`
          + `<span class="csp-text-low-access">■</span> Low Access: ${s.accessPct}% (score: ${s.accessScore.toFixed(0)})<br/>`
          + `<span class="csp-text-secondary">■</span> SNAP Gap: ${100 - Math.min(s.coverage, 100)}% uncovered (score: ${s.coverageGapScore.toFixed(0)})<br/>`
          + `<strong>Composite: ${s.total.toFixed(0)}/300</strong>`
          + '<br/><span class="csp-text-muted-sm">Scale: three 0\u2013100 component scores, summed for a 0\u2013300 composite.</span>';
      }
    },
    legend: {
      data: ['Food Insecurity', 'Low Access', 'SNAP Coverage Gap'],
      textStyle: { color: COLORS.text, fontSize: 11 },
      top: 5
    },
    grid: { left: 110, right: 20, top: 35, bottom: 20 },
    xAxis: {
      type: 'value', max: 300,
      axisLabel: { color: COLORS.textMuted },
      splitLine: { lineStyle: { color: COLORS.gridLine } }
    },
    yAxis: {
      type: 'category', data: names,
      axisLabel: { color: COLORS.text, fontSize: 11 },
      axisLine: { lineStyle: { color: COLORS.gridLine } }
    },
    series: [
      {
        name: 'Food Insecurity', type: 'bar', stack: 'total',
        data: scored.map(s => s.fiScore).reverse(),
        itemStyle: { color: COLORS.accent, borderRadius: 0 },
        barWidth: '55%'
      },
      {
        name: 'Low Access', type: 'bar', stack: 'total',
        data: scored.map(s => s.accessScore).reverse(),
        itemStyle: { color: LOW_ACCESS_COLOR }
      },
      {
        name: 'SNAP Coverage Gap', type: 'bar', stack: 'total',
        data: scored.map(s => s.coverageGapScore).reverse(),
        itemStyle: { color: COLORS.secondary, borderRadius: [0, 3, 3, 0] }
      }
    ]
  });

  // Dynamic insight
  const worst = scored[0];
  const el = document.getElementById('triple-burden-insight');
  if (el) el.innerHTML = `<strong>${worst.name}</strong> ranks #1 with a composite score of ${worst.total.toFixed(0)}/300 — food insecurity at ${worst.rate}%, ${worst.accessPct}% low-access tracts, and only ${worst.coverage}% SNAP coverage.`;
}

// -- State Narrative Insight Builder --
function buildStateInsight(fi, data, stateName) {
  const sortedByRate = [...data.states].sort((a, b) => b.rate - a.rate);
  const rank = sortedByRate.findIndex(s => s.name === stateName) + 1;
  const natRate = data.national.foodInsecurityRate;
  const diff = (fi.rate - natRate).toFixed(1);
  const sign = diff >= 0 ? '+' : '';
  const childGap = (fi.childRate - fi.rate).toFixed(1);
  const coverage = fi.persons > 0 ? Math.round((fi.snapParticipation / fi.persons) * 100) : 0;
  const snapGap = 100 - coverage;

  const s1 = `${stateName} ranks #${rank} nationally at ${fi.rate}% food insecurity — ${sign}${diff} pp vs. the ${natRate}% national average, affecting an estimated ${fmtNum(fi.persons)} residents.`;
  const s2 = `Children face a sharper burden: ${fi.childRate}% child food insecurity is ${childGap} pp above the overall state rate.`;

  let s3;
  if (coverage < 85) {
    s3 = `Only ${coverage}% of food-insecure residents participate in SNAP, leaving an estimated ${snapGap}% without this support.`;
  } else if (coverage <= 110) {
    s3 = `SNAP participation covers roughly ${coverage}% of the food-insecure population, suggesting most eligible residents are enrolled.`;
  } else {
    s3 = `SNAP participation (${coverage}%) exceeds the estimated food-insecure population — possibly reflecting recent insecurity increases not yet captured in survey data.`;
  }

  return `${s1} ${s2} ${s3}`;
}

// -- State Deep-Dive Cross-Dataset KPI Panel --
function renderStateDeepDive(stateCode, data, accessData, bankData, countyData = null) {
  const section = document.getElementById('section-state-deepdive');
  const panel = document.getElementById('state-deepdive-panel');
  if (!section || !panel) return;

  if (!stateCode) {
    section.classList.add('hidden');
    return;
  }

  const stateName = US_STATES.find(([c]) => c === stateCode)?.[1];
  if (!stateName) return;

  const fi = data.states.find(s => s.name === stateName);
  const access = accessData?.states?.find(s => s.name === stateName);
  const bank = bankData?.states?.find(s => s.name === stateName);

  if (!fi) return;
  section.classList.remove('hidden');

  const coverage = fi.persons > 0 ? Math.round((fi.snapParticipation / fi.persons) * 100) : 'N/A';
  const accessPct = access ? access.lowAccessPct + '%' : 'N/A';
  const density = bank ? bank.perCapitaOrgs.toFixed(1) : 'N/A';

  const kpis = [
    { label: 'Food Insecurity', value: fi.rate + '%', color: COLORS.accent, sub: `#${[...data.states].sort((a, b) => b.rate - a.rate).findIndex(s => s.name === stateName) + 1} nationally` },
    { label: 'Child Rate', value: fi.childRate + '%', color: '#f87171', sub: `vs ${data.national.childFoodInsecurityRate}% national` },
    { label: 'Meal Cost', value: '$' + fi.mealCost, color: COLORS.secondary, sub: `vs $${data.national.averageMealCost} national` },
    { label: 'SNAP Coverage', value: coverage + '%', color: COLORS.primary, sub: coverage > 100 ? 'Exceeds insecure pop' : 'Of insecure pop covered' },
    { label: 'Low-Access Tracts', value: accessPct, color: LOW_ACCESS_COLOR, sub: access ? `${(access.urbanLowAccess + access.ruralLowAccess).toLocaleString()} tracts` : '' },
    { label: 'Food Bank Density', value: density, color: '#34d399', sub: bank ? `per 100K (${bank.orgCount} orgs)` : '' }
  ];

  panel.innerHTML = `
    <div class="dashboard-kpi-grid">
      ${kpis.map(k => `
        <div class="dashboard-kpi-card">
          <div class="dashboard-kpi-card__label">${k.label}</div>
          <div class="dashboard-kpi-card__value">${k.value}</div>
          <div class="dashboard-kpi-card__sub">${k.sub}</div>
        </div>
      `).join('')}
    </div>
    <p class="dashboard-kpi-insight">${buildStateInsight(fi, data, stateName)}</p>
    ${countyData?.length ? `
      <p class="dashboard-kpi-insight"><strong>Highest-need counties:</strong></p>
      <ul class="dashboard-county-top3">
        ${[...countyData].sort((a, b) => b.value - a.value).slice(0, 3).map(c =>
    `<li>${c.name} — ${(+c.value).toFixed(1)}%</li>`
  ).join('')}
      </ul>
    ` : ''}
  `;
  // Set dynamic KPI colors via CSSOM (CSP-compliant)
  kpis.forEach((k, i) => {
    const valueEl = panel.querySelectorAll('.dashboard-kpi-card__value')[i];
    if (valueEl) valueEl.style.setProperty('--kpi-color', k.color);
  });
}

// -- Init --
async function init() {
  // Silent-hang guard (2026-04-12 audit, cluster B): a never-resolving fetch
  // on a bad network used to leave the dashboard blank forever. AbortController
  // + 15000ms timeout kicks the Promise.all into the catch branch so the
  // existing error UI fires instead.
  const abortCtrl = new AbortController();
  const timeoutId = setTimeout(() => abortCtrl.abort(), 15000);
  try {
    // Load core data (static JSON — always available)
    const [dataRes, geoRes] = await Promise.all([
      fetch('/data/food-insecurity-state.json', { signal: abortCtrl.signal }),
      fetch('/data/us-states-geo.json', { signal: abortCtrl.signal })
    ]);
    clearTimeout(timeoutId);

    if (!dataRes.ok || !geoRes.ok) {
      throw new Error('Failed to load dashboard data');
    }

    const [data, geoJSON] = await Promise.all([dataRes.json(), geoRes.json()]);

    // Store for live Census upgrade
    _stateData = data;

    // Sync hero stat data-targets from live JSON
    const nat = data.national;
    document.querySelectorAll('.dashboard-hero .dashboard-stat__number').forEach(el => {
      const label = el.nextElementSibling?.textContent?.trim() || '';
      if (label.includes('Food Insecure') && label.includes('Rate')) el.dataset.target = nat.foodInsecurityRate.toFixed(1);
      else if (label.includes('Americans')) el.dataset.target = (nat.foodInsecurePersons / 1e6).toFixed(1);
      else if (label.includes('Children')) el.dataset.target = (nat.foodInsecureChildren / 1e6).toFixed(1);
      else if (label.includes('Meals')) el.dataset.target = (nat.annualMealGap / 1e9).toFixed(1);
    });
    animateCounters();

    // Hoisted above renderMap so the closures below capture live bindings,
    // not a TDZ slot. Triple-Burden enrichment writes to these later.
    let accessData = null, bankData = null;

    // Render all charts
    const mapCtrl = renderMap(geoJSON, data, 'rate', (stateCode) => {
      renderStateDeepDive(stateCode, data, accessData, bankData, mapCtrl.getCountyData());
    }, (stateCode) => {
      // Async re-render after county fetch completes — fixes first-click empty top-3
      renderStateDeepDive(stateCode, data, accessData, bankData, mapCtrl.getCountyData());
    });

    // County search
    initCountySearch(mapCtrl);

    // State deep-dive selector (also drives KPI panel)
    initStateSelector('state-selector-container', (stateCode) => {
      if (!stateCode) {
        mapCtrl.showNational();
        renderStateDeepDive('', data, accessData, bankData, mapCtrl.getCountyData());
        return;
      }
      const stateName = US_STATES.find(([c]) => c === stateCode)?.[1];
      const match = data.states.find(s => s.name === stateName);
      if (match?.fips) mapCtrl.drillDown(match.name, match.fips);
      renderStateDeepDive(stateCode, data, accessData, bankData, mapCtrl.getCountyData());
    });
    renderTrend(data);
    renderRadar(data);
    renderScatter(data);
    initScatterToggle();
    renderDemographics(data);
    renderDivergence(data);
    renderMealCost(data);

    // Accessible table
    populateAccessibleTable(data);

    // SNAP chart
    renderSnap(data);

    // Non-blocking: fetch cross-dataset files for Triple Burden + State Deep-Dive
    Promise.all([
      fetch('/data/current-food-access.json').then(r => r.ok ? r.json() : null).catch(() => null),
      fetch('/data/food-bank-summary.json').then(r => r.ok ? r.json() : null).catch(() => null)
    ]).then(([ad, bd]) => {
      accessData = ad;
      bankData = bd;
      renderTripleBurden(data, accessData);
      // If state already selected via URL, render deep-dive now that data is loaded
      const urlState = new URLSearchParams(window.location.search).get('state');
      if (urlState) renderStateDeepDive(urlState, data, accessData, bankData, mapCtrl.getCountyData());
    }).catch(err => {
      errorTracker.captureException(err, { context: 'food-insecurity-tripleBurden-enrichment' });
    });

    // CSV export buttons — county-aware when drilled in
    addExportButton('chart-map', 'food-insecurity-by-state.csv', () => {
      const countyData = mapCtrl.getCountyData();
      if (countyData) {
        return {
          filename: 'food-insecurity-counties.csv',
          headers: ['County', 'Food Insecurity Rate (%)', 'Child Rate (%)', 'Meal Cost ($)'],
          rows: countyData.map(c => [c.name, c.rate, c.childRate, c.mealCost])
        };
      }
      return {
        headers: ['State', 'Food Insecurity Rate (%)', 'Child Rate (%)', 'Persons', 'Meal Gap', 'Meal Cost ($)', 'Poverty Rate (%)', 'SNAP Participation'],
        rows: data.states.map(s => [s.name, s.rate, s.childRate, s.persons, s.mealGap, s.mealCost, s.povertyRate, s.snapParticipation])
      };
    });

    // Scroll reveal
    initScrollReveal();

    // Responsive
    window.addEventListener('resize', handleResize);

    // Live data (non-blocking, enhances dashboard if available)
    fetchBLSData();
    fetchSAIPEPoverty();
    fetchSDOHData();

  } catch (err) {
    clearTimeout(timeoutId);
    const msg = err?.name === 'AbortError'
      ? 'Dashboard data took too long to load. Check your connection or try again later.'
      : 'Unable to load dashboard data. If the problem persists, try refreshing the page.';
    document.querySelectorAll('.dashboard-chart').forEach(el => {
      el.innerHTML = `<p class="dashboard-error-state">${msg}</p>`;
    });
    const errorEl = document.getElementById('dashboard-error');
    if (errorEl) { errorEl.textContent = msg; errorEl.hidden = false; }
  }
}

// Load BLS food price data: static JSON first, then try live PHP proxy for fresher data
async function fetchBLSData() {
  // 1. Load static JSON (always available)
  try {
    const res = await fetch('/data/bls-food-cpi.json');
    if (res.ok) {
      const data = await res.json();
      renderFoodPrices(data);
      updateFreshness('bls', { _static: true, _dataYear: 'CPI' });
    }
  } catch { /* static file missing */ }

  // 2. Try live PHP proxy for fresher data (non-blocking upgrade)
  try {
    const res = await fetch('/api/dashboard-bls.php');
    if (!res.ok) return;
    const liveData = await res.json();
    if (liveData.error || !liveData.series) return;
    // Re-render with live data
    renderFoodPrices(liveData);
    updateFreshness('bls', liveData);
  } catch { /* PHP proxy unavailable — static data already rendered */ }
}

// Non-blocking: try SAIPE first (better poverty estimates), fall back to Census ACS
async function fetchSAIPEPoverty() {
  const saipeLoaded = await _trySAIPE();
  if (!saipeLoaded) await _tryACSFallback();
}

// Try Census SAIPE — more accurate poverty estimates (especially for small areas)
async function _trySAIPE() {
  try {
    const res = await fetch('/api/dashboard-saipe.php?type=states');
    if (!res.ok) return false;
    const saipeData = await res.json();
    if (saipeData.error || !saipeData.records) return false;

    // Build FIPS lookup from SAIPE response
    const saipeByFips = {};
    saipeData.records.forEach(r => { saipeByFips[r.fips] = r; });

    // Merge SAIPE poverty data into existing state records
    const data = _stateData;
    if (!data || !data.states) return false;

    data.states = data.states.map(s => {
      const sp = saipeByFips[s.fips];
      if (!sp) return s;
      return {
        ...s,
        povertyRate: sp.povertyRate ?? s.povertyRate,
        childPovertyRate: sp.childPovertyRate ?? s.childPovertyRate,
        medianIncome: sp.medianIncome ?? s.medianIncome
      };
    });

    // Re-render scatter with SAIPE data
    renderScatter(data, null, 'Census SAIPE');
    updateFreshness('census', saipeData);
    return true;
  } catch { return false; }
}

// Fallback: Census ACS poverty data (if SAIPE proxy unavailable)
async function _tryACSFallback() {
  try {
    const res = await fetch('/api/dashboard-census.php?type=states');
    if (!res.ok) return;
    const censusData = await res.json();
    if (censusData.error || !censusData.records) return;

    // Build FIPS lookup from Census response
    const censusByFips = {};
    censusData.records.forEach(r => { censusByFips[r.fips] = r; });

    // Merge fresher poverty data into existing state records
    const data = _stateData;
    if (!data || !data.states) return;

    data.states = data.states.map(s => {
      const c = censusByFips[s.fips];
      if (c) return { ...s, povertyRate: c.povertyRate, population: c.population };
      return s;
    });

    // Re-render scatter with ACS data
    renderScatter(data, null, 'Census ACS');
    updateFreshness('census', censusData);
  } catch { /* Census proxy unavailable — static data already rendered */ }
}

// Start when DOM ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
