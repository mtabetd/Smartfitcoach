/* ═══════════════════════════════════════════════════════════════
   EXERCISES-DB.JS — Base de donnees exercices
   MTD Macro Calculator
   72+ exercices, 9 groupes musculaires, liens video YouTube
   ═══════════════════════════════════════════════════════════════ */
var EXERCISES = {

  // ─── PECTORAUX ───
  chest: [
    {
      n: "Développé couché",
      m: "Pectoraux",
      eq: "Barre + banc",
      sets: "4\u00d78-12",
      rest: "90s",
      video: "https://www.youtube.com/results?search_query=developpe+couche+bench+press+exercise+animation+tutorial&sp=EgIYAQ%253D%253D",
      desc: "Allongé sur le banc, descendre la barre au niveau de la poitrine, pousser vers le haut.",
      tips: ["Garder les pieds au sol", "Ne pas arquer excessivement le dos", "Contrôler la descente", "Coudes à 45-75 degrés du corps — jamais à 90 degrés", "Éviter le grip trop large (>81cm) — risque tendinopathie biceps"],
      lv: 2,
      tags: ["pectoraux", "triceps", "force"]
    },
    {
      n: "Développé incliné",
      m: "Pectoraux supérieurs",
      eq: "Barre + banc incliné",
      sets: "4\u00d78-12",
      rest: "90s",
      video: "https://www.youtube.com/results?search_query=developpe+incline+incline+bench+press+exercise+animation+tutorial&sp=EgIYAQ%253D%253D",
      desc: "Banc incliné à 30-45 degrés. Descendre la barre vers le haut de la poitrine.",
      tips: ["Incliner le banc à 30-45 degrés", "Garder les coudes à 45 degrés du corps", "Ne pas rebondir la barre"],
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
      desc: "Mains au sol, largeur des épaules. Descendre la poitrine au sol puis pousser.",
      tips: ["Corps aligné de la tête aux pieds", "Contracter les abdos", "Descendre jusqu'à frôler le sol"],
      lv: 1,
      tags: ["pectoraux", "triceps", "poids du corps"]
    },
    {
      n: "Écarté haltères",
      m: "Pectoraux",
      eq: "Haltères + banc",
      sets: "3\u00d712-15",
      rest: "60s",
      video: "https://www.youtube.com/results?search_query=ecarte+halteres+dumbbell+fly+exercise+animation+tutorial&sp=EgIYAQ%253D%253D",
      desc: "Allongé sur le banc, bras tendus au-dessus. Ouvrir les bras en arc de cercle.",
      tips: ["Légère flexion des coudes", "Sentir l'étirement des pectoraux", "Contrôler la phase négative"],
      lv: 2,
      tags: ["pectoraux", "isolation"]
    },
    {
      n: "Dips",
      m: "Pectoraux / Triceps",
      eq: "Barres parallèles",
      sets: "4\u00d78-12",
      rest: "90s",
      video: "https://www.youtube.com/results?search_query=dips+chest+dips+exercise+animation+tutorial&sp=EgIYAQ%253D%253D",
      warn: "Contre-indiqué si douleur antérieure d'épaule, conflit sous-acromial ou coiffe des rotateurs opérée — charge importante sur le tendon du sus-épineux en position d'abduction + extension",
      desc: "Se suspendre aux barres parallèles, descendre en fléchissant les coudes, remonter.",
      tips: ["Pencher le buste en avant pour cibler les pectoraux", "Ne pas descendre sous 90 degrés si douleur", "Ne pas verrouiller en haut", "Amplitude limitée à 90 degrés de flexion du coude si fragile"],
      lv: 3,
      tags: ["pectoraux", "triceps", "compose"]
    },
    {
      n: "Pullover haltère",
      m: "Pectoraux / Grand dorsal",
      eq: "Haltère + banc",
      sets: "3\u00d712-15",
      rest: "60s",
      video: "https://www.youtube.com/results?search_query=pullover+haltere+dumbbell+pullover+exercise+animation+tutorial&sp=EgIYAQ%253D%253D",
      desc: "Allongé perpendiculaire au banc, descendre l'haltère derrière la tête puis remonter.",
      tips: ["Garder une légère flexion des coudes", "Sentir l'étirement du thorax", "Ne pas descendre trop bas"],
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
      desc: "Mains rapprochées formant un losange sous la poitrine. Descendre et pousser.",
      tips: ["Mains en forme de diamant", "Corps bien gainé", "Excellent pour les triceps"],
      lv: 2,
      tags: ["pectoraux", "triceps", "poids du corps"]
    },
    {
      n: "Développé haltères",
      m: "Pectoraux",
      eq: "Haltères + banc",
      sets: "4\u00d78-12",
      rest: "90s",
      video: "https://www.youtube.com/results?search_query=developpe+halteres+dumbbell+bench+press+exercise+animation+tutorial&sp=EgIYAQ%253D%253D",
      desc: "Allongé sur le banc, pousser les haltères au-dessus de la poitrine.",
      tips: ["Plus grande amplitude qu'a la barre", "Contrôler la descente", "Rapprocher les haltères en haut"],
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
      desc: "Assis à la machine, pousser les poignées vers l'avant.",
      tips: ["Régler le siège à hauteur de poitrine", "Ne pas verrouiller les coudes", "Idéal pour les débutants"],
      lv: 1,
      tags: ["pectoraux", "triceps", "machine"]
    },
    {
      n: "Câble crossover bas",
      m: "Pectoraux inférieurs",
      eq: "Câble poulie basse",
      sets: "3\u00d712-15",
      rest: "60s",
      desc: "Poulies basses, tirer les câbles vers le haut et croiser au niveau des pectoraux.",
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
      desc: "Assis à la machine, ramener les bras devant la poitrine en arc de cercle.",
      tips: ["Coudes en ligne avec les épaules", "Amplitude maximale pour l'étirement", "Idéal pour finition et congestion"],
      lv: 1,
      tags: ["pectoraux", "machine", "isolation", "finition"]
    },
    {
      n: "Pompes déclinées",
      m: "Pectoraux inférieurs",
      eq: "Poids du corps + banc",
      sets: "3\u00d712-20",
      rest: "60s",
      desc: "Pieds surélevés sur un banc, pompes en position déclinée.",
      tips: ["Plus les pieds sont hauts, plus le bas de pec est cible", "Corps parfaitement gaine", "Excellent sans matériel"],
      lv: 2,
      tags: ["pectoraux", "poids du corps"]
    },
    {
      n: "Écarté câble croisé",
      m: "Pectoraux",
      eq: "Câble poulie moyenne",
      sets: "3\u00d715",
      rest: "60s",
      desc: "Poulies à hauteur des épaules, croiser les câbles devant la poitrine.",
      tips: ["Permet une tension constante contrairement aux haltères", "Sentir le stretch à chaque rep", "Angle modifiable pour cibler haut/bas"],
      lv: 2,
      tags: ["pectoraux", "cable", "isolation"]
    },
    {
      n: "Pompes plyométriques",
      m: "Pectoraux / Puissance",
      eq: "Poids du corps",
      sets: "4\u00d76-8",
      rest: "90s",
      desc: "Pompes explosives avec décollment des mains du sol en haut du mouvement.",
      tips: ["Atterrir en douceur avec légère flexion des coudes", "Excellent pour la puissance explosive", "Ne pas faire sous fatigue extreme"],
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
      desc: "Suspendre à la barre, mains en pronation, tirer le menton au-dessus de la barre.",
      tips: ["Largeur des mains supérieure aux épaules", "Ne pas balancer le corps", "Descendre complètement"],
      lv: 3,
      tags: ["dos", "biceps", "compose"]
    },
    {
      n: "Rowing barre",
      m: "Dos / Rhomboïdes",
      eq: "Barre",
      sets: "4\u00d78-12",
      rest: "90s",
      video: "https://www.youtube.com/results?search_query=rowing+barre+barbell+row+exercise+animation+tutorial&sp=EgIYAQ%253D%253D",
      warn: "Contre-indiqué si épicondylite laterale (tennis elbow) — prise pronation + extension du poignet sous charge = s trèss maximal sur l'epicondyle lateral. Préférer rowing haltere unilateral prise neutre ou rowing cable.",
      desc: "Penché à 45 degrés, tirer la barre vers le nombril en serrant les omoplates.",
      tips: ["Dos droit, ne pas arrondir", "Tirer avec les coudes", "Serrer les omoplates en haut", "Gainage abdominal permanent pour protéger les lombaires"],
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
      warn: "Tirer DEVANT la poitrine UNIQUEMENT — tirage derrière la nuque (behind-neck) interdit : compression C4-C6 + impingement sous-acromial sévère. Contre-indiqué si épicondylite (prise pronation = s trèss epicondyle).",
      desc: "Assis à la poulie haute, tirer la barre vers le haut de la poitrine.",
      tips: ["Ne pas tirer derrière la nuque — TOUJOURS devant la poitrine", "Garder le buste légèrement incline", "Sentir le dos travailler"],
      lv: 1,
      tags: ["dos", "biceps", "machine"]
    },
    {
      n: "Rowing haltère unilatéral",
      m: "Grand dorsal",
      eq: "Haltère + banc",
      sets: "4\u00d710-12",
      rest: "90s",
      video: "https://www.youtube.com/results?search_query=rowing+haltere+one+arm+dumbbell+row+exercise+animation+tutorial&sp=EgIYAQ%253D%253D",
      desc: "Un genou et une main sur le banc, tirer l'haltère vers la hanche.",
      tips: ["Dos parallele au sol", "Tirer le coude vers le plafond", "Contrôler la descente"],
      lv: 2,
      tags: ["dos", "biceps", "unilateral"]
    },
    {
      n: "Soulevé de terre",
      m: "Chaîne postérieure",
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
      m: "Arriere d'épaule / Rhomboïdes",
      eq: "Poulie + corde",
      sets: "3\u00d715-20",
      rest: "45s",
      video: "https://www.youtube.com/results?search_query=face+pull+exercise+animation+tutorial&sp=EgIYAQ%253D%253D",
      desc: "Tirer la corde vers le visage en écartant les mains, coudes hauts.",
      tips: ["Coudes au niveau des épaules", "Serrer les omoplates", "Excellent pour la posture"],
      lv: 1,
      tags: ["dos", "epaules", "posture"]
    },
    {
      n: "Pulldown prise serrée",
      m: "Grand dorsal",
      eq: "Poulie haute + triangle",
      sets: "3\u00d710-12",
      rest: "60s",
      video: "https://www.youtube.com/results?search_query=pulldown+prise+serree+close+grip+pulldown+exercise+animation+tutorial&sp=EgIYAQ%253D%253D",
      desc: "Assis à la poulie, tirer la poignee triangle vers la poitrine.",
      tips: ["Prise neutre pour cibler le grand dorsal", "Garder les coudes près du corps", "Étirer en haut"],
      lv: 1,
      tags: ["dos", "biceps", "machine"]
    },
    {
      n: "Rowing T-bar",
      m: "Dos / Épaisseur",
      eq: "T-bar ou landmine",
      sets: "4\u00d78-12",
      rest: "90s",
      video: "https://www.youtube.com/results?search_query=rowing+t-bar+t+bar+row+exercise+animation+tutorial&sp=EgIYAQ%253D%253D",
      desc: "Penché au-dessus de la barre en T, tirer vers la poitrine.",
      tips: ["Dos droit et gaine", "Excellent pour l'épaisseur du dos", "Tirer les coudes en arrière"],
      lv: 2,
      tags: ["dos", "biceps", "force"]
    },
    {
      n: "Superman au sol",
      m: "Lombaires / Érecteurs",
      eq: "Poids du corps",
      sets: "3\u00d715-20",
      rest: "45s",
      video: "https://www.youtube.com/results?search_query=superman+back+exercise+animation+tutorial&sp=EgIYAQ%253D%253D",
      desc: "Allongé face au sol, lever simultanément les bras et les jambes.",
      tips: ["Ne pas hyper-étendre le cou", "Contracter les fessiers", "Maintenir 2-3 secondes en haut"],
      lv: 1,
      tags: ["dos", "lombaires", "poids du corps"]
    },
    {
      n: "Straight-arm pulldown",
      m: "Grand dorsal (stretch)",
      eq: "Câble poulie haute",
      sets: "3\u00d715",
      rest: "60s",
      desc: "Debout face à la poulie haute, bras tendus, tirer le câble vers les cuisses.",
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
      desc: "Barre au sol, dos horizontal à 90 degrés. Tirer explosif vers les abdos, reposer au sol à chaque rep.",
      tips: ["Barre au sol entre chaque rep — pas de triche", "Explosif à la montee", "Excellent pour la force du dos"],
      lv: 3,
      tags: ["dos", "force", "puissance", "compose"]
    },
    {
      n: "Traction prise neutre",
      m: "Grand dorsal / Biceps",
      eq: "Barre ou poignées neu très",
      sets: "4\u00d76-10",
      rest: "90s",
      desc: "Prise neutre (paumes se font face), traction complète jusqu'au menton.",
      tips: ["Intermédiaire entre supination et pronation", "Moins de s trèss sur les coudes", "Excellent pour les coudes sensibles"],
      lv: 3,
      tags: ["dos", "biceps", "compose", "poids du corps"]
    },
    {
      n: "Rowing assis câble prise large",
      m: "Rhomboïdes / Trapèzes moyens",
      eq: "Câble poulie basse + triangle large",
      sets: "3\u00d712-15",
      rest: "60s",
      desc: "Assis à la poulie basse, prise large, tirer vers le bas de la poitrine.",
      tips: ["Coudes evases pour cibler les rhomboides", "Different du rowing prise serrée (dorsaux)", "Idéal pour l'épaisseur du dos"],
      lv: 2,
      tags: ["dos", "rhomboides", "trapezes", "cable"]
    },
    {
      n: "T-bar row",
      m: "Dorsaux / Rhomboïdes",
      eq: "T-bar machine ou barre en angle",
      sets: "4\u00d78-12",
      rest: "90s",
      desc: "Buste penche à 45 degrés, saisir le T-bar, tirer vers la poitrine.",
      tips: ["Buste fixe à 45 degrés", "Tirer les coudes vers l'arrière", "Amplitude complete — etirer les dorsaux en bas"],
      lv: 2,
      tags: ["dos", "dorsaux", "force", "compose"]
    }
  ],

  // ─── EPAULES ───
  shoulders: [
    {
      n: "Développé militaire",
      m: "Deltoïdes anterieurs",
      eq: "Barre",
      sets: "4\u00d78-10",
      rest: "90s",
      video: "https://www.youtube.com/results?search_query=developpe+militaire+overhead+press+exercise+animation+tutorial&sp=EgIYAQ%253D%253D",
      warn: "Éviter si conflit sous-acromial ou tendinite coiffe des rotateurs",
      desc: "Debout ou assis, pousser la barre au-dessus de la tête.",
      tips: ["Gaîner les abdos et les fessiers", "Ne pas arquer le dos", "Barre devant le visage", "Ne pas verrouiller les coudes en haut"],
      lv: 3,
      tags: ["epaules", "triceps", "force"]
    },
    {
      n: "Élévations latérales",
      m: "Deltoïdes lateraux",
      eq: "Halteres",
      sets: "4\u00d712-15",
      rest: "60s",
      video: "https://www.youtube.com/results?search_query=elevations+laterales+lateral+raises+exercise+animation+tutorial&sp=EgIYAQ%253D%253D",
      desc: "Debout, lever les haltères sur les cotes jusqu'à hauteur d'épaules.",
      tips: ["Légère flexion des coudes", "Lever max 90 degrés — depasser la parallele = conflit sous-acromial", "Contrôler la descente"],
      lv: 1,
      tags: ["epaules", "isolation"]
    },
    {
      n: "Oiseau (rear delt fly)",
      m: "Deltoïdes posterieurs",
      eq: "Halteres",
      sets: "3\u00d715-20",
      rest: "45s",
      video: "https://www.youtube.com/results?search_query=oiseau+rear+delt+fly+exercise+animation+tutorial&sp=EgIYAQ%253D%253D",
      desc: "Penché en avant, ouvrir les bras lateralement en serrant les omoplates.",
      tips: ["Buste à 45-90 degrés", "Pouces vers le bas pour cibler l'arrière", "Mouvement lent et contrôlé"],
      lv: 2,
      tags: ["epaules", "dos", "isolation"]
    },
    {
      n: "Shrug (haussement d'épaules)",
      m: "Trapèzes",
      eq: "Haltères ou barre",
      sets: "4\u00d712-15",
      rest: "60s",
      video: "https://www.youtube.com/results?search_query=shrug+trapezes+dumbbell+shrugs+exercise+animation+tutorial&sp=EgIYAQ%253D%253D",
      desc: "Debout, hausser les épaules vers les oreilles en tenant les poids.",
      tips: ["Ne pas rouler les épaules", "Maintenir 2s en haut", "Poids lourds possibles"],
      lv: 1,
      tags: ["trapezes", "epaules", "isolation"]
    },
    {
      n: "Face pull épaules",
      m: "Deltoïdes posterieurs",
      eq: "Poulie + corde",
      sets: "3\u00d715-20",
      rest: "45s",
      video: "https://www.youtube.com/results?search_query=face+pull+shoulders+exercise+animation+tutorial&sp=EgIYAQ%253D%253D",
      desc: "À la poulie, tirer la corde vers le visage, coudes hauts, rotation externe.",
      tips: ["Rotation externe en fin de mouvement", "Coudes au niveau des oreilles", "Excellent pour la santé des épaules"],
      lv: 1,
      tags: ["epaules", "posture", "prevention"]
    },
    {
      n: "Arnold press",
      m: "Deltoïdes (tous faisceaux)",
      eq: "Halteres",
      sets: "3\u00d710-12",
      rest: "60s",
      video: "https://www.youtube.com/results?search_query=arnold+press+exercise+animation+tutorial&sp=EgIYAQ%253D%253D",
      desc: "Assis, partir haltères devant le visage en supination, rotation et pousser au-dessus.",
      tips: ["Rotation fluide pendant la montee", "Contrôler le mouvement", "Ne pas se cambrer"],
      lv: 3,
      tags: ["epaules", "triceps", "compose"]
    },
    {
      n: "Élévations frontales",
      m: "Deltoïdes anterieurs",
      eq: "Haltères ou disque",
      sets: "3\u00d712-15",
      rest: "45s",
      video: "https://www.youtube.com/results?search_query=elevations+frontales+front+raises+exercise+animation+tutorial&sp=EgIYAQ%253D%253D",
      desc: "Debout, lever les haltères devant soi jusqu'à hauteur d'épaules.",
      tips: ["Bras légèrement fléchis", "Alterner ou simultane", "Ne pas utiliser l'elan"],
      lv: 1,
      tags: ["epaules", "isolation"]
    },
    {
      n: "Upright row (tirage menton)",
      m: "Deltoïdes / Trapèzes",
      eq: "Barre ou halteres",
      sets: "3\u00d710-12",
      rest: "60s",
      video: "https://www.youtube.com/results?search_query=tirage+menton+upright+row+exercise+animation+tutorial&sp=EgIYAQ%253D%253D",
      warn: "TOUJOURS RISQUE : impingement sous-acromial par rotation interne forcee de l'humerus — remplacer par face pull si douleur epaule ou antecedent coiffe des rotateurs",
      desc: "Debout, tirer la barre le long du corps jusqu'au menton.",
      tips: ["Prise large (> largeur epaules) pour reduire la rotation interne", "Ne jamais monter au-dessus du sternum", "Coudes toujours au-dessus des mains", "STOP immediat si douleur antérieure d'épaule"],
      lv: 2,
      tags: ["epaules", "trapezes", "compose"]
    },
    {
      n: "Élévation frontale câble",
      m: "Deltoïde antérieur",
      eq: "Câble poulie basse",
      sets: "3\u00d712-15",
      rest: "60s",
      desc: "Câble bas, lever le bras droit devant soi jusqu'à la parallele.",
      tips: ["Tension constante vs haltere (câble superieur)", "Lever jusqu'à hauteur des épaules seulement", "Alterner ou simultane"],
      lv: 2,
      tags: ["epaules", "deltoides", "cable", "isolation"]
    },
    {
      n: "Oiseau haltères rear delt",
      m: "Deltoïde postérieur",
      eq: "Halteres",
      sets: "4\u00d715-20",
      rest: "60s",
      desc: "Buste penche à 90 degrés, bras pendants, lever les haltères sur les cotes.",
      tips: ["Légère flexion des coudes", "Pointer les coudes vers le plafond", "Deltoïde postérieur  très souvent neglige"],
      lv: 2,
      tags: ["epaules", "deltoides-posterieurs", "posture"]
    },
    {
      n: "Lu raise",
      m: "Deltoïdes / Coiffe",
      eq: "Haltères très légers",
      sets: "3\u00d710-15",
      rest: "45s",
      desc: "Combine : élévation frontale + latérale + rotation. Mouvement en Y.",
      tips: ["Poids très léger (2-5 kg max)", "Renforce la coiffe en position d'étirement", "Popularisé par Lu Xiaojun"],
      lv: 2,
      tags: ["epaules", "coiffe", "prehab-avance"]
    },
    {
      n: "Shrugs haltères",
      m: "Trapèzes supérieurs",
      eq: "Halteres",
      sets: "4\u00d715",
      rest: "60s",
      desc: "Debout, haltères aux flancs, hausser les épaules au maximum.",
      tips: ["Mouvement vertical — pas de rotation", "Pause 1 seconde en haut", "Ne pas rouler les épaules"],
      lv: 1,
      tags: ["epaules", "trapezes", "isolation"]
    },
    {
      n: "Développé militaire halteres",
      m: "Deltoïde antérieur / Triceps",
      eq: "Halteres",
      sets: "4\u00d78-12",
      rest: "90s",
      warn: "Éviter si conflit sous-acromial, tendinite coiffe des rotateurs ou impingement — tout mouvement overhead depasse 90 degrés d'abduction = risque coiffe",
      desc: "Assis ou debout, pousser les haltères de l'épaule vers le haut.",
      tips: ["Plus grande amplitude qu'a la barre", "Coudes légèrement en avant du corps", "Variante plus stable pour les épaules", "Ne jamais depasser la douleur — toute douleur au pincement en haut = arreter"],
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
      desc: "Debout, fléchir les coudes pour monter la barre vers les épaules.",
      tips: ["Coudes fixes le long du corps", "Ne pas balancer le buste", "Contrôler la descente"],
      lv: 1,
      tags: ["biceps", "avant-bras", "force"]
    },
    {
      n: "Curl haltères alterne",
      m: "Biceps",
      eq: "Halteres",
      sets: "3\u00d710-12",
      rest: "60s",
      video: "https://www.youtube.com/results?search_query=curl+halteres+alternating+dumbbell+curl+exercise+animation+tutorial&sp=EgIYAQ%253D%253D",
      desc: "Debout, fléchir un bras à la fois en supination.",
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
      desc: "Debout, haltères en prise neutre (pouces vers le haut), fléchir les coudes.",
      tips: ["Prise neutre tout le long", "Excellent pour l'épaisseur du bras", "Coudes fixes"],
      lv: 1,
      tags: ["biceps", "avant-bras", "isolation"]
    },
    {
      n: "Curl concentré",
      m: "Biceps (pic)",
      eq: "Haltere",
      sets: "3\u00d710-12",
      rest: "45s",
      video: "https://www.youtube.com/results?search_query=curl+concentre+concentration+curl+exercise+animation+tutorial&sp=EgIYAQ%253D%253D",
      desc: "Assis, coude appuye a l'interieur de la cuisse, fléchir le bras.",
      tips: ["Mouvement  très strict", "Serrer en haut 2 secondes", "Idéal pour le pic du biceps"],
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
      desc: "Bras poses sur le pupitre, fléchir les coudes avec la barre EZ.",
      tips: ["Ne pas hyper-étendre en bas", "Mouvement strict", "Cibler la portion courte du biceps"],
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
      desc: "7 reps moitié basse, 7 reps moitié haute, 7 reps amplitude complete.",
      tips: ["Ne pas tricher sur la forme", "Brûlure intense normale", "Charge modérée"],
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
      desc: "Suspendre à la barre en supination, tirer le menton au-dessus de la barre.",
      tips: ["Prise en supination largeur des épaules", "Excellent pour les biceps et le dos", "Descendre complètement"],
      lv: 3,
      tags: ["biceps", "dos", "compose"]
    },
    {
      n: "Curl élastique",
      m: "Biceps",
      eq: "Bande élastique",
      sets: "3\u00d715-20",
      rest: "45s",
      video: "https://www.youtube.com/results?search_query=curl+élastique+resistance+band+curl+exercise+animation+tutorial&sp=EgIYAQ%253D%253D",
      desc: "Debout sur la bande, fléchir les coudes contre la resistance.",
      tips: ["Tension constante", "Parfait en finition ou en voyage", "Varier les resistances"],
      lv: 1,
      tags: ["biceps", "élastique", "débutant"]
    },
    {
      n: "Curl incline halteres",
      m: "Biceps (chef long)",
      eq: "Haltères + banc incliné",
      sets: "3\u00d710-12",
      rest: "75s",
      desc: "Allongé sur banc incliné à 60 degrés, bras pendant dans le vide. Curler les haltères.",
      tips: ["Étirement maximal du chef long", "Ne pas balancer les bras", "Tension des le départ de l'étirement"],
      lv: 2,
      tags: ["biceps", "chef-long", "etirement"]
    },
    {
      n: "Curl marteau câble",
      m: "Brachial / Brachio-radial",
      eq: "Câble poulie basse + corde",
      sets: "3\u00d712-15",
      rest: "60s",
      desc: "Corde à la poulie basse, curl en prise neutre (marteau).",
      tips: ["Tension constante du câble", "Ciblage du brachial sous le biceps", "Ameliore le thickness du bras"],
      lv: 1,
      tags: ["biceps", "brachial", "cable"]
    },
    {
      n: "Curl spider (araignee)",
      m: "Biceps (pic)",
      eq: "Barre EZ ou haltères + banc incliné",
      sets: "3\u00d710-12",
      rest: "75s",
      desc: "Allonge face contre le banc incliné à 45 degrés, curler la barre en partant bras tendus.",
      tips: ["Coudes fixes devant le banc", "Mouvement  très strict — impossible de tricher", "Excellent pour le pic du biceps"],
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
      desc: "Debout face à la poulie, etendre les bras vers le bas en gardant les coudes fixes.",
      tips: ["Coudes colles au corps", "Ne pas utiliser les épaules", "Serrer en bas"],
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
      desc: "Mains sur le banc derrière soi, descendre les fesses puis remonter.",
      tips: ["Coudes vers l'arrière", "Ne pas descendre trop bas si douleur", "Jambes tendues pour plus de difficulté"],
      lv: 1,
      tags: ["triceps", "poids du corps", "débutant"]
    },
    {
      n: "Skull crushers (barre front)",
      m: "Triceps (longue portion)",
      eq: "Barre EZ + banc",
      sets: "4\u00d710-12",
      rest: "75s",
      video: "https://www.youtube.com/results?search_query=skull+crushers+exercise+animation+tutorial&sp=EgIYAQ%253D%253D",
      desc: "Allongé sur le banc, descendre la barre vers le front puis etendre les bras.",
      tips: ["Coudes fixes pointant vers le plafond", "Descendre vers le front, pas la poitrine", "Charge modérée pour la securite"],
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
      desc: "À la poulie haute, ecarter la corde en bas du mouvement.",
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
      desc: "Penché en avant, bras le long du corps, etendre l'avant-bras vers l'arrière.",
      tips: ["Bras immobile, seul l'avant-bras bouge", "Serrer en haut 1 seconde", "Charge legere, execution parfaite"],
      lv: 1,
      tags: ["triceps", "isolation", "unilateral"]
    },
    {
      n: "Développé couché prise serrée",
      m: "Triceps / Pectoraux",
      eq: "Barre + banc",
      sets: "4\u00d78-10",
      rest: "90s",
      video: "https://www.youtube.com/results?search_query=developpe+couche+prise+serree+close+grip+bench+press+exercise+animation+tutorial&sp=EgIYAQ%253D%253D",
      desc: "Développé couché avec les mains rapprochées (largeur des épaules).",
      tips: ["Prise à largeur d'épaules", "Coudes près du corps", "Excellent pour la masse des triceps"],
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
      desc: "Assis ou debout, tenir un haltere a deux mains au-dessus de la tête, fléchir les coudes.",
      tips: ["Coudes pointant vers le plafond", "Descendre lentement derrière la tête", "Cibler la longue portion"],
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
      desc: "Pompes avec les mains rapprochées formant un losange.",
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
      desc: "Développé couché prise serrée, amener la barre vers le front en pliant les coudes.",
      tips: ["Hybride entre developpe et extension triceps", "Charge lourde possible", "Excellent pour la masse triceps"],
      lv: 3,
      tags: ["triceps", "force", "masse", "compose"]
    },
    {
      n: "Extension triceps câble corde",
      m: "Triceps (tous les chefs)",
      eq: "Câble poulie haute + corde",
      sets: "3\u00d712-15",
      rest: "60s",
      desc: "Corde à la poulie haute, pousser vers le bas en écartant la corde en bas.",
      tips: ["Ecarter la corde en bas pour finition maximale", "Coudes contre le corps", "Tension constante du câble"],
      lv: 1,
      tags: ["triceps", "cable", "isolation", "finition"]
    },
    {
      n: "Barre au front skullcrusher",
      m: "Triceps (chefs lateral et medial)",
      eq: "Barre EZ + banc",
      sets: "4\u00d710-12",
      rest: "75s",
      desc: "Allongé, descendre la barre vers le front en pliant les coudes.",
      tips: ["Descendre jusqu'au front ou derrière la tête pour plus de stretch", "Coudes vers l'interieur", "Ne pas verrouiller complètement"],
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
      warn: "Contre-indiqué si hernie discale L4/L5 ou L5/S1 (compression axiale), gonarthrose sévère ou LCA fragile — préférer goblet squat ou hack squat machine",
      desc: "Barre sur les trapezes, descendre en fléchissant les genoux et les hanches.",
      tips: ["Genoux dans l'axe des 2e/3e orteils", "Descendre au moins à la parallele", "Dos droit, regard devant", "Talon a plat — si impossible = mobilité cheville insuffisante", "Wink pelvien (retroversion en bas) = flexion insuffisante", "Barre haute sur les trapezes = plus de flexion lombaire : préférer barre basse si lombaires fragiles"],
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
      desc: "Assis à la presse, pousser la plateforme avec les pieds.",
      tips: ["Pieds à largeur d'épaules", "Ne pas verrouiller les genoux", "Descendre à 90 degrés"],
      lv: 1,
      tags: ["jambes", "fessiers", "machine"]
    },
    {
      n: "Fentes avant",
      m: "Quadriceps / Fessiers",
      eq: "Haltères ou barre",
      sets: "3\u00d710-12 par jambe",
      rest: "90s",
      video: "https://www.youtube.com/results?search_query=fentes+avant+forward+lunges+exercise+animation+tutorial&sp=EgIYAQ%253D%253D",
      desc: "Faire un grand pas en avant, descendre le genou arrière vers le sol.",
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
      desc: "Allonge ou assis à la machine, fléchir les genoux pour ramener les talons vers les fesses.",
      tips: ["Mouvement contrôlé", "Ne pas décollér les hanches", "Serrer en haut"],
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
      warn: "Deconseille si tendinopathie rotulienne active ou LCA fragilise — préférer Terminal leg extension",
      desc: "Assis à la machine, etendre les jambes vers l'avant.",
      tips: ["Ne pas utiliser d'elan", "Contracter les quadriceps en haut", "Mouvement lent"],
      lv: 1,
      tags: ["jambes", "quadriceps", "isolation"]
    },
    {
      n: "Squat bulgare",
      m: "Quadriceps / Fessiers",
      eq: "Haltères + banc",
      sets: "3\u00d78-12 par jambe",
      rest: "60s",
      video: "https://www.youtube.com/results?search_query=squat+bulgare+bulgarian+split+squat+exercise+animation+tutorial&sp=EgIYAQ%253D%253D",
      desc: "Pied arrière surélevé sur un banc, descendre en squat unilateral.",
      tips: ["Pied avant suffisamment en avant", "Buste légèrement penche", "Excellent pour l'équilibre"],
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
      tips: ["Amplitude complete", "Pause en bas pour etirer", "Frequence élevée"],
      lv: 1,
      tags: ["mollets", "isolation"]
    },
    {
      n: "Pistol squat",
      m: "Quadriceps / Équilibre",
      eq: "Poids du corps",
      sets: "3\u00d75-8 par jambe",
      rest: "90s",
      video: "https://www.youtube.com/results?search_query=pistol+squat+exercise+animation+tutorial&sp=EgIYAQ%253D%253D",
      warn: "Contre-indiqué si douleur rotulienne, syndrome femoro-patellaire, LCA fragile ou opere, menisque lese — flexion >120 degrés impossible sans risque ligamentaire",
      desc: "Squat sur une jambe, l'autre jambe tendue devant soi.",
      tips: ["Commencer avec un support", "Exige force et mobilite", "Exercice avance", "Ne pas forcer si douleur rotulienne", "Exige LCA et menisques sains — bilan medical obligatoire avant"],
      lv: 4,
      tags: ["jambes", "équilibre", "avance", "poids du corps"]
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
      warn: "Contre-indiqué si hernie discale L4/L5 ou L5/S1 — la flexion du tronc sous charge comprime le disque posterieurement",
      desc: "Debout, barre aux hanches, descendre en gardant les jambes semi-fléchies jusqu'au tibia.",
      tips: ["Dos plat OBLIGATOIRE — la moindre flexion lombaire sous charge = risque disque", "Sentir l'étirement des ischios", "Barre contre les jambes tout le long", "Amplitude limitée à la flexion de hanche sans perte de lordose"],
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
      eq: "Haltères + banc/step",
      sets: "3\u00d710-12 par jambe",
      rest: "60s",
      desc: "Monter sur le banc avec une jambe, amener l'autre genou en haut.",
      tips: ["Pousser depuis le talon de la jambe qui monte", "Contrôler la descente", "Excellent pour équilibre et genoux"],
      lv: 2,
      tags: ["jambes", "fessiers", "unilateral", "fonctionnel"]
    },
    {
      n: "Sissy squat",
      m: "Quadriceps (isolation)",
      eq: "Poids du corps (support)",
      sets: "3\u00d712-15",
      rest: "60s",
      warn: "S trèss patello-femoral et ligamentaire  très eleve — contre-indique si tendinopathie rotulienne, LCA fragile, chondropathie ou douleur antérieure du genou",
      desc: "Debout, se tenir a un support, descendre en laissant les genoux aller loin en avant.",
      tips: ["Pointes de pieds rélevées", "Stretch intense des quadriceps", "Progresser avec lest", "STOP immediat si douleur au genou — ne pas confondre brulure musculaire et douleur articulaire"],
      lv: 3,
      tags: ["jambes", "quadriceps", "isolation", "avance"]
    },
    {
      n: "Goblet squat",
      m: "Quadriceps / Fessiers",
      eq: "Haltere ou kettlebell",
      sets: "3\u00d712-15",
      rest: "60s",
      desc: "Tenir l'haltère à la poitrine, squat profond avec les coudes entre les genoux.",
      tips: ["Excellent pour apprendre le squat profond", "Coudes poussent les genoux vers l'exterieur", "Ideal débutants et mobilité cheville"],
      lv: 1,
      tags: ["jambes", "fessiers", "débutant", "mobilite"]
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
      desc: "Faire un pas en arrière, descendre le genou vers le sol, remonter.",
      tips: ["Plus de s trèss sur les fessiers que les fentes avant", "Buste droit", "Contrôler le mouvement"],
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
      desc: "Pieds  très ecartes, pointes vers l'exterieur, descendre en squat.",
      tips: ["Pieds 1.5x largeur d'épaules", "Genoux dans l'axe des pieds", "Cibler adducteurs et fessiers"],
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
      tips: ["Ne pas pousser avec le pied arriere", "Box à hauteur du genou", "Contracter le fessier en haut"],
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
      tips: ["Serrer les fessiers en haut", "Pieds à largeur de hanches", "Idéal pour les débutants"],
      lv: 1,
      tags: ["fessiers", "poids du corps", "débutant"]
    },
    {
      n: "Donkey kick",
      m: "Grand fessier",
      eq: "Poids du corps ou élastique",
      sets: "3\u00d715-20 par jambe",
      rest: "45s",
      video: "https://www.youtube.com/results?search_query=donkey+kick+glutes+exercise+animation+tutorial&sp=EgIYAQ%253D%253D",
      desc: "A quatre pattes, pousser un pied vers le plafond en gardant le genou à 90 degrés.",
      tips: ["Ne pas arquer le dos", "Contracter le fessier en haut", "Ajouter un élastique pour plus de resistance"],
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
      desc: "Assis à la machine, ecarter les genoux contre la resistance.",
      tips: ["Se pencher en avant pour cibler le moyen fessier", "Mouvement contrôlé", "Serrer en position ouverte"],
      lv: 1,
      tags: ["fessiers", "moyen fessier", "machine"]
    },
    {
      n: "Soulevé de terre roumain",
      m: "Fessiers / Ischio-jambiers",
      eq: "Barre ou halteres",
      sets: "4\u00d78-12",
      rest: "90s",
      video: "https://www.youtube.com/results?search_query=souleve+de+terre+roumain+romanian+deadlift+exercise+animation+tutorial&sp=EgIYAQ%253D%253D",
      warn: "Contre-indiqué si hernie discale L4/L5 ou L5/S1 — descente sous charge = compression posterolaterale du disque",
      desc: "Debout, descendre la barre le long des cuisses en poussant les hanches en arrière.",
      tips: ["Jambes quasi tendues", "Dos PLAT en permanence — ne jamais arrondir le lombaire", "Sentir l'étirement des ischio-jambiers", "Amplitude limitée : arreter quand le dos commence a s'arrondir"],
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
      n: "Kickback câble fessier",
      m: "Grand fessier",
      eq: "Câble cheville",
      sets: "3\u00d715 par jambe",
      rest: "45s",
      desc: "Cheville à la poulie basse, penche en avant, lancer la jambe vers l'arrière.",
      tips: ["Contracter le fessier en haut", "Ne pas balancer — mouvement contrôlé", "Congestion maximale"],
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
      tags: ["fessiers", "adducteurs", "débutant"]
    },
    {
      n: "Fentes latérales",
      m: "Fessiers / Adducteurs",
      eq: "Haltères ou poids du corps",
      sets: "3\u00d710-12 par jambe",
      rest: "60s",
      desc: "Écarter une jambe sur le côté, plier le genou et descendre, l'autre jambe tendue.",
      tips: ["Pied pointe vers l'exterieur du cote qui flechit", "Excellent pour les adducteurs et moyen fessier", "Contrôler le genou dans l'axe du pied"],
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
      warn: "Deconseille si hernie discale (flexion lombaire repetee = risque discal) ou ostéoporose (compression vertébrale antérieure en flexion) — préférer McGill curl-up ou planche",
      desc: "Allonge au sol, décollér les épaules en contractant les abdominaux.",
      tips: ["Contractez le transverse (rentrer le nombril) avant tout mouvement", "Ne pas tirer sur la nuque", "Expirer en montant", "Regard vers le plafond", "Amplitude minimale : epaules à 30 degrés — pas de sit-up complet"],
      lv: 1,
      tags: ["abdos", "grand droit", "débutant"]
    },
    {
      n: "Planche (gainage)",
      m: "Transverse / Core",
      eq: "Poids du corps",
      sets: "3\u00d730-60s",
      rest: "45s",
      video: "https://www.youtube.com/results?search_query=planche+gainage+plank+exercise+animation+tutorial&sp=EgIYAQ%253D%253D",
      desc: "Appui sur les avant-bras et les pieds, corps droit comme une planche.",
      tips: ["Corps aligné de la tête aux pieds", "Contracter les fessiers et les abdos", "Ne pas lever les fesses"],
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
      tips: ["Garder les hanches basses", "Rythme rapide pour le cardio", "Excellent brûleur de calories"],
      lv: 1,
      tags: ["abdos", "cardio", "poids du corps"]
    },
    {
      n: "Relevé de jambes suspendu",
      m: "Grand droit (portion basse)",
      eq: "Barre de traction",
      sets: "3\u00d710-15",
      rest: "60s",
      video: "https://www.youtube.com/results?search_query=releve+de+jambes+hanging+leg+raise+exercise+animation+tutorial&sp=EgIYAQ%253D%253D",
      desc: "Suspendu à la barre, monter les jambes tendues devant soi.",
      tips: ["Contractez le transverse (rentrer le nombril) avant tout mouvement", "Jambes tendues pour plus de difficulté", "Contrôler la descente", "Ne pas balancer"],
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
      warn: "Attention ostéoporose sévère et spondylarthrite : la rotation axiale sous charge peut fragiliser le rachis. Préférer planche latérale ou rotation debout à faible amplitude.",
      desc: "Assis, pieds décollés du sol, faire pivoter le buste de gauche à droite.",
      tips: ["Contractez le transverse (rentrer le nombril) avant tout mouvement", "Pieds décollés pour plus de difficulté", "Rotation du buste, pas des bras", "Ajouter du poids progressivement"],
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
      desc: "Allongé, bras et jambes décollés du sol, dos plaqué au sol.",
      tips: ["Bas du dos collé au sol", "Position de base en gymnastique", "Progresser en durée"],
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
      warn: "Contre-indiqué si ostéoporose — le rollout crée une flexion vertébrale avec charge excentrique élevée (risque fracture de compression — Sinaki, Spine 2002). Préférer planche ou bird-dog.",
      desc: "À genoux, faire rouler la roue devant soi en gardant le dos droit, puis revenir.",
      tips: ["Ne pas cambrer le dos", "Contracter les abdos tout le long", "Commencer à genoux"],
      lv: 3,
      tags: ["abdos", "core", "avance"]
    },
    {
      n: "Câble crunch (crunch poulie)",
      m: "Grand droit",
      eq: "Poulie haute + corde",
      sets: "3\u00d712-15",
      rest: "60s",
      video: "https://www.youtube.com/results?search_query=cable+crunch+exercise+animation+tutorial&sp=EgIYAQ%253D%253D",
      desc: "A genoux devant la poulie, fléchir le buste vers le sol en contractant les abdos.",
      tips: ["Hanches fixes, seul le buste bouge", "Corde derrière la tête", "Resistance constante"],
      lv: 2,
      tags: ["abdos", "machine", "force"]
    },
    {
      n: "Planche latérale",
      m: "Obliques / Core",
      eq: "Poids du corps",
      sets: "3\u00d720-40s par cote",
      rest: "30s",
      video: "https://www.youtube.com/results?search_query=planche+laterale+side+plank+exercise+animation+tutorial&sp=EgIYAQ%253D%253D",
      desc: "En appui lateral sur un avant-bras, corps aligné, maintenir la position.",
      tips: ["Hanches hautes et alignées", "Contracter les obliques", "Ne pas laisser les hanches tomber"],
      lv: 2,
      tags: ["abdos", "obliques", "gainage"]
    },
    {
      n: "Dragon flag",
      m: "Core complet / Rectus",
      eq: "Banc ou barre",
      sets: "3\u00d75-8",
      rest: "90s",
      warn: "Contre-indiqué si hernie discale (flexion lombaire excentrique sous charge corporelle totale), ostéoporose (contrainte en flexion sur T6-L2 — Sinaki, Spine 2002) ou HTA sévère (effort isometrique maximal = pic tensionnel). Exercice expert uniquement.",
      desc: "Allongé, tenir la barre derrière la tête, monter et descendre le corps raide comme une planche.",
      tips: ["Corps RIGIDE comme une planche", "Exercice de Bruce Lee —  très difficile", "Commencer avec les jambes fléchies"],
      lv: 4,
      tags: ["abdos", "core", "avance", "expert"]
    },
    {
      n: "Pallof press",
      m: "Core anti-rotation",
      eq: "Câble poulie",
      sets: "3\u00d710-12 par cote",
      rest: "45s",
      desc: "Debout de cote face au câble, tendre les bras devant soi en resistant à la rotation.",
      tips: ["Core complètement stable — ne pas bouger le tronc", "Exercice anti-rotation = fonctionnel ++", "Indispensable pour sportifs"],
      lv: 2,
      tags: ["abdos", "anti-rotation", "fonctionnel", "core"]
    },
    {
      n: "L-sit progressions",
      m: "Psoas / Rectus / Hip flexors",
      eq: "Barres parallèles ou sol",
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
      desc: "Suspendu à la barre, jambes tendues, basculer de gauche a droite comme des essuie-glaces.",
      tips: ["Jambes tendues pour plus de difficulté", "Controle de la rotation — ne pas balancer", "Progresser avec jambes fléchies"],
      lv: 4,
      tags: ["abdos", "obliques", "avance", "suspension"]
    }
  ],

  // ─── CARDIO ───
  cardio: [
    {
      n: "Course à pied",
      m: "Système cardiovasculaire",
      eq: "Chaussures de running",
      sets: "20-45 min",
      rest: "N/A",
      video: "https://www.youtube.com/results?search_query=course+a+pied+running+technique+exercise+animation+tutorial&sp=EgIYAQ%253D%253D",
      desc: "Courir à un rythme régulier, en zone 2 pour le cardio de base.",
      tips: ["Commencer par 20 minutes", "Respirer par le nez et la bouche", "Augmenter progressivement la durée"],
      lv: 1,
      tags: ["cardio", "endurance", "brûleur de calories"]
    },
    {
      n: "Corde à sauter",
      m: "Cardiovasculaire / Mollets",
      eq: "Corde à sauter",
      sets: "5\u00d72 min",
      rest: "30s",
      video: "https://www.youtube.com/results?search_query=corde+a+sauter+jump+rope+exercise+animation+tutorial&sp=EgIYAQ%253D%253D",
      desc: "Sauter à la corde à un rythme régulier ou en intervalles.",
      tips: ["Sauter sur la pointe des pieds", "Poignets détendus", "Excellent pour la coordination"],
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
      desc: "Enchaîner squat, planche, pompe, saut vertical.",
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
      desc: "Sauter en écartant les jambes et en levant les bras simultanément.",
      tips: ["Atterrir en douceur", "Rythme régulier", "Parfait pour l'échauffement"],
      lv: 1,
      tags: ["cardio", "echauffement", "débutant"]
    },
    {
      n: "Box jumps",
      m: "Explosivité / Cardiovasculaire",
      eq: "Box ou banc",
      sets: "4\u00d78-10",
      rest: "60s",
      video: "https://www.youtube.com/results?search_query=box+jumps+exercise+animation+tutorial&sp=EgIYAQ%253D%253D",
      desc: "Sauter sur une box depuis le sol, se relever complètement, redescendre.",
      tips: ["Commencer avec une box basse", "Atterrir en douceur genoux fléchis", "Ne pas enchainer trop vite"],
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
      n: "Vélo HIIT (assault bike)",
      m: "Cardiovasculaire",
      eq: "Velo d'assault ou velo stationnaire",
      sets: "8\u00d720s sprint / 40s repos",
      rest: "40s",
      video: "https://www.youtube.com/results?search_query=velo+hiit+assault+bike+exercise+animation+tutorial&sp=EgIYAQ%253D%253D",
      desc: "Pédaler à intensité maximale pendant les intervalles de sprint.",
      tips: ["Sprint à fond pendant 20 secondes", "Récupération active pendant 40 secondes", "8-10 rounds suffisent"],
      lv: 2,
      tags: ["cardio", "hiit", "brûleur de calories"]
    },
    {
      n: "Marche rapide inclinée",
      m: "Cardiovasculaire / Fessiers",
      eq: "Tapis de course",
      sets: "20-40 min",
      rest: "N/A",
      video: "https://www.youtube.com/results?search_query=marche+rapide+incline+treadmill+walk+exercise+animation+tutorial&sp=EgIYAQ%253D%253D",
      desc: "Marcher a 5-6 km/h sur un tapis incliné à 10-15%.",
      tips: ["Inclinaison à 10-15%", "Ne pas se tenir aux poignées", "Zone 2 cardio idéale pour brûler les graisses"],
      lv: 1,
      tags: ["cardio", "fessiers", "brûleur de graisses", "débutant"]
    }
  ],

  // ─── PREHAB / PREVENTION ───
  prehab: [
    // ── EPAULES / COIFFE DES ROTATEURS ──
    {
      n: "Rotation externe élastique",
      m: "Coiffe des rotateurs (infra-épineux)",
      eq: "Elastique / bande",
      sets: "3\u00d715-20",
      rest: "45s",
      desc: "Coude à 90 degrés contre le corps, tirer l'élastique vers l'exterieur en rotation externe.",
      tips: ["Coude colle au flanc", "Mouvement lent et contrôlé", "Amplitude complete sans douleur"],
      lv: 1,
      tags: ["prehab", "epaules", "coiffe", "prevention"]
    },
    {
      n: "Face pull prehab",
      m: "Deltoi\u00efde posterieur / Coiffe",
      eq: "Câble poulie haute ou élastique",
      sets: "3\u00d715",
      rest: "45s",
      desc: "Tirer le câble vers le visage, coudes au-dessus des épaules, ouvrir les bras.",
      tips: ["Coudes hauts en permanence", "Contractez les trapez\u00e8s inferieurs", "Excellent contre-exercice au developpe"],
      lv: 1,
      tags: ["prehab", "epaules", "posture", "prevention"]
    },
    {
      n: "Band pull-apart",
      m: "Deltoi\u00efde posterieur / Rhomboïdes",
      eq: "Bande élastique",
      sets: "3\u00d720",
      rest: "30s",
      desc: "Tenir l'élastique à hauteur des épaules, tirer les mains vers l'exterieur jusqu'à ouvrir les bras.",
      tips: ["Bras tendus", "Pincer les omoplates", "Idéal avant tout entraînement epaules/poitrine"],
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
      desc: "Allongé, creuser le bas du dos contre le sol, jambes et bras tendus à 45 degrés. Tenir.",
      tips: ["Bas du dos plaqué au sol en permanence", "Respiration normale", "Progresser en éloignant les bras/jambes"],
      lv: 2,
      tags: ["prehab", "core", "lombaires", "prevention"]
    },
    {
      n: "Bird-dog",
      m: "Érecteurs du rachis / Core",
      eq: "Poids du corps",
      sets: "3\u00d710 par cote",
      rest: "30s",
      desc: "A 4 pattes, etendre le bras droit et la jambe gauche simultanément. Alterner.",
      tips: ["Dos horizontal — ne pas se dehancher", "Pointer les orteils", "Rentrer le nombril"],
      lv: 1,
      tags: ["prehab", "lombaires", "core", "équilibre"]
    },
    {
      n: "McGill curl-up",
      m: "Rectus abdominis (sans flexion lombaire)",
      eq: "Poids du corps",
      sets: "3\u00d78-10",
      rest: "30s",
      desc: "Allongé, une jambe fléchie, mains sous les lombaires. Lever légèrement la tête et les épaules.",
      tips: ["NE PAS arrondir le bas du dos", "Mouvement minimal — 2-3cm suffisent", "Recommande par Stuart McGill pour lombalgie"],
      lv: 1,
      tags: ["prehab", "abdos", "lombaires", "rehabilitation"]
    },
    // ── GENOUX ──
    {
      n: "Terminal leg extension",
      m: "Vaste interne (VMO)",
      eq: "Elastique / câble bas",
      sets: "3\u00d715",
      rest: "30s",
      desc: "Debout, élastique derrière le genou, extension complete des 30 derniers degrés.",
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
      desc: "Genoux au sol, pieds bloqués. Se laisser tomber lentement en contrôlant avec les ischios.",
      tips: ["Descente TRÈS lente (3-5 secondes)", "Phase la plus efficace = excentrique", "Prévention déchirure ischios (etudes NFL, FIFA)"],
      lv: 3,
      tags: ["prehab", "ischios", "prevention", "excentrique"]
    },
    {
      n: "Clamshell élastique",
      m: "Fessiers moyens / Rotateurs externes hanche",
      eq: "Elastique",
      sets: "3\u00d715 par cote",
      rest: "30s",
      desc: "Allongé sur le côté, genoux fléchis, élastique au-dessus des genoux. Ouvrir le genou du dessus.",
      tips: ["Bassin fixe — ne pas rouler", "Ciblage fessier moyen pour stabilité genou/hanche", "Progression : debout en pont fessier"],
      lv: 1,
      tags: ["prehab", "fessiers", "hanches", "genoux"]
    },
    // ── CHEVILLE / PIED ──
    {
      n: "Mobilité cheville mur",
      m: "Cheville (dorsiflexion)",
      eq: "Poids du corps + mur",
      sets: "3\u00d710 par cote",
      rest: "15s",
      desc: "Debout face au mur, pied à 10-15cm. Genou vers le mur sans lever le talon.",
      tips: ["Mesurer la distance pied-mur", "Indispensable pour squat profond", "Augmenter progressivement la distance"],
      lv: 1,
      tags: ["prehab", "cheville", "mobilite", "squat"]
    },
    // ── POIGNETS / AVANT-BRAS ──
    {
      n: "Renforcement poignet fléchisseurs",
      m: "Fléchisseurs avant-bras",
      eq: "Haltere leger",
      sets: "3\u00d715",
      rest: "30s",
      desc: "Avant-bras pose sur la cuisse, poignet en dehors. Fléchir/etendre le poignet.",
      tips: ["Poids très léger (1-2 kg suffisent)", "Prévention épicondylite mediale", "Mouvement d'amplitude complete"],
      lv: 1,
      tags: ["prehab", "poignets", "avant-bras", "épicondylite"]
    },
    {
      n: "Renforcement poignet extenseurs",
      m: "Extenseurs avant-bras",
      eq: "Haltere leger",
      sets: "3\u00d715",
      rest: "30s",
      desc: "Avant-bras posé, paume vers le bas. Étendre le poignet vers le haut.",
      tips: ["Prévention épicondylite laterale (tennis elbow)", "Poids 1-2 kg maximum", "Mouvement lent et contrôlé"],
      lv: 1,
      tags: ["prehab", "poignets", "extenseurs", "tennis-elbow"]
    },
    // ── POSTURE / COLONNE ──
    {
      n: "Jefferson curl",
      m: "Colonne vertébrale (mobilité en flexion)",
      eq: "Haltere très léger",
      sets: "3\u00d75-8",
      rest: "60s",
      desc: "Debout sur une marche, descendre vertebre par vertebre avec un poids très léger.",
      tips: ["Poids TRES leger (5-10 kg max)", "Mouvement LENT — 5-8 secondes", "Renforce les disques EN FLEXION CONTROLEE — differe du deadlift"],
      lv: 2,
      tags: ["prehab", "colonne", "mobilite", "decompression"]
    },
    {
      n: "Étirement piriforme (figure 4)",
      m: "Piriforme / Rotateurs hanche",
      eq: "Poids du corps",
      sets: "3\u00d730s par cote",
      rest: "15s",
      desc: "Allongé, croiser la cheville droite sur le genou gauche. Tirer la jambe gauche vers la poitrine.",
      tips: ["Sentir l'étirement dans la fesse", "Prévention sciatique par compression piriforme", "Maintenir 30 secondes minimum"],
      lv: 1,
      tags: ["prehab", "hanches", "piriforme", "sciatique", "etirement"]
    },
    {
      n: "Activation fessier proné",
      m: "Grand fessier",
      eq: "Poids du corps",
      sets: "3\u00d715 par cote",
      rest: "30s",
      desc: "Allongé sur le ventre, contracter le fessier et lever une jambe légèrement du sol.",
      tips: ["Contracter le fessier AVANT de lever la jambe", "Evite d'activer les lombaires à la place", "Indispensable si amnesie gluteale (bureau, sedentarite)"],
      lv: 1,
      tags: ["prehab", "fessiers", "activation", "lombaires"]
    }
  ]
};
