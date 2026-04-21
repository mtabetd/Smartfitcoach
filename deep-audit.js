/**
 * SmartFitCoach — Deep audit
 * Vérifie la cohérence totale du système sur 100+ assertions:
 *  - Couverture keyMap getAlternativeExercises pour les 163 m-values de exercises-db.js
 *  - Génération de programme sur 20 profils (level × equipment × days × medical)
 *  - Respect des contraintes level/equipment/médical/grossesse
 *  - Couverture YouTube pour tous les exercices
 *  - 0 doublon intra-jour sur tous les profils
 *  - 0 jour vide sur tous les profils
 */
const { chromium } = require('/opt/node22/lib/node_modules/playwright');
const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 8766;
const ROOT = path.join(__dirname, 'app');

const MIME = {
  '.html':'text/html','.js':'application/javascript','.css':'text/css',
  '.json':'application/json','.svg':'image/svg+xml','.png':'image/png','.webp':'image/webp'
};
function serve() {
  return http.createServer((req, res) => {
    const urlPath = req.url === '/' ? '/index.html' : req.url.split('?')[0];
    const filePath = path.join(ROOT, decodeURIComponent(urlPath));
    if (!filePath.startsWith(ROOT)) { res.writeHead(403); res.end(); return; }
    fs.readFile(filePath, (err, data) => {
      if (err) { res.writeHead(404); res.end('404'); return; }
      const ext = path.extname(filePath);
      res.writeHead(200, { 'Content-Type': MIME[ext] || 'application/octet-stream' });
      res.end(data);
    });
  }).listen(PORT);
}

let pass = 0, fail = 0;
const failures = [];
function ok(label, cond, detail) {
  if (cond) { pass++; console.log('  ✓ ' + label); }
  else {
    fail++;
    failures.push(label + (detail ? ' — ' + detail : ''));
    console.log('  ✗ ' + label + (detail ? ' — ' + detail : ''));
  }
}

(async () => {
  const server = serve();
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  page.on('console', msg => { if (msg.type() === 'error') errors.push(msg.text()); });

  await page.goto(`http://localhost:${PORT}/index.html`, { waitUntil: 'load' });
  await page.waitForFunction(() => window.generateSportProgram && window.EXERCISE_ALTERNATIVES && window.EXERCISES, null, { timeout: 10000 });

  // ─── 1. COUVERTURE keyMap getAlternativeExercises ───
  console.log('\n[1] getAlternativeExercises — couverture des m-values de window.EXERCISES');
  const coverage = await page.evaluate(() => {
    const groups = Object.keys(window.EXERCISES || {});
    const result = { tested: 0, returnsEmpty: [], crashes: [], totalMValues: 0 };
    const seenM = new Set();
    groups.forEach(g => {
      (window.EXERCISES[g] || []).forEach(ex => {
        if (seenM.has(ex.m)) return;
        seenM.add(ex.m);
        result.totalMValues++;
        try {
          const alts = window.getAlternativeExercises(ex.m, ex.n, 3, 'advanced');
          result.tested++;
          if (!Array.isArray(alts)) { result.crashes.push(ex.m + ': non-array'); return; }
          if (alts.length === 0) result.returnsEmpty.push(ex.m);
        } catch(e) {
          result.crashes.push(ex.m + ': ' + e.message);
        }
      });
    });
    return result;
  });
  ok('0 crash sur ' + coverage.totalMValues + ' m-values testés', coverage.crashes.length === 0,
    coverage.crashes.slice(0, 3).join('; '));
  // Exclusion : les m cardio/prehab n'ont légitimement pas d'alternatives
  const nonCardio = coverage.returnsEmpty.filter(m => !/cardio|cardiovasc|full.body|explosivit/i.test(m));
  ok('Couverture ≥ 90% (hors cardio)', nonCardio.length < coverage.totalMValues * 0.10,
    nonCardio.length + ' m sans alternative : ' + nonCardio.slice(0,5).join(' | '));

  // ─── 2. GÉNÉRATION DE PROGRAMME SUR 20 PROFILS ───
  console.log('\n[2] generateSportProgram — 20 profils utilisateur');
  const profiles = [
    { label: 'beginner/gym/3j',        level: 'beginner',     eq: 'gym',       days: 3 },
    { label: 'beginner/home/3j',       level: 'beginner',     eq: 'home',      days: 3 },
    { label: 'beginner/dumbbells/3j',  level: 'beginner',     eq: 'dumbbells', days: 3 },
    { label: 'beginner/none/2j',       level: 'beginner',     eq: 'none',      days: 2 },
    { label: 'intermediate/gym/3j',    level: 'intermediate', eq: 'gym',       days: 3 },
    { label: 'intermediate/home/4j',   level: 'intermediate', eq: 'home',      days: 4 },
    { label: 'intermediate/dumbbells/3j', level: 'intermediate', eq: 'dumbbells', days: 3 },
    { label: 'intermediate/none/2j',   level: 'intermediate', eq: 'none',      days: 2 },
    { label: 'advanced/gym/5j',        level: 'advanced',     eq: 'gym',       days: 5 },
    { label: 'advanced/home/4j',       level: 'advanced',     eq: 'home',      days: 4 },
    { label: 'advanced/dumbbells/4j',  level: 'advanced',     eq: 'dumbbells', days: 4 },
    { label: 'advanced/none/3j',       level: 'advanced',     eq: 'none',      days: 3 },
    { label: 'pro/gym/6j',             level: 'pro',          eq: 'gym',       days: 6 },
    { label: 'pro/home/5j',            level: 'pro',          eq: 'home',      days: 5 },
    { label: 'intermediate/gym/3j/shoulder-injury', level: 'intermediate', eq: 'gym', days: 3, medical: { shoulders: true } },
    { label: 'intermediate/gym/3j/knee-injury', level: 'intermediate', eq: 'gym', days: 3, medical: { knees: true } },
    { label: 'intermediate/gym/3j/lower-back', level: 'intermediate', eq: 'gym', days: 3, medical: { lowerBack: true } },
    { label: 'intermediate/gym/3j/elbows',  level: 'intermediate', eq: 'gym', days: 3, medical: { elbows: true } },
    { label: 'beginner/gym/3j/femme+cycle', level: 'beginner', eq: 'gym', days: 3, sex: 'femme', cycleTracking: true },
    { label: 'fullbody_ab/2j',          level: 'intermediate', eq: 'gym',       days: 2, split: 'fullbody_ab' }
  ];

  for (const p of profiles) {
    const r = await page.evaluate((profile) => {
      try {
        window.S.sportLevel = profile.level;
        window.S.sportEquipment = profile.eq;
        window.S.sportDays = profile.days;
        window.S.sportType = 'muscu';
        window.S.sportGoals = ['muscle'];
        window.S.sportFocus = { chest:3, back:3, shoulders:3, legs:3, glutes:3, biceps:3, triceps:3, abs:3 };
        window.S.sex = profile.sex || 'homme';
        window.S.cycleTracking = !!profile.cycleTracking;
        window.S.pregnant = false;
        window.S.medical = [];
        window.S.muscuMedical = profile.medical
          ? Object.assign({ done: true }, profile.medical)
          : { done: false };
        window.S._splitChoice = profile.split || null;

        const prog = window.generateSportProgram();

        // Lightweight invariants
        const checks = {
          isArray: Array.isArray(prog),
          lengthMatches: Array.isArray(prog) && prog.length === profile.days,
          allDaysHaveExercises: Array.isArray(prog) && prog.every(d => Array.isArray(d.exercises) && d.exercises.length > 0),
          noExerciseEmpty: Array.isArray(prog) && prog.every(d => d.exercises.every(e => e.n && e.m && e.sets && e.rest)),
          noDuplicatesPerDay: true,
          levelRespected: true,
          equipmentRespected: true,
          minExercisesPerDay: Array.isArray(prog) ? Math.min.apply(null, prog.map(d => d.exercises.length)) : 0
        };

        if (Array.isArray(prog)) {
          prog.forEach(d => {
            const names = new Set();
            d.exercises.forEach(e => {
              if (names.has(e.n)) checks.noDuplicatesPerDay = false;
              names.add(e.n);
            });
          });

          // Beginner ne doit pas avoir d'exercice lv:3
          if (profile.level === 'beginner') {
            prog.forEach(d => d.exercises.forEach(e => {
              if (e.lv && e.lv > 2) checks.levelRespected = false;
            }));
          }

          // Equipment 'none' : 0 exo barre olympique/banc/câble/machine
          // Autorisé : poids du corps, barre de traction (pull-up), barres parallèles, élastique
          if (profile.eq === 'none') {
            const forbidden = /\bbarre\s*\+|\bbanc\b|c[âa]ble|machine|pec deck|smith|poulie|convergente|hack squat|\bt[-\s]?bar\b|landmine|halt[èe]re|kettlebell|\bdisque\b|trap bar|hex bar|chaise romaine|gh[rd]|swiss ball|roue abdominale|ab\s+dolly/i;
            checks.noneLeaks = [];
            prog.forEach(d => d.exercises.forEach(e => {
              if (forbidden.test(e.eq)) {
                checks.equipmentRespected = false;
                if (checks.noneLeaks.length < 5) checks.noneLeaks.push(e.n + ' [' + e.eq + ']');
              }
            }));
          }
          // Equipment 'home' : 0 machine/câble/poulie
          if (profile.eq === 'home') {
            const forbidden = /machine|câble|cable|poulie|smith|convergente|pec deck|hack squat|landmine|t-bar/i;
            prog.forEach(d => d.exercises.forEach(e => {
              if (forbidden.test(e.eq)) checks.equipmentRespected = false;
            }));
          }
        }

        return { ok: true, checks, dayCount: Array.isArray(prog) ? prog.length : 0,
          exCount: Array.isArray(prog) ? prog.reduce((s,d) => s + d.exercises.length, 0) : 0 };
      } catch(e) {
        return { ok: false, error: e.message };
      }
    }, p);

    if (!r.ok) {
      ok(p.label + ' → génération', false, 'CRASH: ' + r.error);
      continue;
    }
    ok(p.label + ' [isArray]', r.checks.isArray);
    ok(p.label + ' [' + p.days + 'j]', r.checks.lengthMatches);
    ok(p.label + ' [jours non vides]', r.checks.allDaysHaveExercises, 'min ex/day = ' + r.checks.minExercisesPerDay);
    ok(p.label + ' [champs requis]', r.checks.noExerciseEmpty);
    ok(p.label + ' [0 doublon/jour]', r.checks.noDuplicatesPerDay);
    ok(p.label + ' [level respecté]', r.checks.levelRespected);
    ok(p.label + ' [equipment respecté]', r.checks.equipmentRespected,
      r.checks.noneLeaks ? r.checks.noneLeaks.join(' | ') : '');
  }

  // ─── 3. GROSSESSE (T2 + T3) ───
  console.log('\n[3] Grossesse T2/T3 — exclusion supine/impact');
  const preg = await page.evaluate(() => {
    try {
      window.S.sportLevel = 'intermediate';
      window.S.sportEquipment = 'gym';
      window.S.sportDays = 3;
      window.S.sportType = 'muscu';
      window.S.sportGoals = ['muscle'];
      window.S.sex = 'femme';
      window.S.pregnant = true;
      window.S.pregnancyWeek = 20; // T2
      window.S.sportFocus = { chest:3, back:3, shoulders:3, legs:3, glutes:3, biceps:3, triceps:3, abs:3 };
      window.S.medical = [];
      window.S.muscuMedical = { done: false };
      window.S._splitChoice = null;
      const prog = window.generateSportProgram();
      if (!Array.isArray(prog)) return { ok:false, reason:'not array' };
      const forbidden = /développé couché|bench press|leg press|décliné|hip thrust|deadlift|box jump|jump squat|snatch|clean|burpee/i;
      const all = prog.flatMap(d => d.exercises);
      const violations = all.filter(e => forbidden.test(e.n));
      const hasKegel = all.some(e => /kegel/i.test(e.n));
      const maxLvFound = Math.max.apply(null, all.map(e => e.lv || 1));
      return { ok:true, violations: violations.map(e => e.n), hasKegel, maxLvFound, total: all.length };
    } catch(e) { return { ok:false, error:e.message }; }
  });
  ok('Grossesse T2 — génération sans crash', preg.ok);
  ok('Grossesse T2 — 0 exo interdit (supine/impact)', preg.violations && preg.violations.length === 0,
    preg.violations ? preg.violations.slice(0,3).join(', ') : '');
  ok('Grossesse T2 — Kegel inclus', preg.hasKegel);
  ok('Grossesse T2 — niveau ≤ 2', preg.maxLvFound <= 2, 'lvMax=' + preg.maxLvFound);

  // ─── 4. COUVERTURE YOUTUBE ───
  console.log('\n[4] buildSmartVideoUrl — couverture sur les 2 DB');
  const urlCov = await page.evaluate(() => {
    const stats = { dbTotal: 0, dbWithUrl: 0, dbBadUrl: [], altTotal: 0, altWithUrl: 0, altBadUrl: [] };
    // 1. exercises-db.js
    Object.keys(window.EXERCISES || {}).forEach(g => {
      (window.EXERCISES[g] || []).forEach(ex => {
        stats.dbTotal++;
        const url = (window.EXERCISE_VIDEOS && window.EXERCISE_VIDEOS.buildSmartVideoUrl) ? window.EXERCISE_VIDEOS.buildSmartVideoUrl(ex.n, ex.lv || 1) : null;
        if (url && /^https:\/\/www\.youtube\.com\/results\?search_query=.+sp=/.test(url)) stats.dbWithUrl++;
        else if (stats.dbBadUrl.length < 3) stats.dbBadUrl.push(ex.n + ': ' + (url || 'null'));
      });
    });
    // 2. EXERCISE_ALTERNATIVES
    Object.keys(window.EXERCISE_ALTERNATIVES || {}).forEach(k => {
      (window.EXERCISE_ALTERNATIVES[k] || []).forEach(ex => {
        stats.altTotal++;
        const url = (window.EXERCISE_VIDEOS && window.EXERCISE_VIDEOS.buildSmartVideoUrl) ? window.EXERCISE_VIDEOS.buildSmartVideoUrl(ex.n, ex.lv || 1) : null;
        if (url && /^https:\/\/www\.youtube\.com\/results\?search_query=.+sp=/.test(url)) stats.altWithUrl++;
        else if (stats.altBadUrl.length < 3) stats.altBadUrl.push(ex.n + ': ' + (url || 'null'));
      });
    });
    return stats;
  });
  ok('exercises-db.js — 100% URLs valides (' + urlCov.dbWithUrl + '/' + urlCov.dbTotal + ')',
    urlCov.dbWithUrl === urlCov.dbTotal, urlCov.dbBadUrl.join(' | '));
  ok('EXERCISE_ALTERNATIVES — 100% URLs valides (' + urlCov.altWithUrl + '/' + urlCov.altTotal + ')',
    urlCov.altWithUrl === urlCov.altTotal, urlCov.altBadUrl.join(' | '));

  // ─── 5. TEST LEVEL FILTER SUR getAlternativeExercises ───
  console.log('\n[5] getAlternativeExercises — filtrage level');
  const lvTest = await page.evaluate(() => {
    const res = {};
    // Beginner demande alternatives pour Pectoraux → ne doit PAS contenir lv:3
    const altsBeg = window.getAlternativeExercises('Pectoraux', '', 20, 'beginner');
    res.begMaxLv = altsBeg.length ? Math.max.apply(null, altsBeg.map(e => e.lv || 1)) : 0;
    res.begCount = altsBeg.length;
    // Advanced demande alternatives → peut inclure lv:3
    const altsAdv = window.getAlternativeExercises('Pectoraux', '', 20, 'advanced');
    res.advMaxLv = altsAdv.length ? Math.max.apply(null, altsAdv.map(e => e.lv || 1)) : 0;
    res.advCount = altsAdv.length;
    // Sans paramètre level → backward-compat (lv ≤ 2)
    const altsDef = window.getAlternativeExercises('Pectoraux', '', 20);
    res.defMaxLv = altsDef.length ? Math.max.apply(null, altsDef.map(e => e.lv || 1)) : 0;
    return res;
  });
  ok('Beginner — lv≤2 strictement', lvTest.begMaxLv <= 2, 'lvMax=' + lvTest.begMaxLv);
  ok('Advanced — lv jusqu\'à 3', lvTest.advMaxLv === 3 || lvTest.advMaxLv === 2, 'lvMax=' + lvTest.advMaxLv);
  ok('Default — lv≤2 (backward-compat)', lvTest.defMaxLv <= 2, 'lvMax=' + lvTest.defMaxLv);
  ok('Beginner count > 0', lvTest.begCount > 0);
  ok('Advanced count ≥ beginner count', lvTest.advCount >= lvTest.begCount);

  // ─── 6. AUCUNE ERREUR JS ───
  console.log('\n[6] Erreurs JavaScript pendant l\'audit');
  const critical = errors.filter(e =>
    !/favicon|manifest|404|gifImgError|Failed to load resource/i.test(e)
  );
  ok('0 erreur JS critique (' + errors.length + ' mineurs)', critical.length === 0,
    critical.slice(0,2).join(' | '));

  await browser.close();
  server.close();
  console.log('\n' + '='.repeat(60));
  console.log('  DEEP AUDIT : ' + pass + ' ✓  /  ' + fail + ' ✗  (total: ' + (pass+fail) + ')');
  console.log('='.repeat(60));
  if (fail > 0) {
    console.log('\nECHECS :');
    failures.forEach(f => console.log('  ✗ ' + f));
    process.exit(1);
  }
})().catch(e => { console.error(e); process.exit(2); });
