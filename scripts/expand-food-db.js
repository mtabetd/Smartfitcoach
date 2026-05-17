#!/usr/bin/env node
/**
 * expand-food-db.js — OFF API bulk fetcher
 * Génère app/food-db-off.json avec ~50 000 aliments (FR + MA + international)
 *
 * Usage (sur ta machine locale avec internet) :
 *   node scripts/expand-food-db.js
 *
 * Durée : ~15-25 minutes (respecte le rate-limit OFF API)
 * Output : app/food-db-off.json (~3-4 MB)
 */

'use strict';

const https  = require('https');
const fs     = require('fs');
const path   = require('path');

const OUT_PATH = path.join(__dirname, '../app/food-db-off.json');

// ── Catégories à cibler (OFF API tag_0) ──────────────────────────────────────
const QUERIES = [
  // France
  { country: 'france',    label: 'FR' },
  // Maroc
  { country: 'maroc',     label: 'MA' },
  // Monde entier (produits avec données nutrition complètes)
  { country: null,        label: 'WORLD', category: 'meals' },
  { country: null,        label: 'WORLD', category: 'dairies' },
  { country: null,        label: 'WORLD', category: 'cereals' },
  { country: null,        label: 'WORLD', category: 'meats' },
  { country: null,        label: 'WORLD', category: 'fish' },
  { country: null,        label: 'WORLD', category: 'fruits-and-vegetables' },
  { country: null,        label: 'WORLD', category: 'legumes' },
  { country: null,        label: 'WORLD', category: 'snacks' },
  { country: null,        label: 'WORLD', category: 'beverages' },
  { country: null,        label: 'WORLD', category: 'sauces' },
  { country: null,        label: 'WORLD', category: 'fats' },
  { country: null,        label: 'WORLD', category: 'biscuits-and-cakes' },
  { country: null,        label: 'WORLD', category: 'bread' },
  { country: null,        label: 'WORLD', category: 'pasta' },
  { country: null,        label: 'WORLD', category: 'frozen-foods' },
];

const PAGES_PER_QUERY = 30;  // 30 pages × 100 = 3 000 par requête → ~50 000 total
const PAGE_SIZE       = 100;
const DELAY_MS        = 400; // pause entre pages pour ne pas surcharger OFF

// ── HTTP GET promisifié ───────────────────────────────────────────────────────
function httpGet(url) {
  return new Promise(function(resolve, reject) {
    var opts = {
      headers: {
        'User-Agent': 'SmartFitCoach-FoodDB/2.0 (contact@smartfitcoach.com)',
        'Accept': 'application/json'
      }
    };
    var req = https.get(url, opts, function(res) {
      // Follow redirects
      if (res.statusCode === 301 || res.statusCode === 302) {
        return resolve(httpGet(res.headers.location));
      }
      if (res.statusCode !== 200) {
        return reject(new Error('HTTP ' + res.statusCode + ' for ' + url));
      }
      var chunks = [];
      res.on('data', function(c) { chunks.push(c); });
      res.on('end', function() {
        try { resolve(JSON.parse(Buffer.concat(chunks).toString('utf8'))); }
        catch(e) { reject(new Error('JSON parse error on ' + url)); }
      });
    });
    req.on('error', reject);
    req.setTimeout(20000, function() { req.destroy(new Error('timeout: ' + url)); });
  });
}

// ── Normalisation nom ─────────────────────────────────────────────────────────
function normName(s) {
  return String(s || '').toLowerCase()
    .replace(/[éèêë]/g,'e').replace(/[àâä]/g,'a').replace(/[ùûü]/g,'u')
    .replace(/[îï]/g,'i').replace(/[ôö]/g,'o').replace(/ç/g,'c')
    .replace(/\s+/g,' ').trim();
}

// ── Validation & normalisation d'un produit OFF ───────────────────────────────
function parseProduct(p) {
  // Nom : préférer FR, puis générique
  var name = (
    p.product_name_fr ||
    p.product_name    ||
    p.abbreviated_product_name_fr ||
    ''
  ).trim();

  // Filtres de base
  if (!name || name.length < 3 || name.length > 70) return null;
  if (/\d{5,}/.test(name)) return null;        // codes-barres dans le nom
  if (/[<>[\]{}%]/.test(name)) return null;    // caractères parasites

  var n = p.nutriments || {};

  var kcal    = parseFloat(n['energy-kcal_100g'] || n['energy-kcal']         || 0);
  var protein = parseFloat(n['proteins_100g']    || n['proteins']            || 0);
  var carbs   = parseFloat(n['carbohydrates_100g'] || n['carbohydrates']     || 0);
  var fat     = parseFloat(n['fat_100g']          || n['fat']                || 0);

  // Sanity checks nutritionnels
  if (kcal    <= 0   || kcal > 900)    return null;
  if (protein < 0    || protein > 100) return null;
  if (carbs   < 0    || carbs   > 100) return null;
  if (fat     < 0    || fat     > 100) return null;
  // Cohérence : P+C+F ne doit pas dépasser 105g (tolérance analytics)
  if (protein + carbs + fat > 105)     return null;

  return [
    name,
    Math.round(kcal),
    Math.round(protein * 10) / 10,
    Math.round(carbs   * 10) / 10,
    Math.round(fat     * 10) / 10
  ];
}

// ── Construit l'URL de recherche OFF ─────────────────────────────────────────
function buildUrl(query, page) {
  var base = 'https://world.openfoodfacts.org/cgi/search.pl?action=process' +
    '&nutriment_0=energy-kcal&nutriment_compare_0=gt&nutriment_value_0=0' +
    '&nutriment_1=proteins&nutriment_compare_1=gt&nutriment_value_1=0' +
    '&fields=product_name,product_name_fr,nutriments' +
    '&sort_by=unique_scans_n' +        // les plus scannés en premier = meilleure qualité
    '&page_size=' + PAGE_SIZE +
    '&page=' + page +
    '&json=1';

  if (query.country) {
    base += '&tagtype_0=countries&tag_contains_0=contains&tag_0=' + encodeURIComponent(query.country);
    if (query.category) {
      base += '&tagtype_1=categories&tag_contains_1=contains&tag_1=' + encodeURIComponent(query.category);
    }
  } else if (query.category) {
    base += '&tagtype_0=categories&tag_contains_0=contains&tag_0=' + encodeURIComponent(query.category);
  }

  return base;
}

function sleep(ms) { return new Promise(function(r){ setTimeout(r, ms); }); }

// ── Main ──────────────────────────────────────────────────────────────────────
async function main() {
  var allItems = [];
  var seenNames = new Set();
  var totalFetched = 0;
  var totalSkipped = 0;

  console.log('[OFF] Démarrage — cible ~50 000 aliments');
  console.log('[OFF] Output:', OUT_PATH);
  console.log('');

  for (var qi = 0; qi < QUERIES.length; qi++) {
    var query = QUERIES[qi];
    var label = query.label + (query.category ? '/' + query.category : '');
    var pageItems = 0;

    for (var page = 1; page <= PAGES_PER_QUERY; page++) {
      var url = buildUrl(query, page);
      var data;

      try {
        data = await httpGet(url);
      } catch(e) {
        console.warn('[OFF] ' + label + ' p' + page + ' ERREUR:', e.message);
        await sleep(2000);
        continue;
      }

      var products = data.products || [];
      if (!products.length) break;   // plus de résultats

      products.forEach(function(p) {
        var item = parseProduct(p);
        if (!item) { totalSkipped++; return; }
        var key = normName(item[0]);
        if (seenNames.has(key)) { totalSkipped++; return; }
        seenNames.add(key);
        allItems.push(item);
        pageItems++;
        totalFetched++;
      });

      // Progression
      process.stdout.write(
        '\r[OFF] ' + label.padEnd(20) +
        ' p' + String(page).padStart(2) +
        ' | total: ' + String(allItems.length).padStart(6) +
        ' | skip: ' + totalSkipped + '    '
      );

      await sleep(DELAY_MS);
    }

    console.log('\n[OFF] ' + label + ' terminé — ' + pageItems + ' ajoutés');
  }

  console.log('\n[OFF] ── Résultat final ──────────────────────────');
  console.log('[OFF] Total aliments uniques : ' + allItems.length);
  console.log('[OFF] Total ignorés          : ' + totalSkipped);

  // Écriture JSON
  var output = {
    generated:  new Date().toISOString(),
    source:     'OpenFoodFacts API — world.openfoodfacts.org',
    count:      allItems.length,
    // Format : [nom, kcal, proteines_g, glucides_g, lipides_g]
    items:      allItems
  };

  fs.writeFileSync(OUT_PATH, JSON.stringify(output), 'utf8');
  var sizeKB = Math.round(fs.statSync(OUT_PATH).size / 1024);
  console.log('[OFF] Fichier écrit :', OUT_PATH, '(' + sizeKB + ' KB)');
  console.log('[OFF] Recompile le bundle : node scripts/build-bundle.js');
}

main().catch(function(e) {
  console.error('\n[OFF] FATAL:', e.message);
  process.exit(1);
});
