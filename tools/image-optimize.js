/**
 * image-optimize.js (moved to tools/)
 *
 * Same script as original, moved for storage as a local tool.
 */

const path = require('path');
const fs = require('fs').promises;
const sharp = require('sharp');

const ROOTS = [
  path.join(__dirname, '..', 'assets', 'images', 'commercial'),
  path.join(__dirname, '..', 'assets', 'images', 'residential')
];

ROOTS.push(path.join(__dirname, '..', 'assets', 'images', 'audiovideo'));
const WIDTHS = [400, 800, 1200, 2400];
const WEBP_QUALITY = 75;
const JPEG_QUALITY = 85;

async function walkDir(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const res = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...await walkDir(res));
    } else {
      files.push(res);
    }
  }
  return files;
}

function isSourceImage(filename) {
  const ext = path.extname(filename).toLowerCase();
  if (!['.jpg', '.jpeg', '.png', '.webp'].includes(ext)) return false;
  if (/-\d+w\.(webp|jpe?g|png)$/i.test(filename)) return false;
  return true;
}

async function processFile(filePath) {
  try {
    if (!isSourceImage(filePath)) return;

    const dir = path.dirname(filePath);
    const ext = path.extname(filePath);
    const base = path.basename(filePath, ext);
    const webpEntries = [];
    const jpgEntries = [];

    for (const w of WIDTHS) {
      const webpName = `${base}-${w}w.webp`;
      const webpPath = path.join(dir, webpName);
      const jpgName = `${base}-${w}w.jpg`;
      const jpgPath = path.join(dir, jpgName);

      try {
        const [srcStat, webpStat, jpgStat] = await Promise.all([
          fs.stat(filePath),
          fs.stat(webpPath).catch(() => null),
          fs.stat(jpgPath).catch(() => null)
        ]);
        if (webpStat && webpStat.mtimeMs >= srcStat.mtimeMs && jpgStat && jpgStat.mtimeMs >= srcStat.mtimeMs) {
          webpEntries.push(`${webpName} ${w}w`);
          jpgEntries.push(`${jpgName} ${w}w`);
          continue;
        }
      } catch (e) {}

      await sharp(filePath)
        .resize({ width: w })
        .webp({ quality: WEBP_QUALITY })
        .toFile(webpPath);

      await sharp(filePath)
        .resize({ width: w })
        .jpeg({ quality: JPEG_QUALITY })
        .toFile(jpgPath);

      webpEntries.push(`${webpName} ${w}w`);
      jpgEntries.push(`${jpgName} ${w}w`);
    }

    try {
      const srcsetFile = path.join(dir, 'srcsets.json');
      let srcData = {};
      try { const raw = await fs.readFile(srcsetFile, 'utf8'); srcData = JSON.parse(raw); } catch (e) { srcData = {}; }

      srcData[base] = { webp: webpEntries.join(', '), jpg: jpgEntries.join(', ') };
      await fs.writeFile(srcsetFile, JSON.stringify(srcData, null, 2), 'utf8');
    } catch (err) {
      console.error('Error writing srcsets for', filePath, err.message);
    }
  } catch (err) {
    console.error('Error processing', filePath, err.message);
  }
}

(async () => {
  try {
    for (const ROOT of ROOTS) {
      const allFiles = await walkDir(ROOT);
      const srcFiles = allFiles.filter(f => isSourceImage(f));
      if (srcFiles.length === 0) continue;
      for (const f of srcFiles) await processFile(f);
    }
  } catch (err) {
    console.error('Fatal error:', err);
  }
})();
