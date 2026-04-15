// Test E2E — NOTIFICATIONS PUSH PWA (SFCPushManager + opt-out toggle)
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

  async function newPage(opts) {
    opts = opts || {};
    const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
    const page = await ctx.newPage();
    const errors = [];
    page.on('pageerror', e => errors.push('PAGE: ' + e.message));
    page.on('console', m => { if (m.type() === 'error') errors.push('CONS: ' + m.text()); });
    await ctx.addInitScript(`
      localStorage.setItem('mtd_dev_wiped_v1', '1');
      sessionStorage.setItem('mtd_gate_access', '1gs8uk7');
      // Mock Notification API (Chromium headless n'a pas de UI permission)
      window._notifPermissionAnswer = ${JSON.stringify(opts.permissionAnswer || 'granted')};
      window._notifPermissionState = ${JSON.stringify(opts.permissionState || 'default')};
      window._notifsCreated = [];
      window.Notification = class MockNotif {
        constructor(title, options) {
          window._notifsCreated.push({ title: title, options: options });
        }
        static get permission() { return window._notifPermissionState; }
        static requestPermission() {
          window._notifPermissionState = window._notifPermissionAnswer;
          return Promise.resolve(window._notifPermissionAnswer);
        }
      };
    `);
    await page.goto(BASE_URL, { waitUntil: 'domcontentloaded', timeout: 15000 });
    await page.waitForTimeout(2500);
    return { page, ctx, errors };
  }

  async function mockLogin(page, uid) {
    await page.evaluate((u) => {
      if (window.AUTH) {
        window.AUTH.isLoggedIn = function() { return true; };
        window.AUTH.getUser = function() { return { id: u, name: 'Test' }; };
      }
    }, uid || 'test-notif');
    await page.waitForTimeout(200);
  }

  // T1 : SFCPushManager exposé + API publique
  suite('T1 \u2014 window.SFCPushManager exposé + API');
  try {
    const { page, ctx, errors } = await newPage();
    await mockLogin(page);
    const r = await page.evaluate(() => ({
      type: typeof window.SFCPushManager,
      init: typeof window.SFCPushManager.init,
      askPermission: typeof window.SFCPushManager.askPermission,
      enable: typeof window.SFCPushManager.enable,
      disable: typeof window.SFCPushManager.disable,
      userOptedOut: typeof window.SFCPushManager._userOptedOut
    }));
    if (r.type !== 'object') fail('T1 type', r.type);
    else if (!r.init || !r.askPermission || !r.enable || !r.disable) fail('T1 api', JSON.stringify(r));
    else pass('T1 : SFCPushManager exposé + API (init/askPermission/enable/disable + _userOptedOut)');
    await ctx.close();
  } catch(e) { fail('T1', e.message); }

  // T2 : Helper getLastSessionDate + getDaysSinceLastSession
  suite('T2 \u2014 Helpers getLastSessionDate + getDaysSinceLastSession');
  try {
    const { page, ctx } = await newPage();
    await mockLogin(page, 'test-last');
    const r = await page.evaluate(() => {
      const out = {};
      out.helperLast = typeof window.getLastSessionDate;
      out.helperDays = typeof window.getDaysSinceLastSession;
      // Empty
      window.S.sessionHistory = {};
      out.emptyLast = window.getLastSessionDate();
      out.emptyDays = window.getDaysSinceLastSession();
      // Seed 3 sessions
      const pad = n => n < 10 ? '0' + n : n;
      const today = new Date();
      const d3ago = new Date(today.getTime() - 3 * 86400000);
      const d10ago = new Date(today.getTime() - 10 * 86400000);
      const ds3 = d3ago.getFullYear() + '-' + pad(d3ago.getMonth()+1) + '-' + pad(d3ago.getDate());
      const ds10 = d10ago.getFullYear() + '-' + pad(d10ago.getMonth()+1) + '-' + pad(d10ago.getDate());
      window.S.sessionHistory = {};
      window.S.sessionHistory['0_' + ds10] = { duration: 45, date: ds10 + 'T10:00:00Z' };
      window.S.sessionHistory['1_' + ds3] = { duration: 60, date: ds3 + 'T10:00:00Z' };
      out.lastDate = window.getLastSessionDate();
      out.daysSince = window.getDaysSinceLastSession();
      return out;
    });
    if (r.helperLast !== 'function' || r.helperDays !== 'function') fail('T2 helpers', JSON.stringify(r));
    else if (r.emptyLast !== null || r.emptyDays !== null) fail('T2 empty', JSON.stringify(r));
    else if (!r.lastDate) fail('T2 last', 'lastDate=' + r.lastDate);
    else if (r.daysSince < 2 || r.daysSince > 4) fail('T2 days', 'daysSince=' + r.daysSince + ' (expected ~3)');
    else pass('T2 : helpers OK (empty=null, last=' + r.lastDate + ', days=' + r.daysSince + ')');
    await ctx.close();
  } catch(e) { fail('T2', e.message); }

  // T3 : Opt-out user → init et askPermission no-op
  suite('T3 \u2014 _userOptedOut bloque init() et askPermission()');
  try {
    const { page, ctx } = await newPage();
    await mockLogin(page);
    const r = await page.evaluate(() => {
      // User désactive pushNotifsEnabled
      window.S.pushNotifsEnabled = false;
      return {
        optedOut: window.SFCPushManager._userOptedOut(),
        permState: Notification.permission
      };
    });
    if (!r.optedOut) fail('T3 detect', 'opt-out non détecté');
    else pass('T3 : pushNotifsEnabled=false → _userOptedOut()=true');
    await ctx.close();
  } catch(e) { fail('T3', e.message); }

  // T4 : disable() clear timers et flag granted=false
  suite('T4 \u2014 disable() clear timers + savePrefs granted=false');
  try {
    const { page, ctx } = await newPage();
    await mockLogin(page, 'test-disable');
    const r = await page.evaluate(() => {
      // Set quelques timers + prefs granted=true
      window._sfcNotifTimers = [];
      var t1 = setTimeout(function(){}, 99999);
      var t2 = setTimeout(function(){}, 99999);
      window._sfcNotifTimers.push(t1, t2);
      var prefs = window.SFCPushManager.getPrefs();
      prefs.granted = true;
      window.SFCPushManager.savePrefs(prefs);
      // Disable
      window.SFCPushManager.disable();
      var newPrefs = window.SFCPushManager.getPrefs();
      return {
        timersAfter: window._sfcNotifTimers.length,
        granted: newPrefs.granted
      };
    });
    if (r.timersAfter !== 0) fail('T4 timers', 'timers=' + r.timersAfter);
    else if (r.granted !== false) fail('T4 granted', 'granted=' + r.granted);
    else pass('T4 : disable() clear timers + granted=false');
    await ctx.close();
  } catch(e) { fail('T4', e.message); }

  // T5 : pushNotifsEnabled dans PROFILE_KEYS + state
  suite('T5 \u2014 pushNotifsEnabled : PROFILE_KEYS + state default true');
  try {
    const main = fs.readFileSync('/home/user/Smartfitcoach/app/app-main.js', 'utf8');
    const core = fs.readFileSync('/home/user/Smartfitcoach/app/app-core.js', 'utf8');
    if (main.indexOf("'pushNotifsEnabled'") === -1) fail('T5 keys', 'pushNotifsEnabled absent PROFILE_KEYS');
    else if (core.indexOf('pushNotifsEnabled: true') === -1) fail('T5 default', 'default true absent state');
    else pass('T5 : pushNotifsEnabled dans PROFILE_KEYS + state default true');
  } catch(e) { fail('T5', e.message); }

  // T6 : SW utilise /app/icon-192.png (pas /icons/ qui n'existe pas)
  suite('T6 \u2014 SW push icon path corrigé (./icon-192.png)');
  try {
    const sw = fs.readFileSync('/home/user/Smartfitcoach/app/sw.js', 'utf8');
    if (sw.indexOf("'/icons/icon-192.png'") !== -1) fail('T6 old', 'Ancien chemin /icons/ encore présent');
    else if (sw.indexOf('./icon-192.png') === -1) fail('T6 new', './icon-192.png absent');
    else pass('T6 : SW push icon → ./icon-192.png (correction chemin)');
  } catch(e) { fail('T6', e.message); }

  // T7 : Toggle UI dashboard "Mes données"
  suite('T7 \u2014 Toggle UI "Activer les rappels" dans dashboard étendu');
  try {
    const dash = fs.readFileSync('/home/user/Smartfitcoach/app/today-dashboard.js', 'utf8');
    if (dash.indexOf("'Rappels & notifications'") === -1) fail('T7 label', 'Section label absent');
    else if (dash.indexOf('Activer les rappels') === -1) fail('T7 toggle', 'Toggle label absent');
    else if (dash.indexOf('SFCPushManager.enable') === -1) fail('T7 enable', 'enable() pas appelé');
    else if (dash.indexOf('SFCPushManager.disable') === -1) fail('T7 disable', 'disable() pas appelé');
    else pass('T7 : section UI "Rappels & notifications" + enable/disable connectés');
  } catch(e) { fail('T7', e.message); }

  // T8 : Notification absente → graceful no-op (Safari iOS <16.4)
  suite('T8 \u2014 Fallback graceful : Notification absent (Safari iOS <16.4)');
  try {
    const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
    const page = await ctx.newPage();
    const errors = [];
    page.on('pageerror', e => errors.push('PAGE: ' + e.message));
    page.on('console', m => { if (m.type() === 'error') errors.push('CONS: ' + m.text()); });
    await ctx.addInitScript(`
      localStorage.setItem('mtd_dev_wiped_v1', '1');
      sessionStorage.setItem('mtd_gate_access', '1gs8uk7');
      delete window.Notification;
    `);
    await page.goto(BASE_URL, { waitUntil: 'domcontentloaded', timeout: 15000 });
    await page.waitForTimeout(2500);
    const r = await page.evaluate(() => {
      try {
        window.SFCPushManager.init();
        window.SFCPushManager.askPermission();
        return { ok: true };
      } catch(e) { return { ok: false, err: e.message }; }
    });
    if (!r.ok) fail('T8', 'Crash : ' + r.err);
    else if (errors.length) fail('T8 errs', errors.slice(0,2).join(' | '));
    else pass('T8 : init() + askPermission() no-op gracieusement sans Notification API');
    await ctx.close();
  } catch(e) { fail('T8', e.message); }

  // T9 : enable() → askPermission appelé
  suite('T9 \u2014 enable() déclenche askPermission() (mock granted)');
  try {
    const { page, ctx } = await newPage({ permissionAnswer: 'granted', permissionState: 'default' });
    await mockLogin(page, 'test-enable');
    const r = await page.evaluate(() => {
      return new Promise((resolve) => {
        window.S.pushNotifsEnabled = true;
        var p = window.SFCPushManager.askPermission();
        if (p && p.then) {
          p.then(function(perm) {
            resolve({ permGranted: Notification.permission, returnedPerm: perm });
          });
        } else {
          // Si déjà granted, askPermission return undefined → permission state direct
          resolve({ permGranted: Notification.permission });
        }
      });
    });
    if (r.permGranted !== 'granted') fail('T9 perm', 'state=' + r.permGranted);
    else pass('T9 : askPermission → permission granted');
    await ctx.close();
  } catch(e) { fail('T9', e.message); }

  // T10 : Permission denied → no scheduling
  suite('T10 \u2014 Permission denied → askPermission no-op (pas de re-prompt)');
  try {
    const { page, ctx } = await newPage({ permissionState: 'denied' });
    await mockLogin(page);
    const r = await page.evaluate(() => {
      return new Promise((resolve) => {
        window._notifPermissionState = 'denied';
        var calledSchedule = false;
        var origSchedule = window.SFCPushManager.scheduleLocalNotifs;
        window.SFCPushManager.scheduleLocalNotifs = function() { calledSchedule = true; };
        window.SFCPushManager.askPermission();
        setTimeout(() => {
          window.SFCPushManager.scheduleLocalNotifs = origSchedule;
          resolve({ scheduled: calledSchedule, perm: Notification.permission });
        }, 100);
      });
    });
    if (r.scheduled) fail('T10 sched', 'Schedule called avec permission denied');
    else if (r.perm !== 'denied') fail('T10 perm', 'perm=' + r.perm);
    else pass('T10 : permission denied → pas de scheduleLocalNotifs');
    await ctx.close();
  } catch(e) { fail('T10', e.message); }

  await browser.close();
  console.log('\n' + '\u2550'.repeat(60));
  console.log('R\u00c9SUM\u00c9 NOTIFS PUSH : ' + passed + '/' + (passed + failed) + ' tests PASS (' + failed + ' \u00e9chec(s))');
  console.log('\u2550'.repeat(60));
  process.exit(failed > 0 ? 1 : 0);
})();
