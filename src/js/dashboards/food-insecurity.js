/**
 * @fileoverview Food Insecurity Dashboard — ECharts visualizations
 * @description Interactive dashboard with choropleth map, trend line, bar chart,
 *              scatter plot, and meal cost comparison. Tree-shaken ECharts imports.
 */

import {
  echarts, COLORS, TOOLTIP_STYLE, MAP_PALETTES,
  fmtNum, animateCounters, createChart, linearRegression,
  updateFreshness, initScrollReveal, handleResize, fetchWithFallback,
  REGION_COLORS, getRegion
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

  const metricConfig = {
    rate: { name: 'Food Insecurity Rate', suffix: '%', min: 8, max: 20 },
    childRate: { name: 'Child Food Insecurity', suffix: '%', min: 10, max: 27 },
    persons: { name: 'Food Insecure Persons', suffix: '', min: 0, max: 5000000 },
    mealGap: { name: 'Annual Meal Gap', suffix: '', min: 0, max: 900000000 },
    mealCost: { name: 'Average Meal Cost', suffix: '$', min: 3, max: 5.5 }
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
      SNAP: ${fmtNum(d.snapParticipation)}<br/>
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

  chart.setOption({
    tooltip: {
      trigger: 'axis',
      ...TOOLTIP_STYLE,
      formatter: params => {
        const idx = params[0].dataIndex;
        let tip = `<strong>${params[0].axisValue}</strong><br/>`;
        params.forEach(p => {
          const arr = p.seriesName === 'Overall Rate' ? rates : childRates;
          const yoy = idx > 0 ? (p.value - arr[idx - 1]).toFixed(1) : null;
          const yoyStr = yoy !== null ? ` (<span style="color:${yoy >= 0 ? COLORS.accent : '#22c55e'}">${yoy >= 0 ? '+' : ''}${yoy}pp</span>)` : '';
          tip += `${p.marker} ${p.seriesName}: <strong>${p.value}%</strong>${yoyStr}<br/>`;
        });
        return tip;
      }
    },
    legend: {
      data: ['Overall Rate', 'Child Rate'],
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
        data: rates,
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
        animationDuration: 2000
      },
      {
        name: 'Child Rate',
        type: 'line',
        data: childRates,
        smooth: true,
        symbol: 'diamond',
        symbolSize: 8,
        lineStyle: { width: 3, color: COLORS.accent },
        itemStyle: { color: COLORS.accent },
        animationDuration: 2000,
        animationDelay: 300
      }
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

  const maxRate = 20, maxChild = 28, maxPoverty = 20, maxMeal = 5.5, maxSnap = 900000;
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
function renderScatter(data) {
  const chart = createChart('chart-scatter');
  if (!chart) return;

  const points = data.states.map(s => ({
    value: [s.povertyRate, s.rate],
    name: s.name,
    persons: s.persons
  }));

  chart.setOption({
    tooltip: {
      ...TOOLTIP_STYLE,
      formatter: params => {
        const d = params.data;
        return `<strong>${d.name}</strong><br/>Poverty: ${d.value[0]}%<br/>Food Insecurity: ${d.value[1]}%`;
      }
    },
    grid: { left: 55, right: 20, top: 20, bottom: 45 },
    xAxis: {
      name: 'Poverty Rate (%)',
      nameLocation: 'center',
      nameGap: 30,
      nameTextStyle: { color: COLORS.textMuted },
      axisLabel: { color: COLORS.textMuted, formatter: '{value}%' },
      splitLine: { lineStyle: { color: COLORS.gridLine } }
    },
    yAxis: {
      name: 'Food Insecurity (%)',
      nameTextStyle: { color: COLORS.textMuted },
      axisLabel: { color: COLORS.textMuted, formatter: '{value}%' },
      splitLine: { lineStyle: { color: COLORS.gridLine } }
    },
    series: [{
      type: 'scatter',
      data: points,
      symbolSize: (val) => {
        const p = points.find(pt => pt.value[0] === val[0] && pt.value[1] === val[1]);
        return p ? Math.max(8, Math.sqrt(p.persons / 50000)) : 10;
      },
      itemStyle: {
        color: COLORS.secondary,
        opacity: 0.75
      },
      emphasis: {
        itemStyle: { color: COLORS.accent, opacity: 1 }
      },
      markLine: (() => {
        const reg = linearRegression(points.map(p => p.value));
        const xs = points.map(p => p.value[0]);
        const xMin = Math.min(...xs), xMax = Math.max(...xs);
        return {
          symbol: 'none', silent: true,
          lineStyle: { color: 'rgba(255,255,255,0.35)', type: 'dashed', width: 1.5 },
          data: [[{ coord: [xMin, reg.slope * xMin + reg.intercept] }, { coord: [xMax, reg.slope * xMax + reg.intercept] }]],
          label: { formatter: `r = ${reg.r.toFixed(2)}`, color: COLORS.textMuted, fontSize: 11, position: 'end' }
        };
      })(),
      animationDuration: 2000
    }]
  });
}

// -- Nightingale: Meal Cost by State --
function renderMealCost(data) {
  const chart = createChart('chart-meal-cost');
  if (!chart) return;

  const sorted = [...data.states].sort((a, b) => b.mealCost - a.mealCost);
  const pieData = sorted.map(s => ({
    name: s.name, value: s.mealCost,
    itemStyle: { color: REGION_COLORS[getRegion(s.name)] }
  }));

  chart.setOption({
    tooltip: {
      ...TOOLTIP_STYLE,
      formatter: p => `<strong>${p.name}</strong><br/>Meal Cost: <strong>$${p.value}</strong><br/>Region: ${getRegion(p.name)}`
    },
    series: [{
      type: 'pie', roseType: 'area', radius: ['15%', '65%'], center: ['50%', '50%'],
      itemStyle: { borderRadius: 4, borderColor: 'rgba(0,0,0,0.3)', borderWidth: 1 },
      label: {
        show: true, color: COLORS.text, fontSize: 9,
        formatter: p => `${p.name}\n$${p.value}`,
        alignTo: 'labelLine',
        overflow: 'truncate',
        minMargin: 5
      },
      labelLine: { length: 8, length2: 12, smooth: true },
      emphasis: { label: { show: true, fontSize: 12, fontWeight: 'bold', formatter: p => `${p.name}\n$${p.value}` } },
      data: pieData, animationDuration: 2000
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
  const snapPer100k = sorted.map(s => Math.round((s.snapParticipation / (s.persons / (s.rate / 100))) * 100));

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
        data: snapPer100k.reverse(),
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
      data: foodHome.data.map(d => d.date),
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
        data: foodHome.data.map(d => d.value),
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
        data: foodAway.data.map(d => d.value),
        smooth: true,
        lineStyle: { width: 2, color: COLORS.secondary },
        itemStyle: { color: COLORS.secondary },
        symbol: 'none'
      }] : []),
      ...(allItems ? [{
        name: 'All Items',
        type: 'line',
        data: allItems.data.map(d => d.value),
        smooth: true,
        lineStyle: { width: 1.5, color: 'rgba(255,255,255,0.3)', type: 'dashed' },
        itemStyle: { color: 'rgba(255,255,255,0.3)' },
        symbol: 'none'
      }] : [])
    ]
  });
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

    // Animate hero counters
    animateCounters();

    // Render all charts
    const mapCtrl = renderMap(geoJSON, data);

    // County search
    initCountySearch(mapCtrl);
    renderTrend(data);
    renderBar(data);
    renderScatter(data);
    renderMealCost(data);

    // Accessible table
    populateAccessibleTable(data);

    // SNAP chart
    renderSnap(data);

    // Scroll reveal
    initScrollReveal();

    // Responsive
    window.addEventListener('resize', handleResize);

    // Live data: BLS food prices (non-blocking, enhances dashboard if available)
    fetchBLSData();

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
      updateFreshness('bls', { _cached: true, _cachedAt: data.fetchedAt });
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

// Start when DOM ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
