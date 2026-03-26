#!/usr/bin/env node

/**
 * Simple Lighthouse Testing Script
 * Uses npx to run Lighthouse without complex setup
 */

import { spawn, exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const execAsync = promisify(exec);
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Configuration
const CONFIG = {
  pages: [
    'http://localhost:4173/',
    'http://localhost:4173/about.html',
    'http://localhost:4173/services.html',
    'http://localhost:4173/impact.html',
    'http://localhost:4173/resources.html',
    'http://localhost:4173/contact.html'
  ],
  outputDir: path.join(__dirname, '../../lighthouse-reports')
};

// Color output
const log = {
  info: (msg) => console.log(`\x1b[36m${msg}\x1b[0m`),
  success: (msg) => console.log(`\x1b[32m${msg}\x1b[0m`),
  warning: (msg) => console.log(`\x1b[33m${msg}\x1b[0m`),
  error: (msg) => console.log(`\x1b[31m${msg}\x1b[0m`)
};

// Check if server is running
async function checkServer() {
  try {
    const response = await fetch('http://localhost:4173/');
    return response.ok;
  } catch {
    return false;
  }
}

// Start preview server
async function startServer() {
  log.info('📦 Building project...');
  await execAsync('npm run build');
  log.success('✅ Build complete');

  log.info('🚀 Starting preview server...');
  const server = spawn('npm', ['run', 'preview'], {
    shell: true,
    detached: false
  });

  // Wait for server to be ready
  let attempts = 0;
  while (attempts < 30) {
    if (await checkServer()) {
      log.success('✅ Server is ready');
      return server;
    }
    await new Promise(resolve => setTimeout(resolve, 1000));
    attempts++;
  }

  throw new Error('Server failed to start');
}

// Run Lighthouse on a single page
async function runLighthouse(url) {
  const pageName = url.split('/').pop() || 'index';
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').substring(0, 19);
  const outputPath = path.join(CONFIG.outputDir, `${pageName}-${timestamp}`);

  log.info(`\n📄 Testing: ${url}`);

  const command = `npx lighthouse "${url}" --output=html --output=json --output-path="${outputPath}" --chrome-flags="--headless --no-sandbox" --preset=desktop --throttling.cpuSlowdownMultiplier=1 --quiet`;

  try {
    const { stdout } = await execAsync(command);

    // Parse scores from output
    const lines = stdout.split('\n');
    const scores = {};

    lines.forEach(line => {
      if (line.includes('Performance:')) {
        const match = line.match(/Performance:\s*(\d+)/);
        if (match) scores.Performance = parseInt(match[1]);
      } else if (line.includes('Accessibility:')) {
        const match = line.match(/Accessibility:\s*(\d+)/);
        if (match) scores.Accessibility = parseInt(match[1]);
      } else if (line.includes('Best Practices:')) {
        const match = line.match(/Best Practices:\s*(\d+)/);
        if (match) scores['Best Practices'] = parseInt(match[1]);
      } else if (line.includes('SEO:')) {
        const match = line.match(/SEO:\s*(\d+)/);
        if (match) scores.SEO = parseInt(match[1]);
      }
    });

    // Display scores
    Object.entries(scores).forEach(([category, score]) => {
      const color = score >= 90 ? 'success' : score >= 50 ? 'warning' : 'error';
      log[color](`  ${category}: ${score}%`);
    });

    log.success(`  ✅ Report saved: ${outputPath}.html`);
    return scores;

  } catch (error) {
    log.error(`  ❌ Failed: ${error.message}`);
    return null;
  }
}

// Main execution
async function main() {
  log.info('\n🔍 Lighthouse Performance Testing');
  log.info('=' .repeat(50));

  let server = null;
  const results = [];

  try {
    // Ensure output directory exists
    await fs.mkdir(CONFIG.outputDir, { recursive: true });

    // Check if server is already running
    if (await checkServer()) {
      log.success('✅ Using existing server on port 4173');
    } else {
      server = await startServer();
    }

    // Test each page
    for (const url of CONFIG.pages) {
      const scores = await runLighthouse(url);
      if (scores) {
        results.push({ url, scores });
      }
    }

    // Summary
    log.info('\n' + '=' .repeat(50));
    log.info('📊 Summary');
    log.info('=' .repeat(50));

    if (results.length > 0) {
      // Calculate averages
      const categories = ['Performance', 'Accessibility', 'Best Practices', 'SEO'];
      const averages = {};

      categories.forEach(category => {
        const scores = results
          .map(r => r.scores[category])
          .filter(s => s !== undefined);

        if (scores.length > 0) {
          averages[category] = Math.round(
            scores.reduce((a, b) => a + b, 0) / scores.length
          );
        }
      });

      log.info('\nAverage Scores:');
      Object.entries(averages).forEach(([category, score]) => {
        const color = score >= 90 ? 'success' : score >= 50 ? 'warning' : 'error';
        log[color](`  ${category}: ${score}%`);
      });
    }

    log.success(`\n✅ Testing complete! Reports saved to: ${CONFIG.outputDir}`);

  } catch (error) {
    log.error(`\n❌ Fatal error: ${error.message}`);
    console.error(error);
    process.exit(1);
  } finally {
    if (server) {
      log.info('\n🧹 Stopping server...');
      server.kill();
    }
  }
}

// Run if called directly
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main().catch(console.error);
}