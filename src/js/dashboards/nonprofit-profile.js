/**
 * @fileoverview Nonprofit Organization Profile — ECharts visualizations from IRS 990 data
 * @description 6 charts: revenue trend, revenue composition, expenses vs revenue,
 *              assets & liabilities, compensation breakdown, fundraising efficiency radar.
 */

import {
  echarts, COLORS, TOOLTIP_STYLE,
  createChart, initScrollReveal, handleResize
} from './shared/dashboard-utils.js';

// -- Currency formatter for display --
function fmtCurrency(value) {
  if (value == null) return '\u2014';
  if (Math.abs(value) >= 1e9) return '$' + (value / 1e9).toFixed(1) + 'B';
  if (Math.abs(value) >= 1e6) return '$' + (value / 1e6).toFixed(1) + 'M';
  if (Math.abs(value) >= 1e3) return '$' + (value / 1e3).toFixed(0) + 'K';
  return '$' + value.toLocaleString();
}

// -- NTEE code lookup --
const NTEE_CODES = {
  'K':   'Food, Agriculture and Nutrition',
  'K20': 'Agricultural Programs',
  'K30': 'Food Programs',
  'K31': 'Food Banks, Food Pantries',
  'K34': 'Congregate Meals',
  'K35': 'Soup Kitchens, Meals on Wheels',
  'K36': 'Meals on Wheels',
  'P':   'Human Services',
  'P20': 'Human Service Organizations',
  'P60': 'Emergency Assistance',
  'P70': 'Residential Care & Adult Day Programs',
  'S':   'Community Improvement',
  'T':   'Philanthropy & Grantmaking',
  'B':   'Education',
  'E':   'Health Care',
  'L':   'Housing & Shelter'
};

function getNteeName(code) {
  if (!code) return 'General Nonprofit';
  const upper = code.toUpperCase().trim();
  if (NTEE_CODES[upper]) return NTEE_CODES[upper];
  // Try just the letter prefix
  const prefix = upper.charAt(0);
  if (NTEE_CODES[prefix]) return NTEE_CODES[prefix];
  return code;
}

// -- Title case helper --
function toTitleCase(str) {
  if (!str) return '';
  return str.toLowerCase().replace(/\b\w/g, c => c.toUpperCase());
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
  if (section) section.style.display = '';
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
        tip += `<span style="color:${COLORS.secondary}">Revenue:</span> <strong>${fmtCurrency(p.value)}</strong>`;
        if (idx > 0 && data.revenue[idx - 1] > 0) {
          const change = ((data.revenue[idx] - data.revenue[idx - 1]) / data.revenue[idx - 1] * 100).toFixed(1);
          const arrow = change >= 0 ? '\u25B2' : '\u25BC';
          const color = change >= 0 ? '#22c55e' : '#ef4444';
          tip += `<br/><span style="color:${color}">${arrow} ${change}% YoY</span>`;
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
}

// -- Chart 2: Revenue Composition (stacked bar or donut) --
function renderRevenueComposition(data) {
  const chart = showAndCreateChart('section-revenue-composition', 'chart-revenue-composition');
  if (!chart) return;

  if (data.years.length > 1) {
    // Stacked bar chart
    chart.setOption({
      tooltip: {
        trigger: 'axis',
        ...TOOLTIP_STYLE,
        formatter: params => {
          let tip = `<strong>${params[0].name}</strong><br/>`;
          const total = params.reduce((s, p) => s + (p.value || 0), 0);
          params.forEach(p => {
            const pct = total > 0 ? (p.value / total * 100).toFixed(1) : '0.0';
            tip += `${p.marker} ${p.seriesName}: <strong>${fmtCurrency(p.value)}</strong> (${pct}%)<br/>`;
          });
          tip += `<br/>Total: <strong>${fmtCurrency(total)}</strong>`;
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
          itemStyle: { color: COLORS.primary },
          animationDuration: 1500
        },
        {
          name: 'Program Revenue', type: 'bar', stack: 'revenue',
          data: data.programRevenue,
          itemStyle: { color: COLORS.secondary },
          animationDuration: 1500
        },
        {
          name: 'Investment Income', type: 'bar', stack: 'revenue',
          data: data.investmentIncome,
          itemStyle: { color: COLORS.accent },
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

// -- Chart 3: Expenses vs Revenue (grouped bar) --
function renderExpensesVsRevenue(data) {
  const chart = showAndCreateChart('section-expenses-vs-revenue', 'chart-expenses-vs-revenue');
  if (!chart) return;

  chart.setOption({
    tooltip: {
      trigger: 'axis',
      ...TOOLTIP_STYLE,
      formatter: params => {
        let tip = `<strong>${params[0].name}</strong><br/>`;
        let rev = 0, exp = 0;
        params.forEach(p => {
          tip += `${p.marker} ${p.seriesName}: <strong>${fmtCurrency(p.value)}</strong><br/>`;
          if (p.seriesName === 'Revenue') rev = p.value;
          if (p.seriesName === 'Expenses') exp = p.value;
        });
        const diff = rev - exp;
        const label = diff >= 0 ? 'Surplus' : 'Deficit';
        const color = diff >= 0 ? '#22c55e' : '#ef4444';
        tip += `<span style="color:${color}">${label}: <strong>${fmtCurrency(Math.abs(diff))}</strong></span>`;
        return tip;
      }
    },
    legend: {
      data: ['Revenue', 'Expenses'],
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
        barWidth: '30%',
        itemStyle: { color: COLORS.secondary, borderRadius: [3, 3, 0, 0] },
        animationDuration: 1500
      },
      {
        name: 'Expenses', type: 'bar',
        data: data.expenses,
        barWidth: '30%',
        itemStyle: { color: '#ef4444', borderRadius: [3, 3, 0, 0] },
        animationDuration: 1500
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
    series: [{
      type: 'radar',
      data: [{
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
      }],
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
    el.style.display = '';
  }
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
  const loadingEl = document.getElementById('profile-loading');
  if (loadingEl) loadingEl.style.display = 'none';

  const errorEl = document.getElementById('profile-error');
  if (errorEl) {
    const p = errorEl.querySelector('p');
    if (p) p.textContent = msg;
    errorEl.style.display = '';
  }
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

    const filings = json.filings_with_data || [];
    const data = prepareFilingData(filings);

    if (data.years.length === 0) {
      showError('No financial filing data available.');
      return;
    }

    populateStats(filings);
    const orgName = toTitleCase(json.organization.name);

    // Render charts + dynamic descriptions
    if (hasData(data.revenue)) {
      renderRevenueTrend(data);
      describeRevenueTrend(data, orgName);
    }
    if (hasData(data.contributions) || hasData(data.programRevenue) || hasData(data.investmentIncome)) {
      renderRevenueComposition(data);
      describeRevenueComposition(data, orgName);
    }
    if (hasData(data.revenue) || hasData(data.expenses)) {
      renderExpensesVsRevenue(data);
      describeExpenses(data, orgName);
    }
    if (hasData(data.assets) || hasData(data.liabilities)) {
      renderAssetsLiabilities(data);
      describeAssets(data, orgName);
    }
    if (hasData(data.officerComp) || hasData(data.salaries) || hasData(data.payrollTax)) {
      renderCompensation(data);
      describeCompensation(data, orgName);
    }
    if (hasData(data.expenses)) {
      renderFundraising(data);
      describeEfficiency(data, orgName);
    }

    initScrollReveal();
    window.addEventListener('resize', handleResize);
  } catch {
    showError('Unable to load organization data. Please try again.');
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
