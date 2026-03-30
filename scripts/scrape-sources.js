/**
 * FNF Content Scraper - Core module
 * Fetches RSS feeds, filters by date/keywords, detects categories, appends to Articles.xlsx
 */

import Parser from 'rss-parser';
import ExcelJS from 'exceljs';
import path from 'path';
import { existsSync } from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Category detection rules — order matters (first match wins)
export const DEFAULT_CATEGORIES = {
  'AI & Innovation': [
    'ai', 'artificial intelligence', 'machine learning', 'predictive',
    'automation', 'algorithm', 'chatgpt', 'generative', 'large language model',
    'llm', 'deep learning', 'neural network'
  ],
  'Technology Strategy': [
    'salesforce', 'crm', 'cloud', 'software', 'digital transformation',
    'platform', 'nonprofit technology', 'tech strategy', 'database',
    'data management', 'information system', 'erp', 'api integration',
    'nonprofit cloud', 'nonprofit tech'
  ],
  'Case Studies': [
    'case study', 'case-study', 'success story', 'client results',
    'nonprofit achieved', 'impact story', 'how they', 'lessons learned',
    'how we built', 'results from'
  ],
  'Implementation': [
    'implementation', 'workflow', 'process', 'integration', 'deployment',
    'rollout', 'training', 'onboarding', 'setup', 'step-by-step',
    'how to implement', 'best practices', 'getting started'
  ],
  'Industry Insights': [
    'food bank', 'food pantry', 'hunger', 'food insecurity', 'snap',
    'distribution', 'volunteers', 'community', 'nonprofit trends',
    'food rescue', 'gleaning', 'food desert', 'pantry', 'feeding',
    'charitable', 'donation', 'fundraising', 'grant', 'nonprofit'
  ]
};

const CATEGORY_ORDER = [
  'AI & Innovation',
  'Technology Strategy',
  'Case Studies',
  'Implementation',
  'Industry Insights'
];

/**
 * Detect the best category for an article
 * @param {string} title
 * @param {string} description
 * @param {string} defaultCategory - fallback if no keywords match
 * @param {object} categoryRules - map of category → keyword array
 * @returns {{ category: string, keywordsFound: string[] }}
 */
export function detectCategory(
  title = '',
  description = '',
  defaultCategory = 'Industry Insights',
  categoryRules = DEFAULT_CATEGORIES
) {
  const text = (title + ' ' + description).toLowerCase();

  for (const cat of CATEGORY_ORDER) {
    const keywords = categoryRules[cat] || [];
    const found = keywords.filter(kw => text.includes(kw.toLowerCase()));
    if (found.length > 0) {
      return { category: cat, keywordsFound: found };
    }
  }

  return { category: defaultCategory, keywordsFound: [] };
}

/**
 * Main scrape function — fetches feeds, filters, appends to Excel
 * @param {object} config
 * @param {Array} config.feeds - array of { name, url, defaultCategory, enabled }
 * @param {number} config.lookbackDays - how many days back to include
 * @param {string[]} config.keywords - topic keywords (OR logic); empty = include all
 * @param {string[]} config.excludeKeywords - exclusion keywords (AND NOT logic)
 * @param {string} config.xlsxPath - absolute path to Articles.xlsx
 * @param {object} config.categoryRules - optional override for category detection
 * @param {function} progressCb - called with event objects during scraping
 */
export async function scrapeFeeds(config, progressCb) {
  const {
    feeds = [],
    lookbackDays = 30,
    keywords = [],
    excludeKeywords = [],
    xlsxPath,
    categoryRules = DEFAULT_CATEGORIES
  } = config;

  // Compute cutoff date
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - lookbackDays);

  progressCb({
    type: 'info',
    message: `Search window: ${cutoffDate.toLocaleDateString()} → today (${lookbackDays} days)`
  });

  if (keywords.length > 0) {
    progressCb({ type: 'info', message: `Topic filter: ${keywords.join(', ')}` });
  }
  if (excludeKeywords.length > 0) {
    progressCb({ type: 'info', message: `Excluding: ${excludeKeywords.join(', ')}` });
  }

  const parser = new Parser({
    timeout: 12000,
    customFields: {
      item: [
        ['description', 'description'],
        ['content:encoded', 'contentEncoded'],
        ['dc:description', 'dcDescription'],
        ['summary', 'summary']
      ]
    }
  });

  // Load existing URLs to prevent duplicates
  progressCb({ type: 'info', message: 'Reading existing Articles.xlsx for duplicate detection...' });
  const existingUrls = await loadExistingUrls(xlsxPath);
  progressCb({ type: 'info', message: `Found ${existingUrls.size} existing entries in spreadsheet` });

  const allArticles = [];
  const enabledFeeds = feeds.filter(f => f.enabled !== false);

  progressCb({ type: 'info', message: `Scraping ${enabledFeeds.length} feed(s)...` });

  for (const feed of enabledFeeds) {
    progressCb({ type: 'feed-start', feedName: feed.name, url: feed.url });

    try {
      const parsedFeed = await parser.parseURL(feed.url);
      const feedItems = parsedFeed.items || [];
      let foundInRange = 0;

      for (const item of feedItems) {
        const url = item.link || item.guid || '';
        const title = (item.title || '').trim();

        if (!url || !title) continue;

        // Date filter
        const pubDate = item.pubDate || item.isoDate ? new Date(item.pubDate || item.isoDate) : null;
        if (pubDate && pubDate < cutoffDate) continue;

        // Get the best description available
        const rawDesc = item.contentSnippet || item.description || item.summary || item.dcDescription || '';
        const description = rawDesc.replace(/<[^>]*>/g, '').slice(0, 600);

        const searchText = (title + ' ' + description).toLowerCase();

        // Topic keyword filter (OR logic)
        if (keywords.length > 0) {
          const hasMatch = keywords.some(kw => searchText.includes(kw.toLowerCase()));
          if (!hasMatch) continue;
        }

        // Exclude keyword filter (AND NOT logic)
        if (excludeKeywords.length > 0) {
          const isExcluded = excludeKeywords.some(kw => searchText.includes(kw.toLowerCase()));
          if (isExcluded) {
            progressCb({ type: 'skip', title, reason: 'excluded keyword' });
            continue;
          }
        }

        foundInRange++;

        const isNew = !existingUrls.has(url);
        const { category, keywordsFound } = detectCategory(title, description, feed.defaultCategory, categoryRules);

        const article = {
          url,
          title,
          sourceName: feed.name,
          pubDate: pubDate ? pubDate.toISOString().split('T')[0] : '',
          dateScraped: new Date().toISOString().split('T')[0],
          category,
          summary: description.slice(0, 400),
          keywordsFound,
          isNew
        };

        allArticles.push(article);
        progressCb({ type: isNew ? 'new' : 'duplicate', ...article });
      }

      progressCb({ type: 'feed-done', feedName: feed.name, found: foundInRange, total: feedItems.length });

    } catch (err) {
      progressCb({ type: 'feed-error', feedName: feed.name, error: err.message });
    }
  }

  // Write new articles to Excel
  const newArticles = allArticles.filter(a => a.isNew);
  let addedCount = 0;

  if (newArticles.length > 0) {
    progressCb({ type: 'info', message: `Writing ${newArticles.length} new articles to Excel...` });
    try {
      addedCount = await appendToExcel(newArticles, xlsxPath);
      progressCb({ type: 'excel-write', count: addedCount });
    } catch (err) {
      progressCb({ type: 'error', message: `Excel write failed: ${err.message}. Make sure Articles.xlsx is not open in Excel.` });
    }
  } else {
    progressCb({ type: 'info', message: 'No new articles to write — all results were duplicates.' });
  }

  progressCb({
    type: 'done',
    totalFound: allArticles.length,
    totalNew: newArticles.length,
    addedToExcel: addedCount
  });

  return allArticles;
}

/**
 * Load all existing URLs from Articles.xlsx to detect duplicates
 */
async function loadExistingUrls(xlsxPath) {
  const urls = new Set();
  if (!xlsxPath || !existsSync(xlsxPath)) return urls;

  try {
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(xlsxPath);
    const sheet = workbook.getWorksheet('Articles') || workbook.worksheets[0];
    if (!sheet) return urls;

    sheet.eachRow((row, rowNum) => {
      if (rowNum > 1) {
        const cell = row.getCell(1).value;
        if (cell) urls.add(String(cell).trim());
      }
    });
  } catch {
    // File unreadable — treat as empty
  }

  return urls;
}

/**
 * Append articles to Articles.xlsx, creating the file and headers if needed
 * @returns {number} count of rows added
 */
export async function appendToExcel(articles, xlsxPath) {
  const workbook = new ExcelJS.Workbook();
  let sheet;
  let isNewFile = false;

  try {
    await workbook.xlsx.readFile(xlsxPath);
    sheet = workbook.getWorksheet('Articles') || workbook.worksheets[0];
  } catch {
    isNewFile = true;
  }

  if (!sheet) {
    isNewFile = true;
    sheet = workbook.addWorksheet('Articles');
  }

  // Add headers for new file
  if (isNewFile || sheet.rowCount === 0) {
    const headerRow = sheet.addRow([
      'Source URL',
      'Title',
      'Source Name',
      'Published Date',
      'Date Scraped',
      'Suggested Category',
      'Summary',
      'Keywords Found',
      'Status',
      'Notes',
      'Article Slug'
    ]);

    // Style the header row
    headerRow.eachCell(cell => {
      cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E3A5F' } };
      cell.border = {
        bottom: { style: 'medium', color: { argb: 'FF2D6CA2' } }
      };
    });

    // Column widths
    sheet.getColumn(1).width = 65;
    sheet.getColumn(2).width = 65;
    sheet.getColumn(3).width = 28;
    sheet.getColumn(4).width = 16;
    sheet.getColumn(5).width = 16;
    sheet.getColumn(6).width = 24;
    sheet.getColumn(7).width = 70;
    sheet.getColumn(8).width = 35;
    sheet.getColumn(9).width = 13;
    sheet.getColumn(10).width = 35;
    sheet.getColumn(11).width = 45;

    // Freeze top row
    sheet.views = [{ state: 'frozen', ySplit: 1 }];
  }

  for (const article of articles) {
    const row = sheet.addRow([
      article.url,
      article.title,
      article.sourceName,
      article.pubDate,
      article.dateScraped,
      article.category,
      article.summary,
      article.keywordsFound.join(', '),
      'New',
      '',
      ''
    ]);

    // Hyperlink the URL cell
    row.getCell(1).value = {
      text: article.url,
      hyperlink: article.url
    };
    row.getCell(1).font = { color: { argb: 'FF2D6CA2' }, underline: true };
  }

  await workbook.xlsx.writeFile(xlsxPath);
  return articles.length;
}

/**
 * Get current row count from Articles.xlsx (excluding header)
 */
export async function getExcelRowCount(xlsxPath) {
  if (!xlsxPath || !existsSync(xlsxPath)) return 0;
  try {
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(xlsxPath);
    const sheet = workbook.getWorksheet('Articles') || workbook.worksheets[0];
    if (!sheet) return 0;
    return Math.max(0, sheet.rowCount - 1);
  } catch {
    return 0;
  }
}
