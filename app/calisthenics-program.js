// calisthenics-program.js — SmartFitCoach
// ES5 strict — var uniquement, pas de const/let, pas d'arrow functions
// Expose: window.generateCalisthenicsPlan(level, goals, pullups, pushups, daysPerWeek, equipment)

(function(window) {

// ─── SKILLS DATABASE — 12 skills ───────────────────────────────────────────
var SKILLS_DB = {
  muscle_up: {
    name: 'Muscle-up barre',
    emoji: '\u2B06',
    description: 'Passage explosif traction -> poussee — force et coordination',
    prereqs: '8+ tractions explosives, dip complet, fausse prise maitrisee',
    timeByLevel: { debutant: '8-12 mois', intermediaire: '4-6 mois', avance: '2-3 mois', elite: '2-6 semaines' },
    restTime: '3-4 min',
    antagonists: ['Face pull 3x15', 'Band pull-apart 3x20', 'Rear delt fly 3x12'],
    progressions: [
      { step: 1, name: 'Tractions strictes fausse prise', sets: 4, reps: '5', rest: 180, cue: 'Poignet par-dessus la barre, coudes vers hanches, amplitude complete' },
      { step: 2, name: 'Pull-up explosif chest-to-bar', sets: 4, reps: '3', rest: 180, cue: 'Tirer explosif pour toucher la barre avec la poitrine' },
      { step: 3, name: 'Transition negative (5s)', sets: 4, reps: '3', rest: 240, cue: 'Commencer en appui de poussee, descendre lentement en 5 secondes' },
      { step: 4, name: 'Jump muscle-up (saut depuis le sol)', sets: 4, reps: '5', rest: 180, cue: 'Utiliser le saut pour surmonter la transition, controle max en haut' },
      { step: 5, name: 'Kipping muscle-up (balancement)', sets: 3, reps: '3', rest: 240, cue: 'Kipping comme outil d\'apprentissage uniquement — viser le strict ensuite' },
      { step: 6, name: 'Muscle-up avec elastique', sets: 4, reps: '3', rest: 240, cue: 'Elastique sous les pieds, transition progressive, reduire l\'assistance' },
      { step: 7, name: 'Muscle-up barre — reps strictes', sets: 3, reps: '1-3', rest: 300, cue: 'Force pure. Bras en ligne droite au-dessus du support, pas de kipping' }
    ]
  },
  handstand: {
    name: 'Handstand (ATR)',
    emoji: '\u1F938',
    description: 'Equilibre inverted — proprioception et force epaules',
    prereqs: 'Push-ups corrects x20, core solide, poignets renforces 4+ semaines',
    timeByLevel: { debutant: '6-12 mois', intermediaire: '3-6 mois', avance: '1-3 mois', elite: '2-4 semaines' },
    restTime: '2-3 min',
    antagonists: ['Dead hang 3x30s', 'Shoulder flexion band 3x15', 'Thoracic extension 3x10'],
    progressions: [
      { step: 1, name: 'Wrist warm-up quotidien', sets: 3, reps: '30s', rest: 60, cue: 'OBLIGATOIRE avant chaque session — cercles, extension, flexion' },
      { step: 2, name: 'Pike hold sur box', sets: 4, reps: '20-30s', rest: 90, cue: 'Hanches au-dessus des epaules, pousse le sol, corps en V inverse' },
      { step: 3, name: 'Wall handstand face au mur', sets: 4, reps: '20-30s', rest: 120, cue: 'Ventre colle au mur, corps gaune, pousser le sol vers le bas' },
      { step: 4, name: 'Chest-to-wall handstand', sets: 4, reps: '20-30s', rest: 120, cue: 'Dos au vide, talons au mur — meilleur alignement que face au mur' },
      { step: 5, name: 'Kick-up et bail avant (roulade de securite)', sets: 3, reps: '5 essais', rest: 120, cue: 'Apprendre a tomber proprement avant de progresser plus loin' },
      { step: 6, name: 'Freestanding 5-10s (loin du mur)', sets: 5, reps: '5-10s', rest: 90, cue: 'Micro-corrections avec les doigts — regarder les mains, pas devant' },
      { step: 7, name: 'Freestanding handstand 30s+', sets: 5, reps: '30s', rest: 90, cue: '10 min de pratique quotidienne — qualite sur quantite' },
      { step: 8, name: 'Pike HSPU (incline)', sets: 3, reps: '8', rest: 180, cue: 'Hanches hautes, coudes a 45 degrees, front sur le sol' },
      { step: 9, name: 'HSPU strict contre mur', sets: 3, reps: '5', rest: 240, cue: 'Tete entre les mains, coudes a 45 degrees, pleine amplitude menton-sol' }
    ]
  },
  front_lever: {
    name: 'Front lever',
    emoji: '\u1F4AA',
    description: 'Force de traction horizontale — grand dorsal + core',
    prereqs: '12-15+ tractions, hollow body 30s, depressions scapulaires maitrisees',
    timeByLevel: { debutant: '18-24 mois', intermediaire: '10-14 mois', avance: '5-8 mois', elite: '2-4 mois' },
    restTime: '3-5 min',
    antagonists: ['Push-up anneaux 3x10', 'Dip lent 3x8', 'Pike push-up 3x10'],
    progressions: [
      { step: 1, name: 'Dead hang + depression scapulaire', sets: 4, reps: '10', rest: 120, cue: 'Serrer les omoplates vers le bas sans plier les coudes' },
      { step: 2, name: 'Tuck front lever (genoux groupes)', sets: 4, reps: '10-15s', rest: 180, cue: 'Genoux serres contre poitrine, dos plat, hanches a hauteur epaules' },
      { step: 3, name: 'Advanced tuck (hanche a 90 deg)', sets: 4, reps: '8-12s', rest: 180, cue: 'Hanche ouverte, cuisse horizontale, dos plat — progression cle' },
      { step: 4, name: 'One leg front lever', sets: 4, reps: '6-8s', rest: 240, cue: 'Une jambe tendue, l\'autre flechie — transition avance tuck -> straddle' },
      { step: 5, name: 'Straddle front lever', sets: 4, reps: '5-8s', rest: 240, cue: 'Jambes ecartees — reduire l\'ecartement semaine par semaine' },
      { step: 6, name: 'Front lever raise (tuck)', sets: 3, reps: '5', rest: 240, cue: 'Monter dynamiquement depuis bas en tuck front lever — force excentrique' },
      { step: 7, name: 'Full front lever', sets: 4, reps: '3-5s', rest: 300, cue: 'Corps parfaitement horizontal, bras tendus, scapulas deprimed' }
    ]
  },
  back_lever: {
    name: 'Back lever',
    emoji: '\u1F300',
    description: 'Extension epaules — mobilite et force biceps/epaules posterieures',
    prereqs: 'German hang confortable, skin the cat fluide, souplesse epaules',
    timeByLevel: { debutant: '12-18 mois', intermediaire: '6-10 mois', avance: '3-5 mois', elite: '1-3 mois' },
    restTime: '3-5 min',
    antagonists: ['Shoulder flexion 3x15', 'Pike push-up 3x10', 'Planche lean 3x20s'],
    progressions: [
      { step: 1, name: 'German hang passif', sets: 3, reps: '5-15s', rest: 120, cue: 'Avant-bras par-dessus la barre, se laisser pendre — stretch epaules' },
      { step: 2, name: 'Skin the cat (rotation complete)', sets: 3, reps: '5', rest: 180, cue: 'Rotation complete avant-arriere, controle integral du mouvement' },
      { step: 3, name: 'Tuck back lever hold', sets: 4, reps: '5-10s', rest: 180, cue: 'Genoux groupes contre poitrine, corps en arriere a l\'horizontale' },
      { step: 4, name: 'Half lay back lever', sets: 4, reps: '5-8s', rest: 180, cue: 'Genoux a 90 degres, corps semi-allonge horizontalement' },
      { step: 5, name: 'Straddle back lever', sets: 4, reps: '4-6s', rest: 240, cue: 'Jambes ecartees — bras le long du corps, pousser vers le sol' },
      { step: 6, name: 'Full back lever', sets: 3, reps: '3-5s', rest: 300, cue: 'Corps horizontal, jambes jointes — force et mobilite maximales' }
    ]
  },
  planche: {
    name: 'Planche',
    emoji: '\u26A1',
    description: 'Force de poussee horizontale — gainage total, levier extremement difficile',
    prereqs: 'Planche lean 45 degrees tenu 30s, core extreme, poignets parfaits',
    timeByLevel: { debutant: '3-5 ans', intermediaire: '2-3 ans', avance: '1-2 ans', elite: '6-12 mois' },
    restTime: '4-5 min',
    antagonists: ['Dead hang 3x30s', 'Front lever tuck 3x10s', 'Band pull-apart 3x20'],
    progressions: [
      { step: 1, name: 'Wrist prep + protraction epaules', sets: 3, reps: '5min', rest: 60, cue: 'Prerequis quotidien — poignets et protraction avant TOUT exercice planche' },
      { step: 2, name: 'Planche lean progressif', sets: 5, reps: '30s', rest: 120, cue: 'Incliner progressivement le corps vers l\'avant — mesurer l\'angle chaque semaine' },
      { step: 3, name: 'Frog stand (equilibre pur)', sets: 4, reps: '15-30s', rest: 120, cue: 'Mains a plat, doigts ecartes, epaules protracts — soulever les genoux' },
      { step: 4, name: 'Tuck planche (genoux groupes)', sets: 5, reps: '5-10s', rest: 240, cue: 'Genoux au niveau de la poitrine, dos rond, epaules devant les mains' },
      { step: 5, name: 'Advanced tuck (hanche a 90 deg)', sets: 5, reps: '5-8s', rest: 240, cue: 'Ouvrir progressivement la hanche, garder le dos arrondi' },
      { step: 6, name: 'Straddle planche', sets: 4, reps: '3-6s', rest: 300, cue: 'Jambes ecartees a 90+ degrees — angle optimal pour reduire le bras de levier' },
      { step: 7, name: 'Full planche', sets: 3, reps: '2-5s', rest: 300, cue: 'Jambes jointes et horizontales — temps de maitrise realiste: 1-2 ans min' }
    ]
  },
  lsit: {
    name: 'L-sit',
    emoji: 'L',
    description: 'Compression ischio-jambiers et core — skill fondamental',
    prereqs: 'Dips x10 complets, souplesse ischios, depressions scapulaires',
    timeByLevel: { debutant: '2-5 mois', intermediaire: '1-2 mois', avance: '2-6 semaines', elite: '1-3 semaines' },
    restTime: '2-3 min',
    antagonists: ['Hip flexor stretch 3x60s', 'Hamstring stretch 3x45s', 'Cobra stretch 3x30s'],
    progressions: [
      { step: 1, name: 'Depression scapulaire au sol', sets: 3, reps: '10', rest: 90, cue: 'Mains au sol, pousser fort, soulever les fesses sans lever les jambes' },
      { step: 2, name: 'Tuck L-sit (genoux flechis)', sets: 4, reps: '5-10s', rest: 90, cue: 'Genoux groupes contre poitrine, fesses au-dessus du sol, bras tendus' },
      { step: 3, name: 'L-sit une jambe (alternance)', sets: 4, reps: '8s chaque', rest: 90, cue: 'Une jambe tendue, une flechie — travailler la compression ischio' },
      { step: 4, name: 'L-sit complet (parallettes ou dips bars)', sets: 4, reps: '10s', rest: 120, cue: 'Jambes tendues et horizontales, maintien scapulaire, bras tendus' },
      { step: 5, name: 'L-sit tenu 20-30s', sets: 4, reps: '20-30s', rest: 120, cue: 'Endurance du L-sit — prerequis pour V-sit et manna' },
      { step: 6, name: 'L-sit sur barre de traction', sets: 3, reps: '15s', rest: 120, cue: 'Version plus difficile — prise en suspension, engagement core total' }
    ]
  },
  dragon_flag: {
    name: 'Dragon flag',
    emoji: '\u1F409',
    description: 'Core anti-extension extreme — popularise par Bruce Lee',
    prereqs: 'L-sit 20s, leg raise strict, back lever debutant',
    timeByLevel: { debutant: '4-8 mois', intermediaire: '2-4 mois', avance: '1-2 mois', elite: '1-3 semaines' },
    restTime: '3-4 min',
    antagonists: ['Back extension 3x12', 'Cobra stretch 3x30s', 'Hip flexor stretch 3x60s'],
    progressions: [
      { step: 1, name: 'Hollow body hold', sets: 4, reps: '20-30s', rest: 90, cue: 'Bas du dos colle au sol, jambes tendues, bras derriere la tete' },
      { step: 2, name: 'Leg raise strict (jambes tendues)', sets: 4, reps: '10', rest: 120, cue: 'Jambes tendues, controle total, pas d\'elan, descente lente' },
      { step: 3, name: 'Dragon flag negatif (descente 5s)', sets: 4, reps: '5', rest: 180, cue: 'Monter assiste, descendre en 5 secondes — force excentrique' },
      { step: 4, name: 'Dragon flag partiel (3/4 amplitude)', sets: 4, reps: '5', rest: 180, cue: 'Descente jusqu\'a 3/4 amplitude, remonter — progression avant complet' },
      { step: 5, name: 'Dragon flag complet', sets: 3, reps: '3-5', rest: 240, cue: 'Amplitude totale, corps rigide, pas de cassure a la hanche' },
      { step: 6, name: 'Dragon flag lent (3s descente/montee)', sets: 3, reps: '3', rest: 300, cue: 'Controle total de la vitesse — preuve de maitrise absolue' }
    ]
  },
  human_flag: {
    name: 'Human flag',
    emoji: '\u1F6A9',
    description: 'Force laterale extreme — tout le corps contracte',
    prereqs: 'Muscle-up strict, front lever tuck, L-sit 20s, training 2+ ans',
    timeByLevel: { debutant: '3-5 ans', intermediaire: '2-3 ans', avance: '1-2 ans', elite: '6-12 mois' },
    restTime: '4-5 min',
    antagonists: ['Side plank 3x45s chaque', 'Lateral shoulder stretch 3x45s', 'Oblique crunch 3x15'],
    progressions: [
      { step: 1, name: 'Tuck human flag (genoux groupes)', sets: 4, reps: '3-5s', rest: 300, cue: 'Prise large sur barre verticale, pousser/tirer simultane, corps lateral' },
      { step: 2, name: 'Half human flag (une jambe tendue)', sets: 4, reps: '3-5s', rest: 300, cue: 'Une jambe tendue, l\'autre flechie — progression intermemediaire' },
      { step: 3, name: 'Straddle human flag', sets: 3, reps: '2-4s', rest: 300, cue: 'Jambes ecartees — reduire ecartement progressivement' },
      { step: 4, name: 'Full human flag', sets: 3, reps: '2-3s', rest: 300, cue: 'Corps parfaitement horizontal, jambes jointes — elite level' }
    ]
  },
  pistol_squat: {
    name: 'Pistol squat',
    emoji: '\u1F9B5',
    description: 'Squat unilateral — force + equilibre + mobilite complete',
    prereqs: 'Squat bilateral x20, mobilite cheville, equilibre unilateral 30s',
    timeByLevel: { debutant: '4-8 mois', intermediaire: '2-4 mois', avance: '4-8 semaines', elite: '1-4 semaines' },
    restTime: '2-3 min',
    antagonists: ['Hip flexor stretch 3x60s', 'Calf stretch 3x45s', 'Piriformis stretch 3x45s'],
    progressions: [
      { step: 1, name: 'Squat bilateral profond', sets: 3, reps: '15', rest: 90, cue: 'Aller au maximum de profondeur, talons au sol, genoux dans l\'axe' },
      { step: 2, name: 'Pistol squat assiste (TRX ou anneau)', sets: 3, reps: '8 par jambe', rest: 120, cue: 'Tenir un anneau ou TRX, descendre sur une jambe en maintenant l\'equilibre' },
      { step: 3, name: 'Pistol negatif (descente controlee)', sets: 3, reps: '5 par jambe', rest: 120, cue: 'Descendre lentement en 4s sur une jambe, s\'asseoir, se relever bilateral' },
      { step: 4, name: 'Pistol sur box (amplitude partielle)', sets: 3, reps: '5 par jambe', rest: 120, cue: 'S\'asseoir sur une box, se relever sur une jambe — amplitude croissante' },
      { step: 5, name: 'Pistol squat complet', sets: 3, reps: '5 par jambe', rest: 150, cue: 'Bras en avant pour contrepoids, jambe libre tendue et horizontale' },
      { step: 6, name: 'Pistol squat leste (gilet ou haltere)', sets: 3, reps: '5 par jambe', rest: 180, cue: 'Progression de force — 5 a 20kg de charge supplementaire' },
      { step: 7, name: 'Shrimp squat (jambe derriere)', sets: 3, reps: '5 par jambe', rest: 150, cue: 'Variation avancee — jambe derriere au lieu de devant, plus difficile' }
    ]
  },
  one_arm_pullup: {
    name: 'One arm pull-up',
    emoji: '\u270A',
    description: 'Traction unilaterale — force maximale absolute',
    prereqs: '20+ tractions strictes, muscle-up maitrise, training 3+ ans',
    timeByLevel: { debutant: '5-8 ans', intermediaire: '3-5 ans', avance: '1-3 ans', elite: '6-18 mois' },
    restTime: '5 min minimum',
    antagonists: ['Rear delt fly 3x15', 'Face pull 3x15', 'Tricep extension 3x12'],
    progressions: [
      { step: 1, name: 'Tractions lestees (bodyweight +20-30%)', sets: 4, reps: '5', rest: 240, cue: 'Prerequis absolu — force brute avant la progression unilaterale' },
      { step: 2, name: 'Archer pull-up (assistance controlee)', sets: 4, reps: '5 par cote', rest: 240, cue: 'Bras directeur tire, bras aide tendu et pousse vers le bas' },
      { step: 3, name: 'One arm pull-up avec elastique fort', sets: 4, reps: '3-5 par bras', rest: 300, cue: 'Elastique sous le pied, reducteur d\'assistance progressif semaine par semaine' },
      { step: 4, name: 'One arm negatives (descente 5s)', sets: 3, reps: '3 par bras', rest: 300, cue: 'Monter bilateral, descendre sur un bras en 5 secondes — force excentrique' },
      { step: 5, name: 'One arm pull-up partiel (demi-amplitude)', sets: 3, reps: '3 par bras', rest: 300, cue: 'Amplitude partielle — 1/3 puis 1/2 puis 3/4 avant le complet' },
      { step: 6, name: 'One arm pull-up complet', sets: 3, reps: '1-3 par bras', rest: 300, cue: 'Force pure. Pas de kipping, corps vertical, controle total' }
    ]
  },
  muscle_up_rings: {
    name: 'Muscle-up anneaux',
    emoji: '\u25EF',
    description: 'Muscle-up sur anneaux — plus difficile et plus complet que barre',
    prereqs: 'Muscle-up barre strict, ring dip x10, false grip maitrise',
    timeByLevel: { debutant: '18-24 mois', intermediaire: '10-14 mois', avance: '5-8 mois', elite: '2-4 mois' },
    restTime: '4-5 min',
    antagonists: ['Face pull anneaux 3x15', 'Band pull-apart 3x20', 'External rotation 3x15'],
    progressions: [
      { step: 1, name: 'False grip dead hang', sets: 4, reps: '20-30s', rest: 90, cue: 'Poignet par-dessus l\'anneau — inconfort normal au debut, renforcer progressivement' },
      { step: 2, name: 'Ring row (Australian pull-up)', sets: 3, reps: '12', rest: 90, cue: 'Corps incline, tirer les anneaux vers la poitrine, stabilite maximale' },
      { step: 3, name: 'Ring pull-up strict fausse prise', sets: 4, reps: '5', rest: 180, cue: 'False grip tenu pendant toute la repetition — amplitude complete' },
      { step: 4, name: 'Ring dip strict', sets: 4, reps: '10', rest: 180, cue: 'Anneaux tournes vers l\'exterieur au sommet, controle total descente' },
      { step: 5, name: 'Ring muscle-up negatif', sets: 4, reps: '3', rest: 240, cue: 'Commencer en appui (support), descendre lentement en 5 secondes' },
      { step: 6, name: 'Ring muscle-up assiste (jambes)', sets: 3, reps: '5', rest: 240, cue: 'Push avec les pieds au sol pour aider la transition — reduire progressivement' },
      { step: 7, name: 'Ring muscle-up strict', sets: 3, reps: '1-3', rest: 300, cue: 'Fausse prise, traction explosive, tourner les anneaux en fin de mouvement' }
    ]
  },
  planche_lean: {
    name: 'Planche lean',
    emoji: '\u2F1C',
    description: 'Prerequis planche — inclinaison progressive vers l\'avant',
    prereqs: 'Push-up strict x20, protraction epaules, wrist prep maitrise',
    timeByLevel: { debutant: '2-4 mois', intermediaire: '1-2 mois', avance: '2-4 semaines', elite: '1-2 semaines' },
    restTime: '2-3 min',
    antagonists: ['Dead hang 3x30s', 'Band pull-apart 3x20', 'Rear delt raise 3x15'],
    progressions: [
      { step: 1, name: 'Wrist prep complet', sets: 1, reps: '5min', rest: 0, cue: 'Circles, flexion, extension, loaded stretch — OBLIGATOIRE' },
      { step: 2, name: 'Planche lean 10-15 deg', sets: 4, reps: '30s', rest: 90, cue: 'Leger desequilibre vers l\'avant, protraction maximale, corps gainee' },
      { step: 3, name: 'Planche lean 20-30 deg', sets: 4, reps: '20s', rest: 120, cue: 'Augmenter l\'inclinaison semaine par semaine, epaules bien devant les mains' },
      { step: 4, name: 'Planche lean 40-45 deg', sets: 4, reps: '15s', rest: 150, cue: 'Angle optimal pour commencer le tuck planche — transition bientot possible' },
      { step: 5, name: 'Pseudo planche push-up', sets: 3, reps: '8', rest: 150, cue: 'Position planche lean, descendre et monter — renforce les positions de planche' },
      { step: 6, name: 'Planche lean maximal (pres de 90 deg)', sets: 3, reps: '10s', rest: 180, cue: 'Pres de la planche complete — prerequis avant tuck planche difficile' }
    ]
  }
};


// ─── WEEKLY SESSION TEMPLATES ────────────────────────────────────────────────
// Structure varies by daysPerWeek: 2=FullA/B, 3=Push/Pull/Core, 4=Push/Pull/Skills/Lower, 5=Push/Pull/Skills/Lower/Mobility

function buildWeeklySessions(level, goals, pullups, pushups, daysPerWeek, equipment) {
  var hasBar = !equipment || equipment.length === 0 || (equipment.indexOf('barre') >= 0);
  var hasParallettes = !equipment || equipment.length === 0 || (equipment.indexOf('parallettes') >= 0);
  var hasRings = equipment && equipment.indexOf('anneaux') >= 0;
  var floorOnly = equipment && equipment.length === 1 && equipment.indexOf('sol') >= 0;

  // Base exercises per category adapted to level & equipment
  var pullExos = [];
  var pushExos = [];
  var coreExos = [];
  var lowerExos = [];
  var mobilityExos = [];
  var skillsExos = [];

  // ── PULL exercises ──
  if (floorOnly) {
    pullExos = [
      { name: 'Australian pull-up (table)', sets: 3, reps: '10', rest: 120, coaching: 'Corps incline sous une table solide, tirer la poitrine vers la barre' },
      { name: 'Inverted row incline', sets: 3, reps: '12', rest: 90, coaching: 'Angle progressivement plus horizontal pour augmenter la difficulte' }
    ];
  } else if (hasBar) {
    if (pullups < 5) {
      pullExos = [
        { name: 'Dead hang', sets: 3, reps: '20-30s', rest: 90, coaching: 'Prise pronation, epaules basses et stables, respiration reguliere', skill_link: 'one_arm_pullup' },
        { name: 'Scapular pull-up', sets: 3, reps: '10', rest: 90, coaching: 'Bras tendus, monter avec les omoplates uniquement — activer le dorsal', skill_link: null },
        { name: 'Australian pull-up', sets: 3, reps: '10', rest: 120, coaching: 'Corps incline sous la barre, tirer la poitrine — prototype de la traction', skill_link: null },
        { name: 'Jumping pull-up (descente controlee)', sets: 3, reps: '5', rest: 120, coaching: 'Utiliser le saut pour monter, descendre lentement en 3-5s — excentrique', skill_link: null }
      ];
    } else if (pullups < 12) {
      pullExos = [
        { name: 'Traction stricte', sets: 4, reps: String(Math.max(3, Math.floor(pullups * 0.7))), rest: 120, coaching: 'Amplitude complete, coudes vers les hanches, pas de balancement', skill_link: 'muscle_up' },
        { name: 'Traction explosive (chest-to-bar)', sets: 3, reps: '3-5', rest: 180, coaching: 'Tirer le plus haut possible — prerequis muscle-up', skill_link: 'muscle_up' },
        { name: 'Tuck front lever hold', sets: 3, reps: '8-12s', rest: 180, coaching: 'Corps en boule, dos plat, hanches a hauteur epaules', skill_link: 'front_lever' },
        { name: 'Hanging leg raise', sets: 3, reps: '10', rest: 120, coaching: 'Jambes tendues, controle excentrique, pas d\'elan', skill_link: null }
      ];
    } else {
      pullExos = [
        { name: 'Traction lestee (+5-15kg)', sets: 4, reps: '5', rest: 240, coaching: 'Force brute — prerequis one-arm pull-up et muscle-up strict', skill_link: 'one_arm_pullup' },
        { name: 'Tuck/Advanced front lever', sets: 4, reps: '10-12s', rest: 240, coaching: 'Progresser selon niveau actuel dans SKILLS_DB', skill_link: 'front_lever' },
        { name: 'Muscle-up progression', sets: 3, reps: '3-5', rest: 300, coaching: 'Selon etape actuelle de la progression muscle_up', skill_link: 'muscle_up' },
        { name: 'L-sit pull-up', sets: 3, reps: '5', rest: 180, coaching: 'L-sit maintenu pendant la traction — combine deux skills', skill_link: 'lsit' }
      ];
    }
  }

  // ── PUSH exercises ──
  if (floorOnly) {
    pushExos = [
      { name: 'Push-up strict', sets: 3, reps: String(Math.max(8, Math.floor(pushups * 0.6))), rest: 90, coaching: 'Corps rigide, coudes a 45 degres, amplitude complete' },
      { name: 'Pike push-up', sets: 3, reps: '10', rest: 120, coaching: 'Hanches hautes, descendre la tete entre les mains — proche HSPU' },
      { name: 'Diamond push-up', sets: 3, reps: '10', rest: 90, coaching: 'Mains en triangle, triceps et pectoraux internes' },
      { name: 'Planche lean (au sol)', sets: 3, reps: '20s', rest: 120, coaching: 'Desequilibre avant, epaules protractees — base planche', skill_link: 'planche_lean' }
    ];
  } else if (hasParallettes || hasBar) {
    if (pushups < 15) {
      pushExos = [
        { name: 'Push-up strict', sets: 3, reps: '10', rest: 90, coaching: 'Corps rigide, coudes a 45 degres, amplitude complete' },
        { name: 'Dip assiste (elastique)', sets: 3, reps: '8', rest: 120, coaching: 'Amplitude complete, controle total, torso vertical' },
        { name: 'Planche lean 15-20 deg', sets: 3, reps: '20s', rest: 90, coaching: 'Leger desequilibre avant — prerequis planche', skill_link: 'planche_lean' },
        { name: 'Pike push-up', sets: 3, reps: '8', rest: 120, coaching: 'Hanches hautes, tete entre les mains, proche HSPU' }
      ];
    } else if (pushups < 30) {
      pushExos = [
        { name: 'Dip strict', sets: 4, reps: '8-12', rest: 120, coaching: 'Amplitude complete, epaules en dessous des coudes en bas', skill_link: 'lsit' },
        { name: 'Planche lean progressif', sets: 4, reps: '20-30s', rest: 120, coaching: 'Augmenter l\'angle chaque semaine', skill_link: 'planche_lean' },
        { name: 'Pike/Wall HSPU', sets: 3, reps: '6-8', rest: 180, coaching: 'Progression handstand push-up', skill_link: 'handstand' },
        { name: 'Tuck planche (si possible)', sets: 3, reps: '5-8s', rest: 180, coaching: 'Premier skill statique de planche', skill_link: 'planche' }
      ];
    } else {
      pushExos = [
        { name: 'Dip leste (+5-15kg)', sets: 4, reps: '8', rest: 180, coaching: 'Force brute poussee — prerequis planche avancee' },
        { name: 'Planche progression (niveau actuel)', sets: 5, reps: '5-10s', rest: 300, coaching: 'Selon etape dans SKILLS_DB planche', skill_link: 'planche' },
        { name: 'HSPU strict', sets: 3, reps: '5', rest: 240, coaching: 'Tete entre les mains, coudes 45 deg, amplitude complete', skill_link: 'handstand' },
        { name: 'Pseudo planche push-up', sets: 3, reps: '6-8', rest: 180, coaching: 'Mains avancees, corps incline — renforce la planche', skill_link: 'planche' }
      ];
    }
  }

  // ── CORE exercises ──
  coreExos = [
    { name: 'Hollow body hold', sets: 3, reps: '20-30s', rest: 90, coaching: 'Bas du dos colle au sol, jambes tendues — fondamental de la callisthenie', skill_link: 'dragon_flag' },
    { name: 'L-sit progression', sets: 4, reps: '5-10s', rest: 90, coaching: 'Selon etape dans SKILLS_DB lsit', skill_link: 'lsit' },
    { name: 'Hanging knee/leg raise', sets: 3, reps: '10', rest: 120, coaching: 'Controle total, pas d\'elan, descente lente', skill_link: null },
    { name: 'Dragon flag progression', sets: 3, reps: '5', rest: 180, coaching: 'Selon etape dans SKILLS_DB dragon_flag', skill_link: 'dragon_flag' }
  ];

  // ── LOWER exercises ──
  lowerExos = [
    { name: 'Squat (bilateral)', sets: 3, reps: '15', rest: 90, coaching: 'Profondeur maximale, talons au sol, genoux dans l\'axe' },
    { name: 'Bulgarian split squat', sets: 3, reps: '10 par jambe', rest: 120, coaching: 'Pied arriere sur banc, descendre genou avant vers sol' },
    { name: 'Pistol squat progression', sets: 3, reps: '5 par jambe', rest: 150, coaching: 'Selon etape dans SKILLS_DB pistol_squat', skill_link: 'pistol_squat' },
    { name: 'Nordic curl (ischio)', sets: 3, reps: '5', rest: 180, coaching: 'Descente LENTE sur les ischios — previent les blessures' },
    { name: 'Box jump / Jump squat', sets: 3, reps: '5', rest: 120, coaching: 'Plyometrie — force explosive membres inferieurs' }
  ];

  // ── MOBILITY exercises ──
  mobilityExos = [
    { name: 'Hip flexor stretch', sets: 3, reps: '60s par cote', rest: 30, coaching: 'Genou arriere au sol, basculer le bassin — cle pour pistol' },
    { name: 'Shoulder circles actifs', sets: 3, reps: '20', rest: 30, coaching: 'Rotation complete, amplitude maximale, progressivement' },
    { name: 'Wrist rehabilitation', sets: 1, reps: '5min', rest: 0, coaching: 'Priorite absolue — previent 80% des blessures en callisthenie' },
    { name: 'Bridge walk-out', sets: 3, reps: '10', rest: 60, coaching: 'Extension thoracique et epaules — antagoniste de la planche' },
    { name: 'Pancake stretch (adducteurs)', sets: 3, reps: '60s', rest: 30, coaching: 'Jambes ecartees, buste vers le sol — prerequis straddle' },
    { name: 'Skin the cat / German hang', sets: 3, reps: '10s', rest: 120, coaching: 'Souplesse epaules posterieures — prerequis back lever', skill_link: 'back_lever' }
  ];

  // ── SKILLS practice (objectif-specific) ──
  if (goals && goals.length > 0) {
    goals.forEach(function(goalId) {
      var sk = SKILLS_DB[goalId];
      if (!sk) { return; }
      skillsExos.push({
        name: 'Pratique skill: ' + sk.name,
        sets: 4,
        reps: 'selon etape',
        rest: parseInt(sk.restTime) || 240,
        coaching: 'Selon progression SKILLS_DB — qualite > quantite. ' + sk.prereqs,
        skill_link: goalId
      });
    });
  }

  // ── BUILD SESSIONS based on daysPerWeek ──
  var sessions = [];
  var days = parseInt(daysPerWeek) || 3;

  if (days <= 2) {
    // Full body A / Full body B
    sessions.push({
      name: 'Full Body A — Poussee + Core',
      focus: 'push+core',
      exercises: pushExos.concat(coreExos.slice(0, 2))
    });
    sessions.push({
      name: 'Full Body B — Traction + Jambes',
      focus: 'pull+lower',
      exercises: pullExos.concat(lowerExos.slice(0, 3))
    });
  } else if (days === 3) {
    // Push / Pull / Core+Lower
    sessions.push({
      name: 'Seance Push — Poussee + Handstand',
      focus: 'push',
      exercises: pushExos.concat(skillsExos.filter(function(e) {
        return e.skill_link === 'handstand' || e.skill_link === 'planche' || e.skill_link === 'planche_lean';
      }))
    });
    sessions.push({
      name: 'Seance Pull — Traction + Skills barre',
      focus: 'pull',
      exercises: pullExos.concat(skillsExos.filter(function(e) {
        return e.skill_link === 'front_lever' || e.skill_link === 'back_lever' || e.skill_link === 'muscle_up' || e.skill_link === 'muscle_up_rings';
      }))
    });
    sessions.push({
      name: 'Seance Core + Jambes',
      focus: 'core+lower',
      exercises: coreExos.concat(lowerExos.slice(0, 3)).concat(skillsExos.filter(function(e) {
        return e.skill_link === 'lsit' || e.skill_link === 'dragon_flag' || e.skill_link === 'pistol_squat';
      }))
    });
  } else if (days === 4) {
    // Push / Pull / Skills / Lower
    sessions.push({
      name: 'Seance Push — Poussee + Planche',
      focus: 'push',
      exercises: pushExos
    });
    sessions.push({
      name: 'Seance Pull — Traction + Levers',
      focus: 'pull',
      exercises: pullExos
    });
    var skillSess = skillsExos.length > 0 ? skillsExos : coreExos;
    sessions.push({
      name: 'Seance Skills — Objectifs specifiques',
      focus: 'skills',
      exercises: skillSess
    });
    sessions.push({
      name: 'Seance Lower + Core',
      focus: 'lower+core',
      exercises: lowerExos.concat(coreExos.slice(0, 2))
    });
  } else {
    // 5 days: Push / Pull / Skills / Lower / Mobility
    sessions.push({
      name: 'Seance Push — Poussee + Planche',
      focus: 'push',
      exercises: pushExos
    });
    sessions.push({
      name: 'Seance Pull — Traction + Levers',
      focus: 'pull',
      exercises: pullExos
    });
    var skillSess5 = skillsExos.length > 0 ? skillsExos : coreExos;
    sessions.push({
      name: 'Seance Skills — Pratique objectives',
      focus: 'skills',
      exercises: skillSess5
    });
    sessions.push({
      name: 'Seance Lower + Core',
      focus: 'lower+core',
      exercises: lowerExos.concat(coreExos.slice(0, 2))
    });
    sessions.push({
      name: 'Seance Mobilite + Recuperation',
      focus: 'mobility',
      exercises: mobilityExos
    });
  }

  return sessions;
}


// ─── PERIODISATION ────────────────────────────────────────────────────────────
// Accumulation sem 1-4 → Intensification sem 5-8 → Decharge sem 9 → cycle suivant

function getPeriodisationWeek(weekNum, totalWeeks) {
  var cyclePos = ((weekNum - 1) % 9) + 1; // cycle de 9 semaines
  var isDeload = (cyclePos === 9);
  var phase;
  var focus;
  var volumeMult;
  var intensityMult;

  if (weekNum <= Math.round(totalWeeks * 0.30)) {
    phase = 'Fondations';
  } else if (weekNum <= Math.round(totalWeeks * 0.60)) {
    phase = 'Developpement';
  } else if (weekNum <= Math.round(totalWeeks * 0.85)) {
    phase = 'Specifique';
  } else {
    phase = 'Pic / Test';
  }

  if (isDeload) {
    focus = 'Decharge — 50% volume, RIR eleve, consolider les acquis';
    volumeMult = 0.5;
    intensityMult = 0.85;
  } else if (cyclePos <= 4) {
    focus = 'Accumulation sem ' + cyclePos + '/4 — volume elevé, RIR 3-4';
    volumeMult = 0.8 + cyclePos * 0.05; // 0.85, 0.90, 0.95, 1.00
    intensityMult = 0.85;
  } else if (cyclePos <= 8) {
    focus = 'Intensification sem ' + (cyclePos - 4) + '/4 — intensite max, RIR 1-2';
    volumeMult = 0.85;
    intensityMult = 0.90 + (cyclePos - 5) * 0.025; // 0.90, 0.925, 0.95, 0.975
  } else {
    focus = 'Transition';
    volumeMult = 0.9;
    intensityMult = 0.9;
  }

  return {
    phase: phase,
    isDeload: isDeload,
    focus: focus,
    volumeMult: volumeMult,
    intensityMult: intensityMult,
    cyclePos: cyclePos
  };
}

// ─── MAIN ENTRY POINT ─────────────────────────────────────────────────────────
// window.generateCalisthenicsPlan(level, goals, pullups, pushups, daysPerWeek, equipment)

function generateCalisthenicsPlan(level, goals, pullups, pushups, daysPerWeek, equipment) {
  // Defensive defaults
  var safeLevel = level || 'debutant';
  var safeGoals = Array.isArray(goals) ? goals : [];
  var safePullups = parseInt(pullups) || 0;
  var safePushups = parseInt(pushups) || 0;
  var safeDays = parseInt(daysPerWeek) || 3;
  if (safeDays < 2) { safeDays = 2; }
  if (safeDays > 5) { safeDays = 5; }
  var safeEquipment = Array.isArray(equipment) ? equipment : [];

  var totalWeeks;
  if (safeLevel === 'debutant') { totalWeeks = 12; }
  else if (safeLevel === 'intermediaire') { totalWeeks = 16; }
  else if (safeLevel === 'avance') { totalWeeks = 20; }
  else { totalWeeks = 24; } // elite

  var baseSessions = buildWeeklySessions(safeLevel, safeGoals, safePullups, safePushups, safeDays, safeEquipment);

  var plan = [];

  for (var w = 1; w <= totalWeeks; w++) {
    var periInfo = getPeriodisationWeek(w, totalWeeks);

    var weekSessions = baseSessions.map(function(sess) {
      var exos = sess.exercises.map(function(ex) {
        var adjustedSets = ex.sets;
        var adjustedReps = ex.reps;

        if (periInfo.isDeload) {
          adjustedSets = Math.max(2, Math.ceil(ex.sets * periInfo.volumeMult));
        } else if (periInfo.cyclePos > 4) {
          // Intensification: maintenir sets, augmenter intensite
          adjustedSets = ex.sets;
        } else {
          // Accumulation: augmenter volume progressivement
          adjustedSets = Math.min(6, Math.ceil(ex.sets * periInfo.volumeMult));
        }

        return {
          name: ex.name,
          sets: adjustedSets,
          reps: adjustedReps,
          rest: ex.rest || 120,
          coaching: ex.coaching || '',
          skill_link: ex.skill_link || null,
          progression: ex.progression || null
        };
      });

      return {
        name: periInfo.isDeload ? (sess.name + ' (allege)') : sess.name,
        focus: sess.focus,
        exercises: periInfo.isDeload ? exos.slice(0, Math.max(2, Math.ceil(exos.length * 0.6))) : exos
      };
    });

    plan.push({
      week: w,
      totalWeeks: totalWeeks,
      phase: periInfo.phase,
      isDeload: periInfo.isDeload,
      focus: periInfo.focus,
      cyclePos: periInfo.cyclePos,
      sessions: weekSessions,
      // Skills info for this week
      skillsProgress: safeGoals.map(function(goalId) {
        var sk = SKILLS_DB[goalId];
        if (!sk) { return null; }
        return {
          id: goalId,
          name: sk.name,
          timeEstimate: sk.timeByLevel[safeLevel] || sk.timeByLevel['debutant'],
          prereqs: sk.prereqs,
          progressions: sk.progressions,
          antagonists: sk.antagonists
        };
      }).filter(function(s) { return s !== null; })
    });
  }

  return {
    level: safeLevel,
    goals: safeGoals,
    pullups: safePullups,
    pushups: safePushups,
    daysPerWeek: safeDays,
    equipment: safeEquipment,
    totalWeeks: totalWeeks,
    skills: SKILLS_DB,
    plan: plan
  };
}

// ─── EXPOSE ON WINDOW ─────────────────────────────────────────────────────────
window.generateCalisthenicsPlan = generateCalisthenicsPlan;
window.CALISTHENICS_SKILLS_DB = SKILLS_DB;

}(window));
