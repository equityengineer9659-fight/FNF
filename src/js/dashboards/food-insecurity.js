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

// -- Map Chart --
function renderMap(geoJSON, data, metric = 'rate') {
  const chart = createChart('chart-map');
  if (!chart) return;

  // Albers USA projection: coordinates are pre-projected pixel values (975x610 viewport)
  // We must tell ECharts not to apply its own projection
  echarts.registerMap('USA', geoJSON);

  const metricConfig = {
    rate: { name: 'Food Insecurity Rate', suffix: '%', min: 8, max: 20 },
    childRate: { name: 'Child Food Insecurity', suffix: '%', min: 10, max: 27 },
    persons: { name: 'Food Insecure Persons', suffix: '', min: 0, max: 5000000 },
    mealGap: { name: 'Annual Meal Gap', suffix: '', min: 0, max: 900000000 },
    mealCost: { name: 'Average Meal Cost', suffix: '$', min: 3, max: 5.5 }
  };

  const cfg = metricConfig[metric];
  const mapData = data.states.map(s => ({ name: s.name, value: s[metric], ...s }));

  chart.setOption({
    tooltip: {
      trigger: 'item',
      backgroundColor: 'rgba(10,10,30,0.92)',
      borderColor: COLORS.secondary,
      borderWidth: 1,
      textStyle: { color: COLORS.text, fontSize: 13 },
      formatter: params => {
        const d = params.data;
        if (!d) return '';
        return `<strong style="font-size:14px">${d.name}</strong><br/>
          <span style="color:${COLORS.secondary}">Food Insecurity:</span> ${d.rate}%<br/>
          <span style="color:${COLORS.accent}">Child Rate:</span> ${d.childRate}%<br/>
          Persons: ${fmtNum(d.persons)}<br/>
          Meal Gap: ${fmtNum(d.mealGap)} meals/yr<br/>
          Avg Meal Cost: $${d.mealCost}<br/>
          Poverty Rate: ${d.povertyRate}%<br/>
          SNAP: ${fmtNum(d.snapParticipation)}`;
      }
    },
    visualMap: {
      left: 'right',
      bottom: 20,
      min: cfg.min,
      max: cfg.max,
      text: ['High', 'Low'],
      calculable: true,
      inRange: {
        color: [COLORS.mapLow, COLORS.mapMid, COLORS.mapHigh]
      },
      textStyle: { color: COLORS.text }
    },
    series: [{
      name: cfg.name,
      type: 'map',
      map: 'USA',
      roam: false,
      projection: {
        // Identity projection — data is already Albers-projected
        project: (point) => point,
        unproject: (point) => point
      },
      aspectScale: 1,
      zoom: 1.1,
      top: 10,
      left: 'center',
      emphasis: {
        label: {
          show: true,
          color: COLORS.text,
          fontSize: 12,
          fontWeight: 'bold'
        },
        itemStyle: {
          areaColor: COLORS.secondary,
          borderColor: '#fff',
          borderWidth: 1.5
        }
      },
      select: {
        label: { show: true, color: COLORS.text },
        itemStyle: { areaColor: COLORS.primary }
      },
      itemStyle: {
        borderColor: 'rgba(255,255,255,0.25)',
        borderWidth: 0.8,
        areaColor: 'rgba(255,255,255,0.08)'
      },
      label: { show: false },
      data: mapData
    }]
  });

  // Metric selector
  const select = document.getElementById('map-metric');
  if (select) {
    select.addEventListener('change', () => {
      const m = select.value;
      const c = metricConfig[m];
      const md = data.states.map(s => ({ name: s.name, value: s[m], ...s }));
      chart.setOption({
        visualMap: { min: c.min, max: c.max },
        series: [{ name: c.name, data: md }]
      });
    });
  }

  return chart;
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
    renderMap(geoJSON, data);
    renderTrend(data);
    renderBar(data);
    renderScatter(data);
    renderMealCost(data);

    // Accessible table
    populateAccessibleTable(data);

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
