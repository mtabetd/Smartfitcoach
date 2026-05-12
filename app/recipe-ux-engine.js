(function() {
'use strict';

// ─── RECIPE UX ENGINE ────────────────────────────────────────────────────────
// Simule l'expérience utilisateur réelle : satiété psychologique, plaisir
// alimentaire, charge mentale, adhérence long terme, expérience premium.
// Fournit aussi la classification par sévérité des codes de validation
// et la détection des exceptions légitimes (EXPECTED_EXCEPTION).
// ─────────────────────────────────────────────────────────────────────────────

// ── SEVERITY TIERS ────────────────────────────────────────────────────────────

var SEVERITY_TIERS = Object.freeze({
  CRITICAL: 'critical',          // bloque la production
  HIGH:     'high',              // doit être corrigé
  MEDIUM:   'medium',            // devrait être corrigé
  LOW:      'low',               // amélioration souhaitée
  INFO:     'info',              // informatif
  EXPECTED: 'expected_exception' // patron connu, exception légitime
});

// Mapping code → tier
var CODE_TIERS = {
  // CRITICAL — production-blocking
  STRUCT_NO_ID:          'critical',
  STRUCT_NO_NAME:        'critical',
  STRUCT_NO_NUTRITION:   'critical',
  STRUCT_BAD_CAL:        'critical',
  ING_EMPTY_NAME:        'critical',
  ING_NEGATIVE_QTY:      'critical',
  SCALE_NEGATIVE:        'critical',
  UX_EGG_IN_GRAMS:       'critical',
  // HIGH — must fix
  NUTR_ZERO_CAL:         'high',
  NUTR_NEGATIVE_MACRO:   'high',
  NUTR_MACRO_INCOHERENT: 'high',
  ING_FORBIDDEN_UNIT:    'high',
  NUTR_CAL_TOO_HIGH:     'high',
  REG_UNIT_ERROR:        'high',
  // MEDIUM — should fix
  STRUCT_NO_STEPS:       'medium',
  STRUCT_NO_MEALTYPES:   'medium',
  STRUCT_NO_INGREDIENTS: 'medium',
  STRUCT_BAD_SERVINGS:   'medium',
  NUTR_CAL_TOO_LOW:      'medium',
  ING_INVALID_UNIT:      'medium',
  ING_NO_QTY:            'medium',
  ING_ZERO_QTY:          'medium',
  ING_NO_UNIT:           'medium',
  ING_DUPLICATE:         'medium',
  UX_WEIRD_FRACTION:     'medium',
  UX_ABSURD_AVOCAT:      'medium',
  // LOW — nice to fix
  ING_NATURAL_UNIT:      'low',
  UX_LIGATURE:           'low',
  UX_TINY_OIL:           'low',
  UX_DUPLICATED_WORD:    'low',
  LING_ALL_CAPS:         'low',
  LING_LOWERCASE_START:  'low',
  REG_QTY_WARN:          'low',
  // INFO
  STRUCT_NO_ING:         'info'
};

function getTier(code) { return CODE_TIERS[code] || 'info'; }

// ── EXPECTED EXCEPTIONS ────────────────────────────────────────────────────────
// Patrons légitimes qui ne doivent pas être pénalisés par les checks UX.
// Une exception supprime des flags précis pour les recettes correspondantes.

var EXPECTED_EXCEPTIONS = [
  {
    id:       'CONDIMENT',
    match:    function(r) { return /vinaigrette|sauce\s|condiment|dressing|marinade\b/i.test(r.name || ''); },
    suppress: ['NUTR_CAL_TOO_LOW', 'NO_PROTEIN_SOURCE', 'LOW_PROTEIN_PORTION', 'INSUFFICIENT_SATIETY'],
    reason:   'Condiment — faibles calories et absence protéine normaux'
  },
  {
    id:       'DESSERT_SNACK',
    match:    function(r) {
      return (r.mealTypes || []).indexOf('snack') >= 0 &&
             /dessert|gâteau|cake|biscuit|mousse|glace|sorbet|cookie|brownie/i.test(r.name || '');
    },
    suppress: ['NO_PROTEIN_SOURCE', 'LOW_PROTEIN_PORTION'],
    reason:   'Dessert/snack sucré — absence protéine acceptée'
  },
  {
    id:       'SUPPLEMENT',
    match:    function(r) { return /whey|protéin.shake|shake protéin|booster|pré.entraîn|post.training/i.test(r.name || ''); },
    suppress: ['INSUFFICIENT_SATIETY', 'NO_VEGETABLES', 'NUTR_CAL_TOO_LOW'],
    reason:   'Supplément — profil nutritionnel atypique volontaire'
  },
  {
    id:       'BOISSON',
    match:    function(r) { return /^(boisson|infusion|thé\b|tisane|eau aromatisée|smoothie détox|jus\b)/i.test(r.name || ''); },
    suppress: ['NUTR_CAL_TOO_LOW', 'NO_PROTEIN_SOURCE', 'LOW_PROTEIN_PORTION', 'PORTION_FRUSTRATING'],
    reason:   'Boisson — calories basses et absence macros normaux'
  }
];

function getExpectedException(recipe) {
  var name = recipe.name || recipe.n || '';
  for (var i = 0; i < EXPECTED_EXCEPTIONS.length; i++) {
    if (EXPECTED_EXCEPTIONS[i].match({ name: name, mealTypes: recipe.mealTypes || [] })) {
      return EXPECTED_EXCEPTIONS[i];
    }
  }
  return null;
}

function applyExceptions(recipe, flags) {
  var exc = getExpectedException(recipe);
  if (!exc) return { flags: flags, exception: null };
  var filtered = flags.filter(function(f) { return exc.suppress.indexOf(f.type) < 0; });
  return { flags: filtered, exception: exc };
}

// ── UX SCORE WEIGHTS ──────────────────────────────────────────────────────────

var UX_WEIGHTS = Object.freeze({
  satietyUX:        0.22,
  foodPleasure:     0.20,
  mentalLoad:       0.15,
  varietyPotential: 0.13,
  adherence:        0.20,
  premiumFeel:      0.10
});

// ── KNOWLEDGE BASES ────────────────────────────────────────────────────────────

var PLEASURE_INGREDIENTS = /avocat|fromage|noix|amande|noisette|pistache|saumon|thon|crevette|bœuf|boeuf|agneau|parmesan|mozzarella|burrata|ricotta|mangue|fraise|framboise|myrtille|chocolat.noir|tahini|houmous|pesto|tapenade/i;

var FIBER_RICH = /lentille|pois.chiche|haricot\b|flocons.d.avoine|son\b|seigle|blé.complet|avoine|épinard|brocoli|chou\b|artichaut|patate.douce|courge|butternut|chia|lin\b/i;

var HARD_TO_FIND = /galanga|kaffir|tomatillo|edamame.frais|wasabi.frais|truffe\b|oursin\b|homard\b|langoustine|foie.gras/i;

var TECHNICAL_SKILLS = /julienne|brunoise|blanchir|flamber|déglac|monter.en.neige|tempérer|clarifier|émulsionner|pocher\b/i;

var PLEASURE_TECHNIQUES = /grillé|mariné|rôti|caramélisé|croustillant|doré|fondant|moelleux/i;

var GENERIC_NAMES = /^(salade verte\b|poulet légumes\b|riz blanc\b|pasta\b|pâtes simples\b|soupe légumes\b|légumes sautés\b|recette simple\b|plat simple\b|meal\b|food\b)/i;

var PREMIUM_NAMES = /bowl|tartare|carpaccio|buddha|poke|wrap|burrito|tagine|curry|risotto|paella|ramen|pho|shakshuka|açaí|granola|overnight|smoothie.bowl|buddha|bento/i;

var PROTEIN_SOURCES = /poulet|dinde|boeuf|bœuf|porc|agneau|veau|thon|saumon|cabillaud|sardine|maquereau|crevette|moule|oeuf|œuf|lentille|pois.chiche|haricot|tofu|seitan|tempeh|fromage blanc|yaourt.grec|cottage/i;

var VEGETABLE_SOURCES = /tomate|concombre|courgette|carotte|brocoli|épinard|epinard|laitue|salade\b|poivron|oignon|champignon|haricot.vert|petit.pois|asperge|chou\b|céleri|celeri|fenouil|aubergine|roquette|avocat|patate.douce|courge/i;

var KCAL_TARGETS = Object.freeze({
  breakfast: { min: 250, ideal: 420, max: 600 },
  lunch:     { min: 350, ideal: 550, max: 750 },
  dinner:    { min: 300, ideal: 500, max: 700 },
  snack:     { min: 80,  ideal: 200, max: 350 }
});

// ── HELPERS ────────────────────────────────────────────────────────────────────

function clamp(v, lo, hi) { return Math.min(hi, Math.max(lo, Math.round(v))); }

function getNutr(recipe) {
  if (recipe.baseNutrition) {
    var bn = recipe.baseNutrition, s = recipe.servings || 1;
    return {
      calories: Math.round(bn.calories / s),
      protein:  (bn.proteinGrams || 0) / s,
      carbs:    (bn.carbsGrams   || 0) / s,
      fat:      (bn.fatGrams     || 0) / s
    };
  }
  if (recipe.k != null) {
    return { calories: recipe.k, protein: recipe.p || 0, carbs: recipe.g || 0, fat: recipe.l || 0 };
  }
  return null;
}

function getMealType(recipe) {
  var t = recipe.mealTypes || [];
  return t.indexOf('breakfast') >= 0 ? 'breakfast' :
         t.indexOf('lunch')     >= 0 ? 'lunch'     :
         t.indexOf('dinner')    >= 0 ? 'dinner'    :
         t.indexOf('snack')     >= 0 ? 'snack'     : 'lunch';
}

function ingStr(recipe) {
  return (Array.isArray(recipe.ingredients) ? recipe.ingredients : [])
    .map(function(i) { return (i.name || '').toLowerCase(); }).join(' ');
}

function ingCount(recipe) {
  return Array.isArray(recipe.ingredients) ? recipe.ingredients.length : 0;
}

// ── 1. SATIETY UX ──────────────────────────────────────────────────────────────
// Satiété psychologique — volume apparent, textures, densité nutritive,
// fibres, et cohérence calorique avec le type de repas.

function scoreSatietyUX(recipe) {
  var nutr  = getNutr(recipe);
  var is    = ingStr(recipe);
  var n     = ingCount(recipe);
  var score = 35;

  if (!nutr) return score;

  // Protéines — premier moteur de satiété physique et psychologique
  if      (nutr.protein >= 40) score += 32;
  else if (nutr.protein >= 30) score += 25;
  else if (nutr.protein >= 20) score += 18;
  else if (nutr.protein >= 12) score += 10;
  else if (nutr.protein >= 6)  score += 4;

  // Fibres alimentaires (satiété lente)
  if (FIBER_RICH.test(is))           score += 18;
  else if (VEGETABLE_SOURCES.test(is)) score += 10;

  // Lipides modérés (ralentissent la digestion)
  if (nutr.fat >= 10 && nutr.fat <= 35) score += 10;

  // Volume apparent — beaucoup d'ingrédients = assiette perçue plus remplie
  if (n >= 6)  score += 8;
  if (n >= 10) score += 4;

  // Calories dans la plage du type de repas
  var t = KCAL_TARGETS[getMealType(recipe)] || KCAL_TARGETS.lunch;
  if (nutr.calories >= t.min)          score += 12;
  else if (nutr.calories < t.min * 0.65) score -= 15;

  // Soupe/bouillon : moins rassasiant perçu qu'un plat solide
  var name = (recipe.name || recipe.n || '').toLowerCase();
  if (/soupe|bouillon|gaspacho|velouté/i.test(name)) score -= 8;

  return clamp(score, 0, 100);
}

// ── 2. FOOD PLEASURE ──────────────────────────────────────────────────────────
// Plaisir alimentaire : appétence, équilibre des saveurs, nom évocateur,
// techniques de cuisson appétissantes, diversité textures.

function scoreFoodPleasure(recipe) {
  var name  = recipe.name || recipe.n || '';
  var is    = ingStr(recipe);
  var steps = (recipe.steps || []).join(' ').toLowerCase();
  var score = 40;

  // Nom : évocateur, appétissant
  if (PREMIUM_NAMES.test(name))      score += 20;
  else if (GENERIC_NAMES.test(name)) score -= 15;
  else if (name.length >= 10)        score += 8;

  // Ingrédients plaisir
  if (PLEASURE_INGREDIENTS.test(is)) score += 18;

  // Techniques appétissantes
  if (PLEASURE_TECHNIQUES.test(is + ' ' + steps)) score += 12;

  // Origine identifiable (authenticité)
  if (recipe.origin) score += 8;

  // Emoji (signal visuel premium)
  if (recipe.emoji) score += 5;

  // Contraste de textures : croquant + fondant = plaisir maximal
  var hasCrunchy = /noix|amandes|noisettes|graines|croustillant|granola|toast|sésame|cacahuètes/i.test(is);
  var hasSoft    = /purée|mousse|fromage.blanc|yaourt|crème\b|compote/i.test(is + ' ' + name);
  if (hasCrunchy && hasSoft) score += 8;
  else if (hasCrunchy)       score += 4;

  // Protéine = plaisir + satiété émotionnelle
  if (PROTEIN_SOURCES.test(is)) score += 5;

  return clamp(score, 0, 100);
}

// ── 3. MENTAL LOAD ────────────────────────────────────────────────────────────
// Charge mentale (inversée : 100 = facile) : liste de courses, techniques,
// équipement, temps actif, ingrédients rares.

function scoreMentalLoad(recipe) {
  var n     = ingCount(recipe);
  var total = (recipe.prepTime || 0) + (recipe.cookTime || 0);
  var score = 80;

  // Nombre d'ingrédients — charge courses + organisation
  if      (n > 15) score -= 25;
  else if (n > 10) score -= 15;
  else if (n > 7)  score -= 8;
  else if (n <= 4) score += 10;

  // Temps total
  if      (total > 90)              score -= 25;
  else if (total > 60)              score -= 18;
  else if (total > 45)              score -= 10;
  else if (total > 30)              score -= 5;
  else if (total <= 15 && total > 0) score += 10;

  // Ingrédients difficiles à trouver
  if (HARD_TO_FIND.test(ingStr(recipe))) score -= 15;

  // Techniques complexes dans les étapes
  var steps = (recipe.steps || []).join(' ').toLowerCase();
  if (TECHNICAL_SKILLS.test(steps)) score -= 12;

  // Difficulté déclarée
  if      (recipe.difficulty === 'hard'   || recipe.difficulty === 'difficile') score -= 10;
  else if (recipe.difficulty === 'easy'   || recipe.difficulty === 'facile')    score += 8;

  // Meal-prep = charge répartie (bonus)
  var tags = (recipe.tags || []).join(' ');
  if (/meal.prep|batch|à.l.avance/i.test(tags + ' ' + steps)) score += 12;

  return clamp(score, 0, 100);
}

// ── 4. VARIETY POTENTIAL ──────────────────────────────────────────────────────
// Potentiel de variété : peut-on manger ça souvent sans lassitude ?

function scoreVarietyPotential(recipe) {
  var name  = recipe.name || recipe.n || '';
  var is    = ingStr(recipe);
  var score = 55;

  // Profil aromatique marqué = identité forte = résiste à la lassitude
  var aromaCount = [
    /sauce.soja|tamari|gingembre\b|citronnelle/i,
    /origan|basilic|câpre|feta|tapenade/i,
    /ras.el.hanout|harissa\b|cumin\b|cannelle/i,
    /avocat|citron.vert|coriandre/i
  ].filter(function(rx) { return rx.test(is); }).length;
  score += aromaCount * 8;

  // Ingrédients peu saisonniers = applicable toute l'année
  if (!/fraise\b|framboise\b|asperge\b|artichaut\b|endive\b/i.test(is)) score += 6;

  // Nom premium évocateur = moins de lassitude visuelle
  if (PREMIUM_NAMES.test(name))      score += 10;
  else if (GENERIC_NAMES.test(name)) score -= 12;

  // Personalisation possible (toppings, variantes)
  if (/topping|garniture|facultatif|au choix/i.test(is + ' ' + (recipe.steps || []).join(' '))) score += 8;

  // Meal-prep = flexibilité d'utilisation
  if (Array.isArray(recipe.tags) && recipe.tags.indexOf('meal-prep') >= 0) score += 8;

  // Densité nutritive suffisante = peut être répété sans carence
  var nutr = getNutr(recipe);
  if (nutr && nutr.protein >= 20 && VEGETABLE_SOURCES.test(is)) score += 8;

  return clamp(score, 0, 100);
}

// ── 5. ADHERENCE ──────────────────────────────────────────────────────────────
// Probabilité qu'un humain réel maintienne cette recette sur plusieurs mois.
// Combine satiété + plaisir + charge mentale + portion réaliste + accessibilité.

function scoreAdherence(recipe) {
  var sat   = scoreSatietyUX(recipe);
  var pleas = scoreFoodPleasure(recipe);
  var load  = scoreMentalLoad(recipe);
  var score = Math.round(sat * 0.30 + pleas * 0.30 + load * 0.25);

  var nutr = getNutr(recipe);
  if (nutr) {
    var t = KCAL_TARGETS[getMealType(recipe)] || KCAL_TARGETS.lunch;
    if (nutr.calories >= t.min && nutr.calories <= t.max) score += 12;
    else if (nutr.calories < t.min * 0.65) score -= 15; // risque abandon (trop restrictif)
    else if (nutr.calories > t.max * 1.5)  score -= 8;  // trop lourd sur la durée

    // Équilibre macros = pas de frustration métabolique
    if (nutr.protein >= 15 && nutr.carbs >= 20 && nutr.fat >= 8) score += 8;
  }

  // Ingrédients accessibles
  if (!HARD_TO_FIND.test(ingStr(recipe))) score += 5;

  return clamp(score, 0, 100);
}

// ── 6. PREMIUM FEEL ────────────────────────────────────────────────────────────
// Ressemble-t-on à une app fitness générique ou à une plateforme
// nutrition haut de gamme ?

function scorePremiumFeel(recipe) {
  var name  = recipe.name || recipe.n || '';
  var is    = ingStr(recipe);
  var steps = recipe.steps || [];
  var score = 35;

  // Indicateurs premium
  if (PREMIUM_NAMES.test(name))      score += 20;
  if (recipe.emoji)                   score += 8;
  if (recipe.origin)                  score += 8;
  if (Array.isArray(recipe.tags) && recipe.tags.length >= 3) score += 6;
  if (PLEASURE_INGREDIENTS.test(is)) score += 10;
  if (PLEASURE_TECHNIQUES.test(is + ' ' + steps.join(' '))) score += 8;

  // Pénalités générique
  if (GENERIC_NAMES.test(name))      score -= 20;
  if (!recipe.emoji && !recipe.origin) score -= 5;

  // Protéine suffisante = soin nutritionnel
  var nutr = getNutr(recipe);
  if (nutr && nutr.protein >= 20) score += 6;

  // Longueur du nom : 8-45 = premium
  if (name.length >= 8 && name.length <= 45) score += 5;
  else if (name.length < 5)                  score -= 10;

  // Steps détaillés
  if      (steps.length >= 3 && steps.length <= 7) score += 5;
  else if (steps.length <= 1)                       score -= 8;

  return clamp(score, 0, 100);
}

// ── COMPOSITE UX SCORE ────────────────────────────────────────────────────────

function scoreUX(recipe) {
  var s = {
    satietyUX:        scoreSatietyUX(recipe),
    foodPleasure:     scoreFoodPleasure(recipe),
    mentalLoad:       scoreMentalLoad(recipe),
    varietyPotential: scoreVarietyPotential(recipe),
    adherence:        scoreAdherence(recipe),
    premiumFeel:      scorePremiumFeel(recipe)
  };
  var total = 0;
  Object.keys(UX_WEIGHTS).forEach(function(k) { total += (s[k] || 0) * UX_WEIGHTS[k]; });
  return { scores: s, uxScore: Math.round(total) };
}

// ── ANALYZE RECIPE UX ──────────────────────────────────────────────────────────

function analyzeRecipeUX(recipe) {
  var ux    = scoreUX(recipe);
  var exc   = getExpectedException(recipe);
  var grade = ux.uxScore >= 78 ? 'A' :
              ux.uxScore >= 62 ? 'B' :
              ux.uxScore >= 48 ? 'C' : 'D';

  return {
    id:              recipe.id || recipe._id,
    name:            recipe.name || recipe.n || '',
    mealType:        getMealType(recipe),
    uxScore:         ux.uxScore,
    uxGrade:         grade,
    scores:          ux.scores,
    exception:       exc ? exc.id : null,
    exceptionReason: exc ? exc.reason : null
  };
}

// ── ANALYZE DATABASE UX ────────────────────────────────────────────────────────

function analyzeDatabaseUX(db) {
  var results = db
    .filter(function(r) { return /^R\d+$/.test(r.id || ''); })
    .map(analyzeRecipeUX);

  if (results.length === 0) {
    return {
      analyzed: 0, avgUxScore: 0, frustrationIndex: 0, premiumRatio: 0,
      adherenceAvg: 0, varietyAvg: 0, pleasureAvg: 0, mentalLoadAvg: 0,
      satietyAvg: 0, premiumFeelAvg: 0,
      uxGradeDistribution: { A: 0, B: 0, C: 0, D: 0 },
      results: [], weekSimulation: null
    };
  }

  var sum = { ux: 0, adherence: 0, variety: 0, pleasure: 0, mental: 0, satiety: 0, premium: 0 };
  var frustrated = 0, premiumCount = 0;
  var grades = { A: 0, B: 0, C: 0, D: 0 };

  results.forEach(function(r) {
    sum.ux        += r.uxScore;
    sum.adherence += r.scores.adherence;
    sum.variety   += r.scores.varietyPotential;
    sum.pleasure  += r.scores.foodPleasure;
    sum.mental    += r.scores.mentalLoad;
    sum.satiety   += r.scores.satietyUX;
    sum.premium   += r.scores.premiumFeel;
    if (r.scores.satietyUX < 45) frustrated++;
    if (r.scores.premiumFeel >= 65) premiumCount++;
    grades[r.uxGrade]++;
  });

  var n = results.length;
  function avg(v) { return Math.round(v / n); }

  return {
    analyzed:            n,
    avgUxScore:          avg(sum.ux),
    frustrationIndex:    Math.round(frustrated   / n * 100),
    premiumRatio:        Math.round(premiumCount / n * 100),
    adherenceAvg:        avg(sum.adherence),
    varietyAvg:          avg(sum.variety),
    pleasureAvg:         avg(sum.pleasure),
    mentalLoadAvg:       avg(sum.mental),
    satietyAvg:          avg(sum.satiety),
    premiumFeelAvg:      avg(sum.premium),
    uxGradeDistribution: grades,
    results:             results.sort(function(a, b) { return b.uxScore - a.uxScore; }),
    weekSimulation:      simulateWeek(results)
  };
}

// ── WEEK SIMULATION ────────────────────────────────────────────────────────────
// Simule une semaine de 21 repas (top-rated). Détecte monotonie, frustration
// cumulée, manque protéines, et projette l'adhérence sur 1 mois.

function simulateWeek(results) {
  if (results.length < 10) {
    return {
      feasible:         false,
      recipesAvailable: results.length,
      note:             'DB R-format insuffisante pour simuler 7 jours complets'
    };
  }

  var sorted  = results.slice().sort(function(a, b) { return b.uxScore - a.uxScore; });
  var weekN   = Math.min(21, sorted.length);
  var week    = sorted.slice(0, weekN);

  var totalAdherence = 0, totalPleasure = 0, totalSatiety = 0;
  var frustrated = 0, premiumMeals = 0;
  var uniqueNames = {};

  week.forEach(function(r) {
    totalAdherence += r.scores.adherence;
    totalPleasure  += r.scores.foodPleasure;
    totalSatiety   += r.scores.satietyUX;
    if (r.scores.satietyUX < 45)    frustrated++;
    if (r.scores.premiumFeel >= 65) premiumMeals++;

    // Clé de déduplication : premiers 20 chars du nom normalisé
    var key = (r.name || '').replace(/\s+\d.*/, '').toLowerCase().trim().slice(0, 20);
    uniqueNames[key] = true;
  });

  var adherenceScore = Math.round(totalAdherence / weekN);
  var pleasureScore  = Math.round(totalPleasure  / weekN);
  var satietyScore   = Math.round(totalSatiety   / weekN);

  return {
    feasible:                 true,
    recipesAvailable:         results.length,
    weekAdherence:            adherenceScore,
    weekPleasure:             pleasureScore,
    weekSatiety:              satietyScore,
    frustratingMeals:         frustrated,
    premiumMeals:             premiumMeals,
    uniqueRecipes:            Object.keys(uniqueNames).length,
    monotonyRisk:             Object.keys(uniqueNames).length < 15,
    projectedMonthAdherence:  clamp(
      Math.round(adherenceScore * 0.85 + pleasureScore * 0.10 + satietyScore * 0.05),
      0, 100
    )
  };
}

// ── UX REPORT ──────────────────────────────────────────────────────────────────

function generateUXReport(uxAnalysis) {
  var w = uxAnalysis.weekSimulation;
  var g = uxAnalysis.uxGradeDistribution;

  var lines = [
    '═══════════════════════════════════════════════════════════════',
    ' RECIPE UX ENGINE — SmartFitCoach User Experience Report',
    '═══════════════════════════════════════════════════════════════',
    ' Recettes analysées   : ' + uxAnalysis.analyzed,
    ' Score UX moyen       : ' + uxAnalysis.avgUxScore + '/100',
    ' Grades UX            : A=' + g.A + '  B=' + g.B + '  C=' + g.C + '  D=' + g.D,
    '───────────────────────────────────────────────────────────────',
    ' DIMENSIONS UX :',
    '  Satiété psychol.    : ' + uxAnalysis.satietyAvg    + '/100',
    '  Plaisir alimentaire : ' + uxAnalysis.pleasureAvg   + '/100',
    '  Charge mentale      : ' + uxAnalysis.mentalLoadAvg + '/100  (100=facile)',
    '  Potentiel variété   : ' + uxAnalysis.varietyAvg    + '/100',
    '  Adhérence LT        : ' + uxAnalysis.adherenceAvg  + '/100',
    '  Feel premium        : ' + uxAnalysis.premiumFeelAvg + '/100',
    '───────────────────────────────────────────────────────────────',
    ' INDICES GLOBAUX :',
    '  Index frustration   : ' + uxAnalysis.frustrationIndex + '% des recettes psychologiquement insuffisantes',
    '  Ratio premium       : ' + uxAnalysis.premiumRatio + '% des recettes offrent une expérience premium'
  ];

  if (w && w.feasible) {
    lines.push('───────────────────────────────────────────────────────────────');
    lines.push(' SIMULATION SEMAINE COMPLÈTE (21 meilleurs repas) :');
    lines.push('  Adhérence semaine    : ' + w.weekAdherence + '/100');
    lines.push('  Plaisir semaine      : ' + w.weekPleasure  + '/100');
    lines.push('  Satiété semaine      : ' + w.weekSatiety   + '/100');
    lines.push('  Repas frustrants     : ' + w.frustratingMeals + '/21');
    lines.push('  Repas premium        : ' + w.premiumMeals  + '/21');
    lines.push('  Recettes uniques     : ' + w.uniqueRecipes + '/21');
    lines.push('  Risque monotonie     : ' + (w.monotonyRisk ? '⚠ OUI' : '✓ Non'));
    lines.push('  Adhérence projetée 1 mois : ' + w.projectedMonthAdherence + '/100');
  } else if (w && !w.feasible) {
    lines.push('───────────────────────────────────────────────────────────────');
    lines.push(' SIMULATION : ' + (w.note || 'insuffisant'));
  }

  lines.push('───────────────────────────────────────────────────────────────');
  lines.push(' RECOMMANDATIONS :');
  if (uxAnalysis.frustrationIndex > 20)
    lines.push('  → ' + uxAnalysis.frustrationIndex + '% recettes frustrant — revoir les portions minimales');
  if (uxAnalysis.premiumRatio < 40)
    lines.push('  → Ratio premium faible — enrichir noms, emojis, origines');
  if (uxAnalysis.adherenceAvg < 60)
    lines.push('  → Adhérence faible — recettes trop complexes ou trop restrictives');
  if (uxAnalysis.pleasureAvg < 55)
    lines.push('  → Plaisir insuffisant — diversifier les ingrédients premium');
  if (uxAnalysis.frustrationIndex <= 10 && uxAnalysis.premiumRatio >= 50)
    lines.push('  ✓ Expérience premium — frustration maîtrisée, haut ratio plaisir');

  lines.push('═══════════════════════════════════════════════════════════════');
  return lines.join('\n');
}

if (typeof window !== 'undefined') {
  window.RecipeUXEngine = {
    SEVERITY_TIERS:        SEVERITY_TIERS,
    CODE_TIERS:            CODE_TIERS,
    UX_WEIGHTS:            UX_WEIGHTS,
    EXPECTED_EXCEPTIONS:   EXPECTED_EXCEPTIONS,
    getTier:               getTier,
    getExpectedException:  getExpectedException,
    applyExceptions:       applyExceptions,
    scoreSatietyUX:        scoreSatietyUX,
    scoreFoodPleasure:     scoreFoodPleasure,
    scoreMentalLoad:       scoreMentalLoad,
    scoreVarietyPotential: scoreVarietyPotential,
    scoreAdherence:        scoreAdherence,
    scorePremiumFeel:      scorePremiumFeel,
    scoreUX:               scoreUX,
    analyzeRecipeUX:       analyzeRecipeUX,
    analyzeDatabaseUX:     analyzeDatabaseUX,
    simulateWeek:          simulateWeek,
    generateUXReport:      generateUXReport
  };
}

})();
