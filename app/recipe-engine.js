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
        { name: 'Citronelle', qty: 1, unit: 'pce' },
        { name: 'Citron vert (jus)', qty: 2, unit: 'pce' },
        { name: 'Sauce poisson', qty: 20, unit: 'ml' },
        { name: 'Piment rouge', qty: 1, unit: 'pce' }
      ],
      steps: [
        'Chauffer bouillon avec galanga, citronelle écrasée et piment 5 min.',
        'Ajouter lait de coco, porter à frémissement. Incorporer poulet en dés et champignons.',
        'Cuire 10 min. Assaisonner sauce poisson et jus citron vert. Servir chaud.'
      ]
    },
    {
      id: 'R222',
      name: 'Pasta Pesto Poulet',
      category: 'world-food',
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
      name: 'Salade Niçoise au Thon',
      category: 'world-food',
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
        { name: 'Citronelle', qty: 2, unit: 'pce' },
        { name: 'Galanga (ou gingembre)', qty: 20, unit: 'g' },
        { name: 'Sauce poisson', qty: 20, unit: 'ml' },
        { name: 'Citron vert (jus)', qty: 2, unit: 'pce' },
        { name: 'Piment rouge', qty: 2, unit: 'pce' },
        { name: 'Tomates cerises', qty: 80, unit: 'g' }
      ],
      steps: [
        'Chauffer bouillon avec citronelle, galanga, piment 8 min.',
        'Ajouter champignons et tomates cerises, cuire 4 min.',
        'Incorporer crevettes, cuire 3 min. Finir sauce poisson + citron vert. Servir chaud.'
      ]
    },
    {
      id: 'R249',
      name: 'Bowl Mangue Protéiné',
      category: 'world-food',
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
      tags: ['instagram', 'tiktok-viral', 'high-carb', 'vegan', 'brunch'],
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
      name: 'Butter Chicken Light',
      category: 'world-food',
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
      tags: ['instagram', 'trending', 'vegan', 'low-carb', 'meal-prep'],
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
      tags: ['trending', 'instagram', 'vegan', 'low-carb', 'light', 'soup'],
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
      tags: ['instagram', 'trending', 'vegan', 'low-carb', 'light', 'refreshing'],
      servings: 4,
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
      tags: ['tiktok-viral', 'instagram', 'vegan', 'high-carb', 'baked', 'meal-prep'],
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
  function filterRecipes(userState, filters) {
    filters = filters || {};
    var mealTarget = userState && userState.caloriesTarget
      ? Math.round(userState.caloriesTarget * DEFAULT_MEAL_FRACTION)
      : null;

    return RECIPES_DB.filter(function (r) {
      if (filters.category && r.category !== filters.category) return false;
      if (filters.difficulty && r.difficulty !== filters.difficulty) return false;
      if (filters.maxPrepTime && (r.prepTime + r.cookTime) > filters.maxPrepTime) return false;
      if (filters.tags && filters.tags.length) {
        var hasAll = filters.tags.every(function (t) { return r.tags.indexOf(t) !== -1; });
        if (!hasAll) return false;
      }
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
      var caloriesPerServing = recipe.baseNutrition.calories / recipe.servings;
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

  function toSimpleFormat(recipe) {
    var perServing = recipe.servings > 0 ? recipe.servings : 1;
    var flagMap = { 'maroc-moderne': '🇲🇦', 'world-food': '🌍' };
    var ingrStr = recipe.ingredients.map(function(ing) {
      return ing.qty + (ing.unit === 'pce' ? ' pce ' : ing.unit === 'ml' ? 'ml ' : 'g ') + ing.name;
    }).join(', ');
    return {
      n:    recipe.name,
      f:    flagMap[recipe.category] || '🌍',
      k:    Math.round(recipe.baseNutrition.calories   / perServing),
      p:    Math.round(recipe.baseNutrition.proteinGrams / perServing),
      g:    Math.round(recipe.baseNutrition.carbsGrams  / perServing),
      l:    Math.round(recipe.baseNutrition.fatGrams    / perServing),
      i:    ingrStr,
      st:    recipe.steps || [],
      w:    recipe.tags.indexOf('whey') >= 0,
      tags: recipe.tags || [],
      lv:   recipe.difficulty || 1,
      _id:  recipe.id   // lien vers la recette complète
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
   * Fusionne recipes-db.js (ancien format) + RECIPES_DB R201+ (nouveau format converti).
   * @param {'breakfast'|'lunch'|'snack'|'dinner'} mealType
   * @returns {Array} Pool de recettes au format simplifié
   */
  function getPool(mealType) {
    // Base : anciens pools depuis recipes-db.js
    var oldPool = [];
    if (mealType === 'breakfast' && window.breakfast) oldPool = window.breakfast.slice();
    else if (mealType === 'lunch'  && window.lunch)   oldPool = window.lunch.slice();
    else if (mealType === 'snack'  && window.snack)   oldPool = window.snack.slice();
    else if (mealType === 'dinner' && window.dinner)  oldPool = window.dinner.slice();

    // Ajout : nouvelles recettes R201+ converties au format simplifié
    var oldNames = {};
    oldPool.forEach(function(r) { oldNames[r.n] = true; });

    RECIPES_DB.forEach(function(recipe) {
      var type = classifyMealType(recipe);
      var include = (type === mealType) ||
                    (type === 'both' && (mealType === 'lunch' || mealType === 'dinner'));
      if (!include) return;
      var simple = toSimpleFormat(recipe);
      if (!oldNames[simple.n]) {   // évite les doublons par nom
        oldPool.push(simple);
        oldNames[simple.n] = true;
      }
    });

    return oldPool;
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
      // Chercher nombre + unité en fin de chaîne
      var m = part.match(/^(.+?)\s+([\d.]+)\s*(g|ml|kg|l|pce|cs|cc|cl)$/i);
      if (m) {
        return { name: m[1].trim(), qty: parseFloat(m[2]), unit: m[3].toLowerCase() };
      }
      // Fallback: pas d'unité trouvée mais nombre présent
      var m2 = part.match(/^(.+?)\s+([\d.]+)$/);
      if (m2) return { name: m2[1].trim(), qty: parseFloat(m2[2]), unit: 'g' };
      // Dernier recours: pas de quantité
      return { name: part, qty: 1, unit: 'pce' };
    }).filter(function(x) { return x.name && x.name.length > 0; });
  }

  /**
   * Génère la liste de courses consolidée depuis un weekPlan.
   * Regroupe les ingrédients identiques, somme les quantités, catégorise.
   * @param {Array} weekPlan  — window.S.weekPlan
   * @returns {Array<{category, items: Array<{name, qty, unit, recipes}>}>}
   */
  function generateShoppingList(weekPlan) {
    if (!weekPlan || !weekPlan.length) return [];

    var SHOP_SECTIONS = {
      '🥩 Boucherie & Poissonnerie': /poulet|dinde|boeuf|bœuf|saumon|thon|crevette|cabillaud|maquereau|sardine|filet|blanc de|hachis|steak|viande|kefta|merguez|agneau|veau|moule/i,
      '🥚 Œufs & Produits laitiers': /oeuf|œuf|yaourt|fromage|lait|beurre|crème fraîche|ricotta|parmesan|mozzarella|feta|skyr|mascarpone|cottage|kéfir/i,
      '🥦 Fruits & Légumes':         /courgette|tomate|épinard|carotte|oignon|ail|brocoli|poivron|chou|concombre|champignon|aubergine|céleri|salade|laitue|pousses|patate|avocat|citron|banane|mangue|fraise|myrtille|pomme|kiwi|ananas|raisin|datte|pêche|poire|melon|pastèque|betterave|navet|poireau|fenouil|asperge|haricot vert|petit pois|maïs|roquette|mâche|cresson|bok choy|brocoli/i,
      '🌾 Féculents & Céréales':     /riz|pâtes|quinoa|flocons|avoine|soba|ramen|nouilles|couscous|semoule|lentilles|pois chiches|haricots|fèves|farine|pain|tortilla|pita|ciabatta|orge|épeautre|millet|sarrasin|boulgour|polenta/i,
      '🧊 Surgelés':                 /surgelé|congelé|frozen|açaï|edamame/i,
      '🥫 Conserves & Bocaux':       /boîte|tomates concassées|conserve|bocal|naturel en boîte|thon.*boîte|sardine.*boîte|pois chiches.*boîte|haricots.*boîte/i,
      '🫙 Épicerie sèche':           /huile|vinaigre|sauce soja|tahini|moutarde|pesto|miel|confiture|sirop|ketchup|mayonnaise|nuoc|miso|tamari|kecap|teriyaki|sriracha|fish sauce|worcestershire|bouillon|levure/i,
      '🌿 Épices & Herbes':          /cumin|paprika|cannelle|gingembre|curry|curcuma|coriandre|persil|basilic|origan|thym|ras el hanout|garam masala|chili|piment|safran|menthe|aneth|estragon|laurier|muscade|cardamome|clou|poivre|sel|sumac|zaatar|harissa/i,
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
            // Recette legacy (L0XX) : findRecipe ne la trouve pas dans RECIPES_DB,
            // fallback sur le champ `i` string
            var scalingRatioLegacy = recipe._scalingRatio || 1;
            var parsedIngredients = parseIngredientsString(recipe.i);
            parsedIngredients.forEach(function(ing) {
              var qty = Math.round(ing.qty * scalingRatioLegacy * 10) / 10;
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

    // Regrouper par catégorie
    var categorized = {};
    Object.keys(consolidated).forEach(function(key) {
      var item = consolidated[key];
      item.qty = Math.round(item.qty * 10) / 10;
      var cat = '🛒 Divers';
      var catKeys = Object.keys(SHOP_SECTIONS);
      for (var i = 0; i < catKeys.length - 1; i++) {
        if (SHOP_SECTIONS[catKeys[i]].test(item.name)) { cat = catKeys[i]; break; }
      }
      if (!categorized[cat]) categorized[cat] = [];
      categorized[cat].push(item);
    });

    // Trier catégories et items
    var ORDER = ['🥩 Boucherie & Poissonnerie','🥚 Œufs & Produits laitiers','🥦 Fruits & Légumes','🌾 Féculents & Céréales','🧊 Surgelés','🥫 Conserves & Bocaux','🫙 Épicerie sèche','🌿 Épices & Herbes','🌰 Graines, Noix & Fruits secs','🥤 Boissons & Laits végétaux','🍞 Boulangerie & Pâtisserie','❄️ Crèmerie & Fromages','🛒 Divers'];
    return ORDER.filter(function(c) { return categorized[c] && categorized[c].length > 0; }).map(function(c) {
      return { category: c, items: categorized[c].sort(function(a,b){ return a.name.localeCompare(b.name); }) };
    });
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
    getPool:          getPool,
    db:               RECIPES_DB
  };

})();
