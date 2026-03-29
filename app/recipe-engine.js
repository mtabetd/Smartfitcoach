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
        'Préparer la chermoula : écraser l\'ail au sel, mélanger cumin, paprika, gingembre, jus de citron et huile d\'olive. Masser le poulet et laisser mariner 10 min à température ambiante.',
        'Chauffer le tajine ou une cocotte à feu vif. Saisir le poulet mariné 3 min côté lisse sans toucher — il doit se détacher seul — puis retourner 2 min.',
        'Baisser à feu moyen, ajouter l\'oignon émincé en fines demi-lunes. Laisser fondre 3 min en grattant les sucs de cuisson.',
        'Déposer tomates coupées en quartiers, courgettes en sifflet épais et pois chiches. Verser 3 cuillères à soupe d\'eau. Couvrir hermétiquement.',
        'Mijoter à feu doux 20 min. Soulever le couvercle, goûter, rectifier sel et cumin. Laisser reposer 5 min hors feu, couvercle fermé.',
        'Ciseler la coriandre fraîche à la dernière seconde et parsemer au service pour préserver ses arômes volatils.'
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
        'Dans une cocotte, faire revenir l\'oignon émincé dans l\'huile à feu moyen jusqu\'à transparence. Ajouter la dinde en morceaux, le safran infusé dans 2 c. à soupe d\'eau chaude, le gingembre, la cannelle et 150 ml d\'eau. Cuire à couvert 20 min.',
        'Effilocher la dinde à la fourchette dans son jus. Remettre sur feu vif pour réduire le liquide jusqu\'à ce qu\'il soit quasi absorbé — la farce ne doit pas être humide.',
        'Battre les œufs à la fourchette, les verser dans la farce chaude hors feu et brouiller doucement : ils doivent rester moelleux, pas caoutchouteux. Réserver.',
        'Torréfier les amandes à sec dans une poêle 2 min jusqu\'à dorure. Concasser grossièrement au couteau — jamais au mixeur pour garder la texture.',
        'Huiler légèrement un plat. Superposer 3 feuilles de brick en les faisant déborder. Garnir : dinde-œufs, puis amandes. Rabattre les feuilles, couvrir des 3 dernières feuilles huilées en dessous. Cuire four 200 °C, 15-18 min jusqu\'à dorure profonde.',
        'Saupoudrer sucre glace + cannelle à la sortie du four. Servir immédiatement — la croustillance se perd en 10 min.'
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
        'Rincer et égoutter soigneusement les pois chiches à l\'eau froide. Sécher le thon sur du papier absorbant — une garniture sèche accroche mieux l\'assaisonnement.',
        'Tailler les tomates en brunoise irrégulière, saler légèrement et laisser dégorger 5 min dans une passoire. Cette étape évite une salade détrempée.',
        'Couper concombre en demi-lunes de 4 mm. Émincer l\'oignon rouge très fin ; le passer 2 min sous l\'eau froide pour adoucir son âcreté tout en conservant le croquant.',
        'Préparer la vinaigrette directement dans le saladier : jus de citron + sel + cumin, puis fouetter l\'huile d\'olive en filet pour émulsionner.',
        'Assembler dans l\'ordre : pois chiches, légumes, thon en gros morceaux (ne pas émietter), olives. Mélanger délicatement une seule fois pour ne pas casser le thon. Rectifier sel et citron.'
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
        'Hacher finement oignon, ail, persil et coriandre au couteau — jamais au robot qui les rend aqueux. Essorer légèrement les herbes dans les mains pour évacuer l\'excès d\'humidité.',
        'Mélanger hachis de dinde, œuf, herbes et épices dans un bol froid. Travailler 1 min à la main jusqu\'à homogénéité — trop travailler rend la texture caoutchouteuse.',
        'Préchauffer le four à 210 °C. Former des keftas de 8 cm de long en les roulant entre les paumes mouillées pour une surface lisse qui ne craquèle pas à la cuisson.',
        'Déposer sur plaque légèrement huilée. Badigeonner d\'un filet d\'huile d\'olive avec un pinceau — cette fine couche crée une croûte dorée sans ajouter de matière grasse inutile.',
        'Cuire 10 min. Retourner délicatement avec une spatule plate. Poursuivre 8-10 min. La kefta est cuite quand elle résiste légèrement sous le doigt et affiche une belle coloration ambrée.'
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
        'Dans une grande cocotte, dorer le bœuf haché à feu vif sans remuer pendant 2 min pour qu\'il prenne de la couleur. Ajouter l\'oignon émincé, baisser à feu moyen et cuire 3 min en remuant.',
        'Ajouter tomates concassées, safran, cumin, cannelle, gingembre. Faire compoter 5 min à découvert — cette réduction concentre les arômes avant l\'ajout de l\'eau.',
        'Verser 1 litre d\'eau bouillante (jamais froide : le choc thermique cuit mal les légumineuses). Incorporer les lentilles rincées et les pois chiches. Porter à frémissement, écumer si nécessaire.',
        'Mijoter 20 min à feu doux à couvert. Ajouter le céleri en brunoise. Prolonger 10 min.',
        'Verser les vermicelles. Cuire 5 min en remuant souvent — ils absorbent vite. Ajuster la consistance avec un peu d\'eau si nécessaire : la harira doit napper la cuillère.',
        'Hors feu, incorporer herbes fraîches ciselées et jus de citron. Ne jamais cuire les herbes : les ajouter à la dernière seconde préserve leur arôme et leur couleur verte.'
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
        'Écraser l\'ail au sel en pâte lisse avec le plat du couteau. Mélanger avec huile d\'olive, jus de citron et toutes les épices. La pâte doit être dense et parfumée.',
        'Inciser les cuisses en croix profondes jusqu\'à l\'os — cette technique n\'est pas décorative, elle permet à la marinade de pénétrer en profondeur et accélère la cuisson au cœur.',
        'Masser généreusement y compris dans les incisions. Laisser mariner au minimum 30 min à température ambiante, ou idéalement 2 h au réfrigérateur.',
        'Préchauffer four à 220 °C avec la plaque vide à l\'intérieur. Déposer les cuisses côté peau sur la plaque chaude : le choc thermique immédiat saisit la peau et la rend croustillante.',
        'Cuire 20 min à 220 °C pour la croûte. Baisser à 180 °C, arroser du jus de cuisson recueilli dans la plaque. Poursuivre 20-25 min jusqu\'à 75 °C à cœur.'
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
        'Cuire le riz basmati avec une pincée de sel. À la cuisson, étaler sur une plaque et laisser refroidir à l\'air libre — ce séchage rapide donne une texture légèrement ferme et non collante, essentielle pour un poke.',
        'Tailler le saumon en cubes de 2 cm nets au couteau bien affûté en un seul geste — scier le poisson l\'écrase. Préparer la marinade : sauce soja + gingembre râpé fin + huile de sésame + jus de citron vert. Mariner 8 min maximum, pas plus.',
        'Décongeler les edamame à l\'eau bouillante 2 min. Tailler la carotte en julienne fine au couteau. Trancher le concombre en biais pour l\'élégance visuelle.',
        'Trancher l\'avocat à la dernière minute et citronner immédiatement pour éviter l\'oxydation.',
        'Monter le bol dans l\'ordre : riz froid, puis chaque ingrédient en zone séparée côte à côte — ne jamais tout mélanger avant service, la présentation est la moitié du plaisir.'
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
        'Chauffer l\'huile d\'olive dans une sauteuse à bords hauts. Faire revenir oignon émincé à feu moyen 4 min jusqu\'à légère coloration. Ajouter l\'ail haché et les épices, cuire 1 min en remuant : les épices doivent "fleurir" dans la matière grasse pour libérer leurs huiles essentielles.',
        'Verser les tomates concassées. Monter le feu pour faire bouillonner 2 min, puis réduire et mijoter 8 min à couvert. La sauce doit légèrement se concentrer et perdre son acidité crue.',
        'Ajouter les épinards en une seule fois. Couvrir 2 min — ils vont fondre dans la vapeur. Remuer pour les répartir. La sauce doit rester dense.',
        'Creuser 4 puits bien distincts avec le dos d\'une cuillère. Casser délicatement 1 œuf dans chaque puits en le maintenant bas au-dessus de la sauce pour ne pas casser le jaune.',
        'Émietter la feta grossièrement au-dessus. Couvrir et cuire à feu très doux 6-7 min : le blanc doit être pris, le jaune encore coulant — c\'est le moment parfait.'
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
        'Dans une grande sauteuse ou casserole à fond épais, faire revenir oignon émincé dans l\'huile à feu vif 2 min. Ajouter l\'ail haché, cuire 30 secondes — il doit blondir légèrement sans brûler.',
        'Verser les tomates concassées. Laisser compoter 3 min à feu vif pour évaporer l\'excédent d\'eau et concentrer l\'acidité. Ajouter origan, basilic, sel et poivre.',
        'Verser les pâtes crues directement dans la sauce. Couvrir d\'eau bouillante à hauteur exacte (environ 400 ml). Porter à ébullition vive.',
        'Cuire 12-14 min à feu moyen en remuant toutes les 2 min pour libérer l\'amidon : c\'est cet amidon qui lie la sauce et la rend soyeuse, sans aucun ajout de matière grasse.',
        'Hors feu, lorsque les pâtes sont al dente et le liquide quasi absorbé, incorporer le thon égoutté en gros morceaux et les épinards. Couvrir 1 min — la chaleur résiduelle suffit à tout finir.'
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
        'Rincer et sécher soigneusement les pois chiches avec du papier absorbant — l\'humidité est l\'ennemi du croustillant. Laisser sécher à l\'air 10 min si possible.',
        'Préchauffer le four à 210 °C. Enrober les pois chiches secs d\'huile d\'olive, cumin, paprika fumé et sel. Étaler en couche unique sur plaque, sans chevauchement. Rôtir 25 min en secouant la plaque à mi-cuisson — ils doivent être bien dorés et croquants.',
        'Cuire le riz basmati. Émincer finement le chou rouge au couteau (jamais à la mandoline pour ce plat : les lanières au couteau ont plus de mâche). Râper la carotte en julienne.',
        'Sauce tahini : fouetter tahini + jus de citron + ail râpé + sel. Ajouter l\'eau froide cuillère par cuillère en fouettant jusqu\'à obtenir une sauce blanche et crémeuse — le tahini s\'éclaircit à mesure qu\'on ajoute l\'eau.',
        'Assembler le bol dans l\'ordre : riz, puis chaque composant en secteurs distincts. Trancher l\'avocat à la dernière seconde. Déposer les pois chiches chauds et croustillants en dernier.',
        'Napper de sauce tahini en filet. Parsemer de persil ciselé. Servir immédiatement pour préserver le contraste chaud-croustillant des pois chiches.'
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
        'Faire chauffer l\'huile à feu vif jusqu\'à frémissement. Saisir l\'oignon émincé 4 min en remuant sans cesse, il doit devenir translucide et légèrement coloré.',
        'Baisser à feu moyen, ajouter l\'ail haché et le curry. Torréfier les épices 90 secondes en mélangeant : elles doivent embaumer sans brûler.',
        'Verser les tomates concassées, racler les sucs au fond de la casserole. Ajouter les pois chiches égouttés et le lait de coco. Porter à ébullition.',
        'Réduire le feu, laisser mijoter 15 min à couvert jusqu\'à ce que la sauce épaississe et nappe la cuillère.',
        'Hors du feu, incorporer les épinards frais par poignées successives en remuant ; ils tombent en 2 min — ne pas les surcuire.',
        'Cuire le riz basmati à l\'eau froide départ, porter à ébullition puis couvrir et éteindre le feu 12 min. Servir le curry sur le riz, ajuster le sel.'
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
        'Cuire le riz basmati par absorption (ratio 1:1,5 eau). Pendant ce temps, assaisonner le bœuf haché avec la sauce soja et la moitié du gochujang.',
        'Saisir le bœuf à feu vif dans une poêle très chaude sans matière grasse ajoutée, 3 min en écrasant à la spatule pour obtenir de belles parties caramélisées. Réserver.',
        'Dans la même poêle avec une goutte d\'huile de sésame, sauter les carottes râpées 2 min seules, puis la courgette en julienne 2 min, enfin les épinards 1 min. Chaque légume garde sa texture et sa couleur.',
        'Dans la même poêle, verser le reste d\'huile de sésame et cuire les œufs au plat à feu doux-moyen, jaune coulant — c\'est lui qui sert de sauce.',
        'Dresser dans des bols larges et chauds : riz au centre, légumes disposés en quartiers distincts, bœuf, puis l\'œuf au plat par-dessus.',
        'Déposer le reste de gochujang sur le jaune. Mélanger vigoureusement au moment de servir.'
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
        'Tremper les nouilles de riz 8 min dans l\'eau chaude (pas bouillante), égoutter et réserver — elles finissent de cuire dans le wok.',
        'Chauffer le wok à feu maximum jusqu\'à légère fumée. Verser l\'huile d\'arachide, saisir les crevettes 90 secondes en une seule couche sans les bouger, puis les retourner 30 secondes. Retirer et réserver.',
        'Casser les œufs directement dans le wok, brouiller 30 secondes à la spatule en les cassant en petits morceaux avant qu\'ils soient totalement pris.',
        'Ajouter les nouilles égouttées, verser aussitôt la sauce tamari et le jus de citron vert. Sauter à feu vif 2 min en soulevant continuellement.',
        'Incorporer les crevettes réservées et les pousses de soja. Mélanger 1 min — les pousses doivent rester croquantes.',
        'Dresser, garnir d\'oignon vert ciselé et de cacahuètes concassées. Servir immédiatement, le pad thai ne supporte pas l\'attente.'
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
        'Chauffer l\'huile dans une casserole à fond épais. Faire revenir l\'oignon émincé à feu moyen 5 min jusqu\'à légère coloration dorée — cette caramélisation donne la base sucrée du dal.',
        'Ajouter l\'ail et le gingembre râpés puis le curry en poudre. Torréfier 90 secondes en remuant constamment.',
        'Incorporer les tomates concassées, racler le fond, laisser réduire 3 min jusqu\'à ce que la sauce soit sèche et concentrée.',
        'Verser les lentilles corail rincées, le lait de coco et 400 ml d\'eau. Porter à ébullition, puis réduire à feu doux et cuire 20 min à couvert en remuant de temps en temps.',
        'Lorsque les lentilles sont fondantes, écraser grossièrement 1/3 du mélange contre la paroi à la cuillère en bois pour lier naturellement le dal — inutile d\'utiliser un mixeur.',
        'Cuire le riz basmati à part. Vérifier l\'assaisonnement du dal, servir sur le riz avec un filet de jus de citron frais pour relever l\'ensemble.'
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
        'Pocher les blancs de poulet dans le bouillon frémissant (jamais bouillant) 15 min. Retirer, couvrir de film alimentaire et laisser reposer 5 min avant d\'effilocher à la fourchette — la chair reste moelleuse.',
        'Porter à ébullition une casserole d\'eau séparée. Cuire les œufs exactement 6 min 30, plonger immédiatement dans l\'eau glacée, écaler délicatement. Le jaune sera encore fondant.',
        'Faire revenir les champignons shiitake tranchés à sec dans une poêle anti-adhésive 3 min à feu vif jusqu\'à légère dorure.',
        'Cuire les nouilles ramen al dente selon le paquet (généralement 2-3 min), égoutter.',
        'Assaisonner le bouillon chaud avec la sauce soja et l\'huile de sésame. Goûter — le bouillon doit être puissant car les nouilles vont le diluer.',
        'Dresser en bols préchauffés : nouilles, bouillon bien chaud versé à la louche, poulet effiloché, champignons, maïs, œuf coupé en deux. Garnir d\'oignon vert ciselé.'
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
        'Cuire le riz basmati par absorption. Pendant ce temps, assaisonner généreusement les blancs de poulet avec cumin, sel, poivre des deux côtés.',
        'Chauffer une poêle en fonte ou à fond épais à feu vif jusqu\'à légère fumée. Saisir le poulet à sec 3 min sans le bouger pour former une croûte caramélisée, puis retourner et cuire 3 min. Laisser reposer 5 min avant de trancher.',
        'Dans la même poêle, faire sauter les haricots noirs égouttés avec une pincée de cumin 2 min pour les réchauffer et les parfumer.',
        'Préparer la salsa : tomates cerises coupées en deux, oignon rouge ciselé fin, jus de citron vert, sel. Laisser macérer 5 min.',
        'Écraser l\'avocat à la fourchette avec sel, poivre et une giclée de jus de citron vert — garder quelques morceaux pour la texture.',
        'Assembler les bols : riz, haricots, poulet tranché, salsa, guacamole. Napper de yaourt grec comme ersatz de crème fraîche. Servir sans attendre.'
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
        'Couper le poulet en lanières régulières de 1 cm d\'épaisseur — l\'uniformité garantit une cuisson homogène. Délayer la fécule de maïs dans la sauce soja froide.',
        'Chauffer le wok à feu maximum 2 min. Verser l\'huile de sésame, saisir les lanières de poulet en une seule couche 3 min sans y toucher, retourner et cuire 1 min. Retirer et réserver.',
        'Sans baisser le feu, faire revenir l\'ail et le gingembre émincés 30 secondes — ils doivent grésiller fort, pas brûler.',
        'Ajouter les carottes en julienne, cuire 2 min à feu vif. Ajouter le brocoli en fleurettes, cuire 2 min. Enfin le poivron rouge en lamelles, cuire 1 min. Chaque légume garde sa couleur vive.',
        'Remettre le poulet, verser la sauce soja-fécule. Mélanger 1 min à feu vif — la sauce va nappe et coller aux ingrédients.',
        'Vérifier l\'assaisonnement, dresser immédiatement. Les légumes doivent rester croquants, le poulet brillant et laqué.'
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
        'Sortir le poulet du réfrigérateur 10 min avant la cuisson. Assaisonner sel et poivre. Chauffer la poêle à feu vif avec l\'huile d\'olive, saisir le poulet 4 min côté lisse sans y toucher pour former une belle croûte dorée.',
        'Retourner, réduire à feu moyen, couvrir et cuire 5-6 min. Laisser reposer 5 min enveloppé dans du papier aluminium avant de trancher en biais.',
        'Préparer la sauce : écraser l\'ail en purée fine avec une pincée de sel, fouetter avec le yaourt grec, la moutarde de Dijon, le jus de citron et l\'huile d\'olive versée en filet pour émulsionner.',
        'Déchirer la laitue romaine à la main en morceaux généreux — ne jamais la couper au couteau, les feuilles déchirent le long de leurs fibres naturelles et restent plus croquantes.',
        'Dans un grand saladier, enrober la laitue de sauce en la soulevant depuis le dessous. Ajouter la moitié du parmesan râpé, mélanger.',
        'Dresser en assiettes, disposer les tranches de poulet en éventail, les croûtons de pain complet, le reste de parmesan. Servir sans attendre.'
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
        'Mariner le poulet minimum 20 min (idéalement 1h) dans l\'huile d\'olive, le jus de citron, l\'origan, sel et poivre — l\'acidité attendrit la fibre musculaire.',
        'Égoutter le poulet de sa marinade avant cuisson. Chauffer une poêle grill ou en fonte à feu vif, saisir les filets 4 min sans les bouger pour des marques nettes. Retourner, cuire 3-4 min. Laisser reposer 5 min.',
        'Préparer le tzatziki : râper le concombre, presser fermement dans un torchon pour éliminer l\'eau — c\'est le geste essentiel pour un tzatziki épais et non liquide. Mélanger avec le yaourt grec, l\'ail râpé et le sel.',
        'Trancher le poulet reposé en fines lamelles en biais pour maximiser la surface.',
        'Réchauffer les pitas 1 min de chaque côté dans la poêle à sec ou directement sur la flamme pour les assouplir et les parfumer.',
        'Garnir généreusement : tzatziki d\'abord, puis poulet, tomates en dés, oignon rouge finement ciselé. Servir plié ou ouvert.'
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
        'Assaisonner les blancs de poulet avec le cumin, sel, poivre. Chauffer la poêle avec l\'huile à feu vif. Saisir le poulet 4 min côté lisse sans le bouger — il doit se détacher seul de la poêle quand il est prêt.',
        'Retourner, réduire à feu moyen, couvrir et cuire 4 min. Laisser reposer 5 min avant d\'émincer en fines lanières.',
        'Pendant la cuisson, écraser l\'avocat à la fourchette avec le jus de citron vert, sel, poivre. Conserver la texture grossière — un guacamole lisse est sans intérêt.',
        'Préparer la salsa rapide : dés de tomates, oignon rouge ciselé très fin, une pincée de sel. Mélanger, laisser dégorger 3 min, égoutter.',
        'Réchauffer les tortillas à sec dans la poêle encore chaude, 20 secondes de chaque côté — elles deviennent souples et légèrement grillées.',
        'Garnir chaque tortilla : guacamole en base, lanières de poulet, salsa égouttée, une cuillerée de yaourt grec. Servir immédiatement plié en deux.'
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
        'Écraser la citronnelle à plat avec le dos du couteau pour libérer ses huiles essentielles. Tailler le galanga (ou gingembre) en fines rondelles biseautées.',
        'Porter le bouillon à 90 °C (frémissement, pas ébullition). Infuser citronnelle, galanga et piment entier 8 min à couvert, puis retirer ces aromates à l\'écumoire.',
        'Ajouter le lait de coco, ramener à frémissement doux. Incorporer les champignons émincés et le poulet coupé en morceaux réguliers de 3 cm.',
        'Cuire 8–10 min à feu doux : le poulet doit rester moelleux, jamais bouilli. Vérifier la cuisson en coupant un morceau — chair blanche et juteuse.',
        'Hors du feu, assaisonner avec la sauce poisson et le jus de citron vert pressé au dernier moment pour garder sa fraîcheur.',
        'Servir immédiatement dans des bols chauds. Un filet de jus de citron vert à table rehausse le tout à la dernière seconde.'
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
        'Porter une grande casserole d\'eau fortement salée (10 g/litre) à ébullition. Cuire les penne 1 min de moins que le temps indiqué sur le paquet — ils finiront dans la poêle.',
        'Pendant ce temps, chauffer l\'huile d\'olive à feu vif. Saisir les dés de poulet en une seule couche sans les toucher 3 min pour obtenir une belle coloration dorée, puis retourner 2 min. Ajouter l\'ail haché en fin de cuisson seulement.',
        'Réserver 80 ml d\'eau de cuisson des pâtes avant d\'égoutter. C\'est votre liant naturel, riche en amidon.',
        'Hors du feu, mélanger pâtes égouttées, pesto et 40 ml d\'eau de cuisson. Incorporer le reste de l\'eau si nécessaire pour obtenir une sauce soyeuse qui enrobe chaque penne.',
        'Ajouter le poulet et les tomates cerises coupées en deux. Un seul tour de mélange délicat pour ne pas écraser les tomates.',
        'Dresser, parsemer le parmesan finement râpé et les feuilles de basilic frais entières. Servir sans attendre : les pâtes n\'attendent personne.'
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
        'Préchauffer le four à 180 °C (chaleur tournante). Utiliser une poêle à manche en métal allant au four (20–22 cm de diamètre).',
        'Dans la poêle chaude avec l\'huile, faire suer l\'oignon émincé à feu moyen jusqu\'à translucidité (3 min). Ajouter l\'ail haché 30 secondes, puis les épinards en deux fois — ils tombent vite.',
        'Battre les œufs à la fourchette avec une pincée de sel et de poivre. Ne pas fouetter excessivement : on ne veut pas d\'air, la frittata doit être dense et crémeuse.',
        'Verser les œufs sur les légumes à feu moyen-doux. Laisser cuire 2 min jusqu\'à ce que les bords commencent à prendre, en ramenant légèrement les bords vers le centre avec une spatule.',
        'Parsemer la feta émiettée uniformément. Enfourner 12–14 min : la frittata est prête quand le centre est juste ferme sous une légère pression du doigt.',
        'Laisser reposer 2 min hors du four avant de couper. La frittata se détaille en parts comme une tarte — découpez net avec un couteau long.'
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
        'Rincer le quinoa à l\'eau froide dans une passoire fine jusqu\'à ce que l\'eau soit claire — cette étape élimine la saponine qui donne l\'amertume.',
        'Cuire le quinoa dans 360 ml d\'eau froide salée. Porter à ébullition, couvrir, réduire à feu doux 12 min. Éteindre, laisser gonfler 5 min couvercle fermé, puis égrener à la fourchette.',
        'Pendant que le quinoa tiédit, tailler le concombre en petits dés réguliers (5 mm), couper les tomates cerises en deux. Égoutter et rincer les pois chiches.',
        'Préparer la vinaigrette : émulsionner le jus de citron avec l\'huile d\'olive en fouettant vigoureusement. Assaisonner.',
        'Mélanger quinoa tiède, pois chiches, concombre et tomates. Verser la vinaigrette et mélanger délicatement pour ne pas écraser les légumes.',
        'Dresser en bowl, parsemer la feta émiettée à la main, les olives et les feuilles de menthe fraîche entières. La menthe se cisèle en salle, jamais à l\'avance.'
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
        'Placer l\'oignon coupé en deux et le gingembre tranché sur une plaque sèche. Griller sous le gril du four 8–10 min jusqu\'à noircissement partiel des bords : c\'est ce caramélisé qui donne la couleur ambrée et la profondeur au bouillon.',
        'Porter le bouillon à ébullition avec les étoiles de badiane, l\'oignon et le gingembre grillés. Réduire le feu, laisser frémir 20 min à couvert. Filtrer au travers d\'une passoire fine. Assaisonner avec la sauce poisson.',
        'Faire tremper les nouilles de riz 8 min dans l\'eau tiède (pas bouillante), égoutter. Elles finiront de cuire dans le bouillon chaud.',
        'Trancher le bœuf le plus finement possible — idéalement 2 mm d\'épaisseur. Si la viande est légèrement congelée (20 min au congélateur), la découpe est beaucoup plus nette.',
        'Porter le bouillon filtré à ébullition vive. Répartir les nouilles dans les bols, disposer les tranches de bœuf cru par-dessus en les étalant bien.',
        'Verser le bouillon bouillant (95–100 °C) directement sur le bœuf : la viande cuit instantanément à la nappe. Garnir de pousses de soja et d\'un quartier de citron vert. Servir à table dans la seconde.'
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
        'Plonger les œufs dans l\'eau bouillante salée et minuteur en main : 9 minutes exactement pour un jaune fondant sans cercle vert. Refroidir immédiatement dans un bol d\'eau glacée pour arrêter la cuisson.',
        'Blanchir les haricots verts à grande eau bouillante très salée 4 min : ils doivent rester croquants et d\'un vert intense. Plonger aussitôt dans de l\'eau glacée pour fixer la couleur.',
        'Préparer la vinaigrette dans le fond du saladier : moutarde de Dijon en premier, puis vinaigre balsamique, sel, poivre. Émulsionner en versant l\'huile d\'olive en filet tout en fouettant.',
        'Couper les tomates en quartiers réguliers, les œufs en deux dans le sens de la longueur pour révéler le jaune.',
        'Dresser la salade par couches successives : haricots verts, tomates, thon effeuilé à la main (jamais en boule). Disposer les anchois, les olives et les œufs en derniers, comme des éléments de composition.',
        'Napper de vinaigrette au moment de servir, jamais avant. La salade niçoise ne se mélange pas — elle se dresse et se compose.'
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
        'Trancher l\'aubergine en rondelles de 1 cm, saler légèrement et laisser dégorger 15 min sur du papier absorbant. Rincer, sécher, disposer sur plaque huilée et rôtir à 200 °C pendant 15 min en retournant à mi-cuisson : les rondelles doivent être dorées et moelleuses.',
        'Dans une poêle chaude, faire revenir l\'oignon émincé 3 min jusqu\'à coloration. Ajouter la dinde hachée et cuire à feu vif en écrasant les grumeaux : une viande bien saisie, pas bouillie, donne tout son goût.',
        'Incorporer les tomates concassées et la cannelle. Assaisonner. Cuire 10 min à feu moyen jusqu\'à ce que la sauce réduise et colle légèrement à la poêle.',
        'Préparer la béchamel légère : fouetter le yaourt grec avec l\'œuf battu, une pincée de sel et de noix de muscade. Cette préparation remplace une béchamel classique avec 80 % de matière grasse en moins.',
        'Monter le plat en deux couches : viande → aubergines → viande → aubergines. Verser la sauce yaourt-œuf en couvrant toute la surface. Parsemer le parmesan râpé.',
        'Enfourner à 180 °C pendant 25 min. Le gratin doit être doré et légèrement soufflé. Laisser reposer 5 min avant de découper : cela permet au plat de se tenir à la coupe.'
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
        'Trancher le bœuf en fines lamelles de 3–4 mm dans le sens contraire des fibres — ce geste seul garantit la tendreté. Mélanger avec la sauce soja et la fécule de maïs, laisser mariner 10 min minimum.',
        'Blanchir les fleurettes de brocoli 2 min à l\'eau bouillante salée, égoutter et sécher soigneusement. Un brocoli humide dans le wok = vapeur = plus de sauté.',
        'Chauffer le wok à feu maximum jusqu\'à légère fumée. C\'est le "wok hei" — la saveur de la flamme — qui fait toute la différence avec une poêle ordinaire.',
        'Saisir le bœuf en petites quantités (ne jamais surcharger le wok) 1 min 30 sans toucher, puis retourner 30 secondes. La viande doit rester rosée à cœur. Réserver.',
        'Dans le même wok encore chaud, faire revenir l\'ail et le gingembre râpés 30 secondes. Remettre le brocoli, puis le bœuf. Mélanger énergiquement 1 min à feu vif.',
        'Hors du feu, ajouter l\'huile de sésame en filet. Ne jamais cuire l\'huile de sésame — sa chaleur détruit les arômes. Servir immédiatement : le stir-fry n\'attend pas.'
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
        'Rincer le riz japonais jusqu\'à eau claire (5–6 fois) pour éliminer l\'excès d\'amidon. Cuire selon la méthode absorption : 200 g de riz pour 240 ml d\'eau froide, porter à ébullition, couvrir hermétiquement, feu minimum 12 min, repos 10 min sans soulever le couvercle.',
        'Préparer la sauce teriyaki : mélanger la sauce soja et le miel. Réserver la moitié pour napper en fin de cuisson.',
        'Sécher soigneusement les pavés de saumon avec du papier absorbant — un poisson humide ne se saisit pas, il cuit à la vapeur. Assaisonner côté chair seulement.',
        'Chauffer une poêle antiadhésive à feu moyen-vif. Placer le saumon côté peau, appuyer légèrement 30 secondes pour un contact parfait. Cuire 4–5 min sans bouger jusqu\'à ce que la peau soit croustillante et que la cuisson remonte aux deux-tiers de la chair.',
        'Retourner, éteindre le feu et laisser finir la cuisson à la chaleur résiduelle 2 min. Verser la moitié de la sauce teriyaki dans la poêle chaude : elle caramélise instantanément sur le poisson.',
        'Dresser le bowl : riz, edamame, concombre en fines tranches biseautées. Poser le saumon nappé de sauce, parsemer les graines de sésame et l\'oignon vert ciselé. Servir sans attendre.'
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
        'Ciseler finement l\'oignon, tailler le poivron en brunoise régulière (5 mm), écraser l\'ail. Des légumes taillés uniformément cuisent de façon homogène.',
        'Chauffer l\'huile d\'olive à feu moyen. Faire suer oignon et poivron 5 min en remuant régulièrement — ils doivent ramollir sans colorer. Ajouter l\'ail les 30 dernières secondes.',
        'Ajouter le cumin et le chili en poudre directement dans la matière grasse chaude et mélanger 30 secondes : torréfier les épices à sec libère leurs huiles essentielles et multiplie leur puissance aromatique.',
        'Incorporer les tomates concassées, porter à frémissement. Ajouter haricots rouges égouttés-rincés et maïs égoutté. Saler, mélanger.',
        'Laisser mijoter 20 min à feu doux, à demi-couvert, en remuant toutes les 5 min. Le chili est prêt quand la sauce est épaisse et enrobe les haricots.',
        'Goûter et ajuster l\'assaisonnement en sel et en chili. Un filet de jus de citron vert hors du feu relève tous les arômes. Servir avec du riz complet ou du pain de campagne.'
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
        'Dans une sauteuse chaude, faire suer l\'oignon émincé à feu moyen 3 min, puis monter à feu vif et colorer la dinde hachée 5 min en écrasant à la spatule — obtenir une belle caramélisation.',
        'Ajouter les tomates concassées, saler, poivrer. Laisser mijoter 10 min à découvert jusqu\'à évaporation de l\'excès d\'eau.',
        'Béchamel légère : faire fondre la farine dans 2 cs d\'eau froide, incorporer le lait chaud en fouettant à feu doux. Hors du feu, ajouter le yaourt grec — ne jamais faire rebouillir.',
        'Dans un plat à gratin, alterner : sauce viande, feuilles de lasagnes crues, béchamel — 3 couches. Terminer par béchamel et parmesan.',
        'Couvrir d\'aluminium. Cuire 20 min à 180 °C, retirer le papier, gratiner 8 min jusqu\'à croûte dorée.',
        'Laisser reposer 5 min hors du four avant de découper — les lasagnes se tiennent et se servent proprement.'
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
        'NE PAS cuire les pois chiches — ils doivent être seulement trempés 12 h et bien égouttés. C\'est le secret de la texture authentique.',
        'Mixer par impulsions courtes pois chiches, oignon grossièrement coupé, persil, ail, cumin, coriandre, sel — obtenir une pâte grumeleuse, jamais lisse.',
        'Former des boulettes de 30 g en serrant bien dans la paume. Réfrigérer 15 min pour qu\'elles se tiennent à la cuisson.',
        'Badigeonner généreusement d\'huile d\'olive au pinceau sur toutes les faces. Disposer sur plaque avec papier cuisson.',
        'Cuire à 200 °C chaleur tournante 12 min, retourner délicatement, cuire encore 10 min — croûte dorée et ferme.',
        'Sauce tahini : délayer tahini avec jus de citron et 3 cs d\'eau glacée en fouettant — elle doit napper la cuillère.'
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
        'Porter 1 litre d\'eau à frémissement (85 °C, jamais à ébullition), ajouter 1 cs de vinaigre blanc — il fixe le blanc.',
        'Casser chaque œuf dans un ramequin. Créer un tourbillon dans l\'eau avec une cuillère, glisser l\'œuf au centre. Pocher 3 min exactement — blanc pris, jaune coulant.',
        'Pendant la cuisson des œufs, toaster le pain complet jusqu\'à légère coloration dorée et croustillante.',
        'Écraser l\'avocat à la fourchette grossièrement — ne pas mixer. Assaisonner avec jus de citron, sel en flocons, poivre noir fraîchement moulu.',
        'Tartiner généreusement l\'écrasé d\'avocat sur le pain chaud. Déposer l\'œuf égoutté sur papier absorbant, puis sur le toast.',
        'Finir d\'un filet de flocons de piment rouge. Servir immédiatement — la chaleur du pain réveille les arômes de l\'avocat.'
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
        'Travailler la dinde hachée le moins possible : assaisonner avec ail en poudre, sel, poivre, et former 2 steaks de 175 g en appuyant légèrement au centre — pour éviter le bombement à la cuisson.',
        'Poêle très chaude avec huile. Saisir 4 min côté 1 sans toucher — laisser la croûte se former. Retourner, baisser légèrement le feu, cuire encore 4 min. Température à cœur : 74 °C.',
        'Retirer les steaks, couvrir de papier aluminium et laisser reposer 3 min — les jus se redistribuent, la viande reste moelleuse.',
        'Sauce : fouetter yaourt grec avec moutarde de Dijon et une pincée de sel jusqu\'à consistance crémeuse.',
        'Toaster les pains burger 1 min à sec dans la poêle encore chaude — côté mie seulement.',
        'Assembler dans l\'ordre : base pain, sauce, laitue (barrière contre l\'humidité), steak, oignon rouge, tomate, sauce, chapeau de pain.'
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
        'Faire chauffer l\'huile à feu vif. Ajouter cumin et curcuma à sec 30 secondes — les épices doivent grésiller et libérer leurs arômes. Ajouter aussitôt oignon, ail et gingembre râpé.',
        'Faire revenir à feu moyen 4 min en remuant jusqu\'à légère coloration de l\'oignon.',
        'Rincer les lentilles. Ajouter avec les carottes coupées en rondelles. Verser 600 ml d\'eau bouillante. Porter à ébullition, écumer.',
        'Réduire à feu doux, couvrir et cuire 20 min jusqu\'à ce que les lentilles soient fondantes.',
        'Hors du feu, mixer 1/3 de la soupe et remettre dans la casserole — technique du mixage partiel pour garder la texture et le corps.',
        'Incorporer le lait de coco sur feu doux, ne jamais faire rebouillir. Rectifier l\'assaisonnement. Servir avec un filet d\'huile d\'olive.'
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
        'Porter une grande casserole d\'eau non salée à ébullition. Cuire les soba exactement selon l\'indication du paquet (4-5 min en général).',
        'Égoutter immédiatement et rincer abondamment sous eau froide courante en frottant les nouilles entre les mains — cela élimine l\'amidon et les rend non collantes.',
        'Tailler les carottes en julienne fine au couteau (bâtonnets de 3 mm) — la julienne accroche mieux la sauce que la râpe.',
        'Émulsionner la sauce : fouetter vigoureusement sauce soja + vinaigre de riz + huile de sésame jusqu\'à ce que la sauce soit homogène et légèrement épaissie.',
        'Mélanger les soba froides avec julienne de carottes et edamame. Verser la sauce, mélanger délicatement avec des baguettes ou deux fourchettes.',
        'Dresser dans les bols, garnir d\'oignon vert ciselé et de graines de sésame. Servir frais ou à température ambiante.'
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
        'Préparer la vinaigrette à l\'avance : sauce soja + huile de sésame + gingembre fraîchement râpé + jus de citron vert. Laisser infuser 10 min.',
        'Sécher soigneusement les pavés de thon avec du papier absorbant — l\'humidité fait sauter le sésame.',
        'Verser les graines de sésame dans une assiette plate. Presser fermement chaque face du thon dans le sésame pour créer une croûte uniforme.',
        'Chauffer la poêle à sec ou avec 1 cc d\'huile à feu maximum jusqu\'à légère fumée. C\'est cette chaleur extrême qui caramélise le sésame sans cuire le centre.',
        'Saisir les pavés exactement 1 min 30 côté 1, 1 min côté 2. Les flancs doivent rester roses-translucides — c\'est ainsi que le thon se déguste.',
        'Trancher en biais en lamelles de 1 cm. Dresser sur la salade, napper de vinaigrette. Servir dans la minute.'
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
        'Préchauffer le four à 200 °C. Couper 2 grandes feuilles d\'aluminium — elles doivent être assez larges pour replier les bords 3 fois.',
        'Trancher les courgettes en rondelles de 5 mm. Les disposer en lit au centre de la feuille — le saumon repose dessus, jamais directement sur le papier.',
        'Déposer le pavé de saumon sur le lit de courgettes. Répartir ail émincé finement, aneth ciselée, tranches fines de citron.',
        'Arroser d\'huile d\'olive, saler, poivrer. Replier le papier hermétiquement en laissant un espace d\'air — la vapeur interne cuit le poisson en douceur.',
        'Enfourner 18 min. La papillote doit être bien gonflée — c\'est le signe que la vapeur a bien travaillé.',
        'Ouvrir à table devant les convives : le panache de vapeur parfumée fait partie du service. Presser un quartier de citron frais au dernier moment.'
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
        'Aplatir légèrement les blancs de poulet à l\'aide du plat de la main pour une épaisseur uniforme — cuisson homogène garantie. Assaisonner généreusement des deux côtés avec paprika fumé, sel, poivre.',
        'Poêle bien chaude avec huile. Cuire 5 min côté 1 sans bouger — la croûte se forme. Retourner, cuire 4 min. Hors du feu, laisser reposer 3 min sous aluminium.',
        'Sauce : mélanger yaourt grec, jus de citron, sel. Pour plus de fraîcheur, ajouter quelques feuilles de coriandre ou menthe fraîche ciselées.',
        'Trancher le poulet reposé en biais, en lamelles de 1 cm — la coupe en biais donne de plus belles tranches et une texture plus tendre en bouche.',
        'Passer les tortillas 20 secondes dans la poêle chaude à sec ou 30 secondes au micro-ondes sous film — une tortilla froide craque au roulage.',
        'Garnir le centre de la tortilla : sauce en premier (barrière), laitue, poivron rouge émincé, tomates cerises coupées, poulet tranché. Rouler serré en rabattant les côtés.'
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
        'Couper le concombre en deux dans la longueur, retirer les graines à la cuillère — elles rendent de l\'eau et détrempent la salade.',
        'Tailler concombre et tomates en gros morceaux de 2 cm. Émincer l\'oignon rouge en demi-rondelles fines et le passer 5 min dans l\'eau glacée — cela adoucit le piquant.',
        'Dans un bol, fouetter huile d\'olive, vinaigre de vin rouge, origan séché, sel et poivre en une vinaigrette homogène.',
        'Disposer concombre, tomates, oignon égoutté et olives noires dans le plat de service.',
        'Arroser de vinaigrette et mélanger délicatement.',
        'Déposer la feta en bloc ou en tranches épaisses sur le dessus — jamais émiettée à l\'avance, elle doit garder son caractère. Finir d\'un tour de poivre et d\'une pincée d\'origan frais si disponible.'
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
        'Rincer abondamment le quinoa à l\'eau froide. Porter 300 ml d\'eau salée à ébullition, verser le quinoa, couvrir et cuire 12 min à feu doux. Ôter du feu, laisser gonfler 5 min à couvert, puis égrener à la fourchette.',
        'Assaisonner les blancs de poulet de sel, poivre et un filet d\'huile d\'olive. Griller dans une poêle en inox très chaude 5 min côté lisse, 4 min côté strié. Laisser reposer 3 min hors feu avant de trancher en biais.',
        'Sauce tahini : mélanger tahini + jus de citron + 2 c. à soupe d\'eau froide + une pincée de sel. Fouetter jusqu\'à consistance nappante — la sauce doit couler en ruban.',
        'Dresser le bowl en secteurs distincts : quinoa tiède d\'un côté, épinards crus, tomates cerises coupées en deux, concombre en demi-rondelles, tranches de poulet, éventail d\'avocat. Napper de sauce tahini au moment de servir.'
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
        'Essuyer les champignons avec un linge humide — jamais sous l\'eau. Les émincer régulièrement à 3 mm. Chauffer une noix de beurre à feu vif jusqu\'au beurre noisette, saisir les champignons sans remuer 2 min pour les colorer, puis sauter 2 min supplémentaires. Saler en fin de cuisson pour ne pas les dégorger.',
        'Casser les œufs dans un bol. Assaisonner sel fin et poivre. Battre à la fourchette 20 secondes — les brins doivent être rompus mais non mousseux.',
        'Dans la même poêle, ajouter une petite noix de beurre à feu moyen-vif. Verser les œufs, secouer la poêle d\'un mouvement circulaire en remuant le centre avec une spatule souple jusqu\'à ce que le dessous soit pris et le dessus encore légèrement baveux.',
        'Disposer champignons et fromage râpé en ligne au centre. Incliner la poêle à 45°, rabattre un tiers de l\'omelette sur la garniture, puis faire glisser sur l\'assiette en retournant pour former un rouleau doré. Parsemer de ciboulette ciselée.'
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
        'Tailler oignon, céleri et carottes en brunoise régulière de 5 mm — c\'est le soffritto, l\'âme du minestrone. Chauffer l\'huile d\'olive à feu moyen et faire suer ce mélange 8 min à couvert en remuant jusqu\'à ce que les légumes soient translucides et sucrés.',
        'Ajouter les tomates concassées, monter le feu 2 min pour concentrer le jus, puis incorporer les courgettes en dés, les haricots blancs égouttés et le bouillon chaud. Porter à ébullition, puis baisser à frémissement et cuire 15 min à découvert.',
        'Ajouter les pâtes directement dans la soupe et cuire selon le temps indiqué sur le paquet moins 1 min — elles continueront à gonfler dans le bouillon chaud.',
        'Rectifier l\'assaisonnement. Servir dans des assiettes creuses chaudes, avec un filet d\'huile d\'olive à cru pour exalter les arômes.'
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
        'Utiliser impérativement du riz de la veille, froid et sec — le riz frais rend de l\'humidité et colle. Égrener les grains à la main avant cuisson.',
        'Chauffer le wok (ou grande poêle en acier) à feu maximum jusqu\'à légère fumée. Verser l\'huile de tournesol, brouiller les œufs battus en les remuant vivement 30 secondes pour des miettes moelleuses. Réserver immédiatement hors du wok.',
        'Dans le même wok très chaud, sauter les carottes en fine brunoise et les petits pois 2 min à feu vif sans baisser la flamme — c\'est le "wok hei", la saveur fumée caractéristique.',
        'Ajouter le riz froid d\'un coup, écraser les grumeaux avec la spatule, mélanger 2 min à feu maximum. Verser la sauce soja sur les parois chaudes du wok (pas sur le riz) pour la faire caraméliser.',
        'Incorporer les œufs brouillés et l\'oignon vert ciselé. Toss rapide. Couper le feu et terminer par un filet d\'huile de sésame — elle ne supporte pas la chaleur prolongée.'
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
        'Couper les blancs de poulet en cubes de 3 cm. Mélanger avec yaourt grec, garam masala, curcuma, sel. Couvrir et réfrigérer minimum 1 heure (idéalement une nuit) — l\'acide du yaourt attendrit les fibres.',
        'Saisir les cubes de poulet marinés dans une poêle très chaude avec un filet d\'huile, 2 min par face, sans les superposer. Ils doivent être dorés à l\'extérieur et pas encore cuits à coeur. Réserver.',
        'Dans la même poêle, faire suer l\'oignon haché à feu moyen 5 min. Ajouter l\'ail écrasé, cuire 1 min. Incorporer les tomates concassées et cuire 8 min à feu moyen jusqu\'à réduction et légère caramélisation.',
        'Verser le lait de coco léger, incorporer le poulet saisi, mélanger et laisser mijoter à couvert 12 min à feu doux. La sauce doit napper la cuillère. Rectifier le sel et servir avec riz basmati.'
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
        'Sauce hollandaise légère : fouetter yaourt grec avec moutarde de Dijon, jus de citron, sel et poivre. Tiédir dans une petite casserole à feu très doux (max 60 °C) en remuant constamment — le yaourt ne doit jamais bouillir ou il tranche.',
        'Remplir une sauteuse d\'eau à 8 cm, porter à frémissement (90 °C, jamais à gros bouillons). Ajouter le vinaigre. Casser chaque œuf dans un ramequin. Créer un léger tourbillon, glisser l\'œuf au centre, cuire 3 min. Retirer avec une écumoire, éponger sur papier absorbant.',
        'Toaster les demi-muffins complets jusqu\'à légère coloration dorée. Pendant ce temps, flétrir les épinards frais 1 min dans une poêle sèche à feu vif avec une pincée de sel.',
        'Dresser dans l\'ordre : muffin, tranche de saumon fumé, épinards essorés, œuf poché, napper généreusement de sauce hollandaise légère. Servir sans attendre.'
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
        'Rincer le quinoa sous l\'eau froide 1 min (retire le goût amer). Cuire dans 2 fois son volume d\'eau bouillante salée, 12 min à couvert. Étaler sur plaque et refroidir 10 min — un quinoa chaud fait "cuire" les herbes et les ramollit.',
        'Hacher finement au couteau (jamais au robot) le persil et la menthe — les lames de robot écrasent et oxydent les herbes. Couper tomates, concombre et oignon rouge en très petite brunoise régulière de 4 mm.',
        'Dans un grand saladier, mélanger d\'abord les légumes avec le sel et le jus de citron. Laisser mariner 5 min pour les attendrir légèrement. Puis incorporer le quinoa froid et les herbes.',
        'Verser l\'huile d\'olive en dernier, mélanger délicatement. Goûter et rectifier citron/sel. Réfrigérer 30 min avant de servir — le taboulé est toujours meilleur frais.'
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
        'Écraser les tiges de citronnelle avec le plat du couteau pour libérer les huiles essentielles. Trancher le galanga (ou gingembre) en fines lamelles. Inciser les piments.',
        'Porter le bouillon de poulet à ébullition. Ajouter citronnelle, galanga et piments. Baisser à frémissement et infuser 10 min à couvert — c\'est ce bouillon aromatique qui est l\'âme de la soupe.',
        'Ajouter champignons et tomates cerises entières. Cuire 4 min à feu moyen.',
        'Incorporer les crevettes décortiquées. Cuire exactement 2 à 3 min — les crevettes sont cuites quand elles s\'enroulent et deviennent opaques. Toute surcuisson les rend caoutchouteuses.',
        'Hors du feu, assaisonner avec sauce poisson et jus de citron vert pressé au dernier moment. Goûter : l\'équilibre doit être acide, salé, pimenté. Servir en bols profonds très chauds.'
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
        'Fouetter le yaourt grec vigoureusement 30 secondes dans un bol : il s\'aère légèrement et devient plus onctueux. Incorporer le miel en filet tout en fouettant.',
        'Couper la mangue en cubes réguliers de 2 cm et la banane en rondelles obliques — la régularité des découpes donne au bowl son aspect professionnel.',
        'Répartir le yaourt dans les bols en base épaisse. Placer les fruits en rangées ou secteurs distincts d\'un côté, puis le granola de l\'autre côté (pour qu\'il reste croquant jusqu\'au dernier moment).',
        'Saupoudrer les graines de chia sur les fruits, parsemer la noix de coco râpée en finition. Servir immédiatement — le granola perd son croquant en moins de 5 min au contact du yaourt humide.'
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
        'Rincer le riz basmati jusqu\'à eau claire, cuire par absorption (1 volume riz pour 1,5 volume eau froide salée) : porter à ébullition, couvrir hermétiquement, baisser à feu minimum 12 min, ôter du feu 5 min. Égrener à la fourchette.',
        'Couper la patate douce en cubes de 2 cm et détailler le brocoli en fleurettes régulières. Mélanger avec huile d\'olive, paprika fumé, cumin et sel. Étaler sur plaque en une seule couche sans superposer — si les légumes se touchent, ils cuisent à la vapeur plutôt qu\'à rôtir. Enfourner à 200 °C, 20 min, en retournant à mi-cuisson.',
        'Assaisonner les blancs de poulet de sel, poivre et paprika. Griller dans une poêle striée bien chaude 6 min côté lisse, 4 min côté strié. Laisser reposer 5 min avant de trancher — le repos redistribue les jus dans les fibres.',
        'Assembler les boxes en compartiments : riz d\'un côté, légumes rôtis au centre, poulet tranché face visible. Arroser de jus de citron sur les légumes uniquement. Laisser refroidir complètement avant de fermer et réfrigérer — un couvercle sur un plat chaud crée de la condensation qui ramollit tout.'
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
        'Dans un bocal de 500 ml, verser les flocons d\'avoine, les graines de chia et le miel. Mélanger à sec avant tout ajout de liquide — les chia s\'hydratent uniformément.',
        'Incorporer le yaourt grec en premier, puis le lait écrémé. Fouetter 30 secondes avec une fourchette jusqu\'à homogénéité ; aucun fond de flocons ne doit rester sec.',
        'Fermer hermétiquement et placer au réfrigérateur au moins 8 h (une nuit idéalement). Le froid transforme la texture : les flocons absorbent tout le liquide sans cuire.',
        'Le matin, sortir le bocal 5 min avant de servir. Remuer une fois : la texture doit être crémeuse et non liquide.',
        'Décongeler les fruits rouges 10 min à température ambiante pour libérer leur jus naturel. Disposer en surface sans mélanger pour préserver le visuel et la fraîcheur.'
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
        'Sortir la mangue et la banane congelées 3 min avant de mixer — un fruit trop dur casse les lames et donne une texture granuleuse.',
        'Placer mangue, banane et yaourt grec dans le blender. Mixer par impulsions courtes (3 × 5 secondes) puis en continu 20 secondes. La consistance finale doit tenir sur une cuillère retournée.',
        'Verser immédiatement dans des bols bien froids (passés 5 min au congélateur). Un bol chaud fait fondre l\'ensemble trop vite.',
        'Disposer les garnitures par zones distinctes — granola d\'un côté, kiwi tranché finement, chia saupoudré, noix de coco râpée — sans jamais mélanger. L\'œil mange avant la bouche.',
        'Servir sans attendre : le smoothie bowl se déguste dans les 5 premières minutes, c\'est là qu\'il est parfait.'
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
        'Tailler le blanc de poulet en cubes de 3 cm. Mélanger avec le yaourt grec et le garam masala ; masser la viande à la main pour faire pénétrer la marinade. Couvrir au contact et réfrigérer 1 h minimum.',
        'Saisir les cubes de poulet égouttés (sans marinade) dans une poêle très chaude à sec, 2 min par face, jusqu\'à coloration dorée. Réserver — le poulet finira de cuire dans la sauce.',
        'Dans la même poêle, faire fondre le beurre à feu moyen. Ajouter oignon émincé, ail et gingembre râpés. Faire revenir 5 min sans colorer, jusqu\'à transparence totale.',
        'Verser les tomates concassées, saler légèrement. Cuire à couvert 10 min à feu doux, puis mixer la sauce au mixeur plongeant jusqu\'à consistance lisse comme de la soie.',
        'Incorporer la crème légère hors du feu pour éviter qu\'elle tourne. Remettre le poulet. Mijoter 8 min à feu très doux — le poulet doit rester moelleux, jamais sec.',
        'Rectifier l\'assaisonnement. Servir aussitôt, parsemé d\'une pincée de garam masala cru pour le parfum.'
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
        'Préparer la sauce teriyaki : mélanger sauce soja, miel et huile de sésame. Plonger les pavés de saumon côté peau vers le haut pendant 10 min — pas plus, le soja "cuit" légèrement la chair.',
        'Sortir le saumon, éponger légèrement avec du papier absorbant. Une chair sèche en surface garantit une belle caramélisation ; une chair humide va bouillir dans la poêle.',
        'Cuire à feu vif dans une poêle sans matière grasse, côté peau en premier, 3 min sans toucher. Retourner, baisser le feu à moyen, napper de sauce teriyaki à la cuillère. Cuire encore 2-3 min. La sauce doit glacer, pas brûler.',
        'Pendant ce temps, passer les edamame 2 min à l\'eau bouillante salée. Trancher l\'avocat et le concombre en biseau pour l\'élégance.',
        'Dresser le riz en dôme au centre du bol. Disposer saumon, edamame, avocat et concombre en quartiers distincts autour. Verser le jus de cuisson réduit en filet. Parsemer de sésame.',
        'Servir immédiatement : le riz chaud et le saumon tiède contrastent avec le concombre et l\'avocat frais — c\'est ce contraste qui rend le bowl addictif.'
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
        'Préchauffer le four à 175 °C chaleur tournante. Huiler généreusement chaque alvéole du moule à muffins avec un pinceau — les œufs accrochent facilement.',
        'Tailler poivron, épinards et oignon vert en brunoise fine (3 mm). Des légumes trop gros coulent au fond ; des légumes fins se répartissent uniformément dans chaque bouchée.',
        'Battre les 6 œufs vigoureusement à la fourchette 1 min entière : on cherche à incorporer de l\'air pour une texture soufflée, pas dense. Assaisonner sel et poivre.',
        'Répartir la brunoise de légumes à parts égales dans les 6 alvéoles. Verser l\'appareil à œufs jusqu\'aux ¾ seulement — les muffins vont gonfler.',
        'Parsemer le fromage râpé sur chaque alvéole. Enfourner 18-20 min : les bords doivent être dorés et le centre à peine tremblant à la sortie du four (il finit de cuire sur le moule chaud).',
        'Laisser tiédir 3 min avant de démouler en passant un couteau fin sur le pourtour. Se conservent 4 jours au réfrigérateur dans une boîte hermétique.'
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
        'Préchauffer le four à 180 °C. Choisir une banane très mûre (peau noire) : plus elle est mûre, plus elle est sucrée naturellement, ce qui réduit le besoin en miel.',
        'Écraser la banane à la fourchette jusqu\'à obtenir une purée lisse sans morceaux. Ajouter l\'œuf battu et mélanger vigoureusement — l\'œuf lie la préparation et donne de la tenue.',
        'Incorporer flocons d\'avoine, lait écrémé, miel et cannelle. Mélanger 30 secondes ; la pâte doit être épaisse, pas liquide. Laisser reposer 2 min : les flocons absorbent l\'humidité.',
        'Verser dans un plat légèrement huilé (20 × 20 cm). Parsemer les pépites de chocolat noir en surface, sans les mélanger — elles fondront en pockets de chocolat discrets.',
        'Cuire 20-25 min : la surface doit être dorée et légèrement craquelée, le centre encore très légèrement humide. Vérifier avec la pointe d\'un couteau : elle doit ressortir avec quelques miettes, pas propre.'
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
        'Dans un bol, fouetter le lait de coco léger avec le miel 30 secondes pour bien émulsionner — le gras du coco a tendance à se séparer.',
        'Verser les graines de chia en pluie fine tout en fouettant continuellement. Ce geste évite les amas : chaque graine doit être individuelle dans le liquide.',
        'Laisser reposer 5 min à température ambiante puis fouetter une deuxième fois vigoureusement. C\'est ce double fouettage qui garantit une texture lisse et crémeuse, sans grumeaux.',
        'Couvrir et réfrigérer minimum 4 h. Idéalement toute la nuit : les graines absorbent tout le liquide et gonflent à 10 fois leur volume initial.',
        'Au moment de servir, couper la mangue fraîche en brunoise régulière de 1 cm. Dresser le pudding dans des verrines, disposer la mangue en dôme, parsemer la noix de coco râpée.'
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
        'Préchauffer le four à 160 °C chaleur tournante — jamais plus chaud : le granola doit sécher et dorer doucement, pas griller.',
        'Faire fondre l\'huile de coco avec le miel dans une casserole à feu très doux jusqu\'à liquéfaction. Verser ce mélange chaud sur les flocons et la cannelle ; mélanger à la spatule pour enrober chaque flocon.',
        'Étaler en couche fine et régulière (max 1 cm) sur une plaque recouverte de papier cuisson. Une couche épaisse cuit à l\'étouffée ; une couche fine devient croustillante.',
        'Enfourner 20-25 min. Mélanger délicatement toutes les 8-10 min avec une grande spatule en retournant les bords (qui colorent plus vite) vers le centre. Le granola est prêt quand il est doré ambré — il paraît encore mou au four.',
        'Sortir du four et laisser refroidir COMPLÈTEMENT sur la plaque sans y toucher — au moins 20 min. Le croustillant se forme en refroidissant, pas en cuisant.',
        'Seulement quand le granola est froid : incorporer amandes, cajous et raisins secs. Conserver en bocal hermétique jusqu\'à 2 semaines.'
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
        'Écraser la banane très mûre à la fourchette jusqu\'à obtenir une purée lisse. Ajouter les œufs un à un en fouettant entre chaque ajout — cela incorpore de l\'air et allège la pâte.',
        'Mixer les flocons d\'avoine 15 secondes au blender pour obtenir une farine grossière. Ce geste transforme la texture : les pancakes tiennent mieux et sont moins "gélatineux".',
        'Incorporer la farine d\'avoine, le lait écrémé, la levure chimique et la cannelle à la purée de banane. Ne pas trop mélanger : quelques grumeaux sont acceptables. Laisser reposer 3 min.',
        'Chauffer une poêle antiadhésive à feu moyen. Huiler très légèrement avec un papier absorbant imbibé d\'huile. La poêle est prête quand une goutte d\'eau dansote à la surface.',
        'Verser des petites louches de 60 ml. Cuire 2 min sans toucher jusqu\'à apparition de bulles en surface et bords secs. Retourner une seule fois, cuire 1 min 30. Ne jamais appuyer sur les pancakes.',
        'Servir en pile de 3, filet de miel versé à la dernière seconde pour ne pas les détremper.'
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
        'Mixer les flocons d\'avoine 10 secondes pour les réduire en farine fine — cela donne une texture de gâteau, pas de porridge. Verser dans un grand mug (350 ml minimum).',
        'Ajouter cacao, levure chimique, miel et lait écrémé. Fouetter à la fourchette 30 secondes pour obtenir une pâte lisse. Incorporer l\'œuf en dernier et mélanger 15 secondes — pas plus, sous peine de rendre le gâteau caoutchouteux.',
        'La pâte doit remplir le mug au maximum à mi-hauteur : elle va doubler de volume au micro-ondes.',
        'Cuire à puissance maximale (800-900 W) exactement 80 secondes. Chaque micro-ondes est différent — à 60 secondes, vérifier : le dessus doit être à peine sec au toucher.',
        'Laisser reposer 1 min 30 OBLIGATOIREMENT dans le mug : la chaleur résiduelle termine la cuisson du centre. Déguster immédiatement, le mug cake n\'attend personne.'
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
        'Torréfiez les amandes à sec dans une poêle 3-4 min à feu moyen jusqu\'à ce qu\'elles embaument : l\'arôme, c\'est la signature.',
        'Mixez les amandes avec les flocons d\'avoine en pulsions courtes pour garder un peu de texture — pas une poudre.',
        'Ajoutez les dattes Medjool, le cacao et la cannelle. Mixez en continu 1 à 2 min jusqu\'à ce que la masse se détache des parois et forme une boule.',
        'Si la pâte est trop sèche, ajoutez l\'eau froide cuillère à soupe par cuillère à soupe : mieux vaut y aller doucement.',
        'Humidifiez légèrement vos paumes et roulez 16 boules d\'égale grosseur — le geste doit être ferme et rapide pour ne pas ramollir la pâte.',
        'Roulez dans la noix de coco râpée, placez sur une assiette et réfrigérez 1 h minimum. Se conservent 2 semaines au frais dans une boîte hermétique.'
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
        'Égouttez les pois chiches, réservez le liquide de conserve. Frottez-les entre vos paumes pour ôter les peaux : cela donne un hummus d\'une onctuosité incomparable.',
        'Mixez tahini et jus de citron ensemble 1 min avant d\'ajouter quoi que ce soit : ce geste blanchit le tahini et structure la crème.',
        'Ajoutez l\'ail, le cumin et les pois chiches. Mixez 2 min à pleine puissance.',
        'Versez l\'eau froide (ou le liquide réservé) en filet fin, moteur tournant, jusqu\'à obtenir une texture soyeuse qui se tient.',
        'Goûtez, rectifiez citron et sel. Le jus de citron s\'estompe à l\'air : soyez généreux.',
        'Dressez en faisant un creux au centre avec le dos d\'une cuillère, versez un filet d\'huile d\'olive, saupoudrez de paprika fumé. Servez à température ambiante.'
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
        'Dans une cocotte, faites suer l\'oignon et l\'ail dans l\'huile d\'olive à feu doux 5 min, couvercle posé : ils doivent fondre sans colorer — la douceur du velouté en dépend.',
        'Ajoutez les courgettes taillées en gros tronçons, sel. Laissez-les rendre leur eau 3 min à feu vif en remuant : cela concentre le goût avant même le bouillon.',
        'Versez le bouillon chaud. Portez à frémissement et cuisez 12 min à couvert — les courgettes doivent être tendres mais encore vertes.',
        'Hors du feu, ajoutez la moitié du basilic frais puis mixez immédiatement à pleine puissance 2 min pour fixer la chlorophylle et obtenir un vert lumineux.',
        'Remettez brièvement sur feu doux, incorporez la crème légère sans faire bouillir. Rectifiez l\'assaisonnement.',
        'Servez dans des assiettes creuses chaudes, déposez quelques feuilles de basilic frais et un trait d\'huile d\'olive à cru.'
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
        'Faites chauffer l\'huile dans une cocotte à feu moyen. Ajoutez l\'oignon émincé et le cumin : laissez griller 2-3 min en remuant jusqu\'à ce que le cumin crépite et embaume — c\'est là que naît le goût.',
        'Ajoutez le gingembre râpé finement. Remuez 1 min : il doit revenir dans la matière grasse, pas bouillir dans le liquide.',
        'Incorporez les carottes en rondelles, nacrez-les 2 min dans la matière grasse aromatisée avant de mouiller.',
        'Versez le bouillon chaud. Portez à frémissement, couvrez et cuisez 20 min jusqu\'à ce qu\'une pointe de couteau traverse les carottes sans effort.',
        'Mixez à pleine puissance 2 min pour une texture parfaitement lisse. Incorporez le lait de coco en remuant, goûtez et ajustez le sel.',
        'Servez fumant avec une pincée de cumin grillé et, si disponible, quelques feuilles de coriandre fraîche pour la fraîcheur.'
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
        'Réfrigérez la pastèque entière au moins 2 h avant de la couper : froide, elle est infiniment plus savoureuse et la salade ne rend pas d\'eau.',
        'Taillez la pastèque en cubes de 3-4 cm, épépinez. Tranchez l\'oignon rouge en rondelles fines, faites-les tremper 5 min dans l\'eau froide pour adoucir leur piquant.',
        'Préparez la vinaigrette : émulsionnez le jus de citron vert avec l\'huile d\'olive, sel, poivre.',
        'Émiettez la feta à la main en morceaux irréguliers, plus généreux qu\'une râpe : la texture compte autant que le goût.',
        'Disposez la pastèque dans le plat de service, répartissez l\'oignon égoutté et la feta, effeuillez la menthe fraîche par-dessus.',
        'Arrosez de vinaigrette au dernier moment et servez immédiatement — cette salade n\'attend pas.'
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
        'Sortez le yaourt grec 10 min avant de servir : à peine moins froid, il est plus onctueux et révèle mieux ses arômes lactiques.',
        'Coupez les fraises en deux ou en quartiers selon leur taille, tranchez la banane en rondelles épaisses. Gardez les myrtilles entières.',
        'Fouettez brièvement le yaourt avec une fourchette pour le détendre légèrement, puis versez-le dans les bols en formant un creux central avec le dos d\'une cuillère.',
        'Disposez les fruits par zones de couleur — fraises, myrtilles, banane — pour un visuel net : on mange d\'abord avec les yeux.',
        'Faites griller le granola à sec 2 min dans une poêle chaude juste avant de servir pour lui redonner son croustillant.',
        'Répartissez le granola chaud sur le yaourt froid, filez le miel en spirale depuis le bord vers le centre. Servez aussitôt.'
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
        'Préchauffez le four à 190 °C. Rincez le quinoa sous l\'eau froide 1 min pour éliminer la saponine amère, puis cuisez-le dans deux fois son volume d\'eau salée 15 min à couvert.',
        'Coupez le chapeau des poivrons, évidez-les en préservant la chair, badigeonnez l\'intérieur d\'un filet d\'huile d\'olive et enfournez à blanc 10 min pour les prédémarrer.',
        'Émincez l\'oignon finement, faites-le suer 5 min dans une poêle avec l\'huile restante. Ajoutez le cumin et toastez 30 secondes.',
        'Dans un saladier, combinez quinoa égoutté, tomates, pois chiches, oignon aromatisé. Rectifiez le sel, ajoutez la moitié de la feta émiettée.',
        'Farcissez les poivrons préchauds généreusement, couronnez du reste de feta, reposez les chapeaux en biais pour laisser l\'humidité s\'échapper.',
        'Enfournez 20-25 min : les poivrons doivent être fondants et légèrement caramélisés sur les bords. Laissez reposer 5 min avant de servir.'
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
        'Mondez les tomates : incisez en croix, plongez 30 secondes dans l\'eau bouillante, pelez. La peau restante donnait cette note âcre que vous n\'arriviez pas à identifier.',
        'Épépinez concombre et poivron, coupez-les grossièrement. Réservez quelques dés de chaque pour la garniture finale.',
        'Mixez tomates, concombre, poivron, oignon rouge et ail à pleine puissance 3 min pour obtenir une texture parfaitement homogène.',
        'Versez l\'huile d\'olive en filet moteur tournant — comme une vinaigrette — puis le vinaigre. Le gaspacho s\'émulsionne et prend de la tenue.',
        'Passez au tamis fin en appuyant avec une cuillère : cette étape que l\'on saute souvent fait toute la différence de texture.',
        'Assaisonnez, couvrez et réfrigérez au moins 3 h — idéalement une nuit. Servez glacé avec un filet d\'huile, les dés réservés et une pincée de sel en fleur.'
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
        'Épluchez et taillez les pommes de terre en rondelles de 3 mm d\'épaisseur — l\'uniformité assure une cuisson homogène. Émincez l\'oignon en demi-lunes de même épaisseur.',
        'Confisez pommes de terre et oignon dans l\'huile d\'olive à feu doux (frémissement, pas friture) 15-18 min, en retournant souvent : ils doivent être fondants sans colorer.',
        'Battez les œufs avec le sel. Égouttez les pommes de terre en réservant l\'huile, incorporez-les aux œufs avec l\'oignon. Laissez reposer 5 min : les œufs s\'imprègnent.',
        'Dans la même poêle avec 1 cs d\'huile réservée sur feu moyen-fort, versez le mélange. Formez les bords avec une spatule. Couvrez, cuisez 4-5 min jusqu\'à ce que le dessus commence à prendre.',
        'Posez une assiette plate sur la poêle, retournez d\'un geste ferme et décidé. Faites glisser la tortilla, côté cru vers le bas, pour 3-4 min supplémentaires.',
        'La tortilla idéale est légèrement tremblante au centre quand on la sort — elle finit de cuire à la chaleur résiduelle. Servez tiède ou à température ambiante, jamais chaude.'
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
        'Réhydratez les algues wakame dans un bol d\'eau froide 5-8 min. L\'eau froide, pas chaude : elle préserve la couleur verte et la texture délicate.',
        'Taillez le tofu soyeux en cubes de 2 cm en l\'égouttant sur papier absorbant 5 min — il se tiendra mieux dans la soupe.',
        'Chauffez le bouillon de légumes à feu doux jusqu\'à frémissement léger (environ 70-75 °C). Il ne doit jamais bouillir : la chaleur vive tuerait les enzymes vivants du miso.',
        'Prélevez une louche de bouillon tiède, délayez-y la pâte miso avec une cuillère jusqu\'à dissolution complète — pas de grumeaux — puis reversez ce mélange dans la casserole.',
        'Ajoutez délicatement les cubes de tofu et les wakame essorés. Laissez tiédir 1 min hors du feu : le tofu soyeux se réchauffe, il ne se cuit pas.',
        'Servez dans des bols chauds, arrosez d\'un trait de sauce soja, parsemez d\'oignon vert ciselé en biseau pour la fraîcheur et la couleur.'
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
        'Sortir le poulet 20 min avant cuisson. Préchauffer le four à 220 °C chaleur tournante.',
        'Mélanger huile d\'olive, jus d\'un citron, ail écrasé, romarin et thym. Frotter généreusement sous la peau et sur toute la surface. Saler, poivrer.',
        'Disposer le poulet sur un lit de rondelles de citron dans le plat. Rôtir 10 min à 220 °C pour saisir, puis baisser à 190 °C pour 20 min.',
        'Arroser le poulet de son jus à mi-cuisson. Vérifier la cuisson : piquer la chair à l\'endroit le plus épais — le jus doit couler clair.',
        'Laisser reposer 5 min hors du four, recouvert d\'une feuille d\'aluminium, avant de servir. Les fibres se détendent, la chair reste juteuse.'
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
        'Aplatir les blancs de poulet à l\'aide du plat de la main ou d\'un rouleau à pâtisserie à épaisseur uniforme (1,5 cm). Épaisseur régulière = cuisson homogène.',
        'Fouetter vivement miel, moutarde de Dijon, ail finement haché, huile d\'olive et thym jusqu\'à émulsion lisse. Enrober le poulet et laisser mariner 10 min minimum.',
        'Chauffer la poêle à feu vif sans matière grasse supplémentaire. Saisir le poulet 2 min pour colorer, puis baisser à feu moyen et cuire 5 min par côté.',
        'Verser le reste de marinade en fin de cuisson et laisser caraméliser 1 min en retournant. Trancher en biais avant de servir.'
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
        'Mixer finement les flocons d\'avoine jusqu\'à obtenir une farine légère. Tamiser si possible pour éliminer les grumeaux.',
        'Battre les œufs en omelette, incorporer le lait progressivement puis la farine d\'avoine, le yaourt grec, le miel et la vanille. Fouetter jusqu\'à consistance lisse.',
        'Laisser reposer la pâte 5 à 10 min : le gluten des flocons se détend, les crêpes seront plus souples et moins cassantes.',
        'Chauffer une poêle antiadhésive à feu moyen. Verser une louche de pâte et incliner immédiatement la poêle pour étaler en disque fin. Cuire 1 min 30 par côté jusqu\'à légère coloration dorée.',
        'Empiler les crêpes chaudes et servir avec fruits frais de saison, miel ou yaourt grec.'
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
        'Rincer les lentilles. Les plonger dans l\'eau froide non salée, porter à ébullition puis cuire 18 à 20 min. Saler uniquement les 5 dernières minutes — le sel précoce durcit la peau.',
        'Égoutter les lentilles et les assaisonner tièdes avec la vinaigrette (huile d\'olive, jus de citron, moutarde). Tièdes, elles absorbent mieux les saveurs.',
        'Couper oignon rouge en fines lamelles, tomates cerises en 2, concombre en demi-rondelles. Émietter le thon grossièrement à la fourchette.',
        'Assembler lentilles, thon et légumes. Goûter et rectifier l\'assaisonnement. Servir à température ambiante — jamais glacé, les arômes seraient muets.'
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
        'Préchauffer le four à 190 °C. Détailler le brocoli en fleurettes régulières. Cuire à la vapeur exactement 4 min — al dente, pas mou. Refroidir sous eau froide pour fixer la couleur verte.',
        'Couper le poulet en dés de 2 cm. Saisir vivement à la poêle dans une noix d\'huile, 3 min à feu vif. Ne pas cuire entièrement — il terminera au four. Saler, poivrer.',
        'Préparer la sauce : fouetter yaourt grec, ail râpé, moutarde, noix de muscade râpée fraîche. La muscade fraîche est sans comparaison avec la poudre.',
        'Disposer le poulet et le brocoli en couches dans le plat. Napper uniformément de sauce. Parsemer le fromage râpé.',
        'Enfourner 20 min. Les 3 dernières minutes, passer en mode grill pour gratiner le dessus à la perfection. Servir sans attendre.'
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
        'Émincer oignon en demi-rondelles, poivron en lanières, courgette en demi-lunes de 5 mm. Tailles similaires = cuisson uniforme.',
        'Chauffer l\'huile d\'olive dans une grande poêle à feu vif. Saisir l\'oignon et le poivron 3 min en remuant peu — laisser colorer légèrement.',
        'Ajouter la courgette, cuire 4 min. Ajouter les tomates cerises entières, saupoudrer les herbes de Provence. Cuire 2 min jusqu\'à ce que les tomates commencent à fondre.',
        'Réduire à feu doux. Creuser 4 nids bien distincts dans les légumes avec le dos d\'une cuillère. Casser délicatement un œuf dans chaque nid.',
        'Couvrir hermétiquement et cuire 4 à 5 min. Le blanc doit être opaque, le jaune encore tremblotant. Saler uniquement les blancs — jamais le jaune qui durcit.'
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
        'Rincer le riz à sushi 3 fois jusqu\'à eau claire. Cuire avec 240 ml d\'eau froide : porter à ébullition, couvrir, cuire 12 min à feu doux, puis éteindre et laisser reposer 10 min couvercle fermé.',
        'Mélanger vinaigre de riz, une pincée de sel et une demi-cuillère à café de sucre. Incorporer au riz encore chaud en soulevant délicatement avec une spatule — jamais en remuant, on écraserait les grains.',
        'Trancher le saumon très froid en dés de 1,5 cm avec un couteau bien affûté. Le saumon froid se coupe net, sans déchirer la chair.',
        'Émincer concombre en fines demi-lunes, trancher l\'avocat à la dernière minute et arroser immédiatement de jus de citron vert pour éviter l\'oxydation.',
        'Dresser : riz en base, puis chaque garniture disposée en secteurs distincts et colorés. Saumon au centre. Sauce soja, graines de sésame torréfiées, algues nori ciselées en finition.'
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
        'Émincer finement l\'oignon. Râper le gingembre frais. Faire revenir dans l\'huile à feu moyen 3 min sans colorer — on cherche la transparence, pas le doré.',
        'Ajouter le curry en poudre et faire torréfier 30 secondes à sec dans la poêle en remuant. Cette étape active les arômes liposolubles du curry — elle est essentielle.',
        'Ajouter la patate douce pelée et coupée en cubes réguliers de 3 cm, mouiller avec le bouillon. Porter à ébullition, réduire le feu et cuire 20 min jusqu\'à ce qu\'une lame de couteau passe sans résistance.',
        'Mixer au blender plongeant en longeant les parois pour obtenir un velouté parfaitement lisse. Incorporer le lait de coco, ajuster l\'assaisonnement.',
        'Servir aussitôt dans des bols chauds. Finir d\'un filet d\'huile d\'olive et d\'une pincée de curry.'
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
        'Tailler le poulet en lanières régulières de 2 cm de large dans le sens de la longueur. Régularité = cuisson homogène sur brochette.',
        'Mélanger sauce soja, curcuma, ail haché fin et la moitié du jus de citron vert. Mariner le poulet au minimum 20 min — idéalement 1 heure au réfrigérateur.',
        'Embrocher les lanières en accordéon sur des brochettes préalablement trempées dans l\'eau 15 min pour éviter qu\'elles ne brûlent.',
        'Cuire les brochettes sur grill ou plancha très chaude, 3 à 4 min par côté sans y toucher pendant la cuisson — laisser se former la croûte dorée.',
        'Pendant la cuisson : chauffer doucement beurre de cacahuète, lait de coco, jus de citron vert restant et piment émincé à feu doux 3 min en fouettant. La sauce doit napper la cuillère sans être épaisse.',
        'Servir brochettes sur la sauce, parsemer de cacahuètes concassées et coriandre fraîche.'
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
        'Sécher soigneusement les crevettes sur papier absorbant. Des crevettes humides bouillent dans leur eau au lieu de sauter — c\'est la règle d\'or.',
        'Chauffer l\'huile d\'olive à feu très vif jusqu\'à légère fumée. Saisir les crevettes en une seule couche, 1 min 30 par côté sans les toucher. Ajouter l\'ail haché en fin de cuisson, 30 secondes. Assaisonner et réserver.',
        'Couper l\'avocat en deux, retirer le noyau, trancher dans la peau puis détacher à la cuillère. Arroser immédiatement de jus de citron vert pour conserver la couleur.',
        'Préparer la vinaigrette : huile d\'olive, jus de citron vert, sel, poivre. Assaisonner légèrement la salade mélangée en premier.',
        'Dresser : lit de salade assaisonnée, avocat en éventail, crevettes encore chaudes, tomates cerises. Parsemer généreusement de coriandre fraîche ciselée. Servir immédiatement.'
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
        'Rincer le quinoa à l\'eau froide, puis le cuire dans 2 volumes d\'eau salée à ébullition. Couvrir, réduire à feu doux 12 min, éteindre et laisser gonfler 5 min à couvert avant d\'égrener à la fourchette.',
        'Décongeler l\'edamame à l\'eau bouillante salée 3 min, égoutter et refroidir immédiatement sous l\'eau froide pour fixer la couleur verte.',
        'Préparer la sauce : fouetter le tahini avec le jus de citron vert, l\'huile de sésame et 2 cuillères à soupe d\'eau froide jusqu\'à obtenir une consistance fluide et nacrée. Saler légèrement.',
        'Couper l\'avocat en tranches régulières et le concombre en demi-lunes fines. Citronner l\'avocat aussitôt pour éviter l\'oxydation.',
        'Dresser le bowl en secteurs distincts — quinoa chaud, feuilles d\'épinards frais, edamame, avocat, concombre — pour un effet visuel soigné.',
        'Napper généreusement de sauce tahini au moment du service. Ajouter une pincée de graines de sésame si disponible.'
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
        'Fouetter vivement les œufs avec le lait écrémé, une pincée de cannelle et une pincée de sel fin jusqu\'à émulsion légère — le mélange doit être homogène et légèrement mousseux.',
        'Tremper chaque tranche de pain complet 20 secondes de chaque côté, en appuyant doucement pour que l\'appareil pénètre sans déstructurer le pain.',
        'Chauffer une poêle antiadhésive à sec sur feu moyen-vif. Quand elle est chaude, déposer les tranches et cuire 2 min sans toucher jusqu\'à coloration dorée-ambrée, retourner et répéter.',
        'Pendant la cuisson, détendre le yaourt grec avec quelques gouttes de citron et le miel pour obtenir une crème souple.',
        'Dresser le pain perdu encore chaud avec la crème de yaourt mielléee et les fruits rouges disposés avec soin. Servir immédiatement.'
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
        'Aplatir légèrement les blancs de poulet entre deux feuilles de papier sulfurisé à l\'aide d\'une casserole — épaisseur uniforme de 1,5 cm — pour une cuisson homogène et une viande juteuse.',
        'Saisir le poulet dans une poêle bien chaude avec l\'huile d\'olive, 5 min sur la première face sans bouger pour former une belle croûte, puis 4 min sur l\'autre face. Laisser reposer 3 min avant de trancher en lamelles biais.',
        'Préparer la sauce César allégée : écraser l\'ail en purée fine, incorporer la moutarde de Dijon, puis le yaourt grec en fouettant. Saler, poivrer, ajouter quelques gouttes de citron.',
        'Réchauffer les tortillas 30 secondes dans la poêle chaude à sec — elles deviennent souples et légèrement marbrées, bien meilleures que réchauffées au micro-ondes.',
        'Garnir : étaler la sauce César sur la tortilla, déposer la laitue romaine, les lamelles de poulet, saupoudrer généreusement de parmesan râpé.',
        'Rouler serré en rabattant d\'abord les côtés, puis couper en deux en biais d\'un geste franc. Servir immédiatement.'
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
        'Émincer finement l\'oignon. Chauffer l\'huile à feu moyen dans une cocotte, faire suer l\'oignon 5 min à couvert jusqu\'à translucidité sans coloration — c\'est la base aromatique.',
        'Ajouter le gingembre frais râpé fin et le curcuma, faire revenir 1 min en remuant jusqu\'à ce que les épices libèrent leurs arômes — vous les sentirez s\'épanouir.',
        'Ajouter les carottes taillées en rondelles de 1 cm, mouiller avec le bouillon de légumes chaud. Porter à ébullition, puis cuire à frémissement 20 min jusqu\'à ce qu\'une pointe de couteau entre sans résistance.',
        'Mixer au mixeur plongeant jusqu\'à obtenir une texture parfaitement lisse et veloutée. Pour un velouté de restaurant, passer au chinois fin.',
        'Incorporer le lait de coco hors du feu, rectifier l\'assaisonnement. Réchauffer doucement sans bouillir pour préserver la rondeur du coco.',
        'Servir avec un filet de lait de coco tourbillonné en surface et une pincée de curcuma pour la couleur.'
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
        'Préparer la marinade : mélanger l\'huile d\'olive, le jus de citron, l\'ail écrasé en purée et l\'origan séché. Inciser légèrement les blancs de poulet en surface — la marinade pénètre mieux. Mariner 10 min minimum.',
        'Chauffer une poêle en inox ou fonte à feu vif jusqu\'à ce qu\'elle fume légèrement. Déposer le poulet, ne pas toucher pendant 5-6 min pour obtenir une croûte d\'or. Retourner, cuire 5 min.',
        'Débarrasser le poulet sur une assiette, couvrir de papier d\'aluminium. Dans la même poêle, ajouter les tomates cerises entières et laisser compoter 3 min à feu moyen en les pressant légèrement.',
        'Déglacer avec un filet de jus de citron en grattant les sucs de cuisson — c\'est là que se concentre toute la saveur.',
        'Trancher le poulet en biseau, dresser sur les tomates fondantes. Parsemer les olives noires et la feta émiettée à la main.',
        'Finir avec quelques feuilles d\'origan frais si disponible et un filet d\'huile d\'olive à cru. Servir sans attendre.'
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
        'Préparer la vinaigrette en premier : dissoudre une pincée de sel fin dans le vinaigre de cidre, ajouter le miel, fouetter en incorporant l\'huile d\'olive en filet pour obtenir une émulsion stable.',
        'Torréfier les noix à sec dans une poêle 2-3 min jusqu\'à ce qu\'elles craquent et embaument — ce geste simple double leur saveur.',
        'Tailler la pomme en fines lamelles régulières à la mandoline ou au couteau, et les plonger aussitôt dans un bol d\'eau froide citronnée pour préserver leur blancheur.',
        'Émincer l\'oignon rouge en rondelles très fines. Les tremper 5 min dans l\'eau froide pour adoucir leur piquant tout en gardant le croquant.',
        'Égoutter soigneusement la pomme et l\'oignon. Effeuiller les épinards frais et les sécher si nécessaire — l\'eau tue la vinaigrette.',
        'Assembler la salade au moment du service : mélanger épinards, pomme, oignon, noix tièdes et feta émiettée. Assaisonner de vinaigrette en tournant délicatement à la main pour ne pas écraser.'
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
        'Mixer les flocons d\'avoine seuls 30 secondes pour obtenir une farine grossière — c\'est la base qui donne de la tenue aux pancakes sans alourdir la pâte.',
        'Écraser la banane très mûre à la fourchette jusqu\'à purée lisse. Incorporer les œufs un à un, puis le lait, la levure et la cannelle. Ajouter la farine d\'avoine et mélanger sans trop travailler la pâte — quelques grumeaux sont bons signe.',
        'Laisser reposer la pâte 5 min : la levure s\'active et les flocons s\'hydratent pour des pancakes plus moelleux.',
        'Chauffer une poêle antiadhésive à feu moyen-doux — pas trop fort, les pancakes à l\'avoine brûlent vite. Essuyer avec un papier huilé.',
        'Verser des cercles de pâte de 8-10 cm. Quand des bulles apparaissent en surface et que les bords semblent secs (2-3 min), retourner d\'un geste vif et cuire 1 min 30 côté face.',
        'Superposer les pancakes au fur et à mesure sur une assiette chaude. Servir immédiatement avec des fruits frais.'
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
        'Toaster le pain complet à chaleur vive jusqu\'à ce qu\'il soit bien croustillant et légèrement marbré — la tartine doit soutenir la garniture sans se détremper.',
        'Écraser l\'avocat à la fourchette avec le jus de citron vert et une pincée de sel de mer en flocons, en laissant quelques morceaux pour la texture — un guacamole lisse est sans personnalité.',
        'Émincer l\'oignon rouge en anneaux très fins. Rincer les câpres si elles sont au sel, les égoutter si elles sont au vinaigre.',
        'Étaler généreusement l\'écrasé d\'avocat sur les tartines encore chaudes, débordant jusqu\'aux bords.',
        'Disposer le saumon fumé en ondulations naturelles — jamais à plat, jamais froissé. Répartir les câpres et l\'oignon rouge.',
        'Finir avec les feuilles d\'aneth frais effeuillées à la main et un dernier trait de citron vert au service. Déguster dans la minute.'
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
        'Préchauffer le four à 200 °C. Piquer les patates douces en plusieurs endroits avec une fourchette, les frotter d\'un filet d\'huile d\'olive et les enfourner directement sur la grille 40-45 min — elles sont prêtes quand elles cèdent sous une pression légère.',
        'Pendant ce temps, égoutter et rincer les pois chiches, les sécher soigneusement avec du papier absorbant — un pois chiche humide ne croustille jamais. Les mélanger avec l\'huile restante, le paprika fumé, le sel et un peu de cumin si disponible.',
        'Rôtir les pois chiches sur plaque à 200 °C pendant les 20 dernières minutes de cuisson des patates, en les retournant à mi-temps, jusqu\'à ce qu\'ils soient dorés et craquants.',
        'Préparer le yaourt citronné : mélanger le yaourt grec avec le jus de citron, une pincée de sel et un peu de cumin. Goûter et ajuster.',
        'Inciser les patates en croix dans la longueur, écarter la chair avec les pouces pour former un nid. Ajouter une poignée d\'épinards frais dans la cavité chaude — ils fondent légèrement au contact.',
        'Garnir généreusement de pois chiches croustillants, napper de yaourt citronné. Servir sans attendre pour conserver le croustillant des pois chiches.'
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
        'Rincer le riz basmati jusqu\'à ce que l\'eau soit claire. Cuire à l\'eau salée — 1 volume de riz pour 1,5 volume d\'eau froide, porter à ébullition, couvrir hermétiquement et cuire 10 min à feu très doux, puis laisser reposer 5 min sans soulever le couvercle.',
        'Sécher les crevettes sur du papier absorbant — l\'humidité empêche la coloration. Chauffer l\'huile de sésame dans une poêle très chaude, saisir les crevettes 1 min 30 sur chaque face jusqu\'à coloration rosée-dorée. Déglacer avec la sauce soja et retirer du feu immédiatement.',
        'Tailler l\'avocat et la mangue en dés réguliers de 1,5 cm. Le concombre en demi-lunes fines. Citronner l\'avocat aussitôt.',
        'Préparer la sauce du bowl : mélanger le jus de citron vert restant avec les sucs de cuisson des crevettes pour un assaisonnement équilibré.',
        'Dresser le riz en base légèrement tassée. Disposer en quartiers distincts les crevettes chaudes, les dés d\'avocat, la mangue et le concombre — couleurs séparées, volumes généreux.',
        'Napper de la sauce citron-soja, parsemer les graines de sésame torréfiées à sec 1 min si possible. Servir sans délai — les crevettes doivent rester chaudes sur le riz tiède.'
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
        'Faire torréfier le cumin à sec dans la casserole 30 secondes jusqu\'à ce qu\'il embaume, puis ajouter l\'huile d\'olive.',
        'Faire suer l\'oignon émincé 5 minutes à feu moyen jusqu\'à transparence, ajouter l\'ail haché et cuire 1 minute.',
        'Incorporer les tomates concassées, monter le feu et laisser réduire 3 minutes pour concentrer les saveurs.',
        'Verser le bouillon et les pois chiches égouttés. Écraser grossièrement 1/4 des pois chiches à la fourchette pour lier la soupe naturellement.',
        'Laisser mijoter 12 minutes à feu doux. Hors du feu, incorporer les épinards frais et couvrir 3 minutes — ils cuisent à la chaleur résiduelle sans perdre leur couleur.',
        'Rectifier l\'assaisonnement, arroser d\'un filet d\'huile d\'olive crue au moment du service.'
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
        'Préchauffer le four à 220 °C (chaleur tournante). Couper poivrons, courgette et oignon rouge en morceaux réguliers de 3 cm — l\'uniformité assure une cuisson homogène.',
        'Disposer les légumes sur la plaque en une seule couche (ne pas superposer), arroser d\'huile d\'olive, saupoudrer d\'herbes de Provence, saler. Rôtir 25 minutes sans remuer : laisser les faces caraméliser.',
        'Rincer le quinoa à l\'eau froide. Le faire toaster à sec dans une casserole 2 minutes, puis ajouter 300 ml d\'eau froide salée. Porter à ébullition, couvrir, cuire 12 minutes à feu doux. Retirer du feu, laisser gonfler 5 minutes à couvert.',
        'Égrainer le quinoa à la fourchette. Verser le jus de citron et mélanger à chaud pour que les grains absorbent l\'acidité.',
        'Dresser : quinoa en base, légumes rôtis par-dessus, feta émiettée en dernier pour préserver ses arômes. Servir tiède.'
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
        'Tailler le poulet en petits dés réguliers de 1,5 cm. Chauffer la poêle ou le wok à feu maximal jusqu\'à légère fumée — c\'est la condition du "wok hei", ce goût fumé caractéristique.',
        'Saisir les dés de poulet 3 minutes sans les remuer pour obtenir une belle coloration. Réserver.',
        'Dans la même poêle très chaude, faire revenir oignon et ail émincés 1 minute, ajouter le sambal et mélanger 30 secondes pour le torréfier légèrement.',
        'Ajouter le riz froid (déjà égrainé à la main) en une seule fois. Presser contre la poêle 1 minute sans remuer pour faire griller le fond, puis sauter vivement.',
        'Verser sauce soja et kecap manis en filet sur les bords de la poêle (non sur le riz) pour qu\'elles caramélisent avant d\'être incorporées. Ajouter le poulet, mélanger 2 minutes à feu vif.',
        'Faire les œufs frits dans une poêle séparée avec une goutte d\'huile — le blanc doit être croustillant sur les bords, le jaune coulant. Poser sur le riz au moment du service.'
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
        'Cuire le quinoa dans 320 ml d\'eau salée : porter à ébullition, couvrir, 12 minutes à feu doux. Étaler sur une plaque et laisser refroidir complètement — un quinoa chaud fait ramollir les herbes.',
        'Pendant ce temps, hacher finement le persil (feuilles seulement, sans les tiges) et la menthe à la main au couteau — jamais au mixeur qui oxyde les herbes et les noircit.',
        'Couper les tomates en petits dés de 5 mm, les saler légèrement dans une passoire 5 minutes pour éliminer l\'excès d\'eau qui diluerait la vinaigrette.',
        'Préparer la vinaigrette : émulsionner le jus de citron avec l\'huile d\'olive et une pincée de sel en fouettant vivement.',
        'Assembler quinoa froid, herbes, tomates égouttées et oignons verts. Verser la vinaigrette, mélanger délicatement. Laisser reposer 15 minutes au frais avant de servir : le quinoa s\'imprègne des saveurs.'
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
        'Émincer les champignons en lamelles de 5 mm d\'épaisseur. Chauffer la poêle à feu vif sans matière grasse d\'abord — laisser l\'eau des champignons s\'évaporer 1 minute, puis ajouter l\'huile.',
        'Saisir les champignons à feu vif sans remuer 2 minutes pour les dorer. Les champignons bouillis sont sans intérêt ; les champignons dorés ont un goût de noisette. Saler, poivrer en fin de saisie. Réserver hors de la poêle.',
        'Battre les blancs d\'œufs à la fourchette jusqu\'à ce qu\'ils soient légèrement mousseux — pas en neige ferme, juste aérés. Saler.',
        'Dans la poêle essuyée, chauffer un filet d\'huile à feu doux. Verser les blancs, couvrir immédiatement avec un couvercle. Cuire 3 à 4 minutes : les blancs prennent sans brunir dessous.',
        'Déposer les champignons sur une moitié de l\'omelette, plier et glisser dans l\'assiette. Parsemer d\'oignon vert ciselé. Servir sans attendre.'
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
        'Faire revenir oignon finement ciselé dans l\'huile 5 minutes à feu moyen jusqu\'à légère coloration dorée. Ajouter ail et gingembre râpés, cuire 1 minute.',
        'Ajouter la pâte de curry rouge. Faire frire en remuant constamment 2 minutes à feu moyen-vif : la pâte doit "chanter" dans la poêle et perdre son odeur de cru.',
        'Verser le lait de coco en une seule fois. Racler les sucs caramélisés au fond de la poêle — c\'est là que se cache le goût. Incorporer les tomates cerises entières.',
        'Laisser mijoter à feu doux 8 minutes à découvert pour réduire légèrement la sauce et concentrer les saveurs.',
        'Hors du feu ou sur feu très doux, ajouter les crevettes. Couvrir 3 à 4 minutes : elles cuisent à la chaleur de la sauce sans devenir caoutchouteuses.',
        'Vérifier l\'assaisonnement. Parsemer généreusement de coriandre fraîche ciselée au dernier moment. Servir avec riz basmati.'
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
        'Dans un grand bol, mélanger les ingrédients secs : farine d\'avoine, levure chimique, pincée de sel.',
        'Dans un autre bol, fouetter les œufs avec le yaourt grec, le lait, le miel et la vanille jusqu\'à homogénéité.',
        'Verser les ingrédients liquides sur les secs. Mélanger à la spatule en 10 à 12 mouvements seulement : la pâte doit rester légèrement grumeleuse. Un mélange trop travaillé donne des pancakes durs et plats.',
        'Chauffer une poêle antiadhésive à feu moyen. Tester la température : une goutte d\'eau doit "danser" et s\'évaporer immédiatement. Huiler très légèrement avec un papier absorbant.',
        'Verser des louches de 60 ml de pâte. Quand des bulles apparaissent en surface et ne se referment plus (environ 2 minutes), retourner une seule fois. Cuire 1 minute 30 sur l\'autre face.',
        'Empiler les pancakes sur une assiette chaude, couverts d\'un linge propre pour qu\'ils restent moelleux. Servir avec fruits frais de saison.'
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
        'Cuire les fusilli dans une grande quantité d\'eau bouillante fortement salée (l\'eau doit "goûter la mer") jusqu\'à al dente — 1 minute de moins que le temps indiqué sur le paquet.',
        'Pendant la cuisson, préparer la vinaigrette : fouetter la moutarde avec le jus de citron, puis incorporer l\'huile d\'olive en filet en fouettant pour obtenir une émulsion stable. Saler, poivrer.',
        'Égoutter les pâtes. Les rincer brièvement sous l\'eau froide pour stopper la cuisson, puis égoutter soigneusement — des pâtes trop humides diluent la vinaigrette.',
        'Mélanger les pâtes encore légèrement tièdes avec la vinaigrette : tièdes, elles absorbent mieux les saveurs qu\'entièrement froides.',
        'Incorporer délicatement le thon émietté en gros morceaux (ne pas réduire en bouillie), les tomates cerises coupées en deux, le concombre en demi-rondelles et le maïs égoutté.',
        'Réfrigérer au moins 10 minutes avant de servir. Rectifier l\'assaisonnement et arroser d\'un filet d\'huile d\'olive crue au moment du dressage.'
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
        'Écraser l\'avocat à la fourchette en conservant quelques morceaux — une texture rustique vaut mieux qu\'une purée lisse. Incorporer immédiatement le jus de citron vert et une pincée de sel pour éviter l\'oxydation.',
        'Égoutter soigneusement le thon, l\'émietter en gros flocons. Mélanger délicatement avec le yaourt grec, les câpres hachées grossièrement et une pincée de poivre. Ne pas réduire en pâte.',
        'Passer chaque tortilla 20 secondes à sec dans une poêle chaude ou 10 secondes au micro-ondes : une tortilla tiède est souple et ne se casse pas au roulage.',
        'Garnir chaque tortilla en laissant 3 cm libres en bas : feuilles de laitue romaine en premier (elles font barrière contre l\'humidité), puis guacamole, puis thon, tomates cerises coupées en deux.',
        'Replier le bord inférieur sur la garniture, puis rouler fermement en serrant. Couper en diagonale à mi-hauteur pour le dressage — la coupe révèle les couches colorées.'
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
        'Placer les blancs de poulet entre deux feuilles de film alimentaire. Battre au rouleau à pâtisserie jusqu\'à 1,5 cm d\'épaisseur uniforme : une épaisseur régulière garantit une cuisson homogène.',
        'Assaisonner généreusement les deux faces. Chauffer l\'huile d\'olive dans une poêle à feu vif jusqu\'à ce qu\'elle frémisse légèrement.',
        'Saisir les blancs 4 minutes côté premier sans les bouger — résister à l\'envie de déplacer la viande pour obtenir une belle croûte dorée. Retourner, baisser à feu moyen, ajouter le beurre et cuire 4 minutes en arrosant continuellement avec le beurre fondu.',
        'Vérifier la cuisson : le jus qui s\'écoule doit être clair, non rosé. Retirer le poulet et le laisser reposer 3 minutes sur une planche — ce repos redistribue les jus dans la chair.',
        'Dans la même poêle, jeter l\'ail haché 30 secondes à feu moyen, puis déglacer avec le jus de citron en grattant vigoureusement les sucs caramélisés. Ajouter le thym, réduire 2 minutes jusqu\'à légère consistance sirupeuse.',
        'Napper les blancs de sauce au moment du service, parsemer de persil haché. Ne jamais napper à l\'avance — la sauce doit arriver chaude sur la viande reposée.'
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
        'Porter 1 L d\'eau à ébullition. Cuire les haricots verts 6 min exactement, égoutter et plonger immédiatement dans un bain d\'eau glacée 2 min : ils restent verts et croquants.',
        'Dans la même eau frémissante, cuire les œufs 9 min (jaune fondant). Écaler sous l\'eau froide, couper en quartiers nets.',
        'Vinaigrette : fouetter moutarde + jus de citron + ail râpé jusqu\'à émulsion, puis incorporer l\'huile d\'olive en filet. Assaisonner.',
        'Couper les tomates en quartiers épais, saler légèrement, laisser dégorger 3 min sur papier absorbant.',
        'Dresser d\'abord la romaine, puis disposer haricots, tomates, thon émietté en gros morceaux, œufs et olives par zones distinctes — ne jamais mélanger.',
        'Napper de vinaigrette au dernier moment. Servir sans attendre.'
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
        'Rincer le quinoa sous l\'eau froide 30 secondes pour éliminer l\'amertume. Cuire dans 120 ml d\'eau bouillante salée, couvrir, feu doux 12 min. Laisser reposer 5 min hors feu, égrener à la fourchette.',
        'Badigeonner le poulet d\'huile d\'olive, cumin et paprika. Cuire sur poêle très chaude 5-6 min par côté sans toucher — la croûte se forme seule. Laisser reposer 3 min avant de trancher.',
        'Râper la carotte en julienne fine, tailler le concombre en demi-rondelles de 3 mm. Trancher l\'avocat à la dernière minute et citronner aussitôt.',
        'Assembler en zones séparées autour du quinoa : légumes d\'un côté, poulet de l\'autre, avocat au centre.',
        'Émulsionner huile d\'olive + jus de citron + une pincée de cumin, napper au moment du service.',
        'Servir tiède : le contraste chaud-froid entre le poulet et les légumes crus est la signature du bowl réussi.'
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
        'Frotter le poulet avec ail râpé, sel et poivre. Cuire sur poêle chaude à sec 5-6 min par côté. Laisser reposer 3 min, trancher en biais — des lamelles élégantes, pas des cubes.',
        'Couper le pain complet en petits dés de 1 cm. Toaster à sec dans la poêle encore chaude 3-4 min en remuant : ils dorent et parfument sans une goutte de matière grasse.',
        'Sauce César légère : fouetter yaourt 0% + moutarde + jus de citron + ail râpé + huile d\'olive jusqu\'à texture lisse et crémeuse. Ajuster le sel.',
        'Déchirer la romaine à la main en morceaux généreux — jamais au couteau, cela oxyde les feuilles.',
        'Enrober la romaine de sauce juste avant de dresser. Déposer le poulet, parsemer les croûtons et terminer par le parmesan râpé à la minute.',
        'Servir immédiatement : une César, ça n\'attend pas.'
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
        'Si poulpe cru : le cuire dans une grande casserole d\'eau frémissante non bouillante (80-85 °C) avec une feuille de laurier et une tranche de citron pendant 40-45 min. Tester avec la pointe d\'un couteau : elle doit entrer sans résistance. Laisser refroidir dans le bouillon.',
        'Couper les tentacules en tronçons de 3 cm. Saisir 1-2 min sur poêle très chaude avec un filet d\'huile pour créer une légère caramélisation en surface.',
        'Tailler tomates, poivrons et oignon rouge en dés réguliers de 1 cm — l\'uniformité est la marque d\'un travail soigné.',
        'Vinaigrette : huile d\'olive + jus de citron + cumin + paprika + sel. Laisser infuser 5 min avant d\'utiliser.',
        'Mélanger poulpe tiède, légumes et olives. Arroser de vinaigrette, mélanger délicatement.',
        'Laisser reposer 10 min au frais, puis parsemer de persil haché grossièrement au moment du service.'
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
        'Verser le boulghour fin dans un bol, couvrir exactement d\'eau bouillante salée (pas plus). Couvrir d\'une assiette, laisser gonfler 10 min. Égrener à la fourchette, étaler sur une plaque pour refroidir rapidement.',
        'Griller le poulet assaisonné de sel et poivre 5-6 min par côté. Laisser tiédir, tailler en petits dés de 8 mm — de la même taille que les légumes.',
        'Hacher le persil et la menthe très finement au couteau (jamais au mixeur : ça brûle les herbes). La proportion doit être généreuse — le taboulé, c\'est les herbes d\'abord.',
        'Épépiner les tomates, les couper en brunoise de 5 mm. Épépiner évite l\'eau en excès dans le taboulé.',
        'Assembler boulghour + herbes + tomates + oignons verts + poulet. Assaisonner avec huile d\'olive + jus de citron généreux + sel.',
        'Réfrigérer 20 min minimum avant service : le taboulé se bonifie en reposant, les saveurs s\'harmonisent.'
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
        'Rincer les lentilles. Les cuire dans 3 fois leur volume d\'eau froide non salée, porter à ébullition, puis feu moyen 18-20 min. Saler uniquement les 5 dernières minutes — le sel en début de cuisson durcit la peau.',
        'Égoutter et étaler les lentilles sur une plaque pour arrêter la cuisson et conserver la tenue. Elles ne doivent pas être en purée.',
        'Préparer la vinaigrette à chaud pendant que les lentilles sont encore tièdes : huile d\'olive + vinaigre balsamique + origan + sel. Les lentilles tièdes absorbent mieux l\'assaisonnement.',
        'Trancher finement l\'oignon rouge. Couper les tomates cerises en deux.',
        'Assembler épinards frais en base, lentilles tièdes par-dessus — la chaleur légère flétrit légèrement les épinards, ce qui est voulu.',
        'Déposer les tomates et l\'oignon, émietter la feta à la main en gros morceaux généreux. Napper de vinaigrette et servir aussitôt.'
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
        'Sécher impérativement les crevettes sur papier absorbant avant cuisson — l\'humidité empêche la coloration.',
        'Chauffer la poêle à feu vif jusqu\'à légère fumée. Saisir les crevettes 1 min sans toucher, retourner, 1 min encore. Elles doivent être nacrées et légèrement dorées. Assaisonner en fin de cuisson seulement.',
        'Tailler la mangue en dés de 1,5 cm. Couper l\'avocat en lamelles de 5 mm juste avant de dresser, citronner au citron vert immédiatement pour éviter l\'oxydation.',
        'Vinaigrette acidulée : jus de citron vert + huile d\'olive + piment doux + une pincée de sel. Fouetter vigoureusement.',
        'Dresser la roquette en couronne, disposer avocat et mangue en alternance, poser les crevettes chaudes au centre.',
        'Napper de vinaigrette, parsemer de coriandre fraîche hachée grossièrement. Servir dans la minute — le contraste chaud-froid est l\'âme de ce plat.'
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
        'Cuire le riz brun dans 2 fois son volume d\'eau salée : porter à ébullition, couvrir, feu doux 18 min. Éteindre, laisser reposer 5 min couvert — le riz fini de cuire à la vapeur résiduelle.',
        'Sécher le saumon, assaisonner de sel. Chauffer une poêle antiadhésive à feu vif. Cuire côté peau 3 min jusqu\'à ce qu\'elle soit croustillante, retourner 1 min 30. Émietter en gros flocons.',
        'Réchauffer l\'edamame dans un bol d\'eau bouillante 3 min. Couper le concombre en fines rondelles obliques, la carotte en julienne ou spaghetti au économe.',
        'Sauce : sauce soja + huile de sésame + gingembre frais râpé + jus de citron vert. Goûter et ajuster.',
        'Assembler le bowl : riz en base, saumon côté peau visible, légumes et edamame par zones distinctes et colorées.',
        'Verser la sauce, parsemer de sésame toasté. Servir tiède en appréciant la peau croustillante du saumon.'
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
        'Porter à ébullition une grande casserole d\'eau généreusement salée (10 g de sel par litre). Cuire les fusilli 1 minute de moins que le temps indiqué : ils doivent rester fermes, la cuisson continue après égouttage.',
        'Égoutter, rincer brièvement à l\'eau froide pour stopper la cuisson, puis arroser immédiatement d\'un filet d\'huile d\'olive pour éviter l\'agglutination.',
        'Préparer la vinaigrette en premier : fouetter huile d\'olive + jus de citron + sel + poivre. Verser sur les pâtes encore tièdes pour qu\'elles s\'imprègnent.',
        'Égoutter soigneusement thon, olives et câpres. Couper les tomates en dés réguliers, l\'oignon rouge en brunoise fine pour adoucir son piquant.',
        'Mélanger délicatement pâtes + thon en gros morceaux + tomates + olives + câpres + oignon. Ne pas trop travailler.',
        'Rectifier l\'assaisonnement, déchirer le basilic frais à la main (jamais haché au couteau). Servir frais mais pas glacé : les saveurs ressortent mieux à 15 °C.'
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
        'Réhydrater le couscous : verser l\'eau bouillante salée exactement à hauteur du grain, ajouter 1 c.à.c d\'huile d\'olive, couvrir hermétiquement 5 min. Égrener à la fourchette en travaillant de bas en haut pour aérer.',
        'Torréfier les amandes effilées à sec dans une poêle froide montée progressivement à feu moyen 2-3 min, en secouant sans arrêt — elles colorent vite et brûlent encore plus vite. Réserver.',
        'Faire revenir l\'oignon émincé fin dans l\'huile d\'olive à feu moyen 4 min jusqu\'à translucidité. Ajouter l\'agneau haché, monter le feu, cuire 6-7 min en écrasant les grumeaux. Incorporer ras el hanout + cannelle les 2 dernières minutes.',
        'Déposer les raisins secs sur l\'agneau encore chaud hors feu : ils se réhydratent dans la vapeur résiduelle.',
        'Assembler couscous en base, agneau aux épices par-dessus avec son jus, amandes torréfiées, puis arroser de jus de citron.',
        'Parsemer de menthe et persil hachés grossièrement au dernier moment. Servir tiède : c\'est à cette température que les épices marocaines expriment toute leur profondeur.'
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
        'Griller le pain en tranches entières sous le gril du four 2 min par face — la croûte doit chanter. Couper en dés réguliers de 1 cm à froid.',
        'Ouvrir l\'avocat en deux, retirer le noyau avec le plat du couteau. Tailler en lamelles dans la peau, extraire à la cuillère. Arroser aussitôt du jus de citron pour préserver la couleur.',
        'Préparer la vinaigrette dans un bol : dissoudre une pincée de sel dans le citron restant, incorporer l\'huile d\'olive en filet en fouettant pour émulsionner légèrement.',
        'Disposer la roquette en base du saladier. Assaisonner directement la roquette avec la moitié de la vinaigrette — les feuilles doivent juste briller, sans flétrir.',
        'Disposer en éventail les lamelles d\'avocat, les tranches de saumon fumé légèrement roulées et les câpres. Ajouter les croûtons.',
        'Napper du reste de vinaigrette. Parsemer généreusement d\'aneth effeuillé à la main. Servir dans les 2 minutes.'
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
        'Préchauffer le four à 210 °C chaleur tournante. Couper la patate douce en dés de 2 cm, peau lavée conservée pour la fibre. Égoutter et sécher les pois chiches sur du papier absorbant — un pois chiche sec rôtit, un pois chiche humide cuit à la vapeur.',
        'Mélanger dés de patate douce et pois chiches avec l\'huile, le cumin, le paprika, sel et poivre. Étaler sur une seule couche sur la plaque — sans chevauchement. Rôtir 20-22 min sans remuer avant mi-cuisson.',
        'Aplatir légèrement le blanc de poulet avec la paume pour l\'uniformiser à 2 cm d\'épaisseur. Assaisonner sel, poivre, paprika. Saisir dans une poêle très chaude 4 min par face — ne pas déplacer avant d\'avoir une croûte dorée.',
        'Laisser reposer le poulet 3 min sous une feuille d\'aluminium. Trancher en biais à 1 cm d\'épaisseur.',
        'Sauce tahini : fouetter tahini + jus de citron + 2 c.à.s d\'eau froide + sel jusqu\'à consistance crémeuse fluide. Elle doit couler en ruban.',
        'Assembler : épinards frais en base, patate douce et pois chiches chauds, tranches de poulet en éventail. Napper de sauce tahini en zigzag.'
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
        'Égoutter et rincer les haricots noirs et le maïs à l\'eau froide. Sécher délicatement — l\'eau résiduelle dilue la vinaigrette et rend la salade fade.',
        'Couper tomates et oignon rouge en brunoise fine (5 mm). Mettre l\'oignon rouge 5 min dans un peu de jus de citron vert — il perd son agressivité et devient translucide.',
        'Couper l\'avocat en dés réguliers de 1,5 cm. Ne pas écraser : on veut des morceaux nets, pas une purée.',
        'Vinaigrette : jus de citron vert + huile d\'olive + cumin + piment + sel. Émulsionner à la fourchette.',
        'Assembler dans l\'ordre : haricots et maïs d\'abord, puis tomate et oignon égoutté, enfin l\'avocat posé délicatement sur le dessus sans mélanger encore.',
        'Verser la vinaigrette sur l\'ensemble. Mélanger une seule fois, en soulevant de bas en haut. Couvrir de coriandre fraîche ciselée. Servir dans les 10 minutes.'
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
        'Sécher les crevettes sur du papier absorbant — c\'est la règle d\'or avant toute saisie. Chauffer la poêle à feu vif jusqu\'à ce qu\'elle fume légèrement.',
        'Saisir les crevettes en une seule couche, 1 min 30 par face sans toucher. Elles doivent se recouvrir d\'une carapace dorée. Saler en fin de cuisson seulement. Réserver à température ambiante.',
        'Griller les triangles de pita sous le gril du four 3 min — ils doivent croustiller sans sécher.',
        'Couper tomates en quartiers (pas en dés), concombre en demi-lunes de 5 mm. Tailler la feta en cubes de 1 cm à la main — jamais râpée.',
        'Vinaigrette : huile d\'olive + citron + origan + sel. Fouetter 30 secondes pour lier.',
        'Assembler tomates, concombre et olives. Disposer les crevettes tièdes sur le dessus, la feta, le pita grillé. Arroser de vinaigrette au moment de servir.'
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
        'Rincer soigneusement le quinoa sous l\'eau froide 1 min — les saponines en surface donnent l\'amertume. Cuire dans 120 ml d\'eau bouillante salée à couvert 12 min. Éteindre et laisser gonfler 3 min à couvert. Étaler sur une plaque pour refroidir vite.',
        'Hacher le persil au couteau, pas au robot : les feuilles doivent rester vivantes, pas oxydées. Réserver les tiges pour un bouillon.',
        'Couper tomates, concombre et oignons verts en brunoise régulière de 4-5 mm — l\'homogénéité des dés est la signature d\'un bon taboulé.',
        'Égoutter et rincer les pois chiches. Les sécher brièvement sur du papier absorbant.',
        'Assembler quinoa froid + pois chiches + légumes + persil dans un grand saladier.',
        'Assaisonner : huile d\'olive en filet, jus de citron, sel, poivre. Mélanger en soulevant délicatement. Couvrir et réfrigérer 15 min minimum — le taboulé doit reposer pour que les saveurs se fondent.'
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
        'Sortir le rumsteak du réfrigérateur 15 min avant cuisson — une viande froide saisie à cœur se contracte et durcit. Réhydrater les vermicelles dans l\'eau chaude (non bouillante) 4-5 min. Égoutter, rincer à l\'eau froide, réserver.',
        'Chauffer une poêle ou une grille à feu maximum. Saisir le steak 3 min par face sans le déplacer pour obtenir une croûte marquée. Pour un rosé : appuyer légèrement au doigt — la viande doit céder légèrement mais pas s\'enfoncer.',
        'Laisser reposer le steak sur une planche 3 min recouvert d\'un bol retourné — jamais d\'aluminium, qui fait cuire la viande à la vapeur. Trancher en biais finement contre le fil du muscle.',
        'Julienner carotte et concombre en filaments de 4-5 cm. L\'homogénéité avec les vermicelles est essentielle pour la bouche.',
        'Sauce : sauce soja + huile de sésame + jus de citron vert + ail haché très fin + piment. Goûter et équilibrer — elle doit être vive, parfumée, légèrement salée.',
        'Assembler vermicelles + légumes + herbes fraîches entières (menthe, coriandre). Poser les tranches de bœuf. Napper de sauce au dernier moment. Servir aussitôt.'
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
        'Cuire le riz brun dans deux fois son volume d\'eau salée, à couvert, 18-20 min à feu doux. Éteindre et laisser reposer 5 min à couvert — les grains achèvent de gonfler sans accrocher.',
        'Presser le tofu ferme entre deux assiettes avec un poids (une boîte de conserve) pendant 10 min. Cette étape est décisive : un tofu bien pressé dore, un tofu humide frit dans sa propre eau.',
        'Couper le tofu en cubes de 2 cm. Chauffer l\'huile d\'olive dans une poêle anti-adhésive à feu moyen-vif. Saisir les cubes 4 min sans les toucher, puis retourner et cuire 3-4 min — chaque face doit être uniformément dorée.',
        'Déglacer le tofu avec la sauce soja directement dans la poêle hors feu — elle caramélise en quelques secondes et enrobe chaque cube.',
        'Sauce : huile de sésame + gingembre finement râpé + jus de citron vert. Ne pas chauffer l\'huile de sésame — elle se consomme crue pour préserver ses arômes.',
        'Assembler : riz en base, edamame réchauffé, carotte râpée, cubes de tofu laqués. Napper de sauce. Parsemer généreusement de sésame toasté.'
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
        'Griller le pain complet entier sous le gril du four, 2 min par face. Couper en dés de 1 cm à chaud — le pain chaud se coupe net et refroidit croustillant.',
        'Sortir la mozzarella du réfrigérateur 15 min avant — elle révèle ses arômes à température ambiante. Égoutter et sécher dans du papier absorbant. Couper en tranches de 8 mm.',
        'Couper les tomates en tranches régulières de 8 mm. Rouler serré chaque tranche de jambon de dinde.',
        'Préparer le dressing : dissoudre une pincée de sel dans le vinaigre balsamique, puis incorporer l\'huile d\'olive en filet en émulsionnant à la fourchette.',
        'Disposer la roquette en lit. Alterner sur le dessus — comme une caprese — les tranches de tomate et de mozzarella, intercalées des rouleaux de dinde.',
        'Arroser de dressing au moment de servir. Déposer les feuilles de basilic entières (jamais ciselées — elles noircissent), puis les croûtons en finition.'
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
        'Faire revenir les lardons de dinde à sec dans une poêle chaude 3 min jusqu\'à légère coloration. Ajouter les champignons émincés en fine tranche, saisir à feu vif 3 min sans remuer pour qu\'ils colorent — jamais à feu doux ou ils rendent leur eau.',
        'Griller le pain et tailler les croûtons à 1 cm. Préparer la vinaigrette tiède : déglacer la poêle des lardons avec le vinaigre balsamique, ajouter l\'huile d\'olive et la moutarde hors feu. Fouetter.',
        'Porter 1 litre d\'eau avec le vinaigre blanc à frémissement (90 °C — jamais à ébullition pleine). Former un tourbillon avec une cuillère. Casser l\'œuf dans un ramequin, le glisser au centre du tourbillon.',
        'Pocher 3 min : le blanc doit être pris, le jaune encore tremblant. Égoutter sur du papier absorbant. Répéter pour le second œuf.',
        'Assaisonner les épinards crus avec la vinaigrette tiède — ils s\'attendrissent légèrement sans cuire.',
        'Dresser : épinards, champignons et lardons, croûtons. Poser les œufs pochés au sommet. Servir immédiatement — l\'œuf doit être chaud quand le jaune est percé.'
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
        'Préchauffer le four à 200 °C chaleur tournante. Disposer les falafels sur une grille (pas une plaque pleine) pour que la chaleur circule tout autour et les rende croustillants uniformément. Enfourner 16-18 min sans ouvrir le four avant 12 min.',
        'Cuire le riz brun dans deux fois son volume d\'eau salée, couvercle fermé, 18 min à feu doux. Laisser reposer 5 min à couvert. Égrener avec une fourchette.',
        'Couper concombre et tomate en dés de 1 cm. Émincer l\'oignon rouge finement. Faire mariner l\'oignon dans le jus de citron 5 min — il perd son piquant.',
        'Assembler le riz tiède en base du bowl. Déposer le houmous en quenelle d\'un côté avec une cuillère à soupe passée sous l\'eau chaude — geste qui donne la forme parfaite.',
        'Disposer les légumes marinés de l\'autre côté. Placer les falafels chauds au centre, légèrement inclinés pour le visuel.',
        'Arroser d\'un filet d\'huile d\'olive et de jus de citron. Parsemer de persil ciselé et d\'une pincée de cumin. Servir immédiatement, falafels chauds sur houmous froid.'
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
        'Congeler la banane en rondelles la veille : elle donnera une texture crémeuse sans glace.',
        'Mixer l\'açaí en poudre avec la banane congelée et le lait d\'amande, en démarrant à vitesse lente puis en montant — 30 secondes suffisent. La base doit tenir à la cuillère, pas couler.',
        'Verser d\'un seul geste dans un bol bien froid (passé 5 min au congélateur).',
        'Disposer le granola en bande d\'un côté, les fruits rouges de l\'autre : l\'œil mange avant la bouche.',
        'Finir avec un filet de miel en spirale au centre. Servir immédiatement.'
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
        'Préchauffer le four à 175 °C chaleur tournante. Huiler les alvéoles au pinceau, puis les fariner légèrement — les muffins se démoulent nets.',
        'Émincer finement les épinards et les dés de tomate ; les éponger dans un torchon pour éliminer l\'excès d\'eau qui rendrait les muffins spongieux.',
        'Battre les œufs à la fourchette juste 20 secondes — on veut une liaison homogène, pas une mousse. Saler, poivrer.',
        'Incorporer épinards, jambon de dinde en petits dés, tomates et fromage râpé. Mélanger sans excès.',
        'Remplir chaque alvéole aux trois-quarts. Enfourner 17-19 min : la surface doit être dorée et à peine tremblante au centre.',
        'Laisser tiédir 3 min avant de démouler en passant la lame d\'un couteau sur le bord.'
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
        'Fouetter le lait de coco et le miel dans un bol jusqu\'à ce que le miel soit dissous — ne laissez pas de grumeaux de lait de coco figé.',
        'Verser les graines de chia en pluie en remuant constamment. Attendre 2 min, remuer à nouveau vigoureusement pour éviter les agrégats.',
        'Couvrir et réfrigérer au minimum 4h, idéalement toute la nuit. Le pudding doit avoir la consistance d\'un tapioca : ni liquide, ni béton.',
        'Au moment de servir, trancher la mangue en brunoise régulière de 1 cm — la régularité fait la différence visuelle et en bouche.',
        'Déposer la mangue sur le pudding en dôme. Servir bien frais.'
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
        'Congeler la banane en tronçons la veille. Peler et trancher le kiwi ; réserver au frais.',
        'Mixer les épinards avec le lait d\'amande en premier, 20 secondes à pleine puissance — les feuilles doivent être parfaitement lisses sans trace de fibre verte.',
        'Ajouter la banane congelée et mixer à nouveau jusqu\'à obtenir une base épaisse qui ne coule pas du mixeur retourné.',
        'Verser dans un bol froid. Disposer les tranches de kiwi en éventail, le granola en ligne nette, les graines de chia saupoudrées en dernier.',
        'Servir aussitôt : le granola doit rester croquant.'
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
        'Griller le pain complet jusqu\'à coloration dorée uniforme des deux côtés — pas brûlé, mais assez chaud pour tenir la garniture sans se ramollir.',
        'Écraser l\'avocat à la fourchette (pas au mixeur) avec le jus du demi-citron, une pincée de sel et de poivre : on veut une texture rustique avec des morceaux.',
        'Étaler généreusement l\'écrasé d\'avocat sur le pain chaud, bord à bord, en couche régulière d\'environ 5 mm.',
        'Déposer les tranches de saumon fumé en rosace légère, en les pliant à mi-hauteur pour créer du volume.',
        'Parsemer les câpres, effeuiller l\'aneth frais par-dessus. Terminer d\'un trait de citron au moment de servir.'
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
        'Mixer les flocons d\'avoine seuls 10 secondes pour obtenir une farine grossière — cela donne des pancakes plus légers qu\'avec des flocons entiers.',
        'Ajouter la banane et les œufs, mixer 15 secondes : la pâte doit être homogène mais pas aérée. Laisser reposer 3 min pour que la farine s\'hydrate.',
        'Chauffer une poêle anti-adhésive à feu moyen. Quand une goutte d\'eau saute au contact, la poêle est prête. Pas d\'huile : la banane suffit à empêcher l\'adhérence.',
        'Verser une louche, parsemer quelques myrtilles sur la pâte crue. Cuire jusqu\'à l\'apparition de bulles en surface (environ 2 min) avant de retourner.',
        'Cuire 1 min sur l\'autre face. Empiler les pancakes dans une assiette tiède.',
        'Servir avec les myrtilles fraîches restantes et le sirop d\'érable versé en dernier, jamais pendant la cuisson.'
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
        'Sortir le skyr 5 min avant de servir : trop froid, il est dense et acide — légèrement tempéré, sa douceur naturelle s\'exprime mieux.',
        'Fouetter brièvement le skyr à la fourchette pour l\'assouplir et créer une texture onctueuse, presque comme une crème.',
        'Laver et équeuter les fraises ; les couper en quatre si elles sont grosses, en deux si elles sont petites — l\'uniformité compte.',
        'Concasser grossièrement les noix au couteau (pas au mortier) pour avoir des éclats de tailles différentes : la mâche sera plus intéressante.',
        'Verser le skyr dans le bol, disposer les fruits en couronne, parsemer les noix. Finir d\'un filet de miel en spirale juste avant de servir.'
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
        'Émincer les champignons en tranches régulières de 3-4 mm. Chauffer l\'huile d\'olive à feu vif dans une petite poêle anti-adhésive.',
        'Sauter les champignons à feu vif sans remuer les 2 premières minutes : ils doivent dorer, pas suer. Saler en fin de cuisson seulement.',
        'Battre les œufs avec le fromage frais, sel et poivre. Baisser le feu au minimum — c\'est la règle d\'or des œufs brouillés.',
        'Verser les œufs sur les champignons. Avec une spatule souple, ramener doucement les bords vers le centre en mouvements lents et circulaires.',
        'Retirer du feu alors qu\'ils semblent encore légèrement sous-cuits : la chaleur résiduelle finit la cuisson hors flamme en 30 secondes.',
        'Dresser et parsemer de persil frais ciselé fin au dernier moment.'
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
        'Rincer le quinoa à l\'eau froide dans une passoire fine jusqu\'à ce que l\'eau soit claire — cette étape élimine la saponine, responsable de l\'amertume.',
        'Porter le lait d\'amande à frémissement avec la cannelle. Verser le quinoa, couvrir et cuire à feu doux 12-13 min sans soulever le couvercle.',
        'Éteindre le feu, laisser gonfler 3 min couvert. Le quinoa est prêt quand le germe blanc se détache en anneau autour du grain.',
        'Pendant ce temps, trancher la banane en biais et dénoyauter la pêche en lamelles régulières.',
        'Verser le quinoa dans le bol, disposer les fruits en alternance par couleur. Parsemer les amandes effilées toastées à sec 2 min à la poêle.',
        'Servir tiède — ni chaud brûlant, ni froid : c\'est ainsi que les arômes de cannelle s\'expriment pleinement.'
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
        'Mélanger la farine de sarrasin avec 150 ml d\'eau froide et une pincée de sel en fouettant sans grumeaux. Laisser reposer 30 min à température ambiante — indispensable pour que le gluten de sarrasin se détende.',
        'Chauffer la poêle à feu moyen-vif, huiler légèrement avec un papier absorbant huilé. Verser la pâte en inclinant la poêle pour couvrir toute la surface en fine couche.',
        'Cuire 2 min jusqu\'à ce que les bords se décollent et la surface soit mate. Casser un œuf au centre, poivrer.',
        'Couvrir avec un couvercle 2 min : le blanc se fige, le jaune reste coulant — c\'est la texture idéale.',
        'Replier les quatre bords en carré autour de l\'œuf. Glisser sur l\'assiette.',
        'Écraser l\'avocat à la fourchette avec quelques gouttes de citron, sel. Déposer sur la galette avec les épinards frais assaisonnés d\'un filet d\'huile d\'olive.'
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
        'Rincer le riz à l\'eau froide jusqu\'à ce que l\'eau soit claire, puis cuire à l\'absorption (eau froide départ, ratio 1:1,5). Laisser reposer 5 min à couvert.',
        'Pendant la cuisson du riz, couper le saumon en dés de 2 cm nets au couteau bien aiguisé. Mélanger sauce soja + huile de sésame, immerger le saumon et laisser mariner 8 min — pas davantage, l\'acidité cuit la chair.',
        'Cuire les edamames 3 min à l\'eau bouillante salée, égoutter et refroidir sous eau froide pour fixer la couleur verte.',
        'Tailler l\'avocat en tranches régulières au dernier moment. Passer la lame dans un filet de jus de citron pour éviter le noircissement.',
        'Couper le concombre en demi-lunes de 3 mm d\'épaisseur, côté peau conservée pour le croquant.',
        'Assembler le bowl : riz légèrement tiède en base, saumon égoutté (réserver la marinade comme sauce), légumes disposés en secteurs distincts. Napper d\'un trait de marinade, parsemer de sésame toasté à sec 30 secondes à la poêle.'
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
        'Aplatir légèrement le blanc de poulet au rouleau entre deux feuilles de film pour uniformiser l\'épaisseur à 1,5 cm : cuisson homogène garantie.',
        'Chauffer la poêle à feu vif jusqu\'à légère fumée. Déposer le poulet sans matière grasse, saisir 3 min sans bouger pour former une croûte dorée. Retourner, cuire 3 min.',
        'Baisser à feu moyen, verser la sauce teriyaki. Laisser caraméliser en retournant le poulet deux fois jusqu\'à enrobage brillant et laqué (environ 2 min). Retirer du feu, laisser reposer 2 min avant de trancher en lanières en biais.',
        'Placer les bao dans un cuiseur vapeur (ou une passoire fine sur casserole d\'eau frémissante) 3 min. Éviter le micro-ondes : il rend la pâte caoutchouteuse.',
        'Couper le concombre en bâtonnets fins et longs, assaisonner d\'une pincée de sel, laisser 2 min puis éponger : il perdra son eau et restera croquant dans le bao.',
        'Garnir les bao ouverts : lanières de poulet laqué, concombre, sésame toasté. Refermer délicatement sans écraser.'
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
        'Cuire le riz à l\'absorption. Pendant ce temps, assaisonner le bœuf haché de sauce soja + une gousse d\'ail écrasée. Réserver.',
        'Traiter chaque légume séparément à la poêle très chaude avec une goutte d\'huile de sésame : courgette en julienne 2 min, carotte râpée grossièrement 2 min, épinards 1 min juste flétris. Saler légèrement chaque fois. Ce soin des "namul" est l\'âme du bibimbap.',
        'Sauter le bœuf haché à feu vif 3-4 min en l\'émiettant à la spatule. La viande doit être colorée, pas bouillie — ne pas couvrir.',
        'Cuire l\'œuf au plat dans une poêle légèrement huilée : blanc pris, jaune coulant. C\'est ce jaune qui servira de sauce naturelle au moment du mélange.',
        'Chauffer légèrement le bol (eau chaude puis essuyer) avant de dresser : riz en base compacte, légumes disposés en quartiers distincts et colorés, bœuf au centre, œuf au plat par-dessus.',
        'Déposer le gochujang sur l\'œuf. Servir immédiatement — le convive mélange lui-même le tout (bibim = mélanger).'
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
        'Couper la carotte en julienne fine à la mandoline ou au couteau. Faire de même avec le concombre (épépiner au préalable). Mélanger avec le jus de citron, une pincée de sel et une de sucre. Laisser mariner 10 min minimum : les légumes vont rendre de l\'eau et s\'attendrir tout en gardant leur croquant.',
        'Cuire le riz jasmin à l\'absorption. Le riz jasmin ne supporte pas le trempage — utiliser directement eau froide et couvercle.',
        'Mariner le poulet 5 min dans sauce soja + sriracha + jus de citron. Chauffer une poêle-gril à feu vif et griller le poulet 4 min de chaque côté. Laisser reposer 2 min, trancher en biseau.',
        'Égoutter les légumes marinés en les pressant légèrement entre les paumes — l\'excès d\'eau diluerait le bowl.',
        'Préparer une sauce rapide : 1 cs sauce soja + quelques gouttes sriracha + 1 cs jus de citron. Goûter et ajuster le piquant.',
        'Dresser le bowl : riz, poulet tranché, légumes marinés pressés, coriandre fraîche en branches, sauce à part ou nappée au dernier moment.'
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
        'Éponger le tofu entre deux feuilles de papier absorbant, poser une assiette lestée dessus 10 min. Cette étape est indispensable : un tofu humide ne dorera jamais.',
        'Pendant le pressage, enfourner la patate douce en cubes de 2 cm à 200°C sur plaque huilée, en une couche sans chevauchement. Assaisonner sel + paprika. Cuire 20 min en retournant à mi-cuisson.',
        'Cuire le quinoa : porter l\'eau salée à ébullition, ajouter le quinoa rincé, couvrir et cuire 12 min à feu doux. Laisser gonfler 5 min hors feu.',
        'Couper le tofu pressé en cubes de 2 cm. Chauffer une poêle à sec à feu vif, dorer le tofu sur toutes ses faces 6-7 min sans remuer trop souvent — la croûte se forme dans la patience.',
        'Sauce tahini : délayer le tahini avec le jus de citron, ajouter 2-3 cuillères à soupe d\'eau froide en fouettant jusqu\'à consistance nappante et crémeuse. Saler.',
        'Assembler : quinoa en base, épinards frais, cubes de patate douce caramélisés, tofu doré, graines de tournesol. Napper généreusement de sauce tahini au moment de servir.'
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
        'Sortir le halloumi du réfrigérateur 10 min avant cuisson. Éponger soigneusement — l\'humidité de surface est l\'ennemi de la coloration.',
        'Couper le halloumi en tranches de 8 mm régulières. Chauffer une poêle à fond épais (fonte ou inox) à feu vif sans matière grasse. Poser les tranches et ne plus y toucher pendant 2 min : une croûte dorée doit se former naturellement avant de retourner. Encore 2 min côté deux.',
        'Couper les tomates cerises en deux. Mélanger avec la roquette, un filet de jus de citron et une pincée de sel au dernier moment — la roquette flétrit vite.',
        'Réchauffer la tortilla 30 secondes à la poêle sèche sur feu moyen, ou 20 secondes directement sur la flamme vive du gaz pour une légère coloration aromatique.',
        'Étaler le houmous sur toute la surface de la tortilla en laissant 2 cm de bord. Disposer les tranches de halloumi au centre, puis la salade de roquette-tomates.',
        'Rouler fermement en serrant avec les paumes, replier les côtés vers l\'intérieur à mi-chemin pour contenir la garniture. Couper en biais pour un beau visuel.'
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
        'Porter 500 ml d\'eau à ébullition, dissoudre le cube de bouillon. Baisser à frémissement doux. Ne jamais faire bouillir le bouillon avec le miso : la chaleur excessive tue ses ferments actifs et son arôme. Réserver le miso pour la fin.',
        'Plonger le blanc de poulet entier dans le bouillon frémissant (pas bouillant) et pocher 10 min. Sortir, laisser tiédir 2 min, puis effilocher à la fourchette en suivant les fibres de la viande — cette technique donne des morceaux tendres et souvenirs de texture.',
        'Spiraliser la courgette (zoodles) à l\'économe ou au couteau en longs rubans. Plonger 30 secondes dans le bouillon chaud, pas plus — ils doivent rester al dente.',
        'Cuire l\'œuf dans de l\'eau frémissante (non bouillante) exactement 6 minutes et 30 secondes pour un jaune coulant. Plonger aussitôt dans de l\'eau glacée 2 min. Écaler délicatement, couper en deux d\'un coup sec.',
        'Diluer le miso dans une petite louche de bouillon tiédi (moins de 70°C), puis incorporer au reste du bouillon hors du feu. Goûter et ajuster la sauce soja.',
        'Dresser dans un bol chaud : zoodles en fond, bouillon miso versé chaud, poulet effiloché, demi-œuf mollet, feuille de nori dressée sur le bord du bol.'
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
        'Réhydrater les nouilles de riz dans de l\'eau chaude (non bouillante, environ 70°C) pendant 8 min. Elles doivent rester légèrement fermes — elles finiront de cuire au wok. Égoutter et réserver.',
        'Préparer la sauce à l\'avance dans un bol : sauce soja + nuoc-mâm + beurre de cacahuète + jus de citron. Fouetter jusqu\'à homogénéité. Avoir tout prêt avant d\'allumer le wok : la cuisson sera trop rapide pour chercher les ingrédients.',
        'Chauffer le wok ou une grande poêle à feu maximum jusqu\'à légère fumée. Saisir les crevettes 1 min 30 sec sans les bouger — une face doit être rosée et légèrement dorée. Retourner 30 sec, pousser sur le bord.',
        'Dans l\'espace libéré, verser l\'œuf battu et brouiller rapidement avec une spatule en écrasant les morceaux à la texture souhaitée. Mélanger avec les crevettes.',
        'Ajouter les nouilles, verser la sauce en filet tout en remuant énergiquement par mouvements circulaires. Cuire 2 min à feu vif en mélangeant constamment — les nouilles doivent absorber la sauce et prendre de la couleur.',
        'Hors du feu, presser le jus de citron et parsemer de sésame toasté. Servir immédiatement dans un bol chaud — le pad thaï n\'attend pas.'
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
        'Préchauffer le four à 200°C chaleur tournante. Disposer les falafels surgelés sur une grille (et non une plaque) pour que la chaleur circule tout autour — la grille donne du croustillant sur toute la surface. Enfourner 20 min en retournant à mi-cuisson.',
        'Cuire le quinoa : rincer abondamment (enlève l\'amertume de la saponine), porter à ébullition dans le double de son volume d\'eau salée, couvrir et cuire 12 min à feu doux. Égrener à la fourchette après 5 min de repos.',
        'Pendant la cuisson, tailler tomates et concombre en dés de 5 mm réguliers. Hacher finement le persil (feuilles uniquement, pas les tiges). C\'est la précision de la coupe qui fait un taboulé élégant.',
        'Préparer la vinaigrette : huile d\'olive + jus de citron + une pincée de sel. Émulsionner à la fourchette. Assaisonner le quinoa tiède avec cette vinaigrette pendant qu\'il est encore chaud pour qu\'il l\'absorbe.',
        'Incorporer tomates, concombre et persil au quinoa vinaigrette. Goûter et rectifier l\'acidité avec quelques gouttes de citron supplémentaires.',
        'Dresser le bowl : taboulé quinoa en base généreuse, quenelle de houmous sur le côté, falafels croustillants posés en dernier pour préserver leur croustillant. Ne pas les enfoncer dans le taboulé.'
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
        'Porter une grande casserole d\'eau non salée à ébullition franche. Cuire les soba 4 min exactement (elles continuent à cuire hors de l\'eau). Les sortir et rincer immédiatement sous un filet d\'eau froide abondant en les frottant entre les mains — ce geste élimine l\'amidon de surface et les rend brillantes et non collantes.',
        'Égoutter le thon en boîte dans une passoire fine. Effeuiller à la fourchette en morceaux grossiers — pas en pâte. Un thon bien égoutté et effeuillé reste en bouche et ne détrempe pas le bowl.',
        'Couper le concombre en rondelles fines de 2 mm en biais pour l\'élégance. Tailler l\'avocat en éventail ou en quartiers réguliers au dernier moment.',
        'Préparer la sauce : sauce soja + huile de sésame + quelques gouttes d\'eau froide pour l\'alléger. La sauce doit napper légèrement la cuillère sans être trop épaisse.',
        'Toaster les graines de sésame 30 secondes dans une poêle sèche à feu moyen, en remuant constamment — elles brûlent vite. Retirer dès les premières volutes de fumée parfumée.',
        'Dresser le bowl : soba en nid au fond, thon effeuillé, éventail d\'avocat et rondelles de concombre. Napper de sauce soja-sésame, parsemer de sésame toasté. Servir frais.'
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
        'Rincer les lentilles. Les plonger dans 3 fois leur volume d\'eau froide non salée, porter à ébullition puis saler en fin de cuisson (20 min). Égoutter et laisser légèrement tiédir : saler trop tôt les durcirait.',
        'Sécher soigneusement le halloumi avec du papier absorbant. Le cuire dans une poêle sèche très chaude, 2 min par face, sans bouger : une croûte dorée se détache naturellement quand elle est prête.',
        'Préparer la vinaigrette directement dans le bol : jus de citron, huile d\'olive, cumin, sel. Émulsionner à la fourchette.',
        'Ajouter les lentilles tièdes et les épinards frais dans le bol. Les épinards vont légèrement fondre au contact de la chaleur — c\'est voulu.',
        'Couper la tomate en dés, l\'incorporer délicatement.',
        'Disposer les tranches de halloumi grillé sur le dessus au dernier moment pour conserver leur croustillant.'
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
        'Lancer le riz en premier (absorption : 1 volume riz / 1,5 eau, à couvert, feu doux 12 min). Il attend, le reste s\'organise autour.',
        'Tailler le blanc de poulet en fines lamelles dans le sens transversal des fibres. Assaisonner : paprika fumé, cumin, sel, une touche d\'huile. Masser 2 min pour que les épices pénètrent.',
        'Cuire les lamelles à feu vif dans une poêle très chaude, 2-3 min sans remuer puis retourner une seule fois. Le poulet doit être doré, non bouilli.',
        'Pendant la cuisson, couper la tomate en dés, trancher l\'avocat. Égoutter le maïs et les haricots noirs.',
        'Dresser le riz chaud au fond du bol, disposer chaque élément en segments séparés — couleurs et textures distinctes.',
        'Finir avec l\'avocat en dernier, un filet de jus de citron vert pour l\'empêcher de noircir.'
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
        'Cuire le riz par absorption (eau froide + sel, couvercle hermétique, feu doux). Ne jamais soulever le couvercle pendant les 12 premières minutes.',
        'Émincer finement l\'oignon. Le faire revenir dans l\'huile à feu moyen jusqu\'à translucidité (3-4 min), puis ajouter le poivron rouge coupé en brunoise. 2 min supplémentaires.',
        'Pousser légumes sur le côté, monter le feu à vif. Ajouter le bœuf haché en une seule couche : ne pas remuer immédiatement, laisser caraméliser 2 min avant de briser en morceaux.',
        'Saupoudrer cumin et paprika fumé sur le bœuf, mélanger, cuire encore 3 min. Goûter et rectifier le sel.',
        'Couper la tomate en dés, l\'incorporer hors feu : elle apporte fraîcheur sans cuire.',
        'Dresser : riz en base, bœuf épicé avec légumes au centre, haricots noirs et tomate fraîche en accompagnement.'
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
        'Rincer le riz jusqu\'à eau claire. Cuire par absorption (eau froide, couvrir, feu doux 12 min, repos 5 min couvercle fermé).',
        'Préparer le shari : verser le vinaigre de riz légèrement chauffé (avec une pincée de sel dissous) sur le riz encore chaud. Incorporer avec des gestes tranchants et rapides — jamais circulaires, pour ne pas écraser les grains. Refroidir à température ambiante, jamais au réfrigérateur.',
        'Pendant que le riz refroidit, placer le filet de saumon 5 min au congélateur : légèrement fermi, il se tranche beaucoup plus nettement.',
        'Couper le saumon en tranches biais de 5 mm, le concombre en rondelles fines, l\'avocat en éventail.',
        'Disposer le riz dans le bol, puis arranger les garnitures en zones colorées distinctes — l\'œil mange avant la bouche.',
        'Parsemer de graines de sésame. Servir la sauce soja à part, pas versée dessus : chaque bouchée doit garder son identité.'
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
        'Cuire le quinoa dans 1,5 fois son volume d\'eau salée, à couvert, 12 min. Laisser gonfler 3 min hors feu, égrener à la fourchette.',
        'Cuire les edamames surgelés à l\'eau bouillante salée, 3 min. Égoutter, passer sous l\'eau froide immédiatement pour fixer la couleur verte.',
        'Saler et huiler légèrement le blanc de poulet. Le griller dans une poêle striée (ou poêle ordinaire très chaude) 5-6 min par face. Laisser reposer 3 min avant de trancher : les jus se redistribuent.',
        'Préparer la sauce green goddess : tahini + jus de citron + persil ciselé + 2-3 cuillères d\'eau froide. Fouetter jusqu\'à consistance crémeuse et fluide. Goûter, rectifier l\'acidité.',
        'Trancher le poulet en diagonale — coupe nette, présentation plus généreuse.',
        'Dresser le quinoa en base, disposer poulet, avocat en tranches, concombre, edamames. Napper de sauce verte au moment du service.'
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
        'Préparer la marinade miso : mélanger pâte miso + miel + sauce soja jusqu\'à obtenir une laque lisse et homogène. Enduire le saumon côté chair uniquement — pas la peau.',
        'Laisser mariner minimum 15 min à température ambiante (ou 1h au réfrigérateur si on anticipe) : le miso pénètre et attendrit les fibres.',
        'Lancer le riz brun (plus long : 25 min). Placer le saumon sur une plaque légèrement huilée, four préchauffé 200°C, grille haute. Cuire 10-12 min : la laque doit être légèrement caramélisée mais non brûlée.',
        'Pendant la cuisson du saumon, faire sauter le bok choy à la poêle très chaude avec un filet d\'eau, 2 min : il doit rester ferme et brillant, jamais flasque.',
        'Dresser : riz brun en base, bok choy sauté d\'un côté, saumon laqué posé délicatement par-dessus sans briser la croûte caramélisée.',
        'Parsemer de graines de sésame au dernier moment. Servir immédiatement : le contraste chaud/croustillant/fondant ne dure que quelques minutes.'
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
        'Couper le poulet en dés de 3 cm. Mélanger dans un bol : yaourt 0%, garam masala, curcuma, sel. Enrober le poulet et laisser mariner au moins 15 min — le yaourt attendrit les protéines et la marinade devient une vraie base de sauce.',
        'Dans une casserole à fond épais, faire suer l\'oignon émincé à feu moyen-doux 5 min sans coloration. Ajouter le gingembre râpé finement, cuire 1 min.',
        'Ajouter les tomates concassées. Monter le feu, cuire 8 min à feu moyen en remuant régulièrement jusqu\'à ce que la sauce épaississe et que l\'huile commence à se séparer de la tomate — signe que la base est cuite.',
        'Incorporer le poulet avec sa marinade. Mélanger, couvrir, cuire 15 min à feu doux. Goûter et rectifier sel et épices en fin de cuisson uniquement.',
        'Pendant ce temps, cuire le riz basmati rincé par absorption : eau froide + sel, couvercle, 10 min feu doux.',
        'Servir le curry sur le riz basmati. Un filet de citron juste avant de table pour réveiller tous les arômes.'
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
        'Émincer finement l\'oignon, écraser et hacher l\'ail. Les faire fondre à feu doux dans l\'huile d\'olive 4-5 min sans coloration — la douceur de l\'oignon est la fondation de la sauce.',
        'Ajouter le bœuf haché : monter le feu à vif, ne pas remuer pendant 2 min pour obtenir une belle coloration. Briser ensuite avec une spatule, assaisonner en sel.',
        'Concasser les tomates à la main directement dans la casserole (ou les mixer grossièrement). Ajouter l\'origan. Cuire à feu moyen 15-18 min à découvert : la sauce doit réduire et devenir brillante, onctueuse.',
        'Cuire les pâtes dans un grand volume d\'eau très salée (l\'eau doit être "aussi salée que la Méditerranée"). Les arrêter 1 minute avant la fin indiquée : elles finiront dans la sauce.',
        'Verser les pâtes égouttées — conserver une louche d\'eau de cuisson — dans la sauce. Faire sauter 1 min à feu vif en ajoutant un peu d\'eau de cuisson : elle contient l\'amidon qui lie sauce et pâtes.',
        'Servir dans l\'assiette chaude, fromage râpé parsemé au dernier moment.'
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
        'Émincer l\'oignon. Le faire revenir à feu moyen dans une casserole à fond épais avec un filet d\'eau ou d\'huile, 5 min, jusqu\'à translucidité.',
        'Ajouter garam masala et curcuma directement sur l\'oignon chaud (sans liquide) : 30 secondes de tostage à sec libèrent les arômes liposolubles des épices — c\'est la différence entre une sauce fade et un curry profond.',
        'Ajouter les tomates concassées, mélanger, cuire 5 min à feu moyen jusqu\'à légère réduction.',
        'Égoutter et rincer les pois chiches. Les incorporer avec le lait de coco. Mijoter 12 min à couvert, feu doux. Écraser légèrement quelques pois chiches contre la paroi pour épaissir naturellement la sauce.',
        'Hors feu, incorporer les épinards frais par poignées : la chaleur résiduelle suffit à les faire fondre en 1-2 min sans les décolorer.',
        'Servir sur riz basmati. Un filet de jus de citron au dernier moment rehausse toutes les épices.'
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
        'Préparer la marinade bulgogi : sauce soja + miel + huile de sésame + gingembre râpé finement. Bien mélanger pour dissoudre le miel.',
        'Placer le bœuf haché 10 min au congélateur pour le raffermir légèrement, puis le façonner en galette fine de 1 cm. Incision plus facile, cuisson plus homogène. Mariner 10 min dans la sauce.',
        'Cuire le riz par absorption : 1 volume de riz / 1,5 volume d\'eau froide salée, couvercle hermétique, feu doux 12 min. Ne pas soulever le couvercle.',
        'Chauffer une poêle à feu très vif jusqu\'à légère fumée. Déposer le bœuf : cuire 2-3 min sans toucher, laisser la croûte se former. Retourner une seule fois. Le miel caramélise rapidement — surveiller pour ne pas brûler.',
        'Laisser reposer la viande 2 min, puis briser en morceaux irréguliers : le contraste entre les parties caramélisées et les zones tendres est l\'âme du bulgogi.',
        'Dresser le riz, disposer le bœuf bulgogi, la salade romaine ciselée. Parsemer de graines de sésame. Un filet d\'huile de sésame en finition.'
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
        'Émincer finement l\'oignon et le poivron en brunoise régulière. Faire suer à feu moyen dans l\'huile d\'olive 3 min sans coloration.',
        'Ajouter les tomates concassées grossièrement à la main, le cumin et le paprika fumé. Saler. Cuire à feu moyen 8-10 min en remuant jusqu\'à obtenir une sauce épaisse qui se détache des bords.',
        'Réduire le feu au minimum. Creuser 3 puits bien distincts avec le dos d\'une cuillère.',
        'Casser chaque œuf délicatement dans un ramequin, puis le glisser dans son puits — jamais directement depuis la coquille.',
        'Couvrir et cuire 5-6 min : le blanc doit être pris, le jaune encore tremblotant. Surveiller sans soulever le couvercle inutilement.',
        'Servir directement dans la poêle avec le pita chaud. Quelques feuilles de coriandre si disponibles.'
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
        'Inciser le blanc de poulet en profondeur sur 3-4 endroits avec la pointe du couteau. Insérer thym et romarin dans les entailles : les arômes pénètrent la chair, pas seulement la surface.',
        'Mariner 10 min minimum : jus et zeste de citron + huile d\'olive + sel. Le zeste est obligatoire — le jus seul ne parfume pas.',
        'Couper la patate douce en cubes de 2 cm réguliers, la courgette en demi-lunes de 1 cm. Taille uniforme = cuisson uniforme.',
        'Disposer les légumes en couche unique sur la plaque. Poser le poulet par-dessus. Four à 200°C (chaleur tournante), 22-25 min.',
        'À mi-cuisson (12 min), retourner les légumes. Ne pas toucher au poulet.',
        'Laisser reposer le poulet 3 min hors du four avant de trancher — les jus se redistribuent, la chair reste juteuse.'
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
        'Sécher impérativement le filet de cabillaud avec du papier absorbant. Un poisson humide ne croûte pas — il cuit à la vapeur.',
        'Mélanger chapelure + persil haché finement + zeste de citron + huile d\'olive. La préparation doit tenir en boule quand on la presse : ni trop sèche ni huileuse.',
        'Poser le poisson sur une plaque légèrement huilée. Tasser la croûte uniformément sur toute la surface avec la paume — épaisseur de 3-4 mm.',
        'Enfourner à 200°C, 10-12 min sans ouvrir le four. La croûte doit être dorée, le poisson nacré à cœur — une légère résistance sous le doigt, jamais ferme.',
        'Pendant ce temps, cuire les haricots verts 5 min à l\'eau bouillante salée, pas à la vapeur : ils restent verts et légèrement croquants.',
        'Égoutter, assaisonner les haricots d\'un filet d\'huile d\'olive et de fleur de sel. Dresser le poisson dessus pour ne pas le casser.'
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
        'Détailler le poulet en cubes de 3 cm. Mélanger avec yaourt + garam masala + curcuma + gingembre râpé finement + sel. Couvrir et laisser mariner 15 min minimum — c\'est ici que tout se joue.',
        'Lancer la cuisson du riz basmati à l\'eau froide salée, porter à ébullition puis couvrir à feu minimal.',
        'Faire fondre l\'oignon émincé finement dans une casserole à feu moyen sans coloration. Ajouter les tomates pelées et concassées + une pincée de garam masala. Mijoter 10 min.',
        'Mixer la sauce tomate-oignon jusqu\'à consistance lisse et veloutée. Remettre sur le feu.',
        'Incorporer le poulet mariné dans la sauce chaude. Cuire à feu moyen 12-15 min en remuant régulièrement. La marinade au yaourt crée naturellement l\'onctuosité — pas besoin de crème.',
        'Vérifier l\'assaisonnement. Servir sur riz basmati. Une pincée de garam masala frais au dressage ravive tous les arômes.'
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
        'Cuire le riz. Préparer tous les ingrédients avant d\'allumer le feu — un stir-fry, ça ne vous attend pas.',
        'Blanchir le brocoli en petits bouquets 2 min à l\'eau bouillante salée. Plonger immédiatement dans l\'eau glacée pour fixer la couleur et stopper la cuisson. Égoutter.',
        'Chauffer la poêle ou le wok à feu maximum 2 min à vide. Elle doit être très chaude — une goutte d\'eau doit s\'évaporer instantanément.',
        'Saisir le bœuf haché en l\'étalant sans remuer 90 secondes : laisser la croûte se former. Puis émietter et ajouter l\'ail et le gingembre râpé, encore 1 min.',
        'Ajouter le brocoli, la sauce soja et la sauce huître. Sauter en remuant vivement 90 secondes à feu vif — pas une seconde de plus pour garder le croquant.',
        'Hors du feu, filet d\'huile de sésame. Servir aussitôt sur le riz : un stir-fry qui attend est un stir-fry raté.'
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
        'Porter une grande casserole d\'eau à ébullition avec une bonne poignée de gros sel. L\'eau doit être "aussi salée que la mer".',
        'Dans une poêle, faire dorer légèrement l\'ail émincé dans l\'huile d\'olive à feu moyen — blond, jamais brun.',
        'Jeter les épinards frais dans la poêle, monter le feu, saler légèrement. Les retourner 1 min jusqu\'à ce qu\'ils tombent complètement. Retirer du feu.',
        'Plonger les gnocchi dans l\'eau bouillante. Ils sont cuits quand ils remontent à la surface (2-3 min) — les repêcher à l\'écumoire sans attendre.',
        'Ajouter la ricotta dans la poêle avec les épinards, feu doux, et bien mélanger pour obtenir une crème homogène. Incorporer les gnocchi égouttés avec une louche d\'eau de cuisson — c\'est elle qui lie la sauce.',
        'Dresser et parsemer de fromage râpé. Quelques tours de poivre du moulin.'
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
        'Cuire le riz à part. Réhydrater le wakame 5 min dans de l\'eau froide — il triple de volume. Égoutter et presser délicatement.',
        'Porter 400 ml d\'eau à 70-75°C : des frémissements apparaissent mais aucune bulle ne monte. Utiliser un thermomètre si possible, sinon éteindre le feu dès les premiers frémissements.',
        'Dans un bol, délayer la pâte miso avec 3-4 cuillères d\'eau chaude pour la fluidifier avant de l\'incorporer — jamais de grumeaux.',
        'Verser le miso dilué dans l\'eau chaude hors du feu. Remuer doucement. Ne jamais faire bouillir : la chaleur détruit les ferments vivants et l\'arôme.',
        'Couper le tofu soyeux en cubes de 1,5 cm avec un couteau bien aiguisé — le tofu soyeux est fragile. Ajouter délicatement dans le bouillon avec le wakame et la sauce soja.',
        'Laisser chauffer 1 min sans bouillir. Servir dans un bol préchauffé avec le riz, garnir d\'oignon vert émincé en biseaux fins.'
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
        'Placer le filet de saumon 10 min au congélateur avant de le couper : la chair légèrement ferme se taille beaucoup plus nettement en dés réguliers de 7-8 mm.',
        'Couper au couteau bien aiguisé, jamais de hachoir. Des dés francs, pas de la chair écrasée. Réserver au frais immédiatement.',
        'Préparer l\'assaisonnement séparément dans un bol : jus de citron + sauce soja + huile de sésame. Mélanger puis verser sur le saumon au dernier moment — pas avant, l\'acide "cuit" le poisson.',
        'Écraser l\'avocat à la fourchette grossièrement — de la texture, pas de la purée. Citron + sel. Couvrir d\'un film au contact pour éviter l\'oxydation.',
        'Au moment de servir : toast le pain complet. Disposer l\'avocat en base avec un emporte-pièce ou une cuillère, tartare de saumon par-dessus.',
        'Parsemer de graines de sésame légèrement torréfiées 1 min à sec dans une poêle. Servir sans attendre : un tartare se dresse et se mange aussitôt.'
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
        'Gratter les moules sous l\'eau froide courante. Arracher le byssus (le "filament") d\'un coup sec vers la pointe. Jeter sans hésiter toute moule ouverte qui ne se referme pas quand on la frappe sur le plan de travail.',
        'Faire revenir oignon émincé + ail écrasé dans l\'huile d\'olive à feu vif jusqu\'à légère coloration dorée — l\'arôme doit se libérer.',
        'Préparer 150 ml de bouillon de légumes chaud. Verser dans la casserole avec les oignons. Porter à ébullition.',
        'Jeter toutes les moules d\'un coup dans la casserole bouillante. Couvrir hermétiquement. Cuire à feu maximum 4-5 min en secouant la casserole à mi-cuisson.',
        'Dès que les moules sont ouvertes, stopper immédiatement le feu — une moule trop cuite est caoutchouteuse. Jeter toute moule restée fermée.',
        'Ciseler le persil frais grossièrement, parsemer sur les moules dans la casserole. Servir avec le pain complet toasté pour saucer le bouillon.'
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
        'Tailler le poulet en lanières régulières de 1,5 cm d\'épaisseur — l\'uniformité est la garantie d\'une cuisson homogène. Mariner 10 min minimum : sauce soja + miel + jus de citron.',
        'Lancer le riz jasmin à l\'eau froide (ratio 1:1,5), porter à ébullition, couvrir, feu minimal 12 min. Ne jamais soulever le couvercle.',
        'Préparer la sauce satay : beurre de cacahuète + 3 cs d\'eau chaude + sauce soja + miel. Fouetter vigoureusement en ajoutant l\'eau progressivement jusqu\'à consistance nappante et lisse. La sauce doit couler du dos d\'une cuillère.',
        'Essuyer le surplus de marinade sur le poulet avant de griller — le miel brûle vite. Poêle antiadhésive ou gril à feu vif, sans matière grasse supplémentaire.',
        'Cuire 3-4 min par face sans bouger les lanières : laisser la caramélisation se former. Vérifier la cuisson à cœur — les jus doivent être clairs.',
        'Dresser : riz en base, poulet grillé posé dessus, filet de sauce satay. Concombre tranché finement en éventail sur le côté. Graines de sésame torréfiées à sec, servir le reste de sauce à part.'
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
        'Dans un bocal hermétique, verser les graines de chia et le miel. Mélanger vigoureusement pour éviter les grumeaux.',
        'Ajouter les flocons d\'avoine puis verser le lait d\'amande en filet tout en remuant — les flocons doivent être bien immergés.',
        'Fermer le bocal, secouer 10 secondes, réfrigérer minimum 8 heures (une nuit idéalement).',
        'Le matin, sortir le bocal 5 minutes à température ambiante pour réveiller les saveurs.',
        'Trancher la banane en rondelles obliques (coupe à 45° pour plus d\'élégance). Réchauffer légèrement le beurre de cacahuète 10 secondes au micro-ondes pour le rendre coulant.',
        'Napper d\'un filet de beurre de cacahuète et disposer les rondelles de banane en rosace. Déguster immédiatement.'
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
        'Battre vigoureusement les 2 œufs avec le lait d\'amande et la cannelle jusqu\'à obtenir un appareil homogène et légèrement mousseux.',
        'Tremper chaque tranche de pain 30 secondes par face dans l\'appareil — le pain doit absorber sans se désintégrer. Un pain complet légèrement rassis est idéal.',
        'Chauffer une poêle antiadhésive à feu moyen. Quand une goutte d\'eau saute, la température est parfaite — graisser d\'un filet d\'huile de coco.',
        'Cuire les tranches 2 minutes par face sans les toucher pour obtenir une croûte dorée et caramélisée.',
        'Éponger les fraises, les couper en quartiers et les mélanger avec une pointe de miel.',
        'Dresser les toasts en éventail, napper du reste de miel, disposer les fraises. Servir aussitôt — le French Toast n\'attend pas.'
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
        'Casser les 3 œufs dans un bol, assaisonner avec le paprika fumé, sel et poivre. Battre à la fourchette jusqu\'à ce que le mélange soit homogène mais non mousseux.',
        'Égoutter et rincer les haricots noirs, les réchauffer 2 minutes à la poêle sèche à feu vif pour les assécher légèrement — ils tiendront mieux dans le wrap.',
        'Dans une poêle à feu doux avec un filet d\'huile d\'olive, verser les œufs battus. Mélanger lentement avec une spatule en raclant le fond pour obtenir des œufs brouillés crémeux. Retirer du feu quand encore légèrement tremblotants.',
        'Réchauffer la tortilla 30 secondes dans une poêle sèche bien chaude jusqu\'à apparition de petites bulles dorées.',
        'Écraser l\'avocat grossièrement à la fourchette avec une pincée de sel et quelques gouttes de citron. Couper la tomate en dés nets.',
        'Garnir la tortilla dans l\'ordre : avocat, haricots, œufs brouillés, dés de tomate. Rouler serré en repliant d\'abord les côtés. Couper en biais pour le service.'
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
        'Éplucher la pomme, la couper en deux. Râper une moitié grossièrement, tailler l\'autre en petits dés réguliers de 5 mm — deux textures qui s\'opposent dans le bol.',
        'Faire chauffer le lait d\'amande à feu moyen jusqu\'aux premiers frémissements. Verser les flocons en pluie en remuant immédiatement.',
        'Cuire 5 à 6 minutes à feu doux en remuant régulièrement en forme de 8 pour une cuisson homogène. Ajouter la pomme râpée et la moitié de la cannelle en cours de cuisson.',
        'Quand le porridge atteint la consistance d\'une crème (il épaissit encore en refroidissant), retirer du feu.',
        'Verser dans le bol. Disposer les dés de pomme au centre, concasser les noix grossièrement à la main pour des morceaux irréguliers et gourmands.',
        'Saupoudrer le reste de cannelle, arroser d\'un filet de miel en spirale. Servir sans attendre pour profiter de la vapeur parfumée.'
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
        'Sortir la ricotta 10 minutes avant de la travailler — à température ambiante, elle se lisse mieux.',
        'Battre la ricotta à la fourchette en ajoutant la moitié du miel et une pincée de sel fin. Fouetter 30 secondes jusqu\'à obtenir une texture aérée, presque comme une crème fouettée.',
        'Rincer délicatement les myrtilles et les fraises à l\'eau froide. Équeuter les fraises, les couper en quartiers nets.',
        'Verser la ricotta montée dans le bol en faisant un mouvement circulaire avec la cuillère pour créer un léger creux au centre.',
        'Déposer les fruits dans le creux en jouant sur les couleurs : alterner rouge et bleu-violet pour un effet visuel appétissant.',
        'Parsemer les amandes effilées grillées à sec 1 minute dans une poêle chaude, puis arroser du reste de miel en filet fin.'
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
        'Porter une casserole d\'eau salée à ébullition. Plonger les œufs 9 minutes exactement, puis les transférer dans un bain d\'eau glacée pour stopper la cuisson — le jaune restera légèrement moelleux au centre.',
        'Dans la même eau, cuire les haricots verts 4 minutes : ils doivent rester verts vifs et croquants. Les refroidir immédiatement dans l\'eau glacée pour fixer leur couleur.',
        'Préparer la vinaigrette : émulsionner l\'huile d\'olive avec le vinaigre balsamique et une pointe de moutarde en fouettant énergiquement. Assaisonner avec sel et poivre.',
        'Égoutter et effeuilletez soigneusement le thon. Couper les tomates en quartiers nets. Écaler les œufs et les couper en deux.',
        'Assaisonner la romaine avec la moitié de la vinaigrette, mélanger délicatement. La salade doit briller légèrement, pas nager.',
        'Dresser : romaine en base, puis déposer chaque élément en bouquet distinct — thon, haricots, tomates, olives, œufs. Arroser du reste de vinaigrette au moment de servir.'
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
        'Rincer le quinoa sous l\'eau froide 30 secondes dans une passoire fine — cette étape élimine la saponine amère que beaucoup oublient.',
        'Cuire le quinoa dans 140 ml d\'eau salée à ébullition, couvrir et réduire à feu doux 12 minutes. Retirer du feu, laisser reposer 5 minutes couvert, puis égrener à la fourchette.',
        'Pendant la cuisson, couper les tomates cerises en deux, le concombre en demi-rondelles après l\'avoir épépiné — l\'épépinage évite l\'excès d\'eau qui détrempe le bowl.',
        'Préparer la vinaigrette : jus de citron, huile d\'olive, origan émietté entre les doigts pour libérer les arômes, sel et poivre. Émulsionner à la fourchette.',
        'Mélanger le quinoa tiède avec la vinaigrette — il l\'absorbera mieux chaud que froid.',
        'Dresser en bowl : quinoa en base, légumes disposés par zones de couleur, émietter la feta grossièrement à la main par-dessus. Terminer avec quelques olives et un dernier filet d\'huile d\'olive.'
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
        'Réhydrater les nouilles de riz dans de l\'eau très chaude (non bouillante) pendant 8 minutes exactement, puis les égoutter et les rincer à l\'eau froide pour stopper la cuisson et éviter le collage.',
        'Couper le tofu ferme en cubes de 2 cm après l\'avoir soigneusement séché avec du papier absorbant — un tofu humide ne se dore jamais.',
        'Faire dorer les cubes de tofu dans une poêle très chaude avec un filet d\'huile, sans les bouger pendant 2 minutes par face pour obtenir une croûte bien croustillante.',
        'Préparer la sauce : mélanger beurre de cacahuète + sauce soja + jus de citron + 2 cuillères à soupe d\'eau tiède. Fouetter jusqu\'à consistance lisse et nappante. Goûter et ajuster.',
        'Tailler la carotte en julienne fine au couteau ou à l\'économe. Trancher le concombre en demi-lunes après l\'avoir épépiné.',
        'Assembler le bowl : nouilles en base, déposer tofu doré, carotte, concombre en zones distinctes. Napper généreusement de sauce cacahuète. Terminer par une pluie de graines de sésame grillées.'
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
        'Sortir le houmous du réfrigérateur 15 minutes avant le service — il gagnera en onctuosité et en arômes à température ambiante.',
        'Couper le concombre en bâtonnets réguliers après l\'avoir épépiné. Tailler les tomates en quartiers ou en dés selon votre humeur, mais avec précision — des coupes nettes témoignent du respect pour les ingrédients.',
        'Griller le pain pita directement sur la flamme du gaz ou dans une poêle sèche très chaude 30 secondes par face jusqu\'à l\'apparition de taches brunes légèrement carbonisées — cette légère amertume est un équilibre parfait avec le houmous.',
        'Lisser le houmous dans un bol creux avec le dos d\'une cuillère en faisant un mouvement en spirale, en creusant légèrement au centre pour recevoir l\'huile.',
        'Arroser le houmous d\'un généreux filet d\'huile d\'olive dans le creux central. Saupoudrer d\'une pincée de paprika ou de cumin.',
        'Dresser l\'assiette : houmous au centre, légumes disposés en rayons, olives à gauche, feta émiettée à la main à droite. Pita grillé découpé en triangles, posé en éventail. Simple, beau, honnête.'
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
        'Assaisonner le blanc de poulet avec sel, poivre et une pincée de paprika. Le poser dans une poêle chaude avec un filet d\'huile d\'olive — ne pas bouger pendant 4 minutes pour former une belle croûte dorée, retourner, cuire encore 3 minutes.',
        'Retirer le poulet, le couvrir de papier aluminium et laisser reposer 3 minutes — ce repos redistribue les jus et garantit un poulet tendre, pas sec.',
        'Dans la même poêle, cuire l\'œuf au plat à feu doux avec un couvercle 2 minutes : le blanc est pris, le jaune reste légèrement coulant.',
        'Griller les 3 tranches de pain dans le grille-pain ou à la poêle sèche jusqu\'à coloration dorée et uniforme des deux côtés.',
        'Trancher le poulet en lamelles fines en biais, couper les tomates en rondelles épaisses, essuyer les feuilles de romaine.',
        'Monter le club : pain n°1 tartiné de moutarde + romaine + tomates + lamelles de poulet / pain n°2 + œuf au plat + poivre / pain n°3. Maintenir avec un pic. Couper en diagonale — la coupe révèle les couches, c\'est la signature du club sandwich.'
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
        'Chauffer 400 ml de bouillon de poulet dans une casserole. Garder à frémissement constant — un bouillon froid tue le risotto.',
        'Dans une sauteuse, chauffer l\'huile d\'olive à feu moyen-vif. Colorer le poulet en dés 3 min sur chaque face sans remuer. Réserver.',
        'Dans la même sauteuse, faire suer l\'oignon émincé 2 min. Ajouter les champignons en lamelles, cuire 4 min jusqu\'à évaporation complète de l\'eau.',
        'Verser le riz, remuer 1 min à feu vif jusqu\'à ce qu\'il devienne translucide : c\'est la nacre qui va libérer l\'amidon.',
        'Verser le bouillon chaud louche par louche (environ 80 ml), en remuant constamment. Attendre absorption complète avant chaque ajout — 18 min au total.',
        'Hors feu, ajouter le poulet réservé et le fromage râpé, remuer vivement 30 sec. Couvrir 1 min avant de servir.'
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
        'Rincer les lentilles vertes à l\'eau froide jusqu\'à ce que l\'eau soit claire.',
        'Chauffer l\'huile d\'olive à feu moyen. Faire revenir l\'oignon émincé 4 min jusqu\'à légère coloration dorée.',
        'Ajouter le gingembre râpé, le curcuma et le garam masala : faire "bloomer" les épices 60 secondes en remuant — elles doivent embaumer mais pas brûler.',
        'Incorporer les tomates concassées, cuire 2 min. Verser les lentilles + 350 ml d\'eau froide. Porter à ébullition puis mijoter à couvert 20 min à feu doux.',
        'Verser le lait de coco, remuer et cuire encore 5 min à découvert pour épaissir légèrement.',
        'Rectifier l\'assaisonnement en sel, servir avec un filet de jus de citron pour réveiller l\'ensemble.'
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
        'Tartiner généreusement l\'intérieur de chaque tranche de pain complet avec la moutarde — elle agit comme barrière contre l\'humidité des tomates.',
        'Disposer le jambon de dinde sur une tranche, puis les tomates en rondelles fines épongées sur papier absorbant, enfin le fromage râpé sur l\'autre tranche.',
        'Refermer le sandwich en pressant fermement pour bien souder les bords.',
        'Poser à sec dans une poêle froide (sans matière grasse). Chauffer à feu moyen-doux : la chaleur progressive fond le fromage uniformément avant de griller le pain.',
        'Cuire 3-4 min par face en appuyant avec une spatule — une légère pression assure un contact total pour une croûte régulière.',
        'Sortir quand la croûte est dorée et que le fromage est filant. Laisser reposer 1 min avant de couper en diagonal.'
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
        'Porter le bouillon de légumes à frémissement avec le gingembre pelé en fines lamelles et 150 ml d\'eau. Infuser 5 min à couvert.',
        'Ajouter les champignons en quartiers, cuire 4 min à feu moyen. Verser le lait de coco, porter à frémissement sans jamais bouillir — l\'ébullition fait grainer le coco.',
        'Ajouter les crevettes : cuire exactement 2-3 min jusqu\'à ce qu\'elles s\'enroulent en virgule et rossissent. Stopper immédiatement le feu — une crevette trop cuite est du caoutchouc.',
        'Assaisonner hors feu avec la sauce soja et le jus de citron. Goûter et ajuster.',
        'Servir immédiatement dans un bol chaud, garnir de feuilles de coriandre fraîche entières.'
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
        'Mélanger le yaourt 0% avec le garam masala, le curcuma, le paprika fumé, une pincée de sel et 5 ml d\'huile. Inciser le blanc de poulet en diagonale (coupes de 5 mm) pour que la marinade pénètre en profondeur.',
        'Enrober le poulet de marinade et laisser reposer minimum 15 min à température ambiante (1h au réfrigérateur si possible).',
        'Préchauffer le four à 220°C. Tailler la courgette en demi-rondelles et le poivron en lanières. Étaler sur une plaque avec l\'huile restante, sel, et une pincée de paprika.',
        'Placer le poulet mariné sur la plaque avec les légumes. Enfourner 20 min. À mi-cuisson, retourner le poulet et remuer les légumes.',
        'Passer 2 min sous le gril pour obtenir des légères traces de carbonisation typiques du tandoori — c\'est là que réside le goût.',
        'Laisser reposer le poulet 3 min avant de trancher, pour que les jus se redistribuent.'
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
        'Pâte : mélanger la farine avec 60 ml d\'eau bouillante progressivement, pétrir 5 min jusqu\'à obtenir une pâte lisse et non collante. Envelopper dans un linge humide, reposer 20 min.',
        'Farce : ciseler finement le chou, le saler légèrement et laisser dégorger 5 min, puis essorer à la main — l\'excès d\'eau rend les gyoza mous. Mélanger avec le hachis de dinde, sauce soja, gingembre râpé, huile de sésame.',
        'Diviser la pâte en 10-12 portions. Abaisser chaque morceau en disque fin de 8 cm. Déposer 1 cuillère à café de farce au centre.',
        'Plier en demi-lune et pincer le bord supérieur en formant 4-5 petits plis (le "kata") — ce pliage n\'est pas décoratif, il soude hermétiquement.',
        'Chauffer une poêle antiadhésive avec quelques gouttes d\'huile. Dorer les gyoza à plat 2 min. Verser 3 cuillères à soupe d\'eau, couvrir immédiatement. Cuire à la vapeur 4-5 min.',
        'Retirer le couvercle, laisser l\'eau s\'évaporer 1 min pour que la base redevienne croustillante. Parsemer de graines de sésame. Servir avec sauce soja.'
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
        'Cuire le riz blanc : rincer 3 fois, couvrir d\'eau à hauteur +1 cm, porter à ébullition, couvrir et cuire à feu minimal 12 min. Éteindre, laisser reposer 5 min sans soulever le couvercle.',
        'Cuire les edamames dans de l\'eau bouillante salée 3 min, refroidir sous l\'eau froide pour fixer la couleur verte vive.',
        'Mélanger le thon égoutté avec la sriracha, la sauce soja et une goutte d\'huile de sésame si disponible. Goûter — le piquant doit titiller sans agresser.',
        'Tailler l\'avocat en tranches régulières au dernier moment, arroser de quelques gouttes de citron pour éviter l\'oxydation. Trancher le concombre en demi-rondelles fines.',
        'Dresser le bol : riz en base, les garnitures en segments bien distincts (thon, avocat, concombre, edamame) — l\'esthétique fait partie de l\'expérience.',
        'Finir avec les graines de sésame et un dernier filet de sauce soja. Servir immédiatement sans mélanger — chaque cuillère doit capturer plusieurs saveurs.'
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
        'Cuire le riz blanc en parallèle : rincer, couvrir d\'eau +1 cm, bouillir, couvrir feu minimal 12 min, repos 5 min couvercle fermé.',
        'Sécher les crevettes sur papier absorbant — l\'humidité empêche la coloration et crée de la vapeur au lieu de la croûte.',
        'Chauffer l\'huile d\'olive à feu vif jusqu\'à légère fumée. Ajouter l\'ail émincé finement, faire revenir 20-30 secondes sans colorer — l\'ail brûlé amargue tout.',
        'Ajouter les crevettes en une seule couche, sans surcharger la poêle. Saisir 90 secondes sans toucher, retourner uniquement quand elles commencent à rosir sur les bords.',
        'Cuire 60 secondes côté opposé. Les crevettes sont prêtes quand elles forment une virgule et ne sont plus translucides — stopper le feu immédiatement.',
        'Hors feu, ajouter le jus de citron frais et le persil ciselé. Remuer et dresser immédiatement sur le riz. Le citron ajouté hors feu garde toute sa fraîcheur.'
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
        'Sortir le tofu ferme de son emballage, l\'envelopper dans du papier absorbant et poser un poids dessus 10 min : éliminer l\'eau rend le tofu croustillant à la cuisson.',
        'Cuire le riz jasmin : rincer soigneusement, cuire selon ratio 1:1.5 eau, à couvert feu doux 12 min. Réserver.',
        'Couper le tofu en cubes de 2 cm. Chauffer une poêle à sec (sans huile) à feu vif, dorer les cubes 2-3 min par face jusqu\'à croûte dorée. Réserver.',
        'Dans la même poêle, verser un filet d\'huile, faire revenir le gingembre râpé et le garam masala 1 min. Ajouter la courgette en demi-rondelles et le poivron vert en lanières, sauter 3 min à feu vif.',
        'Verser le lait de coco et la sauce soja. Porter à frémissement (jamais à ébullition), mijoter 8 min à feu doux pour marier les saveurs.',
        'Incorporer les cubes de tofu dorés, mélanger délicatement pour ne pas les briser, chauffer 2 min. Servir sur le riz jasmin avec une touche de coriandre fraîche si disponible.'
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
        'Préparer la sauce vierge en avance : tailler les tomates en brunoise fine, émincer l\'ail en lamelles très fines. Mélanger avec l\'huile d\'olive, le jus de citron, le basilic ciselé au dernier moment, sel et poivre. Laisser infuser 10 min — les arômes se développent à température ambiante.',
        'Cuire les haricots verts dans de l\'eau bouillante abondamment salée 5 min (ils doivent rester légèrement croquants). Refroidir immédiatement dans de l\'eau glacée pour fixer la chlorophylle et le vert vif.',
        'Sortir le thon de la boîte, bien égoutter et façonner en pavé compact entre les paumes. Sécher la surface avec du papier absorbant.',
        'Chauffer une poêle à fond épais à feu très vif, sans matière grasse. Quand elle fume légèrement, déposer le pavé de thon.',
        'Saisir 1 min 30 sec par face sans toucher — obtenir une croûte dorée avec un cœur rosé. Le thon se mange rosé : cuit à coeur, il perd toute sa noblesse.',
        'Dresser les haricots verts en fagot, poser le thon saisi par-dessus, napper généreusement de sauce vierge à la dernière seconde. Servir immédiatement.'
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
        'Porter 1L d\'eau à frémissement (90°C, jamais à gros bouillon). Ajouter 2 cs de vinaigre blanc. Créer un tourbillon avec une cuillère.',
        'Casser chaque œuf dans une tasse, puis faire glisser délicatement au centre du tourbillon. Pocher 3 min exactement. Égoutter sur papier absorbant.',
        'Pendant ce temps, écraser l\'avocat à la fourchette avec le jus de citron, le piment finement émincé et une pincée de sel. Garder une texture légèrement chunky — ne pas mixer.',
        'Griller les tranches de pain complet 2 min sous le grill du four pour une croûte uniforme.',
        'Étaler généreusement l\'avocat sur le pain chaud. Poser les œufs pochés égouttés. Finir avec fleur de sel et un tour de poivre noir du moulin.'
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
        'Préchauffer le four à 150°C chaleur tournante. Tapisser une plaque de papier cuisson.',
        'Dans un saladier, mélanger les flocons d\'avoine avec les amandes effilées et les noix de cajou grossièrement concassées.',
        'Faire tiédir le miel avec l\'huile d\'olive (30 sec au micro-ondes ou dans une petite casserole). Verser sur le mélange sec et mélanger jusqu\'à enrobage homogène.',
        'Étaler en couche fine sur la plaque. Enfourner 20 min : remuer une seule fois à mi-cuisson, puis ne plus toucher jusqu\'à la sortie du four.',
        'Laisser refroidir entièrement sur la plaque sans remuer — c\'est là que se forment les clusters. Servir avec le lait d\'amande.'
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
        'Couper la mangue en morceaux. Si possible, la congeler 30 min à l\'avance pour obtenir une texture plus épaisse et glacée naturellement.',
        'Râper finement le gingembre frais (ou l\'émincer très fin) pour libérer ses huiles essentielles.',
        'Placer dans le blender dans cet ordre : lait d\'amande d\'abord (pour protéger les lames), puis skyr, mangue, curcuma, gingembre, miel et une pincée de poivre noir.',
        'Mixer à vitesse maximale 60 secondes jusqu\'à consistance parfaitement lisse et mousseuse. Goûter et ajuster le miel.',
        'Servir immédiatement dans un grand verre bien froid.'
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
        'Mixer les flocons d\'avoine à sec 30 secondes pour obtenir une farine grossière — pas trop fine, une légère texture apporte du moelleux.',
        'Écraser la banane très mûre (peau tachetée) à la fourchette jusqu\'à obtenir une purée lisse. La mélanger aux œufs battus, au lait d\'amande et au miel.',
        'Incorporer la farine d\'avoine et mélanger sans trop travailler la pâte. Laisser reposer 3 min : la farine s\'hydrate et la pâte gonfle légèrement.',
        'Huiler légèrement le gaufrier avec du papier absorbant. Verser la pâte, fermer et cuire 4-5 min sans ouvrir — la résistance disparaît quand la gaufre est prête.',
        'Couper les fraises en deux. Dresser les gaufres et disposer les fraises sur le dessus au dernier moment pour qu\'elles gardent leur fraîcheur.'
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
        'Couper la betterave cuite en brunoise régulière de 5 mm — une coupe uniforme est essentielle pour un tartare élégant et une bonne mâche.',
        'Torréfier les noix à sec 2-3 min à la poêle jusqu\'à légère coloration. Laisser refroidir, puis concasser grossièrement au couteau (pas au mixer).',
        'Préparer la vinaigrette dans un bol : huile d\'olive + vinaigre balsamique + sel + poivre. Émulsionner à la fourchette.',
        'Assaisonner la betterave avec la vinaigrette et laisser mariner 5 min. Émietter la feta par-dessus sans mélanger davantage pour garder les morceaux distincts.',
        'Dresser à l\'emporte-pièce ou en dôme libre. Parsemer de noix torréfiées et de persil ciselé. Servir frais.'
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
        'Rincer les lentilles vertes à l\'eau froide. Émincer finement l\'oignon, tailler la carotte en petits dés réguliers de 5 mm.',
        'Chauffer l\'huile d\'olive à feu moyen dans une casserole. Faire revenir l\'oignon 3-4 min jusqu\'à translucidité. Ajouter le cumin moulu et mélanger 30 secondes — le cumin doit griller légèrement pour libérer ses arômes.',
        'Ajouter les dés de carotte, mélanger 2 min. Incorporer les lentilles rincées, le cube de bouillon et 500 ml d\'eau bouillante.',
        'Porter à ébullition, réduire le feu, couvrir et cuire 20 min à frémissement jusqu\'à ce que les lentilles soient fondantes.',
        'Ajouter les épinards frais, couvrir 2 min hors du feu — ils cuisent dans la vapeur et gardent leur couleur vive. Mixer partiellement (2-3 coups de mixeur plongeant) pour obtenir une texture mi-crémeuse mi-rustique.'
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
        'Couper la banane en rondelles et la congeler la veille (ou au minimum 2h). Une banane congelée est indispensable pour la texture épaisse et glacée.',
        'Couper la mangue et le kiwi en cubes réguliers. Réserver au frais.',
        'Dans le blender : mettre la banane congelée, l\'açaí en poudre et le skyr. Mixer par impulsions courtes — utiliser le moins de liquide possible. La base doit être épaisse comme une crème glacée, pas fluide comme un smoothie.',
        'Verser immédiatement dans un bol bien froid (préalablement passé 5 min au congélateur).',
        'Garnir en bandes distinctes : mangue d\'un côté, kiwi de l\'autre, granola au centre. Parsemer les graines de chia en dernier. Servir sans attendre.'
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
        'Faire cuire le riz jasmin dans 120 ml d\'eau froide : porter à ébullition, couvrir, réduire au minimum 10 min, puis éteindre et laisser reposer 5 min couvercle fermé.',
        'Couper le poulet en cubes réguliers de 3 cm. Mariner dans la sauce teriyaki à température ambiante 10 min — pas au réfrigérateur, le froid bloque la pénétration de la marinade.',
        'Enfiler les cubes sur des piques en bois préalablement trempés 10 min dans l\'eau (pour éviter qu\'ils brûlent). Alterner poulet et morceaux d\'oignon vert si désiré.',
        'Préchauffer le grill au maximum. Cuire les brochettes 5 min d\'un côté. Retourner, badigeonner avec la marinade restante, cuire encore 5 min. La sauce doit caraméliser et former un laquage brillant.',
        'Dresser les brochettes sur le riz. Parsemer de graines de sésame et d\'oignons verts émincés en biais. Servir immédiatement.'
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
        'Sortir le blanc de poulet 15 min avant cuisson. Sécher avec du papier absorbant — une surface sèche garantit une belle croûte dorée. Saler, poivrer des deux côtés.',
        'Chauffer une poêle à feu vif avec un filet d\'huile. Saisir le poulet 4 min sans toucher, retourner, cuire encore 3-4 min. Couvrir hors du feu 2 min pour que les jus se redistribuent. Trancher en biais.',
        'Préparer l\'émulsion : fouetter ensemble moutarde + sauce soja + jus de citron. Incorporer l\'huile d\'olive en filet en fouettant pour créer une liaison lisse.',
        'Couper le pain en dés de 1 cm. Toaster à sec dans la poêle encore chaude 2-3 min en remuant — ils absorbent les sucs de cuisson du poulet et deviennent dorés et parfumés.',
        'Dans un grand saladier, mélanger la romaine déchirée avec la sauce. Dresser, poser les tranches de poulet, répartir les croûtons chauds, râper le fromage par-dessus. Servir aussitôt.'
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
        'Préchauffer le four à 200°C. Disposer les falafels sur une grille (pas sur une plaque) pour que l\'air chaud circule tout autour — cuire 18 min pour une croûte uniformément croustillante.',
        'Pendant ce temps, couper la courgette en bâtonnets et le poivron en lanières. Chauffer une poêle à feu vif sans matière grasse jusqu\'à ce qu\'elle fume légèrement. Griller les légumes 3-4 min sans remuer — laisser les marques se former avant de retourner.',
        'Presser quelques gouttes de citron sur les légumes grillés. Saler légèrement.',
        'Chauffer la tortilla 30 secondes dans la poêle sèche pour la rendre souple. Étaler le houmous sur toute la surface en laissant 2 cm de bord.',
        'Disposer la roquette, les légumes grillés et les falafels chauds en ligne au centre. Plier d\'abord les côtés, puis rouler fermement depuis le bas. Couper en biais et servir immédiatement.'
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
        'Décortiquer et déveiner les crevettes. Les blanchir 90 secondes dans de l\'eau bouillante salée, puis plonger immédiatement dans de l\'eau glacée pour stopper la cuisson. Éponger.',
        'Presser les 2 citrons. Dans un bol froid, coucher les crevettes dans le jus. Filmer et réfrigérer 10 minutes exactement — le jus "cuit" la chair en surface sans la durcir.',
        'Pendant ce temps, tailler avocat, concombre et tomate en brunoise de 5 mm. Émincer les oignons verts très finement en biseau.',
        'Égoutter les crevettes, réserver la moitié du jus de marinade. Incorporer délicatement les légumes aux crevettes sans écraser l\'avocat.',
        'Remettre le jus réservé, ajuster sel, poivre de Cayenne. Disposer en verrine ou assiette creuse froide. Parsemer de coriandre ciselée et d\'oignon vert. Servir aussitôt.'
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
        'Cuire les fusilli dans une grande eau très salée (10 g sel/litre) jusqu\'à al dente, soit 2 minutes de moins que l\'indication du paquet. Réserver 60 ml d\'eau de cuisson avant d\'égoutter.',
        'Pendant la cuisson des pâtes, saisir le blanc de poulet à feu vif dans une poêle chaude à sec 3 minutes par face. Couvrir hors feu 3 minutes — le centre finit de cuire doucement. Trancher en biais.',
        'Dans la même poêle, à feu moyen, colorer les tomates cerises entières 2 minutes jusqu\'à ce qu\'elles craquèlent légèrement.',
        'Hors du feu, mélanger les pâtes chaudes avec le pesto et 2 cuillères à soupe d\'eau de cuisson réservée. L\'amidon émulsionne le pesto et enrobe chaque fusilli uniformément.',
        'Ajouter le poulet et les tomates. Mélanger délicatement. Rectifier l\'assaisonnement. Parsemer de fromage râpé et servir immédiatement dans l\'assiette chaude.'
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
        'Couper la patate douce en rondelles de 3 mm d\'épaisseur, l\'oignon en rondelles fines, le poivron en lanières. Dans une poêle à bord haut de 20 cm, chauffer l\'huile à feu très doux.',
        'Confire les légumes à feu doux pendant 12 minutes, en remuant régulièrement : ils doivent être tendres et fondants, jamais colorés. C\'est la confiserie, pas la friture.',
        'Battre les œufs vigoureusement avec une pincée de sel. Verser sur les légumes hors du feu. Mélanger doucement 30 secondes pour bien enrober. Laisser reposer 2 minutes à feu très doux jusqu\'à ce que les bords soient pris.',
        'Couvrir la poêle d\'une grande assiette plate. D\'un geste ferme et rapide, retourner poêle + assiette ensemble. Faire glisser la tortilla de l\'assiette vers la poêle, côté cru en bas.',
        'Cuire encore 3 minutes à feu doux. Le cœur doit rester légèrement tremblotant — il finit de coaguler hors du feu. Laisser reposer 5 minutes avant de couper.'
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
        'Rincer abondamment le quinoa à l\'eau froide jusqu\'à ce que l\'eau soit claire — cela élimine la saponine amère. Cuire 12 minutes dans 2 volumes d\'eau salée. Égoutter et étaler sur une plaque pour refroidir rapidement.',
        'Épépiner les tomates, les couper en brunoise de 4 mm. Saler légèrement, laisser dégorger 5 minutes, puis éponger avec du papier absorbant — cela évite que le tabboulé ne soit détrempé.',
        'Hacher séparément le persil (tiges exclues, ciseler fin) et la menthe. La quantité de persil doit être généreuse — dans un vrai tabboulé, l\'herbe est la vedette, pas le grain.',
        'Dans un bol, préparer la vinaigrette en premier : jus de citron + huile d\'olive + sel + poivre. Émulsionner à la fourchette.',
        'Incorporer quinoa refroidi + légumes + herbes à la vinaigrette. Mélanger avec les mains (propres) pour sentir la texture. Filmer et réfrigérer 15 minutes minimum avant de servir — le repos est indispensable à l\'équilibre des saveurs.'
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
        'Égoutter soigneusement le thon et l\'émietter dans un bol avec le fromage râpé, sel, poivre et une pointe de harissa si désiré. La farce doit être sèche — pas de liquide résiduel qui ramollirait la brick.',
        'Sur plan de travail, étaler la feuille de brick. Déposer la farce de thon en arc de cercle, en laissant 5 cm de bords libres et un espace central pour l\'œuf. Casser délicatement l\'œuf entier au centre sans crever le jaune.',
        'Replier les deux bords latéraux sur la farce, puis rabattre le bas vers le haut pour former un rectangle hermétique. Pincer les bords — un paquet bien fermé ne fuit pas à la cuisson.',
        'Chauffer la poêle avec l\'huile d\'olive à feu moyen (pas fort). Poser la brick côté fermeture en dessous. Dorer 2 minutes et demie par face en appuyant légèrement avec une spatule. Le jaune doit rester coulant.',
        'Éponger sur papier absorbant 30 secondes. Dresser sur assiette avec la salade romaine et la tomate assaisonnées d\'un filet de citron. Manger immédiatement — la brick se ramollit en refroidissant.'
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
        'Peler et râper finement le gingembre. Écraser l\'ail en chemise avec le plat du couteau. Dans une casserole, verser un filet d\'huile et faire revenir gingembre + ail 1 minute à feu moyen — le sauté libère les huiles essentielles et décuple l\'arôme.',
        'Verser 600 ml d\'eau chaude, ajouter le cube de bouillon. Porter à frémissement (pas à gros bouillon — cela trouble le consommé et durcit les protéines).',
        'Ajouter le riz. Cuire 8 minutes à feu doux. Couper le blanc de poulet en lamelles fines de 5 mm dans le sens perpendiculaire aux fibres — elles cuisent en 4 à 5 minutes seulement dans le bouillon frémissant.',
        'Ajouter les lamelles de poulet. Cuire 5 minutes. Vérifier la cuisson : la chair doit être blanche jusqu\'au centre. Ajouter la sauce soja hors du feu pour préserver ses arômes volatils.',
        'Servir brûlant dans un bol chaud. Garnir d\'oignons verts ciselés en brunoise fine et d\'un voile de gingembre râpé frais par-dessus pour la fraîcheur.'
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
        'Préchauffer le four à 210°C. Couper la patate douce en bâtonnets réguliers de 1 cm de côté — l\'uniformité est la clé d\'une cuisson homogène. Enrober avec la moitié de l\'huile, sel. Enfourner 20 minutes, en retournant à mi-cuisson.',
        'Mélanger la viande hachée avec l\'oignon finement ciselé, la moutarde, sel et poivre. Travailler la farce avec la paume de la main, pas avec les doigts — cela évite de réchauffer la graisse. Former un palet de 2 cm d\'épaisseur maximum, bords légèrement pincés pour qu\'il ne se déforme pas à la cuisson.',
        'Sortir le steak du réfrigérateur 5 minutes avant cuisson. Chauffer la poêle à sec à feu très vif jusqu\'à légère fumée. Saisir le steak 1 minute à feu vif pour la croûte de Maillard, puis baisser à feu moyen.',
        'Cuire 2 à 3 minutes par face selon l\'épaisseur pour une cuisson rosée à cœur. Ne jamais écraser le steak avec la spatule — vous exprimez le jus et obtenez un galette sèche.',
        'Laisser reposer le steak 2 minutes sur une grille ou assiette chaude avant de servir. Les jus se redistribuent et la chair reste juteuse. Dresser avec les frites de patate douce et un filet de moutarde.'
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
        'Inciser le blanc de poulet en croisillons superficiels côté chair (3 mm de profondeur) : cela favorise la pénétration des arômes et accélère la cuisson. Frotter avec les herbes de Provence, sel, la moitié de l\'huile et un trait de jus de citron. Laisser mariner 10 minutes.',
        'Couper courgette, tomate et poivron rouge en dés de 2 cm. Dans une poêle chaude, chauffer le reste de l\'huile à feu vif. Saisir d\'abord le poivron 3 minutes, puis ajouter courgette et tomate. Assaisonner, cuire 8 minutes à feu moyen. Les légumes doivent garder de la tenue.',
        'Dans la même poêle (retirée du feu), saisir le blanc de poulet côté lisse à feu vif 2 minutes pour le colorer. Retourner, puis enfourner directement la poêle allant au four à 200°C pendant 12 minutes.',
        'Vérifier la cuisson avec la pointe d\'un couteau au plus épais : le jus qui s\'écoule doit être parfaitement clair. Laisser reposer le poulet 3 minutes sous une feuille d\'aluminium avant de trancher.',
        'Trancher le poulet en biais, dresser sur lit de légumes du soleil. Napper du jus de cuisson récupéré dans la poêle. Servir immédiatement.'
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
        'Rincer le riz à l\'eau froide 3 fois jusqu\'à eau claire. Cuire à l\'eau (ratio 1:1,2) à couvert, à feu doux : porter à ébullition, baisser au minimum, cuire 12 minutes, puis éteindre et laisser gonfler 5 minutes couvercle fermé. Ne jamais soulever le couvercle en cours de cuisson.',
        'Dans une petite casserole, chauffer le vinaigre de riz avec une pincée de sel à feu doux jusqu\'à dissolution (ne pas bouillir). Verser sur le riz chaud dans un grand bol. Mélanger en effectuant des mouvements de coupe latéraux avec une spatule plate — pas de mouvements circulaires qui écrasent les grains. Éventer pour refroidir à température ambiante.',
        'Couper le saumon frais en cubes de 1,5 cm. Si le saumon est destiné à être consommé cru, vérifier sa fraîcheur : chair ferme, couleur vive, odeur marine (jamais âcre). Assaisonner d\'un trait de sauce soja légère directement sur les cubes.',
        'Couper l\'avocat en tranches régulières, le concombre en demi-lunes de 3 mm. Ciseler les feuilles de nori en fines lanières à l\'aide de ciseaux.',
        'Dresser le riz en base du bowl, légèrement tassé. Disposer saumon, avocat, concombre en secteurs distincts — l\'esthétique du bowl, c\'est la séparation des couleurs. Finir avec le nori ciselé, les graines de sésame et la sauce soja sur le côté.'
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
        'Organiser la mise en place : préchauffer le four à 210°C. Couper la patate douce en cubes de 2 cm, enrober d\'une pointe d\'huile + cumin + sel. Enfourner 20 minutes. Pendant ce temps, cuire le quinoa rincé dans 2 volumes d\'eau salée, 12 minutes à frémissement — puis égoutter et étaler pour refroidir.',
        'Cuire les edamames surgelés 3 minutes dans eau bouillante salée. Égoutter, rafraîchir à l\'eau froide pour fixer la couleur vert vif.',
        'Assaisonner le blanc de poulet avec sel, poivre et paprika. Cuire à la poêle chaude à feu moyen-vif : 4 minutes par face, sans bouger la viande pour obtenir une belle croûte. Couvrir hors feu 3 minutes. Trancher en diagonale.',
        'Préparer la sauce tahini : mélanger le tahini avec le jus de citron, puis délayer progressivement avec 2 à 3 cuillères à soupe d\'eau froide jusqu\'à consistance nappante. Saler, une pointe d\'ail râpé si désiré. La sauce doit tomber lentement du cuillère — ni trop épaisse, ni liquide.',
        'Dresser le bowl méthodiquement : épinards frais en base, puis quinoa, patate douce rôtie, poulet tranché, edamames, tranches d\'avocat disposées en éventail. Parsemer les graines de tournesol. Verser la sauce tahini en filet harmonieux sur l\'ensemble. Servir sans attendre.'
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
        'Préchauffer le four à 180°C. Râper finement le zeste d\'un citron non traité sur le sucre érythritol et frotter du bout des doigts : le sucre capture les huiles essentielles et parfume toute la pâte.',
        'Dans un grand bol, assembler les secs : farine d\'avoine, whey vanille, levure chimique et le sucre zesté. Mélanger au fouet 30 secondes pour aérer.',
        'Dans un second bol, fouetter vigoureusement le fromage blanc avec les œufs et l\'extrait de vanille jusqu\'à obtenir une crème lisse et homogène.',
        'Verser les liquides sur les secs. Incorporer en croix avec une Maryse, 10 à 12 coups seulement — des stries blanches peuvent subsister. Trop mélanger rend les muffins caoutchouteux.',
        'Ajouter les pistaches hachées en réservant une cuillère à soupe pour la décoration. Plier délicatement. Garnir les caissettes aux deux tiers.',
        'Parsemer les pistaches réservées sur chaque muffin. Enfourner 20-22 min. Piquer au centre avec un cure-dent : il doit ressortir propre. Laisser reposer 10 min sur grille avant de démouler.'
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
        'Mixer les flocons d\'avoine 45 secondes à pleine puissance pour obtenir une farine fine et régulière — c\'est la base de la texture moelleuse.',
        'Ajouter dans le blender la banane bien mûre en morceaux (plus elle est noire, plus elle est sucrée et liante), les œufs, la whey, le lait d\'amande et la cannelle. Mixer 30 secondes jusqu\'à pâte parfaitement lisse.',
        'Transvaser dans un bol. Incorporer la levure chimique à la Maryse. Laisser reposer 5 min : la pâte épaissit et les bulles se forment — signe que la levure est active.',
        'Chauffer une poêle antiadhésive à feu moyen-doux avec une noisette d\'huile de coco essuyée au papier. La poêle est prête quand une goutte de pâte dore en 30 secondes.',
        'Verser une louche de pâte par pancake. Attendre les bulles en surface et les bords secs — 2 à 3 min. Retourner d\'un geste vif, cuire encore 1 min. Ne jamais appuyer sur les pancakes.',
        'Empiler les pancakes pour conserver la chaleur. Servir immédiatement avec rondelles de banane et cannelle fraîchement moulue.'
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
        'Préchauffer le four à 175°C. Faire tremper les dattes dans de l\'eau bouillante 10 min. Pendant ce temps, torréfier les noix de cajou à sec dans une poêle 3 min à feu vif en remuant sans arrêt, jusqu\'à légère coloration dorée et parfum de noisette. Hacher grossièrement.',
        'Égoutter et sécher les dattes. Les mixer en purée lisse et brillante — cette purée remplace tout sucre ajouté.',
        'Dans un bol, fouetter énergiquement les œufs avec la purée de dattes, le lait d\'amande et l\'extrait de vanille.',
        'Dans un grand bol, mélanger au fouet la farine d\'avoine, la whey chocolat, le cacao et la levure. Creuser un puits au centre.',
        'Verser l\'appareil humide dans le puits. Incorporer en mouvements circulaires larges avec une Maryse, juste jusqu\'à disparition du sec. Ajouter les cajous et plier deux fois.',
        'Répartir dans les 8 caissettes. Cuire 18-20 min. Sortir du four quand le centre est encore légèrement tremblant — le muffin se raffermit en refroidissant sur grille.'
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
        'Mixer les flocons d\'avoine en farine fine. Mélanger au fouet avec la levure dans un bol.',
        'Dans un second bol, fouetter le skyr avec les œufs et le lait d\'amande jusqu\'à obtenir une crème fluide et sans grumeaux.',
        'Incorporer les liquides aux secs à la Maryse, sans excès. Laisser reposer 5 min — la pâte épaissit légèrement.',
        'Plier délicatement la moitié des myrtilles dans la pâte sans les écraser. Réserver le reste pour le dressage.',
        'Cuire les pancakes à feu moyen dans une poêle huilée, 2 à 3 min par face, jusqu\'à coloration homogène. Ne jamais écraser.',
        'Mélanger le yaourt grec avec le miel pour créer la sauce. Dresser les pancakes, napper de sauce et disposer les myrtilles fraîches par-dessus. Servir aussitôt.'
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
        'Préchauffer le four à 180°C. Râper les carottes à la grosse grille et les déposer sur un torchon propre : tordre fermement pour en extraire l\'excès d\'eau — une carotte bien essorée donne un muffin qui ne s\'affaisse pas.',
        'Torréfier les noix 5 min au four sur plaque. Laisser tiédir, hacher grossièrement.',
        'Dans un grand bol, mélanger au fouet la farine d\'avoine, la whey, la levure, l\'érythritol, la cannelle, le gingembre et la muscade.',
        'Fouetter le fromage blanc avec les œufs. Incorporer les carottes essorées. Mélanger pour bien lier.',
        'Verser l\'appareil humide sur les secs. Plier en 8 coups de Maryse maximum. Ajouter les noix, deux coups de plus.',
        'Répartir dans les caissettes. Enfourner 20-22 min. Cure-dent propre = muffin prêt. Refroidir sur grille, glacer si souhaité avec fromage frais allégé et une pincée de cannelle.'
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
        'Séparer les blancs des jaunes. Dans un bol, fouetter le jaune d\'œuf avec le fromage blanc, le miel et le matcha jusqu\'à parfaite homogénéité et belle couleur verte. Tamiser la farine de riz, la whey et la levure par-dessus ; incorporer délicatement.',
        'Monter les blancs en neige très ferme avec une pincée de sel : ils doivent former des pointes dressées qui ne bougent pas quand vous retournez le bol. C\'est toute la légèreté du soufflé.',
        'Prélever un quart des blancs et les fouetter vigoureusement dans la base matcha pour la détendre. Puis incorporer le reste en deux fois avec une grande Maryse, en mouvements de bas en haut, sans jamais tourner.',
        'Chauffer une poêle à couvercle à feu très doux (3/10). Huiler au pinceau avec un carré de papier absorbant — juste un voile.',
        'Déposer 3 cercles épais de pâte à la cuillère. Verser 2 cuillères à soupe d\'eau sur le côté de la poêle (pas sur la pâte). Couvrir immédiatement. Cuire 4-5 min : la vapeur cuit le dessus.',
        'Retourner les pancakes avec deux spatules simultanément, avec la plus grande douceur. Couvrir. Cuire 3 min. Servir dans la seconde avec un voile de matcha et quelques myrtilles.'
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
        'Dans un plat creux, fouetter vigoureusement les œufs, le lait d\'amande, la whey vanille, l\'extrait de vanille et la cannelle jusqu\'à disparition de tout grumeau de whey.',
        'Trancher le pain épais en deux belles tranches. Les plonger dans l\'appareil, retourner après 1 min de chaque côté : le pain doit être imbibé jusqu\'au cœur sans se décomposer.',
        'Pendant le trempage, torréfier les amandes effilées à sec dans une petite poêle chaude, 2-3 min en remuant sans arrêt. Elles dorent vite — ne pas quitter des yeux. Réserver.',
        'Chauffer une poêle antiadhésive à feu moyen avec quelques gouttes d\'huile. Dorer les tranches 3-4 min par face jusqu\'à croûte bien caramélisée et cœur chaud.',
        'Couper les figues séchées en quartiers fins pour libérer leur caramel naturel.',
        'Dresser le french toast sur assiette chaude, napper de miel en filet, disposer les figues en éventail, parsemer les amandes torréfiées et finir d\'un trait de cannelle. Servir immédiatement.'
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
        'Préchauffer le four à 160°C, chaleur tournante. Dans un grand bol, mélanger les flocons d\'avoine, la whey vanille, la noix de coco râpée et le sel au fouet.',
        'Dans une petite casserole, chauffer doucement le miel avec l\'huile de coco jusqu\'à fluidité. Ne pas faire bouillir. Verser immédiatement sur le mélange sec et travailler à la spatule pour un enrobage uniforme de chaque flocon.',
        'Étaler le granola en une couche épaisse et compacte sur une plaque à four recouverte de papier sulfurisé. Appuyer légèrement avec le dos de la spatule pour tasser — les clusters naissent là.',
        'Enfourner 12 min. Parsemer alors les pistaches concassées sur le dessus — elles torréfient en finissant sans brûler. Remettre 8-10 min jusqu\'à belle coloration miel dorée.',
        'Sortir la plaque. Ne pas toucher. Laisser refroidir intégralement à température ambiante, au moins 30 min : c\'est le refroidissement qui cristallise le miel et crée le croustillant final. Briser en gros clusters. Conserver en boîte hermétique 2 semaines.'
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
        'Préchauffer le four à 160°C, chaleur tournante. Hacher les noisettes entières au couteau en deux : un côté grossier pour le croquant, un côté fin pour lier. Dans un grand bol, mélanger les flocons, la whey chocolat, le cacao tamisé et le sel.',
        'Dans une petite casserole, faire fondre à feu doux le beurre de noisette avec le sirop d\'érable et l\'huile de coco, en remuant. Dès que le mélange est lisse et chaud (pas bouillant), retirer du feu.',
        'Verser le mélange chaud sur les secs. Incorporer les noisettes. Mélanger à la spatule pour un enrobage complet et homogène.',
        'Étaler en couche épaisse sur plaque sulfurisée. Tasser fermement avec la paume. Enfourner 12 min. À mi-cuisson, retourner délicatement par grandes plaques avec une spatule large — pas de miettes.',
        'Cuire encore 10-12 min. Sortir et laisser refroidir sans toucher au moins 30 min. Le granola durcit en refroidissant. Briser en gros clusters "façon Ferrero". Conserver hermétiquement 2 semaines.'
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
        'Préchauffer une poêle sèche à feu vif. Torréfier les amandes entières 3-4 min en remuant jusqu\'à craquement et parfum intense. Laisser tiédir, puis mixer en poudre grossière avec quelques morceaux intacts pour le croquant.',
        'Mixer les dattes Medjool dénoyautées seules jusqu\'à obtenir une pâte collante et brillante. Si elles sont trop sèches, ajouter l\'eau cuillère par cuillère et mixer à nouveau.',
        'Ajouter à la pâte de dattes : whey vanille, flocons d\'avoine, cannelle et sel de mer. Mixer brièvement en impulsions, 4 à 5 fois — la texture doit rester rustique, pas lisse.',
        'Incorporer les amandes concassées à la spatule, à la main dans le bol : certains morceaux doivent rester entiers pour la mâche.',
        'Tapisser un moule rectangulaire (environ 20×15 cm) de film alimentaire en laissant dépasser. Verser la masse et presser fermement sur 2 cm d\'épaisseur uniforme avec les paumes — plus c\'est compact, mieux les barres tiennent.',
        'Réfrigérer minimum 2h. Soulever le film, démouler sur une planche. Couper en 10 barres nettes au couteau humide. Emballer individuellement. Se conservent 1 semaine au frigo, 3 mois au congélateur.'
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
        'Placer les noix de cajou au robot et pulser par impulsions courtes : on veut une semoule irrégulière, pas une poudre fine. L\'irrégularité donne de la mâche.',
        'Concasser les pistaches au couteau, à la main — jamais au robot. Réserver grossièrement pour les garder entières en bouche.',
        'Zester le citron vert sur une râpe fine directement au-dessus du bol : les huiles essentielles tombent dans la masse. Presser le jus. Ajouter protéine de pois, sirop d\'agave, sel. Mixer 10 secondes chrono, pas davantage.',
        'Verser l\'huile de coco fondue mais tiède (pas brûlante). Mixer 5 secondes. La pâte doit former une boule qui se détache des parois. Si elle colle, ajouter 5g de protéine ; si elle s\'effrite, 5ml d\'huile de coco.',
        'Incorporer les pistaches à la spatule, geste enveloppant, sans écraser. Étaler entre deux feuilles de papier sulfurisé sur 1,5 cm ; passer un rouleau pour lisser. Décorer de pistaches entières en appuyant légèrement.',
        'Réfrigérer 2h à plat. Démouler froid, couper d\'un coup de couteau chaud et sec (tremper la lame, essuyer entre chaque coupe). Conservation : 5 jours au frigo, 1 mois au congélateur.'
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
        'Base biscuit : mixer flocons + whey vanille + beurre d\'amande. Ajouter l\'eau, cuillère à soupe par cuillère, jusqu\'à obtenir une pâte qui se presse sans coller. Presser fermement dans le moule tapissé sur 1 cm d\'épaisseur uniforme — utiliser le fond d\'un verre pour compacter.',
        'Cuire la base 12 min à 175°C. Elle doit sonner creux en tapotant et dorer légèrement sur les bords. Laisser refroidir sur une grille, pas dans le moule — l\'humidité condenserait en dessous.',
        'Caramel : mixer dattes dénoyautées + beurre de cacahuète + lait de coco. Travailler 2 min à haute vitesse jusqu\'à obtenir un ruban lisse qui tombe en nappe. Goûter et ajuster : une pincée de sel révèle tout.',
        'Étaler le caramel sur la base froide en couche d\'1 cm. Lisser à la spatule trempée dans l\'eau chaude. Réfrigérer 30 min ferme.',
        'Faire fondre le chocolat noir au bain-marie à 50°C, puis le tempérer en remuant hors feu jusqu\'à 31°C : le glaçage sera brillant et claquant. Couper en 8 barres, enrober chacune en la plongeant et en la soulevant sur une fourchette.',
        'Déposer sur grille, parsemer de fleur de sel en effleurant. Réfrigérer 45 min. Démouler à température ambiante pour éviter la condensation.'
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
        'Ciseler la mangue séchée en morceaux de 5 mm au couteau — des morceaux nets, pas déchirés. Cette taille crée des "explosions" de saveur à chaque bouchée sans déséquilibrer la barre.',
        'Pulser les noix de cajou par impulsions de 2 secondes : arrêter dès qu\'on voit du grossier. Râper le gingembre frais à la microplane au-dessus du bol — le jus tombe en même temps que la pulpe.',
        'Ajouter whey vanille, miel et huile de coco fondue tiède. Mixer 8 secondes. La pâte doit se tenir entre deux doigts sans s\'émietter. Ajuster : eau si trop sèche, whey si trop collante.',
        'Incorporer la mangue ciselée à la spatule, geste vif et enveloppant. Répartir sans écraser les morceaux.',
        'Étaler entre deux feuilles de sulfurisé sur 1,5 cm. Passer un rouleau. Réfrigérer 2h à plat.',
        'Couper en 8 barres avec un couteau humide et chaud. Conserver au frigo 1 semaine, au congélateur 1 mois.'
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
        'Sortir le skyr du frigo 5 min avant : légèrement tempéré, il se lisse mieux et révèle plus d\'arômes. Verser dans un bol large et creux.',
        'Lisser le skyr en ramenant la cuillère du bord vers le centre en spirale : obtenir une surface légèrement concave qui accueillera les toppings sans qu\'ils roulent.',
        'Disposer le granola sur un côté uniquement — jamais tout autour — pour préserver son croustillant jusqu\'à la dernière cuillère. Il absorbera l\'humidité du skyr progressivement.',
        'Répartir myrtilles et framboises en quartiers distincts, couleurs contrastées. Saupoudrer les graines de chia.',
        'Drizzler le miel en spirale continue depuis le bord : il glisse sur les fruits et entre dans le granola, créant trois textures sucrées différentes. Servir immédiatement.'
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
        'Mixer les amandes seules 10 secondes : on veut une poudre avec des éclats, pas une crème. Réserver 30g de pistaches concassées au couteau pour l\'enrobage — la régularité des éclats compte.',
        'Mixer les dattes Medjool dénoyautées 1 min jusqu\'à pâte homogène et collante. Ajouter amandes, whey chocolat, cacao, vanille et fleur de sel. Pulser 5 fois, 2 secondes chacune — stopper dès que c\'est amalgamé.',
        'Tester la cohésion : presser une boule entre les paumes. Elle doit tenir sans coller aux mains. Si elle colle, ajouter 5g de cacao ; si elle s\'effrite, 5ml d\'eau froide.',
        'Peser 14 portions de 35g. Rouler chaque boule entre les paumes en mouvement circulaire continu — la chaleur des mains soude la masse. Travailler vite.',
        'Rouler la moitié dans les pistaches concassées, l\'autre moitié dans le cacao tamisé. Déposer sur plaque. Réfrigérer 1h minimum avant dégustation. Conservation : 7 jours au frigo.'
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
        'Chauffer le beurre de cacahuète et le miel ensemble 20 sec au micro-ondes — mélanger immédiatement à la spatule jusqu\'à obtenir un ruban brillant homogène. La chaleur ouvre les arômes du beurre de cacahuète.',
        'Ajouter les flocons d\'avoine en une fois, mélanger. Incorporer la whey vanille en pluie fine en tournant : éviter les grumeaux. La masse doit devenir dense et non collante.',
        'Incorporer les cranberries séchées à la spatule. Si la pâte colle aux doigts, placer 20 min au frigo sans couvrir : elle se raffermira en surface.',
        'Former 12 boules de 50g chacune en pressant d\'abord dans la paume en creux, puis en faisant rouler entre les deux paumes. La précompression évite les fissures.',
        'Déposer sur plaque sulfurisée sans se toucher. Réfrigérer 30 min minimum. Conservation : 10 jours au frigo dans une boîte hermétique.'
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
        'Base : mixer dattes + amandes + cajou jusqu\'à pâte collante qui forme une boule. Presser uniformément au fond d\'un moule 20cm tapissé de papier sulfurisé — utiliser le fond d\'un verre fariné pour compacter et lisser. Réfrigérer pendant la préparation de la crème.',
        'Crème : fouetter d\'abord le cream cheese seul 1 min pour le détendre et l\'aérer. Ajouter skyr, puis whey en pluie, puis miel, jus de citron et zeste. Fouetter jusqu\'à obtenir un appareil qui forme des vagues fermes sous le fouet.',
        'Verser la crème sur la base froide depuis le centre, en spirale vers les bords — la pression est plus douce et évite les trous d\'air. Tapoter le moule deux fois sur le plan de travail pour chasser les bulles.',
        'Lisser à la spatule trempée dans l\'eau chaude. Filmer au contact pour éviter une peau. Réfrigérer minimum 4h, idéalement une nuit.',
        'Coulis : mixer 100g de framboises avec quelques gouttes de citron. Passer au tamis fin pour éliminer les graines — texture veloutée garantie. Verser sur le cheesecake froid en partant du centre.',
        'Décorer les framboises entières en cercles concentriques. Couper en 6 parts avec un couteau chaud et sec, essuyé entre chaque coupe.'
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
        'Préchauffer le four à 175°C. Fouetter beurre de cajou + œufs à la main jusqu\'à obtenir un appareil lisse et légèrement pâle — 1 min de fouet vif suffit. Ne pas utiliser de batteur électrique : on ne veut pas d\'air.',
        'Tamiser ensemble farine d\'avoine, whey chocolat, cacao, sel et bicarbonate directement au-dessus du bol. Incorporer en trois fois à la spatule, geste en "J" — stopper dès que la farine disparaît. Trop mélanger durcit le cookie.',
        'Incorporer les pépites de chocolat d\'un geste rapide. La pâte doit être ferme mais malleable. Si elle colle, placer 10 min au frigo.',
        'Peser 10 portions de 55g. Rouler en boules. Déposer sur plaque sulfurisée en laissant 5 cm entre chaque. Aplatir avec la paume à 1,5 cm d\'épaisseur — ni plus, ni moins.',
        'Parsemer une pincée de sel de mer sur chaque cookie. Enfourner 10-11 min : le contour est mat, le centre brille légèrement — c\'est le signe qu\'ils sont parfaits.',
        'Sortir du four et ne pas toucher pendant 10 min : ils continuent de cuire sur la plaque chaude. C\'est ce repos qui crée le cœur fondant.'
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
        'Sortir les fruits congelés 3 min avant : juste assez pour que le robot les attaque sans forcer son moteur. Verser d\'abord le lait de coco au fond du bol du mixeur, puis les fruits congelés par-dessus.',
        'Mixer par impulsions de 3 secondes, scraper les bords entre chaque impulsion. Ajouter la whey vanille. Mixer jusqu\'à texture épaisse et homogène — résister à l\'envie d\'ajouter du liquide. La texture doit tenir une cuillère droite.',
        'Verser dans un bol froid (sorti du congélateur 2 min avant). Lisser la surface en ramenant la spatule du bord vers le centre.',
        'Placer granola, noix de cajou, noix de coco râpée et myrtilles en rangées nettes perpendiculaires au bord du bol — la géométrie transforme un bol ordinaire en bol instagrammable et appétissant.',
        'Drizzler le miel en zig-zag par-dessus. Servir immédiatement : chaque minute qui passe ramollit le granola et liquéfie la base.'
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
        'Cuire la patate douce à la vapeur (pas au four) : elle reste plus humide et absorbe moins de saveurs parasites. Éplucher à chaud et écraser immédiatement à la fourchette — la chaleur libère l\'amidon et facilite l\'émulsion avec les œufs.',
        'Pendant que la purée est encore tiède (pas brûlante), incorporer le beurre de cajou et fouetter énergiquement : la chaleur fait fondre les corps gras et crée une émulsion lisse. Ajouter les œufs un par un en fouettant entre chaque.',
        'Incorporer vanille, puis tamiser whey chocolat + cacao + sel directement au-dessus de la masse. Mélanger à la spatule en geste enveloppant, 15 rotations maximum — le brownie doit rester dense, pas aéré.',
        'Verser dans un moule 20×20cm tapissé de papier sulfurisé. Tapoter le moule sur le plan de travail 3 fois pour chasser les bulles. Parsemer les noix de cajou concassées en appuyant légèrement pour qu\'elles adhèrent.',
        'Cuire à 170°C pendant 20-22 min. Tester avec un cure-dent : il doit ressortir avec quelques miettes humides collées — pas propre, pas coulant. Ce détail est la frontière entre fudgey et sec.',
        'Laisser refroidir complètement dans le moule. Réfrigérer 2h avant de découper : le froid fixe la structure fudgey. Couper en 9 carrés d\'un geste net, couteau chaud et sec, essuyé entre chaque coupe.'
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
        'Mixer 120 g de noix de cajou à sec pendant 2 min jusqu\'à obtenir une pâte de cajou lisse et légèrement huileuse — c\'est cette texture naturelle qui lie la bouchée sans ajout excessif de matière grasse.',
        'Tamiser le matcha au-dessus du bol avant de l\'incorporer : cela évite les grumeaux verts et garantit une couleur uniforme. Ajouter la whey, l\'huile de coco fondue (pas chaude) et le miel. Mixer 30 secondes.',
        'Tester la consistance : la pâte doit se détacher des parois et former une boule sans coller. Si elle est trop molle, réfrigérer 20 min à plat sur une assiette, pas dans un récipient fermé (condensation évitée).',
        'Peser des portions de 25 g avec une cuillère à glace pour l\'uniformité. Aplatir chaque portion en disque, déposer une cajou entière au centre, refermer en pinçant bien les bords, puis rouler entre les paumes en mouvements circulaires fermes.',
        'Verser la noix de coco râpée dans une assiette creuse. Déposer la boule et la faire rouler en appuyant légèrement — l\'enrobage doit adhérer en une couche dense et blanche, caractéristique du Raffaello.',
        'Disposer sur une plaque chemisée et réfrigérer 1 h minimum. Les bouchées sont meilleures le lendemain : le matcha développe ses arômes au froid.'
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
        'Plonger les feuilles de gélatine dans un grand volume d\'eau froide (pas tiède) pendant exactement 5 min. Une gélatine bien réhydratée fond proprement et ne laisse aucun fil.',
        'Chauffer le lait à 80 °C (premier frémissement, jamais à ébullition). Essorer la gélatine entre les mains pour en chasser toute l\'eau, puis la dissoudre dans le lait chaud en fouettant 30 secondes. Laisser redescendre à 40 °C.',
        'Dans un saladier froid, lisser le fromage blanc à la spatule souple. Verser le lait gélatineux en filet tout en mélangeant — ne jamais verser le fromage blanc dans le lait chaud, cela caille la protéine.',
        'Ajouter le miel et la vanille. Passer le mélange au travers d\'une passoire fine pour une texture parfaitement soyeuse. Répartir dans 4 verrines sans les remplir à ras bord.',
        'Couvrir d\'un film alimentaire au contact et réfrigérer 2 h minimum. Le froid doit être progressif : ne pas mettre au congélateur pour accélérer.',
        'Pour le coulis : chauffer les fruits rouges avec le jus de citron et la stevia 5 min, écraser à la fourchette, filtrer au chinois pour un coulis brillant. Refroidir avant de napper chaque verrine au service.'
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
        'Fondre le chocolat au bain-marie (eau à 60 °C, bol hors contact de l\'eau) en remuant lentement. Retirer dès que fondu et lisser à la spatule. Laisser tiédir à 35 °C — au-delà, il cuit le fromage blanc ; en-dessous, il se fige.',
        'Lisser le fromage blanc à la spatule dans un grand bol froid. Tamiser le cacao et la stevia dessus, mélanger énergiquement pour obtenir une crème chocolatée dense et homogène.',
        'Incorporer le chocolat fondu tiédi en un seul versement sur la crème. Mélanger rapidement au fouet jusqu\'à brillance totale — le geste doit être décidé, pas hésitant.',
        'Monter les blancs : démarrer au batteur à vitesse lente 30 sec (les blancs se structurent), ajouter la pincée de sel, puis passer à vitesse maximale jusqu\'à bec d\'oiseau ferme. Les blancs surdimensionnés (trop fermes) cassent la mousse.',
        'Incorporer ¼ des blancs en neige dans le chocolat en fouettant sans ménagement pour détendre la masse. Ajouter le reste en 2 fois à la maryse, en soulevant depuis le bas vers le haut — 10 gestes larges maximum.',
        'Répartir immédiatement en verrines sans tasser. Réfrigérer 1 h. Ne pas couvrir pendant la prise pour éviter la condensation en surface.'
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
        'Préchauffer le four à 150 °C chaleur statique (jamais ventilée : le flux d\'air craquelle la surface). Dissoudre le café soluble dans 2 cs d\'eau chaude pour obtenir un café concentré.',
        'Fouetter les œufs avec le sucre de coco jusqu\'à légère mousse — pas de ruban, juste l\'incorporation du sucre. Incorporer le yaourt grec, le lait tiède, le café et la vanille en mélangeant doucement.',
        'Passer au travers d\'une passoire fine : cette étape retire les chalazas et donne une surface lisse et nette. Laisser reposer 5 min pour que les bulles montent et s\'effacent.',
        'Verser sans verser de bulles : incliner les ramequins et couler le mélange contre la paroi. Placer les ramequins dans un plat à four, verser de l\'eau chaude (80 °C) jusqu\'à mi-hauteur des ramequins.',
        'Enfourner 25–28 min. La crème est prête quand les bords sont pris et que le centre tremble encore légèrement (comme une gelée). Sortir, laisser refroidir à température ambiante puis réfrigérer 2 h minimum.',
        'Au moment de servir, saupoudrer 5 g de sucre de coco en couche uniforme et fine. Passer le chalumeau en mouvements circulaires réguliers à 3 cm de la surface jusqu\'à caramel brun-ambré. Servir dans les 2 minutes.'
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
        'Dénoyauter les dattes si nécessaire et les tremper 5 min dans de l\'eau tiède pour les assouplir. Égoutter et sécher. Mixer dattes + flocons d\'avoine + noix de cajou par impulsions courtes : la pâte doit être humide et compacte, pas liquide.',
        'Foncer un moule à tarte (Ø 22 cm) chemisé de film alimentaire : presser la pâte du centre vers les bords avec le pouce en remontant à 2 cm sur les parois. Égaliser l\'épaisseur à ~5 mm. Réfrigérer 15 min.',
        'Fouetter le fromage blanc avec le miel, la vanille et la cannelle. Travailler 1 min à la spatule pour serrer la texture et chasser l\'excès d\'humidité — une crème trop liquide détrempera le fond.',
        'Étaler la crème sur le fond de tarte froid en une couche régulière, en laissant 1 cm de bord libre pour la présentation.',
        'Couper les bananes en biais (coupe oblique à 45°) pour de plus belles tranches. Les disposer en rosace ou en rangées serrées, en légère superposition.',
        'Râper le chocolat noir à la microplane directement au-dessus de la tarte pour des copeaux fins et homogènes. Servir frais dans l\'heure — les bananes noircissent si elles attendent.'
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
        'Préparer un café fort (type café turc ou espresso serré) et le refroidir complètement au réfrigérateur. Un café tiède ramollit trop vite les boudoirs et noie le dessert.',
        'Fouetter ensemble le fromage blanc, le skyr, le mascarpone, le sucre de coco et la vanille pendant 2 min au fouet électrique. La crème doit être dense et tenir légèrement au fouet — le mascarpone apporte la structure grasse essentielle.',
        'Monter les blancs en neige ferme avec une pincée de sel. Incorporer ¼ des blancs à la crème en fouettant pour la détendre, puis le reste en 2 fois à la maryse — geste souple, de bas en haut.',
        'Tremper chaque boudoir dans le café froid exactement 2 secondes par face. Égoutter sur la main : il doit être imbibé mais non détrempé — il se casse si on appuie.',
        'Monter le tiramisu : couche de boudoirs + couche de crème (1,5 cm). Recommencer. Lisser le dessus à la palette.',
        'Tamiser le cacao non sucré en couche généreuse sur toute la surface. Filmer au contact et réfrigérer 2 h minimum — la nuit est idéale pour que les saveurs fusionnent.'
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
        'Préchauffer le four à 200 °C chaleur statique. Beurrer généreusement les ramequins au pinceau, puis saupoudrer de cacao tamisé — pas de farine. Retourner et tapoter pour enlever l\'excès. Réfrigérer les ramequins garnis.',
        'Fondre chocolat et beurre au bain-marie en remuant lentement jusqu\'à ganache lisse. Retirer du feu et laisser tiédir à 35 °C — c\'est la température où le chocolat s\'incorpore sans cuire les œufs.',
        'Fouetter les œufs avec le sucre de coco jusqu\'à léger blanchiment. Ajouter le fromage blanc et mélanger. Verser le chocolat tiédi en filet tout en fouettant pour tempérer progressivement.',
        'Tamiser ensemble farine d\'avoine, cacao et sel directement dans la masse. Incorporer à la maryse en 5 gestes — ne pas surmélanger, les fondants trop travaillés deviennent caoutchouteux.',
        'Remplir les ramequins froids aux ¾. Filmer et réfrigérer 30 min minimum : le contraste chaud/froid est ce qui crée le cœur coulant.',
        'Enfourner exactement 10 min (four précis à 200 °C). Les bords sont pris, le centre tremble légèrement. Laisser reposer 1 min dans le ramequin, puis retourner d\'un geste sec sur l\'assiette. Servir immédiatement.'
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
        'Torréfier les 80 g de pistaches à sec dans une poêle 2 min : la chaleur réveille les huiles et intensifie le goût. Laisser refroidir avant de mixer avec les dattes et les flocons d\'avoine par impulsions.',
        'Chemiser un moule à charnière (Ø 20 cm) d\'un disque de papier cuisson. Presser la base pistache-dattes uniformément à ~6 mm d\'épaisseur avec le dos d\'une cuillère humide. Réfrigérer 15 min.',
        'Réhydrater la gélatine 5 min dans de l\'eau froide. La dissoudre dans 3 cs d\'eau chaude (pas bouillante). Laisser tiédir à 35 °C — incorporer une gélatine trop chaude dans le fromage frais crée des fils.',
        'Fouetter le fromage frais à la spatule pour le lisser. Incorporer le skyr, le jus et zeste de citron, et le miel. Fouetter 1 min pour une crème aérée et homogène.',
        'Verser la gélatine tiédie en filet sur la crème en mélangeant sans s\'arrêter. Couler immédiatement sur le fond de tarte — la gélatine commence à figer dès 25 °C. Lisser à la palette.',
        'Réfrigérer 3 h minimum, idéalement une nuit. Pour démouler proprement : passer une lame de couteau chaude le long du bord avant d\'ouvrir la charnière. Parsemer pistaches concassées et zeste frais au dernier moment.'
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
        'Chauffer le lait avec la moitié de la vanille et la stevia à 82 °C (frémissement léger, pas de bouillons). Laisser infuser 5 min hors du feu pour que la vanille exprime tous ses arômes.',
        'Monter les blancs en neige très ferme : commencer vitesse lente 30 sec, puis vitesse maximale jusqu\'à bec d\'oiseau droit. Un blanc trop mou se disloque au pochage.',
        'Former les îles à la cuillère à soupe : deux cuillères face à face pour façonner une quenelle régulière. Les pocher 2 min de chaque côté dans le lait frémissant (jamais bouillant). Égoutter sur un linge propre, pas du papier absorbant qui colle.',
        'Crème anglaise : fouetter les jaunes avec la stevia jusqu\'à ruban. Verser le lait vanillé chaud en trois fois sur les jaunes en remuant — jamais l\'inverse. Reverser dans la casserole.',
        'Cuire à 82 °C sans cesser de remuer à la spatule en faisant des 8. Stopper à la nappe : la crème trace une ligne nette sur le dos de la spatule. Filtrer au chinois, couvrir au contact, refroidir.',
        'Caramel au miel : chauffer miel et beurre à feu moyen 2 min jusqu\'à légère coloration ambrée. Décuire avec 2 cs de lait chaud, ajouter la cannelle. Dresser la crème anglaise froide, poser les îles, napper de caramel au moment de servir.'
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
        'Rincer le riz à l\'eau froide jusqu\'à ce que l\'eau soit claire — cela retire l\'amidon de surface et évite que le riz ne colle en masse. Égoutter.',
        'Verser le riz dans le lait entier froid (départ à froid : le riz s\'ouvre progressivement et libère son amidon interne, ce qui crée la texture crémeuse). Porter à feu moyen en remuant dès les premiers frémissements.',
        'Cuire 20–25 min à feu doux en remuant toutes les 2 min avec une cuillère en bois. La texture est prête quand le riz est très tendre et que la masse se détache légèrement des parois — ni liquide, ni compact.',
        'Hors du feu, incorporer le miel et la cannelle. Attendre que la température descende à 50 °C avant d\'ajouter l\'eau de rose : au-delà, les composés aromatiques s\'évaporent et le parfum disparaît.',
        'Laisser tiédir 5 min à 45 °C, puis incorporer le skyr à la spatule en deux fois — le skyr ne doit jamais bouillir, il granulerait. La masse doit rester onctueuse.',
        'Dresser dans 4 coupes. Saupoudrer de pistaches concassées et d\'une pincée de cannelle. Servir tiède ou réfrigérer 1 h et servir frais — les deux versions sont excellentes.'
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
        'Sortir les filets de bar du réfrigérateur 10 min avant cuisson. Préchauffer le four à 220 °C chaleur tournante avec la plaque à l\'intérieur.',
        'Hacher finement ail, persil, romarin et thym. Incorporer le zeste râpé du citron et l\'huile d\'olive ; saler, poivrer. On obtient une gremolata liquide.',
        'Inciser la peau des filets en deux traits en biais au couteau d\'office — cela empêche la rétraction et permet à la marinade de pénétrer.',
        'Poser les filets peau vers le bas sur la plaque chaude huilée. Napper généreusement de gremolata liquide.',
        'Enfourner 12-14 min : la chair doit s\'opacifier jusqu\'au centre et se détacher à la pression du doigt — ne pas attendre qu\'elle se fissure.',
        'Arroser d\'un filet de jus de citron frais à la sortie du four et servir dans la minute pour préserver les arômes volatils des herbes.'
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
        'Faire tomber les épinards à feu vif avec l\'ail haché, 2 min sans matière grasse. Étaler sur un torchon propre, rouler serré et tordre les extrémités pour extraire toute l\'eau — une farce humide ferait éclater les rouleaux.',
        'Mélanger les épinards bien secs avec la ricotta, le parmesan et la muscade. Goûter et assaisonner : la farce doit être légèrement trop salée car la dinde est fade.',
        'Placer chaque escalope entre deux feuilles de film alimentaire, aplatir au rouleau jusqu\'à 5 mm. Étaler la farce en laissant 1 cm de bord, rouler fermement, piquer avec deux cure-dents en X.',
        'Préchauffer le four à 190 °C. Saisir les involtini dans l\'huile chaude 2 min sur toutes leurs faces pour sceller les sucs.',
        'Transférer dans un plat, enfourner 15 min. Vérifier à cœur : 74 °C à la sonde ou jus clair à la pique.',
        'Retirer les cure-dents, laisser reposer 3 min avant de trancher en biseau pour révéler la spirale verte.'
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
        'Placer les escalopes entre deux films, aplatir au rouleau à 4 mm d\'épaisseur uniforme — l\'uniformité garantit une cuisson homogène à la seconde près.',
        'Saupoudrer de farine de riz des deux côtés, secouer vigoureusement : une couche translucide, pas un enrobage blanc, est ce qu\'on cherche.',
        'Chauffer l\'huile à feu maximal jusqu\'à légère fumée. Cuire les escalopes 1 min 30 s par face ; elles doivent être dorées, pas grises. Sortir et maintenir au chaud sur une assiette couverte.',
        'Baisser à feu moyen. Déglacer la poêle avec le jus de citron en grattant les sucs caramélisés. Verser le bouillon, ajouter les câpres et réduire 2 min jusqu\'à consistance sirupeuse.',
        'Remettre les escalopes 30 s dans la sauce pour les lustrer. Parsemer de persil ciselé à la dernière seconde.',
        'Servir immédiatement : les scaloppine attendent personne — la farine de riz ramollit en moins de 3 min.'
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
        'Préparer la salsa : couper les tomates cerises en deux, écraser légèrement à la fourchette pour libérer leur jus. Mélanger avec les olives, les câpres rincées, l\'origan, le zeste de citron et la moitié de l\'huile. Laisser macérer 10 min.',
        'Sécher soigneusement les pavés avec du papier absorbant — toute humidité provoque une adhérence au grill. Badigeonner du reste d\'huile côté peau uniquement.',
        'Chauffer la poêle grill en fonte à feu maximal 3 min : elle doit fumer légèrement. Poser les pavés peau vers le bas sans les toucher.',
        'Cuire 3-4 min côté peau jusqu\'à ce que la cuisson remonte aux trois quarts de la chair (on voit la couleur changer sur le côté). Retourner une seule fois, 1 min 30 s côté chair.',
        'Laisser reposer 1 min hors feu : le centre finit de cuire à la chaleur résiduelle et reste nacré.',
        'Dresser la salsa sur le pavé — jamais en dessous, pour ne pas ramollir la peau croustillante.'
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
        'Mélanger la dinde hachée, l\'œuf, le parmesan, l\'ail et le persil hachés, sel et poivre. Travailler le mélange à la main 30 s seulement : trop pétrir rend les boulettes dures.',
        'Former des boulettes de 3 cm (environ 25 g) en les roulant dans les paumes mouillées — les mains humides évitent que la viande colle et donnent une surface lisse.',
        'Chauffer l\'huile à feu vif. Dorer les boulettes en les faisant rouler dans la poêle par rotation du poignet (ne pas piquer avec une fourchette) — 3-4 min pour une croûte uniforme.',
        'Baisser à feu doux. Verser les tomates concassées, écraser légèrement avec la cuillère pour libérer leur jus. Couvrir et mijoter 15 min.',
        'Découvrir les 3 dernières minutes pour concentrer la sauce. Elle doit napper les boulettes sans être liquide.',
        'Parsemer de basilic déchiré à la main (jamais ciselé au couteau — le métal oxyde le basilic en secondes) et servir.'
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
        'Sortir le thon du froid 10 min avant cuisson. Sécher les pavés avec du papier absorbant — l\'humidité est l\'ennemie de la croûte de sésame.',
        'Verser les graines de sésame dans une assiette creuse. Rouler chaque pavé en pressant fermement sur chaque face — tapoter doucement pour faire adhérer sans excès.',
        'Chauffer une poêle en inox ou en fonte à feu maximal, à sec, 2 min. La poêle est prête quand une goutte d\'eau s\'évapore instantanément.',
        'Saisir 45 s par face grande, puis 15 s sur chaque tranche fine. Le sésame doit être doré noisette — jamais brun foncé. L\'intérieur reste cru et translucide.',
        'Pendant la cuisson, assaisonner la roquette avec l\'huile d\'olive, le jus et le zeste de citron, la sauce soja : mélanger délicatement à la main.',
        'Trancher le thon en médaillons de 1 cm au couteau bien aiguisé d\'un seul mouvement — scier abîme la chair. Dresser sur la roquette et servir dans la seconde.'
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
        'Couper les blancs de poulet en escalopes de 8 mm dans l\'épaisseur (technique du papillon ou tranches bias). Poser à plat, couvrir de film et aplatir légèrement au rouleau.',
        'Assaisonner généreusement des deux côtés. Chauffer l\'huile à feu vif jusqu\'à léger tremblement. Saisir les tranches 2 min 30 s par face sans les bouger — une belle coloration dorée avant de retourner.',
        'Retirer le poulet, baisser à feu moyen. Jeter l\'excès de gras si nécessaire. Faire blondir l\'ail haché 20 s en remuant.',
        'Déglacer avec le jus des deux citrons en grattant les sucs. Verser le bouillon, ajouter les câpres et le zeste. Réduire 3 min à feu vif jusqu\'à consistance légèrement sirupeuse.',
        'Remettre le poulet, ajouter les brins de thym et chauffer 1 min en nappant de sauce à la cuillère — c\'est le geste du beurrage, ici sans beurre.',
        'Dresser et napper de sauce généreusement. Servir avec un légume vert vapeur pour ne pas noyer les saveurs.'
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
        'Sécher les crevettes sur plusieurs épaisseurs de papier absorbant, retirer le boyau dorsal d\'un coup de couteau superficiel. Humidité et boyau = amertume garantie.',
        'Hacher l\'ail en brunoise très fine (pas pressé — la presse libère un jus acre). Émincer finement le piment, retirer les graines pour doser la chaleur. Ciseler le persil au dernier moment.',
        'Chauffer l\'huile à feu vif jusqu\'à frémissement. Ajouter l\'ail et le piment, mélanger vivement 20 s — ail blond, jamais brun.',
        'Ajouter les crevettes en une couche unique, bien espacées. Saisir 1 min 30 s sans toucher, retourner d\'un geste, 1 min 30 s de l\'autre côté. Elles sont cuites quand elles forment un C — un O signifie surcuisson.',
        'Hors du feu immédiatement, presser le jus de citron et ajouter le persil. La chaleur résiduelle finit le travail sans durcir la chair.',
        'Servir sans attendre avec des quartiers de citron : les crevettes continuent de cuire dans l\'assiette chaude.'
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
        'Préparer la gremolata 30 min à l\'avance : hacher persil, ail et romarin le plus finement possible, zester le citron par-dessus, mélanger avec 5 ml d\'huile. Le repos libère les huiles essentielles.',
        'Sortir la viande 20 min avant cuisson. Badigeonner d\'huile des deux côtés, saler au sel de mer en pressant les cristaux dans la chair — ne jamais saler à l\'avance, le sel fait exsuder le jus.',
        'Chauffer la grille en fonte à feu maximal 4-5 min : elle doit être quasi incandescente — tester avec une goutte d\'eau qui doit s\'évaporer instantanément.',
        'Poser le steak perpendiculairement aux nervures de la grille. Saisir 3 min sans toucher. Tourner à 90° (pas retourner) pour marquer le quadrillage. Retourner, 3 min de l\'autre côté.',
        'Transférer sur une grille (jamais une assiette plate — la vapeur ramollit la croûte). Couvrir lâchement de papier aluminium, reposer 4 min. Le cœur monte de 3-4 °C pendant le repos.',
        'Trancher en biseau contre le fil de la viande. Déposer la gremolata sur les tranches chaudes — la chaleur diffuse les arômes dans toute la pièce.'
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

  // ─── PETITS-DÉJEUNERS VEGAN L051-L058 ──────────────────────────────────────
  {
    id: 'L051',
    name: 'Porridge Avoine Lait Amande Banane',
    emoji: '🌱',
    origin: '🌍',
    mealTypes: ['breakfast'],
    tags: ['breakfast', 'vegan', 'avoine', 'banane', 'chia', 'healthy'],
    difficulty: 1,
    prepTime: 5,
    cookTime: 7,
    servings: 1,
    baseNutrition: { calories: 378, proteinGrams: 14, carbsGrams: 64, fatGrams: 10 },
    ingredients: [
      { name: 'Flocons d\'avoine', qty: 90, unit: 'g' },
      { name: 'Lait d\'amande', qty: 250, unit: 'ml' },
      { name: 'Banane', qty: 120, unit: 'g' },
      { name: 'Graines de chia', qty: 15, unit: 'g' },
      { name: 'Cannelle', qty: 2, unit: 'g' },
      { name: 'Sirop d\'érable', qty: 10, unit: 'ml' }
    ],
    steps: [
      'Porter le lait d\'amande à ébullition, ajouter les flocons d\'avoine.',
      'Cuire 5 min à feu doux en remuant.',
      'Servir garni de banane tranchée, graines de chia et sirop d\'érable.'
    ]
  },
  {
    id: 'L052',
    name: 'Smoothie Bowl Mangue Coco Protéiné',
    emoji: '🌱',
    origin: '🌍',
    mealTypes: ['breakfast'],
    tags: ['breakfast', 'vegan', 'mangue', 'lait de coco', 'banane', 'granola', 'chia'],
    difficulty: 1,
    prepTime: 8,
    cookTime: 0,
    servings: 1,
    baseNutrition: { calories: 392, proteinGrams: 18, carbsGrams: 58, fatGrams: 12 },
    ingredients: [
      { name: 'Mangue', qty: 150, unit: 'g' },
      { name: 'Lait de coco', qty: 100, unit: 'ml' },
      { name: 'Banane', qty: 80, unit: 'g' },
      { name: 'Graines de chanvre', qty: 30, unit: 'g' },
      { name: 'Granola', qty: 50, unit: 'g' },
      { name: 'Kiwi', qty: 60, unit: 'g' },
      { name: 'Graines de chia', qty: 10, unit: 'g' }
    ],
    steps: [
      'Mixer la mangue, la banane et le lait de coco.',
      'Verser dans un bol.',
      'Garnir de granola, kiwi tranché, graines de chanvre et chia.'
    ]
  },
  {
    id: 'L053',
    name: 'Toast Avocat Tomate Graines de Chanvre',
    emoji: '🌱',
    origin: '🌍',
    mealTypes: ['breakfast'],
    tags: ['breakfast', 'vegan', 'pain', 'avocat', 'tomate', 'chanvre', 'citron'],
    difficulty: 1,
    prepTime: 5,
    cookTime: 2,
    servings: 1,
    baseNutrition: { calories: 396, proteinGrams: 20, carbsGrams: 40, fatGrams: 18 },
    ingredients: [
      { name: 'Pain complet', qty: 80, unit: 'g' },
      { name: 'Avocat', qty: 140, unit: 'g' },
      { name: 'Tomate', qty: 100, unit: 'g' },
      { name: 'Graines de chanvre', qty: 30, unit: 'g' },
      { name: 'Citron', qty: 15, unit: 'ml' },
      { name: 'Piment rouge', qty: 2, unit: 'g' }
    ],
    steps: [
      'Griller le pain complet.',
      'Écraser l\'avocat avec citron, sel et piment.',
      'Tartiner d\'avocat, couvrir de tomate tranchée et saupoudrer de graines de chanvre.'
    ]
  },
  {
    id: 'L054',
    name: 'Bol Quinoa Fruits Rouges Amandes',
    emoji: '🌱',
    origin: '🌍',
    mealTypes: ['breakfast'],
    tags: ['breakfast', 'vegan', 'quinoa', 'lait d\'amande', 'framboises', 'myrtilles', 'amandes', 'lin'],
    difficulty: 1,
    prepTime: 5,
    cookTime: 12,
    servings: 1,
    baseNutrition: { calories: 404, proteinGrams: 22, carbsGrams: 54, fatGrams: 12 },
    ingredients: [
      { name: 'Quinoa', qty: 90, unit: 'g' },
      { name: 'Lait d\'amande', qty: 200, unit: 'ml' },
      { name: 'Framboises', qty: 80, unit: 'g' },
      { name: 'Myrtilles', qty: 60, unit: 'g' },
      { name: 'Amandes', qty: 25, unit: 'g' },
      { name: 'Graines de lin', qty: 15, unit: 'g' },
      { name: 'Sirop d\'érable', qty: 10, unit: 'ml' }
    ],
    steps: [
      'Cuire le quinoa dans le lait d\'amande (10-12 min).',
      'Laisser tiédir.',
      'Garnir de fruits rouges, amandes et graines de lin. Arroser de sirop d\'érable.'
    ]
  },
  {
    id: 'L055',
    name: 'Chia Pudding Cacao Beurre de Cacahuète',
    emoji: '🌱',
    origin: '🌍',
    mealTypes: ['breakfast'],
    tags: ['breakfast', 'vegan', 'chia', 'lait d\'avoine', 'cacao', 'cacahuète', 'banane'],
    difficulty: 1,
    prepTime: 5,
    cookTime: 0,
    servings: 1,
    baseNutrition: { calories: 418, proteinGrams: 24, carbsGrams: 38, fatGrams: 18 },
    ingredients: [
      { name: 'Graines de chia', qty: 50, unit: 'g' },
      { name: 'Lait d\'avoine', qty: 300, unit: 'ml' },
      { name: 'Cacao en poudre', qty: 15, unit: 'g' },
      { name: 'Beurre de cacahuète', qty: 30, unit: 'g' },
      { name: 'Banane', qty: 80, unit: 'g' },
      { name: 'Sirop d\'érable', qty: 10, unit: 'ml' }
    ],
    steps: [
      'Mélanger graines de chia, lait d\'avoine, cacao et sirop d\'érable.',
      'Réfrigérer au moins 4h ou une nuit.',
      'Servir avec beurre de cacahuète et banane tranchée.'
    ]
  },
  {
    id: 'L056',
    name: 'Pancakes Flocons Avoine Banane Vegan',
    emoji: '🌱',
    origin: '🌍',
    mealTypes: ['breakfast'],
    tags: ['breakfast', 'vegan', 'avoine', 'banane', 'lait d\'amande', 'farine', 'fruits rouges'],
    difficulty: 2,
    prepTime: 10,
    cookTime: 12,
    servings: 1,
    baseNutrition: { calories: 386, proteinGrams: 16, carbsGrams: 62, fatGrams: 10 },
    ingredients: [
      { name: 'Flocons d\'avoine', qty: 100, unit: 'g' },
      { name: 'Banane', qty: 120, unit: 'g' },
      { name: 'Lait d\'amande', qty: 150, unit: 'ml' },
      { name: 'Farine complète', qty: 30, unit: 'g' },
      { name: 'Levure chimique', qty: 5, unit: 'g' },
      { name: 'Huile de coco', qty: 10, unit: 'g' },
      { name: 'Fruits rouges', qty: 80, unit: 'g' }
    ],
    steps: [
      'Mixer les flocons d\'avoine en farine grossière.',
      'Écraser la banane, mélanger avec lait d\'amande, farine et levure.',
      'Cuire les pancakes dans l\'huile de coco. Servir avec fruits rouges.'
    ]
  },
  {
    id: 'L057',
    name: 'Tartine Pain Complet Beurre Amande Fruits',
    emoji: '🌱',
    origin: '🌍',
    mealTypes: ['breakfast'],
    tags: ['breakfast', 'vegan', 'pain', 'amande', 'banane', 'fraises', 'chia'],
    difficulty: 1,
    prepTime: 5,
    cookTime: 2,
    servings: 1,
    baseNutrition: { calories: 374, proteinGrams: 18, carbsGrams: 44, fatGrams: 16 },
    ingredients: [
      { name: 'Pain complet', qty: 80, unit: 'g' },
      { name: 'Beurre d\'amande', qty: 40, unit: 'g' },
      { name: 'Banane', qty: 80, unit: 'g' },
      { name: 'Fraises', qty: 60, unit: 'g' },
      { name: 'Graines de chia', qty: 10, unit: 'g' },
      { name: 'Sirop d\'érable', qty: 8, unit: 'ml' }
    ],
    steps: [
      'Griller le pain complet.',
      'Tartiner généreusement de beurre d\'amande.',
      'Disposer banane et fraises tranchées, saupoudrer de chia et sirop d\'érable.'
    ]
  },
  {
    id: 'L058',
    name: 'Bowl Patate Douce Rôtie Beurre Noisette',
    emoji: '🌱',
    origin: '🌍',
    mealTypes: ['breakfast'],
    tags: ['breakfast', 'vegan', 'patate douce', 'noisette', 'avoine', 'courge', 'cannelle'],
    difficulty: 2,
    prepTime: 5,
    cookTime: 45,
    servings: 1,
    baseNutrition: { calories: 412, proteinGrams: 16, carbsGrams: 60, fatGrams: 14 },
    ingredients: [
      { name: 'Patate douce', qty: 250, unit: 'g' },
      { name: 'Beurre de noisette', qty: 30, unit: 'g' },
      { name: 'Flocons d\'avoine', qty: 50, unit: 'g' },
      { name: 'Graines de courge', qty: 15, unit: 'g' },
      { name: 'Cannelle', qty: 2, unit: 'g' },
      { name: 'Sirop d\'érable', qty: 10, unit: 'ml' }
    ],
    steps: [
      'Rôtir la patate douce entière 45 min à 200°C.',
      'Ouvrir en deux, écraser la chair.',
      'Garnir de beurre de noisette, flocons d\'avoine grillés, graines de courge et sirop d\'érable.'
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
      'Déchirer le pain en morceaux irréguliers de 2-3 cm (jamais couper — les surfaces déchirées absorbent mieux la vinaigrette). Toaster 6-7 min à 200 °C jusqu\'à croûte dorée sur tout le pourtour.',
      'Assaisonner les blancs de poulet. Chauffer une poêle grill à feu maximal à sec. Griller 4-5 min par face sans presser — les marques de grill signifient des sucs caramélisés. Laisser reposer 3 min avant de trancher en biseau.',
      'Couper les tomates cerises en deux, les écraser légèrement avec le pouce pour libérer leur jus — ce jus va imprégner le pain. Émincer l\'oignon rouge très fin ; le faire tremper 5 min dans de l\'eau froide pour enlever l\'âcreté.',
      'Préparer la vinaigrette : écraser l\'ail en pommade avec une pincée de sel (couteau à plat), mélanger avec le vinaigre balsamique, puis monter à l\'huile d\'olive en filet.',
      'Assembler dans l\'ordre : pain, tomates avec leur jus, concombre, oignon égoutté, vinaigrette. Mélanger et laisser reposer 5 min — le pain doit absorber les jus tout en gardant un cœur ferme.',
      'Ajouter les lanières de poulet et les feuilles de basilic entières déchirées à la main au dernier moment. Servir sans attendre — la panzanella ne supporte pas l\'attente.'
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
      'Sortir la mozzarella 15 min avant de travailler — le froid tue le goût. Trancher tomates et mozzarella à 8 mm exactement, l\'avocat en lamelles régulières.',
      'Égoutter le thon 2 min dans une passoire fine, puis l\'émietter à la fourchette en gardant des morceaux généreux — jamais une purée.',
      'Sur assiette froide, disposer en cercle en alternant : tomate, mozzarella, avocat. Recouvrir légèrement comme des tuiles.',
      'Déposer le thon au centre en dôme léger. Parsemer de basilic ciselé à la main (jamais au couteau, cela noircit).',
      'Émulsionner à la fourchette huile d\'olive et citron, assaisonner. Arroser au dernier moment, finir de fleur de sel. Servir sans attendre.'
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
      'Poser les tranches de bœuf entre deux feuilles de film alimentaire et aplatir légèrement au fond d\'une casserole — elles doivent être translucides. Sortir du frigo 5 min avant service.',
      'Préparer la vinaigrette : fouetter huile d\'olive, jus de citron, sel. L\'émulsion doit être homogène et légèrement nacrée.',
      'Disposer les tranches en rosace sur assiette froide, bord à bord sans superposer. Arroser de la moitié de la vinaigrette directement sur la viande.',
      'Déposer la roquette au centre, assaisonnée avec le reste de vinaigrette. Parsemer les câpres égouttées et essuyées.',
      'Réaliser de larges copeaux de parmesan à l\'économe. Terminer par un généreux tour de moulin à poivre. Servir immédiatement.'
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
      'Trancher la ciabatta en biseau à 1,5 cm d\'épaisseur. Griller au four à 220 °C, 4-5 min côté mie vers le haut, jusqu\'à un doré uniforme avec des bords légèrement croustillants.',
      'Dès la sortie du four, frotter vigoureusement la surface avec la gousse d\'ail coupée — la chaleur ouvre la mie et l\'ail s\'y incruste naturellement.',
      'Battre la ricotta à la fourchette avec sel fin, poivre et un filet d\'huile d\'olive pour la rendre lisse et aérée.',
      'Couper les tomates cerises en deux, les assaisonner de fleur de sel et basilic ciselé à la main. Laisser mariner 3 min — elles rendront un jus précieux.',
      'Tartiner généreusement la ricotta sur les tartines chaudes, garnir des tomates avec leur jus. Servir dans la minute.'
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
      'Cuire les pommes de terre en robe des champs dans une eau bien salée (10 g/litre) 20 min. Égoutter et peler à chaud — la chair absorbe mieux l\'assaisonnement.',
      'Couper les pommes de terre encore tièdes en morceaux irréguliers de 3 cm. Le tiède est capital : il permet à la vinaigrette de pénétrer.',
      'Couper le poulpe cuit en tronçons nets de 2 cm. Si les tentacules sont épaisses, les fendre en deux dans la longueur.',
      'Préparer la vinaigrette : écraser l\'ail en purée fine avec une pincée de sel, fouetter avec huile d\'olive et jus de citron.',
      'Mélanger délicatement poulpe, pommes de terre tièdes, céleri en fines tranches et olives. Arroser de vinaigrette, laisser reposer 5 min.',
      'Dresser dans des assiettes creuses, parsemer de persil haché grossièrement. Servir tiède — jamais glacé.'
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
      'Égoutter artichauts et poivrons sur papier absorbant — l\'excès de marinade noie le plat et détruit l\'équilibre des saveurs.',
      'Disposer la bresaola en éventail sur une moitié du bol, le prosciutto rosé plié en deux sur l\'autre moitié — jamais à plat, toujours en volume.',
      'Couper les poivrons grillés en lanières de 1 cm, répartir avec les artichauts et les olives dans les espaces libres.',
      'Placer un bouquet de roquette au centre, légèrement en hauteur pour donner du relief.',
      'Réaliser de larges copeaux de parmesan à l\'économe. Arroser d\'un filet d\'huile d\'olive en spirale. Poivrer, servir immédiatement.'
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
      'Cuire le farro dans une eau bien salée portée à ébullition. Réduire à feu moyen, cuire 25 min jusqu\'à ce que les grains soient tendres mais gardent du mordant. Égoutter et étaler sur plaque pour refroidir rapidement.',
      'Couper la courgette en dés de 1 cm réguliers. Saisir à la poêle très chaude avec un filet d\'huile, 3 min sans remuer — coloration = saveur.',
      'Torréfier les pignons à sec dans une poêle froide montée en chaleur progressive, 2 min en remuant. Retirer dès qu\'ils sont dorés : ils cuisent hors du feu.',
      'Préparer la vinaigrette citron-herbes : huile d\'olive, citron, herbes de Provence, sel, poivre. Goûter et ajuster l\'acidité.',
      'Mélanger le farro tiède avec courgette, tomates séchées émincées et épinards. Arroser de vinaigrette, mélanger délicatement.',
      'Dresser dans les bols, émietter la feta à la main en morceaux généreux, parsemer des pignons. Servir tiède ou à température ambiante.'
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
      'Couper l\'aubergine en cubes de 2 cm. Saler généreusement, mélanger et laisser dégorger 10 min dans une passoire. Éponger soigneusement avec du papier absorbant — cette étape est la différence entre crémeux et huileux.',
      'Chauffer l\'huile à feu vif dans une sauteuse large. Saisir l\'aubergine en une seule couche, sans remuer, 4 min. Retourner, cuire encore 3 min. Réserver.',
      'Dans la même sauteuse, faire revenir le céleri émincé 2 min. Ajouter les tomates cerises coupées en deux, les olives et les câpres. Cuire 3 min à feu vif.',
      'Ajouter les pois chiches et l\'aubergine réservée. Verser le vinaigre de vin rouge, réduire 1 min à feu vif pour caraméliser légèrement les sucs.',
      'Goûter et ajuster l\'équilibre aigre-doux — c\'est l\'âme sicilienne : si trop acide, une pincée de sel ; si trop plat, quelques gouttes de vinaigre.',
      'Laisser tiédir 5 min hors du feu. Dresser dans des bols, parsemer de basilic ciselé à la main. La caponata est meilleure le lendemain.'
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
      'Cuire les haricots verts dans une eau bouillante très salée (15 g/litre), 5 min chrono. Les plonger immédiatement dans un bain d\'eau glacée 2 min — ils gardent leur vert vif et leur croquant.',
      'Cuire les œufs dans l\'eau bouillante exactement 9 min. Refroidir sous eau froide, écaler délicatement. Couper en deux : le jaune doit être cuit mais encore légèrement moelleux au cœur.',
      'Préparer la vinaigrette dans un bol : huile d\'olive, vinaigre de vin, sel, poivre. Émulsionner à la fourchette jusqu\'à ce qu\'elle soit liée.',
      'Émincer les tomates en quartiers, égoutter et émietter le thon en morceaux généreux.',
      'Dresser la laitue en fond d\'assiette, disposer en compartiments distincts les haricots, tomates, thon, olives et œufs. Ne pas mélanger — la beauté de la niçoise est dans ses couleurs séparées.',
      'Déposer les anchois en croix sur le dessus. Arroser de vinaigrette au dernier moment. Servir sans attendre.'
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
      'Placer les tranches de saumon 15 min au congélateur avant de les dresser — le froid ferme légèrement la chair et permet un tranchage net si non pré-tranché.',
      'Disposer les tranches en une seule couche sur assiette froide, en les faisant se chevaucher légèrement comme des pétales. Couvrir et réserver 2 min au frais.',
      'Émincer l\'oignon rouge en tranches papier (2 mm) à la mandoline ou au couteau très tranchant. Les rincer 30 secondes à l\'eau froide pour adoucir le piquant.',
      'Répartir oignon rouge, câpres égouttées et brins d\'aneth frais sur le saumon.',
      'Arroser d\'un filet d\'huile d\'olive puis du jus de citron fraîchement pressé. Assaisonner de fleur de sel et poivre noir. Laisser mariner exactement 2 minutes.',
      'Servir immédiatement : au-delà de 3 min, le citron cuit le saumon et change sa texture. C\'est un carpaccio, pas un ceviche.'
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
      'Sortir la ricotta du réfrigérateur 10 minutes avant : à température ambiante, elle s\'incorpore plus facilement et la texture finale est bien plus soyeuse.',
      'Zester le citron directement au-dessus du bol de ricotta — les huiles essentielles du zeste tombent ainsi dans le fromage sans perte d\'arôme.',
      'Fouetter vigoureusement la ricotta et le zeste 1 minute à la fourchette ou au petit fouet jusqu\'à obtenir une crème lisse et aérienne. C\'est ce travail mécanique qui fait toute la différence.',
      'Concasser grossièrement les noisettes torréfiées au couteau — des morceaux de tailles variées, pas une poudre. Le contraste de texture est essentiel.',
      'Répartir la ricotta dans deux bols. Napper de miel en spirale, parsemer les noisettes, saupoudrer la cannelle. Servir immédiatement.'
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
      'Préchauffer le four à 190 °C chaleur tournante. Sortir la pâte 5 min avant pour la détendre.',
      'Mélanger ricotta et miel à la fourchette jusqu\'à texture lisse ; réserver au frais.',
      'Détailler la pâte en 4 triangles réguliers. Tailler les figues en lamelles fines de 3 mm.',
      'Déposer une cuillère à soupe de crème ricotta à la base de chaque triangle, puis 2-3 lamelles de figue. Ne pas aller jusqu\'aux bords.',
      'Rouler chaque triangle fermement de la base vers la pointe en maintenant une légère tension ; courber en croissant. Presser la pointe contre la pâte pour sceller.',
      'Parsemer d\'amandes effilées en appuyant légèrement pour qu\'elles adhèrent. Enfourner 11-13 min jusqu\'à dorure miel. Laisser tiédir 3 min avant de servir.'
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
      'Préchauffer le four à 160 °C chaleur tournante. Tapisser une plaque de papier cuisson.',
      'Concasser grossièrement les pistaches au couteau (morceaux irréguliers, pas de poudre).',
      'Dans un saladier, mélanger flocons d\'avoine, pistaches, zeste d\'orange. Verser huile d\'olive et miel tièdes (30 secondes au micro-ondes) ; mélanger jusqu\'à enrobage homogène.',
      'Étaler en couche fine et uniforme sur la plaque. Tasser légèrement avec le dos d\'une spatule — c\'est ce tassage qui crée les clusters.',
      'Cuire 18-22 min sans toucher, jusqu\'à coloration dorée en surface. Arroser du jus d\'orange la dernière minute.',
      'Sortir et laisser refroidir entièrement sur la plaque avant de briser en morceaux. Le granola durcit en refroidissant.'
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
      'Peler l\'orange à vif au couteau (retirer peau et membrane blanche) pour éviter l\'amertume.',
      'Mixer d\'abord la banane congelée seule 20 secondes jusqu\'à consistance crémeuse, puis ajouter l\'orange, le jus de citron et le yaourt grec. Mixer par impulsions courtes pour garder la texture épaisse — ne pas surchauffer.',
      'Goûter et ajuster l\'acidité avec quelques gouttes de citron supplémentaires si nécessaire.',
      'Répartir dans deux bols froids (préalablement passés 5 min au congélateur).',
      'Déposer granola, pistaches concassées et feuilles de menthe en lignes ou en quartiers distincts pour le visuel et le contraste de textures.',
      'Servir immédiatement — le bol doit rester épais, pas bu à la paille.'
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
      'Couper la ciabatta en tranches de 1,5 cm. Passer au grill ou dans un four à 220 °C 3-4 min jusqu\'à croquant en surface, moelleux à cœur.',
      'Frotter immédiatement chaque tranche avec la face coupée d\'une gousse d\'ail — la chaleur du pain extrait les arômes. C\'est le geste fondateur du crostino.',
      'Écraser l\'avocat à la fourchette avec jus de citron et poivre noir au dernier moment pour éviter l\'oxydation. Texture grossière, pas lisse.',
      'Couper les tomates cerises en deux ; les assaisonner d\'une pincée de sel et d\'une goutte d\'huile d\'olive.',
      'Tartiner les crostini d\'avocat, déposer un filet d\'anchois plié en deux, une demi-tomate et une feuille de basilic entière.',
      'Servir dans les 3 minutes qui suivent l\'assemblage — le pain perd son croquant rapidement.'
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
      'Égoutter la ricotta 5 min dans un linge propre ou une passoire fine pour éliminer l\'excès de sérum — la tartine restera sèche et la saveur plus concentrée.',
      'Éponger les tomates séchées sur du papier absorbant pour retirer l\'huile de conservation.',
      'Toaster les tranches de pain de campagne jusqu\'à coloration uniforme. Frotter aussitôt avec la gousse d\'ail fendue en deux.',
      'Fouetter la ricotta égouttée avec l\'huile d\'olive, poivre et une pincée de sel ; la texture doit être crémeuse et se tenir.',
      'Tartiner généreusement de ricotta. Disposer les tomates séchées en éventail et les feuilles de basilic entières par-dessus.',
      'Finir d\'un filet d\'huile d\'olive en spirale. Servir sans attendre.'
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
      'Émietter les amaretti en poudre fine au pilon ou au robot — la régularité de la poudre garantit une pâte homogène.',
      'Mélanger dans un saladier : poudre d\'amaretti, cacao, protéine vanille. Incorporer le beurre d\'amande et le miel ; malaxer à la main jusqu\'à pâte compacte.',
      'Ajouter l\'extrait d\'amande. Si la pâte ne se compacte pas, ajouter 1 c. à café de lait écrémé (pas d\'eau — cela dilue les arômes).',
      'Peser la pâte totale et diviser en 8 portions égales au couteau. Rouler chaque portion entre les paumes en mouvements circulaires réguliers.',
      'Déposer sur une assiette et réfrigérer 30 min minimum — la texture se raffermit à froid.',
      'Servir directement du réfrigérateur ; les energy balls se conservent 4 jours au frais.'
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
      'Préparer le café espresso ; le laisser refroidir complètement — un café chaud réchauffe la crème et dissout la texture.',
      'Fouetter ricotta et mascarpone ensemble au fouet électrique 1 minute pour incorporer de l\'air. Ajouter la protéine vanille en poudre et fouetter encore 30 secondes. La crème doit être légère, pas compacte.',
      'Verser le café froid dans une assiette creuse. Tremper chaque biscuit 1 seconde de chaque côté — pas plus. Un biscuit trop imbibé s\'effondre et noie la couche de crème.',
      'Disposer une couche de biscuits dans le fond de deux verres. Verser la crème en couche régulière à l\'aide d\'une poche à douille ou d\'une cuillère à soupe.',
      'Répéter : biscuits, puis crème. Terminer par la crème.',
      'Tamiser le cacao sur le dessus depuis 20 cm de hauteur pour une couverture uniforme et sans grumeaux. Réfrigérer 10 min minimum avant de servir.'
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
      'Mixer les flocons d\'avoine en farine fine pendant 45 secondes à vitesse maximale — aucun flocon entier ne doit subsister.',
      'Dans un saladier, fouetter œufs, ricotta, lait et miel jusqu\'à mélange lisse. Tamiser la farine d\'avoine et la levure chimique par-dessus ; incorporer en soulevant la masse sans trop travailler — quelques traces de farine acceptables.',
      'Laisser reposer la pâte 3 min : la levure commence à agir, les pancakes seront plus aérés.',
      'Chauffer une poêle antiadhésive à feu moyen-vif. Frotter avec un papier absorbant légèrement huilé. La poêle est prête quand une goutte d\'eau dansote en perles.',
      'Verser des louches de 60 ml. Cuire jusqu\'à l\'apparition de bulles en surface et de bords secs (environ 2 min). Retourner une seule fois ; cuire 1 min 30 de l\'autre côté.',
      'Garder au chaud dans un four à 70 °C. Servir empilés avec un filet de miel et des fruits frais de saison.'
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
      'Faire ramollir la gélatine dans un grand volume d\'eau froide pendant exactement 5 min — pas moins, elle ne serait pas hydratée ; pas plus, elle se dissoudrait.',
      'Chauffer le lait de coco avec le miel à feu doux jusqu\'à frémissement (80 °C) sans ébullition — l\'ébullition détruit les propriétés gélifiantes.',
      'Hors du feu, essorez la gélatine entre vos mains et l\'incorporer en fouettant vigoureusement. Attendre que le mélange tiédisse à 50 °C avant d\'ajouter la protéine en poudre en pluie fine tout en fouettant pour éviter les grumeaux.',
      'Incorporer le yaourt grec à la spatule en mouvements enveloppants pour préserver la légèreté.',
      'Verser dans des verrines humidifiées (le démoulage est plus aisé). Réfrigérer au minimum 2 h, idéalement une nuit.',
      'Au service, écraser légèrement 30 g de fruits rouges avec une fourchette pour former une sauce naturelle ; verser sur la panna cotta et décorer avec les fruits entiers restants et quelques feuilles de menthe.'
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
        'Tailler tous les légumes en dés réguliers de 1 cm — carotte, céleri, courgette. L\'uniformité n\'est pas une coquetterie : c\'est la garantie d\'une cuisson homogène.',
        'Chauffer l\'huile d\'olive à feu moyen dans une cocotte. Faire suer l\'ail écrasé, carotte et céleri 4 min sans coloration — le soffritto doit devenir translucide et parfumé.',
        'Ajouter les tomates pelées écrasées à la main et le bouillon chaud. Porter à frémissement, jamais à gros bouillon — le minestrone se construit lentement.',
        'Incorporer la courgette. Mijoter à feu doux 15 min à couvert. Goûter le bouillon et ajuster le sel : c\'est maintenant, pas à la fin.',
        'Hors du feu, ajouter haricots blancs et épinards frais. Couvrir 3 min : la chaleur résiduelle cuit les épinards doucement, sans les réduire en bouillie.',
        'Dresser dans des bols profonds, effeuiller le basilic à la main sur le dessus. Déposer le parmesan râpé au centre et un filet d\'huile d\'olive extra-vierge en finition.'
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
        'Tailler l\'oignon, la carotte et l\'ail en brunoise fine (5 mm). Les faire suer à feu doux dans l\'huile d\'olive 5 minutes sans coloration — le fond doit rester blond.',
        'Ajouter le chou noir en chiffonnade, monter à feu moyen et laisser tomber 3 minutes en remuant : il doit réduire de moitié et s\'attendrir.',
        'Incorporer les tomates concassées à la main, le bouillon chaud et le romarin entier. Porter à frémissement (jamais à gros bouillon) et mijoter 15 minutes à couvert.',
        'Écraser grossièrement 1/3 des haricots cannellini à la fourchette avant de les ajouter avec le reste : ce geste lie la soupe naturellement sans farine.',
        'Émietter le pain rassis en morceaux irréguliers sur le dessus, couvrir 3 minutes hors du feu — le pain gonfle et épaissit sans se désagréger.',
        'Retirer le romarin, poivrer au moulin. Servir avec un filet d\'huile d\'olive versé en spirale au dernier moment.'
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
        'Faire chauffer l\'huile à feu moyen. Y faire revenir l\'oignon émincé 4 minutes jusqu\'à translucidité. Ajouter l\'ail haché et le cumin : torréfier 1 minute en remuant pour libérer les arômes.',
        'Glisser une branche de romarin entière dans la casserole. Verser les lentilles rincées (jamais salées à ce stade — le sel durcit la peau). Ajouter les tomates écrasées à la main.',
        'Couvrir avec le bouillon chaud. Porter à ébullition, écumer si nécessaire, puis réduire à feu doux. Mijoter 25 minutes à couvert sans remuer inutilement.',
        'Retirer le romarin. Prélever 2 louches de lentilles et les mixer séparément jusqu\'à crème lisse, puis les réincorporer : texture veloutée sans perdre le caractère rustique.',
        'Saler en fin de cuisson, presser le citron. Ciseler les aiguilles de romarin frais (2 g) et les parsemer sur le dessus avec un filet d\'huile d\'olive à cru.'
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
        'Tailler oignon, céleri et poivron en dés réguliers de 1 cm. Les faire suer dans l\'huile d\'olive à feu doux 6 minutes jusqu\'à légère compotion — pas de coloration.',
        'Ajouter les tomates grossièrement concassées et les feuilles de sauge entières. Monter à feu moyen et cuire 5 minutes pour concentrer. Verser le bouillon chaud, mijoter 8 minutes. Saler, poivrer.',
        'Pour le pochage : abaisser le feu au strict frémissement (quelques bulles en surface). Casser chaque œuf dans une tasse, créer un léger tourbillon dans la soupe, y glisser l\'œuf délicatement. Pocher 3 minutes pour un jaune coulant.',
        'Frotter le pain grillé avec une gousse d\'ail crue : ce geste simple apporte une profondeur aromatique remarquable. Déposer une tranche au fond de chaque bol.',
        'Verser la soupe et l\'œuf par-dessus avec une grande cuillère. Finir avec le pecorino râpé et un filet d\'huile d\'olive extra-vierge.'
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
        'Faire suer l\'oignon et l\'ail en brunoise dans l\'huile d\'olive à feu doux 4 minutes. Ajouter les tomates écrasées à la main et les feuilles de laurier. Cuire 3 minutes pour concentrer.',
        'Rincer le farro perlé à l\'eau froide. L\'incorporer et le nacrer 1 minute dans le soffritto — comme pour un risotto, ce geste crée une couche protectrice qui lui garde de la tenue.',
        'Verser le bouillon chaud en une seule fois. Porter à ébullition, réduire, couvrir et mijoter 20 minutes à feu doux.',
        'Écraser 1/4 des borlotti à la fourchette, puis ajouter tous les haricots et le thym frais effeuillé. Cuire encore 5 minutes : la soupe doit être épaisse, presque comme une crème.',
        'Retirer le laurier, rectifier le sel. Laisser reposer 2 minutes hors du feu avant de servir avec un trait d\'huile d\'olive et du poivre concassé au moulin.'
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
        'Préchauffer le four à 180°C. Tailler courgette, poivron et oignon rouge en dés de 1 cm. Les faire sauter à feu vif dans la poêle huilée 5 minutes — les légumes doivent colorer légèrement, pas compoter.',
        'Ajouter les épinards et mélanger 1 minute hors du feu jusqu\'à flétrissement. Laisser tiédir 2 minutes : verser des légumes brûlants sur les œufs les cuit partiellement avant la cuisson.',
        'Battre les œufs fermement (pas en neige) avec l\'origan, sel et poivre. Le mélange doit être homogène et légèrement mousseux. Verser sur les légumes tièdes en poêle.',
        'Parsemer la feta émiettée uniformément. Enfourner 12-14 minutes — la frittata est prête quand le centre ne tremble plus et que les bords se décollent légèrement.',
        'Laisser reposer 3 minutes dans la poêle : la frittata se stabilise et se démoule proprement. Garnir de basilic frais déchiré à la main, jamais au couteau.'
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
        'Écraser les gousses d\'ail avec le plat du couteau — ne pas les hacher. Les faire confire avec le piment émietté dans l\'huile d\'olive à feu très doux 3 minutes : l\'ail doit blondir sans brunir.',
        'Ajouter les tomates pelées écrasées à la main (jamais au mixeur, la texture doit rester grossière). Assaisonner et cuire à feu moyen-vif 8 minutes en remuant : la sauce doit réduire et se concentrer.',
        'Réduire à feu doux. Créer 4 creux à la cuillère, casser chaque œuf dans une tasse puis le glisser délicatement dans son creux — jamais directement de la coquille.',
        'Couvrir et cuire 5-6 minutes pour un jaune coulant, 8 minutes pour un jaune ferme. Ne pas remuer : les œufs cuisent à la vapeur de la sauce.',
        'Parsemer le pecorino et le basilic déchiré. Servir directement dans la poêle sur la table — c\'est un plat de convivialité.'
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
        'Porter le bouillon et le lait à ébullition dans une casserole à fond épais. Verser la polenta en pluie fine avec une main, fouetter de l\'autre en continu — ce geste évite tous les grumeaux.',
        'Réduire le feu au minimum. Cuire 5-7 minutes en remuant avec une cuillère en bois à intervalles réguliers. La polenta est prête quand elle se décolle des parois.',
        'Incorporer hors du feu la moitié du parmesan en fouettant vigoureusement pour créer une émulsion crémeuse. Couvrir et réserver.',
        'Essuyer les champignons avec un linge humide — jamais les laver à l\'eau, ils s\'imbiberaient. Faire chauffer la poêle à feu très vif jusqu\'à légère fumée. Saisir les champignons tranchés sans les remuer pendant 2 minutes pour obtenir une belle coloration.',
        'Ajouter l\'ail haché et le thym, mélanger et cuire encore 2 minutes. Saler en fin de cuisson seulement — le sel libère l\'eau des champignons et empêche la coloration.',
        'Dresser la polenta, garnir des champignons, finir avec le reste du parmesan, le persil ciselé et un filet d\'huile d\'olive à cru.'
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
        'Mélanger la farine de pois chiches, l\'eau froide et une pincée de sel dans un bol. Fouetter jusqu\'à pâte parfaitement lisse. Laisser reposer au minimum 30 minutes à température ambiante — ce repos hydrate la farine et donne une texture souple.',
        'Préchauffer le four à 230°C en chaleur tournante avec la plaque (ou poêle en fonte) à l\'intérieur. La plaque très chaude est la clé de la croûte croustillante.',
        'Incorporer la moitié de l\'huile d\'olive à la pâte reposée, l\'oignon rouge en fines rondelles et les aiguilles de romarin. Écumer la mousse en surface si présente.',
        'Sortir la plaque brûlante, la huiler avec les 10 ml restants. Verser la pâte rapidement en couche de 3-4 mm maximum — trop épaisse et elle reste molle.',
        'Enfourner immédiatement 15-18 minutes sans ouvrir le four. La farinata est prête quand les bords sont dorés et que la surface présente de légères craquelures dorées.',
        'Assaisonner généreusement de sel de mer et poivre noir fraîchement moulu dès la sortie du four. Servir en parts directement sur la plaque, sans attendre.'
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
        'Écraser l\'ail avec le plat de la lame et le faire confire à feu très doux dans l\'huile d\'olive avec le piment 3 minutes. L\'huile doit frémir doucement, jamais grésiller fort.',
        'Ajouter les tomates pelées et les écraser grossièrement à la main directement dans la casserole — les morceaux irréguliers créent la texture rustique caractéristique. Cuire 5 minutes à feu vif en remuant.',
        'Verser le bouillon chaud (jamais froid — cela rompt la cuisson). Réduire à feu moyen et porter à frémissement.',
        'Déchirer le pain rassis à la main en morceaux de 3-4 cm et l\'ajouter dans la soupe. Cuire 10 minutes en remuant régulièrement avec une cuillère en bois — le pain doit fondre dans la soupe pour une consistance épaisse et veloutée.',
        'Retirer du feu. Déchirer abondamment le basilic frais à la main et l\'incorporer. Couvrir 2 minutes : la chaleur résiduelle libère les huiles essentielles du basilic sans les détruire.',
        'Servir tiède — jamais bouillant, jamais froid. Un filet généreux d\'huile d\'olive extra-vierge versé en dernière seconde dans chaque bol.'
      ]
    }

  // ═══════════════════════════════════════════════════
  //  CUISINE ITALIENNE — R490-R499
  // ═══════════════════════════════════════════════════

// === R490 — Bowl Quinoa Risotto Parmesan Champignons ===
  {
    id: 'R490',
    name: 'Bowl Quinoa Risotto Parmesan & Champignons',
    category: 'italian',
    mealTypes: ['lunch', 'dinner'],
    emoji: '🍚',
    origin: '🇮🇹',
    tags: ['high-protein', 'vegetarian', 'meal-prep', 'balanced', 'anti-inflammatory'],
    servings: 2,
    prepTime: 10,
    cookTime: 25,
    difficulty: 2,
    // Vérif : 52×4 + 58×4 + 18×9 = 208 + 232 + 162 = 602 kcal ✓
    baseNutrition: { calories: 602, proteinGrams: 52, carbsGrams: 58, fatGrams: 18 },
    ingredients: [
      { name: 'Quinoa (sec)', qty: 180, unit: 'g' },
      { name: 'Champignons de Paris', qty: 300, unit: 'g' },
      { name: 'Parmesan râpé', qty: 60, unit: 'g' },
      { name: 'Bouillon de légumes (cube)', qty: 500, unit: 'ml' },
      { name: 'Oignon jaune', qty: 80, unit: 'g' },
      { name: 'Ail', qty: 10, unit: 'g' },
      { name: 'Huile d\'olive', qty: 15, unit: 'ml' },
      { name: 'Persil frais', qty: 15, unit: 'g' },
      { name: 'Citron (jus)', qty: 20, unit: 'ml' },
      { name: 'Sel, poivre noir, noix de muscade', qty: 1, unit: 'pincée' }
    ],
    steps: [
      'Rincer le quinoa. Porter le bouillon à frémissement dans une casserole.',
      'Dans une grande poêle, faire revenir l\'oignon émincé et l\'ail dans l\'huile d\'olive 3 min à feu moyen.',
      'Ajouter les champignons tranchés, une pincée de sel et de poivre noir, cuire 5 min jusqu\'à évaporation de l\'eau.',
      'Verser le quinoa dans la poêle avec les champignons, puis ajouter le bouillon chaud louche par louche (comme un risotto), en remuant, sur 15-18 min.',
      'Hors du feu, incorporer le parmesan râpé, une râpée de noix de muscade et le jus de citron ; mélanger vivement pour créer un liant crémeux.',
      'Répartir dans deux bols, parsemer de persil haché et d\'un tour de poivre noir avant de servir.'
    ]
  },

  // === R491 — Poulet Cacciatore Léger ===
  {
    id: 'R491',
    name: 'Poulet Cacciatore Léger Tomates & Olives',
    category: 'italian',
    mealTypes: ['lunch', 'dinner'],
    emoji: '🍗',
    origin: '🇮🇹',
    tags: ['high-protein', 'dairy-free', 'gluten-free', 'meal-prep', 'anti-inflammatory'],
    servings: 2,
    prepTime: 15,
    cookTime: 35,
    difficulty: 2,
    // Vérif : 64×4 + 22×4 + 20×9 = 256 + 88 + 180 = 524 kcal ✓
    baseNutrition: { calories: 524, proteinGrams: 64, carbsGrams: 22, fatGrams: 20 },
    ingredients: [
      { name: 'Blanc de poulet', qty: 500, unit: 'g' },
      { name: 'Tomates concassées en boîte', qty: 400, unit: 'g' },
      { name: 'Tomates cerises', qty: 150, unit: 'g' },
      { name: 'Olives noires dénoyautées', qty: 60, unit: 'g' },
      { name: 'Câpres', qty: 20, unit: 'g' },
      { name: 'Poivron rouge', qty: 150, unit: 'g' },
      { name: 'Oignon', qty: 80, unit: 'g' },
      { name: 'Ail', qty: 12, unit: 'g' },
      { name: 'Huile d\'olive', qty: 15, unit: 'ml' },
      { name: 'Origan séché', qty: 3, unit: 'g' },
      { name: 'Basilic frais', qty: 10, unit: 'g' },
      { name: 'Sel, poivre, piment doux', qty: 1, unit: 'pincée' }
    ],
    steps: [
      'Couper les blancs de poulet en gros morceaux, les assaisonner de sel, poivre et origan.',
      'Faire dorer le poulet 3 min de chaque côté dans l\'huile d\'olive à feu vif, puis réserver.',
      'Dans la même poêle, faire revenir l\'oignon émincé, l\'ail et le poivron coupé en lanières 4 min à feu moyen.',
      'Ajouter les tomates concassées, les tomates cerises, les olives, les câpres et une pincée de piment ; laisser mijoter 5 min.',
      'Remettre le poulet dans la sauce, couvrir et cuire à feu doux 20 min jusqu\'à ce qu\'il soit cuit à cœur.',
      'Parsemer de basilic frais ciselé et servir directement dans la poêle ou dans des assiettes creuses.'
    ]
  },

  // === R492 — Pasta e Fagioli Protéinée ===
  {
    id: 'R492',
    name: 'Pasta e Fagioli Protéinée Haricots & Pâtes Complètes',
    category: 'italian',
    mealTypes: ['lunch', 'dinner'],
    emoji: '🍲',
    origin: '🇮🇹',
    tags: ['high-protein', 'vegetarian', 'meal-prep', 'balanced', 'budget'],
    servings: 2,
    prepTime: 10,
    cookTime: 25,
    difficulty: 1,
    // Vérif : 32×4 + 90×4 + 14×9 = 128 + 360 + 126 = 614 kcal ✓
    baseNutrition: { calories: 614, proteinGrams: 32, carbsGrams: 90, fatGrams: 14 },
    ingredients: [
      { name: 'Pâtes complètes (ditalini ou pennette)', qty: 160, unit: 'g' },
      { name: 'Haricots blancs en boîte (égouttés)', qty: 400, unit: 'g' },
      { name: 'Tomates concassées en boîte', qty: 300, unit: 'g' },
      { name: 'Bouillon de légumes', qty: 600, unit: 'ml' },
      { name: 'Oignon', qty: 80, unit: 'g' },
      { name: 'Ail', qty: 12, unit: 'g' },
      { name: 'Carotte', qty: 80, unit: 'g' },
      { name: 'Branche de céleri', qty: 60, unit: 'g' },
      { name: 'Huile d\'olive', qty: 15, unit: 'ml' },
      { name: 'Romarin frais', qty: 3, unit: 'g' },
      { name: 'Parmesan râpé', qty: 20, unit: 'g' },
      { name: 'Sel, poivre, piment doux', qty: 1, unit: 'pincée' }
    ],
    steps: [
      'Faire revenir dans l\'huile d\'olive l\'oignon, l\'ail, la carotte et le céleri tous finement émincés avec le romarin, 5 min à feu moyen avec une pincée de sel.',
      'Ajouter les tomates concassées et cuire 3 min en remuant.',
      'Verser le bouillon et les haricots blancs ; mixer grossièrement au mixeur plongeant (juste la moitié pour garder du morceaux) et porter à ébullition.',
      'Ajouter les pâtes et cuire selon le temps indiqué sur le paquet en remuant régulièrement, jusqu\'à consistance de soupe épaisse.',
      'Rectifier avec sel, poivre et une pincée de piment ; si la soupe épaissit trop, ajouter un peu de bouillon chaud.',
      'Servir dans des bols profonds, filet d\'huile d\'olive et parmesan râpé par-dessus.'
    ]
  },

  // === R493 — Frittata Épinards Ricotta au Four ===
  {
    id: 'R493',
    name: 'Frittata Épinards & Ricotta au Four',
    category: 'italian',
    mealTypes: ['lunch', 'dinner'],
    emoji: '🥚',
    origin: '🇮🇹',
    tags: ['high-protein', 'vegetarian', 'gluten-free', 'low-carb', 'meal-prep', 'quick'],
    servings: 2,
    prepTime: 10,
    cookTime: 20,
    difficulty: 1,
    // Vérif : 46×4 + 10×4 + 28×9 = 184 + 40 + 252 = 476 kcal ✓
    baseNutrition: { calories: 476, proteinGrams: 46, carbsGrams: 10, fatGrams: 28 },
    ingredients: [
      { name: 'Œufs entiers', qty: 6, unit: 'pce' },
      { name: 'Ricotta', qty: 150, unit: 'g' },
      { name: 'Épinards frais (ou surgelés décongelés)', qty: 200, unit: 'g' },
      { name: 'Parmesan râpé', qty: 30, unit: 'g' },
      { name: 'Tomates cerises', qty: 100, unit: 'g' },
      { name: 'Ail', qty: 8, unit: 'g' },
      { name: 'Huile d\'olive', qty: 10, unit: 'ml' },
      { name: 'Noix de muscade', qty: 1, unit: 'pincée' },
      { name: 'Sel, poivre noir', qty: 1, unit: 'pincée' }
    ],
    steps: [
      'Préchauffer le four à 180°C. Faire revenir l\'ail dans l\'huile d\'olive 1 min, ajouter les épinards avec une pincée de sel et de muscade, cuire 3 min jusqu\'à ce qu\'ils soient tendres.',
      'Dans un grand bol, battre les œufs avec la ricotta, le parmesan, du sel et du poivre noir jusqu\'à mélange homogène.',
      'Incorporer les épinards égouttés à la préparation aux œufs.',
      'Verser dans un plat à four légèrement huilé (ou une poêle allant au four), disposer les tomates cerises coupées en deux sur le dessus.',
      'Cuire au four 18-20 min jusqu\'à ce que la frittata soit gonflée, dorée sur les bords et prise au centre.',
      'Laisser tiédir 2 min avant de couper en parts et de servir avec une salade verte.'
    ]
  },

  // === R494 — Salade Lentilles Vertes Caprese Style ===
  {
    id: 'R494',
    name: 'Salade Lentilles Vertes Style Caprese',
    category: 'italian',
    mealTypes: ['lunch', 'dinner'],
    emoji: '🥗',
    origin: '🇮🇹',
    tags: ['high-protein', 'vegetarian', 'gluten-free', 'meal-prep', 'anti-inflammatory', 'balanced'],
    servings: 2,
    prepTime: 15,
    cookTime: 20,
    difficulty: 1,
    // Vérif : 36×4 + 56×4 + 20×9 = 144 + 224 + 180 = 548 kcal ✓
    baseNutrition: { calories: 548, proteinGrams: 36, carbsGrams: 56, fatGrams: 20 },
    ingredients: [
      { name: 'Lentilles vertes (sèches)', qty: 200, unit: 'g' },
      { name: 'Mozzarella (boule)', qty: 125, unit: 'g' },
      { name: 'Tomates mûres', qty: 300, unit: 'g' },
      { name: 'Tomates cerises', qty: 100, unit: 'g' },
      { name: 'Basilic frais', qty: 15, unit: 'g' },
      { name: 'Huile d\'olive extra-vierge', qty: 20, unit: 'ml' },
      { name: 'Vinaigre balsamique', qty: 15, unit: 'ml' },
      { name: 'Citron (jus)', qty: 15, unit: 'ml' },
      { name: 'Ail', qty: 5, unit: 'g' },
      { name: 'Sel, poivre noir, origan séché', qty: 1, unit: 'pincée' }
    ],
    steps: [
      'Rincer les lentilles et les cuire 20 min dans une grande casserole d\'eau salée non couverte, jusqu\'à ce qu\'elles soient tendres mais encore fermes ; égoutter et refroidir sous eau froide.',
      'Couper les tomates en rondelles, les tomates cerises en deux, la mozzarella en tranches. Ciseler le basilic.',
      'Préparer la vinaigrette en fouettant l\'huile d\'olive, le vinaigre balsamique, le jus de citron, l\'ail pressé, une pincée de sel, poivre et origan.',
      'Dans un grand saladier, mélanger les lentilles tièdes avec la moitié de la vinaigrette, laisser absorber 5 min.',
      'Disposer les lentilles en base dans les assiettes, placer alternativement les tranches de tomates et de mozzarella par-dessus.',
      'Arroser du reste de vinaigrette, parsemer de basilic frais ciselé et servir immédiatement ou après 15 min pour que les saveurs se mêlent.'
    ]
  },

  // === R495 — Saumon à l'Agrodolce Sicilienne ===
  {
    id: 'R495',
    name: 'Saumon Agrodolce Sicilienne Tomates Cerises',
    category: 'italian',
    mealTypes: ['lunch', 'dinner'],
    emoji: '🐟',
    origin: '🇮🇹',
    tags: ['high-protein', 'gluten-free', 'dairy-free', 'omega3', 'anti-inflammatory', 'quick'],
    servings: 2,
    prepTime: 10,
    cookTime: 15,
    difficulty: 2,
    // Vérif : 52×4 + 20×4 + 24×9 = 208 + 80 + 216 = 504 kcal ✓
    baseNutrition: { calories: 504, proteinGrams: 52, carbsGrams: 20, fatGrams: 24 },
    ingredients: [
      { name: 'Filets de saumon (sans peau)', qty: 400, unit: 'g' },
      { name: 'Tomates cerises', qty: 250, unit: 'g' },
      { name: 'Vinaigre balsamique', qty: 30, unit: 'ml' },
      { name: 'Miel', qty: 15, unit: 'g' },
      { name: 'Olives vertes dénoyautées', qty: 50, unit: 'g' },
      { name: 'Câpres', qty: 20, unit: 'g' },
      { name: 'Ail', qty: 10, unit: 'g' },
      { name: 'Huile d\'olive', qty: 15, unit: 'ml' },
      { name: 'Basilic frais', qty: 10, unit: 'g' },
      { name: 'Sel, poivre, piment doux', qty: 1, unit: 'pincée' }
    ],
    steps: [
      'Assaisonner les filets de saumon avec sel, poivre et piment doux sur les deux faces.',
      'Chauffer l\'huile d\'olive dans une poêle antiadhésive à feu vif ; saisir le saumon 3 min côté peau puis 2 min côté chair ; réserver sur une assiette.',
      'Dans la même poêle à feu moyen, faire revenir l\'ail émincé 1 min, puis ajouter les tomates cerises coupées en deux et cuire 3 min jusqu\'à ce qu\'elles commencent à fondre.',
      'Verser le vinaigre balsamique et le miel, mélanger et laisser réduire 2 min pour former une sauce agrodolce brillante.',
      'Ajouter les olives et les câpres dans la sauce, chauffer 1 min.',
      'Remettre le saumon dans la poêle, napper de sauce, parsemer de basilic frais et servir immédiatement avec du quinoa ou des légumes vapeur.'
    ]
  },

  // === R496 — Zucchini Ripieni Thon-Ricotta ===
  {
    id: 'R496',
    name: 'Zucchini Ripieni Thon & Ricotta',
    category: 'italian',
    mealTypes: ['lunch', 'dinner'],
    emoji: '🥒',
    origin: '🇮🇹',
    tags: ['high-protein', 'gluten-free', 'low-carb', 'omega3', 'meal-prep', 'balanced'],
    servings: 2,
    prepTime: 15,
    cookTime: 25,
    difficulty: 2,
    // Vérif : 48×4 + 16×4 + 20×9 = 192 + 64 + 180 = 436 kcal ✓
    baseNutrition: { calories: 436, proteinGrams: 48, carbsGrams: 16, fatGrams: 20 },
    ingredients: [
      { name: 'Courgettes (grandes)', qty: 600, unit: 'g' },
      { name: 'Thon en boîte au naturel (égoutté)', qty: 240, unit: 'g' },
      { name: 'Ricotta', qty: 120, unit: 'g' },
      { name: 'Parmesan râpé', qty: 30, unit: 'g' },
      { name: 'Tomates cerises', qty: 100, unit: 'g' },
      { name: 'Câpres', qty: 15, unit: 'g' },
      { name: 'Ail', qty: 8, unit: 'g' },
      { name: 'Persil frais', qty: 15, unit: 'g' },
      { name: 'Citron (jus + zeste)', qty: 30, unit: 'ml' },
      { name: 'Huile d\'olive', qty: 10, unit: 'ml' },
      { name: 'Sel, poivre noir, origan', qty: 1, unit: 'pincée' }
    ],
    steps: [
      'Préchauffer le four à 190°C. Couper les courgettes en deux dans la longueur, vider la chair avec une cuillère en laissant 5 mm de bord ; hacher grossièrement la chair prélevée.',
      'Faire revenir la chair de courgette avec l\'ail dans l\'huile d\'olive, sel et poivre, 4 min à feu moyen ; retirer du feu et laisser refroidir légèrement.',
      'Dans un bol, mélanger le thon émietté, la ricotta, le parmesan, les câpres, le jus et le zeste de citron, le persil haché, et la chair de courgette sautée.',
      'Assaisonner la farce de poivre et d\'origan, puis garnir généreusement les barques de courgettes.',
      'Déposer une demi-tomate cerise sur chaque courgette farcie ; placer sur une plaque huilée et cuire 22-25 min jusqu\'à ce que les courgettes soient tendres et dorées.',
      'Servir chaud ou tiède, avec un filet d\'huile d\'olive et persil frais ciselé.'
    ]
  },

  // === R497 — Panzanella Moderne Thon & Légumes ===
  {
    id: 'R497',
    name: 'Panzanella Moderne Thon, Tomates & Pain Complet Grillé',
    category: 'italian',
    mealTypes: ['lunch', 'dinner'],
    emoji: '🥙',
    origin: '🇮🇹',
    tags: ['high-protein', 'dairy-free', 'omega3', 'meal-prep', 'balanced', 'anti-inflammatory'],
    servings: 2,
    prepTime: 20,
    cookTime: 10,
    difficulty: 1,
    // Vérif : 44×4 + 48×4 + 20×9 = 176 + 192 + 180 = 548 kcal ✓
    baseNutrition: { calories: 548, proteinGrams: 44, carbsGrams: 48, fatGrams: 20 },
    ingredients: [
      { name: 'Pain complet rassis (ou pain de campagne)', qty: 120, unit: 'g' },
      { name: 'Thon en boîte au naturel (égoutté)', qty: 240, unit: 'g' },
      { name: 'Tomates mûres', qty: 300, unit: 'g' },
      { name: 'Tomates cerises', qty: 100, unit: 'g' },
      { name: 'Concombre', qty: 150, unit: 'g' },
      { name: 'Poivron rouge', qty: 100, unit: 'g' },
      { name: 'Oignon rouge', qty: 60, unit: 'g' },
      { name: 'Basilic frais', qty: 15, unit: 'g' },
      { name: 'Huile d\'olive extra-vierge', qty: 20, unit: 'ml' },
      { name: 'Vinaigre de vin rouge', qty: 15, unit: 'ml' },
      { name: 'Ail', qty: 5, unit: 'g' },
      { name: 'Sel, poivre, origan séché', qty: 1, unit: 'pincée' }
    ],
    steps: [
      'Couper le pain en cubes de 2 cm ; les frotter d\'ail et les griller à sec à la poêle ou au four 180°C pendant 8 min jusqu\'à ce qu\'ils soient croustillants.',
      'Couper les tomates et le concombre en morceaux, les tomates cerises en deux, le poivron en dés et l\'oignon rouge en fines lamelles.',
      'Fouetter l\'huile d\'olive avec le vinaigre de vin rouge, une pincée de sel, poivre et origan pour former la vinaigrette.',
      'Dans un grand saladier, mélanger les légumes avec la moitié de la vinaigrette ; laisser dégorger 5 min.',
      'Ajouter le thon émietté et les croûtons, arroser du reste de vinaigrette ; mélanger délicatement pour que le pain absorbe les jus sans se défaire.',
      'Parsemer de basilic frais ciselé, rectifier l\'assaisonnement en sel et poivre, servir immédiatement ou après 10 min de repos.'
    ]
  },

  // === R498 — Minestrone Express Haute Protéine ===
  {
    id: 'R498',
    name: 'Minestrone Express Haute Protéine Lentilles & Légumes',
    category: 'italian',
    mealTypes: ['lunch', 'dinner'],
    emoji: '🍜',
    origin: '🇮🇹',
    tags: ['high-protein', 'vegetarian', 'dairy-free', 'meal-prep', 'budget', 'anti-inflammatory'],
    servings: 2,
    prepTime: 12,
    cookTime: 28,
    difficulty: 1,
    // Vérif : 34×4 + 72×4 + 10×9 = 136 + 288 + 90 = 514 kcal ✓
    baseNutrition: { calories: 514, proteinGrams: 34, carbsGrams: 72, fatGrams: 10 },
    ingredients: [
      { name: 'Lentilles corail (sèches)', qty: 120, unit: 'g' },
      { name: 'Pâtes complètes (ditalini ou macaroni)', qty: 80, unit: 'g' },
      { name: 'Tomates concassées en boîte', qty: 400, unit: 'g' },
      { name: 'Bouillon de légumes', qty: 800, unit: 'ml' },
      { name: 'Courgette', qty: 150, unit: 'g' },
      { name: 'Carotte', qty: 100, unit: 'g' },
      { name: 'Haricots verts surgelés', qty: 100, unit: 'g' },
      { name: 'Oignon', qty: 80, unit: 'g' },
      { name: 'Ail', qty: 10, unit: 'g' },
      { name: 'Céleri', qty: 60, unit: 'g' },
      { name: 'Huile d\'olive', qty: 10, unit: 'ml' },
      { name: 'Thym, laurier, origan', qty: 3, unit: 'g' },
      { name: 'Sel, poivre, piment doux', qty: 1, unit: 'pincée' }
    ],
    steps: [
      'Émincer l\'oignon, l\'ail, le céleri et couper la carotte et la courgette en dés de 1 cm.',
      'Dans une grande casserole, chauffer l\'huile d\'olive à feu moyen, faire revenir l\'oignon, le céleri et la carotte 5 min avec sel, poivre et herbes jusqu\'à légère coloration.',
      'Ajouter l\'ail 1 min, puis les tomates concassées, mélanger et cuire 3 min.',
      'Verser le bouillon et les lentilles corail rincées ; porter à ébullition, réduire le feu et cuire 12 min en remuant de temps en temps (les lentilles épaississent la soupe naturellement).',
      'Ajouter les pâtes, la courgette et les haricots verts ; cuire encore 10 min à feu doux jusqu\'à ce que les pâtes soient al dente.',
      'Rectifier l\'assaisonnement en sel, poivre et piment doux ; servir bien chaud avec un filet d\'huile d\'olive et une pincée d\'origan.'
    ]
  },

  // === R499 — Pollo alla Milanese Légère au Four ===
  {
    id: 'R499',
    name: 'Pollo alla Milanese Légère au Four & Roquette Citron',
    category: 'italian',
    mealTypes: ['lunch', 'dinner'],
    emoji: '🍋',
    origin: '🇮🇹',
    tags: ['high-protein', 'dairy-free', 'meal-prep', 'balanced', 'festive'],
    servings: 2,
    prepTime: 15,
    cookTime: 22,
    difficulty: 2,
    // Vérif : 66×4 + 38×4 + 18×9 = 264 + 152 + 162 = 578 kcal ✓
    baseNutrition: { calories: 578, proteinGrams: 66, carbsGrams: 38, fatGrams: 18 },
    ingredients: [
      { name: 'Blanc de poulet', qty: 500, unit: 'g' },
      { name: 'Chapelure complète (ou flocons d\'avoine mixés)', qty: 60, unit: 'g' },
      { name: 'Parmesan râpé', qty: 30, unit: 'g' },
      { name: 'Œuf entier', qty: 1, unit: 'pce' },
      { name: 'Roquette fraîche', qty: 80, unit: 'g' },
      { name: 'Tomates cerises', qty: 150, unit: 'g' },
      { name: 'Citron (jus + zeste)', qty: 40, unit: 'ml' },
      { name: 'Huile d\'olive', qty: 15, unit: 'ml' },
      { name: 'Ail en poudre', qty: 3, unit: 'g' },
      { name: 'Origan séché', qty: 2, unit: 'g' },
      { name: 'Sel, poivre noir', qty: 1, unit: 'pincée' }
    ],
    steps: [
      'Préchauffer le four à 200°C avec une grille huilée. Placer les blancs de poulet entre deux feuilles de film alimentaire et les aplatir à 1 cm avec un rouleau à pâtisserie.',
      'Mélanger la chapelure avec le parmesan, l\'ail en poudre, l\'origan, le sel et le poivre dans une assiette creuse.',
      'Battre l\'œuf dans une assiette. Tremper chaque escalope dans l\'œuf battu, puis dans le mélange chapelure-parmesan en pressant bien pour faire adhérer.',
      'Déposer les escalopes panées sur la grille huilée, arroser d\'un filet d\'huile d\'olive et cuire au four 20-22 min en retournant à mi-cuisson, jusqu\'à dorure croustillante.',
      'Pendant ce temps, couper les tomates cerises en deux, préparer la vinaigrette en fouettant le jus de citron avec le reste d\'huile, sel et poivre.',
      'Dresser les escalopes avec la roquette et les tomates cerises assaisonnées de vinaigrette citron ; terminer avec le zeste de citron râpé.'
    ]
  },

  // ═══════════════════════════════════════════════════
  //  CUISINE FRANÇAISE — R500-R509
  // ═══════════════════════════════════════════════════

// === R500 — SALADE NIÇOISE REVISITÉE ===
  {
    id: 'R500',
    name: 'Salade Niçoise Revisitée',
    category: 'french',
    mealTypes: ['lunch', 'dinner'],
    emoji: '🥗',
    origin: '🇫🇷',
    tags: ['high-protein', 'omega3', 'gluten-free', 'dairy-free', 'anti-inflammatory', 'no-cook', 'balanced'],
    servings: 2,
    prepTime: 15,
    cookTime: 10,
    difficulty: 1,
    // 56*4 + 22*4 + 26*9 = 224 + 88 + 234 = 546 ✓
    baseNutrition: { calories: 546, proteinGrams: 56, carbsGrams: 22, fatGrams: 26 },
    ingredients: [
      { name: 'Thon en conserve au naturel', qty: 280, unit: 'g' },
      { name: 'Œufs', qty: 3, unit: 'pce' },
      { name: 'Haricots verts frais', qty: 180, unit: 'g' },
      { name: 'Tomates cerises', qty: 150, unit: 'g' },
      { name: 'Olives noires dénoyautées', qty: 40, unit: 'g' },
      { name: 'Feuilles de laitue romaine', qty: 80, unit: 'g' },
      { name: 'Huile d\'olive extra vierge', qty: 20, unit: 'ml' },
      { name: 'Vinaigre de vin', qty: 10, unit: 'ml' },
      { name: 'Moutarde de Dijon', qty: 8, unit: 'g' },
      { name: 'Citron (jus)', qty: 15, unit: 'ml' },
      { name: 'Câpres', qty: 15, unit: 'g' },
      { name: 'Sel, poivre', qty: 1, unit: 'pincée' }
    ],
    steps: [
      'Cuire les œufs durs 9 minutes dans l\'eau bouillante, refroidir sous eau froide, écaler et couper en quartiers.',
      'Blanchir les haricots verts 4 minutes dans eau bouillante salée, égoutter et plonger dans eau glacée pour fixer la couleur.',
      'Préparer la vinaigrette : fouetter huile d\'olive, vinaigre, moutarde, jus de citron, sel et poivre.',
      'Dresser la laitue dans les assiettes, répartir haricots verts, tomates cerises coupées en deux, thon égoutté et effeuillé, olives et câpres.',
      'Poser les quartiers d\'œufs sur la salade, napper de vinaigrette et servir immédiatement.'
    ]
  },

  // === R501 — POULET BASQUAISE EXPRESS ===
  {
    id: 'R501',
    name: 'Poulet Basquaise Express',
    category: 'french',
    mealTypes: ['lunch', 'dinner'],
    emoji: '🍗',
    origin: '🇫🇷',
    tags: ['high-protein', 'gluten-free', 'dairy-free', 'anti-inflammatory', 'balanced', 'meal-prep'],
    servings: 2,
    prepTime: 15,
    cookTime: 30,
    difficulty: 2,
    // 62*4 + 28*4 + 18*9 = 248 + 112 + 162 = 522 ✓
    baseNutrition: { calories: 522, proteinGrams: 62, carbsGrams: 28, fatGrams: 18 },
    ingredients: [
      { name: 'Blancs de poulet', qty: 400, unit: 'g' },
      { name: 'Poivrons rouges', qty: 200, unit: 'g' },
      { name: 'Poivron vert', qty: 100, unit: 'g' },
      { name: 'Tomates pelées en conserve', qty: 300, unit: 'g' },
      { name: 'Jambon de dinde fumé', qty: 60, unit: 'g' },
      { name: 'Oignon', qty: 100, unit: 'g' },
      { name: 'Ail', qty: 3, unit: 'gousses' },
      { name: 'Huile d\'olive', qty: 15, unit: 'ml' },
      { name: 'Piment doux (paprika fumé)', qty: 5, unit: 'g' },
      { name: 'Thym, laurier', qty: 1, unit: 'pincée' },
      { name: 'Sel, poivre', qty: 1, unit: 'pincée' }
    ],
    steps: [
      'Couper les poivrons en lanières, émincer l\'oignon et hacher l\'ail. Détailler le poulet en gros cubes.',
      'Faire revenir le poulet 3 minutes de chaque côté dans l\'huile d\'olive à feu vif. Réserver.',
      'Dans la même poêle, faire suer l\'oignon 3 minutes, ajouter l\'ail, les poivrons et le jambon de dinde. Cuire 5 minutes.',
      'Ajouter les tomates, le paprika fumé, le thym et le laurier. Laisser mijoter 10 minutes.',
      'Remettre le poulet dans la sauce, couvrir et cuire encore 15 minutes à feu doux jusqu\'à tendreté. Rectifier l\'assaisonnement.'
    ]
  },

  // === R502 — SOUPE DE LENTILLES VERTES À LA FRANÇAISE ===
  {
    id: 'R502',
    name: 'Soupe de Lentilles Vertes à la Française',
    category: 'french',
    mealTypes: ['lunch', 'dinner'],
    emoji: '🥣',
    origin: '🇫🇷',
    tags: ['vegetarian', 'high-protein', 'balanced', 'meal-prep', 'budget', 'anti-inflammatory'],
    servings: 2,
    prepTime: 10,
    cookTime: 35,
    difficulty: 1,
    // 32*4 + 62*4 + 10*9 = 128 + 248 + 90 = 466 ✓
    baseNutrition: { calories: 466, proteinGrams: 32, carbsGrams: 62, fatGrams: 10 },
    ingredients: [
      { name: 'Lentilles vertes sèches', qty: 200, unit: 'g' },
      { name: 'Carottes', qty: 150, unit: 'g' },
      { name: 'Oignon', qty: 100, unit: 'g' },
      { name: 'Céleri branche', qty: 80, unit: 'g' },
      { name: 'Ail', qty: 2, unit: 'gousses' },
      { name: 'Bouillon de légumes (cube)', qty: 800, unit: 'ml' },
      { name: 'Huile d\'olive', qty: 15, unit: 'ml' },
      { name: 'Cumin moulu', qty: 3, unit: 'g' },
      { name: 'Thym séché', qty: 2, unit: 'g' },
      { name: 'Laurier', qty: 1, unit: 'feuille' },
      { name: 'Persil frais', qty: 10, unit: 'g' },
      { name: 'Sel, poivre', qty: 1, unit: 'pincée' }
    ],
    steps: [
      'Rincer les lentilles à l\'eau froide. Éplucher et tailler carottes, oignon et céleri en dés.',
      'Faire suer l\'oignon et le céleri dans l\'huile d\'olive 3 minutes, ajouter l\'ail haché et le cumin, cuire 1 minute.',
      'Ajouter les carottes, les lentilles, le thym et le laurier. Verser le bouillon chaud.',
      'Porter à ébullition puis laisser mijoter 30 minutes à feu doux jusqu\'à ce que les lentilles soient fondantes.',
      'Mixer partiellement pour une texture crémeuse avec des morceaux. Rectifier l\'assaisonnement, parsemer de persil frais et servir.'
    ]
  },

  // === R503 — SOLE MEUNIÈRE LÉGÈRE ===
  {
    id: 'R503',
    name: 'Sole Meunière Légère Huile d\'Olive',
    category: 'french',
    mealTypes: ['lunch', 'dinner'],
    emoji: '🐟',
    origin: '🇫🇷',
    tags: ['high-protein', 'omega3', 'gluten-free', 'dairy-free', 'low-carb', 'quick', 'anti-inflammatory'],
    servings: 2,
    prepTime: 10,
    cookTime: 15,
    difficulty: 2,
    // 58*4 + 8*4 + 22*9 = 232 + 32 + 198 = 462 ✓
    baseNutrition: { calories: 462, proteinGrams: 58, carbsGrams: 8, fatGrams: 22 },
    ingredients: [
      { name: 'Filets de sole (ou merlan)', qty: 500, unit: 'g' },
      { name: 'Farine de riz', qty: 20, unit: 'g' },
      { name: 'Huile d\'olive', qty: 20, unit: 'ml' },
      { name: 'Citron (jus + zeste)', qty: 1, unit: 'pce' },
      { name: 'Persil plat frais', qty: 15, unit: 'g' },
      { name: 'Câpres', qty: 20, unit: 'g' },
      { name: 'Ail', qty: 1, unit: 'gousse' },
      { name: 'Sel, poivre blanc', qty: 1, unit: 'pincée' }
    ],
    steps: [
      'Sécher les filets de sole avec du papier absorbant. Assaisonner de sel et poivre, fariner légèrement avec la farine de riz (secouer l\'excédent).',
      'Chauffer l\'huile d\'olive dans une grande poêle antiadhésive à feu moyen-vif. Cuire les filets 2-3 minutes de chaque côté jusqu\'à dorure légère.',
      'Retirer les filets, réserver au chaud. Baisser le feu, ajouter l\'ail haché dans la poêle, faire blondir 30 secondes.',
      'Déglacer avec le jus de citron, ajouter les câpres et le zeste. Gratter les sucs de cuisson 1 minute.',
      'Verser la sauce citronnée sur les filets, parsemer de persil haché et servir aussitôt avec une salade verte ou haricots verts vapeur.'
    ]
  },

  // === R504 — ŒUFS COCOTTE CHAMPIGNONS ÉPINARDS ===
  {
    id: 'R504',
    name: 'Œufs Cocotte Champignons Épinards',
    category: 'french',
    mealTypes: ['lunch', 'dinner'],
    emoji: '🥚',
    origin: '🇫🇷',
    tags: ['vegetarian', 'high-protein', 'low-carb', 'gluten-free', 'quick', 'anti-inflammatory'],
    servings: 2,
    prepTime: 10,
    cookTime: 15,
    difficulty: 1,
    // 34*4 + 10*4 + 24*9 = 136 + 40 + 216 = 392 ✓
    baseNutrition: { calories: 392, proteinGrams: 34, carbsGrams: 10, fatGrams: 24 },
    ingredients: [
      { name: 'Œufs frais', qty: 4, unit: 'pce' },
      { name: 'Champignons de Paris', qty: 200, unit: 'g' },
      { name: 'Épinards frais', qty: 150, unit: 'g' },
      { name: 'Yaourt grec 0%', qty: 80, unit: 'g' },
      { name: 'Fromage de chèvre frais (Jaouda)', qty: 50, unit: 'g' },
      { name: 'Ail', qty: 1, unit: 'gousse' },
      { name: 'Huile d\'olive', qty: 10, unit: 'ml' },
      { name: 'Muscade moulue', qty: 1, unit: 'pincée' },
      { name: 'Sel, poivre', qty: 1, unit: 'pincée' }
    ],
    steps: [
      'Préchauffer le four à 180°C. Émincer finement les champignons, hacher l\'ail.',
      'Faire sauter les champignons et l\'ail dans l\'huile d\'olive 4 minutes jusqu\'à évaporation. Ajouter les épinards, cuire 2 minutes jusqu\'à ce qu\'ils tombent. Assaisonner sel, poivre, muscade.',
      'Mélanger le yaourt grec avec la moitié du chèvre émietté. Huiler deux ramequins.',
      'Répartir le mélange champignons-épinards dans les ramequins, creuser un nid et casser 2 œufs dans chacun. Déposer le reste du chèvre, napper d\'une cuillerée de yaourt.',
      'Cuire au bain-marie au four 12-14 minutes jusqu\'à ce que les blancs soient pris et les jaunes encore coulants. Servir immédiatement.'
    ]
  },

  // === R505 — SALADE LYONNAISE MODERNISÉE ===
  {
    id: 'R505',
    name: 'Salade Lyonnaise Modernisée',
    category: 'french',
    mealTypes: ['lunch', 'dinner'],
    emoji: '🥗',
    origin: '🇫🇷',
    tags: ['high-protein', 'gluten-free', 'dairy-free', 'balanced', 'quick', 'low-carb'],
    servings: 2,
    prepTime: 12,
    cookTime: 10,
    difficulty: 2,
    // 44*4 + 10*4 + 26*9 = 176 + 40 + 234 = 450 ✓
    baseNutrition: { calories: 450, proteinGrams: 44, carbsGrams: 10, fatGrams: 26 },
    ingredients: [
      { name: 'Œufs frais (pour pocher)', qty: 4, unit: 'pce' },
      { name: 'Lardons de dinde fumés', qty: 120, unit: 'g' },
      { name: 'Roquette', qty: 80, unit: 'g' },
      { name: 'Frisée (chicorée)', qty: 60, unit: 'g' },
      { name: 'Tomates cerises', qty: 100, unit: 'g' },
      { name: 'Vinaigre blanc', qty: 30, unit: 'ml' },
      { name: 'Huile d\'olive', qty: 20, unit: 'ml' },
      { name: 'Moutarde de Dijon', qty: 8, unit: 'g' },
      { name: 'Vinaigre balsamique', qty: 10, unit: 'ml' },
      { name: 'Échalote', qty: 30, unit: 'g' },
      { name: 'Sel, poivre', qty: 1, unit: 'pincée' }
    ],
    steps: [
      'Faire revenir les lardons de dinde dans une poêle chaude sans matière grasse 3-4 minutes jusqu\'à ce qu\'ils soient dorés et légèrement croustillants.',
      'Préparer la vinaigrette tiède : dans les lardons retirés, faire suer l\'échalote émincée finement, déglacer avec le vinaigre balsamique, ajouter l\'huile d\'olive et la moutarde.',
      'Pocher les œufs : porter l\'eau à frémissement avec le vinaigre blanc. Casser chaque œuf dans un bol, créer un tourbillon et glisser l\'œuf. Cuire 3 minutes. Égoutter sur papier absorbant.',
      'Dresser roquette et frisée dans les assiettes, ajouter les tomates cerises et les lardons chauds, napper de vinaigrette tiède.',
      'Déposer 2 œufs pochés par assiette, assaisonner et servir immédiatement.'
    ]
  },

  // === R506 — GRATIN DE COURGETTES AU CHÈVRE FRAIS ===
  {
    id: 'R506',
    name: 'Gratin de Courgettes au Chèvre Frais',
    category: 'french',
    mealTypes: ['lunch', 'dinner'],
    emoji: '🥦',
    origin: '🇫🇷',
    tags: ['vegetarian', 'gluten-free', 'balanced', 'anti-inflammatory', 'meal-prep', 'low-carb'],
    servings: 2,
    prepTime: 15,
    cookTime: 30,
    difficulty: 2,
    // 28*4 + 14*4 + 22*9 = 112 + 56 + 198 = 366 ✓
    baseNutrition: { calories: 366, proteinGrams: 28, carbsGrams: 14, fatGrams: 22 },
    ingredients: [
      { name: 'Courgettes', qty: 500, unit: 'g' },
      { name: 'Fromage de chèvre frais (Jaouda)', qty: 120, unit: 'g' },
      { name: 'Yaourt grec 0%', qty: 100, unit: 'g' },
      { name: 'Œufs', qty: 2, unit: 'pce' },
      { name: 'Ail', qty: 2, unit: 'gousses' },
      { name: 'Huile d\'olive', qty: 10, unit: 'ml' },
      { name: 'Thym frais', qty: 4, unit: 'g' },
      { name: 'Parmesan râpé', qty: 20, unit: 'g' },
      { name: 'Sel, poivre', qty: 1, unit: 'pincée' }
    ],
    steps: [
      'Préchauffer le four à 190°C. Couper les courgettes en rondelles de 5 mm. Faire revenir avec l\'ail émincé dans l\'huile d\'olive 5 minutes, assaisonner.',
      'Dans un bol, fouetter les œufs avec le yaourt grec, les 3/4 du chèvre émietté, le thym, sel et poivre.',
      'Disposer les courgettes dans un plat à gratin légèrement huilé, verser l\'appareil yaourt-chèvre par-dessus.',
      'Émietter le reste du chèvre sur le dessus, parsemer de parmesan râpé.',
      'Cuire 25-30 minutes jusqu\'à ce que le gratin soit doré et ferme. Laisser tiédir 5 minutes avant de servir.'
    ]
  },

  // === R507 — RILLETTES DE SARDINES ===
  {
    id: 'R507',
    name: 'Rillettes de Sardines aux Herbes',
    category: 'french',
    mealTypes: ['lunch', 'dinner'],
    emoji: '🐟',
    origin: '🇫🇷',
    tags: ['high-protein', 'omega3', 'gluten-free', 'no-cook', 'quick', 'anti-inflammatory', 'budget'],
    servings: 2,
    prepTime: 10,
    cookTime: 0,
    difficulty: 1,
    // 38*4 + 6*4 + 28*9 = 152 + 24 + 252 = 428 ✓
    baseNutrition: { calories: 428, proteinGrams: 38, carbsGrams: 6, fatGrams: 28 },
    ingredients: [
      { name: 'Sardines en conserve à l\'huile d\'olive', qty: 240, unit: 'g' },
      { name: 'Fromage blanc 0% (ou yaourt grec égoutté)', qty: 80, unit: 'g' },
      { name: 'Citron (jus + zeste)', qty: 1, unit: 'pce' },
      { name: 'Échalotes', qty: 30, unit: 'g' },
      { name: 'Ciboulette fraîche', qty: 10, unit: 'g' },
      { name: 'Persil plat frais', qty: 10, unit: 'g' },
      { name: 'Moutarde de Dijon', qty: 8, unit: 'g' },
      { name: 'Câpres', qty: 10, unit: 'g' },
      { name: 'Poivre noir, piment doux', qty: 1, unit: 'pincée' }
    ],
    steps: [
      'Égoutter les sardines en conservant 1 cuillère à soupe d\'huile d\'olive. Retirer les arêtes centrales si nécessaire.',
      'Émincer finement l\'échalote, hacher la ciboulette et le persil.',
      'Écraser les sardines à la fourchette dans un bol. Incorporer le fromage blanc, la moutarde, le jus de citron et le zeste.',
      'Ajouter l\'échalote, les herbes, les câpres et le piment. Mélanger grossièrement pour garder une texture rustique.',
      'Réfrigérer 15 minutes avant de servir sur des tranches de pain de seigle grillé ou des crackers, garni de rondelles de concombre.'
    ]
  },

  // === R508 — BOURGUIGNON DE POULET ALLÉGÉ ===
  {
    id: 'R508',
    name: 'Bourguignon de Poulet Allégé',
    category: 'french',
    mealTypes: ['lunch', 'dinner'],
    emoji: '🍲',
    origin: '🇫🇷',
    tags: ['high-protein', 'dairy-free', 'balanced', 'meal-prep', 'anti-inflammatory'],
    servings: 2,
    prepTime: 20,
    cookTime: 45,
    difficulty: 3,
    // 68*4 + 24*4 + 16*9 = 272 + 96 + 144 = 512 ✓
    baseNutrition: { calories: 512, proteinGrams: 68, carbsGrams: 24, fatGrams: 16 },
    ingredients: [
      { name: 'Cuisses de poulet désossées sans peau', qty: 450, unit: 'g' },
      { name: 'Champignons de Paris', qty: 200, unit: 'g' },
      { name: 'Carottes', qty: 150, unit: 'g' },
      { name: 'Oignon', qty: 100, unit: 'g' },
      { name: 'Tomates pelées en conserve', qty: 200, unit: 'g' },
      { name: 'Bouillon de poulet dégraissé', qty: 250, unit: 'ml' },
      { name: 'Vin rouge (optionnel, 1 verre)', qty: 100, unit: 'ml' },
      { name: 'Ail', qty: 3, unit: 'gousses' },
      { name: 'Huile d\'olive', qty: 15, unit: 'ml' },
      { name: 'Concentré de tomate', qty: 15, unit: 'g' },
      { name: 'Thym, laurier, persil', qty: 1, unit: 'bouquet' },
      { name: 'Sel, poivre', qty: 1, unit: 'pincée' }
    ],
    steps: [
      'Couper le poulet en gros morceaux (4-5 cm), assaisonner. Faire dorer vivement dans l\'huile d\'olive 4 minutes de chaque côté. Réserver.',
      'Dans la même cocotte, faire revenir l\'oignon émincé et les carottes en dés 5 minutes. Ajouter l\'ail haché, le concentré de tomate, cuire 1 minute.',
      'Déglacer avec le vin rouge si utilisé (ou bouillon). Gratter les sucs, laisser réduire 3 minutes.',
      'Ajouter les tomates concassées, le bouillon, le thym et le laurier. Remettre le poulet. Porter à ébullition, couvrir et mijoter 30 minutes.',
      'Ajouter les champignons entiers les 15 dernières minutes. Rectifier l\'assaisonnement, parsemer de persil haché et servir avec pommes vapeur ou haricots verts.'
    ]
  },

  // === R509 — TARTARE DE THON FAÇON FRANÇAISE ===
  {
    id: 'R509',
    name: 'Tartare de Thon Façon Française',
    category: 'french',
    mealTypes: ['lunch', 'dinner'],
    emoji: '🥩',
    origin: '🇫🇷',
    tags: ['high-protein', 'omega3', 'gluten-free', 'dairy-free', 'low-carb', 'no-cook', 'quick', 'anti-inflammatory', 'festive'],
    servings: 2,
    prepTime: 15,
    cookTime: 0,
    difficulty: 2,
    // 52*4 + 8*4 + 18*9 = 208 + 32 + 162 = 402 ✓
    baseNutrition: { calories: 402, proteinGrams: 52, carbsGrams: 8, fatGrams: 18 },
    ingredients: [
      { name: 'Thon frais (ou thon en conserve premium à l\'huile d\'olive)', qty: 320, unit: 'g' },
      { name: 'Câpres', qty: 20, unit: 'g' },
      { name: 'Échalotes', qty: 40, unit: 'g' },
      { name: 'Cornichons fins', qty: 30, unit: 'g' },
      { name: 'Ciboulette fraîche', qty: 10, unit: 'g' },
      { name: 'Persil plat frais', qty: 8, unit: 'g' },
      { name: 'Moutarde de Dijon', qty: 10, unit: 'g' },
      { name: 'Huile d\'olive extra vierge', qty: 20, unit: 'ml' },
      { name: 'Citron (jus)', qty: 20, unit: 'ml' },
      { name: 'Sauce soja légère', qty: 10, unit: 'ml' },
      { name: 'Poivre noir, fleur de sel', qty: 1, unit: 'pincée' }
    ],
    steps: [
      'Si thon frais : s\'assurer qu\'il est très frais (sashimi grade). Couper en petits dés de 5 mm au couteau bien aiguisé. Si conserve premium : égoutter et effeuiller grossièrement.',
      'Émincer finement l\'échalote, hacher les cornichons, les câpres, la ciboulette et le persil.',
      'Préparer la sauce : mélanger moutarde, jus de citron, sauce soja, huile d\'olive, poivre.',
      'Combiner le thon avec l\'échalote, les cornichons, les câpres et les herbes. Incorporer la sauce délicatement. Goûter et ajuster citron/sel.',
      'Former le tartare à l\'aide d\'un cercle dans les assiettes, parsemer de fleur de sel et ciboulette. Servir avec roquette et crackers de seigle ou concombre en lamelles.'
    ]
  },

  // ═══════════════════════════════════════════════════
  //  CUISINE MEXICAINE — R510-R519
  // ═══════════════════════════════════════════════════

// === R510 — BURRITO BOWL POULET GRILLÉ ===
{
  id: 'R510',
  name: 'Burrito Bowl Poulet Grillé',
  category: 'mexican',
  mealTypes: ['lunch', 'dinner'],
  emoji: '🌯',
  origin: '🇲🇽',
  tags: ['high-protein', 'meal-prep', 'balanced', 'dairy-free'],
  servings: 2,
  prepTime: 15,
  cookTime: 20,
  difficulty: 1,
  // Vérif macros (total 2 portions) : 58×4 + 72×4 + 18×9 = 232 + 288 + 162 = 682 kcal → ok (±30)
  baseNutrition: { calories: 682, proteinGrams: 58, carbsGrams: 72, fatGrams: 18 },
  ingredients: [
    { name: 'Blanc de poulet', qty: 400, unit: 'g' },
    { name: 'Riz blanc', qty: 160, unit: 'g' },
    { name: 'Haricots noirs (boîte, égouttés)', qty: 240, unit: 'g' },
    { name: 'Maïs en boîte (égoutté)', qty: 120, unit: 'g' },
    { name: 'Avocat', qty: 120, unit: 'g' },
    { name: 'Tomate', qty: 150, unit: 'g' },
    { name: 'Oignon rouge', qty: 60, unit: 'g' },
    { name: 'Coriandre fraîche', qty: 15, unit: 'g' },
    { name: 'Citron vert', qty: 30, unit: 'ml' },
    { name: 'Cumin moulu', qty: 4, unit: 'g' },
    { name: 'Paprika fumé', qty: 3, unit: 'g' },
    { name: 'Huile d\'olive', qty: 10, unit: 'ml' },
    { name: 'Sel, poivre', qty: 1, unit: 'pincée' }
  ],
  steps: [
    'Cuire le riz blanc selon les indications. Réserver au chaud.',
    'Mélanger le cumin, le paprika fumé, le sel et le poivre. Enduire les blancs de poulet de ce mélange.',
    'Faire chauffer l\'huile dans une poêle à feu moyen-fort. Cuire le poulet 6-7 min de chaque côté jusqu\'à dorure. Laisser reposer 5 min puis émincer.',
    'Préparer le guacamole express : écraser l\'avocat avec le jus de citron vert, sel et la moitié de la coriandre.',
    'Préparer la salsa : couper la tomate et l\'oignon rouge en dés, mélanger avec le reste de coriandre et un filet de citron vert.',
    'Assembler les bowls : riz, haricots noirs, maïs, poulet émincé, guacamole et salsa. Servir aussitôt.'
  ]
},

// === R511 — TACOS DE POULET SPICY AU FOUR ===
{
  id: 'R511',
  name: 'Tacos de Poulet Spicy au Four',
  category: 'mexican',
  mealTypes: ['lunch', 'dinner'],
  emoji: '🌮',
  origin: '🇲🇽',
  tags: ['high-protein', 'quick', 'balanced'],
  servings: 2,
  prepTime: 15,
  cookTime: 20,
  difficulty: 1,
  // Vérif macros : 54×4 + 58×4 + 20×9 = 216 + 232 + 180 = 628 kcal → ok
  baseNutrition: { calories: 628, proteinGrams: 54, carbsGrams: 58, fatGrams: 20 },
  ingredients: [
    { name: 'Blanc de poulet', qty: 360, unit: 'g' },
    { name: 'Galette de blé (tortilla)', qty: 4, unit: 'pièce' },
    { name: 'Tomates', qty: 200, unit: 'g' },
    { name: 'Avocat', qty: 120, unit: 'g' },
    { name: 'Oignon rouge', qty: 60, unit: 'g' },
    { name: 'Piment rouge frais', qty: 20, unit: 'g' },
    { name: 'Coriandre fraîche', qty: 15, unit: 'g' },
    { name: 'Citron vert', qty: 30, unit: 'ml' },
    { name: 'Yaourt grec 0%', qty: 80, unit: 'g' },
    { name: 'Cumin moulu', qty: 4, unit: 'g' },
    { name: 'Paprika', qty: 3, unit: 'g' },
    { name: 'Origan séché', qty: 2, unit: 'g' },
    { name: 'Huile d\'olive', qty: 10, unit: 'ml' },
    { name: 'Sel, poivre', qty: 1, unit: 'pincée' }
  ],
  steps: [
    'Préchauffer le four à 200 °C. Mélanger le cumin, le paprika, l\'origan, le sel et un filet d\'huile. Enduire les blancs de poulet de cette marinade.',
    'Enfourner le poulet 18-20 min jusqu\'à cuisson complète. Laisser reposer puis couper en lanières.',
    'Préparer la salsa fraîche : couper tomates, oignon rouge et piment en petits dés. Ajouter la coriandre et le jus de citron vert.',
    'Écraser l\'avocat avec une pincée de sel et un filet de citron vert pour un guacamole rapide.',
    'Tiédir les galettes de blé 1 min dans une poêle sèche.',
    'Garnir chaque galette de lanières de poulet, salsa fraîche, guacamole et une cuillerée de yaourt grec. Plier et servir.'
  ]
},

// === R512 — CHILI CON CARNE LIGHT ===
{
  id: 'R512',
  name: 'Chili con Carne Light',
  category: 'mexican',
  mealTypes: ['lunch', 'dinner'],
  emoji: '🌶️',
  origin: '🇲🇽',
  tags: ['high-protein', 'meal-prep', 'balanced', 'anti-inflammatory'],
  servings: 2,
  prepTime: 10,
  cookTime: 30,
  difficulty: 1,
  // Vérif macros : 62×4 + 44×4 + 14×9 = 248 + 176 + 126 = 550 kcal → ok
  baseNutrition: { calories: 550, proteinGrams: 62, carbsGrams: 44, fatGrams: 14 },
  ingredients: [
    { name: 'Bœuf haché 5% MG', qty: 400, unit: 'g' },
    { name: 'Haricots rouges (boîte, égouttés)', qty: 240, unit: 'g' },
    { name: 'Tomates pelées en boîte', qty: 400, unit: 'g' },
    { name: 'Poivron rouge', qty: 120, unit: 'g' },
    { name: 'Oignon', qty: 80, unit: 'g' },
    { name: 'Ail', qty: 3, unit: 'gousse' },
    { name: 'Piment rouge frais', qty: 15, unit: 'g' },
    { name: 'Cumin moulu', qty: 5, unit: 'g' },
    { name: 'Paprika fumé', qty: 4, unit: 'g' },
    { name: 'Origan séché', qty: 2, unit: 'g' },
    { name: 'Huile d\'olive', qty: 8, unit: 'ml' },
    { name: 'Sel, poivre', qty: 1, unit: 'pincée' }
  ],
  steps: [
    'Émincer l\'oignon, l\'ail et le piment. Couper le poivron en dés.',
    'Faire revenir l\'oignon dans l\'huile d\'olive 3 min à feu moyen, puis ajouter l\'ail, le poivron et le piment. Faire sauter 2 min.',
    'Ajouter le bœuf haché, égrener à la spatule et saisir jusqu\'à coloration complète.',
    'Incorporer les tomates pelées, le cumin, le paprika fumé et l\'origan. Mélanger, saler, poivrer.',
    'Ajouter les haricots rouges égouttés. Porter à frémissement puis laisser mijoter 20 min à couvert.',
    'Rectifier l\'assaisonnement. Servir avec une cuillerée de yaourt grec et de la coriandre fraîche si souhaité.'
  ]
},

// === R513 — GUACAMOLE HAUTE PROTÉINE ===
{
  id: 'R513',
  name: 'Guacamole Haute Protéine',
  category: 'mexican',
  mealTypes: ['lunch', 'dinner'],
  emoji: '🥑',
  origin: '🇲🇽',
  tags: ['high-protein', 'vegetarian', 'gluten-free', 'no-cook', 'quick', 'anti-inflammatory'],
  servings: 2,
  prepTime: 10,
  cookTime: 0,
  difficulty: 1,
  // Vérif macros : 22×4 + 18×4 + 22×9 = 88 + 72 + 198 = 358 kcal → ok
  baseNutrition: { calories: 358, proteinGrams: 22, carbsGrams: 18, fatGrams: 22 },
  ingredients: [
    { name: 'Avocat mûr', qty: 250, unit: 'g' },
    { name: 'Cottage cheese (fromage blanc granuleux)', qty: 200, unit: 'g' },
    { name: 'Citron vert (jus)', qty: 30, unit: 'ml' },
    { name: 'Tomate', qty: 100, unit: 'g' },
    { name: 'Oignon rouge', qty: 40, unit: 'g' },
    { name: 'Coriandre fraîche', qty: 15, unit: 'g' },
    { name: 'Piment rouge frais', qty: 10, unit: 'g' },
    { name: 'Ail', qty: 1, unit: 'gousse' },
    { name: 'Sel, poivre', qty: 1, unit: 'pincée' }
  ],
  steps: [
    'Couper les avocats en deux, retirer le noyau et récupérer la chair dans un bol.',
    'Écraser l\'avocat à la fourchette en gardant une texture légèrement rustique.',
    'Incorporer le cottage cheese, le jus de citron vert, l\'ail pressé, le sel et le poivre. Bien mélanger.',
    'Ajouter la tomate coupée en tout petits dés, l\'oignon rouge finement haché et le piment émincé.',
    'Parsemer de coriandre fraîche ciselée. Servir immédiatement avec des galettes de blé grillées ou des crudités.'
  ]
},

// === R514 — POÊLÉE DE CREVETTES À LA MEXICAINE ===
{
  id: 'R514',
  name: 'Poêlée de Crevettes à la Mexicaine',
  category: 'mexican',
  mealTypes: ['lunch', 'dinner'],
  emoji: '🍤',
  origin: '🇲🇽',
  tags: ['high-protein', 'gluten-free', 'dairy-free', 'quick', 'low-carb', 'omega3', 'anti-inflammatory'],
  servings: 2,
  prepTime: 10,
  cookTime: 10,
  difficulty: 1,
  // Vérif macros : 48×4 + 14×4 + 16×9 = 192 + 56 + 144 = 392 kcal → ok
  baseNutrition: { calories: 392, proteinGrams: 48, carbsGrams: 14, fatGrams: 16 },
  ingredients: [
    { name: 'Crevettes décortiquées crues', qty: 500, unit: 'g' },
    { name: 'Poivron rouge', qty: 120, unit: 'g' },
    { name: 'Poivron jaune', qty: 100, unit: 'g' },
    { name: 'Ail', qty: 4, unit: 'gousse' },
    { name: 'Piment rouge frais', qty: 20, unit: 'g' },
    { name: 'Citron vert (jus)', qty: 40, unit: 'ml' },
    { name: 'Coriandre fraîche', qty: 20, unit: 'g' },
    { name: 'Cumin moulu', qty: 4, unit: 'g' },
    { name: 'Paprika fumé', qty: 3, unit: 'g' },
    { name: 'Huile d\'olive', qty: 12, unit: 'ml' },
    { name: 'Sel, poivre', qty: 1, unit: 'pincée' }
  ],
  steps: [
    'Émincer finement l\'ail et le piment. Couper les poivrons en lanières.',
    'Sécher les crevettes avec du papier absorbant. Les assaisonner de cumin, paprika, sel et poivre.',
    'Faire chauffer l\'huile dans une grande poêle à feu vif. Saisir les crevettes 1-2 min de chaque côté jusqu\'à coloration rosée. Réserver.',
    'Dans la même poêle, faire revenir les poivrons 4-5 min à feu moyen. Ajouter l\'ail et le piment, cuire 1 min.',
    'Remettre les crevettes dans la poêle. Verser le jus de citron vert, bien mélanger et cuire 30 secondes.',
    'Parsemer de coriandre fraîche ciselée. Servir avec du riz ou des galettes de blé tièdes.'
  ]
},

// === R515 — ENCHILADAS DE POULET LÉGÈRES ===
{
  id: 'R515',
  name: 'Enchiladas de Poulet Légères',
  category: 'mexican',
  mealTypes: ['lunch', 'dinner'],
  emoji: '🫔',
  origin: '🇲🇽',
  tags: ['high-protein', 'meal-prep', 'balanced'],
  servings: 2,
  prepTime: 20,
  cookTime: 25,
  difficulty: 2,
  // Vérif macros : 62×4 + 52×4 + 18×9 = 248 + 208 + 162 = 618 kcal → ok
  baseNutrition: { calories: 618, proteinGrams: 62, carbsGrams: 52, fatGrams: 18 },
  ingredients: [
    { name: 'Blanc de poulet', qty: 380, unit: 'g' },
    { name: 'Galette de blé (tortilla)', qty: 4, unit: 'pièce' },
    { name: 'Tomates pelées en boîte', qty: 400, unit: 'g' },
    { name: 'Oignon', qty: 80, unit: 'g' },
    { name: 'Ail', qty: 2, unit: 'gousse' },
    { name: 'Poivron rouge', qty: 100, unit: 'g' },
    { name: 'Mozzarella râpée', qty: 60, unit: 'g' },
    { name: 'Yaourt grec 0%', qty: 80, unit: 'g' },
    { name: 'Cumin moulu', qty: 4, unit: 'g' },
    { name: 'Paprika fumé', qty: 3, unit: 'g' },
    { name: 'Piment rouge frais', qty: 15, unit: 'g' },
    { name: 'Coriandre fraîche', qty: 15, unit: 'g' },
    { name: 'Huile d\'olive', qty: 10, unit: 'ml' },
    { name: 'Sel, poivre', qty: 1, unit: 'pincée' }
  ],
  steps: [
    'Préchauffer le four à 190 °C. Pocher les blancs de poulet dans de l\'eau bouillante salée 15 min. Égoutter et effilocher à la fourchette.',
    'Préparer la sauce enchilada : faire revenir l\'oignon et l\'ail dans l\'huile 3 min. Ajouter les tomates, le cumin, le paprika, le piment, saler et mijoter 10 min. Mixer légèrement.',
    'Mélanger le poulet effiloché avec la moitié de la sauce et la coriandre ciselée.',
    'Garnir chaque galette de blé de farce poulet, rouler serré et disposer dans un plat à gratin huilé.',
    'Napper avec le reste de sauce, parsemer de mozzarella. Enfourner 15-18 min jusqu\'à gratinage.',
    'Servir avec une cuillerée de yaourt grec à la place de la crème acide.'
  ]
},

// === R516 — SOUPE TORTILLA PROTÉINÉE ===
{
  id: 'R516',
  name: 'Soupe Tortilla Protéinée',
  category: 'mexican',
  mealTypes: ['lunch', 'dinner'],
  emoji: '🍲',
  origin: '🇲🇽',
  tags: ['high-protein', 'meal-prep', 'balanced', 'anti-inflammatory'],
  servings: 2,
  prepTime: 10,
  cookTime: 25,
  difficulty: 1,
  // Vérif macros : 52×4 + 46×4 + 12×9 = 208 + 184 + 108 = 500 kcal → ok
  baseNutrition: { calories: 500, proteinGrams: 52, carbsGrams: 46, fatGrams: 12 },
  ingredients: [
    { name: 'Blanc de poulet', qty: 320, unit: 'g' },
    { name: 'Bouillon de poulet (faible sel)', qty: 800, unit: 'ml' },
    { name: 'Haricots noirs (boîte, égouttés)', qty: 160, unit: 'g' },
    { name: 'Maïs en boîte (égoutté)', qty: 100, unit: 'g' },
    { name: 'Tomates pelées en boîte', qty: 200, unit: 'g' },
    { name: 'Galette de blé (tortilla)', qty: 2, unit: 'pièce' },
    { name: 'Oignon', qty: 60, unit: 'g' },
    { name: 'Ail', qty: 2, unit: 'gousse' },
    { name: 'Piment rouge frais', qty: 15, unit: 'g' },
    { name: 'Cumin moulu', qty: 4, unit: 'g' },
    { name: 'Paprika', qty: 3, unit: 'g' },
    { name: 'Citron vert (jus)', qty: 20, unit: 'ml' },
    { name: 'Coriandre fraîche', qty: 15, unit: 'g' },
    { name: 'Huile d\'olive', qty: 8, unit: 'ml' },
    { name: 'Sel, poivre', qty: 1, unit: 'pincée' }
  ],
  steps: [
    'Préchauffer le four à 200 °C. Couper les galettes de blé en lanières fines. Disposer sur une plaque, arroser d\'un filet d\'huile et enfourner 8-10 min jusqu\'à dorure croustillante.',
    'Faire revenir l\'oignon, l\'ail et le piment dans le reste d\'huile 3 min.',
    'Ajouter les tomates, le cumin, le paprika. Cuire 5 min, puis verser le bouillon de poulet. Porter à ébullition.',
    'Ajouter les blancs de poulet entiers. Cuire 15 min à frémissement. Retirer le poulet, effilocher, puis remettre dans la soupe.',
    'Incorporer les haricots noirs et le maïs. Laisser mijoter 5 min. Ajuster l\'assaisonnement et ajouter le jus de citron vert.',
    'Servir en bols avec les lanières de galette croustillantes et la coriandre fraîche.'
  ]
},

// === R517 — SALADE MEXICAINE DE QUINOA ===
{
  id: 'R517',
  name: 'Salade Mexicaine de Quinoa',
  category: 'mexican',
  mealTypes: ['lunch', 'dinner'],
  emoji: '🥗',
  origin: '🇲🇽',
  tags: ['vegetarian', 'gluten-free', 'dairy-free', 'meal-prep', 'balanced', 'anti-inflammatory', 'high-protein'],
  servings: 2,
  prepTime: 15,
  cookTime: 15,
  difficulty: 1,
  // Vérif macros : 26×4 + 72×4 + 18×9 = 104 + 288 + 162 = 554 kcal → ok
  baseNutrition: { calories: 554, proteinGrams: 26, carbsGrams: 72, fatGrams: 18 },
  ingredients: [
    { name: 'Quinoa (cru)', qty: 180, unit: 'g' },
    { name: 'Haricots noirs (boîte, égouttés)', qty: 160, unit: 'g' },
    { name: 'Maïs en boîte (égoutté)', qty: 120, unit: 'g' },
    { name: 'Avocat', qty: 120, unit: 'g' },
    { name: 'Tomates cerises', qty: 150, unit: 'g' },
    { name: 'Poivron rouge', qty: 100, unit: 'g' },
    { name: 'Oignon rouge', qty: 50, unit: 'g' },
    { name: 'Coriandre fraîche', qty: 20, unit: 'g' },
    { name: 'Citron vert (jus)', qty: 40, unit: 'ml' },
    { name: 'Huile d\'olive', qty: 15, unit: 'ml' },
    { name: 'Cumin moulu', qty: 3, unit: 'g' },
    { name: 'Sel, poivre', qty: 1, unit: 'pincée' }
  ],
  steps: [
    'Rincer le quinoa à l\'eau froide. Cuire dans 360 ml d\'eau bouillante salée 12-14 min à couvert jusqu\'à absorption. Laisser refroidir.',
    'Préparer la vinaigrette : mélanger le jus de citron vert, l\'huile d\'olive, le cumin, le sel et le poivre.',
    'Couper les tomates cerises en deux, le poivron en dés, l\'avocat en cubes et l\'oignon rouge en fines rondelles.',
    'Dans un grand saladier, mélanger le quinoa refroidi, les haricots noirs, le maïs, les légumes et l\'avocat.',
    'Arroser de vinaigrette et parsemer de coriandre fraîche ciselée. Bien mélanger délicatement.',
    'Laisser reposer 5 min avant de servir pour que les saveurs se mêlent. Se conserve 24 h au réfrigérateur.'
  ]
},

// === R518 — BOWL CHOU-FLEUR RÔTI FAÇON TACOS ===
{
  id: 'R518',
  name: 'Bowl Chou-fleur Rôti Façon Tacos',
  category: 'mexican',
  mealTypes: ['lunch', 'dinner'],
  emoji: '🥦',
  origin: '🇲🇽',
  tags: ['vegetarian', 'gluten-free', 'balanced', 'anti-inflammatory', 'low-carb'],
  servings: 2,
  prepTime: 15,
  cookTime: 25,
  difficulty: 2,
  // Vérif macros : 22×4 + 38×4 + 20×9 = 88 + 152 + 180 = 420 kcal → ok
  baseNutrition: { calories: 420, proteinGrams: 22, carbsGrams: 38, fatGrams: 20 },
  ingredients: [
    { name: 'Chou-fleur', qty: 600, unit: 'g' },
    { name: 'Haricots noirs (boîte, égouttés)', qty: 160, unit: 'g' },
    { name: 'Yaourt grec 0%', qty: 160, unit: 'g' },
    { name: 'Avocat', qty: 120, unit: 'g' },
    { name: 'Maïs en boîte (égoutté)', qty: 80, unit: 'g' },
    { name: 'Tomate', qty: 120, unit: 'g' },
    { name: 'Oignon rouge', qty: 50, unit: 'g' },
    { name: 'Coriandre fraîche', qty: 20, unit: 'g' },
    { name: 'Citron vert (jus)', qty: 30, unit: 'ml' },
    { name: 'Cumin moulu', qty: 5, unit: 'g' },
    { name: 'Paprika fumé', qty: 4, unit: 'g' },
    { name: 'Piment rouge frais', qty: 15, unit: 'g' },
    { name: 'Huile d\'olive', qty: 15, unit: 'ml' },
    { name: 'Sel, poivre', qty: 1, unit: 'pincée' }
  ],
  steps: [
    'Préchauffer le four à 220 °C. Détailler le chou-fleur en petits fleurons. Mélanger avec l\'huile, le cumin, le paprika, le sel et le poivre.',
    'Étaler les fleurons en une seule couche sur une plaque. Rôtir 22-25 min en retournant à mi-cuisson, jusqu\'à belle coloration dorée.',
    'Préparer la sauce : mélanger le yaourt grec avec un filet de jus de citron vert, une pincée de cumin et de sel.',
    'Préparer la salsa : couper la tomate et l\'oignon rouge en dés, mélanger avec le piment haché, la coriandre et le jus de citron vert restant.',
    'Écraser légèrement l\'avocat avec sel et citron pour un guacamole express.',
    'Assembler les bowls : chou-fleur rôti, haricots noirs, maïs, guacamole, salsa. Napper de sauce au yaourt et garnir de coriandre.'
  ]
},

// === R519 — CEVICHE DE THON À LA MEXICAINE ===
{
  id: 'R519',
  name: 'Ceviche de Thon à la Mexicaine',
  category: 'mexican',
  mealTypes: ['lunch', 'dinner'],
  emoji: '🐟',
  origin: '🇲🇽',
  tags: ['high-protein', 'gluten-free', 'dairy-free', 'no-cook', 'quick', 'low-carb', 'omega3', 'anti-inflammatory'],
  servings: 2,
  prepTime: 15,
  cookTime: 0,
  difficulty: 1,
  // Vérif macros : 46×4 + 16×4 + 18×9 = 184 + 64 + 162 = 410 kcal → ok
  baseNutrition: { calories: 410, proteinGrams: 46, carbsGrams: 16, fatGrams: 18 },
  ingredients: [
    { name: 'Thon en conserve au naturel (égoutté)', qty: 320, unit: 'g' },
    { name: 'Avocat mûr', qty: 160, unit: 'g' },
    { name: 'Tomates', qty: 150, unit: 'g' },
    { name: 'Concombre', qty: 120, unit: 'g' },
    { name: 'Oignon rouge', qty: 60, unit: 'g' },
    { name: 'Piment rouge frais', qty: 20, unit: 'g' },
    { name: 'Coriandre fraîche', qty: 20, unit: 'g' },
    { name: 'Citron vert (jus)', qty: 60, unit: 'ml' },
    { name: 'Citron jaune (jus)', qty: 20, unit: 'ml' },
    { name: 'Huile d\'olive', qty: 12, unit: 'ml' },
    { name: 'Sel, poivre', qty: 1, unit: 'pincée' }
  ],
  steps: [
    'Égoutter soigneusement le thon. L\'émietter grossièrement dans un saladier.',
    'Couper les tomates, le concombre et l\'oignon rouge en petits dés réguliers. Émincer finement le piment.',
    'Couper l\'avocat en cubes de taille moyenne. Réserver séparément pour éviter l\'oxydation.',
    'Mélanger le thon, les légumes (sauf l\'avocat) avec le jus de citron vert, le jus de citron jaune et l\'huile d\'olive. Assaisonner de sel et poivre.',
    'Laisser mariner 5-10 min au frais pour que les saveurs se développent.',
    'Incorporer délicatement l\'avocat et la coriandre fraîche. Servir frais, accompagné de galettes de blé grillées ou de feuilles de laitue.'
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
                'chapelure', 'sauce soja',
                'couscous', 'seitan', 'épeautre', 'epeautre', 'kamut',
                'avoine', 'tortilla', 'wrap ', 'naan']
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
    var split = (typeof window.getMealSplit === 'function') ? window.getMealSplit() : null;
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

    // ── Halal exclusions (porc + alcool) ──
    // Synchronisé avec app-core.js filtreHalal pour cohérence double-filtre végétarien+halal
    var HALAL_EXCLUSIONS = ['porc', 'cochon', 'lard', 'bacon', 'jambon porc', 'saucisson',
                            'pepperoni', 'chorizo', 'pancetta', 'gélatine de porc',
                            'alcool', 'vin blanc', 'vin rouge', 'bière', 'rhum',
                            'cognac', 'whisky', 'vodka', 'porto', 'amaretto', 'mirin'];
    var halalExclusions = [];
    if (filters.halal) {
      halalExclusions = HALAL_EXCLUSIONS;
    }

    // ── Combine all ingredient exclusions ──
    var allExclusions = allergyExclusions.concat(intoleranceExclusions).concat(halalExclusions);

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

    // ── Appliquer filtre halal si S.halal = true (cohérence avec app-core.js filterRecipes) ──
    var s = window.S;
    if (s && s.halal) {
      var HALAL_BAN = /porc(?!ini)|cochon|lard|bacon|jambon(?! de dinde)|saucisson|pepperoni|chorizo|pancetta|g\u00e9latine de porc|alcool|vin blanc|vin rouge|bi[e\u00e8]re|rhum|cognac|whisky|vodka|porto|amaretto|mirin/;
      pool = pool.filter(function(r) {
        var ingText = ((r.i || '') + ' ' + (r.tags || []).join(' ')).toLowerCase();
        return !HALAL_BAN.test(ingText);
      });
    }

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
        } else if (recipe._smoothie && recipe.ingredients && recipe.ingredients.length) {
          // Smoothie whey — ingrédients déjà présents dans l'objet weekPlan (format {name,qty,unit})
          var smoothieCost = 0;
          recipe.ingredients.forEach(function(ing) {
            var price = window.getPricePer ? window.getPricePer(ing.name, ing.unit) : null;
            if (price !== null && price > 0) {
              smoothieCost += price * (ing.qty || 0);
            }
          });
          if (smoothieCost > 0) {
            mealEntry.costMAD = Math.round(smoothieCost * 100) / 100;
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
          } else if (!cost && recipe.ingredients && recipe.ingredients.length && window.getPricePer) {
            // Recette non trouvée dans RECIPES_DB mais ingrédients disponibles dans l'objet
            var fallbackCost = 0;
            recipe.ingredients.forEach(function(ing) {
              var price = window.getPricePer(ing.name, ing.unit);
              if (price !== null && price > 0) {
                fallbackCost += price * (ing.qty || 0);
              }
            });
            if (fallbackCost > 0) {
              mealEntry.costMAD = Math.round(fallbackCost * 100) / 100;
              mealEntry.scaled  = true;
              dayMAD += mealEntry.costMAD;
              pricedMeals++;
            }
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
