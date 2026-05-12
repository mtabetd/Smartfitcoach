(function() {
'use strict';

// ─── RECIPE INTELLIGENCE LAYER ────────────────────────────────────────────────
// Évalue la qualité humaine réelle des recettes : cohérence culinaire,
// scoring premium multi-dimensionnel, analyse de diversité, portions humaines.
// ─────────────────────────────────────────────────────────────────────────────

// ── CONSTANTES ────────────────────────────────────────────────────────────────

var KCAL_TARGETS = Object.freeze({
  breakfast: { min: 250, ideal: 420, max: 600 },
  lunch:     { min: 350, ideal: 550, max: 750 },
  dinner:    { min: 300, ideal: 500, max: 700 },
  snack:     { min: 80,  ideal: 200, max: 350 }
});

var SCORE_WEIGHTS = Object.freeze({
  proteinDensity:  0.25,
  satiety:         0.20,
  portionRealism:  0.15,
  prepFeasibility: 0.15,
  readability:     0.15,
  simplicity:      0.10
});

// ── BASES DE CONNAISSANCES CULINAIRES ────────────────────────────────────────

var PROTEIN_SOURCES = /poulet|dinde|boeuf|porc|agneau|veau|lapin|canard|thon|saumon|cabillaud|dorade|loup|sardine|maquereau|crevette|moule|calmar|seiche|oeuf|œuf|blanc.d.oeuf|lentille|pois.chiche|haricot|edamame|tofu|seitan|tempeh|fromage blanc|yaourt.grec|ricotta|cottage/i;

var VEGETABLE_SOURCES = /tomate|concombre|courgette|carotte|brocoli|épinard|epinard|laitue|salade|poivron|oignon|champignon|haricot.vert|petit.pois|asperge|chou|artichaut|céleri|celeri|fenouil|aubergine|radis|betterave|navet|poireau|endive|cresson|roquette|avocat|patate.douce|courge|butternut/i;

var INCOHERENT_COMBOS = [
  { a: /chocolat/i,                  b: /poisson|crevette|thon|saumon|anchois|moule/i, msg: 'chocolat + fruits de mer' },
  { a: /fraise|framboises/i,         b: /cumin|paprika|curry|harissa|ail\b/i,           msg: 'fruit rouge + épice forte' },
  { a: /nutella|confiture|jam\b/i,   b: /thon|poulet|boeuf|agneau|viande/i,             msg: 'sucrant doux + protéine salée' },
  { a: /roquefort|bleu|gorgonzola/i, b: /crevette|thon|saumon|poisson/i,                msg: 'fromage fort + poisson délicat' },
  { a: /menthe fraîche|menthe\b/i,   b: /parmesan|gruyère|emmental|comté/i,             msg: 'menthe + fromage affiné' }
];

// Profils arômes pour détecter les mélanges incohérents
var AROMA_PROFILES = {
  asiatique:     /sauce.soja|tamari|gingembre|citronnelle|nuoc.mam|fish.sauce|pâte de curry|kaffir|galanga/i,
  mediterran:    /origan|basilic|câpre|feta|tomate.séch|tapenade|pistou/i,
  nordique:      /aneth|raifort|baies.roses|gravlax|crème aigre/i,
  maghrébin:     /ras.el.hanout|chermoula|harissa|cumin|cannelle|gingembre.en.poudre|merguez/i,
  mexicain:      /cumin|jalapeño|chipotle|tomatillo|coriandre.fraîche|lime/i
};

// ── HELPERS ──────────────────────────────────────────────────────────────────

function getNutritionPerServing(recipe) {
  if (recipe.baseNutrition) {
    var bn = recipe.baseNutrition;
    var s  = recipe.servings || 1;
    return {
      calories: Math.round(bn.calories / s),
      protein:  Math.round((bn.proteinGrams || 0) / s * 10) / 10,
      carbs:    Math.round((bn.carbsGrams   || 0) / s * 10) / 10,
      fat:      Math.round((bn.fatGrams     || 0) / s * 10) / 10
    };
  }
  if (recipe.k != null) {
    return { calories: recipe.k, protein: recipe.p || 0, carbs: recipe.g || 0, fat: recipe.l || 0 };
  }
  return null;
}

function getMealType(recipe) {
  var types = recipe.mealTypes || [];
  if (types.indexOf('breakfast') >= 0) return 'breakfast';
  if (types.indexOf('lunch')     >= 0) return 'lunch';
  if (types.indexOf('dinner')    >= 0) return 'dinner';
  if (types.indexOf('snack')     >= 0) return 'snack';
  return 'lunch';
}

function getIngredients(recipe) {
  return Array.isArray(recipe.ingredients) ? recipe.ingredients : [];
}

function ingredientNamesStr(recipe) {
  return getIngredients(recipe).map(function(i) { return (i.name || '').toLowerCase(); }).join(' ');
}

function clamp(v, lo, hi) { return Math.min(hi, Math.max(lo, Math.round(v))); }

// ── 1. CULINARY COHERENCE ENGINE ─────────────────────────────────────────────

function checkCoherence(recipe) {
  var flags = [];
  var rid    = recipe.id || recipe._id;
  var ingStr = ingredientNamesStr(recipe);
  var ings   = getIngredients(recipe);
  var name   = (recipe.name || recipe.n || '').toLowerCase();
  var mealT  = getMealType(recipe);

  // Combinaisons incompatibles connues
  INCOHERENT_COMBOS.forEach(function(c) {
    if (c.a.test(ingStr) && c.b.test(ingStr)) {
      flags.push({ type: 'COMBO_INCOHERENT', severity: 'warn', msg: rid + ': association suspecte — ' + c.msg });
    }
  });

  // Trop de sauces / condiments dans une seule recette
  var sauceCount = ings.filter(function(i) {
    return /\b(sauce|vinaigrette|marinade|condiment|ketchup|mayo)\b/i.test(i.name || '');
  }).length;
  if (sauceCount >= 3) {
    flags.push({ type: 'TOO_MANY_SAUCES', severity: 'info', msg: rid + ': ' + sauceCount + ' sauces dans une recette (surcharge sensorielle)' });
  }

  // Aucune source protéique pour déjeuner/dîner
  if (!PROTEIN_SOURCES.test(ingStr) && (mealT === 'lunch' || mealT === 'dinner') && ings.length > 2) {
    flags.push({ type: 'NO_PROTEIN_SOURCE', severity: 'warn', msg: rid + ': aucune source protéique détectée (' + mealT + ')' });
  }

  // Aucun légume pour déjeuner/dîner (recettes avec assez d'ingrédients)
  if (!VEGETABLE_SOURCES.test(ingStr) && (mealT === 'lunch' || mealT === 'dinner') && ings.length > 4) {
    flags.push({ type: 'NO_VEGETABLES', severity: 'info', msg: rid + ': aucun légume détecté (' + mealT + ')' });
  }

  // Mélange de 3+ profils arômes incompatibles
  var aromaCount = Object.keys(AROMA_PROFILES).filter(function(k) {
    return AROMA_PROFILES[k].test(ingStr);
  }).length;
  if (aromaCount >= 3) {
    flags.push({ type: 'AROMA_CLASH', severity: 'info', msg: rid + ': ' + aromaCount + ' profils aromatiques distincts (risque de confusion gustative)' });
  }

  // Recette monotexture : tout est mou (aucun crunch/croustillant)
  var hasCrunchy = /graines|noix|amandes|noisettes|cacahuètes|pistaches|grillé|croustillant|toast|pain.grillé|sésame|granola/i.test(ingStr);
  var allSoft    = /fromage blanc|yaourt|crème|compote|purée|mousse|lisse/i.test(name);
  if (allSoft && !hasCrunchy && ings.length > 3) {
    flags.push({ type: 'MONO_TEXTURE', severity: 'info', msg: rid + ': recette probablement mono-texture (tout mou)' });
  }

  // Repas ultra-minimaliste sans satiété réelle
  var nutr = getNutritionPerServing(recipe);
  if (nutr && nutr.calories < 200 && (mealT === 'lunch' || mealT === 'dinner')) {
    flags.push({ type: 'INSUFFICIENT_SATIETY', severity: 'warn', msg: rid + ': ' + nutr.calories + ' kcal/portion insuffisant pour ' + mealT });
  }

  return flags;
}

// ── 2. PREMIUM UX SCORING ────────────────────────────────────────────────────

function scoreReadability(recipe) {
  var name  = recipe.name || recipe.n || '';
  var steps = recipe.steps || [];
  var score = 60;

  if (!name || name.length < 3) return 20;

  // Nom : longueur idéale 8-40 chars
  if (name.length >= 8  && name.length <= 40)  score += 15;
  else if (name.length < 5 || name.length > 60) score -= 15;

  // Nom générique
  if (/^(recette|plat|meal|dish|food|repas)\s/i.test(name)) score -= 20;

  // Nom en majuscules (ALL CAPS)
  if (/^[A-ZŒÀÉÈÙÛÎÏÔÇ\s]+$/.test(name) && name.length > 5) score -= 15;

  // Emoji présent
  if (recipe.emoji || recipe.f) score += 10;

  // Origine identifiable
  if (recipe.origin) score += 5;

  // Steps : idéal 3-6 étapes concises
  if (steps.length >= 2 && steps.length <= 6) score += 15;
  else if (steps.length > 8) score -= 10;

  // Tags renseignés
  if (Array.isArray(recipe.tags) && recipe.tags.length >= 2) score += 5;

  return clamp(score, 0, 100);
}

function scoreProteinDensity(recipe) {
  var nutr = getNutritionPerServing(recipe);
  if (!nutr || nutr.calories <= 0) return 50;

  var ratio = nutr.protein / nutr.calories; // g/kcal
  if (ratio >= 0.10) return 100; // elite (ex: poulet vapeur)
  if (ratio >= 0.08) return 90;
  if (ratio >= 0.06) return 75;
  if (ratio >= 0.04) return 58;
  if (ratio >= 0.025) return 42;
  return 20;
}

function scoreSatiety(recipe) {
  var nutr   = getNutritionPerServing(recipe);
  var ingStr = ingredientNamesStr(recipe);
  if (!nutr) return 50;

  var score = 40;

  // Protéines : premier driver de satiété
  if (nutr.protein >= 35) score += 30;
  else if (nutr.protein >= 25) score += 22;
  else if (nutr.protein >= 15) score += 14;
  else if (nutr.protein >= 8)  score += 6;

  // Lipides : modèrent la vitesse de digestion
  if (nutr.fat >= 8 && nutr.fat <= 30) score += 12;
  else if (nutr.fat > 30) score += 5; // trop de gras, moins optimal

  // Fibres alimentaires (légumineuses, légumes, céréales complètes)
  if (/lentille|pois.chiche|haricot|flocons.d.avoine|son|seigle|blé.complet|avoine|épinard|brocoli|chou/i.test(ingStr)) score += 15;
  else if (VEGETABLE_SOURCES.test(ingStr)) score += 8;

  // Calories dans la bonne fourchette pour le type de repas
  var target = KCAL_TARGETS[getMealType(recipe)] || KCAL_TARGETS.lunch;
  if (nutr.calories >= target.min && nutr.calories <= target.max) score += 10;

  return clamp(score, 0, 100);
}

function scorePortionRealism(recipe) {
  var nutr = getNutritionPerServing(recipe);
  if (!nutr || nutr.calories <= 0) return 50;

  var target = KCAL_TARGETS[getMealType(recipe)] || KCAL_TARGETS.lunch;

  if (nutr.calories < target.min * 0.7) return 20; // frustrant
  if (nutr.calories < target.min)        return 45;
  if (nutr.calories > target.max * 1.3)  return 30; // excessif
  if (nutr.calories > target.max)        return 50;

  // Dans la plage — score selon proximité à l'idéal
  var dist = Math.abs(nutr.calories - target.ideal) / target.ideal;
  if (dist < 0.08) return 100;
  if (dist < 0.15) return 88;
  if (dist < 0.25) return 74;
  return 60;
}

function scorePrepFeasibility(recipe) {
  var total = (recipe.prepTime || 0) + (recipe.cookTime || 0);
  var score = 75; // défaut si pas de durée renseignée

  if (total > 0) {
    if      (total <= 10) score = 100;
    else if (total <= 20) score = 92;
    else if (total <= 30) score = 80;
    else if (total <= 45) score = 65;
    else if (total <= 60) score = 48;
    else                  score = 30;
  }

  // Complexité ingrédients
  var n = getIngredients(recipe).length;
  if      (n > 15) score -= 15;
  else if (n > 10) score -= 8;
  else if (n <= 5) score += 5;

  // Nombre d'étapes
  var steps = (recipe.steps || []).length;
  if      (steps > 9) score -= 12;
  else if (steps > 6) score -= 5;
  else if (steps > 0 && steps <= 5) score += 5;

  // Tag meal-prep : bonus
  if (Array.isArray(recipe.tags) && recipe.tags.indexOf('meal-prep') >= 0) score += 8;

  return clamp(score, 0, 100);
}

function scoreSimplicity(recipe) {
  var n = getIngredients(recipe).length;
  if (n === 0) return 50;
  if (n <= 3)  return 95;
  if (n <= 5)  return 88;
  if (n <= 7)  return 78;
  if (n <= 9)  return 65;
  if (n <= 12) return 50;
  if (n <= 15) return 38;
  return Math.max(15, 38 - (n - 15) * 2);
}

function scorePremium(recipe) {
  var scores = {
    proteinDensity:  scoreProteinDensity(recipe),
    satiety:         scoreSatiety(recipe),
    portionRealism:  scorePortionRealism(recipe),
    prepFeasibility: scorePrepFeasibility(recipe),
    readability:     scoreReadability(recipe),
    simplicity:      scoreSimplicity(recipe)
  };

  var total = 0;
  Object.keys(SCORE_WEIGHTS).forEach(function(k) { total += (scores[k] || 0) * SCORE_WEIGHTS[k]; });

  return { scores: scores, premium: Math.round(total) };
}

// ── 3. RECIPE DIVERSITY ENGINE ───────────────────────────────────────────────

function analyzeDiversity(db) {
  var rFormat = db.filter(function(r) { return /^R\d+$/.test(r.id || '') && Array.isArray(r.ingredients); });
  var n       = rFormat.length;
  if (n === 0) return { totalAnalyzed: 0, diversityScore: 100, topIngredients: [], overused: [], monotonyFlags: [], proteinSourceDistribution: {}, mealTypeDistribution: {}, originDistribution: {} };

  // Fréquence des ingrédients
  var ingFreq = {};
  rFormat.forEach(function(r) {
    r.ingredients.forEach(function(ing) {
      var key = (ing.name || '').toLowerCase().trim();
      if (key && key.length > 2) ingFreq[key] = (ingFreq[key] || 0) + 1;
    });
  });

  var sorted     = Object.keys(ingFreq).sort(function(a, b) { return ingFreq[b] - ingFreq[a]; });
  var topItems   = sorted.slice(0, 15).map(function(k) { return { name: k, count: ingFreq[k], pct: Math.round(ingFreq[k] / n * 100) }; });
  var overused   = topItems.filter(function(i) { return i.pct > 50; });

  // Distribution sources protéiques
  var protSrc = {};
  var protMap = [
    { key: 'poulet/dinde', rx: /poulet|dinde/i },
    { key: 'poisson',      rx: /thon|saumon|cabillaud|dorade|maquereau|sardine/i },
    { key: 'viande.rouge', rx: /boeuf|agneau|veau|porc/i },
    { key: 'oeuf',         rx: /oeuf|œuf/i },
    { key: 'légumineuses', rx: /lentille|pois.chiche|haricot|edamame/i },
    { key: 'végétal',      rx: /tofu|seitan|tempeh/i }
  ];
  rFormat.forEach(function(r) {
    var s = ingredientNamesStr(r);
    protMap.forEach(function(p) { if (p.rx.test(s)) protSrc[p.key] = (protSrc[p.key] || 0) + 1; });
  });

  // Distribution types de repas
  var mealFreq = {};
  db.forEach(function(r) {
    (r.mealTypes || []).forEach(function(t) { mealFreq[t] = (mealFreq[t] || 0) + 1; });
  });

  // Distribution origines
  var originFreq = {};
  db.forEach(function(r) {
    var o = r.origin || r.f || '🌍';
    originFreq[o] = (originFreq[o] || 0) + 1;
  });

  // Flags monotonie
  var monotonyFlags = overused.map(function(i) {
    return i.name + ' : présent dans ' + i.pct + '% des recettes R-format';
  });

  // Score diversité : pénalisé par monotonie et inégalité des sources protéiques
  var diversityScore = 100 - overused.length * 8;
  var protValues = Object.values(protSrc);
  if (protValues.length > 0) {
    var maxProt = Math.max.apply(null, protValues);
    var totalProt = protValues.reduce(function(a, b) { return a + b; }, 0);
    var dominance = maxProt / totalProt;
    if (dominance > 0.6) diversityScore -= 15; // une source domine trop
    else if (dominance < 0.35) diversityScore += 5; // bonne répartition
  }

  return {
    totalAnalyzed:            n,
    topIngredients:           topItems,
    overused:                 overused,
    monotonyFlags:            monotonyFlags,
    diversityScore:           clamp(diversityScore, 0, 100),
    proteinSourceDistribution: protSrc,
    mealTypeDistribution:     mealFreq,
    originDistribution:       originFreq
  };
}

// ── 4. HUMAN PORTION LOGIC ────────────────────────────────────────────────────

function assessPortions(recipe) {
  var nutr  = getNutritionPerServing(recipe);
  var mealT = getMealType(recipe);
  var flags = [];
  var rid   = recipe.id || recipe._id;
  if (!nutr) return flags;

  var t = KCAL_TARGETS[mealT] || KCAL_TARGETS.lunch;

  if (nutr.calories < t.min * 0.7) {
    flags.push({ type: 'PORTION_FRUSTRATING', severity: 'warn',
      msg: rid + ': ' + nutr.calories + ' kcal/' + mealT + ' — portion psychologiquement insuffisante (< ' + Math.round(t.min * 0.7) + ' kcal)' });
  } else if (nutr.calories > t.max * 1.4) {
    flags.push({ type: 'PORTION_EXCESSIVE', severity: 'info',
      msg: rid + ': ' + nutr.calories + ' kcal/' + mealT + ' — portion très élevée (> ' + Math.round(t.max * 1.4) + ' kcal)' });
  }

  if (nutr.protein < 10 && (mealT === 'lunch' || mealT === 'dinner')) {
    flags.push({ type: 'LOW_PROTEIN_PORTION', severity: 'warn',
      msg: rid + ': ' + nutr.protein + 'g protéines/' + mealT + ' — trop faible (< 10g)' });
  }

  return flags;
}

// ── 5. ANALYSE RECETTE ────────────────────────────────────────────────────────

function analyzeRecipe(recipe) {
  var coh    = checkCoherence(recipe);
  var port   = assessPortions(recipe);
  var prem   = scorePremium(recipe);
  var nutr   = getNutritionPerServing(recipe);
  var score  = prem.premium;
  var grade  = score >= 82 ? 'A' : score >= 68 ? 'B' : score >= 52 ? 'C' : 'D';

  return {
    id:             recipe.id || recipe._id,
    name:           recipe.name || recipe.n || '',
    mealType:       getMealType(recipe),
    nutrition:      nutr,
    coherenceFlags: coh,
    portionFlags:   port,
    scores:         prem.scores,
    premiumScore:   score,
    grade:          grade,
    flags:          coh.concat(port),
    ingredientCount: getIngredients(recipe).length,
    totalTime:      (recipe.prepTime || 0) + (recipe.cookTime || 0)
  };
}

function analyzeDatabase(db) {
  var rFormat = db.filter(function(r) { return /^R\d+$/.test(r.id || ''); });
  var results = rFormat.map(analyzeRecipe);

  var totalScore = results.reduce(function(s, r) { return s + r.premiumScore; }, 0);
  var avg        = rFormat.length > 0 ? Math.round(totalScore / rFormat.length) : 0;

  var grades = { A: 0, B: 0, C: 0, D: 0 };
  results.forEach(function(r) { grades[r.grade]++; });

  var allFlags = [];
  results.forEach(function(r) { allFlags = allFlags.concat(r.flags); });

  var byScore = results.slice().sort(function(a, b) { return b.premiumScore - a.premiumScore; });

  return {
    analyzed:            rFormat.length,
    avgPremiumScore:     avg,
    gradeDistribution:   grades,
    allFlags:            allFlags,
    topRecipes:          byScore.slice(0, 10).map(function(r) { return { id: r.id, name: r.name, score: r.premiumScore, grade: r.grade }; }),
    bottomRecipes:       byScore.slice(-10).reverse().map(function(r) { return { id: r.id, name: r.name, score: r.premiumScore, grade: r.grade }; }),
    diversity:           analyzeDiversity(db),
    flagCounts:          (function() {
      var fc = {};
      allFlags.forEach(function(f) { fc[f.type] = (fc[f.type] || 0) + 1; });
      return fc;
    }()),
    results:             results
  };
}

// ── 6. RAPPORT ───────────────────────────────────────────────────────────────

function generateIntelligenceReport(analysis) {
  var g = analysis.gradeDistribution;
  var d = analysis.diversity;

  var lines = [
    '═══════════════════════════════════════════════════════════════',
    ' RECIPE INTELLIGENCE REPORT — SmartFitCoach',
    '═══════════════════════════════════════════════════════════════',
    ' Recettes analysées   : ' + analysis.analyzed,
    ' Score premium moyen  : ' + analysis.avgPremiumScore + '/100',
    ' Distribution grades  : A=' + g.A + '  B=' + g.B + '  C=' + g.C + '  D=' + g.D,
    ' Score diversité DB   : ' + d.diversityScore + '/100',
    '───────────────────────────────────────────────────────────────'
  ];

  // Flags culinaires
  var warnFlags = analysis.allFlags.filter(function(f) { return f.severity === 'warn'; });
  if (warnFlags.length > 0) {
    lines.push(' ALERTES COHÉRENCE CULINAIRE (' + warnFlags.length + ') :');
    warnFlags.slice(0, 8).forEach(function(f) { lines.push('  ⚠ [' + f.type + '] ' + f.msg); });
    if (warnFlags.length > 8) lines.push('  … et ' + (warnFlags.length - 8) + ' autres');
    lines.push('───────────────────────────────────────────────────────────────');
  }

  // Top recettes
  lines.push(' TOP 5 RECETTES PREMIUM :');
  analysis.topRecipes.slice(0, 5).forEach(function(r) {
    lines.push('  ' + r.grade + ' [' + r.score + '/100] ' + r.id + ' — ' + r.name);
  });

  lines.push('───────────────────────────────────────────────────────────────');
  lines.push(' RECETTES À AMÉLIORER (grade D) :');
  analysis.bottomRecipes.filter(function(r) { return r.grade === 'D'; }).slice(0, 5).forEach(function(r) {
    lines.push('  D [' + r.score + '/100] ' + r.id + ' — ' + r.name);
  });

  lines.push('───────────────────────────────────────────────────────────────');
  lines.push(' DIVERSITÉ :');

  if (d.overused.length > 0) {
    lines.push('  Ingrédients surreprésentés :');
    d.overused.forEach(function(i) { lines.push('    • ' + i.name + ' — ' + i.count + ' recettes (' + i.pct + '%)'); });
  } else {
    lines.push('  ✓ Bonne diversité des ingrédients');
  }

  lines.push('  Sources protéiques :');
  Object.keys(d.proteinSourceDistribution).sort(function(a, b) {
    return d.proteinSourceDistribution[b] - d.proteinSourceDistribution[a];
  }).forEach(function(k) {
    var n = d.proteinSourceDistribution[k];
    var pct = Math.round(n / d.totalAnalyzed * 100);
    lines.push('    • ' + k + ' : ' + n + ' recettes (' + pct + '%)');
  });

  // Recommandations
  lines.push('───────────────────────────────────────────────────────────────');
  lines.push(' RECOMMANDATIONS :');
  if (analysis.avgPremiumScore < 60) {
    lines.push('  → Score moyen faible — revoir les portions et la densité protéique');
  }
  if (d.overused.length > 2) {
    lines.push('  → Trop de répétitions — diversifier les ingrédients principaux');
  }
  var noProtFlag = analysis.flagCounts['NO_PROTEIN_SOURCE'] || 0;
  if (noProtFlag > 5) {
    lines.push('  → ' + noProtFlag + ' recettes sans source protéique claire à déjeuner/dîner');
  }
  var portFrust = analysis.flagCounts['PORTION_FRUSTRATING'] || 0;
  if (portFrust > 3) {
    lines.push('  → ' + portFrust + ' recettes avec portions insuffisantes — risque abandon utilisateur');
  }

  lines.push('═══════════════════════════════════════════════════════════════');
  return lines.join('\n');
}

if (typeof window !== 'undefined') {
  window.RecipeIntelligence = {
    KCAL_TARGETS:              KCAL_TARGETS,
    SCORE_WEIGHTS:             SCORE_WEIGHTS,
    AROMA_PROFILES:            AROMA_PROFILES,
    INCOHERENT_COMBOS:         INCOHERENT_COMBOS,
    checkCoherence:            checkCoherence,
    assessPortions:            assessPortions,
    scoreReadability:          scoreReadability,
    scoreProteinDensity:       scoreProteinDensity,
    scoreSatiety:              scoreSatiety,
    scorePortionRealism:       scorePortionRealism,
    scorePrepFeasibility:      scorePrepFeasibility,
    scoreSimplicity:           scoreSimplicity,
    scorePremium:              scorePremium,
    analyzeDiversity:          analyzeDiversity,
    analyzeRecipe:             analyzeRecipe,
    analyzeDatabase:           analyzeDatabase,
    generateIntelligenceReport: generateIntelligenceReport
  };
}

})();
