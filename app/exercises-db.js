/* ═══════════════════════════════════════════════════════════════
   EXERCISES-DB.JS — Base de donnees exercices
   MTD Macro Calculator
   72+ exercices, 9 groupes musculaires, liens video YouTube
   ═══════════════════════════════════════════════════════════════ */
var EXERCISES = {

  // ─── PECTORAUX ───
  chest: [
    {
      n: "Developpe couche",
      m: "Pectoraux",
      eq: "Barre + banc",
      sets: "4\u00d78-12",
      rest: "90s",
      video: "https://www.youtube.com/results?search_query=developpe+couche+bench+press+exercise+animation+tutorial&sp=EgIYAQ%253D%253D",
      desc: "Allonge sur le banc, descendre la barre au niveau de la poitrine, pousser vers le haut.",
      tips: ["Garder les pieds au sol", "Ne pas arquer excessivement le dos", "Controler la descente", "Coudes a 45-75 degres du corps — jamais a 90 degres", "Eviter le grip trop large (>81cm) — risque tendinopathie biceps"],
      lv: 2,
      tags: ["pectoraux", "triceps", "force"]
    },
    {
      n: "Developpe incline",
      m: "Pectoraux superieurs",
      eq: "Barre + banc incline",
      sets: "4\u00d78-12",
      rest: "90s",
      video: "https://www.youtube.com/results?search_query=developpe+incline+incline+bench+press+exercise+animation+tutorial&sp=EgIYAQ%253D%253D",
      desc: "Banc incline a 30-45 degres. Descendre la barre vers le haut de la poitrine.",
      tips: ["Incliner le banc a 30-45 degres", "Garder les coudes a 45 degres du corps", "Ne pas rebondir la barre"],
      lv: 2,
      tags: ["pectoraux", "epaules", "force"]
    },
    {
      n: "Pompes classiques",
      m: "Pectoraux",
      eq: "Poids du corps",
      sets: "3\u00d715-20",
      rest: "60s",
      video: "https://www.youtube.com/results?search_query=pompes+push+ups+exercise+animation+tutorial&sp=EgIYAQ%253D%253D",
      desc: "Mains au sol, largeur des epaules. Descendre la poitrine au sol puis pousser.",
      tips: ["Corps aligne de la tete aux pieds", "Contracter les abdos", "Descendre jusqu'a frolar le sol"],
      lv: 1,
      tags: ["pectoraux", "triceps", "poids du corps"]
    },
    {
      n: "Ecarte halteres",
      m: "Pectoraux",
      eq: "Halteres + banc",
      sets: "3\u00d712-15",
      rest: "60s",
      video: "https://www.youtube.com/results?search_query=ecarte+halteres+dumbbell+fly+exercise+animation+tutorial&sp=EgIYAQ%253D%253D",
      desc: "Allonge sur le banc, bras tendus au-dessus. Ouvrir les bras en arc de cercle.",
      tips: ["Legere flexion des coudes", "Sentir l'etirement des pectoraux", "Controler la phase negative"],
      lv: 2,
      tags: ["pectoraux", "isolation"]
    },
    {
      n: "Dips",
      m: "Pectoraux / Triceps",
      eq: "Barres paralleles",
      sets: "4\u00d78-12",
      rest: "90s",
      video: "https://www.youtube.com/results?search_query=dips+chest+dips+exercise+animation+tutorial&sp=EgIYAQ%253D%253D",
      warn: "Contre-indique si douleur anterieure d'epaule ou conflit sous-acromial",
      desc: "Se suspendre aux barres paralleles, descendre en flechissant les coudes, remonter.",
      tips: ["Pencher le buste en avant pour cibler les pectoraux", "Ne pas descendre sous 90 degres si douleur", "Ne pas verrouiller en haut"],
      lv: 3,
      tags: ["pectoraux", "triceps", "compose"]
    },
    {
      n: "Pullover haltere",
      m: "Pectoraux / Grand dorsal",
      eq: "Haltere + banc",
      sets: "3\u00d712-15",
      rest: "60s",
      video: "https://www.youtube.com/results?search_query=pullover+haltere+dumbbell+pullover+exercise+animation+tutorial&sp=EgIYAQ%253D%253D",
      desc: "Allonge perpendiculaire au banc, descendre l'haltere derriere la tete puis remonter.",
      tips: ["Garder une legere flexion des coudes", "Sentir l'etirement du thorax", "Ne pas descendre trop bas"],
      lv: 2,
      tags: ["pectoraux", "dos", "expansion thoracique"]
    },
    {
      n: "Pompes diamant",
      m: "Pectoraux internes / Triceps",
      eq: "Poids du corps",
      sets: "3\u00d710-15",
      rest: "60s",
      video: "https://www.youtube.com/results?search_query=pompes+diamant+diamond+push+ups+exercise+animation+tutorial&sp=EgIYAQ%253D%253D",
      desc: "Mains rapprochees formant un losange sous la poitrine. Descendre et pousser.",
      tips: ["Mains en forme de diamant", "Corps bien gaine", "Excellent pour les triceps"],
      lv: 2,
      tags: ["pectoraux", "triceps", "poids du corps"]
    },
    {
      n: "Developpe halteres",
      m: "Pectoraux",
      eq: "Halteres + banc",
      sets: "4\u00d78-12",
      rest: "90s",
      video: "https://www.youtube.com/results?search_query=developpe+halteres+dumbbell+bench+press+exercise+animation+tutorial&sp=EgIYAQ%253D%253D",
      desc: "Allonge sur le banc, pousser les halteres au-dessus de la poitrine.",
      tips: ["Plus grande amplitude qu'a la barre", "Controler la descente", "Rapprocher les halteres en haut"],
      lv: 2,
      tags: ["pectoraux", "triceps", "stabilisation"]
    },
    {
      n: "Chest press machine",
      m: "Pectoraux",
      eq: "Machine convergente",
      sets: "3\u00d712-15",
      rest: "60s",
      video: "https://www.youtube.com/results?search_query=chest+press+machine+exercise+animation+tutorial&sp=EgIYAQ%253D%253D",
      desc: "Assis a la machine, pousser les poignees vers l'avant.",
      tips: ["Regler le siege a hauteur de poitrine", "Ne pas verrouiller les coudes", "Ideal pour les debutants"],
      lv: 1,
      tags: ["pectoraux", "triceps", "machine"]
    },
    {
      n: "Cable crossover bas",
      m: "Pectoraux inferieurs",
      eq: "Cable poulie basse",
      sets: "3\u00d712-15",
      rest: "60s",
      desc: "Poulies basses, tirer les cables vers le haut et croiser au niveau des pectoraux.",
      tips: ["Petite flexion vers l'avant", "Sentir le stretch en position ouverte", "Contracter fort en croisant"],
      lv: 2,
      tags: ["pectoraux", "isolation", "cable", "finition"]
    },
    {
      n: "Pec deck / Butterfly",
      m: "Pectoraux",
      eq: "Machine pec deck",
      sets: "3\u00d712-15",
      rest: "60s",
      desc: "Assis a la machine, ramener les bras devant la poitrine en arc de cercle.",
      tips: ["Coudes en ligne avec les epaules", "Amplitude maximale pour l'etirement", "Ideal pour finition et congestion"],
      lv: 1,
      tags: ["pectoraux", "machine", "isolation", "finition"]
    },
    {
      n: "Pompes decline",
      m: "Pectoraux inferieurs",
      eq: "Poids du corps + banc",
      sets: "3\u00d712-20",
      rest: "60s",
      desc: "Pieds sureleves sur un banc, pompes en position declinee.",
      tips: ["Plus les pieds sont hauts, plus le bas de pec est cible", "Corps parfaitement gaine", "Excellent sans materiel"],
      lv: 2,
      tags: ["pectoraux", "poids du corps"]
    },
    {
      n: "Ecarte cable croise",
      m: "Pectoraux",
      eq: "Cable poulie moyenne",
      sets: "3\u00d715",
      rest: "60s",
      desc: "Poulies a hauteur des epaules, croiser les cables devant la poitrine.",
      tips: ["Permet une tension constante contrairement aux halteres", "Sentir le stretch a chaque rep", "Angle modifiable pour cibler haut/bas"],
      lv: 2,
      tags: ["pectoraux", "cable", "isolation"]
    },
    {
      n: "Pompes plyometriques",
      m: "Pectoraux / Puissance",
      eq: "Poids du corps",
      sets: "4\u00d76-8",
      rest: "90s",
      desc: "Pompes explosives avec decollement des mains du sol en haut du mouvement.",
      tips: ["Atterrir en douceur avec legere flexion des coudes", "Excellent pour la puissance explosive", "Ne pas faire sous fatigue extreme"],
      lv: 3,
      tags: ["pectoraux", "puissance", "explosif", "poids du corps"]
    }
  ],

  // ─── DOS ───
  back: [
    {
      n: "Tractions pronation",
      m: "Grand dorsal",
      eq: "Barre de traction",
      sets: "4\u00d76-10",
      rest: "90s",
      video: "https://www.youtube.com/results?search_query=tractions+pull+ups+exercise+animation+tutorial&sp=EgIYAQ%253D%253D",
      desc: "Suspendre a la barre, mains en pronation, tirer le menton au-dessus de la barre.",
      tips: ["Largeur des mains superieure aux epaules", "Ne pas balancer le corps", "Descendre completement"],
      lv: 3,
      tags: ["dos", "biceps", "compose"]
    },
    {
      n: "Rowing barre",
      m: "Dos / Rhomboides",
      eq: "Barre",
      sets: "4\u00d78-12",
      rest: "90s",
      video: "https://www.youtube.com/results?search_query=rowing+barre+barbell+row+exercise+animation+tutorial&sp=EgIYAQ%253D%253D",
      desc: "Penche a 45 degres, tirer la barre vers le nombril en serrant les omoplates.",
      tips: ["Dos droit, ne pas arrondir", "Tirer avec les coudes", "Serrer les omoplates en haut", "Gainage abdominal permanent pour proteger les lombaires"],
      lv: 2,
      tags: ["dos", "biceps", "force"]
    },
    {
      n: "Tirage vertical",
      m: "Grand dorsal",
      eq: "Poulie haute",
      sets: "4\u00d710-12",
      rest: "90s",
      video: "https://www.youtube.com/results?search_query=tirage+vertical+lat+pulldown+exercise+animation+tutorial&sp=EgIYAQ%253D%253D",
      desc: "Assis a la poulie haute, tirer la barre vers le haut de la poitrine.",
      tips: ["Ne pas tirer derriere la nuque", "Garder le buste legerement incline", "Sentir le dos travailler"],
      lv: 1,
      tags: ["dos", "biceps", "machine"]
    },
    {
      n: "Rowing haltere unilateral",
      m: "Grand dorsal",
      eq: "Haltere + banc",
      sets: "4\u00d710-12",
      rest: "90s",
      video: "https://www.youtube.com/results?search_query=rowing+haltere+one+arm+dumbbell+row+exercise+animation+tutorial&sp=EgIYAQ%253D%253D",
      desc: "Un genou et une main sur le banc, tirer l'haltere vers la hanche.",
      tips: ["Dos parallele au sol", "Tirer le coude vers le plafond", "Controler la descente"],
      lv: 2,
      tags: ["dos", "biceps", "unilateral"]
    },
    {
      n: "Souleve de terre",
      m: "Chaine posterieure",
      eq: "Barre",
      sets: "4\u00d75-8",
      rest: "120s",
      video: "https://www.youtube.com/results?search_query=souleve+de+terre+deadlift+exercise+animation+tutorial&sp=EgIYAQ%253D%253D",
      warn: "Hernie discale = STOP. Dos PLAT obligatoire — la moindre flexion lombaire sous charge = risque disque",
      desc: "Saisir la barre au sol, se relever en poussant avec les jambes et en gardant le dos droit.",
      tips: ["Dos plat obligatoire — flexion lombaire = hernie discale", "Ne jamais arrondir le bas du dos", "Barre au contact des tibias", "Pousser avec les jambes d'abord"],
      lv: 3,
      tags: ["dos", "jambes", "fessiers", "force"]
    },
    {
      n: "Face pull",
      m: "Arriere d'epaule / Rhomboides",
      eq: "Poulie + corde",
      sets: "3\u00d715-20",
      rest: "45s",
      video: "https://www.youtube.com/results?search_query=face+pull+exercise+animation+tutorial&sp=EgIYAQ%253D%253D",
      desc: "Tirer la corde vers le visage en ecartant les mains, coudes hauts.",
      tips: ["Coudes au niveau des epaules", "Serrer les omoplates", "Excellent pour la posture"],
      lv: 1,
      tags: ["dos", "epaules", "posture"]
    },
    {
      n: "Pulldown prise serree",
      m: "Grand dorsal",
      eq: "Poulie haute + triangle",
      sets: "3\u00d710-12",
      rest: "60s",
      video: "https://www.youtube.com/results?search_query=pulldown+prise+serree+close+grip+pulldown+exercise+animation+tutorial&sp=EgIYAQ%253D%253D",
      desc: "Assis a la poulie, tirer la poignee triangle vers la poitrine.",
      tips: ["Prise neutre pour cibler le grand dorsal", "Garder les coudes pres du corps", "Etirer en haut"],
      lv: 1,
      tags: ["dos", "biceps", "machine"]
    },
    {
      n: "Rowing T-bar",
      m: "Dos / Epaisseur",
      eq: "T-bar ou landmine",
      sets: "4\u00d78-12",
      rest: "90s",
      video: "https://www.youtube.com/results?search_query=rowing+t-bar+t+bar+row+exercise+animation+tutorial&sp=EgIYAQ%253D%253D",
      desc: "Penche au-dessus de la barre en T, tirer vers la poitrine.",
      tips: ["Dos droit et gaine", "Excellent pour l'epaisseur du dos", "Tirer les coudes en arriere"],
      lv: 2,
      tags: ["dos", "biceps", "force"]
    },
    {
      n: "Superman au sol",
      m: "Lombaires / Erecteurs",
      eq: "Poids du corps",
      sets: "3\u00d715-20",
      rest: "45s",
      video: "https://www.youtube.com/results?search_query=superman+back+exercise+animation+tutorial&sp=EgIYAQ%253D%253D",
      desc: "Allonge face au sol, lever simultanement les bras et les jambes.",
      tips: ["Ne pas hyper-etendre le cou", "Contracter les fessiers", "Maintenir 2-3 secondes en haut"],
      lv: 1,
      tags: ["dos", "lombaires", "poids du corps"]
    },
    {
      n: "Straight-arm pulldown",
      m: "Grand dorsal (stretch)",
      eq: "Cable poulie haute",
      sets: "3\u00d715",
      rest: "60s",
      desc: "Debout face a la poulie haute, bras tendus, tirer le cable vers les cuisses.",
      tips: ["Bras tendus tout le long", "Isolation parfaite du grand dorsal", "Excellent exercice de finition"],
      lv: 2,
      tags: ["dos", "dorsaux", "cable", "isolation"]
    },
    {
      n: "Pendlay row",
      m: "Dos (puissance)",
      eq: "Barre",
      sets: "4\u00d75-6",
      rest: "120s",
      desc: "Barre au sol, dos horizontal a 90 degres. Tirer explosif vers les abdos, reposer au sol a chaque rep.",
      tips: ["Barre au sol entre chaque rep — pas de triche", "Explosif a la montee", "Excellent pour la force du dos"],
      lv: 3,
      tags: ["dos", "force", "puissance", "compose"]
    },
    {
      n: "Traction prise neutre",
      m: "Grand dorsal / Biceps",
      eq: "Barre ou poignees neutres",
      sets: "4\u00d76-10",
      rest: "90s",
      desc: "Prise neutre (paumes se font face), traction complete jusqu'au menton.",
      tips: ["Intermediaire entre supination et pronation", "Moins de stress sur les coudes", "Excellent pour les coudes sensibles"],
      lv: 3,
      tags: ["dos", "biceps", "compose", "poids du corps"]
    },
    {
      n: "Rowing assis cable prise large",
      m: "Rhomboides / Trapezes moyens",
      eq: "Cable poulie basse + triangle large",
      sets: "3\u00d712-15",
      rest: "60s",
      desc: "Assis a la poulie basse, prise large, tirer vers le bas de la poitrine.",
      tips: ["Coudes evases pour cibler les rhomboides", "Different du rowing prise serree (dorsaux)", "Ideal pour l'epaisseur du dos"],
      lv: 2,
      tags: ["dos", "rhomboides", "trapezes", "cable"]
    },
    {
      n: "T-bar row",
      m: "Dorsaux / Rhomboides",
      eq: "T-bar machine ou barre en angle",
      sets: "4\u00d78-12",
      rest: "90s",
      desc: "Buste penche a 45 degres, saisir le T-bar, tirer vers la poitrine.",
      tips: ["Buste fixe a 45 degres", "Tirer les coudes vers l'arriere", "Amplitude complete — etirer les dorsaux en bas"],
      lv: 2,
      tags: ["dos", "dorsaux", "force", "compose"]
    }
  ],

  // ─── EPAULES ───
  shoulders: [
    {
      n: "Developpe militaire",
      m: "Deltoides anterieurs",
      eq: "Barre",
      sets: "4\u00d78-10",
      rest: "90s",
      video: "https://www.youtube.com/results?search_query=developpe+militaire+overhead+press+exercise+animation+tutorial&sp=EgIYAQ%253D%253D",
      warn: "Eviter si conflit sous-acromial ou tendinite coiffe des rotateurs",
      desc: "Debout ou assis, pousser la barre au-dessus de la tete.",
      tips: ["Gainer les abdos et les fessiers", "Ne pas arquer le dos", "Barre devant le visage", "Ne pas verrouiller les coudes en haut"],
      lv: 3,
      tags: ["epaules", "triceps", "force"]
    },
    {
      n: "Elevations laterales",
      m: "Deltoides lateraux",
      eq: "Halteres",
      sets: "4\u00d712-15",
      rest: "60s",
      video: "https://www.youtube.com/results?search_query=elevations+laterales+lateral+raises+exercise+animation+tutorial&sp=EgIYAQ%253D%253D",
      desc: "Debout, lever les halteres sur les cotes jusqu'a hauteur d'epaules.",
      tips: ["Legere flexion des coudes", "Lever max 90 degres — depasser la parallele = conflit sous-acromial", "Controler la descente"],
      lv: 1,
      tags: ["epaules", "isolation"]
    },
    {
      n: "Oiseau (rear delt fly)",
      m: "Deltoides posterieurs",
      eq: "Halteres",
      sets: "3\u00d715-20",
      rest: "45s",
      video: "https://www.youtube.com/results?search_query=oiseau+rear+delt+fly+exercise+animation+tutorial&sp=EgIYAQ%253D%253D",
      desc: "Penche en avant, ouvrir les bras lateralement en serrant les omoplates.",
      tips: ["Buste a 45-90 degres", "Pouces vers le bas pour cibler l'arriere", "Mouvement lent et controle"],
      lv: 2,
      tags: ["epaules", "dos", "isolation"]
    },
    {
      n: "Shrug (haussement d'epaules)",
      m: "Trapezes",
      eq: "Halteres ou barre",
      sets: "4\u00d712-15",
      rest: "60s",
      video: "https://www.youtube.com/results?search_query=shrug+trapezes+dumbbell+shrugs+exercise+animation+tutorial&sp=EgIYAQ%253D%253D",
      desc: "Debout, hausser les epaules vers les oreilles en tenant les poids.",
      tips: ["Ne pas rouler les epaules", "Maintenir 2s en haut", "Poids lourds possibles"],
      lv: 1,
      tags: ["trapezes", "epaules", "isolation"]
    },
    {
      n: "Face pull epaules",
      m: "Deltoides posterieurs",
      eq: "Poulie + corde",
      sets: "3\u00d715-20",
      rest: "45s",
      video: "https://www.youtube.com/results?search_query=face+pull+shoulders+exercise+animation+tutorial&sp=EgIYAQ%253D%253D",
      desc: "A la poulie, tirer la corde vers le visage, coudes hauts, rotation externe.",
      tips: ["Rotation externe en fin de mouvement", "Coudes au niveau des oreilles", "Excellent pour la sante des epaules"],
      lv: 1,
      tags: ["epaules", "posture", "prevention"]
    },
    {
      n: "Arnold press",
      m: "Deltoides (tous faisceaux)",
      eq: "Halteres",
      sets: "3\u00d710-12",
      rest: "60s",
      video: "https://www.youtube.com/results?search_query=arnold+press+exercise+animation+tutorial&sp=EgIYAQ%253D%253D",
      desc: "Assis, partir halteres devant le visage en supination, rotation et pousser au-dessus.",
      tips: ["Rotation fluide pendant la montee", "Controler le mouvement", "Ne pas se cambrer"],
      lv: 3,
      tags: ["epaules", "triceps", "compose"]
    },
    {
      n: "Elevations frontales",
      m: "Deltoides anterieurs",
      eq: "Halteres ou disque",
      sets: "3\u00d712-15",
      rest: "45s",
      video: "https://www.youtube.com/results?search_query=elevations+frontales+front+raises+exercise+animation+tutorial&sp=EgIYAQ%253D%253D",
      desc: "Debout, lever les halteres devant soi jusqu'a hauteur d'epaules.",
      tips: ["Bras legerement flechis", "Alterner ou simultane", "Ne pas utiliser l'elan"],
      lv: 1,
      tags: ["epaules", "isolation"]
    },
    {
      n: "Upright row (tirage menton)",
      m: "Deltoides / Trapezes",
      eq: "Barre ou halteres",
      sets: "3\u00d710-12",
      rest: "60s",
      video: "https://www.youtube.com/results?search_query=tirage+menton+upright+row+exercise+animation+tutorial&sp=EgIYAQ%253D%253D",
      warn: "Risque conflit sous-acromial si monte trop haut — preferer face pull",
      desc: "Debout, tirer la barre le long du corps jusqu'au menton.",
      tips: ["Prise large pour cibler les deltoides", "Ne pas monter trop haut si douleur", "Coudes toujours au-dessus des mains"],
      lv: 2,
      tags: ["epaules", "trapezes", "compose"]
    },
    {
      n: "Elevation frontale cable",
      m: "Deltoide anterieur",
      eq: "Cable poulie basse",
      sets: "3\u00d712-15",
      rest: "60s",
      desc: "Cable bas, lever le bras droit devant soi jusqu'a la parallele.",
      tips: ["Tension constante vs haltere (cable superieur)", "Lever jusqu'a hauteur des epaules seulement", "Alterner ou simultane"],
      lv: 2,
      tags: ["epaules", "deltoides", "cable", "isolation"]
    },
    {
      n: "Oiseau halteres rear delt",
      m: "Deltoide posterieur",
      eq: "Halteres",
      sets: "4\u00d715-20",
      rest: "60s",
      desc: "Buste penche a 90 degres, bras pendants, lever les halteres sur les cotes.",
      tips: ["Legere flexion des coudes", "Pointer les coudes vers le plafond", "Deltoide posterieur tres souvent neglige"],
      lv: 2,
      tags: ["epaules", "deltoides-posterieurs", "posture"]
    },
    {
      n: "Lu raise",
      m: "Deltoides / Coiffe",
      eq: "Halteres tres legers",
      sets: "3\u00d710-15",
      rest: "45s",
      desc: "Combine : elevation frontale + laterale + rotation. Mouvement en Y.",
      tips: ["Poids tres leger (2-5 kg max)", "Renforce la coiffe en position d'etirement", "Popularise par Lu Xiaojun"],
      lv: 2,
      tags: ["epaules", "coiffe", "prehab-avance"]
    },
    {
      n: "Shrugs halteres",
      m: "Trapezes superieurs",
      eq: "Halteres",
      sets: "4\u00d715",
      rest: "60s",
      desc: "Debout, halteres aux flancs, hausser les epaules au maximum.",
      tips: ["Mouvement vertical — pas de rotation", "Pause 1 seconde en haut", "Ne pas rouler les epaules"],
      lv: 1,
      tags: ["epaules", "trapezes", "isolation"]
    },
    {
      n: "Developpe militaire halteres",
      m: "Deltoide anterieur / Triceps",
      eq: "Halteres",
      sets: "4\u00d78-12",
      rest: "90s",
      desc: "Assis ou debout, pousser les halteres de l'epaule vers le haut.",
      tips: ["Plus grande amplitude qu'a la barre", "Coudes legerement en avant du corps", "Variante plus stable pour les epaules"],
      lv: 2,
      tags: ["epaules", "force", "compose"]
    }
  ],

  // ─── BICEPS ───
  biceps: [
    {
      n: "Curl barre droite",
      m: "Biceps",
      eq: "Barre droite",
      sets: "4\u00d710-12",
      rest: "75s",
      video: "https://www.youtube.com/results?search_query=curl+barre+barbell+curl+exercise+animation+tutorial&sp=EgIYAQ%253D%253D",
      desc: "Debout, flechir les coudes pour monter la barre vers les epaules.",
      tips: ["Coudes fixes le long du corps", "Ne pas balancer le buste", "Controler la descente"],
      lv: 1,
      tags: ["biceps", "avant-bras", "force"]
    },
    {
      n: "Curl halteres alterne",
      m: "Biceps",
      eq: "Halteres",
      sets: "3\u00d710-12",
      rest: "60s",
      video: "https://www.youtube.com/results?search_query=curl+halteres+alternating+dumbbell+curl+exercise+animation+tutorial&sp=EgIYAQ%253D%253D",
      desc: "Debout, flechir un bras a la fois en supination.",
      tips: ["Supination en montant", "Alterner les bras", "Pas de triche avec le dos"],
      lv: 1,
      tags: ["biceps", "isolation", "unilateral"]
    },
    {
      n: "Curl marteau",
      m: "Brachial / Brachio-radial",
      eq: "Halteres",
      sets: "3\u00d710-12",
      rest: "60s",
      video: "https://www.youtube.com/results?search_query=curl+marteau+hammer+curl+exercise+animation+tutorial&sp=EgIYAQ%253D%253D",
      desc: "Debout, halteres en prise neutre (pouces vers le haut), flechir les coudes.",
      tips: ["Prise neutre tout le long", "Excellent pour l'epaisseur du bras", "Coudes fixes"],
      lv: 1,
      tags: ["biceps", "avant-bras", "isolation"]
    },
    {
      n: "Curl concentre",
      m: "Biceps (pic)",
      eq: "Haltere",
      sets: "3\u00d710-12",
      rest: "45s",
      video: "https://www.youtube.com/results?search_query=curl+concentre+concentration+curl+exercise+animation+tutorial&sp=EgIYAQ%253D%253D",
      desc: "Assis, coude appuye a l'interieur de la cuisse, flechir le bras.",
      tips: ["Mouvement tres strict", "Serrer en haut 2 secondes", "Ideal pour le pic du biceps"],
      lv: 2,
      tags: ["biceps", "isolation", "pic"]
    },
    {
      n: "Curl pupitre (Larry Scott)",
      m: "Biceps (portion courte)",
      eq: "Barre EZ + pupitre",
      sets: "3\u00d710-12",
      rest: "60s",
      video: "https://www.youtube.com/results?search_query=curl+pupitre+preacher+curl+exercise+animation+tutorial&sp=EgIYAQ%253D%253D",
      desc: "Bras poses sur le pupitre, flechir les coudes avec la barre EZ.",
      tips: ["Ne pas hyper-etendre en bas", "Mouvement strict", "Cibler la portion courte du biceps"],
      lv: 2,
      tags: ["biceps", "isolation"]
    },
    {
      n: "Curl 21s",
      m: "Biceps (complet)",
      eq: "Barre EZ ou halteres",
      sets: "3\u00d721 (7+7+7)",
      rest: "90s",
      video: "https://www.youtube.com/results?search_query=curl+21s+biceps+exercise+animation+tutorial&sp=EgIYAQ%253D%253D",
      desc: "7 reps moitie basse, 7 reps moitie haute, 7 reps amplitude complete.",
      tips: ["Ne pas tricher sur la forme", "Brulure intense normale", "Charge moderee"],
      lv: 3,
      tags: ["biceps", "intensification", "avance"]
    },
    {
      n: "Chin-ups (traction supination)",
      m: "Biceps / Grand dorsal",
      eq: "Barre de traction",
      sets: "3\u00d76-10",
      rest: "90s",
      video: "https://www.youtube.com/results?search_query=chin+ups+traction+supination+exercise+animation+tutorial&sp=EgIYAQ%253D%253D",
      desc: "Suspendre a la barre en supination, tirer le menton au-dessus de la barre.",
      tips: ["Prise en supination largeur des epaules", "Excellent pour les biceps et le dos", "Descendre completement"],
      lv: 3,
      tags: ["biceps", "dos", "compose"]
    },
    {
      n: "Curl elastique",
      m: "Biceps",
      eq: "Bande elastique",
      sets: "3\u00d715-20",
      rest: "45s",
      video: "https://www.youtube.com/results?search_query=curl+elastique+resistance+band+curl+exercise+animation+tutorial&sp=EgIYAQ%253D%253D",
      desc: "Debout sur la bande, flechir les coudes contre la resistance.",
      tips: ["Tension constante", "Parfait en finition ou en voyage", "Varier les resistances"],
      lv: 1,
      tags: ["biceps", "elastique", "debutant"]
    },
    {
      n: "Curl incline halteres",
      m: "Biceps (chef long)",
      eq: "Halteres + banc incline",
      sets: "3\u00d710-12",
      rest: "75s",
      desc: "Allonge sur banc incline a 60 degres, bras pendant dans le vide. Curler les halteres.",
      tips: ["Etirement maximal du chef long", "Ne pas balancer les bras", "Tension des le depart de l'etirement"],
      lv: 2,
      tags: ["biceps", "chef-long", "etirement"]
    },
    {
      n: "Curl marteau cable",
      m: "Brachial / Brachio-radial",
      eq: "Cable poulie basse + corde",
      sets: "3\u00d712-15",
      rest: "60s",
      desc: "Corde a la poulie basse, curl en prise neutre (marteau).",
      tips: ["Tension constante du cable", "Ciblage du brachial sous le biceps", "Ameliore le thickness du bras"],
      lv: 1,
      tags: ["biceps", "brachial", "cable"]
    },
    {
      n: "Curl spider (araignee)",
      m: "Biceps (pic)",
      eq: "Barre EZ ou halteres + banc incline",
      sets: "3\u00d710-12",
      rest: "75s",
      desc: "Allonge face contre le banc incline a 45 degres, curler la barre en partant bras tendus.",
      tips: ["Coudes fixes devant le banc", "Mouvement tres strict — impossible de tricher", "Excellent pour le pic du biceps"],
      lv: 2,
      tags: ["biceps", "isolation", "strict"]
    }
  ],

  // ─── TRICEPS ───
  triceps: [
    {
      n: "Extensions triceps poulie haute",
      m: "Triceps",
      eq: "Poulie haute + barre ou corde",
      sets: "3\u00d712-15",
      rest: "60s",
      video: "https://www.youtube.com/results?search_query=extensions+triceps+tricep+pushdown+exercise+animation+tutorial&sp=EgIYAQ%253D%253D",
      desc: "Debout face a la poulie, etendre les bras vers le bas en gardant les coudes fixes.",
      tips: ["Coudes colles au corps", "Ne pas utiliser les epaules", "Serrer en bas"],
      lv: 1,
      tags: ["triceps", "isolation", "machine"]
    },
    {
      n: "Dips banc",
      m: "Triceps",
      eq: "Banc ou chaise",
      sets: "3\u00d712-15",
      rest: "60s",
      video: "https://www.youtube.com/results?search_query=dips+banc+bench+dips+triceps+exercise+animation+tutorial&sp=EgIYAQ%253D%253D",
      desc: "Mains sur le banc derriere soi, descendre les fesses puis remonter.",
      tips: ["Coudes vers l'arriere", "Ne pas descendre trop bas si douleur", "Jambes tendues pour plus de difficulte"],
      lv: 1,
      tags: ["triceps", "poids du corps", "debutant"]
    },
    {
      n: "Skull crushers (barre front)",
      m: "Triceps (longue portion)",
      eq: "Barre EZ + banc",
      sets: "4\u00d710-12",
      rest: "75s",
      video: "https://www.youtube.com/results?search_query=skull+crushers+exercise+animation+tutorial&sp=EgIYAQ%253D%253D",
      desc: "Allonge sur le banc, descendre la barre vers le front puis etendre les bras.",
      tips: ["Coudes fixes pointant vers le plafond", "Descendre vers le front, pas la poitrine", "Charge moderee pour la securite"],
      lv: 2,
      tags: ["triceps", "isolation", "longue portion"]
    },
    {
      n: "Pushdown corde",
      m: "Triceps",
      eq: "Poulie + corde",
      sets: "3\u00d712-15",
      rest: "45s",
      video: "https://www.youtube.com/results?search_query=pushdown+corde+rope+pushdown+triceps+exercise+animation+tutorial&sp=EgIYAQ%253D%253D",
      desc: "A la poulie haute, ecarter la corde en bas du mouvement.",
      tips: ["Ecarter les mains en bas pour contracter", "Coudes fixes", "Excellent en finition"],
      lv: 1,
      tags: ["triceps", "isolation", "machine"]
    },
    {
      n: "Kickback triceps",
      m: "Triceps",
      eq: "Haltere",
      sets: "3\u00d712-15",
      rest: "45s",
      video: "https://www.youtube.com/results?search_query=kickback+triceps+tricep+kickback+exercise+animation+tutorial&sp=EgIYAQ%253D%253D",
      desc: "Penche en avant, bras le long du corps, etendre l'avant-bras vers l'arriere.",
      tips: ["Bras immobile, seul l'avant-bras bouge", "Serrer en haut 1 seconde", "Charge legere, execution parfaite"],
      lv: 1,
      tags: ["triceps", "isolation", "unilateral"]
    },
    {
      n: "Developpe couche prise serree",
      m: "Triceps / Pectoraux",
      eq: "Barre + banc",
      sets: "4\u00d78-10",
      rest: "90s",
      video: "https://www.youtube.com/results?search_query=developpe+couche+prise+serree+close+grip+bench+press+exercise+animation+tutorial&sp=EgIYAQ%253D%253D",
      desc: "Developpe couche avec les mains rapprochees (largeur des epaules).",
      tips: ["Prise a largeur d'epaules", "Coudes pres du corps", "Excellent pour la masse des triceps"],
      lv: 2,
      tags: ["triceps", "pectoraux", "compose"]
    },
    {
      n: "Extension overhead haltere",
      m: "Triceps (longue portion)",
      eq: "Haltere",
      sets: "3\u00d710-12",
      rest: "60s",
      video: "https://www.youtube.com/results?search_query=extension+overhead+triceps+overhead+extension+exercise+animation+tutorial&sp=EgIYAQ%253D%253D",
      desc: "Assis ou debout, tenir un haltere a deux mains au-dessus de la tete, flechir les coudes.",
      tips: ["Coudes pointant vers le plafond", "Descendre lentement derriere la tete", "Cibler la longue portion"],
      lv: 2,
      tags: ["triceps", "isolation", "longue portion"]
    },
    {
      n: "Pompes diamant (triceps)",
      m: "Triceps / Pectoraux",
      eq: "Poids du corps",
      sets: "3\u00d710-15",
      rest: "60s",
      video: "https://www.youtube.com/results?search_query=pompes+diamant+diamond+push+ups+triceps+exercise+animation+tutorial&sp=EgIYAQ%253D%253D",
      desc: "Pompes avec les mains rapprochees formant un losange.",
      tips: ["Mains sous la poitrine", "Corps parfaitement gaine", "Alternative aux dips"],
      lv: 2,
      tags: ["triceps", "pectoraux", "poids du corps"]
    },
    {
      n: "JM Press",
      m: "Triceps (chef long)",
      eq: "Barre EZ + banc",
      sets: "4\u00d78-10",
      rest: "90s",
      desc: "Developpe couche prise serree, amener la barre vers le front en pliant les coudes.",
      tips: ["Hybride entre developpe et extension triceps", "Charge lourde possible", "Excellent pour la masse triceps"],
      lv: 3,
      tags: ["triceps", "force", "masse", "compose"]
    },
    {
      n: "Extension triceps cable corde",
      m: "Triceps (tous les chefs)",
      eq: "Cable poulie haute + corde",
      sets: "3\u00d712-15",
      rest: "60s",
      desc: "Corde a la poulie haute, pousser vers le bas en ecartant la corde en bas.",
      tips: ["Ecarter la corde en bas pour finition maximale", "Coudes contre le corps", "Tension constante du cable"],
      lv: 1,
      tags: ["triceps", "cable", "isolation", "finition"]
    },
    {
      n: "Barre au front skullcrusher",
      m: "Triceps (chefs lateral et medial)",
      eq: "Barre EZ + banc",
      sets: "4\u00d710-12",
      rest: "75s",
      desc: "Allonge, descendre la barre vers le front en pliant les coudes.",
      tips: ["Descendre jusqu'au front ou derriere la tete pour plus de stretch", "Coudes vers l'interieur", "Ne pas verrouiller completement"],
      lv: 2,
      tags: ["triceps", "masse", "isolation"]
    }
  ],

  // ─── JAMBES ───
  legs: [
    {
      n: "Squat barre",
      m: "Quadriceps / Fessiers",
      eq: "Barre + rack",
      sets: "4\u00d78-12",
      rest: "120s",
      video: "https://www.youtube.com/results?search_query=squat+barre+barbell+squat+exercise+animation+tutorial&sp=EgIYAQ%253D%253D",
      desc: "Barre sur les trapezes, descendre en flechissant les genoux et les hanches.",
      tips: ["Genoux dans l'axe des 2e/3e orteils", "Descendre au moins a la parallele", "Dos droit, regard devant", "Talon a plat — si impossible = mobilite cheville insuffisante", "Wink pelvien (retroversion en bas) = flexion insuffisante"],
      lv: 2,
      tags: ["jambes", "fessiers", "force", "compose"]
    },
    {
      n: "Presse a cuisses",
      m: "Quadriceps / Fessiers",
      eq: "Presse a cuisses",
      sets: "4\u00d710-12",
      rest: "90s",
      video: "https://www.youtube.com/results?search_query=presse+cuisses+leg+press+exercise+animation+tutorial&sp=EgIYAQ%253D%253D",
      desc: "Assis a la presse, pousser la plateforme avec les pieds.",
      tips: ["Pieds a largeur d'epaules", "Ne pas verrouiller les genoux", "Descendre a 90 degres"],
      lv: 1,
      tags: ["jambes", "fessiers", "machine"]
    },
    {
      n: "Fentes avant",
      m: "Quadriceps / Fessiers",
      eq: "Halteres ou barre",
      sets: "3\u00d710-12 par jambe",
      rest: "90s",
      video: "https://www.youtube.com/results?search_query=fentes+avant+forward+lunges+exercise+animation+tutorial&sp=EgIYAQ%253D%253D",
      desc: "Faire un grand pas en avant, descendre le genou arriere vers le sol.",
      tips: ["Genou avant ne depasse pas les orteils", "Buste droit", "Pousser avec le talon avant"],
      lv: 2,
      tags: ["jambes", "fessiers", "unilateral"]
    },
    {
      n: "Leg curl (ischios)",
      m: "Ischio-jambiers",
      eq: "Machine leg curl",
      sets: "3\u00d712-15",
      rest: "60s",
      video: "https://www.youtube.com/results?search_query=leg+curl+hamstring+curl+exercise+animation+tutorial&sp=EgIYAQ%253D%253D",
      desc: "Allonge ou assis a la machine, flechir les genoux pour ramener les talons vers les fesses.",
      tips: ["Mouvement controle", "Ne pas decoller les hanches", "Serrer en haut"],
      lv: 1,
      tags: ["jambes", "ischio-jambiers", "isolation"]
    },
    {
      n: "Leg extension (quadriceps)",
      m: "Quadriceps",
      eq: "Machine leg extension",
      sets: "3\u00d712-15",
      rest: "60s",
      video: "https://www.youtube.com/results?search_query=leg+extension+quadriceps+exercise+animation+tutorial&sp=EgIYAQ%253D%253D",
      warn: "Deconseille si tendinopathie rotulienne active ou LCA fragilise — preferer Terminal leg extension",
      desc: "Assis a la machine, etendre les jambes vers l'avant.",
      tips: ["Ne pas utiliser d'elan", "Contracter les quadriceps en haut", "Mouvement lent"],
      lv: 1,
      tags: ["jambes", "quadriceps", "isolation"]
    },
    {
      n: "Squat bulgare",
      m: "Quadriceps / Fessiers",
      eq: "Halteres + banc",
      sets: "3\u00d78-12 par jambe",
      rest: "60s",
      video: "https://www.youtube.com/results?search_query=squat+bulgare+bulgarian+split+squat+exercise+animation+tutorial&sp=EgIYAQ%253D%253D",
      desc: "Pied arriere sureleve sur un banc, descendre en squat unilateral.",
      tips: ["Pied avant suffisamment en avant", "Buste legerement penche", "Excellent pour l'equilibre"],
      lv: 3,
      tags: ["jambes", "fessiers", "unilateral"]
    },
    {
      n: "Mollets debout",
      m: "Mollets (gastrocnemien)",
      eq: "Machine ou marche",
      sets: "4\u00d715-20",
      rest: "45s",
      video: "https://www.youtube.com/results?search_query=mollets+debout+standing+calf+raise+exercise+animation+tutorial&sp=EgIYAQ%253D%253D",
      desc: "Debout sur une marche, monter sur la pointe des pieds puis descendre.",
      tips: ["Amplitude complete", "Pause en bas pour etirer", "Frequence elevee"],
      lv: 1,
      tags: ["mollets", "isolation"]
    },
    {
      n: "Pistol squat",
      m: "Quadriceps / Equilibre",
      eq: "Poids du corps",
      sets: "3\u00d75-8 par jambe",
      rest: "90s",
      video: "https://www.youtube.com/results?search_query=pistol+squat+exercise+animation+tutorial&sp=EgIYAQ%253D%253D",
      warn: "Contre-indique si douleur rotulienne ou syndrome femoro-patellaire",
      desc: "Squat sur une jambe, l'autre jambe tendue devant soi.",
      tips: ["Commencer avec un support", "Exige force et mobilite", "Exercice avance", "Ne pas forcer si douleur rotulienne"],
      lv: 4,
      tags: ["jambes", "equilibre", "avance", "poids du corps"]
    },
    {
      n: "Hack squat machine",
      m: "Quadriceps",
      eq: "Machine hack squat",
      sets: "4\u00d710-12",
      rest: "90s",
      video: "https://www.youtube.com/results?search_query=hack+squat+machine+exercise+animation+tutorial&sp=EgIYAQ%253D%253D",
      desc: "Dos contre le dossier de la machine, descendre en squat guide.",
      tips: ["Pieds bas sur la plateforme pour les quadriceps", "Pieds hauts pour les fessiers", "Mouvement guide et securise"],
      lv: 2,
      tags: ["jambes", "quadriceps", "machine"]
    },
    {
      n: "Romanian deadlift (RDL)",
      m: "Ischio-jambiers / Fessiers",
      eq: "Barre ou halteres",
      sets: "4\u00d78-12",
      rest: "90s",
      desc: "Debout, barre aux hanches, descendre en gardant les jambes semi-flechies jusqu'au tibia.",
      tips: ["Dos plat obligatoire", "Sentir l'etirement des ischios", "Barre contre les jambes tout le long"],
      lv: 2,
      tags: ["jambes", "ischios", "fessiers", "compose"]
    },
    {
      n: "Leg press pied haut",
      m: "Fessiers / Ischios",
      eq: "Presse a cuisses",
      sets: "4\u00d710-12",
      rest: "90s",
      desc: "Pieds hauts sur la plateforme, descendre profondement. Variation fessier/ischios.",
      tips: ["Pieds a mi-hauteur de la plateforme", "Descente profonde", "Genoux dans l'axe des orteils"],
      lv: 1,
      tags: ["jambes", "fessiers", "ischios", "machine"]
    },
    {
      n: "Step-up halteres",
      m: "Quadriceps / Fessiers",
      eq: "Halteres + banc/step",
      sets: "3\u00d710-12 par jambe",
      rest: "60s",
      desc: "Monter sur le banc avec une jambe, amener l'autre genou en haut.",
      tips: ["Pousser depuis le talon de la jambe qui monte", "Controler la descente", "Excellent pour equilibre et genoux"],
      lv: 2,
      tags: ["jambes", "fessiers", "unilateral", "fonctionnel"]
    },
    {
      n: "Sissy squat",
      m: "Quadriceps (isolation)",
      eq: "Poids du corps (support)",
      sets: "3\u00d712-15",
      rest: "60s",
      desc: "Debout, se tenir a un support, descendre en laissant les genoux aller loin en avant.",
      tips: ["Pointes de pieds relevees", "Stretch intense des quadriceps", "Progresser avec lest"],
      lv: 3,
      tags: ["jambes", "quadriceps", "isolation", "avance"]
    },
    {
      n: "Goblet squat",
      m: "Quadriceps / Fessiers",
      eq: "Haltere ou kettlebell",
      sets: "3\u00d712-15",
      rest: "60s",
      desc: "Tenir l'haltere a la poitrine, squat profond avec les coudes entre les genoux.",
      tips: ["Excellent pour apprendre le squat profond", "Coudes poussent les genoux vers l'exterieur", "Ideal debutants et mobilite cheville"],
      lv: 1,
      tags: ["jambes", "fessiers", "debutant", "mobilite"]
    }
  ],

  // ─── FESSIERS ───
  glutes: [
    {
      n: "Hip thrust",
      m: "Grand fessier",
      eq: "Barre + banc",
      sets: "4\u00d710-12",
      rest: "90s",
      video: "https://www.youtube.com/results?search_query=hip+thrust+exercise+animation+tutorial&sp=EgIYAQ%253D%253D",
      desc: "Dos appuye sur le banc, barre sur les hanches, pousser les hanches vers le plafond.",
      tips: ["Serrer les fessiers en haut", "Menton vers la poitrine", "Pause de 2s en haut"],
      lv: 2,
      tags: ["fessiers", "force"]
    },
    {
      n: "Fentes arriere",
      m: "Fessiers / Quadriceps",
      eq: "Halteres",
      sets: "3\u00d710-12 par jambe",
      rest: "60s",
      video: "https://www.youtube.com/results?search_query=fentes+arriere+reverse+lunges+exercise+animation+tutorial&sp=EgIYAQ%253D%253D",
      desc: "Faire un pas en arriere, descendre le genou vers le sol, remonter.",
      tips: ["Plus de stress sur les fessiers que les fentes avant", "Buste droit", "Controler le mouvement"],
      lv: 2,
      tags: ["fessiers", "jambes", "unilateral"]
    },
    {
      n: "Sumo squat",
      m: "Fessiers / Adducteurs",
      eq: "Haltere ou kettlebell",
      sets: "3\u00d712-15",
      rest: "60s",
      video: "https://www.youtube.com/results?search_query=sumo+squat+exercise+animation+tutorial&sp=EgIYAQ%253D%253D",
      desc: "Pieds tres ecartes, pointes vers l'exterieur, descendre en squat.",
      tips: ["Pieds 1.5x largeur d'epaules", "Genoux dans l'axe des pieds", "Cibler adducteurs et fessiers"],
      lv: 1,
      tags: ["fessiers", "adducteurs", "jambes"]
    },
    {
      n: "Step up",
      m: "Fessiers / Quadriceps",
      eq: "Banc ou box + halteres",
      sets: "3\u00d710-12 par jambe",
      rest: "60s",
      video: "https://www.youtube.com/results?search_query=step+up+exercise+animation+tutorial&sp=EgIYAQ%253D%253D",
      desc: "Monter sur une box ou un banc en poussant avec une jambe.",
      tips: ["Ne pas pousser avec le pied arriere", "Box a hauteur du genou", "Contracter le fessier en haut"],
      lv: 2,
      tags: ["fessiers", "jambes", "unilateral"]
    },
    {
      n: "Glute bridge",
      m: "Grand fessier",
      eq: "Poids du corps ou barre",
      sets: "3\u00d715-20",
      rest: "45s",
      video: "https://www.youtube.com/results?search_query=glute+bridge+exercise+animation+tutorial&sp=EgIYAQ%253D%253D",
      desc: "Allonge au sol, pieds a plat, pousser les hanches vers le plafond.",
      tips: ["Serrer les fessiers en haut", "Pieds a largeur de hanches", "Ideal pour les debutants"],
      lv: 1,
      tags: ["fessiers", "poids du corps", "debutant"]
    },
    {
      n: "Donkey kick",
      m: "Grand fessier",
      eq: "Poids du corps ou elastique",
      sets: "3\u00d715-20 par jambe",
      rest: "45s",
      video: "https://www.youtube.com/results?search_query=donkey+kick+glutes+exercise+animation+tutorial&sp=EgIYAQ%253D%253D",
      desc: "A quatre pattes, pousser un pied vers le plafond en gardant le genou a 90 degres.",
      tips: ["Ne pas arquer le dos", "Contracter le fessier en haut", "Ajouter un elastique pour plus de resistance"],
      lv: 1,
      tags: ["fessiers", "isolation", "poids du corps"]
    },
    {
      n: "Abduction machine",
      m: "Moyen fessier",
      eq: "Machine abduction",
      sets: "3\u00d715-20",
      rest: "45s",
      video: "https://www.youtube.com/results?search_query=hip+abduction+machine+exercise+animation+tutorial&sp=EgIYAQ%253D%253D",
      desc: "Assis a la machine, ecarter les genoux contre la resistance.",
      tips: ["Se pencher en avant pour cibler le moyen fessier", "Mouvement controle", "Serrer en position ouverte"],
      lv: 1,
      tags: ["fessiers", "moyen fessier", "machine"]
    },
    {
      n: "Souleve de terre roumain",
      m: "Fessiers / Ischio-jambiers",
      eq: "Barre ou halteres",
      sets: "4\u00d78-12",
      rest: "90s",
      video: "https://www.youtube.com/results?search_query=souleve+de+terre+roumain+romanian+deadlift+exercise+animation+tutorial&sp=EgIYAQ%253D%253D",
      desc: "Debout, descendre la barre le long des cuisses en poussant les hanches en arriere.",
      tips: ["Jambes quasi tendues", "Dos droit en permanence", "Sentir l'etirement des ischio-jambiers"],
      lv: 2,
      tags: ["fessiers", "ischio-jambiers", "chaine posterieure"]
    },
    {
      n: "Hip thrust barre",
      m: "Grand fessier",
      eq: "Barre + banc",
      sets: "4\u00d710-15",
      rest: "90s",
      desc: "Epaules sur le banc, barre sur les hanches, pousser vers le haut en contractant les fessiers.",
      tips: ["L'exercice ROI pour les fessiers (EMG le plus eleve)", "Menton vers la poitrine — ne pas hyperetendre le cou", "Pause 2 secondes en haut"],
      lv: 2,
      tags: ["fessiers", "force", "compose", "roi-fessiers"]
    },
    {
      n: "Hip thrust unilateral",
      m: "Grand fessier (unilateral)",
      eq: "Haltere ou barre + banc",
      sets: "3\u00d712 par cote",
      rest: "75s",
      desc: "Meme position que le hip thrust, mais sur une seule jambe.",
      tips: ["Correction asymetries fessieres", "Charge reduite vs bilateral", "Excellent pour sportifs"],
      lv: 3,
      tags: ["fessiers", "unilateral", "asymetrie"]
    },
    {
      n: "Kickback cable fessier",
      m: "Grand fessier",
      eq: "Cable cheville",
      sets: "3\u00d715 par jambe",
      rest: "45s",
      desc: "Cheville a la poulie basse, penche en avant, lancer la jambe vers l'arriere.",
      tips: ["Contracter le fessier en haut", "Ne pas balancer — mouvement controle", "Congestion maximale"],
      lv: 1,
      tags: ["fessiers", "isolation", "cable", "finition"]
    },
    {
      n: "Sumo squat haltere",
      m: "Fessiers / Adducteurs",
      eq: "Haltere",
      sets: "3\u00d712-15",
      rest: "60s",
      desc: "Pieds largement ecartes, pointes vers l'exterieur, haltere entre les jambes.",
      tips: ["Descendre profond entre les jambes", "Ciblage adducteurs et fessiers moyens", "Excellent pour les femmes"],
      lv: 1,
      tags: ["fessiers", "adducteurs", "debutant"]
    },
    {
      n: "Fentes laterales",
      m: "Fessiers / Adducteurs",
      eq: "Halteres ou poids du corps",
      sets: "3\u00d710-12 par jambe",
      rest: "60s",
      desc: "Ecarter une jambe sur le cote, plier le genou et descendre, l'autre jambe tendue.",
      tips: ["Pied pointe vers l'exterieur du cote qui flechit", "Excellent pour les adducteurs et moyen fessier", "Controler le genou dans l'axe du pied"],
      lv: 2,
      tags: ["fessiers", "adducteurs", "unilateral"]
    }
  ],

  // ─── ABDOMINAUX ───
  abs: [
    {
      n: "Crunch classique",
      m: "Grand droit",
      eq: "Poids du corps",
      sets: "3\u00d720-25",
      rest: "45s",
      video: "https://www.youtube.com/results?search_query=crunch+abdos+exercise+animation+tutorial&sp=EgIYAQ%253D%253D",
      desc: "Allonge au sol, decoller les epaules en contractant les abdominaux.",
      tips: ["Contractez le transverse (rentrer le nombril) avant tout mouvement", "Ne pas tirer sur la nuque", "Expirer en montant", "Regard vers le plafond"],
      lv: 1,
      tags: ["abdos", "grand droit", "debutant"]
    },
    {
      n: "Planche (gainage)",
      m: "Transverse / Core",
      eq: "Poids du corps",
      sets: "3\u00d730-60s",
      rest: "45s",
      video: "https://www.youtube.com/results?search_query=planche+gainage+plank+exercise+animation+tutorial&sp=EgIYAQ%253D%253D",
      desc: "Appui sur les avant-bras et les pieds, corps droit comme une planche.",
      tips: ["Corps aligne de la tete aux pieds", "Contracter les fessiers et les abdos", "Ne pas lever les fesses"],
      lv: 1,
      tags: ["abdos", "gainage", "core"]
    },
    {
      n: "Mountain climbers",
      m: "Abdominaux / Cardio",
      eq: "Poids du corps",
      sets: "3\u00d730-45s",
      rest: "30s",
      video: "https://www.youtube.com/results?search_query=mountain+climbers+exercise+animation+tutorial&sp=EgIYAQ%253D%253D",
      desc: "En position de pompe, ramener alternativement les genoux vers la poitrine.",
      tips: ["Garder les hanches basses", "Rythme rapide pour le cardio", "Excellent bruleur de calories"],
      lv: 1,
      tags: ["abdos", "cardio", "poids du corps"]
    },
    {
      n: "Releve de jambes suspendu",
      m: "Grand droit (portion basse)",
      eq: "Barre de traction",
      sets: "3\u00d710-15",
      rest: "60s",
      video: "https://www.youtube.com/results?search_query=releve+de+jambes+hanging+leg+raise+exercise+animation+tutorial&sp=EgIYAQ%253D%253D",
      desc: "Suspendu a la barre, monter les jambes tendues devant soi.",
      tips: ["Contractez le transverse (rentrer le nombril) avant tout mouvement", "Jambes tendues pour plus de difficulte", "Controler la descente", "Ne pas balancer"],
      lv: 3,
      tags: ["abdos", "force", "avance"]
    },
    {
      n: "Russian twist",
      m: "Obliques",
      eq: "Poids du corps ou medecine ball",
      sets: "3\u00d720 (total)",
      rest: "45s",
      video: "https://www.youtube.com/results?search_query=russian+twist+exercise+animation+tutorial&sp=EgIYAQ%253D%253D",
      desc: "Assis, pieds decolles du sol, faire pivoter le buste de gauche a droite.",
      tips: ["Contractez le transverse (rentrer le nombril) avant tout mouvement", "Pieds decolles pour plus de difficulte", "Rotation du buste, pas des bras", "Ajouter du poids progressivement"],
      lv: 2,
      tags: ["abdos", "obliques", "rotation"]
    },
    {
      n: "Hollow hold",
      m: "Core / Grand droit",
      eq: "Poids du corps",
      sets: "3\u00d720-40s",
      rest: "45s",
      video: "https://www.youtube.com/results?search_query=hollow+hold+exercise+animation+tutorial&sp=EgIYAQ%253D%253D",
      desc: "Allonge, bras et jambes decolles du sol, dos plaque au sol.",
      tips: ["Bas du dos colle au sol", "Position de base en gymnastique", "Progresser en duree"],
      lv: 2,
      tags: ["abdos", "gainage", "gymnastique"]
    },
    {
      n: "Ab wheel (roue abdominale)",
      m: "Grand droit / Core",
      eq: "Roue abdominale",
      sets: "3\u00d78-12",
      rest: "60s",
      video: "https://www.youtube.com/results?search_query=ab+wheel+rollout+exercise+animation+tutorial&sp=EgIYAQ%253D%253D",
      desc: "A genoux, faire rouler la roue devant soi en gardant le dos droit, puis revenir.",
      tips: ["Ne pas cambrer le dos", "Contracter les abdos tout le long", "Commencer a genoux"],
      lv: 3,
      tags: ["abdos", "core", "avance"]
    },
    {
      n: "Cable crunch (crunch poulie)",
      m: "Grand droit",
      eq: "Poulie haute + corde",
      sets: "3\u00d712-15",
      rest: "60s",
      video: "https://www.youtube.com/results?search_query=cable+crunch+exercise+animation+tutorial&sp=EgIYAQ%253D%253D",
      desc: "A genoux devant la poulie, flechir le buste vers le sol en contractant les abdos.",
      tips: ["Hanches fixes, seul le buste bouge", "Corde derriere la tete", "Resistance constante"],
      lv: 2,
      tags: ["abdos", "machine", "force"]
    },
    {
      n: "Planche laterale",
      m: "Obliques / Core",
      eq: "Poids du corps",
      sets: "3\u00d720-40s par cote",
      rest: "30s",
      video: "https://www.youtube.com/results?search_query=planche+laterale+side+plank+exercise+animation+tutorial&sp=EgIYAQ%253D%253D",
      desc: "En appui lateral sur un avant-bras, corps aligne, maintenir la position.",
      tips: ["Hanches hautes et alignees", "Contracter les obliques", "Ne pas laisser les hanches tomber"],
      lv: 2,
      tags: ["abdos", "obliques", "gainage"]
    },
    {
      n: "Dragon flag",
      m: "Core complet / Rectus",
      eq: "Banc ou barre",
      sets: "3\u00d75-8",
      rest: "90s",
      desc: "Allonge, tenir la barre derriere la tete, monter et descendre le corps raide comme une planche.",
      tips: ["Corps RIGIDE comme une planche", "Exercice de Bruce Lee — tres difficile", "Commencer avec les jambes flechies"],
      lv: 4,
      tags: ["abdos", "core", "avance", "expert"]
    },
    {
      n: "Pallof press",
      m: "Core anti-rotation",
      eq: "Cable poulie",
      sets: "3\u00d710-12 par cote",
      rest: "45s",
      desc: "Debout de cote face au cable, tendre les bras devant soi en resistant a la rotation.",
      tips: ["Core completement stable — ne pas bouger le tronc", "Exercice anti-rotation = fonctionnel ++", "Indispensable pour sportifs"],
      lv: 2,
      tags: ["abdos", "anti-rotation", "fonctionnel", "core"]
    },
    {
      n: "L-sit progressions",
      m: "Psoas / Rectus / Hip flexors",
      eq: "Barres paralleles ou sol",
      sets: "3\u00d710-20s",
      rest: "60s",
      desc: "Soutenu sur les mains, jambes tendues horizontales. Tenir.",
      tips: ["Progression : 1 jambe → 2 jambes pliees → L-sit complet", "Jambes parfaitement horizontales", "Force abdos + flexion hanche"],
      lv: 4,
      tags: ["abdos", "psoas", "calisthenics", "avance"]
    },
    {
      n: "Windshield wipers",
      m: "Obliques / Core",
      eq: "Barre de traction",
      sets: "3\u00d78-12",
      rest: "60s",
      desc: "Suspendu a la barre, jambes tendues, basculer de gauche a droite comme des essuie-glaces.",
      tips: ["Jambes tendues pour plus de difficulte", "Controle de la rotation — ne pas balancer", "Progresser avec jambes flechies"],
      lv: 4,
      tags: ["abdos", "obliques", "avance", "suspension"]
    }
  ],

  // ─── CARDIO ───
  cardio: [
    {
      n: "Course a pied",
      m: "Systeme cardiovasculaire",
      eq: "Chaussures de running",
      sets: "20-45 min",
      rest: "N/A",
      video: "https://www.youtube.com/results?search_query=course+a+pied+running+technique+exercise+animation+tutorial&sp=EgIYAQ%253D%253D",
      desc: "Courir a un rythme regulier, en zone 2 pour le cardio de base.",
      tips: ["Commencer par 20 minutes", "Respirer par le nez et la bouche", "Augmenter progressivement la duree"],
      lv: 1,
      tags: ["cardio", "endurance", "bruleur de calories"]
    },
    {
      n: "Corde a sauter",
      m: "Cardiovasculaire / Mollets",
      eq: "Corde a sauter",
      sets: "5\u00d72 min",
      rest: "30s",
      video: "https://www.youtube.com/results?search_query=corde+a+sauter+jump+rope+exercise+animation+tutorial&sp=EgIYAQ%253D%253D",
      desc: "Sauter a la corde a un rythme regulier ou en intervalles.",
      tips: ["Sauter sur la pointe des pieds", "Poignets detendus", "Excellent pour la coordination"],
      lv: 1,
      tags: ["cardio", "mollets", "coordination"]
    },
    {
      n: "Burpees",
      m: "Full body / Cardio",
      eq: "Poids du corps",
      sets: "4\u00d710-15",
      rest: "60s",
      video: "https://www.youtube.com/results?search_query=burpees+exercise+animation+tutorial&sp=EgIYAQ%253D%253D",
      desc: "Enchainer squat, planche, pompe, saut vertical.",
      tips: ["Mouvement explosif", "Garder un bon rythme", "Le roi du cardio HIIT"],
      lv: 2,
      tags: ["cardio", "full body", "hiit"]
    },
    {
      n: "Mountain climbers (cardio)",
      m: "Core / Cardiovasculaire",
      eq: "Poids du corps",
      sets: "4\u00d730-45s",
      rest: "30s",
      video: "https://www.youtube.com/results?search_query=mountain+climbers+cardio+exercise+animation+tutorial&sp=EgIYAQ%253D%253D",
      desc: "En position de pompe, alterner les genoux vers la poitrine rapidement.",
      tips: ["Rythme rapide", "Hanches basses", "Excellent en circuit training"],
      lv: 1,
      tags: ["cardio", "abdos", "hiit"]
    },
    {
      n: "Jumping jacks",
      m: "Cardiovasculaire",
      eq: "Poids du corps",
      sets: "3\u00d745-60s",
      rest: "30s",
      video: "https://www.youtube.com/results?search_query=jumping+jacks+exercise+animation+tutorial&sp=EgIYAQ%253D%253D",
      desc: "Sauter en ecartant les jambes et en levant les bras simultanement.",
      tips: ["Atterrir en douceur", "Rythme regulier", "Parfait pour l'echauffement"],
      lv: 1,
      tags: ["cardio", "echauffement", "debutant"]
    },
    {
      n: "Box jumps",
      m: "Explosivite / Cardiovasculaire",
      eq: "Box ou banc",
      sets: "4\u00d78-10",
      rest: "60s",
      video: "https://www.youtube.com/results?search_query=box+jumps+exercise+animation+tutorial&sp=EgIYAQ%253D%253D",
      desc: "Sauter sur une box depuis le sol, se relever completement, redescendre.",
      tips: ["Commencer avec une box basse", "Atterrir en douceur genoux flechis", "Ne pas enchainer trop vite"],
      lv: 3,
      tags: ["cardio", "explosivite", "jambes"]
    },
    {
      n: "Rameur (rowing machine)",
      m: "Full body / Cardiovasculaire",
      eq: "Rameur",
      sets: "15-30 min ou intervalles",
      rest: "N/A",
      video: "https://www.youtube.com/results?search_query=rameur+rowing+machine+exercise+animation+tutorial&sp=EgIYAQ%253D%253D",
      desc: "Pousser avec les jambes, tirer avec le dos et les bras, retourner en position initiale.",
      tips: ["Ordre : jambes, dos, bras", "Dos droit tout le long", "80% jambes, 20% bras"],
      lv: 2,
      tags: ["cardio", "full body", "endurance"]
    },
    {
      n: "Velo HIIT (assault bike)",
      m: "Cardiovasculaire",
      eq: "Velo d'assault ou velo stationnaire",
      sets: "8\u00d720s sprint / 40s repos",
      rest: "40s",
      video: "https://www.youtube.com/results?search_query=velo+hiit+assault+bike+exercise+animation+tutorial&sp=EgIYAQ%253D%253D",
      desc: "Pedaler a intensite maximale pendant les intervalles de sprint.",
      tips: ["Sprint a fond pendant 20 secondes", "Recuperation active pendant 40 secondes", "8-10 rounds suffisent"],
      lv: 2,
      tags: ["cardio", "hiit", "bruleur de calories"]
    },
    {
      n: "Marche rapide inclinee",
      m: "Cardiovasculaire / Fessiers",
      eq: "Tapis de course",
      sets: "20-40 min",
      rest: "N/A",
      video: "https://www.youtube.com/results?search_query=marche+rapide+incline+treadmill+walk+exercise+animation+tutorial&sp=EgIYAQ%253D%253D",
      desc: "Marcher a 5-6 km/h sur un tapis incline a 10-15%.",
      tips: ["Inclinaison a 10-15%", "Ne pas se tenir aux poignees", "Zone 2 cardio ideale pour bruler les graisses"],
      lv: 1,
      tags: ["cardio", "fessiers", "bruleur de graisses", "debutant"]
    }
  ],

  // ─── PREHAB / PREVENTION ───
  prehab: [
    // ── EPAULES / COIFFE DES ROTATEURS ──
    {
      n: "Rotation externe elastique",
      m: "Coiffe des rotateurs (infra-epineux)",
      eq: "Elastique / bande",
      sets: "3\u00d715-20",
      rest: "45s",
      desc: "Coude a 90 degres contre le corps, tirer l'elastique vers l'exterieur en rotation externe.",
      tips: ["Coude colle au flanc", "Mouvement lent et controle", "Amplitude complete sans douleur"],
      lv: 1,
      tags: ["prehab", "epaules", "coiffe", "prevention"]
    },
    {
      n: "Face pull prehab",
      m: "Deltoi\u00efde posterieur / Coiffe",
      eq: "Cable poulie haute ou elastique",
      sets: "3\u00d715",
      rest: "45s",
      desc: "Tirer le cable vers le visage, coudes au-dessus des epaules, ouvrir les bras.",
      tips: ["Coudes hauts en permanence", "Contractez les trapez\u00e8s inferieurs", "Excellent contre-exercice au developpe"],
      lv: 1,
      tags: ["prehab", "epaules", "posture", "prevention"]
    },
    {
      n: "Band pull-apart",
      m: "Deltoi\u00efde posterieur / Rhomboides",
      eq: "Bande elastique",
      sets: "3\u00d720",
      rest: "30s",
      desc: "Tenir l'elastique a hauteur des epaules, tirer les mains vers l'exterieur jusqu'a ouvrir les bras.",
      tips: ["Bras tendus", "Pincer les omoplates", "Ideal avant tout entrainement epaules/poitrine"],
      lv: 1,
      tags: ["prehab", "epaules", "rhomboides", "echauffement"]
    },
    // ── DOS LOMBAIRES ──
    {
      n: "Hollow body hold",
      m: "Transverse / Core profond",
      eq: "Poids du corps",
      sets: "3\u00d720-30s",
      rest: "30s",
      desc: "Allonge, creuser le bas du dos contre le sol, jambes et bras tendus a 45 degres. Tenir.",
      tips: ["Bas du dos plaque au sol en permanence", "Respiration normale", "Progresser en eloignant les bras/jambes"],
      lv: 2,
      tags: ["prehab", "core", "lombaires", "prevention"]
    },
    {
      n: "Bird-dog",
      m: "Erecteurs du rachis / Core",
      eq: "Poids du corps",
      sets: "3\u00d710 par cote",
      rest: "30s",
      desc: "A 4 pattes, etendre le bras droit et la jambe gauche simultanement. Alterner.",
      tips: ["Dos horizontal — ne pas se dehancher", "Pointer les orteils", "Rentrer le nombril"],
      lv: 1,
      tags: ["prehab", "lombaires", "core", "equilibre"]
    },
    {
      n: "McGill curl-up",
      m: "Rectus abdominis (sans flexion lombaire)",
      eq: "Poids du corps",
      sets: "3\u00d78-10",
      rest: "30s",
      desc: "Allonge, une jambe flechie, mains sous les lombaires. Lever legerement la tete et les epaules.",
      tips: ["NE PAS arrondir le bas du dos", "Mouvement minimal — 2-3cm suffisent", "Recommande par Stuart McGill pour lombalgie"],
      lv: 1,
      tags: ["prehab", "abdos", "lombaires", "rehabilitation"]
    },
    // ── GENOUX ──
    {
      n: "Terminal leg extension",
      m: "Vaste interne (VMO)",
      eq: "Elastique / cable bas",
      sets: "3\u00d715",
      rest: "30s",
      desc: "Debout, elastique derriere le genou, extension complete des 30 derniers degres.",
      tips: ["Ciblage du VMO pour stabiliser la rotule", "Alternative au leg extension pour tendinopathie", "Serrer fort en extension"],
      lv: 1,
      tags: ["prehab", "genoux", "VMO", "tendinite-rotulienne"]
    },
    {
      n: "Nordic curl",
      m: "Ischio-jambiers (excentrique)",
      eq: "Poids du corps + partenaire ou machine",
      sets: "3\u00d75-8",
      rest: "90s",
      desc: "Genoux au sol, pieds bloques. Se laisser tomber lentement en controlant avec les ischios.",
      tips: ["Descente TRES lente (3-5 secondes)", "Phase la plus efficace = excentrique", "Prevention dechirure ischios (etudes NFL, FIFA)"],
      lv: 3,
      tags: ["prehab", "ischios", "prevention", "excentrique"]
    },
    {
      n: "Clamshell elastique",
      m: "Fessiers moyens / Rotateurs externes hanche",
      eq: "Elastique",
      sets: "3\u00d715 par cote",
      rest: "30s",
      desc: "Allonge sur le cote, genoux flechis, elastique au-dessus des genoux. Ouvrir le genou du dessus.",
      tips: ["Bassin fixe — ne pas rouler", "Ciblage fessier moyen pour stabilite genou/hanche", "Progression : debout en pont fessier"],
      lv: 1,
      tags: ["prehab", "fessiers", "hanches", "genoux"]
    },
    // ── CHEVILLE / PIED ──
    {
      n: "Mobilite cheville mur",
      m: "Cheville (dorsiflexion)",
      eq: "Poids du corps + mur",
      sets: "3\u00d710 par cote",
      rest: "15s",
      desc: "Debout face au mur, pied a 10-15cm. Genou vers le mur sans lever le talon.",
      tips: ["Mesurer la distance pied-mur", "Indispensable pour squat profond", "Augmenter progressivement la distance"],
      lv: 1,
      tags: ["prehab", "cheville", "mobilite", "squat"]
    },
    // ── POIGNETS / AVANT-BRAS ──
    {
      n: "Renforcement poignet flechisseurs",
      m: "Flechisseurs avant-bras",
      eq: "Haltere leger",
      sets: "3\u00d715",
      rest: "30s",
      desc: "Avant-bras pose sur la cuisse, poignet en dehors. Flechir/etendre le poignet.",
      tips: ["Poids tres leger (1-2 kg suffisent)", "Prevention epicondylite mediale", "Mouvement d'amplitude complete"],
      lv: 1,
      tags: ["prehab", "poignets", "avant-bras", "epicondylite"]
    },
    {
      n: "Renforcement poignet extenseurs",
      m: "Extenseurs avant-bras",
      eq: "Haltere leger",
      sets: "3\u00d715",
      rest: "30s",
      desc: "Avant-bras pose, paume vers le bas. Etendre le poignet vers le haut.",
      tips: ["Prevention epicondylite laterale (tennis elbow)", "Poids 1-2 kg maximum", "Mouvement lent et controle"],
      lv: 1,
      tags: ["prehab", "poignets", "extenseurs", "tennis-elbow"]
    },
    // ── POSTURE / COLONNE ──
    {
      n: "Jefferson curl",
      m: "Colonne vertebrale (mobilite en flexion)",
      eq: "Haltere tres leger",
      sets: "3\u00d75-8",
      rest: "60s",
      desc: "Debout sur une marche, descendre vertebre par vertebre avec un poids tres leger.",
      tips: ["Poids TRES leger (5-10 kg max)", "Mouvement LENT — 5-8 secondes", "Renforce les disques EN FLEXION CONTROLEE — differe du deadlift"],
      lv: 2,
      tags: ["prehab", "colonne", "mobilite", "decompression"]
    },
    {
      n: "Etirement piriforme (figure 4)",
      m: "Piriforme / Rotateurs hanche",
      eq: "Poids du corps",
      sets: "3\u00d730s par cote",
      rest: "15s",
      desc: "Allonge, croiser la cheville droite sur le genou gauche. Tirer la jambe gauche vers la poitrine.",
      tips: ["Sentir l'etirement dans la fesse", "Prevention sciatique par compression piriforme", "Maintenir 30 secondes minimum"],
      lv: 1,
      tags: ["prehab", "hanches", "piriforme", "sciatique", "etirement"]
    },
    {
      n: "Activation fessier prone",
      m: "Grand fessier",
      eq: "Poids du corps",
      sets: "3\u00d715 par cote",
      rest: "30s",
      desc: "Allonge sur le ventre, contracter le fessier et lever une jambe legerement du sol.",
      tips: ["Contracter le fessier AVANT de lever la jambe", "Evite d'activer les lombaires a la place", "Indispensable si amnesie gluteale (bureau, sedentarite)"],
      lv: 1,
      tags: ["prehab", "fessiers", "activation", "lombaires"]
    }
  ]
};
