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

// -- Chart 1: SNAP Participation Trend (line with policy markers) --
function renderSnapTrend(trendData) {
  const chart = createChart('chart-snap-trend');
  if (!chart) return;

  const dates = trendData.data.map(d => d.date);
  const values = trendData.data.map(d => d.value);

  // Build markLine data from policy events
  const markLines = (trendData.events || []).map(evt => ({
    xAxis: evt.date,
    label: {
      formatter: evt.label,
      position: 'insideEndTop',
      color: COLORS.secondary,
      fontSize: 10,
      backgroundColor: 'rgba(10,10,30,0.8)',
      padding: [2, 6],
      borderRadius: 3
    },
    lineStyle: { color: COLORS.secondary, type: 'dashed', width: 1.5 }
  }));

  chart.setOption({
    tooltip: {
      trigger: 'axis',
      ...TOOLTIP_STYLE,
      formatter: params => {
        const p = params[0];
        return `<strong>${p.axisValue}</strong><br/>${p.marker} SNAP Enrollment: <strong>${p.value}M</strong>`;
      }
    },
    grid: { left: 55, right: 20, top: 20, bottom: 60 },
    dataZoom: [{
      type: 'inside', start: 0, end: 100
    }, {
      type: 'slider', start: 0, end: 100, height: 20, bottom: 10,
      textStyle: { color: COLORS.textMuted }, borderColor: COLORS.gridLine,
      fillerColor: 'rgba(0,212,255,0.1)'
    }],
    xAxis: {
      type: 'category',
      data: dates,
      axisLabel: { color: COLORS.textMuted, rotate: 45, fontSize: 10 },
      axisLine: { lineStyle: { color: COLORS.gridLine } }
    },
    yAxis: {
      type: 'value',
      name: 'Participants (M)',
      nameTextStyle: { color: COLORS.textMuted },
      axisLabel: { color: COLORS.textMuted, formatter: '{value}M' },
      splitLine: { lineStyle: { color: COLORS.gridLine } },
      min: 34, max: 48
    },
    series: [{
      type: 'line',
      data: values,
      smooth: true,
      symbol: 'circle',
      symbolSize: 6,
      lineStyle: { width: 3, color: COLORS.primary },
      itemStyle: { color: COLORS.primary },
      areaStyle: {
        color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
          { offset: 0, color: 'rgba(1,118,211,0.25)' },
          { offset: 1, color: 'rgba(1,118,211,0.02)' }
        ])
      },
      markLine: {
        symbol: 'none',
        data: markLines,
        animationDuration: 500
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

// -- Chart 3: Coverage Gap (grouped bar) --
function renderCoverageGap(states) {
  const chart = createChart('chart-coverage-gap');
  if (!chart) return;

  // Top 15 states by food insecurity — show gap
  const sorted = [...states].sort((a, b) => b.foodInsecure - a.foodInsecure).slice(0, 15);
  const names = sorted.map(s => s.name);
  const insecure = sorted.map(s => s.foodInsecure);
  const snap = sorted.map(s => s.snapParticipants);

  chart.setOption({
    tooltip: {
      trigger: 'axis',
      ...TOOLTIP_STYLE,
      formatter: params => {
        const idx = params[0].dataIndex;
        const s = sorted[sorted.length - 1 - idx]; // reversed
        const gap = s.foodInsecure - s.snapParticipants;
        return `<strong>${s.name}</strong><br/>
          Food Insecure: ${fmtNum(s.foodInsecure)}<br/>
          SNAP Enrolled: ${fmtNum(s.snapParticipants)}<br/>
          <span style="color:${gap > 0 ? COLORS.mapHigh : COLORS.mapLow}">Gap: ${gap > 0 ? fmtNum(gap) + ' uncovered' : 'Fully covered'}</span>`;
      }
    },
    legend: {
      data: ['Food Insecure', 'SNAP Enrolled'],
      textStyle: { color: COLORS.text }, top: 5
    },
    grid: { left: 120, right: 30, top: 40, bottom: 30 },
    xAxis: {
      type: 'value',
      axisLabel: { color: COLORS.textMuted, formatter: val => fmtNum(val) },
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
        name: 'Food Insecure', type: 'bar',
        data: insecure.reverse(), barWidth: '35%',
        itemStyle: {
          borderRadius: [0, 3, 3, 0],
          color: new echarts.graphic.LinearGradient(0, 0, 1, 0, [
            { offset: 0, color: COLORS.mapMid }, { offset: 1, color: COLORS.mapHigh }
          ])
        },
        animationDuration: 1500
      },
      {
        name: 'SNAP Enrolled', type: 'bar',
        data: snap.reverse(), barWidth: '35%',
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

// -- Chart 4: School Lunch Reach (horizontal bar) --
function renderSchoolLunch(lunchData) {
  const chart = createChart('chart-school-lunch');
  if (!chart) return;

  // Top 20 states by free/reduced lunch rate
  const sorted = lunchData.slice(0, 20);
  const names = sorted.map(s => s.name);
  const pcts = sorted.map(s => s.pct);
  const nationalAvg = 52.1;

  chart.setOption({
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
      ...TOOLTIP_STYLE,
      formatter: params => `<strong>${params[0].name}</strong><br/>Free/Reduced Lunch: <strong>${params[0].value}%</strong>`
    },
    grid: { left: 130, right: 30, top: 10, bottom: 30 },
    xAxis: {
      type: 'value',
      axisLabel: { color: COLORS.textMuted, formatter: '{value}%' },
      splitLine: { lineStyle: { color: COLORS.gridLine } },
      max: 80
    },
    yAxis: {
      type: 'category',
      data: names.reverse(),
      axisLabel: { color: COLORS.text, fontSize: 11 },
      axisLine: { lineStyle: { color: COLORS.gridLine } }
    },
    series: [{
      type: 'bar',
      data: pcts.reverse(),
      barWidth: '55%',
      markLine: {
        symbol: 'none',
        data: [{ xAxis: nationalAvg, label: { formatter: `National Avg: ${nationalAvg}%`, color: COLORS.secondary, fontSize: 11 }, lineStyle: { color: COLORS.secondary, type: 'dashed' } }],
        animationDuration: 500
      },
      itemStyle: {
        borderRadius: [0, 4, 4, 0],
        color: (params) => {
          const val = params.value;
          if (val > 65) return COLORS.mapHigh;
          if (val > 52) return COLORS.mapMid;
          return COLORS.primary;
        }
      },
      animationDuration: 1500,
      animationDelay: (idx) => idx * 80
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
