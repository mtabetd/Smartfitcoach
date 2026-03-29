/**
 * AUDIT BOCUSE — Recettes R291 à R300
 * Révision technique : Paul Bocuse, 3 étoiles Michelin
 * Date : 2026-03-29
 *
 * Règles respectées :
 *  - healthy, ingrédients disponibles au Maroc
 *  - macros identiques (± 50 kcal)
 *  - IDs, noms, tags, category inchangés
 *  - Max 6 étapes par recette
 */

var IMPROVEMENTS_R291_R300 = {

  // ─────────────────────────────────────────────────────────────
  // R291 — Soupe Épinards Pois Chiches
  // Objectif : rôtir le cumin à sec pour libérer ses arômes,
  //            puis écraser grossièrement quelques pois chiches
  //            pour donner du corps sans ajouter de matière grasse.
  // ─────────────────────────────────────────────────────────────
  'R291': {
    steps: [
      'Faire torréfier le cumin à sec dans la casserole 30 secondes jusqu\'à ce qu\'il embaume, puis ajouter l\'huile d\'olive.',
      'Faire suer l\'oignon émincé 5 minutes à feu moyen jusqu\'à transparence, ajouter l\'ail haché et cuire 1 minute.',
      'Incorporer les tomates concassées, monter le feu et laisser réduire 3 minutes pour concentrer les saveurs.',
      'Verser le bouillon et les pois chiches égouttés. Écraser grossièrement 1/4 des pois chiches à la fourchette pour lier la soupe naturellement.',
      'Laisser mijoter 12 minutes à feu doux. Hors du feu, incorporer les épinards frais et couvrir 3 minutes — ils cuisent à la chaleur résiduelle sans perdre leur couleur.',
      'Rectifier l\'assaisonnement, arroser d\'un filet d\'huile d\'olive crue au moment du service.'
    ],
    tips: 'Le secret d\'une soupe qui a du caractère : torréfier l\'épice avant d\'ajouter le liquide — c\'est 30 secondes qui changent tout. Et les épinards se mettent toujours en dernier, hors du feu.'
  },

  // ─────────────────────────────────────────────────────────────
  // R292 — Quinoa Poivrons Rôtis
  // Objectif : rôtir les légumes à très haute température pour
  //            caraméliser les sucres naturels, cuire le quinoa
  //            comme une graine noble (rapport eau/grain précis).
  // ─────────────────────────────────────────────────────────────
  'R292': {
    steps: [
      'Préchauffer le four à 220 °C (chaleur tournante). Couper poivrons, courgette et oignon rouge en morceaux réguliers de 3 cm — l\'uniformité assure une cuisson homogène.',
      'Disposer les légumes sur la plaque en une seule couche (ne pas superposer), arroser d\'huile d\'olive, saupoudrer d\'herbes de Provence, saler. Rôtir 25 minutes sans remuer : laisser les faces caraméliser.',
      'Rincer le quinoa à l\'eau froide. Le faire toaster à sec dans une casserole 2 minutes, puis ajouter 300 ml d\'eau froide salée. Porter à ébullition, couvrir, cuire 12 minutes à feu doux. Retirer du feu, laisser gonfler 5 minutes à couvert.',
      'Égrainer le quinoa à la fourchette. Verser le jus de citron et mélanger à chaud pour que les grains absorbent l\'acidité.',
      'Dresser : quinoa en base, légumes rôtis par-dessus, feta émiettée en dernier pour préserver ses arômes. Servir tiède.'
    ],
    tips: 'Ne remplissez jamais la plaque de four au-delà d\'une couche : des légumes qui se chevauchent cuisent à la vapeur, ils ne rôtissent pas. L\'espace, c\'est la caramélisation.'
  },

  // ─────────────────────────────────────────────────────────────
  // R293 — Nasi Goreng Poulet
  // Objectif : wok très chaud, riz froid de la veille (indispensable),
  //            séquence d\'ajout précise pour éviter le riz collant.
  // ─────────────────────────────────────────────────────────────
  'R293': {
    steps: [
      'Tailler le poulet en petits dés réguliers de 1,5 cm. Chauffer la poêle ou le wok à feu maximal jusqu\'à légère fumée — c\'est la condition du "wok hei", ce goût fumé caractéristique.',
      'Saisir les dés de poulet 3 minutes sans les remuer pour obtenir une belle coloration. Réserver.',
      'Dans la même poêle très chaude, faire revenir oignon et ail émincés 1 minute, ajouter le sambal et mélanger 30 secondes pour le torréfier légèrement.',
      'Ajouter le riz froid (déjà égrainé à la main) en une seule fois. Presser contre la poêle 1 minute sans remuer pour faire griller le fond, puis sauter vivement.',
      'Verser sauce soja et kecap manis en filet sur les bords de la poêle (non sur le riz) pour qu\'elles caramélisent avant d\'être incorporées. Ajouter le poulet, mélanger 2 minutes à feu vif.',
      'Faire les œufs frits dans une poêle séparée avec une goutte d\'huile — le blanc doit être croustillant sur les bords, le jaune coulant. Poser sur le riz au moment du service.'
    ],
    tips: 'Le riz de la veille est impératif : l\'humidité s\'est évaporée, les grains sont secs et se séparent bien à la chaleur. Du riz frais donnera un résultat pâteux, sans discussion.'
  },

  // ─────────────────────────────────────────────────────────────
  // R294 — Taboulé Quinoa Tomates
  // Objectif : respecter la philosophie du vrai taboulé libanais
  //            (plus d\'herbes que de grain), laisser reposer
  //            pour que les saveurs se fondent.
  // ─────────────────────────────────────────────────────────────
  'R294': {
    steps: [
      'Cuire le quinoa dans 320 ml d\'eau salée : porter à ébullition, couvrir, 12 minutes à feu doux. Étaler sur une plaque et laisser refroidir complètement — un quinoa chaud fait ramollir les herbes.',
      'Pendant ce temps, hacher finement le persil (feuilles seulement, sans les tiges) et la menthe à la main au couteau — jamais au mixeur qui oxyde les herbes et les noircit.',
      'Couper les tomates en petits dés de 5 mm, les saler légèrement dans une passoire 5 minutes pour éliminer l\'excès d\'eau qui diluerait la vinaigrette.',
      'Préparer la vinaigrette : émulsionner le jus de citron avec l\'huile d\'olive et une pincée de sel en fouettant vivement.',
      'Assembler quinoa froid, herbes, tomates égouttées et oignons verts. Verser la vinaigrette, mélanger délicatement. Laisser reposer 15 minutes au frais avant de servir : le quinoa s\'imprègne des saveurs.'
    ],
    tips: 'Un taboulé se goûte toujours après un temps de repos : 15 minutes au réfrigérateur transforment un mélange en une recette. Ne servez jamais un taboulé à peine assemblé.'
  },

  // ─────────────────────────────────────────────────────────────
  // R295 — Omelette Blanche aux Champignons
  // Objectif : champignons bien saisis (pas bouillis dans leur eau),
  //            blancs montés très légèrement pour une texture aérienne.
  // ─────────────────────────────────────────────────────────────
  'R295': {
    steps: [
      'Émincer les champignons en lamelles de 5 mm d\'épaisseur. Chauffer la poêle à feu vif sans matière grasse d\'abord — laisser l\'eau des champignons s\'évaporer 1 minute, puis ajouter l\'huile.',
      'Saisir les champignons à feu vif sans remuer 2 minutes pour les dorer. Les champignons bouillis sont sans intérêt ; les champignons dorés ont un goût de noisette. Saler, poivrer en fin de saisie. Réserver hors de la poêle.',
      'Battre les blancs d\'œufs à la fourchette jusqu\'à ce qu\'ils soient légèrement mousseux — pas en neige ferme, juste aérés. Saler.',
      'Dans la poêle essuyée, chauffer un filet d\'huile à feu doux. Verser les blancs, couvrir immédiatement avec un couvercle. Cuire 3 à 4 minutes : les blancs prennent sans brunir dessous.',
      'Déposer les champignons sur une moitié de l\'omelette, plier et glisser dans l\'assiette. Parsemer d\'oignon vert ciselé. Servir sans attendre.'
    ],
    tips: 'Le couvercle est votre allié pour une omelette blanche : il crée de la vapeur qui cuit le dessus sans retourner, évitant toute coloration excessive qui durcirait les blancs.'
  },

  // ─────────────────────────────────────────────────────────────
  // R296 — Curry de Crevettes Coco
  // Objectif : pâte de curry saisie à sec pour développer ses
  //            arômes, crevettes ajoutées en tout dernier pour
  //            rester tendres, jamais trop cuites.
  // ─────────────────────────────────────────────────────────────
  'R296': {
    steps: [
      'Faire revenir oignon finement ciselé dans l\'huile 5 minutes à feu moyen jusqu\'à légère coloration dorée. Ajouter ail et gingembre râpés, cuire 1 minute.',
      'Ajouter la pâte de curry rouge. Faire frire en remuant constamment 2 minutes à feu moyen-vif : la pâte doit "chanter" dans la poêle et perdre son odeur de cru.',
      'Verser le lait de coco en une seule fois. Racler les sucs caramélisés au fond de la poêle — c\'est là que se cache le goût. Incorporer les tomates cerises entières.',
      'Laisser mijoter à feu doux 8 minutes à découvert pour réduire légèrement la sauce et concentrer les saveurs.',
      'Hors du feu ou sur feu très doux, ajouter les crevettes. Couvrir 3 à 4 minutes : elles cuisent à la chaleur de la sauce sans devenir caoutchouteuses.',
      'Vérifier l\'assaisonnement. Parsemer généreusement de coriandre fraîche ciselée au dernier moment. Servir avec riz basmati.'
    ],
    tips: 'Une crevette trop cuite est une crevette perdue. Ajoutez-les toujours hors du feu, dans la sauce chaude : elles finissent de cuire en 3 minutes sans se contracter.'
  },

  // ─────────────────────────────────────────────────────────────
  // R297 — Pancakes Protéinés
  // Objectif : ne pas trop mélanger la pâte (grumeaux acceptables),
  //            respecter la température de cuisson pour des pancakes
  //            levés et moelleux, pas caoutchouteux.
  // ─────────────────────────────────────────────────────────────
  'R297': {
    steps: [
      'Dans un grand bol, mélanger les ingrédients secs : farine d\'avoine, levure chimique, pincée de sel.',
      'Dans un autre bol, fouetter les œufs avec le yaourt grec, le lait, le miel et la vanille jusqu\'à homogénéité.',
      'Verser les ingrédients liquides sur les secs. Mélanger à la spatule en 10 à 12 mouvements seulement : la pâte doit rester légèrement grumeleuse. Un mélange trop travaillé donne des pancakes durs et plats.',
      'Chauffer une poêle antiadhésive à feu moyen. Tester la température : une goutte d\'eau doit "danser" et s\'évaporer immédiatement. Huiler très légèrement avec un papier absorbant.',
      'Verser des louches de 60 ml de pâte. Quand des bulles apparaissent en surface et ne se referment plus (environ 2 minutes), retourner une seule fois. Cuire 1 minute 30 sur l\'autre face.',
      'Empiler les pancakes sur une assiette chaude, couverts d\'un linge propre pour qu\'ils restent moelleux. Servir avec fruits frais de saison.'
    ],
    tips: 'La règle d\'or des pancakes : on ne retourne qu\'une seule fois, et jamais avant que les bulles en surface ne soient fixes. Impatience et pancakes ne font pas bon ménage.'
  },

  // ─────────────────────────────────────────────────────────────
  // R298 — Salade de Pâtes au Thon
  // Objectif : pâtes cuites al dente, vinaigrette moutardée émulsionnée
  //            et incorporée à chaud pour que les pâtes s\'imprègnent.
  // ─────────────────────────────────────────────────────────────
  'R298': {
    steps: [
      'Cuire les fusilli dans une grande quantité d\'eau bouillante fortement salée (l\'eau doit "goûter la mer") jusqu\'à al dente — 1 minute de moins que le temps indiqué sur le paquet.',
      'Pendant la cuisson, préparer la vinaigrette : fouetter la moutarde avec le jus de citron, puis incorporer l\'huile d\'olive en filet en fouettant pour obtenir une émulsion stable. Saler, poivrer.',
      'Égoutter les pâtes. Les rincer brièvement sous l\'eau froide pour stopper la cuisson, puis égoutter soigneusement — des pâtes trop humides diluent la vinaigrette.',
      'Mélanger les pâtes encore légèrement tièdes avec la vinaigrette : tièdes, elles absorbent mieux les saveurs qu\'entièrement froides.',
      'Incorporer délicatement le thon émietté en gros morceaux (ne pas réduire en bouillie), les tomates cerises coupées en deux, le concombre en demi-rondelles et le maïs égoutté.',
      'Réfrigérer au moins 10 minutes avant de servir. Rectifier l\'assaisonnement et arroser d\'un filet d\'huile d\'olive crue au moment du dressage.'
    ],
    tips: 'Émulsionnez toujours votre vinaigrette avant d\'ajouter les ingrédients, jamais dans le saladier — un assaisonnement homogène enrobe chaque pasta uniformément, sans flaques d\'huile au fond.'
  },

  // ─────────────────────────────────────────────────────────────
  // R299 — Wrap Thon Avocat
  // Objectif : guacamole simple mais parfait (acidité du citron vert
  //            pour éviter l\'oxydation), tortilla légèrement chauffée
  //            pour rouler sans casser.
  // ─────────────────────────────────────────────────────────────
  'R299': {
    steps: [
      'Écraser l\'avocat à la fourchette en conservant quelques morceaux — une texture rustique vaut mieux qu\'une purée lisse. Incorporer immédiatement le jus de citron vert et une pincée de sel pour éviter l\'oxydation.',
      'Égoutter soigneusement le thon, l\'émietter en gros flocons. Mélanger délicatement avec le yaourt grec, les câpres hachées grossièrement et une pincée de poivre. Ne pas réduire en pâte.',
      'Passer chaque tortilla 20 secondes à sec dans une poêle chaude ou 10 secondes au micro-ondes : une tortilla tiède est souple et ne se casse pas au roulage.',
      'Garnir chaque tortilla en laissant 3 cm libres en bas : feuilles de laitue romaine en premier (elles font barrière contre l\'humidité), puis guacamole, puis thon, tomates cerises coupées en deux.',
      'Replier le bord inférieur sur la garniture, puis rouler fermement en serrant. Couper en diagonale à mi-hauteur pour le dressage — la coupe révèle les couches colorées.'
    ],
    tips: 'La laitue posée directement sur la tortilla forme une barrière naturelle qui empêche l\'humidité du thon et de l\'avocat de détremper la galette. Toujours la laitue en premier.'
  },

  // ─────────────────────────────────────────────────────────────
  // R300 — Poulet Poêlé Sauce Citron
  // Objectif : maîtrise du déglaçage — c\'est la technique
  //            classique française qui distingue un jus de cuisson
  //            d\'une simple sauce citron.
  // ─────────────────────────────────────────────────────────────
  'R300': {
    steps: [
      'Placer les blancs de poulet entre deux feuilles de film alimentaire. Battre au rouleau à pâtisserie jusqu\'à 1,5 cm d\'épaisseur uniforme : une épaisseur régulière garantit une cuisson homogène.',
      'Assaisonner généreusement les deux faces. Chauffer l\'huile d\'olive dans une poêle à feu vif jusqu\'à ce qu\'elle frémisse légèrement.',
      'Saisir les blancs 4 minutes côté premier sans les bouger — résister à l\'envie de déplacer la viande pour obtenir une belle croûte dorée. Retourner, baisser à feu moyen, ajouter le beurre et cuire 4 minutes en arrosant continuellement avec le beurre fondu.',
      'Vérifier la cuisson : le jus qui s\'écoule doit être clair, non rosé. Retirer le poulet et le laisser reposer 3 minutes sur une planche — ce repos redistribue les jus dans la chair.',
      'Dans la même poêle, jeter l\'ail haché 30 secondes à feu moyen, puis déglacer avec le jus de citron en grattant vigoureusement les sucs caramélisés. Ajouter le thym, réduire 2 minutes jusqu\'à légère consistance sirupeuse.',
      'Napper les blancs de sauce au moment du service, parsemer de persil haché. Ne jamais napper à l\'avance — la sauce doit arriver chaude sur la viande reposée.'
    ],
    tips: 'Le repos de la viande après cuisson n\'est pas facultatif : 3 minutes hors du feu, les fibres se détendent et retiennent leurs jus. Coupé trop tôt, le poulet se vide dans l\'assiette.'
  }

};
