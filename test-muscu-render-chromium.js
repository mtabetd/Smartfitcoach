// Test visuel : rendu du programme muscu IA refondu (charte Hermès)
// Vérifie que parseToHTML produit un rendu sans erreur + conforme charte

const { chromium } = require('playwright');
const BASE_URL = 'http://127.0.0.1:45515';
const CHROMIUM_PATH = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';

(async () => {
  const browser = await chromium.launch({ headless: true, executablePath: CHROMIUM_PATH });
  let passed = 0, failed = 0;
  function pass(n) { console.log('✓ ' + n); passed++; }
  function fail(n, d) { console.log('✗ ' + n + '\n    ' + d); failed++; }

  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const page = await ctx.newPage();
  const errs = [];
  page.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
  page.on('pageerror', e => errs.push(e.message));
  await ctx.addInitScript(() => {
    localStorage.setItem('mtd_dev_wiped_v1', '1');
    sessionStorage.setItem('mtd_gate_access', '1gs8uk7');
  });
  await page.goto(BASE_URL, { waitUntil: 'domcontentloaded', timeout: 15000 });
  await page.waitForTimeout(3000);

  // T1 : parseToHTML produit un HTML sans crash
  try {
    const r = await page.evaluate(() => {
      if (!window.MUSCU_PROGRAM || typeof window.MUSCU_PROGRAM.parseToHTML !== 'function') {
        return { error: 'MUSCU_PROGRAM.parseToHTML pas exposé' };
      }
      // Format réel retourné par l'IA (vu dans netlify/functions/generate-muscu-program.js)
      const sampleProgram = `Semaine 1 (du 14/04 au 20/04) — Accumulation

Lundi — Pectoraux & Triceps
1. Développé couché — 4 × 8-10
2. Dips — 3 × 10
3. Écarté haltères — 3 × 12

Mercredi — Dos & Biceps
1. Tractions — 4 × 8
2. Rowing barre — 4 × 10
3. Curl biceps — 3 × 12

Semaine 2 (du 21/04 au 27/04) — Intensification

Lundi — Pectoraux & Triceps
1. Développé couché — 5 × 5
2. Dips lestés — 4 × 8`;
      try {
        const html = window.MUSCU_PROGRAM.parseToHTML(sampleProgram);
        return {
          ok: true,
          length: html ? html.length : 0,
          hasWeek: html && html.indexOf('program-week') !== -1,
          hasHeader: html && html.indexOf('week-header') !== -1,
          hasDay: html && html.indexOf('day-title') !== -1,
          hasExerciseRow: html && html.indexOf('exercise-row') !== -1,
          hasGeorgia: html && html.indexOf('Georgia') !== -1,
          hasBlackTrait: html && html.indexOf('border-top:1px solid var(--black') !== -1,
          hasNum01: html && html.indexOf('>01</') !== -1,
          hasNum02: html && html.indexOf('>02</') !== -1,
          noGreenFluo: html && html.indexOf('rgba(26,74,26,0.06)') === -1,
          noAccentColor: html && html.indexOf('accent-color:var(--green)') === -1,
          html: html ? html.substring(0, 200) : ''
        };
      } catch(e) { return { error: e.message }; }
    });

    if (r.error) fail('T1 parseToHTML', r.error);
    else if (!r.ok) fail('T1 parseToHTML', 'no output');
    else if (!r.hasWeek || !r.hasHeader || !r.hasDay || !r.hasExerciseRow)
      fail('T1 structure', 'Classes CSS obligatoires manquantes (compat JS)');
    else if (!r.hasGeorgia) fail('T1 charte typo', 'Georgia absent du HTML');
    else if (!r.hasBlackTrait) fail('T1 charte trait', 'border-top noir absent (signature Bocuse)');
    else if (!r.hasNum01 || !r.hasNum02) fail('T1 numérotation', 'Numéraux "01"/"02" absents');
    else if (!r.noGreenFluo) fail('T1 charte vert', 'Ancien vert fluo toujours présent (hors charte)');
    else pass('T1 : Refonte charte Hermès OK — Georgia, trait noir, numéraux, sans vert fluo (' + r.length + ' chars)');
  } catch(e) { fail('T1', e.message); }

  // T2 : Pas d'erreur JS console
  if (errs.length > 0) fail('T2 console', errs.slice(0,3).join(' | '));
  else pass('T2 : Aucune erreur console au chargement de la page');

  await ctx.close();
  await browser.close();
  console.log('\n========== MUSCU RENDER CHROMIUM ==========');
  console.log(`Passed: ${passed}  Failed: ${failed}`);
  process.exit(failed > 0 ? 1 : 0);
})();
