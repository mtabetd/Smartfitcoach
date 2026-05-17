/**
 * SmartFitCoach — Proprietary Software
 * Copyright (c) 2024-2026 SmartFitCoach. All rights reserved.
 */
/* ============================================================
   EXERCISE-VIDEOS.JS — Stratégie vidéo de confiance v5.5

   Architecture (2026-05) :
   • URLs filtrées PAR NOM DE CHAÎNE dans la recherche :
       https://www.youtube.com/results?search_query=AthleanX+dips+form&sp=EgIYAQ
     → filtre vidéos uniquement (sp=EgIYAQ exclut Shorts, playlists, chaînes).
     → nom de canal dans la query → premier résultat = vidéo de ce canal.
     → fiable sur mobile, desktop, iOS, Android, toutes régions.

   Pourquoi PAS @handle/search?query= :
     → instable sur mobile : YouTube redirige parfois vers la homepage.
     → résultats non garantis selon la région/session.

   Canaux par niveau + langue (voir TRUSTED_VIDEO_SOURCES) :
   - Débutant FR  → Tibo InShape  (8.7M, pédagogue FR)
   - Débutant EN  → AthleanX     (14M, Jeff Cavaliere)
   - Inter        → AthleanX     (technique + science)
   - Avancé       → Jeff Nippard (peer-reviewed, hypertrophie)
   - CrossFit     → CrossFit     (officiel, gymnique/oly)

   Résolution en 4 niveaux (voir _resolveKey) :
   1. EXACT   — clé directe dans CURATED_QUERIES / CF_QUERIES
   2. ALIAS   — abréviation/variante dans EXERCISE_ALIASES
   3. PARTIAL — match partiel sur les premiers tokens
   4. FALLBACK — recherche générale + filtre vidéos YouTube

   Isolation YouTube : _buildChannelUrl / _buildFallbackUrl
   → changer ces 2 fonctions suffit si YouTube migre son format.
   ============================================================ */
(function() {
  'use strict';

  // ─── Isolation format URL YouTube ─────────────────────────────────────────
  // Point unique de changement si YouTube modifie sa structure d'URL.
  //
  // _buildChannelUrl : recherche filtrée vidéos UNIQUEMENT, nom de canal en tête de query.
  //   → sp=EgIYAQ exclut Shorts, playlists et pages de chaînes.
  //   → "AthleanX dips form tutorial" → premier résultat = vidéo AthleanX.
  //   → Fiable mobile/desktop/iOS/Android, toutes régions.
  //   channelName = nom d'affichage ("AthleanX", "Tibo InShape", "Jeff Nippard", "CrossFit")
  //
  //   sp=EgIYAQ%3D%3D = YouTube Videos filter (exclut playlists, pages de chaînes).
  //   ⚠ Shorts : NE PEUVENT PAS être exclus via sp (YouTube les classe "type=Video").
  //   Anti-Shorts fallback : queries ≥4 mots pédagogiques → Shorts ne remontent pas.
  //
  //   IMPORTANT : utiliser %3D%3D (simple-encodé), PAS %253D%253D (double-encodé).
  //   Double-encodé = YouTube reçoit EgIYAQ%3D%3D (invalide) → filtre ignoré.
  function _buildChannelUrl(channelName, query) {
    return 'https://www.youtube.com/results?search_query='
      + encodeURIComponent(channelName + ' ' + query)
      + '&sp=EgIYAQ%3D%3D';
  }
  // _buildFallbackUrl : recherche générale sans canal — utilisée quand l'exercice est inconnu.
  function _buildFallbackUrl(query) {
    return 'https://www.youtube.com/results?search_query='
      + encodeURIComponent(query) + '&sp=EgIYAQ%3D%3D';
  }

  // ─── Niveaux de confiance ──────────────────────────────────────────────────
  var CONF = {
    DIRECT:   5,  // URL directe watch?v= ou shorts/ — expérience premium
    EXACT:    4,  // Clé directe dans CURATED_QUERIES — haute qualité
    ALIAS:    3,  // Alias/abréviation → clé curatée — bonne qualité
    PARTIAL:  2,  // Match partiel sur tokens — qualité acceptable
    FALLBACK: 1   // Recherche générale YouTube + filtre vidéo — dernier recours
  };

  // ─── Registre des sources de confiance ────────────────────────────────────
  // Extensible : ajouter une entrée ici suffit pour supporter un nouveau canal.
  var TRUSTED_VIDEO_SOURCES = {
    fr_beginner: {
      handle:         'TiboInShape',
      name:           'Tibo InShape',
      locale:         'fr',
      levels:         [1],
      qualityScore:   9,
      educationScore: 9,
      stabilityScore: 9,
      specialties:    ['musculation', 'nutrition', 'débutants'],
      fallbackPriority: 1
    },
    muscu_inter: {
      handle:         'athleanx',
      name:           'AthleanX',
      locale:         'any',
      levels:         [1, 2],
      qualityScore:   10,
      educationScore: 10,
      stabilityScore: 10,
      specialties:    ['biomécanique', 'prévention blessures', 'force', 'muscle'],
      fallbackPriority: 2
    },
    muscu_advanced: {
      handle:         'JeffNippard',
      name:           'Jeff Nippard',
      locale:         'any',
      levels:         [3],
      qualityScore:   10,
      educationScore: 10,
      stabilityScore: 9,
      specialties:    ['hypertrophie', 'evidence-based', 'powerbuilding'],
      fallbackPriority: 3
    },
    crossfit_official: {
      handle:         'CrossFit',
      name:           'CrossFit',
      locale:         'any',
      levels:         [1, 2, 3],
      qualityScore:   9,
      educationScore: 9,
      stabilityScore: 10,
      specialties:    ['crossfit', 'haltérophilie olympique', 'gymnastique', 'hyrox'],
      fallbackPriority: 1
    }
  };

  // Métadonnées de version — utile pour audits et diagnostics
  var _META = {
    version:          '5.5',
    urlStrategy:      'direct-registry-first',     // watch?v= / shorts/ → channel-search fallback
    fallbackStrategy: 'channel-name-video-search', // results?search_query=CHANNEL+QUERY&sp=EgIYAQ
    exerciseCoverage: 338,                         // entrées CURATED_QUERIES
    cfCoverage:       86,                          // entrées CF_QUERIES
    directRegistry:   true,                        // DIRECT_VIDEO_REGISTRY actif
    directRegistrySize: 52,                        // API-validated, dédupliqués (audit 2026-05)
    auditDate:        '2026-05'
  };

  // Rétro-compat (ancienne forme CHANNEL_INFO, alias vers TRUSTED_VIDEO_SOURCES)
  var CHANNEL_INFO = {
    fr_beginner:  TRUSTED_VIDEO_SOURCES.fr_beginner,
    en_beginner:  TRUSTED_VIDEO_SOURCES.muscu_inter,
    intermediate: TRUSTED_VIDEO_SOURCES.muscu_inter,
    advanced:     TRUSTED_VIDEO_SOURCES.muscu_advanced,
    crossfit:     TRUSTED_VIDEO_SOURCES.crossfit_official,
    hyrox:        TRUSTED_VIDEO_SOURCES.crossfit_official
  };

  // Rétro-compat (ancienne forme, exposée en _CHANNELS)
  var CHANNELS = {
    1: ['Tibo InShape', 'Major Mouvement', 'Coach Wog'],
    2: ['AthleanX', 'Jeff Nippard', 'Renaissance Periodization'],
    3: ['Squat University', 'Jeff Nippard', 'Stronger By Science']
  };

  // ─── Registre vidéo direct ────────────────────────────────────────────────
  // Chaque entrée : URL directe youtube.com/watch?v=ID ou youtube.com/shorts/ID
  // verified: true  = ID testé et confirmé valide
  // verified: false = ID à vérifier sur YouTube avant production
  // null            = aucune vidéo directe disponible → rien n'est affiché
  //
  // Niveaux : 'fr_beginner' | 'en_any' | 'advanced' | 'cf'
  // Résolution : fr_beginner (lv=1, FR) → en_any (lv=1-2, EN) → advanced (lv=3) → cf (CrossFit)
  //
  // ⚠ IMPORTANT POUR LES CONTRIBUTEURS :
  //   1. Tester chaque URL avant de passer verified:true
  //   2. Préférer les Shorts (15-60s) quand l'exercice est clairement démontré
  //   3. Vérifier : exercice exact, technique propre, source fiable, pas de compilation
  //   4. Ne jamais ajouter un ID non testé avec verified:true
  //
  // Comment trouver une bonne vidéo :
  //   → youtube.com/results?search_query=TiboInShape+développé+couché+short&sp=EgIYAQ%3D%3D
  //   → youtube.com/results?search_query=AthleanX+bench+press+short&sp=EgIYAQ%3D%3D
  //   → CrossFit Movement Standards playlist : youtube.com/@CrossFit/playlists
  var DIRECT_VIDEO_REGISTRY = {
    'developpe couche': {
      fr_beginner: { url: 'https://www.youtube.com/shorts/nBJky6rLbjw', verified: false, source: 'TiboInShape', score: 60 },
      en_any: { url: 'https://www.youtube.com/shorts/s-T3E6654A8', verified: false, source: 'athleanx', score: 55 },
    },
    'developpe couche haltere unilateral': {
      fr_beginner: { url: 'https://www.youtube.com/shorts/rgPDTr46RNE', verified: false, source: 'TiboInShape', score: 42 },
    },
    'developpe incline': {
      fr_beginner: { url: 'https://www.youtube.com/shorts/wj_zXKF7Mh0', verified: false, source: 'TiboInShape', score: 45 },
      en_any: { url: 'https://www.youtube.com/shorts/PU8_czOohQs', verified: false, source: 'athleanx', score: 60 },
    },
    'developpe decline': {
      fr_beginner: { url: 'https://www.youtube.com/shorts/pX3tD7APce0', verified: false, source: 'TiboInShape', score: 47 },
    },
    'chest press machine': {
      fr_beginner: { url: 'https://www.youtube.com/shorts/MUa0U36oz3s', verified: false, source: 'TiboInShape', score: 50 },
    },
    'pompes classiques': {
      fr_beginner: { url: 'https://www.youtube.com/shorts/kYPPcb3ucCE', verified: false, source: 'TiboInShape', score: 52 },
      en_any: { url: 'https://www.youtube.com/shorts/IlWN4SNqaEM', verified: false, source: 'athleanx', score: 50 },
    },
    'pompes diamant': {
      fr_beginner: { url: 'https://www.youtube.com/shorts/Wt78IMVu4sY', verified: false, source: 'TiboInShape', score: 45 },
    },
    'diamond push up': {
      fr_beginner: { url: 'https://www.youtube.com/shorts/3J8QPfZ3L0Q', verified: false, source: 'TiboInShape', score: 50 },
      en_any: { url: 'https://www.youtube.com/shorts/At8PRTDDhrU', verified: false, source: 'athleanx', score: 65 },
    },
    'snatch': {
      cf: { url: 'https://www.youtube.com/shorts/GhxhiehJcQY', verified: false, source: 'CrossFit', score: 85 },
    },
    'power snatch': {
      cf: { url: 'https://www.youtube.com/shorts/TL8SMp7RdXQ', verified: false, source: 'CrossFit', score: 70 },
    },
    'hang snatch': {
      cf: { url: 'https://www.youtube.com/shorts/-mLzQdVAwlw', verified: false, source: 'CrossFit', score: 85 },
    },
    'hang power snatch': {
      cf: { url: 'https://www.youtube.com/shorts/-mLzQdVAwlw', verified: false, source: 'CrossFit', score: 85 },
    },
    'clean and jerk': {
      cf: { url: 'https://www.youtube.com/shorts/PjY1rH4_MOA', verified: false, source: 'CrossFit', score: 70 },
    },
    'clean jerk': {
      cf: { url: 'https://www.youtube.com/shorts/PjY1rH4_MOA', verified: false, source: 'CrossFit', score: 70 },
    },
    'power clean': {
      cf: { url: 'https://www.youtube.com/shorts/Sk1vhXhHO_A', verified: false, source: 'CrossFit', score: 75 },
    },
    'hang power clean': {
      cf: { url: 'https://www.youtube.com/shorts/DaKC_BEN5bk', verified: false, source: 'CrossFit', score: 72 },
    },
    'hang power cleans': {
      cf: { url: 'https://www.youtube.com/shorts/DaKC_BEN5bk', verified: false, source: 'CrossFit', score: 58 },
    },
    'hang clean': {
      cf: { url: 'https://www.youtube.com/shorts/DaKC_BEN5bk', verified: false, source: 'CrossFit', score: 85 },
    },
    'hang cleans': {
      cf: { url: 'https://www.youtube.com/shorts/DaKC_BEN5bk', verified: false, source: 'CrossFit', score: 65 },
    },
    'hang squat clean': {
      cf: { url: 'https://www.youtube.com/shorts/DaKC_BEN5bk', verified: false, source: 'CrossFit', score: 72 },
    },
    'hang squat cleans': {
      cf: { url: 'https://www.youtube.com/shorts/DaKC_BEN5bk', verified: false, source: 'CrossFit', score: 58 },
    },
    'clean': {
      cf: { url: 'https://www.youtube.com/shorts/KwYJTpQ_x5A', verified: false, source: 'CrossFit', score: 70 },
    },
    'split jerk': {
      cf: null,
    },
    'push jerk': {
      cf: { url: 'https://www.youtube.com/shorts/v_0E1udYSnQ', verified: false, source: 'CrossFit', score: 75 },
    },
    'push press': {
      cf: { url: 'https://www.youtube.com/shorts/0tOcLSIT3u4', verified: false, source: 'CrossFit', score: 82 },
    },
    'jerk': {
      cf: { url: 'https://www.youtube.com/shorts/GqAEuwXQXRU', verified: false, source: 'CrossFit', score: 75 },
    },
    'clean pull speed': {
      cf: { url: 'https://www.youtube.com/shorts/fNi-bG0shwE', verified: false, source: 'CrossFit', score: 68 },
    },
    'overhead squat': {
      cf: { url: 'https://www.youtube.com/shorts/i3VMBdEBB7c', verified: false, source: 'CrossFit', score: 80 },
    },
    'dumbbell snatch': {
      cf: { url: 'https://www.youtube.com/shorts/JXNPBnzBCt0', verified: false, source: 'CrossFit', score: 80 },
    },
    'muscle up': {
      cf: { url: 'https://www.youtube.com/watch?v=kQVOD7wPIns', verified: false, source: 'CrossFit', score: 70 },
    },
    'muscle up anneau': {
      cf: null,
    },
    'muscle up barre': {
      cf: { url: 'https://www.youtube.com/shorts/o69WaY_7k2c', verified: false, source: 'CrossFit', score: 60 },
    },
    'bar muscle up': {
      cf: { url: 'https://www.youtube.com/shorts/o69WaY_7k2c', verified: false, source: 'CrossFit', score: 80 },
    },
    'bar muscle ups': {
      cf: { url: 'https://www.youtube.com/shorts/o69WaY_7k2c', verified: false, source: 'CrossFit', score: 67 },
    },
    'kipping pull up': {
      cf: { url: 'https://www.youtube.com/shorts/bMnS7IO5a5M', verified: false, source: 'CrossFit', score: 80 },
    },
    'kipping pull up speed': {
      cf: { url: 'https://www.youtube.com/shorts/bMnS7IO5a5M', verified: false, source: 'CrossFit', score: 67 },
    },
    'chest to bar': {
      cf: { url: 'https://www.youtube.com/shorts/AyPTCEXTjOo', verified: false, source: 'CrossFit', score: 80 },
    },
    'chest to bar pull ups': {
      cf: { url: 'https://www.youtube.com/shorts/AyPTCEXTjOo', verified: false, source: 'CrossFit', score: 70 },
    },
    'c2b': {
      cf: { url: 'https://www.youtube.com/shorts/AyPTCEXTjOo', verified: false, source: 'CrossFit', score: 40 },
    },
    'c2b pull ups': {
      cf: { url: 'https://www.youtube.com/watch?v=Mk47nndUMHw', verified: false, source: 'CrossFit', score: 57 },
    },
    'toes to bar': {
      cf: { url: 'https://www.youtube.com/shorts/xX9Hzi7Onnw', verified: false, source: 'CrossFit', score: 80 },
    },
    'handstand walk': {
      cf: { url: 'https://www.youtube.com/shorts/I5p2VVDupq8', verified: false, source: 'CrossFit', score: 80 },
    },
    'hs walk': {
      cf: { url: 'https://www.youtube.com/shorts/I5p2VVDupq8', verified: false, source: 'CrossFit', score: 80 },
    },
    'handstand push up': {
      cf: { url: 'https://www.youtube.com/shorts/0wDEO6shVjc', verified: false, source: 'CrossFit', score: 80 },
    },
    'handstand push ups': {
      cf: { url: 'https://www.youtube.com/shorts/0wDEO6shVjc', verified: false, source: 'CrossFit', score: 67 },
    },
    'hspu': {
      cf: { url: 'https://www.youtube.com/shorts/9wIkPCS4Mbo', verified: false, source: 'CrossFit', score: 40 },
    },
    'ring dip': {
      cf: { url: 'https://www.youtube.com/shorts/Vt0lO4jpIDo', verified: false, source: 'CrossFit', score: 80 },
    },
    'rope climb': {
      cf: { url: 'https://www.youtube.com/watch?v=G_3kJy-_CiA', verified: false, source: 'CrossFit', score: 82 },
    },
    'l sit': {
      cf: { url: 'https://www.youtube.com/shorts/DemH-mw1O9I', verified: false, source: 'CrossFit', score: 80 },
    },
    'pistol squat': {
      cf: { url: 'https://www.youtube.com/shorts/keSzg7MaoVQ', verified: false, source: 'CrossFit', score: 60 },
    },
    'ring row': {
      cf: { url: 'https://www.youtube.com/shorts/xhlReCpAE9k', verified: false, source: 'CrossFit', score: 80 },
    },
    'wall walk': {
      cf: { url: 'https://www.youtube.com/shorts/2TnX8j29tRY', verified: false, source: 'CrossFit', score: 80 },
    },
    'air squat': {
      cf: { url: 'https://www.youtube.com/shorts/a_fb6Kz7FQg', verified: false, source: 'CrossFit', score: 85 },
    },
    'strict pull up': {
      cf: { url: 'https://www.youtube.com/shorts/HRV5YKKaeVw', verified: false, source: 'CrossFit', score: 80 },
    },
    'strict handstand push up': {
      cf: { url: 'https://www.youtube.com/shorts/0wDEO6shVjc', verified: false, source: 'CrossFit', score: 80 },
    },
    'thruster': {
      cf: { url: 'https://www.youtube.com/shorts/88w6SthC-58', verified: false, source: 'CrossFit', score: 80 },
    },
    'dumbbell thruster': {
      cf: { url: 'https://www.youtube.com/shorts/u3wKkZjE8QM', verified: false, source: 'CrossFit', score: 70 },
    },
    'wall ball': {
      cf: { url: 'https://www.youtube.com/shorts/fpUD0mcFp_0', verified: false, source: 'CrossFit', score: 80 },
    },
  };

  // Résoudre un niveau utilisateur vers une clé de registre
  function _registryLevelKey(lv, isCF) {
    if (isCF) return 'cf';
    var isEN = window.isEnglish && window.isEnglish();
    var level = (typeof lv === 'number' && lv >= 1 && lv <= 3) ? lv : 1;
    if (level === 1 && !isEN) return 'fr_beginner';
    if (level === 3) return 'advanced';
    return 'en_any';
  }

  // Résolution directe : retourne une URL directe ou null
  function _resolveDirectVideo(name, lv, isCF) {
    if (!name) return null;
    var key = _normalizeName(name);
    var entry = DIRECT_VIDEO_REGISTRY[key];
    if (!entry) {
      // Essai via alias
      var ak = isCF
        ? (CF_ALIASES[key] && DIRECT_VIDEO_REGISTRY[CF_ALIASES[key]])
        : (EXERCISE_ALIASES[key] && DIRECT_VIDEO_REGISTRY[EXERCISE_ALIASES[key]]);
      if (!ak) return null;
      entry = ak;
    }
    var levelKey = _registryLevelKey(lv, isCF);
    var video = entry[levelKey];
    // Fallback de niveau : advanced → en_any → fr_beginner
    if (!video && levelKey === 'advanced') video = entry['en_any'];
    if (!video && levelKey === 'fr_beginner') video = entry['en_any'];
    if (!video || !video.url) return null;
    return video.url;
  }

  // ─── Requêtes curatées EN : nom_normalisé → query précise ─────────────────
  // Clés = _normalizeName(nom exact de l'exercice dans muscu-programs.js).
  // Couverture complète validée sur 236 exercices (audit 2026-05).
  var CURATED_QUERIES = {
    // ── Pectoraux ─────────────────────────────────────────────────────────
    'developpe couche':                        'barbell bench press proper form technique tutorial',
    'developpe halteres couche':               'dumbbell bench press proper form technique tutorial',
    'developpe couche haltere unilateral':     'single arm dumbbell press proper form tutorial',
    'developpe incline':                       'incline bench press proper form technique tutorial',
    'developpe incline barre':                 'incline barbell bench press proper form technique tutorial',
    'developpe incline halteres':              'incline dumbbell press proper form technique tutorial',
    'developpe decline':                       'decline bench press proper form technique tutorial',
    'developpe decline barre':                 'decline barbell bench press proper form tutorial',
    'close grip bench press':                  'close grip bench press tricep proper form tutorial',
    'developpe couche prise serree':           'close grip barbell bench press technique tutorial',
    'chest press machine':                     'chest press machine proper form technique tutorial',
    'chest press unilateral cable':            'single arm cable chest press proper form tutorial',
    'pompes classiques':                       'push up proper form technique tutorial',
    'pompes diamant':                          'diamond push up proper form technique tutorial',
    'diamond push up':                         'diamond push up close grip proper form tutorial',
    'pompes declinees':                        'decline push up proper form technique tutorial',
    'pompes plyometriques':                    'plyometric push up proper form tutorial',
    'pompes archer':                           'archer push up proper form tutorial',
    'pompes prise large':                      'wide grip push up proper form tutorial',
    'dips':                                    'chest dips proper form technique tutorial',
    'dips lestes':                             'weighted chest dips proper form tutorial',
    'dips prise large':                        'wide grip chest dips proper form tutorial',
    'dips triceps banc':                       'bench dips tricep proper form technique tutorial',
    'bench dips lestes':                       'weighted bench dips tricep proper form tutorial',
    'ecartes haltere':                         'dumbbell fly chest proper form technique tutorial',
    'ecarte halteres couche':                  'dumbbell chest fly proper form technique tutorial',
    'ecartes haltere incline':                 'incline dumbbell fly proper form tutorial',
    'pec deck butterfly':                      'pec deck machine form tutorial',
    'pec deck':                                'pec deck machine form tutorial',
    'cable crossover':                         'cable crossover fly chest tutorial',
    'cable crossover bas':                     'low cable crossover chest tutorial',
    'cable crossover haut':                    'high cable crossover chest tutorial',
    'ecart cable croise':                      'cable crossover form tutorial',
    'ecarte cable poulie basse crossover haut':'low cable fly upper chest tutorial',
    'ecarte cable poulie haute':               'high cable fly upper chest tutorial',
    'spoto press':                             'spoto press bench press technique tutorial',
    'floor press':                             'floor press barbell tutorial',
    'landmine press':                          'landmine press chest form tutorial',

    // ── Dos ───────────────────────────────────────────────────────────────
    'tractions':                               'pull up proper form technique tutorial',
    'tractions pronation':                     'overhand pull up proper form technique tutorial',
    'traction prise neutre':                   'neutral grip pull up proper form tutorial',
    'traction prise large':                    'wide grip pull up proper form tutorial',
    'traction prise serree':                   'close grip chin up proper form tutorial',
    'traction prise tres large':               'wide overhand pull up proper form tutorial',
    'traction lestee':                         'weighted pull up proper form technique tutorial',
    'traction elastique assistee':             'band assisted pull up proper form tutorial',
    'chin ups':                                'chin up supination proper form technique tutorial',
    'chin ups traction supination':            'chin up bicep supination proper form tutorial',
    'rowing barre':                            'bent over barbell row proper form technique tutorial',
    'rowing pendlay':                          'pendlay row proper form technique tutorial',
    'pendlay row':                             'pendlay row proper form technique tutorial',
    'rowing pendlay prise large':              'wide grip pendlay row proper form tutorial',
    'rowing haltere':                          'one arm dumbbell row proper form technique tutorial',
    'rowing haltere unilateral':               'single arm dumbbell row proper form tutorial',
    'rowing haltere prise neutre':             'neutral grip dumbbell row proper form tutorial',
    'rowing assis cable':                      'seated cable row proper form technique tutorial',
    'rowing assis cable prise large':          'wide grip seated cable row proper form tutorial',
    'rowing buste penche prise large':         'wide grip bent over barbell row proper form tutorial',
    'rowing buste penche cable prise neutre':  'bent over cable row neutral grip proper form tutorial',
    'rowing debout halteres':                  'dumbbell upright row proper form tutorial',
    'rowing prise large debout cable':         'wide grip cable upright row proper form tutorial',
    'rowing machine unilateral':               'unilateral cable row proper form tutorial',
    't bar row':                               't bar row proper form technique tutorial',
    't bar row machine':                       't bar row machine proper form tutorial',
    'yates row':                               'yates row underhand barbell proper form tutorial',
    'chest supported row':                     'chest supported row proper form technique tutorial',
    'seal row':                                'seal row proper form technique tutorial',
    'tirage vertical poulie':                  'lat pulldown proper form technique tutorial',
    'tirage poulie haute':                     'lat pulldown proper form technique tutorial',
    'tirage vertical prise large':             'wide grip lat pulldown proper form tutorial',
    'tirage vertical prise neutre v bar':      'v bar lat pulldown proper form tutorial',
    'tirage horizontal':                       'seated cable row proper form technique tutorial',
    'tirage horizontal cable':                 'seated cable row proper form technique tutorial',
    'tirage nuque':                            'behind neck lat pulldown proper form tutorial',
    'tirage menton':                           'barbell upright row proper form tutorial',
    'tirage menton barre':                     'barbell upright row proper form technique tutorial',
    'tirage menton cable':                     'cable upright row proper form tutorial',
    'soulever de terre':                       'barbell deadlift proper form technique tutorial',
    'deadlift':                                'barbell deadlift proper form technique tutorial',
    'deadlift roumain barre':                  'romanian deadlift barbell proper form technique tutorial',
    'souleve de terre conventionnel':          'conventional barbell deadlift proper form technique tutorial',
    'souleve de terre roumain':                'romanian deadlift barbell proper form technique tutorial',
    'sumo deadlift':                           'sumo deadlift barbell proper form technique tutorial',
    'romanian deadlift':                       'romanian deadlift proper form technique tutorial',
    'romanian deadlift rdl':                   'romanian deadlift proper form technique tutorial',
    'romanian deadlift halteres':              'dumbbell romanian deadlift proper form technique tutorial',
    'rdl':                                     'romanian deadlift proper form technique tutorial',
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
    'developpe militaire':                     'barbell overhead press proper form technique tutorial',
    'overhead press':                          'barbell overhead press proper form technique tutorial',
    'developpe militaire barre':               'barbell overhead press proper form technique tutorial',
    'developpe militaire machine':             'machine shoulder press proper form technique tutorial',
    'developpe haltere assis':                 'seated dumbbell shoulder press proper form tutorial',
    'developpe halteres assis':                'seated dumbbell shoulder press proper form tutorial',
    'developpe halteres debout':               'standing dumbbell overhead press proper form tutorial',
    'developpe arnold':                        'arnold press dumbbell proper form technique tutorial',
    'arnold press':                            'arnold press dumbbell proper form technique tutorial',
    'elevations laterales':                    'dumbbell lateral raise proper form technique tutorial',
    'elevations laterales cable':              'cable lateral raise proper form technique tutorial',
    'elevations laterales elastique':          'band lateral raise shoulder proper form tutorial',
    'elevations frontales':                    'dumbbell front raise proper form technique tutorial',
    'elevations frontales cable':              'cable front raise shoulder proper form tutorial',
    'elevation frontale cable':                'cable front raise shoulder proper form tutorial',
    'oiseau':                                  'rear delt fly dumbbell proper form tutorial',
    'oiseau halteres rear delt':               'rear delt fly dumbbell proper form technique tutorial',
    'oiseau halteres':                         'rear delt fly dumbbell proper form technique tutorial',
    'oiseau poulie cable':                     'cable rear delt fly proper form technique tutorial',
    'lu raise':                                'lu raise shoulder tutorial',
    'developpe nuque':                         'behind neck press tutorial',
    'developpe militaire barre nuque':         'behind neck press tutorial',
    'upright row cable':                       'cable upright row form tutorial',
    'rotation externe haltere coude appuye':   'seated external rotation dumbbell tutorial',
    'scarecrow halteres':                      'scarecrow shoulder stability tutorial',
    'push press barre':                        'barbell push press form tutorial',

    // ── Biceps ────────────────────────────────────────────────────────────
    'curl barre':                              'barbell bicep curl proper form technique tutorial',
    'curl barre droite':                       'straight bar bicep curl proper form tutorial',
    'curl ez barre':                           'ez bar bicep curl proper form technique tutorial',
    'curl haltere':                            'dumbbell bicep curl proper form technique tutorial',
    'curl halteres alterne':                   'alternating dumbbell bicep curl proper form tutorial',
    'curl marteau':                            'dumbbell hammer curl proper form technique tutorial',
    'curl marteau cable':                      'cable hammer curl proper form tutorial',
    'curl incline halteres':                   'incline dumbbell bicep curl proper form tutorial',
    'curl spider araignee':                    'spider curl proper form technique tutorial',
    'curl pupitre':                            'preacher curl proper form technique tutorial',
    'curl pupitre scott curl':                 'preacher curl scott curl proper form tutorial',
    'curl pupitre haltere unilateral':         'single arm preacher curl dumbbell proper form tutorial',
    'curl concentre':                          'concentration curl proper form technique tutorial',
    'curl barre supination 3 4 amplitude':     'partial range bicep curl peak contraction tutorial',
    'curl 21s':                                'barbell 21s bicep curl technique tutorial',
    'bayesian curl cable':                     'bayesian cable curl long head technique tutorial',
    'curl cable basse poulie':                 'low cable bicep curl proper form tutorial',
    'reverse curl cable':                      'cable reverse curl brachialis proper form tutorial',
    'curl prise neutre barre ez':              'neutral grip ez bar curl proper form tutorial',
    'drag curl barre':                         'drag curl barbell bicep long head tutorial',
    'curl incline cable unilateral':           'incline cable curl proper form tutorial',
    'zottman curl':                            'zottman curl forearm bicep proper form tutorial',
    'curl cable a 90 peak':                    'cable curl peak contraction proper form tutorial',

    // ── Triceps ───────────────────────────────────────────────────────────
    'extension triceps poulie':                'cable tricep pushdown proper form technique tutorial',
    'pushdown cable barre':                    'cable bar tricep pushdown proper form tutorial',
    'pushdown cable corde':                    'rope cable tricep pushdown proper form technique tutorial',
    'overhead extension cable':                'cable overhead tricep extension proper form tutorial',
    'extension triceps barre':                 'skull crusher barbell tricep proper form technique tutorial',
    'skull crushers ez':                       'ez bar skull crusher tricep proper form technique tutorial',
    'extension barre couche':                  'barbell skull crusher lying tricep proper form tutorial',
    'extension haltere tete':                  'overhead dumbbell tricep extension proper form tutorial',
    'extension triceps machine':               'tricep machine extension proper form technique tutorial',
    'extension triceps bras tendu haltere':    'overhead dumbbell tricep extension proper form tutorial',
    'overhead extension halteres bilateral':   'bilateral overhead dumbbell tricep extension proper form tutorial',
    'jm press barre':                          'jm press barbell tricep proper form tutorial',
    'jm press ez':                             'jm press ez bar tricep proper form tutorial',
    'dips barres paralleles lest':             'weighted parallel bar dips tricep proper form tutorial',
    'kickback triceps':                        'dumbbell tricep kickback proper form technique tutorial',
    'kick back haltere':                       'dumbbell tricep kickback proper form tutorial',
    'kick back cable':                         'cable tricep kickback proper form tutorial',
    'extension triceps elastique debout':      'resistance band tricep pushdown proper form tutorial',
    'tate press':                              'tate press tricep proper form tutorial',

    // ── Quadriceps / Jambes ───────────────────────────────────────────────
    'squat':                                   'barbell back squat proper form technique tutorial',
    'squat barre':                             'barbell back squat proper form technique tutorial',
    'back squat':                              'barbell back squat proper form technique tutorial',
    'squat poids de corps':                    'bodyweight squat proper form technique tutorial',
    'squat sumo':                              'sumo squat proper form technique tutorial',
    'sumo squat haltere':                      'sumo squat dumbbell proper form tutorial',
    'goblet squat':                            'goblet squat proper form technique tutorial',
    'squat gobelet kettlebell':                'kettlebell goblet squat proper form tutorial',
    'front squat':                             'front squat proper form technique tutorial',
    'front squat barre':                       'barbell front squat proper form technique tutorial',
    'sissy squat':                             'sissy squat proper form technique tutorial',
    'squat zercher':                           'zercher squat proper form technique tutorial',
    'squat saute':                             'jump squat proper form plyometric tutorial',
    'hack squat machine':                      'hack squat machine proper form technique tutorial',
    'split squat bulgare':                     'bulgarian split squat proper form technique tutorial',
    'fente bulgare halteres':                  'bulgarian split squat dumbbell proper form tutorial',
    'fentes avant':                            'forward lunge proper form technique tutorial',
    'fente avant halteres':                    'dumbbell forward lunge proper form tutorial',
    'fente avant barre':                       'barbell lunge proper form tutorial',
    'fentes marchees':                         'walking lunge proper form technique tutorial',
    'fente avant barre marchee':               'barbell walking lunge proper form tutorial',
    'fentes laterales':                        'side lunge proper form technique tutorial',
    'fente laterale halteres':                 'lateral lunge dumbbell proper form tutorial',
    'fentes arriere':                          'reverse lunge proper form technique tutorial',
    'fente reverse halteres':                  'reverse lunge dumbbell proper form tutorial',
    'leg press':                               'leg press machine proper form technique tutorial',
    'leg press pied haut':                     'high foot leg press glutes proper form tutorial',
    'leg press unilateral':                    'single leg press proper form tutorial',
    'leg press 15 rep':                        'leg press 1.5 rep technique proper form tutorial',
    'leg extension':                           'leg extension machine proper form technique tutorial',
    'extension jambes machine':                'leg extension machine proper form technique tutorial',
    'step up halteres':                        'dumbbell step up proper form technique tutorial',
    'step up genou haut lestes':               'weighted step up high knee proper form tutorial',
    'wall sit isometrique':                    'wall sit isometric quad hold proper form tutorial',

    // ── Ischio-jambiers ───────────────────────────────────────────────────
    'leg curl':                                'lying leg curl machine proper form technique tutorial',
    'leg curl couche':                         'lying leg curl machine proper form technique tutorial',
    'leg curl allonge':                        'lying leg curl machine proper form tutorial',
    'leg curl assis':                          'seated leg curl machine proper form tutorial',
    'leg curl assis unilateral':               'seated single leg curl proper form tutorial',
    'leg curl debout cable':                   'standing cable leg curl proper form tutorial',
    'leg curl debout unilateral cable':        'standing unilateral cable leg curl proper form tutorial',
    'leg curl balle suisse':                   'swiss ball hamstring curl proper form tutorial',
    'leg curl elastique couche':               'prone hamstring curl resistance band proper form tutorial',
    'glute ham raise':                         'glute ham raise proper form technique tutorial',
    'cable pull through':                      'cable pull through posterior chain proper form tutorial',
    'nordic curl':                             'nordic hamstring curl proper form technique tutorial',
    'sliding leg curl':                        'sliding hamstring curl proper form tutorial',
    'hamstring walkout':                       'hamstring walkout isometric proper form tutorial',
    'hip extension 45 ischio focus':           '45 degree back extension hamstring focus proper form tutorial',
    'hyperextension ischios focus':            'back extension hamstring focus proper form tutorial',

    // ── Fessiers ──────────────────────────────────────────────────────────
    'hip thrust':                              'barbell hip thrust proper form technique tutorial',
    'hip thrust barre':                        'barbell hip thrust proper form technique tutorial',
    'hip thrust haltere':                      'dumbbell hip thrust proper form tutorial',
    'hip thrust unilateral':                   'single leg hip thrust proper form tutorial',
    'hip thrust unilateral leger':             'single leg hip thrust proper form tutorial',
    'hip thrust pieds sureleves':              'elevated barbell hip thrust proper form tutorial',
    'glute bridge':                            'glute bridge proper form technique tutorial',
    'glute bridge bilateral':                  'bilateral glute bridge proper form tutorial',
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
    'mollets debout':                          'standing calf raise proper form technique tutorial',
    'mollets debout halteres':                 'standing dumbbell calf raise proper form tutorial',
    'mollets debout machine':                  'standing calf raise machine proper form tutorial',
    'mollets barre debout':                    'standing barbell calf raise proper form tutorial',
    'mollets debout sur step barre':           'barbell calf raise step proper form tutorial',
    'mollets assis':                           'seated calf raise proper form technique tutorial',
    'mollets assis machine':                   'seated calf raise machine proper form tutorial',
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
    'hyperextension reverse':                  'reverse hyperextension proper form tutorial',
    'kettlebell swing americain':              'american kettlebell swing overhead tutorial',
    'pallof press a genoux':                   'kneeling pallof press anti rotation tutorial',
    'back extension ghd lestee':               'weighted GHD back extension tutorial',
    'stiff leg deadlift halteres':             'stiff leg dumbbell deadlift tutorial',
    'rotation du tronc cable':                 'cable woodchop trunk rotation tutorial',
    'souleve de terre hex bar':                'trap bar hex bar deadlift tutorial',

    // ── Abdos ─────────────────────────────────────────────────────────────
    'crunch':                                  'crunch proper form technique tutorial',
    'crunch classique':                        'crunch proper form technique tutorial',
    'crunch incline':                          'incline crunch proper form tutorial',
    'oblique crunch au sol':                   'oblique crunch floor tutorial',
    'swiss ball crunch':                       'swiss ball crunch tutorial',
    'crunch decline lestee':                   'weighted decline crunch tutorial',
    'crunch cable poulie haute':               'cable crunch proper form technique tutorial',
    'cable reverse crunch':                    'cable reverse crunch lower abs tutorial',
    'ab crunch machine':                       'ab crunch machine tutorial',
    'planche':                                 'plank proper form technique tutorial',
    'gainage':                                 'plank proper form technique tutorial',
    'planche abdominale':                      'plank proper form technique tutorial',
    'planche ventrale prone plank':            'prone plank proper form technique tutorial',
    'planche abdominale dynamique':            'dynamic plank proper form tutorial',
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
    'burpees':                                 'burpee proper form technique tutorial',
    'jumping jacks':                           'jumping jacks form tutorial',
    'corde a sauter':                          'jump rope form tutorial',
    'sauts a la corde':                        'jump rope form tutorial',
    'high knees':                              'high knees form tutorial',
    'rameur':                                  'rowing machine proper form technique tutorial',
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

  // ─── Aliases muscu : abréviations / variantes → clé CURATED_QUERIES ─────
  // Permet aux futurs exercices d'hériter automatiquement d'une bonne vidéo
  // sans nécessiter d'entrée manuelle dans CURATED_QUERIES.
  //
  // RÈGLES CRITIQUES pour les contributeurs :
  // 1. Les clés ET valeurs doivent être en forme NORMALISÉE : minuscules,
  //    sans accents, SANS TRAIT D'UNION (hyphens → espaces via _normalizeName).
  //    Ex : 'pull ups' ✓   'pull-ups' ✗ (jamais atteint après normalisation)
  //         'developpé' ✗  'developpe' ✓
  // 2. N'ajoutez PAS une clé qui existe déjà dans CURATED_QUERIES — l'alias
  //    serait mort (EXACT match a la priorité sur ALIAS).
  // 3. La valeur doit être une clé valide dans CURATED_QUERIES.
  var EXERCISE_ALIASES = {
    // Pectoraux
    'bench':                   'developpe couche',
    'bench press':             'developpe couche',
    'bb bench':                'developpe couche',
    'bb bench press':          'developpe couche',
    'db press':                'developpe halteres couche',
    'dumbbell press':          'developpe halteres couche',
    'incline bench':           'developpe incline',
    'incline press':           'developpe incline',
    'incline dumbbell':        'developpe incline halteres',
    'decline bench':           'developpe decline',
    'cgbp':                    'close grip bench press',
    'close grip':              'close grip bench press',
    'push up':                 'pompes classiques',
    'push ups':                'pompes classiques',
    'pushup':                  'pompes classiques',
    'pushups':                 'pompes classiques',
    'pompes':                  'pompes classiques',
    'chest fly':               'ecarte halteres couche',
    'db fly':                  'ecarte halteres couche',
    'cable fly':               'cable crossover',
    'pec fly':                 'ecarte halteres couche',
    'butterfly':               'pec deck',
    // Dos
    'pull up':                 'tractions',
    'pull ups':                'tractions',
    'pullup':                  'tractions',
    'pullups':                 'tractions',
    'chin up':                 'chin ups',
    'barbell row':             'rowing barre',
    'bb row':                  'rowing barre',
    'bent over row':           'rowing barre',
    'db row':                  'rowing haltere',
    'dumbbell row':            'rowing haltere',
    'cable row':               'rowing assis cable',
    'seated row':              'rowing assis cable',
    'lat pulldown':            'tirage vertical poulie',
    'lat pull':                'tirage vertical poulie',
    'tirage poulie':           'tirage vertical poulie',
    'lat pull down':           'tirage vertical poulie',
    'dl':                      'deadlift',
    'sumo dl':                 'sumo deadlift',
    'stiff leg':               'romanian deadlift',
    'upright row':             'tirage menton',
    'shrug':                   'shrug barre',
    'db shrug':                'shrug halteres',
    // Épaules
    'ohp':                     'developpe militaire',
    'military press':          'developpe militaire',
    'shoulder press':          'developpe militaire',
    'seated press':            'developpe halteres assis',
    'db shoulder press':       'developpe halteres assis',
    'lateral raise':           'elevations laterales',
    'lat raise':               'elevations laterales',
    'side raise':              'elevations laterales',
    'side lateral':            'elevations laterales',
    'front raise':             'elevations frontales',
    'rear delt':               'oiseau halteres',
    'rear delt fly':           'oiseau halteres',
    'rear fly':                'oiseau halteres',
    // Biceps
    'barbell curl':            'curl barre',
    'bb curl':                 'curl barre',
    'ez curl':                 'curl ez barre',
    'ez bar curl':             'curl ez barre',
    'db curl':                 'curl haltere',
    'dumbbell curl':           'curl haltere',
    'hammer curl':             'curl marteau',
    'preacher curl':           'curl pupitre',
    'scott curl':              'curl pupitre',
    'concentration curl':      'curl concentre',
    'cable curl':              'curl cable basse poulie',
    // Triceps
    'tricep pushdown':         'extension triceps poulie',
    'rope pushdown':           'pushdown cable corde',
    'bar pushdown':            'pushdown cable barre',
    'skull crusher':           'extension triceps barre',
    'skull crushers':          'skull crushers ez',
    'skullcrusher':            'extension triceps barre',
    'overhead extension':      'overhead extension cable',
    'overhead tri':            'overhead extension cable',
    'tricep extension':        'extension triceps barre',
    'tri pushdown':            'extension triceps poulie',
    'kickback':                'kickback triceps',
    'tricep kickback':         'kickback triceps',
    // Jambes
    'lunge':                   'fentes avant',
    'lunges':                  'fentes avant',
    'walking lunge':           'fentes marchees',
    'walking lunges':          'fentes marchees',
    'split squat':             'split squat bulgare',
    'bulgarian':               'split squat bulgare',
    'bulgarian split':         'split squat bulgare',
    'bulgarian split squat':   'split squat bulgare',
    'lying leg curl':          'leg curl couche',
    'seated leg curl':         'leg curl assis',
    // Fessiers
    'cable kickback':          'kickback cable fessier',
    'glute kickback':          'kickback cable fessier',
    'donkey kick':             'donkey kicks',
    // Mollets
    'calf raise':              'mollets debout',
    'calf raises':             'mollets debout',
    'standing calf':           'mollets debout',
    'seated calf':             'mollets assis',
    'calf press':              'mollets leg press',
    // Core
    'plank':                   'planche',
    'side plank':              'gainage lateral',
    'deadbug':                 'dead bug',
    'hollow hold':             'hollow body hold',
    'hollow body':             'hollow body hold',
    'ab rollout':              'ab rollout sur genoux',
    // Générique
    'farmer walk':             'farmer carry',
    'farmers walk':            'farmer carry',
    'farmers carry':           'farmer carry',
    'jump rope':               'corde a sauter',
    'rope jump':               'corde a sauter',
    // Variantes françaises courtes
    'dev couche':              'developpe couche',
    'dev incline':             'developpe incline',
    'dev militaire':           'developpe militaire',
    'souleve de terre':        'deadlift',
    'squat bulgare':           'split squat bulgare',
    'fente bulgare':           'split squat bulgare',
    'tirage lat':              'tirage vertical poulie'
  };

  // ─── Aliases CrossFit / Hyrox : abréviations → clé CF_QUERIES ───────────
  // Règle : n'ajoutez PAS une clé déjà présente dans CF_QUERIES — l'alias serait mort.
  var CF_ALIASES = {
    't2b':                     'toes to bar',
    'ttb':                     'toes to bar',
    'mu':                      'muscle up',
    'ring mu':                 'muscle up anneau',
    'bmu':                     'bar muscle up',
    'bmup':                    'bar muscle up',
    'hs push up':              'handstand push up',
    'du':                      'double unders',
    'dus':                     'double unders',
    'american swing':          'american kettlebell swing',
    'tgu':                     'turkish get up',
    'p clean':                 'power clean',
    'c&j':                     'clean and jerk',
    'ohs':                     'overhead squat',
    'kipping':                 'kipping pull up',
    'kip':                     'kipping pull up',
    'wbs':                     'wall balls',
    'wb':                      'wall ball',
    'bj':                      'box jump',
    'bjo':                     'box jump over',
    'airdyne':                 'assault bike',
    'echo bike':               'assault bike',
    'row':                     'rowing crossfit',
    'erg':                     'ski erg',
    'rope':                    'rope climb',
    'db thruster':             'dumbbell thruster',
    'ring dips':               'ring dip',
    'sled':                    'sled push'
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
    if (level === 1 && !isEN) return TRUSTED_VIDEO_SOURCES.fr_beginner;
    if (level <= 2)           return TRUSTED_VIDEO_SOURCES.muscu_inter;
    return TRUSTED_VIDEO_SOURCES.muscu_advanced;
  }

  // ─── Résolution intelligente en 4 niveaux ─────────────────────────────────
  // 1. EXACT   — clé directe dans queryMap
  // 2. ALIAS   — EXERCISE_ALIASES / CF_ALIASES → clé dans queryMap
  // 3. PARTIAL — match partiel sur premiers tokens (≥2)
  // 4. FALLBACK — aucune correspondance curatée
  function _resolveKey(name, queryMap, aliasMap) {
    var key = _normalizeName(name);
    if (queryMap[key]) return { key: key, conf: CONF.EXACT };

    var ak = aliasMap && aliasMap[key];
    if (ak && queryMap[ak]) return { key: ak, conf: CONF.ALIAS };

    var partial = _partialMatch(key, queryMap);
    if (partial) return { key: partial, conf: CONF.PARTIAL };

    return { key: key, conf: CONF.FALLBACK };
  }

  // Match partiel : tente des préfixes de longueur décroissante (min 2 tokens).
  // Evite les faux positifs sur 1 token isolé.
  function _partialMatch(key, queryMap) {
    var tokens = key.split(' ');
    if (tokens.length < 2) return null;
    for (var len = tokens.length - 1; len >= 2; len--) {
      var sub = tokens.slice(0, len).join(' ');
      if (queryMap[sub]) return sub;
    }
    return null;
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

    // 1. Registre direct : URL exacte (watch?v= ou shorts/) — priorité absolue
    var directUrl = _resolveDirectVideo(name, lv, false);
    if (directUrl) return directUrl;

    // 2. Recherche filtrée par canal (fallback si pas de vidéo directe dans le registre)
    var resolved = _resolveKey(name, CURATED_QUERIES, EXERCISE_ALIASES);
    var chan = _resolveChannel(lv);
    var baseQuery = CURATED_QUERIES[resolved.key];

    if (baseQuery) {
      var query = (chan.handle === 'TiboInShape' && FR_QUERIES[resolved.key])
        ? FR_QUERIES[resolved.key]
        : baseQuery;
      return _buildChannelUrl(chan.name, query);
    }

    var isEN = window.isEnglish && window.isEnglish();
    var fallbackQ = isEN
      ? (_normalizeName(name) + ' exercise form tutorial')
      : (_normalizeName(name) + ' exercice technique tutoriel');
    return _buildFallbackUrl(fallbackQ);
  }

  /**
   * buildCFVideoUrl(name)
   * URL CrossFit / Haltérophilie / Hyrox → canal @CrossFit officiel.
   * Résolution en 4 niveaux via _resolveKey + CF_ALIASES.
   */
  function buildCFVideoUrl(name) {
    if (!name) return null;

    // 1. Registre direct CF
    var directUrl = _resolveDirectVideo(name, null, true);
    if (directUrl) return directUrl;

    // 2. Fallback recherche CrossFit channel
    var resolved = _resolveKey(name, CF_QUERIES, CF_ALIASES);
    var cfQuery = CF_QUERIES[resolved.key];
    if (cfQuery) return _buildChannelUrl('CrossFit', cfQuery);

    return _buildChannelUrl('CrossFit', _normalizeName(name) + ' technique tutorial');
  }

  /**
   * getVideoMeta(name, lv) → { url, confidence, label, channel, key }
   * Retourne les métadonnées complètes du match vidéo.
   * Utilisable par l'UI pour afficher le niveau de confiance ou adapter le CTA.
   */
  function getVideoMeta(name, lv) {
    if (!name) return { url: null, confidence: 0, label: 'none', channel: null, key: '', direct: false };
    var directUrl = _resolveDirectVideo(name, lv, false);
    if (directUrl) {
      return {
        url:        directUrl,
        confidence: CONF.DIRECT,
        label:      'direct',
        channel:    null,
        key:        _normalizeName(name),
        direct:     true
      };
    }
    var resolved = _resolveKey(name, CURATED_QUERIES, EXERCISE_ALIASES);
    var chan = _resolveChannel(lv);
    var labels = ['none', 'fallback', 'partial', 'alias', 'exact'];
    return {
      url:        buildSmartVideoUrl(name, lv),
      confidence: resolved.conf,
      label:      labels[resolved.conf] || 'fallback',
      channel:    chan,
      key:        resolved.key,
      direct:     false
    };
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
    var isDirect = /(?:watch\?v=|\/shorts\/)/.test(url);

    // URL directe (watch?v= ou /shorts/) → ouverture immédiate, zéro friction
    // L'élément <a> synthétique préserve le geste utilisateur sur iOS/Android.
    if (isDirect) {
      var a = document.createElement('a');
      a.href = url;
      a.target = '_blank';
      a.rel = 'noopener noreferrer';
      a.style.display = 'none';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      try { if (window.BLACKBOX) window.BLACKBOX.log('exo_video_open', { exo: exerciseName, lv: level, direct: true }); } catch(e) {}
      return;
    }

    // URL de recherche → modal pour indiquer ce que l'utilisateur va voir
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
    title.textContent = exerciseName || (isEN ? 'Technique demonstration' : 'Démonstration de l\'exercice');
    sheet.appendChild(title);

    var body = document.createElement('p');
    body.style.cssText = 'font-size:13px;color:var(--grey,#6B6B65);line-height:1.6;margin:0 0 22px;';
    body.textContent = isEN
      ? 'Opens YouTube filtered to ' + chan.name + '. First result = technique video for this exercise.'
      : 'Ouvre YouTube filtré sur ' + chan.name + '. Premier résultat = vidéo technique de cet exercice.';
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
      try { if (window.BLACKBOX) window.BLACKBOX.log('exo_video_open', { exo: exerciseName, lv: level, direct: false }); } catch(e) {}
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
    // Fonctions publiques
    buildSmartVideoUrl: buildSmartVideoUrl,
    buildCFVideoUrl:    buildCFVideoUrl,
    getChannelInfo:     getChannelInfo,
    getVideoMeta:       getVideoMeta,
    openVideoModal:     openVideoModal,
    // Audit registre direct
    auditRegistry:      function() {
      var total = Object.keys(DIRECT_VIDEO_REGISTRY).length;
      var withVideo = 0, verified = 0, pending = 0;
      Object.values(DIRECT_VIDEO_REGISTRY).forEach(function(entry) {
        var levels = ['fr_beginner','en_any','advanced','cf'];
        levels.forEach(function(lv) {
          if (entry[lv] && entry[lv].url) {
            withVideo++;
            if (entry[lv].verified) verified++; else pending++;
          }
        });
      });
      return { exercises: total, withDirectVideo: withVideo, verified: verified, pendingVerification: pending };
    },
    // Données accessibles pour audit / debug
    _DIRECT_REGISTRY:   DIRECT_VIDEO_REGISTRY,
    _CURATED_QUERIES:   CURATED_QUERIES,
    _CF_QUERIES:        CF_QUERIES,
    _FR_QUERIES:        FR_QUERIES,
    _EXERCISE_ALIASES:  EXERCISE_ALIASES,
    _CF_ALIASES:        CF_ALIASES,
    _SOURCES:           TRUSTED_VIDEO_SOURCES,
    _META:              _META,
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
