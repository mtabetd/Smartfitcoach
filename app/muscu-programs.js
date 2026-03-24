// muscu-programs.js — Professional Bodybuilding Programs (NFC-inspired)
(function(){
'use strict';

var NFC_PROGRAMS = {
  pectoraux: {
    masse: {
      warmup: '5 min rameur + rotations \u00e9paules dynamiques',
      exercises: [
        {order:1, name:'D\u00e9velopp\u00e9 couch\u00e9 barre', sets:4, reps:6, rest:'3min', technique:'Compos\u00e9 principal — CNS frais. Prise 81cm, arc contr\u00f4l\u00e9, descente 3s, drive des pieds.', muscle:'pectoraux', type:'compound', equipment:'barre'},
        {order:2, name:'D\u00e9velopp\u00e9 inclin\u00e9 barre (30\u00b0)', sets:4, reps:8, rest:'2min30', technique:'Barre \u00e0 la clavicule, coudes \u00e0 45\u00b0 du tronc — cible le faisceau sup\u00e9rieur. Prise l\u00e9g\u00e8rement plus \u00e9troite que le DC.', muscle:'pectoraux (haut)', type:'compound', equipment:'barre'},
        {order:3, name:'D\u00e9velopp\u00e9 d\u00e9clin\u00e9 barre', sets:3, reps:8, rest:'2min', technique:'Cible le faisceau inf\u00e9rieur (sternal) — indispensable pour le bas pectoral. Prise l\u00e9g\u00e8rement plus large. Attention cervicales.', muscle:'pectoraux (bas)', type:'compound', equipment:'barre'},
        {order:4, name:'D\u00e9velopp\u00e9 inclin\u00e9 halt\u00e8res', sets:3, reps:10, rest:'2min', technique:'3s excentrique — amplitude maximale. Halt\u00e8res se touchent en haut. Stretch profond en bas = recrutement maximal.', muscle:'pectoraux (haut)', type:'compound', equipment:'halteres'},
        {order:5, name:'\u00c9cart\u00e9 poulie haute \u2192 basse (cable crossover)', sets:3, reps:12, rest:'1min30', technique:'3s pic contraction en position basse — tension constante tout le ROM contrairement aux halt\u00e8res. Meilleur isolant pectoral.', muscle:'pectoraux (milieu)', type:'isolation', equipment:'poulie'},
        {order:6, name:'\u00c9cart\u00e9 couch\u00e9 halt\u00e8res', sets:3, reps:12, rest:'1min30', technique:'3s pic contraction — stretch maximal en bas (coudes 160\u00b0 max). Sensez l\u00e9 stretch des pectoraux.', muscle:'pectoraux', type:'isolation', equipment:'halteres'},
        {order:7, name:'Crunch banc d\u00e9clin\u00e9', sets:3, reps:15, rest:'1min', technique:'3s excentrique — abdos contract\u00e9s tout le long. Mains \u00e0 la tempe, pas derri\u00e8re la t\u00eate.', muscle:'abdominaux', type:'isolation', equipment:'banc'}
      ],
      notes: 'Compos\u00e9s d\'abord (CNS frais): DC barre → inclin\u00e9 barre → d\u00e9clin\u00e9 (bas pec!) → inclin\u00e9 halt\u00e8res → isolation. D\u00e9clin\u00e9 = exercise CL\u00c9 pour le bas pectoral souvent n\u00e9glig\u00e9. Cable crossover > \u00e9cart\u00e9 halt\u00e8res (tension continue). Contr\u00f4ler chaque rep.'
    },
    seche: {
      warmup: '5 min rameur + rotations \u00e9paules',
      exercises: [
        {order:1, name:'D\u00e9velopp\u00e9 couch\u00e9 barre', sets:4, reps:10, rest:'1min30', technique:null, muscle:'pectoraux', type:'compound', equipment:'barre'},
        {order:2, name:'D\u00e9velopp\u00e9 inclin\u00e9 barre', sets:4, reps:12, rest:'1min', technique:null, muscle:'pectoraux', type:'compound', equipment:'barre'},
        {order:3, name:'D\u00e9velopp\u00e9 inclin\u00e9 halt\u00e8res', sets:3, reps:12, rest:'1min', technique:'3s pic contraction', muscle:'pectoraux', type:'compound', equipment:'halteres'},
        {order:4, name:'\u00c9cart\u00e9 poulie basse', sets:4, reps:15, rest:'45s', technique:'3s pic contraction', muscle:'pectoraux', type:'isolation', equipment:'poulie'},
        {order:5, name:'\u00c9cart\u00e9 couch\u00e9', sets:4, reps:15, rest:'45s', technique:'3s pic contraction', muscle:'pectoraux', type:'isolation', equipment:'halteres'},
        {order:6, name:'Crunch banc d\u00e9clin\u00e9', sets:4, reps:20, rest:'45s', technique:null, muscle:'abdominaux', type:'isolation', equipment:'banc'}
      ],
      notes: 'Composés d\'abord, repos courts, tempo rapide.'
    }
  },
  dos: {
    masse: {
      warmup: '5 min rameur + mobilit\u00e9 \u00e9paules',
      exercises: [
        {order:1, name:'Traction (lest\u00e9/PDC/assist\u00e9)', sets:4, reps:10, rest:'1min30', technique:null, muscle:'dos', type:'compound', equipment:'barre fixe'},
        {order:2, name:'T-barre (ou rowing barre)', sets:4, reps:8, rest:'2min', technique:null, muscle:'dos', type:'compound', equipment:'barre'},
        {order:3, name:'Tirage vertical prise large', sets:4, reps:10, rest:'2min', technique:'2s excentrique', muscle:'dos', type:'compound', equipment:'poulie'},
        {order:4, name:'Tirage genoux poulie haute', sets:4, reps:10, rest:'1min30', technique:'5s pic contraction x3', muscle:'dos', type:'isolation', equipment:'poulie'},
        {order:5, name:'Rowing halt\u00e8re chaise romaine', sets:5, reps:12, rest:'1min30', technique:null, muscle:'dos', type:'compound', equipment:'halteres'},
        {order:6, name:'Relev\u00e9 de jambes', sets:4, reps:'max', rest:'1min', technique:null, muscle:'abdominaux', type:'isolation', equipment:'barre fixe'}
      ],
      notes: 'Le dos est le plus grand muscle du haut du corps. Intensit\u00e9 maximale.'
    },
    seche: {
      warmup: '5 min rameur + mobilit\u00e9 \u00e9paules',
      exercises: [
        {order:1, name:'Traction PDC', sets:4, reps:12, rest:'1min', technique:null, muscle:'dos', type:'compound', equipment:'barre fixe'},
        {order:2, name:'T-barre', sets:4, reps:12, rest:'1min', technique:null, muscle:'dos', type:'compound', equipment:'barre'},
        {order:3, name:'Tirage vertical prise large', sets:4, reps:12, rest:'1min', technique:'2s excentrique', muscle:'dos', type:'compound', equipment:'poulie'},
        {order:4, name:'Tirage poulie haute', sets:4, reps:15, rest:'45s', technique:'pic contraction', muscle:'dos', type:'isolation', equipment:'poulie'},
        {order:5, name:'Rowing halt\u00e8re', sets:4, reps:15, rest:'45s', technique:null, muscle:'dos', type:'compound', equipment:'halteres'},
        {order:6, name:'Relev\u00e9 de jambes', sets:4, reps:'max', rest:'45s', technique:null, muscle:'abdominaux', type:'isolation', equipment:'barre fixe'}
      ],
      notes: 'Volume \u00e9lev\u00e9, repos courts.'
    }
  },
  bras: {
    masse: {
      warmup: '5 min rameur + rotations poignets',
      exercises: [
        {order:1, name:'Curl barre + Barre au front', sets:4, reps:'10+10', rest:'1min30', technique:'Superset', muscle:'biceps+triceps', type:'superset', equipment:'barre'},
        {order:2, name:'Curl pupitre + DC serr\u00e9', sets:4, reps:'10+10', rest:'1min30', technique:'Superset', muscle:'biceps+triceps', type:'superset', equipment:'barre'},
        {order:3, name:'Curl spider + Dips', sets:4, reps:'10+10', rest:'1min30', technique:'Superset', muscle:'biceps+triceps', type:'superset', equipment:'banc'},
        {order:4, name:'Curl concentr\u00e9 marteau', sets:4, reps:12, rest:'1min30', technique:'12 reps chaque bras', muscle:'biceps', type:'isolation', equipment:'halteres'},
        {order:5, name:'Crunch banc d\u00e9clin\u00e9', sets:4, reps:12, rest:'1min', technique:'3s excentrique', muscle:'abdominaux', type:'isolation', equipment:'banc'},
        {order:6, name:'Relev\u00e9 de jambes', sets:4, reps:'max', rest:'1min', technique:null, muscle:'abdominaux', type:'isolation', equipment:'barre fixe'},
        {order:7, name:'Obliques chaise romaine', sets:4, reps:12, rest:'1min', technique:'12 reps chaque c\u00f4t\u00e9', muscle:'abdominaux', type:'isolation', equipment:'chaise romaine'}
      ],
      notes: 'Supersets biceps/triceps = pump maximal. Agoniste/antagoniste.'
    },
    seche: {
      warmup: '5 min rameur + rotations poignets',
      exercises: [
        {order:1, name:'Curl barre + Barre au front', sets:4, reps:'12+12', rest:'1min', technique:'Superset', muscle:'biceps+triceps', type:'superset', equipment:'barre'},
        {order:2, name:'Curl pupitre + DC serr\u00e9', sets:4, reps:'12+12', rest:'1min', technique:'Superset', muscle:'biceps+triceps', type:'superset', equipment:'barre'},
        {order:3, name:'Curl spider + Dips', sets:4, reps:'12+12', rest:'1min', technique:'Superset', muscle:'biceps+triceps', type:'superset', equipment:'banc'},
        {order:4, name:'Curl marteau', sets:4, reps:15, rest:'45s', technique:null, muscle:'biceps', type:'isolation', equipment:'halteres'},
        {order:5, name:'Crunch', sets:4, reps:20, rest:'45s', technique:null, muscle:'abdominaux', type:'isolation', equipment:'banc'},
        {order:6, name:'Relev\u00e9 de jambes', sets:4, reps:'max', rest:'30s', technique:null, muscle:'abdominaux', type:'isolation', equipment:'barre fixe'},
        {order:7, name:'Obliques', sets:4, reps:15, rest:'30s', technique:null, muscle:'abdominaux', type:'isolation', equipment:'chaise romaine'}
      ],
      notes: 'Supersets + repos courts = cardio int\u00e9gr\u00e9.'
    }
  },
  jambes: {
    masse: {
      warmup: '5 min v\u00e9lo + squats \u00e0 vide + mobilit\u00e9 chevilles',
      exercises: [
        {order:1, name:'Squat barre arri\u00e8re', sets:5, reps:5, rest:'3min', technique:'Le roi des exercices. Profondeur ATG (ass to grass) ou parall\u00e8le minimum. Bracing 360\u00b0, genoux dans l\'axe des orteils. Explosif \u00e0 la remont\u00e9e.', muscle:'quadriceps+fessiers', type:'compound', equipment:'barre'},
        {order:2, name:'Soulevé de terre roumain (RDL)', sets:4, reps:8, rest:'2min30', technique:'3s excentrique — Hanches EN ARRI\u00c8RE (pas genoux), dos NEUTRE. Ressentez le stretch des ischios-jambiers. ABSENT du programme original = erreur critique.', muscle:'ischio-jambiers+fessiers', type:'compound', equipment:'barre'},
        {order:3, name:'Fente bulgare barre', sets:4, reps:8, rest:'2min30', technique:'8 reps chaque jambe. Pied arri\u00e8re sur banc. Genou avant au sol \u00e0 2cm. Torse l\u00e9g\u00e8rement pench\u00e9 = plus de fessiers. Douleur normale dans le psoas.', muscle:'quadriceps+fessiers (unilat\u00e9ral)', type:'compound', equipment:'barre'},
        {order:4, name:'Presse (pieds hauts)', sets:4, reps:12, rest:'2min', technique:'4s excentrique — Pieds EN POSITION HAUTE sur la plateforme = activation ischios+fessiers maximale vs pieds bas (quads only). Genoux ne d\u00e9passent pas les pieds en bas.', muscle:'jambes compl\u00e8tes', type:'compound', equipment:'machine'},
        {order:5, name:'Leg extension (finisseur quads)', sets:3, reps:15, rest:'1min30', technique:'4s excentrique — Pic de contraction 2s en haut. \u00c9viter les charges trop lourdes (contrainte g\u00e9noux). N\u00b0 des sets r\u00e9duit car pr\u00e9c\u00e9d\u00e9 de composés.', muscle:'quadriceps (isolation)', type:'isolation', equipment:'machine'},
        {order:6, name:'Leg curl couch\u00e9', sets:4, reps:12, rest:'1min30', technique:'4s excentrique — Orteils en flexion dorsale = plus d\'activation ischios. Ne pas soul\u00e9ver les hanches. ROM complet = stretch en bas.', muscle:'ischio-jambiers', type:'isolation', equipment:'machine'},
        {order:7, name:'Mollets debout barre ou machine', sets:5, reps:15, rest:'1min', technique:'ROM COMPLET obligatoire: stretch total en bas (talon sous la plateforme), montée maximale sur orteils. Les mollets répondent au volume et au ROM, pas au lourd.', muscle:'mollets (gastrocn\u00e9mien)', type:'isolation', equipment:'machine'}
      ],
      notes: 'JAMBES PRO LEVEL: Squat 5×5 (force + volume) → RDL (ischios hip-hinge = CRUCIAL manquant!) → Bulgare (unilat\u00e9ral = symétrie) → Presse pieds hauts (ischios+fessiers) → Leg extension (finisseur quads) → Leg curl → Mollets (ROM complet). Les ischios sont LE point faible de 90% des pratiquants. RDL = priorité absolue.'
    },
    seche: {
      warmup: '5 min v\u00e9lo + squats \u00e0 vide',
      exercises: [
        {order:1, name:'Squat barre', sets:4, reps:12, rest:'1min30', technique:null, muscle:'quadriceps+fessiers', type:'compound', equipment:'barre'},
        {order:2, name:'Fente bulgare', sets:4, reps:12, rest:'1min30', technique:null, muscle:'quadriceps+fessiers', type:'compound', equipment:'halteres'},
        {order:3, name:'Presse', sets:4, reps:15, rest:'1min', technique:'3s excentrique', muscle:'quadriceps', type:'compound', equipment:'machine'},
        {order:4, name:'Leg extension', sets:4, reps:15, rest:'1min', technique:'3s excentrique', muscle:'quadriceps', type:'isolation', equipment:'machine'},
        {order:5, name:'Leg curl', sets:4, reps:15, rest:'1min', technique:'3s excentrique', muscle:'ischio-jambiers', type:'isolation', equipment:'machine'},
        {order:6, name:'Mollets presse', sets:4, reps:15, rest:'45s', technique:null, muscle:'mollets', type:'isolation', equipment:'machine'}
      ],
      notes: 'Les jambes br\u00fblent le plus de calories. Profitez-en en s\u00e8che.'
    }
  },
  epaules: {
    masse: {
      warmup: '5 min rameur + rotations \u00e9paules + bande \u00e9lastique',
      exercises: [
        {order:1, name:'D\u00e9velopp\u00e9 militaire barre (debout)', sets:4, reps:6, rest:'3min', technique:'Compos\u00e9 principal CNS frais. Debout = gainage total engag\u00e9. Prise l\u00e9g\u00e8rement plus large que les \u00e9paules. Pas d\'arc excessif.', muscle:'\u00e9paules (faisceau ant)', type:'compound', equipment:'barre'},
        {order:2, name:'D\u00e9velopp\u00e9 militaire halt\u00e8res assis', sets:4, reps:8, rest:'2min', technique:'Plus safe que l\'Arnold pour les rotateurs — ROM complet (halt\u00e8res \u00e0 l\u00eooreille). Coudes l\u00e9g\u00e8rement devant le plan frontal. Prise neutre possible.', muscle:'\u00e9paules', type:'compound', equipment:'halteres'},
        {order:3, name:'\u00c9l\u00e9vation lat\u00e9rale c\u00e2ble (unilat\u00e9ral)', sets:4, reps:12, rest:'1min30', technique:'C\u00e2ble = tension CONSTANTE tout le ROM contrairement aux halt\u00e8res. Poignet l\u00e9g\u00e8rement en avant du coude. Coude \u00e0 90\u00b0 max.', muscle:'\u00e9paules (faisceau lat\u00e9ral)', type:'isolation', equipment:'poulie'},
        {order:4, name:'\u00c9l\u00e9vation post\u00e9rieure (oiseau) halt\u00e8res', sets:4, reps:15, rest:'1min', technique:'3s excentrique — Buste pench\u00e9 \u00e0 90\u00b0, coudes l\u00e9g\u00e8rement fl\u00e9chis. CRUCIAL pour look 3D \u00e9paules. Faisceau post = cl\u00e9 de vote de l\u00e9\u00e9quilibre articulaire.', muscle:'\u00e9paules (faisceau post)', type:'isolation', equipment:'halteres'},
        {order:5, name:'Face pull corde (poulie haute)', sets:4, reps:'10+10', rest:'1min30', technique:'Superset avec \u00e9l\u00e9vation frontale. Tirer vers le visage, coudes HAUTS. Rotation externe maximale = protection coiffe des rotateurs.', muscle:'\u00e9paules (post + rotateurs)', type:'superset', equipment:'poulie+halteres'},
        {order:6, name:'Abdos rouleau (ab wheel)', sets:4, reps:12, rest:'1min', technique:'Dos neutre tout le mouvement. Gainage actif. Rentrez le ventre \u00e0 la remonter.', muscle:'abdominaux+transverse', type:'isolation', equipment:'rouleau'},
        {order:7, name:'Relev\u00e9 de jambes suspendu', sets:4, reps:'max', rest:'1min', technique:'Mouvement contr\u00f4l\u00e9 — pas d\'eslan. Montez les jambes \u00e0 90\u00b0 minimum. Descente lente 3s.', muscle:'abdominaux (bas)', type:'isolation', equipment:'barre fixe'}
      ],
      notes: '\u00c9PAULES PRO LEVEL: Militaire debout (force) → militaire halt\u00e8res (volume) → lat\u00e9rales c\u00e2ble (tension continue) → POST\u00c9RIEURES (3D look!) → face pull (protection rotateurs). L\'Arnold press est \u00e9VITE\u00c9 car il cr\u00e9e de l\u00e9impingement sous-acromial sur charges lourdes. Les 3 faisceaux = 3D shoulder. Ne N\u00c9GLIGEZ JAMAIS le faisceau post\u00e9rieur.'
    },
    seche: {
      warmup: '5 min rameur + rotations \u00e9paules',
      exercises: [
        {order:1, name:'D\u00e9velopp\u00e9 militaire halt\u00e8res', sets:4, reps:10, rest:'1min30', technique:null, muscle:'\u00e9paules', type:'compound', equipment:'halteres'},
        {order:2, name:'D\u00e9velopp\u00e9 Arnold', sets:4, reps:12, rest:'1min', technique:null, muscle:'\u00e9paules', type:'compound', equipment:'halteres'},
        {order:3, name:'\u00c9l\u00e9vation frontale + Face pull', sets:4, reps:'12+12', rest:'1min', technique:'Superset', muscle:'\u00e9paules', type:'superset', equipment:'halteres+poulie'},
        {order:4, name:'\u00c9l\u00e9vation lat\u00e9rale', sets:4, reps:15, rest:'45s', technique:'1 moiti\u00e9 + 1 compl\u00e8te', muscle:'\u00e9paules', type:'isolation', equipment:'halteres'},
        {order:5, name:'Shrug barre', sets:4, reps:12, rest:'1min', technique:null, muscle:'trap\u00e8zes', type:'isolation', equipment:'barre'},
        {order:6, name:'Abdos rouleau', sets:4, reps:15, rest:'45s', technique:null, muscle:'abdominaux', type:'isolation', equipment:'rouleau'},
        {order:7, name:'Relev\u00e9 de jambes', sets:4, reps:'max', rest:'30s', technique:null, muscle:'abdominaux', type:'isolation', equipment:'barre fixe'}
      ],
      notes: '\u00c9paules + abdos en s\u00e8che = silhouette sculpt\u00e9e.'
    }
  },
  fessiers_dedied: {
    name: 'Programme Fessiers',
    duration: '~60 min',
    variations: [
      {
        label: 'S\u00e9ance A \u2014 Compound',
        exercises: [
          {order:1, name:'Hip Thrust barre', sets:4, reps:10, rest:'2min', technique:'3s pic contraction', muscle:'fessiers', equipment:'barre+banc'},
          {order:2, name:'Squat sumo', sets:4, reps:12, rest:'1min30', technique:null, muscle:'fessiers+adducteurs', equipment:'barre'},
          {order:3, name:'Romanian Deadlift', sets:4, reps:10, rest:'2min', technique:'3s excentrique', muscle:'fessiers+ischio', equipment:'barre'},
          {order:4, name:'Abduction machine', sets:4, reps:15, rest:'1min', technique:'2s pic contraction', muscle:'fessiers (moyen)', equipment:'machine'}
        ]
      },
      {
        label: 'S\u00e9ance B \u2014 Unilat\u00e9ral',
        exercises: [
          {order:1, name:'Hip Thrust halt\u00e8res', sets:4, reps:12, rest:'1min30', technique:'Pause 1s en haut', muscle:'fessiers', equipment:'halteres+banc'},
          {order:2, name:'Fente arri\u00e8re halt\u00e8res', sets:4, reps:10, rest:'1min30', technique:'10 reps chaque jambe', muscle:'fessiers', equipment:'halteres'},
          {order:3, name:'Good morning barre', sets:3, reps:12, rest:'1min30', technique:'Dos droit, inclinaison 45\u00b0', muscle:'fessiers+ischio', equipment:'barre'},
          {order:4, name:'Donkey kick poulie', sets:4, reps:15, rest:'1min', technique:'15 reps chaque jambe', muscle:'fessiers', equipment:'poulie'}
        ]
      }
    ],
    notes: 'Alternez S\u00e9ance A et S\u00e9ance B \u00e0 chaque entra\u00eenement pour varier les stimuli.'
  },
  abdos_dedied: {
    name: 'Programme Abdominaux',
    duration: '~60 min',
    variations: [
      {
        label: 'S\u00e9ance A \u2014 Grand droit',
        exercises: [
          {order:1, name:'Crunch banc d\u00e9clin\u00e9', sets:4, reps:20, rest:'45s', technique:'3s excentrique', muscle:'grand droit', equipment:'banc'},
          {order:2, name:'Relev\u00e9 de jambes', sets:4, reps:'max', rest:'45s', technique:null, muscle:'grand droit (bas)', equipment:'barre fixe'},
          {order:3, name:'Planche', sets:4, reps:'45s', rest:'30s', technique:'Gainage statique', muscle:'transverse', equipment:'sol'},
          {order:4, name:'Ab wheel', sets:3, reps:12, rest:'1min', technique:'Contr\u00f4le total', muscle:'grand droit+transverse', equipment:'rouleau'}
        ]
      },
      {
        label: 'S\u00e9ance B \u2014 Obliques',
        exercises: [
          {order:1, name:'Russian twist', sets:4, reps:20, rest:'30s', technique:'Avec m\u00e9decine ball', muscle:'obliques', equipment:'medecine ball'},
          {order:2, name:'Obliques chaise romaine', sets:4, reps:12, rest:'45s', technique:'12 reps chaque c\u00f4t\u00e9', muscle:'obliques', equipment:'chaise romaine'},
          {order:3, name:'Planche lat\u00e9rale', sets:3, reps:'30s', rest:'30s', technique:'Chaque c\u00f4t\u00e9', muscle:'obliques+transverse', equipment:'sol'},
          {order:4, name:'Crunch cable', sets:4, reps:15, rest:'45s', technique:'Flex complète du tronc', muscle:'grand droit', equipment:'poulie'}
        ]
      }
    ],
    notes: 'Les abdos se r\u00e9v\u00e8lent avec un bon taux de masse grasse. Mais il faut les construire aussi !'
  },
  biceps_dedied: {
    name: 'Programme Biceps',
    duration: '~55 min',
    variations: [
      {
        label: 'S\u00e9ance A \u2014 Force',
        exercises: [
          {order:1, name:'Curl barre droite', sets:4, reps:8, rest:'2min', technique:null, muscle:'biceps', equipment:'barre'},
          {order:2, name:'Curl pupitre', sets:4, reps:10, rest:'1min30', technique:'3s excentrique', muscle:'biceps (chef court)', equipment:'pupitre'},
          {order:3, name:'Curl marteau', sets:4, reps:10, rest:'1min30', technique:null, muscle:'brachial', equipment:'halteres'}
        ]
      },
      {
        label: 'S\u00e9ance B \u2014 Isolation',
        exercises: [
          {order:1, name:'Curl inclin\u00e9 halt\u00e8res', sets:4, reps:12, rest:'1min30', technique:'Banc 45\u00b0, stretch max', muscle:'biceps (chef long)', equipment:'halteres+banc'},
          {order:2, name:'Curl concentr\u00e9', sets:4, reps:12, rest:'1min', technique:'3s pic contraction', muscle:'biceps (pic)', equipment:'halteres'},
          {order:3, name:'Curl barre EZ prise serr\u00e9e', sets:3, reps:12, rest:'1min', technique:'Contr\u00f4ler la descente', muscle:'biceps (chef court)', equipment:'barre EZ'}
        ]
      }
    ],
    notes: 'Variez les angles pour recruter tous les chefs du biceps.'
  },
  triceps_dedied: {
    name: 'Programme Triceps',
    duration: '~55 min',
    variations: [
      {
        label: 'S\u00e9ance A \u2014 Force',
        exercises: [
          {order:1, name:'D\u00e9velopp\u00e9 couch\u00e9 prise serr\u00e9e', sets:4, reps:8, rest:'2min', technique:'Prise \u00e0 largeur d\u00e9\u00e9paules. Barbell descend vers le bas de la poitrine. Coudes proche du corps = triceps maximum.', muscle:'triceps', equipment:'barre'},
          {order:2, name:'Barre au front (skull crushers EZ)', sets:4, reps:10, rest:'1min30', technique:'Descendre vers le front OU derri\u00e8re la t\u00eate (chef long). Coudes fixes. 2s excentrique.', muscle:'triceps (chef long)', equipment:'barre EZ'},
          {order:3, name:'Dips (lest\u00e9 si possible)', sets:4, reps:10, rest:'1min30', technique:'Corps droit (pas pench\u00e9 en avant). Coudes derri\u00e8re = triceps pur. Lest\u00e9 = progressive overload.', muscle:'triceps', equipment:'barres'}
        ]
      },
      {
        label: 'S\u00e9ance B \u2014 Isolation',
        exercises: [
          {order:1, name:'Extension poulie haute (corde)', sets:4, reps:12, rest:'1min', technique:'3s pic contraction en bas — \u00e9cartez la corde en bas pour maximiser l\'extension. Tension constante gr\u00e2ce \u00e0 la poulie.', muscle:'triceps', equipment:'poulie'},
          {order:2, name:'Kickback halt\u00e8re', sets:4, reps:12, rest:'1min', technique:'2s pic contraction — bras parall\u00e8le au sol en extension. Coude fix\u00e9 contre le tronc. Mouvement de l\u00e9avant-bras seulement.', muscle:'triceps', equipment:'halteres'},
          {order:3, name:'Extension nuque halt\u00e8re (overhead triceps)', sets:4, reps:12, rest:'1min30', technique:'Coudes fix\u00e9s pr\u00e8s des oreilles — stretch maximal du chef long. Meilleur exercice pour \u00e9paisseur du chef long.', muscle:'triceps (chef long)', equipment:'halteres'}
        ]
      }
    ],
    notes: 'Les triceps = 2/3 du volume du bras. La d\u00e9finition du bras vient surtout des triceps, pas des biceps !'
  }
};

// ─── PHASES FORCE par groupe musculaire (Mr. Olympia prep — 3-5 reps, 85-93% 1RM) ───
// Phillips & Van Loon 2011: Force maximale sur composés = base de tout gain d'hypertrophie durable
// La phase FORCE est manquante dans 90% des programmes de salle. ERREUR CRITIQUE.
var NFC_PROGRAMS_FORCE = {
  pectoraux: {
    force: {
      warmup: 'Activation: 3\u00d715 Face pull \u00e9lastique + 3\u00d710 Band pull-apart + 2 sets \u00e9chauffement bench progressif @50%, @70%, @85%',
      exercises: [
        {order:1, name:'D\u00e9velopp\u00e9 couch\u00e9 barre', sets:5, reps:3, rest:'4min', technique:'@87-93% 1RM — Prise 81cm, arc contr\u00f4l\u00e9, scapulae r\u00e9tract\u00e9es, descente 3s jusqu\'au sternum, drive explosif des pieds. C\'est un mouvement de TOUT LE CORPS.', muscle:'pectoraux', type:'compound', equipment:'barre', rirTarget:1},
        {order:2, name:'D\u00e9velopp\u00e9 inclin\u00e9 barre (30\u00b0)', sets:4, reps:4, rest:'3min30', technique:'@80-85% 1RM — Barre \u00e0 la clavicule. Coudes 45\u00b0 du tronc. Scapulae r\u00e9tract\u00e9es sur le banc. Cible le faisceau claviculaire.', muscle:'pectoraux (haut)', type:'compound', equipment:'barre', rirTarget:2},
        {order:3, name:'D\u00e9velopp\u00e9 d\u00e9clin\u00e9 barre', sets:3, reps:5, rest:'3min', technique:'@78-83% 1RM — Faisceau inf\u00e9rieur (sternal bas). Prise 2cm plus large. Descente vers le bas de la poitrine. \u00c0 ne JAMAIS n\u00e9gliger.', muscle:'pectoraux (bas)', type:'compound', equipment:'barre', rirTarget:2},
        {order:4, name:'Dips (lest\u00e9)', sets:3, reps:6, rest:'2min30', technique:'Corps l\u00e9g\u00e8rement pench\u00e9 en avant pour cibler le bas pectoral. Lest = progressive overload. Stretch profond en bas.', muscle:'pectoraux (bas)', type:'compound', equipment:'barres', rirTarget:2},
        {order:5, name:'\u00c9cart\u00e9 poulie crois\u00e9e (cable crossover)', sets:3, reps:12, rest:'1min30', technique:'3s pic contraction en bas — Tension constante = impossible avec halt\u00e8res. Finisseur pump.', muscle:'pectoraux', type:'isolation', equipment:'poulie', rirTarget:3}
      ],
      notes: '\u26a1 PHASE FORCE PECTORAUX: 5\u00d73 bench = fondation de TOUS les gains pectoraux. Notez vos charges chaque s\u00e9ance. Double progression: reps d\'abord (3\u21923), puis charge (+2.5kg). 4min repos = non-n\u00e9gociable pour le CNS. Programme Dorian Yates + Ronnie Coleman = toujours bas\u00e9 sur force brute d\'abord.'
    }
  },
  dos: {
    force: {
      warmup: 'Activation: 3\u00d710 Face pull + 3\u00d710 Band pull-apart + 2 sets soulev\u00e9 progressif @50%, @70%',
      exercises: [
        {order:1, name:'Soulev\u00e9 de terre conventionnel', sets:4, reps:4, rest:'4min30', technique:'@85-90% 1RM — LA reine des exercises. Barre au-dessus du milieu du pied, dos neutre, hanches bas\u00e9es en avant du soulev\u00e9. Drive le sol. Gainage f\u00e9roce.', muscle:'dos+ischio-jambiers+fessiers', type:'compound', equipment:'barre', rirTarget:1},
        {order:2, name:'Traction lest\u00e9e (dead hang)', sets:4, reps:5, rest:'3min30', technique:'@85% 1RM estimé — Scapulae d\u00e9prim\u00e9es en bas (init), r\u00e9tract\u00e9es en haut. Dead hang = ROM complet. Prise propre pronation.', muscle:'dos (grand dorsal)', type:'compound', equipment:'barre fixe', rirTarget:1},
        {order:3, name:'Rowing barre prise pronation', sets:4, reps:5, rest:'3min', technique:'@80-85% 1RM — Dos parall\u00e8le au sol (30\u00b0). Tirer vers le nombril. \u00c9viter le balancement. Retraction scapulaire \u00e0 la contraction.', muscle:'dos (trapèzes moy, rhomboïdes)', type:'compound', equipment:'barre', rirTarget:2},
        {order:4, name:'Soulevé de terre en déficit (5cm)', sets:3, reps:5, rest:'3min', technique:'@75% 1RM — Plaques de 5cm sous les pieds. ROM augment\u00e9 = stretch lombaires + ischios + ischio plus grand.', muscle:'dos+jambes', type:'compound', equipment:'barre', rirTarget:2},
        {order:5, name:'Tirage vertical prise neutre', sets:3, reps:8, rest:'2min', technique:'2s excentrique — Prise neutre = moins biceps, plus dorsal. Tirer les coudes VERS LE BAS (pas en arri\u00e8re). Finisseur technique.', muscle:'dos (grand dorsal)', type:'compound', equipment:'poulie', rirTarget:3}
      ],
      notes: '\u26a1 PHASE FORCE DOS: Soulev\u00e9 de terre en 1er (CNS frais). Dorian Yates: \'Le dos se construit avec le soulev\u00e9 de terre. Point.\' Ronnie Coleman: 800lb deadlift. Phil Heath: tractions lest\u00e9es. La force de traction = la masse dorsale. Tracking charges OBLIGATOIRE.'
    }
  },
  jambes: {
    force: {
      warmup: 'Activation: 3\u00d715 Hip thrust PDC + 3\u00d710 Leg swing + 2 sets squat progressif @50%, @70%, @80%',
      exercises: [
        {order:1, name:'Squat barre arri\u00e8re (high bar)', sets:5, reps:3, rest:'4min', technique:'@87-93% 1RM — ATG si mobilit\u00e9 permet, parall\u00e8le minimum. Bracing 360\u00b0 (Valsalva maneuver). Genoux dans l\'axe. Drive du sol EXPLOSIF. C\'est ici que se cr\u00e9ent les cuisses des champions.', muscle:'quadriceps+fessiers+ischio', type:'compound', equipment:'barre', rirTarget:1},
        {order:2, name:'Soulev\u00e9 de terre roumain (RDL)', sets:4, reps:5, rest:'3min30', technique:'@75-80% 1RM — Hanches EN ARRI\u00c8RE (hip hinge pur), dos neutre, barre glisse le long des jambes. Stretch ischios = brutal et n\u00e9cessaire.', muscle:'ischio-jambiers+fessiers', type:'compound', equipment:'barre', rirTarget:2},
        {order:3, name:'Fente bulgare barre (forc\u00e9)', sets:3, reps:5, rest:'3min', technique:'@70-75% 1RM — 5 reps chaque jambe (sans pause). Pied arri\u00e8re sur banc haut. Genou avant 1cm du sol. Force et symétrie = priorités.', muscle:'quadriceps+fessiers (unilat\u00e9ral)', type:'compound', equipment:'barre', rirTarget:2},
        {order:4, name:'Good Morning barre', sets:3, reps:8, rest:'2min30', technique:'@50-60% du squat max — Dos neutre, hanches en arri\u00e8re, l\u00e9ger fl\u00e9chissement des genoux. Force ischio en \u00e9tirement = pattern DL. Ronnie Coleman jurait dessus.', muscle:'ischio-jambiers+bas du dos', type:'compound', equipment:'barre', rirTarget:2},
        {order:5, name:'Leg press (pieds hauts, charge maximale)', sets:4, reps:8, rest:'2min30', technique:'Pieds hauts sur la plateforme. Charges tr\u00e8s lourdes possibles (sécurité genoux assur\u00e9e par la machine). Tom Platz: 13 reps @500kg \u2014 c\'est ce niveau de jambes qui gagne.', muscle:'jambes compl\u00e8tes', type:'compound', equipment:'machine', rirTarget:2}
      ],
      notes: '\u26a1 PHASE FORCE JAMBES: Squat = trone, tout le reste est une branche. Tom Platz avait les meilleures jambes de l\'histoire parce qu\'il squattait 500kg+ pour des reps. Les jambes sont le groupe le plus dur \u00e0 d\u00e9velopper. La phase force BRISE les plafonds. Courage oblig\u00e9.'
    }
  },
  epaules: {
    force: {
      warmup: 'Activation: 3\u00d715 Face pull + 3\u00d715 Band pull-apart + 3\u00d710 YTW \u00e9lastique + 2 sets militaire @50%, @70%',
      exercises: [
        {order:1, name:'D\u00e9velopp\u00e9 militaire barre (debout)', sets:5, reps:3, rest:'4min', technique:'@87-93% 1RM — Debout = gainage total engag\u00e9. Prise l\u00e9g\u00e8rement plus large que les \u00e9paules. Pas de trop grande extension lombaire. Press explosif — stabilisateurs = travaillés. Arnold pressait debout toujours.', muscle:'\u00e9paules (faisceau ant\u00e9rieur)', type:'compound', equipment:'barre', rirTarget:1},
        {order:2, name:'Développé militaire haltères assis', sets:4, reps:5, rest:'3min30', technique:'@75-80% 1RM — ROM complet (halt\u00e8res \u00e0 la hauteur des oreilles en bas). Coudes l\u00e9g\u00e8rement devant le plan frontal = pr\u00e9serve les rotateurs.', muscle:'\u00e9paules (3 faisceaux)', type:'compound', equipment:'halteres', rirTarget:2},
        {order:3, name:'Développé derrière la nuque (barre légère)', sets:3, reps:6, rest:'3min', technique:'@65-70% 1RM — UNIQUEMENT si mobilit\u00e9 \u00e9paules parfaite. Cible le faisceau lat\u00e9ral directement. Douleur = arr\u00eatez.', muscle:'\u00e9paules (faisceau lat + post)', type:'compound', equipment:'barre', rirTarget:2},
        {order:4, name:'\u00c9l\u00e9vation lat\u00e9rale c\u00e2ble lourd (unilatéral)', sets:4, reps:10, rest:'2min', technique:'Tension maximale du d\u00e9but \u00e0 la fin. C\u00e2ble via le bas du corps. Lee Haney: \'le d\u00e9lto\u00efde lat\u00e9ral est ce qui cr\u00e9e la largeur que tout le monde veut\'.', muscle:'\u00e9paules (faisceau lat\u00e9ral)', type:'isolation', equipment:'poulie', rirTarget:2},
        {order:5, name:'Face pull corde + \u00e9l\u00e9vation post\u00e9rieure', sets:4, reps:'10+12', rest:'1min30', technique:'Superset — Face pull corde lourde (rotation externe) puis Oiseau halt\u00e8res. Protège les rotateurs ET construit le 3D shoulder. Jamais saut\u00e9.', muscle:'\u00e9paules (post + rotateurs)', type:'superset', equipment:'poulie+halteres', rirTarget:3}
      ],
      notes: '\u26a1 PHASE FORCE \u00c9PAULES: Militaire debout = test de force totale du corps. Frank Zane, Lee Haney, Arnold = tous basaient leurs \u00e9paules sur le militaire lourd. Le 3D shoulder = faisceau lat\u00e9ral + POST\u00c9RIEUR bien développés. Ne jamais blesser les rotateurs = carri\u00e8re courte.'
    }
  },
  bras: {
    force: {
      warmup: 'Activation: 3\u00d710 Band curl + 3\u00d710 Band tricep pushdown + mobilit\u00e9 coudes 3min',
      exercises: [
        {order:1, name:'Curl barre droite (lourd)', sets:4, reps:5, rest:'3min', technique:'@80% 1RM — Pas de balancement. Coudes fixes. Supination compl\u00e8te au sommet. Descente 3s excentrique. Larry Scott (1er Mr Olympia) = curl barre lourd toujours.', muscle:'biceps', type:'compound', equipment:'barre', rirTarget:1},
        {order:2, name:'D\u00e9velopp\u00e9 couch\u00e9 prise serr\u00e9e (lourd)', sets:4, reps:5, rest:'3min', technique:'@80% 1RM — Prise \u00e0 largeur d\u00e9\u00e9paules. Coudes proches du corps. Chef long + chef lat\u00e9ral triceps = 2/3 du bras.', muscle:'triceps', type:'compound', equipment:'barre', rirTarget:1},
        {order:3, name:'Curl pupitre (chef court)', sets:4, reps:6, rest:'2min30', technique:'@75% 1RM — Peak contraction 2s. 3s excentrique. Isolation pure. Le secret du biceps piqué.', muscle:'biceps (chef court)', type:'isolation', equipment:'pupitre', rirTarget:2},
        {order:4, name:'Barre au front (skull crushers) + DC serr\u00e9', sets:4, reps:'6+6', rest:'2min30', technique:'Superset lourd — Skull crushers @70% puis transition imm\u00e9diate en DC serr\u00e9 (m\u00eame barre). Technique Dorian Yates.', muscle:'triceps', type:'superset', equipment:'barre EZ', rirTarget:2},
        {order:5, name:'Curl incliné haltères (chef long)', sets:3, reps:8, rest:'2min', technique:'Banc \u00e0 45\u00b0 = stretch du chef long maximal. Halt\u00e8res pendent derri\u00e8re le banc en bas. Rotation supination compl\u00e8te en haut.', muscle:'biceps (chef long)', type:'isolation', equipment:'halteres+banc', rirTarget:3}
      ],
      notes: '\u26a1 PHASE FORCE BRAS: Les bras ne grossissent pas sans force de base sur composés. Curl barre lourd + DC serr\u00e9 lourd = fondation. L\'isolation seule = plafond rapide. Sergio Oliva, Arnold, Ronnie = tous soulevaient lourd sur curl barre.'
    }
  }
};

// ─── VOLUME LANDMARKS (Schoenfeld, RP Hypertrophy — sets/semaine par muscle) ───
var VOLUME_LANDMARKS = {
  chest:     {mev:6,  mav:16, mrv:22, label:'Poitrine'},
  back:      {mev:8,  mav:16, mrv:25, label:'Dos'},
  shoulders: {mev:6,  mav:14, mrv:20, label:'Épaules'},
  legs:      {mev:8,  mav:18, mrv:28, label:'Jambes'},
  glutes:    {mev:4,  mav:12, mrv:20, label:'Fessiers'},
  biceps:    {mev:6,  mav:12, mrv:20, label:'Biceps'},
  triceps:   {mev:6,  mav:14, mrv:20, label:'Triceps'},
  abs:       {mev:4,  mav:10, mrv:16, label:'Abdominaux'}
};
window.VOLUME_LANDMARKS = VOLUME_LANDMARKS;

// ─── MÉSOCYCLE 4 SEMAINES — Périodisation RIR (Israetel/RP Hypertrophy) ───
// S1: Accumulation légère (RIR 3) → S2: Volume base (RIR 2) → S3: Surcharge (RIR 1) → S4: Déload (-45%)
// Chaque cycle = +3-5% de charge sur les composés principaux (progressive overload scientifique)
var MESOCYCLE_WEEKS = [
  {
    week: 1, name: 'Accumulation S1', rirTarget: 3, setsMultiplier: 0.85, intensity: 'Mod\u00e9r\u00e9e',
    desc: 'Apprentissage des patterns moteurs. 3 reps en r\u00e9serve = qualit\u00e9 technique maximale. Charges \u00e0 ~75-78% 1RM.'
  },
  {
    week: 2, name: 'Accumulation S2', rirTarget: 2, setsMultiplier: 1.0, intensity: 'Mod\u00e9r\u00e9e-Haute',
    desc: 'Volume de base. 2 reps en r\u00e9serve = effort soutenu. Charges \u00e0 ~80-83% 1RM. Augmenter 2.5kg vs S1.'
  },
  {
    week: 3, name: 'Surcharge S3', rirTarget: 1, setsMultiplier: 1.15, intensity: 'Haute',
    desc: 'Surcharge progressive. 1 rep en r\u00e9serve = quasi-\u00e9chec. Volume maximal du cycle. Charges \u00e0 ~85-88% 1RM.'
  },
  {
    week: 4, name: 'D\u00e9load S4', rirTarget: 4, setsMultiplier: 0.55, intensity: 'L\u00e9g\u00e8re', isDeload: true,
    desc: 'R\u00e9cup\u00e9ration CNS + articulaire. Volume -45%. Charges \u00e0 ~60-65% 1RM. Super-compensation = gains APRÈS le d\u00e9load.'
  }
];
window.MESOCYCLE_WEEKS = MESOCYCLE_WEEKS;

// ─── TECHNIQUES AVANCÉES D'HYPERTROPHIE ───
// Mr. Olympia toolkit — ne pas utiliser avant 6 mois de base solide
var ADVANCED_TECHNIQUES_DB = {
  drop_set: {
    name: 'Drop Set',
    ref: 'Fink et al. 2018 — +35% dommages musculaires vs série classique',
    desc: 'Apr\u00e8s l\u00e9chec musculaire, r\u00e9duire la charge de 20-25% et continuer imm\u00e9diatement. 2-3 drops max. Finisseur ultime.',
    example: 'Curl halt\u00e8res 12kg \u00e0 l\u00e9chec → drop 10kg \u00e0 l\u00e9chec → drop 8kg \u00e0 l\u00e9chec',
    frequency: '1-2x/muscle/semaine max (CNS intensif)',
    bestFor: ['biceps', 'triceps', '\u00e9paules (lat\u00e9rales)']
  },
  rest_pause: {
    name: 'Rest-Pause (Dorian Yates)',
    ref: 'Dorian Yates — 6x Mr. Olympia. Technique signature Heavy Duty',
    desc: '1 s\u00e9rie \u00e0 l\u00e9chec, pause 15-20s, continuer jusqu\u00e0 l\u00e9chec x2. Triple l\u00e9amplitude de recrutement.',
    example: 'Rowing barre 10 reps \u00e0 l\u00e9chec | 15s | 4-5 reps | 15s | 2-3 reps',
    frequency: '1-2x/muscle/semaine max',
    bestFor: ['dos', 'pectoraux', 'jambes (leg press)']
  },
  myo_reps: {
    name: 'Myo-Reps (Borge Fagerli)',
    ref: 'Fagerli 2010 — Maximiser les reps en zone de stimulation efficace (proche-\u00e9chec)',
    desc: 'S\u00e9rie d\u00e9activation 12-15 reps \u00e0 RIR 1, puis mini-s\u00e9ries de 3-5 reps avec 20s de repos x4-5.',
    example: '15 reps RIR 1 | 20s | 5 reps | 20s | 5 reps | 20s | 5 reps | 20s | 4 reps',
    frequency: '1 exercice/s\u00e9ance max',
    bestFor: ['pectoraux (écart\u00e9)', '\u00e9paules (lat\u00e9rales)', 'mollets']
  },
  mechanical_drop: {
    name: 'Mechanical Drop Set',
    ref: 'Principe m\u00e9canique — changer angle/prise pour continuer malgr\u00e9 la fatigue locale',
    desc: '\u00c0 l\u00e9chec sur une position difficile, passer \u00e0 une position m\u00e9caniquement plus favorable (sans changer charge).',
    example: 'Curl inclin\u00e9 \u00e0 l\u00e9chec → passer en curl debout → passer en curl concentr\u00e9',
    frequency: '1-2x/s\u00e9ance',
    bestFor: ['biceps', 'triceps', 'pectoraux']
  },
  pre_exhaustion: {
    name: 'Pr\u00e9-Exhaustion (M\u00e9thode Arnold)',
    ref: 'Arnold Schwarzenegger — The New Encyclopedia of Modern Bodybuilding',
    desc: 'Fatiguer le muscle cible avec un isolant AVANT le compos\u00e9. Force le muscle principal \u00e0 travailler malgr\u00e9 les synergistes frais.',
    example: 'Pectoraux: \u00c9cart\u00e9 4×12 → imm\u00e9diatement D\u00e9velopp\u00e9 couch\u00e9 (pecs d\u00e9j\u00e0 fatigu\u00e9s, triceps encore frais)',
    frequency: '1x/s\u00e9ance pour le muscle prioritaire',
    bestFor: ['pectoraux', 'dos (grand dorsal)', '\u00e9paules']
  },
  twenty_ones: {
    name: '21s (7+7+7 — Time Under Tension)',
    ref: 'Arnold Schwarzenegger — technique classique pump + recrutement total',
    desc: '7 reps demi-ROM bas + 7 reps demi-ROM haut + 7 reps ROM complet = 21 reps TUT maximal.',
    example: 'Curl barre: 7× (0\u00b0\u219290\u00b0) + 7× (90\u00b0\u2192haut) + 7× ROM complet',
    frequency: '1 exercice/s\u00e9ance en finisseur',
    bestFor: ['biceps', 'triceps', 'mollets']
  },
  giant_set: {
    name: 'Giant Set (4+ exercices enchaîn\u00e9s)',
    ref: 'Arnold routine — densit\u00e9 d\u00e9entra\u00eenement maximale pour d\u00e9finition + volume',
    desc: '4 exercices pour le m\u00eame muscle ou groupe antagoniste, sans repos entre les exercices. 2-3min entre les r\u00e9p\u00e9titions de giant sets.',
    example: '\u00c9paules: Militaire + Lat\u00e9rales + Frontales + Oiseau (4 exercices, 0s repos entre)',
    frequency: '1 giant set de 3-4 rounds en fin de s\u00e9ance',
    bestFor: ['\u00e9paules (3 faisceaux)', 'bras (biceps+triceps)', 'jambes (pump final)']
  }
};
window.ADVANCED_TECHNIQUES_DB = ADVANCED_TECHNIQUES_DB;
window.NFC_PROGRAMS_FORCE = NFC_PROGRAMS_FORCE;

var WEEKLY_SPLITS = {
  3: {name:'Full Body 3j', days:[{day:'Lundi',muscles:['pectoraux','dos'],label:'Haut du corps A'},{day:'Mercredi',muscles:['jambes','epaules'],label:'Bas + \u00c9paules'},{day:'Vendredi',muscles:['bras','abdos_dedied'],label:'Bras + Abdos'}]},
  4: {name:'Heavy Duty 4j (Dorian Yates)', days:[{day:'Lundi',muscles:['pectoraux','bras'],label:'Push — Pecs + Biceps'},{day:'Mardi',muscles:['jambes'],label:'Legs — Jambes compl\u00e8tes'},{day:'Jeudi',muscles:['epaules','bras'],label:'\u00c9paules + Triceps'},{day:'Vendredi',muscles:['dos'],label:'Pull — Dos + Ischios (Deadlift day)'}], notes:'Repos mercredi, samedi, dimanche. Chaque muscle 1x/semaine avec intensit\u00e9 MAXIMALE (Dorian Yates Heavy Duty). D\u00e9ficit CNS entre les s\u00e9ances. Qualit\u00e9 > quantit\u00e9.'},
  5: {name:'Split 5j (Pro)', days:[{day:'Lundi',muscles:['pectoraux'],label:'Pectoraux'},{day:'Mardi',muscles:['dos'],label:'Dos'},{day:'Jeudi',muscles:['bras'],label:'Bras'},{day:'Vendredi',muscles:['jambes'],label:'Jambes'},{day:'Samedi',muscles:['epaules'],label:'\u00c9paules'}], notes:'Repos mercredi et dimanche. Espacer pectoraux et \u00e9paules de 48h min.'},
  6: {name:'PPL 6j', days:[{day:'Lundi',muscles:['pectoraux'],label:'Push: Pecs'},{day:'Mardi',muscles:['dos'],label:'Pull: Dos'},{day:'Mercredi',muscles:['jambes'],label:'Legs'},{day:'Jeudi',muscles:['epaules'],label:'Push: \u00c9paules'},{day:'Vendredi',muscles:['dos'],label:'Pull: Dos+Bras'},{day:'Samedi',muscles:['jambes','fessiers_dedied'],label:'Legs+Fessiers'}]}
};

function getPersonalizedProgram(muscleGroup, userProfile) {
  var S = userProfile || window.S || {};
  var goalKey = 'masse';
  if (S.sportGoals) {
    if (S.sportGoals.indexOf('shred') !== -1 || S.sportGoals.indexOf('weightloss') !== -1) goalKey = 'seche';
    if (S.sportGoals.indexOf('strength') !== -1 || S.sportGoals.indexOf('force') !== -1) goalKey = 'force';
  }

  // Phase FORCE → utilise NFC_PROGRAMS_FORCE dédié
  if (goalKey === 'force') {
    var forceEntry = NFC_PROGRAMS_FORCE[muscleGroup];
    if (forceEntry && forceEntry.force) {
      var forceResult = JSON.parse(JSON.stringify(forceEntry.force));
      if (!forceResult.exercises) forceResult.exercises = [];
      if (S.sportLevel === 'beginner') {
        forceResult.exercises = forceResult.exercises.slice(0, 4);
        forceResult.exercises.forEach(function(ex) { if (typeof ex.sets === 'number') ex.sets = Math.max(2, ex.sets - 1); });
        forceResult.notes = (forceResult.notes || '') + ' \u26a0\ufe0f D\u00e9butant: Phase force d\u00e9conseill\u00e9e avant 6 mois de pratique. Technique PRIORITAIRE.';
      }
      return forceResult;
    }
    goalKey = 'masse'; // fallback si pas de phase force pour ce groupe
  }

  var program = NFC_PROGRAMS[muscleGroup];
  if (!program) return null;
  if (program.exercises) return JSON.parse(JSON.stringify(program));
  var template = program[goalKey] || program.masse;
  if (!template) return null;
  var result = JSON.parse(JSON.stringify(template));
  if (!result.exercises) result.exercises = [];
  if (S.sex === 'femme') {
    result.exercises.forEach(function(ex) {
      if (ex.type === 'compound' && goalKey === 'masse' && typeof ex.reps === 'number') ex.reps = Math.min(ex.reps + 2, 15);
    });
  }
  if (S.sportLevel === 'beginner') {
    result.exercises = result.exercises.slice(0, 5);
    result.exercises.forEach(function(ex) { if (typeof ex.sets === 'number') ex.sets = Math.max(2, ex.sets - 1); ex.technique = null; });
    result.notes = (result.notes || '') + ' D\u00e9butant : concentrez-vous sur la technique avant les charges.';
  }
  if (S.sportFocus && typeof S.sportFocus === 'object') {
    var key = muscleGroup.replace('_dedied','');
    var pMap = {'pectoraux':'Poitrine','dos':'Dos','epaules':'\u00c9paules','bras':'Bras','jambes':'Jambes','fessiers':'Fessiers','abdos':'Abdominaux'};
    var zoneName = pMap[key] || key;
    var priority = S.sportFocus[zoneName] || 0;
    if (priority >= 4) {
      result.exercises.forEach(function(ex) { if (typeof ex.sets === 'number') ex.sets += 1; });
      result.notes = (result.notes || '') + ' \u2b50 Zone prioritaire : volume augment\u00e9.';
    }
  }
  return result;
}

// getProgressiveProgram — applique la périodisation mésocycle sur n'importe quel programme
// weekInMesocycle: 1-4 (ou >4 → modulo automatique sur 4 semaines)
function getProgressiveProgram(muscleGroup, weekInMesocycle, userProfile) {
  var week = ((weekInMesocycle || 1) - 1) % 4;
  var meso = MESOCYCLE_WEEKS[week] || MESOCYCLE_WEEKS[0];
  var base = getPersonalizedProgram(muscleGroup, userProfile);
  if (!base || !base.exercises) return base;
  var result = JSON.parse(JSON.stringify(base));
  result.exercises.forEach(function(ex) {
    if (typeof ex.sets === 'number') {
      ex.sets = Math.max(2, Math.round(ex.sets * meso.setsMultiplier));
    }
    ex.rirTarget = meso.rirTarget;
    ex.mesoWeek = meso.name;
  });
  result.mesoInfo = meso;
  result.notes = (result.notes || '') + ' | \u2728 ' + meso.name + ' — RIR ' + meso.rirTarget + ': ' + meso.desc;
  return result;
}

function getWeeklySplit(daysPerWeek, userProfile) {
  var S = userProfile || window.S || {};
  var base = WEEKLY_SPLITS[daysPerWeek] || WEEKLY_SPLITS[5];
  // Deep clone to avoid mutating the template
  var split = JSON.parse(JSON.stringify(base));
  // Inject dedicated programs based on zone priorities (4★ or 5★)
  var focus = S.sportFocus || {};
  var priorityMap = {
    'Fessiers': 'fessiers_dedied',
    'Abdominaux': 'abdos_dedied',
    'Biceps': 'biceps_dedied',
    'Triceps': 'triceps_dedied'
  };
  // For each high-priority zone, inject its dedicated program into the appropriate day
  Object.keys(priorityMap).forEach(function(zoneName) {
    if ((focus[zoneName] || 0) < 4) return;
    var dediedKey = priorityMap[zoneName];
    var alreadyPresent = split.days.some(function(d){ return d.muscles.indexOf(dediedKey) !== -1; });
    if (alreadyPresent) return;
    // Find the best day to inject (jambes day for fessiers, bras/abdos day for others)
    var parentGroup = {fessiers_dedied:'jambes', abdos_dedied:'bras', biceps_dedied:'bras', triceps_dedied:'bras'}[dediedKey] || 'jambes';
    var targetDay = null;
    // Find day with parent group, preferring the last occurrence
    for (var di = split.days.length - 1; di >= 0; di--) {
      if (split.days[di].muscles.indexOf(parentGroup) !== -1) { targetDay = split.days[di]; break; }
    }
    // If no matching day, use the last day
    if (!targetDay) targetDay = split.days[split.days.length - 1];
    // Inject dedicated program
    if (targetDay.muscles.indexOf(dediedKey) === -1) {
      targetDay.muscles.push(dediedKey);
      targetDay.label = targetDay.label + ' + ' + zoneName + ' \u2605';
    }
  });
  return split;
}

window.NFC_PROGRAMS = NFC_PROGRAMS;
window.WEEKLY_SPLITS = WEEKLY_SPLITS;
window.getPersonalizedProgram = getPersonalizedProgram;
window.getProgressiveProgram = getProgressiveProgram;
window.getWeeklySplit = getWeeklySplit;

})();
