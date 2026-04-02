/**
 * @fileoverview Food Bank Landscape Dashboard — ECharts visualizations
 * @description Interactive charts: density map, resources vs need scatter,
 *              revenue bar, program efficiency, distribution vs need.
 */

import {
  echarts, COLORS, TOOLTIP_STYLE,
  fmtNum, animateCounters, createChart,
  initScrollReveal, handleResize
} from './shared/dashboard-utils.js';

// -- Chart 1: Food Bank Density Map (choropleth) --
function renderDensityMap(geoJSON, states) {
  const chart = createChart('chart-density-map');
  if (!chart) return;

  const albersProjection = { project: p => p, unproject: p => p };
  echarts.registerMap('USA-banks', geoJSON);

  const mapData = states.map(s => ({
    name: s.name, value: s.perCapitaOrgs,
    orgCount: s.orgCount, totalRevenue: s.totalRevenue,
    foodInsecurityRate: s.foodInsecurityRate, population: s.population
  }));

  chart.setOption({
    tooltip: {
      trigger: 'item', ...TOOLTIP_STYLE,
      formatter: params => {
        const d = params.data;
        if (!d) return '';
        return `<strong style="font-size:14px">${d.name}</strong><br/>
          <span style="color:${COLORS.secondary}">Density:</span> ${d.value.toFixed(1)} orgs per 100K<br/>
          Total Orgs: ${fmtNum(d.orgCount)}<br/>
          Revenue: $${fmtNum(d.totalRevenue)}<br/>
          Food Insecurity: ${d.foodInsecurityRate}%`;
      }
    },
    visualMap: {
      left: 'right', bottom: 20, min: 11, max: 28,
      text: ['Higher Density', 'Lower Density'], calculable: true,
      inRange: { color: [COLORS.mapHigh, COLORS.mapMid, COLORS.mapLow] },
      textStyle: { color: COLORS.text }
    },
    series: [{
      name: 'Food Bank Density', type: 'map', map: 'USA-banks', roam: false,
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

// -- Chart 2: Food Banks vs Food Insecurity (scatter) --
function renderVsInsecurity(states) {
  const chart = createChart('chart-vs-insecurity');
  if (!chart) return;

  const points = states.map(s => ({
    value: [s.foodInsecurityRate, s.perCapitaOrgs],
    name: s.name, totalRevenue: s.totalRevenue
  }));

  chart.setOption({
    tooltip: {
      ...TOOLTIP_STYLE,
      formatter: params => {
        const d = params.data;
        return `<strong>${d.name}</strong><br/>Food Insecurity: ${d.value[0]}%<br/>Density: ${d.value[1].toFixed(1)} per 100K<br/>Revenue: $${fmtNum(d.totalRevenue)}`;
      }
    },
    grid: { left: 60, right: 20, top: 20, bottom: 50 },
    xAxis: {
      name: 'Food Insecurity Rate (%)', nameLocation: 'center', nameGap: 35,
      nameTextStyle: { color: COLORS.textMuted },
      axisLabel: { color: COLORS.textMuted, formatter: '{value}%' },
      splitLine: { lineStyle: { color: COLORS.gridLine } }
    },
    yAxis: {
      name: 'Orgs per 100K',
      nameTextStyle: { color: COLORS.textMuted },
      axisLabel: { color: COLORS.textMuted },
      splitLine: { lineStyle: { color: COLORS.gridLine } }
    },
    series: [{
      type: 'scatter', data: points,
      symbolSize: (val) => {
        const p = points.find(pt => pt.value[0] === val[0] && pt.value[1] === val[1]);
        return p ? Math.max(8, Math.sqrt(p.totalRevenue / 10000000)) : 10;
      },
      itemStyle: { color: COLORS.secondary, opacity: 0.75 },
      emphasis: { itemStyle: { color: COLORS.accent, opacity: 1 } },
      animationDuration: 2000
    }]
  });
}

// -- Chart 3: Revenue by State (bar) --
function renderRevenue(states) {
  const chart = createChart('chart-revenue');
  if (!chart) return;

  const sorted = [...states].sort((a, b) => b.totalRevenue - a.totalRevenue).slice(0, 15);
  const names = sorted.map(s => s.name);
  const revenues = sorted.map(s => s.totalRevenue);

  chart.setOption({
    tooltip: {
      trigger: 'axis', axisPointer: { type: 'shadow' }, ...TOOLTIP_STYLE,
      formatter: params => {
        const idx = params[0].dataIndex;
        const s = sorted[sorted.length - 1 - idx];
        return `<strong>${s.name}</strong><br/>Revenue: <strong>$${fmtNum(s.totalRevenue)}</strong><br/>Organizations: ${fmtNum(s.orgCount)}<br/>Efficiency: ${s.programExpenseRatio}%`;
      }
    },
    grid: { left: 120, right: 30, top: 10, bottom: 30 },
    xAxis: {
      type: 'value',
      axisLabel: { color: COLORS.textMuted, formatter: val => '$' + fmtNum(val) },
      splitLine: { lineStyle: { color: COLORS.gridLine } }
    },
    yAxis: {
      type: 'category', data: names.reverse(),
      axisLabel: { color: COLORS.text, fontSize: 11 },
      axisLine: { lineStyle: { color: COLORS.gridLine } }
    },
    series: [{
      type: 'bar', data: revenues.reverse(), barWidth: '55%',
      itemStyle: {
        borderRadius: [0, 4, 4, 0],
        color: new echarts.graphic.LinearGradient(0, 0, 1, 0, [
          { offset: 0, color: COLORS.primary }, { offset: 1, color: COLORS.secondary }
        ])
      },
      animationDuration: 1500, animationDelay: (idx) => idx * 80
    }]
  });
}

// -- Chart 4: Program Efficiency (horizontal bar) --
function renderEfficiency(states) {
  const chart = createChart('chart-efficiency');
  if (!chart) return;

  // Show all states sorted by efficiency, top 20
  const sorted = [...states].sort((a, b) => b.programExpenseRatio - a.programExpenseRatio).slice(0, 20);
  const names = sorted.map(s => s.name);
  const ratios = sorted.map(s => s.programExpenseRatio);
  const nationalAvg = 82.4;

  chart.setOption({
    tooltip: {
      trigger: 'axis', axisPointer: { type: 'shadow' }, ...TOOLTIP_STYLE,
      formatter: params => `<strong>${params[0].name}</strong><br/>Program Efficiency: <strong>${params[0].value}%</strong>`
    },
    grid: { left: 130, right: 30, top: 10, bottom: 30 },
    xAxis: {
      type: 'value', min: 78, max: 88,
      axisLabel: { color: COLORS.textMuted, formatter: '{value}%' },
      splitLine: { lineStyle: { color: COLORS.gridLine } }
    },
    yAxis: {
      type: 'category', data: names.reverse(),
      axisLabel: { color: COLORS.text, fontSize: 10 },
      axisLine: { lineStyle: { color: COLORS.gridLine } }
    },
    series: [{
      type: 'bar', data: ratios.reverse(), barWidth: '50%',
      markLine: {
        symbol: 'none',
        data: [{ xAxis: nationalAvg, label: { formatter: `Avg: ${nationalAvg}%`, color: COLORS.secondary, fontSize: 10 }, lineStyle: { color: COLORS.secondary, type: 'dashed' } }]
      },
      itemStyle: {
        borderRadius: [0, 4, 4, 0],
        color: (params) => {
          if (params.value >= 85) return COLORS.mapLow;
          if (params.value >= 82) return COLORS.mapMid;
          return COLORS.mapHigh;
        }
      },
      animationDuration: 1500, animationDelay: (idx) => idx * 60
    }]
  });
}

// -- Chart 5: Distribution vs Need (paired bar) --
function renderDistribution(states) {
  const chart = createChart('chart-distribution');
  if (!chart) return;

  // Top 15 by food insecurity
  const sorted = [...states].sort((a, b) => b.foodInsecurityRate - a.foodInsecurityRate).slice(0, 15);
  const names = sorted.map(s => s.name);
  const rates = sorted.map(s => s.foodInsecurityRate);
  const density = sorted.map(s => s.perCapitaOrgs);

  chart.setOption({
    tooltip: {
      trigger: 'axis', ...TOOLTIP_STYLE,
      formatter: params => {
        let tip = `<strong>${params[0].name}</strong><br/>`;
        params.forEach(p => {
          const unit = p.seriesName.includes('Insecurity') ? '%' : ' per 100K';
          tip += `${p.marker} ${p.seriesName}: <strong>${p.value}${unit}</strong><br/>`;
        });
        return tip;
      }
    },
    legend: {
      data: ['Food Insecurity Rate', 'Food Bank Density'],
      textStyle: { color: COLORS.text }, top: 5
    },
    grid: { left: 120, right: 30, top: 40, bottom: 30 },
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
        name: 'Food Insecurity Rate', type: 'bar',
        data: rates.reverse(), barWidth: '35%',
        itemStyle: {
          borderRadius: [0, 3, 3, 0],
          color: new echarts.graphic.LinearGradient(0, 0, 1, 0, [
            { offset: 0, color: COLORS.mapMid }, { offset: 1, color: COLORS.mapHigh }
          ])
        },
        animationDuration: 1500
      },
      {
        name: 'Food Bank Density', type: 'bar',
        data: density.reverse(), barWidth: '35%',
        itemStyle: {
          borderRadius: [0, 3, 3, 0],
          color: new echarts.graphic.LinearGradient(0, 0, 1, 0, [
            { offset: 0, color: COLORS.primary }, { offset: 1, color: COLORS.secondary }
          ])
        },
        animationDuration: 1500, animationDelay: 200
      }
    ]
  });
}

// -- Init --
async function init() {
  try {
    const [bankRes, geoRes] = await Promise.all([
      fetch('/data/food-bank-summary.json'),
      fetch('/data/us-states-geo.json')
    ]);
    if (!bankRes.ok || !geoRes.ok) throw new Error('Failed to load data');
    const [bankData, geoJSON] = await Promise.all([bankRes.json(), geoRes.json()]);

    animateCounters();
    renderDensityMap(geoJSON, bankData.states);
    renderVsInsecurity(bankData.states);
    renderRevenue(bankData.states);
    renderEfficiency(bankData.states);
    renderDistribution(bankData.states);
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
