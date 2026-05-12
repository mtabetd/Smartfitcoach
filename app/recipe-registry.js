(function() {
'use strict';

// ─── CANONICAL INGREDIENT REGISTRY ───────────────────────────────────────────
// Source de vérité immuable pour tous les ingrédients du système.
// Définit les règles canoniques de validation, d'affichage et de scaling.
// ─────────────────────────────────────────────────────────────────────────────

var UNIT_TYPES = Object.freeze({
  WEIGHT:  'weight',
  VOLUME:  'volume',
  COUNT:   'count',
  SPOON:   'spoon',
  PINCH:   'pinch'
});

var CATEGORIES = Object.freeze({
  PROTEIN:   'protein',
  DAIRY:     'dairy',
  GRAIN:     'grain',
  VEGETABLE: 'vegetable',
  FRUIT:     'fruit',
  FAT:       'fat',
  CONDIMENT: 'condiment',
  SWEETENER: 'sweetener',
  LIQUID:    'liquid'
});

var INGREDIENT_REGISTRY = Object.freeze({

  // ── ŒUFS ──────────────────────────────────────────────────────────────────
  'oeuf': {
    id: 'oeuf', canonical: 'Œuf',
    aliases: ['oeuf','oeufs','œuf','œufs','Oeuf','Oeufs',
              'oeuf entier','oeufs entiers','œuf entier','œufs entiers',
              'Œuf entier','Œufs entiers','egg','eggs'],
    unit: 'pce', unitType: UNIT_TYPES.COUNT,
    forbiddenUnits: ['g','ml','kg','l'],
    category: CATEGORIES.PROTEIN,
    perUnit: { calories: 75, proteinGrams: 7, fatGrams: 5, carbsGrams: 0.6 },
    display: { fr: { one: 'œuf', other: 'œufs' }, en: { one: 'egg', other: 'eggs' } },
    scaling: { rounding: 'integer', min: 1, max: 12 },
    uxRules: { minQty: 0.5, maxQty: 12, warnIfGrams: true,
               absurdMsg: 'Les œufs se comptent en unités (pce), pas en grammes' }
  },

  'blanc-oeuf': {
    id: 'blanc-oeuf', canonical: 'Blanc d\'œuf',
    aliases: ['blanc d\'oeuf','blancs d\'oeuf','blanc d\'œuf','blancs d\'œufs',
              'blanc oeuf','blancs oeufs'],
    unit: 'g', unitType: UNIT_TYPES.WEIGHT,
    category: CATEGORIES.PROTEIN,
    gramsPerPiece: 30,
    perUnit: { calories: 17, proteinGrams: 3.6, fatGrams: 0.1, carbsGrams: 0.24 },
    display: { fr: { one: 'blanc d\'œuf', other: 'blancs d\'œufs' },
               en: { one: 'egg white', other: 'egg whites' } },
    scaling: { rounding: 'integer_piece', gramsPerPiece: 30 },
    uxRules: { minQty: 30, maxQty: 300, displayAsPieces: true }
  },

  'jaune-oeuf': {
    id: 'jaune-oeuf', canonical: 'Jaune d\'œuf',
    aliases: ['jaune d\'oeuf','jaunes d\'oeuf','jaune d\'œuf','jaunes d\'œufs',
              'jaune','jaunes'],
    unit: 'g', unitType: UNIT_TYPES.WEIGHT,
    category: CATEGORIES.PROTEIN,
    gramsPerPiece: 18,
    perUnit: { calories: 55, proteinGrams: 2.7, fatGrams: 4.5, carbsGrams: 0.6 },
    display: { fr: { one: 'jaune d\'œuf', other: 'jaunes d\'œufs' },
               en: { one: 'egg yolk', other: 'egg yolks' } },
    scaling: { rounding: 'integer_piece', gramsPerPiece: 18 },
    uxRules: { minQty: 18, maxQty: 200, displayAsPieces: true }
  },

  // ── FRUITS ────────────────────────────────────────────────────────────────
  'avocat': {
    id: 'avocat', canonical: 'Avocat',
    aliases: ['avocat','avocats','Avocat','Avocats','avocado'],
    unit: 'g', unitType: UNIT_TYPES.WEIGHT,
    category: CATEGORIES.FRUIT,
    gramsPerPiece: 150,
    perHundredGrams: { calories: 160, proteinGrams: 2, fatGrams: 15, carbsGrams: 2 },
    display: { fr: { one: 'avocat', other: 'avocats', half: '½ avocat' },
               en: { one: 'avocado', other: 'avocados', half: '½ avocado' } },
    scaling: { rounding: 'half_piece', gramsPerPiece: 150, allowHalf: true },
    uxRules: { minQty: 75, maxQty: 450,
               absurdMsg: '37g d\'avocat est absurde — arrondir à ½ (75g) ou 1 (150g) avocat' }
  },

  'banane': {
    id: 'banane', canonical: 'Banane',
    aliases: ['banane','bananes','Banane','Bananes','banana'],
    unit: 'g', unitType: UNIT_TYPES.WEIGHT,
    category: CATEGORIES.FRUIT,
    gramsPerPiece: 100,
    perHundredGrams: { calories: 89, proteinGrams: 1.1, fatGrams: 0.3, carbsGrams: 23 },
    display: { fr: { one: 'banane', other: 'bananes' }, en: { one: 'banana', other: 'bananas' } },
    scaling: { rounding: 'piece', gramsPerPiece: 100 },
    uxRules: { minQty: 50, maxQty: 400 }
  },

  'citron': {
    id: 'citron', canonical: 'Citron',
    aliases: ['citron','citrons','citron (jus)','jus de citron','Citron','Citrons','lemon'],
    unit: 'pce', unitType: UNIT_TYPES.COUNT,
    category: CATEGORIES.FRUIT,
    gramsPerPiece: 120, mlPerPiece: 30,
    display: { fr: { one: 'citron', other: 'citrons' }, en: { one: 'lemon', other: 'lemons' } },
    scaling: { rounding: 'half', min: 0.5 },
    uxRules: { minQty: 0.5, maxQty: 4 }
  },

  // ── LÉGUMES ───────────────────────────────────────────────────────────────
  'tomate': {
    id: 'tomate', canonical: 'Tomate',
    aliases: ['tomate','tomates','Tomate','Tomates','tomato'],
    unit: 'g', unitType: UNIT_TYPES.WEIGHT,
    category: CATEGORIES.VEGETABLE,
    gramsPerPiece: 120,
    perHundredGrams: { calories: 18, proteinGrams: 0.9, fatGrams: 0.2, carbsGrams: 3.9 },
    display: { fr: { one: 'tomate', other: 'tomates' }, en: { one: 'tomato', other: 'tomatoes' } },
    scaling: { rounding: 'piece', gramsPerPiece: 120 },
    uxRules: { minQty: 60, maxQty: 600 }
  },

  'oignon': {
    id: 'oignon', canonical: 'Oignon',
    aliases: ['oignon','oignons','Oignon','Oignons','oignon moyen','oignons moyens','onion'],
    unit: 'g', unitType: UNIT_TYPES.WEIGHT,
    category: CATEGORIES.VEGETABLE,
    gramsPerPiece: 100,
    perHundredGrams: { calories: 40, proteinGrams: 1.1, fatGrams: 0.1, carbsGrams: 9.3 },
    display: { fr: { one: 'oignon', other: 'oignons' }, en: { one: 'onion', other: 'onions' } },
    scaling: { rounding: 'piece', gramsPerPiece: 100 },
    uxRules: { minQty: 50, maxQty: 500 }
  },

  'ail': {
    id: 'ail', canonical: 'Ail',
    aliases: ['ail','ail (gousse)','gousse d\'ail','gousses d\'ail','Ail','garlic'],
    unit: 'g', unitType: UNIT_TYPES.WEIGHT,
    category: CATEGORIES.CONDIMENT,
    gramsPerPiece: 5,
    perHundredGrams: { calories: 149, proteinGrams: 6.4, fatGrams: 0.5, carbsGrams: 33 },
    display: { fr: { one: 'gousse d\'ail', other: 'gousses d\'ail' },
               en: { one: 'garlic clove', other: 'garlic cloves' } },
    scaling: { rounding: 'piece', gramsPerPiece: 5 },
    uxRules: { minQty: 3, maxQty: 50 }
  },

  // ── MATIÈRES GRASSES ──────────────────────────────────────────────────────
  'huile-olive': {
    id: 'huile-olive', canonical: 'Huile d\'olive',
    aliases: ['huile d\'olive','huile olive','Huile d\'olive','Huile olive','olive oil'],
    unit: 'ml', unitType: UNIT_TYPES.VOLUME,
    category: CATEGORIES.FAT,
    mlPerSpoon: { cc: 5, cs: 15 },
    perHundredMl: { calories: 884, proteinGrams: 0, fatGrams: 100, carbsGrams: 0 },
    display: { fr: { spoon: 'c.à.s.', tsp: 'c.à.c.' }, en: { spoon: 'tbsp', tsp: 'tsp' } },
    scaling: { rounding: 5, unit: 'ml' },
    uxRules: { minQty: 3, maxQty: 60, displayAsSpoons: true,
               absurdMsg: '1ml d\'huile est absurde — minimum 5ml (1 c.à.c.)' }
  },

  'beurre': {
    id: 'beurre', canonical: 'Beurre',
    aliases: ['beurre','beurre doux','Beurre','beurre demi-sel','butter'],
    unit: 'g', unitType: UNIT_TYPES.WEIGHT,
    category: CATEGORIES.FAT,
    perHundredGrams: { calories: 717, proteinGrams: 0.9, fatGrams: 81, carbsGrams: 0.1 },
    display: { fr: { singular: 'beurre' }, en: { singular: 'butter' } },
    scaling: { rounding: 5, unit: 'g' },
    uxRules: { minQty: 5, maxQty: 100 }
  },

  // ── PROTÉINES ANIMALES ────────────────────────────────────────────────────
  'blanc-poulet': {
    id: 'blanc-poulet', canonical: 'Blanc de poulet',
    aliases: ['blanc de poulet','blancs de poulet','filet de poulet','filets de poulet',
              'escalope de poulet','escalopes de poulet','poulet émincé','Blanc de poulet',
              'Filet de poulet','chicken breast'],
    unit: 'g', unitType: UNIT_TYPES.WEIGHT,
    category: CATEGORIES.PROTEIN,
    perHundredGrams: { calories: 165, proteinGrams: 31, fatGrams: 3.6, carbsGrams: 0 },
    display: { fr: { singular: 'blanc de poulet' }, en: { singular: 'chicken breast' } },
    scaling: { rounding: 10, unit: 'g' },
    uxRules: { minQty: 50, maxQty: 400 }
  },

  'thon': {
    id: 'thon', canonical: 'Thon en conserve',
    aliases: ['thon','thon en conserve','thon naturel','thon au naturel',
              'thon à l\'huile','Thon','Thon en conserve','tuna'],
    unit: 'g', unitType: UNIT_TYPES.WEIGHT,
    category: CATEGORIES.PROTEIN,
    perHundredGrams: { calories: 130, proteinGrams: 28, fatGrams: 1, carbsGrams: 0 },
    display: { fr: { singular: 'thon' }, en: { singular: 'tuna' } },
    scaling: { rounding: 10, unit: 'g' },
    uxRules: { minQty: 50, maxQty: 300 }
  },

  'saumon': {
    id: 'saumon', canonical: 'Saumon',
    aliases: ['saumon','saumon frais','saumon fumé','pavé de saumon','Saumon','salmon'],
    unit: 'g', unitType: UNIT_TYPES.WEIGHT,
    category: CATEGORIES.PROTEIN,
    perHundredGrams: { calories: 208, proteinGrams: 20, fatGrams: 13, carbsGrams: 0 },
    display: { fr: { singular: 'saumon' }, en: { singular: 'salmon' } },
    scaling: { rounding: 10, unit: 'g' },
    uxRules: { minQty: 50, maxQty: 350 }
  },

  // ── PRODUITS LAITIERS ─────────────────────────────────────────────────────
  'yaourt-grec': {
    id: 'yaourt-grec', canonical: 'Yaourt grec',
    aliases: ['yaourt grec','yaourts grecs','yogourt grec','yaourt grec entier',
              'Yaourt grec','Yaourt grec entier','greek yogurt'],
    unit: 'g', unitType: UNIT_TYPES.WEIGHT,
    category: CATEGORIES.DAIRY,
    perHundredGrams: { calories: 97, proteinGrams: 9, fatGrams: 5, carbsGrams: 3.6 },
    display: { fr: { singular: 'yaourt grec' }, en: { singular: 'Greek yogurt' } },
    scaling: { rounding: 10, unit: 'g' },
    uxRules: { minQty: 50, maxQty: 400 }
  },

  'fromage-blanc': {
    id: 'fromage-blanc', canonical: 'Fromage blanc',
    aliases: ['fromage blanc','fromage blanc 0%','fromage blanc maigre','Fromage blanc'],
    unit: 'g', unitType: UNIT_TYPES.WEIGHT,
    category: CATEGORIES.DAIRY,
    perHundredGrams: { calories: 58, proteinGrams: 7, fatGrams: 0.2, carbsGrams: 6 },
    display: { fr: { singular: 'fromage blanc' }, en: { singular: 'quark' } },
    scaling: { rounding: 10, unit: 'g' },
    uxRules: { minQty: 50, maxQty: 400 }
  },

  // ── FÉCULENTS ─────────────────────────────────────────────────────────────
  'riz': {
    id: 'riz', canonical: 'Riz',
    aliases: ['riz','riz blanc','riz basmati','riz complet','riz japonais',
              'riz brun','Riz','Riz basmati','Riz complet','rice'],
    unit: 'g', unitType: UNIT_TYPES.WEIGHT,
    category: CATEGORIES.GRAIN,
    perHundredGrams: { calories: 130, proteinGrams: 2.7, fatGrams: 0.3, carbsGrams: 28 },
    display: { fr: { singular: 'riz' }, en: { singular: 'rice' } },
    scaling: { rounding: 10, unit: 'g' },
    uxRules: { minQty: 30, maxQty: 300 }
  },

  'flocons-avoine': {
    id: 'flocons-avoine', canonical: 'Flocons d\'avoine',
    aliases: ['flocons d\'avoine','flocons avoine','avoine','porridge',
              'Flocons d\'avoine','Avoine','oats','rolled oats'],
    unit: 'g', unitType: UNIT_TYPES.WEIGHT,
    category: CATEGORIES.GRAIN,
    perHundredGrams: { calories: 379, proteinGrams: 13, fatGrams: 7, carbsGrams: 67 },
    display: { fr: { singular: 'flocons d\'avoine' }, en: { singular: 'oats' } },
    scaling: { rounding: 5, unit: 'g' },
    uxRules: { minQty: 20, maxQty: 200 }
  },

  'patate-douce': {
    id: 'patate-douce', canonical: 'Patate douce',
    aliases: ['patate douce','patates douces','Patate douce','sweet potato'],
    unit: 'g', unitType: UNIT_TYPES.WEIGHT,
    category: CATEGORIES.GRAIN,
    perHundredGrams: { calories: 86, proteinGrams: 1.6, fatGrams: 0.1, carbsGrams: 20 },
    display: { fr: { singular: 'patate douce' }, en: { singular: 'sweet potato' } },
    scaling: { rounding: 10, unit: 'g' },
    uxRules: { minQty: 50, maxQty: 400 }
  },

  // ── LÉGUMINEUSES ──────────────────────────────────────────────────────────
  'lentilles': {
    id: 'lentilles', canonical: 'Lentilles',
    aliases: ['lentilles','lentilles vertes','lentilles rouges','lentilles corail',
              'lentilles cuites','Lentilles','lentils'],
    unit: 'g', unitType: UNIT_TYPES.WEIGHT,
    category: CATEGORIES.PROTEIN,
    perHundredGrams: { calories: 116, proteinGrams: 9, fatGrams: 0.4, carbsGrams: 20 },
    display: { fr: { singular: 'lentilles' }, en: { singular: 'lentils' } },
    scaling: { rounding: 10, unit: 'g' },
    uxRules: { minQty: 30, maxQty: 300 }
  },

  'pois-chiches': {
    id: 'pois-chiches', canonical: 'Pois chiches',
    aliases: ['pois chiches','pois chiche','pois chiches cuits','pois chiches en conserve',
              'Pois chiches','chickpeas'],
    unit: 'g', unitType: UNIT_TYPES.WEIGHT,
    category: CATEGORIES.PROTEIN,
    perHundredGrams: { calories: 164, proteinGrams: 9, fatGrams: 2.6, carbsGrams: 27 },
    display: { fr: { singular: 'pois chiches' }, en: { singular: 'chickpeas' } },
    scaling: { rounding: 10, unit: 'g' },
    uxRules: { minQty: 30, maxQty: 400 }
  },

  // ── CONDIMENTS / ÉPICES ───────────────────────────────────────────────────
  'sel': {
    id: 'sel', canonical: 'Sel',
    aliases: ['sel','sel fin','fleur de sel','sel de mer','Sel','salt'],
    unit: 'g', unitType: UNIT_TYPES.WEIGHT,
    category: CATEGORIES.CONDIMENT,
    allowedSpoonUnits: ['cc','pincee'],
    display: { fr: { singular: 'sel' }, en: { singular: 'salt' } },
    scaling: { rounding: 1, unit: 'g', maxScaleFactor: 2 },
    uxRules: { minQty: 0.2, maxQty: 10, preferSpoons: true }
  },

  'poivre': {
    id: 'poivre', canonical: 'Poivre',
    aliases: ['poivre','poivre noir','poivre blanc','Poivre','pepper'],
    unit: 'g', unitType: UNIT_TYPES.WEIGHT,
    category: CATEGORIES.CONDIMENT,
    display: { fr: { singular: 'poivre' }, en: { singular: 'pepper' } },
    scaling: { rounding: 0.5, unit: 'g', maxScaleFactor: 2 },
    uxRules: { minQty: 0.2, maxQty: 5, preferSpoons: true }
  },

  // ── LIQUIDES ──────────────────────────────────────────────────────────────
  'lait': {
    id: 'lait', canonical: 'Lait',
    aliases: ['lait','lait écrémé','lait demi-écrémé','lait entier',
              'Lait','Lait écrémé','milk'],
    unit: 'ml', unitType: UNIT_TYPES.VOLUME,
    category: CATEGORIES.LIQUID,
    perHundredMl: { calories: 34, proteinGrams: 3.3, fatGrams: 0.1, carbsGrams: 5 },
    display: { fr: { singular: 'lait' }, en: { singular: 'milk' } },
    scaling: { rounding: 10, unit: 'ml' },
    uxRules: { minQty: 50, maxQty: 500 }
  },

  'eau': {
    id: 'eau', canonical: 'Eau',
    aliases: ['eau','eau froide','eau chaude','Eau','water'],
    unit: 'ml', unitType: UNIT_TYPES.VOLUME,
    category: CATEGORIES.LIQUID,
    perHundredMl: { calories: 0, proteinGrams: 0, fatGrams: 0, carbsGrams: 0 },
    display: { fr: { singular: 'eau' }, en: { singular: 'water' } },
    scaling: { rounding: 10, unit: 'ml' },
    uxRules: { minQty: 10, maxQty: 1000 }
  },

  // ── SUCRANTS ──────────────────────────────────────────────────────────────
  'miel': {
    id: 'miel', canonical: 'Miel',
    aliases: ['miel','Miel','honey'],
    unit: 'g', unitType: UNIT_TYPES.WEIGHT,
    category: CATEGORIES.SWEETENER,
    perHundredGrams: { calories: 304, proteinGrams: 0.3, fatGrams: 0, carbsGrams: 82 },
    display: { fr: { singular: 'miel' }, en: { singular: 'honey' } },
    scaling: { rounding: 5, unit: 'g' },
    uxRules: { minQty: 5, maxQty: 50 }
  }
});

// ── LOOKUP INDEX (build once at init) ────────────────────────────────────────

function _norm(str) {
  return (str || '').toLowerCase()
    .replace(/[œÅ]/g, 'oe').replace(/[éèêë]/g, 'e').replace(/[àâ]/g, 'a')
    .replace(/[ùû]/g, 'u').replace(/[îï]/g, 'i').replace(/[ôö]/g, 'o')
    .replace(/ç/g, 'c').replace(/'/g, '\'').replace(/\s+/g, ' ').trim();
}

var _index = (function() {
  var idx = {};
  Object.keys(INGREDIENT_REGISTRY).forEach(function(id) {
    INGREDIENT_REGISTRY[id].aliases.forEach(function(a) { idx[_norm(a)] = id; });
  });
  return idx;
}());

function lookupIngredient(name) {
  if (!name) return null;
  var key = _norm(name);
  var id = _index[key];
  if (id) return INGREDIENT_REGISTRY[id];
  // Prefix fallback
  for (var k in _index) {
    if (key.indexOf(k) === 0 || k.indexOf(key) === 0) return INGREDIENT_REGISTRY[_index[k]];
  }
  return null;
}

function validateIngredientSpec(name, qty, unit) {
  var spec = lookupIngredient(name);
  if (!spec) return { valid: true, errors: [], warnings: [], known: false };
  var errors = [], warnings = [];
  if (spec.forbiddenUnits && spec.forbiddenUnits.indexOf((unit || '').toLowerCase()) >= 0) {
    errors.push(name + ': unité "' + unit + '" interdite — utiliser "' + spec.unit + '"');
  }
  if (spec.uxRules) {
    if (typeof spec.uxRules.minQty === 'number' && qty < spec.uxRules.minQty) {
      warnings.push(name + ': qty=' + qty + ' < min=' + spec.uxRules.minQty);
    }
    if (typeof spec.uxRules.maxQty === 'number' && qty > spec.uxRules.maxQty) {
      warnings.push(name + ': qty=' + qty + ' > max=' + spec.uxRules.maxQty);
    }
  }
  return { valid: errors.length === 0, errors: errors, warnings: warnings, known: true, spec: spec };
}

if (typeof window !== 'undefined') {
  window.RecipeRegistry = {
    INGREDIENT_REGISTRY: INGREDIENT_REGISTRY,
    UNIT_TYPES:          UNIT_TYPES,
    CATEGORIES:          CATEGORIES,
    lookupIngredient:    lookupIngredient,
    validateIngredientSpec: validateIngredientSpec
  };
}

})();
