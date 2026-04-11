/**
 * Playwright test: étape 2/3 musculation - nouvelles questions compétition + sports parallèles
 */
const { chromium } = require('playwright');

const CHROMIUM_EXEC = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const URL = 'http://localhost:3000';

async function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

async function run() {
  const results = [];
  const consoleErrors = [];

  const browser = await chromium.launch({
    executablePath: CHROMIUM_EXEC,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const context = await browser.newContext();

  // Auth bypass via addInitScript
  await context.addInitScript(() => {
    sessionStorage.setItem('mtd_gate_access', '1gs8uk7');
  });

  const page = await context.newPage();

  // Capture console errors
  page.on('console', msg => {
    if (msg.type() === 'error') {
      consoleErrors.push(msg.text());
    }
  });
  page.on('pageerror', err => {
    consoleErrors.push('pageerror: ' + err.message);
  });

  // Navigate
  await page.goto(URL, { waitUntil: 'networkidle' });
  await sleep(1000);

  // Inject state and render
  await page.evaluate(() => {
    if (window.AUTH) {
      window.AUTH.isLoggedIn = function() { return true; };
      window.AUTH.getUser = function() { return { id: 'test-step2-001', email: 't@t.com' }; };
    }
    window.S = window.S || {};
    window.S.view = 'sport';
    window.S.appMode = 'both';
    window.S.sStep = 2;
    window.S.sportType = 'muscu';
    window.S.sportLevel = 'intermediate';
    window.S.sportDays = 4;
    window.S.sportEquipment = 'gym';
    window.S.competitionGoal = false;
    window.S.sportHobbies = [];
    window.S.firstLoginDate = '2025-01-01';
    window.S.todayWellness = {
      date: new Date().toISOString().slice(0, 10),
      sleep: 7, energy: 3, stress: 2, soreness: 1
    };
    window.render();
  });
  await sleep(800);

  // ─── TEST 9: page non blanche ───────────────────────────────────────────────
  const bodyLen = await page.evaluate(() => document.body.innerHTML.length);
  results.push({
    id: 9,
    name: 'Page non blanche (body.innerHTML.length > 100)',
    pass: bodyLen > 100,
    observed: `length = ${bodyLen}`
  });

  // ─── TEST 1: Affichage nouvelles sections ────────────────────────────────────
  const hasCompetition = await page.evaluate(() =>
    document.body.innerText.includes('Compétition à préparer') ||
    document.body.innerHTML.includes('Comp&#233;tition') ||
    document.body.innerHTML.includes('Compétition')
  );
  const hasSportsParalleles = await page.evaluate(() =>
    document.body.innerText.includes('Sports pratiqués en parallèle') ||
    document.body.innerHTML.includes('Sports pratic') ||
    document.body.innerHTML.includes('parallèle') ||
    document.body.innerHTML.includes('parall&#232;le')
  );
  results.push({
    id: 1,
    name: 'Affichage "Compétition à préparer"',
    pass: hasCompetition,
    observed: hasCompetition ? 'trouvé' : 'ABSENT'
  });
  results.push({
    id: 1,
    name: 'Affichage "Sports pratiqués en parallèle"',
    pass: hasSportsParalleles,
    observed: hasSportsParalleles ? 'trouvé' : 'ABSENT'
  });

  // ─── TEST 2: Boutons compétition ─────────────────────────────────────────────
  // Find all buttons/elements that contain "Non" and "Oui"
  // Competition buttons are rendered as div.level-item (not <button>)
  const btnNonVisible = await page.evaluate(() => {
    const all = Array.from(document.querySelectorAll('button, .btn, [onclick], .option-btn, .level-item, div[class*="level"]'));
    return all.some(el => el.textContent.trim() === 'Non' || el.textContent.includes('Non'));
  });
  const btnOuiVisible = await page.evaluate(() => {
    const all = Array.from(document.querySelectorAll('button, .btn, [onclick], .option-btn, .level-item, div[class*="level"]'));
    return all.some(el => el.textContent.includes('Oui') && el.textContent.includes('date'));
  });
  const nonHasClassOn = await page.evaluate(() => {
    const all = Array.from(document.querySelectorAll('button, .btn, [onclick], .option-btn, .level-item, div[class*="level"]'));
    const nonBtn = all.find(el => el.textContent.trim() === 'Non' || (el.textContent.includes('Non') && !el.textContent.includes('Oui')));
    if (!nonBtn) return null;
    return nonBtn.classList.contains('on');
  });

  results.push({
    id: 2,
    name: 'Bouton "Non" visible',
    pass: btnNonVisible,
    observed: btnNonVisible ? 'visible' : 'ABSENT'
  });
  results.push({
    id: 2,
    name: 'Bouton "Oui — j\'ai une date" visible',
    pass: btnOuiVisible,
    observed: btnOuiVisible ? 'visible' : 'ABSENT'
  });
  results.push({
    id: 2,
    name: '"Non" a la classe `on` par défaut',
    pass: nonHasClassOn === true,
    observed: nonHasClassOn === null ? 'bouton Non introuvable' : `classe on: ${nonHasClassOn}`
  });

  // ─── TEST 3: Toggle → Oui ────────────────────────────────────────────────────
  // Click "Oui — j'ai une date" — buttons are div.level-item (addEventListener-based)
  // Must use Playwright locator.click(), not element.click() via evaluate
  let ouiClicked = false;
  try {
    const ouiLocator = page.locator('.level-item').filter({ hasText: 'Oui' });
    const ouiCount = await ouiLocator.count();
    if (ouiCount > 0) {
      await ouiLocator.first().click();
      ouiClicked = true;
    }
  } catch (e) {
    ouiClicked = false;
  }
  await sleep(400);

  const competitionGoalTrue = await page.evaluate(() => window.S && window.S.competitionGoal === true);
  const dateInputExists = await page.evaluate(() => !!document.querySelector('input[type="date"]'));

  results.push({
    id: 3,
    name: 'Clic sur "Oui — j\'ai une date" réussi',
    pass: ouiClicked,
    observed: ouiClicked ? 'cliqué' : 'bouton introuvable'
  });
  results.push({
    id: 3,
    name: 'S.competitionGoal === true après clic Oui',
    pass: competitionGoalTrue,
    observed: `S.competitionGoal = ${await page.evaluate(() => window.S && window.S.competitionGoal)}`
  });
  results.push({
    id: 3,
    name: 'Champ date apparaît dans le DOM',
    pass: dateInputExists,
    observed: dateInputExists ? 'input[type=date] présent' : 'ABSENT'
  });

  // ─── TEST 4: Saisie date ─────────────────────────────────────────────────────
  if (dateInputExists) {
    await page.evaluate(() => {
      const input = document.querySelector('input[type="date"]');
      if (input) {
        input.value = '2026-09-15';
        input.dispatchEvent(new Event('input', { bubbles: true }));
        input.dispatchEvent(new Event('change', { bubbles: true }));
      }
    });
    await sleep(300);
    const competitionDate = await page.evaluate(() => window.S && window.S.competitionDate);
    results.push({
      id: 4,
      name: 'S.competitionDate === "2026-09-15" après saisie',
      pass: competitionDate === '2026-09-15',
      observed: `S.competitionDate = "${competitionDate}"`
    });
  } else {
    results.push({
      id: 4,
      name: 'S.competitionDate === "2026-09-15" après saisie',
      pass: false,
      observed: 'SKIPPED — input[type=date] absent'
    });
  }

  // ─── TEST 5: Toggle → Non ────────────────────────────────────────────────────
  // Must use Playwright locator.click() for addEventListener-based handlers
  let nonClicked = false;
  try {
    // Filter to the "Non" level-item that doesn't contain "Oui"
    const nonLocator = page.locator('.level-item').filter({ hasText: /^Non/ });
    const nonCount = await nonLocator.count();
    if (nonCount > 0) {
      await nonLocator.first().click();
      nonClicked = true;
    } else {
      // Fallback: find by exact text prefix via all level-items
      const allItems = page.locator('.level-item');
      const cnt = await allItems.count();
      for (let i = 0; i < cnt; i++) {
        const txt = await allItems.nth(i).textContent();
        if (txt && txt.startsWith('Non')) {
          await allItems.nth(i).click();
          nonClicked = true;
          break;
        }
      }
    }
  } catch (e) {
    nonClicked = false;
  }
  await sleep(400);

  const competitionGoalFalse = await page.evaluate(() => window.S && window.S.competitionGoal === false);
  const competitionDateEmpty = await page.evaluate(() => {
    const v = window.S && window.S.competitionDate;
    return v === '' || v === undefined || v === null;
  });

  results.push({
    id: 5,
    name: 'S.competitionGoal === false après retour "Non"',
    pass: competitionGoalFalse,
    observed: `S.competitionGoal = ${await page.evaluate(() => window.S && window.S.competitionGoal)}`
  });
  results.push({
    id: 5,
    name: 'S.competitionDate === "" après retour "Non"',
    pass: competitionDateEmpty,
    observed: `S.competitionDate = "${await page.evaluate(() => window.S && window.S.competitionDate)}"`
  });

  // ─── TEST 6: Chips hobbies ───────────────────────────────────────────────────
  // Check Running chip exists
  const runningChipExists = await page.evaluate(() => {
    const all = Array.from(document.querySelectorAll('button, .chip, .tag, [onclick], .option-btn, span'));
    return all.some(el => el.textContent.trim() === 'Running' || el.textContent.includes('Running'));
  });
  const veloExists = await page.evaluate(() => {
    const all = Array.from(document.querySelectorAll('button, .chip, .tag, [onclick], .option-btn, span'));
    return all.some(el => el.textContent.includes('Vélo') || el.textContent.includes('Velo'));
  });
  const natationExists = await page.evaluate(() => {
    const all = Array.from(document.querySelectorAll('button, .chip, .tag, [onclick], .option-btn, span'));
    return all.some(el => el.textContent.includes('Natation'));
  });

  results.push({
    id: 6,
    name: 'Chip "Running" présente',
    pass: runningChipExists,
    observed: runningChipExists ? 'présente' : 'ABSENTE'
  });
  results.push({
    id: 6,
    name: 'Chip "Vélo" présente',
    pass: veloExists,
    observed: veloExists ? 'présente' : 'ABSENTE'
  });
  results.push({
    id: 6,
    name: 'Chip "Natation" présente',
    pass: natationExists,
    observed: natationExists ? 'présente' : 'ABSENTE'
  });

  // Click Running
  const runningClicked = await page.evaluate(() => {
    const all = Array.from(document.querySelectorAll('button, .chip, .tag, [onclick], .option-btn, span'));
    const chip = all.find(el => el.textContent.trim() === 'Running');
    if (!chip) return false;
    chip.click();
    return true;
  });
  await sleep(300);

  const hobbiesHasRunning = await page.evaluate(() => {
    const h = window.S && window.S.sportHobbies;
    return Array.isArray(h) && (h.includes('running') || h.includes('Running'));
  });
  results.push({
    id: 6,
    name: 'S.sportHobbies contient "running" après clic',
    pass: hobbiesHasRunning,
    observed: `S.sportHobbies = ${JSON.stringify(await page.evaluate(() => window.S && window.S.sportHobbies))}`
  });

  // Click Running again to deselect
  const runningClicked2 = await page.evaluate(() => {
    const all = Array.from(document.querySelectorAll('button, .chip, .tag, [onclick], .option-btn, span'));
    const chip = all.find(el => el.textContent.trim() === 'Running');
    if (!chip) return false;
    chip.click();
    return true;
  });
  await sleep(300);

  const hobbiesNotRunning = await page.evaluate(() => {
    const h = window.S && window.S.sportHobbies;
    return Array.isArray(h) && !h.includes('running') && !h.includes('Running');
  });
  results.push({
    id: 6,
    name: '"running" retiré de S.sportHobbies après 2e clic',
    pass: hobbiesNotRunning,
    observed: `S.sportHobbies = ${JSON.stringify(await page.evaluate(() => window.S && window.S.sportHobbies))}`
  });

  // ─── TEST 7: Bouton Continuer intact ─────────────────────────────────────────
  const continuerInfo = await page.evaluate(() => {
    const all = Array.from(document.querySelectorAll('button, .btn, [onclick]'));
    const btn = all.find(el => el.textContent.includes('Continuer'));
    if (!btn) return null;
    return {
      exists: true,
      disabled: btn.disabled || btn.hasAttribute('disabled') || btn.classList.contains('disabled')
    };
  });
  results.push({
    id: 7,
    name: 'Bouton "Continuer" existe',
    pass: continuerInfo !== null && continuerInfo.exists,
    observed: continuerInfo ? 'trouvé' : 'ABSENT'
  });
  results.push({
    id: 7,
    name: 'Bouton "Continuer" n\'est pas disabled',
    pass: continuerInfo !== null && !continuerInfo.disabled,
    observed: continuerInfo ? `disabled = ${continuerInfo.disabled}` : 'bouton absent'
  });

  // ─── TEST 8: 0 erreurs console ───────────────────────────────────────────────
  results.push({
    id: 8,
    name: '0 erreurs JS console',
    pass: consoleErrors.length === 0,
    observed: consoleErrors.length === 0
      ? 'aucune erreur'
      : `${consoleErrors.length} erreur(s): ${JSON.stringify(consoleErrors.slice(0, 5))}`
  });

  await browser.close();

  // ─── RAPPORT ─────────────────────────────────────────────────────────────────
  console.log('\n═══════════════════════════════════════════════════════════════');
  console.log('  RAPPORT PLAYWRIGHT — Étape 2/3 Musculation (nouvelles questions)');
  console.log('═══════════════════════════════════════════════════════════════\n');

  let passed = 0;
  let failed = 0;

  // Group by test id
  const testIds = [1, 2, 3, 4, 5, 6, 7, 8, 9];
  const testNames = {
    1: 'Affichage des nouvelles sections',
    2: 'Options compétition',
    3: 'Toggle compétition → Oui',
    4: 'Saisie date',
    5: 'Toggle compétition → Non',
    6: 'Chips hobbies',
    7: 'Bouton Continuer intact',
    8: '0 erreurs console',
    9: 'Page non blanche'
  };

  for (const id of testIds) {
    const testResults = results.filter(r => r.id === id);
    const allPass = testResults.every(r => r.pass);
    const icon = allPass ? '✅' : '❌';
    console.log(`TEST ${id} — ${testNames[id]}: ${icon}`);
    for (const r of testResults) {
      const sub = r.pass ? '  ✓' : '  ✗';
      console.log(`${sub} ${r.name}: ${r.observed}`);
    }
    console.log('');
    if (allPass) passed++;
    else failed++;
  }

  console.log('═══════════════════════════════════════════════════════════════');
  console.log(`  RÉSULTAT: ${passed}/${testIds.length} tests passés, ${failed} échoués`);
  console.log('═══════════════════════════════════════════════════════════════\n');

  if (failed > 0) process.exit(1);
}

run().catch(e => {
  console.error('CRASH:', e);
  process.exit(2);
});
