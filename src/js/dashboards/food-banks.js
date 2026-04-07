/**
 * @fileoverview Food Bank Landscape Dashboard — ECharts visualizations
 * @description Interactive charts: density map, resources vs need scatter,
 *              revenue bar, program efficiency, distribution vs need.
 */

import {
  echarts, COLORS, TOOLTIP_STYLE, MAP_PALETTES,
  fmtNum, animateCounters, createChart, linearRegression,
  initScrollReveal, handleResize, updateFreshness,
  REGIONS, REGION_COLORS, getRegion, addExportButton,
  initStateSelector, US_STATES
} from './shared/dashboard-utils.js';

import {
  createD3Heatmap, buildHeatmapLegend, buildRegionChips, createRankNorm, HEATMAP_REGION_COLORS
} from './shared/d3-heatmap.js';

const PAL = MAP_PALETTES.banks;

function hexToRgba(hex, alpha) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

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
      left: 'right', bottom: 20, min: Math.floor(Math.min(...states.map(s => s.perCapitaOrgs))), max: Math.ceil(Math.max(...states.map(s => s.perCapitaOrgs))),
      text: ['Higher Density', 'Lower Density'], calculable: true,
      inRange: { color: [PAL.low, PAL.mid, PAL.high] },
      textStyle: { color: COLORS.text }
    },
    series: [{
      name: 'Food Bank Density', type: 'map', map: 'USA-banks', roam: false,
      projection: albersProjection, aspectScale: 1, zoom: 1.1, top: 10, left: 'center',
      emphasis: {
        label: { show: true, color: COLORS.text, fontSize: 12, fontWeight: 'bold' },
        itemStyle: { areaColor: COLORS.secondary, borderColor: '#fff', borderWidth: 1.5 }
      },
      itemStyle: { borderColor: COLORS.mapBorder, borderWidth: COLORS.mapBorderWidth, areaColor: 'rgba(255,255,255,0.08)' },
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

  const byRegion = {};
  Object.keys(REGION_COLORS).forEach(r => { byRegion[r] = []; });
  points.forEach(p => byRegion[getRegion(p.name)].push(p));

  const reg = linearRegression(points.map(p => p.value));
  const xs = points.map(p => p.value[0]);
  const xMin = Math.min(...xs), xMax = Math.max(...xs);

  // Only show regression line when correlation is meaningful (|r| >= 0.2)
  const showRegression = Math.abs(reg.r) >= 0.2;
  const rLine = showRegression ? {
    symbol: 'none', silent: true,
    lineStyle: { color: 'rgba(255,255,255,0.35)', type: 'dashed', width: 1.5 },
    data: [[{ coord: [xMin, reg.slope * xMin + reg.intercept] }, { coord: [xMax, reg.slope * xMax + reg.intercept] }]],
    label: { formatter: `r = ${reg.r.toFixed(2)}`, color: COLORS.textMuted, fontSize: 11, position: 'end' }
  } : null;

  const series = Object.entries(REGION_COLORS).map(([region, color], i) => ({
    name: region, type: 'scatter',
    data: byRegion[region],
    symbolSize: (_, params) => Math.max(8, Math.sqrt(params.data.totalRevenue / 10000000)),
    itemStyle: { color, opacity: 0.85 },
    emphasis: { itemStyle: { opacity: 1 } },
    animationDuration: 2000,
    ...(i === 0 && rLine ? { markLine: rLine } : {})
  }));

  chart.setOption({
    legend: {
      top: 5, right: 10,
      textStyle: { color: COLORS.text, fontSize: 11 },
      itemWidth: 10, itemHeight: 10
    },
    tooltip: {
      ...TOOLTIP_STYLE,
      formatter: params => {
        const d = params.data;
        const region = getRegion(d.name);
        return `<strong>${d.name}</strong> <span style="color:${REGION_COLORS[region]}">(${region})</span><br/>Food Insecurity: ${d.value[0]}%<br/>Density: ${d.value[1].toFixed(1)} per 100K<br/>Revenue: $${fmtNum(d.totalRevenue)}`;
      }
    },
    grid: { left: 60, right: 20, top: 35, bottom: 50 },
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
    series
  });

  // Update insight text with correlation result or suppression note
  const insightEl = document.getElementById('vs-insecurity-insight');
  if (insightEl) {
    if (showRegression) {
      const rAbs = Math.abs(reg.r);
      const strength = rAbs >= 0.6 ? 'strong' : rAbs >= 0.4 ? 'moderate' : 'weak';
      const direction = reg.r > 0 ? 'positive' : 'negative';
      insightEl.textContent = `${direction.charAt(0).toUpperCase() + direction.slice(1)} ${strength} correlation (r = ${reg.r.toFixed(2)}) — states with more insecurity tend to have ${reg.r > 0 ? 'more' : 'fewer'} food banks per capita.`;
    } else {
      insightEl.textContent = 'No statistically meaningful correlation found (|r| < 0.2) — food bank density does not reliably track food insecurity rate across states.';
    }
  }
}

// -- Chart 3: Revenue by State (D3 Zoomable Heatmap) --
function renderRevenue(states) {
  const container = document.getElementById('chart-revenue');
  if (!container) return;

  // Compute rank-based normalization (prevents outliers like DC from compressing the scale)
  const revValues = states.map(s => {
    const ins = Math.round(s.population * s.foodInsecurityRate / 100);
    return ins > 0 ? Math.round(s.totalRevenue / ins) : 0;
  });
  const revMin = Math.min(...revValues), revMax = Math.max(...revValues);
  const rankNorm = createRankNorm(revValues);

  // Build hierarchy: Region > State
  const hierarchyData = {
    name: 'United States',
    children: Object.entries(REGIONS).map(([region, names]) => ({
      name: region,
      children: states
        .filter(s => names.includes(s.name))
        .map(s => {
          const insecure = Math.round(s.population * s.foodInsecurityRate / 100);
          const rev = insecure > 0 ? Math.round(s.totalRevenue / insecure) : 0;
          return {
            name: s.name, size: rev,
            totalRevenue: s.totalRevenue, efficiency: s.programExpenseRatio,
            orgCount: s.orgCount, insecurePersons: insecure,
            insecurityRate: s.foodInsecurityRate, region,
            label2: '$' + fmtNum(rev) + '/person',
            label3: s.programExpenseRatio + '% eff.'
          };
        })
    }))
  };

  createD3Heatmap({
    containerId: 'chart-revenue',
    breadcrumbId: 'revenue-breadcrumb',
    hierarchyData,
    tooltipFn: (leaf) => {
      const d = leaf.data;
      const region = leaf.parent ? leaf.parent.data.name : d.region;
      const rc = HEATMAP_REGION_COLORS[region] || '#888';
      return `<strong>${d.name}</strong>
        <span style="margin-left:6px;display:inline-flex;align-items:center">
          <span style="background:${rc};width:8px;height:8px;border-radius:2px;display:inline-block;margin-right:4px"></span>
          <span style="color:${rc}">${region}</span>
        </span><br/>
        <span style="color:#818CF8;font-weight:500">$ per Person in Need:</span> <strong>$${fmtNum(leaf.value)}</strong><br/>
        <span style="color:#818CF8;font-weight:500">Program Efficiency:</span> <strong>${d.efficiency}%</strong>
        <hr style="border:none;border-top:1px solid rgba(255,255,255,0.08);margin:7px 0">
        Total Revenue: $${fmtNum(d.totalRevenue)}<br/>
        Organizations: ${fmtNum(d.orgCount)}<br/>
        Insecure Pop: ${fmtNum(d.insecurePersons)}<br/>
        Insecurity Rate: ${d.insecurityRate}%`;
    },
    normFn: (leaf) => rankNorm(leaf.value)
  });

  // Populate legend containers
  buildHeatmapLegend(
    document.getElementById('treemap-legend-banks'),
    revMin, revMax, v => '$' + fmtNum(v)
  );
  buildRegionChips(document.getElementById('revenue-region-legend'));
}

// -- Chart 4: Regional Comparison (Radar) --
function renderEfficiency(states, national) {
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
    legend: { data: ['National Avg', ...regionAvgs.map(r => r.name)], textStyle: { color: COLORS.text }, bottom: 0 },
    radar: {
      indicator: [
        { name: 'Efficiency (%)', max: 90 }, { name: 'Density\n(per 100K)', max: 40 },
        { name: 'Avg Rev/Org\n($M)', max: 1.5 }, { name: 'Insecurity (%)', max: 20 },
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
      data: [
        // National average benchmark
        {
          name: 'National Avg',
          value: [
            (national?.avgEfficiencyRatio ?? (states.reduce((s, st) => s + st.programExpenseRatio, 0) / states.length)).toFixed(1),
            (states.reduce((s, st) => s + st.perCapitaOrgs, 0) / states.length).toFixed(1),
            (states.reduce((s, st) => s + (st.orgCount > 0 ? st.totalRevenue / st.orgCount : 0), 0) / states.length / 1000000).toFixed(2),
            (states.reduce((s, st) => s + st.foodInsecurityRate, 0) / states.length).toFixed(1),
            Math.round(states.reduce((s, st) => s + st.orgCount, 0) / states.length)
          ],
          areaStyle: { color: 'rgba(255,255,255,0.05)' },
          lineStyle: { color: 'rgba(255,255,255,0.5)', width: 2, type: 'dashed' },
          itemStyle: { color: 'rgba(255,255,255,0.5)' }
        },
        // Regional polygons
        ...regionAvgs.map(r => ({
          name: r.name,
          value: [r.efficiency, r.density, r.avgRevPerOrg, r.insecurity, r.orgCount],
          areaStyle: { color: hexToRgba(REGION_COLORS[r.name], 0.2) },
          lineStyle: { color: REGION_COLORS[r.name], width: 2 },
          itemStyle: { color: REGION_COLORS[r.name] }
        }))
      ]
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
            { offset: 0, color: PAL.mid }, { offset: 1, color: PAL.high }
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

// -- Chart 6: Need-Capacity Gap (scatter: insecurity vs revenue/person) --
function renderCapacityGap(states) {
  const chart = createChart('chart-capacity-gap');
  if (!chart) return;

  // Revenue per food-insecure person
  const enriched = states.map(s => {
    const insecurePersons = s.population * s.foodInsecurityRate / 100;
    const revPerPerson = insecurePersons > 0 ? Math.round(s.totalRevenue / insecurePersons) : 0;
    return { ...s, insecurePersons, revPerPerson };
  });

  const byRegion = {};
  Object.keys(REGION_COLORS).forEach(r => { byRegion[r] = []; });
  enriched.forEach(s => byRegion[getRegion(s.name)].push(s));

  const series = Object.entries(REGION_COLORS).map(([region, color]) => ({
    name: region, type: 'scatter',
    data: byRegion[region].map(s => ({
      value: [s.foodInsecurityRate, s.revPerPerson],
      name: s.name,
      insecurePersons: s.insecurePersons
    })),
    symbolSize: (_, params) => Math.max(6, Math.min(35, Math.sqrt(params.data.insecurePersons / 10000))),
    itemStyle: { color, opacity: 0.85 },
    emphasis: { itemStyle: { opacity: 1 } },
    animationDuration: 2000
  }));

  chart.setOption({
    legend: { top: 5, right: 10, textStyle: { color: COLORS.text, fontSize: 11 }, itemWidth: 10, itemHeight: 10 },
    tooltip: {
      ...TOOLTIP_STYLE,
      formatter: params => {
        const d = params.data;
        return `<strong>${d.name}</strong> <span style="color:${REGION_COLORS[getRegion(d.name)]}">(${getRegion(d.name)})</span><br/>Food Insecurity: ${d.value[0]}%<br/>Revenue/Insecure Person: <strong>$${d.value[1].toLocaleString()}</strong><br/>Food-Insecure Pop: ${fmtNum(d.insecurePersons)}`;
      }
    },
    grid: { left: 70, right: 20, top: 35, bottom: 50 },
    xAxis: {
      name: 'Food Insecurity Rate (%)', nameLocation: 'center', nameGap: 35,
      nameTextStyle: { color: COLORS.textMuted },
      axisLabel: { color: COLORS.textMuted, formatter: '{value}%' },
      splitLine: { lineStyle: { color: COLORS.gridLine } }
    },
    yAxis: {
      name: 'Revenue per Insecure Person ($)',
      nameTextStyle: { color: COLORS.textMuted },
      axisLabel: { color: COLORS.textMuted, formatter: val => '$' + fmtNum(val) },
      splitLine: { lineStyle: { color: COLORS.gridLine } }
    },
    series
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

    // Sync hero stat data-targets from live JSON
    const bn = bankData.national;
    document.querySelectorAll('.dashboard-hero .dashboard-stat__number').forEach(el => {
      const label = el.nextElementSibling?.textContent?.trim() || '';
      if (label.includes('Assistance Orgs')) el.dataset.target = String(bn.totalOrganizations);
      else if (label.includes('Revenue')) el.dataset.target = (bn.combinedRevenue / 1e9).toFixed(1);
      else if (label.includes('Efficiency')) el.dataset.target = String(bn.avgEfficiencyRatio);
      else if (label.includes('Under 100')) el.dataset.target = String(bn.statesUnder100);
    });
    animateCounters();
    updateFreshness('banks', { _static: true, _dataYear: '2023/2024' });
    renderDensityMap(geoJSON, bankData.states);
    // Surface reconciliation note if present in data
    if (bankData.national?._reconciliationNote) {
      const el = document.getElementById('density-reconciliation');
      if (el) { el.textContent = bankData.national._reconciliationNote; el.style.display = ''; }
    }
    renderVsInsecurity(bankData.states);
    renderRevenue(bankData.states);
    renderEfficiency(bankData.states, bankData.national);
    renderDistribution(bankData.states);
    renderCapacityGap(bankData.states);
    addExportButton('chart-density-map', 'food-banks-by-state.csv', () => ({
      headers: ['State', 'Org Count', 'Density (per 100K)', 'Total Revenue ($)', 'Program Efficiency (%)', 'Food Insecurity Rate (%)'],
      rows: bankData.states.map(s => [s.name, s.orgCount, s.perCapitaOrgs, s.totalRevenue, s.programExpenseRatio, s.foodInsecurityRate])
    }));

    // State deep-dive selector
    initStateSelector('state-selector-container', (stateCode) => {
      const chart = echarts.getInstanceByDom(document.getElementById('chart-density-map'));
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
