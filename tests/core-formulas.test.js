/**
 * QA Tests for SmartFitCoach core formulas and logic
 * Tests cover: BMR, TDEE, calorie targets, macros, BMI, hydration, security
 */

// ─── Mock browser globals ───
global.window = global;
global.document = {
  createElement: function(tag) {
    return {
      className: '', textContent: '', innerHTML: '',
      style: {}, setAttribute: function(){}, getAttribute: function(){},
      appendChild: function(){}, addEventListener: function(){},
      removeAttribute: function(){}
    };
  },
  createElementNS: function() {
    return { setAttribute: function(){}, appendChild: function(){}, style: {} };
  },
  createTextNode: function(s) { return { nodeType: 3, textContent: s }; },
  getElementById: function() { return null; },
  addEventListener: function() {},
  readyState: 'complete'
};
global.localStorage = {
  _data: {},
  getItem: function(k) { return this._data[k] || null; },
  setItem: function(k, v) { this._data[k] = v; },
  removeItem: function(k) { delete this._data[k]; },
  clear: function() { this._data = {}; }
};
global.navigator = { userAgent: 'test', language: 'fr' };
global.screen = { width: 1024, colorDepth: 24 };
global.Chart = undefined;
global.setTimeout = setTimeout;

// Load app-core.js (IIFE will execute and populate window.*)
require('../app/app-core.js');

// ─── CONSTANTS TESTS ───
describe('Constants', () => {
  test('ACTIVITIES has valid factors', () => {
    expect(window.ACTIVITIES).toBeDefined();
    expect(window.ACTIVITIES.length).toBeGreaterThanOrEqual(4);
    window.ACTIVITIES.forEach(a => {
      expect(a.factor).toBeGreaterThanOrEqual(1.0);
      expect(a.factor).toBeLessThanOrEqual(2.5);
    });
  });

  test('GOALS has valid multipliers', () => {
    expect(window.GOALS).toBeDefined();
    window.GOALS.forEach(g => {
      expect(g.mult).toBeGreaterThanOrEqual(0.7);
      expect(g.mult).toBeLessThanOrEqual(1.2);
      expect(g.key).toBeTruthy();
    });
  });

  test('COOK_LEVELS has incremental values', () => {
    for (let i = 1; i < window.COOK_LEVELS.length; i++) {
      expect(window.COOK_LEVELS[i].val).toBeGreaterThan(window.COOK_LEVELS[i - 1].val);
    }
  });

  test('MEDICAL_ADVICE macro adjustments are within bounds', () => {
    Object.keys(window.MEDICAL_ADVICE).forEach(key => {
      var adv = window.MEDICAL_ADVICE[key];
      if (adv.macroAdj) {
        Object.values(adv.macroAdj).forEach(v => {
          expect(Math.abs(v)).toBeLessThanOrEqual(0.3);
        });
      }
    });
  });
});

// ─── BMR TESTS (Mifflin-St Jeor) ───
describe('calcBMR', () => {
  beforeEach(() => {
    // Reset S to defaults
    window.S.sex = null; window.S.age = 28;
    window.S.weight = 75; window.S.height = 175;
    window.S.pregnant = false; window.S.prePregnancyWeight = null;
    window.S.pregnancyWeek = null; window.S.medical = [];
  });

  test('returns 0 for missing sex', () => {
    window.S.sex = null;
    expect(window.calcBMR()).toBe(0);
  });

  test('returns 0 for invalid age', () => {
    window.S.sex = 'homme';
    window.S.age = 10;
    expect(window.calcBMR()).toBe(0);
  });

  test('returns 0 for invalid weight', () => {
    window.S.sex = 'homme';
    window.S.weight = 20;
    expect(window.calcBMR()).toBe(0);
  });

  test('returns 0 for invalid height', () => {
    window.S.sex = 'homme';
    window.S.height = 50;
    expect(window.calcBMR()).toBe(0);
  });

  test('calculates correctly for male (Mifflin-St Jeor)', () => {
    window.S.sex = 'homme';
    window.S.age = 30; window.S.weight = 80; window.S.height = 180;
    // Formula: (10*80) + (6.25*180) - (5*30) + 5 = 800 + 1125 - 150 + 5 = 1780
    expect(window.calcBMR()).toBe(1780);
  });

  test('calculates correctly for female (Mifflin-St Jeor)', () => {
    window.S.sex = 'femme';
    window.S.age = 25; window.S.weight = 60; window.S.height = 165;
    // Formula: (10*60) + (6.25*165) - (5*25) - 161 = 600 + 1031.25 - 125 - 161 = 1345.25 → 1345
    expect(window.calcBMR()).toBe(1345);
  });

  test('uses pre-pregnancy weight for pregnant women', () => {
    window.S.sex = 'femme';
    window.S.age = 30; window.S.weight = 70; window.S.height = 165;
    window.S.pregnant = true; window.S.prePregnancyWeight = 60;
    // Should use 60kg not 70kg
    // Formula: (10*60) + (6.25*165) - (5*30) - 161 = 600 + 1031.25 - 150 - 161 = 1320.25 → 1320
    expect(window.calcBMR()).toBe(1320);
  });

  test('estimates pre-pregnancy weight when not provided', () => {
    window.S.sex = 'femme';
    window.S.age = 30; window.S.weight = 70; window.S.height = 165;
    window.S.pregnant = true; window.S.pregnancyWeek = 20;
    // Estimated gain: (20-12)*0.5 = 4kg → adjusted weight = 66kg
    var bmrWithEstimate = window.calcBMR();
    // Formula: (10*66) + (6.25*165) - (5*30) - 161 = 660 + 1031.25 - 150 - 161 = 1380.25 → 1380
    expect(bmrWithEstimate).toBe(1380);
  });
});

// ─── TDEE TESTS ───
describe('calcTDEE', () => {
  beforeEach(() => {
    window.S.sex = 'homme'; window.S.age = 30;
    window.S.weight = 80; window.S.height = 180;
    window.S.activity = null; window.S.sportDays = 0;
    window.S.pregnant = false; window.S.medical = [];
  });

  test('returns 0 for null activity', () => {
    expect(window.calcTDEE()).toBe(0);
  });

  test('calculates with sedentary activity', () => {
    window.S.activity = 0; // Sédentaire, factor 1.2
    var bmr = window.calcBMR(); // 1780
    expect(window.calcTDEE()).toBe(Math.round(bmr * 1.2));
  });

  test('auto-corrects activity based on sport days', () => {
    window.S.activity = 0; // Sédentaire = 1.2
    window.S.sportDays = 5; // sportFactor = 1.725
    var bmr = window.calcBMR();
    // Should use max(1.2, 1.725) = 1.725
    // TDEE may differ by 1 due to internal rounding
    expect(Math.abs(window.calcTDEE() - bmr * 1.725)).toBeLessThanOrEqual(1);
  });
});

// ─── calcTarget TESTS ───
describe('calcTarget', () => {
  beforeEach(() => {
    window.S.sex = 'homme'; window.S.age = 30;
    window.S.weight = 80; window.S.height = 180;
    window.S.activity = 2; // modérément actif, 1.55
    window.S.sportDays = 3; window.S.goal = null;
    window.S.pregnant = false; window.S.medical = [];
    window.S.alcoholFreq = null; window.S.alcoholTypes = [];
    window.S.cycleTracking = false;
  });

  test('returns 0 for null goal', () => {
    expect(window.calcTarget()).toBe(0);
  });

  test('maintenance equals TDEE * 1.0', () => {
    window.S.goal = 2; // Maintien, mult=1.0
    var tdee = window.calcTDEE();
    expect(window.calcTarget()).toBe(Math.round(tdee * 1.0));
  });

  test('caps shred deficit at 500 kcal/day', () => {
    window.S.goal = 4; // Sèche, mult=0.80
    var tdee = window.calcTDEE();
    var raw = Math.round(tdee * 0.80);
    var capped = Math.max(raw, Math.round(tdee - 500));
    expect(window.calcTarget()).toBeGreaterThanOrEqual(tdee - 500);
  });

  test('caps bulk surplus at 500 kcal/day', () => {
    window.S.goal = 0; // Prise de masse, mult=1.15
    var tdee = window.calcTDEE();
    expect(window.calcTarget()).toBeLessThanOrEqual(tdee + 500);
  });

  test('enforces male calorie floor of 1500', () => {
    window.S.sex = 'homme'; window.S.age = 30;
    window.S.weight = 50; window.S.height = 160;
    window.S.activity = 0; window.S.sportDays = 0;
    window.S.goal = 4; // Sèche
    expect(window.calcTarget()).toBeGreaterThanOrEqual(1500);
  });

  test('enforces female active calorie floor of 1400', () => {
    window.S.sex = 'femme'; window.S.age = 25;
    window.S.weight = 50; window.S.height = 155;
    window.S.activity = 1; // 1.375
    window.S.sportDays = 0;
    window.S.goal = 4; // Sèche
    expect(window.calcTarget()).toBeGreaterThanOrEqual(1400);
  });

  test('pregnancy enforces 1800 kcal floor', () => {
    window.S.sex = 'femme'; window.S.age = 30;
    window.S.weight = 55; window.S.height = 160;
    window.S.activity = 0; window.S.sportDays = 0;
    window.S.goal = 4; // Sèche
    window.S.pregnant = true; window.S.pregnancyWeek = 28;
    expect(window.calcTarget()).toBeGreaterThanOrEqual(1800);
  });

  test('breastfeeding adds 500 kcal', () => {
    window.S.sex = 'femme'; window.S.age = 30;
    window.S.weight = 65; window.S.height = 165;
    window.S.activity = 1; window.S.sportDays = 0;
    window.S.goal = 2; // Maintien
    window.S.medical = ['allaitement'];
    var tdee = window.calcTDEE();
    expect(window.calcTarget()).toBeGreaterThanOrEqual(Math.round(tdee) + 500);
  });

  test('TCA forces maintenance', () => {
    window.S.sex = 'femme'; window.S.age = 22;
    window.S.weight = 50; window.S.height = 160;
    window.S.activity = 2; window.S.sportDays = 3;
    window.S.goal = 4; // Sèche
    window.S.medical = ['tca'];
    var tdee = window.calcTDEE();
    expect(window.calcTarget()).toBe(Math.round(tdee));
  });

  test('teenager deficit capped at 300 kcal', () => {
    window.S.sex = 'homme'; window.S.age = 16;
    window.S.weight = 65; window.S.height = 175;
    window.S.activity = 2; window.S.sportDays = 3;
    window.S.goal = 3; // Cut -15%
    var tdee = window.calcTDEE();
    expect(window.calcTarget()).toBeGreaterThanOrEqual(Math.round(tdee) - 300);
  });

  test('menopause reduces by 150 kcal', () => {
    window.S.sex = 'femme'; window.S.age = 55;
    window.S.weight = 65; window.S.height = 165;
    window.S.activity = 1; window.S.sportDays = 0;
    window.S.goal = 2; // Maintien
    window.S.medical = ['menopause'];
    var tdee = window.calcTDEE();
    var base = Math.round(tdee * 1.0);
    var expected = Math.max(1400, base - 150);
    expect(window.calcTarget()).toBe(expected);
  });
});

// ─── calcMacros TESTS ───
describe('calcMacros', () => {
  beforeEach(() => {
    window.S.sex = 'homme'; window.S.age = 30;
    window.S.weight = 80; window.S.height = 180;
    window.S.activity = 2; window.S.sportDays = 3;
    window.S.goal = 2; // Maintien
    window.S.pregnant = false; window.S.medical = [];
    window.S.cycleTracking = false;
  });

  test('returns zeroes for null goal', () => {
    window.S.goal = null;
    var m = window.calcMacros();
    expect(m.g).toBe(0);
    expect(m.p).toBe(0);
    expect(m.l).toBe(0);
  });

  test('returns non-zero macros for valid state', () => {
    var m = window.calcMacros();
    expect(m.g).toBeGreaterThan(0);
    expect(m.p).toBeGreaterThan(0);
    expect(m.l).toBeGreaterThan(0);
  });

  test('macros approximate target calories', () => {
    var m = window.calcMacros();
    var target = window.calcTarget();
    var macroKcal = m.g * 4 + m.p * 4 + m.l * 9;
    // Should be within 50 kcal of target
    expect(Math.abs(macroKcal - target)).toBeLessThan(50);
  });

  test('carbs floor at 130g', () => {
    var m = window.calcMacros();
    expect(m.g).toBeGreaterThanOrEqual(130);
  });

  test('protein floor at 40g', () => {
    var m = window.calcMacros();
    expect(m.p).toBeGreaterThanOrEqual(40);
  });

  test('fat floor at 20g', () => {
    var m = window.calcMacros();
    expect(m.l).toBeGreaterThanOrEqual(20);
  });

  test('IRC caps protein at 0.6 g/kg', () => {
    window.S.medical = ['irc'];
    var m = window.calcMacros();
    var maxProtein = Math.round(80 * 0.6); // 48
    expect(m.p).toBeLessThanOrEqual(maxProtein + 1); // +1 for rounding
  });

  test('gestational diabetes caps carbs at 200g', () => {
    window.S.sex = 'femme'; window.S.age = 30;
    window.S.weight = 70; window.S.height = 165;
    window.S.pregnant = true; window.S.pregnancyWeek = 28;
    window.S.goal = 2;
    window.S.medical = ['diabete_gest'];
    var m = window.calcMacros();
    expect(m.g).toBeLessThanOrEqual(200);
  });

  test('older adults get minimum 1.2g/kg protein', () => {
    window.S.age = 65;
    window.S.medical = [];
    var m = window.calcMacros();
    expect(m.p).toBeGreaterThanOrEqual(Math.round(80 * 1.2));
  });
});

// ─── BMI TESTS ───
describe('calcBMI', () => {
  beforeEach(() => {
    window.S.weight = 75; window.S.height = 175;
  });

  test('returns null for missing data', () => {
    window.S.weight = 0;
    expect(window.calcBMI()).toBeNull();
  });

  test('returns null for height < 100', () => {
    window.S.height = 50;
    expect(window.calcBMI()).toBeNull();
  });

  test('calculates correctly: 75kg/1.75m = 24.5', () => {
    expect(window.calcBMI()).toBe(24.5);
  });

  test('obese BMI: 120kg/1.70m = 41.5', () => {
    window.S.weight = 120; window.S.height = 170;
    expect(window.calcBMI()).toBe(41.5);
  });
});

// ─── bmiInfo TESTS ───
describe('bmiInfo', () => {
  test('null returns insufficient data', () => {
    expect(window.bmiInfo(null).grade).toBe('?');
  });

  test('NaN returns insufficient data', () => {
    expect(window.bmiInfo(NaN).grade).toBe('?');
  });

  test('BMI 22 is normal', () => {
    expect(window.bmiInfo(22).grade).toBe('N');
  });

  test('BMI 27 is overweight', () => {
    expect(window.bmiInfo(27).grade).toBe('S');
  });

  test('BMI 32 is obesity grade 1', () => {
    expect(window.bmiInfo(32).grade).toBe('O1');
  });

  test('BMI 37 is obesity grade 2', () => {
    expect(window.bmiInfo(37).grade).toBe('O2');
  });

  test('BMI 42 is obesity grade 3', () => {
    expect(window.bmiInfo(42).grade).toBe('O3');
  });

  test('BMI 15 is severe malnutrition', () => {
    expect(window.bmiInfo(15).grade).toBe('D3');
  });
});

// ─── Hydration TESTS ───
describe('calcHydration', () => {
  beforeEach(() => {
    window.S.weight = 75; window.S.sex = 'homme';
    window.S.activity = null; window.S.pregnant = false;
    window.S.medical = [];
  });

  test('returns null for no weight', () => {
    window.S.weight = 0;
    expect(window.calcHydration()).toBeNull();
  });

  test('base hydration is 35ml/kg', () => {
    var h = window.calcHydration();
    expect(h.base).toBe(75 * 35); // 2625ml
  });

  test('male minimum is 2500ml', () => {
    window.S.weight = 50; // base = 1750ml
    var h = window.calcHydration();
    expect(h.ml).toBeGreaterThanOrEqual(2500);
  });

  test('female minimum is 2000ml', () => {
    window.S.sex = 'femme';
    window.S.weight = 45; // base = 1575ml
    var h = window.calcHydration();
    expect(h.ml).toBeGreaterThanOrEqual(2000);
  });

  test('pregnancy adds 300ml', () => {
    window.S.pregnant = true;
    var hNormal = window.calcHydration();
    window.S.pregnant = false;
    var hBase = window.calcHydration();
    // Pregnancy should add 300ml (rounded to nearest 100)
    expect(hNormal.ml).toBeGreaterThanOrEqual(hBase.ml);
  });

  test('breastfeeding adds 700ml', () => {
    window.S.medical = ['allaitement'];
    var h = window.calcHydration();
    // Should include allait bonus
    expect(h.ml).toBeGreaterThan(2625); // base for 75kg
  });

  test('active people get hydration bonus', () => {
    window.S.activity = 3; // Très actif, factor 1.725
    var h = window.calcHydration();
    expect(h.actBonus).toBe(1000);
  });
});

// ─── Weight Projection TESTS ───
describe('calcWeightProjection', () => {
  beforeEach(() => {
    window.S.sex = 'homme'; window.S.age = 30;
    window.S.weight = 80; window.S.height = 180;
    window.S.activity = 2; window.S.sportDays = 3;
    window.S.goal = 2; window.S.targetWeight = null;
  });

  test('returns null when no target weight', () => {
    expect(window.calcWeightProjection()).toBeNull();
  });

  test('returns null when target equals current', () => {
    window.S.targetWeight = 80;
    expect(window.calcWeightProjection()).toBeNull();
  });

  test('projects weight loss', () => {
    window.S.goal = 3; // Cut
    window.S.targetWeight = 75;
    var proj = window.calcWeightProjection();
    expect(proj).not.toBeNull();
    expect(proj.weeks).toBeGreaterThan(0);
    expect(proj.weeklyChange).toBeLessThan(0);
    expect(proj.weeklyData[proj.weeklyData.length - 1].weight).toBe(75);
  });

  test('projects weight gain', () => {
    window.S.goal = 0; // Bulk
    window.S.targetWeight = 85;
    var proj = window.calcWeightProjection();
    expect(proj).not.toBeNull();
    expect(proj.weeklyChange).toBeGreaterThan(0);
  });

  test('clamps weight loss to max 1 kg/week', () => {
    window.S.goal = 4; // Sèche
    window.S.targetWeight = 60;
    var proj = window.calcWeightProjection();
    expect(proj.weeklyChange).toBeGreaterThanOrEqual(-1.0);
  });

  test('clamps weight gain to max 0.4 kg/week', () => {
    window.S.goal = 0;
    window.S.targetWeight = 100;
    var proj = window.calcWeightProjection();
    expect(proj.weeklyChange).toBeLessThanOrEqual(0.4);
  });
});

// ─── Alcohol weekly kcal TESTS ───
describe('alcoholWeeklyKcal', () => {
  test('returns 0 for no alcohol types', () => {
    window.S.alcoholTypes = [];
    expect(window.alcoholWeeklyKcal()).toBe(0);
  });

  test('calculates correctly for beer', () => {
    window.S.alcoholTypes = [{ type: 'Bière (33cl)', freq: 3 }];
    // 150 kcal * 3 = 450
    expect(window.alcoholWeeklyKcal()).toBe(450);
  });

  test('handles unknown drink types', () => {
    window.S.alcoholTypes = [{ type: 'Unknown Drink', freq: 5 }];
    expect(window.alcoholWeeklyKcal()).toBe(0);
  });
});

// ─── innerHTML Sanitization TESTS ───
describe('innerHTML sanitization (h function)', () => {
  test('blocks <script> tags', () => {
    var el = window.h('div', { html: '<script>alert(1)</script>' });
    expect(el.innerHTML).toBe('');
  });

  test('blocks onerror handler', () => {
    var el = window.h('div', { html: '<img onerror="alert(1)">' });
    expect(el.innerHTML).toBe('');
  });

  test('blocks case-insensitive script tags', () => {
    var el = window.h('div', { html: '<SCRIPT>alert(1)</SCRIPT>' });
    expect(el.innerHTML).toBe('');
  });

  test('blocks onload handler', () => {
    var el = window.h('div', { html: '<img onload="alert(1)">' });
    expect(el.innerHTML).toBe('');
  });

  test('blocks onclick handler', () => {
    var el = window.h('div', { html: '<div onclick="alert(1)">click</div>' });
    expect(el.innerHTML).toBe('');
  });

  test('blocks javascript: URLs', () => {
    var el = window.h('div', { html: '<a href="javascript:alert(1)">x</a>' });
    expect(el.innerHTML).toBe('');
  });

  test('blocks data:text/html URLs', () => {
    var el = window.h('div', { html: '<iframe src="data: text/html,<script>alert(1)</script>">' });
    expect(el.innerHTML).toBe('');
  });

  test('allows safe HTML', () => {
    var el = window.h('div', { html: '<b>Hello</b>' });
    expect(el.innerHTML).toBe('<b>Hello</b>');
  });

  test('sets textContent for string children', () => {
    var el = window.h('div', {}, 'Hello');
    expect(el.textContent).toBe('Hello');
  });
});

// ─── Meal Split TESTS ───
describe('getMealSplit', () => {
  beforeEach(() => {
    window.S.mealsPerDay = 3;
  });

  test('returns split for 3 meals', () => {
    var split = window.getMealSplit();
    expect(split).toBeDefined();
    expect(split.pctBreak + split.pctLunch + split.pctDinner).toBeCloseTo(1.0, 1);
  });

  test('returns split for 4 meals (with snack)', () => {
    window.S.mealsPerDay = 4;
    var split = window.getMealSplit();
    expect(split).toBeDefined();
    expect(split.pctSnack).toBeGreaterThan(0);
  });
});
