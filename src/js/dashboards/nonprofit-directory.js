/**
 * @fileoverview Nonprofit Directory — search and browse food bank organizations
 * @description Searchable directory powered by ProPublica Nonprofit Explorer API
 */

import {
  fmtNum, initScrollReveal, handleResize,
  getNteeName, US_STATES
} from './shared/dashboard-utils.js';

let searchTimeout = null;
let searchAbortController = null;
let currentQuery = '';
let currentState = '';

function populateStateDropdown() {
  const select = document.getElementById('directory-state-select');
  if (!select) return;
  US_STATES.forEach(([abbr, name]) => {
    const opt = document.createElement('option');
    opt.value = abbr;
    opt.textContent = name;
    select.appendChild(opt);
  });
}

async function handleSearch(query, state, page) {
  const resultsGrid = document.getElementById('directory-results');
  const countEl = document.getElementById('directory-results-count');
  const paginationEl = document.getElementById('directory-pagination');

  if (!resultsGrid) return;

  currentQuery = query;
  currentState = state;

  // Show loading
  resultsGrid.innerHTML = '<div class="directory-empty-state">Searching...</div>';
  if (paginationEl) paginationEl.innerHTML = '';

  // Cancel any in-flight search so stale results can't overwrite newer ones
  if (searchAbortController) searchAbortController.abort();
  searchAbortController = new AbortController();
  const { signal } = searchAbortController;

  // Build API URL
  const params = new URLSearchParams();
  if (query) params.set('q', query);
  if (state) params.set('state', state);
  params.set('page', page);

  // Update browser URL without reload
  const browserParams = new URLSearchParams();
  if (query) browserParams.set('q', query);
  if (state) browserParams.set('state', state);
  if (page > 0) browserParams.set('page', page);
  const newUrl = browserParams.toString()
    ? `${window.location.pathname}?${browserParams.toString()}`
    : window.location.pathname;
  try {
    history.replaceState(null, '', newUrl);
  } catch { /* Chromium quota: 100 calls / 30s — ignore to avoid unwinding handler */ }

  try {
    const res = await fetch(`/api/nonprofit-search.php?${params.toString()}`, { signal });
    if (!res.ok) throw new Error('API error');
    const data = await res.json();
    if (data.error) throw new Error(data.error);

    renderResults(data, resultsGrid);
    renderPagination(data, paginationEl);

    if (countEl) {
      const queryLabel = query ? ` for "${query}"` : '';
      const stateLabel = state ? ` in ${state}` : '';
      countEl.textContent = data.total_results > 0
        ? `${data.total_results.toLocaleString()} organizations found${queryLabel}${stateLabel}`
        : '';
    }
  } catch (e) {
    if (e?.name === 'AbortError') return;
    resultsGrid.innerHTML = '<div class="directory-empty-state">Unable to search organizations. Please try again.</div>';
  }
}

function fmtRevenue(val) {
  if (!val || val === 0) return '';
  if (val >= 1e9) return '$' + (val / 1e9).toFixed(1) + 'B';
  if (val >= 1e6) return '$' + (val / 1e6).toFixed(1) + 'M';
  if (val >= 1e3) return '$' + (val / 1e3).toFixed(0) + 'K';
  return '$' + val.toLocaleString();
}

// Categorize org by NTEE code + name keywords
function getOrgCategory(nteeCode, name) {
  const code = (nteeCode || '').toUpperCase().replace(/Z$/, '');
  const n = (name || '').toLowerCase();

  // Specific NTEE codes first
  if (code === 'K31') {
    if (n.includes('pantry') || n.includes('pantries')) return { label: 'Food Pantry', css: 'pantry' };
    return { label: 'Food Bank', css: 'foodbank' };
  }
  if (code === 'K34') return { label: 'Congregate Meals', css: 'meals' };
  if (code === 'K35') return { label: 'Soup Kitchen', css: 'kitchen' };
  if (code === 'K36') return { label: 'Meals on Wheels', css: 'meals' };
  if (code === 'K30') return { label: 'Food Programs', css: 'food' };
  if (code === 'K40') return { label: 'Nutrition', css: 'nutrition' };
  if (code.startsWith('K')) return { label: 'Food & Nutrition', css: 'food' };

  // Name-based detection for orgs without K-code
  if (n.includes('food bank')) return { label: 'Food Bank', css: 'foodbank' };
  if (n.includes('food pantry') || n.includes('pantry')) return { label: 'Food Pantry', css: 'pantry' };
  if (n.includes('soup kitchen')) return { label: 'Soup Kitchen', css: 'kitchen' };
  if (n.includes('meals on wheels')) return { label: 'Meals on Wheels', css: 'meals' };
  if (n.includes('hunger') || n.includes('feeding') || n.includes('food rescue') || n.includes('food recovery')) return { label: 'Hunger Relief', css: 'hunger' };
  if (n.includes('food')) return { label: 'Food Programs', css: 'food' };

  // Non-food NTEE categories
  if (code.startsWith('P')) return { label: 'Human Services', css: 'services' };
  if (code.startsWith('T')) return { label: 'Philanthropy', css: 'philanthropy' };
  if (code.startsWith('X')) return { label: 'Faith-Based', css: 'faith' };
  if (code.startsWith('E')) return { label: 'Healthcare', css: 'healthcare' };
  if (code.startsWith('B')) return { label: 'Education', css: 'education' };

  return { label: 'Nonprofit', css: 'default' };
}

function renderResults(data, container) {
  if (!data.organizations || data.organizations.length === 0) {
    container.innerHTML = '<div class="directory-empty-state">No organizations found. Try a different search term or state.</div>';
    return;
  }

  container.innerHTML = data.organizations.map(org => {
    const ntee = getNteeName(org.ntee_code);
    const category = getOrgCategory(org.ntee_code, org.name);
    const categoryBadge = `<span class="directory-org-card__badge directory-org-card__badge--${category.css}">${category.label}</span>`;
    const nteeBadge = org.ntee_code
      ? `<span class="directory-org-card__badge">${escapeHtml(org.ntee_code)}</span>`
      : '';
    const revBadge = org.income_amount
      ? `<span class="directory-org-card__badge directory-org-card__badge--revenue">${fmtRevenue(org.income_amount)}</span>`
      : '';

    return `<article class="directory-org-card">
      <a href="/dashboards/nonprofit-profile.html?ein=${encodeURIComponent(org.ein || '')}" class="directory-org-card__name">${escapeHtml(org.name)}</a>
      <span class="directory-org-card__location">${escapeHtml(org.city || '')}, ${escapeHtml(org.state || '')}</span>
      <span class="directory-org-card__ntee">${escapeHtml(ntee)}</span>
      <div class="directory-org-card__badges">${categoryBadge}${revBadge}${nteeBadge}</div>
    </article>`;
  }).join('');
}

// Event delegation for pagination (prevents memory leak from per-button listeners)
function renderPagination(data, container) {
  if (!container || data.num_pages <= 1) return;

  const current = data.cur_page;
  const total = Math.min(data.num_pages, 40);
  const buttons = [];

  buttons.push(`<button class="directory-pagination__btn" ${current === 0 ? 'disabled' : ''} data-page="${current - 1}">&laquo; Prev</button>`);

  const range = buildPageRange(current, total);
  range.forEach(p => {
    if (p === '...') {
      buttons.push('<span class="directory-pagination__ellipsis">...</span>');
    } else {
      buttons.push(`<button class="directory-pagination__btn${p === current ? ' directory-pagination__btn--active' : ''}" data-page="${p}">${p + 1}</button>`);
    }
  });

  buttons.push(`<button class="directory-pagination__btn" ${current >= total - 1 ? 'disabled' : ''} data-page="${current + 1}">Next &raquo;</button>`);

  container.innerHTML = buttons.join('');
}

function buildPageRange(current, total) {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i);

  const pages = [];
  pages.push(0);
  if (current > 3) pages.push('...');
  const start = Math.max(1, current - 1);
  const end = Math.min(total - 2, current + 1);
  for (let i = start; i <= end; i++) pages.push(i);
  if (current < total - 4) pages.push('...');
  pages.push(total - 1);
  return pages;
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

// -- Find Help Near Me (Mapbox geocode → ProPublica search) --
function initFindHelp() {
  const input = document.getElementById('help-search-input');
  const btn = document.getElementById('help-search-btn');
  const status = document.getElementById('help-search-status');
  const results = document.getElementById('help-search-results');
  if (!input || !btn) return;

  async function doSearch() {
    const query = input.value.trim();
    if (query.length < 2) {
      if (status) status.textContent = 'Please enter at least 2 characters.';
      return;
    }

    if (status) status.textContent = 'Finding your location...';
    if (results) results.innerHTML = '';

    try {
      const geoRes = await fetch(`/api/mapbox-geocode.php?q=${encodeURIComponent(query)}&limit=1`);
      if (!geoRes.ok) throw new Error('Geocoding failed');
      const geoData = await geoRes.json();

      if (!geoData.results || geoData.results.length === 0) {
        if (status) status.textContent = 'Location not found. Try a more specific address or zip code.';
        return;
      }

      const location = geoData.results[0];
      const stateCode = location.state;
      if (!stateCode) {
        if (status) status.textContent = 'Could not determine state from that location. Try including a state or zip code.';
        return;
      }

      if (status) status.textContent = `Found: ${location.name || location.city + ', ' + stateCode}. Searching for food banks...`;

      const searchRes = await fetch(`/api/nonprofit-search.php?q=food+bank&state=${stateCode}`);
      if (!searchRes.ok) throw new Error('Nonprofit search failed');
      const searchData = await searchRes.json();

      const orgs = searchData.organizations || searchData.results || [];
      if (orgs.length === 0) {
        if (status) status.textContent = `No food assistance organizations found in ${stateCode}. Try broadening your search.`;
        return;
      }

      if (status) status.textContent = `Found ${orgs.length}+ food assistance organizations in ${stateCode}:`;

      if (results) {
        results.innerHTML = orgs.slice(0, 20).map(org => {
          const name = org.name || org.organization?.name || 'Unknown';
          const city = org.city || org.organization?.city || '';
          const state = org.state || org.organization?.state || stateCode;
          const ein = org.ein || org.organization?.ein || '';
          const revenue = org.total_revenue || org.organization?.total_revenue;
          const revenueStr = revenue ? `$${fmtNum(revenue)}` : '';
          const profileUrl = ein ? `/dashboards/nonprofit-profile.html?ein=${encodeURIComponent(ein)}` : '';

          return `<div class="help-result-card">
            <div class="help-result-card__title">${profileUrl ? `<a href="${profileUrl}" class="help-result-card__title-link">${escapeHtml(name)}</a>` : escapeHtml(name)}</div>
            <div class="help-result-card__meta">
              ${escapeHtml(city)}${city && state ? ', ' : ''}${escapeHtml(state)}
              ${revenueStr ? ` &middot; Revenue: ${escapeHtml(revenueStr)}` : ''}
              ${profileUrl ? ` &middot; <a href="${profileUrl}" class="help-result-card__profile-link">View Profile</a>` : ''}
            </div>
          </div>`;
        }).join('');
      }
    } catch {
      if (status) status.textContent = 'Search unavailable. The geocoding or nonprofit API may be down — try again later.';
    }
  }

  btn.addEventListener('click', doSearch);
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') doSearch();
  });
}

function init() {
  populateStateDropdown();
  initFindHelp();

  const input = document.getElementById('directory-search-input');
  const select = document.getElementById('directory-state-select');
  const btn = document.getElementById('directory-search-btn');
  const paginationEl = document.getElementById('directory-pagination');

  // Read URL params for initial state
  const params = new URLSearchParams(window.location.search);
  const initialQuery = params.get('q') || '';
  const initialState = params.get('state') || '';
  const initialPage = parseInt(params.get('page'), 10) || 0;

  if (input && initialQuery) input.value = initialQuery;
  if (select && initialState) select.value = initialState;

  // Auto-search if URL has params
  if (initialQuery || initialState) {
    handleSearch(initialQuery, initialState, initialPage);
  }

  // Search button click
  if (btn) {
    btn.addEventListener('click', () => {
      handleSearch(input?.value || '', select?.value || '', 0);
    });
  }

  // Enter key on input
  if (input) {
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        handleSearch(input.value, select?.value || '', 0);
      }
    });

    // Debounced search on input
    input.addEventListener('input', () => {
      clearTimeout(searchTimeout);
      searchTimeout = setTimeout(() => {
        if (input.value.length >= 3) {
          handleSearch(input.value, select?.value || '', 0);
        }
      }, 300);
    });
  }

  // State change triggers search
  if (select) {
    select.addEventListener('change', () => {
      handleSearch(input?.value || '', select.value, 0);
    });
  }

  // Popular search chips
  document.querySelectorAll('.directory-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      const query = chip.dataset.query;
      if (input) input.value = query;
      handleSearch(query, select?.value || '', 0);
    });
  });

  // Pagination — event delegation (single listener, no memory leak)
  if (paginationEl) {
    paginationEl.addEventListener('click', (e) => {
      const btn2 = e.target.closest('button[data-page]');
      if (!btn2 || btn2.disabled) return;
      const page = parseInt(btn2.dataset.page, 10);
      if (!isNaN(page) && page >= 0) {
        handleSearch(currentQuery, currentState, page);
        document.getElementById('results-section')?.scrollIntoView({ behavior: 'smooth' });
      }
    });
  }

  initScrollReveal();
  window.addEventListener('resize', handleResize);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
