'use strict';

var fs   = require('fs');
var path = require('path');
var vm   = require('vm');

global.window = global;

function loadScript(relPath) {
  var src = fs.readFileSync(path.join(__dirname, '..', relPath), 'utf8');
  vm.runInThisContext(src, { filename: relPath });
}

loadScript('app/recipe-ux-engine.js');
loadScript('app/recipe-ux-explainer.js');
loadScript('app/recipe-auto-improver.js');

var RAI = window.RecipeAutoImprover;

// ── Helpers ────────────────────────────────────────────────────────────────────
var passed = 0, failed = 0;

function assert(label, condition) {
  if (condition) {
    passed++;
  } else {
    failed++;
    console.error('FAIL: ' + label);
  }
}

function assertEq(label, actual, expected) {
  if (actual === expected) {
    passed++;
  } else {
    failed++;
    console.error('FAIL: ' + label + ' — got ' + JSON.stringify(actual) + ', expected ' + JSON.stringify(expected));
  }
}

// ── Fixtures ───────────────────────────────────────────────────────────────────

// Recette haute qualité (peu d'améliorations nécessaires)
var HIGH_QUALITY = {
  name: 'Buddha Bowl Poulet Grillé',
  emoji: '🍗',
  mealTypes: ['lunch'],
  difficulty: 'easy',
  prepTime: 10, cookTime: 15,
  servings: 1,
  tags: ['meal-prep', 'protéiné', 'équilibré'],
  origin: 'Asie',
  ingredients: [
    { name: 'Poulet', quantity: 150, unit: 'g' },
    { name: 'Riz', quantity: 80, unit: 'g' },
    { name: 'Épinard', quantity: 50, unit: 'g' },
    { name: 'Carotte', quantity: 50, unit: 'g' },
    { name: 'Citron', quantity: 10, unit: 'ml' }
  ],
  baseNutrition: { calories: 520, proteinGrams: 42, carbsGrams: 55, fatGrams: 10 }
};

// Recette basse qualité (nombreuses améliorations possibles)
var LOW_QUALITY = {
  name: 'Salade verte',
  mealTypes: ['lunch'],
  difficulty: 'easy',
  prepTime: 10, cookTime: 0,
  servings: 1,
  ingredients: [
    { name: 'Laitue', quantity: 100, unit: 'g' },
    { name: 'Concombre', quantity: 80, unit: 'g' }
  ],
  baseNutrition: { calories: 40, proteinGrams: 2, carbsGrams: 6, fatGrams: 0.5 }
};

// Recette sans emoji, sans tags, avec profil gustatif plat et texture monotone
var NEEDS_IMPROVEMENT = {
  name: 'Poulet légumes',
  mealTypes: ['dinner'],
  difficulty: 'easy',
  prepTime: 20, cookTime: 0,
  servings: 2,
  tags: [],
  ingredients: [
    { name: 'Poulet', quantity: 200, unit: 'g' },
    { name: 'Courgette', quantity: 150, unit: 'g' },
    { name: 'Riz blanc', quantity: 100, unit: 'g' }
  ],
  baseNutrition: { calories: 740, proteinGrams: 60, carbsGrams: 80, fatGrams: 14 }
};

// Recette compacte (format L)
var COMPACT_RECIPE = {
  n: 'plat simple',
  k: 350, p: 8, g: 45, l: 12,
  mealTypes: ['dinner'],
  ingredients: [
    { name: 'Riz', quantity: 80, unit: 'g' },
    { name: 'Légumes', quantity: 100, unit: 'g' }
  ]
};

// DB multi-recettes
function makeDB(n, template) {
  var db = [];
  for (var i = 0; i < n; i++) {
    var r = JSON.parse(JSON.stringify(template || LOW_QUALITY));
    r.name = (r.name || 'Recette') + ' ' + (i + 1);
    db.push(r);
  }
  return db;
}

var DIVERSE_DB = makeDB(5, LOW_QUALITY).concat(makeDB(3, NEEDS_IMPROVEMENT)).concat([HIGH_QUALITY]);

// ── 1. EXPORTS ─────────────────────────────────────────────────────────────────

assert('RAI exporté', !!RAI);
assert('IMPROVEMENT_CATALOG est un tableau', Array.isArray(RAI.IMPROVEMENT_CATALOG));
assert('MACRO_TOLERANCE définie', !!RAI.MACRO_TOLERANCE);
assert('validateMacroSafety fonction', typeof RAI.validateMacroSafety === 'function');
assert('analyzeForImprovements fonction', typeof RAI.analyzeForImprovements === 'function');
assert('applyImprovement fonction', typeof RAI.applyImprovement === 'function');
assert('generateProposal fonction', typeof RAI.generateProposal === 'function');
assert('prioritizeRecipes fonction', typeof RAI.prioritizeRecipes === 'function');
assert('computeUrgency fonction', typeof RAI.computeUrgency === 'function');
assert('runDryRun fonction', typeof RAI.runDryRun === 'function');
assert('generateImprovementReport fonction', typeof RAI.generateImprovementReport === 'function');

// ── 2. IMPROVEMENT_CATALOG ─────────────────────────────────────────────────────

assert('Catalogue ≥8 entrées', RAI.IMPROVEMENT_CATALOG.length >= 8);

var autoSafe = RAI.IMPROVEMENT_CATALOG.filter(function(i) { return i.type === 'AUTO_SAFE'; });
var reviewReq = RAI.IMPROVEMENT_CATALOG.filter(function(i) { return i.type === 'REVIEW_REQUIRED'; });

assert('Au moins 4 AUTO_SAFE', autoSafe.length >= 4);
assert('Au moins 3 REVIEW_REQUIRED', reviewReq.length >= 3);

var ids = RAI.IMPROVEMENT_CATALOG.map(function(i) { return i.id; });
assert('ADD_EMOJI présent', ids.indexOf('ADD_EMOJI') >= 0);
assert('ADD_MEAL_PREP_TAG présent', ids.indexOf('ADD_MEAL_PREP_TAG') >= 0);
assert('IMPROVE_NAME présent', ids.indexOf('IMPROVE_NAME') >= 0);
assert('ADD_HERBS présent', ids.indexOf('ADD_HERBS') >= 0);
assert('ADD_LEMON_JUICE présent', ids.indexOf('ADD_LEMON_JUICE') >= 0);
assert('ADD_PARSLEY présent', ids.indexOf('ADD_PARSLEY') >= 0);
assert('ADD_SESAME présent', ids.indexOf('ADD_SESAME') >= 0);
assert('ADD_WALNUTS présent', ids.indexOf('ADD_WALNUTS') >= 0);
assert('ADD_COLORFUL_VEG présent', ids.indexOf('ADD_COLORFUL_VEG') >= 0);

// Chaque entrée a les champs obligatoires
RAI.IMPROVEMENT_CATALOG.forEach(function(imp) {
  assert('Imp ' + imp.id + ' a condition', typeof imp.condition === 'function');
  assert('Imp ' + imp.id + ' a apply', typeof imp.apply === 'function');
  assert('Imp ' + imp.id + ' a reason', typeof imp.reason === 'string');
  assert('Imp ' + imp.id + ' a macroDelta', !!imp.macroDelta);
});

// ── 3. MACRO_TOLERANCE ────────────────────────────────────────────────────────

assertEq('Tolérance calories 3%', RAI.MACRO_TOLERANCE.calories, 0.03);
assertEq('Tolérance protein 5%', RAI.MACRO_TOLERANCE.protein, 0.05);
assertEq('Tolérance carbs 5%', RAI.MACRO_TOLERANCE.carbs, 0.05);
assertEq('Tolérance fat 5%', RAI.MACRO_TOLERANCE.fat, 0.05);

// ── 4. HELPERS INTERNES ───────────────────────────────────────────────────────

// factorPresent
var fakeFactors = [{ key: 'HIGH_PROTEIN', impact: 15, message: 'test' }];
assert('factorPresent trouvé', RAI._factorPresent(fakeFactors, 'HIGH_PROTEIN'));
assert('factorPresent absent', !RAI._factorPresent(fakeFactors, 'MONO_TEXTURE'));

// hasIngredient
assert('hasIngredient sésame', RAI._hasIngredient({ ingredients: [{ name: 'Graines de sésame' }] }, /sésame/i));
assert('hasIngredient absent', !RAI._hasIngredient({ ingredients: [{ name: 'Poulet' }] }, /sésame/i));
assert('hasIngredient vide', !RAI._hasIngredient({}, /sésame/i));

// deepClone
var original = { a: 1, b: { c: 2 } };
var clone = RAI._deepClone(original);
clone.b.c = 99;
assert('deepClone indépendant', original.b.c === 2);

// getNutrPerServing — format baseNutrition
var nutr = RAI._getNutrPerServing(HIGH_QUALITY);
assert('getNutr calories/serving', nutr && nutr.calories === 520);
assert('getNutr protein/serving', nutr && nutr.protein === 42);

// getNutrPerServing — format compact
var nutrC = RAI._getNutrPerServing(COMPACT_RECIPE);
assert('getNutr compact calories', nutrC && nutrC.calories === 350);
assert('getNutr compact protein', nutrC && nutrC.protein === 8);

// getNutrPerServing — 2 servings
var nutr2 = RAI._getNutrPerServing(NEEDS_IMPROVEMENT);
assert('getNutr 2srv calories/srv', nutr2 && nutr2.calories === 370);
assert('getNutr 2srv protein/srv', nutr2 && nutr2.protein === 30);

// updateBaseNutrition — baseNutrition format
var r1 = RAI._deepClone(HIGH_QUALITY); // 1 serving
RAI._updateBaseNutrition(r1, { calories: 10, protein: 1, carbs: 2, fat: 0.5 });
assert('updateBN calories +10', Math.round(r1.baseNutrition.calories) === 530);
assert('updateBN protein +1', Math.round(r1.baseNutrition.proteinGrams) === 43);

// updateBaseNutrition — 2 servings (delta is PER SERVING → ×2 total)
var r2 = RAI._deepClone(NEEDS_IMPROVEMENT); // 2 servings
RAI._updateBaseNutrition(r2, { calories: 10, protein: 1, carbs: 2, fat: 0.5 });
assert('updateBN 2srv calories +20 total', Math.round(r2.baseNutrition.calories) === 760);
assert('updateBN 2srv protein +2 total', Math.round(r2.baseNutrition.proteinGrams) === 62);

// updateBaseNutrition — compact format
var r3 = RAI._deepClone(COMPACT_RECIPE);
RAI._updateBaseNutrition(r3, { calories: 5, protein: 0.5, carbs: 1, fat: 0.2 });
assert('updateBN compact calories', Math.round(r3.k) === 355);
assert('updateBN compact protein', Math.abs(r3.p - 8.5) < 0.01);

// guessEmoji
assert('guessEmoji poulet', /🍗/.test(RAI._guessEmoji({ name: 'Poulet légumes', ingredients: [] })));
assert('guessEmoji saumon', /🐟/.test(RAI._guessEmoji({ name: 'Saumon grillé', ingredients: [] })));
assert('guessEmoji riz', /🍚/.test(RAI._guessEmoji({ name: 'Riz thaï', ingredients: [] })));
assert('guessEmoji soupe', /🍲/.test(RAI._guessEmoji({ name: 'Soupe légumes', ingredients: [] })));
assert('guessEmoji par défaut', !!RAI._guessEmoji({ name: 'Mystère', ingredients: [] }));

// enhanceName
assert('enhanceName salade verte → descriptif', RAI._enhanceName({ ingredients: [] }, 'salade verte') !== 'salade verte');
assert('enhanceName plat simple → descriptif', RAI._enhanceName({ ingredients: [] }, 'plat simple') !== 'plat simple');
assert('enhanceName conserve suffixe', RAI._enhanceName({ ingredients: [] }, 'XYZ inconnu').indexOf('Maison') >= 0);

// ── 5. VALIDATE MACRO SAFETY ─────────────────────────────────────────────────

// Même recette → safe
var macroSame = RAI.validateMacroSafety(HIGH_QUALITY, RAI._deepClone(HIGH_QUALITY));
assert('macroSafe même recette', macroSame.safe);

// Ajout herbes (+1.5 kcal / 520 kcal = 0.29%) → safe
var withHerbs = RAI._deepClone(HIGH_QUALITY);
RAI._updateBaseNutrition(withHerbs, { calories: 1.5, protein: 0.05, carbs: 0.3, fat: 0.03 });
var macroHerbs = RAI.validateMacroSafety(HIGH_QUALITY, withHerbs);
assert('macroSafe herbs (0.3%)', macroHerbs.safe);

// Ajout noix (+65 kcal / 520 = 12.5%) → violation
var withWalnuts = RAI._deepClone(HIGH_QUALITY);
RAI._updateBaseNutrition(withWalnuts, { calories: 65, protein: 1.5, carbs: 1.4, fat: 6.5 });
var macroWalnuts = RAI.validateMacroSafety(HIGH_QUALITY, withWalnuts);
assert('macroViolation noix (12.5%)', !macroWalnuts.safe);
assert('macroViolation noix identifie calories', macroWalnuts.violations.indexOf('calories') >= 0);

// Recette sans nutrition → safe (pas de données)
var macroNoNutr = RAI.validateMacroSafety({ name: 'X', ingredients: [] }, { name: 'X2', ingredients: [] });
assert('macroSafe sans nutrition', macroNoNutr.safe);

// Deltas calculés correctement
assert('macroDeltas présents', macroHerbs.deltas && macroHerbs.deltas.calories !== undefined);
assert('macroDelta calories positif', macroHerbs.deltas.calories.delta >= 0);

// ── 6. ANALYZE FOR IMPROVEMENTS ──────────────────────────────────────────────

var analysisLow = RAI.analyzeForImprovements(LOW_QUALITY);
assert('analyzeForImprove retourne recipe', !!analysisLow.recipe);
assert('analyzeForImprove retourne factors', !!analysisLow.factors);
assert('analyzeForImprove retourne applicable', Array.isArray(analysisLow.applicable));
assert('LOW_QUALITY a des améliorations', analysisLow.applicable.length > 0);

var analysisHigh = RAI.analyzeForImprovements(HIGH_QUALITY);
// HIGH_QUALITY has fewer AUTO_SAFE improvements targeting negative factors
var highAutoSafeNeg = analysisHigh.applicable.filter(function(a) { return a.type === 'AUTO_SAFE'; }).length;
var lowAutoSafeNeg  = analysisLow.applicable.filter(function(a) { return a.type === 'AUTO_SAFE'; }).length;
assert('HIGH_QUALITY moins d\'AUTO_SAFE que LOW_QUALITY', highAutoSafeNeg <= lowAutoSafeNeg);

// Structure d'une amélioration applicable
if (analysisLow.applicable.length > 0) {
  var a = analysisLow.applicable[0];
  assert('applicable a id', typeof a.id === 'string');
  assert('applicable a type', a.type === 'AUTO_SAFE' || a.type === 'REVIEW_REQUIRED');
  assert('applicable a reason', typeof a.reason === 'string');
  assert('applicable a macroDelta', !!a.macroDelta);
}

// ── 7. APPLY IMPROVEMENT ─────────────────────────────────────────────────────

// Appliquer ADD_EMOJI sur recette sans emoji
var recNoEmoji = RAI._deepClone(NEEDS_IMPROVEMENT);
var emojiResult = RAI.applyImprovement(recNoEmoji, 'ADD_EMOJI');
assert('applyImprovement applied=true', emojiResult.applied);
assert('applyImprovement emoji présent', !!emojiResult.improved.emoji);
assert('applyImprovement non-destructif (original intact)', !recNoEmoji.emoji);

// ADD_EMOJI sur recette qui en a déjà un → not applied
var recWithEmoji = RAI._deepClone(HIGH_QUALITY); // a déjà emoji
var emojiResult2 = RAI.applyImprovement(recWithEmoji, 'ADD_EMOJI');
assert('applyImprovement emoji déjà présent → non appliqué', !emojiResult2.applied);

// ADD_MEAL_PREP_TAG
var recNoTag = RAI._deepClone(NEEDS_IMPROVEMENT); // prepTime=20, cookTime=0, pas de meal-prep
var tagResult = RAI.applyImprovement(recNoTag, 'ADD_MEAL_PREP_TAG');
assert('applyImprovement meal-prep applied', tagResult.applied);
assert('applyImprovement meal-prep tag ajouté', tagResult.improved.tags.indexOf('meal-prep') >= 0);
assert('applyImprovement macroCheck safe (tags)', tagResult.macroCheck.safe);

// ADD_HERBS sur recette avec profil gustatif plat
var recFlatFlavor = RAI._deepClone(LOW_QUALITY);
var herbsResult = RAI.applyImprovement(recFlatFlavor, 'ADD_HERBS');
// LOW_QUALITY peut ou non avoir FLAT_FLAVOR selon le nombre d'ingrédients
if (herbsResult.applied) {
  assert('applyImprovement herbs ingrédient ajouté', herbsResult.improved.ingredients.length > recFlatFlavor.ingredients.length);
  assert('applyImprovement herbs macroCheck', !!herbsResult.macroCheck);
  assert('applyImprovement herbs macro safe', herbsResult.macroCheck.safe);
}

// ADD_SESAME (REVIEW_REQUIRED) — vérifier que la macro n'est pas safe sur petite recette
var recMonoTex = {
  name: 'Riz vapeur',
  mealTypes: ['lunch'],
  servings: 1,
  ingredients: [{ name: 'Riz', quantity: 100, unit: 'g' }],
  baseNutrition: { calories: 130, proteinGrams: 3, carbsGrams: 28, fatGrams: 0.5 }
};
var sesameResult = RAI.applyImprovement(RAI._deepClone(recMonoTex), 'ADD_SESAME');
if (sesameResult.applied) {
  // 29 kcal / 130 kcal = 22% → violation calories
  assert('ADD_SESAME macro violation sur petite recette', !sesameResult.macroCheck.safe);
}

// Amélioration inconnue → erreur
var threw = false;
try { RAI.applyImprovement({}, 'INEXISTANT'); } catch(e) { threw = true; }
assert('applyImprovement inconnue → throw', threw);

// ── 8. IMPROVE_NAME ──────────────────────────────────────────────────────────

var recGenericName = {
  name: 'poulet légumes',
  mealTypes: ['dinner'],
  servings: 1,
  ingredients: [{ name: 'Poulet' }, { name: 'Courgette' }],
  baseNutrition: { calories: 400, proteinGrams: 35, carbsGrams: 30, fatGrams: 12 }
};
var nameResult = RAI.applyImprovement(RAI._deepClone(recGenericName), 'IMPROVE_NAME');
if (nameResult.applied) {
  assert('IMPROVE_NAME nouveau nom différent', nameResult.improved.name !== recGenericName.name);
  assert('IMPROVE_NAME macro safe (nom)', nameResult.macroCheck.safe);
}

// ── 9. GENERATE PROPOSAL ─────────────────────────────────────────────────────

var proposal = RAI.generateProposal(NEEDS_IMPROVEMENT);
assert('proposal a recipeName', typeof proposal.recipeName === 'string');
assert('proposal a applied', Array.isArray(proposal.applied));
assert('proposal a rejected', Array.isArray(proposal.rejected));
assert('proposal a reviewRequired', Array.isArray(proposal.reviewRequired));
assert('proposal a improved', !!proposal.improved);
assert('proposal a macroFinal', !!proposal.macroFinal);

// Les AUTO_SAFE appliquées sont toutes macro-safe
proposal.applied.forEach(function(a) {
  assert('proposal applied ' + a.id + ' macro safe', a.macroCheck.safe);
});

// Recette haute qualité → peu ou pas d'améliorations
var proposalHQ = RAI.generateProposal(HIGH_QUALITY);
var totalHQ = proposalHQ.applied.length + proposalHQ.reviewRequired.length;
assert('HIGH_QUALITY proposal peu d\'améliorations', totalHQ < 5);

// scoresBefore/scoresAfter présents si RecipeUXExplainer disponible
assert('proposal scoresBefore ou null', proposal.scoresBefore == null || typeof proposal.scoresBefore === 'object');

// ── 10. COMPUTE URGENCY ───────────────────────────────────────────────────────

var urgencyLow  = RAI.computeUrgency(LOW_QUALITY);
var urgencyHigh = RAI.computeUrgency(HIGH_QUALITY);
assert('urgency LOW_QUALITY > 0', urgencyLow > 0);
assert('urgency HIGH_QUALITY < LOW_QUALITY', urgencyHigh < urgencyLow);
assert('urgency est un nombre', typeof urgencyLow === 'number');

// ── 11. PRIORITIZE RECIPES ────────────────────────────────────────────────────

var prioritized = RAI.prioritizeRecipes(DIVERSE_DB);
assert('prioritizeRecipes retourne tableau', Array.isArray(prioritized));
assert('prioritizeRecipes triées par urgence (desc)', prioritized.length < 2 ||
  prioritized[0].urgency >= prioritized[prioritized.length - 1].urgency);

// Chaque entrée a recipe + urgency
if (prioritized.length > 0) {
  assert('prioritized a recipe', !!prioritized[0].recipe);
  assert('prioritized a urgency', typeof prioritized[0].urgency === 'number');
  assert('prioritized urgency > 0', prioritized[0].urgency > 0);
}

// Format db objet {recipes:[]}
var dbObj = { recipes: DIVERSE_DB };
var prioritized2 = RAI.prioritizeRecipes(dbObj);
assert('prioritizeRecipes depuis objet db', Array.isArray(prioritized2));

// ── 12. RUN DRY RUN ──────────────────────────────────────────────────────────

var dryRun = RAI.runDryRun(DIVERSE_DB, { top: 5 });
assert('dryRun retourne totalRecipes', dryRun.totalRecipes === DIVERSE_DB.length);
assert('dryRun retourne analyzed ≤ 5', dryRun.analyzed <= 5);
assert('dryRun proposals Array', Array.isArray(dryRun.proposals));
assert('dryRun proposals.length ≤ analyzed', dryRun.proposals.length <= dryRun.analyzed);
assert('dryRun summary auto Applied ≥ 0', dryRun.summary.autoApplied >= 0);
assert('dryRun summary reviewRequired ≥ 0', dryRun.summary.reviewRequired >= 0);
assert('dryRun summary rejected ≥ 0', dryRun.summary.rejected >= 0);

// Dry-run ne modifie pas les recettes originales
var origName = DIVERSE_DB[0].name;
RAI.runDryRun(DIVERSE_DB, { top: 3 });
assert('dryRun non-destructif', DIVERSE_DB[0].name === origName);

// Format db objet
var dryRun2 = RAI.runDryRun({ recipes: DIVERSE_DB }, { top: 3 });
assert('dryRun depuis objet db', dryRun2.totalRecipes === DIVERSE_DB.length);

// top=1
var dryRun1 = RAI.runDryRun(DIVERSE_DB, { top: 1 });
assert('dryRun top=1 → analyzed≤1', dryRun1.analyzed <= 1);

// ── 13. GENERATE IMPROVEMENT REPORT ─────────────────────────────────────────

var report = RAI.generateImprovementReport(dryRun);
assert('report est une string', typeof report === 'string');
assert('report contient "AMÉLIORATION"', report.indexOf('AMÉLIORATION') >= 0 || report.indexOf('AUTO') >= 0);
assert('report contient AUTO_SAFE', report.indexOf('AUTO_SAFE') >= 0 || report.indexOf('AUTO') >= 0);
assert('report non vide', report.length > 100);

// Report avec summary complet
var bigDryRun = RAI.runDryRun(DIVERSE_DB, { top: 10 });
var bigReport = RAI.generateImprovementReport(bigDryRun);
assert('bigReport non vide', bigReport.length > 200);

// ── 14. INVARIANTS MACRO SAFETY ──────────────────────────────────────────────

// ADD_HERBS (1.5 kcal) sur recette 500+ kcal → safe
var rec500 = {
  name: 'Déjeuner', mealTypes: ['lunch'], servings: 1,
  ingredients: [{ name: 'Poulet' }, { name: 'Riz' }],
  baseNutrition: { calories: 500, proteinGrams: 40, carbsGrams: 50, fatGrams: 10 }
};
var cloned500 = RAI._deepClone(rec500);
RAI._updateBaseNutrition(cloned500, { calories: 1.5, protein: 0.05, carbs: 0.3, fat: 0.03 });
var check500 = RAI.validateMacroSafety(rec500, cloned500);
assert('ADD_HERBS 1.5kcal/500kcal safe (0.3%)', check500.safe);

// ADD_LEMON_JUICE (2.5 kcal) sur recette 300 kcal → safe (0.8%)
var rec300 = {
  name: 'Snack', mealTypes: ['snack'], servings: 1,
  ingredients: [{ name: 'Fromage blanc' }],
  baseNutrition: { calories: 300, proteinGrams: 20, carbsGrams: 30, fatGrams: 5 }
};
var cloned300 = RAI._deepClone(rec300);
RAI._updateBaseNutrition(cloned300, { calories: 2.5, protein: 0.05, carbs: 0.65, fat: 0 });
var check300 = RAI.validateMacroSafety(rec300, cloned300);
assert('ADD_LEMON_JUICE 2.5kcal/300kcal safe (0.8%)', check300.safe);

// ADD_SESAME (29 kcal) sur recette 200 kcal → violation (14.5%)
var rec200 = {
  name: 'Mini repas', mealTypes: ['snack'], servings: 1,
  ingredients: [{ name: 'Riz' }],
  baseNutrition: { calories: 200, proteinGrams: 5, carbsGrams: 40, fatGrams: 1 }
};
var cloned200 = RAI._deepClone(rec200);
RAI._updateBaseNutrition(cloned200, { calories: 29, protein: 0.9, carbs: 1.2, fat: 2.5 });
var check200 = RAI.validateMacroSafety(rec200, cloned200);
assert('ADD_SESAME 29kcal/200kcal → violation', !check200.safe);

// ADD_SESAME (29 kcal) sur recette 1000 kcal : fat +2.5g/25g = 10% → violation fat même si calories ok
var rec1000 = {
  name: 'Grand repas', mealTypes: ['lunch'], servings: 1,
  ingredients: [{ name: 'Poulet' }, { name: 'Riz' }],
  baseNutrition: { calories: 1000, proteinGrams: 70, carbsGrams: 100, fatGrams: 25 }
};
var cloned1000 = RAI._deepClone(rec1000);
RAI._updateBaseNutrition(cloned1000, { calories: 29, protein: 0.9, carbs: 1.2, fat: 2.5 });
var check1000 = RAI.validateMacroSafety(rec1000, cloned1000);
assert('ADD_SESAME 1000kcal calories ok (2.9%)', check1000.deltas.calories.delta < 3);
assert('ADD_SESAME 1000kcal fat violation (10%)', check1000.violations.indexOf('fat') >= 0);

// ── FIN ───────────────────────────────────────────────────────────────────────

console.log('\n[unit-recipe-auto-improver] ' + passed + ' passed, ' + failed + ' failed');
if (failed > 0) process.exit(1);
