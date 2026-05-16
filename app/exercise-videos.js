/**
 * SmartFitCoach — Proprietary Software
 * Copyright (c) 2024-2026 SmartFitCoach. All rights reserved.
 */
/* ============================================================
   EXERCISE-VIDEOS.JS — Stratégie vidéo de confiance v3

   Architecture (2026-05) :
   • URLs filtrées par CHAÎNE :
       https://www.youtube.com/@handle/search?query=...
     → seules les vidéos du canal choisi apparaissent.
     → élimine influenceurs, clickbait, shorts parasites.

   Canaux par niveau + langue :
   - Débutant FR  → @TiboInShape  (8.7M, pédagogue FR)
   - Débutant EN  → @athleanx    (14M, Jeff Cavaliere)
   - Inter        → @athleanx    (technique + science)
   - Avancé       → @JeffNippard (peer-reviewed, hypertrophie)
   - CrossFit     → @CrossFit    (officiel, gymnique/oly)
   - Hyrox        → @CrossFit    (officiel, fonctionnel)

   Fallback exercice inconnu :
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
    hyrox:       { handle: 'CrossFit',     name: 'CrossFit'     }
  };

  // Rétro-compat (ancienne forme, exposée en _CHANNELS)
  var CHANNELS = {
    1: ['Tibo InShape', 'Major Mouvement', 'Coach Wog'],
    2: ['AthleanX', 'Jeff Nippard', 'Renaissance Periodization'],
    3: ['Squat University', 'Jeff Nippard', 'Stronger By Science']
  };

  // ─── Requêtes curatées EN : nom_normalisé → query précise ─────────────────
  // Clés = _normalizeName(nom exact de l'exercice dans muscu-programs.js).
  // Couverture complète validée sur 236 exercices (audit 2026-05).
  var CURATED_QUERIES = {
    // ── Pectoraux ─────────────────────────────────────────────────────────
    'developpe couche':                        'bench press form tutorial',
    'developpe halteres couche':               'dumbbell bench press form tutorial',
    'developpe couche haltere unilateral':     'unilateral dumbbell press form tutorial',
    'developpe incline':                       'incline bench press form tutorial',
    'developpe incline barre':                 'incline barbell bench press form tutorial',
    'developpe incline halteres':              'incline dumbbell press form tutorial',
    'developpe decline':                       'decline bench press form tutorial',
    'developpe decline barre':                 'decline barbell bench press form tutorial',
    'close grip bench press':                  'close grip bench press tricep tutorial',
    'developpe couche prise serree':           'close grip bench press tutorial',
    'chest press machine':                     'chest press machine form tutorial',
    'chest press unilateral cable':            'single arm cable chest press tutorial',
    'pompes classiques':                       'push up correct form tutorial',
    'pompes diamant':                          'diamond push up form tutorial',
    'diamond push up':                         'diamond push up close grip form tutorial',
    'pompes declinees':                        'decline push up form tutorial',
    'pompes plyometriques':                    'plyometric push up tutorial',
    'pompes archer':                           'archer push up form tutorial',
    'pompes prise large':                      'wide grip push up form tutorial',
    'dips':                                    'chest dips proper form tutorial',
    'dips lestes':                             'weighted dips chest tutorial',
    'dips prise large':                        'wide grip dips chest tutorial',
    'dips triceps banc':                       'bench dips tricep form tutorial',
    'bench dips lestes':                       'weighted bench dips tricep tutorial',
    'ecartes haltere':                         'dumbbell fly chest form tutorial',
    'ecarte halteres couche':                  'dumbbell chest fly form tutorial',
    'ecartes haltere incline':                 'incline dumbbell fly form tutorial',
    'pec deck butterfly':                      'pec deck machine form tutorial',
    'pec deck':                                'pec deck machine form tutorial',
    'cable crossover':                         'cable crossover fly chest tutorial',
    'cable crossover bas':                     'low cable crossover chest tutorial',
    'cable crossover haut':                    'high cable crossover chest tutorial',
    'ecart cable croise':                      'cable crossover form tutorial',
    'ecarte cable poulie basse crossover haut':'low cable fly upper chest tutorial',
    'ecarte cable poulie haute':               'high cable fly upper chest tutorial',
    'spoto press':                             'spoto press technique',
    'floor press':                             'floor press barbell tutorial',
    'landmine press':                          'landmine press chest form tutorial',

    // ── Dos ───────────────────────────────────────────────────────────────
    'tractions':                               'pull up form tutorial',
    'tractions pronation':                     'overhand pull up form tutorial',
    'traction prise neutre':                   'neutral grip pull up tutorial',
    'traction prise large':                    'wide grip pull up tutorial',
    'traction prise serree':                   'close grip chin up tutorial',
    'traction prise tres large':               'wide overhand pull up form tutorial',
    'traction lestee':                         'weighted pull up form tutorial',
    'traction elastique assistee':             'band assisted pull up form tutorial',
    'chin ups':                                'chin up form tutorial',
    'chin ups traction supination':            'chin up bicep form tutorial',
    'rowing barre':                            'barbell row form tutorial',
    'rowing pendlay':                          'pendlay row form tutorial',
    'pendlay row':                             'pendlay row form tutorial',
    'rowing pendlay prise large':              'wide grip pendlay row form tutorial',
    'rowing haltere':                          'one arm dumbbell row form tutorial',
    'rowing haltere unilateral':               'one arm dumbbell row form tutorial',
    'rowing haltere prise neutre':             'neutral grip dumbbell row form tutorial',
    'rowing assis cable':                      'seated cable row form tutorial',
    'rowing assis cable prise large':          'wide grip seated cable row tutorial',
    'rowing buste penche prise large':         'wide grip bent over barbell row tutorial',
    'rowing buste penche cable prise neutre':  'bent over cable row neutral grip tutorial',
    'rowing debout halteres':                  'dumbbell upright row form tutorial',
    'rowing prise large debout cable':         'wide grip cable upright row tutorial',
    'rowing machine unilateral':               'unilateral cable row form tutorial',
    't bar row':                               't bar row form tutorial',
    't bar row machine':                       't bar row machine form tutorial',
    'yates row':                               'yates row underhand barbell row tutorial',
    'chest supported row':                     'chest supported row form tutorial',
    'seal row':                                'seal row form tutorial',
    'tirage vertical poulie':                  'lat pulldown form tutorial',
    'tirage poulie haute':                     'lat pulldown form tutorial',
    'tirage vertical prise large':             'wide grip lat pulldown tutorial',
    'tirage vertical prise neutre v bar':      'v bar lat pulldown tutorial',
    'tirage horizontal':                       'seated cable row form tutorial',
    'tirage horizontal cable':                 'seated cable row form tutorial',
    'tirage nuque':                            'behind neck lat pulldown tutorial',
    'tirage menton':                           'upright row form tutorial',
    'tirage menton barre':                     'barbell upright row form tutorial',
    'tirage menton cable':                     'cable upright row form tutorial',
    'soulever de terre':                       'deadlift form tutorial',
    'deadlift':                                'deadlift form tutorial',
    'deadlift roumain barre':                  'romanian deadlift barbell form tutorial',
    'souleve de terre conventionnel':          'conventional deadlift form tutorial',
    'souleve de terre roumain':                'romanian deadlift form tutorial',
    'sumo deadlift':                           'sumo deadlift form tutorial',
    'romanian deadlift':                       'romanian deadlift form tutorial',
    'romanian deadlift rdl':                   'romanian deadlift form tutorial',
    'romanian deadlift halteres':              'romanian deadlift dumbbell form tutorial',
    'rdl':                                     'romanian deadlift form tutorial',
    'rdl kettlebell':                          'kettlebell romanian deadlift tutorial',
    'snatch grip rdl barre':                   'snatch grip rdl form tutorial',
    'rack pull':                               'rack pull form tutorial',
    'good morning':                            'good morning exercise form tutorial',
    'good morning barre':                      'good morning barbell form tutorial',
    'good morning halteres':                   'good morning dumbbell form tutorial',
    'good morning assis barre':                'seated good morning barbell tutorial',
    'shrugs barre':                            'barbell shrugs form tutorial',
    'shrug barre':                             'barbell shrug form tutorial',
    'shrug barre ez':                          'ez bar shrug trap tutorial',
    'shrugs halteres':                         'dumbbell shrugs form tutorial',
    'shrug halteres':                          'dumbbell shrug form tutorial',
    'shrug haltere unilateral':                'dumbbell unilateral shrug tutorial',
    'shrug cable unilateral':                  'unilateral cable shrug trap tutorial',
    'shrug machine':                           'machine shrug form tutorial',
    'shrug isometrique barre':                 'isometric barbell shrug tutorial',
    'power shrug barre':                       'power shrug barbell tutorial',
    'face pull':                               'face pull form tutorial',
    'face pull prehab':                        'face pull rotator cuff prehab',
    'face pull cable':                         'face pull form tutorial',
    'face pull poulie haute':                  'face pull form tutorial',
    'face pull elastique':                     'face pull resistance band tutorial',
    'straight arm pulldown barre':             'straight arm lat pulldown tutorial',
    'straight arm pulldown cable':             'straight arm lat pulldown tutorial',
    'pull over haltere couche':                'dumbbell pullover form tutorial',
    'depression scapulaire a la barre':        'scapular depression dead hang tutorial',
    'elevation en y banc incline':             'y raise incline bench tutorial',
    'farmer carry':                            'farmer carry form tutorial',
    'farmer carry sur orteils':                'farmer carry calf walk tutorial',
    'suitcase carry':                          'suitcase carry lateral core tutorial',

    // ── Épaules ───────────────────────────────────────────────────────────
    'developpe militaire':                     'overhead press form tutorial',
    'overhead press':                          'overhead press form tutorial',
    'developpe militaire barre':               'barbell overhead press form tutorial',
    'developpe militaire machine':             'machine shoulder press form tutorial',
    'developpe haltere assis':                 'seated dumbbell shoulder press tutorial',
    'developpe halteres assis':                'seated dumbbell shoulder press tutorial',
    'developpe halteres debout':               'standing dumbbell overhead press tutorial',
    'developpe arnold':                        'arnold press form tutorial',
    'arnold press':                            'arnold press form tutorial',
    'elevations laterales':                    'lateral raise form tutorial',
    'elevations laterales cable':              'cable lateral raise form tutorial',
    'elevations laterales elastique':          'band lateral raise shoulder tutorial',
    'elevations frontales':                    'front raise form tutorial',
    'elevations frontales cable':              'cable front raise shoulder tutorial',
    'elevation frontale cable':                'cable front raise tutorial',
    'oiseau':                                  'rear delt fly form tutorial',
    'oiseau halteres rear delt':               'rear delt fly form tutorial',
    'oiseau halteres':                         'rear delt fly dumbbell form tutorial',
    'oiseau poulie cable':                     'cable rear delt fly form tutorial',
    'lu raise':                                'lu raise shoulder tutorial',
    'developpe nuque':                         'behind neck press tutorial',
    'developpe militaire barre nuque':         'behind neck press tutorial',
    'upright row cable':                       'cable upright row form tutorial',
    'rotation externe haltere coude appuye':   'seated external rotation dumbbell tutorial',
    'scarecrow halteres':                      'scarecrow shoulder stability tutorial',
    'push press barre':                        'barbell push press form tutorial',

    // ── Biceps ────────────────────────────────────────────────────────────
    'curl barre':                              'barbell curl form tutorial',
    'curl barre droite':                       'straight bar bicep curl tutorial',
    'curl ez barre':                           'ez bar curl form tutorial',
    'curl haltere':                            'dumbbell curl form tutorial',
    'curl halteres alterne':                   'alternating dumbbell curl tutorial',
    'curl marteau':                            'hammer curl form tutorial',
    'curl marteau cable':                      'cable hammer curl tutorial',
    'curl incline halteres':                   'incline dumbbell curl tutorial',
    'curl spider araignee':                    'spider curl form tutorial',
    'curl pupitre':                            'preacher curl form tutorial',
    'curl pupitre scott curl':                 'preacher curl scott curl form tutorial',
    'curl pupitre haltere unilateral':         'single arm preacher curl dumbbell tutorial',
    'curl concentre':                          'concentration curl tutorial',
    'curl barre supination 3 4 amplitude':     'partial bicep curl peak contraction tutorial',
    'curl 21s':                                'barbell 21s bicep curl technique',
    'bayesian curl cable':                     'bayesian cable curl long head tutorial',
    'curl cable basse poulie':                 'low cable bicep curl tutorial',
    'reverse curl cable':                      'cable reverse curl brachialis tutorial',
    'curl prise neutre barre ez':              'neutral grip ez bar curl tutorial',
    'drag curl barre':                         'drag curl barbell long head tutorial',
    'curl incline cable unilateral':           'incline cable curl form tutorial',
    'zottman curl':                            'zottman curl forearm bicep tutorial',
    'curl cable a 90 peak':                    'cable curl peak contraction tutorial',

    // ── Triceps ───────────────────────────────────────────────────────────
    'extension triceps poulie':                'tricep pushdown form tutorial',
    'pushdown cable barre':                    'tricep bar pushdown form tutorial',
    'pushdown cable corde':                    'rope tricep pushdown form tutorial',
    'overhead extension cable':                'cable overhead tricep extension tutorial',
    'extension triceps barre':                 'skull crusher form tutorial',
    'skull crushers ez':                       'skull crusher ez bar form tutorial',
    'extension barre couche':                  'skull crusher barbell form tutorial',
    'extension haltere tete':                  'overhead tricep extension dumbbell tutorial',
    'extension triceps machine':               'tricep machine extension form tutorial',
    'extension triceps bras tendu haltere':    'overhead tricep extension tutorial',
    'overhead extension halteres bilateral':   'overhead dumbbell tricep extension tutorial',
    'jm press barre':                          'jm press barbell tricep tutorial',
    'jm press ez':                             'jm press ez bar tricep tutorial',
    'dips barres paralleles lest':             'weighted parallel bar dips tricep tutorial',
    'kickback triceps':                        'tricep kickback form tutorial',
    'kick back haltere':                       'dumbbell tricep kickback form tutorial',
    'kick back cable':                         'cable tricep kickback form tutorial',
    'extension triceps elastique debout':      'resistance band tricep pushdown tutorial',
    'tate press':                              'tate press tricep form tutorial',

    // ── Quadriceps / Jambes ───────────────────────────────────────────────
    'squat':                                   'back squat form tutorial',
    'squat barre':                             'back squat barbell form tutorial',
    'back squat':                              'back squat form tutorial',
    'squat poids de corps':                    'bodyweight squat form tutorial',
    'squat sumo':                              'sumo squat form tutorial',
    'sumo squat haltere':                      'sumo dumbbell squat tutorial',
    'goblet squat':                            'goblet squat form tutorial',
    'squat gobelet kettlebell':                'goblet squat kettlebell tutorial',
    'front squat':                             'front squat form tutorial',
    'front squat barre':                       'front squat barbell form tutorial',
    'sissy squat':                             'sissy squat form tutorial',
    'squat zercher':                           'zercher squat form tutorial',
    'squat saute':                             'jump squat form tutorial',
    'hack squat machine':                      'hack squat machine form tutorial',
    'split squat bulgare':                     'bulgarian split squat tutorial',
    'fente bulgare halteres':                  'bulgarian split squat dumbbell tutorial',
    'fentes avant':                            'forward lunges form tutorial',
    'fente avant halteres':                    'dumbbell forward lunge form tutorial',
    'fente avant barre':                       'barbell lunge form tutorial',
    'fentes marchees':                         'walking lunges form tutorial',
    'fente avant barre marchee':               'barbell walking lunge form tutorial',
    'fentes laterales':                        'side lunges form tutorial',
    'fente laterale halteres':                 'lateral lunge dumbbell form tutorial',
    'fentes arriere':                          'reverse lunges form tutorial',
    'fente reverse halteres':                  'reverse lunge dumbbell form tutorial',
    'leg press':                               'leg press form tutorial',
    'leg press pied haut':                     'high foot leg press glutes tutorial',
    'leg press unilateral':                    'single leg press form tutorial',
    'leg press 15 rep':                        'leg press 1.5 rep technique tutorial',
    'leg extension':                           'leg extension form tutorial',
    'extension jambes machine':                'leg extension machine form tutorial',
    'step up halteres':                        'dumbbell step up tutorial',
    'step up genou haut lestes':               'step up high knee weighted tutorial',
    'wall sit isometrique':                    'wall sit isometric quad tutorial',

    // ── Ischio-jambiers ───────────────────────────────────────────────────
    'leg curl':                                'leg curl form tutorial',
    'leg curl couche':                         'lying leg curl tutorial',
    'leg curl allonge':                        'lying leg curl form tutorial',
    'leg curl assis':                          'seated leg curl tutorial',
    'leg curl assis unilateral':               'seated unilateral leg curl tutorial',
    'leg curl debout cable':                   'standing cable leg curl tutorial',
    'leg curl debout unilateral cable':        'standing unilateral leg curl cable tutorial',
    'leg curl balle suisse':                   'swiss ball hamstring curl tutorial',
    'leg curl elastique couche':               'prone hamstring curl resistance band tutorial',
    'glute ham raise':                         'glute ham raise form tutorial',
    'cable pull through':                      'cable pull through posterior chain tutorial',
    'nordic curl':                             'nordic hamstring curl tutorial',
    'sliding leg curl':                        'sliding leg curl hamstring tutorial',
    'hamstring walkout':                       'hamstring walkout isometric tutorial',
    'hip extension 45 ischio focus':           '45 degree back extension hamstring focus tutorial',
    'hyperextension ischios focus':            'back extension hamstring focus tutorial',

    // ── Fessiers ──────────────────────────────────────────────────────────
    'hip thrust':                              'hip thrust form tutorial',
    'hip thrust barre':                        'barbell hip thrust form tutorial',
    'hip thrust haltere':                      'hip thrust dumbbell form tutorial',
    'hip thrust unilateral':                   'single leg hip thrust tutorial',
    'hip thrust unilateral leger':             'single leg hip thrust tutorial',
    'hip thrust pieds sureleves':              'elevated hip thrust tutorial',
    'glute bridge':                            'glute bridge form tutorial',
    'glute bridge bilateral':                  'glute bridge bilateral form tutorial',
    'single leg glute bridge lestee':          'weighted single leg glute bridge tutorial',
    'kickback cable fessier':                  'cable glute kickback tutorial',
    'kick back cable fessiers':                'cable glute kickback tutorial',
    'clamshell elastique':                     'clamshell exercise glute medius tutorial',
    'frog pump':                               'frog pump glute activation tutorial',
    'abduction hanche cable':                  'cable hip abduction standing tutorial',
    'abduction debout elastique':              'standing hip abduction resistance band tutorial',
    'monster walk elastique':                  'monster walk resistance band glute tutorial',
    'abduction laterale machine debout':       'standing hip abduction machine tutorial',
    'fente laterale glissee':                  'lateral slide lunge glute tutorial',
    'quadruped hip extension lestee':          'quadruped hip extension weighted tutorial',
    'donkey kicks':                            'donkey kicks glute tutorial',

    // ── Mollets ───────────────────────────────────────────────────────────
    'mollets debout':                          'standing calf raise tutorial',
    'mollets debout halteres':                 'standing dumbbell calf raise tutorial',
    'mollets debout machine':                  'standing calf machine form tutorial',
    'mollets barre debout':                    'standing barbell calf raise tutorial',
    'mollets debout sur step barre':           'barbell calf raise step tutorial',
    'mollets assis':                           'seated calf raise tutorial',
    'mollets assis machine':                   'seated calf machine form tutorial',
    'mollets assis elastique':                 'banded seated calf raise tutorial',
    'mollets assis haltere sur genoux':        'seated dumbbell calf raise tutorial',
    'mollets unilateraux':                     'single leg calf raise form tutorial',
    'mollets leg press':                       'calf press leg press tutorial',
    'mollets marche sur pointes':              'walking calf raise form tutorial',
    'donkey calf raise':                       'donkey calf raise tutorial',
    'mollets isometriques mur':                'isometric calf raise tutorial',
    'heel drops excentriques':                 'eccentric heel drop calf raise tutorial',
    'tibial raise mur':                        'tibialis anterior raise wall tutorial',
    'saut sur box mollets':                    'box jump calf plyometric tutorial',
    'triple extension mollets sauts':          'triple extension explosive calf tutorial',

    // ── Lombaires / Core profond ──────────────────────────────────────────
    'hyperextension banc lombaires':           'back extension hyperextension tutorial',
    'superman':                                'superman back extension floor tutorial',
    'hyperextension reverse':                  'reverse hyperextension tutorial',
    'kettlebell swing americain':              'american kettlebell swing overhead tutorial',
    'pallof press a genoux':                   'kneeling pallof press anti rotation tutorial',
    'back extension ghd lestee':               'weighted GHD back extension tutorial',
    'stiff leg deadlift halteres':             'stiff leg dumbbell deadlift tutorial',
    'rotation du tronc cable':                 'cable woodchop trunk rotation tutorial',
    'soulevé de terre hex bar':                'trap bar hex bar deadlift tutorial',
    'souleve de terre hex bar':                'trap bar hex bar deadlift tutorial',

    // ── Abdos ─────────────────────────────────────────────────────────────
    'crunch':                                  'crunch form tutorial',
    'crunch classique':                        'crunch form tutorial',
    'crunch incline':                          'incline crunch form tutorial',
    'oblique crunch au sol':                   'oblique crunch floor tutorial',
    'swiss ball crunch':                       'swiss ball crunch tutorial',
    'crunch decline lestee':                   'weighted decline crunch tutorial',
    'crunch cable poulie haute':               'cable crunch tutorial',
    'cable reverse crunch':                    'cable reverse crunch lower abs tutorial',
    'ab crunch machine':                       'ab crunch machine tutorial',
    'planche':                                 'plank form tutorial',
    'gainage':                                 'plank form tutorial',
    'planche abdominale':                      'plank form tutorial',
    'planche ventrale prone plank':            'plank form tutorial',
    'planche abdominale dynamique':            'dynamic plank tutorial',
    'gainage lateral':                         'side plank form tutorial',
    'leg raises':                              'hanging leg raises tutorial',
    'releve de jambes':                        'leg raises form tutorial',
    'releve de jambes suspendu':               'hanging leg raise tutorial',
    'knee tucks suspendu':                     'hanging knee tucks tutorial',
    'mountain climber':                        'mountain climber form tutorial',
    'mountain climbers':                       'mountain climber form tutorial',
    'russian twist':                           'russian twist form tutorial',
    'obliques chaise romaine':                 'roman chair oblique twist tutorial',
    'dragon flag':                             'dragon flag progression tutorial',
    'pallof press':                            'pallof press anti rotation tutorial',
    'l sit progressions':                      'l sit progression tutorial',
    'windshield wipers':                       'windshield wipers core tutorial',
    'hollow body hold':                        'hollow body hold tutorial',
    'hollow rock':                             'hollow rock core tutorial',
    'bird dog':                                'bird dog exercise form tutorial',
    'mcgill curl up':                          'mcgill curl up form tutorial',
    'ab wheel':                                'ab wheel rollout tutorial',
    'ab rollout sur genoux':                   'ab wheel rollout on knees tutorial',
    'roulette abdominale':                     'ab wheel rollout tutorial',
    'v up complet':                            'v up exercise tutorial',
    'dead bug':                                'dead bug core exercise tutorial',
    'deadbug anti flexion baton':              'dead bug anti flexion tutorial',
    'l sit':                                   'l sit progression tutorial',

    // ── Cardio ────────────────────────────────────────────────────────────
    'kettlebell swing':                        'kettlebell swing technique tutorial',
    'burpees':                                 'burpee form tutorial',
    'jumping jacks':                           'jumping jacks form tutorial',
    'corde a sauter':                          'jump rope form tutorial',
    'sauts a la corde':                        'jump rope form tutorial',
    'high knees':                              'high knees form tutorial',
    'rameur':                                  'rowing machine technique',
    'double unders':                           'double unders technique tutorial',

    // ── Prehab / mobilité ─────────────────────────────────────────────────
    'rotation externe elastique':              'external rotation rotator cuff prehab',
    'band pull apart':                         'band pull apart form tutorial',
    'mobilite cheville mur':                   'ankle mobility wall drill tutorial',
    'renforcement poignet flechisseurs':       'wrist flexor strengthening tutorial',
    'renforcement poignet extenseurs':         'wrist extensor strengthening tutorial',
    'jefferson curl':                          'jefferson curl form tutorial',
    'etirement piriforme figure 4':            'piriformis stretch figure 4',
    'activation fessier prone':                'prone glute activation tutorial',
    'terminal leg extension':                  'terminal knee extension VMO tutorial',
    'terminal leg extension elastique':        'terminal knee extension VMO tutorial'
  };

  // ─── Requêtes FR pour canal @TiboInShape (niveau 1 FR) ───────────────────
  // Titres correspondant aux vidéos Tibo InShape. Utilisées quand chan.handle === 'TiboInShape'.
  var FR_QUERIES = {
    // Pectoraux
    'developpe couche':              'développé couché',
    'developpe halteres couche':     'développé couché haltères',
    'developpe incline':             'développé incliné',
    'developpe incline halteres':    'développé incliné haltères',
    'developpe decline':             'développé décliné',
    'developpe militaire':           'développé militaire épaules',
    'developpe militaire barre':     'développé militaire barre',
    'chest press machine':           'chest press machine technique',
    'pompes classiques':             'pompes technique',
    'dips':                          'dips triceps pectoraux',
    'dips triceps banc':             'dips banc triceps',
    'cable crossover':               'câble croisé pectoraux',
    'ecarte halteres couche':        'écarté haltères pectoraux',
    'close grip bench press':        'prise serrée pectoraux triceps',
    // Dos
    'tractions':                     'tractions dos',
    'tractions pronation':           'tractions pronation dos',
    'traction prise neutre':         'traction prise neutre',
    'traction prise large':          'traction prise large',
    'chin ups':                      'chin up biceps',
    'chin ups traction supination':  'chin up supination biceps',
    'rowing barre':                  'rowing barre dos',
    'rowing haltere':                'rowing haltère unilatéral',
    'rowing haltere unilateral':     'rowing haltère unilatéral dos',
    'rowing assis cable':            'rowing câble assis',
    'tirage vertical poulie':        'tirage vertical poulie',
    'tirage poulie haute':           'tirage poulie haute',
    'tirage vertical prise large':   'tirage prise large dos',
    'tirage horizontal cable':       'tirage horizontal câble dos',
    'soulever de terre':             'soulevé de terre',
    'deadlift':                      'soulevé de terre',
    'souleve de terre conventionnel':'soulevé de terre conventionnel',
    'souleve de terre roumain':      'soulevé de terre roumain',
    'romanian deadlift':             'romanian deadlift',
    'romanian deadlift halteres':    'romanian deadlift haltères',
    'rdl':                           'romanian deadlift',
    'shrug barre':                   'shrugs trapèzes barre',
    'shrugs barre':                  'shrugs trapèzes',
    'shrug halteres':                'shrugs haltères',
    'shrugs halteres':               'shrugs haltères',
    'face pull':                     'face pull épaules',
    'face pull cable':               'face pull câble',
    // Épaules
    'elevations laterales':          'élévations latérales épaules',
    'elevations laterales cable':    'élévations latérales câble',
    'elevations frontales':          'élévations frontales épaules',
    'elevations frontales cable':    'élévations frontales câble',
    'developpe arnold':              'développé arnold',
    'developpe haltere assis':       'développé haltères assis',
    'developpe halteres assis':      'développé haltères assis',
    'oiseau halteres':               'oiseau arrière épaules',
    'oiseau':                        'oiseau épaules arrière',
    // Biceps
    'curl barre':                    'curl barre biceps',
    'curl ez barre':                 'curl barre EZ biceps',
    'curl barre droite':             'curl barre droite biceps',
    'curl haltere':                  'curl haltères biceps',
    'curl halteres alterne':         'curl haltères alterné',
    'curl marteau':                  'curl marteau',
    'curl pupitre':                  'curl pupitre biceps',
    'curl pupitre scott curl':       'curl pupitre biceps',
    'curl concentre':                'curl concentré',
    'curl 21s':                      'curl 21s biceps',
    // Triceps
    'extension triceps poulie':      'poulie triceps',
    'pushdown cable corde':          'poulie corde triceps',
    'pushdown cable barre':          'poulie barre triceps',
    'skull crushers ez':             'barre front EZ triceps',
    'extension triceps barre':       'barre front triceps',
    'extension haltere tete':        'extension haltère triceps',
    'overhead extension cable':      'poulie haute overhead triceps',
    'kickback triceps':              'kickback triceps',
    'kick back haltere':             'kickback haltère triceps',
    // Jambes
    'squat':                         'squat technique',
    'squat barre':                   'squat barre technique',
    'back squat':                    'squat barre technique',
    'squat poids de corps':          'squat poids de corps',
    'squat sumo':                    'squat sumo',
    'front squat':                   'front squat',
    'front squat barre':             'front squat barre',
    'goblet squat':                  'goblet squat',
    'squat gobelet kettlebell':      'goblet squat kettlebell',
    'split squat bulgare':           'squat bulgare',
    'fente bulgare halteres':        'squat bulgare haltères',
    'fentes avant':                  'fentes avant jambes',
    'fente avant halteres':          'fentes avant haltères',
    'fentes marchees':               'fentes marchées',
    'fente reverse halteres':        'fentes arrière haltères',
    'leg press':                     'leg press technique',
    'leg extension':                 'leg extension',
    'extension jambes machine':      'leg extension machine',
    // Ischios
    'leg curl':                      'leg curl',
    'leg curl couche':               'leg curl allongé',
    'leg curl allonge':              'leg curl allongé',
    'leg curl assis':                'leg curl assis',
    'nordic curl':                   'nordic curl',
    // Fessiers
    'hip thrust':                    'hip thrust fessiers',
    'hip thrust barre':              'hip thrust barre fessiers',
    'hip thrust haltere':            'hip thrust haltères',
    'hip thrust unilateral':         'hip thrust unilatéral',
    'glute bridge':                  'pont fessier',
    'glute bridge bilateral':        'pont fessier bilatéral',
    'kick back cable fessiers':      'kickback câble fessiers',
    // Mollets
    'mollets debout':                'mollets debout',
    'mollets debout halteres':       'mollets debout haltères',
    'mollets assis':                 'mollets assis',
    'mollets assis machine':         'mollets assis machine',
    'mollets unilateraux':           'mollets unilatéraux',
    // Core
    'planche':                       'gainage planche',
    'gainage':                       'gainage abdominaux',
    'planche abdominale':            'gainage planche',
    'crunch':                        'crunch abdominaux',
    'crunch classique':              'crunch abdominaux',
    'oblique crunch au sol':         'crunch oblique',
    'mountain climber':              'mountain climber',
    'mountain climbers':             'mountain climber cardio',
    'dead bug':                      'dead bug gainage',
    'bird dog':                      'bird dog gainage',
    // Misc
    'farmer carry':                  'farmer carry',
    'sauts a la corde':              'corde à sauter'
  };

  // ─── Requêtes CrossFit / Haltérophilie / Hyrox ───────────────────────────
  // Canal @CrossFit — officiel, technique confirmée, pas d'influenceurs.
  var CF_QUERIES = {
    // Haltérophilie olympique
    'snatch':                    'snatch technique tutorial weightlifting',
    'power snatch':              'power snatch technique tutorial',
    'hang snatch':               'hang power snatch tutorial',
    'hang power snatch':         'hang power snatch tutorial',
    'clean and jerk':            'clean and jerk technique tutorial',
    'clean jerk':                'clean and jerk technique tutorial',
    'power clean':               'power clean technique tutorial',
    'hang power clean':          'hang power clean tutorial',
    'hang power cleans':         'hang power clean tutorial',
    'hang clean':                'hang clean technique tutorial',
    'hang cleans':               'hang clean technique tutorial',
    'hang squat clean':          'hang squat clean technique tutorial',
    'hang squat cleans':         'hang squat clean technique tutorial',
    'clean':                     'power clean technique crossfit tutorial',
    'split jerk':                'split jerk technique tutorial',
    'push jerk':                 'push jerk technique tutorial',
    'push press':                'push press technique tutorial',
    'jerk':                      'jerk technique tutorial weightlifting',
    'clean pull speed':          'clean pull technique tutorial',
    'overhead squat':            'overhead squat technique tutorial',
    'dumbbell snatch':           'dumbbell snatch crossfit tutorial',
    // Gymnastic / Calisthenics CrossFit
    'muscle up':                 'muscle up progression tutorial',
    'muscle up anneau':          'ring muscle up progression tutorial',
    'muscle up barre':           'bar muscle up tutorial',
    'bar muscle up':             'bar muscle up tutorial',
    'bar muscle ups':            'bar muscle up tutorial',
    'kipping pull up':           'kipping pull up tutorial crossfit',
    'kipping pull up speed':     'kipping pull up tutorial crossfit',
    'chest to bar':              'chest to bar pull up tutorial',
    'chest to bar pull ups':     'chest to bar pull up tutorial',
    'c2b':                       'chest to bar pull up tutorial',
    'c2b pull ups':              'chest to bar pull up tutorial',
    'toes to bar':               'toes to bar technique tutorial',
    'handstand walk':            'handstand walk tutorial crossfit',
    'hs walk':                   'handstand walk tutorial crossfit',
    'handstand push up':         'handstand push up progression tutorial',
    'handstand push ups':        'handstand push up progression tutorial',
    'hspu':                      'handstand push up progression',
    'ring dip':                  'ring dip technique tutorial',
    'rope climb':                'rope climb technique crossfit tutorial',
    'l sit':                     'l sit progression tutorial',
    'pistol squat':              'pistol squat progression tutorial',
    'ring row':                  'ring row technique tutorial crossfit',
    'wall walk':                 'wall walk handstand crossfit tutorial',
    'air squat':                 'air squat crossfit tutorial',
    'strict pull up':            'strict pull up crossfit tutorial',
    'strict handstand push up':  'strict handstand push up crossfit tutorial',
    // Mouvements WOD communs
    'thruster':                  'thruster crossfit form tutorial',
    'dumbbell thruster':         'dumbbell thruster crossfit tutorial',
    'wall ball':                 'wall ball shot crossfit tutorial',
    'wall balls':                'wall ball shot crossfit tutorial',
    'box jump':                  'box jump crossfit technique tutorial',
    'box jumps':                 'box jump crossfit technique tutorial',
    'box step up':               'box step up crossfit tutorial',
    'box jump over':             'box jump over crossfit tutorial',
    'burpee box jump over':      'burpee box jump over crossfit',
    'burpee box jumps':          'burpee box jump over crossfit',
    'burpee over bar':           'burpee over bar crossfit tutorial',
    'burpees over bar':          'burpee over bar crossfit tutorial',
    'devil press':               'devil press crossfit tutorial',
    'kettlebell swing':          'kettlebell swing technique tutorial',
    'kb swing':                  'kettlebell swing technique tutorial',
    'kb swings':                 'kettlebell swing technique tutorial',
    'american kettlebell swing': 'american kettlebell swing overhead tutorial',
    'double under':              'double unders technique tutorial',
    'double unders':             'double unders technique tutorial',
    'rowing crossfit':           'rowing machine technique crossfit',
    'cal row':                   'rowing machine technique crossfit',
    'calories row':              'rowing machine technique crossfit',
    'assault bike':              'assault bike technique crossfit',
    'cal assault bike':          'assault bike technique crossfit',
    'calories assault bike':     'assault bike technique crossfit',
    'ski erg':                   'ski erg technique tutorial',
    'calories ski erg':          'ski erg technique tutorial',
    'burpee':                    'burpee form tutorial',
    'burpees':                   'burpee form tutorial',
    'turkish get up':            'turkish get up form tutorial',
    'hanging knee raise':        'hanging knee raise crossfit tutorial',
    // Hyrox
    'sled push':                 'sled push technique hyrox tutorial',
    'sled pull':                 'sled pull technique hyrox tutorial',
    'farmers carry hyrox':       'farmers carry hyrox technique',
    'sandbag lunges':            'sandbag walking lunges form tutorial',
    'sandbag clean':             'sandbag clean hyrox tutorial',
    'burpee broad jump':         'burpee broad jump hyrox technique',
    'ski erg hyrox':             'ski erg hyrox technique tutorial',
    'rowing hyrox':              'rowing machine hyrox technique'
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
   * Stratégie :
   *   1. Exercice répertorié → canal-specific search (@handle/search?query=)
   *      → seules les vidéos du canal choisi, jamais de clickbait.
   *   2. Exercice inconnu → YouTube general search + filtre vidéos uniquement
   *      (sp=EgIYAQ%3D%3D, exclut Shorts et chaînes).
   */
  function buildSmartVideoUrl(name, lv) {
    if (!name) return null;
    var key = _normalizeName(name);
    var chan = _resolveChannel(lv);
    var baseQuery = CURATED_QUERIES[key];

    if (baseQuery) {
      var query = (chan.handle === 'TiboInShape' && FR_QUERIES[key])
        ? FR_QUERIES[key]
        : baseQuery;
      return 'https://www.youtube.com/@' + chan.handle
        + '/search?query=' + encodeURIComponent(query);
    }

    // Exercice inconnu : recherche générale + filtre vidéos uniquement
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
   * URL dédiée CrossFit / Haltérophilie / Hyrox → canal @CrossFit officiel.
   * Fallback : YouTube search général + filtre vidéos + qualifier crossfit.
   */
  function buildCFVideoUrl(name) {
    if (!name) return null;
    var key = _normalizeName(name);
    var cfQuery = CF_QUERIES[key];

    if (cfQuery) {
      return 'https://www.youtube.com/@CrossFit/search?query=' + encodeURIComponent(cfQuery);
    }

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
   * Modal préparation — honnête sur ce que l'utilisateur va voir.
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
