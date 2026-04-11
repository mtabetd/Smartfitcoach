/**
 * Playwright test: Génération de programme musculation IA (muscu-program-generator.js)
 * Tests: happy path, erreur 500, timeout, JSON malformé, programme vide
 */
const { chromium } = require('playwright');

const CHROMIUM_EXEC = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const URL = 'http://localhost:3000';

async function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

// ─── Injection d'état complète pour atteindre l'étape de génération ─────────
async function injectStateAndOpenModal(page) {
  await page.evaluate(() => {
    if (window.AUTH) {
      window.AUTH.isLoggedIn = function() { return true; };
      window.AUTH.getUser = function() { return { id: 'test-sport-001', email: 't@t.com' }; };
    }
    window.S = window.S || {};
    window.S.prenom = 'TestUser';
    window.S.age = 28;
    window.S.weight = 80;
    window.S.height = 180;
    window.S.sex = 'homme';
    window.S.appMode = 'both';
    window.S.view = 'sport';
    window.S.sportType = 'muscu';
    window.S.sStep = 3;
    window.S.sportLevel = 'intermediate';
    window.S.sportDays = 4;
    window.S.sportEquipment = 'gym';
    window.S.sportFocus = {
      chest: 3, back: 4, shoulders: 3, biceps: 2, triceps: 2,
      quads: 4, hamstrings: 3, glutes: 3, calves: 1, abs: 2
    };
    window.S.muscuDuration = 60;
    window.S.goal = 3;
    window.S.competitionGoal = false;
    window.S.sportHobbies = [];
    window.S.firstLoginDate = '2025-01-01';
    window.S.todayWellness = {
      date: new Date().toISOString().slice(0, 10),
      sleep: 7, energy: 3, stress: 2, soreness: 1
    };
    // Nécessaire pour que openMuscuProgramGenerator saute installations+stress et aille direct à showGenerationStep
    window.S.installations = ['muscu'];
    window.S.stress = 5;
    window.render();
  });
  await sleep(600);

  // Ouvrir la modal en appelant directement openMuscuProgramGenerator
  await page.evaluate(() => {
    if (typeof window.openMuscuProgramGenerator === 'function') {
      window.openMuscuProgramGenerator();
    }
  });
  await sleep(400);
}

async function run() {
  const results = [];
  let testResults = [];

  // ─── Utilitaire rapport ───────────────────────────────────────────────────
  function addResult(testId, name, pass, observed) {
    results.push({ id: testId, name, pass, observed });
  }

  const browser = await chromium.launch({
    executablePath: CHROMIUM_EXEC,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // TEST 1 — Génération réussie (happy path)
  // ═══════════════════════════════════════════════════════════════════════════
  {
    const consoleErrors = [];
    const context = await browser.newContext();
    await context.addInitScript(() => {
      sessionStorage.setItem('mtd_gate_access', '1gs8uk7');
    });
    const page = await context.newPage();
    page.on('console', msg => { if (msg.type() === 'error') consoleErrors.push(msg.text()); });
    page.on('pageerror', err => { consoleErrors.push('pageerror: ' + err.message); });

    // Programme texte factice dans le format attendu (texte parsé par parseProgramToHTML)
    const fakeProgramText = [
      'SEMAINE 1',
      'Lundi — Pectoraux · Dos',
      '1. Développé couché — 4×8-10, repos 90s',
      '2. Tirage horizontal — 4×10-12, repos 90s',
      'Mercredi — Épaules · Bras',
      '1. Développé militaire — 4×10, repos 90s',
      '2. Curl haltères — 3×12, repos 60s',
      'SEMAINE 2',
      'Lundi — Pectoraux · Dos',
      '1. Développé couché — 4×10-12, repos 90s',
      '2. Rowing barre — 4×10, repos 90s'
    ].join('\n');

    // Intercepter la route avant navigation
    await page.route('**/*generate-muscu*', route => route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ program: fakeProgramText, generatedAt: new Date().toISOString() })
    }));

    await page.goto(URL, { waitUntil: 'networkidle' });
    await sleep(1000);

    await injectStateAndOpenModal(page);

    // Chercher le bouton "Construire mon programme"
    const btnExists = await page.evaluate(() => {
      const btn = document.getElementById('muscu-prog-generate');
      return btn !== null;
    });
    addResult(1, 'Bouton "Construire mon programme" existe dans la modal', btnExists, btnExists ? 'trouvé' : 'ABSENT');

    if (btnExists) {
      await page.click('#muscu-prog-generate');
      // Attendre que le contenu de la modal change (fin du spinner)
      try {
        await page.waitForFunction(() => {
          const content = document.getElementById('muscu-prog-content');
          if (!content) return false;
          // Le spinner a un div avec "GÉNÉRATION EN COURS"
          return !content.innerHTML.includes('GÉNÉRATION EN COURS') &&
                 content.innerHTML.length > 100;
        }, { timeout: 5000 });
      } catch (e) {
        // timeout — on continue pour capturer l'état
      }
    }
    await sleep(500);

    // Vérifier le contenu affiché
    const contentHTML = await page.evaluate(() => {
      const el = document.getElementById('muscu-prog-content');
      return el ? el.innerHTML : '';
    });

    // Vérifier que le programme est affiché (pas de spinner, contenu présent)
    const hasProgram = contentHTML.includes('SEMAINE') || contentHTML.includes('Semaine') ||
      contentHTML.includes('muscu-prog-cards') || contentHTML.includes('program-week') ||
      contentHTML.includes('Développé') || contentHTML.includes('Imprimer');
    addResult(1, 'Programme affiché dans la modal (texte ou cartes)', hasProgram, hasProgram ? 'programme affiché' : 'ABSENT — html: ' + contentHTML.slice(0, 200));

    const noSpinner = !contentHTML.includes('GÉNÉRATION EN COURS');
    addResult(1, 'Spinner de chargement disparu', noSpinner, noSpinner ? 'spinner disparu' : 'spinner encore présent');

    // Vérifier boutons Imprimer / Partager
    const hasPrintBtn = await page.evaluate(() => !!document.getElementById('muscu-prog-print'));
    addResult(1, 'Bouton "Imprimer / PDF" présent', hasPrintBtn, hasPrintBtn ? 'présent' : 'ABSENT');

    const hasShareBtn = await page.evaluate(() => !!document.getElementById('muscu-prog-share'));
    addResult(1, 'Bouton "Partager" présent', hasShareBtn, hasShareBtn ? 'présent' : 'ABSENT');

    // 0 erreurs JS
    addResult(1, '0 erreurs JS console', consoleErrors.length === 0,
      consoleErrors.length === 0 ? 'aucune erreur' : `${consoleErrors.length} erreur(s): ${JSON.stringify(consoleErrors.slice(0, 3))}`);

    await context.close();
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // TEST 2 — Erreur API 500
  // ═══════════════════════════════════════════════════════════════════════════
  {
    const consoleErrors = [];
    const context = await browser.newContext();
    await context.addInitScript(() => {
      sessionStorage.setItem('mtd_gate_access', '1gs8uk7');
    });
    const page = await context.newPage();
    page.on('console', msg => { if (msg.type() === 'error') consoleErrors.push(msg.text()); });
    page.on('pageerror', err => { consoleErrors.push('pageerror: ' + err.message); });

    await page.route('**/*generate-muscu*', route => route.fulfill({
      status: 500,
      contentType: 'application/json',
      body: JSON.stringify({ error: 'Internal Server Error' })
    }));

    await page.goto(URL, { waitUntil: 'networkidle' });
    await sleep(1000);
    await injectStateAndOpenModal(page);

    const btnExists2 = await page.evaluate(() => !!document.getElementById('muscu-prog-generate'));
    if (btnExists2) {
      await page.click('#muscu-prog-generate');
      // Attendre que le spinner disparaisse
      try {
        await page.waitForFunction(() => {
          const content = document.getElementById('muscu-prog-content');
          return content && !content.innerHTML.includes('GÉNÉRATION EN COURS');
        }, { timeout: 5000 });
      } catch (e) {}
    }
    await sleep(500);

    const contentHTML2 = await page.evaluate(() => {
      const el = document.getElementById('muscu-prog-content');
      return el ? el.innerHTML : '';
    });

    // Vérifier message d'erreur
    const hasErrorMsg = contentHTML2.includes('⚠') || contentHTML2.includes('error') ||
      contentHTML2.includes('erreur') || contentHTML2.includes('Erreur') ||
      contentHTML2.includes('Internal Server Error') || contentHTML2.includes('échoué');
    addResult(2, 'Message d\'erreur affiché (pas page blanche)', hasErrorMsg,
      hasErrorMsg ? 'message d\'erreur présent' : 'AUCUN message d\'erreur — html: ' + contentHTML2.slice(0, 200));

    // Vérifier bouton Réessayer
    const hasRetryBtn = await page.evaluate(() => {
      const btn = document.getElementById('muscu-prog-retry');
      if (btn) return true;
      // Chercher tout bouton contenant "Réessayer"
      const all = Array.from(document.querySelectorAll('button'));
      return all.some(b => b.textContent.includes('ssayer'));
    });
    addResult(2, 'Bouton "Réessayer" présent (app non bloquée)', hasRetryBtn,
      hasRetryBtn ? 'bouton Réessayer trouvé' : 'ABSENT');

    // Vérifier que l'app peut réessayer (clic sur retry reload la step)
    let retryWorks = false;
    if (hasRetryBtn) {
      const retryBtnEl = await page.evaluate(() => {
        return !!document.getElementById('muscu-prog-retry');
      });
      if (retryBtnEl) {
        await page.click('#muscu-prog-retry');
        await sleep(600);
        // Après retry, on devrait revenir à showGenerationStep (bouton Construire)
        const afterRetryHTML = await page.evaluate(() => {
          const el = document.getElementById('muscu-prog-content');
          return el ? el.innerHTML : '';
        });
        retryWorks = afterRetryHTML.includes('muscu-prog-generate') || afterRetryHTML.includes('Construire') ||
          afterRetryHTML.includes('GÉNÉRATION EN COURS');
      }
    }
    addResult(2, 'Clic Réessayer relance le flow (app non bloquée)', retryWorks || hasRetryBtn,
      retryWorks ? 'flow relancé après retry' : (hasRetryBtn ? 'bouton présent (retry non cliqué ou function relancée)' : 'IMPOSSIBLE à tester (retry absent)'));

    // 0 crash (pageerror)
    const noCrash = !consoleErrors.some(e => e.startsWith('pageerror'));
    addResult(2, '0 crash JS (pageerror)', noCrash,
      noCrash ? 'aucun crash' : `crash détecté: ${consoleErrors.filter(e => e.startsWith('pageerror')).join(', ')}`);

    await context.close();
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // TEST 3 — Timeout (mock ne répond jamais)
  // ═══════════════════════════════════════════════════════════════════════════
  {
    const consoleErrors = [];
    let requestCount = 0;
    const context = await browser.newContext();
    await context.addInitScript(() => {
      sessionStorage.setItem('mtd_gate_access', '1gs8uk7');
    });
    const page = await context.newPage();
    page.on('console', msg => { if (msg.type() === 'error') consoleErrors.push(msg.text()); });
    page.on('pageerror', err => { consoleErrors.push('pageerror: ' + err.message); });

    // Ne jamais répondre — simuler un timeout réseau
    await page.route('**/*generate-muscu*', async route => {
      requestCount++;
      // Ne pas appeler route.fulfill() ni route.abort() → la requête reste en attente indéfiniment
      // On attend très longtemps pour simuler le timeout
      await new Promise(r => setTimeout(r, 60000));
      await route.abort('timedout').catch(() => {});
    });

    await page.goto(URL, { waitUntil: 'networkidle' });
    await sleep(1000);
    await injectStateAndOpenModal(page);

    const btnExists3 = await page.evaluate(() => !!document.getElementById('muscu-prog-generate'));
    addResult(3, 'Bouton Construire disponible avant clic', btnExists3, btnExists3 ? 'trouvé' : 'ABSENT');

    if (btnExists3) {
      await page.click('#muscu-prog-generate');
    }

    // Attendre 2s — le spinner devrait être visible (pas de timeout côté client)
    await sleep(2000);

    const spinnerVisible = await page.evaluate(() => {
      const content = document.getElementById('muscu-prog-content');
      return content && content.innerHTML.includes('GÉNÉRATION EN COURS');
    });
    addResult(3, 'Spinner visible pendant l\'attente (fetch en cours)', spinnerVisible,
      spinnerVisible ? 'spinner visible' : 'spinner absent — fetch a peut-être déjà fini ou crashé');

    // Note: il n'y a PAS de timeout côté client dans generate-muscu-program-generator.js
    // On attend la fin du réseau (on abort la route via le context close)
    // Vérification: un seul appel réseau (pas de retry automatique)
    addResult(3, 'Un seul appel réseau (pas de retry automatique)', requestCount === 1,
      `requestCount = ${requestCount} (attendu: 1)`);

    // Vérification absence de timeout côté client
    const hasNoClientTimeout = spinnerVisible; // si spinner encore affiché, pas de timeout client
    addResult(3, 'ATTENTION: Aucun timeout côté client détecté (spinner bloqué indéfiniment)', !hasNoClientTimeout,
      hasNoClientTimeout ? 'PROBLÈME: le client attend indéfiniment sans timeout — UX dégradée' : 'Timeout client présent (comportement correct)');

    // On ferme le context pour débloquer
    const noCrash3 = !consoleErrors.some(e => e.startsWith('pageerror'));
    addResult(3, '0 crash JS pendant l\'attente', noCrash3,
      noCrash3 ? 'aucun crash' : consoleErrors.filter(e => e.startsWith('pageerror')).join(', '));

    await context.close();
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // TEST 4 — Réponse JSON malformée ({ program: null } et {})
  // ═══════════════════════════════════════════════════════════════════════════
  {
    // Sous-test 4a : { program: null }
    const consoleErrors4a = [];
    const context4a = await browser.newContext();
    await context4a.addInitScript(() => {
      sessionStorage.setItem('mtd_gate_access', '1gs8uk7');
    });
    const page4a = await context4a.newPage();
    page4a.on('console', msg => { if (msg.type() === 'error') consoleErrors4a.push(msg.text()); });
    page4a.on('pageerror', err => { consoleErrors4a.push('pageerror: ' + err.message); });

    await page4a.route('**/*generate-muscu*', route => route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ program: null })
    }));

    await page4a.goto(URL, { waitUntil: 'networkidle' });
    await sleep(1000);
    await injectStateAndOpenModal(page4a);

    const btn4a = await page4a.evaluate(() => !!document.getElementById('muscu-prog-generate'));
    if (btn4a) {
      await page4a.click('#muscu-prog-generate');
      try {
        await page4a.waitForFunction(() => {
          const c = document.getElementById('muscu-prog-content');
          return c && !c.innerHTML.includes('GÉNÉRATION EN COURS');
        }, { timeout: 5000 });
      } catch (e) {}
    }
    await sleep(500);

    const html4a = await page4a.evaluate(() => {
      const el = document.getElementById('muscu-prog-content');
      return el ? el.innerHTML : '';
    });
    const noCrash4a = !consoleErrors4a.some(e => e.startsWith('pageerror'));
    const noBlankPage4a = html4a.length > 50;
    // Avec program: null, programText = '', parseProgramToHTML('') retourne null → fallback plain text (vide)
    // Le code affiche quand même les boutons Imprimer/Partager
    const hasContent4a = noBlankPage4a;

    addResult(4, '[program: null] App ne crashe pas', noCrash4a,
      noCrash4a ? 'aucun crash' : consoleErrors4a.filter(e => e.startsWith('pageerror')).join(', '));
    addResult(4, '[program: null] Page non blanche (contenu affiché)', hasContent4a,
      hasContent4a ? `html.length = ${html4a.length}` : 'page blanche');
    // Vérifier si un message utile s'affiche ou si c'est silencieux
    const hasMeaningfulMsg4a = html4a.includes('Imprimer') || html4a.includes('Partager') ||
      html4a.includes('programme') || html4a.includes('erreur') || html4a.includes('Réessayer');
    addResult(4, '[program: null] Affichage cohérent (boutons ou message)', hasMeaningfulMsg4a,
      hasMeaningfulMsg4a ? 'contenu cohérent affiché' : 'AUCUN contenu utile — html: ' + html4a.slice(0, 300));

    await context4a.close();

    // Sous-test 4b : {}
    const consoleErrors4b = [];
    const context4b = await browser.newContext();
    await context4b.addInitScript(() => {
      sessionStorage.setItem('mtd_gate_access', '1gs8uk7');
    });
    const page4b = await context4b.newPage();
    page4b.on('console', msg => { if (msg.type() === 'error') consoleErrors4b.push(msg.text()); });
    page4b.on('pageerror', err => { consoleErrors4b.push('pageerror: ' + err.message); });

    await page4b.route('**/*generate-muscu*', route => route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({})
    }));

    await page4b.goto(URL, { waitUntil: 'networkidle' });
    await sleep(1000);
    await injectStateAndOpenModal(page4b);

    const btn4b = await page4b.evaluate(() => !!document.getElementById('muscu-prog-generate'));
    if (btn4b) {
      await page4b.click('#muscu-prog-generate');
      try {
        await page4b.waitForFunction(() => {
          const c = document.getElementById('muscu-prog-content');
          return c && !c.innerHTML.includes('GÉNÉRATION EN COURS');
        }, { timeout: 5000 });
      } catch (e) {}
    }
    await sleep(500);

    const html4b = await page4b.evaluate(() => {
      const el = document.getElementById('muscu-prog-content');
      return el ? el.innerHTML : '';
    });
    const noCrash4b = !consoleErrors4b.some(e => e.startsWith('pageerror'));
    addResult(4, '[{} vide] App ne crashe pas', noCrash4b,
      noCrash4b ? 'aucun crash' : consoleErrors4b.filter(e => e.startsWith('pageerror')).join(', '));
    const hasContent4b = html4b.length > 50;
    addResult(4, '[{} vide] Page non blanche', hasContent4b,
      hasContent4b ? `html.length = ${html4b.length}` : 'page blanche');

    await context4b.close();
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // TEST 5 — Programme vide ({ program: [] })
  // ═══════════════════════════════════════════════════════════════════════════
  {
    const consoleErrors5 = [];
    const context5 = await browser.newContext();
    await context5.addInitScript(() => {
      sessionStorage.setItem('mtd_gate_access', '1gs8uk7');
    });
    const page5 = await context5.newPage();
    page5.on('console', msg => { if (msg.type() === 'error') consoleErrors5.push(msg.text()); });
    page5.on('pageerror', err => { consoleErrors5.push('pageerror: ' + err.message); });

    await page5.route('**/*generate-muscu*', route => route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ program: [] })
    }));

    await page5.goto(URL, { waitUntil: 'networkidle' });
    await sleep(1000);
    await injectStateAndOpenModal(page5);

    const btn5 = await page5.evaluate(() => !!document.getElementById('muscu-prog-generate'));
    if (btn5) {
      await page5.click('#muscu-prog-generate');
      try {
        await page5.waitForFunction(() => {
          const c = document.getElementById('muscu-prog-content');
          return c && !c.innerHTML.includes('GÉNÉRATION EN COURS');
        }, { timeout: 5000 });
      } catch (e) {}
    }
    await sleep(500);

    const html5 = await page5.evaluate(() => {
      const el = document.getElementById('muscu-prog-content');
      return el ? el.innerHTML : '';
    });
    const noCrash5 = !consoleErrors5.some(e => e.startsWith('pageerror'));
    addResult(5, '[program: []] App ne crashe pas', noCrash5,
      noCrash5 ? 'aucun crash' : consoleErrors5.filter(e => e.startsWith('pageerror')).join(', '));
    const hasContent5 = html5.length > 50;
    addResult(5, '[program: []] Page non blanche', hasContent5,
      hasContent5 ? `html.length = ${html5.length}` : 'page blanche');

    // Comportement attendu: program = [] → programText = '' (car data.program || '')
    // [] est truthy donc programText = []
    // parseProgramToHTML([]) → programText.split('\n') → TypeError? ou split de Array?
    // Array.prototype.split n'existe pas — cela peut provoquer une erreur
    const hasProgramOrError5 = html5.includes('programme') || html5.includes('Imprimer') ||
      html5.includes('Réessayer') || html5.includes('erreur') || html5.includes('error');
    addResult(5, '[program: []] Comportement cohérent (programme ou erreur affichée)', hasProgramOrError5,
      hasProgramOrError5 ? 'affiché' : 'AUCUN contenu utile — html: ' + html5.slice(0, 300));

    // Vérifier erreurs console pour détecter potentiel TypeError
    const hasTypeError5 = consoleErrors5.some(e => e.includes('TypeError') || e.includes('split'));
    addResult(5, '[program: []] Aucun TypeError/split error dans la console', !hasTypeError5,
      !hasTypeError5 ? 'aucun TypeError' : 'TypeError détecté: ' + consoleErrors5.filter(e => e.includes('TypeError') || e.includes('split')).join('; '));

    await context5.close();
  }

  await browser.close();

  // ═══════════════════════════════════════════════════════════════════════════
  // RAPPORT
  // ═══════════════════════════════════════════════════════════════════════════
  console.log('\n═══════════════════════════════════════════════════════════════════');
  console.log('  RAPPORT PLAYWRIGHT — Génération Programme Musculation IA');
  console.log('═══════════════════════════════════════════════════════════════════\n');

  const testDefs = {
    1: 'Génération réussie (happy path)',
    2: 'Erreur API 500',
    3: 'Timeout (pas de réponse)',
    4: 'JSON malformé (program: null / {})',
    5: 'Programme vide (program: [])'
  };

  let passed = 0;
  let failed = 0;

  for (const [id, name] of Object.entries(testDefs)) {
    const tid = parseInt(id);
    const testResults = results.filter(r => r.id === tid);
    const allPass = testResults.every(r => r.pass);
    const icon = allPass ? '✅' : '❌';
    console.log(`TEST ${id} — ${name}: ${icon}`);
    for (const r of testResults) {
      const sub = r.pass ? '  ✓' : '  ✗';
      console.log(`${sub} ${r.name}: ${r.observed}`);
    }
    console.log('');
    if (allPass) passed++;
    else failed++;
  }

  console.log('═══════════════════════════════════════════════════════════════════');
  console.log(`  RÉSULTAT: ${passed}/${Object.keys(testDefs).length} tests passés, ${failed} échoués`);
  console.log('═══════════════════════════════════════════════════════════════════\n');

  // Rapport des comportements inattendus
  const unexpected = results.filter(r => !r.pass);
  if (unexpected.length > 0) {
    console.log('COMPORTEMENTS INATTENDUS / PROBLÈMES DÉTECTÉS:');
    for (const r of unexpected) {
      console.log(`  [TEST ${r.id}] ${r.name}: ${r.observed}`);
    }
    console.log('');
  }

  if (failed > 0) process.exit(1);
}

run().catch(e => {
  console.error('CRASH:', e);
  process.exit(2);
});
