/**
 * @fileoverview Food Access & Deserts Dashboard — ECharts visualizations
 * @description Interactive charts: food desert map, urban vs rural, distance,
 *              vehicle access scatter, low-income/low-access overlap.
 */

import {
  echarts, COLORS, TOOLTIP_STYLE,
  fmtNum, animateCounters, createChart,
  initScrollReveal, handleResize
} from './shared/dashboard-utils.js';

// -- Chart 1: Food Desert Map (choropleth) --
function renderDesertMap(geoJSON, states) {
  const chart = createChart('chart-desert-map');
  if (!chart) return;

  const albersProjection = { project: p => p, unproject: p => p };
  echarts.registerMap('USA-access', geoJSON);

  const mapData = states.map(s => ({
    name: s.name, value: s.lowAccessPct,
    population: s.population, lowIncomeLowAccessPop: s.lowIncomeLowAccessPop,
    avgDistance: s.avgDistance, noVehiclePct: s.noVehiclePct
  }));

  chart.setOption({
    tooltip: {
      trigger: 'item', ...TOOLTIP_STYLE,
      formatter: params => {
        const d = params.data;
        if (!d) return '';
        return `<strong style="font-size:14px">${d.name}</strong><br/>
          <span style="color:${COLORS.secondary}">Low-Access Tracts:</span> ${d.value}%<br/>
          Population: ${fmtNum(d.population)}<br/>
          Low-Income + Low-Access: ${fmtNum(d.lowIncomeLowAccessPop)}<br/>
          Avg Distance: ${d.avgDistance} mi<br/>
          No Vehicle: ${d.noVehiclePct}%`;
      }
    },
    visualMap: {
      left: 'right', bottom: 20, min: 7, max: 24,
      text: ['More Deserts', 'Fewer Deserts'], calculable: true,
      inRange: { color: [COLORS.mapLow, COLORS.mapMid, COLORS.mapHigh] },
      textStyle: { color: COLORS.text }
    },
    series: [{
      name: 'Food Desert Rate', type: 'map', map: 'USA-access', roam: false,
      projection: albersProjection, aspectScale: 1, zoom: 1.1, top: 10, left: 'center',
      emphasis: {
        label: { show: true, color: COLORS.text, fontSize: 12, fontWeight: 'bold' },
        itemStyle: { areaColor: COLORS.secondary, borderColor: '#fff', borderWidth: 1.5 }
      },
      itemStyle: { borderColor: 'rgba(255,255,255,0.25)', borderWidth: 0.8, areaColor: 'rgba(255,255,255,0.08)' },
      label: { show: false }, data: mapData, animationDurationUpdate: 500
    }]
  }, true);
}

// -- Chart 2: Urban vs Rural (stacked bar) --
function renderUrbanRural(states) {
  const chart = createChart('chart-urban-rural');
  if (!chart) return;

  // Top 15 by total low-access tracts
  const sorted = [...states]
    .sort((a, b) => (b.urbanLowAccess + b.ruralLowAccess) - (a.urbanLowAccess + a.ruralLowAccess))
    .slice(0, 15);
  const names = sorted.map(s => s.name);
  const urban = sorted.map(s => s.urbanLowAccess);
  const rural = sorted.map(s => s.ruralLowAccess);

  chart.setOption({
    tooltip: {
      trigger: 'axis', ...TOOLTIP_STYLE,
      formatter: params => {
        let tip = `<strong>${params[0].name}</strong><br/>`;
        params.forEach(p => { tip += `${p.marker} ${p.seriesName}: <strong>${p.value}</strong> tracts<br/>`; });
        const total = params.reduce((s, p) => s + p.value, 0);
        tip += `Total: <strong>${total}</strong> tracts`;
        return tip;
      }
    },
    legend: {
      data: ['Urban Low-Access', 'Rural Low-Access'],
      textStyle: { color: COLORS.text }, top: 5
    },
    grid: { left: 120, right: 20, top: 40, bottom: 30 },
    xAxis: {
      type: 'value',
      axisLabel: { color: COLORS.textMuted },
      splitLine: { lineStyle: { color: COLORS.gridLine } }
    },
    yAxis: {
      type: 'category', data: names.reverse(),
      axisLabel: { color: COLORS.text, fontSize: 11 },
      axisLine: { lineStyle: { color: COLORS.gridLine } }
    },
    series: [
      {
        name: 'Urban Low-Access', type: 'bar', stack: 'total',
        data: urban.reverse(), barWidth: '55%',
        itemStyle: { color: COLORS.primary, borderRadius: [0, 0, 0, 0] },
        animationDuration: 1500
      },
      {
        name: 'Rural Low-Access', type: 'bar', stack: 'total',
        data: rural.reverse(), barWidth: '55%',
        itemStyle: { color: COLORS.accent, borderRadius: [0, 4, 4, 0] },
        animationDuration: 1500, animationDelay: 200
      }
    ]
  });
}

// -- Chart 3: Distance to Nearest Supermarket (bar) --
function renderDistance(states) {
  const chart = createChart('chart-distance');
  if (!chart) return;

  const sorted = [...states].sort((a, b) => b.avgDistance - a.avgDistance).slice(0, 15);
  const names = sorted.map(s => s.name);
  const distances = sorted.map(s => s.avgDistance);

  chart.setOption({
    tooltip: {
      trigger: 'axis', axisPointer: { type: 'shadow' }, ...TOOLTIP_STYLE,
      formatter: params => `<strong>${params[0].name}</strong><br/>Avg Distance: <strong>${params[0].value} miles</strong>`
    },
    grid: { left: 130, right: 30, top: 10, bottom: 30 },
    xAxis: {
      type: 'value', name: 'Miles',
      nameTextStyle: { color: COLORS.textMuted },
      axisLabel: { color: COLORS.textMuted },
      splitLine: { lineStyle: { color: COLORS.gridLine } }
    },
    yAxis: {
      type: 'category', data: names.reverse(),
      axisLabel: { color: COLORS.text, fontSize: 11 },
      axisLine: { lineStyle: { color: COLORS.gridLine } }
    },
    series: [{
      type: 'bar', data: distances.reverse(), barWidth: '55%',
      markLine: {
        symbol: 'none',
        data: [
          { xAxis: 1, label: { formatter: 'Urban threshold (1mi)', color: COLORS.secondary, fontSize: 10 }, lineStyle: { color: COLORS.secondary, type: 'dashed' } },
        ]
      },
      itemStyle: {
        borderRadius: [0, 4, 4, 0],
        color: (params) => {
          if (params.value > 4) return COLORS.mapHigh;
          if (params.value > 2) return COLORS.mapMid;
          return COLORS.mapLow;
        }
      },
      animationDuration: 1500, animationDelay: (idx) => idx * 80
    }]
  });
}

// -- Chart 4: Vehicle Access & Food Deserts (scatter) --
function renderVehicle(states) {
  const chart = createChart('chart-vehicle');
  if (!chart) return;

  const points = states.map(s => ({
    value: [s.noVehiclePct, s.lowAccessPct],
    name: s.name, population: s.population
  }));

  chart.setOption({
    tooltip: {
      ...TOOLTIP_STYLE,
      formatter: params => {
        const d = params.data;
        return `<strong>${d.name}</strong><br/>No Vehicle: ${d.value[0]}%<br/>Food Deserts: ${d.value[1]}%<br/>Population: ${fmtNum(d.population)}`;
      }
    },
    grid: { left: 55, right: 20, top: 20, bottom: 50 },
    xAxis: {
      name: 'Households Without Vehicle (%)', nameLocation: 'center', nameGap: 35,
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
    series: [{
      type: 'scatter', data: points,
      symbolSize: (val) => {
        const p = points.find(pt => pt.value[0] === val[0] && pt.value[1] === val[1]);
        return p ? Math.max(8, Math.sqrt(p.population / 200000)) : 10;
      },
      itemStyle: { color: COLORS.secondary, opacity: 0.75 },
      emphasis: { itemStyle: { color: COLORS.accent, opacity: 1 } },
      animationDuration: 2000
    }]
  });
}

// -- Chart 5: Low-Income + Low-Access Overlap (bar) --
function renderDoubleBurden(states) {
  const chart = createChart('chart-double-burden');
  if (!chart) return;

  const sorted = [...states].sort((a, b) => b.lowIncomeLowAccessPop - a.lowIncomeLowAccessPop).slice(0, 15);
  const names = sorted.map(s => s.name);
  const pops = sorted.map(s => s.lowIncomeLowAccessPop);

  chart.setOption({
    tooltip: {
      trigger: 'axis', axisPointer: { type: 'shadow' }, ...TOOLTIP_STYLE,
      formatter: params => {
        const idx = params[0].dataIndex;
        const s = sorted[sorted.length - 1 - idx];
        const pct = ((s.lowIncomeLowAccessPop / s.population) * 100).toFixed(1);
        return `<strong>${s.name}</strong><br/>Low-Income + Low-Access: <strong>${fmtNum(s.lowIncomeLowAccessPop)}</strong><br/>Share of Population: ${pct}%`;
      }
    },
    grid: { left: 120, right: 30, top: 10, bottom: 30 },
    xAxis: {
      type: 'value',
      axisLabel: { color: COLORS.textMuted, formatter: val => fmtNum(val) },
      splitLine: { lineStyle: { color: COLORS.gridLine } }
    },
    yAxis: {
      type: 'category', data: names.reverse(),
      axisLabel: { color: COLORS.text, fontSize: 11 },
      axisLine: { lineStyle: { color: COLORS.gridLine } }
    },
    series: [{
      type: 'bar', data: pops.reverse(), barWidth: '55%',
      itemStyle: {
        borderRadius: [0, 4, 4, 0],
        color: new echarts.graphic.LinearGradient(0, 0, 1, 0, [
          { offset: 0, color: COLORS.mapMid }, { offset: 1, color: COLORS.mapHigh }
        ])
      },
      animationDuration: 1500, animationDelay: (idx) => idx * 80
    }]
  });
}

// -- Init --
async function init() {
  try {
    const [accessRes, geoRes] = await Promise.all([
      fetch('/data/food-access-atlas.json'),
      fetch('/data/us-states-geo.json')
    ]);
    if (!accessRes.ok || !geoRes.ok) throw new Error('Failed to load data');
    const [accessData, geoJSON] = await Promise.all([accessRes.json(), geoRes.json()]);

    animateCounters();
    renderDesertMap(geoJSON, accessData.states);
    renderUrbanRural(accessData.states);
    renderDistance(accessData.states);
    renderVehicle(accessData.states);
    renderDoubleBurden(accessData.states);
    initScrollReveal();
    window.addEventListener('resize', handleResize);
  } catch {
    document.querySelectorAll('.dashboard-chart').forEach(el => {
      el.innerHTML = '<p style="color: rgba(255,255,255,0.5); text-align: center; padding: 2rem;">Unable to load dashboard data. Please refresh the page.</p>';
    });
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
