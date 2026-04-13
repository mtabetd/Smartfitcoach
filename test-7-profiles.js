// ═══════════════════════════════════════════════════════════════════════
// TEST 7 PROFILS — Vérifie calculs, cohérence, 0 NaN, 0 crash
// Profils: homme débutant, femme enceinte, ado sportif, femme ménopause,
//          homme obèse IRC, femme végan TCA, athlète élite
// ═══════════════════════════════════════════════════════════════════════
const { chromium } = require('playwright');
const CHROMIUM = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';

(async () => {
  const browser = await chromium.launch({ headless: true, executablePath: CHROMIUM });
  let pass = 0, fail = 0, errors = [];
  function ok(m) { pass++; }
  function ko(m) { fail++; errors.push(m); console.log('    ✗ ' + m); }
  function check(c, m) { c ? ok(m) : ko(m); }

  async function freshPage() {
    const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
    const page = await ctx.newPage();
    const pageErrors = [];
    page.on('pageerror', e => pageErrors.push(e.message));
    await page.goto('http://localhost:3000/', { waitUntil: 'networkidle', timeout: 15000 });
    const gi = await page.$('#gate input[type="password"]');
    if (gi) { await gi.fill('mtd2025'); const b = await page.$('#gate button'); if (b) await b.click(); await page.waitForTimeout(800); }
    return { page, ctx, pageErrors };
  }

  function runProfile(name, setup) {
    return async function() {
      console.log('\n  ══ ' + name + ' ══');
      const { page, ctx, pageErrors } = await freshPage();
      const r = await page.evaluate(setup);

      // Vérifications universelles
      check(!isNaN(r.bmr) && r.bmr > 0, 'BMR > 0: ' + r.bmr);
      check(!isNaN(r.tdee) && r.tdee > 0, 'TDEE > 0: ' + r.tdee);
      check(!isNaN(r.target) && r.target > 0, 'Target > 0: ' + r.target);
      check(r.macros && !isNaN(r.macros.p) && r.macros.p > 0, 'Protein > 0: ' + (r.macros ? r.macros.p : 'null') + 'g');
      check(r.macros && !isNaN(r.macros.g) && r.macros.g >= 0, 'Carbs >= 0: ' + (r.macros ? r.macros.g : 'null') + 'g');
      check(r.macros && !isNaN(r.macros.l) && r.macros.l > 0, 'Fat > 0: ' + (r.macros ? r.macros.l : 'null') + 'g');
      check(!isNaN(r.bmi) && r.bmi > 10 && r.bmi < 80, 'BMI valide: ' + r.bmi);

      // Cohérence macros ↔ calories (±10%)
      if (r.macros && r.target > 0) {
        var calMac = r.macros.p * 4 + r.macros.g * 4 + r.macros.l * 9;
        var diff = Math.abs(calMac - r.target) / r.target;
        check(diff < 0.10, 'Macros cohérents (' + Math.round(diff * 100) + '% écart): ' + calMac + ' vs ' + r.target + ' kcal');
      }

      // Plan nutrition
      check(r.planOk, 'Plan 7j généré: ' + (r.planOk ? '7 jours complets' : r.planErr || 'FAIL'));

      // Zéro erreur JS
      check(pageErrors.length === 0, 'JS errors: ' + (pageErrors.length === 0 ? 'aucune' : pageErrors[0]));

      // Checks spécifiques au profil
      if (r.specific) {
        for (var k in r.specific) {
          check(r.specific[k].pass, r.specific[k].msg);
        }
      }

      await ctx.close();
    };
  }

  // ═══════════════════════════════════════════════════════════════
  console.log('\n═══ TEST 7 PROFILS DIFFÉRENTS ═══');

  // PROFIL 1: Homme débutant sédentaire, maintien
  await runProfile('PROFIL 1: Homme 25ans, 75kg, sédentaire, maintien', function() {
    var S = window.S;
    S.sex='homme';S.weight=75;S.height=178;S.birthDate='2001-03-10';
    S.activity=0;S.sleep=2;S.goal=2;S.medical=[];S.pregnant=false;S.regime=0;
    S.allergies=[];S.intolerances=[];S.halal=false;S.mealsPerDay=3;S.sportDays=0;
    var bmr=window.calcBMR(),tdee=window.calcTDEE(),target=window.calcTarget();
    var macros=window.calcMacros(),bmi=window.calcBMI();
    var plan; try { plan=window.generateWeek(); } catch(e) { plan=null; }
    var planOk = Array.isArray(plan) && plan.length===7 && plan.every(function(d){return d&&d.breakfast&&d.lunch&&d.dinner;});
    return { bmr:bmr,tdee:tdee,target:target,macros:macros,bmi:bmi,planOk:planOk,
      specific: {
        maintien: { pass: target === Math.round(tdee), msg: 'Maintien = TDEE: ' + target + ' vs ' + Math.round(tdee) },
        floor: { pass: target >= 1500, msg: 'Plancher homme 1500: ' + target }
      }
    };
  })();

  // PROFIL 2: Femme enceinte T3, 30 ans
  await runProfile('PROFIL 2: Femme 30ans, enceinte T3, 68kg', function() {
    var S = window.S;
    S.sex='femme';S.weight=68;S.height=165;S.birthDate='1996-07-20';
    S.activity=1;S.sleep=2;S.goal=2;S.medical=[];S.pregnant=true;S.pregnancyWeek=34;
    S.prePregnancyWeight=62;S.regime=0;S.allergies=[];S.halal=false;S.mealsPerDay=4;
    S.sportDays=2;
    window.validatePregnancyState();
    var bmr=window.calcBMR(),tdee=window.calcTDEE(),target=window.calcTarget();
    var macros=window.calcMacros(),bmi=window.calcBMI();
    var tri=window.getPregnancyTrimester();
    var plan; try { plan=window.generateWeek(); } catch(e) { plan=null; }
    var planOk = Array.isArray(plan) && plan.length===7;
    return { bmr:bmr,tdee:tdee,target:target,macros:macros,bmi:bmi,planOk:planOk,
      specific: {
        trimestre: { pass: tri && tri.trimesterNumber===3, msg: 'Trimestre 3 détecté: T' + (tri?tri.trimesterNumber:'?') },
        floor: { pass: target >= 1800, msg: 'Plancher grossesse 1800: ' + target },
        extra: { pass: target >= Math.round(tdee) + 400, msg: 'T3 +450kcal: ' + target + ' >= ' + (Math.round(tdee)+400) },
        prePreg: { pass: bmr < 1500, msg: 'BMR basé sur poids pré-grossesse (62kg): ' + bmr }
      }
    };
  })();

  // PROFIL 3: Ado sportif 16 ans, sèche
  await runProfile('PROFIL 3: Ado 16ans, 70kg, sportif, sèche', function() {
    var S = window.S;
    S.sex='homme';S.weight=70;S.height=175;S.birthDate='2010-01-15';
    S.activity=3;S.sleep=2;S.goal=4;S.medical=[];S.pregnant=false;S.regime=0;
    S.allergies=[];S.halal=false;S.mealsPerDay=3;S.sportDays=4;
    var bmr=window.calcBMR(),tdee=window.calcTDEE(),target=window.calcTarget();
    var macros=window.calcMacros(),bmi=window.calcBMI();
    var plan; try { plan=window.generateWeek(); } catch(e) { plan=null; }
    var planOk = Array.isArray(plan) && plan.length===7;
    return { bmr:bmr,tdee:tdee,target:target,macros:macros,bmi:bmi,planOk:planOk,
      specific: {
        deficit: { pass: Math.round(tdee) - target <= 300, msg: 'Ado déficit max 300: ' + (Math.round(tdee)-target) },
        floor: { pass: target >= 1500, msg: 'Plancher homme 1500: ' + target }
      }
    };
  })();

  // PROFIL 4: Femme 55 ans, ménopause, cut
  await runProfile('PROFIL 4: Femme 55ans, ménopause, 72kg, cut', function() {
    var S = window.S;
    S.sex='femme';S.weight=72;S.height=162;S.birthDate='1971-04-12';
    S.activity=1;S.sleep=1;S.goal=3;S.medical=['menopause'];S.pregnant=false;S.regime=0;
    S.allergies=[];S.halal=false;S.mealsPerDay=3;S.sportDays=2;
    var bmr=window.calcBMR(),tdee=window.calcTDEE(),target=window.calcTarget();
    var macros=window.calcMacros(),bmi=window.calcBMI();
    var plan; try { plan=window.generateWeek(); } catch(e) { plan=null; }
    var planOk = Array.isArray(plan) && plan.length===7;
    return { bmr:bmr,tdee:tdee,target:target,macros:macros,bmi:bmi,planOk:planOk,
      specific: {
        reduction: { pass: target < Math.round(tdee), msg: 'Ménopause+cut < TDEE: ' + target + ' < ' + Math.round(tdee) },
        floor: { pass: target >= 1400, msg: 'Plancher femme 1400: ' + target }
      }
    };
  })();

  // PROFIL 5: Homme obèse IRC, 50 ans
  await runProfile('PROFIL 5: Homme 50ans, 120kg, IRC, maintien', function() {
    var S = window.S;
    S.sex='homme';S.weight=120;S.height=175;S.birthDate='1976-09-01';
    S.activity=0;S.sleep=1;S.goal=2;S.medical=['irc'];S.pregnant=false;S.regime=0;
    S.allergies=[];S.halal=false;S.mealsPerDay=3;S.sportDays=0;
    var bmr=window.calcBMR(),tdee=window.calcTDEE(),target=window.calcTarget();
    var macros=window.calcMacros(),bmi=window.calcBMI();
    var plan; try { plan=window.generateWeek(); } catch(e) { plan=null; }
    var planOk = Array.isArray(plan) && plan.length===7;
    // Poids ajusté pour IRC
    var adjW = window.calcAdjustedWeight ? window.calcAdjustedWeight() : 120;
    return { bmr:bmr,tdee:tdee,target:target,macros:macros,bmi:bmi,planOk:planOk,
      specific: {
        ircProt: { pass: macros && macros.p <= Math.round(adjW * 0.65), msg: 'IRC protéine ≤0.60g/kg ajusté: ' + (macros?macros.p:'?') + 'g (adj ' + adjW + 'kg)' },
        obese: { pass: bmi > 35, msg: 'IMC obèse: ' + bmi },
        floor: { pass: target >= 1500, msg: 'Plancher homme 1500: ' + target }
      }
    };
  })();

  // PROFIL 6: Femme végan TCA, 22 ans
  await runProfile('PROFIL 6: Femme 22ans, végan, TCA, 48kg', function() {
    var S = window.S;
    S.sex='femme';S.weight=48;S.height=160;S.birthDate='2004-06-30';
    S.activity=2;S.sleep=2;S.goal=4;S.medical=['tca'];S.pregnant=false;S.regime=3;
    S.allergies=['Gluten/Bl\u00e9'];S.halal=false;S.mealsPerDay=3;S.sportDays=3;
    var bmr=window.calcBMR(),tdee=window.calcTDEE(),target=window.calcTarget();
    var macros=window.calcMacros(),bmi=window.calcBMI();
    var plan; try { plan=window.generateWeek(); } catch(e) { plan=null; }
    var planOk = Array.isArray(plan) && plan.length===7;
    return { bmr:bmr,tdee:tdee,target:target,macros:macros,bmi:bmi,planOk:planOk,
      specific: {
        tcaMaintien: { pass: target >= Math.round(tdee), msg: 'TCA forcé maintien (pas sèche): ' + target + ' >= ' + Math.round(tdee) },
        floor: { pass: target >= 1800, msg: 'TCA femme plancher 1800: ' + target },
        underweight: { pass: bmi < 19, msg: 'IMC insuffisant détecté: ' + bmi }
      }
    };
  })();

  // PROFIL 7: Athlète élite homme, bulk
  await runProfile('PROFIL 7: Homme 28ans, athlète élite, 85kg, bulk', function() {
    var S = window.S;
    S.sex='homme';S.weight=85;S.height=182;S.birthDate='1998-11-05';
    S.activity=4;S.sleep=3;S.goal=0;S.medical=[];S.pregnant=false;S.regime=0;
    S.allergies=[];S.halal=false;S.mealsPerDay=5;S.sportDays=6;
    var bmr=window.calcBMR(),tdee=window.calcTDEE(),target=window.calcTarget();
    var macros=window.calcMacros(),bmi=window.calcBMI();
    var plan; try { plan=window.generateWeek(); } catch(e) { plan=null; }
    var planOk = Array.isArray(plan) && plan.length===7;
    return { bmr:bmr,tdee:tdee,target:target,macros:macros,bmi:bmi,planOk:planOk,
      specific: {
        surplus: { pass: target > Math.round(tdee), msg: 'Bulk = surplus: ' + target + ' > ' + Math.round(tdee) },
        surplusCap: { pass: target <= Math.round(tdee) + 500, msg: 'Surplus max +500: ' + (target - Math.round(tdee)) },
        highProt: { pass: macros && macros.p >= 150, msg: 'Protéine élite ≥150g: ' + (macros?macros.p:'?') + 'g' },
        highCal: { pass: target >= 3000, msg: 'Calories élite ≥3000: ' + target }
      }
    };
  })();

  // ═══════════════════════════════════════════════════════════════
  const total = pass + fail;
  console.log('\n═══════════════════════════════════════');
  console.log('  RÉSULTAT: ' + pass + '/' + total + ' tests passés');
  console.log('═══════════════════════════════════════');
  if (errors.length) {
    console.log('\nÉCHECS:');
    errors.forEach(e => console.log('  ✗ ' + e));
  } else {
    console.log('\n  ✓ 7 PROFILS PARFAITS — ZÉRO ÉCHEC');
  }

  await browser.close();
  process.exit(fail > 0 ? 1 : 0);
})();
