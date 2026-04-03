/**
 * @fileoverview Nonprofit Directory — search and browse food bank organizations
 * @description Searchable directory powered by ProPublica Nonprofit Explorer API
 */

import { initScrollReveal, handleResize } from './shared/dashboard-utils.js';

// NTEE code descriptions (common food/human service codes)
const NTEE_MAP = {
  K: 'Food, Agriculture & Nutrition',
  K20: 'Agricultural Programs',
  K25: 'Farmland Preservation',
  K26: 'Community Gardens',
  K30: 'Food Programs',
  K31: 'Food Banks & Food Pantries',
  K34: 'Congregate Meals',
  K35: 'Soup Kitchens',
  K36: 'Meals on Wheels',
  K40: 'Nutrition Programs',
  P: 'Human Services',
  P20: 'Human Service Organizations',
  P60: 'Emergency Assistance',
  P600: 'Emergency Assistance',
  T: 'Philanthropy & Voluntarism',
  T70: 'Federated Giving Programs',
  X: 'Religion-Related',
  X20: 'Christian',
  X21: 'Protestant'
};

function getNteeName(code) {
  if (!code) return 'Nonprofit';
  const clean = code.replace(/Z$/, '');
  if (NTEE_MAP[clean]) return NTEE_MAP[clean];
  const prefix = clean.charAt(0);
  if (NTEE_MAP[prefix]) return NTEE_MAP[prefix];
  return code;
}

function isFoodRelated(code) {
  if (!code) return false;
  return code.startsWith('K');
}

const US_STATES = [
  ['AL','Alabama'],['AK','Alaska'],['AZ','Arizona'],['AR','Arkansas'],['CA','California'],
  ['CO','Colorado'],['CT','Connecticut'],['DE','Delaware'],['DC','District of Columbia'],
  ['FL','Florida'],['GA','Georgia'],['HI','Hawaii'],['ID','Idaho'],['IL','Illinois'],
  ['IN','Indiana'],['IA','Iowa'],['KS','Kansas'],['KY','Kentucky'],['LA','Louisiana'],
  ['ME','Maine'],['MD','Maryland'],['MA','Massachusetts'],['MI','Michigan'],['MN','Minnesota'],
  ['MS','Mississippi'],['MO','Missouri'],['MT','Montana'],['NE','Nebraska'],['NV','Nevada'],
  ['NH','New Hampshire'],['NJ','New Jersey'],['NM','New Mexico'],['NY','New York'],
  ['NC','North Carolina'],['ND','North Dakota'],['OH','Ohio'],['OK','Oklahoma'],['OR','Oregon'],
  ['PA','Pennsylvania'],['RI','Rhode Island'],['SC','South Carolina'],['SD','South Dakota'],
  ['TN','Tennessee'],['TX','Texas'],['UT','Utah'],['VT','Vermont'],['VA','Virginia'],
  ['WA','Washington'],['WV','West Virginia'],['WI','Wisconsin'],['WY','Wyoming']
];

let searchTimeout = null;

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

  // Show loading
  resultsGrid.innerHTML = '<div class="directory-empty-state">Searching...</div>';
  if (paginationEl) paginationEl.innerHTML = '';

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
  history.replaceState(null, '', newUrl);

  try {
    const res = await fetch(`/api/nonprofit-search.php?${params.toString()}`);
    if (!res.ok) throw new Error('API error');
    const data = await res.json();
    if (data.error) throw new Error(data.error);

    renderResults(data, resultsGrid);
    renderPagination(data, paginationEl, query, state);

    if (countEl) {
      countEl.textContent = data.total_results > 0
        ? `${data.total_results.toLocaleString()} organizations found`
        : '';
    }
  } catch {
    resultsGrid.innerHTML = '<div class="directory-empty-state">Unable to search organizations. Please try again.</div>';
  }
}

function renderResults(data, container) {
  if (!data.organizations || data.organizations.length === 0) {
    container.innerHTML = '<div class="directory-empty-state">No organizations found. Try a different search term or state.</div>';
    return;
  }

  container.innerHTML = data.organizations.map(org => {
    const ntee = getNteeName(org.ntee_code);
    const foodBadge = isFoodRelated(org.ntee_code)
      ? '<span class="directory-org-card__badge directory-org-card__badge--food">Food & Nutrition</span>'
      : '';
    const nteeBadge = org.ntee_code
      ? `<span class="directory-org-card__badge">${org.ntee_code}</span>`
      : '';

    return `<article class="directory-org-card">
      <a href="/dashboards/nonprofit-profile.html?ein=${org.ein}" class="directory-org-card__name">${escapeHtml(org.name)}</a>
      <span class="directory-org-card__location">${escapeHtml(org.city || '')}, ${org.state || ''}</span>
      <span class="directory-org-card__location" style="font-size:0.78rem;color:rgba(255,255,255,0.4)">${ntee}</span>
      <div class="directory-org-card__badges">${foodBadge}${nteeBadge}</div>
    </article>`;
  }).join('');
}

function renderPagination(data, container, query, state) {
  if (!container || data.num_pages <= 1) return;

  const current = data.cur_page;
  const total = Math.min(data.num_pages, 40); // Cap at 1000 results (40 pages x 25)
  const buttons = [];

  // Previous
  buttons.push(`<button class="directory-pagination__btn" ${current === 0 ? 'disabled' : ''} data-page="${current - 1}">&laquo; Prev</button>`);

  // Page numbers with ellipsis
  const range = buildPageRange(current, total);
  range.forEach(p => {
    if (p === '...') {
      buttons.push('<span class="directory-pagination__ellipsis">...</span>');
    } else {
      buttons.push(`<button class="directory-pagination__btn${p === current ? ' directory-pagination__btn--active' : ''}" data-page="${p}">${p + 1}</button>`);
    }
  });

  // Next
  buttons.push(`<button class="directory-pagination__btn" ${current >= total - 1 ? 'disabled' : ''} data-page="${current + 1}">Next &raquo;</button>`);

  container.innerHTML = buttons.join('');

  // Bind click handlers
  container.querySelectorAll('button[data-page]').forEach(btn => {
    btn.addEventListener('click', () => {
      const page = parseInt(btn.dataset.page, 10);
      if (!isNaN(page) && page >= 0) {
        handleSearch(query, state, page);
        document.getElementById('results-section')?.scrollIntoView({ behavior: 'smooth' });
      }
    });
  });
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

function init() {
  populateStateDropdown();

  const input = document.getElementById('directory-search-input');
  const select = document.getElementById('directory-state-select');
  const btn = document.getElementById('directory-search-btn');

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

  initScrollReveal();
  window.addEventListener('resize', handleResize);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
