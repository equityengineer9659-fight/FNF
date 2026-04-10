/**
 * @fileoverview State selector — shared dashboard widget for "Focus on state" filter.
 * Extracted from dashboard-utils.js per audit P3-12 to keep dashboard-utils.js
 * focused on data/chart helpers rather than UI widgets.
 *
 * NOTE: The inline `style="..."` attributes inside the wrapper innerHTML are
 * tracked separately as audit P3-13 (CSP/glassmorphism review). Do not edit
 * those styles here without explicit user permission per the protected-effects
 * rule in CLAUDE.md.
 */

import { US_STATES } from './dashboard-utils.js';

/**
 * Read the current state code from the URL `?state=` query parameter.
 * @returns {string} Two-letter state code or empty string when not set.
 */
export function getSelectedState() {
  return new URLSearchParams(window.location.search).get('state') || '';
}

/**
 * Mount the "Focus on state" select widget into a container element.
 * Updates the URL `?state=` parameter on change and invokes `onSelect`.
 *
 * @param {string} containerId - DOM id of the host element.
 * @param {(stateCode: string) => void} onSelect - Callback fired on selection
 *   change and once on mount when the URL already has a `?state=` value.
 */
export function initStateSelector(containerId, onSelect) {
  const container = document.getElementById(containerId);
  if (!container) return;

  const selected = getSelectedState();

  const wrapper = document.createElement('div');
  wrapper.className = 'dashboard-state-selector';
  wrapper.innerHTML = `
    <label for="state-deep-dive" style="color:rgba(255,255,255,0.6);font-size:12px;margin-right:0.5rem;">Focus on state:</label>
    <select id="state-deep-dive" style="padding:0.4rem 0.6rem;border-radius:4px;border:1px solid rgba(255,255,255,0.2);background:rgba(255,255,255,0.08);color:#fff;font-size:13px;">
      <option value="">All States</option>
      ${US_STATES.map(([code, name]) => `<option value="${code}"${code === selected ? ' selected' : ''}>${name}</option>`).join('')}
    </select>
  `;

  container.appendChild(wrapper);

  const select = wrapper.querySelector('select');
  select.addEventListener('change', () => {
    const val = select.value;
    const url = new URL(window.location);
    if (val) url.searchParams.set('state', val);
    else url.searchParams.delete('state');
    window.history.replaceState({}, '', url);
    if (onSelect) onSelect(val);
  });

  // Trigger initial selection if URL has state param
  if (selected && onSelect) onSelect(selected);
}
