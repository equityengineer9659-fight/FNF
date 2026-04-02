/**
 * @fileoverview Chart Preview — renders all 12 proposed new chart types
 * @description Temporary preview page for user review before applying to real dashboards.
 */

import {
  echarts, COLORS, TOOLTIP_STYLE,
  fmtNum, createChart, REGIONS, REGION_COLORS, getRegion
} from './shared/dashboard-utils.js';

// ============================================================
// 1. RADAR — Top 5 vs Bottom 5 states (Food Insecurity Overview)
// ============================================================
function renderRadarStates(data) {
  const chart = createChart('preview-radar-states');
  if (!chart) return;

  const sorted = [...data.states].sort((a, b) => b.rate - a.rate);
  const top5 = sorted.slice(0, 5);
  const bottom5 = sorted.slice(-5).reverse();

  // Normalize values to 0-100 scale for radar
  const maxRate = 20, maxChild = 28, maxPoverty = 20, maxMeal = 5.5, maxSnap = 900000;

  function normalize(states) {
    return states.map(s => [
      (s.rate / maxRate * 100).toFixed(0),
      (s.childRate / maxChild * 100).toFixed(0),
      (s.povertyRate / maxPoverty * 100).toFixed(0),
      (s.mealCost / maxMeal * 100).toFixed(0),
      (s.snapParticipation / maxSnap * 100).toFixed(0)
    ].map(Number));
  }

  const top5Avg = normalize(top5).reduce((acc, v) => acc.map((a, i) => a + v[i]), [0,0,0,0,0]).map(v => Math.round(v / 5));
  const bot5Avg = normalize(bottom5).reduce((acc, v) => acc.map((a, i) => a + v[i]), [0,0,0,0,0]).map(v => Math.round(v / 5));

  chart.setOption({
    tooltip: { ...TOOLTIP_STYLE },
    legend: {
      data: [`Top 5 (${top5.map(s => s.name).join(', ')})`, `Bottom 5 (${bottom5.map(s => s.name).join(', ')})`],
      textStyle: { color: COLORS.text, fontSize: 10 }, bottom: 0
    },
    radar: {
      indicator: [
        { name: 'Food Insecurity', max: 100 },
        { name: 'Child Rate', max: 100 },
        { name: 'Poverty', max: 100 },
        { name: 'Meal Cost', max: 100 },
        { name: 'SNAP Usage', max: 100 }
      ],
      shape: 'polygon',
      splitNumber: 4,
      axisName: { color: COLORS.text, fontSize: 11 },
      splitLine: { lineStyle: { color: COLORS.gridLine } },
      splitArea: { areaStyle: { color: ['rgba(0,212,255,0.02)', 'rgba(0,212,255,0.05)'] } },
      axisLine: { lineStyle: { color: COLORS.gridLine } }
    },
    series: [{
      type: 'radar',
      data: [
        {
          value: top5Avg,
          name: `Top 5 (${top5.map(s => s.name).join(', ')})`,
          areaStyle: { color: 'rgba(231,76,60,0.25)' },
          lineStyle: { color: COLORS.mapHigh, width: 2 },
          itemStyle: { color: COLORS.mapHigh }
        },
        {
          value: bot5Avg,
          name: `Bottom 5 (${bottom5.map(s => s.name).join(', ')})`,
          areaStyle: { color: 'rgba(46,204,113,0.25)' },
          lineStyle: { color: COLORS.mapLow, width: 2 },
          itemStyle: { color: COLORS.mapLow }
        }
      ]
    }]
  });
}

// ============================================================
// 2. NIGHTINGALE — Meal Cost by State (Overview)
// ============================================================
function renderNightingaleMeal(data) {
  const chart = createChart('preview-nightingale-meal');
  if (!chart) return;

  const sorted = [...data.states].sort((a, b) => b.mealCost - a.mealCost);
  const pieData = sorted.map(s => ({
    name: s.name,
    value: s.mealCost,
    itemStyle: { color: REGION_COLORS[getRegion(s.name)] }
  }));

  chart.setOption({
    tooltip: {
      ...TOOLTIP_STYLE,
      formatter: p => `<strong>${p.name}</strong><br/>Meal Cost: <strong>$${p.value}</strong><br/>Region: ${getRegion(p.name)}`
    },
    legend: {
      data: Object.keys(REGION_COLORS),
      textStyle: { color: COLORS.text }, bottom: 0,
      formatter: name => name
    },
    series: [{
      type: 'pie',
      roseType: 'area',
      radius: ['15%', '70%'],
      center: ['50%', '48%'],
      itemStyle: { borderRadius: 4, borderColor: 'rgba(0,0,0,0.3)', borderWidth: 1 },
      label: {
        show: true,
        formatter: p => p.value >= 4.0 ? `${p.name}\n$${p.value}` : '',
        color: COLORS.text, fontSize: 10
      },
      data: pieData,
      animationDuration: 2000
    }]
  });
}

// ============================================================
// 3. DONUT — Urban vs Rural (Food Access)
// ============================================================
function renderDonutUrban(accessData) {
  const chart = createChart('preview-donut-urban');
  if (!chart) return;

  const totalUrban = accessData.states.reduce((s, st) => s + st.urbanLowAccess, 0);
  const totalRural = accessData.states.reduce((s, st) => s + st.ruralLowAccess, 0);

  chart.setOption({
    tooltip: { ...TOOLTIP_STYLE, formatter: p => `${p.name}: <strong>${fmtNum(p.value)}</strong> tracts (${p.percent.toFixed(1)}%)` },
    legend: { data: ['Urban Low-Access', 'Rural Low-Access'], textStyle: { color: COLORS.text }, bottom: 0 },
    series: [
      {
        type: 'pie', radius: ['40%', '70%'], center: ['50%', '45%'],
        label: { show: true, color: COLORS.text, formatter: '{b}\n{d}%', fontSize: 12 },
        itemStyle: { borderRadius: 6, borderColor: 'rgba(0,0,0,0.4)', borderWidth: 2 },
        data: [
          { name: 'Urban Low-Access', value: totalUrban, itemStyle: { color: COLORS.primary } },
          { name: 'Rural Low-Access', value: totalRural, itemStyle: { color: COLORS.accent } }
        ],
        emphasis: { itemStyle: { shadowBlur: 20, shadowColor: 'rgba(0,212,255,0.3)' } },
        animationType: 'scale', animationDuration: 2000
      }
    ]
  });
}

// ============================================================
// 4. GRADIENT AREA — Distance to Store (Food Access)
// ============================================================
function renderAreaDistance(accessData) {
  const chart = createChart('preview-area-distance');
  if (!chart) return;

  const sorted = [...accessData.states].sort((a, b) => a.avgDistance - b.avgDistance);
  const names = sorted.map(s => s.name);
  const distances = sorted.map(s => s.avgDistance);

  chart.setOption({
    tooltip: {
      trigger: 'axis', ...TOOLTIP_STYLE,
      formatter: p => `<strong>${p[0].name}</strong><br/>Avg Distance: <strong>${p[0].value} mi</strong>`
    },
    grid: { left: 50, right: 20, top: 20, bottom: 40 },
    xAxis: {
      type: 'category', data: names, axisLabel: { color: COLORS.textMuted, rotate: 60, fontSize: 8 },
      axisLine: { lineStyle: { color: COLORS.gridLine } }
    },
    yAxis: {
      type: 'value', name: 'Miles', nameTextStyle: { color: COLORS.textMuted },
      axisLabel: { color: COLORS.textMuted }, splitLine: { lineStyle: { color: COLORS.gridLine } }
    },
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
      markLine: {
        symbol: 'none',
        data: [{ yAxis: 1, label: { formatter: 'Urban threshold (1mi)', color: COLORS.secondary, fontSize: 10 }, lineStyle: { color: COLORS.secondary, type: 'dashed' } }]
      },
      animationDuration: 2000
    }]
  });
}

// ============================================================
// 5. TREEMAP — Double Burden (Food Access)
// ============================================================
function renderTreemapBurden(accessData) {
  const chart = createChart('preview-treemap-burden');
  if (!chart) return;

  // Group by region
  const regionData = Object.entries(REGIONS).map(([region, stateNames]) => {
    const children = accessData.states
      .filter(s => stateNames.includes(s.name))
      .map(s => ({
        name: s.name,
        value: s.lowIncomeLowAccessPop,
        pctOfPop: ((s.lowIncomeLowAccessPop / s.population) * 100).toFixed(1)
      }))
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
      type: 'treemap',
      data: regionData,
      leafDepth: 1,
      roam: false,
      width: '95%', height: '90%', top: 10,
      label: { show: true, formatter: '{b}', fontSize: 10, color: '#fff' },
      upperLabel: { show: true, height: 24, color: '#fff', fontSize: 12, fontWeight: 'bold', backgroundColor: 'transparent' },
      itemStyle: { borderColor: 'rgba(0,0,0,0.5)', borderWidth: 1, gapWidth: 2 },
      levels: [
        { itemStyle: { borderColor: 'rgba(255,255,255,0.2)', borderWidth: 3, gapWidth: 3 }, upperLabel: { show: true } },
        {
          colorSaturation: [0.3, 0.7],
          itemStyle: { borderColorSaturation: 0.5, gapWidth: 1, borderWidth: 1 }
        }
      ],
      colorMappingBy: 'value',
      visualMin: 30000,
      visualMax: 1700000,
      color: [COLORS.mapLow, COLORS.mapMid, COLORS.mapHigh],
      animationDuration: 1500
    }]
  });
}

// ============================================================
// 6. AREA WITH POLICY ZONES — SNAP Trend
// ============================================================
function renderAreaSnap(snapData) {
  const chart = createChart('preview-area-snap');
  if (!chart) return;

  const dates = snapData.trend.data.map(d => d.date);
  const values = snapData.trend.data.map(d => d.value);

  chart.setOption({
    tooltip: { trigger: 'axis', ...TOOLTIP_STYLE, formatter: p => `<strong>${p[0].axisValue}</strong><br/>SNAP: <strong>${p[0].value}M</strong>` },
    grid: { left: 55, right: 20, top: 20, bottom: 30 },
    xAxis: {
      type: 'category', data: dates,
      axisLabel: { color: COLORS.textMuted, rotate: 45, fontSize: 10 },
      axisLine: { lineStyle: { color: COLORS.gridLine } }
    },
    yAxis: {
      type: 'value', name: 'Participants (M)', nameTextStyle: { color: COLORS.textMuted },
      axisLabel: { color: COLORS.textMuted, formatter: '{value}M' },
      splitLine: { lineStyle: { color: COLORS.gridLine } }, min: 34, max: 48
    },
    series: [{
      type: 'line', data: values, smooth: true, symbol: 'none',
      lineStyle: { width: 3, color: COLORS.primary },
      areaStyle: {
        color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
          { offset: 0, color: 'rgba(1,118,211,0.4)' },
          { offset: 1, color: 'rgba(1,118,211,0.02)' }
        ])
      },
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

// ============================================================
// 7. SANKEY — Safety Net Coverage Flow
// ============================================================
function renderSankeySnap(snapData) {
  const chart = createChart('preview-sankey-snap');
  if (!chart) return;

  const totalInsecure = 44200000;
  const snapCovered = 42100000;
  const schoolLunchCovered = 30000000;
  const overlap = 18000000; // SNAP + school lunch overlap
  const snapOnly = snapCovered - overlap;
  const lunchOnly = schoolLunchCovered - overlap;
  const uncovered = Math.max(0, totalInsecure - snapOnly - lunchOnly - overlap);

  chart.setOption({
    tooltip: { ...TOOLTIP_STYLE, formatter: p => p.dataType === 'edge' ? `${p.data.source} → ${p.data.target}: <strong>${fmtNum(p.data.value)}</strong>` : `<strong>${p.name}</strong>: ${fmtNum(p.value)}` },
    series: [{
      type: 'sankey',
      layout: 'none',
      emphasis: { focus: 'adjacency' },
      nodeAlign: 'left',
      lineStyle: { color: 'gradient', curveness: 0.5, opacity: 0.4 },
      label: { color: COLORS.text, fontSize: 12 },
      itemStyle: { borderWidth: 0 },
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

// ============================================================
// 8. NIGHTINGALE — School Lunch Rates (SNAP)
// ============================================================
function renderNightingaleLunch(snapData) {
  const chart = createChart('preview-nightingale-lunch');
  if (!chart) return;

  const top15 = snapData.schoolLunch.states.slice(0, 15);
  const pieData = top15.map(s => ({
    name: s.name, value: s.pct,
    itemStyle: {
      color: s.pct > 65 ? COLORS.mapHigh : s.pct > 55 ? COLORS.mapMid : COLORS.primary
    }
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

// ============================================================
// 9. GRADIENT STACKED AREA — Food Prices by Category
// ============================================================
function renderStackedArea(priceData) {
  const chart = createChart('preview-stacked-area');
  if (!chart) return;

  const series = priceData.categories.series;
  const dates = series[0].data.map(d => d.date);
  const areaColors = [
    ['rgba(255,107,53,0.7)', 'rgba(255,107,53,0.1)'],
    ['rgba(0,212,255,0.6)', 'rgba(0,212,255,0.1)'],
    ['rgba(167,139,250,0.6)', 'rgba(167,139,250,0.1)'],
    ['rgba(52,211,153,0.6)', 'rgba(52,211,153,0.1)'],
    ['rgba(1,118,211,0.5)', 'rgba(1,118,211,0.1)']
  ];
  const lineColors = [COLORS.accent, COLORS.secondary, '#a78bfa', '#34d399', COLORS.primary];

  chart.setOption({
    tooltip: {
      trigger: 'axis', ...TOOLTIP_STYLE,
      formatter: params => {
        let tip = `<strong>${params[0].axisValue}</strong><br/>`;
        params.forEach(p => { tip += `${p.marker} ${p.seriesName}: <strong>${p.value}</strong><br/>`; });
        return tip;
      }
    },
    legend: { data: series.map(s => s.name), textStyle: { color: COLORS.text, fontSize: 10 }, top: 5 },
    grid: { left: 50, right: 20, top: 45, bottom: 30 },
    xAxis: {
      type: 'category', data: dates, boundaryGap: false,
      axisLabel: { color: COLORS.textMuted, rotate: 45, fontSize: 10 },
      axisLine: { lineStyle: { color: COLORS.gridLine } }
    },
    yAxis: {
      type: 'value', name: 'CPI Index', nameTextStyle: { color: COLORS.textMuted },
      axisLabel: { color: COLORS.textMuted }, splitLine: { lineStyle: { color: COLORS.gridLine } }
    },
    series: series.map((s, i) => ({
      name: s.name, type: 'line', stack: 'Total', smooth: true, symbol: 'none',
      lineStyle: { width: 0 },
      areaStyle: {
        color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
          { offset: 0, color: areaColors[i][0] },
          { offset: 1, color: areaColors[i][1] }
        ])
      },
      emphasis: { focus: 'series' },
      data: s.data.map(d => d.value),
      animationDuration: 2000
    }))
  });
}

// ============================================================
// 10. SUNBURST — Food Cost Burden by Income
// ============================================================
function renderSunburstBurden(priceData) {
  const chart = createChart('preview-sunburst-burden');
  if (!chart) return;

  const q = priceData.affordability.quintiles;
  const sunburstColors = [COLORS.mapHigh, COLORS.mapMid, '#f59e0b', COLORS.primary, COLORS.mapLow];

  const data = q.map((qi, i) => ({
    name: qi.label,
    value: qi.foodSharePct,
    itemStyle: { color: sunburstColors[i] },
    children: [
      { name: `$${qi.monthlyFoodCost}/mo`, value: qi.foodSharePct * 0.6, itemStyle: { color: sunburstColors[i] } },
      { name: qi.income, value: qi.foodSharePct * 0.4, itemStyle: { color: sunburstColors[i], opacity: 0.6 } }
    ]
  }));

  chart.setOption({
    tooltip: {
      ...TOOLTIP_STYLE,
      formatter: p => {
        const parent = p.treePathInfo && p.treePathInfo.length > 1 ? p.treePathInfo[1].name : '';
        return `<strong>${p.name}</strong>${parent ? `<br/>(${parent})` : ''}<br/>Food Share: ${p.value.toFixed(1)}%`;
      }
    },
    series: [{
      type: 'sunburst',
      data: data,
      radius: ['15%', '80%'],
      label: { show: true, color: '#fff', fontSize: 10, rotate: 'tangential' },
      itemStyle: { borderColor: 'rgba(0,0,0,0.4)', borderWidth: 1.5 },
      emphasis: { focus: 'ancestor' },
      levels: [
        {},
        { r0: '15%', r: '50%', label: { fontSize: 11, fontWeight: 'bold' } },
        { r0: '50%', r: '80%', label: { fontSize: 9 } }
      ],
      animationDuration: 2000
    }]
  });
}

// ============================================================
// 11. TREEMAP — Food Bank Revenue by State
// ============================================================
function renderTreemapRevenue(bankData) {
  const chart = createChart('preview-treemap-revenue');
  if (!chart) return;

  const regionData = Object.entries(REGIONS).map(([region, stateNames]) => {
    const children = bankData.states
      .filter(s => stateNames.includes(s.name))
      .map(s => ({
        name: s.name, value: s.totalRevenue,
        efficiency: s.programExpenseRatio, orgCount: s.orgCount
      }))
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

// ============================================================
// 12. RADAR — Regional Comparison (Food Banks)
// ============================================================
function renderRadarRegions(bankData) {
  const chart = createChart('preview-radar-regions');
  if (!chart) return;

  // Compute regional averages
  const regionAvgs = Object.entries(REGIONS).map(([region, stateNames]) => {
    const states = bankData.states.filter(s => stateNames.includes(s.name));
    const n = states.length;
    return {
      name: region,
      efficiency: (states.reduce((s, st) => s + st.programExpenseRatio, 0) / n).toFixed(1),
      density: (states.reduce((s, st) => s + st.perCapitaOrgs, 0) / n).toFixed(1),
      avgRevPerOrg: (states.reduce((s, st) => s + st.totalRevenue / st.orgCount, 0) / n / 1000000).toFixed(2),
      insecurity: (states.reduce((s, st) => s + st.foodInsecurityRate, 0) / n).toFixed(1),
      orgCount: Math.round(states.reduce((s, st) => s + st.orgCount, 0) / n)
    };
  });

  chart.setOption({
    tooltip: { ...TOOLTIP_STYLE },
    legend: {
      data: regionAvgs.map(r => r.name),
      textStyle: { color: COLORS.text }, bottom: 0
    },
    radar: {
      indicator: [
        { name: 'Efficiency (%)', max: 90 },
        { name: 'Density\n(per 100K)', max: 22 },
        { name: 'Avg Rev/Org\n($M)', max: 1.5 },
        { name: 'Insecurity (%)', max: 18 },
        { name: 'Avg Org Count', max: 2000 }
      ],
      shape: 'polygon',
      splitNumber: 4,
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

// ============================================================
// INIT — Load all data and render all 12 charts
// ============================================================
async function init() {
  try {
    const [fiRes, accessRes, snapRes, priceRes, bankRes] = await Promise.all([
      fetch('/data/food-insecurity-state.json'),
      fetch('/data/food-access-atlas.json'),
      fetch('/data/snap-participation.json'),
      fetch('/data/bls-regional-cpi.json'),
      fetch('/data/food-bank-summary.json')
    ]);

    const [fiData, accessData, snapData, priceData, bankData] = await Promise.all([
      fiRes.json(), accessRes.json(), snapRes.json(), priceRes.json(), bankRes.json()
    ]);

    // Render all 12 preview charts
    renderRadarStates(fiData);          // 1
    renderNightingaleMeal(fiData);      // 2
    renderDonutUrban(accessData);       // 3
    renderAreaDistance(accessData);      // 4
    renderTreemapBurden(accessData);    // 5
    renderAreaSnap(snapData);           // 6
    renderSankeySnap(snapData);         // 7
    renderNightingaleLunch(snapData);   // 8
    renderStackedArea(priceData);       // 9
    renderSunburstBurden(priceData);    // 10
    renderTreemapRevenue(bankData);     // 11
    renderRadarRegions(bankData);       // 12

    // Responsive
    window.addEventListener('resize', () => {
      document.querySelectorAll('.preview-chart').forEach(el => {
        const instance = echarts.getInstanceByDom(el);
        if (instance) instance.resize();
      });
    });

  } catch (err) {
    document.querySelectorAll('.preview-chart').forEach(el => {
      el.innerHTML = `<p style="color:rgba(255,255,255,0.5);text-align:center;padding:2rem;">Failed to load: ${err.message}</p>`;
    });
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
