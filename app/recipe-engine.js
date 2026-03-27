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

  // ─── EXPOSITION GLOBALE ────────────────────────────────────────────────────────
  window.RecipeEngine = {
    // API principale
    getAdaptedRecipe: getAdaptedRecipe,
    filterRecipes:    filterRecipes,
    findRecipe:       findRecipe,
    listRecipeIds:    listRecipeIds,
    // Accès direct à la DB (lecture seule)
    db:               RECIPES_DB
  };

})();
