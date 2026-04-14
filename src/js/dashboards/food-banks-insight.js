/**
 * @fileoverview Pure helpers extracted from food-banks.js for testability.
 * The original `renderVsInsecurity` function builds an insight string and
 * a sorted deviation array; both crash if the input is empty. Extracting
 * the math lets us cover those edge cases with unit tests.
 */

const EMPTY_MESSAGE =
  'No state-level data available for this view. Try refreshing or check back shortly.';

/**
 * @typedef {Object} StateInput
 * @property {string} name
 * @property {number} population
 * @property {number} foodInsecurityRate
 * @property {number} totalRevenue
 */

/**
 * @typedef {Object} DeviationRow
 * @property {string} name
 * @property {number} deviation
 * @property {number} revPerInsecure
 */

/**
 * @typedef {Object} VsInsecurityInsight
 * @property {string} text
 * @property {DeviationRow[]} deviation   sorted ascending by deviation
 * @property {number} nationalMean
 */

/**
 * Build the deviation array + insight text for the "Revenue per insecure
 * person" chart. Pure: no DOM, no ECharts.
 *
 * @param {StateInput[]} states
 * @returns {VsInsecurityInsight}
 */
export function buildVsInsecurityInsight(states) {
  const stateData = (states || [])
    .map((s) => {
      const insecurePersons = Math.round(
        (s.population || 0) * (s.foodInsecurityRate || 0) / 100,
      );
      const revPerInsecure =
        insecurePersons > 0 ? (s.totalRevenue || 0) / insecurePersons : 0;
      return { name: s.name, revPerInsecure };
    })
    .filter((s) => s.revPerInsecure > 0);

  if (stateData.length === 0) {
    return { text: EMPTY_MESSAGE, deviation: [], nationalMean: 0 };
  }

  const nationalMean = Math.round(
    stateData.reduce((sum, s) => sum + s.revPerInsecure, 0) / stateData.length,
  );

  const deviation = stateData
    .map((s) => ({
      name: s.name,
      deviation: Math.round(s.revPerInsecure - nationalMean),
      revPerInsecure: Math.round(s.revPerInsecure),
    }))
    .sort((a, b) => a.deviation - b.deviation);

  const worst = deviation[0];
  const best = deviation.at(-1);
  const top10 = deviation.slice(0, 10);
  const top10Avg = Math.round(
    top10.reduce((s, d) => s + d.revPerInsecure, 0) / top10.length,
  );

  const text =
    `Revenue per food-insecure person ranges from $${worst.revPerInsecure.toLocaleString()} ` +
    `(${worst.name}) to $${best.revPerInsecure.toLocaleString()} (${best.name}) ` +
    `against a national mean of $${nationalMean.toLocaleString()}. ` +
    'States in red receive less than the mean — the 10 most vulnerable states average ' +
    `just $${top10Avg.toLocaleString()} per person.`;

  return { text, deviation, nationalMean };
}
