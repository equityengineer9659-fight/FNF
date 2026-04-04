/**
 * @fileoverview Food Access & Deserts Dashboard — ECharts visualizations
 * @description Interactive charts: food desert map, urban vs rural, distance,
 *              vehicle access scatter, low-income/low-access overlap.
 */

import {
  echarts, COLORS, TOOLTIP_STYLE, MAP_PALETTES,
  fmtNum, animateCounters, createChart, linearRegression,
  initScrollReveal, handleResize, updateFreshness,
  REGIONS, REGION_COLORS, getRegion
} from './shared/dashboard-utils.js';

const PAL = MAP_PALETTES.access;

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
      inRange: { color: [PAL.low, PAL.mid, PAL.high] },
      textStyle: { color: COLORS.text }
    },
    series: [{
      name: 'Food Desert Rate', type: 'map', map: 'USA-access', roam: false,
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

  const byRegion = {};
  Object.keys(REGION_COLORS).forEach(r => { byRegion[r] = []; });
  points.forEach(p => byRegion[getRegion(p.name)].push(p));

  const reg = linearRegression(points.map(p => p.value));
  const xs = points.map(p => p.value[0]);
  const xMin = Math.min(...xs), xMax = Math.max(...xs);
  const rLine = {
    symbol: 'none', silent: true,
    lineStyle: { color: 'rgba(255,255,255,0.35)', type: 'dashed', width: 1.5 },
    data: [[{ coord: [xMin, reg.slope * xMin + reg.intercept] }, { coord: [xMax, reg.slope * xMax + reg.intercept] }]],
    label: { formatter: `r = ${reg.r.toFixed(2)}`, color: COLORS.textMuted, fontSize: 11, position: 'end' }
  };

  const series = Object.entries(REGION_COLORS).map(([region, color], i) => ({
    name: region, type: 'scatter',
    data: byRegion[region],
    symbolSize: (_, params) => Math.max(8, Math.sqrt(params.data.population / 200000)),
    itemStyle: { color, opacity: 0.85 },
    emphasis: { itemStyle: { opacity: 1 } },
    animationDuration: 2000,
    ...(i === 0 ? { markLine: rLine } : {})
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
        return `<strong>${d.name}</strong> <span style="color:${REGION_COLORS[region]}">(${region})</span><br/>No Vehicle: ${d.value[0]}%<br/>Food Deserts: ${d.value[1]}%<br/>Population: ${fmtNum(d.population)}`;
      }
    },
    grid: { left: 55, right: 20, top: 35, bottom: 50 },
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
    series
  });
}

// -- Chart 5: Low-Income + Low-Access (Treemap) --
function renderDoubleBurden(states) {
  const chart = createChart('chart-double-burden');
  if (!chart) return;

  // Color states by severity — darker shades so white labels are always readable
  function severityColor(pct) {
    if (pct >= 10) return '#9f1239';   // severe — deep rose
    if (pct >= 8) return '#b45309';    // high — dark amber
    if (pct >= 6) return '#a16207';    // moderate — dark gold
    if (pct >= 4) return '#166534';    // mild — dark green
    return '#115e59';                  // low — dark teal
  }

  // Flatten into a single level — region identity shown via border color + label
  const flatData = [];
  Object.entries(REGIONS).forEach(([region, stateNames]) => {
    states
      .filter(s => stateNames.includes(s.name))
      .forEach(s => {
        const pct = (s.lowIncomeLowAccessPop / s.population) * 100;
        flatData.push({
          name: s.name, value: s.lowIncomeLowAccessPop,
          pctOfPop: pct.toFixed(1),
          population: s.population,
          lowAccessPct: s.lowAccessPct,
          region,
          itemStyle: {
            color: severityColor(pct),
            borderColor: REGION_COLORS[region],
            borderWidth: 1.5
          }
        });
      });
  });
  flatData.sort((a, b) => b.value - a.value);

  chart.setOption({
    tooltip: {
      ...TOOLTIP_STYLE,
      formatter: p => {
        const d = p.data;
        return `<strong>${p.name}</strong> <span style="color:${REGION_COLORS[d.region]}">(${d.region})</span><br/>
          <span style="color:${COLORS.secondary}">Double Burden:</span> <strong>${fmtNum(p.value)}</strong><br/>
          Share of State Pop: <strong>${d.pctOfPop}%</strong><br/>
          State Population: ${fmtNum(d.population)}<br/>
          Low-Access Tracts: ${d.lowAccessPct}%`;
      }
    },
    series: [{
      type: 'treemap', data: flatData, roam: false,
      width: '98%', height: '95%', top: 5, left: '1%',
      label: {
        show: true, color: '#fff',
        formatter: p => `{name|${p.name}}\n{val|${fmtNum(p.value)}  ${p.data.pctOfPop}%}`,
        rich: {
          name: { fontSize: 12, fontWeight: 'bold', color: '#fff', lineHeight: 16 },
          val: { fontSize: 10, color: 'rgba(255,255,255,0.8)', lineHeight: 14 }
        },
        overflow: 'truncate',
        ellipsis: '..'
      },
      itemStyle: { borderColor: 'rgba(0,0,0,0.3)', borderWidth: 1, gapWidth: 1 },
      animationDuration: 1500
    }]
  });

  // Populate region legend
  const legendEl = document.getElementById('treemap-legend-access');
  if (legendEl) {
    legendEl.innerHTML = Object.entries(REGION_COLORS).map(([region, color]) =>
      `<span><span class="legend-swatch" style="background:${color}"></span>${region}</span>`
    ).join('');
  }
}

// -- Accessible Data Table --
function populateAccessibleTable(states) {
  const tbody = document.getElementById('accessible-access-table');
  if (!tbody) return;
  states.forEach(s => {
    const tr = document.createElement('tr');
    tr.innerHTML = `<td>${s.name}</td><td>${s.lowAccessPct}%</td><td>${s.urbanLowAccess}</td><td>${s.ruralLowAccess}</td><td>${s.avgDistance}</td><td>${s.noVehiclePct}%</td><td>${fmtNum(s.lowIncomeLowAccessPop)}</td>`;
    tbody.appendChild(tr);
  });
}

// -- Init --
// -- Chart 6: SDOH Housing Burden vs Food Access (live Census data, non-blocking) --
async function fetchSDOHAccess(accessStates) {
  try {
    const res = await fetch('/api/dashboard-sdoh.php');
    if (!res.ok) return;
    const sdoh = await res.json();
    if (sdoh.error || !sdoh.states) return;

    const section = document.getElementById('section-sdoh-access');
    if (section) section.style.display = '';

    const chart = createChart('chart-sdoh-access');
    if (!chart) return;

    // Build lookup from food access atlas data
    const accessByName = {};
    accessStates.forEach(s => { accessByName[s.name] = s; });

    const points = sdoh.states
      .map(s => {
        const a = accessByName[s.name];
        if (!a) return null;
        return {
          value: [s.housingBurdenPct, a.lowAccessPct],
          name: s.name,
          population: s.population,
          noVehicle: s.noVehiclePct,
          uninsured: s.uninsuredPct
        };
      })
      .filter(Boolean);

    const byRegion = {};
    Object.keys(REGION_COLORS).forEach(r => { byRegion[r] = []; });
    points.forEach(p => byRegion[getRegion(p.name)].push(p));

    const reg = linearRegression(points.map(p => p.value));
    const xs = points.map(p => p.value[0]);
    const xMin = Math.min(...xs), xMax = Math.max(...xs);
    const rLine = {
      symbol: 'none', silent: true,
      lineStyle: { color: 'rgba(255,255,255,0.35)', type: 'dashed', width: 1.5 },
      data: [[{ coord: [xMin, reg.slope * xMin + reg.intercept] }, { coord: [xMax, reg.slope * xMax + reg.intercept] }]],
      label: { formatter: `r = ${reg.r.toFixed(2)}`, color: COLORS.textMuted, fontSize: 11, position: 'end' }
    };

    const series = Object.entries(REGION_COLORS).map(([region, color], i) => ({
      name: region, type: 'scatter',
      data: byRegion[region],
      symbolSize: (_, params) => Math.max(8, Math.sqrt(params.data.population / 200000)),
      itemStyle: { color, opacity: 0.85 },
      emphasis: { itemStyle: { opacity: 1 } },
      animationDuration: 1500,
      ...(i === 0 ? { markLine: rLine } : {})
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
          return `<strong>${d.name}</strong> <span style="color:${REGION_COLORS[region]}">(${region})</span><br/>` +
            `Housing Burden (50%+): ${d.value[0]}%<br/>` +
            `Food Deserts: ${d.value[1]}%<br/>` +
            `No Vehicle: ${d.noVehicle}%<br/>` +
            `Uninsured: ${d.uninsured}%`;
        }
      },
      grid: { left: 55, right: 20, top: 35, bottom: 50 },
      xAxis: {
        name: 'Severe Housing Cost Burden (%)', nameLocation: 'center', nameGap: 35,
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
      series
    });

    const insightEl = document.getElementById('sdoh-access-insight');
    if (insightEl) {
      const strength = Math.abs(reg.r) >= 0.7 ? 'Strong' : Math.abs(reg.r) >= 0.4 ? 'Moderate' : 'Weak';
      insightEl.textContent = `${strength} correlation (r = ${reg.r.toFixed(2)}) between housing cost burden and food desert prevalence. States where renters are most cost-burdened tend to have more food access challenges.`;
    }

    updateFreshness('sdoh-access', sdoh);
  } catch { /* SDOH is optional — fail silently */ }
}

async function init() {
  try {
    const [accessRes, geoRes] = await Promise.all([
      fetch('/data/food-access-atlas.json'),
      fetch('/data/us-states-geo.json')
    ]);
    if (!accessRes.ok || !geoRes.ok) throw new Error('Failed to load data');
    const [accessData, geoJSON] = await Promise.all([accessRes.json(), geoRes.json()]);

    animateCounters();
    updateFreshness('access', { _static: true, _dataYear: 2019 });
    renderDesertMap(geoJSON, accessData.states);
    renderUrbanRural(accessData.states);
    renderDistance(accessData.states);
    renderVehicle(accessData.states);
    renderDoubleBurden(accessData.states);
    populateAccessibleTable(accessData.states);
    initScrollReveal();
    window.addEventListener('resize', handleResize);

    // Non-blocking: fetch live SDOH data for housing burden chart
    fetchSDOHAccess(accessData.states);
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
