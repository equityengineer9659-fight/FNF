/**
 * @fileoverview Nonprofit Organization Profile — ECharts visualizations from IRS 990 data
 * @description 6 charts: revenue trend, revenue composition, expenses vs revenue,
 *              assets & liabilities, compensation breakdown, fundraising efficiency radar.
 */

import {
  echarts, COLORS, TOOLTIP_STYLE,
  createChart, initScrollReveal, handleResize, linearRegression,
  getNteeName
} from './shared/dashboard-utils.js';

// -- Currency formatter for display --
function fmtCurrency(value) {
  if (value == null) return '\u2014';
  if (Math.abs(value) >= 1e9) return '$' + (value / 1e9).toFixed(1) + 'B';
  if (Math.abs(value) >= 1e6) return '$' + (value / 1e6).toFixed(1) + 'M';
  if (Math.abs(value) >= 1e3) return '$' + (value / 1e3).toFixed(0) + 'K';
  return '$' + value.toLocaleString();
}

// -- Title case helper --
function toTitleCase(str) {
  if (!str) return '';
  return str.toLowerCase().replace(/\b\w/g, c => c.toUpperCase());
}

// -- Fetch and render Charity Navigator rating (non-blocking) --
async function fetchCharityNavigator(ein) {
  try {
    const res = await fetch(`/api/charity-navigator.php?ein=${encodeURIComponent(ein)}`);
    if (!res.ok) return;
    const json = await res.json();
    if (json.error || json._notConfigured || json._notRated || !json.organization) return;

    const org = json.organization;
    const section = document.getElementById('cn-rating-section');
    if (!section) return;

    // Show the section
    section.classList.remove('hidden');

    // Render gauge chart for overall score
    const score = org.overallRating?.score;
    if (score != null) {
      const gaugeEl = document.getElementById('chart-cn-gauge');
      if (gaugeEl) {
        const chart = createChart('chart-cn-gauge');
        if (chart) {
          const color = score >= 90 ? '#22c55e' : score >= 75 ? '#fbbf24' : score >= 50 ? '#f97316' : '#ef4444';
          chart.setOption({
            series: [{
              type: 'gauge',
              startAngle: 200,
              endAngle: -20,
              radius: '90%',
              center: ['50%', '60%'],
              min: 0,
              max: 100,
              splitNumber: 0,
              axisLine: {
                lineStyle: {
                  width: 8,
                  color: [[score / 100, color], [1, 'rgba(255,255,255,0.08)']]
                }
              },
              pointer: { show: false },
              axisTick: { show: false },
              splitLine: { show: false },
              axisLabel: { show: false },
              detail: {
                valueAnimation: true,
                formatter: '{value}',
                fontSize: 20,
                fontWeight: 700,
                color: color,
                offsetCenter: [0, '10%']
              },
              data: [{ value: score }]
            }]
          });
        }
      }
    }

    // Beacon level badge
    const beaconEl = document.getElementById('cn-beacon-level');
    if (beaconEl && org.beacon?.level) {
      const level = org.beacon.level.toLowerCase();
      beaconEl.textContent = org.beacon.level;
      beaconEl.className = `profile-cn-rating__beacon profile-cn-rating__beacon--${level}`;
    } else if (beaconEl && org.overallRating?.rating) {
      beaconEl.textContent = org.overallRating.rating;
      beaconEl.className = 'profile-cn-rating__beacon';
      beaconEl.style.background = 'rgba(255,255,255,0.1)';
      beaconEl.style.color = 'rgba(255,255,255,0.7)';
    }

    // Mission statement
    const missionEl = document.getElementById('cn-mission');
    if (missionEl && org.mission) {
      missionEl.textContent = org.mission;
    } else if (missionEl) {
      missionEl.style.display = 'none';
    }
  } catch {
    // Charity Navigator is optional — fail silently
  }
}

// -- Populate header from org data --
function populateHeader(org) {
  const nameEl = document.getElementById('org-name');
  if (nameEl) nameEl.textContent = toTitleCase(org.name);

  const locEl = document.getElementById('org-location');
  if (locEl) locEl.textContent = `${toTitleCase(org.city || '')}, ${org.state || ''} ${org.zipcode || ''}`;

  const einEl = document.getElementById('org-ein');
  if (einEl) einEl.textContent = `EIN: ${org.strein || org.ein}`;

  const nteeEl = document.getElementById('org-ntee');
  if (nteeEl) nteeEl.textContent = getNteeName(org.ntee_code);

  const statusEl = document.getElementById('org-status');
  if (statusEl) {
    statusEl.textContent = org.subsection_code === 3
      ? '501(c)(3)'
      : `501(c)(${org.subsection_code})`;
  }

  document.title = `${toTitleCase(org.name)} — Nonprofit Profile | Food-N-Force`;
}

// -- Populate key stats from most recent filing --
function populateStats(filings) {
  if (!filings || filings.length === 0) return;

  // Find the most recent filing year
  const sorted = [...filings].sort((a, b) => (b.tax_prd_yr || 0) - (a.tax_prd_yr || 0));
  const filing = sorted[0];

  const statRevenue = document.getElementById('stat-revenue');
  if (statRevenue) statRevenue.textContent = fmtCurrency(filing.totrevenue);

  const statExpenses = document.getElementById('stat-expenses');
  if (statExpenses) statExpenses.textContent = fmtCurrency(filing.totfuncexpns);

  const statAssets = document.getElementById('stat-assets');
  if (statAssets) statAssets.textContent = fmtCurrency(filing.totnetassetend);

  const statContributions = document.getElementById('stat-contributions');
  if (statContributions) statContributions.textContent = fmtCurrency(filing.totcntrbgfts);

  // YoY change badges
  if (filings.length >= 2) {
    const current = sorted[0];
    const prior = sorted[1];

    const changes = [
      { id: 'stat-revenue-change', curr: current.totrevenue, prev: prior.totrevenue },
      { id: 'stat-expenses-change', curr: current.totfuncexpns, prev: prior.totfuncexpns },
      { id: 'stat-assets-change', curr: current.totnetassetend, prev: prior.totnetassetend },
      { id: 'stat-contributions-change', curr: current.totcntrbgfts, prev: prior.totcntrbgfts }
    ];

    changes.forEach(({ id, curr, prev }) => {
      const el = document.getElementById(id);
      if (!el || !prev || prev === 0) return;
      const pct = ((curr - prev) / Math.abs(prev) * 100).toFixed(1);
      const arrow = pct >= 0 ? '\u25B2' : '\u25BC';
      el.textContent = `${arrow} ${Math.abs(pct)}%`;
      el.style.color = pct >= 0 ? '#22c55e' : '#ef4444';
    });
  }
}

// -- Prepare filing data arrays sorted by year --
function prepareFilingData(filings) {
  const sorted = [...filings].sort((a, b) => (a.tax_prd_yr || 0) - (b.tax_prd_yr || 0));

  const years = [];
  const revenue = [];
  const expenses = [];
  const contributions = [];
  const programRevenue = [];
  const investmentIncome = [];
  const assets = [];
  const liabilities = [];
  const netAssets = [];
  const officerComp = [];
  const salaries = [];
  const payrollTax = [];
  const fundraising = [];

  sorted.forEach(f => {
    years.push(String(f.tax_prd_yr));
    revenue.push(f.totrevenue || 0);
    expenses.push(f.totfuncexpns || 0);
    contributions.push(f.totcntrbgfts || 0);
    programRevenue.push(f.totprgmrevnue || 0);
    investmentIncome.push(f.invstmntinc || 0);
    assets.push(f.totassetsend || 0);
    liabilities.push(f.totliabend || 0);
    netAssets.push(f.totnetassetend || 0);
    officerComp.push(f.compnsatncurrofcr || 0);
    salaries.push(f.othrsalwages || 0);
    payrollTax.push(f.payrolltx || 0);
    fundraising.push(f.profndraising || 0);
  });

  return {
    years, revenue, expenses, contributions, programRevenue, investmentIncome,
    assets, liabilities, netAssets, officerComp, salaries, payrollTax, fundraising
  };
}

// -- Helper: check if array has any non-zero values --
function hasData(arr) {
  return arr && arr.some(v => v !== 0);
}

// -- Helper: show a chart section and create chart (must show BEFORE echarts.init) --
function showAndCreateChart(sectionId, chartId) {
  const section = document.getElementById(sectionId);
  if (section) section.classList.remove('hidden');
  return createChart(chartId);
}

// -- Chart 1: Revenue Trend (line with area gradient, or bar for single year) --
function renderRevenueTrend(data) {
  const chart = showAndCreateChart('section-revenue-trend', 'chart-revenue-trend');
  if (!chart) return;
  const singleYear = data.years.length <= 2;

  const option = {
    tooltip: {
      trigger: 'axis',
      ...TOOLTIP_STYLE,
      formatter: params => {
        const p = params[0];
        const idx = p.dataIndex;
        let tip = `<strong>${p.name}</strong><br/>`;
        tip += `<span class="csp-text-secondary">Revenue:</span> <strong>${fmtCurrency(p.value)}</strong>`;
        if (idx > 0 && data.revenue[idx - 1] > 0) {
          const change = ((data.revenue[idx] - data.revenue[idx - 1]) / data.revenue[idx - 1] * 100).toFixed(1);
          const arrow = change >= 0 ? '\u25B2' : '\u25BC';
          tip += `<br/><span class="${change >= 0 ? 'text-data-success' : 'text-data-negative'}">${arrow} ${change}% YoY</span>`;
        }
        return tip;
      }
    },
    grid: { left: 70, right: 20, top: 20, bottom: data.years.length > 5 ? 60 : 30 },
    xAxis: {
      type: 'category',
      data: data.years,
      axisLabel: { color: COLORS.textMuted },
      axisLine: { lineStyle: { color: COLORS.gridLine } }
    },
    yAxis: {
      type: 'value',
      axisLabel: { color: COLORS.textMuted, formatter: v => fmtCurrency(v) },
      splitLine: { lineStyle: { color: COLORS.gridLine } }
    },
    series: [singleYear ? {
      type: 'bar',
      data: data.revenue,
      barWidth: '40%',
      itemStyle: {
        color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
          { offset: 0, color: COLORS.primary },
          { offset: 1, color: COLORS.secondary }
        ]),
        borderRadius: [4, 4, 0, 0]
      },
      animationDuration: 1500
    } : {
      type: 'line',
      data: data.revenue,
      smooth: true,
      lineStyle: { width: 3, color: COLORS.primary },
      showSymbol: false,
      areaStyle: {
        color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
          { offset: 0, color: COLORS.primary },
          { offset: 1, color: 'transparent' }
        ])
      },
      itemStyle: { color: COLORS.primary },
      animationDuration: 2000
    }]
  };

  if (data.years.length > 5) {
    option.dataZoom = [{
      type: 'slider', start: 0, end: 100, height: 20, bottom: 5,
      borderColor: COLORS.gridLine, backgroundColor: 'rgba(255,255,255,0.03)',
      fillerColor: 'rgba(1,118,211,0.15)', handleStyle: { color: COLORS.primary },
      textStyle: { color: COLORS.textMuted }
    }];
  }

  chart.setOption(option);

  if (data.years.length > 2) {
    const points = data.years.map((_, i) => [i, data.revenue[i]]);
    const reg = linearRegression(points);
    const mean = data.revenue.reduce((s, v) => s + v, 0) / data.revenue.length;
    const stdDev = Math.sqrt(data.revenue.reduce((s, v) => s + Math.pow(v - mean, 2), 0) / data.revenue.length);

    // Add regression line and volatility band via merge option
    chart.setOption({
      series: [{
        markLine: {
          silent: true,
          symbol: 'none',
          lineStyle: { color: 'rgba(255,255,255,0.3)', type: 'dashed', width: 1.5 },
          data: [[
            { coord: [0, reg.intercept], symbol: 'none' },
            { coord: [data.years.length - 1, reg.slope * (data.years.length - 1) + reg.intercept], symbol: 'none' }
          ]],
          label: { show: true, formatter: 'Trend', color: 'rgba(255,255,255,0.4)', fontSize: 10, position: 'end' }
        },
        markArea: {
          silent: true,
          data: [[
            { yAxis: mean + stdDev, itemStyle: { color: 'rgba(1,118,211,0.06)' } },
            { yAxis: Math.max(0, mean - stdDev) }
          ]],
          label: { show: false }
        }
      }]
    });
  }
}

// -- Chart 2: Revenue Composition (stacked bar or donut) --
function renderRevenueComposition(data) {
  const chart = showAndCreateChart('section-revenue-composition', 'chart-revenue-composition');
  if (!chart) return;

  if (data.years.length > 1) {
    // Stacked bar chart — shows revenue growth + composition over time
    chart.setOption({
      tooltip: {
        trigger: 'axis',
        ...TOOLTIP_STYLE,
        formatter: params => {
          const total = params.reduce((s, p) => s + Math.max(0, p.value || 0), 0);
          let tip = `<strong>${params[0].name}</strong><br/>`;
          params.forEach(p => {
            const pct = total > 0 ? (Math.max(0, p.value) / total * 100).toFixed(1) : '0.0';
            tip += `${p.marker} ${p.seriesName}: <strong>${fmtCurrency(p.value)}</strong> (${pct}%)<br/>`;
          });
          tip += `Total: <strong>${fmtCurrency(total)}</strong>`;
          return tip;
        }
      },
      legend: {
        data: ['Contributions', 'Program Revenue', 'Investment Income'],
        textStyle: { color: COLORS.text },
        top: 0
      },
      grid: { left: 70, right: 20, top: 40, bottom: 30 },
      xAxis: {
        type: 'category',
        data: data.years,
        axisLabel: { color: COLORS.textMuted },
        axisLine: { lineStyle: { color: COLORS.gridLine } }
      },
      yAxis: {
        type: 'value',
        axisLabel: { color: COLORS.textMuted, formatter: v => fmtCurrency(v) },
        splitLine: { lineStyle: { color: COLORS.gridLine } }
      },
      series: [
        {
          name: 'Contributions', type: 'bar', stack: 'revenue',
          data: data.contributions,
          itemStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: '#3b82f6' },
              { offset: 1, color: '#0176d3' }
            ])
          },
          emphasis: { focus: 'series' },
          animationDuration: 1500
        },
        {
          name: 'Program Revenue', type: 'bar', stack: 'revenue',
          data: data.programRevenue,
          itemStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: '#34d399' },
              { offset: 1, color: '#10b981' }
            ])
          },
          emphasis: { focus: 'series' },
          animationDuration: 1500
        },
        {
          name: 'Investment Income', type: 'bar', stack: 'revenue',
          data: data.investmentIncome.map(v => Math.max(0, v)),
          itemStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: '#fbbf24' },
              { offset: 1, color: '#f59e0b' }
            ]),
            borderRadius: [3, 3, 0, 0]
          },
          emphasis: { focus: 'series' },
          animationDuration: 1500
        }
      ]
    });
  } else {
    // Donut chart for single year
    const idx = 0;
    const slices = [
      { value: data.contributions[idx], name: 'Contributions', itemStyle: { color: COLORS.primary } },
      { value: data.programRevenue[idx], name: 'Program Revenue', itemStyle: { color: COLORS.secondary } },
      { value: data.investmentIncome[idx], name: 'Investment Income', itemStyle: { color: COLORS.accent } }
    ].filter(s => s.value > 0);

    chart.setOption({
      tooltip: {
        ...TOOLTIP_STYLE,
        formatter: p => `${p.marker} ${p.name}<br/><strong>${fmtCurrency(p.value)}</strong> (${p.percent.toFixed(1)}%)`
      },
      legend: {
        data: slices.map(s => s.name),
        textStyle: { color: COLORS.text },
        bottom: 0
      },
      series: [{
        type: 'pie',
        radius: ['40%', '70%'],
        center: ['50%', '45%'],
        data: slices,
        label: {
          color: COLORS.text,
          formatter: '{b}\n{d}%'
        },
        labelLine: { lineStyle: { color: COLORS.textMuted } },
        animationDuration: 1500
      }]
    });
  }
}

// -- Chart 3: Expenses vs Revenue (waterfall with surplus/deficit line) --
function renderExpensesVsRevenue(data) {
  const chart = showAndCreateChart('section-expenses-vs-revenue', 'chart-expenses-vs-revenue');
  if (!chart) return;

  // Build waterfall: for each year show revenue and expense bars + surplus/deficit line
  const surplus = data.years.map((_, i) => data.revenue[i] - data.expenses[i]);

  chart.setOption({
    tooltip: {
      trigger: 'axis',
      ...TOOLTIP_STYLE,
      formatter: params => {
        const idx = params[0].dataIndex;
        const rev = data.revenue[idx];
        const exp = data.expenses[idx];
        const diff = rev - exp;
        const label = diff >= 0 ? 'Surplus' : 'Deficit';
        return `<strong>${data.years[idx]}</strong><br/>` +
          `Revenue: <strong>${fmtCurrency(rev)}</strong><br/>` +
          `Expenses: <strong>${fmtCurrency(exp)}</strong><br/>` +
          `<span class="${diff >= 0 ? 'text-data-success' : 'text-data-negative'}">${label}: <strong>${fmtCurrency(Math.abs(diff))}</strong></span>`;
      }
    },
    legend: {
      data: ['Revenue', 'Expenses', 'Surplus', 'Deficit'],
      textStyle: { color: COLORS.text },
      top: 0
    },
    grid: { left: 70, right: 20, top: 40, bottom: 30 },
    xAxis: {
      type: 'category',
      data: data.years,
      axisLabel: { color: COLORS.textMuted },
      axisLine: { lineStyle: { color: COLORS.gridLine } }
    },
    yAxis: {
      type: 'value',
      axisLabel: { color: COLORS.textMuted, formatter: v => fmtCurrency(v) },
      splitLine: { lineStyle: { color: COLORS.gridLine } }
    },
    series: [
      {
        name: 'Revenue', type: 'bar',
        data: data.revenue,
        barWidth: '35%',
        itemStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: COLORS.secondary },
            { offset: 1, color: COLORS.primary }
          ]),
          borderRadius: [3, 3, 0, 0]
        },
        animationDuration: 1500
      },
      {
        name: 'Expenses', type: 'bar',
        data: data.expenses,
        barWidth: '35%',
        itemStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: '#fb7185' },
            { offset: 1, color: '#ef4444' }
          ]),
          borderRadius: [3, 3, 0, 0]
        },
        animationDuration: 1500
      },
      {
        name: 'Surplus', type: 'line',
        data: surplus.map(v => v >= 0 ? v : null),
        smooth: true,
        lineStyle: { width: 2.5, color: '#22c55e' },
        itemStyle: { color: '#22c55e' },
        showSymbol: true,
        symbolSize: 8,
        animationDuration: 2000,
        animationDelay: 500
      },
      {
        name: 'Deficit', type: 'line',
        data: surplus.map(v => v < 0 ? v : null),
        smooth: true,
        lineStyle: { width: 2.5, color: '#ef4444', type: 'dashed' },
        itemStyle: { color: '#ef4444' },
        showSymbol: true,
        symbolSize: 8,
        animationDuration: 2000,
        animationDelay: 500
      }
    ]
  });
}

// -- Chart 4: Assets & Liabilities (area + dashed line, or grouped bar for few years) --
function renderAssetsLiabilities(data) {
  const chart = showAndCreateChart('section-assets-liabilities', 'chart-assets-liabilities');
  if (!chart) return;

  const singleYear = data.years.length <= 2;

  if (singleYear) {
    chart.setOption({
      tooltip: {
        trigger: 'axis', ...TOOLTIP_STYLE,
        formatter: params => {
          let tip = `<strong>${params[0].name}</strong><br/>`;
          params.forEach(p => { tip += `${p.marker} ${p.seriesName}: <strong>${fmtCurrency(p.value)}</strong><br/>`; });
          return tip;
        }
      },
      legend: { data: ['Total Assets', 'Total Liabilities', 'Net Assets'], textStyle: { color: COLORS.text }, top: 0 },
      grid: { left: 70, right: 20, top: 40, bottom: 30 },
      xAxis: { type: 'category', data: data.years, axisLabel: { color: COLORS.textMuted }, axisLine: { lineStyle: { color: COLORS.gridLine } } },
      yAxis: { type: 'value', axisLabel: { color: COLORS.textMuted, formatter: v => fmtCurrency(v) }, splitLine: { lineStyle: { color: COLORS.gridLine } } },
      series: [
        { name: 'Total Assets', type: 'bar', data: data.assets, barWidth: '25%', itemStyle: { color: COLORS.primary, borderRadius: [4, 4, 0, 0] }, animationDuration: 1500 },
        { name: 'Total Liabilities', type: 'bar', data: data.liabilities, barWidth: '25%', itemStyle: { color: '#ef4444', borderRadius: [4, 4, 0, 0] }, animationDuration: 1500 },
        { name: 'Net Assets', type: 'bar', data: data.netAssets, barWidth: '25%', itemStyle: { color: '#22c55e', borderRadius: [4, 4, 0, 0] }, animationDuration: 1500 }
      ]
    });
    return;
  }

  chart.setOption({
    tooltip: {
      trigger: 'axis',
      ...TOOLTIP_STYLE,
      formatter: params => {
        let tip = `<strong>${params[0].name}</strong><br/>`;
        params.forEach(p => {
          tip += `${p.marker} ${p.seriesName}: <strong>${fmtCurrency(p.value)}</strong><br/>`;
        });
        return tip;
      }
    },
    legend: {
      data: ['Total Assets', 'Total Liabilities', 'Net Assets'],
      textStyle: { color: COLORS.text },
      top: 0
    },
    grid: { left: 70, right: 20, top: 40, bottom: 30 },
    xAxis: {
      type: 'category',
      data: data.years,
      axisLabel: { color: COLORS.textMuted },
      axisLine: { lineStyle: { color: COLORS.gridLine } }
    },
    yAxis: {
      type: 'value',
      axisLabel: { color: COLORS.textMuted, formatter: v => fmtCurrency(v) },
      splitLine: { lineStyle: { color: COLORS.gridLine } }
    },
    series: [
      {
        name: 'Total Assets', type: 'line', smooth: true,
        data: data.assets,
        lineStyle: { width: 2, color: COLORS.primary },
        itemStyle: { color: COLORS.primary },
        showSymbol: false,
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: 'rgba(1,118,211,0.3)' },
            { offset: 1, color: 'rgba(1,118,211,0)' }
          ])
        },
        animationDuration: 2000
      },
      {
        name: 'Total Liabilities', type: 'line', smooth: true,
        data: data.liabilities,
        lineStyle: { width: 2, color: '#ef4444' },
        itemStyle: { color: '#ef4444' },
        showSymbol: false,
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: 'rgba(239,68,68,0.2)' },
            { offset: 1, color: 'rgba(239,68,68,0)' }
          ])
        },
        animationDuration: 2000
      },
      {
        name: 'Net Assets', type: 'line', smooth: true,
        data: data.netAssets,
        lineStyle: { width: 2, color: '#ffffff', type: 'dashed' },
        itemStyle: { color: '#ffffff' },
        showSymbol: false,
        animationDuration: 2000
      }
    ]
  });
}

// -- Chart 5: Compensation Breakdown (stacked bar + % line, or donut for single year) --
function renderCompensation(data) {
  const chart = showAndCreateChart('section-compensation', 'chart-compensation');
  if (!chart) return;

  if (data.years.length === 1) {
    const slices = [
      { value: data.officerComp[0], name: 'Officer Compensation', itemStyle: { color: '#f59e0b' } },
      { value: data.salaries[0], name: 'Salaries', itemStyle: { color: '#fb923c' } },
      { value: data.payrollTax[0], name: 'Payroll Tax', itemStyle: { color: '#f97316' } }
    ].filter(s => s.value > 0);

    if (slices.length === 0) return;

    chart.setOption({
      tooltip: { ...TOOLTIP_STYLE, formatter: p => `${p.marker} ${p.name}<br/><strong>${fmtCurrency(p.value)}</strong> (${p.percent.toFixed(1)}%)` },
      legend: { data: slices.map(s => s.name), textStyle: { color: COLORS.text }, bottom: 0 },
      series: [{
        type: 'pie', radius: ['35%', '65%'], center: ['50%', '45%'],
        data: slices,
        label: { color: COLORS.text, formatter: '{b}\n{d}%' },
        labelLine: { lineStyle: { color: COLORS.textMuted } },
        animationDuration: 1500
      }]
    });
    return;
  }

  // Calculate total compensation as % of total expenses
  const compPctOfExpenses = data.years.map((_, i) => {
    const totalComp = data.officerComp[i] + data.salaries[i] + data.payrollTax[i];
    return data.expenses[i] > 0
      ? parseFloat((totalComp / data.expenses[i] * 100).toFixed(1))
      : 0;
  });

  chart.setOption({
    tooltip: {
      trigger: 'axis',
      ...TOOLTIP_STYLE,
      formatter: params => {
        let tip = `<strong>${params[0].name}</strong><br/>`;
        let totalComp = 0;
        params.forEach(p => {
          if (p.seriesName === '% of Expenses') {
            tip += `${p.marker} ${p.seriesName}: <strong>${p.value}%</strong><br/>`;
          } else {
            tip += `${p.marker} ${p.seriesName}: <strong>${fmtCurrency(p.value)}</strong><br/>`;
            totalComp += p.value || 0;
          }
        });
        tip += `Total Compensation: <strong>${fmtCurrency(totalComp)}</strong>`;
        return tip;
      }
    },
    legend: {
      data: ['Officer Compensation', 'Salaries', 'Payroll Tax', '% of Expenses'],
      textStyle: { color: COLORS.text },
      top: 0
    },
    grid: { left: 70, right: 60, top: 40, bottom: 30 },
    xAxis: {
      type: 'category',
      data: data.years,
      axisLabel: { color: COLORS.textMuted },
      axisLine: { lineStyle: { color: COLORS.gridLine } }
    },
    yAxis: [
      {
        type: 'value',
        axisLabel: { color: COLORS.textMuted, formatter: v => fmtCurrency(v) },
        splitLine: { lineStyle: { color: COLORS.gridLine } }
      },
      {
        type: 'value',
        position: 'right',
        axisLabel: { color: COLORS.textMuted, formatter: '{value}%' },
        splitLine: { show: false },
        min: 0,
        max: 100
      }
    ],
    series: [
      {
        name: 'Officer Compensation', type: 'bar', stack: 'comp',
        data: data.officerComp,
        itemStyle: { color: '#f59e0b' },
        animationDuration: 1500
      },
      {
        name: 'Salaries', type: 'bar', stack: 'comp',
        data: data.salaries,
        itemStyle: { color: '#fb923c' },
        animationDuration: 1500
      },
      {
        name: 'Payroll Tax', type: 'bar', stack: 'comp',
        data: data.payrollTax,
        itemStyle: { color: '#f97316' },
        animationDuration: 1500
      },
      {
        name: '% of Expenses', type: 'line', yAxisIndex: 1,
        data: compPctOfExpenses,
        lineStyle: { width: 2, color: '#ffffff', type: 'dashed' },
        itemStyle: { color: '#ffffff' },
        showSymbol: true,
        symbolSize: 6,
        animationDuration: 1500
      }
    ]
  });

  // Compensation gauge (most recent year)
  const gaugeContainer = document.getElementById('chart-compensation-gauge');
  if (gaugeContainer) {
    gaugeContainer.classList.remove('hidden');
    const gaugeChart = echarts.init(gaugeContainer, null, { renderer: 'canvas' });

    const compPct = compPctOfExpenses[compPctOfExpenses.length - 1];
    const compPctNum = parseFloat(compPct);
    const gaugeColor = compPctNum < 40 ? '#22c55e' : compPctNum <= 60 ? '#fbbf24' : '#ef4444';

    gaugeChart.setOption({
      series: [{
        type: 'gauge',
        radius: '90%',
        startAngle: 200,
        endAngle: -20,
        min: 0,
        max: 100,
        splitNumber: 5,
        axisLine: {
          lineStyle: {
            width: 15,
            color: [
              [0.4, '#22c55e'],
              [0.6, '#fbbf24'],
              [1, '#ef4444']
            ]
          }
        },
        pointer: { width: 4, length: '60%', itemStyle: { color: '#ffffff' } },
        axisTick: { show: false },
        splitLine: { show: false },
        axisLabel: { show: false },
        title: { show: true, offsetCenter: [0, '70%'], color: COLORS.textMuted, fontSize: 10 },
        detail: {
          valueAnimation: true,
          formatter: '{value}%',
          fontSize: 20,
          fontWeight: 'bold',
          color: gaugeColor,
          offsetCenter: [0, '40%']
        },
        data: [{ value: compPctNum, name: '% of Expenses' }]
      }]
    });
  }
}

// -- Chart 6: Fundraising Efficiency Radar --
function renderFundraising(data) {
  const chart = showAndCreateChart('section-fundraising', 'chart-fundraising');
  if (!chart) return;

  // Use the most recent year (last index)
  const i = data.years.length - 1;
  const exp = data.expenses[i];
  const contrib = data.contributions[i];
  const net = data.netAssets[i];
  const fund = data.fundraising[i];
  const offComp = data.officerComp[i];
  const sal = data.salaries[i];
  const payroll = data.payrollTax[i];

  // 1. Program Expense Ratio
  let programExpenseRatio;
  if (exp > 0 && fund > 0) {
    programExpenseRatio = (exp - fund - offComp - sal - payroll) / exp * 100;
  } else if (exp > 0) {
    programExpenseRatio = (1 - (offComp + sal + payroll) / exp) * 100;
  } else {
    programExpenseRatio = 0;
  }
  programExpenseRatio = Math.max(0, Math.min(100, programExpenseRatio));

  // 2. Revenue Stability
  let revenueStability = 50;
  if (data.years.length > 1) {
    const nonZeroRevs = data.revenue.filter(r => r > 0);
    if (nonZeroRevs.length > 1) {
      const minRev = Math.min(...nonZeroRevs);
      const maxRev = Math.max(...nonZeroRevs);
      revenueStability = maxRev > 0 ? (minRev / maxRev) * 100 : 50;
    }
  }

  // 3. Asset Reserve (capped at 200 for display)
  let assetReserve = exp > 0 ? (net / exp) * 100 : 0;
  assetReserve = Math.max(0, Math.min(200, assetReserve));

  // 4. Fundraising Efficiency
  let fundraisingEfficiency = 50;
  if (contrib > 0) {
    fundraisingEfficiency = (1 - fund / contrib) * 100;
    fundraisingEfficiency = Math.max(0, Math.min(100, fundraisingEfficiency));
  }

  chart.setOption({
    tooltip: { ...TOOLTIP_STYLE },
    radar: {
      center: ['50%', '55%'],
      radius: '60%',
      indicator: [
        { name: 'Program\nExpense Ratio', max: 100 },
        { name: 'Revenue\nStability', max: 100 },
        { name: 'Asset\nReserve', max: 200 },
        { name: 'Fundraising\nEfficiency', max: 100 }
      ],
      shape: 'polygon',
      splitNumber: 4,
      axisName: { color: COLORS.text, fontSize: 11, padding: [0, 0, 0, 0] },
      splitLine: { lineStyle: { color: COLORS.gridLine } },
      splitArea: {
        areaStyle: { color: ['rgba(0,212,255,0.02)', 'rgba(0,212,255,0.05)'] }
      },
      axisLine: { lineStyle: { color: COLORS.gridLine } }
    },
    legend: {
      data: ['Efficiency', 'Benchmark (70%)'],
      textStyle: { color: COLORS.text },
      bottom: 0
    },
    series: [{
      type: 'radar',
      data: [
        {
          value: [
            parseFloat(programExpenseRatio.toFixed(1)),
            parseFloat(revenueStability.toFixed(1)),
            parseFloat(assetReserve.toFixed(1)),
            parseFloat(fundraisingEfficiency.toFixed(1))
          ],
          name: 'Efficiency',
          areaStyle: { color: 'rgba(1,118,211,0.3)' },
          lineStyle: { color: COLORS.primary, width: 2, opacity: 0.8 },
          itemStyle: { color: COLORS.primary },
          label: {
            show: true,
            color: COLORS.text,
            fontSize: 11,
            formatter: params => {
              const val = params.value;
              return typeof val === 'number' ? val.toFixed(1) : val;
            }
          }
        },
        {
          value: [70, 70, 70, 70],
          name: 'Benchmark (70%)',
          lineStyle: { color: '#fbbf24', width: 1.5, type: 'dashed', opacity: 0.6 },
          areaStyle: { color: 'rgba(251,191,36,0.05)' },
          itemStyle: { color: '#fbbf24', opacity: 0.6 },
          symbol: 'diamond',
          symbolSize: 4,
          label: { show: false }
        }
      ],
      animationDuration: 2000
    }]
  });
}

// =============================================
// DYNAMIC DESCRIPTION GENERATORS
// =============================================

function setText(id, text) {
  const el = document.getElementById(id);
  if (el) el.textContent = text;
}

function showInsight(id, text) {
  const el = document.getElementById(id);
  if (el && text) {
    el.textContent = text;
    el.classList.remove('hidden');
  }
}

// -- Profile Summary (top-level org description) --
function describeProfile(org, data, orgName) {
  const section = document.getElementById('profile-summary');
  if (!section) return;
  section.classList.remove('hidden');

  const n = data.years.length;
  const i = n - 1;
  const location = [org.city, org.state].filter(Boolean).join(', ');
  const ntee = getNteeName(org.ntee_code);
  const status = org.subsection_code === 3 ? '501(c)(3) tax-exempt' : `501(c)(${org.subsection_code})`;
  const rulingYear = org.ruling_date ? org.ruling_date.substring(0, 4) : null;

  // Populate contact info panel
  if (org.careofname) {
    const cleaned = org.careofname.replace(/^%\s*/, '');
    if (cleaned) {
      setText('contact-person-value', toTitleCase(cleaned));
      const personEl = document.getElementById('contact-person');
      if (personEl) personEl.classList.remove('hidden');
    }
  }
  setText('contact-address-value', org.address ? toTitleCase(org.address) : '\u2014');
  setText('contact-location-value', [org.city, org.state, org.zipcode].filter(Boolean).join(', '));
  setText('contact-ein-value', org.ein ? String(org.ein).replace(/(\d{2})(\d{7})/, '$1-$2') : '\u2014');
  setText('contact-ruling-value', rulingYear && rulingYear !== '0000' ? rulingYear : '\u2014');
  setText('contact-ntee-value', ntee !== 'Nonprofit' ? `${ntee} (${org.ntee_code || 'N/A'})` : status);
  const ppLink = document.getElementById('contact-propublica-link');
  if (ppLink) ppLink.href = `https://projects.propublica.org/nonprofits/organizations/${org.ein}`;

  // Build the summary paragraph
  const parts = [];

  // Opening — who they are
  let opener = `${orgName} is a ${status} nonprofit`;
  if (ntee !== 'Nonprofit' && ntee !== org.ntee_code) {
    opener += ` classified under ${ntee}`;
  }
  if (location) opener += `, based in ${location}`;
  if (rulingYear && rulingYear !== '0000') {
    opener += `. The organization has held tax-exempt status since ${rulingYear}`;
  }
  opener += '.';
  parts.push(opener);

  // Financial snapshot
  if (n >= 1) {
    const rev = data.revenue[i];
    const exp = data.expenses[i];
    const net = data.netAssets[i];
    const yr = data.years[i];
    const surplus = rev - exp;

    let financial = `In its most recent filing (${yr}), the organization reported ${fmtCurrency(rev)} in total revenue and ${fmtCurrency(exp)} in total expenses`;
    if (surplus >= 0) {
      financial += `, resulting in a ${fmtCurrency(surplus)} operating surplus`;
    } else {
      financial += `, resulting in a ${fmtCurrency(Math.abs(surplus))} operating deficit`;
    }
    financial += `. Net assets stand at ${fmtCurrency(net)}.`;
    parts.push(financial);
  }

  // Multi-year trajectory
  if (n >= 3) {
    const firstRev = data.revenue[0];
    const lastRev = data.revenue[i];
    const growth = firstRev > 0 ? ((lastRev - firstRev) / firstRev * 100).toFixed(0) : 0;
    const peakRev = Math.max(...data.revenue);
    const peakYr = data.years[data.revenue.indexOf(peakRev)];
    const deficitCount = data.years.filter((_, j) => data.expenses[j] > data.revenue[j]).length;

    let trajectory = `Over ${n} years of available data (${data.years[0]}–${data.years[i]}), revenue has `;
    if (growth > 20) {
      trajectory += `grown ${growth}%`;
    } else if (growth < -20) {
      trajectory += `declined ${Math.abs(growth)}%`;
    } else {
      trajectory += 'remained relatively stable';
    }
    if (peakYr !== data.years[i]) {
      trajectory += `, peaking at ${fmtCurrency(peakRev)} in ${peakYr}`;
    }
    trajectory += '. ';
    if (deficitCount === 0) {
      trajectory += `The organization has maintained a surplus in all ${n} filing years.`;
    } else if (deficitCount <= 2) {
      trajectory += `The organization ran a deficit in ${deficitCount} of ${n} years — generally maintaining financial discipline.`;
    } else {
      trajectory += `The organization ran a deficit in ${deficitCount} of ${n} years, suggesting recurring financial pressure.`;
    }
    parts.push(trajectory);
  }

  // Composition insight
  if (n >= 1) {
    const contrib = data.contributions[i];
    const total = contrib + data.programRevenue[i] + Math.max(0, data.investmentIncome[i]);
    const contribPct = total > 0 ? (contrib / total * 100).toFixed(0) : 0;
    if (contribPct > 90) {
      parts.push(`Revenue is heavily concentrated in contributions and grants (${contribPct}%), with minimal program or investment income.`);
    } else if (contribPct > 60) {
      parts.push(`The organization draws ${contribPct}% of revenue from contributions, supplemented by program services and other sources.`);
    }
  }

  setText('profile-summary-text', parts.join(' '));

  // Insight — overall health assessment
  let insight;
  if (n >= 3) {
    const exp = data.expenses[i];
    const net = data.netAssets[i];
    const reserveMonths = exp > 0 ? net / (exp / 12) : 0;
    const officer = data.officerComp[i];
    const sal = data.salaries[i];
    const payroll = data.payrollTax[i];
    const compPct = exp > 0 ? (officer + sal + payroll) / exp * 100 : 0;
    const deficitCount = data.years.filter((_, j) => data.expenses[j] > data.revenue[j]).length;

    if (reserveMonths > 6 && deficitCount <= 1 && compPct < 50) {
      insight = `Overall financial health appears strong: ${reserveMonths.toFixed(0)} months of reserves, consistent surpluses, and personnel costs at ${compPct.toFixed(0)}% of expenses.`;
    } else if (reserveMonths < 3 || deficitCount > n * 0.4) {
      insight = `Financial indicators suggest areas for attention: ${reserveMonths.toFixed(0)} months of reserves and ${deficitCount} deficit years out of ${n}. Strategic planning and reserve building may strengthen long-term sustainability.`;
    } else {
      insight = `The organization shows moderate financial health with ${reserveMonths.toFixed(0)} months of reserves. Review the charts below for detailed analysis of revenue trends, expenses, and operational efficiency.`;
    }
  } else {
    insight = 'Limited filing history is available. The charts below show the financial data from available filings.';
  }
  showInsight('profile-summary-insight', insight);
}

// -- Describe Chart 1: Revenue Trend --
function describeRevenueTrend(data, orgName) {
  const n = data.years.length;
  const first = data.revenue[0];
  const last = data.revenue[n - 1];
  const firstYr = data.years[0];
  const lastYr = data.years[n - 1];

  if (n === 1) {
    setText('info-text-revenue-trend', `${orgName} reported ${fmtCurrency(last)} in total revenue for its ${lastYr} filing.`);
    setText('info-meta-revenue-trend', `Data Year ${lastYr} (1 filing)`);
    showInsight('info-insight-revenue-trend', 'Only one year of filing data is available. Additional filings will enable trend analysis over time.');
    return;
  }

  const growth = first > 0 ? ((last - first) / first * 100).toFixed(1) : 0;
  const peakIdx = data.revenue.indexOf(Math.max(...data.revenue));
  const peakYr = data.years[peakIdx];
  const peakRev = data.revenue[peakIdx];
  const troughIdx = data.revenue.indexOf(Math.min(...data.revenue.filter(r => r > 0)));
  const mean = data.revenue.reduce((s, v) => s + v, 0) / n;
  const stdDev = Math.sqrt(data.revenue.reduce((s, v) => s + Math.pow(v - mean, 2), 0) / n);
  const volatility = mean > 0 ? stdDev / mean : 0;

  let desc;
  if (growth > 10) {
    desc = `${orgName}'s revenue grew from ${fmtCurrency(first)} in ${firstYr} to ${fmtCurrency(last)} in ${lastYr} — a ${growth}% increase over ${n} years.`;
  } else if (growth < -10) {
    desc = `${orgName}'s revenue declined from ${fmtCurrency(first)} in ${firstYr} to ${fmtCurrency(last)} in ${lastYr} — a ${Math.abs(growth)}% decrease. The peak was ${fmtCurrency(peakRev)} in ${peakYr}.`;
  } else if (volatility > 0.3) {
    desc = `${orgName}'s revenue has been volatile, ranging from ${fmtCurrency(data.revenue[troughIdx])} (${data.years[troughIdx]}) to ${fmtCurrency(peakRev)} (${peakYr}). Average annual revenue is ${fmtCurrency(mean)}.`;
  } else {
    desc = `${orgName}'s revenue has been relatively stable around ${fmtCurrency(mean)} per year, with ${n} years of filings from ${firstYr} to ${lastYr}.`;
  }
  setText('info-text-revenue-trend', desc);
  setText('info-meta-revenue-trend', `Data Year ${firstYr}–${lastYr} (${n} filings)`);

  // Insight — always show one
  let insight;
  if (peakYr === '2020' || peakYr === '2021') {
    insight = `Revenue spiked during ${peakYr}, likely reflecting COVID-19 emergency funding and increased demand.`;
  } else if (growth > 50) {
    insight = 'Consistent revenue growth suggests strong donor relationships and expanding program reach.';
  } else if (n >= 3 && data.revenue[n - 1] < data.revenue[n - 2] * 0.9) {
    insight = 'Recent revenue decline may indicate reduced emergency funding, donor fatigue, or program changes.';
  } else if (volatility > 0.3) {
    insight = 'High revenue volatility suggests dependence on large one-time grants or emergency funding cycles.';
  } else if (growth > 0) {
    insight = `Revenue increased ${growth}% over ${n} years. Peak year was ${peakYr} at ${fmtCurrency(peakRev)}.`;
  } else {
    insight = `${n} years of filing data available. Average annual revenue: ${fmtCurrency(mean)}.`;
  }
  showInsight('info-insight-revenue-trend', insight);
}

// -- Describe Chart 2: Revenue Composition --
function describeRevenueComposition(data, orgName) {
  const n = data.years.length;
  const i = n - 1;
  const contrib = data.contributions[i];
  const program = data.programRevenue[i];
  const invest = data.investmentIncome[i];
  const total = contrib + program + Math.max(0, invest);
  const yr = data.years[i];

  if (total === 0) {
    setText('info-text-revenue-composition', `No revenue composition data available for ${orgName}.`);
    return;
  }

  const contribPct = (contrib / total * 100).toFixed(1);
  const programPct = (program / total * 100).toFixed(1);

  if (n === 1) {
    setText('info-text-revenue-composition', `In ${yr}, ${orgName} received ${fmtCurrency(contrib)} in contributions (${contribPct}%), ${fmtCurrency(program)} in program revenue, and ${fmtCurrency(invest)} in investment income.`);
  } else if (contribPct > 80) {
    setText('info-text-revenue-composition', `Contributions and grants account for ${contribPct}% of ${orgName}'s revenue (${fmtCurrency(contrib)} in ${yr}). Program service revenue and investment income make up the remaining ${(100 - contribPct).toFixed(1)}%.`);
  } else if (programPct > 20) {
    setText('info-text-revenue-composition', `${orgName} generates ${programPct}% of revenue from program services (${fmtCurrency(program)} in ${yr}) — reducing reliance on donations alone. Contributions still account for ${contribPct}%.`);
  } else {
    setText('info-text-revenue-composition', `${orgName} has a diversified revenue base: ${contribPct}% contributions, ${programPct}% program revenue. Most recent year (${yr}) total: ${fmtCurrency(total)}.`);
  }
  setText('info-meta-revenue-composition', `Most recent year ${yr}`);

  let insight;
  if (contribPct > 95) {
    insight = 'Heavy dependence on contributions creates vulnerability if donor funding shifts. Consider diversifying revenue streams.';
  } else if (invest < 0) {
    insight = 'Negative investment income in some years may reflect market losses on endowment or reserve funds.';
  } else if (n > 2 && data.programRevenue[i] > data.programRevenue[0] * 1.2) {
    insight = 'Growing program revenue indicates the organization is building sustainable earned-income capacity.';
  } else if (contribPct > 80) {
    insight = `Contributions represent the primary funding source at ${contribPct}%. Tracking donor retention and diversification is key to long-term stability.`;
  } else {
    insight = `Revenue comes from ${contribPct > 0 ? 'contributions' : ''}${programPct > 5 ? ', program services' : ''}${invest > 0 ? ', and investments' : ''}. A diversified base helps weather funding disruptions.`;
  }
  showInsight('info-insight-revenue-composition', insight);
}

// -- Describe Chart 3: Expenses vs Revenue --
function describeExpenses(data, orgName) {
  const n = data.years.length;
  const i = n - 1;
  const rev = data.revenue[i];
  const exp = data.expenses[i];
  const surplus = rev - exp;
  const yr = data.years[i];

  if (n === 1) {
    if (surplus >= 0) {
      setText('info-text-expenses', `${orgName} reported ${fmtCurrency(rev)} in revenue and ${fmtCurrency(exp)} in expenses for ${yr}, resulting in a ${fmtCurrency(surplus)} operating surplus.`);
    } else {
      setText('info-text-expenses', `${orgName} reported a ${fmtCurrency(Math.abs(surplus))} operating deficit in ${yr}, spending more than it received.`);
    }
    setText('info-meta-expenses', `Filing year ${yr}`);
    showInsight('info-insight-expenses', surplus >= 0 ? 'A single-year surplus is encouraging. Multiple years of data will reveal whether this is a consistent pattern.' : 'A single-year deficit may be temporary. Additional filings will show whether this reflects a structural challenge.');
    return;
  }

  const deficitYears = data.years.filter((_, j) => data.expenses[j] > data.revenue[j]).length;
  const surplusYears = n - deficitYears;

  if (surplus >= 0) {
    const pct = rev > 0 ? (surplus / rev * 100).toFixed(1) : '0.0';
    setText('info-text-expenses', `${orgName} ran a ${fmtCurrency(surplus)} surplus in ${yr} (${pct}% of revenue). Over ${n} years, the organization operated at a surplus in ${surplusYears} of ${n} years.`);
  } else {
    setText('info-text-expenses', `${orgName} spent ${fmtCurrency(Math.abs(surplus))} more than it brought in during ${yr}. This was one of ${deficitYears} deficit years out of ${n} filings.`);
  }
  setText('info-meta-expenses', `Data Year ${data.years[0]}–${yr} (${n} filings)`);

  let insight;
  const surplusPct = rev > 0 ? surplus / rev * 100 : 0;
  if (surplusPct > 15) {
    insight = 'A large surplus may indicate opportunity to expand programs or build reserves for future needs.';
  } else if (deficitYears > n * 0.5) {
    insight = 'Frequent operating deficits signal structural financial pressure — expenses consistently outpacing revenue.';
  } else if ((yr === '2020' || yr === '2021') && surplusPct > 10) {
    insight = 'Large surpluses during 2020-2021 likely reflect emergency COVID funding exceeding temporary program costs.';
  } else if (deficitYears === 0) {
    insight = `${surplusYears} consecutive surplus years demonstrates strong financial discipline and sustainable operations.`;
  } else {
    insight = `The organization ran surpluses in ${surplusYears} of ${n} filing years. Monitoring the surplus/deficit pattern helps assess long-term financial health.`;
  }
  showInsight('info-insight-expenses', insight);
}

// -- Describe Chart 4: Assets & Liabilities --
function describeAssets(data, orgName) {
  const n = data.years.length;
  const i = n - 1;
  const assets = data.assets[i];
  const liab = data.liabilities[i];
  const net = data.netAssets[i];
  const exp = data.expenses[i];
  const yr = data.years[i];
  const reserveMonths = exp > 0 ? (net / (exp / 12)).toFixed(1) : 0;
  const debtPct = assets > 0 ? (liab / assets * 100).toFixed(1) : '0.0';

  if (n === 1) {
    setText('info-text-assets', `${orgName} reported ${fmtCurrency(assets)} in total assets, ${fmtCurrency(liab)} in liabilities, and ${fmtCurrency(net)} in net assets for ${yr}.`);
    setText('info-meta-assets', `Filing year ${yr}`);
    showInsight('info-insight-assets', reserveMonths > 6 ? `Approximately ${reserveMonths} months of operating reserves based on this filing year.` : 'Additional filing years will enable balance sheet trend analysis.');
  } else {
    const assetGrowth = data.assets[0] > 0 ? ((assets - data.assets[0]) / data.assets[0] * 100).toFixed(1) : 0;
    if (reserveMonths > 6) {
      setText('info-text-assets', `${orgName} holds ${fmtCurrency(net)} in net assets — approximately ${reserveMonths} months of operating reserves. Total assets grew ${assetGrowth}% from ${data.years[0]} to ${yr}.`);
    } else {
      setText('info-text-assets', `${orgName}'s net assets of ${fmtCurrency(net)} represent roughly ${reserveMonths} months of operating expenses. Liabilities of ${fmtCurrency(liab)} make up ${debtPct}% of total assets.`);
    }
    setText('info-meta-assets', `Data Year ${data.years[0]}–${yr} (${n} filings)`);
  }

  let insight;
  if (reserveMonths > 12) {
    insight = 'Strong reserve position provides a buffer against revenue disruptions and enables strategic investment.';
  } else if (reserveMonths < 3 && reserveMonths > 0) {
    insight = 'Low operating reserves leave the organization vulnerable to funding gaps or unexpected expenses. Building 3-6 months of reserves is a common goal.';
  } else if (debtPct > 50) {
    insight = 'A debt-to-asset ratio above 50% may indicate leveraged growth or deferred obligations that warrant attention.';
  } else if (reserveMonths >= 6) {
    insight = `With approximately ${reserveMonths} months of operating reserves, the organization has a healthy financial cushion. Industry best practice recommends 3-6 months minimum.`;
  } else {
    insight = `Net assets of ${fmtCurrency(net)} with a debt ratio of ${debtPct}% reflect the organization's balance sheet position. Monitoring reserve levels over time is critical for financial planning.`;
  }
  showInsight('info-insight-assets', insight);
}

// -- Describe Chart 5: Compensation --
function describeCompensation(data, orgName) {
  const n = data.years.length;
  const i = n - 1;
  const officer = data.officerComp[i];
  const sal = data.salaries[i];
  const payroll = data.payrollTax[i];
  const totalComp = officer + sal + payroll;
  const exp = data.expenses[i];
  const compPct = exp > 0 ? (totalComp / exp * 100).toFixed(1) : '0.0';
  const yr = data.years[i];

  if (n === 1) {
    setText('info-text-compensation', `${orgName} spent ${fmtCurrency(totalComp)} on personnel in ${yr}: ${fmtCurrency(officer)} in officer compensation, ${fmtCurrency(sal)} in salaries, and ${fmtCurrency(payroll)} in payroll taxes.`);
  } else if (compPct < 40) {
    setText('info-text-compensation', `Personnel costs account for ${compPct}% of ${orgName}'s total expenses — ${fmtCurrency(totalComp)} across officer compensation, salaries, and payroll taxes. This is below the typical nonprofit benchmark of 40-60%.`);
  } else if (compPct <= 60) {
    const officerPct = totalComp > 0 ? (officer / totalComp * 100).toFixed(0) : '0';
    setText('info-text-compensation', `Personnel costs of ${fmtCurrency(totalComp)} represent ${compPct}% of total expenses — within the typical nonprofit range. Officer compensation is ${fmtCurrency(officer)} (${officerPct}% of total compensation).`);
  } else {
    setText('info-text-compensation', `Personnel costs account for ${compPct}% of total expenses — above the typical 40-60% range. Total compensation is ${fmtCurrency(totalComp)}, with ${fmtCurrency(officer)} going to officers.`);
  }
  setText('info-meta-compensation', n > 1 ? `Data Year ${data.years[0]}–${yr}` : `Filing year ${yr}`);

  let insight;
  if (officer > 500000) {
    insight = `Executive compensation of ${fmtCurrency(officer)} is notable — funders and board members may want to benchmark against similarly-sized organizations.`;
  } else if (n > 2) {
    const firstPct = data.expenses[0] > 0 ? (data.officerComp[0] + data.salaries[0] + data.payrollTax[0]) / data.expenses[0] * 100 : 0;
    const lastPct = parseFloat(compPct);
    if (lastPct < firstPct - 5) {
      insight = 'Declining personnel costs as a share of expenses may reflect growing automation, volunteer reliance, or program cost increases.';
    } else if (lastPct > firstPct + 5) {
      insight = 'Rising personnel costs may reflect staff growth, salary increases, or declining program spending.';
    }
  }
  if (!insight) {
    if (compPct < 40) {
      insight = `At ${compPct}% of expenses, personnel costs are lean — common for organizations that rely heavily on volunteers or pass-through food distribution.`;
    } else if (compPct <= 60) {
      insight = `Personnel costs at ${compPct}% of expenses fall within the typical nonprofit range of 40-60%, suggesting balanced staffing relative to program spending.`;
    } else {
      insight = 'Personnel costs above 60% of expenses are common for service-intensive organizations where staff deliver programs directly.';
    }
  }
  showInsight('info-insight-compensation', insight);
}

// -- Describe Chart 6: Efficiency Radar --
function describeEfficiency(data, orgName) {
  const n = data.years.length;
  const i = n - 1;
  const exp = data.expenses[i];
  const contrib = data.contributions[i];
  const net = data.netAssets[i];
  const fund = data.fundraising[i];
  const officer = data.officerComp[i];
  const sal = data.salaries[i];
  const payroll = data.payrollTax[i];

  let programRatio = 0;
  if (exp > 0) {
    programRatio = (1 - (officer + sal + payroll) / exp) * 100;
    programRatio = Math.max(0, Math.min(100, programRatio));
  }
  const cents = (programRatio / 100 * 100).toFixed(0);
  const reserveMonths = exp > 0 ? (net / (exp / 12)).toFixed(1) : 0;

  const dimensions = [
    { name: 'Program Expense Ratio', val: programRatio },
    { name: 'Revenue Stability', val: n > 1 ? (() => { const nz = data.revenue.filter(r => r > 0); return nz.length > 1 ? Math.min(...nz) / Math.max(...nz) * 100 : 50; })() : 50 },
    { name: 'Asset Reserve', val: Math.min(200, exp > 0 ? net / exp * 100 : 0) },
    { name: 'Fundraising Efficiency', val: contrib > 0 ? Math.max(0, Math.min(100, (1 - fund / contrib) * 100)) : 50 }
  ];
  const strongest = dimensions.reduce((a, b) => a.val > b.val ? a : b);
  const weakest = dimensions.reduce((a, b) => a.val < b.val ? a : b);
  const avg = dimensions.reduce((s, d) => s + d.val, 0) / dimensions.length;

  if (n === 1) {
    setText('info-text-efficiency', `Based on the ${data.years[i]} filing, ${orgName}'s program expense ratio is ${programRatio.toFixed(0)}% and asset reserves cover approximately ${reserveMonths} months of operations. Revenue stability requires multiple years to assess.`);
  } else if (avg > 70) {
    setText('info-text-efficiency', `${orgName} scores well across all efficiency dimensions. A program expense ratio of ${programRatio.toFixed(0)}% means ${cents} cents of every dollar goes to programs. Revenue stability and fundraising efficiency are both strong.`);
  } else if (avg < 50) {
    setText('info-text-efficiency', `${orgName} shows room for improvement across efficiency metrics. The program expense ratio of ${programRatio.toFixed(0)}% and ${weakest.name.toLowerCase()} score of ${weakest.val.toFixed(0)} suggest opportunities to optimize operations.`);
  } else {
    setText('info-text-efficiency', `${orgName}'s strongest metric is ${strongest.name.toLowerCase()} at ${strongest.val.toFixed(0)}. The area needing most attention is ${weakest.name.toLowerCase()} at ${weakest.val.toFixed(0)}. Program expense ratio is ${programRatio.toFixed(0)}%, meaning ${cents} cents per dollar reaches programs.`);
  }
  setText('info-meta-efficiency', n > 1 ? `Data Year ${data.years[0]}–${data.years[i]}` : `Filing year ${data.years[i]}`);

  let insight;
  if (programRatio > 85) {
    insight = 'Excellent program efficiency — this organization directs a high percentage of resources directly to its mission.';
  } else if (programRatio < 70) {
    insight = 'A program expense ratio below 70% may concern funders. Consider reviewing administrative and fundraising overhead.';
  } else if (weakest.name === 'Revenue Stability' && weakest.val < 40) {
    insight = 'Volatile revenue makes planning difficult. Diversifying funding sources and building reserves can improve stability.';
  } else if (weakest.name === 'Asset Reserve' && weakest.val < 50) {
    insight = 'Limited reserves leave the organization exposed to funding disruptions. Building 3-6 months of operating reserves is a common goal.';
  } else {
    insight = `With a program expense ratio of ${programRatio.toFixed(0)}% and strongest performance in ${strongest.name.toLowerCase()}, this organization demonstrates solid operational fundamentals.`;
  }
  showInsight('info-insight-efficiency', insight);
}

// -- Error state display --
function showError(msg) {
  // Audit 2026-04-12: the h1 used to stay on "Loading organization..." even
  // after showError fired, so the error panel said "No organization specified"
  // while the heading contradicted it. Update the heading in sync.
  const nameEl = document.getElementById('org-name');
  if (nameEl) nameEl.textContent = 'Organization not found';

  const loadingEl = document.getElementById('profile-loading');
  if (loadingEl) loadingEl.style.display = 'none';

  const errorEl = document.getElementById('profile-error');
  if (errorEl) {
    const p = errorEl.querySelector('p');
    if (p) p.textContent = msg;
    errorEl.classList.remove('hidden');
  }
}

// -- Peer Comparison (non-blocking) --
/**
 * Hydrate peer revenue from the org endpoint.
 *
 * P0-1 bug: ProPublica's /search.json does NOT return `total_revenue` on
 * organization records, so the original single-pass filter
 * (`p.total_revenue > 0`) dropped every peer and the section stayed hidden.
 *
 * Fix: take the first 10 candidates after filtering out the target EIN, then
 * hit `/api/nonprofit-org.php?ein=X` per peer in parallel and pull
 * `filings_with_data[0].totrevenue` (this is ProPublica's actual field name
 * on the org endpoint, NOT `total_revenue`). Each fetch is independently
 * wrapped so a single rejection doesn't collapse Promise.all.
 *
 * Exported for unit testing (see nonprofit-profile-peer-hydration.test.js).
 *
 * @param {Object} searchData - Response body from /api/nonprofit-search.php
 * @param {string} ownEin - EIN of the organization being profiled (excluded)
 * @returns {Promise<Array<{ein:string, strein?:string, name:string, totrevenue:number}>>}
 */
export async function hydratePeerRevenues(searchData, ownEin) {
  const candidates = (searchData?.organizations || [])
    .filter(p => p.ein !== ownEin && p.strein !== ownEin)
    .slice(0, 10);

  const hydrated = await Promise.all(
    candidates.map(peer => {
      const peerEin = peer.ein || peer.strein;
      if (!peerEin) return null;
      return fetch(`/api/nonprofit-org.php?ein=${encodeURIComponent(peerEin)}`)
        .then(res => (res && res.ok ? res.json() : null))
        .then(json => {
          const filing = json?.filings_with_data?.[0];
          const totrevenue = Number(filing?.totrevenue);
          if (!Number.isFinite(totrevenue) || totrevenue <= 0) return null;
          return { ...peer, totrevenue };
        })
        .catch(() => null);
    })
  );

  return hydrated.filter(Boolean);
}

async function fetchPeerComparison(org, data) {
  try {
    const state = org.state;
    const ein = org.strein || org.ein;
    if (!state) return;

    // Search for food bank peers in the same state
    const res = await fetch(`/api/nonprofit-search.php?q=food+bank&state=${state}`);
    if (!res.ok) return;
    const searchData = await res.json();

    // Hydrate peer revenues from the org endpoint (search endpoint doesn't
    // return total_revenue — P0-1 regression fix).
    const peers = await hydratePeerRevenues(searchData, ein);

    if (peers.length < 3) return; // Not enough peers for meaningful comparison

    const section = document.getElementById('section-peer-comparison');
    if (section) section.classList.remove('hidden');

    const chart = createChart('chart-peer-comparison');
    if (!chart) return;

    // This org's metrics from most recent filing
    const latestIdx = data.years.length - 1;
    const thisRevenue = data.revenue[latestIdx] || 0;

    // Peer medians — use hydrated `totrevenue` field (org endpoint schema).
    const peerRevenues = peers.map(p => p.totrevenue).sort((a, b) => a - b);
    const medianRevenue = peerRevenues[Math.floor(peerRevenues.length / 2)];

    const orgName = toTitleCase(org.name);

    chart.setOption({
      tooltip: {
        ...TOOLTIP_STYLE,
        trigger: 'axis',
        formatter: params => {
          let tip = `<strong>${params[0].name}</strong><br/>`;
          params.forEach(p => {
            if (p.seriesName === orgName) {
              tip += `${p.marker} ${p.seriesName}: <strong>${fmtCurrency(thisRevenue)}</strong><br/>`;
            } else {
              tip += `${p.marker} ${p.seriesName}: <strong>${fmtCurrency(medianRevenue)}</strong><br/>`;
            }
          });
          return tip;
        }
      },
      legend: {
        data: [orgName, `State Peer Median (${peers.length} orgs)`],
        textStyle: { color: COLORS.text }, top: 5
      },
      grid: { left: 50, right: 20, top: 40, bottom: 30 },
      xAxis: {
        type: 'category',
        data: ['Total Revenue'],
        axisLabel: { color: COLORS.text }
      },
      yAxis: {
        type: 'value', name: 'Revenue ($)',
        nameTextStyle: { color: COLORS.textMuted },
        axisLabel: { color: COLORS.textMuted, formatter: v => fmtCurrency(v) },
        splitLine: { lineStyle: { color: COLORS.gridLine } }
      },
      series: [
        {
          name: orgName, type: 'bar', barWidth: '30%',
          data: [thisRevenue],
          itemStyle: { color: COLORS.primary, borderRadius: [4, 4, 0, 0] },
          label: { show: true, position: 'top', color: COLORS.text, formatter: p => fmtCurrency(p.value) }
        },
        {
          name: `State Peer Median (${peers.length} orgs)`, type: 'bar', barWidth: '30%',
          data: [medianRevenue],
          itemStyle: { color: 'rgba(255,255,255,0.25)', borderRadius: [4, 4, 0, 0] },
          label: { show: true, position: 'top', color: COLORS.textMuted, formatter: p => fmtCurrency(p.value) }
        }
      ]
    });

    // Insight
    const insightEl = document.getElementById('peer-comparison-insight');
    const textEl = document.getElementById('peer-comparison-text');
    if (textEl) {
      const ratio = medianRevenue > 0 ? (thisRevenue / medianRevenue).toFixed(1) : 0;
      const position = thisRevenue > medianRevenue ? 'above' : thisRevenue < medianRevenue ? 'below' : 'at';
      textEl.textContent = `${orgName}'s revenue of ${fmtCurrency(thisRevenue)} is ${ratio}x the median of ${peers.length} food assistance peers in ${state}. This places the organization ${position} the state median of ${fmtCurrency(medianRevenue)}.`;
    }
    if (insightEl) {
      const percentile = peerRevenues.filter(r => r <= thisRevenue).length / peerRevenues.length * 100;
      insightEl.textContent = `Revenue percentile: ${percentile.toFixed(0)}th among ${state} food assistance nonprofits.`;
    }
  } catch { /* Peer comparison is optional */ }
}

// -- Init --
async function init() {
  const ein = new URLSearchParams(window.location.search).get('ein');
  if (!ein) {
    showError('No organization specified.');
    return;
  }

  try {
    const res = await fetch(`/api/nonprofit-org.php?ein=${encodeURIComponent(ein)}`);
    if (!res.ok) throw new Error('API error');
    const json = await res.json();
    if (json.error) throw new Error(json.error);

    document.getElementById('profile-loading').style.display = 'none';

    populateHeader(json.organization);

    // Fetch Charity Navigator rating in parallel (non-blocking)
    fetchCharityNavigator(ein);

    const filings = json.filings_with_data || [];
    const data = prepareFilingData(filings);

    if (data.years.length === 0) {
      showError('No financial filing data available.');
      return;
    }

    populateStats(filings);
    const orgName = toTitleCase(json.organization.name);

    // Profile summary — top-level org description
    describeProfile(json.organization, data, orgName);

    // Render charts + dynamic descriptions (each isolated so one failure doesn't kill the page)
    const safeRender = (fn) => { try { fn(); } catch { /* chart render failed */ } };

    if (hasData(data.revenue)) safeRender(() => {
      renderRevenueTrend(data);
      describeRevenueTrend(data, orgName);
    });
    if (hasData(data.contributions) || hasData(data.programRevenue) || hasData(data.investmentIncome)) safeRender(() => {
      renderRevenueComposition(data);
      describeRevenueComposition(data, orgName);
    });
    if (hasData(data.revenue) || hasData(data.expenses)) safeRender(() => {
      renderExpensesVsRevenue(data);
      describeExpenses(data, orgName);
    });
    if (hasData(data.assets) || hasData(data.liabilities)) safeRender(() => {
      renderAssetsLiabilities(data);
      describeAssets(data, orgName);
    });
    if (hasData(data.officerComp) || hasData(data.salaries) || hasData(data.payrollTax)) safeRender(() => {
      renderCompensation(data);
      describeCompensation(data, orgName);
    });
    if (hasData(data.expenses)) safeRender(() => {
      renderFundraising(data);
      describeEfficiency(data, orgName);
    });

    initScrollReveal();
    window.addEventListener('resize', handleResize);

    // Non-blocking: peer comparison
    fetchPeerComparison(json.organization, data);
  } catch {
    showError('Unable to load organization data. Please try again.');
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
