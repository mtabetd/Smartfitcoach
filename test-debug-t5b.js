'use strict';
const { chromium } = require('playwright');

const BASE_URL = 'http://127.0.0.1:3000';
const PROFILE = {
  prenom: 'QA', sex: 'homme', age: 100,
  weight: 75, height: 175, activity: 2, goal: 2,
  appMode: 'nutrition', nStep: 11
};

(async () => {
  const browser = await chromium.launch({ headless: true, executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const page = await ctx.newPage();
  
  const uid = 'test-debug-t5b';
  await page.addInitScript(function(args) {
    try { sessionStorage.setItem('mtd_gate_access', '1gs8uk7'); } catch(e) {}
    try { sessionStorage.setItem('mtd_seen_welcome', 'true'); } catch(e) {}
    try { Object.defineProperty(window, 'supabase', { get: function() { return null; }, set: function() {}, configurable: true }); } catch(e) {}
    var session = { id: args.uid, name: 'QA', email: 'qa@test.com', nom: '', phone: '', token: 'test', fingerprint: null, tokenIssuedAt: Date.now() };
    try { localStorage.setItem('mtd_session', JSON.stringify(session)); localStorage.setItem('mtd_session_start', String(Date.now())); } catch(e) {}
    try { localStorage.setItem('mtd_profile_' + args.uid, JSON.stringify(args.profile)); } catch(e) {}
  }, { uid, profile: PROFILE });
  
  await page.goto(BASE_URL, { waitUntil: 'domcontentloaded', timeout: 15000 });
  await page.waitForTimeout(2000);
  
  const result = await page.evaluate(function(uid) {
    var stored = localStorage.getItem('mtd_profile_' + uid);
    var session = localStorage.getItem('mtd_session');
    var authUser = window.AUTH ? window.AUTH.getUser() : null;
    var sFields = window.S ? { sex: window.S.sex, age: window.S.age, weight: window.S.weight } : null;
    return { stored: stored ? JSON.parse(stored) : null, session: session ? JSON.parse(session) : null, authUser, sFields };
  }, uid);
  
  console.log('Stored profile:', JSON.stringify(result.stored));
  console.log('Session:', JSON.stringify(result.session));
  console.log('AUTH.getUser():', JSON.stringify(result.authUser));
  console.log('window.S fields:', JSON.stringify(result.sFields));
  
  await browser.close();
})();
