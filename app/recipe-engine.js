// recipe-engine.js — RecipeEngine : moteur de recettes adaptatif
// Intègre avec window.NutritionMaster (USER_STATE)
// R201-R210 : bloc 1/30 (structure extensible jusqu'à R500)
(function () {
  'use strict';

  // ─── CONSTANTES ───────────────────────────────────────────────────────────────
  var KCAL_PER_PROT        = 4;
  var KCAL_PER_CARB        = 4;
  var KCAL_PER_FAT         = 9;
  var EGG_PROTEIN_PER_UNIT = 7;    // g protéines / œuf (USDA)
  var EGG_FAT_PER_UNIT     = 5;    // g lipides / œuf (USDA)
  var EGG_CARBS_PER_UNIT   = 0.6;  // g glucides / œuf
  var EGG_KCAL_PER_UNIT    = Math.round(EGG_PROTEIN_PER_UNIT * KCAL_PER_PROT + EGG_FAT_PER_UNIT * KCAL_PER_FAT + EGG_CARBS_PER_UNIT * KCAL_PER_CARB); // 75 kcal
  var TOLERANCE_KCAL       = 50;   // écart acceptable après scaling (kcal)
  var DEFAULT_MEAL_FRACTION = 1 / 3; // 1 repas = 1/3 des calories journalières

  // ─── BASE DE DONNÉES R201-R210 ─────────────────────────────────────────────
  // Structure par recette :
  //   id, name, category ('maroc-moderne'|'world-food'), tags[], servings,
  //   prepTime (min), cookTime (min), difficulty (1-3),
  //   baseNutrition { calories, proteinGrams, carbsGrams, fatGrams },  ← recette ENTIÈRE
  //   ingredients [{ name, qty, unit ('g'|'ml'|'pce'), note? }],
  //   steps[]
  //
  // RÈGLE ŒUF : unit === 'pce' → 1 œuf = 7g P / 5g L / 0.6g G / 75 kcal
  // MACROS VÉRIFIÉES : proteinGrams×4 + carbsGrams×4 + fatGrams×9 === calories

  var RECIPES_DB = [

    // ═══════════════════════════════════════════════════
    //  MAROC MODERNE  (R201–R206)
    // ═══════════════════════════════════════════════════

    {
      id: 'R201',
      name: 'Tajine Poulet Chermoula Express',
      category: 'maroc-moderne',
      mealTypes: ['lunch', 'dinner'],
      emoji: '🫙', origin: '🇲🇦',
      tags: ['high-protein', 'gluten-free', 'meal-prep', 'balanced'],
      servings: 2, prepTime: 15, cookTime: 35, difficulty: 1,
      // 96×4 + 46×4 + 28×9 = 384+184+252 = 820 ✓
      baseNutrition: { calories: 820, proteinGrams: 96, carbsGrams: 46, fatGrams: 28 },
      ingredients: [
        { name: 'Blanc de poulet',              qty: 400, unit: 'g' },
        { name: 'Pois chiches (boîte, égouttés)', qty: 200, unit: 'g' },
        { name: 'Courgette',                    qty: 200, unit: 'g' },
        { name: 'Tomate',                       qty: 150, unit: 'g' },
        { name: 'Oignon',                       qty: 100, unit: 'g' },
        { name: 'Ail',                          qty: 15,  unit: 'g', note: '4 gousses' },
        { name: 'Huile d\'olive',               qty: 20,  unit: 'ml' },
        { name: 'Citron (jus)',                 qty: 1,   unit: 'pce' },
        { name: 'Coriandre fraîche',            qty: 15,  unit: 'g' },
        { name: 'Cumin moulu',                  qty: 3,   unit: 'g' },
        { name: 'Paprika doux',                 qty: 3,   unit: 'g' },
        { name: 'Gingembre moulu',              qty: 2,   unit: 'g' }
      ],
      steps: [
        'Mariner le poulet 10 min avec ail, cumin, paprika, gingembre, jus de citron.',
        'Dorer l\'oignon émincé dans l\'huile d\'olive 3 min.',
        'Ajouter le poulet, colorer 5 min de chaque côté.',
        'Incorporer tomates, courgettes et pois chiches. Couvrir.',
        'Mijoter à feu doux 25 min. Rectifier l\'assaisonnement.',
        'Servir avec coriandre fraîche.'
      ]
    },

    {
      id: 'R202',
      name: 'Pastilla de Dinde Légère',
      category: 'maroc-moderne',
      mealTypes: ['lunch', 'dinner'],
      emoji: '🥐', origin: '🇲🇦',
      tags: ['high-protein', 'festive', 'balanced'],
      servings: 3, prepTime: 25, cookTime: 30, difficulty: 3,
      // 95×4 + 80×4 + 48×9 = 380+320+432 = 1132 ✓
      baseNutrition: { calories: 1132, proteinGrams: 95, carbsGrams: 80, fatGrams: 48 },
      ingredients: [
        { name: 'Blanc de dinde',     qty: 400, unit: 'g' },
        { name: 'Œuf',                qty: 3,   unit: 'pce' },
        { name: 'Feuilles de brick',  qty: 6,   unit: 'pce' },
        { name: 'Amandes effilées',   qty: 50,  unit: 'g' },
        { name: 'Oignon',             qty: 150, unit: 'g' },
        { name: 'Huile de tournesol', qty: 15,  unit: 'ml' },
        { name: 'Cannelle moulue',    qty: 3,   unit: 'g' },
        { name: 'Coriandre fraîche',  qty: 20,  unit: 'g' },
        { name: 'Gingembre moulu',    qty: 2,   unit: 'g' },
        { name: 'Safran',             qty: 0.5, unit: 'g' },
        { name: 'Sucre glace (décor)',qty: 10,  unit: 'g' }
      ],
      steps: [
        'Cuire la dinde avec oignon, épices et 200 ml d\'eau jusqu\'à absorption. Effilocher.',
        'Brouiller les œufs dans le jus de cuisson. Réserver.',
        'Torréfier les amandes 2 min. Mixer grossièrement avec cannelle.',
        'Sur chaque feuille de brick : couche dinde → œufs → amandes. Plier en carré.',
        'Badigeonner légèrement d\'huile. Cuire au four 200 °C — 18 min.',
        'Saupoudrer sucre glace + cannelle au service.'
      ]
    },

    {
      id: 'R203',
      name: 'Salade Marocaine Power-Protéines',
      category: 'maroc-moderne',
      mealTypes: ['lunch'],
      emoji: '🥗', origin: '🇲🇦',
      tags: ['high-protein', 'no-cook', 'lunch', 'meal-prep', 'budget'],
      servings: 2, prepTime: 10, cookTime: 0, difficulty: 1,
      // 68×4 + 42×4 + 35×9 = 272+168+315 = 755 ✓
      baseNutrition: { calories: 755, proteinGrams: 68, carbsGrams: 42, fatGrams: 35 },
      ingredients: [
        { name: 'Thon au naturel (boîte)', qty: 240, unit: 'g', note: '2 × 120 g' },
        { name: 'Pois chiches (boîte, égouttés)', qty: 200, unit: 'g' },
        { name: 'Tomate',          qty: 200, unit: 'g' },
        { name: 'Concombre',       qty: 150, unit: 'g' },
        { name: 'Oignon rouge',    qty: 80,  unit: 'g' },
        { name: 'Olives noires',   qty: 50,  unit: 'g' },
        { name: 'Huile d\'olive',  qty: 25,  unit: 'ml' },
        { name: 'Citron (jus)',    qty: 1,   unit: 'pce' },
        { name: 'Persil frais',    qty: 20,  unit: 'g' },
        { name: 'Cumin moulu',     qty: 2,   unit: 'g' }
      ],
      steps: [
        'Égoutter et rincer pois chiches et thon.',
        'Couper tomates, concombre et oignon rouge en petits dés.',
        'Assembler tous les ingrédients dans un saladier.',
        'Assaisonner huile d\'olive + jus de citron + cumin + sel.',
        'Garnir de persil haché. Servir frais.'
      ]
    },

    {
      id: 'R204',
      name: 'Kefta de Dinde au Four',
      category: 'maroc-moderne',
      mealTypes: ['lunch', 'dinner'],
      emoji: '🍗', origin: '🇲🇦',
      tags: ['high-protein', 'low-carb', 'family', 'meal-prep', 'gluten-free'],
      servings: 2, prepTime: 15, cookTime: 20, difficulty: 1,
      // 88×4 + 10×4 + 22×9 = 352+40+198 = 590 ✓
      baseNutrition: { calories: 590, proteinGrams: 88, carbsGrams: 10, fatGrams: 22 },
      ingredients: [
        { name: 'Hachis de dinde',    qty: 500, unit: 'g' },
        { name: 'Œuf',                qty: 1,   unit: 'pce' },
        { name: 'Huile d\'olive',     qty: 10,  unit: 'ml' },
        { name: 'Oignon',             qty: 120, unit: 'g' },
        { name: 'Ail',                qty: 10,  unit: 'g', note: '3 gousses' },
        { name: 'Persil frais',       qty: 25,  unit: 'g' },
        { name: 'Coriandre fraîche',  qty: 15,  unit: 'g' },
        { name: 'Cumin moulu',        qty: 3,   unit: 'g' },
        { name: 'Paprika doux',       qty: 3,   unit: 'g' },
        { name: 'Ras el hanout',      qty: 2,   unit: 'g' }
      ],
      steps: [
        'Préchauffer le four à 200 °C.',
        'Hacher finement oignon, ail, persil, coriandre.',
        'Mélanger dinde + œuf + herbes + épices + sel.',
        'Former des brochettes plates. Déposer sur papier sulfurisé.',
        'Cuire 18-20 min en retournant à mi-cuisson.',
        'Servir avec salade ou légumes grillés.'
      ]
    },

    {
      id: 'R205',
      name: 'Harira Protéinée',
      category: 'maroc-moderne',
      mealTypes: ['lunch', 'dinner'],
      emoji: '🫕', origin: '🇲🇦',
      tags: ['high-protein', 'high-carb', 'soup', 'budget', 'meal-prep'],
      servings: 3, prepTime: 15, cookTime: 45, difficulty: 2,
      // 68×4 + 95×4 + 28×9 = 272+380+252 = 904 ✓
      baseNutrition: { calories: 904, proteinGrams: 68, carbsGrams: 95, fatGrams: 28 },
      ingredients: [
        { name: 'Bœuf maigre haché',           qty: 200, unit: 'g' },
        { name: 'Lentilles corail',             qty: 100, unit: 'g' },
        { name: 'Pois chiches (boîte, égouttés)', qty: 150, unit: 'g' },
        { name: 'Tomates concassées (boîte)',   qty: 400, unit: 'g' },
        { name: 'Céleri',                       qty: 80,  unit: 'g' },
        { name: 'Oignon',                       qty: 100, unit: 'g' },
        { name: 'Vermicelles',                  qty: 40,  unit: 'g' },
        { name: 'Huile d\'olive',               qty: 15,  unit: 'ml' },
        { name: 'Citron (jus)',                 qty: 1,   unit: 'pce' },
        { name: 'Coriandre fraîche',            qty: 20,  unit: 'g' },
        { name: 'Persil frais',                 qty: 15,  unit: 'g' },
        { name: 'Safran',                       qty: 0.3, unit: 'g' },
        { name: 'Cumin moulu',                  qty: 2,   unit: 'g' },
        { name: 'Cannelle moulue',              qty: 1,   unit: 'g' },
        { name: 'Gingembre moulu',              qty: 2,   unit: 'g' }
      ],
      steps: [
        'Faire revenir bœuf haché + oignon dans l\'huile 5 min.',
        'Ajouter tomates, épices, 1 L d\'eau. Porter à ébullition.',
        'Incorporer lentilles rincées + pois chiches. Cuire 25 min.',
        'Ajouter céleri + vermicelles. Cuire encore 10 min.',
        'Hors feu : herbes fraîches + jus de citron. Ajuster sel.',
        'Servir chaud avec dattes ou citron tranché.'
      ]
    },

    {
      id: 'R206',
      name: 'Poulet Méchoui Four & Épices',
      category: 'maroc-moderne',
      mealTypes: ['lunch', 'dinner'],
      emoji: '🍗', origin: '🇲🇦',
      tags: ['high-protein', 'gluten-free', 'family', 'festive', 'low-carb'],
      servings: 2, prepTime: 10, cookTime: 45, difficulty: 1,
      // 77×4 + 7×4 + 35×9 = 308+28+315 = 651 ✓
      baseNutrition: { calories: 651, proteinGrams: 77, carbsGrams: 7, fatGrams: 35 },
      ingredients: [
        { name: 'Cuisses de poulet sans peau', qty: 400, unit: 'g' },
        { name: 'Ail',             qty: 20, unit: 'g', note: '5 gousses' },
        { name: 'Huile d\'olive',  qty: 25, unit: 'ml' },
        { name: 'Citron (jus)',    qty: 1,  unit: 'pce' },
        { name: 'Cumin moulu',     qty: 4,  unit: 'g' },
        { name: 'Paprika fumé',    qty: 3,  unit: 'g' },
        { name: 'Coriandre moulue',qty: 2,  unit: 'g' },
        { name: 'Gingembre moulu', qty: 2,  unit: 'g' },
        { name: 'Ras el hanout',   qty: 2,  unit: 'g' }
      ],
      steps: [
        'Mixer ail + huile + citron + épices → marinade.',
        'Inciser les cuisses. Enduire généreusement. Mariner 30 min min.',
        'Préchauffer four à 220 °C.',
        'Cuire 20 min. Baisser à 180 °C, poursuivre 25 min.',
        'Arroser du jus de cuisson à mi-parcours.',
        'Servir avec salade choumicha.'
      ]
    },

    // ═══════════════════════════════════════════════════
    //  WORLD FOOD  (R207–R210)
    // ═══════════════════════════════════════════════════

    {
      id: 'R207',
      name: 'Poke Bowl Saumon Avocat',
      category: 'world-food',
      mealTypes: ['lunch', 'dinner'],
      emoji: '🥗', origin: '🌍',
      tags: ['high-protein', 'healthy-fats', 'omega3', 'instagrammable', 'no-cook'],
      servings: 2, prepTime: 20, cookTime: 15, difficulty: 1,
      // 60×4 + 89×4 + 57×9 = 240+356+513 = 1109 ✓
      baseNutrition: { calories: 1109, proteinGrams: 60, carbsGrams: 89, fatGrams: 57 },
      ingredients: [
        { name: 'Saumon frais (filet)', qty: 200, unit: 'g' },
        { name: 'Riz basmati',         qty: 80,  unit: 'g', note: '≈180 g cuit' },
        { name: 'Avocat mûr',          qty: 150, unit: 'g', note: '1 avocat moyen' },
        { name: 'Concombre',           qty: 100, unit: 'g' },
        { name: 'Carotte',             qty: 80,  unit: 'g' },
        { name: 'Edamame (surgelé)',   qty: 100, unit: 'g' },
        { name: 'Sauce soja',          qty: 30,  unit: 'ml' },
        { name: 'Sésame toasté',       qty: 10,  unit: 'g' },
        { name: 'Gingembre frais',     qty: 5,   unit: 'g' },
        { name: 'Citron vert (jus)',   qty: 1,   unit: 'pce' },
        { name: 'Huile de sésame',     qty: 10,  unit: 'ml' }
      ],
      steps: [
        'Cuire le riz basmati. Laisser refroidir.',
        'Couper le saumon en cubes 2 cm. Mariner 10 min : sauce soja + gingembre râpé + huile de sésame.',
        'Trancher avocat. Râper carotte. Couper concombre en rondelles.',
        'Assembler chaque bol : riz → saumon → légumes côte à côte.',
        'Parsemer sésame. Arroser reste marinade + jus de citron vert.'
      ]
    },

    {
      id: 'R208',
      name: 'Shakshuka Épinards & Feta',
      category: 'world-food',
      mealTypes: ['breakfast'],
      emoji: '🍳', origin: '🌍',
      tags: ['vegetarian', 'high-protein', 'quick', 'breakfast', 'mediterranean'],
      servings: 2, prepTime: 10, cookTime: 20, difficulty: 1,
      // 48×4 + 38×4 + 45×9 = 192+152+405 = 749 ✓
      baseNutrition: { calories: 749, proteinGrams: 48, carbsGrams: 38, fatGrams: 45 },
      ingredients: [
        { name: 'Œuf',                         qty: 4,   unit: 'pce' },
        { name: 'Épinards frais',               qty: 200, unit: 'g' },
        { name: 'Tomates concassées (boîte)',   qty: 400, unit: 'g' },
        { name: 'Feta',                         qty: 60,  unit: 'g' },
        { name: 'Oignon',                       qty: 100, unit: 'g' },
        { name: 'Ail',                          qty: 10,  unit: 'g', note: '3 gousses' },
        { name: 'Huile d\'olive',               qty: 15,  unit: 'ml' },
        { name: 'Cumin moulu',                  qty: 2,   unit: 'g' },
        { name: 'Paprika fumé',                 qty: 2,   unit: 'g' },
        { name: 'Piment doux',                  qty: 1,   unit: 'g' },
        { name: 'Persil frais',                 qty: 10,  unit: 'g' }
      ],
      steps: [
        'Faire revenir oignon + ail + épices dans l\'huile 3 min.',
        'Ajouter tomates concassées. Mijoter 8 min.',
        'Incorporer épinards. Laisser réduire 2 min.',
        'Creuser 4 puits. Casser 1 œuf dans chaque.',
        'Émietter la feta. Couvrir, cuire à feu doux 6-8 min.',
        'Garnir de persil. Servir en poêle avec pain complet.'
      ]
    },

    {
      id: 'R209',
      name: 'One-Pot Pasta Protéiné au Thon',
      category: 'world-food',
      mealTypes: ['lunch', 'dinner'],
      emoji: '🍝', origin: '🌍',
      tags: ['high-protein', 'high-carb', 'quick', 'budget', 'meal-prep', 'one-pot'],
      servings: 2, prepTime: 5, cookTime: 20, difficulty: 1,
      // 84×4 + 170×4 + 19×9 = 336+680+171 = 1187 ✓
      baseNutrition: { calories: 1187, proteinGrams: 84, carbsGrams: 170, fatGrams: 19 },
      ingredients: [
        { name: 'Pâtes penne',                 qty: 200, unit: 'g' },
        { name: 'Thon au naturel (boîte)',      qty: 240, unit: 'g', note: '2 × 120 g' },
        { name: 'Tomates concassées (boîte)',   qty: 400, unit: 'g' },
        { name: 'Épinards frais',               qty: 100, unit: 'g' },
        { name: 'Ail',                          qty: 10,  unit: 'g', note: '3 gousses' },
        { name: 'Oignon',                       qty: 80,  unit: 'g' },
        { name: 'Huile d\'olive',               qty: 15,  unit: 'ml' },
        { name: 'Eau',                          qty: 400, unit: 'ml' },
        { name: 'Basilic séché',                qty: 2,   unit: 'g' },
        { name: 'Origan séché',                 qty: 1,   unit: 'g' }
      ],
      steps: [
        'Faire revenir oignon + ail dans l\'huile 2 min.',
        'Ajouter tomates, épices, sel + 400 ml eau.',
        'Verser les pâtes CRUES directement. Porter à ébullition.',
        'Cuire 13-15 min à feu moyen en remuant souvent.',
        'Hors feu : incorporer thon égoutté + épinards 1 min.',
        'Servir immédiatement. Se conserve 3 jours au frigo.'
      ]
    },

    {
      id: 'R210',
      name: 'Buddha Bowl Pois Chiches Rôtis & Tahini',
      category: 'world-food',
      mealTypes: ['lunch', 'dinner'],
      emoji: '🥣', origin: '🌍',
      tags: ['vegan', 'plant-protein', 'high-fiber', 'meal-prep', 'instagrammable'],
      servings: 2, prepTime: 15, cookTime: 25, difficulty: 1,
      // 45×4 + 186×4 + 67×9 = 180+744+603 = 1527 ✓
      baseNutrition: { calories: 1527, proteinGrams: 45, carbsGrams: 186, fatGrams: 67 },
      ingredients: [
        { name: 'Pois chiches (boîte, égouttés)', qty: 400, unit: 'g' },
        { name: 'Riz basmati',     qty: 120, unit: 'g', note: '≈270 g cuit' },
        { name: 'Chou rouge',      qty: 100, unit: 'g' },
        { name: 'Carotte',         qty: 100, unit: 'g' },
        { name: 'Avocat',          qty: 100, unit: 'g', note: '½ avocat' },
        { name: 'Tahini',          qty: 40,  unit: 'g' },
        { name: 'Huile d\'olive',  qty: 15,  unit: 'ml' },
        { name: 'Citron (jus)',    qty: 1,   unit: 'pce' },
        { name: 'Ail',             qty: 5,   unit: 'g', note: '1 gousse' },
        { name: 'Cumin moulu',     qty: 3,   unit: 'g' },
        { name: 'Paprika fumé',    qty: 2,   unit: 'g' },
        { name: 'Persil frais',    qty: 15,  unit: 'g' }
      ],
      steps: [
        'Préchauffer four à 200 °C. Sécher les pois chiches.',
        'Enrober huile + cumin + paprika + sel. Rôtir 22 min (secouer à mi-cuisson).',
        'Cuire riz basmati. Émincer chou rouge. Râper carotte.',
        'Sauce tahini : tahini + jus de citron + ail râpé + 2 cs eau. Fouetter.',
        'Assembler : riz → légumes côte à côte → pois chiches → avocat tranché.',
        'Napper de sauce tahini. Garnir de persil.'
      ]
    },

    {
      id: 'R211',
      name: 'Curry de Pois Chiches aux Épinards',
      category: 'world-food',
      mealTypes: ['lunch', 'dinner'],
      emoji: '🥦', origin: '🇮🇳',
      tags: ['vegan', 'high-carb', 'indian', 'budget', 'meal-prep'],
      servings: 2,
      prepTime: 10,
      cookTime: 25,
      difficulty: 1,
      baseNutrition: { calories: 840, proteinGrams: 28, carbsGrams: 110, fatGrams: 32 },
      // 28*4+110*4+32*9 = 112+440+288 = 840 ✓
      ingredients: [
        { name: 'Pois chiches (boîte, égouttés)', qty: 400, unit: 'g' },
        { name: 'Épinards frais', qty: 150, unit: 'g' },
        { name: 'Tomates concassées (boîte)', qty: 400, unit: 'g' },
        { name: 'Lait de coco', qty: 200, unit: 'ml' },
        { name: 'Oignon', qty: 100, unit: 'g' },
        { name: 'Ail', qty: 15, unit: 'g' },
        { name: 'Huile de tournesol', qty: 15, unit: 'ml' },
        { name: 'Riz basmati', qty: 100, unit: 'g' },
        { name: 'Curry en poudre', qty: 8, unit: 'g' }
      ],
      steps: [
        'Faire revenir oignon et ail dans l\'huile 3 min. Ajouter curry, mélanger 1 min.',
        'Incorporer tomates, pois chiches et lait de coco. Mijoter 12 min.',
        'Ajouter épinards, cuire 3 min. Servir sur riz basmati.'
      ]
    },
    {
      id: 'R212',
      name: 'Bibimbap Bœuf Coréen',
      category: 'world-food',
      mealTypes: ['lunch', 'dinner'],
      emoji: '🍚', origin: '🇰🇷',
      tags: ['korean', 'balanced', 'meal-prep', 'high-protein'],
      servings: 2,
      prepTime: 20,
      cookTime: 20,
      difficulty: 2,
      baseNutrition: { calories: 722, proteinGrams: 55, carbsGrams: 85, fatGrams: 18 },
      // 55*4+85*4+18*9 = 220+340+162 = 722 ✓
      ingredients: [
        { name: 'Bœuf haché maigre (5%)', qty: 250, unit: 'g' },
        { name: 'Riz basmati', qty: 150, unit: 'g' },
        { name: 'Carottes', qty: 100, unit: 'g' },
        { name: 'Courgette', qty: 100, unit: 'g' },
        { name: 'Épinards frais', qty: 80, unit: 'g' },
        { name: 'Œuf', qty: 2, unit: 'pce' },
        { name: 'Sauce soja', qty: 30, unit: 'ml' },
        { name: 'Huile de sésame', qty: 10, unit: 'ml' },
        { name: 'Gochujang (pâte pimentée)', qty: 15, unit: 'g' }
      ],
      steps: [
        'Cuire le riz. Faire revenir bœuf avec sauce soja et un peu de gochujang.',
        'Sauter séparément carottes râpées, courgette et épinards dans l\'huile de sésame.',
        'Dresser riz dans bol, disposer légumes et bœuf. Poser œuf au plat. Mélanger avant de déguster.'
      ]
    },
    {
      id: 'R213',
      name: 'Pad Thai aux Crevettes',
      category: 'world-food',
      mealTypes: ['lunch', 'dinner'],
      emoji: '🥢', origin: '🇹🇭',
      tags: ['thai', 'high-carb', 'seafood', 'stir-fry'],
      servings: 2,
      prepTime: 15,
      cookTime: 15,
      difficulty: 2,
      baseNutrition: { calories: 726, proteinGrams: 42, carbsGrams: 90, fatGrams: 22 },
      // 42*4+90*4+22*9 = 168+360+198 = 726 ✓
      ingredients: [
        { name: 'Crevettes décortiquées', qty: 250, unit: 'g' },
        { name: 'Nouilles de riz', qty: 150, unit: 'g' },
        { name: 'Œuf', qty: 2, unit: 'pce' },
        { name: 'Pousses de soja', qty: 100, unit: 'g' },
        { name: 'Oignon vert', qty: 50, unit: 'g' },
        { name: 'Sauce tamari', qty: 30, unit: 'ml' },
        { name: 'Jus de citron vert', qty: 30, unit: 'ml' },
        { name: 'Huile d\'arachide', qty: 15, unit: 'ml' },
        { name: 'Cacahuètes concassées', qty: 20, unit: 'g' }
      ],
      steps: [
        'Tremper nouilles 8 min dans eau chaude, égoutter.',
        'Chauffer wok, cuire crevettes 2 min, réserver. Brouiller œufs dans le wok.',
        'Ajouter nouilles, sauce tamari, citron vert. Incorporer crevettes et pousses de soja. Garnir cacahuètes et oignon vert.'
      ]
    },
    {
      id: 'R214',
      name: 'Dal de Lentilles au Lait de Coco',
      category: 'world-food',
      mealTypes: ['lunch', 'dinner'],
      emoji: '🥘', origin: '🇮🇳',
      tags: ['indian', 'vegan', 'high-carb', 'budget', 'meal-prep'],
      servings: 2,
      prepTime: 10,
      cookTime: 30,
      difficulty: 1,
      baseNutrition: { calories: 732, proteinGrams: 32, carbsGrams: 88, fatGrams: 28 },
      // 32*4+88*4+28*9 = 128+352+252 = 732 ✓
      ingredients: [
        { name: 'Lentilles corail', qty: 200, unit: 'g' },
        { name: 'Lait de coco', qty: 200, unit: 'ml' },
        { name: 'Tomates concassées', qty: 200, unit: 'g' },
        { name: 'Oignon', qty: 100, unit: 'g' },
        { name: 'Ail', qty: 10, unit: 'g' },
        { name: 'Gingembre frais', qty: 10, unit: 'g' },
        { name: 'Huile de tournesol', qty: 20, unit: 'ml' },
        { name: 'Curry en poudre', qty: 8, unit: 'g' },
        { name: 'Riz basmati', qty: 80, unit: 'g' }
      ],
      steps: [
        'Faire revenir oignon, ail, gingembre dans l\'huile 3 min. Ajouter curry.',
        'Incorporer lentilles, tomates, lait de coco et 400 ml eau. Cuire 20 min.',
        'Mixer partiellement pour épaissir. Servir sur riz basmati.'
      ]
    },
    {
      id: 'R215',
      name: 'Ramen Poulet Maison',
      category: 'world-food',
      mealTypes: ['lunch', 'dinner'],
      emoji: '🍜', origin: '🇯🇵',
      tags: ['japanese', 'high-protein', 'soup', 'comfort-food'],
      servings: 2,
      prepTime: 15,
      cookTime: 25,
      difficulty: 2,
      baseNutrition: { calories: 695, proteinGrams: 65, carbsGrams: 75, fatGrams: 15 },
      // 65*4+75*4+15*9 = 260+300+135 = 695 ✓
      ingredients: [
        { name: 'Blanc de poulet', qty: 300, unit: 'g' },
        { name: 'Nouilles ramen', qty: 150, unit: 'g' },
        { name: 'Bouillon de poulet', qty: 800, unit: 'ml' },
        { name: 'Sauce soja', qty: 30, unit: 'ml' },
        { name: 'Œuf', qty: 2, unit: 'pce' },
        { name: 'Oignon vert', qty: 50, unit: 'g' },
        { name: 'Champignons shiitake', qty: 80, unit: 'g' },
        { name: 'Maïs en boîte', qty: 60, unit: 'g' },
        { name: 'Huile de sésame', qty: 5, unit: 'ml' }
      ],
      steps: [
        'Cuire poulet dans bouillon 15 min. Retirer, effilocher.',
        'Cuire œufs durs 7 min, écaler et couper en deux. Cuire nouilles 3 min.',
        'Assaisonner bouillon avec sauce soja et huile de sésame. Dresser nouilles, bouillon, poulet, œuf, champignons et maïs.'
      ]
    },
    {
      id: 'R216',
      name: 'Burrito Bowl Mexicain',
      category: 'world-food',
      mealTypes: ['lunch', 'dinner'],
      emoji: '🥣', origin: '🌍',
      tags: ['mexican', 'high-protein', 'high-carb', 'meal-prep'],
      servings: 2,
      prepTime: 15,
      cookTime: 20,
      difficulty: 1,
      baseNutrition: { calories: 828, proteinGrams: 52, carbsGrams: 92, fatGrams: 28 },
      // 52*4+92*4+28*9 = 208+368+252 = 828 ✓
      ingredients: [
        { name: 'Blanc de poulet', qty: 250, unit: 'g' },
        { name: 'Riz basmati', qty: 150, unit: 'g' },
        { name: 'Haricots noirs (boîte)', qty: 200, unit: 'g' },
        { name: 'Maïs en boîte', qty: 100, unit: 'g' },
        { name: 'Avocat', qty: 100, unit: 'g' },
        { name: 'Tomates cerises', qty: 100, unit: 'g' },
        { name: 'Yaourt grec 0%', qty: 80, unit: 'g' },
        { name: 'Cumin moulu', qty: 5, unit: 'g' },
        { name: 'Huile d\'olive', qty: 15, unit: 'ml' }
      ],
      steps: [
        'Cuire riz. Assaisonner poulet avec cumin, sel, poivre.',
        'Griller poulet à la poêle 6 min/côté, trancher.',
        'Assembler : riz, haricots, maïs, tomates cerises, poulet, avocat. Napper de yaourt grec.'
      ]
    },
    {
      id: 'R217',
      name: 'Wok de Poulet aux Légumes',
      category: 'world-food',
      mealTypes: ['lunch', 'dinner'],
      emoji: '🥢', origin: '🌍',
      tags: ['chinese', 'high-protein', 'low-carb', 'quick', 'stir-fry'],
      servings: 2,
      prepTime: 10,
      cookTime: 12,
      difficulty: 1,
      baseNutrition: { calories: 582, proteinGrams: 78, carbsGrams: 18, fatGrams: 22 },
      // 78*4+18*4+22*9 = 312+72+198 = 582 ✓
      ingredients: [
        { name: 'Blanc de poulet', qty: 350, unit: 'g' },
        { name: 'Brocoli', qty: 200, unit: 'g' },
        { name: 'Poivron rouge', qty: 100, unit: 'g' },
        { name: 'Carottes', qty: 80, unit: 'g' },
        { name: 'Sauce soja', qty: 30, unit: 'ml' },
        { name: 'Ail', qty: 10, unit: 'g' },
        { name: 'Gingembre frais', qty: 10, unit: 'g' },
        { name: 'Huile de sésame', qty: 15, unit: 'ml' },
        { name: 'Fécule de maïs', qty: 10, unit: 'g' }
      ],
      steps: [
        'Couper poulet en dés. Mélanger sauce soja et fécule.',
        'Chauffer wok à feu vif. Cuire poulet 4 min, réserver.',
        'Sauter ail, gingembre, puis légumes 4 min. Remettre poulet, ajouter sauce. Mélanger 1 min.'
      ]
    },
    {
      id: 'R218',
      name: 'Salade César au Poulet',
      category: 'world-food',
      mealTypes: ['lunch'],
      emoji: '🥗', origin: '🌍',
      tags: ['american', 'high-protein', 'low-carb', 'salad'],
      servings: 2,
      prepTime: 15,
      cookTime: 12,
      difficulty: 1,
      baseNutrition: { calories: 611, proteinGrams: 62, carbsGrams: 12, fatGrams: 35 },
      // 62*4+12*4+35*9 = 248+48+315 = 611 ✓
      ingredients: [
        { name: 'Blanc de poulet', qty: 280, unit: 'g' },
        { name: 'Laitue romaine', qty: 200, unit: 'g' },
        { name: 'Parmesan râpé', qty: 40, unit: 'g' },
        { name: 'Yaourt grec 0%', qty: 100, unit: 'g' },
        { name: 'Citron (jus)', qty: 1, unit: 'pce' },
        { name: 'Ail', qty: 5, unit: 'g' },
        { name: 'Moutarde de Dijon', qty: 10, unit: 'g' },
        { name: 'Huile d\'olive', qty: 20, unit: 'ml' },
        { name: 'Croûtons pain complet', qty: 30, unit: 'g' }
      ],
      steps: [
        'Griller poulet assaisonné à la poêle 6 min/côté. Trancher.',
        'Sauce César : yaourt, citron, ail râpé, moutarde, huile. Fouetter.',
        'Mélanger laitue, sauce, parmesan, croûtons. Disposer poulet par-dessus.'
      ]
    },
    {
      id: 'R219',
      name: 'Gyros de Poulet Grec',
      category: 'world-food',
      mealTypes: ['lunch', 'dinner'],
      emoji: '🌯', origin: '🌍',
      tags: ['greek', 'high-protein', 'mediterranean', 'wrap'],
      servings: 2,
      prepTime: 15,
      cookTime: 12,
      difficulty: 1,
      baseNutrition: { calories: 664, proteinGrams: 68, carbsGrams: 35, fatGrams: 28 },
      // 68*4+35*4+28*9 = 272+140+252 = 664 ✓
      ingredients: [
        { name: 'Blanc de poulet', qty: 300, unit: 'g' },
        { name: 'Pain pita', qty: 2, unit: 'pce' },
        { name: 'Yaourt grec 0%', qty: 150, unit: 'g' },
        { name: 'Concombre', qty: 100, unit: 'g' },
        { name: 'Tomates', qty: 100, unit: 'g' },
        { name: 'Oignon rouge', qty: 50, unit: 'g' },
        { name: 'Citron (jus)', qty: 1, unit: 'pce' },
        { name: 'Huile d\'olive', qty: 15, unit: 'ml' },
        { name: 'Origan séché', qty: 3, unit: 'g' }
      ],
      steps: [
        'Mariner poulet avec huile, citron, origan, sel. Griller 6 min/côté, trancher.',
        'Tzatziki : yaourt + concombre râpé + ail + sel.',
        'Réchauffer pita. Garnir avec poulet, tzatziki, tomates et oignon rouge.'
      ]
    },
    {
      id: 'R220',
      name: 'Tacos Poulet Avocat',
      category: 'world-food',
      mealTypes: ['lunch', 'dinner'],
      emoji: '🌮', origin: '🌍',
      tags: ['mexican', 'high-protein', 'balanced', 'quick'],
      servings: 2,
      prepTime: 15,
      cookTime: 12,
      difficulty: 1,
      baseNutrition: { calories: 676, proteinGrams: 55, carbsGrams: 42, fatGrams: 32 },
      // 55*4+42*4+32*9 = 220+168+288 = 676 ✓
      ingredients: [
        { name: 'Blanc de poulet', qty: 250, unit: 'g' },
        { name: 'Tortillas de blé', qty: 4, unit: 'pce' },
        { name: 'Avocat', qty: 100, unit: 'g' },
        { name: 'Tomates', qty: 80, unit: 'g' },
        { name: 'Oignon rouge', qty: 50, unit: 'g' },
        { name: 'Yaourt grec 0%', qty: 60, unit: 'g' },
        { name: 'Citron vert (jus)', qty: 1, unit: 'pce' },
        { name: 'Cumin moulu', qty: 4, unit: 'g' },
        { name: 'Huile de tournesol', qty: 10, unit: 'ml' }
      ],
      steps: [
        'Assaisonner poulet avec cumin, sel. Cuire à la poêle 6 min/côté, émincer.',
        'Écraser avocat avec jus de citron vert, sel.',
        'Garnir tortillas : guacamole, poulet, tomates dés, oignon. Finir avec yaourt grec.'
      ]
    },
    {
      id: 'R221',
      name: 'Tom Kha Poulet Coco',
      category: 'world-food',
      mealTypes: ['lunch', 'dinner'],
      emoji: '🫕', origin: '🇹🇭',
      tags: ['thai', 'low-carb', 'keto', 'soup', 'comfort-food'],
      servings: 2,
      prepTime: 10,
      cookTime: 20,
      difficulty: 2,
      baseNutrition: { calories: 605, proteinGrams: 42, carbsGrams: 8, fatGrams: 45 },
      // 42*4+8*4+45*9 = 168+32+405 = 605 ✓
      ingredients: [
        { name: 'Blanc de poulet', qty: 200, unit: 'g' },
        { name: 'Lait de coco', qty: 400, unit: 'ml' },
        { name: 'Bouillon de poulet', qty: 300, unit: 'ml' },
        { name: 'Champignons', qty: 150, unit: 'g' },
        { name: 'Galanga frais (ou gingembre)', qty: 20, unit: 'g' },
        { name: 'Citronnelle', qty: 1, unit: 'pce' },
        { name: 'Citron vert (jus)', qty: 2, unit: 'pce' },
        { name: 'Sauce poisson', qty: 20, unit: 'ml' },
        { name: 'Piment rouge', qty: 1, unit: 'pce' }
      ],
      steps: [
        'Chauffer bouillon avec galanga, citronnelle écrasée et piment 5 min.',
        'Ajouter lait de coco, porter à frémissement. Incorporer poulet en dés et champignons.',
        'Cuire 10 min. Assaisonner sauce poisson et jus citron vert. Servir chaud.'
      ]
    },
    {
      id: 'R222',
      name: 'Pasta Pesto Poulet',
      category: 'world-food',
      mealTypes: ['lunch', 'dinner'],
      emoji: '🍝', origin: '🇮🇹',
      tags: ['italian', 'high-carb', 'high-protein', 'quick'],
      servings: 2,
      prepTime: 10,
      cookTime: 15,
      difficulty: 1,
      baseNutrition: { calories: 1003, proteinGrams: 62, carbsGrams: 110, fatGrams: 35 },
      // 62*4+110*4+35*9 = 248+440+315 = 1003 ✓
      ingredients: [
        { name: 'Pâtes penne', qty: 200, unit: 'g' },
        { name: 'Blanc de poulet', qty: 250, unit: 'g' },
        { name: 'Pesto au basilic', qty: 60, unit: 'g' },
        { name: 'Parmesan râpé', qty: 30, unit: 'g' },
        { name: 'Tomates cerises', qty: 100, unit: 'g' },
        { name: 'Ail', qty: 10, unit: 'g' },
        { name: 'Huile d\'olive', qty: 10, unit: 'ml' },
        { name: 'Basilic frais', qty: 10, unit: 'g' }
      ],
      steps: [
        'Cuire pâtes al dente. Griller poulet en dés avec ail et huile 6 min.',
        'Égoutter pâtes (garder 60 ml eau de cuisson). Mélanger pâtes + pesto + eau.',
        'Ajouter poulet, tomates cerises. Parsemer parmesan et basilic frais.'
      ]
    },
    {
      id: 'R223',
      name: 'Frittata Épinards Feta',
      category: 'world-food',
      mealTypes: ['lunch', 'dinner'],
      emoji: '🍳', origin: '🇮🇹',
      tags: ['italian', 'low-carb', 'keto', 'vegetarian', 'high-protein'],
      servings: 2,
      prepTime: 10,
      cookTime: 20,
      difficulty: 1,
      baseNutrition: { calories: 582, proteinGrams: 52, carbsGrams: 8, fatGrams: 38 },
      // 52*4+8*4+38*9 = 208+32+342 = 582 ✓
      ingredients: [
        { name: 'Œuf', qty: 6, unit: 'pce' },
        { name: 'Épinards frais', qty: 150, unit: 'g' },
        { name: 'Feta', qty: 80, unit: 'g' },
        { name: 'Oignon', qty: 60, unit: 'g' },
        { name: 'Huile d\'olive', qty: 15, unit: 'ml' },
        { name: 'Ail', qty: 5, unit: 'g' },
        { name: 'Sel, poivre', qty: 2, unit: 'g' }
      ],
      steps: [
        'Préchauffer four à 180 °C. Faire revenir oignon et ail dans huile, ajouter épinards 3 min.',
        'Battre œufs, assaisonner. Verser sur légumes dans poêle allant au four.',
        'Parsemer feta émiettée. Cuire four 15 min jusqu\'à fermeté.'
      ]
    },
    {
      id: 'R224',
      name: 'Quinoa Bowl Méditerranéen',
      category: 'world-food',
      mealTypes: ['lunch', 'dinner'],
      emoji: '🥗', origin: '🌍',
      tags: ['mediterranean', 'vegetarian', 'high-carb', 'balanced'],
      servings: 2,
      prepTime: 15,
      cookTime: 15,
      difficulty: 1,
      baseNutrition: { calories: 760, proteinGrams: 32, carbsGrams: 95, fatGrams: 28 },
      // 32*4+95*4+28*9 = 128+380+252 = 760 ✓
      ingredients: [
        { name: 'Quinoa', qty: 180, unit: 'g' },
        { name: 'Pois chiches (boîte)', qty: 200, unit: 'g' },
        { name: 'Concombre', qty: 100, unit: 'g' },
        { name: 'Tomates cerises', qty: 100, unit: 'g' },
        { name: 'Olives noires', qty: 40, unit: 'g' },
        { name: 'Feta', qty: 60, unit: 'g' },
        { name: 'Huile d\'olive', qty: 20, unit: 'ml' },
        { name: 'Citron (jus)', qty: 1, unit: 'pce' },
        { name: 'Menthe fraîche', qty: 10, unit: 'g' }
      ],
      steps: [
        'Rincer et cuire quinoa 12 min dans 360 ml eau. Laisser refroidir.',
        'Couper concombre en dés, tomates en deux. Égoutter pois chiches.',
        'Mélanger tout avec huile d\'olive, citron, menthe. Parsemer feta et olives.'
      ]
    },
    {
      id: 'R225',
      name: 'Pho Bœuf Maison',
      category: 'world-food',
      mealTypes: ['lunch', 'dinner'],
      emoji: '🍜', origin: '🇻🇳',
      tags: ['vietnamese', 'high-protein', 'soup', 'low-fat'],
      servings: 2,
      prepTime: 15,
      cookTime: 30,
      difficulty: 2,
      baseNutrition: { calories: 615, proteinGrams: 72, carbsGrams: 48, fatGrams: 15 },
      // 72*4+48*4+15*9 = 288+192+135 = 615 ✓
      ingredients: [
        { name: 'Bœuf (tranche fine)', qty: 300, unit: 'g' },
        { name: 'Nouilles de riz', qty: 150, unit: 'g' },
        { name: 'Bouillon de bœuf', qty: 1000, unit: 'ml' },
        { name: 'Oignon', qty: 80, unit: 'g' },
        { name: 'Gingembre frais', qty: 20, unit: 'g' },
        { name: 'Sauce poisson', qty: 20, unit: 'ml' },
        { name: 'Étoile de badiane', qty: 2, unit: 'pce' },
        { name: 'Pousses de soja', qty: 80, unit: 'g' },
        { name: 'Citron vert', qty: 1, unit: 'pce' }
      ],
      steps: [
        'Griller oignon et gingembre à sec au four 5 min. Chauffer bouillon avec badiane, oignon, gingembre, sauce poisson 20 min.',
        'Tremper nouilles 8 min, égoutter. Trancher bœuf très finement.',
        'Dresser : nouilles dans bol, verser bouillon bouillant sur bœuf cru pour le cuire. Garnir pousses de soja et citron vert.'
      ]
    },
    {
      id: 'R226',
      name: 'Salade Niçoise aux Anchois',
      category: 'world-food',
      mealTypes: ['lunch'],
      emoji: '🥗', origin: '🇫🇷',
      tags: ['french', 'low-carb', 'high-protein', 'salad', 'mediterranean'],
      servings: 2,
      prepTime: 15,
      cookTime: 10,
      difficulty: 1,
      baseNutrition: { calories: 622, proteinGrams: 52, carbsGrams: 18, fatGrams: 38 },
      // 52*4+18*4+38*9 = 208+72+342 = 622 ✓
      ingredients: [
        { name: 'Thon en boîte (au naturel)', qty: 240, unit: 'g' },
        { name: 'Œuf', qty: 3, unit: 'pce' },
        { name: 'Haricots verts', qty: 150, unit: 'g' },
        { name: 'Tomates', qty: 150, unit: 'g' },
        { name: 'Olives noires', qty: 40, unit: 'g' },
        { name: 'Anchois', qty: 20, unit: 'g' },
        { name: 'Huile d\'olive', qty: 25, unit: 'ml' },
        { name: 'Vinaigre balsamique', qty: 10, unit: 'ml' },
        { name: 'Moutarde de Dijon', qty: 5, unit: 'g' }
      ],
      steps: [
        'Cuire œufs durs 9 min, refroidir, couper en 2. Blanchir haricots verts 5 min.',
        'Préparer vinaigrette : huile + vinaigre + moutarde.',
        'Dresser laitue, tomates, haricots, thon, olives, anchois, œufs. Arroser vinaigrette.'
      ]
    },
    {
      id: 'R227',
      name: 'Moussaka Légère à la Dinde',
      category: 'world-food',
      mealTypes: ['lunch', 'dinner'],
      emoji: '🍽', origin: '🌍',
      tags: ['greek', 'high-protein', 'balanced', 'baked', 'meal-prep'],
      servings: 2,
      prepTime: 20,
      cookTime: 40,
      difficulty: 3,
      baseNutrition: { calories: 756, proteinGrams: 75, carbsGrams: 42, fatGrams: 32 },
      // 75*4+42*4+32*9 = 300+168+288 = 756 ✓
      ingredients: [
        { name: 'Dinde hachée', qty: 350, unit: 'g' },
        { name: 'Aubergine', qty: 300, unit: 'g' },
        { name: 'Tomates concassées', qty: 200, unit: 'g' },
        { name: 'Oignon', qty: 80, unit: 'g' },
        { name: 'Yaourt grec 0%', qty: 150, unit: 'g' },
        { name: 'Œuf', qty: 1, unit: 'pce' },
        { name: 'Parmesan râpé', qty: 30, unit: 'g' },
        { name: 'Cannelle', qty: 2, unit: 'g' },
        { name: 'Huile d\'olive', qty: 15, unit: 'ml' }
      ],
      steps: [
        'Trancher aubergine, saler 10 min, rincer, rôtir au four 15 min à 200 °C.',
        'Faire revenir oignon + dinde, ajouter tomates + cannelle. Cuire 10 min.',
        'Mélanger yaourt + œuf battu. Monter : viande, aubergines, sauce yaourt. Parsemer parmesan. Cuire 25 min à 180 °C.'
      ]
    },
    {
      id: 'R228',
      name: 'Stir-fry Bœuf aux Brocolis',
      category: 'world-food',
      mealTypes: ['lunch', 'dinner'],
      emoji: '🥢', origin: '🌍',
      tags: ['chinese', 'high-protein', 'low-carb', 'stir-fry', 'quick'],
      servings: 2,
      prepTime: 10,
      cookTime: 12,
      difficulty: 1,
      baseNutrition: { calories: 652, proteinGrams: 78, carbsGrams: 22, fatGrams: 28 },
      // 78*4+22*4+28*9 = 312+88+252 = 652 ✓
      ingredients: [
        { name: 'Bœuf (faux-filet, tranches fines)', qty: 350, unit: 'g' },
        { name: 'Brocoli', qty: 300, unit: 'g' },
        { name: 'Sauce soja', qty: 40, unit: 'ml' },
        { name: 'Ail', qty: 10, unit: 'g' },
        { name: 'Gingembre frais', qty: 10, unit: 'g' },
        { name: 'Huile de sésame', qty: 15, unit: 'ml' },
        { name: 'Fécule de maïs', qty: 10, unit: 'g' },
        { name: 'Sucre (optionnel)', qty: 5, unit: 'g' }
      ],
      steps: [
        'Mariner bœuf dans sauce soja + fécule 10 min.',
        'Faire sauter brocoli en fleurettes 3 min dans wok très chaud. Réserver.',
        'Saisir bœuf 2 min, ajouter ail, gingembre, brocoli. Mélanger 1 min. Finir avec huile de sésame.'
      ]
    },
    {
      id: 'R229',
      name: 'Bowl Teriyaki Saumon',
      category: 'world-food',
      mealTypes: ['lunch', 'dinner'],
      emoji: '🥣', origin: '🇯🇵',
      tags: ['japanese', 'high-protein', 'balanced', 'omega3', 'bowl'],
      servings: 2,
      prepTime: 15,
      cookTime: 15,
      difficulty: 1,
      baseNutrition: { calories: 978, proteinGrams: 62, carbsGrams: 88, fatGrams: 42 },
      // 62*4+88*4+42*9 = 248+352+378 = 978 ✓
      ingredients: [
        { name: 'Saumon (pavé)', qty: 300, unit: 'g' },
        { name: 'Riz japonais', qty: 200, unit: 'g' },
        { name: 'Sauce soja', qty: 30, unit: 'ml' },
        { name: 'Miel', qty: 20, unit: 'g' },
        { name: 'Huile de sésame', qty: 15, unit: 'ml' },
        { name: 'Edamame', qty: 80, unit: 'g' },
        { name: 'Concombre', qty: 80, unit: 'g' },
        { name: 'Graines de sésame', qty: 10, unit: 'g' },
        { name: 'Oignon vert', qty: 30, unit: 'g' }
      ],
      steps: [
        'Cuire riz japonais. Mélanger sauce soja, miel pour sauce teriyaki.',
        'Saisir saumon côté peau 4 min, retourner 3 min. Napper de sauce teriyaki.',
        'Dresser bol : riz, edamame, concombre, saumon. Garnir sésame et oignon vert.'
      ]
    },
    {
      id: 'R230',
      name: 'Chili Sin Carne',
      category: 'world-food',
      mealTypes: ['lunch', 'dinner'],
      emoji: '🌶', origin: '🌍',
      tags: ['mexican', 'vegan', 'high-carb', 'budget', 'meal-prep'],
      servings: 2,
      prepTime: 10,
      cookTime: 30,
      difficulty: 1,
      baseNutrition: { calories: 654, proteinGrams: 28, carbsGrams: 95, fatGrams: 18 },
      // 28*4+95*4+18*9 = 112+380+162 = 654 ✓
      ingredients: [
        { name: 'Haricots rouges (boîte)', qty: 400, unit: 'g' },
        { name: 'Maïs en boîte', qty: 150, unit: 'g' },
        { name: 'Tomates concassées', qty: 400, unit: 'g' },
        { name: 'Poivron rouge', qty: 100, unit: 'g' },
        { name: 'Oignon', qty: 100, unit: 'g' },
        { name: 'Ail', qty: 10, unit: 'g' },
        { name: 'Huile d\'olive', qty: 10, unit: 'ml' },
        { name: 'Cumin moulu', qty: 5, unit: 'g' },
        { name: 'Chili en poudre', qty: 3, unit: 'g' }
      ],
      steps: [
        'Faire revenir oignon, ail, poivron dans huile 5 min.',
        'Ajouter épices, tomates, haricots et maïs. Saler.',
        'Mijoter 20 min à feu doux. Servir avec riz ou pain.'
      ]
    },
    {
      id: 'R231',
      name: 'Lasagnes Dinde Légères',
      category: 'world-food',
      mealTypes: ['lunch', 'dinner'],
      emoji: '🍝', origin: '🇮🇹',
      tags: ['italian', 'high-protein', 'baked', 'meal-prep', 'comfort-food'],
      servings: 2,
      prepTime: 20,
      cookTime: 40,
      difficulty: 3,
      baseNutrition: { calories: 939, proteinGrams: 88, carbsGrams: 68, fatGrams: 35 },
      // 88*4+68*4+35*9 = 352+272+315 = 939 ✓
      ingredients: [
        { name: 'Dinde hachée', qty: 400, unit: 'g' },
        { name: 'Feuilles lasagnes', qty: 150, unit: 'g' },
        { name: 'Tomates concassées', qty: 400, unit: 'g' },
        { name: 'Yaourt grec 0%', qty: 200, unit: 'g' },
        { name: 'Lait écrémé', qty: 150, unit: 'ml' },
        { name: 'Farine', qty: 20, unit: 'g' },
        { name: 'Parmesan râpé', qty: 40, unit: 'g' },
        { name: 'Oignon', qty: 80, unit: 'g' },
        { name: 'Huile d\'olive', qty: 10, unit: 'ml' }
      ],
      steps: [
        'Faire revenir oignon et dinde 8 min. Ajouter tomates, saler. Mijoter 10 min.',
        'Béchamel légère : mélanger farine + lait + yaourt à feu doux 5 min.',
        'Monter lasagnes : viande, pâtes, béchamel x3. Finir parmesan. Four 25 min à 180 °C.'
      ]
    },
    {
      id: 'R232',
      name: 'Falafels au Four avec Tahini',
      category: 'world-food',
      mealTypes: ['lunch', 'dinner'],
      emoji: '🥙', origin: '🌍',
      tags: ['lebanese', 'vegan', 'high-carb', 'baked', 'mediterranean'],
      servings: 2,
      prepTime: 20,
      cookTime: 25,
      difficulty: 2,
      baseNutrition: { calories: 675, proteinGrams: 28, carbsGrams: 62, fatGrams: 35 },
      // 28*4+62*4+35*9 = 112+248+315 = 675 ✓
      ingredients: [
        { name: 'Pois chiches secs (trempés 12h)', qty: 250, unit: 'g' },
        { name: 'Oignon', qty: 80, unit: 'g' },
        { name: 'Persil frais', qty: 20, unit: 'g' },
        { name: 'Ail', qty: 10, unit: 'g' },
        { name: 'Cumin moulu', qty: 5, unit: 'g' },
        { name: 'Coriandre moulue', qty: 3, unit: 'g' },
        { name: 'Huile d\'olive', qty: 20, unit: 'ml' },
        { name: 'Tahini', qty: 30, unit: 'g' },
        { name: 'Citron (jus)', qty: 1, unit: 'pce' }
      ],
      steps: [
        'Mixer pois chiches, oignon, persil, ail, épices. Former boulettes.',
        'Badigeonner huile. Cuire au four 22 min à 200 °C en retournant à mi-cuisson.',
        'Sauce tahini : tahini + jus citron + eau. Servir falafels avec sauce.'
      ]
    },
    {
      id: 'R233',
      name: 'Avocado Toast aux Œufs',
      category: 'world-food',
      mealTypes: ['breakfast'],
      emoji: '🥑', origin: '🌍',
      tags: ['brunch', 'balanced', 'vegetarian', 'quick'],
      servings: 2,
      prepTime: 10,
      cookTime: 5,
      difficulty: 1,
      baseNutrition: { calories: 571, proteinGrams: 32, carbsGrams: 32, fatGrams: 35 },
      // 32*4+32*4+35*9 = 128+128+315 = 571 ✓
      ingredients: [
        { name: 'Pain complet (tranches)', qty: 4, unit: 'pce' },
        { name: 'Avocat', qty: 150, unit: 'g' },
        { name: 'Œuf', qty: 4, unit: 'pce' },
        { name: 'Citron (jus)', qty: 0.5, unit: 'pce' },
        { name: 'Flocons de piment rouge', qty: 1, unit: 'g' },
        { name: 'Sel, poivre', qty: 2, unit: 'g' }
      ],
      steps: [
        'Toaster le pain. Écraser avocat avec jus de citron, sel, poivre.',
        'Cuire œufs pochés ou au plat.',
        'Tartiner guacamole sur pain. Poser œuf dessus. Saupoudrer piment.'
      ]
    },
    {
      id: 'R234',
      name: 'Burger de Dinde Maison',
      category: 'world-food',
      mealTypes: ['lunch', 'dinner'],
      emoji: '🍔', origin: '🌍',
      tags: ['american', 'high-protein', 'balanced', 'burger'],
      servings: 2,
      prepTime: 15,
      cookTime: 12,
      difficulty: 2,
      baseNutrition: { calories: 704, proteinGrams: 75, carbsGrams: 38, fatGrams: 28 },
      // 75*4+38*4+28*9 = 300+152+252 = 704 ✓
      ingredients: [
        { name: 'Dinde hachée', qty: 350, unit: 'g' },
        { name: 'Pain burger complet', qty: 2, unit: 'pce' },
        { name: 'Laitue', qty: 40, unit: 'g' },
        { name: 'Tomate', qty: 80, unit: 'g' },
        { name: 'Yaourt grec 0%', qty: 60, unit: 'g' },
        { name: 'Moutarde de Dijon', qty: 10, unit: 'g' },
        { name: 'Oignon rouge', qty: 40, unit: 'g' },
        { name: 'Ail en poudre', qty: 2, unit: 'g' },
        { name: 'Huile de tournesol', qty: 10, unit: 'ml' }
      ],
      steps: [
        'Mélanger dinde avec ail, sel, poivre. Former 2 steaks.',
        'Griller à la poêle 5 min/côté. Toaster le pain.',
        'Sauce : yaourt + moutarde. Assembler burger avec tous les ingrédients.'
      ]
    },
    {
      id: 'R235',
      name: 'Soupe de Lentilles au Lait de Coco',
      category: 'world-food',
      mealTypes: ['lunch', 'dinner'],
      emoji: '🫕', origin: '🇮🇳',
      tags: ['indian', 'vegan', 'budget', 'soup', 'meal-prep'],
      servings: 2,
      prepTime: 10,
      cookTime: 25,
      difficulty: 1,
      baseNutrition: { calories: 638, proteinGrams: 28, carbsGrams: 82, fatGrams: 22 },
      // 28*4+82*4+22*9 = 112+328+198 = 638 ✓
      ingredients: [
        { name: 'Lentilles vertes', qty: 200, unit: 'g' },
        { name: 'Lait de coco', qty: 200, unit: 'ml' },
        { name: 'Carottes', qty: 150, unit: 'g' },
        { name: 'Oignon', qty: 80, unit: 'g' },
        { name: 'Ail', qty: 10, unit: 'g' },
        { name: 'Gingembre frais', qty: 10, unit: 'g' },
        { name: 'Cumin moulu', qty: 5, unit: 'g' },
        { name: 'Curcuma', qty: 3, unit: 'g' },
        { name: 'Huile de tournesol', qty: 10, unit: 'ml' }
      ],
      steps: [
        'Faire revenir oignon, ail, gingembre, épices dans huile 3 min.',
        'Ajouter lentilles, carottes, 600 ml eau. Cuire 20 min.',
        'Incorporer lait de coco, mixer partiellement. Saler et servir.'
      ]
    },
    {
      id: 'R236',
      name: 'Noodles Soba aux Légumes',
      category: 'world-food',
      mealTypes: ['lunch', 'dinner'],
      emoji: '🥢', origin: '🇯🇵',
      tags: ['japanese', 'vegan', 'high-carb', 'quick'],
      servings: 2,
      prepTime: 10,
      cookTime: 12,
      difficulty: 1,
      baseNutrition: { calories: 591, proteinGrams: 22, carbsGrams: 92, fatGrams: 15 },
      // 22*4+92*4+15*9 = 88+368+135 = 591 ✓
      ingredients: [
        { name: 'Nouilles soba', qty: 200, unit: 'g' },
        { name: 'Carottes', qty: 100, unit: 'g' },
        { name: 'Edamame', qty: 80, unit: 'g' },
        { name: 'Oignon vert', qty: 50, unit: 'g' },
        { name: 'Sauce soja', qty: 30, unit: 'ml' },
        { name: 'Vinaigre de riz', qty: 15, unit: 'ml' },
        { name: 'Huile de sésame', qty: 10, unit: 'ml' },
        { name: 'Graines de sésame', qty: 10, unit: 'g' }
      ],
      steps: [
        'Cuire nouilles soba 5 min, rincer à l\'eau froide.',
        'Préparer sauce : sauce soja + vinaigre de riz + huile sésame.',
        'Mélanger nouilles, carottes râpées, edamame, sauce. Garnir oignon vert et sésame.'
      ]
    },
    {
      id: 'R237',
      name: 'Steak de Thon au Sésame',
      category: 'world-food',
      mealTypes: ['lunch', 'dinner'],
      emoji: '🐟', origin: '🇯🇵',
      tags: ['japanese', 'high-protein', 'low-carb', 'keto', 'seafood'],
      servings: 2,
      prepTime: 10,
      cookTime: 6,
      difficulty: 2,
      baseNutrition: { calories: 596, proteinGrams: 78, carbsGrams: 8, fatGrams: 28 },
      // 78*4+8*4+28*9 = 312+32+252 = 596 ✓
      ingredients: [
        { name: 'Thon frais (pavé)', qty: 350, unit: 'g' },
        { name: 'Graines de sésame', qty: 30, unit: 'g' },
        { name: 'Sauce soja', qty: 30, unit: 'ml' },
        { name: 'Huile de sésame', qty: 15, unit: 'ml' },
        { name: 'Gingembre frais', qty: 10, unit: 'g' },
        { name: 'Citron vert', qty: 1, unit: 'pce' },
        { name: 'Salade mélangée', qty: 80, unit: 'g' }
      ],
      steps: [
        'Enrober thon de graines de sésame des deux côtés.',
        'Saisir à feu très vif 1,5 min/côté (centre rosé). Réserver.',
        'Vinaigrette : sauce soja + huile sésame + gingembre râpé + citron vert. Trancher thon, servir sur salade avec vinaigrette.'
      ]
    },
    {
      id: 'R238',
      name: 'Saumon en Papillote au Citron',
      category: 'world-food',
      mealTypes: ['lunch', 'dinner'],
      emoji: '🐟', origin: '🇫🇷',
      tags: ['french', 'high-protein', 'low-carb', 'keto', 'omega3'],
      servings: 2,
      prepTime: 10,
      cookTime: 18,
      difficulty: 1,
      baseNutrition: { calories: 579, proteinGrams: 62, carbsGrams: 4, fatGrams: 35 },
      // 62*4+4*4+35*9 = 248+16+315 = 579 ✓
      ingredients: [
        { name: 'Saumon (pavé)', qty: 300, unit: 'g' },
        { name: 'Citron', qty: 1, unit: 'pce' },
        { name: 'Ail', qty: 10, unit: 'g' },
        { name: 'Huile d\'olive', qty: 20, unit: 'ml' },
        { name: 'Aneth frais', qty: 10, unit: 'g' },
        { name: 'Courgette', qty: 100, unit: 'g' },
        { name: 'Sel, poivre', qty: 2, unit: 'g' }
      ],
      steps: [
        'Préchauffer four à 200 °C. Préparer 2 feuilles aluminium.',
        'Déposer saumon, courgette en rondelles, ail, aneth, citron en tranches. Arroser huile.',
        'Fermer papillotes hermétiquement. Cuire 18 min. Ouvrir à table.'
      ]
    },
    {
      id: 'R239',
      name: 'Wraps Poulet Légumes',
      category: 'world-food',
      mealTypes: ['lunch'],
      emoji: '🌯', origin: '🌍',
      tags: ['american', 'high-protein', 'balanced', 'quick', 'lunch'],
      servings: 2,
      prepTime: 15,
      cookTime: 10,
      difficulty: 1,
      baseNutrition: { calories: 613, proteinGrams: 55, carbsGrams: 42, fatGrams: 25 },
      // 55*4+42*4+25*9 = 220+168+225 = 613 ✓
      ingredients: [
        { name: 'Blanc de poulet', qty: 250, unit: 'g' },
        { name: 'Tortillas de blé', qty: 4, unit: 'pce' },
        { name: 'Laitue romaine', qty: 60, unit: 'g' },
        { name: 'Tomates cerises', qty: 80, unit: 'g' },
        { name: 'Poivron rouge', qty: 80, unit: 'g' },
        { name: 'Yaourt grec 0%', qty: 60, unit: 'g' },
        { name: 'Citron (jus)', qty: 0.5, unit: 'pce' },
        { name: 'Paprika fumé', qty: 3, unit: 'g' },
        { name: 'Huile d\'olive', qty: 10, unit: 'ml' }
      ],
      steps: [
        'Assaisonner poulet avec paprika, sel. Griller à poêle 5 min/côté, trancher.',
        'Sauce : yaourt + citron + sel.',
        'Garnir tortillas : laitue, poivron, tomates, poulet, sauce.'
      ]
    },
    {
      id: 'R240',
      name: 'Salade Grecque à la Feta',
      category: 'world-food',
      mealTypes: ['lunch'],
      emoji: '🥗', origin: '🌍',
      tags: ['greek', 'low-carb', 'vegetarian', 'keto', 'salad'],
      servings: 2,
      prepTime: 10,
      cookTime: 0,
      difficulty: 1,
      baseNutrition: { calories: 478, proteinGrams: 22, carbsGrams: 12, fatGrams: 38 },
      // 22*4+12*4+38*9 = 88+48+342 = 478 ✓
      ingredients: [
        { name: 'Feta', qty: 120, unit: 'g' },
        { name: 'Concombre', qty: 200, unit: 'g' },
        { name: 'Tomates', qty: 200, unit: 'g' },
        { name: 'Olives noires', qty: 60, unit: 'g' },
        { name: 'Oignon rouge', qty: 50, unit: 'g' },
        { name: 'Huile d\'olive', qty: 25, unit: 'ml' },
        { name: 'Origan séché', qty: 3, unit: 'g' },
        { name: 'Vinaigre de vin rouge', qty: 10, unit: 'ml' }
      ],
      steps: [
        'Couper concombre, tomates et oignon en morceaux réguliers.',
        'Mélanger avec olives et feta émiettée.',
        'Assaisonner avec huile d\'olive, vinaigre, origan, sel.'
      ]
    },
    {
      id: 'R241',
      name: 'Bowl Quinoa Poulet',
      category: 'world-food',
      mealTypes: ['lunch', 'dinner'],
      emoji: '🥣', origin: '🌍',
      tags: ['american', 'high-protein', 'balanced', 'meal-prep', 'bowl'],
      servings: 2,
      prepTime: 15,
      cookTime: 20,
      difficulty: 1,
      baseNutrition: { calories: 770, proteinGrams: 68, carbsGrams: 75, fatGrams: 22 },
      // 68*4+75*4+22*9 = 272+300+198 = 770 ✓
      ingredients: [
        { name: 'Blanc de poulet', qty: 300, unit: 'g' },
        { name: 'Quinoa', qty: 150, unit: 'g' },
        { name: 'Épinards frais', qty: 80, unit: 'g' },
        { name: 'Tomates cerises', qty: 80, unit: 'g' },
        { name: 'Concombre', qty: 80, unit: 'g' },
        { name: 'Avocat', qty: 60, unit: 'g' },
        { name: 'Citron (jus)', qty: 1, unit: 'pce' },
        { name: 'Huile d\'olive', qty: 15, unit: 'ml' },
        { name: 'Tahini', qty: 15, unit: 'g' }
      ],
      steps: [
        'Cuire quinoa 12 min. Griller poulet assaisonné 6 min/côté, trancher.',
        'Sauce : tahini + citron + eau + sel.',
        'Dresser bowl : quinoa, épinards, légumes, poulet. Napper de sauce tahini.'
      ]
    },
    {
      id: 'R242',
      name: 'Omelette aux Champignons',
      category: 'world-food',
      mealTypes: ['lunch', 'dinner'],
      emoji: '🍳', origin: '🇫🇷',
      tags: ['french', 'low-carb', 'keto', 'vegetarian', 'quick'],
      servings: 2,
      prepTime: 8,
      cookTime: 10,
      difficulty: 1,
      baseNutrition: { calories: 582, proteinGrams: 52, carbsGrams: 8, fatGrams: 38 },
      // 52*4+8*4+38*9 = 208+32+342 = 582 ✓
      ingredients: [
        { name: 'Œuf', qty: 6, unit: 'pce' },
        { name: 'Champignons de Paris', qty: 200, unit: 'g' },
        { name: 'Fromage râpé', qty: 50, unit: 'g' },
        { name: 'Beurre', qty: 15, unit: 'g' },
        { name: 'Ciboulette fraîche', qty: 10, unit: 'g' },
        { name: 'Sel, poivre', qty: 2, unit: 'g' }
      ],
      steps: [
        'Faire revenir champignons en lamelles dans beurre 4 min. Saler.',
        'Battre œufs avec sel et poivre. Verser dans poêle beurrée.',
        'Quand bords pris, ajouter champignons et fromage. Plier l\'omelette. Servir avec ciboulette.'
      ]
    },
    {
      id: 'R243',
      name: 'Minestrone Protéiné',
      category: 'world-food',
      mealTypes: ['lunch', 'dinner'],
      emoji: '🫕', origin: '🇮🇹',
      tags: ['italian', 'high-carb', 'budget', 'soup', 'meal-prep'],
      servings: 2,
      prepTime: 15,
      cookTime: 30,
      difficulty: 1,
      baseNutrition: { calories: 615, proteinGrams: 32, carbsGrams: 88, fatGrams: 15 },
      // 32*4+88*4+15*9 = 128+352+135 = 615 ✓
      ingredients: [
        { name: 'Haricots blancs (boîte)', qty: 200, unit: 'g' },
        { name: 'Pâtes courtes (ditalini)', qty: 100, unit: 'g' },
        { name: 'Tomates concassées', qty: 200, unit: 'g' },
        { name: 'Courgette', qty: 150, unit: 'g' },
        { name: 'Carottes', qty: 100, unit: 'g' },
        { name: 'Céleri', qty: 60, unit: 'g' },
        { name: 'Oignon', qty: 80, unit: 'g' },
        { name: 'Bouillon légumes', qty: 800, unit: 'ml' },
        { name: 'Huile d\'olive', qty: 10, unit: 'ml' }
      ],
      steps: [
        'Faire revenir oignon, céleri, carottes dans huile 5 min.',
        'Ajouter tomates, courgettes, haricots, bouillon. Cuire 20 min.',
        'Ajouter pâtes, cuire 8 min. Servir avec parmesan (optionnel).'
      ]
    },
    {
      id: 'R244',
      name: 'Riz Frit à l\'Œuf',
      category: 'world-food',
      mealTypes: ['lunch', 'dinner'],
      emoji: '🍚', origin: '🌍',
      tags: ['chinese', 'high-carb', 'vegetarian', 'quick', 'budget'],
      servings: 2,
      prepTime: 10,
      cookTime: 12,
      difficulty: 1,
      baseNutrition: { calories: 690, proteinGrams: 22, carbsGrams: 110, fatGrams: 18 },
      // 22*4+110*4+18*9 = 88+440+162 = 690 ✓
      ingredients: [
        { name: 'Riz cuit (de la veille)', qty: 400, unit: 'g' },
        { name: 'Œuf', qty: 3, unit: 'pce' },
        { name: 'Petits pois surgelés', qty: 80, unit: 'g' },
        { name: 'Carottes', qty: 60, unit: 'g' },
        { name: 'Oignon vert', qty: 40, unit: 'g' },
        { name: 'Sauce soja', qty: 30, unit: 'ml' },
        { name: 'Huile de sésame', qty: 10, unit: 'ml' },
        { name: 'Huile de tournesol', qty: 10, unit: 'ml' }
      ],
      steps: [
        'Chauffer wok à feu vif avec huile. Brouiller œufs, réserver.',
        'Faire sauter carottes et petits pois 2 min.',
        'Ajouter riz cuit, sauce soja. Mélanger à feu vif 3 min. Incorporer œufs et oignon vert. Finir huile sésame.'
      ]
    },
    {
      id: 'R245',
      name: 'Tikka Masala Light',
      category: 'world-food',
      mealTypes: ['lunch', 'dinner'],
      emoji: '🍗', origin: '🇮🇳',
      tags: ['indian', 'high-protein', 'balanced', 'meal-prep'],
      servings: 2,
      prepTime: 15,
      cookTime: 25,
      difficulty: 2,
      baseNutrition: { calories: 692, proteinGrams: 68, carbsGrams: 42, fatGrams: 28 },
      // 68*4+42*4+28*9 = 272+168+252 = 692 ✓
      ingredients: [
        { name: 'Blanc de poulet', qty: 300, unit: 'g' },
        { name: 'Yaourt grec 0%', qty: 150, unit: 'g' },
        { name: 'Tomates concassées', qty: 300, unit: 'g' },
        { name: 'Lait de coco (léger)', qty: 150, unit: 'ml' },
        { name: 'Oignon', qty: 80, unit: 'g' },
        { name: 'Ail', qty: 10, unit: 'g' },
        { name: 'Garam masala', qty: 8, unit: 'g' },
        { name: 'Curcuma', qty: 3, unit: 'g' },
        { name: 'Huile de tournesol', qty: 10, unit: 'ml' }
      ],
      steps: [
        'Mariner poulet en dés dans yaourt + garam masala + curcuma 30 min.',
        'Faire revenir oignon et ail. Ajouter poulet mariné, saisir 5 min.',
        'Incorporer tomates et lait de coco. Mijoter 15 min. Servir avec riz basmati.'
      ]
    },
    {
      id: 'R246',
      name: 'Œufs Bénédictine Healthy',
      category: 'world-food',
      mealTypes: ['breakfast'],
      emoji: '🍳', origin: '🌍',
      tags: ['brunch', 'high-protein', 'balanced', 'american'],
      servings: 2,
      prepTime: 10,
      cookTime: 12,
      difficulty: 2,
      baseNutrition: { calories: 540, proteinGrams: 35, carbsGrams: 28, fatGrams: 32 },
      // 35*4+28*4+32*9 = 140+112+288 = 540 ✓
      ingredients: [
        { name: 'Œuf', qty: 4, unit: 'pce' },
        { name: 'Muffins anglais complets', qty: 2, unit: 'pce' },
        { name: 'Saumon fumé', qty: 80, unit: 'g' },
        { name: 'Épinards frais', qty: 60, unit: 'g' },
        { name: 'Yaourt grec 0%', qty: 80, unit: 'g' },
        { name: 'Moutarde de Dijon', qty: 10, unit: 'g' },
        { name: 'Citron (jus)', qty: 0.5, unit: 'pce' },
        { name: 'Vinaigre blanc', qty: 10, unit: 'ml' }
      ],
      steps: [
        'Sauce hollandaise légère : yaourt + moutarde + citron, tiédir 2 min.',
        'Pocher œufs 3 min dans eau + vinaigre frémissante.',
        'Toaster muffins. Garnir : saumon fumé, épinards flétris, œuf poché, sauce.'
      ]
    },
    {
      id: 'R247',
      name: 'Taboulé Quinoa',
      category: 'world-food',
      mealTypes: ['lunch'],
      emoji: '🥗', origin: '🌍',
      tags: ['lebanese', 'vegan', 'high-carb', 'light', 'salad'],
      servings: 2,
      prepTime: 15,
      cookTime: 12,
      difficulty: 1,
      baseNutrition: { calories: 590, proteinGrams: 22, carbsGrams: 85, fatGrams: 18 },
      // 22*4+85*4+18*9 = 88+340+162 = 590 ✓
      ingredients: [
        { name: 'Quinoa', qty: 150, unit: 'g' },
        { name: 'Persil frais', qty: 60, unit: 'g' },
        { name: 'Menthe fraîche', qty: 20, unit: 'g' },
        { name: 'Tomates', qty: 150, unit: 'g' },
        { name: 'Concombre', qty: 100, unit: 'g' },
        { name: 'Oignon rouge', qty: 50, unit: 'g' },
        { name: 'Huile d\'olive', qty: 20, unit: 'ml' },
        { name: 'Citron (jus)', qty: 2, unit: 'pce' }
      ],
      steps: [
        'Cuire quinoa 12 min, rincer à l\'eau froide, égoutter.',
        'Hacher finement persil, menthe, tomates, concombre, oignon.',
        'Mélanger quinoa froid + légumes. Assaisonner huile d\'olive + citron + sel.'
      ]
    },
    {
      id: 'R248',
      name: 'Tom Yum Crevettes',
      category: 'world-food',
      mealTypes: ['lunch', 'dinner'],
      emoji: '🫕', origin: '🇹🇭',
      tags: ['thai', 'high-protein', 'low-carb', 'soup', 'spicy'],
      servings: 2,
      prepTime: 10,
      cookTime: 18,
      difficulty: 2,
      baseNutrition: { calories: 454, proteinGrams: 45, carbsGrams: 28, fatGrams: 18 },
      // 45*4+28*4+18*9 = 180+112+162 = 454 ✓
      ingredients: [
        { name: 'Crevettes décortiquées', qty: 250, unit: 'g' },
        { name: 'Bouillon de poulet', qty: 800, unit: 'ml' },
        { name: 'Champignons', qty: 100, unit: 'g' },
        { name: 'Citronnelle', qty: 2, unit: 'pce' },
        { name: 'Galanga (ou gingembre)', qty: 20, unit: 'g' },
        { name: 'Sauce poisson', qty: 20, unit: 'ml' },
        { name: 'Citron vert (jus)', qty: 2, unit: 'pce' },
        { name: 'Piment rouge', qty: 2, unit: 'pce' },
        { name: 'Tomates cerises', qty: 80, unit: 'g' }
      ],
      steps: [
        'Chauffer bouillon avec citronnelle, galanga, piment 8 min.',
        'Ajouter champignons et tomates cerises, cuire 4 min.',
        'Incorporer crevettes, cuire 3 min. Finir sauce poisson + citron vert. Servir chaud.'
      ]
    },
    {
      id: 'R249',
      name: 'Bowl Mangue Protéiné',
      category: 'world-food',
      mealTypes: ['breakfast'],
      emoji: '🥭', origin: '🌍',
      tags: ['tropical', 'high-carb', 'vegetarian', 'brunch', 'refreshing'],
      servings: 2,
      prepTime: 10,
      cookTime: 0,
      difficulty: 1,
      baseNutrition: { calories: 520, proteinGrams: 28, carbsGrams: 75, fatGrams: 12 },
      // 28*4+75*4+12*9 = 112+300+108 = 520 ✓
      ingredients: [
        { name: 'Yaourt grec 0%', qty: 300, unit: 'g' },
        { name: 'Mangue fraîche', qty: 200, unit: 'g' },
        { name: 'Granola', qty: 60, unit: 'g' },
        { name: 'Banane', qty: 80, unit: 'g' },
        { name: 'Graines de chia', qty: 15, unit: 'g' },
        { name: 'Miel', qty: 10, unit: 'g' },
        { name: 'Noix de coco râpée', qty: 10, unit: 'g' }
      ],
      steps: [
        'Couper mangue et banane en morceaux.',
        'Verser yaourt grec dans bols.',
        'Disposer fruits, granola, graines de chia. Arroser miel, parsemer coco râpée.'
      ]
    },
    {
      id: 'R250',
      name: 'Meal Prep Bowl Complet',
      category: 'world-food',
      mealTypes: ['lunch', 'dinner'],
      emoji: '🥣', origin: '🌍',
      tags: ['meal-prep', 'high-protein', 'balanced', 'budget'],
      servings: 2,
      prepTime: 20,
      cookTime: 25,
      difficulty: 1,
      baseNutrition: { calories: 852, proteinGrams: 85, carbsGrams: 65, fatGrams: 28 },
      // 85*4+65*4+28*9 = 340+260+252 = 852 ✓
      ingredients: [
        { name: 'Blanc de poulet', qty: 350, unit: 'g' },
        { name: 'Riz basmati', qty: 120, unit: 'g' },
        { name: 'Brocoli', qty: 200, unit: 'g' },
        { name: 'Patate douce', qty: 150, unit: 'g' },
        { name: 'Huile d\'olive', qty: 20, unit: 'ml' },
        { name: 'Paprika fumé', qty: 4, unit: 'g' },
        { name: 'Cumin moulu', qty: 3, unit: 'g' },
        { name: 'Citron (jus)', qty: 1, unit: 'pce' }
      ],
      steps: [
        'Cuire riz. Rôtir patate douce et brocoli à 200 °C 20 min avec huile et épices.',
        'Griller poulet assaisonné 6 min/côté, trancher.',
        'Assembler boxes : riz, légumes rôtis, poulet. Arroser citron. Conserver 3 jours au frais.'
      ]
    },
    {
      id: 'R251',
      name: 'Overnight Oats Protéinés',
      category: 'world-food',
      mealTypes: ['breakfast'],
      emoji: '🌾', origin: '🌍',
      tags: ['trending', 'instagram', 'high-carb', 'meal-prep', 'brunch'],
      servings: 2,
      prepTime: 5,
      cookTime: 0,
      difficulty: 1,
      baseNutrition: { calories: 550, proteinGrams: 22, carbsGrams: 75, fatGrams: 18 },
      // 22*4+75*4+18*9 = 88+300+162 = 550 ✓
      ingredients: [
        { name: 'Flocons d\'avoine', qty: 160, unit: 'g' },
        { name: 'Lait écrémé', qty: 300, unit: 'ml' },
        { name: 'Yaourt grec 0%', qty: 100, unit: 'g' },
        { name: 'Graines de chia', qty: 15, unit: 'g' },
        { name: 'Fruits rouges surgelés', qty: 80, unit: 'g' },
        { name: 'Miel', qty: 15, unit: 'g' }
      ],
      steps: [
        'Mélanger flocons, lait, yaourt, chia et miel dans bocal.',
        'Couvrir et réfrigérer toute la nuit (min 6h).',
        'Le matin, remuer et garnir de fruits rouges dégelés.'
      ]
    },
    {
      id: 'R252',
      name: 'Smoothie Bowl Mangue',
      category: 'world-food',
      mealTypes: ['breakfast'],
      emoji: '🥭', origin: '🌍',
      tags: ['instagram', 'tiktok-viral', 'high-carb', 'vegetarian', 'brunch'],
      servings: 2,
      prepTime: 10,
      cookTime: 0,
      difficulty: 1,
      baseNutrition: { calories: 440, proteinGrams: 18, carbsGrams: 65, fatGrams: 12 },
      // 18*4+65*4+12*9 = 72+260+108 = 440 ✓
      ingredients: [
        { name: 'Mangue surgelée', qty: 300, unit: 'g' },
        { name: 'Banane congelée', qty: 100, unit: 'g' },
        { name: 'Yaourt grec 0%', qty: 150, unit: 'g' },
        { name: 'Granola', qty: 40, unit: 'g' },
        { name: 'Kiwi', qty: 80, unit: 'g' },
        { name: 'Graines de chia', qty: 10, unit: 'g' },
        { name: 'Noix de coco râpée', qty: 10, unit: 'g' }
      ],
      steps: [
        'Mixer mangue + banane congelées + yaourt jusqu\'à consistance épaisse.',
        'Verser dans bols. La consistance doit être plus épaisse qu\'un smoothie.',
        'Garnir granola, kiwi tranché, chia et coco. Servir immédiatement.'
      ]
    },
    {
      id: 'R253',
      name: 'Butter Chicken Crémeux',
      category: 'world-food',
      mealTypes: ['lunch', 'dinner'],
      emoji: '🍗', origin: '🇮🇳',
      tags: ['trending', 'instagram', 'indian', 'high-protein', 'comfort-food'],
      servings: 2,
      prepTime: 15,
      cookTime: 25,
      difficulty: 2,
      baseNutrition: { calories: 664, proteinGrams: 68, carbsGrams: 35, fatGrams: 28 },
      // 68*4+35*4+28*9 = 272+140+252 = 664 ✓
      ingredients: [
        { name: 'Blanc de poulet', qty: 300, unit: 'g' },
        { name: 'Tomates concassées', qty: 300, unit: 'g' },
        { name: 'Yaourt grec 0%', qty: 150, unit: 'g' },
        { name: 'Oignon', qty: 80, unit: 'g' },
        { name: 'Ail', qty: 10, unit: 'g' },
        { name: 'Gingembre frais', qty: 10, unit: 'g' },
        { name: 'Garam masala', qty: 8, unit: 'g' },
        { name: 'Beurre', qty: 15, unit: 'g' },
        { name: 'Crème légère 5%', qty: 60, unit: 'ml' }
      ],
      steps: [
        'Mariner poulet dans yaourt + garam masala 1h (ou 30 min min). Griller à poêle.',
        'Faire revenir oignon, ail, gingembre dans beurre. Ajouter tomates, cuire 10 min.',
        'Mixer la sauce, ajouter crème légère et poulet. Mijoter 10 min. Servir avec riz basmati.'
      ]
    },
    {
      id: 'R254',
      name: 'Salmon Teriyaki Bowl',
      category: 'world-food',
      mealTypes: ['lunch', 'dinner'],
      emoji: '🥣', origin: '🇯🇵',
      tags: ['trending', 'instagram', 'japanese', 'high-protein', 'omega3', 'bowl'],
      servings: 2,
      prepTime: 15,
      cookTime: 15,
      difficulty: 2,
      baseNutrition: { calories: 930, proteinGrams: 62, carbsGrams: 85, fatGrams: 38 },
      // 62*4+85*4+38*9 = 248+340+342 = 930 ✓
      ingredients: [
        { name: 'Saumon (pavé)', qty: 300, unit: 'g' },
        { name: 'Riz japonais', qty: 200, unit: 'g' },
        { name: 'Sauce soja', qty: 40, unit: 'ml' },
        { name: 'Miel', qty: 25, unit: 'g' },
        { name: 'Huile de sésame', qty: 20, unit: 'ml' },
        { name: 'Edamame', qty: 80, unit: 'g' },
        { name: 'Avocat', qty: 80, unit: 'g' },
        { name: 'Concombre', qty: 60, unit: 'g' },
        { name: 'Graines de sésame', qty: 10, unit: 'g' }
      ],
      steps: [
        'Sauce teriyaki : sauce soja + miel + huile sésame. Mariner saumon 10 min.',
        'Saisir saumon dans poêle chaude 3-4 min/côté en nappant de sauce.',
        'Dresser bol : riz, edamame, avocat, concombre, saumon. Arroser reste sauce, parsemer sésame.'
      ]
    },
    {
      id: 'R255',
      name: 'Egg Muffins aux Légumes',
      category: 'world-food',
      mealTypes: ['breakfast', 'snack'],
      emoji: '🥚', origin: '🌍',
      tags: ['tiktok-viral', 'instagram', 'high-protein', 'low-carb', 'meal-prep', 'keto'],
      servings: 2,
      prepTime: 10,
      cookTime: 20,
      difficulty: 1,
      baseNutrition: { calories: 476, proteinGrams: 48, carbsGrams: 8, fatGrams: 28 },
      // 48*4+8*4+28*9 = 192+32+252 = 476 ✓
      ingredients: [
        { name: 'Œuf', qty: 6, unit: 'pce' },
        { name: 'Poivron rouge', qty: 80, unit: 'g' },
        { name: 'Épinards frais', qty: 60, unit: 'g' },
        { name: 'Fromage râpé', qty: 40, unit: 'g' },
        { name: 'Oignon vert', qty: 30, unit: 'g' },
        { name: 'Sel, poivre', qty: 2, unit: 'g' }
      ],
      steps: [
        'Préchauffer four à 175 °C. Huiler moule à muffins 6 alvéoles.',
        'Répartir légumes hachés dans alvéoles. Battre œufs, assaisonner, verser dessus.',
        'Parsemer fromage. Cuire 18-20 min jusqu\'à dorure. Se conserve 4 jours au frais.'
      ]
    },
    {
      id: 'R256',
      name: 'Baked Oats Banane',
      category: 'world-food',
      mealTypes: ['breakfast'],
      emoji: '🌾', origin: '🌍',
      tags: ['tiktok-viral', 'instagram', 'high-carb', 'vegetarian', 'brunch'],
      servings: 2,
      prepTime: 5,
      cookTime: 25,
      difficulty: 1,
      baseNutrition: { calories: 495, proteinGrams: 18, carbsGrams: 72, fatGrams: 15 },
      // 18*4+72*4+15*9 = 72+288+135 = 495 ✓
      ingredients: [
        { name: 'Flocons d\'avoine', qty: 150, unit: 'g' },
        { name: 'Banane', qty: 150, unit: 'g' },
        { name: 'Lait écrémé', qty: 200, unit: 'ml' },
        { name: 'Œuf', qty: 1, unit: 'pce' },
        { name: 'Miel', qty: 20, unit: 'g' },
        { name: 'Cannelle', qty: 2, unit: 'g' },
        { name: 'Pépites de chocolat noir', qty: 15, unit: 'g' }
      ],
      steps: [
        'Préchauffer four à 180 °C. Écraser banane.',
        'Mélanger tous ingrédients. Verser dans plat huilé.',
        'Cuire 20-25 min jusqu\'à dorure. Couper en parts et servir chaud.'
      ]
    },
    {
      id: 'R257',
      name: 'Chia Pudding Coco',
      category: 'world-food',
      mealTypes: ['breakfast', 'snack'],
      emoji: '🌰', origin: '🌍',
      tags: ['instagram', 'trending', 'vegetarian', 'low-carb', 'meal-prep'],
      servings: 2,
      prepTime: 5,
      cookTime: 0,
      difficulty: 1,
      baseNutrition: { calories: 414, proteinGrams: 12, carbsGrams: 42, fatGrams: 22 },
      // 12*4+42*4+22*9 = 48+168+198 = 414 ✓
      ingredients: [
        { name: 'Graines de chia', qty: 60, unit: 'g' },
        { name: 'Lait de coco (léger)', qty: 300, unit: 'ml' },
        { name: 'Mangue fraîche', qty: 150, unit: 'g' },
        { name: 'Miel', qty: 15, unit: 'g' },
        { name: 'Noix de coco râpée', qty: 15, unit: 'g' }
      ],
      steps: [
        'Mélanger chia, lait de coco et miel. Fouetter vigoureusement pour éviter les grumeaux.',
        'Réfrigérer minimum 4h (idéalement toute la nuit). Remuer après 30 min.',
        'Dresser avec mangue en dés et noix de coco râpée.'
      ]
    },
    {
      id: 'R258',
      name: 'Granola Maison',
      category: 'world-food',
      mealTypes: ['breakfast', 'snack'],
      emoji: '🌾', origin: '🌍',
      tags: ['instagram', 'trending', 'vegan', 'high-carb', 'meal-prep'],
      servings: 4,
      prepTime: 10,
      cookTime: 25,
      difficulty: 1,
      baseNutrition: { calories: 652, proteinGrams: 15, carbsGrams: 85, fatGrams: 28 },
      // 15*4+85*4+28*9 = 60+340+252 = 652 ✓
      ingredients: [
        { name: 'Flocons d\'avoine', qty: 300, unit: 'g' },
        { name: 'Miel', qty: 80, unit: 'g' },
        { name: 'Huile de coco', qty: 40, unit: 'ml' },
        { name: 'Amandes effilées', qty: 60, unit: 'g' },
        { name: 'Noix de cajou', qty: 60, unit: 'g' },
        { name: 'Raisins secs', qty: 60, unit: 'g' },
        { name: 'Cannelle', qty: 3, unit: 'g' }
      ],
      steps: [
        'Préchauffer four à 160 °C. Mélanger flocons + miel + huile de coco + cannelle.',
        'Étaler sur plaque. Cuire 20-25 min en mélangeant toutes les 10 min.',
        'Laisser refroidir totalement (croustillant en refroidissant). Ajouter fruits secs. Conserver en bocal.'
      ]
    },
    {
      id: 'R259',
      name: 'Pancakes Banane',
      category: 'world-food',
      mealTypes: ['breakfast'],
      emoji: '🥞', origin: '🌍',
      tags: ['tiktok-viral', 'instagram', 'vegetarian', 'high-carb', 'brunch'],
      servings: 2,
      prepTime: 8,
      cookTime: 10,
      difficulty: 1,
      baseNutrition: { calories: 456, proteinGrams: 22, carbsGrams: 65, fatGrams: 12 },
      // 22*4+65*4+12*9 = 88+260+108 = 456 ✓
      ingredients: [
        { name: 'Banane mûre', qty: 150, unit: 'g' },
        { name: 'Œuf', qty: 3, unit: 'pce' },
        { name: 'Flocons d\'avoine', qty: 80, unit: 'g' },
        { name: 'Lait écrémé', qty: 60, unit: 'ml' },
        { name: 'Levure chimique', qty: 4, unit: 'g' },
        { name: 'Cannelle', qty: 2, unit: 'g' },
        { name: 'Miel', qty: 10, unit: 'g' }
      ],
      steps: [
        'Écraser banane. Mixer avec œufs, flocons, lait et levure.',
        'Chauffer poêle antiadhésive légèrement huilée à feu moyen.',
        'Verser petites louches de pâte. Cuire 2 min/côté. Servir avec miel.'
      ]
    },
    {
      id: 'R260',
      name: 'Mug Cake Protéiné',
      category: 'world-food',
      mealTypes: ['snack'],
      emoji: '🍰', origin: '🌍',
      tags: ['tiktok-viral', 'instagram', 'high-protein', 'quick', 'snack'],
      servings: 1,
      prepTime: 2,
      cookTime: 2,
      difficulty: 1,
      baseNutrition: { calories: 320, proteinGrams: 25, carbsGrams: 28, fatGrams: 12 },
      // 25*4+28*4+12*9 = 100+112+108 = 320 ✓
      ingredients: [
        { name: 'Flocons d\'avoine', qty: 40, unit: 'g' },
        { name: 'Œuf', qty: 1, unit: 'pce' },
        { name: 'Lait écrémé', qty: 60, unit: 'ml' },
        { name: 'Poudre de cacao', qty: 10, unit: 'g' },
        { name: 'Miel', qty: 15, unit: 'g' },
        { name: 'Levure chimique', qty: 2, unit: 'g' }
      ],
      steps: [
        'Mélanger tous les ingrédients dans un grand mug.',
        'Micro-ondes 90 secondes à puissance max.',
        'Laisser reposer 1 min. Déguster directement dans le mug.'
      ]
    },
    {
      id: 'R261',
      name: 'Energy Balls aux Dattes',
      category: 'world-food',
      mealTypes: ['snack'],
      emoji: '🌰', origin: '🌍',
      tags: ['trending', 'instagram', 'vegan', 'high-carb', 'snack', 'meal-prep'],
      servings: 4,
      prepTime: 15,
      cookTime: 0,
      difficulty: 1,
      baseNutrition: { calories: 418, proteinGrams: 12, carbsGrams: 52, fatGrams: 18 },
      // 12*4+52*4+18*9 = 48+208+162 = 418 ✓
      ingredients: [
        { name: 'Dattes Medjool dénoyautées', qty: 200, unit: 'g' },
        { name: 'Amandes', qty: 80, unit: 'g' },
        { name: 'Flocons d\'avoine', qty: 60, unit: 'g' },
        { name: 'Poudre de cacao', qty: 15, unit: 'g' },
        { name: 'Noix de coco râpée', qty: 20, unit: 'g' },
        { name: 'Cannelle', qty: 2, unit: 'g' }
      ],
      steps: [
        'Mixer amandes et flocons grossièrement. Ajouter dattes et cacao.',
        'Mixer jusqu\'à formation d\'une boule. Ajouter 1 cs d\'eau si trop sec.',
        'Former 16 boules, rouler dans coco râpée. Réfrigérer 1h. Conserver 2 semaines.'
      ]
    },
    {
      id: 'R262',
      name: 'Hummus Maison',
      category: 'world-food',
      mealTypes: ['snack'],
      emoji: '🫙', origin: '🌍',
      tags: ['trending', 'instagram', 'vegan', 'lebanese', 'snack', 'high-carb'],
      servings: 4,
      prepTime: 10,
      cookTime: 0,
      difficulty: 1,
      baseNutrition: { calories: 504, proteinGrams: 18, carbsGrams: 45, fatGrams: 28 },
      // 18*4+45*4+28*9 = 72+180+252 = 504 ✓
      ingredients: [
        { name: 'Pois chiches (boîte, égouttés)', qty: 400, unit: 'g' },
        { name: 'Tahini', qty: 60, unit: 'g' },
        { name: 'Citron (jus)', qty: 2, unit: 'pce' },
        { name: 'Ail', qty: 10, unit: 'g' },
        { name: 'Huile d\'olive', qty: 30, unit: 'ml' },
        { name: 'Cumin moulu', qty: 3, unit: 'g' },
        { name: 'Paprika fumé', qty: 2, unit: 'g' },
        { name: 'Eau froide', qty: 60, unit: 'ml' }
      ],
      steps: [
        'Mixer pois chiches, tahini, jus citron, ail et cumin 2 min.',
        'Ajouter eau froide progressivement jusqu\'à texture crémeuse.',
        'Dresser dans plat, former puits, verser huile d\'olive, saupoudrer paprika.'
      ]
    },
    {
      id: 'R263',
      name: 'Velouté de Courgette',
      category: 'world-food',
      mealTypes: ['lunch', 'dinner'],
      emoji: '🫕', origin: '🌍',
      tags: ['trending', 'instagram', 'vegetarian', 'low-carb', 'light', 'soup'],
      servings: 2,
      prepTime: 10,
      cookTime: 20,
      difficulty: 1,
      baseNutrition: { calories: 255, proteinGrams: 8, carbsGrams: 22, fatGrams: 15 },
      // 8*4+22*4+15*9 = 32+88+135 = 255 ✓
      ingredients: [
        { name: 'Courgette', qty: 500, unit: 'g' },
        { name: 'Oignon', qty: 80, unit: 'g' },
        { name: 'Ail', qty: 5, unit: 'g' },
        { name: 'Bouillon légumes', qty: 500, unit: 'ml' },
        { name: 'Crème légère 5%', qty: 50, unit: 'ml' },
        { name: 'Huile d\'olive', qty: 10, unit: 'ml' },
        { name: 'Basilic frais', qty: 10, unit: 'g' }
      ],
      steps: [
        'Faire revenir oignon et ail dans huile 3 min.',
        'Ajouter courgettes coupées, bouillon. Cuire 15 min.',
        'Mixer finement, incorporer crème. Servir avec basilic frais.'
      ]
    },
    {
      id: 'R264',
      name: 'Velouté Carottes Gingembre',
      category: 'world-food',
      mealTypes: ['lunch', 'dinner'],
      emoji: '🫕', origin: '🌍',
      tags: ['trending', 'instagram', 'vegan', 'high-carb', 'soup', 'detox'],
      servings: 2,
      prepTime: 10,
      cookTime: 25,
      difficulty: 1,
      baseNutrition: { calories: 346, proteinGrams: 8, carbsGrams: 38, fatGrams: 18 },
      // 8*4+38*4+18*9 = 32+152+162 = 346 ✓
      ingredients: [
        { name: 'Carottes', qty: 400, unit: 'g' },
        { name: 'Gingembre frais', qty: 20, unit: 'g' },
        { name: 'Oignon', qty: 80, unit: 'g' },
        { name: 'Lait de coco (léger)', qty: 200, unit: 'ml' },
        { name: 'Bouillon légumes', qty: 400, unit: 'ml' },
        { name: 'Huile de tournesol', qty: 10, unit: 'ml' },
        { name: 'Cumin moulu', qty: 3, unit: 'g' }
      ],
      steps: [
        'Faire revenir oignon, gingembre et cumin dans huile 3 min.',
        'Ajouter carottes en rondelles et bouillon. Cuire 20 min.',
        'Mixer, incorporer lait de coco. Ajuster sel et servir avec coriandre.'
      ]
    },
    {
      id: 'R265',
      name: 'Salade Pastèque Feta',
      category: 'world-food',
      mealTypes: ['lunch'],
      emoji: '🥗', origin: '🌍',
      tags: ['trending', 'instagram', 'tiktok-viral', 'low-carb', 'vegetarian', 'refreshing'],
      servings: 2,
      prepTime: 10,
      cookTime: 0,
      difficulty: 1,
      baseNutrition: { calories: 370, proteinGrams: 15, carbsGrams: 28, fatGrams: 22 },
      // 15*4+28*4+22*9 = 60+112+198 = 370 ✓
      ingredients: [
        { name: 'Pastèque', qty: 400, unit: 'g' },
        { name: 'Feta', qty: 80, unit: 'g' },
        { name: 'Menthe fraîche', qty: 15, unit: 'g' },
        { name: 'Oignon rouge', qty: 40, unit: 'g' },
        { name: 'Citron vert (jus)', qty: 1, unit: 'pce' },
        { name: 'Huile d\'olive', qty: 15, unit: 'ml' }
      ],
      steps: [
        'Couper pastèque en gros cubes, émietter la feta.',
        'Émincer oignon rouge finement.',
        'Assembler pastèque, feta, oignon, menthe. Arroser huile d\'olive et citron vert.'
      ]
    },
    {
      id: 'R266',
      name: 'Bowl Yaourt Grec aux Fruits',
      category: 'world-food',
      mealTypes: ['breakfast'],
      emoji: '🍓', origin: '🌍',
      tags: ['instagram', 'trending', 'high-carb', 'vegetarian', 'brunch', 'light'],
      servings: 2,
      prepTime: 8,
      cookTime: 0,
      difficulty: 1,
      baseNutrition: { calories: 364, proteinGrams: 18, carbsGrams: 55, fatGrams: 8 },
      // 18*4+55*4+8*9 = 72+220+72 = 364 ✓
      ingredients: [
        { name: 'Yaourt grec 0%', qty: 400, unit: 'g' },
        { name: 'Fraises', qty: 100, unit: 'g' },
        { name: 'Myrtilles', qty: 60, unit: 'g' },
        { name: 'Banane', qty: 80, unit: 'g' },
        { name: 'Granola', qty: 40, unit: 'g' },
        { name: 'Miel', qty: 20, unit: 'g' }
      ],
      steps: [
        'Verser yaourt dans bols.',
        'Couper fruits en morceaux. Disposer joliment sur le yaourt.',
        'Saupoudrer granola et arroser de miel.'
      ]
    },
    {
      id: 'R267',
      name: 'Poivrons Farcis au Quinoa',
      category: 'world-food',
      mealTypes: ['lunch', 'dinner'],
      emoji: '🫑', origin: '🌍',
      tags: ['trending', 'instagram', 'vegetarian', 'high-carb', 'baked', 'meal-prep'],
      servings: 2,
      prepTime: 15,
      cookTime: 30,
      difficulty: 2,
      baseNutrition: { calories: 522, proteinGrams: 28, carbsGrams: 62, fatGrams: 18 },
      // 28*4+62*4+18*9 = 112+248+162 = 522 ✓
      ingredients: [
        { name: 'Poivrons rouges', qty: 4, unit: 'pce' },
        { name: 'Quinoa', qty: 150, unit: 'g' },
        { name: 'Tomates concassées', qty: 150, unit: 'g' },
        { name: 'Pois chiches (boîte)', qty: 150, unit: 'g' },
        { name: 'Oignon', qty: 60, unit: 'g' },
        { name: 'Feta', qty: 40, unit: 'g' },
        { name: 'Huile d\'olive', qty: 10, unit: 'ml' },
        { name: 'Cumin moulu', qty: 3, unit: 'g' }
      ],
      steps: [
        'Préchauffer four à 190 °C. Cuire quinoa. Couper chapeau des poivrons, évider.',
        'Mélanger quinoa, tomates, pois chiches, oignon, cumin, feta.',
        'Farcir poivrons, arroser huile. Cuire 25-30 min au four.'
      ]
    },
    {
      id: 'R268',
      name: 'Gaspacho Tomate',
      category: 'world-food',
      mealTypes: ['lunch'],
      emoji: '🍅', origin: '🌍',
      tags: ['instagram', 'trending', 'vegan', 'low-carb', 'light', 'refreshing'],
      servings: 3,
      prepTime: 15,
      cookTime: 0,
      difficulty: 1,
      baseNutrition: { calories: 247, proteinGrams: 6, carbsGrams: 22, fatGrams: 15 },
      // 6*4+22*4+15*9 = 24+88+135 = 247 ✓
      ingredients: [
        { name: 'Tomates mûres', qty: 600, unit: 'g' },
        { name: 'Concombre', qty: 200, unit: 'g' },
        { name: 'Poivron rouge', qty: 100, unit: 'g' },
        { name: 'Oignon rouge', qty: 50, unit: 'g' },
        { name: 'Ail', qty: 5, unit: 'g' },
        { name: 'Huile d\'olive', qty: 40, unit: 'ml' },
        { name: 'Vinaigre de vin rouge', qty: 15, unit: 'ml' },
        { name: 'Sel, poivre', qty: 3, unit: 'g' }
      ],
      steps: [
        'Mixer tomates, concombre, poivron, oignon et ail.',
        'Ajouter huile d\'olive et vinaigre. Mixer finement.',
        'Assaisonner, réfrigérer 2h minimum. Servir très froid avec un filet d\'huile.'
      ]
    },
    {
      id: 'R269',
      name: 'Tortilla Espagnole',
      category: 'world-food',
      mealTypes: ['lunch', 'dinner'],
      emoji: '🍳', origin: '🌍',
      tags: ['trending', 'instagram', 'spanish', 'vegetarian', 'balanced'],
      servings: 2,
      prepTime: 15,
      cookTime: 20,
      difficulty: 2,
      baseNutrition: { calories: 650, proteinGrams: 42, carbsGrams: 35, fatGrams: 38 },
      // 42*4+35*4+38*9 = 168+140+342 = 650 ✓
      ingredients: [
        { name: 'Œuf', qty: 5, unit: 'pce' },
        { name: 'Pommes de terre', qty: 250, unit: 'g' },
        { name: 'Oignon', qty: 100, unit: 'g' },
        { name: 'Huile d\'olive', qty: 30, unit: 'ml' },
        { name: 'Sel', qty: 3, unit: 'g' }
      ],
      steps: [
        'Couper pommes de terre et oignon en fines tranches. Confire 15 min dans huile à feu moyen.',
        'Battre œufs, incorporer pommes de terre et oignon égouttés. Saler.',
        'Cuire en poêle couverte 5 min. Retourner avec assiette, cuire 4 min. Servir tiède ou froid.'
      ]
    },
    {
      id: 'R270',
      name: 'Soupe Miso Tofu',
      category: 'world-food',
      mealTypes: ['lunch', 'dinner'],
      emoji: '🫕', origin: '🇯🇵',
      tags: ['instagram', 'trending', 'japanese', 'vegan', 'low-carb', 'light'],
      servings: 2,
      prepTime: 5,
      cookTime: 10,
      difficulty: 1,
      baseNutrition: { calories: 252, proteinGrams: 18, carbsGrams: 18, fatGrams: 12 },
      // 18*4+18*4+12*9 = 72+72+108 = 252 ✓
      ingredients: [
        { name: 'Tofu soyeux', qty: 150, unit: 'g' },
        { name: 'Pâte miso blanche', qty: 30, unit: 'g' },
        { name: 'Bouillon de légumes', qty: 600, unit: 'ml' },
        { name: 'Algues wakame séchées', qty: 5, unit: 'g' },
        { name: 'Oignon vert', qty: 30, unit: 'g' },
        { name: 'Sauce soja', qty: 10, unit: 'ml' }
      ],
      steps: [
        'Chauffer bouillon sans bouillir. Réhydrater wakame 5 min dans eau froide.',
        'Dissoudre miso dans louche de bouillon froid. Incorporer dans la soupe.',
        'Ajouter tofu en cubes et wakame. Servir avec oignon vert. Ne pas faire bouillir après le miso.'
      ]
    },
    {
      id: 'R271',
      name: 'Poulet Rôti au Citron',
      category: 'world-food',
      mealTypes: ['lunch', 'dinner'],
      emoji: '🍗', origin: '🇫🇷',
      tags: ['tiktok-viral', 'trending', 'high-protein', 'low-carb', 'keto', 'french'],
      servings: 2,
      prepTime: 10,
      cookTime: 30,
      difficulty: 1,
      baseNutrition: { calories: 592, proteinGrams: 72, carbsGrams: 4, fatGrams: 32 },
      // 72*4+4*4+32*9 = 288+16+288 = 592 ✓
      ingredients: [
        { name: 'Blanc de poulet (avec os)', qty: 350, unit: 'g' },
        { name: 'Citron', qty: 2, unit: 'pce' },
        { name: 'Ail', qty: 20, unit: 'g' },
        { name: 'Huile d\'olive', qty: 20, unit: 'ml' },
        { name: 'Romarin frais', qty: 5, unit: 'g' },
        { name: 'Thym frais', qty: 5, unit: 'g' },
        { name: 'Sel, poivre', qty: 3, unit: 'g' }
      ],
      steps: [
        'Préchauffer four à 200 °C. Mariner poulet dans huile + citron + herbes + ail 15 min.',
        'Disposer dans plat allant au four avec tranches de citron.',
        'Rôtir 25-30 min jusqu\'à coloration dorée et jus clair.'
      ]
    },
    {
      id: 'R272',
      name: 'Poulet Miel Moutarde',
      category: 'world-food',
      mealTypes: ['lunch', 'dinner'],
      emoji: '🍗', origin: '🌍',
      tags: ['tiktok-viral', 'trending', 'high-protein', 'low-carb', 'quick'],
      servings: 2,
      prepTime: 5,
      cookTime: 15,
      difficulty: 1,
      baseNutrition: { calories: 502, proteinGrams: 68, carbsGrams: 8, fatGrams: 22 },
      // 68*4+8*4+22*9 = 272+32+198 = 502 ✓
      ingredients: [
        { name: 'Blanc de poulet', qty: 300, unit: 'g' },
        { name: 'Miel', qty: 25, unit: 'g' },
        { name: 'Moutarde de Dijon', qty: 30, unit: 'g' },
        { name: 'Ail', qty: 5, unit: 'g' },
        { name: 'Huile d\'olive', qty: 15, unit: 'ml' },
        { name: 'Thym séché', qty: 2, unit: 'g' }
      ],
      steps: [
        'Mélanger miel, moutarde, ail haché, huile, thym.',
        'Enrober poulet de cette marinade.',
        'Griller à poêle 6 min/côté. Servir avec légumes verts.'
      ]
    },
    {
      id: 'R273',
      name: 'Crêpes Protéinées',
      category: 'world-food',
      mealTypes: ['breakfast'],
      emoji: '🥞', origin: '🌍',
      tags: ['tiktok-viral', 'instagram', 'high-carb', 'vegetarian', 'brunch'],
      servings: 2,
      prepTime: 5,
      cookTime: 15,
      difficulty: 1,
      baseNutrition: { calories: 455, proteinGrams: 28, carbsGrams: 52, fatGrams: 15 },
      // 28*4+52*4+15*9 = 112+208+135 = 455 ✓
      ingredients: [
        { name: 'Flocons d\'avoine (mixés en farine)', qty: 80, unit: 'g' },
        { name: 'Œuf', qty: 2, unit: 'pce' },
        { name: 'Lait écrémé', qty: 200, unit: 'ml' },
        { name: 'Yaourt grec 0%', qty: 80, unit: 'g' },
        { name: 'Miel', qty: 10, unit: 'g' },
        { name: 'Vanille', qty: 1, unit: 'g' }
      ],
      steps: [
        'Mixer flocons en farine. Mélanger avec œufs, lait, yaourt, miel et vanille.',
        'Laisser reposer 5 min. Cuire crêpes en poêle antiadhésive sans matière grasse.',
        'Garnir au choix : fruits frais, miel, yaourt.'
      ]
    },
    {
      id: 'R274',
      name: 'Salade Lentilles Thon',
      category: 'world-food',
      mealTypes: ['lunch'],
      emoji: '🥗', origin: '🌍',
      tags: ['trending', 'instagram', 'high-protein', 'balanced', 'meal-prep'],
      servings: 2,
      prepTime: 10,
      cookTime: 20,
      difficulty: 1,
      baseNutrition: { calories: 590, proteinGrams: 52, carbsGrams: 55, fatGrams: 18 },
      // 52*4+55*4+18*9 = 208+220+162 = 590 ✓
      ingredients: [
        { name: 'Lentilles vertes', qty: 150, unit: 'g' },
        { name: 'Thon en boîte (au naturel)', qty: 200, unit: 'g' },
        { name: 'Tomates cerises', qty: 100, unit: 'g' },
        { name: 'Concombre', qty: 80, unit: 'g' },
        { name: 'Oignon rouge', qty: 40, unit: 'g' },
        { name: 'Huile d\'olive', qty: 15, unit: 'ml' },
        { name: 'Citron (jus)', qty: 1, unit: 'pce' },
        { name: 'Moutarde', qty: 5, unit: 'g' }
      ],
      steps: [
        'Cuire lentilles 20 min dans eau bouillante salée. Rincer, égoutter.',
        'Préparer vinaigrette : huile + citron + moutarde.',
        'Mélanger lentilles tièdes, thon, légumes. Assaisonner.'
      ]
    },
    {
      id: 'R275',
      name: 'Gratin Brocolis Poulet',
      category: 'world-food',
      mealTypes: ['lunch', 'dinner'],
      emoji: '🥦', origin: '🌍',
      tags: ['tiktok-viral', 'trending', 'high-protein', 'low-carb', 'baked'],
      servings: 2,
      prepTime: 15,
      cookTime: 25,
      difficulty: 2,
      baseNutrition: { calories: 628, proteinGrams: 72, carbsGrams: 22, fatGrams: 28 },
      // 72*4+22*4+28*9 = 288+88+252 = 628 ✓
      ingredients: [
        { name: 'Blanc de poulet', qty: 300, unit: 'g' },
        { name: 'Brocoli', qty: 300, unit: 'g' },
        { name: 'Fromage râpé', qty: 60, unit: 'g' },
        { name: 'Yaourt grec 0%', qty: 150, unit: 'g' },
        { name: 'Ail', qty: 10, unit: 'g' },
        { name: 'Moutarde', qty: 15, unit: 'g' },
        { name: 'Sel, poivre, noix de muscade', qty: 3, unit: 'g' }
      ],
      steps: [
        'Cuire brocoli en fleurettes à la vapeur 5 min. Cuire poulet en dés à la poêle.',
        'Mélanger yaourt + ail + moutarde + muscade pour la sauce.',
        'Disposer brocoli et poulet dans plat, napper de sauce, parsemer fromage. Cuire 20 min à 190 °C.'
      ]
    },
    {
      id: 'R276',
      name: 'Poêlée Légumes Œufs',
      category: 'world-food',
      mealTypes: ['lunch', 'dinner'],
      emoji: '🍳', origin: '🌍',
      tags: ['trending', 'instagram', 'vegetarian', 'low-carb', 'quick', 'keto'],
      servings: 2,
      prepTime: 10,
      cookTime: 15,
      difficulty: 1,
      baseNutrition: { calories: 414, proteinGrams: 32, carbsGrams: 22, fatGrams: 22 },
      // 32*4+22*4+22*9 = 128+88+198 = 414 ✓
      ingredients: [
        { name: 'Œuf', qty: 4, unit: 'pce' },
        { name: 'Courgette', qty: 200, unit: 'g' },
        { name: 'Poivron rouge', qty: 100, unit: 'g' },
        { name: 'Tomates cerises', qty: 100, unit: 'g' },
        { name: 'Oignon', qty: 60, unit: 'g' },
        { name: 'Huile d\'olive', qty: 15, unit: 'ml' },
        { name: 'Herbes de Provence', qty: 3, unit: 'g' }
      ],
      steps: [
        'Faire revenir oignon et poivron dans huile 3 min.',
        'Ajouter courgette et tomates, cuire 5 min. Assaisonner herbes.',
        'Creuser nids dans légumes, casser œufs. Couvrir et cuire 4-5 min.'
      ]
    },
    {
      id: 'R277',
      name: 'Bowl Sushi Maison',
      category: 'world-food',
      mealTypes: ['lunch', 'dinner'],
      emoji: '🥣', origin: '🇯🇵',
      tags: ['tiktok-viral', 'instagram', 'japanese', 'high-carb', 'balanced', 'bowl'],
      servings: 2,
      prepTime: 20,
      cookTime: 20,
      difficulty: 2,
      baseNutrition: { calories: 742, proteinGrams: 48, carbsGrams: 88, fatGrams: 22 },
      // 48*4+88*4+22*9 = 192+352+198 = 742 ✓
      ingredients: [
        { name: 'Saumon frais', qty: 200, unit: 'g' },
        { name: 'Riz à sushi', qty: 200, unit: 'g' },
        { name: 'Avocat', qty: 80, unit: 'g' },
        { name: 'Concombre', qty: 80, unit: 'g' },
        { name: 'Vinaigre de riz', qty: 30, unit: 'ml' },
        { name: 'Sauce soja', qty: 20, unit: 'ml' },
        { name: 'Graines de sésame', qty: 10, unit: 'g' },
        { name: 'Nori (algues)', qty: 4, unit: 'g' }
      ],
      steps: [
        'Cuire riz, assaisonner vinaigre de riz + sel + sucre.',
        'Couper saumon, avocat, concombre en dés.',
        'Dresser bol : riz, garnitures côte à côte, saumon. Sauce soja, sésame, algues nori.'
      ]
    },
    {
      id: 'R278',
      name: 'Velouté de Patate Douce',
      category: 'world-food',
      mealTypes: ['lunch', 'dinner'],
      emoji: '🫕', origin: '🌍',
      tags: ['trending', 'instagram', 'vegan', 'high-carb', 'soup', 'comfort-food'],
      servings: 2,
      prepTime: 10,
      cookTime: 25,
      difficulty: 1,
      baseNutrition: { calories: 450, proteinGrams: 8, carbsGrams: 55, fatGrams: 22 },
      // 8*4+55*4+22*9 = 32+220+198 = 450 ✓
      ingredients: [
        { name: 'Patate douce', qty: 400, unit: 'g' },
        { name: 'Lait de coco (léger)', qty: 200, unit: 'ml' },
        { name: 'Bouillon légumes', qty: 400, unit: 'ml' },
        { name: 'Oignon', qty: 80, unit: 'g' },
        { name: 'Gingembre frais', qty: 15, unit: 'g' },
        { name: 'Huile de tournesol', qty: 10, unit: 'ml' },
        { name: 'Curry en poudre', qty: 5, unit: 'g' }
      ],
      steps: [
        'Faire revenir oignon, gingembre, curry dans huile 3 min.',
        'Ajouter patate douce en cubes et bouillon. Cuire 20 min.',
        'Mixer, incorporer lait de coco. Servir avec graines de courge (optionnel).'
      ]
    },
    {
      id: 'R279',
      name: 'Poulet Satay aux Cacahuètes',
      category: 'world-food',
      mealTypes: ['lunch', 'dinner'],
      emoji: '🥢', origin: '🇹🇭',
      tags: ['tiktok-viral', 'trending', 'thai', 'high-protein', 'balanced'],
      servings: 2,
      prepTime: 15,
      cookTime: 15,
      difficulty: 2,
      baseNutrition: { calories: 632, proteinGrams: 68, carbsGrams: 18, fatGrams: 32 },
      // 68*4+18*4+32*9 = 272+72+288 = 632 ✓
      ingredients: [
        { name: 'Blanc de poulet', qty: 300, unit: 'g' },
        { name: 'Beurre de cacahuète (naturel)', qty: 50, unit: 'g' },
        { name: 'Lait de coco (léger)', qty: 100, unit: 'ml' },
        { name: 'Sauce soja', qty: 20, unit: 'ml' },
        { name: 'Citron vert (jus)', qty: 1, unit: 'pce' },
        { name: 'Ail', qty: 5, unit: 'g' },
        { name: 'Curcuma', qty: 2, unit: 'g' },
        { name: 'Piment', qty: 1, unit: 'pce' }
      ],
      steps: [
        'Mariner poulet en lanières dans sauce soja, curcuma, ail 20 min. Embrocher.',
        'Griller brochettes 4 min/côté.',
        'Sauce satay : beurre de cacahuète + lait de coco + citron vert + piment. Chauffer 3 min. Servir.'
      ]
    },
    {
      id: 'R280',
      name: 'Salade Avocat Crevettes',
      category: 'world-food',
      mealTypes: ['lunch'],
      emoji: '🥗', origin: '🌍',
      tags: ['tiktok-viral', 'instagram', 'high-protein', 'low-carb', 'keto', 'salad'],
      servings: 2,
      prepTime: 10,
      cookTime: 5,
      difficulty: 1,
      baseNutrition: { calories: 488, proteinGrams: 38, carbsGrams: 12, fatGrams: 32 },
      // 38*4+12*4+32*9 = 152+48+288 = 488 ✓
      ingredients: [
        { name: 'Crevettes décortiquées', qty: 250, unit: 'g' },
        { name: 'Avocat', qty: 150, unit: 'g' },
        { name: 'Salade mélangée', qty: 80, unit: 'g' },
        { name: 'Tomates cerises', qty: 80, unit: 'g' },
        { name: 'Citron vert (jus)', qty: 1, unit: 'pce' },
        { name: 'Huile d\'olive', qty: 15, unit: 'ml' },
        { name: 'Ail', qty: 5, unit: 'g' },
        { name: 'Coriandre fraîche', qty: 10, unit: 'g' }
      ],
      steps: [
        'Sauter crevettes avec ail dans huile 3 min. Assaisonner.',
        'Couper avocat en tranches, tomates en 2.',
        'Dresser salade, crevettes, avocat, tomates. Arroser citron vert, garnir coriandre.'
      ]
    },
    {
      id: 'R281',
      name: 'Bowl Protéiné Vert',
      category: 'world-food',
      mealTypes: ['lunch', 'dinner'],
      emoji: '🥣', origin: '🌍',
      tags: ['instagram', 'trending', 'high-protein', 'balanced', 'bowl', 'detox'],
      servings: 2,
      prepTime: 15,
      cookTime: 15,
      difficulty: 1,
      baseNutrition: { calories: 652, proteinGrams: 45, carbsGrams: 55, fatGrams: 28 },
      // 45*4+55*4+28*9 = 180+220+252 = 652 ✓
      ingredients: [
        { name: 'Edamame', qty: 150, unit: 'g' },
        { name: 'Quinoa', qty: 120, unit: 'g' },
        { name: 'Épinards frais', qty: 80, unit: 'g' },
        { name: 'Avocat', qty: 80, unit: 'g' },
        { name: 'Concombre', qty: 80, unit: 'g' },
        { name: 'Tahini', qty: 30, unit: 'g' },
        { name: 'Citron vert (jus)', qty: 1, unit: 'pce' },
        { name: 'Huile de sésame', qty: 10, unit: 'ml' }
      ],
      steps: [
        'Cuire quinoa. Décongeler edamame.',
        'Sauce verte : tahini + citron vert + eau + huile sésame.',
        'Dresser bowl : quinoa, épinards, edamame, avocat, concombre. Napper sauce tahini.'
      ]
    },
    {
      id: 'R282',
      name: 'Pain Perdu Protéiné',
      category: 'world-food',
      mealTypes: ['breakfast'],
      emoji: '🍞', origin: '🌍',
      tags: ['tiktok-viral', 'instagram', 'high-protein', 'high-carb', 'brunch'],
      servings: 2,
      prepTime: 5,
      cookTime: 10,
      difficulty: 1,
      baseNutrition: { calories: 494, proteinGrams: 28, carbsGrams: 55, fatGrams: 18 },
      // 28*4+55*4+18*9 = 112+220+162 = 494 ✓
      ingredients: [
        { name: 'Pain complet (tranches épaisses)', qty: 4, unit: 'pce' },
        { name: 'Œuf', qty: 2, unit: 'pce' },
        { name: 'Yaourt grec 0%', qty: 80, unit: 'g' },
        { name: 'Lait écrémé', qty: 60, unit: 'ml' },
        { name: 'Cannelle', qty: 2, unit: 'g' },
        { name: 'Miel', qty: 20, unit: 'g' },
        { name: 'Fruits rouges', qty: 60, unit: 'g' }
      ],
      steps: [
        'Battre œufs + lait + cannelle. Tremper tranches de pain 30 secondes.',
        'Cuire à poêle antiadhésive 2 min/côté jusqu\'à dorure.',
        'Servir avec yaourt grec, fruits rouges et miel.'
      ]
    },
    {
      id: 'R283',
      name: 'Wrap César Poulet',
      category: 'world-food',
      mealTypes: ['lunch'],
      emoji: '🌯', origin: '🌍',
      tags: ['tiktok-viral', 'trending', 'high-protein', 'balanced', 'lunch'],
      servings: 2,
      prepTime: 15,
      cookTime: 12,
      difficulty: 1,
      baseNutrition: { calories: 624, proteinGrams: 58, carbsGrams: 35, fatGrams: 28 },
      // 58*4+35*4+28*9 = 232+140+252 = 624 ✓
      ingredients: [
        { name: 'Blanc de poulet', qty: 250, unit: 'g' },
        { name: 'Tortillas de blé', qty: 4, unit: 'pce' },
        { name: 'Laitue romaine', qty: 80, unit: 'g' },
        { name: 'Parmesan râpé', qty: 30, unit: 'g' },
        { name: 'Yaourt grec 0%', qty: 80, unit: 'g' },
        { name: 'Moutarde de Dijon', qty: 10, unit: 'g' },
        { name: 'Ail', qty: 5, unit: 'g' },
        { name: 'Huile d\'olive', qty: 10, unit: 'ml' }
      ],
      steps: [
        'Griller poulet assaisonné 6 min/côté. Trancher en lamelles.',
        'Sauce César légère : yaourt + moutarde + ail + huile.',
        'Garnir tortillas : laitue, poulet, sauce César, parmesan. Rouler serré.'
      ]
    },
    {
      id: 'R284',
      name: 'Soupe Carottes Coco',
      category: 'world-food',
      mealTypes: ['lunch', 'dinner'],
      emoji: '🫕', origin: '🌍',
      tags: ['instagram', 'trending', 'vegan', 'high-carb', 'soup', 'budget'],
      servings: 2,
      prepTime: 10,
      cookTime: 25,
      difficulty: 1,
      baseNutrition: { calories: 410, proteinGrams: 8, carbsGrams: 45, fatGrams: 22 },
      // 8*4+45*4+22*9 = 32+180+198 = 410 ✓
      ingredients: [
        { name: 'Carottes', qty: 400, unit: 'g' },
        { name: 'Lait de coco', qty: 200, unit: 'ml' },
        { name: 'Bouillon légumes', qty: 400, unit: 'ml' },
        { name: 'Oignon', qty: 80, unit: 'g' },
        { name: 'Gingembre frais', qty: 15, unit: 'g' },
        { name: 'Huile de tournesol', qty: 10, unit: 'ml' },
        { name: 'Curcuma', qty: 3, unit: 'g' }
      ],
      steps: [
        'Faire revenir oignon, gingembre, curcuma dans huile 3 min.',
        'Ajouter carottes en rondelles, bouillon. Cuire 20 min.',
        'Mixer, incorporer lait de coco. Ajuster assaisonnement.'
      ]
    },
    {
      id: 'R285',
      name: 'Poulet Méditerranéen',
      category: 'world-food',
      mealTypes: ['lunch', 'dinner'],
      emoji: '🍗', origin: '🌍',
      tags: ['tiktok-viral', 'trending', 'high-protein', 'low-carb', 'mediterranean'],
      servings: 2,
      prepTime: 10,
      cookTime: 20,
      difficulty: 1,
      baseNutrition: { calories: 572, proteinGrams: 68, carbsGrams: 12, fatGrams: 28 },
      // 68*4+12*4+28*9 = 272+48+252 = 572 ✓
      ingredients: [
        { name: 'Blanc de poulet', qty: 300, unit: 'g' },
        { name: 'Tomates cerises', qty: 150, unit: 'g' },
        { name: 'Olives noires', qty: 40, unit: 'g' },
        { name: 'Feta', qty: 40, unit: 'g' },
        { name: 'Ail', qty: 10, unit: 'g' },
        { name: 'Huile d\'olive', qty: 20, unit: 'ml' },
        { name: 'Origan séché', qty: 4, unit: 'g' },
        { name: 'Citron (jus)', qty: 1, unit: 'pce' }
      ],
      steps: [
        'Mariner poulet dans huile, citron, ail, origan.',
        'Griller poulet à poêle 6 min/côté. Ajouter tomates cerises, cuire 3 min.',
        'Parsemer olives et feta. Servir immédiatement.'
      ]
    },
    {
      id: 'R286',
      name: 'Salade Épinards Noix',
      category: 'world-food',
      mealTypes: ['lunch'],
      emoji: '🥗', origin: '🌍',
      tags: ['instagram', 'trending', 'low-carb', 'vegetarian', 'keto', 'salad'],
      servings: 2,
      prepTime: 10,
      cookTime: 0,
      difficulty: 1,
      baseNutrition: { calories: 464, proteinGrams: 18, carbsGrams: 35, fatGrams: 28 },
      // 18*4+35*4+28*9 = 72+140+252 = 464 ✓
      ingredients: [
        { name: 'Épinards frais', qty: 150, unit: 'g' },
        { name: 'Noix', qty: 30, unit: 'g' },
        { name: 'Feta', qty: 60, unit: 'g' },
        { name: 'Pomme', qty: 100, unit: 'g' },
        { name: 'Oignon rouge', qty: 40, unit: 'g' },
        { name: 'Huile d\'olive', qty: 20, unit: 'ml' },
        { name: 'Vinaigre de cidre', qty: 10, unit: 'ml' },
        { name: 'Miel', qty: 5, unit: 'g' }
      ],
      steps: [
        'Préparer vinaigrette : huile + vinaigre de cidre + miel + sel.',
        'Couper pomme en fines tranches, oignon en rondelles.',
        'Mélanger épinards, pomme, noix, feta, oignon. Assaisonner vinaigrette.'
      ]
    },
    {
      id: 'R287',
      name: 'Pancakes Avoine Banane',
      category: 'world-food',
      mealTypes: ['breakfast'],
      emoji: '🥞', origin: '🌍',
      tags: ['tiktok-viral', 'instagram', 'high-carb', 'vegetarian', 'brunch'],
      servings: 2,
      prepTime: 5,
      cookTime: 10,
      difficulty: 1,
      baseNutrition: { calories: 468, proteinGrams: 22, carbsGrams: 68, fatGrams: 12 },
      // 22*4+68*4+12*9 = 88+272+108 = 468 ✓
      ingredients: [
        { name: 'Flocons d\'avoine', qty: 100, unit: 'g' },
        { name: 'Banane mûre', qty: 120, unit: 'g' },
        { name: 'Œuf', qty: 2, unit: 'pce' },
        { name: 'Lait écrémé', qty: 80, unit: 'ml' },
        { name: 'Levure chimique', qty: 3, unit: 'g' },
        { name: 'Cannelle', qty: 1, unit: 'g' }
      ],
      steps: [
        'Mixer tous les ingrédients jusqu\'à obtenir une pâte homogène.',
        'Chauffer poêle antiadhésive légèrement huilée à feu moyen.',
        'Verser louches, cuire 2-3 min/côté. Servir avec fruits frais.'
      ]
    },
    {
      id: 'R288',
      name: 'Tartines Avocat Saumon',
      category: 'world-food',
      mealTypes: ['breakfast'],
      emoji: '🐟', origin: '🌍',
      tags: ['tiktok-viral', 'instagram', 'high-protein', 'omega3', 'brunch'],
      servings: 2,
      prepTime: 8,
      cookTime: 2,
      difficulty: 1,
      baseNutrition: { calories: 528, proteinGrams: 28, carbsGrams: 32, fatGrams: 32 },
      // 28*4+32*4+32*9 = 112+128+288 = 528 ✓
      ingredients: [
        { name: 'Pain complet (tranches)', qty: 4, unit: 'pce' },
        { name: 'Saumon fumé', qty: 120, unit: 'g' },
        { name: 'Avocat', qty: 120, unit: 'g' },
        { name: 'Citron vert (jus)', qty: 0.5, unit: 'pce' },
        { name: 'Oignon rouge', qty: 30, unit: 'g' },
        { name: 'Câpres', qty: 15, unit: 'g' },
        { name: 'Aneth frais', qty: 5, unit: 'g' }
      ],
      steps: [
        'Toaster le pain. Écraser avocat avec citron vert et sel.',
        'Étaler guacamole sur pain toasté.',
        'Disposer saumon fumé, câpres, oignon rouge émincé et aneth.'
      ]
    },
    {
      id: 'R289',
      name: 'Patate Douce Farcie',
      category: 'world-food',
      mealTypes: ['lunch', 'dinner'],
      emoji: '🍠', origin: '🌍',
      tags: ['tiktok-viral', 'instagram', 'vegetarian', 'high-carb', 'baked', 'meal-prep'],
      servings: 2,
      prepTime: 10,
      cookTime: 45,
      difficulty: 1,
      baseNutrition: { calories: 538, proteinGrams: 22, carbsGrams: 72, fatGrams: 18 },
      // 22*4+72*4+18*9 = 88+288+162 = 538 ✓
      ingredients: [
        { name: 'Patate douce', qty: 400, unit: 'g' },
        { name: 'Pois chiches (boîte)', qty: 200, unit: 'g' },
        { name: 'Épinards frais', qty: 60, unit: 'g' },
        { name: 'Yaourt grec 0%', qty: 80, unit: 'g' },
        { name: 'Citron (jus)', qty: 0.5, unit: 'pce' },
        { name: 'Paprika fumé', qty: 4, unit: 'g' },
        { name: 'Huile d\'olive', qty: 10, unit: 'ml' }
      ],
      steps: [
        'Piquer patates, cuire four 40 min à 200 °C jusqu\'à fondantes.',
        'Rôtir pois chiches 15 min avec huile, paprika, sel.',
        'Ouvrir patates en deux, garnir épinards, pois chiches, yaourt citronné.'
      ]
    },
    {
      id: 'R290',
      name: 'Bowl Crevettes Avocat Riz',
      category: 'world-food',
      mealTypes: ['lunch', 'dinner'],
      emoji: '🥣', origin: '🌍',
      tags: ['tiktok-viral', 'instagram', 'high-protein', 'balanced', 'bowl'],
      servings: 2,
      prepTime: 15,
      cookTime: 15,
      difficulty: 1,
      baseNutrition: { calories: 808, proteinGrams: 42, carbsGrams: 88, fatGrams: 32 },
      // 42*4+88*4+32*9 = 168+352+288 = 808 ✓
      ingredients: [
        { name: 'Crevettes décortiquées', qty: 250, unit: 'g' },
        { name: 'Riz basmati', qty: 160, unit: 'g' },
        { name: 'Avocat', qty: 120, unit: 'g' },
        { name: 'Mangue', qty: 80, unit: 'g' },
        { name: 'Concombre', qty: 60, unit: 'g' },
        { name: 'Sauce soja', qty: 20, unit: 'ml' },
        { name: 'Huile de sésame', qty: 15, unit: 'ml' },
        { name: 'Citron vert (jus)', qty: 1, unit: 'pce' },
        { name: 'Graines de sésame', qty: 10, unit: 'g' }
      ],
      steps: [
        'Cuire riz. Sauter crevettes dans huile sésame + sauce soja 3 min.',
        'Couper avocat, mangue et concombre en dés.',
        'Dresser bowl : riz, crevettes, fruits et légumes. Arroser citron vert, sésame.'
      ]
    },
    {
      id: 'R291',
      name: 'Soupe Épinards Pois Chiches',
      category: 'world-food',
      mealTypes: ['lunch', 'dinner'],
      emoji: '🫕', origin: '🌍',
      tags: ['tiktok-viral', 'trending', 'vegan', 'high-carb', 'budget', 'soup'],
      servings: 2,
      prepTime: 10,
      cookTime: 20,
      difficulty: 1,
      baseNutrition: { calories: 415, proteinGrams: 22, carbsGrams: 48, fatGrams: 15 },
      // 22*4+48*4+15*9 = 88+192+135 = 415 ✓
      ingredients: [
        { name: 'Pois chiches (boîte)', qty: 300, unit: 'g' },
        { name: 'Épinards frais', qty: 150, unit: 'g' },
        { name: 'Tomates concassées', qty: 200, unit: 'g' },
        { name: 'Oignon', qty: 80, unit: 'g' },
        { name: 'Ail', qty: 10, unit: 'g' },
        { name: 'Bouillon légumes', qty: 500, unit: 'ml' },
        { name: 'Huile d\'olive', qty: 10, unit: 'ml' },
        { name: 'Cumin moulu', qty: 4, unit: 'g' }
      ],
      steps: [
        'Faire revenir oignon et ail dans huile 3 min.',
        'Ajouter pois chiches, tomates, bouillon et cumin. Cuire 12 min.',
        'Incorporer épinards, cuire 3 min. Servir chaud avec pain complet.'
      ]
    },
    {
      id: 'R292',
      name: 'Quinoa Poivrons Rôtis',
      category: 'world-food',
      mealTypes: ['lunch', 'dinner'],
      emoji: '🥦', origin: '🌍',
      tags: ['instagram', 'trending', 'vegan', 'high-carb', 'meal-prep', 'mediterranean'],
      servings: 2,
      prepTime: 10,
      cookTime: 30,
      difficulty: 1,
      baseNutrition: { calories: 542, proteinGrams: 18, carbsGrams: 68, fatGrams: 22 },
      // 18*4+68*4+22*9 = 72+272+198 = 542 ✓
      ingredients: [
        { name: 'Quinoa', qty: 150, unit: 'g' },
        { name: 'Poivrons (rouge et jaune)', qty: 300, unit: 'g' },
        { name: 'Courgette', qty: 150, unit: 'g' },
        { name: 'Oignon rouge', qty: 80, unit: 'g' },
        { name: 'Feta', qty: 50, unit: 'g' },
        { name: 'Huile d\'olive', qty: 20, unit: 'ml' },
        { name: 'Citron (jus)', qty: 1, unit: 'pce' },
        { name: 'Herbes de Provence', qty: 3, unit: 'g' }
      ],
      steps: [
        'Préchauffer four 200 °C. Couper légumes, arroser huile, herbes. Rôtir 25 min.',
        'Cuire quinoa 12 min.',
        'Mélanger quinoa, légumes rôtis, citron. Émietter feta dessus.'
      ]
    },
    {
      id: 'R293',
      name: 'Nasi Goreng Poulet',
      category: 'world-food',
      mealTypes: ['lunch', 'dinner'],
      emoji: '🍚', origin: '🌍',
      tags: ['tiktok-viral', 'instagram', 'indonesian', 'high-protein', 'high-carb'],
      servings: 2,
      prepTime: 15,
      cookTime: 15,
      difficulty: 2,
      baseNutrition: { calories: 798, proteinGrams: 55, carbsGrams: 95, fatGrams: 22 },
      // 55*4+95*4+22*9 = 220+380+198 = 798 ✓
      ingredients: [
        { name: 'Blanc de poulet', qty: 200, unit: 'g' },
        { name: 'Riz cuit (de la veille)', qty: 350, unit: 'g' },
        { name: 'Œuf', qty: 2, unit: 'pce' },
        { name: 'Sauce soja', qty: 30, unit: 'ml' },
        { name: 'Kecap manis (ou sauce soja + miel)', qty: 20, unit: 'ml' },
        { name: 'Pâte de piment (sambal)', qty: 10, unit: 'g' },
        { name: 'Ail', qty: 10, unit: 'g' },
        { name: 'Oignon', qty: 60, unit: 'g' },
        { name: 'Huile de tournesol', qty: 10, unit: 'ml' }
      ],
      steps: [
        'Cuire poulet en dés à la poêle, réserver. Faire œufs frits, réserver.',
        'Faire revenir oignon, ail, sambal. Ajouter riz et sauces.',
        'Incorporer poulet, mélanger à feu vif 3 min. Servir avec œuf frit dessus.'
      ]
    },
    {
      id: 'R294',
      name: 'Taboulé Quinoa Tomates',
      category: 'world-food',
      mealTypes: ['lunch'],
      emoji: '🥗', origin: '🌍',
      tags: ['instagram', 'trending', 'vegan', 'high-carb', 'refreshing', 'light'],
      servings: 2,
      prepTime: 15,
      cookTime: 12,
      difficulty: 1,
      baseNutrition: { calories: 495, proteinGrams: 18, carbsGrams: 72, fatGrams: 15 },
      // 18*4+72*4+15*9 = 72+288+135 = 495 ✓
      ingredients: [
        { name: 'Quinoa', qty: 160, unit: 'g' },
        { name: 'Tomates', qty: 200, unit: 'g' },
        { name: 'Persil frais', qty: 60, unit: 'g' },
        { name: 'Menthe fraîche', qty: 15, unit: 'g' },
        { name: 'Oignon vert', qty: 40, unit: 'g' },
        { name: 'Citron (jus)', qty: 2, unit: 'pce' },
        { name: 'Huile d\'olive', qty: 15, unit: 'ml' }
      ],
      steps: [
        'Cuire quinoa 12 min, rincer eau froide, égoutter complètement.',
        'Hacher persil, menthe. Couper tomates en petits dés.',
        'Mélanger quinoa froid + légumes + herbes. Assaisonner huile + citron + sel.'
      ]
    },
    {
      id: 'R295',
      name: 'Omelette Blanche aux Champignons',
      category: 'world-food',
      mealTypes: ['lunch', 'dinner'],
      emoji: '🍳', origin: '🌍',
      tags: ['tiktok-viral', 'trending', 'high-protein', 'low-carb', 'keto', 'light'],
      servings: 2,
      prepTime: 5,
      cookTime: 8,
      difficulty: 1,
      baseNutrition: { calories: 266, proteinGrams: 38, carbsGrams: 6, fatGrams: 10 },
      // 38*4+6*4+10*9 = 152+24+90 = 266 ✓
      ingredients: [
        { name: 'Blanc d\'œuf', qty: 8, unit: 'pce' },
        { name: 'Champignons de Paris', qty: 150, unit: 'g' },
        { name: 'Oignon vert', qty: 30, unit: 'g' },
        { name: 'Huile de tournesol', qty: 5, unit: 'ml' },
        { name: 'Sel, poivre, herbes', qty: 2, unit: 'g' }
      ],
      steps: [
        'Faire revenir champignons en lamelles dans poêle avec un peu d\'huile 3 min.',
        'Battre blancs d\'œufs avec sel et poivre.',
        'Verser sur champignons, cuire à feu doux 4 min. Plier. Garnir oignon vert.'
      ]
    },
    {
      id: 'R296',
      name: 'Curry de Crevettes Coco',
      category: 'world-food',
      mealTypes: ['lunch', 'dinner'],
      emoji: '🥢', origin: '🇹🇭',
      tags: ['tiktok-viral', 'instagram', 'thai', 'high-protein', 'comfort-food'],
      servings: 2,
      prepTime: 10,
      cookTime: 18,
      difficulty: 2,
      baseNutrition: { calories: 596, proteinGrams: 42, carbsGrams: 35, fatGrams: 32 },
      // 42*4+35*4+32*9 = 168+140+288 = 596 ✓
      ingredients: [
        { name: 'Crevettes décortiquées', qty: 250, unit: 'g' },
        { name: 'Lait de coco', qty: 250, unit: 'ml' },
        { name: 'Tomates cerises', qty: 100, unit: 'g' },
        { name: 'Oignon', qty: 80, unit: 'g' },
        { name: 'Ail', qty: 10, unit: 'g' },
        { name: 'Gingembre frais', qty: 10, unit: 'g' },
        { name: 'Pâte de curry rouge', qty: 20, unit: 'g' },
        { name: 'Huile de tournesol', qty: 10, unit: 'ml' },
        { name: 'Coriandre fraîche', qty: 10, unit: 'g' }
      ],
      steps: [
        'Faire revenir oignon, ail, gingembre dans huile 3 min. Ajouter pâte de curry.',
        'Incorporer lait de coco, tomates cerises. Mijoter 8 min.',
        'Ajouter crevettes, cuire 4 min. Garnir coriandre. Servir avec riz basmati.'
      ]
    },
    {
      id: 'R297',
      name: 'Pancakes Protéinés',
      category: 'world-food',
      mealTypes: ['breakfast'],
      emoji: '🥞', origin: '🌍',
      tags: ['tiktok-viral', 'instagram', 'high-protein', 'high-carb', 'brunch'],
      servings: 2,
      prepTime: 5,
      cookTime: 10,
      difficulty: 1,
      baseNutrition: { calories: 483, proteinGrams: 25, carbsGrams: 62, fatGrams: 15 },
      // 25*4+62*4+15*9 = 100+248+135 = 483 ✓
      ingredients: [
        { name: 'Farine d\'avoine', qty: 100, unit: 'g' },
        { name: 'Yaourt grec 0%', qty: 150, unit: 'g' },
        { name: 'Œuf', qty: 2, unit: 'pce' },
        { name: 'Lait écrémé', qty: 60, unit: 'ml' },
        { name: 'Levure chimique', qty: 4, unit: 'g' },
        { name: 'Miel', qty: 10, unit: 'g' },
        { name: 'Vanille', qty: 1, unit: 'g' }
      ],
      steps: [
        'Mélanger farine, yaourt, œufs, lait, levure, miel, vanille.',
        'Chauffer poêle antiadhésive légèrement huilée à feu moyen.',
        'Cuire petites galettes 2 min/côté. Servir avec fruits frais et sirop d\'agave.'
      ]
    },
    {
      id: 'R298',
      name: 'Salade de Pâtes au Thon',
      category: 'world-food',
      mealTypes: ['lunch'],
      emoji: '🍝', origin: '🌍',
      tags: ['instagram', 'trending', 'high-carb', 'balanced', 'lunch', 'meal-prep'],
      servings: 2,
      prepTime: 10,
      cookTime: 10,
      difficulty: 1,
      baseNutrition: { calories: 662, proteinGrams: 28, carbsGrams: 88, fatGrams: 22 },
      // 28*4+88*4+22*9 = 112+352+198 = 662 ✓
      ingredients: [
        { name: 'Pâtes fusilli', qty: 180, unit: 'g' },
        { name: 'Thon en boîte (au naturel)', qty: 160, unit: 'g' },
        { name: 'Tomates cerises', qty: 100, unit: 'g' },
        { name: 'Concombre', qty: 80, unit: 'g' },
        { name: 'Maïs en boîte', qty: 60, unit: 'g' },
        { name: 'Huile d\'olive', qty: 20, unit: 'ml' },
        { name: 'Citron (jus)', qty: 1, unit: 'pce' },
        { name: 'Moutarde', qty: 5, unit: 'g' }
      ],
      steps: [
        'Cuire pâtes al dente. Rincer eau froide, égoutter.',
        'Égoutter thon. Couper tomates et concombre.',
        'Mélanger pâtes, thon, légumes. Assaisonner huile d\'olive + citron + moutarde.'
      ]
    },
    {
      id: 'R299',
      name: 'Wrap Thon Avocat',
      category: 'world-food',
      mealTypes: ['lunch'],
      emoji: '🌯', origin: '🌍',
      tags: ['tiktok-viral', 'trending', 'high-protein', 'balanced', 'lunch'],
      servings: 2,
      prepTime: 10,
      cookTime: 0,
      difficulty: 1,
      baseNutrition: { calories: 584, proteinGrams: 45, carbsGrams: 38, fatGrams: 28 },
      // 45*4+38*4+28*9 = 180+152+252 = 584 ✓
      ingredients: [
        { name: 'Thon en boîte (au naturel)', qty: 200, unit: 'g' },
        { name: 'Tortillas de blé', qty: 4, unit: 'pce' },
        { name: 'Avocat', qty: 100, unit: 'g' },
        { name: 'Tomates cerises', qty: 80, unit: 'g' },
        { name: 'Laitue romaine', qty: 60, unit: 'g' },
        { name: 'Yaourt grec 0%', qty: 60, unit: 'g' },
        { name: 'Citron vert (jus)', qty: 1, unit: 'pce' },
        { name: 'Câpres', qty: 10, unit: 'g' }
      ],
      steps: [
        'Écraser avocat avec citron vert et sel.',
        'Mélanger thon égoutté avec yaourt, câpres, sel.',
        'Garnir tortillas : laitue, guacamole, thon, tomates. Rouler et servir.'
      ]
    },
    {
      id: 'R300',
      name: 'Poulet Poêlé Sauce Citron',
      category: 'world-food',
      mealTypes: ['lunch', 'dinner'],
      emoji: '🍗', origin: '🌍',
      tags: ['tiktok-viral', 'trending', 'high-protein', 'low-carb', 'keto', 'quick'],
      servings: 2,
      prepTime: 5,
      cookTime: 15,
      difficulty: 1,
      baseNutrition: { calories: 548, proteinGrams: 68, carbsGrams: 6, fatGrams: 28 },
      // 68*4+6*4+28*9 = 272+24+252 = 548 ✓
      ingredients: [
        { name: 'Blanc de poulet', qty: 300, unit: 'g' },
        { name: 'Citron (jus)', qty: 2, unit: 'pce' },
        { name: 'Ail', qty: 10, unit: 'g' },
        { name: 'Huile d\'olive', qty: 20, unit: 'ml' },
        { name: 'Beurre', qty: 10, unit: 'g' },
        { name: 'Thym frais', qty: 3, unit: 'g' },
        { name: 'Persil frais', qty: 10, unit: 'g' }
      ],
      steps: [
        'Aplatir blancs de poulet pour cuisson uniforme. Saler, poivrer.',
        'Saisir dans huile + beurre 5 min/côté à feu vif. Réserver au chaud.',
        'Déglacer poêle avec jus de citron + ail haché + thym. Réduire 2 min. Napper le poulet. Garnir persil.'
      ]
    },

    // ═══════════════════════════════════════════════════
    //  SALADES  (R301–R320)
    // ═══════════════════════════════════════════════════

    {
      id: 'R301',
      name: 'Salade Niçoise au Thon',
      category: 'world-food',
      mealTypes: ['lunch'],
      emoji: '🥗', origin: '🌍',
      tags: ['salade', 'thon', 'oeufs', 'high-protein', 'mediterranean', 'no-cook'],
      servings: 1, prepTime: 15, cookTime: 10, difficulty: 1,
      // 42×4 + 15×4 + 22×9 = 168+60+198 = 426 ✓
      baseNutrition: { calories: 426, proteinGrams: 42, carbsGrams: 15, fatGrams: 22 },
      ingredients: [
        { name: 'Thon au naturel (boîte)', qty: 150, unit: 'g' },
        { name: 'Haricots verts', qty: 100, unit: 'g' },
        { name: 'Œuf', qty: 2, unit: 'pce' },
        { name: 'Tomate', qty: 150, unit: 'g' },
        { name: 'Olives noires', qty: 30, unit: 'g' },
        { name: 'Huile d\'olive', qty: 10, unit: 'ml' },
        { name: 'Citron (jus)', qty: 1, unit: 'pce' },
        { name: 'Moutarde', qty: 5, unit: 'g' },
        { name: 'Ail', qty: 5, unit: 'g' }
      ],
      steps: [
        'Cuire les haricots verts à la vapeur 8 min. Rafraîchir sous l\'eau froide.',
        'Cuire les œufs 8 min dans l\'eau bouillante. Écaler et couper en quartiers.',
        'Couper les tomates en quartiers. Égoutter le thon.',
        'Préparer la vinaigrette : huile d\'olive + jus de citron + moutarde + ail écrasé.',
        'Assembler salade, haricots, tomates, thon, œufs et olives.',
        'Arroser de vinaigrette. Servir immédiatement.'
      ]
    },

    {
      id: 'R302',
      name: 'Buddha Bowl Quinoa Poulet',
      category: 'world-food',
      mealTypes: ['lunch', 'dinner'],
      emoji: '🥣', origin: '🌍',
      tags: ['salade', 'quinoa', 'poulet', 'avocat', 'high-protein', 'balanced', 'meal-prep'],
      servings: 1, prepTime: 15, cookTime: 15, difficulty: 1,
      // 38×4 + 45×4 + 18×9 = 152+180+162 = 494 ✓
      baseNutrition: { calories: 494, proteinGrams: 38, carbsGrams: 45, fatGrams: 18 },
      ingredients: [
        { name: 'Blanc de poulet', qty: 150, unit: 'g' },
        { name: 'Quinoa sec', qty: 60, unit: 'g', note: '≈130 g cuit' },
        { name: 'Avocat mûr', qty: 70, unit: 'g', note: '½ avocat' },
        { name: 'Concombre', qty: 80, unit: 'g' },
        { name: 'Carotte', qty: 60, unit: 'g' },
        { name: 'Huile d\'olive', qty: 8, unit: 'ml' },
        { name: 'Citron (jus)', qty: 1, unit: 'pce' },
        { name: 'Cumin moulu', qty: 2, unit: 'g' },
        { name: 'Paprika doux', qty: 2, unit: 'g' }
      ],
      steps: [
        'Cuire le quinoa dans 120 ml d\'eau salée 12 min. Laisser refroidir.',
        'Assaisonner le poulet avec cumin + paprika + sel. Griller 5 min par côté.',
        'Couper poulet en tranches, avocat en lamelles, concombre et carotte en bâtonnets.',
        'Assembler le bowl : quinoa en base, garnitures côte à côte.',
        'Arroser d\'huile d\'olive + jus de citron. Servir tiède ou froid.'
      ]
    },

    {
      id: 'R303',
      name: 'Salade César Poulet Grillé',
      category: 'world-food',
      mealTypes: ['lunch'],
      emoji: '🥗', origin: '🌍',
      tags: ['salade', 'poulet', 'césar', 'high-protein', 'classic'],
      servings: 1, prepTime: 10, cookTime: 10, difficulty: 1,
      // 40×4 + 20×4 + 20×9 = 160+80+180 = 420 ✓
      baseNutrition: { calories: 420, proteinGrams: 40, carbsGrams: 20, fatGrams: 20 },
      ingredients: [
        { name: 'Blanc de poulet', qty: 150, unit: 'g' },
        { name: 'Salade romaine', qty: 120, unit: 'g' },
        { name: 'Pain complet (croûtons)', qty: 30, unit: 'g' },
        { name: 'Parmesan râpé', qty: 15, unit: 'g' },
        { name: 'Yaourt nature 0%', qty: 60, unit: 'g' },
        { name: 'Huile d\'olive', qty: 8, unit: 'ml' },
        { name: 'Citron (jus)', qty: 1, unit: 'pce' },
        { name: 'Ail', qty: 5, unit: 'g' },
        { name: 'Moutarde', qty: 5, unit: 'g' }
      ],
      steps: [
        'Griller le poulet 5 min par côté. Couper en lamelles.',
        'Couper le pain en dés. Faire dorer dans poêle sèche 3 min.',
        'Sauce légère : yaourt + huile d\'olive + citron + ail + moutarde + sel.',
        'Déchirer la romaine. Mélanger avec sauce.',
        'Garnir de poulet, croûtons et parmesan. Servir aussitôt.'
      ]
    },

    {
      id: 'R304',
      name: 'Salade Marocaine Poulpe',
      category: 'maroc-moderne',
      mealTypes: ['lunch'],
      emoji: '🥗', origin: '🇲🇦',
      tags: ['salade', 'poulpe', 'fruits-de-mer', 'high-protein', 'maroc', 'gluten-free'],
      servings: 1, prepTime: 10, cookTime: 45, difficulty: 2,
      // 36×4 + 18×4 + 22×9 = 144+72+198 = 414 ✓
      baseNutrition: { calories: 414, proteinGrams: 36, carbsGrams: 18, fatGrams: 22 },
      ingredients: [
        { name: 'Poulpe cuit', qty: 200, unit: 'g' },
        { name: 'Tomate', qty: 150, unit: 'g' },
        { name: 'Poivron rouge', qty: 80, unit: 'g' },
        { name: 'Poivron vert', qty: 60, unit: 'g' },
        { name: 'Olives vertes', qty: 40, unit: 'g' },
        { name: 'Oignon rouge', qty: 50, unit: 'g' },
        { name: 'Huile d\'olive', qty: 18, unit: 'ml' },
        { name: 'Citron (jus)', qty: 1, unit: 'pce' },
        { name: 'Persil frais', qty: 15, unit: 'g' },
        { name: 'Cumin moulu', qty: 2, unit: 'g' },
        { name: 'Paprika doux', qty: 2, unit: 'g' }
      ],
      steps: [
        'Si poulpe entier : cuire dans eau bouillante salée 40 min. Laisser refroidir.',
        'Couper le poulpe en tronçons. Couper tomates, poivrons et oignon en dés.',
        'Préparer la vinaigrette : huile d\'olive + citron + cumin + paprika + sel.',
        'Mélanger poulpe, légumes et olives dans un saladier.',
        'Arroser de vinaigrette. Garnir de persil haché. Servir frais.'
      ]
    },

    {
      id: 'R305',
      name: 'Taboulé Libanais Poulet',
      category: 'world-food',
      mealTypes: ['lunch'],
      emoji: '🥗', origin: '🌍',
      tags: ['salade', 'poulet', 'taboulé', 'boulghour', 'high-protein', 'oriental'],
      servings: 1, prepTime: 20, cookTime: 10, difficulty: 1,
      // 36×4 + 40×4 + 14×9 = 144+160+126 = 430 ✓
      baseNutrition: { calories: 430, proteinGrams: 36, carbsGrams: 40, fatGrams: 14 },
      ingredients: [
        { name: 'Blanc de poulet', qty: 130, unit: 'g' },
        { name: 'Boulghour fin', qty: 50, unit: 'g', note: '≈100 g réhydraté' },
        { name: 'Persil frais (bouquet)', qty: 60, unit: 'g' },
        { name: 'Menthe fraîche', qty: 15, unit: 'g' },
        { name: 'Tomate', qty: 120, unit: 'g' },
        { name: 'Oignon vert', qty: 30, unit: 'g' },
        { name: 'Huile d\'olive', qty: 12, unit: 'ml' },
        { name: 'Citron (jus)', qty: 1, unit: 'pce' }
      ],
      steps: [
        'Couvrir le boulghour d\'eau bouillante, couvrir 10 min. Égoutter, laisser refroidir.',
        'Griller le poulet assaisonné 5 min par côté. Couper en petits dés.',
        'Hacher très finement persil et menthe. Couper tomates et oignons en tout petits dés.',
        'Mélanger boulghour + herbes + tomates + oignons + poulet.',
        'Assaisonner généreusement : huile d\'olive + citron + sel. Réfrigérer 15 min avant service.'
      ]
    },

    {
      id: 'R306',
      name: 'Salade Lentilles Feta',
      category: 'world-food',
      mealTypes: ['lunch'],
      emoji: '🥗', origin: '🌍',
      tags: ['salade', 'lentilles', 'feta', 'vegetarian', 'high-protein', 'greek', 'meal-prep'],
      servings: 1, prepTime: 10, cookTime: 20, difficulty: 1,
      // 30×4 + 40×4 + 16×9 = 120+160+144 = 424 ✓
      baseNutrition: { calories: 424, proteinGrams: 30, carbsGrams: 40, fatGrams: 16 },
      ingredients: [
        { name: 'Lentilles vertes (sèches)', qty: 80, unit: 'g', note: '≈160 g cuites' },
        { name: 'Feta', qty: 60, unit: 'g' },
        { name: 'Épinards frais', qty: 80, unit: 'g' },
        { name: 'Tomates cerises', qty: 100, unit: 'g' },
        { name: 'Oignon rouge', qty: 40, unit: 'g' },
        { name: 'Huile d\'olive', qty: 12, unit: 'ml' },
        { name: 'Vinaigre balsamique', qty: 10, unit: 'ml' },
        { name: 'Origan séché', qty: 2, unit: 'g' }
      ],
      steps: [
        'Cuire les lentilles 20 min dans l\'eau salée. Égoutter et refroidir.',
        'Couper tomates cerises en deux, oignon en fines rondelles.',
        'Préparer vinaigrette : huile d\'olive + vinaigre balsamique + origan + sel.',
        'Assembler épinards + lentilles + tomates + oignon.',
        'Émietter la feta. Arroser de vinaigrette. Servir tiède ou froid.'
      ]
    },

    {
      id: 'R307',
      name: 'Salade Crevettes Avocat Mangue',
      category: 'world-food',
      mealTypes: ['lunch'],
      emoji: '🥗', origin: '🌍',
      tags: ['salade', 'crevettes', 'avocat', 'mangue', 'high-protein', 'exotic', 'no-cook'],
      servings: 1, prepTime: 15, cookTime: 5, difficulty: 1,
      // 30×4 + 30×4 + 20×9 = 120+120+180 = 420 ✓
      baseNutrition: { calories: 420, proteinGrams: 30, carbsGrams: 30, fatGrams: 20 },
      ingredients: [
        { name: 'Crevettes décortiquées', qty: 150, unit: 'g' },
        { name: 'Avocat mûr', qty: 80, unit: 'g', note: '½ avocat' },
        { name: 'Mangue', qty: 80, unit: 'g' },
        { name: 'Roquette', qty: 60, unit: 'g' },
        { name: 'Citron vert (jus)', qty: 1, unit: 'pce' },
        { name: 'Huile d\'olive', qty: 10, unit: 'ml' },
        { name: 'Piment doux', qty: 1, unit: 'g' },
        { name: 'Coriandre fraîche', qty: 10, unit: 'g' }
      ],
      steps: [
        'Faire sauter les crevettes dans une poêle chaude 2-3 min. Assaisonner.',
        'Couper avocat en lamelles, mangue en dés.',
        'Préparer la vinaigrette : citron vert + huile + piment + sel.',
        'Disposer roquette en base, garnir avocat, mangue, crevettes.',
        'Arroser de vinaigrette. Parsemer de coriandre. Servir frais.'
      ]
    },

    {
      id: 'R308',
      name: 'Bowl Saumon Riz Brun',
      category: 'world-food',
      mealTypes: ['lunch', 'dinner'],
      emoji: '🥣', origin: '🇯🇵',
      tags: ['salade', 'saumon', 'riz-brun', 'edamame', 'omega3', 'high-protein', 'japanese'],
      servings: 1, prepTime: 15, cookTime: 20, difficulty: 1,
      // 38×4 + 50×4 + 16×9 = 152+200+144 = 496 ✓
      baseNutrition: { calories: 496, proteinGrams: 38, carbsGrams: 50, fatGrams: 16 },
      ingredients: [
        { name: 'Filet de saumon', qty: 150, unit: 'g' },
        { name: 'Riz brun', qty: 60, unit: 'g', note: '≈140 g cuit' },
        { name: 'Edamame (surgelé)', qty: 80, unit: 'g' },
        { name: 'Concombre', qty: 80, unit: 'g' },
        { name: 'Carotte', qty: 50, unit: 'g' },
        { name: 'Sauce soja', qty: 15, unit: 'ml' },
        { name: 'Huile de sésame', qty: 5, unit: 'ml' },
        { name: 'Sésame toasté', qty: 5, unit: 'g' },
        { name: 'Gingembre frais', qty: 5, unit: 'g' },
        { name: 'Citron vert (jus)', qty: 1, unit: 'pce' }
      ],
      steps: [
        'Cuire le riz brun 18-20 min. Laisser refroidir.',
        'Cuire le saumon à la poêle 3 min par côté. Émietter en gros morceaux.',
        'Réchauffer l\'edamame. Couper concombre et carotte en bâtonnets fins.',
        'Mélanger sauce soja + huile de sésame + gingembre râpé + citron vert.',
        'Assembler le bowl : riz, saumon, edamame, légumes. Arroser de sauce. Parsemer sésame.'
      ]
    },

    {
      id: 'R309',
      name: 'Salade Pâtes Thon Méditerranéenne',
      category: 'world-food',
      mealTypes: ['lunch'],
      emoji: '🍝', origin: '🇮🇹',
      tags: ['salade', 'pâtes', 'thon', 'italian', 'high-protein', 'meal-prep', 'budget'],
      servings: 1, prepTime: 10, cookTime: 10, difficulty: 1,
      // 32×4 + 55×4 + 14×9 = 128+220+126 = 474 ✓
      baseNutrition: { calories: 474, proteinGrams: 32, carbsGrams: 55, fatGrams: 14 },
      ingredients: [
        { name: 'Pâtes complètes (fusilli)', qty: 80, unit: 'g' },
        { name: 'Thon au naturel (boîte)', qty: 120, unit: 'g' },
        { name: 'Tomate', qty: 120, unit: 'g' },
        { name: 'Olives noires', qty: 25, unit: 'g' },
        { name: 'Câpres', qty: 15, unit: 'g' },
        { name: 'Oignon rouge', qty: 30, unit: 'g' },
        { name: 'Huile d\'olive', qty: 10, unit: 'ml' },
        { name: 'Basilic frais', qty: 10, unit: 'g' },
        { name: 'Citron (jus)', qty: 1, unit: 'pce' }
      ],
      steps: [
        'Cuire les pâtes al dente selon emballage. Égoutter et rincer à l\'eau froide.',
        'Couper tomates en dés. Égoutter thon, olives et câpres.',
        'Vinaigrette : huile d\'olive + jus citron + sel + poivre.',
        'Mélanger pâtes + thon + tomates + olives + câpres + oignon.',
        'Assaisonner et garnir de basilic frais. Servir frais.'
      ]
    },

    {
      id: 'R310',
      name: 'Salade Orientale Agneau Épicé',
      category: 'maroc-moderne',
      mealTypes: ['lunch', 'dinner'],
      emoji: '🥗', origin: '🇲🇦',
      tags: ['salade', 'agneau', 'couscous', 'oriental', 'high-protein', 'maroc', 'festive'],
      servings: 1, prepTime: 15, cookTime: 15, difficulty: 2,
      // 34×4 + 48×4 + 18×9 = 136+192+162 = 490 ✓
      baseNutrition: { calories: 490, proteinGrams: 34, carbsGrams: 48, fatGrams: 18 },
      ingredients: [
        { name: 'Agneau haché maigre', qty: 130, unit: 'g' },
        { name: 'Couscous fin', qty: 60, unit: 'g', note: '≈120 g réhydraté' },
        { name: 'Raisins secs', qty: 20, unit: 'g' },
        { name: 'Amandes effilées', qty: 15, unit: 'g' },
        { name: 'Menthe fraîche', qty: 15, unit: 'g' },
        { name: 'Persil frais', qty: 15, unit: 'g' },
        { name: 'Oignon', qty: 50, unit: 'g' },
        { name: 'Huile d\'olive', qty: 12, unit: 'ml' },
        { name: 'Citron (jus)', qty: 1, unit: 'pce' },
        { name: 'Ras el hanout', qty: 3, unit: 'g' },
        { name: 'Cannelle moulue', qty: 1, unit: 'g' }
      ],
      steps: [
        'Réhydrater le couscous avec eau bouillante + 1 c.à.c d\'huile. Couvrir 5 min. Égrener.',
        'Faire revenir l\'oignon émincé dans l\'huile. Ajouter l\'agneau + épices. Cuire 8 min.',
        'Torréfier les amandes à sec dans une poêle 2 min.',
        'Assembler couscous + agneau + raisins secs + amandes.',
        'Garnir de menthe et persil hachés. Arroser de jus de citron. Servir tiède.'
      ]
    },

    {
      id: 'R311',
      name: 'Salade Roquette Saumon Fumé Avocat',
      category: 'world-food',
      mealTypes: ['lunch'],
      emoji: '🥗', origin: '🌍',
      tags: ['salade', 'saumon-fumé', 'avocat', 'roquette', 'omega3', 'high-protein', 'quick'],
      servings: 1, prepTime: 10, cookTime: 0, difficulty: 1,
      // 28×4 + 15×4 + 28×9 = 112+60+252 = 424 ✓
      baseNutrition: { calories: 424, proteinGrams: 28, carbsGrams: 15, fatGrams: 28 },
      ingredients: [
        { name: 'Saumon fumé', qty: 100, unit: 'g' },
        { name: 'Roquette', qty: 80, unit: 'g' },
        { name: 'Avocat mûr', qty: 100, unit: 'g', note: '½ gros avocat' },
        { name: 'Câpres', qty: 15, unit: 'g' },
        { name: 'Pain complet (grillé)', qty: 30, unit: 'g' },
        { name: 'Huile d\'olive', qty: 10, unit: 'ml' },
        { name: 'Citron (jus)', qty: 1, unit: 'pce' },
        { name: 'Aneth frais', qty: 5, unit: 'g' }
      ],
      steps: [
        'Griller le pain et le couper en dés pour croûtons.',
        'Couper l\'avocat en lamelles. Arroser d\'un filet de citron.',
        'Disposer la roquette en base du saladier.',
        'Garnir : saumon fumé roulé, lamelles d\'avocat, câpres, croûtons.',
        'Vinaigrette : huile d\'olive + citron + sel. Arroser et parsemer d\'aneth.'
      ]
    },

    {
      id: 'R312',
      name: 'Bowl Poulet Patate Douce Tahini',
      category: 'world-food',
      mealTypes: ['lunch', 'dinner'],
      emoji: '🥣', origin: '🌍',
      tags: ['salade', 'poulet', 'patate-douce', 'pois-chiches', 'tahini', 'high-protein', 'meal-prep'],
      servings: 1, prepTime: 10, cookTime: 25, difficulty: 1,
      // 38×4 + 45×4 + 16×9 = 152+180+144 = 476 ✓
      baseNutrition: { calories: 476, proteinGrams: 38, carbsGrams: 45, fatGrams: 16 },
      ingredients: [
        { name: 'Blanc de poulet', qty: 150, unit: 'g' },
        { name: 'Patate douce', qty: 130, unit: 'g' },
        { name: 'Pois chiches (boîte, égouttés)', qty: 80, unit: 'g' },
        { name: 'Épinards frais', qty: 60, unit: 'g' },
        { name: 'Tahini', qty: 15, unit: 'g' },
        { name: 'Citron (jus)', qty: 1, unit: 'pce' },
        { name: 'Huile d\'olive', qty: 5, unit: 'ml' },
        { name: 'Cumin moulu', qty: 2, unit: 'g' },
        { name: 'Paprika fumé', qty: 2, unit: 'g' }
      ],
      steps: [
        'Préchauffer four à 200 °C. Couper patate douce en dés. Mélanger avec huile + cumin.',
        'Rôtir patate douce et pois chiches sur plaque 20 min.',
        'Griller le poulet assaisonné 5 min par côté. Couper en tranches.',
        'Sauce tahini : tahini + citron + 2 c.à.s d\'eau + sel.',
        'Assembler épinards + patate douce + pois chiches + poulet. Napper de sauce tahini.'
      ]
    },

    {
      id: 'R313',
      name: 'Salade Mexicaine Haricots Avocat',
      category: 'world-food',
      mealTypes: ['lunch'],
      emoji: '🥗', origin: '🌍',
      tags: ['salade', 'haricots-noirs', 'avocat', 'maïs', 'vegetarian', 'high-protein', 'mexican'],
      servings: 1, prepTime: 10, cookTime: 0, difficulty: 1,
      // 20×4 + 55×4 + 14×9 = 80+220+126 = 426 ✓
      baseNutrition: { calories: 426, proteinGrams: 20, carbsGrams: 55, fatGrams: 14 },
      ingredients: [
        { name: 'Haricots noirs (boîte, égouttés)', qty: 150, unit: 'g' },
        { name: 'Maïs doux (boîte, égoutté)', qty: 80, unit: 'g' },
        { name: 'Avocat mûr', qty: 70, unit: 'g', note: '½ avocat' },
        { name: 'Tomate', qty: 100, unit: 'g' },
        { name: 'Oignon rouge', qty: 40, unit: 'g' },
        { name: 'Coriandre fraîche', qty: 15, unit: 'g' },
        { name: 'Citron vert (jus)', qty: 1, unit: 'pce' },
        { name: 'Huile d\'olive', qty: 8, unit: 'ml' },
        { name: 'Cumin moulu', qty: 2, unit: 'g' },
        { name: 'Piment doux', qty: 1, unit: 'g' }
      ],
      steps: [
        'Égoutter et rincer haricots noirs et maïs.',
        'Couper tomate et oignon en petits dés. Écraser grossièrement l\'avocat.',
        'Vinaigrette : citron vert + huile + cumin + piment + sel.',
        'Mélanger haricots + maïs + tomate + oignon + avocat.',
        'Arroser de vinaigrette. Garnir de coriandre fraîche. Servir frais.'
      ]
    },

    {
      id: 'R314',
      name: 'Salade Grecque Crevettes',
      category: 'world-food',
      mealTypes: ['lunch'],
      emoji: '🥗', origin: '🌍',
      tags: ['salade', 'crevettes', 'feta', 'greek', 'high-protein', 'mediterranean'],
      servings: 1, prepTime: 10, cookTime: 5, difficulty: 1,
      // 32×4 + 25×4 + 20×9 = 128+100+180 = 408 ✓
      baseNutrition: { calories: 408, proteinGrams: 32, carbsGrams: 25, fatGrams: 20 },
      ingredients: [
        { name: 'Crevettes décortiquées', qty: 150, unit: 'g' },
        { name: 'Tomate', qty: 120, unit: 'g' },
        { name: 'Concombre', qty: 100, unit: 'g' },
        { name: 'Feta', qty: 50, unit: 'g' },
        { name: 'Olives noires', qty: 25, unit: 'g' },
        { name: 'Pain pita complet', qty: 40, unit: 'g' },
        { name: 'Huile d\'olive', qty: 10, unit: 'ml' },
        { name: 'Origan séché', qty: 2, unit: 'g' },
        { name: 'Citron (jus)', qty: 1, unit: 'pce' }
      ],
      steps: [
        'Faire sauter les crevettes dans une poêle chaude 2-3 min. Réserver.',
        'Couper tomates et concombre en dés. Couper le pita en triangles et griller.',
        'Vinaigrette : huile d\'olive + citron + origan + sel.',
        'Assembler tomates, concombre, olives, crevettes et pita grillé.',
        'Émietter la feta. Arroser de vinaigrette. Servir immédiatement.'
      ]
    },

    {
      id: 'R315',
      name: 'Taboulé Quinoa Pois Chiches',
      category: 'world-food',
      mealTypes: ['lunch', 'dinner'],
      emoji: '🥗', origin: '🌍',
      tags: ['salade', 'quinoa', 'pois-chiches', 'taboulé', 'vegetarian', 'vegan', 'high-protein', 'meal-prep'],
      servings: 1, prepTime: 15, cookTime: 12, difficulty: 1,
      // 22×4 + 55×4 + 14×9 = 88+220+126 = 434 ✓
      baseNutrition: { calories: 434, proteinGrams: 22, carbsGrams: 55, fatGrams: 14 },
      ingredients: [
        { name: 'Quinoa sec', qty: 60, unit: 'g', note: '≈130 g cuit' },
        { name: 'Pois chiches (boîte, égouttés)', qty: 100, unit: 'g' },
        { name: 'Persil frais (bouquet)', qty: 50, unit: 'g' },
        { name: 'Tomate', qty: 100, unit: 'g' },
        { name: 'Concombre', qty: 80, unit: 'g' },
        { name: 'Oignon vert', qty: 20, unit: 'g' },
        { name: 'Huile d\'olive', qty: 12, unit: 'ml' },
        { name: 'Citron (jus)', qty: 1, unit: 'pce' }
      ],
      steps: [
        'Cuire le quinoa dans 120 ml d\'eau salée 12 min. Laisser refroidir.',
        'Hacher finement le persil. Couper tomates, concombre et oignons en petits dés.',
        'Égoutter et rincer les pois chiches.',
        'Mélanger tous les ingrédients dans un saladier.',
        'Assaisonner généreusement : huile d\'olive + citron + sel. Réfrigérer 10 min avant service.'
      ]
    },

    {
      id: 'R316',
      name: 'Salade Thaï Bœuf Grillé',
      category: 'world-food',
      mealTypes: ['lunch'],
      emoji: '🥗', origin: '🇹🇭',
      tags: ['salade', 'boeuf', 'thai', 'high-protein', 'exotic', 'low-carb'],
      servings: 1, prepTime: 15, cookTime: 8, difficulty: 2,
      // 36×4 + 30×4 + 18×9 = 144+120+162 = 426 ✓
      baseNutrition: { calories: 426, proteinGrams: 36, carbsGrams: 30, fatGrams: 18 },
      ingredients: [
        { name: 'Rumsteak de bœuf', qty: 150, unit: 'g' },
        { name: 'Vermicelles de riz', qty: 40, unit: 'g', note: '≈80 g réhydratés' },
        { name: 'Concombre', qty: 80, unit: 'g' },
        { name: 'Carotte', qty: 60, unit: 'g' },
        { name: 'Menthe fraîche', qty: 15, unit: 'g' },
        { name: 'Coriandre fraîche', qty: 10, unit: 'g' },
        { name: 'Sauce soja', qty: 15, unit: 'ml' },
        { name: 'Huile de sésame', qty: 8, unit: 'ml' },
        { name: 'Citron vert (jus)', qty: 1, unit: 'pce' },
        { name: 'Ail', qty: 5, unit: 'g' },
        { name: 'Piment doux', qty: 1, unit: 'g' }
      ],
      steps: [
        'Réhydrater les vermicelles dans l\'eau chaude 5 min. Égoutter et refroidir.',
        'Griller le steak 3-4 min par côté pour rosé. Laisser reposer 2 min. Trancher finement.',
        'Julienner carotte et concombre. Hacher ail.',
        'Sauce : sauce soja + huile sésame + citron vert + ail + piment.',
        'Assembler vermicelles + légumes + bœuf + herbes. Arroser de sauce. Servir frais.'
      ]
    },

    {
      id: 'R317',
      name: 'Bowl Tofu Sésame Riz Brun',
      category: 'world-food',
      mealTypes: ['lunch', 'dinner'],
      emoji: '🥣', origin: '🇯🇵',
      tags: ['salade', 'tofu', 'riz-brun', 'edamame', 'vegetarian', 'vegan', 'high-protein', 'japanese'],
      servings: 1, prepTime: 15, cookTime: 20, difficulty: 1,
      // 28×4 + 50×4 + 18×9 = 112+200+162 = 474 ✓
      baseNutrition: { calories: 474, proteinGrams: 28, carbsGrams: 50, fatGrams: 18 },
      ingredients: [
        { name: 'Tofu ferme', qty: 180, unit: 'g' },
        { name: 'Riz brun', qty: 60, unit: 'g', note: '≈140 g cuit' },
        { name: 'Edamame (surgelé)', qty: 80, unit: 'g' },
        { name: 'Carotte', qty: 60, unit: 'g' },
        { name: 'Sauce soja', qty: 15, unit: 'ml' },
        { name: 'Huile de sésame', qty: 8, unit: 'ml' },
        { name: 'Sésame toasté', qty: 8, unit: 'g' },
        { name: 'Gingembre frais', qty: 5, unit: 'g' },
        { name: 'Citron vert (jus)', qty: 1, unit: 'pce' },
        { name: 'Huile d\'olive', qty: 5, unit: 'ml' }
      ],
      steps: [
        'Cuire le riz brun 18-20 min. Réserver.',
        'Presser le tofu pour enlever l\'eau. Couper en cubes.',
        'Faire dorer le tofu dans l\'huile d\'olive 4 min de chaque côté.',
        'Sauce : sauce soja + huile de sésame + gingembre râpé + citron vert.',
        'Assembler riz + edamame chaud + carotte râpée + tofu. Arroser de sauce. Parsemer sésame.'
      ]
    },

    {
      id: 'R318',
      name: 'Salade Italienne Mozzarella Jambon Dinde',
      category: 'world-food',
      mealTypes: ['lunch'],
      emoji: '🥗', origin: '🇮🇹',
      tags: ['salade', 'mozzarella', 'jambon-dinde', 'italian', 'high-protein', 'quick', 'no-cook'],
      servings: 1, prepTime: 10, cookTime: 0, difficulty: 1,
      // 34×4 + 22×4 + 22×9 = 136+88+198 = 422 ✓
      baseNutrition: { calories: 422, proteinGrams: 34, carbsGrams: 22, fatGrams: 22 },
      ingredients: [
        { name: 'Mozzarella fraîche', qty: 100, unit: 'g' },
        { name: 'Jambon de dinde (tranches)', qty: 80, unit: 'g' },
        { name: 'Tomate', qty: 150, unit: 'g' },
        { name: 'Roquette', qty: 60, unit: 'g' },
        { name: 'Basilic frais', qty: 10, unit: 'g' },
        { name: 'Pain complet (grillé)', qty: 30, unit: 'g' },
        { name: 'Huile d\'olive', qty: 12, unit: 'ml' },
        { name: 'Vinaigre balsamique', qty: 8, unit: 'ml' }
      ],
      steps: [
        'Griller le pain complet et couper en dés.',
        'Couper tomates et mozzarella en tranches. Rouler les tranches de dinde.',
        'Disposer la roquette en base du plat.',
        'Alterner tranches de tomate, mozzarella et dinde roulée.',
        'Arroser d\'huile d\'olive + balsamique. Garnir de basilic et croûtons.'
      ]
    },

    {
      id: 'R319',
      name: 'Salade Épinards Œufs Pochés Lardons Dinde',
      category: 'world-food',
      mealTypes: ['breakfast'],
      emoji: '🥗', origin: '🇫🇷',
      tags: ['salade', 'épinards', 'oeufs', 'lardons-dinde', 'high-protein', 'french', 'brunch'],
      servings: 1, prepTime: 10, cookTime: 10, difficulty: 2,
      // 32×4 + 25×4 + 22×9 = 128+100+198 = 426 ✓
      baseNutrition: { calories: 426, proteinGrams: 32, carbsGrams: 25, fatGrams: 22 },
      ingredients: [
        { name: 'Épinards frais', qty: 120, unit: 'g' },
        { name: 'Œuf', qty: 2, unit: 'pce' },
        { name: 'Lardons de dinde fumée', qty: 80, unit: 'g' },
        { name: 'Champignons de Paris', qty: 100, unit: 'g' },
        { name: 'Pain complet (croûtons)', qty: 30, unit: 'g' },
        { name: 'Huile d\'olive', qty: 8, unit: 'ml' },
        { name: 'Vinaigre blanc', qty: 10, unit: 'ml', note: 'pour pochage' },
        { name: 'Moutarde', qty: 5, unit: 'g' },
        { name: 'Vinaigre balsamique', qty: 5, unit: 'ml' }
      ],
      steps: [
        'Faire revenir les lardons de dinde 3 min. Ajouter champignons émincés. Cuire 3 min.',
        'Griller le pain et couper en dés pour croûtons.',
        'Porter à ébullition de l\'eau vinaigrée. Former un tourbillon. Pocher les œufs 3 min.',
        'Vinaigrette : huile + balsamique + moutarde + sel.',
        'Assembler épinards + champignons + lardons + croûtons. Poser les œufs pochés dessus.',
        'Arroser de vinaigrette. Servir immédiatement.'
      ]
    },

    {
      id: 'R320',
      name: 'Bowl Méditerranéen Falafel Houmous',
      category: 'maroc-moderne',
      mealTypes: ['lunch', 'dinner'],
      emoji: '🥙', origin: '🇲🇦',
      tags: ['salade', 'falafel', 'houmous', 'riz-brun', 'vegetarian', 'vegan', 'high-protein', 'oriental'],
      servings: 1, prepTime: 10, cookTime: 20, difficulty: 1,
      // 22×4 + 55×4 + 18×9 = 88+220+162 = 470 ✓
      baseNutrition: { calories: 470, proteinGrams: 22, carbsGrams: 55, fatGrams: 18 },
      ingredients: [
        { name: 'Falafel (prêt-à-cuire, surgelé)', qty: 120, unit: 'g', note: '4-5 falafels' },
        { name: 'Riz brun', qty: 50, unit: 'g', note: '≈110 g cuit' },
        { name: 'Houmous', qty: 60, unit: 'g' },
        { name: 'Concombre', qty: 80, unit: 'g' },
        { name: 'Tomate', qty: 80, unit: 'g' },
        { name: 'Oignon rouge', qty: 30, unit: 'g' },
        { name: 'Citron (jus)', qty: 1, unit: 'pce' },
        { name: 'Huile d\'olive', qty: 5, unit: 'ml' },
        { name: 'Persil frais', qty: 10, unit: 'g' },
        { name: 'Cumin moulu', qty: 1, unit: 'g' }
      ],
      steps: [
        'Cuire les falafels au four 200 °C pendant 15-18 min selon emballage.',
        'Cuire le riz brun 18-20 min. Laisser tiédir.',
        'Couper concombre, tomate et oignon en petits dés.',
        'Assembler le bowl : riz brun en base, houmous d\'un côté, légumes de l\'autre.',
        'Disposer les falafels chauds. Arroser citron + huile. Garnir de persil et cumin.'
      ]
    },
    {
      id: 'R321',
      name: 'Açaí Bowl',
      emoji: '🥣', origin: '🇧🇷',
      mealTypes: ['breakfast'],
      tags: ['acai', 'smoothie-bowl', 'antioxydants', 'tendance', 'vegan'],
      difficulty: 1, prepTime: 10, cookTime: 0, servings: 1,
      // 11×4 + 63×4 + 12×9 = 44+252+108 = 404 ✓
      baseNutrition: { calories: 404, proteinGrams: 11, carbsGrams: 63, fatGrams: 12 },
      ingredients: [
        { name: 'Açaí en poudre', qty: 20, unit: 'g' },
        { name: 'Banane', qty: 120, unit: 'g' },
        { name: 'Granola', qty: 40, unit: 'g' },
        { name: 'Fruits rouges', qty: 80, unit: 'g' },
        { name: 'Miel', qty: 10, unit: 'g' },
        { name: "Lait d'amande", qty: 100, unit: 'ml' }
      ],
      steps: [
        "Mixer l'açaí en poudre avec la banane et le lait d'amande jusqu'à consistance épaisse.",
        'Verser dans un bol.',
        'Garnir de granola, fruits rouges et miel.'
      ]
    },
    {
      id: 'R322',
      name: 'Egg Muffins Protéinés',
      emoji: '🥚', origin: '🇺🇸',
      mealTypes: ['breakfast'],
      tags: ['oeufs', 'high-protein', 'meal-prep', 'low-carb', 'gluten-free'],
      difficulty: 1, prepTime: 10, cookTime: 20, servings: 1,
      // 28×4 + 8×4 + 18×9 = 112+32+162 = 306 ✓
      baseNutrition: { calories: 306, proteinGrams: 28, carbsGrams: 8, fatGrams: 18 },
      ingredients: [
        { name: 'Œuf', qty: 3, unit: 'pce' },
        { name: 'Épinards frais', qty: 40, unit: 'g' },
        { name: 'Fromage râpé', qty: 20, unit: 'g' },
        { name: 'Jambon de dinde (tranches)', qty: 40, unit: 'g' },
        { name: 'Tomate', qty: 40, unit: 'g' }
      ],
      steps: [
        'Préchauffer le four à 180 °C. Huiler légèrement un moule à muffins.',
        'Battre les œufs. Ajouter épinards hachés, fromage, dinde et tomates en dés.',
        'Verser dans les moules. Cuire 18-20 min jusqu\'à ce que les œufs soient pris.'
      ]
    },
    {
      id: 'R323',
      name: 'Chia Pudding Mangue Coco',
      emoji: '🥭', origin: '🇹🇭',
      mealTypes: ['breakfast', 'snack'],
      tags: ['chia', 'vegan', 'no-cook', 'meal-prep', 'tropical'],
      difficulty: 1, prepTime: 5, cookTime: 0, servings: 1,
      // 8×4 + 44×4 + 13×9 = 32+176+117 = 325 ✓
      baseNutrition: { calories: 325, proteinGrams: 8, carbsGrams: 44, fatGrams: 13 },
      ingredients: [
        { name: 'Graines de chia', qty: 30, unit: 'g' },
        { name: 'Lait de coco (brique)', qty: 200, unit: 'ml' },
        { name: 'Mangue (fraîche)', qty: 100, unit: 'g' },
        { name: 'Miel', qty: 10, unit: 'g' }
      ],
      steps: [
        'Mélanger les graines de chia avec le lait de coco et le miel.',
        'Réfrigérer au moins 4h ou toute la nuit.',
        'Servir avec la mangue coupée en dés.'
      ]
    },
    {
      id: 'R324',
      name: 'Smoothie Bowl Green',
      emoji: '🥬', origin: '🇦🇺',
      mealTypes: ['breakfast'],
      tags: ['smoothie-bowl', 'green', 'detox', 'vegan', 'tendance'],
      difficulty: 1, prepTime: 8, cookTime: 0, servings: 1,
      // 9×4 + 58×4 + 8×9 = 36+232+72 = 340 ✓
      baseNutrition: { calories: 340, proteinGrams: 9, carbsGrams: 58, fatGrams: 8 },
      ingredients: [
        { name: 'Épinards frais', qty: 60, unit: 'g' },
        { name: 'Banane', qty: 120, unit: 'g' },
        { name: "Lait d'amande", qty: 100, unit: 'ml' },
        { name: 'Kiwi', qty: 1, unit: 'pce' },
        { name: 'Granola', qty: 30, unit: 'g' },
        { name: 'Graines de chia', qty: 10, unit: 'g' }
      ],
      steps: [
        'Mixer épinards, banane et lait végétal jusqu\'à texture épaisse et lisse.',
        'Verser dans un bol.',
        'Garnir de kiwi tranché, granola et graines de chia.'
      ]
    },
    {
      id: 'R325',
      name: 'Toast Avocat Saumon Fumé',
      emoji: '🥑', origin: '🇺🇸',
      mealTypes: ['breakfast'],
      tags: ['avocat', 'saumon', 'healthy-fats', 'high-protein', 'tendance'],
      difficulty: 1, prepTime: 8, cookTime: 0, servings: 1,
      // 22×4 + 30×4 + 20×9 = 88+120+180 = 388 ✓
      baseNutrition: { calories: 388, proteinGrams: 22, carbsGrams: 30, fatGrams: 20 },
      ingredients: [
        { name: 'Pain complet', qty: 2, unit: 'pce' },
        { name: 'Avocat', qty: 80, unit: 'g' },
        { name: 'Saumon fumé', qty: 60, unit: 'g' },
        { name: 'Citron (pce)', qty: 0.5, unit: 'pce' },
        { name: 'Câpres', qty: 10, unit: 'g' },
        { name: 'Aneth (frais ou séché)', qty: 3, unit: 'g' }
      ],
      steps: [
        'Griller le pain complet.',
        "Écraser l'avocat avec le jus de citron, sel et poivre.",
        'Étaler sur le pain, déposer le saumon fumé, câpres et aneth.'
      ]
    },
    {
      id: 'R326',
      name: 'Pancakes Protéinés Myrtilles',
      emoji: '🥞', origin: '🇺🇸',
      mealTypes: ['breakfast'],
      tags: ['pancakes', 'high-protein', 'myrtilles', 'brunch', 'tendance'],
      difficulty: 1, prepTime: 10, cookTime: 15, servings: 1,
      // 24×4 + 52×4 + 10×9 = 96+208+90 = 394 ✓
      baseNutrition: { calories: 394, proteinGrams: 24, carbsGrams: 52, fatGrams: 10 },
      ingredients: [
        { name: 'Flocons d\'avoine', qty: 60, unit: 'g' },
        { name: 'Banane', qty: 80, unit: 'g' },
        { name: 'Œuf', qty: 2, unit: 'pce' },
        { name: 'Myrtilles', qty: 60, unit: 'g' },
        { name: 'Sirop d\'érable', qty: 15, unit: 'ml' }
      ],
      steps: [
        'Mixer les flocons avec la banane et les œufs pour former une pâte.',
        'Cuire à la poêle anti-adhésive 2-3 min par face.',
        'Servir avec myrtilles fraîches et sirop d\'érable.'
      ]
    },
    {
      id: 'R327',
      name: 'Skyr Fruits Rouges & Noix',
      emoji: '🍓', origin: '🇮🇸',
      mealTypes: ['breakfast', 'snack'],
      tags: ['skyr', 'high-protein', 'fruits-rouges', 'low-fat', 'nordique'],
      difficulty: 1, prepTime: 5, cookTime: 0, servings: 1,
      // 20×4 + 30×4 + 9×9 = 80+120+81 = 281 ✓
      baseNutrition: { calories: 281, proteinGrams: 20, carbsGrams: 30, fatGrams: 9 },
      ingredients: [
        { name: 'Skyr / Yaourt islandais', qty: 180, unit: 'g' },
        { name: 'Fraises', qty: 80, unit: 'g' },
        { name: 'Framboises', qty: 50, unit: 'g' },
        { name: 'Noix', qty: 20, unit: 'g' },
        { name: 'Miel', qty: 10, unit: 'g' }
      ],
      steps: [
        'Verser le skyr dans un bol.',
        'Déposer les fruits rouges et les noix concassées.',
        'Arroser de miel.'
      ]
    },
    {
      id: 'R328',
      name: 'Œufs Brouillés Champignons',
      emoji: '🍄', origin: '🇫🇷',
      mealTypes: ['breakfast'],
      tags: ['oeufs', 'champignons', 'french', 'high-protein', 'low-carb'],
      difficulty: 1, prepTime: 5, cookTime: 8, servings: 1,
      // 22×4 + 6×4 + 16×9 = 88+24+144 = 256 ✓
      baseNutrition: { calories: 256, proteinGrams: 22, carbsGrams: 6, fatGrams: 16 },
      ingredients: [
        { name: 'Œuf', qty: 3, unit: 'pce' },
        { name: 'Champignons de Paris', qty: 100, unit: 'g' },
        { name: 'Fromage frais (type St Moret)', qty: 30, unit: 'g' },
        { name: 'Huile d\'olive', qty: 5, unit: 'ml' },
        { name: 'Persil frais', qty: 5, unit: 'g' }
      ],
      steps: [
        'Faire revenir les champignons émincés dans l\'huile 3 min.',
        'Battre les œufs, verser sur les champignons à feu doux.',
        'Remuer doucement pour des œufs crémeux. Finir avec le fromage frais et le persil.'
      ]
    },
    {
      id: 'R329',
      name: 'Bowl Quinoa Fruité du Matin',
      emoji: '🌅', origin: '🇺🇸',
      mealTypes: ['breakfast'],
      tags: ['quinoa', 'fruits', 'vegan', 'meal-prep', 'healthy'],
      difficulty: 1, prepTime: 5, cookTime: 15, servings: 1,
      // 14×4 + 58×4 + 10×9 = 56+232+90 = 378 ✓
      baseNutrition: { calories: 378, proteinGrams: 14, carbsGrams: 58, fatGrams: 10 },
      ingredients: [
        { name: 'Quinoa', qty: 60, unit: 'g' },
        { name: "Lait d'amande", qty: 150, unit: 'ml' },
        { name: 'Banane', qty: 80, unit: 'g' },
        { name: 'Pêche', qty: 1, unit: 'pce' },
        { name: 'Amandes effilées', qty: 15, unit: 'g' },
        { name: 'Cannelle', qty: 2, unit: 'g' }
      ],
      steps: [
        'Cuire le quinoa dans le lait d\'amande 12 min à feu doux.',
        'Laisser tiédir légèrement.',
        'Garnir de banane tranchée, pêche, amandes et cannelle.'
      ]
    },
    {
      id: 'R330',
      name: 'Galettes Sarrasin Œuf & Avocat',
      emoji: '🫓', origin: '🇫🇷',
      mealTypes: ['breakfast'],
      tags: ['sarrasin', 'gluten-free', 'oeufs', 'avocat', 'french'],
      difficulty: 2, prepTime: 10, cookTime: 10, servings: 1,
      // 18×4 + 34×4 + 18×9 = 72+136+162 = 370 ✓
      baseNutrition: { calories: 370, proteinGrams: 18, carbsGrams: 34, fatGrams: 18 },
      ingredients: [
        { name: 'Farine de sarrasin', qty: 60, unit: 'g' },
        { name: 'Œuf', qty: 2, unit: 'pce' },
        { name: 'Avocat', qty: 60, unit: 'g' },
        { name: 'Épinards frais', qty: 40, unit: 'g' },
        { name: 'Huile d\'olive', qty: 5, unit: 'ml' }
      ],
      steps: [
        'Mélanger la farine avec 150ml d\'eau, une pincée de sel. Laisser reposer 30 min.',
        'Cuire les galettes dans une poêle huilée. Casser un œuf au centre, plier.',
        'Servir avec avocat écrasé et épinards frais.'
      ]
    },
    {
      id: 'R331',
      name: 'Poke Bowl Saumon',
      emoji: '🐟', origin: '🇺🇸',
      mealTypes: ['lunch'],
      tags: ['poke', 'saumon', 'japonais', 'bowl', 'tendance', 'high-protein'],
      difficulty: 2, prepTime: 15, cookTime: 15, servings: 1,
      // 35×4 + 52×4 + 16×9 = 140+208+144 = 492 ✓
      baseNutrition: { calories: 492, proteinGrams: 35, carbsGrams: 52, fatGrams: 16 },
      ingredients: [
        { name: 'Riz blanc', qty: 80, unit: 'g' },
        { name: 'Saumon frais (filet)', qty: 120, unit: 'g' },
        { name: 'Avocat', qty: 60, unit: 'g' },
        { name: 'Concombre', qty: 60, unit: 'g' },
        { name: 'Edamame (surgelé)', qty: 40, unit: 'g' },
        { name: 'Sauce soja', qty: 15, unit: 'ml' },
        { name: 'Huile de sésame', qty: 5, unit: 'ml' },
        { name: 'Sésame (graines)', qty: 5, unit: 'g' }
      ],
      steps: [
        'Cuire le riz. Rincer le saumon, couper en dés, mariner 10 min sauce soja + huile sésame.',
        'Cuire les edamames surgelés 3 min à l\'eau bouillante.',
        'Assembler : riz en base, saumon, avocat, concombre, edamame. Parsemer de sésame.'
      ]
    },
    {
      id: 'R332',
      name: 'Bao Bun Poulet Teriyaki',
      emoji: '🫔', origin: '🇯🇵',
      mealTypes: ['lunch'],
      tags: ['bao', 'poulet', 'teriyaki', 'japonais', 'tendance', 'street-food'],
      difficulty: 2, prepTime: 10, cookTime: 15, servings: 1,
      // 36×4 + 48×4 + 12×9 = 144+192+108 = 444 ✓
      baseNutrition: { calories: 444, proteinGrams: 36, carbsGrams: 48, fatGrams: 12 },
      ingredients: [
        { name: 'Blanc de poulet', qty: 130, unit: 'g' },
        { name: 'Pain vapeur bao (surgelé)', qty: 2, unit: 'pce' },
        { name: 'Sauce teriyaki', qty: 30, unit: 'ml' },
        { name: 'Concombre', qty: 60, unit: 'g' },
        { name: 'Sésame (graines)', qty: 5, unit: 'g' }
      ],
      steps: [
        'Cuire le poulet en lanières à la poêle. Verser la sauce teriyaki, caraméliser 2 min.',
        'Réchauffer les bao vapeur (cuiseur vapeur ou micro-ondes 45 sec).',
        'Garnir les bao de poulet teriyaki, concombre et sésame.'
      ]
    },
    {
      id: 'R333',
      name: 'Bibimbap Bœuf',
      emoji: '🍚', origin: '🇰🇷',
      mealTypes: ['lunch', 'dinner'],
      tags: ['coréen', 'bibimbap', 'boeuf', 'bowl', 'tendance', 'high-protein'],
      difficulty: 2, prepTime: 15, cookTime: 20, servings: 1,
      // 38×4 + 58×4 + 14×9 = 152+232+126 = 510 ✓
      baseNutrition: { calories: 510, proteinGrams: 38, carbsGrams: 58, fatGrams: 14 },
      ingredients: [
        { name: 'Riz blanc', qty: 80, unit: 'g' },
        { name: 'Bœuf maigre haché', qty: 120, unit: 'g' },
        { name: 'Courgette', qty: 80, unit: 'g' },
        { name: 'Carotte', qty: 60, unit: 'g' },
        { name: 'Épinards frais', qty: 60, unit: 'g' },
        { name: 'Œuf', qty: 1, unit: 'pce' },
        { name: 'Sauce soja', qty: 15, unit: 'ml' },
        { name: 'Huile de sésame', qty: 5, unit: 'ml' },
        { name: 'Gochujang (pâte pimentée coréenne)', qty: 10, unit: 'g' }
      ],
      steps: [
        'Cuire le riz. Faire revenir le bœuf haché avec sauce soja et ail. Réserver.',
        'Sauter séparément courgette, carotte et épinards avec un filet d\'huile de sésame.',
        'Assembler le bowl : riz en base, légumes et bœuf disposés en secteurs, œuf au plat au centre, gochujang sur le dessus.'
      ]
    },
    {
      id: 'R334',
      name: 'Banh Mi Bowl Poulet',
      emoji: '🥢', origin: '🇻🇳',
      mealTypes: ['lunch'],
      tags: ['vietnamien', 'poulet', 'bowl', 'tendance', 'fresh', 'high-protein'],
      difficulty: 2, prepTime: 15, cookTime: 15, servings: 1,
      // 38×4 + 50×4 + 11×9 = 152+200+99 = 451 ✓
      baseNutrition: { calories: 451, proteinGrams: 38, carbsGrams: 50, fatGrams: 11 },
      ingredients: [
        { name: 'Blanc de poulet', qty: 130, unit: 'g' },
        { name: 'Riz jasmin', qty: 70, unit: 'g' },
        { name: 'Carotte', qty: 60, unit: 'g' },
        { name: 'Concombre', qty: 60, unit: 'g' },
        { name: 'Sauce soja', qty: 15, unit: 'ml' },
        { name: 'Sriracha', qty: 5, unit: 'ml' },
        { name: 'Citron (pce)', qty: 0.5, unit: 'pce' },
        { name: 'Coriandre fraîche', qty: 1, unit: 'pce' }
      ],
      steps: [
        'Cuire le riz jasmin. Griller le poulet assaisonné sel/poivre/citron.',
        'Couper carottes et concombre en julienne. Mariner 5 min dans jus de citron + sel.',
        'Assembler : riz, poulet, légumes marinés, coriandre, sauce soja + sriracha.'
      ]
    },
    {
      id: 'R335',
      name: 'Buddha Bowl Tofu & Greens',
      emoji: '🧘', origin: '🇺🇸',
      mealTypes: ['lunch'],
      tags: ['vegan', 'tofu', 'bowl', 'healthy', 'tendance', 'high-fiber'],
      difficulty: 2, prepTime: 15, cookTime: 20, servings: 1,
      // 22×4 + 50×4 + 16×9 = 88+200+144 = 432 ✓
      baseNutrition: { calories: 432, proteinGrams: 22, carbsGrams: 50, fatGrams: 16 },
      ingredients: [
        { name: 'Tofu ferme', qty: 150, unit: 'g' },
        { name: 'Quinoa', qty: 60, unit: 'g' },
        { name: 'Patate douce', qty: 100, unit: 'g' },
        { name: 'Épinards frais', qty: 60, unit: 'g' },
        { name: 'Graines de tournesol', qty: 15, unit: 'g' },
        { name: 'Tahini', qty: 20, unit: 'g' },
        { name: 'Citron (pce)', qty: 0.5, unit: 'pce' }
      ],
      steps: [
        'Cuire le quinoa. Rôtir la patate douce en cubes au four 200°C / 20 min.',
        'Couper le tofu en cubes, dorer à la poêle avec sel et paprika.',
        'Sauce tahini : mélanger tahini + jus citron + 2cs eau.',
        'Assembler : quinoa, épinards, patate douce, tofu, graines, sauce tahini.'
      ]
    },
    {
      id: 'R336',
      name: 'Wrap Méditerranéen Halloumi',
      emoji: '🫙', origin: '🇬🇷',
      mealTypes: ['lunch'],
      tags: ['halloumi', 'méditerranéen', 'wrap', 'végétarien', 'tendance'],
      difficulty: 1, prepTime: 10, cookTime: 8, servings: 1,
      // 26×4 + 38×4 + 18×9 = 104+152+162 = 418 ✓
      baseNutrition: { calories: 418, proteinGrams: 26, carbsGrams: 38, fatGrams: 18 },
      ingredients: [
        { name: 'Tortilla de blé', qty: 1, unit: 'pce' },
        { name: 'Halloumi', qty: 80, unit: 'g' },
        { name: 'Houmous', qty: 40, unit: 'g' },
        { name: 'Tomates cerises', qty: 60, unit: 'g' },
        { name: 'Roquette', qty: 30, unit: 'g' },
        { name: 'Citron (pce)', qty: 0.5, unit: 'pce' }
      ],
      steps: [
        'Griller le halloumi à la poêle sèche 2-3 min par face jusqu\'à coloration dorée.',
        'Réchauffer la tortilla. Étaler le houmous.',
        'Garnir de halloumi, tomates cerises, roquette, jus de citron. Rouler.'
      ]
    },
    {
      id: 'R337',
      name: 'Ramen Poulet Low-Carb',
      emoji: '🍜', origin: '🇯🇵',
      mealTypes: ['lunch', 'dinner'],
      tags: ['ramen', 'poulet', 'japonais', 'low-carb', 'réconfortant'],
      difficulty: 2, prepTime: 10, cookTime: 20, servings: 1,
      // 38×4 + 22×4 + 12×9 = 152+88+108 = 348 ✓
      baseNutrition: { calories: 348, proteinGrams: 38, carbsGrams: 22, fatGrams: 12 },
      ingredients: [
        { name: 'Blanc de poulet', qty: 130, unit: 'g' },
        { name: 'Bouillon de poulet (cube)', qty: 1, unit: 'pce' },
        { name: 'Pâte miso', qty: 20, unit: 'g' },
        { name: 'Œuf', qty: 1, unit: 'pce' },
        { name: 'Courgette', qty: 150, unit: 'g' },
        { name: 'Nori (feuilles d\'algue)', qty: 5, unit: 'g' },
        { name: 'Sauce soja', qty: 10, unit: 'ml' }
      ],
      steps: [
        'Porter 500ml d\'eau à ébullition avec le cube de bouillon. Dissoudre le miso.',
        'Cuire le poulet en lanières dans le bouillon 8 min.',
        'Couper la courgette en spirales (zoodles). Cuire l\'œuf mollet 7 min.',
        'Servir : bouillon + poulet + zoodles + œuf coupé + nori.'
      ]
    },
    {
      id: 'R338',
      name: 'Pad Thaï Crevettes',
      emoji: '🦐', origin: '🇹🇭',
      mealTypes: ['lunch', 'dinner'],
      tags: ['thaï', 'crevettes', 'nouilles', 'tendance', 'asian', 'high-protein'],
      difficulty: 2, prepTime: 15, cookTime: 15, servings: 1,
      // 32×4 + 48×4 + 14×9 = 128+192+126 = 446 ✓
      baseNutrition: { calories: 446, proteinGrams: 32, carbsGrams: 48, fatGrams: 14 },
      ingredients: [
        { name: 'Nouilles de riz', qty: 80, unit: 'g' },
        { name: 'Crevettes décortiquées', qty: 120, unit: 'g' },
        { name: 'Œuf', qty: 1, unit: 'pce' },
        { name: 'Sauce soja', qty: 15, unit: 'ml' },
        { name: 'Sauce nuoc-mâm (fish sauce)', qty: 10, unit: 'ml' },
        { name: 'Beurre de cacahuète', qty: 15, unit: 'g' },
        { name: 'Citron (pce)', qty: 0.5, unit: 'pce' },
        { name: 'Sésame (graines)', qty: 5, unit: 'g' }
      ],
      steps: [
        'Faire tremper les nouilles de riz 8 min dans l\'eau chaude. Égoutter.',
        'Sauter les crevettes à feu vif 2 min. Pousser sur le côté, brouiller l\'œuf.',
        'Ajouter les nouilles, sauce soja, fish sauce, beurre de cacahuète. Mélanger. Finir avec citron et sésame.'
      ]
    },
    {
      id: 'R339',
      name: 'Bowl Falafel Taboulé Moderne',
      emoji: '🧆', origin: '🇱🇧',
      mealTypes: ['lunch'],
      tags: ['falafel', 'libanais', 'végétarien', 'bowl', 'moyen-orient', 'tendance'],
      difficulty: 2, prepTime: 10, cookTime: 20, servings: 1,
      // 22×4 + 55×4 + 16×9 = 88+220+144 = 452 ✓
      baseNutrition: { calories: 452, proteinGrams: 22, carbsGrams: 55, fatGrams: 16 },
      ingredients: [
        { name: 'Falafel surgelé', qty: 120, unit: 'g' },
        { name: 'Quinoa', qty: 60, unit: 'g' },
        { name: 'Tomate', qty: 80, unit: 'g' },
        { name: 'Concombre', qty: 60, unit: 'g' },
        { name: 'Persil frais', qty: 1, unit: 'pce' },
        { name: 'Houmous', qty: 50, unit: 'g' },
        { name: 'Citron (pce)', qty: 0.5, unit: 'pce' },
        { name: 'Huile d\'olive', qty: 8, unit: 'ml' }
      ],
      steps: [
        'Cuire les falafels au four 200°C / 18 min. Cuire le quinoa.',
        'Taboulé : mélanger quinoa, tomates et concombre en dés, persil haché, citron, huile.',
        'Assembler : taboulé quinoa, houmous, falafels dorés.'
      ]
    },
    {
      id: 'R340',
      name: 'Soba Bowl Thon',
      emoji: '🍣', origin: '🇯🇵',
      mealTypes: ['lunch'],
      tags: ['soba', 'thon', 'japonais', 'bowl', 'high-protein', 'tendance'],
      difficulty: 1, prepTime: 10, cookTime: 8, servings: 1,
      // 34×4 + 46×4 + 10×9 = 136+184+90 = 410 ✓
      baseNutrition: { calories: 410, proteinGrams: 34, carbsGrams: 46, fatGrams: 10 },
      ingredients: [
        { name: 'Nouilles soba', qty: 80, unit: 'g' },
        { name: 'Thon au naturel (boîte)', qty: 120, unit: 'g' },
        { name: 'Concombre', qty: 80, unit: 'g' },
        { name: 'Avocat', qty: 50, unit: 'g' },
        { name: 'Sauce soja', qty: 15, unit: 'ml' },
        { name: 'Huile de sésame', qty: 5, unit: 'ml' },
        { name: 'Sésame (graines)', qty: 5, unit: 'g' }
      ],
      steps: [
        'Cuire les soba 4-5 min. Rincer à l\'eau froide.',
        'Égoutter le thon.',
        'Assembler : soba, thon, concombre en rondelles, avocat. Sauce soja + huile sésame. Parsemer de sésame.'
      ]
    },
    {
      id: 'R341',
      name: 'Grain Bowl Lentilles & Halloumi',
      emoji: '🫘', origin: '🇲🇪',
      mealTypes: ['lunch'],
      tags: ['lentilles', 'halloumi', 'végétarien', 'bowl', 'méditerranéen', 'high-protein'],
      difficulty: 2, prepTime: 10, cookTime: 20, servings: 1,
      // 28×4 + 50×4 + 18×9 = 112+200+162 = 474 ✓
      baseNutrition: { calories: 474, proteinGrams: 28, carbsGrams: 50, fatGrams: 18 },
      ingredients: [
        { name: 'Lentilles vertes sèches', qty: 70, unit: 'g' },
        { name: 'Halloumi', qty: 80, unit: 'g' },
        { name: 'Épinards frais', qty: 60, unit: 'g' },
        { name: 'Tomate', qty: 80, unit: 'g' },
        { name: 'Huile d\'olive', qty: 10, unit: 'ml' },
        { name: 'Citron (pce)', qty: 0.5, unit: 'pce' },
        { name: 'Cumin moulu', qty: 2, unit: 'g' }
      ],
      steps: [
        'Cuire les lentilles 20 min dans l\'eau salée. Égoutter.',
        'Griller le halloumi à la poêle sèche 2 min par face.',
        'Mélanger lentilles, épinards, tomate. Assaisonner huile + citron + cumin.',
        'Disposer le halloumi grillé sur le bowl.'
      ]
    },
    {
      id: 'R342',
      name: 'Taco Bowl Poulet Épicé',
      emoji: '🌮', origin: '🇲🇽',
      mealTypes: ['lunch', 'dinner'],
      tags: ['mexicain', 'poulet', 'bowl', 'épicé', 'tendance', 'high-protein'],
      difficulty: 1, prepTime: 10, cookTime: 15, servings: 1,
      // 40×4 + 52×4 + 12×9 = 160+208+108 = 476 ✓
      baseNutrition: { calories: 476, proteinGrams: 40, carbsGrams: 52, fatGrams: 12 },
      ingredients: [
        { name: 'Blanc de poulet', qty: 140, unit: 'g' },
        { name: 'Riz blanc', qty: 70, unit: 'g' },
        { name: 'Maïs doux boîte', qty: 60, unit: 'g' },
        { name: 'Haricots noirs égouttés', qty: 60, unit: 'g' },
        { name: 'Tomate', qty: 80, unit: 'g' },
        { name: 'Avocat', qty: 40, unit: 'g' },
        { name: 'Paprika fumé', qty: 3, unit: 'g' },
        { name: 'Cumin moulu', qty: 2, unit: 'g' }
      ],
      steps: [
        'Cuire le riz. Assaisonner le poulet avec paprika + cumin + sel. Cuire à la poêle.',
        'Couper le poulet en lanières.',
        'Assembler : riz, poulet épicé, maïs, haricots noirs, tomates, avocat.'
      ]
    },
    {
      id: 'R343',
      name: 'Burrito Bowl Bœuf',
      emoji: '🌯', origin: '🇲🇽',
      mealTypes: ['lunch', 'dinner'],
      tags: ['mexicain', 'boeuf', 'bowl', 'tendance', 'high-protein', 'hearty'],
      difficulty: 2, prepTime: 10, cookTime: 15, servings: 1,
      // 38×4 + 54×4 + 16×9 = 152+216+144 = 512 ✓
      baseNutrition: { calories: 512, proteinGrams: 38, carbsGrams: 54, fatGrams: 16 },
      ingredients: [
        { name: 'Bœuf maigre haché', qty: 130, unit: 'g' },
        { name: 'Riz blanc', qty: 70, unit: 'g' },
        { name: 'Haricots noirs égouttés', qty: 60, unit: 'g' },
        { name: 'Poivron rouge', qty: 80, unit: 'g' },
        { name: 'Oignon', qty: 50, unit: 'g' },
        { name: 'Tomate', qty: 80, unit: 'g' },
        { name: 'Cumin moulu', qty: 2, unit: 'g' },
        { name: 'Paprika fumé', qty: 2, unit: 'g' },
        { name: 'Huile d\'olive', qty: 5, unit: 'ml' }
      ],
      steps: [
        'Cuire le riz. Faire revenir oignon et poivron à la poêle.',
        'Ajouter le bœuf haché + épices. Cuire 8 min.',
        'Assembler : riz, bœuf épicé, haricots, poivrons, tomates.'
      ]
    },
    {
      id: 'R344',
      name: 'Chirashi Saumon',
      emoji: '🍱', origin: '🇯🇵',
      mealTypes: ['lunch'],
      tags: ['japonais', 'saumon', 'riz', 'chirashi', 'tendance', 'fresh'],
      difficulty: 2, prepTime: 15, cookTime: 15, servings: 1,
      // 32×4 + 52×4 + 14×9 = 128+208+126 = 462 ✓
      baseNutrition: { calories: 462, proteinGrams: 32, carbsGrams: 52, fatGrams: 14 },
      ingredients: [
        { name: 'Riz blanc', qty: 80, unit: 'g' },
        { name: 'Vinaigre de riz', qty: 15, unit: 'ml' },
        { name: 'Saumon frais (filet)', qty: 110, unit: 'g' },
        { name: 'Avocat', qty: 50, unit: 'g' },
        { name: 'Concombre', qty: 60, unit: 'g' },
        { name: 'Sauce soja', qty: 10, unit: 'ml' },
        { name: 'Sésame (graines)', qty: 5, unit: 'g' }
      ],
      steps: [
        'Cuire le riz. Tiédir et assaisonner avec vinaigre de riz + sel.',
        'Couper saumon, avocat et concombre en tranches fines.',
        'Disposer harmonieusement sur le riz. Sésame + sauce soja en accompagnement.'
      ]
    },
    {
      id: 'R345',
      name: 'Green Goddess Bowl Poulet',
      emoji: '💚', origin: '🇺🇸',
      mealTypes: ['lunch'],
      tags: ['green', 'poulet', 'bowl', 'tendance', 'fresh', 'high-protein'],
      difficulty: 1, prepTime: 15, cookTime: 12, servings: 1,
      // 42×4 + 44×4 + 14×9 = 168+176+126 = 470 ✓
      baseNutrition: { calories: 470, proteinGrams: 42, carbsGrams: 44, fatGrams: 14 },
      ingredients: [
        { name: 'Blanc de poulet', qty: 140, unit: 'g' },
        { name: 'Quinoa', qty: 60, unit: 'g' },
        { name: 'Avocat', qty: 50, unit: 'g' },
        { name: 'Concombre', qty: 80, unit: 'g' },
        { name: 'Edamame (surgelé)', qty: 60, unit: 'g' },
        { name: 'Tahini', qty: 20, unit: 'g' },
        { name: 'Citron (pce)', qty: 0.5, unit: 'pce' },
        { name: 'Persil frais', qty: 1, unit: 'pce' }
      ],
      steps: [
        'Cuire le quinoa et les edamames. Griller le poulet assaisonné.',
        'Sauce green goddess : mixer tahini + citron + persil + 2cs eau.',
        'Assembler : quinoa, poulet, avocat, concombre, edamame. Napper de sauce verte.'
      ]
    },
    {
      id: 'R346',
      name: 'Saumon Miso Glacé',
      emoji: '🐠', origin: '🇯🇵',
      mealTypes: ['dinner'],
      tags: ['saumon', 'miso', 'japonais', 'tendance', 'high-protein', 'omega3'],
      difficulty: 2, prepTime: 10, cookTime: 15, servings: 1,
      // 38×4 + 42×4 + 16×9 = 152+168+144 = 464 ✓
      baseNutrition: { calories: 464, proteinGrams: 38, carbsGrams: 42, fatGrams: 16 },
      ingredients: [
        { name: 'Saumon frais (filet)', qty: 150, unit: 'g' },
        { name: 'Pâte miso', qty: 20, unit: 'g' },
        { name: 'Miel', qty: 10, unit: 'g' },
        { name: 'Sauce soja', qty: 10, unit: 'ml' },
        { name: 'Riz brun', qty: 60, unit: 'g' },
        { name: 'Bok choy', qty: 120, unit: 'g' },
        { name: 'Sésame (graines)', qty: 5, unit: 'g' }
      ],
      steps: [
        'Mélanger miso + miel + sauce soja. Enduire le saumon. Mariner 10 min.',
        'Cuire le riz brun. Blanchir le bok choy 2 min.',
        'Cuire le saumon au four 200°C 12 min ou à la poêle 4 min par face.',
        'Servir sur riz brun avec bok choy. Parsemer de sésame.'
      ]
    },
    {
      id: 'R347',
      name: 'Poulet Tikka Masala Light',
      emoji: '🍛', origin: '🇮🇳',
      mealTypes: ['dinner'],
      tags: ['indien', 'poulet', 'curry', 'light', 'tendance', 'high-protein'],
      difficulty: 2, prepTime: 15, cookTime: 25, servings: 1,
      // 42×4 + 48×4 + 12×9 = 168+192+108 = 468 ✓
      baseNutrition: { calories: 468, proteinGrams: 42, carbsGrams: 48, fatGrams: 12 },
      ingredients: [
        { name: 'Blanc de poulet', qty: 150, unit: 'g' },
        { name: 'Yaourt nature 0%', qty: 80, unit: 'g' },
        { name: 'Tomate', qty: 150, unit: 'g' },
        { name: 'Oignon', qty: 80, unit: 'g' },
        { name: 'Garam Masala', qty: 5, unit: 'g' },
        { name: 'Curcuma', qty: 2, unit: 'g' },
        { name: 'Gingembre', qty: 5, unit: 'g' },
        { name: 'Riz basmati', qty: 60, unit: 'g' }
      ],
      steps: [
        'Mariner le poulet en dés dans yaourt + garam masala + curcuma 10 min.',
        'Faire revenir l\'oignon. Ajouter tomates concassées + gingembre. Mijoter 10 min.',
        'Ajouter le poulet. Cuire 15 min à feu moyen. Servir sur riz basmati.'
      ]
    },
    {
      id: 'R348',
      name: 'Spaghetti Bolognaise Healthy',
      emoji: '🍝', origin: '🇮🇹',
      mealTypes: ['dinner'],
      tags: ['italien', 'pâtes', 'boeuf', 'healthy', 'réconfortant', 'classique'],
      difficulty: 2, prepTime: 10, cookTime: 25, servings: 1,
      // 38×4 + 58×4 + 12×9 = 152+232+108 = 492 ✓
      baseNutrition: { calories: 492, proteinGrams: 38, carbsGrams: 58, fatGrams: 12 },
      ingredients: [
        { name: 'Pâtes complètes fusilli', qty: 80, unit: 'g' },
        { name: 'Bœuf maigre haché', qty: 120, unit: 'g' },
        { name: 'Tomate', qty: 150, unit: 'g' },
        { name: 'Oignon', qty: 60, unit: 'g' },
        { name: 'Ail', qty: 2, unit: 'g' },
        { name: 'Huile d\'olive', qty: 5, unit: 'ml' },
        { name: 'Origan', qty: 2, unit: 'g' },
        { name: 'Fromage râpé', qty: 15, unit: 'g' }
      ],
      steps: [
        'Faire revenir oignon + ail dans l\'huile. Ajouter bœuf haché, cuire 5 min.',
        'Ajouter tomates concassées + origan. Mijoter 15 min.',
        'Cuire les pâtes al dente. Servir avec la bolognaise et fromage râpé.'
      ]
    },
    {
      id: 'R349',
      name: 'Curry de Pois Chiches',
      emoji: '🫘', origin: '🇮🇳',
      mealTypes: ['dinner'],
      tags: ['indien', 'vegan', 'pois-chiches', 'curry', 'tendance', 'high-fiber'],
      difficulty: 1, prepTime: 10, cookTime: 20, servings: 1,
      // 20×4 + 62×4 + 14×9 = 80+248+126 = 454 ✓
      baseNutrition: { calories: 454, proteinGrams: 20, carbsGrams: 62, fatGrams: 14 },
      ingredients: [
        { name: 'Pois chiches (boîte)', qty: 150, unit: 'g' },
        { name: 'Lait de coco (brique)', qty: 100, unit: 'ml' },
        { name: 'Épinards frais', qty: 60, unit: 'g' },
        { name: 'Tomate', qty: 100, unit: 'g' },
        { name: 'Oignon', qty: 60, unit: 'g' },
        { name: 'Garam Masala', qty: 5, unit: 'g' },
        { name: 'Curcuma', qty: 2, unit: 'g' },
        { name: 'Riz basmati', qty: 60, unit: 'g' }
      ],
      steps: [
        'Faire revenir l\'oignon. Ajouter épices + tomates. Cuire 5 min.',
        'Ajouter pois chiches + lait de coco. Mijoter 12 min.',
        'Incorporer les épinards en fin de cuisson. Servir sur riz basmati.'
      ]
    },
    {
      id: 'R350',
      name: 'Bulgogi Bowl Bœuf Coréen',
      emoji: '🥩', origin: '🇰🇷',
      mealTypes: ['dinner'],
      tags: ['coréen', 'boeuf', 'bulgogi', 'bowl', 'tendance', 'high-protein'],
      difficulty: 2, prepTime: 15, cookTime: 10, servings: 1,
      // 36×4 + 52×4 + 14×9 = 144+208+126 = 478 ✓
      baseNutrition: { calories: 478, proteinGrams: 36, carbsGrams: 52, fatGrams: 14 },
      ingredients: [
        { name: 'Bœuf maigre haché', qty: 130, unit: 'g' },
        { name: 'Riz blanc', qty: 70, unit: 'g' },
        { name: 'Sauce soja', qty: 20, unit: 'ml' },
        { name: 'Miel', qty: 10, unit: 'g' },
        { name: 'Huile de sésame', qty: 5, unit: 'ml' },
        { name: 'Gingembre', qty: 5, unit: 'g' },
        { name: 'Salade romaine', qty: 60, unit: 'g' },
        { name: 'Sésame (graines)', qty: 5, unit: 'g' }
      ],
      steps: [
        'Mariner le bœuf : sauce soja + miel + huile sésame + gingembre 10 min.',
        'Cuire le riz. Saisir le bœuf à feu vif 5 min.',
        'Assembler : riz, bœuf bulgogi, salade, sésame.'
      ]
    },
    {
      id: 'R351',
      name: 'Shakshuka',
      emoji: '🍳', origin: '🇮🇱',
      mealTypes: ['dinner'],
      tags: ['israélien', 'oeufs', 'tomates', 'épicé', 'tendance', 'végétarien'],
      difficulty: 1, prepTime: 10, cookTime: 20, servings: 1,
      // 22×4 + 28×4 + 16×9 = 88+112+144 = 344 ✓
      baseNutrition: { calories: 344, proteinGrams: 22, carbsGrams: 28, fatGrams: 16 },
      ingredients: [
        { name: 'Œuf', qty: 3, unit: 'pce' },
        { name: 'Tomate', qty: 200, unit: 'g' },
        { name: 'Poivron rouge', qty: 80, unit: 'g' },
        { name: 'Oignon', qty: 60, unit: 'g' },
        { name: 'Cumin moulu', qty: 3, unit: 'g' },
        { name: 'Paprika fumé', qty: 3, unit: 'g' },
        { name: 'Huile d\'olive', qty: 8, unit: 'ml' },
        { name: 'Pain pita complet', qty: 1, unit: 'pce' }
      ],
      steps: [
        'Faire revenir oignon + poivron à l\'huile. Ajouter tomates + épices.',
        'Mijoter 10 min jusqu\'à sauce épaisse. Creuser 3 puits.',
        'Casser un œuf dans chaque puits. Couvrir et cuire 5-7 min. Servir avec pita.'
      ]
    },
    {
      id: 'R352',
      name: 'Poulet Rôti Citron & Herbes',
      emoji: '🍋', origin: '🇫🇷',
      mealTypes: ['dinner'],
      tags: ['français', 'poulet', 'citron', 'herbes', 'classique', 'high-protein'],
      difficulty: 1, prepTime: 10, cookTime: 25, servings: 1,
      // 42×4 + 28×4 + 12×9 = 168+112+108 = 388 ✓
      baseNutrition: { calories: 388, proteinGrams: 42, carbsGrams: 28, fatGrams: 12 },
      ingredients: [
        { name: 'Blanc de poulet', qty: 150, unit: 'g' },
        { name: 'Citron (pce)', qty: 1, unit: 'pce' },
        { name: 'Thym', qty: 3, unit: 'g' },
        { name: 'Romarin', qty: 3, unit: 'g' },
        { name: 'Patate douce', qty: 150, unit: 'g' },
        { name: 'Courgette', qty: 100, unit: 'g' },
        { name: 'Huile d\'olive', qty: 8, unit: 'ml' }
      ],
      steps: [
        'Mariner le poulet avec jus de citron + herbes + huile + sel.',
        'Cuire au four 200°C avec patate douce et courgette en morceaux, 22-25 min.',
        'Servir avec les légumes rôtis.'
      ]
    },
    {
      id: 'R353',
      name: 'Cabillaud Croûte Herbes',
      emoji: '🐟', origin: '🇫🇷',
      mealTypes: ['dinner'],
      tags: ['poisson', 'cabillaud', 'français', 'light', 'high-protein', 'elegant'],
      difficulty: 2, prepTime: 10, cookTime: 15, servings: 1,
      // 36×4 + 28×4 + 10×9 = 144+112+90 = 346 ✓
      baseNutrition: { calories: 346, proteinGrams: 36, carbsGrams: 28, fatGrams: 10 },
      ingredients: [
        { name: 'Cabillaud (filet)', qty: 160, unit: 'g' },
        { name: 'Chapelure', qty: 20, unit: 'g' },
        { name: 'Persil frais', qty: 1, unit: 'pce' },
        { name: 'Citron (pce)', qty: 0.5, unit: 'pce' },
        { name: 'Haricots verts', qty: 120, unit: 'g' },
        { name: 'Huile d\'olive', qty: 8, unit: 'ml' }
      ],
      steps: [
        'Mélanger chapelure + persil haché + zeste citron + huile.',
        'Déposer sur le cabillaud. Cuire au four 200°C / 12 min.',
        'Cuire les haricots verts vapeur 6 min. Servir ensemble.'
      ]
    },
    {
      id: 'R354',
      name: 'Butter Chicken Light',
      emoji: '🍗', origin: '🇮🇳',
      mealTypes: ['dinner'],
      tags: ['indien', 'poulet', 'light', 'tendance', 'crémeux', 'high-protein'],
      difficulty: 2, prepTime: 15, cookTime: 25, servings: 1,
      // 40×4 + 46×4 + 12×9 = 160+184+108 = 452 ✓
      baseNutrition: { calories: 452, proteinGrams: 40, carbsGrams: 46, fatGrams: 12 },
      ingredients: [
        { name: 'Blanc de poulet', qty: 140, unit: 'g' },
        { name: 'Yaourt nature 0%', qty: 80, unit: 'g' },
        { name: 'Tomate', qty: 150, unit: 'g' },
        { name: 'Oignon', qty: 60, unit: 'g' },
        { name: 'Garam Masala', qty: 5, unit: 'g' },
        { name: 'Curcuma', qty: 2, unit: 'g' },
        { name: 'Gingembre', qty: 5, unit: 'g' },
        { name: 'Riz basmati', qty: 60, unit: 'g' }
      ],
      steps: [
        'Mariner poulet en dés avec yaourt + épices 15 min.',
        'Faire revenir oignon. Ajouter tomates + épices. Mijoter 10 min. Mixer la sauce.',
        'Ajouter le poulet, cuire 15 min. Sauce onctueuse sans crème. Servir sur riz basmati.'
      ]
    },
    {
      id: 'R355',
      name: 'Stir-Fry Bœuf Brocoli',
      emoji: '🥦', origin: '🇨🇳',
      mealTypes: ['dinner'],
      tags: ['chinois', 'boeuf', 'brocoli', 'stir-fry', 'tendance', 'high-protein'],
      difficulty: 2, prepTime: 10, cookTime: 12, servings: 1,
      // 36×4 + 40×4 + 12×9 = 144+160+108 = 412 ✓
      baseNutrition: { calories: 412, proteinGrams: 36, carbsGrams: 40, fatGrams: 12 },
      ingredients: [
        { name: 'Bœuf maigre haché', qty: 130, unit: 'g' },
        { name: 'Brocoli', qty: 150, unit: 'g' },
        { name: 'Sauce soja', qty: 20, unit: 'ml' },
        { name: 'Sauce huître', qty: 15, unit: 'ml' },
        { name: 'Gingembre', qty: 5, unit: 'g' },
        { name: 'Ail', qty: 3, unit: 'g' },
        { name: 'Riz blanc', qty: 60, unit: 'g' },
        { name: 'Huile de sésame', qty: 5, unit: 'ml' }
      ],
      steps: [
        'Cuire le riz. Blanchir le brocoli 2 min.',
        'Saisir le bœuf à feu vif avec ail + gingembre, 4 min.',
        'Ajouter brocoli + sauce soja + sauce huître. Sauter 2 min. Finir avec huile sésame.'
      ]
    },
    {
      id: 'R356',
      name: 'Gnocchi Épinards Ricotta',
      emoji: '🫘', origin: '🇮🇹',
      mealTypes: ['dinner'],
      tags: ['italien', 'végétarien', 'gnocchi', 'réconfortant', 'tendance'],
      difficulty: 1, prepTime: 8, cookTime: 10, servings: 1,
      // 22×4 + 54×4 + 14×9 = 88+216+126 = 430 ✓
      baseNutrition: { calories: 430, proteinGrams: 22, carbsGrams: 54, fatGrams: 14 },
      ingredients: [
        { name: 'Gnocchi (frais ou emballé)', qty: 200, unit: 'g' },
        { name: 'Épinards frais', qty: 80, unit: 'g' },
        { name: 'Ricotta', qty: 60, unit: 'g' },
        { name: 'Fromage râpé', qty: 15, unit: 'g' },
        { name: 'Ail', qty: 2, unit: 'g' },
        { name: 'Huile d\'olive', qty: 8, unit: 'ml' }
      ],
      steps: [
        'Cuire les gnocchi selon emballage (2-3 min eau bouillante). Égoutter.',
        'Faire revenir ail + épinards à l\'huile 2 min. Ajouter la ricotta.',
        'Mélanger gnocchi + sauce épinards-ricotta. Parsemer de fromage râpé.'
      ]
    },
    {
      id: 'R357',
      name: 'Soupe Miso Tofu & Wakame',
      emoji: '🍵', origin: '🇯🇵',
      mealTypes: ['dinner'],
      tags: ['japonais', 'soupe', 'miso', 'tofu', 'light', 'réconfortant'],
      difficulty: 1, prepTime: 8, cookTime: 10, servings: 1,
      // 18×4 + 32×4 + 8×9 = 72+128+72 = 272 ✓
      baseNutrition: { calories: 272, proteinGrams: 18, carbsGrams: 32, fatGrams: 8 },
      ingredients: [
        { name: 'Pâte miso', qty: 30, unit: 'g' },
        { name: 'Tofu soyeux', qty: 100, unit: 'g' },
        { name: 'Wakame (algue séchée)', qty: 5, unit: 'g' },
        { name: 'Riz blanc', qty: 60, unit: 'g' },
        { name: 'Sauce soja', qty: 5, unit: 'ml' },
        { name: 'Oignon vert', qty: 1, unit: 'pce' }
      ],
      steps: [
        'Cuire le riz. Réhydrater le wakame 5 min dans l\'eau froide.',
        'Porter 400ml d\'eau à frémissement (ne pas bouillir). Dissoudre le miso.',
        'Ajouter tofu en dés, wakame, sauce soja. Servir avec riz et oignon vert émincé.'
      ]
    },
    {
      id: 'R358',
      name: 'Tartare Saumon Avocat',
      emoji: '🥗', origin: '🇫🇷',
      mealTypes: ['dinner'],
      tags: ['français', 'saumon', 'cru', 'avocat', 'élégant', 'tendance'],
      difficulty: 2, prepTime: 15, cookTime: 0, servings: 1,
      // 28×4 + 14×4 + 24×9 = 112+56+216 = 384 ✓
      baseNutrition: { calories: 384, proteinGrams: 28, carbsGrams: 14, fatGrams: 24 },
      ingredients: [
        { name: 'Saumon frais (filet)', qty: 120, unit: 'g' },
        { name: 'Avocat', qty: 80, unit: 'g' },
        { name: 'Citron (pce)', qty: 0.5, unit: 'pce' },
        { name: 'Sauce soja', qty: 10, unit: 'ml' },
        { name: 'Huile de sésame', qty: 5, unit: 'ml' },
        { name: 'Pain complet', qty: 2, unit: 'pce' },
        { name: 'Sésame (graines)', qty: 5, unit: 'g' }
      ],
      steps: [
        'Couper le saumon ultra-frais en petits dés. Assaisonner : citron + sauce soja + huile sésame.',
        'Écraser l\'avocat en guacamole léger avec citron + sel.',
        'Dresser : guacamole en base, tartare de saumon dessus. Toast pain complet. Sésame.'
      ]
    },
    {
      id: 'R359',
      name: 'Moules Marinières Légères',
      emoji: '🦪', origin: '🇧🇪',
      mealTypes: ['dinner'],
      tags: ['moules', 'fruits-de-mer', 'léger', 'français', 'protéiné'],
      difficulty: 2, prepTime: 10, cookTime: 12, servings: 1,
      // 28×4 + 22×4 + 8×9 = 112+88+72 = 272 ✓
      baseNutrition: { calories: 272, proteinGrams: 28, carbsGrams: 22, fatGrams: 8 },
      ingredients: [
        { name: 'Moules (fraîches)', qty: 400, unit: 'g' },
        { name: 'Bouillon de légumes (cube)', qty: 1, unit: 'pce' },
        { name: 'Ail', qty: 3, unit: 'g' },
        { name: 'Oignon', qty: 60, unit: 'g' },
        { name: 'Persil frais', qty: 1, unit: 'pce' },
        { name: 'Huile d\'olive', qty: 8, unit: 'ml' },
        { name: 'Pain complet', qty: 2, unit: 'pce' }
      ],
      steps: [
        'Nettoyer et gratter les moules. Jeter celles qui restent ouvertes.',
        'Faire revenir ail + oignon à l\'huile. Ajouter 150ml de bouillon chaud.',
        'Ajouter les moules, couvrir, cuire 4-5 min jusqu\'à ouverture. Parsemer de persil. Servir avec pain.'
      ]
    },
    {
      id: 'R360',
      name: 'Poulet Satay Sauce Cacahuète',
      emoji: '🥜', origin: '🇮🇩',
      mealTypes: ['dinner'],
      tags: ['indonésien', 'poulet', 'cacahuète', 'satay', 'tendance', 'high-protein'],
      difficulty: 2, prepTime: 15, cookTime: 15, servings: 1,
      // 40×4 + 44×4 + 16×9 = 160+176+144 = 480 ✓
      baseNutrition: { calories: 480, proteinGrams: 40, carbsGrams: 44, fatGrams: 16 },
      ingredients: [
        { name: 'Blanc de poulet', qty: 140, unit: 'g' },
        { name: 'Beurre de cacahuète', qty: 30, unit: 'g' },
        { name: 'Sauce soja', qty: 15, unit: 'ml' },
        { name: 'Miel', qty: 10, unit: 'g' },
        { name: 'Citron (pce)', qty: 0.5, unit: 'pce' },
        { name: 'Riz jasmin', qty: 60, unit: 'g' },
        { name: 'Concombre', qty: 80, unit: 'g' },
        { name: 'Sésame (graines)', qty: 5, unit: 'g' }
      ],
      steps: [
        'Mariner le poulet en lanières : sauce soja + miel + citron 10 min. Griller à la poêle.',
        'Sauce satay : beurre de cacahuète + 2cs eau chaude + sauce soja + miel. Fouetter.',
        'Servir le poulet sur riz jasmin avec concombre et sauce cacahuète. Sésame.'
      ]
    },
    {
      id: 'R361',
      name: 'Overnight Oats Beurre Cacahuète Banane',
      emoji: '🥣', origin: '🇺🇸',
      mealTypes: ['breakfast'],
      tags: ['overnight-oats', 'meal-prep', 'tendance', 'high-protein', 'no-cook'],
      difficulty: 1, prepTime: 5, cookTime: 0, servings: 1,
      // 18×4 + 58×4 + 14×9 = 72+232+126 = 430 ✓
      baseNutrition: { calories: 430, proteinGrams: 18, carbsGrams: 58, fatGrams: 14 },
      ingredients: [
        { name: 'Flocons d\'avoine', qty: 70, unit: 'g' },
        { name: 'Lait d\'amande', qty: 200, unit: 'ml' },
        { name: 'Beurre de cacahuète', qty: 20, unit: 'g' },
        { name: 'Banane', qty: 80, unit: 'g' },
        { name: 'Miel', qty: 10, unit: 'g' },
        { name: 'Graines de chia', qty: 10, unit: 'g' }
      ],
      steps: [
        'Mélanger flocons + lait d\'amande + graines de chia + miel dans un bocal.',
        'Réfrigérer toute la nuit.',
        'Matin : garnir de beurre de cacahuète et banane tranchée.'
      ]
    },
    {
      id: 'R362',
      name: 'French Toast Protéiné',
      emoji: '🍞', origin: '🇫🇷',
      mealTypes: ['breakfast'],
      tags: ['french-toast', 'high-protein', 'brunch', 'tendance', 'réconfortant'],
      difficulty: 1, prepTime: 5, cookTime: 8, servings: 1,
      // 26×4 + 40×4 + 12×9 = 104+160+108 = 372 ✓
      baseNutrition: { calories: 372, proteinGrams: 26, carbsGrams: 40, fatGrams: 12 },
      ingredients: [
        { name: 'Pain complet', qty: 3, unit: 'pce' },
        { name: 'Œuf', qty: 2, unit: 'pce' },
        { name: 'Lait d\'amande', qty: 60, unit: 'ml' },
        { name: 'Cannelle', qty: 2, unit: 'g' },
        { name: 'Miel', qty: 15, unit: 'g' },
        { name: 'Fraises', qty: 80, unit: 'g' }
      ],
      steps: [
        'Battre œufs + lait + cannelle dans un bol.',
        'Tremper les tranches de pain dans le mélange.',
        'Cuire à la poêle huilée 2-3 min par face jusqu\'à dorure. Servir avec fraises + miel.'
      ]
    },
    {
      id: 'R363',
      name: 'Wrap Petit-Déjeuner Mexicain',
      emoji: '🌯', origin: '🇲🇽',
      mealTypes: ['breakfast'],
      tags: ['wrap', 'oeufs', 'mexicain', 'high-protein', 'tendance', 'savoureux'],
      difficulty: 1, prepTime: 8, cookTime: 8, servings: 1,
      // 28×4 + 36×4 + 14×9 = 112+144+126 = 382 ✓
      baseNutrition: { calories: 382, proteinGrams: 28, carbsGrams: 36, fatGrams: 14 },
      ingredients: [
        { name: 'Tortilla de blé', qty: 1, unit: 'pce' },
        { name: 'Œuf', qty: 3, unit: 'pce' },
        { name: 'Haricots noirs égouttés', qty: 60, unit: 'g' },
        { name: 'Avocat', qty: 40, unit: 'g' },
        { name: 'Tomate', qty: 60, unit: 'g' },
        { name: 'Paprika fumé', qty: 2, unit: 'g' }
      ],
      steps: [
        'Brouiller les œufs avec paprika. Réchauffer les haricots.',
        'Réchauffer la tortilla.',
        'Garnir : œufs, haricots, avocat écrasé, tomates. Rouler.'
      ]
    },
    {
      id: 'R364',
      name: 'Porridge Pomme Cannelle',
      emoji: '🍎', origin: '🇬🇧',
      mealTypes: ['breakfast'],
      tags: ['porridge', 'pomme', 'cannelle', 'réconfortant', 'healthy', 'vegan'],
      difficulty: 1, prepTime: 2, cookTime: 8, servings: 1,
      // 10×4 + 60×4 + 8×9 = 40+240+72 = 352 ✓
      baseNutrition: { calories: 352, proteinGrams: 10, carbsGrams: 60, fatGrams: 8 },
      ingredients: [
        { name: 'Flocons d\'avoine', qty: 70, unit: 'g' },
        { name: 'Lait d\'amande', qty: 250, unit: 'ml' },
        { name: 'Pomme', qty: 1, unit: 'pce' },
        { name: 'Cannelle', qty: 3, unit: 'g' },
        { name: 'Miel', qty: 15, unit: 'g' },
        { name: 'Noix', qty: 15, unit: 'g' }
      ],
      steps: [
        'Cuire les flocons dans le lait d\'amande à feu moyen 5 min en remuant.',
        'Râper la pomme ou couper en dés. Mélanger avec cannelle.',
        'Servir le porridge avec pomme, noix et miel.'
      ]
    },
    {
      id: 'R365',
      name: 'Bowl Protéiné Ricotta Fruits',
      emoji: '🫐', origin: '🇮🇹',
      mealTypes: ['breakfast', 'snack'],
      tags: ['ricotta', 'fruits', 'high-protein', 'italien', 'light', 'tendance'],
      difficulty: 1, prepTime: 5, cookTime: 0, servings: 1,
      // 20×4 + 28×4 + 10×9 = 80+112+90 = 282 ✓
      baseNutrition: { calories: 282, proteinGrams: 20, carbsGrams: 28, fatGrams: 10 },
      ingredients: [
        { name: 'Ricotta', qty: 150, unit: 'g' },
        { name: 'Myrtilles', qty: 60, unit: 'g' },
        { name: 'Fraises', qty: 60, unit: 'g' },
        { name: 'Miel', qty: 10, unit: 'g' },
        { name: 'Amandes effilées', qty: 10, unit: 'g' }
      ],
      steps: [
        'Lisser la ricotta dans un bol.',
        'Disposer les fruits rouges et amandes effilées.',
        'Arroser de miel.'
      ]
    },
    {
      id: 'R366',
      name: 'Salade Niçoise Moderne',
      emoji: '🥗', origin: '🇫🇷',
      mealTypes: ['lunch'],
      tags: ['niçoise', 'thon', 'français', 'salade', 'classique', 'high-protein'],
      difficulty: 1, prepTime: 15, cookTime: 10, servings: 1,
      // 32×4 + 24×4 + 16×9 = 128+96+144 = 368 ✓
      baseNutrition: { calories: 368, proteinGrams: 32, carbsGrams: 24, fatGrams: 16 },
      ingredients: [
        { name: 'Thon au naturel (boîte)', qty: 130, unit: 'g' },
        { name: 'Œuf', qty: 2, unit: 'pce' },
        { name: 'Haricots verts', qty: 100, unit: 'g' },
        { name: 'Tomate', qty: 100, unit: 'g' },
        { name: 'Olives vertes', qty: 30, unit: 'g' },
        { name: 'Huile d\'olive', qty: 10, unit: 'ml' },
        { name: 'Vinaigre balsamique', qty: 8, unit: 'ml' },
        { name: 'Salade romaine', qty: 60, unit: 'g' }
      ],
      steps: [
        'Cuire les haricots verts vapeur 6 min. Cuire les œufs durs 10 min.',
        'Dresser : salade, haricots verts, tomates, thon, olives, œufs coupés.',
        'Vinaigrette : huile d\'olive + balsamique + moutarde + sel.'
      ]
    },
    {
      id: 'R367',
      name: 'Bowl Quinoa Méditerranéen',
      emoji: '🌿', origin: '🇬🇷',
      mealTypes: ['lunch'],
      tags: ['quinoa', 'méditerranéen', 'végétarien', 'bowl', 'fresh', 'healthy'],
      difficulty: 1, prepTime: 10, cookTime: 15, servings: 1,
      // 20×4 + 52×4 + 14×9 = 80+208+126 = 414 ✓
      baseNutrition: { calories: 414, proteinGrams: 20, carbsGrams: 52, fatGrams: 14 },
      ingredients: [
        { name: 'Quinoa', qty: 70, unit: 'g' },
        { name: 'Feta', qty: 60, unit: 'g' },
        { name: 'Tomates cerises', qty: 100, unit: 'g' },
        { name: 'Concombre', qty: 80, unit: 'g' },
        { name: 'Olives vertes', qty: 30, unit: 'g' },
        { name: 'Huile d\'olive', qty: 10, unit: 'ml' },
        { name: 'Citron (pce)', qty: 0.5, unit: 'pce' },
        { name: 'Origan', qty: 2, unit: 'g' }
      ],
      steps: [
        'Cuire le quinoa 12 min. Laisser tiédir.',
        'Couper tomates, concombre, olives. Émietter la feta.',
        'Mélanger quinoa + légumes + feta. Assaisonner huile + citron + origan.'
      ]
    },
    {
      id: 'R368',
      name: 'Noodle Bowl Thaï Végétarien',
      emoji: '🍜', origin: '🇹🇭',
      mealTypes: ['lunch'],
      tags: ['thaï', 'végétarien', 'nouilles', 'bowl', 'tendance', 'vegan'],
      difficulty: 1, prepTime: 10, cookTime: 10, servings: 1,
      // 14×4 + 56×4 + 14×9 = 56+224+126 = 406 ✓
      baseNutrition: { calories: 406, proteinGrams: 14, carbsGrams: 56, fatGrams: 14 },
      ingredients: [
        { name: 'Nouilles de riz', qty: 80, unit: 'g' },
        { name: 'Tofu ferme', qty: 100, unit: 'g' },
        { name: 'Carotte', qty: 60, unit: 'g' },
        { name: 'Concombre', qty: 60, unit: 'g' },
        { name: 'Beurre de cacahuète', qty: 20, unit: 'g' },
        { name: 'Sauce soja', qty: 15, unit: 'ml' },
        { name: 'Citron (pce)', qty: 0.5, unit: 'pce' },
        { name: 'Sésame (graines)', qty: 5, unit: 'g' }
      ],
      steps: [
        'Faire tremper les nouilles de riz 8 min dans l\'eau chaude.',
        'Dorer le tofu en cubes à la poêle. Râper la carotte.',
        'Sauce : beurre de cacahuète + sauce soja + citron + 2cs eau. Assembler le bowl.'
      ]
    },
    {
      id: 'R369',
      name: 'Assiette Mezze Libanaise',
      emoji: '🧿', origin: '🇱🇧',
      mealTypes: ['lunch'],
      tags: ['libanais', 'mezze', 'végétarien', 'moyen-orient', 'tendance', 'partage'],
      difficulty: 1, prepTime: 15, cookTime: 0, servings: 1,
      // 16×4 + 42×4 + 18×9 = 64+168+162 = 394 ✓
      baseNutrition: { calories: 394, proteinGrams: 16, carbsGrams: 42, fatGrams: 18 },
      ingredients: [
        { name: 'Houmous', qty: 80, unit: 'g' },
        { name: 'Pain pita complet', qty: 1, unit: 'pce' },
        { name: 'Concombre', qty: 80, unit: 'g' },
        { name: 'Tomate', qty: 80, unit: 'g' },
        { name: 'Olives vertes', qty: 30, unit: 'g' },
        { name: 'Feta', qty: 40, unit: 'g' },
        { name: 'Huile d\'olive', qty: 8, unit: 'ml' }
      ],
      steps: [
        'Couper concombre et tomates en dés.',
        'Dresser l\'assiette : houmous au centre, légumes autour, olives, feta émiettée.',
        'Arroser d\'huile d\'olive. Servir avec pita grillé.'
      ]
    },
    {
      id: 'R370',
      name: 'Club Sandwich Healthy',
      emoji: '🥪', origin: '🇺🇸',
      mealTypes: ['lunch'],
      tags: ['sandwich', 'poulet', 'américain', 'classique', 'high-protein'],
      difficulty: 1, prepTime: 10, cookTime: 10, servings: 1,
      // 36×4 + 40×4 + 12×9 = 144+160+108 = 412 ✓
      baseNutrition: { calories: 412, proteinGrams: 36, carbsGrams: 40, fatGrams: 12 },
      ingredients: [
        { name: 'Pain complet', qty: 3, unit: 'pce' },
        { name: 'Blanc de poulet', qty: 120, unit: 'g' },
        { name: 'Œuf', qty: 1, unit: 'pce' },
        { name: 'Tomate', qty: 80, unit: 'g' },
        { name: 'Salade romaine', qty: 40, unit: 'g' },
        { name: 'Moutarde', qty: 10, unit: 'g' }
      ],
      steps: [
        'Griller les tranches de pain. Cuire le poulet à la poêle et trancher.',
        'Cuire l\'œuf au plat.',
        'Monter le club : pain + moutarde + salade + tomate + poulet + œuf + pain.'
      ]
    },
    {
      id: 'R371',
      name: 'Risotto Poulet Champignons Light',
      emoji: '🍄', origin: '🇮🇹',
      mealTypes: ['dinner'],
      tags: ['risotto', 'poulet', 'champignons', 'italien', 'réconfortant', 'light'],
      difficulty: 3, prepTime: 10, cookTime: 30, servings: 1,
      // 34×4 + 54×4 + 10×9 = 136+216+90 = 442 ✓
      baseNutrition: { calories: 442, proteinGrams: 34, carbsGrams: 54, fatGrams: 10 },
      ingredients: [
        { name: 'Riz blanc', qty: 70, unit: 'g' },
        { name: 'Blanc de poulet', qty: 120, unit: 'g' },
        { name: 'Champignons de Paris', qty: 120, unit: 'g' },
        { name: 'Oignon', qty: 50, unit: 'g' },
        { name: 'Bouillon de poulet (cube)', qty: 1, unit: 'pce' },
        { name: 'Fromage râpé', qty: 15, unit: 'g' },
        { name: 'Huile d\'olive', qty: 5, unit: 'ml' }
      ],
      steps: [
        'Faire revenir oignon + champignons. Ajouter poulet en dés, cuire 5 min.',
        'Ajouter le riz, nacrer 1 min. Verser le bouillon chaud louche par louche.',
        'Remuer 20 min. Finir avec fromage râpé. Crémeux sans beurre.'
      ]
    },
    {
      id: 'R372',
      name: 'Dahl de Lentilles Corail',
      emoji: '🟠', origin: '🇮🇳',
      mealTypes: ['dinner'],
      tags: ['indien', 'lentilles', 'vegan', 'dahl', 'tendance', 'high-fiber'],
      difficulty: 1, prepTime: 10, cookTime: 25, servings: 1,
      // 18×4 + 56×4 + 10×9 = 72+224+90 = 386 ✓
      baseNutrition: { calories: 386, proteinGrams: 18, carbsGrams: 56, fatGrams: 10 },
      ingredients: [
        { name: 'Lentilles vertes sèches', qty: 80, unit: 'g' },
        { name: 'Lait de coco (brique)', qty: 100, unit: 'ml' },
        { name: 'Tomate', qty: 100, unit: 'g' },
        { name: 'Oignon', qty: 60, unit: 'g' },
        { name: 'Curcuma', qty: 2, unit: 'g' },
        { name: 'Garam Masala', qty: 4, unit: 'g' },
        { name: 'Gingembre', qty: 5, unit: 'g' },
        { name: 'Huile d\'olive', qty: 5, unit: 'ml' }
      ],
      steps: [
        'Rincer les lentilles. Faire revenir oignon + gingembre + épices.',
        'Ajouter lentilles + tomates + 300ml eau. Cuire 20 min.',
        'Incorporer lait de coco, cuire 5 min. Servir avec riz ou pain pita.'
      ]
    },
    {
      id: 'R373',
      name: 'Grilled Cheese Healthy',
      emoji: '🧀', origin: '🇺🇸',
      mealTypes: ['dinner'],
      tags: ['sandwich', 'fromage', 'américain', 'réconfortant', 'tendance', 'simple'],
      difficulty: 1, prepTime: 5, cookTime: 8, servings: 1,
      // 22×4 + 34×4 + 16×9 = 88+136+144 = 368 ✓
      baseNutrition: { calories: 368, proteinGrams: 22, carbsGrams: 34, fatGrams: 16 },
      ingredients: [
        { name: 'Pain complet', qty: 3, unit: 'pce' },
        { name: 'Fromage râpé', qty: 50, unit: 'g' },
        { name: 'Jambon de dinde (tranches)', qty: 60, unit: 'g' },
        { name: 'Tomate', qty: 60, unit: 'g' },
        { name: 'Moutarde', qty: 8, unit: 'g' }
      ],
      steps: [
        'Tartiner de moutarde. Garnir avec fromage, jambon de dinde, tomates.',
        'Fermer le sandwich.',
        'Cuire à la poêle à feu moyen 3-4 min par face jusqu\'à fromage fondu.'
      ]
    },
    {
      id: 'R374',
      name: 'Soupe Thaï Crevettes Coco',
      emoji: '🍲', origin: '🇹🇭',
      mealTypes: ['dinner'],
      tags: ['thaï', 'crevettes', 'coco', 'soupe', 'tendance', 'léger'],
      difficulty: 2, prepTime: 10, cookTime: 15, servings: 1,
      // 26×4 + 22×4 + 14×9 = 104+88+126 = 318 ✓
      baseNutrition: { calories: 318, proteinGrams: 26, carbsGrams: 22, fatGrams: 14 },
      ingredients: [
        { name: 'Crevettes décortiquées', qty: 120, unit: 'g' },
        { name: 'Lait de coco (brique)', qty: 150, unit: 'ml' },
        { name: 'Bouillon de légumes (cube)', qty: 1, unit: 'pce' },
        { name: 'Champignons de Paris', qty: 80, unit: 'g' },
        { name: 'Citron (pce)', qty: 0.5, unit: 'pce' },
        { name: 'Sauce soja', qty: 10, unit: 'ml' },
        { name: 'Gingembre', qty: 5, unit: 'g' },
        { name: 'Coriandre fraîche', qty: 1, unit: 'pce' }
      ],
      steps: [
        'Porter bouillon + lait de coco + gingembre à frémissement.',
        'Ajouter champignons, cuire 5 min. Ajouter crevettes, cuire 3 min.',
        'Assaisonner citron + sauce soja. Garnir de coriandre.'
      ]
    },
    {
      id: 'R375',
      name: 'Poulet Tandoori Légumes Rôtis',
      emoji: '🫙', origin: '🇮🇳',
      mealTypes: ['dinner'],
      tags: ['indien', 'poulet', 'tandoori', 'rôti', 'tendance', 'high-protein'],
      difficulty: 2, prepTime: 15, cookTime: 25, servings: 1,
      // 42×4 + 30×4 + 10×9 = 168+120+90 = 378 ✓
      baseNutrition: { calories: 378, proteinGrams: 42, carbsGrams: 30, fatGrams: 10 },
      ingredients: [
        { name: 'Blanc de poulet', qty: 150, unit: 'g' },
        { name: 'Yaourt nature 0%', qty: 80, unit: 'g' },
        { name: 'Garam Masala', qty: 5, unit: 'g' },
        { name: 'Curcuma', qty: 2, unit: 'g' },
        { name: 'Paprika fumé', qty: 3, unit: 'g' },
        { name: 'Courgette', qty: 100, unit: 'g' },
        { name: 'Poivron rouge', qty: 80, unit: 'g' },
        { name: 'Huile d\'olive', qty: 5, unit: 'ml' }
      ],
      steps: [
        'Mariner poulet dans yaourt + épices 15 min minimum.',
        'Cuire le poulet au four 200°C 20-25 min avec légumes découpés.',
        'Servir avec pain pita ou riz basmati.'
      ]
    },
    {
      id: 'R376',
      name: 'Gyoza Poulet Maison',
      emoji: '🥟', origin: '🇯🇵',
      mealTypes: ['dinner'],
      tags: ['japonais', 'gyoza', 'poulet', 'dim-sum', 'tendance', 'fun'],
      difficulty: 3, prepTime: 25, cookTime: 10, servings: 1,
      // 28×4 + 36×4 + 10×9 = 112+144+90 = 346 ✓
      baseNutrition: { calories: 346, proteinGrams: 28, carbsGrams: 36, fatGrams: 10 },
      ingredients: [
        { name: 'Hachis de dinde', qty: 100, unit: 'g' },
        { name: 'Chou blanc', qty: 60, unit: 'g' },
        { name: 'Sauce soja', qty: 15, unit: 'ml' },
        { name: 'Gingembre', qty: 5, unit: 'g' },
        { name: 'Huile de sésame', qty: 5, unit: 'ml' },
        { name: 'Farine complète', qty: 60, unit: 'g' },
        { name: 'Sésame (graines)', qty: 5, unit: 'g' }
      ],
      steps: [
        'Pâte : farine + 60ml eau chaude, pétrir, laisser reposer 20 min.',
        'Farce : dinde + chou haché + sauce soja + gingembre + huile sésame.',
        'Former des petites galettes, garnir, plier en demi-lune. Cuire à la poêle huilée + 3cs eau, couvrir 5 min.'
      ]
    },
    {
      id: 'R377',
      name: 'Poke Bowl Thon Épicé',
      emoji: '🌶️', origin: '🇺🇸',
      mealTypes: ['lunch', 'dinner'],
      tags: ['poke', 'thon', 'épicé', 'bowl', 'tendance', 'high-protein'],
      difficulty: 1, prepTime: 12, cookTime: 15, servings: 1,
      // 34×4 + 50×4 + 12×9 = 136+200+108 = 444 ✓
      baseNutrition: { calories: 444, proteinGrams: 34, carbsGrams: 50, fatGrams: 12 },
      ingredients: [
        { name: 'Riz blanc', qty: 75, unit: 'g' },
        { name: 'Thon au naturel (boîte)', qty: 130, unit: 'g' },
        { name: 'Sriracha', qty: 8, unit: 'ml' },
        { name: 'Avocat', qty: 50, unit: 'g' },
        { name: 'Concombre', qty: 60, unit: 'g' },
        { name: 'Edamame (surgelé)', qty: 40, unit: 'g' },
        { name: 'Sauce soja', qty: 10, unit: 'ml' },
        { name: 'Sésame (graines)', qty: 5, unit: 'g' }
      ],
      steps: [
        'Cuire le riz. Mélanger thon égoutté + sriracha + sauce soja.',
        'Cuire les edamames 3 min.',
        'Assembler : riz, thon épicé, avocat, concombre, edamame. Sésame.'
      ]
    },
    {
      id: 'R378',
      name: 'Poêlée Crevettes Ail & Herbes',
      emoji: '🦐', origin: '🇫🇷',
      mealTypes: ['dinner'],
      tags: ['crevettes', 'ail', 'français', 'rapide', 'high-protein', 'léger'],
      difficulty: 1, prepTime: 8, cookTime: 8, servings: 1,
      // 28×4 + 30×4 + 12×9 = 112+120+108 = 340 ✓
      baseNutrition: { calories: 340, proteinGrams: 28, carbsGrams: 30, fatGrams: 12 },
      ingredients: [
        { name: 'Crevettes décortiquées', qty: 150, unit: 'g' },
        { name: 'Ail', qty: 4, unit: 'g' },
        { name: 'Persil frais', qty: 1, unit: 'pce' },
        { name: 'Huile d\'olive', qty: 10, unit: 'ml' },
        { name: 'Citron (pce)', qty: 0.5, unit: 'pce' },
        { name: 'Riz blanc', qty: 60, unit: 'g' }
      ],
      steps: [
        'Cuire le riz.',
        'Chauffer l\'huile. Saisir l\'ail émincé 30 sec. Ajouter crevettes, cuire 3 min par face.',
        'Finir avec jus de citron + persil haché. Servir sur riz.'
      ]
    },
    {
      id: 'R379',
      name: 'Curry Thaï Vert Tofu',
      emoji: '🟢', origin: '🇹🇭',
      mealTypes: ['dinner'],
      tags: ['thaï', 'vegan', 'tofu', 'curry-vert', 'tendance', 'aromate'],
      difficulty: 2, prepTime: 10, cookTime: 20, servings: 1,
      // 18×4 + 44×4 + 16×9 = 72+176+144 = 392 ✓
      baseNutrition: { calories: 392, proteinGrams: 18, carbsGrams: 44, fatGrams: 16 },
      ingredients: [
        { name: 'Tofu ferme', qty: 150, unit: 'g' },
        { name: 'Lait de coco (brique)', qty: 150, unit: 'ml' },
        { name: 'Courgette', qty: 100, unit: 'g' },
        { name: 'Poivron vert', qty: 80, unit: 'g' },
        { name: 'Garam Masala', qty: 3, unit: 'g' },
        { name: 'Gingembre', qty: 5, unit: 'g' },
        { name: 'Sauce soja', qty: 10, unit: 'ml' },
        { name: 'Riz jasmin', qty: 60, unit: 'g' }
      ],
      steps: [
        'Dorer le tofu en cubes à la poêle. Réserver.',
        'Faire revenir gingembre + épices. Ajouter légumes + lait de coco. Mijoter 12 min.',
        'Ajouter tofu + sauce soja. Cuire 3 min. Servir sur riz jasmin.'
      ]
    },
    {
      id: 'R380',
      name: 'Steak de Thon Sauce Vierge',
      emoji: '🐟', origin: '🇫🇷',
      mealTypes: ['dinner'],
      tags: ['thon', 'français', 'élégant', 'high-protein', 'omega3', 'léger'],
      difficulty: 2, prepTime: 10, cookTime: 8, servings: 1,
      // 36×4 + 20×4 + 12×9 = 144+80+108 = 332 ✓
      baseNutrition: { calories: 332, proteinGrams: 36, carbsGrams: 20, fatGrams: 12 },
      ingredients: [
        { name: 'Thon au naturel (boîte)', qty: 150, unit: 'g' },
        { name: 'Tomate', qty: 100, unit: 'g' },
        { name: 'Citron (pce)', qty: 0.5, unit: 'pce' },
        { name: 'Huile d\'olive', qty: 10, unit: 'ml' },
        { name: 'Basilic frais', qty: 5, unit: 'g' },
        { name: 'Ail', qty: 2, unit: 'g' },
        { name: 'Haricots verts', qty: 120, unit: 'g' }
      ],
      steps: [
        'Sauce vierge : tomates en dés + ail émincé + huile + citron + basilic. Réserver.',
        'Cuire les haricots verts vapeur 6 min.',
        'Saisir le thon à la poêle 2-3 min par face (rosé au centre). Napper de sauce vierge.'
      ]
    },
    {
      id: 'R381',
      name: 'Tartines Avocat Œuf Poché',
      emoji: '🥑', origin: '🇦🇺',
      mealTypes: ['breakfast'],
      tags: ['avocat', 'oeufs-pochés', 'brunch', 'tendance', 'high-protein'],
      difficulty: 2, prepTime: 8, cookTime: 5, servings: 1,
      // 18×4 + 26×4 + 18×9 = 72+104+162 = 338 ✓
      baseNutrition: { calories: 338, proteinGrams: 18, carbsGrams: 26, fatGrams: 18 },
      ingredients: [
        { name: 'Pain complet', qty: 2, unit: 'pce' },
        { name: 'Œuf', qty: 2, unit: 'pce' },
        { name: 'Avocat', qty: 80, unit: 'g' },
        { name: 'Citron (pce)', qty: 0.5, unit: 'pce' },
        { name: 'Piment rouge (frais)', qty: 0.5, unit: 'pce' }
      ],
      steps: [
        'Griller le pain. Écraser l\'avocat avec citron + sel + piment.',
        'Pocher les œufs dans eau frémissante vinaigrée 3 min.',
        'Étaler l\'avocat sur le pain. Déposer les œufs pochés. Poivre + fleur de sel.'
      ]
    },
    {
      id: 'R382',
      name: 'Granola Maison Amandes Coco',
      emoji: '🥜', origin: '🇺🇸',
      mealTypes: ['breakfast', 'snack'],
      tags: ['granola', 'maison', 'amandes', 'coco', 'meal-prep', 'vegetarian'],
      difficulty: 1, prepTime: 5, cookTime: 20, servings: 1,
      // 9×4 + 48×4 + 14×9 = 36+192+126 = 354 ✓
      baseNutrition: { calories: 354, proteinGrams: 9, carbsGrams: 48, fatGrams: 14 },
      ingredients: [
        { name: 'Flocons d\'avoine', qty: 60, unit: 'g' },
        { name: 'Amandes effilées', qty: 20, unit: 'g' },
        { name: 'Noix de cajou', qty: 15, unit: 'g' },
        { name: 'Miel', qty: 20, unit: 'g' },
        { name: 'Huile d\'olive', qty: 5, unit: 'ml' },
        { name: 'Lait d\'amande', qty: 150, unit: 'ml' }
      ],
      steps: [
        'Mélanger flocons + amandes + cajou + miel + huile. Étaler sur plaque.',
        'Cuire au four 160°C / 20 min en remuant à mi-cuisson.',
        'Laisser refroidir. Servir avec lait d\'amande.'
      ]
    },
    {
      id: 'R383',
      name: 'Smoothie Protéiné Mangue Curcuma',
      emoji: '🥭', origin: '🇮🇳',
      mealTypes: ['breakfast', 'snack'],
      tags: ['smoothie', 'mangue', 'curcuma', 'anti-inflammatoire', 'tendance', 'vegetarian'],
      difficulty: 1, prepTime: 5, cookTime: 0, servings: 1,
      // 14×4 + 42×4 + 6×9 = 56+168+54 = 278 ✓
      baseNutrition: { calories: 278, proteinGrams: 14, carbsGrams: 42, fatGrams: 6 },
      ingredients: [
        { name: 'Mangue (fraîche)', qty: 150, unit: 'g' },
        { name: 'Lait d\'amande', qty: 200, unit: 'ml' },
        { name: 'Skyr / Yaourt islandais', qty: 80, unit: 'g' },
        { name: 'Curcuma', qty: 2, unit: 'g' },
        { name: 'Gingembre', qty: 3, unit: 'g' },
        { name: 'Miel', qty: 10, unit: 'g' }
      ],
      steps: [
        'Mixer tous les ingrédients jusqu\'à consistance lisse.',
        'Ajuster la consistance avec plus de lait si nécessaire.',
        'Servir frais avec quelques glaçons.'
      ]
    },
    {
      id: 'R384',
      name: 'Waffles Protéinés Banane',
      emoji: '🧇', origin: '🇧🇪',
      mealTypes: ['breakfast'],
      tags: ['waffles', 'banane', 'high-protein', 'brunch', 'tendance', 'fun'],
      difficulty: 2, prepTime: 10, cookTime: 10, servings: 1,
      // 24×4 + 46×4 + 10×9 = 96+184+90 = 370 ✓
      baseNutrition: { calories: 370, proteinGrams: 24, carbsGrams: 46, fatGrams: 10 },
      ingredients: [
        { name: 'Flocons d\'avoine', qty: 60, unit: 'g' },
        { name: 'Banane', qty: 80, unit: 'g' },
        { name: 'Œuf', qty: 2, unit: 'pce' },
        { name: 'Lait d\'amande', qty: 60, unit: 'ml' },
        { name: 'Miel', qty: 10, unit: 'g' },
        { name: 'Fraises', qty: 80, unit: 'g' }
      ],
      steps: [
        'Mixer flocons en farine. Mélanger avec banane écrasée, œufs, lait, miel.',
        'Cuire dans un gaufrier huilé 4-5 min.',
        'Servir avec fraises fraîches.'
      ]
    },
    {
      id: 'R385',
      name: 'Tartare de Betterave & Feta',
      emoji: '🟣', origin: '🇫🇷',
      mealTypes: ['lunch', 'dinner'],
      tags: ['betterave', 'feta', 'végétarien', 'élégant', 'tendance', 'coloré'],
      difficulty: 1, prepTime: 10, cookTime: 0, servings: 1,
      // 12×4 + 24×4 + 14×9 = 48+96+126 = 270 ✓
      baseNutrition: { calories: 270, proteinGrams: 12, carbsGrams: 24, fatGrams: 14 },
      ingredients: [
        { name: 'Betterave (cuite)', qty: 150, unit: 'g' },
        { name: 'Feta', qty: 60, unit: 'g' },
        { name: 'Noix', qty: 20, unit: 'g' },
        { name: 'Huile d\'olive', qty: 8, unit: 'ml' },
        { name: 'Vinaigre balsamique', qty: 8, unit: 'ml' },
        { name: 'Persil frais', qty: 1, unit: 'pce' }
      ],
      steps: [
        'Couper la betterave cuite en petits dés.',
        'Mélanger avec feta émiettée, noix concassées, huile + balsamique.',
        'Garnir de persil. Servir frais.'
      ]
    },
    {
      id: 'R386',
      name: 'Soupe Lentilles Épinards',
      emoji: '🍵', origin: '🇫🇷',
      mealTypes: ['lunch', 'dinner'],
      tags: ['soupe', 'lentilles', 'épinards', 'vegan', 'réconfortant', 'high-fiber'],
      difficulty: 1, prepTime: 10, cookTime: 25, servings: 1,
      // 18×4 + 44×4 + 8×9 = 72+176+72 = 320 ✓
      baseNutrition: { calories: 320, proteinGrams: 18, carbsGrams: 44, fatGrams: 8 },
      ingredients: [
        { name: 'Lentilles vertes sèches', qty: 80, unit: 'g' },
        { name: 'Épinards frais', qty: 80, unit: 'g' },
        { name: 'Oignon', qty: 60, unit: 'g' },
        { name: 'Carotte', qty: 80, unit: 'g' },
        { name: 'Bouillon de légumes (cube)', qty: 1, unit: 'pce' },
        { name: 'Cumin moulu', qty: 3, unit: 'g' },
        { name: 'Huile d\'olive', qty: 5, unit: 'ml' }
      ],
      steps: [
        'Faire revenir oignon + carotte en dés dans l\'huile. Ajouter cumin.',
        'Ajouter lentilles rincées + 500ml eau + cube de bouillon. Cuire 20 min.',
        'Ajouter épinards. Cuire 3 min. Mixer partiellement pour texture crémeuse.'
      ]
    },
    {
      id: 'R387',
      name: 'Bowl Açaí Tropical Protéiné',
      emoji: '🌴', origin: '🇧🇷',
      mealTypes: ['breakfast'],
      tags: ['acai', 'tropical', 'smoothie-bowl', 'high-protein', 'tendance', 'coloré'],
      difficulty: 1, prepTime: 8, cookTime: 0, servings: 1,
      // 16×4 + 52×4 + 10×9 = 64+208+90 = 362 ✓
      baseNutrition: { calories: 362, proteinGrams: 16, carbsGrams: 52, fatGrams: 10 },
      ingredients: [
        { name: 'Açaí en poudre', qty: 15, unit: 'g' },
        { name: 'Banane', qty: 100, unit: 'g' },
        { name: 'Skyr / Yaourt islandais', qty: 100, unit: 'g' },
        { name: 'Mangue (fraîche)', qty: 80, unit: 'g' },
        { name: 'Granola', qty: 30, unit: 'g' },
        { name: 'Kiwi', qty: 1, unit: 'pce' },
        { name: 'Graines de chia', qty: 8, unit: 'g' }
      ],
      steps: [
        'Mixer açaí + banane + skyr jusqu\'à base épaisse.',
        'Verser dans le bol.',
        'Garnir de mangue, kiwi, granola, chia.'
      ]
    },
    {
      id: 'R388',
      name: 'Yakitori Poulet Sauce Teriyaki',
      emoji: '🍡', origin: '🇯🇵',
      mealTypes: ['lunch', 'dinner'],
      tags: ['japonais', 'yakitori', 'poulet', 'brochettes', 'tendance', 'high-protein'],
      difficulty: 2, prepTime: 15, cookTime: 12, servings: 1,
      // 36×4 + 32×4 + 8×9 = 144+128+72 = 344 ✓
      baseNutrition: { calories: 344, proteinGrams: 36, carbsGrams: 32, fatGrams: 8 },
      ingredients: [
        { name: 'Blanc de poulet', qty: 130, unit: 'g' },
        { name: 'Sauce teriyaki', qty: 30, unit: 'ml' },
        { name: 'Riz jasmin', qty: 60, unit: 'g' },
        { name: 'Oignon vert', qty: 2, unit: 'pce' },
        { name: 'Sésame (graines)', qty: 5, unit: 'g' }
      ],
      steps: [
        'Couper le poulet en cubes. Mariner dans la sauce teriyaki 10 min.',
        'Enfiler sur des piques. Griller au four ou barbecue 10-12 min en retournant.',
        'Servir sur riz jasmin avec oignons verts et sésame.'
      ]
    },
    {
      id: 'R389',
      name: 'Salade César Poulet',
      emoji: '🥗', origin: '🇺🇸',
      mealTypes: ['lunch'],
      tags: ['salade-césar', 'poulet', 'classique', 'américain', 'high-protein'],
      difficulty: 1, prepTime: 12, cookTime: 10, servings: 1,
      // 38×4 + 20×4 + 14×9 = 152+80+126 = 358 ✓
      baseNutrition: { calories: 358, proteinGrams: 38, carbsGrams: 20, fatGrams: 14 },
      ingredients: [
        { name: 'Blanc de poulet', qty: 130, unit: 'g' },
        { name: 'Salade romaine', qty: 100, unit: 'g' },
        { name: 'Pain complet', qty: 1, unit: 'pce' },
        { name: 'Fromage râpé', qty: 15, unit: 'g' },
        { name: 'Sauce soja', qty: 5, unit: 'ml' },
        { name: 'Huile d\'olive', qty: 8, unit: 'ml' },
        { name: 'Citron (pce)', qty: 0.5, unit: 'pce' },
        { name: 'Moutarde', qty: 5, unit: 'g' }
      ],
      steps: [
        'Cuire le poulet à la poêle, trancher. Couper le pain en dés et toaster.',
        'Sauce légère : moutarde + sauce soja + huile + citron.',
        'Assembler : romaine + poulet + croûtons + fromage. Napper de sauce.'
      ]
    },
    {
      id: 'R390',
      name: 'Wrap Falafel Légumes Grillés',
      emoji: '🌯', origin: '🇱🇧',
      mealTypes: ['lunch'],
      tags: ['falafel', 'végétarien', 'wrap', 'libanais', 'tendance', 'vegan'],
      difficulty: 1, prepTime: 10, cookTime: 20, servings: 1,
      // 16×4 + 46×4 + 16×9 = 64+184+144 = 392 ✓
      baseNutrition: { calories: 392, proteinGrams: 16, carbsGrams: 46, fatGrams: 16 },
      ingredients: [
        { name: 'Falafel surgelé', qty: 100, unit: 'g' },
        { name: 'Tortilla de blé', qty: 1, unit: 'pce' },
        { name: 'Houmous', qty: 40, unit: 'g' },
        { name: 'Courgette', qty: 80, unit: 'g' },
        { name: 'Poivron rouge', qty: 60, unit: 'g' },
        { name: 'Roquette', qty: 30, unit: 'g' },
        { name: 'Citron (pce)', qty: 0.5, unit: 'pce' }
      ],
      steps: [
        'Cuire les falafels au four 200°C / 18 min.',
        'Griller courgette et poivron à la poêle avec un filet d\'huile.',
        'Étaler houmous sur la tortilla. Garnir de légumes grillés + falafels + roquette + citron.'
      ]
    },
    {
      id: 'R391',
      name: 'Ceviche Crevettes Avocat',
      emoji: '🦐', origin: '🇵🇪',
      mealTypes: ['lunch', 'dinner'],
      tags: ['ceviche', 'crevettes', 'avocat', 'péruvien', 'tendance', 'frais'],
      difficulty: 2, prepTime: 20, cookTime: 0, servings: 1,
      // 24×4 + 16×4 + 14×9 = 96+64+126 = 286 ✓
      baseNutrition: { calories: 286, proteinGrams: 24, carbsGrams: 16, fatGrams: 14 },
      ingredients: [
        { name: 'Crevettes décortiquées', qty: 130, unit: 'g' },
        { name: 'Avocat', qty: 70, unit: 'g' },
        { name: 'Citron (pce)', qty: 2, unit: 'pce' },
        { name: 'Concombre', qty: 60, unit: 'g' },
        { name: 'Tomate', qty: 60, unit: 'g' },
        { name: 'Oignon vert', qty: 2, unit: 'pce' },
        { name: 'Coriandre fraîche', qty: 1, unit: 'pce' }
      ],
      steps: [
        'Blanchir les crevettes 2 min. Laisser mariner 15 min dans jus de citron (cuisson à froid).',
        'Couper avocat, concombre, tomate en dés.',
        'Mélanger tout. Garnir de coriandre et oignon vert. Servir très frais.'
      ]
    },
    {
      id: 'R392',
      name: 'Pâtes au Pesto Poulet Tomates Cerises',
      emoji: '🍝', origin: '🇮🇹',
      mealTypes: ['lunch', 'dinner'],
      tags: ['pâtes', 'pesto', 'poulet', 'italien', 'rapide', 'tendance'],
      difficulty: 1, prepTime: 8, cookTime: 15, servings: 1,
      // 38×4 + 56×4 + 14×9 = 152+224+126 = 502 ✓
      baseNutrition: { calories: 502, proteinGrams: 38, carbsGrams: 56, fatGrams: 14 },
      ingredients: [
        { name: 'Pâtes complètes fusilli', qty: 75, unit: 'g' },
        { name: 'Blanc de poulet', qty: 120, unit: 'g' },
        { name: 'Pesto vert', qty: 25, unit: 'g' },
        { name: 'Tomates cerises', qty: 80, unit: 'g' },
        { name: 'Fromage râpé', qty: 10, unit: 'g' }
      ],
      steps: [
        'Cuire les pâtes al dente. Cuire le poulet et trancher.',
        'Mélanger pâtes égouttées + pesto + poulet + tomates cerises coupées.',
        'Parsemer de fromage râpé. Servir chaud ou froid.'
      ]
    },
    {
      id: 'R393',
      name: 'Omelette Espagnole Légère',
      emoji: '🍳', origin: '🇪🇸',
      mealTypes: ['lunch', 'dinner'],
      tags: ['omelette', 'espagnol', 'pommes-de-terre', 'tortilla', 'classique', 'végétarien'],
      difficulty: 2, prepTime: 10, cookTime: 20, servings: 1,
      // 22×4 + 30×4 + 14×9 = 88+120+126 = 334 ✓
      baseNutrition: { calories: 334, proteinGrams: 22, carbsGrams: 30, fatGrams: 14 },
      ingredients: [
        { name: 'Œuf', qty: 3, unit: 'pce' },
        { name: 'Patate douce', qty: 120, unit: 'g' },
        { name: 'Oignon', qty: 60, unit: 'g' },
        { name: 'Huile d\'olive', qty: 8, unit: 'ml' },
        { name: 'Poivron rouge', qty: 60, unit: 'g' }
      ],
      steps: [
        'Cuire patate douce en rondelles fines et oignon dans l\'huile à feu doux 10 min.',
        'Ajouter poivron. Verser les œufs battus. Cuire 5 min à couvert.',
        'Retourner l\'omelette. Cuire 3 min. Servir chaud ou froid.'
      ]
    },
    {
      id: 'R394',
      name: 'Quinoa Tabboulé Oriental',
      emoji: '🌿', origin: '🇱🇧',
      mealTypes: ['lunch'],
      tags: ['quinoa', 'tabboulé', 'libanais', 'végétarien', 'frais', 'tendance'],
      difficulty: 1, prepTime: 15, cookTime: 15, servings: 1,
      // 14×4 + 46×4 + 12×9 = 56+184+108 = 348 ✓
      baseNutrition: { calories: 348, proteinGrams: 14, carbsGrams: 46, fatGrams: 12 },
      ingredients: [
        { name: 'Quinoa', qty: 70, unit: 'g' },
        { name: 'Tomate', qty: 100, unit: 'g' },
        { name: 'Concombre', qty: 80, unit: 'g' },
        { name: 'Persil frais', qty: 2, unit: 'pce' },
        { name: 'Menthe fraîche', qty: 5, unit: 'g' },
        { name: 'Citron (pce)', qty: 1, unit: 'pce' },
        { name: 'Huile d\'olive', qty: 10, unit: 'ml' }
      ],
      steps: [
        'Cuire le quinoa 12 min. Laisser refroidir complètement.',
        'Couper tomates + concombre en petits dés. Hacher persil + menthe.',
        'Mélanger quinoa + légumes + herbes. Assaisonner abondamment citron + huile + sel.'
      ]
    },
    {
      id: 'R395',
      name: 'Brick Thon Fromage Salade',
      emoji: '🥙', origin: '🇹🇳',
      mealTypes: ['lunch', 'dinner'],
      tags: ['brick', 'thon', 'tunisien', 'croustillant', 'tendance', 'high-protein'],
      difficulty: 2, prepTime: 10, cookTime: 10, servings: 1,
      // 30×4 + 22×4 + 16×9 = 120+88+144 = 352 ✓
      baseNutrition: { calories: 352, proteinGrams: 30, carbsGrams: 22, fatGrams: 16 },
      ingredients: [
        { name: 'Thon au naturel (boîte)', qty: 100, unit: 'g' },
        { name: 'Œuf', qty: 1, unit: 'pce' },
        { name: 'Fromage râpé', qty: 20, unit: 'g' },
        { name: 'Farine complète', qty: 40, unit: 'g' },
        { name: 'Salade romaine', qty: 60, unit: 'g' },
        { name: 'Tomate', qty: 60, unit: 'g' },
        { name: 'Huile d\'olive', qty: 8, unit: 'ml' }
      ],
      steps: [
        'Mélanger thon + fromage + sel/poivre. Étaler sur une feuille de brick (ou pâte fine).',
        'Casser l\'œuf au centre. Replier. Dorer à la poêle huilée 3 min par face.',
        'Servir avec salade + tomates en vinaigrette.'
      ]
    },
    {
      id: 'R396',
      name: 'Soupe Poule au Gingembre',
      emoji: '🍲', origin: '🇨🇳',
      mealTypes: ['dinner'],
      tags: ['soupe', 'poulet', 'gingembre', 'chinois', 'réconfortant', 'anti-inflammatoire'],
      difficulty: 1, prepTime: 10, cookTime: 25, servings: 1,
      // 32×4 + 22×4 + 8×9 = 128+88+72 = 288 ✓
      baseNutrition: { calories: 288, proteinGrams: 32, carbsGrams: 22, fatGrams: 8 },
      ingredients: [
        { name: 'Blanc de poulet', qty: 120, unit: 'g' },
        { name: 'Bouillon de poulet (cube)', qty: 1, unit: 'pce' },
        { name: 'Gingembre', qty: 10, unit: 'g' },
        { name: 'Ail', qty: 3, unit: 'g' },
        { name: 'Riz blanc', qty: 40, unit: 'g' },
        { name: 'Oignon vert', qty: 2, unit: 'pce' },
        { name: 'Sauce soja', qty: 10, unit: 'ml' }
      ],
      steps: [
        'Porter 600ml eau + cube bouillon + gingembre râpé + ail à ébullition.',
        'Ajouter poulet en lanières + riz. Cuire 18 min à feu moyen.',
        'Finir avec sauce soja + oignons verts. Servir brûlant.'
      ]
    },
    {
      id: 'R397',
      name: 'Steak Haché Maison Patate Douce',
      emoji: '🍔', origin: '🇫🇷',
      mealTypes: ['dinner'],
      tags: ['steak', 'boeuf', 'patate-douce', 'français', 'healthy-burger', 'high-protein'],
      difficulty: 2, prepTime: 10, cookTime: 20, servings: 1,
      // 36×4 + 36×4 + 12×9 = 144+144+108 = 396 ✓
      baseNutrition: { calories: 396, proteinGrams: 36, carbsGrams: 36, fatGrams: 12 },
      ingredients: [
        { name: 'Bœuf maigre haché', qty: 130, unit: 'g' },
        { name: 'Patate douce', qty: 180, unit: 'g' },
        { name: 'Oignon', qty: 40, unit: 'g' },
        { name: 'Moutarde', qty: 8, unit: 'g' },
        { name: 'Huile d\'olive', qty: 5, unit: 'ml' }
      ],
      steps: [
        'Cuire la patate douce en frites au four 200°C / 20 min (couper en bâtonnets, huiler).',
        'Former le steak haché avec oignon émincé + moutarde + sel/poivre.',
        'Cuire le steak à la poêle 3-4 min par face. Servir avec les frites de patate douce.'
      ]
    },
    {
      id: 'R398',
      name: 'Poulet Rôti & Légumes du Soleil',
      emoji: '🍗', origin: '🇫🇷',
      mealTypes: ['dinner'],
      tags: ['poulet', 'français', 'rôti', 'légumes', 'high-protein', 'tendance'],
      difficulty: 3, prepTime: 15, cookTime: 25, servings: 1,
      // 34×4 + 20×4 + 12×9 = 136+80+108 = 324 ✓
      baseNutrition: { calories: 324, proteinGrams: 34, carbsGrams: 20, fatGrams: 12 },
      ingredients: [
        { name: 'Blanc de poulet', qty: 130, unit: 'g' },
        { name: 'Courgette', qty: 100, unit: 'g' },
        { name: 'Tomate', qty: 100, unit: 'g' },
        { name: 'Poivron rouge', qty: 80, unit: 'g' },
        { name: 'Herbes de Provence', qty: 3, unit: 'g' },
        { name: 'Huile d\'olive', qty: 8, unit: 'ml' }
      ],
      steps: [
        'Assaisonner le blanc de poulet avec herbes de Provence, sel et huile d\'olive.',
        'Préparer la ratatouille : courgette + tomate + poivron en dés, 15 min à la poêle.',
        'Cuire le poulet au four 200°C / 20 min jusqu\'à dorure. Servir avec la ratatouille provençale.'
      ]
    },
    {
      id: 'R399',
      name: 'Maki Bowl Saumon Avocat',
      emoji: '🍱', origin: '🇯🇵',
      mealTypes: ['lunch', 'dinner'],
      tags: ['japonais', 'maki', 'saumon', 'bowl', 'tendance', 'fresh'],
      difficulty: 2, prepTime: 20, cookTime: 15, servings: 1,
      // 30×4 + 50×4 + 14×9 = 120+200+126 = 446 ✓
      baseNutrition: { calories: 446, proteinGrams: 30, carbsGrams: 50, fatGrams: 14 },
      ingredients: [
        { name: 'Riz blanc', qty: 75, unit: 'g' },
        { name: 'Vinaigre de riz', qty: 15, unit: 'ml' },
        { name: 'Saumon frais (filet)', qty: 100, unit: 'g' },
        { name: 'Avocat', qty: 60, unit: 'g' },
        { name: 'Concombre', qty: 60, unit: 'g' },
        { name: 'Nori (feuilles d\'algue)', qty: 5, unit: 'g' },
        { name: 'Sauce soja', qty: 10, unit: 'ml' },
        { name: 'Sésame (graines)', qty: 5, unit: 'g' }
      ],
      steps: [
        'Cuire le riz. Assaisonner avec vinaigre de riz + sel. Laisser tiédir.',
        'Couper saumon + avocat + concombre en dés. Ciseler le nori.',
        'Bowl : riz en base, garnitures en secteurs, nori ciselé, sauce soja, sésame.'
      ]
    },
    {
      id: 'R400',
      name: 'Power Bowl Complet du Champion',
      emoji: '🏆', origin: '🌍',
      mealTypes: ['lunch', 'dinner'],
      tags: ['power-bowl', 'complet', 'high-protein', 'champion', 'tendance', 'coloré'],
      difficulty: 2, prepTime: 20, cookTime: 20, servings: 1,
      // 45×4 + 55×4 + 16×9 = 180+220+144 = 544 ✓
      baseNutrition: { calories: 544, proteinGrams: 45, carbsGrams: 55, fatGrams: 16 },
      ingredients: [
        { name: 'Blanc de poulet', qty: 150, unit: 'g' },
        { name: 'Quinoa', qty: 60, unit: 'g' },
        { name: 'Patate douce', qty: 100, unit: 'g' },
        { name: 'Edamame (surgelé)', qty: 50, unit: 'g' },
        { name: 'Avocat', qty: 50, unit: 'g' },
        { name: 'Épinards frais', qty: 50, unit: 'g' },
        { name: 'Graines de tournesol', qty: 10, unit: 'g' },
        { name: 'Tahini', qty: 15, unit: 'g' },
        { name: 'Citron (pce)', qty: 0.5, unit: 'pce' }
      ],
      steps: [
        'Cuire quinoa (12 min) + patate douce rôtie au four (20 min) + edamames (3 min).',
        'Griller le poulet assaisonné. Sauce : tahini + citron + 2cs eau.',
        'Assembler le bowl : tous les éléments disposés en secteurs colorés. Graines de tournesol. Sauce tahini.'
      ]
    },
    {
      id: 'R401',
      name: 'Muffins Protéinés Pistache-Citron',
      emoji: '🧁', origin: '🌍',
      mealTypes: ['snack'],
      tags: ['high-protein', 'snack', 'meal-prep', 'muffin', 'pistache', 'citron', 'batch-cooking', 'vegetarian'],
      difficulty: 2, prepTime: 15, cookTime: 22, servings: 6,
      // 150×4 + 80×4 + 32×9 = 600+320+288 = 1208 ✓ (≈1200 kcal, 200 kcal/muffin)
      baseNutrition: { calories: 1208, proteinGrams: 150, carbsGrams: 80, fatGrams: 32 },
      ingredients: [
        { name: 'Whey protéine vanille', qty: 120, unit: 'g' },
        { name: 'Farine d\'avoine', qty: 100, unit: 'g' },
        { name: 'Pistaches hachées', qty: 50, unit: 'g' },
        { name: 'Fromage blanc 0%', qty: 200, unit: 'g' },
        { name: 'Œuf', qty: 3, unit: 'pce' },
        { name: 'Zeste de citron', qty: 1, unit: 'pce' },
        { name: 'Extrait de vanille', qty: 5, unit: 'ml' },
        { name: 'Levure chimique', qty: 8, unit: 'g' },
        { name: 'Érythritol (ou sucre)', qty: 30, unit: 'g' }
      ],
      steps: [
        'Préchauffer le four à 180°C. Garnir un moule à 6 muffins de caissettes papier.',
        'Mélanger farine d\'avoine, whey vanille, levure et érythritol dans un grand bol.',
        'Dans un autre bol, fouetter fromage blanc, œufs, zeste de citron râpé et extrait de vanille.',
        'Incorporer les ingrédients liquides aux secs en mélangeant délicatement. Ne pas trop travailler.',
        'Ajouter les pistaches hachées en réservant quelques morceaux pour la déco.',
        'Répartir dans les 6 moules. Parsemer des pistaches réservées. Cuire 20-22 min.',
        'Vérifier la cuisson avec un cure-dent. Laisser refroidir 10 min avant de démouler.'
      ]
    },
    {
      id: 'R402',
      name: 'Pancakes Protéinés Banane-Cannelle',
      emoji: '🥞', origin: '🇺🇸',
      mealTypes: ['breakfast', 'snack'],
      tags: ['high-protein', 'snack', 'pancakes', 'banane', 'cannelle', 'meal-prep', 'vegetarian'],
      difficulty: 1, prepTime: 10, cookTime: 15, servings: 2,
      // 60×4 + 88×4 + 14×9 = 240+352+126 = 718 ✓ (≈700 kcal, 359 kcal/portion)
      baseNutrition: { calories: 718, proteinGrams: 60, carbsGrams: 88, fatGrams: 14 },
      ingredients: [
        { name: 'Flocons d\'avoine', qty: 120, unit: 'g' },
        { name: 'Banane mûre', qty: 120, unit: 'g' },
        { name: 'Œuf', qty: 3, unit: 'pce' },
        { name: 'Whey protéine vanille', qty: 60, unit: 'g' },
        { name: 'Lait d\'amande', qty: 120, unit: 'ml' },
        { name: 'Cannelle moulue', qty: 4, unit: 'g' },
        { name: 'Levure chimique', qty: 5, unit: 'g' },
        { name: 'Huile de coco', qty: 5, unit: 'g' }
      ],
      steps: [
        'Mixer les flocons d\'avoine en farine fine au blender.',
        'Ajouter banane en morceaux, œufs, whey, lait d\'amande et cannelle. Mixer jusqu\'à pâte homogène.',
        'Laisser reposer 5 min. Ajouter levure et mélanger à la spatule.',
        'Chauffer une poêle antiadhésive à feu moyen avec un peu d\'huile de coco.',
        'Verser des louches de pâte. Cuire 2-3 min jusqu\'à formation de bulles, retourner, cuire 1-2 min.',
        'Servir chaud, empilés. Accompagner de cannelle supplémentaire, yaourt grec et quelques rondelles de banane.'
      ]
    },
    {
      id: 'R403',
      name: 'Muffins Dattes-Cajou-Chocolat',
      emoji: '🍫', origin: '🌍',
      mealTypes: ['snack'],
      tags: ['high-protein', 'snack', 'meal-prep', 'sans-sucre-ajouté', 'dattes', 'chocolat', 'batch-cooking', 'vegan-friendly'],
      difficulty: 2, prepTime: 20, cookTime: 20, servings: 8,
      // 128×4 + 110×4 + 46×9 = 512+440+414 = 1366 ✓ (≈1360 kcal, 170 kcal/muffin)
      baseNutrition: { calories: 1366, proteinGrams: 128, carbsGrams: 110, fatGrams: 46 },
      ingredients: [
        { name: 'Dattes Medjool (dénoyautées)', qty: 160, unit: 'g' },
        { name: 'Noix de cajou (crues)', qty: 80, unit: 'g' },
        { name: 'Whey protéine chocolat', qty: 120, unit: 'g' },
        { name: 'Cacao non sucré', qty: 40, unit: 'g' },
        { name: 'Farine d\'avoine', qty: 80, unit: 'g' },
        { name: 'Œuf', qty: 4, unit: 'pce' },
        { name: 'Lait d\'amande', qty: 100, unit: 'ml' },
        { name: 'Levure chimique', qty: 8, unit: 'g' },
        { name: 'Extrait de vanille', qty: 5, unit: 'ml' }
      ],
      steps: [
        'Préchauffer le four à 175°C. Garnir un moule à 8 muffins.',
        'Faire tremper les dattes dans l\'eau chaude 10 min. Égoutter et mixer en purée lisse.',
        'Torréfier les noix de cajou à sec 3 min à la poêle. Hacher grossièrement.',
        'Mélanger farine d\'avoine, whey chocolat, cacao et levure.',
        'Fouetter œufs avec purée de dattes, lait d\'amande et vanille.',
        'Incorporer l\'appareil humide aux secs. Ajouter les cajous hachés. Mélanger délicatement.',
        'Répartir dans les 8 moules. Cuire 18-20 min. Refroidir sur grille avant dégustation.'
      ]
    },
    {
      id: 'R404',
      name: 'Pancakes Protéinés Myrtilles-Avoine',
      emoji: '🫐', origin: '🇺🇸',
      mealTypes: ['breakfast', 'snack'],
      tags: ['high-protein', 'snack', 'pancakes', 'myrtilles', 'avoine', 'skyr', 'antioxydants', 'vegetarian'],
      difficulty: 1, prepTime: 10, cookTime: 15, servings: 2,
      // 56×4 + 100×4 + 16×9 = 224+400+144 = 768 ✓ (≈760 kcal, 384 kcal/portion)
      baseNutrition: { calories: 768, proteinGrams: 56, carbsGrams: 100, fatGrams: 16 },
      ingredients: [
        { name: 'Flocons d\'avoine', qty: 100, unit: 'g' },
        { name: 'Skyr nature', qty: 200, unit: 'g' },
        { name: 'Œuf', qty: 3, unit: 'pce' },
        { name: 'Myrtilles fraîches ou surgelées', qty: 100, unit: 'g' },
        { name: 'Lait d\'amande', qty: 80, unit: 'ml' },
        { name: 'Levure chimique', qty: 5, unit: 'g' },
        { name: 'Miel', qty: 15, unit: 'g' },
        { name: 'Yaourt grec 0%', qty: 80, unit: 'g' }
      ],
      steps: [
        'Mixer flocons en farine. Mélanger avec levure.',
        'Fouetter skyr, œufs et lait d\'amande. Incorporer aux secs. Laisser reposer 5 min.',
        'Incorporer délicatement les myrtilles à la pâte (réserver quelques-unes pour la garniture).',
        'Cuire à feu moyen dans une poêle légèrement huilée, 2-3 min par face.',
        'Sauce : mélanger yaourt grec + miel. Servir les pancakes nappés de sauce et des myrtilles réservées.'
      ]
    },
    {
      id: 'R405',
      name: 'Muffins Protéinés Carotte-Noix',
      emoji: '🥕', origin: '🇫🇷',
      mealTypes: ['snack'],
      tags: ['high-protein', 'snack', 'meal-prep', 'carrot-cake', 'noix', 'cannelle', 'batch-cooking', 'vegetarian'],
      difficulty: 2, prepTime: 20, cookTime: 20, servings: 6,
      // 120×4 + 84×4 + 36×9 = 480+336+324 = 1140 ✓ (≈1140 kcal, 190 kcal/muffin)
      baseNutrition: { calories: 1140, proteinGrams: 120, carbsGrams: 84, fatGrams: 36 },
      ingredients: [
        { name: 'Whey protéine vanille', qty: 100, unit: 'g' },
        { name: 'Farine d\'avoine', qty: 100, unit: 'g' },
        { name: 'Carottes râpées', qty: 200, unit: 'g' },
        { name: 'Noix hachées', qty: 50, unit: 'g' },
        { name: 'Fromage blanc 0%', qty: 150, unit: 'g' },
        { name: 'Œuf', qty: 3, unit: 'pce' },
        { name: 'Cannelle moulue', qty: 5, unit: 'g' },
        { name: 'Gingembre moulu', qty: 2, unit: 'g' },
        { name: 'Muscade moulue', qty: 1, unit: 'g' },
        { name: 'Levure chimique', qty: 8, unit: 'g' },
        { name: 'Érythritol (ou sucre)', qty: 30, unit: 'g' }
      ],
      steps: [
        'Préchauffer le four à 180°C. Préparer un moule à 6 muffins.',
        'Râper finement les carottes. Hacher grossièrement les noix.',
        'Mélanger farine d\'avoine, whey, levure, érythritol, cannelle, gingembre et muscade.',
        'Fouetter fromage blanc et œufs. Ajouter les carottes râpées et bien mélanger.',
        'Incorporer le mélange humide aux secs en quelques coups de spatule. Ajouter les noix.',
        'Répartir dans les moules. Cuire 20-22 min. Vérifier la cuisson avec un cure-dent.',
        'Laisser refroidir complètement. Optionnel : glacer avec un voile de fromage frais allégé et cannelle.'
      ]
    },
    {
      id: 'R406',
      name: 'Pancakes Soufflés Japonais Protéinés Matcha',
      emoji: '🍵', origin: '🇯🇵',
      mealTypes: ['breakfast', 'snack'],
      tags: ['high-protein', 'snack', 'pancakes', 'matcha', 'japonais', 'souffle', 'tendance', 'instagrammable', 'vegetarian'],
      difficulty: 2, prepTime: 15, cookTime: 15, servings: 1,
      // 30×4 + 30×4 + 10×9 = 120+120+90 = 330 ✓ (≈320 kcal)
      baseNutrition: { calories: 330, proteinGrams: 30, carbsGrams: 30, fatGrams: 10 },
      ingredients: [
        { name: 'Blanc d\'œuf', qty: 120, unit: 'g' },
        { name: 'Fromage blanc 0%', qty: 100, unit: 'g' },
        { name: 'Whey protéine neutre', qty: 30, unit: 'g' },
        { name: 'Farine de riz', qty: 20, unit: 'g' },
        { name: 'Matcha en poudre (qualité culinaire)', qty: 5, unit: 'g' },
        { name: 'Jaune d\'œuf', qty: 1, unit: 'pce' },
        { name: 'Miel', qty: 8, unit: 'g' },
        { name: 'Levure chimique', qty: 2, unit: 'g' }
      ],
      steps: [
        'Fouetter jaune d\'œuf + fromage blanc + miel + matcha jusqu\'à homogène. Ajouter farine de riz, whey et levure.',
        'Monter les blancs d\'œufs en neige très ferme (pointes dressées). C\'est la clé de la texture soufflée.',
        'Incorporer ¼ des blancs en neige vigoureusement pour détendre la base, puis plier délicatement le reste en 2 fois.',
        'Chauffer une poêle à couvercle à feu très doux. Huiler légèrement.',
        'Déposer des cercles épais de pâte (3 pancakes). Ajouter quelques gouttes d\'eau sur le côté, couvrir. Cuire 4-5 min.',
        'Retourner très délicatement. Couvrir. Cuire encore 3-4 min.',
        'Servir immédiatement saupoudrés de matcha, sucre glace (léger) et myrtilles fraîches.'
      ]
    },
    {
      id: 'R407',
      name: 'French Toast Protéiné Figues & Amandes',
      emoji: '🍞', origin: '🇫🇷',
      mealTypes: ['breakfast', 'snack'],
      tags: ['high-protein', 'snack', 'french-toast', 'figues', 'amandes', 'élégant', 'tendance', 'vegetarian'],
      difficulty: 1, prepTime: 10, cookTime: 10, servings: 1,
      // 32×4 + 44×4 + 13×9 = 128+176+117 = 421 ✓ (≈420 kcal)
      baseNutrition: { calories: 421, proteinGrams: 32, carbsGrams: 44, fatGrams: 13 },
      ingredients: [
        { name: 'Pain complet épais (type pain de mie)', qty: 100, unit: 'g' },
        { name: 'Œuf', qty: 2, unit: 'pce' },
        { name: 'Whey protéine vanille', qty: 25, unit: 'g' },
        { name: 'Lait d\'amande', qty: 80, unit: 'ml' },
        { name: 'Figues séchées', qty: 40, unit: 'g' },
        { name: 'Amandes effilées', qty: 15, unit: 'g' },
        { name: 'Miel', qty: 10, unit: 'g' },
        { name: 'Cannelle moulue', qty: 2, unit: 'g' },
        { name: 'Extrait de vanille', qty: 3, unit: 'ml' }
      ],
      steps: [
        'Fouetter vigoureusement œufs, lait d\'amande, whey vanille, vanille et cannelle dans un plat creux.',
        'Tremper les tranches de pain épais dans l\'appareil 2 min de chaque côté pour bien imbiber.',
        'Dorer dans une poêle antiadhésive à feu moyen 3-4 min par face, jusqu\'à belle couleur dorée.',
        'Pendant ce temps, torréfier les amandes effilées à sec dans une petite poêle 2-3 min.',
        'Couper les figues séchées en quartiers.',
        'Servir le french toast nappé de miel, garni de figues et amandes effilées torréfiées. Saupoudrer de cannelle.'
      ]
    },

    {
      id: 'R408',
      name: 'Granola Protéiné Pistache-Coco-Miel',
      emoji: '🥣', origin: '🌿',
      mealTypes: ['snack'],
      tags: ['high-protein', 'snack', 'meal-prep', 'granola', 'pistache', 'coco', 'croustillant'],
      difficulty: 1, prepTime: 10, cookTime: 25, servings: 10,
      // 150×4 + 260×4 + 90×9 = 600+1040+810 = 2450 ✓ (TOTAL 10 portions)
      baseNutrition: { calories: 2450, proteinGrams: 150, carbsGrams: 260, fatGrams: 90 },
      ingredients: [
        { name: 'Flocons d\'avoine', qty: 400, unit: 'g' },
        { name: 'Whey vanille', qty: 100, unit: 'g' },
        { name: 'Pistaches concassées', qty: 80, unit: 'g' },
        { name: 'Noix de coco râpée', qty: 60, unit: 'g' },
        { name: 'Miel', qty: 80, unit: 'g' },
        { name: 'Huile de coco fondue', qty: 40, unit: 'g' },
        { name: 'Sel', qty: 2, unit: 'g' }
      ],
      steps: [
        'Préchauffer le four à 160°C. Mélanger flocons d\'avoine, whey vanille, noix de coco et sel dans un grand bol.',
        'Dans un bol séparé, mélanger le miel fondu et l\'huile de coco. Verser sur le mélange sec et bien enrober.',
        'Étaler uniformément sur une plaque recouverte de papier sulfurisé. Parsemer les pistaches concassées par-dessus.',
        'Cuire 20-25 min en remuant doucement à mi-cuisson pour former des clusters généreux. Surveiller la couleur dorée.',
        'Laisser refroidir complètement sans remuer (crucial pour le croustillant). Conserver en boîte hermétique 2 semaines.'
      ]
    },

    {
      id: 'R409',
      name: 'Granola Protéiné Chocolat-Noisette',
      emoji: '🍫', origin: '🌰',
      mealTypes: ['snack'],
      tags: ['high-protein', 'snack', 'meal-prep', 'granola', 'chocolat', 'noisette', 'ferrero-style'],
      difficulty: 1, prepTime: 10, cookTime: 25, servings: 10,
      // 140×4 + 260×4 + 80×9 = 560+1040+720 = 2320 ✓ (TOTAL 10 portions)
      baseNutrition: { calories: 2320, proteinGrams: 140, carbsGrams: 260, fatGrams: 80 },
      ingredients: [
        { name: 'Flocons d\'avoine', qty: 380, unit: 'g' },
        { name: 'Whey chocolat', qty: 100, unit: 'g' },
        { name: 'Noisettes entières', qty: 100, unit: 'g' },
        { name: 'Cacao pur non sucré', qty: 20, unit: 'g' },
        { name: 'Sirop d\'érable', qty: 80, unit: 'ml' },
        { name: 'Beurre de noisette', qty: 60, unit: 'g' },
        { name: 'Huile de coco fondue', qty: 20, unit: 'g' },
        { name: 'Sel', qty: 2, unit: 'g' }
      ],
      steps: [
        'Préchauffer le four à 160°C. Mélanger flocons, whey chocolat, cacao et sel. Hacher grossièrement les noisettes.',
        'Faire fondre doucement le beurre de noisette avec le sirop d\'érable et l\'huile de coco. Verser sur le mélange sec.',
        'Incorporer les noisettes et mélanger jusqu\'à enrobage uniforme. Étaler en couche épaisse sur plaque sulfurisée.',
        'Cuire 22-25 min en retournant à mi-cuisson. Former des gros clusters style "Ferrero Rocher" avant refroidissement.',
        'Refroidir totalement avant de briser en morceaux. Conserver hermétiquement jusqu\'à 2 semaines.'
      ]
    },

    {
      id: 'R410',
      name: 'Barres Protéinées Dattes-Amandes-Cannelle',
      emoji: '🍬', origin: '🌴',
      mealTypes: ['snack'],
      tags: ['high-protein', 'snack', 'meal-prep', 'no-bake', 'dattes', 'amandes', 'naturel', 'sans-cuisson'],
      difficulty: 1, prepTime: 20, cookTime: 0, servings: 10,
      // 120×4 + 280×4 + 50×9 = 480+1120+450 = 2050 ✓ (TOTAL 10 barres)
      baseNutrition: { calories: 2050, proteinGrams: 120, carbsGrams: 280, fatGrams: 50 },
      ingredients: [
        { name: 'Dattes Medjool dénoyautées', qty: 300, unit: 'g' },
        { name: 'Amandes entières', qty: 150, unit: 'g' },
        { name: 'Whey vanille', qty: 100, unit: 'g' },
        { name: 'Flocons d\'avoine', qty: 100, unit: 'g' },
        { name: 'Cannelle moulue', qty: 5, unit: 'g' },
        { name: 'Sel de mer', qty: 2, unit: 'g' },
        { name: 'Eau', qty: 20, unit: 'ml' }
      ],
      steps: [
        'Mixer les amandes en grossier dans un robot. Réserver. Mixer les dattes jusqu\'à obtenir une pâte collante.',
        'Ajouter whey vanille, flocons d\'avoine, cannelle et sel à la pâte de dattes. Mixer brièvement pour combiner.',
        'Incorporer les amandes concassées. Si trop sec, ajouter l\'eau cuillère à soupe par cuillère jusqu\'à cohésion.',
        'Presser uniformément dans un moule rectangulaire tapissé de film alimentaire sur 2 cm d\'épaisseur.',
        'Réfrigérer 2h minimum. Couper en 10 barres égales. Conserver au frigo 1 semaine ou congeler 3 mois.'
      ]
    },

    {
      id: 'R411',
      name: 'Barres Protéinées Pistache-Citron Vert-Cajou',
      emoji: '💚', origin: '🌿',
      mealTypes: ['snack'],
      tags: ['high-protein', 'snack', 'meal-prep', 'no-bake', 'pistache', 'cajou', 'citron-vert', 'vegan-option'],
      difficulty: 1, prepTime: 20, cookTime: 0, servings: 8,
      // 112×4 + 144×4 + 80×9 = 448+576+720 = 1744 ✓ (TOTAL 8 barres)
      baseNutrition: { calories: 1744, proteinGrams: 112, carbsGrams: 144, fatGrams: 80 },
      ingredients: [
        { name: 'Noix de cajou crues', qty: 180, unit: 'g' },
        { name: 'Pistaches décortiquées', qty: 80, unit: 'g' },
        { name: 'Protéine de pois neutre (ou whey neutre)', qty: 80, unit: 'g' },
        { name: 'Zeste de citron vert', qty: 10, unit: 'g' },
        { name: 'Jus de citron vert', qty: 30, unit: 'ml' },
        { name: 'Huile de coco fondue', qty: 30, unit: 'g' },
        { name: 'Sirop d\'agave', qty: 40, unit: 'ml' },
        { name: 'Sel', qty: 1, unit: 'g' }
      ],
      steps: [
        'Mixer les noix de cajou jusqu\'à obtenir une farine grossière. Concasser légèrement les pistaches et réserver.',
        'Ajouter protéine de pois, zeste, jus de citron vert, sirop d\'agave et sel. Mixer brièvement pour combiner.',
        'Verser l\'huile de coco fondue et mixer jusqu\'à obtenir une pâte qui se tient. Incorporer les pistaches à la main.',
        'Étaler dans un moule tapissé de papier sulfurisé sur 1,5 cm d\'épaisseur. Décorer de pistaches entières.',
        'Réfrigérer 1h30. Couper en 8 barres. Conserver au frigo 5 jours. Texture "Larabar" premium.'
      ]
    },

    {
      id: 'R412',
      name: 'Barres Chocolat-Caramel Protéinées "Twix Sain"',
      emoji: '🍫', origin: '🏅',
      mealTypes: ['snack'],
      tags: ['high-protein', 'snack', 'meal-prep', 'chocolat', 'caramel', 'twix', 'indulgent', 'premium'],
      difficulty: 2, prepTime: 25, cookTime: 15, servings: 8,
      // 128×4 + 192×4 + 96×9 = 512+768+864 = 2144 ✓ (TOTAL 8 barres)
      baseNutrition: { calories: 2144, proteinGrams: 128, carbsGrams: 192, fatGrams: 96 },
      ingredients: [
        { name: 'Flocons d\'avoine (base biscuit)', qty: 160, unit: 'g' },
        { name: 'Whey vanille (base biscuit)', qty: 60, unit: 'g' },
        { name: 'Beurre d\'amande (base biscuit)', qty: 60, unit: 'g' },
        { name: 'Dattes Medjool (caramel)', qty: 120, unit: 'g' },
        { name: 'Beurre de cacahuète (caramel)', qty: 60, unit: 'g' },
        { name: 'Lait de coco (caramel)', qty: 40, unit: 'ml' },
        { name: 'Chocolat noir 70% (enrobage)', qty: 120, unit: 'g' },
        { name: 'Fleur de sel', qty: 2, unit: 'g' }
      ],
      steps: [
        'Base biscuit : mixer flocons + whey + beurre d\'amande + 2cs eau jusqu\'à obtenir une pâte homogène. Presser dans moule tapissé de 2 cm.',
        'Cuire la base 12 min à 175°C jusqu\'à légère dorure. Laisser refroidir complètement.',
        'Caramel : mixer dattes + beurre de cacahuète + lait de coco jusqu\'à consistance lisse et collante.',
        'Étaler le caramel sur la base refroidie en couche uniforme d\'1 cm. Réfrigérer 30 min.',
        'Faire fondre le chocolat noir au bain-marie. Couper en 8 barres, enrober chacune de chocolat. Déposer sur grille, saupoudrer de fleur de sel. Réfrigérer 45 min.'
      ]
    },

    {
      id: 'R413',
      name: 'Barres Protéinées Mangue-Gingembre-Cajou',
      emoji: '🥭', origin: '🌏',
      mealTypes: ['snack'],
      tags: ['high-protein', 'snack', 'meal-prep', 'no-bake', 'mangue', 'gingembre', 'cajou', 'exotique', 'tropical'],
      difficulty: 1, prepTime: 20, cookTime: 0, servings: 8,
      // 88×4 + 176×4 + 72×9 = 352+704+648 = 1704 ✓ (TOTAL 8 barres)
      baseNutrition: { calories: 1704, proteinGrams: 88, carbsGrams: 176, fatGrams: 72 },
      ingredients: [
        { name: 'Noix de cajou crues', qty: 200, unit: 'g' },
        { name: 'Mangue séchée non sucrée', qty: 120, unit: 'g' },
        { name: 'Whey vanille', qty: 80, unit: 'g' },
        { name: 'Gingembre frais râpé', qty: 15, unit: 'g' },
        { name: 'Huile de coco fondue', qty: 25, unit: 'g' },
        { name: 'Miel', qty: 30, unit: 'g' },
        { name: 'Sel', qty: 1, unit: 'g' }
      ],
      steps: [
        'Couper la mangue séchée en petits morceaux. Mixer les noix de cajou en grossier dans un robot.',
        'Ajouter whey vanille, gingembre râpé, miel, huile de coco et sel. Mixer brièvement pour combiner.',
        'Incorporer les morceaux de mangue séchée et mélanger à la main pour les répartir uniformément dans la pâte.',
        'La pâte doit se tenir : si trop sèche, ajouter 1cs d\'eau ; si trop collante, ajouter un peu plus de whey.',
        'Étaler dans moule tapissé sur 1,5 cm, réfrigérer 2h. Couper en 8 barres. Conserver 1 semaine au frigo.'
      ]
    },

    {
      id: 'R414',
      name: 'Granola Bowl Protéiné du Matin',
      emoji: '🌅', origin: '🌍',
      mealTypes: ['breakfast', 'snack'],
      tags: ['high-protein', 'breakfast', 'snack', 'bowl', 'granola', 'skyr', 'myrtilles', 'meal-prep', 'premium'],
      difficulty: 1, prepTime: 5, cookTime: 0, servings: 1,
      // 35×4 + 55×4 + 12×9 = 140+220+108 = 468 ✓ (TOTAL 1 portion)
      baseNutrition: { calories: 468, proteinGrams: 35, carbsGrams: 55, fatGrams: 12 },
      ingredients: [
        { name: 'Granola pistache-coco (R408)', qty: 60, unit: 'g' },
        { name: 'Skyr nature', qty: 200, unit: 'g' },
        { name: 'Myrtilles fraîches ou surgelées décongelées', qty: 60, unit: 'g' },
        { name: 'Framboises fraîches', qty: 40, unit: 'g' },
        { name: 'Graines de chia', qty: 10, unit: 'g' },
        { name: 'Miel', qty: 10, unit: 'g' }
      ],
      steps: [
        'Verser le skyr dans un bol large. Lisser avec une cuillère pour un effet crémeux et uniforme.',
        'Déposer le granola pistache-coco sur le côté du bol pour préserver son croustillant jusqu\'au service.',
        'Disposer les myrtilles et framboises en secteurs colorés. Saupoudrer les graines de chia.',
        'Drizzler le miel en filet sur l\'ensemble. Servir immédiatement pour profiter du contraste croustillant/crémeux.'
      ]
    },

    {
      id: 'R415',
      name: 'Energy Balls Chocolat-Pistache-Fleur de Sel',
      emoji: '🍫', origin: '🌍',
      mealTypes: ['snack'],
      tags: ['high-protein', 'snack', 'no-bake', 'energy-ball', 'chocolat', 'pistache', 'original'],
      difficulty: 1, prepTime: 25, cookTime: 0, servings: 12,
      // 112×4 + 98×4 + 82×9 = 448+392+738 = 1578 ✓
      baseNutrition: { calories: 1578, proteinGrams: 112, carbsGrams: 98, fatGrams: 82 },
      ingredients: [
        { name: 'Dattes Medjool (dénoyautées)', qty: 200, unit: 'g' },
        { name: 'Amandes', qty: 100, unit: 'g' },
        { name: 'Whey protéine chocolat', qty: 60, unit: 'g' },
        { name: 'Pistaches non salées', qty: 60, unit: 'g' },
        { name: 'Cacao en poudre non sucré', qty: 20, unit: 'g' },
        { name: 'Fleur de sel', qty: 2, unit: 'g' },
        { name: 'Extrait de vanille', qty: 5, unit: 'ml' }
      ],
      steps: [
        'Mixer les amandes en poudre grossière. Réserver 30g de pistaches concassées pour l\'enrobage.',
        'Mixer les dattes Medjool jusqu\'à obtenir une pâte collante. Ajouter amandes, whey chocolat, cacao, vanille et fleur de sel. Mixer jusqu\'à homogénéité.',
        'Diviser en 14 portions égales (~35g). Rouler en boules de 2 cm de diamètre entre les paumes.',
        'Rouler chaque ball dans les pistaches concassées ou le cacao en poudre. Réfrigérer 1h avant dégustation. Conservation : 7 jours au frigo.'
      ]
    },

    {
      id: 'R416',
      name: 'Energy Balls Cacahuète-Avoine-Miel "PB&J"',
      emoji: '🥜', origin: '🇺🇸',
      mealTypes: ['snack'],
      tags: ['high-protein', 'snack', 'no-bake', 'energy-ball', 'cacahuète', 'avoine', 'miel', 'peanut-butter'],
      difficulty: 1, prepTime: 20, cookTime: 0, servings: 12,
      // 108×4 + 120×4 + 66×9 = 432+480+594 = 1506 ✓
      baseNutrition: { calories: 1506, proteinGrams: 108, carbsGrams: 120, fatGrams: 66 },
      ingredients: [
        { name: 'Flocons d\'avoine', qty: 120, unit: 'g' },
        { name: 'Beurre de cacahuète naturel', qty: 130, unit: 'g' },
        { name: 'Miel', qty: 40, unit: 'g' },
        { name: 'Whey protéine vanille', qty: 60, unit: 'g' },
        { name: 'Cranberries séchées', qty: 40, unit: 'g' }
      ],
      steps: [
        'Mélanger beurre de cacahuète et miel dans un saladier. Chauffer 30 sec au micro-ondes pour faciliter le mélange.',
        'Incorporer les flocons d\'avoine, la whey vanille et les cranberries séchées. Mélanger jusqu\'à obtenir une pâte homogène.',
        'Si trop collante, réfrigérer 20 min. Former 12 boules compactes (~50g chacune) en pressant fermement.',
        'Déposer sur une plaque tapissée de papier cuisson. Réfrigérer au moins 30 min. Conservation : 10 jours au frigo.'
      ]
    },

    {
      id: 'R417',
      name: 'Cheesecake Protéiné Citron-Framboise No-Bake',
      emoji: '🍋', origin: '🇺🇸',
      mealTypes: ['snack'],
      tags: ['high-protein', 'snack', 'dessert', 'no-bake', 'cheesecake', 'citron', 'framboise', 'premium', 'dessert-protéiné'],
      difficulty: 2, prepTime: 30, cookTime: 0, servings: 6,
      // 132×4 + 114×4 + 78×9 = 528+456+702 = 1686 ✓
      baseNutrition: { calories: 1686, proteinGrams: 132, carbsGrams: 114, fatGrams: 78 },
      ingredients: [
        { name: 'Dattes Medjool (dénoyautées)', qty: 80, unit: 'g' },
        { name: 'Amandes', qty: 60, unit: 'g' },
        { name: 'Noix de cajou', qty: 40, unit: 'g' },
        { name: 'Cream cheese allégé', qty: 200, unit: 'g' },
        { name: 'Skyr nature', qty: 300, unit: 'g' },
        { name: 'Whey protéine vanille', qty: 60, unit: 'g' },
        { name: 'Jus de citron', qty: 40, unit: 'ml' },
        { name: 'Zeste de citron (pce)', qty: 1, unit: 'pce' },
        { name: 'Framboises fraîches', qty: 150, unit: 'g' },
        { name: 'Miel', qty: 20, unit: 'g' }
      ],
      steps: [
        'Base : mixer dattes + amandes + cajou jusqu\'à obtenir une pâte collante. Presser uniformément au fond d\'un moule 20cm tapissé de papier sulfurisé.',
        'Crème : fouetter cream cheese allégé + skyr + whey vanille + jus et zeste de citron + miel jusqu\'à obtenir un appareil lisse et aérien.',
        'Verser la crème sur la base. Lisser. Filmer et réfrigérer minimum 4h (idéalement une nuit).',
        'Coulis : mixer 100g de framboises avec quelques gouttes de citron. Verser sur le cheesecake froid. Décorer avec les framboises entières restantes. Couper en 6 parts.'
      ]
    },

    {
      id: 'R418',
      name: 'Cookies Protéinés Double Chocolat-Noix de Cajou',
      emoji: '🍪', origin: '🇺🇸',
      mealTypes: ['snack'],
      tags: ['high-protein', 'snack', 'cookies', 'chocolat', 'cajou', 'baked', 'moelleux', 'premium'],
      difficulty: 2, prepTime: 15, cookTime: 12, servings: 10,
      // 120×4 + 140×4 + 82×9 = 480+560+738 = 1778 ✓
      baseNutrition: { calories: 1778, proteinGrams: 120, carbsGrams: 140, fatGrams: 82 },
      ingredients: [
        { name: 'Farine d\'avoine', qty: 120, unit: 'g' },
        { name: 'Whey protéine chocolat', qty: 80, unit: 'g' },
        { name: 'Beurre de cajou', qty: 100, unit: 'g' },
        { name: 'Œuf', qty: 2, unit: 'pce' },
        { name: 'Cacao en poudre non sucré', qty: 20, unit: 'g' },
        { name: 'Pépites de chocolat noir 70%', qty: 60, unit: 'g' },
        { name: 'Sel de mer', qty: 2, unit: 'g' },
        { name: 'Bicarbonate de soude', qty: 3, unit: 'g' }
      ],
      steps: [
        'Préchauffer le four à 175°C. Mélanger beurre de cajou + œufs jusqu\'à consistance crémeuse.',
        'Incorporer farine d\'avoine, whey chocolat, cacao, sel et bicarbonate. Mélanger sans excès. Ajouter les pépites de chocolat.',
        'Former 10 boules (~55g). Déposer sur plaque avec papier cuisson. Aplatir légèrement. Saupoudrer d\'une pincée de sel de mer.',
        'Cuire 10-12 min. Le centre doit paraître légèrement sous-cuit : il se raffermira en refroidissant. Laisser refroidir 10 min sur la plaque avant de déguster.'
      ]
    },

    {
      id: 'R419',
      name: 'Smoothie Bowl Protéiné Açaï-Mangue',
      emoji: '🫐', origin: '🇧🇷',
      mealTypes: ['breakfast', 'snack'],
      tags: ['high-protein', 'snack', 'breakfast', 'smoothie-bowl', 'açaï', 'mangue', 'no-bake', 'tendance', 'coloré'],
      difficulty: 1, prepTime: 10, cookTime: 0, servings: 1,
      // 28×4 + 46×4 + 14×9 = 112+184+126 = 422 ✓
      baseNutrition: { calories: 422, proteinGrams: 28, carbsGrams: 46, fatGrams: 14 },
      ingredients: [
        { name: 'Purée d\'açaï surgelée', qty: 100, unit: 'g' },
        { name: 'Mangue congelée', qty: 100, unit: 'g' },
        { name: 'Banane congelée', qty: 80, unit: 'g' },
        { name: 'Whey protéine vanille', qty: 30, unit: 'g' },
        { name: 'Lait de coco léger', qty: 60, unit: 'ml' },
        { name: 'Granola nature', qty: 25, unit: 'g' },
        { name: 'Noix de cajou', qty: 10, unit: 'g' },
        { name: 'Noix de coco râpée', qty: 5, unit: 'g' },
        { name: 'Myrtilles fraîches', qty: 30, unit: 'g' },
        { name: 'Miel', qty: 5, unit: 'g' }
      ],
      steps: [
        'Mixer açaï + mangue congelée + banane congelée + whey vanille + lait de coco jusqu\'à obtenir une texture épaisse, crémeuse et lisse. Utiliser le minimum de liquide.',
        'Verser dans un bol profond. La texture doit être suffisamment épaisse pour tenir une cuillère droite.',
        'Disposer les toppings en rangées harmonieuses : granola, noix de cajou, noix de coco râpée, myrtilles fraîches. Finir par un filet de miel. Servir immédiatement.'
      ]
    },

    {
      id: 'R420',
      name: 'Brownie Protéiné Patate Douce & Noix de Cajou',
      emoji: '🍠', origin: '🌍',
      mealTypes: ['snack'],
      tags: ['high-protein', 'snack', 'brownie', 'patate-douce', 'cajou', 'sans-farine', 'sans-sucre-ajouté', 'fudgey'],
      difficulty: 2, prepTime: 20, cookTime: 20, servings: 9,
      // 108×4 + 102×4 + 68×9 = 432+408+612 = 1452 ✓
      baseNutrition: { calories: 1452, proteinGrams: 108, carbsGrams: 102, fatGrams: 68 },
      ingredients: [
        { name: 'Patate douce (cuite, en purée)', qty: 300, unit: 'g' },
        { name: 'Whey protéine chocolat', qty: 80, unit: 'g' },
        { name: 'Cacao en poudre non sucré', qty: 30, unit: 'g' },
        { name: 'Beurre de cajou', qty: 80, unit: 'g' },
        { name: 'Œuf', qty: 3, unit: 'pce' },
        { name: 'Noix de cajou concassées', qty: 50, unit: 'g' },
        { name: 'Sel de mer', qty: 2, unit: 'g' },
        { name: 'Extrait de vanille', qty: 5, unit: 'ml' }
      ],
      steps: [
        'Préchauffer le four à 170°C. Cuire la patate douce à la vapeur ou au four, éplucher et réduire en purée lisse.',
        'Mélanger purée tiède + beurre de cajou + œufs + vanille jusqu\'à homogénéité. Ajouter whey chocolat, cacao et sel. Mélanger sans excès.',
        'Verser dans un moule carré 20×20cm tapissé de papier sulfurisé. Parsemer de noix de cajou concassées. Appuyer légèrement.',
        'Cuire 22-25 min. Le centre doit être encore légèrement tremblotant. Laisser refroidir complètement avant de découper en 9 carrés. Réfrigérer pour une texture fudgey optimale.'
      ]
    },

    {
      id: 'R421',
      name: 'Bouchées Protéinées Coco-Matcha "Raffaello Vert"',
      emoji: '🍵', origin: '🇯🇵',
      mealTypes: ['snack'],
      tags: ['high-protein', 'snack', 'no-bake', 'matcha', 'coco', 'cajou', 'premium', 'original', 'raffaello'],
      difficulty: 2, prepTime: 30, cookTime: 0, servings: 12,
      // 60×4 + 72×4 + 60×9 = 240+288+540 = 1068 ✓
      baseNutrition: { calories: 1068, proteinGrams: 60, carbsGrams: 72, fatGrams: 60 },
      ingredients: [
        { name: 'Noix de cajou entières', qty: 12, unit: 'pce' },
        { name: 'Noix de cajou', qty: 120, unit: 'g' },
        { name: 'Whey protéine neutre (sans arôme)', qty: 40, unit: 'g' },
        { name: 'Huile de coco', qty: 20, unit: 'g' },
        { name: 'Matcha en poudre (qualité culinaire)', qty: 8, unit: 'g' },
        { name: 'Noix de coco râpée', qty: 60, unit: 'g' },
        { name: 'Miel', qty: 20, unit: 'g' }
      ],
      steps: [
        'Mixer 120g de noix de cajou jusqu\'à obtenir une pâte lisse. Ajouter whey neutre, huile de coco fondue, matcha et miel. Mixer jusqu\'à homogénéité. La pâte doit être souple et non collante.',
        'Si trop molle, réfrigérer 20 min. Prélever ~25g de pâte, former un disque, placer une noix de cajou entière au centre, refermer et rouler en boule parfaite.',
        'Rouler chaque bouchée dans la noix de coco râpée pour obtenir l\'enrobage blanc caractéristique. Appuyer légèrement pour que la coco adhère.',
        'Disposer sur une plaque. Réfrigérer 1h minimum. Les bouchées se bonifient le lendemain. Conservation : 10 jours au frigo.'
      ]
    },

    {
      id: 'R422',
      name: 'Panna Cotta Légère Vanille-Fruits Rouges',
      emoji: '🍮', origin: '🇮🇹',
      mealTypes: ['snack'],
      tags: ['snack', 'dessert', 'healthy', 'high-protein', 'maroc', 'sans-cuisson', 'léger', 'élégant'],
      difficulty: 1, prepTime: 15, cookTime: 10, servings: 4,
      // P×4 + G×4 + L×9 = 48×4 + 100×4 + 20×9 = 192 + 400 + 180 = 772 kcal ✓
      baseNutrition: { calories: 772, proteinGrams: 48, carbsGrams: 100, fatGrams: 20 },
      ingredients: [
        { name: 'Fromage blanc 0%', qty: 400, unit: 'g' },
        { name: 'Lait demi-écrémé', qty: 200, unit: 'ml' },
        { name: 'Gélatine en feuilles', qty: 8, unit: 'g' },
        { name: 'Miel', qty: 40, unit: 'g' },
        { name: 'Extrait de vanille', qty: 5, unit: 'ml' },
        { name: 'Fruits rouges surgelés (framboises/myrtilles)', qty: 200, unit: 'g' },
        { name: 'Citron (jus)', qty: 15, unit: 'ml' },
        { name: 'Stevia', qty: 2, unit: 'g' }
      ],
      steps: [
        'Faire tremper les feuilles de gélatine 5 min dans de l\'eau froide.',
        'Chauffer le lait à feu doux (sans bouillir). Essorer la gélatine et la dissoudre dans le lait chaud. Laisser tiédir 5 min.',
        'Incorporer le fromage blanc, le miel et la vanille au lait. Fouetter jusqu\'à obtenir un mélange lisse.',
        'Répartir dans 4 verrines ou ramequins. Réfrigérer au minimum 2h (ou toute la nuit).',
        'Préparer le coulis : chauffer les fruits rouges surgelés dans une casserole avec le jus de citron et la stevia 5 min. Mixer et filtrer si désiré.',
        'Au moment de servir, napper chaque panna cotta du coulis fruits rouges refroidi.'
      ]
    },

    {
      id: 'R423',
      name: 'Mousse au Chocolat Noir Protéinée',
      emoji: '🍫', origin: '🇫🇷',
      mealTypes: ['snack'],
      tags: ['snack', 'dessert', 'healthy', 'high-protein', 'maroc', 'chocolat', 'aérien'],
      difficulty: 2, prepTime: 20, cookTime: 5, servings: 4,
      // P×4 + G×4 + L×9 = 60×4 + 60×4 + 32×9 = 240 + 240 + 288 = 768 kcal ✓
      baseNutrition: { calories: 768, proteinGrams: 60, carbsGrams: 60, fatGrams: 32 },
      ingredients: [
        { name: 'Chocolat noir 70%', qty: 120, unit: 'g' },
        { name: 'Fromage blanc 0%', qty: 400, unit: 'g' },
        { name: 'Blancs d\'œufs', qty: 160, unit: 'g' },
        { name: 'Cacao en poudre non sucré', qty: 20, unit: 'g' },
        { name: 'Stevia', qty: 3, unit: 'g' },
        { name: 'Sel', qty: 1, unit: 'g' }
      ],
      steps: [
        'Faire fondre le chocolat noir au bain-marie ou au micro-ondes par tranches de 30 sec. Laisser tiédir 5 min.',
        'Dans un grand bol, mélanger le fromage blanc avec le cacao et la stevia jusqu\'à homogénéité.',
        'Incorporer le chocolat fondu tiédi au mélange fromage blanc-cacao. Bien mélanger.',
        'Monter les blancs d\'œufs en neige ferme avec une pincée de sel.',
        'Incorporer les blancs en neige en 3 fois, en soulevant délicatement la masse de bas en haut pour conserver la légèreté.',
        'Répartir en 4 verrines et réfrigérer 1h minimum avant de servir.'
      ]
    },

    {
      id: 'R424',
      name: 'Crème Brûlée Légère au Café',
      emoji: '☕', origin: '🇫🇷',
      mealTypes: ['snack'],
      tags: ['snack', 'dessert', 'healthy', 'high-protein', 'maroc', 'café', 'caramel', 'élégant'],
      difficulty: 2, prepTime: 10, cookTime: 30, servings: 4,
      // P×4 + G×4 + L×9 = 48×4 + 80×4 + 20×9 = 192 + 320 + 180 = 692 kcal ✓
      baseNutrition: { calories: 692, proteinGrams: 48, carbsGrams: 80, fatGrams: 20 },
      ingredients: [
        { name: 'Yaourt grec 0%', qty: 300, unit: 'g' },
        { name: 'Lait demi-écrémé', qty: 200, unit: 'ml' },
        { name: 'Œufs entiers', qty: 100, unit: 'g' },
        { name: 'Café soluble', qty: 8, unit: 'g' },
        { name: 'Sucre de coco', qty: 40, unit: 'g' },
        { name: 'Extrait de vanille', qty: 3, unit: 'ml' },
        { name: 'Sucre de coco (pour caraméliser)', qty: 20, unit: 'g' }
      ],
      steps: [
        'Préchauffer le four à 150°C. Dissoudre le café soluble dans 2 cuillères à soupe d\'eau chaude.',
        'Fouetter les œufs avec le sucre de coco jusqu\'à blanchiment léger. Incorporer le yaourt grec, le lait, le café dissous et la vanille.',
        'Filtrer le mélange au travers d\'une passoire fine pour éliminer les grumeaux.',
        'Verser dans 4 ramequins. Cuire au bain-marie 25 min jusqu\'à ce que les crèmes soient tremblotantes au centre.',
        'Réfrigérer au moins 2h. Avant de servir, saupoudrer 1 cc de sucre de coco sur chaque crème.',
        'Passer sous le gril du four (position haute) 2-3 min ou utiliser un chalumeau pour caraméliser. Servir immédiatement.'
      ]
    },

    {
      id: 'R425',
      name: 'Tarte Banoffee Healthy Sans Cuisson',
      emoji: '🍌', origin: '🇬🇧',
      mealTypes: ['snack'],
      tags: ['snack', 'dessert', 'healthy', 'high-protein', 'maroc', 'sans-cuisson', 'banane', 'chocolat'],
      difficulty: 1, prepTime: 20, cookTime: 0, servings: 6,
      // P×4 + G×4 + L×9 = 60×4 + 180×4 + 60×9 = 240 + 720 + 540 = 1500 kcal ✓
      baseNutrition: { calories: 1500, proteinGrams: 60, carbsGrams: 180, fatGrams: 60 },
      ingredients: [
        { name: 'Dattes Medjool dénoyautées', qty: 150, unit: 'g' },
        { name: 'Flocons d\'avoine', qty: 100, unit: 'g' },
        { name: 'Noix de cajou', qty: 80, unit: 'g' },
        { name: 'Fromage blanc 0%', qty: 400, unit: 'g' },
        { name: 'Miel', qty: 30, unit: 'g' },
        { name: 'Extrait de vanille', qty: 5, unit: 'ml' },
        { name: 'Bananes', qty: 300, unit: 'g' },
        { name: 'Chocolat noir 70%', qty: 40, unit: 'g' },
        { name: 'Cannelle moulue', qty: 2, unit: 'g' }
      ],
      steps: [
        'Mixer les dattes, les flocons d\'avoine et les noix de cajou jusqu\'à obtenir une pâte collante.',
        'Presser la pâte dans le fond d\'un moule à tarte (Ø 22 cm) en remontant légèrement sur les bords. Réfrigérer 15 min.',
        'Mélanger le fromage blanc avec le miel, la vanille et la cannelle jusqu\'à obtenir une crème lisse.',
        'Étaler la crème sur le fond de tarte refroidi.',
        'Couper les bananes en rondelles et les disposer harmonieusement sur la crème.',
        'Râper ou hacher finement le chocolat noir et en parsemer le dessus. Servir frais.'
      ]
    },

    {
      id: 'R426',
      name: 'Tiramisu Protéiné Revisité',
      emoji: '🍰', origin: '🇮🇹',
      mealTypes: ['snack'],
      tags: ['snack', 'dessert', 'healthy', 'high-protein', 'maroc', 'café', 'cacao', 'tiramisu'],
      difficulty: 2, prepTime: 25, cookTime: 5, servings: 6,
      // P×4 + G×4 + L×9 = 108×4 + 150×4 + 60×9 = 432 + 600 + 540 = 1572 kcal ✓
      baseNutrition: { calories: 1572, proteinGrams: 108, carbsGrams: 150, fatGrams: 60 },
      ingredients: [
        { name: 'Boudoirs (biscuits à la cuillère)', qty: 120, unit: 'g' },
        { name: 'Fromage blanc 0%', qty: 400, unit: 'g' },
        { name: 'Skyr nature', qty: 300, unit: 'g' },
        { name: 'Mascarpone', qty: 100, unit: 'g' },
        { name: 'Café fort refroidi', qty: 150, unit: 'ml' },
        { name: 'Sucre de coco', qty: 30, unit: 'g' },
        { name: 'Cacao en poudre non sucré', qty: 20, unit: 'g' },
        { name: 'Extrait de vanille', qty: 5, unit: 'ml' },
        { name: 'Blancs d\'œufs', qty: 80, unit: 'g' }
      ],
      steps: [
        'Préparer un café fort et laisser refroidir complètement.',
        'Fouetter ensemble le fromage blanc, le skyr, le mascarpone, le sucre de coco et la vanille jusqu\'à homogénéité.',
        'Monter les blancs en neige ferme et les incorporer délicatement à la crème pour l\'alléger.',
        'Tremper rapidement les boudoirs dans le café froid (2 sec max pour ne pas les ramollir trop).',
        'Disposer une couche de boudoirs imbibés dans un plat ou 6 verrines. Couvrir d\'une couche de crème.',
        'Répéter l\'opération (boudoirs + crème). Saupoudrer généreusement de cacao tamisé. Réfrigérer 2h minimum.'
      ]
    },

    {
      id: 'R427',
      name: 'Fondant au Chocolat Coulant Protéiné',
      emoji: '🫓', origin: '🇫🇷',
      mealTypes: ['snack'],
      tags: ['snack', 'dessert', 'healthy', 'high-protein', 'maroc', 'chocolat', 'coulant', 'four'],
      difficulty: 2, prepTime: 15, cookTime: 10, servings: 4,
      // P×4 + G×4 + L×9 = 72×4 + 88×4 + 48×9 = 288 + 352 + 432 = 1072 kcal ✓
      baseNutrition: { calories: 1072, proteinGrams: 72, carbsGrams: 88, fatGrams: 48 },
      ingredients: [
        { name: 'Chocolat noir 70%', qty: 120, unit: 'g' },
        { name: 'Beurre', qty: 40, unit: 'g' },
        { name: 'Œufs entiers', qty: 150, unit: 'g' },
        { name: 'Farine d\'avoine', qty: 40, unit: 'g' },
        { name: 'Cacao en poudre non sucré', qty: 20, unit: 'g' },
        { name: 'Sucre de coco', qty: 30, unit: 'g' },
        { name: 'Fromage blanc 0%', qty: 100, unit: 'g' },
        { name: 'Sel', qty: 1, unit: 'g' }
      ],
      steps: [
        'Préchauffer le four à 200°C. Beurrer et saupoudrer de cacao 4 ramequins individuels.',
        'Faire fondre le chocolat noir avec le beurre au bain-marie. Mélanger jusqu\'à obtenir une ganache lisse. Laisser tiédir 5 min.',
        'Fouetter les œufs avec le sucre de coco jusqu\'à blanchiment. Incorporer le fromage blanc.',
        'Verser le chocolat fondu sur le mélange œufs-fromage blanc. Ajouter la farine d\'avoine, le cacao et le sel. Mélanger délicatement.',
        'Répartir dans les 4 ramequins. (Astuce : réfrigérer 30 min avant cuisson pour un cœur plus coulant.)',
        'Enfourner exactement 10 min à 200°C. Démouler immédiatement en retournant sur l\'assiette. Servir sans attendre.'
      ]
    },

    {
      id: 'R428',
      name: 'Cheesecake Healthy Citron-Pistache No-Bake',
      emoji: '🍋', origin: '🌍',
      mealTypes: ['snack'],
      tags: ['snack', 'dessert', 'healthy', 'high-protein', 'maroc', 'sans-cuisson', 'citron', 'pistache'],
      difficulty: 1, prepTime: 25, cookTime: 0, servings: 8,
      // P×4 + G×4 + L×9 = 112×4 + 200×4 + 64×9 = 448 + 800 + 576 = 1824 kcal ✓
      baseNutrition: { calories: 1824, proteinGrams: 112, carbsGrams: 200, fatGrams: 64 },
      ingredients: [
        { name: 'Dattes Medjool dénoyautées', qty: 120, unit: 'g' },
        { name: 'Pistaches non salées', qty: 80, unit: 'g' },
        { name: 'Flocons d\'avoine', qty: 80, unit: 'g' },
        { name: 'Fromage frais allégé (Philadelphia light)', qty: 300, unit: 'g' },
        { name: 'Skyr nature', qty: 400, unit: 'g' },
        { name: 'Citron (jus + zeste)', qty: 60, unit: 'g' },
        { name: 'Miel', qty: 40, unit: 'g' },
        { name: 'Gélatine en feuilles', qty: 8, unit: 'g' },
        { name: 'Pistaches concassées (topping)', qty: 30, unit: 'g' }
      ],
      steps: [
        'Mixer les dattes, 80g de pistaches et les flocons d\'avoine pour obtenir une pâte homogène. Presser dans le fond d\'un moule à charnière (Ø 20 cm). Réfrigérer 15 min.',
        'Tremper la gélatine 5 min dans l\'eau froide. La dissoudre dans 3 cuillères à soupe d\'eau chaude.',
        'Fouetter le fromage frais avec le skyr, le jus et zeste de citron, et le miel jusqu\'à parfaite homogénéité.',
        'Incorporer la gélatine dissoute tiédie à la crème au fromage. Bien mélanger.',
        'Verser la crème sur le fond de tarte. Lisser le dessus. Réfrigérer 3h minimum (idéalement une nuit).',
        'Démouler délicatement. Parsemer de pistaches concassées et de zeste de citron râpé avant de servir.'
      ]
    },

    {
      id: 'R429',
      name: 'Île Flottante Légère Protéinée',
      emoji: '🏝️', origin: '🇫🇷',
      mealTypes: ['snack'],
      tags: ['snack', 'dessert', 'healthy', 'high-protein', 'maroc', 'léger', 'élégant', 'vanille'],
      difficulty: 2, prepTime: 20, cookTime: 15, servings: 4,
      // P×4 + G×4 + L×9 = 60×4 + 72×4 + 20×9 = 240 + 288 + 180 = 708 kcal ✓
      baseNutrition: { calories: 708, proteinGrams: 60, carbsGrams: 72, fatGrams: 20 },
      ingredients: [
        { name: 'Blancs d\'œufs', qty: 200, unit: 'g' },
        { name: 'Lait demi-écrémé', qty: 500, unit: 'ml' },
        { name: 'Jaunes d\'œufs', qty: 80, unit: 'g' },
        { name: 'Extrait de vanille', qty: 8, unit: 'ml' },
        { name: 'Stevia', qty: 4, unit: 'g' },
        { name: 'Miel', qty: 30, unit: 'g' },
        { name: 'Beurre', qty: 5, unit: 'g' },
        { name: 'Cannelle moulue', qty: 1, unit: 'g' }
      ],
      steps: [
        'Chauffer le lait à feu doux avec la moitié de la vanille et la stevia. Ne pas faire bouillir.',
        'Monter les blancs d\'œufs en neige très ferme. Former des quenelles à l\'aide de deux cuillères à soupe.',
        'Pocher les îles flottantes dans le lait frémissant 2 min de chaque côté. Les égoutter sur du papier absorbant.',
        'Préparer la crème anglaise : fouetter les jaunes avec la stevia dans un bol. Verser le lait vanillé chaud progressivement en remuant.',
        'Remettre sur feu doux en remuant constamment jusqu\'à ce que la crème nappe la cuillère (82°C). Filtrer et laisser tiédir.',
        'Préparer le coulis caramel léger : chauffer le miel avec le beurre 2 min jusqu\'à légère coloration. Incorporer 2 cs de lait et la cannelle.',
        'Dresser : verser la crème anglaise dans 4 assiettes creuses, déposer les îles flottantes, napper d\'un filet de caramel au miel.'
      ]
    },

    {
      id: 'R430',
      name: 'Riz au Lait Protéiné à la Rose et Pistaches',
      emoji: '🌹', origin: '🇲🇦',
      mealTypes: ['snack'],
      tags: ['snack', 'dessert', 'healthy', 'maroc', 'high-protein', 'rose', 'pistaches', 'sans-gluten'],
      difficulty: 1, prepTime: 10, cookTime: 25, servings: 4,
      // P×4 + G×4 + L×9 = 56×4 + 116×4 + 40×9 = 224 + 464 + 360 = 1048 kcal (~1040 déclaré, 0.77%) ✓
      baseNutrition: { calories: 1040, proteinGrams: 56, carbsGrams: 116, fatGrams: 40 },
      ingredients: [
        { name: 'Riz rond', qty: 160, unit: 'g' },
        { name: 'Lait entier', qty: 800, unit: 'ml' },
        { name: 'Skyr nature', qty: 200, unit: 'g' },
        { name: 'Eau de rose', qty: 20, unit: 'ml' },
        { name: 'Pistaches non salées concassées', qty: 40, unit: 'g' },
        { name: 'Miel', qty: 40, unit: 'g' },
        { name: 'Cannelle moulue', qty: 2, unit: 'g' }
      ],
      steps: [
        'Rincer le riz à l\'eau froide. Le mettre dans une casserole avec le lait entier froid.',
        'Cuire à feu moyen-doux 20-25 min en remuant régulièrement jusqu\'à consistance crémeuse. Le riz doit être très tendre et le lait bien absorbé.',
        'Hors du feu, incorporer le miel, l\'eau de rose et la cannelle. Mélanger doucement.',
        'Laisser tiédir 5 min puis incorporer le skyr à la spatule pour un résultat crémeux.',
        'Répartir dans 4 coupes. Saupoudrer de pistaches concassées et d\'une pincée de cannelle. Servir tiède ou frais.'
      ]
    },

    {
      id: 'R431',
      name: 'Clafoutis Healthy Cerises-Amandes',
      emoji: '🍒', origin: '🇫🇷',
      mealTypes: ['snack'],
      tags: ['snack', 'dessert', 'healthy', 'maroc', 'high-protein', 'cerises', 'amandes', 'sans-beurre'],
      difficulty: 2, prepTime: 10, cookTime: 25, servings: 6,
      // P×4 + G×4 + L×9 = 72×4 + 144×4 + 24×9 = 288 + 576 + 216 = 1080 kcal ✓
      baseNutrition: { calories: 1080, proteinGrams: 72, carbsGrams: 144, fatGrams: 24 },
      ingredients: [
        { name: 'Cerises fraîches ou surgelées dénoyautées', qty: 400, unit: 'g' },
        { name: 'Fromage blanc 0%', qty: 400, unit: 'g' },
        { name: 'Œufs entiers', qty: 180, unit: 'g' },
        { name: 'Farine d\'avoine', qty: 60, unit: 'g' },
        { name: 'Poudre d\'amandes', qty: 40, unit: 'g' },
        { name: 'Extrait d\'amande amère', qty: 5, unit: 'ml' },
        { name: 'Stevia en poudre', qty: 6, unit: 'g' },
        { name: 'Extrait de vanille', qty: 5, unit: 'ml' }
      ],
      steps: [
        'Préchauffer le four à 180°C. Huiler légèrement un moule de 22 cm avec un peu d\'huile de coco.',
        'Dans un saladier, fouetter les œufs avec le fromage blanc 0%, la stevia, l\'extrait de vanille et l\'extrait d\'amande amère.',
        'Incorporer la farine d\'avoine et la poudre d\'amandes en pluie. Fouetter jusqu\'à obtenir une pâte lisse sans grumeaux.',
        'Répartir les cerises uniformément dans le moule. Verser délicatement l\'appareil par-dessus.',
        'Enfourner 25 min jusqu\'à ce que le clafoutis soit doré et ferme au toucher. Laisser tiédir avant de servir.'
      ]
    },

    {
      id: 'R432',
      name: 'Tarte Tatin Pomme-Cannelle Protéinée',
      emoji: '🍎', origin: '🇫🇷',
      mealTypes: ['snack'],
      tags: ['snack', 'dessert', 'healthy', 'maroc', 'high-protein', 'pomme', 'cannelle', 'tarte'],
      difficulty: 2, prepTime: 15, cookTime: 25, servings: 6,
      // P×4 + G×4 + L×9 = 60×4 + 162×4 + 48×9 = 240 + 648 + 432 = 1320 kcal ✓
      baseNutrition: { calories: 1320, proteinGrams: 60, carbsGrams: 162, fatGrams: 48 },
      ingredients: [
        { name: 'Pommes Golden', qty: 600, unit: 'g' },
        { name: 'Farine d\'avoine', qty: 120, unit: 'g' },
        { name: 'Fromage blanc 0%', qty: 250, unit: 'g' },
        { name: 'Œufs entiers', qty: 120, unit: 'g' },
        { name: 'Beurre', qty: 40, unit: 'g' },
        { name: 'Miel', qty: 50, unit: 'g' },
        { name: 'Stevia en poudre', qty: 4, unit: 'g' },
        { name: 'Cannelle moulue', qty: 4, unit: 'g' },
        { name: 'Extrait de vanille', qty: 5, unit: 'ml' }
      ],
      steps: [
        'Préchauffer le four à 180°C. Éplucher et couper les pommes en quartiers épais.',
        'Dans une poêle allant au four (ou moule à tarte), faire fondre le beurre avec le miel à feu moyen. Ajouter la cannelle et disposer les pommes en rosace. Cuire 5 min jusqu\'à légère caramélisation.',
        'Préparer la pâte : mélanger la farine d\'avoine, la stevia, 1 œuf et 20g de beurre fondu à la fourchette jusqu\'à obtenir une boule. Étaler entre deux feuilles de papier sulfurisé.',
        'Déposer la pâte sur les pommes en rentrant les bords. Enfourner 20 min jusqu\'à dorure.',
        'Laisser reposer 5 min puis retourner sur un plat. Préparer la crème : mélanger le fromage blanc 0% avec la vanille et la stevia. Servir en accompagnement frais.'
      ]
    },

    {
      id: 'R433',
      name: 'Sorbet Mangue-Citron Vert Protéiné',
      emoji: '🥭', origin: '🌍',
      mealTypes: ['snack'],
      tags: ['snack', 'dessert', 'healthy', 'maroc', 'high-protein', 'mangue', 'sorbet', 'sans-cuisson', 'vegan-option', 'rapide'],
      difficulty: 1, prepTime: 5, cookTime: 0, servings: 4,
      // P×4 + G×4 + L×9 = 48×4 + 84×4 + 8×9 = 192 + 336 + 72 = 600 kcal ✓
      baseNutrition: { calories: 600, proteinGrams: 48, carbsGrams: 84, fatGrams: 8 },
      ingredients: [
        { name: 'Mangue congelée en morceaux', qty: 500, unit: 'g' },
        { name: 'Skyr nature', qty: 250, unit: 'g' },
        { name: 'Jus de citron vert', qty: 40, unit: 'ml' },
        { name: 'Miel', qty: 30, unit: 'g' },
        { name: 'Menthe fraîche', qty: 10, unit: 'g' },
        { name: 'Zeste de citron vert', qty: 4, unit: 'g' }
      ],
      steps: [
        'Sortir la mangue congelée du congélateur 5 min avant pour faciliter le mixage.',
        'Mettre la mangue, le skyr, le jus de citron vert, le miel et les feuilles de menthe dans le blender.',
        'Mixer à pleine puissance 1-2 min jusqu\'à obtenir une texture lisse et crémeuse. Racler les bords si nécessaire.',
        'Goûter et ajuster le sucre avec un filet de miel si besoin.',
        'Servir immédiatement en coupes garnies de zeste de citron vert et d\'une feuille de menthe. Pour une texture plus ferme, passer 20 min au congélateur.'
      ]
    },

    {
      id: 'R434',
      name: 'Beignets Healthy au Four Façon Donuts',
      emoji: '🍩', origin: '🌍',
      mealTypes: ['snack'],
      tags: ['snack', 'dessert', 'healthy', 'maroc', 'high-protein', 'donuts', 'chocolat', 'four', 'sans-friture'],
      difficulty: 2, prepTime: 15, cookTime: 15, servings: 8,
      // P×4 + G×4 + L×9 = 80×4 + 162×4 + 48×9 = 320 + 648 + 432 = 1400 kcal ✓
      baseNutrition: { calories: 1400, proteinGrams: 80, carbsGrams: 162, fatGrams: 48 },
      ingredients: [
        { name: 'Farine d\'avoine', qty: 200, unit: 'g' },
        { name: 'Fromage blanc 0%', qty: 300, unit: 'g' },
        { name: 'Œufs entiers', qty: 160, unit: 'g' },
        { name: 'Huile de coco', qty: 20, unit: 'g' },
        { name: 'Levure chimique', qty: 8, unit: 'g' },
        { name: 'Stevia en poudre', qty: 6, unit: 'g' },
        { name: 'Extrait de vanille', qty: 5, unit: 'ml' },
        { name: 'Chocolat noir 70%', qty: 60, unit: 'g' },
        { name: 'Lait d\'amande', qty: 30, unit: 'ml' },
        { name: 'Sucre de coco', qty: 16, unit: 'g' },
        { name: 'Cannelle moulue', qty: 2, unit: 'g' }
      ],
      steps: [
        'Préchauffer le four à 180°C. Huiler légèrement un moule à donuts (8 empreintes) avec l\'huile de coco.',
        'Dans un saladier, mélanger le fromage blanc, les œufs, l\'huile de coco fondue, la stevia et la vanille.',
        'Incorporer la farine d\'avoine et la levure chimique. Mélanger jusqu\'à une pâte homogène et épaisse.',
        'Remplir les empreintes à donuts aux 3/4. Enfourner 12-15 min jusqu\'à ce que les beignets soient dorés et qu\'un cure-dent en ressorte propre. Laisser refroidir 10 min.',
        'Glaçage chocolat : faire fondre le chocolat noir avec le lait d\'amande au bain-marie ou 30 sec au micro-ondes. Tremper le dessus de chaque donut et laisser figer.',
        'OU Glaçage sec : mélanger le sucre de coco et la cannelle. Rouler les donuts encore tièdes dans ce mélange. Servir dans l\'heure pour garder le croustillant.'
      ]
    },

    {
      id: 'R435',
      name: 'Gâteau Basque Protéiné Crème Vanille',
      emoji: '🍮', origin: '🇫🇷',
      mealTypes: ['snack'],
      tags: ['snack', 'dessert', 'healthy', 'high-protein', 'maroc', 'pâtisserie', 'vanille', 'avoine'],
      difficulty: 2, prepTime: 20, cookTime: 20, servings: 8,
      // P×4 + G×4 + L×9 = 112×4 + 200×4 + 72×9 = 448 + 800 + 648 = 1896 kcal ÷ 8 = 237 kcal/part ✓
      baseNutrition: { calories: 1896, proteinGrams: 112, carbsGrams: 200, fatGrams: 72 },
      ingredients: [
        { name: 'Farine d\'avoine', qty: 200, unit: 'g' },
        { name: 'Beurre', qty: 60, unit: 'g' },
        { name: 'Sucre de coco', qty: 50, unit: 'g' },
        { name: 'Œufs entiers', qty: 120, unit: 'g' },
        { name: 'Levure chimique', qty: 5, unit: 'g' },
        { name: 'Lait demi-écrémé', qty: 300, unit: 'ml' },
        { name: 'Jaunes d\'œufs', qty: 60, unit: 'g' },
        { name: 'Maïzena', qty: 20, unit: 'g' },
        { name: 'Extrait de vanille', qty: 10, unit: 'ml' },
        { name: 'Skyr nature', qty: 150, unit: 'g' },
        { name: 'Stevia', qty: 4, unit: 'g' }
      ],
      steps: [
        'Préchauffer le four à 180°C. Beurrer légèrement un moule rond de 22 cm.',
        'Préparer la pâte : mélanger la farine d\'avoine, le sucre de coco et la levure. Ajouter le beurre ramolli et les œufs entiers. Pétrir jusqu\'à obtenir une boule souple. Réserver au frais 10 min.',
        'Préparer la crème vanille : chauffer le lait avec la vanille et la stevia sans faire bouillir. Fouetter les jaunes avec la maïzena. Verser le lait chaud progressivement en remuant, remettre sur feu doux 3 min jusqu\'à épaississement.',
        'Hors du feu, incorporer le skyr à la crème encore tiède. Lisser au fouet et laisser refroidir 5 min.',
        'Étaler les deux tiers de la pâte dans le moule. Verser la crème vanille-skyr. Couvrir avec le reste de pâte étalé et souder les bords.',
        'Enfourner 20 min jusqu\'à dorure dorée. Laisser tiédir avant de démouler et couper en 8 parts.'
      ]
    },

    {
      id: 'R436',
      name: 'Verrine Légère Mangue-Coco-Passion',
      emoji: '🥭', origin: '🌴',
      mealTypes: ['snack'],
      tags: ['snack', 'dessert', 'healthy', 'maroc', 'fruits', 'exotique', 'léger', 'sans-cuisson', 'vegan-option'],
      difficulty: 1, prepTime: 20, cookTime: 10, servings: 4,
      // P×4 + G×4 + L×9 = 40×4 + 84×4 + 24×9 = 160 + 336 + 216 = 712 kcal ÷ 4 = 178 kcal/verrine ✓
      baseNutrition: { calories: 712, proteinGrams: 40, carbsGrams: 84, fatGrams: 24 },
      ingredients: [
        { name: 'Mangue fraîche', qty: 300, unit: 'g' },
        { name: 'Jus de fruit de la passion', qty: 80, unit: 'ml' },
        { name: 'Lait de coco light', qty: 250, unit: 'ml' },
        { name: 'Gélatine en feuilles', qty: 4, unit: 'g' },
        { name: 'Stevia', qty: 3, unit: 'g' },
        { name: 'Yaourt grec 0%', qty: 300, unit: 'g' },
        { name: 'Zeste de citron vert', qty: 4, unit: 'g' },
        { name: 'Jus de citron vert', qty: 15, unit: 'ml' }
      ],
      steps: [
        'Faire tremper les feuilles de gélatine dans l\'eau froide 5 min. Chauffer le lait de coco light avec la stevia sans bouillir. Essorer la gélatine et la dissoudre dans le lait chaud. Laisser tiédir 10 min puis couler dans 4 verrines. Réfrigérer 15 min.',
        'Mixer la mangue pelée coupée en dés avec le jus de fruit de la passion jusqu\'à coulis lisse. Ajuster la douceur avec un peu de stevia si nécessaire.',
        'Mélanger le yaourt grec avec le zeste et le jus de citron vert.',
        'Sortir les verrines : verser délicatement le coulis mangue-passion sur la panna cotta coco prise. Terminer par une couche généreuse de yaourt au citron vert.',
        'Décorer d\'un zeste de citron vert. Servir immédiatement ou réfrigérer jusqu\'au moment de déguster.'
      ]
    },

    {
      id: 'R437',
      name: 'Pain d\'Épices Protéiné Moelleux',
      emoji: '🍞', origin: '🇫🇷',
      mealTypes: ['snack'],
      tags: ['snack', 'dessert', 'healthy', 'high-protein', 'maroc', 'épices', 'moelleux', 'avoine', 'whey'],
      difficulty: 1, prepTime: 10, cookTime: 25, servings: 8,
      // P×4 + G×4 + L×9 = 96×4 + 192×4 + 48×9 = 384 + 768 + 432 = 1584 kcal ÷ 8 = 198 kcal/tranche ✓
      baseNutrition: { calories: 1584, proteinGrams: 96, carbsGrams: 192, fatGrams: 48 },
      ingredients: [
        { name: 'Farine d\'avoine', qty: 180, unit: 'g' },
        { name: 'Whey vanille', qty: 80, unit: 'g' },
        { name: 'Miel', qty: 80, unit: 'g' },
        { name: 'Cannelle moulue', qty: 4, unit: 'g' },
        { name: 'Gingembre moulu', qty: 3, unit: 'g' },
        { name: 'Anis étoilé moulu', qty: 2, unit: 'g' },
        { name: 'Œufs entiers', qty: 120, unit: 'g' },
        { name: 'Lait demi-écrémé', qty: 150, unit: 'ml' },
        { name: 'Levure chimique', qty: 6, unit: 'g' },
        { name: 'Huile d\'olive légère', qty: 30, unit: 'ml' }
      ],
      steps: [
        'Préchauffer le four à 170°C. Chemiser un moule à cake de papier cuisson.',
        'Dans un grand bol, mélanger la farine d\'avoine, la whey vanille, la levure, la cannelle, le gingembre et l\'anis étoilé moulu.',
        'Dans un autre bol, fouetter les œufs avec le miel, le lait et l\'huile d\'olive.',
        'Verser les liquides sur les poudres et mélanger à la spatule jusqu\'à pâte homogène. Ne pas trop travailler.',
        'Verser dans le moule et enfourner 25 min. Vérifier la cuisson en plantant un couteau : il doit ressortir propre.',
        'Laisser refroidir 10 min dans le moule avant de démouler sur une grille. Couper en 8 tranches. Se conserve 3 jours dans un récipient hermétique.'
      ]
    },

    {
      id: 'R438',
      name: 'Tarte Citron Meringuée Légère',
      emoji: '🍋', origin: '🇫🇷',
      mealTypes: ['snack'],
      tags: ['snack', 'dessert', 'healthy', 'high-protein', 'maroc', 'citron', 'meringue', 'léger', 'pâtisserie'],
      difficulty: 2, prepTime: 20, cookTime: 20, servings: 6,
      // P×4 + G×4 + L×9 = 84×4 + 150×4 + 48×9 = 336 + 600 + 432 = 1368 kcal ÷ 6 = 228 kcal/part ✓
      baseNutrition: { calories: 1368, proteinGrams: 84, carbsGrams: 150, fatGrams: 48 },
      ingredients: [
        { name: 'Flocons d\'avoine', qty: 120, unit: 'g' },
        { name: 'Amandes en poudre', qty: 40, unit: 'g' },
        { name: 'Beurre', qty: 30, unit: 'g' },
        { name: 'Jus de citron frais', qty: 120, unit: 'ml' },
        { name: 'Zeste de citron', qty: 8, unit: 'g' },
        { name: 'Œufs entiers', qty: 150, unit: 'g' },
        { name: 'Stevia', qty: 6, unit: 'g' },
        { name: 'Maïzena', qty: 20, unit: 'g' },
        { name: 'Fromage blanc 0%', qty: 200, unit: 'g' },
        { name: 'Blancs d\'œufs', qty: 120, unit: 'g' },
        { name: 'Sucre de coco', qty: 30, unit: 'g' }
      ],
      steps: [
        'Préchauffer le four à 180°C. Mixer les flocons d\'avoine avec les amandes et le beurre fondu pour former une pâte sablée. Presser dans un moule à tarte de 22 cm. Enfourner 10 min.',
        'Préparer la crème citron : fouetter les œufs avec la stevia et la maïzena. Ajouter le jus et le zeste de citron. Cuire à feu doux 5 min en remuant jusqu\'à épaississement.',
        'Hors du feu, incorporer le fromage blanc à la crème citron encore chaude. Mélanger vigoureusement. Verser sur le fond de tarte précuit.',
        'Monter les blancs d\'œufs en neige ferme. Ajouter le sucre de coco progressivement en continuant de fouetter jusqu\'à meringue brillante.',
        'Couvrir la crème citron avec la meringue en formant des pics. Passer sous le gril du four 3-4 min jusqu\'à légère coloration dorée. Surveiller attentivement.',
        'Laisser refroidir à température ambiante puis réfrigérer 15 min. Couper en 6 parts et servir frais.'
      ]
    },

    {
      id: 'R439',
      name: 'Glace Banana Nice Cream Chocolat-Noisette',
      emoji: '🍌', origin: '🌍',
      mealTypes: ['snack'],
      tags: ['snack', 'dessert', 'healthy', 'maroc', 'banane', 'chocolat', 'sans-cuisson', 'vegan', 'express', 'glace'],
      difficulty: 1, prepTime: 5, cookTime: 0, servings: 2,
      // P×4 + G×4 + L×9 = 24×4 + 68×4 + 20×9 = 96 + 272 + 180 = 548 kcal ÷ 2 = 274 kcal/portion ✓
      baseNutrition: { calories: 548, proteinGrams: 24, carbsGrams: 68, fatGrams: 20 },
      ingredients: [
        { name: 'Bananes mûres congelées', qty: 300, unit: 'g' },
        { name: 'Cacao en poudre non sucré', qty: 15, unit: 'g' },
        { name: 'Beurre de noisette', qty: 30, unit: 'g' },
        { name: 'Lait d\'amande non sucré', qty: 60, unit: 'ml' },
        { name: 'Whey chocolat ou vanille', qty: 30, unit: 'g' },
        { name: 'Stevia', qty: 2, unit: 'g' }
      ],
      steps: [
        'Sortir les bananes congelées du congélateur et laisser 2 min à température ambiante pour faciliter le mixage.',
        'Placer les bananes, le cacao, le beurre de noisette, le lait d\'amande, la whey et la stevia dans un blender puissant.',
        'Mixer par impulsions 30 secondes, puis en continu 1-2 min jusqu\'à texture crémeuse et homogène rappelant une glace. Racler les parois si nécessaire.',
        'Goûter et ajuster la douceur avec un peu de stevia. Servir immédiatement pour une texture soft-serve, ou passer 15 min au congélateur pour une glace plus ferme.',
        'Dresser dans deux bols et garnir d\'une pincée de cacao ou de quelques noisettes concassées.'
      ]
    },

  // ─── RECETTES ITALIENNES R440-R449 : PÂTES & RISOTTI HEALTHY ─────────────────

    {
      id: 'R440',
      name: 'Pasta e Fagioli Moderne',
      emoji: '🫘',
      origin: '🇮🇹',
      mealTypes: ['lunch', 'dinner'],
      category: 'italian',
      tags: ['high-protein', 'mediterranean', 'balanced', 'anti-inflammatory', 'budget', 'meal-prep'],
      difficulty: 2,
      prepTime: 10,
      cookTime: 25,
      servings: 2,
      // Vérification: P×4 + G×4 + L×9 = 32×4 + 52×4 + 10×9 = 128 + 208 + 90 = 426 kcal ≈ 430 ✓
      baseNutrition: { calories: 430, proteinGrams: 32, carbsGrams: 52, fatGrams: 10 },
      ingredients: [
        { name: 'Haricots cannellini en boîte', qty: 400, unit: 'g' },
        { name: 'Ditalini ou petites pâtes courtes', qty: 120, unit: 'g' },
        { name: 'Tomates pelées en boîte', qty: 200, unit: 'g' },
        { name: 'Bouillon de légumes', qty: 600, unit: 'ml' },
        { name: 'Ail', qty: 3, unit: 'gousses' },
        { name: 'Romarin frais', qty: 2, unit: 'branches' },
        { name: 'Huile d\'olive extra-vierge', qty: 15, unit: 'ml' },
        { name: 'Parmesan râpé', qty: 20, unit: 'g' },
        { name: 'Sel, poivre noir', qty: 1, unit: 'pincée' }
      ],
      steps: [
        'Faire revenir l\'ail émincé dans l\'huile d\'olive à feu moyen 1 min. Ajouter le romarin et les tomates pelées écrasées. Cuire 3 min.',
        'Verser le bouillon, ajouter la moitié des haricots entiers et mixer grossièrement l\'autre moitié directement dans la casserole pour créer une base crémeuse.',
        'Porter à ébullition, ajouter les pâtes et cuire al dente selon les indications (env. 8-10 min). Ajuster la consistance avec un peu d\'eau si nécessaire.',
        'Retirer le romarin, assaisonner. Servir dans deux bols profonds, arroser d\'un filet d\'huile d\'olive et parsemer de parmesan râpé.'
      ]
    },

    {
      id: 'R441',
      name: 'Risotto aux Asperges & Parmesan Light',
      emoji: '🌿',
      origin: '🇮🇹',
      mealTypes: ['lunch', 'dinner'],
      category: 'italian',
      tags: ['vegetarian', 'mediterranean', 'balanced', 'anti-inflammatory', 'high-protein'],
      difficulty: 2,
      prepTime: 10,
      cookTime: 25,
      servings: 2,
      // Vérification: P×4 + G×4 + L×9 = 22×4 + 62×4 + 10×9 = 88 + 248 + 90 = 426 kcal ≈ 430 ✓
      baseNutrition: { calories: 430, proteinGrams: 22, carbsGrams: 62, fatGrams: 10 },
      ingredients: [
        { name: 'Riz arborio', qty: 160, unit: 'g' },
        { name: 'Asperges vertes', qty: 250, unit: 'g' },
        { name: 'Bouillon de légumes chaud', qty: 700, unit: 'ml' },
        { name: 'Échalote', qty: 1, unit: 'pce' },
        { name: 'Vin blanc sec', qty: 60, unit: 'ml' },
        { name: 'Parmesan râpé', qty: 30, unit: 'g' },
        { name: 'Huile d\'olive', qty: 10, unit: 'ml' },
        { name: 'Zeste de citron', qty: 1, unit: 'pce' },
        { name: 'Sel, poivre blanc', qty: 1, unit: 'pincée' }
      ],
      steps: [
        'Couper les asperges en tronçons de 3 cm en réservant les pointes. Faire revenir l\'échalote émincée dans l\'huile d\'olive 2 min. Ajouter le riz et nacrer 2 min.',
        'Déglacer au vin blanc, laisser absorber. Ajouter les tronçons d\'asperges (sans les pointes). Incorporer le bouillon chaud louche par louche en remuant constamment.',
        'À mi-cuisson (env. 10 min), ajouter les pointes d\'asperges. Continuer d\'ajouter le bouillon jusqu\'à cuisson al dente du riz (18-20 min total).',
        'Hors du feu, incorporer le parmesan et le zeste de citron. Laisser reposer 2 min, assaisonner et servir immédiatement dans des assiettes creuses chaudes.'
      ]
    },

    {
      id: 'R442',
      name: 'Spaghetti Aglio Olio Poulet Grillé',
      emoji: '🍝',
      origin: '🇮🇹',
      mealTypes: ['lunch', 'dinner'],
      category: 'italian',
      tags: ['high-protein', 'quick', 'mediterranean', 'balanced', 'dairy-free'],
      difficulty: 1,
      prepTime: 10,
      cookTime: 20,
      servings: 2,
      // Vérification: P×4 + G×4 + L×9 = 42×4 + 55×4 + 14×9 = 168 + 220 + 126 = 514 kcal ≈ 515 ✓
      baseNutrition: { calories: 515, proteinGrams: 42, carbsGrams: 55, fatGrams: 14 },
      ingredients: [
        { name: 'Spaghetti complets', qty: 160, unit: 'g' },
        { name: 'Filets de poulet', qty: 300, unit: 'g' },
        { name: 'Ail', qty: 4, unit: 'gousses' },
        { name: 'Huile d\'olive extra-vierge', qty: 20, unit: 'ml' },
        { name: 'Piment rouge séché (peperoncino)', qty: 1, unit: 'pce' },
        { name: 'Persil plat frais', qty: 20, unit: 'g' },
        { name: 'Jus de citron', qty: 15, unit: 'ml' },
        { name: 'Sel, poivre noir', qty: 1, unit: 'pincée' }
      ],
      steps: [
        'Cuire les spaghetti al dente dans une grande casserole d\'eau salée. Réserver 100 ml d\'eau de cuisson avant d\'égoutter.',
        'Pendant ce temps, griller les filets de poulet assaisonnés à la poêle grill 5-6 min de chaque côté. Trancher en lamelles.',
        'Dans une grande poêle, chauffer l\'huile à feu doux, faire revenir l\'ail émincé et le piment 2 min sans colorer. Ajouter les pâtes et un peu d\'eau de cuisson, mélanger.',
        'Incorporer le poulet tranché, le persil ciselé et le jus de citron. Mélanger vigoureusement 1 min pour enrober. Servir aussitôt.'
      ]
    },

    {
      id: 'R443',
      name: 'Penne Arrabiata aux Crevettes',
      emoji: '🍤',
      origin: '🇮🇹',
      mealTypes: ['lunch', 'dinner'],
      category: 'italian',
      tags: ['high-protein', 'mediterranean', 'quick', 'omega3', 'dairy-free', 'anti-inflammatory'],
      difficulty: 1,
      prepTime: 10,
      cookTime: 20,
      servings: 2,
      // Vérification: P×4 + G×4 + L×9 = 38×4 + 54×4 + 9×9 = 152 + 216 + 81 = 449 kcal ≈ 450 ✓
      baseNutrition: { calories: 450, proteinGrams: 38, carbsGrams: 54, fatGrams: 9 },
      ingredients: [
        { name: 'Penne de blé complet', qty: 150, unit: 'g' },
        { name: 'Crevettes décortiquées crues', qty: 250, unit: 'g' },
        { name: 'Tomates cerises', qty: 200, unit: 'g' },
        { name: 'Purée de tomates', qty: 150, unit: 'g' },
        { name: 'Ail', qty: 3, unit: 'gousses' },
        { name: 'Piment rouge frais', qty: 1, unit: 'pce' },
        { name: 'Huile d\'olive', qty: 10, unit: 'ml' },
        { name: 'Basilic frais', qty: 10, unit: 'g' },
        { name: 'Sel, poivre', qty: 1, unit: 'pincée' }
      ],
      steps: [
        'Cuire les penne al dente dans de l\'eau bouillante salée. Réserver 80 ml d\'eau de cuisson.',
        'Dans une poêle, faire revenir l\'ail et le piment émincés dans l\'huile 1 min. Ajouter les tomates cerises coupées en deux, cuire 3 min jusqu\'à ce qu\'elles éclatent.',
        'Ajouter la purée de tomates, laisser mijoter 5 min. Incorporer les crevettes, cuire 3-4 min jusqu\'à ce qu\'elles soient roses. Assaisonner généreusement.',
        'Mélanger les pâtes égouttées à la sauce, ajouter un peu d\'eau de cuisson si nécessaire pour lier. Servir avec le basilic déchiré et un filet d\'huile d\'olive cru.'
      ]
    },

    {
      id: 'R444',
      name: 'Tagliatelles Saumon Épinards Citron',
      emoji: '🐟',
      origin: '🇮🇹',
      mealTypes: ['lunch', 'dinner'],
      category: 'italian',
      tags: ['high-protein', 'omega3', 'anti-inflammatory', 'mediterranean', 'balanced', 'quick'],
      difficulty: 1,
      prepTime: 10,
      cookTime: 15,
      servings: 2,
      // Vérification: P×4 + G×4 + L×9 = 40×4 + 50×4 + 16×9 = 160 + 200 + 144 = 504 kcal ≈ 505 ✓
      baseNutrition: { calories: 505, proteinGrams: 40, carbsGrams: 50, fatGrams: 16 },
      ingredients: [
        { name: 'Tagliatelles fraîches', qty: 200, unit: 'g' },
        { name: 'Filet de saumon sans peau', qty: 280, unit: 'g' },
        { name: 'Épinards frais', qty: 150, unit: 'g' },
        { name: 'Crème fraîche légère (5% MG)', qty: 80, unit: 'g' },
        { name: 'Jus et zeste de citron', qty: 1, unit: 'pce' },
        { name: 'Câpres', qty: 15, unit: 'g' },
        { name: 'Aneth frais', qty: 10, unit: 'g' },
        { name: 'Huile d\'olive', qty: 10, unit: 'ml' },
        { name: 'Sel, poivre noir', qty: 1, unit: 'pincée' }
      ],
      steps: [
        'Cuire les tagliatelles fraîches al dente (env. 3 min). Réserver 60 ml d\'eau de cuisson. Égoutter.',
        'Dans une large poêle, chauffer l\'huile, ajouter le saumon coupé en cubes et cuire 3-4 min. Il doit rester légèrement nacré au cœur. Réserver.',
        'Dans la même poêle, faire tomber les épinards 1 min. Ajouter la crème légère, le jus et le zeste de citron, les câpres. Laisser frémir 2 min.',
        'Ajouter les pâtes et le saumon, mélanger délicatement. Ajuster avec l\'eau de cuisson. Parsemer d\'aneth frais et servir aussitôt.'
      ]
    },

    {
      id: 'R445',
      name: 'Orzo Salade Méditerranéenne',
      emoji: '🥗',
      origin: '🇮🇹',
      mealTypes: ['lunch'],
      category: 'italian',
      tags: ['vegetarian', 'mediterranean', 'meal-prep', 'balanced', 'anti-inflammatory', 'quick'],
      difficulty: 1,
      prepTime: 15,
      cookTime: 10,
      servings: 2,
      // Vérification: P×4 + G×4 + L×9 = 18×4 + 58×4 + 14×9 = 72 + 232 + 126 = 430 kcal ✓
      baseNutrition: { calories: 430, proteinGrams: 18, carbsGrams: 58, fatGrams: 14 },
      ingredients: [
        { name: 'Orzo (pâtes en forme de riz)', qty: 160, unit: 'g' },
        { name: 'Feta allégée', qty: 80, unit: 'g' },
        { name: 'Tomates cerises', qty: 150, unit: 'g' },
        { name: 'Concombre', qty: 100, unit: 'g' },
        { name: 'Olives noires', qty: 40, unit: 'g' },
        { name: 'Poivron rouge', qty: 100, unit: 'g' },
        { name: 'Basilic et menthe frais', qty: 15, unit: 'g' },
        { name: 'Huile d\'olive extra-vierge', qty: 20, unit: 'ml' },
        { name: 'Vinaigre de citron', qty: 15, unit: 'ml' },
        { name: 'Sel, poivre, origan séché', qty: 1, unit: 'pincée' }
      ],
      steps: [
        'Cuire l\'orzo al dente dans de l\'eau bouillante salée (8-10 min). Égoutter, rincer à l\'eau froide pour stopper la cuisson et refroidir rapidement.',
        'Couper les tomates cerises en deux, le concombre en demi-rondelles, le poivron en petits dés. Émietter la feta grossièrement.',
        'Dans un grand bol, mélanger l\'orzo froid avec tous les légumes, les olives, la feta et les herbes ciselées.',
        'Assaisonner avec l\'huile d\'olive, le vinaigre de citron, l\'origan, le sel et le poivre. Mélanger, goûter et ajuster. Servir froid ou à température ambiante — idéal en lunch box.'
      ]
    },

    {
      id: 'R446',
      name: 'Risotto Champignons & Thym Vegan',
      emoji: '🍄',
      origin: '🇮🇹',
      mealTypes: ['lunch', 'dinner'],
      category: 'italian',
      tags: ['vegan', 'vegetarian', 'dairy-free', 'mediterranean', 'anti-inflammatory', 'balanced'],
      difficulty: 2,
      prepTime: 10,
      cookTime: 28,
      servings: 2,
      // Vérification: P×4 + G×4 + L×9 = 14×4 + 68×4 + 12×9 = 56 + 272 + 108 = 436 kcal ≈ 435 ✓
      baseNutrition: { calories: 435, proteinGrams: 14, carbsGrams: 68, fatGrams: 12 },
      ingredients: [
        { name: 'Riz arborio', qty: 160, unit: 'g' },
        { name: 'Champignons mélangés (shiitake, portobello, champignons de Paris)', qty: 300, unit: 'g' },
        { name: 'Bouillon de légumes chaud', qty: 750, unit: 'ml' },
        { name: 'Oignon jaune', qty: 1, unit: 'pce' },
        { name: 'Ail', qty: 2, unit: 'gousses' },
        { name: 'Vin blanc sec', qty: 60, unit: 'ml' },
        { name: 'Huile d\'olive', qty: 20, unit: 'ml' },
        { name: 'Thym frais', qty: 4, unit: 'branches' },
        { name: 'Levure nutritionnelle', qty: 15, unit: 'g' },
        { name: 'Sel, poivre noir', qty: 1, unit: 'pincée' }
      ],
      steps: [
        'Faire sauter les champignons tranchés dans la moitié de l\'huile à feu vif 5 min jusqu\'à coloration dorée. Saler, ajouter l\'ail et le thym. Réserver.',
        'Dans la même casserole, faire revenir l\'oignon émincé dans le reste d\'huile 3 min. Ajouter le riz et nacrer 2 min. Déglacer au vin blanc, laisser absorber.',
        'Incorporer le bouillon chaud louche par louche en remuant régulièrement (18-20 min), jusqu\'à texture crémeuse et riz al dente.',
        'Hors du feu, incorporer la levure nutritionnelle pour une touche umami fromagère. Ajouter les champignons sautés, mélanger, assaisonner et servir immédiatement.'
      ]
    },

    {
      id: 'R447',
      name: 'Pasta Primavera Arc-en-Ciel',
      emoji: '🌈',
      origin: '🇮🇹',
      mealTypes: ['lunch', 'dinner'],
      category: 'italian',
      tags: ['vegetarian', 'balanced', 'anti-inflammatory', 'mediterranean', 'quick', 'meal-prep'],
      difficulty: 1,
      prepTime: 15,
      cookTime: 15,
      servings: 2,
      // Vérification: P×4 + G×4 + L×9 = 22×4 + 60×4 + 12×9 = 88 + 240 + 108 = 436 kcal ≈ 435 ✓
      baseNutrition: { calories: 435, proteinGrams: 22, carbsGrams: 60, fatGrams: 12 },
      ingredients: [
        { name: 'Fusilli tricolores ou penne', qty: 160, unit: 'g' },
        { name: 'Courgette', qty: 120, unit: 'g' },
        { name: 'Poivron rouge', qty: 100, unit: 'g' },
        { name: 'Poivron jaune', qty: 100, unit: 'g' },
        { name: 'Pois chiches en boîte', qty: 120, unit: 'g' },
        { name: 'Tomates cerises', qty: 120, unit: 'g' },
        { name: 'Parmesan râpé', qty: 25, unit: 'g' },
        { name: 'Huile d\'olive', qty: 15, unit: 'ml' },
        { name: 'Basilic frais', qty: 15, unit: 'g' },
        { name: 'Ail en poudre, sel, poivre', qty: 1, unit: 'pincée' }
      ],
      steps: [
        'Cuire les pâtes al dente. Pendant ce temps, couper tous les légumes en dés réguliers de 1 cm.',
        'Dans une grande poêle, faire sauter les poivrons et la courgette dans l\'huile à feu vif 5 min. Ajouter les tomates cerises et les pois chiches, cuire 3 min.',
        'Égoutter les pâtes en réservant 80 ml d\'eau de cuisson. Ajouter les pâtes aux légumes, mélanger et ajouter un peu d\'eau de cuisson pour lier la sauce.',
        'Hors du feu, incorporer le parmesan et le basilic déchiré. Assaisonner avec l\'ail en poudre, sel et poivre. Servir en bowl pour un format trendy.'
      ]
    },

    {
      id: 'R448',
      name: 'Cacio e Pepe Revisité Light',
      emoji: '🧀',
      origin: '🇮🇹',
      mealTypes: ['lunch', 'dinner'],
      category: 'italian',
      tags: ['vegetarian', 'quick', 'balanced', 'mediterranean', 'budget'],
      difficulty: 2,
      prepTime: 5,
      cookTime: 20,
      servings: 2,
      // Vérification: P×4 + G×4 + L×9 = 26×4 + 62×4 + 14×9 = 104 + 248 + 126 = 478 kcal ≈ 480 ✓
      baseNutrition: { calories: 480, proteinGrams: 26, carbsGrams: 62, fatGrams: 14 },
      ingredients: [
        { name: 'Spaghetti ou tonnarelli', qty: 160, unit: 'g' },
        { name: 'Pecorino romano râpé finement', qty: 50, unit: 'g' },
        { name: 'Parmesan finement râpé', qty: 20, unit: 'g' },
        { name: 'Poivre noir en grains entiers', qty: 5, unit: 'g' },
        { name: 'Ricotta allégée', qty: 60, unit: 'g' },
        { name: 'Sel', qty: 1, unit: 'pincée' }
      ],
      steps: [
        'Torréfier le poivre concassé grossièrement à sec dans une grande poêle 1 min. Cuire les pâtes al dente dans très peu d\'eau (concentrée en amidon). Réserver 150 ml d\'eau de cuisson.',
        'Dans un bol, mélanger le pecorino, le parmesan et la ricotta avec 2 cuillères d\'eau de cuisson tiède pour former une crème lisse. Assaisonner.',
        'Ajouter les pâtes égouttées dans la poêle avec le poivre torréfié. Hors du feu, verser la crème fromagère et mélanger vigoureusement en ajoutant l\'eau de cuisson louche par louche.',
        'La sauce doit être soyeuse et enrober chaque spaghetti (technique "mantecatura"). Servir immédiatement dans des assiettes chaudes avec un tour de moulin à poivre généreux.'
      ]
    },

    {
      id: 'R449',
      name: 'Gnocchis Patate Douce Sauge Brûlée',
      emoji: '🟠',
      origin: '🇮🇹',
      mealTypes: ['lunch', 'dinner'],
      category: 'italian',
      tags: ['vegetarian', 'gluten-free', 'anti-inflammatory', 'balanced', 'mediterranean', 'meal-prep'],
      difficulty: 2,
      prepTime: 20,
      cookTime: 20,
      servings: 2,
      // Vérification: P×4 + G×4 + L×9 = 16×4 + 62×4 + 12×9 = 64 + 248 + 108 = 420 kcal ✓
      baseNutrition: { calories: 420, proteinGrams: 16, carbsGrams: 62, fatGrams: 12 },
      ingredients: [
        { name: 'Patates douces', qty: 400, unit: 'g' },
        { name: 'Farine de riz (ou farine T45)', qty: 80, unit: 'g' },
        { name: 'Oeuf entier', qty: 1, unit: 'pce' },
        { name: 'Parmesan râpé', qty: 30, unit: 'g' },
        { name: 'Beurre', qty: 15, unit: 'g' },
        { name: 'Sauge fraîche', qty: 10, unit: 'feuilles' },
        { name: 'Noix', qty: 20, unit: 'g' },
        { name: 'Noix de muscade', qty: 1, unit: 'pincée' },
        { name: 'Sel, poivre noir', qty: 1, unit: 'pincée' }
      ],
      steps: [
        'Cuire les patates douces entières au micro-ondes 8-10 min ou au four 30 min jusqu\'à tendreté. Éplucher et écraser en purée lisse. Laisser refroidir 5 min.',
        'Mélanger la purée avec la farine de riz, l\'oeuf, la moitié du parmesan, la muscade, le sel. Former une pâte souple (ne pas trop travailler). Rouler en boudins de 2 cm de diamètre, couper en tronçons de 2 cm.',
        'Cuire les gnocchis dans de l\'eau bouillante salée : dès qu\'ils remontent en surface, attendre 30 secondes puis égoutter.',
        'Dans une poêle, faire fondre le beurre à feu moyen jusqu\'à coloration noisette, ajouter la sauge et les noix concassées. Faire dorer les gnocchis égouttés 2 min de chaque côté. Servir parsemé du reste de parmesan.'
      ]
    },

  // ─── RECETTES ITALIENNES R450-R459 : PROTÉINES & SECONDI PIATTI ──────────────

    {
      id: 'R450',
      name: 'Pollo alla Pizzaiola Express',
      emoji: '🍅',
      origin: '🇮🇹',
      mealTypes: ['lunch', 'dinner'],
      category: 'italian',
      tags: ['poulet', 'tomate', 'sans-gluten', 'proteine', 'express', 'italienne'],
      difficulty: 1,
      prepTime: 5,
      cookTime: 20,
      servings: 2,
      // Vérification: P×4 + G×4 + L×9 = 38×4 + 12×4 + 10×9 = 152 + 48 + 90 = 290 kcal ✓
      baseNutrition: { calories: 290, proteinGrams: 38, carbsGrams: 12, fatGrams: 10 },
      ingredients: [
        { name: 'Blanc de poulet', qty: 300, unit: 'g' },
        { name: 'Tomates pelées concassées', qty: 200, unit: 'g' },
        { name: 'Ail', qty: 2, unit: 'gousses' },
        { name: 'Origan séché', qty: 2, unit: 'g' },
        { name: 'Câpres', qty: 20, unit: 'g' },
        { name: 'Olives noires dénoyautées', qty: 30, unit: 'g' },
        { name: 'Huile d\'olive', qty: 10, unit: 'ml' },
        { name: 'Sel, poivre', qty: 1, unit: 'pincée' }
      ],
      steps: [
        'Aplatir légèrement les blancs de poulet entre deux feuilles de film alimentaire. Saler et poivrer.',
        'Chauffer l\'huile dans une poêle antiadhésive à feu moyen-vif. Saisir le poulet 3 min de chaque côté jusqu\'à dorure.',
        'Ajouter l\'ail haché, les tomates concassées, l\'origan, les câpres et les olives. Mélanger et couvrir.',
        'Laisser mijoter 10 min à feu moyen jusqu\'à ce que le poulet soit bien cuit. Servir avec un filet d\'huile d\'olive extra-vierge.'
      ]
    },

    {
      id: 'R451',
      name: 'Branzino al Forno con Erbe',
      emoji: '🐟',
      origin: '🇮🇹',
      mealTypes: ['lunch', 'dinner'],
      category: 'italian',
      tags: ['poisson', 'bar', 'four', 'herbes', 'sans-gluten', 'proteine', 'light'],
      difficulty: 1,
      prepTime: 10,
      cookTime: 20,
      servings: 2,
      // Vérification: P×4 + G×4 + L×9 = 40×4 + 4×4 + 11×9 = 160 + 16 + 99 = 275 kcal ✓
      baseNutrition: { calories: 275, proteinGrams: 40, carbsGrams: 4, fatGrams: 11 },
      ingredients: [
        { name: 'Filets de bar (branzino)', qty: 320, unit: 'g' },
        { name: 'Citron', qty: 1, unit: 'pce' },
        { name: 'Ail', qty: 2, unit: 'gousses' },
        { name: 'Persil frais', qty: 15, unit: 'g' },
        { name: 'Romarin frais', qty: 5, unit: 'g' },
        { name: 'Thym frais', qty: 5, unit: 'g' },
        { name: 'Huile d\'olive', qty: 15, unit: 'ml' },
        { name: 'Sel, poivre', qty: 1, unit: 'pincée' }
      ],
      steps: [
        'Préchauffer le four à 200 °C. Tapisser un plat de papier cuisson.',
        'Mélanger l\'huile d\'olive, l\'ail finement haché, le persil, le romarin et le thym. Ajouter le zeste et le jus de citron.',
        'Déposer les filets de bar dans le plat, napper de la marinade aux herbes et assaisonner.',
        'Enfourner 15-18 min jusqu\'à ce que le poisson se défasse facilement à la fourchette. Servir avec des tranches de citron.'
      ]
    },

    {
      id: 'R452',
      name: 'Involtini de Dinde Épinards & Ricotta',
      emoji: '🌿',
      origin: '🇮🇹',
      mealTypes: ['lunch', 'dinner'],
      category: 'italian',
      tags: ['dinde', 'epinards', 'ricotta', 'roule', 'proteine', 'italienne', 'four'],
      difficulty: 2,
      prepTime: 15,
      cookTime: 20,
      servings: 2,
      // Vérification: P×4 + G×4 + L×9 = 42×4 + 8×4 + 14×9 = 168 + 32 + 126 = 326 kcal ✓
      baseNutrition: { calories: 326, proteinGrams: 42, carbsGrams: 8, fatGrams: 14 },
      ingredients: [
        { name: 'Escalopes de dinde fines', qty: 300, unit: 'g' },
        { name: 'Ricotta allégée', qty: 80, unit: 'g' },
        { name: 'Épinards frais', qty: 100, unit: 'g' },
        { name: 'Parmesan râpé', qty: 20, unit: 'g' },
        { name: 'Ail', qty: 1, unit: 'gousse' },
        { name: 'Noix de muscade', qty: 1, unit: 'pincée' },
        { name: 'Huile d\'olive', qty: 10, unit: 'ml' },
        { name: 'Sel, poivre', qty: 1, unit: 'pincée' }
      ],
      steps: [
        'Préchauffer le four à 190 °C. Faire tomber les épinards à sec dans une poêle avec l\'ail haché. Laisser refroidir et presser pour éliminer l\'excès d\'eau.',
        'Mélanger les épinards égouttés avec la ricotta, le parmesan et la muscade. Assaisonner.',
        'Étaler les escalopes, répartir la farce, rouler serré et maintenir avec un pic en bois. Badigeonner d\'huile d\'olive.',
        'Cuire au four 18-20 min. Laisser reposer 2 min avant de retirer les pics et servir avec une salade verte.'
      ]
    },

    {
      id: 'R453',
      name: 'Scaloppine al Limone Light',
      emoji: '🍋',
      origin: '🇮🇹',
      mealTypes: ['lunch', 'dinner'],
      category: 'italian',
      tags: ['veau', 'citron', 'light', 'sans-gluten', 'proteine', 'rapide', 'italienne'],
      difficulty: 1,
      prepTime: 5,
      cookTime: 10,
      servings: 2,
      // Vérification: P×4 + G×4 + L×9 = 44×4 + 6×4 + 9×9 = 176 + 24 + 81 = 281 kcal ✓
      baseNutrition: { calories: 281, proteinGrams: 44, carbsGrams: 6, fatGrams: 9 },
      ingredients: [
        { name: 'Escalopes de veau', qty: 320, unit: 'g' },
        { name: 'Farine de riz', qty: 15, unit: 'g' },
        { name: 'Citron', qty: 1, unit: 'pce' },
        { name: 'Bouillon de volaille dégraissé', qty: 80, unit: 'ml' },
        { name: 'Câpres', qty: 15, unit: 'g' },
        { name: 'Persil frais', qty: 10, unit: 'g' },
        { name: 'Huile d\'olive', qty: 10, unit: 'ml' },
        { name: 'Sel, poivre', qty: 1, unit: 'pincée' }
      ],
      steps: [
        'Aplatir les escalopes finement entre deux films. Fariner légèrement et secouer l\'excédent.',
        'Chauffer l\'huile dans une grande poêle à feu vif. Cuire les escalopes 1-2 min de chaque côté. Réserver au chaud.',
        'Déglacer la poêle avec le jus de citron et le bouillon. Ajouter les câpres et réduire 2 min.',
        'Remettre les escalopes dans la sauce, parsemer de persil ciselé et servir immédiatement.'
      ]
    },

    {
      id: 'R454',
      name: 'Salmone alla Griglia Siciliana',
      emoji: '🐠',
      origin: '🇮🇹',
      mealTypes: ['lunch', 'dinner'],
      category: 'italian',
      tags: ['saumon', 'grille', 'sicile', 'omega3', 'proteine', 'sans-gluten', 'italienne'],
      difficulty: 1,
      prepTime: 10,
      cookTime: 10,
      servings: 2,
      // Vérification: P×4 + G×4 + L×9 = 42×4 + 6×4 + 18×9 = 168 + 24 + 162 = 354 kcal ✓
      baseNutrition: { calories: 354, proteinGrams: 42, carbsGrams: 6, fatGrams: 18 },
      ingredients: [
        { name: 'Pavés de saumon', qty: 300, unit: 'g' },
        { name: 'Tomates cerises', qty: 100, unit: 'g' },
        { name: 'Olives vertes dénoyautées', qty: 30, unit: 'g' },
        { name: 'Câpres', qty: 15, unit: 'g' },
        { name: 'Origan séché', qty: 2, unit: 'g' },
        { name: 'Citron', qty: 1, unit: 'pce' },
        { name: 'Huile d\'olive', qty: 15, unit: 'ml' },
        { name: 'Sel, poivre', qty: 1, unit: 'pincée' }
      ],
      steps: [
        'Préparer la salsa sicilienne : couper les tomates cerises en deux, mélanger avec les olives, les câpres, l\'origan, le zeste de citron et la moitié de l\'huile.',
        'Badigeonner les pavés de saumon du reste d\'huile, saler et poivrer. Chauffer un grill ou une poêle grillée à feu vif.',
        'Cuire le saumon 3-4 min de chaque côté selon l\'épaisseur, jusqu\'à caramélisation des bords.',
        'Dresser les pavés sur assiette, napper de salsa sicilienne et arroser d\'un filet de jus de citron.'
      ]
    },

    {
      id: 'R455',
      name: 'Polpette di Tacchino al Pomodoro',
      emoji: '🧆',
      origin: '🇮🇹',
      mealTypes: ['lunch', 'dinner'],
      category: 'italian',
      tags: ['dinde', 'boulettes', 'tomate', 'proteine', 'italienne', 'batch-cooking', 'poele'],
      difficulty: 1,
      prepTime: 15,
      cookTime: 20,
      servings: 2,
      // Vérification: P×4 + G×4 + L×9 = 40×4 + 14×4 + 10×9 = 160 + 56 + 90 = 306 kcal ✓
      baseNutrition: { calories: 306, proteinGrams: 40, carbsGrams: 14, fatGrams: 10 },
      ingredients: [
        { name: 'Viande hachée de dinde', qty: 300, unit: 'g' },
        { name: 'Œuf', qty: 1, unit: 'pce' },
        { name: 'Parmesan râpé', qty: 20, unit: 'g' },
        { name: 'Ail', qty: 1, unit: 'gousse' },
        { name: 'Persil frais', qty: 10, unit: 'g' },
        { name: 'Tomates pelées concassées', qty: 250, unit: 'g' },
        { name: 'Basilic frais', qty: 10, unit: 'g' },
        { name: 'Huile d\'olive', qty: 10, unit: 'ml' },
        { name: 'Sel, poivre', qty: 1, unit: 'pincée' }
      ],
      steps: [
        'Mélanger la dinde hachée avec l\'œuf, le parmesan, l\'ail et le persil hachés. Assaisonner et former des boulettes de 3 cm.',
        'Dorer les boulettes dans l\'huile à feu moyen-vif 3-4 min en les tournant régulièrement.',
        'Verser les tomates concassées, couvrir et mijoter 15 min à feu doux en remuant de temps en temps.',
        'Parsemer de basilic ciselé et servir avec du pain grillé aux céréales ou des légumes vapeur.'
      ]
    },

    {
      id: 'R456',
      name: 'Tonno Scottato Sesamo & Rucola',
      emoji: '🥗',
      origin: '🇮🇹',
      mealTypes: ['lunch', 'dinner'],
      category: 'italian',
      tags: ['thon', 'sesame', 'roquette', 'snacking', 'proteine', 'rapide', 'italienne'],
      difficulty: 1,
      prepTime: 10,
      cookTime: 5,
      servings: 2,
      // Vérification: P×4 + G×4 + L×9 = 46×4 + 4×4 + 14×9 = 184 + 16 + 126 = 326 kcal ✓
      baseNutrition: { calories: 326, proteinGrams: 46, carbsGrams: 4, fatGrams: 14 },
      ingredients: [
        { name: 'Pavés de thon rouge frais', qty: 320, unit: 'g' },
        { name: 'Graines de sésame blanc et noir', qty: 30, unit: 'g' },
        { name: 'Roquette', qty: 60, unit: 'g' },
        { name: 'Citron', qty: 1, unit: 'pce' },
        { name: 'Huile d\'olive', qty: 10, unit: 'ml' },
        { name: 'Sauce soja allégée', qty: 10, unit: 'ml' },
        { name: 'Sel, poivre', qty: 1, unit: 'pincée' }
      ],
      steps: [
        'Mélanger les graines de sésame blanc et noir dans une assiette creuse. Rouler les pavés de thon dans les graines pour les enrober uniformément.',
        'Chauffer une poêle à feu très vif sans matière grasse. Saisir le thon 45 secondes à 1 min par face : l\'extérieur doit être doré, l\'intérieur rosé.',
        'Pendant ce temps, assaisonner la roquette avec l\'huile d\'olive, le jus de citron et la sauce soja.',
        'Trancher le thon en médaillons et disposer sur le lit de roquette. Terminer avec le zeste de citron et servir immédiatement.'
      ]
    },

    {
      id: 'R457',
      name: 'Pollo al Limone e Capperi',
      emoji: '🍋',
      origin: '🇮🇹',
      mealTypes: ['lunch', 'dinner'],
      category: 'italian',
      tags: ['poulet', 'citron', 'capres', 'light', 'proteine', 'italienne', 'sans-gluten'],
      difficulty: 1,
      prepTime: 5,
      cookTime: 20,
      servings: 2,
      // Vérification: P×4 + G×4 + L×9 = 40×4 + 5×4 + 9×9 = 160 + 20 + 81 = 261 kcal ✓
      baseNutrition: { calories: 261, proteinGrams: 40, carbsGrams: 5, fatGrams: 9 },
      ingredients: [
        { name: 'Blanc de poulet', qty: 300, unit: 'g' },
        { name: 'Citron', qty: 2, unit: 'pce' },
        { name: 'Câpres rincées', qty: 25, unit: 'g' },
        { name: 'Bouillon de volaille dégraissé', qty: 100, unit: 'ml' },
        { name: 'Ail', qty: 2, unit: 'gousses' },
        { name: 'Thym frais', qty: 5, unit: 'g' },
        { name: 'Huile d\'olive', qty: 10, unit: 'ml' },
        { name: 'Sel, poivre', qty: 1, unit: 'pincée' }
      ],
      steps: [
        'Couper les blancs de poulet en fines tranches dans l\'épaisseur. Assaisonner de sel, poivre et thym.',
        'Chauffer l\'huile à feu moyen-vif. Saisir le poulet 3 min de chaque côté. Retirer et réserver.',
        'Dans la même poêle, faire revenir l\'ail haché 30 s, déglacer au jus de citron et au bouillon. Ajouter les câpres et le zeste. Réduire 3 min.',
        'Remettre le poulet dans la sauce, chauffer 2 min et servir nappé de sauce au citron-câpres.'
      ]
    },

    {
      id: 'R458',
      name: 'Gamberoni all\'Aglio e Prezzemolo',
      emoji: '🦐',
      origin: '🇮🇹',
      mealTypes: ['lunch', 'dinner'],
      category: 'italian',
      tags: ['crevettes', 'ail', 'persil', 'express', 'proteine', 'italienne', 'sans-gluten'],
      difficulty: 1,
      prepTime: 10,
      cookTime: 8,
      servings: 2,
      // Vérification: P×4 + G×4 + L×9 = 36×4 + 4×4 + 12×9 = 144 + 16 + 108 = 268 kcal ✓
      baseNutrition: { calories: 268, proteinGrams: 36, carbsGrams: 4, fatGrams: 12 },
      ingredients: [
        { name: 'Grosses crevettes décortiquées (gambas)', qty: 300, unit: 'g' },
        { name: 'Ail', qty: 4, unit: 'gousses' },
        { name: 'Persil frais', qty: 20, unit: 'g' },
        { name: 'Piment rouge frais', qty: 1, unit: 'pce' },
        { name: 'Citron', qty: 1, unit: 'pce' },
        { name: 'Huile d\'olive', qty: 20, unit: 'ml' },
        { name: 'Sel, poivre', qty: 1, unit: 'pincée' }
      ],
      steps: [
        'Sécher les crevettes avec du papier absorbant. Hacher l\'ail et le persil. Émincer finement le piment.',
        'Chauffer l\'huile à feu vif dans une grande poêle. Ajouter l\'ail et le piment, faire revenir 30 secondes jusqu\'à dorure légère.',
        'Ajouter les crevettes en une seule couche, cuire 2 min de chaque côté jusqu\'à ce qu\'elles soient rosées et légèrement caramélisées.',
        'Hors du feu, ajouter le persil haché et le jus de citron. Mélanger et servir immédiatement avec des quartiers de citron.'
      ]
    },

    {
      id: 'R459',
      name: 'Bistecca di Manzo con Gremolata',
      emoji: '🥩',
      origin: '🇮🇹',
      mealTypes: ['lunch', 'dinner'],
      category: 'italian',
      tags: ['boeuf', 'gremolata', 'steak', 'proteine', 'sans-gluten', 'italienne', 'grill'],
      difficulty: 2,
      prepTime: 10,
      cookTime: 10,
      servings: 2,
      // Vérification: P×4 + G×4 + L×9 = 44×4 + 4×4 + 14×9 = 176 + 16 + 126 = 318 kcal ✓
      baseNutrition: { calories: 318, proteinGrams: 44, carbsGrams: 4, fatGrams: 14 },
      ingredients: [
        { name: 'Steak de bœuf maigre (rumsteck)', qty: 300, unit: 'g' },
        { name: 'Persil frais', qty: 20, unit: 'g' },
        { name: 'Ail', qty: 2, unit: 'gousses' },
        { name: 'Citron (zeste)', qty: 1, unit: 'pce' },
        { name: 'Romarin frais', qty: 5, unit: 'g' },
        { name: 'Huile d\'olive', qty: 15, unit: 'ml' },
        { name: 'Sel de mer, poivre noir', qty: 1, unit: 'pincée' }
      ],
      steps: [
        'Préparer la gremolata : hacher finement le persil, l\'ail et le romarin, mélanger avec le zeste de citron et 5 ml d\'huile. Réserver.',
        'Sortir la viande 15 min avant cuisson. Badigeonner du reste d\'huile, saler et poivrer généreusement des deux côtés.',
        'Chauffer un grill en fonte à feu maximal jusqu\'à ce qu\'il soit très chaud. Saisir le steak 3-4 min de chaque côté pour une cuisson saignante à à point.',
        'Laisser reposer la viande 3 min sous une feuille d\'aluminium. Trancher et servir nappé de gremolata.'
      ]
    },


  // ─── RECETTES LEGACY L001-L350 MIGRÉES EN FORMAT R ────────────────────────────

  {
    id: 'L001',
    name: 'Overnight Oats Banane Amandes',
    emoji: '🥣',
    origin: '🇺🇸',
    mealTypes: ['breakfast'],
    tags: ['breakfast', 'avoine', 'banane', 'amandes', 'miel', 'lait', 'healthy'],
    difficulty: 1,
    prepTime: 5,
    cookTime: 0,
    servings: 1,
    baseNutrition: { calories: 422, proteinGrams: 18, carbsGrams: 56, fatGrams: 14 },
    ingredients: [
      { name: 'Flocons d\'avoine', qty: 80, unit: 'g' },
      { name: 'Lait écrémé', qty: 200, unit: 'ml' },
      { name: 'Banane', qty: 100, unit: 'g' },
      { name: 'Amandes effilées', qty: 20, unit: 'g' },
      { name: 'Miel', qty: 10, unit: 'g' }
    ],
    steps: [
      'Mélanger les flocons d\'avoine avec le lait dans un bol.',
      'Ajouter le miel et remuer.',
      'Réfrigérer une nuit. Garnir de banane tranchée et d\'amandes avant de servir.'
    ]
  },

  {
    id: 'L002',
    name: 'Avocado Toast Œuf Poché',
    emoji: '🍞',
    origin: '🇦🇺',
    mealTypes: ['breakfast'],
    tags: ['breakfast', 'pain', 'avocat', 'œuf', 'citron', 'healthy'],
    difficulty: 2,
    prepTime: 5,
    cookTime: 10,
    servings: 1,
    baseNutrition: { calories: 458, proteinGrams: 20, carbsGrams: 36, fatGrams: 26 },
    ingredients: [
      { name: 'Pain complet', qty: 80, unit: 'g' },
      { name: 'Avocat', qty: 100, unit: 'g' },
      { name: 'Œuf', qty: 60, unit: 'g' },
      { name: 'Citron', qty: 10, unit: 'ml' },
      { name: 'Piment rouge', qty: 2, unit: 'g' },
      { name: 'Sel', qty: 1, unit: 'g' },
      { name: 'Poivre', qty: 1, unit: 'g' }
    ],
    steps: [
      'Faire pocher l\'œuf dans de l\'eau frémissante avec un peu de vinaigre.',
      'Écraser l\'avocat avec le citron, sel et piment.',
      'Tartiner le pain grillé d\'avocat et poser l\'œuf par-dessus.'
    ]
  },

  {
    id: 'L003',
    name: 'Yaourt Grec Myrtilles Granola',
    emoji: '🥣',
    origin: '🇬🇷',
    mealTypes: ['breakfast'],
    tags: ['breakfast', 'yaourt', 'myrtilles', 'granola', 'miel', 'healthy'],
    difficulty: 1,
    prepTime: 5,
    cookTime: 0,
    servings: 1,
    baseNutrition: { calories: 386, proteinGrams: 26, carbsGrams: 48, fatGrams: 10 },
    ingredients: [
      { name: 'Yaourt grec 0%', qty: 200, unit: 'g' },
      { name: 'Myrtilles', qty: 100, unit: 'g' },
      { name: 'Granola', qty: 60, unit: 'g' },
      { name: 'Miel', qty: 10, unit: 'g' }
    ],
    steps: [
      'Verser le yaourt dans un bol.',
      'Ajouter les myrtilles fraîches et le granola.',
      'Drizzler de miel et servir immédiatement.'
    ]
  },

  {
    id: 'L004',
    name: 'Porridge Pomme & Cannelle',
    emoji: '🥣',
    origin: '🇬🇧',
    mealTypes: ['breakfast'],
    tags: ['breakfast', 'avoine', 'pomme', 'cannelle', 'miel', 'lait', 'healthy'],
    difficulty: 1,
    prepTime: 3,
    cookTime: 5,
    servings: 1,
    baseNutrition: { calories: 384, proteinGrams: 14, carbsGrams: 64, fatGrams: 8 },
    ingredients: [
      { name: 'Flocons d\'avoine', qty: 90, unit: 'g' },
      { name: 'Lait demi-écrémé', qty: 250, unit: 'ml' },
      { name: 'Pomme', qty: 120, unit: 'g' },
      { name: 'Cannelle', qty: 2, unit: 'g' },
      { name: 'Miel', qty: 15, unit: 'g' }
    ],
    steps: [
      'Porter le lait à ébullition, ajouter les flocons d\'avoine.',
      'Cuire 5 min à feu doux en remuant.',
      'Servir avec la pomme râpée, la cannelle et le miel.'
    ]
  },

  {
    id: 'L005',
    name: 'Œufs Brouillés Pain Seigle',
    emoji: '🍞',
    origin: '🇩🇪',
    mealTypes: ['breakfast'],
    tags: ['breakfast', 'œuf', 'pain', 'seigle', 'beurre', 'ciboulette', 'healthy'],
    difficulty: 2,
    prepTime: 5,
    cookTime: 10,
    servings: 1,
    baseNutrition: { calories: 446, proteinGrams: 28, carbsGrams: 34, fatGrams: 22 },
    ingredients: [
      { name: 'Œufs', qty: 180, unit: 'g' },
      { name: 'Pain de seigle', qty: 80, unit: 'g' },
      { name: 'Beurre', qty: 15, unit: 'g' },
      { name: 'Ciboulette', qty: 5, unit: 'g' },
      { name: 'Sel', qty: 1, unit: 'g' },
      { name: 'Poivre', qty: 1, unit: 'g' }
    ],
    steps: [
      'Battre les œufs avec sel et poivre.',
      'Faire fondre le beurre à feu doux, verser les œufs.',
      'Remuer doucement jusqu\'à texture crémeuse. Servir sur pain de seigle grillé avec ciboulette.'
    ]
  },

  {
    id: 'L006',
    name: 'Shakshuka Tomate Poivron',
    emoji: '🍳',
    origin: '🇮🇱',
    mealTypes: ['breakfast'],
    tags: ['breakfast', 'œuf', 'tomate', 'poivron', 'oignon', 'huile', 'healthy'],
    difficulty: 2,
    prepTime: 5,
    cookTime: 10,
    servings: 1,
    baseNutrition: { calories: 376, proteinGrams: 22, carbsGrams: 18, fatGrams: 24 },
    ingredients: [
      { name: 'Œufs', qty: 180, unit: 'g' },
      { name: 'Tomates pelées', qty: 200, unit: 'g' },
      { name: 'Poivron rouge', qty: 100, unit: 'g' },
      { name: 'Oignon', qty: 60, unit: 'g' },
      { name: 'Huile d\'olive', qty: 20, unit: 'ml' },
      { name: 'Cumin', qty: 2, unit: 'g' },
      { name: 'Paprika', qty: 2, unit: 'g' }
    ],
    steps: [
      'Faire revenir l\'oignon et le poivron dans l\'huile d\'olive.',
      'Ajouter les tomates, cumin, paprika, mijoter 10 min.',
      'Creuser des puits, casser les œufs dedans, couvrir et cuire 5 min.'
    ]
  },

  {
    id: 'L007',
    name: 'Smoothie Bowl Açaí',
    emoji: '🥣',
    origin: '🇧🇷',
    mealTypes: ['breakfast'],
    tags: ['breakfast', 'açaí', 'banane', 'granola', 'fraises', 'lait de coco', 'healthy'],
    difficulty: 1,
    prepTime: 5,
    cookTime: 0,
    servings: 1,
    baseNutrition: { calories: 418, proteinGrams: 14, carbsGrams: 68, fatGrams: 10 },
    ingredients: [
      { name: 'Pulpe d\'açaí', qty: 100, unit: 'g' },
      { name: 'Banane', qty: 100, unit: 'g' },
      { name: 'Lait de coco', qty: 80, unit: 'ml' },
      { name: 'Granola', qty: 50, unit: 'g' },
      { name: 'Fraises', qty: 80, unit: 'g' },
      { name: 'Miel', qty: 10, unit: 'g' }
    ],
    steps: [
      'Mixer la pulpe d\'açaí avec la banane et le lait de coco.',
      'Verser dans un bol.',
      'Garnir de granola, fraises et miel.'
    ]
  },

  {
    id: 'L008',
    name: 'Bol Riz Tamago Japonais',
    emoji: '🍳',
    origin: '🇯🇵',
    mealTypes: ['breakfast'],
    tags: ['breakfast', 'riz', 'œuf', 'soja', 'sésame', 'nori', 'healthy'],
    difficulty: 2,
    prepTime: 5,
    cookTime: 0,
    servings: 1,
    baseNutrition: { calories: 430, proteinGrams: 18, carbsGrams: 58, fatGrams: 14 },
    ingredients: [
      { name: 'Riz japonais', qty: 120, unit: 'g' },
      { name: 'Œuf', qty: 120, unit: 'g' },
      { name: 'Sauce soja', qty: 15, unit: 'ml' },
      { name: 'Huile de sésame', qty: 8, unit: 'ml' },
      { name: 'Nori', qty: 5, unit: 'g' },
      { name: 'Sésame', qty: 5, unit: 'g' }
    ],
    steps: [
      'Cuire le riz japonais.',
      'Battre les œufs avec la sauce soja.',
      'Verser les œufs crus sur le riz chaud, mélanger vivement. Finir avec huile de sésame et nori.'
    ]
  },

  {
    id: 'L009',
    name: 'Pancakes Banane Avoine',
    emoji: '🥣',
    origin: '🇺🇸',
    mealTypes: ['breakfast'],
    tags: ['breakfast', 'avoine', 'banane', 'œuf', 'lait', 'healthy'],
    difficulty: 2,
    prepTime: 10,
    cookTime: 15,
    servings: 1,
    baseNutrition: { calories: 468, proteinGrams: 30, carbsGrams: 60, fatGrams: 12 },
    ingredients: [
      { name: 'Flocons d\'avoine', qty: 100, unit: 'g' },
      { name: 'Banane', qty: 100, unit: 'g' },
      { name: 'Œufs', qty: 120, unit: 'g' },
      { name: 'Lait écrémé', qty: 100, unit: 'ml' },
      { name: 'Levure', qty: 3, unit: 'g' }
    ],
    steps: [
      'Mixer tous les ingrédients en pâte lisse.',
      'Cuire des petites crêpes épaisses dans une poêle antiadhésive.',
      'Servir avec un filet de miel ou sirop d\'érable.'
    ]
  },

  {
    id: 'L010',
    name: 'Galette Sarrasin Œuf Épinards',
    emoji: '🍳',
    origin: '🇫🇷',
    mealTypes: ['breakfast'],
    tags: ['breakfast', 'sarrasin', 'œuf', 'épinards', 'fromage', 'healthy'],
    difficulty: 2,
    prepTime: 5,
    cookTime: 10,
    servings: 1,
    baseNutrition: { calories: 392, proteinGrams: 22, carbsGrams: 40, fatGrams: 16 },
    ingredients: [
      { name: 'Farine de sarrasin', qty: 80, unit: 'g' },
      { name: 'Œuf', qty: 60, unit: 'g' },
      { name: 'Épinards frais', qty: 80, unit: 'g' },
      { name: 'Emmental râpé', qty: 30, unit: 'g' },
      { name: 'Beurre', qty: 10, unit: 'g' },
      { name: 'Eau', qty: 150, unit: 'ml' }
    ],
    steps: [
      'Préparer la pâte avec farine de sarrasin, eau et œuf. Laisser reposer 30 min.',
      'Cuire une galette fine dans une crêpière beurrée.',
      'Garnir d\'épinards sautés et d\'emmental, replier les bords.'
    ]
  },

  {
    id: 'L011',
    name: 'French Toast Cannelle Banane',
    emoji: '🍞',
    origin: '🇫🇷',
    mealTypes: ['breakfast'],
    tags: ['breakfast', 'pain', 'œuf', 'lait', 'banane', 'cannelle', 'healthy'],
    difficulty: 2,
    prepTime: 5,
    cookTime: 0,
    servings: 1,
    baseNutrition: { calories: 454, proteinGrams: 26, carbsGrams: 56, fatGrams: 14 },
    ingredients: [
      { name: 'Pain de mie complet', qty: 100, unit: 'g' },
      { name: 'Œufs', qty: 120, unit: 'g' },
      { name: 'Lait écrémé', qty: 100, unit: 'ml' },
      { name: 'Banane', qty: 100, unit: 'g' },
      { name: 'Cannelle', qty: 2, unit: 'g' },
      { name: 'Vanille', qty: 2, unit: 'ml' }
    ],
    steps: [
      'Battre les œufs avec le lait, la cannelle et la vanille.',
      'Tremper les tranches de pain dans le mélange.',
      'Cuire 2-3 min de chaque côté dans une poêle légèrement huilée. Servir avec banane tranchée.'
    ]
  },

  {
    id: 'L012',
    name: 'Müesli Bircher Pomme',
    emoji: '🥣',
    origin: '🇨🇭',
    mealTypes: ['breakfast'],
    tags: ['breakfast', 'avoine', 'yaourt', 'pomme', 'noisettes', 'raisins', 'healthy'],
    difficulty: 1,
    prepTime: 5,
    cookTime: 0,
    servings: 1,
    baseNutrition: { calories: 454, proteinGrams: 20, carbsGrams: 62, fatGrams: 14 },
    ingredients: [
      { name: 'Flocons d\'avoine', qty: 80, unit: 'g' },
      { name: 'Yaourt nature', qty: 150, unit: 'g' },
      { name: 'Pomme', qty: 120, unit: 'g' },
      { name: 'Noisettes', qty: 20, unit: 'g' },
      { name: 'Raisins secs', qty: 20, unit: 'g' },
      { name: 'Jus de citron', qty: 10, unit: 'ml' }
    ],
    steps: [
      'Mélanger les flocons d\'avoine avec le yaourt et le jus de citron.',
      'Ajouter la pomme râpée, les raisins secs et les noisettes.',
      'Réfrigérer toute la nuit et servir frais.'
    ]
  },

  {
    id: 'L013',
    name: 'Toast Saumon Fumé Aneth',
    emoji: '🍞',
    origin: '🇸🇪',
    mealTypes: ['breakfast'],
    tags: ['breakfast', 'pain', 'saumon', 'fromage frais', 'aneth', 'câpres', 'healthy'],
    difficulty: 1,
    prepTime: 5,
    cookTime: 0,
    servings: 1,
    baseNutrition: { calories: 420, proteinGrams: 28, carbsGrams: 32, fatGrams: 20 },
    ingredients: [
      { name: 'Pain complet', qty: 80, unit: 'g' },
      { name: 'Saumon fumé', qty: 100, unit: 'g' },
      { name: 'Fromage frais', qty: 60, unit: 'g' },
      { name: 'Aneth', qty: 5, unit: 'g' },
      { name: 'Câpres', qty: 10, unit: 'g' },
      { name: 'Citron', qty: 10, unit: 'ml' }
    ],
    steps: [
      'Griller le pain.',
      'Tartiner de fromage frais.',
      'Disposer le saumon fumé, les câpres, l\'aneth et un filet de citron.'
    ]
  },

  {
    id: 'L014',
    name: 'Congee Poulet Gingembre',
    emoji: '🌅',
    origin: '🇨🇳',
    mealTypes: ['breakfast'],
    tags: ['breakfast', 'riz', 'poulet', 'gingembre', 'oignon vert', 'soja', 'healthy'],
    difficulty: 2,
    prepTime: 5,
    cookTime: 0,
    servings: 1,
    baseNutrition: { calories: 384, proteinGrams: 32, carbsGrams: 46, fatGrams: 8 },
    ingredients: [
      { name: 'Riz rond', qty: 80, unit: 'g' },
      { name: 'Blancs de poulet', qty: 120, unit: 'g' },
      { name: 'Gingembre', qty: 10, unit: 'g' },
      { name: 'Bouillon de volaille', qty: 600, unit: 'ml' },
      { name: 'Oignons verts', qty: 20, unit: 'g' },
      { name: 'Sauce soja', qty: 10, unit: 'ml' }
    ],
    steps: [
      'Porter le bouillon à ébullition avec le riz et le gingembre.',
      'Cuire 30-40 min à feu doux jusqu\'à texture crémeuse.',
      'Ajouter le poulet effiloché, finir avec oignons verts et sauce soja.'
    ]
  },

  {
    id: 'L015',
    name: 'Tamagoyaki Omelette Roulée',
    emoji: '🍳',
    origin: '🇯🇵',
    mealTypes: ['breakfast'],
    tags: ['breakfast', 'œuf', 'soja', 'oignon vert', 'healthy'],
    difficulty: 3,
    prepTime: 5,
    cookTime: 10,
    servings: 1,
    baseNutrition: { calories: 352, proteinGrams: 24, carbsGrams: 10, fatGrams: 24 },
    ingredients: [
      { name: 'Œufs', qty: 240, unit: 'g' },
      { name: 'Sauce soja', qty: 10, unit: 'ml' },
      { name: 'Mirin halal', qty: 10, unit: 'ml' },
      { name: 'Sucre', qty: 5, unit: 'g' },
      { name: 'Huile', qty: 10, unit: 'ml' },
      { name: 'Oignons verts', qty: 15, unit: 'g' }
    ],
    steps: [
      'Battre les œufs avec la sauce soja, mirin et sucre.',
      'Chauffer une poêle rectangulaire, huiler légèrement.',
      'Verser un tiers de la pâte, rouler délicatement à l\'aide d\'une spatule. Répéter 3 fois pour former un rouleau compact.'
    ]
  },

  {
    id: 'L016',
    name: 'Eggs Benedict Saumon',
    emoji: '🍳',
    origin: '🇺🇸',
    mealTypes: ['breakfast'],
    tags: ['breakfast', 'muffin', 'saumon', 'œuf', 'sauce hollandaise', 'épinards', 'healthy'],
    difficulty: 3,
    prepTime: 5,
    cookTime: 0,
    servings: 1,
    baseNutrition: { calories: 480, proteinGrams: 32, carbsGrams: 34, fatGrams: 24 },
    ingredients: [
      { name: 'Muffin anglais', qty: 70, unit: 'g' },
      { name: 'Saumon fumé', qty: 80, unit: 'g' },
      { name: 'Œuf', qty: 120, unit: 'g' },
      { name: 'Sauce hollandaise', qty: 40, unit: 'g' },
      { name: 'Épinards', qty: 40, unit: 'g' }
    ],
    steps: [
      'Griller les muffins anglais.',
      'Pocher les œufs dans de l\'eau frémissante.',
      'Assembler: muffin, épinards, saumon, œuf poché, sauce hollandaise.'
    ]
  },

  {
    id: 'L017',
    name: 'Fluffy Pancakes Soufflés',
    emoji: '🍳',
    origin: '🇯🇵',
    mealTypes: ['breakfast'],
    tags: ['breakfast', 'farine', 'œuf', 'lait', 'yaourt', 'beurre', 'healthy'],
    difficulty: 3,
    prepTime: 10,
    cookTime: 15,
    servings: 1,
    baseNutrition: { calories: 438, proteinGrams: 22, carbsGrams: 56, fatGrams: 14 },
    ingredients: [
      { name: 'Farine', qty: 90, unit: 'g' },
      { name: 'Œufs', qty: 120, unit: 'g' },
      { name: 'Lait', qty: 100, unit: 'ml' },
      { name: 'Yaourt', qty: 80, unit: 'g' },
      { name: 'Levure', qty: 5, unit: 'g' },
      { name: 'Sucre', qty: 15, unit: 'g' },
      { name: 'Beurre', qty: 10, unit: 'g' }
    ],
    steps: [
      'Séparer les blancs des jaunes d\'œufs. Monter les blancs en neige ferme.',
      'Mélanger les jaunes, farine, lait, yaourt, sucre et levure.',
      'Incorporer délicatement les blancs en neige. Cuire à feu très doux 4 min par côté sous couvercle.'
    ]
  },

  {
    id: 'L018',
    name: 'Crêpes Sarrasin Miel Noix',
    emoji: '🍳',
    origin: '🇫🇷',
    mealTypes: ['breakfast'],
    tags: ['breakfast', 'sarrasin', 'œuf', 'lait', 'noix', 'miel', 'healthy'],
    difficulty: 2,
    prepTime: 10,
    cookTime: 15,
    servings: 1,
    baseNutrition: { calories: 412, proteinGrams: 24, carbsGrams: 52, fatGrams: 12 },
    ingredients: [
      { name: 'Farine de sarrasin', qty: 80, unit: 'g' },
      { name: 'Œuf', qty: 60, unit: 'g' },
      { name: 'Lait écrémé', qty: 200, unit: 'ml' },
      { name: 'Noix concassées', qty: 20, unit: 'g' },
      { name: 'Miel', qty: 15, unit: 'g' },
      { name: 'Beurre', qty: 8, unit: 'g' }
    ],
    steps: [
      'Préparer la pâte de sarrasin avec œuf, farine et lait.',
      'Cuire des crêpes fines dans une poêle beurrée.',
      'Servir avec miel et noix concassées.'
    ]
  },

  {
    id: 'L019',
    name: 'Bol Açaí Fraises Granola',
    emoji: '🥣',
    origin: '🇧🇷',
    mealTypes: ['breakfast'],
    tags: ['breakfast', 'açaí', 'fraises', 'granola', 'yaourt', 'chia', 'healthy'],
    difficulty: 1,
    prepTime: 5,
    cookTime: 0,
    servings: 1,
    baseNutrition: { calories: 394, proteinGrams: 20, carbsGrams: 38, fatGrams: 18 },
    ingredients: [
      { name: 'Pulpe d\'açaí', qty: 100, unit: 'g' },
      { name: 'Fraises', qty: 100, unit: 'g' },
      { name: 'Granola', qty: 50, unit: 'g' },
      { name: 'Yaourt grec', qty: 100, unit: 'g' },
      { name: 'Graines de chia', qty: 10, unit: 'g' }
    ],
    steps: [
      'Mixer l\'açaí avec les fraises.',
      'Verser dans un bol, déposer le yaourt grec par-dessus.',
      'Garnir de granola et graines de chia.'
    ]
  },

  {
    id: 'L020',
    name: 'Toast Avocat Œuf Dur Tomate',
    emoji: '🍞',
    origin: '🇦🇺',
    mealTypes: ['breakfast'],
    tags: ['breakfast', 'pain', 'avocat', 'œuf', 'tomate', 'healthy'],
    difficulty: 1,
    prepTime: 5,
    cookTime: 10,
    servings: 1,
    baseNutrition: { calories: 374, proteinGrams: 18, carbsGrams: 44, fatGrams: 14 },
    ingredients: [
      { name: 'Pain complet', qty: 80, unit: 'g' },
      { name: 'Avocat', qty: 60, unit: 'g' },
      { name: 'Œuf dur', qty: 60, unit: 'g' },
      { name: 'Tomate', qty: 80, unit: 'g' },
      { name: 'Jus de citron', qty: 5, unit: 'ml' },
      { name: 'Sel', qty: 1, unit: 'g' },
      { name: 'Poivre', qty: 1, unit: 'g' }
    ],
    steps: [
      'Griller le pain complet.',
      'Écraser l\'avocat avec citron, sel et poivre.',
      'Disposer l\'avocat sur le pain, garnir d\'œuf dur tranché et de tomate.'
    ]
  },

  {
    id: 'L021',
    name: 'Porridge Banane Chocolat Noir',
    emoji: '🥣',
    origin: '🇬🇧',
    mealTypes: ['breakfast'],
    tags: ['breakfast', 'avoine', 'lait', 'banane', 'chocolat', 'miel', 'healthy'],
    difficulty: 1,
    prepTime: 3,
    cookTime: 5,
    servings: 1,
    baseNutrition: { calories: 394, proteinGrams: 16, carbsGrams: 60, fatGrams: 10 },
    ingredients: [
      { name: 'Flocons d\'avoine', qty: 90, unit: 'g' },
      { name: 'Lait écrémé', qty: 250, unit: 'ml' },
      { name: 'Banane', qty: 100, unit: 'g' },
      { name: 'Pépites de chocolat noir', qty: 15, unit: 'g' },
      { name: 'Miel', qty: 10, unit: 'g' }
    ],
    steps: [
      'Cuire les flocons d\'avoine dans le lait à feu doux 5 min.',
      'Trancher la banane et disposer sur le porridge.',
      'Parsemer de pépites de chocolat et drizzler de miel.'
    ]
  },

  {
    id: 'L022',
    name: 'Omelette Épinards Feta Tomate',
    emoji: '🍳',
    origin: '🇬🇷',
    mealTypes: ['breakfast'],
    tags: ['breakfast', 'œuf', 'épinards', 'feta', 'tomate', 'huile', 'healthy'],
    difficulty: 2,
    prepTime: 5,
    cookTime: 10,
    servings: 1,
    baseNutrition: { calories: 408, proteinGrams: 28, carbsGrams: 20, fatGrams: 24 },
    ingredients: [
      { name: 'Œufs', qty: 180, unit: 'g' },
      { name: 'Épinards frais', qty: 80, unit: 'g' },
      { name: 'Feta', qty: 40, unit: 'g' },
      { name: 'Tomate', qty: 80, unit: 'g' },
      { name: 'Huile d\'olive', qty: 10, unit: 'ml' },
      { name: 'Origan', qty: 2, unit: 'g' }
    ],
    steps: [
      'Battre les œufs avec sel et origan.',
      'Faire revenir les épinards et la tomate dans l\'huile d\'olive.',
      'Verser les œufs, cuire 3 min, ajouter la feta émiettée et plier.'
    ]
  },

  {
    id: 'L023',
    name: 'Bowl Quinoa Fruits Rouges Miel',
    emoji: '🥛',
    origin: '🇺🇸',
    mealTypes: ['breakfast'],
    tags: ['breakfast', 'quinoa', 'yaourt', 'framboises', 'myrtilles', 'amandes', 'healthy'],
    difficulty: 1,
    prepTime: 5,
    cookTime: 0,
    servings: 1,
    baseNutrition: { calories: 410, proteinGrams: 26, carbsGrams: 36, fatGrams: 18 },
    ingredients: [
      { name: 'Quinoa', qty: 80, unit: 'g' },
      { name: 'Yaourt grec', qty: 150, unit: 'g' },
      { name: 'Framboises', qty: 80, unit: 'g' },
      { name: 'Myrtilles', qty: 60, unit: 'g' },
      { name: 'Amandes', qty: 20, unit: 'g' },
      { name: 'Miel', qty: 10, unit: 'g' }
    ],
    steps: [
      'Cuire le quinoa, laisser refroidir.',
      'Assembler dans un bol: quinoa, yaourt grec, fruits rouges.',
      'Garnir d\'amandes et de miel.'
    ]
  },

  {
    id: 'L024',
    name: 'Crumpets Œuf Fromage Blanc',
    emoji: '🍳',
    origin: '🇬🇧',
    mealTypes: ['breakfast'],
    tags: ['breakfast', 'crumpet', 'œuf', 'fromage blanc', 'saumon', 'ciboulette', 'healthy'],
    difficulty: 2,
    prepTime: 5,
    cookTime: 10,
    servings: 1,
    baseNutrition: { calories: 384, proteinGrams: 30, carbsGrams: 30, fatGrams: 16 },
    ingredients: [
      { name: 'Crumpets', qty: 100, unit: 'g' },
      { name: 'Œufs', qty: 120, unit: 'g' },
      { name: 'Fromage blanc 0%', qty: 120, unit: 'g' },
      { name: 'Ciboulette', qty: 5, unit: 'g' },
      { name: 'Saumon fumé', qty: 50, unit: 'g' }
    ],
    steps: [
      'Griller les crumpets.',
      'Poêler les œufs au plat.',
      'Servir les crumpets garnis de fromage blanc, œuf et saumon, parsemer de ciboulette.'
    ]
  },

  {
    id: 'L025',
    name: 'Muesli Noix Fruits Secs Yaourt',
    emoji: '🥣',
    origin: '🇨🇭',
    mealTypes: ['breakfast'],
    tags: ['breakfast', 'avoine', 'yaourt', 'noix', 'abricot', 'lin', 'miel', 'healthy'],
    difficulty: 1,
    prepTime: 5,
    cookTime: 0,
    servings: 1,
    baseNutrition: { calories: 380, proteinGrams: 22, carbsGrams: 46, fatGrams: 12 },
    ingredients: [
      { name: 'Flocons d\'avoine', qty: 70, unit: 'g' },
      { name: 'Yaourt nature', qty: 200, unit: 'g' },
      { name: 'Noix', qty: 20, unit: 'g' },
      { name: 'Abricots secs', qty: 30, unit: 'g' },
      { name: 'Graines de lin', qty: 10, unit: 'g' },
      { name: 'Miel', qty: 10, unit: 'g' }
    ],
    steps: [
      'Tremper les flocons d\'avoine dans le yaourt une nuit.',
      'Ajouter noix concassées, abricots secs et graines de lin.',
      'Finir avec un filet de miel.'
    ]
  },

  {
    id: 'L026',
    name: 'Wrap Petit Déjeuner Œuf Avocat',
    emoji: '🥑',
    origin: '🇲🇽',
    mealTypes: ['breakfast'],
    tags: ['breakfast', 'tortilla', 'œuf', 'avocat', 'tomate', 'poivron', 'healthy'],
    difficulty: 2,
    prepTime: 5,
    cookTime: 10,
    servings: 1,
    baseNutrition: { calories: 388, proteinGrams: 20, carbsGrams: 50, fatGrams: 12 },
    ingredients: [
      { name: 'Tortilla de blé', qty: 60, unit: 'g' },
      { name: 'Œuf brouillé', qty: 120, unit: 'g' },
      { name: 'Avocat', qty: 60, unit: 'g' },
      { name: 'Tomate', qty: 60, unit: 'g' },
      { name: 'Poivron', qty: 40, unit: 'g' },
      { name: 'Épices', qty: 2, unit: 'g' }
    ],
    steps: [
      'Brouiller les œufs avec sel et épices.',
      'Chauffer la tortilla.',
      'Garnir d\'œufs brouillés, avocat, tomate et poivron. Rouler.'
    ]
  },

  {
    id: 'L027',
    name: 'Gaufres Avoine Miel Myrtilles',
    emoji: '🥣',
    origin: '🇧🇪',
    mealTypes: ['breakfast'],
    tags: ['breakfast', 'avoine', 'lait', 'œuf', 'miel', 'myrtilles', 'healthy'],
    difficulty: 2,
    prepTime: 10,
    cookTime: 15,
    servings: 1,
    baseNutrition: { calories: 386, proteinGrams: 12, carbsGrams: 62, fatGrams: 10 },
    ingredients: [
      { name: 'Flocons d\'avoine', qty: 100, unit: 'g' },
      { name: 'Lait écrémé', qty: 150, unit: 'ml' },
      { name: 'Œuf', qty: 60, unit: 'g' },
      { name: 'Miel', qty: 20, unit: 'g' },
      { name: 'Myrtilles', qty: 100, unit: 'g' },
      { name: 'Huile', qty: 5, unit: 'ml' }
    ],
    steps: [
      'Mixer les flocons d\'avoine en poudre fine. Mélanger avec lait, œuf et miel.',
      'Cuire dans un gaufrier huilé.',
      'Servir avec les myrtilles fraîches.'
    ]
  },

  {
    id: 'L028',
    name: 'Burritos Petit Déjeuner Haricots',
    emoji: '🍳',
    origin: '🇲🇽',
    mealTypes: ['breakfast'],
    tags: ['breakfast', 'tortilla', 'haricots', 'œuf', 'fromage', 'salsa', 'épinards', 'healthy'],
    difficulty: 2,
    prepTime: 5,
    cookTime: 0,
    servings: 1,
    baseNutrition: { calories: 392, proteinGrams: 24, carbsGrams: 38, fatGrams: 16 },
    ingredients: [
      { name: 'Tortilla', qty: 70, unit: 'g' },
      { name: 'Haricots noirs', qty: 100, unit: 'g' },
      { name: 'Œuf', qty: 120, unit: 'g' },
      { name: 'Fromage râpé', qty: 30, unit: 'g' },
      { name: 'Salsa', qty: 40, unit: 'g' },
      { name: 'Épinards', qty: 40, unit: 'g' }
    ],
    steps: [
      'Brouiller les œufs.',
      'Chauffer les haricots noirs à la poêle.',
      'Assembler la tortilla avec œufs, haricots, fromage et salsa. Rouler.'
    ]
  },

  {
    id: 'L029',
    name: 'Bowl Fromage Blanc Fruits Graines',
    emoji: '🥛',
    origin: '🇫🇷',
    mealTypes: ['breakfast'],
    tags: ['breakfast', 'fromage blanc', 'kiwi', 'fraises', 'graines', 'amandes', 'miel', 'healthy'],
    difficulty: 1,
    prepTime: 5,
    cookTime: 0,
    servings: 1,
    baseNutrition: { calories: 394, proteinGrams: 26, carbsGrams: 32, fatGrams: 18 },
    ingredients: [
      { name: 'Fromage blanc 0%', qty: 200, unit: 'g' },
      { name: 'Kiwi', qty: 80, unit: 'g' },
      { name: 'Fraises', qty: 80, unit: 'g' },
      { name: 'Graines de courge', qty: 20, unit: 'g' },
      { name: 'Amandes effilées', qty: 20, unit: 'g' },
      { name: 'Miel', qty: 10, unit: 'g' }
    ],
    steps: [
      'Verser le fromage blanc dans un bol.',
      'Disposer les fruits coupés par-dessus.',
      'Parsemer de graines et amandes, finir avec le miel.'
    ]
  },

  {
    id: 'L030',
    name: 'Pancakes Flocons Avoine Myrtilles',
    emoji: '🥣',
    origin: '🇺🇸',
    mealTypes: ['breakfast'],
    tags: ['breakfast', 'avoine', 'lait', 'œuf', 'myrtilles', 'healthy'],
    difficulty: 2,
    prepTime: 10,
    cookTime: 15,
    servings: 1,
    baseNutrition: { calories: 396, proteinGrams: 14, carbsGrams: 58, fatGrams: 12 },
    ingredients: [
      { name: 'Flocons d\'avoine', qty: 100, unit: 'g' },
      { name: 'Lait écrémé', qty: 150, unit: 'ml' },
      { name: 'Œuf', qty: 60, unit: 'g' },
      { name: 'Myrtilles', qty: 80, unit: 'g' },
      { name: 'Levure', qty: 3, unit: 'g' },
      { name: 'Huile', qty: 8, unit: 'ml' }
    ],
    steps: [
      'Mixer les flocons d\'avoine en farine. Mélanger avec lait, œuf, levure.',
      'Cuire des petits pancakes dans une poêle avec un peu d\'huile.',
      'Servir avec les myrtilles fraîches.'
    ]
  },

  {
    id: 'L031',
    name: 'Omelette Blanche Champignons Épinards',
    emoji: '🍳',
    origin: '🇫🇷',
    mealTypes: ['breakfast'],
    tags: ['breakfast', 'blancs d\'œuf', 'champignons', 'épinards', 'chèvre', 'healthy'],
    difficulty: 2,
    prepTime: 5,
    cookTime: 10,
    servings: 1,
    baseNutrition: { calories: 390, proteinGrams: 34, carbsGrams: 14, fatGrams: 22 },
    ingredients: [
      { name: 'Blancs d\'œufs', qty: 200, unit: 'g' },
      { name: 'Champignons', qty: 100, unit: 'g' },
      { name: 'Épinards', qty: 80, unit: 'g' },
      { name: 'Fromage de chèvre', qty: 30, unit: 'g' },
      { name: 'Huile d\'olive', qty: 10, unit: 'ml' },
      { name: 'Herbes de Provence', qty: 2, unit: 'g' }
    ],
    steps: [
      'Faire sauter les champignons et épinards dans l\'huile d\'olive.',
      'Verser les blancs d\'œufs battus par-dessus.',
      'Cuire à feu moyen, ajouter le fromage de chèvre, plier.'
    ]
  },

  {
    id: 'L032',
    name: 'Bowl Açaí Banane Beurre de Cacahuète',
    emoji: '🥣',
    origin: '🇧🇷',
    mealTypes: ['breakfast'],
    tags: ['breakfast', 'açaí', 'banane', 'granola', 'cacahuète', 'lait d\'amande', 'healthy'],
    difficulty: 1,
    prepTime: 5,
    cookTime: 0,
    servings: 1,
    baseNutrition: { calories: 408, proteinGrams: 18, carbsGrams: 48, fatGrams: 16 },
    ingredients: [
      { name: 'Pulpe d\'açaí', qty: 100, unit: 'g' },
      { name: 'Banane', qty: 100, unit: 'g' },
      { name: 'Granola', qty: 50, unit: 'g' },
      { name: 'Beurre de cacahuète', qty: 20, unit: 'g' },
      { name: 'Lait d\'amande', qty: 80, unit: 'ml' }
    ],
    steps: [
      'Mixer l\'açaí avec la banane et le lait d\'amande.',
      'Verser dans un bol.',
      'Garnir de granola et beurre de cacahuète.'
    ]
  },

  {
    id: 'L033',
    name: 'Tartines Pain Complet Œuf Pesto',
    emoji: '🍞',
    origin: '🇮🇹',
    mealTypes: ['breakfast'],
    tags: ['breakfast', 'pain', 'œuf', 'pesto', 'tomate', 'roquette', 'healthy'],
    difficulty: 1,
    prepTime: 5,
    cookTime: 10,
    servings: 1,
    baseNutrition: { calories: 382, proteinGrams: 22, carbsGrams: 42, fatGrams: 14 },
    ingredients: [
      { name: 'Pain complet', qty: 80, unit: 'g' },
      { name: 'Œuf dur', qty: 120, unit: 'g' },
      { name: 'Pesto basilic', qty: 20, unit: 'g' },
      { name: 'Tomate cerise', qty: 80, unit: 'g' },
      { name: 'Roquette', qty: 20, unit: 'g' }
    ],
    steps: [
      'Griller le pain complet.',
      'Tartiner de pesto.',
      'Garnir de rondelles d\'œufs durs, tomates cerises et roquette.'
    ]
  },

  {
    id: 'L034',
    name: 'Chia Pudding Mangue-Coco',
    emoji: '🌅',
    origin: '🇹🇭',
    mealTypes: ['breakfast'],
    tags: ['breakfast', 'chia', 'lait de coco', 'mangue', 'miel', 'coco', 'healthy'],
    difficulty: 1,
    prepTime: 5,
    cookTime: 0,
    servings: 1,
    baseNutrition: { calories: 398, proteinGrams: 16, carbsGrams: 52, fatGrams: 14 },
    ingredients: [
      { name: 'Graines de chia', qty: 40, unit: 'g' },
      { name: 'Lait de coco', qty: 200, unit: 'ml' },
      { name: 'Mangue', qty: 120, unit: 'g' },
      { name: 'Miel', qty: 10, unit: 'g' },
      { name: 'Noix de coco râpée', qty: 15, unit: 'g' }
    ],
    steps: [
      'Mélanger les graines de chia avec le lait de coco et le miel.',
      'Réfrigérer toute la nuit jusqu\'à prise en gel.',
      'Servir avec la mangue coupée et la noix de coco râpée.'
    ]
  },

  {
    id: 'L035',
    name: 'Pain Perdu Ricotta Fruits Rouges',
    emoji: '🍞',
    origin: '🇫🇷',
    mealTypes: ['breakfast'],
    tags: ['breakfast', 'pain brioché', 'ricotta', 'œuf', 'framboises', 'beurre', 'healthy'],
    difficulty: 2,
    prepTime: 5,
    cookTime: 0,
    servings: 1,
    baseNutrition: { calories: 414, proteinGrams: 26, carbsGrams: 28, fatGrams: 22 },
    ingredients: [
      { name: 'Pain brioché', qty: 80, unit: 'g' },
      { name: 'Ricotta', qty: 100, unit: 'g' },
      { name: 'Œufs', qty: 120, unit: 'g' },
      { name: 'Framboises', qty: 60, unit: 'g' },
      { name: 'Sucre vanillé', qty: 5, unit: 'g' },
      { name: 'Beurre', qty: 10, unit: 'g' }
    ],
    steps: [
      'Battre les œufs, tremper le pain brioché.',
      'Cuire dans une poêle avec le beurre.',
      'Servir avec la ricotta fouettée et les framboises fraîches.'
    ]
  },

  {
    id: 'L036',
    name: 'Granola Maison Yaourt Mangue',
    emoji: '🥣',
    origin: '🇺🇸',
    mealTypes: ['breakfast'],
    tags: ['breakfast', 'avoine', 'miel', 'amandes', 'yaourt', 'mangue', 'healthy'],
    difficulty: 2,
    prepTime: 5,
    cookTime: 0,
    servings: 1,
    baseNutrition: { calories: 406, proteinGrams: 20, carbsGrams: 50, fatGrams: 14 },
    ingredients: [
      { name: 'Flocons d\'avoine', qty: 80, unit: 'g' },
      { name: 'Miel', qty: 20, unit: 'g' },
      { name: 'Amandes', qty: 20, unit: 'g' },
      { name: 'Huile de coco', qty: 8, unit: 'g' },
      { name: 'Yaourt grec', qty: 150, unit: 'g' },
      { name: 'Mangue', qty: 100, unit: 'g' }
    ],
    steps: [
      'Mélanger flocons, miel, amandes et huile de coco. Étaler sur plaque.',
      'Cuire au four à 160°C pendant 20 min en remuant à mi-cuisson.',
      'Servir sur le yaourt grec avec la mangue.'
    ]
  },

  {
    id: 'L037',
    name: 'Smoothie Bowl Framboise Protéiné',
    emoji: '🥣',
    origin: '🇺🇸',
    mealTypes: ['breakfast'],
    tags: ['breakfast', 'framboises', 'banane', 'yaourt', 'granola', 'chia', 'healthy'],
    difficulty: 1,
    prepTime: 5,
    cookTime: 0,
    servings: 1,
    baseNutrition: { calories: 386, proteinGrams: 18, carbsGrams: 56, fatGrams: 10 },
    ingredients: [
      { name: 'Framboises', qty: 150, unit: 'g' },
      { name: 'Banane', qty: 100, unit: 'g' },
      { name: 'Yaourt grec', qty: 100, unit: 'g' },
      { name: 'Granola', qty: 60, unit: 'g' },
      { name: 'Graines de chia', qty: 10, unit: 'g' },
      { name: 'Miel', qty: 5, unit: 'g' }
    ],
    steps: [
      'Mixer les framboises, banane et yaourt grec.',
      'Verser dans un bol.',
      'Garnir de granola, graines de chia et miel.'
    ]
  },

  {
    id: 'L038',
    name: 'Œufs Cocotte Tomate Épinards',
    emoji: '🍳',
    origin: '🇫🇷',
    mealTypes: ['breakfast'],
    tags: ['breakfast', 'œuf', 'épinards', 'tomate', 'crème', 'fromage', 'healthy'],
    difficulty: 2,
    prepTime: 5,
    cookTime: 10,
    servings: 1,
    baseNutrition: { calories: 398, proteinGrams: 32, carbsGrams: 18, fatGrams: 22 },
    ingredients: [
      { name: 'Œufs', qty: 180, unit: 'g' },
      { name: 'Épinards', qty: 100, unit: 'g' },
      { name: 'Tomate', qty: 100, unit: 'g' },
      { name: 'Crème légère', qty: 30, unit: 'ml' },
      { name: 'Fromage râpé', qty: 20, unit: 'g' },
      { name: 'Sel', qty: 1, unit: 'g' },
      { name: 'Poivre', qty: 1, unit: 'g' }
    ],
    steps: [
      'Préchauffer le four à 180°C.',
      'Disposer épinards et tomate dans des ramequins, casser les œufs par-dessus.',
      'Ajouter la crème et le fromage, cuire 12-15 min.'
    ]
  },

  {
    id: 'L039',
    name: 'Flocons d\'Avoine Poires Cannelle',
    emoji: '🥣',
    origin: '🇫🇷',
    mealTypes: ['breakfast'],
    tags: ['breakfast', 'avoine', 'poire', 'lait', 'cannelle', 'miel', 'healthy'],
    difficulty: 1,
    prepTime: 3,
    cookTime: 5,
    servings: 1,
    baseNutrition: { calories: 386, proteinGrams: 14, carbsGrams: 60, fatGrams: 10 },
    ingredients: [
      { name: 'Flocons d\'avoine', qty: 90, unit: 'g' },
      { name: 'Poire', qty: 120, unit: 'g' },
      { name: 'Lait écrémé', qty: 250, unit: 'ml' },
      { name: 'Cannelle', qty: 2, unit: 'g' },
      { name: 'Cardamome', qty: 1, unit: 'g' },
      { name: 'Miel', qty: 10, unit: 'g' }
    ],
    steps: [
      'Porter le lait à ébullition, verser sur les flocons.',
      'Laisser gonfler 5 min.',
      'Ajouter la poire râpée, cannelle, cardamome et miel.'
    ]
  },

  {
    id: 'L040',
    name: 'Pancakes Ricotta Citron',
    emoji: '🍳',
    origin: '🇮🇹',
    mealTypes: ['breakfast'],
    tags: ['breakfast', 'farine', 'ricotta', 'œuf', 'lait', 'citron', 'healthy'],
    difficulty: 2,
    prepTime: 10,
    cookTime: 15,
    servings: 1,
    baseNutrition: { calories: 410, proteinGrams: 22, carbsGrams: 40, fatGrams: 18 },
    ingredients: [
      { name: 'Farine', qty: 70, unit: 'g' },
      { name: 'Ricotta', qty: 100, unit: 'g' },
      { name: 'Œufs', qty: 120, unit: 'g' },
      { name: 'Lait', qty: 80, unit: 'ml' },
      { name: 'Citron zeste', qty: 5, unit: 'g' },
      { name: 'Sucre', qty: 10, unit: 'g' },
      { name: 'Levure', qty: 3, unit: 'g' }
    ],
    steps: [
      'Mélanger tous les ingrédients en pâte lisse.',
      'Cuire des pancakes dans une poêle antiadhésive.',
      'Servir avec un zeste de citron et miel.'
    ]
  },

  {
    id: 'L041',
    name: 'Overnight Oats Mangue Coco',
    emoji: '🥣',
    origin: '🇹🇭',
    mealTypes: ['breakfast'],
    tags: ['breakfast', 'avoine', 'lait de coco', 'mangue', 'coco', 'miel', 'healthy'],
    difficulty: 1,
    prepTime: 5,
    cookTime: 0,
    servings: 1,
    baseNutrition: { calories: 388, proteinGrams: 16, carbsGrams: 54, fatGrams: 12 },
    ingredients: [
      { name: 'Flocons d\'avoine', qty: 80, unit: 'g' },
      { name: 'Lait de coco', qty: 180, unit: 'ml' },
      { name: 'Mangue', qty: 100, unit: 'g' },
      { name: 'Noix de coco râpée', qty: 15, unit: 'g' },
      { name: 'Miel', qty: 10, unit: 'g' }
    ],
    steps: [
      'Mélanger flocons d\'avoine, lait de coco et miel.',
      'Réfrigérer une nuit.',
      'Garnir de mangue fraîche et noix de coco.'
    ]
  },

  {
    id: 'L042',
    name: 'Bowl Protéiné Fromage Blanc Noix',
    emoji: '🥛',
    origin: '🇫🇷',
    mealTypes: ['breakfast'],
    tags: ['breakfast', 'fromage blanc', 'noix', 'noisettes', 'miel', 'pomme', 'healthy'],
    difficulty: 1,
    prepTime: 5,
    cookTime: 0,
    servings: 1,
    baseNutrition: { calories: 412, proteinGrams: 24, carbsGrams: 34, fatGrams: 20 },
    ingredients: [
      { name: 'Fromage blanc 0%', qty: 200, unit: 'g' },
      { name: 'Noix', qty: 25, unit: 'g' },
      { name: 'Noisettes', qty: 15, unit: 'g' },
      { name: 'Miel', qty: 15, unit: 'g' },
      { name: 'Cannelle', qty: 1, unit: 'g' },
      { name: 'Pomme', qty: 80, unit: 'g' }
    ],
    steps: [
      'Verser le fromage blanc dans un bol.',
      'Couper la pomme en petits dés.',
      'Garnir de noix, noisettes, pomme et miel.'
    ]
  },

  {
    id: 'L043',
    name: 'Toast Beurre d\'Amande Banane Graines',
    emoji: '🍞',
    origin: '🇺🇸',
    mealTypes: ['breakfast'],
    tags: ['breakfast', 'pain', 'amande', 'banane', 'graines', 'miel', 'healthy'],
    difficulty: 1,
    prepTime: 5,
    cookTime: 0,
    servings: 1,
    baseNutrition: { calories: 410, proteinGrams: 20, carbsGrams: 42, fatGrams: 18 },
    ingredients: [
      { name: 'Pain complet', qty: 80, unit: 'g' },
      { name: 'Beurre d\'amande', qty: 30, unit: 'g' },
      { name: 'Banane', qty: 100, unit: 'g' },
      { name: 'Graines de courge', qty: 10, unit: 'g' },
      { name: 'Cannelle', qty: 1, unit: 'g' },
      { name: 'Miel', qty: 5, unit: 'g' }
    ],
    steps: [
      'Griller le pain complet.',
      'Tartiner généreusement de beurre d\'amande.',
      'Garnir de rondelles de banane, graines et un filet de miel.'
    ]
  },

  {
    id: 'L044',
    name: 'Omelette Turque Menthe Feta',
    emoji: '🍳',
    origin: '🇹🇷',
    mealTypes: ['breakfast'],
    tags: ['breakfast', 'œuf', 'feta', 'menthe', 'tomate', 'oignon', 'healthy'],
    difficulty: 2,
    prepTime: 5,
    cookTime: 10,
    servings: 1,
    baseNutrition: { calories: 416, proteinGrams: 28, carbsGrams: 22, fatGrams: 24 },
    ingredients: [
      { name: 'Œufs', qty: 180, unit: 'g' },
      { name: 'Feta', qty: 50, unit: 'g' },
      { name: 'Menthe fraîche', qty: 10, unit: 'g' },
      { name: 'Tomate', qty: 80, unit: 'g' },
      { name: 'Oignon', qty: 40, unit: 'g' },
      { name: 'Huile d\'olive', qty: 12, unit: 'ml' }
    ],
    steps: [
      'Battre les œufs avec sel et menthe ciselée.',
      'Faire revenir oignon et tomate dans l\'huile.',
      'Verser les œufs, parsemer de feta, cuire jusqu\'à prise.'
    ]
  },

  {
    id: 'L045',
    name: 'Bol Riz Brun Œuf Poché Avocat',
    emoji: '🥑',
    origin: '🇯🇵',
    mealTypes: ['breakfast'],
    tags: ['breakfast', 'riz brun', 'œuf', 'avocat', 'soja', 'sésame', 'nori', 'healthy'],
    difficulty: 2,
    prepTime: 5,
    cookTime: 10,
    servings: 1,
    baseNutrition: { calories: 388, proteinGrams: 22, carbsGrams: 48, fatGrams: 12 },
    ingredients: [
      { name: 'Riz brun', qty: 80, unit: 'g' },
      { name: 'Œuf poché', qty: 60, unit: 'g' },
      { name: 'Avocat', qty: 60, unit: 'g' },
      { name: 'Sauce soja', qty: 10, unit: 'ml' },
      { name: 'Sésame', qty: 5, unit: 'g' },
      { name: 'Nori', qty: 5, unit: 'g' }
    ],
    steps: [
      'Cuire le riz brun.',
      'Pocher l\'œuf dans de l\'eau frémissante.',
      'Disposer le riz, l\'avocat tranché, l\'œuf. Arroser de sauce soja et parsemer de sésame.'
    ]
  },

  {
    id: 'L046',
    name: 'Porridge Cacao Banane Noisette',
    emoji: '🥣',
    origin: '🇨🇭',
    mealTypes: ['breakfast'],
    tags: ['breakfast', 'avoine', 'lait', 'cacao', 'banane', 'noisettes', 'healthy'],
    difficulty: 1,
    prepTime: 3,
    cookTime: 5,
    servings: 1,
    baseNutrition: { calories: 384, proteinGrams: 14, carbsGrams: 64, fatGrams: 8 },
    ingredients: [
      { name: 'Flocons d\'avoine', qty: 90, unit: 'g' },
      { name: 'Lait écrémé', qty: 250, unit: 'ml' },
      { name: 'Cacao non sucré', qty: 10, unit: 'g' },
      { name: 'Banane', qty: 100, unit: 'g' },
      { name: 'Noisettes', qty: 15, unit: 'g' }
    ],
    steps: [
      'Cuire les flocons d\'avoine dans le lait.',
      'Incorporer le cacao en remuant.',
      'Garnir de banane tranchée et noisettes concassées.'
    ]
  },

  {
    id: 'L047',
    name: 'Shakshuka aux Légumes Épicée',
    emoji: '🍳',
    origin: '🇲🇦',
    mealTypes: ['breakfast'],
    tags: ['breakfast', 'œuf', 'tomate', 'poivron', 'pois chiches', 'harissa', 'healthy'],
    difficulty: 2,
    prepTime: 5,
    cookTime: 10,
    servings: 1,
    baseNutrition: { calories: 412, proteinGrams: 30, carbsGrams: 28, fatGrams: 20 },
    ingredients: [
      { name: 'Œufs', qty: 240, unit: 'g' },
      { name: 'Tomates', qty: 200, unit: 'g' },
      { name: 'Poivron', qty: 80, unit: 'g' },
      { name: 'Pois chiches', qty: 80, unit: 'g' },
      { name: 'Harissa', qty: 10, unit: 'g' },
      { name: 'Cumin', qty: 2, unit: 'g' },
      { name: 'Huile d\'olive', qty: 10, unit: 'ml' }
    ],
    steps: [
      'Faire revenir poivron et épices dans l\'huile.',
      'Ajouter tomates et pois chiches, mijoter 10 min.',
      'Casser les œufs dans la sauce, couvrir et cuire 5-6 min.'
    ]
  },

  {
    id: 'L048',
    name: 'Crêpes Blé Complet Fromage Blanc Fruits',
    emoji: '🍳',
    origin: '🇫🇷',
    mealTypes: ['breakfast'],
    tags: ['breakfast', 'farine', 'lait', 'œuf', 'fromage blanc', 'fraises', 'miel', 'healthy'],
    difficulty: 2,
    prepTime: 10,
    cookTime: 15,
    servings: 1,
    baseNutrition: { calories: 378, proteinGrams: 22, carbsGrams: 50, fatGrams: 10 },
    ingredients: [
      { name: 'Farine complète', qty: 80, unit: 'g' },
      { name: 'Lait écrémé', qty: 200, unit: 'ml' },
      { name: 'Œuf', qty: 60, unit: 'g' },
      { name: 'Fromage blanc', qty: 100, unit: 'g' },
      { name: 'Fraises', qty: 80, unit: 'g' },
      { name: 'Miel', qty: 10, unit: 'g' }
    ],
    steps: [
      'Préparer la pâte à crêpes avec farine, lait et œuf.',
      'Cuire des crêpes fines.',
      'Garnir de fromage blanc, fraises et miel.'
    ]
  },

  {
    id: 'L049',
    name: 'Bowl Protéiné Quinoa Baies Amandes',
    emoji: '🥛',
    origin: '🇺🇸',
    mealTypes: ['breakfast'],
    tags: ['breakfast', 'quinoa', 'yaourt', 'amandes', 'myrtilles', 'framboises', 'miel', 'healthy'],
    difficulty: 1,
    prepTime: 5,
    cookTime: 0,
    servings: 1,
    baseNutrition: { calories: 390, proteinGrams: 26, carbsGrams: 40, fatGrams: 14 },
    ingredients: [
      { name: 'Quinoa', qty: 80, unit: 'g' },
      { name: 'Yaourt grec', qty: 150, unit: 'g' },
      { name: 'Amandes', qty: 20, unit: 'g' },
      { name: 'Myrtilles', qty: 80, unit: 'g' },
      { name: 'Framboises', qty: 60, unit: 'g' },
      { name: 'Miel', qty: 10, unit: 'g' }
    ],
    steps: [
      'Cuire le quinoa, laisser refroidir.',
      'Mélanger avec le yaourt grec.',
      'Garnir d\'amandes, myrtilles et framboises.'
    ]
  },

  {
    id: 'L050',
    name: 'Tartine Saumon Avocat Citron',
    emoji: '🍞',
    origin: '🇸🇪',
    mealTypes: ['breakfast'],
    tags: ['breakfast', 'pain', 'saumon', 'avocat', 'citron', 'aneth', 'healthy'],
    difficulty: 1,
    prepTime: 5,
    cookTime: 0,
    servings: 1,
    baseNutrition: { calories: 412, proteinGrams: 20, carbsGrams: 38, fatGrams: 20 },
    ingredients: [
      { name: 'Pain complet', qty: 80, unit: 'g' },
      { name: 'Saumon fumé', qty: 80, unit: 'g' },
      { name: 'Avocat', qty: 80, unit: 'g' },
      { name: 'Citron', qty: 10, unit: 'ml' },
      { name: 'Aneth', qty: 5, unit: 'g' },
      { name: 'Fromage blanc', qty: 30, unit: 'g' }
    ],
    steps: [
      'Griller le pain complet.',
      'Écraser l\'avocat avec citron et sel.',
      'Tartiner d\'avocat, disposer le saumon, le fromage blanc et l\'aneth.'
    ]
  },

  {
    id: 'L101',
    name: 'Poulet Grillé Riz Basmati',
    emoji: '🍗',
    origin: '🌍',
    mealTypes: ['lunch'],
    tags: ['lunch', 'poulet', 'riz', 'citron', 'persil', 'healthy'],
    difficulty: 1,
    prepTime: 10,
    cookTime: 15,
    servings: 1,
    baseNutrition: { calories: 566, proteinGrams: 48, carbsGrams: 62, fatGrams: 14 },
    ingredients: [
      { name: 'Blanc de poulet', qty: 200, unit: 'g' },
      { name: 'Riz basmati', qty: 120, unit: 'g' },
      { name: 'Huile d\'olive', qty: 10, unit: 'ml' },
      { name: 'Épices', qty: 3, unit: 'g' },
      { name: 'Citron', qty: 1, unit: 'g' },
      { name: 'Persil', qty: 1, unit: 'g' }
    ],
    steps: [
      'Mariner le poulet avec huile, épices et citron.',
      'Griller 6 min de chaque côté.',
      'Servir avec le riz basmati cuit et le persil.'
    ]
  },

  {
    id: 'L102',
    name: 'Saumon Quinoa Brocoli',
    emoji: '🐟',
    origin: '🌍',
    mealTypes: ['lunch'],
    tags: ['lunch', 'saumon', 'quinoa', 'brocoli', 'huile', 'healthy'],
    difficulty: 2,
    prepTime: 15,
    cookTime: 20,
    servings: 1,
    baseNutrition: { calories: 596, proteinGrams: 42, carbsGrams: 44, fatGrams: 28 },
    ingredients: [
      { name: 'Filet de saumon', qty: 200, unit: 'g' },
      { name: 'Quinoa', qty: 90, unit: 'g' },
      { name: 'Brocoli', qty: 150, unit: 'g' },
      { name: 'Huile d\'olive', qty: 15, unit: 'ml' },
      { name: 'Citron', qty: 1, unit: 'g' },
      { name: 'Sel', qty: 1, unit: 'g' }
    ],
    steps: [
      'Cuire le quinoa et le brocoli à la vapeur.',
      'Poêler le saumon 4 min de chaque côté.',
      'Servir avec un filet d\'huile d\'olive et citron.'
    ]
  },

  {
    id: 'L103',
    name: 'Poke Bowl Thon Avocat',
    emoji: '🐟',
    origin: '🌺',
    mealTypes: ['lunch'],
    tags: ['lunch', 'thon', 'riz', 'avocat', 'edamame', 'carotte', 'soja', 'healthy'],
    difficulty: 2,
    prepTime: 15,
    cookTime: 20,
    servings: 1,
    baseNutrition: { calories: 576, proteinGrams: 38, carbsGrams: 52, fatGrams: 24 },
    ingredients: [
      { name: 'Thon frais', qty: 180, unit: 'g' },
      { name: 'Riz japonais', qty: 120, unit: 'g' },
      { name: 'Avocat', qty: 80, unit: 'g' },
      { name: 'Edamame', qty: 60, unit: 'g' },
      { name: 'Carotte', qty: 40, unit: 'g' },
      { name: 'Sauce soja', qty: 20, unit: 'ml' },
      { name: 'Sésame', qty: 10, unit: 'g' }
    ],
    steps: [
      'Cuire le riz japonais.',
      'Couper le thon et l\'avocat en dés.',
      'Assembler le bol avec tous les ingrédients, arroser de sauce soja.'
    ]
  },

  {
    id: 'L104',
    name: 'Steak Bœuf Patate Douce',
    emoji: '🥩',
    origin: '🇺🇸',
    mealTypes: ['lunch'],
    tags: ['lunch', 'bœuf', 'patate douce', 'haricots verts', 'huile', 'healthy'],
    difficulty: 2,
    prepTime: 15,
    cookTime: 20,
    servings: 1,
    baseNutrition: { calories: 542, proteinGrams: 46, carbsGrams: 40, fatGrams: 22 },
    ingredients: [
      { name: 'Steak de bœuf', qty: 200, unit: 'g' },
      { name: 'Patate douce', qty: 200, unit: 'g' },
      { name: 'Haricots verts', qty: 100, unit: 'g' },
      { name: 'Huile d\'olive', qty: 12, unit: 'ml' },
      { name: 'Herbes de Provence', qty: 3, unit: 'g' }
    ],
    steps: [
      'Cuire la patate douce en dés au four à 200°C pendant 25 min.',
      'Griller le steak à feu vif 3-4 min de chaque côté.',
      'Accompagner de haricots verts vapeur.'
    ]
  },

  {
    id: 'L105',
    name: 'Salade César au Poulet Rôti',
    emoji: '🍗',
    origin: '🇺🇸',
    mealTypes: ['lunch'],
    tags: ['lunch', 'poulet', 'laitue', 'parmesan', 'croûtons', 'sauce césar', 'healthy'],
    difficulty: 2,
    prepTime: 10,
    cookTime: 0,
    servings: 1,
    baseNutrition: { calories: 446, proteinGrams: 44, carbsGrams: 18, fatGrams: 22 },
    ingredients: [
      { name: 'Blanc de poulet', qty: 200, unit: 'g' },
      { name: 'Laitue romaine', qty: 150, unit: 'g' },
      { name: 'Parmesan', qty: 30, unit: 'g' },
      { name: 'Croûtons', qty: 30, unit: 'g' },
      { name: 'Sauce César', qty: 30, unit: 'g' },
      { name: 'Citron', qty: 10, unit: 'ml' }
    ],
    steps: [
      'Griller le poulet et le trancher.',
      'Préparer la laitue, les croûtons et le parmesan.',
      'Mélanger avec la sauce César et le jus de citron.'
    ]
  },

  {
    id: 'L106',
    name: 'Bowl Lentilles Épinards',
    emoji: '🍽️',
    origin: '🇮🇳',
    mealTypes: ['lunch'],
    tags: ['lunch', 'lentilles', 'épinards', 'tomate', 'oignon', 'cumin', 'curcuma', 'healthy'],
    difficulty: 2,
    prepTime: 15,
    cookTime: 20,
    servings: 1,
    baseNutrition: { calories: 428, proteinGrams: 24, carbsGrams: 56, fatGrams: 12 },
    ingredients: [
      { name: 'Lentilles vertes', qty: 120, unit: 'g' },
      { name: 'Épinards', qty: 100, unit: 'g' },
      { name: 'Tomate', qty: 100, unit: 'g' },
      { name: 'Oignon', qty: 60, unit: 'g' },
      { name: 'Cumin', qty: 2, unit: 'g' },
      { name: 'Curcuma', qty: 2, unit: 'g' },
      { name: 'Huile', qty: 10, unit: 'ml' }
    ],
    steps: [
      'Cuire les lentilles dans l\'eau bouillante 20 min.',
      'Faire revenir oignon, tomate et épices.',
      'Ajouter les épinards et les lentilles, mijoter 5 min.'
    ]
  },

  {
    id: 'L107',
    name: 'Harira Poulet',
    emoji: '🍗',
    origin: '🇲🇦',
    mealTypes: ['lunch'],
    tags: ['lunch', 'poulet', 'pois chiches', 'tomate', 'coriandre', 'cumin', 'healthy'],
    difficulty: 2,
    prepTime: 15,
    cookTime: 20,
    servings: 1,
    baseNutrition: { calories: 412, proteinGrams: 36, carbsGrams: 40, fatGrams: 12 },
    ingredients: [
      { name: 'Blanc de poulet', qty: 150, unit: 'g' },
      { name: 'Pois chiches', qty: 80, unit: 'g' },
      { name: 'Tomates', qty: 150, unit: 'g' },
      { name: 'Céleri', qty: 50, unit: 'g' },
      { name: 'Coriandre', qty: 10, unit: 'g' },
      { name: 'Cumin', qty: 2, unit: 'g' },
      { name: 'Citron', qty: 1, unit: 'g' },
      { name: 'Huile', qty: 8, unit: 'ml' }
    ],
    steps: [
      'Faire revenir le poulet avec les épices.',
      'Ajouter tomates, pois chiches, céleri et 600ml d\'eau.',
      'Mijoter 25 min, finir avec coriandre fraîche et citron.'
    ]
  },

  {
    id: 'L108',
    name: 'Wrap Dinde Avocat',
    emoji: '🌯',
    origin: '🇺🇸',
    mealTypes: ['lunch'],
    tags: ['lunch', 'tortilla', 'dinde', 'avocat', 'laitue', 'tomate', 'healthy'],
    difficulty: 1,
    prepTime: 10,
    cookTime: 0,
    servings: 1,
    baseNutrition: { calories: 500, proteinGrams: 38, carbsGrams: 42, fatGrams: 20 },
    ingredients: [
      { name: 'Tortilla blé', qty: 70, unit: 'g' },
      { name: 'Escalope de dinde', qty: 160, unit: 'g' },
      { name: 'Avocat', qty: 80, unit: 'g' },
      { name: 'Laitue', qty: 30, unit: 'g' },
      { name: 'Tomate', qty: 60, unit: 'g' },
      { name: 'Moutarde', qty: 10, unit: 'g' }
    ],
    steps: [
      'Cuire la dinde à la poêle.',
      'Préparer les légumes.',
      'Assembler le wrap avec tous les ingrédients, rouler serré.'
    ]
  },

  {
    id: 'L109',
    name: 'Risotto Poulet Champignons',
    emoji: '🍗',
    origin: '🇮🇹',
    mealTypes: ['lunch'],
    tags: ['lunch', 'riz', 'poulet', 'champignons', 'parmesan', 'oignon', 'healthy'],
    difficulty: 3,
    prepTime: 20,
    cookTime: 25,
    servings: 1,
    baseNutrition: { calories: 618, proteinGrams: 42, carbsGrams: 72, fatGrams: 18 },
    ingredients: [
      { name: 'Riz arborio', qty: 150, unit: 'g' },
      { name: 'Blanc de poulet', qty: 150, unit: 'g' },
      { name: 'Champignons', qty: 100, unit: 'g' },
      { name: 'Oignon', qty: 60, unit: 'g' },
      { name: 'Parmesan', qty: 30, unit: 'g' },
      { name: 'Bouillon', qty: 600, unit: 'ml' },
      { name: 'Huile d\'olive', qty: 10, unit: 'ml' }
    ],
    steps: [
      'Faire revenir l\'oignon et le poulet.',
      'Ajouter le riz, nacrer 2 min.',
      'Incorporer le bouillon louche par louche en remuant 20 min. Finir avec parmesan.'
    ]
  },

  {
    id: 'L110',
    name: 'Pad Thaï aux Crevettes',
    emoji: '🦐',
    origin: '🇹🇭',
    mealTypes: ['lunch'],
    tags: ['lunch', 'nouilles', 'crevettes', 'œuf', 'cacahuètes', 'soja', 'tamarin', 'healthy'],
    difficulty: 2,
    prepTime: 15,
    cookTime: 20,
    servings: 1,
    baseNutrition: { calories: 470, proteinGrams: 32, carbsGrams: 54, fatGrams: 14 },
    ingredients: [
      { name: 'Nouilles de riz', qty: 120, unit: 'g' },
      { name: 'Crevettes', qty: 150, unit: 'g' },
      { name: 'Œufs', qty: 120, unit: 'g' },
      { name: 'Cacahuètes', qty: 20, unit: 'g' },
      { name: 'Germes de soja', qty: 60, unit: 'g' },
      { name: 'Sauce tamarin', qty: 20, unit: 'ml' },
      { name: 'Huile', qty: 8, unit: 'ml' }
    ],
    steps: [
      'Tremper les nouilles de riz dans l\'eau froide 30 min.',
      'Poêler les crevettes, ajouter les œufs brouillés.',
      'Ajouter les nouilles, la sauce, les germes de soja. Garnir de cacahuètes.'
    ]
  },

  {
    id: 'L111',
    name: 'Shawarma Poulet Semoule',
    emoji: '🍗',
    origin: '🌍',
    mealTypes: ['lunch'],
    tags: ['lunch', 'poulet', 'semoule', 'yaourt', 'tomate', 'concombre', 'ail', 'healthy'],
    difficulty: 2,
    prepTime: 15,
    cookTime: 20,
    servings: 1,
    baseNutrition: { calories: 562, proteinGrams: 48, carbsGrams: 52, fatGrams: 18 },
    ingredients: [
      { name: 'Blanc de poulet', qty: 200, unit: 'g' },
      { name: 'Semoule', qty: 120, unit: 'g' },
      { name: 'Yaourt', qty: 60, unit: 'g' },
      { name: 'Épices shawarma', qty: 5, unit: 'g' },
      { name: 'Tomate', qty: 60, unit: 'g' },
      { name: 'Concombre', qty: 40, unit: 'g' },
      { name: 'Ail', qty: 5, unit: 'g' }
    ],
    steps: [
      'Mariner le poulet dans les épices, yaourt et ail au moins 30 min.',
      'Cuire le poulet à la poêle ou au four 20 min.',
      'Servir avec la semoule cuite et les légumes.'
    ]
  },

  {
    id: 'L112',
    name: 'Bibimbap au Bœuf',
    emoji: '🥩',
    origin: '🇰🇷',
    mealTypes: ['lunch'],
    tags: ['lunch', 'bœuf', 'riz', 'épinards', 'carotte', 'courgette', 'œuf', 'sésame', 'healthy'],
    difficulty: 3,
    prepTime: 20,
    cookTime: 25,
    servings: 1,
    baseNutrition: { calories: 546, proteinGrams: 38, carbsGrams: 58, fatGrams: 18 },
    ingredients: [
      { name: 'Bœuf haché', qty: 150, unit: 'g' },
      { name: 'Riz japonais', qty: 120, unit: 'g' },
      { name: 'Épinards', qty: 80, unit: 'g' },
      { name: 'Carotte', qty: 60, unit: 'g' },
      { name: 'Courgette', qty: 60, unit: 'g' },
      { name: 'Œuf', qty: 60, unit: 'g' },
      { name: 'Sauce gochujang', qty: 15, unit: 'g' },
      { name: 'Huile de sésame', qty: 8, unit: 'ml' }
    ],
    steps: [
      'Cuire le riz.',
      'Poêler le bœuf haché avec la sauce.',
      'Assembler le bol avec riz, légumes sautés séparément, bœuf et œuf au plat. Finir avec huile de sésame.'
    ]
  },

  {
    id: 'L113',
    name: 'Ceviche Cabillaud',
    emoji: '🐟',
    origin: '🇵🇪',
    mealTypes: ['lunch'],
    tags: ['lunch', 'cabillaud', 'citron', 'avocat', 'oignon', 'coriandre', 'maïs', 'healthy'],
    difficulty: 2,
    prepTime: 15,
    cookTime: 20,
    servings: 1,
    baseNutrition: { calories: 388, proteinGrams: 36, carbsGrams: 16, fatGrams: 20 },
    ingredients: [
      { name: 'Cabillaud frais', qty: 200, unit: 'g' },
      { name: 'Citron vert', qty: 60, unit: 'ml' },
      { name: 'Avocat', qty: 80, unit: 'g' },
      { name: 'Oignon rouge', qty: 40, unit: 'g' },
      { name: 'Coriandre', qty: 10, unit: 'g' },
      { name: 'Piment', qty: 3, unit: 'g' },
      { name: 'Maïs', qty: 40, unit: 'g' }
    ],
    steps: [
      'Couper le cabillaud en petits dés.',
      'Mariner dans le jus de citron vert 15 min jusqu\'à opacification.',
      'Mélanger avec avocat, oignon, coriandre et piment.'
    ]
  },

  {
    id: 'L114',
    name: 'Tikka Masala Poulet',
    emoji: '🍗',
    origin: '🇮🇳',
    mealTypes: ['lunch'],
    tags: ['lunch', 'poulet', 'yaourt', 'tomate', 'crème', 'riz', 'tikka masala', 'healthy'],
    difficulty: 3,
    prepTime: 20,
    cookTime: 25,
    servings: 1,
    baseNutrition: { calories: 516, proteinGrams: 46, carbsGrams: 38, fatGrams: 20 },
    ingredients: [
      { name: 'Blanc de poulet', qty: 200, unit: 'g' },
      { name: 'Yaourt', qty: 80, unit: 'g' },
      { name: 'Tomates', qty: 150, unit: 'g' },
      { name: 'Crème', qty: 40, unit: 'ml' },
      { name: 'Oignon', qty: 60, unit: 'g' },
      { name: 'Tikka masala', qty: 10, unit: 'g' },
      { name: 'Riz basmati', qty: 80, unit: 'g' }
    ],
    steps: [
      'Mariner le poulet dans yaourt et épices.',
      'Cuire l\'oignon, ajouter tomates et épices, incorporer la crème.',
      'Ajouter le poulet grillé, mijoter 10 min. Servir avec riz basmati.'
    ]
  },

  {
    id: 'L115',
    name: 'Couscous Royal',
    emoji: '🫙',
    origin: '🇲🇦',
    mealTypes: ['lunch'],
    tags: ['lunch', 'semoule', 'agneau', 'merguez', 'courgette', 'carotte', 'pois chiches', 'healthy'],
    difficulty: 3,
    prepTime: 20,
    cookTime: 25,
    servings: 1,
    baseNutrition: { calories: 626, proteinGrams: 48, carbsGrams: 68, fatGrams: 18 },
    ingredients: [
      { name: 'Semoule', qty: 150, unit: 'g' },
      { name: 'Agneau', qty: 150, unit: 'g' },
      { name: 'Merguez de poulet', qty: 80, unit: 'g' },
      { name: 'Courgette', qty: 80, unit: 'g' },
      { name: 'Carotte', qty: 80, unit: 'g' },
      { name: 'Pois chiches', qty: 60, unit: 'g' },
      { name: 'Bouillon', qty: 300, unit: 'ml' },
      { name: 'Ras el hanout', qty: 5, unit: 'g' }
    ],
    steps: [
      'Cuire la semoule selon les instructions.',
      'Braiser l\'agneau avec les épices et légumes.',
      'Assembler avec les merguez grillées et un peu de harissa.'
    ]
  },

  {
    id: 'L116',
    name: 'Ramen Maison au Poulet',
    emoji: '🍗',
    origin: '🇯🇵',
    mealTypes: ['lunch'],
    tags: ['lunch', 'nouilles', 'poulet', 'bouillon', 'œuf', 'nori', 'soja', 'healthy'],
    difficulty: 3,
    prepTime: 20,
    cookTime: 25,
    servings: 1,
    baseNutrition: { calories: 504, proteinGrams: 42, carbsGrams: 48, fatGrams: 16 },
    ingredients: [
      { name: 'Nouilles ramen', qty: 120, unit: 'g' },
      { name: 'Blanc de poulet', qty: 180, unit: 'g' },
      { name: 'Bouillon de poulet', qty: 600, unit: 'ml' },
      { name: 'Œuf', qty: 60, unit: 'g' },
      { name: 'Nori', qty: 5, unit: 'g' },
      { name: 'Oignons verts', qty: 20, unit: 'g' },
      { name: 'Sauce soja', qty: 20, unit: 'ml' },
      { name: 'Huile de sésame', qty: 8, unit: 'ml' }
    ],
    steps: [
      'Cuire le poulet dans le bouillon avec sauce soja.',
      'Cuire les nouilles séparément.',
      'Assembler: nouilles, poulet effiloché, œuf mollet, nori et oignons verts.'
    ]
  },

  {
    id: 'L117',
    name: 'Osso Bucco Veau',
    emoji: '🥩',
    origin: '🇮🇹',
    mealTypes: ['lunch'],
    tags: ['lunch', 'veau', 'tomate', 'oignon', 'carotte', 'céleri', 'healthy'],
    difficulty: 3,
    prepTime: 20,
    cookTime: 25,
    servings: 1,
    baseNutrition: { calories: 570, proteinGrams: 52, carbsGrams: 32, fatGrams: 26 },
    ingredients: [
      { name: 'Jarret de veau', qty: 250, unit: 'g' },
      { name: 'Tomates', qty: 150, unit: 'g' },
      { name: 'Oignon', qty: 60, unit: 'g' },
      { name: 'Carotte', qty: 60, unit: 'g' },
      { name: 'Céleri', qty: 40, unit: 'g' },
      { name: 'Bouillon', qty: 200, unit: 'ml' },
      { name: 'Gremolata', qty: 10, unit: 'g' },
      { name: 'Huile d\'olive', qty: 12, unit: 'ml' }
    ],
    steps: [
      'Fariner et dorer les jarrets de veau dans l\'huile.',
      'Ajouter les légumes, tomates et bouillon.',
      'Braiser 1h30 à feu doux. Finir avec la gremolata.'
    ]
  },

  {
    id: 'L118',
    name: 'Bowl Poulet Patate Douce Avocat',
    emoji: '🍗',
    origin: '🇺🇸',
    mealTypes: ['lunch'],
    tags: ['lunch', 'poulet', 'patate douce', 'avocat', 'épinards', 'pois chiches', 'tahini', 'healthy'],
    difficulty: 2,
    prepTime: 15,
    cookTime: 20,
    servings: 1,
    baseNutrition: { calories: 526, proteinGrams: 38, carbsGrams: 44, fatGrams: 22 },
    ingredients: [
      { name: 'Poulet grillé', qty: 170, unit: 'g' },
      { name: 'Patate douce rôtie', qty: 150, unit: 'g' },
      { name: 'Avocat', qty: 60, unit: 'g' },
      { name: 'Épinards', qty: 60, unit: 'g' },
      { name: 'Pois chiches', qty: 60, unit: 'g' },
      { name: 'Tahini', qty: 15, unit: 'g' }
    ],
    steps: [
      'Cuire la patate douce au four à 200°C.',
      'Griller le poulet assaisonné.',
      'Assembler le bowl avec tous les ingrédients, drizzler de tahini.'
    ]
  },

  {
    id: 'L119',
    name: 'Dahl Lentilles Corail Coco',
    emoji: '🍽️',
    origin: '🇮🇳',
    mealTypes: ['lunch'],
    tags: ['lunch', 'lentilles', 'lait de coco', 'tomate', 'oignon', 'gingembre', 'curcuma', 'healthy'],
    difficulty: 2,
    prepTime: 15,
    cookTime: 20,
    servings: 1,
    baseNutrition: { calories: 488, proteinGrams: 40, carbsGrams: 46, fatGrams: 16 },
    ingredients: [
      { name: 'Lentilles corail', qty: 150, unit: 'g' },
      { name: 'Lait de coco', qty: 100, unit: 'ml' },
      { name: 'Tomates', qty: 100, unit: 'g' },
      { name: 'Oignon', qty: 60, unit: 'g' },
      { name: 'Gingembre', qty: 10, unit: 'g' },
      { name: 'Curcuma', qty: 2, unit: 'g' },
      { name: 'Cumin', qty: 2, unit: 'g' },
      { name: 'Huile', qty: 10, unit: 'ml' }
    ],
    steps: [
      'Faire revenir oignon, gingembre et épices.',
      'Ajouter lentilles, tomates et lait de coco.',
      'Cuire 25 min jusqu\'à consistance crémeuse.'
    ]
  },

  {
    id: 'L120',
    name: 'Filet Cabillaud Légumes Rôtis',
    emoji: '🐟',
    origin: '🇵🇹',
    mealTypes: ['lunch'],
    tags: ['lunch', 'cabillaud', 'poivron', 'courgette', 'tomate', 'pomme de terre', 'healthy'],
    difficulty: 2,
    prepTime: 15,
    cookTime: 20,
    servings: 1,
    baseNutrition: { calories: 516, proteinGrams: 44, carbsGrams: 40, fatGrams: 20 },
    ingredients: [
      { name: 'Filet de cabillaud', qty: 200, unit: 'g' },
      { name: 'Poivron rouge', qty: 100, unit: 'g' },
      { name: 'Courgette', qty: 100, unit: 'g' },
      { name: 'Tomate', qty: 100, unit: 'g' },
      { name: 'Pomme de terre', qty: 100, unit: 'g' },
      { name: 'Huile d\'olive', qty: 12, unit: 'ml' },
      { name: 'Herbes', qty: 3, unit: 'g' }
    ],
    steps: [
      'Couper les légumes, assaisonner avec huile et herbes, rôtir 25 min à 200°C.',
      'Assaisonner le cabillaud, déposer sur les légumes.',
      'Cuire encore 15 min.'
    ]
  },

  {
    id: 'L121',
    name: 'Bowl Bœuf Coréen Riz Sésame',
    emoji: '🥩',
    origin: '🇰🇷',
    mealTypes: ['lunch'],
    tags: ['lunch', 'bœuf', 'riz', 'soja', 'ail', 'gingembre', 'sésame', 'healthy'],
    difficulty: 3,
    prepTime: 20,
    cookTime: 25,
    servings: 1,
    baseNutrition: { calories: 512, proteinGrams: 42, carbsGrams: 50, fatGrams: 16 },
    ingredients: [
      { name: 'Bœuf', qty: 180, unit: 'g' },
      { name: 'Riz japonais', qty: 120, unit: 'g' },
      { name: 'Sauce soja', qty: 20, unit: 'ml' },
      { name: 'Ail', qty: 5, unit: 'g' },
      { name: 'Gingembre', qty: 5, unit: 'g' },
      { name: 'Poire asiatique', qty: 40, unit: 'g' },
      { name: 'Huile de sésame', qty: 8, unit: 'ml' },
      { name: 'Sésame', qty: 8, unit: 'g' }
    ],
    steps: [
      'Mariner le bœuf dans sauce soja, ail, gingembre et poire râpée.',
      'Poêler à feu vif.',
      'Servir sur le riz avec huile de sésame et sésame grillé.'
    ]
  },

  {
    id: 'L122',
    name: 'Tajine Agneau Légumes',
    emoji: '🫙',
    origin: '🇲🇦',
    mealTypes: ['lunch'],
    tags: ['lunch', 'agneau', 'courgette', 'carotte', 'pois chiches', 'semoule', 'coriandre', 'healthy'],
    difficulty: 3,
    prepTime: 15,
    cookTime: 35,
    servings: 1,
    baseNutrition: { calories: 494, proteinGrams: 36, carbsGrams: 56, fatGrams: 14 },
    ingredients: [
      { name: 'Agneau', qty: 180, unit: 'g' },
      { name: 'Courgette', qty: 100, unit: 'g' },
      { name: 'Carotte', qty: 100, unit: 'g' },
      { name: 'Pois chiches', qty: 80, unit: 'g' },
      { name: 'Semoule', qty: 80, unit: 'g' },
      { name: 'Ras el hanout', qty: 5, unit: 'g' },
      { name: 'Coriandre', qty: 10, unit: 'g' }
    ],
    steps: [
      'Dorer l\'agneau avec les épices.',
      'Ajouter les légumes et pois chiches, couvrir d\'eau.',
      'Mijoter 45 min. Servir avec la semoule et coriandre fraîche.'
    ]
  },

  {
    id: 'L123',
    name: 'Poulet Teriyaki Riz Brocoli',
    emoji: '🍗',
    origin: '🇯🇵',
    mealTypes: ['lunch'],
    tags: ['lunch', 'poulet', 'riz', 'brocoli', 'teriyaki', 'sésame', 'healthy'],
    difficulty: 2,
    prepTime: 15,
    cookTime: 20,
    servings: 1,
    baseNutrition: { calories: 506, proteinGrams: 38, carbsGrams: 48, fatGrams: 18 },
    ingredients: [
      { name: 'Blanc de poulet', qty: 180, unit: 'g' },
      { name: 'Riz', qty: 120, unit: 'g' },
      { name: 'Brocoli', qty: 150, unit: 'g' },
      { name: 'Sauce teriyaki', qty: 30, unit: 'ml' },
      { name: 'Sésame', qty: 8, unit: 'g' },
      { name: 'Oignons verts', qty: 15, unit: 'g' }
    ],
    steps: [
      'Mariner le poulet dans la sauce teriyaki.',
      'Griller le poulet.',
      'Servir avec le riz vapeur et le brocoli. Garnir de sésame.'
    ]
  },

  {
    id: 'L124',
    name: 'Salade Niçoise Thon',
    emoji: '🐟',
    origin: '🇫🇷',
    mealTypes: ['lunch'],
    tags: ['lunch', 'thon', 'haricots verts', 'pomme de terre', 'œuf', 'tomate', 'olives', 'healthy'],
    difficulty: 1,
    prepTime: 10,
    cookTime: 0,
    servings: 1,
    baseNutrition: { calories: 536, proteinGrams: 44, carbsGrams: 36, fatGrams: 24 },
    ingredients: [
      { name: 'Thon en conserve', qty: 180, unit: 'g' },
      { name: 'Haricots verts', qty: 100, unit: 'g' },
      { name: 'Pomme de terre', qty: 120, unit: 'g' },
      { name: 'Œuf dur', qty: 60, unit: 'g' },
      { name: 'Tomate', qty: 80, unit: 'g' },
      { name: 'Olives', qty: 20, unit: 'g' },
      { name: 'Huile d\'olive', qty: 12, unit: 'ml' }
    ],
    steps: [
      'Cuire les haricots verts et pommes de terre.',
      'Assembler la salade avec tous les ingrédients.',
      'Assaisonner d\'huile d\'olive et sel.'
    ]
  },

  {
    id: 'L125',
    name: 'Curry Rouge Poulet Coco',
    emoji: '🍗',
    origin: '🇹🇭',
    mealTypes: ['lunch'],
    tags: ['lunch', 'poulet', 'lait de coco', 'curry rouge', 'poivron', 'aubergine', 'riz', 'healthy'],
    difficulty: 3,
    prepTime: 20,
    cookTime: 25,
    servings: 1,
    baseNutrition: { calories: 522, proteinGrams: 46, carbsGrams: 44, fatGrams: 18 },
    ingredients: [
      { name: 'Blanc de poulet', qty: 200, unit: 'g' },
      { name: 'Lait de coco', qty: 100, unit: 'ml' },
      { name: 'Pâte de curry rouge', qty: 20, unit: 'g' },
      { name: 'Poivron', qty: 80, unit: 'g' },
      { name: 'Aubergine', qty: 80, unit: 'g' },
      { name: 'Riz jasmin', qty: 100, unit: 'g' }
    ],
    steps: [
      'Faire revenir la pâte de curry dans une poêle.',
      'Ajouter le poulet, puis le lait de coco et les légumes.',
      'Mijoter 15 min. Servir avec riz jasmin.'
    ]
  },

  {
    id: 'L126',
    name: 'Salade Quinoa Feta Légumes Grillés',
    emoji: '🥗',
    origin: '🇬🇷',
    mealTypes: ['lunch'],
    tags: ['lunch', 'quinoa', 'feta', 'courgette', 'poivron', 'roquette', 'pignons', 'healthy'],
    difficulty: 2,
    prepTime: 10,
    cookTime: 0,
    servings: 1,
    baseNutrition: { calories: 512, proteinGrams: 40, carbsGrams: 52, fatGrams: 16 },
    ingredients: [
      { name: 'Quinoa', qty: 100, unit: 'g' },
      { name: 'Feta', qty: 80, unit: 'g' },
      { name: 'Courgette grillée', qty: 100, unit: 'g' },
      { name: 'Poivron rouge', qty: 80, unit: 'g' },
      { name: 'Roquette', qty: 40, unit: 'g' },
      { name: 'Pignons', qty: 15, unit: 'g' },
      { name: 'Vinaigrette citron', qty: 15, unit: 'ml' }
    ],
    steps: [
      'Cuire le quinoa.',
      'Griller les légumes.',
      'Assembler avec la feta, roquette, pignons et vinaigrette.'
    ]
  },

  {
    id: 'L127',
    name: 'Tacos Poulet Guacamole',
    emoji: '🍗',
    origin: '🇲🇽',
    mealTypes: ['lunch'],
    tags: ['lunch', 'poulet', 'tortilla', 'avocat', 'salsa', 'chou', 'healthy'],
    difficulty: 2,
    prepTime: 15,
    cookTime: 20,
    servings: 1,
    baseNutrition: { calories: 524, proteinGrams: 42, carbsGrams: 44, fatGrams: 20 },
    ingredients: [
      { name: 'Blanc de poulet', qty: 180, unit: 'g' },
      { name: 'Tortillas', qty: 70, unit: 'g' },
      { name: 'Guacamole', qty: 60, unit: 'g' },
      { name: 'Salsa', qty: 40, unit: 'g' },
      { name: 'Chou rouge', qty: 40, unit: 'g' },
      { name: 'Citron vert', qty: 10, unit: 'ml' },
      { name: 'Épices', qty: 3, unit: 'g' }
    ],
    steps: [
      'Cuire le poulet avec les épices.',
      'Préparer le guacamole et la salsa.',
      'Assembler les tacos avec poulet, guacamole, salsa et chou.'
    ]
  },

  {
    id: 'L128',
    name: 'Bowl Falafel Houmous Taboulé',
    emoji: '🍽️',
    origin: '🇱🇧',
    mealTypes: ['lunch'],
    tags: ['lunch', 'falafel', 'houmous', 'taboulé', 'pita', 'persil', 'boulgour', 'healthy'],
    difficulty: 3,
    prepTime: 20,
    cookTime: 25,
    servings: 1,
    baseNutrition: { calories: 492, proteinGrams: 36, carbsGrams: 60, fatGrams: 12 },
    ingredients: [
      { name: 'Falafels', qty: 120, unit: 'g' },
      { name: 'Houmous', qty: 80, unit: 'g' },
      { name: 'Taboulé', qty: 100, unit: 'g' },
      { name: 'Pain pita', qty: 60, unit: 'g' },
      { name: 'Tzatziki', qty: 40, unit: 'g' },
      { name: 'Tomate', qty: 60, unit: 'g' }
    ],
    steps: [
      'Cuire les falafels au four ou à la poêle.',
      'Préparer le taboulé avec persil, boulgour et tomates.',
      'Assembler le bowl avec houmous, falafels et taboulé.'
    ]
  },

  {
    id: 'L129',
    name: 'Poisson Grillé Salsa Mangue',
    emoji: '🐟',
    origin: '🇨🇴',
    mealTypes: ['lunch'],
    tags: ['lunch', 'daurade', 'mangue', 'avocat', 'coriandre', 'riz', 'healthy'],
    difficulty: 2,
    prepTime: 15,
    cookTime: 20,
    servings: 1,
    baseNutrition: { calories: 504, proteinGrams: 44, carbsGrams: 46, fatGrams: 16 },
    ingredients: [
      { name: 'Filet de daurade', qty: 200, unit: 'g' },
      { name: 'Mangue', qty: 120, unit: 'g' },
      { name: 'Avocat', qty: 60, unit: 'g' },
      { name: 'Oignon rouge', qty: 30, unit: 'g' },
      { name: 'Coriandre', qty: 10, unit: 'g' },
      { name: 'Riz', qty: 90, unit: 'g' },
      { name: 'Citron vert', qty: 15, unit: 'ml' }
    ],
    steps: [
      'Griller le filet de daurade.',
      'Préparer la salsa avec mangue, avocat, oignon et coriandre.',
      'Servir avec le riz et la salsa.'
    ]
  },

  {
    id: 'L130',
    name: 'Chicken Tikka Naan Yogurt',
    emoji: '🍗',
    origin: '🇮🇳',
    mealTypes: ['lunch'],
    tags: ['lunch', 'poulet', 'naan', 'yaourt', 'tomate', 'tikka masala', 'healthy'],
    difficulty: 3,
    prepTime: 20,
    cookTime: 25,
    servings: 1,
    baseNutrition: { calories: 514, proteinGrams: 40, carbsGrams: 48, fatGrams: 18 },
    ingredients: [
      { name: 'Poulet', qty: 180, unit: 'g' },
      { name: 'Naan', qty: 100, unit: 'g' },
      { name: 'Yaourt', qty: 80, unit: 'g' },
      { name: 'Oignon', qty: 60, unit: 'g' },
      { name: 'Tomate', qty: 80, unit: 'g' },
      { name: 'Tikka masala', qty: 8, unit: 'g' },
      { name: 'Huile', qty: 8, unit: 'ml' }
    ],
    steps: [
      'Mariner le poulet dans yaourt et épices.',
      'Cuire le poulet grillé.',
      'Servir avec naan chaud et sauce au yaourt.'
    ]
  },

  {
    id: 'L131',
    name: 'Saumon Teriyaki Riz Edamame',
    emoji: '🐟',
    origin: '🇯🇵',
    mealTypes: ['lunch'],
    tags: ['lunch', 'saumon', 'riz', 'edamame', 'teriyaki', 'sésame', 'healthy'],
    difficulty: 2,
    prepTime: 15,
    cookTime: 20,
    servings: 1,
    baseNutrition: { calories: 514, proteinGrams: 38, carbsGrams: 50, fatGrams: 18 },
    ingredients: [
      { name: 'Filet de saumon', qty: 180, unit: 'g' },
      { name: 'Riz japonais', qty: 120, unit: 'g' },
      { name: 'Edamame', qty: 80, unit: 'g' },
      { name: 'Sauce teriyaki', qty: 25, unit: 'ml' },
      { name: 'Sésame', qty: 8, unit: 'g' },
      { name: 'Gingembre', qty: 5, unit: 'g' }
    ],
    steps: [
      'Mariner le saumon dans la sauce teriyaki.',
      'Poêler le saumon 4 min de chaque côté.',
      'Servir avec riz et edamame. Parsemer de sésame.'
    ]
  },

  {
    id: 'L132',
    name: 'Bœuf Haché Légumes Wok',
    emoji: '🥩',
    origin: '🇨🇳',
    mealTypes: ['lunch'],
    tags: ['lunch', 'bœuf', 'brocoli', 'poivron', 'carotte', 'sauce huître', 'riz', 'healthy'],
    difficulty: 2,
    prepTime: 15,
    cookTime: 20,
    servings: 1,
    baseNutrition: { calories: 516, proteinGrams: 42, carbsGrams: 42, fatGrams: 20 },
    ingredients: [
      { name: 'Bœuf haché', qty: 180, unit: 'g' },
      { name: 'Brocoli', qty: 100, unit: 'g' },
      { name: 'Poivron', qty: 80, unit: 'g' },
      { name: 'Carotte', qty: 60, unit: 'g' },
      { name: 'Sauce huître halal', qty: 20, unit: 'ml' },
      { name: 'Riz', qty: 100, unit: 'g' },
      { name: 'Ail', qty: 5, unit: 'g' }
    ],
    steps: [
      'Poêler le bœuf haché à feu vif.',
      'Ajouter les légumes et l\'ail.',
      'Incorporer la sauce, servir avec le riz.'
    ]
  },

  {
    id: 'L133',
    name: 'Souvlaki Poulet Tzatziki',
    emoji: '🍗',
    origin: '🇬🇷',
    mealTypes: ['lunch'],
    tags: ['lunch', 'poulet', 'pita', 'tzatziki', 'tomate', 'oignon', 'roquette', 'healthy'],
    difficulty: 2,
    prepTime: 15,
    cookTime: 20,
    servings: 1,
    baseNutrition: { calories: 534, proteinGrams: 46, carbsGrams: 38, fatGrams: 22 },
    ingredients: [
      { name: 'Poulet', qty: 200, unit: 'g' },
      { name: 'Pain pita', qty: 80, unit: 'g' },
      { name: 'Tzatziki', qty: 60, unit: 'g' },
      { name: 'Tomate', qty: 60, unit: 'g' },
      { name: 'Oignon rouge', qty: 40, unit: 'g' },
      { name: 'Roquette', qty: 30, unit: 'g' },
      { name: 'Épices grecques', qty: 5, unit: 'g' }
    ],
    steps: [
      'Mariner le poulet avec épices et huile d\'olive.',
      'Griller en brochettes.',
      'Servir dans le pita avec tzatziki, tomate et oignon.'
    ]
  },

  {
    id: 'L134',
    name: 'Burritos Bœuf Haricots Noirs',
    emoji: '🥩',
    origin: '🇲🇽',
    mealTypes: ['lunch'],
    tags: ['lunch', 'bœuf', 'haricots noirs', 'tortilla', 'maïs', 'salsa', 'fromage', 'healthy'],
    difficulty: 3,
    prepTime: 20,
    cookTime: 25,
    servings: 1,
    baseNutrition: { calories: 504, proteinGrams: 40, carbsGrams: 50, fatGrams: 16 },
    ingredients: [
      { name: 'Bœuf haché', qty: 150, unit: 'g' },
      { name: 'Haricots noirs', qty: 100, unit: 'g' },
      { name: 'Tortilla blé', qty: 80, unit: 'g' },
      { name: 'Maïs', qty: 60, unit: 'g' },
      { name: 'Salsa', qty: 40, unit: 'g' },
      { name: 'Fromage râpé', qty: 30, unit: 'g' },
      { name: 'Épices', qty: 5, unit: 'g' }
    ],
    steps: [
      'Cuire le bœuf haché avec épices et oignon.',
      'Chauffer les haricots noirs.',
      'Assembler le burrito, rouler, griller 2 min.'
    ]
  },

  {
    id: 'L135',
    name: 'Pho Bo Authentique',
    emoji: '🥩',
    origin: '🇻🇳',
    mealTypes: ['lunch'],
    tags: ['lunch', 'bœuf', 'nouilles', 'bouillon', 'gingembre', 'basilic', 'soja', 'healthy'],
    difficulty: 3,
    prepTime: 20,
    cookTime: 25,
    servings: 1,
    baseNutrition: { calories: 522, proteinGrams: 42, carbsGrams: 48, fatGrams: 18 },
    ingredients: [
      { name: 'Bœuf', qty: 180, unit: 'g' },
      { name: 'Nouilles de riz', qty: 120, unit: 'g' },
      { name: 'Bouillon pho', qty: 600, unit: 'ml' },
      { name: 'Oignon brûlé', qty: 40, unit: 'g' },
      { name: 'Gingembre', qty: 10, unit: 'g' },
      { name: 'Basilic', qty: 10, unit: 'g' },
      { name: 'Germes de soja', qty: 60, unit: 'g' }
    ],
    steps: [
      'Préparer le bouillon avec os de bœuf, oignon brûlé et épices 2h.',
      'Cuire les nouilles.',
      'Assembler: nouilles, bœuf, bouillon chaud, herbes et germes.'
    ]
  },

  {
    id: 'L136',
    name: 'Gratin Poulet Légumes Béchamel',
    emoji: '🍗',
    origin: '🇫🇷',
    mealTypes: ['lunch'],
    tags: ['lunch', 'poulet', 'courgette', 'poivron', 'béchamel', 'fromage', 'pâtes', 'healthy'],
    difficulty: 3,
    prepTime: 20,
    cookTime: 25,
    servings: 1,
    baseNutrition: { calories: 534, proteinGrams: 44, carbsGrams: 40, fatGrams: 22 },
    ingredients: [
      { name: 'Poulet', qty: 200, unit: 'g' },
      { name: 'Courgette', qty: 100, unit: 'g' },
      { name: 'Poivron', qty: 80, unit: 'g' },
      { name: 'Béchamel légère', qty: 100, unit: 'ml' },
      { name: 'Fromage râpé', qty: 40, unit: 'g' },
      { name: 'Pâtes', qty: 80, unit: 'g' }
    ],
    steps: [
      'Cuire les pâtes al dente.',
      'Poêler poulet et légumes.',
      'Assembler, napper de béchamel, gratiner 20 min à 180°C.'
    ]
  },

  {
    id: 'L137',
    name: 'Nasi Goreng au Poulet',
    emoji: '🍗',
    origin: '🇮🇩',
    mealTypes: ['lunch'],
    tags: ['lunch', 'riz', 'poulet', 'œuf', 'soja', 'ail', 'oignon', 'healthy'],
    difficulty: 2,
    prepTime: 15,
    cookTime: 20,
    servings: 1,
    baseNutrition: { calories: 484, proteinGrams: 38, carbsGrams: 56, fatGrams: 12 },
    ingredients: [
      { name: 'Riz cuit', qty: 200, unit: 'g' },
      { name: 'Poulet', qty: 150, unit: 'g' },
      { name: 'Œuf', qty: 60, unit: 'g' },
      { name: 'Oignon', qty: 60, unit: 'g' },
      { name: 'Sauce soja', qty: 15, unit: 'ml' },
      { name: 'Piment', qty: 3, unit: 'g' },
      { name: 'Ail', qty: 5, unit: 'g' },
      { name: 'Huile', qty: 8, unit: 'ml' }
    ],
    steps: [
      'Poêler le riz cuit avec ail et oignon.',
      'Ajouter le poulet en dés, œuf et sauce soja.',
      'Incorporer le piment. Servir avec œuf au plat.'
    ]
  },

  {
    id: 'L138',
    name: 'Wrap Falafel Légumes Houmous',
    emoji: '🌯',
    origin: '🇱🇧',
    mealTypes: ['lunch'],
    tags: ['lunch', 'falafel', 'tortilla', 'houmous', 'taboulé', 'laitue', 'tomate', 'healthy'],
    difficulty: 2,
    prepTime: 10,
    cookTime: 0,
    servings: 1,
    baseNutrition: { calories: 516, proteinGrams: 40, carbsGrams: 44, fatGrams: 20 },
    ingredients: [
      { name: 'Falafels', qty: 140, unit: 'g' },
      { name: 'Tortilla', qty: 80, unit: 'g' },
      { name: 'Houmous', qty: 60, unit: 'g' },
      { name: 'Taboulé', qty: 80, unit: 'g' },
      { name: 'Laitue', qty: 30, unit: 'g' },
      { name: 'Tomate', qty: 60, unit: 'g' },
      { name: 'Oignon rouge', qty: 30, unit: 'g' }
    ],
    steps: [
      'Cuire les falafels.',
      'Tartiner la tortilla de houmous.',
      'Garnir de falafels, taboulé, laitue et tomate. Rouler.'
    ]
  },

  {
    id: 'L139',
    name: 'Poulet Mafé Sénégalais',
    emoji: '🍗',
    origin: '🇸🇳',
    mealTypes: ['lunch'],
    tags: ['lunch', 'poulet', 'cacahuète', 'tomate', 'patate douce', 'riz', 'healthy'],
    difficulty: 3,
    prepTime: 20,
    cookTime: 25,
    servings: 1,
    baseNutrition: { calories: 506, proteinGrams: 36, carbsGrams: 50, fatGrams: 18 },
    ingredients: [
      { name: 'Poulet', qty: 180, unit: 'g' },
      { name: 'Beurre de cacahuète', qty: 30, unit: 'g' },
      { name: 'Tomates', qty: 150, unit: 'g' },
      { name: 'Oignon', qty: 60, unit: 'g' },
      { name: 'Patate douce', qty: 100, unit: 'g' },
      { name: 'Riz', qty: 80, unit: 'g' },
      { name: 'Ail', qty: 5, unit: 'g' }
    ],
    steps: [
      'Faire revenir le poulet, oignon et ail.',
      'Ajouter tomates, beurre de cacahuète dilué et patate douce.',
      'Mijoter 30 min. Servir avec riz.'
    ]
  },

  {
    id: 'L140',
    name: 'Salade Thaï au Bœuf Grillé',
    emoji: '🥩',
    origin: '🇹🇭',
    mealTypes: ['lunch'],
    tags: ['lunch', 'bœuf', 'nouilles', 'concombre', 'carotte', 'cacahuètes', 'menthe', 'healthy'],
    difficulty: 2,
    prepTime: 10,
    cookTime: 0,
    servings: 1,
    baseNutrition: { calories: 514, proteinGrams: 42, carbsGrams: 46, fatGrams: 18 },
    ingredients: [
      { name: 'Bœuf', qty: 180, unit: 'g' },
      { name: 'Nouilles de riz', qty: 100, unit: 'g' },
      { name: 'Concombre', qty: 60, unit: 'g' },
      { name: 'Carotte', qty: 60, unit: 'g' },
      { name: 'Cacahuètes', qty: 20, unit: 'g' },
      { name: 'Menthe', qty: 10, unit: 'g' },
      { name: 'Sauce fish halal', qty: 15, unit: 'ml' },
      { name: 'Citron vert', qty: 20, unit: 'ml' }
    ],
    steps: [
      'Griller le bœuf saignant, trancher fin.',
      'Cuire les nouilles.',
      'Assembler avec légumes, herbes, cacahuètes et sauce citron.'
    ]
  },

  {
    id: 'L141',
    name: 'Poulet Rôti Pommes de Terre',
    emoji: '🍗',
    origin: '🇫🇷',
    mealTypes: ['lunch'],
    tags: ['lunch', 'poulet', 'pomme de terre', 'oignon', 'ail', 'herbes de Provence', 'healthy'],
    difficulty: 3,
    prepTime: 20,
    cookTime: 25,
    servings: 1,
    baseNutrition: { calories: 526, proteinGrams: 44, carbsGrams: 38, fatGrams: 22 },
    ingredients: [
      { name: 'Cuisses de poulet', qty: 220, unit: 'g' },
      { name: 'Pommes de terre', qty: 200, unit: 'g' },
      { name: 'Oignon', qty: 60, unit: 'g' },
      { name: 'Ail', qty: 10, unit: 'g' },
      { name: 'Herbes de Provence', qty: 3, unit: 'g' },
      { name: 'Huile d\'olive', qty: 10, unit: 'ml' }
    ],
    steps: [
      'Assaisonner le poulet avec herbes, ail et huile.',
      'Disposer avec pommes de terre en rondelles.',
      'Cuire au four 40 min à 200°C.'
    ]
  },

  {
    id: 'L142',
    name: 'Lomo Saltado Bœuf',
    emoji: '🥩',
    origin: '🇵🇪',
    mealTypes: ['lunch'],
    tags: ['lunch', 'bœuf', 'pomme de terre', 'tomate', 'oignon', 'soja', 'coriandre', 'healthy'],
    difficulty: 3,
    prepTime: 20,
    cookTime: 25,
    servings: 1,
    baseNutrition: { calories: 508, proteinGrams: 40, carbsGrams: 42, fatGrams: 20 },
    ingredients: [
      { name: 'Bœuf', qty: 180, unit: 'g' },
      { name: 'Pommes de terre', qty: 150, unit: 'g' },
      { name: 'Tomate', qty: 80, unit: 'g' },
      { name: 'Oignon rouge', qty: 60, unit: 'g' },
      { name: 'Sauce soja', qty: 15, unit: 'ml' },
      { name: 'Coriandre', qty: 10, unit: 'g' },
      { name: 'Riz', qty: 80, unit: 'g' }
    ],
    steps: [
      'Faire sauter le bœuf à feu très vif.',
      'Ajouter oignon, tomate et sauce soja.',
      'Incorporer les frites maison et coriandre. Servir avec riz.'
    ]
  },

  {
    id: 'L143',
    name: 'Poulet Korma Riz Basmati',
    emoji: '🍗',
    origin: '🇮🇳',
    mealTypes: ['lunch'],
    tags: ['lunch', 'poulet', 'yaourt', 'amandes', 'crème', 'riz', 'korma', 'healthy'],
    difficulty: 3,
    prepTime: 20,
    cookTime: 25,
    servings: 1,
    baseNutrition: { calories: 486, proteinGrams: 38, carbsGrams: 52, fatGrams: 14 },
    ingredients: [
      { name: 'Poulet', qty: 180, unit: 'g' },
      { name: 'Yaourt', qty: 80, unit: 'g' },
      { name: 'Oignon', qty: 60, unit: 'g' },
      { name: 'Amandes', qty: 20, unit: 'g' },
      { name: 'Crème légère', qty: 40, unit: 'ml' },
      { name: 'Épices korma', qty: 8, unit: 'g' },
      { name: 'Riz basmati', qty: 100, unit: 'g' }
    ],
    steps: [
      'Mariner le poulet dans yaourt et épices.',
      'Préparer la sauce korma avec oignon, amandes et crème.',
      'Mijoter 20 min. Servir avec riz basmati.'
    ]
  },

  {
    id: 'L144',
    name: 'Keftah Bœuf Tomate Herbes',
    emoji: '🥩',
    origin: '🇲🇦',
    mealTypes: ['lunch'],
    tags: ['lunch', 'bœuf', 'tomate', 'oignon', 'persil', 'semoule', 'harissa', 'healthy'],
    difficulty: 2,
    prepTime: 15,
    cookTime: 20,
    servings: 1,
    baseNutrition: { calories: 524, proteinGrams: 42, carbsGrams: 44, fatGrams: 20 },
    ingredients: [
      { name: 'Bœuf haché', qty: 200, unit: 'g' },
      { name: 'Tomates', qty: 150, unit: 'g' },
      { name: 'Oignon', qty: 60, unit: 'g' },
      { name: 'Persil', qty: 10, unit: 'g' },
      { name: 'Cumin', qty: 2, unit: 'g' },
      { name: 'Paprika', qty: 2, unit: 'g' },
      { name: 'Semoule', qty: 100, unit: 'g' },
      { name: 'Harissa', qty: 10, unit: 'g' }
    ],
    steps: [
      'Préparer les keftah avec bœuf, oignon et épices.',
      'Griller les keftah ou cuire à la poêle.',
      'Servir avec semoule et sauce tomate épicée.'
    ]
  },

  {
    id: 'L145',
    name: 'Wok Crevettes Légumes Riz',
    emoji: '🦐',
    origin: '🇨🇳',
    mealTypes: ['lunch'],
    tags: ['lunch', 'crevettes', 'brocoli', 'carotte', 'champignons', 'riz', 'soja', 'healthy'],
    difficulty: 2,
    prepTime: 15,
    cookTime: 20,
    servings: 1,
    baseNutrition: { calories: 524, proteinGrams: 46, carbsGrams: 40, fatGrams: 20 },
    ingredients: [
      { name: 'Crevettes', qty: 200, unit: 'g' },
      { name: 'Brocoli', qty: 100, unit: 'g' },
      { name: 'Carotte', qty: 60, unit: 'g' },
      { name: 'Champignons', qty: 60, unit: 'g' },
      { name: 'Riz', qty: 100, unit: 'g' },
      { name: 'Sauce soja', qty: 15, unit: 'ml' },
      { name: 'Ail', qty: 5, unit: 'g' },
      { name: 'Gingembre', qty: 5, unit: 'g' },
      { name: 'Huile', qty: 10, unit: 'ml' }
    ],
    steps: [
      'Poêler les crevettes à feu vif.',
      'Ajouter les légumes, ail et gingembre.',
      'Incorporer la sauce soja. Servir avec riz vapeur.'
    ]
  },

  {
    id: 'L146',
    name: 'Hamburger Dinde Maison',
    emoji: '🍔',
    origin: '🇺🇸',
    mealTypes: ['lunch'],
    tags: ['lunch', 'dinde', 'pain', 'tomate', 'laitue', 'oignon', 'fromage', 'healthy'],
    difficulty: 3,
    prepTime: 20,
    cookTime: 25,
    servings: 1,
    baseNutrition: { calories: 534, proteinGrams: 44, carbsGrams: 40, fatGrams: 22 },
    ingredients: [
      { name: 'Dinde hachée', qty: 180, unit: 'g' },
      { name: 'Pain burger complet', qty: 80, unit: 'g' },
      { name: 'Tomate', qty: 60, unit: 'g' },
      { name: 'Laitue', qty: 30, unit: 'g' },
      { name: 'Oignon', qty: 30, unit: 'g' },
      { name: 'Fromage', qty: 30, unit: 'g' },
      { name: 'Moutarde', qty: 10, unit: 'g' }
    ],
    steps: [
      'Façonner le steak de dinde, assaisonner.',
      'Griller 5 min de chaque côté.',
      'Assembler le burger avec tous les ingrédients.'
    ]
  },

  {
    id: 'L147',
    name: 'Poêlée Saumon Épinards Quinoa',
    emoji: '🐟',
    origin: '🇸🇪',
    mealTypes: ['lunch'],
    tags: ['lunch', 'saumon', 'épinards', 'quinoa', 'ail', 'citron', 'câpres', 'healthy'],
    difficulty: 2,
    prepTime: 15,
    cookTime: 20,
    servings: 1,
    baseNutrition: { calories: 506, proteinGrams: 40, carbsGrams: 46, fatGrams: 18 },
    ingredients: [
      { name: 'Saumon', qty: 180, unit: 'g' },
      { name: 'Épinards', qty: 100, unit: 'g' },
      { name: 'Quinoa', qty: 100, unit: 'g' },
      { name: 'Ail', qty: 5, unit: 'g' },
      { name: 'Huile d\'olive', qty: 10, unit: 'ml' },
      { name: 'Citron', qty: 15, unit: 'ml' },
      { name: 'Câpres', qty: 15, unit: 'g' }
    ],
    steps: [
      'Cuire le quinoa.',
      'Poêler le saumon côté peau.',
      'Faire sauter les épinards avec ail, citron et câpres. Servir ensemble.'
    ]
  },

  {
    id: 'L148',
    name: 'Poulet Piri Piri Riz Coriandre',
    emoji: '🍗',
    origin: '🇵🇹',
    mealTypes: ['lunch'],
    tags: ['lunch', 'poulet', 'riz', 'piri piri', 'ail', 'citron', 'coriandre', 'healthy'],
    difficulty: 2,
    prepTime: 15,
    cookTime: 20,
    servings: 1,
    baseNutrition: { calories: 506, proteinGrams: 38, carbsGrams: 48, fatGrams: 18 },
    ingredients: [
      { name: 'Poulet', qty: 180, unit: 'g' },
      { name: 'Riz', qty: 110, unit: 'g' },
      { name: 'Piri piri', qty: 15, unit: 'g' },
      { name: 'Ail', qty: 5, unit: 'g' },
      { name: 'Citron', qty: 15, unit: 'ml' },
      { name: 'Coriandre', qty: 10, unit: 'g' },
      { name: 'Huile d\'olive', qty: 8, unit: 'ml' }
    ],
    steps: [
      'Mariner le poulet dans la sauce piri piri, ail et citron.',
      'Griller au four ou sur la braise.',
      'Servir avec riz vapeur et coriandre fraîche.'
    ]
  },

  {
    id: 'L149',
    name: 'Enchiladas Poulet Sauce Tomate',
    emoji: '🍗',
    origin: '🇲🇽',
    mealTypes: ['lunch'],
    tags: ['lunch', 'poulet', 'tortilla', 'sauce tomate', 'fromage', 'haricots noirs', 'healthy'],
    difficulty: 3,
    prepTime: 20,
    cookTime: 25,
    servings: 1,
    baseNutrition: { calories: 524, proteinGrams: 42, carbsGrams: 44, fatGrams: 20 },
    ingredients: [
      { name: 'Poulet', qty: 180, unit: 'g' },
      { name: 'Tortillas', qty: 80, unit: 'g' },
      { name: 'Sauce enchilada', qty: 100, unit: 'g' },
      { name: 'Fromage râpé', qty: 40, unit: 'g' },
      { name: 'Haricots noirs', qty: 60, unit: 'g' },
      { name: 'Crème', qty: 20, unit: 'ml' }
    ],
    steps: [
      'Cuire le poulet effiloché avec sauce.',
      'Rouler dans les tortillas.',
      'Napper de sauce et fromage, cuire 20 min à 180°C.'
    ]
  },

  {
    id: 'L150',
    name: 'Bol Buddha Légumes Tofu',
    emoji: '🍚',
    origin: '🇯🇵',
    mealTypes: ['lunch'],
    tags: ['lunch', 'tofu', 'riz brun', 'edamame', 'carotte', 'avocat', 'sésame', 'tahini', 'healthy'],
    difficulty: 2,
    prepTime: 15,
    cookTime: 20,
    servings: 1,
    baseNutrition: { calories: 496, proteinGrams: 40, carbsGrams: 48, fatGrams: 16 },
    ingredients: [
      { name: 'Tofu ferme', qty: 200, unit: 'g' },
      { name: 'Riz brun', qty: 120, unit: 'g' },
      { name: 'Edamame', qty: 80, unit: 'g' },
      { name: 'Carotte', qty: 60, unit: 'g' },
      { name: 'Avocat', qty: 60, unit: 'g' },
      { name: 'Graines de sésame', qty: 10, unit: 'g' },
      { name: 'Sauce tahini', qty: 20, unit: 'g' }
    ],
    steps: [
      'Cuire le riz brun.',
      'Poêler le tofu jusqu\'à dorure.',
      'Assembler le bol avec tous les ingrédients et sauce tahini.'
    ]
  },

  {
    id: 'L201',
    name: 'Yaourt Grec Amandes Miel',
    emoji: '🥛',
    origin: '🇬🇷',
    mealTypes: ['snack'],
    tags: ['snack', 'yaourt', 'amandes', 'miel', 'healthy'],
    difficulty: 1,
    prepTime: 3,
    cookTime: 0,
    servings: 1,
    baseNutrition: { calories: 258, proteinGrams: 22, carbsGrams: 20, fatGrams: 10 },
    ingredients: [
      { name: 'Yaourt grec 0%', qty: 200, unit: 'g' },
      { name: 'Amandes', qty: 20, unit: 'g' },
      { name: 'Miel', qty: 15, unit: 'g' }
    ],
    steps: [
      'Verser le yaourt dans un bol.',
      'Parsemer d\'amandes.',
      'Drizzler de miel.'
    ]
  },

  {
    id: 'L202',
    name: 'Pomme Beurre d\'Amande',
    emoji: '🍎',
    origin: '🇺🇸',
    mealTypes: ['snack'],
    tags: ['snack', 'pomme', 'amande', 'healthy'],
    difficulty: 1,
    prepTime: 3,
    cookTime: 0,
    servings: 1,
    baseNutrition: { calories: 252, proteinGrams: 6, carbsGrams: 30, fatGrams: 12 },
    ingredients: [
      { name: 'Pomme', qty: 180, unit: 'g' },
      { name: 'Beurre d\'amande', qty: 30, unit: 'g' }
    ],
    steps: [
      'Trancher la pomme en quartiers.',
      'Servir avec le beurre d\'amande pour tremper.'
    ]
  },

  {
    id: 'L203',
    name: 'Œufs Durs Crudités',
    emoji: '🥚',
    origin: '🌍',
    mealTypes: ['snack'],
    tags: ['snack', 'œuf', 'carotte', 'concombre', 'tomate', 'healthy'],
    difficulty: 1,
    prepTime: 3,
    cookTime: 0,
    servings: 1,
    baseNutrition: { calories: 222, proteinGrams: 16, carbsGrams: 8, fatGrams: 14 },
    ingredients: [
      { name: 'Œufs durs', qty: 120, unit: 'g' },
      { name: 'Carotte', qty: 80, unit: 'g' },
      { name: 'Concombre', qty: 80, unit: 'g' },
      { name: 'Tomate cerise', qty: 60, unit: 'g' },
      { name: 'Sel', qty: 1, unit: 'g' },
      { name: 'Poivre', qty: 1, unit: 'g' }
    ],
    steps: [
      'Cuire les œufs 10 min dans l\'eau bouillante.',
      'Laisser refroidir, écaler.',
      'Servir avec les crudités.'
    ]
  },

  {
    id: 'L204',
    name: 'Dattes Fourrées Amandes',
    emoji: '🥜',
    origin: '🌍',
    mealTypes: ['snack'],
    tags: ['snack', 'dattes', 'amandes', 'healthy'],
    difficulty: 1,
    prepTime: 5,
    cookTime: 10,
    servings: 1,
    baseNutrition: { calories: 244, proteinGrams: 5, carbsGrams: 38, fatGrams: 8 },
    ingredients: [
      { name: 'Dattes Medjool', qty: 80, unit: 'g' },
      { name: 'Amandes entières', qty: 20, unit: 'g' }
    ],
    steps: [
      'Dénoyauter les dattes.',
      'Fourrer chaque datte d\'une amande entière.',
      'Servir à température ambiante.'
    ]
  },

  {
    id: 'L205',
    name: 'Edamame Citron Sel',
    emoji: '🥜',
    origin: '🇯🇵',
    mealTypes: ['snack'],
    tags: ['snack', 'edamame', 'citron', 'healthy'],
    difficulty: 1,
    prepTime: 3,
    cookTime: 0,
    servings: 1,
    baseNutrition: { calories: 184, proteinGrams: 16, carbsGrams: 12, fatGrams: 8 },
    ingredients: [
      { name: 'Edamame', qty: 200, unit: 'g' },
      { name: 'Citron', qty: 15, unit: 'ml' },
      { name: 'Fleur de sel', qty: 2, unit: 'g' }
    ],
    steps: [
      'Cuire les edamame dans l\'eau bouillante salée 5 min.',
      'Égoutter et arroser de jus de citron.',
      'Parsemer de fleur de sel.'
    ]
  },

  {
    id: 'L206',
    name: 'Houmous Crudités',
    emoji: '🫙',
    origin: '🇱🇧',
    mealTypes: ['snack'],
    tags: ['snack', 'houmous', 'carotte', 'céleri', 'concombre', 'poivron', 'healthy'],
    difficulty: 1,
    prepTime: 3,
    cookTime: 0,
    servings: 1,
    baseNutrition: { calories: 288, proteinGrams: 10, carbsGrams: 26, fatGrams: 16 },
    ingredients: [
      { name: 'Houmous', qty: 100, unit: 'g' },
      { name: 'Carotte', qty: 80, unit: 'g' },
      { name: 'Céleri', qty: 60, unit: 'g' },
      { name: 'Concombre', qty: 60, unit: 'g' },
      { name: 'Poivron rouge', qty: 60, unit: 'g' }
    ],
    steps: [
      'Couper les légumes en bâtonnets.',
      'Disposer autour du houmous.',
      'Déguster comme snack.'
    ]
  },

  {
    id: 'L207',
    name: 'Energy Balls Dattes Avoine',
    emoji: '🥜',
    origin: '🇺🇸',
    mealTypes: ['snack'],
    tags: ['snack', 'avoine', 'dattes', 'amande', 'chia', 'cacao', 'healthy'],
    difficulty: 1,
    prepTime: 3,
    cookTime: 0,
    servings: 1,
    baseNutrition: { calories: 366, proteinGrams: 12, carbsGrams: 48, fatGrams: 14 },
    ingredients: [
      { name: 'Flocons d\'avoine', qty: 80, unit: 'g' },
      { name: 'Dattes dénoyautées', qty: 80, unit: 'g' },
      { name: 'Beurre d\'amande', qty: 25, unit: 'g' },
      { name: 'Graines de chia', qty: 10, unit: 'g' },
      { name: 'Cacao', qty: 10, unit: 'g' }
    ],
    steps: [
      'Mixer les dattes en pâte.',
      'Mélanger avec avoine, beurre d\'amande, chia et cacao.',
      'Former des boules et réfrigérer 30 min.'
    ]
  },

  {
    id: 'L208',
    name: 'Tartine Ricotta Figues',
    emoji: '🥜',
    origin: '🇮🇹',
    mealTypes: ['snack'],
    tags: ['snack', 'pain', 'ricotta', 'figues', 'miel', 'noix', 'healthy'],
    difficulty: 1,
    prepTime: 3,
    cookTime: 0,
    servings: 1,
    baseNutrition: { calories: 298, proteinGrams: 14, carbsGrams: 38, fatGrams: 10 },
    ingredients: [
      { name: 'Pain complet', qty: 60, unit: 'g' },
      { name: 'Ricotta', qty: 80, unit: 'g' },
      { name: 'Figues fraîches', qty: 80, unit: 'g' },
      { name: 'Miel', qty: 10, unit: 'g' },
      { name: 'Noix', qty: 10, unit: 'g' }
    ],
    steps: [
      'Griller le pain complet.',
      'Tartiner de ricotta.',
      'Garnir de figues tranchées, noix et miel.'
    ]
  },

  {
    id: 'L209',
    name: 'Onigiri Thon Sésame',
    emoji: '🌾',
    origin: '🇯🇵',
    mealTypes: ['snack'],
    tags: ['snack', 'riz', 'thon', 'sésame', 'nori', 'soja', 'healthy'],
    difficulty: 2,
    prepTime: 3,
    cookTime: 0,
    servings: 1,
    baseNutrition: { calories: 302, proteinGrams: 20, carbsGrams: 42, fatGrams: 6 },
    ingredients: [
      { name: 'Riz japonais', qty: 120, unit: 'g' },
      { name: 'Thon en conserve', qty: 80, unit: 'g' },
      { name: 'Sésame', qty: 8, unit: 'g' },
      { name: 'Nori', qty: 10, unit: 'g' },
      { name: 'Sauce soja', qty: 8, unit: 'ml' }
    ],
    steps: [
      'Cuire le riz japonais.',
      'Mélanger le thon avec un peu de sauce soja.',
      'Former des triangles de riz farcis de thon, envelopper de nori.'
    ]
  },

  {
    id: 'L210',
    name: 'Shake Whey Banane Cacahuète',
    emoji: '🍌',
    origin: '🥤',
    mealTypes: ['snack'],
    tags: ['snack', 'whey', 'banane', 'cacahuète', 'lait', 'healthy'],
    difficulty: 1,
    prepTime: 5,
    cookTime: 0,
    servings: 1,
    baseNutrition: { calories: 388, proteinGrams: 36, carbsGrams: 34, fatGrams: 12 },
    ingredients: [
      { name: 'Whey protéine vanille', qty: 40, unit: 'g' },
      { name: 'Banane', qty: 100, unit: 'g' },
      { name: 'Beurre de cacahuète', qty: 20, unit: 'g' },
      { name: 'Lait écrémé', qty: 250, unit: 'ml' }
    ],
    steps: [
      'Mettre tous les ingrédients dans le blender.',
      'Mixer jusqu\'à consistance lisse.',
      'Servir immédiatement.'
    ]
  },

  {
    id: 'L211',
    name: 'Shake Whey Choco Banane',
    emoji: '🍌',
    origin: '🥤',
    mealTypes: ['snack'],
    tags: ['snack', 'whey', 'banane', 'cacao', 'lait', 'healthy'],
    difficulty: 1,
    prepTime: 5,
    cookTime: 0,
    servings: 1,
    baseNutrition: { calories: 352, proteinGrams: 32, carbsGrams: 38, fatGrams: 8 },
    ingredients: [
      { name: 'Whey protéine chocolat', qty: 35, unit: 'g' },
      { name: 'Banane', qty: 100, unit: 'g' },
      { name: 'Cacao', qty: 10, unit: 'g' },
      { name: 'Lait écrémé', qty: 300, unit: 'ml' }
    ],
    steps: [
      'Mixer tous les ingrédients.',
      'Ajouter des glaçons si désiré.',
      'Servir frais.'
    ]
  },

  {
    id: 'L212',
    name: 'Shake Whey Avoine Miel',
    emoji: '🍌',
    origin: '🥤',
    mealTypes: ['snack'],
    tags: ['snack', 'whey', 'avoine', 'miel', 'lait', 'banane', 'healthy'],
    difficulty: 1,
    prepTime: 5,
    cookTime: 0,
    servings: 1,
    baseNutrition: { calories: 434, proteinGrams: 34, carbsGrams: 52, fatGrams: 10 },
    ingredients: [
      { name: 'Whey protéine', qty: 35, unit: 'g' },
      { name: 'Flocons d\'avoine', qty: 60, unit: 'g' },
      { name: 'Miel', qty: 20, unit: 'g' },
      { name: 'Lait écrémé', qty: 300, unit: 'ml' },
      { name: 'Banane', qty: 50, unit: 'g' }
    ],
    steps: [
      'Mixer tous les ingrédients dans le blender.',
      'Ajouter des glaçons.',
      'Servir immédiatement.'
    ]
  },

  {
    id: 'L213',
    name: 'Smoothie Whey Mangue Coco',
    emoji: '🥤',
    origin: '🥤',
    mealTypes: ['snack'],
    tags: ['snack', 'whey', 'mangue', 'lait de coco', 'healthy'],
    difficulty: 1,
    prepTime: 5,
    cookTime: 0,
    servings: 1,
    baseNutrition: { calories: 378, proteinGrams: 30, carbsGrams: 42, fatGrams: 10 },
    ingredients: [
      { name: 'Whey protéine vanille', qty: 30, unit: 'g' },
      { name: 'Mangue', qty: 150, unit: 'g' },
      { name: 'Lait de coco', qty: 150, unit: 'ml' },
      { name: 'Glaçons', qty: 100, unit: 'g' }
    ],
    steps: [
      'Mixer la mangue avec le lait de coco.',
      'Ajouter la whey protéine et les glaçons.',
      'Mixer jusqu\'à consistance lisse.'
    ]
  },

  {
    id: 'L214',
    name: 'Mug Cake Whey 2min',
    emoji: '🥚',
    origin: '🥤',
    mealTypes: ['snack'],
    tags: ['snack', 'whey', 'avoine', 'œuf', 'lait', 'healthy'],
    difficulty: 1,
    prepTime: 10,
    cookTime: 15,
    servings: 1,
    baseNutrition: { calories: 280, proteinGrams: 28, carbsGrams: 24, fatGrams: 8 },
    ingredients: [
      { name: 'Whey protéine chocolat', qty: 30, unit: 'g' },
      { name: 'Farine d\'avoine', qty: 30, unit: 'g' },
      { name: 'Œuf', qty: 60, unit: 'g' },
      { name: 'Lait écrémé', qty: 30, unit: 'ml' },
      { name: 'Levure', qty: 2, unit: 'g' }
    ],
    steps: [
      'Mélanger tous les ingrédients dans un mug.',
      'Cuire 2 min au micro-ondes.',
      'Laisser reposer 1 min avant de déguster.'
    ]
  },

  {
    id: 'L215',
    name: 'Fromage Blanc Fruits Rouges Graines',
    emoji: '🍎',
    origin: '🇫🇷',
    mealTypes: ['snack'],
    tags: ['snack', 'fromage blanc', 'framboises', 'myrtilles', 'graines', 'miel', 'healthy'],
    difficulty: 1,
    prepTime: 3,
    cookTime: 0,
    servings: 1,
    baseNutrition: { calories: 234, proteinGrams: 12, carbsGrams: 24, fatGrams: 10 },
    ingredients: [
      { name: 'Fromage blanc 0%', qty: 150, unit: 'g' },
      { name: 'Framboises', qty: 60, unit: 'g' },
      { name: 'Myrtilles', qty: 40, unit: 'g' },
      { name: 'Graines de tournesol', qty: 15, unit: 'g' },
      { name: 'Miel', qty: 5, unit: 'g' }
    ],
    steps: [
      'Verser le fromage blanc dans un bol.',
      'Ajouter les fruits rouges.',
      'Parsemer de graines et miel.'
    ]
  },

  {
    id: 'L216',
    name: 'Banana Bread Protéiné',
    emoji: '🍌',
    origin: '🇺🇸',
    mealTypes: ['snack'],
    tags: ['snack', 'banane', 'avoine', 'œuf', 'noix', 'miel', 'healthy'],
    difficulty: 2,
    prepTime: 3,
    cookTime: 0,
    servings: 1,
    baseNutrition: { calories: 270, proteinGrams: 8, carbsGrams: 28, fatGrams: 14 },
    ingredients: [
      { name: 'Banane', qty: 100, unit: 'g' },
      { name: 'Farine avoine', qty: 60, unit: 'g' },
      { name: 'Œuf', qty: 60, unit: 'g' },
      { name: 'Noix', qty: 25, unit: 'g' },
      { name: 'Miel', qty: 10, unit: 'g' },
      { name: 'Levure', qty: 3, unit: 'g' }
    ],
    steps: [
      'Écraser la banane, mélanger avec œuf, farine et miel.',
      'Ajouter les noix et la levure.',
      'Cuire 35 min à 180°C. Couper en tranches.'
    ]
  },

  {
    id: 'L217',
    name: 'Yaourt Grec Granola Fruits Secs',
    emoji: '🍎',
    origin: '🇬🇷',
    mealTypes: ['snack'],
    tags: ['snack', 'yaourt', 'granola', 'abricots', 'noix', 'healthy'],
    difficulty: 1,
    prepTime: 3,
    cookTime: 0,
    servings: 1,
    baseNutrition: { calories: 236, proteinGrams: 14, carbsGrams: 18, fatGrams: 12 },
    ingredients: [
      { name: 'Yaourt grec', qty: 150, unit: 'g' },
      { name: 'Granola', qty: 30, unit: 'g' },
      { name: 'Abricots secs', qty: 20, unit: 'g' },
      { name: 'Noix', qty: 15, unit: 'g' }
    ],
    steps: [
      'Verser le yaourt dans un bol.',
      'Garnir de granola, abricots et noix.'
    ]
  },

  {
    id: 'L218',
    name: 'Energy Balls Cacao Noisette',
    emoji: '🥜',
    origin: '🇮🇹',
    mealTypes: ['snack'],
    tags: ['snack', 'avoine', 'dattes', 'cacao', 'noisettes', 'miel', 'healthy'],
    difficulty: 1,
    prepTime: 3,
    cookTime: 0,
    servings: 1,
    baseNutrition: { calories: 250, proteinGrams: 6, carbsGrams: 34, fatGrams: 10 },
    ingredients: [
      { name: 'Flocons d\'avoine', qty: 60, unit: 'g' },
      { name: 'Dattes', qty: 60, unit: 'g' },
      { name: 'Cacao', qty: 10, unit: 'g' },
      { name: 'Noisettes', qty: 20, unit: 'g' },
      { name: 'Miel', qty: 10, unit: 'g' }
    ],
    steps: [
      'Mixer les dattes avec les noisettes.',
      'Incorporer avoine, cacao et miel.',
      'Former des boules et réfrigérer.'
    ]
  },

  {
    id: 'L219',
    name: 'Noix Mélangées Fruits Secs',
    emoji: '🍎',
    origin: '🌍',
    mealTypes: ['snack'],
    tags: ['snack', 'amandes', 'cajou', 'pistaches', 'cranberries', 'abricots', 'healthy'],
    difficulty: 1,
    prepTime: 3,
    cookTime: 0,
    servings: 1,
    baseNutrition: { calories: 254, proteinGrams: 10, carbsGrams: 22, fatGrams: 14 },
    ingredients: [
      { name: 'Amandes', qty: 25, unit: 'g' },
      { name: 'Noix de cajou', qty: 20, unit: 'g' },
      { name: 'Pistaches', qty: 15, unit: 'g' },
      { name: 'Cranberries', qty: 20, unit: 'g' },
      { name: 'Abricots secs', qty: 20, unit: 'g' }
    ],
    steps: [
      'Mélanger toutes les noix et fruits secs.',
      'Portions pré-dosées dans un sachet.',
      'Consommer comme en-cas.'
    ]
  },

  {
    id: 'L220',
    name: 'Galette de Riz Beurre Cacahuète Banane',
    emoji: '🍌',
    origin: '🇺🇸',
    mealTypes: ['snack'],
    tags: ['snack', 'riz soufflé', 'cacahuète', 'banane', 'healthy'],
    difficulty: 1,
    prepTime: 3,
    cookTime: 0,
    servings: 1,
    baseNutrition: { calories: 250, proteinGrams: 8, carbsGrams: 32, fatGrams: 10 },
    ingredients: [
      { name: 'Galettes de riz', qty: 27, unit: 'g' },
      { name: 'Beurre de cacahuète', qty: 25, unit: 'g' },
      { name: 'Banane', qty: 80, unit: 'g' }
    ],
    steps: [
      'Tartiner les galettes de riz de beurre de cacahuète.',
      'Garnir de rondelles de banane.'
    ]
  },

  {
    id: 'L221',
    name: 'Skyr Myrtilles Cannelle',
    emoji: '🫐',
    origin: '🇮🇸',
    mealTypes: ['snack'],
    tags: ['snack', 'skyr', 'myrtilles', 'cannelle', 'noix', 'miel', 'healthy'],
    difficulty: 1,
    prepTime: 3,
    cookTime: 0,
    servings: 1,
    baseNutrition: { calories: 244, proteinGrams: 18, carbsGrams: 16, fatGrams: 12 },
    ingredients: [
      { name: 'Skyr', qty: 200, unit: 'g' },
      { name: 'Myrtilles', qty: 80, unit: 'g' },
      { name: 'Cannelle', qty: 1, unit: 'g' },
      { name: 'Noix', qty: 15, unit: 'g' },
      { name: 'Miel', qty: 5, unit: 'g' }
    ],
    steps: [
      'Verser le skyr dans un bol.',
      'Garnir de myrtilles, noix et cannelle.',
      'Drizzler de miel.'
    ]
  },

  {
    id: 'L222',
    name: 'Tartines Pain Complet Ricotta Tomate',
    emoji: '🥜',
    origin: '🇮🇹',
    mealTypes: ['snack'],
    tags: ['snack', 'pain', 'ricotta', 'tomate', 'basilic', 'huile', 'healthy'],
    difficulty: 1,
    prepTime: 3,
    cookTime: 0,
    servings: 1,
    baseNutrition: { calories: 242, proteinGrams: 12, carbsGrams: 26, fatGrams: 10 },
    ingredients: [
      { name: 'Pain complet', qty: 50, unit: 'g' },
      { name: 'Ricotta', qty: 60, unit: 'g' },
      { name: 'Tomate', qty: 80, unit: 'g' },
      { name: 'Basilic', qty: 5, unit: 'g' },
      { name: 'Huile d\'olive', qty: 8, unit: 'ml' }
    ],
    steps: [
      'Griller le pain.',
      'Tartiner de ricotta.',
      'Garnir de tomate, basilic et huile d\'olive.'
    ]
  },

  {
    id: 'L223',
    name: 'Boisson Protéinée Kéfir Fruits',
    emoji: '🍎',
    origin: '🇹🇷',
    mealTypes: ['snack'],
    tags: ['snack', 'kéfir', 'banane', 'fraises', 'miel', 'healthy'],
    difficulty: 1,
    prepTime: 3,
    cookTime: 0,
    servings: 1,
    baseNutrition: { calories: 234, proteinGrams: 16, carbsGrams: 20, fatGrams: 10 },
    ingredients: [
      { name: 'Kéfir', qty: 200, unit: 'ml' },
      { name: 'Banane', qty: 60, unit: 'g' },
      { name: 'Fraises', qty: 80, unit: 'g' },
      { name: 'Miel', qty: 5, unit: 'g' }
    ],
    steps: [
      'Mixer le kéfir avec banane et fraises.',
      'Ajouter le miel.',
      'Servir frais.'
    ]
  },

  {
    id: 'L224',
    name: 'Compote Maison Pomme Poire Cannelle',
    emoji: '🍎',
    origin: '🇫🇷',
    mealTypes: ['snack'],
    tags: ['snack', 'pomme', 'poire', 'yaourt', 'cannelle', 'graines', 'healthy'],
    difficulty: 1,
    prepTime: 3,
    cookTime: 0,
    servings: 1,
    baseNutrition: { calories: 256, proteinGrams: 10, carbsGrams: 36, fatGrams: 8 },
    ingredients: [
      { name: 'Pomme', qty: 150, unit: 'g' },
      { name: 'Poire', qty: 100, unit: 'g' },
      { name: 'Yaourt grec', qty: 100, unit: 'g' },
      { name: 'Cannelle', qty: 2, unit: 'g' },
      { name: 'Graines de courge', qty: 15, unit: 'g' }
    ],
    steps: [
      'Cuire pomme et poire avec cannelle jusqu\'à consistance de compote.',
      'Laisser refroidir.',
      'Servir avec yaourt grec et graines.'
    ]
  },

  {
    id: 'L225',
    name: 'Crackers Sarrasin Thon Avocat',
    emoji: '🥜',
    origin: '🌍',
    mealTypes: ['snack'],
    tags: ['snack', 'sarrasin', 'thon', 'avocat', 'citron', 'healthy'],
    difficulty: 1,
    prepTime: 3,
    cookTime: 0,
    servings: 1,
    baseNutrition: { calories: 260, proteinGrams: 20, carbsGrams: 18, fatGrams: 12 },
    ingredients: [
      { name: 'Crackers sarrasin', qty: 30, unit: 'g' },
      { name: 'Thon', qty: 80, unit: 'g' },
      { name: 'Avocat', qty: 40, unit: 'g' },
      { name: 'Citron', qty: 5, unit: 'ml' },
      { name: 'Sel', qty: 1, unit: 'g' },
      { name: 'Poivre', qty: 1, unit: 'g' }
    ],
    steps: [
      'Écraser légèrement l\'avocat avec citron.',
      'Mettre le thon sur les crackers.',
      'Garnir d\'avocat et assaisonner.'
    ]
  },

  {
    id: 'L226',
    name: 'Barre Avoine Miel Noix Maison',
    emoji: '🥜',
    origin: '🇺🇸',
    mealTypes: ['snack'],
    tags: ['snack', 'avoine', 'miel', 'cacahuète', 'noix', 'graines', 'healthy'],
    difficulty: 2,
    prepTime: 10,
    cookTime: 15,
    servings: 1,
    baseNutrition: { calories: 252, proteinGrams: 6, carbsGrams: 30, fatGrams: 12 },
    ingredients: [
      { name: 'Flocons d\'avoine', qty: 80, unit: 'g' },
      { name: 'Miel', qty: 25, unit: 'g' },
      { name: 'Beurre de cacahuète', qty: 20, unit: 'g' },
      { name: 'Noix', qty: 20, unit: 'g' },
      { name: 'Graines de tournesol', qty: 15, unit: 'g' }
    ],
    steps: [
      'Mélanger tous les ingrédients.',
      'Étaler dans un moule, presser fermement.',
      'Réfrigérer 2h, couper en barres.'
    ]
  },

  {
    id: 'L227',
    name: 'Tzatziki Concombre Crudités',
    emoji: '🥛',
    origin: '🇬🇷',
    mealTypes: ['snack'],
    tags: ['snack', 'yaourt', 'concombre', 'ail', 'aneth', 'pita', 'healthy'],
    difficulty: 1,
    prepTime: 3,
    cookTime: 0,
    servings: 1,
    baseNutrition: { calories: 234, proteinGrams: 14, carbsGrams: 22, fatGrams: 10 },
    ingredients: [
      { name: 'Yaourt grec', qty: 150, unit: 'g' },
      { name: 'Concombre', qty: 100, unit: 'g' },
      { name: 'Ail', qty: 3, unit: 'g' },
      { name: 'Aneth', qty: 5, unit: 'g' },
      { name: 'Huile d\'olive', qty: 8, unit: 'ml' },
      { name: 'Pain pita', qty: 40, unit: 'g' }
    ],
    steps: [
      'Râper le concombre, presser pour extraire l\'eau.',
      'Mélanger avec yaourt, ail et aneth.',
      'Servir avec pain pita et crudités.'
    ]
  },

  {
    id: 'L228',
    name: 'Compote Banane Cacao Beurre Amande',
    emoji: '🍌',
    origin: '🇺🇸',
    mealTypes: ['snack'],
    tags: ['snack', 'banane', 'cacao', 'amande', 'lait', 'healthy'],
    difficulty: 1,
    prepTime: 3,
    cookTime: 0,
    servings: 1,
    baseNutrition: { calories: 232, proteinGrams: 12, carbsGrams: 28, fatGrams: 8 },
    ingredients: [
      { name: 'Banane', qty: 150, unit: 'g' },
      { name: 'Cacao', qty: 10, unit: 'g' },
      { name: 'Beurre d\'amande', qty: 15, unit: 'g' },
      { name: 'Lait écrémé', qty: 50, unit: 'ml' }
    ],
    steps: [
      'Mixer la banane avec le cacao et le lait.',
      'Ajouter le beurre d\'amande.',
      'Servir en bol ou en verre.'
    ]
  },

  {
    id: 'L229',
    name: 'Muffin Avoine Myrtilles Maison',
    emoji: '🫐',
    origin: '🇺🇸',
    mealTypes: ['snack'],
    tags: ['snack', 'avoine', 'myrtilles', 'œuf', 'yaourt', 'miel', 'healthy'],
    difficulty: 2,
    prepTime: 10,
    cookTime: 15,
    servings: 1,
    baseNutrition: { calories: 250, proteinGrams: 8, carbsGrams: 32, fatGrams: 10 },
    ingredients: [
      { name: 'Farine d\'avoine', qty: 60, unit: 'g' },
      { name: 'Myrtilles', qty: 60, unit: 'g' },
      { name: 'Œuf', qty: 60, unit: 'g' },
      { name: 'Yaourt', qty: 60, unit: 'g' },
      { name: 'Miel', qty: 15, unit: 'g' },
      { name: 'Levure', qty: 3, unit: 'g' },
      { name: 'Huile', qty: 8, unit: 'ml' }
    ],
    steps: [
      'Mélanger farine, œuf, yaourt et miel.',
      'Incorporer les myrtilles.',
      'Cuire en moule à muffin 20 min à 180°C.'
    ]
  },

  {
    id: 'L230',
    name: 'Pudding Chia Coco Mangue',
    emoji: '🥛',
    origin: '🇹🇭',
    mealTypes: ['snack'],
    tags: ['snack', 'chia', 'lait de coco', 'mangue', 'yaourt', 'miel', 'healthy'],
    difficulty: 1,
    prepTime: 3,
    cookTime: 0,
    servings: 1,
    baseNutrition: { calories: 244, proteinGrams: 16, carbsGrams: 18, fatGrams: 12 },
    ingredients: [
      { name: 'Graines de chia', qty: 30, unit: 'g' },
      { name: 'Lait de coco', qty: 150, unit: 'ml' },
      { name: 'Mangue', qty: 80, unit: 'g' },
      { name: 'Yaourt', qty: 60, unit: 'g' },
      { name: 'Miel', qty: 5, unit: 'g' }
    ],
    steps: [
      'Mélanger chia avec lait de coco et miel.',
      'Réfrigérer 4h.',
      'Servir avec mangue et yaourt.'
    ]
  },

  {
    id: 'L231',
    name: 'Verrines Fromage Blanc Saumon Aneth',
    emoji: '🥛',
    origin: '🇸🇪',
    mealTypes: ['snack'],
    tags: ['snack', 'fromage blanc', 'saumon', 'aneth', 'concombre', 'pain', 'healthy'],
    difficulty: 1,
    prepTime: 3,
    cookTime: 0,
    servings: 1,
    baseNutrition: { calories: 288, proteinGrams: 22, carbsGrams: 14, fatGrams: 16 },
    ingredients: [
      { name: 'Fromage blanc', qty: 150, unit: 'g' },
      { name: 'Saumon fumé', qty: 80, unit: 'g' },
      { name: 'Aneth', qty: 5, unit: 'g' },
      { name: 'Concombre', qty: 60, unit: 'g' },
      { name: 'Pain grillé', qty: 30, unit: 'g' }
    ],
    steps: [
      'Couper le saumon et concombre en petits dés.',
      'Mélanger avec le fromage blanc et l\'aneth.',
      'Servir dans des verrines avec le pain.'
    ]
  },

  {
    id: 'L232',
    name: 'Smoothie Mangue Ananas Gingembre',
    emoji: '🥛',
    origin: '🇧🇷',
    mealTypes: ['snack'],
    tags: ['snack', 'mangue', 'ananas', 'yaourt', 'gingembre', 'lait de coco', 'healthy'],
    difficulty: 1,
    prepTime: 5,
    cookTime: 0,
    servings: 1,
    baseNutrition: { calories: 240, proteinGrams: 8, carbsGrams: 34, fatGrams: 8 },
    ingredients: [
      { name: 'Mangue', qty: 120, unit: 'g' },
      { name: 'Ananas', qty: 100, unit: 'g' },
      { name: 'Yaourt', qty: 100, unit: 'g' },
      { name: 'Gingembre', qty: 5, unit: 'g' },
      { name: 'Lait de coco', qty: 80, unit: 'ml' }
    ],
    steps: [
      'Mixer tous les ingrédients.',
      'Ajouter des glaçons.',
      'Servir frais.'
    ]
  },

  {
    id: 'L233',
    name: 'Galettes Riz Avocat Tomate',
    emoji: '🌾',
    origin: '🇺🇸',
    mealTypes: ['snack'],
    tags: ['snack', 'riz soufflé', 'avocat', 'tomate', 'citron', 'healthy'],
    difficulty: 1,
    prepTime: 3,
    cookTime: 0,
    servings: 1,
    baseNutrition: { calories: 252, proteinGrams: 10, carbsGrams: 26, fatGrams: 12 },
    ingredients: [
      { name: 'Galettes de riz', qty: 27, unit: 'g' },
      { name: 'Avocat', qty: 60, unit: 'g' },
      { name: 'Tomate cerise', qty: 60, unit: 'g' },
      { name: 'Citron', qty: 5, unit: 'ml' },
      { name: 'Sel', qty: 1, unit: 'g' },
      { name: 'Poivre', qty: 1, unit: 'g' }
    ],
    steps: [
      'Tartiner les galettes d\'avocat écrasé.',
      'Garnir de tomates cerises coupées.',
      'Assaisonner de citron, sel et poivre.'
    ]
  },

  {
    id: 'L234',
    name: 'Labneh Tomates Cerises Zaatar',
    emoji: '🥜',
    origin: '🇱🇧',
    mealTypes: ['snack'],
    tags: ['snack', 'labneh', 'tomate', 'zaatar', 'huile', 'pita', 'healthy'],
    difficulty: 1,
    prepTime: 3,
    cookTime: 0,
    servings: 1,
    baseNutrition: { calories: 244, proteinGrams: 18, carbsGrams: 16, fatGrams: 12 },
    ingredients: [
      { name: 'Labneh', qty: 120, unit: 'g' },
      { name: 'Tomates cerises', qty: 80, unit: 'g' },
      { name: 'Zaatar', qty: 5, unit: 'g' },
      { name: 'Huile d\'olive', qty: 8, unit: 'ml' },
      { name: 'Pain pita', qty: 30, unit: 'g' }
    ],
    steps: [
      'Étaler le labneh dans une assiette.',
      'Garnir de tomates cerises, zaatar et huile d\'olive.',
      'Servir avec le pain pita.'
    ]
  },

  {
    id: 'L235',
    name: 'Shake Whey Fraise Yaourt',
    emoji: '🍓',
    origin: '🥤',
    mealTypes: ['snack'],
    tags: ['snack', 'whey', 'fraises', 'yaourt', 'lait', 'healthy'],
    difficulty: 1,
    prepTime: 5,
    cookTime: 0,
    servings: 1,
    baseNutrition: { calories: 338, proteinGrams: 32, carbsGrams: 30, fatGrams: 10 },
    ingredients: [
      { name: 'Whey protéine fraise', qty: 35, unit: 'g' },
      { name: 'Fraises', qty: 100, unit: 'g' },
      { name: 'Yaourt grec', qty: 100, unit: 'g' },
      { name: 'Lait écrémé', qty: 150, unit: 'ml' }
    ],
    steps: [
      'Mixer tous les ingrédients.',
      'Ajouter des glaçons.',
      'Servir immédiatement.'
    ]
  },

  {
    id: 'L236',
    name: 'Protein Pancakes Whey Myrtilles',
    emoji: '🫐',
    origin: '🥤',
    mealTypes: ['snack'],
    tags: ['snack', 'whey', 'avoine', 'œuf', 'lait', 'myrtilles', 'healthy'],
    difficulty: 2,
    prepTime: 10,
    cookTime: 15,
    servings: 1,
    baseNutrition: { calories: 356, proteinGrams: 34, carbsGrams: 28, fatGrams: 12 },
    ingredients: [
      { name: 'Whey protéine', qty: 35, unit: 'g' },
      { name: 'Farine d\'avoine', qty: 50, unit: 'g' },
      { name: 'Œuf', qty: 60, unit: 'g' },
      { name: 'Lait écrémé', qty: 80, unit: 'ml' },
      { name: 'Myrtilles', qty: 60, unit: 'g' }
    ],
    steps: [
      'Mélanger whey, farine, œuf et lait.',
      'Cuire des pancakes dans une poêle antiadhésive.',
      'Garnir de myrtilles fraîches.'
    ]
  },

  {
    id: 'L237',
    name: 'Bowl Protéiné Whey Ananas Coco',
    emoji: '💪',
    origin: '🥤',
    mealTypes: ['snack'],
    tags: ['snack', 'whey', 'lait de coco', 'ananas', 'coco', 'healthy'],
    difficulty: 1,
    prepTime: 3,
    cookTime: 0,
    servings: 1,
    baseNutrition: { calories: 338, proteinGrams: 30, carbsGrams: 32, fatGrams: 10 },
    ingredients: [
      { name: 'Whey protéine vanille', qty: 30, unit: 'g' },
      { name: 'Lait de coco', qty: 150, unit: 'ml' },
      { name: 'Ananas', qty: 100, unit: 'g' },
      { name: 'Noix de coco râpée', qty: 10, unit: 'g' },
      { name: 'Glaçons', qty: 100, unit: 'g' }
    ],
    steps: [
      'Mixer whey avec lait de coco et ananas.',
      'Ajouter glaçons.',
      'Garnir de noix de coco.'
    ]
  },

  {
    id: 'L238',
    name: 'Shake Whey Café Protéiné',
    emoji: '🥤',
    origin: '🥤',
    mealTypes: ['snack'],
    tags: ['snack', 'whey', 'café', 'lait', 'healthy'],
    difficulty: 1,
    prepTime: 5,
    cookTime: 0,
    servings: 1,
    baseNutrition: { calories: 322, proteinGrams: 36, carbsGrams: 22, fatGrams: 10 },
    ingredients: [
      { name: 'Whey protéine café', qty: 35, unit: 'g' },
      { name: 'Café expresso froid', qty: 60, unit: 'ml' },
      { name: 'Lait écrémé', qty: 250, unit: 'ml' },
      { name: 'Glaçons', qty: 100, unit: 'g' }
    ],
    steps: [
      'Préparer un café et laisser refroidir.',
      'Mixer avec whey et lait.',
      'Servir avec des glaçons.'
    ]
  },

  {
    id: 'L239',
    name: 'Mug Cake Whey Vanille Myrtilles',
    emoji: '🫐',
    origin: '🥤',
    mealTypes: ['snack'],
    tags: ['snack', 'whey', 'avoine', 'œuf', 'myrtilles', 'lait', 'healthy'],
    difficulty: 1,
    prepTime: 10,
    cookTime: 15,
    servings: 1,
    baseNutrition: { calories: 328, proteinGrams: 28, carbsGrams: 36, fatGrams: 8 },
    ingredients: [
      { name: 'Whey protéine vanille', qty: 30, unit: 'g' },
      { name: 'Farine d\'avoine', qty: 40, unit: 'g' },
      { name: 'Œuf', qty: 60, unit: 'g' },
      { name: 'Myrtilles', qty: 40, unit: 'g' },
      { name: 'Lait', qty: 40, unit: 'ml' },
      { name: 'Levure', qty: 2, unit: 'g' }
    ],
    steps: [
      'Mélanger tous les ingrédients dans un mug.',
      'Incorporer les myrtilles.',
      'Cuire 2 min au micro-ondes.'
    ]
  },

  {
    id: 'L240',
    name: 'Shake Whey Beurre Cacahuète Chocolat',
    emoji: '🥜',
    origin: '🥤',
    mealTypes: ['snack'],
    tags: ['snack', 'whey', 'cacahuète', 'lait', 'cacao', 'healthy'],
    difficulty: 1,
    prepTime: 5,
    cookTime: 0,
    servings: 1,
    baseNutrition: { calories: 348, proteinGrams: 34, carbsGrams: 26, fatGrams: 12 },
    ingredients: [
      { name: 'Whey protéine chocolat', qty: 35, unit: 'g' },
      { name: 'Beurre de cacahuète', qty: 20, unit: 'g' },
      { name: 'Lait écrémé', qty: 300, unit: 'ml' },
      { name: 'Cacao', qty: 5, unit: 'g' }
    ],
    steps: [
      'Ajouter tous les ingrédients dans le blender.',
      'Mixer 30 secondes.',
      'Servir avec des glaçons.'
    ]
  },

  {
    id: 'L241',
    name: 'Whey Smoothie Bowl Framboise',
    emoji: '🍌',
    origin: '🥤',
    mealTypes: ['snack'],
    tags: ['snack', 'whey', 'framboises', 'banane', 'lait', 'granola', 'healthy'],
    difficulty: 1,
    prepTime: 5,
    cookTime: 0,
    servings: 1,
    baseNutrition: { calories: 322, proteinGrams: 30, carbsGrams: 28, fatGrams: 10 },
    ingredients: [
      { name: 'Whey protéine vanille', qty: 30, unit: 'g' },
      { name: 'Framboises', qty: 120, unit: 'g' },
      { name: 'Banane', qty: 80, unit: 'g' },
      { name: 'Lait écrémé', qty: 100, unit: 'ml' },
      { name: 'Granola', qty: 30, unit: 'g' }
    ],
    steps: [
      'Mixer whey, framboises, banane et lait.',
      'Verser dans un bol.',
      'Garnir de granola.'
    ]
  },

  {
    id: 'L242',
    name: 'Protein Ball Whey Cacao Noix',
    emoji: '🥜',
    origin: '🥤',
    mealTypes: ['snack'],
    tags: ['snack', 'whey', 'avoine', 'miel', 'cacao', 'noix', 'healthy'],
    difficulty: 2,
    prepTime: 3,
    cookTime: 0,
    servings: 1,
    baseNutrition: { calories: 314, proteinGrams: 32, carbsGrams: 24, fatGrams: 10 },
    ingredients: [
      { name: 'Whey protéine chocolat', qty: 40, unit: 'g' },
      { name: 'Flocons d\'avoine', qty: 40, unit: 'g' },
      { name: 'Miel', qty: 15, unit: 'g' },
      { name: 'Cacao', qty: 10, unit: 'g' },
      { name: 'Noix', qty: 15, unit: 'g' }
    ],
    steps: [
      'Mélanger tous les ingrédients.',
      'Former des boules compactes.',
      'Réfrigérer 1h.'
    ]
  },

  {
    id: 'L243',
    name: 'Shake Whey Matcha Lait Amande',
    emoji: '🥤',
    origin: '🥤',
    mealTypes: ['snack'],
    tags: ['snack', 'whey', 'matcha', 'lait d\'amande', 'miel', 'healthy'],
    difficulty: 1,
    prepTime: 5,
    cookTime: 0,
    servings: 1,
    baseNutrition: { calories: 330, proteinGrams: 30, carbsGrams: 30, fatGrams: 10 },
    ingredients: [
      { name: 'Whey protéine vanille', qty: 30, unit: 'g' },
      { name: 'Matcha', qty: 5, unit: 'g' },
      { name: 'Lait d\'amande', qty: 300, unit: 'ml' },
      { name: 'Miel', qty: 10, unit: 'g' },
      { name: 'Glaçons', qty: 100, unit: 'g' }
    ],
    steps: [
      'Mixer tous les ingrédients.',
      'Verser dans un verre.',
      'Servir glacé.'
    ]
  },

  {
    id: 'L244',
    name: 'Protein Cookie Whey Chocolat',
    emoji: '🍫',
    origin: '🥤',
    mealTypes: ['snack'],
    tags: ['snack', 'whey', 'avoine', 'œuf', 'cajou', 'chocolat', 'healthy'],
    difficulty: 2,
    prepTime: 3,
    cookTime: 0,
    servings: 1,
    baseNutrition: { calories: 332, proteinGrams: 34, carbsGrams: 22, fatGrams: 12 },
    ingredients: [
      { name: 'Whey protéine chocolat', qty: 40, unit: 'g' },
      { name: 'Farine d\'avoine', qty: 40, unit: 'g' },
      { name: 'Œuf', qty: 60, unit: 'g' },
      { name: 'Beurre de cajou', qty: 15, unit: 'g' },
      { name: 'Pépites chocolat', qty: 15, unit: 'g' }
    ],
    steps: [
      'Mélanger tous les ingrédients jusqu\'à pâte homogène.',
      'Former des cookies et disposer sur plaque.',
      'Cuire 10 min à 180°C.'
    ]
  },

  {
    id: 'L245',
    name: 'Crackers Avocat Tomate Basilic',
    emoji: '🥜',
    origin: '🇮🇹',
    mealTypes: ['snack'],
    tags: ['snack', 'crackers', 'avocat', 'tomate', 'basilic', 'huile', 'healthy'],
    difficulty: 1,
    prepTime: 3,
    cookTime: 0,
    servings: 1,
    baseNutrition: { calories: 244, proteinGrams: 8, carbsGrams: 26, fatGrams: 12 },
    ingredients: [
      { name: 'Crackers complets', qty: 40, unit: 'g' },
      { name: 'Avocat', qty: 60, unit: 'g' },
      { name: 'Tomate cerise', qty: 80, unit: 'g' },
      { name: 'Basilic', qty: 5, unit: 'g' },
      { name: 'Huile d\'olive', qty: 8, unit: 'ml' }
    ],
    steps: [
      'Écraser l\'avocat avec sel et citron.',
      'Tartiner les crackers.',
      'Garnir de tomate et basilic.'
    ]
  },

  {
    id: 'L246',
    name: 'Soupe Miso Légère Tofu',
    emoji: '🥜',
    origin: '🇯🇵',
    mealTypes: ['snack'],
    tags: ['snack', 'miso', 'tofu', 'algues', 'oignon vert', 'healthy'],
    difficulty: 1,
    prepTime: 3,
    cookTime: 0,
    servings: 1,
    baseNutrition: { calories: 226, proteinGrams: 14, carbsGrams: 20, fatGrams: 10 },
    ingredients: [
      { name: 'Pâte miso', qty: 20, unit: 'g' },
      { name: 'Tofu soyeux', qty: 100, unit: 'g' },
      { name: 'Algues wakame', qty: 5, unit: 'g' },
      { name: 'Oignons verts', qty: 15, unit: 'g' },
      { name: 'Eau chaude', qty: 300, unit: 'ml' }
    ],
    steps: [
      'Dissoudre la pâte miso dans l\'eau chaude.',
      'Ajouter le tofu en dés et les algues.',
      'Garnir d\'oignons verts.'
    ]
  },

  {
    id: 'L247',
    name: 'Cottage Cheese Ananas Noix Coco',
    emoji: '🥜',
    origin: '🇺🇸',
    mealTypes: ['snack'],
    tags: ['snack', 'cottage cheese', 'ananas', 'coco', 'miel', 'healthy'],
    difficulty: 1,
    prepTime: 3,
    cookTime: 0,
    servings: 1,
    baseNutrition: { calories: 254, proteinGrams: 18, carbsGrams: 14, fatGrams: 14 },
    ingredients: [
      { name: 'Cottage cheese', qty: 150, unit: 'g' },
      { name: 'Ananas', qty: 80, unit: 'g' },
      { name: 'Noix de coco râpée', qty: 20, unit: 'g' },
      { name: 'Miel', qty: 5, unit: 'g' }
    ],
    steps: [
      'Verser le cottage cheese dans un bol.',
      'Garnir d\'ananas, noix de coco et miel.'
    ]
  },

  {
    id: 'L248',
    name: 'Bâtonnets Légumes Sauce Tahini',
    emoji: '🥜',
    origin: '🇱🇧',
    mealTypes: ['snack'],
    tags: ['snack', 'carotte', 'céleri', 'concombre', 'poivron', 'tahini', 'healthy'],
    difficulty: 1,
    prepTime: 3,
    cookTime: 0,
    servings: 1,
    baseNutrition: { calories: 236, proteinGrams: 10, carbsGrams: 22, fatGrams: 12 },
    ingredients: [
      { name: 'Carotte', qty: 80, unit: 'g' },
      { name: 'Céleri', qty: 60, unit: 'g' },
      { name: 'Concombre', qty: 60, unit: 'g' },
      { name: 'Poivron', qty: 60, unit: 'g' },
      { name: 'Tahini', qty: 25, unit: 'g' },
      { name: 'Citron', qty: 10, unit: 'ml' }
    ],
    steps: [
      'Couper les légumes en bâtonnets.',
      'Préparer la sauce tahini avec citron et eau.',
      'Servir ensemble.'
    ]
  },

  {
    id: 'L249',
    name: 'Amandes Grillées Herbes Épicées',
    emoji: '🥜',
    origin: '🌍',
    mealTypes: ['snack'],
    tags: ['snack', 'amandes', 'épices', 'paprika', 'healthy'],
    difficulty: 1,
    prepTime: 3,
    cookTime: 0,
    servings: 1,
    baseNutrition: { calories: 254, proteinGrams: 12, carbsGrams: 20, fatGrams: 14 },
    ingredients: [
      { name: 'Amandes', qty: 60, unit: 'g' },
      { name: 'Épices mélangées', qty: 3, unit: 'g' },
      { name: 'Sel', qty: 2, unit: 'g' },
      { name: 'Huile d\'olive', qty: 5, unit: 'ml' },
      { name: 'Paprika', qty: 2, unit: 'g' }
    ],
    steps: [
      'Mélanger les amandes avec huile et épices.',
      'Rôtir au four 10 min à 170°C.',
      'Laisser refroidir avant de servir.'
    ]
  },

  {
    id: 'L250',
    name: 'Velouté Carotte Gingembre',
    emoji: '🥜',
    origin: '🇫🇷',
    mealTypes: ['snack'],
    tags: ['snack', 'carotte', 'gingembre', 'lait de coco', 'oignon', 'healthy'],
    difficulty: 1,
    prepTime: 3,
    cookTime: 0,
    servings: 1,
    baseNutrition: { calories: 226, proteinGrams: 16, carbsGrams: 18, fatGrams: 10 },
    ingredients: [
      { name: 'Carotte', qty: 200, unit: 'g' },
      { name: 'Gingembre', qty: 10, unit: 'g' },
      { name: 'Lait de coco', qty: 60, unit: 'ml' },
      { name: 'Bouillon de légumes', qty: 200, unit: 'ml' },
      { name: 'Oignon', qty: 40, unit: 'g' },
      { name: 'Huile', qty: 5, unit: 'ml' }
    ],
    steps: [
      'Cuire les carottes avec oignon et gingembre.',
      'Mixer avec le bouillon et le lait de coco.',
      'Servir chaud ou froid.'
    ]
  },

  {
    id: 'L301',
    name: 'Saumon Vapeur Épinards',
    emoji: '🐟',
    origin: '🇸🇪',
    mealTypes: ['dinner'],
    tags: ['dinner', 'saumon', 'épinards', 'huile', 'citron', 'ail', 'healthy'],
    difficulty: 1,
    prepTime: 10,
    cookTime: 15,
    servings: 1,
    baseNutrition: { calories: 480, proteinGrams: 40, carbsGrams: 8, fatGrams: 32 },
    ingredients: [
      { name: 'Filet de saumon', qty: 200, unit: 'g' },
      { name: 'Épinards frais', qty: 150, unit: 'g' },
      { name: 'Huile d\'olive', qty: 15, unit: 'ml' },
      { name: 'Citron', qty: 20, unit: 'ml' },
      { name: 'Ail', qty: 5, unit: 'g' },
      { name: 'Sel', qty: 1, unit: 'g' },
      { name: 'Poivre', qty: 1, unit: 'g' }
    ],
    steps: [
      'Cuire le saumon à la vapeur 12 min.',
      'Faire sauter les épinards avec ail et huile d\'olive.',
      'Servir avec citron frais.'
    ]
  },

  {
    id: 'L302',
    name: 'Poulet Grillé Légumes Vapeur',
    emoji: '🍗',
    origin: '🌍',
    mealTypes: ['dinner'],
    tags: ['dinner', 'poulet', 'brocoli', 'carotte', 'courgette', 'huile', 'healthy'],
    difficulty: 1,
    prepTime: 10,
    cookTime: 15,
    servings: 1,
    baseNutrition: { calories: 392, proteinGrams: 48, carbsGrams: 14, fatGrams: 16 },
    ingredients: [
      { name: 'Blanc de poulet', qty: 220, unit: 'g' },
      { name: 'Brocoli', qty: 120, unit: 'g' },
      { name: 'Carotte', qty: 80, unit: 'g' },
      { name: 'Courgette', qty: 80, unit: 'g' },
      { name: 'Huile d\'olive', qty: 12, unit: 'ml' },
      { name: 'Épices', qty: 3, unit: 'g' }
    ],
    steps: [
      'Mariner le poulet avec épices et huile.',
      'Griller 6 min de chaque côté.',
      'Cuire les légumes à la vapeur 8 min. Servir ensemble.'
    ]
  },

  {
    id: 'L303',
    name: 'Cabillaud Courgettes',
    emoji: '🐟',
    origin: '🇸🇪',
    mealTypes: ['dinner'],
    tags: ['dinner', 'cabillaud', 'courgette', 'huile', 'citron', 'healthy'],
    difficulty: 1,
    prepTime: 10,
    cookTime: 15,
    servings: 1,
    baseNutrition: { calories: 318, proteinGrams: 38, carbsGrams: 10, fatGrams: 14 },
    ingredients: [
      { name: 'Filet de cabillaud', qty: 200, unit: 'g' },
      { name: 'Courgette', qty: 150, unit: 'g' },
      { name: 'Huile d\'olive', qty: 10, unit: 'ml' },
      { name: 'Citron', qty: 15, unit: 'ml' },
      { name: 'Herbes de Provence', qty: 3, unit: 'g' }
    ],
    steps: [
      'Assaisonner le cabillaud avec herbes et citron.',
      'Poêler 4 min de chaque côté.',
      'Cuire les courgettes en rondelles. Servir.'
    ]
  },

  {
    id: 'L304',
    name: 'Dinde Haricots Verts',
    emoji: '🍽️',
    origin: '🇺🇸',
    mealTypes: ['dinner'],
    tags: ['dinner', 'dinde', 'haricots verts', 'ail', 'huile', 'citron', 'healthy'],
    difficulty: 1,
    prepTime: 10,
    cookTime: 15,
    servings: 1,
    baseNutrition: { calories: 376, proteinGrams: 44, carbsGrams: 14, fatGrams: 16 },
    ingredients: [
      { name: 'Escalope de dinde', qty: 200, unit: 'g' },
      { name: 'Haricots verts', qty: 200, unit: 'g' },
      { name: 'Ail', qty: 5, unit: 'g' },
      { name: 'Huile d\'olive', qty: 12, unit: 'ml' },
      { name: 'Citron', qty: 15, unit: 'ml' },
      { name: 'Thym', qty: 2, unit: 'g' }
    ],
    steps: [
      'Cuire les haricots verts al dente.',
      'Poêler la dinde avec ail et thym.',
      'Servir avec citron et huile d\'olive.'
    ]
  },

  {
    id: 'L305',
    name: 'Omelette Champignons Herbes',
    emoji: '🍽️',
    origin: '🇫🇷',
    mealTypes: ['dinner'],
    tags: ['dinner', 'œuf', 'champignons', 'persil', 'ciboulette', 'beurre', 'healthy'],
    difficulty: 1,
    prepTime: 10,
    cookTime: 15,
    servings: 1,
    baseNutrition: { calories: 354, proteinGrams: 24, carbsGrams: 6, fatGrams: 26 },
    ingredients: [
      { name: 'Œufs', qty: 180, unit: 'g' },
      { name: 'Champignons', qty: 120, unit: 'g' },
      { name: 'Persil', qty: 10, unit: 'g' },
      { name: 'Ciboulette', qty: 5, unit: 'g' },
      { name: 'Beurre', qty: 15, unit: 'g' },
      { name: 'Sel', qty: 1, unit: 'g' },
      { name: 'Poivre', qty: 1, unit: 'g' }
    ],
    steps: [
      'Faire sauter les champignons dans le beurre.',
      'Battre les œufs avec les herbes.',
      'Cuire l\'omelette moelleuse, garnir de champignons.'
    ]
  },

  {
    id: 'L306',
    name: 'Soupe Miso Saumon',
    emoji: '🐟',
    origin: '🇯🇵',
    mealTypes: ['dinner'],
    tags: ['dinner', 'saumon', 'miso', 'tofu', 'algues', 'nouilles', 'oignon vert', 'healthy'],
    difficulty: 2,
    prepTime: 10,
    cookTime: 20,
    servings: 1,
    baseNutrition: { calories: 374, proteinGrams: 34, carbsGrams: 28, fatGrams: 14 },
    ingredients: [
      { name: 'Saumon', qty: 150, unit: 'g' },
      { name: 'Pâte miso', qty: 25, unit: 'g' },
      { name: 'Tofu', qty: 100, unit: 'g' },
      { name: 'Algues wakame', qty: 10, unit: 'g' },
      { name: 'Oignons verts', qty: 20, unit: 'g' },
      { name: 'Nouilles soba', qty: 60, unit: 'g' }
    ],
    steps: [
      'Porter l\'eau à ébullition, ajouter les nouilles.',
      'Cuire le saumon.',
      'Dissoudre le miso hors feu, ajouter tous les ingrédients.'
    ]
  },

  {
    id: 'L307',
    name: 'Tajine Poulet Citron Confit',
    emoji: '🍗',
    origin: '🇲🇦',
    mealTypes: ['dinner'],
    tags: ['dinner', 'poulet', 'citron confit', 'olives', 'oignon', 'coriandre', 'healthy'],
    difficulty: 3,
    prepTime: 10,
    cookTime: 30,
    servings: 1,
    baseNutrition: { calories: 436, proteinGrams: 46, carbsGrams: 18, fatGrams: 20 },
    ingredients: [
      { name: 'Cuisses de poulet', qty: 220, unit: 'g' },
      { name: 'Citron confit', qty: 30, unit: 'g' },
      { name: 'Olives', qty: 30, unit: 'g' },
      { name: 'Oignon', qty: 60, unit: 'g' },
      { name: 'Ras el hanout', qty: 5, unit: 'g' },
      { name: 'Huile d\'olive', qty: 10, unit: 'ml' },
      { name: 'Coriandre', qty: 10, unit: 'g' }
    ],
    steps: [
      'Faire dorer le poulet avec épices et oignon.',
      'Ajouter citron confit, olives et 200ml d\'eau.',
      'Mijoter 45 min. Servir avec coriandre.'
    ]
  },

  {
    id: 'L308',
    name: 'Teriyaki Poulet Brocoli',
    emoji: '🍗',
    origin: '🇯🇵',
    mealTypes: ['dinner'],
    tags: ['dinner', 'poulet', 'brocoli', 'teriyaki', 'riz', 'sésame', 'healthy'],
    difficulty: 2,
    prepTime: 10,
    cookTime: 20,
    servings: 1,
    baseNutrition: { calories: 470, proteinGrams: 44, carbsGrams: 42, fatGrams: 14 },
    ingredients: [
      { name: 'Blanc de poulet', qty: 200, unit: 'g' },
      { name: 'Brocoli', qty: 150, unit: 'g' },
      { name: 'Sauce teriyaki', qty: 30, unit: 'ml' },
      { name: 'Riz', qty: 80, unit: 'g' },
      { name: 'Sésame', qty: 8, unit: 'g' },
      { name: 'Gingembre', qty: 5, unit: 'g' }
    ],
    steps: [
      'Mariner le poulet dans la sauce teriyaki.',
      'Griller le poulet, cuire le brocoli vapeur.',
      'Servir avec riz et sésame.'
    ]
  },

  {
    id: 'L309',
    name: 'Crevettes Ail Citron',
    emoji: '🦐',
    origin: '🌍',
    mealTypes: ['dinner'],
    tags: ['dinner', 'crevettes', 'ail', 'citron', 'huile', 'persil', 'healthy'],
    difficulty: 1,
    prepTime: 10,
    cookTime: 15,
    servings: 1,
    baseNutrition: { calories: 364, proteinGrams: 34, carbsGrams: 12, fatGrams: 20 },
    ingredients: [
      { name: 'Crevettes', qty: 250, unit: 'g' },
      { name: 'Ail', qty: 10, unit: 'g' },
      { name: 'Citron', qty: 20, unit: 'ml' },
      { name: 'Huile d\'olive', qty: 15, unit: 'ml' },
      { name: 'Persil', qty: 10, unit: 'g' },
      { name: 'Piment', qty: 2, unit: 'g' }
    ],
    steps: [
      'Chauffer l\'huile à feu vif.',
      'Faire sauter les crevettes avec ail et piment 3 min.',
      'Finir avec citron et persil.'
    ]
  },

  {
    id: 'L310',
    name: 'Pho Bœuf',
    emoji: '🥩',
    origin: '🇻🇳',
    mealTypes: ['dinner'],
    tags: ['dinner', 'bœuf', 'nouilles', 'gingembre', 'basilic', 'soja', 'healthy'],
    difficulty: 3,
    prepTime: 15,
    cookTime: 25,
    servings: 1,
    baseNutrition: { calories: 422, proteinGrams: 36, carbsGrams: 38, fatGrams: 14 },
    ingredients: [
      { name: 'Bœuf', qty: 160, unit: 'g' },
      { name: 'Nouilles de riz', qty: 100, unit: 'g' },
      { name: 'Bouillon pho', qty: 600, unit: 'ml' },
      { name: 'Oignon brûlé', qty: 40, unit: 'g' },
      { name: 'Gingembre', qty: 15, unit: 'g' },
      { name: 'Basilic', qty: 10, unit: 'g' },
      { name: 'Citron vert', qty: 15, unit: 'ml' },
      { name: 'Germes de soja', qty: 60, unit: 'g' }
    ],
    steps: [
      'Préparer le bouillon pho avec épices 1h.',
      'Cuire les nouilles.',
      'Assembler avec bœuf cru tranché fin (le bouillon le cuit), herbes fraîches.'
    ]
  },

  {
    id: 'L311',
    name: 'Blanquette Veau Légère',
    emoji: '🥩',
    origin: '🇫🇷',
    mealTypes: ['dinner'],
    tags: ['dinner', 'veau', 'carotte', 'champignons', 'oignon', 'crème', 'healthy'],
    difficulty: 3,
    prepTime: 15,
    cookTime: 25,
    servings: 1,
    baseNutrition: { calories: 478, proteinGrams: 46, carbsGrams: 24, fatGrams: 22 },
    ingredients: [
      { name: 'Veau', qty: 200, unit: 'g' },
      { name: 'Carotte', qty: 80, unit: 'g' },
      { name: 'Champignons', qty: 80, unit: 'g' },
      { name: 'Oignon', qty: 60, unit: 'g' },
      { name: 'Crème légère', qty: 60, unit: 'ml' },
      { name: 'Citron', qty: 10, unit: 'ml' },
      { name: 'Bouillon', qty: 400, unit: 'ml' }
    ],
    steps: [
      'Cuire le veau dans le bouillon avec légumes 1h.',
      'Préparer la sauce à la crème avec citron.',
      'Filtrer le bouillon, assembler avec la sauce.'
    ]
  },

  {
    id: 'L312',
    name: 'Tataki Bœuf Sésame',
    emoji: '🥩',
    origin: '🇯🇵',
    mealTypes: ['dinner'],
    tags: ['dinner', 'bœuf', 'sésame', 'soja', 'gingembre', 'salade', 'healthy'],
    difficulty: 3,
    prepTime: 15,
    cookTime: 25,
    servings: 1,
    baseNutrition: { calories: 396, proteinGrams: 42, carbsGrams: 12, fatGrams: 20 },
    ingredients: [
      { name: 'Filet de bœuf', qty: 200, unit: 'g' },
      { name: 'Sésame', qty: 15, unit: 'g' },
      { name: 'Sauce soja', qty: 15, unit: 'ml' },
      { name: 'Gingembre', qty: 8, unit: 'g' },
      { name: 'Huile de sésame', qty: 8, unit: 'ml' },
      { name: 'Salade', qty: 60, unit: 'g' }
    ],
    steps: [
      'Rouler le filet de bœuf dans le sésame.',
      'Saisir 30 sec de chaque côté à feu très vif.',
      'Trancher fin, servir sur salade avec sauce soja et gingembre.'
    ]
  },

  {
    id: 'L313',
    name: 'Curry Vert Crevettes',
    emoji: '🦐',
    origin: '🇹🇭',
    mealTypes: ['dinner'],
    tags: ['dinner', 'crevettes', 'lait de coco', 'curry vert', 'aubergine', 'riz', 'basilic', 'healthy'],
    difficulty: 2,
    prepTime: 10,
    cookTime: 20,
    servings: 1,
    baseNutrition: { calories: 442, proteinGrams: 32, carbsGrams: 38, fatGrams: 18 },
    ingredients: [
      { name: 'Crevettes', qty: 200, unit: 'g' },
      { name: 'Lait de coco', qty: 100, unit: 'ml' },
      { name: 'Pâte de curry vert', qty: 20, unit: 'g' },
      { name: 'Aubergine', qty: 100, unit: 'g' },
      { name: 'Riz jasmin', qty: 80, unit: 'g' },
      { name: 'Basilic thaï', qty: 10, unit: 'g' }
    ],
    steps: [
      'Faire revenir la pâte de curry dans une poêle.',
      'Ajouter les crevettes, puis le lait de coco et aubergine.',
      'Mijoter 10 min. Servir avec riz et basilic.'
    ]
  },

  {
    id: 'L314',
    name: 'Dorade Croûte de Sel',
    emoji: '🍽️',
    origin: '🌍',
    mealTypes: ['dinner'],
    tags: ['dinner', 'dorade', 'sel', 'herbes', 'citron', 'huile', 'healthy'],
    difficulty: 3,
    prepTime: 15,
    cookTime: 25,
    servings: 1,
    baseNutrition: { calories: 390, proteinGrams: 44, carbsGrams: 4, fatGrams: 22 },
    ingredients: [
      { name: 'Dorade', qty: 400, unit: 'g' },
      { name: 'Gros sel', qty: 500, unit: 'g' },
      { name: 'Blancs d\'œufs', qty: 60, unit: 'g' },
      { name: 'Herbes aromatiques', qty: 10, unit: 'g' },
      { name: 'Citron', qty: 20, unit: 'ml' },
      { name: 'Huile d\'olive', qty: 10, unit: 'ml' }
    ],
    steps: [
      'Mélanger le gros sel avec les blancs d\'œufs.',
      'Envelopper la dorade dans la croûte de sel.',
      'Cuire 25 min à 200°C. Casser la croûte, servir avec citron.'
    ]
  },

  {
    id: 'L315',
    name: 'Gyoza Dinde Vapeur',
    emoji: '🍽️',
    origin: '🇯🇵',
    mealTypes: ['dinner'],
    tags: ['dinner', 'dinde', 'chou', 'gingembre', 'soja', 'sésame', 'healthy'],
    difficulty: 3,
    prepTime: 15,
    cookTime: 25,
    servings: 1,
    baseNutrition: { calories: 470, proteinGrams: 38, carbsGrams: 48, fatGrams: 14 },
    ingredients: [
      { name: 'Dinde hachée', qty: 150, unit: 'g' },
      { name: 'Pâtes à gyoza', qty: 100, unit: 'g' },
      { name: 'Chou', qty: 80, unit: 'g' },
      { name: 'Gingembre', qty: 8, unit: 'g' },
      { name: 'Sauce soja', qty: 15, unit: 'ml' },
      { name: 'Huile de sésame', qty: 8, unit: 'ml' },
      { name: 'Oignons verts', qty: 15, unit: 'g' }
    ],
    steps: [
      'Mélanger dinde, chou, gingembre et assaisonnement.',
      'Plier les gyoza.',
      'Cuire à la vapeur 12 min. Servir avec sauce soja et huile de sésame.'
    ]
  },

  {
    id: 'L316',
    name: 'Filet de Bar Herbes Vapeur',
    emoji: '🍽️',
    origin: '🇫🇷',
    mealTypes: ['dinner'],
    tags: ['dinner', 'bar', 'poireaux', 'carotte', 'huile', 'citron', 'thym', 'healthy'],
    difficulty: 2,
    prepTime: 10,
    cookTime: 20,
    servings: 1,
    baseNutrition: { calories: 446, proteinGrams: 42, carbsGrams: 20, fatGrams: 22 },
    ingredients: [
      { name: 'Filet de bar', qty: 200, unit: 'g' },
      { name: 'Poireaux', qty: 120, unit: 'g' },
      { name: 'Carotte', qty: 80, unit: 'g' },
      { name: 'Huile d\'olive', qty: 15, unit: 'ml' },
      { name: 'Citron', qty: 20, unit: 'ml' },
      { name: 'Thym', qty: 3, unit: 'g' }
    ],
    steps: [
      'Cuire les légumes à la vapeur 8 min.',
      'Cuire le bar vapeur 10 min avec thym.',
      'Servir avec légumes et citron.'
    ]
  },

  {
    id: 'L317',
    name: 'Poulet Moutarde Légumes Rôtis',
    emoji: '🍗',
    origin: '🇫🇷',
    mealTypes: ['dinner'],
    tags: ['dinner', 'poulet', 'moutarde', 'carotte', 'courgette', 'oignon', 'healthy'],
    difficulty: 2,
    prepTime: 10,
    cookTime: 20,
    servings: 1,
    baseNutrition: { calories: 464, proteinGrams: 40, carbsGrams: 22, fatGrams: 24 },
    ingredients: [
      { name: 'Cuisses de poulet', qty: 200, unit: 'g' },
      { name: 'Moutarde', qty: 20, unit: 'g' },
      { name: 'Carotte', qty: 80, unit: 'g' },
      { name: 'Courgette', qty: 80, unit: 'g' },
      { name: 'Oignon', qty: 60, unit: 'g' },
      { name: 'Huile d\'olive', qty: 12, unit: 'ml' }
    ],
    steps: [
      'Badigeonner le poulet de moutarde.',
      'Disposer avec les légumes en dés.',
      'Cuire au four 35 min à 190°C.'
    ]
  },

  {
    id: 'L318',
    name: 'Thon Grillé Salade Niçoise',
    emoji: '🐟',
    origin: '🇫🇷',
    mealTypes: ['dinner'],
    tags: ['dinner', 'thon', 'haricots verts', 'œuf', 'tomate', 'olives', 'huile', 'healthy'],
    difficulty: 2,
    prepTime: 10,
    cookTime: 0,
    servings: 1,
    baseNutrition: { calories: 460, proteinGrams: 38, carbsGrams: 14, fatGrams: 28 },
    ingredients: [
      { name: 'Thon frais', qty: 200, unit: 'g' },
      { name: 'Haricots verts', qty: 80, unit: 'g' },
      { name: 'Œuf dur', qty: 60, unit: 'g' },
      { name: 'Tomate', qty: 80, unit: 'g' },
      { name: 'Olives', qty: 20, unit: 'g' },
      { name: 'Huile d\'olive', qty: 15, unit: 'ml' },
      { name: 'Moutarde', qty: 10, unit: 'g' }
    ],
    steps: [
      'Griller le thon 2-3 min de chaque côté.',
      'Cuire les haricots verts al dente.',
      'Composer la salade, assaisonner à la moutarde.'
    ]
  },

  {
    id: 'L319',
    name: 'Salade de Poulet Grillé Roquette',
    emoji: '🍗',
    origin: '🇮🇹',
    mealTypes: ['dinner'],
    tags: ['dinner', 'poulet', 'roquette', 'tomate', 'parmesan', 'pignons', 'healthy'],
    difficulty: 1,
    prepTime: 10,
    cookTime: 0,
    servings: 1,
    baseNutrition: { calories: 438, proteinGrams: 44, carbsGrams: 16, fatGrams: 22 },
    ingredients: [
      { name: 'Blanc de poulet', qty: 200, unit: 'g' },
      { name: 'Roquette', qty: 60, unit: 'g' },
      { name: 'Tomates cerises', qty: 100, unit: 'g' },
      { name: 'Parmesan', qty: 30, unit: 'g' },
      { name: 'Pignons', qty: 15, unit: 'g' },
      { name: 'Huile d\'olive', qty: 12, unit: 'ml' },
      { name: 'Vinaigre balsamique', qty: 10, unit: 'ml' }
    ],
    steps: [
      'Griller le poulet assaisonné.',
      'Préparer la base de roquette avec tomates et parmesan.',
      'Trancher le poulet, disposer sur la salade.'
    ]
  },

  {
    id: 'L320',
    name: 'Steak de Thon Sesame Salade',
    emoji: '🐟',
    origin: '🇯🇵',
    mealTypes: ['dinner'],
    tags: ['dinner', 'thon', 'sésame', 'soja', 'salade', 'gingembre', 'healthy'],
    difficulty: 2,
    prepTime: 10,
    cookTime: 0,
    servings: 1,
    baseNutrition: { calories: 420, proteinGrams: 46, carbsGrams: 14, fatGrams: 20 },
    ingredients: [
      { name: 'Thon frais', qty: 220, unit: 'g' },
      { name: 'Sésame', qty: 15, unit: 'g' },
      { name: 'Sauce soja', qty: 15, unit: 'ml' },
      { name: 'Huile de sésame', qty: 8, unit: 'ml' },
      { name: 'Salade mélangée', qty: 80, unit: 'g' },
      { name: 'Gingembre', qty: 8, unit: 'g' },
      { name: 'Citron vert', qty: 15, unit: 'ml' }
    ],
    steps: [
      'Paner le thon dans le sésame.',
      'Saisir 1 min de chaque côté.',
      'Trancher et servir sur salade avec sauce soja-gingembre.'
    ]
  },

  {
    id: 'L321',
    name: 'Agneau Grillé Légumes Méditerranéens',
    emoji: '🥩',
    origin: '🇬🇷',
    mealTypes: ['dinner'],
    tags: ['dinner', 'agneau', 'courgette', 'poivron', 'tomate', 'ail', 'huile', 'healthy'],
    difficulty: 2,
    prepTime: 10,
    cookTime: 20,
    servings: 1,
    baseNutrition: { calories: 466, proteinGrams: 40, carbsGrams: 18, fatGrams: 26 },
    ingredients: [
      { name: 'Côtelettes d\'agneau', qty: 200, unit: 'g' },
      { name: 'Courgette', qty: 80, unit: 'g' },
      { name: 'Poivron', qty: 80, unit: 'g' },
      { name: 'Tomate', qty: 80, unit: 'g' },
      { name: 'Ail', qty: 5, unit: 'g' },
      { name: 'Herbes grecques', qty: 5, unit: 'g' },
      { name: 'Huile d\'olive', qty: 12, unit: 'ml' }
    ],
    steps: [
      'Mariner les côtelettes avec herbes, ail et huile.',
      'Griller 4 min de chaque côté.',
      'Rôtir les légumes séparément.'
    ]
  },

  {
    id: 'L322',
    name: 'Morue Pil Pil Poivrons',
    emoji: '🍽️',
    origin: '🇪🇸',
    mealTypes: ['dinner'],
    tags: ['dinner', 'morue', 'poivrons', 'ail', 'huile', 'pomme de terre', 'healthy'],
    difficulty: 3,
    prepTime: 15,
    cookTime: 25,
    servings: 1,
    baseNutrition: { calories: 426, proteinGrams: 38, carbsGrams: 28, fatGrams: 18 },
    ingredients: [
      { name: 'Morue dessalée', qty: 200, unit: 'g' },
      { name: 'Poivrons rôtis', qty: 100, unit: 'g' },
      { name: 'Ail', qty: 10, unit: 'g' },
      { name: 'Huile d\'olive', qty: 15, unit: 'ml' },
      { name: 'Pommes de terre', qty: 100, unit: 'g' }
    ],
    steps: [
      'Dessaler la morue 24h.',
      'Confiture la morue dans l\'huile avec ail.',
      'Laisser émulsionner la sauce, servir avec poivrons et pommes de terre.'
    ]
  },

  {
    id: 'L323',
    name: 'Bœuf Bourguignon Allégé',
    emoji: '🥩',
    origin: '🇫🇷',
    mealTypes: ['dinner'],
    tags: ['dinner', 'bœuf', 'carotte', 'oignon', 'champignons', 'tomate', 'healthy'],
    difficulty: 3,
    prepTime: 15,
    cookTime: 25,
    servings: 1,
    baseNutrition: { calories: 454, proteinGrams: 42, carbsGrams: 22, fatGrams: 22 },
    ingredients: [
      { name: 'Bœuf à braiser', qty: 200, unit: 'g' },
      { name: 'Carotte', qty: 80, unit: 'g' },
      { name: 'Oignon', qty: 60, unit: 'g' },
      { name: 'Champignons', qty: 80, unit: 'g' },
      { name: 'Bouillon', qty: 300, unit: 'ml' },
      { name: 'Concentré de tomate', qty: 20, unit: 'g' },
      { name: 'Herbes', qty: 5, unit: 'g' }
    ],
    steps: [
      'Faire dorer le bœuf.',
      'Ajouter les légumes, le concentré et le bouillon.',
      'Mijoter 1h30 à feu très doux.'
    ]
  },

  {
    id: 'L324',
    name: 'Escalope Dinde Légères Vapeur',
    emoji: '🍽️',
    origin: '🇺🇸',
    mealTypes: ['dinner'],
    tags: ['dinner', 'dinde', 'haricots verts', 'asperges', 'huile', 'citron', 'healthy'],
    difficulty: 1,
    prepTime: 10,
    cookTime: 15,
    servings: 1,
    baseNutrition: { calories: 414, proteinGrams: 44, carbsGrams: 10, fatGrams: 22 },
    ingredients: [
      { name: 'Escalope de dinde', qty: 220, unit: 'g' },
      { name: 'Haricots verts', qty: 150, unit: 'g' },
      { name: 'Asperges', qty: 100, unit: 'g' },
      { name: 'Huile d\'olive', qty: 12, unit: 'ml' },
      { name: 'Citron', qty: 15, unit: 'ml' },
      { name: 'Ail', qty: 5, unit: 'g' }
    ],
    steps: [
      'Cuire dinde à la vapeur ou à la poêle.',
      'Cuire les légumes al dente.',
      'Assaisonner avec huile, citron et ail.'
    ]
  },

  {
    id: 'L325',
    name: 'Salade Tiède Bœuf Avocat',
    emoji: '🥩',
    origin: '🇺🇸',
    mealTypes: ['dinner'],
    tags: ['dinner', 'bœuf', 'avocat', 'tomate', 'maïs', 'laitue', 'healthy'],
    difficulty: 2,
    prepTime: 10,
    cookTime: 0,
    servings: 1,
    baseNutrition: { calories: 444, proteinGrams: 36, carbsGrams: 30, fatGrams: 20 },
    ingredients: [
      { name: 'Bœuf haché maigre', qty: 160, unit: 'g' },
      { name: 'Avocat', qty: 80, unit: 'g' },
      { name: 'Tomate', qty: 80, unit: 'g' },
      { name: 'Maïs', qty: 60, unit: 'g' },
      { name: 'Laitue', qty: 60, unit: 'g' },
      { name: 'Citron', qty: 15, unit: 'ml' },
      { name: 'Épices', qty: 3, unit: 'g' }
    ],
    steps: [
      'Cuire le bœuf haché avec épices.',
      'Préparer la salade avec tous les légumes.',
      'Assembler tiède avec le bœuf.'
    ]
  },

  {
    id: 'L326',
    name: 'Filet de Sole Vapeur Légumes',
    emoji: '🥦',
    origin: '🇫🇷',
    mealTypes: ['dinner'],
    tags: ['dinner', 'sole', 'courgette', 'carotte', 'brocoli', 'huile', 'citron', 'healthy'],
    difficulty: 1,
    prepTime: 10,
    cookTime: 15,
    servings: 1,
    baseNutrition: { calories: 436, proteinGrams: 40, carbsGrams: 24, fatGrams: 20 },
    ingredients: [
      { name: 'Sole', qty: 220, unit: 'g' },
      { name: 'Courgette', qty: 100, unit: 'g' },
      { name: 'Carotte', qty: 80, unit: 'g' },
      { name: 'Brocoli', qty: 80, unit: 'g' },
      { name: 'Huile d\'olive', qty: 12, unit: 'ml' },
      { name: 'Citron', qty: 15, unit: 'ml' },
      { name: 'Estragon', qty: 3, unit: 'g' }
    ],
    steps: [
      'Cuire la sole et les légumes à la vapeur 12 min.',
      'Arroser d\'huile d\'olive et citron.',
      'Garnir d\'estragon.'
    ]
  },

  {
    id: 'L327',
    name: 'Poulet Citron Curcuma Épinards',
    emoji: '🍗',
    origin: '🇮🇳',
    mealTypes: ['dinner'],
    tags: ['dinner', 'poulet', 'épinards', 'curcuma', 'gingembre', 'citron', 'riz', 'healthy'],
    difficulty: 2,
    prepTime: 10,
    cookTime: 20,
    servings: 1,
    baseNutrition: { calories: 442, proteinGrams: 38, carbsGrams: 32, fatGrams: 18 },
    ingredients: [
      { name: 'Blanc de poulet', qty: 180, unit: 'g' },
      { name: 'Épinards', qty: 120, unit: 'g' },
      { name: 'Oignon', qty: 60, unit: 'g' },
      { name: 'Curcuma', qty: 3, unit: 'g' },
      { name: 'Gingembre', qty: 8, unit: 'g' },
      { name: 'Citron', qty: 15, unit: 'ml' },
      { name: 'Riz', qty: 60, unit: 'g' },
      { name: 'Huile', qty: 8, unit: 'ml' }
    ],
    steps: [
      'Poêler le poulet avec curcuma et gingembre.',
      'Ajouter les épinards.',
      'Servir avec riz basmati et jus de citron.'
    ]
  },

  {
    id: 'L328',
    name: 'Saumon Épinards Crème Légère',
    emoji: '🐟',
    origin: '🇸🇪',
    mealTypes: ['dinner'],
    tags: ['dinner', 'saumon', 'épinards', 'crème', 'ail', 'citron', 'aneth', 'healthy'],
    difficulty: 2,
    prepTime: 10,
    cookTime: 20,
    servings: 1,
    baseNutrition: { calories: 432, proteinGrams: 42, carbsGrams: 12, fatGrams: 24 },
    ingredients: [
      { name: 'Saumon', qty: 200, unit: 'g' },
      { name: 'Épinards', qty: 120, unit: 'g' },
      { name: 'Crème légère', qty: 60, unit: 'ml' },
      { name: 'Ail', qty: 5, unit: 'g' },
      { name: 'Citron', qty: 15, unit: 'ml' },
      { name: 'Aneth', qty: 5, unit: 'g' },
      { name: 'Huile', qty: 8, unit: 'ml' }
    ],
    steps: [
      'Poêler le saumon côté peau 4 min.',
      'Faire une sauce crème avec épinards, ail et citron.',
      'Servir le saumon nappé de sauce.'
    ]
  },

  {
    id: 'L329',
    name: 'Crevettes Curry Coco Légumes',
    emoji: '🦐',
    origin: '🇹🇭',
    mealTypes: ['dinner'],
    tags: ['dinner', 'crevettes', 'lait de coco', 'curry', 'brocoli', 'poivron', 'coriandre', 'healthy'],
    difficulty: 2,
    prepTime: 10,
    cookTime: 20,
    servings: 1,
    baseNutrition: { calories: 436, proteinGrams: 44, carbsGrams: 20, fatGrams: 20 },
    ingredients: [
      { name: 'Crevettes', qty: 220, unit: 'g' },
      { name: 'Lait de coco', qty: 80, unit: 'ml' },
      { name: 'Curry rouge', qty: 15, unit: 'g' },
      { name: 'Brocoli', qty: 100, unit: 'g' },
      { name: 'Poivron', qty: 80, unit: 'g' },
      { name: 'Coriandre', qty: 10, unit: 'g' }
    ],
    steps: [
      'Faire revenir le curry dans une poêle.',
      'Ajouter les crevettes et légumes.',
      'Incorporer le lait de coco, mijoter 8 min.'
    ]
  },

  {
    id: 'L330',
    name: 'Magret de Canard Légumes Vapeur',
    emoji: '🥦',
    origin: '🇫🇷',
    mealTypes: ['dinner'],
    tags: ['dinner', 'canard', 'haricots verts', 'carotte', 'orange', 'miel', 'healthy'],
    difficulty: 3,
    prepTime: 15,
    cookTime: 25,
    servings: 1,
    baseNutrition: { calories: 446, proteinGrams: 40, carbsGrams: 22, fatGrams: 22 },
    ingredients: [
      { name: 'Magret de canard', qty: 180, unit: 'g' },
      { name: 'Haricots verts', qty: 120, unit: 'g' },
      { name: 'Carotte', qty: 80, unit: 'g' },
      { name: 'Orange', qty: 60, unit: 'ml' },
      { name: 'Miel', qty: 10, unit: 'g' },
      { name: 'Vinaigre', qty: 10, unit: 'ml' }
    ],
    steps: [
      'Quadriller et cuire le magret côté peau.',
      'Préparer la sauce orange-miel.',
      'Servir avec légumes vapeur et sauce.'
    ]
  },

  {
    id: 'L331',
    name: 'Cabillaud Tajine Légumes',
    emoji: '🐟',
    origin: '🇲🇦',
    mealTypes: ['dinner'],
    tags: ['dinner', 'cabillaud', 'courgette', 'tomate', 'oignon', 'chermoula', 'coriandre', 'healthy'],
    difficulty: 2,
    prepTime: 10,
    cookTime: 30,
    servings: 1,
    baseNutrition: { calories: 448, proteinGrams: 40, carbsGrams: 18, fatGrams: 24 },
    ingredients: [
      { name: 'Cabillaud', qty: 200, unit: 'g' },
      { name: 'Courgette', qty: 80, unit: 'g' },
      { name: 'Tomate', qty: 80, unit: 'g' },
      { name: 'Oignon', qty: 60, unit: 'g' },
      { name: 'Chermoula', qty: 20, unit: 'g' },
      { name: 'Huile d\'olive', qty: 12, unit: 'ml' },
      { name: 'Coriandre', qty: 10, unit: 'g' }
    ],
    steps: [
      'Mariner le cabillaud dans la chermoula.',
      'Disposer les légumes dans un tajine.',
      'Ajouter le poisson, cuire 25 min à couvert.'
    ]
  },

  {
    id: 'L332',
    name: 'Gambas Plancha Sauce Romesco',
    emoji: '🍽️',
    origin: '🇪🇸',
    mealTypes: ['dinner'],
    tags: ['dinner', 'gambas', 'poivrons', 'amandes', 'ail', 'huile', 'citron', 'healthy'],
    difficulty: 2,
    prepTime: 10,
    cookTime: 20,
    servings: 1,
    baseNutrition: { calories: 448, proteinGrams: 42, carbsGrams: 16, fatGrams: 24 },
    ingredients: [
      { name: 'Gambas', qty: 220, unit: 'g' },
      { name: 'Poivrons rôtis', qty: 100, unit: 'g' },
      { name: 'Amandes', qty: 20, unit: 'g' },
      { name: 'Ail', qty: 8, unit: 'g' },
      { name: 'Huile d\'olive', qty: 12, unit: 'ml' },
      { name: 'Piment', qty: 3, unit: 'g' },
      { name: 'Citron', qty: 15, unit: 'ml' }
    ],
    steps: [
      'Cuire les gambas à la plancha 2 min de chaque côté.',
      'Mixer poivrons, amandes, ail pour la sauce romesco.',
      'Servir avec la sauce.'
    ]
  },

  {
    id: 'L333',
    name: 'Poulet Vapeur Riz Thaï Basilic',
    emoji: '🍗',
    origin: '🇹🇭',
    mealTypes: ['dinner'],
    tags: ['dinner', 'poulet', 'basilic', 'ail', 'piment', 'huile', 'healthy'],
    difficulty: 2,
    prepTime: 10,
    cookTime: 20,
    servings: 1,
    baseNutrition: { calories: 412, proteinGrams: 44, carbsGrams: 14, fatGrams: 20 },
    ingredients: [
      { name: 'Blanc de poulet', qty: 220, unit: 'g' },
      { name: 'Basilic thaï', qty: 15, unit: 'g' },
      { name: 'Ail', qty: 8, unit: 'g' },
      { name: 'Piment', qty: 3, unit: 'g' },
      { name: 'Sauce de poisson halal', qty: 10, unit: 'ml' },
      { name: 'Huile', qty: 10, unit: 'ml' }
    ],
    steps: [
      'Cuire le poulet vapeur ou poêlé.',
      'Préparer la sauce basilic-ail.',
      'Servir avec riz thaï jasmin.'
    ]
  },

  {
    id: 'L334',
    name: 'Salade Chaude Poulpe Grillé',
    emoji: '🥗',
    origin: '🇵🇹',
    mealTypes: ['dinner'],
    tags: ['dinner', 'poulpe', 'pomme de terre', 'tomate', 'oignon', 'persil', 'huile', 'healthy'],
    difficulty: 3,
    prepTime: 10,
    cookTime: 0,
    servings: 1,
    baseNutrition: { calories: 454, proteinGrams: 40, carbsGrams: 24, fatGrams: 22 },
    ingredients: [
      { name: 'Poulpe cuit', qty: 200, unit: 'g' },
      { name: 'Pomme de terre', qty: 100, unit: 'g' },
      { name: 'Tomate', qty: 80, unit: 'g' },
      { name: 'Oignon rouge', qty: 40, unit: 'g' },
      { name: 'Persil', qty: 10, unit: 'g' },
      { name: 'Huile d\'olive', qty: 12, unit: 'ml' },
      { name: 'Citron', qty: 15, unit: 'ml' }
    ],
    steps: [
      'Griller le poulpe précuit.',
      'Cuire les pommes de terre.',
      'Assembler la salade avec tous les ingrédients.'
    ]
  },

  {
    id: 'L335',
    name: 'Soupe Poulet Légumes Maison',
    emoji: '🍗',
    origin: '🇫🇷',
    mealTypes: ['dinner'],
    tags: ['dinner', 'poulet', 'carotte', 'navet', 'poireau', 'céleri', 'vermicelles', 'healthy'],
    difficulty: 2,
    prepTime: 10,
    cookTime: 20,
    servings: 1,
    baseNutrition: { calories: 454, proteinGrams: 38, carbsGrams: 26, fatGrams: 22 },
    ingredients: [
      { name: 'Poulet', qty: 180, unit: 'g' },
      { name: 'Carotte', qty: 80, unit: 'g' },
      { name: 'Navet', qty: 60, unit: 'g' },
      { name: 'Poireau', qty: 60, unit: 'g' },
      { name: 'Céleri', qty: 40, unit: 'g' },
      { name: 'Bouillon', qty: 600, unit: 'ml' },
      { name: 'Vermicelles', qty: 40, unit: 'g' }
    ],
    steps: [
      'Cuire le poulet dans le bouillon.',
      'Ajouter les légumes taillés, cuire 20 min.',
      'Ajouter vermicelles, cuire 5 min.'
    ]
  },

  {
    id: 'L336',
    name: 'Bœuf Haché Courgette Gratiné',
    emoji: '🥩',
    origin: '🇮🇹',
    mealTypes: ['dinner'],
    tags: ['dinner', 'bœuf', 'courgette', 'tomate', 'fromage', 'oignon', 'healthy'],
    difficulty: 2,
    prepTime: 10,
    cookTime: 20,
    servings: 1,
    baseNutrition: { calories: 446, proteinGrams: 42, carbsGrams: 20, fatGrams: 22 },
    ingredients: [
      { name: 'Bœuf haché', qty: 180, unit: 'g' },
      { name: 'Courgette', qty: 200, unit: 'g' },
      { name: 'Tomate', qty: 100, unit: 'g' },
      { name: 'Fromage râpé', qty: 30, unit: 'g' },
      { name: 'Oignon', qty: 60, unit: 'g' },
      { name: 'Herbes', qty: 3, unit: 'g' }
    ],
    steps: [
      'Évider les courgettes et farcir de bœuf haché.',
      'Napper de sauce tomate.',
      'Gratiner 25 min à 180°C.'
    ]
  },

  {
    id: 'L337',
    name: 'Rôti de Dinde Légumes Printaniers',
    emoji: '🥦',
    origin: '🇫🇷',
    mealTypes: ['dinner'],
    tags: ['dinner', 'dinde', 'asperges', 'petits pois', 'carotte', 'herbes', 'healthy'],
    difficulty: 3,
    prepTime: 15,
    cookTime: 25,
    servings: 1,
    baseNutrition: { calories: 454, proteinGrams: 36, carbsGrams: 28, fatGrams: 22 },
    ingredients: [
      { name: 'Rôti de dinde', qty: 200, unit: 'g' },
      { name: 'Asperges', qty: 100, unit: 'g' },
      { name: 'Petits pois', qty: 80, unit: 'g' },
      { name: 'Carotte', qty: 80, unit: 'g' },
      { name: 'Herbes de Provence', qty: 3, unit: 'g' },
      { name: 'Huile', qty: 12, unit: 'ml' }
    ],
    steps: [
      'Rôtir la dinde 45 min à 180°C.',
      'Cuire les légumes vapeur.',
      'Servir ensemble avec jus de cuisson.'
    ]
  },

  {
    id: 'L338',
    name: 'Bar en Papillote Légumes',
    emoji: '🥦',
    origin: '🇫🇷',
    mealTypes: ['dinner'],
    tags: ['dinner', 'bar', 'tomate', 'courgette', 'olives', 'herbes', 'citron', 'healthy'],
    difficulty: 2,
    prepTime: 10,
    cookTime: 20,
    servings: 1,
    baseNutrition: { calories: 448, proteinGrams: 40, carbsGrams: 18, fatGrams: 24 },
    ingredients: [
      { name: 'Filet de bar', qty: 200, unit: 'g' },
      { name: 'Tomate', qty: 80, unit: 'g' },
      { name: 'Courgette', qty: 80, unit: 'g' },
      { name: 'Olives', qty: 20, unit: 'g' },
      { name: 'Herbes de Provence', qty: 3, unit: 'g' },
      { name: 'Huile d\'olive', qty: 12, unit: 'ml' },
      { name: 'Citron', qty: 15, unit: 'ml' }
    ],
    steps: [
      'Placer le bar et légumes sur du papier aluminium.',
      'Assaisonner avec herbes, olives et citron.',
      'Fermer la papillote et cuire 20 min à 180°C.'
    ]
  },

  {
    id: 'L339',
    name: 'Poulet Sauce Cacahuète Africaine',
    emoji: '🍗',
    origin: '🇸🇳',
    mealTypes: ['dinner'],
    tags: ['dinner', 'poulet', 'cacahuète', 'tomate', 'oignon', 'piment', 'ail', 'healthy'],
    difficulty: 3,
    prepTime: 15,
    cookTime: 25,
    servings: 1,
    baseNutrition: { calories: 440, proteinGrams: 44, carbsGrams: 12, fatGrams: 24 },
    ingredients: [
      { name: 'Blanc de poulet', qty: 220, unit: 'g' },
      { name: 'Beurre de cacahuète', qty: 30, unit: 'g' },
      { name: 'Tomate', qty: 100, unit: 'g' },
      { name: 'Oignon', qty: 60, unit: 'g' },
      { name: 'Piment', qty: 3, unit: 'g' },
      { name: 'Ail', qty: 5, unit: 'g' },
      { name: 'Bouillon', qty: 200, unit: 'ml' }
    ],
    steps: [
      'Faire dorer le poulet.',
      'Préparer la sauce avec cacahuète, tomate et bouillon.',
      'Mijoter 25 min.'
    ]
  },

  {
    id: 'L340',
    name: 'Gratin Dauphinois Poisson',
    emoji: '🐟',
    origin: '🇫🇷',
    mealTypes: ['dinner'],
    tags: ['dinner', 'cabillaud', 'pomme de terre', 'crème', 'fromage', 'ail', 'healthy'],
    difficulty: 3,
    prepTime: 15,
    cookTime: 25,
    servings: 1,
    baseNutrition: { calories: 446, proteinGrams: 38, carbsGrams: 24, fatGrams: 22 },
    ingredients: [
      { name: 'Cabillaud', qty: 180, unit: 'g' },
      { name: 'Pomme de terre', qty: 120, unit: 'g' },
      { name: 'Crème légère', qty: 80, unit: 'ml' },
      { name: 'Fromage râpé', qty: 30, unit: 'g' },
      { name: 'Ail', qty: 5, unit: 'g' },
      { name: 'Noix de muscade', qty: 1, unit: 'g' }
    ],
    steps: [
      'Cuire les pommes de terre à la mandoline.',
      'Disposer avec le poisson en couches.',
      'Napper de crème et fromage, gratiner 30 min à 180°C.'
    ]
  },

  {
    id: 'L341',
    name: 'Osso Bucco de Dinde Gremolata',
    emoji: '🍽️',
    origin: '🇮🇹',
    mealTypes: ['dinner'],
    tags: ['dinner', 'dinde', 'tomate', 'oignon', 'carotte', 'gremolata', 'healthy'],
    difficulty: 3,
    prepTime: 15,
    cookTime: 25,
    servings: 1,
    baseNutrition: { calories: 438, proteinGrams: 40, carbsGrams: 20, fatGrams: 22 },
    ingredients: [
      { name: 'Jarret de dinde', qty: 220, unit: 'g' },
      { name: 'Tomate', qty: 100, unit: 'g' },
      { name: 'Oignon', qty: 60, unit: 'g' },
      { name: 'Carotte', qty: 60, unit: 'g' },
      { name: 'Gremolata', qty: 10, unit: 'g' },
      { name: 'Bouillon', qty: 200, unit: 'ml' },
      { name: 'Huile', qty: 10, unit: 'ml' }
    ],
    steps: [
      'Fariner et dorer le jarret.',
      'Ajouter légumes et bouillon.',
      'Braiser 1h. Finir avec la gremolata.'
    ]
  },

  {
    id: 'L342',
    name: 'Mahi Mahi Grillé Salsa Tomate',
    emoji: '🍽️',
    origin: '🇧🇷',
    mealTypes: ['dinner'],
    tags: ['dinner', 'mahi mahi', 'tomate', 'oignon', 'coriandre', 'piment', 'citron', 'healthy'],
    difficulty: 2,
    prepTime: 10,
    cookTime: 20,
    servings: 1,
    baseNutrition: { calories: 440, proteinGrams: 42, carbsGrams: 14, fatGrams: 24 },
    ingredients: [
      { name: 'Filet de mahi mahi', qty: 220, unit: 'g' },
      { name: 'Tomate', qty: 100, unit: 'g' },
      { name: 'Oignon rouge', qty: 40, unit: 'g' },
      { name: 'Coriandre', qty: 10, unit: 'g' },
      { name: 'Piment', qty: 3, unit: 'g' },
      { name: 'Huile d\'olive', qty: 12, unit: 'ml' },
      { name: 'Citron vert', qty: 20, unit: 'ml' }
    ],
    steps: [
      'Griller le mahi mahi assaisonné 4 min de chaque côté.',
      'Préparer la salsa tomate fraîche.',
      'Servir avec la salsa.'
    ]
  },

  {
    id: 'L343',
    name: 'Grillades Poulet Citron Origan',
    emoji: '🍗',
    origin: '🇬🇷',
    mealTypes: ['dinner'],
    tags: ['dinner', 'poulet', 'citron', 'origan', 'ail', 'huile', 'courgette', 'healthy'],
    difficulty: 2,
    prepTime: 10,
    cookTime: 20,
    servings: 1,
    baseNutrition: { calories: 438, proteinGrams: 44, carbsGrams: 16, fatGrams: 22 },
    ingredients: [
      { name: 'Blanc de poulet', qty: 220, unit: 'g' },
      { name: 'Citron', qty: 30, unit: 'ml' },
      { name: 'Origan', qty: 5, unit: 'g' },
      { name: 'Ail', qty: 8, unit: 'g' },
      { name: 'Huile d\'olive', qty: 12, unit: 'ml' },
      { name: 'Courgette grillée', qty: 100, unit: 'g' }
    ],
    steps: [
      'Mariner le poulet dans citron, ail et origan.',
      'Griller 6 min de chaque côté.',
      'Servir avec courgette grillée.'
    ]
  },

  {
    id: 'L344',
    name: 'Lotte Sauce Curry Légume Vapeur',
    emoji: '🍛',
    origin: '🇫🇷',
    mealTypes: ['dinner'],
    tags: ['dinner', 'lotte', 'lait de coco', 'curry', 'brocoli', 'carotte', 'healthy'],
    difficulty: 3,
    prepTime: 15,
    cookTime: 25,
    servings: 1,
    baseNutrition: { calories: 444, proteinGrams: 38, carbsGrams: 28, fatGrams: 20 },
    ingredients: [
      { name: 'Lotte', qty: 200, unit: 'g' },
      { name: 'Lait de coco', qty: 80, unit: 'ml' },
      { name: 'Curry', qty: 8, unit: 'g' },
      { name: 'Brocoli', qty: 100, unit: 'g' },
      { name: 'Carotte', qty: 80, unit: 'g' },
      { name: 'Oignon', qty: 40, unit: 'g' }
    ],
    steps: [
      'Poêler la lotte.',
      'Préparer la sauce curry au lait de coco.',
      'Cuire les légumes vapeur. Servir ensemble.'
    ]
  },

  {
    id: 'L345',
    name: 'Poulet au Four Légumes Méditerranéens',
    emoji: '🍗',
    origin: '🇪🇸',
    mealTypes: ['dinner'],
    tags: ['dinner', 'poulet', 'aubergine', 'poivron', 'tomate', 'ail', 'herbes', 'healthy'],
    difficulty: 2,
    prepTime: 10,
    cookTime: 20,
    servings: 1,
    baseNutrition: { calories: 436, proteinGrams: 40, carbsGrams: 24, fatGrams: 20 },
    ingredients: [
      { name: 'Poulet', qty: 200, unit: 'g' },
      { name: 'Aubergine', qty: 100, unit: 'g' },
      { name: 'Poivron', qty: 80, unit: 'g' },
      { name: 'Tomate', qty: 80, unit: 'g' },
      { name: 'Ail', qty: 8, unit: 'g' },
      { name: 'Herbes', qty: 3, unit: 'g' },
      { name: 'Huile d\'olive', qty: 12, unit: 'ml' }
    ],
    steps: [
      'Disposer poulet et légumes dans un plat.',
      'Assaisonner d\'herbes, ail et huile.',
      'Cuire 40 min à 190°C.'
    ]
  },

  {
    id: 'L346',
    name: 'Lieu Noir Épinards Ail',
    emoji: '🍽️',
    origin: '🇫🇷',
    mealTypes: ['dinner'],
    tags: ['dinner', 'lieu noir', 'épinards', 'ail', 'huile', 'pomme de terre', 'healthy'],
    difficulty: 1,
    prepTime: 10,
    cookTime: 15,
    servings: 1,
    baseNutrition: { calories: 438, proteinGrams: 42, carbsGrams: 18, fatGrams: 22 },
    ingredients: [
      { name: 'Lieu noir', qty: 220, unit: 'g' },
      { name: 'Épinards', qty: 150, unit: 'g' },
      { name: 'Ail', qty: 8, unit: 'g' },
      { name: 'Huile d\'olive', qty: 12, unit: 'ml' },
      { name: 'Citron', qty: 15, unit: 'ml' },
      { name: 'Pomme de terre', qty: 80, unit: 'g' }
    ],
    steps: [
      'Cuire les pommes de terre.',
      'Poêler le lieu noir assaisonné.',
      'Faire revenir épinards et ail. Servir ensemble.'
    ]
  },

  {
    id: 'L347',
    name: 'Boulettes Dinde Sauce Tomate',
    emoji: '🍽️',
    origin: '🇮🇹',
    mealTypes: ['dinner'],
    tags: ['dinner', 'dinde', 'tomate', 'oignon', 'ail', 'basilic', 'parmesan', 'healthy'],
    difficulty: 2,
    prepTime: 10,
    cookTime: 20,
    servings: 1,
    baseNutrition: { calories: 430, proteinGrams: 44, carbsGrams: 14, fatGrams: 22 },
    ingredients: [
      { name: 'Dinde hachée', qty: 220, unit: 'g' },
      { name: 'Tomates', qty: 150, unit: 'g' },
      { name: 'Oignon', qty: 60, unit: 'g' },
      { name: 'Ail', qty: 5, unit: 'g' },
      { name: 'Basilic', qty: 10, unit: 'g' },
      { name: 'Parmesan', qty: 20, unit: 'g' },
      { name: 'Huile', qty: 10, unit: 'ml' }
    ],
    steps: [
      'Former les boulettes de dinde avec épices.',
      'Cuire dans la sauce tomate 20 min.',
      'Garnir de parmesan et basilic.'
    ]
  },

  {
    id: 'L348',
    name: 'Soupe Tom Yum Crevettes',
    emoji: '🦐',
    origin: '🇹🇭',
    mealTypes: ['dinner'],
    tags: ['dinner', 'crevettes', 'champignons', 'citronnelle', 'galanga', 'citron', 'piment', 'healthy'],
    difficulty: 2,
    prepTime: 10,
    cookTime: 20,
    servings: 1,
    baseNutrition: { calories: 438, proteinGrams: 40, carbsGrams: 20, fatGrams: 22 },
    ingredients: [
      { name: 'Crevettes', qty: 200, unit: 'g' },
      { name: 'Champignons', qty: 100, unit: 'g' },
      { name: 'Citronnelle', qty: 10, unit: 'g' },
      { name: 'Galanga', qty: 8, unit: 'g' },
      { name: 'Citron vert', qty: 20, unit: 'ml' },
      { name: 'Piment', qty: 3, unit: 'g' },
      { name: 'Tomate cerise', qty: 60, unit: 'g' },
      { name: 'Lait de coco', qty: 60, unit: 'ml' }
    ],
    steps: [
      'Préparer le bouillon avec citronnelle, galanga et piment.',
      'Ajouter crevettes et champignons.',
      'Finir avec citron vert et lait de coco.'
    ]
  },

  {
    id: 'L349',
    name: 'Roulades Poulet Épinards Fromage',
    emoji: '🍗',
    origin: '🇫🇷',
    mealTypes: ['dinner'],
    tags: ['dinner', 'poulet', 'épinards', 'chèvre', 'tomate', 'ail', 'healthy'],
    difficulty: 3,
    prepTime: 15,
    cookTime: 25,
    servings: 1,
    baseNutrition: { calories: 454, proteinGrams: 42, carbsGrams: 22, fatGrams: 22 },
    ingredients: [
      { name: 'Blanc de poulet', qty: 200, unit: 'g' },
      { name: 'Épinards cuits', qty: 80, unit: 'g' },
      { name: 'Fromage de chèvre', qty: 40, unit: 'g' },
      { name: 'Tomate', qty: 80, unit: 'g' },
      { name: 'Huile', qty: 10, unit: 'ml' },
      { name: 'Ail', qty: 5, unit: 'g' }
    ],
    steps: [
      'Aplatir les blancs de poulet.',
      'Farcir d\'épinards et fromage de chèvre.',
      'Rouler, ficeler et cuire 25 min au four à 180°C.'
    ]
  },

  {
    id: 'L350',
    name: 'Filet de Bœuf Sauce Champignons',
    emoji: '🥩',
    origin: '🇫🇷',
    mealTypes: ['dinner'],
    tags: ['dinner', 'bœuf', 'champignons', 'crème', 'oignon', 'persil', 'healthy'],
    difficulty: 3,
    prepTime: 15,
    cookTime: 25,
    servings: 1,
    baseNutrition: { calories: 444, proteinGrams: 40, carbsGrams: 26, fatGrams: 20 },
    ingredients: [
      { name: 'Filet de bœuf', qty: 180, unit: 'g' },
      { name: 'Champignons', qty: 120, unit: 'g' },
      { name: 'Crème légère', qty: 60, unit: 'ml' },
      { name: 'Oignon', qty: 40, unit: 'g' },
      { name: 'Bouillon', qty: 100, unit: 'ml' },
      { name: 'Persil', qty: 5, unit: 'g' },
      { name: 'Huile', qty: 10, unit: 'ml' }
    ],
    steps: [
      'Saisir le filet de bœuf à feu très vif.',
      'Préparer la sauce champignons à la crème.',
      'Servir avec la sauce et persil.'
    ]
  },

  // ─── INSALATE & ANTIPASTI MODERNES (R460-R469) ────────────────────────────
  {
    id: 'R460',
    name: 'Panzanella Moderne au Poulet Grillé',
    emoji: '🥗',
    origin: '🇮🇹',
    mealTypes: ['lunch', 'dinner'],
    category: 'italian',
    tags: ['salade', 'poulet', 'pain grillé', 'tomates', 'basilic', 'healthy', 'bowl'],
    difficulty: 1,
    prepTime: 15,
    cookTime: 10,
    servings: 2,
    // Vérification: P32×4 + G32×4 + L14×9 = 128+128+126 = 382 kcal ✓
    baseNutrition: { calories: 382, proteinGrams: 32, carbsGrams: 32, fatGrams: 14 },
    ingredients: [
      { name: 'Blanc de poulet', qty: 300, unit: 'g' },
      { name: 'Tomates cerises', qty: 200, unit: 'g' },
      { name: 'Concombre', qty: 150, unit: 'g' },
      { name: 'Pain de campagne', qty: 80, unit: 'g' },
      { name: 'Oignon rouge', qty: 50, unit: 'g' },
      { name: 'Basilic frais', qty: 15, unit: 'g' },
      { name: 'Huile d\'olive', qty: 20, unit: 'ml' },
      { name: 'Vinaigre balsamique', qty: 15, unit: 'ml' },
      { name: 'Ail', qty: 5, unit: 'g' }
    ],
    steps: [
      'Couper le pain en cubes et le toaster 5 min au four à 180°C jusqu\'à ce qu\'il soit doré et croustillant.',
      'Griller les blancs de poulet assaisonnés à feu vif 4-5 min par face, puis trancher en lanières.',
      'Couper les tomates cerises en deux, émincer finement le concombre et l\'oignon rouge.',
      'Préparer la vinaigrette : mélanger l\'huile d\'olive, le vinaigre balsamique et l\'ail écrasé.',
      'Assembler tous les ingrédients dans un grand bol, arroser de vinaigrette et garnir de basilic frais.'
    ]
  },
  {
    id: 'R461',
    name: 'Insalata Caprese Avocat & Thon',
    emoji: '🥑',
    origin: '🇮🇹',
    mealTypes: ['lunch', 'dinner'],
    category: 'italian',
    tags: ['caprese', 'avocat', 'thon', 'mozzarella', 'tomates', 'no-cook', 'bowl'],
    difficulty: 1,
    prepTime: 10,
    cookTime: 0,
    servings: 2,
    // Vérification: P28×4 + G16×4 + L20×9 = 112+64+180 = 356 kcal ✓
    baseNutrition: { calories: 356, proteinGrams: 28, carbsGrams: 16, fatGrams: 20 },
    ingredients: [
      { name: 'Thon en boîte au naturel', qty: 200, unit: 'g' },
      { name: 'Mozzarella di bufala', qty: 125, unit: 'g' },
      { name: 'Avocat', qty: 100, unit: 'g' },
      { name: 'Tomates', qty: 200, unit: 'g' },
      { name: 'Basilic frais', qty: 10, unit: 'g' },
      { name: 'Huile d\'olive', qty: 15, unit: 'ml' },
      { name: 'Jus de citron', qty: 10, unit: 'ml' },
      { name: 'Fleur de sel', qty: 2, unit: 'g' }
    ],
    steps: [
      'Égoutter le thon et l\'émietter grossièrement à la fourchette.',
      'Trancher la mozzarella et les tomates en rondelles épaisses, puis l\'avocat en lamelles.',
      'Disposer en cercle dans le bol en alternant tomates, mozzarella et avocat.',
      'Répartir le thon émietté au centre et parsemer de basilic frais ciselé.',
      'Arroser d\'huile d\'olive et de jus de citron, assaisonner de fleur de sel et poivre.'
    ]
  },
  {
    id: 'R462',
    name: 'Carpaccio de Bœuf Roquette & Parmesan',
    emoji: '🥩',
    origin: '🇮🇹',
    mealTypes: ['lunch', 'dinner'],
    category: 'italian',
    tags: ['carpaccio', 'bœuf', 'roquette', 'parmesan', 'no-cook', 'antipasto', 'léger'],
    difficulty: 1,
    prepTime: 10,
    cookTime: 0,
    servings: 2,
    // Vérification: P26×4 + G8×4 + L16×9 = 104+32+144 = 280 kcal ✓
    baseNutrition: { calories: 280, proteinGrams: 26, carbsGrams: 8, fatGrams: 16 },
    ingredients: [
      { name: 'Bœuf carpaccio (tranché fin)', qty: 250, unit: 'g' },
      { name: 'Roquette', qty: 60, unit: 'g' },
      { name: 'Parmesan', qty: 30, unit: 'g' },
      { name: 'Câpres', qty: 20, unit: 'g' },
      { name: 'Huile d\'olive', qty: 20, unit: 'ml' },
      { name: 'Jus de citron', qty: 15, unit: 'ml' },
      { name: 'Poivre noir', qty: 2, unit: 'g' }
    ],
    steps: [
      'Sortir le carpaccio du réfrigérateur 5 min avant de servir et disposer les tranches à plat sur les assiettes.',
      'Répartir la roquette fraîche au centre de chaque assiette.',
      'Parsemer de copeaux de parmesan obtenus avec un économe et de câpres égouttées.',
      'Arroser généreusement d\'huile d\'olive extra-vierge et de jus de citron frais.',
      'Terminer avec un généreux tour de moulin à poivre et servir immédiatement.'
    ]
  },
  {
    id: 'R463',
    name: 'Bruschetta Ricotta & Tomates Cerises',
    emoji: '🍅',
    origin: '🇮🇹',
    mealTypes: ['lunch', 'snack'],
    category: 'italian',
    tags: ['bruschetta', 'ricotta', 'tomates cerises', 'basilic', 'antipasto', 'végétarien', 'lunch box'],
    difficulty: 1,
    prepTime: 10,
    cookTime: 5,
    servings: 2,
    // Vérification: P22×4 + G36×4 + L10×9 = 88+144+90 = 322 kcal ✓
    baseNutrition: { calories: 322, proteinGrams: 22, carbsGrams: 36, fatGrams: 10 },
    ingredients: [
      { name: 'Pain ciabatta', qty: 120, unit: 'g' },
      { name: 'Ricotta', qty: 150, unit: 'g' },
      { name: 'Tomates cerises', qty: 200, unit: 'g' },
      { name: 'Basilic frais', qty: 10, unit: 'g' },
      { name: 'Ail', qty: 5, unit: 'g' },
      { name: 'Huile d\'olive', qty: 10, unit: 'ml' },
      { name: 'Fleur de sel', qty: 2, unit: 'g' }
    ],
    steps: [
      'Couper la ciabatta en tranches épaisses et faire griller au four ou à la poêle jusqu\'à dorure.',
      'Frotter légèrement chaque tranche de pain grillé avec la gousse d\'ail coupée en deux.',
      'Mélanger la ricotta avec une pincée de sel, du poivre et un filet d\'huile d\'olive.',
      'Couper les tomates cerises en deux et les assaisonner de fleur de sel et basilic ciselé.',
      'Tartiner chaque bruschetta de ricotta assaisonnée et garnir de tomates cerises marinées.'
    ]
  },
  {
    id: 'R464',
    name: 'Insalata di Polpo e Patate',
    emoji: '🐙',
    origin: '🇮🇹',
    mealTypes: ['lunch', 'dinner'],
    category: 'italian',
    tags: ['poulpe', 'pommes de terre', 'persil', 'citron', 'salade', 'méditerranéen', 'protéiné'],
    difficulty: 2,
    prepTime: 15,
    cookTime: 25,
    servings: 2,
    // Vérification: P30×4 + G28×4 + L12×9 = 120+112+108 = 340 kcal ✓
    baseNutrition: { calories: 340, proteinGrams: 30, carbsGrams: 28, fatGrams: 12 },
    ingredients: [
      { name: 'Poulpe cuit', qty: 300, unit: 'g' },
      { name: 'Pommes de terre', qty: 200, unit: 'g' },
      { name: 'Céleri', qty: 80, unit: 'g' },
      { name: 'Olives noires', qty: 30, unit: 'g' },
      { name: 'Persil frais', qty: 15, unit: 'g' },
      { name: 'Huile d\'olive', qty: 20, unit: 'ml' },
      { name: 'Jus de citron', qty: 20, unit: 'ml' },
      { name: 'Ail', qty: 5, unit: 'g' }
    ],
    steps: [
      'Cuire les pommes de terre à l\'eau bouillante salée 20 min, égoutter et laisser tiédir.',
      'Couper le poulpe cuit en tronçons de 2 cm et les pommes de terre en morceaux.',
      'Émincer finement le céleri et hacher le persil frais.',
      'Préparer la vinaigrette avec l\'huile d\'olive, le jus de citron et l\'ail écrasé.',
      'Mélanger poulpe, pommes de terre, céleri et olives, arroser de vinaigrette et garnir de persil.'
    ]
  },
  {
    id: 'R465',
    name: 'Antipasto Bowl Charcuterie Légère',
    emoji: '🍖',
    origin: '🇮🇹',
    mealTypes: ['lunch', 'dinner'],
    category: 'italian',
    tags: ['antipasto', 'charcuterie', 'bresaola', 'légumes grillés', 'bowl', 'no-cook', 'protéiné'],
    difficulty: 1,
    prepTime: 12,
    cookTime: 0,
    servings: 2,
    // Vérification: P30×4 + G20×4 + L18×9 = 120+80+162 = 362 kcal ✓
    baseNutrition: { calories: 362, proteinGrams: 30, carbsGrams: 20, fatGrams: 18 },
    ingredients: [
      { name: 'Bresaola', qty: 120, unit: 'g' },
      { name: 'Prosciutto crudo', qty: 60, unit: 'g' },
      { name: 'Artichauts marinés', qty: 100, unit: 'g' },
      { name: 'Poivrons grillés en bocal', qty: 100, unit: 'g' },
      { name: 'Olives vertes', qty: 40, unit: 'g' },
      { name: 'Roquette', qty: 40, unit: 'g' },
      { name: 'Parmesan', qty: 20, unit: 'g' },
      { name: 'Huile d\'olive', qty: 15, unit: 'ml' }
    ],
    steps: [
      'Disposer la bresaola et le prosciutto en éventail dans deux bols larges.',
      'Ajouter les artichauts marinés égouttés, les poivrons grillés en lanières et les olives.',
      'Placer un bouquet de roquette au centre de chaque bol.',
      'Parsemer de copeaux de parmesan réalisés à l\'économe.',
      'Arroser d\'un filet d\'huile d\'olive extra-vierge et servir avec du pain grillé si désiré.'
    ]
  },
  {
    id: 'R466',
    name: 'Insalata di Farro con Verdure',
    emoji: '🌾',
    origin: '🇮🇹',
    mealTypes: ['lunch', 'dinner'],
    category: 'italian',
    tags: ['farro', 'céréales', 'légumes', 'végétarien', 'bowl', 'lunch box', 'healthy'],
    difficulty: 1,
    prepTime: 10,
    cookTime: 25,
    servings: 2,
    // Vérification: P20×4 + G50×4 + L11×9 = 80+200+99 = 379 kcal ✓
    baseNutrition: { calories: 379, proteinGrams: 20, carbsGrams: 50, fatGrams: 11 },
    ingredients: [
      { name: 'Farro (épeautre)', qty: 160, unit: 'g' },
      { name: 'Courgette', qty: 150, unit: 'g' },
      { name: 'Tomates séchées', qty: 40, unit: 'g' },
      { name: 'Feta', qty: 60, unit: 'g' },
      { name: 'Épinards frais', qty: 60, unit: 'g' },
      { name: 'Pignons de pin', qty: 15, unit: 'g' },
      { name: 'Huile d\'olive', qty: 15, unit: 'ml' },
      { name: 'Jus de citron', qty: 10, unit: 'ml' },
      { name: 'Herbes de Provence', qty: 3, unit: 'g' }
    ],
    steps: [
      'Cuire le farro dans l\'eau bouillante salée selon les instructions (env. 25 min), égoutter et refroidir.',
      'Couper la courgette en petits dés et la faire revenir 3 min à la poêle avec un filet d\'huile d\'olive.',
      'Torréfier les pignons de pin à sec 2 min dans une poêle jusqu\'à dorure légère.',
      'Mélanger le farro refroidi avec la courgette, les tomates séchées émincées et les épinards.',
      'Émietter la feta, ajouter les pignons, arroser d\'huile et citron, assaisonner aux herbes de Provence.'
    ]
  },
  {
    id: 'R467',
    name: 'Caponata Sicilienne Power Bowl',
    emoji: '🍆',
    origin: '🇮🇹',
    mealTypes: ['lunch', 'dinner'],
    category: 'italian',
    tags: ['caponata', 'aubergine', 'sicilien', 'végétarien', 'bowl', 'légumes', 'healthy'],
    difficulty: 2,
    prepTime: 15,
    cookTime: 20,
    servings: 2,
    // Vérification: P18×4 + G40×4 + L13×9 = 72+160+117 = 349 kcal ✓
    baseNutrition: { calories: 349, proteinGrams: 18, carbsGrams: 40, fatGrams: 13 },
    ingredients: [
      { name: 'Aubergine', qty: 300, unit: 'g' },
      { name: 'Tomates cerises', qty: 200, unit: 'g' },
      { name: 'Céleri', qty: 80, unit: 'g' },
      { name: 'Olives vertes', qty: 40, unit: 'g' },
      { name: 'Câpres', qty: 20, unit: 'g' },
      { name: 'Pois chiches cuits', qty: 120, unit: 'g' },
      { name: 'Vinaigre de vin rouge', qty: 20, unit: 'ml' },
      { name: 'Huile d\'olive', qty: 20, unit: 'ml' },
      { name: 'Basilic frais', qty: 10, unit: 'g' }
    ],
    steps: [
      'Couper l\'aubergine en cubes de 2 cm, saler et laisser dégorger 10 min, puis éponger.',
      'Faire revenir l\'aubergine et le céleri émincé dans l\'huile d\'olive à feu vif 8-10 min.',
      'Ajouter les tomates cerises coupées en deux, les olives, les câpres et les pois chiches.',
      'Verser le vinaigre de vin rouge, mélanger et cuire encore 5 min à feu moyen.',
      'Servir tiède ou froid dans des bols, garni de basilic frais ciselé.'
    ]
  },
  {
    id: 'R468',
    name: 'Insalata Nizzarda Italiana',
    emoji: '🐟',
    origin: '🇮🇹',
    mealTypes: ['lunch', 'dinner'],
    category: 'italian',
    tags: ['niçoise', 'thon', 'œufs', 'haricots verts', 'tomates', 'salade', 'protéiné'],
    difficulty: 1,
    prepTime: 15,
    cookTime: 10,
    servings: 2,
    // Vérification: P32×4 + G22×4 + L18×9 = 128+88+162 = 378 kcal ✓
    baseNutrition: { calories: 378, proteinGrams: 32, carbsGrams: 22, fatGrams: 18 },
    ingredients: [
      { name: 'Thon en boîte au naturel', qty: 200, unit: 'g' },
      { name: 'Œufs', qty: 2, unit: 'pce' },
      { name: 'Haricots verts', qty: 150, unit: 'g' },
      { name: 'Tomates', qty: 150, unit: 'g' },
      { name: 'Olives noires', qty: 30, unit: 'g' },
      { name: 'Anchois à l\'huile', qty: 20, unit: 'g' },
      { name: 'Laitue', qty: 60, unit: 'g' },
      { name: 'Huile d\'olive', qty: 20, unit: 'ml' },
      { name: 'Vinaigre de vin', qty: 10, unit: 'ml' }
    ],
    steps: [
      'Cuire les haricots verts à l\'eau bouillante salée 5-6 min, ils doivent rester croquants, égoutter et refroidir.',
      'Faire cuire les œufs durs 9 min dans l\'eau bouillante, puis les refroidir et les écaler.',
      'Émincer les tomates en quartiers, couper les œufs en deux et émietter le thon.',
      'Dresser la laitue dans les assiettes puis disposer harmonieusement tous les ingrédients.',
      'Arroser de vinaigrette à l\'huile d\'olive, poser les anchois sur le dessus et servir.'
    ]
  },
  {
    id: 'R469',
    name: 'Carpaccio de Saumon Câpres & Citron',
    emoji: '🐟',
    origin: '🇮🇹',
    mealTypes: ['lunch', 'dinner'],
    category: 'italian',
    tags: ['carpaccio', 'saumon', 'câpres', 'citron', 'aneth', 'no-cook', 'léger'],
    difficulty: 1,
    prepTime: 10,
    cookTime: 0,
    servings: 2,
    // Vérification: P26×4 + G6×4 + L17×9 = 104+24+153 = 281 kcal ✓
    baseNutrition: { calories: 281, proteinGrams: 26, carbsGrams: 6, fatGrams: 17 },
    ingredients: [
      { name: 'Saumon frais (tranché fin)', qty: 280, unit: 'g' },
      { name: 'Câpres', qty: 25, unit: 'g' },
      { name: 'Citron', qty: 1, unit: 'pce' },
      { name: 'Aneth frais', qty: 10, unit: 'g' },
      { name: 'Huile d\'olive', qty: 20, unit: 'ml' },
      { name: 'Oignon rouge', qty: 30, unit: 'g' },
      { name: 'Fleur de sel', qty: 2, unit: 'g' }
    ],
    steps: [
      'Disposer les tranches de saumon bien à plat en une seule couche sur deux grandes assiettes froides.',
      'Émincer l\'oignon rouge en très fines rondelles et les répartir sur le saumon.',
      'Parsemer de câpres égouttées et de brins d\'aneth frais.',
      'Arroser d\'un filet d\'huile d\'olive extra-vierge et du jus de citron fraîchement pressé.',
      'Assaisonner de fleur de sel et poivre noir, laisser mariner 2 min et servir immédiatement.'
    ]
  },

  // ─── ITALIAN COLAZIONE & SNACK R480-R489 ──────────────────────────────────

  {
    id: 'R480',
    name: 'Colazione Proteica Italiana',
    emoji: '🥣',
    origin: '🇮🇹',
    mealTypes: ['breakfast', 'snack'],
    category: 'italian',
    tags: ['ricotta', 'miel', 'noisettes', 'protéiné', 'healthy', 'italien'],
    difficulty: 1,
    prepTime: 5,
    cookTime: 0,
    servings: 2,
    // Vérification: 22×4 + 18×4 + 12×9 = 88 + 72 + 108 = 268 ≈ 270 kcal ✓
    baseNutrition: { calories: 270, proteinGrams: 22, carbsGrams: 18, fatGrams: 12 },
    ingredients: [
      { name: 'Ricotta fraîche', qty: 250, unit: 'g' },
      { name: "Miel d'acacia", qty: 20, unit: 'g' },
      { name: 'Noisettes torréfiées', qty: 30, unit: 'g' },
      { name: 'Zeste de citron', qty: 1, unit: 'pce' },
      { name: 'Cannelle', qty: 1, unit: 'pincée' }
    ],
    steps: [
      "Fouetter la ricotta avec le zeste de citron jusqu'à obtenir une texture crémeuse.",
      'Répartir la ricotta dans deux bols.',
      'Concasser grossièrement les noisettes torréfiées.',
      'Napper de miel, parsemer de noisettes et saupoudrer de cannelle.'
    ]
  },

  {
    id: 'R481',
    name: 'Cornetto Intégral Ricotta & Figue',
    emoji: '🥐',
    origin: '🇮🇹',
    mealTypes: ['breakfast', 'snack'],
    category: 'italian',
    tags: ['cornetto', 'ricotta', 'figue', 'intégral', 'boulangerie', 'italien'],
    difficulty: 2,
    prepTime: 15,
    cookTime: 12,
    servings: 2,
    // Vérification: 18×4 + 42×4 + 10×9 = 72 + 168 + 90 = 330 kcal ✓
    baseNutrition: { calories: 330, proteinGrams: 18, carbsGrams: 42, fatGrams: 10 },
    ingredients: [
      { name: 'Pâte à croissant intégrale', qty: 160, unit: 'g' },
      { name: 'Ricotta fraîche', qty: 100, unit: 'g' },
      { name: 'Figues fraîches', qty: 80, unit: 'g' },
      { name: 'Miel', qty: 15, unit: 'g' },
      { name: 'Amandes effilées', qty: 10, unit: 'g' }
    ],
    steps: [
      'Préchauffer le four à 190°C.',
      'Découper la pâte en triangles et tartiner de ricotta mélangée au miel.',
      'Déposer des tranches de figue sur chaque triangle.',
      "Rouler les cornetti et enfourner 12 min jusqu'à dorure.",
      "Parsemer d'amandes effilées à la sortie du four."
    ]
  },

  {
    id: 'R482',
    name: 'Granola Italiano Pistache & Orange',
    emoji: '🟢',
    origin: '🇮🇹',
    mealTypes: ['breakfast', 'snack'],
    category: 'italian',
    tags: ['granola', 'pistache', 'orange', 'flocons avoine', 'croquant', 'italien'],
    difficulty: 1,
    prepTime: 5,
    cookTime: 20,
    servings: 2,
    // Vérification: 16×4 + 38×4 + 14×9 = 64 + 152 + 126 = 342 ≈ 340 kcal ✓
    baseNutrition: { calories: 340, proteinGrams: 16, carbsGrams: 38, fatGrams: 14 },
    ingredients: [
      { name: "Flocons d'avoine", qty: 120, unit: 'g' },
      { name: 'Pistaches non salées', qty: 40, unit: 'g' },
      { name: "Zeste d'orange bio", qty: 1, unit: 'pce' },
      { name: "Jus d'orange", qty: 30, unit: 'ml' },
      { name: "Huile d'olive", qty: 15, unit: 'ml' },
      { name: 'Miel', qty: 20, unit: 'g' }
    ],
    steps: [
      'Préchauffer le four à 170°C.',
      "Mélanger flocons, pistaches concassées, zeste et jus d'orange, huile et miel.",
      'Étaler sur plaque et cuire 20 min en remuant à mi-cuisson.',
      'Laisser refroidir complètement pour obtenir des clusters croquants.',
      'Servir avec du yaourt grec ou du lait végétal.'
    ]
  },

  {
    id: 'R483',
    name: 'Smoothie Bowl Agrumi Italiens',
    emoji: '🍊',
    origin: '🇮🇹',
    mealTypes: ['breakfast', 'snack'],
    category: 'italian',
    tags: ['smoothie bowl', 'agrumes', 'sicile', 'vitamine C', 'frais', 'italien'],
    difficulty: 1,
    prepTime: 10,
    cookTime: 0,
    servings: 2,
    // Vérification: 15×4 + 40×4 + 6×9 = 60 + 160 + 54 = 274 ≈ 275 kcal ✓
    baseNutrition: { calories: 275, proteinGrams: 15, carbsGrams: 40, fatGrams: 6 },
    ingredients: [
      { name: 'Orange sanguine', qty: 200, unit: 'g' },
      { name: 'Citron de Sicile', qty: 1, unit: 'pce' },
      { name: 'Banane congelée', qty: 100, unit: 'g' },
      { name: 'Yaourt grec 0%', qty: 150, unit: 'g' },
      { name: 'Granola', qty: 30, unit: 'g' },
      { name: 'Pistaches', qty: 10, unit: 'g' },
      { name: 'Feuilles de menthe', qty: 5, unit: 'g' }
    ],
    steps: [
      "Mixer la banane congelée, l'orange sanguine pelée et le jus de citron.",
      "Ajouter le yaourt grec et mixer jusqu'à consistance épaisse et lisse.",
      'Verser dans deux bols.',
      'Garnir de granola, pistaches concassées et feuilles de menthe.'
    ]
  },

  {
    id: 'R484',
    name: 'Crostini Avocat & Anchois',
    emoji: '🥑',
    origin: '🇮🇹',
    mealTypes: ['breakfast', 'snack', 'lunch'],
    category: 'italian',
    tags: ['crostini', 'avocat', 'anchois', 'oméga-3', 'apéro', 'italien'],
    difficulty: 1,
    prepTime: 10,
    cookTime: 5,
    servings: 2,
    // Vérification: 16×4 + 22×4 + 15×9 = 64 + 88 + 135 = 287 ≈ 290 kcal ✓
    baseNutrition: { calories: 290, proteinGrams: 16, carbsGrams: 22, fatGrams: 15 },
    ingredients: [
      { name: 'Pain ciabatta', qty: 120, unit: 'g' },
      { name: 'Avocat mûr', qty: 100, unit: 'g' },
      { name: "Filets d'anchois", qty: 30, unit: 'g' },
      { name: 'Tomates cerises', qty: 60, unit: 'g' },
      { name: 'Jus de citron', qty: 10, unit: 'ml' },
      { name: 'Basilic frais', qty: 5, unit: 'g' },
      { name: 'Poivre noir', qty: 1, unit: 'pincée' }
    ],
    steps: [
      'Toaster les tranches de ciabatta 3-4 min au grill.',
      "Écraser l'avocat avec le jus de citron et le poivre.",
      "Tartiner les crostini d'avocat écrasé.",
      "Déposer un filet d'anchois et une demi-tomate cerise sur chaque crostino.",
      'Décorer de feuilles de basilic frais.'
    ]
  },

  {
    id: 'R485',
    name: 'Tartine Ricotta Tomates Séchées Basilic',
    emoji: '🍅',
    origin: '🇮🇹',
    mealTypes: ['breakfast', 'snack', 'lunch'],
    category: 'italian',
    tags: ['tartine', 'ricotta', 'tomates séchées', 'basilic', 'méditerranéen', 'italien'],
    difficulty: 1,
    prepTime: 8,
    cookTime: 3,
    servings: 2,
    // Vérification: 18×4 + 26×4 + 10×9 = 72 + 104 + 90 = 266 ≈ 265 kcal ✓
    baseNutrition: { calories: 265, proteinGrams: 18, carbsGrams: 26, fatGrams: 10 },
    ingredients: [
      { name: 'Pain de campagne', qty: 120, unit: 'g' },
      { name: 'Ricotta fraîche', qty: 150, unit: 'g' },
      { name: "Tomates séchées à l'huile", qty: 40, unit: 'g' },
      { name: 'Basilic frais', qty: 10, unit: 'g' },
      { name: 'Ail', qty: 1, unit: 'gousse' },
      { name: "Huile d'olive extra vierge", qty: 10, unit: 'ml' }
    ],
    steps: [
      "Toaster les tranches de pain et les frotter avec une gousse d'ail.",
      "Mélanger la ricotta avec un filet d'huile d'olive et du poivre.",
      'Tartiner généreusement de ricotta assaisonnée.',
      'Disposer les tomates séchées égouttées et les feuilles de basilic frais.'
    ]
  },

  {
    id: 'R486',
    name: 'Energy Balls Amaretti & Cacao',
    emoji: '🍫',
    origin: '🇮🇹',
    mealTypes: ['snack'],
    category: 'italian',
    tags: ['energy balls', 'amaretti', 'cacao', 'amande', 'sans cuisson', 'italien'],
    difficulty: 1,
    prepTime: 15,
    cookTime: 0,
    servings: 2,
    // Vérification: 15×4 + 28×4 + 13×9 = 60 + 112 + 117 = 289 ≈ 290 kcal ✓
    baseNutrition: { calories: 290, proteinGrams: 15, carbsGrams: 28, fatGrams: 13 },
    ingredients: [
      { name: 'Biscuits amaretti', qty: 60, unit: 'g' },
      { name: 'Cacao en poudre non sucré', qty: 15, unit: 'g' },
      { name: "Beurre d'amande", qty: 40, unit: 'g' },
      { name: 'Protéine vanille en poudre', qty: 20, unit: 'g' },
      { name: 'Miel', qty: 15, unit: 'g' },
      { name: "Extrait d'amande", qty: 2, unit: 'ml' }
    ],
    steps: [
      'Émietter finement les amaretti.',
      "Mélanger tous les ingrédients jusqu'à obtenir une pâte malléable.",
      "Si la pâte est trop sèche, ajouter quelques gouttes d'eau.",
      'Former 8 boules de taille égale et réfrigérer 30 min avant de servir.'
    ]
  },

  {
    id: 'R487',
    name: 'Tiramisu Protéiné Express',
    emoji: '☕',
    origin: '🇮🇹',
    mealTypes: ['snack', 'breakfast'],
    category: 'italian',
    tags: ['tiramisu', 'mascarpone', 'café', 'protéiné', 'express', 'italien'],
    difficulty: 1,
    prepTime: 10,
    cookTime: 0,
    servings: 2,
    // Vérification: 20×4 + 22×4 + 11×9 = 80 + 88 + 99 = 267 ≈ 270 kcal ✓
    baseNutrition: { calories: 270, proteinGrams: 20, carbsGrams: 22, fatGrams: 11 },
    ingredients: [
      { name: 'Ricotta fraîche', qty: 150, unit: 'g' },
      { name: 'Mascarpone', qty: 50, unit: 'g' },
      { name: 'Protéine vanille en poudre', qty: 20, unit: 'g' },
      { name: 'Café espresso froid', qty: 60, unit: 'ml' },
      { name: 'Biscuits à la cuillère', qty: 40, unit: 'g' },
      { name: 'Cacao en poudre', qty: 5, unit: 'g' }
    ],
    steps: [
      "Fouetter ricotta, mascarpone et protéine en poudre jusqu'à texture lisse.",
      'Tremper rapidement les biscuits dans le café froid.',
      'Alterner couches de biscuits imbibés et crème dans deux verres.',
      'Saupoudrer de cacao tamisé et réfrigérer 5 min avant de servir.'
    ]
  },

  {
    id: 'R488',
    name: 'Frittelle di Avena',
    emoji: '🥞',
    origin: '🇮🇹',
    mealTypes: ['breakfast'],
    category: 'italian',
    tags: ['pancakes', 'avoine', 'frittelle', 'vanille', 'léger', 'italien'],
    difficulty: 1,
    prepTime: 5,
    cookTime: 10,
    servings: 2,
    // Vérification: 22×4 + 30×4 + 8×9 = 88 + 120 + 72 = 280 kcal ✓
    baseNutrition: { calories: 280, proteinGrams: 22, carbsGrams: 30, fatGrams: 8 },
    ingredients: [
      { name: "Flocons d'avoine mixés", qty: 80, unit: 'g' },
      { name: 'Oeufs', qty: 2, unit: 'pce' },
      { name: 'Ricotta', qty: 80, unit: 'g' },
      { name: 'Lait écrémé', qty: 60, unit: 'ml' },
      { name: 'Miel', qty: 10, unit: 'g' },
      { name: 'Extrait de vanille', qty: 2, unit: 'ml' },
      { name: 'Levure chimique', qty: 3, unit: 'g' }
    ],
    steps: [
      "Mixer les flocons d'avoine en farine fine.",
      "Mélanger tous les ingrédients jusqu'à pâte homogène sans grumeaux.",
      'Chauffer une poêle antiadhésive légèrement huilée à feu moyen.',
      'Verser des petites louches de pâte et cuire 2 min par côté.',
      'Servir avec miel et fruits frais de saison.'
    ]
  },

  {
    id: 'R489',
    name: 'Panna Cotta Légère Protéinée aux Fruits Rouges',
    emoji: '🍮',
    origin: '🇮🇹',
    mealTypes: ['snack', 'breakfast'],
    category: 'italian',
    tags: ['panna cotta', 'fruits rouges', 'protéiné', 'léger', 'dessert sain', 'italien'],
    difficulty: 2,
    prepTime: 10,
    cookTime: 5,
    servings: 2,
    // Vérification: 18×4 + 20×4 + 7×9 = 72 + 80 + 63 = 215 kcal ✓
    baseNutrition: { calories: 215, proteinGrams: 18, carbsGrams: 20, fatGrams: 7 },
    ingredients: [
      { name: 'Lait de coco léger', qty: 200, unit: 'ml' },
      { name: 'Protéine vanille en poudre', qty: 30, unit: 'g' },
      { name: 'Gélatine', qty: 4, unit: 'g' },
      { name: 'Miel', qty: 10, unit: 'g' },
      { name: 'Fruits rouges mélangés', qty: 100, unit: 'g' },
      { name: 'Yaourt grec 0%', qty: 100, unit: 'g' }
    ],
    steps: [
      "Faire tremper la gélatine dans l'eau froide 5 min.",
      'Chauffer le lait de coco à feu doux avec le miel sans faire bouillir.',
      'Incorporer la gélatine essorée et la protéine en poudre hors du feu.',
      'Mélanger avec le yaourt grec pour une texture plus légère.',
      'Verser dans des verrines et réfrigérer au minimum 2h.',
      'Servir avec les fruits rouges frais et quelques feuilles de menthe.'
    ]
  }
,

  // ─── RECETTES ITALIENNES R470-R479 : ZUPPE & PIATTI UNICI ────────────────────

    {
      id: 'R470',
      name: 'Minestrone di Verdure Power',
      emoji: '🥣',
      origin: '🇮🇹',
      mealTypes: ['lunch', 'dinner'],
      category: 'italian',
      tags: ['soupe', 'végétarien', 'haute-proteine', 'legumes', 'healthy', 'batch-cooking', 'anti-inflammatoire'],
      difficulty: 1,
      prepTime: 10,
      cookTime: 25,
      servings: 2,
      // P×4 + G×4 + L×9 = 22×4 + 42×4 + 10×9 = 88 + 168 + 90 = 346 kcal ✓
      baseNutrition: { calories: 346, proteinGrams: 22, carbsGrams: 42, fatGrams: 10 },
      ingredients: [
        { name: 'Haricots blancs cuits', qty: 200, unit: 'g' },
        { name: 'Courgette', qty: 150, unit: 'g' },
        { name: 'Carotte', qty: 100, unit: 'g' },
        { name: 'Céleri', qty: 80, unit: 'g' },
        { name: 'Tomates pelées en boîte', qty: 200, unit: 'g' },
        { name: 'Épinards frais', qty: 80, unit: 'g' },
        { name: 'Bouillon de légumes', qty: 600, unit: 'ml' },
        { name: "Huile d'olive extra-vierge", qty: 15, unit: 'ml' },
        { name: 'Ail', qty: 2, unit: 'pce' },
        { name: 'Parmesan râpé', qty: 20, unit: 'g' },
        { name: 'Basilic frais', qty: 10, unit: 'g' }
      ],
      steps: [
        "Chauffer l'huile d'olive dans une grande casserole. Faire revenir l'ail émincé, la carotte et le céleri en dés 3 minutes à feu moyen.",
        'Ajouter la courgette en dés, les tomates concassées et le bouillon. Porter à ébullition, puis réduire et mijoter 15 minutes.',
        'Incorporer les haricots blancs et les épinards, cuire encore 5 minutes. Assaisonner de sel, poivre et basilic frais.',
        "Servir dans des bols profonds, parsemer de parmesan râpé et d'un filet d'huile d'olive extra-vierge."
      ]
    },

    {
      id: 'R471',
      name: 'Ribollita Toscane Légère',
      emoji: '🍲',
      origin: '🇮🇹',
      mealTypes: ['lunch', 'dinner'],
      category: 'italian',
      tags: ['soupe', 'toscan', 'légumes', 'chou-noir', 'haricots', 'comfort-food', 'batch-cooking'],
      difficulty: 1,
      prepTime: 10,
      cookTime: 25,
      servings: 2,
      // P×4 + G×4 + L×9 = 18×4 + 45×4 + 9×9 = 72 + 180 + 81 = 333 kcal ✓
      baseNutrition: { calories: 333, proteinGrams: 18, carbsGrams: 45, fatGrams: 9 },
      ingredients: [
        { name: 'Chou noir (cavolo nero)', qty: 150, unit: 'g' },
        { name: 'Haricots cannellini cuits', qty: 180, unit: 'g' },
        { name: 'Pain de campagne rassis', qty: 60, unit: 'g' },
        { name: 'Tomates pelées en boîte', qty: 150, unit: 'g' },
        { name: 'Oignon', qty: 80, unit: 'g' },
        { name: 'Carotte', qty: 80, unit: 'g' },
        { name: 'Bouillon de légumes', qty: 500, unit: 'ml' },
        { name: "Huile d'olive extra-vierge", qty: 15, unit: 'ml' },
        { name: 'Romarin frais', qty: 5, unit: 'g' },
        { name: 'Ail', qty: 2, unit: 'pce' }
      ],
      steps: [
        "Dans une casserole, faire revenir l'oignon, la carotte et l'ail hachés dans l'huile d'olive 4 minutes jusqu'à légère coloration.",
        'Ajouter le chou noir émincé, les tomates et le bouillon. Mijoter 15 minutes à feu moyen-doux.',
        'Incorporer les haricots cannellini et le pain rassis émietté. Cuire encore 5 minutes en remuant pour que le pain épaississe la soupe.',
        "Terminer avec le romarin ciselé, un filet d'huile d'olive à cru et du poivre noir fraîchement moulu."
      ]
    },

    {
      id: 'R472',
      name: 'Zuppa di Lenticchie al Rosmarino',
      emoji: '🫘',
      origin: '🇮🇹',
      mealTypes: ['lunch', 'dinner'],
      category: 'italian',
      tags: ['soupe', 'lentilles', 'romarin', 'protéines-végétales', 'fer', 'anti-inflammatoire', 'batch-cooking'],
      difficulty: 1,
      prepTime: 5,
      cookTime: 30,
      servings: 2,
      // P×4 + G×4 + L×9 = 20×4 + 44×4 + 8×9 = 80 + 176 + 72 = 328 kcal ✓
      baseNutrition: { calories: 328, proteinGrams: 20, carbsGrams: 44, fatGrams: 8 },
      ingredients: [
        { name: 'Lentilles vertes sèches', qty: 160, unit: 'g' },
        { name: 'Tomates pelées en boîte', qty: 200, unit: 'g' },
        { name: 'Oignon', qty: 80, unit: 'g' },
        { name: 'Ail', qty: 3, unit: 'pce' },
        { name: 'Bouillon de légumes', qty: 700, unit: 'ml' },
        { name: "Huile d'olive extra-vierge", qty: 15, unit: 'ml' },
        { name: 'Romarin frais', qty: 8, unit: 'g' },
        { name: 'Cumin moulu', qty: 2, unit: 'g' },
        { name: 'Jus de citron', qty: 15, unit: 'ml' }
      ],
      steps: [
        "Faire revenir l'oignon et l'ail émincés dans l'huile d'olive 3 minutes. Ajouter le cumin et une branche de romarin.",
        'Incorporer les lentilles rincées, les tomates concassées et le bouillon. Porter à ébullition.',
        "Réduire le feu et mijoter 25 minutes jusqu'à ce que les lentilles soient tendres. Retirer le romarin.",
        "Mixer partiellement pour une texture mi-lisse mi-rustique. Finir avec le jus de citron, le romarin ciselé et un filet d'huile d'olive."
      ]
    },

    {
      id: 'R473',
      name: 'Acquacotta con Uovo Pochée',
      emoji: '🍳',
      origin: '🇮🇹',
      mealTypes: ['lunch', 'dinner'],
      category: 'italian',
      tags: ['soupe', 'oeuf-poche', 'maremme', 'légumes', 'rustique', 'protéines', 'anti-gaspillage'],
      difficulty: 1,
      prepTime: 10,
      cookTime: 20,
      servings: 2,
      // P×4 + G×4 + L×9 = 16×4 + 28×4 + 12×9 = 64 + 112 + 108 = 284 kcal ✓
      baseNutrition: { calories: 284, proteinGrams: 16, carbsGrams: 28, fatGrams: 12 },
      ingredients: [
        { name: 'Tomates fraîches', qty: 200, unit: 'g' },
        { name: 'Oignon', qty: 100, unit: 'g' },
        { name: 'Céleri', qty: 80, unit: 'g' },
        { name: 'Poivron rouge', qty: 100, unit: 'g' },
        { name: 'Oeufs', qty: 2, unit: 'pce' },
        { name: 'Pain de campagne grillé', qty: 50, unit: 'g' },
        { name: 'Bouillon de légumes', qty: 400, unit: 'ml' },
        { name: "Huile d'olive extra-vierge", qty: 15, unit: 'ml' },
        { name: 'Sauge fraîche', qty: 5, unit: 'g' },
        { name: 'Pecorino râpé', qty: 15, unit: 'g' }
      ],
      steps: [
        "Faire revenir l'oignon, le céleri et le poivron en dés dans l'huile d'olive 5 minutes. Ajouter les tomates coupées et la sauge.",
        'Verser le bouillon, porter à ébullition puis mijoter 10 minutes. Assaisonner de sel et poivre.',
        "Créer deux creux dans la soupe frémissante et y casser délicatement les œufs. Pocher 3-4 minutes jusqu'à blanc coagulé et jaune coulant.",
        "Placer une tranche de pain grillé au fond de chaque bol, verser la soupe avec l'œuf par-dessus. Finir avec le pecorino et un filet d'huile d'olive."
      ]
    },

    {
      id: 'R474',
      name: 'Zuppa di Farro e Borlotti',
      emoji: '🌾',
      origin: '🇮🇹',
      mealTypes: ['lunch', 'dinner'],
      category: 'italian',
      tags: ['soupe', 'farro', 'borlotti', 'fibres', 'céréales-anciennes', 'protéines-végétales', 'batch-cooking'],
      difficulty: 1,
      prepTime: 5,
      cookTime: 30,
      servings: 2,
      // P×4 + G×4 + L×9 = 19×4 + 50×4 + 7×9 = 76 + 200 + 63 = 339 kcal ✓
      baseNutrition: { calories: 339, proteinGrams: 19, carbsGrams: 50, fatGrams: 7 },
      ingredients: [
        { name: 'Farro perlé', qty: 120, unit: 'g' },
        { name: 'Haricots borlotti cuits', qty: 160, unit: 'g' },
        { name: 'Tomates pelées en boîte', qty: 150, unit: 'g' },
        { name: 'Oignon', qty: 80, unit: 'g' },
        { name: 'Ail', qty: 2, unit: 'pce' },
        { name: 'Bouillon de légumes', qty: 700, unit: 'ml' },
        { name: "Huile d'olive extra-vierge", qty: 12, unit: 'ml' },
        { name: 'Laurier', qty: 2, unit: 'pce' },
        { name: 'Thym frais', qty: 5, unit: 'g' }
      ],
      steps: [
        "Dans une casserole, faire revenir l'oignon et l'ail hachés dans l'huile d'olive 3 minutes. Ajouter les tomates et le laurier.",
        'Incorporer le farro rincé et le bouillon. Porter à ébullition puis mijoter 20 minutes à couvert.',
        "Ajouter les haricots borlotti et le thym. Poursuivre 5-7 minutes jusqu'à ce que le farro soit al dente et le bouillon légèrement épaissi.",
        "Retirer le laurier. Rectifier l'assaisonnement et servir avec un filet d'huile d'olive extra-vierge et du poivre concassé."
      ]
    },

    {
      id: 'R475',
      name: 'Frittata di Verdure al Forno',
      emoji: '🥚',
      origin: '🇮🇹',
      mealTypes: ['breakfast', 'lunch', 'dinner'],
      category: 'italian',
      tags: ['frittata', 'oeuf', 'légumes', 'four', 'sans-gluten', 'protéines', 'meal-prep'],
      difficulty: 1,
      prepTime: 10,
      cookTime: 20,
      servings: 2,
      // P×4 + G×4 + L×9 = 24×4 + 10×4 + 16×9 = 96 + 40 + 144 = 280 kcal ✓
      baseNutrition: { calories: 280, proteinGrams: 24, carbsGrams: 10, fatGrams: 16 },
      ingredients: [
        { name: 'Oeufs', qty: 4, unit: 'pce' },
        { name: 'Courgette', qty: 120, unit: 'g' },
        { name: 'Poivron rouge', qty: 100, unit: 'g' },
        { name: 'Épinards frais', qty: 60, unit: 'g' },
        { name: 'Oignon rouge', qty: 60, unit: 'g' },
        { name: 'Feta émiettée', qty: 40, unit: 'g' },
        { name: "Huile d'olive extra-vierge", qty: 10, unit: 'ml' },
        { name: 'Origan séché', qty: 2, unit: 'g' },
        { name: 'Basilic frais', qty: 8, unit: 'g' }
      ],
      steps: [
        "Préchauffer le four à 180°C. Dans une poêle allant au four, faire revenir l'oignon et les légumes coupés en dés dans l'huile 5 minutes.",
        "Battre les œufs avec l'origan, du sel et du poivre. Incorporer les épinards aux légumes poêlés, puis verser le mélange d'œufs par-dessus.",
        "Parsemer de feta émiettée et enfourner 12-15 minutes jusqu'à ce que la frittata soit prise et légèrement dorée en surface.",
        'Laisser tiédir 2 minutes avant de démouler. Garnir de basilic frais et servir en parts avec une salade verte.'
      ]
    },

    {
      id: 'R476',
      name: 'Uova in Purgatorio',
      emoji: '🍅',
      origin: '🇮🇹',
      mealTypes: ['breakfast', 'lunch', 'dinner'],
      category: 'italian',
      tags: ['oeuf', 'tomate', 'shakshuka-italiana', 'piment', 'rapide', 'protéines', 'sans-gluten'],
      difficulty: 1,
      prepTime: 5,
      cookTime: 20,
      servings: 2,
      // P×4 + G×4 + L×9 = 18×4 + 16×4 + 14×9 = 72 + 64 + 126 = 262 kcal ✓
      baseNutrition: { calories: 262, proteinGrams: 18, carbsGrams: 16, fatGrams: 14 },
      ingredients: [
        { name: 'Oeufs', qty: 4, unit: 'pce' },
        { name: 'Tomates pelées en boîte', qty: 400, unit: 'g' },
        { name: 'Ail', qty: 3, unit: 'pce' },
        { name: 'Piment rouge séché', qty: 1, unit: 'pce' },
        { name: "Huile d'olive extra-vierge", qty: 15, unit: 'ml' },
        { name: 'Basilic frais', qty: 10, unit: 'g' },
        { name: 'Pecorino romano râpé', qty: 20, unit: 'g' }
      ],
      steps: [
        "Dans une poêle large, faire revenir l'ail émincé et le piment émietté dans l'huile d'olive 2 minutes jusqu'à légère coloration.",
        "Ajouter les tomates pelées concassées à la main. Assaisonner de sel et cuire à feu moyen 10 minutes jusqu'à légère réduction.",
        "Créer 4 creux dans la sauce et y casser les œufs délicatement. Couvrir et cuire 6-8 minutes selon la cuisson désirée (jaune coulant ou ferme).",
        'Parsemer de pecorino râpé et de basilic frais déchiré. Servir directement dans la poêle avec du pain de campagne grillé.'
      ]
    },

    {
      id: 'R477',
      name: 'Polenta Crémeuse Champignons Sautés',
      emoji: '🍄',
      origin: '🇮🇹',
      mealTypes: ['lunch', 'dinner'],
      category: 'italian',
      tags: ['polenta', 'champignons', 'comfort-food', 'sans-gluten', 'végétarien', 'umami', 'nordique-italien'],
      difficulty: 1,
      prepTime: 5,
      cookTime: 25,
      servings: 2,
      // P×4 + G×4 + L×9 = 16×4 + 48×4 + 12×9 = 64 + 192 + 108 = 364 kcal ✓
      baseNutrition: { calories: 364, proteinGrams: 16, carbsGrams: 48, fatGrams: 12 },
      ingredients: [
        { name: 'Polenta à cuisson rapide', qty: 120, unit: 'g' },
        { name: 'Champignons mélangés', qty: 250, unit: 'g' },
        { name: 'Bouillon de légumes', qty: 500, unit: 'ml' },
        { name: 'Lait demi-écrémé', qty: 100, unit: 'ml' },
        { name: 'Parmesan râpé', qty: 30, unit: 'g' },
        { name: 'Ail', qty: 2, unit: 'pce' },
        { name: 'Thym frais', qty: 5, unit: 'g' },
        { name: "Huile d'olive extra-vierge", qty: 15, unit: 'ml' },
        { name: 'Persil frais', qty: 10, unit: 'g' }
      ],
      steps: [
        "Porter le bouillon et le lait à ébullition dans une casserole. Verser la polenta en pluie en fouettant constamment. Cuire 5-7 minutes jusqu'à épaississement crémeux.",
        'Incorporer la moitié du parmesan à la polenta. Assaisonner de sel et poivre, couvrir et réserver hors du feu.',
        "Dans une poêle chaude, faire sauter les champignons tranchés dans l'huile d'olive avec l'ail et le thym 8-10 minutes jusqu'à dorure. Assaisonner.",
        "Dresser la polenta crémeuse dans les assiettes, disposer les champignons par-dessus. Finir avec le parmesan restant, le persil ciselé et un filet d'huile d'olive."
      ]
    },

    {
      id: 'R478',
      name: 'Farinata di Ceci',
      emoji: '🫓',
      origin: '🇮🇹',
      mealTypes: ['lunch', 'dinner', 'snack'],
      category: 'italian',
      tags: ['farinata', 'pois-chiches', 'ligurie', 'sans-gluten', 'vegan', 'street-food', 'protéines-végétales'],
      difficulty: 1,
      prepTime: 10,
      cookTime: 20,
      servings: 2,
      // P×4 + G×4 + L×9 = 14×4 + 34×4 + 12×9 = 56 + 136 + 108 = 300 kcal ✓
      baseNutrition: { calories: 300, proteinGrams: 14, carbsGrams: 34, fatGrams: 12 },
      ingredients: [
        { name: 'Farine de pois chiches', qty: 120, unit: 'g' },
        { name: 'Eau', qty: 360, unit: 'ml' },
        { name: "Huile d'olive extra-vierge", qty: 20, unit: 'ml' },
        { name: 'Romarin frais', qty: 5, unit: 'g' },
        { name: 'Oignon rouge', qty: 60, unit: 'g' },
        { name: 'Sel de mer', qty: 3, unit: 'g' },
        { name: 'Poivre noir', qty: 2, unit: 'g' }
      ],
      steps: [
        "Fouetter la farine de pois chiches avec l'eau froide jusqu'à pâte lisse et sans grumeaux. Laisser reposer 30 minutes (ou 5 min si pressé).",
        "Préchauffer le four à 230°C avec la plaque huilée à l'intérieur. Émincer finement l'oignon rouge et les aiguilles de romarin.",
        "Incorporer la moitié de l'huile d'olive, l'oignon et le romarin à la pâte. Verser sur la plaque chaude huilée en couche fine (3-4 mm).",
        "Enfourner 15-18 minutes jusqu'à bords dorés et croustillants et centre légèrement ferme. Arroser du reste d'huile, saler et poivrer. Servir immédiatement."
      ]
    },

    {
      id: 'R479',
      name: 'Pappa al Pomodoro Moderne',
      emoji: '🍅',
      origin: '🇮🇹',
      mealTypes: ['lunch', 'dinner'],
      category: 'italian',
      tags: ['pappa-al-pomodoro', 'tomate', 'pain', 'toscane', 'comfort-food', 'anti-gaspillage', 'végétarien'],
      difficulty: 1,
      prepTime: 5,
      cookTime: 20,
      servings: 2,
      // P×4 + G×4 + L×9 = 10×4 + 40×4 + 11×9 = 40 + 160 + 99 = 299 kcal ✓
      baseNutrition: { calories: 299, proteinGrams: 10, carbsGrams: 40, fatGrams: 11 },
      ingredients: [
        { name: 'Pain de campagne rassis', qty: 120, unit: 'g' },
        { name: 'Tomates pelées en boîte', qty: 400, unit: 'g' },
        { name: 'Bouillon de légumes', qty: 300, unit: 'ml' },
        { name: 'Ail', qty: 3, unit: 'pce' },
        { name: "Huile d'olive extra-vierge", qty: 20, unit: 'ml' },
        { name: 'Basilic frais', qty: 15, unit: 'g' },
        { name: 'Piment rouge séché', qty: 1, unit: 'pce' }
      ],
      steps: [
        "Dans une casserole, faire revenir l'ail écrasé et le piment dans l'huile d'olive 2 minutes. Ajouter les tomates et écraser grossièrement à la cuillère.",
        'Verser le bouillon chaud et porter à frémissement. Émietter le pain rassis dans la soupe en morceaux irréguliers.',
        "Cuire 10-12 minutes en remuant fréquemment jusqu'à consistance épaisse et crémeuse, comme une bouillie rustique. Le pain doit être complètement absorbé.",
        "Retirer du feu, incorporer généreusement le basilic frais déchiré. Laisser reposer 2 minutes. Servir tiède avec un filet d'huile d'olive extra-vierge et du basilic supplémentaire."
      ]
    }


  ];

  // ─── MOTEUR ────────────────────────────────────────────────────────────────────

  /**
   * Trouver une recette par son ID.
   */
  function findRecipe(recipeId) {
    for (var i = 0; i < RECIPES_DB.length; i++) {
      if (RECIPES_DB[i].id === recipeId) return RECIPES_DB[i];
    }
    return null;
  }

  /**
   * Adapter une recette au profil utilisateur via scaling.
   *
   * @param {string} recipeId        — ex: 'R201'
   * @param {object} userState       — issu de window.NutritionMaster.compute()
   * @param {object} [options]
   * @param {number} [options.mealFraction=1/3]  — part des calories journalières (défaut: 1 repas sur 3)
   * @param {number} [options.targetCalories]    — override direct (kcal pour CE repas)
   *
   * @returns {object|null} recette adaptée avec ingrédients scalés, macros recalculées, flag tolérance
   */
  function getAdaptedRecipe(recipeId, userState, options) {
    var recipe = findRecipe(recipeId);
    if (!recipe) return null;
    if (!userState || !userState.caloriesTarget) return null;

    options = options || {};
    var mealFraction   = options.mealFraction || DEFAULT_MEAL_FRACTION;
    var targetCalories = options.targetCalories || Math.round(userState.caloriesTarget * mealFraction);

    // scalingRatio : rapport calories cibles / calories de la recette entière
    var caloriesPerServing = recipe.servings > 0 ? recipe.baseNutrition.calories / recipe.servings : 0;
    if (!caloriesPerServing) return null; // évite division par zéro
    var scalingRatio       = targetCalories / caloriesPerServing;

    // Scaling ingrédients
    var eggCorrectionP = 0, eggCorrectionF = 0, eggCorrectionG = 0, eggCorrectionKcal = 0;

    var adaptedIngredients = recipe.ingredients.map(function (ing) {
      if (ing.unit === 'pce') {
        // RÈGLE ŒUF : arrondi à l'entier le plus proche
        var rawQty     = (ing.qty / recipe.servings) * scalingRatio;
        var roundedQty = Math.round(rawQty);
        var delta      = roundedQty - rawQty; // correction post-arrondi

        eggCorrectionP    += delta * EGG_PROTEIN_PER_UNIT;
        eggCorrectionF    += delta * EGG_FAT_PER_UNIT;
        eggCorrectionG    += delta * EGG_CARBS_PER_UNIT;
        eggCorrectionKcal += delta * EGG_KCAL_PER_UNIT;

        var adapted = {};
        for (var k in ing) { if (ing.hasOwnProperty(k)) adapted[k] = ing[k]; }
        adapted.qty    = roundedQty;
        adapted._raw   = Math.round(rawQty * 10) / 10;
        return adapted;
      }

      var adapted2 = {};
      for (var k2 in ing) { if (ing.hasOwnProperty(k2)) adapted2[k2] = ing[k2]; }
      adapted2.qty = Math.round((ing.qty / recipe.servings) * scalingRatio * 10) / 10;
      return adapted2;
    });

    // Macros scalées proportionnellement (1 portion × ratio)
    var basePerServing = {
      proteinGrams: recipe.baseNutrition.proteinGrams / recipe.servings,
      carbsGrams:   recipe.baseNutrition.carbsGrams   / recipe.servings,
      fatGrams:     recipe.baseNutrition.fatGrams      / recipe.servings
    };

    var adaptedNutrition = {
      proteinGrams: Math.round((basePerServing.proteinGrams * scalingRatio + eggCorrectionP) * 10) / 10,
      carbsGrams:   Math.round((basePerServing.carbsGrams   * scalingRatio + eggCorrectionG) * 10) / 10,
      fatGrams:     Math.round((basePerServing.fatGrams      * scalingRatio + eggCorrectionF) * 10) / 10
    };
    adaptedNutrition.calories = Math.round(
      adaptedNutrition.proteinGrams * KCAL_PER_PROT +
      adaptedNutrition.carbsGrams   * KCAL_PER_CARB +
      adaptedNutrition.fatGrams     * KCAL_PER_FAT
    );

    var calorieDelta = Math.abs(adaptedNutrition.calories - targetCalories);

    return {
      id:           recipe.id,
      name:         recipe.name,
      category:     recipe.category,
      tags:         recipe.tags,
      prepTime:     recipe.prepTime,
      cookTime:     recipe.cookTime,
      difficulty:   recipe.difficulty,
      steps:        recipe.steps,
      scalingRatio: Math.round(scalingRatio * 100) / 100,
      ingredients:  adaptedIngredients,
      adaptedNutrition: adaptedNutrition,
      targetNutrition: {
        calories:     targetCalories,
        proteinGrams: userState.proteinGrams,
        carbsGrams:   userState.carbsGrams,
        fatGrams:     userState.fatGrams
      },
      validation: {
        calorieDelta:    calorieDelta,
        withinTolerance: calorieDelta <= TOLERANCE_KCAL,
        eggRounded:      eggCorrectionP !== 0 || eggCorrectionF !== 0
      }
    };
  }

  /**
   * Filtrer les recettes compatibles avec le profil utilisateur.
   *
   * @param {object} userState  — issu de NutritionMaster.compute()
   * @param {object} [filters]
   * @param {string}   [filters.category]   — 'maroc-moderne' | 'world-food'
   * @param {string[]} [filters.tags]        — ['high-protein', 'vegan', ...]
   * @param {number}   [filters.maxPrepTime] — minutes
   * @param {number}   [filters.difficulty]  — 1 | 2 | 3
   *
   * @returns {object[]} recettes filtrées, triées par écart calorique croissant
   */
  // ─── ALLERGY / REGIME MAPS ────────────────────────────────────────────────────
  // Map allergie label (ALLERGIES constant) → liste d'ingrédients à exclure (sous-chaînes).
  var ALLERGY_INGREDIENT_MAP = {
    'Fruits à coque': ['amande', 'noix de cajou', 'noix de macadamia', 'noix du brésil',
                       'noix de pécan', 'pistache', 'noisette', 'noix (', 'noix,', '" noix"',
                       'noix concassée', 'noix effilée', 'noix de coco', // noix de coco exclue par sécurité
                       'lait d\'amande', 'beurre d\'amande', 'farine d\'amande',
                       'granola', /* souvent contient noix */ 'skyr.*noix'],
    'Arachides':      ['cacahuète', 'beurre de cacahuète', 'arachide', 'satay'],
    'Oeufs':          ['oeuf', 'œuf', 'egg'],
    'Poisson':        ['saumon', 'thon', 'cabillaud', 'tilapia', 'truite', 'anchois',
                       'sardine', 'maquereau', 'poisson', 'colin', 'dorade', 'bar ',
                       'lotte', 'filet de mer'],
    'Crustacés':      ['crevette', 'homard', 'crabe', 'langouste', 'écrevisse', 'crustacé'],
    'Soja':           ['tofu', 'tempeh', 'edamame', 'pousses de soja', 'sauce soja',
                       'lait de soja', 'sauce tamari', 'miso', 'natto'],
    'Lait/Produits laitiers': ['fromage', 'beurre', 'crème', 'lait (', 'lait entier',
                                'lait demi-écrémé', 'yaourt', 'skyr', 'ricotta', 'feta',
                                'mozzarella', 'parmesan', 'gruyère', 'emmental', 'camembert',
                                'whey', 'caséine', 'ghee'],
    'Gluten/Blé':     ['farine de blé', 'farine t45', 'farine t55', 'farine t65',
                       'pâte', 'pain ', 'baguette', 'blé ', 'boulgour', 'semoule',
                       'orge', 'seigle', 'vermicelle', 'feuille de brick',
                       'sauce soja', /* souvent contient blé */ 'chapelure'],
    'Sésame':         ['sésame', 'tahini', 'huile de sésame', 'graine de sésame'],
    'Moutarde':       ['moutarde']
  };

  // Map intolerance label → ingrédients à exclure
  var INTOLERANCE_INGREDIENT_MAP = {
    'Lactose': ['lait (', 'lait entier', 'lait demi-écrémé', 'lait de vache',
                'crème', 'beurre', 'fromage blanc', 'yaourt', 'skyr',
                'ricotta', 'mozzarella fraîche', 'fromage frais'],
    'Gluten':  ['farine de blé', 'farine t45', 'farine t55', 'farine t65',
                'pain ', 'pâte', 'blé ', 'boulgour', 'semoule',
                'orge', 'seigle', 'vermicelle', 'feuille de brick',
                'chapelure', 'sauce soja']
  };

  // Map regime index (REGIMES array) → required tag or excluded tags
  // regime 0=Omnivore (pas de restriction), 1=Pescétarien (no meat), 2=Végétarien, 3=Végan
  var REGIME_REQUIRED_TAGS = {
    1: null,  // Pescétarien : pas de tag obligatoire (filtre ingrédients viande)
    2: null,  // Végétarien  : pas de tag obligatoire (filtre ingrédients viande)
    3: 'vegan' // Végan : doit avoir le tag 'vegan'
  };
  // Ingrédients viande à exclure pour pescétarien + végétarien
  var MEAT_INGREDIENTS = ['boeuf', 'bœuf', 'veau', 'agneau', 'porc', 'lard', 'bacon',
                          'jambon', 'chorizo', 'saucisse', 'saucisson', 'charcuterie',
                          'dinde', 'poulet', 'canard', 'volaille', 'lapin', 'gibier',
                          'hachis', 'steak', 'côte de', 'rôti', 'escalope'];
  // Ingrédients animaux en plus pour végétalien
  var ANIMAL_INGREDIENTS = MEAT_INGREDIENTS.concat(
    ['oeuf', 'œuf', 'lait ', 'fromage', 'beurre', 'crème', 'yaourt', 'skyr',
     'miel', 'whey', 'caséine', 'saumon', 'thon', 'crevette', 'poisson']
  );

  /**
   * Vérifie si une recette contient un ingrédient exclu (sous-chaîne insensible à la casse).
   * @param {object} recipe
   * @param {string[]} excludedTerms
   * @returns {boolean} true si la recette est safe (pas d'ingrédient exclu)
   */
  function recipeHasNoExcludedIngredients(recipe, excludedTerms) {
    if (!excludedTerms || !excludedTerms.length) return true;
    var ings = recipe.ingredients || [];
    for (var i = 0; i < ings.length; i++) {
      var ingName = (ings[i].name || '').toLowerCase();
      for (var j = 0; j < excludedTerms.length; j++) {
        if (ingName.indexOf(excludedTerms[j].toLowerCase()) !== -1) return false;
      }
    }
    // Also check recipe name and tags for allergen hints
    var rName = (recipe.name || '').toLowerCase();
    for (var k = 0; k < excludedTerms.length; k++) {
      if (rName.indexOf(excludedTerms[k].toLowerCase()) !== -1) return false;
    }
    return true;
  }

  function filterRecipes(userState, filters) {
    filters = filters || {};
    var mealType = (filters && filters.mealType) || null;
    var split = (typeof getMealSplit === 'function') ? getMealSplit() : null;
    var fraction = (split && mealType)
      ? (mealType === 'breakfast' ? (split.pctBreak  || DEFAULT_MEAL_FRACTION)
       : mealType === 'lunch'     ? (split.pctLunch  || DEFAULT_MEAL_FRACTION)
       : mealType === 'snack'     ? (split.pctSnack  || 0.10)
       : mealType === 'dinner'    ? (split.pctDinner || DEFAULT_MEAL_FRACTION)
       : DEFAULT_MEAL_FRACTION)
      : DEFAULT_MEAL_FRACTION;
    var mealTarget = userState && userState.caloriesTarget
      ? Math.round(userState.caloriesTarget * fraction)
      : null;

    // ── Build exclusion list from filters.allergies ──
    var allergyExclusions = [];
    if (filters.allergies && filters.allergies.length) {
      filters.allergies.forEach(function (allergyLabel) {
        var terms = ALLERGY_INGREDIENT_MAP[allergyLabel];
        if (terms) allergyExclusions = allergyExclusions.concat(terms);
      });
    }

    // ── Build exclusion list from filters.intolerances ──
    var intoleranceExclusions = [];
    if (filters.intolerances && filters.intolerances.length) {
      filters.intolerances.forEach(function (intoleranceLabel) {
        var terms = INTOLERANCE_INGREDIENT_MAP[intoleranceLabel];
        if (terms) intoleranceExclusions = intoleranceExclusions.concat(terms);
      });
    }

    // ── Combine all ingredient exclusions ──
    var allExclusions = allergyExclusions.concat(intoleranceExclusions);

    // ── Build regime constraint ──
    var regimeIdx = (filters.regime !== undefined && filters.regime !== null) ? filters.regime : null;
    var regimeExclusions = [];
    if (regimeIdx === 2) {
      // Végétarien : exclure viande
      regimeExclusions = MEAT_INGREDIENTS;
    } else if (regimeIdx === 3) {
      // Végan : exclure tous produits animaux
      regimeExclusions = ANIMAL_INGREDIENTS;
    }
    // Pescétarien (1) : exclure viande mais garder poisson — utiliser MEAT_INGREDIENTS
    if (regimeIdx === 1) {
      regimeExclusions = MEAT_INGREDIENTS;
    }
    allExclusions = allExclusions.concat(regimeExclusions);

    return RECIPES_DB.filter(function (r) {
      if (filters.category && r.category !== filters.category) return false;
      if (filters.difficulty && r.difficulty !== filters.difficulty) return false;
      if (filters.maxPrepTime && (r.prepTime + r.cookTime) > filters.maxPrepTime) return false;
      if (filters.tags && filters.tags.length) {
        var hasAll = filters.tags.every(function (t) { return r.tags.indexOf(t) !== -1; });
        if (!hasAll) return false;
      }

      // ── Filtre régime : végan doit avoir tag 'vegan' ──
      if (regimeIdx === 3 && r.tags.indexOf('vegan') === -1) return false;
      // Végétarien : tag 'vegetarian' ou 'vegan' requis
      if (regimeIdx === 2 && r.tags.indexOf('vegetarian') === -1 && r.tags.indexOf('vegan') === -1) return false;

      // ── Filtre ingrédients exclus (allergies + intolérances + régime ingrédient) ──
      if (allExclusions.length && !recipeHasNoExcludedIngredients(r, allExclusions)) return false;

      return true;
    }).sort(function (a, b) {
      if (!mealTarget) return 0;
      var calA = Math.abs((a.baseNutrition.calories / a.servings) - mealTarget);
      var calB = Math.abs((b.baseNutrition.calories / b.servings) - mealTarget);
      return calA - calB;
    });
  }

  /**
   * Lister tous les IDs disponibles.
   */
  function listRecipeIds() {
    return RECIPES_DB.map(function (r) { return r.id; });
  }

  // ─── BUDGET ENGINE ─────────────────────────────────────────────────────────────

  /**
   * Calcule le coût d'une recette en MAD.
   * Utilise window.getPricePer() depuis prices-db.js.
   * @param {string} recipeId
   * @param {number} [scalingRatio=1]  — 1 = recette de base
   * @returns {{ totalMAD: number, breakdown: Array, pricePerServing: number } | null}
   */
  function calcRecipeCost(recipeId, scalingRatio) {
    var recipe = findRecipe(recipeId);
    if (!recipe) return null;
    if (!window.getPricePer) return null;
    scalingRatio = scalingRatio || 1;

    var breakdown = [];
    var missing   = [];
    var totalMAD  = 0;

    recipe.ingredients.forEach(function (ing) {
      var unitPrice = window.getPricePer(ing.name, ing.unit);
      if (unitPrice === null || unitPrice === undefined) {
        missing.push(ing.name);
        return;
      }
      var scaledQty = (ing.qty / recipe.servings) * scalingRatio;
      var cost = Math.round(scaledQty * unitPrice * 100) / 100;
      totalMAD += cost;
      breakdown.push({ name: ing.name, qty: Math.round(scaledQty * 10) / 10, unit: ing.unit, unitPrice: unitPrice, cost: cost });
    });

    totalMAD = Math.round(totalMAD * 100) / 100;
    return {
      recipeId:       recipeId,
      recipeName:     recipe.name,
      totalMAD:       totalMAD,
      pricePerServing: Math.round((totalMAD / recipe.servings) * 100) / 100,
      breakdown:      breakdown,
      missing:        missing,           // ingrédients sans prix dans prices-db
      coveragePct:    recipe.ingredients.length > 0
                        ? Math.round(((recipe.ingredients.length - missing.length) / recipe.ingredients.length) * 100)
                        : 100
    };
  }

  /**
   * Calcule le budget quotidien pour un userState donné.
   * Sélectionne automatiquement les recettes les mieux adaptées (filterRecipes).
   * @param {object} userState  — issu de window.NutritionMaster.compute()
   * @param {object} [options]
   * @param {number} [options.mealsPerDay=3]
   * @param {string} [options.category]  — 'maroc-moderne' | 'world-food' | null (les deux)
   * @returns {{ meals: Array, totalMAD: number, budgetPerMeal: number }}
   */
  function calcDailyBudget(userState, options) {
    options = options || {};
    var mealsPerDay = options.mealsPerDay || 3;
    var mealFraction = 1 / mealsPerDay;

    var filters = {};
    if (options.category) filters.category = options.category;

    var candidates = filterRecipes(userState, filters);
    if (!candidates.length) return { meals: [], totalMAD: 0, budgetPerMeal: 0 };

    var meals = [];
    var totalMAD = 0;

    for (var i = 0; i < mealsPerDay; i++) {
      var recipe = candidates[i % candidates.length];
      var targetCal = Math.round(userState.caloriesTarget * mealFraction);
      var caloriesPerServing = (recipe.servings && recipe.servings > 0) ? recipe.baseNutrition.calories / recipe.servings : 0;
      if (!caloriesPerServing) continue; // évite division par zéro si servings manquant
      var ratio = targetCal / caloriesPerServing;
      var cost = calcRecipeCost(recipe.id, ratio);
      if (cost) {
        meals.push({ meal: i + 1, recipeId: recipe.id, recipeName: recipe.name, targetCalories: targetCal, costMAD: cost.totalMAD });
        totalMAD += cost.totalMAD;
      }
    }

    totalMAD = Math.round(totalMAD * 100) / 100;
    return {
      mealsPerDay: mealsPerDay,
      meals: meals,
      totalMAD: totalMAD,
      budgetPerMeal: Math.round((totalMAD / mealsPerDay) * 100) / 100
    };
  }

  /**
   * Calcule le budget hebdomadaire (7 jours).
   * @param {object} userState
   * @param {object} [options]  — mêmes options que calcDailyBudget
   * @returns {{ days: Array, totalMAD: number, avgDailyMAD: number }}
   */
  function calcWeeklyBudget(userState, options) {
    var days = [];
    var totalMAD = 0;

    for (var d = 0; d < 7; d++) {
      var daily = calcDailyBudget(userState, options);
      days.push({ day: d + 1, totalMAD: daily.totalMAD, meals: daily.meals });
      totalMAD += daily.totalMAD;
    }

    totalMAD = Math.round(totalMAD * 100) / 100;
    return {
      days: days,
      totalMAD: totalMAD,
      avgDailyMAD: Math.round((totalMAD / 7) * 100) / 100
    };
  }

  // ─── CONVERTISSEUR NOUVEAU → ANCIEN FORMAT ─────────────────────────────────
  // Convertit une recette riche (R201+) au format simplifié du planificateur
  var MEAL_TYPE_TAGS = {
    breakfast: ['breakfast', 'brunch', 'morning'],
    snack:     ['snack', 'gouter', 'collation', 'starter', 'pre-workout'],
    lunch:     ['lunch', 'main', 'high-protein', 'meal-prep'],
    dinner:    ['dinner', 'main', 'family', 'vegan', 'world-food']
  };

  function convertToDisplay(qty, unit, name) {
    var n = (name || '').toLowerCase();
    var u = (unit || '').toLowerCase();
    var q = qty;

    // ── Œufs & produits ──────────────────────────────────────────────────
    if (n.indexOf('blanc') >= 0 && (n.indexOf('uf') >= 0 || n.indexOf('oeuf') >= 0 || n.indexOf('œuf') >= 0)) {
      if (u === 'g') {
        var blancs = Math.round(q / 30);
        if (blancs >= 1) return { qty: blancs, unit: blancs > 1 ? 'blancs' : 'blanc' };
      }
    }
    if (n.indexOf('jaune') >= 0 && (n.indexOf('uf') >= 0 || n.indexOf('oeuf') >= 0 || n.indexOf('œuf') >= 0)) {
      if (u === 'g') {
        var jaunes = Math.round(q / 20);
        if (jaunes >= 1) return { qty: jaunes, unit: jaunes > 1 ? 'jaunes' : 'jaune' };
      }
    }
    if ((n.indexOf('oeuf') >= 0 || n.indexOf('œuf') >= 0) && n.indexOf('blanc') < 0 && n.indexOf('jaune') < 0) {
      if (u === 'g') {
        var oeufs = Math.round(q / 50);
        if (oeufs >= 1) return { qty: oeufs, unit: oeufs > 1 ? 'œufs' : 'œuf' };
      }
    }

    // ── Huiles & liquides ─────────────────────────────────────────────────
    var isOil = n.indexOf('huile') >= 0;
    var isVinegar = n.indexOf('vinaigre') >= 0;
    var isSauce = n.indexOf('sauce soja') >= 0 || n.indexOf('sauce tamari') >= 0 || n.indexOf('tamari') >= 0;
    var isHoney = n.indexOf('miel') >= 0;
    var isMaple = n.indexOf('sirop') >= 0 && n.indexOf('erable') >= 0 || n.indexOf('sirop') >= 0 && n.indexOf('érable') >= 0;
    if (isOil || isVinegar || isSauce || isHoney || isMaple) {
      if (u === 'g' || u === 'ml') {
        if (Math.round(q) === 5)  return { qty: 1, unit: 'c.à.café' };
        if (Math.round(q) === 15) return { qty: 1, unit: 'c.à.soupe' };
        if (Math.round(q) === 10) return { qty: 2, unit: 'c.à.café' };
        if (Math.round(q) === 30) return { qty: 2, unit: 'c.à.soupe' };
        if (Math.round(q) === 45) return { qty: 3, unit: 'c.à.soupe' };
        if (Math.round(q) === 60) return { qty: 4, unit: 'c.à.soupe' };
        // Générique : multiples de 15
        if (q > 0 && q % 15 === 0) {
          var tbsp = q / 15;
          return { qty: tbsp, unit: tbsp > 1 ? 'c.à.soupe' : 'c.à.soupe' };
        }
        // Petites quantités : multiples de 5
        if (q > 0 && q <= 20 && q % 5 === 0) {
          var tsp = q / 5;
          return { qty: tsp, unit: tsp > 1 ? 'c.à.café' : 'c.à.café' };
        }
      }
    }

    // Lait de coco, crème liquide
    var isCocoMilk = n.indexOf('lait de coco') >= 0;
    var isCream = n.indexOf('crème') >= 0 || n.indexOf('creme') >= 0;
    if (isCocoMilk || isCream) {
      if (u === 'ml' || u === 'g') {
        if (Math.round(q) === 30)  return { qty: 2, unit: 'c.à.soupe' };
        if (Math.round(q) === 60)  return { qty: 4, unit: 'c.à.soupe' };
        if (Math.round(q) === 15)  return { qty: 1, unit: 'c.à.soupe' };
        if (Math.round(q) === 45)  return { qty: 3, unit: 'c.à.soupe' };
      }
    }

    // ── Beurre ────────────────────────────────────────────────────────────
    if (n.indexOf('beurre') >= 0) {
      if (u === 'g') {
        if (Math.round(q) === 5)  return { qty: 1, unit: 'c.à.café' };
        if (Math.round(q) === 10) return { qty: 2, unit: 'c.à.café' };
        if (Math.round(q) === 15) return { qty: 1, unit: 'c.à.soupe' };
        if (Math.round(q) === 30) return { qty: 2, unit: 'c.à.soupe' };
      }
    }

    // ── Épices & condiments (≤ 10g) ───────────────────────────────────────
    var spiceKeywords = ['sel', 'poivre', 'curcuma', 'cumin', 'paprika', 'cannelle', 'coriandre',
      'gingembre', 'cardamome', 'muscade', 'piment', 'cayenne', 'origan', 'thym', 'basilic',
      'persil', 'ciboulette', 'ras el hanout', 'harissa', 'sumac', 'za\'atar', 'zaatar',
      'fenouil', 'anis', 'clou', 'epice', 'épice', 'herbe', 'fenugrec', 'safran',
      'ail en poudre', 'oignon en poudre', 'levure chimique', 'bicarbonate'];
    var isSpice = false;
    for (var si = 0; si < spiceKeywords.length; si++) {
      if (n.indexOf(spiceKeywords[si]) >= 0) { isSpice = true; break; }
    }
    if (isSpice && u === 'g' && q <= 10) {
      if (q <= 1)              return { qty: '¼',  unit: 'c.à.café' };
      if (q <= 2)              return { qty: '½',  unit: 'c.à.café' };
      if (q >= 3 && q <= 4)   return { qty: 1,    unit: 'c.à.café' };
      if (q >= 5 && q <= 6)   return { qty: '1½', unit: 'c.à.café' };
      if (q >= 6 && q <= 8)   return { qty: 1,    unit: 'c.à.soupe' };
      if (q >= 9 && q <= 10)  return { qty: '1½', unit: 'c.à.soupe' };
    }

    // ── Fromages râpés ────────────────────────────────────────────────────
    var isGratedCheese = (n.indexOf('parmesan') >= 0 || n.indexOf('gruyere') >= 0 || n.indexOf('gruyère') >= 0 || n.indexOf('feta') >= 0);
    if (isGratedCheese && u === 'g') {
      if (Math.round(q) === 15) return { qty: 1, unit: 'c.à.soupe' };
      if (Math.round(q) === 30) return { qty: 2, unit: 'c.à.soupe' };
    }

    // ── Légumes & fruits frais ────────────────────────────────────────────
    if (n.indexOf('avocat') >= 0 && u === 'g') {
      if (Math.round(q) === 150) return { qty: 1,   unit: 'avocat' };
      if (Math.round(q) === 75)  return { qty: '½', unit: 'avocat' };
    }
    if (n.indexOf('tomate') >= 0 && n.indexOf('concentre') < 0 && n.indexOf('concentré') < 0 && u === 'g') {
      if (Math.round(q) === 120) return { qty: 1,   unit: 'tomate' };
      if (Math.round(q) === 60)  return { qty: '½', unit: 'tomate' };
    }
    if (n.indexOf('citron') >= 0 && u === 'g') {
      if (Math.round(q) === 120) return { qty: 1, unit: 'citron' };
    }
    if (n.indexOf('jus de citron') >= 0 && (u === 'ml' || u === 'g')) {
      if (Math.round(q) === 30) return { qty: "jus d'1", unit: 'citron' };
    }
    if ((n.indexOf('ail') >= 0) && n.indexOf('poudre') < 0 && u === 'g') {
      var gousses = Math.round(q / 5);
      if (gousses >= 1) return { qty: gousses, unit: gousses > 1 ? 'gousses' : 'gousse' };
    }
    if (n.indexOf('oignon') >= 0 && n.indexOf('poudre') < 0 && u === 'g') {
      if (Math.round(q) === 100) return { qty: 1,   unit: 'oignon moyen' };
      if (Math.round(q) === 50)  return { qty: '½', unit: 'oignon' };
    }
    if (n.indexOf('echalote') >= 0 || n.indexOf('échalote') >= 0) {
      if (u === 'g' && Math.round(q) === 40) return { qty: 1, unit: 'échalote' };
    }

    // Aucune conversion applicable : retourner les valeurs originales
    return { qty: qty, unit: unit };
  }

  function toSimpleFormat(recipe) {
    var perServing = recipe.servings > 0 ? recipe.servings : 1;
    var flagMap = { 'maroc-moderne': '🇲🇦', 'world-food': '🌍', 'italian': '🇮🇹' };
    // Per-serving ingredients with correct units (all units preserved, not forced to 'g')
    var perServIngr = (recipe.ingredients || []).map(function(ing) {
      return { name: ing.name, qty: Math.round((ing.qty / perServing) * 10) / 10, unit: ing.unit || 'g', note: ing.note };
    });
    var ingrStr = perServIngr.map(function(ing) {
      var disp = convertToDisplay(ing.qty, ing.unit, ing.name);
      return disp.qty + (disp.unit === 'pce' ? ' pce ' : ' ' + disp.unit + ' ') + ing.name;
    }).join(', ');
    return {
      n:           recipe.name,
      f:           recipe.origin || recipe.emoji || flagMap[recipe.category] || '🌍',
      k:           Math.round(recipe.baseNutrition.calories    / perServing),
      p:           Math.round(recipe.baseNutrition.proteinGrams / perServing),
      g:           Math.round(recipe.baseNutrition.carbsGrams   / perServing),
      l:           Math.round(recipe.baseNutrition.fatGrams     / perServing),
      i:           ingrStr,
      ingredients: perServIngr,  // array structuré pour affichage modal fiable
      st:          recipe.steps || [],
      w:           (recipe.tags || []).indexOf('whey') >= 0,
      tags:        recipe.tags || [],
      lv:          recipe.difficulty || 1,
      _id:         recipe.id   // lien vers la recette complète dans RECIPES_DB
    };
  }

  function classifyMealType(recipe) {
    var tags = recipe.tags || [];
    if (tags.indexOf('breakfast') >= 0 || tags.indexOf('brunch') >= 0) return 'breakfast';
    if (tags.indexOf('snack') >= 0 || tags.indexOf('collation') >= 0 || tags.indexOf('starter') >= 0) return 'snack';
    // Par défaut : déjeuner ET dîner (recettes principales)
    return 'both';
  }

  /**
   * Retourne le pool de recettes pour un type de repas.
   * Toutes les 439 recettes (R201-R439 + L001-L350 migrées) sont dans RECIPES_DB.
   * @param {'breakfast'|'lunch'|'snack'|'dinner'} mealType
   * @returns {Array} Pool de recettes au format simplifié
   */
  function getPool(mealType) {
    var pool = [];

    RECIPES_DB.forEach(function(recipe) {
      var mt = recipe.mealTypes || [];
      var include = false;

      if (mt.length > 0) {
        // mealTypes[] = source de vérité (toutes les recettes L et R en ont)
        if (mealType === 'breakfast') {
          include = mt.indexOf('breakfast') >= 0;
        } else if (mealType === 'snack') {
          include = mt.indexOf('snack') >= 0;
        } else if (mealType === 'lunch') {
          include = mt.indexOf('lunch') >= 0 || mt.indexOf('both') >= 0;
        } else if (mealType === 'dinner') {
          include = mt.indexOf('dinner') >= 0 || mt.indexOf('both') >= 0;
        }
      } else {
        // Fallback tags pour recettes R201-R349 sans mealTypes (category field)
        var type = classifyMealType(recipe);
        include = (type === mealType) ||
                  (type === 'both' && (mealType === 'lunch' || mealType === 'dinner'));
      }

      if (include) {
        pool.push(toSimpleFormat(recipe));
      }
    });

    return pool;
  }

  /**
   * Calcule le budget réel basé sur le vrai weekPlan de l'utilisateur.
   * Utilise _scalingRatio stocké par enrichWithScaling() pour les recettes R201+.
   * Pour les recettes legacy (sans _id), cost = null (prix non disponible).
   *
   * @param {Array} weekPlan  — window.S.weekPlan (7 jours)
   * @returns {{
   *   days: Array<{
   *     day: number,
   *     meals: Array<{slot, recipeName, costMAD, scaled, _id}>,
   *     totalMAD: number
   *   }>,
   *   totalMAD: number,
   *   avgDailyMAD: number,
   *   coveragePct: number,   — % de repas dont le prix est connu
   *   weeklyMAD: number
   * }}
   */
  function calcWeekPlanBudget(weekPlan) {
    if (!weekPlan || !weekPlan.length) {
      return { days: [], totalMAD: 0, avgDailyMAD: 0, coveragePct: 0, weeklyMAD: 0 };
    }

    var slots = ['breakfast', 'lunch', 'snack', 'dinner'];
    var totalMAD = 0;
    var totalMeals = 0;
    var pricedMeals = 0;
    var days = [];

    for (var d = 0; d < weekPlan.length; d++) {
      var dayPlan = weekPlan[d];
      var dayMAD = 0;
      var dayMeals = [];

      slots.forEach(function(slot) {
        var recipe = dayPlan[slot];
        if (!recipe) return;

        totalMeals++;
        var mealEntry = {
          slot:       slot,
          recipeName: recipe.n || recipe.name || '?',
          costMAD:    null,
          scaled:     false,
          _id:        recipe._id || null
        };

        if (recipe._id && recipe._id.indexOf('SALAD_') === 0 && recipe._scaledIngredients) {
          // Salade custom — ingrédients déjà dans recipe._scaledIngredients
          var saladCost = 0;
          recipe._scaledIngredients.forEach(function(ing) {
            var price = window.getPricePer ? window.getPricePer(ing.name, ing.unit) : null;
            if (price !== null && price > 0) {
              saladCost += price * (ing.scaledQty || ing.qty || 0);
            }
          });
          if (saladCost > 0) {
            mealEntry.costMAD = Math.round(saladCost * 100) / 100;
            mealEntry.scaled  = true;
            dayMAD += mealEntry.costMAD;
            pricedMeals++;
          }
        } else if (recipe._id) {
          // Recette R201+ : utilise le _scalingRatio stocké par enrichWithScaling
          var ratio = recipe._scalingRatio || 1;
          var cost = calcRecipeCost(recipe._id, ratio);
          if (cost && cost.totalMAD) {
            mealEntry.costMAD = Math.round(cost.totalMAD * 100) / 100;
            mealEntry.scaled  = true;
            dayMAD += mealEntry.costMAD;
            pricedMeals++;
          }
        }
        // Recette legacy sans _id : prix non disponible (pas dans prices-db)

        dayMeals.push(mealEntry);
      });

      dayMAD = Math.round(dayMAD * 100) / 100;
      totalMAD += dayMAD;
      days.push({ day: d + 1, meals: dayMeals, totalMAD: dayMAD });
    }

    totalMAD = Math.round(totalMAD * 100) / 100;
    var coveragePct = totalMeals > 0 ? Math.round((pricedMeals / totalMeals) * 100) : 0;

    return {
      days:         days,
      totalMAD:     totalMAD,
      avgDailyMAD:  Math.round((totalMAD / Math.max(weekPlan.length, 1)) * 100) / 100,
      weeklyMAD:    totalMAD,
      coveragePct:  coveragePct
    };
  }

  /**
   * Parse la string d'ingrédients legacy (champ `i`) en tableau d'objets.
   * Format attendu: "Flocons d'avoine 80g, lait écrémé 200ml, banane 100g, ..."
   * @param {string} iStr
   * @returns {Array<{name, qty, unit}>}
   */
  function parseIngredientsString(iStr) {
    if (!iStr || typeof iStr !== 'string') return [];
    return iStr.split(',').map(function(part) {
      part = part.trim();
      // Nettoyer les parenthèses ex: "Riz japonais 120g (cuit 240g)" → "Riz japonais 120g"
      part = part.replace(/\s*\([^)]*\)/g, '').trim();

      // Format NxM : "Œufs 3x60g" → name:"Œufs", qty:180, unit:"g"
      var mNxM = part.match(/^(.+?)\s+(\d+)\s*[x×]\s*([\d.]+)\s*(g|ml|kg|l|pce|cs|cc|cl)$/i);
      if (mNxM) {
        var count = parseInt(mNxM[2]);
        var single = parseFloat(mNxM[3]);
        var unit = mNxM[4].toLowerCase();
        return { name: mNxM[1].trim(), qty: Math.round(count * single * 10) / 10, unit: unit };
      }

      // Format standard : "Flocons d'avoine 80g"
      var m = part.match(/^(.+?)\s+([\d.]+)\s*(g|ml|kg|l|pce|cs|cc|cl)$/i);
      if (m) {
        return { name: m[1].trim(), qty: parseFloat(m[2]), unit: m[3].toLowerCase() };
      }
      // Fallback: nombre sans unité → assume grammes
      var m2 = part.match(/^(.+?)\s+([\d.]+)$/);
      if (m2) return { name: m2[1].trim(), qty: parseFloat(m2[2]), unit: 'g' };
      // Dernier recours: ingrédient sans quantité (sel, poivre...) → quantité symbolique
      return { name: part, qty: 1, unit: 'g' };
    }).filter(function(x) { return x.name && x.name.length > 0; });
  }

  /**
   * Convertit une quantité nutritionnelle en quantité d'achat réaliste.
   * Les gens achètent 1 kg de poulet, pas 347 g ; 1 L de lait, pas 230 ml.
   */
  function toMarketQty(name, qty, unit, cat) {
    var lname = name.toLowerCase();

    // ── Pièces (œufs, etc.) ────────────────────────────────────────────────
    if (unit === 'pce') {
      var n = Math.ceil(qty);
      // Œufs → arrondir au pack de 6
      if (/oeuf|œuf/i.test(lname)) n = Math.ceil(n / 6) * 6;
      return { qty: n, unit: 'pce' };
    }

    // ── Cuillères (épices / condiments) → garder tel quel ─────────────────
    if (unit === 'cs' || unit === 'cc') {
      return { qty: Math.ceil(qty), unit: unit };
    }

    // ── Normaliser en ml ou en g ───────────────────────────────────────────
    var isLiquid = (unit === 'ml' || unit === 'cl' || unit === 'l');
    var inMl = isLiquid
      ? (unit === 'l' ? qty * 1000 : unit === 'cl' ? qty * 10 : qty)
      : 0;
    var inG = !isLiquid
      ? (unit === 'kg' ? qty * 1000 : qty)
      : 0;

    // ── LIQUIDES ──────────────────────────────────────────────────────────
    if (isLiquid) {
      // Lait (toutes sortes) → bouteille de 1 L
      if (/lait/i.test(lname)) {
        var liters = Math.max(1, Math.ceil(inMl / 1000));
        return { qty: liters, unit: 'L' };
      }
      // Crème fraîche / crème liquide → pot de 20 cl / 25 cl (200 ml)
      if (/cr[eè]me/i.test(lname)) {
        var cl = Math.max(20, Math.ceil(inMl / 200) * 200);
        return { qty: cl, unit: 'ml' };
      }
      // Huile → arrondir au 250 ml
      if (/huile/i.test(lname)) {
        var oilMl = Math.max(250, Math.ceil(inMl / 250) * 250);
        return oilMl >= 1000
          ? { qty: oilMl / 1000, unit: 'L' }
          : { qty: oilMl, unit: 'ml' };
      }
      // Jus, lait végétal, eau de coco → 1 L min
      if (cat === '🥤 Boissons & Laits végétaux') {
        var bevL = Math.max(1, Math.ceil(inMl / 500) / 2);
        return { qty: bevL, unit: 'L' };
      }
      // Eau de rose / hydrolat → flacon 100 ml min
      if (/eau de rose|eau florale|hydrolat/i.test(lname)) {
        return { qty: Math.max(100, Math.ceil(inMl / 100) * 100), unit: 'ml' };
      }
      // Vinaigre, sauce soja, etc. (petits flacons) → 250 ml min
      if (inMl <= 500) {
        var smallBottle = Math.max(250, Math.ceil(inMl / 250) * 250);
        return { qty: smallBottle, unit: 'ml' };
      }
      // Générique : arrondir au 500 ml
      var genMl = Math.ceil(inMl / 500) * 500;
      return genMl >= 1000
        ? { qty: genMl / 1000, unit: 'L' }
        : { qty: genMl, unit: 'ml' };
    }

    // ── SOLIDES EN GRAMMES ────────────────────────────────────────────────

    // Épices & herbes → garder la quantité (petit pot déjà chez soi)
    if (cat === '🌿 Épices & Herbes') {
      return { qty: Math.round(inG), unit: 'g' };
    }

    // Viande & poisson → minimum 250 g, arrondir au 250 g
    if (cat === '🥩 Boucherie & Poissonnerie') {
      var meatG = Math.max(250, Math.ceil(inG / 250) * 250);
      return meatG >= 1000
        ? { qty: +(meatG / 1000).toFixed(2), unit: 'kg' }
        : { qty: meatG, unit: 'g' };
    }

    // Fruits & légumes → minimum 500 g, arrondir au 500 g
    // Sauf petites quantités type ail/gingembre (< 80 g) → 100 g min
    if (cat === '🥦 Fruits & Légumes') {
      if (inG < 80) {
        return { qty: Math.max(50, Math.ceil(inG / 50) * 50), unit: 'g' };
      }
      var vegG = Math.max(500, Math.ceil(inG / 500) * 500);
      return vegG >= 1000
        ? { qty: +(vegG / 1000).toFixed(2), unit: 'kg' }
        : { qty: vegG, unit: 'g' };
    }

    // Féculents & céréales → minimum 500 g, arrondir au 500 g
    if (cat === '🌾 Féculents & Céréales') {
      if (inG < 100) return { qty: Math.ceil(inG), unit: 'g' }; // petites quantités (farine de niche, etc.)
      var starG = Math.max(500, Math.ceil(inG / 500) * 500);
      return starG >= 1000
        ? { qty: +(starG / 1000).toFixed(2), unit: 'kg' }
        : { qty: starG, unit: 'g' };
    }

    // Conserves & bocaux → arrondir à la boîte de 400 g
    if (cat === '🥫 Conserves & Bocaux') {
      var cans = Math.max(1, Math.ceil(inG / 400));
      return { qty: cans, unit: cans === 1 ? 'boîte' : 'boîtes' };
    }

    // Produits laitiers solides (hors lait géré côté liquide)
    if (cat === '🥚 Œufs & Produits laitiers') {
      // Fromage → 200 g min
      if (/fromage|parmesan|mozzarella|feta|ricotta|comté|emmental|gruyère|gouda|cheddar|camembert|brie|bleu/i.test(lname)) {
        return { qty: Math.max(200, Math.ceil(inG / 200) * 200), unit: 'g' };
      }
      // Beurre de cacahuète / beurre de noix/amande/cajou → 🌰 arrondir au 250 g
      if (/beurre de (cacahu[eè]te?|noix|amande|cajou|noisette|pistache)/i.test(lname)) {
        return { qty: Math.max(250, Math.ceil(inG / 250) * 250), unit: 'g' };
      }
      // Beurre → 125 g ou 250 g
      if (/beurre/i.test(lname)) {
        return { qty: inG <= 125 ? 125 : Math.ceil(inG / 250) * 250, unit: 'g' };
      }
      // Yaourt, skyr, kéfir → pot de 125 g ou 500 g
      if (/yaourt|skyr|kéfir|cottage|mascarpone/i.test(lname)) {
        return { qty: Math.max(125, Math.ceil(inG / 125) * 125), unit: 'g' };
      }
      return { qty: Math.ceil(inG), unit: 'g' };
    }

    // Graines, noix & fruits secs → arrondir au 50 g
    if (cat === '🌰 Graines, Noix & Fruits secs') {
      return { qty: Math.max(50, Math.ceil(inG / 50) * 50), unit: 'g' };
    }

    // Épicerie sèche (condiments, sauces…)
    if (cat === '🫙 Épicerie sèche') {
      if (isLiquid) {
        // Sirop, sauce liquide → 250 ml min
        var syrMl = Math.max(250, Math.ceil(inMl / 250) * 250);
        return syrMl >= 1000 ? { qty: syrMl / 1000, unit: 'L' } : { qty: syrMl, unit: 'ml' };
      }
      // Whey / protéine poudre → sac 500 g min
      if (/whey|prot[eé]ine.*poudre|caséine|collagène/i.test(lname)) {
        return { qty: Math.max(500, Math.ceil(inG / 500) * 500), unit: 'g' };
      }
      // Chocolat → tablette 100 g
      if (/chocolat/i.test(lname)) {
        return { qty: Math.max(100, Math.ceil(inG / 100) * 100), unit: 'g' };
      }
      // Eau de rose / hydrolat → flacon 100 ml min (mais déclaré en g ici = unlikely)
      if (/eau de rose|eau florale|hydrolat/i.test(lname)) {
        return { qty: 100, unit: 'ml' };
      }
      if (inG > 0) return { qty: Math.ceil(inG), unit: 'g' };
    }

    // Boulangerie → à la pièce ou 500 g
    if (cat === '🍞 Boulangerie & Pâtisserie') {
      if (unit === 'pce' || inG === 0) return { qty: Math.ceil(qty), unit: 'pce' };
      return { qty: Math.max(1, Math.ceil(inG / 500)), unit: inG <= 500 ? 'unité' : 'unités' };
    }

    // Fallback : arrondir à l'entier
    return { qty: Math.ceil(inG || qty), unit: unit };
  }

  /**
   * Génère la liste de courses consolidée depuis un weekPlan.
   * Regroupe les ingrédients identiques, somme les quantités, catégorise.
   * @param {Array} weekPlan  — window.S.weekPlan
   * @returns {Array<{category, items: Array<{name, qty, unit, recipes}>}>}
   */
  function generateShoppingList(weekPlan, options) {
    if (!weekPlan || !weekPlan.length) return [];
    options = options || {};

    // Adapter les quantités selon la fréquence de courses de l'utilisateur
    var shopFreq = options.shopFreq || (window.S && window.S.shopFreq) || 'weekly';
    // Nombre de jours couverts par chaque course
    var FREQ_DAYS = { daily: 1, '2x_week': 4, weekly: 7, biweekly: 14 };
    var freqDays = FREQ_DAYS[shopFreq] || 7;
    var freqRatio = freqDays / 7; // ratio pour scaler les quantités

    var SHOP_SECTIONS = {
      '🥩 Boucherie & Poissonnerie': /poulet|dinde|boeuf|bœuf|saumon|thon|crevette|cabillaud|maquereau|sardine|filet|blanc de|hachis|steak|viande|kefta|merguez|agneau|veau|moule/i,
      '🥚 Œufs & Produits laitiers': /oeuf|œuf|yaourt|fromage|lait|beurre|crème fraîche|ricotta|parmesan|mozzarella|feta|skyr|mascarpone|cottage|kéfir/i,
      '🥦 Fruits & Légumes':         /courgette|tomate|épinard|carotte|oignon|ail|brocoli|poivron|chou|concombre|champignon|aubergine|céleri|salade|laitue|pousses|patate|avocat|citron|banane|mangue|fraise|myrtille|pomme|kiwi|ananas|raisin|pêche|poire|melon|pastèque|betterave|navet|poireau|fenouil|asperge|haricot vert|petit pois|maïs|roquette|mâche|cresson|bok choy|brocoli/i,
      '🌾 Féculents & Céréales':     /riz|pâtes|quinoa|flocons|avoine|soba|ramen|nouilles|couscous|semoule|lentilles|pois chiches|haricots|fèves|farine|pain|tortilla|pita|ciabatta|orge|épeautre|millet|sarrasin|boulgour|polenta/i,
      '🧊 Surgelés':                 /surgelé|congelé|frozen|açaï|edamame/i,
      '🥫 Conserves & Bocaux':       /boîte|tomates concassées|conserve|bocal|naturel en boîte|thon.*boîte|sardine.*boîte|pois chiches.*boîte|haricots.*boîte/i,
      '🫙 Épicerie sèche':           /huile|vinaigre|sauce soja|tahini|moutarde|pesto|miel|confiture|sirop|ketchup|mayonnaise|nuoc|miso|tamari|kecap|teriyaki|sriracha|fish sauce|worcestershire|bouillon|levure|chocolat|whey|prot[eé]ine.*poudre|caséine|collagène/i,
      '🌿 Épices & Herbes':          /cumin|paprika|cannelle|gingembre|curry|curcuma|coriandre|persil|basilic|origan|thym|ras el hanout|garam masala|chili|piment|safran|menthe|aneth|estragon|laurier|muscade|cardamome|clou|poivre|sel|sumac|zaatar|harissa|matcha|cacao/i,
      '🌰 Graines, Noix & Fruits secs': /sésame|amande|noix|cajou|chia|lin|cacahuète|pistache|noisette|graine de tournesol|graine de courge|raisin sec|abricot sec|datte|figue sèche|cranberry/i,
      '🥤 Boissons & Laits végétaux': /lait d.amande|lait de coco|lait végétal|lait de soja|lait de riz|lait d.avoine|jus|eau de coco|kombucha/i,
      '🍞 Boulangerie & Pâtisserie': /pain|baguette|brioche|wraps|tortilla|naan|pita|chapati/i,
      '❄️ Crèmerie & Fromages':     /fromage.*affiné|comté|emmental|gruyère|gouda|cheddar|camembert|brie|bleu/i,
      '🛒 Divers':                   /.*/
    };

    var consolidated = {};  // { 'ingredientName||unit': {name, qty, unit, recipes:[]} }
    var slots = ['breakfast', 'lunch', 'snack', 'dinner'];

    weekPlan.forEach(function(day) {
      slots.forEach(function(slot) {
        var recipe = day[slot];
        if (!recipe) return;

        var recipeName = recipe.n || recipe.name || slot;
        var scalingRatio = recipe._scalingRatio || 1;

        // Recettes R201+ : utilise les ingrédients scalés si disponibles
        if (recipe._id && recipe._scaledIngredients && recipe._scaledIngredients.length > 0) {
          recipe._scaledIngredients.forEach(function(ing) {
            var key = ing.name + '||' + ing.unit;
            if (!consolidated[key]) consolidated[key] = { name: ing.name, qty: 0, unit: ing.unit, recipes: [] };
            consolidated[key].qty += ing.scaledQty || ing.qty || 0;
            if (consolidated[key].recipes.indexOf(recipeName) < 0) consolidated[key].recipes.push(recipeName);
          });
        } else if (recipe._id && window.RecipeEngine && window.RecipeEngine.findRecipe) {
          // Recette R201+ sans ingrédients scalés : utilise findRecipe + scalingRatio
          var fullRecipe = window.RecipeEngine.findRecipe(recipe._id);
          if (fullRecipe && fullRecipe.ingredients) {
            fullRecipe.ingredients.forEach(function(ing) {
              var scaledQty = Math.round((ing.qty / fullRecipe.servings) * scalingRatio * 10) / 10;
              var key = ing.name + '||' + ing.unit;
              if (!consolidated[key]) consolidated[key] = { name: ing.name, qty: 0, unit: ing.unit, recipes: [] };
              consolidated[key].qty += scaledQty;
              if (consolidated[key].recipes.indexOf(recipeName) < 0) consolidated[key].recipes.push(recipeName);
            });
          } else if (recipe.i) {
            // Fallback : recette avec champ `i` string (cas de repas libres)
            var scalingRatioFallback = recipe._scalingRatio || 1;
            var parsedIngredients = parseIngredientsString(recipe.i);
            parsedIngredients.forEach(function(ing) {
              var qty = Math.round(ing.qty * scalingRatioFallback * 10) / 10;
              var key = ing.name + '||' + ing.unit;
              if (!consolidated[key]) consolidated[key] = { name: ing.name, qty: 0, unit: ing.unit, recipes: [] };
              consolidated[key].qty += qty;
              if (consolidated[key].recipes.indexOf(recipeName) < 0) consolidated[key].recipes.push(recipeName);
            });
          }
        } else if (recipe.i) {
          // Recette sans _id : parser le champ `i` string (fallback Repas libre)
          var parsedFallback = parseIngredientsString(recipe.i);
          parsedFallback.forEach(function(ing) {
            var key = ing.name + '||' + ing.unit;
            if (!consolidated[key]) consolidated[key] = { name: ing.name, qty: 0, unit: ing.unit, recipes: [] };
            consolidated[key].qty += ing.qty || 0;
            if (consolidated[key].recipes.indexOf(recipeName) < 0) consolidated[key].recipes.push(recipeName);
          });
        }
      });
    });

    // Regrouper par catégorie + arrondir aux quantités d'achat réalistes
    var categorized = {};
    Object.keys(consolidated).forEach(function(key) {
      var item = consolidated[key];
      // Appliquer le ratio fréquence de courses AVANT la conversion market qty
      if (freqRatio !== 1 && typeof item.qty === 'number') {
        item.qty = item.qty * freqRatio;
      }
      // Détecter la catégorie d'abord (nécessaire pour les règles de market qty)
      var cat = '🛒 Divers';
      var catKeys = Object.keys(SHOP_SECTIONS);
      for (var i = 0; i < catKeys.length - 1; i++) {
        if (SHOP_SECTIONS[catKeys[i]].test(item.name)) { cat = catKeys[i]; break; }
      }
      // Convertir en quantité d'achat réaliste (kg/L/boîte vs grammes nutritionnels)
      var mq = toMarketQty(item.name, item.qty, item.unit, cat);
      item.qty  = mq.qty;
      item.unit = mq.unit;
      if (!categorized[cat]) categorized[cat] = [];
      categorized[cat].push(item);
    });

    // Trier catégories et items
    var ORDER = ['🥩 Boucherie & Poissonnerie','🥚 Œufs & Produits laitiers','🥦 Fruits & Légumes','🌾 Féculents & Céréales','🧊 Surgelés','🥫 Conserves & Bocaux','🫙 Épicerie sèche','🌿 Épices & Herbes','🌰 Graines, Noix & Fruits secs','🥤 Boissons & Laits végétaux','🍞 Boulangerie & Pâtisserie','❄️ Crèmerie & Fromages','🛒 Divers'];
    var result = ORDER.filter(function(c) { return categorized[c] && categorized[c].length > 0; }).map(function(c) {
      return { category: c, items: categorized[c].sort(function(a,b){ return a.name.localeCompare(b.name); }) };
    });
    // Métadonnée : période couverte (affichée dans le header de la liste)
    var FREQ_LABELS = { daily: '1 jour', '2x_week': '4 jours', weekly: '7 jours', biweekly: '14 jours' };
    result._freqLabel = FREQ_LABELS[shopFreq] || '7 jours';
    result._freqDays = freqDays;
    return result;
  }

  // ─── EXPOSITION GLOBALE ────────────────────────────────────────────────────────
  window.RecipeEngine = {
    getAdaptedRecipe: getAdaptedRecipe,
    filterRecipes:    filterRecipes,
    findRecipe:       findRecipe,
    listRecipeIds:    listRecipeIds,
    calcRecipeCost:   calcRecipeCost,
    calcDailyBudget:      calcDailyBudget,
    calcWeeklyBudget:     calcWeeklyBudget,
    calcWeekPlanBudget:   calcWeekPlanBudget,
    generateShoppingList:    generateShoppingList,
    parseIngredientsString:  parseIngredientsString,
    convertToDisplay:        convertToDisplay,
    getPool:          getPool,
    db:               RECIPES_DB
  };

})();
