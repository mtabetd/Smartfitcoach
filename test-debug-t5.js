'use strict';
const { chromium } = require('playwright');

const BASE_URL = 'http://127.0.0.1:3000';
const BASE_PROFILE = {
  prenom: 'QA', nom: 'MathTest', sex: 'homme', age: 100,
  weight: 75, height: 175, activity: 2, goal: 2,
  appMode: 'nutrition',
  sportDays: 3, mealsPerDay: 3,
  sleep: 2, train: [], medical: [],
  allergies: [], intolerances: [], cuisines: [],
  supplements: [], wheyFlavors: [], alcoholTypes: [],
  trainingDaysSelected: [0, 2, 4],
  sportGoals: [], strongZones: [], weakZones: [],
  bodyZones: {}, sportFocus: {}, bonusExercises: {},
  sessionHistory: {}, muscuSessionLog: {},
  muscuProgressionHistory: {}, musculationWeights: {},
  muscuStrengthProfile: {}, crossfit1RM: {}, hyroxBenchmarks: {},
  shopChecked: {}, crossfitBenchmarks: {}, muscuMedical: {},
  weightHistory: [], shopStores: [], shopPrefs: [],
  calisthenicsEquipment: [], calisthenicsGoal: [],
  excluded: '', lang: 'fr',
  nStep: 11, sStep: 0,
  weekPlan: null, selectedDay: 0,
  _planHash: null, _nm: null,
  parqDone: false, parqResult: null,
  swapCount: 0, bodyScanDone: false,
  _bodyFatEstimate: null, mealsLogged: {},
  waist: null, streakFreezeAvailable: true,
  streakFreezeUsedMonth: null,
  firstLoginDate: '2025-01-01',
  welcomeShown: true, sportSplashDone: true,
  _sportProfileDone: true,
  weeklyCalendar: null, smartCalendarEnabled: false,
  smartCalendarDismissed: true,
  pregnant: false, pregnancyWeek: null, prePregnancyWeight: null,
  targetWeight: null, birthDate: null
};

(async () => {
  const browser = await chromium.launch({ headless: true, executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const page = await ctx.newPage();
  
  const uid = 'test-debug-t5';
  await page.addInitScript(function(args) {
    try { sessionStorage.setItem('mtd_gate_access', '1gs8uk7'); } catch(e) {}
    try { sessionStorage.setItem('mtd_seen_welcome', 'true'); } catch(e) {}
    try { Object.defineProperty(window, 'supabase', { get: function() { return null; }, set: function() {}, configurable: true }); } catch(e) {}
    var session = { id: args.uid, name: 'QA', email: 'qa@test.com', nom: '', phone: '', token: 'test', fingerprint: null, tokenIssuedAt: Date.now() };
    try { localStorage.setItem('mtd_session', JSON.stringify(session)); localStorage.setItem('mtd_session_start', String(Date.now())); } catch(e) {}
    try { localStorage.setItem('mtd_profile_' + args.uid, JSON.stringify(args.profile)); } catch(e) {}
  }, { uid, profile: BASE_PROFILE });
  
  await page.goto(BASE_URL, { waitUntil: 'domcontentloaded', timeout: 15000 });
  await page.waitForTimeout(1500);
  
  // Check window.S before stateForce
  const sBefore = await page.evaluate(function() {
    return window.S ? { sex: window.S.sex, age: window.S.age, weight: window.S.weight, height: window.S.height, activity: window.S.activity, goal: window.S.goal, view: window.S.view } : null;
  });
  console.log('window.S BEFORE stateForce:', JSON.stringify(sBefore));
  
  await page.evaluate(function(fields) {
    if (!window.S) return;
    Object.keys(fields).forEach(function(k) { window.S[k] = fields[k]; });
    if (window.render) { try { window.render._lock = false; window.render(); } catch(e) {} }
  }, { view: 'nutrition', nStep: 11, age: 100, birthDate: null });
  await page.waitForTimeout(1200);
  
  const sAfter = await page.evaluate(function() {
    return window.S ? { sex: window.S.sex, age: window.S.age, weight: window.S.weight, height: window.S.height, activity: window.S.activity, goal: window.S.goal } : null;
  });
  console.log('window.S AFTER stateForce:', JSON.stringify(sAfter));
  
  const calcResult = await page.evaluate(function() {
    var bmr = window.calcBMR ? window.calcBMR() : 'N/A';
    var age = window.getAge ? window.getAge() : 'N/A';
    return { bmr, age, sex: window.S.sex, weight: window.S.weight, height: window.S.height };
  });
  console.log('Calc results:', JSON.stringify(calcResult));
  
  await browser.close();
})();
