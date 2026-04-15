// Test E2E — POLISH V3 (design luxe : tooltips premium, skeleton utilities, 380px)
const { chromium } = require('playwright');
const fs = require('fs');
const BASE_URL = 'http://127.0.0.1:45515';
const CHROMIUM_PATH = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';

(async () => {
  const browser = await chromium.launch({ headless: true, executablePath: CHROMIUM_PATH });
  let passed = 0, failed = 0;
  function pass(n) { console.log('  \u2713 ' + n); passed++; }
  function fail(n, d) { console.log('  \u2717 ' + n + '\n    ' + d); failed++; }
  function suite(n) { console.log('\n\u2550 ' + n + ' \u2550'); }

  async function newPage(viewport) {
    const ctx = await browser.newContext({ viewport: viewport || { width: 390, height: 844 } });
    const page = await ctx.newPage();
    const errors = [];
    page.on('pageerror', e => errors.push('PAGE: ' + e.message));
    page.on('console', m => { if (m.type() === 'error') errors.push('CONS: ' + m.text()); });
    await ctx.addInitScript(() => {
      localStorage.setItem('mtd_dev_wiped_v1', '1');
      sessionStorage.setItem('mtd_gate_access', '1gs8uk7');
    });
    await page.goto(BASE_URL, { waitUntil: 'domcontentloaded', timeout: 15000 });
    await page.waitForTimeout(2500);
    return { page, ctx, errors };
  }

  async function mockLoginAndRender(page) {
    await page.evaluate(() => {
      if (window.AUTH) {
        window.AUTH.isLoggedIn = function() { return true; };
        window.AUTH.getUser = function() { return { id: 'test-uid', name: 'Test' }; };
      }
      if (typeof window.render === 'function') window.render();
    });
    await page.waitForTimeout(400);
  }

  // T1 : data-tooltip premium sur 4 boutons coach actions
  suite('T1 \u2014 Coach actions : tooltips premium (data-tooltip)');
  try {
    const { page, ctx, errors } = await newPage();
    await mockLoginAndRender(page);
    const r = await page.evaluate(() => {
      window.AI_COACH.open();
      const msgs = document.getElementById('ai-coach-messages');
      const coachMsgs = msgs ? msgs.querySelectorAll('.ai-msg-coach') : [];
      if (!coachMsgs.length) return { error: 'no coach messages' };
      const lastMsg = coachMsgs[coachMsgs.length - 1];
      const actions = lastMsg.querySelectorAll('.ai-msg-actions button');
      return {
        btnCount: actions.length,
        tooltips: Array.from(actions).map(b => b.getAttribute('data-tooltip'))
      };
    });
    if (r.error) fail('T1 setup', r.error);
    else if (r.btnCount < 3) fail('T1 count', 'Seulement ' + r.btnCount + ' boutons');
    else if (r.tooltips.some(t => !t)) fail('T1 missing', 'Tooltip manquant : ' + JSON.stringify(r.tooltips));
    else if (errors.length) fail('T1 errs', errors.join(' | '));
    else pass('T1 : data-tooltip présent sur ' + r.btnCount + ' boutons coach — ' + r.tooltips.join(', '));
    await ctx.close();
  } catch(e) { fail('T1', e.message); }

  // T2 : Classes skeleton utilitaires définies
  suite('T2 \u2014 Skeleton utility classes dans CSS');
  try {
    const css = fs.readFileSync('/home/user/Smartfitcoach/app/premium-ui.css', 'utf8');
    const needed = ['.skeleton-line', '.skeleton-line-lg', '.skeleton-block', '.skeleton-card',
                    '.skeleton-w-20', '.skeleton-w-40', '.skeleton-w-60', '.skeleton-w-80', '.skeleton-w-100'];
    const missing = needed.filter(c => css.indexOf(c) === -1);
    if (missing.length) fail('T2 missing', 'Classes manquantes : ' + missing.join(', '));
    else pass('T2 : 9 classes utilitaires skeleton définies (line/block/card + w-20..100)');
  } catch(e) { fail('T2', e.message); }

  // T3 : Responsive 380px : letter-spacing h1/h2 + main-nav-tab padding
  suite('T3 \u2014 Responsive 380px : letter-spacing + padding main-nav');
  try {
    const css = fs.readFileSync('/home/user/Smartfitcoach/app/premium-ui.css', 'utf8');
    // Extraction du bloc @media (max-width: 380px)
    const m = css.match(/@media \(max-width:\s*380px\)\s*\{([\s\S]*?)\n\}/);
    if (!m) fail('T3 block', 'Bloc @media 380px absent');
    else {
      const block = m[1];
      if (block.indexOf('h1') === -1 || block.indexOf('letter-spacing') === -1) fail('T3 h1 ls', 'h1 letter-spacing absent du bloc');
      else if (block.indexOf('main-nav-tab') === -1) fail('T3 nav', '.main-nav-tab absent');
      else if (block.indexOf('ai-coach-input-area') === -1) fail('T3 coach', 'coach input-area absent');
      else pass('T3 : bloc 380px étendu avec h1/h2/nav/coach letter-spacing + padding');
    }
  } catch(e) { fail('T3', e.message); }

  // T4 : Tooltip system existant - hover produit un pseudo-élément visible
  suite('T4 \u2014 [data-tooltip]::after — style premium CSS');
  try {
    const css = fs.readFileSync('/home/user/Smartfitcoach/app/premium-ui.css', 'utf8');
    if (css.indexOf('[data-tooltip]::after') === -1) fail('T4 pseudo', '::after absent');
    else if (css.indexOf('[data-tooltip]:hover::after') === -1) fail('T4 hover', ':hover::after absent');
    else pass('T4 : [data-tooltip]::after + :hover::after défini (style premium global)');
  } catch(e) { fail('T4', e.message); }

  // T5 : Viewport 380 — rendu sans débordement + 0 erreur console
  suite('T5 \u2014 Rendering 380px sans overflow horizontal + 0 erreur');
  try {
    const { page, ctx, errors } = await newPage({ width: 380, height: 844 });
    await mockLoginAndRender(page);
    const r = await page.evaluate(() => {
      return {
        bodyW: document.body.scrollWidth,
        viewportW: window.innerWidth,
        hasOverflow: document.body.scrollWidth > window.innerWidth + 1
      };
    });
    if (r.hasOverflow) fail('T5 overflow', 'bodyW=' + r.bodyW + ' viewportW=' + r.viewportW);
    else if (errors.length) fail('T5 errs', errors.join(' | '));
    else pass('T5 : 380px rendu sans overflow horizontal (bodyW=' + r.bodyW + '/viewportW=' + r.viewportW + ')');
    await ctx.close();
  } catch(e) { fail('T5', e.message); }

  // T6 : Dark mode toggle — classes appliquées + pas d'erreur
  suite('T6 \u2014 Dark mode : toggle body.dark-mode sans crash');
  try {
    const { page, ctx, errors } = await newPage();
    const r = await page.evaluate(() => {
      document.body.classList.add('dark-mode');
      const bg = getComputedStyle(document.body).backgroundColor;
      const txt = getComputedStyle(document.body).color;
      const overlayStyleExists = Array.from(document.styleSheets).some(ss => {
        try {
          return Array.from(ss.cssRules).some(r => r.selectorText && r.selectorText.indexOf('body.dark-mode .modal-overlay') !== -1);
        } catch(e) { return false; }
      });
      return { bg: bg, txt: txt, overlayRule: overlayStyleExists };
    });
    if (!r.bg || r.bg.indexOf('rgb') === -1) fail('T6 bg', 'bg: ' + r.bg);
    else if (!r.overlayRule) fail('T6 overlay', 'Règle body.dark-mode .modal-overlay absente');
    else if (errors.length) fail('T6 errs', errors.join(' | '));
    else pass('T6 : dark-mode applique bg (' + r.bg + ') + règle overlay dark présente');
    await ctx.close();
  } catch(e) { fail('T6', e.message); }

  await browser.close();
  console.log('\n' + '\u2550'.repeat(60));
  console.log('R\u00c9SUM\u00c9 V3 : ' + passed + '/' + (passed + failed) + ' tests PASS (' + failed + ' \u00e9chec(s))');
  console.log('\u2550'.repeat(60));
  process.exit(failed > 0 ? 1 : 0);
})();
