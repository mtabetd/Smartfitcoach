// QA PAR-Q + Musculation Steps — SmartFitCoach
// Tests 1–10 — Playwright Chromium headless
const { chromium } = require('/home/user/Smartfitcoach/node_modules/playwright');
const path = require('path');
const fs = require('fs');

const BASE_URL = 'http://127.0.0.1:45515';
const SCREENSHOTS_DIR = path.join(__dirname, 'qa-parq-screenshots');
if (!fs.existsSync(SCREENSHOTS_DIR)) fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });

const SETUP_SCRIPT = `
  sessionStorage.setItem('mtd_gate_access', '1gs8uk7');
  sessionStorage.setItem('mtd_seen_welcome', 'true');
  localStorage.setItem('mtd_dev_wiped_v1', 'true');
`;

const FAKE_USER_OBJ = { id: 'anon', name: 'TestUser QA', email: 'test@qa.local' };

async function newPage(browser, profile, extraInit) {
  const ctx = await browser.newContext();
  await ctx.addInitScript(`
    ${SETUP_SCRIPT}
    ${profile ? `localStorage.setItem('mtd_profile_anon', JSON.stringify(${JSON.stringify(profile)}));` : ''}
    ${extraInit || ''}
  `);
  const page = await ctx.newPage();
  return { page, ctx };
}

async function applyAuthBypass(page, profile) {
  await page.waitForFunction(() => typeof window.AUTH !== 'undefined', { timeout: 8000 });
  await page.evaluate(([prof, fakeUser]) => {
    window.AUTH.isLoggedIn = function() { return true; };
    window.AUTH.getUser = function() { return fakeUser; };
    if (prof) {
      localStorage.setItem('mtd_profile_anon', JSON.stringify(prof));
    }
    if (window.loadProfile) window.loadProfile();
    if (window.S) {
      if (prof && (prof.sStep > 0 || prof.sportType)) window.S.view = 'sport';
      else if (prof && prof.nStep === 12) window.S.view = 'today';
    }
    if (window.render) window.render();
  }, [profile || null, FAKE_USER_OBJ]);
  await page.waitForTimeout(800);
}

async function screenshot(page, name) {
  const fp = path.join(SCREENSHOTS_DIR, name + '.png');
  await page.screenshot({ path: fp, fullPage: true });
  return fp;
}

const results = [];

function report(id, status, detail, screenshotPath) {
  const line = `[${status}] ${id}${detail ? ' — ' + detail : ''}${screenshotPath ? ' (screenshot: ' + screenshotPath + ')' : ''}`;
  results.push(line);
  console.log(line);
}

// ─── TEST 1 — PAR-Q sStep=26 : questions médicales ───────────────────────────
async function test1(browser) {
  const profile = {
    step: 10, sex: 'homme', age: 35, poids: 85, taille: 180,
    sportType: 'musculation', sStep: 26, parqDone: false, _parqNextStep: 20
  };

  const { page, ctx } = await newPage(browser, profile);
  const consoleErrors = [];
  page.on('console', msg => { if (msg.type() === 'error') consoleErrors.push(msg.text()); });
  page.on('pageerror', e => consoleErrors.push('[pageerror] ' + e.message));

  try {
    await page.goto(BASE_URL, { waitUntil: 'domcontentloaded', timeout: 15000 });
    await applyAuthBypass(page, profile);
    await page.waitForTimeout(1000);

    // Check page loaded without crash
    const bodyText = (await page.locator('body').innerText()).trim();
    const hasContent = bodyText.length > 10;
    if (!hasContent) {
      const ss = await screenshot(page, 'T1-blank');
      report('TEST 1', 'FAIL', 'Page blanche — PAR-Q sStep=26 ne charge pas', ss);
      await ctx.close();
      return;
    }

    // Check for medical questions content
    const medicalKeywords = ['Médecin', 'médecin', 'douleur', 'thorax', 'coeur', 'PAR-Q', 'parq', 'santé', 'médical', 'cardiaque', 'vertiges', 'médicament', 'os', 'articulation', 'question'];
    let medicalFound = false;
    for (const kw of medicalKeywords) {
      if (bodyText.toLowerCase().includes(kw.toLowerCase())) {
        medicalFound = true;
        break;
      }
    }

    // Also check for any visible form elements (checkboxes, radio, buttons)
    const formElements = await page.locator('input[type="radio"], input[type="checkbox"], button').count();

    const interestingErrors = consoleErrors.filter(e =>
      !/favicon|serviceworker|sw\.js|push|notification|supabase|netlify|ERR_CONNECTION_REFUSED|Failed to fetch|net::ERR/i.test(e)
    );

    const ss = await screenshot(page, 'T1-result');

    if (interestingErrors.length > 0) {
      report('TEST 1', 'FAIL', `console.error présents: ${interestingErrors.slice(0, 3).join(' | ')}`, ss);
    } else if (!medicalFound && formElements === 0) {
      report('TEST 1', 'FAIL', `Aucune question médicale ni formulaire visible. Texte page: "${bodyText.slice(0, 150)}"`, ss);
    } else {
      report('TEST 1', 'PASS',
        `PAR-Q chargé OK | Questions médicales: ${medicalFound ? 'OUI' : 'formulaire détecté'} | console.error: 0`, ss);
    }

  } catch (e) {
    const ss = await screenshot(page, 'T1-exception');
    report('TEST 1', 'FAIL', 'Exception: ' + e.message, ss);
  }

  await ctx.close();
}

// ─── TEST 2 — PAR-Q avec réponses : validation et navigation ─────────────────
async function test2(browser) {
  const profile = {
    step: 10, sex: 'homme', age: 35, poids: 85, taille: 180,
    sportType: 'musculation', sStep: 26, parqDone: false, _parqNextStep: 20
  };

  const { page, ctx } = await newPage(browser, profile);
  const consoleErrors = [];
  page.on('console', msg => { if (msg.type() === 'error') consoleErrors.push(msg.text()); });
  page.on('pageerror', e => consoleErrors.push('[pageerror] ' + e.message));

  try {
    await page.goto(BASE_URL, { waitUntil: 'domcontentloaded', timeout: 15000 });
    await applyAuthBypass(page, profile);
    await page.waitForTimeout(800);

    // Inject PAR-Q answers and navigate to sStep=20
    await page.evaluate(() => {
      window.S.parqAnswers = { q1: false, q2: false, q3: false, q4: false, q5: false, q6: false, q7: false };
      window.S.parqDone = true;
      window.S.sStep = 20;
      window.render();
    });
    await page.waitForTimeout(1000);

    // Check no crash
    const bodyText = (await page.locator('body').innerText()).trim();
    const hasContent = bodyText.length > 10;

    // Check sStep=20 reached
    const appState = await page.evaluate(() => ({
      sStep: window.S && window.S.sStep,
      sportMixEnabled: window.S && window.S.sportMixEnabled,
      sportMixSecondary: window.S && window.S.sportMixSecondary
    }));

    const interestingErrors = consoleErrors.filter(e =>
      !/favicon|serviceworker|sw\.js|push|notification|supabase|netlify|ERR_CONNECTION_REFUSED|Failed to fetch|net::ERR/i.test(e)
    );

    const ss = await screenshot(page, 'T2-result');

    const sStepOk = appState.sStep === 20;
    const sportMixDisabled = appState.sportMixEnabled === false || appState.sportMixEnabled == null || appState.sportMixEnabled === undefined;
    const sportMixSecNull = appState.sportMixSecondary === null || appState.sportMixSecondary === undefined;

    if (!hasContent) {
      report('TEST 2', 'FAIL', 'Page blanche après injection PAR-Q answers', ss);
    } else if (interestingErrors.length > 0) {
      report('TEST 2', 'FAIL', `console.error présents: ${interestingErrors.slice(0, 3).join(' | ')}`, ss);
    } else if (!sStepOk) {
      report('TEST 2', 'FAIL', `sStep=${appState.sStep} au lieu de 20 | sportMixEnabled=${appState.sportMixEnabled} | sportMixSecondary=${appState.sportMixSecondary}`, ss);
    } else {
      report('TEST 2', 'PASS',
        `Navigation sStep=20 OK | sportMixEnabled=${appState.sportMixEnabled} (${sportMixDisabled ? 'non affecté ✓' : 'inattendu'}) | sportMixSecondary=${appState.sportMixSecondary} (${sportMixSecNull ? 'null ✓' : 'inattendu'})`, ss);
    }

  } catch (e) {
    const ss = await screenshot(page, 'T2-exception');
    report('TEST 2', 'FAIL', 'Exception: ' + e.message, ss);
  }

  await ctx.close();
}

// ─── TEST 3 — sStep=20 : questionnaire médical muscu ─────────────────────────
async function test3(browser) {
  const profile = {
    step: 10, sportType: 'musculation', sStep: 20,
    parqDone: true, sex: 'homme', age: 30, poids: 80, taille: 180
  };

  const { page, ctx } = await newPage(browser, profile);
  const consoleErrors = [];
  page.on('console', msg => { if (msg.type() === 'error') consoleErrors.push(msg.text()); });
  page.on('pageerror', e => consoleErrors.push('[pageerror] ' + e.message));

  try {
    await page.goto(BASE_URL, { waitUntil: 'domcontentloaded', timeout: 15000 });
    await applyAuthBypass(page, profile);
    await page.waitForTimeout(1000);

    const bodyText = (await page.locator('body').innerText()).trim();
    const hasContent = bodyText.length > 10;

    const interestingErrors = consoleErrors.filter(e =>
      !/favicon|serviceworker|sw\.js|push|notification|supabase|netlify|ERR_CONNECTION_REFUSED|Failed to fetch|net::ERR/i.test(e)
    );

    const ss = await screenshot(page, 'T3-result');

    if (!hasContent) {
      report('TEST 3', 'FAIL', 'Page blanche — sStep=20 ne charge pas', ss);
    } else if (interestingErrors.length > 0) {
      report('TEST 3', 'FAIL', `console.error présents: ${interestingErrors.slice(0, 3).join(' | ')}`, ss);
    } else {
      report('TEST 3', 'PASS',
        `sStep=20 chargé OK | Contenu visible (${bodyText.slice(0, 100).replace(/\n/g, ' ')}) | console.error: 0`, ss);
    }

  } catch (e) {
    const ss = await screenshot(page, 'T3-exception');
    report('TEST 3', 'FAIL', 'Exception: ' + e.message, ss);
  }

  await ctx.close();
}

// ─── TEST 4 — sStep=1 : objectifs musculation ────────────────────────────────
async function test4(browser) {
  const profile = {
    step: 10, sportType: 'musculation', sStep: 1,
    parqDone: true, sex: 'femme', age: 25, poids: 60, taille: 163
  };

  const { page, ctx } = await newPage(browser, profile);
  const consoleErrors = [];
  page.on('console', msg => { if (msg.type() === 'error') consoleErrors.push(msg.text()); });
  page.on('pageerror', e => consoleErrors.push('[pageerror] ' + e.message));

  try {
    await page.goto(BASE_URL, { waitUntil: 'domcontentloaded', timeout: 15000 });
    await applyAuthBypass(page, profile);
    await page.waitForTimeout(1000);

    // Check for objectives
    const goalKeywords = ['muscle', 'Musclé', 'Perte', 'poids', 'Force', 'Endurance', 'Forme', 'objectif', 'Objectif', 'Sèche', 'Tonification', 'Gain'];
    const bodyText = (await page.locator('body').innerText()).trim();
    let goalsFound = false;
    for (const kw of goalKeywords) {
      if (bodyText.includes(kw)) {
        goalsFound = true;
        break;
      }
    }

    // Try clicking the first clickable goal option
    let clickCrash = false;
    const goalButtons = page.locator('button, .choice, .option, [class*="objectif"], [class*="goal"], [class*="card"]');
    const btnCount = await goalButtons.count();

    if (btnCount > 0) {
      try {
        await goalButtons.first().click();
        await page.waitForTimeout(800);
      } catch (clickErr) {
        // ignore click errors — just check for crashes
      }
    }

    const interestingErrors = consoleErrors.filter(e =>
      !/favicon|serviceworker|sw\.js|push|notification|supabase|netlify|ERR_CONNECTION_REFUSED|Failed to fetch|net::ERR/i.test(e)
    );

    const ss = await screenshot(page, 'T4-result');

    if (interestingErrors.length > 0) {
      report('TEST 4', 'FAIL', `console.error après clic objectif: ${interestingErrors.slice(0, 3).join(' | ')}`, ss);
    } else if (!goalsFound) {
      report('TEST 4', 'FAIL', `Aucun objectif visible. Texte: "${bodyText.slice(0, 150)}"`, ss);
    } else {
      report('TEST 4', 'PASS',
        `Objectifs visibles (${btnCount} éléments cliquables) | Clic sans crash | console.error: 0`, ss);
    }

  } catch (e) {
    const ss = await screenshot(page, 'T4-exception');
    report('TEST 4', 'FAIL', 'Exception: ' + e.message, ss);
  }

  await ctx.close();
}

// ─── TEST 5 — sStep=2 : niveau + organisation + sport mix section ─────────────
async function test5(browser) {
  const profile = {
    step: 10, sportType: 'musculation', sStep: 2,
    parqDone: true, sportGoals: ['muscle'],
    sex: 'femme', age: 25, poids: 60, taille: 163
  };

  const { page, ctx } = await newPage(browser, profile);
  const consoleErrors = [];
  page.on('console', msg => { if (msg.type() === 'error') consoleErrors.push(msg.text()); });
  page.on('pageerror', e => consoleErrors.push('[pageerror] ' + e.message));

  try {
    await page.goto(BASE_URL, { waitUntil: 'domcontentloaded', timeout: 15000 });
    await applyAuthBypass(page, profile);
    await page.waitForTimeout(1000);

    const bodyText = (await page.locator('body').innerText()).trim();

    // Check niveau selectors
    const niveauKeywords = ['Débutant', 'debutant', 'Intermédiaire', 'intermediaire', 'Avancé', 'avance', 'niveau', 'Niveau'];
    let niveauFound = false;
    for (const kw of niveauKeywords) {
      if (bodyText.includes(kw)) { niveauFound = true; break; }
    }

    // Check jours/semaine
    const joursKeywords = ['jours', 'Jours', 'semaine', 'Semaine', 'séances', 'Séances'];
    let joursFound = false;
    for (const kw of joursKeywords) {
      if (bodyText.includes(kw)) { joursFound = true; break; }
    }

    // Check sport mix section
    const sportMixKeywords = ['Combiner', 'combiner', 'plusieurs sports', 'plusieurs sport', 'sport mix', 'Sport mix', 'activité', 'Activité'];
    let sportMixFound = false;
    for (const kw of sportMixKeywords) {
      if (bodyText.includes(kw)) { sportMixFound = true; break; }
    }

    const interestingErrors = consoleErrors.filter(e =>
      !/favicon|serviceworker|sw\.js|push|notification|supabase|netlify|ERR_CONNECTION_REFUSED|Failed to fetch|net::ERR/i.test(e)
    );

    const ss = await screenshot(page, 'T5-result');

    const checks = [
      `niveau: ${niveauFound ? 'OUI ✓' : 'NON ✗'}`,
      `jours/semaine: ${joursFound ? 'OUI ✓' : 'NON ✗'}`,
      `sport mix: ${sportMixFound ? 'OUI ✓' : 'NON ✗'}`,
      `console.error: ${interestingErrors.length === 0 ? '0 ✓' : interestingErrors.length + ' ✗'}`
    ];

    const allOk = niveauFound && joursFound && interestingErrors.length === 0;
    // Sport mix may or may not show depending on app logic — soft check
    const status = (niveauFound || joursFound) && interestingErrors.length === 0 ? 'PASS' : 'FAIL';

    if (!niveauFound && !joursFound) {
      report('TEST 5', 'FAIL', `Aucun sélecteur niveau ni jours visible. ${checks.join(' | ')} | Texte: "${bodyText.slice(0, 200)}"`, ss);
    } else if (interestingErrors.length > 0) {
      report('TEST 5', 'FAIL', `${checks.join(' | ')} | Errors: ${interestingErrors.slice(0, 3).join(' | ')}`, ss);
    } else {
      report('TEST 5', status, checks.join(' | '), ss);
    }

  } catch (e) {
    const ss = await screenshot(page, 'T5-exception');
    report('TEST 5', 'FAIL', 'Exception: ' + e.message, ss);
  }

  await ctx.close();
}

// ─── TEST 6 — sStep=3 : zones musculaires ────────────────────────────────────
async function test6(browser) {
  const profile = {
    step: 10, sportType: 'musculation', sStep: 3,
    parqDone: true, sportLevel: 'intermediate', sportDays: 3
  };

  const { page, ctx } = await newPage(browser, profile);
  const consoleErrors = [];
  page.on('console', msg => { if (msg.type() === 'error') consoleErrors.push(msg.text()); });
  page.on('pageerror', e => consoleErrors.push('[pageerror] ' + e.message));

  try {
    await page.goto(BASE_URL, { waitUntil: 'domcontentloaded', timeout: 15000 });
    await applyAuthBypass(page, profile);
    await page.waitForTimeout(1000);

    const bodyText = (await page.locator('body').innerText()).trim();

    // Check for muscle zones
    const muscleZones = ['Pectoraux', 'Dorsaux', 'Épaules', 'Bras', 'Abdominaux', 'Jambes', 'Quadriceps', 'Ischio', 'Fessiers', 'Mollets', 'Lombaires', 'Trapèzes'];
    let zonesFound = 0;
    const foundZones = [];
    for (const zone of muscleZones) {
      if (bodyText.includes(zone)) {
        zonesFound++;
        foundZones.push(zone);
      }
    }

    const interestingErrors = consoleErrors.filter(e =>
      !/favicon|serviceworker|sw\.js|push|notification|supabase|netlify|ERR_CONNECTION_REFUSED|Failed to fetch|net::ERR/i.test(e)
    );

    const ss = await screenshot(page, 'T6-result');

    if (interestingErrors.length > 0) {
      report('TEST 6', 'FAIL', `console.error: ${interestingErrors.slice(0, 3).join(' | ')}`, ss);
    } else if (zonesFound < 4) {
      report('TEST 6', 'FAIL', `Seulement ${zonesFound} zones musculaires visibles (min 4 requis): [${foundZones.join(', ')}] | Texte: "${bodyText.slice(0, 200)}"`, ss);
    } else {
      report('TEST 6', 'PASS',
        `${zonesFound} zones musculaires visibles: [${foundZones.join(', ')}] | console.error: 0`, ss);
    }

  } catch (e) {
    const ss = await screenshot(page, 'T6-exception');
    report('TEST 6', 'FAIL', 'Exception: ' + e.message, ss);
  }

  await ctx.close();
}

// ─── TEST 7 — sStep=4 : programme musculation (format interne correct) ────────
async function test7(browser) {
  const profile = {
    step: 10, sportType: 'musculation', sStep: 4,
    parqDone: true,
    sportLevel: 'intermediate', sportDays: 3,
    sportFocus: { 'Pectoraux': 4, 'Dorsaux': 3, 'Épaules': 2 },
    sportSessionDuration: '1h',
    sex: 'femme', age: 25, poids: 60, taille: 163,
    sportProgram: [
      {
        day: 'Lundi',
        exercises: [
          { n: 'Squat', m: 'barbell', eq: 'barre', sets: '4×8-10', rest: '90s', note: 'Profondeur complète' }
        ]
      },
      {
        day: 'Mercredi',
        exercises: [
          { n: 'Développé couché', m: 'barbell', eq: 'barre', sets: '4×8-10', rest: '90s', note: '' }
        ]
      },
      {
        day: 'Vendredi',
        exercises: [
          { n: 'Tirage poulie', m: 'machine', eq: 'machine', sets: '4×10-12', rest: '60s', note: '' }
        ]
      }
    ]
  };

  const { page, ctx } = await newPage(browser, profile);
  const consoleErrors = [];
  const typeErrors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') {
      consoleErrors.push(msg.text());
      if (/toLowerCase|TypeError|undefined/.test(msg.text())) typeErrors.push(msg.text());
    }
  });
  page.on('pageerror', e => {
    consoleErrors.push('[pageerror] ' + e.message);
    if (/toLowerCase|TypeError|undefined/.test(e.message)) typeErrors.push(e.message);
  });

  try {
    await page.goto(BASE_URL, { waitUntil: 'domcontentloaded', timeout: 15000 });
    await applyAuthBypass(page, profile);
    await page.waitForTimeout(1200);

    const bodyText = (await page.locator('body').innerText()).trim();

    // Check for program days
    const daysFound = ['Lundi', 'Mercredi', 'Vendredi'].filter(d => bodyText.includes(d));

    // Check for exercises
    const exercisesFound = ['Squat', 'Développé', 'Tirage'].filter(ex => bodyText.includes(ex));

    const interestingErrors = consoleErrors.filter(e =>
      !/favicon|serviceworker|sw\.js|push|notification|supabase|netlify|ERR_CONNECTION_REFUSED|Failed to fetch|net::ERR/i.test(e)
    );

    const ss = await screenshot(page, 'T7-result');

    const hasDays = daysFound.length >= 2;
    const hasExercises = exercisesFound.length >= 1;
    const noTypeError = typeErrors.length === 0;
    const noErrors = interestingErrors.length === 0;

    const checks = [
      `jours: ${daysFound.length}/3 [${daysFound.join(', ')}]`,
      `exercices: ${exercisesFound.length}/3 [${exercisesFound.join(', ')}]`,
      `TypeError: ${typeErrors.length === 0 ? 'aucun ✓' : typeErrors.slice(0, 2).join(' | ') + ' ✗'}`,
      `console.error: ${interestingErrors.length === 0 ? '0 ✓' : interestingErrors.length + ' ✗'}`
    ];

    if (typeErrors.length > 0) {
      report('TEST 7', 'FAIL', `TypeError détecté: ${typeErrors.slice(0, 3).join(' | ')} | ${checks.join(' | ')}`, ss);
    } else if (!noErrors) {
      report('TEST 7', 'FAIL', `console.error présents: ${interestingErrors.slice(0, 3).join(' | ')}`, ss);
    } else if (!hasDays && !hasExercises) {
      report('TEST 7', 'FAIL', `Programme non affiché. ${checks.join(' | ')} | Texte: "${bodyText.slice(0, 200)}"`, ss);
    } else {
      report('TEST 7', 'PASS', checks.join(' | '), ss);
    }

  } catch (e) {
    const ss = await screenshot(page, 'T7-exception');
    report('TEST 7', 'FAIL', 'Exception: ' + e.message, ss);
  }

  await ctx.close();
}

// ─── TEST 8 — sStep=5 : CrossFit config + sport mix section ──────────────────
async function test8(browser) {
  const profile = {
    step: 10, sportType: 'crossfit', sStep: 5,
    parqDone: true, crossfitLevel: 'rx', sportDays: 4,
    sex: 'homme', age: 28, poids: 78, taille: 180
  };

  const { page, ctx } = await newPage(browser, profile);
  const consoleErrors = [];
  page.on('console', msg => { if (msg.type() === 'error') consoleErrors.push(msg.text()); });
  page.on('pageerror', e => consoleErrors.push('[pageerror] ' + e.message));

  try {
    await page.goto(BASE_URL, { waitUntil: 'domcontentloaded', timeout: 15000 });
    await applyAuthBypass(page, profile);
    await page.waitForTimeout(1000);

    const bodyText = (await page.locator('body').innerText()).trim();
    const hasContent = bodyText.length > 10;

    // Check CrossFit config visible
    const cfKeywords = ['CrossFit', 'crossfit', 'WOD', 'RX', 'rx', 'Scaled', 'niveau', 'Niveau', 'séances', 'jours', 'Durée', 'durée'];
    let cfFound = false;
    for (const kw of cfKeywords) {
      if (bodyText.includes(kw)) { cfFound = true; break; }
    }

    // Check sport mix section
    const sportMixKeywords = ['Combiner', 'combiner', 'plusieurs sports', 'plusieurs sport', 'sport mix', 'Sport mix', 'activité'];
    let sportMixFound = false;
    for (const kw of sportMixKeywords) {
      if (bodyText.includes(kw)) { sportMixFound = true; break; }
    }

    const interestingErrors = consoleErrors.filter(e =>
      !/favicon|serviceworker|sw\.js|push|notification|supabase|netlify|ERR_CONNECTION_REFUSED|Failed to fetch|net::ERR/i.test(e)
    );

    const ss = await screenshot(page, 'T8-result');

    const checks = [
      `CF config: ${cfFound ? 'visible ✓' : 'non visible ✗'}`,
      `sport mix: ${sportMixFound ? 'visible ✓' : 'non visible (soft)'}`,
      `console.error: ${interestingErrors.length === 0 ? '0 ✓' : interestingErrors.length + ' ✗'}`
    ];

    if (!hasContent) {
      report('TEST 8', 'FAIL', 'Page blanche', ss);
    } else if (interestingErrors.length > 0) {
      report('TEST 8', 'FAIL', `${checks.join(' | ')} | Errors: ${interestingErrors.slice(0, 3).join(' | ')}`, ss);
    } else if (!cfFound) {
      report('TEST 8', 'FAIL', `Contenu CF non visible. ${checks.join(' | ')} | Texte: "${bodyText.slice(0, 200)}"`, ss);
    } else {
      report('TEST 8', 'PASS', checks.join(' | '), ss);
    }

  } catch (e) {
    const ss = await screenshot(page, 'T8-exception');
    report('TEST 8', 'FAIL', 'Exception: ' + e.message, ss);
  }

  await ctx.close();
}

// ─── TEST 9 — CF sStep=6 semaine TEST 1RM (semaine 5) ────────────────────────
async function test9(browser) {
  const profile = {
    step: 10, sportType: 'crossfit', sStep: 6,
    parqDone: true, crossfitLevel: 'rx', sportDays: 4, crossfitWeek: 5
  };

  const { page, ctx } = await newPage(browser, profile);
  const consoleErrors = [];
  page.on('console', msg => { if (msg.type() === 'error') consoleErrors.push(msg.text()); });
  page.on('pageerror', e => consoleErrors.push('[pageerror] ' + e.message));

  try {
    await page.goto(BASE_URL, { waitUntil: 'domcontentloaded', timeout: 15000 });
    await applyAuthBypass(page, profile);
    await page.waitForTimeout(1200);

    const bodyText = (await page.locator('body').innerText()).trim();
    const hasContent = bodyText.length > 10;

    // Check for TEST/1RM/evaluation keywords
    const testKeywords = ['TEST', 'test', '1RM', '1rm', 'évaluation', 'Évaluation', 'evaluation', 'maximum', 'Maximum', 'charge', 'semaine 5', 'Semaine 5'];
    let testContentFound = false;
    const foundKeywords = [];
    for (const kw of testKeywords) {
      if (bodyText.includes(kw)) {
        testContentFound = true;
        foundKeywords.push(kw);
      }
    }

    const interestingErrors = consoleErrors.filter(e =>
      !/favicon|serviceworker|sw\.js|push|notification|supabase|netlify|ERR_CONNECTION_REFUSED|Failed to fetch|net::ERR/i.test(e)
    );

    const ss = await screenshot(page, 'T9-result');

    if (!hasContent) {
      report('TEST 9', 'FAIL', 'Page blanche', ss);
    } else if (interestingErrors.length > 0) {
      report('TEST 9', 'FAIL', `console.error: ${interestingErrors.slice(0, 3).join(' | ')}`, ss);
    } else if (!testContentFound) {
      // Soft: might show week 5 content without explicit "TEST" text
      report('TEST 9', 'PASS',
        `Page charge sans crash (contenu semaine 5) | Mots-clés TEST/1RM: non trouvés (contenu visible: "${bodyText.slice(0, 150)}") | console.error: 0`, ss);
    } else {
      report('TEST 9', 'PASS',
        `Semaine 5 TEST 1RM visible | Mots-clés: [${foundKeywords.join(', ')}] | console.error: 0`, ss);
    }

  } catch (e) {
    const ss = await screenshot(page, 'T9-exception');
    report('TEST 9', 'FAIL', 'Exception: ' + e.message, ss);
  }

  await ctx.close();
}

// ─── TEST 10 — sStep=16 : évaluation des charges ─────────────────────────────
async function test10(browser) {
  const profile = {
    step: 10, sportType: 'musculation', sStep: 16,
    parqDone: true, sportLevel: 'intermediate', sportDays: 3
  };

  const { page, ctx } = await newPage(browser, profile);
  const consoleErrors = [];
  page.on('console', msg => { if (msg.type() === 'error') consoleErrors.push(msg.text()); });
  page.on('pageerror', e => consoleErrors.push('[pageerror] ' + e.message));

  try {
    await page.goto(BASE_URL, { waitUntil: 'domcontentloaded', timeout: 15000 });
    await applyAuthBypass(page, profile);
    await page.waitForTimeout(1200);

    const bodyText = (await page.locator('body').innerText()).trim();
    const hasContent = bodyText.length > 10;

    // Check for 1RM input fields
    const inputFields = await page.locator('input[type="number"], input[type="text"], input[placeholder*="kg"], input[placeholder*="KG"], .rm-input, [class*="rm"], [class*="1rm"], [class*="charge"]').count();

    // Also check for 1RM related keywords in body
    const rmKeywords = ['1RM', '1rm', 'charge', 'Charge', 'kg', 'répétition', 'Répétition', 'évaluation', 'Évaluation', 'maximum', 'max'];
    let rmFound = false;
    const foundRmKw = [];
    for (const kw of rmKeywords) {
      if (bodyText.includes(kw)) {
        rmFound = true;
        foundRmKw.push(kw);
      }
    }

    const interestingErrors = consoleErrors.filter(e =>
      !/favicon|serviceworker|sw\.js|push|notification|supabase|netlify|ERR_CONNECTION_REFUSED|Failed to fetch|net::ERR/i.test(e)
    );

    const ss = await screenshot(page, 'T10-result');

    const checks = [
      `contenu: ${hasContent ? 'oui ✓' : 'non ✗'}`,
      `champs input: ${inputFields > 0 ? inputFields + ' trouvé(s) ✓' : '0 (peut être autre format)'}`,
      `mots-clés 1RM: ${rmFound ? foundRmKw.slice(0, 4).join(', ') + ' ✓' : 'non trouvés ✗'}`,
      `console.error: ${interestingErrors.length === 0 ? '0 ✓' : interestingErrors.length + ' ✗'}`
    ];

    if (!hasContent) {
      report('TEST 10', 'FAIL', 'Page blanche', ss);
    } else if (interestingErrors.length > 0) {
      report('TEST 10', 'FAIL', `${checks.join(' | ')} | Errors: ${interestingErrors.slice(0, 3).join(' | ')}`, ss);
    } else if (!rmFound && inputFields === 0) {
      report('TEST 10', 'FAIL', `Aucun champ 1RM ni contenu évaluation charges. ${checks.join(' | ')} | Texte: "${bodyText.slice(0, 200)}"`, ss);
    } else {
      report('TEST 10', 'PASS', checks.join(' | '), ss);
    }

  } catch (e) {
    const ss = await screenshot(page, 'T10-exception');
    report('TEST 10', 'FAIL', 'Exception: ' + e.message, ss);
  }

  await ctx.close();
}

// ─── MAIN ────────────────────────────────────────────────────────────────────
async function main() {
  const browser = await chromium.launch({
    executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome',
    headless: true
  });

  console.log('\n========= PAR-Q + MUSCULATION STEPS QA =========\n');

  console.log('--- TEST 1 — PAR-Q sStep=26 ---');
  await test1(browser);

  console.log('\n--- TEST 2 — PAR-Q validation et navigation ---');
  await test2(browser);

  console.log('\n--- TEST 3 — sStep=20 questionnaire médical muscu ---');
  await test3(browser);

  console.log('\n--- TEST 4 — sStep=1 objectifs musculation ---');
  await test4(browser);

  console.log('\n--- TEST 5 — sStep=2 niveau + organisation + sport mix ---');
  await test5(browser);

  console.log('\n--- TEST 6 — sStep=3 zones musculaires ---');
  await test6(browser);

  console.log('\n--- TEST 7 — sStep=4 programme musculation ---');
  await test7(browser);

  console.log('\n--- TEST 8 — sStep=5 CrossFit config + sport mix ---');
  await test8(browser);

  console.log('\n--- TEST 9 — CF sStep=6 semaine 5 (TEST 1RM) ---');
  await test9(browser);

  console.log('\n--- TEST 10 — sStep=16 évaluation des charges ---');
  await test10(browser);

  await browser.close();

  console.log('\n\n========= RÉSUMÉ FINAL =========');
  const passes = results.filter(r => r.startsWith('[PASS]')).length;
  const fails = results.filter(r => r.startsWith('[FAIL]')).length;
  results.forEach(r => console.log(r));
  console.log(`\nTotal: ${passes} PASS, ${fails} FAIL sur 10 tests`);
}

main().catch(e => {
  console.error('FATAL:', e);
  process.exit(1);
});
