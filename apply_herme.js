#!/usr/bin/env node
const fs = require('fs');

// Load all improvement files
eval(fs.readFileSync('/home/user/Smartfitcoach/tmp_herme_choco.js', 'utf8'));
eval(fs.readFileSync('/home/user/Smartfitcoach/tmp_herme_van.js', 'utf8'));
eval(fs.readFileSync('/home/user/Smartfitcoach/tmp_herme_fruits1.js', 'utf8'));
eval(fs.readFileSync('/home/user/Smartfitcoach/tmp_herme_nuts.js', 'utf8'));
eval(fs.readFileSync('/home/user/Smartfitcoach/tmp_herme_new.js', 'utf8'));

const ALL = Object.assign({},
  IMPROVEMENTS_CHOCO,
  IMPROVEMENTS_VAN,
  IMPROVEMENTS_FRUITS1,
  IMPROVEMENTS_NUTS,
  IMPROVEMENTS_NEW
);

let content = fs.readFileSync('/home/user/Smartfitcoach/app/app-nutrition.js', 'utf8');

function jsEscape(s) {
  return s.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
}

let updated = 0, skipped = 0;

for (const [smId, imp] of Object.entries(ALL)) {
  const idStr = "id:'" + smId + "'";
  const idPos = content.indexOf(idStr);
  if (idPos === -1) {
    console.log('SKIP (not found): ' + smId);
    skipped++;
    continue;
  }

  const regionStart = idPos;
  const regionEnd = Math.min(idPos + 3000, content.length);
  let region = content.slice(regionStart, regionEnd);

  // Replace steps (all on one line, no newlines inside steps array)
  const newStepsArr = imp.steps.map(s => "'" + jsEscape(s) + "'").join(',');
  const newStepsStr = 'steps:[' + newStepsArr + ']';

  const stepsRx = /steps:\[[^\]]*\]/;
  if (!stepsRx.test(region)) {
    console.log('WARNING steps not found: ' + smId);
  } else {
    region = region.replace(stepsRx, newStepsStr);
  }

  // Replace tips (string with possible escaped quotes)
  const newTipsStr = "tips:'" + jsEscape(imp.tips) + "'";
  const tipsRx = /tips:'(?:[^'\\]|\\.)*'/;
  if (!tipsRx.test(region)) {
    console.log('WARNING tips not found: ' + smId);
  } else {
    region = region.replace(tipsRx, newTipsStr);
  }

  content = content.slice(0, regionStart) + region + content.slice(regionEnd);
  updated++;
}

fs.writeFileSync('/home/user/Smartfitcoach/app/app-nutrition.js', content);
console.log('Done. Updated: ' + updated + ', Skipped: ' + skipped);
