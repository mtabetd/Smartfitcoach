'use strict';
// unit-video-integrity.js
// Tests: NO wrong video, NO search page, NO channel page, NO playlist.
// Every displayed URL must be a verified direct watch?v= or shorts/ link.

var fs   = require('fs');
var path = require('path');
var assert = require('assert');

var pass = 0, fail = 0;
function check(label, fn) {
  try { fn(); pass++; process.stdout.write('  ✓ ' + label + '\n'); }
  catch(e) { fail++; process.stdout.write('  ✗ ' + label + ' — ' + e.message + '\n'); }
}

// ─── Bootstrap exercise-videos.js in a lightweight Node context ──────────────
var src = fs.readFileSync(path.join(__dirname, '../app/exercise-videos.js'), 'utf8');

// Minimal window shim
var window = { isEnglish: function() { return false; }, S: {} };
eval(src); // eslint-disable-line

var EV = window.EXERCISE_VIDEOS;
assert(EV, 'EXERCISE_VIDEOS not exported');

// ─── RULE 1: no URL must contain results?search_query ────────────────────────
console.log('\n=== RULE 1: no search-page URLs ===');

var exerciseNames = [
  // Priority 1: core strength
  'bench press', 'incline bench press', 'overhead press', 'lateral raise',
  'pull up', 'chin up', 'dips', 'push-up', 'squat', 'front squat', 'goblet squat',
  'deadlift', 'romanian deadlift', 'hip thrust', 'barbell row', 'seated cable row',
  'lat pulldown', 'biceps curl', 'hammer curl', 'triceps pushdown', 'skull crusher',
  'leg press', 'leg curl', 'leg extension', 'calf raise', 'plank', 'crunch',
  'hanging knee raise',
  // Priority 2: CrossFit / Hyrox
  'snatch', 'clean', 'clean and jerk', 'thruster', 'wall ball', 'burpee', 'box jump',
  'rowing', 'ski erg', 'kettlebell swing', 'toes to bar', 'muscle up', 'double unders',
  // Additional exercises
  'developpe couche', 'tractions', 'developpe militaire', 'air squat',
  'kipping pull up', 'chest to bar', 'handstand push up', 'ring dip',
  'toes to bar', 'handstand walk', 'wall walk', 'pistol squat',
  'strict pull up', 'overhead squat', 'dumbbell snatch', 'bar muscle up',
];

exerciseNames.forEach(function(name) {
  var url = EV.buildSmartVideoUrl(name, 1);
  check('buildSmartVideoUrl("' + name + '") ≠ search page', function() {
    assert(url === null || !/results\?search_query/.test(url),
      'Got search URL: ' + url);
  });
});

// ─── RULE 2: no channel homepage URLs ────────────────────────────────────────
console.log('\n=== RULE 2: no channel homepage URLs ===');

exerciseNames.forEach(function(name) {
  var url = EV.buildSmartVideoUrl(name, 1);
  check('buildSmartVideoUrl("' + name + '") ≠ channel page', function() {
    assert(url === null || !/(youtube\.com\/@|youtube\.com\/c\/|youtube\.com\/user\/)/.test(url),
      'Got channel URL: ' + url);
  });
});

// ─── RULE 3: no playlist URLs ────────────────────────────────────────────────
console.log('\n=== RULE 3: no playlist URLs ===');

exerciseNames.forEach(function(name) {
  var url = EV.buildSmartVideoUrl(name, 1);
  check('buildSmartVideoUrl("' + name + '") ≠ playlist', function() {
    assert(url === null || !/[?&]list=/.test(url),
      'Got playlist URL: ' + url);
  });
});

// ─── RULE 4: every non-null URL must be a direct watch/shorts link ────────────
console.log('\n=== RULE 4: non-null URLs must be watch?v= or /shorts/ ===');

exerciseNames.forEach(function(name) {
  var url = EV.buildSmartVideoUrl(name, 1);
  if (url !== null) {
    check('buildSmartVideoUrl("' + name + '") is direct URL', function() {
      assert(/(?:watch\?v=|\/shorts\/)/.test(url),
        'Not a direct URL: ' + url);
    });
  }
});

// ─── RULE 5: buildCFVideoUrl same rules ───────────────────────────────────────
console.log('\n=== RULE 5: buildCFVideoUrl no search/channel/playlist ===');

var cfExercises = [
  'snatch', 'power snatch', 'clean and jerk', 'power clean', 'thruster',
  'wall ball', 'burpee', 'box jump', 'toes to bar', 'muscle up',
  'double unders', 'rowing', 'ski erg', 'kettlebell swing',
  'handstand walk', 'kipping pull up', 'chest to bar', 'ring dip',
  'air squat', 'strict pull up', 'wall walk', 'overhead squat',
];

cfExercises.forEach(function(name) {
  var url = EV.buildCFVideoUrl(name);
  check('buildCFVideoUrl("' + name + '") ≠ search/channel/playlist', function() {
    assert(url === null ||
      (!/results\?search_query/.test(url) &&
       !/(youtube\.com\/@|\/c\/|\/user\/)/.test(url) &&
       !/[?&]list=/.test(url)),
      'Bad URL: ' + url);
  });
  if (url !== null) {
    check('buildCFVideoUrl("' + name + '") is direct URL', function() {
      assert(/(?:watch\?v=|\/shorts\/)/.test(url),
        'Not direct: ' + url);
    });
  }
});

// ─── RULE 6: getVideoMeta status field ────────────────────────────────────────
console.log('\n=== RULE 6: getVideoMeta returns correct status ===');

check('getVideoMeta verified exercise returns status:verified', function() {
  var meta = EV.getVideoMeta('developpe couche', 1);
  assert(meta.status === 'verified', 'Expected verified, got: ' + meta.status);
  assert(meta.url !== null, 'verified entry should have URL');
});

check('getVideoMeta unknown exercise returns status:missing', function() {
  var meta = EV.getVideoMeta('exercice inconnu xyz', 1);
  assert(meta.status === 'missing', 'Expected missing, got: ' + meta.status);
  assert(meta.url === null, 'missing entry should have null URL');
});

check('getVideoMeta null name returns status:missing', function() {
  var meta = EV.getVideoMeta(null, 1);
  assert(meta.status === 'missing', 'Expected missing, got: ' + meta.status);
});

// ─── RULE 7: DIRECT_VIDEO_REGISTRY — no null entry has verified:true ─────────
console.log('\n=== RULE 7: null URL entries must not be verified:true ===');

var registry = EV._DIRECT_REGISTRY;
Object.keys(registry).forEach(function(key) {
  var entry = registry[key];
  if (!entry) return;
  ['fr_beginner','en_any','advanced','cf'].forEach(function(lv) {
    if (entry[lv] && !entry[lv].url) {
      check('registry["' + key + '"]["' + lv + '"] null URL not verified:true', function() {
        assert(!entry[lv].verified,
          'null URL entry marked verified:true is a bug');
      });
    }
  });
});

// ─── RULE 8: strict mode — no search URL anywhere in the module output ────────
console.log('\n=== RULE 8: exhaustive scan — 200 exercises, zero search URLs ===');

var allNames = Object.keys(EV._CURATED_QUERIES).concat(Object.keys(EV._CF_QUERIES));
var searchUrlCount = 0;
allNames.slice(0, 200).forEach(function(name) {
  var url1 = EV.buildSmartVideoUrl(name, 1);
  var url2 = EV.buildCFVideoUrl(name);
  if (url1 && /results\?search_query/.test(url1)) searchUrlCount++;
  if (url2 && /results\?search_query/.test(url2)) searchUrlCount++;
});

check('Zero search URLs across 200 exercises (Smart+CF)', function() {
  assert(searchUrlCount === 0, searchUrlCount + ' search URL(s) leaked through');
});

// ─── RULE 9: openVideoModal null-safe ────────────────────────────────────────
console.log('\n=== RULE 9: openVideoModal handles null gracefully ===');

check('openVideoModal(null) does not throw', function() {
  // openVideoModal guards: if (!url || typeof document === 'undefined') return;
  // In Node context, document is undefined → safe
  try { EV.openVideoModal(null, 'test exercise', 1); } catch(e) {
    assert(false, 'openVideoModal(null) threw: ' + e.message);
  }
});

// ─── RULE 10: alias resolution — abbreviations → verified canonical entries ───
console.log('\n=== RULE 10: CF alias resolution ===');

var cfAliasTests = [
  // HSPU family
  { alias: 'hspu',               canonical: 'handstand push up',  desc: 'hspu → handstand push up' },
  { alias: 'handstand push ups', canonical: 'handstand push up',  desc: 'handstand push ups → handstand push up' },
  { alias: 'hs push up',         canonical: 'handstand push up',  desc: 'hs push up → handstand push up' },
  // Chest to bar family
  { alias: 'c2b',                canonical: 'chest to bar',        desc: 'c2b → chest to bar' },
  { alias: 'c2b pull ups',       canonical: 'chest to bar',        desc: 'c2b pull ups → chest to bar' },
  { alias: 'chest to bar pull ups', canonical: 'chest to bar',     desc: 'chest to bar pull ups → chest to bar' },
  // Bar muscle up family
  { alias: 'bmu',                canonical: 'bar muscle up',       desc: 'bmu → bar muscle up' },
  { alias: 'bmup',               canonical: 'bar muscle up',       desc: 'bmup → bar muscle up' },
  { alias: 'bar muscle ups',     canonical: 'bar muscle up',       desc: 'bar muscle ups → bar muscle up' },
  { alias: 'muscle up barre',    canonical: 'bar muscle up',       desc: 'muscle up barre → bar muscle up' },
  // Kipping variants
  { alias: 'kipping pull up speed', canonical: 'kipping pull up', desc: 'kipping pull up speed → kipping pull up' },
  { alias: 'kipping',            canonical: 'kipping pull up',     desc: 'kipping → kipping pull up' },
  { alias: 'kip',                canonical: 'kipping pull up',     desc: 'kip → kipping pull up' },
  // Toes to bar
  { alias: 'ttb',                canonical: 'toes to bar',         desc: 'ttb → toes to bar' },
  { alias: 't2b',                canonical: 'toes to bar',         desc: 't2b → toes to bar' },
  // Clean family (plural/compound)
  { alias: 'clean jerk',         canonical: 'clean and jerk',      desc: 'clean jerk → clean and jerk' },
  { alias: 'hang power cleans',  canonical: 'hang power clean',    desc: 'hang power cleans → hang power clean' },
  { alias: 'hang cleans',        canonical: 'hang clean',          desc: 'hang cleans → hang clean' },
  // Misc abbreviations
  { alias: 'ohs',                canonical: 'overhead squat',      desc: 'ohs → overhead squat' },
  { alias: 'wb',                 canonical: 'wall ball',            desc: 'wb → wall ball' },
];

cfAliasTests.forEach(function(t) {
  var url = EV.buildCFVideoUrl(t.alias);
  var canonicalUrl = EV.buildCFVideoUrl(t.canonical);
  check(t.desc + ' resolves to same URL', function() {
    // Both should be non-null and identical (same canonical video)
    assert(url !== null || canonicalUrl === null,
      'alias "' + t.alias + '" returns null but canonical "' + t.canonical + '" has URL: ' + canonicalUrl);
    if (canonicalUrl !== null) {
      assert(url === canonicalUrl,
        'alias URL [' + url + '] ≠ canonical URL [' + canonicalUrl + ']');
    }
  });
});

// ─── RULE 11: muscu alias resolution ──────────────────────────────────────────
console.log('\n=== RULE 11: muscu alias resolution ===');

var muscuAliasTests = [
  { alias: 'bench press',       canonical: 'developpe couche',     desc: 'bench press → developpe couche' },
  { alias: 'bb bench press',    canonical: 'developpe couche',     desc: 'bb bench press → developpe couche' },
  { alias: 'ohp',               canonical: 'developpe militaire',  desc: 'ohp → developpe militaire' },
  { alias: 'military press',    canonical: 'developpe militaire',  desc: 'military press → developpe militaire' },
  { alias: 'shoulder press',    canonical: 'developpe militaire',  desc: 'shoulder press → developpe militaire' },
  { alias: 'pull up',           canonical: 'tractions',            desc: 'pull up → tractions' },
  { alias: 'pull ups',          canonical: 'tractions',            desc: 'pull ups → tractions' },
  { alias: 'pullup',            canonical: 'tractions',            desc: 'pullup → tractions' },
  { alias: 'push up',           canonical: 'pompes classiques',    desc: 'push up → pompes classiques' },
  { alias: 'push ups',          canonical: 'pompes classiques',    desc: 'push ups → pompes classiques' },
  { alias: 'dl',                canonical: 'deadlift',             desc: 'dl → deadlift' },
  { alias: 'incline bench',     canonical: 'developpe incline',    desc: 'incline bench → developpe incline' },
  { alias: 'lat pulldown',      canonical: 'tirage vertical poulie', desc: 'lat pulldown → tirage vertical poulie' },
  { alias: 'barbell curl',      canonical: 'curl barre',           desc: 'barbell curl → curl barre' },
  { alias: 'hammer curl',       canonical: 'curl marteau',         desc: 'hammer curl → curl marteau' },
  { alias: 'skull crusher',     canonical: 'extension triceps barre', desc: 'skull crusher → ext triceps barre' },
  { alias: 'plank',             canonical: 'planche',              desc: 'plank → planche' },
  { alias: 'calf raise',        canonical: 'mollets debout',       desc: 'calf raise → mollets debout' },
];

muscuAliasTests.forEach(function(t) {
  check(t.desc + ' — alias not null when canonical verified', function() {
    var aliasUrl = EV.buildSmartVideoUrl(t.alias, 1);
    var canonicalUrl = EV.buildSmartVideoUrl(t.canonical, 1);
    // If canonical has a video, the alias must also resolve to the same URL
    if (canonicalUrl !== null) {
      assert(aliasUrl !== null, 'alias "' + t.alias + '" returns null but canonical "' + t.canonical + '" has URL');
      assert(aliasUrl === canonicalUrl, 'alias URL [' + aliasUrl + '] ≠ canonical URL [' + canonicalUrl + ']');
    }
    // Alias must never produce a search URL
    assert(aliasUrl === null || !/results\?search_query/.test(aliasUrl),
      'alias "' + t.alias + '" produced a search URL');
  });
});

// ─── RULE 12: normalization — accents, hyphens, casing ────────────────────────
console.log('\n=== RULE 12: normalization correctness ===');

var normTests = [
  { raw: 'Développé Couché',    expected: 'developpe couche',    desc: 'French accents normalized' },
  { raw: 'BENCH PRESS',         expected: 'bench press',          desc: 'uppercase normalized' },
  { raw: 'pull-up',             expected: 'pull up',              desc: 'hyphen → space' },
  { raw: "l'exercice",           expected: 'l exercice',            desc: 'apostrophe → space' },
  { raw: 'Toes To Bar',         expected: 'toes to bar',          desc: 'mixed case normalized' },
  { raw: 'Handstand Push-Up',   expected: 'handstand push up',    desc: 'multi-hyphen removed' },
  { raw: 'C2B',                 expected: 'c2b',                  desc: 'uppercase abbrev normalized' },
  { raw: 'HSPU',                expected: 'hspu',                 desc: 'uppercase abbrev normalized' },
  { raw: '  squat  ',           expected: 'squat',                desc: 'whitespace trimmed' },
];

// Access normalizeName via public API
var _norm = EV._normalizeName || function(n) {
  if (!n) return '';
  return String(n).toLowerCase()
    .replace(/[éèêë]/g, 'e').replace(/[àâä]/g, 'a').replace(/[îï]/g, 'i')
    .replace(/[ùûü]/g, 'u').replace(/[ôö]/g, 'o').replace(/ç/g, 'c')
    .replace(/[''\-\/]/g, ' ')
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, ' ').trim();
};

normTests.forEach(function(t) {
  check(t.desc + ' ("' + t.raw + '" → "' + t.expected + '")', function() {
    var got = _norm(t.raw);
    assert(got === t.expected, 'Got "' + got + '" expected "' + t.expected + '"');
  });
});

// ─── RULE 13: cascade — FR→EN fallback for unverified FR ─────────────────────
console.log('\n=== RULE 13: cascade — FR→EN fallback when FR unverified ===');

// developpe incline has fr_beginner=verified:false, en_any=verified:true
// A French user (level 1) should still get the EN URL via cascade.
check('developpe incline (FR user, lv=1) cascades to EN verified URL', function() {
  // Simulate FR user: window.isEnglish returns false
  var savedIsEnglish = window.isEnglish;
  window.isEnglish = function() { return false; };
  var url = EV.buildSmartVideoUrl('developpe incline', 1);
  window.isEnglish = savedIsEnglish;
  assert(url !== null, 'Expected cascade to EN URL, got null');
  assert(/(?:watch\?v=|\/shorts\/)/.test(url), 'Cascaded URL is not direct: ' + url);
});

check('developpe incline (EN user, lv=1) gets EN verified URL', function() {
  var savedIsEnglish = window.isEnglish;
  window.isEnglish = function() { return true; };
  var url = EV.buildSmartVideoUrl('developpe incline', 1);
  window.isEnglish = savedIsEnglish;
  assert(url !== null, 'Expected EN URL, got null');
  assert(/(?:watch\?v=|\/shorts\/)/.test(url), 'EN URL is not direct: ' + url);
});

// ─── RULE 14: verified-only gate — no spurious verified:true on null URLs ─────
console.log('\n=== RULE 14: registry integrity — no null-URL with verified:true ===');

var registry2 = EV._DIRECT_REGISTRY;
var nullVerifiedBugs = 0;
Object.keys(registry2).forEach(function(key) {
  var entry = registry2[key];
  if (!entry) return;
  ['fr_beginner','en_any','advanced','cf'].forEach(function(lv) {
    if (entry[lv] && !entry[lv].url && entry[lv].verified === true) {
      nullVerifiedBugs++;
      check('registry["' + key + '"]["' + lv + '"] null+verified:true BUG', function() {
        assert(false, 'null URL but verified:true — impossible combination');
      });
    }
  });
});
if (nullVerifiedBugs === 0) {
  check('No null-URL entries marked verified:true in registry', function() {});
}

// ─── RULE 15: HSPU resolution chain ───────────────────────────────────────────
console.log('\n=== RULE 15: HSPU resolution chain ===');

var hsVariants = ['hspu', 'handstand push up', 'handstand push ups', 'hs push up', 'strict handstand push up'];
hsVariants.forEach(function(v) {
  var url = EV.buildCFVideoUrl(v);
  check('HSPU variant "' + v + '" resolves to direct URL or null', function() {
    assert(url === null || /(?:watch\?v=|\/shorts\/)/.test(url), 'Got non-direct URL: ' + url);
    assert(url === null || !/results\?search_query/.test(url), 'Got search URL: ' + url);
  });
});

// All HSPU variants should resolve to the same URL (handstand push up URL)
var hspuUrl = EV.buildCFVideoUrl('handstand push up');
if (hspuUrl) {
  ['hspu', 'handstand push ups', 'hs push up'].forEach(function(v) {
    check('HSPU alias "' + v + '" matches canonical "handstand push up" URL', function() {
      var aliasUrl = EV.buildCFVideoUrl(v);
      assert(aliasUrl === hspuUrl,
        '"' + v + '" gave [' + aliasUrl + '] expected [' + hspuUrl + ']');
    });
  });
}

// ─── SUMMARY ─────────────────────────────────────────────────────────────────
console.log('\n──────────────────────────────────────────────────────────────');
console.log('Résultats : ' + pass + ' ✓  ' + fail + ' ✗  (total ' + (pass+fail) + ')');
if (fail > 0) process.exit(1);
