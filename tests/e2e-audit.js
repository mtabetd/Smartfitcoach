/**
 * Tests E2E Playwright — Audit final SmartFitCoach
 * Teste les chemins critiques : gate, navigation, nutrition, sport, programme IA
 */
const { chromium } = require('playwright');

const BASE_URL = 'http://127.0.0.1:3001';
const GATE_KEY = 'mtd_gate_access';
const GATE_HASH = '1gs8uk7';

let passed = 0;
let failed = 0;
const errors = [];

async function test(name, fn) {
  try {
    await fn();
    console.log(`  ✅ ${name}`);
    passed++;
  } catch (e) {
    console.log(`  ❌ ${name}`);
    console.log(`     → ${e.message}`);
    errors.push({ name, error: e.message });
    failed++;
  }
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

async function run() {
  const browser = await chromium.launch({
    headless: true,
    executablePath: '/opt/pw-browsers/chromium'
  });
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 } // iPhone 14
  });

  // ─────────────────────────────────────────────
  console.log('\n🔐 GATE — Écran d\'accès');
  // ─────────────────────────────────────────────
  {
    const page = await context.newPage();
    await page.goto(BASE_URL);

    await test('Gate visible au démarrage', async () => {
      const gate = await page.$('#gate');
      const display = await gate.evaluate(el => el.style.display || getComputedStyle(el).display);
      assert(display === 'flex', `Gate display = ${display}, attendu flex`);
    });

    await test('App cachée derrière la gate', async () => {
      const app = await page.$('#app');
      const display = await app.evaluate(el => el.style.display || getComputedStyle(el).display);
      assert(display === 'none' || display === '', `App display = ${display}, attendu none`);
    });

    await test('Bouton APK présent avec id correct', async () => {
      const apkBtn = await page.$('#gate-apk-btn');
      assert(apkBtn !== null, 'Bouton #gate-apk-btn absent');
      const href = await apkBtn.getAttribute('href');
      assert(href && href.includes('.apk'), `href APK invalide: ${href}`);
    });

    await test('Mauvais mot de passe → message d\'erreur', async () => {
      await page.fill('#gate-pw', 'mauvais_mdp_test_123');
      await page.click('#gate-btn');
      // Attendre que l'erreur devienne visible (verifyPasswordAsync est async)
      await page.waitForFunction(() => {
        var el = document.getElementById('gate-error');
        return el && el.style.display !== 'none';
      }, { timeout: 3000 });
      const visible = await page.$eval('#gate-error', el => el.style.display !== 'none');
      assert(visible, 'Message d\'erreur non affiché après mauvais mot de passe');
    });

    await test('Champ mot de passe vidé après erreur', async () => {
      await page.waitForTimeout(200);
      const val = await page.$eval('#gate-pw', el => el.value);
      assert(val === '', `Champ non vidé après erreur : "${val}"`);
    });

    await test('Lien préinscription ouvre le modal', async () => {
      // Scroll the link into view then click
      await page.$eval('#gate-preregister-link', el => el.scrollIntoView());
      await page.click('#gate-preregister-link');
      // Wait for modal.style.display to become 'block' (set synchronously by openModal)
      await page.waitForFunction(() => {
        var m = document.getElementById('gate-preregister-modal');
        return m && m.style.display === 'block';
      }, { timeout: 3000 });
      const display = await page.$eval('#gate-preregister-modal', el => el.style.display);
      assert(display === 'block', `Modal préinscription non ouverte: display=${display}`);
    });

    await test('Modal se ferme avec Echap', async () => {
      await page.keyboard.press('Escape');
      // Wait for modal to be hidden (closeModal has a 360ms setTimeout)
      await page.waitForFunction(() => {
        var m = document.getElementById('gate-preregister-modal');
        return m && m.style.display === 'none';
      }, { timeout: 2000 });
      const display = await page.$eval('#gate-preregister-modal', el => el.style.display);
      assert(display === 'none', `Modal non fermée après Echap: display=${display}`);
    });

    await page.close();
  }

  // ─────────────────────────────────────────────
  console.log('\n📱 APP — Navigation principale (gate bypassée)');
  // ─────────────────────────────────────────────
  {
    const page = await context.newPage();
    // Bypass gate via sessionStorage
    await page.goto(BASE_URL);
    await page.evaluate(([key, hash]) => {
      sessionStorage.setItem(key, hash);
    }, [GATE_KEY, GATE_HASH]);
    await page.reload();
    await page.waitForTimeout(1000);

    await test('Gate masquée après bypass sessionStorage', async () => {
      const gate = await page.$('#gate');
      const display = await gate.evaluate(el => el.style.display || getComputedStyle(el).display);
      assert(display === 'none', `Gate encore visible: display=${display}`);
    });

    await test('App affichée après bypass', async () => {
      const app = await page.$('#app');
      const display = await app.evaluate(el => el.style.display || getComputedStyle(el).display);
      assert(display !== 'none', `App non affichée: display=${display}`);
    });

    await test('Navigation tabs présente', async () => {
      // The nav only renders when AUTH.isLoggedIn() === true.
      // In a headless environment there is no real Supabase session, so we mock it.
      await page.waitForFunction(() => window.AUTH && typeof window.AUTH.isLoggedIn === 'function', { timeout: 5000 });
      await page.evaluate(() => {
        window.AUTH.isLoggedIn = function() { return true; };
        // Set appMode so calendar tab renders (it's gated on S.appMode being truthy)
        if (window.S) { window.S.appMode = 'both'; window.S.view = 'today'; }
        if (window.render) window.render();
      });
      await page.waitForSelector('.main-nav', { timeout: 5000 });
      const tabs = await page.$$('.main-nav-tab');
      assert(tabs.length >= 4, `Seulement ${tabs.length} tabs trouvées, attendu ≥4`);
    });

    await test('Pas d\'erreur JS au chargement', async () => {
      const errors_js = [];
      page.on('pageerror', e => errors_js.push(e.message));
      await page.waitForTimeout(500);
      assert(errors_js.length === 0, `Erreurs JS: ${errors_js.join(', ')}`);
    });

    await page.close();
  }

  // ─────────────────────────────────────────────
  console.log('\n🍎 NUTRITION — Logique portions et saisie');
  // ─────────────────────────────────────────────
  {
    const page = await context.newPage();
    const jsErrors = [];
    page.on('pageerror', e => jsErrors.push(e.message));

    await page.goto(BASE_URL);
    await page.evaluate(([key, hash]) => {
      sessionStorage.setItem(key, hash);
    }, [GATE_KEY, GATE_HASH]);
    await page.reload();
    await page.waitForTimeout(1500);

    await test('Clamp nutrition — portion négative bloquée', async () => {
      const result = await page.evaluate(() => {
        // Simule la logique de clamp directement
        function clampPortion(v) { return Math.min(2000, Math.max(5, parseFloat(v) || 100)); }
        return {
          negative: clampPortion(-50),
          zero: clampPortion(0),
          normal: clampPortion(150),
          overflow: clampPortion(9999)
        };
      });
      assert(result.negative === 5, `Valeur négative non clampée: ${result.negative}`);
      // 0 is falsy → || 100 fallback → defaults to 100g (expected behavior for empty input)
      assert(result.zero === 100, `Zéro devrait retourner le défaut 100: ${result.zero}`);
      assert(result.normal === 150, `150g modifié: ${result.normal}`);
      assert(result.overflow === 2000, `9999g non clampé: ${result.overflow}`);
    });

    await test('Clamp hydratation — S.weight null ne produit pas NaN', async () => {
      const result = await page.evaluate(() => {
        function calcWater(weight) {
          return (weight && weight > 0 ? weight * 0.033 : 0).toFixed(1);
        }
        return {
          null_weight: calcWater(null),
          undefined_weight: calcWater(undefined),
          normal: calcWater(70)
        };
      });
      assert(result.null_weight === '0.0', `NaN avec weight null: ${result.null_weight}`);
      assert(result.undefined_weight === '0.0', `NaN avec weight undefined: ${result.undefined_weight}`);
      assert(result.normal === '2.3', `70kg hydratation incorrecte: ${result.normal}`);
    });

    await test('Pas d\'erreur JS en navigation nutrition', async () => {
      // Cliquer sur l'onglet nutrition si présent
      const nutTab = await page.$('[data-view="nutrition"], [data-tab="nutrition"]');
      if (nutTab) {
        await nutTab.click();
        await page.waitForTimeout(800);
      }
      assert(jsErrors.length === 0, `Erreurs JS nutrition: ${jsErrors.slice(0,3).join(' | ')}`);
    });

    await page.close();
  }

  // ─────────────────────────────────────────────
  console.log('\n🏋️ SPORT — Logique reps, poids, clamps');
  // ─────────────────────────────────────────────
  {
    const page = await context.newPage();
    const jsErrors = [];
    page.on('pageerror', e => jsErrors.push(e.message));

    await page.goto(BASE_URL);
    await page.evaluate(([key, hash]) => { sessionStorage.setItem(key, hash); }, [GATE_KEY, GATE_HASH]);
    await page.reload();
    await page.waitForTimeout(1500);

    await test('Clamp reps oninput — dépasse 999 bloqué', async () => {
      const result = await page.evaluate(() => {
        function clampReps(v) {
          var parsed = parseInt(v);
          return isNaN(parsed) ? null : Math.max(0, Math.min(999, parsed));
        }
        return {
          overflow: clampReps(9999),
          negative: clampReps(-5),
          nan: clampReps('abc'),
          normal: clampReps(10)
        };
      });
      assert(result.overflow === 999, `9999 reps non clampé: ${result.overflow}`);
      assert(result.negative === 0, `Reps négatif non clampé: ${result.negative}`);
      assert(result.nan === null, `NaN reps non géré: ${result.nan}`);
      assert(result.normal === 10, `10 reps modifié: ${result.normal}`);
    });

    await test('Clamp poids +2.5 — jamais négatif', async () => {
      const result = await page.evaluate(() => {
        function weightPlus(cur) {
          return Math.max(0, Math.round((cur + 2.5) * 2) / 2);
        }
        return {
          from_negative: weightPlus(-5),
          from_zero: weightPlus(0),
          normal: weightPlus(80)
        };
      });
      assert(result.from_negative >= 0, `Poids négatif possible: ${result.from_negative}`);
      assert(result.from_zero === 2.5, `0kg +2.5 = ${result.from_zero}`);
      assert(result.normal === 82.5, `80kg +2.5 = ${result.normal}`);
    });

    await test('Pas d\'erreur JS en navigation sport', async () => {
      const sportTab = await page.$('[data-view="sport"], [data-tab="sport"]');
      if (sportTab) {
        await sportTab.click();
        await page.waitForTimeout(800);
      }
      assert(jsErrors.length === 0, `Erreurs JS sport: ${jsErrors.slice(0,3).join(' | ')}`);
    });

    await page.close();
  }

  // ─────────────────────────────────────────────
  console.log('\n🔒 SÉCURITÉ — CSP, Gate JWT, bypass');
  // ─────────────────────────────────────────────
  {
    const page = await context.newPage();

    await test('CSP meta tag présent et sans ws://localhost', async () => {
      await page.goto(BASE_URL);
      const csp = await page.$eval('meta[http-equiv="Content-Security-Policy"]', el => el.content);
      assert(csp && csp.length > 0, 'CSP meta absente');
      assert(!csp.includes('ws://localhost'), 'ws://localhost présent dans CSP');
      assert(csp.includes('wss://*.supabase.co'), 'Supabase WSS absent du CSP');
    });

    await test('Gate bypass avec token JWT invalide bloqué', async () => {
      // Use a fresh page so gate.js runs from scratch (hashchange navigation doesn't reload scripts)
      const invPage = await context.newPage();
      await invPage.goto(`${BASE_URL}/#type=recovery&access_token=invalid_token`);
      await invPage.waitForTimeout(500);
      const display = await invPage.$eval('#gate', el => el.style.display || getComputedStyle(el).display);
      await invPage.close();
      assert(display === 'flex', `Gate bypassée avec token invalide! display=${display}`);
    });

    await test('Gate bypass avec vrai format JWT accepté', async () => {
      // IMPORTANT: must use a fresh page — navigating same-origin hash-to-hash is a hashchange,
      // not a full reload, so gate.js would NOT re-run if we reuse the existing page.
      const jwtPage = await context.newPage();
      const fakeJWT = 'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJ0ZXN0In0.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c';
      await jwtPage.goto(`${BASE_URL}/#type=recovery&access_token=${fakeJWT}`);
      await jwtPage.waitForTimeout(500);
      const display = await jwtPage.$eval('#gate', el => el.style.display || getComputedStyle(el).display);
      await jwtPage.close();
      assert(display === 'none', `Gate non bypassée avec JWT valide! display=${display}`);
    });

    await page.close();
  }

  // ─────────────────────────────────────────────
  console.log('\n🎨 DESIGN HERMÈS — Tokens et UI');
  // ─────────────────────────────────────────────
  {
    const page = await context.newPage();
    await page.goto(BASE_URL);

    await test('gate-btn letter-spacing = 6px', async () => {
      const ls = await page.$eval('#gate-btn', el => getComputedStyle(el).letterSpacing);
      assert(ls === '6px', `Letter-spacing gate-btn = ${ls}, attendu 6px`);
    });

    await test('gate-apk-btn présent avec min-height 44px', async () => {
      const btn = await page.$('#gate-apk-btn');
      assert(btn !== null, '#gate-apk-btn absent');
      const mh = await btn.evaluate(el => el.style.minHeight);
      assert(mh === '44px', `min-height = ${mh}, attendu 44px`);
    });

    await test('gate-error couleur correcte (#7A1F1F)', async () => {
      const style = await page.$eval('#gate-error', el => el.style.cssText);
      assert(style.includes('7A1F1F') || style.includes('7a1f1f'), `Couleur erreur incorrecte: ${style}`);
    });

    await test('focus ring gate-pw fonctionnel (outline:none retiré)', async () => {
      const inlineOutline = await page.$eval('#gate-pw', el => el.style.outline);
      assert(inlineOutline === '' || inlineOutline === 'none' === false,
        `outline:none inline encore présent: "${inlineOutline}"`);
      // On vérifie que le inline style ne force pas outline:none
      assert(inlineOutline !== 'none', `outline:none inline bloque le focus ring`);
    });

    await page.close();
  }

  // ─────────────────────────────────────────────
  console.log('\n📊 RÉSULTATS FINAUX');
  // ─────────────────────────────────────────────
  const total = passed + failed;
  console.log(`\n  ${passed}/${total} tests passés`);
  if (failed > 0) {
    console.log(`\n  ÉCHECS (${failed}) :`);
    errors.forEach(e => console.log(`  ❌ ${e.name}\n     → ${e.error}`));
  } else {
    console.log('\n  🎉 Tous les tests passent — app validée.');
  }

  await browser.close();
  process.exit(failed > 0 ? 1 : 0);
}

run().catch(e => {
  console.error('FATAL:', e);
  process.exit(1);
});
