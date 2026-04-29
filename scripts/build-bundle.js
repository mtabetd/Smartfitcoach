'use strict';
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const APP_DIR = path.join(__dirname, '../app');

// EXACT ordered list from index.html (all deferred local scripts)
const DEFERRED_SCRIPTS = [
  './chart.umd.min.js',
  './prices-db.js',
  './recipe-engine.js',
  './supabase.min.js',
  './supabase-client.js',
  './exercise-gifs-map.js',
  './exercises-db.js',
  './auth.js',
  './gamification.js',
  './extras.js',
  './food-db.js',
  './food-portions.js',
  './analytics.js',
  './tips-assistant.js',
  './muscu-programs.js',
  './exercise-videos.js',
  './nutrition-master.js',
  './muscle-taxonomy.js',
  './validators.js',
  './app-core.js',
  './i18n-helpers.js',
  './triathlon-program.js',
  './perf-history.js',
  './app-nutrition.js',
  './calisthenics-program.js',
  './sport-data.js',
  './sport-crossfit.js',
  './sport-running.js',
  './sport-cycling.js',
  './app-sport.js',
  './custom-session.js',
  './motivation.js',
  './motivation-library.js',
  './today-dashboard.js',
  './pdf-weekly-report.js',
  './daily-decision-engine.js',
  './smart-calendar.js',
  './auth-banner.js',
  './onboarding-complete.js',
  './app-social.js',
  './feedback-widget.js',
  './plate-scan.js',
  './scanner.js',
  './app-main.js',
  './ai-coach.js',
  './body-analysis.js',
  './muscu-program-generator.js',
  './sw-register.js',
  './push-manager.js',
  './pwa-install.js',
];

const bundlePath = path.join(APP_DIR, 'bundle.js');

const parts = DEFERRED_SCRIPTS.map(function(file) {
  const fullPath = path.join(APP_DIR, file);
  if (!fs.existsSync(fullPath)) {
    console.warn('[build-bundle] Missing:', file);
    return '/* MISSING: ' + file + ' */';
  }
  const content = fs.readFileSync(fullPath, 'utf8');
  return '\n/* ====== ' + file + ' ====== */\n' + content;
});

const banner = '/* SmartFitCoach bundle — generated at build time. Do not edit. */\n';
fs.writeFileSync(bundlePath, banner + parts.join('\n'));
const rawSize = fs.statSync(bundlePath).size;
console.log('[build-bundle] bundle.js written (' + parts.length + ' scripts, ' + Math.round(rawSize / 1024) + ' KB raw)');

// Minify with terser — compress + syntax only, no identifier mangling to preserve
// cross-IIFE window.X globals and pre-minified vendor code (Chart.js).
try {
  console.log('[build-bundle] Minifying with terser…');
  execSync(
    'npx terser ' + bundlePath + ' --compress --output ' + bundlePath,
    { stdio: ['pipe', 'pipe', 'pipe'], cwd: path.join(__dirname, '..') }
  );
  const minSize = fs.statSync(bundlePath).size;
  const saved = rawSize - minSize;
  console.log('[build-bundle] Minified: ' + Math.round(minSize / 1024) + ' KB (saved ' + Math.round(saved / 1024) + ' KB, -' + Math.round(saved / rawSize * 100) + '%)');
} catch (err) {
  // Minification is best-effort — if terser is unavailable at build time, keep raw bundle.
  console.warn('[build-bundle] terser minification failed (keeping raw bundle):', err.message);
}
