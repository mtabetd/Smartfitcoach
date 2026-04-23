/**
 * Injecte un timestamp dans CACHE_VERSION de sw.js à chaque build Netlify.
 * Sans ça, le browser ne détecte jamais de nouveau SW → l'utilisateur doit
 * fermer complètement l'app pour voir les mises à jour.
 */
const fs = require('fs');
const path = require('path');

const swPath = path.join(__dirname, '../app/sw.js');
const sw = fs.readFileSync(swPath, 'utf8');

const ts = process.env.COMMIT_REF
  ? process.env.COMMIT_REF.slice(0, 8)
  : Date.now().toString(36);

const updated = sw.replace(
  /const CACHE_VERSION = 'sfc-v[^']*';/,
  `const CACHE_VERSION = 'sfc-v${ts}';`
).replace(
  /const RUNTIME_CACHE = 'sfc-runtime-v[^']*';/,
  `const RUNTIME_CACHE = 'sfc-runtime-v${ts}';`
);

if (updated === sw) {
  console.warn('[bump-sw] Pattern not found — CACHE_VERSION unchanged');
  process.exit(0);
}

fs.writeFileSync(swPath, updated);
console.log(`[bump-sw] CACHE_VERSION → sfc-v${ts}`);

// Inject SENTRY_DSN into index.html at build time (Netlify env var)
const sentryDsn = process.env.SENTRY_DSN || '';
if (sentryDsn) {
  const indexPath = path.join(__dirname, '../app/index.html');
  const html = fs.readFileSync(indexPath, 'utf8');
  const patched = html.replace('data-dsn="SENTRY_DSN_PLACEHOLDER"', `data-dsn="${sentryDsn}"`);
  if (patched !== html) {
    fs.writeFileSync(indexPath, patched);
    console.log('[bump-sw] Sentry DSN injected');
  }
}
