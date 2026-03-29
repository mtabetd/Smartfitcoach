// Audit & Améliorations Pierre Hermé — Smoothies Protéinés Vanille
// SmartFitCoach — 11 recettes sm_van_01 à sm_van_11
// Règles respectées : id, name, flavors, goal, timing, cal, p, c, f inchangés
// Steps : 2-4 étapes max | Tips : court, percutant, 1-2 phrases

var IMPROVEMENTS_VAN = {

  // ─── sm_van_01 : Vanilla Cream Gainer ───────────────────────────────────────
  // Contexte : post-workout muscle, 500kcal, 38p/65c/10f
  // Ingrédients : whey vanille 35g, lait entier 250ml, flocons avoine 50g, miel 15g, extrait vanille 2ml
  'sm_van_01': {
    steps: [
      'Tremper les flocons d\'avoine 2 minutes dans le lait tiède — ils gonflent et libèrent leur amidon pour une texture veloutée.',
      'Verser la préparation dans le blender, ajouter la whey, le miel et l\'extrait de vanille.',
      'Mixer 40 secondes à vitesse maximale jusqu\'à obtenir une consistance lisse et nappante.',
      'Déguster immédiatement dans un verre refroidi au congélateur 5 minutes.'
    ],
    tips: 'Le trempage court des flocons est le secret d\'une texture crémeuse sans grains — la vanille s\'exprime mieux dans une base légèrement tiède avant d\'être émulsionnée.'
  },

  // ─── sm_van_02 : Vanilla Latte Matin ────────────────────────────────────────
  // Contexte : pre-workout performance/fat_loss, 310kcal, 33p/30c/7f
  // Ingrédients : whey vanille 30g, café expresso froid 60ml, lait d\'amande 200ml, glaçons 80g, cannelle 1g
  'sm_van_02': {
    steps: [
      'Préparer l\'expresso la veille et le réfrigérer — un café froid révèle des notes de caramel absent du café chaud.',
      'Verser le lait d\'amande, le café froid et les glaçons dans le blender, mixer 20 secondes.',
      'Ajouter la whey et mixer 15 secondes — pas davantage pour ne pas oxyder les arômes.',
      'Servir dans un verre givre, saupoudrer la cannelle d\'un geste circulaire au dernier moment.'
    ],
    tips: 'La cannelle posée en surface, jamais mixée, libère ses huiles essentielles au contact des lèvres — le parfum précède le goût et annonce la vanille.'
  },

  // ─── sm_van_03 : Vanilla Banana Overnight ───────────────────────────────────
  // Contexte : anytime muscle/recovery, 440kcal, 36p/55c/8f
  // Ingrédients : whey vanille 30g, lait écrémé 200ml, banane 120g, flocons avoine 40g, graines de chia 10g
  'sm_van_03': {
    steps: [
      'Mixer le lait avec la banane et la whey vanille 30 secondes — la banane très mûre donne un fil de caramel naturel.',
      'Verser dans un récipient hermétique, incorporer les flocons et les graines de chia en remuant doucement.',
      'Réfrigérer au moins 2 heures — la nuit idéalement — pour que le chia gélifie et que les saveurs se fondent.'
    ],
    tips: 'Choisissez une banane dont la peau montre des taches noires : c\'est là que les sucres simples se convertissent en esters fruités qui amplifient la vanille.'
  },

  // ─── sm_van_04 : Vanille Caramel Salé ───────────────────────────────────────
  // Contexte : anytime muscle/recovery, 400kcal, 35p/48c/7f
  // Ingrédients : whey vanille 30g, lait entier 200ml, miel 15g, flocons avoine 30g, sel 1g
  'sm_van_04': {
    steps: [
      'Tiédir le lait entier à 40 °C — jamais plus — et y dissoudre le miel avec le sel en fouettant : la fleur de sel catalyse les notes de caramel du miel.',
      'Verser dans le blender avec les flocons, mixer 20 secondes, ajouter la whey vanille.',
      'Mixer 15 secondes supplémentaires à vitesse modérée pour préserver la mousse crémeuse.'
    ],
    tips: 'Une pincée de fleur de sel sur le dessus au service, pas dans le blender : elle doit craqueler sous la langue et laisser éclater le caramel vanillé en bouche.'
  },

  // ─── sm_van_05 : Tropical Sunrise ───────────────────────────────────────────
  // Contexte : post-workout performance, 258kcal, 25p/35c/2f
  // Ingrédients : whey vanille 30g, mangue 150g, eau de coco 200ml, glaçons 80g
  'sm_van_05': {
    steps: [
      'Utiliser de la mangue Alphonso congelée — sa chair fibreuse et ses notes de fleur d\'oranger magnifient la vanille mieux que toute autre variété.',
      'Mixer l\'eau de coco avec la mangue et les glaçons 45 secondes à pleine puissance pour une émulsion dense.',
      'Ajouter la whey vanille, mixer 10 secondes seulement — la protéine ne doit pas se réchauffer ni mousser excessivement.'
    ],
    tips: 'La mangue congelée remplace les glaçons et intensifie le fructose naturel : la vanille y trouve un contrepoint tropical qui la rend lumineuse.'
  },

  // ─── sm_van_06 : Zen Matcha Latte ───────────────────────────────────────────
  // Contexte : pre-workout fat_loss, 250kcal, 40p/18c/2f
  // Ingrédients : whey vanille 30g, yaourt grec 0% 150g, matcha 5g, miel 10g, eau 100ml
  'sm_van_06': {
    steps: [
      'Tamiser le matcha dans l\'eau à 70 °C (jamais bouillante) et fouetter en zigzag jusqu\'à mousse verte homogène — la méthode chasen japonaise.',
      'Laisser tiédir 5 minutes, puis mixer avec le yaourt grec et le miel.',
      'Incorporer la whey vanille et mixer 20 secondes à basse vitesse pour ne pas dénaturer les catéchines du matcha.'
    ],
    tips: 'Vanille et matcha partagent les mêmes notes vertes et lactées — l\'un sublimant l\'amer de l\'autre : ensemble, ils créent une harmonie absolue, jamais une compétition.'
  },

  // ─── sm_van_07 : Fraise Velvet ───────────────────────────────────────────────
  // Contexte : anytime recovery, 269kcal, 32p/24c/5f
  // Ingrédients : whey vanille 30g, fraises congelées 150g, lait demi-écrémé 200ml, extrait vanille 3ml
  'sm_van_07': {
    steps: [
      'Verser le lait et l\'extrait de vanille dans le blender, ajouter les fraises congelées directement — le choc thermique crée une mousse naturelle.',
      'Mixer 45 secondes à puissance maximale pour une texture "velvet" : lisse, dense, sans fibres apparentes.',
      'Ajouter la whey vanille, pulser 3 fois brièvement pour l\'incorporer sans détruire la mousse.'
    ],
    tips: 'L\'extrait de vanille pure amplifie les aldéhydes naturels des fraises congelées — choisissez un extrait bourbon Madagascar pour cet effet de confiture chaude servie froide.'
  },

  // ─── sm_van_08 : Espresso Power ─────────────────────────────────────────────
  // Contexte : pre-workout performance, 333kcal, 31p/32c/9f
  // Ingrédients : whey vanille 30g, lait entier 200ml, café expresso froid 100ml, banane 80g
  'sm_van_08': {
    steps: [
      'Préparer un double ristretto (pas un expresso allongé) et le refroidir au réfrigérateur — la concentration maximise les notes de cacao qui dialoguent avec la vanille.',
      'Verser lait entier, café froid et banane dans le blender, mixer 30 secondes.',
      'Ajouter la whey vanille et shaker énergiquement 20 secondes — ne pas blender pour conserver la texture fluide du latte.'
    ],
    tips: 'Le ristretto froid + banane mûre crée un profil aromatique de banane flambée : la vanille agit comme un pont entre l\'amertume du café et la douceur du fruit.'
  },

  // ─── sm_van_09 : Blueberry Storm ─────────────────────────────────────────────
  // Contexte : post-workout recovery, 287kcal, 39p/26c/3f
  // Ingrédients : whey vanille 30g, myrtilles congelées 120g, yaourt grec 0% 100g, lait demi-écrémé 100ml
  'sm_van_09': {
    steps: [
      'Mixer les myrtilles congelées avec le lait à pleine puissance 45 secondes — le violet profond indique que les anthocyanes sont libérées.',
      'Ajouter le yaourt grec, mixer 20 secondes pour une texture dense et crémeuse.',
      'Incorporer la whey vanille en pulsant 5 fois : la vanille s\'intègre sans se dissoudre uniformément, créant des stries aromatiques.'
    ],
    tips: 'La vanille bourbon avec ses notes de fève tonka joue un rôle révélateur sur les myrtilles : elle atténue leur acidité et fait émerger leur côté confiture sauvage.'
  },

  // ─── sm_van_10 : Coco Paradise ───────────────────────────────────────────────
  // Contexte : anytime muscle, 354kcal, 38p/37c/6f
  // Ingrédients : whey vanille 30g, fromage blanc 0% 100g, banane 100g, eau de coco 150ml, lait de coco 60ml
  'sm_van_10': {
    steps: [
      'Mixer l\'eau de coco avec le lait de coco et la banane 30 secondes — cette base tropicale est l\'écrin parfait pour la vanille.',
      'Ajouter le fromage blanc et mixer 20 secondes pour une émulsion dense et stable.',
      'Incorporer la whey vanille, mixer 15 secondes à basse vitesse pour préserver les arômes délicats de la noix de coco.'
    ],
    tips: 'Le lait de coco apporte les triglycérides à chaîne moyenne qui transportent les molécules aromatiques de la vanille — la saveur s\'installe plus longtemps en bouche.'
  },

  // ─── sm_van_11 : Vanille Absolue ─────────────────────────────────────────────
  // Contexte : anytime muscle, 512kcal, 39p/44c/20f
  // Ingrédients : whey vanille 30g, lait entier 300ml, beurre de cacahuète 15g, banane 100g
  'sm_van_11': {
    steps: [
      'Congeler la banane en rondelles la veille — elle devient crémeuse comme de la glace et concentre ses sucres naturels.',
      'Mixer lait entier, beurre de cacahuète et banane congelée 1 minute à pleine puissance jusqu\'à texture parfaitement lisse.',
      'Ajouter la whey vanille, pulser 5 secondes seulement — la vanille doit rester en suspension, perceptible à chaque gorgée.'
    ],
    tips: 'C\'est le smoothie de la vanille dans toute sa majesté : la cacahuète en apporte les notes grillées, la banane le velouté, et la whey vanille bourbon les conclut sur un accord lacté et floral inimitable.'
  }

};
