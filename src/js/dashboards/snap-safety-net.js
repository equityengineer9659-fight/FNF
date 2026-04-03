/**
 * @fileoverview SNAP & Safety Net Dashboard — ECharts visualizations
 * @description Interactive charts: SNAP participation trend, coverage map,
 *              coverage gap, school lunch reach, benefits per person.
 */

import {
  echarts, COLORS, TOOLTIP_STYLE, MAP_PALETTES,
  fmtNum, animateCounters, createChart,
  initScrollReveal, handleResize
} from './shared/dashboard-utils.js';

const PAL = MAP_PALETTES.snap;

// -- Chart 1: SNAP Trend with Policy Zones (Area) --
function renderSnapTrend(trendData) {
  const chart = createChart('chart-snap-trend');
  if (!chart) return;

  const dates = trendData.data.map(d => d.date);
  const values = trendData.data.map(d => d.value);

  chart.setOption({
    tooltip: { trigger: 'axis', ...TOOLTIP_STYLE, formatter: p => `<strong>${p[0].axisValue}</strong><br/>SNAP: <strong>${p[0].value}M</strong>` },
    legend: { data: ['SNAP Participants'], textStyle: { color: COLORS.text }, top: 5 },
    grid: { left: 55, right: 20, top: 30, bottom: 60 },
    dataZoom: [{ type: 'inside', start: 0, end: 100 }, { type: 'slider', start: 0, end: 100, height: 20, bottom: 10, textStyle: { color: COLORS.textMuted }, borderColor: COLORS.gridLine, fillerColor: 'rgba(0,212,255,0.1)' }],
    xAxis: { type: 'category', data: dates, axisLabel: { color: COLORS.textMuted, rotate: 45, fontSize: 10 }, axisLine: { lineStyle: { color: COLORS.gridLine } } },
    yAxis: { type: 'value', name: 'Participants (M)', nameTextStyle: { color: COLORS.textMuted }, axisLabel: { color: COLORS.textMuted, formatter: '{value}M' }, splitLine: { lineStyle: { color: COLORS.gridLine } }, min: 34, max: 48 },
    series: [{
      name: 'SNAP Participants', type: 'line', data: values, smooth: true, symbol: 'none',
      lineStyle: { width: 3, color: COLORS.primary },
      areaStyle: { color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [{ offset: 0, color: 'rgba(1,118,211,0.4)' }, { offset: 1, color: 'rgba(1,118,211,0.02)' }]) },
      markArea: {
        silent: true,
        data: [
          [{ xAxis: '2020-03', itemStyle: { color: 'rgba(239,68,68,0.15)' }, label: { show: true, formatter: 'COVID Emergency\nAllotments', color: PAL.low, fontSize: 9, position: 'insideTop' } }, { xAxis: '2023-03' }],
          [{ xAxis: '2023-03', itemStyle: { color: 'rgba(251,191,36,0.12)' }, label: { show: true, formatter: 'Post-Emergency', color: PAL.mid, fontSize: 9, position: 'insideTop' } }, { xAxis: '2025-01' }]
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
      inRange: { color: [PAL.low, PAL.mid, PAL.high] },
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
      itemStyle: { borderColor: COLORS.mapBorder, borderWidth: COLORS.mapBorderWidth, areaColor: 'rgba(255,255,255,0.08)' },
      label: { show: false },
      data: mapData,
      animationDurationUpdate: 500
    }]
  }, true);
}

// -- Chart 3: Safety Net Coverage Flow (Sankey) --
// 3-column flow: Demographics → Program → Outcome
// Data modeled from USDA FNS, Feeding America, Census ACS
function renderCoverageGap() {
  const chart = createChart('chart-coverage-gap');
  if (!chart) return;

  // Column 1: Who (demographics, exclusive, sums to 44.2M)
  // Column 2: Safety net program (primary source of assistance)
  // Column 3: Outcome (whether food needs are met)
  const nodes = [
    // Col 1 — Demographics
    { name: 'Children\n13M', itemStyle: { color: '#f59e0b' } },
    { name: 'Seniors 60+\n5.5M', itemStyle: { color: '#8b5cf6' } },
    { name: 'Working Adults\n25.7M', itemStyle: { color: COLORS.primary } },
    // Col 2 — Safety Net Programs
    { name: 'SNAP\n23.5M', itemStyle: { color: '#22c55e' } },
    { name: 'School Meals\n3.5M', itemStyle: { color: COLORS.secondary } },
    { name: 'Food Banks\n6.7M', itemStyle: { color: '#f97316' } },
    { name: 'No Assistance\n10.5M', itemStyle: { color: PAL.low } },
    // Col 3 — Outcomes
    { name: 'Needs Met\n15.5M', itemStyle: { color: '#16a34a' } },
    { name: 'Partially Met\n16M', itemStyle: { color: '#eab308' } },
    { name: 'Still in Crisis\n12.7M', itemStyle: { color: '#dc2626' } }
  ];

  const links = [
    // Children (13M) → Programs
    { source: 'Children\n13M', target: 'SNAP\n23.5M', value: 7000000 },
    { source: 'Children\n13M', target: 'School Meals\n3.5M', value: 3500000 },
    { source: 'Children\n13M', target: 'Food Banks\n6.7M', value: 1500000 },
    { source: 'Children\n13M', target: 'No Assistance\n10.5M', value: 1000000 },
    // Seniors (5.5M) → Programs
    { source: 'Seniors 60+\n5.5M', target: 'SNAP\n23.5M', value: 2500000 },
    { source: 'Seniors 60+\n5.5M', target: 'Food Banks\n6.7M', value: 1500000 },
    { source: 'Seniors 60+\n5.5M', target: 'No Assistance\n10.5M', value: 1500000 },
    // Working Adults (25.7M) → Programs
    { source: 'Working Adults\n25.7M', target: 'SNAP\n23.5M', value: 14000000 },
    { source: 'Working Adults\n25.7M', target: 'Food Banks\n6.7M', value: 3700000 },
    { source: 'Working Adults\n25.7M', target: 'No Assistance\n10.5M', value: 8000000 },
    // Programs → Outcomes
    { source: 'SNAP\n23.5M', target: 'Needs Met\n15.5M', value: 14000000 },
    { source: 'SNAP\n23.5M', target: 'Partially Met\n16M', value: 9500000 },
    { source: 'School Meals\n3.5M', target: 'Needs Met\n15.5M', value: 1500000 },
    { source: 'School Meals\n3.5M', target: 'Partially Met\n16M', value: 2000000 },
    { source: 'Food Banks\n6.7M', target: 'Partially Met\n16M', value: 4500000 },
    { source: 'Food Banks\n6.7M', target: 'Still in Crisis\n12.7M', value: 2200000 },
    { source: 'No Assistance\n10.5M', target: 'Still in Crisis\n12.7M', value: 10500000 }
  ];

  chart.setOption({
    tooltip: {
      ...TOOLTIP_STYLE,
      formatter: p => {
        if (p.dataType === 'edge') {
          const sourceNode = nodes.find(n => n.name === p.data.source);
          const sourceTotal = sourceNode ? links.filter(l => l.source === p.data.source).reduce((s, l) => s + l.value, 0) : p.data.value;
          const pct = ((p.data.value / sourceTotal) * 100).toFixed(0);
          return `${p.data.source.split('\n')[0]} → ${p.data.target.split('\n')[0]}<br/><strong>${fmtNum(p.data.value)}</strong> people (${pct}%)`;
        }
        return `<strong>${p.name.split('\n')[0]}</strong><br/>${fmtNum(p.value)} people`;
      }
    },
    series: [{
      type: 'sankey', layout: 'none', emphasis: { focus: 'adjacency' }, nodeAlign: 'justify',
      layoutIterations: 0,
      lineStyle: { color: 'gradient', curveness: 0.5, opacity: 0.35 },
      label: { color: COLORS.text, fontSize: 11, fontWeight: 'bold' },
      itemStyle: { borderWidth: 0 },
      nodeGap: 14,
      data: nodes,
      links,
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
    itemStyle: { color: s.pct > 65 ? PAL.low : s.pct > 55 ? PAL.mid : PAL.high }
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
    renderCoverageGap();
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
