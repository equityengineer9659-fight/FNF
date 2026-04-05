/**
 * @fileoverview Executive Summary Dashboard — the elevator pitch for grant writers.
 * @description Loads all existing data files and renders 4 charts: vulnerability map,
 *   SNAP coverage gap, food price YoY inflation, and worst-10-states ranking.
 */

import {
  echarts, COLORS, TOOLTIP_STYLE, MAP_PALETTES,
  fmtNum, animateCounters, createChart,
  initScrollReveal, handleResize,
  getRegion, addExportButton
} from './shared/dashboard-utils.js';

// ── Vulnerability Index computation ──
function computeVulnerabilityIndex(states) {
  const maxMealCost = Math.max(...states.map(s => s.mealCost || 0));
  return states.map(s => {
    const score = (s.rate * 0.4) + (s.povertyRate * 0.3) + ((s.mealCost / maxMealCost) * 30);
    return { ...s, vulnerabilityIndex: Math.round(score * 100) / 100 };
  });
}

// ── Chart 1: Vulnerability Map (choropleth) ──
function renderVulnerabilityMap(statesWithIndex, geoJSON) {
  const chart = createChart('chart-vulnerability-map');
  if (!chart) return;

  echarts.registerMap('USA-exec', geoJSON);

  const sorted = [...statesWithIndex].sort((a, b) => b.vulnerabilityIndex - a.vulnerabilityIndex);
  const minVal = Math.min(...statesWithIndex.map(s => s.vulnerabilityIndex));
  const maxVal = Math.max(...statesWithIndex.map(s => s.vulnerabilityIndex));

  chart.setOption({
    tooltip: {
      ...TOOLTIP_STYLE,
      trigger: 'item',
      formatter: params => {
        const d = statesWithIndex.find(s => s.name === params.name);
        if (!d) return params.name;
        return `<strong>${d.name}</strong><br/>
          Vulnerability Index: <strong>${d.vulnerabilityIndex.toFixed(1)}</strong><br/>
          Food Insecurity: ${d.rate}%<br/>
          Poverty Rate: ${d.povertyRate}%<br/>
          Avg Meal Cost: $${d.mealCost.toFixed(2)}`;
      }
    },
    visualMap: {
      min: Math.floor(minVal),
      max: Math.ceil(maxVal),
      left: 'right',
      top: 'bottom',
      text: ['High', 'Low'],
      textStyle: { color: COLORS.textMuted },
      inRange: {
        color: [MAP_PALETTES.insecurity.low, MAP_PALETTES.insecurity.mid, MAP_PALETTES.insecurity.high]
      },
      calculable: true
    },
    series: [{
      type: 'map',
      map: 'USA-exec',
      roam: false,
      projection: {
        project: (point) => point,
        unproject: (point) => point
      },
      itemStyle: {
        borderColor: COLORS.mapBorder,
        borderWidth: COLORS.mapBorderWidth
      },
      emphasis: {
        itemStyle: { areaColor: COLORS.secondary },
        label: { show: true, color: '#fff', fontSize: 12 }
      },
      label: { show: false },
      data: statesWithIndex.map(s => ({
        name: s.name,
        value: s.vulnerabilityIndex
      }))
    }]
  });

  // Dynamic insight
  const insightEl = document.getElementById('vulnerability-map-insight');
  if (insightEl && sorted.length >= 3) {
    insightEl.textContent = `${sorted[0].name} leads with a vulnerability score of ${sorted[0].vulnerabilityIndex.toFixed(1)}, followed by ${sorted[1].name} (${sorted[1].vulnerabilityIndex.toFixed(1)}) and ${sorted[2].name} (${sorted[2].vulnerabilityIndex.toFixed(1)}).`;
  }

  // CSV export
  addExportButton('chart-vulnerability-map', 'vulnerability-index-by-state', () => ({
    headers: ['State', 'Vulnerability Index', 'Food Insecurity Rate (%)', 'Poverty Rate (%)', 'Avg Meal Cost ($)', 'Food Insecure Persons'],
    rows: sorted.map(s => [s.name, s.vulnerabilityIndex.toFixed(2), s.rate, s.povertyRate, s.mealCost.toFixed(2), s.persons])
  }));
}

// ── Chart 2: SNAP Coverage Gap ──
function renderSnapGap(fiStates, snapStates) {
  const chart = createChart('chart-snap-gap');
  if (!chart) return;

  // Join on state name, take top 15 by food insecurity rate
  const joined = fiStates
    .map(fi => {
      const snap = snapStates.find(s => s.name === fi.name);
      return snap ? { name: fi.name, foodInsecure: fi.persons, snapParticipants: snap.snapParticipants, rate: fi.rate } : null;
    })
    .filter(Boolean)
    .sort((a, b) => b.rate - a.rate)
    .slice(0, 15);

  chart.setOption({
    tooltip: {
      ...TOOLTIP_STYLE,
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
      formatter: params => {
        let tip = `<strong>${params[0].axisValue}</strong><br/>`;
        params.forEach(p => {
          tip += `${p.marker} ${p.seriesName}: <strong>${fmtNum(p.value)}</strong><br/>`;
        });
        const d = joined.find(j => j.name === params[0].axisValue);
        if (d) {
          const gapPct = ((d.foodInsecure - d.snapParticipants) / d.foodInsecure * 100).toFixed(1);
          const gapDir = d.foodInsecure > d.snapParticipants ? 'Under-covered' : 'Over-covered';
          tip += `<em>${gapDir} by ${Math.abs(gapPct)}%</em>`;
        }
        return tip;
      }
    },
    legend: {
      data: ['Food-Insecure Population', 'SNAP Participants'],
      textStyle: { color: COLORS.textMuted },
      top: 0
    },
    grid: { top: 40, right: 20, bottom: 30, left: 60, containLabel: true },
    xAxis: {
      type: 'category',
      data: joined.map(d => d.name),
      axisLabel: { color: COLORS.textMuted, rotate: 45, fontSize: 11 },
      axisLine: { lineStyle: { color: COLORS.gridLine } }
    },
    yAxis: {
      type: 'value',
      axisLabel: { color: COLORS.textMuted, formatter: v => fmtNum(v) },
      splitLine: { lineStyle: { color: COLORS.gridLine } }
    },
    series: [
      {
        name: 'Food-Insecure Population',
        type: 'bar',
        data: joined.map(d => d.foodInsecure),
        itemStyle: { color: COLORS.accent },
        barGap: '10%'
      },
      {
        name: 'SNAP Participants',
        type: 'bar',
        data: joined.map(d => d.snapParticipants),
        itemStyle: { color: COLORS.primary }
      }
    ]
  });

  // Dynamic insight
  const insightEl = document.getElementById('snap-gap-insight');
  if (insightEl) {
    const biggestGap = joined.reduce((max, d) => {
      const gap = d.foodInsecure - d.snapParticipants;
      return gap > (max.foodInsecure - max.snapParticipants) ? d : max;
    }, joined[0]);
    const gapSize = biggestGap.foodInsecure - biggestGap.snapParticipants;
    const overCovered = joined.filter(d => d.snapParticipants >= d.foodInsecure);
    insightEl.textContent = `${biggestGap.name} has the largest absolute gap: ${fmtNum(Math.abs(gapSize))} food-insecure people without SNAP coverage. ${overCovered.length} of 15 states show SNAP coverage meeting or exceeding insecure populations.`;
  }
}

// ── Chart 3: Food Price Impact (YoY Inflation) ──
function renderPriceImpact(blsData) {
  const chart = createChart('chart-price-impact');
  if (!chart || !blsData?.series) return;

  const foodHome = blsData.series.find(s => s.name === 'Food at Home');
  if (!foodHome) return;

  // Compute YoY % for each month (skip first 12)
  const data = foodHome.data.filter(d => d.value !== null);
  const yoyData = data.slice(12).map((d, i) => ({
    date: d.date,
    value: Math.round((d.value - data[i].value) / data[i].value * 10000) / 100
  }));

  const dates = yoyData.map(d => d.date);

  chart.setOption({
    tooltip: {
      ...TOOLTIP_STYLE,
      trigger: 'axis',
      formatter: params => {
        const p = params[0];
        return `<strong>${p.axisValue}</strong><br/>${p.marker} Food at Home YoY: <strong>${p.value.toFixed(1)}%</strong>`;
      }
    },
    grid: { top: 20, right: 20, bottom: 40, left: 50, containLabel: true },
    xAxis: {
      type: 'category',
      data: dates,
      axisLabel: {
        color: COLORS.textMuted,
        formatter: v => {
          const parts = v.split('-');
          return parts[1] === '01' ? parts[0] : '';
        }
      },
      axisLine: { lineStyle: { color: COLORS.gridLine } }
    },
    yAxis: {
      type: 'value', name: 'YoY Change (%)',
      nameTextStyle: { color: COLORS.textMuted },
      axisLabel: { color: COLORS.textMuted, formatter: '{value}%' },
      splitLine: { lineStyle: { color: COLORS.gridLine } }
    },
    series: [{
      name: 'Food at Home', type: 'line',
      data: yoyData.map(d => d.value), smooth: true, symbol: 'none',
      lineStyle: { width: 3, color: COLORS.accent },
      itemStyle: { color: COLORS.accent },
      areaStyle: {
        color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
          { offset: 0, color: 'rgba(255,107,53,0.3)' },
          { offset: 1, color: 'rgba(255,107,53,0.02)' }
        ])
      },
      markLine: {
        silent: true,
        symbol: 'none',
        lineStyle: { color: 'rgba(255,255,255,0.25)', type: 'dashed' },
        data: [{ yAxis: 0, label: { show: true, formatter: '0%', color: COLORS.textMuted, position: 'start' } }]
      }
    }]
  });

  // Update KPI counter with latest YoY
  const latest = yoyData.at(-1);
  if (latest) {
    const kpiEl = document.getElementById('kpi-cpi-yoy');
    if (kpiEl) {
      kpiEl.dataset.target = latest.value.toFixed(1);
      kpiEl.dataset.suffix = '%';
    }
  }

  // Dynamic insight
  const insightEl = document.getElementById('price-impact-insight');
  if (insightEl && yoyData.length > 0) {
    const peak = yoyData.reduce((max, d) => d.value > max.value ? d : max, yoyData[0]);
    insightEl.textContent = `Food-at-home inflation peaked at ${peak.value.toFixed(1)}% in ${peak.date}. As of ${latest.date}, YoY change has cooled to ${latest.value.toFixed(1)}%.`;
  }
}

// ── Chart 4: Worst 10 States (horizontal bar) ──
function renderWorstStates(statesWithIndex) {
  const chart = createChart('chart-worst-states');
  if (!chart) return;

  const top10 = [...statesWithIndex]
    .sort((a, b) => b.vulnerabilityIndex - a.vulnerabilityIndex)
    .slice(0, 10)
    .reverse(); // reverse for horizontal bar (bottom = highest rank)

  chart.setOption({
    tooltip: {
      ...TOOLTIP_STYLE,
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
      formatter: params => {
        const p = params[0];
        const d = statesWithIndex.find(s => s.name === p.axisValue);
        if (!d) return p.axisValue;
        return `<strong>${d.name}</strong><br/>
          Vulnerability Index: <strong>${d.vulnerabilityIndex.toFixed(1)}</strong><br/>
          Food Insecurity: ${d.rate}% | Poverty: ${d.povertyRate}%<br/>
          Meal Cost: $${d.mealCost.toFixed(2)} | Persons: ${fmtNum(d.persons)}`;
      }
    },
    grid: { top: 10, right: 30, bottom: 20, left: 10, containLabel: true },
    xAxis: {
      type: 'value',
      axisLabel: { color: COLORS.textMuted },
      splitLine: { lineStyle: { color: COLORS.gridLine } }
    },
    yAxis: {
      type: 'category',
      data: top10.map(s => s.name),
      axisLabel: { color: COLORS.textMuted, fontSize: 12 },
      axisLine: { lineStyle: { color: COLORS.gridLine } }
    },
    series: [{
      type: 'bar',
      data: top10.map(s => ({
        value: s.vulnerabilityIndex,
        itemStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 1, 0, [
            { offset: 0, color: MAP_PALETTES.insecurity.mid },
            { offset: 1, color: MAP_PALETTES.insecurity.high }
          ])
        }
      })),
      barWidth: '60%',
      label: {
        show: true,
        position: 'right',
        formatter: '{c}',
        color: COLORS.textMuted,
        fontSize: 11
      }
    }]
  });

  // Dynamic insight
  const insightEl = document.getElementById('worst-states-insight');
  if (insightEl && top10.length >= 3) {
    const topState = top10.at(-1); // highest after reverse
    const southCount = top10.filter(s => getRegion(s.name) === 'South').length;
    insightEl.textContent = `${southCount} of the 10 most vulnerable states are in the South. ${topState.name} scores highest at ${topState.vulnerabilityIndex.toFixed(1)}, driven by a ${topState.rate}% insecurity rate and ${topState.povertyRate}% poverty.`;
  }
}

// ── Main init ──
async function init() {
  animateCounters();
  initScrollReveal();

  try {
    const [fiRes, snapRes, blsRes, bankRes, geoRes] = await Promise.all([
      fetch('/data/food-insecurity-state.json'),
      fetch('/data/snap-participation.json'),
      fetch('/data/bls-food-cpi.json'),
      fetch('/data/food-bank-summary.json'),
      fetch('/data/us-states-geo.json')
    ]);

    if (!fiRes.ok || !snapRes.ok || !blsRes.ok || !bankRes.ok || !geoRes.ok) {
      throw new Error('Failed to load one or more data files');
    }

    const [fiData, snapData, blsData, , geoJSON] = await Promise.all([
      fiRes.json(), snapRes.json(), blsRes.json(), bankRes.json(), geoRes.json()
    ]);

    const statesWithIndex = computeVulnerabilityIndex(fiData.states);

    // Update SNAP coverage KPI dynamically
    const totalInsecure = fiData.national.foodInsecurePersons;
    const totalSnap = snapData.national.snapParticipants;
    const snapCoverage = ((totalSnap / totalInsecure) * 100).toFixed(1);
    const snapKpiEl = document.querySelector('[data-target="95.4"]');
    if (snapKpiEl) {
      snapKpiEl.dataset.target = snapCoverage;
    }

    // Render all 4 charts
    renderVulnerabilityMap(statesWithIndex, geoJSON);
    renderSnapGap(fiData.states, snapData.stateCoverage.states);
    renderPriceImpact(blsData);
    renderWorstStates(statesWithIndex);

    // Re-animate counters after dynamic KPI updates
    animateCounters();

  } catch (err) {
    // eslint-disable-next-line no-console -- error boundary
    if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
      // eslint-disable-next-line no-console
      console.error('Executive Summary Dashboard error:', err);
    }
  }

  // Responsive resize
  window.addEventListener('resize', handleResize);
}

// Boot
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
