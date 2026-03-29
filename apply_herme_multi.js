#!/usr/bin/env node
// Apply Pierre Hermé improvements for sm_multi + sm_nature smoothies
const fs = require('fs');
const vm = require('vm');

const NUTRITION_FILE = '/home/user/Smartfitcoach/app/app-nutrition.js';
const IMP_FILE = '/home/user/Smartfitcoach/tmp_herme_multi_nature.js';

if (!fs.existsSync(IMP_FILE)) {
  console.error('File not found:', IMP_FILE);
  process.exit(1);
}

const ctx = vm.createContext({});
vm.runInContext(fs.readFileSync(IMP_FILE, 'utf8'), ctx);

const ALL = ctx.IMPROVEMENTS_MULTI_NATURE || {};
console.log('Improvements loaded:', Object.keys(ALL).length);

function jsEscape(s) {
  return s.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
}

let content = fs.readFileSync(NUTRITION_FILE, 'utf8');
let updated = 0;

for (const [smId, imp] of Object.entries(ALL)) {
  const idStr = "id:'" + smId + "'";
  const idPos = content.indexOf(idStr);
  if (idPos === -1) {
    console.log('SKIP (not found):', smId);
    continue;
  }

  const regionStart = idPos;
  const regionEnd = Math.min(idPos + 3000, content.length);
  let region = content.slice(regionStart, regionEnd);

  const newStepsArr = imp.steps.map(s => "'" + jsEscape(s) + "'").join(',');
  const newStepsStr = 'steps:[' + newStepsArr + ']';
  const stepsRx = /steps:\[[^\]]*\]/;
  if (!stepsRx.test(region)) {
    console.log('WARNING steps not found:', smId);
  } else {
    region = region.replace(stepsRx, newStepsStr);
  }

  const newTipsStr = "tips:'" + jsEscape(imp.tips) + "'";
  const tipsRx = /tips:'(?:[^'\\]|\\.)*'/;
  if (!tipsRx.test(region)) {
    console.log('WARNING tips not found:', smId);
  } else {
    region = region.replace(tipsRx, newTipsStr);
  }

  content = content.slice(0, regionStart) + region + content.slice(regionEnd);
  updated++;
  console.log('Updated:', smId);
}

fs.writeFileSync(NUTRITION_FILE, content);
console.log('Done. Updated:', updated);
