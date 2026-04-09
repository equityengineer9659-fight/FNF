/**
 * @fileoverview SNAP & Safety Net Dashboard — ECharts visualizations
 * @description Interactive charts: SNAP participation trend, coverage map,
 *              coverage gap, school lunch reach, benefits per person.
 */

import {
  echarts, COLORS, TOOLTIP_STYLE, MAP_PALETTES,
  fmtNum, animateCounters, createChart,
  initScrollReveal, handleResize, updateFreshness, addExportButton,
  initStateSelector, US_STATES
} from './shared/dashboard-utils.js';

const PAL = MAP_PALETTES.snap;

// -- Chart 1: SNAP Trend with Policy Zones (Area) + optional BLS CPI overlay --
let snapTrendChart = null;

function renderSnapTrend(trendData, blsData, snapNational) {
  if (!snapTrendChart) snapTrendChart = createChart('chart-snap-trend');
  if (!snapTrendChart) return;

  const dates = trendData.data.map(d => d.date);
  const values = trendData.data.map(d => d.value);

  // Build BLS CPI overlay aligned to SNAP dates
  let cpiSeries = [];
  let legendData = ['SNAP Participants'];
  const yAxes = [
    { type: 'value', name: 'Participants (M)', nameTextStyle: { color: COLORS.textMuted }, axisLabel: { color: COLORS.textMuted, formatter: '{value}M' }, splitLine: { lineStyle: { color: COLORS.gridLine } }, max: 48 }
  ];

  if (blsData?.series) {
    const foodHome = blsData.series.find(s => s.name === 'Food at Home');
    if (foodHome) {
      // Build lookup from BLS monthly data
      const cpiMap = {};
      foodHome.data.filter(d => d.value !== null).forEach(d => { cpiMap[d.date] = d.value; });

      // Align to SNAP dates (find closest month)
      const cpiAligned = dates.map(date => cpiMap[date] ?? null);

      // SNAP Purchasing Power Index: how much the benefit buys in real terms
      // Uses benefitTimeline for historically-accurate benefit per date
      const firstCpi = cpiAligned.find(v => v !== null);
      const fallbackBenefit = snapNational?.avgMonthlyBenefit || 188;

      // Build benefit lookup from timeline (step function: use most recent value <= date)
      const getBenefitForDate = (date) => {
        if (!snapBenefitTimeline?.length) return fallbackBenefit;
        let benefit = snapBenefitTimeline[0].value;
        for (const entry of snapBenefitTimeline) {
          if (entry.date <= date) benefit = entry.value;
          else break;
        }
        return benefit;
      };

      const ppIndex = firstCpi ? dates.map((date, i) => {
        const cpi = cpiAligned[i];
        if (!cpi) return null;
        const benefit = getBenefitForDate(date);
        return Math.round((benefit * firstCpi / cpi) * 10) / 10;
      }) : null;

      legendData.push('Food CPI');
      if (ppIndex) legendData.push('SNAP Purchasing Power ($)');
      yAxes.push({
        type: 'value', name: 'CPI / Purch. Power ($)',
        nameTextStyle: { color: COLORS.textMuted },
        axisLabel: { color: COLORS.textMuted },
        splitLine: { show: false },
        position: 'right'
      });
      cpiSeries = [{
        name: 'Food CPI', type: 'line', yAxisIndex: 1,
        data: cpiAligned, smooth: true, symbol: 'circle', symbolSize: 5,
        lineStyle: { width: 2.5, color: COLORS.accent, type: 'dashed' },
        itemStyle: { color: COLORS.accent }
      }];
      if (ppIndex) {
        cpiSeries.push({
          name: 'SNAP Purchasing Power ($)', type: 'line', yAxisIndex: 1,
          data: ppIndex, smooth: true, symbol: 'none',
          lineStyle: { width: 2, color: '#22c55e' },
          itemStyle: { color: '#22c55e' }
        });
      }
    }
  }

  snapTrendChart.setOption({
    tooltip: {
      trigger: 'axis', ...TOOLTIP_STYLE,
      formatter: params => {
        let tip = `<strong>${params[0].axisValue}</strong><br/>`;
        params.forEach(p => {
          if (p.seriesName === 'SNAP Participants') tip += `${p.marker} SNAP: <strong>${p.value}M</strong><br/>`;
          else if (p.seriesName === 'SNAP Purchasing Power ($)' && p.value != null) tip += `${p.marker} Purchasing Power: <strong>$${p.value}/mo</strong><br/>`;
          else if (p.value != null) tip += `${p.marker} Food CPI: <strong>${p.value}</strong><br/>`;
        });
        return tip;
      }
    },
    legend: { data: legendData, textStyle: { color: COLORS.text }, top: 5 },
    grid: { left: 55, right: blsData ? 55 : 20, top: 30, bottom: 60 },
    dataZoom: [{ type: 'inside', start: 0, end: 100 }, { type: 'slider', start: 0, end: 100, height: 20, bottom: 10, textStyle: { color: COLORS.textMuted }, borderColor: COLORS.gridLine, fillerColor: 'rgba(0,212,255,0.1)' }],
    xAxis: { type: 'category', data: dates, axisLabel: { color: COLORS.textMuted, rotate: 45, fontSize: 10 }, axisLine: { lineStyle: { color: COLORS.gridLine } } },
    yAxis: yAxes,
    series: [{
      name: 'SNAP Participants', type: 'line', data: values, smooth: true, symbol: 'none',
      lineStyle: { width: 3, color: COLORS.primary },
      areaStyle: { color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [{ offset: 0, color: 'rgba(1,118,211,0.4)' }, { offset: 1, color: 'rgba(1,118,211,0.02)' }]) },
      markArea: {
        silent: true,
        data: [
          [{ xAxis: '2020-03', itemStyle: { color: 'rgba(239,68,68,0.15)' }, label: { show: true, formatter: 'COVID Emergency\nAllotments', color: COLORS.secondary, fontSize: 9, position: 'insideTopRight', padding: [4, 8, 0, 0] } }, { xAxis: '2023-03' }],
          [{ xAxis: '2023-03', itemStyle: { color: 'rgba(251,191,36,0.12)' }, label: { show: true, formatter: 'Post-Emergency', color: COLORS.accent, fontSize: 9, position: 'insideTopLeft', padding: [4, 0, 0, 8] } }, { xAxis: '2025-12' }]
        ]
      },
      markLine: {
        silent: true,
        symbol: 'none',
        lineStyle: { type: 'dashed', color: COLORS.textMuted, width: 1, opacity: 0.6 },
        label: { fontSize: 9, color: COLORS.textMuted, position: 'insideEndTop', rotate: 45, overflow: 'truncate', width: 120 },
        data: trendData.events?.map(e => ({ xAxis: e.date, label: { formatter: () => e.label } })) || []
      },
      animationDuration: 2000
    }, ...cpiSeries]
  }, true);
}

// -- Chart 2: State SNAP Coverage Map (choropleth) --
let snapMapChart = null;
let snapMapAdminData = null;
let snapMapCdcData = null;
let snapMapActiveView = 'admin';

export const SNAP_MAP_DEFAULT_INSIGHT = 'Wyoming has the lowest administrative coverage ratio at 46.9%. When CDC self-reported data loads, compare the two views \u2014 states where self-reported is notably lower than administrative suggest stigma or under-reporting of benefits.';

/**
 * Format CDC vs admin SNAP rate comparison tooltip.
 * Extracted for testability.
 */
export function formatCdcAdminGap(adminRate, cdcRate) {
  const gap = (adminRate - cdcRate).toFixed(1);
  if (gap > 0) {
    return `${gap}pp under-reported — potential stigma or awareness gap`;
  } else if (gap < 0) {
    return `${Math.abs(gap)}pp over-reported — may include former recipients`;
  }
  return '0pp — CDC and administrative rates align';
}

function renderSnapMap(geoJSON, states) {
  snapMapChart = createChart('chart-snap-map');
  if (!snapMapChart) return;

  echarts.registerMap('USA-snap', geoJSON);

  // Store admin data for toggle
  snapMapAdminData = states.map(s => ({
    name: s.name,
    value: s.coverageRatio,
    snapParticipants: s.snapParticipants,
    foodInsecure: s.foodInsecure,
    insecurityRate: s.insecurityRate,
    snapRate: s.snapRate
  }));

  applySnapMapView('admin');

  // Click insight: state click updates callout with per-state narrative
  snapMapChart.on('click', (params) => {
    const d = /** @type {Record<string, *>} */ (params.data);
    const insightEl = document.getElementById('snap-map-insight');
    if (!d || !insightEl) return;

    if (snapMapActiveView === 'admin') {
      const ratio = typeof d.value === 'number' ? d.value : 0;
      let branch;
      if (ratio >= 100) {
        branch = 'Coverage exceeds the estimated food-insecure population, suggesting either over-counting or SNAP reaching households above the insecurity threshold.';
      } else if (ratio >= 80) {
        branch = `Strong coverage \u2014 most food-insecure residents in ${d.name} have access to SNAP benefits.`;
      } else if (ratio >= 60) {
        branch = `Moderate coverage \u2014 roughly ${(100 - ratio).toFixed(0)}% of food-insecure residents are not reached by SNAP.`;
      } else {
        branch = `Weak coverage \u2014 more than ${(100 - ratio).toFixed(0)}% of food-insecure residents in ${d.name} fall outside SNAP\u2019s reach, pointing to eligibility barriers, stigma, or awareness gaps.`;
      }
      insightEl.textContent = `${d.name}: ${ratio.toFixed(1)}% coverage ratio \u2014 SNAP serves ${fmtNum(d.snapParticipants)} of an estimated ${fmtNum(d.foodInsecure)} food-insecure residents. ${branch}`;
    } else if (snapMapActiveView === 'cdc' && snapMapCdcData) {
      const cdcRate = typeof d.cdcRate === 'number' ? d.cdcRate : 0;
      const adminMatch = snapMapAdminData?.find(a => a.name === d.name);
      const snapRate = adminMatch?.snapRate ?? null;
      const gap = snapRate !== null ? (snapRate - cdcRate).toFixed(1) : null;
      let gapBranch = '';
      if (gap !== null) {
        if (gap > 5) {
          gapBranch = ` The ${gap}pp gap may reflect stigma, survey underreporting, or recipients who do not identify as current users.`;
        } else if (gap >= -2) {
          gapBranch = ` Administrative and self-reported rates are broadly consistent for ${d.name}.`;
        } else {
          gapBranch = ' Self-reported rate exceeds administrative enrollment \u2014 may include former recipients or households in the enrollment process.';
        }
      }
      insightEl.textContent = `${d.name}: ${cdcRate}% of adults self-report SNAP receipt (CDC BRFSS)${snapRate !== null ? `, versus ${snapRate}% from administrative enrollment data.` : '.'}${gapBranch}`;
    }
  });
}

function applySnapMapView(view) {
  if (!snapMapChart) return;
  snapMapActiveView = view;

  // Reset insight callout to default when switching views
  const insightEl = document.getElementById('snap-map-insight');
  if (insightEl) insightEl.textContent = SNAP_MAP_DEFAULT_INSIGHT;

  const albersProjection = { project: p => p, unproject: p => p };
  const isAdmin = view === 'admin';
  const mapData = isAdmin ? snapMapAdminData : snapMapCdcData;

  if (!mapData) return;

  // Update toggle button states
  const adminBtn = document.getElementById('snap-map-toggle-admin');
  const cdcBtn = document.getElementById('snap-map-toggle-cdc');
  if (adminBtn && cdcBtn) {
    adminBtn.setAttribute('aria-pressed', isAdmin ? 'true' : 'false');
    adminBtn.classList.toggle('dashboard-metric-btn--active', isAdmin);
    cdcBtn.setAttribute('aria-pressed', isAdmin ? 'false' : 'true');
    cdcBtn.classList.toggle('dashboard-metric-btn--active', !isAdmin);
  }

  if (isAdmin) {
    snapMapChart.setOption({
      tooltip: {
        trigger: 'item',
        ...TOOLTIP_STYLE,
        formatter: params => {
          const d = params.data;
          if (!d) return '';
          let tip = `<strong style="font-size:14px">${d.name}</strong><br/>
            <span style="color:${COLORS.secondary}">Coverage Ratio:</span> ${d.value.toFixed(1)}%<br/>
            SNAP Participants: ${fmtNum(d.snapParticipants)}<br/>
            Food Insecure: ${fmtNum(d.foodInsecure)}<br/>
            Insecurity Rate: ${d.insecurityRate}%<br/>
            SNAP Rate: ${d.snapRate}%`;
          tip += `<br/><span style="color:#ef4444">Unserved:</span> ${fmtNum(Math.max(0, d.foodInsecure - d.snapParticipants))}`;
          // Show CDC comparison if available
          if (snapMapCdcData) {
            const cdcMatch = snapMapCdcData.find(c => c.name === d.name);
            if (cdcMatch) {
              const gap = (d.snapRate - cdcMatch.cdcRate).toFixed(1);
              tip += `<br/><span style="color:${COLORS.accent}">CDC Self-Reported:</span> ${cdcMatch.cdcRate}%`;
              tip += `<br/><span style="color:${COLORS.textMuted};font-size:11px">Gap: ${gap > 0 ? '+' : ''}${gap}pp (admin ${gap > 0 ? '>' : '<'} self-reported)</span>`;
            }
          }
          tip += `<br/><span style="color:${COLORS.textMuted};font-size:11px">&gt;100% = SNAP exceeds insecure population</span>`;
          return tip;
        }
      },
      visualMap: {
        left: 'right', bottom: 20,
        min: 40, max: 150,
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
        data: snapMapAdminData,
        animationDurationUpdate: 500
      }]
    }, true);
  } else {
    // CDC Self-Reported view
    snapMapChart.setOption({
      tooltip: {
        trigger: 'item',
        ...TOOLTIP_STYLE,
        formatter: params => {
          const d = params.data;
          if (!d) return `<strong style="font-size:14px">${params.name}</strong><br/><span style="color:${COLORS.textMuted}">No CDC survey data available for this state</span>`;
          let tip = `<strong style="font-size:14px">${d.name}</strong><br/>
            <span style="color:${COLORS.accent}">CDC Self-Reported SNAP:</span> ${d.cdcRate}%`;
          // Show admin comparison
          const adminMatch = snapMapAdminData?.find(a => a.name === d.name);
          if (adminMatch) {
            tip += `<br/><span style="color:${COLORS.secondary}">Administrative SNAP Rate:</span> ${adminMatch.snapRate}%`;
            const gap = (adminMatch.snapRate - d.cdcRate).toFixed(1);
            const gapColor = gap > 0 ? '#fbbf24' : gap < 0 ? '#ef4444' : '#22c55e';
            tip += `<br/><span style="color:${gapColor};font-size:12px">${formatCdcAdminGap(adminMatch.snapRate, d.cdcRate)}</span>`;
          }
          tip += `<br/><span style="color:${COLORS.textMuted};font-size:11px">Source: CDC PLACES BRFSS Survey</span>`;
          return tip;
        }
      },
      visualMap: {
        left: 'right', bottom: 20,
        min: 3, max: 25,
        text: ['High Self-Report', 'Low Self-Report'],
        calculable: true,
        inRange: { color: [PAL.low, PAL.mid, PAL.high] },
        textStyle: { color: COLORS.text }
      },
      series: [{
        name: 'CDC Self-Reported SNAP',
        type: 'map', map: 'USA-snap', roam: false,
        projection: albersProjection, aspectScale: 1, zoom: 1.1, top: 10, left: 'center',
        emphasis: {
          label: { show: true, color: COLORS.text, fontSize: 12, fontWeight: 'bold' },
          itemStyle: { areaColor: COLORS.secondary, borderColor: '#fff', borderWidth: 1.5 }
        },
        itemStyle: { borderColor: COLORS.mapBorder, borderWidth: COLORS.mapBorderWidth, areaColor: 'rgba(255,255,255,0.08)' },
        label: { show: false },
        data: snapMapCdcData,
        animationDurationUpdate: 500
      }]
    }, true);
  }
}

// -- Chart 3: Safety Net Coverage Flow (Sankey) --
// 3-column flow: Demographics → Program → Outcome
// Data modeled from USDA FNS, Feeding America, Census ACS
function renderCoverageGap(sankeyData) {
  const chart = createChart('chart-coverage-gap');
  if (!chart) return;

  // Data-driven: nodes and links come from snap-participation.json sankey section
  const nodes = sankeyData.nodes.map(n => ({
    name: n.name,
    itemStyle: { color: n.color }
  }));
  const links = sankeyData.links;

  chart.setOption({
    title: {
      text: '',
      subtext: 'Modeled estimates · USDA FNS, Feeding America, Census ACS · 2022 data',
      subtextStyle: { color: COLORS.textMuted, fontSize: 11 },
      top: 0, left: 'center'
    },
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

  const top15 = [...lunchData].sort((a, b) => b.pct - a.pct).slice(0, 15);
  const pieData = top15.map(s => ({
    name: s.name, value: s.pct,
    freePct: s.freePct || null,
    reducedPct: s.reducedPct || null,
    itemStyle: { color: s.pct > 65 ? PAL.low : s.pct > 55 ? PAL.mid : PAL.high }
  }));

  chart.setOption({
    tooltip: {
      ...TOOLTIP_STYLE,
      formatter: p => {
        const d = p.data;
        let tip = `<strong>${d.name}</strong><br/>Free/Reduced Lunch: <strong>${d.value}%</strong>`;
        if (d.freePct != null && d.reducedPct != null) {
          tip += `<br/><span style="color:#22c55e">Free (&lt;130% FPL):</span> <strong>${d.freePct}%</strong>`;
          tip += `<br/><span style="color:#fbbf24">Reduced (130-185% FPL):</span> <strong>${d.reducedPct}%</strong>`;
        }
        return tip;
      }
    },
    series: [{
      type: 'pie', roseType: 'radius', radius: ['20%', '65%'], center: ['50%', '50%'],
      label: {
        show: true, formatter: '{b}\n{c}%', color: COLORS.text, fontSize: 9,
        alignTo: 'labelLine', minMargin: 5, overflow: 'truncate'
      },
      labelLine: { length: 8, length2: 12, smooth: true },
      itemStyle: { borderRadius: 5, borderColor: 'rgba(0,0,0,0.3)', borderWidth: 1 },
      emphasis: { label: { show: true, fontSize: 12, fontWeight: 'bold' } },
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

// -- Chart 6: Coverage KPI Gauges --
function renderGauges(national) {
  // Monthly food cost for 3 meals/day at national avg meal cost ($3.58 — Feeding America Map the Meal Gap 2025, update annually)
  const mealCost = national.mealCostPerDay ?? 3.58;
  const monthlyFoodCost = Math.round(mealCost * 3 * 30);
  const affordabilityGap = monthlyFoodCost - national.avgMonthlyBenefit;

  const gaugeConfigs = [
    { id: 'gauge-coverage', title: 'SNAP Coverage', value: +(national.snapParticipants / (national.snapParticipants + national.coverageGap) * 100).toFixed(1), max: 100, unit: '%', color: COLORS.primary },
    { id: 'gauge-lunch', title: 'School Lunch', value: national.freeLunchPct, max: 100, unit: '%', color: COLORS.secondary },
    { id: 'gauge-benefit', title: 'Avg Benefit', value: national.avgMonthlyBenefit, max: 350, unit: '$', color: COLORS.accent },
    { id: 'gauge-gap', title: 'Coverage Gap', value: +(national.coverageGap / 1000000).toFixed(1), max: 15, unit: 'M', color: '#ef4444' },
    { id: 'gauge-affordability', title: 'Monthly Shortfall', value: affordabilityGap, max: 200, unit: '$', color: '#f59e0b' }
  ];

  gaugeConfigs.forEach(cfg => {
    const chart = createChart(cfg.id);
    if (!chart) return;

    chart.setOption({
      series: [{
        type: 'gauge',
        startAngle: 210, endAngle: -30,
        min: 0, max: cfg.max,
        radius: '90%', center: ['50%', '55%'],
        progress: { show: true, width: 14, itemStyle: { color: cfg.color } },
        axisLine: { lineStyle: { width: 14, color: [[1, 'rgba(255,255,255,0.1)']] } },
        axisTick: { show: false },
        splitLine: { show: false },
        axisLabel: { show: false },
        pointer: { show: false },
        title: { show: true, offsetCenter: [0, '70%'], color: COLORS.textMuted, fontSize: 12 },
        detail: {
          offsetCenter: [0, '20%'], fontSize: 22, fontWeight: 'bold',
          color: cfg.color,
          formatter: val => cfg.unit === '$' ? `$${val}` : `${val}${cfg.unit}`
        },
        data: [{ value: cfg.value, name: cfg.title }]
      }]
    });

    // Update aria-label with computed value for screen readers
    const gaugeEl = document.getElementById(cfg.id);
    if (gaugeEl) {
      const displayVal = cfg.unit === '$' ? `$${cfg.value}` : `${cfg.value}${cfg.unit}`;
      gaugeEl.setAttribute('aria-label', `Gauge showing ${cfg.title}: ${displayVal}`);
    }
  });
}

function updatePurchasingPowerNote(national, blsData) {
  const el = document.getElementById('purchasing-power-note');
  if (!el || !blsData?.series) return;
  const foodHome = blsData.series.find(s => s.name?.includes('Food at Home') || s.name?.includes('food at home'));
  if (!foodHome?.data?.length) return;
  const validData = foodHome.data.filter(d => d.value !== null);
  const baseCPI = validData[0]?.value; // Jan 2018 baseline
  const latestCPI = validData[validData.length - 1]?.value;
  if (!baseCPI || !latestCPI) return;
  const benefit = national.avgMonthlyBenefit || 188;
  const realValue = Math.round(benefit * baseCPI / latestCPI);
  const loss = benefit - realValue;
  el.textContent = `In 2018 grocery prices, today's $${benefit} SNAP benefit buys only $${realValue} of food \u2014 a $${loss}/month real loss.`;
}

// -- Non-blocking: BLS CPI overlay for SNAP trend --
let snapTrendData = null;
let snapNationalData = null;
let snapBenefitTimeline = null;

async function fetchBLSForSnap() {
  try {
    const res = await fetch('/api/dashboard-bls.php');
    if (!res.ok) return;
    const blsData = await res.json();
    if (blsData.error || !blsData.series) return;
    if (snapTrendData) {
      renderSnapTrend(snapTrendData, blsData, snapNationalData);
      updateFreshness('snap', blsData);
    }
    if (snapNationalData) updatePurchasingPowerNote(snapNationalData, blsData);
  } catch { /* BLS is optional */ }
}

// -- Non-blocking: CDC PLACES SNAP self-report for coverage map toggle --
async function fetchCDCPlacesSnap() {
  try {
    const res = await fetch('/api/dashboard-places.php?type=snap-receipt');
    if (!res.ok) return;
    const data = await res.json();
    if (data.error || !data.records || data.records.length === 0) return;

    // Map state abbreviations to full names and build CDC map data
    const stateNameMap = {};
    US_STATES.forEach(([abbr, name]) => { stateNameMap[abbr] = name; });

    snapMapCdcData = data.records
      .filter(r => stateNameMap[r.state])
      .map(r => ({
        name: stateNameMap[r.state],
        value: r.value,
        cdcRate: r.value
      }));

    // Show the toggle buttons now that CDC data is available
    const toggleContainer = document.getElementById('snap-map-toggle-container');
    if (toggleContainer) toggleContainer.style.display = '';
    const cdcStatus = document.getElementById('snap-map-cdc-status');
    if (cdcStatus) cdcStatus.textContent = 'CDC self-reported data loaded. Toggle available to compare administrative and self-reported SNAP data.';

    // Update freshness badge
    updateFreshness('snap-map', data);
  } catch { /* CDC PLACES is optional — fail silently */ }
}

// -- Non-blocking: Census race/ethnicity for demographic flow --
async function fetchDemographicData(snapData) {
  try {
    const res = await fetch('/api/dashboard-sdoh.php');
    if (!res.ok) return;
    const sdoh = await res.json();
    if (sdoh.error || !sdoh.states) return;

    // Check if race/ethnicity data is available
    if (!sdoh.states.some(s => s.race)) return;

    const section = document.getElementById('section-demographic-flow');
    if (section) section.style.display = '';

    renderDemographicFlow(sdoh, snapData);
    updateFreshness('demographic-flow', sdoh);
  } catch { /* Census data is optional */ }
}

function renderDemographicFlow(sdoh, snapData) {
  const chart = createChart('chart-demographic-flow');
  if (!chart) return;

  // Build state-level data merging SDOH race data with SNAP coverage
  const coverageByName = {};
  snapData.stateCoverage.states.forEach(s => { coverageByName[s.name] = s; });

  // Aggregate nationally: race/ethnicity proportions among food-insecure population
  let totalPop = 0;
  const raceGroups = { 'Hispanic/Latino': 0, 'White (non-Hispanic)': 0, 'Black/African American': 0, 'Asian': 0, 'Other': 0 };

  sdoh.states.forEach(s => {
    if (!s.race) return;
    const pop = s.population;
    totalPop += pop;
    raceGroups['Hispanic/Latino'] += pop * (s.race.hispanicPct / 100);
    raceGroups['White (non-Hispanic)'] += pop * (s.race.whitePct / 100);
    raceGroups['Black/African American'] += pop * (s.race.blackPct / 100);
    raceGroups['Asian'] += pop * (s.race.asianPct / 100);
    raceGroups['Other'] += pop * (Math.max(0, 100 - s.race.hispanicPct - s.race.whitePct - s.race.blackPct - s.race.asianPct) / 100);
  });

  // Food insecurity disproportionality: compare race share of food-insecure vs general population
  // Source: USDA ERS ERR-337 (Household Food Security in the United States, 2023) — most recent official data
  // Note: USDA discontinued annual food security reports after 2024; 2023 figures are the latest available
  const fiRates = { 'Hispanic/Latino': 20.8, 'White (non-Hispanic)': 9.4, 'Black/African American': 22.4, 'Asian': 9.7, 'Other': 14.0 };
  const raceColors = { 'Hispanic/Latino': '#fbbf24', 'White (non-Hispanic)': '#74c0fc', 'Black/African American': '#ff6b6b', 'Asian': '#69db7c', 'Other': '#c084fc' };

  // Build Sankey: Population → Food Insecure → Safety Net Coverage
  const links = [];
  const totalFI = Object.entries(raceGroups).reduce((sum, [race, pop]) => sum + pop * (fiRates[race] / 100), 0);

  // Race-specific SNAP coverage rates (USDA FNS SNAP Characteristics Surveys, 2023)
  // Black households have higher SNAP participation among food-insecure; Asian households significantly lower
  const coverageRates = { 'Hispanic/Latino': 0.78, 'White (non-Hispanic)': 0.82, 'Black/African American': 0.93, 'Asian': 0.62, 'Other': 0.75 };

  Object.entries(raceGroups).forEach(([race, pop]) => {
    const fiPop = pop * (fiRates[race] / 100);
    const covered = fiPop * (coverageRates[race] || 0.84);
    const uncovered = fiPop - covered;

    links.push({ source: race, target: 'Food Insecure', value: Math.round(fiPop / 1000000 * 10) / 10 });
    links.push({ source: 'Food Insecure', target: 'SNAP/Safety Net', value: Math.round(covered / 1000000 * 10) / 10 });
    links.push({ source: 'Food Insecure', target: 'Uncovered', value: Math.round(uncovered / 1000000 * 10) / 10 });
  });

  // Aggregate duplicate target links
  const linkMap = {};
  links.forEach(l => {
    const key = `${l.source}→${l.target}`;
    if (linkMap[key]) linkMap[key].value += l.value;
    else linkMap[key] = { ...l };
  });

  const nodes = [
    ...Object.keys(raceGroups).map(r => ({ name: r, itemStyle: { color: raceColors[r] } })),
    { name: 'Food Insecure', itemStyle: { color: COLORS.accent } },
    { name: 'SNAP/Safety Net', itemStyle: { color: '#22c55e' } },
    { name: 'Uncovered', itemStyle: { color: '#ef4444' } }
  ];

  chart.setOption({
    tooltip: { ...TOOLTIP_STYLE, trigger: 'item', formatter: p => p.data.source ? `${p.data.source} → ${p.data.target}: <strong>${p.data.value}M</strong>` : `<strong>${p.name}</strong>` },
    series: [{
      type: 'sankey',
      layout: 'none',
      emphasis: { focus: 'adjacency' },
      nodeAlign: 'left',
      nodeWidth: 20,
      nodeGap: 12,
      left: 20, right: 20, top: 10, bottom: 10,
      label: { color: COLORS.text, fontSize: 11 },
      lineStyle: { color: 'gradient', opacity: 0.4 },
      data: nodes,
      links: Object.values(linkMap).map(l => ({ ...l, value: +l.value.toFixed(1) }))
    }]
  });

  // Insight
  const insightEl = document.getElementById('demographic-flow-insight');
  if (insightEl) {
    const blackShare = (raceGroups['Black/African American'] / totalPop * 100).toFixed(0);
    const blackFIShare = (raceGroups['Black/African American'] * fiRates['Black/African American'] / 100 / totalFI * 100).toFixed(0);
    insightEl.textContent = `Black Americans are ${blackShare}% of the population but ${blackFIShare}% of the food-insecure population — a ${(blackFIShare / blackShare).toFixed(1)}x overrepresentation driven by systemic income and employment disparities.`;
  }
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

    snapTrendData = snapData.trend;
    snapNationalData = snapData.national;
    snapBenefitTimeline = snapData.benefitTimeline?.data || null;

    // Sync hero stat data-targets from live JSON
    const sn = snapData.national;
    document.querySelectorAll('.dashboard-hero .dashboard-stat__number').forEach(el => {
      const label = el.nextElementSibling?.textContent?.trim() || '';
      if (label.includes('SNAP Participants')) el.dataset.target = (sn.snapParticipants / 1e6).toFixed(1);
      else if (label.includes('Avg Monthly')) el.dataset.target = String(sn.avgMonthlyBenefit);
      else if (label.includes('Free Lunch')) el.dataset.target = String(sn.freeLunchPct);
      else if (label.includes('Coverage Gap')) el.dataset.target = (sn.coverageGap / 1e6).toFixed(1);
    });
    animateCounters();
    updateFreshness('snap', { _static: true, _dataYear: snapData.national.year || 2024 });

    renderSnapTrend(snapData.trend, null, snapData.national);
    renderSnapMap(geoJSON, snapData.stateCoverage.states);
    renderCoverageGap(snapData.sankey);
    renderSchoolLunch(snapData.schoolLunch.states);
    renderBenefits(snapData.benefitsPerPerson.states, snapData.stateCoverage.states);
    renderGauges(snapData.national);
    updateFreshness('snap-map', { _static: true, _dataYear: `FY${snapData.stateCoverage.year}` });
    updateFreshness('snap-sankey', { _static: true, _dataYear: 2022 });
    updateFreshness('snap-lunch', { _static: true, _dataYear: 'FY2023' });
    updateFreshness('snap-benefits', { _static: true, _dataYear: 'FY2025' });
    updateFreshness('snap-gauges', { _static: true, _dataYear: 'FY2025' });

    addExportButton('chart-snap-map', 'snap-coverage-by-state.csv', () => ({
      headers: ['State', 'SNAP Participants', 'Food Insecure', 'Coverage Ratio (%)', 'Insecurity Rate (%)'],
      rows: snapData.stateCoverage.states.map(s => [s.name, s.snapParticipants, s.foodInsecure, s.coverageRatio, s.insecurityRate])
    }));

    // State deep-dive selector
    initStateSelector('state-selector-container', (stateCode) => {
      const chart = echarts.getInstanceByDom(document.getElementById('chart-snap-map'));
      if (!chart) return;
      if (!stateCode) {
        chart.dispatchAction({ type: 'downplay' });
        return;
      }
      const stateName = US_STATES.find(([c]) => c === stateCode)?.[1];
      chart.dispatchAction({ type: 'downplay' });
      chart.dispatchAction({ type: 'highlight', name: stateName });
      chart.dispatchAction({ type: 'showTip', name: stateName });
    });

    initScrollReveal();
    window.addEventListener('resize', handleResize);

    // Wire up CDC PLACES toggle buttons
    const adminBtn = document.getElementById('snap-map-toggle-admin');
    const cdcBtn = document.getElementById('snap-map-toggle-cdc');
    if (adminBtn) adminBtn.addEventListener('click', () => applySnapMapView('admin'));
    if (cdcBtn) cdcBtn.addEventListener('click', () => applySnapMapView('cdc'));

    // Non-blocking live data
    fetchBLSForSnap();
    fetchCDCPlacesSnap();
    fetchDemographicData(snapData);

  } catch {
    document.querySelectorAll('.dashboard-chart').forEach(el => {
      el.innerHTML = '<p style="color: rgba(255,255,255,0.5); text-align: center; padding: 2rem;">Unable to load dashboard data. Please refresh the page.</p>';
    });
    const errorEl = document.getElementById('dashboard-error');
    if (errorEl) {
      errorEl.textContent = 'Unable to load dashboard data. Please try refreshing the page.';
      errorEl.hidden = false;
    }
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
