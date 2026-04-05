/**
 * @fileoverview Food Insecurity Dashboard — ECharts visualizations
 * @description Interactive dashboard with choropleth map, trend line, bar chart,
 *              scatter plot, and meal cost comparison. Tree-shaken ECharts imports.
 */

import {
  echarts, COLORS, TOOLTIP_STYLE, MAP_PALETTES,
  fmtNum, animateCounters, createChart, linearRegression,
  updateFreshness, initScrollReveal, handleResize,
  REGION_COLORS, getRegion, addExportButton, initStateSelector, US_STATES
} from './shared/dashboard-utils.js';

const PAL = MAP_PALETTES.insecurity;

// -- Map Chart with County Drill-Down --
function renderMap(geoJSON, data, metric = 'rate') {
  const chart = createChart('chart-map');
  if (!chart) return;

  // Albers projection identity (data is pre-projected)
  const albersProjection = {
    project: (point) => point,
    unproject: (point) => point
  };

  echarts.registerMap('USA', geoJSON);

  // Compute SNAP coverage ratio per state and attach to state objects
  data.states.forEach(s => {
    s.snapCoverage = s.persons > 0 ? Math.round((s.snapParticipation / s.persons) * 100) : 0;
  });

  const metricConfig = {
    rate: { name: 'Food Insecurity Rate', suffix: '%', min: 8, max: 20 },
    childRate: { name: 'Child Food Insecurity', suffix: '%', min: 10, max: 30 },
    persons: { name: 'Food Insecure Persons', suffix: '', min: 0, max: 5000000 },
    mealGap: { name: 'Annual Meal Gap', suffix: '', min: 0, max: 900000000 },
    mealCost: { name: 'Average Meal Cost', suffix: '$', min: 3, max: 5.5 },
    snapCoverage: { name: 'SNAP Coverage Ratio', suffix: '%', min: 40, max: 150 }
  };

  // State for drill-down
  let currentView = 'national';
  let currentMetric = metric;

  // State tooltip formatter
  function stateTooltip(params) {
    const d = params.data;
    if (!d) return '';
    return `<strong style="font-size:14px">${d.name}</strong><br/>
      <span style="color:${COLORS.secondary}">Food Insecurity:</span> ${d.rate}%<br/>
      <span style="color:${COLORS.accent}">Child Rate:</span> ${d.childRate}%<br/>
      Persons: ${fmtNum(d.persons)}<br/>
      Meal Gap: ${fmtNum(d.mealGap)} meals/yr<br/>
      Avg Meal Cost: $${d.mealCost}<br/>
      Poverty Rate: ${d.povertyRate}%<br/>
      SNAP: ${fmtNum(d.snapParticipation)} (${d.snapCoverage || '—'}% coverage)<br/>
      <span style="color:${COLORS.secondary};font-size:11px">Click to see counties</span>`;
  }

  // County tooltip formatter
  function countyTooltip(params) {
    const d = params.data;
    if (!d) return '';
    return `<strong style="font-size:14px">${d.name}</strong><br/>
      Population: ${fmtNum(d.population || 0)}<br/>
      <span style="color:${COLORS.secondary}">Food Insecurity:</span> ${d.rate}%<br/>
      <span style="color:${COLORS.accent}">Child Rate:</span> ${d.childRate}%<br/>
      Poverty Rate: ${d.povertyRate}%<br/>
      Persons: ${fmtNum(d.persons)}<br/>
      Meal Gap: ${fmtNum(d.mealGap)} meals/yr<br/>
      Avg Meal Cost: $${d.mealCost}`;
  }

  // Show national (state-level) view
  function showNational() {
    currentView = 'national';
    const cfg = metricConfig[currentMetric];
    const mapData = data.states.map(s => ({ name: s.name, value: s[currentMetric], ...s }));

    // Hide back button
    const backBtn = document.getElementById('map-back-btn');
    if (backBtn) backBtn.style.display = 'none';
    const mapLabel = document.getElementById('map-state-label');
    if (mapLabel) mapLabel.textContent = '';
    const hint = document.querySelector('#chart-map + .dashboard-chart__hint');
    if (hint) hint.textContent = 'Hover for state details \u2014 click any state for county breakdown';

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
        .filter(f => f.properties.rate)
        .map(f => ({
          name: f.properties.name,
          value: f.properties[currentMetric] || f.properties.rate,
          ...f.properties
        }));

      // Compute dynamic min/max for this state's counties
      const vals = countyData.map(c => c.value).filter(v => typeof v === 'number');
      const min = Math.floor(Math.min(...vals));
      const max = Math.ceil(Math.max(...vals));

      currentView = stateFips;

      // Show back button
      const backBtn = document.getElementById('map-back-btn');
      if (backBtn) backBtn.style.display = '';
      const mapLabel = document.getElementById('map-state-label');
      if (mapLabel) mapLabel.textContent = stateName;
      const hint = document.querySelector('#chart-map + .dashboard-chart__hint');
      if (hint) hint.textContent = 'County rates are modeled estimates (poverty regression), not survey data \u2014 click Back for state-level survey data';

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
          name: metricConfig[currentMetric].name,
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
    } catch {
      chart.hideLoading();
    }
  }

  // Initial render
  showNational();

  // Click handler: state click → drill down
  chart.on('click', (params) => {
    if (currentView === 'national' && params.data) {
      const stateFips = params.data.fips;
      const stateName = params.data.name;
      if (stateFips) drillDown(stateName, stateFips);
    }
  });

  // Back button
  const backBtn = document.getElementById('map-back-btn');
  if (backBtn) {
    backBtn.addEventListener('click', () => showNational());
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

  return { chart, drillDown, showNational };
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
    const query = input.value.trim().toLowerCase();
    selectedIdx = -1;

    if (!countyIndex || query.length < 2) {
      resultsList.setAttribute('data-visible', 'false');
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
      resultsList.innerHTML = '<li style="color:rgba(255,255,255,0.4)">No counties found</li>';
      resultsList.setAttribute('data-visible', 'true');
      return;
    }

    resultsList.innerHTML = matches.map((m, i) =>
      `<li role="option" data-fips="${m.stateFips}" data-county="${m.name}" data-state="${m.stateName}" id="search-opt-${i}">${m.name}<span class="search-state">${m.stateName}</span></li>`
    ).join('');
    resultsList.setAttribute('data-visible', 'true');

    // Click handler for results
    resultsList.querySelectorAll('li[role="option"]').forEach(li => {
      li.addEventListener('click', () => {
        const sFips = li.dataset.fips;
        const sName = li.dataset.state;
        const countyName = li.dataset.county;
        input.value = `${countyName}, ${sName}`;
        resultsList.setAttribute('data-visible', 'false');
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
      return;
    } else {
      return;
    }

    items.forEach((li, i) => li.setAttribute('aria-selected', i === selectedIdx ? 'true' : 'false'));
    items[selectedIdx]?.scrollIntoView({ block: 'nearest' });
  });

  // Close on outside click
  document.addEventListener('click', (e) => {
    if (!e.target.closest('.dashboard-search__wrapper')) {
      resultsList.setAttribute('data-visible', 'false');
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
        let tip = `<strong>${params[0].axisValue}</strong> <span style="color:${COLORS.textMuted};font-size:11px">${sourceLabel}</span><br/>`;
        // Deduplicate: only show one entry per series name (actual and projected overlap)
        const seen = new Set();
        params.forEach(p => {
          const baseName = p.seriesName.replace(' (Projected)', '');
          if (seen.has(baseName) || p.value == null) return;
          seen.add(baseName);
          const arr = baseName === 'Overall Rate' ? rates : childRates;
          const yoy = idx > 0 ? (p.value - arr[idx - 1]).toFixed(1) : null;
          const yoyStr = yoy !== null ? ` (<span style="color:${yoy >= 0 ? COLORS.accent : '#22c55e'}">${yoy >= 0 ? '+' : ''}${yoy}pp</span>)` : '';
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

// -- Radar: Top 5 vs Bottom 5 States --
function renderBar(data) {
  const chart = createChart('chart-bar');
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

  chart.setOption({
    tooltip: { ...TOOLTIP_STYLE },
    legend: {
      data: [`Top 5 (${top5.map(s => s.name).join(', ')})`, `Bottom 5 (${bottom5.map(s => s.name).join(', ')})`],
      textStyle: { color: COLORS.text, fontSize: 10 }, bottom: 0
    },
    radar: {
      indicator: [
        { name: 'Food Insecurity', max: 100 },
        { name: 'Child Rate', max: 100 },
        { name: 'Poverty', max: 100 },
        { name: 'Meal Cost', max: 100 },
        { name: 'SNAP Usage', max: 100 }
      ],
      shape: 'polygon', splitNumber: 4,
      axisName: { color: COLORS.text, fontSize: 11 },
      splitLine: { lineStyle: { color: COLORS.gridLine } },
      splitArea: { areaStyle: { color: ['rgba(0,212,255,0.02)', 'rgba(0,212,255,0.05)'] } },
      axisLine: { lineStyle: { color: COLORS.gridLine } }
    },
    series: [{
      type: 'radar',
      data: [
        { value: top5Avg, name: `Top 5 (${top5.map(s => s.name).join(', ')})`, areaStyle: { color: 'rgba(239,68,68,0.25)' }, lineStyle: { color: PAL.high, width: 2 }, itemStyle: { color: PAL.high } },
        { value: bot5Avg, name: `Bottom 5 (${bottom5.map(s => s.name).join(', ')})`, areaStyle: { color: 'rgba(96,165,250,0.25)' }, lineStyle: { color: PAL.low, width: 2 }, itemStyle: { color: PAL.low } }
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

  const chart = createChart('chart-scatter');
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
        return `<strong>${d.name}</strong> <span style="color:${REGION_COLORS[region]}">(${region})</span><br/>${pLabel}: ${d.value[0]}%<br/>${fiLabel}: ${d.value[1]}%<br/><span style="color:${COLORS.textMuted};font-size:11px">Source: ${srcTag}</span>`;
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
    const label = isChild ? 'child poverty is a leading predictor of child food insecurity' : 'poverty is the #1 predictor of food insecurity';
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

    const currentData = window._fnfStateData;
    if (currentData) renderScatter(currentData, btn.dataset.scatterMode);
  });
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
        return `<strong>${p.name}</strong> <span style="color:${REGION_COLORS[region]}">(${region})</span><br/>Meal Cost: <strong>$${p.value}</strong><br/>${p.value > natAvg ? '+' : ''}${diff}% vs national avg ($${natAvg})`;
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

  // Top 15 states by food insecurity, showing SNAP participation alongside
  const sorted = [...data.states].sort((a, b) => b.rate - a.rate).slice(0, 15);
  const names = sorted.map(s => s.name);
  const rates = sorted.map(s => s.rate);
  const snapCoverageRatio = sorted.map(s => Math.round((s.snapParticipation / s.persons) * 100));

  chart.setOption({
    tooltip: {
      trigger: 'axis',
      ...TOOLTIP_STYLE
    },
    legend: {
      data: ['Food Insecurity Rate (%)', 'SNAP Coverage (%)'],
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
        name: 'Food Insecurity Rate (%)',
        type: 'bar',
        data: rates.reverse(),
        barWidth: '35%',
        itemStyle: {
          borderRadius: [0, 3, 3, 0],
          color: new echarts.graphic.LinearGradient(0, 0, 1, 0, [
            { offset: 0, color: PAL.mid },
            { offset: 1, color: PAL.high }
          ])
        },
        animationDuration: 1500
      },
      {
        name: 'SNAP Coverage (%)',
        type: 'bar',
        data: snapCoverageRatio.reverse(),
        barWidth: '35%',
        itemStyle: {
          borderRadius: [0, 3, 3, 0],
          color: new echarts.graphic.LinearGradient(0, 0, 1, 0, [
            { offset: 0, color: COLORS.primary },
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
  const chart = createChart('chart-food-prices');
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
      data: ['Food at Home', 'Food Away from Home', 'All Items'],
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
            { offset: 0, color: 'rgba(255,107,53,0.2)' },
            { offset: 1, color: 'rgba(255,107,53,0.01)' }
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
  });
}

// -- SDOH Scatter (live Census ACS data, non-blocking) --
const SDOH_METRICS = [
  { key: 'uninsuredPct', label: 'Uninsured Rate', axis: 'Uninsured (%)', source: 'census', insight: 'Lack of health insurance amplifies food insecurity — medical costs crowd out food budgets.' },
  { key: 'collegePct', label: 'College Education', axis: 'Bachelor\'s+ (%)', source: 'census', insight: 'Higher education correlates with lower food insecurity — but causation runs through income and employment stability.', invert: true },
  { key: 'unemploymentPct', label: 'Unemployment', axis: 'Unemployment Rate (%)', source: 'census', insight: 'Job loss is the most immediate trigger of food insecurity — unemployed workers are 3x more likely to be food insecure than employed peers.' },
  { key: 'noVehiclePct', label: 'No Vehicle', axis: 'Workers Without Vehicle (%)', source: 'census', insight: 'Transportation barriers limit access to affordable food — workers without vehicles face both job and food access challenges.' },
  { key: 'housingBurdenPct', label: 'Housing Burden', axis: 'Severe Housing Cost Burden (%)', source: 'census', insight: 'When rent exceeds 50% of income, food is the first budget line to shrink — housing cost is a hidden driver of hunger.' },
  { key: 'obesity', label: 'Adult Obesity (CDC)', axis: 'Obesity Prevalence (%)', source: 'places', insight: 'States with higher food insecurity tend to have higher obesity rates — cheap, calorie-dense food replaces nutritious options when budgets are tight.' },
  { key: 'diabetes', label: 'Diabetes (CDC)', axis: 'Diabetes Prevalence (%)', source: 'places', insight: 'Food insecurity and diabetes create a vicious cycle — poor diet increases diabetes risk, and diabetes management costs further strain food budgets.' },
  { key: 'depression', label: 'Depression (CDC)', axis: 'Depression Prevalence (%)', source: 'places', insight: 'The mental health toll of food insecurity is measurable — states with higher food insecurity show higher depression prevalence.' },
  { key: 'housinsec', label: 'Housing Insecurity (CDC)', axis: 'Housing Insecurity (%)', source: 'places', insight: 'Housing and food insecurity compound — when eviction threatens, food is the first budget line cut.' }
];

let sdohData = null;
let sdohChart = null;

function renderSDOH(sdoh, fiData, metricKey) {
  const metric = SDOH_METRICS.find(m => m.key === metricKey) || SDOH_METRICS[0];
  const section = document.getElementById('section-sdoh');
  if (section) section.style.display = '';

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
        return `<strong>${d.name}</strong> <span style="color:${REGION_COLORS[region]}">(${region})</span><br/>${metric.axis}: ${d.value[0]}%<br/>Food Insecurity: ${d.value[1]}%`;
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
    html += '<span class="dashboard-metric-separator" aria-hidden="true">Health Outcomes</span>';
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
    const fiData = window._fnfStateData;
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
  } catch { /* SDOH is optional — fail silently */ }
}

// -- CDC PLACES health indicators (non-blocking enhancement) --
async function fetchCDCPlacesData() {
  try {
    const res = await fetch('/api/dashboard-places.php?type=health-indicators');
    if (!res.ok) return;
    const places = await res.json();
    if (places.error || !places.states) return;

    // Wait for SDOH data — PLACES merges into it
    if (!sdohData || !sdohData.states) return;
    const fiData = window._fnfStateData;
    if (!fiData || !fiData.states) return;

    // Merge CDC fields into existing SDOH state records
    const placesByName = {};
    places.states.forEach(s => { placesByName[s.name] = s; });
    sdohData.states.forEach(s => {
      const p = placesByName[s.name];
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
        const multiplier = (s.childRate / s.rate).toFixed(2);
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
  if (section) section.style.display = '';

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
      riverData.push([i, s.income[band.key], band.label]);
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
          html += `<span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:${p.color};margin-right:4px;"></span>${p.dimensionNames?.[1] || p.seriesName}: ${p.value[1]}%<br/>`;
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
      emphasis: { itemStyle: { shadowBlur: 10, shadowColor: 'rgba(0,0,0,0.3)' } },
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
  const accMin = Math.min(...accessVals), accMax = Math.max(...accessVals);

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
          + `<span style="color:${COLORS.accent}">■</span> Food Insecurity: ${s.rate}% (score: ${s.fiScore.toFixed(0)})<br/>`
          + `<span style="color:#f59e0b">■</span> Low Access: ${s.accessPct}% (score: ${s.accessScore.toFixed(0)})<br/>`
          + `<span style="color:${COLORS.secondary}">■</span> SNAP Gap: ${100 - Math.min(s.coverage, 100)}% uncovered (score: ${s.coverageGapScore.toFixed(0)})<br/>`
          + `<strong>Composite: ${s.total.toFixed(0)}/300</strong>`;
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
        itemStyle: { color: '#f59e0b' }
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

// -- State Deep-Dive Cross-Dataset KPI Panel --
function renderStateDeepDive(stateCode, data, accessData, bankData) {
  const section = document.getElementById('section-state-deepdive');
  const panel = document.getElementById('state-deepdive-panel');
  if (!section || !panel) return;

  if (!stateCode) {
    section.style.display = 'none';
    return;
  }

  const stateName = US_STATES.find(([c]) => c === stateCode)?.[1];
  if (!stateName) return;

  const fi = data.states.find(s => s.name === stateName);
  const access = accessData?.states?.find(s => s.name === stateName);
  const bank = bankData?.states?.find(s => s.name === stateName);

  if (!fi) return;
  section.style.display = '';

  const coverage = fi.persons > 0 ? Math.round((fi.snapParticipation / fi.persons) * 100) : 'N/A';
  const accessPct = access ? access.lowAccessPct + '%' : 'N/A';
  const density = bank ? bank.perCapitaOrgs.toFixed(1) : 'N/A';

  const kpis = [
    { label: 'Food Insecurity', value: fi.rate + '%', color: COLORS.accent, sub: `#${data.states.sort((a, b) => b.rate - a.rate).findIndex(s => s.name === stateName) + 1} nationally` },
    { label: 'Child Rate', value: fi.childRate + '%', color: '#f87171', sub: `vs ${data.national.childFoodInsecurityRate}% national` },
    { label: 'Meal Cost', value: '$' + fi.mealCost, color: COLORS.secondary, sub: `vs $${data.national.averageMealCost} national` },
    { label: 'SNAP Coverage', value: coverage + '%', color: COLORS.primary, sub: coverage > 100 ? 'Exceeds insecure pop' : 'Of insecure pop covered' },
    { label: 'Low-Access Tracts', value: accessPct, color: '#f59e0b', sub: access ? `${(access.urbanLowAccess + access.ruralLowAccess).toLocaleString()} tracts` : '' },
    { label: 'Food Bank Density', value: density, color: '#34d399', sub: bank ? `per 100K (${bank.orgCount} orgs)` : '' }
  ];

  panel.innerHTML = `
    <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:1rem;width:100%;padding:0.5rem 0;">
      ${kpis.map(k => `
        <div style="background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.1);border-radius:8px;padding:1rem;text-align:center;">
          <div style="font-size:0.7rem;color:rgba(255,255,255,0.5);text-transform:uppercase;letter-spacing:0.05em;margin-bottom:0.3rem;">${k.label}</div>
          <div style="font-size:1.6rem;font-weight:700;color:${k.color};">${k.value}</div>
          <div style="font-size:0.7rem;color:rgba(255,255,255,0.4);margin-top:0.2rem;">${k.sub}</div>
        </div>
      `).join('')}
    </div>
  `;
}

// -- Init --
async function init() {
  try {
    // Load core data (static JSON — always available)
    const [dataRes, geoRes] = await Promise.all([
      fetch('/data/food-insecurity-state.json'),
      fetch('/data/us-states-geo.json')
    ]);

    if (!dataRes.ok || !geoRes.ok) {
      throw new Error('Failed to load dashboard data');
    }

    const [data, geoJSON] = await Promise.all([dataRes.json(), geoRes.json()]);

    // Store for live Census upgrade
    window._fnfStateData = data;

    // Animate hero counters
    animateCounters();

    // Render all charts
    const mapCtrl = renderMap(geoJSON, data);

    // County search
    initCountySearch(mapCtrl);

    // State deep-dive selector (also drives KPI panel)
    let accessData = null, bankData = null;
    initStateSelector('state-selector-container', (stateCode) => {
      if (!stateCode) {
        mapCtrl.showNational();
        renderStateDeepDive('', data, accessData, bankData);
        return;
      }
      const stateName = US_STATES.find(([c]) => c === stateCode)?.[1];
      const match = data.states.find(s => s.name === stateName);
      if (match?.fips) mapCtrl.drillDown(match.name, match.fips);
      renderStateDeepDive(stateCode, data, accessData, bankData);
    });
    renderTrend(data);
    renderBar(data);
    renderScatter(data);
    initScatterToggle();
    renderDemographics(data);
    renderMealCost(data);

    // Accessible table
    populateAccessibleTable(data);

    // SNAP chart
    renderSnap(data);

    // Non-blocking: fetch cross-dataset files for Triple Burden + State Deep-Dive
    Promise.all([
      fetch('/data/food-access-atlas.json').then(r => r.ok ? r.json() : null).catch(() => null),
      fetch('/data/food-bank-summary.json').then(r => r.ok ? r.json() : null).catch(() => null)
    ]).then(([ad, bd]) => {
      accessData = ad;
      bankData = bd;
      renderTripleBurden(data, accessData);
      // If state already selected via URL, render deep-dive now that data is loaded
      const urlState = new URLSearchParams(window.location.search).get('state');
      if (urlState) renderStateDeepDive(urlState, data, accessData, bankData);
    });

    // CSV export buttons
    addExportButton('chart-map', 'food-insecurity-by-state.csv', () => ({
      headers: ['State', 'Food Insecurity Rate (%)', 'Child Rate (%)', 'Persons', 'Meal Gap', 'Meal Cost ($)', 'Poverty Rate (%)', 'SNAP Participation'],
      rows: data.states.map(s => [s.name, s.rate, s.childRate, s.persons, s.mealGap, s.mealCost, s.povertyRate, s.snapParticipation])
    }));

    // Scroll reveal
    initScrollReveal();

    // Responsive
    window.addEventListener('resize', handleResize);

    // Live data (non-blocking, enhances dashboard if available)
    fetchBLSData();
    fetchSAIPEPoverty();
    fetchSDOHData();

  } catch (err) {
    // Show error in chart containers
    document.querySelectorAll('.dashboard-chart').forEach(el => {
      el.innerHTML = '<p style="color: rgba(255,255,255,0.5); text-align: center; padding: 2rem;">Unable to load dashboard data. Please refresh the page.</p>';
    });
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
    const data = window._fnfStateData;
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
    const data = window._fnfStateData;
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
