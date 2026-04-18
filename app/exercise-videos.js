/**
 * SmartFitCoach — Proprietary Software
 * Copyright (c) 2024-2026 SmartFitCoach. All rights reserved.
 */
/* ============================================================
   EXERCISE-VIDEOS.JS — Vidéos curées par chaîne fitness
   Stratégie : URL de recherche YouTube préfixée par chaîne établie
   pour que la 1re vidéo affichée soit pédagogique et non ambigüe.

   Niveaux ciblés :
   - lv 1 (Débutant) → Major Mouvement / Tibo InShape (FR clair)
   - lv 2 (Inter)    → AthleanX / Jeff Nippard (technique)
   - lv 3 (Avancé)   → Squat University / RP Strength (force / pro)

   Pour les exercices ambigus (ex. "dips" → chest vs tricep), on
   force un qualifier dans CURATED_QUERIES.
   ============================================================ */
(function() {
  'use strict';

  // ─── Chaînes préférées par niveau ───
  // L'URL renvoie en 1er résultat la vidéo de la chaîne (matching exact du nom)
  var CHANNELS = {
    1: ['Tibo InShape', 'Major Mouvement', 'Coach Wog'],   // Débutants FR
    2: ['AthleanX', 'Jeff Nippard', 'Renaissance Periodization'], // Intermédiaires
    3: ['Squat University', 'Jeff Nippard', 'Stronger By Science'] // Avancés
  };

  // ─── Overrides pour exos ambigus ou mal nommés ───
  // Format : nom_normalisé → query_complète (sans accents, lowercase)
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
    'dips':                        'chest dips vs tricep dips tutorial',
    'dips lestes':                 'weighted dips chest tutorial',
    'spoto press':                 'spoto press technique powerlifting',
    'floor press':                 'floor press barbell tutorial',

    // Dos
    'tractions':                   'pull up form tutorial complete',
    'traction prise neutre':       'neutral grip pull up tutorial',
    'traction prise large':        'wide grip pull up tutorial',
    'traction prise serree':       'close grip chin up tutorial',
    'chin ups':                    'chin up form tutorial',
    'rowing barre':                'barbell row form tutorial',
    'rowing pendlay':              'pendlay row form tutorial',
    'pendlay row':                 'pendlay row form tutorial',
    'rowing haltere':              'one arm dumbbell row form tutorial',
    'rowing assis cable':          'seated cable row form tutorial',
    'rowing assis cable prise large': 'wide grip seated cable row tutorial',
    't bar row':                   't bar row form tutorial',
    't bar row machine':           't bar row machine form tutorial',
    'tirage vertical poulie':      'lat pulldown form tutorial',
    'tirage poulie haute':         'lat pulldown form tutorial',
    'tirage horizontal':           'seated cable row form tutorial',
    'tirage nuque':                'behind neck pulldown tutorial',
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

    // Bras
    'curl barre':                  'barbell curl form tutorial',
    'curl haltere':                'dumbbell curl form tutorial',
    'curl marteau':                'hammer curl form tutorial',
    'curl marteau cable':          'cable hammer curl tutorial',
    'curl incline halteres':       'incline dumbbell curl tutorial',
    'curl spider araignee':        'spider curl form tutorial',
    'curl pupitre':                'preacher curl form tutorial',
    'curl concentre':              'concentration curl tutorial',
    'extension triceps poulie':    'tricep pushdown form tutorial',
    'extension triceps barre':     'skull crusher form tutorial',
    'kickback triceps':            'tricep kickback form tutorial',
    'developpe couche prise serree': 'close grip bench press tutorial',

    // Jambes
    'squat':                       'back squat form tutorial complete',
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
    'mollets debout':              'standing calf raise tutorial',
    'mollets assis':               'seated calf raise tutorial',
    'step up halteres':            'dumbbell step up tutorial',
    'nordic curl':                 'nordic hamstring curl tutorial',

    // Fessiers
    'hip thrust':                  'hip thrust form tutorial complete',
    'hip thrust barre':            'barbell hip thrust form tutorial',
    'hip thrust unilateral leger': 'single leg hip thrust tutorial',
    'kickback cable fessier':      'cable glute kickback tutorial',
    'glute bridge':                'glute bridge form tutorial',
    'clamshell elastique':         'clamshell exercise glute medius',

    // Core / Abdos
    'crunch':                      'crunch form tutorial',
    'crunch incline':              'incline crunch form tutorial',
    'planche':                     'plank form tutorial complete',
    'gainage':                     'plank form tutorial complete',
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
    'hollow body hold':            'hollow body hold form tutorial',
    'bird dog':                    'bird dog exercise form tutorial',
    'mcgill curl up':              'mcgill curl up form tutorial',
    'ab wheel':                    'ab wheel rollout tutorial',

    // Cardio
    'burpees':                     'burpee form tutorial',
    'jumping jacks':               'jumping jacks form tutorial',
    'corde a sauter':              'jump rope form tutorial',
    'high knees':                  'high knees form tutorial',
    'rameur':                      'concept2 rowing technique',
    'double unders':               'double unders technique',

    // Prehab / mobilité
    'rotation externe elastique':  'external rotation rotator cuff prehab',
    'band pull apart':             'band pull apart form tutorial',
    'mobilite cheville mur':       'ankle mobility wall test',
    'renforcement poignet flechisseurs': 'wrist flexor strengthening',
    'renforcement poignet extenseurs':   'wrist extensor strengthening',
    'jefferson curl':              'jefferson curl form tutorial',
    'etirement piriforme figure 4':'piriformis stretch figure 4',
    'activation fessier prone':    'prone glute activation',
    'terminal leg extension':      'terminal knee extension VMO'
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

  /**
   * Construit l'URL YouTube optimale pour un exercice.
   * - Si exercice répertorié dans CURATED_QUERIES → query précise + chaîne adaptée au niveau
   * - Sinon → query générique + chaîne adaptée au niveau
   * Le filtre &sp=EgIYAQ%253D%253D restreint aux vidéos (pas Shorts/Channels).
   */
  function buildSmartVideoUrl(name, lv) {
    if (!name) return null;
    var key = _normalizeName(name);
    var baseQuery = CURATED_QUERIES[key];
    if (!baseQuery) {
      // Fallback : reprend le nom + suffixe générique pédagogique
      baseQuery = key + ' exercise correct form tutorial';
    }
    // Choix de chaîne selon le niveau
    var level = (typeof lv === 'number' && lv >= 1 && lv <= 3) ? lv : 1;
    var preferredChannel = CHANNELS[level][0];
    // On préfixe par la chaîne pour que ses vidéos remontent en 1er
    var fullQuery = preferredChannel + ' ' + baseQuery;
    var encoded = encodeURIComponent(fullQuery).replace(/%20/g, '+');
    return 'https://www.youtube.com/results?search_query=' + encoded + '&sp=EgIYAQ%253D%253D';
  }

  /**
   * Ouvre un modal player avec la vidéo intégrée OU un fallback élégant
   * vers les résultats YouTube curés (nouvel onglet).
   * NB : YouTube bloque l'embed des résultats de recherche via iframe.
   * On utilise un modal de "préparation" qui explique à l'utilisateur
   * et garantit qu'il atterrit sur la bonne vidéo.
   */
  function openVideoModal(url, exerciseName, level) {
    if (!url || typeof document === 'undefined') return;
    // Cleanup any existing modal
    var existing = document.getElementById('exo-video-modal');
    if (existing) existing.parentNode.removeChild(existing);

    var ov = document.createElement('div');
    ov.id = 'exo-video-modal';
    ov.style.cssText = 'position:fixed;inset:0;background:rgba(10,10,9,0.85);z-index:9999;'
      + 'display:flex;align-items:center;justify-content:center;padding:20px;'
      + 'animation:fadeIn 0.18s ease-out;';

    var sheet = document.createElement('div');
    sheet.style.cssText = 'background:var(--ivory,#FAF9F6);max-width:480px;width:100%;'
      + 'border:1px solid var(--line,#D8D8D0);border-radius:2px;padding:28px 24px;'
      + 'box-shadow:0 8px 40px rgba(0,0,0,0.3);font-family:"Helvetica Neue",Arial,sans-serif;';

    // Eyebrow
    var eyebrow = document.createElement('div');
    eyebrow.style.cssText = 'font-size:9px;letter-spacing:2.5px;text-transform:uppercase;'
      + 'color:var(--grey,#6B6B65);margin-bottom:12px;';
    var lvLabel = level === 3 ? 'Avancé' : (level === 2 ? 'Intermédiaire' : 'Débutant');
    var chanLabel = (CHANNELS[level || 1] || CHANNELS[1])[0];
    eyebrow.textContent = 'Vidéo guidée · ' + lvLabel + ' · ' + chanLabel;
    sheet.appendChild(eyebrow);

    // Title
    var title = document.createElement('div');
    title.style.cssText = 'font-family:Georgia,serif;font-size:20px;color:var(--black,#0A0A09);'
      + 'margin-bottom:10px;line-height:1.3;';
    title.textContent = exerciseName || 'Vidéo de démonstration';
    sheet.appendChild(title);

    // Body
    var body = document.createElement('p');
    body.style.cssText = 'font-size:13px;color:var(--grey,#6B6B65);line-height:1.6;margin:0 0 22px;';
    body.textContent = 'Ouverture d\'une page YouTube filtrée sur la chaîne « ' + chanLabel
      + ' » pour cet exercice. La 1re vidéo affichée est la plus pédagogique. '
      + 'Touchez-la pour la lancer, puis revenez à l\'app.';
    sheet.appendChild(body);

    // Actions
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
    openBtn.textContent = '▶ Ouvrir la vidéo';
    openBtn.addEventListener('click', function() {
      try { if (window.BLACKBOX) window.BLACKBOX.log('exo_video_open', { exo: exerciseName, lv: level }); } catch(e) {}
      setTimeout(function() {
        if (ov.parentNode) ov.parentNode.removeChild(ov);
      }, 200);
    });
    actions.appendChild(openBtn);

    var cancelBtn = document.createElement('button');
    cancelBtn.type = 'button';
    cancelBtn.style.cssText = 'padding:12px;background:transparent;color:var(--grey,#6B6B65);'
      + 'border:1px solid var(--line,#D8D8D0);border-radius:2px;cursor:pointer;'
      + 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:11px;letter-spacing:2px;'
      + 'text-transform:uppercase;min-height:44px;';
    cancelBtn.textContent = 'Annuler';
    cancelBtn.addEventListener('click', function() {
      if (ov.parentNode) ov.parentNode.removeChild(ov);
    });
    actions.appendChild(cancelBtn);

    sheet.appendChild(actions);
    ov.appendChild(sheet);
    ov.addEventListener('click', function(e) {
      if (e.target === ov) {
        if (ov.parentNode) ov.parentNode.removeChild(ov);
      }
    });
    document.body.appendChild(ov);
  }

  // ─── Exposition globale ───
  window.EXERCISE_VIDEOS = {
    buildSmartVideoUrl: buildSmartVideoUrl,
    openVideoModal: openVideoModal,
    _CURATED_QUERIES: CURATED_QUERIES,
    _CHANNELS: CHANNELS
  };

  // Override de getExerciseVideoUrl pour l'utiliser dans tous les rendus existants
  // (compatibilité totale avec le code historique app-sport.js)
  var _legacyGetUrl = window.getExerciseVideoUrl;
  window.getExerciseVideoUrl = function(name, lv) {
    var smart = buildSmartVideoUrl(name, lv);
    if (smart) return smart;
    if (typeof _legacyGetUrl === 'function') return _legacyGetUrl(name);
    return null;
  };
})();
