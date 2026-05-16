/**
 * SmartFitCoach — Proprietary Software
 * Copyright (c) 2024-2026 SmartFitCoach. All rights reserved.
 */
/* ============================================================
   EXERCISE-VIDEOS.JS — Stratégie vidéo de confiance

   Architecture v2 (2026-05) :
   • URLs de recherche FILTRÉES PAR CHAÎNE :
       https://www.youtube.com/@handle/search?query=...
     → seules les vidéos du canal choisi apparaissent.
     → élimine les influenceurs, clickbait, shorts parasites.

   Canaux par niveau + langue :
   - Débutant FR  → @TiboInShape (8.7M, pédagogue FR)
   - Débutant EN  → @athleanx   (14M, Jeff Cavaliere)
   - Inter        → @athleanx   (technique + science)
   - Avancé       → @JeffNippard (peer-reviewed, hypertrophie)
   - CrossFit     → @CrossFit    (officiel, mouvements gymnique/oly)
   - Hyrox        → @athleanx    (technique dérivée force/cardio)

   Fallback pour exercices inconnus :
   → YouTube search général + filtre vidéos sp=EgIYAQ%3D%3D
   ============================================================ */
(function() {
  'use strict';

  // ─── Handles YouTube des canaux de confiance ──────────────────────────────
  var CHANNEL_INFO = {
    fr_beginner: { handle: 'TiboInShape',  name: 'Tibo InShape' },
    en_beginner: { handle: 'athleanx',     name: 'AthleanX'     },
    intermediate:{ handle: 'athleanx',     name: 'AthleanX'     },
    advanced:    { handle: 'JeffNippard',  name: 'Jeff Nippard' },
    crossfit:    { handle: 'CrossFit',     name: 'CrossFit'     },
    hyrox:       { handle: 'athleanx',     name: 'AthleanX'     }
  };

  // Rétro-compat (ancienne forme utilisée par openVideoModal)
  var CHANNELS = {
    1: ['Tibo InShape', 'Major Mouvement', 'Coach Wog'],
    2: ['AthleanX', 'Jeff Nippard', 'Renaissance Periodization'],
    3: ['Squat University', 'Jeff Nippard', 'Stronger By Science']
  };

  // ─── Requêtes curatées EN : nom_normalisé → query précise ─────────────────
  var CURATED_QUERIES = {
    // Pectoraux
    'developpe couche':            'bench press form tutorial',
    'developpe incline':           'incline bench press form tutorial',
    'developpe decline':           'decline bench press form tutorial',
    'pompes classiques':           'push up correct form tutorial',
    'pompes diamant':              'diamond push up form tutorial',
    'pompes declinees':            'decline push up form tutorial',
    'pompes plyometriques':        'plyometric push up tutorial',
    'ecartes haltere':             'dumbbell fly chest form tutorial',
    'ecartes haltere incline':     'incline dumbbell fly form tutorial',
    'pec deck butterfly':          'pec deck machine form tutorial',
    'pec deck':                    'pec deck machine form tutorial',
    'cable crossover bas':         'low cable crossover chest tutorial',
    'cable crossover haut':        'high cable crossover chest tutorial',
    'ecart cable croise':          'cable crossover form tutorial',
    'dips':                        'chest dips proper form tutorial',
    'dips lestes':                 'weighted dips chest tutorial',
    'spoto press':                 'spoto press technique',
    'floor press':                 'floor press barbell tutorial',
    'pompes archer':               'archer push up form tutorial',
    'landmine press':              'landmine press chest form tutorial',
    'developpe decline barre':     'decline barbell bench press form tutorial',
    'developpe incline barre':     'incline barbell bench press form tutorial',
    'chest press unilateral cable':'single arm cable chest press tutorial',
    'pompes prise large':          'wide grip push up form tutorial',
    'ecarte cable poulie basse crossover haut':'low cable fly upper chest tutorial',
    'developpe couche haltere unilateral':'unilateral dumbbell press form tutorial',
    'diamond push up':             'diamond push up close grip form tutorial',

    // Dos
    'tractions':                   'pull up form tutorial',
    'traction prise neutre':       'neutral grip pull up tutorial',
    'traction prise large':        'wide grip pull up tutorial',
    'traction prise serree':       'close grip chin up tutorial',
    'chin ups':                    'chin up form tutorial',
    'rowing barre':                'barbell row form tutorial',
    'rowing pendlay':              'pendlay row form tutorial',
    'pendlay row':                 'pendlay row form tutorial',
    'rowing haltere':              'one arm dumbbell row form tutorial',
    'rowing assis cable':          'seated cable row form tutorial',
    'rowing assis cable prise large':'wide grip seated cable row tutorial',
    't bar row':                   't bar row form tutorial',
    't bar row machine':           't bar row machine form tutorial',
    'tirage vertical poulie':      'lat pulldown form tutorial',
    'tirage poulie haute':         'lat pulldown form tutorial',
    'tirage horizontal':           'seated cable row form tutorial',
    'tirage nuque':                'behind neck lat pulldown tutorial',
    'soulever de terre':           'deadlift form tutorial',
    'deadlift':                    'deadlift form tutorial',
    'sumo deadlift':               'sumo deadlift form tutorial',
    'romanian deadlift':           'romanian deadlift form tutorial',
    'romanian deadlift rdl':       'romanian deadlift form tutorial',
    'rdl':                         'romanian deadlift form tutorial',
    'good morning':                'good morning exercise form tutorial',
    'shrugs barre':                'barbell shrugs form tutorial',
    'shrugs halteres':             'dumbbell shrugs form tutorial',
    'straight arm pulldown barre': 'straight arm lat pulldown tutorial',
    'face pull':                   'face pull form tutorial',
    'face pull prehab':            'face pull rotator cuff prehab',
    'chest supported row':         'chest supported row form tutorial',
    'rack pull':                   'rack pull form tutorial',
    'seal row':                    'seal row form tutorial',
    'traction lestee':             'weighted pull up form tutorial',
    'traction prise tres large':   'wide overhand pull up form tutorial',
    'yates row':                   'yates row underhand barbell row tutorial',
    'rowing haltere prise neutre': 'neutral grip dumbbell row form tutorial',
    'pull over haltere couche':    'dumbbell pullover form tutorial',
    'rowing machine unilateral':   'unilateral cable row form tutorial',
    'traction elastique assistee': 'band assisted pull up form tutorial',
    'tirage vertical prise neutre v bar':'v bar lat pulldown tutorial',
    'rowing pendlay prise large':  'wide grip pendlay row form tutorial',

    // Épaules
    'developpe militaire':         'overhead press form tutorial',
    'overhead press':              'overhead press form tutorial',
    'developpe haltere assis':     'seated dumbbell shoulder press tutorial',
    'developpe arnold':            'arnold press form tutorial',
    'arnold press':                'arnold press form tutorial',
    'elevations laterales':        'lateral raise form tutorial',
    'elevations frontales':        'front raise form tutorial',
    'elevation frontale cable':    'cable front raise tutorial',
    'oiseau halteres rear delt':   'rear delt fly form tutorial',
    'oiseau':                      'rear delt fly form tutorial',
    'lu raise':                    'lu raise shoulder tutorial',
    'developpe nuque':             'behind neck press tutorial',
    'rotation externe haltere coude appuye':'seated external rotation dumbbell tutorial',
    'developpe halteres debout':   'standing dumbbell overhead press tutorial',
    'oiseau poulie cable':         'cable rear delt fly form tutorial',
    'upright row cable':           'cable upright row form tutorial',
    'developpe militaire barre nuque':'behind neck press tutorial',
    'scarecrow halteres':          'scarecrow shoulder stability tutorial',
    'push press barre':            'barbell push press form tutorial',

    // Biceps
    'curl barre':                  'barbell curl form tutorial',
    'curl haltere':                'dumbbell curl form tutorial',
    'curl marteau':                'hammer curl form tutorial',
    'curl marteau cable':          'cable hammer curl tutorial',
    'curl incline halteres':       'incline dumbbell curl tutorial',
    'curl spider araignee':        'spider curl form tutorial',
    'curl pupitre':                'preacher curl form tutorial',
    'curl concentre':              'concentration curl tutorial',
    'curl barre supination 3 4 amplitude':'partial bicep curl peak contraction tutorial',
    'curl 21s':                    'barbell 21s bicep curl technique',
    'bayesian curl cable':         'bayesian cable curl long head tutorial',
    'curl pupitre haltere unilateral':'single arm preacher curl dumbbell tutorial',
    'reverse curl cable':          'cable reverse curl brachialis tutorial',
    'curl prise neutre barre ez':  'neutral grip ez bar curl tutorial',
    'drag curl barre':             'drag curl barbell long head tutorial',
    'curl incline cable unilateral':'incline cable curl form tutorial',
    'zottman curl':                'zottman curl forearm bicep tutorial',
    'curl cable a 90 peak':        'cable curl peak contraction tutorial',

    // Triceps
    'extension triceps poulie':    'tricep pushdown form tutorial',
    'extension triceps barre':     'skull crusher form tutorial',
    'kickback triceps':            'tricep kickback form tutorial',
    'developpe couche prise serree':'close grip bench press tutorial',
    'jm press barre':              'jm press barbell tricep tutorial',
    'jm press ez':                 'jm press ez bar tricep tutorial',
    'dips barres paralleles lest': 'weighted parallel bar dips tricep tutorial',
    'tate press':                  'tate press tricep form tutorial',
    'extension triceps bras tendu haltere':'overhead tricep extension tutorial',
    'bench dips lestes':           'weighted bench dips tricep tutorial',
    'extension triceps elastique debout':'resistance band tricep pushdown tutorial',
    'overhead extension halteres bilateral':'overhead dumbbell tricep extension tutorial',
    'kick back cable':             'cable tricep kickback form tutorial',

    // Jambes / Quadriceps
    'squat':                       'back squat form tutorial',
    'back squat':                  'back squat form tutorial',
    'front squat':                 'front squat form tutorial',
    'goblet squat':                'goblet squat form tutorial',
    'sissy squat':                 'sissy squat form tutorial',
    'sumo squat haltere':          'sumo dumbbell squat tutorial',
    'split squat bulgare':         'bulgarian split squat tutorial',
    'fentes avant':                'forward lunges form tutorial',
    'fentes marchees':             'walking lunges form tutorial',
    'fentes laterales':            'side lunges form tutorial',
    'fentes arriere':              'reverse lunges form tutorial',
    'leg press':                   'leg press form tutorial',
    'leg press pied haut':         'high foot leg press glutes tutorial',
    'leg extension':               'leg extension form tutorial',
    'leg curl':                    'leg curl form tutorial',
    'leg curl couche':             'lying leg curl tutorial',
    'leg curl assis':              'seated leg curl tutorial',
    'step up halteres':            'dumbbell step up tutorial',
    'squat zercher':               'zercher squat form tutorial',
    'leg press unilateral':        'single leg press form tutorial',
    'fente avant barre':           'barbell lunge form tutorial',
    'fente avant barre marchee':   'barbell walking lunge form tutorial',
    'step up genou haut lestes':   'step up high knee weighted tutorial',
    'wall sit isometrique':        'wall sit isometric quad tutorial',
    'leg press 15 rep':            'leg press 1.5 rep technique tutorial',
    'squat saute':                 'jump squat form tutorial',
    'hack squat machine':          'hack squat machine form tutorial',
    'nordic curl':                 'nordic hamstring curl tutorial',

    // Ischio-jambiers
    'glute ham raise':             'glute ham raise form tutorial',
    'cable pull through':          'cable pull through posterior chain tutorial',
    'leg curl balle suisse':       'swiss ball hamstring curl tutorial',
    'leg curl debout unilateral cable':'standing unilateral leg curl cable tutorial',
    'rdl kettlebell':              'kettlebell romanian deadlift tutorial',
    'sliding leg curl':            'sliding leg curl hamstring tutorial',
    'snatch grip rdl barre':       'snatch grip rdl form tutorial',
    'hamstring walkout':           'hamstring walkout isometric tutorial',
    'leg curl assis unilateral':   'seated unilateral leg curl tutorial',
    'leg curl elastique couche':   'prone hamstring curl resistance band tutorial',

    // Fessiers
    'hip thrust':                  'hip thrust form tutorial',
    'hip thrust barre':            'barbell hip thrust form tutorial',
    'hip thrust unilateral leger': 'single leg hip thrust tutorial',
    'kickback cable fessier':      'cable glute kickback tutorial',
    'glute bridge':                'glute bridge form tutorial',
    'clamshell elastique':         'clamshell exercise glute medius tutorial',
    'frog pump':                   'frog pump glute activation tutorial',
    'abduction hanche cable':      'cable hip abduction standing tutorial',
    'hip thrust pieds sureleves':  'elevated hip thrust tutorial',
    'monster walk elastique':      'monster walk resistance band glute tutorial',
    'single leg glute bridge lestee':'weighted single leg glute bridge tutorial',
    'abduction laterale machine debout':'standing hip abduction machine tutorial',
    'fente laterale glissee':      'lateral slide lunge glute tutorial',
    'quadruped hip extension lestee':'quadruped hip extension weighted tutorial',
    'donkey kicks':                'donkey kicks glute tutorial',

    // Mollets
    'mollets debout':              'standing calf raise tutorial',
    'mollets assis':               'seated calf raise tutorial',
    'mollets unilateraux':         'single leg calf raise form tutorial',
    'mollets barre debout':        'standing barbell calf raise tutorial',
    'donkey calf raise':           'donkey calf raise tutorial',
    'mollets isometriques mur':    'isometric calf raise tutorial',
    'mollets assis haltere sur genoux':'seated dumbbell calf raise tutorial',
    'heel drops excentriques':     'eccentric heel drop calf raise tutorial',
    'mollets debout sur step barre':'barbell calf raise step tutorial',
    'tibial raise mur':            'tibialis anterior raise wall tutorial',

    // Trapèzes
    'shrug barre ez':              'ez bar shrug trap tutorial',
    'shrug cable unilateral':      'unilateral cable shrug trap tutorial',
    'power shrug barre':           'power shrug barbell tutorial',
    'elevation en y banc incline': 'y raise incline bench tutorial',
    'depression scapulaire a la barre':'scapular depression dead hang tutorial',
    'face pull elastique':         'face pull resistance band tutorial',
    'shrug isometrique barre':     'isometric barbell shrug tutorial',
    'farmer carry':                'farmer carry form tutorial',

    // Lombaires / Core profond
    'hyperextension banc lombaires':'back extension hyperextension tutorial',
    'superman':                    'superman back extension floor tutorial',
    'hyperextension reverse':      'reverse hyperextension tutorial',
    'kettlebell swing americain':  'american kettlebell swing overhead tutorial',
    'suitcase carry':              'suitcase carry lateral core tutorial',
    'pallof press a genoux':       'kneeling pallof press anti rotation tutorial',
    'back extension ghd lestee':   'weighted GHD back extension tutorial',
    'stiff leg deadlift halteres': 'stiff leg dumbbell deadlift tutorial',
    'rotation du tronc cable':     'cable woodchop trunk rotation tutorial',
    'deadbug anti flexion baton':  'dead bug anti flexion tutorial',
    'soulevé de terre hex bar':    'trap bar hex bar deadlift tutorial',
    'souleve de terre hex bar':    'trap bar hex bar deadlift tutorial',
    'good morning assis barre':    'seated good morning barbell tutorial',

    // Abdos
    'crunch':                      'crunch form tutorial',
    'crunch incline':              'incline crunch form tutorial',
    'planche':                     'plank form tutorial',
    'gainage':                     'plank form tutorial',
    'gainage lateral':             'side plank form tutorial',
    'leg raises':                  'hanging leg raises tutorial',
    'releve de jambes':            'leg raises form tutorial',
    'mountain climber':            'mountain climber form tutorial',
    'russian twist':               'russian twist form tutorial',
    'dragon flag':                 'dragon flag progression tutorial',
    'pallof press':                'pallof press anti rotation tutorial',
    'l sit progressions':          'l sit progression tutorial',
    'windshield wipers':           'windshield wipers core tutorial',
    'obliques chaise romaine':     'roman chair oblique twist tutorial',
    'hollow body hold':            'hollow body hold tutorial',
    'bird dog':                    'bird dog exercise form tutorial',
    'mcgill curl up':              'mcgill curl up form tutorial',
    'ab wheel':                    'ab wheel rollout tutorial',
    'ab rollout sur genoux':       'ab wheel rollout on knees tutorial',
    'crunch decline lestee':       'weighted decline crunch tutorial',
    'knee tucks suspendu':         'hanging knee tucks tutorial',
    'cable reverse crunch':        'cable reverse crunch lower abs tutorial',
    'swiss ball crunch':           'swiss ball crunch tutorial',
    'v up complet':                'v up exercise tutorial',
    'planche abdominale dynamique':'dynamic plank tutorial',
    'ab crunch machine':           'ab crunch machine tutorial',
    'hollow rock':                 'hollow rock core tutorial',
    'crunch cable poulie haute':   'cable crunch tutorial',
    'releve de jambes suspendu':   'hanging leg raise tutorial',

    // Cardio
    'burpees':                     'burpee form tutorial',
    'jumping jacks':               'jumping jacks form tutorial',
    'corde a sauter':              'jump rope form tutorial',
    'high knees':                  'high knees form tutorial',
    'rameur':                      'rowing machine technique',
    'double unders':               'double unders technique tutorial',

    // Prehab / mobilité
    'rotation externe elastique':  'external rotation rotator cuff prehab',
    'band pull apart':             'band pull apart form tutorial',
    'mobilite cheville mur':       'ankle mobility wall drill tutorial',
    'renforcement poignet flechisseurs':'wrist flexor strengthening tutorial',
    'renforcement poignet extenseurs':  'wrist extensor strengthening tutorial',
    'jefferson curl':              'jefferson curl form tutorial',
    'etirement piriforme figure 4':'piriformis stretch figure 4',
    'activation fessier prone':    'prone glute activation tutorial',
    'terminal leg extension':      'terminal knee extension VMO tutorial'
  };

  // ─── Requêtes FR pour canal Tibo InShape (niveau 1 FR) ───────────────────
  // Ces termes correspondent aux titres de vidéos Tibo InShape en français.
  var FR_QUERIES = {
    'developpe couche':        'développé couché',
    'developpe incline':       'développé incliné',
    'developpe decline':       'développé décliné',
    'developpe militaire':     'développé militaire épaules',
    'tractions':               'tractions dos',
    'traction prise neutre':   'traction prise neutre',
    'traction prise large':    'traction prise large',
    'chin ups':                'chin up biceps',
    'rowing barre':            'rowing barre dos',
    'rowing haltere':          'rowing haltère unilatéral',
    'rowing assis cable':      'rowing câble assis',
    'tirage vertical poulie':  'tirage vertical poulie',
    'tirage poulie haute':     'tirage poulie haute',
    'soulever de terre':       'soulevé de terre',
    'deadlift':                'soulevé de terre',
    'romanian deadlift':       'romanian deadlift',
    'rdl':                     'romanian deadlift',
    'squat':                   'squat technique',
    'back squat':              'squat barre technique',
    'front squat':             'front squat',
    'goblet squat':            'goblet squat',
    'split squat bulgare':     'squat bulgare',
    'fentes avant':            'fentes avant jambes',
    'fentes marchees':         'fentes marchées',
    'leg press':               'leg press technique',
    'leg extension':           'leg extension',
    'leg curl':                'leg curl',
    'hip thrust':              'hip thrust fessiers',
    'hip thrust barre':        'hip thrust barre fessiers',
    'glute bridge':            'pont fessier',
    'elevations laterales':    'élévations latérales épaules',
    'elevations frontales':    'élévations frontales épaules',
    'developpe arnold':        'développé arnold',
    'curl barre':              'curl barre biceps',
    'curl haltere':            'curl haltères biceps',
    'curl marteau':            'curl marteau',
    'curl pupitre':            'curl pupitre biceps',
    'extension triceps poulie':'poulie triceps',
    'extension triceps barre': 'barre front triceps',
    'kickback triceps':        'kickback triceps',
    'dips':                    'dips triceps pectoraux',
    'planche':                 'gainage planche',
    'gainage':                 'gainage abdominaux',
    'crunch':                  'crunch abdominaux',
    'mollets debout':          'mollets debout',
    'mollets assis':           'mollets assis',
    'face pull':               'face pull épaules',
    'farmer carry':            'farmer carry',
    'shrugs barre':            'shrugs trapèzes',
    'shrugs halteres':         'shrugs haltères'
  };

  // ─── Requêtes CrossFit / Haltérophilie / Hyrox ───────────────────────────
  var CF_QUERIES = {
    // Haltérophilie olympique
    'snatch':                  'snatch technique tutorial weightlifting',
    'power snatch':            'power snatch technique tutorial',
    'hang snatch':             'hang power snatch tutorial',
    'hang power snatch':       'hang power snatch tutorial',
    'clean and jerk':          'clean and jerk technique tutorial',
    'clean jerk':              'clean and jerk technique tutorial',
    'power clean':             'power clean technique tutorial',
    'hang power clean':        'hang power clean tutorial',
    'hang clean':              'hang clean technique tutorial',
    'clean':                   'power clean technique crossfit tutorial',
    'split jerk':              'split jerk technique tutorial',
    'push jerk':               'push jerk technique tutorial',
    'push press':              'push press technique tutorial',
    'jerk':                    'jerk technique tutorial weightlifting',
    // Gymnastique CrossFit
    'muscle up':               'muscle up progression tutorial',
    'muscle up anneau':        'ring muscle up progression tutorial',
    'muscle up barre':         'bar muscle up tutorial',
    'kipping pull up':         'kipping pull up tutorial crossfit',
    'chest to bar':            'chest to bar pull up tutorial',
    'toes to bar':             'toes to bar technique tutorial',
    'handstand walk':          'handstand walk tutorial crossfit',
    'handstand push up':       'handstand push up progression tutorial',
    'hspu':                    'handstand push up progression',
    'ring dip':                'ring dip technique tutorial',
    'rope climb':              'rope climb technique crossfit tutorial',
    'l sit':                   'l sit progression tutorial',
    'pistol squat':            'pistol squat progression tutorial',
    // Mouvements WOD communs
    'thruster':                'thruster crossfit form tutorial',
    'wall ball':               'wall ball shot crossfit tutorial',
    'wall balls':              'wall ball shot crossfit tutorial',
    'box jump':                'box jump crossfit technique tutorial',
    'box jump over':           'box jump over crossfit tutorial',
    'burpee box jump over':    'burpee box jump over crossfit',
    'kettlebell swing':        'kettlebell swing technique tutorial',
    'american kettlebell swing':'american kettlebell swing overhead tutorial',
    'double under':            'double unders technique tutorial',
    'double unders':           'double unders technique tutorial',
    'rowing crossfit':         'rowing machine technique crossfit',
    'assault bike':            'assault bike technique crossfit',
    'ski erg':                 'ski erg technique tutorial',
    'burpee':                  'burpee form tutorial',
    'turkish get up':          'turkish get up form tutorial',
    'kettlebell':              'kettlebell swing form tutorial',
    // Hyrox
    'sled push':               'sled push technique hyrox tutorial',
    'sled pull':               'sled pull technique hyrox tutorial',
    'farmers carry hyrox':     'farmers carry hyrox technique',
    'sandbag lunges':          'sandbag walking lunges form tutorial',
    'burpee broad jump':       'burpee broad jump hyrox technique',
    'ski erg hyrox':           'ski erg hyrox technique tutorial',
    'rowing hyrox':            'rowing machine hyrox technique'
  };

  function _normalizeName(name) {
    if (!name) return '';
    return String(name).toLowerCase()
      .replace(/[éèêë]/g, 'e').replace(/[àâä]/g, 'a').replace(/[îï]/g, 'i')
      .replace(/[ùûü]/g, 'u').replace(/[ôö]/g, 'o').replace(/ç/g, 'c')
      .replace(/[''\-\/]/g, ' ')
      .replace(/[^a-z0-9\s]/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  }

  // ─── Sélection du canal selon niveau + langue ─────────────────────────────
  function _resolveChannel(lv) {
    var isEN = window.isEnglish && window.isEnglish();
    var level = (typeof lv === 'number' && lv >= 1 && lv <= 3) ? lv : 1;
    if (level === 1 && !isEN) return CHANNEL_INFO.fr_beginner;
    if (level <= 2)           return CHANNEL_INFO.intermediate;
    return CHANNEL_INFO.advanced;
  }

  /**
   * buildSmartVideoUrl(name, lv)
   * Construit une URL de recherche YouTube filtrée par canal de confiance.
   *
   * Stratégie v2 :
   *   1. Si exercice répertorié → canal-specific search (@handle/search?query=)
   *      → seules les vidéos du canal apparaissent, jamais de clickbait.
   *   2. Si exercice inconnu → YouTube general search + filtre vidéos uniquement
   *      (sp=EgIYAQ%3D%3D, exclut Shorts et chaînes).
   */
  function buildSmartVideoUrl(name, lv) {
    if (!name) return null;
    var key = _normalizeName(name);
    var chan = _resolveChannel(lv);
    var baseQuery = CURATED_QUERIES[key];

    if (baseQuery) {
      // Pour les débutants FR → requête française sur Tibo InShape
      var query = (chan.handle === 'TiboInShape' && FR_QUERIES[key])
        ? FR_QUERIES[key]
        : baseQuery;
      return 'https://www.youtube.com/@' + chan.handle
        + '/search?query=' + encodeURIComponent(query);
    }

    // Exercice inconnu : recherche générale + filtre vidéos
    var isEN = window.isEnglish && window.isEnglish();
    var fallbackQ = isEN
      ? (key + ' exercise form tutorial')
      : (key + ' exercice technique tutoriel');
    return 'https://www.youtube.com/results?search_query='
      + encodeURIComponent(fallbackQ)
      + '&sp=EgIYAQ%253D%253D';
  }

  /**
   * buildCFVideoUrl(name)
   * URL dédiée CrossFit / Haltérophilie / Hyrox.
   * Priorité : CF_QUERIES → canal @CrossFit officiel.
   * Si le mouvement est haltérophilique → @athleanx (tutoriels technique).
   * Fallback général avec qualifier "crossfit tutorial".
   */
  function buildCFVideoUrl(name) {
    if (!name) return null;
    var key = _normalizeName(name);
    var cfQuery = CF_QUERIES[key];

    if (cfQuery) {
      // Haltérophilie → canal @CrossFit officiel (vidéos technique officielles)
      var isOly = /snatch|clean|jerk|thruster|power clean/.test(key);
      var handle = isOly ? 'CrossFit' : 'CrossFit';
      return 'https://www.youtube.com/@' + handle
        + '/search?query=' + encodeURIComponent(cfQuery);
    }

    // Fallback : recherche générale CrossFit avec filtre vidéos
    var fallbackQ = _normalizeName(name).replace(/ /g, '+') + '+crossfit+technique+tutorial';
    return 'https://www.youtube.com/results?search_query='
      + encodeURIComponent(name + ' crossfit technique tutorial')
      + '&sp=EgIYAQ%253D%253D';
  }

  /**
   * getChannelInfo(lv) → { handle, name }
   * Exposé pour que l'UI puisse afficher le nom du canal.
   */
  function getChannelInfo(lv) {
    return _resolveChannel(lv);
  }

  /**
   * openVideoModal(url, exerciseName, level)
   * Modal de préparation — honnête sur ce que l'utilisateur va voir.
   */
  function openVideoModal(url, exerciseName, level) {
    if (!url || typeof document === 'undefined') return;
    var existing = document.getElementById('exo-video-modal');
    if (existing) existing.parentNode.removeChild(existing);

    var chan = _resolveChannel(level);
    var isEN = window.isEnglish && window.isEnglish();

    var ov = document.createElement('div');
    ov.id = 'exo-video-modal';
    ov.style.cssText = 'position:fixed;inset:0;background:rgba(10,10,9,0.85);z-index:9999;'
      + 'display:flex;align-items:center;justify-content:center;padding:20px;';

    var sheet = document.createElement('div');
    sheet.style.cssText = 'background:var(--ivory,#FAF9F6);max-width:460px;width:100%;'
      + 'border:1px solid var(--line,#D8D8D0);border-radius:2px;padding:28px 24px;'
      + 'box-shadow:0 8px 40px rgba(0,0,0,0.3);font-family:"Helvetica Neue",Arial,sans-serif;';

    var eyebrow = document.createElement('div');
    eyebrow.style.cssText = 'font-size:9px;letter-spacing:2.5px;text-transform:uppercase;'
      + 'color:var(--grey,#6B6B65);margin-bottom:12px;';
    eyebrow.textContent = (isEN ? 'Technique video · ' : 'Vidéo technique · ') + chan.name;
    sheet.appendChild(eyebrow);

    var title = document.createElement('div');
    title.style.cssText = 'font-family:Georgia,serif;font-size:20px;color:var(--black,#0A0A09);'
      + 'margin-bottom:10px;line-height:1.3;';
    title.textContent = exerciseName || (isEN ? 'Technique demonstration' : 'Démonstration de l’exercice');
    sheet.appendChild(title);

    var body = document.createElement('p');
    body.style.cssText = 'font-size:13px;color:var(--grey,#6B6B65);line-height:1.6;margin:0 0 22px;';
    body.textContent = isEN
      ? 'Opens a search filtered to ' + chan.name + '’s channel. Select the first result for a clean technique demonstration.'
      : 'Ouvre une recherche filtrée sur la chaîne ' + chan.name + '. Sélectionnez le premier résultat pour une démonstration technique propre.';
    sheet.appendChild(body);

    var actions = document.createElement('div');
    actions.style.cssText = 'display:flex;gap:8px;flex-direction:column;';

    var openBtn = document.createElement('a');
    openBtn.href = url;
    openBtn.target = '_blank';
    openBtn.rel = 'noopener noreferrer';
    openBtn.style.cssText = 'display:block;text-align:center;padding:14px;'
      + 'background:var(--black,#0A0A09);color:var(--ivory,#FAF9F6);text-decoration:none;'
      + 'font-size:11px;letter-spacing:2.5px;text-transform:uppercase;border-radius:2px;'
      + 'min-height:44px;line-height:18px;';
    openBtn.textContent = isEN ? '▶ Open video' : '▶ Ouvrir la vidéo';
    openBtn.addEventListener('click', function() {
      try { if (window.BLACKBOX) window.BLACKBOX.log('exo_video_open', { exo: exerciseName, lv: level }); } catch(e) {}
      setTimeout(function() { if (ov.parentNode) ov.parentNode.removeChild(ov); }, 200);
    });
    actions.appendChild(openBtn);

    var cancelBtn = document.createElement('button');
    cancelBtn.type = 'button';
    cancelBtn.style.cssText = 'padding:12px;background:transparent;color:var(--grey,#6B6B65);'
      + 'border:1px solid var(--line,#D8D8D0);border-radius:2px;cursor:pointer;'
      + 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:11px;letter-spacing:2px;'
      + 'text-transform:uppercase;min-height:44px;';
    cancelBtn.textContent = isEN ? 'Cancel' : 'Annuler';
    cancelBtn.addEventListener('click', function() {
      if (ov.parentNode) ov.parentNode.removeChild(ov);
    });
    actions.appendChild(cancelBtn);

    sheet.appendChild(actions);
    ov.appendChild(sheet);
    ov.addEventListener('click', function(e) {
      if (e.target === ov && ov.parentNode) ov.parentNode.removeChild(ov);
    });
    document.body.appendChild(ov);
  }

  // ─── API publique ─────────────────────────────────────────────────────────
  window.EXERCISE_VIDEOS = {
    buildSmartVideoUrl: buildSmartVideoUrl,
    buildCFVideoUrl:    buildCFVideoUrl,
    getChannelInfo:     getChannelInfo,
    openVideoModal:     openVideoModal,
    _CURATED_QUERIES:   CURATED_QUERIES,
    _CF_QUERIES:        CF_QUERIES,
    _FR_QUERIES:        FR_QUERIES,
    _CHANNELS:          CHANNELS
  };

  // Compatibilité avec l'ancien appel getExerciseVideoUrl (app-sport.js legacy)
  var _legacyGetUrl = window.getExerciseVideoUrl;
  window.getExerciseVideoUrl = function(name, lv) {
    var smart = buildSmartVideoUrl(name, lv);
    if (smart) return smart;
    if (typeof _legacyGetUrl === 'function') return _legacyGetUrl(name);
    return null;
  };
})();
