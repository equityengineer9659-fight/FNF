/**
 * @fileoverview Food Prices & Affordability Dashboard — ECharts visualizations
 * @description Interactive charts: food CPI by category, regional comparison,
 *              affordability map, cost burden by income, home vs away trends.
 */

import {
  echarts, COLORS, TOOLTIP_STYLE,
  fmtNum, animateCounters, createChart,
  updateFreshness, initScrollReveal, handleResize, fetchWithFallback
} from './shared/dashboard-utils.js';

// -- Chart 1: Food Prices by Category (multi-line) --
function renderCategories(data) {
  const chart = createChart('chart-categories');
  if (!chart || !data.series) return;

  const allFood = data.series.find(s => s.name === 'All Food at Home');
  const dates = allFood ? allFood.data.map(d => d.date) : data.series[0].data.map(d => d.date);

  const seriesColors = [COLORS.accent, COLORS.secondary, '#a78bfa', '#34d399', COLORS.primary];

  chart.setOption({
    tooltip: {
      trigger: 'axis',
      ...TOOLTIP_STYLE,
      formatter: params => {
        let tip = `<strong>${params[0].axisValue}</strong><br/>`;
        params.forEach(p => {
          tip += `${p.marker} ${p.seriesName}: <strong>${p.value}</strong><br/>`;
        });
        return tip;
      }
    },
    legend: {
      data: data.series.map(s => s.name),
      textStyle: { color: COLORS.text, fontSize: 11 },
      top: 5
    },
    grid: { left: 50, right: 20, top: 50, bottom: 60 },
    dataZoom: [{
      type: 'inside',
      start: 0,
      end: 100
    }, {
      type: 'slider',
      start: 0,
      end: 100,
      height: 20,
      bottom: 10,
      textStyle: { color: COLORS.textMuted },
      borderColor: COLORS.gridLine,
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
      name: 'CPI Index',
      nameTextStyle: { color: COLORS.textMuted },
      axisLabel: { color: COLORS.textMuted },
      splitLine: { lineStyle: { color: COLORS.gridLine } }
    },
    series: data.series.map((s, i) => ({
      name: s.name,
      type: 'line',
      data: s.data.map(d => d.value),
      smooth: true,
      lineStyle: { width: s.name === 'All Food at Home' ? 3 : 2, color: seriesColors[i] },
      itemStyle: { color: seriesColors[i] },
      symbol: 'none',
      ...(s.name === 'All Food at Home' ? {
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: 'rgba(1,118,211,0.15)' },
            { offset: 1, color: 'rgba(1,118,211,0.01)' }
          ])
        }
      } : {})
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

  // Also show 2020 values for comparison
  const startValues = data.series.map(s => s.data[0].value);
  const changesPct = latestValues.map((v, i) => ((v - startValues[i]) / startValues[i] * 100).toFixed(1));

  chart.setOption({
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
      ...TOOLTIP_STYLE,
      formatter: params => {
        let tip = `<strong>${params[0].name}</strong><br/>`;
        params.forEach(p => {
          tip += `${p.marker} ${p.seriesName}: <strong>${p.value}</strong><br/>`;
        });
        return tip;
      }
    },
    legend: {
      data: ['Jan 2020', 'Latest (2025)'],
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
          color: 'rgba(255,255,255,0.15)'
        },
        animationDuration: 1500
      },
      {
        name: 'Latest (2025)',
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
      inRange: { color: [COLORS.mapLow, COLORS.mapMid, COLORS.mapHigh] },
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
        borderColor: 'rgba(255,255,255,0.25)',
        borderWidth: 0.8,
        areaColor: 'rgba(255,255,255,0.08)'
      },
      label: { show: false },
      data: mapData,
      animationDurationUpdate: 500
    }]
  }, true);
}

// -- Chart 4: Cost Burden by Income Bracket (bar) --
function renderBurden(quintiles) {
  const chart = createChart('chart-burden');
  if (!chart) return;

  const labels = quintiles.map(q => q.label);
  const shares = quintiles.map(q => q.foodSharePct);
  const monthlyCosts = quintiles.map(q => q.monthlyFoodCost);

  chart.setOption({
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
      ...TOOLTIP_STYLE,
      formatter: params => {
        const idx = params[0].dataIndex;
        const q = quintiles[idx];
        return `<strong>${q.label}</strong><br/>
          Median Income: ${q.income}<br/>
          <span style="color:${COLORS.accent}">Food Share:</span> <strong>${q.foodSharePct}%</strong> of income<br/>
          Monthly Food Cost: $${q.monthlyFoodCost}`;
      }
    },
    grid: { left: 120, right: 50, top: 20, bottom: 40 },
    xAxis: {
      type: 'value',
      name: '% of Income on Food',
      nameLocation: 'center',
      nameGap: 25,
      nameTextStyle: { color: COLORS.textMuted },
      axisLabel: { color: COLORS.textMuted, formatter: '{value}%' },
      splitLine: { lineStyle: { color: COLORS.gridLine } },
      max: 35
    },
    yAxis: {
      type: 'category',
      data: labels.reverse(),
      axisLabel: { color: COLORS.text, fontSize: 11 },
      axisLine: { lineStyle: { color: COLORS.gridLine } }
    },
    series: [{
      type: 'bar',
      data: shares.reverse(),
      barWidth: '55%',
      label: {
        show: true,
        position: 'right',
        color: COLORS.text,
        formatter: '{c}%'
      },
      itemStyle: {
        borderRadius: [0, 4, 4, 0],
        color: (params) => {
          const val = params.value;
          if (val > 25) return COLORS.mapHigh;
          if (val > 15) return COLORS.mapMid;
          return COLORS.mapLow;
        }
      },
      animationDuration: 1500,
      animationDelay: (idx) => idx * 150
    }]
  });
}

// -- Chart 5: Food at Home vs Away Trends (line) --
function renderHomeVsAway(blsData) {
  const chart = createChart('chart-home-vs-away');
  if (!chart || !blsData || !blsData.series) return;

  const foodHome = blsData.series.find(s => s.name === 'Food at Home');
  const foodAway = blsData.series.find(s => s.name === 'Food Away from Home');
  const allItems = blsData.series.find(s => s.name === 'All Items');

  if (!foodHome) return;

  chart.setOption({
    tooltip: {
      trigger: 'axis',
      ...TOOLTIP_STYLE,
      formatter: params => {
        let tip = `<strong>${params[0].axisValue}</strong><br/>`;
        params.forEach(p => {
          tip += `${p.marker} ${p.seriesName}: <strong>${p.value}</strong><br/>`;
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

    // Chart 2: Regional Price Comparison
    renderRegions(regionalData.regions);

    // Chart 3: Affordability Map
    renderAffordabilityMap(geoJSON, regionalData.stateAffordability.states);

    // Chart 4: Cost Burden
    renderBurden(regionalData.affordability.quintiles);

    // Chart 5: Home vs Away (uses main BLS data)
    if (blsData) {
      renderHomeVsAway(blsData);
      updateFreshness('bls-regional', { _cached: true, _cachedAt: blsData.fetchedAt });
    }

    // Scroll reveal
    initScrollReveal();

    // Responsive
    window.addEventListener('resize', handleResize);

    // Try live BLS data for chart 5
    fetchLiveBLS();

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
    updateFreshness('bls-regional', liveData);
  } catch { /* PHP proxy unavailable */ }
}

// Start when DOM ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
