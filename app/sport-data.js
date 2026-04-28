/**
 * SmartFitCoach — Données statiques sport
 * Chargé avant app-sport.js. Expose les données comme globals window.*
 * que app-sport.js aliase en variables locales au début de son IIFE.
 * Proprietary — Copyright (c) 2024-2026 SmartFitCoach
 */
/* jshint esversion: 5 */

window.SPORT_PROGRAM_VERSION = 3; // v1=initial, v2=split fix, v3=desync+medical+weakZones;

window._SPORT_PROGRAM_STEP = {
  musculation: 4, crossfit: 6, running: 8, hyrox: 10,
  padel: 12, golf: 14, triathlon: 18, yoga: 21, cycling: 23, calisthenics: 25
};

window.SPORT_QUOTES = [
 {t:"Les champions ne sont pas faits dans les salles de gym. Les champions sont faits \u00e0 partir de quelque chose de profond.",a:"Muhammad Ali"},
 {t:"Le talent gagne des matchs, mais le travail d'\u00e9quipe et l'intelligence gagnent des championnats.",a:"Michael Jordan"},
 {t:"La force ne vient pas de la capacit\u00e9 physique. Elle vient d'une volont\u00e9 indomptable.",a:"Gandhi"},
 {t:"Le succ\u00e8s n'est pas d\u00e9finitif, l'\u00e9chec n'est pas fatal. C'est le courage de continuer qui compte.",a:"Winston Churchill"},
 {t:"Ne comptez pas les jours, faites que les jours comptent.",a:"Muhammad Ali"},
 {t:"Le sport ne forge pas le caract\u00e8re. Il le r\u00e9v\u00e8le.",a:"Heywood Broun"},
 {t:"La discipline est le pont entre les objectifs et l'accomplissement.",a:"Jim Rohn"},
 {t:"Le sport va chercher la peur pour la dominer, la fatigue pour en triompher.",a:"Pierre de Coubertin"},
 {t:"Seuls ceux qui risquent d'aller trop loin peuvent d\u00e9couvrir jusqu'o\u00f9 on peut aller.",a:"T.S. Eliot"},
 {t:"Un champion est quelqu'un qui se rel\u00e8ve quand il ne peut pas.",a:"Jack Dempsey"},
 {t:"La pers\u00e9v\u00e9rance n'est pas une longue course. C'est plusieurs courtes courses l'une apr\u00e8s l'autre.",a:"Walter Elliot"},
 {t:"La victoire appartient au plus pers\u00e9v\u00e9rant.",a:"Napol\u00e9on Bonaparte"},
 {t:"La sueur d'aujourd'hui est la force de demain.",a:""},
 {t:"Vous n'\u00eates qu'\u00e0 un entra\u00eenement d'une bonne humeur.",a:""},
 {t:"Le plus grand ennemi de la performance est l'impatience.",a:"Tiger Woods"},
 {t:"Soit tu souffres de la douleur de la discipline, soit tu souffres du regret.",a:"Jim Rohn"},
 {t:"Je n'ai jamais perdu. J'ai seulement appris.",a:"Nelson Mandela"},
 {t:"La pr\u00e9paration, c'est tout.",a:"Alexander Graham Bell"},
 {t:"Aucun raccourci ne m\u00e8ne au sommet.",a:"Tenzing Norgay"},
 {t:"Le mental est l'athl\u00e8te. Le corps, simplement l'instrument.",a:"Clarence Greene"},
 {t:"Chaque record battu \u00e9tait autrefois consid\u00e9r\u00e9 impossible.",a:""},
 {t:"La r\u00e9gularit\u00e9 construit ce que l'intensit\u00e9 seule ne peut pas.",a:""},
 {t:"Un athl\u00e8te accompli sait que la r\u00e9cup\u00e9ration est aussi importante que l'effort.",a:""},
 {t:"Le corps devient ce qu'il fait r\u00e9guli\u00e8rement.",a:"Aristote"},
 {t:"Ce n'est pas la force qui gagne, c'est la technique et la volont\u00e9.",a:""},
 {t:"On ne devient pas athl\u00e8te en un jour, mais on peut d\u00e9cider de l'\u00eatre en un instant.",a:""},
 {t:"La douleur est temporaire. La r\u00e9ussite est permanente.",a:""},
 {t:"L'ath\u00e8te vit dans deux mondes simultan\u00e9ment : la r\u00e9alit\u00e9 et le possible.",a:"Wilma Rudolph"},
 {t:"La pr\u00e9paration d'hier est la performance d'aujourd'hui.",a:""},
 {t:"Chaque entra\u00eenement est une promesse tenue \u00e0 soi-m\u00eame.",a:""},
 {t:"La comp\u00e9tition commence l\u00e0 o\u00f9 les autres s'arr\u00eatent.",a:""},
 {t:"L'excellence n'est pas un acte, c'est une habitude.",a:"Aristote"},
 {t:"Le champion d'hier s'est entra\u00een\u00e9 quand personne ne regardait.",a:""},
 {t:"Fixez des objectifs si hauts que vos r\u00eaves semblent petits en comparaison.",a:""},
 {t:"La vitesse s'acquiert. L'endurance se construit. Le mental se forge.",a:""},
 {t:"Repoussez vos limites \u2014 non pas pour les d\u00e9passer, mais pour d\u00e9couvrir o\u00f9 elles sont vraiment.",a:""},
 {t:"Le secret des champions est simple : ils s'entra\u00eenent quand \u00e7a ne leur convient pas.",a:""},
 {t:"Ce qui ne te brise pas te construit, \u00e0 condition de continuer.",a:""},
 {t:"Gagner c'est bien. Progresser, c'est mieux.",a:""},
 {t:"La discipline du corps lib\u00e8re l'esprit.",a:""},
 {t:"L'entra\u00eenement dur pr\u00e9pare aux comp\u00e9titions faciles.",a:""}
];

window.SPORT_MED_ZONES = {
  running: [
    {key:'genou',     label:'Genoux',              desc:'Syndrome fémoro-patellaire, IT band'},
    {key:'cheville',  label:'Cheville / Pied',      desc:'Tendon d\'Achille, fasciite plantaire'},
    {key:'tibia',     label:'Tibias',               desc:'Syndrome tibial antérieur (shin splints)'},
    {key:'hanche',    label:'Hanche / Ilio-psoas',  desc:'Douleur coxo-fémorale, labrum'},
    {key:'lombaire',  label:'Bas du dos',            desc:'Lombalgie, hernie discale'}
  ],
  crossfit: [
    {key:'epaule',    label:'Épaules',              desc:'Overhead, impingement, coiffe des rotateurs'},
    {key:'lombaire',  label:'Bas du dos',            desc:'Deadlifts, cleans, soulevés de terre'},
    {key:'genou',     label:'Genoux',               desc:'Box jumps, squat snatches, thrusters'},
    {key:'poignet',   label:'Poignets',             desc:'Kipping, barbell cleans, wall balls'},
    {key:'cervicale', label:'Nuque / Cervicales',   desc:'Positions overhead prolongées'}
  ],
  yoga: [
    {key:'epaule',    label:'Épaules / Nuque',      desc:'Inversions, chaturangas, backbends'},
    {key:'lombaire',  label:'Bas du dos',            desc:'Forward folds, backbends profonds'},
    {key:'genou',     label:'Genoux',               desc:'Postures assises, pigeon pose, lotus'},
    {key:'hanche',    label:'Hanches',              desc:'Amplitude limitée, labrum'},
    {key:'poignet',   label:'Poignets',             desc:'Support du poids du corps, planche'}
  ],
  cycling: [
    {key:'genou',     label:'Genoux',               desc:'Syndrome fémoro-patellaire, IT band'},
    {key:'lombaire',  label:'Bas du dos',            desc:'Position aéro prolongée'},
    {key:'cervicale', label:'Nuque / Cervicales',   desc:'Position tête baissée (TT, aéro)'},
    {key:'hta_severe',label:'Hypertension sévère',  desc:'Intensité FTP limitée'}
  ],
  hyrox: [
    {key:'cardio',    label:'Cardiovasculaire',      desc:'Effort soutenu haute intensité'},
    {key:'epaule',    label:'Épaules / Dos',         desc:'Sled push/pull, wall balls'},
    {key:'lombaire',  label:'Bas du dos',            desc:'Farmer carry, rowing machine'},
    {key:'genou',     label:'Genoux',               desc:'Lunges, burpees, squats jump'}
  ],
  padel: [
    {key:'epaule',    label:'Épaule / Coiffe',       desc:'Smashes, service, accélération'},
    {key:'coude',     label:'Coude / Avant-bras',    desc:'Épicondylite (tennis elbow)'},
    {key:'genou',     label:'Genoux',               desc:'Pivots, changements de direction'},
    {key:'cheville',  label:'Chevilles',             desc:'Entorses récurrentes, instabilité'}
  ],
  golf: [
    {key:'lombaire',  label:'Bas du dos',            desc:'Rotation du swing, contrainte L4-L5'},
    {key:'coude',     label:'Coude / Avant-bras',    desc:'Épicondyle médial ou latéral'},
    {key:'epaule',    label:'Épaule',               desc:'Finition du swing, rotation externe'},
    {key:'poignet',   label:'Poignets',             desc:'Impact, vibrations du club'}
  ],
  triathlon: [
    {key:'cardio',    label:'Cardiovasculaire',      desc:'Effort prolongé multi-sport'},
    {key:'epaule',    label:'Épaules',              desc:'Natation overuse, crawl répétitif'},
    {key:'genou',     label:'Genoux',               desc:'Vélo + course en enchaînement'},
    {key:'lombaire',  label:'Bas du dos',            desc:'Position vélo aéro + transition'},
    {key:'cheville',  label:'Cheville / Tendon',     desc:'Course après natation et vélo'}
  ],
  calisthenics: [
    {key:'epaule',    label:'Épaules',              desc:'Handstands, muscle-ups, front lever'},
    {key:'poignet',   label:'Poignets',             desc:'L-sit, planche, push-ups lestés'},
    {key:'coude',     label:'Coudes',               desc:'Brachialite, golfer\'s elbow'},
    {key:'genou',     label:'Genoux',               desc:'Pistol squats, sauts en réception'}
  ]
};

window.SPORT_MED_NAME = {
  running:'Running', crossfit:'Cross Training', yoga:'Yoga & Mobilité',
  cycling:'Cyclisme', hyrox:'Hyrox', padel:'Padel',
  golf:'Golf', triathlon:'Triathlon / IRONMAN', calisthenics:'Callisthénie'
};

window.NUTRITION_TO_SPORT_GOAL = { bulk: 'muscle', lean_bulk: 'muscle', maintain: 'general', cut: 'weightloss', shred: 'shred', recomposition: 'general' };

window.SPORT_TO_NUTRITION_GOAL = { muscle: 0, weightloss: 3, shred: 4, endurance: 2, flexibility: 2, general: 2 };

window.CF_DAY_TEMPLATES = {
 3: [
 {label: {fr: 'Lundi',    en: 'Monday'},    focus: 'Halt\u00E9ro A + WOD + Gym', hasHaltero: true, halteroLift: 0},
 {label: {fr: 'Mercredi', en: 'Wednesday'}, focus: 'Halt\u00E9ro B + WOD + Gym', hasHaltero: true, halteroLift: 1},
 {label: {fr: 'Vendredi', en: 'Friday'},    focus: 'WOD Comp\u00E9tition + Gym', hasHaltero: false}
 ],
 4: [
 {label: {fr: 'Lundi',  en: 'Monday'},   focus: 'Halt\u00E9ro A + WOD', hasHaltero: true, halteroLift: 0},
 {label: {fr: 'Mardi',  en: 'Tuesday'},  focus: 'Gym + WOD Sprint', hasHaltero: false},
 {label: {fr: 'Jeudi',  en: 'Thursday'}, focus: 'Halt\u00E9ro B + WOD', hasHaltero: true, halteroLift: 1},
 {label: {fr: 'Samedi', en: 'Saturday'}, focus: 'WOD Long + Gym', hasHaltero: false}
 ],
 5: [
 {label: {fr: 'Lundi',    en: 'Monday'},    focus: 'Halt\u00E9ro A + WOD', hasHaltero: true, halteroLift: 0},
 {label: {fr: 'Mardi',    en: 'Tuesday'},   focus: 'Gym + WOD Sprint', hasHaltero: false},
 {label: {fr: 'Mercredi', en: 'Wednesday'}, focus: 'Halt\u00E9ro B + WOD', hasHaltero: true, halteroLift: 1},
 {label: {fr: 'Vendredi', en: 'Friday'},    focus: 'Gym + WOD', hasHaltero: false},
 {label: {fr: 'Samedi',   en: 'Saturday'},  focus: 'WOD Comp\u00E9tition', hasHaltero: false}
 ],
 6: [
 {label: {fr: 'Lundi',    en: 'Monday'},    focus: 'Halt\u00E9ro A + WOD', hasHaltero: true, halteroLift: 0},
 {label: {fr: 'Mardi',    en: 'Tuesday'},   focus: 'Gym + Conditioning', hasHaltero: false},
 {label: {fr: 'Mercredi', en: 'Wednesday'}, focus: 'Halt\u00E9ro B + WOD', hasHaltero: true, halteroLift: 1},
 {label: {fr: 'Jeudi',    en: 'Thursday'},  focus: 'Gym + Accessoires', hasHaltero: false},
 {label: {fr: 'Vendredi', en: 'Friday'},    focus: 'Halt\u00E9ro (variation) + WOD', hasHaltero: true, halteroLift: 0},
 {label: {fr: 'Samedi',   en: 'Saturday'},  focus: 'WOD Comp\u00E9tition + Test', hasHaltero: false}
 ]
};

window.MUSCU_MIX_SESSIONS = [
 {
  name: 'Full Body A',
  focus: 'Compound — Bas du corps + Poussée + Tirage',
  exercises: [
   { name: 'Back Squat', sets: '4 × 8-10', rest: '90s', note: 'Descente 3s — profondeur complète — dos neutre' },
   { name: 'Développé couché barre', sets: '4 × 8-10', rest: '90s', note: 'Prise légèrement + large que les épaules' },
   { name: 'Tirage barre pronation', sets: '4 × 10-12', rest: '75s', note: 'Omoplate serrée — coudes vers le bas' },
   { name: 'Développé militaire haltères', sets: '3 × 10-12', rest: '60s', note: 'Core gainé — pas d\'hyperextension lombaire' },
   { name: 'Romanian Deadlift', sets: '3 × 10-12', rest: '60s', note: 'Barre proche du corps — hanches en arrière' },
   { name: 'Gainage + Crunch bicycle', sets: '3 × 45s / 20 reps', rest: '45s', note: 'Core — respiration contrôlée' }
  ]
 },
 {
  name: 'Full Body B',
  focus: 'Compound — Force + Traction + Fessiers',
  exercises: [
   { name: 'Soulevé de terre (Deadlift)', sets: '4 × 6-8', rest: '120s', note: 'Barre au-dessus mi-pied — dos neutre tout du long' },
   { name: 'Tractions / Lat Pulldown', sets: '4 × 8-10', rest: '90s', note: 'Amplitude complète — omoplates rétractées en bas' },
   { name: 'Développé incliné haltères', sets: '3 × 10-12', rest: '75s', note: 'Angle 30° — faisceaux supérieurs pectoraux' },
   { name: 'Leg Press', sets: '3 × 12-15', rest: '75s', note: 'Pieds hauts = ischio-jambiers — pieds bas = quadriceps' },
   { name: 'Hip Thrust fessiers', sets: '4 × 12-15', rest: '60s', note: 'Peak contraction 2s — fessiers sous tension maximale' },
   { name: 'Curl biceps + Extension triceps', sets: '3 × 12-15', rest: '45s', note: 'Superset — finition bras complets' }
  ]
 },
 {
  name: 'Haut du Corps',
  focus: 'Push + Pull — Pectoraux, Dorsaux, Épaules, Bras',
  exercises: [
   { name: 'Développé couché barre', sets: '4 × 6-8', rest: '90s', note: 'Charge lourde — force pectoraux' },
   { name: 'Développé incliné haltères', sets: '3 × 10-12', rest: '75s', note: 'Angle 30-45° — faisceau claviculaire' },
   { name: 'Tractions (ou Lat Pulldown)', sets: '4 × 8-10', rest: '90s', note: 'Pronation large — largeur dorsaux' },
   { name: 'Tirage horizontal rowing', sets: '3 × 10-12', rest: '60s', note: 'Coudes près du corps — milieu dorsaux' },
   { name: 'Développé militaire haltères', sets: '3 × 10-12', rest: '60s', note: 'Rotation externe — coiffe des rotateurs' },
   { name: 'Curl biceps + Extension triceps', sets: '3 × 12-15', rest: '45s', note: 'Superset — finition bras complets' }
  ]
 },
 {
  name: 'Bas du Corps',
  focus: 'Jambes + Fessiers + Core',
  exercises: [
   { name: 'Back Squat', sets: '4 × 6-8', rest: '120s', note: 'Profondeur complète — objectif force' },
   { name: 'Romanian Deadlift', sets: '4 × 8-10', rest: '90s', note: 'Étirement ischio-jambiers — contrôle excentrique' },
   { name: 'Leg Press', sets: '3 × 12-15', rest: '75s', note: 'Pieds hauts pour ischio-jambiers dominants' },
   { name: 'Hip Thrust (barre ou machine)', sets: '4 × 10-12', rest: '75s', note: 'Peak contraction 2s — activation fessiers max' },
   { name: 'Leg Curl allongé', sets: '3 × 12-15', rest: '60s', note: 'Excentrique lent — prévention tendinopathie' },
   { name: 'Mollets debout + Planche latérale', sets: '3 × 15-20 / 45s', rest: '45s', note: 'Calf raises + gainage latéral alterné' }
  ]
 }
];

window.RUNNING_MIX_SESSIONS = [
 {
  name: 'Run Easy',
  focus: 'Zone 2 — Aérobie pure, conversation possible',
  exercises: [
   { name: 'Échauffement', sets: '5 min marche + mobilité', rest: '—', note: 'Rotation chevilles/genoux/hanches — 30s chaque' },
   { name: 'Course continue Zone 2', sets: '25-35 min', rest: '—', note: 'FC 65-75% FCmax — respiration par le nez si possible' },
   { name: 'Retour au calme', sets: '5 min marche', rest: '—', note: 'Progressive decrease — ne pas s\'arrêter sec' },
   { name: 'Étirements dynamiques', sets: '5 min', rest: '—', note: 'Quadriceps, ischios, mollets, fessiers' }
  ]
 },
 {
  name: 'Fractionné 30/30',
  focus: 'Intervalles VO2max — intensité élevée',
  exercises: [
   { name: 'Échauffement progressif', sets: '10 min', rest: '—', note: 'Démarrage marche rapide → course Z1 → accélérations courtes' },
   { name: 'Séries 30s rapide / 30s récup', sets: '10-15 × 30s/30s', rest: 'actif', note: '30s à 90% FCmax / 30s marche ou jogging lent. FCmax ≈ 220 - âge.' },
   { name: 'Retour au calme', sets: '10 min Zone 1', rest: '—', note: 'Décrescendo jusqu\'à la marche' },
   { name: 'Étirements passifs', sets: '5 min', rest: '—', note: 'Maintien 20-30s par muscle' }
  ]
 },
 {
  name: 'Tempo Run',
  focus: 'Seuil lactique — Zone 3/4',
  exercises: [
   { name: 'Échauffement', sets: '10 min', rest: '—', note: 'Zone 1 + 3 accélérations progressives 60m' },
   { name: 'Tempo continu', sets: '20-30 min Zone 3', rest: '—', note: 'Allure comfortably hard — "phrases courtes" seulement' },
   { name: 'Retour au calme', sets: '10 min Zone 1', rest: '—', note: 'Récupération active' },
   { name: 'Mobilité post-run', sets: '5 min', rest: '—', note: 'Hanches + mollets — prévention blessures' }
  ]
 },
 {
  name: 'Long Run',
  focus: 'Endurance fondamentale — Zone 2 prolongée',
  exercises: [
   { name: 'Échauffement', sets: '5-10 min', rest: '—', note: 'Marche active + jogging léger' },
   { name: 'Course Zone 2 longue', sets: '45-75 min', rest: '—', note: 'Allure tenable 1h30+. Hydratation toutes 20 min.' },
   { name: 'Retour au calme', sets: '5 min marche', rest: '—', note: 'Décélération progressive' },
   { name: 'Étirements complets', sets: '10 min', rest: '—', note: 'Tous groupes — attention ischios/mollets' }
  ]
 }
];

window.YOGA_MIX_SESSIONS = [
 {
  name: 'Vinyasa Flow',
  focus: 'Enchaînement dynamique — force + souplesse',
  exercises: [
   { name: 'Centrage & respiration', sets: '3 min', rest: '—', note: 'Assise jambes croisées — 3 respirations profondes' },
   { name: 'Salutations au soleil A', sets: '5 rounds', rest: '—', note: 'Chaque posture 1 souffle — rythme fluide' },
   { name: 'Guerriers I-II-III', sets: '3 rounds chaque côté', rest: '15s', note: 'Maintien 30s — gainage actif' },
   { name: 'Chien tête en bas', sets: '5 respirations profondes', rest: '—', note: 'Talons ancrés — étirement ischios/mollets' },
   { name: 'Planche haute + basse', sets: '3 × 30s', rest: '20s', note: 'Gainage actif — sangle abdominale engagée' },
   { name: 'Cobra / Chien tête en haut', sets: '5 respirations', rest: '—', note: 'Ouverture poitrine — épaules basses' },
   { name: 'Savasana', sets: '5 min', rest: '—', note: 'Intégration — corps complètement relâché' }
  ]
 },
 {
  name: 'Yin Restauratif',
  focus: 'Récupération profonde — tissus conjonctifs',
  exercises: [
   { name: 'Enfant prolongé', sets: '3 min', rest: '—', note: 'Bras tendus devant — relâchement total des épaules' },
   { name: 'Papillon assis', sets: '3 min', rest: '—', note: 'Plantes jointes — basculer doucement vers l\'avant' },
   { name: 'Pigeon (les 2 côtés)', sets: '3 min × 2', rest: '30s', note: 'Étirement fessiers profond — respirer dans la tension' },
   { name: 'Demi-torsion allongée', sets: '2 min × 2 côtés', rest: '—', note: 'Épaules au sol — genou opposé vers le sol' },
   { name: 'Cobra passif', sets: '2 min', rest: '—', note: 'Ouvre la cage thoracique — extension dorsale douce' },
   { name: 'Savasana prolongé', sets: '10 min', rest: '—', note: 'Scan corporel — détente consciente' }
  ]
 },
 {
  name: 'Power Yoga',
  focus: 'Force + équilibre + gainage',
  exercises: [
   { name: 'Salutations dynamiques', sets: '8 rounds A + 4 rounds B', rest: '—', note: 'Rythme soutenu — activer le cœur' },
   { name: 'Séquence guerriers enchaînée', sets: '3 rounds', rest: '30s', note: 'Warrior I → II → III → Half moon — chaque posture 5 souffles' },
   { name: 'Chaturanga + Plank variations', sets: '5 × 10 chaturangas', rest: '30s', note: 'Contrôle excentrique — coudes contre les côtes' },
   { name: 'Équilibre arbre / aigle', sets: '1 min × 2 côtés', rest: '—', note: 'Focus + gainage — respiration calme' },
   { name: 'Bakasana (corbeau)', sets: '5 tentatives × 10s', rest: '30s', note: 'Progression : pointes de pieds au sol si besoin' },
   { name: 'Torsions assises', sets: '2 min × 2 côtés', rest: '—', note: 'Colonne en rotation — respiration dans l\'étirement' },
   { name: 'Savasana', sets: '5 min', rest: '—', note: 'Récupération complète' }
  ]
 },
 {
  name: 'Mobilité & Ouverture',
  focus: 'Amplitude articulaire complète',
  exercises: [
   { name: 'Chat-vache', sets: '10 cycles', rest: '—', note: 'Colonne ondulée — rythme de la respiration' },
   { name: 'Thread the needle', sets: '1 min × 2 côtés', rest: '—', note: 'Ouverture épaules + thoracique' },
   { name: 'Low lunge + twist', sets: '1 min × 2 côtés', rest: '—', note: 'Ouverture hanches + rotation' },
   { name: 'Pigeon dynamique', sets: '1 min × 2 côtés', rest: '—', note: 'Étirement fessiers profond' },
   { name: 'Happy baby', sets: '2 min', rest: '—', note: 'Hanches ouvertes — bas du dos décontracté' },
   { name: 'Savasana guidé', sets: '5 min', rest: '—', note: 'Body scan de la tête aux pieds' }
  ]
 }
];

window.CROSSFIT_MIX_SESSIONS = [
 {
  name: 'AMRAP 15',
  focus: 'Conditioning métabolique — rythme soutenu',
  exercises: [
   { name: 'Échauffement général', sets: '5 min', rest: '—', note: 'Jumping jacks, squats, push-ups — montée cardio progressive' },
   { name: 'AMRAP 15 min', sets: 'Autant de rounds que possible', rest: '—', note: '10 Burpees + 15 Air squats + 20 Mountain climbers. Repos selon besoin. Compter les rounds.' },
   { name: 'Retour au calme', sets: '5 min', rest: '—', note: 'Marche + étirements légers' }
  ]
 },
 {
  name: 'EMOM 20 Force',
  focus: 'Every Minute on the Minute — force + cardio',
  exercises: [
   { name: 'Échauffement spécifique', sets: '8 min', rest: '—', note: 'Mobilité épaules/hanches + activation squat' },
   { name: 'EMOM 20 (4 rounds)', sets: '20 min', rest: '—', note: 'Min 1 : 8 Goblet squats | Min 2 : 10 KB swings | Min 3 : 8 Push-ups | Min 4 : 10 Sit-ups | Min 5 : Repos' },
   { name: 'Étirements', sets: '5 min', rest: '—', note: 'Quadriceps, ischios, épaules' }
  ]
 },
 {
  name: 'For Time - Chipper',
  focus: 'Volume + mental — enchaîner sans s\'arrêter',
  exercises: [
   { name: 'Échauffement complet', sets: '10 min', rest: '—', note: 'Mobilité + cardio léger + activation' },
   { name: 'For Time', sets: '15-25 min', rest: '—', note: '50 Air squats → 40 Walking lunges → 30 Push-ups → 20 Burpees → 10 Pull-ups/Ring rows. Chrono jusqu\'au dernier rep.' },
   { name: 'Cooldown', sets: '5 min', rest: '—', note: 'Marche + étirements — hydratation' }
  ]
 },
 {
  name: 'Hero WOD Light',
  focus: 'Conditioning long — endurance musculaire',
  exercises: [
   { name: 'Échauffement dynamique', sets: '10 min', rest: '—', note: 'Rameur 5 min + mobilité articulaire' },
   { name: 'WOD "Angie" light', sets: 'For Time', rest: '—', note: '50 Pull-ups (ou rows) → 75 Push-ups → 100 Sit-ups → 150 Air squats. Chrono final.' },
   { name: 'Étirements prolongés', sets: '10 min', rest: '—', note: 'Focus bas du dos + épaules (sollicités +++)' }
  ]
 }
];

window.CALISTHENICS_MIX_SESSIONS = [
 {
  name: 'Push Bodyweight',
  focus: 'Pectoraux + Triceps + Épaules — poids du corps',
  exercises: [
   { name: 'Échauffement épaules', sets: '3 min', rest: '—', note: 'Rotations + élévations actives' },
   { name: 'Pompes classiques', sets: '4 × AMRAP', rest: '90s', note: 'Technique stricte — corps gainé' },
   { name: 'Dips bancs', sets: '3 × 10-15', rest: '60s', note: 'Coudes près du corps — descente contrôlée' },
   { name: 'Pike push-ups', sets: '3 × 8-12', rest: '60s', note: 'Progression vers handstand push-up' },
   { name: 'Planche haute + latérale', sets: '3 × 45s chaque', rest: '30s', note: 'Gainage isométrique' }
  ]
 },
 {
  name: 'Pull Bodyweight',
  focus: 'Dos + Biceps — traction',
  exercises: [
   { name: 'Échauffement grip', sets: '3 min', rest: '—', note: 'Dead hang + band pull-aparts' },
   { name: 'Tractions / Ring rows', sets: '4 × AMRAP (ou 6-10 tractions)', rest: '120s', note: 'Amplitude complète — omoplates rétractées' },
   { name: 'Rowing horizontal bar', sets: '3 × 10-15', rest: '75s', note: 'Prise neutre ou pronation — coudes vers le sol' },
   { name: 'Chin-ups prise serrée', sets: '3 × 6-10', rest: '90s', note: 'Biceps + dos — supination' },
   { name: 'Hollow body hold', sets: '3 × 30-45s', rest: '45s', note: 'Gainage antérieur — colonne neutre' }
  ]
 },
 {
  name: 'Legs & Core Bodyweight',
  focus: 'Quadriceps + Fessiers + Core',
  exercises: [
   { name: 'Échauffement hanches', sets: '5 min', rest: '—', note: 'Leg swings + squats profonds lents' },
   { name: 'Squats poids du corps', sets: '4 × 20-30', rest: '60s', note: 'Amplitude profonde — cuisses sous parallèle' },
   { name: 'Fentes alternées', sets: '3 × 12 chaque jambe', rest: '60s', note: 'Genou arrière proche sol' },
   { name: 'Bulgarian split squat', sets: '3 × 10 chaque jambe', rest: '75s', note: 'Pied arrière surélevé — contrôle excentrique' },
   { name: 'Hollow + Superman', sets: '3 × 30s chaque', rest: '30s', note: 'Gainage antérieur + postérieur alternés' },
   { name: 'Mollets debout', sets: '3 × 20', rest: '30s', note: 'Amplitude complète — pointe de pieds' }
  ]
 }
];

window.MACRO_PHASES = [
 {id: 'hypertrophie', label: 'Hypertrophie', shortLabel: 'HYPERTROPHIE', color: '#3E5C3A',
  mesosInPhase: 1, // tous les mésocycles i%3===1 (cycle 1,4,7...)
  desc: 'Volume maximal — 8-12 reps, 65-75% 1RM. Priorité à l\'accumulation de masse musculaire.',
  repsRange: '8-12', pct1rmBonus: 0, setsBonus: +1,
  tip: 'Phase d\'accumulation : augmente le volume total (séries × reps). Charge modérée, récupération 60-90s.'},
 {id: 'force', label: 'Force', shortLabel: 'FORCE', color: '#7A3B0E',
  mesosInPhase: 2,
  desc: 'Intensité maximale — 3-6 reps, 82-90% 1RM. Priorité à la densité neuromusculaire.',
  repsRange: '3-6', pct1rmBonus: +0.12, setsBonus: 0,
  tip: 'Phase d\'intensification : monte les charges, baisse les reps. Repos 3-5 min entre séries.'},
 {id: 'transition', label: 'Transition', shortLabel: 'TRANSITION', color: '#7A1F1F',
  mesosInPhase: 0,
  desc: 'Consolidation & récupération — charges variées, 50-70% 1RM. Supercompensation.',
  repsRange: 'variable', pct1rmBonus: -0.10, setsBonus: -1,
  tip: 'Phase de transition : volume et intensité réduits pour permettre la supercompensation.'}
];

window.MUSCU_PHASES = [
 {weeks:[1,2], id:'adaptation', label:'Adaptation', color:'#2980B9',
 rpe:6, rpeNote:'RPE 6 — tu pourrais faire 4 reps de plus. Priorité à la technique.',
 pct1rm:0.60, advice:'Maîtrise la technique avant d\'augmenter les charges. Si tu réussis toutes les reps → +2.5 kg la semaine prochaine.',
 setsOffset:-1, repsOffset:+2, restNote:'Repos libres — récupération complète entre chaque série.'},
 {weeks:[3,4], id:'progression', label:'Progression', color:'#3E5C3A',
 rpe:8, rpeNote:'RPE 8 — tu pourrais faire 2 reps de plus. Zone optimale hypertrophie.',
 pct1rm:0.72, advice:'Progression double : augmente d\'abord les reps (ex. 8→10→12), puis monte la charge de 2.5 kg et retombe à 8 reps.',
 setsOffset:0, repsOffset:0, restNote:'Respecte les temps de repos indiqués.'},
 {weeks:[5,6], id:'intensification',label:'Intensification',color:'#7A3B0E',
 rpe:9, rpeNote:'RPE 9 — 1 rep en réserve. Dernier set seulement jusqu\'à l\'échec technique (jamais sur squat/soulevé).',
 pct1rm:0.82, advice:'Charges maximales. +1 série par exercice composé. Dernier set à l\'échec sur les isolations uniquement.',
 setsOffset:+1, repsOffset:-2, restNote:'+30s de repos vs semaines précédentes. CNS sous pression maximale.'},
 {weeks:[7], id:'decharge', label:'Décharge', color:'#0A0A09',
 rpe:5, rpeNote:'RPE 5 — très facile, 5+ reps en réserve. Récupération musculaire et articulaire.',
 pct1rm:0.50, advice:'Réduis le volume de 50% (2 séries au lieu de 4) et les charges de 40-50%. Garde les mêmes exercices. Indispensable pour la progression long terme.',
 setsOffset:-2, repsOffset:0, restNote:'Repos complets. Ton prochain cycle sera plus fort grâce à cette semaine.'}
];

window.YOGA_SESSIONS = {
 debutant: [
 { name: 'Salutation au soleil A', duration: '5 min', desc: '5 rounds, alignement fondamental', focus: '\u00c9chauffement global' },
 { name: 'Guerrier I & II', duration: '4 min', desc: '3 cycles chaque c\u00f4t\u00e9, respiration Ujjayi', focus: 'Jambes / Hanches' },
 { name: 'Chien t\u00eate en bas', duration: '3 min', desc: 'Tenir 5 respirations, pousser talons vers sol', focus: 'Ischio-jambiers / \u00c9paules' },
 { name: 'Posture de l\u2019enfant (Balasana)', duration: '2 min', desc: 'Rel\u00e2chement complet, respiration abdominale', focus: 'R\u00e9cup\u00e9ration' },
 { name: 'Torsion couch\u00e9e (Supta Matsyendrasana)', duration: '4 min', desc: '2 min par c\u00f4t\u00e9, genoux au sol', focus: 'Colonne vert\u00e9brale' },
 { name: 'Savasana', duration: '5 min', desc: 'Relaxation compl\u00e8te, scan corporel', focus: 'Int\u00e9gration' }
 ],
 intermediaire: [
 { name: 'Salutation au soleil A+B', duration: '8 min', desc: '3 rounds A + 3 rounds B en vinyasa', focus: '\u00c9chauffement vinyasa' },
 { name: 'Triangle & Demi-lune', duration: '6 min', desc: '\u00c9quilibre dynamique, gainage lat\u00e9ral', focus: '\u00c9quilibre / Obliques' },
 { name: 'Crow pose (Bakasana)', duration: '5 min', desc: '3 tentatives, 15 sec hold objectif', focus: 'Force bras / Concentration' },
 { name: 'Pigeon (Eka Pada Rajakapotasana)', duration: '6 min', desc: '3 min chaque c\u00f4t\u00e9, rel\u00e2chement fl\u00e9chisseurs', focus: 'Hanches' },
 { name: 'Roue (Urdhva Dhanurasana)', duration: '4 min', desc: '3 tentatives, option demi-pont', focus: 'Extension colonne' },
 { name: 'Savasana guid\u00e9', duration: '5 min', desc: 'Visualisation positive, coh\u00e9rence cardiaque', focus: 'R\u00e9cup\u00e9ration' }
 ],
 avance: [
 { name: 'Pranayama Nadi Shodhana', duration: '5 min', desc: 'Respiration alternante, 5 cycles, pr\u00e9paration mentale', focus: 'Centering / Syst\u00e8me nerveux' },
 { name: 'Salutation au soleil A+B en cha\u00eene', duration: '10 min', desc: '5 rounds complets, transition fluide Chaturanga', focus: '\u00c9chauffement complet' },
 { name: 'Guerrier III & Demi-lune \u00e9tendu', duration: '8 min', desc: '\u00c9quilibre avanc\u00e9, gaze fixe (Drishti)', focus: '\u00c9quilibre / Gainage' },
 { name: 'Handstand (Adho Mukha Vrksasana)', duration: '8 min', desc: 'Contre-mur ou libre, alignement poignets-\u00e9paules-hanches', focus: 'Inversion / Force' },
 { name: 'Kapotasana (pigeon roi)', duration: '8 min', desc: '4 min par c\u00f4t\u00e9, ouverture profonde psoas', focus: 'Flexibilit\u00e9 avanc\u00e9e' },
 { name: 'Paschimottanasana tenu', duration: '5 min', desc: 'Flexion avant longue, genoux l\u00e9g\u00e8rement fl\u00e9chis si hernie', focus: 'Cha\u00eene post\u00e9rieure' },
 { name: 'Savasana + Yoga Nidra', duration: '10 min', desc: 'Rotation de conscience, r\u00e9cup\u00e9ration parasympathique', focus: 'Int\u00e9gration profonde' }
 ]
};

window.YOGA_WEEKS = [
 {
 phase: 'Fondations',
 theme: 'Postures debout, alignement, respiration',
 focus: 'Ancrage \u00b7 Conscience corporelle \u00b7 Respiration Ujjayi',
 notes: 'Semaine 1 \u2014 Construisez des bases solides. Priorit\u00e9 \u00e0 l\u2019alignement plut\u00f4t qu\u2019\u00e0 la profondeur des postures.'
 },
 {
 phase: '\u00c9quilibre et Force',
 theme: 'Postures sur un pied, demi-lune, guerrier III',
 focus: '\u00c9quilibre dynamique \u00b7 Gainage \u00b7 Concentration',
 notes: 'Semaine 2 \u2014 Travail de l\u2019\u00e9quilibre et de la force fonctionnelle. Utilisez un mur si besoin pour les inversions.'
 },
 {
 phase: 'Ouverture des Hanches & Torsions',
 theme: 'Pigeon, torsions assises, yin profond',
 focus: 'Mobilit\u00e9 hanches \u00b7 Lib\u00e9ration fascias \u00b7 Torsions d\u00e9toxifiantes',
 notes: 'Semaine 3 \u2014 Postures tenues longtemps (Yin). Respirez dans la r\u00e9sistance, ne forcez pas.'
 },
 {
 phase: 'Backbends & Inversions',
 theme: 'Roue, poirier, \u00e9tirements profonds',
 focus: 'Extension colonne \u00b7 \u00c9nergie montante \u00b7 Int\u00e9gration',
 notes: 'Semaine 4 \u2014 Postures avanc\u00e9es avec variantes adapt\u00e9es. D\u00e9butants : demi-pont \u00e0 la place de la roue.'
 }
];

window.YOGA_BENEFITS = {
 flexibilite: 'Augmentation de la souplesse musculaire de 35% en 8 semaines (Grabara & Szopa 2015)',
 stress: 'R\u00e9duction cortisol de 30% apr\u00e8s 12 semaines (UCLA 2018)',
 force: 'Am\u00e9lioration gainage core +22% (Crow, Plank, Side Plank \u2014 Ni et al. 2014)',
 sommeil: 'Am\u00e9lioration qualit\u00e9 sommeil (PSQI) chez 55% des pratiquants (Hariprasad et al. 2013)'
};

window.CYCLING_ZONES = [
 { zone: 1, name: 'Récupération active', pct: '< 55% FTP', rpe: '1-2/10', color: '#3E5C3A', desc: 'Pédalage très facile, conversation aisée' },
 { zone: 2, name: 'Endurance de base', pct: '56-75% FTP', rpe: '3-4/10', color: '#3E5C3A', desc: 'Rythme confortable, sortie longue' },
 { zone: 3, name: 'Tempo', pct: '76-90% FTP', rpe: '5-6/10', color: '#7A3B0E', desc: 'Effort soutenu, légèrement inconfortable' },
 { zone: 4, name: 'Seuil (FTP)', pct: '91-105% FTP', rpe: '7-8/10', color: '#7A3B0E', desc: 'À la limite — effort maximal maintenable' },
 { zone: 5, name: 'VO2max', pct: '106-120% FTP', rpe: '8-9/10', color: '#7A1F1F', desc: 'Intervalles courts, très intense' }
];

window.CYCLING_MET = [5, 7, 9, 11, 13];

window.CYCLING_WORKOUTS = {
 debutant: [
 { day: 'Mardi', type: 'Endurance', duration: 45, zone: 2, desc: 'Sortie plate Z2, cadence 80-90 RPM' },
 { day: 'Jeudi', type: 'Intervalles courts', duration: 40, zone: 4, desc: '5 min Z2 + 4×3min Z4 + 3min récup + 5min Z2' },
 { day: 'Samedi', type: 'Sortie longue', duration: 90, zone: 2, desc: 'Z2 constant, hydratation 500ml/h, alimentation 40-60g glucides/h si >1h' }
 ],
 intermediaire: [
 { day: 'Lundi', type: 'Récupération active', duration: 30, zone: 1, desc: 'Easy spin, rotation hanches, jambes légères' },
 { day: 'Mardi', type: 'Tempo', duration: 60, zone: 3, desc: '2×15min Z3 + 5min récup entre les blocs' },
 { day: 'Jeudi', type: 'Sweet Spot', duration: 75, zone: 4, desc: '3×10min à 88-93% FTP — zone la plus efficace ROI effort' },
 { day: 'Samedi', type: 'Sortie longue qualité', duration: 150, zone: 2, desc: 'Sortie ondulée, 80% Z2 + 20% Z3 sur les côtes' },
 { day: 'Dimanche', type: 'Sortie récup', duration: 60, zone: 1, desc: 'Easy, plat, cadence libre' }
 ]
};
