(function() {
'use strict';

// ─── RECIPE VALIDATOR ────────────────────────────────────────────────────────
// Pipeline de validation enterprise-grade pour toutes les recettes.
// Dépend de window.RecipeRegistry (optionnel — enrichit les checks).
// ─────────────────────────────────────────────────────────────────────────────

var KCAL_PER_PROT = 4, KCAL_PER_CARB = 4, KCAL_PER_FAT = 9;
var MACRO_TOLERANCE = 0.15; // 15% tolérance sur la somme des macros

var SEVERITY = Object.freeze({ ERROR: 'error', WARN: 'warn', INFO: 'info' });

var VALID_UNITS = ['g','ml','pce','cc','cs','cl','l','kg','pincee','pincée'];
// Unités d'affichage françaises acceptées (doivent être normalisées vers pce/cc/cs en production)
var NATURAL_UNITS = ['gousse','gousses','branche','branches','feuille','feuilles',
  'bouquet','bouquets','tige','tiges','tranche','tranches','brin','brins',
  'pc','c.à.café','c.à.soupe','c.a.café','c.a.soupe','sachet','sachets',
  'boite','boîte','boites','boîtes','verre','verres'];
var FORBIDDEN_UNITS = ['pièce','pièces','piece','pieces','unite','unité','unites','unités'];

// ── VALIDATION STRUCTURELLE ───────────────────────────────────────────────────

function validateStructure(recipe) {
  var issues = [];
  function issue(sev, code, msg) { issues.push({ severity: sev, code: code, message: msg }); }

  var rid = recipe.id || recipe._id;
  if (!rid) { issue(SEVERITY.ERROR, 'STRUCT_NO_ID', 'Recette sans identifiant'); return issues; }

  var isR        = /^R\d+$/.test(recipe.id  || '');
  var isLCompact = /^L\d+$/.test(recipe._id || '');
  var isLExt     = !recipe._id && /^L\d+$/.test(recipe.id || '');

  if (isR || isLExt) {
    if (!recipe.name)                                       issue(SEVERITY.ERROR, 'STRUCT_NO_NAME',        rid + ': champ "name" manquant');
    if (!recipe.baseNutrition)                              issue(SEVERITY.ERROR, 'STRUCT_NO_NUTRITION',   rid + ': champ "baseNutrition" manquant');
    if (!Array.isArray(recipe.ingredients))                 issue(SEVERITY.ERROR, 'STRUCT_NO_INGREDIENTS', rid + ': champ "ingredients" doit être un Array');
    if (!recipe.servings || recipe.servings <= 0)           issue(SEVERITY.ERROR, 'STRUCT_BAD_SERVINGS',   rid + ': servings invalide (' + recipe.servings + ')');
    if (!Array.isArray(recipe.steps) || !recipe.steps.length) issue(SEVERITY.WARN, 'STRUCT_NO_STEPS',     rid + ': champ "steps" absent ou vide');
    if (!Array.isArray(recipe.mealTypes) || !recipe.mealTypes.length) issue(SEVERITY.WARN, 'STRUCT_NO_MEALTYPES', rid + ': mealTypes absent');
  }

  if (isLCompact) {
    if (!recipe.n)               issue(SEVERITY.ERROR, 'STRUCT_NO_NAME',      rid + ': champ "n" (nom) manquant');
    if (!recipe.k || recipe.k <= 0) issue(SEVERITY.ERROR, 'STRUCT_BAD_CAL',  rid + ': champ "k" (calories) invalide');
    if (!recipe.i)               issue(SEVERITY.ERROR, 'STRUCT_NO_ING',      rid + ': champ "i" (ingrédients) manquant');
  }

  return issues;
}

// ── VALIDATION NUTRITIONNELLE ─────────────────────────────────────────────────

function validateNutrition(recipe) {
  var issues = [];
  function issue(sev, code, msg) { issues.push({ severity: sev, code: code, message: msg }); }

  var rid = recipe.id || recipe._id;
  var bn  = recipe.baseNutrition;
  if (!bn) return issues;

  var p = bn.proteinGrams || 0, c = bn.carbsGrams || 0, f = bn.fatGrams || 0, k = bn.calories || 0;

  if (k <= 0) { issue(SEVERITY.ERROR, 'NUTR_ZERO_CAL', rid + ': calories = ' + k); return issues; }
  if (p < 0 || c < 0 || f < 0) issue(SEVERITY.ERROR, 'NUTR_NEGATIVE_MACRO', rid + ': macros négatives P=' + p + ' G=' + c + ' L=' + f);

  var computed = p * KCAL_PER_PROT + c * KCAL_PER_CARB + f * KCAL_PER_FAT;
  var delta    = k > 0 ? Math.abs(computed - k) / k : 0;
  if (delta > MACRO_TOLERANCE) {
    issue(SEVERITY.WARN, 'NUTR_MACRO_INCOHERENT',
      rid + ': macros incohérentes — ' + Math.round(computed) + ' kcal calculé vs ' + k + ' déclaré (' + Math.round(delta * 100) + '% d\'écart)');
  }

  var servings   = recipe.servings || 1;
  var perServing = k / servings;
  if (perServing < 80)   issue(SEVERITY.WARN, 'NUTR_CAL_TOO_LOW',  rid + ': ' + Math.round(perServing) + ' kcal/portion (< 80)');
  if (perServing > 1800) issue(SEVERITY.WARN, 'NUTR_CAL_TOO_HIGH', rid + ': ' + Math.round(perServing) + ' kcal/portion (> 1800)');

  return issues;
}

// ── VALIDATION INGRÉDIENTS ────────────────────────────────────────────────────

function validateIngredients(recipe) {
  var issues = [];
  function issue(sev, code, msg) { issues.push({ severity: sev, code: code, message: msg }); }

  var rid = recipe.id || recipe._id;
  if (!Array.isArray(recipe.ingredients)) return issues;

  var seen = {};
  recipe.ingredients.forEach(function(ing, idx) {
    var pos = rid + '[' + idx + '] ' + (ing.name || '?');

    if (!ing.name || !ing.name.trim()) {
      issue(SEVERITY.ERROR, 'ING_EMPTY_NAME', rid + '[' + idx + ']: name vide');
      return;
    }
    if (ing.qty === undefined || ing.qty === null) {
      issue(SEVERITY.ERROR, 'ING_NO_QTY', pos + ': qty manquante');
    } else if (typeof ing.qty === 'number' && ing.qty < 0) {
      issue(SEVERITY.ERROR, 'ING_NEGATIVE_QTY', pos + ': qty négative = ' + ing.qty);
    } else if (typeof ing.qty === 'number' && ing.qty === 0 && !ing.note) {
      issue(SEVERITY.WARN, 'ING_ZERO_QTY', pos + ': qty = 0 sans note');
    }

    var u = (ing.unit || '').toLowerCase();
    if (!ing.unit) {
      issue(SEVERITY.WARN, 'ING_NO_UNIT', pos + ': unit manquante');
    } else if (FORBIDDEN_UNITS.indexOf(u) >= 0) {
      issue(SEVERITY.ERROR, 'ING_FORBIDDEN_UNIT', pos + ': unité interdite "' + ing.unit + '" — utiliser "pce"');
    } else if (VALID_UNITS.indexOf(u) < 0 && NATURAL_UNITS.indexOf(u) < 0) {
      issue(SEVERITY.ERROR, 'ING_INVALID_UNIT', pos + ': unité invalide "' + ing.unit + '"');
    } else if (NATURAL_UNITS.indexOf(u) >= 0) {
      issue(SEVERITY.WARN, 'ING_NATURAL_UNIT', pos + ': unité "' + ing.unit + '" à normaliser vers pce/cc/cs');
    }

    var lname = (ing.name || '').toLowerCase().trim();
    if (seen[lname]) {
      issue(SEVERITY.WARN, 'ING_DUPLICATE', rid + ': ingrédient dupliqué "' + ing.name + '"');
    }
    seen[lname] = true;

    // Registry cross-check — R-format uniquement (L-format compact stocke les œufs en grammes)
    var isR = /^R\d+$/.test((recipe.id || ''));
    if (isR && typeof window !== 'undefined' && window.RecipeRegistry) {
      var spec = window.RecipeRegistry.validateIngredientSpec(ing.name, ing.qty, ing.unit);
      spec.errors.forEach(function(e)   { issue(SEVERITY.ERROR, 'REG_UNIT_ERROR', e); });
      spec.warnings.forEach(function(w) { issue(SEVERITY.WARN,  'REG_QTY_WARN',  w); });
    }
  });

  return issues;
}

// ── VALIDATION UX / HUMAINE ───────────────────────────────────────────────────

function validateUX(recipe) {
  var issues = [];
  function issue(sev, code, msg) { issues.push({ severity: sev, code: code, message: msg }); }

  var rid   = recipe.id || recipe._id;
  var isR   = /^R\d+$/.test(recipe.id || '');
  if (!Array.isArray(recipe.ingredients)) return issues;

  recipe.ingredients.forEach(function(ing) {
    if (!ing.name) return;
    var qty  = typeof ing.qty === 'number' ? ing.qty : -1;
    var unit = (ing.unit || '').toLowerCase();
    var name = ing.name;
    var lname = name.toLowerCase();

    // Œuf en grammes — R-format uniquement (L-format stocke légitimement les œufs en g)
    if (isR && /^(oeuf|oeufs|œuf|œufs)/i.test(lname) && unit === 'g' && qty > 0) {
      issue(SEVERITY.ERROR, 'UX_EGG_IN_GRAMS', rid + ': "' + name + '" en grammes — utiliser pce');
    }

    // Nom sans ligature œ
    if (/^oeuf/i.test(name) && !/^[Œœ]/.test(name)) {
      issue(SEVERITY.WARN, 'UX_LIGATURE', rid + ': "' + name + '" — utiliser "Œuf" (ligature œ)');
    }

    // Avocat : quantité absurde
    if (/avocat/i.test(lname) && unit === 'g' && qty > 0) {
      var mod75 = qty % 75, mod150 = qty % 150;
      if (mod75 !== 0 && mod150 !== 0 && qty < 70) {
        issue(SEVERITY.WARN, 'UX_ABSURD_AVOCAT', rid + ': ' + name + ' qty=' + qty + 'g — arrondir à 75g ou 150g');
      }
    }

    // Huile : micro-quantité
    if (/huile/i.test(lname) && unit === 'ml' && qty > 0 && qty < 3) {
      issue(SEVERITY.WARN, 'UX_TINY_OIL', rid + ': ' + name + ' qty=' + qty + 'ml — minimum 5ml (1 c.à.c.)');
    }

    // Fraction inhabituelles sur pce
    if (unit === 'pce' && qty > 0) {
      var frac = qty % 1;
      if (frac !== 0 && frac !== 0.5 && qty < 10) {
        issue(SEVERITY.WARN, 'UX_WEIRD_FRACTION', rid + ': ' + name + ' qty=' + qty + ' pce — fraction inhabituelle');
      }
    }

    // Double mot dans le nom (avocat avocat, etc.)
    var words = lname.split(/\s+/);
    for (var i = 0; i < words.length - 1; i++) {
      if (words[i] === words[i + 1] && words[i].length > 3) {
        issue(SEVERITY.WARN, 'UX_DUPLICATED_WORD', rid + ': nom suspect "' + name + '" (mot répété)');
        break;
      }
    }
  });

  return issues;
}

// ── VALIDATION LINGUISTIQUE ───────────────────────────────────────────────────

function validateLinguistic(recipe) {
  var issues = [];
  function issue(sev, code, msg) { issues.push({ severity: sev, code: code, message: msg }); }

  var rid = recipe.id || recipe._id;

  // Nom de la recette
  var name = recipe.name || recipe.n || '';
  if (name && name === name.toUpperCase() && name.length > 3) {
    issue(SEVERITY.WARN, 'LING_ALL_CAPS', rid + ': nom en majuscules "' + name + '"');
  }
  if (name && name[0] && name[0] !== name[0].toUpperCase() && /^[a-zA-ZÀ-ÿ]/.test(name[0])) {
    issue(SEVERITY.WARN, 'LING_LOWERCASE_START', rid + ': nom commence en minuscule "' + name + '"');
  }

  return issues;
}

// ── VALIDATION SCALING ────────────────────────────────────────────────────────

function validateScaling(recipe) {
  var issues = [];
  function issue(sev, code, msg) { issues.push({ severity: sev, code: code, message: msg }); }

  var rid = recipe.id || recipe._id;
  if (!Array.isArray(recipe.ingredients)) return issues;

  [0.5, 2].forEach(function(factor) {
    recipe.ingredients.forEach(function(ing) {
      if (typeof ing.qty !== 'number') return;
      if (ing.qty * factor < 0) {
        issue(SEVERITY.ERROR, 'SCALE_NEGATIVE', rid + ': ' + ing.name + ' qty négative après ×' + factor);
      }
    });
  });

  return issues;
}

// ── AUTO-FIX SÛRS ────────────────────────────────────────────────────────────

function autoFix(recipe) {
  if (!Array.isArray(recipe.ingredients)) return { recipe: recipe, changes: [] };
  var changes = [];
  var fixed   = JSON.parse(JSON.stringify(recipe));
  var rid     = fixed.id || fixed._id;

  fixed.ingredients = fixed.ingredients.map(function(ing) {
    var before = JSON.stringify(ing);

    // unit: pièce/pièces/piece → pce
    if (FORBIDDEN_UNITS.indexOf((ing.unit || '').toLowerCase()) >= 0) {
      ing.unit = 'pce';
    }

    // unit: pincées → pincee
    if (ing.unit === 'pincées') ing.unit = 'pincee';

    // name: Oeuf → Œuf, oeufs → Œufs
    if (ing.name) {
      ing.name = ing.name
        .replace(/^oeufs\b/i, 'Œufs')
        .replace(/^oeuf\b/i,  'Œuf')
        .replace(/^Oeufs\b/,  'Œufs')
        .replace(/^Oeuf\b/,   'Œuf');
    }

    var after = JSON.stringify(ing);
    if (before !== after) changes.push(rid + ': ' + JSON.parse(before).name + ' → ' + after);
    return ing;
  });

  return { recipe: fixed, changes: changes };
}

// ── VALIDATION AGRÉGÉE ────────────────────────────────────────────────────────

function validateRecipe(recipe) {
  var issues = [].concat(
    validateStructure(recipe),
    validateNutrition(recipe),
    validateIngredients(recipe),
    validateUX(recipe),
    validateLinguistic(recipe),
    validateScaling(recipe)
  );
  var errors   = issues.filter(function(i) { return i.severity === SEVERITY.ERROR; });
  var warnings = issues.filter(function(i) { return i.severity === SEVERITY.WARN;  });
  return {
    id:       recipe.id || recipe._id,
    valid:    errors.length === 0,
    score:    Math.max(0, 100 - errors.length * 20 - warnings.length * 3),
    issues:   issues,
    errors:   errors,
    warnings: warnings
  };
}

function validateDatabase(db) {
  if (!Array.isArray(db)) return { valid: false, message: 'DB n\'est pas un Array' };
  var results = db.map(validateRecipe);
  var totalErrors = 0, totalWarnings = 0, invalid = [];
  results.forEach(function(r) {
    totalErrors   += r.errors.length;
    totalWarnings += r.warnings.length;
    if (!r.valid) invalid.push(r.id);
  });
  return {
    valid:          totalErrors === 0,
    totalRecipes:   db.length,
    invalidCount:   invalid.length,
    totalErrors:    totalErrors,
    totalWarnings:  totalWarnings,
    results:        results,
    invalidRecipes: invalid
  };
}

function generateReport(v) {
  var lines = [
    '═══════════════════════════════════════════════════════════════',
    ' RECIPE INTEGRITY REPORT — SmartFitCoach',
    '═══════════════════════════════════════════════════════════════',
    ' Total recettes : ' + v.totalRecipes,
    ' Invalides       : ' + v.invalidCount,
    ' Erreurs         : ' + v.totalErrors,
    ' Warnings        : ' + v.totalWarnings,
    ' Statut          : ' + (v.valid ? '✓ CLEAN' : '✗ ANOMALIES DÉTECTÉES'),
    '───────────────────────────────────────────────────────────────'
  ];
  if (v.totalErrors > 0) {
    lines.push(' ERREURS CRITIQUES :');
    var eCount = 0;
    v.results.forEach(function(r) {
      r.errors.forEach(function(e) {
        if (eCount < 20) { lines.push('  ✗ [' + e.code + '] ' + e.message); eCount++; }
      });
    });
    if (v.totalErrors > 20) lines.push('  … et ' + (v.totalErrors - 20) + ' de plus');
    lines.push('───────────────────────────────────────────────────────────────');
  }
  if (v.totalWarnings > 0) {
    lines.push(' TOP WARNINGS :');
    var wCount = 0;
    v.results.forEach(function(r) {
      r.warnings.forEach(function(w) {
        if (wCount < 10) { lines.push('  ⚠ [' + w.code + '] ' + w.message); wCount++; }
      });
    });
    if (v.totalWarnings > 10) lines.push('  … et ' + (v.totalWarnings - 10) + ' de plus');
  }
  lines.push('═══════════════════════════════════════════════════════════════');
  return lines.join('\n');
}

if (typeof window !== 'undefined') {
  window.RecipeValidator = {
    SEVERITY:           SEVERITY,
    VALID_UNITS:        VALID_UNITS,
    FORBIDDEN_UNITS:    FORBIDDEN_UNITS,
    validateStructure:  validateStructure,
    validateNutrition:  validateNutrition,
    validateIngredients: validateIngredients,
    validateUX:         validateUX,
    validateLinguistic: validateLinguistic,
    validateScaling:    validateScaling,
    validateRecipe:     validateRecipe,
    validateDatabase:   validateDatabase,
    autoFix:            autoFix,
    generateReport:     generateReport
  };
}

})();
