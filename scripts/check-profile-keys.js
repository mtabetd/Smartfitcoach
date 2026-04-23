/**
 * SmartFitCoach — PROFILE_KEYS validator
 * Scans app JS files for S.KEY = assignments and flags keys that are:
 *   - Not in PROFILE_KEYS (would be lost on reload)
 *   - Not in the KNOWN_EPHEMERAL whitelist (intentionally transient)
 *
 * Run: node scripts/check-profile-keys.js
 * Exit 1 if genuinely unknown persistent keys are found.
 */
'use strict';
const fs = require('fs');
const path = require('path');

// ── 1. Parse PROFILE_KEYS from app-main.js ────────────────────────────────────
const mainJs = fs.readFileSync(path.join(__dirname, '../app/app-main.js'), 'utf8');
const pkIdx = mainJs.indexOf('var PROFILE_KEYS');
if (pkIdx === -1) { console.error('[pkcheck] PROFILE_KEYS not found'); process.exit(1); }
const bs = mainJs.indexOf('[', pkIdx);
let depth = 0, be = bs;
for (let i = bs; i < mainJs.length; i++) {
  if (mainJs[i] === '[') depth++;
  else if (mainJs[i] === ']') { depth--; if (depth === 0) { be = i; break; } }
}
const profileKeys = new Set(
  (mainJs.slice(bs, be + 1).match(/'([^']+)'/g) || []).map(s => s.slice(1, -1))
);

// ── 2. Known-ephemeral whitelist ──────────────────────────────────────────────
const KNOWN_EPHEMERAL = new Set([
  // Routing
  'view', 'sStep', 'nStep',
  // Auth flow (from Supabase, not localStorage)
  'authError', 'authVerifyEmail', 'justLoggedIn',
  'subscriptionPlan', 'subscriptionEnd',
  // UI open/close / modal state
  'cfCalendarOpen', 'shopListOpen', 'shopArMode', 'smoothieBarOpen',
  'saladBar', 'swapPanel', 'socialTab', 'socialView',
  'sportModalExercise', 'modalRecipe', 'modalSmoothie',
  'sessionCompleting', 'currentExerciseIdx', '_fabOpen',
  // Computed / derived each render
  'calories', 'caloriesTarget', 'muscuDuration',
  // Draft state (discarded on cancel)
  'customSessionDraft',
  // Onboarding reset on entry
  'calisthenicsOnboardingStep',
  // Persisted by their own modules
  'dailyChallengeHistory',
]);

// ── 3. Only scan files that use window.S ─────────────────────────────────────
const appDir = path.join(__dirname, '../app');
const jsFiles = fs.readdirSync(appDir).filter(f =>
  f.endsWith('.js') &&
  !f.startsWith('chart') &&
  !f.startsWith('supabase') &&
  !f.startsWith('jspdf') &&
  f !== 'muscle-taxonomy.js'  // uses S as local parameter, not window.S
);

// ── 4. Find S.KEY = assignments (not reads) ───────────────────────────────────
// Pattern: S.key = value (not S.key === or S.key !== or S.key.sub)
const ASSIGN_RE = /\bS\.([a-zA-Z][a-zA-Z0-9_]*)\s*=[^=]/g;

const foundKeys = new Set();
const keyFiles = {};
for (const fname of jsFiles) {
  const txt = fs.readFileSync(path.join(appDir, fname), 'utf8');
  // Remove comments to avoid false positives
  const stripped = txt.replace(/\/\/[^\n]*/g, '').replace(/\/\*[\s\S]*?\*\//g, '');
  let m;
  ASSIGN_RE.lastIndex = 0;
  while ((m = ASSIGN_RE.exec(stripped)) !== null) {
    const key = m[1];
    if (!foundKeys.has(key)) keyFiles[key] = fname;
    foundKeys.add(key);
  }
}

// ── 5. Flag unknown keys ──────────────────────────────────────────────────────
const unknown = [];
for (const key of foundKeys) {
  if (!profileKeys.has(key) && !KNOWN_EPHEMERAL.has(key) && !key.startsWith('_')) {
    unknown.push({ key, file: keyFiles[key] });
  }
}

if (unknown.length === 0) {
  console.log('[pkcheck] ✓ Tous les S.KEY non-prefixés sont dans PROFILE_KEYS ou KNOWN_EPHEMERAL.');
  process.exit(0);
} else {
  console.error('[pkcheck] ✗ Clés S. non déclarées (' + unknown.length + ') :');
  for (const { key, file } of unknown) {
    console.error('  S.' + key + '  → ' + file);
  }
  console.error('');
  console.error('  Ajouter à PROFILE_KEYS (app-main.js) si persistant,');
  console.error('  ou à KNOWN_EPHEMERAL (scripts/check-profile-keys.js) si éphémère.');
  process.exit(1);
}
