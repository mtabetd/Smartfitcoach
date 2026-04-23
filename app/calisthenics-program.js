/**
 * SmartFitCoach — Proprietary Software
 * Copyright (c) 2024-2026 SmartFitCoach. All rights reserved.
 * Unauthorized copying, modification, distribution, or use of this software
 * is strictly prohibited without explicit written permission.
 * Contact: contact@smartfitcoach.com
 */
// ── SKILL DEFINITIONS ──────────────────────────────────────────────────────
var CALISTHENICS_SKILLS = {
  muscle_up: {
    name: 'Muscle-up barre', icon: '',
    description: 'Passage traction vers poussee - force explosive et transition',
    equipment: ['bar'],
    prereqs: '8+ pull-ups stricts explosifs, dip complet, fausse prise maitrisee',
    prereqPullups: 8,
    prereqPushups: 10,
    injuryAlert: 'Douleur epaule ou poignet = stop. Ne jamais kiper en fatigue.',
    antagonist: ['Face pull 3x15', 'Band pull-apart 3x20', 'External rotation 3x15'],
    time: {debutant:'8-14 mois', intermediaire:'4-7 mois', avance:'2-4 mois', elite:'2-6 semaines'},
    progressions: [
      {step:1, name:'Dead hang + scapulaire', duration:'3x20s + 3x10', weeks:'1-2',
       sets:3, reps:'10 scap / 20s hang', rest:'60s',
       coaching:'Omoplate vers le bas et vers linterieur. Base absolue.',
       prep:['Dead hang 3x30s', 'Shoulder shrug inverted 3x10']},
      {step:2, name:'Pull-up strict 3x5', duration:'3x5', weeks:'2-5',
       sets:3, reps:'5', rest:'90s',
       coaching:'Coudes vers les hanches, pas vers larriere. Corps droit.',
       prep:['Negative pull-up 3x5 3s', 'Ring row 3x10']},
      {step:3, name:'Fausse prise 3x5', duration:'3x5', weeks:'4-7',
       sets:3, reps:'5', rest:'90s',
       coaching:'Poignet passe par-dessus la barre. Cle de la transition.',
       prep:['Wrist mobility 3min', 'False grip hang 3x15s']},
      {step:4, name:'Pull-up explosif toucher poitrine', duration:'4x3', weeks:'6-10',
       sets:4, reps:'3', rest:'2-3min',
       coaching:'Tirer avec force maximale - poitrine touche la barre. Repos complet.',
       prep:['Banded explosive pull-up 3x5', 'Bar dip 3x10']},
      {step:5, name:'Muscle-up negatif (descendu lent 5s)', duration:'4x3', weeks:'8-13',
       sets:4, reps:'3', rest:'3min',
       coaching:'Partir en appui, descendre lentement 5 secondes. Controle absolu.',
       prep:['Ring support hold 3x15s', 'Dip 3x10']},
      {step:6, name:'Kipping muscle-up (outil apprentissage)', duration:'3x3', weeks:'10-15',
       sets:3, reps:'3', rest:'3min',
       coaching:'Le kip sert a apprendre la transition. Viser le strict apres.',
       prep:['Kip swing maitrise', 'Pull-up explosif 3x5']},
      {step:7, name:'Strict muscle-up barre 1-3 reps', duration:'3x1-3', weeks:'13-20+',
       sets:3, reps:'1-3', rest:'4-5min',
       coaching:'Force pure. Bras passent en ligne droite. Aucun kip. Qualite avant quantite.',
       prep:['Weighted pull-up +5kg 3x5', 'Weighted dip +5kg 3x8']}
    ]
  },

  muscle_up_rings: {
    name: 'Muscle-up anneaux', icon: '',
    description: 'Version anneaux - plus difficile, plus epaules',
    equipment: ['rings'],
    prereqs: '5+ strict muscle-up barre, ring support hold 30s, ring dip 10 reps',
    prereqPullups: 12,
    prereqPushups: 15,
    injuryAlert: 'Douleur biceps ou coude = stop. Rotation anneaux vers lexterieur en appui.',
    antagonist: ['Face pull 3x15', 'Band pull-apart 3x20', 'Ring face pull 3x12'],
    time: {debutant:'2-3 ans', intermediaire:'12-18 mois', avance:'6-10 mois', elite:'3-5 mois'},
    progressions: [
      {step:1, name:'Ring support hold', duration:'4x15s', weeks:'1-4',
       sets:4, reps:'15s', rest:'90s',
       coaching:'Anneaux tournes vers lexterieur a 45deg. Corps gaigne, bras tendus.',
       prep:['Ring dip negatif 3x5', 'Parallel bar support 3x20s']},
      {step:2, name:'Ring row explosif', duration:'4x5', weeks:'3-6',
       sets:4, reps:'5', rest:'2min',
       coaching:'Tirer fort et haut, anneaux contre la poitrine.',
       prep:['Ring row 3x10', 'Pull-up fausse prise 3x5']},
      {step:3, name:'Ring muscle-up negatif', duration:'4x3', weeks:'6-10',
       sets:4, reps:'3', rest:'3min',
       coaching:'Partir en appui sur anneaux, descendre en retournant les anneaux. 5 secondes.',
       prep:['Ring dip 3x10', 'False grip ring pull-up 3x5']},
      {step:4, name:'Ring muscle-up kipping', duration:'3x3', weeks:'9-14',
       sets:3, reps:'3', rest:'3-4min',
       coaching:'Transition rapide - tourner les anneaux immediatement a la transition.',
       prep:['Ring muscle-up negatif 3x3', 'Ring dip 3x12']},
      {step:5, name:'Ring muscle-up strict', duration:'3x1-3', weeks:'13-24+',
       sets:3, reps:'1-3', rest:'5min',
       coaching:'Strictement sans elan. Le plus difficile des muscle-ups.',
       prep:['Weighted pull-up +7.5kg 3x5', 'Ring dip +5kg 3x8']}
    ]
  },

  handstand: {
    name: 'Handstand mur (ATR)', icon: '',
    description: 'Equilibre inverse - proprioception et force epaules',
    equipment: ['floor_only', 'bar', 'parallettes', 'rings'],
    prereqs: 'Push-ups corrects 10 reps, poignets sans douleur, core solide',
    prereqPullups: 0,
    prereqPushups: 10,
    injuryAlert: 'STOP si douleur poignets - renforcer 4-6 semaines avant. Apprendre a rouler avant.',
    antagonist: ['Wrist circles 2x2min', 'Wrist flexor stretch 2x30s', 'Dead hang 2x20s'],
    time: {debutant:'6-12 mois', intermediaire:'3-5 mois', avance:'1-3 mois', elite:'2-4 semaines'},
    progressions: [
      {step:1, name:'Wrist conditioning quotidien', duration:'5min/jour', weeks:'1-4',
       sets:3, reps:'30s chaque', rest:'30s',
       coaching:'OBLIGATOIRE avant toute session. Cercles, extensions, flexions.',
       prep:['Wrist circles 2x30s', 'Wrist push-up 2x10', 'Planche sur poings 2x20s']},
      {step:2, name:'Pike hold + shoulder shrug', duration:'4x20s', weeks:'1-3',
       sets:4, reps:'20s', rest:'60s',
       coaching:'Hanches hautes, pousser le sol. Sentir lactivation des epaules.',
       prep:['Pike hold 3x20s', 'Shoulder shrug 3x15']},
      {step:3, name:'Wall handstand face au mur', duration:'4x20-30s', weeks:'2-6',
       sets:4, reps:'20-30s', rest:'90s',
       coaching:'Ventre au mur, corps en gainage. Pousser le sol, dos plat.',
       prep:['Wall handstand hold 3x20s', 'Kick-up practice 5x']},
      {step:4, name:'Kick-up + bail securise', duration:'5x kick-ups', weeks:'4-8',
       sets:5, reps:'5 essais', rest:'60s',
       coaching:'Apprendre a rouler proprement AVANT de chercher lequilibre. Securite dabord.',
       prep:['Forward roll 5x', 'Pirouette 5x', 'Kick-up mur 3x5']},
      {step:5, name:'Chest-to-wall + decollage progressif', duration:'4x20s', weeks:'7-12',
       sets:4, reps:'20s', rest:'90s',
       coaching:'Dos au mur, decamper les pieds progressivement. Micro-balance doigts.',
       prep:['Back-to-wall handstand 3x20s', 'Handstand touch 3x10']},
      {step:6, name:'Freestanding handstand 5-15s', duration:'10x essais', weeks:'10-20',
       sets:10, reps:'essais', rest:'30s entre essais',
       coaching:'10 minutes quotidiennes. Regarder les mains. Micro-corrections des doigts.',
       prep:['Handstand pirouette 3x5', 'One-arm supported 3x10s']}
    ]
  },

  handstand_free: {
    name: 'Handstand libre 30s+', icon: '',
    description: 'Equilibre libre perfectionne - acrobatique',
    equipment: ['floor_only', 'parallettes'],
    prereqs: 'Handstand mur 30s solide, pirouette maitrisee, gainage parfait',
    prereqPullups: 0,
    prereqPushups: 15,
    injuryAlert: 'Maintien poignets: renforcer quotidiennement. Pas de session si douleur.',
    antagonist: ['Wrist circles 3x2min', 'Dead hang 3x30s', 'Shoulder circles 2x20'],
    time: {debutant:'18-30 mois', intermediaire:'10-18 mois', avance:'5-10 mois', elite:'2-5 mois'},
    progressions: [
      {step:1, name:'Freestanding hold 5-10s regulier', duration:'10min pratique', weeks:'1-4',
       sets:0, reps:'10min de pratique quotidienne', rest:'libre',
       coaching:'Volume de pratique > intensite. 10min/jour minimum. Patience.',
       prep:['Handstand freestanding 10x essais', 'Pirouette 5x']},
      {step:2, name:'Handstand 15-30s consistency', duration:'10min', weeks:'4-12',
       sets:0, reps:'objectif: 30s en 8 semaines', rest:'libre',
       coaching:'Chercher lalignement parfait: poignets-epaules-hanches-chevilles.',
       prep:['Balance drills 5x', 'Press handstand negatif 3x3']},
      {step:3, name:'HSPU (Handstand Push-up) negatif', duration:'4x5', weeks:'8-14',
       sets:4, reps:'5 negatifs 3s', rest:'2min',
       coaching:'Tete entre les mains, coudes a 45deg. PAS en V (danger epaules).',
       prep:['Pike push-up 3x10', 'Wall HSPU negatif 3x5']},
      {step:4, name:'Strict HSPU complet', duration:'4x3-5', weeks:'12-20',
       sets:4, reps:'3-5', rest:'3min',
       coaching:'Amplitude complete: tete au sol. Corps parfaitement vertical.',
       prep:['Pike HSPU 3x10', 'HSPU avec elastique 3x8']}
    ]
  },
  front_lever: {
    name: 'Front lever', icon: '',
    description: 'Force de traction horizontale - grand dorsal + core',
    equipment: ['bar', 'rings'],
    prereqs: '15+ pull-ups stricts, hollow body 30s, dead hang 1min',
    prereqPullups: 15,
    prereqPushups: 0,
    injuryAlert: 'Douleur coude = tendinite biceps possible. Reduire volume, consulter.',
    antagonist: ['Pike push-up 3x10', 'Dip 3x10', 'Chest stretch 2x30s'],
    time: {debutant:'18-24 mois', intermediaire:'10-15 mois', avance:'5-8 mois', elite:'2-4 mois'},
    progressions: [
      {step:1, name:'Dead hang + scapulaire pull-up', duration:'4x30s + 4x10', weeks:'1-4',
       sets:4, reps:'30s hang + 10 scap', rest:'90s',
       coaching:'Deprimer les scapulas - tirer les epaules vers le bas. Base du FL.',
       prep:['Dead hang 3x30s', 'Scapular pull-up 3x10', 'Hollow body 3x20s']},
      {step:2, name:'Tuck front lever 4x10s', duration:'4x10s', weeks:'2-5',
       sets:4, reps:'10s', rest:'2min',
       coaching:'Genoux groupes contre poitrine. Hanches a hauteur epaules. Corps en boule.',
       prep:['Australian pull-up 3x10', 'Dead hang 3x30s', 'Hollow hold 3x20s']},
      {step:3, name:'Advanced tuck (dos plat, hanche 90deg)', duration:'4x8s', weeks:'5-10',
       sets:4, reps:'8s', rest:'2-3min',
       coaching:'Hanche ouverte a 90deg. Cuisse horizontale. DOS PLAT - cle de la progression.',
       prep:['Tuck FL pull-up 3x3', 'Band-assisted FL 3x15s', 'Slow pull-up eccentric 3x5']},
      {step:4, name:'One leg front lever', duration:'4x6s', weeks:'9-14',
       sets:4, reps:'6s chaque jambe', rest:'2min',
       coaching:'Une jambe tendue, une flechie. Alterner. Chercher lhorizontalite.',
       prep:['Advanced tuck FL 4x8s', 'FL pull-up tuck 3x3', 'Windshield wiper 3x5']},
      {step:5, name:'Straddle front lever 4x5s', duration:'4x5s', weeks:'12-20',
       sets:4, reps:'5s', rest:'3min',
       coaching:'Jambes ecartees a 90deg+. Reduire lecartement semaine par semaine.',
       prep:['Straddle FL pull-up 3x3', 'L-sit pull-up 3x5', 'Hanging leg raise 3x8']},
      {step:6, name:'Full front lever 3x3-5s', duration:'3x3-5s', weeks:'18-36+',
       sets:3, reps:'3-5s', rest:'4-5min',
       coaching:'Corps parfaitement horizontal. Bras tendus. Scapulas depressee. Qualite absolue.',
       prep:['Straddle FL 4x6s', 'FL pull-up straddle 3x3', 'Weighted pull-up +10kg 3x5']}
    ]
  },

  back_lever: {
    name: 'Back lever', icon: '',
    description: 'Levier posterieur - epaules en extension, biceps charge',
    equipment: ['bar', 'rings'],
    prereqs: 'Skin the cat maitrise, pull-ups 10 reps, epaules mobiles',
    prereqPullups: 10,
    prereqPushups: 0,
    injuryAlert: 'DANGER epaules. Ne jamais forcer. Progresser tres lentement. Stop si douleur.',
    antagonist: ['Face pull 3x15', 'External rotation 3x15', 'Chest stretch 2x30s'],
    time: {debutant:'8-14 mois', intermediaire:'4-7 mois', avance:'2-4 mois', elite:'4-8 semaines'},
    progressions: [
      {step:1, name:'Skin the cat negatif', duration:'4x3', weeks:'1-4',
       sets:4, reps:'3 lents', rest:'2min',
       coaching:'Passer les pieds derriere lentement. Sentir lepaule. JAMAIS en force.',
       prep:['Dead hang 3x30s', 'Shoulder mobility 5min', 'Band dislocate 3x10']},
      {step:2, name:'Skin the cat complet + retour', duration:'4x3', weeks:'3-6',
       sets:4, reps:'3 A/R', rest:'2-3min',
       coaching:'Aller et revenir. Controle total. Renforcement articulaire progressif.',
       prep:['Skin the cat 3x3', 'German hang 3x10s', 'Band pull-apart 3x20']},
      {step:3, name:'German hang 4x15s', duration:'4x15s', weeks:'5-10',
       sets:4, reps:'15s', rest:'2min',
       coaching:'Position de depart back lever. Epaules etirement progressif.',
       prep:['Skin the cat 3x5', 'Shoulder circles 3x20', 'German hang 3x10s']},
      {step:4, name:'Tuck back lever 4x8s', duration:'4x8s', weeks:'8-14',
       sets:4, reps:'8s', rest:'3min',
       coaching:'Genoux groupes, corps incline vers le bas. Controle exige.',
       prep:['German hang 4x15s', 'Tuck back lever 3x5s', 'Inverted pull-up 3x5']},
      {step:5, name:'Straddle back lever 3x5s', duration:'3x5s', weeks:'12-18',
       sets:3, reps:'5s', rest:'3-4min',
       coaching:'Jambes ecartees, corps horizontal. Pas de compensation lombaire.',
       prep:['Tuck back lever 4x10s', 'Back lever negatif 3x3']},
      {step:6, name:'Full back lever 3x3-5s', duration:'3x3-5s', weeks:'16-28+',
       sets:3, reps:'3-5s', rest:'4-5min',
       coaching:'Corps horizontal jambes jointes. Lepaule mobile doit etre conditionne depuis des mois.',
       prep:['Straddle back lever 4x6s', 'Weighted skin the cat 3x5', 'OA back lever hold 3x5s']}
    ]
  },

  planche: {
    name: 'Planche', icon: '',
    description: 'Appui horizontal bras tendus - force poussee extreme',
    equipment: ['floor_only', 'parallettes', 'bar'],
    prereqs: 'Planche lean 45deg solide, core extreme, poignets aciers',
    prereqPullups: 0,
    prereqPushups: 30,
    injuryAlert: 'Tendinite poignet tres courante. Renforcement 3 mois avant. Stop si douleur.',
    antagonist: ['Dead hang 3x30s', 'Wrist flexion 3x15', 'Pull-up 3x8', 'Face pull 3x15'],
    time: {debutant:'3-5 ans', intermediaire:'2-3 ans', avance:'1-2 ans', elite:'6-12 mois'},
    progressions: [
      {step:1, name:'Wrist conditioning + pseudo planche lean', duration:'5min + 4x15s', weeks:'1-8',
       sets:4, reps:'15s lean', rest:'2min',
       coaching:'Doigts vers larriere. Pencher le corps vers lavant progressivement. LENTEMENT.',
       prep:['Wrist circles 3x2min', 'Pseudo planche push-up 3x8', 'Hollow body 3x20s']},
      {step:2, name:'Frog stand / Crow pose 4x15s', duration:'4x15s', weeks:'4-10',
       sets:4, reps:'15s', rest:'90s',
       coaching:'Genoux sur les triceps. Equilibre du frog stand = premier vrai appui.',
       prep:['Frog stand 3x10s', 'Wrist push-up 3x10', 'Pike push-up 3x10']},
      {step:3, name:'Tuck planche 4x5-10s', duration:'4x5-10s', weeks:'8-16',
       sets:4, reps:'5-10s', rest:'3min',
       coaching:'Genoux serres contre poitrine. Corps horizontal. Pousser fort dans le sol.',
       prep:['Tuck planche 3x5s', 'Pseudo planche push-up 3x6', 'Bulgarian shoulder 3x10']},
      {step:4, name:'Advanced tuck planche 4x5-8s', duration:'4x5-8s', weeks:'16-28',
       sets:4, reps:'5-8s', rest:'3-4min',
       coaching:'Hanche ouverte progressivement. Dos arrondi reste. Contracter tous les muscles.',
       prep:['Adv tuck push-up 3x4', 'Planche lean max 30s', 'Bulgarian shoulder bag 3x12']},
      {step:5, name:'Straddle planche 3x3-5s', duration:'3x3-5s', weeks:'28-48',
       sets:3, reps:'3-5s', rest:'4-5min',
       coaching:'Jambes ecartees a 90deg+. Angle optimal pour reduire le bras de levier.',
       prep:['Straddle push-up 3x3', 'Planche lean maximal 30s', 'Maltese lean 15s']},
      {step:6, name:'Full planche 3-5s', duration:'3x3-5s', weeks:'48-100+',
       sets:3, reps:'3-5s', rest:'5min',
       coaching:'Jambes jointes horizontales. Annees de travail. Celebrez chaque seconde.',
       prep:['Straddle planche push-up 3x3', 'Planche lean max 30s', 'Ring planche 3x5s']}
    ]
  },

  planche_lean: {
    name: 'Planche lean / Maltese lean', icon: '',
    description: 'Travail de gainage planche - accessible niveau intermediaire',
    equipment: ['floor_only', 'parallettes', 'bar'],
    prereqs: 'Push-ups 20 reps, hollow body maitrise, poignets sans douleur',
    prereqPullups: 0,
    prereqPushups: 20,
    injuryAlert: 'Douleur poignet = stop et renforcer. Ne pas progresser si inconfort.',
    antagonist: ['Dead hang 3x20s', 'Pull-up 3x5', 'Wrist stretch 3x30s'],
    time: {debutant:'3-6 mois', intermediaire:'1-3 mois', avance:'4-8 semaines', elite:'2-4 semaines'},
    progressions: [
      {step:1, name:'Pseudo planche hold 4x15s', duration:'4x15s', weeks:'1-4',
       sets:4, reps:'15s', rest:'90s',
       coaching:'Mains orientees vers larriere, bras tends, corps gaigne.',
       prep:['Hollow body 3x20s', 'Arch hold 3x20s', 'Pike hold 3x20s']},
      {step:2, name:'Planche lean 15deg 4x20s', duration:'4x20s', weeks:'3-6',
       sets:4, reps:'20s', rest:'90s',
       coaching:'Incliner les epaules 15deg devant les poignets. Augmenter progressivement.',
       prep:['Pseudo planche 3x20s', 'Planche push-up negatif 3x5']},
      {step:3, name:'Planche lean 30-45deg 4x15s', duration:'4x15s', weeks:'5-10',
       sets:4, reps:'15s', rest:'2min',
       coaching:'45 deg = niveau du tuck planche. Force requise considerable.',
       prep:['Planche lean 30deg 3x20s', 'Tuck planche essais 3x3s']},
      {step:4, name:'Maltese lean 4x15s', duration:'4x15s', weeks:'8-16',
       sets:4, reps:'15s', rest:'2-3min',
       coaching:'Bras plus ecartees que les epaules. Specifique pour planche et maltese.',
       prep:['Ring support wide 3x15s', 'Maltese lean 3x10s', 'Wide push-up 3x10']}
    ]
  },
  lsit: {
    name: 'L-sit sol / parallettes', icon: '',
    description: 'Compression core et ischio - fondation skills avances',
    equipment: ['floor_only', 'parallettes', 'bar'],
    prereqs: 'Dips 10 reps, souplesse ischio correcte, creux poplite accessible',
    prereqPullups: 0,
    prereqPushups: 10,
    injuryAlert: 'Douleur poignet ou coude = renforcer dabord. Compression ischios normale.',
    antagonist: ['Hip flexor stretch 3x30s', 'Hamstring stretch 3x30s', 'Wrist circles 2x2min'],
    time: {debutant:'2-5 mois', intermediaire:'1-2 mois', avance:'2-6 semaines', elite:'1-3 semaines'},
    progressions: [
      {step:1, name:'Tuck L-sit sol 4x5-10s', duration:'4x5-10s', weeks:'1-3',
       sets:4, reps:'5-10s', rest:'60s',
       coaching:'Lever les hanches, genoux serres. Apprendre la depression scapulaire.',
       prep:['Support hold 3x20s', 'Tricep dip 3x10', 'Hollow body 3x15s']},
      {step:2, name:'One leg L-sit (une jambe tendue)', duration:'4x8s', weeks:'2-4',
       sets:4, reps:'8s chaque jambe', rest:'60s',
       coaching:'Alterner les jambes. Chercher l horizontalite de la jambe tendue.',
       prep:['Tuck L-sit 3x10s', 'Single leg raise 3x10', 'L-sit progression 3x5s']},
      {step:3, name:'L-sit complet 4x10s', duration:'4x10s', weeks:'3-6',
       sets:4, reps:'10s', rest:'90s',
       coaching:'Jambes horizontales et jointes. Pousser le sol fort. Maintenir la position.',
       prep:['L-sit 3x8s', 'Pike compression 3x30s', 'Dip 3x12']},
      {step:4, name:'L-sit 30s tenu + parallettes', duration:'3x30s', weeks:'5-10',
       sets:3, reps:'30s', rest:'2min',
       coaching:'Sur parallettes = plus facile. Viser 30s continus. Base du V-sit ensuite.',
       prep:['L-sit parallettes 3x15s', 'V-sit progression 3x5s', 'Dragon flag 3x5']}
    ]
  },

  lsit_bars: {
    name: 'L-sit sur parallettes (avance)', icon: '',
    description: 'L-sit technique sur parallettes - plus ample et stable',
    equipment: ['parallettes'],
    prereqs: 'L-sit sol 15s, souplesse ischio bonne, triceps forts',
    prereqPullups: 0,
    prereqPushups: 15,
    injuryAlert: 'Vigilance poignets. Variation avec poings fermes si douleur.',
    antagonist: ['Hamstring stretch 3x30s', 'Hip flexor stretch 3x30s'],
    time: {debutant:'3-6 mois', intermediaire:'4-8 semaines', avance:'2-4 semaines', elite:'1-2 semaines'},
    progressions: [
      {step:1, name:'Tuck L-sit parallettes 4x10s', duration:'4x10s', weeks:'1-2',
       sets:4, reps:'10s', rest:'60s',
       coaching:'Parallettes plus haute = plus facile. Bras tendus, corps stable.',
       prep:['Tuck L-sit sol 3x10s', 'Support hold parallettes 3x20s']},
      {step:2, name:'L-sit parallettes 4x15s', duration:'4x15s', weeks:'2-5',
       sets:4, reps:'15s', rest:'90s',
       coaching:'Jambes horizontales. Depression scapulaire maximale.',
       prep:['L-sit sol 3x10s', 'L-sit parallettes 3x10s']},
      {step:3, name:'L-sit vers V-sit progression', duration:'4x5-10s', weeks:'4-8',
       sets:4, reps:'5-10s', rest:'2min',
       coaching:'Lever les jambes au-dessus de l horizontal. V-sit = niveau elite.',
       prep:['V-sit negatif 3x5', 'Compression ischio 3x30s', 'Dragon flag 3x5']}
    ]
  },

  dragon_flag: {
    name: 'Dragon flag', icon: '',
    description: 'Gainage corps entier en appui epaules - Rocky Balboa',
    equipment: ['floor_only', 'bar'],
    prereqs: 'L-sit 20s, leg raise strict 10 reps, core tres solide',
    prereqPullups: 0,
    prereqPushups: 20,
    injuryAlert: 'Douleur lombaire = compensation. Verifier la progression. Reduire amplitude.',
    antagonist: ['Hip flexor stretch 3x30s', 'Cat-cow 2x10', 'Bridge 3x15'],
    time: {debutant:'4-8 mois', intermediaire:'2-4 mois', avance:'4-8 semaines', elite:'1-3 semaines'},
    progressions: [
      {step:1, name:'Leg raise strict 4x10', duration:'4x10', weeks:'1-3',
       sets:4, reps:'10', rest:'90s',
       coaching:'Jambes strictement tendues. Pas de balancier. Descente lente 2s.',
       prep:['Hanging knee raise 3x15', 'Plank 3x45s', 'Hollow body 3x20s']},
      {step:2, name:'Dragon flag negatif 4x5 (descente 5s)', duration:'4x5', weeks:'2-5',
       sets:4, reps:'5', rest:'2min',
       coaching:'Partir haut, descendre lentement 5 secondes. Corps en gainage total.',
       prep:['Leg raise 3x12', 'Dragon flag negatif 3x3', 'L-sit 3x15s']},
      {step:3, name:'Dragon flag partiel 4x5s hold bas', duration:'4x5s hold', weeks:'4-8',
       sets:4, reps:'5s hold a mi-parcours', rest:'2-3min',
       coaching:'Descendre a la moitie, tenir 5 secondes. Renforcement specifique.',
       prep:['Dragon flag negatif 4x5', 'Hollow body 3x25s', 'V-sit progression 3x5s']},
      {step:4, name:'Dragon flag complet 3x3-5 reps', duration:'3x3-5', weeks:'7-14+',
       sets:3, reps:'3-5', rest:'3-4min',
       coaching:'Corps rigide comme une planche. Epaules comme pivot. Pas de flexion lombaire.',
       prep:['Dragon flag negatif 4x5', 'Hanging leg raise weighted 3x8', 'L-sit 3x30s']}
    ]
  },

  human_flag: {
    name: 'Human flag', icon: '',
    description: 'Position horizontale sur poteau vertical - force laterale extreme',
    equipment: ['bar'],
    prereqs: 'Pull-up 15 reps, dip 20 reps, obliques tres forts, epaules conditionnees',
    prereqPullups: 15,
    prereqPushups: 20,
    injuryAlert: 'Epaule basse en tension extreme. Progresser TRES lentement. STOP a la moindre douleur.',
    antagonist: ['Face pull 3x15', 'Lateral raise 3x15', 'Side stretch 3x30s'],
    time: {debutant:'2-4 ans', intermediaire:'12-24 mois', avance:'6-12 mois', elite:'3-6 mois'},
    progressions: [
      {step:1, name:'Oblique conditioning + lateral plank', duration:'4x30s', weeks:'1-8',
       sets:4, reps:'30s par cote', rest:'90s',
       coaching:'Planche laterale avancee avec lever de hanche. Obliques sont le moteur.',
       prep:['Side plank 3x30s', 'Copenhagen plank 3x20s', 'Oblique crunch 3x15']},
      {step:2, name:'Tuck human flag 4x5s', duration:'4x5s', weeks:'8-16',
       sets:4, reps:'5s', rest:'3min',
       coaching:'Genoux groupes. Bras: un tire, lautre pousse. Chercher l horizontalite.',
       prep:['Copenhagen plank adv 3x20s', 'Lever lateral 3x10', 'Pull-up one-arm assisté 3x5']},
      {step:3, name:'Straddle human flag 3x3-5s', duration:'3x3-5s', weeks:'16-28',
       sets:3, reps:'3-5s', rest:'4min',
       coaching:'Jambes ecartees. Alternance cotes. Chaque cote a sa propre force.',
       prep:['Tuck human flag 4x8s', 'Weighted lateral raise 3x12', 'Archer pull-up 3x5']},
      {step:4, name:'Full human flag 3-5s', duration:'3x3-5s', weeks:'28-60+',
       sets:3, reps:'3-5s', rest:'5min',
       coaching:'Corps horizontal, jambes jointes. Niveau elite. Une des forces les plus rares.',
       prep:['Straddle HF 4x6s', 'One-arm pull-up assisté 3x5', 'Dragon flag 3x5']}
    ]
  },

  pistol_squat: {
    name: 'Pistol squat (squat unilateral)', icon: '',
    description: 'Squat sur une jambe - force, mobilite, equilibre',
    equipment: ['floor_only'],
    prereqs: 'Squat bilateral 15 reps, mobilite cheville et hanche correcte',
    prereqPullups: 0,
    prereqPushups: 0,
    injuryAlert: 'Douleur genou = valgus ou manque mobilite. Progresser avec assistance dabord.',
    antagonist: ['Hip flexor stretch 3x30s', 'Ankle mobility 3x2min', 'Pigeon stretch 3x30s'],
    time: {debutant:'3-8 mois', intermediaire:'1-3 mois', avance:'2-6 semaines', elite:'1-2 semaines'},
    progressions: [
      {step:1, name:'Mobilite cheville + hanche', duration:'5min/jour', weeks:'1-4',
       sets:3, reps:'2min chaque', rest:'30s',
       coaching:'Limitation mobilite = limitation pistol squat. Priorite mobilite.',
       prep:['Ankle dorsiflexion 3x2min', 'Hip flexor stretch 3x45s', 'Squat profond hold 3x30s']},
      {step:2, name:'Squat sur une jambe assisté (TRX/bande)', duration:'4x5', weeks:'2-5',
       sets:4, reps:'5 chaque jambe', rest:'90s',
       coaching:'Se tenir a une bande ou TRX. Aller aussi bas que possible.',
       prep:['Assisted pistol squat 3x5', 'Box squat unilateral 3x8', 'Nordic hamstring 3x5']},
      {step:3, name:'Pistol squat sur boite (ROM partiel)', duration:'4x5', weeks:'4-8',
       sets:4, reps:'5 chaque jambe', rest:'90s',
       coaching:'Boite de 30-50cm. Aller plus bas progressivement chaque semaine.',
       prep:['Box pistol squat 3x5', 'Single leg deadlift 3x8', 'Skater squat 3x8']},
      {step:4, name:'Pistol squat complet 3x5', duration:'3x5 chaque', weeks:'7-14',
       sets:3, reps:'5 chaque jambe', rest:'2min',
       coaching:'Amplitude complete. Genou ne depasse pas la pointe du pied. Talon au sol.',
       prep:['Pistol squat 3x5', 'Weighted pistol squat +5kg 3x3', 'Shrimp squat 3x5']}
    ]
  },

  one_arm_pullup: {
    name: 'One arm pull-up', icon: '',
    description: 'Traction un bras - niveau elite absolu',
    equipment: ['bar', 'rings'],
    prereqs: '20+ pull-ups stricts, weighted pull-up +20kg, archer pull-up maitrise',
    prereqPullups: 20,
    prereqPushups: 0,
    injuryAlert: 'Blessure tendon biceps tres courante. JAMAIS en fatigue. STOP a moindre douleur coude.',
    antagonist: ['Face pull 3x15', 'Band pull-apart 3x20', 'Chest press 3x12', 'External rotation 3x15'],
    time: {debutant:'4-8 ans', intermediaire:'2-4 ans', avance:'12-24 mois', elite:'6-12 mois'},
    progressions: [
      {step:1, name:'Weighted pull-up +15kg 4x3', duration:'4x3', weeks:'1-12',
       sets:4, reps:'3', rest:'4min',
       coaching:'Force pure dabord. Plein amplitude. Jamais en fatigue.',
       prep:['Weighted pull-up +15kg 4x3', 'Scapular pull-up 3x10', 'Dead hang 3x30s']},
      {step:2, name:'Archer pull-up 4x4 chaque bras', duration:'4x4', weeks:'8-20',
       sets:4, reps:'4 chaque bras', rest:'3min',
       coaching:'Un bras tire, lautre guide. Bras guide de plus en plus tendu.',
       prep:['Archer pull-up 3x4', 'One-arm dead hang 3x10s', 'Ring row OA 3x6']},
      {step:3, name:'One arm pull-up negatif assisté bande', duration:'4x3', weeks:'16-32',
       sets:4, reps:'3 negatifs chaque bras', rest:'4min',
       coaching:'Bande = assistance legere. Descente 5-8 secondes. Un bras travaille vraiment.',
       prep:['OA pull-up bande legere 3x3', 'Archer pull-up avance 3x4', 'Weighted pull-up +20kg 3x3']},
      {step:4, name:'One arm pull-up strict 1-2 reps', duration:'3x1-2', weeks:'28-52+',
       sets:3, reps:'1-2 chaque bras', rest:'5-8min',
       coaching:'Force absolue. PAS en fatigue. Meilleures conditions. 1 rep = accomplissement elite.',
       prep:['OA pull-up progressions 3x2', 'Ring OA pull-up assisté 3x3', 'Weighted pull-up +25kg 3x2']}
    ]
  }
};

// ── SESSION TEMPLATES BY DAY COUNT ──────────────────────────────────────────

var CALISTHENICS_SESSION_TEMPLATES = {
  // 2 jours: Full Body A / Full Body B
  2: {
    debutant: [
      {
        name: 'Full Body A — Poussee + Core',
        focus: 'push_core',
        duration: '45-55 min',
        warmup: ['Wrist circles 2x30s', 'Shoulder rotations 2x20', 'Scapular push-up 2x10', 'Leg swing 2x10'],
        cooldown: ['Shoulder stretch 2x30s', 'Wrist flexor stretch 2x30s', 'Hip flexor 2x30s'],
        exercises: [
          {name:'Hollow body hold', sets:3, reps:'20s', rest:'45s', skill_link:'planche', coaching:'Corps en banane inversee. Bas du dos colle au sol. Respirer normalement.'},
          {name:'Push-up progressif', sets:3, reps:'8-12', rest:'90s', skill_link:'handstand', coaching:'Coudes a 45deg. Corps rigide. Amplitude complete.'},
          {name:'Pike push-up', sets:3, reps:'6-8', rest:'90s', skill_link:'handstand', coaching:'Hanches hautes. Tete entre les bras. Descendre doucement.'},
          {name:'Dip parallettes ou chaise', sets:3, reps:'8-10', rest:'90s', skill_link:'muscle_up', coaching:'Amplitude complete. Pas de rebond en bas.'},
          {name:'Planche lean 15deg', sets:3, reps:'15s', rest:'90s', skill_link:'planche', coaching:'Doigts vers larriere. Pousser le sol fort. Corps gaigne.'},
          {name:'Knee tuck hold (L-sit prep)', sets:3, reps:'10s', rest:'60s', skill_link:'lsit', coaching:'Lever les hanches. Depression scapulaire. Corps eleve.'}
        ]
      },
      {
        name: 'Full Body B — Traction + Jambes',
        focus: 'pull_legs',
        duration: '45-55 min',
        warmup: ['Dead hang 2x20s', 'Shoulder circles 2x20', 'Hip rotation 2x10', 'Bodyweight squat 2x10'],
        cooldown: ['Lat stretch 2x30s', 'Hip flexor 2x30s', 'Hamstring stretch 2x30s'],
        exercises: [
          {name:'Dead hang', sets:3, reps:'20-30s', rest:'60s', skill_link:'front_lever', coaching:'Bras tendus. Epaules actives vers le bas. Respirer.'},
          {name:'Scapular pull-up', sets:3, reps:'10', rest:'60s', skill_link:'front_lever', coaching:'Seulement les omoplates bougent. Bras tendus tout le long.'},
          {name:'Australian pull-up / Ring row', sets:3, reps:'8-12', rest:'90s', skill_link:'muscle_up', coaching:'Corps en gainage. Tirer les coudes vers les hanches.'},
          {name:'Squat', sets:3, reps:'15', rest:'90s', skill_link:'pistol_squat', coaching:'Genoux dans laxe. Talon au sol. Descendre sous la parallele.'},
          {name:'Bulgarian split squat', sets:3, reps:'8 par jambe', rest:'90s', skill_link:'pistol_squat', coaching:'90deg genou avant. Hanche droite. Controle.'},
          {name:'Hanging knee raise', sets:3, reps:'10', rest:'60s', skill_link:'lsit', coaching:'Controlé. Pas de balancier. Core actif.'}
        ]
      }
    ],
    intermediaire: [
      {
        name: 'Full Body A — Poussee + Skills Push',
        focus: 'push_skills',
        duration: '55-70 min',
        warmup: ['Wrist circles 3x30s', 'Band pull-apart 2x20', 'Pike push-up 2x8', 'Shoulder shrug 2x15'],
        cooldown: ['Pec stretch 2x30s', 'Wrist stretch 2x30s', 'Shoulder circles 2x20'],
        exercises: [
          {name:'Handstand wall hold', sets:4, reps:'20-30s', rest:'90s', skill_link:'handstand', coaching:'Corps gaigne. Epaules actives. Pousser le sol.'},
          {name:'Pike HSPU', sets:4, reps:'6-8', rest:'2min', skill_link:'handstand_free', coaching:'Coudes a 45deg. PAS en V. Descendre lentement.'},
          {name:'Ring push-up', sets:4, reps:'10', rest:'90s', skill_link:'planche', coaching:'Anneaux bas. Stabiliser activement. Coudes pas trop ecartes.'},
          {name:'Planche lean 30deg', sets:4, reps:'15s', rest:'2min', skill_link:'planche', coaching:'Progresser linclinaison chaque semaine.'},
          {name:'L-sit sur chaise ou sol', sets:4, reps:'10-15s', rest:'90s', skill_link:'lsit', coaching:'Jambes horizontales. Corps au-dessus des mains.'},
          {name:'Hollow body + arch hold', sets:3, reps:'20s chacun', rest:'60s', skill_link:'front_lever', coaching:'Alternance 20s creux / 20s arche. Base de tous les skills.'}
        ]
      },
      {
        name: 'Full Body B — Traction + Skills Pull',
        focus: 'pull_skills',
        duration: '55-70 min',
        warmup: ['Dead hang 3x20s', 'Scapular pull-up 2x10', 'Band pull-apart 2x20', 'Hip mobility 5min'],
        cooldown: ['Lat stretch 2x30s', 'Bicep stretch 2x30s', 'Hip flexor 2x30s'],
        exercises: [
          {name:'Pull-up strict 5x5', sets:5, reps:'5', rest:'2min', skill_link:'muscle_up', coaching:'Amplitude complete. Pas de balancier. Coudes vers hanches.'},
          {name:'Tuck front lever', sets:4, reps:'10-12s', rest:'2min', skill_link:'front_lever', coaching:'Genoux serres. Hanches niveau epaules. Core actif.'},
          {name:'L-sit pull-up', sets:3, reps:'5', rest:'2-3min', skill_link:'lsit', coaching:'Maintenir le L pendant toute la traction.'},
          {name:'Pistol squat assisté', sets:4, reps:'5 chaque', rest:'90s', skill_link:'pistol_squat', coaching:'Se tenir legerement. Amplitude maximale.'},
          {name:'Dragon flag negatif', sets:4, reps:'5', rest:'2min', skill_link:'dragon_flag', coaching:'5 secondes pour descendre. Corps rigide.'},
          {name:'Skin the cat', sets:3, reps:'5', rest:'2min', skill_link:'back_lever', coaching:'Lent et controle. Epaules conditionnées dabord.'}
        ]
      }
    ],
    avance: [
      {
        name: 'Full Body A — Planche + Handstand',
        focus: 'planche_handstand',
        duration: '70-85 min',
        warmup: ['Wrist conditioning 5min', 'Shoulder mobility 5min', 'Hollow body 3x20s', 'Pike push-up 2x10'],
        cooldown: ['Wrist stretch 2min', 'Pec stretch 2x30s', 'Shoulder circles 3x20'],
        exercises: [
          {name:'Freestanding handstand 10min pratique', sets:0, reps:'10min', rest:'libre', skill_link:'handstand_free', coaching:'Volume de pratique. 10min concentré.'},
          {name:'HSPU strict', sets:4, reps:'5-8', rest:'3min', skill_link:'handstand_free', coaching:'Amplitude complete. Aucune compensation.'},
          {name:'Tuck planche', sets:5, reps:'8-10s', rest:'3min', skill_link:'planche', coaching:'Genoux serres. Corps horizontal. Pousser le sol.'},
          {name:'Planche push-up tuck', sets:4, reps:'3-5', rest:'3-4min', skill_link:'planche', coaching:'Depuis position tuck planche.'},
          {name:'Ring dip weighted +5kg', sets:4, reps:'8', rest:'2-3min', skill_link:'muscle_up_rings', coaching:'Amplitude complete. Anneaux stables.'},
          {name:'Maltese lean', sets:4, reps:'15s', rest:'3min', skill_link:'planche', coaching:'Bras tres ecartes. Horizontal. Force specifique planche.'}
        ]
      },
      {
        name: 'Full Body B — Front Lever + Force',
        focus: 'front_lever_strength',
        duration: '70-85 min',
        warmup: ['Dead hang 3x30s', 'Scapular pull-up 3x10', 'Band pull-apart 3x20', 'Lat activation 3x10'],
        cooldown: ['Lat stretch 3x30s', 'Pec stretch 2x30s', 'Hip flexor 2x30s'],
        exercises: [
          {name:'Weighted pull-up +10kg', sets:5, reps:'4-5', rest:'3-4min', skill_link:'one_arm_pullup', coaching:'Amplitude complete. Qualite avant charge.'},
          {name:'Advanced tuck front lever', sets:5, reps:'8-10s', rest:'3min', skill_link:'front_lever', coaching:'Dos plat. Hanche 90deg. Deprime les scapulas.'},
          {name:'Archer pull-up', sets:4, reps:'4 chaque bras', rest:'3min', skill_link:'one_arm_pullup', coaching:'Bras guide de plus en plus tendu.'},
          {name:'Straddle front lever negatif', sets:4, reps:'5', rest:'3min', skill_link:'front_lever', coaching:'Descente 3-4 secondes depuis haut.'},
          {name:'Dragon flag', sets:4, reps:'5', rest:'2-3min', skill_link:'dragon_flag', coaching:'Corps planche. Epaules pivot. Rythme lent.'},
          {name:'One-arm dead hang', sets:3, reps:'10-15s chaque', rest:'2min', skill_link:'one_arm_pullup', coaching:'Preparer les tendons pour OAP.'}
        ]
      }
    ],
    elite: [
      {
        name: 'Full Body A — Skills Poussee',
        focus: 'elite_push',
        duration: '80-100 min',
        warmup: ['Wrist conditioning 8min', 'Shoulder mobility 5min', 'Full body activation 5min'],
        cooldown: ['Wrist decompression 5min', 'Shoulder stretch 3x30s', 'Full body stretch 10min'],
        exercises: [
          {name:'Freestanding HSPU', sets:5, reps:'3-5', rest:'4min', skill_link:'handstand_free', coaching:'Equilibre + force. Plein amplitude.'},
          {name:'Straddle planche hold', sets:5, reps:'5-8s', rest:'5min', skill_link:'planche', coaching:'Bras tendus. Corps horizontal. Concentration maximale.'},
          {name:'Planche push-up straddle', sets:4, reps:'2-3', rest:'5min', skill_link:'planche', coaching:'Depuis straddle planche. Extreme force.'},
          {name:'Ring muscle-up strict', sets:4, reps:'3-5', rest:'4min', skill_link:'muscle_up_rings', coaching:'Qualite absolue. Rotation anneaux en appui.'},
          {name:'Handstand walk 5m+', sets:4, reps:'5m', rest:'3min', skill_link:'handstand_free', coaching:'Equilibre dynamique. Corrections rapides doigts.'}
        ]
      },
      {
        name: 'Full Body B — Skills Traction',
        focus: 'elite_pull',
        duration: '80-100 min',
        warmup: ['Dead hang 3x30s', 'Scap activation 3x10', 'Elbow conditioning 5min'],
        cooldown: ['Lat stretch 3x30s', 'Bicep stretch 3x30s', 'Decompression 10min'],
        exercises: [
          {name:'One-arm pull-up assisté bande legere', sets:5, reps:'3 chaque', rest:'5min', skill_link:'one_arm_pullup', coaching:'Bande = minimal. Qualite parfaite.'},
          {name:'Full front lever hold', sets:5, reps:'3-5s', rest:'5min', skill_link:'front_lever', coaching:'Corps parfaitement horizontal. PAS de compensation.'},
          {name:'Back lever straddle', sets:4, reps:'5s', rest:'4min', skill_link:'back_lever', coaching:'Jambes ecartees. Position maitrisee.'},
          {name:'Human flag tuck', sets:4, reps:'5s', rest:'4min', skill_link:'human_flag', coaching:'Un bras tire, lautre pousse. Horizontal.'},
          {name:'Weighted pull-up +25kg', sets:4, reps:'3', rest:'4min', skill_link:'one_arm_pullup', coaching:'Force brute. Preparation OAP.'}
        ]
      }
    ]
  },
  // 3 jours: Push / Pull / Core+Legs
  3: {
    debutant: [
      {
        name: 'Poussee — Fondations',
        focus: 'push',
        duration: '45-55 min',
        warmup: ['Wrist circles 2x30s', 'Shoulder rotation 2x20', 'Push-up scapulaire 2x10'],
        cooldown: ['Pec stretch 2x30s', 'Wrist stretch 2x30s'],
        exercises: [
          {name:'Hollow body', sets:3, reps:'20s', rest:'60s', skill_link:'planche', coaching:'Bas du dos colle. Bras tires vers le haut.'},
          {name:'Push-up progressif', sets:4, reps:'8-12', rest:'90s', skill_link:'handstand', coaching:'Coudes a 45deg. Amplitude complete.'},
          {name:'Pike push-up', sets:3, reps:'6-8', rest:'2min', skill_link:'handstand', coaching:'Elever les pieds progressivement.'},
          {name:'Dip sur chaise', sets:3, reps:'8-10', rest:'90s', skill_link:'muscle_up', coaching:'Amplitude complete. Corps droit.'},
          {name:'Planche lean', sets:3, reps:'15s', rest:'90s', skill_link:'planche', coaching:'Doigts vers larriere. Incliner progressivement.'},
          {name:'Wall handstand hold', sets:3, reps:'20s', rest:'90s', skill_link:'handstand', coaching:'Ventre au mur. Corps gaigne. Pousser le sol.'}
        ]
      },
      {
        name: 'Traction — Fondations',
        focus: 'pull',
        duration: '45-55 min',
        warmup: ['Dead hang 2x20s', 'Scapular pull-up 2x10', 'Shoulder circles 2x20'],
        cooldown: ['Lat stretch 2x30s', 'Bicep stretch 2x30s'],
        exercises: [
          {name:'Dead hang', sets:3, reps:'20-30s', rest:'60s', skill_link:'front_lever', coaching:'Epaules actives vers le bas. Bras tendus.'},
          {name:'Scapular pull-up', sets:3, reps:'10', rest:'60s', skill_link:'front_lever', coaching:'Seulement les omoplates. Pas de flexion coude.'},
          {name:'Australian pull-up', sets:4, reps:'8-12', rest:'90s', skill_link:'muscle_up', coaching:'Corps gaigne. Tirer les coudes vers hanches.'},
          {name:'Negative pull-up 3s', sets:3, reps:'5', rest:'2min', skill_link:'muscle_up', coaching:'Monter avec saut, descendre 3 secondes.'},
          {name:'Tuck front lever', sets:3, reps:'8s', rest:'2min', skill_link:'front_lever', coaching:'Genoux groupes. Hanches a hauteur epaules.'},
          {name:'Hanging knee raise', sets:3, reps:'10', rest:'60s', skill_link:'lsit', coaching:'Controlé. Pas de balancier.'}
        ]
      },
      {
        name: 'Core + Jambes — Fondations',
        focus: 'core_legs',
        duration: '45-55 min',
        warmup: ['Hip rotation 2x10', 'Bodyweight squat 2x15', 'Plank 2x20s'],
        cooldown: ['Hip flexor stretch 2x30s', 'Hamstring stretch 2x30s', 'Cat-cow 2x10'],
        exercises: [
          {name:'L-sit sol tuck', sets:4, reps:'8-10s', rest:'60s', skill_link:'lsit', coaching:'Lever les hanches. Depression scapulaire.'},
          {name:'Squat', sets:4, reps:'15', rest:'90s', skill_link:'pistol_squat', coaching:'Profond. Talon au sol. Genoux dans laxe.'},
          {name:'Dragon flag negatif', sets:3, reps:'5', rest:'2min', skill_link:'dragon_flag', coaching:'Descente 3-4 secondes. Corps rigide.'},
          {name:'Bulgarian split squat', sets:3, reps:'8 par jambe', rest:'90s', skill_link:'pistol_squat', coaching:'Controle. Amplitude complete.'},
          {name:'Plank', sets:3, reps:'45s', rest:'60s', skill_link:'planche', coaching:'Corps rigide. Bassin neutre. Respirer.'},
          {name:'Hip thrust', sets:3, reps:'15', rest:'60s', skill_link:'pistol_squat', coaching:'Contraction gluteale complete en haut.'}
        ]
      }
    ],
    intermediaire: [
      {
        name: 'Push — Developpement',
        focus: 'push',
        duration: '55-70 min',
        warmup: ['Wrist conditioning 3min', 'Pike push-up 2x8', 'Band pull-apart 2x20', 'Shoulder shrug 2x15'],
        cooldown: ['Pec stretch 2x30s', 'Wrist decompression 2min', 'Shoulder circles 2x20'],
        exercises: [
          {name:'Wall handstand', sets:4, reps:'25-30s', rest:'90s', skill_link:'handstand', coaching:'Corps gaigne. Pousser le sol vers le bas.'},
          {name:'Pike HSPU', sets:4, reps:'6-8', rest:'2min', skill_link:'handstand_free', coaching:'Coudes a 45deg. Tete entre les mains.'},
          {name:'Ring push-up', sets:4, reps:'10-12', rest:'90s', skill_link:'planche', coaching:'Anneaux stables. Coudes pas trop ecartes.'},
          {name:'Tuck planche hold', sets:4, reps:'8-10s', rest:'3min', skill_link:'planche', coaching:'Corps horizontal. Genoux serres.'},
          {name:'L-sit sur barres', sets:4, reps:'12-15s', rest:'90s', skill_link:'lsit', coaching:'Jambes horizontales. Stable.'},
          {name:'Skin the cat', sets:3, reps:'5', rest:'2min', skill_link:'back_lever', coaching:'Lent et controle. Epaule conditionnée.'}
        ]
      },
      {
        name: 'Pull — Developpement',
        focus: 'pull',
        duration: '55-70 min',
        warmup: ['Dead hang 3x20s', 'Scapular pull-up 3x10', 'Face pull bande 2x20'],
        cooldown: ['Lat stretch 2x30s', 'Pec stretch 2x30s', 'Bicep stretch 2x30s'],
        exercises: [
          {name:'Pull-up strict', sets:5, reps:'5', rest:'2min', skill_link:'muscle_up', coaching:'Plein amplitude. Pas de balancier.'},
          {name:'L-sit pull-up', sets:4, reps:'4-5', rest:'2-3min', skill_link:'lsit', coaching:'Maintenir le L tout au long.'},
          {name:'Advanced tuck front lever', sets:4, reps:'8s', rest:'3min', skill_link:'front_lever', coaching:'Dos plat. Hanche ouverte.'},
          {name:'Muscle-up negatif', sets:4, reps:'3', rest:'3min', skill_link:'muscle_up', coaching:'Partir en appui. Descente 5 secondes.'},
          {name:'Archer pull-up', sets:3, reps:'4 chaque', rest:'3min', skill_link:'one_arm_pullup', coaching:'Bras guide s etend progressivement.'},
          {name:'German hang', sets:3, reps:'15s', rest:'2min', skill_link:'back_lever', coaching:'Epaule en extension. Progressif.'}
        ]
      },
      {
        name: 'Core + Jambes — Developpement',
        focus: 'core_legs',
        duration: '55-70 min',
        warmup: ['Hip mobility 5min', 'Ankle mobility 3min', 'Squat profond 2x10'],
        cooldown: ['Hip flexor 2x30s', 'Pigeon stretch 2x30s', 'Lumbar decompression 5min'],
        exercises: [
          {name:'Dragon flag', sets:4, reps:'5', rest:'2-3min', skill_link:'dragon_flag', coaching:'Corps planche. Epaules pivot.'},
          {name:'Pistol squat assisté', sets:4, reps:'5 chaque', rest:'90s', skill_link:'pistol_squat', coaching:'Assistance minimale. Amplitude maximale.'},
          {name:'L-sit 30s', sets:4, reps:'30s', rest:'2min', skill_link:'lsit', coaching:'Jambes horizontales. Stable.'},
          {name:'Windshield wiper', sets:3, reps:'8 chaque', rest:'90s', skill_link:'human_flag', coaching:'Controle lateralement. Core total.'},
          {name:'Nordic hamstring curl', sets:3, reps:'5', rest:'2min', skill_link:'pistol_squat', coaching:'Excentrique force. Protection ischio.'},
          {name:'Copenhagen plank', sets:3, reps:'20s chaque', rest:'90s', skill_link:'human_flag', coaching:'Abducteur actif. Corps aligne.'}
        ]
      }
    ],
    avance: [
      {
        name: 'Push — Volume Skill',
        focus: 'push',
        duration: '65-80 min',
        warmup: ['Wrist conditioning 5min', 'Shoulder mobility 5min', 'HSPU eccentric 2x3'],
        cooldown: ['Wrist decompression 3min', 'Pec stretch 3x30s', 'External rotation 2x15'],
        exercises: [
          {name:'Freestanding handstand 10min', sets:0, reps:'10min pratique', rest:'libre', skill_link:'handstand_free', coaching:'Pratique quotidienne essentielle.'},
          {name:'HSPU strict', sets:5, reps:'5-8', rest:'3min', skill_link:'handstand_free', coaching:'Amplitude complete. Corps vertical.'},
          {name:'Advanced tuck planche', sets:5, reps:'8-10s', rest:'3-4min', skill_link:'planche', coaching:'Hanche ouverte. Dos arrondi. Core controle.'},
          {name:'Planche push-up tuck', sets:4, reps:'3-5', rest:'4min', skill_link:'planche', coaching:'Mouvement depusis tuck planche.'},
          {name:'Ring dip weighted', sets:4, reps:'8', rest:'3min', skill_link:'muscle_up_rings', coaching:'+5-10kg. Amplitude complete.'},
          {name:'Maltese lean', sets:4, reps:'15s', rest:'3min', skill_link:'planche', coaching:'Bras tres ecartes. Specifique planche.'}
        ]
      },
      {
        name: 'Pull — Volume Skill',
        focus: 'pull',
        duration: '65-80 min',
        warmup: ['Dead hang 3x30s', 'Scap pull-up 3x10', 'Lat activation 3x10'],
        cooldown: ['Lat stretch 3x30s', 'Bicep stretch 3x30s', 'Decompression 5min'],
        exercises: [
          {name:'Weighted pull-up +10kg', sets:5, reps:'5', rest:'3-4min', skill_link:'one_arm_pullup', coaching:'Force pure. Qualite avant charge.'},
          {name:'Straddle front lever', sets:5, reps:'5-6s', rest:'4min', skill_link:'front_lever', coaching:'Jambes ecartees. Horizontal. Retenir lexpiration.'},
          {name:'Archer pull-up avance', sets:4, reps:'4 chaque', rest:'3min', skill_link:'one_arm_pullup', coaching:'Bras guide presque tendu.'},
          {name:'Back lever tuck', sets:4, reps:'8s', rest:'3-4min', skill_link:'back_lever', coaching:'Genoux groupes. Controle total.'},
          {name:'Muscle-up strict barre', sets:4, reps:'3-5', rest:'4min', skill_link:'muscle_up', coaching:'Strictement sans kip. Force pure.'},
          {name:'One-arm dead hang', sets:3, reps:'15s chaque', rest:'2min', skill_link:'one_arm_pullup', coaching:'Preparation tendons OAP.'}
        ]
      },
      {
        name: 'Core + Jambes + Mobilite',
        focus: 'core_legs',
        duration: '60-75 min',
        warmup: ['Hip mobility 8min', 'Ankle mobility 3min', 'Thoracic rotation 2x10'],
        cooldown: ['Pancake stretch 3x60s', 'Hip flexor 3x30s', 'Bridge walkout 3x10'],
        exercises: [
          {name:'Dragon flag', sets:5, reps:'5', rest:'3min', skill_link:'dragon_flag', coaching:'Exigeant. Corps planche. Epaules pivot.'},
          {name:'Pistol squat', sets:5, reps:'5 chaque', rest:'2min', skill_link:'pistol_squat', coaching:'Amplitude complete. Genoux propres.'},
          {name:'Human flag tuck', sets:4, reps:'5s', rest:'4min', skill_link:'human_flag', coaching:'Un bras tire, lautre pousse.'},
          {name:'Weighted pistol squat +5kg', sets:3, reps:'5 chaque', rest:'2-3min', skill_link:'pistol_squat', coaching:'Progression force.'},
          {name:'Copenhagen plank avance', sets:3, reps:'20s chaque', rest:'90s', skill_link:'human_flag', coaching:'Force laterale. Obliques.'},
          {name:'Manna progression', sets:3, reps:'8s', rest:'3min', skill_link:'lsit', coaching:'V-sit pousse vers le plafond.'}
        ]
      }
    ],
    elite: [
      {
        name: 'Push Skill — Elite',
        focus: 'push',
        duration: '80-100 min',
        warmup: ['Wrist conditioning 8min', 'Shoulder complex 5min', 'Activation complète 5min'],
        cooldown: ['Full shoulder decompression 10min', 'Wrist rehab 5min'],
        exercises: [
          {name:'Freestanding HSPU', sets:5, reps:'3-5', rest:'5min', skill_link:'handstand_free', coaching:'Equilibre + force maximale.'},
          {name:'Straddle planche', sets:5, reps:'5-8s', rest:'5min', skill_link:'planche', coaching:'Bras tendus. Horizontal parfait.'},
          {name:'Planche push-up straddle', sets:4, reps:'2-4', rest:'5min', skill_link:'planche', coaching:'Puissance extreme requise.'},
          {name:'Ring muscle-up strict', sets:5, reps:'3-5', rest:'4min', skill_link:'muscle_up_rings', coaching:'Rotation anneaux. Strict.'},
          {name:'Handstand walk', sets:4, reps:'8-10m', rest:'3min', skill_link:'handstand_free', coaching:'Dynamique. Corrections instinctives.'}
        ]
      },
      {
        name: 'Pull Skill — Elite',
        focus: 'pull',
        duration: '80-100 min',
        warmup: ['Dead hang 3x30s', 'Elbow conditioning 5min', 'Full back activation 5min'],
        cooldown: ['Full decompression 10min', 'Anti-impingement routine 10min'],
        exercises: [
          {name:'One-arm pull-up assisté minimal', sets:5, reps:'2-3 chaque', rest:'6min', skill_link:'one_arm_pullup', coaching:'Effort maximal chaque rep.'},
          {name:'Full front lever', sets:5, reps:'3-5s', rest:'5min', skill_link:'front_lever', coaching:'Corps horizontal. Absolu.'},
          {name:'Back lever straddle', sets:4, reps:'5-6s', rest:'4-5min', skill_link:'back_lever', coaching:'Position maitrisee. Controle total.'},
          {name:'Human flag straddle', sets:4, reps:'4-5s', rest:'5min', skill_link:'human_flag', coaching:'Horizontal. Force laterale extreme.'},
          {name:'Weighted pull-up +25-30kg', sets:4, reps:'2-3', rest:'5min', skill_link:'one_arm_pullup', coaching:'Force brute pour OAP.'}
        ]
      },
      {
        name: 'Core + Jambes — Elite',
        focus: 'core_legs',
        duration: '75-90 min',
        warmup: ['Hip complex 8min', 'Spine mobility 5min'],
        cooldown: ['Pancake stretch 5min', 'Full hip complex 10min'],
        exercises: [
          {name:'Dragon flag weighted', sets:5, reps:'5', rest:'3-4min', skill_link:'dragon_flag', coaching:'+5kg sur poitrine. Extreme.'},
          {name:'Pistol squat weighted +10kg', sets:5, reps:'5 chaque', rest:'3min', skill_link:'pistol_squat', coaching:'Force + mobilite.'},
          {name:'Full human flag attempts', sets:5, reps:'3-5s', rest:'5min', skill_link:'human_flag', coaching:'Tentatives qualite.'},
          {name:'Shrimp squat', sets:4, reps:'5 chaque', rest:'2min', skill_link:'pistol_squat', coaching:'Genou touche le sol. Controle.'},
          {name:'V-sit 15s', sets:4, reps:'15s', rest:'3min', skill_link:'lsit', coaching:'Compression maximale. Elite.'}
        ]
      }
    ]
  },
  // 4 jours: Push / Pull / Skills / Core+Legs
  4: {
    debutant: [
      {
        name: 'Push — Fondations',
        focus: 'push',
        duration: '45-55 min',
        warmup: ['Wrist circles 2x30s', 'Shoulder rotations 2x20', 'Push-up scapulaire 2x10'],
        cooldown: ['Pec stretch 2x30s', 'Wrist stretch 2x30s'],
        exercises: [
          {name:'Push-up', sets:4, reps:'10-15', rest:'90s', skill_link:'handstand', coaching:'Coudes a 45deg. Amplitude complete.'},
          {name:'Pike push-up', sets:3, reps:'8', rest:'2min', skill_link:'handstand', coaching:'Hanches hautes. Descendre lentement.'},
          {name:'Dip sur chaise', sets:3, reps:'10', rest:'90s', skill_link:'muscle_up', coaching:'Amplitude complete. Corps droit.'},
          {name:'Hollow body', sets:4, reps:'20s', rest:'60s', skill_link:'planche', coaching:'Bas du dos au sol. Bras tendus.'}]
      },
      {
        name: 'Pull — Fondations',
        focus: 'pull',
        duration: '45-55 min',
        warmup: ['Dead hang 2x20s', 'Scapular pull-up 2x10'],
        cooldown: ['Lat stretch 2x30s'],
        exercises: [
          {name:'Dead hang', sets:3, reps:'30s', rest:'60s', skill_link:'front_lever', coaching:'Epaules actives vers le bas.'},
          {name:'Australian pull-up', sets:4, reps:'10', rest:'90s', skill_link:'muscle_up', coaching:'Corps gaigne. Coudes vers hanches.'},
          {name:'Negative pull-up 3s', sets:4, reps:'5', rest:'2min', skill_link:'muscle_up', coaching:'Controle total. 3 secondes vers le bas.'},
          {name:'Scapular pull-up', sets:3, reps:'10', rest:'60s', skill_link:'front_lever', coaching:'Seulement les omoplates.'}]
      },
      {
        name: 'Skills — Introduction',
        focus: 'skills',
        duration: '45-55 min',
        warmup: ['Full mobility 8min'],
        cooldown: ['Full stretch 8min'],
        exercises: [
          {name:'Wall handstand', sets:4, reps:'20s', rest:'90s', skill_link:'handstand', coaching:'Ventre au mur. Corps gaigne.'},
          {name:'Tuck front lever', sets:3, reps:'8s', rest:'2min', skill_link:'front_lever', coaching:'Genoux groupes. Hanches hautes.'},
          {name:'L-sit tuck sol', sets:4, reps:'8s', rest:'60s', skill_link:'lsit', coaching:'Lever les hanches. Depression scap.'},
          {name:'Planche lean', sets:4, reps:'15s', rest:'90s', skill_link:'planche', coaching:'Doigts arriere. Pencher progressivement.'}]
      },
      {
        name: 'Core + Jambes — Fondations',
        focus: 'core_legs',
        duration: '45-55 min',
        warmup: ['Hip rotation 2x10', 'Squat 2x15'],
        cooldown: ['Hip flexor 2x30s', 'Hamstring 2x30s'],
        exercises: [
          {name:'Squat', sets:4, reps:'15', rest:'90s', skill_link:'pistol_squat', coaching:'Profond. Talon au sol.'},
          {name:'Dragon flag negatif', sets:3, reps:'5', rest:'2min', skill_link:'dragon_flag', coaching:'3-4 secondes en descente.'},
          {name:'Bulgarian split squat', sets:3, reps:'8 chaque', rest:'90s', skill_link:'pistol_squat', coaching:'Controle. Genou stable.'},
          {name:'Plank', sets:3, reps:'45s', rest:'60s', skill_link:'planche', coaching:'Corps rigide. Respirer.'}]
      }
    ],
    intermediaire: [
      {name:'Push — Developpement', focus:'push', duration:'55-70 min',
       warmup:['Wrist conditioning 3min', 'Pike push-up 2x8'],
       cooldown:['Pec stretch 2x30s', 'Wrist decompression 2min'],
       exercises:[
         {name:'Handstand wall', sets:4, reps:'25-30s', rest:'90s', skill_link:'handstand', coaching:'Corps parfaitement gaigne.'},
         {name:'Pike HSPU', sets:4, reps:'8', rest:'2min', skill_link:'handstand_free', coaching:'Coudes 45deg.'},
         {name:'Ring push-up', sets:4, reps:'12', rest:'90s', skill_link:'planche', coaching:'Stabilite anneaux.'},
         {name:'Tuck planche', sets:4, reps:'8s', rest:'3min', skill_link:'planche', coaching:'Horizontal. Genoux serres.'}]},
      {name:'Pull — Developpement', focus:'pull', duration:'55-70 min',
       warmup:['Dead hang 3x20s', 'Scapular 3x10'],
       cooldown:['Lat stretch 2x30s'],
       exercises:[
         {name:'Pull-up strict', sets:5, reps:'5', rest:'2min', skill_link:'muscle_up', coaching:'Plein amplitude.'},
         {name:'L-sit pull-up', sets:4, reps:'4-5', rest:'3min', skill_link:'lsit', coaching:'L maintenu tout au long.'},
         {name:'Muscle-up negatif', sets:4, reps:'3', rest:'3min', skill_link:'muscle_up', coaching:'5 secondes descente.'},
         {name:'Archer pull-up', sets:3, reps:'4 chaque', rest:'3min', skill_link:'one_arm_pullup', coaching:'Bras guide tendu progressivement.'}]},
      {name:'Skills — Pratique', focus:'skills', duration:'60-75 min',
       warmup:['Full mobility 10min'],
       cooldown:['Full stretch 10min'],
       exercises:[
         {name:'Freestanding handstand kick-ups', sets:8, reps:'tentatives', rest:'30s entre', skill_link:'handstand', coaching:'Apprendre a tenir.'},
         {name:'Straddle front lever negatif', sets:4, reps:'5', rest:'3min', skill_link:'front_lever', coaching:'Descente controlee.'},
         {name:'German hang', sets:4, reps:'15s', rest:'2min', skill_link:'back_lever', coaching:'Epaule en extension progressive.'},
         {name:'Skin the cat', sets:4, reps:'5', rest:'2min', skill_link:'back_lever', coaching:'Lent. Controle total.'}]},
      {name:'Core + Jambes — Developpement', focus:'core_legs', duration:'55-70 min',
       warmup:['Hip mobility 5min', 'Ankle mobility 3min'],
       cooldown:['Hip flexor 2x30s', 'Pigeon 2x30s'],
       exercises:[
         {name:'Dragon flag', sets:4, reps:'5', rest:'3min', skill_link:'dragon_flag', coaching:'Corps planche. Pivot epaules.'},
         {name:'Pistol squat assisté', sets:4, reps:'5 chaque', rest:'90s', skill_link:'pistol_squat', coaching:'Amplitude maximale.'},
         {name:'Copenhagen plank', sets:3, reps:'20s chaque', rest:'90s', skill_link:'human_flag', coaching:'Obliques forts.'},
         {name:'Nordic hamstring', sets:3, reps:'5', rest:'2min', skill_link:'pistol_squat', coaching:'Protection ischio.'}]}
    ],
    avance: [
      {name:'Push Avance', focus:'push', duration:'65-80 min',
       warmup:['Wrist 5min', 'Shoulder 5min'],
       cooldown:['Wrist decompression 3min', 'Pec stretch 3x30s'],
       exercises:[
         {name:'HSPU strict', sets:5, reps:'5-8', rest:'3min', skill_link:'handstand_free', coaching:'Amplitude complete.'},
         {name:'Adv tuck planche', sets:5, reps:'8-10s', rest:'4min', skill_link:'planche', coaching:'Hanche ouverte. Dos arrondi.'},
         {name:'Planche push-up', sets:4, reps:'3-5', rest:'4min', skill_link:'planche', coaching:'Force extreme.'},
         {name:'Ring dip weighted +7.5kg', sets:4, reps:'8', rest:'3min', skill_link:'muscle_up_rings', coaching:'Amplitude complete.'}]},
      {name:'Pull Avance', focus:'pull', duration:'65-80 min',
       warmup:['Dead hang 3x30s', 'Scap 3x10', 'Lat activation 3x10'],
       cooldown:['Lat stretch 3x30s', 'Decompression 5min'],
       exercises:[
         {name:'Weighted pull-up +12.5kg', sets:5, reps:'5', rest:'4min', skill_link:'one_arm_pullup', coaching:'Force pure.'},
         {name:'Straddle front lever', sets:5, reps:'6-8s', rest:'4min', skill_link:'front_lever', coaching:'Horizontal.'},
         {name:'Back lever tuck', sets:4, reps:'8s', rest:'3min', skill_link:'back_lever', coaching:'Genoux groupes.'},
         {name:'Muscle-up strict', sets:4, reps:'4-5', rest:'4min', skill_link:'muscle_up', coaching:'Qualite absolue.'}]},
      {name:'Skills Avance', focus:'skills', duration:'70-85 min',
       warmup:['Full mobility 10min'],
       cooldown:['Full stretch 10min'],
       exercises:[
         {name:'Freestanding handstand 10min', sets:0, reps:'10min', rest:'libre', skill_link:'handstand_free', coaching:'Pratique quotidienne.'},
         {name:'Straddle planche attempts', sets:5, reps:'3-5s', rest:'5min', skill_link:'planche', coaching:'Jambes ecartees. Horizontal.'},
         {name:'Back lever straddle', sets:4, reps:'5-6s', rest:'4min', skill_link:'back_lever', coaching:'Corps horizontal.'},
         {name:'Human flag tuck', sets:4, reps:'5s', rest:'4min', skill_link:'human_flag', coaching:'Un bras tire, lautre pousse.'}]},
      {name:'Core + Jambes + Mobilite', focus:'core_legs', duration:'60-75 min',
       warmup:['Hip complex 8min'],
       cooldown:['Pancake 3x60s', 'Hip complex 10min'],
       exercises:[
         {name:'Dragon flag', sets:5, reps:'6', rest:'3min', skill_link:'dragon_flag', coaching:'Corps planche.'},
         {name:'Pistol squat', sets:5, reps:'5 chaque', rest:'2min', skill_link:'pistol_squat', coaching:'Amplitude complete.'},
         {name:'Human flag progressions', sets:4, reps:'5s', rest:'5min', skill_link:'human_flag', coaching:'Force laterale.'},
         {name:'Manna progression', sets:3, reps:'8s', rest:'3min', skill_link:'lsit', coaching:'V-sit vers le plafond.'}]}
    ],
    elite: [
      {name:'Push Elite', focus:'push', duration:'80-100 min',
       warmup:['Wrist conditioning 8min', 'Shoulder complex 5min'],
       cooldown:['Full decompression 10min'],
       exercises:[
         {name:'Freestanding HSPU', sets:5, reps:'4-6', rest:'5min', skill_link:'handstand_free', coaching:'Elite level.'},
         {name:'Straddle planche', sets:5, reps:'6-10s', rest:'5min', skill_link:'planche', coaching:'Horizontal absolu.'},
         {name:'Full planche attempts', sets:4, reps:'3-5s', rest:'5min', skill_link:'planche', coaching:'Jambes jointes. Sommet.'},
         {name:'Ring muscle-up strict', sets:5, reps:'4-5', rest:'4min', skill_link:'muscle_up_rings', coaching:'Qualite parfaite.'}]},
      {name:'Pull Elite', focus:'pull', duration:'80-100 min',
       warmup:['Dead hang 3x30s', 'Elbow conditioning 5min'],
       cooldown:['Full decompression 10min'],
       exercises:[
         {name:'OA pull-up attempts', sets:5, reps:'2-3 chaque', rest:'6min', skill_link:'one_arm_pullup', coaching:'Effort maximal.'},
         {name:'Full front lever', sets:5, reps:'4-6s', rest:'5min', skill_link:'front_lever', coaching:'Corps horizontal.'},
         {name:'Full back lever', sets:4, reps:'4-5s', rest:'5min', skill_link:'back_lever', coaching:'Controle total.'},
         {name:'Weighted pull-up +25kg', sets:4, reps:'3', rest:'5min', skill_link:'one_arm_pullup', coaching:'Force brute.'}]},
      {name:'Skills Elite', focus:'skills', duration:'80-100 min',
       warmup:['Full mobility 10min'],
       cooldown:['Full decompression 15min'],
       exercises:[
         {name:'Handstand walk 10m+', sets:4, reps:'10m', rest:'3min', skill_link:'handstand_free', coaching:'Dynamique.'},
         {name:'Human flag full attempts', sets:5, reps:'3-5s', rest:'5min', skill_link:'human_flag', coaching:'Jambes jointes.'},
         {name:'Manna hold', sets:4, reps:'5-10s', rest:'4min', skill_link:'lsit', coaching:'Au-dessus du L-sit.'},
         {name:'Ring L-sit to V-sit', sets:3, reps:'5', rest:'3min', skill_link:'lsit', coaching:'Transition controlee.'}]},
      {name:'Core + Jambes Elite', focus:'core_legs', duration:'75-90 min',
       warmup:['Hip complex 8min'],
       cooldown:['Full hip complex 10min'],
       exercises:[
         {name:'Dragon flag weighted +5kg', sets:5, reps:'5', rest:'4min', skill_link:'dragon_flag', coaching:'Extreme.'},
         {name:'Pistol squat weighted +15kg', sets:5, reps:'5 chaque', rest:'3min', skill_link:'pistol_squat', coaching:'Force.'},
         {name:'Shrimp squat', sets:4, reps:'5 chaque', rest:'2min', skill_link:'pistol_squat', coaching:'ROM total.'},
         {name:'V-sit 20s', sets:4, reps:'20s', rest:'3min', skill_link:'lsit', coaching:'Compression extreme.'}]}
    ]
  },
  // 5 jours: Push / Pull / Skills / Lower / Mobility+Recovery
  5: {
    debutant: [
      {name:'Push — Fondations', focus:'push', duration:'45-55 min',
       warmup:['Wrist circles 2x30s', 'Shoulder rotation 2x20', 'Push-up scap 2x10'],
       cooldown:['Pec stretch 2x30s', 'Wrist stretch 2x30s'],
       exercises:[
         {name:'Push-up', sets:4, reps:'10-15', rest:'90s', skill_link:'handstand', coaching:'Coudes 45deg.'},
         {name:'Pike push-up', sets:3, reps:'8', rest:'2min', skill_link:'handstand', coaching:'Hanches hautes.'},
         {name:'Dip chaise', sets:3, reps:'10', rest:'90s', skill_link:'muscle_up', coaching:'Amplitude complete.'},
         {name:'Wall handstand', sets:3, reps:'20s', rest:'90s', skill_link:'handstand', coaching:'Corps gaigne.'},
         {name:'Hollow body', sets:3, reps:'20s', rest:'60s', skill_link:'planche', coaching:'Bas du dos au sol.'}]},
      {name:'Pull — Fondations', focus:'pull', duration:'45-55 min',
       warmup:['Dead hang 2x20s', 'Scapular 2x10'],
       cooldown:['Lat stretch 2x30s'],
       exercises:[
         {name:'Dead hang', sets:3, reps:'30s', rest:'60s', skill_link:'front_lever', coaching:'Epaules actives.'},
         {name:'Australian pull-up', sets:4, reps:'10', rest:'90s', skill_link:'muscle_up', coaching:'Corps gaigne.'},
         {name:'Negative pull-up 3s', sets:4, reps:'5', rest:'2min', skill_link:'muscle_up', coaching:'3 secondes descente.'},
         {name:'Tuck front lever', sets:3, reps:'8s', rest:'2min', skill_link:'front_lever', coaching:'Genoux groupes.'},
         {name:'Hanging knee raise', sets:3, reps:'10', rest:'60s', skill_link:'lsit', coaching:'Controle.'}]},
      {name:'Skills — Introduction', focus:'skills', duration:'40-50 min',
       warmup:['Full mobility 8min'],
       cooldown:['Full stretch 8min'],
       exercises:[
         {name:'Wall handstand kick-up', sets:5, reps:'5 essais', rest:'60s', skill_link:'handstand', coaching:'Apprendre le kick-up.'},
         {name:'L-sit tuck', sets:4, reps:'8s', rest:'60s', skill_link:'lsit', coaching:'Lever les hanches.'},
         {name:'Planche lean', sets:3, reps:'15s', rest:'90s', skill_link:'planche', coaching:'Doigts arriere.'},
         {name:'Dragon flag negatif', sets:3, reps:'5', rest:'2min', skill_link:'dragon_flag', coaching:'Corps rigide.'}]},
      {name:'Jambes — Fondations', focus:'legs', duration:'45-55 min',
       warmup:['Hip rotation 2x10', 'Squat 2x15', 'Leg swing 2x10'],
       cooldown:['Hip flexor 2x30s', 'Hamstring 2x30s'],
       exercises:[
         {name:'Squat', sets:4, reps:'15', rest:'90s', skill_link:'pistol_squat', coaching:'Profond. Talon au sol.'},
         {name:'Bulgarian split squat', sets:3, reps:'8 chaque', rest:'90s', skill_link:'pistol_squat', coaching:'Controle.'},
         {name:'Hip thrust', sets:3, reps:'15', rest:'60s', skill_link:'pistol_squat', coaching:'Contraction gluteale.'},
         {name:'Plank', sets:3, reps:'45s', rest:'60s', skill_link:'planche', coaching:'Corps rigide.'}]},
      {name:'Mobilite + Recuperation', focus:'mobility', duration:'30-45 min',
       warmup:['Soft mobility 5min'],
       cooldown:['Full body stretch 10min'],
       exercises:[
         {name:'Hip flexor stretch', sets:3, reps:'45s chaque', rest:'30s', skill_link:'pistol_squat', coaching:'Relaxer completement.'},
         {name:'Shoulder circles', sets:3, reps:'20 chaque sens', rest:'30s', skill_link:'handstand', coaching:'Amplitude maximale.'},
         {name:'Wrist mobility complex', sets:3, reps:'2min', rest:'30s', skill_link:'planche', coaching:'Prevention tendinite.'},
         {name:'Bridge walkout', sets:3, reps:'10', rest:'60s', skill_link:'handstand', coaching:'Extension rachis.'},
         {name:'Pancake stretch', sets:3, reps:'60s', rest:'30s', skill_link:'lsit', coaching:'Progresser sur souplesse.'}]}
    ],
    intermediaire: [
      {name:'Push — Developpement', focus:'push', duration:'55-70 min',
       warmup:['Wrist 3min', 'Pike push-up 2x8'],
       cooldown:['Pec stretch 2x30s', 'Wrist decompression 2min'],
       exercises:[
         {name:'Handstand wall', sets:4, reps:'25s', rest:'90s', skill_link:'handstand', coaching:'Corps gaigne.'},
         {name:'Pike HSPU', sets:4, reps:'8', rest:'2min', skill_link:'handstand_free', coaching:'Coudes 45deg.'},
         {name:'Ring push-up', sets:4, reps:'12', rest:'90s', skill_link:'planche', coaching:'Stabilite.'},
         {name:'Tuck planche', sets:4, reps:'8s', rest:'3min', skill_link:'planche', coaching:'Horizontal.'},
         {name:'L-sit barres', sets:4, reps:'12s', rest:'90s', skill_link:'lsit', coaching:'Jambes horizontales.'}]},
      {name:'Pull — Developpement', focus:'pull', duration:'55-70 min',
       warmup:['Dead hang 3x20s', 'Scapular 3x10'],
       cooldown:['Lat stretch 2x30s'],
       exercises:[
         {name:'Pull-up strict', sets:5, reps:'5', rest:'2min', skill_link:'muscle_up', coaching:'Plein amplitude.'},
         {name:'L-sit pull-up', sets:4, reps:'5', rest:'3min', skill_link:'lsit', coaching:'L maintenu.'},
         {name:'Muscle-up negatif', sets:4, reps:'3', rest:'3min', skill_link:'muscle_up', coaching:'5s descente.'},
         {name:'Archer pull-up', sets:3, reps:'4 chaque', rest:'3min', skill_link:'one_arm_pullup', coaching:'Progressif.'},
         {name:'Advanced tuck front lever', sets:4, reps:'8s', rest:'3min', skill_link:'front_lever', coaching:'Dos plat.'}]},
      {name:'Skills — Pratique', focus:'skills', duration:'60-75 min',
       warmup:['Full mobility 10min'],
       cooldown:['Full stretch 10min'],
       exercises:[
         {name:'Freestanding handstand', sets:8, reps:'essais', rest:'30s', skill_link:'handstand', coaching:'10min total.'},
         {name:'Straddle front lever negatif', sets:4, reps:'5', rest:'3min', skill_link:'front_lever', coaching:'Descente controlee.'},
         {name:'Back lever progressions', sets:4, reps:'8-12s', rest:'3min', skill_link:'back_lever', coaching:'Selon etape.'},
         {name:'Skin the cat', sets:4, reps:'5', rest:'2min', skill_link:'back_lever', coaching:'Lent. Controle.'},
         {name:'Human flag intro', sets:3, reps:'5s', rest:'3min', skill_link:'human_flag', coaching:'Tuck dabord.'}]},
      {name:'Jambes — Developpement', focus:'legs', duration:'55-70 min',
       warmup:['Hip mobility 5min', 'Ankle mobility 3min'],
       cooldown:['Hip flexor 2x30s', 'Pigeon 2x30s'],
       exercises:[
         {name:'Pistol squat assisté', sets:4, reps:'5 chaque', rest:'90s', skill_link:'pistol_squat', coaching:'Assistance minimale.'},
         {name:'Nordic hamstring', sets:3, reps:'5', rest:'2min', skill_link:'pistol_squat', coaching:'Excentrique fort.'},
         {name:'Dragon flag', sets:4, reps:'5', rest:'2-3min', skill_link:'dragon_flag', coaching:'Corps planche.'},
         {name:'Copenhagen plank', sets:3, reps:'20s chaque', rest:'90s', skill_link:'human_flag', coaching:'Obliques.'},
         {name:'Box jump', sets:4, reps:'5', rest:'90s', skill_link:'pistol_squat', coaching:'Puissance jambes.'}]},
      {name:'Mobilite + Recuperation Active', focus:'mobility', duration:'35-50 min',
       warmup:['Soft mobility 5min'],
       cooldown:['Full body stretch 10min'],
       exercises:[
         {name:'Pancake stretch', sets:4, reps:'60s', rest:'30s', skill_link:'lsit', coaching:'Compression ischio.'},
         {name:'Bridge walkout', sets:3, reps:'10', rest:'60s', skill_link:'handstand', coaching:'Extension rachis.'},
         {name:'Wrist conditioning', sets:3, reps:'2min', rest:'30s', skill_link:'planche', coaching:'Prevention.'},
         {name:'Hip 90/90 stretch', sets:3, reps:'45s chaque', rest:'30s', skill_link:'pistol_squat', coaching:'Rotation hanche.'},
         {name:'Thoracic rotation', sets:3, reps:'10 chaque', rest:'30s', skill_link:'back_lever', coaching:'Mobilite rachis.'}]}
    ],
    avance: [
      {name:'Push Avance', focus:'push', duration:'65-80 min',
       warmup:['Wrist 5min', 'Shoulder 5min'],
       cooldown:['Wrist decompression 3min', 'Pec 3x30s'],
       exercises:[
         {name:'HSPU strict', sets:5, reps:'6-8', rest:'3min', skill_link:'handstand_free', coaching:'Amplitude complete.'},
         {name:'Adv tuck planche', sets:5, reps:'8-10s', rest:'4min', skill_link:'planche', coaching:'Hanche ouverte.'},
         {name:'Planche push-up', sets:4, reps:'3-5', rest:'5min', skill_link:'planche', coaching:'Force extreme.'},
         {name:'Ring dip weighted +7.5kg', sets:4, reps:'8', rest:'3min', skill_link:'muscle_up_rings', coaching:'Amplitude.'},
         {name:'Maltese lean', sets:4, reps:'15s', rest:'3min', skill_link:'planche', coaching:'Bras ecartes.'}]},
      {name:'Pull Avance', focus:'pull', duration:'65-80 min',
       warmup:['Dead hang 3x30s', 'Scap 3x10'],
       cooldown:['Lat stretch 3x30s', 'Decompression 5min'],
       exercises:[
         {name:'Weighted pull-up +12.5kg', sets:5, reps:'5', rest:'4min', skill_link:'one_arm_pullup', coaching:'Force pure.'},
         {name:'Straddle front lever', sets:5, reps:'6-8s', rest:'4min', skill_link:'front_lever', coaching:'Horizontal.'},
         {name:'Back lever tuck', sets:4, reps:'8s', rest:'3-4min', skill_link:'back_lever', coaching:'Genoux groupes.'},
         {name:'Muscle-up strict', sets:4, reps:'4-5', rest:'4min', skill_link:'muscle_up', coaching:'Strict.'},
         {name:'One-arm dead hang', sets:3, reps:'15s', rest:'2min', skill_link:'one_arm_pullup', coaching:'Tendons.'}]},
      {name:'Skills Avance', focus:'skills', duration:'70-85 min',
       warmup:['Full mobility 10min'],
       cooldown:['Full stretch 10min'],
       exercises:[
         {name:'Freestanding handstand 10min', sets:0, reps:'10min', rest:'libre', skill_link:'handstand_free', coaching:'Pratique.'},
         {name:'Straddle planche', sets:5, reps:'5-8s', rest:'5min', skill_link:'planche', coaching:'Horizontal.'},
         {name:'Human flag tuck', sets:4, reps:'5s', rest:'4min', skill_link:'human_flag', coaching:'Lateral.'},
         {name:'Back lever straddle', sets:4, reps:'6s', rest:'4min', skill_link:'back_lever', coaching:'Corps horizontal.'},
         {name:'Ring muscle-up strict', sets:4, reps:'3-4', rest:'4min', skill_link:'muscle_up_rings', coaching:'Strict.'}]},
      {name:'Jambes Avance', focus:'legs', duration:'60-75 min',
       warmup:['Hip complex 8min'],
       cooldown:['Pancake 3x60s'],
       exercises:[
         {name:'Pistol squat', sets:5, reps:'5 chaque', rest:'2min', skill_link:'pistol_squat', coaching:'Amplitude.'},
         {name:'Dragon flag', sets:5, reps:'6', rest:'3min', skill_link:'dragon_flag', coaching:'Corps planche.'},
         {name:'Human flag progressions', sets:4, reps:'5s', rest:'5min', skill_link:'human_flag', coaching:'Laterale.'},
         {name:'Weighted pistol squat', sets:3, reps:'5 chaque', rest:'3min', skill_link:'pistol_squat', coaching:'Progression.'},
         {name:'Nordic hamstring weighted', sets:3, reps:'5', rest:'3min', skill_link:'pistol_squat', coaching:'Force excentrique.'}]},
      {name:'Mobilite + Recuperation', focus:'mobility', duration:'40-55 min',
       warmup:['Soft mobility 5min'],
       cooldown:['Full body stretch 15min'],
       exercises:[
         {name:'Pancake stretch', sets:4, reps:'60s', rest:'30s', skill_link:'lsit', coaching:'Compression ischio.'},
         {name:'Bridge walkout + leg raise', sets:3, reps:'10', rest:'60s', skill_link:'back_lever', coaching:'Extension.'},
         {name:'Wrist decompression', sets:4, reps:'2min', rest:'30s', skill_link:'planche', coaching:'Recuperation poignets.'},
         {name:'Hip flexor deep stretch', sets:3, reps:'60s chaque', rest:'30s', skill_link:'pistol_squat', coaching:'Detente.'},
         {name:'Thoracic mobility', sets:3, reps:'10 chaque', rest:'30s', skill_link:'back_lever', coaching:'Rachis.'}]}
    ],
    elite: [
      {name:'Push Elite', focus:'push', duration:'80-100 min',
       warmup:['Wrist 8min', 'Shoulder complex 5min'],
       cooldown:['Full decompression 10min'],
       exercises:[
         {name:'Freestanding HSPU', sets:5, reps:'4-6', rest:'5min', skill_link:'handstand_free', coaching:'Elite.'},
         {name:'Straddle ou full planche', sets:5, reps:'5-10s', rest:'5min', skill_link:'planche', coaching:'Horizontal absolu.'},
         {name:'Planche push-up straddle', sets:4, reps:'3-5', rest:'5min', skill_link:'planche', coaching:'Extreme.'},
         {name:'Ring muscle-up strict', sets:5, reps:'4-5', rest:'4min', skill_link:'muscle_up_rings', coaching:'Qualite.'},
         {name:'Handstand walk 10m+', sets:4, reps:'10m', rest:'3min', skill_link:'handstand_free', coaching:'Dynamique.'}]},
      {name:'Pull Elite', focus:'pull', duration:'80-100 min',
       warmup:['Dead hang 3x30s', 'Elbow conditioning 5min'],
       cooldown:['Full decompression 10min'],
       exercises:[
         {name:'OA pull-up attempts', sets:5, reps:'2-3 chaque', rest:'6min', skill_link:'one_arm_pullup', coaching:'Maximal.'},
         {name:'Full front lever', sets:5, reps:'4-6s', rest:'5min', skill_link:'front_lever', coaching:'Horizontal.'},
         {name:'Full back lever', sets:4, reps:'4-6s', rest:'5min', skill_link:'back_lever', coaching:'Controle.'},
         {name:'Weighted pull-up +25kg', sets:4, reps:'3', rest:'5min', skill_link:'one_arm_pullup', coaching:'Force brute.'},
         {name:'Ring OA pull-up assisted', sets:3, reps:'3 chaque', rest:'5min', skill_link:'one_arm_pullup', coaching:'Transition OAP.'}]},
      {name:'Skills Elite', focus:'skills', duration:'80-100 min',
       warmup:['Full mobility 10min'],
       cooldown:['Full decompression 15min'],
       exercises:[
         {name:'Human flag full attempts', sets:5, reps:'3-5s', rest:'5min', skill_link:'human_flag', coaching:'Corps horizontal.'},
         {name:'Manna hold', sets:4, reps:'8-12s', rest:'4min', skill_link:'lsit', coaching:'Haut du L-sit.'},
         {name:'Ring L-sit to V-sit', sets:3, reps:'5', rest:'3min', skill_link:'lsit', coaching:'Transition.'},
         {name:'Handstand pirouette', sets:4, reps:'5 chaque sens', rest:'3min', skill_link:'handstand_free', coaching:'Dynamisme.'},
         {name:'Croix fer (ring cross attempts)', sets:3, reps:'3-5s', rest:'5min', skill_link:'planche', coaching:'Niveau extreme.'}]},
      {name:'Jambes Elite', focus:'legs', duration:'75-90 min',
       warmup:['Hip complex 8min'],
       cooldown:['Full hip complex 10min'],
       exercises:[
         {name:'Pistol squat weighted +15-20kg', sets:5, reps:'5 chaque', rest:'3min', skill_link:'pistol_squat', coaching:'Force jambe.'},
         {name:'Dragon flag weighted +5kg', sets:5, reps:'6', rest:'4min', skill_link:'dragon_flag', coaching:'Extreme.'},
         {name:'Shrimp squat', sets:4, reps:'6 chaque', rest:'2min', skill_link:'pistol_squat', coaching:'ROM complet.'},
         {name:'V-sit 20-30s', sets:4, reps:'20-30s', rest:'3min', skill_link:'lsit', coaching:'Compression.'},
         {name:'Nordic hamstring weighted', sets:3, reps:'5', rest:'3min', skill_link:'pistol_squat', coaching:'Protection ischio.'}]},
      {name:'Mobilite + Recuperation Elite', focus:'mobility', duration:'45-60 min',
       warmup:['Soft mobility 5min'],
       cooldown:['Full body stretch 15min'],
       exercises:[
         {name:'Pancake stretch avance', sets:5, reps:'90s', rest:'30s', skill_link:'lsit', coaching:'Compression maximale.'},
         {name:'Wrist decompression elite', sets:4, reps:'3min', rest:'30s', skill_link:'planche', coaching:'Recuperation.'},
         {name:'Hip complex avance', sets:4, reps:'60s chaque', rest:'30s', skill_link:'pistol_squat', coaching:'Mobilite totale.'},
         {name:'Spine decompression hang', sets:3, reps:'2min', rest:'60s', skill_link:'front_lever', coaching:'Decompression.'},
         {name:'Full body foam roll', sets:1, reps:'15min', rest:'0', skill_link:'', coaching:'Recuperation active.'}]}
    ]
  }
};

// ── PLAN GENERATION ────────────────────────────────────────────────────────

// Adapt sessions based on pullup/pushup count and equipment
function adaptSessionToLevel(session, pullups, pushups, equipment, dips) {
  var adapted = {
    name: session.name,
    focus: session.focus,
    duration: session.duration,
    warmup: session.warmup ? session.warmup.slice() : [],
    cooldown: session.cooldown ? session.cooldown.slice() : [],
    exercises: []
  };
  var safeDips = (typeof dips === 'number' && !isNaN(dips)) ? dips : 0;
  var hasBar = Array.isArray(equipment) && equipment.indexOf('bar') >= 0;
  var hasParallettes = Array.isArray(equipment) && equipment.indexOf('parallettes') >= 0;
  var hasRings = Array.isArray(equipment) && equipment.indexOf('rings') >= 0;
  var floorOnly = Array.isArray(equipment) && equipment.length === 1 && equipment[0] === 'floor_only';

  var exList = session.exercises || [];
  for (var i = 0; i < exList.length; i++) {
    var ex = exList[i];
    // FIX 2026-04-21 : defaults pour éviter undefined en UI si session mal formée
    var adapted_ex = {
      name: ex.name || 'Exercice',
      sets: (ex.sets === 0 || typeof ex.sets === 'number' || typeof ex.sets === 'string') ? ex.sets : 3,
      reps: (ex.reps === 0 || typeof ex.reps === 'number' || typeof ex.reps === 'string') ? ex.reps : '8-10',
      rest: ex.rest || '90s',
      skill_link: ex.skill_link || '',
      coaching: ex.coaching || ''
    };

    // Floor only: replace bar exercises
    if (floorOnly || (!hasBar && !hasRings && !hasParallettes)) {
      if (ex.name.indexOf('pull-up') >= 0 || ex.name.indexOf('Pull-up') >= 0 || ex.name.indexOf('traction') >= 0) {
        adapted_ex.name = 'Ring row (ou table australien)';
        adapted_ex.coaching = 'Corps gaigne. Tirer les coudes vers les hanches. Simulation traction.';
      }
      if (ex.name.indexOf('front lever') >= 0 || ex.name.indexOf('Front lever') >= 0) {
        adapted_ex.name = 'Hollow body + arch hold alternance';
        adapted_ex.coaching = 'Preparation au front lever. 20s creux, 20s arche.';
      }
      if (ex.name.indexOf('Dead hang') >= 0) {
        adapted_ex.name = 'Hollow body hold';
        adapted_ex.coaching = 'Equivalent gainage. Corps en banane inversee.';
      }
    }

    // 0 pullups: replace pull exercises with easier versions
    if (pullups === 0) {
      if (ex.name.indexOf('Pull-up strict') >= 0 || ex.name.indexOf('pull-up strict') >= 0) {
        adapted_ex.name = 'Negative pull-up 5s (ou Australian pull-up)';
        adapted_ex.reps = '5';
        adapted_ex.coaching = 'Monter avec les pieds, descendre 5 secondes. Progresser vers pull-up complet.';
      }
    }

    // High pullup count: enable advanced progressions
    if (pullups >= 15) {
      if (ex.name === 'Negative pull-up 3s') {
        adapted_ex.name = 'Pull-up strict + pause en haut 2s';
        adapted_ex.reps = '8';
        adapted_ex.coaching = 'Pause isometrique en haut. Renforcement superieur.';
      }
    }

    // Low pushups: reduce difficulty
    if (pushups < 5) {
      if (ex.name === 'Push-up' || ex.name === 'Push-up progressif') {
        adapted_ex.name = 'Push-up incline (mains sur chaise ou mur)';
        adapted_ex.reps = '8-10';
        adapted_ex.coaching = 'Mains sureleves reduisent la difficulte. Progresser vers plat.';
      }
    }

    // Dips adaptation: if user can do many dips, add weighted dips option
    if (safeDips >= 15) {
      if (ex.name === 'Dip' || ex.name === 'Dips') {
        adapted_ex.coaching = (adapted_ex.coaching ? adapted_ex.coaching + ' ' : '') + 'Niveau avance detecte (' + safeDips + ' dips): ajouter charge progressive.';
      }
    } else if (safeDips === 0) {
      if (ex.name === 'Dip' || ex.name === 'Dips') {
        adapted_ex.name = 'Dip negatif (descente 5s) ou Bench dip';
        adapted_ex.coaching = 'Demarrer par les negatifs. Monter sur un appui, descendre lentement.';
      }
    }

    adapted.exercises.push(adapted_ex);
  }
  return adapted;
}

// Get periodization phase info for a given week
function getWeekPeriodization(weekNum) {
  var cycleWeek = ((weekNum - 1) % 9) + 1; // 9-week cycle (8 work + 1 deload)
  var isDeload = (cycleWeek === 9);
  var phase, rir, volumeMult;
  if (isDeload) {
    phase = 'Decharge'; rir = '5-6'; volumeMult = 0.6;
  } else if (cycleWeek <= 4) {
    phase = 'Accumulation'; rir = '3-4'; volumeMult = 1.0;
  } else if (cycleWeek <= 7) {
    phase = 'Intensification'; rir = '1-2'; volumeMult = 0.85;
  } else {
    phase = 'Realisation'; rir = '0-1'; volumeMult = 0.75;
  }
  return {
    cycleWeek: cycleWeek,
    isDeload: isDeload,
    phase: phase,
    rir: rir,
    volumeMult: volumeMult,
    focus: isDeload ? 'Decharge — 40% volume reduit. Consolidation.' :
           (cycleWeek <= 4 ? 'Accumulation — volume eleve, RIR ' + rir + '. Construire la capacite.' :
           (cycleWeek <= 7 ? 'Intensification — intensite elevee, RIR ' + rir + '. Forcer les adaptations.' :
           'Realisation — effort maximal, RIR ' + rir + '. Pic de performance.'))
  };
}

// Calculate total weeks based on level
function getTotalWeeks(level) {
  if (level === 'debutant') { return 18; }
  if (level === 'intermediaire') { return 18; }
  if (level === 'avance') { return 27; }
  return 27; // elite
}

// Get overall macro phase label for week within total program
function getMacroPhase(weekNum, totalWeeks) {
  var pct = weekNum / totalWeeks;
  if (pct <= 0.25) { return 'Fondations'; }
  if (pct <= 0.55) { return 'Developpement'; }
  if (pct <= 0.80) { return 'Specifique'; }
  return 'Pic / Test';
}

// Apply deload volume reduction to sessions
function applyDeloadToSessions(sessions, volumeMult) {
  var result = [];
  for (var s = 0; s < sessions.length; s++) {
    var sess = sessions[s];
    var deloaded = {
      name: sess.name + ' (allegee)',
      focus: sess.focus,
      duration: sess.duration,
      warmup: sess.warmup ? sess.warmup.slice() : [],
      cooldown: sess.cooldown ? sess.cooldown.slice() : [],
      exercises: []
    };
    var exCount = sess.exercises ? Math.min(sess.exercises.length, Math.max(2, Math.ceil(sess.exercises.length * volumeMult))) : 0;
    for (var e = 0; e < exCount; e++) {
      var origEx = sess.exercises[e];
      deloaded.exercises.push({
        name: origEx.name,
        sets: Math.max(2, Math.round(origEx.sets * volumeMult)),
        reps: origEx.reps,
        rest: origEx.rest,
        skill_link: origEx.skill_link || '',
        coaching: origEx.coaching || ''
      });
    }
    result.push(deloaded);
  }
  return result;
}

// ── MAIN EXPORT ─────────────────────────────────────────────────────────────

window.generateCalisthenicsPlan = function(level, goals, pullups, pushups, daysPerWeek, equipment, dips, medicalConditions) {
  // Defensive defaults
  var safeLevel = level || 'debutant';
  var safeGoals = Array.isArray(goals) ? goals : [];
  // Medical filter: remove dangerous skills for at-risk profiles
  var _medList = Array.isArray(medicalConditions) ? medicalConditions.map(function(m){ return String(m).toLowerCase(); }) : [];
  if (_medList.length > 0) {
    var _hasHta = _medList.indexOf('hta') !== -1 || _medList.indexOf('hypertension') !== -1 || _medList.indexOf('hta_severe') !== -1;
    var _hasOsteo = _medList.indexOf('osteoporose') !== -1 || _medList.indexOf('osteoporosis') !== -1;
    var _hasPreg = _medList.indexOf('grossesse') !== -1 || _medList.indexOf('pregnant') !== -1;
    var _hasCardio = _medList.indexOf('cardio') !== -1 || _medList.indexOf('insuffisance_card') !== -1;
    safeGoals = safeGoals.filter(function(sk) {
      // Inversions + Valsalva intenses = contre-indiqués HTA/cardio/grossesse
      if ((_hasHta || _hasCardio || _hasPreg) && (sk === 'handstand' || sk === 'handstand_free' || sk === 'muscle_up' || sk === 'muscle_up_rings')) return false;
      // Chutes + charge axiale lombaire = contre-indiqués ostéo/grossesse
      if ((_hasOsteo || _hasPreg) && (sk === 'back_lever' || sk === 'planche' || sk === 'planche_lean')) return false;
      // Isométrique intense + pression intracrânienne = contre-indiqué HTA sévère
      if (_hasHta && (sk === 'back_lever' || sk === 'planche' || sk === 'planche_lean' || sk === 'front_lever')) return false;
      return true;
    });
  }
  var safePullups = (typeof pullups === 'number' && !isNaN(pullups)) ? pullups : 0;
  var safePushups = (typeof pushups === 'number' && !isNaN(pushups)) ? pushups : 0;
  var safeDips = (typeof dips === 'number' && !isNaN(dips)) ? dips : 0;
  var safeDays = (typeof daysPerWeek === 'number' && daysPerWeek >= 2 && daysPerWeek <= 5) ? daysPerWeek : 3;
  var safeEquip = Array.isArray(equipment) && equipment.length > 0 ? equipment : ['bar'];

  // Override level based on pullups/pushups if needed
  if (safePullups === 0 && safeLevel !== 'debutant') {
    // No pullups override is handled at session level, not level override
  }

  // Get session templates for this day count and level
  var dayTemplates = CALISTHENICS_SESSION_TEMPLATES[safeDays];
  if (!dayTemplates) {
    safeDays = 3;
    dayTemplates = CALISTHENICS_SESSION_TEMPLATES[3];
  }
  var levelSessions = dayTemplates[safeLevel];
  if (!levelSessions) {
    levelSessions = dayTemplates['debutant'];
  }

  // Adapt sessions to equipment and fitness level
  var adaptedSessions = [];
  for (var s = 0; s < levelSessions.length; s++) {
    adaptedSessions.push(adaptSessionToLevel(levelSessions[s], safePullups, safePushups, safeEquip, safeDips));
  }

  // Get relevant skill data
  var skillData = [];
  for (var g = 0; g < safeGoals.length; g++) {
    var sk = CALISTHENICS_SKILLS[safeGoals[g]];
    if (sk) {
      skillData.push({
        id: safeGoals[g],
        skill: sk,
        currentStep: estimateSkillStep(safeGoals[g], safeLevel, safePullups, safePushups)
      });
    }
  }

  // Generate weekly plan
  var totalWeeks = getTotalWeeks(safeLevel);
  var plan = [];

  for (var w = 1; w <= totalWeeks; w++) {
    var periodization = getWeekPeriodization(w);
    var macroPhase = getMacroPhase(w, totalWeeks);

    var weekSessions;
    if (periodization.isDeload) {
      weekSessions = applyDeloadToSessions(adaptedSessions, periodization.volumeMult);
    } else {
      weekSessions = adaptedSessions.slice();
    }

    plan.push({
      week: w,
      macroPhase: macroPhase,
      isDeload: periodization.isDeload,
      periodization: periodization,
      focus: periodization.focus,
      sessions: weekSessions,
      skills: skillData
    });
  }

  return {
    level: safeLevel,
    goals: safeGoals,
    pullups: safePullups,
    pushups: safePushups,
    dips: safeDips,
    daysPerWeek: safeDays,
    equipment: safeEquip,
    totalWeeks: totalWeeks,
    skills: skillData,
    plan: plan
  };
};

// ── SKILL STEP ESTIMATOR ─────────────────────────────────────────────────────

function estimateSkillStep(skillId, level, pullups, pushups) {
  // Estimate which progression step user is likely at based on their data
  var baseStep = 1;
  if (level === 'intermediaire') { baseStep = 2; }
  if (level === 'avance') { baseStep = 3; }
  if (level === 'elite') { baseStep = 4; }

  var skill = CALISTHENICS_SKILLS[skillId];
  if (!skill || !skill.progressions) { return 1; }

  // Adjust based on pullups for pull-based skills
  if (skillId === 'muscle_up' || skillId === 'front_lever' || skillId === 'one_arm_pullup') {
    if (pullups >= 20) { baseStep = Math.max(baseStep, 4); }
    else if (pullups >= 15) { baseStep = Math.max(baseStep, 3); }
    else if (pullups >= 8) { baseStep = Math.max(baseStep, 2); }
    else if (pullups === 0) { baseStep = 1; }
  }

  // Adjust based on pushups for push-based skills
  if (skillId === 'handstand' || skillId === 'handstand_free' || skillId === 'planche' || skillId === 'planche_lean') {
    if (pushups >= 30) { baseStep = Math.max(baseStep, 3); }
    else if (pushups >= 20) { baseStep = Math.max(baseStep, 2); }
    else if (pushups < 10) { baseStep = 1; }
  }

  // Clamp to available progressions
  var maxStep = skill.progressions.length;
  return Math.min(Math.max(1, baseStep), maxStep);
}

// ── SKILL DATA ACCESSOR ─────────────────────────────────────────────────────

window.getCalisthenicsSkill = function(skillId) {
  return CALISTHENICS_SKILLS[skillId] || null;
};

window.getAllCalisthenicsSkills = function() {
  return CALISTHENICS_SKILLS;
};
