/**
 * Améliorations pâtissières des smoothies protéinés au chocolat — SmartFitCoach
 * Audit et élévation gustative par Pierre Hermé
 *
 * Philosophie : un smoothie protéiné n'est pas une punition.
 * Chaque geste, chaque ordre d'assemblage, chaque pincée compte.
 */

var IMPROVEMENTS_CHOCO = {

  // ─────────────────────────────────────────────────────────────────
  // sm_choco_01 · Chocolat Noir Énergie
  // Whey chocolat | Lait écrémé | Banane congelée | Cacao pur | Beurre d'amande
  // ─────────────────────────────────────────────────────────────────
  'sm_choco_01': {
    steps: [
      'Verser le lait écrémé en premier, puis le beurre d\'amande — cela évite qu\'il colle aux parois.',
      'Ajouter la banane congelée coupée en tronçons, puis tamiser le cacao pur directement sur les autres ingrédients.',
      'Incorporer la whey en dernier, mixer 50 secondes à puissance maximale jusqu\'à consistance veloutée.',
      'Ajouter 1 pincée de fleur de sel avant de servir — elle réveille les notes torréfiées du cacao.'
    ],
    tips: 'Le beurre d\'amande mixé froid avec la banane congelée crée une émulsion naturelle : plus de mousse, moins d\'air, une texture digne d\'une ganache fluide.'
  },

  // ─────────────────────────────────────────────────────────────────
  // sm_choco_02 · Brownie Shake Récupération
  // Whey chocolat | Lait entier | Flocons d'avoine | Cacao pur | Datte Medjool
  // ─────────────────────────────────────────────────────────────────
  'sm_choco_02': {
    steps: [
      'Dénoyauter les dattes et les mixer 20 secondes avec le lait entier chaud (60 °C) — la chaleur liquéfie leur sucre et fond l\'amidon des flocons.',
      'Laisser tiédir 2 minutes, puis ajouter flocons d\'avoine, cacao tamisé et whey chocolat.',
      'Mixer 60 secondes à puissance max pour obtenir une texture onctueuse rappelant la pâte à brownie cuite.',
      'Boire à température ambiante ou légèrement tiède — la chaleur double la perception des arômes de cacao.'
    ],
    tips: 'Une datte Medjool fondue dans du lait chaud se comporte comme un caramel naturel : elle lie, sucre et apporte une profondeur vanillée que le sucre blanc ne peut pas imiter.'
  },

  // ─────────────────────────────────────────────────────────────────
  // sm_choco_03 · Chocolat Menthe Explosif
  // Whey chocolat | Eau froide | Épinards frais | Menthe fraîche | Glaçons
  // ─────────────────────────────────────────────────────────────────
  'sm_choco_03': {
    steps: [
      'Mixer l\'eau glacée avec les épinards frais 20 secondes — la base verte doit être parfaitement lisse avant d\'introduire la menthe.',
      'Frotter les feuilles de menthe entre les paumes pour libérer les huiles essentielles, puis les ajouter avec les glaçons.',
      'Incorporer la whey en dernier, mixer 30 secondes supplémentaires à vitesse maximale, servir aussitôt dans un verre préalablement réfrigéré.'
    ],
    tips: 'Froisser la menthe à la main juste avant de mixer libère 30 % d\'arôme supplémentaire. C\'est le même geste qu\'on utilise pour un mojito — et le résultat est tout aussi saisissant.'
  },

  // ─────────────────────────────────────────────────────────────────
  // sm_choco_04 · Choco Framboise Express
  // Whey chocolat | Fraises congelées | Lait écrémé | Miel | Glaçons
  // ─────────────────────────────────────────────────────────────────
  'sm_choco_04': {
    steps: [
      'Verser le lait écrémé froid dans le blender, ajouter le miel et mixer 5 secondes pour l\'incorporer.',
      'Ajouter les fraises congelées directement (elles jouent le rôle des glaçons), puis la whey.',
      'Mixer 45 secondes à pleine puissance — les fraises encore partiellement gelées créent une texture granita-mousse inimitable.',
      'Ajouter quelques gouttes de jus de citron au service pour rehausser la vivacité fruitée sans modifier les macros.'
    ],
    tips: 'L\'acidité naturelle de la fraise tranche le chocolat avec la même élégance qu\'une framboise dans un entremets : elle allège, elle contraste, elle surprend.'
  },

  // ─────────────────────────────────────────────────────────────────
  // sm_choco_05 · Forêt Noire Express
  // Whey chocolat | Fraises congelées | Yaourt grec 0% | Eau
  // ─────────────────────────────────────────────────────────────────
  'sm_choco_05': {
    steps: [
      'Placer le yaourt grec au congélateur 15 minutes avant — légèrement pris, il donnera une texture quasi-glacée incomparable.',
      'Verser l\'eau dans le blender, ajouter les fraises congelées puis le yaourt froid.',
      'Incorporer la whey chocolat en dernier, mixer 40 secondes — la consistance doit évoquer un sorbet mousseux.'
    ],
    tips: 'Le yaourt grec légèrement congelé remplace avantageusement la crème dans une Forêt Noire : même onctuosité, acidité lactique en bonus, zéro culpabilité.'
  },

  // ─────────────────────────────────────────────────────────────────
  // sm_choco_06 · Avocat Noir
  // Whey chocolat | Avocat | Lait entier | Cacao pur
  // ─────────────────────────────────────────────────────────────────
  'sm_choco_06': {
    steps: [
      'Utiliser un avocat à température ambiante (jamais réfrigéré) — ses graisses s\'émulsionnent deux fois mieux à 20 °C qu\'à 4 °C.',
      'Mixer l\'avocat avec le lait entier 20 secondes seuls pour créer une crème de base parfaitement lisse.',
      'Tamiser le cacao pur et ajouter la whey, mixer 60 secondes supplémentaires à haute vitesse.',
      'Ajouter 1 pincée de piment d\'Espelette au service — elle amplifie les notes amères du cacao sans apporter de chaleur perceptible.'
    ],
    tips: 'L\'avocat est le beurre de cacao du monde végétal : même onctuosité, mêmes acides gras mono-insaturés. Avec du cacao pur, vous obtenez un smoothie dont la texture rappelle une ganache — luxueux, et pourtant sain.'
  },

  // ─────────────────────────────────────────────────────────────────
  // sm_choco_07 · Jaffa Power
  // Whey chocolat | Jus d'orange | Banane | Eau
  // ─────────────────────────────────────────────────────────────────
  'sm_choco_07': {
    steps: [
      'Utiliser le jus d\'une orange pressée à la main plutôt qu\'un jus industriel — les huiles essentielles du zeste restent dans la pulpe pressée manuellement.',
      'Verser l\'eau, puis le jus d\'orange dans le blender, ajouter la banane coupée.',
      'Incorporer la whey en dernier, mixer 45 secondes. Râper légèrement le zeste d\'une demi-orange sur le dessus avant de servir.'
    ],
    tips: 'Le zeste d\'orange, même en quantité infinitésimale, contient dix fois plus d\'arôme que le jus. C\'est le secret des chocolatiers pour les ganaches à l\'orange : ce n\'est pas le sucre acide qui parle, c\'est l\'huile essentielle.'
  },

  // ─────────────────────────────────────────────────────────────────
  // sm_choco_08 · After Eight Recovery
  // Whey chocolat | Fromage blanc 0% | Menthe fraîche | Glaçons | Eau
  // ─────────────────────────────────────────────────────────────────
  'sm_choco_08': {
    steps: [
      'Blanchir les feuilles de menthe 10 secondes dans l\'eau bouillante, puis plonger immédiatement dans l\'eau glacée — la chlorophylle se fixe et la couleur reste vert vif.',
      'Mixer menthe blanchie + eau froide + fromage blanc 30 secondes pour obtenir une base crème verte.',
      'Ajouter la whey et les glaçons, mixer 60 secondes à puissance maximale jusqu\'à texture mousseuse et aérée.'
    ],
    tips: 'La technique de blanchiment de la menthe, empruntée à la cuisine fine, fixe les arômes volatils et donne une couleur émeraude spectaculaire — l\'After Eight devient une expérience visuelle avant même d\'être gustative.'
  },

  // ─────────────────────────────────────────────────────────────────
  // sm_choco_09 · Dark Espresso Boost
  // Whey chocolat | Café expresso froid | Lait demi-écrémé | Banane
  // ─────────────────────────────────────────────────────────────────
  'sm_choco_09': {
    steps: [
      'Préparer le double expresso et le verser sur 2-3 glaçons — le choc thermique rapide préserve les arômes volatils du café et évite l\'oxydation.',
      'Verser lait froid + café glacé dans le blender, ajouter la banane coupée (idéalement congelée la veille).',
      'Incorporer la whey en dernier, mixer 50 secondes — la banane congelée crée une émulsion naturelle avec le café pour une texture de cold brew latte épais.'
    ],
    tips: 'Refroidir un expresso en choc thermique plutôt qu\'en le laissant reposer préserve ses arômes floraux et évite l\'amertume : le même principe que pour un café japonais iced — la technique fait toute la différence.'
  },

  // ─────────────────────────────────────────────────────────────────
  // sm_choco_10 · Bounty Shake
  // Whey chocolat | Lait de coco | Eau de coco | Banane
  // ─────────────────────────────────────────────────────────────────
  'sm_choco_10': {
    steps: [
      'Congeler la banane en morceaux au moins 2 heures à l\'avance — elle deviendra le "cœur" crémeux du Bounty.',
      'Verser l\'eau de coco puis le lait de coco dans le blender, ajouter la banane congelée.',
      'Incorporer la whey en dernier, mixer 45 secondes. Servir dans un verre froid, éventuellement avec quelques copeaux de noix de coco grillée sur le dessus (0 impact macro).'
    ],
    tips: 'Faire griller 30 secondes à sec quelques flocons de noix de coco avant de les poser sur le smoothie libère les aldéhydes de noix de coco — un arôme dix fois plus puissant que cru, pour un effet Bounty absolument saisissant.'
  },

  // ─────────────────────────────────────────────────────────────────
  // sm_choco_11 · Brownie Batter
  // Whey chocolat | Beurre de cacahuète | Lait entier | Miel
  // ─────────────────────────────────────────────────────────────────
  'sm_choco_11': {
    steps: [
      'Tiédir légèrement le lait entier (40 °C, jamais plus) — la chaleur douce fluidifie le beurre de cacahuète et favorise son émulsion homogène.',
      'Verser le lait tiède dans le shaker, ajouter le beurre de cacahuète et le miel, agiter 20 secondes.',
      'Incorporer la whey, ajouter 1 pincée généreuse de fleur de sel, shaker vigoureusement 60 secondes jusqu\'à texture crémeuse et légèrement mousseuse.'
    ],
    tips: 'La fleur de sel sur le chocolat-cacahuète n\'est pas un accessoire : c\'est le même principe que le macaron chocolat-caramel salé — le sel supprime l\'amertume, amplifie le sucré, et crée cette tension gustative qui rend le brownie inoubliable.'
  }

};
