// tmp_bocuse_mexican.js
// Audit culinaire Paul Bocuse — 10 recettes mexicaines healthy (R510–R519)
// Règles : healthy, ingrédients disponibles au Maroc, max 1 ingrédient ajouté/recette,
// steps ≤ 6, macros ±50 kcal, IDs/noms/category/origin/tags/servings/mealTypes inchangés.

var IMPROVEMENTS_MEXICAN = {

  // ─── R510 — BURRITO BOWL POULET GRILLÉ ────────────────────────────────────
  'R510': {
    steps: [
      'Cuire le riz blanc dans 1,5× son volume d\'eau bouillante salée avec une tige de coriandre entière ; ôter la tige, égrener à la fourchette et réserver couvert.',
      'Mélanger cumin, paprika fumé, sel et poivre. Quadriller légèrement les blancs de poulet au couteau (3 mm de profondeur) pour que l\'épice pénètre, puis enrober.',
      'Chauffer l\'huile dans une poêle en fonte à feu vif jusqu\'à frémissement. Saisir le poulet 5 min côté premier sans le bouger pour obtenir une croûte nette, retourner 4 min, puis laisser reposer 5 min sous papier aluminium avant d\'émincer en biais.',
      'Écraser l\'avocat à la fourchette en gardant des morceaux ; assaisonner avec le jus de citron vert, sel et moitié de la coriandre ciselée. Filmer au contact pour éviter l\'oxydation.',
      'Préparer la salsa pico de gallo : dés de tomate épépinée, oignon rouge rincé à l\'eau froide (réduit l\'âcreté), reste de coriandre, filet de citron vert, sel.',
      'Assembler à chaud : riz en base, haricots noirs tièdes, maïs, poulet tranché, guacamole, salsa. Servir immédiatement.',
    ],
    tips: 'Le geste clé du bowl : déposer les ingrédients en sections distinctes plutôt qu\'en vrac — chaque convive mélange à sa guise et la présentation reste digne d\'un restaurant. Le repos obligatoire du poulet (5 min) redistribue les jus et garantit une viande moelleuse à la coupe.',
  },

  // ─── R511 — TACOS DE POULET SPICY AU FOUR ────────────────────────────────
  'R511': {
    steps: [
      'Préchauffer le four à 200 °C chaleur tournante. Mélanger cumin, paprika, origan, sel et huile pour former une pâte d\'épices. Inciser légèrement les blancs et les enrober entièrement ; laisser mariner 10 min le temps que le four chauffe.',
      'Enfourner le poulet sur une grille (pas dans un plat) pour que l\'air circule tout autour. Cuire 18 min jusqu\'à 74 °C à cœur. Laisser reposer 5 min sous feuille d\'aluminium, puis effilocher à la fourchette plutôt que de trancher — la viande effilochée absorbe mieux les sauces.',
      'Préparer la salsa cruda : dés de tomate épépinée, oignon rouge finement ciselé, piment haché, coriandre, jus de citron vert. Assaisonner et laisser macérer 5 min.',
      'Écraser l\'avocat avec sel, piment haché et jus de citron vert ; incorporer une cuillerée de yaourt grec pour un guacamole crémeux allégé.',
      'Chauffer les galettes 30 secondes de chaque côté dans une poêle sèche très chaude (doivent former de petites cloques) — c\'est ce qui leur donne souplesse et légère saveur de farine grillée.',
      'Garnir chaque galette : poulet effiloché au centre, salsa, guacamole au yaourt, trait de yaourt grec. Plier en U et servir sans attendre.',
    ],
    tips: 'Cuire le poulet sur grille au four, et non posé dans son jus, produit une surface légèrement croustillante qui contraste à merveille avec la souplesse de la galette. C\'est un détail de pro qui change tout au toucher en bouche.',
  },

  // ─── R512 — CHILI CON CARNE LIGHT ────────────────────────────────────────
  'R512': {
    steps: [
      'Émincer oignon, ail, piment en brunoise fine. Couper le poivron en dés de 1 cm — l\'uniformité garantit une cuisson homogène.',
      'Dans une cocotte à fond épais, chauffer l\'huile à feu moyen-vif. Faire revenir l\'oignon seul 4 min jusqu\'à transparence, puis ajouter le poivron 3 min, l\'ail et le piment 1 min — cette mise en place par strates construit les saveurs.',
      'Monter le feu au maximum. Ajouter le bœuf haché en une seule couche sans remuer pendant 2 min pour obtenir une vraie caramélisation (réaction de Maillard). Égrener ensuite à la spatule et cuire jusqu\'à disparition complète du rose.',
      'Ajouter cumin, paprika fumé et origan directement sur la viande chaude et torréfier 30 secondes à sec avant d\'incorporer les tomates pelées — les épices libèrent leurs huiles essentielles au contact de la chaleur sèche.',
      'Ajouter une cuillère à café de cacao en poudre non sucré (ingrédient additionnel). Incorporer les haricots rouges égouttés. Porter à frémissement léger, couvrir et mijoter 20 min en remuant toutes les 5 min.',
      'Rectifier l\'assaisonnement. Servir avec une cuillerée de yaourt grec et quelques feuilles de coriandre fraîche.',
    ],
    tips: 'Une demi-cuillère à café de cacao non sucré ajoutée avec les épices est le secret des vrais chili mexicains : elle arrondit l\'acidité des tomates, enrichit la couleur et donne une profondeur de goût que personne n\'identifie mais que tout le monde ressent. Elle n\'ajoute que 5 kcal pour 2 portions — les macros restent intactes.',
  },

  // ─── R513 — GUACAMOLE HAUTE PROTÉINE ─────────────────────────────────────
  'R513': {
    steps: [
      'Choisir des avocats au stade parfait de maturité : ils doivent céder sous une pression légère du pouce sans s\'enfoncer. Couper en deux, ôter le noyau d\'un coup sec du couteau, récupérer la chair à la cuillère en un seul geste.',
      'Écraser l\'avocat à la fourchette sur une planche — jamais au mixeur — en laissant des petits morceaux de 5 mm : un guacamole doit avoir du caractère et de la texture, pas être une purée lisse.',
      'Rincer l\'oignon rouge ciselé 30 secondes sous l\'eau froide et sécher avant de l\'incorporer : ce geste simple supprime l\'âcreté piquante en conservant le croquant.',
      'Mélanger délicatement l\'avocat écrasé, le cottage cheese, le jus de citron vert, l\'ail pressé, sel et poivre. Le citron vert sert à la fois d\'assaisonnement et d\'antioxydant.',
      'Incorporer la tomate épépinée et coupée en brunoise fine (dés de 3 mm), l\'oignon rincé, le piment haché et la coriandre ciselée au dernier moment.',
    ],
    tips: 'Filmer le guacamole au contact direct (le film plastique touche la surface) et non au-dessus du bol : c\'est le seul moyen d\'éliminer totalement l\'air responsable de l\'oxydation. Le guacamole reste vert 2 à 3 heures, même avec l\'avocat.',
  },

  // ─── R514 — POÊLÉE DE CREVETTES À LA MEXICAINE ───────────────────────────
  'R514': {
    steps: [
      'Sécher scrupuleusement les crevettes avec du papier absorbant — c\'est la règle d\'or : une crevette humide ne saisit pas, elle cuit à la vapeur et devient caoutchouteuse. Assaisonner de cumin, paprika, sel et poivre au dernier moment.',
      'Couper les poivrons en lanières de 1 cm de largeur régulière. Émincer l\'ail en lamelles fines plutôt qu\'en presse-ail (moins d\'amertume).',
      'Chauffer la poêle à feu vif 2 min avant d\'y verser l\'huile. Lorsque l\'huile frémit et commence à fumer légèrement, disposer les crevettes côte à côte sans les superposer. Saisir 90 secondes sans toucher, retourner, 60 secondes, réserver aussitôt — elles finissent de cuire hors du feu.',
      'Dans la même poêle, faire sauter les lanières de poivrons à feu vif 4 min en remuant régulièrement jusqu\'à légère coloration. Ajouter l\'ail en lamelles et le piment, cuire 1 min.',
      'Presser un demi-citron vert directement dans la poêle chaude hors du feu (les huiles essentielles du zeste s\'évaporent à la chaleur), ajouter les crevettes réservées, mélanger 30 secondes.',
      'Parsemer généreusement de coriandre fraîche ciselée et servir immédiatement — les crevettes ne supportent pas l\'attente.',
    ],
    tips: 'La crevette est l\'un des produits les plus fragiles en cuisine : elle passe du cru au trop cuit en moins de 60 secondes. Le signal infaillible de la cuisson parfaite est visuel — elle prend la forme d\'un C lâche. Dès qu\'elle se recroqueville en O, elle est trop cuite et déjà caoutchouteuse. Retirez la poêle du feu avant ce stade.',
  },

  // ─── R515 — ENCHILADAS DE POULET LÉGÈRES ─────────────────────────────────
  'R515': {
    steps: [
      'Préchauffer le four à 190 °C. Pocher les blancs de poulet en démarrant à l\'eau froide salée avec 2 gousses d\'ail écrasées : monter à frémissement (jamais à ébullition franche), cuire 12 min, éteindre le feu et laisser reposer 5 min dans l\'eau — la viande reste ainsi juteuse. Effilocher avec deux fourchettes.',
      'Sauce enchilada : faire revenir oignon et ail dans l\'huile 3 min. Ajouter tomates, cumin, paprika fumé, piment, sel. Mijoter 10 min. Passer rapidement au mixeur plongeant pour une sauce onctueuse sans être lisse — quelques morceaux apportent de la texture.',
      'Mélanger le poulet effiloché avec la moitié de la sauce et toute la coriandre ciselée. Assaisonner et goûter — la farce doit être bien relevée car la galette atténue les saveurs.',
      'Tremper rapidement chaque galette 5 secondes dans la sauce chaude avant de la garnir : cette étape traditionnelle mexicaine imperméabilise la galette, l\'empêche de se dessécher au four et lui confère le goût caractéristique des enchiladas.',
      'Rouler serré, disposer joint en bas dans un plat huilé, napper du reste de sauce. Parsemer de mozzarella râpée. Enfourner 15-18 min jusqu\'à gratinage doré.',
      'Laisser reposer 2 min hors du four avant de servir — les enchiladas se découpent mieux et la sauce se stabilise. Accompagner d\'une cuillerée de yaourt grec.',
    ],
    tips: 'Tremper brièvement les galettes dans la sauce avant de les garnir est le geste technique qui distingue une vraie enchilada d\'un simple wrap fourré puis gratifié. Cette étape, souvent omise dans les recettes allégées, multiplie la profondeur aromatique et évite que la galette sèche et se décolle pendant la cuisson.',
  },

  // ─── R516 — SOUPE TORTILLA PROTÉINÉE ─────────────────────────────────────
  'R516': {
    steps: [
      'Préchauffer le four à 200 °C. Badigeonner les lanières de galette d\'un filet d\'huile, saler légèrement et enfourner 8-10 min sur une grille (pas une plaque pleine) pour une dorure uniforme des deux côtés sans retournement.',
      'Dans une cocotte, faire revenir oignon et ail ciselés dans l\'huile 3 min jusqu\'à transparence. Ajouter le piment, le cumin et le paprika, torréfier 30 secondes à sec avant d\'incorporer les tomates pelées écrasées à la main. Cuire 5 min.',
      'Verser le bouillon, porter à frémissement. Déposer les blancs de poulet entiers dans le bouillon frémissant (jamais bouillant) et cuire exactement 15 min à couvert. Retirer le poulet, effilocher finement à la fourchette, remettre dans la soupe.',
      'Ajouter haricots noirs et maïs, laisser mijoter 5 min. Presser le citron vert hors du feu pour préserver la fraîcheur des agrumes.',
      'Servir en bols très chauds : disposer d\'abord la soupe, puis déposer les lanières croustillantes au dernier moment (elles ne doivent pas macérer), parsemer de coriandre.',
    ],
    tips: 'L\'enjeu de cette soupe est la texture contrastée : le liquide chaud et velouté contre le croustillant des lanières de galette. Ce contraste ne dure que 2 à 3 minutes avant que les lanières ramollissent. Servez-les toujours séparément dans une coupelle à part pour que chaque convive les ajoute lui-même à table — c\'est aussi un beau geste de service.',
  },

  // ─── R517 — SALADE MEXICAINE DE QUINOA ───────────────────────────────────
  'R517': {
    steps: [
      'Rincer le quinoa à l\'eau froide dans une passoire fine jusqu\'à ce que l\'eau soit claire (élimine la saponine amère). Cuire dans 360 ml d\'eau bouillante salée, couvrir, feu doux, 12 min, puis couper le feu et laisser gonfler 5 min sans lever le couvercle. Égrener à la fourchette et étaler sur une plaque pour refroidir rapidement.',
      'Préparer la vinaigrette en émulsionnant : jus de citron vert, huile d\'olive, cumin, sel, poivre. Assaisonner le quinoa encore tiède — les grains absorbent la vinaigrette à chaud et sont plus savoureux que s\'ils sont assaisonnés froids.',
      'Couper les tomates cerises en deux, le poivron en brunoise de 5 mm, l\'avocat en cubes de 1,5 cm (pas plus petits pour éviter l\'écrasement), l\'oignon rouge en fines rondelles passées 1 min sous l\'eau froide.',
      'Dans un grand saladier, combiner quinoa assaisonné, haricots noirs, maïs égoutté et séché, poivron. Rectifier l\'assaisonnement.',
      'Ajouter délicatement avocat, tomates cerises, oignon rouge et coriandre en dernier, en soulevant la salade avec une spatule plutôt qu\'en remuant — pour ne pas écraser l\'avocat.',
    ],
    tips: 'Assaisonner le quinoa encore tiède avec la vinaigrette est la technique qui transforme cette salade : les grains chauds s\'imprègnent des arômes du citron vert et du cumin en profondeur, là où un quinoa froid resterait bland, même bien nappé. Cette règle vaut pour toutes les salades de céréales.',
  },

  // ─── R518 — BOWL CHOU-FLEUR RÔTI FAÇON TACOS ─────────────────────────────
  'R518': {
    steps: [
      'Préchauffer le four à 230 °C (pas 220 °C) — la température élevée est indispensable pour caraméliser les fleurons sans les cuire à la vapeur. Détailler le chou-fleur en fleurons réguliers de 3-4 cm. Sécher soigneusement avec un torchon.',
      'Mélanger les fleurons avec l\'huile, le cumin, le paprika fumé, sel et poivre. Étaler en une seule couche espacée sur la plaque — si les fleurons se touchent, ils cuit à la vapeur et restent mous. Utiliser deux plaques si nécessaire.',
      'Rôtir 20 min sans ouvrir le four, puis retourner chaque fleurette et rôtir 8 min supplémentaires. Le chou-fleur doit présenter des bords noirs-dorés — c\'est la caramélisation des sucres naturels qui donne la saveur umami.',
      'Sauce yaourt : mélanger yaourt grec, jus de citron vert, pincée de cumin, sel et une cuillère à café de curcuma (ingrédient additionnel, anti-inflammatoire, 0 kcal significatif). Réserver au frais.',
      'Salsa express : dés de tomate épépinée, oignon rouge rincé, piment, coriandre, citron vert. Macérer 5 min.',
      'Assembler les bowls : chou-fleur rôti chaud, haricots noirs, maïs, guacamole express (avocat écrasé, sel, citron vert), salsa, trait de sauce yaourt au curcuma. Garnir de coriandre fraîche.',
    ],
    tips: 'Le secret du chou-fleur rôti réussi tient en un mot : espace. Chaque fleuron doit être isolé sur la plaque, jamais en contact avec son voisin. La moindre superposition crée de la vapeur et empêche la caramélisation. En restaurant, nous utilisons des plaques perforées pour maximiser la circulation d\'air et obtenir ce grillé uniforme que les clients croient impossible à reproduire à la maison.',
  },

  // ─── R519 — CEVICHE DE THON À LA MEXICAINE ───────────────────────────────
  'R519': {
    steps: [
      'Égoutter le thon dans une passoire fine et presser doucement avec le dos d\'une cuillère pour extraire l\'excès de liquide — un thon bien égoutté absorbe mieux la marinade et ne dilue pas les saveurs.',
      'Couper tomates (épépinées), concombre (épépiné, pelé) et oignon rouge en brunoise très régulière de 4 mm. Rincer l\'oignon rouge 30 secondes sous l\'eau froide, égoutter. Émincer le piment en brunoise fine en retirant les graines selon l\'intensité souhaitée.',
      'Mélanger jus de citron vert, jus de citron jaune, huile d\'olive, sel et poivre dans un bol. Goûter : la marinade doit être vive, légèrement grasse et bien salée — elle s\'adoucira au contact des légumes.',
      'Combiner thon émietté, tomates, concombre, oignon rouge et piment. Verser la marinade, mélanger délicatement. Laisser reposer 8 min au réfrigérateur — pas plus, pour conserver la fraîcheur du thon.',
      'Couper l\'avocat en cubes de 1,5 cm au dernier moment. Incorporer avocat et coriandre ciselée par un mouvement de soulèvement, jamais en remuant, pour garder les cubes intacts.',
      'Servir dans des bols refroidis au congélateur 5 min. Accompagner de galettes de blé légèrement grillées ou de feuilles de laitue iceberg en cups.',
    ],
    tips: 'Le ceviche est un plat qui se joue à quelques minutes près. Avec du thon en conserve, la fenêtre de service idéale est 5 à 15 minutes après l\'assemblage final : avant, les saveurs ne sont pas fondues ; après, l\'oignon rouge commence à "cuire" le reste et la texture s\'affaisse. Servir dans des bols refroidis prolonge cette fenêtre et maintient la vivacité du plat.',
  },

};
