import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { PNG } from 'pngjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const beforeDir = path.join(__dirname, 'before');
const afterDir = path.join(__dirname, 'after');

const files = fs.readdirSync(beforeDir).filter(f => f.endsWith('.png'));
let totalDiffs = 0;

for (const file of files) {
  const beforePath = path.join(beforeDir, file);
  const afterPath = path.join(afterDir, file);

  if (!fs.existsSync(afterPath)) {
    console.log(`MISSING: ${file} not in after/`);
    continue;
  }

  const beforeBuf = fs.readFileSync(beforePath);
  const afterBuf = fs.readFileSync(afterPath);

  // Quick byte-level comparison first
  if (Buffer.compare(beforeBuf, afterBuf) === 0) {
    console.log(`IDENTICAL: ${file}`);
    continue;
  }

  // Parse PNGs for pixel comparison
  const beforePng = PNG.sync.read(beforeBuf);
  const afterPng = PNG.sync.read(afterBuf);

  // If dimensions differ, that's a major regression
  if (beforePng.width !== afterPng.width || beforePng.height !== afterPng.height) {
    console.log(`SIZE DIFF: ${file} - before: ${beforePng.width}x${beforePng.height}, after: ${afterPng.width}x${afterPng.height}`);
    totalDiffs++;
    continue;
  }

  // Count differing pixels
  let diffPixels = 0;
  const totalPixels = beforePng.width * beforePng.height;

  for (let i = 0; i < beforePng.data.length; i += 4) {
    const dr = Math.abs(beforePng.data[i] - afterPng.data[i]);
    const dg = Math.abs(beforePng.data[i + 1] - afterPng.data[i + 1]);
    const db = Math.abs(beforePng.data[i + 2] - afterPng.data[i + 2]);

    // Allow small anti-aliasing differences (threshold of 5)
    if (dr > 5 || dg > 5 || db > 5) {
      diffPixels++;
    }
  }

  const diffPercent = ((diffPixels / totalPixels) * 100).toFixed(4);

  if (diffPixels === 0) {
    console.log(`MATCH: ${file} (sub-pixel differences only)`);
  } else if (diffPercent < 0.1) {
    console.log(`MINOR: ${file} - ${diffPixels} pixels differ (${diffPercent}%) - likely anti-aliasing`);
  } else {
    console.log(`DIFF: ${file} - ${diffPixels} pixels differ (${diffPercent}%)`);
    totalDiffs++;
  }
}

console.log(`\n${totalDiffs === 0 ? 'NO REGRESSIONS DETECTED' : `${totalDiffs} REGRESSION(S) FOUND`}`);
process.exit(totalDiffs > 0 ? 1 : 0);
