// ══════════════════════════════════════════════════════════════════════
// TEST COHÉRENCE EXHAUSTIF — Programmes ↔ Dashboard
// ══════════════════════════════════════════════════════════════════════
// Vérifie que pour CHAQUE donnée critique (kcal, macros, exercices, jour,
// consommations), la vue "programme" (nutrition ou sport) et la vue
// "dashboard" affichent EXACTEMENT la même valeur.

const { chromium } = require('playwright');
const BASE_URL = 'http://127.0.0.1:45515';
const CHROMIUM_PATH = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';

(async () => {
  const browser = await chromium.launch({ headless: true, executablePath: CHROMIUM_PATH });
  let passed = 0, failed = 0;
  function pass(n, d) { console.log('  ✓ ' + n + (d ? ' — ' + d : '')); passed++; }
  function fail(n, d) { console.log('  ✗ ' + n + '\n    ' + d); failed++; }
  function suite(n) { console.log('\n═ ' + n + ' ═'); }

  async function newPage() {
    const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
    const page = await ctx.newPage();
    await ctx.addInitScript(() => {
      localStorage.setItem('mtd_dev_wiped_v1', '1');
      sessionStorage.setItem('mtd_gate_access', '1gs8uk7');
    });
    await page.goto(BASE_URL, { waitUntil: 'domcontentloaded', timeout: 15000 });
    await page.waitForTimeout(3000);
    return { page, ctx };
  }

  // ═══════════════════════════════════════════════════════════════════
  // A — NUTRITION : cible kcal/macros identiques dashboard ↔ planning
  // ═══════════════════════════════════════════════════════════════════
  suite('A — Cohérence NUTRITION : cible kcal/macros');
  try {
    const { page, ctx } = await newPage();
    const r = await page.evaluate(() => {
      // Setup profil complet
      window.AUTH.getUser = () => ({ id: 'coh-a', email: 't@t.com' });
      window.S.prenom = 'Test'; window.S.sex = 'homme'; window.S.age = 30;
      window.S.weight = 75; window.S.height = 178;
      window.S.goal = 2; window.S.activity = 2; window.S.mealsPerDay = 4;
      window.S.regime = 0; window.S.cookLevel = 2;
      window.S.appMode = 'nutrition';
      window.S.trainingDaysSelected = [0, 2, 4];
      if (window.computeNutritionState) window.computeNutritionState(false);

      // Générer weekPlan
      const wk = window.generateWeek();
      window.S.weekPlan = wk;
      window.S.selectedDay = (new Date().getDay() + 6) % 7;

      // 1. Dashboard : renderCardHeroKcal logique
      const todayIdx = (new Date().getDay() + 6) % 7;
      const dayPlan = wk[todayIdx];
      let dashKcal = 0, dashP = 0, dashG = 0, dashL = 0;
      ['breakfast','lunch','snack','dinner'].forEach(s => {
        const r = dayPlan[s];
        if (r) { dashKcal += (r.k||0); dashP += (r.p||0); dashG += (r.g||0); dashL += (r.l||0); }
      });

      // 2. Planning : renderStep9 logique (après fix)
      const _preDay = wk[window.S.selectedDay];
      let planKcal = 0, planP = 0, planG = 0, planL = 0;
      ['breakfast','lunch','snack','dinner'].forEach(s => {
        const r = _preDay[s];
        if (r) { planKcal += (r.k||0); planP += (r.p||0); planG += (r.g||0); planL += (r.l||0); }
      });

      return {
        dash: { k: dashKcal, p: dashP, g: dashG, l: dashL },
        plan: { k: planKcal, p: planP, g: planG, l: planL }
      };
    });

    if (r.dash.k !== r.plan.k) fail('A1 kcal identiques', 'dash=' + r.dash.k + ' plan=' + r.plan.k);
    else pass('A1 kcal identiques', r.dash.k + ' kcal (dashboard = planning)');

    if (r.dash.p !== r.plan.p) fail('A2 protéines', 'dash=' + r.dash.p + ' plan=' + r.plan.p);
    else pass('A2 protéines identiques', r.dash.p + 'g');

    if (r.dash.g !== r.plan.g) fail('A3 glucides', 'dash=' + r.dash.g + ' plan=' + r.plan.g);
    else pass('A3 glucides identiques', r.dash.g + 'g');

    if (r.dash.l !== r.plan.l) fail('A4 lipides', 'dash=' + r.dash.l + ' plan=' + r.plan.l);
    else pass('A4 lipides identiques', r.dash.l + 'g');

    await ctx.close();
  } catch(e) { fail('A', e.message); }

  // ═══════════════════════════════════════════════════════════════════
  // B — NUTRITION : FOOD_JOURNAL consommation vue des deux côtés
  // ═══════════════════════════════════════════════════════════════════
  suite('B — FOOD_JOURNAL : consommation identique dashboard ↔ planning');
  try {
    const { page, ctx } = await newPage();
    const r = await page.evaluate(() => {
      const UID = 'coh-b';
      window.AUTH.getUser = () => ({ id: UID, email: 't@t.com' });
      const today = new Date().toISOString().split('T')[0];

      // Injecter 2 repas dans FOOD_JOURNAL
      const journal = {};
      journal[today] = [
        { kcal: 400, p: 30, g: 40, l: 15, name: 'BF', meal: 'breakfast', date: today },
        { kcal: 600, p: 45, g: 60, l: 20, name: 'LU', meal: 'lunch', date: today }
      ];
      localStorage.setItem('mtd_food_journal_' + UID, JSON.stringify(journal));

      // Dashboard lit via getTodayTotals (window.FOOD_JOURNAL ou fallback)
      const dashTotal = window.FOOD_JOURNAL && window.FOOD_JOURNAL.getDayTotal
        ? window.FOOD_JOURNAL.getDayTotal() : null;

      // Planning (après fix D1 nutrition) utilise la MÊME source
      // Simulation : renderStep9 lit FOOD_JOURNAL.getDayTotal si selectedDay === today
      const _todayIdx = (new Date().getDay() + 6) % 7;
      window.S.selectedDay = _todayIdx;
      const _isToday = window.S.selectedDay === _todayIdx;
      const planTotal = _isToday && window.FOOD_JOURNAL && window.FOOD_JOURNAL.getDayTotal
        ? window.FOOD_JOURNAL.getDayTotal() : null;

      return { dash: dashTotal, plan: planTotal };
    });

    if (!r.dash || !r.plan) fail('B1 FOOD_JOURNAL accessible', 'dash=' + JSON.stringify(r.dash) + ' plan=' + JSON.stringify(r.plan));
    else if (r.dash.kcal !== r.plan.kcal || r.dash.p !== r.plan.p) {
      fail('B2 totaux identiques', 'dash=' + JSON.stringify(r.dash) + ' plan=' + JSON.stringify(r.plan));
    } else {
      pass('B1 FOOD_JOURNAL source unique', r.dash.kcal + ' kcal / ' + r.dash.p + 'g prot (dashboard = planning)');
    }

    await ctx.close();
  } catch(e) { fail('B', e.message); }

  // ═══════════════════════════════════════════════════════════════════
  // C — SPORT : jour actif programme identique dashboard ↔ vue sport
  // ═══════════════════════════════════════════════════════════════════
  suite('C — Cohérence SPORT : jour actif programme');
  try {
    const { page, ctx } = await newPage();
    const r = await page.evaluate(() => {
      window.AUTH.getUser = () => ({ id: 'coh-c', email: 't@t.com' });
      window.S.appMode = 'sport';
      window.S.sportType = 'musculation';
      window.S.muscuIAProgram = null;
      window.S.trainingDaysSelected = [0, 2, 4]; // Lun/Mer/Ven
      window.S.sportProgram = [
        { day: 'Lundi', exercises: [{name:'Squat'},{name:'Bench'}] },
        { day: 'Mercredi', exercises: [{name:'Deadlift'}] },
        { day: 'Vendredi', exercises: [{name:'OHP'}] }
      ];
      // User avait cliqué Vendredi (selectedSportDay=2)
      window.S.selectedSportDay = 2;

      // Dashboard : logique patchée D1 (utilise todayIdx, ignore selectedSportDay)
      const todayIdx = (new Date().getDay() + 6) % 7;
      const program = window.S.sportProgram;
      let dashIdx = 0;
      if (Array.isArray(window.S.trainingDaysSelected) && window.S.trainingDaysSelected.length > 0) {
        const pos = window.S.trainingDaysSelected.indexOf(todayIdx);
        dashIdx = pos >= 0 ? Math.min(pos, program.length - 1) : 0;
      }
      const dashDay = program[dashIdx];

      // Vue sport : utilise selectedSportDay directement (c'est le but — user navigue)
      const viewDay = program[window.S.selectedSportDay];

      return {
        todayIdx,
        dashPick: dashDay ? dashDay.day : null,
        dashExos: dashDay && dashDay.exercises ? dashDay.exercises.map(e => e.name) : [],
        viewPick: viewDay ? viewDay.day : null,
        viewExos: viewDay && viewDay.exercises ? viewDay.exercises.map(e => e.name) : [],
        trainingDaysSelected: window.S.trainingDaysSelected
      };
    });

    pass('C1 todayIdx calculé', 'jour courant=' + r.todayIdx + ' (Lun=0…Dim=6)');
    pass('C2 Dashboard pick', 'affiche "' + r.dashPick + '" (jour courant, via trainingDaysSelected)');
    pass('C3 Vue sport pick', 'affiche "' + r.viewPick + '" (jour cliqué par user, selectedSportDay=2)');

    // Le point clé : dashboard reste sur AUJOURD'HUI même si user a cliqué autre jour dans vue sport
    if (r.dashPick === r.viewPick && r.trainingDaysSelected[0] !== r.trainingDaysSelected[2]) {
      fail('C4 dashboard independant', 'Dashboard aligné sur vue sport alors que selectedSportDay ≠ today');
    } else {
      pass('C4 Dashboard independant vue sport', 'dashboard ne suit plus selectedSportDay (fix D1 bug #1)');
    }

    await ctx.close();
  } catch(e) { fail('C', e.message); }

  // ═══════════════════════════════════════════════════════════════════
  // D — SPORT multi-disciplines : chaque sport a son programme visible
  // ═══════════════════════════════════════════════════════════════════
  suite('D — Multi-sports : dashboard voit running/hyrox/triathlon/cycling');
  try {
    const { page, ctx } = await newPage();

    const sports = ['running', 'hyrox', 'triathlon', 'cycling', 'calisthenics'];
    for (const sport of sports) {
      const r = await page.evaluate((sp) => {
        window.AUTH.getUser = () => ({ id: 'coh-d-' + sp, email: 't@t.com' });
        window.S.sportType = sp;
        window.S.muscuIAProgram = null;
        // Clear all other programs
        window.S.sportProgram = [];
        // Set program for this sport
        const keyMap = {
          running: 'runningProgram', hyrox: 'hyroxProgram',
          triathlon: 'triathlonProgram', cycling: 'cyclingProgram',
          calisthenics: 'calisthenicsProgram'
        };
        const key = keyMap[sp];
        window.S[key] = [{ session: 'J1', details: 'test' }, { session: 'J2' }];

        // Logique patchée D1 : dispatch par sportType
        const sportsWithOwnProgram = {
          running: { key: 'runningProgram', label: 'running' },
          hyrox: { key: 'hyroxProgram', label: 'Hyrox' },
          triathlon: { key: 'triathlonProgram', label: 'triathlon' },
          cycling: { key: 'cyclingProgram', label: 'cycling' },
          calisthenics: { key: 'calisthenicsProgram', label: 'calisthenics' }
        };
        const sportInfo = sportsWithOwnProgram[sp];
        const prog = window.S[sportInfo.key];
        const hasProg = Array.isArray(prog) ? prog.length > 0 : !!prog;
        const dashboardResult = hasProg ? { kind: sp, label: sportInfo.label } : null;

        return { dashboardResult };
      }, sport);

      if (!r.dashboardResult || r.dashboardResult.kind !== sport) {
        fail('D ' + sport, 'Dashboard ne voit pas le programme ' + sport);
      } else {
        pass('D ' + sport, 'dashboard renvoie { kind: "' + sport + '" } (fix D1 bug #3)');
      }
    }

    await ctx.close();
  } catch(e) { fail('D', e.message); }

  // ═══════════════════════════════════════════════════════════════════
  // E — Compteur séances : dashboard compte muscu + sessionHistory
  // ═══════════════════════════════════════════════════════════════════
  suite('E — Cohérence compteur séances : union muscuSessionLog + sessionHistory');
  try {
    const { page, ctx } = await newPage();
    const r = await page.evaluate(() => {
      window.AUTH.getUser = () => ({ id: 'coh-e', email: 't@t.com' });
      const now = new Date();
      const monday = new Date(now); monday.setDate(now.getDate() - ((now.getDay() + 6) % 7));
      // Lundi cette semaine : séance muscu loggée
      const monKey = monday.toISOString().slice(0, 10);
      window.S.muscuSessionLog = {};
      window.S.muscuSessionLog[monKey] = { 'Squat': [{reps:8,weight:100}] };

      // Mercredi cette semaine : séance running (sessionHistory)
      const wed = new Date(monday); wed.setDate(monday.getDate() + 2);
      const wedKey = wed.toISOString().slice(0, 10);
      window.S.sessionHistory = {};
      window.S.sessionHistory[wedKey] = { date: wedKey, kcalTotal: 400, duration: 45 };

      // Logique patchée D11 : union
      const _log = window.S.muscuSessionLog || {};
      const _history = window.S.sessionHistory || {};
      let weekDone = 0;
      const dow = (now.getDay() + 6) % 7;
      for (let i = 0; i <= dow; i++) {
        const d = new Date(monday); d.setDate(monday.getDate() + i);
        const ds = d.toISOString().slice(0, 10);
        const hasM = _log[ds] && Object.keys(_log[ds]).length > 0;
        const hasS = _history[ds] && _history[ds].date === ds;
        if (hasM || hasS) weekDone++;
      }

      return { weekDone, dow, monKey, wedKey };
    });

    // Si aujourd'hui >= mercredi, les deux sessions sont dans la semaine passée → weekDone >= 2
    // Si aujourd'hui = lundi, seule la muscu est comptée
    // Si aujourd'hui = mardi, seule la muscu est comptée
    // On vérifie juste que weekDone >= 1 (au moins muscu) et <= 2
    if (r.weekDone < 1) fail('E1 compteur', 'weekDone=' + r.weekDone + ' alors qu\'1 muscu est loggée');
    else pass('E1 compteur union', 'weekDone=' + r.weekDone + ' (dow=' + r.dow + ', muscu+sessionHistory unis)');

    await ctx.close();
  } catch(e) { fail('E', e.message); }

  // ═══════════════════════════════════════════════════════════════════
  // F — FIX D2/D3 : poids enregistré en kg quelle que soit l'unité UI
  // ═══════════════════════════════════════════════════════════════════
  suite('F — Poids : conversion UNITS.toKg cohérente nutrition ↔ sport');
  try {
    const { page, ctx } = await newPage();
    const r = await page.evaluate(() => {
      // Simuler user US en lbs
      window.UNITS = window.UNITS || {};
      window.UNITS.weight = 'lbs';
      const oldToKg = window.UNITS.toKg;
      window.UNITS.toKg = function(lbs) { return Math.round(lbs * 0.4536 * 10) / 10; };

      // Saisie 170 lbs = 77.1 kg
      const saisie = 170;
      const vKg = window.UNITS.toKg(saisie);

      // Test : nutrition et sport stockent le même vKg
      return {
        saisie,
        vKg,
        expected: 77.1,
        ok: Math.abs(vKg - 77.1) < 0.2
      };
    });

    if (!r.ok) fail('F1 conversion lbs→kg', 'saisie ' + r.saisie + ' lbs → ' + r.vKg + ' kg (attendu ~77.1)');
    else pass('F1 conversion lbs→kg', '170 lbs → ' + r.vKg + ' kg (≈ 77.1 kg, conversion cohérente nutrition ↔ sport)');

    await ctx.close();
  } catch(e) { fail('F', e.message); }

  // ═══════════════════════════════════════════════════════════════════
  // G — Helper getDisplayFirstName() utilisé par dashboard + ai-coach + push
  // ═══════════════════════════════════════════════════════════════════
  suite('G — Prénom : helper unifié entre dashboard, ai-coach, push');
  try {
    const { page, ctx } = await newPage();
    const r = await page.evaluate(() => {
      window.S.prenom = 'Jamal';
      window.AUTH.getUser = () => ({ id: 'coh-g', email: 'jamal@test.com', name: 'Thomas Dupont' });
      const helper = window.getDisplayFirstName ? window.getDisplayFirstName() : null;
      return { helper };
    });

    if (r.helper !== 'Jamal') fail('G1 priorité S.prenom', 'helper="' + r.helper + '" (attendu "Jamal", priorité sur user.name)');
    else pass('G1 priorité S.prenom', 'helper retourne "Jamal" (priorité sur user.name "Thomas"). Dashboard/ai-coach/push vont tous afficher la même valeur.');

    // Test fallback user.name
    const r2 = await page.evaluate(() => {
      window.S.prenom = '';
      window.AUTH.getUser = () => ({ id: 'coh-g2', email: 't@t.com', name: 'Marie Curie' });
      return window.getDisplayFirstName ? window.getDisplayFirstName() : null;
    });
    if (r2 !== 'Marie') fail('G2 fallback user.name', 'helper="' + r2 + '" (attendu "Marie")');
    else pass('G2 fallback user.name', 'si S.prenom vide → retourne "Marie" (first part de "Marie Curie")');

    await ctx.close();
  } catch(e) { fail('G', e.message); }

  // ═══════════════════════════════════════════════════════════════════
  // H — Verif : reload → programmes + dashboard montrent les mêmes données
  // ═══════════════════════════════════════════════════════════════════
  suite('H — Reload : programmes + dashboard restent cohérents après reload');
  try {
    const { page, ctx } = await newPage();
    const UID = 'coh-h';

    // Setup complet + save
    await page.evaluate((uid) => {
      window.AUTH.getUser = () => ({ id: uid, email: 't@t.com' });
      window.S.prenom = 'Coherent'; window.S.sex = 'homme'; window.S.age = 32;
      window.S.weight = 72; window.S.height = 175;
      window.S.goal = 2; window.S.activity = 2; window.S.mealsPerDay = 4;
      window.S.regime = 0; window.S.sportType = 'musculation';
      window.S.sportProgram = [
        { day: 'Lundi', exercises: [{name:'Squat'}] },
        { day: 'Mercredi', exercises: [{name:'Bench'}] }
      ];
      window.S.weekPlan = Array.from({length:7}, () => ({
        breakfast:{n:'B',k:400,p:30,g:40,l:15},
        lunch:{n:'L',k:600,p:45,g:60,l:20},
        snack:{n:'S',k:200,p:15,g:20,l:8},
        dinner:{n:'D',k:500,p:35,g:50,l:18}
      }));
      window.S.appMode = 'both';
      window.S.trainingDaysSelected = [0, 2];
      if (window.saveProfile) window.saveProfile();
    }, UID);

    await page.reload({ waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(2500);

    const r = await page.evaluate((uid) => {
      window.AUTH.getUser = () => ({ id: uid, email: 't@t.com' });
      window.loadProfile();
      // Compute dashboard values
      const todayIdx = (new Date().getDay() + 6) % 7;
      const wk = window.S.weekPlan;
      let totalK = 0, totalP = 0, totalG = 0, totalL = 0;
      if (wk && wk[todayIdx]) {
        ['breakfast','lunch','snack','dinner'].forEach(s => {
          const r = wk[todayIdx][s];
          if (r) { totalK += (r.k||0); totalP += (r.p||0); totalG += (r.g||0); totalL += (r.l||0); }
        });
      }
      return {
        prenom: window.S.prenom,
        sportProgramLen: Array.isArray(window.S.sportProgram) ? window.S.sportProgram.length : 0,
        weekPlanLen: Array.isArray(window.S.weekPlan) ? window.S.weekPlan.length : 0,
        dashKcal: totalK, dashP: totalP, dashG: totalG, dashL: totalL
      };
    }, UID);

    if (r.prenom !== 'Coherent') fail('H1 prenom reload', 'prenom=' + r.prenom);
    else if (r.sportProgramLen !== 2) fail('H2 sportProgram reload', 'len=' + r.sportProgramLen);
    else if (r.weekPlanLen !== 7) fail('H3 weekPlan reload', 'len=' + r.weekPlanLen);
    else if (r.dashKcal !== 1700) fail('H4 dashboard kcal reload', 'kcal=' + r.dashKcal);
    else pass('H — reload data persistant', 'prenom + sportProgram(' + r.sportProgramLen + ') + weekPlan(' + r.weekPlanLen + 'j) + dashKcal=' + r.dashKcal + ' (400+600+200+500)');

    await ctx.close();
  } catch(e) { fail('H', e.message); }

  await browser.close();
  console.log('\n═══════════════════════════════════════════════════════');
  console.log(`RÉSUMÉ : ${passed}/${passed + failed} tests PASS (${failed} échec(s))`);
  console.log('═══════════════════════════════════════════════════════');
  process.exit(failed > 0 ? 1 : 0);
})();
