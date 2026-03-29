#!/usr/bin/env node
// Apply Paul Bocuse improvements to recipe-engine.js
// Reads all tmp_bocuse_*.js files and updates steps arrays
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const RECIPE_FILE = '/home/user/Smartfitcoach/app/recipe-engine.js';
const TMP_DIR = '/home/user/Smartfitcoach';

// Find all bocuse improvement files
const bocuseFiles = fs.readdirSync(TMP_DIR)
  .filter(f => f.startsWith('tmp_bocuse_') && f.endsWith('.js'))
  .sort()
  .map(f => path.join(TMP_DIR, f));

console.log('Bocuse files found:', bocuseFiles.length);
bocuseFiles.forEach(f => console.log(' -', path.basename(f)));

// Load all improvements using vm sandbox
const ctx = vm.createContext({});
for (const file of bocuseFiles) {
  try {
    const code = fs.readFileSync(file, 'utf8');
    vm.runInContext(code, ctx);
    console.log('Loaded:', path.basename(file));
  } catch (e) {
    console.error('ERROR loading', path.basename(file), ':', e.message);
  }
}

// Merge all IMPROVEMENTS_* objects
const ALL = {};
for (const [k, v] of Object.entries(ctx)) {
  if (k.startsWith('IMPROVEMENTS_') && typeof v === 'object') {
    const count = Object.keys(v).length;
    Object.assign(ALL, v);
    console.log(k, '->', count, 'recipes');
  }
}
console.log('Total improvements to apply:', Object.keys(ALL).length);

function jsEscape(s) {
  return s.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
}

let content = fs.readFileSync(RECIPE_FILE, 'utf8');
let updated = 0;
let skipped = 0;

for (const [recipeId, imp] of Object.entries(ALL)) {
  if (!imp.steps || !Array.isArray(imp.steps) || imp.steps.length === 0) {
    console.log('SKIP (no steps):', recipeId);
    skipped++;
    continue;
  }

  // Find the recipe by ID — format: id: 'RXXX',
  const idStr = "id: '" + recipeId + "'";
  const idPos = content.indexOf(idStr);
  if (idPos === -1) {
    console.log('SKIP (not found):', recipeId);
    skipped++;
    continue;
  }

  // Work on a region around this recipe (up to 5000 chars)
  const regionStart = idPos;
  const regionEnd = Math.min(idPos + 5000, content.length);
  let region = content.slice(regionStart, regionEnd);

  // Match the multi-line steps block: steps: [\n...\n      ]
  // Non-greedy [\s\S]*? stops at the first ] on its own indented line
  const stepsRx = /steps: \[[\s\S]*?\n(\s+)\]/;
  const stepsMatch = region.match(stepsRx);
  if (!stepsMatch) {
    console.log('WARNING: steps block not found for', recipeId);
    skipped++;
    continue;
  }

  // Detect indentation from the closing bracket line
  const closingIndent = stepsMatch[1]; // whitespace before closing ]
  // Step items are indented 2 more spaces than closing bracket
  const stepIndent = closingIndent + '  ';

  // Build new steps block
  const stepsLines = imp.steps.map(s => stepIndent + "'" + jsEscape(s) + "'").join(',\n');
  const newStepsBlock = 'steps: [\n' + stepsLines + '\n' + closingIndent + ']';

  region = region.replace(stepsRx, newStepsBlock);
  content = content.slice(0, regionStart) + region + content.slice(regionEnd);
  updated++;
}

fs.writeFileSync(RECIPE_FILE, content);
console.log('\nDone. Updated:', updated, '| Skipped:', skipped);
