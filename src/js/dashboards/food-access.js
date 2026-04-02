/**
 * @fileoverview Food Access & Deserts Dashboard — ECharts visualizations
 * @description Interactive charts: food desert map, urban vs rural, distance,
 *              vehicle access scatter, low-income/low-access overlap.
 */

import {
  echarts, COLORS, TOOLTIP_STYLE,
  fmtNum, animateCounters, createChart,
  initScrollReveal, handleResize,
  REGIONS, REGION_COLORS, getRegion
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

// -- Chart 2: Urban vs Rural (Donut) --
function renderUrbanRural(states) {
  const chart = createChart('chart-urban-rural');
  if (!chart) return;

  const totalUrban = states.reduce((s, st) => s + st.urbanLowAccess, 0);
  const totalRural = states.reduce((s, st) => s + st.ruralLowAccess, 0);

  chart.setOption({
    tooltip: { ...TOOLTIP_STYLE, formatter: p => `${p.name}: <strong>${fmtNum(p.value)}</strong> tracts (${p.percent.toFixed(1)}%)` },
    legend: { data: ['Urban Low-Access', 'Rural Low-Access'], textStyle: { color: COLORS.text }, bottom: 0 },
    series: [{
      type: 'pie', radius: ['40%', '70%'], center: ['50%', '45%'],
      label: { show: true, color: COLORS.text, formatter: '{b}\n{d}%', fontSize: 12 },
      itemStyle: { borderRadius: 6, borderColor: 'rgba(0,0,0,0.4)', borderWidth: 2 },
      data: [
        { name: 'Urban Low-Access', value: totalUrban, itemStyle: { color: COLORS.primary } },
        { name: 'Rural Low-Access', value: totalRural, itemStyle: { color: COLORS.accent } }
      ],
      emphasis: { itemStyle: { shadowBlur: 20, shadowColor: 'rgba(0,212,255,0.3)' } },
      animationType: 'scale', animationDuration: 2000
    }]
  });
}

// -- Chart 3: Distance to Store (Gradient Area) --
function renderDistance(states) {
  const chart = createChart('chart-distance');
  if (!chart) return;

  const sorted = [...states].sort((a, b) => a.avgDistance - b.avgDistance);
  const names = sorted.map(s => s.name);
  const distances = sorted.map(s => s.avgDistance);

  chart.setOption({
    tooltip: { trigger: 'axis', ...TOOLTIP_STYLE, formatter: p => `<strong>${p[0].name}</strong><br/>Avg Distance: <strong>${p[0].value} mi</strong>` },
    grid: { left: 50, right: 20, top: 20, bottom: 40 },
    xAxis: { type: 'category', data: names, axisLabel: { color: COLORS.textMuted, rotate: 60, fontSize: 8 }, axisLine: { lineStyle: { color: COLORS.gridLine } } },
    yAxis: { type: 'value', name: 'Miles', nameTextStyle: { color: COLORS.textMuted }, axisLabel: { color: COLORS.textMuted }, splitLine: { lineStyle: { color: COLORS.gridLine } } },
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
      markLine: { symbol: 'none', data: [{ yAxis: 1, label: { formatter: 'Urban threshold (1mi)', color: COLORS.secondary, fontSize: 10 }, lineStyle: { color: COLORS.secondary, type: 'dashed' } }] },
      animationDuration: 2000
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

// -- Chart 5: Low-Income + Low-Access (Treemap) --
function renderDoubleBurden(states) {
  const chart = createChart('chart-double-burden');
  if (!chart) return;

  const regionData = Object.entries(REGIONS).map(([region, stateNames]) => {
    const children = states
      .filter(s => stateNames.includes(s.name))
      .map(s => ({ name: s.name, value: s.lowIncomeLowAccessPop, pctOfPop: ((s.lowIncomeLowAccessPop / s.population) * 100).toFixed(1) }))
      .sort((a, b) => b.value - a.value);
    return { name: region, children, itemStyle: { borderColor: REGION_COLORS[region] } };
  });

  chart.setOption({
    tooltip: {
      ...TOOLTIP_STYLE,
      formatter: p => {
        if (p.data.children) return `<strong>${p.name}</strong><br/>Total: ${fmtNum(p.value)}`;
        return `<strong>${p.name}</strong><br/>Low-Income + Low-Access: <strong>${fmtNum(p.value)}</strong><br/>${p.data.pctOfPop}% of state population`;
      }
    },
    series: [{
      type: 'treemap', data: regionData, leafDepth: 1, roam: false,
      width: '95%', height: '90%', top: 10,
      label: { show: true, formatter: '{b}', fontSize: 10, color: '#fff' },
      upperLabel: { show: true, height: 24, color: '#fff', fontSize: 12, fontWeight: 'bold', backgroundColor: 'transparent' },
      itemStyle: { borderColor: 'rgba(0,0,0,0.5)', borderWidth: 1, gapWidth: 2 },
      levels: [
        { itemStyle: { borderColor: 'rgba(255,255,255,0.2)', borderWidth: 3, gapWidth: 3 }, upperLabel: { show: true } },
        { colorSaturation: [0.3, 0.7], itemStyle: { borderColorSaturation: 0.5, gapWidth: 1, borderWidth: 1 } }
      ],
      colorMappingBy: 'value', visualMin: 30000, visualMax: 1700000,
      color: [COLORS.mapLow, COLORS.mapMid, COLORS.mapHigh],
      animationDuration: 1500
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
