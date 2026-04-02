/**
 * @fileoverview Food Bank Landscape Dashboard — ECharts visualizations
 * @description Interactive charts: density map, resources vs need scatter,
 *              revenue bar, program efficiency, distribution vs need.
 */

import {
  echarts, COLORS, TOOLTIP_STYLE,
  fmtNum, animateCounters, createChart,
  initScrollReveal, handleResize,
  REGIONS, REGION_COLORS, getRegion
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

// -- Chart 3: Revenue by State (Treemap) --
function renderRevenue(states) {
  const chart = createChart('chart-revenue');
  if (!chart) return;

  const regionData = Object.entries(REGIONS).map(([region, stateNames]) => {
    const children = states
      .filter(s => stateNames.includes(s.name))
      .map(s => ({ name: s.name, value: s.totalRevenue, efficiency: s.programExpenseRatio, orgCount: s.orgCount }))
      .sort((a, b) => b.value - a.value);
    return { name: region, children, itemStyle: { borderColor: REGION_COLORS[region] } };
  });

  chart.setOption({
    tooltip: {
      ...TOOLTIP_STYLE,
      formatter: p => {
        if (p.data.children) return `<strong>${p.name}</strong><br/>Total Revenue: $${fmtNum(p.value)}`;
        return `<strong>${p.name}</strong><br/>Revenue: <strong>$${fmtNum(p.value)}</strong><br/>Efficiency: ${p.data.efficiency}%<br/>Organizations: ${fmtNum(p.data.orgCount)}`;
      }
    },
    series: [{
      type: 'treemap', data: regionData, leafDepth: 1, roam: false,
      width: '95%', height: '90%', top: 10,
      label: { show: true, formatter: p => p.data.children ? '' : `${p.name}\n$${fmtNum(p.value)}`, fontSize: 9, color: '#fff' },
      upperLabel: { show: true, height: 24, color: '#fff', fontSize: 12, fontWeight: 'bold', backgroundColor: 'transparent' },
      itemStyle: { borderColor: 'rgba(0,0,0,0.5)', borderWidth: 1, gapWidth: 2 },
      levels: [
        { itemStyle: { borderColor: 'rgba(255,255,255,0.2)', borderWidth: 3, gapWidth: 3 }, upperLabel: { show: true } },
        { colorSaturation: [0.3, 0.7], itemStyle: { borderColorSaturation: 0.5, gapWidth: 1, borderWidth: 1 } }
      ],
      color: [COLORS.primary, COLORS.secondary, '#a78bfa', '#34d399', COLORS.accent],
      animationDuration: 1500
    }]
  });
}

// -- Chart 4: Regional Comparison (Radar) --
function renderEfficiency(states) {
  const chart = createChart('chart-efficiency');
  if (!chart) return;

  const regionAvgs = Object.entries(REGIONS).map(([region, stateNames]) => {
    const rs = states.filter(s => stateNames.includes(s.name));
    const n = rs.length;
    return {
      name: region,
      efficiency: (rs.reduce((s, st) => s + st.programExpenseRatio, 0) / n).toFixed(1),
      density: (rs.reduce((s, st) => s + st.perCapitaOrgs, 0) / n).toFixed(1),
      avgRevPerOrg: (rs.reduce((s, st) => s + st.totalRevenue / st.orgCount, 0) / n / 1000000).toFixed(2),
      insecurity: (rs.reduce((s, st) => s + st.foodInsecurityRate, 0) / n).toFixed(1),
      orgCount: Math.round(rs.reduce((s, st) => s + st.orgCount, 0) / n)
    };
  });

  chart.setOption({
    tooltip: { ...TOOLTIP_STYLE },
    legend: { data: regionAvgs.map(r => r.name), textStyle: { color: COLORS.text }, bottom: 0 },
    radar: {
      indicator: [
        { name: 'Efficiency (%)', max: 90 }, { name: 'Density\n(per 100K)', max: 22 },
        { name: 'Avg Rev/Org\n($M)', max: 1.5 }, { name: 'Insecurity (%)', max: 18 },
        { name: 'Avg Org Count', max: 2000 }
      ],
      shape: 'polygon', splitNumber: 4,
      axisName: { color: COLORS.text, fontSize: 10 },
      splitLine: { lineStyle: { color: COLORS.gridLine } },
      splitArea: { areaStyle: { color: ['rgba(0,212,255,0.02)', 'rgba(0,212,255,0.05)'] } },
      axisLine: { lineStyle: { color: COLORS.gridLine } }
    },
    series: [{
      type: 'radar',
      data: regionAvgs.map(r => ({
        name: r.name,
        value: [r.efficiency, r.density, r.avgRevPerOrg, r.insecurity, r.orgCount],
        areaStyle: { color: REGION_COLORS[r.name].replace(')', ',0.2)').replace('rgb', 'rgba') },
        lineStyle: { color: REGION_COLORS[r.name], width: 2 },
        itemStyle: { color: REGION_COLORS[r.name] }
      }))
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
