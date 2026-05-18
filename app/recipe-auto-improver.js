(function() {
'use strict';

// ─── RECIPE AUTO-IMPROVER ─────────────────────────────────────────────────────
// Moteur d'amélioration automatique contrôlée des recettes.
// Applique uniquement des changements macro-sûrs (±3% calories, ±5% macros).
// Produit un rapport humain-lisible : avant/après, raison, impact, risque,
// validation macro, validation UX, mode revue manuelle.
// ─────────────────────────────────────────────────────────────────────────────

// ── DÉPENDANCES ───────────────────────────────────────────────────────────────

var REX = (typeof window !== 'undefined' && window.RecipeUXExplainer) ? window.RecipeUXExplainer : null;
var RUE = (typeof window !== 'undefined' && window.RecipeUXEngine)     ? window.RecipeUXEngine     : null;

// ── TOLÉRANCES MACRO ──────────────────────────────────────────────────────────

var MACRO_TOLERANCE = Object.freeze({
  calories: 0.03,
  protein:  0.05,
  carbs:    0.05,
  fat:      0.05
});

// ── CATALOGUE D'AMÉLIORATIONS ─────────────────────────────────────────────────
// AUTO_SAFE    : appliqué automatiquement (impact macro négligeable)
// REVIEW_REQUIRED : impact macro significatif → revue humaine obligatoire

var IMPROVEMENT_CATALOG = [

  // ── AUTO_SAFE : métadonnées ────────────────────────────────────────────────
  {
    id: 'ADD_EMOJI',
    type: 'AUTO_SAFE',
    targetFactor: 'HAS_EMOJI',
    condition: function(recipe, factors) {
      return !recipe.emoji && !factorPresent(factors.positive, 'HAS_EMOJI');
    },
    apply: function(recipe) {
      var emoji = guessEmoji(recipe);
      recipe.emoji = emoji;
      return { field: 'emoji', value: emoji };
    },
    reason: 'Ajout d\'un emoji représentatif → signal visuel premium dans l\'interface',
    expectedFactors: ['HAS_EMOJI'],
    macroDelta: { calories: 0, protein: 0, carbs: 0, fat: 0 }
  },

  {
    id: 'ADD_MEAL_PREP_TAG',
    type: 'AUTO_SAFE',
    targetFactor: 'MEAL_PREP',
    condition: function(recipe, factors) {
      var total = (recipe.prepTime || 0) + (recipe.cookTime || 0);
      return total <= 30 && !factorPresent(factors.positive, 'MEAL_PREP') &&
             !/meal.prep|batch|à.l.avance/i.test((recipe.tags || []).join(' '));
    },
    apply: function(recipe) {
      recipe.tags = (recipe.tags || []).concat(['meal-prep']);
      return { field: 'tags', added: 'meal-prep' };
    },
    reason: 'Préparation ≤30 min → recette compatible meal-prep, tag ajouté pour réduire friction quotidienne',
    expectedFactors: ['MEAL_PREP'],
    macroDelta: { calories: 0, protein: 0, carbs: 0, fat: 0 }
  },

  {
    id: 'IMPROVE_NAME',
    type: 'AUTO_SAFE',
    targetFactor: 'GENERIC_NAME',
    condition: function(recipe, factors) {
      return factorPresent(factors.negative, 'GENERIC_NAME');
    },
    apply: function(recipe) {
      var oldName = recipe.name || recipe.n || '';
      var newName = enhanceName(recipe, oldName);
      if (recipe.name !== undefined) recipe.name = newName;
      else recipe.n = newName;
      return { field: 'name', from: oldName, to: newName };
    },
    reason: 'Nom générique → renommage évocateur pour réduire sentiment "régime" et augmenter désirabilité',
    expectedFactors: ['DESCRIPTIVE_NAME'],
    macroDelta: { calories: 0, protein: 0, carbs: 0, fat: 0 }
  },

  // ── AUTO_SAFE : ingrédients à impact macro négligeable (<1.5 kcal/portion) ──
  {
    id: 'ADD_HERBS',
    type: 'AUTO_SAFE',
    targetFactor: 'FLAT_FLAVOR',
    condition: function(recipe, factors) {
      return factorPresent(factors.negative, 'FLAT_FLAVOR') &&
             !hasIngredient(recipe, /herbe|persil|basilic|thym|coriandre|menthe|origan|herbes.de.provence/i);
    },
    apply: function(recipe) {
      var ing = { name: 'Herbes de Provence', qty: 0.5, unit: 'g' };
      recipe.ingredients = (recipe.ingredients || []).concat([ing]);
      updateBaseNutrition(recipe, { calories: 1.5, protein: 0.05, carbs: 0.3, fat: 0.03 });
      return { field: 'ingredients', added: ing };
    },
    reason: 'Profil gustatif plat → ajout herbes aromatiques (0.5g, ~1.5 kcal) pour complexité gustative',
    expectedFactors: ['FLAT_FLAVOR_RESOLVED'],
    macroDelta: { calories: 1.5, protein: 0.05, carbs: 0.3, fat: 0.03 }
  },

  {
    id: 'ADD_LEMON_JUICE',
    type: 'AUTO_SAFE',
    targetFactor: 'FLAT_FLAVOR',
    condition: function(recipe, factors) {
      return factorPresent(factors.negative, 'FLAT_FLAVOR') &&
             !hasIngredient(recipe, /citron|jus.de.citron/i) &&
             !hasIngredient(recipe, /herbe|persil|basilic|thym|origan|herbes.de.provence/i);
    },
    apply: function(recipe) {
      var ing = { name: 'Jus de citron', qty: 10, unit: 'ml' };
      recipe.ingredients = (recipe.ingredients || []).concat([ing]);
      updateBaseNutrition(recipe, { calories: 2.5, protein: 0.05, carbs: 0.65, fat: 0 });
      return { field: 'ingredients', added: ing };
    },
    reason: 'Profil gustatif plat → ajout jus de citron (10ml, ~2.5 kcal) pour note acide',
    expectedFactors: ['FLAT_FLAVOR_RESOLVED'],
    macroDelta: { calories: 2.5, protein: 0.05, carbs: 0.65, fat: 0 }
  },

  {
    id: 'ADD_PARSLEY',
    type: 'AUTO_SAFE',
    targetFactor: 'VISUAL_POVERTY',
    condition: function(recipe, factors) {
      return factorPresent(factors.negative, 'VISUAL_POVERTY') &&
             !hasIngredient(recipe, /persil|ciboulette|basilic|menthe|herbe/i);
    },
    apply: function(recipe) {
      var ing = { name: 'Persil frais', qty: 2, unit: 'g' };
      recipe.ingredients = (recipe.ingredients || []).concat([ing]);
      updateBaseNutrition(recipe, { calories: 0.7, protein: 0.06, carbs: 0.11, fat: 0.01 });
      return { field: 'ingredients', added: ing };
    },
    reason: 'Présentation monotone → persil frais (2g, ~0.7 kcal) pour touche verte et fraîcheur visuelle',
    expectedFactors: ['VISUAL_POVERTY_RESOLVED'],
    macroDelta: { calories: 0.7, protein: 0.06, carbs: 0.11, fat: 0.01 }
  },

  // ── REVIEW_REQUIRED : ingrédients à impact macro notable ──────────────────
  {
    id: 'ADD_SESAME',
    type: 'REVIEW_REQUIRED',
    targetFactor: 'MONO_TEXTURE',
    condition: function(recipe, factors) {
      return factorPresent(factors.negative, 'MONO_TEXTURE') &&
             !hasIngredient(recipe, /sésame|graines/i);
    },
    apply: function(recipe) {
      var ing = { name: 'Graines de sésame', qty: 5, unit: 'g' };
      recipe.ingredients = (recipe.ingredients || []).concat([ing]);
      updateBaseNutrition(recipe, { calories: 29, protein: 0.9, carbs: 1.2, fat: 2.5 });
      return { field: 'ingredients', added: ing };
    },
    reason: 'Texture uniforme → graines de sésame (5g/portion, ~29 kcal) pour croquant',
    expectedFactors: ['MONO_TEXTURE_RESOLVED'],
    macroDelta: { calories: 29, protein: 0.9, carbs: 1.2, fat: 2.5 }
  },

  {
    id: 'ADD_WALNUTS',
    type: 'REVIEW_REQUIRED',
    targetFactor: 'MONO_TEXTURE',
    condition: function(recipe, factors) {
      return factorPresent(factors.negative, 'MONO_TEXTURE') &&
             !hasIngredient(recipe, /noix\b|amande|noisette|pistache/i) &&
             !hasIngredient(recipe, /sésame|graines/i);
    },
    apply: function(recipe) {
      var ing = { name: 'Noix', qty: 10, unit: 'g' };
      recipe.ingredients = (recipe.ingredients || []).concat([ing]);
      updateBaseNutrition(recipe, { calories: 65, protein: 1.5, carbs: 1.4, fat: 6.5 });
      return { field: 'ingredients', added: ing };
    },
    reason: 'Texture uniforme → noix (10g/portion, ~65 kcal) pour croquant et oméga-3',
    expectedFactors: ['MONO_TEXTURE_RESOLVED'],
    macroDelta: { calories: 65, protein: 1.5, carbs: 1.4, fat: 6.5 }
  },

  {
    id: 'ADD_COLORFUL_VEG',
    type: 'REVIEW_REQUIRED',
    targetFactor: 'VISUAL_POVERTY',
    condition: function(recipe, factors) {
      return factorPresent(factors.negative, 'VISUAL_POVERTY') &&
             !hasIngredient(recipe, /carotte|poivron|épinard|tomate|betterave/i) &&
             !hasIngredient(recipe, /persil|ciboulette|basilic|menthe/i);
    },
    apply: function(recipe) {
      var ing = { name: 'Carotte râpée', qty: 50, unit: 'g' };
      recipe.ingredients = (recipe.ingredients || []).concat([ing]);
      updateBaseNutrition(recipe, { calories: 20, protein: 0.5, carbs: 4.7, fat: 0.1 });
      return { field: 'ingredients', added: ing };
    },
    reason: 'Peu de couleurs → carotte râpée (50g, ~20 kcal) pour note orange et fibres',
    expectedFactors: ['VISUAL_POVERTY_RESOLVED'],
    macroDelta: { calories: 20, protein: 0.5, carbs: 4.7, fat: 0.1 }
  }
];

// ── HELPERS ────────────────────────────────────────────────────────────────────

function factorPresent(factors, key) {
  return factors.some(function(f) { return f.key === key; });
}

function hasIngredient(recipe, rx) {
  return (recipe.ingredients || []).some(function(i) { return rx.test(i.name || ''); });
}

function getNutrPerServing(recipe) {
  if (recipe.baseNutrition) {
    var bn = recipe.baseNutrition, s = recipe.servings || 1;
    return { calories: bn.calories / s, protein: (bn.proteinGrams || 0) / s,
             carbs: (bn.carbsGrams || 0) / s, fat: (bn.fatGrams || 0) / s };
  }
  if (recipe.k != null) return { calories: recipe.k, protein: recipe.p || 0, carbs: recipe.g || 0, fat: recipe.l || 0 };
  return null;
}

// macroDelta is PER SERVING; baseNutrition stores TOTAL → multiply by servings
function updateBaseNutrition(recipe, delta) {
  if (recipe.baseNutrition) {
    var s = recipe.servings || 1;
    recipe.baseNutrition.calories     = (recipe.baseNutrition.calories     || 0) + delta.calories * s;
    recipe.baseNutrition.proteinGrams = (recipe.baseNutrition.proteinGrams || 0) + delta.protein  * s;
    recipe.baseNutrition.carbsGrams   = (recipe.baseNutrition.carbsGrams   || 0) + delta.carbs    * s;
    recipe.baseNutrition.fatGrams     = (recipe.baseNutrition.fatGrams     || 0) + delta.fat      * s;
  } else if (recipe.k != null) {
    recipe.k = (recipe.k || 0) + delta.calories;
    recipe.p = (recipe.p || 0) + delta.protein;
    recipe.g = (recipe.g || 0) + delta.carbs;
    recipe.l = (recipe.l || 0) + delta.fat;
  }
}

function deepClone(obj) {
  return JSON.parse(JSON.stringify(obj));
}

function guessEmoji(recipe) {
  var name = (recipe.name || recipe.n || '').toLowerCase();
  var is = (recipe.ingredients || []).map(function(i) { return (i.name || '').toLowerCase(); }).join(' ');
  var combined = name + ' ' + is;
  if (/riz\b/.test(combined))             return '🍚';
  if (/saumon/.test(combined))            return '🐟';
  if (/poulet|dinde/.test(combined))      return '🍗';
  if (/boeuf|bœuf/.test(combined))        return '🥩';
  if (/œuf|oeuf/.test(combined))          return '🥚';
  if (/pâtes|pasta/.test(combined))       return '🍝';
  if (/salade/.test(combined))            return '🥗';
  if (/soupe|velouté|bouillon/.test(combined)) return '🍲';
  if (/smoothie/.test(combined))          return '🥤';
  if (/pancake|crêpe/.test(combined))     return '🥞';
  if (/oatmeal|avoine|granola/.test(combined)) return '🥣';
  if (/pizza/.test(combined))             return '🍕';
  if (/burger/.test(combined))            return '🍔';
  if (/curry/.test(combined))             return '🍛';
  if (/crevette/.test(combined))          return '🍤';
  if (/taco|wrap/.test(combined))         return '🌮';
  return '🥘';
}

function enhanceName(recipe, name) {
  var is = (recipe.ingredients || []).map(function(i) { return (i.name || '').toLowerCase(); }).join(' ');
  var mt = (recipe.mealTypes || []).join(' ');
  if (/salade/.test(name.toLowerCase()) && /poulet/.test(is)) return 'Salade César Poulet Grillé';
  if (/salade/.test(name.toLowerCase()) && /thon/.test(is))   return 'Salade Niçoise Légère';
  if (/salade/.test(name.toLowerCase()))                       return 'Grande Salade Fraîcheur';
  if (/riz blanc/.test(name.toLowerCase()) && /poulet/.test(is)) return 'Riz Poulet Vapeur & Légumes';
  if (/riz/.test(name.toLowerCase()))                          return 'Bowl de Riz aux Légumes du Marché';
  if (/pasta|pâtes simples/.test(name.toLowerCase()))          return 'Pasta Maison Sauce Maison';
  if (/poulet.légumes/.test(name.toLowerCase()))               return 'Poulet Fondant & Légumes Colorés';
  if (/soupe.légumes/.test(name.toLowerCase()))                return 'Velouté de Légumes du Jardin';
  if (/légumes.sautés/.test(name.toLowerCase()))               return 'Wok de Légumes Sautés & Herbes';
  if (/plat simple|recette simple/.test(name.toLowerCase()))   return 'Plat Équilibré Maison';
  return name + ' Maison';
}

// ── VALIDATION MACRO ──────────────────────────────────────────────────────────

function validateMacroSafety(original, improved) {
  var orig = getNutrPerServing(original);
  var imp  = getNutrPerServing(improved);
  if (!orig || !imp) return { safe: true, deltas: {}, note: 'Pas de données nutritionnelles' };

  var deltas = {};
  var violations = [];
  var fields = [
    { key: 'calories', origVal: orig.calories,  impVal: imp.calories,  tol: MACRO_TOLERANCE.calories },
    { key: 'protein',  origVal: orig.protein,   impVal: imp.protein,   tol: MACRO_TOLERANCE.protein  },
    { key: 'carbs',    origVal: orig.carbs,     impVal: imp.carbs,     tol: MACRO_TOLERANCE.carbs    },
    { key: 'fat',      origVal: orig.fat,        impVal: imp.fat,       tol: MACRO_TOLERANCE.fat      }
  ];

  fields.forEach(function(f) {
    if (f.origVal <= 0) return;
    var delta = (f.impVal - f.origVal) / f.origVal;
    deltas[f.key] = { delta: Math.round(delta * 1000) / 10, absolute: Math.round((f.impVal - f.origVal) * 10) / 10 };
    if (Math.abs(delta) > f.tol) violations.push(f.key);
  });

  return { safe: violations.length === 0, violations: violations, deltas: deltas };
}

// ── SCORE UX HELPER ───────────────────────────────────────────────────────────

function getUXScores(recipe) {
  if (!REX) return null;
  var r = REX.explainRecipeUX(recipe);
  if (!r) return null;
  return {
    satietyUX:        r.satiety    ? r.satiety.score    : null,
    foodPleasure:     r.premium    ? r.premium.score    : null,
    mentalLoad:       r.mentalLoad ? r.mentalLoad.score : null,
    varietyPotential: r.variety    ? r.variety.score    : null,
    adherence:        r.adherence  ? r.adherence.score  : null,
    premiumFeel:      r.premium    ? r.premium.score    : null
  };
}

// ── ANALYSE D'UNE RECETTE ─────────────────────────────────────────────────────

function analyzeForImprovements(recipe) {
  if (!REX) throw new Error('RecipeUXExplainer not loaded');
  var factors = REX.computeAllFactors(recipe);
  var applicable = [];

  IMPROVEMENT_CATALOG.forEach(function(imp) {
    if (imp.condition(recipe, factors)) {
      applicable.push({
        id:       imp.id,
        type:     imp.type,
        reason:   imp.reason,
        targetFactor: imp.targetFactor,
        macroDelta:   imp.macroDelta
      });
    }
  });

  return { recipe: recipe, factors: factors, applicable: applicable };
}

// ── APPLICATION D'UNE AMÉLIORATION ───────────────────────────────────────────

function applyImprovement(recipe, improvementId) {
  var imp = null;
  for (var i = 0; i < IMPROVEMENT_CATALOG.length; i++) {
    if (IMPROVEMENT_CATALOG[i].id === improvementId) { imp = IMPROVEMENT_CATALOG[i]; break; }
  }
  if (!imp) throw new Error('Amélioration inconnue : ' + improvementId);

  var cloned = deepClone(recipe);
  var factors = REX ? REX.computeAllFactors(cloned) : { positive: [], negative: [] };

  if (!imp.condition(cloned, factors)) {
    return { applied: false, reason: 'Condition non remplie sur la copie clonée' };
  }

  var change = imp.apply(cloned);
  var macroCheck = validateMacroSafety(recipe, cloned);

  return {
    applied:     true,
    improvementId: improvementId,
    type:        imp.type,
    change:      change,
    macroCheck:  macroCheck,
    improved:    cloned
  };
}

// ── GÉNÉRATION D'UNE PROPOSITION COMPLÈTE ────────────────────────────────────

function generateProposal(recipe) {
  if (!REX) throw new Error('RecipeUXExplainer not loaded');

  var analysis = analyzeForImprovements(recipe);
  var autoSafe = analysis.applicable.filter(function(a) { return a.type === 'AUTO_SAFE'; });
  var review   = analysis.applicable.filter(function(a) { return a.type === 'REVIEW_REQUIRED'; });

  // Appliquer toutes les améliorations AUTO_SAFE séquentiellement
  var current = deepClone(recipe);
  var applied  = [];
  var rejected = [];

  autoSafe.forEach(function(a) {
    var result = applyImprovement(current, a.id);
    if (result.applied && result.macroCheck.safe) {
      current = result.improved;
      applied.push({ id: a.id, type: 'AUTO_SAFE', change: result.change,
                     reason: a.reason, macroCheck: result.macroCheck });
    } else {
      rejected.push({ id: a.id, reason: result.applied ? 'Violation macro' : result.reason,
                      macroCheck: result.macroCheck });
    }
  });

  var scoresBefore = getUXScores(recipe);
  var scoresAfter  = getUXScores(current);
  var macroFinal   = validateMacroSafety(recipe, current);

  return {
    recipeName:    recipe.name || recipe.n || '(sans nom)',
    applied:       applied,
    rejected:      rejected,
    reviewRequired: review,
    scoresBefore:  scoresBefore,
    scoresAfter:   scoresAfter,
    macroFinal:    macroFinal,
    improved:      current
  };
}

// ── PRIORITÉ D'AMÉLIORATION ───────────────────────────────────────────────────
// Score de priorité = urgence d'intervention. Plus c'est élevé, plus on agit en premier.

function computeUrgency(recipe) {
  if (!REX) return 0;
  var scores = getUXScores(recipe);
  if (!scores) return 0;

  var urgency = 0;
  if (scores.satietyUX   < 60) urgency += 30;
  if (scores.foodPleasure < 60) urgency += 20;
  if (scores.adherence   < 60) urgency += 20;
  if (scores.premiumFeel  < 60) urgency += 10;
  if (scores.varietyPotential < 50) urgency += 10;
  if (scores.mentalLoad  < 50) urgency += 10;

  var factors = REX.computeAllFactors(recipe);
  if (factorPresent(factors.negative, 'FLAT_FLAVOR'))   urgency += 8;
  if (factorPresent(factors.negative, 'MONO_TEXTURE'))  urgency += 8;
  if (factorPresent(factors.negative, 'GENERIC_NAME'))  urgency += 5;
  if (factorPresent(factors.negative, 'VISUAL_POVERTY')) urgency += 4;

  return urgency;
}

function prioritizeRecipes(db) {
  if (!REX) throw new Error('RecipeUXExplainer not loaded');
  var recipes = Array.isArray(db) ? db : (db.recipes || []);
  return recipes
    .map(function(r) { return { recipe: r, urgency: computeUrgency(r) }; })
    .filter(function(x) { return x.urgency > 0; })
    .sort(function(a, b) { return b.urgency - a.urgency; })
    .map(function(x) { return { recipe: x.recipe, urgency: x.urgency }; });
}

// ── DRY-RUN GLOBAL ────────────────────────────────────────────────────────────

function runDryRun(db, options) {
  if (!REX) throw new Error('RecipeUXExplainer not loaded');
  var opts = options || {};
  var top = opts.top || 20;
  var recipes = Array.isArray(db) ? db : (db.recipes || []);

  var prioritized = prioritizeRecipes(recipes);
  var targets = prioritized.slice(0, top);

  var proposals = targets.map(function(x) {
    return generateProposal(x.recipe);
  });

  var totalApplied  = proposals.reduce(function(s, p) { return s + p.applied.length; }, 0);
  var totalReview   = proposals.reduce(function(s, p) { return s + p.reviewRequired.length; }, 0);
  var totalRejected = proposals.reduce(function(s, p) { return s + p.rejected.length; }, 0);

  var avgBefore = avgScores(proposals.map(function(p) { return p.scoresBefore; }));
  var avgAfter  = avgScores(proposals.map(function(p) { return p.scoresAfter; }));

  return {
    totalRecipes:  recipes.length,
    analyzed:      targets.length,
    proposals:     proposals,
    summary: {
      autoApplied:    totalApplied,
      reviewRequired: totalReview,
      rejected:       totalRejected,
      avgScoresBefore: avgBefore,
      avgScoresAfter:  avgAfter
    }
  };
}

function avgScores(scoresList) {
  var valid = scoresList.filter(Boolean);
  if (!valid.length) return null;
  var keys = Object.keys(valid[0]);
  var result = {};
  keys.forEach(function(k) {
    result[k] = Math.round(valid.reduce(function(s, sc) { return s + (sc[k] || 0); }, 0) / valid.length);
  });
  return result;
}

// ── RAPPORT HUMAIN-LISIBLE ─────────────────────────────────────────────────────

function bar(score, width) {
  width = width || 20;
  var filled = Math.round(score / 100 * width);
  return '[' + '█'.repeat(filled) + '░'.repeat(width - filled) + '] ' + score + '/100';
}

function delta(before, after, key) {
  if (!before || !after) return '';
  var d = (after[key] || 0) - (before[key] || 0);
  return d === 0 ? '→' : (d > 0 ? '↑+' + d : '↓' + d);
}

function generateImprovementReport(dryRunResult) {
  var lines = [];
  var s = dryRunResult.summary;

  lines.push('╔══════════════════════════════════════════════════════════════╗');
  lines.push('║          RAPPORT D\'AMÉLIORATION AUTOMATIQUE RECETTES         ║');
  lines.push('╚══════════════════════════════════════════════════════════════╝');
  lines.push('');
  lines.push('Base analysée : ' + dryRunResult.totalRecipes + ' recettes total, ' +
             dryRunResult.analyzed + ' recettes prioritaires traitées');
  lines.push('');
  lines.push('┌── RÉSUMÉ ───────────────────────────────────────────────────┐');
  lines.push('│ ✅ Améliorations AUTO_SAFE   : ' + s.autoApplied);
  lines.push('│ 👁  Revue humaine requise    : ' + s.reviewRequired);
  lines.push('│ ❌ Refusées (macro violation): ' + s.rejected);
  lines.push('└─────────────────────────────────────────────────────────────┘');
  lines.push('');

  if (s.avgScoresBefore && s.avgScoresAfter) {
    lines.push('┌── IMPACT MOYEN SUR LES SCORES UX ──────────────────────────┐');
    var dims = ['satietyUX','foodPleasure','mentalLoad','varietyPotential','adherence','premiumFeel'];
    var labels = { satietyUX:'Satiété UX      ', foodPleasure:'Plaisir alimentaire',
                   mentalLoad:'Charge mentale  ', varietyPotential:'Potentiel variété',
                   adherence:'Adhérence       ', premiumFeel:'Expérience premium' };
    dims.forEach(function(d_) {
      var b = s.avgScoresBefore[d_] || 0;
      var a = s.avgScoresAfter[d_]  || 0;
      var sym = delta(s.avgScoresBefore, s.avgScoresAfter, d_);
      lines.push('│ ' + labels[d_] + ' : ' + b + ' → ' + a + ' ' + sym);
    });
    lines.push('└─────────────────────────────────────────────────────────────┘');
    lines.push('');
  }

  lines.push('┌── DÉTAIL PAR RECETTE ───────────────────────────────────────┐');
  dryRunResult.proposals.forEach(function(p, i) {
    lines.push('│');
    lines.push('│  [' + (i + 1) + '] ' + p.recipeName);

    if (p.applied.length) {
      lines.push('│  AUTO_SAFE appliquées :');
      p.applied.forEach(function(a) {
        lines.push('│    ✅ ' + a.id + ' — ' + a.reason);
        var mc = a.macroCheck;
        if (mc && mc.deltas) {
          var parts = Object.keys(mc.deltas).map(function(k) {
            var d_ = mc.deltas[k];
            return k + ' ' + (d_.delta >= 0 ? '+' : '') + d_.delta + '% (' + (d_.absolute >= 0 ? '+' : '') + d_.absolute + ')';
          });
          lines.push('│       Δ macro : ' + parts.join(' | '));
        }
      });
    }

    if (p.reviewRequired.length) {
      lines.push('│  Revue humaine :');
      p.reviewRequired.forEach(function(r) {
        lines.push('│    👁  ' + r.id + ' — ' + r.reason);
        var md = r.macroDelta;
        if (md) {
          lines.push('│       Impact estimé/portion : ' + md.calories + ' kcal, P+' + md.protein +
                     'g, G+' + md.carbs + 'g, L+' + md.fat + 'g');
        }
      });
    }

    if (p.macroFinal && p.macroFinal.deltas && Object.keys(p.macroFinal.deltas).length) {
      lines.push('│  Bilan macro final : ' + (p.macroFinal.safe ? '✅ SÛRE' : '⚠️  VIOLATION'));
      if (!p.macroFinal.safe) {
        lines.push('│    Violations : ' + (p.macroFinal.violations || []).join(', '));
      }
    }

    if (p.scoresBefore && p.scoresAfter) {
      lines.push('│  Scores UX : satiété ' +
        (p.scoresBefore.satietyUX||0) + '→' + (p.scoresAfter.satietyUX||0) + '  ' +
        'plaisir ' + (p.scoresBefore.foodPleasure||0) + '→' + (p.scoresAfter.foodPleasure||0) + '  ' +
        'premium ' + (p.scoresBefore.premiumFeel||0) + '→' + (p.scoresAfter.premiumFeel||0));
    }

    if (p.rejected.length) {
      lines.push('│  Refusées :');
      p.rejected.forEach(function(r) { lines.push('│    ✗ ' + r.id + ' — ' + r.reason); });
    }
  });
  lines.push('└─────────────────────────────────────────────────────────────┘');
  lines.push('');

  lines.push('── OBJECTIFS CIBLES ──────────────────────────────────────────');
  var targets = { satietyUX: 75, foodPleasure: 80, adherence: 80, premiumFeel: 85 };
  if (s.avgScoresAfter) {
    Object.keys(targets).forEach(function(k) {
      var current = s.avgScoresAfter[k] || 0;
      var target  = targets[k];
      var status  = current >= target ? '✅' : (current >= target * 0.9 ? '⚠️ ' : '❌');
      lines.push('  ' + status + ' ' + k + ' : ' + current + '/' + target);
    });
  }
  lines.push('');

  return lines.join('\n');
}

// ── EXPORTS ────────────────────────────────────────────────────────────────────

var RecipeAutoImprover = {
  IMPROVEMENT_CATALOG:      IMPROVEMENT_CATALOG,
  MACRO_TOLERANCE:          MACRO_TOLERANCE,
  validateMacroSafety:      validateMacroSafety,
  analyzeForImprovements:   analyzeForImprovements,
  applyImprovement:         applyImprovement,
  generateProposal:         generateProposal,
  prioritizeRecipes:        prioritizeRecipes,
  computeUrgency:           computeUrgency,
  runDryRun:                runDryRun,
  generateImprovementReport: generateImprovementReport,
  // helpers exposés pour les tests
  _factorPresent:           factorPresent,
  _hasIngredient:           hasIngredient,
  _validateMacroSafety:     validateMacroSafety,
  _deepClone:               deepClone,
  _guessEmoji:              guessEmoji,
  _enhanceName:             enhanceName,
  _updateBaseNutrition:     updateBaseNutrition,
  _getNutrPerServing:       getNutrPerServing
};

if (typeof window !== 'undefined') window.RecipeAutoImprover = RecipeAutoImprover;
if (typeof module !== 'undefined' && module.exports) module.exports = RecipeAutoImprover;

})();
