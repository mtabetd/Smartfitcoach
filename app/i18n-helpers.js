'use strict';
// ═══════════════════════════════════════════════════════════════
// SmartFitCoach — i18n helpers
// Locale-aware utilities: plurals, dates, numbers, legacy value normalizers.
// Loaded immediately after app-core.js (which defines window.I18N).
// ═══════════════════════════════════════════════════════════════

(function(){
  var W = window;

  // --- Current language helper ---
  W.currentLang = function() {
    return (W.I18N && W.I18N.current) || (W.S && W.S.lang) || 'fr';
  };

  W.isEnglish = function() { return W.currentLang() === 'en'; };
  W.isFrench  = function() { return W.currentLang() === 'fr'; };

  // --- Sex normalization (legacy 'homme'/'femme' ↔ 'male'/'female') ---
  // S.sex remains stored as 'homme'/'femme' for DB back-compat.
  // UI uses these helpers instead of direct comparisons.
  W.isFemale = function(sObj) {
    var s = sObj || W.S; if (!s) return false;
    var v = String(s.sex || '').toLowerCase();
    return v === 'femme' || v === 'female' || v === 'f';
  };
  W.isMale = function(sObj) {
    var s = sObj || W.S; if (!s) return false;
    var v = String(s.sex || '').toLowerCase();
    return v === 'homme' || v === 'male' || v === 'm' || v === 'h';
  };

  // --- Bodyweight exercise detection ---
  // Exercises with eq='Poids du corps' (FR), 'Bodyweight' (EN), or isBodyweight:true flag.
  W.isBodyweightExercise = function(ex) {
    if (!ex) return false;
    if (ex.isBodyweight === true) return true;
    if (ex.isBodyweight === false) return false;
    var eq = ex.eq || ex.equipment || '';
    return /^(poids du corps|bodyweight|body[\s-]?weight|aucun|none)$/i.test(eq);
  };

  // --- Free meal detection (meals with user-chosen macros) ---
  W.isFreeMeal = function(meal) {
    if (!meal) return false;
    if (meal.isFree === true) return true;
    var n = String(meal.n || meal.name || '');
    return n === 'Repas libre' || n === 'Free meal' || n.toLowerCase() === 'free meal';
  };

  // --- Pluralization (2-form languages: FR/EN) ---
  // Example: pluralize(3, 'jour', 'jours') → 'jours'
  // Or with auto-plural: pluralize(3, 'jour') → 'jours' (appends 's')
  W.pluralize = function(count, singular, plural) {
    if (count === 1 || count === -1) return singular;
    if (typeof plural === 'string') return plural;
    return singular + 's';
  };

  // Localized plural: automatically uses FR or EN form based on current lang.
  // Example: locPlural(3, {fr: {one:'jour', other:'jours'}, en: {one:'day', other:'days'}})
  W.locPlural = function(count, forms) {
    var lang = W.currentLang();
    var set = forms[lang] || forms.fr || forms.en;
    if (!set) return String(count);
    return (count === 1 || count === -1) ? set.one : set.other;
  };

  // --- Date formatting (locale-aware) ---
  function _locale() { return W.isEnglish() ? 'en-US' : 'fr-FR'; }

  W.formatDate = function(dateOrTs, options) {
    var d = (dateOrTs instanceof Date) ? dateOrTs : new Date(dateOrTs);
    if (isNaN(d.getTime())) return '';
    try { return d.toLocaleDateString(_locale(), options || {}); }
    catch(e) { return d.toLocaleDateString('fr-FR', options || {}); }
  };

  W.formatDateTime = function(dateOrTs, options) {
    var d = (dateOrTs instanceof Date) ? dateOrTs : new Date(dateOrTs);
    if (isNaN(d.getTime())) return '';
    try { return d.toLocaleString(_locale(), options || {}); }
    catch(e) { return d.toLocaleString('fr-FR', options || {}); }
  };

  W.formatTime = function(dateOrTs, options) {
    var d = (dateOrTs instanceof Date) ? dateOrTs : new Date(dateOrTs);
    if (isNaN(d.getTime())) return '';
    try { return d.toLocaleTimeString(_locale(), options || {}); }
    catch(e) { return d.toLocaleTimeString('fr-FR', options || {}); }
  };

  // --- Number formatting (locale-aware) ---
  W.formatNumber = function(n, decimals) {
    if (typeof n !== 'number' || isNaN(n)) return '';
    var opts = {};
    if (typeof decimals === 'number') {
      opts.minimumFractionDigits = decimals;
      opts.maximumFractionDigits = decimals;
    }
    try { return n.toLocaleString(_locale(), opts); }
    catch(e) { return n.toLocaleString('fr-FR', opts); }
  };

  // --- Month / day arrays (bilingual) ---
  var MONTHS_LONG = {
    fr: ['janvier','février','mars','avril','mai','juin','juillet','août','septembre','octobre','novembre','décembre'],
    en: ['January','February','March','April','May','June','July','August','September','October','November','December']
  };
  var MONTHS_SHORT = {
    fr: ['janv.','févr.','mars','avr.','mai','juin','juil.','août','sept.','oct.','nov.','déc.'],
    en: ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
  };
  // Day indices: JS Date.getDay() returns 0=Sunday, 1=Monday, ..., 6=Saturday
  var DAYS_LONG = {
    fr: ['dimanche','lundi','mardi','mercredi','jeudi','vendredi','samedi'],
    en: ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday']
  };
  var DAYS_SHORT = {
    fr: ['dim.','lun.','mar.','mer.','jeu.','ven.','sam.'],
    en: ['Sun','Mon','Tue','Wed','Thu','Fri','Sat']
  };

  W.getMonthName = function(index, short) {
    var lang = W.currentLang();
    var arr = short ? (MONTHS_SHORT[lang] || MONTHS_SHORT.fr) : (MONTHS_LONG[lang] || MONTHS_LONG.fr);
    var i = ((index % 12) + 12) % 12;
    return arr[i] || '';
  };
  W.getDayName = function(index, short) {
    var lang = W.currentLang();
    var arr = short ? (DAYS_SHORT[lang] || DAYS_SHORT.fr) : (DAYS_LONG[lang] || DAYS_LONG.fr);
    var i = ((index % 7) + 7) % 7;
    return arr[i] || '';
  };

  // --- Translation shortcut with inline fallback ---
  // Usage: tr('toasts.saved', 'Enregistré')
  // If I18N.t returns the key (not translated), fallback is returned.
  W.tr = function(key, fallback) {
    if (W.I18N && W.I18N.t) {
      var v = W.I18N.t(key);
      if (v) return v;
    }
    return (fallback != null) ? fallback : key;
  };

  // --- Extended dict registry (loaded from /i18n/*.json) ---
  W._extI18N = { exercises: null, motivations: null, taxonomy: null };

  // Translate an exercise name using the extended dict.
  // Returns the FR name unchanged if current lang is 'fr' or no mapping exists.
  W.trExercise = function(frName) {
    if (!frName) return '';
    if (!W.isEnglish()) return frName;
    var dict = W._extI18N.exercises;
    if (!dict || !dict.exercises) return frName;
    return dict.exercises[frName] || frName;
  };

  // Translate equipment / muscle group / workout term / etc.
  W.trTax = function(category, frValue) {
    if (!frValue) return '';
    if (!W.isEnglish()) return frValue;
    var dict = W._extI18N.taxonomy;
    if (!dict || !dict[category]) return frValue;
    return dict[category][frValue] || frValue;
  };

  // Load an extended dict lazily (called once at app init).
  W.loadExtendedI18N = function(name, url) {
    if (W._extI18N[name]) return Promise.resolve(W._extI18N[name]);
    return fetch(url, { cache: 'force-cache' })
      .then(function(r){ return r.ok ? r.json() : null; })
      .then(function(json){
        if (json) {
          W._extI18N[name] = json;
          // Inject translatable entries into the FR->EN Map so that
          // translateDOM() picks them up automatically.
          try { W._injectExtDictIntoMap(name, json); } catch(e) {}
        }
        return json;
      })
      .catch(function(){ return null; });
  };

  // Inject a loaded extended dict into window.I18N._frToEn map.
  W._injectExtDictIntoMap = function(name, json) {
    if (!json || !W.I18N) return;
    W.extendI18NMap();
    if (!W.I18N._frToEn) return;
    var M = W.I18N._frToEn;
    var add = function(fr, en) {
      if (typeof fr === 'string' && typeof en === 'string' && fr && en && !M.has(fr)) {
        M.set(fr, en);
      }
    };
    if (name === 'exercises' && json.exercises) {
      for (var k in json.exercises) {
        if (json.exercises.hasOwnProperty(k)) add(k, json.exercises[k]);
      }
    } else if (name === 'taxonomy') {
      // Taxonomy has multiple categories (equipment, muscle_groups, etc.)
      var cats = ['equipment','muscle_groups','workout_phases','program_types','workout_terms','sports','medical_zones','goals','sport_goals','gender','difficulty_levels','diet','meal_slots','macros','trimesters'];
      for (var ci = 0; ci < cats.length; ci++) {
        var cat = json[cats[ci]];
        if (!cat) continue;
        for (var ck in cat) {
          if (cat.hasOwnProperty(ck)) add(ck, cat[ck]);
        }
      }
    }
    // Force re-run of translateDOM after new entries land (if English already active)
    try {
      if (W.isEnglish && W.isEnglish() && W.I18N.translateDOM) W.I18N.translateDOM();
    } catch(e) {}
  };

  // --- Browser language auto-detect (runs once at first load) ---
  W.detectBrowserLang = function() {
    try {
      var nav = navigator.language || navigator.userLanguage || 'fr';
      return /^en/i.test(nav) ? 'en' : 'fr';
    } catch(e) { return 'fr'; }
  };

  // --- Extend I18N.buildMap() with additional translations ---
  // Hook into the existing _frToEn Map. Called once after I18N.buildMap() initializes it.
  W._i18nExtendedReady = false;
  W.extendI18NMap = function() {
    if (W._i18nExtendedReady) return;
    if (!W.I18N || !W.I18N.buildMap) return;
    try {
      W.I18N.buildMap();
      if (!W.I18N._frToEn) return;
      var M = W.I18N._frToEn;
      var add = function(fr, en) {
        if (fr && en && !M.has(fr)) M.set(fr, en);
      };

      // --- Toast / feedback strings ---
      add('Enregistré', 'Saved');
      add('Enregistré.', 'Saved.');
      add('Sauvegardé', 'Saved');
      add('Copié', 'Copied');
      add('Copié !', 'Copied!');
      add('Supprimé', 'Deleted');
      add('Mis à jour', 'Updated');
      add('Annulé', 'Canceled');
      add('Terminé', 'Done');
      add('Impossible', 'Unable');
      add('Erreur', 'Error');
      add('Erreur inattendue', 'Unexpected error');
      add('Une erreur est survenue', 'An error occurred');
      add('Réessayer', 'Retry');
      add('Recharger', 'Reload');
      add('Chargement...', 'Loading...');
      add('Chargement…', 'Loading…');
      add('Patientez...', 'Please wait...');
      add('Hors ligne', 'Offline');
      add('Connexion perdue', 'Connection lost');
      add('Connexion rétablie', 'Connection restored');
      add('Synchronisé', 'Synced');
      add('En cours de synchronisation', 'Syncing');

      // --- Confirm / alert dialogs ---
      add('Êtes-vous sûr ?', 'Are you sure?');
      add('Êtes-vous sûr(e) ?', 'Are you sure?');
      add('Confirmer ?', 'Confirm?');
      add('Continuer ?', 'Continue?');
      add("Action irréversible", 'Irreversible action');
      add('Cette action est irréversible', 'This action is irreversible');
      // Full-text dialogs (app-main, custom-session, today-dashboard, app-sport)
      add('Abandonner la séance ? Les séries validées sont conservées.',
          'End this workout? Validated sets are kept.');
      add('Restaurer vos données depuis le cloud ?\n\nLes données locales seront remplacées par la dernière sauvegarde cloud.',
          'Restore your data from the cloud?\n\nLocal data will be replaced by the latest cloud backup.');
      add('Base utilisateurs effacée. Rechargement...', 'User database cleared. Reloading...');
      add('Supprimer définitivement votre compte et toutes vos données ? Cette action est irréversible.',
          'Permanently delete your account and all your data? This action is irreversible.');
      add('Cela remplacera vos données actuelles. Continuer ?',
          'This will replace your current data. Continue?');
      add('Action irréversible. Toutes vos données seront supprimées définitivement. Continuer ?',
          'Irreversible action. All your data will be permanently deleted. Continue?');
      add('Des repas sont déjà dans votre journal. Voulez-vous quand même ajouter le plan du jour ?',
          "Meals are already in your journal. Add today's plan anyway?");
      add('Supprimer ce post ?', 'Delete this post?');
      add('Supprimer ce commentaire ?', 'Delete this comment?');
      add('Annuler la demande ?', 'Cancel the request?');
      add('Régénérer un nouveau plan ? Votre plan actuel sera remplacé.',
          'Generate a new plan? Your current plan will be replaced.');
      add('Refaire le questionnaire nutrition ? Votre plan actuel sera supprimé.',
          'Retake the nutrition questionnaire? Your current plan will be deleted.');
      // Verbs/fragments used by dynamic concatenations
      add('Supprimer', 'Delete');
      add('Retirer', 'Remove');
      add('Votre export fait', 'Your export is');
      add('Mo (contient probablement beaucoup de photos).', 'MB (may contain many photos).');
      add('Le téléchargement peut être long. Continuer ?', 'The download may take a while. Continue?');
      add('Annuler la séance validée de ce jour ?', "Cancel today's validated workout?");
      add('kcal enregistrées.', 'kcal logged.');
      add('Vous perdrez les', 'You will lose the');
      add('du journal ?', 'from the journal?');

      // --- Common verbs / UI ---
      add('Oui', 'Yes');
      add('Non', 'No');
      add('OK', 'OK');
      add('Valider', 'Validate');
      add('Soumettre', 'Submit');
      add('Envoyer', 'Send');
      add('Télécharger', 'Download');
      add('Exporter', 'Export');
      add('Importer', 'Import');
      add('Partager', 'Share');
      add('Copier', 'Copy');
      add('Coller', 'Paste');
      add('Rechercher', 'Search');
      add('Filtrer', 'Filter');
      add('Trier', 'Sort');
      add('Actualiser', 'Refresh');
      add('Suivant', 'Next');
      add('Précédent', 'Previous');
      add('Voir plus', 'See more');
      add('Voir moins', 'See less');
      add('Réduire', 'Collapse');
      add('Déplier', 'Expand');
      add('Ajouter', 'Add');
      add('Retirer', 'Remove');
      add('Créer', 'Create');
      add('Dupliquer', 'Duplicate');
      add('Réinitialiser', 'Reset');
      add('Appliquer', 'Apply');

      // --- Units & quantities (handled elsewhere, but useful) ---
      add('aujourd\'hui', 'today');
      add("Aujourd'hui", 'Today');
      add('Hier', 'Yesterday');
      add('Demain', 'Tomorrow');
      add('minute', 'minute');
      add('minutes', 'minutes');
      add('seconde', 'second');
      add('secondes', 'seconds');
      add('heure', 'hour');
      add('heures', 'hours');
      add('jour', 'day');
      add('jours', 'days');
      add('semaine', 'week');
      add('semaines', 'weeks');
      add('mois', 'month');
      add('année', 'year');
      add('années', 'years');

      // --- Equipment (from taxonomy dict, common cases) ---
      add('Poids du corps', 'Bodyweight');
      add('Haltères', 'Dumbbells');
      add('Haltère', 'Dumbbell');
      add('Barre', 'Barbell');
      add('Barre de traction', 'Pull-up bar');
      add('Kettlebell', 'Kettlebell');
      add('Machine', 'Machine');
      add('Élastique', 'Band');
      add('Corde à sauter', 'Jump rope');
      add('Rameur', 'Rowing machine');

      // --- Muscle groups ---
      add('Pectoraux', 'Chest');
      add('Dos', 'Back');
      add('Épaules', 'Shoulders');
      add('Trapèzes', 'Traps');
      add('Biceps', 'Biceps');
      add('Triceps', 'Triceps');
      add('Avant-bras', 'Forearms');
      add('Jambes', 'Legs');
      add('Quadriceps', 'Quads');
      add('Ischio-jambiers', 'Hamstrings');
      add('Mollets', 'Calves');
      add('Fessiers', 'Glutes');
      add('Abdominaux', 'Abs');
      add('Lombaires', 'Lower back');
      add('Cardio', 'Cardio');

      // --- Phases / levels ---
      add('Prise de masse', 'Muscle gain');
      add('Prise de masse douce', 'Lean bulk');
      add('Maintien', 'Maintain');
      add('Perte de poids', 'Weight loss');
      add('Sèche', 'Cut');
      add('Recomposition', 'Body recomposition');
      add('Masse', 'Mass');

      // --- Common profile / medical labels ---
      add('Sexe', 'Sex');
      add('Grossesse', 'Pregnancy');
      add('Cycle', 'Cycle');
      add('Activité', 'Activity');
      add('Sédentaire', 'Sedentary');
      add('Légèrement actif', 'Lightly active');
      add('Modérément actif', 'Moderately active');
      add('Très actif', 'Very active');
      add('Athlète', 'Athlete');
      add('Athlète élite', 'Elite athlete');

      // --- Medical conditions (short) ---
      add('Aucune condition particulière', 'No specific conditions');
      add('Allergies', 'Allergies');
      add('Intolérances', 'Intolerances');
      add('Aucune', 'None');

      // --- Sport & coaching labels ---
      add('Échauffement', 'Warm-up');
      add('Étirement', 'Stretching');
      add('Retour au calme', 'Cool-down');
      add('Séance', 'Workout');
      add('Séances', 'Workouts');
      add('Série', 'Set');
      add('Répétition', 'Rep');
      add('Record personnel', 'Personal record');
      add('Exercice', 'Exercise');
      add('Exercices', 'Exercises');

      // --- Scanner / plate-scan messages ---
      add('Produit non trouvé dans la base de données', 'Product not found in the database');
      add('Délai dépassé (10s) — vérifiez votre connexion', 'Request timed out (10s) — check your connection');
      add('Erreur de connexion', 'Connection error');
      add('Aucune caméra détectée sur cet appareil.', 'No camera detected on this device.');
      add('Aucun code-barres détecté dans la photo. Cadrez uniquement le code-barres et réessayez, ou entrez le numéro manuellement.',
          'No barcode detected in the photo. Frame only the barcode and try again, or enter the number manually.');
      add('Scanner mon repas', 'Scan my meal');
      add('Fonctionnalité réservée aux abonnés', 'Feature available to subscribers only');
      add('Impossible de lire cette image', 'Unable to read this image');
      add('Ajouté au', 'Added to');

      // --- Profile labels ---
      add('renouvellement le', 'renewal on');
      add('Toutes les fonctionnalités — sans restriction', 'All features — no restrictions');
      add('Mon profil', 'My profile');
      add('Langue / Language', 'Language');
      add('Paramètres', 'Settings');
      add('Mon compte', 'My account');
      add('Abonnement', 'Subscription');
      add('Gérer l\'abonnement', 'Manage subscription');

      // --- RGPD / data ---
      add('Télécharger mes données (RGPD)', 'Download my data (GDPR)');
      add('Supprimer mon compte', 'Delete my account');
      add('Impossible de sérialiser vos données. Contactez le DPO si le problème persiste.',
          'Unable to serialize your data. Contact the DPO if the problem persists.');
      add('Erreur lors du téléchargement. Réessayez.', 'Download error. Try again.');

      W._i18nExtendedReady = true;
    } catch(e) { /* silent */ }
  };

  // --- Boot-time initialization ---
  // Loads extended JSON dicts and extends I18N map on first paint.
  W.bootI18N = function() {
    // Extend core map now (safe — app-core.js already ran)
    W.extendI18NMap();

    // Auto-detect browser language for first-time users.
    // Runs once: if no S.lang is persisted yet and I18N.current is still default,
    // switch to browser language (fr or en).
    try {
      var hasPersistedLang = W.S && typeof W.S.lang === 'string' && (W.S.lang === 'fr' || W.S.lang === 'en');
      if (!hasPersistedLang && W.I18N && W.detectBrowserLang) {
        var browserLang = W.detectBrowserLang();
        if (browserLang === 'en') {
          W.I18N.current = 'en';
          if (W.S) W.S.lang = 'en';
        }
      }
    } catch(e) {}

    // Load external dicts asynchronously (exercises / motivations / taxonomy)
    var base = './i18n/';
    W.loadExtendedI18N('exercises', base + 'exercises-en.json');
    W.loadExtendedI18N('motivations', base + 'motivations-en.json');
    W.loadExtendedI18N('taxonomy', base + 'taxonomy-en.json');
  };

  // Auto-boot once DOM is ready (non-blocking)
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', W.bootI18N, { once: true });
  } else {
    // Already loaded — defer to next tick so app-core.js finishes init first
    setTimeout(W.bootI18N, 0);
  }

  // ═══════════════════════════════════════════════════════════════
  // Auto-translation wrapper for showToast() — applies to every toast
  // without touching individual call sites. Leaves dynamic strings
  // (concatenations) unchanged; they fall through as-is.
  // ═══════════════════════════════════════════════════════════════
  W._i18nToastWrapped = false;
  W._wrapShowToast = function() {
    if (W._i18nToastWrapped) return;
    if (typeof W.showToast !== 'function') return;
    var _orig = W.showToast;

    function _translate(msg) {
      if (!msg || typeof msg !== 'string') return msg;
      if (!W.isEnglish || !W.isEnglish()) return msg;
      W.extendI18NMap();
      if (!W.I18N || !W.I18N._frToEn) return msg;
      var m = W.I18N._frToEn;
      // Exact match
      if (m.has(msg)) return m.get(msg);
      // Prefix match "X : Y" → try to translate only the prefix up to ':'
      var colonIdx = msg.indexOf(' : ');
      if (colonIdx > 0) {
        var head = msg.slice(0, colonIdx);
        if (m.has(head)) return m.get(head) + msg.slice(colonIdx);
      }
      // Concatenation pattern "Ajouté au X : Y" → unchanged (dynamic)
      return msg;
    }

    W.showToast = function(msg, type, duration) {
      try { msg = _translate(msg); } catch(e) {}
      return _orig.call(this, msg, type, duration);
    };
    W._i18nToastWrapped = true;
  };

  // Wrap showToast once app-core.js has defined it (same tick as bootI18N)
  var _priorBoot = W.bootI18N;
  W.bootI18N = function() {
    if (_priorBoot) _priorBoot();
    W._wrapShowToast();
  };
  // Also wrap ASAP for the "already loaded" path (app-core already ran)
  setTimeout(W._wrapShowToast, 0);

  // ═══════════════════════════════════════════════════════════════
  // Locale-aware confirm/alert wrappers — native browser dialogs
  // take raw strings, so we must translate before calling them.
  // ═══════════════════════════════════════════════════════════════
  function _translateDialogMsg(msg) {
    if (!msg || typeof msg !== 'string') return msg;
    if (!W.isEnglish || !W.isEnglish()) return msg;
    W.extendI18NMap();
    if (!W.I18N || !W.I18N._frToEn) return msg;
    var m = W.I18N._frToEn;
    if (m.has(msg)) return m.get(msg);
    // Line-by-line translation for multi-line dialogs
    if (msg.indexOf('\n') !== -1) {
      return msg.split('\n').map(function(line) {
        var trimmed = line.trim();
        if (!trimmed) return line;
        if (m.has(trimmed)) {
          // preserve leading/trailing whitespace
          return line.replace(trimmed, m.get(trimmed));
        }
        return line;
      }).join('\n');
    }
    return msg;
  }

  W.sfcConfirm = function(msg) {
    return window.confirm(_translateDialogMsg(msg));
  };
  W.sfcAlert = function(msg) {
    return window.alert(_translateDialogMsg(msg));
  };
  W.sfcPrompt = function(msg, defaultVal) {
    return window.prompt(_translateDialogMsg(msg), defaultVal);
  };
})();
