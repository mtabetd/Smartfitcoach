/**
 * SmartFitCoach — Proprietary Software
 * Copyright (c) 2024-2026 SmartFitCoach. All rights reserved.
 * Unauthorized copying, modification, distribution, or use of this software
 * is strictly prohibited without explicit written permission.
 * Contact: contact@smartfitcoach.com
 */
// muscu-programs.js — Professional Bodybuilding Programs (SmartFitCoach)
(function(){
'use strict';

var SFC_PROGRAMS = {
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
        {order:1, name:'D\u00e9velopp\u00e9 couch\u00e9 barre', sets:4, reps:10, rest:'1min30', technique:'3s excentrique contr\u00f4l\u00e9e, drive explosif. En s\u00e8che : charges r\u00e9duites \u00e0 65-70% 1RM, priorit\u00e9 au TUT.', muscle:'pectoraux', type:'compound', equipment:'barre'},
        {order:2, name:'D\u00e9velopp\u00e9 inclin\u00e9 barre', sets:4, reps:12, rest:'1min', technique:'30\u00b0 d\'inclinaison. Cibler le faisceau sup\u00e9rieur. Descente 2s, push contr\u00f4l\u00e9.', muscle:'pectoraux', type:'compound', equipment:'barre'},
        {order:3, name:'D\u00e9velopp\u00e9 inclin\u00e9 halt\u00e8res', sets:3, reps:12, rest:'1min', technique:'3s pic contraction — amplitude maximale en bas, halt\u00e8res se touchent en haut.', muscle:'pectoraux', type:'compound', equipment:'halteres'},
        {order:4, name:'C\u00e2ble crossover bas', sets:3, reps:15, rest:'60s', technique:'3s pic contraction — poulies basses, vecteur montant cible le faisceau inf\u00e9rieur. Tension continue.', muscle:'pectoraux', type:'isolation', equipment:'poulie'},
        {order:5, name:'\u00c9cart\u00e9 halt\u00e8res', sets:3, reps:15, rest:'60s', technique:'3s pic contraction — stretch profond en bas (coudes 160\u00b0 max), contraction forte en haut.', muscle:'pectoraux', type:'isolation', equipment:'halteres'},
        {order:6, name:'Crunch banc d\u00e9clin\u00e9', sets:3, reps:20, rest:'60s', technique:'3s excentrique — mains \u00e0 la tempe. Expirer en montant, contr\u00f4ler la descente.', muscle:'abdominaux', type:'isolation', equipment:'banc'}
      ],
      notes: 'PECTORAUX S\u00c8CHE: Compos\u00e9s d\'abord (CNS frais), repos courts 60-90s pour densit\u00e9 maximale et cardio int\u00e9gr\u00e9. DC barre (65-70% 1RM, TUT prioritaire) \u2192 Inclin\u00e9 barre (haut pectoral) \u2192 Inclin\u00e9 halt\u00e8res (amplitude max) \u2192 C\u00e2ble crossover bas (isolation inf\u00e9rieur) \u2192 Ecart\u00e9 halt\u00e8res (stretch). En d\u00e9ficit : maintenir la force relative (charge/poids de corps). Le volume et la densit\u00e9 > la charge absolue en s\u00e8che.'
    }
  },
  dos: {
    masse: {
      warmup: '5 min rameur + mobilit\u00e9 \u00e9paules',
      exercises: [
        {order:1, name:'Tractions pronation', sets:4, reps:10, rest:'2min30', technique:'Compos\u00e9 principal \u2014 largeur dorsale. Dead hang complet. Scapulae d\u00e9prim\u00e9es \u00e0 l\'initiation. Prise l\u00e9g\u00e8rement plus large que les \u00e9paules. Initier le mouvement par la d\u00e9pression scapulaire (pas par la flexion du coude). Lest\u00e9 si 10 reps trop faciles \u2014 progressive overload.', muscle:'dos', type:'compound', equipment:'barre fixe'},
        {order:2, name:'Rowing T-bar', sets:4, reps:8, rest:'2min30', technique:'Compos\u00e9 \u00e9paisseur prioritaire. Dos \u00e0 45\u00b0, gainage permanent. Tirer les coudes vers l\'arri\u00e8re jusqu\'\u00e0 la r\u00e9traction scapulaire compl\u00e8te, tenir 1s. Ne pas balancer le buste. Prise neutre ou pronate selon confort.', muscle:'dos', type:'compound', equipment:'barre'},
        {order:3, name:'Tirage vertical prise large', sets:4, reps:10, rest:'2min', technique:'2s excentrique contr\u00f4l\u00e9. Prise pronate l\u00e9g\u00e8rement plus large que les \u00e9paules. Tirer TOUJOURS vers le sternum (jamais derri\u00e8re la nuque). Scapulae en rotation et d\u00e9pression \u00e0 la contraction. Isoler le grand dorsal.', muscle:'dos', type:'compound', equipment:'poulie'},
        {order:4, name:'Rowing halt\u00e8re unilat\u00e9ral', sets:5, reps:12, rest:'1min30', technique:'12 reps chaque bras. Genou et main appuy\u00e9s sur banc. Tirer le coude vers le plafond en serrant l\'omoplate. Contr\u00f4ler la descente 2s.', muscle:'dos', type:'compound', equipment:'halteres'},
        {order:5, name:'Pulldown prise serr\u00e9e', sets:4, reps:10, rest:'1min30', technique:'5s pic contraction x3 — Prise neutre triangle, coudes le long du corps. Tirer vers la poitrine. Isoler le grand dorsal.', muscle:'dos', type:'isolation', equipment:'poulie'},
        {order:6, name:'Relev\u00e9 de jambes', sets:4, reps:'max', rest:'1min', technique:'Suspendre aux barres parall\u00e8les ou barre fixe. Jambes tendues si possible, sinon fl\u00e9chies. Contr\u00f4ler la descente 3s. Initier le mouvement par le bassin, pas par les jambes.', muscle:'abdominaux', type:'isolation', equipment:'barre fixe'}
      ],
      notes: 'DOS MASSE PRO LEVEL: Tractions lest\u00e9es (largeur) \u2192 T-bar/Rowing barre (\u00e9paisseur) \u2192 Tirage vertical large (dorsaux) \u2192 Rowing halt\u00e8re unilat\u00e9ral (\u00e9quilibre) \u2192 Pulldown serr\u00e9 (finisseur). Le dos = groupe le plus difficile \u00e0 sentir. Penser \u00e0 initier chaque tirage par la d\u00e9pression scapulaire, PAS par la flexion du coude. Le biceps ne doit \u00eatre qu\'un lien.'
    },
    seche: {
      warmup: '5 min rameur + mobilit\u00e9 \u00e9paules',
      exercises: [
        {order:1, name:'Tractions pronation', sets:4, reps:12, rest:'1min', technique:'Dead hang compl\u00e8t, tirer le menton au-dessus de la barre. Scapulae d\u00e9prim\u00e9es \u00e0 l\'initiation. Si impossibles: assist\u00e9es ou \u00e9lastique.', muscle:'dos', type:'compound', equipment:'barre fixe'},
        {order:2, name:'Rowing T-bar', sets:4, reps:12, rest:'1min', technique:'Dos \u00e0 45\u00b0, tirer vers la poitrine. Gainage permanent. Retraction scapulaire en fin de mouvement. 2s excentrique.', muscle:'dos', type:'compound', equipment:'barre'},
        {order:3, name:'Tirage vertical', sets:4, reps:12, rest:'1min', technique:'2s excentrique — Prise pronation large. Tirer TOUJOURS devant la poitrine, jamais derri\u00e8re la nuque.', muscle:'dos', type:'compound', equipment:'poulie'},
        {order:4, name:'Rowing halt\u00e8re unilat\u00e9ral', sets:4, reps:15, rest:'45s', technique:'Genou et main sur banc. Tirer coude vers le plafond. Amplitude compl\u00e8te. Coudes l\u00e9g\u00e8rement derri\u00e8re le dos en haut.', muscle:'dos', type:'compound', equipment:'halteres'},
        {order:5, name:'Straight-arm pulldown', sets:4, reps:15, rest:'45s', technique:'Pic contraction — bras quasi tendus. Isolation pure du grand dorsal. Excellent pour la connexion neuromusculaire dorsale.', muscle:'dos', type:'isolation', equipment:'poulie'},
        {order:6, name:'Relev\u00e9 de jambes', sets:4, reps:'max', rest:'45s', technique:'Jambes tendues si possible. Contr\u00f4ler la descente. En s\u00e8che : densit\u00e9 maximale avec repos courts.', muscle:'abdominaux', type:'isolation', equipment:'barre fixe'}
      ],
      notes: 'DOS S\u00c8CHE: Tractions PDC (force relative maintenue) \u2192 Rowing T-bar (volume) \u2192 Tirage vertical (dorsal) \u2192 Rowing halt\u00e8re (unilat\u00e9ral) \u2192 Straight-arm pulldown (finisseur isolation). Repos courts (45-60s) pour densit\u00e9 maximale. En d\u00e9ficit calorique : maintenir les charges — l\'objectif est la r\u00e9tention musculaire, pas la performance.'
    }
  },
  bras: {
    masse: {
      warmup: '5 min rameur + rotations poignets',
      exercises: [
        {order:1, name:'Curl barre droite + Skull crushers (barre front)', sets:4, reps:'10+10', rest:'1min30', technique:'Superset agoniste/antagoniste \u2014 Curl barre strict (coudes fixes) puis transition imm\u00e9diate en skull crushers EZ (coudes vers le plafond). Pas de repos entre les deux exercices.', muscle:'biceps+triceps', type:'superset', equipment:'barre'},
        {order:2, name:'Curl pupitre (Larry Scott) + D\u00e9velopp\u00e9 couch\u00e9 prise serr\u00e9e', sets:4, reps:'10+10', rest:'1min30', technique:'Superset \u2014 Curl pupitre barre EZ (3s excentrique, stretch max en bas) puis transition DC serr\u00e9 (prise largeur \u00e9paules, coudes pr\u00e8s du corps).', muscle:'biceps+triceps', type:'superset', equipment:'barre'},
        {order:3, name:'Curl spider (araignee) + Dips', sets:4, reps:'10+10', rest:'1min30', technique:'Superset \u2014 Curl spider banc inclin\u00e9 45\u00b0 (mouvement tr\u00e8s strict, impossible de tricher) puis Dips banc (buste droit = triceps pur). Peak contraction sur les deux.', muscle:'biceps+triceps', type:'superset', equipment:'banc'},
        {order:4, name:'Curl concentr\u00e9', sets:4, reps:12, rest:'1min30', technique:'12 reps chaque bras. Coude appuy\u00e9 contre la cuisse int\u00e9rieure. Supination maximale en haut. Pic contraction 2s. Pour le "pic" du biceps.', muscle:'biceps', type:'isolation', equipment:'halteres'},
        {order:5, name:'Crunch banc d\u00e9clin\u00e9', sets:4, reps:12, rest:'1min', technique:'3s excentrique', muscle:'abdominaux', type:'isolation', equipment:'banc'},
        {order:6, name:'Relev\u00e9 de jambes', sets:4, reps:'max', rest:'1min', technique:'Barre fixe ou chaise romaine. Jambes tendues si possible. Contr\u00f4ler la descente. Initier par la flexion lombaire.', muscle:'abdominaux', type:'isolation', equipment:'barre fixe'},
        {order:7, name:'Obliques chaise romaine', sets:4, reps:12, rest:'1min', technique:'12 reps chaque c\u00f4t\u00e9', muscle:'abdominaux', type:'isolation', equipment:'chaise romaine'}
      ],
      notes: 'BRAS MASSE PRO LEVEL: Supersets agoniste/antagoniste (biceps+triceps) = recrutement maximal et pump intense. Curl barre + skull crushers \u2192 pupitre + DC serr\u00e9 \u2192 spider + dips \u2192 concentr\u00e9 (finisseur pic). Les triceps = 2/3 du volume du bras. Ne JAMAIS n\u00e9gliger le chef long des triceps (skull crushers arri\u00e8re de la t\u00eate ou overhead extension). Curl concentr\u00e9 = exercice signature du pic biceps. La supination maximale en haut = recrutement biceps maximal.'
    },
    seche: {
      warmup: '5 min rameur + rotations poignets',
      exercises: [
        {order:1, name:'Curl barre droite + Skull crushers (barre front)', sets:4, reps:'12+12', rest:'1min', technique:'Superset \u2014 Repos courts en s\u00e8che = cardio int\u00e9gr\u00e9. Charges r\u00e9duites de 15-20% vs masse. Qualit\u00e9 d\'ex\u00e9cution prioritaire.', muscle:'biceps+triceps', type:'superset', equipment:'barre'},
        {order:2, name:'Curl pupitre (Larry Scott) + D\u00e9velopp\u00e9 couch\u00e9 prise serr\u00e9e', sets:4, reps:'12+12', rest:'1min', technique:'Superset \u2014 Tension maximale tout le long du mouvement. Pas de repos entre les deux exercices.', muscle:'biceps+triceps', type:'superset', equipment:'barre'},
        {order:3, name:'Curl spider (araignee) + Dips banc', sets:4, reps:'12+12', rest:'1min', technique:'Superset \u2014 Curl spider strict (aucun triche possible) + dips banc. Bonne finition en densit\u00e9.', muscle:'biceps+triceps', type:'superset', equipment:'banc'},
        {order:4, name:'Curl marteau', sets:4, reps:15, rest:'45s', technique:'Prise neutre (pouces vers le haut). Cible brachioradial + brachial sous le biceps. Am\u00e9liore l\'\u00e9paisseur et la largeur du bras.', muscle:'biceps', type:'isolation', equipment:'halteres'},
        {order:5, name:'Crunch banc d\u00e9clin\u00e9', sets:4, reps:20, rest:'45s', technique:'3s excentrique \u2014 mains \u00e0 la tempe (pas derri\u00e8re la nuque). Amplitude 30\u00b0 uniquement = meilleure activation grand droit.', muscle:'abdominaux', type:'isolation', equipment:'banc'},
        {order:6, name:'Relev\u00e9 de jambes suspendu', sets:4, reps:'max', rest:'30s', technique:'Contr\u00f4ler la descente. Jambes tendues si possible. Monter \u00e0 90\u00b0 minimum. Ne pas balancer.', muscle:'abdominaux', type:'isolation', equipment:'barre fixe'},
        {order:7, name:'Obliques chaise romaine', sets:4, reps:15, rest:'30s', technique:'12-15 reps chaque c\u00f4t\u00e9. Rotation lat\u00e9rale contr\u00f4l\u00e9e. Pas de rotation inertiellement. Contr\u00f4ler la mont\u00e9e et la descente.', muscle:'abdominaux', type:'isolation', equipment:'chaise romaine'}
      ],
      notes: 'BRAS S\u00c8CHE: Supersets biceps/triceps + repos courts (45-60s) = cardio int\u00e9gr\u00e9 et densit\u00e9 maximale. Charges r\u00e9duites 15-20% vs masse. Priorit\u00e9 au TUT (time under tension) et \u00e0 la contraction contr\u00f4l\u00e9e. Curl marteau = indispensable pour le brachial (muscle sous le biceps qui pousse le biceps vers le haut = volume 3D). En d\u00e9ficit calorique: maintenir volume, r\u00e9duire charges.'
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
        {order:1, name:'Squat barre', sets:4, reps:12, rest:'1min30', technique:'Profondeur parall\u00e8le minimum. Dos neutre, regard droit. Genoux dans l\'axe des orteils. En s\u00e8che : charges r\u00e9duites \u00e0 65-70% 1RM mais profondeur maintenue.', muscle:'quadriceps+fessiers', type:'compound', equipment:'barre'},
        {order:2, name:'Soulevé de terre roumain', sets:3, reps:12, rest:'1min30', technique:'Hip hinge pur \u2014 hanches EN ARRI\u00c8RE (pas les genoux en avant). Dos neutre OBLIGATOIRE. Stretch ischios ressenti = bonne position. Pr\u00e9serve la masse ischio-jambi\u00e8re en d\u00e9ficit.', muscle:'ischio-jambiers+fessiers', type:'compound', equipment:'barre'},
        {order:3, name:'Squat bulgare', sets:3, reps:12, rest:'1min30', technique:'Pied arri\u00e8re sur banc. Genou avant \u00e0 2cm du sol. Torse l\u00e9g\u00e8rement pench\u00e9 = plus de fessiers. 12 reps chaque jambe.', muscle:'quadriceps+fessiers', type:'compound', equipment:'halteres'},
        {order:4, name:'Presse a cuisses', sets:3, reps:15, rest:'1min', technique:'3s excentrique \u2014 pieds \u00e0 mi-hauteur. Ne pas verrouiller les genoux. Amplitude compl\u00e8te = stimulus maximal.', muscle:'quadriceps', type:'compound', equipment:'machine'},
        {order:5, name:'Leg extension (quadriceps)', sets:3, reps:15, rest:'60s', technique:'3s excentrique \u2014 pic contraction 1s en haut. Charges mod\u00e9r\u00e9es pour pr\u00e9server l\'articulation genoux.', muscle:'quadriceps', type:'isolation', equipment:'machine'},
        {order:6, name:'Leg curl (ischios)', sets:3, reps:15, rest:'60s', technique:'3s excentrique \u2014 orteils en flexion dorsale = plus d\'activation ischios. Ne pas soul\u00e9ver les hanches. ROM complet.', muscle:'ischio-jambiers', type:'isolation', equipment:'machine'},
        {order:7, name:'Mollets debout', sets:3, reps:15, rest:'60s', technique:'ROM COMPLET obligatoire: stretch total en bas (talon sous la plateforme), mont\u00e9e maximale sur orteils. Pause 1s en haut.', muscle:'mollets', type:'isolation', equipment:'machine'}
      ],
      notes: 'JAMBES S\u00c8CHE: Les jambes br\u00fblent le plus de calories (groupe le plus volumineux). Squat (charges r\u00e9duites, technique maintenue) \u2192 RDL (ischios = CRUCIAL, pr\u00e9serve la masse ischio-jambi\u00e8re en d\u00e9ficit) \u2192 Bulgare (unilat\u00e9ral + correction d\u00e9s\u00e9quilibre) \u2192 Presse (volume quad) \u2192 Leg extension (finisseur) \u2192 Leg curl (ischios isolation) \u2192 Mollets. EN S\u00c8CHE: maintenir les charges \u00e0 70-75% 1RM max. L\'objectif = pr\u00e9server la masse musculaire, pas battre des PRs. Les ischios sont LE point faible qui d\u00e9truit l\'esth\u00e9tique des cuisses en s\u00e8che.'
    }
  },
  epaules: {
    masse: {
      warmup: '5 min rameur + rotations \u00e9paules + bande \u00e9lastique',
      exercises: [
        {order:1, name:'D\u00e9velopp\u00e9 militaire barre (debout)', sets:4, reps:6, rest:'3min', technique:'Compos\u00e9 principal CNS frais. Debout = gainage total engag\u00e9. Prise l\u00e9g\u00e8rement plus large que les \u00e9paules. Rentrer le menton au passage de la barre. Pas d\'arc excessif lombaire. Drive explosif en poussant la t\u00eate \u00e0 travers les bras en haut.', muscle:'\u00e9paules (faisceau ant)', type:'compound', equipment:'barre'},
        {order:2, name:'D\u00e9velopp\u00e9 militaire halt\u00e8res assis', sets:4, reps:8, rest:'2min', technique:'Plus safe que le d\u00e9velopp\u00e9 halt\u00e8res rotatif pour les rotateurs — ROM complet (halt\u00e8res \u00e0 l\'oreille). Coudes l\u00e9g\u00e8rement devant le plan frontal. Prise neutre possible.', muscle:'\u00e9paules', type:'compound', equipment:'halteres'},
        {order:3, name:'\u00c9l\u00e9vation lat\u00e9rale c\u00e2ble (unilat\u00e9ral)', sets:4, reps:12, rest:'1min30', technique:'C\u00e2ble = tension CONSTANTE tout le ROM contrairement aux halt\u00e8res. Poignet l\u00e9g\u00e8rement en avant du coude. Coude \u00e0 90\u00b0 max.', muscle:'\u00e9paules (faisceau lat\u00e9ral)', type:'isolation', equipment:'poulie'},
        {order:4, name:'\u00c9l\u00e9vation post\u00e9rieure (oiseau) halt\u00e8res', sets:4, reps:15, rest:'1min', technique:'3s excentrique — Buste pench\u00e9 \u00e0 90\u00b0, coudes l\u00e9g\u00e8rement fl\u00e9chis. CRUCIAL pour look 3D \u00e9paules. Faisceau post = cl\u00e9 de vote de l\u00e9\u00e9quilibre articulaire.', muscle:'\u00e9paules (faisceau post)', type:'isolation', equipment:'halteres'},
        {order:5, name:'Face pull corde (poulie haute)', sets:4, reps:'10+10', rest:'1min30', technique:'Superset avec \u00e9l\u00e9vation frontale. Tirer vers le visage, coudes HAUTS. Rotation externe maximale = protection coiffe des rotateurs.', muscle:'\u00e9paules (post + rotateurs)', type:'superset', equipment:'poulie+halteres'},
        {order:6, name:'Abdos rouleau (ab wheel)', sets:4, reps:12, rest:'1min', technique:'Dos neutre tout le mouvement. Gainage actif. Rentrez le ventre \u00e0 la remonter.', muscle:'abdominaux+transverse', type:'isolation', equipment:'rouleau'},
        {order:7, name:'Relev\u00e9 de jambes suspendu', sets:4, reps:'max', rest:'1min', technique:'Mouvement contr\u00f4l\u00e9 — pas d\'eslan. Montez les jambes \u00e0 90\u00b0 minimum. Descente lente 3s.', muscle:'abdominaux (bas)', type:'isolation', equipment:'barre fixe'}
      ],
      notes: '\u00c9PAULES PRO LEVEL: Militaire debout (force) → militaire halt\u00e8res (volume) → lat\u00e9rales c\u00e2ble (tension continue) → POST\u00c9RIEURES (3D look!) → face pull (protection rotateurs). Le d\u00e9velopp\u00e9 halt\u00e8res rotatif est \u00e9VITE\u00c9 car il cr\u00e9e de l\u00e9impingement sous-acromial sur charges lourdes. Les 3 faisceaux = 3D shoulder. Ne N\u00c9GLIGEZ JAMAIS le faisceau post\u00e9rieur.'
    },
    seche: {
      warmup: '5 min rameur + rotations \u00e9paules',
      exercises: [
        {order:1, name:'D\u00e9velopp\u00e9 militaire halt\u00e8res', sets:4, reps:10, rest:'2min', technique:'Compos\u00e9 principal. Coudes l\u00e9g\u00e8rement devant le plan frontal (pr\u00e9serve la coiffe des rotateurs). Descente 3s contr\u00f4l\u00e9e, push contr\u00f4l\u00e9. En s\u00e8che : charges \u00e0 ~70% 1RM, priorit\u00e9 au TUT. Halt\u00e8res \u00e0 hauteur des oreilles en bas.', muscle:'\u00e9paules', type:'compound', equipment:'halteres'},
        {order:2, name:'Arnold press', sets:4, reps:12, rest:'1min30', technique:'Rotation des poignets du bas vers le haut \u2014 active les 3 faisceaux. Partir paumes vers soi (halt\u00e8res \u00e0 hauteur des \u00e9paules), finir paumes vers l\'avant en haut. Descente 2s contr\u00f4l\u00e9e. Mouvement lent = contr\u00f4le maximum. Excellent exercice multi-faisceaux.', muscle:'\u00e9paules', type:'compound', equipment:'halteres'},
        {order:3, name:'\u00c9l\u00e9vation frontale + Face pull', sets:4, reps:'12+12', rest:'1min', technique:'Superset', muscle:'\u00e9paules', type:'superset', equipment:'halteres+poulie'},
        {order:4, name:'\u00c9l\u00e9vation lat\u00e9rale', sets:4, reps:15, rest:'60s', technique:'1 moiti\u00e9 + 1 compl\u00e8te', muscle:'\u00e9paules', type:'isolation', equipment:'halteres'},
        {order:5, name:'Shrug barre', sets:4, reps:12, rest:'1min', technique:'Monter les \u00e9paules vers les oreilles, tenir 1s en haut, descendre contr\u00f4l\u00e9. Ne pas rouler les \u00e9paules vers l\'arri\u00e8re. Prise pronation, barre devant.', muscle:'trap\u00e8zes', type:'isolation', equipment:'barre'},
        {order:6, name:'Abdos rouleau', sets:3, reps:15, rest:'60s', technique:'Partir à genoux, avancer le rouleau jusqu’à quasi-extension, puis ramener via le gainage. DOS DROIT — ne pas laisser les hanches descendre.', muscle:'abdominaux', type:'isolation', equipment:'rouleau'},
        {order:7, name:'Relev\u00e9 de jambes', sets:3, reps:'max', rest:'60s', technique:'Barre fixe ou chaise romaine. Jambes tendues si possible. Contr\u00f4ler la descente lente. Finir la s\u00e9ance par ce core work.', muscle:'abdominaux', type:'isolation', equipment:'barre fixe'}
      ],
      notes: '\u00c9PAULES S\u00c8CHE: Militaire halt\u00e8res (compos\u00e9 principal) \u2192 Arnold press (3 faisceaux) \u2192 Superset \u00e9l\u00e9vations frontales+face pull \u2192 Lat\u00e9rales (faisceau moyen) \u2192 Shrug (trap\u00e8zes). Repos courts (60-90s) pour densifier la s\u00e9ance. Ne jamais sacrifier la technique pour le volume en s\u00e8che \u2014 le muscle \u00e9paule se blesse facilement en d\u00e9ficit.'
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
          {order:2, name:'Squat sumo', sets:4, reps:12, rest:'1min30', technique:'Pieds écartés environ 140%, pointes vers l\'extérieur 45°. Genoux suivent les orteils. Fessiers plus sollicités que le squat classique. Contrôler la descente 2s.', muscle:'fessiers+adducteurs', equipment:'barre'},
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
          {order:2, name:'Relev\u00e9 de jambes', sets:4, reps:'max', rest:'45s', technique:'Barre fixe ou barres parall\u00e8les. Initier le mouvement en basculant le bassin. Jambes tendues \u2014 fl\u00e9chies si trop dur. Descente contr\u00f4l\u00e9e.', muscle:'grand droit (bas)', equipment:'barre fixe'},
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
          {order:1, name:'Curl barre droite', sets:4, reps:8, rest:'2min', technique:'Composé principal force. Coudes fixes le long du corps. Pas de balancement du dos. Supination maximale en haut. Descente contrôlée 3s.', muscle:'biceps', equipment:'barre'},
          {order:2, name:'Curl pupitre', sets:4, reps:10, rest:'1min30', technique:'3s excentrique', muscle:'biceps (chef court)', equipment:'pupitre'},
          {order:3, name:'Curl marteau', sets:4, reps:10, rest:'1min30', technique:'Prise neutre (pouce vers le haut). Cible le brachio-radialis et le brachial. Mouvement strict, coudes fixes. Excellent pour lépaisseur du bras.', muscle:'brachial', equipment:'halteres'}
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
  trapezes: {
    masse: {
      warmup: '5 min rameur + rotations \u00e9paules + flexions lat\u00e9rales nuque douces',
      exercises: [
        {order:1, name:'Soulev\u00e9 de terre conventionnel (accent trap\u00e8zes)', sets:4, reps:5, rest:'3min30', technique:'Compos\u00e9 roi des trap\u00e8zes. Barre au-dessus du milieu du pied, dos neutre, hanches basses. \u00c0 la mont\u00e9e : shrug actif en fin de mouvement = recrutement maximal des trap\u00e8zes sup\u00e9rieurs. CNS frais obligatoire.', muscle:'trap\u00e8zes+dos complet', type:'compound', equipment:'barre'},
        {order:2, name:'Shrug barre (pronation)', sets:5, reps:8, rest:'2min30', technique:'EXERCICE CL\u00c9 trap\u00e8zes. Prise pronation, barre devant. Monter les \u00e9paules VERTICALEMENT vers les oreilles (pas rouler en arri\u00e8re). Tenir 2s au sommet. Descendre lentement 3s. Charge: 80-90% du max shrug.', muscle:'trap\u00e8zes sup\u00e9rieurs', type:'isolation', equipment:'barre'},
        {order:3, name:'Shrug halt\u00e8res', sets:4, reps:10, rest:'2min', technique:'Amplitude l\u00e9g\u00e8rement sup\u00e9rieure \u00e0 la barre. Monter les \u00e9paules, pic contraction 1s. Halt\u00e8res de chaque c\u00f4t\u00e9 du corps. Contr\u00f4ler la descente 2s. Excellent pour \u00e9paisseur des trap\u00e8zes.', muscle:'trap\u00e8zes sup\u00e9rieurs', type:'isolation', equipment:'halteres'},
        {order:4, name:'Tirage menton barre (upright row)', sets:4, reps:10, rest:'2min', technique:'Prise pronate l\u00e9g\u00e8rement plus large que les \u00e9paules (prise \u00e9troite = impingement). Tirer vers le menton, coudes \u00e9lev\u00e9s. Cible le faisceau sup\u00e9rieur + d\u00e9lto\u00efde lat\u00e9ral. Stop \u00e0 hauteur du menton MAX.', muscle:'trap\u00e8zes + \u00e9paules', type:'compound', equipment:'barre'},
        {order:5, name:'Face pull corde (trap\u00e8zes moyens)', sets:4, reps:15, rest:'1min30', technique:'Poulie haute, tirer la corde vers le visage (coudes hauts). Rotation externe maximale = trap\u00e8zes moyens + rhombo\u00efdes + coiffe des rotateurs. JAMAIS n\u00e9glig\u00e9 \u2014 \u00e9quilibre articulaire crucial.', muscle:'trap\u00e8zes moyens + rotateurs', type:'isolation', equipment:'poulie'},
        {order:6, name:'Row \u00e0 faible tirage (low row prise large)', sets:3, reps:12, rest:'1min30', technique:'Prise large pronate. Tirer vers le bas de la poitrine. Retraction scapulaire maximale = activation trap\u00e8zes inf\u00e9rieurs. Penser \u00e0 "rentrer les omoplates dans les poches arri\u00e8re".', muscle:'trap\u00e8zes inf\u00e9rieurs + rhombo\u00efdes', type:'compound', equipment:'poulie'}
      ],
      notes: 'TRAP\u00c8ZES MASSE PRO LEVEL: Les trap\u00e8zes ont 3 parties (sup\u00e9rieurs = mont\u00e9e \u00e9paules, moyens = retraction scapulaire, inf\u00e9rieurs = d\u00e9pression scapulaire). 90% des pratiquants ne travaillent que les sup\u00e9rieurs. ERREUR CRITIQUE. Soulev\u00e9 de terre (recrutement total) \u2192 Shrug barre (sup\u00e9rieurs) \u2192 Shrug halt\u00e8res (amplitude) \u2192 Tirage menton (sup+lat\u00e9raux) \u2192 Face pull (moyens+rotateurs) \u2192 Row bas (inf\u00e9rieurs). Les trap\u00e8zes donnent le look "armure" des champions.'
    },
    seche: {
      warmup: '5 min rameur + rotations \u00e9paules',
      exercises: [
        {order:1, name:'Shrug barre', sets:4, reps:12, rest:'1min30', technique:'Monter les \u00e9paules vers les oreilles, tenir 1s en haut. Descendre contr\u00f4l\u00e9 2s. Charges \u00e0 70-75% du max en s\u00e8che. Prise pronation. Ne pas rouler les \u00e9paules.', muscle:'trap\u00e8zes sup\u00e9rieurs', type:'isolation', equipment:'barre'},
        {order:2, name:'Shrug halt\u00e8res', sets:4, reps:15, rest:'1min', technique:'Amplitude compl\u00e8te. Pic contraction 1s. Contr\u00f4ler la descente. En s\u00e8che : volume maintenu, charges r\u00e9duites.', muscle:'trap\u00e8zes sup\u00e9rieurs', type:'isolation', equipment:'halteres'},
        {order:3, name:'Face pull corde', sets:4, reps:15, rest:'1min', technique:'Poulie haute, rotation externe maximale. Coudes hauts. Protection de la coiffe + trap\u00e8zes moyens. Essentiel en s\u00e8che pour maintenir l\'\u00e9quilibre articulaire.', muscle:'trap\u00e8zes moyens + rotateurs', type:'isolation', equipment:'poulie'},
        {order:4, name:'Tirage menton halt\u00e8res', sets:3, reps:15, rest:'60s', technique:'Prise plus large = moins de stress sur les rotateurs. Tirer jusqu\'au menton, coudes \u00e9lev\u00e9s. Contr\u00f4ler la descente 2s.', muscle:'trap\u00e8zes + \u00e9paules', type:'compound', equipment:'halteres'},
        {order:5, name:'Row buste pench\u00e9 prise large', sets:3, reps:15, rest:'60s', technique:'Dos \u00e0 60\u00b0 (plus vertical qu\'un rowing classique). Retraction scapulaire = trap\u00e8zes moyens et inf\u00e9rieurs. Charges mod\u00e9r\u00e9es, contr\u00f4le parfait.', muscle:'trap\u00e8zes moyens+inf\u00e9rieurs', type:'compound', equipment:'barre'}
      ],
      notes: 'TRAP\u00c8ZES S\u00c8CHE: Maintenir le volume des 3 faisceaux en d\u00e9ficit. Le face pull est OBLIGATOIRE en s\u00e8che (pr\u00e9serve la coiffe des rotateurs quand les charges diminuent). Repos courts 60-90s. Les trap\u00e8zes r\u00e9pondent au volume + TUT (time under tension).'
    }
  },
  lombaires: {
    masse: {
      warmup: '5 min v\u00e9lo + mobilit\u00e9 hanche + McKenzie extensions x10 + cat-cow x10',
      exercises: [
        {order:1, name:'Soulev\u00e9 de terre conventionnel', sets:4, reps:5, rest:'4min', technique:'LA r\u00e9f\u00e9rence lombaires. Barre au-dessus du milieu du pied, scapulae r\u00e9tract\u00e9es, gainage 360\u00b0 (Valsalva). Dos NEUTRE tout le mouvement. Ne jamais arrondir le bas du dos. Le plus grand constructeur de force lombaire existant.', muscle:'lombaires+dos complet+jambes', type:'compound', equipment:'barre'},
        {order:2, name:'Good Morning barre', sets:4, reps:8, rest:'2min30', technique:'Barre haute sur les \u00e9paules. Hanches EN ARRI\u00c8RE (hip hinge), dos neutre, l\u00e9ger fl\u00e9chissement des genoux. Descendre jusqu\'\u00e0 ce que le buste soit parall\u00e8le au sol (ou limite de la mobilit\u00e9). Remonter en contractant les lombaires et les fessiers. Charge: 40-50% du squat max.', muscle:'lombaires+ischios+fessiers', type:'compound', equipment:'barre'},
        {order:3, name:'Hyperextension au banc \u00e0 lombaires', sets:4, reps:12, rest:'2min', technique:'Amplitude compl\u00e8te: descente contr\u00f4l\u00e9e (t\u00eate vers le sol) puis remont\u00e9e jusqu\'\u00e0 alignement parfait corps. Mains crois\u00e9es sur la poitrine (poids sur poitrine si trop facile). NE PAS hyperextendre au-del\u00e0 du neutre = risque lombaire.', muscle:'lombaires+fessiers+ischios', type:'isolation', equipment:'banc \u00e0 lombaires'},
        {order:4, name:'Soulev\u00e9 de terre roumain (RDL)', sets:3, reps:10, rest:'2min', technique:'Accent lombaires/ischios. Hanches en arri\u00e8re, barre glisse le long des jambes, dos neutre STRICT. Le stretch des ischios = signal de bonne position. Excellent compl\u00e9ment au DL conventionnel.', muscle:'lombaires+ischios+fessiers', type:'compound', equipment:'barre'},
        {order:5, name:'Planche ventrale (prone plank)', sets:4, reps:'45s', rest:'1min', technique:'Position pompe sur avant-bras. Corps align\u00e9 t\u00eate-talons. Gainage lombaire statique. Rentrer le nombril sans bloquer la respiration. Les lombaires stabilisent la colonne = travail issom\u00e9trique intense.', muscle:'lombaires+core', type:'isolation', equipment:'sol'}
      ],
      notes: 'LOMBAIRES MASSE PRO LEVEL: Les lombaires (carr\u00e9 des lombes + multifides + \u00e9recteurs du rachis) = le groupe le plus n\u00e9glig\u00e9 ET le plus important pour la s\u00e9curit\u00e9 et la performance. Soulev\u00e9 de terre (force maximale) \u2192 Good morning (hip hinge + charge) \u2192 Hyperextension (isolation) \u2192 RDL (ischios + lombaires) \u2192 Planche (gainage statique). Des lombaires forts = des performances plus s\u00fbres sur TOUS les autres exercices. Sans lombaires forts, pas de squat lourd, pas de deadlift, pas de row lourd. C\'est le fondement invisible de toute performance.'
    },
    seche: {
      warmup: '5 min v\u00e9lo + mobilit\u00e9 hanche + cat-cow x10',
      exercises: [
        {order:1, name:'Good Morning barre (l\u00e9ger)', sets:4, reps:12, rest:'1min30', technique:'Charges r\u00e9duites en s\u00e8che (30-40% du squat). Hip hinge pur, dos neutre. Maintain la technique irr\u00e9prochable. Excellent pour TUT lombaire sans fatigue excessive du CNS.', muscle:'lombaires+ischios', type:'compound', equipment:'barre'},
        {order:2, name:'Hyperextension lest\u00e9e', sets:4, reps:15, rest:'1min', technique:'Amplitude compl\u00e8te contr\u00f4l\u00e9e. En s\u00e8che : maintenir le volume, r\u00e9duire la charge si n\u00e9cessaire. Descente 3s pour TUT. Contraction lombaire forte en haut 1s.', muscle:'lombaires+fessiers', type:'isolation', equipment:'banc \u00e0 lombaires'},
        {order:3, name:'Superman (d\u00e9coll\u00e9 ventral)', sets:4, reps:15, rest:'60s', technique:'All long\u00e9 sur le ventre, bras tendus. Soul\u00e9ver simultan\u00e9ment bras et jambes. Tenir 2s en haut. Exercice de gainage dynamique lombaire. Id\u00e9al en s\u00e8che (charge = poids de corps).', muscle:'lombaires+\u00e9recteurs+fessiers', type:'isolation', equipment:'sol'},
        {order:4, name:'Planche ventrale', sets:3, reps:'60s', rest:'60s', technique:'Gainage isom\u00e9trique. Corps align\u00e9, nombril rent\u00e9. Respiration abdominale. Progresser via le temps (30s \u2192 45s \u2192 60s \u2192 90s). En s\u00e8che : simple et efficace sans \u00e9quipement sp\u00e9cial.', muscle:'lombaires+core', type:'isolation', equipment:'sol'},
        {order:5, name:'Bird dog', sets:3, reps:12, rest:'60s', technique:'A quatre pattes: \u00e9tendre simultan\u00e9ment le bras droit et la jambe gauche. Tenir 2s. Alterner. Stabilisation lombaire anti-rotation. Parfait en s\u00e8che pour maintenir la sant\u00e9 lombaire en d\u00e9ficit calorique.', muscle:'lombaires+core (anti-rotation)', type:'isolation', equipment:'sol'}
      ],
      notes: 'LOMBAIRES S\u00c8CHE: En d\u00e9ficit calorique, les risques de blessure lombaire augmentent (fatigue musculaire + charges). Maintenir le volume mais r\u00e9duire l\'intensit\u00e9. Good morning (hip hinge) \u2192 Hyperextension (isolation) \u2192 Superman (dynamique) \u2192 Planche (isom\u00e9trique) \u2192 Bird dog (stabilisation). Priorit\u00e9: maint maintien de la sant\u00e9 articulaire. Des lombaires sains = programme long terme possible.'
    }
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
var SFC_PROGRAMS_FORCE = {
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
      notes: '\u26a1 PHASE FORCE PECTORAUX: 5\u00d73 bench = fondation de TOUS les gains pectoraux. Notez vos charges chaque s\u00e9ance. Double progression: reps d\'abord (3\u21923), puis charge (+2.5kg). 4min repos = non-n\u00e9gociable pour le CNS. Les m\u00e9thodes intensit\u00e9 maximale et volume progressif = toujours bas\u00e9es sur force brute d\'abord.'
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
      notes: '\u26a1 PHASE FORCE DOS: Soulev\u00e9 de terre en 1er (CNS frais). Principe fondamental: \'Le dos se construit avec le soulev\u00e9 de terre. Point.\' 800lb deadlift r\u00e9alis\u00e9. Tractions lest\u00e9es au programme. La force de traction = la masse dorsale. Tracking charges OBLIGATOIRE.'
    }
  },
  jambes: {
    force: {
      warmup: 'Activation: 3\u00d715 Hip thrust PDC + 3\u00d710 Leg swing + 2 sets squat progressif @50%, @70%, @80%',
      exercises: [
        {order:1, name:'Squat barre arri\u00e8re (high bar)', sets:5, reps:3, rest:'4min', technique:'@87-93% 1RM — ATG si mobilit\u00e9 permet, parall\u00e8le minimum. Bracing 360\u00b0 (Valsalva maneuver). Genoux dans l\'axe. Drive du sol EXPLOSIF. C\'est ici que se cr\u00e9ent les cuisses des champions.', muscle:'quadriceps+fessiers+ischio', type:'compound', equipment:'barre', rirTarget:1},
        {order:2, name:'Soulev\u00e9 de terre roumain (RDL)', sets:4, reps:5, rest:'3min30', technique:'@75-80% 1RM — Hanches EN ARRI\u00c8RE (hip hinge pur), dos neutre, barre glisse le long des jambes. Stretch ischios = brutal et n\u00e9cessaire.', muscle:'ischio-jambiers+fessiers', type:'compound', equipment:'barre', rirTarget:2},
        {order:3, name:'Fente bulgare barre (forc\u00e9)', sets:3, reps:5, rest:'3min', technique:'@70-75% 1RM — 5 reps chaque jambe (sans pause). Pied arri\u00e8re sur banc haut. Genou avant 1cm du sol. Force et symétrie = priorités.', muscle:'quadriceps+fessiers (unilat\u00e9ral)', type:'compound', equipment:'barre', rirTarget:2},
        {order:4, name:'Good Morning barre', sets:3, reps:8, rest:'2min30', technique:'@50-60% du squat max — Dos neutre, hanches en arri\u00e8re, l\u00e9ger fl\u00e9chissement des genoux. Force ischio en \u00e9tirement = pattern DL. M\u00e9thode volume progressif: exercice cl\u00e9.', muscle:'ischio-jambiers+bas du dos', type:'compound', equipment:'barre', rirTarget:2},
        {order:5, name:'Leg press (pieds hauts, charge maximale)', sets:4, reps:8, rest:'2min30', technique:'Pieds hauts sur la plateforme. Charges tr\u00e8s lourdes possibles (sécurité genoux assur\u00e9e par la machine). Tom Platz: 13 reps @500kg \u2014 c\'est ce niveau de jambes qui gagne.', muscle:'jambes compl\u00e8tes', type:'compound', equipment:'machine', rirTarget:2}
      ],
      notes: '\u26a1 PHASE FORCE JAMBES: Squat = trone, tout le reste est une branche. Tom Platz avait les meilleures jambes de l\'histoire parce qu\'il squattait 500kg+ pour des reps. Les jambes sont le groupe le plus dur \u00e0 d\u00e9velopper. La phase force BRISE les plafonds. Courage oblig\u00e9.'
    }
  },
  epaules: {
    force: {
      warmup: 'Activation: 3\u00d715 Face pull + 3\u00d715 Band pull-apart + 3\u00d710 YTW \u00e9lastique + 2 sets militaire @50%, @70%',
      exercises: [
        {order:1, name:'D\u00e9velopp\u00e9 militaire barre (debout)', sets:5, reps:3, rest:'4min', technique:'@87-93% 1RM — Debout = gainage total engag\u00e9. Prise l\u00e9g\u00e8rement plus large que les \u00e9paules. Pas de trop grande extension lombaire. Press explosif — stabilisateurs = travaillés. Presse debout = gainage total du corps.', muscle:'\u00e9paules (faisceau ant\u00e9rieur)', type:'compound', equipment:'barre', rirTarget:1},
        {order:2, name:'Développé militaire haltères assis', sets:4, reps:5, rest:'3min30', technique:'@75-80% 1RM — ROM complet (halt\u00e8res \u00e0 la hauteur des oreilles en bas). Coudes l\u00e9g\u00e8rement devant le plan frontal = pr\u00e9serve les rotateurs.', muscle:'\u00e9paules (3 faisceaux)', type:'compound', equipment:'halteres', rirTarget:2},
        {order:3, name:'Développé derrière la nuque (barre légère)', sets:3, reps:6, rest:'3min', technique:'@65-70% 1RM — UNIQUEMENT si mobilit\u00e9 \u00e9paules parfaite. Cible le faisceau lat\u00e9ral directement. Douleur = arr\u00eatez.', muscle:'\u00e9paules (faisceau lat + post)', type:'compound', equipment:'barre', rirTarget:2},
        {order:4, name:'\u00c9l\u00e9vation lat\u00e9rale c\u00e2ble lourd (unilatéral)', sets:4, reps:10, rest:'2min', technique:'Tension maximale du d\u00e9but \u00e0 la fin. C\u00e2ble via le bas du corps. Principe cl\u00e9: \'le d\u00e9lto\u00efde lat\u00e9ral est ce qui cr\u00e9e la largeur que tout le monde veut\'.', muscle:'\u00e9paules (faisceau lat\u00e9ral)', type:'isolation', equipment:'poulie', rirTarget:2},
        {order:5, name:'Face pull corde + \u00e9l\u00e9vation post\u00e9rieure', sets:4, reps:'10+12', rest:'1min30', technique:'Superset — Face pull corde lourde (rotation externe) puis Oiseau halt\u00e8res. Protège les rotateurs ET construit le 3D shoulder. Jamais saut\u00e9.', muscle:'\u00e9paules (post + rotateurs)', type:'superset', equipment:'poulie+halteres', rirTarget:3}
      ],
      notes: '\u26a1 PHASE FORCE \u00c9PAULES: Militaire debout = test de force totale du corps. Les grands champions = tous basaient leurs \u00e9paules sur le militaire lourd. Le 3D shoulder = faisceau lat\u00e9ral + POST\u00c9RIEUR bien développés. Ne jamais blesser les rotateurs = carri\u00e8re courte.'
    }
  },
  trapezes: {
    force: {
      warmup: 'Activation: 3\u00d710 Face pull \u00e9lastique + 3\u00d710 Band pull-apart + 2 sets soulev\u00e9 progressif @50%, @70%',
      exercises: [
        {order:1, name:'Soulev\u00e9 de terre conventionnel (lurd)', sets:4, reps:4, rest:'4min30', technique:'@85-90% 1RM \u2014 Recrutement trap\u00e8zes MAXIMAL en phase terminale de tirage. Le shrug actif en fin de mouvement recrute les trap\u00e8zes sup\u00e9rieurs. CNS frais = indispensable en premi\u00e8re position.', muscle:'trap\u00e8zes+dos complet', type:'compound', equipment:'barre', rirTarget:1},
        {order:2, name:'Shrug barre (lourd)', sets:5, reps:5, rest:'3min', technique:'@85-90% du max shrug \u2014 Charges maximales. Monter les \u00e9paules verticalement. Tenir 2s au sommet. JAMAIS rouler les \u00e9paules (risque rotateurs). Descente 3s excentrique. Progressive overload session par session.', muscle:'trap\u00e8zes sup\u00e9rieurs', type:'isolation', equipment:'barre', rirTarget:1},
        {order:3, name:'Rack pull (tirage partiel depuis mid-shin)', sets:4, reps:5, rest:'3min30', technique:'@90-95% du DL max \u2014 ROM r\u00e9duit = charges massives possibles. Overload m\u00e9canique sur trap\u00e8zes sup\u00e9rieurs et rhombo\u00efdes. Technique identique au DL. Shrug actif en fin.', muscle:'trap\u00e8zes + dos (surcharge)', type:'compound', equipment:'barre', rirTarget:2},
        {order:4, name:'Tirage menton barre (prise large)', sets:4, reps:6, rest:'2min30', technique:'@70% du DL \u2014 Prise pronate, 1.5\u00d7 largeur \u00e9paules. Tirer vers le menton, coudes \u00e9lev\u00e9s. Trap\u00e8zes sup + d\u00e9lto\u00efde lat\u00e9ral. Stop \u00e0 hauteur du menton STRICT.', muscle:'trap\u00e8zes + \u00e9paules', type:'compound', equipment:'barre', rirTarget:2},
        {order:5, name:'Face pull corde (lourd)', sets:4, reps:10, rest:'1min30', technique:'Charge \u00e9lev\u00e9e, rotation externe maximale. Trap\u00e8zes moyens + coiffe des rotateurs. Prot\u00e8ge l\'articulaire en phase force. Jamais saut\u00e9.', muscle:'trap\u00e8zes moyens + rotateurs', type:'isolation', equipment:'poulie', rirTarget:3}
      ],
      notes: '\u26a1 PHASE FORCE TRAP\u00c8ZES: Le soulev\u00e9 de terre construit les trap\u00e8zes plus que TOUT autre exercice. Le shrug lourd = surcharge isom\u00e9canique. Le rack pull = overload impossible \u00e0 atteindre avec DL complet. Les trap\u00e8zes des champions (Ronnie Coleman, Phil Heath) = construits sur le soulev\u00e9 de terre lourd + shrug lourds. Tracking charges OBLIGATOIRE.'
    }
  },
  lombaires: {
    force: {
      warmup: 'Activation: McKenzie extensions 3\u00d710 + cat-cow 3\u00d710 + hip hinge barre vide x15 + 2 sets DL @50%, @70%',
      exercises: [
        {order:1, name:'Soulev\u00e9 de terre conventionnel', sets:5, reps:3, rest:'5min', technique:'@87-93% 1RM \u2014 Le roi absolu des lombaires. Gainage 360\u00b0 (Valsalva maneuver). Dos NEUTRE STRICT. Drive des jambes. Les \u00e9recteurs du rachis et les multifides = sollicit\u00e9s \u00e0 intensit\u00e9 maximale. La plus grande charge de la s\u00e9ance, CNS frais.', muscle:'lombaires+dos complet+jambes', type:'compound', equipment:'barre', rirTarget:1},
        {order:2, name:'Good Morning barre (lourd)', sets:4, reps:5, rest:'3min30', technique:'@50-60% du squat max \u2014 Hip hinge strict. Dos neutre. Charg\u00e9 mais pas au maximum (risque lombaire si forme bris\u00e9e). Excellent pour la force des \u00e9recteurs en position de flexion = pattern DL.', muscle:'lombaires+ischios+fessiers', type:'compound', equipment:'barre', rirTarget:2},
        {order:3, name:'Hyperextension lest\u00e9e', sets:4, reps:8, rest:'2min30', technique:'Poids sur la poitrine ou halt\u00e8re serr\u00e9. Amplitude compl\u00e8te. Contraction lombaire 2s en haut (position neutre, pas hyperextension). Progression de charge \u00e0 chaque s\u00e9ance.', muscle:'lombaires+fessiers', type:'isolation', equipment:'banc \u00e0 lombaires', rirTarget:2},
        {order:4, name:'Deadlift en d\u00e9ficit (5cm)', sets:3, reps:5, rest:'3min', technique:'@75% 1RM \u2014 Debout sur des plaques de 5cm. ROM augment\u00e9 = recrutement lombaire plus profond et plus long. Technique parfaite obligatoire.', muscle:'lombaires+dos+jambes', type:'compound', equipment:'barre', rirTarget:2},
        {order:5, name:'Planche avant lest\u00e9e', sets:3, reps:'30s', rest:'2min', technique:'Lest sur le dos (partenaire ou gilet lest\u00e9). Gainage isom\u00e9trique lourd. Progression de charge ou de temps.', muscle:'lombaires+core (force isom\u00e9trique)', type:'isolation', equipment:'sol', rirTarget:3}
      ],
      notes: '\u26a1 PHASE FORCE LOMBAIRES: Des lombaires faibles = plafond sur TOUS les exercices compos\u00e9s. Soulev\u00e9 de terre (force absolue) \u2192 Good morning (hip hinge charg\u00e9) \u2192 Hyperextension lest\u00e9e (isolation) \u2192 DL d\u00e9ficit (ROM+) \u2192 Planche lest\u00e9e (isom\u00e9trique). ATTENTION: les lombaires r\u00e9cup\u00e8rent plus lentement que les autres muscles. 72h minimum entre les s\u00e9ances lombaires intenses. Ne jamais n\u00e9gliger l\'\u00e9chauffement.'
    }
  },
  bras: {
    force: {
      warmup: 'Activation: 3\u00d710 Band curl + 3\u00d710 Band tricep pushdown + mobilit\u00e9 coudes 3min',
      exercises: [
        {order:1, name:'Curl barre droite (lourd)', sets:4, reps:5, rest:'3min', technique:'@80% 1RM — Pas de balancement. Coudes fixes. Supination compl\u00e8te au sommet. Descente 3s excentrique. Larry Scott (1er Mr Olympia) = curl barre lourd toujours.', muscle:'biceps', type:'compound', equipment:'barre', rirTarget:1},
        {order:2, name:'D\u00e9velopp\u00e9 couch\u00e9 prise serr\u00e9e (lourd)', sets:4, reps:5, rest:'3min', technique:'@80% 1RM — Prise \u00e0 largeur d\u00e9\u00e9paules. Coudes proches du corps. Chef long + chef lat\u00e9ral triceps = 2/3 du bras.', muscle:'triceps', type:'compound', equipment:'barre', rirTarget:1},
        {order:3, name:'Curl pupitre (chef court)', sets:4, reps:6, rest:'2min30', technique:'@75% 1RM — Peak contraction 2s. 3s excentrique. Isolation pure. Le secret du biceps piqué.', muscle:'biceps (chef court)', type:'isolation', equipment:'pupitre', rirTarget:2},
        {order:4, name:'Barre au front (skull crushers) + DC serr\u00e9', sets:4, reps:'6+6', rest:'2min30', technique:'Superset lourd — Skull crushers @70% puis transition imm\u00e9diate en DC serr\u00e9 (m\u00eame barre). Technique Heavy Duty.', muscle:'triceps', type:'superset', equipment:'barre EZ', rirTarget:2},
        {order:5, name:'Curl incliné haltères (chef long)', sets:3, reps:8, rest:'2min', technique:'Banc \u00e0 45\u00b0 = stretch du chef long maximal. Halt\u00e8res pendent derri\u00e8re le banc en bas. Rotation supination compl\u00e8te en haut.', muscle:'biceps (chef long)', type:'isolation', equipment:'halteres+banc', rirTarget:3}
      ],
      notes: '\u26a1 PHASE FORCE BRAS: Les bras ne grossissent pas sans force de base sur composés. Curl barre lourd + DC serr\u00e9 lourd = fondation. L\'isolation seule = plafond rapide. Les champions du volume et de l\'intensit\u00e9 = tous soulevaient lourd sur curl barre.'
    }
  }
};

// ─── VOLUME LANDMARKS (Schoenfeld, RP Hypertrophy — sets/semaine par muscle) ───
var VOLUME_LANDMARKS = {
  chest:     {mev:10, mav:16, mrv:22, label:'Poitrine'},
  back:      {mev:8,  mav:16, mrv:25, label:'Dos'},
  shoulders: {mev:6,  mav:14, mrv:20, label:'\u00c9paules'},
  legs:      {mev:8,  mav:18, mrv:28, label:'Jambes'},
  glutes:    {mev:4,  mav:12, mrv:20, label:'Fessiers'},
  biceps:    {mev:6,  mav:12, mrv:20, label:'Biceps'},
  triceps:   {mev:6,  mav:14, mrv:20, label:'Triceps'},
  abs:       {mev:4,  mav:10, mrv:16, label:'Abdominaux'},
  traps:     {mev:4,  mav:12, mrv:18, label:'Trap\u00e8zes'},
  lower_back:{mev:4,  mav:9,  mrv:14, label:'Lombaires'},
  calves:    {mev:6,  mav:14, mrv:20, label:'Mollets'}
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
    name: 'Rest-Pause (Intensit\u00e9 Maximale)',
    ref: 'Méthode Intensité Maximale. Technique signature Heavy Duty',
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
    name: 'Pr\u00e9-Exhaustion (M\u00e9thode Classique)',
    ref: 'Encyclopédie Moderne du Bodybuilding — Méthode classique',
    desc: 'Fatiguer le muscle cible avec un isolant AVANT le compos\u00e9. Force le muscle principal \u00e0 travailler malgr\u00e9 les synergistes frais.',
    example: 'Pectoraux: \u00c9cart\u00e9 4×12 → imm\u00e9diatement D\u00e9velopp\u00e9 couch\u00e9 (pecs d\u00e9j\u00e0 fatigu\u00e9s, triceps encore frais)',
    frequency: '1x/s\u00e9ance pour le muscle prioritaire',
    bestFor: ['pectoraux', 'dos (grand dorsal)', '\u00e9paules']
  },
  twenty_ones: {
    name: '21s (7+7+7 — Time Under Tension)',
    ref: 'Méthode classique pump + recrutement total',
    desc: '7 reps demi-ROM bas + 7 reps demi-ROM haut + 7 reps ROM complet = 21 reps TUT maximal.',
    example: 'Curl barre: 7× (0\u00b0\u219290\u00b0) + 7× (90\u00b0\u2192haut) + 7× ROM complet',
    frequency: '1 exercice/s\u00e9ance en finisseur',
    bestFor: ['biceps', 'triceps', 'mollets']
  },
  giant_set: {
    name: 'Giant Set (4+ exercices enchaîn\u00e9s)',
    ref: 'Routine classique — densit\u00e9 d\'entra\u00eenement maximale pour d\u00e9finition + volume',
    desc: '4 exercices pour le m\u00eame muscle ou groupe antagoniste, sans repos entre les exercices. 2-3min entre les r\u00e9p\u00e9titions de giant sets.',
    example: '\u00c9paules: Militaire + Lat\u00e9rales + Frontales + Oiseau (4 exercices, 0s repos entre)',
    frequency: '1 giant set de 3-4 rounds en fin de s\u00e9ance',
    bestFor: ['\u00e9paules (3 faisceaux)', 'bras (biceps+triceps)', 'jambes (pump final)']
  }
};
window.ADVANCED_TECHNIQUES_DB = ADVANCED_TECHNIQUES_DB;
window.SFC_PROGRAMS_FORCE = SFC_PROGRAMS_FORCE;

var WEEKLY_SPLITS = {
  3: {name:'Push-Pull-Legs 3j', days:[{day:'Lundi',muscles:['pectoraux','epaules'],label:'Push \u2014 Pecs + \u00c9paules'},{day:'Mercredi',muscles:['dos','bras'],label:'Pull \u2014 Dos + Bras'},{day:'Vendredi',muscles:['jambes','fessiers_dedied'],label:'Legs \u2014 Jambes + Fessiers'}], notes:'Split PPL simplifi\u00e9 3j. Chaque groupe musculaire 1x/semaine avec volume concentr\u00e9. R\u00e9cup\u00e9ration optimale (72h min entre s\u00e9ances m\u00eames groupes). Id\u00e9al d\u00e9butants ou emploi du temps serr\u00e9.'},
  4: {name:'Heavy Duty 4j (Intensit\u00e9 Maximale)', days:[{day:'Lundi',muscles:['pectoraux','triceps_dedied'],label:'Push \u2014 Pecs + Triceps'},{day:'Mardi',muscles:['jambes'],label:'Legs \u2014 Jambes compl\u00e8tes'},{day:'Jeudi',muscles:['epaules','biceps_dedied'],label:'\u00c9paules + Biceps'},{day:'Vendredi',muscles:['dos'],label:'Pull \u2014 Dos + Ischios (Deadlift day)'}], notes:'Repos mercredi, samedi, dimanche. Chaque muscle 1x/semaine avec intensit\u00e9 MAXIMALE (M\u00e9thode Intensit\u00e9 Maximale). S\u00e9curit\u00e9 r\u00e9cup : pectoraux/triceps lundi, 72h repos, \u00e9paules/biceps jeudi, pecs et \u00e9paules ne se chevauchent pas. Qualit\u00e9 > quantit\u00e9.'},
  5: {name:'Split 5j (Pro)', days:[{day:'Lundi',muscles:['pectoraux'],label:'Pectoraux'},{day:'Mardi',muscles:['dos'],label:'Dos'},{day:'Mercredi',muscles:['epaules'],label:'\u00c9paules'},{day:'Jeudi',muscles:['bras'],label:'Bras'},{day:'Vendredi',muscles:['jambes'],label:'Jambes'}], notes:'Repos samedi et dimanche. Logique : pectoraux lundi \u2192 \u00e9paules mercredi (48h r\u00e9cup pecs avant sollicitation deltoide ant\u00e9rieur partag\u00e9) \u2192 bras jeudi (biceps + triceps frais) \u2192 jambes vendredi. DOS mardi = antago push du lundi. Structure optimale pour r\u00e9cup\u00e9ration et performance.'},
  6: {name:'PPL 6j', days:[{day:'Lundi',muscles:['pectoraux'],label:'Push: Pecs'},{day:'Mardi',muscles:['dos'],label:'Pull: Dos'},{day:'Mercredi',muscles:['jambes'],label:'Legs'},{day:'Jeudi',muscles:['epaules','triceps_dedied'],label:'Push: \u00c9paules + Triceps'},{day:'Vendredi',muscles:['dos','biceps_dedied'],label:'Pull: Dos + Biceps'},{day:'Samedi',muscles:['jambes','fessiers_dedied'],label:'Legs + Fessiers'}], notes:'PPL 6j professionnel. Chaque groupe stimul\u00e9 2x/semaine. Pecs lundi + \u00e9paules jeudi (3j r\u00e9cup du faisceau ant\u00e9rieur). Dos 2x/semaine (fr\u00e9quence optimale pour le grand dorsal). Jambes 2x/semaine = maximum de stimulation. REPOS DIMANCHE obligatoire \u2014 le surena\u00eeenement brise les gains.'}
};

function getPersonalizedProgram(muscleGroup, userProfile) {
  var S = userProfile || window.S || {};
  var goalKey = 'masse';
  if (S.sportGoals) {
    if (S.sportGoals.indexOf('shred') !== -1 || S.sportGoals.indexOf('weightloss') !== -1) goalKey = 'seche';
    if (S.sportGoals.indexOf('strength') !== -1 || S.sportGoals.indexOf('force') !== -1) goalKey = 'force';
  }

  // Phase FORCE → utilise SFC_PROGRAMS_FORCE dédié
  if (goalKey === 'force') {
    var forceEntry = SFC_PROGRAMS_FORCE[muscleGroup];
    if (forceEntry && forceEntry.force) {
      var forceResult; try { forceResult = JSON.parse(JSON.stringify(forceEntry.force)); } catch(e) { return null; }
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

  var program = SFC_PROGRAMS[muscleGroup];
  if (!program) return null;
  if (program.exercises) { try { return JSON.parse(JSON.stringify(program)); } catch(e) { return program; } }
  // Programmes dédiés (fessiers, abdos, biceps, triceps) utilisent des variations au lieu de masse/sèche
  if (program.variations) { try { return JSON.parse(JSON.stringify(program)); } catch(e) { return program; } }
  var template = program[goalKey] || program.masse;
  if (!template) return null;
  var result; try { result = JSON.parse(JSON.stringify(template)); } catch(e) { return null; }
  if (!result) return null;
  if (!result.exercises) result.exercises = [];
  if (S.sex === 'femme') {
    result.exercises.forEach(function(ex) {
      if (ex.type === 'compound' && goalKey === 'masse' && typeof ex.reps === 'number') ex.reps = Math.min(ex.reps + 2, 15);
    });
  }
  if (S.sportLevel === 'beginner') {
    result.exercises = result.exercises.slice(0, 5);
    result.exercises.forEach(function(ex) { if (typeof ex.sets === 'number') ex.sets = Math.max(2, ex.sets - 1); ex.technique = ex.technique || 'Concentrez-vous sur la technique avant la charge.'; });
    result.notes = (result.notes || '') + ' D\u00e9butant : concentrez-vous sur la technique avant les charges.';
  }
  if (S.sportFocus && typeof S.sportFocus === 'object') {
    var key = muscleGroup.replace('_dedied','');
    var pMap = {'pectoraux':'Poitrine','dos':'Dos','epaules':'\u00c9paules','bras':'Bras','jambes':'Jambes','fessiers':'Fessiers','abdos':'Abdominaux','trapezes':'Trap\u00e8zes','lombaires':'Lombaires'};
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
  var result; try { result = JSON.parse(JSON.stringify(base)); } catch(e) { return base; }
  if (!result) return base;
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
  var split; try { split = JSON.parse(JSON.stringify(base)); } catch(e) { return base; }
  if (!split) return base;
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
    var parentGroup = {fessiers_dedied:'jambes', abdos_dedied:'abdos', biceps_dedied:'bras', triceps_dedied:'bras'}[dediedKey] || 'jambes';
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

// === TRAINING STYLES ===

var YATES_PROGRAMS = {
  meta: {
    name: 'Heavy Duty',
    athlete: 'Méthode Intensité Maximale',
    philosophy: 'Intensité maximale, volume minimal. 1-2 séries de travail à l\'échec complet avec rest-pause et pre-exhaustion. Séances 35-45 min, 3-4j/sem.',
    frequency: '3-4 jours/semaine',
    session_duration: '35-45 min',
    key_principles: ['1-2 séries de travail', 'Échec musculaire complet', 'Rest-pause', 'Pre-exhaustion', 'Progression de charge chaque séance']
  },
  programs: {
    pectoraux: {
      beginner: {
        name: 'Heavy Duty Pectoraux — Débutant',
        description: 'Introduction à l\'intensité Heavy Duty. 2 séries de travail, tempo contrôlé.',
        exercises: [
          {order:1, name:'Écarté poulie haute (pre-exhaust)', sets:1, reps:'12-15', rest:'90s', technique:'Pre-exhaustion avant le composé. Contraction maximale en fin de mouvement. Descente 3s.', muscle:'pectoraux', type:'isolation', equipment:'poulie', rest_pause:false},
          {order:2, name:'Développé couché barre', sets:2, reps:'8-10', rest:'3min', technique:'2 séries de travail. Descente 4s contrôlée, explosion à la montée. Arrêt 1s en bas.', muscle:'pectoraux', type:'compound', equipment:'barre', rest_pause:false},
          {order:3, name:'Développé incliné haltères', sets:1, reps:'8-10', rest:'3min', technique:'1 série de travail intense. Focus sur la partie haute des pecs. Descente lente.', muscle:'pectoraux', type:'compound', equipment:'halteres', rest_pause:false},
          {order:4, name:'Écarté haltères plat', sets:1, reps:'10-12', rest:'2min', technique:'Finisher. Amplitude complète, arc naturel des bras. Contraction en haut.', muscle:'pectoraux', type:'isolation', equipment:'halteres', rest_pause:false}
        ]
      },
      intermediate: {
        name: 'Heavy Duty Pectoraux — Intermédiaire',
        description: 'Pre-exhaustion systématique. 1-2 séries à l\'échec avec technique rest-pause.',
        exercises: [
          {order:1, name:'Écarté poulie haute (pre-exhaust)', sets:1, reps:'10-12', rest:'60s', technique:'Pre-exhaust obligatoire. Pas de repos entre pre-exhaust et composé suivant. Contraction 2s en pic.', muscle:'pectoraux', type:'isolation', equipment:'poulie', rest_pause:false},
          {order:2, name:'Développé couché barre', sets:2, reps:'6-8', rest:'3min', technique:'Directement après pre-exhaust. Échec musculaire sur 2e série. Descente 4s, pause 1s en bas.', muscle:'pectoraux', type:'compound', equipment:'barre', rest_pause:true},
          {order:3, name:'Développé incliné Smith', sets:1, reps:'8-10', rest:'3min', technique:'1 série à l\'échec. Smith pour sécurité en solo. Chemin guidé = meilleure isolation.', muscle:'pectoraux', type:'compound', equipment:'smith', rest_pause:false},
          {order:4, name:'Pull-over haltère', sets:1, reps:'10-12', rest:'2min', technique:'Expansion de cage thoracique. Bras légèrement fléchis. Étirement maximal en bas.', muscle:'pectoraux', type:'isolation', equipment:'halteres', rest_pause:false}
        ]
      },
      advanced: {
        name: 'Heavy Duty Pectoraux — Avancé',
        description: 'Intensité maximale. Rest-pause, pre-exhaust + 1 série de travail à l\'échec absolu.',
        exercises: [
          {order:1, name:'Écarté poulie croisée (pre-exhaust)', sets:1, reps:'10-12', rest:'0s', technique:'Pre-exhaust sans repos avant le composé. Aller directement au développé couché. Brûlure maximale.', muscle:'pectoraux', type:'isolation', equipment:'poulie', rest_pause:false},
          {order:2, name:'Développé couché barre', sets:1, reps:'6-8', rest:'3min', technique:'1 série de travail à l\'échec complet. Descente 4s contrôlée, explosion à la montée. Rest-pause si nécessaire.', muscle:'pectoraux', type:'compound', equipment:'barre', rest_pause:true},
          {order:3, name:'Développé incliné haltères', sets:1, reps:'6-8', rest:'3min', technique:'1 série à l\'échec. Maximum d\'intensité. Partenaire de spot recommandé.', muscle:'pectoraux', type:'compound', equipment:'halteres', rest_pause:true},
          {order:4, name:'Écarté haltères incliné', sets:1, reps:'8-10', rest:'2min', technique:'Finisher intensif. Étirement profond, contraction peak. Descente 3s.', muscle:'pectoraux', type:'isolation', equipment:'halteres', rest_pause:false}
        ]
      }
    },
    dos: {
      beginner: {
        name: 'Heavy Duty Dos — Débutant',
        description: 'Apprentissage du tirage lourd. 2 séries de travail, connexion neuro-musculaire.',
        exercises: [
          {order:1, name:'Tirage horizontal poulie basse', sets:2, reps:'10-12', rest:'3min', technique:'2 séries de travail. Coudes collés au corps. Contraction 2s en fin. Descente contrôlée 3s.', muscle:'dos', type:'compound', equipment:'poulie', rest_pause:false},
          {order:2, name:'Tirage vertical poulie haute', sets:2, reps:'10-12', rest:'3min', technique:'Prise large. Tirer vers le sternum. Omoplate en rotation. Éviter de se balancer.', muscle:'dos', type:'compound', equipment:'poulie', rest_pause:false},
          {order:3, name:'Rowing haltère unilatéral', sets:1, reps:'10-12', rest:'2min', technique:'Appui sur banc. Amplitude complète. Focus sur le grand dorsal uniquement.', muscle:'dos', type:'compound', equipment:'halteres', rest_pause:false},
          {order:4, name:'Pull-over poulie basse', sets:1, reps:'12-15', rest:'2min', technique:'Isolation du grand dorsal. Bras tendus. Arc naturel du mouvement. Étirement complet en haut.', muscle:'dos', type:'isolation', equipment:'poulie', rest_pause:false}
        ]
      },
      intermediate: {
        name: 'Heavy Duty Dos — Intermédiaire',
        description: 'Pre-exhaustion avec pull-over. 1-2 séries à l\'échec sur rowing lourd.',
        exercises: [
          {order:1, name:'Pull-over poulie (pre-exhaust)', sets:1, reps:'12-15', rest:'0s', technique:'Pre-exhaust grand dorsal. Pas de repos avant le rowing. Isolation pure du dorsal.', muscle:'dos', type:'isolation', equipment:'poulie', rest_pause:false},
          {order:2, name:'Rowing barre penché', sets:2, reps:'6-8', rest:'3min', technique:'Prise pronation, barre soulevée vers le bas du ventre. Légère inclinaison. Échec sur 2e série.', muscle:'dos', type:'compound', equipment:'barre', rest_pause:true},
          {order:3, name:'Tirage vertical prise neutre', sets:1, reps:'8-10', rest:'3min', technique:'1 série à l\'échec. Prise neutre = meilleure activation grand dorsal. Coudes le long du corps.', muscle:'dos', type:'compound', equipment:'poulie', rest_pause:false},
          {order:4, name:'Tirage horizontal prise étroite', sets:1, reps:'8-10', rest:'2min', technique:'Focus sur les rhomboïdes. Coudes en arrière. Contraction peak 2s.', muscle:'dos', type:'compound', equipment:'poulie', rest_pause:false}
        ]
      },
      advanced: {
        name: 'Heavy Duty Dos — Avancé',
        description: 'Intensité maximale. Pre-exhaust + rowing penché à l\'échec absolu + rest-pause.',
        exercises: [
          {order:1, name:'Pull-over machine (pre-exhaust)', sets:1, reps:'12-15', rest:'0s', technique:'Pre-exhaust sans repos. Isolation parfaite du dorsal avant le composé lourd.', muscle:'dos', type:'isolation', equipment:'machine', rest_pause:false},
          {order:2, name:'Rowing barre penché', sets:1, reps:'6-8', rest:'3min', technique:'1 série à l\'échec absolu. Rest-pause: 10s repos puis 2-3 reps supplémentaires. Charge maximale.', muscle:'dos', type:'compound', equipment:'barre', rest_pause:true},
          {order:3, name:'Tirage vertical prise large', sets:1, reps:'6-8', rest:'3min', technique:'1 série à l\'échec. Amplitude complète. Étirement au sommet. Explosion vers le bas.', muscle:'dos', type:'compound', equipment:'poulie', rest_pause:true},
          {order:4, name:'Rowing machine bilatéral', sets:1, reps:'8-10', rest:'2min', technique:'Finisher. Concentration sur rhomboïdes et trapèzes. Squeeze à la fin.', muscle:'dos', type:'compound', equipment:'machine', rest_pause:false}
        ]
      }
    },
    epaules: {
      beginner: {
        name: 'Heavy Duty Épaules — Débutant',
        description: 'Développé lourd + isolation. 2 séries de travail, focus sur les 3 faisceaux.',
        exercises: [
          {order:1, name:'Développé militaire assis haltères', sets:2, reps:'8-10', rest:'3min', technique:'2 séries de travail. Descente contrôlée 3s. Pas de verrouillage des coudes en haut.', muscle:'epaules', type:'compound', equipment:'halteres', rest_pause:false},
          {order:2, name:'Élévations latérales haltères', sets:2, reps:'10-12', rest:'2min', technique:'2 séries. Pouces légèrement vers le bas. Élévation à 90°. Descente lente 3s.', muscle:'epaules', type:'isolation', equipment:'halteres', rest_pause:false},
          {order:3, name:'Élévations frontales haltères', sets:1, reps:'10-12', rest:'2min', technique:'1 série. Alternance ou bilatéral. Bras légèrement fléchis. Contraction en haut.', muscle:'epaules', type:'isolation', equipment:'halteres', rest_pause:false},
          {order:4, name:'Oiseau haltères (arrière)', sets:1, reps:'12-15', rest:'2min', technique:'Bustes penché. Focus sur le faisceau postérieur. Coudes légèrement fléchis.', muscle:'epaules', type:'isolation', equipment:'halteres', rest_pause:false}
        ]
      },
      intermediate: {
        name: 'Heavy Duty Épaules — Intermédiaire',
        description: 'Pre-exhaust latéral avant développé. 1-2 séries à l\'échec.',
        exercises: [
          {order:1, name:'Élévations latérales poulie basse (pre-exhaust)', sets:1, reps:'12-15', rest:'0s', technique:'Pre-exhaust faisceau moyen. Directement enchaîné avec développé. Tension continue.', muscle:'epaules', type:'isolation', equipment:'poulie', rest_pause:false},
          {order:2, name:'Développé militaire barre', sets:2, reps:'6-8', rest:'3min', technique:'Directement après pre-exhaust. Échec sur 2e série. Descente 4s, explosion.', muscle:'epaules', type:'compound', equipment:'barre', rest_pause:true},
          {order:3, name:'Élévations latérales haltères', sets:1, reps:'8-10', rest:'2min', technique:'1 série à l\'échec. Tempo 2-0-2. Contraction peak en haut.', muscle:'epaules', type:'isolation', equipment:'halteres', rest_pause:false},
          {order:4, name:'Oiseau poulie (arrière)', sets:1, reps:'10-12', rest:'2min', technique:'Finisher postérieur. Poulie basse. Bras croisés pour angle optimal.', muscle:'epaules', type:'isolation', equipment:'poulie', rest_pause:false}
        ]
      },
      advanced: {
        name: 'Heavy Duty Épaules — Avancé',
        description: 'Intensité maximale. Pre-exhaust + développé à l\'échec absolu + rest-pause.',
        exercises: [
          {order:1, name:'Élévations latérales machine (pre-exhaust)', sets:1, reps:'12-15', rest:'0s', technique:'Pre-exhaust sans repos. Machine = tension constante sur faisceau moyen.', muscle:'epaules', type:'isolation', equipment:'machine', rest_pause:false},
          {order:2, name:'Développé militaire barre', sets:1, reps:'6-8', rest:'3min', technique:'1 série à l\'échec absolu. Rest-pause: 10s, 2-3 reps. Partenaire de spot recommandé.', muscle:'epaules', type:'compound', equipment:'barre', rest_pause:true},
          {order:3, name:'Élévations latérales haltères', sets:1, reps:'8-10', rest:'2min', technique:'1 série à l\'échec. Descente 4s, montée explosive. Drop set si possible.', muscle:'epaules', type:'isolation', equipment:'halteres', rest_pause:true},
          {order:4, name:'Face pull poulie haute', sets:1, reps:'12-15', rest:'2min', technique:'Finisher rotation externe. Coudes hauts. Protection de la coiffe des rotateurs.', muscle:'epaules', type:'isolation', equipment:'poulie', rest_pause:false}
        ]
      }
    },
    bras: {
      beginner: {
        name: 'Heavy Duty Bras — Débutant',
        description: 'Curl + extensions. 2 séries de travail, bon tempo.',
        exercises: [
          {order:1, name:'Curl barre droit', sets:2, reps:'8-10', rest:'2min', technique:'2 séries. Coudes fixes. Descente 3s. Pas de balancement du tronc.', muscle:'bras', type:'compound', equipment:'barre', rest_pause:false},
          {order:2, name:'Extensions triceps poulie haute', sets:2, reps:'10-12', rest:'2min', technique:'2 séries. Coudes fixes. Descente 3s, extension complète. Concentration peak.', muscle:'bras', type:'isolation', equipment:'poulie', rest_pause:false},
          {order:3, name:'Curl incliné haltères', sets:1, reps:'10-12', rest:'2min', technique:'Étirement biceps maximal en bas. Supination en montant. Contraction peak.', muscle:'bras', type:'isolation', equipment:'halteres', rest_pause:false},
          {order:4, name:'Dips triceps banc', sets:1, reps:'10-12', rest:'2min', technique:'Bras tendus derrière. Descente profonde. Poids corporel ou lestage léger.', muscle:'bras', type:'compound', equipment:'banc', rest_pause:false}
        ]
      },
      intermediate: {
        name: 'Heavy Duty Bras — Intermédiaire',
        description: 'Pre-exhaust biceps + triceps. 1-2 séries à l\'échec.',
        exercises: [
          {order:1, name:'Curl poulie basse (pre-exhaust biceps)', sets:1, reps:'12-15', rest:'0s', technique:'Pre-exhaust biceps. Tension constante. Directement enchaîné avec curl barre.', muscle:'bras', type:'isolation', equipment:'poulie', rest_pause:false},
          {order:2, name:'Curl barre EZ', sets:2, reps:'6-8', rest:'2min', technique:'Après pre-exhaust. Échec sur 2e série. Descente 4s. Explosion en montant.', muscle:'bras', type:'compound', equipment:'barre', rest_pause:true},
          {order:3, name:'Extensions haltère unilatéral (pre-exhaust triceps)', sets:1, reps:'12-15', rest:'0s', technique:'Pre-exhaust triceps. Coude fixe. Étirement profond en bas.', muscle:'bras', type:'isolation', equipment:'halteres', rest_pause:false},
          {order:4, name:'Dips lestés', sets:1, reps:'6-8', rest:'2min', technique:'1 série à l\'échec. Buste droit = triceps. Descente 3s. Poids ajouté.', muscle:'bras', type:'compound', equipment:'barres_paralleles', rest_pause:true}
        ]
      },
      advanced: {
        name: 'Heavy Duty Bras — Avancé',
        description: 'Intensité maximale bras. Pre-exhaust + rest-pause sur les deux groupes.',
        exercises: [
          {order:1, name:'Curl concentré (pre-exhaust)', sets:1, reps:'12-15', rest:'0s', technique:'Pre-exhaust biceps. Isolation totale. Contraction 2s en haut.', muscle:'bras', type:'isolation', equipment:'halteres', rest_pause:false},
          {order:2, name:'Curl barre EZ', sets:1, reps:'6-8', rest:'2min', technique:'1 série à l\'échec absolu. Rest-pause 10s puis 2-3 reps. Charge maximale.', muscle:'bras', type:'compound', equipment:'barre', rest_pause:true},
          {order:3, name:'Extensions triceps poulie (pre-exhaust)', sets:1, reps:'12-15', rest:'0s', technique:'Pre-exhaust triceps. Prise corde. Directement avant dips.', muscle:'bras', type:'isolation', equipment:'poulie', rest_pause:false},
          {order:4, name:'Dips lestés', sets:1, reps:'6-8', rest:'2min', technique:'1 série à l\'échec. Rest-pause 10s puis 2-3 reps. Lestage maximal.', muscle:'bras', type:'compound', equipment:'barres_paralleles', rest_pause:true}
        ]
      }
    },
    jambes: {
      beginner: {
        name: 'Heavy Duty Jambes — Débutant',
        description: 'Squat lourd + leg press. 2 séries de travail, technique parfaite.',
        exercises: [
          {order:1, name:'Leg extension (pre-exhaust)', sets:1, reps:'12-15', rest:'0s', technique:'Pre-exhaust quadriceps. Directement enchaîné avec squat. Isolation pure.', muscle:'jambes', type:'isolation', equipment:'machine', rest_pause:false},
          {order:2, name:'Squat barre', sets:2, reps:'8-10', rest:'3min', technique:'2 séries de travail. Descente 4s. Profondeur parallèle. Explosion en montant.', muscle:'jambes', type:'compound', equipment:'barre', rest_pause:false},
          {order:3, name:'Leg curl couché', sets:2, reps:'10-12', rest:'2min', technique:'2 séries ischio-jambiers. Descente lente 4s. Contraction peak en haut.', muscle:'jambes', type:'isolation', equipment:'machine', rest_pause:false},
          {order:4, name:'Mollets debout machine', sets:2, reps:'12-15', rest:'90s', technique:'Amplitude complète. Pause 2s en haut. Descente lente. Étirement complet en bas.', muscle:'jambes', type:'isolation', equipment:'machine', rest_pause:false}
        ]
      },
      intermediate: {
        name: 'Heavy Duty Jambes — Intermédiaire',
        description: 'Pre-exhaust + squat à l\'échec. Haute intensité jambes.',
        exercises: [
          {order:1, name:'Leg extension (pre-exhaust)', sets:1, reps:'12-15', rest:'0s', technique:'Pre-exhaust sans repos avant squat. Brûlure des quadriceps garantie.', muscle:'jambes', type:'isolation', equipment:'machine', rest_pause:false},
          {order:2, name:'Squat barre', sets:2, reps:'6-8', rest:'3min', technique:'Directement après leg extension. Échec sur 2e série. Rest-pause si besoin.', muscle:'jambes', type:'compound', equipment:'barre', rest_pause:true},
          {order:3, name:'Leg curl assis', sets:1, reps:'8-10', rest:'2min', technique:'1 série à l\'échec ischio. Tension constante. Descente 4s.', muscle:'jambes', type:'isolation', equipment:'machine', rest_pause:false},
          {order:4, name:'Mollets assis machine', sets:2, reps:'12-15', rest:'90s', technique:'Amplitude maximale. Étirement profond en bas. Contraction peak 2s.', muscle:'jambes', type:'isolation', equipment:'machine', rest_pause:false}
        ]
      },
      advanced: {
        name: 'Heavy Duty Jambes — Avancé',
        description: 'Intensité jambes maximale. Pre-exhaust + squat rest-pause + leg press.',
        exercises: [
          {order:1, name:'Leg extension (pre-exhaust)', sets:1, reps:'12-15', rest:'0s', technique:'Pre-exhaust maximal. Sans repos enchaîné au squat. Brûlure intense.', muscle:'jambes', type:'isolation', equipment:'machine', rest_pause:false},
          {order:2, name:'Squat barre', sets:1, reps:'6-8', rest:'3min', technique:'1 série à l\'échec absolu. Rest-pause 15s puis 2-3 reps. Charge maximale.', muscle:'jambes', type:'compound', equipment:'barre', rest_pause:true},
          {order:3, name:'Leg press 45°', sets:1, reps:'8-10', rest:'3min', technique:'1 série à l\'échec. Pieds hauts = ischio/fessiers. Amplitude complète.', muscle:'jambes', type:'compound', equipment:'machine', rest_pause:true},
          {order:4, name:'Leg curl couché', sets:1, reps:'8-10', rest:'2min', technique:'1 série à l\'échec ischio. Rest-pause si possible. Descente 4s.', muscle:'jambes', type:'isolation', equipment:'machine', rest_pause:true}
        ]
      }
    },
    fessiers: {
      beginner: {
        name: 'Heavy Duty Fessiers — Débutant',
        description: 'Hip thrust + squat bulgare. Focus fessiers, technique lente.',
        exercises: [
          {order:1, name:'Hip thrust barre', sets:2, reps:'10-12', rest:'2min', technique:'2 séries. Contraction maximale en haut 2s. Descente 3s. Bascule du bassin.', muscle:'fessiers', type:'compound', equipment:'barre', rest_pause:false},
          {order:2, name:'Squat bulgare haltères', sets:2, reps:'10-12', rest:'2min', technique:'2 séries. Pied arrière sur banc. Descente 3s. Genou avant sur pointe de pied.', muscle:'fessiers', type:'compound', equipment:'halteres', rest_pause:false},
          {order:3, name:'Donkey kicks machine', sets:1, reps:'12-15', rest:'2min', technique:'Isolation fessiers. Extension de hanche complète. Contraction peak.', muscle:'fessiers', type:'isolation', equipment:'machine', rest_pause:false},
          {order:4, name:'Abduction machine', sets:1, reps:'15-20', rest:'90s', technique:'Fessier moyen. Mouvement contrôlé. Contraction en fin d\'amplitude.', muscle:'fessiers', type:'isolation', equipment:'machine', rest_pause:false}
        ]
      },
      intermediate: {
        name: 'Heavy Duty Fessiers — Intermédiaire',
        description: 'Pre-exhaust + hip thrust lourd à l\'échec.',
        exercises: [
          {order:1, name:'Abduction poulie (pre-exhaust)', sets:1, reps:'15-20', rest:'0s', technique:'Pre-exhaust fessier moyen. Directement enchaîné avec hip thrust.', muscle:'fessiers', type:'isolation', equipment:'poulie', rest_pause:false},
          {order:2, name:'Hip thrust barre', sets:2, reps:'8-10', rest:'2min', technique:'Après pre-exhaust. Charge maximale. Contraction 2s en haut. Échec sur 2e série.', muscle:'fessiers', type:'compound', equipment:'barre', rest_pause:true},
          {order:3, name:'Fentes avant haltères', sets:1, reps:'10-12', rest:'2min', technique:'1 série à l\'échec. Pas large. Genou avant à 90°. Poussée sur talon.', muscle:'fessiers', type:'compound', equipment:'halteres', rest_pause:false},
          {order:4, name:'Kick-back poulie basse', sets:1, reps:'12-15', rest:'90s', technique:'Finisher isolation. Extension de hanche complète. Contraction 2s.', muscle:'fessiers', type:'isolation', equipment:'poulie', rest_pause:false}
        ]
      },
      advanced: {
        name: 'Heavy Duty Fessiers — Avancé',
        description: 'Intensité maximale fessiers. Pre-exhaust + hip thrust rest-pause.',
        exercises: [
          {order:1, name:'Donkey kicks (pre-exhaust)', sets:1, reps:'15-20', rest:'0s', technique:'Pre-exhaust sans repos avant hip thrust. Activation maximale des fessiers.', muscle:'fessiers', type:'isolation', equipment:'machine', rest_pause:false},
          {order:2, name:'Hip thrust barre', sets:1, reps:'8-10', rest:'2min', technique:'1 série à l\'échec absolu. Rest-pause 10s puis 3 reps. Charge maximale.', muscle:'fessiers', type:'compound', equipment:'barre', rest_pause:true},
          {order:3, name:'Squat bulgare barre', sets:1, reps:'8-10', rest:'2min', technique:'1 série à l\'échec. Charge lourde. Focus fessiers. Descente 4s.', muscle:'fessiers', type:'compound', equipment:'barre', rest_pause:true},
          {order:4, name:'Abduction machine', sets:1, reps:'15-20', rest:'90s', technique:'Finisher fessier moyen. Contraction intense. Tension constante.', muscle:'fessiers', type:'isolation', equipment:'machine', rest_pause:false}
        ]
      }
    }
  },
  splits: {
    3: {
      name: 'Heavy Duty 3 jours',
      description: 'Split Intensité classique. 3 séances/semaine avec jours de repos entre chaque.',
      days: [
        {day:1, label:'Pectoraux + Dos', muscles:['pectoraux','dos']},
        {day:2, label:'Repos'},
        {day:3, label:'Épaules + Bras', muscles:['epaules','bras']},
        {day:4, label:'Repos'},
        {day:5, label:'Jambes + Fessiers', muscles:['jambes','fessiers']},
        {day:6, label:'Repos'},
        {day:7, label:'Repos'}
      ]
    },
    4: {
      name: 'Heavy Duty 4 jours',
      description: 'Split 4 jours. Chaque groupe musculaire 1x/sem avec intensité maximale.',
      days: [
        {day:1, label:'Pectoraux + Triceps', muscles:['pectoraux','bras']},
        {day:2, label:'Dos + Biceps', muscles:['dos','bras']},
        {day:3, label:'Repos'},
        {day:4, label:'Épaules + Bras', muscles:['epaules','bras']},
        {day:5, label:'Jambes + Fessiers', muscles:['jambes','fessiers']},
        {day:6, label:'Repos'},
        {day:7, label:'Repos'}
      ]
    }
  },
  macro_cycle_12w: [
    {week:1, phase:'Adaptation', intensity:'70%', focus:'Apprentissage technique Heavy Duty. Trouver les charges de travail. 2 séries/exercice.'},
    {week:2, phase:'Adaptation', intensity:'75%', focus:'Augmenter les charges. Introduire la pre-exhaustion. Observer les réponses.'},
    {week:3, phase:'Intensification', intensity:'80%', focus:'Introduire rest-pause sur composés principaux. 1 série de travail.'},
    {week:4, phase:'Intensification', intensity:'85%', focus:'Progression de charge obligatoire. Rest-pause systématique.'},
    {week:5, phase:'Surcharge', intensity:'90%', focus:'Charges maximales. Pre-exhaust + rest-pause sur chaque muscle.'},
    {week:6, phase:'Surcharge', intensity:'92%', focus:'Atteindre l\'échec absolu sur chaque série de travail.'},
    {week:7, phase:'Peak', intensity:'95%', focus:'Intensité maximale. PRs sur tous les exercices composés.'},
    {week:8, phase:'Peak', intensity:'97%', focus:'Surcharge progressive. Chercher nouveaux PRs chaque séance.'},
    {week:9, phase:'Décharge', intensity:'60%', volume_modifier:0.5, isDeload:true, focus:'Réduction volume et intensité. Récupération active. Maintien technique.'},
    {week:10, phase:'Transition', intensity:'75%', focus:'Reprise progressive. Évaluation des gains. Ajustement du programme.'},
    {week:11, phase:'Nouveau cycle', intensity:'80%', focus:'Recommencer avec charges supérieures. Nouveaux objectifs.'},
    {week:12, phase:'Bilan', intensity:'85%', focus:'Évaluation finale. Photos, mensurations. Planification cycle suivant.'}
  ]
};

var COLEMAN_PROGRAMS = {
  meta: {
    name: 'High Volume',
    athlete: 'Méthode Volume Progressif',
    philosophy: 'Volume extrême, fréquence élevée. 5+ séries, 20-25 sets/muscle/sem. Supersets, drop sets. Ain\'t nothing but a peanut! 4-6j/sem.',
    frequency: '4-6 jours/semaine',
    session_duration: '60-90 min',
    key_principles: ['Volume élevé 5+ séries', 'Supersets et drop sets', '20-25 sets/muscle/sem', 'Fréquence 4-6j/sem', 'Progression de charge constante']
  },
  programs: {
    pectoraux: {
      beginner: {
        name: 'High Volume Pectoraux — Débutant',
        description: 'Introduction au Volume Progressif. 4-5 exercices, 3-4 séries chacun.',
        exercises: [
          {order:1, name:'Développé couché barre', sets:4, reps:'10-12', rest:'90s', technique:'4 séries de travail. Montée progressive des charges. Descente 2s, explosion. Amplitude complète.', muscle:'pectoraux', type:'compound', equipment:'barre', rest_pause:false},
          {order:2, name:'Développé incliné haltères', sets:3, reps:'10-12', rest:'90s', technique:'3 séries. Focus partie haute. Descente jusqu\'à étirement complet. Pousser vers le plafond.', muscle:'pectoraux', type:'compound', equipment:'halteres', rest_pause:false},
          {order:3, name:'Développé décliné barre', sets:3, reps:'10-12', rest:'90s', technique:'3 séries partie basse. Contrôle du mouvement. Partenaire pour sécurité.', muscle:'pectoraux', type:'compound', equipment:'barre', rest_pause:false},
          {order:4, name:'Écarté haltères plat', sets:3, reps:'12-15', rest:'60s', technique:'3 séries isolation. Bras légèrement fléchis. Arc naturel. Étirement profond.', muscle:'pectoraux', type:'isolation', equipment:'halteres', rest_pause:false},
          {order:5, name:'Pompes lestées', sets:3, reps:'15-20', rest:'60s', technique:'Finisher. Amplitude complète. Descente profonde. Lestage si nécessaire.', muscle:'pectoraux', type:'compound', equipment:'poids_corps', rest_pause:false}
        ]
      },
      intermediate: {
        name: 'High Volume Pectoraux — Intermédiaire',
        description: 'Volume Progressif intermédiaire. 5 exercices, supersets en fin de séance.',
        exercises: [
          {order:1, name:'Développé couché barre', sets:5, reps:'8-12', rest:'90s', technique:'5 séries. Pyramide montante. Dernier set le plus lourd. Amplitude complète.', muscle:'pectoraux', type:'compound', equipment:'barre', rest_pause:false},
          {order:2, name:'Développé incliné barre', sets:4, reps:'10-12', rest:'90s', technique:'4 séries. 30° d\'inclinaison. Contrôle total. Isolation partie haute.', muscle:'pectoraux', type:'compound', equipment:'barre', rest_pause:false},
          {order:3, name:'Développé haltères plat', sets:4, reps:'10-12', rest:'90s', technique:'4 séries. Amplitude supérieure à la barre. Rotation des poignets en haut.', muscle:'pectoraux', type:'compound', equipment:'halteres', rest_pause:false},
          {order:4, name:'Écarté poulie croisée', sets:3, reps:'12-15', rest:'60s', technique:'3 séries. Tension constante sur tout le mouvement. Contraction en fin.', muscle:'pectoraux', type:'isolation', equipment:'poulie', superset_with:'pull-over'},
          {order:5, name:'Écarté haltères incliné', sets:3, reps:'12-15', rest:'60s', technique:'Superset avec écarté poulie. Sans repos entre les deux. Volume maximal.', muscle:'pectoraux', type:'isolation', equipment:'halteres', rest_pause:false}
        ]
      },
      advanced: {
        name: 'High Volume Pectoraux — Avancé',
        description: 'Volume Progressif maximum. 6 exercices, drop sets, supersets, 25+ séries totales.',
        exercises: [
          {order:1, name:'Développé couché barre', sets:5, reps:'6-10', rest:'2min', technique:'5 séries lourdes. Dernier set drop set (-20% charge, max reps). Amplitude complète.', muscle:'pectoraux', type:'compound', equipment:'barre', rest_pause:false},
          {order:2, name:'Développé incliné barre', sets:5, reps:'8-12', rest:'90s', technique:'5 séries. Montée progressive. 4e et 5e séries à l\'échec. Focus haut des pecs.', muscle:'pectoraux', type:'compound', equipment:'barre', rest_pause:false},
          {order:3, name:'Développé décliné haltères', sets:4, reps:'10-12', rest:'90s', technique:'4 séries. Partie inférieure. Amplitude maximale. Rotation en haut.', muscle:'pectoraux', type:'compound', equipment:'halteres', rest_pause:false},
          {order:4, name:'Écarté haltères plat', sets:4, reps:'12-15', rest:'60s', technique:'4 séries. Superset avec écarté poulie. 0s de repos entre les deux exercices.', muscle:'pectoraux', type:'isolation', equipment:'halteres', superset_with:'ecartes_poulie'},
          {order:5, name:'Écarté poulie croisée', sets:4, reps:'12-15', rest:'60s', technique:'Superset suite. Tension constante. Drop set sur dernière série.', muscle:'pectoraux', type:'isolation', equipment:'poulie', rest_pause:false},
          {order:6, name:'Push-up lestés', sets:3, reps:'15-20', rest:'60s', technique:'Finisher. Amplitude complète. Sans repos entre séries si possible.', muscle:'pectoraux', type:'compound', equipment:'poids_corps', rest_pause:false}
        ]
      }
    },
    dos: {
      beginner: {
        name: 'High Volume Dos — Débutant',
        description: 'Volume Progressif dos débutant. 4-5 exercices, multiples angles.',
        exercises: [
          {order:1, name:'Tirage vertical prise large', sets:4, reps:'10-12', rest:'90s', technique:'4 séries. Prise large pronation. Tirer vers le sternum. Omoplate en rotation.', muscle:'dos', type:'compound', equipment:'poulie', rest_pause:false},
          {order:2, name:'Rowing barre', sets:4, reps:'10-12', rest:'90s', technique:'4 séries. Buste à 45°. Barre vers nombril. Contraction peak. Descente contrôlée.', muscle:'dos', type:'compound', equipment:'barre', rest_pause:false},
          {order:3, name:'Tirage horizontal poulie basse', sets:3, reps:'10-12', rest:'90s', technique:'3 séries. Prise neutre. Coudes collés. Squeeze rhomboïdes.', muscle:'dos', type:'compound', equipment:'poulie', rest_pause:false},
          {order:4, name:'Rowing haltère unilatéral', sets:3, reps:'10-12', rest:'60s', technique:'3 séries par bras. Focus grand dorsal. Amplitude complète. Rotation d\'épaule.', muscle:'dos', type:'compound', equipment:'halteres', rest_pause:false},
          {order:5, name:'Pull-over haltère', sets:3, reps:'12-15', rest:'60s', technique:'Isolation grand dorsal. Bras légèrement fléchis. Expansion thoracique.', muscle:'dos', type:'isolation', equipment:'halteres', rest_pause:false}
        ]
      },
      intermediate: {
        name: 'High Volume Dos — Intermédiaire',
        description: 'Volume Progressif dos intermédiaire. Supersets, 5 exercices.',
        exercises: [
          {order:1, name:'Tractions pronation', sets:5, reps:'8-10', rest:'90s', technique:'5 séries. Lestage si nécessaire. Amplitude complète. Étirement en haut.', muscle:'dos', type:'compound', equipment:'barre_de_traction', rest_pause:false},
          {order:2, name:'Rowing barre penché', sets:5, reps:'8-12', rest:'90s', technique:'5 séries. Prise pronation. Coudes hauts. Tirer vers bas ventre.', muscle:'dos', type:'compound', equipment:'barre', rest_pause:false},
          {order:3, name:'Tirage vertical prise étroite', sets:4, reps:'10-12', rest:'90s', technique:'4 séries. Prise neutre rapprochée. Coudes devant. Meilleure activation dorsale.', muscle:'dos', type:'compound', equipment:'poulie', rest_pause:false},
          {order:4, name:'Rowing machine bilatéral', sets:3, reps:'12-15', rest:'60s', technique:'3 séries. Superset avec pull-over. 0s repos. Volume maximal.', muscle:'dos', type:'compound', equipment:'machine', superset_with:'pull_over'},
          {order:5, name:'Pull-over poulie', sets:3, reps:'12-15', rest:'60s', technique:'Superset suite. Grand dorsal isolé. Arc complet du mouvement.', muscle:'dos', type:'isolation', equipment:'poulie', rest_pause:false}
        ]
      },
      advanced: {
        name: 'High Volume Dos — Avancé',
        description: 'Volume Progressif dos maximum. 6 exercices, drop sets, 25+ séries.',
        exercises: [
          {order:1, name:'Tractions lestées', sets:5, reps:'6-10', rest:'2min', technique:'5 séries lourdes. Dernier set drop (enlever lest, max reps). Amplitude totale.', muscle:'dos', type:'compound', equipment:'barre_de_traction', rest_pause:false},
          {order:2, name:'Rowing barre', sets:5, reps:'8-12', rest:'90s', technique:'5 séries. Progression de charge. 5e série drop set. Contraction maximale.', muscle:'dos', type:'compound', equipment:'barre', rest_pause:false},
          {order:3, name:'Tirage vertical machine', sets:4, reps:'10-12', rest:'90s', technique:'4 séries. Machine = position stable. Focus isolation grand dorsal.', muscle:'dos', type:'compound', equipment:'machine', rest_pause:false},
          {order:4, name:'Rowing haltère unilatéral', sets:4, reps:'10-12', rest:'60s', technique:'4 séries/côté. Superset avec rowing machine. Volume extrême.', muscle:'dos', type:'compound', equipment:'halteres', superset_with:'rowing_machine'},
          {order:5, name:'Tirage horizontal prise large', sets:3, reps:'12-15', rest:'60s', technique:'3 séries. Rhomboïdes et trapèze moyen. Coudes en arrière max.', muscle:'dos', type:'compound', equipment:'poulie', rest_pause:false},
          {order:6, name:'Pull-over haltère', sets:3, reps:'12-15', rest:'60s', technique:'Finisher isolation. Expansion thoracique. Drop set dernière série.', muscle:'dos', type:'isolation', equipment:'halteres', rest_pause:false}
        ]
      }
    },
    epaules: {
      beginner: {
        name: 'High Volume Épaules — Débutant',
        description: 'Volume Progressif épaules débutant. 4-5 exercices, tous faisceaux.',
        exercises: [
          {order:1, name:'Développé militaire barre', sets:4, reps:'10-12', rest:'90s', technique:'4 séries. Descente 3s, explosion. Pas de verrouillage. Amplitude complète.', muscle:'epaules', type:'compound', equipment:'barre', rest_pause:false},
          {order:2, name:'Développé haltères assis', sets:3, reps:'10-12', rest:'90s', technique:'3 séries. Amplitude complète. Rotation naturelle des poignets. Contrôle.', muscle:'epaules', type:'compound', equipment:'halteres', rest_pause:false},
          {order:3, name:'Élévations latérales haltères', sets:4, reps:'12-15', rest:'60s', technique:'4 séries. Pouces légèrement vers le bas. Élévation à 90°. Descente lente.', muscle:'epaules', type:'isolation', equipment:'halteres', rest_pause:false},
          {order:4, name:'Élévations frontales haltères', sets:3, reps:'12-15', rest:'60s', technique:'3 séries alternées. Bras légèrement fléchis. Contraction en haut.', muscle:'epaules', type:'isolation', equipment:'halteres', rest_pause:false},
          {order:5, name:'Oiseau haltères (arrière)', sets:3, reps:'12-15', rest:'60s', technique:'3 séries. Buste penché. Focus faisceau postérieur. Contraction peak.', muscle:'epaules', type:'isolation', equipment:'halteres', rest_pause:false}
        ]
      },
      intermediate: {
        name: 'High Volume Épaules — Intermédiaire',
        description: 'Volume Progressif épaules intermédiaire. Supersets, 5 exercices.',
        exercises: [
          {order:1, name:'Développé militaire barre', sets:5, reps:'8-12', rest:'90s', technique:'5 séries. Montée progressive. Dernier set drop set. Amplitude complète.', muscle:'epaules', type:'compound', equipment:'barre', rest_pause:false},
          {order:2, name:'Élévations latérales haltères', sets:4, reps:'12-15', rest:'60s', technique:'4 séries. Superset avec élévations frontales. 0s repos entre les deux.', muscle:'epaules', type:'isolation', equipment:'halteres', superset_with:'elevations_frontales'},
          {order:3, name:'Élévations frontales haltères', sets:4, reps:'12-15', rest:'60s', technique:'Superset suite. Faisceau antérieur. Bras alternés.', muscle:'epaules', type:'isolation', equipment:'halteres', rest_pause:false},
          {order:4, name:'Oiseau poulie basse', sets:3, reps:'12-15', rest:'60s', technique:'3 séries postérieur. Poulies croisées. Amplitude complète.', muscle:'epaules', type:'isolation', equipment:'poulie', rest_pause:false},
          {order:5, name:'Élévations latérales machine', sets:3, reps:'12-15', rest:'60s', technique:'Finisher. Tension constante machine. Drop set dernière série.', muscle:'epaules', type:'isolation', equipment:'machine', rest_pause:false}
        ]
      },
      advanced: {
        name: 'High Volume Épaules — Avancé',
        description: 'Volume Progressif max épaules. 6 exercices, drop sets, 25+ séries.',
        exercises: [
          {order:1, name:'Développé militaire barre', sets:5, reps:'6-10', rest:'2min', technique:'5 séries lourdes. Drop set dernière série. Amplitude complète.', muscle:'epaules', type:'compound', equipment:'barre', rest_pause:false},
          {order:2, name:'Développé haltères debout', sets:4, reps:'10-12', rest:'90s', technique:'4 séries. Instabilité = plus de deltoïdes. Amplitude maximum.', muscle:'epaules', type:'compound', equipment:'halteres', rest_pause:false},
          {order:3, name:'Élévations latérales haltères', sets:5, reps:'12-15', rest:'60s', technique:'5 séries. Superset avec élévations poulie. Volume extrême faisceau moyen.', muscle:'epaules', type:'isolation', equipment:'halteres', superset_with:'elevations_poulie'},
          {order:4, name:'Élévations latérales poulie basse', sets:5, reps:'12-15', rest:'60s', technique:'Superset suite. Tension constante poulie. Drop set dernière série.', muscle:'epaules', type:'isolation', equipment:'poulie', rest_pause:false},
          {order:5, name:'Oiseau machine', sets:4, reps:'12-15', rest:'60s', technique:'4 séries postérieur. Amplitude complète. Squeeze en fin de mouvement.', muscle:'epaules', type:'isolation', equipment:'machine', rest_pause:false},
          {order:6, name:'Face pull prise corde', sets:3, reps:'15-20', rest:'60s', technique:'Finisher rotation externe. Coudes hauts. Santé des épaules.', muscle:'epaules', type:'isolation', equipment:'poulie', rest_pause:false}
        ]
      }
    },
    bras: {
      beginner: {
        name: 'High Volume Bras — Débutant',
        description: 'Volume Progressif bras débutant. Biceps + triceps, volume équilibré.',
        exercises: [
          {order:1, name:'Curl barre EZ', sets:4, reps:'10-12', rest:'60s', technique:'4 séries biceps. Descente lente 3s. Pas de balancement. Coudes fixes.', muscle:'bras', type:'compound', equipment:'barre', rest_pause:false},
          {order:2, name:'Curl incliné haltères', sets:3, reps:'10-12', rest:'60s', technique:'3 séries. Étirement maximal. Supination en montant. Contraction peak.', muscle:'bras', type:'isolation', equipment:'halteres', rest_pause:false},
          {order:3, name:'Extensions triceps poulie haute', sets:4, reps:'10-12', rest:'60s', technique:'4 séries triceps. Coudes fixes. Extension complète. Descente contrôlée.', muscle:'bras', type:'isolation', equipment:'poulie', rest_pause:false},
          {order:4, name:'Dips triceps banc lestés', sets:3, reps:'10-12', rest:'60s', technique:'3 séries. Buste droit = triceps. Descente profonde. Lestage progressif.', muscle:'bras', type:'compound', equipment:'banc', rest_pause:false},
          {order:5, name:'Curl marteau haltères', sets:3, reps:'12-15', rest:'60s', technique:'3 séries. Supination neutre. Brachioradial et biceps. Alternés.', muscle:'bras', type:'isolation', equipment:'halteres', rest_pause:false}
        ]
      },
      intermediate: {
        name: 'High Volume Bras — Intermédiaire',
        description: 'Volume Progressif bras intermédiaire. Supersets biceps/triceps.',
        exercises: [
          {order:1, name:'Curl barre', sets:5, reps:'8-12', rest:'60s', technique:'5 séries. Superset avec extensions. Volume biceps maximum.', muscle:'bras', type:'compound', equipment:'barre', superset_with:'extensions_triceps'},
          {order:2, name:'Extensions triceps poulie', sets:5, reps:'8-12', rest:'60s', technique:'Superset suite. Coudes fixes. Extension complète. Drop set dernière série.', muscle:'bras', type:'isolation', equipment:'poulie', rest_pause:false},
          {order:3, name:'Curl incliné haltères', sets:4, reps:'10-12', rest:'60s', technique:'4 séries. Étirement maximal. Isolation biceps long.', muscle:'bras', type:'isolation', equipment:'halteres', rest_pause:false},
          {order:4, name:'Dips lestés', sets:4, reps:'8-10', rest:'90s', technique:'4 séries triceps. Buste droit. Lestage progressif. Amplitude complète.', muscle:'bras', type:'compound', equipment:'barres_paralleles', rest_pause:false},
          {order:5, name:'Curl concentré', sets:3, reps:'12-15', rest:'60s', technique:'Finisher biceps. Isolation totale. Contraction 2s en haut.', muscle:'bras', type:'isolation', equipment:'halteres', rest_pause:false}
        ]
      },
      advanced: {
        name: 'High Volume Bras — Avancé',
        description: 'Volume Progressif max bras. 6 exercices, supersets, drop sets.',
        exercises: [
          {order:1, name:'Curl barre EZ', sets:5, reps:'8-12', rest:'60s', technique:'5 séries lourdes. Superset avec skull crushers. Volume extrême.', muscle:'bras', type:'compound', equipment:'barre', superset_with:'skull_crushers'},
          {order:2, name:'Skull crushers barre EZ', sets:5, reps:'8-12', rest:'60s', technique:'Superset suite triceps. Coudes fixes. Contrôle total. Drop set finale.', muscle:'bras', type:'isolation', equipment:'barre', rest_pause:false},
          {order:3, name:'Curl incliné haltères', sets:4, reps:'10-12', rest:'60s', technique:'4 séries. Superset avec extensions sur banc. 0s repos.', muscle:'bras', type:'isolation', equipment:'halteres', superset_with:'extensions_banc'},
          {order:4, name:'Extensions allongé haltères', sets:4, reps:'10-12', rest:'60s', technique:'Superset suite. Coudes vers le plafond. Amplitude complète.', muscle:'bras', type:'isolation', equipment:'halteres', rest_pause:false},
          {order:5, name:'Curl poulie basse', sets:3, reps:'12-15', rest:'60s', technique:'Finisher biceps. Tension constante. Drop set.', muscle:'bras', type:'isolation', equipment:'poulie', rest_pause:false},
          {order:6, name:'Extensions triceps poulie corde', sets:3, reps:'12-15', rest:'60s', technique:'Finisher triceps. Séparation des têtes. Drop set.', muscle:'bras', type:'isolation', equipment:'poulie', rest_pause:false}
        ]
      }
    },
    jambes: {
      beginner: {
        name: 'High Volume Jambes — Débutant',
        description: 'Volume Progressif jambes débutant. Squat + leg press + isolation.',
        exercises: [
          {order:1, name:'Squat barre', sets:5, reps:'10-12', rest:'2min', technique:'5 séries. Montée progressive. Profondeur parallèle. Descente 3s.', muscle:'jambes', type:'compound', equipment:'barre', rest_pause:false},
          {order:2, name:'Leg press 45°', sets:4, reps:'10-12', rest:'90s', technique:'4 séries. Pieds moyens. Amplitude complète. Pas de verrouillage.', muscle:'jambes', type:'compound', equipment:'machine', rest_pause:false},
          {order:3, name:'Leg extension', sets:4, reps:'12-15', rest:'60s', technique:'4 séries quadriceps. Extension complète. Contraction 2s.', muscle:'jambes', type:'isolation', equipment:'machine', rest_pause:false},
          {order:4, name:'Leg curl couché', sets:4, reps:'12-15', rest:'60s', technique:'4 séries ischio. Amplitude complète. Contraction peak.', muscle:'jambes', type:'isolation', equipment:'machine', rest_pause:false},
          {order:5, name:'Mollets debout machine', sets:5, reps:'12-15', rest:'60s', technique:'5 séries mollets. Amplitude totale. Pause 2s en haut.', muscle:'jambes', type:'isolation', equipment:'machine', rest_pause:false}
        ]
      },
      intermediate: {
        name: 'High Volume Jambes — Intermédiaire',
        description: 'Volume Progressif jambes intermédiaire. Volume élevé, supersets.',
        exercises: [
          {order:1, name:'Squat barre', sets:5, reps:'8-12', rest:'2min', technique:'5 séries. Montée en charges. 4e-5e série à l\'échec. Full depth.', muscle:'jambes', type:'compound', equipment:'barre', rest_pause:false},
          {order:2, name:'Leg press 45°', sets:5, reps:'10-12', rest:'90s', technique:'5 séries. Drop set dernier. Amplitude maximale.', muscle:'jambes', type:'compound', equipment:'machine', rest_pause:false},
          {order:3, name:'Hack squat machine', sets:4, reps:'10-12', rest:'90s', technique:'4 séries. Focus quadriceps. Pieds bas et rapprochés. Descente profonde.', muscle:'jambes', type:'compound', equipment:'machine', rest_pause:false},
          {order:4, name:'Leg extension', sets:4, reps:'12-15', rest:'60s', technique:'4 séries. Superset avec leg curl. Volume quad + ischio simultané.', muscle:'jambes', type:'isolation', equipment:'machine', superset_with:'leg_curl'},
          {order:5, name:'Leg curl assis', sets:4, reps:'12-15', rest:'60s', technique:'Superset suite. Ischio-jambiers. Amplitude complète.', muscle:'jambes', type:'isolation', equipment:'machine', rest_pause:false},
          {order:6, name:'Mollets assis machine', sets:5, reps:'15-20', rest:'60s', technique:'5 séries. Amplitude maximale. Drop set dernière série.', muscle:'jambes', type:'isolation', equipment:'machine', rest_pause:false}
        ]
      },
      advanced: {
        name: 'High Volume Jambes — Avancé',
        description: 'Volume Progressif jambes maximum. 7 exercices, supersets, drop sets.',
        exercises: [
          {order:1, name:'Squat barre', sets:6, reps:'6-12', rest:'2min', technique:'6 séries. Charge maximale. Drop set 6e série. Full depth obligatoire.', muscle:'jambes', type:'compound', equipment:'barre', rest_pause:false},
          {order:2, name:'Leg press 45°', sets:5, reps:'10-15', rest:'90s', technique:'5 séries. Pieds hauts pour ischio/fessiers. Drop set finale.', muscle:'jambes', type:'compound', equipment:'machine', rest_pause:false},
          {order:3, name:'Hack squat', sets:4, reps:'10-12', rest:'90s', technique:'4 séries. Isolation quadriceps. Pieds étroits. Profondeur maximale.', muscle:'jambes', type:'compound', equipment:'machine', rest_pause:false},
          {order:4, name:'Leg extension', sets:5, reps:'12-15', rest:'60s', technique:'5 séries. Superset avec leg curl couché. 0s repos.', muscle:'jambes', type:'isolation', equipment:'machine', superset_with:'leg_curl_couche'},
          {order:5, name:'Leg curl couché', sets:5, reps:'12-15', rest:'60s', technique:'Superset suite. Amplitude complète. Drop set dernière série.', muscle:'jambes', type:'isolation', equipment:'machine', rest_pause:false},
          {order:6, name:'Fentes marchées barre', sets:3, reps:'12/côté', rest:'90s', technique:'3 séries. Volume fessiers/jambes. Amplitude complète.', muscle:'jambes', type:'compound', equipment:'barre', rest_pause:false},
          {order:7, name:'Mollets debout machine', sets:6, reps:'15-20', rest:'60s', technique:'6 séries. Drop set chaque série. Amplitude totale. Brûlure maximale.', muscle:'jambes', type:'isolation', equipment:'machine', rest_pause:false}
        ]
      }
    },
    fessiers: {
      beginner: {
        name: 'High Volume Fessiers — Débutant',
        description: 'Volume Progressif fessiers débutant. 4-5 exercices, fessiers ciblés.',
        exercises: [
          {order:1, name:'Hip thrust barre', sets:5, reps:'10-12', rest:'90s', technique:'5 séries. Contraction 2s en haut. Bascule du bassin. Montée progressive.', muscle:'fessiers', type:'compound', equipment:'barre', rest_pause:false},
          {order:2, name:'Squat bulgare haltères', sets:4, reps:'10-12', rest:'90s', technique:'4 séries/côté. Descente 3s. Focus fessier. Poussée sur talon.', muscle:'fessiers', type:'compound', equipment:'halteres', rest_pause:false},
          {order:3, name:'Fentes avant haltères', sets:4, reps:'12/côté', rest:'60s', technique:'4 séries. Pas large. Fessier avant actif. Poussée explosive.', muscle:'fessiers', type:'compound', equipment:'halteres', rest_pause:false},
          {order:4, name:'Donkey kicks machine', sets:4, reps:'15-20', rest:'60s', technique:'4 séries. Extension de hanche. Contraction maximale en haut.', muscle:'fessiers', type:'isolation', equipment:'machine', rest_pause:false},
          {order:5, name:'Abduction machine', sets:4, reps:'15-20', rest:'60s', technique:'4 séries fessier moyen. Mouvement contrôlé. Tension constante.', muscle:'fessiers', type:'isolation', equipment:'machine', rest_pause:false}
        ]
      },
      intermediate: {
        name: 'High Volume Fessiers — Intermédiaire',
        description: 'Volume Progressif fessiers intermédiaire. Supersets, volume élevé.',
        exercises: [
          {order:1, name:'Hip thrust barre', sets:5, reps:'8-12', rest:'90s', technique:'5 séries lourdes. Progression de charge. Contraction maximale.', muscle:'fessiers', type:'compound', equipment:'barre', rest_pause:false},
          {order:2, name:'Squat bulgare barre', sets:4, reps:'10-12', rest:'90s', technique:'4 séries. Charge sur barre. Focus fessier et quadriceps.', muscle:'fessiers', type:'compound', equipment:'barre', rest_pause:false},
          {order:3, name:'Leg press pieds hauts', sets:4, reps:'12-15', rest:'90s', technique:'4 séries. Pieds hauts = fessiers. Amplitude complète. Poussée talons.', muscle:'fessiers', type:'compound', equipment:'machine', rest_pause:false},
          {order:4, name:'Kick-back poulie basse', sets:4, reps:'15-20', rest:'60s', technique:'4 séries. Superset avec abduction. Volume isolation fessiers.', muscle:'fessiers', type:'isolation', equipment:'poulie', superset_with:'abduction_machine'},
          {order:5, name:'Abduction machine', sets:4, reps:'15-20', rest:'60s', technique:'Superset suite. Fessier moyen. Amplitude complète.', muscle:'fessiers', type:'isolation', equipment:'machine', rest_pause:false}
        ]
      },
      advanced: {
        name: 'High Volume Fessiers — Avancé',
        description: 'Volume Progressif max fessiers. 6 exercices, supersets, drop sets.',
        exercises: [
          {order:1, name:'Hip thrust barre', sets:6, reps:'8-12', rest:'90s', technique:'6 séries. Drop set dernière. Charge maximale. Contraction 2s en haut.', muscle:'fessiers', type:'compound', equipment:'barre', rest_pause:false},
          {order:2, name:'Squat bulgare barre', sets:4, reps:'10-12', rest:'90s', technique:'4 séries. Charge élevée. Amplitude maximale. Focus fessiers.', muscle:'fessiers', type:'compound', equipment:'barre', rest_pause:false},
          {order:3, name:'Leg press pieds hauts', sets:5, reps:'10-15', rest:'90s', technique:'5 séries. Activation maximale fessiers. Drop set finale.', muscle:'fessiers', type:'compound', equipment:'machine', rest_pause:false},
          {order:4, name:'Fentes latérales haltères', sets:4, reps:'12/côté', rest:'60s', technique:'4 séries. Fessier moyen et adducteurs. Superset avec donkey kicks.', muscle:'fessiers', type:'compound', equipment:'halteres', superset_with:'donkey_kicks'},
          {order:5, name:'Donkey kicks bande élastique', sets:4, reps:'20/côté', rest:'60s', technique:'Superset suite. Tension constante. Contraction maximale.', muscle:'fessiers', type:'isolation', equipment:'elastique', rest_pause:false},
          {order:6, name:'Abduction machine', sets:4, reps:'20-25', rest:'60s', technique:'Finisher fessier moyen. Drop set. Brûlure intense finale.', muscle:'fessiers', type:'isolation', equipment:'machine', rest_pause:false}
        ]
      }
    }
  },
  splits: {
    3: {
      name: 'High Volume 3 jours',
      description: 'Split Volume Progressif 3j. Volume condensé pour ceux limités en temps.',
      days: [
        {day:1, label:'Push — Pectoraux + Épaules + Triceps', muscles:['pectoraux','epaules','bras']},
        {day:2, label:'Repos'},
        {day:3, label:'Pull — Dos + Biceps', muscles:['dos','bras']},
        {day:4, label:'Repos'},
        {day:5, label:'Jambes + Fessiers', muscles:['jambes','fessiers']},
        {day:6, label:'Repos'},
        {day:7, label:'Repos'}
      ]
    },
    4: {
      name: 'High Volume 4 jours',
      description: 'Split Volume Progressif 4j. Volume élevé par groupe, 2 groupes par séance.',
      days: [
        {day:1, label:'Pectoraux + Triceps', muscles:['pectoraux','bras']},
        {day:2, label:'Dos + Biceps', muscles:['dos','bras']},
        {day:3, label:'Repos'},
        {day:4, label:'Épaules + Bras', muscles:['epaules','bras']},
        {day:5, label:'Jambes + Fessiers', muscles:['jambes','fessiers']},
        {day:6, label:'Repos'},
        {day:7, label:'Repos'}
      ]
    },
    5: {
      name: 'High Volume 5 jours',
      description: 'Split Volume Progressif 5j. Un groupe par séance, volume maximal.',
      days: [
        {day:1, label:'Pectoraux', muscles:['pectoraux']},
        {day:2, label:'Dos', muscles:['dos']},
        {day:3, label:'Épaules + Bras', muscles:['epaules','bras']},
        {day:4, label:'Jambes', muscles:['jambes']},
        {day:5, label:'Fessiers + Bras', muscles:['fessiers','bras']},
        {day:6, label:'Repos'},
        {day:7, label:'Repos'}
      ]
    },
    6: {
      name: 'High Volume 6 jours',
      description: 'Split Volume Progressif professionnel 6j. Un seul groupe musculaire par séance.',
      days: [
        {day:1, label:'Pectoraux', muscles:['pectoraux']},
        {day:2, label:'Dos', muscles:['dos']},
        {day:3, label:'Épaules', muscles:['epaules']},
        {day:4, label:'Bras', muscles:['bras']},
        {day:5, label:'Jambes', muscles:['jambes']},
        {day:6, label:'Fessiers', muscles:['fessiers']},
        {day:7, label:'Repos'}
      ]
    }
  },
  macro_cycle_12w: [
    {week:1, phase:'Volume Base', intensity:'65%', focus:'Établir le volume de base. 4 séries par exercice. Apprentissage des supersets.'},
    {week:2, phase:'Volume Base', intensity:'70%', focus:'Augmenter le volume. 5 séries sur composés. Introduire drop sets légers.'},
    {week:3, phase:'Accumulation', intensity:'75%', focus:'Volume maximum par séance. 25 séries par muscle. Supersets systématiques.'},
    {week:4, phase:'Accumulation', intensity:'78%', focus:'Progression de charge tout en maintenant le volume. Drop sets sur tous les finishers.'},
    {week:5, phase:'Intensification', intensity:'82%', focus:'Augmenter les charges. Réduire légèrement les reps. Maintenir le volume.'},
    {week:6, phase:'Intensification', intensity:'85%', focus:'Charges maximales avec volume. Drop sets et supersets intenses.'},
    {week:7, phase:'Peak Volume', intensity:'88%', focus:'Semaine de volume extrême. Maximum de séries et de charges.'},
    {week:8, phase:'Peak Volume', intensity:'90%', focus:'PRs sur tous les exercices. Volume + intensité = hypertrophie maximale.'},
    {week:9, phase:'Décharge', intensity:'60%', volume_modifier:0.5, isDeload:true, focus:'Réduction à 3 séries. Récupération. Maintien des acquis.'},
    {week:10, phase:'Transition', intensity:'72%', focus:'Reprise progressive. Évaluation des gains. Ajustement des charges.'},
    {week:11, phase:'Nouveau cycle', intensity:'80%', focus:'Nouveau cycle avec charges supérieures. Nouvelles techniques de volume.'},
    {week:12, phase:'Bilan', intensity:'85%', focus:'Évaluation finale. Photos comparatives. Planification cycle suivant.'}
  ]
};

var RAMBOD_PROGRAMS = {
  meta: {
    name: 'FST-7',
    athlete: 'Méthode FST-7',
    philosophy: 'Fascia Stretch Training 7. Dernier exercice chaque muscle = 7 séries × 12-15 reps, 30-45s repos, étirement inter-séries. Pompe extrême pour étirer le fascia.',
    frequency: '4-5 jours/semaine',
    session_duration: '60-75 min',
    key_principles: ['7 séries FST-7 en finisher', '30-45s repos entre séries FST-7', 'Étirement du fascia inter-séries', 'Pompe maximale', 'Progression régulière sur composés']
  },
  programs: {
    pectoraux: {
      beginner: {
        name: 'FST-7 Pectoraux — Débutant',
        description: 'Introduction FST-7 pectoraux. Composés + finisher FST-7 écarté poulie.',
        exercises: [
          {order:1, name:'Développé couché barre', sets:3, reps:'10-12', rest:'90s', technique:'3 séries de travail. Amplitude complète. Descente 3s. Progression de charge.', muscle:'pectoraux', type:'compound', equipment:'barre', rest_pause:false},
          {order:2, name:'Développé incliné haltères', sets:3, reps:'10-12', rest:'90s', technique:'3 séries. Partie haute des pecs. Étirement maximal en bas. Rotation poignets.', muscle:'pectoraux', type:'compound', equipment:'halteres', rest_pause:false},
          {order:3, name:'Développé décliné barre', sets:3, reps:'10-12', rest:'90s', technique:'3 séries. Partie basse. Contrôle total. Amplitude complète.', muscle:'pectoraux', type:'compound', equipment:'barre', rest_pause:false},
          {order:4, name:'Écarté poulie croisée (FST-7)', sets:7, reps:'12-15', rest:'40s', technique:'FST-7 FINISHER: 7 séries. 40s de repos entre chaque série. Étirer les pectoraux 30s entre chaque série. Pompe maximale.', muscle:'pectoraux', type:'isolation', equipment:'poulie', is_fst7:true, interset_stretch:true, fst7_sets:7, rest_pause:false}
        ]
      },
      intermediate: {
        name: 'FST-7 Pectoraux — Intermédiaire',
        description: 'FST-7 intermédiaire pectoraux. 4 composés + finisher FST-7.',
        exercises: [
          {order:1, name:'Développé couché barre', sets:4, reps:'8-12', rest:'90s', technique:'4 séries. Montée progressive. Dernier set lourd. Amplitude complète.', muscle:'pectoraux', type:'compound', equipment:'barre', rest_pause:false},
          {order:2, name:'Développé incliné barre', sets:3, reps:'10-12', rest:'90s', technique:'3 séries. 30° inclinaison. Focus haut des pecs. Descente 3s.', muscle:'pectoraux', type:'compound', equipment:'barre', rest_pause:false},
          {order:3, name:'Développé haltères plat', sets:3, reps:'10-12', rest:'90s', technique:'3 séries. Amplitude supérieure. Étirement profond en bas.', muscle:'pectoraux', type:'compound', equipment:'halteres', rest_pause:false},
          {order:4, name:'Écarté haltères plat', sets:3, reps:'12-15', rest:'60s', technique:'3 séries isolation. Arc naturel. Étirement profond.', muscle:'pectoraux', type:'isolation', equipment:'halteres', rest_pause:false},
          {order:5, name:'Écarté poulie haute (FST-7)', sets:7, reps:'12-15', rest:'35s', technique:'FST-7 FINISHER: 7 séries, 35s repos. Étirer pectoraux 30s entre chaque série. Contraction maximale en bas. Pompe extrême.', muscle:'pectoraux', type:'isolation', equipment:'poulie', is_fst7:true, interset_stretch:true, fst7_sets:7, rest_pause:false}
        ]
      },
      advanced: {
        name: 'FST-7 Pectoraux — Avancé',
        description: 'FST-7 avancé pectoraux. Volume élevé + FST-7 intensifié.',
        exercises: [
          {order:1, name:'Développé couché barre', sets:5, reps:'6-10', rest:'2min', technique:'5 séries lourdes. Progression maximale. Amplitude complète.', muscle:'pectoraux', type:'compound', equipment:'barre', rest_pause:false},
          {order:2, name:'Développé incliné haltères', sets:4, reps:'10-12', rest:'90s', technique:'4 séries. Étirement maximal. Focus partie haute.', muscle:'pectoraux', type:'compound', equipment:'halteres', rest_pause:false},
          {order:3, name:'Développé décliné haltères', sets:3, reps:'10-12', rest:'90s', technique:'3 séries. Partie basse. Amplitude complète.', muscle:'pectoraux', type:'compound', equipment:'halteres', rest_pause:false},
          {order:4, name:'Écarté haltères incliné', sets:3, reps:'12-15', rest:'60s', technique:'3 séries. Isolation partie haute. Étirement profond.', muscle:'pectoraux', type:'isolation', equipment:'halteres', rest_pause:false},
          {order:5, name:'Écarté poulie croisée (FST-7)', sets:7, reps:'12-15', rest:'30s', technique:'FST-7 FINISHER AVANCÉ: 7 séries, 30s repos. Étirer pectoraux avec haltère 30s entre chaque série. Chercher la pompe maximale. Drop set possible sur 6e série.', muscle:'pectoraux', type:'isolation', equipment:'poulie', is_fst7:true, interset_stretch:true, fst7_sets:7, rest_pause:false}
        ]
      }
    },
    dos: {
      beginner: {
        name: 'FST-7 Dos — Débutant',
        description: 'FST-7 dos débutant. Tirages + finisher FST-7 pull-over.',
        exercises: [
          {order:1, name:'Tirage vertical poulie large', sets:3, reps:'10-12', rest:'90s', technique:'3 séries. Prise large. Tirer vers le sternum. Omoplate en rotation.', muscle:'dos', type:'compound', equipment:'poulie', rest_pause:false},
          {order:2, name:'Rowing barre', sets:3, reps:'10-12', rest:'90s', technique:'3 séries. Buste à 45°. Barre vers nombril. Contraction peak.', muscle:'dos', type:'compound', equipment:'barre', rest_pause:false},
          {order:3, name:'Tirage horizontal poulie basse', sets:3, reps:'10-12', rest:'90s', technique:'3 séries. Prise neutre. Coudes collés. Rhomboïdes actifs.', muscle:'dos', type:'compound', equipment:'poulie', rest_pause:false},
          {order:4, name:'Pull-over poulie (FST-7)', sets:7, reps:'12-15', rest:'40s', technique:'FST-7 FINISHER: 7 séries, 40s repos. Étirer le grand dorsal bras en l\'air 30s entre chaque série. Grand dorsal isolé. Pompe extrême.', muscle:'dos', type:'isolation', equipment:'poulie', is_fst7:true, interset_stretch:true, fst7_sets:7, rest_pause:false}
        ]
      },
      intermediate: {
        name: 'FST-7 Dos — Intermédiaire',
        description: 'FST-7 dos intermédiaire. 4 composés + finisher FST-7.',
        exercises: [
          {order:1, name:'Tractions pronation', sets:4, reps:'8-10', rest:'2min', technique:'4 séries. Amplitude complète. Étirement en haut. Lestage progressif.', muscle:'dos', type:'compound', equipment:'barre_de_traction', rest_pause:false},
          {order:2, name:'Rowing barre penché', sets:4, reps:'8-12', rest:'90s', technique:'4 séries. Prise pronation. Coudes hauts. Tirer vers bas ventre.', muscle:'dos', type:'compound', equipment:'barre', rest_pause:false},
          {order:3, name:'Tirage vertical prise neutre', sets:3, reps:'10-12', rest:'90s', technique:'3 séries. Grand dorsal. Coudes devant. Amplitude complète.', muscle:'dos', type:'compound', equipment:'poulie', rest_pause:false},
          {order:4, name:'Rowing haltère unilatéral', sets:3, reps:'10-12', rest:'60s', technique:'3 séries par bras. Amplitude maximale. Focus grand dorsal.', muscle:'dos', type:'compound', equipment:'halteres', rest_pause:false},
          {order:5, name:'Pull-over machine (FST-7)', sets:7, reps:'12-15', rest:'35s', technique:'FST-7 FINISHER: 7 séries, 35s repos. Étirer le dos bras tendus en l\'air 30s entre séries. Machine = tension constante. Pompe grand dorsal maximale.', muscle:'dos', type:'isolation', equipment:'machine', is_fst7:true, interset_stretch:true, fst7_sets:7, rest_pause:false}
        ]
      },
      advanced: {
        name: 'FST-7 Dos — Avancé',
        description: 'FST-7 dos avancé. Volume élevé + FST-7 intensifié.',
        exercises: [
          {order:1, name:'Tractions lestées', sets:5, reps:'6-10', rest:'2min', technique:'5 séries. Charge maximale. Amplitude complète. Étirement en haut.', muscle:'dos', type:'compound', equipment:'barre_de_traction', rest_pause:false},
          {order:2, name:'Rowing barre', sets:5, reps:'8-12', rest:'90s', technique:'5 séries. Volume élevé. Progression de charge. Contraction maximale.', muscle:'dos', type:'compound', equipment:'barre', rest_pause:false},
          {order:3, name:'Tirage vertical machine', sets:4, reps:'10-12', rest:'90s', technique:'4 séries. Isolation grand dorsal. Amplitude complète.', muscle:'dos', type:'compound', equipment:'machine', rest_pause:false},
          {order:4, name:'Rowing haltère unilatéral', sets:3, reps:'10-12', rest:'60s', technique:'3 séries par bras. Amplitude maximale. Rotation d\'épaule.', muscle:'dos', type:'compound', equipment:'halteres', rest_pause:false},
          {order:5, name:'Pull-over poulie (FST-7)', sets:7, reps:'12-15', rest:'30s', technique:'FST-7 FINISHER AVANCÉ: 7 séries, 30s repos. Étirement grand dorsal 30s entre chaque série bras tendus. Pompe extrême. Drop set 6e série.', muscle:'dos', type:'isolation', equipment:'poulie', is_fst7:true, interset_stretch:true, fst7_sets:7, rest_pause:false}
        ]
      }
    },
    epaules: {
      beginner: {
        name: 'FST-7 Épaules — Débutant',
        description: 'FST-7 épaules débutant. Développé + FST-7 élévations latérales.',
        exercises: [
          {order:1, name:'Développé militaire haltères', sets:3, reps:'10-12', rest:'90s', technique:'3 séries. Amplitude complète. Descente 3s. Focus deltoïdes.', muscle:'epaules', type:'compound', equipment:'halteres', rest_pause:false},
          {order:2, name:'Développé militaire barre', sets:3, reps:'10-12', rest:'90s', technique:'3 séries. Descente 3s. Explosion. Pas de verrouillage.', muscle:'epaules', type:'compound', equipment:'barre', rest_pause:false},
          {order:3, name:'Oiseau haltères (arrière)', sets:3, reps:'12-15', rest:'60s', technique:'3 séries. Buste penché. Focus postérieur. Coudes légèrement fléchis.', muscle:'epaules', type:'isolation', equipment:'halteres', rest_pause:false},
          {order:4, name:'Élévations latérales haltères (FST-7)', sets:7, reps:'12-15', rest:'40s', technique:'FST-7 FINISHER: 7 séries, 40s repos. Étirer épaule en croisant les bras 30s entre séries. Faisceau moyen. Pompe extrême.', muscle:'epaules', type:'isolation', equipment:'halteres', is_fst7:true, interset_stretch:true, fst7_sets:7, rest_pause:false}
        ]
      },
      intermediate: {
        name: 'FST-7 Épaules — Intermédiaire',
        description: 'FST-7 épaules intermédiaire. 4 exercices + FST-7.',
        exercises: [
          {order:1, name:'Développé militaire barre', sets:4, reps:'8-12', rest:'90s', technique:'4 séries. Montée progressive. Amplitude complète.', muscle:'epaules', type:'compound', equipment:'barre', rest_pause:false},
          {order:2, name:'D\u00e9velopp\u00e9 militaire halteres', sets:3, reps:'10-12', rest:'90s', technique:'3 s\u00e9ries. Coudes l\u00e9g\u00e8rement devant le plan frontal. Amplitude compl\u00e8te (halt\u00e8res \u00e0 hauteur des oreilles en bas). Prise neutre possible pour prot\u00e9ger la coiffe.', muscle:'epaules', type:'compound', equipment:'halteres', rest_pause:false},
          {order:3, name:'Oiseau poulie basse (arrière)', sets:3, reps:'12-15', rest:'60s', technique:'3 séries. Poulies croisées. Amplitude complète. Faisceau postérieur.', muscle:'epaules', type:'isolation', equipment:'poulie', rest_pause:false},
          {order:4, name:'Élévations frontales haltères', sets:3, reps:'12-15', rest:'60s', technique:'3 séries. Faisceau antérieur. Bras alternés. Contraction en haut.', muscle:'epaules', type:'isolation', equipment:'halteres', rest_pause:false},
          {order:5, name:'Élévations latérales poulie (FST-7)', sets:7, reps:'12-15', rest:'35s', technique:'FST-7 FINISHER: 7 séries, 35s repos. Étirer épaule en passant le bras derrière le dos 30s. Poulie basse = tension constante. Pompe maximale.', muscle:'epaules', type:'isolation', equipment:'poulie', is_fst7:true, interset_stretch:true, fst7_sets:7, rest_pause:false}
        ]
      },
      advanced: {
        name: 'FST-7 Épaules — Avancé',
        description: 'FST-7 épaules avancé. Volume élevé + FST-7 intensifié.',
        exercises: [
          {order:1, name:'Développé militaire barre', sets:5, reps:'6-10', rest:'2min', technique:'5 séries lourdes. Progression maximale. Amplitude complète.', muscle:'epaules', type:'compound', equipment:'barre', rest_pause:false},
          {order:2, name:'D\u00e9velopp\u00e9 militaire halteres', sets:4, reps:'10-12', rest:'90s', technique:'4 s\u00e9ries. Coudes l\u00e9g\u00e8rement devant le plan frontal pour pr\u00e9server les rotateurs. Amplitude compl\u00e8te. Prise neutre possible.', muscle:'epaules', type:'compound', equipment:'halteres', rest_pause:false},
          {order:3, name:'Oiseau machine', sets:4, reps:'12-15', rest:'60s', technique:'4 séries. Amplitude complète. Squeeze en fin de mouvement.', muscle:'epaules', type:'isolation', equipment:'machine', rest_pause:false},
          {order:4, name:'Élévations frontales haltères', sets:3, reps:'12-15', rest:'60s', technique:'3 séries. Faisceau antérieur. Alternés.', muscle:'epaules', type:'isolation', equipment:'halteres', rest_pause:false},
          {order:5, name:'Élévations latérales haltères (FST-7)', sets:7, reps:'12-15', rest:'30s', technique:'FST-7 FINISHER AVANCÉ: 7 séries, 30s repos. Étirer épaule 30s entre séries. Drop set 6e série. Pompe maximale. Fascia étiré.', muscle:'epaules', type:'isolation', equipment:'halteres', is_fst7:true, interset_stretch:true, fst7_sets:7, rest_pause:false}
        ]
      }
    },
    bras: {
      beginner: {
        name: 'FST-7 Bras — Débutant',
        description: 'FST-7 bras débutant. Biceps + triceps avec finishers FST-7.',
        exercises: [
          {order:1, name:'Curl barre EZ', sets:3, reps:'10-12', rest:'60s', technique:'3 séries biceps. Descente 3s. Coudes fixes. Contraction peak.', muscle:'bras', type:'compound', equipment:'barre', rest_pause:false},
          {order:2, name:'Extensions triceps poulie corde', sets:3, reps:'10-12', rest:'60s', technique:'3 séries triceps. Séparation des têtes. Coudes fixes. Extension complète.', muscle:'bras', type:'isolation', equipment:'poulie', rest_pause:false},
          {order:3, name:'Curl incliné haltères', sets:3, reps:'10-12', rest:'60s', technique:'3 séries. Étirement maximal biceps. Supination. Contraction peak.', muscle:'bras', type:'isolation', equipment:'halteres', rest_pause:false},
          {order:4, name:'Curl poulie basse (FST-7)', sets:7, reps:'12-15', rest:'40s', technique:'FST-7 FINISHER BICEPS: 7 séries, 40s repos. Étirer le biceps bras en extension 30s entre séries. Tension constante poulie. Pompe extrême.', muscle:'bras', type:'isolation', equipment:'poulie', is_fst7:true, interset_stretch:true, fst7_sets:7, rest_pause:false}
        ]
      },
      intermediate: {
        name: 'FST-7 Bras — Intermédiaire',
        description: 'FST-7 bras intermédiaire. Biceps + triceps avec FST-7 sur chaque.',
        exercises: [
          {order:1, name:'Curl barre EZ', sets:4, reps:'8-12', rest:'60s', technique:'4 séries biceps. Montée progressive. Amplitude complète.', muscle:'bras', type:'compound', equipment:'barre', rest_pause:false},
          {order:2, name:'Skull crushers EZ', sets:4, reps:'8-12', rest:'60s', technique:'4 séries triceps. Coudes fixes. Amplitude complète. Contrôle total.', muscle:'bras', type:'isolation', equipment:'barre', rest_pause:false},
          {order:3, name:'Curl incliné haltères', sets:3, reps:'10-12', rest:'60s', technique:'3 séries. Étirement biceps maximal. Supination en montant.', muscle:'bras', type:'isolation', equipment:'halteres', rest_pause:false},
          {order:4, name:'Dips lestés triceps', sets:3, reps:'8-10', rest:'90s', technique:'3 séries. Buste droit. Amplitude complète. Lestage progressif.', muscle:'bras', type:'compound', equipment:'barres_paralleles', rest_pause:false},
          {order:5, name:'Curl poulie basse (FST-7)', sets:7, reps:'12-15', rest:'35s', technique:'FST-7 FINISHER BICEPS: 7 séries, 35s repos. Étirer biceps 30s entre séries. Pompe maximale. Tension constante.', muscle:'bras', type:'isolation', equipment:'poulie', is_fst7:true, interset_stretch:true, fst7_sets:7, rest_pause:false}
        ]
      },
      advanced: {
        name: 'FST-7 Bras — Avancé',
        description: 'FST-7 bras avancé. Volume + FST-7 biceps et triceps.',
        exercises: [
          {order:1, name:'Curl barre EZ', sets:4, reps:'8-12', rest:'60s', technique:'4 séries biceps lourds. Progression charge. Amplitude complète.', muscle:'bras', type:'compound', equipment:'barre', rest_pause:false},
          {order:2, name:'Skull crushers EZ', sets:4, reps:'8-12', rest:'60s', technique:'4 séries triceps lourds. Coudes fixes. Amplitude complète.', muscle:'bras', type:'isolation', equipment:'barre', rest_pause:false},
          {order:3, name:'Curl incliné haltères', sets:3, reps:'10-12', rest:'60s', technique:'3 séries. Étirement maximum. Isolation biceps long.', muscle:'bras', type:'isolation', equipment:'halteres', rest_pause:false},
          {order:4, name:'Extensions overhead haltère', sets:3, reps:'10-12', rest:'60s', technique:'3 séries. Longue tête triceps. Amplitude complète. Coudes vers le plafond.', muscle:'bras', type:'isolation', equipment:'halteres', rest_pause:false},
          {order:5, name:'Curl concentré (FST-7)', sets:7, reps:'12-15', rest:'30s', technique:'FST-7 FINISHER BICEPS AVANCÉ: 7 séries, 30s repos. Étirer biceps complet 30s entre séries. Isolation totale. Drop set 6e série.', muscle:'bras', type:'isolation', equipment:'halteres', is_fst7:true, interset_stretch:true, fst7_sets:7, rest_pause:false}
        ]
      }
    },
    jambes: {
      beginner: {
        name: 'FST-7 Jambes — Débutant',
        description: 'FST-7 jambes débutant. Squat + FST-7 leg extension.',
        exercises: [
          {order:1, name:'Squat barre', sets:4, reps:'10-12', rest:'2min', technique:'4 séries. Profondeur parallèle. Descente 3s. Amplitude complète.', muscle:'jambes', type:'compound', equipment:'barre', rest_pause:false},
          {order:2, name:'Leg press 45°', sets:3, reps:'12-15', rest:'90s', technique:'3 séries. Amplitude complète. Pieds moyens. Pas de verrouillage.', muscle:'jambes', type:'compound', equipment:'machine', rest_pause:false},
          {order:3, name:'Leg curl couché', sets:3, reps:'12-15', rest:'60s', technique:'3 séries ischio. Amplitude complète. Contraction peak.', muscle:'jambes', type:'isolation', equipment:'machine', rest_pause:false},
          {order:4, name:'Leg extension (FST-7)', sets:7, reps:'12-15', rest:'40s', technique:'FST-7 FINISHER QUAD: 7 séries, 40s repos. Étirer quadriceps en pliant le genou derrière 30s entre séries. Contraction peak chaque rep. Pompe extrême.', muscle:'jambes', type:'isolation', equipment:'machine', is_fst7:true, interset_stretch:true, fst7_sets:7, rest_pause:false}
        ]
      },
      intermediate: {
        name: 'FST-7 Jambes — Intermédiaire',
        description: 'FST-7 jambes intermédiaire. Volume + FST-7 quadriceps.',
        exercises: [
          {order:1, name:'Squat barre', sets:5, reps:'8-12', rest:'2min', technique:'5 séries. Montée progressive. Dernier set lourd. Full depth.', muscle:'jambes', type:'compound', equipment:'barre', rest_pause:false},
          {order:2, name:'Leg press 45°', sets:4, reps:'10-15', rest:'90s', technique:'4 séries. Amplitude maximale. Pieds variés. Drop set finale.', muscle:'jambes', type:'compound', equipment:'machine', rest_pause:false},
          {order:3, name:'Hack squat', sets:3, reps:'10-12', rest:'90s', technique:'3 séries. Pieds bas = quadriceps. Amplitude complète.', muscle:'jambes', type:'compound', equipment:'machine', rest_pause:false},
          {order:4, name:'Leg curl assis', sets:4, reps:'12-15', rest:'60s', technique:'4 séries ischio. Amplitude complète. Tension constante.', muscle:'jambes', type:'isolation', equipment:'machine', rest_pause:false},
          {order:5, name:'Leg extension (FST-7)', sets:7, reps:'12-15', rest:'35s', technique:'FST-7 FINISHER QUAD: 7 séries, 35s repos. Étirer quad 30s entre séries. Extension complète chaque rep. Pompe maximale.', muscle:'jambes', type:'isolation', equipment:'machine', is_fst7:true, interset_stretch:true, fst7_sets:7, rest_pause:false}
        ]
      },
      advanced: {
        name: 'FST-7 Jambes — Avancé',
        description: 'FST-7 jambes avancé. Volume élevé + FST-7 intensifié.',
        exercises: [
          {order:1, name:'Squat barre', sets:5, reps:'6-10', rest:'2min', technique:'5 séries lourdes. Charge maximale. Full depth. Amplitude complète.', muscle:'jambes', type:'compound', equipment:'barre', rest_pause:false},
          {order:2, name:'Leg press 45°', sets:5, reps:'10-15', rest:'90s', technique:'5 séries. Volume élevé. Drop set finale.', muscle:'jambes', type:'compound', equipment:'machine', rest_pause:false},
          {order:3, name:'Hack squat', sets:4, reps:'10-12', rest:'90s', technique:'4 séries. Isolation quadriceps. Pieds étroits.', muscle:'jambes', type:'compound', equipment:'machine', rest_pause:false},
          {order:4, name:'Leg curl couché', sets:4, reps:'12-15', rest:'60s', technique:'4 séries ischio. Descente 4s. Contraction peak.', muscle:'jambes', type:'isolation', equipment:'machine', rest_pause:false},
          {order:5, name:'Leg extension (FST-7)', sets:7, reps:'12-15', rest:'30s', technique:'FST-7 FINISHER AVANCÉ: 7 séries, 30s repos. Étirer quad 30s entre séries. Drop set 6e série. Contraction 2s chaque rep. Pompe extrême.', muscle:'jambes', type:'isolation', equipment:'machine', is_fst7:true, interset_stretch:true, fst7_sets:7, rest_pause:false}
        ]
      }
    },
    fessiers: {
      beginner: {
        name: 'FST-7 Fessiers — Débutant',
        description: 'FST-7 fessiers débutant. Hip thrust + FST-7 kick-back.',
        exercises: [
          {order:1, name:'Hip thrust barre', sets:4, reps:'10-12', rest:'90s', technique:'4 séries. Contraction 2s en haut. Bascule bassin. Montée progressive.', muscle:'fessiers', type:'compound', equipment:'barre', rest_pause:false},
          {order:2, name:'Squat bulgare haltères', sets:3, reps:'10-12', rest:'90s', technique:'3 séries/côté. Descente 3s. Focus fessier. Poussée sur talon.', muscle:'fessiers', type:'compound', equipment:'halteres', rest_pause:false},
          {order:3, name:'Leg press pieds hauts', sets:3, reps:'12-15', rest:'60s', technique:'3 séries. Pieds hauts = activation fessiers maximale.', muscle:'fessiers', type:'compound', equipment:'machine', rest_pause:false},
          {order:4, name:'Kick-back poulie (FST-7)', sets:7, reps:'15-20', rest:'40s', technique:'FST-7 FINISHER FESSIERS: 7 séries, 40s repos. Étirer fessier en pliant le genou vers la poitrine 30s entre séries. Extension de hanche complète. Pompe.', muscle:'fessiers', type:'isolation', equipment:'poulie', is_fst7:true, interset_stretch:true, fst7_sets:7, rest_pause:false}
        ]
      },
      intermediate: {
        name: 'FST-7 Fessiers — Intermédiaire',
        description: 'FST-7 fessiers intermédiaire. 4 composés + FST-7.',
        exercises: [
          {order:1, name:'Hip thrust barre', sets:5, reps:'8-12', rest:'90s', technique:'5 séries. Charge lourde. Contraction maximale. Drop set finale.', muscle:'fessiers', type:'compound', equipment:'barre', rest_pause:false},
          {order:2, name:'Squat bulgare barre', sets:4, reps:'10-12', rest:'90s', technique:'4 séries. Barre sur épaules. Amplitude maximale. Focus fessiers.', muscle:'fessiers', type:'compound', equipment:'barre', rest_pause:false},
          {order:3, name:'Leg press pieds hauts', sets:3, reps:'12-15', rest:'60s', technique:'3 séries. Activation fessiers. Amplitude complète.', muscle:'fessiers', type:'compound', equipment:'machine', rest_pause:false},
          {order:4, name:'Fentes marchées haltères', sets:3, reps:'12/côté', rest:'60s', technique:'3 séries. Amplitude maximale. Poussée talon. Focus fessier avant.', muscle:'fessiers', type:'compound', equipment:'halteres', rest_pause:false},
          {order:5, name:'Abduction machine (FST-7)', sets:7, reps:'15-20', rest:'35s', technique:'FST-7 FINISHER FESSIER MOYEN: 7 séries, 35s repos. Étirer fessier moyen en croisant les jambes 30s entre séries. Tension constante machine. Pompe.', muscle:'fessiers', type:'isolation', equipment:'machine', is_fst7:true, interset_stretch:true, fst7_sets:7, rest_pause:false}
        ]
      },
      advanced: {
        name: 'FST-7 Fessiers — Avancé',
        description: 'FST-7 fessiers avancé. Volume élevé + FST-7 intensifié.',
        exercises: [
          {order:1, name:'Hip thrust barre', sets:5, reps:'8-12', rest:'90s', technique:'5 séries. Charge maximale. Contraction 2s en haut.', muscle:'fessiers', type:'compound', equipment:'barre', rest_pause:false},
          {order:2, name:'Squat bulgare barre', sets:4, reps:'10-12', rest:'90s', technique:'4 séries lourdes. Amplitude complète. Focus fessiers.', muscle:'fessiers', type:'compound', equipment:'barre', rest_pause:false},
          {order:3, name:'Leg press pieds hauts', sets:4, reps:'12-15', rest:'60s', technique:'4 séries. Drop set finale. Activation fessiers maximale.', muscle:'fessiers', type:'compound', equipment:'machine', rest_pause:false},
          {order:4, name:'Fentes bulgares lestées', sets:4, reps:'10-12/côté', rest:'60s', technique:'4 séries. Amplitude maximale. Poussée explosive.', muscle:'fessiers', type:'compound', equipment:'halteres', rest_pause:false},
          {order:5, name:'Kick-back poulie (FST-7)', sets:7, reps:'15-20', rest:'30s', technique:'FST-7 FINISHER AVANCÉ: 7 séries, 30s repos. Étirer fessier 30s entre séries. Extension hanche complète. Drop set 6e série. Pompe extrême.', muscle:'fessiers', type:'isolation', equipment:'poulie', is_fst7:true, interset_stretch:true, fst7_sets:7, rest_pause:false}
        ]
      }
    }
  },
  splits: {
    3: {
      name: 'FST-7 3 jours',
      description: 'Split FST-7 3j. FST-7 condensé, idéal pour débutants ou emploi du temps chargé.',
      days: [
        {day:1, label:'Push — Pectoraux + Épaules + Triceps', muscles:['pectoraux','epaules','bras']},
        {day:2, label:'Repos'},
        {day:3, label:'Pull — Dos + Biceps', muscles:['dos','bras']},
        {day:4, label:'Repos'},
        {day:5, label:'Jambes + Fessiers', muscles:['jambes','fessiers']},
        {day:6, label:'Repos'},
        {day:7, label:'Repos'}
      ]
    },
    4: {
      name: 'FST-7 4 jours',
      description: 'Split FST-7 4j. Un groupe par séance, temps pour FST-7.',
      days: [
        {day:1, label:'Pectoraux + Triceps', muscles:['pectoraux','bras']},
        {day:2, label:'Dos + Biceps', muscles:['dos','bras']},
        {day:3, label:'Repos'},
        {day:4, label:'Épaules + Bras', muscles:['epaules','bras']},
        {day:5, label:'Jambes + Fessiers', muscles:['jambes','fessiers']},
        {day:6, label:'Repos'},
        {day:7, label:'Repos'}
      ]
    },
    5: {
      name: 'FST-7 5 jours',
      description: 'Split FST-7 5j. Séparation optimale pour FST-7 complet.',
      days: [
        {day:1, label:'Pectoraux', muscles:['pectoraux']},
        {day:2, label:'Dos', muscles:['dos']},
        {day:3, label:'Épaules + Bras', muscles:['epaules','bras']},
        {day:4, label:'Jambes', muscles:['jambes']},
        {day:5, label:'Fessiers + Bras', muscles:['fessiers','bras']},
        {day:6, label:'Repos'},
        {day:7, label:'Repos'}
      ]
    }
  },
  macro_cycle_12w: [
    {week:1, phase:'Introduction FST-7', intensity:'60%', focus:'Apprendre le protocole FST-7. 7 séries légères en finisher. Étirement inter-séries obligatoire.'},
    {week:2, phase:'Introduction FST-7', intensity:'65%', focus:'Augmenter légèrement les charges FST-7. Pompe ressentie. Améliorer l\'étirement.'},
    {week:3, phase:'Accumulation', intensity:'70%', focus:'FST-7 à toutes les séances. Pompe extrême. Trouver les bonnes charges pour chaque muscle.'},
    {week:4, phase:'Accumulation', intensity:'75%', focus:'Progression sur composés. FST-7 avec charges plus élevées. Étirement de fascia ressenti.'},
    {week:5, phase:'Intensification', intensity:'78%', focus:'Augmenter les charges sur composés. Maintenir FST-7. Réduire le repos FST-7 à 35s.'},
    {week:6, phase:'Intensification', intensity:'82%', focus:'Progression maximale. FST-7 à 35s. Pompe extrême sur tous les muscles.'},
    {week:7, phase:'Peak FST-7', intensity:'85%', focus:'Intensité FST-7 maximale. 30s de repos. Drop sets possibles sur 6e série FST-7.'},
    {week:8, phase:'Peak FST-7', intensity:'88%', focus:'PRs sur composés. FST-7 extrême. Pompe maximale. Fascia étiré au maximum.'},
    {week:9, phase:'Décharge', intensity:'55%', volume_modifier:0.5, isDeload:true, focus:'Réduction volume. FST-7 à 5 séries seulement. Récupération active. Maintien technique.'},
    {week:10, phase:'Transition', intensity:'68%', focus:'Reprise FST-7 complet. Évaluation gains. Nouveaux objectifs de charges.'},
    {week:11, phase:'Nouveau cycle', intensity:'75%', focus:'Nouveau cycle avec bases solides. Charges supérieures sur composés.'},
    {week:12, phase:'Bilan', intensity:'82%', focus:'Évaluation finale. Photos. Mensurations. Bilan FST-7 complet. Planification.'}
  ]
};


// fusion_bloc1.js — Partie 1/2
var FUSION_PROGRAMS = {
  meta: {
    name: 'Programme Élite Fusion',
    description: 'Fusion des 3 meilleures méthodes : intensité maximale, volume progressif et FST-7. Le meilleur de chaque approche selon ton niveau.',
    principles: [
      'Pré-exhaustion avant les composés (intermédiaire et avancé)',
      'Rest-pause sur les séries de travail (avancé)',
      'FST-7 sur le dernier exercice : 7 séries × 12-15 reps, 30-45s repos',
      'Étirement fascial interset pour maximiser le pump',
      'Progression de charge chaque semaine',
      'Débutant : maîtrise technique avant intensité'
    ],
    session_duration: '45-60 min',
    frequency: '3-5 séances/semaine',
    ideal_for: 'Tous niveaux — adapte automatiquement volume et intensité',
    methods_combined: ['pre_exhaustion', 'rest_pause', 'fst7', 'progressive_overload', 'drop_set']
  },
  programs: {
    pectoraux: {
      beginner: {
        exercises: [
          {order:1, name:'Développé couché barre', sets:3, reps:'8-10', rest:'2min', technique:'Descendre la barre lentement jusqu\'au thorax, coudes à 75°. Pousser en expirant jusqu\'à extension complète.', muscle:'pectoraux', type:'compound', equipment:'barre', rest_pause:false, pre_exhaustion:false, is_fst7:false},
          {order:2, name:'Développé incliné haltères', sets:3, reps:'10-12', rest:'90s', technique:'Incliner le banc à 30-45°, descendre les haltères en contrôle. Contracter les pectoraux en haut du mouvement.', muscle:'pectoraux', type:'compound', equipment:'haltères', rest_pause:false, pre_exhaustion:false, is_fst7:false},
          {order:3, name:'Pompes', sets:3, reps:'10-15', rest:'90s', technique:'Corps aligné de la tête aux talons, descendre jusqu\'à effleurer le sol. Pousser de façon explosive pour revenir en position haute.', muscle:'pectoraux', type:'compound', equipment:'poids du corps', rest_pause:false, pre_exhaustion:false, is_fst7:false}
        ],
        notes: 'Focus sur la maîtrise technique avant d\'augmenter les charges. Repos complets entre les séries.',
        tips: 'Augmente le poids uniquement quand tu complètes toutes les répétitions avec une forme parfaite.'
      },
      intermediate: {
        exercises: [
          {order:1, name:'Écarté haltères couché', sets:3, reps:'12-15', rest:'60s', technique:'Pré-exhaustion : isoler le pectoral avant le composé. Étirer au maximum en bas, contracter fort en haut.', muscle:'pectoraux', type:'isolation', equipment:'haltères', rest_pause:false, pre_exhaustion:true, is_fst7:false},
          {order:2, name:'Développé couché barre', sets:4, reps:'8-10', rest:'2min', technique:'Pectoral déjà fatigué, utiliser un poids légèrement réduit. Contrôle parfait, descente en 3 secondes.', muscle:'pectoraux', type:'compound', equipment:'barre', rest_pause:false, pre_exhaustion:false, is_fst7:false},
          {order:3, name:'Développé incliné haltères', sets:3, reps:'10-12', rest:'90s', technique:'Incliner à 30°, rotation externe des poignets en haut. Étirer le pectoral supérieur en fin de descente.', muscle:'pectoraux', type:'compound', equipment:'haltères', rest_pause:false, pre_exhaustion:false, is_fst7:false},
          {order:4, name:'Écarté poulie basse croisée', sets:7, reps:'12-15', rest:'30s', technique:'FST-7 : 7 séries avec 30s de repos. Étirer le pectoral entre chaque série en ouvrant les bras largement.', muscle:'pectoraux', type:'isolation', equipment:'poulie', rest_pause:false, pre_exhaustion:false, is_fst7:true, fst7_sets:7, interset_stretch:true}
        ],
        notes: 'La pré-exhaustion fatigue le pectoral avant le press, forçant un recrutement musculaire maximal.',
        tips: 'Sur le FST-7, maintiens l\'étirement 20-30s entre chaque série pour maximiser l\'expansion fasciale.'
      },
      advanced: {
        exercises: [
          {order:1, name:'Écarté haltères couché', sets:3, reps:'12-15', rest:'45s', technique:'Pré-exhaustion complète du pectoral avant le composé. Concentration maximale sur la contraction musculaire.', muscle:'pectoraux', type:'isolation', equipment:'haltères', rest_pause:false, pre_exhaustion:true, is_fst7:false},
          {order:2, name:'Développé couché barre', sets:4, reps:'6-8', rest:'2min30s', technique:'Série à l\'échec absolu, puis rest-pause 15s et 2-3 reps supplémentaires. Partenaire de sécurité obligatoire.', muscle:'pectoraux', type:'compound', equipment:'barre', rest_pause:true, pre_exhaustion:false, is_fst7:false},
          {order:3, name:'Développé incliné barre', sets:3, reps:'8-10', rest:'2min', technique:'Travailler le pectoral supérieur à haute intensité. Tempo 3-1-1, descendre en 3 secondes.', muscle:'pectoraux', type:'compound', equipment:'barre', rest_pause:false, pre_exhaustion:false, is_fst7:false},
          {order:4, name:'Dips lest', sets:3, reps:'8-10', rest:'90s', technique:'Pencher le buste en avant pour maximiser l\'activation pectorale. Descendre jusqu\'à 90° de flexion du coude.', muscle:'pectoraux', type:'compound', equipment:'barre parallèle', rest_pause:false, pre_exhaustion:false, is_fst7:false},
          {order:5, name:'Écarté câble croisé', sets:7, reps:'12-15', rest:'30s', technique:'FST-7 : 7 séries avec 30s de repos. Étirer le pectoral entre chaque série en ouvrant les bras largement.', muscle:'pectoraux', type:'isolation', equipment:'poulie', rest_pause:false, pre_exhaustion:false, is_fst7:true, fst7_sets:7, interset_stretch:true}
        ],
        notes: 'Programme haute intensité combinant pré-exhaustion, rest-pause et FST-7. Récupération de 5-7 jours entre deux séances pectoraux.',
        tips: 'Sur le rest-pause, la série après la pause doit être aussi proche de l\'échec que la première.'
      }
    },
    dos: {
      beginner: {
        exercises: [
          {order:1, name:'Tirage horizontal poulie basse', sets:3, reps:'10-12', rest:'90s', technique:'Tirer les coudes vers l\'arrière en serrant les omoplates. Dos droit, ne pas balancer le buste.', muscle:'dos', type:'compound', equipment:'poulie', rest_pause:false, pre_exhaustion:false, is_fst7:false},
          {order:2, name:'Tirage vertical barre', sets:3, reps:'10-12', rest:'2min', technique:'Prise légèrement plus large que les épaules, tirer la barre vers la clavicule. Étirer les dorsaux en haut.', muscle:'dos', type:'compound', equipment:'barre', rest_pause:false, pre_exhaustion:false, is_fst7:false},
          {order:3, name:'Rowing haltère unilatéral', sets:3, reps:'10-12', rest:'90s', technique:'Appuyer le genou et la main sur un banc, tirer l\'haltère vers la hanche. Coude proche du corps.', muscle:'dos', type:'compound', equipment:'haltères', rest_pause:false, pre_exhaustion:false, is_fst7:false}
        ],
        notes: 'Apprendre à sentir le dos travailler avant tout. Éviter de compenser avec les biceps.',
        tips: 'Pense à "écraser une noix entre tes omoplates" à chaque répétition pour activer les dorsaux.'
      },
      intermediate: {
        exercises: [
          {order:1, name:'Pull-over haltère', sets:3, reps:'12-15', rest:'60s', technique:'Pré-exhaustion des dorsaux en isolation. Étirer en haut, contracter le dorsal en ramenant l\'haltère.', muscle:'dos', type:'isolation', equipment:'haltères', rest_pause:false, pre_exhaustion:true, is_fst7:false},
          {order:2, name:'Tirage vertical barre', sets:4, reps:'8-10', rest:'2min', technique:'Dorsaux pré-fatigués, tirer la barre en engageant d\'abord les coudes. Pause en bas pour maximiser la contraction.', muscle:'dos', type:'compound', equipment:'barre', rest_pause:false, pre_exhaustion:false, is_fst7:false},
          {order:3, name:'Rowing barre', sets:3, reps:'8-10', rest:'2min', technique:'Buste incliné à 45°, tirer la barre vers le nombril. Garder le dos plat, contrôle total du mouvement.', muscle:'dos', type:'compound', equipment:'barre', rest_pause:false, pre_exhaustion:false, is_fst7:false},
          {order:4, name:'Tirage horizontal poulie', sets:7, reps:'12-15', rest:'30s', technique:'FST-7 : 7 séries avec 30s de repos. Étirer les dorsaux en tendant les bras entre chaque série.', muscle:'dos', type:'isolation', equipment:'poulie', rest_pause:false, pre_exhaustion:false, is_fst7:true, fst7_sets:7, interset_stretch:true}
        ],
        notes: 'La pré-exhaustion au pull-over cible spécifiquement les dorsaux sans fatigue préalable des biceps.',
        tips: 'Sur le FST-7, tendre les bras complètement et légèrement en avant pour maximiser l\'étirement dorsal.'
      },
      advanced: {
        exercises: [
          {order:1, name:'Pull-over poulie haute', sets:3, reps:'12-15', rest:'45s', technique:'Pré-exhaustion des dorsaux avant tous les composés. Coudes légèrement fléchis, mouvement ample.', muscle:'dos', type:'isolation', equipment:'poulie', rest_pause:false, pre_exhaustion:true, is_fst7:false},
          {order:2, name:'Tirage vertical barre prise large', sets:4, reps:'6-8', rest:'2min30s', technique:'Série à l\'échec, puis rest-pause 15s et 2-3 reps supplémentaires. Tirer la barre vers le sternum.', muscle:'dos', type:'compound', equipment:'barre', rest_pause:true, pre_exhaustion:false, is_fst7:false},
          {order:3, name:'Rowing barre prise pronation', sets:3, reps:'8-10', rest:'2min', technique:'Buste quasi horizontal à 30°, tirer vers le bas-ventre. Insister sur la contraction des rhomboïdes.', muscle:'dos', type:'compound', equipment:'barre', rest_pause:false, pre_exhaustion:false, is_fst7:false},
          {order:4, name:'Traction lestée', sets:3, reps:'6-8', rest:'2min', technique:'Traction avec lest, prise neutre ou supination selon confort. Monter le menton au-dessus de la barre.', muscle:'dos', type:'compound', equipment:'barre de traction', rest_pause:false, pre_exhaustion:false, is_fst7:false},
          {order:5, name:'Tirage poitrine poulie haute', sets:7, reps:'12-15', rest:'30s', technique:'FST-7 : 7 séries avec 30s de repos. Étirer les dorsaux en tendant les bras entre chaque série.', muscle:'dos', type:'isolation', equipment:'poulie', rest_pause:false, pre_exhaustion:false, is_fst7:true, fst7_sets:7, interset_stretch:true}
        ],
        notes: 'Programme dos haute intensité : pré-exhaustion + rest-pause + volume FST-7. Récupération complète obligatoire.',
        tips: 'Le rest-pause au tirage vertical doit être effectué avec un spot si nécessaire pour sécuriser le mouvement.'
      }
    },
    epaules: {
      beginner: {
        exercises: [
          {order:1, name:'Développé militaire barre', sets:3, reps:'8-10', rest:'2min', technique:'Prise légèrement plus large que les épaules, pousser la barre au-dessus de la tête. Rentrer le menton au passage de la barre.', muscle:'épaules', type:'compound', equipment:'barre', rest_pause:false, pre_exhaustion:false, is_fst7:false},
          {order:2, name:'Élévations latérales haltères', sets:3, reps:'12-15', rest:'90s', technique:'Lever les bras à hauteur des épaules, légèrement en avant. Contrôle de la descente, éviter le balancement.', muscle:'épaules', type:'isolation', equipment:'haltères', rest_pause:false, pre_exhaustion:false, is_fst7:false},
          {order:3, name:'Oiseau haltères', sets:3, reps:'12-15', rest:'90s', technique:'Buste incliné, lever les bras sur les côtés en arc de cercle. Pincer les omoplates en haut du mouvement.', muscle:'épaules', type:'isolation', equipment:'haltères', rest_pause:false, pre_exhaustion:false, is_fst7:false}
        ],
        notes: 'Priorité à la stabilité de l\'épaule avant d\'augmenter les charges. Les épaules sont une articulation fragile.',
        tips: 'Ne monte jamais les coudes au-dessus des épaules sur les élévations latérales pour protéger la coiffe des rotateurs.'
      },
      intermediate: {
        exercises: [
          {order:1, name:'Élévations latérales haltères', sets:3, reps:'15-20', rest:'45s', technique:'Pré-exhaustion du faisceau médian avant le développé. Lever jusqu\'à l\'horizontale, pinkies légèrement en bas.', muscle:'épaules', type:'isolation', equipment:'haltères', rest_pause:false, pre_exhaustion:true, is_fst7:false},
          {order:2, name:'Développé militaire haltères', sets:4, reps:'8-10', rest:'2min', technique:'Deltoïdes pré-fatigués, utiliser une charge modérée. Pousser en arc au-dessus de la tête, sans verrouiller les coudes.', muscle:'épaules', type:'compound', equipment:'haltères', rest_pause:false, pre_exhaustion:false, is_fst7:false},
          {order:3, name:'Arnold press', sets:3, reps:'10-12', rest:'90s', technique:'Rotation des poignets pendant le d\u00e9velopp\u00e9 pour activer tous les faisceaux. Partir paumes vers soi (halt\u00e8res \u00e0 hauteur des \u00e9paules), finir paumes vers l\'avant en haut. Contr\u00f4ler la descente 2s.', muscle:'\u00e9paules', type:'compound', equipment:'halt\u00e8res', rest_pause:false, pre_exhaustion:false, is_fst7:false},
          {order:4, name:'Élévations latérales poulie basse', sets:7, reps:'12-15', rest:'30s', technique:'FST-7 : 7 séries avec 30s de repos. Étirer le deltoïde en baissant le bras entre chaque série.', muscle:'épaules', type:'isolation', equipment:'poulie', rest_pause:false, pre_exhaustion:false, is_fst7:true, fst7_sets:7, interset_stretch:true}
        ],
        notes: 'La pré-exhaustion au latéral isole le deltoïde médian avant de le solliciter lors du développé composé.',
        tips: 'Sur le FST-7, croiser légèrement le câble devant le corps pour un meilleur angle sur le deltoïde médian.'
      },
      advanced: {
        exercises: [
          {order:1, name:'Élévations latérales haltères', sets:3, reps:'15-20', rest:'45s', technique:'Pré-exhaustion du deltoïde médian à l\'échec. Tempo lent, 3 secondes de descente contrôlée.', muscle:'épaules', type:'isolation', equipment:'haltères', rest_pause:false, pre_exhaustion:true, is_fst7:false},
          {order:2, name:'Développé militaire barre', sets:4, reps:'6-8', rest:'2min30s', technique:'Série à l\'échec absolu puis rest-pause 15s et 2-3 reps supplémentaires. Prise pronation, coudes sous la barre.', muscle:'épaules', type:'compound', equipment:'barre', rest_pause:true, pre_exhaustion:false, is_fst7:false},
          {order:3, name:'Oiseau haltères', sets:3, reps:'10-12', rest:'90s', technique:'Faisceau postérieur à haute intensité, buste parallèle au sol. Élever les bras jusqu\'à l\'horizontale, pause en haut.', muscle:'épaules', type:'isolation', equipment:'haltères', rest_pause:false, pre_exhaustion:false, is_fst7:false},
          {order:4, name:'Élévation frontale barre', sets:3, reps:'10-12', rest:'90s', technique:'Faisceau antérieur avec barre, prise pronation légèrement plus large que les épaules. Monter à hauteur des yeux.', muscle:'épaules', type:'isolation', equipment:'barre', rest_pause:false, pre_exhaustion:false, is_fst7:false},
          {order:5, name:'Élévations latérales poulie basse', sets:7, reps:'12-15', rest:'30s', technique:'FST-7 : 7 séries avec 30s de repos. Étirer le deltoïde en baissant le bras entre chaque série.', muscle:'épaules', type:'isolation', equipment:'poulie', rest_pause:false, pre_exhaustion:false, is_fst7:true, fst7_sets:7, interset_stretch:true}
        ],
        notes: 'Programme épaules complet : tous les faisceaux travaillés avec les trois techniques d\'intensité combinées.',
        tips: 'La récupération des épaules est plus lente : minimum 5 jours entre deux séances dédiées aux deltoïdes.'
      }
    },
    bras: {
      beginner: {
        exercises: [
          {order:1, name:'Curl barre', sets:3, reps:'8-10', rest:'2min', technique:'Coudes fixes le long du corps, monter la barre jusqu\'au front en supination. Descendre lentement en 3 secondes pour garder la tension.', muscle:'biceps', type:'compound', equipment:'barre', rest_pause:false, pre_exhaustion:false, is_fst7:false},
          {order:2, name:'Extension triceps poulie haute', sets:3, reps:'10-12', rest:'90s', technique:'Coudes fixes près du corps, pousser la corde vers le bas jusqu\'à extension complète. Contracter les triceps en bas, remonter lentement.', muscle:'triceps', type:'isolation', equipment:'poulie', rest_pause:false, pre_exhaustion:false, is_fst7:false},
          {order:3, name:'Curl haltères alterné', sets:3, reps:'10-12', rest:'90s', technique:'Alterner les bras, supiner le poignet pendant la montée. Garder le coude fixe et éviter de balancer le buste.', muscle:'biceps', type:'isolation', equipment:'haltères', rest_pause:false, pre_exhaustion:false, is_fst7:false},
          {order:4, name:'Dips banc triceps', sets:3, reps:'10-15', rest:'90s', technique:'Mains sur un banc derrière soi, descendre les fesses vers le sol en pliant les coudes. Pousser pour revenir en gardant les coudes proches du corps.', muscle:'triceps', type:'compound', equipment:'banc', rest_pause:false, pre_exhaustion:false, is_fst7:false}
        ],
        notes: 'Biceps et triceps travaillés en alternance. Priorité à la technique et à la connexion neuromusculaire.',
        tips: 'Les bras progressent mieux quand on les isole : concentre-toi sur la contraction à chaque répétition plutôt que sur le poids.'
      },
      intermediate: {
        exercises: [
          {order:1, name:'Curl concentration haltère', sets:3, reps:'12-15', rest:'45s', technique:'Pré-exhaustion : coude posé contre la cuisse, monter l\'haltère en supination maximale. Pic de contraction 1 seconde en haut.', muscle:'biceps', type:'isolation', equipment:'haltères', rest_pause:false, pre_exhaustion:true, is_fst7:false},
          {order:2, name:'Curl barre EZ', sets:4, reps:'8-10', rest:'2min', technique:'Biceps pré-fatigués, prise pronée sur la barre EZ pour réduire le stress des poignets. Coudes fixes, tempo 2-0-2.', muscle:'biceps', type:'compound', equipment:'barre EZ', rest_pause:false, pre_exhaustion:false, is_fst7:false},
          {order:3, name:'Extension crâne barre EZ', sets:4, reps:'8-10', rest:'2min', technique:'Allongé sur banc, descendre la barre EZ vers le front en pliant les coudes. Coudes pointés au plafond, extension explosive.', muscle:'triceps', type:'compound', equipment:'barre EZ', rest_pause:false, pre_exhaustion:false, is_fst7:false},
          {order:4, name:'Curl marteau haltères', sets:3, reps:'10-12', rest:'90s', technique:'Prise neutre (marteau), travailler le brachial et le brachioradial. Monter en gardant les coudes fixes, alterner ou simultané.', muscle:'biceps', type:'isolation', equipment:'haltères', rest_pause:false, pre_exhaustion:false, is_fst7:false},
          {order:5, name:'Curl câble barre droite', sets:7, reps:'12-15', rest:'30s', technique:'FST-7 : 7 séries, 30s repos. Étirer le biceps entre chaque série en laissant le câble tendre le bras complètement vers le bas.', muscle:'biceps', type:'isolation', equipment:'poulie', rest_pause:false, pre_exhaustion:false, is_fst7:true, fst7_sets:7, interset_stretch:true}
        ],
        notes: 'La pré-exhaustion au curl concentration maximise l\'activation du chef court du biceps avant le travail lourd.',
        tips: 'Sur le FST-7 câble, le passage entre chaque série doit inclure un étirement actif du biceps bras tendu pendant 20 secondes.'
      },
      advanced: {
        exercises: [
          {order:1, name:'Curl incliné haltères', sets:3, reps:'12-15', rest:'45s', technique:'Pré-exhaustion sur banc incliné à 45°, bras pendants derrière le corps pour étirer le biceps au maximum. Supination complète pendant la montée.', muscle:'biceps', type:'isolation', equipment:'haltères', rest_pause:false, pre_exhaustion:true, is_fst7:false},
          {order:2, name:'Curl barre debout', sets:4, reps:'6-8', rest:'2min30s', technique:'Série à l\'échec absolu puis rest-pause 15s et 2-3 reps supplémentaires. Coudes fixes, contraction maximale en haut.', muscle:'biceps', type:'compound', equipment:'barre', rest_pause:true, pre_exhaustion:false, is_fst7:false},
          {order:3, name:'Extension triceps barre EZ couché', sets:4, reps:'6-8', rest:'2min30s', technique:'Série à l\'échec puis rest-pause 15s et 2-3 reps. Descendre vers le front, extension explosive, coudes fixes au plafond.', muscle:'triceps', type:'compound', equipment:'barre EZ', rest_pause:true, pre_exhaustion:false, is_fst7:false},
          {order:4, name:'Dips lest triceps', sets:3, reps:'8-10', rest:'2min', technique:'Buste droit pour isoler les triceps, lest sur les hanches. Descendre jusqu\'à 90° de flexion du coude, pousser de façon explosive.', muscle:'triceps', type:'compound', equipment:'barre parallèle', rest_pause:false, pre_exhaustion:false, is_fst7:false},
          {order:5, name:'Curl câble unilatéral', sets:7, reps:'12-15', rest:'30s', technique:'FST-7 : 7 séries, 30s repos. Étirer le biceps entre chaque série en laissant le bras descendre complètement derrière le corps.', muscle:'biceps', type:'isolation', equipment:'poulie', rest_pause:false, pre_exhaustion:false, is_fst7:true, fst7_sets:7, interset_stretch:true}
        ],
        notes: 'Programme bras haute intensité : pré-exhaustion, double rest-pause et FST-7. Récupération de 5 jours entre deux séances bras.',
        tips: 'Biceps et triceps étant synergistes, alterner leur travail dans la séance évite la fatigue accumulative et optimise le pump global.'
      }
    },
    jambes: {
      beginner: {
        exercises: [
          {order:1, name:'Squat barre', sets:3, reps:'8-10', rest:'2min30s', technique:'Pieds largeur épaules, descendre jusqu\'à ce que les cuisses soient parallèles au sol. Genoux dans l\'axe des orteils, dos droit tout au long du mouvement.', muscle:'quadriceps', type:'compound', equipment:'barre', rest_pause:false, pre_exhaustion:false, is_fst7:false},
          {order:2, name:'Leg curl couché', sets:3, reps:'10-12', rest:'90s', technique:'Allongé face vers le bas, ramener les talons vers les fessiers en contractant les ischio-jambiers. Éviter de soulever les hanches pendant le mouvement.', muscle:'ischio-jambiers', type:'isolation', equipment:'machine', rest_pause:false, pre_exhaustion:false, is_fst7:false},
          {order:3, name:'Presse à jambes', sets:3, reps:'10-12', rest:'2min', technique:'Pieds à mi-hauteur de la plateforme, descendre en contrôle jusqu\'à 90° de flexion. Ne jamais verrouiller les genoux en extension.', muscle:'quadriceps', type:'compound', equipment:'machine', rest_pause:false, pre_exhaustion:false, is_fst7:false},
          {order:4, name:'Mollets debout machine', sets:3, reps:'15-20', rest:'60s', technique:'Monter sur la pointe des pieds le plus haut possible, pause 1 seconde en haut. Descendre lentement pour étirer le mollet au maximum.', muscle:'mollets', type:'isolation', equipment:'machine', rest_pause:false, pre_exhaustion:false, is_fst7:false}
        ],
        notes: 'Quadriceps, ischio-jambiers et mollets travaillés à chaque séance. Maîtrise du squat avant tout.',
        tips: 'Sur le squat, filmer de côté pour vérifier que les genoux ne s\'inclinent pas vers l\'intérieur lors de la montée.'
      },
      intermediate: {
        exercises: [
          {order:1, name:'Leg extension', sets:3, reps:'15-20', rest:'45s', technique:'Pré-exhaustion des quadriceps avant le squat. Extension complète en haut, pause 1 seconde, descente lente en 3 secondes.', muscle:'quadriceps', type:'isolation', equipment:'machine', rest_pause:false, pre_exhaustion:true, is_fst7:false},
          {order:2, name:'Squat barre', sets:4, reps:'8-10', rest:'2min30s', technique:'Quadriceps pré-fatigués, utiliser une charge légèrement réduite. Profondeur complète, talons au sol, genou dans l\'axe.', muscle:'quadriceps', type:'compound', equipment:'barre', rest_pause:false, pre_exhaustion:false, is_fst7:false},
          {order:3, name:'Romanian deadlift', sets:4, reps:'10-12', rest:'2min', technique:'Barre proche des jambes, descendre en gardant le dos plat jusqu\'à sentir l\'étirement des ischios. Hanches en arrière, pas les épaules.', muscle:'ischio-jambiers', type:'compound', equipment:'barre', rest_pause:false, pre_exhaustion:false, is_fst7:false},
          {order:4, name:'Fentes haltères marchées', sets:3, reps:'12 par jambe', rest:'90s', technique:'Grand pas vers l\'avant, genou avant à 90°, genou arrière effleure le sol. Pousser sur le talon avant pour revenir.', muscle:'quadriceps', type:'compound', equipment:'haltères', rest_pause:false, pre_exhaustion:false, is_fst7:false},
          {order:5, name:'Leg extension câble assis', sets:7, reps:'12-15', rest:'30s', technique:'FST-7 : 7 séries, 30s repos. Étirer le quadriceps entre chaque série en pliant le genou au maximum vers l\'arrière.', muscle:'quadriceps', type:'isolation', equipment:'machine', rest_pause:false, pre_exhaustion:false, is_fst7:true, fst7_sets:7, interset_stretch:true}
        ],
        notes: 'La pré-exhaustion au leg extension pré-fatigue le quadriceps vaste externe avant le squat pour un recrutement maximal.',
        tips: 'Sur le FST-7, entre chaque série, plier le genou en arrière et tenir 20 secondes pour étirer le quadriceps en profondeur.'
      },
      advanced: {
        exercises: [
          {order:1, name:'Leg extension', sets:3, reps:'15-20', rest:'45s', technique:'Pré-exhaustion maximale des quadriceps à l\'échec. Tempo 2-1-3, 1 seconde de contraction isométrique en haut.', muscle:'quadriceps', type:'isolation', equipment:'machine', rest_pause:false, pre_exhaustion:true, is_fst7:false},
          {order:2, name:'Squat barre profond', sets:4, reps:'6-8', rest:'3min', technique:'Série à l\'échec absolu puis rest-pause 15s et 2-3 reps supplémentaires. Descente en dessous du parallèle, dos neutre.', muscle:'quadriceps', type:'compound', equipment:'barre', rest_pause:true, pre_exhaustion:false, is_fst7:false},
          {order:3, name:'Romanian deadlift barre', sets:4, reps:'8-10', rest:'2min', technique:'Ischio-jambiers à haute intensité, charge lourde avec ceinture si nécessaire. Descendre jusqu\'à l\'étirement maximal des ischios.', muscle:'ischio-jambiers', type:'compound', equipment:'barre', rest_pause:false, pre_exhaustion:false, is_fst7:false},
          {order:4, name:'Leg curl assis', sets:3, reps:'10-12', rest:'90s', technique:'Position assise pour maximiser l\'étirement des ischios. Ramener les talons sous le siège, contraction maximale en bas.', muscle:'ischio-jambiers', type:'isolation', equipment:'machine', rest_pause:false, pre_exhaustion:false, is_fst7:false},
          {order:5, name:'Mollets debout presse', sets:7, reps:'12-15', rest:'30s', technique:'FST-7 : 7 séries, 30s repos. Étirer le mollet entre chaque série en laissant le talon descendre au maximum sur la plateforme.', muscle:'mollets', type:'isolation', equipment:'machine', rest_pause:false, pre_exhaustion:false, is_fst7:true, fst7_sets:7, interset_stretch:true}
        ],
        notes: 'Programme jambes complet : quadriceps, ischio-jambiers et mollets avec les trois techniques d\'intensité. Récupération de 5-7 jours.',
        tips: 'Après une séance jambes avancée, marcher 10 minutes et s\'étirer 15 minutes aide à éliminer les métabolites et réduire les courbatures.'
      }
    },
    fessiers: {
      beginner: {
        exercises: [
          {order:1, name:'Hip thrust barre', sets:3, reps:'10-12', rest:'2min', technique:'Épaules sur banc, barre sur les hanches, pousser les hanches vers le plafond jusqu\'à alignement. Serrer les fessiers en haut et tenir 1 seconde.', muscle:'fessiers', type:'compound', equipment:'barre', rest_pause:false, pre_exhaustion:false, is_fst7:false},
          {order:2, name:'Squat sumo haltères', sets:3, reps:'12-15', rest:'90s', technique:'Écartement large des pieds, orteils pointés à 45°, descendre en gardant le buste droit. Les genoux suivent la direction des pieds.', muscle:'fessiers', type:'compound', equipment:'haltères', rest_pause:false, pre_exhaustion:false, is_fst7:false},
          {order:3, name:'Abduction hanche machine', sets:3, reps:'15-20', rest:'60s', technique:'Assis sur la machine, écarter les jambes contre la résistance en contractant les fessiers. Revenir lentement sans laisser les poids se toucher.', muscle:'fessiers', type:'isolation', equipment:'machine', rest_pause:false, pre_exhaustion:false, is_fst7:false}
        ],
        notes: 'Focus sur l\'activation des fessiers à chaque répétition. Beaucoup de pratiquants ont du mal à les sentir au début.',
        tips: 'Avant la séance, faire 2 séries de 20 abductions avec élastique debout pour activer les fessiers et améliorer leur recrutement.'
      },
      intermediate: {
        exercises: [
          {order:1, name:'Abduction câble debout', sets:3, reps:'15-20', rest:'45s', technique:'Pré-exhaustion du grand fessier avant le composé. Câble à la cheville, lever la jambe sur le côté en gardant le buste droit.', muscle:'fessiers', type:'isolation', equipment:'poulie', rest_pause:false, pre_exhaustion:true, is_fst7:false},
          {order:2, name:'Hip thrust barre', sets:4, reps:'8-10', rest:'2min', technique:'Fessiers pré-fatigués, charge maximale sur les hanches. Monter jusqu\'à alignement parfait, serrer fort en haut pendant 2 secondes.', muscle:'fessiers', type:'compound', equipment:'barre', rest_pause:false, pre_exhaustion:false, is_fst7:false},
          {order:3, name:'Fente arrière barre', sets:3, reps:'10-12 par jambe', rest:'2min', technique:'Reculer un pied, genou arrière proche du sol. Pousser sur le talon avant pour solliciter prioritairement le fessier.', muscle:'fessiers', type:'compound', equipment:'barre', rest_pause:false, pre_exhaustion:false, is_fst7:false},
          {order:4, name:'Kickback câble à 4 pattes', sets:7, reps:'12-15', rest:'30s', technique:'FST-7 : 7 séries, 30s repos. Étirer le fessier entre chaque série en ramenant le genou vers la poitrine pendant 15 secondes.', muscle:'fessiers', type:'isolation', equipment:'poulie', rest_pause:false, pre_exhaustion:false, is_fst7:true, fst7_sets:7, interset_stretch:true}
        ],
        notes: 'La pré-exhaustion à l\'abduction câble préactive le grand fessier avant le hip thrust pour un recrutement supérieur.',
        tips: 'Sur le FST-7 kickback, l\'étirement du fessier entre les séries (genou vers la poitrine) est crucial pour l\'expansion fasciale.'
      },
      advanced: {
        exercises: [
          {order:1, name:'Abduction élastique debout', sets:3, reps:'20-25', rest:'30s', technique:'Pré-exhaustion complète du grand fessier à l\'échec avec élastique fort. Activation totale avant le travail lourd.', muscle:'fessiers', type:'isolation', equipment:'élastique', rest_pause:false, pre_exhaustion:true, is_fst7:false},
          {order:2, name:'Hip thrust barre lourde', sets:4, reps:'6-8', rest:'2min30s', technique:'Série à l\'échec puis rest-pause 15s et 2-3 reps supplémentaires. Charge maximale, serrer les fessiers avec force en haut.', muscle:'fessiers', type:'compound', equipment:'barre', rest_pause:true, pre_exhaustion:false, is_fst7:false},
          {order:3, name:'Romanian deadlift jambes tendues', sets:3, reps:'10-12', rest:'2min', technique:'Focus fessiers en gardant les hanches hautes pendant la descente. Étirer le fessier et les ischios au maximum en bas.', muscle:'fessiers', type:'compound', equipment:'barre', rest_pause:false, pre_exhaustion:false, is_fst7:false},
          {order:4, name:'Fente bulgare barre', sets:3, reps:'8-10 par jambe', rest:'2min', technique:'Pied arrière surélevé sur banc, descendre en profondeur pour maximiser l\'étirement du fessier avant. Pousser sur le talon.', muscle:'fessiers', type:'compound', equipment:'barre', rest_pause:false, pre_exhaustion:false, is_fst7:false},
          {order:5, name:'Kickback câble unilatéral', sets:7, reps:'12-15', rest:'30s', technique:'FST-7 : 7 séries, 30s repos. Étirer le fessier entre chaque série en ramenant le genou vers la poitrine et tenir 20 secondes.', muscle:'fessiers', type:'isolation', equipment:'poulie', rest_pause:false, pre_exhaustion:false, is_fst7:true, fst7_sets:7, interset_stretch:true}
        ],
        notes: 'Programme fessiers haute intensité combinant les trois méthodes. Récupération de 5-7 jours pour une croissance optimale.',
        tips: 'Sur le rest-pause hip thrust, utiliser un pad de protection épais sur les hanches et garder une ceinture lombaire pour les charges maximales.'
      }
    }
  },
  splits: {
    3: {
      name: 'Fusion 3 jours',
      days: [
        {day:1, label:'Push — Pectoraux + Épaules + Triceps', muscles:['pectoraux','epaules','bras']},
        {day:2, label:'Repos'},
        {day:3, label:'Pull — Dos + Biceps', muscles:['dos','bras']},
        {day:4, label:'Repos'},
        {day:5, label:'Jambes + Fessiers', muscles:['jambes','fessiers']},
        {day:6, label:'Repos'},
        {day:7, label:'Repos'}
      ],
      notes: 'Idéal pour débutants. Récupération optimale entre les séances.'
    },
    4: {
      name: 'Fusion 4 jours',
      days: [
        {day:1, label:'Pectoraux + Triceps', muscles:['pectoraux','bras']},
        {day:2, label:'Dos + Biceps', muscles:['dos','bras']},
        {day:3, label:'Repos'},
        {day:4, label:'Épaules', muscles:['epaules']},
        {day:5, label:'Jambes + Fessiers', muscles:['jambes','fessiers']},
        {day:6, label:'Repos'},
        {day:7, label:'Repos'}
      ],
      notes: 'Équilibre volume et récupération. Recommandé pour intermédiaires.'
    },
    5: {
      name: 'Fusion 5 jours',
      days: [
        {day:1, label:'Pectoraux', muscles:['pectoraux']},
        {day:2, label:'Dos', muscles:['dos']},
        {day:3, label:'Épaules + Bras', muscles:['epaules','bras']},
        {day:4, label:'Jambes', muscles:['jambes']},
        {day:5, label:'Fessiers + Rattrapage', muscles:['fessiers']},
        {day:6, label:'Repos'},
        {day:7, label:'Repos'}
      ],
      notes: 'Un groupe par séance. Volume maximal. Pour avancés.'
    }
  },
  macro_cycle_12w: [
    {weeks:[1,2,3], phase:'Fondation', intensity:'Modérée', rirTarget:3, volume_modifier:0.8, focus:'Maîtrise technique et activation musculaire. Trouver les charges de travail. Introduction progressive FST-7.'},
    {weeks:[4,5,6], phase:'Progression', intensity:'Élevée', rirTarget:2, volume_modifier:1.0, focus:'Augmentation des charges. Pré-exhaustion systématique. FST-7 complet sur finisher.'},
    {weeks:[7,8,9,10], phase:'Intensification', intensity:'Maximale', rirTarget:1, volume_modifier:1.0, focus:'Rest-pause sur composés. Échec musculaire contrôlé. Surcharge progressive.'},
    {weeks:[11,12], phase:'Décharge', intensity:'Légère', rirTarget:4, volume_modifier:0.5, isDeload:true, focus:'Récupération active. 50% charges. Maintien technique. Super-compensation.'}
  ]
};

// ─── STARTING STRENGTH (Mark Rippetoe) ───────────────────────────────────────
var STARTING_STRENGTH_PROGRAMS = {
  meta: {
    name: 'Starting Strength',
    athlete: 'Méthode Mark Rippetoe',
    philosophy: 'Force pure pour débutants. Progression linéaire +2.5kg par séance sur les composés. 5 exercices, 3x5 partout (sauf deadlift 1x5). Full body 3j/sem.',
    frequency: '3 jours/semaine',
    session_duration: '60-75 min',
    key_principles: ['Progression linéaire', '3x5 sur les composés', 'Full body', 'Focus barbell uniquement', 'Aucune isolation']
  },
  programs: {
    pectoraux: {
      beginner: {
        name: 'Starting Strength A — Push',
        description: 'Workout A : Squat + Bench + Deadlift',
        warmup: '5 min vélo + mobilité épaules + sets de warm-up barre vide → 60% → 80%',
        exercises: [
          {order:1, name:'Back Squat', sets:3, reps:5, rest:'3-5min', technique:'Low bar position. Descente contrôlée jusqu\'au parallèle. Drive des hanches.', muscle:'jambes', type:'compound', equipment:'barre'},
          {order:2, name:'Bench Press', sets:3, reps:5, rest:'3-5min', technique:'Pieds plantés, arc lombaire, omoplates rétractées. Touch-and-go autorisé.', muscle:'pectoraux', type:'compound', equipment:'barre'},
          {order:3, name:'Deadlift', sets:1, reps:5, rest:'5min', technique:'Une seule série lourde. Reset chaque rep. Hip hinge, pas un squat.', muscle:'dos', type:'compound', equipment:'barre'}
        ],
        notes: 'Progression: +2.5kg par séance sur Squat/Bench, +5kg sur Deadlift. Si échec 2x: deload -10%.'
      }
    },
    dos: {
      beginner: {
        name: 'Starting Strength B — Pull',
        description: 'Workout B : Squat + Press + Power Clean',
        warmup: '5 min vélo + mobilité épaules + sets de warm-up barre vide → 60% → 80%',
        exercises: [
          {order:1, name:'Back Squat', sets:3, reps:5, rest:'3-5min', technique:'Identique au Workout A. Le squat est fait à CHAQUE séance.', muscle:'jambes', type:'compound', equipment:'barre'},
          {order:2, name:'Overhead Press', sets:3, reps:5, rest:'3-5min', technique:'Standing strict press. Pas de push press. Pieds largeur hanches, gainage total.', muscle:'epaules', type:'compound', equipment:'barre'},
          {order:3, name:'Power Clean', sets:5, reps:3, rest:'3min', technique:'Triple extension explosive. Réception en quart de squat. Reset chaque rep.', muscle:'dos', type:'compound', equipment:'barre'}
        ],
        notes: 'Workout B alterne avec Workout A: A-B-A semaine 1, B-A-B semaine 2.'
      }
    },
    epaules: {
      beginner: {
        name: 'Starting Strength — Press',
        description: 'Overhead Press inclus dans Workout B',
        warmup: '5 min vélo + rotations épaules + sets warm-up',
        exercises: [
          {order:1, name:'Overhead Press', sets:3, reps:5, rest:'3-5min', technique:'Strict press, gainage abdominal, pas de mouvement de jambes.', muscle:'epaules', type:'compound', equipment:'barre'},
          {order:2, name:'Back Squat', sets:3, reps:5, rest:'3-5min', technique:'Le squat est central — toujours présent.', muscle:'jambes', type:'compound', equipment:'barre'},
          {order:3, name:'Power Clean', sets:5, reps:3, rest:'3min', technique:'Explosivité maximale. Triple extension cheville-genou-hanche.', muscle:'dos', type:'compound', equipment:'barre'}
        ],
        notes: 'Press progresse plus lentement: +1.25kg par séance après les 2 premières semaines.'
      }
    },
    jambes: {
      beginner: {
        name: 'Starting Strength — Squat',
        description: 'Squat à chaque séance, base du programme',
        warmup: '5 min vélo + mobilité hanches + warm-up barre vide → 60% → 80%',
        exercises: [
          {order:1, name:'Back Squat', sets:3, reps:5, rest:'3-5min', technique:'Low bar, descente jusqu\'au parallèle, drive explosif des hanches. À chaque séance.', muscle:'jambes', type:'compound', equipment:'barre'},
          {order:2, name:'Deadlift', sets:1, reps:5, rest:'5min', technique:'Une seule série lourde. Setup parfait à chaque rep.', muscle:'dos', type:'compound', equipment:'barre'},
          {order:3, name:'Bench Press ou Press', sets:3, reps:5, rest:'3-5min', technique:'Alterne A/B avec Press.', muscle:'pectoraux', type:'compound', equipment:'barre'}
        ],
        notes: 'Le squat est l\'exercice CENTRAL. Présent à chaque séance. +2.5kg par séance pendant ~3 mois.'
      }
    },
    bras: {
      beginner: {
        name: 'Starting Strength — Pas d\'isolation',
        description: 'Starting Strength ne contient AUCUNE isolation des bras. Les bras travaillent indirectement via Bench Press, Press, Power Clean et Deadlift.',
        warmup: 'Voir workouts A et B',
        exercises: [
          {order:1, name:'Bench Press', sets:3, reps:5, rest:'3-5min', technique:'Sollicitation triceps importante.', muscle:'pectoraux', type:'compound', equipment:'barre'},
          {order:2, name:'Overhead Press', sets:3, reps:5, rest:'3-5min', technique:'Sollicitation triceps maximale en lockout.', muscle:'epaules', type:'compound', equipment:'barre'},
          {order:3, name:'Power Clean', sets:5, reps:3, rest:'3min', technique:'Sollicitation biceps en réception.', muscle:'dos', type:'compound', equipment:'barre'}
        ],
        notes: 'Rippetoe interdit explicitement curls et extensions triceps en programme novice. Les bras se développent via les composés.'
      }
    }
  },
  splits: {
    '3': [
      { day: 'Lundi',    type: 'workoutA', label: 'Workout A: Squat + Bench + Deadlift' },
      { day: 'Mercredi', type: 'workoutB', label: 'Workout B: Squat + Press + Power Clean' },
      { day: 'Vendredi', type: 'workoutA', label: 'Workout A: Squat + Bench + Deadlift' }
    ]
  },
  // FIX P1 audit user Thomas : macro 12 semaines en langage accessible débutant
  // (pas de FST-7, rest-pause, pré-exhaustion — ce sont des techniques avancées).
  macro_cycle_12w: [
    {weeks:[1,2], phase:'Apprentissage', intensity:'Légère', rirTarget:4, volume_modifier:0.8, focus:'Apprends les mouvements. Charges légères, focus sur la technique : position du dos, descente contrôlée, respiration. Pas grave si ça paraît facile.'},
    {weeks:[3,4,5,6,7,8], phase:'Progression linéaire', intensity:'Progressive', rirTarget:3, volume_modifier:1.0, focus:'Ajoute 2,5 kg à chaque séance sur squat/bench/press et 5 kg sur deadlift. Si tu rates 2 fois → on baisse de 10% et on recommence. C\'est normal.'},
    {weeks:[9,10,11], phase:'Consolidation', intensity:'Modérée à élevée', rirTarget:2, volume_modifier:1.0, focus:'Les charges deviennent lourdes. Prends 3-5 min de repos entre les séries. Compte tes sessions réussies.'},
    {weeks:[12], phase:'Semaine de récupération', intensity:'Légère', rirTarget:4, volume_modifier:0.5, isDeload:true, focus:'Semaine plus légère pour laisser récupérer ton corps. Charges à 50%, moins de volume. Tu reprends encore plus fort la semaine suivante.'}
  ]
};
window.STARTING_STRENGTH_PROGRAMS = STARTING_STRENGTH_PROGRAMS;

// ─── GREYSKULL LP (John Sheaffer / Johnny Pain) ──────────────────────────────
var GREYSKULL_PROGRAMS = {
  meta: {
    name: 'Greyskull LP',
    athlete: 'Méthode John Sheaffer (Johnny Pain)',
    philosophy: 'Force + Masse débutant/intermédiaire. 2x5 + AMRAP set final ("Reps For Reps"). Plug sets optionnels pour bras. Plus de fréquence sur le bench que Starting Strength.',
    frequency: '3 jours/semaine',
    session_duration: '45-60 min',
    key_principles: ['2x5 + AMRAP set', 'Reps For Reps progression', 'Bench/Press alterné', 'Plug sets bras optionnels', 'Pas de Power Clean']
  },
  programs: {
    pectoraux: {
      beginner: {
        name: 'Greyskull A — Bench Day',
        description: 'Bench Press + Squat + Plug sets bras',
        warmup: '5 min vélo + mobilité épaules + warm-up barre vide → 60% → 80%',
        exercises: [
          {order:1, name:'Bench Press', sets:3, reps:'5/5/5+', rest:'3min', technique:'2x5 normaux + 1 set AMRAP (autant de reps que possible). Si AMRAP ≥ 10 reps: +5kg séance suivante.', muscle:'pectoraux', type:'compound', equipment:'barre'},
          {order:2, name:'Back Squat', sets:3, reps:'5/5/5+', rest:'3min', technique:'2x5 + AMRAP. Low bar, descente parallèle. Progression linéaire +2.5kg.', muscle:'jambes', type:'compound', equipment:'barre'},
          {order:3, name:'Chin-Ups (plug)', sets:2, reps:'max', rest:'90s', technique:'Optional plug set: tractions supination pour biceps. Progression: ajouter 1 rep par séance.', muscle:'dos', type:'compound', equipment:'barre fixe'},
          {order:4, name:'Curl barre (plug)', sets:2, reps:8, rest:'90s', technique:'Plug set bras optionnel — Greyskull autorise l\'isolation contrairement à Starting Strength.', muscle:'bras', type:'isolation', equipment:'barre'}
        ],
        notes: 'AMRAP set (5+) est la signature Greyskull. Si AMRAP ≥ 10: double progression (+5kg). Sinon +2.5kg classique.'
      }
    },
    epaules: {
      beginner: {
        name: 'Greyskull B — Press Day',
        description: 'Overhead Press + Deadlift + Plug sets',
        warmup: '5 min vélo + mobilité épaules + warm-up',
        exercises: [
          {order:1, name:'Overhead Press', sets:3, reps:'5/5/5+', rest:'3min', technique:'2x5 + AMRAP. Strict press, gainage abdominal. Press progresse plus lentement (+1.25kg).', muscle:'epaules', type:'compound', equipment:'barre'},
          {order:2, name:'Deadlift', sets:1, reps:'5+', rest:'5min', technique:'Une seule série avec AMRAP. Reset chaque rep. +5kg si AMRAP ≥ 6.', muscle:'dos', type:'compound', equipment:'barre'},
          {order:3, name:'Dips ou Tractions (plug)', sets:2, reps:'max', rest:'90s', technique:'Plug set: dips lestés pour triceps OU tractions pour dos. Alterner.', muscle:'bras', type:'compound', equipment:'barres parallèles'},
          {order:4, name:'Curl haltères (plug)', sets:2, reps:10, rest:'90s', technique:'Plug set isolation biceps — autorisé en Greyskull.', muscle:'bras', type:'isolation', equipment:'halteres'}
        ],
        notes: 'B alterne avec A et C: Bench → Press → Bench → Press en rotation. Press toujours après bench.'
      }
    },
    dos: {
      beginner: {
        name: 'Greyskull — Deadlift focus',
        description: 'Deadlift dans Workout B avec AMRAP set',
        warmup: '5 min vélo + mobilité hanches + warm-up barre vide → 60% → 80%',
        exercises: [
          {order:1, name:'Deadlift', sets:1, reps:'5+', rest:'5min', technique:'Une série lourde avec AMRAP. Hip hinge, dos neutre, drive de jambes.', muscle:'dos', type:'compound', equipment:'barre'},
          {order:2, name:'Overhead Press', sets:3, reps:'5/5/5+', rest:'3min', technique:'Strict press 2x5 + AMRAP.', muscle:'epaules', type:'compound', equipment:'barre'},
          {order:3, name:'Pendlay Row (alt)', sets:3, reps:8, rest:'2min', technique:'Alternative au deadlift les semaines de récupération. Tirage explosif depuis le sol.', muscle:'dos', type:'compound', equipment:'barre'},
          {order:4, name:'Chin-Ups (plug)', sets:2, reps:'max', rest:'90s', technique:'Plug set tractions supination pour biceps + dos.', muscle:'dos', type:'compound', equipment:'barre fixe'}
        ],
        notes: 'Deadlift fait 1 fois sur 2 (alternance avec Pendlay Row). Évite le burnout lombaire de Starting Strength.'
      }
    },
    jambes: {
      beginner: {
        name: 'Greyskull — Squat à chaque séance',
        description: 'Le squat reste central, présent à chaque workout',
        warmup: '5 min vélo + mobilité hanches + warm-up barre vide → 60% → 80%',
        exercises: [
          {order:1, name:'Back Squat', sets:3, reps:'5/5/5+', rest:'3min', technique:'2x5 + AMRAP. À chaque séance. Progression +2.5kg si AMRAP ≥ 5.', muscle:'jambes', type:'compound', equipment:'barre'},
          {order:2, name:'Bench ou Press', sets:3, reps:'5/5/5+', rest:'3min', technique:'Alternance bench/press selon le jour.', muscle:'pectoraux', type:'compound', equipment:'barre'},
          {order:3, name:'Deadlift (1x/sem)', sets:1, reps:'5+', rest:'5min', technique:'Deadlift une fois sur deux, alterné avec Pendlay Row.', muscle:'dos', type:'compound', equipment:'barre'}
        ],
        notes: 'Squat à chaque séance, AMRAP final pour la double progression.'
      }
    },
    bras: {
      beginner: {
        name: 'Greyskull — Plug Sets autorisés',
        description: 'Contrairement à Starting Strength, Greyskull AUTORISE les plug sets bras (isolation curls + extensions)',
        warmup: 'Voir workouts A/B',
        exercises: [
          {order:1, name:'Curl barre (plug)', sets:2, reps:8, rest:'90s', technique:'Plug set après les composés. Strict, contrôlé.', muscle:'bras', type:'isolation', equipment:'barre'},
          {order:2, name:'Extensions triceps couché (plug)', sets:2, reps:10, rest:'90s', technique:'Plug set triceps. Skull crushers contrôlés.', muscle:'bras', type:'isolation', equipment:'barre'},
          {order:3, name:'Chin-Ups', sets:2, reps:'max', rest:'90s', technique:'Tractions supination = compound bras (biceps + dos).', muscle:'dos', type:'compound', equipment:'barre fixe'},
          {order:4, name:'Dips lestés', sets:2, reps:'max', rest:'90s', technique:'Compound triceps + pectoraux bas.', muscle:'bras', type:'compound', equipment:'barres parallèles'}
        ],
        notes: 'Plug sets en fin de séance UNIQUEMENT — jamais avant les composés.'
      }
    }
  },
  splits: {
    '3': [
      { day: 'Lundi',    type: 'workoutA', label: 'Workout A: Bench + Squat + Plug' },
      { day: 'Mercredi', type: 'workoutB', label: 'Workout B: Press + Deadlift + Plug' },
      { day: 'Vendredi', type: 'workoutA', label: 'Workout A: Bench + Squat + Plug' }
    ]
  }
};
window.GREYSKULL_PROGRAMS = GREYSKULL_PROGRAMS;

// ─── TEXAS METHOD (Mark Rippetoe — Intermédiaire) ────────────────────────────
var TEXAS_METHOD_PROGRAMS = {
  meta: {
    name: 'Texas Method',
    athlete: 'Méthode Mark Rippetoe (Practical Programming)',
    philosophy: 'Périodisation hebdomadaire pour intermédiaires. Lundi = Volume Day (5x5 @ 90% du 5RM). Mercredi = Recovery Day (charges légères, technique). Vendredi = Intensity Day (1x5 PR weekly).',
    frequency: '3 jours/semaine',
    session_duration: '60-90 min',
    key_principles: ['Volume Day Lundi 5x5', 'Recovery Day Mercredi', 'Intensity Day Vendredi 1x5 PR', 'PR hebdomadaire', 'Périodisation à la semaine']
  },
  programs: {
    pectoraux: {
      intermediate: {
        name: 'Texas Method — Bench Cycle',
        description: 'Bench Press 3x/sem avec périodisation Volume/Recovery/Intensity',
        warmup: '5 min vélo + mobilité épaules + warm-up barre vide → 60% → 80% → 90%',
        exercises: [
          {order:1, name:'Bench Press (Volume Day Lundi)', sets:5, reps:5, rest:'3-5min', technique:'5x5 @ 90% du 5RM. Volume maximum de la semaine. Touch-and-go contrôlé.', muscle:'pectoraux', type:'compound', equipment:'barre'},
          {order:2, name:'Bench Press (Recovery Day Mercredi)', sets:3, reps:5, rest:'2min', technique:'3x5 @ 80% du Lundi. Léger, focus technique pure. Pas d\'échec.', muscle:'pectoraux', type:'compound', equipment:'barre'},
          {order:3, name:'Bench Press (Intensity Day Vendredi)', sets:1, reps:5, rest:'5min', technique:'1x5 PR weekly. Tente +2.5kg vs vendredi précédent. C\'est LE moment de progression.', muscle:'pectoraux', type:'compound', equipment:'barre'},
          {order:4, name:'Dips lestés', sets:3, reps:8, rest:'2min', technique:'Accessoire bench du Lundi pour volume triceps + pectoraux bas.', muscle:'bras', type:'compound', equipment:'barres parallèles'}
        ],
        notes: 'Le bench progresse de +2.5kg PAR SEMAINE (PR du vendredi). Sur 12 semaines: +30kg potentiels.'
      }
    },
    jambes: {
      intermediate: {
        name: 'Texas Method — Squat Cycle',
        description: 'Squat 3x/sem avec progression hebdomadaire',
        warmup: '5 min vélo + mobilité hanches + warm-up barre vide → 60% → 75% → 90%',
        exercises: [
          {order:1, name:'Back Squat (Volume Day Lundi)', sets:5, reps:5, rest:'3-5min', technique:'5x5 @ 90% du 5RM. C\'est le plus dur de la semaine. Volume max.', muscle:'jambes', type:'compound', equipment:'barre'},
          {order:2, name:'Back Squat (Recovery Day Mercredi)', sets:2, reps:5, rest:'2min', technique:'2x5 @ 80% du Lundi. Récupération active. Vitesse de barre.', muscle:'jambes', type:'compound', equipment:'barre'},
          {order:3, name:'Back Squat (Intensity Day Vendredi)', sets:1, reps:5, rest:'5min', technique:'1x5 PR weekly. Tente +2.5kg vs semaine passée. Attempt unique.', muscle:'jambes', type:'compound', equipment:'barre'},
          {order:4, name:'Front Squat (alt Mercredi)', sets:3, reps:5, rest:'2min30', technique:'Alternative au Recovery Day pour varier le stimulus quad.', muscle:'jambes', type:'compound', equipment:'barre'}
        ],
        notes: 'Squat = exercice central. PR weekly hardgainer-friendly. +2.5kg/sem pendant 8-12 semaines réalistes.'
      }
    },
    dos: {
      intermediate: {
        name: 'Texas Method — Deadlift Cycle',
        description: 'Deadlift 1x/semaine (Vendredi Intensity Day) — récupération nerveuse',
        warmup: '5 min vélo + warm-up barre vide → 60% → 80% → 90%',
        exercises: [
          {order:1, name:'Deadlift (Vendredi)', sets:1, reps:5, rest:'5min', technique:'1x5 PR weekly. UNE série lourde par semaine. +2.5-5kg vs semaine passée.', muscle:'dos', type:'compound', equipment:'barre'},
          {order:2, name:'Power Clean (Lundi Volume)', sets:5, reps:3, rest:'3min', technique:'5x3 explosif. Alternative au pull dans Volume Day.', muscle:'dos', type:'compound', equipment:'barre'},
          {order:3, name:'Pendlay Row (Mercredi)', sets:3, reps:5, rest:'2min', technique:'Tirage explosif depuis le sol. Recovery Day, charges modérées.', muscle:'dos', type:'compound', equipment:'barre'},
          {order:4, name:'Chin-Ups (accessoire)', sets:3, reps:'max', rest:'2min', technique:'Accessoire dos. Lestés si possible. AMRAP final.', muscle:'dos', type:'compound', equipment:'barre fixe'}
        ],
        notes: 'Deadlift seulement le Vendredi: la récupération nerveuse est cruciale. Alternance Power Clean (Lundi) + Pendlay Row (Mercredi).'
      }
    },
    epaules: {
      intermediate: {
        name: 'Texas Method — Press Cycle',
        description: 'Overhead Press alterné avec Bench (Lundi/Vendredi)',
        warmup: '5 min vélo + mobilité épaules + warm-up',
        exercises: [
          {order:1, name:'Overhead Press (Volume Day Lundi)', sets:5, reps:5, rest:'3min', technique:'5x5 @ 90% du 5RM. Strict press, gainage abdominal.', muscle:'epaules', type:'compound', equipment:'barre'},
          {order:2, name:'OHP (Recovery Day Mercredi)', sets:3, reps:5, rest:'2min', technique:'3x5 @ 80%. Focus technique pure.', muscle:'epaules', type:'compound', equipment:'barre'},
          {order:3, name:'OHP (Intensity Day Vendredi)', sets:1, reps:5, rest:'5min', technique:'1x5 PR weekly. +1.25-2.5kg vs vendredi passé.', muscle:'epaules', type:'compound', equipment:'barre'},
          {order:4, name:'Élévations latérales', sets:3, reps:12, rest:'90s', technique:'Accessoire épaules pour volume sans surcharger CNS.', muscle:'epaules', type:'isolation', equipment:'halteres'}
        ],
        notes: 'OHP progresse +1.25kg/sem (microplaques recommandées). Plus lent que squat/bench.'
      }
    },
    bras: {
      intermediate: {
        name: 'Texas Method — Accessoires Bras',
        description: 'Curls + extensions en accessoires (jamais en exercice principal)',
        warmup: 'Voir cycles bench/press',
        exercises: [
          {order:1, name:'Curl barre', sets:3, reps:8, rest:'90s', technique:'Accessoire après les composés. Strict.', muscle:'bras', type:'isolation', equipment:'barre'},
          {order:2, name:'Extensions triceps couché (skull crushers)', sets:3, reps:10, rest:'90s', technique:'Accessoire triceps. Barre EZ.', muscle:'bras', type:'isolation', equipment:'barre'},
          {order:3, name:'Curl haltères marteau', sets:3, reps:10, rest:'90s', technique:'Hammer curl pour brachial.', muscle:'bras', type:'isolation', equipment:'halteres'},
          {order:4, name:'Pushdown corde', sets:3, reps:12, rest:'90s', technique:'Finisseur triceps poulie haute.', muscle:'bras', type:'isolation', equipment:'poulie'}
        ],
        notes: 'Bras = accessoire pur en Texas Method. Volume modéré, jamais à l\'échec.'
      }
    }
  },
  splits: {
    '3': [
      { day: 'Lundi',    type: 'volume',    label: 'Volume Day: 5x5 @ 90%' },
      { day: 'Mercredi', type: 'recovery',  label: 'Recovery Day: 80% du Lundi' },
      { day: 'Vendredi', type: 'intensity', label: 'Intensity Day: 1x5 PR weekly' }
    ]
  }
};
window.TEXAS_METHOD_PROGRAMS = TEXAS_METHOD_PROGRAMS;

// ─── nSuns 5/3/1 (Powerbuilding hybride) ─────────────────────────────────────
var NSUNS_PROGRAMS = {
  meta: {
    name: 'nSuns 5/3/1',
    athlete: 'Variant nSuns du Wendler 5/3/1',
    philosophy: 'Powerbuilding intermédiaire/avancé. Lift principal en 5/3/1 + Lift secondaire 3x8-12 + Accessoires hypertrophie. 5-6j/sem. Rotation Squat/Bench/Deadlift/OHP. Beaucoup plus de volume que Wendler classique.',
    frequency: '5-6 jours/semaine',
    session_duration: '75-90 min',
    key_principles: ['5/3/1 sur lift principal', 'Lift secondaire 3x8-12', 'Accessoires hypertrophie', 'AMRAP set final', 'Training Max = 90% du 1RM']
  },
  programs: {
    pectoraux: {
      intermediate: {
        name: 'nSuns Bench Day',
        description: 'Bench Press (T1) + OHP (T2) + Accessoires',
        warmup: '5 min vélo + mobilité épaules + warm-up barre vide → 50% → 70% → 80%',
        exercises: [
          {order:1, name:'Bench Press T1 (5/3/1+)', sets:9, reps:'8/6/4/4/4/5/6/7/8+', rest:'3min', technique:'9 sets nSuns: 8@65%/6@75%/4@85%/4@85%/4@85%/5@80%/6@75%/7@70%/8+@65% (AMRAP). Training Max = 90% 1RM.', muscle:'pectoraux', type:'compound', equipment:'barre'},
          {order:2, name:'Overhead Press T2', sets:8, reps:'6/5/3/5/7/4/6/8', rest:'2min30', technique:'Lift secondaire 8 sets nSuns. Strict press, gainage abdominal.', muscle:'epaules', type:'compound', equipment:'barre'},
          {order:3, name:'Dips lestés', sets:3, reps:8, rest:'2min', technique:'Accessoire pectoraux + triceps. Lestés si possible.', muscle:'pectoraux', type:'compound', equipment:'barres parallèles'},
          {order:4, name:'Élévations latérales', sets:4, reps:12, rest:'90s', technique:'Accessoire isolation épaules pour volume.', muscle:'epaules', type:'isolation', equipment:'halteres'},
          {order:5, name:'Pushdown corde', sets:4, reps:12, rest:'90s', technique:'Accessoire triceps poulie haute.', muscle:'bras', type:'isolation', equipment:'poulie'}
        ],
        notes: 'Le 9e set est AMRAP — battre les reps du PR précédent. Training Max augmente quand on bat le PR.'
      }
    },
    jambes: {
      intermediate: {
        name: 'nSuns Squat Day',
        description: 'Back Squat (T1) + Deadlift (T2) + Accessoires jambes',
        warmup: '5 min vélo + mobilité hanches + warm-up barre vide → 50% → 70% → 80%',
        exercises: [
          {order:1, name:'Back Squat T1 (5/3/1+)', sets:9, reps:'5/3/1+/3/3/3/5/5/5+', rest:'3min', technique:'9 sets: 5@75%/3@85%/1+@95%(AMRAP)/3@90%/3@85%/3@80%/5@75%/5@70%/5+@65%. Volume + intensité combinés.', muscle:'jambes', type:'compound', equipment:'barre'},
          {order:2, name:'Deadlift T2 (Sumo)', sets:8, reps:'5/5/3/5/7/4/6/8', rest:'2min30', technique:'Sumo deadlift en lift secondaire. Variation pour économiser le bas du dos.', muscle:'dos', type:'compound', equipment:'barre'},
          {order:3, name:'Leg Press', sets:4, reps:12, rest:'2min', technique:'Accessoire quadriceps pour volume.', muscle:'jambes', type:'compound', equipment:'machine'},
          {order:4, name:'Leg Curl couché', sets:4, reps:12, rest:'90s', technique:'Accessoire ischios.', muscle:'jambes', type:'isolation', equipment:'machine'},
          {order:5, name:'Calf Raise debout', sets:4, reps:15, rest:'60s', technique:'Accessoire mollets.', muscle:'jambes', type:'isolation', equipment:'machine'}
        ],
        notes: 'Les jours T1 alternent: Squat → Bench → Deadlift → OHP → Squat variation. 5j/sem rotatif.'
      }
    },
    dos: {
      intermediate: {
        name: 'nSuns Deadlift Day',
        description: 'Deadlift (T1) + Front Squat (T2) + Accessoires dos',
        warmup: '5 min vélo + warm-up barre vide → 50% → 70% → 80%',
        exercises: [
          {order:1, name:'Deadlift T1 (5/3/1+)', sets:9, reps:'5/3/1+/3/3/3/5/5/5+', rest:'4min', technique:'9 sets: 5@75%/3@85%/1+@95%(AMRAP)/3@90%/.../5+@65%. Reset chaque rep, technique parfaite.', muscle:'dos', type:'compound', equipment:'barre'},
          {order:2, name:'Front Squat T2', sets:8, reps:'5/5/3/5/7/4/6/8', rest:'2min30', technique:'Front squat en secondaire — taille élancée + quad focus.', muscle:'jambes', type:'compound', equipment:'barre'},
          {order:3, name:'Pendlay Row', sets:4, reps:8, rest:'2min', technique:'Accessoire dos épaisseur. Tirage explosif depuis le sol.', muscle:'dos', type:'compound', equipment:'barre'},
          {order:4, name:'Pull-Ups lestés', sets:4, reps:8, rest:'2min', technique:'Accessoire largeur dorsale. Lestés.', muscle:'dos', type:'compound', equipment:'barre fixe'},
          {order:5, name:'Face Pull corde', sets:4, reps:15, rest:'60s', technique:'Accessoire arrière-épaules + santé scapulaire.', muscle:'epaules', type:'isolation', equipment:'poulie'}
        ],
        notes: 'Deadlift jour le plus exigeant — récupération critique. Privilégier sommeil + nutrition.'
      }
    },
    epaules: {
      intermediate: {
        name: 'nSuns OHP Day',
        description: 'Overhead Press (T1) + Bench (T2) + Accessoires épaules',
        warmup: '5 min vélo + mobilité épaules + warm-up',
        exercises: [
          {order:1, name:'Overhead Press T1 (5/3/1+)', sets:9, reps:'5/3/1+/3/3/3/5/5/5+', rest:'3min', technique:'9 sets nSuns. Strict press uniquement. AMRAP set 3.', muscle:'epaules', type:'compound', equipment:'barre'},
          {order:2, name:'Bench Press T2 (Close Grip)', sets:8, reps:'6/5/3/5/7/4/6/8', rest:'2min30', technique:'Close-grip bench en secondaire — focus triceps + lockout.', muscle:'pectoraux', type:'compound', equipment:'barre'},
          {order:3, name:'Élévations latérales', sets:5, reps:12, rest:'90s', technique:'Accessoire isolation épaules — volume élevé.', muscle:'epaules', type:'isolation', equipment:'halteres'},
          {order:4, name:'Face Pull', sets:4, reps:15, rest:'60s', technique:'Arrière épaules + santé scapulaire.', muscle:'epaules', type:'isolation', equipment:'poulie'},
          {order:5, name:'Curl barre', sets:4, reps:10, rest:'90s', technique:'Accessoire biceps.', muscle:'bras', type:'isolation', equipment:'barre'}
        ],
        notes: 'OHP est le lift le plus dur à progresser — patience requise. AMRAP set crucial pour stimulation.'
      }
    },
    bras: {
      intermediate: {
        name: 'nSuns Arms Accessoires',
        description: 'Les bras travaillent en accessoires sur tous les jours principaux',
        warmup: 'Voir cycles principaux',
        exercises: [
          {order:1, name:'Curl barre', sets:4, reps:10, rest:'90s', technique:'Accessoire biceps en fin de séance.', muscle:'bras', type:'isolation', equipment:'barre'},
          {order:2, name:'Curl haltères incliné', sets:4, reps:12, rest:'90s', technique:'Stretch maximum biceps, position inclinée.', muscle:'bras', type:'isolation', equipment:'halteres'},
          {order:3, name:'Pushdown corde', sets:4, reps:12, rest:'90s', technique:'Accessoire triceps.', muscle:'bras', type:'isolation', equipment:'poulie'},
          {order:4, name:'Skull crushers', sets:4, reps:10, rest:'90s', technique:'Extension triceps couché barre EZ.', muscle:'bras', type:'isolation', equipment:'barre'},
          {order:5, name:'Hammer curl', sets:3, reps:12, rest:'60s', technique:'Brachial + avant-bras.', muscle:'bras', type:'isolation', equipment:'halteres'}
        ],
        notes: 'Volume bras = 12-16 sets/semaine répartis sur tous les jours.'
      }
    }
  },
  splits: {
    '5': [
      { day: 'Lundi',    type: 'bench',    label: 'Bench T1 + OHP T2 + Accessoires' },
      { day: 'Mardi',    type: 'squat',    label: 'Squat T1 + Sumo DL T2 + Quads' },
      { day: 'Mercredi', type: 'ohp',      label: 'OHP T1 + Close Bench T2 + Épaules' },
      { day: 'Jeudi',    type: 'deadlift', label: 'Deadlift T1 + Front Squat T2 + Dos' },
      { day: 'Vendredi', type: 'bench2',   label: 'Bench T1 + OHP T2 (variante)' }
    ]
  }
};
window.NSUNS_PROGRAMS = NSUNS_PROGRAMS;

// ─── CBUM HYPERTROPHY (Chris Bumstead — Classic Physique) ────────────────────
var CBUM_PROGRAMS = {
  meta: {
    name: 'CBum Classic Physique',
    athlete: 'Inspiré Chris Bumstead (Mr. Olympia Classic Physique)',
    philosophy: 'Hypertrophie esthétique moderne. PPL étendu sur 5j avec 2x jambes. Volume modéré-élevé, supersets sur isolation, FST-7 sur finisher, drop sets occasionnels. Focus shape + symétrie.',
    frequency: '5 jours/semaine',
    session_duration: '75-90 min',
    key_principles: ['Volume modéré-élevé (16-20 sets/groupe)', 'Supersets isolation', 'FST-7 finisher', 'Drop sets sur ext./curls', 'Mind-muscle connection']
  },
  programs: {
    pectoraux: {
      intermediate: {
        name: 'CBum Chest + Triceps Day',
        description: 'Lundi: Pectoraux focus + triceps en finisher',
        warmup: '5 min vélo + rotations épaules + 2 sets warm-up bench barre vide',
        exercises: [
          {order:1, name:'Bench Press incliné haltères', sets:4, reps:'10-12', rest:'2min', technique:'Composé principal CBum: incliné AVANT le bench plat pour prioriser le haut pectoral. Stretch profond, contraction au sommet.', muscle:'pectoraux', type:'compound', equipment:'halteres'},
          {order:2, name:'Bench Press plat', sets:4, reps:'8-10', rest:'2min', technique:'Bench classique en deuxième. Touch-and-go contrôlé, focus pectoral.', muscle:'pectoraux', type:'compound', equipment:'barre'},
          {order:3, name:'Pec Deck (Butterfly)', sets:4, reps:'12-15', rest:'90s', technique:'Isolation pure, contraction pic 1s. Focus mind-muscle.', muscle:'pectoraux', type:'isolation', equipment:'machine'},
          {order:4, name:'Cable crossover bas-vers-haut', sets:3, reps:'15', rest:'60s', technique:'FST-7 finisher: 7 sets de 12-15 reps, repos 30s entre sets. Pump maximal.', muscle:'pectoraux', type:'isolation', equipment:'poulie'},
          {order:5, name:'Skull crushers + Pushdown (superset)', sets:3, reps:'10+12', rest:'90s', technique:'Superset triceps: skull crushers immédiat suivi de pushdown corde sans repos.', muscle:'bras', type:'isolation', equipment:'barre'},
          {order:6, name:'Overhead extension corde', sets:3, reps:12, rest:'60s', technique:'Stretch maximum triceps long head. Drop set sur dernière série.', muscle:'bras', type:'isolation', equipment:'poulie'}
        ],
        notes: 'Volume total pectoraux: 15 sets. Supersets et FST-7 = pump maximal en fin de séance.'
      }
    },
    dos: {
      intermediate: {
        name: 'CBum Back + Biceps Day',
        description: 'Mardi: Dos largeur + épaisseur + biceps en superset',
        warmup: '5 min rameur + scapular pull-ups + activation lats',
        exercises: [
          {order:1, name:'Pull-Ups lestés', sets:4, reps:'8-10', rest:'2min', technique:'Composé principal largeur. Lestés si possible. Dead hang complet.', muscle:'dos', type:'compound', equipment:'barre fixe'},
          {order:2, name:'Rowing T-bar', sets:4, reps:'10-12', rest:'2min', technique:'Composé épaisseur. Tirer vers le nombril, scapula contraction.', muscle:'dos', type:'compound', equipment:'barre'},
          {order:3, name:'Tirage vertical prise neutre', sets:4, reps:'12', rest:'90s', technique:'Cible le grand dorsal, prise triangle. 2s pic contraction.', muscle:'dos', type:'compound', equipment:'poulie'},
          {order:4, name:'Single arm cable row', sets:3, reps:'12 par bras', rest:'60s', technique:'Unilatéral pour symétrie. Stretch maximum + rotation thoracique.', muscle:'dos', type:'compound', equipment:'poulie'},
          {order:5, name:'Straight arm pulldown (FST-7)', sets:7, reps:12, rest:'30s', technique:'FST-7 finisher dos: 7 sets, 30s repos. Pump dorsal maximum.', muscle:'dos', type:'isolation', equipment:'poulie'},
          {order:6, name:'Curl barre + Curl haltères incliné (superset)', sets:3, reps:'10+10', rest:'90s', technique:'Superset biceps: curl barre immédiat suivi curl haltères incliné stretch.', muscle:'bras', type:'isolation', equipment:'barre'},
          {order:7, name:'Hammer curl', sets:3, reps:12, rest:'60s', technique:'Brachial + avant-bras. Drop set sur dernière série.', muscle:'bras', type:'isolation', equipment:'halteres'}
        ],
        notes: 'Volume dos: 18 sets. Variation des angles pour développement complet (largeur + épaisseur + détail).'
      }
    },
    epaules: {
      intermediate: {
        name: 'CBum Shoulders Day',
        description: 'Mercredi: Épaules complet 3 chefs (deltoïdes ant/lat/post)',
        warmup: '5 min vélo + rotations épaules + bandes élastiques face pull',
        exercises: [
          {order:1, name:'Overhead Press haltères', sets:4, reps:'10-12', rest:'2min', technique:'Composé principal épaules. Haltères pour ROM maximal. Pas de balancement.', muscle:'epaules', type:'compound', equipment:'halteres'},
          {order:2, name:'Élévations latérales debout', sets:5, reps:'15', rest:'60s', technique:'Isolation deltoïde latéral. Élever jusqu\'à parallèle au sol. Coude légèrement plié.', muscle:'epaules', type:'isolation', equipment:'halteres'},
          {order:3, name:'Cable lateral raise', sets:4, reps:'12 par bras', rest:'60s', technique:'Tension constante, position légèrement inclinée. Stretch maximum.', muscle:'epaules', type:'isolation', equipment:'poulie'},
          {order:4, name:'Reverse Pec Deck', sets:4, reps:'15', rest:'60s', technique:'Isolation arrière épaules. Contraction pic 1s. Volume élevé.', muscle:'epaules', type:'isolation', equipment:'machine'},
          {order:5, name:'Face Pull corde', sets:7, reps:15, rest:'30s', technique:'FST-7 finisher arrière épaules. Santé scapulaire + esthétique.', muscle:'epaules', type:'isolation', equipment:'poulie'},
          {order:6, name:'Front raise haltères + Élévations latérales (drop set)', sets:3, reps:'10+10', rest:'90s', technique:'Superset deltoïde antérieur + latéral. Drop set finisseur.', muscle:'epaules', type:'isolation', equipment:'halteres'}
        ],
        notes: 'Volume épaules: 22 sets. Focus deltoïde latéral (18 sets/sem cumulés) pour shape 3D.'
      }
    },
    jambes: {
      intermediate: {
        name: 'CBum Legs Quad-Focus Day',
        description: 'Jeudi: Quadriceps prioritaire + accessoires fessiers',
        warmup: '5 min vélo + mobilité hanches + 2 sets warm-up squat barre vide',
        exercises: [
          {order:1, name:'Back Squat', sets:4, reps:'8-10', rest:'2min30', technique:'Composé principal quad. High bar pour cibler quad davantage. Profondeur sous parallèle.', muscle:'jambes', type:'compound', equipment:'barre'},
          {order:2, name:'Hack Squat machine', sets:4, reps:'10-12', rest:'2min', technique:'Quad pure isolation. Pieds bas pour quad max. Stretch profond.', muscle:'jambes', type:'compound', equipment:'machine'},
          {order:3, name:'Leg Press', sets:4, reps:'12-15', rest:'2min', technique:'Pieds bas et serrés pour cibler quadriceps. Amplitude complète.', muscle:'jambes', type:'compound', equipment:'machine'},
          {order:4, name:'Leg Extension (FST-7)', sets:7, reps:15, rest:'30s', technique:'FST-7 finisher quadriceps. Pic contraction 2s. Pump intense.', muscle:'jambes', type:'isolation', equipment:'machine'},
          {order:5, name:'Bulgarian split squat', sets:3, reps:'10 par jambe', rest:'90s', technique:'Unilatéral pour symétrie + accessoire fessiers.', muscle:'jambes', type:'compound', equipment:'halteres'},
          {order:6, name:'Calf raise debout', sets:4, reps:15, rest:'60s', technique:'Mollets debout, amplitude complète, 2s pic contraction.', muscle:'jambes', type:'isolation', equipment:'machine'}
        ],
        notes: 'Volume quad: 19 sets. Jeudi quad-focus, samedi posterior-focus pour volume jambes total 38 sets/sem.'
      }
    },
    bras: {
      intermediate: {
        name: 'CBum Arms Volume',
        description: 'Bras travaillés en supersets sur Lundi (triceps) et Mardi (biceps)',
        warmup: 'Voir cycles Chest et Back',
        exercises: [
          {order:1, name:'Curl barre EZ', sets:4, reps:10, rest:'90s', technique:'Composé biceps. Strict, contrôlé.', muscle:'bras', type:'isolation', equipment:'barre'},
          {order:2, name:'Curl haltères incliné (stretch)', sets:4, reps:12, rest:'60s', technique:'Stretch maximal biceps long head. Position inclinée 45°.', muscle:'bras', type:'isolation', equipment:'halteres'},
          {order:3, name:'Skull crushers EZ bar', sets:4, reps:10, rest:'90s', technique:'Composé triceps. Long head focus.', muscle:'bras', type:'isolation', equipment:'barre'},
          {order:4, name:'Pushdown corde + Overhead extension (superset)', sets:3, reps:'12+12', rest:'90s', technique:'Superset triceps: pushdown puis overhead sans repos. Pump maximal.', muscle:'bras', type:'isolation', equipment:'poulie'},
          {order:5, name:'Hammer curl drop set', sets:3, reps:'12+8+6', rest:'60s', technique:'Drop set: 12 reps lourd → drop 30% → 8 reps → drop 30% → 6 reps.', muscle:'bras', type:'isolation', equipment:'halteres'}
        ],
        notes: 'Volume bras: 18 sets total/sem (biceps 9 + triceps 9). Drop sets et supersets pour intensité maximale.'
      }
    }
  },
  splits: {
    '5': [
      { day: 'Lundi',    type: 'chest_tris',     label: 'Chest + Triceps' },
      { day: 'Mardi',    type: 'back_bis',       label: 'Back + Biceps' },
      { day: 'Mercredi', type: 'shoulders',      label: 'Shoulders' },
      { day: 'Jeudi',    type: 'legs_quad',      label: 'Legs Quad-Focus' },
      { day: 'Samedi',   type: 'legs_posterior', label: 'Legs Posterior + Glutes' }
    ]
  }
};
window.CBUM_PROGRAMS = CBUM_PROGRAMS;

var TRAINING_STYLES = {
  classic:   { label:'Programme Classique',   programs: SFC_PROGRAMS,              splits: WEEKLY_SPLITS },
  intensity: { label:'Intensité Maximale',    programs: YATES_PROGRAMS.programs,   splits: YATES_PROGRAMS.splits,   meta: YATES_PROGRAMS.meta,   macro: YATES_PROGRAMS.macro_cycle_12w },
  volume:    { label:'Volume Progressif',     programs: COLEMAN_PROGRAMS.programs, splits: COLEMAN_PROGRAMS.splits, meta: COLEMAN_PROGRAMS.meta, macro: COLEMAN_PROGRAMS.macro_cycle_12w },
  fst7:      { label:'FST-7 Fascial',         programs: RAMBOD_PROGRAMS.programs,  splits: RAMBOD_PROGRAMS.splits,  meta: RAMBOD_PROGRAMS.meta,  macro: RAMBOD_PROGRAMS.macro_cycle_12w },
  fusion:    { label:'Programme Élite Fusion', programs: FUSION_PROGRAMS.programs,  splits: FUSION_PROGRAMS.splits,  meta: FUSION_PROGRAMS.meta,  macro: FUSION_PROGRAMS.macro_cycle_12w },
  starting:  { label:'Débuter la musculation (full-body)', programs: STARTING_STRENGTH_PROGRAMS.programs, splits: STARTING_STRENGTH_PROGRAMS.splits, meta: STARTING_STRENGTH_PROGRAMS.meta, macro: STARTING_STRENGTH_PROGRAMS.macro_cycle_12w },
  greyskull: { label:'Greyskull LP',            programs: GREYSKULL_PROGRAMS.programs,         splits: GREYSKULL_PROGRAMS.splits,         meta: GREYSKULL_PROGRAMS.meta },
  texas:     { label:'Texas Method',            programs: TEXAS_METHOD_PROGRAMS.programs,      splits: TEXAS_METHOD_PROGRAMS.splits,      meta: TEXAS_METHOD_PROGRAMS.meta },
  nsuns:     { label:'nSuns 5/3/1',             programs: NSUNS_PROGRAMS.programs,             splits: NSUNS_PROGRAMS.splits,             meta: NSUNS_PROGRAMS.meta },
  cbum:      { label:'CBum Classic Physique',   programs: CBUM_PROGRAMS.programs,              splits: CBUM_PROGRAMS.splits,              meta: CBUM_PROGRAMS.meta }
};

function getStyleProgram(style, muscle, level) {
  var s = TRAINING_STYLES[style] || TRAINING_STYLES.classic;
  // Fallback cross-style si le muscle est absent (ex: classic n'a pas fessiers)
  if (!s.programs[muscle]) {
    var fallback = TRAINING_STYLES.fusion || TRAINING_STYLES.volume;
    if (!fallback || !fallback.programs[muscle]) return null;
    s = fallback;
  }
  if (level && s.programs[muscle][level]) return s.programs[muscle][level];
  return s.programs[muscle].masse || s.programs[muscle].intermediate || s.programs[muscle].beginner || s.programs[muscle];
}

// ─── Programme 100% personnalisé ────────────────────────────────────────────
function buildPersonalizedMuscuPlan(S) {
  S = S || {};

  // 1. NIVEAU : détecté depuis profil
  // S.activity est un index numérique (0=sédentaire...5=élite) — pas une string
  var level = 'beginner';
  if (S.sportLevel === 'advanced' || (S.muscuWeek >= 4 && S.activity >= 3)) {
    level = 'advanced';
  } else if (S.sportLevel === 'intermediate' || S.muscuWeek >= 2 || (S.activity !== null && S.activity >= 2)) {
    level = 'intermediate';
  }

  // 2. STYLE : selon objectif + sexe + niveau
  // S.goal is a numeric index into window.GOALS — resolve to key string for comparison.
  var style = 'fusion';
  var goalKey = (S.goal !== null && S.goal !== undefined && window.GOALS && window.GOALS[S.goal])
    ? window.GOALS[S.goal].key : '';
  var sportGoals = S.sportGoals || [];
  if (sportGoals.indexOf('performance') >= 0) {
    style = level === 'beginner' ? 'classic' : 'intensity';
  } else if (goalKey === 'cut' || goalKey === 'shred') {
    style = level === 'advanced' ? 'fst7' : 'volume';
  } else if (goalKey === 'bulk' || goalKey === 'lean_bulk' || goalKey === 'recomposition') {
    style = level === 'beginner' ? 'volume' : 'fusion';
  } else if (goalKey === 'maintain') {
    style = 'classic';
  }
  // Femme : privilégier le volume (meilleur pour fessiers/jambes)
  var isFemale = S.sex === 'female' || S.sex === 'femme';
  if (isFemale && style === 'intensity') style = 'fusion';

  // FIX P1 audit user Thomas (débutant) : forcer Starting Strength (full-body)
  // pour tout débutant qui veut 3j/semaine. Littérature (Rippetoe, ACSM, NSCA) :
  // un vrai débutant progresse mieux en full-body 3×/sem qu'en PPL (fréquence/muscle=1
  // en PPL vs 3 en full-body → stimulus hebdo insuffisant).
  // N.B. : S.muscuWeek est un n° de semaine (pas de jours) → utiliser S.sportDays.
  var userDaysRequested = S.sportDays || 3;
  if (level === 'beginner' && userDaysRequested <= 4 && sportGoals.indexOf('performance') < 0) {
    style = 'starting'; // Full-body Starting Strength (Rippetoe) — évidence littérature
  }

  var styleObj = TRAINING_STYLES[style] || TRAINING_STYLES.fusion;

  // 3. SPLIT : selon jours disponibles
  // FIX P2 : utiliser S.sportDays (nombre de jours) et non S.muscuWeek (numéro de semaine 1-12).
  // Cap à 6 jours max (Art ACSM : 1 jour de repos minimum/semaine).
  var days = Math.min(6, Math.max(3, S.sportDays || 3));
  var availSplits = styleObj.splits || {};
  var splitDays = days;
  // Trouve le split disponible le plus proche
  if (!availSplits[splitDays]) {
    var keys = Object.keys(availSplits).map(Number).sort(function(a,b){return a-b;});
    if (keys.length > 0) {
      splitDays = keys.reduce(function(prev, cur) {
        return Math.abs(cur - days) < Math.abs(prev - days) ? cur : prev;
      }, keys[0]);
    }
  }
  var split = availSplits[splitDays] || availSplits[Object.keys(availSplits)[0]] || null;
  // Normalise les splits array (ex: starting/greyskull/texas/nsuns) → {days:[]}
  if (Array.isArray(split)) {
    split = { days: split.map(function(d) { return { day: d.day, label: d.label, muscles: d.muscles || [] }; }) };
  }
  if (!split) return { weekProgram: [], tips: [], style: style };

  // 4. PHASE MACRO : selon semaine du cycle (muscuCycle 1-12)
  var cycleWeek = Math.max(1, Math.min(12, S.muscuCycle || 1));
  var macro = styleObj.macro || FUSION_PROGRAMS.macro_cycle_12w;
  var currentPhase = macro[macro.length - 1]; // décharge par défaut
  for (var pi = 0; pi < macro.length; pi++) {
    var ph = macro[pi];
    var weeks = ph.weeks || [ph.week];
    if (weeks.indexOf(cycleWeek) >= 0) { currentPhase = ph; break; }
  }

  // 5. ZONES PRIORITAIRES : bodyZones / weakZones / sexe
  var priorityMuscles = [];
  if (isFemale) priorityMuscles = ['fessiers', 'jambes'];
  var bz = S.bodyZones || {};
  Object.keys(bz).forEach(function(z) { if (bz[z] === 'high' && priorityMuscles.indexOf(z) < 0) priorityMuscles.push(z); });
  (S.weakZones || []).forEach(function(z) { if (priorityMuscles.indexOf(z) < 0) priorityMuscles.push(z); });

  // 6. ÉQUIPEMENT : filtre exercices selon matériel disponible
  var equip = S.sportEquipment || 'gym';
  function equipOk(ex) {
    if (equip === 'gym') return true;
    if (equip === 'dumbbells') return ['halteres','haltères','poids_corps','poids du corps','banc','barre_ez'].indexOf(ex.equipment) >= 0;
    // FIX BIBLE MUSCU §5 + audit Marie : 'home' n'acceptait PAS les haltères ni kettlebells.
    // Résultat : Marie avec 2 haltères 5 kg recevait du matos de salle (câble, machine).
    // Bible : home = {haltères, poids_corps, élastique, banc, kettlebell}. Dur et strict.
    if (equip === 'home') {
      var allowed = ['halteres','haltères','kettlebell','poids_corps','poids du corps','elastique','\u00e9lastique','sol','banc','barre fixe','barre_de_traction','barre de traction','aucun'];
      // Exclusion explicite : jamais de machine/câble/presse/poulie pour home
      var forbidden = /machine|c[aâ]ble|presse|poulie|smith|station|guid[eé]/i;
      var exEq = String(ex.equipment || ex.eq || '').toLowerCase();
      if (forbidden.test(exEq)) return false;
      if (forbidden.test(String(ex.n || ex.name || '').toLowerCase())) return false;
      return allowed.indexOf(exEq) >= 0;
    }
    return true;
  }

  // 7. PROGRAMME SEMAINE : construit jour par jour
  var activeDays = (split.days || []).filter(function(d) { return d.muscles && d.muscles.length > 0; });
  var weekProgram = activeDays.map(function(dayPlan, idx) {
    var allExercises = [];
    (dayPlan.muscles || []).forEach(function(muscle) {
      var prog = getStyleProgram(style, muscle, level);
      if (!prog || !prog.exercises) return;
      var exos = prog.exercises.filter(equipOk);
      // Fallback : si le filtre équipement supprime tout, injecter des alternatives bodyweight
      if (exos.length === 0 && window.getAlternativeExercises) {
        var altExos = window.getAlternativeExercises(muscle, null, 4);
        exos = altExos.filter(function(a) { return !a.eq || /corps|body|aucun|sol|elastique/i.test(a.eq); });
      }
      // Priorité : si muscle prioritaire, met en premier
      if (priorityMuscles.indexOf(muscle) >= 0 && idx > 0) {
        exos = exos.slice(); // copie
      }
      // Ajuste volume selon phase macro
      var volMod = currentPhase.volume_modifier || 1;
      exos = exos.map(function(ex) {
        var adjusted = {};
        for (var k in ex) adjusted[k] = ex[k];
        // Normalize field names to n/m/eq/sets format expected by exercise card
        adjusted.n = ex.n || ex.name || '';
        adjusted.m = ex.m || ex.muscle || '';
        adjusted.eq = ex.eq || ex.equipment || '';
        // Format sets as "NxR" string if sets is a number and reps is provided
        if (typeof ex.sets === 'number' && ex.reps !== undefined) {
          var setsNum = ex.sets;
          if (volMod < 1 && !ex.is_fst7) {
            setsNum = Math.max(1, Math.round(setsNum * volMod));
          }
          adjusted.sets = setsNum + '\u00d7' + ex.reps;
        } else if (typeof ex.sets === 'number') {
          var setsNum2 = ex.sets;
          if (volMod < 1 && !ex.is_fst7) {
            setsNum2 = Math.max(1, Math.round(setsNum2 * volMod));
          }
          adjusted.sets = String(setsNum2) + '\u00d73';
        } else if (volMod < 1 && !ex.is_fst7 && typeof ex.sets === 'string') {
          // If sets is already formatted string, adjust leading number
          adjusted.sets = ex.sets.replace(/^(\d+)/, function(m, n) {
            return String(Math.max(1, Math.round(parseInt(n) * volMod)));
          });
        }
        // Ensure video URL is set (auto-generate if missing)
        if (!adjusted.video && typeof window !== 'undefined' && window.getExerciseVideoUrl) {
          adjusted.video = window.getExerciseVideoUrl(adjusted.n);
        }
        return adjusted;
      });
      allExercises = allExercises.concat(exos);
    });

    // FIX P0 sécurité fœtale (audit user Aïcha T2 sem.22) : filtre ACOG 2020 complet
    // Avant : regex faible laissait passer « Développé couché », « Hip thrust », « Presse à jambes »
    //         → décubitus dorsal + Valsalva → compression veine cave inférieure → hypoxie fœtale.
    // Maintenant : regex strict + broadening "couché" / "pull-over" / "flye banc" (audit retest 2026-04-15).
    if (S.pregnant && isFemale) {
      var pregWeek = (typeof S.pregnancyWeek === 'number') ? S.pregnancyWeek : 14;
      // T2/T3 (sem ≥ 14) : exclure décubitus dorsal + Valsalva + contact + tout mouvement supine.
      var pregForbid = /valsalva|soulev[eé]\s+de\s+terre|deadlift|squat\s+barre\s+lourd|couch[eé]|bench\s+press|leg\s+press|presse\s+[aà]?\s*jambes?|presse[\s-]?cuisses?|crunch|sit.?up|d[eé]clin[eé]|decline|hip\s+thrust|glute\s+bridge\s+sol|pull.?over|\bflye?\b|\bfly[e]?\s*haltere?s?\b|[eé]cart[eé]\s+halt[eè]res?|snatch|clean\s*(?:&|and|et)?\s*jerk|kettlebell\s+swing|box\s+jump/i;
      allExercises = allExercises.filter(function(ex) {
        return !pregForbid.test(String(ex.n || ex.name || ''));
      });
      // Warning si le filtre a tout supprimé (programme vide silencieux = bug UX dangereux)
      if (allExercises.length === 0) {
        try { console.warn('[buildPersonalizedMuscuPlan] Pool vide après filtre grossesse (sem ' + pregWeek + ')'); S._pregFilterEmpty = true; } catch(_e) {}
      }
    }

    // FIX BIBLE MUSCU §5 audit Sophie : cap volume par muscle selon bodyZones.
    // Avant : "bras low" → 28 sets biceps dans la semaine (aberrant). Bible : low → max 6 sets.
    // On limite les exos d'un muscle si bodyZones[muscle]==='low'.
    try {
      if (bz && (dayPlan.muscles || []).length > 0) {
        (dayPlan.muscles || []).forEach(function(mname) {
          var zone = bz[mname] || bz[mname.replace(/s$/, '')];
          if (zone === 'low') {
            // Réduire exos de ce muscle à max 2 dans cette séance
            var keptCount = 0;
            allExercises = allExercises.filter(function(ex) {
              var exMuscle = (ex.m || ex.muscle || '').toLowerCase();
              var isThisMuscle = exMuscle.indexOf(mname.toLowerCase()) >= 0
                              || exMuscle.indexOf(mname.toLowerCase().replace(/s$/, '')) >= 0;
              if (!isThisMuscle) return true;
              if (keptCount >= 2) return false;
              keptCount++;
              return true;
            });
          }
        });
      }
    } catch(eBz) {}

    // Durée estimée : ~4min/série en moyenne
    var totalSets = allExercises.reduce(function(acc, ex) { var s = typeof ex.sets === 'string' ? (parseInt(ex.sets, 10) || 3) : (ex.sets || 3); return acc + s; }, 0);
    var estimatedMin = Math.round(totalSets * 4 + 10); // +10min échauffement

    return {
      dayIndex: idx + 1,
      day: dayPlan.day,
      name: 'Jour ' + (idx + 1),
      label: dayPlan.label,
      focus: dayPlan.label || (dayPlan.muscles || []).join(' + '),
      muscles: dayPlan.muscles,
      exercises: allExercises,
      estimatedDuration: estimatedMin + ' min',
      warmup: '5-10 min cardio léger + mobilité articulaire ciblée'
    };
  });

  // 8. CONSEILS PERSONNALISÉS
  var tips = [];
  if (typeof getAge === 'function' && getAge() >= 50) tips.push('Récupération allongée recommandée : 48-72h entre les séances par groupe musculaire.');
  if (isFemale) tips.push('Priorité fessiers et jambes : 2× par semaine recommandé pour résultats optimaux.');
  // S.sleep est un index : 0='<6h', 1='6-7h', 2='7-8h', 3='8h+'
  if (S.sleep !== null && S.sleep !== undefined && S.sleep <= 1) tips.push('Sommeil insuffisant d\u00e9tect\u00e9 : la r\u00e9cup\u00e9ration musculaire est compromise, dormez plus.');
  if (goalKey === 'cut' || goalKey === 'shred') tips.push('En déficit calorique : maintenez les charges — l\'objectif est de préserver le muscle.');
  if (level === 'beginner') tips.push('Débutant : maîtrise technique avant d\'augmenter les charges. Filmez-vous si possible.');
  if (equip === 'home') tips.push('Entraînement maison : progressez via les variantes (prise, tempo, unilateral).');

  return {
    style: style,
    // Prioriser le label user-friendly de TRAINING_STYLES (ex: "Débuter la musculation")
    // avant meta.name (ex: "Starting Strength" — trop technique) — audit user Thomas.
    styleLabel: styleObj.label || (styleObj.meta ? styleObj.meta.name : style),
    level: level,
    splitDays: splitDays,
    split: split,
    cycleWeek: cycleWeek,
    currentPhase: currentPhase,
    weekProgram: weekProgram,
    priorityMuscles: priorityMuscles,
    personalizedTips: tips,
    meta: styleObj.meta || {}
  };
}

window.buildPersonalizedMuscuPlan = buildPersonalizedMuscuPlan;

// ─── VIDEO URL GENERATOR ─────────────────────────────────────────────────────
function getExerciseVideoUrl(name) {
  if (!name) return null;
  var q = name.toLowerCase()
    .replace(/[éèêë]/g, 'e').replace(/[àâä]/g, 'a').replace(/[îï]/g, 'i')
    .replace(/[ùûü]/g, 'u').replace(/[ôö]/g, 'o').replace(/ç/g, 'c')
    .replace(/[^a-z0-9\s]/g, '').replace(/\s+/g, '+');
  return 'https://www.youtube.com/results?search_query=' + q + '+exercise+tutorial&sp=EgIYAQ%253D%253D';
}
window.getExerciseVideoUrl = getExerciseVideoUrl;

// ─── EXERCISE ALTERNATIVES DATABASE ──────────────────────────────────────────
// Organized by muscle group. Used by swap button in exercise cards.
var EXERCISE_ALTERNATIVES = {
  pectoraux: [
    { n: 'Développé couché', m: 'Pectoraux', eq: 'Barre + banc', sets: '4×8-12', rest: '90s' },
    { n: 'Développé haltères couché', m: 'Pectoraux', eq: 'Haltères + banc', sets: '4×10-12', rest: '90s' },
    { n: 'Développé incliné haltères', m: 'Pectoraux supérieurs', eq: 'Haltères + banc incliné', sets: '3×10-12', rest: '75s' },
    { n: 'Pompes classiques', m: 'Pectoraux', eq: 'Poids du corps', sets: '4×15-20', rest: '60s' },
    { n: 'Pompes déclinées', m: 'Pectoraux supérieurs', eq: 'Poids du corps', sets: '3×12-15', rest: '60s' },
    { n: 'Écarté haltères couché', m: 'Pectoraux', eq: 'Haltères + banc', sets: '3×12-15', rest: '60s' },
    { n: 'Câble crossover bas', m: 'Pectoraux inférieurs', eq: 'Câble poulie basse', sets: '3×12-15', rest: '60s' },
    { n: 'Dips prise large', m: 'Pectoraux / Triceps', eq: 'Barres parallèles', sets: '3×10-15', rest: '90s' },
    { n: 'Chest press machine', m: 'Pectoraux', eq: 'Machine convergente', sets: '3×12-15', rest: '60s' },
    { n: 'Câble crossover', m: 'Pectoraux', eq: 'Câble double poulie', sets: '3×12-15', rest: '60s' },
    { n: 'Pec deck / Butterfly', m: 'Pectoraux', eq: 'Machine pec deck', sets: '3×12-15', rest: '60s' },
    { n: 'Landmine press', m: 'Pectoraux', eq: 'Barre landmine', sets: '4×10-12', rest: '90s' }
  ],
  dos: [
    { n: 'Tractions pronation', m: 'Grand dorsal', eq: 'Barre de traction', sets: '4×6-10', rest: '120s' },
    { n: 'Chin-ups (traction supination)', m: 'Grand dorsal / Biceps', eq: 'Barre de traction', sets: '4×6-10', rest: '120s' },
    { n: 'Tirage vertical prise large', m: 'Dos (largeur)', eq: 'Machine / Poulie haute', sets: '4×10', rest: '90s' },
    { n: 'Tirage horizontal câble', m: 'Dorsaux / Rhomboïdes', eq: 'Câble horizontal', sets: '4×10-12', rest: '90s' },
    { n: 'Rowing haltère unilatéral', m: 'Grand dorsal / Trapèzes', eq: 'Haltère + banc', sets: '4×10-12', rest: '75s' },
    { n: 'Rowing barre', m: 'Grand dorsal / Trapèzes', eq: 'Barre', sets: '4×8-12', rest: '90s' },
    { n: 'Shrugs haltères', m: 'Trapèzes supérieurs', eq: 'Haltères', sets: '4×12-15', rest: '60s' },
    { n: 'Soulevé de terre roumain', m: 'Dorsaux / Ischios / Fessiers', eq: 'Barre', sets: '4×8-10', rest: '120s' },
    { n: 'Chest supported row', m: 'Dos', eq: 'Banc incliné + haltères', sets: '4×10-12', rest: '90s' },
    { n: 'Straight arm pulldown câble', m: 'Dos', eq: 'Câble haute poulie', sets: '3×12-15', rest: '60s' },
    { n: 'Rack pull', m: 'Dos', eq: 'Barre + rack', sets: '4×6-8', rest: '120s' },
    { n: 'Tirage vertical prise neutre V-bar', m: 'Dos (largeur)', eq: 'Câble haute poulie + V-bar', sets: '4×10-12', rest: '90s' },
    { n: 'Seal row', m: 'Grand dorsal / Trapèzes', eq: 'Banc plat surélevé + barre', sets: '4×8-12', rest: '90s' }
  ],
  epaules: [
    { n: 'Développé militaire barre', m: 'Épaules', eq: 'Barre', sets: '4×8-12', rest: '90s' },
    { n: 'Développé haltères assis', m: 'Épaules', eq: 'Haltères + banc', sets: '4×10-12', rest: '75s' },
    { n: 'Élévations latérales', m: 'Deltoïde latéral', eq: 'Haltères', sets: '4×12-15', rest: '60s' },
    { n: 'Élévations frontales', m: 'Deltoïde antérieur', eq: 'Haltères', sets: '3×12-15', rest: '60s' },
    { n: 'Oiseau haltères', m: 'Deltoïde postérieur', eq: 'Haltères', sets: '4×12-15', rest: '60s' },
    { n: 'Face pull câble', m: 'Deltoïde postérieur / Trapèzes', eq: 'Câble + corde', sets: '4×15', rest: '60s' },
    { n: 'Arnold press', m: 'Épaules (3 chefs)', eq: 'Haltères', sets: '3×10-12', rest: '75s' },
    { n: 'Tirage menton', m: 'Deltoïde / Trapèzes', eq: 'Barre ou câble', sets: '3×12', rest: '60s' },
    { n: 'Développé militaire machine', m: 'Épaules', eq: 'Machine épaules', sets: '3×12-15', rest: '60s' },
    { n: 'Élévations latérales câble', m: 'Deltoïde latéral', eq: 'Câble basse poulie', sets: '3×15-20', rest: '30s' },
    { n: 'Rotation externe élastique', m: 'Épaules (coiffe)', eq: 'Élastique', sets: '3×15-20', rest: '30s' },
    { n: 'Upright row câble', m: 'Deltoïde / Trapèzes', eq: 'Câble basse poulie', sets: '4×10-12', rest: '60s' }
  ],
  biceps: [
    { n: 'Curl barre droite', m: 'Biceps', eq: 'Barre', sets: '4×10-12', rest: '60s' },
    { n: 'Curl haltères alterné', m: 'Biceps / Brachial', eq: 'Haltères', sets: '4×10-12', rest: '60s' },
    { n: 'Curl marteau', m: 'Brachioradial / Biceps', eq: 'Haltères', sets: '3×12', rest: '60s' },
    { n: 'Curl incliné haltères', m: 'Biceps chef long', eq: 'Haltères + banc incliné', sets: '3×10-12', rest: '60s' },
    { n: 'Curl pupitre (scott curl)', m: 'Biceps chef court', eq: 'Barre + pupitre', sets: '3×10-12', rest: '60s' },
    { n: 'Curl câble basse poulie', m: 'Biceps', eq: 'Câble bas', sets: '3×12-15', rest: '60s' },
    { n: 'Curl concentré', m: 'Biceps (peak)', eq: 'Haltère', sets: '3×12-15', rest: '45s' },
    { n: 'Curl EZ barre', m: 'Biceps', eq: 'Barre EZ', sets: '4×10-12', rest: '60s' },
    { n: 'Curl spider (araignee)', m: 'Biceps (pic)', eq: 'Barre EZ ou haltères + banc incliné', sets: '3×10-12', rest: '60s' },
    { n: 'Curl marteau câble', m: 'Brachial / Brachio-radial', eq: 'Câble poulie basse + corde', sets: '3×12-15', rest: '60s' },
    { n: 'Chin-up supination', m: 'Biceps / Grand dorsal', eq: 'Barre de traction', sets: '4×6-10', rest: '90s' },
    { n: 'Curl 21s', m: 'Biceps (complet)', eq: 'Barre EZ ou halteres', sets: '3×21 (7+7+7)', rest: '90s' }
  ],
  triceps: [
    { n: 'Dips triceps banc', m: 'Triceps', eq: 'Banc', sets: '4×12-15', rest: '60s' },
    { n: 'Extension barre couché', m: 'Triceps', eq: 'Barre EZ + banc', sets: '4×10-12', rest: '75s' },
    { n: 'Extension haltère tête', m: 'Triceps chef long', eq: 'Haltère', sets: '3×12', rest: '60s' },
    { n: 'Pushdown câble corde', m: 'Triceps', eq: 'Câble + corde', sets: '4×12-15', rest: '60s' },
    { n: 'Pushdown câble barre', m: 'Triceps', eq: 'Câble + barre', sets: '4×12-15', rest: '60s' },
    { n: 'Kick-back haltère', m: 'Triceps chef latéral', eq: 'Haltère', sets: '3×12-15', rest: '45s' },
    { n: 'Close grip bench press', m: 'Triceps / Pectoraux', eq: 'Barre + banc', sets: '4×8-10', rest: '90s' },
    { n: 'Overhead extension câble', m: 'Triceps chef long', eq: 'Câble haute poulie', sets: '3×12-15', rest: '60s' },
    { n: 'Skull crushers EZ', m: 'Triceps', eq: 'Barre EZ + banc', sets: '4×10-12', rest: '90s' },
    { n: 'Extension triceps machine', m: 'Triceps', eq: 'Machine triceps', sets: '3×12-15', rest: '60s' },
    { n: 'JM Press barre', m: 'Triceps', eq: 'Barre + banc', sets: '4×8-10', rest: '90s' },
    { n: 'JM Press EZ', m: 'Triceps (chef long)', eq: 'Barre EZ + banc', sets: '4×8-10', rest: '90s' }
  ],
  quadriceps: [
    { n: 'Squat barre', m: 'Quadriceps / Fessiers', eq: 'Barre + rack', sets: '5×5-8', rest: '180s' },
    { n: 'Leg press', m: 'Quadriceps / Fessiers', eq: 'Machine leg press', sets: '4×10-15', rest: '120s' },
    { n: 'Fente avant haltères', m: 'Quadriceps / Fessiers', eq: 'Haltères', sets: '4×10-12', rest: '90s' },
    { n: 'Fente bulgare haltères', m: 'Quadriceps / Fessiers', eq: 'Haltères + banc', sets: '4×10-12', rest: '90s' },
    { n: 'Extension jambes machine', m: 'Quadriceps', eq: 'Machine extension', sets: '4×12-15', rest: '60s' },
    { n: 'Squat gobelet kettlebell', m: 'Quadriceps / Fessiers', eq: 'Kettlebell', sets: '4×12-15', rest: '75s' },
    { n: 'Squat poids de corps', m: 'Quadriceps / Fessiers', eq: 'Poids du corps', sets: '4×15-20', rest: '60s' },
    { n: 'Hack squat machine', m: 'Quadriceps', eq: 'Machine hack squat', sets: '4×10-12', rest: '120s' },
    { n: 'Squat Zercher', m: 'Quadriceps / Fessiers', eq: 'Barre + rack', sets: '4×6-8', rest: '120s' },
    { n: 'Leg press unilatéral', m: 'Quadriceps / Fessiers', eq: 'Machine leg press', sets: '3×10-12', rest: '90s' },
    { n: 'Sissy squat', m: 'Quadriceps', eq: 'Poids de corps', sets: '3×12-15', rest: '60s' },
    { n: 'Fente avant barre', m: 'Quadriceps / Fessiers', eq: 'Barre', sets: '4×8-10', rest: '90s' }
  ],
  ischios: [
    { n: 'Deadlift roumain barre', m: 'Ischios / Fessiers / Dorsaux', eq: 'Barre', sets: '4×8-12', rest: '120s' },
    { n: 'Leg curl allongé', m: 'Ischios', eq: 'Machine leg curl', sets: '4×10-12', rest: '75s' },
    { n: 'Leg curl assis', m: 'Ischios', eq: 'Machine leg curl assis', sets: '4×10-12', rest: '75s' },
    { n: 'Sumo deadlift', m: 'Fessiers / Ischios / Adducteurs', eq: 'Barre', sets: '4×5-8', rest: '120s' },
    { n: 'Good morning', m: 'Ischios / Bas du dos', eq: 'Barre', sets: '3×10-12', rest: '90s' },
    { n: 'Nordic curl', m: 'Ischios excentrique', eq: 'Partenaire ou machine', sets: '3×6-8', rest: '120s' },
    { n: 'Leg curl debout câble', m: 'Ischio-jambiers', eq: 'Câble basse poulie', sets: '3×12-15', rest: '60s' },
    { n: 'Romanian deadlift haltères', m: 'Ischio-jambiers / Fessiers', eq: 'Haltères', sets: '4×10-12', rest: '90s' },
    { n: 'Hyperextension ischios-focus', m: 'Ischio-jambiers / Bas du dos', eq: 'Banc à lombaires', sets: '3×12-15', rest: '60s' },
    { n: 'Cable pull-through', m: 'Ischio-jambiers / Fessiers', eq: 'Câble basse poulie', sets: '3×12-15', rest: '60s' }
  ],
  fessiers: [
    { n: 'Hip thrust barre', m: 'Fessiers', eq: 'Barre + banc', sets: '4×10-15', rest: '90s' },
    { n: 'Hip thrust haltère', m: 'Fessiers', eq: 'Haltère + banc', sets: '4×12-15', rest: '75s' },
    { n: 'Squat sumo', m: 'Fessiers / Adducteurs', eq: 'Barre ou haltère', sets: '4×10-15', rest: '90s' },
    { n: 'Fente reverse haltères', m: 'Fessiers / Quadriceps', eq: 'Haltères', sets: '4×12', rest: '75s' },
    { n: 'Abduction hanche câble', m: 'Fessiers / Abducteurs', eq: 'Câble bas', sets: '4×15-20', rest: '60s' },
    { n: 'Donkey kicks', m: 'Grand fessier', eq: 'Poids du corps', sets: '3×15-20', rest: '45s' },
    { n: 'Glute bridge bilatéral', m: 'Fessiers', eq: 'Poids du corps', sets: '4×15-20', rest: '45s' },
    { n: 'Hip thrust unilatéral', m: 'Fessiers', eq: 'Banc + haltère', sets: '3×10-12', rest: '60s' },
    { n: 'Frog pump', m: 'Grand fessier', eq: 'Poids de corps', sets: '3×15-20', rest: '30s' },
    { n: 'Sumo squat haltere', m: 'Fessiers / Adducteurs', eq: 'Haltere', sets: '4×10-12', rest: '90s' },
    { n: 'Cable pull-through', m: 'Fessiers / Ischios', eq: 'Câble basse poulie', sets: '3×12-15', rest: '60s' },
    { n: 'Abduction debout élastique', m: 'Fessiers / Abducteurs', eq: 'Élastique', sets: '3×15-20', rest: '30s' }
  ],
  mollets: [
    { n: 'Mollets debout machine', m: 'Mollets', eq: 'Machine mollets', sets: '5×12-20', rest: '60s' },
    { n: 'Mollets debout haltères', m: 'Mollets', eq: 'Haltères', sets: '4×15-20', rest: '60s' },
    { n: 'Mollets assis machine', m: 'Soléaire', eq: 'Machine mollets assis', sets: '4×15-20', rest: '60s' },
    { n: 'Mollets marche sur pointes', m: 'Mollets', eq: 'Poids du corps', sets: '3×20-30', rest: '30s' },
    { n: 'Mollets unilatéraux', m: 'Mollets', eq: 'Poids du corps ou haltère', sets: '4×15', rest: '45s' },
    { n: 'Mollets leg press', m: 'Mollets', eq: 'Machine leg press', sets: '4×15-20', rest: '60s' },
    { n: 'Mollets barre debout', m: 'Mollets', eq: 'Barre', sets: '4×12-15', rest: '60s' },
    { n: 'Donkey calf raise', m: 'Mollets', eq: 'Machine donkey ou lest', sets: '4×15-20', rest: '60s' },
    { n: 'Sauts à la corde', m: 'Mollets', eq: 'Corde à sauter', sets: '4×60s', rest: '60s' }
  ],
  trapezes: [
    { n: 'Shrug barre', m: 'Trap\u00e8zes sup\u00e9rieurs', eq: 'Barre', sets: '5×8-12', rest: '90s' },
    { n: 'Shrug halt\u00e8res', m: 'Trap\u00e8zes sup\u00e9rieurs', eq: 'Halt\u00e8res', sets: '4×10-15', rest: '60s' },
    { n: 'Shrug machine', m: 'Trap\u00e8zes sup\u00e9rieurs', eq: 'Machine', sets: '4×12-15', rest: '60s' },
    { n: 'Face pull c\u00e2ble', m: 'Trap\u00e8zes moyens + rotateurs', eq: 'C\u00e2ble + corde', sets: '4×15', rest: '60s' },
    { n: 'Tirage menton barre', m: 'Trap\u00e8zes + \u00e9paules', eq: 'Barre', sets: '4×10-12', rest: '60s' },
    { n: 'Rack pull', m: 'Trap\u00e8zes sup\u00e9rieurs', eq: 'Barre + rack', sets: '4×5-6', rest: '180s' },
    { n: 'Rowing buste pench\u00e9 prise large', m: 'Trap\u00e8zes moyens + rhobo\u00efdes', eq: 'Barre', sets: '4×10', rest: '90s' },
    { n: 'Shrug halt\u00e8re unilat\u00e9ral', m: 'Trap\u00e8zes', eq: 'Halt\u00e8re', sets: '4×12', rest: '60s' },
    { n: 'Tirage menton c\u00e2ble', m: 'Trap\u00e8zes + \u00e9paules', eq: 'C\u00e2ble', sets: '4×12', rest: '60s' }
  ],
  lombaires: [
    { n: 'Soulev\u00e9 de terre conventionnel', m: 'Lombaires + dos complet', eq: 'Barre', sets: '4×5', rest: '240s' },
    { n: 'Good morning barre', m: 'Lombaires + ischios', eq: 'Barre', sets: '4×8-10', rest: '120s' },
    { n: 'Hyperextension banc lombaires', m: 'Lombaires + fessiers', eq: 'Banc \u00e0 lombaires', sets: '4×12-15', rest: '90s' },
    { n: 'Soulev\u00e9 de terre roumain', m: 'Lombaires + ischios + fessiers', eq: 'Barre', sets: '4×8-10', rest: '120s' },
    { n: 'Planche ventrale (prone plank)', m: 'Lombaires + core', eq: 'Sol', sets: '4×45s', rest: '60s' },
    { n: 'Superman', m: 'Lombaires + \u00e9recteurs', eq: 'Sol', sets: '4×15', rest: '45s' },
    { n: 'Bird dog', m: 'Lombaires + core stabilisation', eq: 'Sol', sets: '3×12', rest: '45s' },
    { n: 'Hyperextension reverse', m: 'Lombaires + fessiers', eq: 'Banc plat', sets: '3×15', rest: '60s' },
    { n: 'Good morning halt\u00e8res', m: 'Lombaires + ischios', eq: 'Halt\u00e8res', sets: '4×12', rest: '90s' }
  ],
  abdos: [
    { n: 'Crunch classique', m: 'Abdominaux', eq: 'Poids du corps', sets: '4×20', rest: '45s' },
    { n: 'Relevé de jambes suspendu', m: 'Abdominaux bas', eq: 'Barre de traction', sets: '4×10-15', rest: '60s' },
    { n: 'Planche abdominale', m: 'Abdominaux / Core', eq: 'Poids du corps', sets: '4×30-60s', rest: '45s' },
    { n: 'Russian twist', m: 'Obliques', eq: 'Poids du corps ou disque', sets: '3×20', rest: '45s' },
    { n: 'Roulette abdominale', m: 'Abdominaux / Core', eq: 'Roulette', sets: '4×10-15', rest: '60s' },
    { n: 'Mountain climbers', m: 'Abdominaux / Core', eq: 'Poids du corps', sets: '4×30s', rest: '30s' },
    { n: 'Crunch câble poulie haute', m: 'Abdominaux', eq: 'Câble + corde', sets: '4×15-20', rest: '45s' },
    { n: 'Dead bug', m: 'Abdominaux / Core', eq: 'Poids de corps', sets: '3×10-12', rest: '60s' },
    { n: 'L-sit', m: 'Abdominaux / Core', eq: 'Barres parallèles', sets: '3×20-30s', rest: '60s' },
    { n: 'Hollow body hold', m: 'Abdominaux / Core', eq: 'Poids de corps', sets: '3×30-45s', rest: '60s' },
    { n: 'Ab rollout sur genoux', m: 'Abdominaux / Core', eq: 'Roulette abdominale', sets: '3×10-12', rest: '60s' }
  ]
};

function getAlternativeExercises(muscle, excludeName, maxCount) {
  if (!muscle) return [];
  var ml = muscle.toLowerCase();
  // Map incoming muscle strings to alternative DB keys
  var dbKey = null;
  var keyMap = [
    ['pectoraux', 'pectoraux'], ['poitrine', 'pectoraux'], ['chest', 'pectoraux'],
    ['dos', 'dos'], ['dorsal', 'dos'], ['dorsaux', 'dos'], ['back', 'dos'],
    ['épaule', 'epaules'], ['epaule', 'epaules'], ['deltoïde', 'epaules'], ['deltoid', 'epaules'], ['shoulder', 'epaules'],
    ['biceps', 'biceps'], ['brachial', 'biceps'],
    ['triceps', 'triceps'],
    ['quadriceps', 'quadriceps'], ['quad', 'quadriceps'], ['jambes', 'quadriceps'], ['cuisse', 'quadriceps'],
    ['ischio-jambiers', 'ischios'], ['ischios', 'ischios'], ['ischio', 'ischios'], ['hamstring', 'ischios'],
    ['fessier', 'fessiers'], ['glute', 'fessiers'], ['fesses', 'fessiers'],
    ['sol\u00e9aire', 'mollets'], ['solaire', 'mollets'], ['mollet', 'mollets'], ['calf', 'mollets'], ['calves', 'mollets'],
    ['grand droit', 'abdos'], ['oblique', 'abdos'], ['transverse', 'abdos'],
    ['abdo', 'abdos'], ['abdominaux', 'abdos'], ['core', 'abdos'],
    ['trap\u00e8ze', 'trapezes'], ['trapeze', 'trapezes'], ['rhombo', 'trapezes'], ['shrug', 'trapezes'],
    ['lombaire', 'lombaires'], ['\u00e9recteur', 'lombaires'], ['erecteur', 'lombaires'], ['bas du dos', 'lombaires'], ['lower back', 'lombaires'],
    ['bras', 'biceps']
  ];
  for (var ki = 0; ki < keyMap.length; ki++) {
    if (ml.indexOf(keyMap[ki][0]) !== -1) { dbKey = keyMap[ki][1]; break; }
  }
  var pool;
  if (ml.indexOf('bras') !== -1 && ml.indexOf('biceps') === -1 && ml.indexOf('triceps') === -1) {
    pool = (EXERCISE_ALTERNATIVES['biceps'] || []).concat(EXERCISE_ALTERNATIVES['triceps'] || []);
  } else {
    if (!dbKey) return [];
    pool = EXERCISE_ALTERNATIVES[dbKey] || [];
  }
  var exLow = excludeName ? excludeName.toLowerCase() : '';
  var results = [];
  for (var pi = 0; pi < pool.length; pi++) {
    if (pool[pi].n.toLowerCase() !== exLow) results.push(pool[pi]);
    if (results.length >= (maxCount || 3)) break;
  }
  return results;
}
window.getAlternativeExercises = getAlternativeExercises;

// ─── BODYWEIGHT RATIO TABLE FOR 1RM ESTIMATION ──────────────────────────────
// Format: [male_beg, male_inter, male_adv, female_beg, female_inter, female_adv]
var BW_RATIO = {
  'squat':             [0.75, 1.25, 1.75, 0.50, 0.85, 1.20],
  'deadlift':          [0.85, 1.50, 2.00, 0.60, 1.00, 1.40],
  'bench':             [0.50, 0.85, 1.25, 0.30, 0.55, 0.80],
  'press':             [0.30, 0.55, 0.80, 0.18, 0.35, 0.55],
  'row':               [0.50, 0.85, 1.20, 0.30, 0.55, 0.80],
  'traction':          [0.00, 0.25, 0.50, 0.00, 0.10, 0.30],
  'dip':               [0.00, 0.20, 0.40, 0.00, 0.10, 0.25],
  'curl':              [0.25, 0.45, 0.65, 0.15, 0.28, 0.42],
  'triceps':           [0.20, 0.40, 0.60, 0.12, 0.25, 0.38],
  'leg press':         [1.20, 1.80, 2.50, 0.80, 1.30, 1.80],
  'hip thrust':        [0.80, 1.30, 1.80, 0.60, 1.00, 1.40],
  'rdl':               [0.60, 1.00, 1.40, 0.40, 0.70, 1.00],
  'ecarte':            [0.15, 0.25, 0.35, 0.10, 0.17, 0.25],
  'elevation':         [0.10, 0.20, 0.30, 0.07, 0.14, 0.22],
  'extension':         [0.20, 0.35, 0.50, 0.12, 0.22, 0.35],
  'crunch':            [0.00, 0.10, 0.25, 0.00, 0.05, 0.15],
  'default':           [0.40, 0.70, 1.00, 0.25, 0.45, 0.65]
};

// ─── EXERCISE NAME → RATIO KEY RESOLVER ─────────────────────────────────────
function _resolveRatioKey(name) {
  var n = (name || '').toLowerCase()
    .replace(/[éèêë]/g, 'e').replace(/[àâä]/g, 'a').replace(/[ùûü]/g, 'u')
    .replace(/[ôö]/g, 'o').replace(/[îï]/g, 'i').replace(/ç/g, 'c');
  // Direct keyword matching (order matters — most specific first)
  if (/souleve\s+de\s+terre|deadlift/.test(n)) return 'deadlift';
  if (/hip\s*thrust|releve\s+de\s+bassin|pont\s+fessier/.test(n)) return 'hip thrust';
  if (/leg\s*press|presse\s+a?\s*jambe/.test(n)) return 'leg press';
  if (/rdl|roumain/.test(n)) return 'rdl';
  if (/squat|accroupissement|goblet|fente|lunge/.test(n)) return 'squat';
  if (/developpe\s+couche|bench\s+press|dc\b/.test(n)) return 'bench';
  if (/developpe\s+(militaire|epaule)|press|ohp|arnol/.test(n)) return 'press';
  if (/traction|pull[\s-]?up|tirage\s+vert/.test(n)) return 'traction';
  if (/dip/.test(n)) return 'dip';
  if (/rowing|tirage|row/.test(n)) return 'row';
  if (/curl|bicep/.test(n)) return 'curl';
  if (/tricep|extension\s+poulie|barre\s+au\s+front/.test(n)) return 'triceps';
  if (/ecarte|fly|crossover|cable\s+cross/.test(n)) return 'ecarte';
  if (/elevation|lateral|frontal|oiseau/.test(n)) return 'elevation';
  if (/extension|leg\s+ext/.test(n)) return 'extension';
  if (/crunch|abdo|gainage|planche/.test(n)) return 'crunch';
  return 'default';
}

// ─── estimateBaseLoad(exerciceName, bw, sex, level) ──────────────────────────
// Retourne le 1RM estimé en kg à partir de ratios poids de corps (Lander/Epley)
function estimateBaseLoad(exerciceName, bw, sex, level) {
  var bwKg = bw || 70;
  var key = _resolveRatioKey(exerciceName);
  var ratios = BW_RATIO[key] || BW_RATIO['default'];
  var isFemale = (sex === 'femme' || sex === 'female');
  var levelIdx = { 'beginner': 0, 'debutant': 0, 'débutant': 0, 'intermediate': 1, 'intermediaire': 1, 'intermédiaire': 1, 'advanced': 2, 'avance': 2, 'avancé': 2, 'expert': 2 }[String(level).toLowerCase()] || 0;
  var offset = isFemale ? 3 : 0;
  var ratio = ratios[offset + levelIdx];
  var oneRM = Math.round(bwKg * ratio / 2.5) * 2.5;
  return Math.max(oneRM, 5);
}
window.estimateBaseLoad = estimateBaseLoad;

// ─── CYCLE CONFIG ────────────────────────────────────────────────────────────
var CYCLE_CONFIG = {
  'volume':       { reps: [12,12,10,10,8],  pcts: [0.60, 0.63, 0.67, 0.67, 0.72], type: 'constant' },
  'hypertrophie': { reps: [10,10,8,8,6],    pcts: [0.65, 0.68, 0.72, 0.75, 0.78], type: 'ascending' },
  'force':        { reps: [6,5,4,3,3],      pcts: [0.75, 0.80, 0.85, 0.88, 0.90], type: 'ascending' },
  'puissance':    { reps: [5,4,3,3,2],      pcts: [0.80, 0.83, 0.87, 0.90, 0.92], type: 'ascending' },
  'deload':       { reps: [12,12,12,12,12], pcts: [0.50, 0.50, 0.50, 0.55, 0.55], type: 'constant' }
};

// ─── getSetScheme(exerciceName, bw, sex, level, muscuCycle, nSets) ───────────
// Retourne un tableau de séries : [{setNum, targetReps, loadKg, pctOf1RM, deltaFromPrev}]
function getSetScheme(exerciceName, bw, sex, level, muscuCycle, nSets) {
  var oneRM = estimateBaseLoad(exerciceName, bw, sex, level);
  var n = nSets || 4;
  var cfg = CYCLE_CONFIG[muscuCycle] || CYCLE_CONFIG['hypertrophie'];
  var sets = [];

  for (var i = 0; i < n; i++) {
    var pct = cfg.pcts[Math.min(i, cfg.pcts.length - 1)];
    var reps = cfg.reps[Math.min(i, cfg.reps.length - 1)];
    var loadKg = Math.round(oneRM * pct / 2.5) * 2.5;
    loadKg = Math.max(loadKg, 2.5);

    var deltaFromPrev = null;
    if (i > 0) {
      var prevLoad = sets[i - 1].loadKg;
      deltaFromPrev = prevLoad > 0 ? Math.round(((loadKg - prevLoad) / prevLoad) * 100) : 0;
    }

    sets.push({
      setNum: i + 1,
      targetReps: reps,
      loadKg: loadKg,
      pctOf1RM: Math.round(pct * 100),
      deltaFromPrev: deltaFromPrev
    });
  }
  return sets;
}
window.getSetScheme = getSetScheme;

// ─── checkProgressionSuggestion(exerciceName, muscuWeek, sessionLog) ─────────
// sessionLog : [{week, sets: [{reps, load, targetReps}]}]
// Retourne null ou {type, message, newLoad}
function checkProgressionSuggestion(exerciceName, muscuWeek, sessionLog) {
  if (!sessionLog || sessionLog.length < 2) return null;

  var recent = sessionLog[sessionLog.length - 1];
  var prev = sessionLog[sessionLog.length - 2];
  if (!recent || !recent.sets || !recent.sets.length || !prev || !prev.sets || !prev.sets.length) return null;

  // Toutes les reps réalisées au target ?
  var allCompleted = recent.sets.every(function(s) { return s.targetReps > 0 ? s.reps >= s.targetReps : true; });
  var sameLoadAsPrev = recent.sets.every(function(s, i) {
    return i < prev.sets.length && prev.sets[i] && Math.abs(s.load - prev.sets[i].load) < 1;
  });

  // Detect bodyweight: all loads are 0
  var _allLoadsZero = recent.sets.every(function(s) { return !s.load || s.load === 0; })
    && prev.sets.every(function(s) { return !s.load || s.load === 0; });

  if (allCompleted && sameLoadAsPrev) {
    // BUG E — Symbiose progression/nutrition : estimer le besoin protéique adapté à la progression
    // La synthèse protéique musculaire (MPS) augmente ~24-48h après un effort progressif (Moore 2015)
    // Rappel nutrition si calcMacros disponible et objectif masse (ISSN 2017)
    var _protNote = '';
    if (window.calcMacros && window.S) {
      var _m = window.calcMacros();
      var _goalKey = window.GOALS && window.S.goal !== null && window.GOALS[window.S.goal] ? window.GOALS[window.S.goal].key : '';
      if (_m && _m.p > 0 && (_goalKey === 'bulk' || _goalKey === 'lean_bulk' || _goalKey === 'recomposition')) {
        _protNote = ' \u2014 Cible prot\u00e9ines\u00a0: ' + _m.p + '\u00a0g/j pour soutenir cette progression (ISSN\u00a02017).';
      }
    }
    if (_allLoadsZero) {
      // Bodyweight: suggest more reps instead of more weight
      return {
        type: 'increase_reps',
        message: '\uD83C\uDFAF Tu as fait toutes tes reps \u2014 essaie +1-2 reps par s\u00e9rie la semaine prochaine\u00a0!' + _protNote,
        newLoad: null
      };
    }
    var currentLoad = recent.sets[recent.sets.length - 1].load;
    var isLower = /squat|leg|fessier|ischios|mollet|presse|hip.*thrust|rdl|deadlift|soulev|cuisse|jambe/i.test(exerciceName);
    var increment = isLower ? 5 : 2.5;
    return {
      type: 'increase_load',
      message: '\uD83C\uDFAF Progression sugg\u00e9r\u00e9e\u00a0: +' + increment + '\u00a0kg la semaine prochaine\u00a0!' + _protNote,
      newLoad: currentLoad + increment
    };
  }

  var avgRepsNow = recent.sets.reduce(function(a, s) { return a + s.reps; }, 0) / recent.sets.length;
  var avgRepsPrev = prev.sets.reduce(function(a, s) { return a + s.reps; }, 0) / prev.sets.length;

  if (avgRepsNow > avgRepsPrev + 1) {
    return {
      type: 'increase_reps',
      message: '\uD83D\uDCAA Belle progression ! Maintiens ce rythme.',
      newLoad: null
    };
  }

  return null;
}
window.checkProgressionSuggestion = checkProgressionSuggestion;

// ─── renderSetTable(exerciceName, sets, exerciceId) ──────────────────────────
// Génère le HTML DOM pour la table interactive de séries
function renderSetTable(exerciceName, sets, exerciceId) {
  // FIX edge audit : guard contre sets non-array (évite forEach crash).
  if (!Array.isArray(sets)) sets = [];
  var container = h('div', {'class': 'set-table-container', id: 'sets-' + exerciceId});
  var table = h('table', {'class': 'set-table'});
  var thead = h('thead');
  var hrow = h('tr');
  ['S\u00e9rie', 'Reps', 'Charge (kg)', '\u00c9volution', '\u2713'].forEach(function(t) {
    hrow.appendChild(h('th', {}, t));
  });
  thead.appendChild(hrow);
  table.appendChild(thead);

  var tbody = h('tbody');
  sets.forEach(function(s) {
    var deltaHtml = '';
    var row = h('tr', {'class': 'set-row', 'data-set': String(s.setNum)});

    // Série number
    row.appendChild(h('td', {'class': 'set-num'}, String(s.setNum)));

    // Reps input
    var repsInput = h('input', {
      'class': 'set-reps-input', type: 'number', min: '1', max: '30',
      value: String(s.targetReps), 'data-target': String(s.targetReps),
      onclick: function(e) { e.stopPropagation(); }
    });
    row.appendChild(h('td', {}, [repsInput]));

    // Load input
    var loadInput = h('input', {
      'class': 'set-load-input', type: 'number', min: '0', max: '500', step: '2.5',
      value: String(s.loadKg),
      onclick: function(e) { e.stopPropagation(); }
    });
    row.appendChild(h('td', {}, [loadInput]));

    // Delta
    var deltaCell = h('td');
    if (s.deltaFromPrev !== null && s.deltaFromPrev !== 0) {
      var cls = s.deltaFromPrev > 0 ? 'delta-up' : 'delta-down';
      var arrow = s.deltaFromPrev > 0 ? '\u25B2' : '\u25BC';
      deltaCell.appendChild(h('span', {'class': 'set-delta ' + cls}, arrow + ' ' + Math.abs(s.deltaFromPrev) + '%'));
    } else if (s.deltaFromPrev === 0 && s.setNum > 1) {
      deltaCell.appendChild(h('span', {'class': 'set-delta delta-flat'}, '\u2192 0%'));
    }
    row.appendChild(deltaCell);

    // Checkbox
    var checkbox = h('input', {
      type: 'checkbox', 'class': 'set-check',
      onclick: function(e) { e.stopPropagation(); },
      onchange: function(e) {
        var r = e.target.closest('tr.set-row') || row;
        if (e.target.checked) r.classList.add('set-validated');
        else r.classList.remove('set-validated');
        // Check all validated
        var allChecked = Array.from(container.querySelectorAll('.set-check')).every(function(c) { return c.checked; });
        var badge = container.querySelector('.set-progress-badge');
        if (badge) {
          if (allChecked) { badge.textContent = '\u2705 Exercice termin\u00e9 ! Super travail !'; badge.style.display = 'block'; }
          else { badge.style.display = 'none'; }
        }
      }
    });
    row.appendChild(h('td', {}, [checkbox]));

    tbody.appendChild(row);
  });

  table.appendChild(tbody);
  container.appendChild(table);

  // 1RM info
  if (sets.length > 0) {
    container.appendChild(h('div', {style: 'font-size:10px;color:var(--grey,#888);margin-top:4px;text-align:right'}, '1RM estim\u00e9 : ' + Math.round(sets[0].loadKg / (sets[0].pctOf1RM / 100)) + ' kg'));
  }

  // Progress badge (hidden by default)
  container.appendChild(h('div', {'class': 'set-progress-badge', style: 'display:none'}));

  return container;
}
window.renderSetTable = renderSetTable;

window.YATES_PROGRAMS = YATES_PROGRAMS;
window.COLEMAN_PROGRAMS = COLEMAN_PROGRAMS;
window.RAMBOD_PROGRAMS = RAMBOD_PROGRAMS;
window.FUSION_PROGRAMS = FUSION_PROGRAMS;
window.TRAINING_STYLES = TRAINING_STYLES;
window.TRAINING_STYLE_KEYS = ['classic', 'intensity', 'volume', 'fst7', 'fusion', 'starting', 'greyskull', 'texas', 'nsuns', 'cbum'];
window.getStyleProgram = getStyleProgram;
window.SFC_PROGRAMS = SFC_PROGRAMS;
window.WEEKLY_SPLITS = WEEKLY_SPLITS;
window.getPersonalizedProgram = getPersonalizedProgram;
window.getProgressiveProgram = getProgressiveProgram;
window.getWeeklySplit = getWeeklySplit;

})();
