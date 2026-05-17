#!/usr/bin/env node
/**
 * expand-food-db.js
 * Fetches FR/MA foods from OpenFoodFacts API and prints new entries for food-db.js.
 *
 * Usage:
 *   node scripts/expand-food-db.js [--country fr|ma] [--limit 500] [--out food-additions.txt]
 *
 * The script:
 *   1. Fetches products from OFF API for the target country (France or Morocco)
 *   2. Normalises to [name, kcal, protein_g, carbs_g, fat_g] 5-field format
 *   3. Deduplicates against existing names in food-db.js (fuzzy match)
 *   4. Outputs formatted lines ready to paste into food-db.js
 *
 * Dependencies: none (uses built-in https)
 * Node >= 14 required.
 */

'use strict';

const https = require('https');
const fs    = require('fs');
const path  = require('path');

// ── CLI args ──────────────────────────────────────────────────────────────────
const args = process.argv.slice(2);
function getArg(flag, def) {
  var i = args.indexOf(flag);
  return i !== -1 && args[i + 1] ? args[i + 1] : def;
}
const COUNTRY   = getArg('--country', 'fr');   // 'fr' or 'ma'
const PAGE_SIZE = Math.min(parseInt(getArg('--limit', '500'), 10), 1000);
const OUT_FILE  = getArg('--out', '');

// ── Load existing names for dedup ─────────────────────────────────────────────
const FOOD_DB_PATH = path.join(__dirname, '../app/food-db.js');
let existingNames = new Set();
try {
  var raw = fs.readFileSync(FOOD_DB_PATH, 'utf8');
  // Extract quoted names from array entries: ['name', ...]
  var matches = raw.match(/\[['"]([^'"]+)['"]\s*,\s*\d/g) || [];
  matches.forEach(function(m) {
    var name = m.match(/\[['"]([^'"]+)['"]/);
    if (name) existingNames.add(normalize(name[1]));
  });
  console.error('[expand-food-db] Loaded ' + existingNames.size + ' existing names for dedup');
} catch(e) {
  console.error('[expand-food-db] Warning: could not read food-db.js for dedup:', e.message);
}

function normalize(s) {
  return String(s || '').toLowerCase()
    .replace(/\s+/g, ' ')
    .replace(/[éèêë]/g, 'e').replace(/[àâä]/g, 'a')
    .replace(/[ùûü]/g, 'u').replace(/[îï]/g, 'i')
    .replace(/[ôö]/g, 'o').replace(/ç/g, 'c')
    .trim();
}

// ── HTTP helper ───────────────────────────────────────────────────────────────
function httpGet(url) {
  return new Promise(function(resolve, reject) {
    var req = https.get(url, { headers: { 'User-Agent': 'SmartFitCoach-FoodDB-Expander/1.0' } }, function(res) {
      var chunks = [];
      res.on('data', function(c) { chunks.push(c); });
      res.on('end', function() {
        try { resolve(JSON.parse(Buffer.concat(chunks).toString('utf8'))); }
        catch(e) { reject(new Error('JSON parse error: ' + e.message)); }
      });
    });
    req.on('error', reject);
    req.setTimeout(15000, function() { req.destroy(new Error('timeout')); });
  });
}

// ── OFF API query ─────────────────────────────────────────────────────────────
async function fetchPage(country, page) {
  // OFF v2 search API: filter by country + has nutrition data
  var url = 'https://world.openfoodfacts.org/cgi/search.pl' +
    '?action=process' +
    '&tagtype_0=countries&tag_contains_0=contains&tag_0=' + encodeURIComponent(country === 'ma' ? 'maroc' : 'france') +
    '&nutriment_0=energy-kcal&nutriment_compare_0=gt&nutriment_value_0=0' +
    '&fields=product_name,product_name_fr,nutriments,quantity' +
    '&page=' + page +
    '&page_size=100' +
    '&json=1';
  return httpGet(url);
}

// ── Normalise a single OFF product ────────────────────────────────────────────
function normalise(product) {
  var name = (product.product_name_fr || product.product_name || '').trim();
  // Skip unnamed / too short / too long
  if (!name || name.length < 3 || name.length > 60) return null;
  // Skip names containing % or [ (often lab codes)
  if (/[%\[\]<>]/.test(name)) return null;

  var n = product.nutriments || {};
  var kcal    = parseFloat(n['energy-kcal_100g'] || n['energy-kcal'] || 0);
  var protein = parseFloat(n['proteins_100g']   || n['proteins']    || 0);
  var carbs   = parseFloat(n['carbohydrates_100g'] || n['carbohydrates'] || 0);
  var fat     = parseFloat(n['fat_100g']         || n['fat']          || 0);

  // Sanity checks
  if (kcal <= 0 || kcal > 900) return null;
  if (protein < 0 || carbs < 0 || fat < 0) return null;
  if (protein > 100 || carbs > 100 || fat > 100) return null;

  return {
    name:    name,
    kcal:    Math.round(kcal),
    protein: Math.round(protein * 10) / 10,
    carbs:   Math.round(carbs   * 10) / 10,
    fat:     Math.round(fat     * 10) / 10
  };
}

// ── Format for food-db.js ─────────────────────────────────────────────────────
function formatLine(item) {
  var n = JSON.stringify(item.name);
  // Pad name to 40 chars for alignment
  var padded = n + ',';
  while (padded.length < 42) padded += ' ';
  return '    [' + padded + ' ' +
    pad(item.kcal, 4) + ', ' +
    pad(item.protein, 5) + ', ' +
    pad(item.carbs,   5) + ', ' +
    pad(item.fat,     5) + '],';
}

function pad(n, w) {
  var s = String(n);
  while (s.length < w) s = ' ' + s;
  return s;
}

// ── Main ──────────────────────────────────────────────────────────────────────
async function main() {
  console.error('[expand-food-db] Fetching ' + PAGE_SIZE + ' products for country=' + COUNTRY);
  var results  = [];
  var seen     = new Set(existingNames);
  var pages    = Math.ceil(PAGE_SIZE / 100);

  for (var p = 1; p <= pages; p++) {
    var data;
    try {
      data = await fetchPage(COUNTRY, p);
    } catch(e) {
      console.error('[expand-food-db] Page ' + p + ' failed:', e.message);
      continue;
    }
    var products = data.products || [];
    if (!products.length) break;

    products.forEach(function(prod) {
      var item = normalise(prod);
      if (!item) return;
      var key = normalize(item.name);
      if (seen.has(key)) return;
      seen.add(key);
      results.push(item);
    });

    // Small delay to be polite to OFF API
    await new Promise(function(r) { setTimeout(r, 300); });
  }

  console.error('[expand-food-db] Found ' + results.length + ' new items');

  var country_label = COUNTRY === 'ma' ? 'MAROC (OFF API)' : 'FRANCE (OFF API)';
  var lines = [
    '',
    '    // ─── ' + country_label + ' — ' + new Date().toISOString().slice(0, 10) + ' ───'
  ];
  results.forEach(function(item) { lines.push(formatLine(item)); });

  var output = lines.join('\n');

  if (OUT_FILE) {
    fs.writeFileSync(OUT_FILE, output, 'utf8');
    console.error('[expand-food-db] Written to ' + OUT_FILE);
  } else {
    process.stdout.write(output + '\n');
  }
}

main().catch(function(e) {
  console.error('[expand-food-db] Fatal:', e.message);
  process.exit(1);
});
