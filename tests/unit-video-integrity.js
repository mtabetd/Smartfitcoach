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

// ─── SUMMARY ─────────────────────────────────────────────────────────────────
console.log('\n──────────────────────────────────────────────────────────────');
console.log('Résultats : ' + pass + ' ✓  ' + fail + ' ✗  (total ' + (pass+fail) + ')');
if (fail > 0) process.exit(1);
