/**
 * @fileoverview SNAP & Safety Net Dashboard — ECharts visualizations
 * @description Interactive charts: SNAP participation trend, coverage map,
 *              coverage gap, school lunch reach, benefits per person.
 */

import {
  echarts, COLORS, TOOLTIP_STYLE,
  fmtNum, animateCounters, createChart,
  initScrollReveal, handleResize
} from './shared/dashboard-utils.js';

// -- Chart 1: SNAP Trend with Policy Zones (Area) --
function renderSnapTrend(trendData) {
  const chart = createChart('chart-snap-trend');
  if (!chart) return;

  const dates = trendData.data.map(d => d.date);
  const values = trendData.data.map(d => d.value);

  chart.setOption({
    tooltip: { trigger: 'axis', ...TOOLTIP_STYLE, formatter: p => `<strong>${p[0].axisValue}</strong><br/>SNAP: <strong>${p[0].value}M</strong>` },
    grid: { left: 55, right: 20, top: 20, bottom: 60 },
    dataZoom: [{ type: 'inside', start: 0, end: 100 }, { type: 'slider', start: 0, end: 100, height: 20, bottom: 10, textStyle: { color: COLORS.textMuted }, borderColor: COLORS.gridLine, fillerColor: 'rgba(0,212,255,0.1)' }],
    xAxis: { type: 'category', data: dates, axisLabel: { color: COLORS.textMuted, rotate: 45, fontSize: 10 }, axisLine: { lineStyle: { color: COLORS.gridLine } } },
    yAxis: { type: 'value', name: 'Participants (M)', nameTextStyle: { color: COLORS.textMuted }, axisLabel: { color: COLORS.textMuted, formatter: '{value}M' }, splitLine: { lineStyle: { color: COLORS.gridLine } }, min: 34, max: 48 },
    series: [{
      type: 'line', data: values, smooth: true, symbol: 'none',
      lineStyle: { width: 3, color: COLORS.primary },
      areaStyle: { color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [{ offset: 0, color: 'rgba(1,118,211,0.4)' }, { offset: 1, color: 'rgba(1,118,211,0.02)' }]) },
      markArea: {
        silent: true,
        data: [
          [{ xAxis: '2020-03', itemStyle: { color: 'rgba(231,76,60,0.12)' }, label: { show: true, formatter: 'COVID Emergency\nAllotments', color: COLORS.mapHigh, fontSize: 9, position: 'insideTop' } }, { xAxis: '2023-03' }],
          [{ xAxis: '2023-03', itemStyle: { color: 'rgba(243,156,18,0.08)' }, label: { show: true, formatter: 'Post-Emergency', color: COLORS.mapMid, fontSize: 9, position: 'insideTop' } }, { xAxis: '2025-01' }]
        ]
      },
      animationDuration: 2000
    }]
  });
}

// -- Chart 2: State SNAP Coverage Map (choropleth) --
function renderSnapMap(geoJSON, states) {
  const chart = createChart('chart-snap-map');
  if (!chart) return;

  const albersProjection = { project: p => p, unproject: p => p };
  echarts.registerMap('USA-snap', geoJSON);

  const mapData = states.map(s => ({
    name: s.name,
    value: s.coverageRatio,
    snapParticipants: s.snapParticipants,
    foodInsecure: s.foodInsecure,
    insecurityRate: s.insecurityRate,
    snapRate: s.snapRate
  }));

  chart.setOption({
    tooltip: {
      trigger: 'item',
      ...TOOLTIP_STYLE,
      formatter: params => {
        const d = params.data;
        if (!d) return '';
        return `<strong style="font-size:14px">${d.name}</strong><br/>
          <span style="color:${COLORS.secondary}">Coverage Ratio:</span> ${d.value.toFixed(1)}%<br/>
          SNAP Participants: ${fmtNum(d.snapParticipants)}<br/>
          Food Insecure: ${fmtNum(d.foodInsecure)}<br/>
          Insecurity Rate: ${d.insecurityRate}%<br/>
          SNAP Rate: ${d.snapRate}%<br/>
          <span style="color:${COLORS.textMuted};font-size:11px">&gt;100% = SNAP exceeds insecure population</span>`;
      }
    },
    visualMap: {
      left: 'right', bottom: 20,
      min: 40, max: 135,
      text: ['Strong Coverage', 'Weak Coverage'],
      calculable: true,
      inRange: { color: [COLORS.mapHigh, COLORS.mapMid, COLORS.mapLow] },
      textStyle: { color: COLORS.text }
    },
    series: [{
      name: 'SNAP Coverage Ratio',
      type: 'map', map: 'USA-snap', roam: false,
      projection: albersProjection, aspectScale: 1, zoom: 1.1, top: 10, left: 'center',
      emphasis: {
        label: { show: true, color: COLORS.text, fontSize: 12, fontWeight: 'bold' },
        itemStyle: { areaColor: COLORS.secondary, borderColor: '#fff', borderWidth: 1.5 }
      },
      itemStyle: { borderColor: 'rgba(255,255,255,0.25)', borderWidth: 0.8, areaColor: 'rgba(255,255,255,0.08)' },
      label: { show: false },
      data: mapData,
      animationDurationUpdate: 500
    }]
  }, true);
}

// -- Chart 3: Safety Net Coverage Flow (Sankey) --
function renderCoverageGap(states) {
  const chart = createChart('chart-coverage-gap');
  if (!chart) return;

  const totalInsecure = 44200000;
  const snapCovered = 42100000;
  const schoolLunchCovered = 30000000;
  const overlap = 18000000;
  const snapOnly = snapCovered - overlap;
  const lunchOnly = schoolLunchCovered - overlap;
  const uncovered = Math.max(0, totalInsecure - snapOnly - lunchOnly - overlap);

  chart.setOption({
    tooltip: { ...TOOLTIP_STYLE, formatter: p => p.dataType === 'edge' ? `${p.data.source} → ${p.data.target}: <strong>${fmtNum(p.data.value)}</strong>` : `<strong>${p.name}</strong>: ${fmtNum(p.value)}` },
    series: [{
      type: 'sankey', layout: 'none', emphasis: { focus: 'adjacency' }, nodeAlign: 'left',
      lineStyle: { color: 'gradient', curveness: 0.5, opacity: 0.4 },
      label: { color: COLORS.text, fontSize: 12 }, itemStyle: { borderWidth: 0 },
      data: [
        { name: 'Food Insecure\n(44.2M)', itemStyle: { color: COLORS.mapHigh } },
        { name: 'SNAP\n(42.1M)', itemStyle: { color: COLORS.primary } },
        { name: 'School Lunch\n(30M)', itemStyle: { color: COLORS.secondary } },
        { name: 'Both Programs', itemStyle: { color: '#a78bfa' } },
        { name: 'Uncovered\n(~8M)', itemStyle: { color: 'rgba(255,255,255,0.3)' } }
      ],
      links: [
        { source: 'Food Insecure\n(44.2M)', target: 'SNAP\n(42.1M)', value: snapOnly },
        { source: 'Food Insecure\n(44.2M)', target: 'School Lunch\n(30M)', value: lunchOnly },
        { source: 'Food Insecure\n(44.2M)', target: 'Both Programs', value: overlap },
        { source: 'Food Insecure\n(44.2M)', target: 'Uncovered\n(~8M)', value: uncovered }
      ],
      animationDuration: 2000
    }]
  });
}

// -- Chart 4: School Lunch (Nightingale) --
function renderSchoolLunch(lunchData) {
  const chart = createChart('chart-school-lunch');
  if (!chart) return;

  const top15 = lunchData.slice(0, 15);
  const pieData = top15.map(s => ({
    name: s.name, value: s.pct,
    itemStyle: { color: s.pct > 65 ? COLORS.mapHigh : s.pct > 55 ? COLORS.mapMid : COLORS.primary }
  }));

  chart.setOption({
    tooltip: { ...TOOLTIP_STYLE, formatter: p => `<strong>${p.name}</strong><br/>Free/Reduced Lunch: <strong>${p.value}%</strong>` },
    series: [{
      type: 'pie', roseType: 'radius', radius: ['20%', '70%'], center: ['50%', '50%'],
      label: { show: true, formatter: '{b}\n{c}%', color: COLORS.text, fontSize: 9 },
      itemStyle: { borderRadius: 5, borderColor: 'rgba(0,0,0,0.3)', borderWidth: 1 },
      data: pieData, animationDuration: 2000
    }]
  });
}

// -- Chart 5: Benefits Per Person (bar + line overlay) --
function renderBenefits(benefitData, coverageStates) {
  const chart = createChart('chart-benefits');
  if (!chart) return;

  // Top 20 states by benefit amount
  const sorted = [...benefitData].sort((a, b) => b.benefit - a.benefit).slice(0, 20);
  const names = sorted.map(s => s.name);
  const benefits = sorted.map(s => s.benefit);

  // Find matching food insecurity rates
  const rates = sorted.map(s => {
    const match = coverageStates.find(c => c.name === s.name);
    return match ? match.insecurityRate : null;
  });

  chart.setOption({
    tooltip: {
      trigger: 'axis',
      ...TOOLTIP_STYLE,
      formatter: params => {
        let tip = `<strong>${params[0].name}</strong><br/>`;
        params.forEach(p => {
          if (p.seriesName === 'Avg Benefit ($/mo)') {
            tip += `${p.marker} Monthly Benefit: <strong>$${p.value}</strong><br/>`;
          } else {
            tip += `${p.marker} Food Insecurity: <strong>${p.value}%</strong><br/>`;
          }
        });
        return tip;
      }
    },
    legend: {
      data: ['Avg Benefit ($/mo)', 'Food Insecurity Rate (%)'],
      textStyle: { color: COLORS.text }, top: 5
    },
    grid: { left: 120, right: 50, top: 40, bottom: 30 },
    xAxis: [
      {
        type: 'value', name: 'Benefit ($)',
        nameTextStyle: { color: COLORS.textMuted },
        axisLabel: { color: COLORS.textMuted, formatter: '${value}' },
        splitLine: { lineStyle: { color: COLORS.gridLine } }
      },
      {
        type: 'value', name: 'Rate (%)',
        nameTextStyle: { color: COLORS.textMuted },
        axisLabel: { color: COLORS.textMuted, formatter: '{value}%' },
        splitLine: { show: false },
        position: 'top'
      }
    ],
    yAxis: {
      type: 'category',
      data: names.reverse(),
      axisLabel: { color: COLORS.text, fontSize: 10 },
      axisLine: { lineStyle: { color: COLORS.gridLine } }
    },
    series: [
      {
        name: 'Avg Benefit ($/mo)', type: 'bar', xAxisIndex: 0,
        data: benefits.reverse(), barWidth: '45%',
        itemStyle: {
          borderRadius: [0, 4, 4, 0],
          color: new echarts.graphic.LinearGradient(0, 0, 1, 0, [
            { offset: 0, color: COLORS.primary }, { offset: 1, color: COLORS.secondary }
          ])
        },
        animationDuration: 1500
      },
      {
        name: 'Food Insecurity Rate (%)', type: 'line', xAxisIndex: 1,
        data: rates.reverse(),
        smooth: true,
        lineStyle: { width: 2.5, color: COLORS.accent },
        itemStyle: { color: COLORS.accent },
        symbol: 'circle', symbolSize: 6,
        animationDuration: 2000, animationDelay: 300
      }
    ]
  });
}

// -- Init --
async function init() {
  try {
    const [snapRes, geoRes] = await Promise.all([
      fetch('/data/snap-participation.json'),
      fetch('/data/us-states-geo.json')
    ]);

    if (!snapRes.ok || !geoRes.ok) throw new Error('Failed to load data');

    const [snapData, geoJSON] = await Promise.all([snapRes.json(), geoRes.json()]);

    animateCounters();

    renderSnapTrend(snapData.trend);
    renderSnapMap(geoJSON, snapData.stateCoverage.states);
    renderCoverageGap(snapData.stateCoverage.states);
    renderSchoolLunch(snapData.schoolLunch.states);
    renderBenefits(snapData.benefitsPerPerson.states, snapData.stateCoverage.states);

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
