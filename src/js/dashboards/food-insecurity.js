/**
 * @fileoverview Food Insecurity Dashboard — ECharts visualizations
 * @description Interactive dashboard with choropleth map, trend line, bar chart,
 *              scatter plot, and meal cost comparison. Tree-shaken ECharts imports.
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

// -- Theme colors matching FNF design tokens --
const COLORS = {
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

// Chart instances for cleanup
const charts = [];

// Format large numbers
function fmtNum(n) {
  if (n >= 1e9) return (n / 1e9).toFixed(1) + 'B';
  if (n >= 1e6) return (n / 1e6).toFixed(1) + 'M';
  if (n >= 1e3) return (n / 1e3).toFixed(0) + 'K';
  return n.toLocaleString();
}

// -- Animated hero counters --
function animateCounters() {
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
function createChart(containerId) {
  const container = document.getElementById(containerId);
  if (!container) return null;
  const chart = echarts.init(container, null, { renderer: 'canvas' });
  charts.push(chart);
  return chart;
}

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
        backgroundColor: 'rgba(10,10,30,0.92)',
        borderColor: COLORS.secondary,
        borderWidth: 1,
        textStyle: { color: COLORS.text, fontSize: 13 },
        formatter: stateTooltip
      },
      visualMap: {
        left: 'right',
        bottom: 20,
        min: cfg.min,
        max: cfg.max,
        text: ['High', 'Low'],
        calculable: true,
        inRange: { color: [COLORS.mapLow, COLORS.mapMid, COLORS.mapHigh] },
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
          borderColor: 'rgba(255,255,255,0.25)',
          borderWidth: 0.8,
          areaColor: 'rgba(255,255,255,0.08)'
        },
        label: { show: false },
        data: mapData,
        animationDurationUpdate: 500
      }]
    }, true); // true = not merge, replace
  }

  // Drill down into a state's counties
  async function drillDown(stateName, stateFips) {
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
          backgroundColor: 'rgba(10,10,30,0.92)',
          borderColor: COLORS.secondary,
          borderWidth: 1,
          textStyle: { color: COLORS.text, fontSize: 13 },
          formatter: countyTooltip
        },
        visualMap: {
          min,
          max,
          text: ['High', 'Low'],
          calculable: true,
          inRange: { color: [COLORS.mapLow, COLORS.mapMid, COLORS.mapHigh] },
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
            borderColor: 'rgba(255,255,255,0.15)',
            borderWidth: 0.5,
            areaColor: 'rgba(255,255,255,0.05)'
          },
          label: { show: false },
          data: countyData,
          animationDurationUpdate: 500
        }]
      }, true);
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
        input.value = `${li.dataset.county}, ${sName}`;
        resultsList.setAttribute('data-visible', 'false');
        if (mapController) mapController.drillDown(sName, sFips);
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
      backgroundColor: 'rgba(10,10,30,0.92)',
      borderColor: COLORS.secondary,
      borderWidth: 1,
      textStyle: { color: COLORS.text }
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

// -- Top 10 Bar Chart --
function renderBar(data) {
  const chart = createChart('chart-bar');
  if (!chart) return;

  const sorted = [...data.states].sort((a, b) => b.rate - a.rate).slice(0, 10);
  const names = sorted.map(s => s.name);
  const rates = sorted.map(s => s.rate);

  chart.setOption({
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
      backgroundColor: 'rgba(10,10,30,0.92)',
      borderColor: COLORS.secondary,
      borderWidth: 1,
      textStyle: { color: COLORS.text },
      formatter: params => {
        const d = params[0];
        return `<strong>${d.name}</strong><br/>Rate: ${d.value}%`;
      }
    },
    grid: { left: 130, right: 20, top: 10, bottom: 30 },
    xAxis: {
      type: 'value',
      axisLabel: { color: COLORS.textMuted, formatter: '{value}%' },
      splitLine: { lineStyle: { color: COLORS.gridLine } }
    },
    yAxis: {
      type: 'category',
      data: names.reverse(),
      axisLabel: { color: COLORS.text, fontSize: 11 },
      axisLine: { lineStyle: { color: COLORS.gridLine } }
    },
    series: [{
      type: 'bar',
      data: rates.reverse(),
      barWidth: '60%',
      itemStyle: {
        borderRadius: [0, 4, 4, 0],
        color: new echarts.graphic.LinearGradient(0, 0, 1, 0, [
          { offset: 0, color: COLORS.mapMid },
          { offset: 1, color: COLORS.mapHigh }
        ])
      },
      animationDuration: 1500,
      animationDelay: (idx) => idx * 100
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
      backgroundColor: 'rgba(10,10,30,0.92)',
      borderColor: COLORS.secondary,
      borderWidth: 1,
      textStyle: { color: COLORS.text },
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
      animationDuration: 2000
    }]
  });
}

// -- Meal Cost Bar Chart --
function renderMealCost(data) {
  const chart = createChart('chart-meal-cost');
  if (!chart) return;

  const sorted = [...data.states].sort((a, b) => b.mealCost - a.mealCost).slice(0, 10);
  const names = sorted.map(s => s.name);
  const costs = sorted.map(s => s.mealCost);

  chart.setOption({
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
      backgroundColor: 'rgba(10,10,30,0.92)',
      borderColor: COLORS.secondary,
      borderWidth: 1,
      textStyle: { color: COLORS.text },
      formatter: params => `<strong>${params[0].name}</strong><br/>$${params[0].value.toFixed(2)} per meal`
    },
    grid: { left: 130, right: 20, top: 10, bottom: 30 },
    xAxis: {
      type: 'value',
      axisLabel: { color: COLORS.textMuted, formatter: '${value}' },
      splitLine: { lineStyle: { color: COLORS.gridLine } }
    },
    yAxis: {
      type: 'category',
      data: names.reverse(),
      axisLabel: { color: COLORS.text, fontSize: 11 },
      axisLine: { lineStyle: { color: COLORS.gridLine } }
    },
    series: [{
      type: 'bar',
      data: costs.reverse(),
      barWidth: '60%',
      itemStyle: {
        borderRadius: [0, 4, 4, 0],
        color: new echarts.graphic.LinearGradient(0, 0, 1, 0, [
          { offset: 0, color: COLORS.primary },
          { offset: 1, color: COLORS.secondary }
        ])
      },
      animationDuration: 1500,
      animationDelay: (idx) => idx * 100
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
      backgroundColor: 'rgba(10,10,30,0.92)',
      borderColor: COLORS.secondary,
      borderWidth: 1,
      textStyle: { color: COLORS.text }
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
            { offset: 0, color: COLORS.mapMid },
            { offset: 1, color: COLORS.mapHigh }
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

// -- Scroll Reveal (IntersectionObserver) --
function initScrollReveal() {
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
function handleResize() {
  charts.forEach(c => c.resize());
}

// -- Init --
async function init() {
  try {
    // Load data in parallel
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
  } catch (err) {
    // Show error in chart containers
    document.querySelectorAll('.dashboard-chart').forEach(el => {
      el.innerHTML = '<p style="color: rgba(255,255,255,0.5); text-align: center; padding: 2rem;">Unable to load dashboard data. Please refresh the page.</p>';
    });
  }
}

// Start when DOM ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
