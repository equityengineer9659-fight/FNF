/**
 * @fileoverview Food Prices & Affordability Dashboard — ECharts visualizations
 * @description Interactive charts: food CPI by category, regional comparison,
 *              affordability map, cost burden by income, home vs away trends.
 */

import {
  echarts, COLORS, TOOLTIP_STYLE, MAP_PALETTES,
  animateCounters, createChart,
  updateFreshness, initScrollReveal, handleResize, addExportButton,
  initStateSelector, US_STATES
} from './shared/dashboard-utils.js';

const PAL = MAP_PALETTES.prices;

// -- Chart 1: Food Prices by Category (Overlapping Lines with Area) --
function renderCategories(data) {
  const chart = createChart('chart-categories');
  if (!chart || !data.series) return;

  const series = data.series.map(s => ({ ...s, data: s.data.filter(d => d.value !== null) }));
  const dates = series[0].data.map(d => d.date);
  const lineColors = [COLORS.accent, COLORS.secondary, '#a78bfa', '#34d399', '#f59e0b', '#ec4899', COLORS.primary];
  const areaColors = [
    ['rgba(255,107,53,0.2)', 'rgba(255,107,53,0.02)'],
    ['rgba(0,212,255,0.2)', 'rgba(0,212,255,0.02)'],
    ['rgba(167,139,250,0.2)', 'rgba(167,139,250,0.02)'],
    ['rgba(52,211,153,0.2)', 'rgba(52,211,153,0.02)'],
    ['rgba(245,158,11,0.2)', 'rgba(245,158,11,0.02)'],
    ['rgba(236,72,153,0.2)', 'rgba(236,72,153,0.02)'],
    ['rgba(1,118,211,0.15)', 'rgba(1,118,211,0.02)']
  ];

  chart.setOption({
    tooltip: {
      trigger: 'axis', ...TOOLTIP_STYLE,
      formatter: params => { let tip = `<strong>${params[0].axisValue}</strong><br/>`; params.forEach(p => { tip += `${p.marker} ${p.seriesName}: <strong>${p.value}</strong><br/>`; }); return tip; }
    },
    legend: { data: series.map(s => s.name), textStyle: { color: COLORS.text, fontSize: 10 }, top: 5 },
    grid: { left: 50, right: 20, top: 45, bottom: 30 },
    xAxis: { type: 'category', data: dates, boundaryGap: false, axisLabel: { color: COLORS.textMuted, rotate: 45, fontSize: 10 }, axisLine: { lineStyle: { color: COLORS.gridLine } } },
    yAxis: { type: 'value', name: 'CPI Index', nameTextStyle: { color: COLORS.textMuted }, axisLabel: { color: COLORS.textMuted }, splitLine: { lineStyle: { color: COLORS.gridLine } } },
    series: series.map((s, i) => ({
      name: s.name, type: 'line', smooth: true, symbol: 'none',
      lineStyle: { width: 2, color: lineColors[i] },
      areaStyle: { color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [{ offset: 0, color: areaColors[i][0] }, { offset: 1, color: areaColors[i][1] }]) },
      emphasis: { focus: 'series' },
      data: s.data.map(d => d.value), animationDuration: 2000
    }))
  });
}

// -- Chart 2: Regional Price Comparison (grouped bar) --
function renderRegions(data) {
  const chart = createChart('chart-regions');
  if (!chart || !data.series) return;

  // Use most recent data point for each region
  const regionColors = ['#60a5fa', '#f59e0b', '#34d399', '#a78bfa'];
  const regions = data.series.map(s => s.name);
  const latestValues = data.series.map(s => s.data[s.data.length - 1].value);
  const latestYear = data.series[0]?.data.at(-1)?.date?.slice(0, 4) ?? new Date().getFullYear().toString();

  // Also show 2020 values for comparison
  const startValues = data.series.map(s => s.data[0].value);
  const changesPct = latestValues.map((v, i) => ((v - startValues[i]) / startValues[i] * 100).toFixed(1));

  chart.setOption({
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
      ...TOOLTIP_STYLE,
      formatter: params => {
        const region = params[0].name;
        const idx = regions.indexOf(region);
        let tip = `<strong>${region}</strong><br/>`;
        params.forEach(p => {
          tip += `${p.marker} ${p.seriesName}: <strong>${p.value}</strong><br/>`;
        });
        if (idx >= 0) {
          const baseMealCost = 3.99;
          const dollarImpact = (baseMealCost * changesPct[idx] / 100).toFixed(2);
          tip += `<span style="color:${COLORS.secondary}">Change: +${changesPct[idx]}%</span><br/>`;
          tip += `<span style="color:${COLORS.accent}">Impact: +$${dollarImpact}/meal since 2020</span>`;
        }
        return tip;
      }
    },
    legend: {
      data: ['Jan 2020', `Latest (${latestYear})`],
      textStyle: { color: COLORS.text },
      top: 5
    },
    grid: { left: 100, right: 20, top: 40, bottom: 30 },
    xAxis: {
      type: 'value',
      name: 'CPI Index',
      nameTextStyle: { color: COLORS.textMuted },
      axisLabel: { color: COLORS.textMuted },
      splitLine: { lineStyle: { color: COLORS.gridLine } }
    },
    yAxis: {
      type: 'category',
      data: regions,
      axisLabel: { color: COLORS.text, fontSize: 12 },
      axisLine: { lineStyle: { color: COLORS.gridLine } }
    },
    series: [
      {
        name: 'Jan 2020',
        type: 'bar',
        data: startValues,
        barWidth: '30%',
        itemStyle: {
          borderRadius: [0, 3, 3, 0],
          color: 'rgba(255,255,255,0.35)'
        },
        animationDuration: 1500
      },
      {
        name: `Latest (${latestYear})`,
        type: 'bar',
        data: latestValues,
        barWidth: '30%',
        label: {
          show: true,
          position: 'right',
          color: COLORS.secondary,
          fontSize: 11,
          formatter: (params) => `+${changesPct[params.dataIndex]}%`
        },
        itemStyle: {
          borderRadius: [0, 4, 4, 0],
          color: (params) => regionColors[params.dataIndex]
        },
        animationDuration: 1500,
        animationDelay: 200
      }
    ]
  });
}

// -- Chart 3: Affordability Index Map (choropleth) --
function renderAffordabilityMap(geoJSON, stateData) {
  const chart = createChart('chart-affordability-map');
  if (!chart) return;

  const albersProjection = {
    project: (point) => point,
    unproject: (point) => point
  };

  echarts.registerMap('USA-afford', geoJSON);

  const mapData = stateData.map(s => ({
    name: s.name,
    value: s.index,
    mealCost: s.mealCost,
    medianIncome: s.medianIncome
  }));

  chart.setOption({
    tooltip: {
      trigger: 'item',
      ...TOOLTIP_STYLE,
      formatter: params => {
        const d = params.data;
        if (!d) return '';
        return `<strong style="font-size:14px">${d.name}</strong><br/>
          <span style="color:${COLORS.secondary}">Affordability Index:</span> ${d.value.toFixed(1)}<br/>
          Avg Meal Cost: $${d.mealCost}<br/>
          Median Income: $${d.medianIncome.toLocaleString()}<br/>
          <span style="color:${COLORS.textMuted};font-size:11px">Higher index = less affordable</span>`;
      }
    },
    visualMap: {
      left: 'right',
      bottom: 20,
      min: 45,
      max: 75,
      text: ['Less Affordable', 'More Affordable'],
      calculable: true,
      inRange: { color: [PAL.low, PAL.mid, PAL.high] },
      textStyle: { color: COLORS.text }
    },
    series: [{
      name: 'Affordability Index',
      type: 'map',
      map: 'USA-afford',
      roam: false,
      projection: albersProjection,
      aspectScale: 1,
      zoom: 1.1,
      top: 10,
      left: 'center',
      emphasis: {
        label: { show: true, color: COLORS.text, fontSize: 12, fontWeight: 'bold' },
        itemStyle: { areaColor: COLORS.secondary, borderColor: '#fff', borderWidth: 1.5 }
      },
      itemStyle: {
        borderColor: COLORS.mapBorder,
        borderWidth: COLORS.mapBorderWidth,
        areaColor: 'rgba(255,255,255,0.08)'
      },
      label: { show: false },
      data: mapData,
      animationDurationUpdate: 500
    }]
  }, true);
}

// -- Chart 4: Cost Burden by Income (Sunburst) --
function renderBurden(quintiles) {
  const chart = createChart('chart-burden');
  if (!chart) return;

  const sunburstColors = [PAL.high, '#f97316', PAL.mid, '#60a5fa', PAL.low];
  const data = quintiles.map((qi, i) => ({
    name: qi.label, value: qi.foodSharePct,
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
      type: 'sunburst', data: data, radius: ['15%', '80%'],
      label: { show: true, color: '#fff', fontSize: 10 },
      itemStyle: { borderColor: 'rgba(0,0,0,0.4)', borderWidth: 1.5 },
      emphasis: { focus: 'ancestor' },
      levels: [
        {},
        { r0: '15%', r: '50%', label: { fontSize: 12, fontWeight: 'bold', rotate: 'radial' } },
        { r0: '50%', r: '80%', label: { fontSize: 9, rotate: 'tangential' } }
      ],
      animationDuration: 2000
    }]
  });
}

// -- Chart 5: Food at Home vs Away Trends (line) --
function renderHomeVsAway(blsData) {
  const chart = createChart('chart-home-vs-away');
  if (!chart || !blsData || !blsData.series) return;

  const filterNulls = s => s ? { ...s, data: s.data.filter(d => d.value !== null) } : s;
  const foodHome = filterNulls(blsData.series.find(s => s.name === 'Food at Home'));
  const foodAway = filterNulls(blsData.series.find(s => s.name === 'Food Away from Home'));
  const allItems = filterNulls(blsData.series.find(s => s.name === 'All Items'));

  if (!foodHome) return;

  // Build lookup for YoY calculation
  const seriesMap = { 'Food at Home': foodHome, 'Food Away from Home': foodAway, 'All Items': allItems };

  chart.setOption({
    tooltip: {
      trigger: 'axis',
      ...TOOLTIP_STYLE,
      formatter: params => {
        let tip = `<strong>${params[0].axisValue}</strong><br/>`;
        params.forEach(p => {
          let yoyStr = '';
          const src = seriesMap[p.seriesName];
          if (src && p.dataIndex >= 12) {
            const priorVal = src.data[p.dataIndex - 12].value;
            const yoyPct = ((p.value - priorVal) / priorVal * 100).toFixed(1);
            yoyStr = ` <span style="color:${Number(yoyPct) >= 0 ? COLORS.accent : '#22c55e'}">(${Number(yoyPct) >= 0 ? '+' : ''}${yoyPct}% YoY)</span>`;
          }
          tip += `${p.marker} ${p.seriesName}: <strong>${p.value}</strong>${yoyStr}<br/>`;
        });
        return tip;
      }
    },
    legend: {
      data: ['Food at Home', 'Food Away from Home', 'All Items'],
      textStyle: { color: COLORS.text },
      top: 5
    },
    grid: { left: 50, right: 20, top: 45, bottom: 60 },
    dataZoom: [{
      type: 'inside',
      start: 30,
      end: 100
    }, {
      type: 'slider',
      start: 30,
      end: 100,
      height: 20,
      bottom: 10,
      textStyle: { color: COLORS.textMuted },
      borderColor: COLORS.gridLine,
      fillerColor: 'rgba(0,212,255,0.1)'
    }],
    xAxis: {
      type: 'category',
      data: foodHome.data.map(d => d.date),
      axisLabel: { color: COLORS.textMuted, rotate: 45, fontSize: 10 },
      axisLine: { lineStyle: { color: COLORS.gridLine } }
    },
    yAxis: {
      type: 'value',
      name: 'CPI Index',
      nameTextStyle: { color: COLORS.textMuted },
      axisLabel: { color: COLORS.textMuted },
      splitLine: { lineStyle: { color: COLORS.gridLine } }
    },
    series: [
      {
        name: 'Food at Home',
        type: 'line',
        data: foodHome.data.map(d => d.value),
        smooth: true,
        lineStyle: { width: 3, color: COLORS.accent },
        itemStyle: { color: COLORS.accent },
        symbol: 'none',
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: 'rgba(255,107,53,0.2)' },
            { offset: 1, color: 'rgba(255,107,53,0.01)' }
          ])
        }
      },
      ...(foodAway ? [{
        name: 'Food Away from Home',
        type: 'line',
        data: foodAway.data.map(d => d.value),
        smooth: true,
        lineStyle: { width: 2.5, color: COLORS.secondary },
        itemStyle: { color: COLORS.secondary },
        symbol: 'none',
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: 'rgba(0,212,255,0.12)' },
            { offset: 1, color: 'rgba(0,212,255,0.01)' }
          ])
        }
      }] : []),
      ...(allItems ? [{
        name: 'All Items',
        type: 'line',
        data: allItems.data.map(d => d.value),
        smooth: true,
        lineStyle: { width: 1.5, color: 'rgba(255,255,255,0.3)', type: 'dashed' },
        itemStyle: { color: 'rgba(255,255,255,0.3)' },
        symbol: 'none'
      }] : [])
    ]
  });
}

// -- Chart 6: Year-over-Year Inflation Rate --
function renderYoYInflation(blsData) {
  const chart = createChart('chart-yoy-inflation');
  if (!chart || !blsData?.series) return;

  const foodHome = blsData.series.find(s => s.name === 'Food at Home');
  const foodAway = blsData.series.find(s => s.name === 'Food Away from Home');
  const allItems = blsData.series.find(s => s.name === 'All Items');
  if (!foodHome) return;

  // Compute YoY % for each series (skip first 12 months)
  function computeYoY(series) {
    if (!series) return null;
    const data = series.data.filter(d => d.value !== null);
    return data.slice(12).map((d, i) => {
      const prior = data[i].value;
      return { date: d.date, value: +((d.value - prior) / prior * 100).toFixed(1) };
    });
  }

  const homeYoY = computeYoY(foodHome);
  const awayYoY = computeYoY(foodAway);
  const allYoY = computeYoY(allItems);

  const dates = homeYoY.map(d => d.date);

  chart.setOption({
    tooltip: {
      trigger: 'axis', ...TOOLTIP_STYLE,
      formatter: params => {
        let tip = `<strong>${params[0].axisValue}</strong><br/>`;
        params.forEach(p => {
          const sign = p.value >= 0 ? '+' : '';
          tip += `${p.marker} ${p.seriesName}: <strong>${sign}${p.value}%</strong><br/>`;
        });
        return tip;
      }
    },
    legend: {
      data: ['Food at Home', 'Food Away from Home', 'All Items'],
      textStyle: { color: COLORS.text }, top: 5
    },
    grid: { left: 50, right: 20, top: 40, bottom: 30 },
    xAxis: {
      type: 'category', data: dates,
      axisLabel: { color: COLORS.textMuted, rotate: 45, fontSize: 10 },
      axisLine: { lineStyle: { color: COLORS.gridLine } }
    },
    yAxis: {
      type: 'value', name: 'YoY Change (%)',
      nameTextStyle: { color: COLORS.textMuted },
      axisLabel: { color: COLORS.textMuted, formatter: '{value}%' },
      splitLine: { lineStyle: { color: COLORS.gridLine } }
    },
    series: [
      {
        name: 'Food at Home', type: 'line',
        data: homeYoY.map(d => d.value), smooth: true, symbol: 'none',
        lineStyle: { width: 3, color: COLORS.accent },
        itemStyle: { color: COLORS.accent },
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: 'rgba(255,107,53,0.15)' },
            { offset: 1, color: 'rgba(255,107,53,0)' }
          ])
        }
      },
      ...(awayYoY ? [{
        name: 'Food Away from Home', type: 'line',
        data: awayYoY.map(d => d.value), smooth: true, symbol: 'none',
        lineStyle: { width: 2.5, color: COLORS.secondary },
        itemStyle: { color: COLORS.secondary }
      }] : []),
      ...(allYoY ? [{
        name: 'All Items', type: 'line',
        data: allYoY.map(d => d.value), smooth: true, symbol: 'none',
        lineStyle: { width: 1.5, color: 'rgba(255,255,255,0.3)', type: 'dashed' },
        itemStyle: { color: 'rgba(255,255,255,0.3)' }
      }] : [])
    ]
  });

  // Dynamic insight
  const peak = homeYoY.reduce((max, d) => d.value > max.value ? d : max, homeYoY[0]);
  const latest = homeYoY.at(-1);
  const insightEl = document.getElementById('yoy-insight');
  if (insightEl) {
    insightEl.textContent = `Food-at-home inflation peaked at ${peak.value}% in ${peak.date} — the highest since the early 1980s. As of ${latest.date}, it has cooled to ${latest.value}%.`;
  }
}

// -- FRED item-level CPI overlay series for purchasing power chart --
const FRED_CPI_ITEMS = [
  { id: 'CUUR0000SEFG01', label: 'Eggs', color: '#fbbf24' },
  { id: 'CUUR0000SEFB01', label: 'Bread', color: '#a78bfa' },
  { id: 'CUUR0000SEFD01', label: 'Ground Beef', color: '#f87171' },
  { id: 'CUUR0000SEFJ01', label: 'Dairy', color: '#60a5fa' }
];

// Track active FRED overlays and the purchasing power chart instance
let ppChartInstance = null;
let ppBaseOption = null;
let activeFredOverlays = new Map();

async function fetchFredCpiItem(seriesId) {
  try {
    const res = await fetch(`/api/dashboard-fred.php?type=cpi-item&series=${seriesId}`);
    if (!res.ok) return null;
    const data = await res.json();
    if (data.error || !data.observations) return null;
    return data.observations;
  } catch { return null; }
}

function toggleFredOverlay(item, btn) {
  if (!ppChartInstance || !ppBaseOption) return;

  if (activeFredOverlays.has(item.id)) {
    // Remove overlay
    activeFredOverlays.delete(item.id);
    btn.setAttribute('aria-pressed', 'false');
    btn.classList.remove('active');
    rebuildPurchasingPowerSeries();
    return;
  }

  // Fetch and add overlay
  btn.textContent = item.label + '...';
  fetchFredCpiItem(item.id).then(observations => {
    btn.textContent = item.label;
    if (!observations || observations.length === 0) return;

    // Index to earliest available value = 100
    const baseline = observations[0].value;
    const indexed = observations.map(d => ({
      date: d.date.slice(0, 7), // YYYY-MM
      value: +(d.value / baseline * 100).toFixed(1)
    }));

    activeFredOverlays.set(item.id, { ...item, data: indexed });
    btn.setAttribute('aria-pressed', 'true');
    btn.classList.add('active');
    rebuildPurchasingPowerSeries();
  });
}

function rebuildPurchasingPowerSeries() {
  if (!ppChartInstance || !ppBaseOption) return;

  const option = JSON.parse(JSON.stringify(ppBaseOption));

  // Add FRED overlays
  activeFredOverlays.forEach((overlay) => {
    const dates = option.xAxis[0]?.data || option.xAxis?.data || [];
    const dataMap = {};
    overlay.data.forEach(d => { dataMap[d.date] = d.value; });

    const values = dates.map(date => dataMap[date] !== undefined ? dataMap[date] : null);

    option.legend.data.push(overlay.label);
    option.series.push({
      name: overlay.label,
      type: 'line',
      data: values,
      smooth: true,
      symbol: 'none',
      connectNulls: true,
      lineStyle: { width: 2, color: overlay.color, type: 'dotted' },
      itemStyle: { color: overlay.color }
    });
  });

  ppChartInstance.setOption(option, true);
}

// -- Chart 7: SNAP Purchasing Power --
function renderPurchasingPower(blsData) {
  const chart = createChart('chart-purchasing-power');
  if (!chart || !blsData?.series) return;

  const foodHome = blsData.series.find(s => s.name === 'Food at Home');
  if (!foodHome) return;

  const data = foodHome.data.filter(d => d.value !== null);
  if (data.length === 0) return;

  // Index food CPI to Jan 2018 = 100
  const baseline = data[0].value; // Jan 2018
  const foodIndexed = data.map(d => ({
    date: d.date,
    value: +(d.value / baseline * 100).toFixed(1)
  }));

  // SNAP benefit timeline (key inflection points, nominal $/person/month)
  // Source: USDA FNS historical data
  const snapBenefits = [
    { date: '2018-01', value: 126 }, { date: '2018-06', value: 126 }, { date: '2018-12', value: 126 },
    { date: '2019-01', value: 129 }, { date: '2019-06', value: 129 }, { date: '2019-12', value: 129 },
    { date: '2020-01', value: 131 }, { date: '2020-03', value: 131 },
    { date: '2020-04', value: 234 }, // Emergency allotments begin (avg ~$234)
    { date: '2020-06', value: 234 }, { date: '2020-12', value: 234 },
    { date: '2021-01', value: 234 }, { date: '2021-06', value: 234 },
    { date: '2021-10', value: 258 }, // Thrifty Food Plan reevaluation
    { date: '2021-12', value: 258 },
    { date: '2022-01', value: 258 }, { date: '2022-06', value: 258 }, { date: '2022-12', value: 258 },
    { date: '2023-01', value: 258 },
    { date: '2023-03', value: 258 },
    { date: '2023-04', value: 194 }, // Emergency allotments end
    { date: '2023-06', value: 194 }, { date: '2023-12', value: 194 },
    { date: '2024-01', value: 194 }, { date: '2024-06', value: 194 }, { date: '2024-12', value: 194 },
    { date: '2025-01', value: 195 }, { date: '2025-06', value: 195 }, { date: '2025-12', value: 195 }
  ];

  // Index SNAP to Jan 2018 = 100
  const snapBaseline = snapBenefits[0].value;
  const snapIndexed = snapBenefits.map(d => ({
    date: d.date,
    value: +(d.value / snapBaseline * 100).toFixed(1)
  }));

  // Align on food CPI dates, interpolate SNAP
  const snapMap = {};
  snapIndexed.forEach(d => { snapMap[d.date] = d.value; });
  let lastSnap = 100;
  const alignedSnap = foodIndexed.map(d => {
    if (snapMap[d.date] !== undefined) lastSnap = snapMap[d.date];
    return lastSnap;
  });

  const dates = foodIndexed.map(d => d.date);

  const option = {
    tooltip: {
      trigger: 'axis', ...TOOLTIP_STYLE,
      formatter: params => {
        let tip = `<strong>${params[0].axisValue}</strong><br/>`;
        params.forEach(p => {
          if (p.value === null || p.value === undefined) return;
          const diff = p.value - 100;
          const sign = diff >= 0 ? '+' : '';
          tip += `${p.marker} ${p.seriesName}: <strong>${p.value}</strong> (${sign}${diff.toFixed(1)}%)<br/>`;
        });
        const gap = params[0] && params[1] ? (params[0].value - params[1].value).toFixed(1) : null;
        if (gap !== null) tip += `<br/>Gap: <strong>${gap > 0 ? '+' : ''}${gap} points</strong>`;
        return tip;
      }
    },
    legend: {
      data: ['Food Prices (CPI)', 'SNAP Benefits'],
      textStyle: { color: COLORS.text }, top: 5
    },
    grid: { left: 50, right: 20, top: 40, bottom: 30 },
    xAxis: {
      type: 'category', data: dates,
      axisLabel: { color: COLORS.textMuted, rotate: 45, fontSize: 10 },
      axisLine: { lineStyle: { color: COLORS.gridLine } }
    },
    yAxis: {
      type: 'value', name: 'Index (Jan 2018 = 100)',
      nameTextStyle: { color: COLORS.textMuted },
      axisLabel: { color: COLORS.textMuted },
      splitLine: { lineStyle: { color: COLORS.gridLine } }
    },
    series: [
      {
        name: 'Food Prices (CPI)', type: 'line',
        data: foodIndexed.map(d => d.value), smooth: true, symbol: 'none',
        lineStyle: { width: 3, color: COLORS.accent },
        itemStyle: { color: COLORS.accent },
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: 'rgba(255,107,53,0.15)' },
            { offset: 1, color: 'rgba(255,107,53,0)' }
          ])
        }
      },
      {
        name: 'SNAP Benefits', type: 'line',
        data: alignedSnap, symbol: 'none', step: 'end',
        lineStyle: { width: 3, color: '#22c55e' },
        itemStyle: { color: '#22c55e' },
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: 'rgba(34,197,94,0.15)' },
            { offset: 1, color: 'rgba(34,197,94,0)' }
          ])
        }
      }
    ]
  };

  chart.setOption(option);

  // Store for FRED overlay support
  ppChartInstance = chart;
  ppBaseOption = {
    tooltip: option.tooltip,
    legend: { ...option.legend },
    grid: option.grid,
    xAxis: { ...option.xAxis },
    yAxis: option.yAxis,
    series: option.series.map(s => ({ ...s }))
  };

  // Initialize FRED item toggle buttons
  const toggleContainer = document.getElementById('fred-cpi-toggles');
  if (toggleContainer) {
    toggleContainer.innerHTML = '';
    FRED_CPI_ITEMS.forEach(item => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'fred-toggle-btn';
      btn.textContent = item.label;
      btn.setAttribute('aria-pressed', 'false');
      btn.setAttribute('aria-label', `Toggle ${item.label} price overlay`);
      Object.assign(btn.style, {
        borderColor: item.color,
        color: item.color
      });
      btn.addEventListener('click', () => toggleFredOverlay(item, btn));
      toggleContainer.appendChild(btn);
    });
  }

  // Dynamic insight
  const latestFood = foodIndexed.at(-1);
  const latestSnap = alignedSnap.at(-1);
  const gap = (latestFood.value - latestSnap).toFixed(1);
  const insightEl = document.getElementById('purchasing-power-insight');
  if (insightEl) {
    if (gap > 0) {
      insightEl.textContent = `As of ${latestFood.date}, food prices have risen ${(latestFood.value - 100).toFixed(0)}% since 2018 while SNAP benefits have risen ${(latestSnap - 100).toFixed(0)}%. The ${gap}-point gap means SNAP families have lost real purchasing power.`;
    } else {
      insightEl.textContent = `As of ${latestFood.date}, SNAP benefits (${(latestSnap - 100).toFixed(0)}% above 2018) are keeping pace with food prices (${(latestFood.value - 100).toFixed(0)}% above 2018).`;
    }
  }
}

// -- Init --
async function init() {
  try {
    // Load all data in parallel
    const [regionalRes, geoRes, blsRes] = await Promise.all([
      fetch('/data/bls-regional-cpi.json'),
      fetch('/data/us-states-geo.json'),
      fetch('/data/bls-food-cpi.json')
    ]);

    if (!regionalRes.ok || !geoRes.ok) {
      throw new Error('Failed to load dashboard data');
    }

    const [regionalData, geoJSON] = await Promise.all([regionalRes.json(), geoRes.json()]);
    const blsData = blsRes.ok ? await blsRes.json() : null;

    // Animate hero counters
    animateCounters();

    // Chart 1: Food Prices by Category
    renderCategories(regionalData.categories);
    updateFreshness('bls-categories', { _static: true, _dataYear: 'CPI' });

    // Chart 2: Regional Price Comparison
    renderRegions(regionalData.regions);

    // Chart 3: Affordability Map
    renderAffordabilityMap(geoJSON, regionalData.stateAffordability.states);

    // Chart 4: Cost Burden
    renderBurden(regionalData.affordability.quintiles);

    // Chart 5: Home vs Away (uses main BLS data)
    // Chart 6: YoY Inflation Rate
    // Chart 7: SNAP Purchasing Power
    if (blsData) {
      renderHomeVsAway(blsData);
      renderYoYInflation(blsData);
      renderPurchasingPower(blsData);
      updateFreshness('bls-regional', { _static: true, _dataYear: 'CPI' });
    }

    addExportButton('chart-affordability-map', 'food-affordability-by-state.csv', () => ({
      headers: ['State', 'Affordability Index', 'Meal Cost ($)', 'Median Income ($)'],
      rows: regionalData.stateAffordability.states.map(s => [s.name, s.index, s.mealCost, s.medianIncome])
    }));

    // State deep-dive selector
    initStateSelector('state-selector-container', (stateCode) => {
      const chart = echarts.getInstanceByDom(document.getElementById('chart-affordability-map'));
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

    // Scroll reveal
    initScrollReveal();

    // Responsive
    window.addEventListener('resize', handleResize);

    // Try live BLS data (non-blocking upgrades)
    fetchLiveBLS();
    fetchLiveRegional();

  } catch (err) {
    document.querySelectorAll('.dashboard-chart').forEach(el => {
      el.innerHTML = '<p style="color: rgba(255,255,255,0.5); text-align: center; padding: 2rem;">Unable to load dashboard data. Please refresh the page.</p>';
    });
  }
}

// Non-blocking: try live BLS API for fresher home vs away data
async function fetchLiveBLS() {
  try {
    const res = await fetch('/api/dashboard-bls.php');
    if (!res.ok) return;
    const liveData = await res.json();
    if (liveData.error || !liveData.series) return;
    renderHomeVsAway(liveData);
    renderYoYInflation(liveData);
    renderPurchasingPower(liveData);
    updateFreshness('bls-regional', liveData);
  } catch { /* PHP proxy unavailable */ }
}

// Non-blocking: try live BLS API for fresher category + regional data
async function fetchLiveRegional() {
  try {
    const res = await fetch('/api/dashboard-bls.php?type=regional');
    if (!res.ok) return;
    const liveData = await res.json();
    if (liveData.error || !liveData.categories || !liveData.regions) return;
    renderCategories(liveData.categories);
    renderRegions(liveData.regions);
    updateFreshness('bls-categories', liveData);
  } catch { /* PHP proxy unavailable — static data already rendered */ }
}

// Start when DOM ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
