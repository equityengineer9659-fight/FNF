/**
 * @fileoverview Food Access & Deserts Dashboard — ECharts visualizations
 * @description Interactive charts: food desert map, urban vs rural, distance,
 *              vehicle access scatter, low-income/low-access overlap.
 */

import {
  echarts, COLORS, TOOLTIP_STYLE, MAP_PALETTES,
  fmtNum, animateCounters, createChart, linearRegression,
  initScrollReveal, handleResize, updateFreshness,
  REGIONS, REGION_COLORS, getRegion, addExportButton,
  initStateSelector, US_STATES
} from './shared/dashboard-utils.js';

const PAL = MAP_PALETTES.access;

/** Get existing chart instance or create new one (safe for re-renders) */
function getOrCreateChart(id) {
  const el = document.getElementById(id);
  if (!el) return null;
  return echarts.getInstanceByDom(el) || createChart(id);
}


// -- Chart 1: Food Desert Map (choropleth) with County Drill-Down --
function renderDesertMap(geoJSON, states, accessData) {
  const chart = getOrCreateChart('chart-desert-map');
  if (!chart) return;

  const albersProjection = { project: p => p, unproject: p => p };
  echarts.registerMap('USA-access', geoJSON);

  let currentView = 'national';

  function stateTooltip(params) {
    const d = params.data;
    if (!d) return '';
    return `<strong style="font-size:14px">${d.name}</strong><br/>
      <span style="color:${COLORS.secondary}">Low-Access Tracts:</span> ${d.value}%<br/>
      Population: ${fmtNum(d.population)}<br/>
      Low-Access Population: ${fmtNum(d.lowAccessPopulation)}<br/>
      Avg Distance: ${d.avgDistance} mi<br/>
      <span style="color:${COLORS.secondary};font-size:11px">Click to see counties</span>`;
  }

  function countyTooltip(params) {
    const d = params.data;
    if (!d) return '';
    // Enhanced tooltip when current food access data is available
    if (d._currentData) {
      let html = `<strong style="font-size:14px">${d.name}</strong><br/>`;
      html += `<span style="color:${COLORS.secondary}">Low-Access Tracts:</span> ${d.lowAccessTracts} of ${d.totalTracts} (${d.value}%)<br/>`;
      if (d.lowAccessPopulation) html += `Low-Access Population: ${fmtNum(d.lowAccessPopulation)}<br/>`;
      if (d.avgDistance) html += `Avg Distance to Store: ${d.avgDistance} mi<br/>`;
      html += `Type: ${d.isUrban ? 'Urban' : 'Rural'}`;
      return html;
    }
    return `<strong style="font-size:14px">${d.name}</strong><br/>
      Population: ${fmtNum(d.population || 0)}<br/>
      ${d.povertyRate != null ? `<span style="color:${COLORS.secondary}">Poverty Rate:</span> ${d.povertyRate}%<br/>` : ''}
      ${d.rate != null ? `Food Insecurity: ${d.rate}%<br/>` : ''}
      ${d.mealCost != null ? `Avg Meal Cost: $${d.mealCost}` : ''}`;
  }

  function showNational() {
    currentView = 'national';
    const mapData = states.map(s => ({
      name: s.name, value: s.lowAccessPct, fips: s.fips,
      population: s.totalPopulation || s.population,
      lowAccessPopulation: s.lowAccessPopulation, avgDistance: s.avgDistance
    }));

    const backBtn = document.getElementById('access-map-back-btn');
    if (backBtn) backBtn.style.display = 'none';
    const mapLabel = document.getElementById('access-map-state-label');
    if (mapLabel) mapLabel.textContent = '';
    const hint = document.querySelector('#chart-desert-map + .dashboard-chart__hint');
    if (hint) hint.textContent = 'Hover for state details \u2014 click any state for county breakdown';

    chart.setOption({
      tooltip: { trigger: 'item', ...TOOLTIP_STYLE, formatter: stateTooltip },
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

  async function drillDown(stateName, stateFips) {
    chart.showLoading({ text: `Loading ${stateName} counties...`, color: COLORS.secondary, textColor: COLORS.text, maskColor: 'rgba(0,0,0,0.6)' });

    try {
      // Always need the GeoJSON for the map geometry
      const geoRes = await fetch(`/data/counties/${stateFips}.json`);
      if (!geoRes.ok) throw new Error(`HTTP ${geoRes.status}`);
      const countyGeo = await geoRes.json();

      // Build county lookup from currentAccessData (consistent with state-level map)
      const stateAccess = accessData?.states?.find(s => s.fips === stateFips);
      const accessByFips = {};
      if (stateAccess?.counties) {
        stateAccess.counties.forEach(c => { accessByFips[c.fips] = c; });
      }
      const hasCurrentAccess = Object.keys(accessByFips).length > 0;

      const mapName = `access-${stateFips}`;
      echarts.registerMap(mapName, countyGeo);

      let countyData, seriesName, vmText, hintText;

      if (hasCurrentAccess) {
        // Use current computed data: low-access tract % per county (consistent with state map)
        countyData = countyGeo.features
          .map(f => {
            const fips5 = f.properties.GEOID || f.properties.fips || '';
            const access = accessByFips[fips5];
            if (!access) return null;
            return {
              name: f.properties.name || f.properties.NAME,
              value: access.lowAccessPct,
              _currentData: true,
              lowAccessTracts: access.lowAccessTracts,
              totalTracts: access.totalTracts,
              lowAccessPopulation: access.lowAccessPopulation,
              avgDistance: access.avgDistance,
              isUrban: access.isUrban
            };
          })
          .filter(Boolean);

        seriesName = 'Low-Access Tracts (%)';
        vmText = ['More Low-Access', 'Less Low-Access'];
        hintText = 'Showing current food desert data (distance-only) \u2014 click Back for state-level view';
      } else {
        // Fallback: poverty rate from static county GeoJSON
        countyData = countyGeo.features
          .filter(f => f.properties.povertyRate)
          .map(f => ({
            name: f.properties.name,
            value: f.properties.povertyRate,
            ...f.properties
          }));

        seriesName = 'Poverty Rate';
        vmText = ['High Poverty', 'Low Poverty'];
        hintText = 'Showing poverty rate as proxy for food access risk \u2014 click Back for state-level food desert data';
      }

      const vals = countyData.map(c => c.value).filter(v => typeof v === 'number');
      const min = Math.floor(Math.min(...vals));
      const max = Math.ceil(Math.max(...vals));

      currentView = stateFips;

      const backBtn = document.getElementById('access-map-back-btn');
      if (backBtn) backBtn.style.display = '';
      const mapLabel = document.getElementById('access-map-state-label');
      if (mapLabel) mapLabel.textContent = stateName;
      const hint = document.querySelector('#chart-desert-map + .dashboard-chart__hint');
      if (hint) hint.textContent = hintText;

      chart.hideLoading();

      chart.setOption({
        tooltip: { trigger: 'item', ...TOOLTIP_STYLE, formatter: countyTooltip },
        visualMap: {
          min, max, text: vmText, calculable: true,
          inRange: { color: [PAL.low, PAL.mid, PAL.high] },
          textStyle: { color: COLORS.text }
        },
        series: [{
          name: seriesName, type: 'map', map: mapName, roam: false,
          projection: albersProjection, aspectScale: 1, zoom: 1, top: 10, left: 'center',
          emphasis: {
            label: { show: true, color: COLORS.text, fontSize: 11, fontWeight: 'bold' },
            itemStyle: { areaColor: COLORS.secondary, borderColor: '#fff', borderWidth: 1 }
          },
          itemStyle: { borderColor: COLORS.countyBorder, borderWidth: COLORS.countyBorderWidth, areaColor: 'rgba(255,255,255,0.05)' },
          label: { show: false }, data: countyData, animationDurationUpdate: 500
        }]
      }, true);
    } catch {
      chart.hideLoading();
    }
  }

  showNational();

  const backBtn = document.getElementById('access-map-back-btn');
  if (backBtn) {
    backBtn.addEventListener('click', () => showNational());
  }

  /** @type {boolean} Set to false to disable click-to-drill-down (e.g., in SNAP view) */
  let drillDownEnabled = true;

  chart.off('click'); // Prevent duplicate listeners on re-render
  chart.on('click', (params) => {
    if (drillDownEnabled && currentView === 'national' && params.data?.fips) {
      drillDown(params.data.name, params.data.fips);
    }
  });

  return { drillDown, showNational, setDrillDown: (v) => { drillDownEnabled = v; } };
}

// -- Chart 2: Urban vs Rural (Donut) --
function renderUrbanRural(states) {
  const chart = getOrCreateChart('chart-urban-rural');
  if (!chart) return;

  // Compute low-access RATE per geography type from county data — honest metric
  // (tract counts are misleading: there are far more urban tracts, so sharing them distorts the story)
  let urbanLATracts = 0, urbanTotalTracts = 0;
  let ruralLATracts = 0, ruralTotalTracts = 0;
  let urbanDistSum = 0, ruralDistSum = 0;

  for (const state of states) {
    for (const county of (state.counties || [])) {
      if (county.isUrban) {
        urbanLATracts += county.lowAccessTracts;
        urbanTotalTracts += county.totalTracts;
        urbanDistSum += county.avgDistance * county.totalTracts;
      } else {
        ruralLATracts += county.lowAccessTracts;
        ruralTotalTracts += county.totalTracts;
        ruralDistSum += county.avgDistance * county.totalTracts;
      }
    }
  }

  const urbanRate = urbanTotalTracts > 0 ? Math.round(urbanLATracts / urbanTotalTracts * 1000) / 10 : 0;
  const ruralRate = ruralTotalTracts > 0 ? Math.round(ruralLATracts / ruralTotalTracts * 1000) / 10 : 0;
  const urbanDist = urbanTotalTracts > 0 ? Math.round(urbanDistSum / urbanTotalTracts * 100) / 100 : 0;
  const ruralDist = ruralTotalTracts > 0 ? Math.round(ruralDistSum / ruralTotalTracts * 100) / 100 : 0;

  chart.setOption({
    tooltip: {
      ...TOOLTIP_STYLE, trigger: 'axis', axisPointer: { type: 'shadow' },
      formatter: params => {
        const geo = params[0].name;
        const rateP = params.find(p => p.seriesName === 'Low-Access Rate');
        const distP = params.find(p => p.seriesName === 'Avg Distance');
        return `<strong>${geo}</strong><br/>
          Low-Access Rate: <strong>${rateP?.value}%</strong> of tracts<br/>
          Avg Distance to Store: <strong>${distP?.value} mi</strong>`;
      }
    },
    legend: { data: ['Low-Access Rate', 'Avg Distance'], textStyle: { color: COLORS.text }, bottom: 0 },
    grid: { left: 60, right: 60, top: 30, bottom: 50 },
    xAxis: {
      type: 'category', data: ['Urban', 'Rural'],
      axisLabel: { color: COLORS.text, fontSize: 13, fontWeight: 'bold' },
      axisLine: { lineStyle: { color: COLORS.gridLine } }
    },
    yAxis: [
      {
        type: 'value', name: 'Low-Access Rate (%)', max: 60,
        nameTextStyle: { color: COLORS.textMuted, fontSize: 10 },
        axisLabel: { color: COLORS.textMuted, formatter: '{value}%' },
        splitLine: { lineStyle: { color: COLORS.gridLine } }
      },
      {
        type: 'value', name: 'Avg Distance (mi)', max: 8,
        nameTextStyle: { color: COLORS.textMuted, fontSize: 10 },
        axisLabel: { color: COLORS.textMuted, formatter: '{value} mi' },
        splitLine: { show: false }
      }
    ],
    series: [
      {
        name: 'Low-Access Rate', type: 'bar', yAxisIndex: 0, barWidth: '28%',
        data: [
          { value: urbanRate, itemStyle: { color: COLORS.primary } },
          { value: ruralRate, itemStyle: { color: COLORS.accent } }
        ],
        label: { show: true, position: 'top', formatter: '{c}%', color: COLORS.text, fontSize: 11 },
        animationDuration: 1800
      },
      {
        name: 'Avg Distance', type: 'bar', yAxisIndex: 1, barWidth: '28%',
        data: [
          { value: urbanDist, itemStyle: { color: 'rgba(0,212,255,0.45)' } },
          { value: ruralDist, itemStyle: { color: 'rgba(255,140,0,0.55)' } }
        ],
        label: { show: true, position: 'top', formatter: '{c} mi', color: COLORS.text, fontSize: 11 },
        animationDuration: 1800
      }
    ]
  });
}

// -- Chart 3: Distance to Store (Gradient Area) --
function renderDistance(states) {
  const chart = getOrCreateChart('chart-distance');
  if (!chart) return;

  // Sort ascending; cap Alaska to keep lower-48 distribution readable
  const sorted = [...states].sort((a, b) => a.avgDistance - b.avgDistance);
  const ALASKA_CAP = 10; // Display cap in miles — Alaska (26.8mi) noted in tooltip
  const names = sorted.map(s => s.name);
  const distances = sorted.map(s => Math.min(s.avgDistance, ALASKA_CAP));
  const rawDistances = sorted.map(s => s.avgDistance);

  chart.setOption({
    tooltip: {
      trigger: 'axis', ...TOOLTIP_STYLE,
      formatter: p => {
        const raw = rawDistances[p[0].dataIndex];
        const capped = raw > ALASKA_CAP ? ` <span style="font-size:10px;color:${COLORS.textMuted}">(capped at ${ALASKA_CAP} mi for scale)</span>` : '';
        return `<strong>${p[0].name}</strong><br/>Avg centroid distance: <strong>${raw} mi</strong>${capped}`;
      }
    },
    grid: { left: 50, right: 20, top: 20, bottom: 40 },
    xAxis: {
      type: 'category', data: names,
      axisLabel: { color: COLORS.textMuted, rotate: 60, fontSize: 8 },
      axisLine: { lineStyle: { color: COLORS.gridLine } }
    },
    yAxis: {
      type: 'value', name: 'Miles', max: ALASKA_CAP,
      nameTextStyle: { color: COLORS.textMuted },
      axisLabel: { color: COLORS.textMuted },
      splitLine: { lineStyle: { color: COLORS.gridLine } }
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
      // No USDA threshold markLine — state averages mix urban+rural so a single threshold is misleading
      animationDuration: 2000
    }]
  });
}

// -- Chart 4: Vehicle Access & Food Deserts (scatter) --
// Note: the negative correlation (r ≈ -0.65) is the finding, not a bug.
// Dense transit-rich states (NY, DC, MA) have high no-vehicle rates but good store proximity.
// Rural states (WV, MS) have low no-vehicle rates because cars are mandatory — yet stores are still far.
// Car ownership alone does not predict food desert risk at the state level.
function renderVehicle(states) {
  const chart = getOrCreateChart('chart-vehicle');
  if (!chart) return;

  const LABEL_STATES = new Set(['Wyoming', 'Montana', 'North Dakota', 'District of Columbia', 'New Jersey']);

  const points = states.map(s => ({
    value: [s.avgDistance, s.lowAccessPct],
    name: s.name, population: s.population,
    label: LABEL_STATES.has(s.name)
      ? { show: true, formatter: s.state || s.name.slice(0, 2).toUpperCase(), color: COLORS.text, fontSize: 9, position: 'right' }
      : { show: false }
  }));

  const byRegion = {};
  Object.keys(REGION_COLORS).forEach(r => { byRegion[r] = []; });
  points.forEach(p => byRegion[getRegion(p.name)].push(p));

  const reg = linearRegression(points.map(p => p.value));
  const xs = points.map(p => p.value[0]);
  const xMin = Math.min(...xs), xMax = Math.max(...xs);
  const rLine = {
    symbol: 'none', silent: true,
    lineStyle: { color: 'rgba(255,255,255,0.3)', type: 'dashed', width: 1.5 },
    data: [[{ coord: [xMin, reg.slope * xMin + reg.intercept] }, { coord: [xMax, reg.slope * xMax + reg.intercept] }]],
    label: { formatter: `r = ${reg.r.toFixed(2)}`, color: COLORS.textMuted, fontSize: 10, position: 'end' }
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
    legend: { top: 5, right: 10, textStyle: { color: COLORS.text, fontSize: 11 }, itemWidth: 10, itemHeight: 10 },
    tooltip: {
      ...TOOLTIP_STYLE,
      formatter: params => {
        const d = params.data;
        const region = getRegion(d.name);
        const note = d.value[0] < 1
          ? `<br/><span style="font-size:10px;color:${COLORS.textMuted}">Dense/urban — stores within walking distance</span>`
          : d.value[0] > 3
            ? `<br/><span style="font-size:10px;color:${COLORS.textMuted}">Rural distance barrier — car essential for food access</span>`
            : '';
        return `<strong>${d.name}</strong> <span style="color:${REGION_COLORS[region]}">(${region})</span><br/>
          Avg Distance to Store: ${d.value[0]} mi<br/>
          Low-Access Tracts: ${d.value[1]}% of tracts<br/>
          Population: ${fmtNum(d.population)}${note}`;
      }
    },
    grid: { left: 55, right: 20, top: 35, bottom: 50 },
    xAxis: {
      name: 'Average Distance to Grocery Store (mi)', nameLocation: 'center', nameGap: 35,
      nameTextStyle: { color: COLORS.textMuted },
      axisLabel: { color: COLORS.textMuted, formatter: '{value} mi' },
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
  const chart = getOrCreateChart('chart-double-burden');
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
  // Estimate low-income low-access pop: low-access population × state poverty rate
  const flatData = [];
  Object.entries(REGIONS).forEach(([region, stateNames]) => {
    states
      .filter(s => stateNames.includes(s.name))
      .forEach(s => {
        const pop = s.totalPopulation || s.population || 0;
        const estimate = Math.round((s.lowAccessPopulation || 0) * ((s.povertyRate || 0) / 100));
        const pct = pop > 0 ? (estimate / pop) * 100 : 0;
        flatData.push({
          name: s.name, value: estimate,
          pctOfPop: pct.toFixed(1),
          population: pop,
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
          <span style="color:${COLORS.secondary}">Low-Income Low-Access (est.):</span> <strong>${fmtNum(p.value)}</strong><br/>
          Share of State Pop: <strong>${d.pctOfPop}%</strong><br/>
          State Population: ${fmtNum(d.population)}<br/>
          Low-Access Tracts: ${d.lowAccessPct}% of tracts`;
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

  // Update insight text with computed national total
  const insightEl = document.getElementById('double-burden-insight');
  if (insightEl && flatData.length) {
    const total = flatData.reduce((sum, s) => sum + s.value, 0);
    const top = flatData[0];
    insightEl.innerHTML = `An estimated <strong>${fmtNum(Math.round(total / 1000000 * 10) / 10)} million Americans</strong> face overlapping low access and low income — these communities face the greatest compounded access and affordability constraints. <strong>${top.name}</strong> leads with ~${fmtNum(top.value)} people (${top.pctOfPop}% of state population).`;
  }
}

// -- Food Insecurity Map (CDC PLACES data, 2023) --
function renderInsecurityMap(geoJSON, cdcRecords) {
  const chart = getOrCreateChart('chart-desert-map');
  if (!chart) return;

  // Map state abbreviations to full names
  const stateNameMap = {};
  US_STATES.forEach(([abbr, name]) => { stateNameMap[abbr] = name; });

  const mapData = cdcRecords
    .filter(r => stateNameMap[r.state])
    .map(r => ({
      name: stateNameMap[r.state],
      value: r.value,
      fips: null // CDC data uses state abbr, not FIPS — drill-down uses different path
    }));

  const albersProjection = { project: p => p, unproject: p => p };

  chart.setOption({
    tooltip: {
      trigger: 'item', ...TOOLTIP_STYLE,
      formatter: params => {
        const d = params.data;
        if (!d) return '';
        return `<strong style="font-size:14px">${d.name}</strong><br/>
          <span style="color:${COLORS.secondary}">Food Insecurity:</span> ${d.value}%<br/>
          <span style="color:${COLORS.secondary};font-size:11px">Source: CDC PLACES 2023</span><br/>
          <span style="color:${COLORS.secondary};font-size:11px">Click for county breakdown</span>`;
      }
    },
    visualMap: {
      left: 'right', bottom: 20, min: 8, max: 25,
      text: ['Higher Insecurity', 'Lower Insecurity'], calculable: true,
      inRange: { color: [PAL.low, PAL.mid, PAL.high] },
      textStyle: { color: COLORS.text }
    },
    series: [{
      name: 'Food Insecurity Rate', type: 'map', map: 'USA-access', roam: false,
      projection: albersProjection, aspectScale: 1, zoom: 1.1, top: 10, left: 'center',
      emphasis: {
        label: { show: true, color: COLORS.text, fontSize: 12, fontWeight: 'bold' },
        itemStyle: { areaColor: COLORS.secondary, borderColor: '#fff', borderWidth: 1.5 }
      },
      itemStyle: { borderColor: COLORS.mapBorder, borderWidth: COLORS.mapBorderWidth, areaColor: 'rgba(255,255,255,0.08)' },
      label: { show: false }, data: mapData, animationDurationUpdate: 500
    }]
  }, true);

  // Dynamic insight
  const sorted = [...mapData].sort((a, b) => b.value - a.value);
  const insightEl = document.getElementById('insecurity-map-insight');
  if (insightEl && sorted.length >= 3) {
    insightEl.innerHTML = `<strong>${sorted[0].name} (${sorted[0].value}%)</strong>, <strong>${sorted[1].name} (${sorted[1].value}%)</strong>, and <strong>${sorted[2].name} (${sorted[2].value}%)</strong> have the highest food insecurity rates — based on 2023 CDC PLACES census-tract data.`;
  }
}

// -- SNAP Retailer Density Map --
function renderSnapRetailers(geoJSON, retailerData, accessStates) {
  // Reuse the desert map chart instance (toggled view)
  const chart = getOrCreateChart('chart-desert-map');
  if (!chart) return;

  echarts.registerMap('USA-snap-retail', geoJSON);

  // Build access lookup for cross-referencing
  const accessByFips = {};
  accessStates.forEach(s => { accessByFips[s.fips] = s; });

  // Inverted access palette: more retailers = greener (good), fewer = orange (concern)
  const palInverted = { low: PAL.high, mid: PAL.mid, high: PAL.low };

  const mapData = retailerData.states.map(s => {
    const access = accessByFips[s.fips] || {};
    const superPct = s.totalRetailers > 0
      ? ((s.supermarkets + s.superStores + s.largeGrocery) / s.totalRetailers * 100).toFixed(1)
      : 0;
    return {
      name: s.name, value: s.retailersPer100K, fips: s.fips,
      totalRetailers: s.totalRetailers,
      supermarkets: s.supermarkets,
      superStores: s.superStores,
      largeGrocery: s.largeGrocery,
      convenience: s.convenience,
      smallGrocery: s.smallGrocery,
      specialty: s.specialty,
      farmersMarkets: s.farmersMarkets,
      population: s.population,
      superPct,
      lowAccessPct: access.lowAccessPct || 'N/A'
    };
  });

  const albersProjection = { project: p => p, unproject: p => p };

  chart.setOption({
    tooltip: {
      trigger: 'item', ...TOOLTIP_STYLE,
      formatter: params => {
        const d = params.data;
        if (!d) return '';
        return `<strong style="font-size:14px">${d.name}</strong><br/>
          <span style="color:${COLORS.secondary}">Retailers per 100K:</span> <strong>${d.value}</strong><br/>
          Total Authorized: ${fmtNum(d.totalRetailers)}<br/>
          <span style="font-size:11px;color:rgba(255,255,255,0.7)">--- Store Types ---</span><br/>
          Supermarkets: ${fmtNum(d.supermarkets)}<br/>
          Super Stores: ${fmtNum(d.superStores)}<br/>
          Large Grocery: ${fmtNum(d.largeGrocery)}<br/>
          Convenience: ${fmtNum(d.convenience)}<br/>
          Small Grocery: ${fmtNum(d.smallGrocery)}<br/>
          Farmers Markets: ${fmtNum(d.farmersMarkets)}<br/>
          <span style="color:${COLORS.secondary}">Full-Service Stores:</span> ${d.superPct}%<br/>
          <span style="color:rgba(255,255,255,0.5)">Food Deserts: ${d.lowAccessPct}%</span>`;
      }
    },
    visualMap: {
      left: 'right', bottom: 20,
      min: 58, max: 125,
      text: ['More Retailers', 'Fewer Retailers'], calculable: true,
      inRange: { color: [palInverted.low, palInverted.mid, palInverted.high] },
      textStyle: { color: COLORS.text }
    },
    series: [{
      name: 'SNAP Retailers per 100K', type: 'map', map: 'USA-snap-retail', roam: false,
      projection: albersProjection, aspectScale: 1, zoom: 1.1, top: 10, left: 'center',
      emphasis: {
        label: { show: true, color: COLORS.text, fontSize: 12, fontWeight: 'bold' },
        itemStyle: { areaColor: COLORS.secondary, borderColor: '#fff', borderWidth: 1.5 }
      },
      itemStyle: { borderColor: COLORS.mapBorder, borderWidth: COLORS.mapBorderWidth, areaColor: 'rgba(255,255,255,0.08)' },
      label: { show: false }, data: mapData, animationDurationUpdate: 500
    }]
  });

  updateFreshness('snap-retailers', { _static: true, _dataYear: 'FY2024' });

  // CSV export for SNAP retailers (on the shared map container)
  addExportButton('chart-desert-map', 'snap-retailers-by-state.csv', () => ({
    headers: ['State', 'Total Retailers', 'Retailers per 100K', 'Supermarkets', 'Super Stores', 'Large Grocery', 'Medium Grocery', 'Small Grocery', 'Convenience', 'Specialty', 'Farmers Markets', 'Other', 'Food Deserts (%)'],
    rows: retailerData.states.map(s => {
      const access = accessByFips[s.fips] || {};
      return [s.name, s.totalRetailers, s.retailersPer100K, s.supermarkets, s.superStores, s.largeGrocery, s.mediumGrocery, s.smallGrocery, s.convenience, s.specialty, s.farmersMarkets, s.totalRetailers - s.supermarkets - s.superStores - s.largeGrocery - s.mediumGrocery - s.smallGrocery - s.convenience - s.specialty - s.farmersMarkets, access.lowAccessPct || ''];
    })
  }));
}

// -- Low Access (Current): state-level computed from FNS + Census tract data --
function renderLowAccessMap(geoJSON, accessData) {
  const chart = getOrCreateChart('chart-desert-map');
  if (!chart) return;

  const mapData = accessData.states.map(s => ({
    name: s.name, value: s.lowAccessPct, fips: s.fips,
    totalTracts: s.totalTracts, lowAccessTracts: s.lowAccessTracts,
    totalPopulation: s.totalPopulation, lowAccessPopulation: s.lowAccessPopulation,
    avgDistance: s.avgDistance
  }));

  const albersProjection = { project: p => p, unproject: p => p };

  chart.setOption({
    tooltip: {
      trigger: 'item', ...TOOLTIP_STYLE,
      formatter: params => {
        const d = params.data;
        if (!d) return '';
        return `<strong style="font-size:14px">${d.name}</strong><br/>
          <span style="color:${COLORS.secondary}">Low-Access Tracts:</span> ${d.value}%<br/>
          Population: ${fmtNum(d.totalPopulation)}<br/>
          Low-Access Pop: ${fmtNum(d.lowAccessPopulation)}<br/>
          Avg Distance: ${d.avgDistance} mi<br/>
          <span style="color:${COLORS.secondary};font-size:11px">Click to see counties</span>`;
      }
    },
    visualMap: {
      left: 'right', bottom: 20, min: 20, max: 65,
      text: ['More Low-Access', 'Fewer Low-Access'], calculable: true,
      inRange: { color: [PAL.low, PAL.mid, PAL.high] },
      textStyle: { color: COLORS.text }
    },
    series: [{
      name: 'Low-Access Tracts (%)', type: 'map', map: 'USA-access', roam: false,
      projection: albersProjection, aspectScale: 1, zoom: 1.1, top: 10, left: 'center',
      emphasis: {
        label: { show: true, color: COLORS.text, fontSize: 12, fontWeight: 'bold' },
        itemStyle: { areaColor: COLORS.secondary, borderColor: '#fff', borderWidth: 1.5 }
      },
      itemStyle: { borderColor: COLORS.mapBorder, borderWidth: COLORS.mapBorderWidth, areaColor: 'rgba(255,255,255,0.08)' },
      label: { show: false }, data: mapData, animationDurationUpdate: 500
    }]
  }, true);

  // Dynamic insight
  const sorted = [...mapData].sort((a, b) => b.value - a.value);
  const insightEl = document.getElementById('low-access-insight');
  if (insightEl && sorted.length >= 3) {
    insightEl.innerHTML = `<strong>${sorted[0].name} (${sorted[0].value}%)</strong>, <strong>${sorted[1].name} (${sorted[1].value}%)</strong>, and <strong>${sorted[2].name} (${sorted[2].value}%)</strong> have the highest share of low-access census tracts — computed from ${accessData.meta.qualifyingRetailerCount?.toLocaleString() || '40K'} current SNAP-authorized grocery stores.`;
  }
}

// -- Low Access county drill-down --
function renderLowAccessCounty(countyGeo, countyData) {
  const chart = getOrCreateChart('chart-desert-map');
  if (!chart) return;

  // Build county lookup by FIPS
  const countyByFips = {};
  countyData.forEach(c => { countyByFips[c.fips] = c; });

  const mapName = chart.__currentMapName || 'USA-access';
  const mapData = countyGeo.features.map(f => {
    const fips = f.properties.fips || f.properties.GEOID;
    const c = countyByFips[fips];
    return {
      name: f.properties.name || f.properties.NAME,
      value: c ? c.lowAccessPct : 0,
      totalTracts: c ? c.totalTracts : 0,
      lowAccessTracts: c ? c.lowAccessTracts : 0,
      lowAccessPopulation: c ? c.lowAccessPopulation : 0,
      avgDistance: c ? c.avgDistance : 0,
      population: c ? c.totalPopulation : (f.properties.population || 0)
    };
  });

  chart.setOption({
    tooltip: {
      trigger: 'item', ...TOOLTIP_STYLE,
      formatter: params => {
        const d = params.data;
        if (!d) return '';
        return `<strong style="font-size:14px">${d.name}</strong><br/>
          <span style="color:${COLORS.secondary}">Low-Access Tracts:</span> ${d.value}%<br/>
          Tracts: ${d.lowAccessTracts} of ${d.totalTracts}<br/>
          Low-Access Pop: ${fmtNum(d.lowAccessPopulation)}<br/>
          Avg Distance: ${d.avgDistance} mi<br/>
          Population: ${fmtNum(d.population)}`;
      }
    },
    visualMap: {
      left: 'right', bottom: 20, min: 0, max: 100,
      text: ['More Low-Access', 'Fewer'], calculable: true,
      inRange: { color: [PAL.low, PAL.mid, PAL.high] },
      textStyle: { color: COLORS.text }
    },
    series: [{
      name: 'Low-Access Tracts (%)', type: 'map', map: mapName, roam: false,
      emphasis: {
        label: { show: true, color: COLORS.text, fontSize: 11, fontWeight: 'bold' },
        itemStyle: { areaColor: COLORS.secondary, borderColor: '#fff', borderWidth: 1 }
      },
      itemStyle: { borderColor: COLORS.countyBorder, borderWidth: COLORS.countyBorderWidth, areaColor: 'rgba(255,255,255,0.05)' },
      label: { show: false }, data: mapData, animationDurationUpdate: 500
    }]
  }, true);
}

// -- Accessible Data Table --
function populateAccessibleTable(states, retailerData) {
  const tbody = document.getElementById('accessible-access-table');
  if (!tbody) return;

  // Build retailer lookup
  const retailerByFips = {};
  if (retailerData?.states) {
    retailerData.states.forEach(s => { retailerByFips[s.fips] = s; });
  }

  states.forEach(s => {
    const r = retailerByFips[s.fips];
    const tr = document.createElement('tr');
    const estimate = Math.round((s.lowAccessPopulation || 0) * ((s.povertyRate || 0) / 100));
    tr.innerHTML = `<td>${s.name}</td><td>${s.lowAccessPct}%</td><td>${s.urbanLowAccess}</td><td>${s.ruralLowAccess}</td><td>${s.avgDistance}</td><td>${fmtNum(s.lowAccessPopulation || 0)}</td><td>${estimate > 0 ? fmtNum(estimate) : 'N/A'}</td><td>${r ? fmtNum(r.totalRetailers) : 'N/A'}</td><td>${r ? r.retailersPer100K : 'N/A'}</td>`;
    tbody.appendChild(tr);
  });
}

// -- Chart 7: Food Deserts vs Food Insecurity Correlation --

// Shared: render the scatter with given points + label info
function drawAccessInsecurityScatter(chart, points, { xLabel, yLabel, tooltipFn, symbolSizeFn, regionBased }) {
  if (!points.length) return null;

  let series, reg;

  if (regionBased) {
    const byRegion = {};
    Object.keys(REGION_COLORS).forEach(r => { byRegion[r] = []; });
    points.forEach(p => byRegion[getRegion(p.name)].push(p));

    reg = linearRegression(points.map(p => p.value));
    const xs = points.map(p => p.value[0]);
    const xMin = Math.min(...xs), xMax = Math.max(...xs);
    const rLine = {
      symbol: 'none', silent: true,
      lineStyle: { color: 'rgba(255,255,255,0.35)', type: 'dashed', width: 1.5 },
      data: [[{ coord: [xMin, reg.slope * xMin + reg.intercept] }, { coord: [xMax, reg.slope * xMax + reg.intercept] }]],
      label: { formatter: `r = ${reg.r.toFixed(2)}`, color: COLORS.textMuted, fontSize: 11, position: 'end' }
    };

    series = Object.entries(REGION_COLORS).map(([region, color], i) => ({
      name: region, type: 'scatter',
      data: byRegion[region],
      symbolSize: symbolSizeFn,
      itemStyle: { color, opacity: 0.85 },
      emphasis: { itemStyle: { opacity: 1 } },
      animationDuration: 2000,
      ...(i === 0 ? { markLine: rLine } : {})
    }));
  } else {
    // Single-series (county view) — color by food insecurity severity
    reg = linearRegression(points.map(p => p.value));
    const xs = points.map(p => p.value[0]);
    const xMin = Math.min(...xs), xMax = Math.max(...xs);
    const rLine = {
      symbol: 'none', silent: true,
      lineStyle: { color: 'rgba(255,255,255,0.35)', type: 'dashed', width: 1.5 },
      data: [[{ coord: [xMin, reg.slope * xMin + reg.intercept] }, { coord: [xMax, reg.slope * xMax + reg.intercept] }]],
      label: { formatter: `r = ${reg.r.toFixed(2)}`, color: COLORS.textMuted, fontSize: 11, position: 'end' }
    };

    series = [{
      name: 'Counties', type: 'scatter',
      data: points,
      symbolSize: symbolSizeFn,
      markLine: rLine,
      animationDuration: 1500
    }];
  }

  const legendOpt = regionBased ? {
    top: 5, right: 10,
    textStyle: { color: COLORS.text, fontSize: 11 },
    itemWidth: 10, itemHeight: 10
  } : { show: false };

  const visualMapOpt = regionBased ? undefined : [{
    show: true, dimension: 1, min: 5, max: 30,
    inRange: { color: ['#22d3ee', '#facc15', '#ef4444'] },
    text: ['High Insecurity', 'Low'],
    textStyle: { color: COLORS.textMuted, fontSize: 10 },
    right: 10, top: 10, calculable: false, itemWidth: 12, itemHeight: 80
  }];

  chart.setOption({
    legend: legendOpt,
    visualMap: visualMapOpt,
    tooltip: { ...TOOLTIP_STYLE, formatter: tooltipFn },
    grid: { left: 55, right: 20, top: 35, bottom: 50 },
    xAxis: {
      name: xLabel, nameLocation: 'center', nameGap: 35,
      nameTextStyle: { color: COLORS.textMuted },
      axisLabel: { color: COLORS.textMuted, formatter: '{value}%' },
      splitLine: { lineStyle: { color: COLORS.gridLine } }
    },
    yAxis: {
      name: yLabel,
      nameTextStyle: { color: COLORS.textMuted },
      axisLabel: { color: COLORS.textMuted, formatter: '{value}%' },
      splitLine: { lineStyle: { color: COLORS.gridLine } }
    },
    series
  }, true);

  return reg;
}

// Update insight text based on regression
function updateAccessInsecurityInsight(reg, mode, countyCount, stateName) {
  const insightEl = document.getElementById('access-insecurity-insight');
  if (!insightEl || !reg) return;

  const strength = Math.abs(reg.r) >= 0.7 ? 'Strong' : Math.abs(reg.r) >= 0.4 ? 'Moderate' : 'Weak';

  if (mode === 'county') {
    if (Math.abs(reg.r) < 0.4) {
      insightEl.textContent = `${strength} correlation (r = ${reg.r.toFixed(2)}) across ${countyCount} counties in ${stateName}. At the county level within this state, food desert prevalence is a weak predictor of food insecurity — local economic conditions and poverty drive outcomes more than grocery access.`;
    } else {
      insightEl.textContent = `${strength} correlation (r = ${reg.r.toFixed(2)}) across ${countyCount} counties in ${stateName}. Counties with more food desert tracts do tend to have higher food insecurity — but the scatter shows wide variation, suggesting local factors like poverty and employment matter just as much.`;
    }
  } else {
    if (Math.abs(reg.r) < 0.4) {
      insightEl.textContent = `${strength} state-level correlation (r = ${reg.r.toFixed(2)}). Low-access prevalence alone does not explain much of the variation in food insecurity across states. State averages can mask stronger patterns at the county or neighborhood level.`;
    } else {
      insightEl.textContent = `${strength} correlation (r = ${reg.r.toFixed(2)}). Low-access prevalence and food insecurity do move together across states, but the relationship is imperfect — local factors like poverty, employment, and income likely play a major role.`;
    }
  }
}

// State-level scatter (original behavior)
function renderStateScatter(chart, accessStates, fiStates) {
  const fiByName = {};
  fiStates.forEach(s => { fiByName[s.name] = s; });

  const points = accessStates
    .map(s => {
      const fi = fiByName[s.name];
      if (!fi) return null;
      return { value: [s.lowAccessPct, fi.rate], name: s.name, population: s.population };
    })
    .filter(Boolean);

  const reg = drawAccessInsecurityScatter(chart, points, {
    xLabel: 'Low-Access Tracts (%)',
    yLabel: 'Food Insecurity Rate (%)',
    regionBased: true,
    symbolSizeFn: (_, params) => Math.max(8, Math.sqrt(params.data.population / 200000)),
    tooltipFn: params => {
      const d = params.data;
      const region = getRegion(d.name);
      return `<strong>${d.name}</strong> <span style="color:${REGION_COLORS[region]}">(${region})</span><br/>Food Deserts: ${d.value[0]}%<br/>Food Insecurity: ${d.value[1]}%`;
    }
  });

  updateAccessInsecurityInsight(reg, 'state');
}

// County-level scatter for a single state
async function renderCountyScatter(chart, stateFips, stateName, accessData) {
  chart.showLoading({ text: `Loading ${stateName} counties...`, color: COLORS.secondary, textColor: COLORS.text, maskColor: 'rgba(0,0,0,0.6)' });

  try {
    // Fetch county GeoJSON (has food insecurity rate from CHR)
    const geoRes = await fetch(`/data/counties/${stateFips}.json`);
    if (!geoRes.ok) throw new Error(`County data not available for ${stateName}`);
    const countyGeo = await geoRes.json();

    // Build current food access lookup by county FIPS (consistent with state-level map)
    const stateAccess = accessData?.states?.find(s => s.fips === stateFips);
    const accessByFips = {};
    if (stateAccess?.counties) {
      stateAccess.counties.forEach(c => { accessByFips[c.fips] = c; });
    }
    const hasCurrentAccess = Object.keys(accessByFips).length > 0;

    // Build scatter points: x = low-access tract %, y = food insecurity rate
    const points = [];
    countyGeo.features.forEach(f => {
      const props = f.properties;
      if (!props || !props.rate) return; // need food insecurity rate

      const fips5 = props.GEOID || props.fips || f.id || '';
      const access = accessByFips[fips5];

      let desertPct;
      if (hasCurrentAccess && access) {
        // Current computed data: % of tracts beyond distance threshold
        desertPct = access.lowAccessPct;
      } else if (props.limitedAccess !== undefined) {
        // Fallback: CHR "limited access to healthy foods" index
        desertPct = props.limitedAccess;
      } else {
        return; // no desert metric available
      }

      points.push({
        value: [desertPct, props.rate],
        name: props.name || props.NAME || 'Unknown',
        population: props.population || 0,
        povertyRate: props.povertyRate
      });
    });

    chart.hideLoading();

    if (!points.length) {
      chart.setOption({ title: { text: `No matching county data for ${stateName}`, left: 'center', top: 'center', textStyle: { color: COLORS.textMuted, fontSize: 14 } }, series: [] }, true);
      updateAccessInsecurityInsight(null, 'county', 0, stateName);
      return;
    }

    const xLabel = hasCurrentAccess ? 'Low-Access Tracts (%)' : 'Limited Food Access Index';

    const reg = drawAccessInsecurityScatter(chart, points, {
      xLabel,
      yLabel: 'Food Insecurity Rate (%)',
      regionBased: false,
      symbolSizeFn: (_, params) => {
        const pop = params.data.population;
        return pop > 0 ? Math.max(5, Math.min(20, Math.sqrt(pop / 5000))) : 6;
      },
      tooltipFn: params => {
        const d = params.data;
        let html = `<strong>${d.name}</strong><br/>`;
        html += `${hasCurrentAccess ? 'Low-Access Tracts' : 'Limited Access'}: ${d.value[0]}%<br/>`;
        html += `Food Insecurity: ${d.value[1]}%<br/>`;
        if (d.povertyRate !== undefined) html += `Poverty Rate: ${d.povertyRate}%<br/>`;
        if (d.population) html += `Population: ${fmtNum(d.population)}`;
        return html;
      }
    });

    updateAccessInsecurityInsight(reg, 'county', points.length, stateName);
  } catch {
    chart.hideLoading();
    chart.setOption({ title: { text: `Could not load county data for ${stateName}`, left: 'center', top: 'center', textStyle: { color: COLORS.textMuted, fontSize: 14 } }, series: [] }, true);
  }
}

// Main entry: set up chart + toggle
function renderAccessInsecurity(accessStates, fiStates, accessData) {
  const chart = getOrCreateChart('chart-access-insecurity');
  if (!chart) return;

  // Build state FIPS lookup: name -> fips
  const fipsByName = {};
  accessStates.forEach(s => { fipsByName[s.name] = s.fips; });

  // Render default state view
  renderStateScatter(chart, accessStates, fiStates);

  // Initialize toggle buttons
  const toggleContainer = document.getElementById('access-insecurity-toggle');
  if (!toggleContainer) return;

  toggleContainer.innerHTML = [
    '<button class="dashboard-metric-btn dashboard-metric-btn--active" data-ai-mode="state" aria-pressed="true">State View (50 states)</button>',
    '<button class="dashboard-metric-btn" data-ai-mode="county" aria-pressed="false">County View</button>'
  ].join('');

  // County state selector (hidden by default)
  const selectorWrap = document.createElement('div');
  selectorWrap.id = 'ai-county-selector';
  selectorWrap.style.cssText = 'display:none;margin-top:0.5rem;text-align:center;';
  selectorWrap.innerHTML = `
    <label for="ai-state-select" style="color:rgba(255,255,255,0.6);font-size:12px;margin-right:0.5rem;">Select a state:</label>
    <select id="ai-state-select" style="padding:0.4rem 0.6rem;border-radius:4px;border:1px solid rgba(255,255,255,0.2);background:rgba(255,255,255,0.08);color:#fff;font-size:13px;">
      <option value="">Choose a state...</option>
      ${US_STATES.map(([code, name]) => `<option value="${code}">${name}</option>`).join('')}
    </select>
  `;
  toggleContainer.appendChild(selectorWrap);

  let currentMode = 'state';

  // Handle toggle clicks
  toggleContainer.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-ai-mode]');
    if (!btn) return;
    const mode = btn.dataset.aiMode;
    if (mode === currentMode) return;

    currentMode = mode;
    toggleContainer.querySelectorAll('.dashboard-metric-btn').forEach(b => {
      b.classList.remove('dashboard-metric-btn--active');
      b.setAttribute('aria-pressed', 'false');
    });
    btn.classList.add('dashboard-metric-btn--active');
    btn.setAttribute('aria-pressed', 'true');

    const selector = document.getElementById('ai-county-selector');
    const stateSelect = document.getElementById('ai-state-select');

    if (mode === 'state') {
      if (selector) selector.style.display = 'none';
      renderStateScatter(chart, accessStates, fiStates);
    } else {
      if (selector) selector.style.display = '';
      // If a state is already selected, load it
      if (stateSelect && stateSelect.value) {
        const stateName = US_STATES.find(([c]) => c === stateSelect.value)?.[1];
        const stateFips = stateName ? fipsByName[stateName] : null;
        if (stateFips) {
          renderCountyScatter(chart, stateFips, stateName, accessData);
        }
      } else {
        // Show prompt to select a state
        chart.setOption({
          title: { text: 'Select a state above to view county-level data', left: 'center', top: 'center', textStyle: { color: COLORS.textMuted, fontSize: 14 } },
          legend: { show: false }, visualMap: undefined, series: []
        }, true);
        const insightEl = document.getElementById('access-insecurity-insight');
        if (insightEl) insightEl.textContent = 'Choose a state from the dropdown to see county-level correlation between food deserts and food insecurity.';
      }
    }
  });

  // Handle state selector change
  const stateSelect = document.getElementById('ai-state-select');
  if (stateSelect) {
    stateSelect.addEventListener('change', () => {
      if (currentMode !== 'county') return;
      const code = stateSelect.value;
      if (!code) {
        chart.setOption({
          title: { text: 'Select a state above to view county-level data', left: 'center', top: 'center', textStyle: { color: COLORS.textMuted, fontSize: 14 } },
          legend: { show: false }, visualMap: undefined, series: []
        }, true);
        return;
      }
      const stateName = US_STATES.find(([c]) => c === code)?.[1];
      const stateFips = stateName ? fipsByName[stateName] : null;
      if (stateFips) {
        renderCountyScatter(chart, stateFips, stateName, accessData);
      }
    });
  }
}

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
    // Load current-access data + GeoJSON + food insecurity + SNAP retailers
    const [currentAccessRes, geoRes, fiRes, snapRetailRes] = await Promise.all([
      fetch('/data/current-food-access.json'),
      fetch('/data/us-states-geo.json'),
      fetch('/data/food-insecurity-state.json'),
      fetch('/data/snap-retailers.json')
    ]);
    if (!currentAccessRes.ok || !geoRes.ok) throw new Error('Failed to load data');
    const [currentAccessData, geoJSON] = await Promise.all([currentAccessRes.json(), geoRes.json()]);
    const fiData = fiRes.ok ? await fiRes.json() : null;
    const snapRetailerData = snapRetailRes.ok ? await snapRetailRes.json() : null;

    // Normalize totalPopulation → population for chart compatibility
    const curStates = currentAccessData.states.map(s => ({ ...s, population: s.totalPopulation }));

    // Merge poverty rate from food-insecurity-state.json for Double Burden estimate
    if (fiData?.states) {
      const fiByName = {};
      fiData.states.forEach(s => { fiByName[s.name] = s.povertyRate; });
      curStates.forEach(s => { if (fiByName[s.name]) s.povertyRate = fiByName[s.name]; });
    }

    updateFreshness('access', { _static: true, _dataYear: 'Current' });

    animateCounters();
    const mapCtrl = renderDesertMap(geoJSON, currentAccessData.states, currentAccessData);
    renderUrbanRural(curStates);
    renderDistance(curStates);
    renderVehicle(curStates);
    renderDoubleBurden(curStates);
    if (fiData?.states) renderAccessInsecurity(curStates, fiData.states, currentAccessData);
    populateAccessibleTable(curStates, snapRetailerData);

    addExportButton('chart-desert-map', 'food-access-by-state.csv', () => ({
      headers: ['State', 'Low-Access Tracts (%)', 'Urban Low-Access', 'Rural Low-Access', 'Avg Distance (mi)', 'Low-Access Population', 'Low-Income Low-Access Pop (est.)'],
      rows: curStates.map(s => {
        const estimate = Math.round((s.lowAccessPopulation || 0) * ((s.povertyRate || 0) / 100));
        return [s.name, s.lowAccessPct, s.urbanLowAccess, s.ruralLowAccess, s.avgDistance, s.lowAccessPopulation || 0, estimate || ''];
      })
    }));

    // Map view toggle: Food Deserts (default) | Food Insecurity (CDC) | SNAP Retailers
    let currentMapView = 'deserts'; // Default — Food Deserts (current computed data)
    let cdcInsecurityData = null;
    const toggleContainer = document.getElementById('map-view-toggle');

    // Helper: switch to a specific view
    const switchMapView = (view) => {
      currentMapView = view;
      if (toggleContainer) {
        toggleContainer.querySelectorAll('.dashboard-metric-btn').forEach(b => {
          b.classList.remove('dashboard-metric-btn--active');
          b.setAttribute('aria-pressed', 'false');
        });
        const activeBtn = toggleContainer.querySelector(`[data-map-view="${view}"]`);
        if (activeBtn) {
          activeBtn.classList.add('dashboard-metric-btn--active');
          activeBtn.setAttribute('aria-pressed', 'true');
        }
      }

      const infoPanels = ['info-insecurity-mode', 'info-current-access-mode', 'info-desert-mode', 'info-snap-mode'];
      const hint = document.querySelector('#chart-desert-map + .dashboard-chart__hint');
      const freshAccess = document.getElementById('freshness-access');
      const freshSnap = document.getElementById('freshness-snap-retailers');

      // Hide all info panels first
      infoPanels.forEach(id => { const el = document.getElementById(id); if (el) el.style.display = 'none'; });
      if (freshAccess) freshAccess.style.display = '';
      if (freshSnap) freshSnap.style.display = 'none';

      if (view === 'insecurity' && cdcInsecurityData?.records) {
        if (mapCtrl) mapCtrl.setDrillDown(true);
        renderInsecurityMap(geoJSON, cdcInsecurityData.records);
        const el = document.getElementById('info-insecurity-mode'); if (el) el.style.display = '';
        if (hint) hint.textContent = 'Hover for state details — click any state for county breakdown';
        updateFreshness('access', cdcInsecurityData);
      } else if (view === 'snap' && snapRetailerData?.states) {
        if (mapCtrl) mapCtrl.setDrillDown(false);
        renderSnapRetailers(geoJSON, snapRetailerData, curStates);
        const el = document.getElementById('info-snap-mode'); if (el) el.style.display = '';
        if (hint) hint.textContent = 'Hover for retailer breakdown by store type';
        if (freshAccess) freshAccess.style.display = 'none';
        if (freshSnap) freshSnap.style.display = '';
      } else if (view === 'deserts' && currentAccessData?.states) {
        // Low Access (Current) — computed from FNS + Census tract data
        if (mapCtrl) mapCtrl.setDrillDown(true);
        renderLowAccessMap(geoJSON, currentAccessData);
        const el = document.getElementById('info-desert-mode'); if (el) el.style.display = '';
        if (hint) hint.textContent = 'Hover for state details — click any state for county breakdown';
        updateFreshness('access', { _static: true, _dataYear: 'Current' });
      } else {
        // Fallback: show static data if computed data unavailable
        if (mapCtrl) { mapCtrl.setDrillDown(true); mapCtrl.showNational(); }
        const el = document.getElementById('info-desert-mode'); if (el) el.style.display = '';
        if (hint) hint.textContent = 'Hover for state details — click any state for county breakdown';
        updateFreshness('access', { _static: true, _dataYear: 'Current' });
      }
    };

    if (toggleContainer) {
      toggleContainer.addEventListener('click', (e) => {
        const btn = e.target.closest('[data-map-view]');
        if (!btn) return;
        const view = btn.dataset.mapView;
        if (view === currentMapView) return;
        switchMapView(view);
      });
    }

    // Set initial view to Food Deserts (computed data)
    if (currentAccessData?.states) {
      switchMapView('deserts');
    }

    // State deep-dive selector
    if (mapCtrl) {
      initStateSelector('state-selector-container', (stateCode) => {
        if (!stateCode) {
          // Reset to national view for the current mode
          switchMapView(currentMapView);
          return;
        }
        // Switch to a drillable view if in snap mode
        if (currentMapView === 'snap') {
          switchMapView(cdcInsecurityData ? 'insecurity' : 'deserts');
        }
        if (currentMapView === 'deserts' && currentAccessData?.states) {
          drillDownLowAccess(stateCode);
          return;
        }
        const stateName = US_STATES.find(([c]) => c === stateCode)?.[1];
        const match = curStates.find(s => s.name === stateName);
        if (match?.fips) mapCtrl.drillDown(match.name, match.fips);
      });
    }

    // Food Deserts drill-down: use pre-computed county data from current-food-access.json
    const drillDownLowAccess = async (stateCode) => {
      const stateName = US_STATES.find(([c]) => c === stateCode)?.[1];
      const match = curStates.find(s => s.name === stateName);
      if (!match?.fips || !currentAccessData?.states) return;

      const stateAccess = currentAccessData.states.find(s => s.fips === match.fips);
      if (!stateAccess?.counties) return;

      const chart = getOrCreateChart('chart-desert-map');
      if (chart) chart.showLoading({ text: `Loading ${stateName}...`, color: COLORS.secondary, textColor: COLORS.text, maskColor: 'rgba(0,0,0,0.6)' });

      try {
        const countyRes = await fetch(`/data/counties/${match.fips}.json`);
        if (!countyRes.ok) throw new Error('County GeoJSON unavailable');
        const countyGeo = await countyRes.json();

        const mapName = `access-lowaccess-${match.fips}`;
        echarts.registerMap(mapName, countyGeo);
        if (chart) { chart.__currentMapName = mapName; chart.hideLoading(); }

        renderLowAccessCounty(countyGeo, stateAccess.counties);

        const backBtn = document.getElementById('access-map-back-btn');
        if (backBtn) backBtn.style.display = '';
        const mapLabel = document.getElementById('access-map-state-label');
        if (mapLabel) mapLabel.textContent = stateName;
      } catch {
        if (chart) chart.hideLoading();
      }
    };

    // Wire map click for current-access mode
    const chartDom = document.getElementById('chart-desert-map');
    if (chartDom) {
      const chartInstance = echarts.getInstanceByDom(chartDom);
      if (chartInstance) {
        chartInstance.on('click', (params) => {
          if (params.data?.name) {
            const stateCode = US_STATES.find(([, name]) => name === params.data.name)?.[0];
            if (!stateCode) return;
            if (currentMapView === 'deserts' && currentAccessData?.states) drillDownLowAccess(stateCode);
          }
        });
      }
    }

    // Wire back button for deserts mode
    const backBtn = document.getElementById('access-map-back-btn');
    if (backBtn) {
      backBtn.addEventListener('click', () => {
        if (currentMapView === 'deserts') {
          switchMapView('deserts');
        }
      });
    }

    initScrollReveal();
    window.addEventListener('resize', handleResize);

    // Non-blocking: fetch live SDOH data for housing burden chart
    fetchSDOHAccess(curStates);

    // Non-blocking: fetch CDC PLACES food insecurity for default map view
    fetch('/api/dashboard-places.php?type=food-insecurity')
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (!data || data.error || !data.records?.length) return;
        cdcInsecurityData = data;
        // CDC data ready — user can toggle to Food Insecurity view
      })
      .catch(() => { /* CDC unavailable — desert map stays as default */ });

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
