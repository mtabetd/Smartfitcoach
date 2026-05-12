(function() {
'use strict';

// ─── RECIPE UX EXPLAINER ─────────────────────────────────────────────────────
// Couche d'explication des scores UX : facteurs positifs/négatifs,
// pistes d'amélioration, profils sensoriels, clusters de répétition,
// simulation de fatigue comportementale long terme (1s / 1m / 3m).
//
// Chaque score devient traçable : pourquoi 72 ? quels éléments l'impactent ?
// comment améliorer ? quelle projection sur 3 mois ?
// ─────────────────────────────────────────────────────────────────────────────

// ── CONSTANTES ────────────────────────────────────────────────────────────────

var KCAL_TARGETS = Object.freeze({
  breakfast: { min: 250, ideal: 420, max: 600 },
  lunch:     { min: 350, ideal: 550, max: 750 },
  dinner:    { min: 300, ideal: 500, max: 700 },
  snack:     { min: 80,  ideal: 200, max: 350 }
});

// ── PROFILS SENSORIELS ────────────────────────────────────────────────────────

var TEXTURE_PROFILES = {
  SOFT:    /fromage blanc|yaourt\b|purée|mousse\b|crème\b|compote|velouté/i,
  CRISPY:  /toast\b|pain.grillé|granola|croustillant/i,
  CRUNCHY: /noix\b|amandes|noisettes|graines\b|sésame|cacahuètes|pistaches/i,
  CHEWY:   /pâtes\b|riz\b|quinoa|pain\b|poulet|boeuf|bœuf|saumon|lentille|pois.chiche/i,
  LIQUID:  /soupe\b|bouillon|smoothie|jus\b|velouté|gaspacho/i
};

var FLAVOR_PROFILES = {
  SWEET:  /miel\b|sucre\b|confiture|chocolat\b|vanille|caramel|fruit\b/i,
  SALTY:  /sel\b|sauce.soja|parmesan|feta\b|anchois|câpre/i,
  ACID:   /citron\b|vinaigre|tomate\b|yaourt\b|cornichon/i,
  BITTER: /roquette|endive\b|pamplemousse|café\b/i,
  UMAMI:  /champignon|parmesan|sauce.soja|bouillon|miso|concentré.de.tomate/i
};

var COLOR_PROFILES = {
  GREEN:  /brocoli|épinard|courgette|haricot.vert|roquette|avocat|concombre|poireau/i,
  RED:    /tomate\b|poivron.rouge|fraise\b|framboise|betterave/i,
  ORANGE: /carotte|potiron|abricot|mangue|patate.douce/i,
  YELLOW: /maïs\b|ananas|citron\b|poivron.jaune/i,
  PURPLE: /aubergine|myrtille|chou.rouge/i,
  WHITE:  /riz\b|feta\b|chou.fleur|fromage\b|lait\b/i,
  BROWN:  /noix\b|noisette|chocolat\b|champignon\b|pain\b/i
};

// ── CLASSIFICATION INGRÉDIENTS ────────────────────────────────────────────────

var PROTEIN_KEYS = [
  { key: 'poulet/dinde',  rx: /poulet|dinde/ },
  { key: 'viande rouge',  rx: /boeuf|bœuf|agneau|veau|porc/ },
  { key: 'poisson',       rx: /thon|saumon|cabillaud|dorade|maquereau|sardine/ },
  { key: 'fruits de mer', rx: /crevette|moule|calmar/ },
  { key: 'œuf',           rx: /oeuf|œuf/ },
  { key: 'légumineuses',  rx: /lentille|pois.chiche|haricot\b|edamame/ },
  { key: 'tofu/seitan',   rx: /tofu|seitan|tempeh/ },
  { key: 'laitier',       rx: /fromage blanc|yaourt.grec|cottage|ricotta/ }
];

var CARB_KEYS = [
  { key: 'riz',             rx: /riz\b/ },
  { key: 'pâtes',           rx: /pâtes|pasta/ },
  { key: 'quinoa',          rx: /quinoa/ },
  { key: 'pomme de terre',  rx: /pomme.de.terre|patate/ },
  { key: 'pain',            rx: /pain\b|toast\b/ },
  { key: 'couscous',        rx: /couscous/ },
  { key: 'blé/boulgour',    rx: /blé\b|boulgour|épeautre/ },
  { key: 'avoine',          rx: /avoine|flocons.d.avoine/ }
];

var PLEASURE_INGREDIENTS = /avocat|fromage|noix|amande|noisette|pistache|saumon|thon|crevette|bœuf|boeuf|agneau|parmesan|mozzarella|mangue|fraise|framboise|myrtille|chocolat.noir|tahini|houmous|pesto/i;
var FIBER_RICH            = /lentille|pois.chiche|haricot\b|flocons.d.avoine|son\b|avoine|épinard|brocoli|patate.douce|courge|chia|lin\b/i;
var HARD_TO_FIND          = /galanga|kaffir|tomatillo|wasabi.frais|truffe\b|oursin\b|homard\b|langoustine|foie.gras/i;
var TECHNICAL_SKILLS      = /julienne|brunoise|blanchir|flamber|déglac|monter.en.neige|tempérer|émulsionner/i;
var PLEASURE_TECHNIQUES   = /grillé|mariné|rôti|caramélisé|croustillant|doré|fondant|moelleux/i;
var GENERIC_NAMES         = /^(salade verte\b|poulet légumes\b|riz blanc\b|pasta\b|pâtes simples\b|soupe légumes\b|légumes sautés\b|recette simple\b|plat simple\b)/i;
var PREMIUM_NAMES         = /bowl|tartare|carpaccio|buddha|poke|wrap|burrito|tagine|curry|risotto|paella|ramen|pho|shakshuka|açaí|granola|overnight|smoothie.bowl|bento/i;

// ── HELPERS ────────────────────────────────────────────────────────────────────

function clamp(v, lo, hi) { return Math.min(hi, Math.max(lo, Math.round(v))); }

function getNutr(recipe) {
  if (recipe.baseNutrition) {
    var bn = recipe.baseNutrition, s = recipe.servings || 1;
    return { calories: Math.round(bn.calories / s), protein: (bn.proteinGrams || 0) / s,
             carbs: (bn.carbsGrams || 0) / s, fat: (bn.fatGrams || 0) / s };
  }
  if (recipe.k != null) return { calories: recipe.k, protein: recipe.p || 0, carbs: recipe.g || 0, fat: recipe.l || 0 };
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

function getProteinKey(recipe) {
  var is = ingStr(recipe);
  for (var i = 0; i < PROTEIN_KEYS.length; i++) {
    if (PROTEIN_KEYS[i].rx.test(is)) return PROTEIN_KEYS[i].key;
  }
  return null;
}

function getCarbKey(recipe) {
  var is = ingStr(recipe);
  for (var i = 0; i < CARB_KEYS.length; i++) {
    if (CARB_KEYS[i].rx.test(is)) return CARB_KEYS[i].key;
  }
  return null;
}

// ── 1. PROFILS SENSORIELS ────────────────────────────────────────────────────

function getTextureProfile(recipe) {
  var comb = ingStr(recipe) + ' ' + (recipe.name || recipe.n || '').toLowerCase();
  var textures = Object.keys(TEXTURE_PROFILES).filter(function(k) { return TEXTURE_PROFILES[k].test(comb); });
  return {
    textures:   textures,
    diversity:  textures.length,
    dominant:   textures[0] || 'neutral',
    isMonotone: textures.length <= 1 && ingCount(recipe) > 3
  };
}

function getFlavorProfile(recipe) {
  var is = ingStr(recipe);
  var flavors = Object.keys(FLAVOR_PROFILES).filter(function(k) { return FLAVOR_PROFILES[k].test(is); });
  return {
    flavors:    flavors,
    complexity: flavors.length,
    dominant:   flavors[0] || 'neutral',
    balanced:   flavors.length >= 2
  };
}

function getVisualRichness(recipe) {
  var is = ingStr(recipe);
  var colors = Object.keys(COLOR_PROFILES).filter(function(c) { return COLOR_PROFILES[c].test(is); });
  return {
    colors:    colors,
    richness:  colors.length,
    score:     Math.min(100, colors.length * 15 + 10),
    appealing: colors.length >= 3
  };
}

// ── 2. COMPUTE ALL FACTORS ────────────────────────────────────────────────────
// Retourne tous les facteurs positifs et négatifs d'une recette.
// Chaque facteur : { key, impact (absolu), message }

function computeAllFactors(recipe) {
  var pos = [], neg = [];
  function p(key, impact, msg) { pos.push({ key: key, impact: impact, message: msg }); }
  function n(key, impact, msg) { neg.push({ key: key, impact: impact, message: msg }); }

  var nutr  = getNutr(recipe);
  var is    = ingStr(recipe);
  var name  = recipe.name || recipe.n || '';
  var steps = (recipe.steps || []).join(' ').toLowerCase();
  var tags  = (recipe.tags || []).join(' ');
  var cnt   = ingCount(recipe);
  var total = (recipe.prepTime || 0) + (recipe.cookTime || 0);
  var mt    = getMealType(recipe);
  var tp    = getTextureProfile(recipe);
  var fp    = getFlavorProfile(recipe);
  var vr    = getVisualRichness(recipe);

  // Protéines
  if (nutr) {
    if      (nutr.protein >= 35) p('HIGH_PROTEIN',           15, 'Protéines élevées (' + Math.round(nutr.protein) + 'g) → satiété durable et adhérence');
    else if (nutr.protein >= 20) p('ADEQUATE_PROTEIN',        8, 'Protéines correctes (' + Math.round(nutr.protein) + 'g)');
    else if (nutr.protein >= 10) p('LOW_ADEQUATE_PROTEIN',    3, 'Protéines modérées (' + Math.round(nutr.protein) + 'g)');
    else                         n('LOW_PROTEIN',             12, 'Protéines insuffisantes (' + Math.round(nutr.protein) + 'g) → faim rapide, risque abandon');
  }

  // Fibres
  if (FIBER_RICH.test(is)) p('FIBER_RICH', 8, 'Fibres alimentaires → satiété prolongée et bien-être digestif');

  // Lipides équilibrés
  if (nutr && nutr.fat >= 10 && nutr.fat <= 35) p('BALANCED_FAT', 5, 'Lipides modérés (' + Math.round(nutr.fat) + 'g) → digestion ralentie, satiété accrue');

  // Portion / calories
  if (nutr) {
    var t = KCAL_TARGETS[mt] || KCAL_TARGETS.lunch;
    if      (nutr.calories >= t.min && nutr.calories <= t.max) p('REALISTIC_PORTION', 10, 'Portion réaliste (' + nutr.calories + ' kcal / ' + mt + ')');
    else if (nutr.calories < t.min * 0.65)  n('FRUSTRATING_PORTION', 15, 'Portion insuffisante (' + nutr.calories + ' kcal / ' + mt + ') → frustration, abandon probable');
    else if (nutr.calories > t.max * 1.4)   n('EXCESSIVE_PORTION',    8, 'Portion trop élevée (' + nutr.calories + ' kcal) → lourdeur sur la durée');
    if (nutr.protein >= 15 && nutr.carbs >= 20 && nutr.fat >= 8) p('BALANCED_MACROS', 8, 'Macros équilibrées → pas de frustration métabolique');
  }

  // Temps de préparation
  if      (total > 0 && total <= 10)  p('VERY_QUICK_PREP', 15, 'Préparation ultra-rapide (' + total + 'min) → friction minimale');
  else if (total > 0 && total <= 20)  p('QUICK_PREP',      10, 'Préparation rapide (' + total + 'min) → faible friction quotidienne');
  else if (total > 0 && total <= 30)  p('MODERATE_PREP',    5, 'Temps de préparation raisonnable (' + total + 'min)');
  else if (total > 75)                n('VERY_LONG_PREP',  20, 'Préparation longue (' + total + 'min) → friction élevée, risque abandon en semaine');
  else if (total > 45)                n('LONG_PREP',       12, 'Préparation de ' + total + 'min → charge non négligeable');

  // Nombre d'ingrédients
  if      (cnt <= 4)  p('FEW_INGREDIENTS',          12, cnt + ' ingrédients → liste courses légère, décision rapide');
  else if (cnt <= 7)  p('MODERATE_INGREDIENTS',      5, cnt + ' ingrédients → bonne complexité');
  else if (cnt > 14)  n('MANY_INGREDIENTS',          12, cnt + ' ingrédients → charge courses + fatigue décisionnelle élevée');
  else if (cnt > 10)  n('QUITE_MANY_INGREDIENTS',    6, cnt + ' ingrédients → organisation requise');

  // Meal-prep
  if (/meal.prep|batch|à.l.avance/i.test(tags + ' ' + steps)) p('MEAL_PREP', 12, 'Compatible meal-prep → friction quotidienne réduite');

  // Ingrédients difficiles à trouver
  if (HARD_TO_FIND.test(is)) n('HARD_INGREDIENTS', 10, 'Ingrédients rares → friction courses, accessibilité réduite');

  // Techniques complexes
  if (TECHNICAL_SKILLS.test(steps)) n('COMPLEX_TECHNIQUES', 8, 'Techniques culinaires avancées → barrière compétences');

  // Difficulté
  if      (recipe.difficulty === 'hard' || recipe.difficulty === 'difficile') n('HIGH_DIFFICULTY', 8, 'Recette difficile → risque abandon pour utilisateurs débutants');
  else if (recipe.difficulty === 'easy' || recipe.difficulty === 'facile')    p('EASY_DIFFICULTY', 8, 'Recette facile → accessible, friction réduite');

  // Nom
  if      (PREMIUM_NAMES.test(name))   p('PREMIUM_NAME',      12, 'Nom évocateur et premium → engagement, désirabilité');
  else if (GENERIC_NAMES.test(name))   n('GENERIC_NAME',      12, 'Nom générique → faible désirabilité, sentiment "dieting"');
  else if (name.length >= 12)          p('DESCRIPTIVE_NAME',   5, 'Nom descriptif → meilleure expérience dans l\'app');

  // Signaux premium
  if (recipe.emoji)  p('HAS_EMOJI',   6, 'Emoji → signal visuel premium dans l\'interface');
  if (recipe.origin) p('HAS_ORIGIN',  6, 'Origine identifiable → authenticité culinaire');
  if (Array.isArray(recipe.tags) && recipe.tags.length >= 3) p('RICH_TAGS', 4, 'Tags enrichis → meilleure découvrabilité');

  // Ingrédients plaisir
  if (PLEASURE_INGREDIENTS.test(is))               p('PLEASURE_INGREDIENTS', 10, 'Ingrédients plaisir détectés → récompense alimentaire');
  if (PLEASURE_TECHNIQUES.test(is + ' ' + steps))  p('PLEASURE_TECHNIQUES',   8, 'Techniques appétissantes (grillé, mariné...) → désirabilité accrue');

  // Textures
  if      (tp.diversity >= 3)  p('RICH_TEXTURE',  10, 'Riche diversité de textures (' + tp.textures.join(', ') + ')');
  else if (tp.diversity >= 2)  p('GOOD_TEXTURE',   5, 'Deux profils texturaux (' + tp.textures.join(', ') + ')');
  else if (tp.isMonotone)      n('MONO_TEXTURE',   8, 'Textures uniformes → lassitude alimentaire accélérée');

  // Saveurs
  if      (fp.complexity >= 3) p('COMPLEX_FLAVOR',  10, 'Profil gustatif riche (' + fp.flavors.join(', ') + ') → plaisir maximal');
  else if (fp.complexity >= 2) p('BALANCED_FLAVOR',  6, 'Équilibre des saveurs (' + fp.flavors.join(', ') + ')');
  else if (fp.complexity <= 1 && cnt > 3) n('FLAT_FLAVOR', 6, 'Profil gustatif peu complexe → lassitude rapide');

  // Richesse visuelle
  if   (vr.appealing)         p('VISUAL_RICHNESS',  8, 'Assiette colorée (' + vr.colors.join(', ') + ') → appétence visuelle');
  else if (vr.richness === 0) n('VISUAL_POVERTY',   5, 'Peu de couleurs → présentation monotone');

  return { positive: pos, negative: neg };
}

// ── 3. SUGGESTIONS D'AMÉLIORATION ─────────────────────────────────────────────

var IMPROVEMENTS = {
  LOW_PROTEIN:              'Ajouter une source protéique (poulet, tofu, œufs, légumineuses)',
  FRUSTRATING_PORTION:      'Augmenter de 100-150 kcal (féculents ou protéines supplémentaires)',
  EXCESSIVE_PORTION:        'Réduire la portion ou passer en format 2 personnes',
  VERY_LONG_PREP:           'Marquer comme "meal-prep" ou simplifier les étapes',
  LONG_PREP:                'Identifier les étapes réductibles ou ajouter tag meal-prep',
  MANY_INGREDIENTS:         'Simplifier à ≤8 ingrédients en priorité',
  QUITE_MANY_INGREDIENTS:   'Envisager de réduire à ≤10 ingrédients',
  HARD_INGREDIENTS:         'Proposer des substituts accessibles en supermarché',
  COMPLEX_TECHNIQUES:       'Ajouter une version simplifiée pour débutants',
  HIGH_DIFFICULTY:          'Créer une variante facile pour les jours sans énergie',
  GENERIC_NAME:             'Renommer avec un nom plus évocateur et spécifique',
  MONO_TEXTURE:             'Ajouter un élément croustillant (graines, noix, pain grillé)',
  FLAT_FLAVOR:              'Ajouter une note acide (citron) ou umami (sauce soja, parmesan)',
  VISUAL_POVERTY:           'Ajouter des légumes colorés (carotte, poivron rouge, épinard)'
};

function buildImprovements(negativeFactors) {
  var seen = {};
  return negativeFactors
    .map(function(f) { return IMPROVEMENTS[f.key]; })
    .filter(function(s) { return s && !seen[s] && (seen[s] = true); });
}

// ── 4. EXPLAIN FUNCTIONS ──────────────────────────────────────────────────────

function _explain(recipe, posKeys, negKeys, base, weight) {
  var all = computeAllFactors(recipe);
  var pos = all.positive.filter(function(f) { return posKeys.indexOf(f.key) >= 0; });
  var neg = all.negative.filter(function(f) { return negKeys.indexOf(f.key) >= 0; });
  var score = base;
  pos.forEach(function(f) { score += Math.round(f.impact * weight); });
  neg.forEach(function(f) { score -= Math.round(f.impact * weight); });
  return {
    score: clamp(score, 0, 100),
    factors: { positive: pos, negative: neg },
    improvements: buildImprovements(neg)
  };
}

function explainAdherence(recipe) {
  return _explain(recipe,
    ['HIGH_PROTEIN','ADEQUATE_PROTEIN','FIBER_RICH','BALANCED_MACROS','REALISTIC_PORTION',
     'VERY_QUICK_PREP','QUICK_PREP','MODERATE_PREP','FEW_INGREDIENTS','MEAL_PREP','BALANCED_FAT','EASY_DIFFICULTY'],
    ['LOW_PROTEIN','FRUSTRATING_PORTION','VERY_LONG_PREP','LONG_PREP','MANY_INGREDIENTS',
     'HARD_INGREDIENTS','HIGH_DIFFICULTY','GENERIC_NAME'],
    50, 0.60
  );
}

function explainSatiety(recipe) {
  var result = _explain(recipe,
    ['HIGH_PROTEIN','ADEQUATE_PROTEIN','FIBER_RICH','BALANCED_FAT','REALISTIC_PORTION','RICH_TEXTURE','GOOD_TEXTURE'],
    ['LOW_PROTEIN','FRUSTRATING_PORTION','MONO_TEXTURE'],
    40, 0.70
  );
  // Penalty: soupe/bouillon feel less satiating psychologically
  if (/soupe|bouillon|gaspacho|velouté/i.test((recipe.name || recipe.n || '').toLowerCase())) {
    result.score = clamp(result.score - 8, 0, 100);
    result.factors.negative.push({ key: 'LIQUID_MEAL', impact: 8, message: 'Plat liquide → satiété perçue réduite vs plat solide équivalent' });
    result.improvements.push('Proposer une variante plus consistante (ajouter des légumineuses ou céréales)');
  }
  return result;
}

function explainPremium(recipe) {
  var result = _explain(recipe,
    ['PREMIUM_NAME','HAS_EMOJI','HAS_ORIGIN','RICH_TAGS','PLEASURE_INGREDIENTS','PLEASURE_TECHNIQUES',
     'VISUAL_RICHNESS','COMPLEX_FLAVOR','BALANCED_FLAVOR','HIGH_PROTEIN','DESCRIPTIVE_NAME','RICH_TEXTURE'],
    ['GENERIC_NAME','VISUAL_POVERTY','FLAT_FLAVOR','MONO_TEXTURE','FRUSTRATING_PORTION'],
    35, 0.65
  );
  result.premiumIndicators = result.factors.positive.map(function(f) { return f.message; });
  result.genericIndicators = result.factors.negative.map(function(f) { return f.message; });
  return result;
}

function explainMentalLoad(recipe) {
  var result = _explain(recipe,
    ['FEW_INGREDIENTS','VERY_QUICK_PREP','QUICK_PREP','MODERATE_PREP','EASY_DIFFICULTY','MEAL_PREP','MODERATE_INGREDIENTS'],
    ['MANY_INGREDIENTS','QUITE_MANY_INGREDIENTS','VERY_LONG_PREP','LONG_PREP','HARD_INGREDIENTS','COMPLEX_TECHNIQUES','HIGH_DIFFICULTY'],
    80, 0.75
  );
  var cnt   = ingCount(recipe);
  var total = (recipe.prepTime || 0) + (recipe.cookTime || 0);
  var hasTech = TECHNICAL_SKILLS.test((recipe.steps || []).join(' '));
  result.shoppingDifficulty = cnt <= 4 ? 'faible' : cnt <= 8 ? 'modérée' : cnt <= 12 ? 'élevée' : 'très élevée';
  result.prepDifficulty     = total <= 15 ? 'minimale' : total <= 30 ? 'modérée' : total <= 60 ? 'élevée' : 'très élevée';
  result.hasTechnicalSkills = hasTech;
  return result;
}

function explainVariety(recipe) {
  return _explain(recipe,
    ['PREMIUM_NAME','RICH_TEXTURE','GOOD_TEXTURE','COMPLEX_FLAVOR','BALANCED_FLAVOR','VISUAL_RICHNESS','MEAL_PREP','RICH_TAGS','PLEASURE_INGREDIENTS'],
    ['GENERIC_NAME','MONO_TEXTURE','FLAT_FLAVOR','VISUAL_POVERTY'],
    55, 0.55
  );
}

// ── 5. REPETITION DETECTION ───────────────────────────────────────────────────
// Regroupe les recettes par (protéine principale + féculent principal).
// Un cluster large = risque de lassitude systémique.

function detectRepetitionClusters(db) {
  var rFormat = db.filter(function(r) { return /^R\d+$/.test(r.id || '') && Array.isArray(r.ingredients); });
  if (rFormat.length === 0) return [];

  var clusters = {};
  rFormat.forEach(function(r) {
    var pk  = getProteinKey(r) || 'autre';
    var ck  = getCarbKey(r)    || 'autre';
    var key = pk + ' + ' + ck;
    if (!clusters[key]) clusters[key] = { key: key, protein: pk, carb: ck, ids: [], count: 0 };
    clusters[key].ids.push(r.id);
    clusters[key].count++;
  });

  return Object.keys(clusters)
    .map(function(k) { return clusters[k]; })
    .filter(function(c) { return c.count >= 3; })
    .sort(function(a, b) { return b.count - a.count; })
    .map(function(c) {
      var risk = c.count >= 15 ? 'HIGH' : c.count >= 8 ? 'MEDIUM' : 'LOW';
      return {
        key:      c.key,
        protein:  c.protein,
        carb:     c.carb,
        count:    c.count,
        examples: c.ids.slice(0, 5),
        risk:     risk,
        note:     c.count + ' recettes "' + c.protein + ' + ' + c.carb + '" — ' +
                  (risk === 'HIGH' ? '⚠ forte répétition' : risk === 'MEDIUM' ? 'répétition modérée' : 'répétition faible')
      };
    });
}

// ── 6. FATIGUE SIMULATION ─────────────────────────────────────────────────────
// Modélise le déclin comportemental sur 1s, 1m, 3m.
// Facteurs : score adhérence moyen, index frustration, clusters répétition,
// diversité des textures, score plaisir.

function simulateFatigue(db) {
  var rFormat = db.filter(function(r) { return /^R\d+$/.test(r.id || ''); });
  if (rFormat.length < 5) {
    return { feasible: false, note: 'DB R-format insuffisante pour simuler (min. 5 recettes)' };
  }

  // Métriques de base sur toutes les recettes R-format
  var analyzed = rFormat.map(explainRecipePartial);
  var n        = analyzed.length;

  var avgAdherence  = Math.round(analyzed.reduce(function(s, r) { return s + r.adherence; }, 0) / n);
  var avgPleasure   = Math.round(analyzed.reduce(function(s, r) { return s + r.pleasure;  }, 0) / n);
  var avgMentalLoad = Math.round(analyzed.reduce(function(s, r) { return s + r.mentalLoad; }, 0) / n);
  var frustrated    = analyzed.filter(function(r) { return r.satiety < 45; }).length;
  var frustIdx      = Math.round(frustrated / n * 100);

  // Pénalité de répétition : ratio top cluster / total
  var clusters     = detectRepetitionClusters(db);
  var topCluster   = clusters[0];
  var repPenalty   = topCluster ? Math.min(20, Math.round((topCluster.count / rFormat.length) * 50)) : 0;

  // Bonus diversité textural
  var allTextures = {};
  analyzed.forEach(function(r) { r.textures.forEach(function(t) { allTextures[t] = true; }); });
  var textureCount  = Object.keys(allTextures).length;
  var varietyBonus  = textureCount >= 4 ? 5 : textureCount >= 2 ? 0 : -5;

  // Semaine 1 : motivation initiale + effet nouveauté
  var week1 = clamp(Math.round(avgAdherence * 0.95 + avgPleasure * 0.05), 0, 100);

  // Mois 1 : déclin par répétition et frustration
  var month1 = clamp(Math.round(
    week1 * 0.92 - frustIdx * 0.12 - repPenalty * 0.5 + varietyBonus
  ), 0, 100);

  // 3 mois : saturation cumulative + résilience par plaisir
  var month3 = clamp(Math.round(
    month1 * 0.87 - frustIdx * 0.08 - repPenalty * 0.3 + (avgPleasure > 70 ? 5 : 0)
  ), 0, 100);

  var abandonRisk = month3 < 50 ? 'HIGH' : month3 < 65 ? 'MEDIUM' : 'LOW';
  var trend       = month3 >= month1 - 5  ? 'Adhérence stable sur 3 mois'         :
                    month3 >= month1 - 15 ? 'Léger déclin — diversité insuffisante' :
                                            'Déclin notable — risque lassitude élevé';

  var recs = [];
  if (repPenalty > 8)      recs.push('Diversifier les combinaisons protéine+féculent (cluster dominant : ' + (topCluster ? topCluster.key : 'N/A') + ')');
  if (frustIdx > 15)       recs.push('Réduire les recettes frustrant (' + frustIdx + '% sous-calorisées)');
  if (textureCount < 3)    recs.push('Enrichir la diversité texturale (ajouter croustillant, fondant)');
  if (avgPleasure < 55)    recs.push('Augmenter le plaisir alimentaire (noms premium, ingrédients plaisir)');
  if (recs.length === 0)   recs.push('Bonne projection long terme — maintenir la diversité actuelle');

  return {
    feasible:        true,
    recipesAnalyzed: n,
    week1:           { adherence: week1,  note: 'Motivation initiale + effet nouveauté' },
    month1:          { adherence: month1, note: month1 < week1 - 8 ? 'Début de lassitude détecté' : 'Adhérence maintenue' },
    month3:          { adherence: month3, note: trend },
    abandonRisk:     abandonRisk,
    limitingFactors: {
      frustrationIndex:  frustIdx,
      repetitionPenalty: repPenalty,
      topCluster:        topCluster ? topCluster.key + ' (' + topCluster.count + ' recettes)' : null,
      textureVariety:    textureCount,
      varietyBonus:      varietyBonus
    },
    recommendations: recs
  };
}

// Extraction légère pour simulateFatigue (évite le full explain coûteux sur 469 recettes)
function explainRecipePartial(recipe) {
  var adh = explainAdherence(recipe);
  var sat = explainSatiety(recipe);
  var prem = explainPremium(recipe);
  var ml  = explainMentalLoad(recipe);
  var tp  = getTextureProfile(recipe);
  return {
    adherence: adh.score,
    satiety:   sat.score,
    pleasure:  prem.score,
    mentalLoad: ml.score,
    textures:  tp.textures
  };
}

// ── 7. FULL RECIPE EXPLANATION ────────────────────────────────────────────────

function explainRecipeUX(recipe) {
  return {
    id:             recipe.id || recipe._id,
    name:           recipe.name || recipe.n || '',
    mealType:       getMealType(recipe),
    adherence:      explainAdherence(recipe),
    satiety:        explainSatiety(recipe),
    premium:        explainPremium(recipe),
    mentalLoad:     explainMentalLoad(recipe),
    variety:        explainVariety(recipe),
    textureProfile: getTextureProfile(recipe),
    flavorProfile:  getFlavorProfile(recipe),
    visualRichness: getVisualRichness(recipe),
    proteinSource:  getProteinKey(recipe),
    carbSource:     getCarbKey(recipe)
  };
}

// ── 8. DATABASE EXPLANATION ────────────────────────────────────────────────────

function explainDatabase(db) {
  var rFormat = db.filter(function(r) { return /^R\d+$/.test(r.id || ''); });
  if (rFormat.length === 0) {
    return { analyzed: 0, avgScores: {}, topLimiting: [], topStrengths: [], clusters: [], fatigue: null, results: [] };
  }

  var results = rFormat.map(explainRecipeUX);
  var n       = results.length;

  // Fréquences des facteurs négatifs (facteurs limitants)
  var negFreq = {}, posFreq = {};
  var dims = ['adherence', 'satiety', 'premium', 'mentalLoad', 'variety'];
  results.forEach(function(r) {
    dims.forEach(function(d) {
      if (!r[d] || !r[d].factors) return;
      r[d].factors.negative.forEach(function(f) { negFreq[f.key] = (negFreq[f.key] || 0) + 1; });
      r[d].factors.positive.forEach(function(f) { posFreq[f.key] = (posFreq[f.key] || 0) + 1; });
    });
  });

  var topLimiting = Object.keys(negFreq)
    .sort(function(a, b) { return negFreq[b] - negFreq[a]; })
    .slice(0, 8)
    .map(function(k) { return { key: k, count: negFreq[k], pct: Math.round(negFreq[k] / n * 100) }; });

  var topStrengths = Object.keys(posFreq)
    .sort(function(a, b) { return posFreq[b] - posFreq[a]; })
    .slice(0, 8)
    .map(function(k) { return { key: k, count: posFreq[k], pct: Math.round(posFreq[k] / n * 100) }; });

  function avgDim(d) { return Math.round(results.reduce(function(s, r) { return s + (r[d] ? r[d].score : 0); }, 0) / n); }

  return {
    analyzed:     n,
    avgScores:    { adherence: avgDim('adherence'), satiety: avgDim('satiety'), premium: avgDim('premium'), mentalLoad: avgDim('mentalLoad'), variety: avgDim('variety') },
    topLimiting:  topLimiting,
    topStrengths: topStrengths,
    clusters:     detectRepetitionClusters(db),
    fatigue:      simulateFatigue(db),
    results:      results.sort(function(a, b) { return (b.adherence.score || 0) - (a.adherence.score || 0); })
  };
}

// ── 9. EXPLAINABLE QA REPORT ──────────────────────────────────────────────────

function generateExplainableReport(db) {
  var dbEx = explainDatabase(db);
  var fat  = dbEx.fatigue;
  var s    = dbEx.avgScores;

  function pad(v) { return String(v).padStart(3); }
  function bar(v) { var f = Math.round(v / 5); return '[' + '█'.repeat(f) + '░'.repeat(20 - f) + '] ' + pad(v) + '/100'; }

  var lines = [
    '═══════════════════════════════════════════════════════════════',
    ' EXPLAINABLE UX REPORT — SmartFitCoach',
    '═══════════════════════════════════════════════════════════════',
    ' Recettes analysées  : ' + dbEx.analyzed,
    '───────────────────────────────────────────────────────────────',
    ' SCORES EXPLIQUÉS :',
    '  Adhérence LT       : ' + bar(s.adherence),
    '  Satiété            : ' + bar(s.satiety),
    '  Feel premium       : ' + bar(s.premium),
    '  Charge mentale     : ' + bar(s.mentalLoad) + '  (100=facile)',
    '  Potentiel variété  : ' + bar(s.variety),
    '───────────────────────────────────────────────────────────────',
    ' FACTEURS LIMITANTS (fréquence dans la DB) :'
  ];
  dbEx.topLimiting.slice(0, 6).forEach(function(f) {
    lines.push('  ↓ ' + (f.key + '              ').slice(0, 28) + f.count + ' recettes (' + f.pct + '%)');
  });

  lines.push('───────────────────────────────────────────────────────────────');
  lines.push(' FORCES PRINCIPALES :');
  dbEx.topStrengths.slice(0, 6).forEach(function(f) {
    lines.push('  ↑ ' + (f.key + '              ').slice(0, 28) + f.count + ' recettes (' + f.pct + '%)');
  });

  if (dbEx.clusters.length > 0) {
    lines.push('───────────────────────────────────────────────────────────────');
    lines.push(' CLUSTERS DE RÉPÉTITION :');
    dbEx.clusters.slice(0, 5).forEach(function(c) { lines.push('  [' + c.risk + '] ' + c.note); });
  }

  if (fat && fat.feasible) {
    lines.push('───────────────────────────────────────────────────────────────');
    lines.push(' PROJECTION ADHÉRENCE LONG TERME :');
    lines.push('  Semaine 1  : ' + bar(fat.week1.adherence)  + '  ' + fat.week1.note);
    lines.push('  Mois 1     : ' + bar(fat.month1.adherence) + '  ' + fat.month1.note);
    lines.push('  3 mois     : ' + bar(fat.month3.adherence) + '  ' + fat.month3.note);
    lines.push('  Abandon    : risque ' + fat.abandonRisk);
    if (fat.limitingFactors.topCluster) {
      lines.push('  Cluster dom.: ' + fat.limitingFactors.topCluster);
    }
    lines.push('');
    lines.push(' RECOMMANDATIONS :');
    fat.recommendations.forEach(function(r) { lines.push('  → ' + r); });
  } else if (fat && !fat.feasible) {
    lines.push('  Note: ' + fat.note);
  }

  lines.push('═══════════════════════════════════════════════════════════════');
  return lines.join('\n');
}

if (typeof window !== 'undefined') {
  window.RecipeUXExplainer = {
    TEXTURE_PROFILES:          TEXTURE_PROFILES,
    FLAVOR_PROFILES:           FLAVOR_PROFILES,
    COLOR_PROFILES:            COLOR_PROFILES,
    PROTEIN_KEYS:              PROTEIN_KEYS,
    CARB_KEYS:                 CARB_KEYS,
    IMPROVEMENTS:              IMPROVEMENTS,
    getProteinKey:             getProteinKey,
    getCarbKey:                getCarbKey,
    getTextureProfile:         getTextureProfile,
    getFlavorProfile:          getFlavorProfile,
    getVisualRichness:         getVisualRichness,
    computeAllFactors:         computeAllFactors,
    buildImprovements:         buildImprovements,
    explainAdherence:          explainAdherence,
    explainSatiety:            explainSatiety,
    explainPremium:            explainPremium,
    explainMentalLoad:         explainMentalLoad,
    explainVariety:            explainVariety,
    detectRepetitionClusters:  detectRepetitionClusters,
    simulateFatigue:           simulateFatigue,
    explainRecipeUX:           explainRecipeUX,
    explainDatabase:           explainDatabase,
    generateExplainableReport: generateExplainableReport
  };
}

})();
