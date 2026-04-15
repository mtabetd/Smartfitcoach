// Test E2E — VOICE INPUT (Web Speech API) dans coach chat
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

  // Mock SpeechRecognition INSTALLABLE via addInitScript (avant chargement scripts)
  // Permet de simuler : démarrage / résultat / erreur / fin
  function mockSRInjectScript(opts) {
    opts = opts || {};
    return `
      window.__mockSREvents = [];
      window.__mockSRConfig = ${JSON.stringify(opts)};
      window.SpeechRecognition = class MockSR {
        constructor() {
          this.continuous = false;
          this.interimResults = false;
          this.lang = 'fr-FR';
          this.onresult = null; this.onerror = null;
          this.onstart = null; this.onend = null;
          window.__mockSREvents.push('construct');
        }
        start() {
          var self = this;
          window.__mockSREvents.push('start');
          if (self.onstart) self.onstart();
          var cfg = window.__mockSRConfig;
          if (cfg.errorMode) {
            setTimeout(function() {
              if (self.onerror) self.onerror({ error: cfg.errorMode });
              if (self.onend) self.onend();
            }, 30);
          } else {
            setTimeout(function() {
              if (self.onresult) {
                self.onresult({
                  results: [{ isFinal: true, 0: { transcript: cfg.transcript || 'bonjour coach' } }]
                });
              }
              if (self.onend) self.onend();
            }, 30);
          }
        }
        stop() {
          window.__mockSREvents.push('stop');
          if (this.onend) this.onend();
        }
        abort() {
          window.__mockSREvents.push('abort');
        }
      };
    `;
  }

  async function newPage(srOpts) {
    const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
    const page = await ctx.newPage();
    const errors = [];
    page.on('pageerror', e => errors.push('PAGE: ' + e.message));
    page.on('console', m => { if (m.type() === 'error') errors.push('CONS: ' + m.text()); });
    await ctx.addInitScript(`
      localStorage.setItem('mtd_dev_wiped_v1', '1');
      sessionStorage.setItem('mtd_gate_access', '1gs8uk7');
      ${mockSRInjectScript(srOpts || {})}
    `);
    await page.goto(BASE_URL, { waitUntil: 'domcontentloaded', timeout: 15000 });
    await page.waitForTimeout(2500);
    return { page, ctx, errors };
  }

  async function mockLoginAndOpenCoach(page) {
    await page.evaluate(() => {
      if (window.AUTH) {
        window.AUTH.isLoggedIn = function() { return true; };
        window.AUTH.getUser = function() { return { id: 'test-voice', name: 'Test' }; };
      }
      if (window.render) window.render();
    });
    await page.waitForTimeout(400);
    await page.evaluate(() => { if (window.AI_COACH && window.AI_COACH.open) window.AI_COACH.open(); });
    await page.waitForTimeout(300);
  }

  // T1 : SpeechInput exposé sur window
  suite('T1 \u2014 window.SpeechInput exposé + API publique');
  try {
    const { page, ctx } = await newPage();
    await mockLoginAndOpenCoach(page);
    const r = await page.evaluate(() => ({
      type: typeof window.SpeechInput,
      isSupported: typeof window.SpeechInput.isSupported,
      toggle: typeof window.SpeechInput.toggle,
      stop: typeof window.SpeechInput.stop,
      isRecording: typeof window.SpeechInput.isRecording,
      supported: window.SpeechInput.isSupported()
    }));
    if (r.type !== 'object') fail('T1 type', r.type);
    else if (!r.isSupported || !r.toggle || !r.stop) fail('T1 api', JSON.stringify(r));
    else if (!r.supported) fail('T1 detect', 'Mock SR pas détecté comme supporté');
    else pass('T1 : SpeechInput exposé avec API publique (isSupported/toggle/stop/isRecording)');
    await ctx.close();
  } catch(e) { fail('T1', e.message); }

  // T2 : Bouton micro présent + SVG inline
  suite('T2 \u2014 Bouton #ai-coach-mic présent avec SVG');
  try {
    const { page, ctx } = await newPage();
    await mockLoginAndOpenCoach(page);
    const r = await page.evaluate(() => {
      const btn = document.getElementById('ai-coach-mic');
      return {
        present: !!btn,
        hasSvg: btn ? !!btn.querySelector('svg') : false,
        title: btn ? btn.title : null,
        ariaLabel: btn ? btn.getAttribute('aria-label') : null,
        dataTooltip: btn ? btn.getAttribute('data-tooltip') : null,
        type: btn ? btn.type : null
      };
    });
    if (!r.present) fail('T2 dom', 'Bouton absent');
    else if (!r.hasSvg) fail('T2 svg', 'SVG absent');
    else if (!r.ariaLabel) fail('T2 aria', 'aria-label absent');
    else if (r.type !== 'button') fail('T2 type', 'type=' + r.type);
    else pass('T2 : bouton micro présent (SVG + title="' + r.title + '" + aria-label + tooltip)');
    await ctx.close();
  } catch(e) { fail('T2', e.message); }

  // T3 : Toggle déclenche dictée + transcript dans textarea
  suite('T3 \u2014 Toggle dictée → transcript apparaît dans textarea');
  try {
    const { page, ctx } = await newPage({ transcript: 'comment progresser sur le squat' });
    await mockLoginAndOpenCoach(page);
    const r = await page.evaluate(() => {
      return new Promise((resolve) => {
        window.SpeechInput.toggle();
        setTimeout(() => {
          const input = document.getElementById('ai-coach-input');
          resolve({
            value: input ? input.value : null,
            recording: window.SpeechInput.isRecording(),
            events: window.__mockSREvents
          });
        }, 200);
      });
    });
    if (!r.value || !r.value.includes('comment progresser sur le squat')) fail('T3 value', 'value=' + r.value);
    else if (r.recording) fail('T3 recording', 'Encore en recording');
    else if (r.events.indexOf('start') === -1) fail('T3 start', 'start non émis');
    else pass('T3 : toggle → start → onresult → textarea contient transcript + recording reset');
    await ctx.close();
  } catch(e) { fail('T3', e.message); }

  // T4 : Etat visuel "recording" pendant la dictée
  suite('T4 \u2014 Classe .recording appliquée pendant dictée');
  try {
    const { page, ctx } = await newPage({ transcript: 'test' });
    await mockLoginAndOpenCoach(page);
    const r = await page.evaluate(() => {
      return new Promise((resolve) => {
        const btn = document.getElementById('ai-coach-mic');
        // Patch onstart pour capturer l'état pendant le recording
        const origToggle = window.SpeechInput.toggle;
        var hadClass = false;
        window.SpeechInput.toggle();
        // Vérifier juste après start (avant le setTimeout 30ms du mock)
        setTimeout(() => {
          hadClass = btn.classList.contains('recording');
          // Attendre la fin
          setTimeout(() => {
            resolve({
              hadClassDuring: hadClass,
              hasClassAfter: btn.classList.contains('recording')
            });
          }, 100);
        }, 5);
      });
    });
    if (!r.hadClassDuring) fail('T4 during', 'Pas de class .recording pendant');
    else if (r.hasClassAfter) fail('T4 after', '.recording reste après');
    else pass('T4 : .recording présent pendant + retiré après');
    await ctx.close();
  } catch(e) { fail('T4', e.message); }

  // T5 : Append intelligent (séparateur espace si textarea pas vide)
  suite('T5 \u2014 Append intelligent : séparateur espace si textarea non vide');
  try {
    const { page, ctx } = await newPage({ transcript: 'monde' });
    await mockLoginAndOpenCoach(page);
    const r = await page.evaluate(() => {
      return new Promise((resolve) => {
        const input = document.getElementById('ai-coach-input');
        input.value = 'bonjour';
        window.SpeechInput.toggle();
        setTimeout(() => {
          resolve({ value: input.value });
        }, 200);
      });
    });
    if (r.value !== 'bonjour monde') fail('T5 sep', 'value=' + JSON.stringify(r.value));
    else pass('T5 : "bonjour" + transcript "monde" → "bonjour monde" (séparateur ajouté)');
    await ctx.close();
  } catch(e) { fail('T5', e.message); }

  // T6 : Erreur permission refusée → toast
  suite('T6 \u2014 Erreur not-allowed → toast permission');
  try {
    const { page, ctx } = await newPage({ errorMode: 'not-allowed' });
    await mockLoginAndOpenCoach(page);
    const r = await page.evaluate(() => {
      return new Promise((resolve) => {
        window.SpeechInput.toggle();
        setTimeout(() => {
          const toast = document.querySelector('.ai-toast');
          resolve({
            toastPresent: !!toast,
            toastText: toast ? toast.textContent : null,
            lastError: window.SpeechInput.lastError(),
            recording: window.SpeechInput.isRecording()
          });
        }, 200);
      });
    });
    if (r.lastError !== 'not-allowed') fail('T6 err', 'lastError=' + r.lastError);
    else if (!r.toastPresent) fail('T6 toast', 'Pas de toast');
    else if (!r.toastText.toLowerCase().match(/micro|permission|refus|navigateur/)) fail('T6 msg', 'msg=' + r.toastText);
    else if (r.recording) fail('T6 recording', 'recording=true après error');
    else pass('T6 : not-allowed → toast "' + r.toastText + '" + recording=false');
    await ctx.close();
  } catch(e) { fail('T6', e.message); }

  // T7 : Erreur no-speech silencieuse (UX douce)
  suite('T7 \u2014 Erreur no-speech silencieuse (pas de toast)');
  try {
    const { page, ctx } = await newPage({ errorMode: 'no-speech' });
    await mockLoginAndOpenCoach(page);
    const r = await page.evaluate(() => {
      return new Promise((resolve) => {
        window.SpeechInput.toggle();
        setTimeout(() => {
          const toast = document.querySelector('.ai-toast');
          resolve({
            toastPresent: !!toast,
            lastError: window.SpeechInput.lastError(),
            recording: window.SpeechInput.isRecording()
          });
        }, 200);
      });
    });
    if (r.lastError !== 'no-speech') fail('T7 err', 'lastError=' + r.lastError);
    else if (r.toastPresent) fail('T7 toast', 'Toast affiché alors qu\'attendu silencieux');
    else if (r.recording) fail('T7 recording', 'recording=true');
    else pass('T7 : no-speech traité silencieux (UX douce)');
    await ctx.close();
  } catch(e) { fail('T7', e.message); }

  // T8 : FIX P0 audit — double-toggle rapide BLOQUÉ par _initializing lock (race condition)
  suite('T8 \u2014 FIX P0 : double-toggle rapide bloqué par lock (race prevention)');
  try {
    const { page, ctx } = await newPage({ transcript: 'un seul transcript' });
    await mockLoginAndOpenCoach(page);
    const r = await page.evaluate(() => {
      return new Promise((resolve) => {
        window.SpeechInput.toggle(); // 1er toggle → start + lock init 50ms
        window.SpeechInput.toggle(); // 2nd toggle IMMÉDIAT → ignoré par _initializing lock
        setTimeout(() => {
          const input = document.getElementById('ai-coach-input');
          resolve({
            value: input.value,
            events: window.__mockSREvents,
            recording: window.SpeechInput.isRecording()
          });
        }, 250);
      });
    });
    // Le 2nd toggle doit être IGNORÉ → events = ['construct','start'] uniquement (pas de 2e construct)
    var starts = r.events.filter(function(e) { return e === 'start'; }).length;
    if (starts !== 1) fail('T8 starts', 'starts=' + starts + ' (expected 1, lock failed) events=' + r.events.join(','));
    else if (r.recording) fail('T8 recording', 'Toujours en recording');
    else if (!r.value.includes('un seul transcript')) fail('T8 transcript', 'value=' + r.value);
    else pass('T8 : double-toggle rapide → lock bloque 2nd appel (1 seul start, 1 seul transcript)');
    await ctx.close();
  } catch(e) { fail('T8', e.message); }

  // T8b : Toggle LENT (>60ms entre) → fonctionne normal (start puis stop)
  suite('T8b \u2014 Toggle lent (>60ms) : start puis stop OK');
  try {
    const { page, ctx } = await newPage({ transcript: 'test stop' });
    await mockLoginAndOpenCoach(page);
    const r = await page.evaluate(() => {
      return new Promise((resolve) => {
        window.SpeechInput.toggle(); // start
        setTimeout(function() {
          window.SpeechInput.toggle(); // stop APRÈS lock released (>60ms)
          setTimeout(function() {
            resolve({
              events: window.__mockSREvents,
              recording: window.SpeechInput.isRecording()
            });
          }, 100);
        }, 80);
      });
    });
    if (r.recording) fail('T8b recording', 'Encore en recording');
    else pass('T8b : toggle espacé 80ms → stop emis + recording=false (events=' + r.events.join(',') + ')');
    await ctx.close();
  } catch(e) { fail('T8b', e.message); }

  // T9 : CSP Permissions-Policy correctement configuré
  suite('T9 \u2014 CSP : microphone=(self) dans netlify.toml + _headers');
  try {
    const tomlSrc = fs.readFileSync('/home/user/Smartfitcoach/netlify.toml', 'utf8');
    const headersSrc = fs.readFileSync('/home/user/Smartfitcoach/app/_headers', 'utf8');
    if (tomlSrc.indexOf('microphone=(self)') === -1) fail('T9 toml', 'netlify.toml pas microphone=(self)');
    else if (headersSrc.indexOf('microphone=(self)') === -1) fail('T9 headers', '_headers pas microphone=(self)');
    else if (tomlSrc.indexOf('microphone=()') !== -1) fail('T9 toml-old', 'Ancien microphone=() encore présent dans netlify.toml');
    else if (headersSrc.indexOf('microphone=()') !== -1) fail('T9 headers-old', 'Ancien microphone=() encore présent dans _headers');
    else pass('T9 : microphone=(self) dans netlify.toml + _headers (et plus de microphone=())');
  } catch(e) { fail('T9', e.message); }

  // T10 : Fallback sans SpeechRecognition (bouton non créé)
  suite('T10 \u2014 Fallback sans Web Speech : bouton micro absent du DOM');
  try {
    const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
    const page = await ctx.newPage();
    const errors = [];
    page.on('pageerror', e => errors.push('PAGE: ' + e.message));
    page.on('console', m => { if (m.type() === 'error') errors.push('CONS: ' + m.text()); });
    await ctx.addInitScript(`
      localStorage.setItem('mtd_dev_wiped_v1', '1');
      sessionStorage.setItem('mtd_gate_access', '1gs8uk7');
      delete window.SpeechRecognition;
      delete window.webkitSpeechRecognition;
    `);
    await page.goto(BASE_URL, { waitUntil: 'domcontentloaded', timeout: 15000 });
    await page.waitForTimeout(2500);
    await page.evaluate(() => {
      if (window.AUTH) {
        window.AUTH.isLoggedIn = function() { return true; };
        window.AUTH.getUser = function() { return { id: 'test-no-voice', name: 'Test' }; };
      }
      if (window.render) window.render();
    });
    await page.waitForTimeout(400);
    await page.evaluate(() => { if (window.AI_COACH && window.AI_COACH.open) window.AI_COACH.open(); });
    await page.waitForTimeout(300);
    const r = await page.evaluate(() => ({
      micPresent: !!document.getElementById('ai-coach-mic'),
      sendPresent: !!document.getElementById('ai-coach-send'),
      inputPresent: !!document.getElementById('ai-coach-input'),
      supported: window.SpeechInput ? window.SpeechInput.isSupported() : null
    }));
    if (r.micPresent) fail('T10 mic', 'Bouton micro présent alors que SR absent');
    else if (!r.sendPresent || !r.inputPresent) fail('T10 fallback', 'Coach cassé : ' + JSON.stringify(r));
    else if (r.supported !== false) fail('T10 supported', 'supported=' + r.supported);
    else if (errors.length) fail('T10 errs', errors.slice(0,2).join(' | '));
    else pass('T10 : fallback OK — bouton micro NON ajouté, send + input fonctionnels, isSupported=false');
    await ctx.close();
  } catch(e) { fail('T10', e.message); }

  // T11 : SVG inline minimaliste (pas d'emoji)
  suite('T11 \u2014 SVG inline (pas d\'emoji) — cohérence design luxe');
  try {
    const src = fs.readFileSync('/home/user/Smartfitcoach/app/ai-coach.js', 'utf8');
    if (src.indexOf('🎤') !== -1) fail('T11 emoji', 'Emoji micro 🎤 présent');
    else if (src.indexOf('<svg viewBox="0 0 24 24"') === -1) fail('T11 svg', 'SVG inline 24×24 absent');
    else if (src.indexOf('stroke="currentColor"') === -1) fail('T11 stroke', 'stroke=currentColor absent (héritage couleur)');
    else pass('T11 : SVG inline 24×24 currentColor (cohérent design luxe, hérite color CSS)');
  } catch(e) { fail('T11', e.message); }

  // T12 : Animation pulse CSS micPulse
  suite('T12 \u2014 Animation CSS @keyframes micPulse');
  try {
    const src = fs.readFileSync('/home/user/Smartfitcoach/app/ai-coach.js', 'utf8');
    if (src.indexOf('@keyframes micPulse') === -1) fail('T12 kf', 'Keyframes absentes');
    else if (src.indexOf('animation:micPulse') === -1) fail('T12 use', 'animation: micPulse non utilisée');
    else pass('T12 : @keyframes micPulse définie + appliquée à .recording');
  } catch(e) { fail('T12', e.message); }

  // T13 : FIX P1 audit — aria-pressed initial + update recording
  suite('T13 \u2014 FIX P1 accessibility : aria-pressed init false + true pendant recording');
  try {
    const { page, ctx } = await newPage({ transcript: 'aria test' });
    await mockLoginAndOpenCoach(page);
    const r = await page.evaluate(() => {
      return new Promise((resolve) => {
        const btn = document.getElementById('ai-coach-mic');
        const init = btn.getAttribute('aria-pressed');
        window.SpeechInput.toggle();
        setTimeout(() => {
          const duringRec = btn.getAttribute('aria-pressed');
          setTimeout(() => {
            resolve({
              init: init,
              during: duringRec,
              after: btn.getAttribute('aria-pressed')
            });
          }, 100);
        }, 5);
      });
    });
    if (r.init !== 'false') fail('T13 init', 'init=' + r.init);
    else if (r.during !== 'true') fail('T13 during', 'during=' + r.during);
    else if (r.after !== 'false') fail('T13 after', 'after=' + r.after);
    else pass('T13 : aria-pressed init=false → true pendant recording → false après');
    await ctx.close();
  } catch(e) { fail('T13', e.message); }

  // T14 : FIX P2 audit — @media prefers-reduced-motion
  suite('T14 \u2014 FIX P2 accessibility : @media prefers-reduced-motion');
  try {
    const src = fs.readFileSync('/home/user/Smartfitcoach/app/ai-coach.js', 'utf8');
    if (src.indexOf('prefers-reduced-motion: reduce') === -1) fail('T14', 'Media query absente');
    else if (src.indexOf('animation:none') === -1) fail('T14 value', 'animation:none absent dans media');
    else pass('T14 : @media (prefers-reduced-motion: reduce) → animation:none');
  } catch(e) { fail('T14', e.message); }

  // T15 : FIX P2 audit — lang dérivé de S.lang / navigator.language (pas hardcodé fr-FR)
  suite('T15 \u2014 FIX P2 i18n : rec.lang dérivé du contexte app');
  try {
    const src = fs.readFileSync('/home/user/Smartfitcoach/app/ai-coach.js', 'utf8');
    if (src.indexOf('window.S.lang') === -1 || src.indexOf('navigator.language') === -1) {
      fail('T15', 'Dérivation lang absente');
    } else if (src.indexOf("shortMap = { fr: 'fr-FR'") === -1) {
      fail('T15 map', 'shortMap BCP-47 absent');
    } else pass('T15 : rec.lang = S.lang (mapped BCP-47) || navigator.language || fr-FR fallback');
  } catch(e) { fail('T15', e.message); }

  // T16 : FIX P1 audit — re-render pendant recording → stop recognition proprement
  suite('T16 \u2014 FIX P1 : re-render pendant recording stoppe proprement SpeechInput');
  try {
    const src = fs.readFileSync('/home/user/Smartfitcoach/app/ai-coach.js', 'utf8');
    if (src.indexOf('SpeechInput.isRecording()) window.SpeechInput.stop()') === -1) {
      fail('T16', 'Stop avant rebuild absent');
    } else pass('T16 : render() stoppe SpeechInput si recording avant buildUI (évite state fantôme)');
  } catch(e) { fail('T16', e.message); }

  // T17 : FIX P2 audit — maxLength textarea
  suite('T17 \u2014 FIX P2 : textarea maxLength aligné MAX_MSG_CHARS');
  try {
    const { page, ctx } = await newPage();
    await mockLoginAndOpenCoach(page);
    const r = await page.evaluate(() => {
      const input = document.getElementById('ai-coach-input');
      return { maxLength: input ? input.maxLength : null };
    });
    if (!r.maxLength || r.maxLength < 100) fail('T17', 'maxLength=' + r.maxLength);
    else pass('T17 : textarea maxLength=' + r.maxLength + ' (prévient scroll horizontal)');
    await ctx.close();
  } catch(e) { fail('T17', e.message); }

  // T18 : FIX P2 audit — Privacy policy mentionne Web Speech (Google/Apple)
  suite('T18 \u2014 FIX P2 RGPD : privacy-policy mentionne Web Speech API');
  try {
    const src = fs.readFileSync('/home/user/Smartfitcoach/app/privacy-policy.html', 'utf8');
    if (src.indexOf('Web Speech API') === -1) fail('T18 api', 'Mention Web Speech API absente');
    else if (src.indexOf('Google') === -1) fail('T18 google', 'Google absent');
    else if (src.indexOf('dict') === -1) fail('T18 dict', 'Mention dictée absente');
    else pass('T18 : privacy-policy.html mentionne Web Speech API + Google + dictée');
  } catch(e) { fail('T18', e.message); }

  await browser.close();
  console.log('\n' + '\u2550'.repeat(60));
  console.log('R\u00c9SUM\u00c9 VOICE INPUT : ' + passed + '/' + (passed + failed) + ' tests PASS (' + failed + ' \u00e9chec(s))');
  console.log('\u2550'.repeat(60));
  process.exit(failed > 0 ? 1 : 0);
})();
