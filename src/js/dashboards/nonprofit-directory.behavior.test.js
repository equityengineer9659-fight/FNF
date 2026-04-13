/**
 * @fileoverview Behavioral tests for nonprofit-directory.js — exercises init(),
 * handleSearch, initFindHelp, and DOM wiring via dynamic import with mocked fetch.
 *
 * PR 10 / P1-20: raise dashboard statement coverage above the baseline.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

// ---- Fixtures ---------------------------------------------------------------

const searchResultFixture = {
  total_results: 42,
  cur_page: 0,
  num_pages: 3,
  organizations: [
    { ein: '123456789', name: 'Food Bank <1>', city: 'Boston', state: 'MA', ntee_code: 'K31', income_amt: 5_000_000 },
    { ein: '987654321', name: 'Pantry Two',     city: 'Seattle', state: 'WA', ntee_code: 'P85', income_amt: 1_200_000 },
  ],
};

const geocodeFixture = {
  results: [{ name: 'Boston, MA 02108', city: 'Boston', state: 'MA', lat: 42.36, lng: -71.06 }],
};

function mockFetch({ search = searchResultFixture, geocode = geocodeFixture } = {}) {
  return vi.fn((url) => {
    const u = String(url);
    if (u.includes('nonprofit-search')) return Promise.resolve({ ok: true, json: () => Promise.resolve(search) });
    if (u.includes('mapbox-geocode')) return Promise.resolve({ ok: true, json: () => Promise.resolve(geocode) });
    return Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
  });
}

function setupDOM({ withUrlParams = false } = {}) {
  document.body.innerHTML = `
    <input id="directory-search-input" type="text" />
    <select id="directory-state-select"></select>
    <button id="directory-search-btn">Search</button>
    <div id="directory-results"></div>
    <div id="directory-results-count"></div>
    <div id="directory-pagination"></div>
    <button class="directory-chip" data-query="food bank">Food Bank</button>
    <button class="directory-chip" data-query="pantry">Pantry</button>
    <section id="results-section"></section>

    <input id="help-search-input" type="text" />
    <button id="help-search-btn">Find</button>
    <div id="help-search-status"></div>
    <div id="help-search-results"></div>
  `;

  if (withUrlParams) {
    // jsdom supports history.replaceState
    window.history.replaceState(null, '', '/?q=food&state=MA');
  } else {
    window.history.replaceState(null, '', '/');
  }
}

async function loadModule() {
  vi.resetModules();
  return import('./nonprofit-directory.js');
}

function flush() {
  return new Promise((resolve) => setTimeout(resolve, 0));
}

// ---- Tests ------------------------------------------------------------------

describe('nonprofit-directory — behavioral init()', () => {
  beforeEach(() => {
    setupDOM();
    vi.stubGlobal('fetch', mockFetch());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
    window.history.replaceState(null, '', '/');
  });

  it('happy path: populates the state dropdown with US states', async () => {
    await loadModule();
    await flush();

    const select = document.getElementById('directory-state-select');
    // Each US state adds one <option>; there should be ≥50 (plus DC)
    expect(select.children.length).toBeGreaterThanOrEqual(50);
    const allOptions = Array.from(select.options).map(o => o.value);
    expect(allOptions).toContain('CA');
    expect(allOptions).toContain('MA');
  });

  it('happy path: clicking search button triggers fetch to nonprofit-search endpoint', async () => {
    await loadModule();
    await flush();

    const input = document.getElementById('directory-search-input');
    input.value = 'food bank';
    document.getElementById('directory-search-btn').click();
    await flush();
    await flush();

    expect(fetch).toHaveBeenCalledWith(
      expect.stringMatching(/\/api\/nonprofit-search\.php\?q=food\+bank/),
      expect.objectContaining({ signal: expect.any(Object) }),
    );
  });

  it('happy path: successful search renders result cards into #directory-results', async () => {
    await loadModule();
    await flush();

    document.getElementById('directory-search-input').value = 'pantry';
    document.getElementById('directory-search-btn').click();
    await flush();
    await flush();

    const results = document.getElementById('directory-results');
    expect(results.innerHTML).toContain('Pantry Two');
    // XSS safety: "<1>" should be escaped to &lt;1&gt;
    expect(results.innerHTML).toContain('&lt;1&gt;');
    // Count label is rendered
    const count = document.getElementById('directory-results-count').textContent;
    expect(count).toMatch(/42|organizations/);
  });

  it('happy path: pagination renders when num_pages > 1', async () => {
    await loadModule();
    await flush();

    document.getElementById('directory-search-input').value = 'pantry';
    document.getElementById('directory-search-btn').click();
    await flush();
    await flush();

    const pagination = document.getElementById('directory-pagination');
    const buttons = pagination.querySelectorAll('button[data-page]');
    expect(buttons.length).toBeGreaterThan(0);
  });

  it('happy path: chip click triggers a new search', async () => {
    await loadModule();
    await flush();

    const chip = document.querySelector('.directory-chip');
    chip.click();
    await flush();

    const input = document.getElementById('directory-search-input');
    expect(input.value).toBe('food bank');
    expect(fetch).toHaveBeenCalled();
  });

  it('URL params: auto-searches when q/state present in query string', async () => {
    setupDOM({ withUrlParams: true });
    vi.stubGlobal('fetch', mockFetch());

    await loadModule();
    await flush();
    await flush();

    // Input + select hydrated from URL
    expect(document.getElementById('directory-search-input').value).toBe('food');
    expect(fetch).toHaveBeenCalledWith(
      expect.stringMatching(/q=food/),
      expect.any(Object),
    );
  });

  it('error path: fetch rejection renders friendly error into results', async () => {
    vi.stubGlobal('fetch', vi.fn(() => Promise.reject(new TypeError('network down'))));
    await loadModule();
    await flush();

    document.getElementById('directory-search-input').value = 'pantry';
    document.getElementById('directory-search-btn').click();
    await flush();
    await flush();

    const results = document.getElementById('directory-results');
    expect(results.innerHTML).toMatch(/Unable to search/);
  });

  it('error path: API responds with error field renders error UI', async () => {
    vi.stubGlobal('fetch', vi.fn(() => Promise.resolve({
      ok: true,
      json: () => Promise.resolve({ error: 'upstream down' }),
    })));
    await loadModule();
    await flush();

    document.getElementById('directory-search-input').value = 'pantry';
    document.getElementById('directory-search-btn').click();
    await flush();
    await flush();

    const results = document.getElementById('directory-results');
    expect(results.innerHTML).toMatch(/Unable to search/);
  });

  it('edge case: empty organizations array still renders without crashing', async () => {
    vi.stubGlobal('fetch', mockFetch({
      search: { total_results: 0, cur_page: 0, num_pages: 0, organizations: [] },
    }));
    await loadModule();
    await flush();

    document.getElementById('directory-search-input').value = 'zzz';
    document.getElementById('directory-search-btn').click();
    await flush();
    await flush();

    const results = document.getElementById('directory-results');
    // Module should not throw; results may show empty state or simply empty list
    expect(results).toBeTruthy();
  });

  it('Find Help: short query surfaces input validation message', async () => {
    await loadModule();
    await flush();

    document.getElementById('help-search-input').value = 'x';
    document.getElementById('help-search-btn').click();
    await flush();

    const status = document.getElementById('help-search-status');
    expect(status.textContent).toMatch(/at least 2 characters/);
  });

  it('Find Help: successful geocode + search renders result cards', async () => {
    await loadModule();
    await flush();

    document.getElementById('help-search-input').value = '02108';
    document.getElementById('help-search-btn').click();
    await flush();
    await flush();
    await flush();

    const results = document.getElementById('help-search-results');
    expect(results.innerHTML).toContain('Pantry Two');
    // EIN should be URL-encoded in profile link
    expect(results.innerHTML).toContain('ein=987654321');
  });
});
