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
  //   prepTime (min), cookTime (min), difficulty (1-3), videoUrl,
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
      videoUrl: 'https://www.youtube.com/results?search_query=tajine+poulet+chermoula+marocain+facile',
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
      videoUrl: 'https://www.youtube.com/results?search_query=pastilla+dinde+legere+recette+marocaine',
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
      videoUrl: 'https://www.youtube.com/results?search_query=salade+marocaine+thon+pois+chiches+proteine+healthy',
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
      videoUrl: 'https://www.youtube.com/results?search_query=kefta+dinde+four+healthy+marocaine',
      // 88×4 + 10×4 + 14×9 = 352+40+126 = 518 ✓
      baseNutrition: { calories: 518, proteinGrams: 88, carbsGrams: 10, fatGrams: 14 },
      ingredients: [
        { name: 'Hachis de dinde',    qty: 500, unit: 'g' },
        { name: 'Œuf',                qty: 1,   unit: 'pce' },
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
      videoUrl: 'https://www.youtube.com/results?search_query=harira+marocaine+recette+facile+rapide',
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
      videoUrl: 'https://www.youtube.com/results?search_query=poulet+mechoui+four+recette+marocaine+epices',
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
      videoUrl: 'https://www.youtube.com/results?search_query=poke+bowl+saumon+avocat+recette+maison',
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
      videoUrl: 'https://www.youtube.com/results?search_query=shakshuka+epinards+feta+recette+facile',
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
      videoUrl: 'https://www.youtube.com/results?search_query=one+pot+pasta+thon+facile+rapide',
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
      videoUrl: 'https://www.youtube.com/results?search_query=buddha+bowl+pois+chiches+rotis+tahini+vegan',
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
    }

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
    var caloriesPerServing = recipe.baseNutrition.calories / recipe.servings;
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
      videoUrl:     recipe.videoUrl,
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
    var totalMAD = 0;

    recipe.ingredients.forEach(function (ing) {
      var unitPrice = window.getPricePer(ing.name, ing.unit);
      if (unitPrice === null || unitPrice === undefined) return;
      var scaledQty = (ing.qty / recipe.servings) * scalingRatio;
      var cost = Math.round(scaledQty * unitPrice * 100) / 100;
      totalMAD += cost;
      breakdown.push({ name: ing.name, qty: Math.round(scaledQty * 10) / 10, unit: ing.unit, unitPrice: unitPrice, cost: cost });
    });

    totalMAD = Math.round(totalMAD * 100) / 100;
    return {
      recipeId: recipeId,
      recipeName: recipe.name,
      totalMAD: totalMAD,
      pricePerServing: Math.round((totalMAD / recipe.servings) * 100) / 100,
      breakdown: breakdown
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

  // ─── EXPOSITION GLOBALE ────────────────────────────────────────────────────────
  window.RecipeEngine = {
    getAdaptedRecipe: getAdaptedRecipe,
    filterRecipes:    filterRecipes,
    findRecipe:       findRecipe,
    listRecipeIds:    listRecipeIds,
    calcRecipeCost:   calcRecipeCost,
    calcDailyBudget:  calcDailyBudget,
    calcWeeklyBudget: calcWeeklyBudget,
    db:               RECIPES_DB
  };

})();
