const fs = require('fs');
let content = fs.readFileSync('/home/user/Smartfitcoach/app/recipes-db.js', 'utf8');

// Sections and their prefix/starting counter
const sectionConfig = [
  { varName: 'breakfast', prefix: 'L0', start: 1 },
  { varName: 'lunch',     prefix: 'L1', start: 1 },
  { varName: 'snack',     prefix: 'L2', start: 1 },
  { varName: 'dinner',    prefix: 'L3', start: 1 },
];

// For each section, find the content between "var X = [" and the matching closing "];"
// Then inject _id into each recipe object
let result = content;

sectionConfig.forEach(function(cfg) {
  // Find the section start
  const startMarker = 'var ' + cfg.varName + ' = [';
  const startIdx = result.indexOf(startMarker);
  if (startIdx === -1) {
    console.error('Section not found: ' + cfg.varName);
    return;
  }

  // Find matching closing ]; by tracking bracket depth
  const arrayStart = startIdx + startMarker.length;
  let depth = 1;
  let i = arrayStart;
  while (i < result.length && depth > 0) {
    if (result[i] === '[') depth++;
    else if (result[i] === ']') depth--;
    i++;
  }
  const arrayEnd = i; // position after closing ]

  const sectionContent = result.slice(arrayStart, arrayEnd - 1); // content inside [ ... ]

  // Now process each recipe object: find opening { of top-level objects
  // We need to inject _id after the first { of each top-level recipe
  let counter = cfg.start;
  let newSection = '';
  let pos = 0;
  let objDepth = 0;

  while (pos < sectionContent.length) {
    const ch = sectionContent[pos];

    if (ch === '{' && objDepth === 0) {
      // This is a top-level recipe opening brace
      // Find the position after the '{' and inject _id
      const padded = String(counter).padStart(2, '0');
      const id = cfg.prefix + padded;
      // Insert after '{'
      newSection += '{';
      newSection += '\n    _id: \'' + id + '\',';
      counter++;
      objDepth = 1;
      pos++;
    } else {
      if (ch === '{' || ch === '[') objDepth++;
      else if (ch === '}' || ch === ']') {
        if (ch === '}' && objDepth > 0) objDepth--;
        else if (ch === ']' && objDepth > 0) objDepth--;
      }
      newSection += ch;
      pos++;
    }
  }

  result = result.slice(0, arrayStart) + newSection + result.slice(arrayEnd - 1);
});

fs.writeFileSync('/home/user/Smartfitcoach/app/recipes-db.js', result);
console.log('Done! Added _id fields to all legacy recipes.');

// Verify counts
const bCount = (result.match(/_id: 'L0/g) || []).length;
const lCount = (result.match(/_id: 'L1/g) || []).length;
const sCount = (result.match(/_id: 'L2/g) || []).length;
const dCount = (result.match(/_id: 'L3/g) || []).length;
console.log('breakfast: ' + bCount + ', lunch: ' + lCount + ', snack: ' + sCount + ', dinner: ' + dCount);
console.log('Total: ' + (bCount + lCount + sCount + dCount));
