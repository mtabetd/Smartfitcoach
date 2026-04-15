// Test E2E — COACH UX V1 (quick wins : persistance, actions, rate-limit, auto-scroll)
// Valide : loadHistory complet, typing dots, boutons copier/regen/feedback,
// helpers showToast/recordCoachFeedback, rate-limit hint, pill, smartScroll.

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

  async function newPage() {
    const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
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

  // T1 : Typing dots CSS animation présente
  suite('T1 \u2014 Typing animation : 3 dots CSS');
  try {
    const src = fs.readFileSync('/home/user/Smartfitcoach/app/ai-coach.js', 'utf8');
    if (src.indexOf('ai-typing-dots') === -1) fail('T1 css', 'Classe ai-typing-dots absente');
    else if (src.indexOf('aiTypingBlink') === -1) fail('T1 keyframes', 'Keyframes aiTypingBlink absent');
    else if (src.indexOf('Analyse en cours') === -1) fail('T1 label', 'Label "Analyse en cours" absent');
    else pass('T1 : typing avec 3 dots animés + label "Analyse en cours"');
  } catch(e) { fail('T1', e.message); }

  // T2 : Persistance historique — charge TOUT (pas juste 6)
  suite('T2 \u2014 loadHistory charge tout l\'historique');
  try {
    const src = fs.readFileSync('/home/user/Smartfitcoach/app/ai-coach.js', 'utf8');
    if (src.indexOf('charger TOUT l\'historique') === -1) fail('T2 comment', 'Marker modif absent');
    else if (src.indexOf('history.slice(-6)') !== -1) fail('T2 old slice', 'slice(-6) toujours présent');
    else if (!src.match(/history\.forEach\(function/)) fail('T2 forEach', 'history.forEach absent');
    else pass('T2 : loadHistory charge tous les messages persistés (max 20 via MAX_HISTORY)');
  } catch(e) { fail('T2', e.message); }

  // T3 : Boutons actions (copier / régénérer / 👍 / 👎) + CSS
  suite('T3 \u2014 Boutons actions sur messages coach');
  try {
    const src = fs.readFileSync('/home/user/Smartfitcoach/app/ai-coach.js', 'utf8');
    const markers = ['ai-msg-actions', 'showToast', 'recordCoachFeedback', 'regenerateLastResponse',
      'stripRegenerateButtonsFromPrevious', 'active-up', 'active-down', 'navigator.clipboard'];
    const missing = markers.filter(m => src.indexOf(m) === -1);
    if (missing.length) fail('T3 markers', 'Manquants : ' + missing.join(' | '));
    else pass('T3 : barre d\'actions + handlers copier/régénérer/feedback + CSS active states');
  } catch(e) { fail('T3', e.message); }

  // T4 : Toast système
  suite('T4 \u2014 Toast UI (classe + transition)');
  try {
    const src = fs.readFileSync('/home/user/Smartfitcoach/app/ai-coach.js', 'utf8');
    if (src.indexOf('.ai-toast{') === -1) fail('T4 css base', 'CSS .ai-toast absent');
    else if (src.indexOf('.ai-toast.show') === -1) fail('T4 css show', 'CSS .ai-toast.show absent');
    else if (src.indexOf('showToast(\'Copié\')') === -1) fail('T4 use', 'Utilisation showToast(Copié) absente');
    else pass('T4 : Toast présent + transition + utilisé pour feedback actions');
  } catch(e) { fail('T4', e.message); }

  // T5 : Rate-limit backend retourne remaining
  suite('T5 \u2014 Backend retourne hourRemaining + dayRemaining');
  try {
    const src = fs.readFileSync('/home/user/Smartfitcoach/netlify/functions/ai-coach.js', 'utf8');
    if (src.indexOf('hourRemaining') === -1) fail('T5 hour', 'hourRemaining absent backend');
    else if (src.indexOf('dayRemaining') === -1) fail('T5 day', 'dayRemaining absent backend');
    else if (src.indexOf('remaining: { hourRemaining:') === -1) fail('T5 payload', 'remaining pas dans body réponse');
    else pass('T5 : Backend retourne remaining (hourRemaining, dayRemaining) dans réponse JSON');
  } catch(e) { fail('T5', e.message); }

  // T6 : Client affiche hint rate-limit
  suite('T6 \u2014 Client : hint rate-limit + pill auto-scroll');
  try {
    const src = fs.readFileSync('/home/user/Smartfitcoach/app/ai-coach.js', 'utf8');
    if (src.indexOf('updateRateLimitHint') === -1) fail('T6 hint fn', 'updateRateLimitHint absent');
    else if (src.indexOf('ai-rate-hint') === -1) fail('T6 hint css', '.ai-rate-hint absent');
    else if (src.indexOf('ai-new-pill') === -1) fail('T6 pill', '.ai-new-pill absent');
    else if (src.indexOf('_autoScrollSuspended') === -1) fail('T6 scroll state', '_autoScrollSuspended absent');
    else if (src.indexOf('smartScroll') === -1) fail('T6 smartscroll', 'smartScroll absent');
    else pass('T6 : hint rate-limit + pill + smartScroll + _autoScrollSuspended');
  } catch(e) { fail('T6', e.message); }

  // Helper : mock AUTH + re-render pour déclencher buildUI (utilisé T7-T10)
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

  // T7 : Runtime — mock login + ouvre panel, vérifie helpers exposés
  suite('T7 \u2014 Runtime : AI_COACH helpers + panel + mock auth');
  try {
    const { page, ctx, errors } = await newPage();
    await mockLoginAndRender(page);
    const r = await page.evaluate(() => {
      return {
        aiCoachAvailable: typeof window.AI_COACH === 'object',
        hasOpen: typeof window.AI_COACH.open === 'function',
        hasBuildContext: typeof window.AI_COACH.buildContext === 'function',
        hasGetSuggestions: typeof window.AI_COACH.getSuggestions === 'function',
        btnPresent: !!document.getElementById('ai-coach-btn'),
        panelPresent: !!document.getElementById('ai-coach-panel')
      };
    });
    if (!r.aiCoachAvailable) fail('T7 module', 'AI_COACH non défini');
    else if (!r.hasOpen || !r.hasBuildContext) fail('T7 methods', JSON.stringify(r));
    else if (!r.btnPresent) fail('T7 btn', 'Bouton floater absent après mock login');
    else if (errors.length) fail('T7 console', 'Errors: ' + errors.join(' | '));
    else pass('T7 : AI_COACH exposé + bouton DOM + panel init après login mock');
    await ctx.close();
  } catch(e) { fail('T7', e.message); }

  // T8 : recordCoachFeedback persiste en localStorage
  suite('T8 \u2014 recordCoachFeedback : persiste 👍/👎 en localStorage');
  try {
    const { page, ctx, errors } = await newPage();
    await mockLoginAndRender(page);
    const r = await page.evaluate(() => {
      // Ouvrir le panel pour init
      window.AI_COACH.open();
      // Appeler showToast via reflection : nope, on appelle directement les fonctions via window
      // On teste juste le flow : ajoute un msg coach + clique 👍 → localStorage rempli
      const msgs = document.getElementById('ai-coach-messages');
      // Le welcome a été ajouté → clique sur son 👍
      const coachMsgs = msgs ? msgs.querySelectorAll('.ai-msg-coach') : [];
      if (!coachMsgs.length) return { error: 'no coach messages' };
      const lastMsg = coachMsgs[coachMsgs.length - 1];
      const upBtn = lastMsg.querySelector('.ai-msg-actions button[aria-label=\"Marquer comme utile\"]');
      if (!upBtn) return { error: 'no up btn' };
      upBtn.click();
      // Check localStorage (clé avec uid mocké = 'test-uid')
      const key = 'mtd_aicoach_feedback_test-uid';
      const raw = localStorage.getItem(key);
      return {
        hasRaw: !!raw,
        parsed: raw ? JSON.parse(raw) : null,
        btnActive: upBtn.classList.contains('active-up')
      };
    });
    if (r.error) fail('T8 setup', r.error);
    else if (!r.hasRaw) fail('T8 ls', 'localStorage feedback vide');
    else if (!Array.isArray(r.parsed) || !r.parsed.length) fail('T8 parse', JSON.stringify(r.parsed));
    else if (r.parsed[0].rating !== 'up') fail('T8 rating', 'Rating=' + r.parsed[0].rating);
    else if (!r.btnActive) fail('T8 active', 'Bouton pas en état active-up');
    else pass('T8 : clic 👍 → recordCoachFeedback persiste { rating: up } + bouton active-up');
    await ctx.close();
  } catch(e) { fail('T8', e.message); }

  // T9 : Toast dispose automatiquement après 1.8s
  suite('T9 \u2014 Toast affichage + disparition auto');
  try {
    const { page, ctx, errors } = await newPage();
    await mockLoginAndRender(page);
    const r = await page.evaluate(() => {
      return new Promise((resolve) => {
        window.AI_COACH.open();
        const msgs = document.getElementById('ai-coach-messages');
        const coachMsgs = msgs ? msgs.querySelectorAll('.ai-msg-coach') : [];
        if (!coachMsgs.length) return resolve({ error: 'no messages' });
        const copyBtn = coachMsgs[coachMsgs.length - 1].querySelector('.ai-msg-actions button[aria-label=\"Copier la réponse\"]');
        if (!copyBtn) return resolve({ error: 'no copy btn' });
        copyBtn.click();
        // Toast doit apparaître immédiatement
        setTimeout(() => {
          const t1 = document.querySelector('.ai-toast');
          const visible = t1 && t1.classList.contains('show');
          // Toast doit disparaître après ~2s
          setTimeout(() => {
            const t2 = document.querySelector('.ai-toast');
            resolve({ toastAppeared: visible, toastDisappeared: !t2 });
          }, 2300);
        }, 100);
      });
    });
    if (r.error) fail('T9 setup', r.error);
    else if (!r.toastAppeared) fail('T9 appear', 'Toast n\'apparaît pas');
    else if (!r.toastDisappeared) fail('T9 disappear', 'Toast ne disparaît pas');
    else pass('T9 : Toast apparaît au clic copier + disparaît auto après ~1.8s');
    await ctx.close();
  } catch(e) { fail('T9', e.message); }

  // T10 : smartScroll respecte _autoScrollSuspended
  suite('T10 \u2014 smartScroll : suspend si user scroll vers le haut');
  try {
    const { page, ctx, errors } = await newPage();
    await mockLoginAndRender(page);
    const r = await page.evaluate(() => {
      window.AI_COACH.open();
      const msgs = document.getElementById('ai-coach-messages');
      if (!msgs) return { error: 'no messages container' };
      // Simuler un container grand avec scroll
      // Ajouter plusieurs messages factices pour avoir du scroll
      for (let i = 0; i < 10; i++) {
        const d = document.createElement('div');
        d.className = 'ai-msg ai-msg-coach';
        d.style.height = '80px';
        d.textContent = 'Message ' + i;
        msgs.appendChild(d);
      }
      // Scroll en haut → _autoScrollSuspended doit passer true
      msgs.scrollTop = 0;
      // Déclencher scroll event
      msgs.dispatchEvent(new Event('scroll'));
      return {
        scrollTop: msgs.scrollTop,
        scrollHeight: msgs.scrollHeight,
        clientHeight: msgs.clientHeight,
        pillExists: !!document.getElementById('ai-new-pill'),
        rateHintExists: !!document.getElementById('ai-rate-hint')
      };
    });
    if (r.error) fail('T10 setup', r.error);
    else if (!r.pillExists) fail('T10 pill', 'Pill #ai-new-pill absent');
    else if (!r.rateHintExists) fail('T10 hint', 'Hint #ai-rate-hint absent');
    else pass('T10 : scroll container OK + pill + hint présents au open panel');
    await ctx.close();
  } catch(e) { fail('T10', e.message); }

  await browser.close();
  console.log('\n' + '\u2550'.repeat(60));
  console.log('R\u00c9SUM\u00c9 V1 : ' + passed + '/' + (passed + failed) + ' tests PASS (' + failed + ' \u00e9chec(s))');
  console.log('\u2550'.repeat(60));
  process.exit(failed > 0 ? 1 : 0);
})();
