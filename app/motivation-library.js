// motivation-library.js — Bibliothèque premium de messages de motivation quotidiens
// Charte visuelle SmartFitCoach : ton Hermès/Bocuse, Georgia serif, phrases courtes & élégantes
// Pas de sur-enthousiasme, pas d'emojis dans les notifs, poésie sobre.
//
// Usage : window.MOTIVATION_LIBRARY.getDailyMotivation(profile) → { title, body }
//         Déterministe par jour (même phrase toute la journée, différente chaque jour).

(function() {
  'use strict';

  // ─── 1. POOLS PAR JOUR DE LA SEMAINE ────────────────────────────────────────
  // Index 0 = dimanche, 1 = lundi, ..., 6 = samedi (cohérent avec Date.getDay())

  var BY_WEEKDAY = {
    // ── LUNDI (1) — nouvelle semaine, intention, déclaration ─────────────────
    1: [
      "La semaine commence. Vos choix d'aujourd'hui écrivent ceux de vendredi.",
      "Une nouvelle page. Personne ne la noircira à votre place, {prenom}.",
      "Le lundi n'est pas une contrainte. C'est un rendez-vous avec votre meilleure version.",
      "Sept jours devant vous. Un seul compte vraiment : celui-ci.",
      "Commencer demain, c'est l'art de ne jamais commencer.",
      "La semaine qui s'ouvre est une promesse. Tenez-la.",
      "Votre corps ne fait pas la différence entre lundi et samedi. Vous si. Décidez.",
      "Le vrai luxe est la constance. Offrez-vous ce luxe, {prenom}.",
      "Ce que vous répétez lundi, vous le maîtrisez dimanche.",
      "Rien ne se passe à moitié. Ni la semaine qui commence.",
      "Un lundi réussi n'est pas intense. Il est précis.",
      "L'intention, pas la perfection. Posez la vôtre maintenant.",
      "Chaque lundi est une chance de refuser l'à-peu-près.",
      "La discipline n'attend pas l'humeur. Elle la précède.",
      "Vous connaissez la route. Il suffit de poser le premier pas."
    ],

    // ── MARDI (2) — exécution, profondeur du travail ─────────────────────────
    2: [
      "Le mardi récompense ceux qui ont tenu lundi. C'est votre cas.",
      "On reconnaît un athlète à ses mardis, jamais à ses lundis.",
      "La régularité est une élégance. Elle ne se voit pas, elle se ressent.",
      "Ce n'est pas la séance parfaite qui compte. C'est la séance faite.",
      "Votre corps enregistre. Même sans spectaculaire. Surtout sans spectaculaire.",
      "Le mardi, les promesses du lundi deviennent des habitudes.",
      "Deux jours consécutifs. C'est déjà une trajectoire.",
      "Le vrai travail est silencieux. Le vôtre l'est, {prenom}.",
      "La progression aime la répétition. Elle déteste l'improvisation.",
      "Aujourd'hui, soyez précis. Pas sévère. Précis.",
      "Un effort juste vaut mieux que dix efforts approximatifs.",
      "La fatigue n'est pas un obstacle. C'est un indicateur.",
      "Ce qui semble ordinaire aujourd'hui deviendra remarquable dans trois mois.",
      "Le mardi est le vrai test de l'engagement. Vous le passez.",
      "Ne comptez pas vos séances. Rendez chaque séance comptable."
    ],

    // ── MERCREDI (3) — milieu de semaine, tenir le cap ──────────────────────
    3: [
      "Au milieu de la semaine, on voit qui s'est engagé pour de bon.",
      "Le mercredi est une frontière. Ceux qui la franchissent vont loin.",
      "Pas de relâchement. Pas de survoltage. Juste la continuité.",
      "Trois jours d'effort, c'est déjà une signature.",
      "Ce n'est pas le sommet qui est difficile. C'est le versant du milieu.",
      "Votre semaine ressemble à vos décisions d'aujourd'hui.",
      "Le mercredi, on cesse de penser « commencer » — on pense « poursuivre ».",
      "La constance se construit précisément ici, au milieu.",
      "Vous êtes à mi-parcours. Ni trop tôt pour douter, ni trop tard pour ajuster.",
      "Respectez le plan. Il a été pensé pour cette semaine, pas pour votre humeur.",
      "La vraie force, c'est de faire ce qui est prévu quand rien ne nous y oblige.",
      "Un jour de plus. Puis un autre. C'est ainsi qu'on change une vie.",
      "Aujourd'hui n'est pas un jour moyen. C'est un jour décisif.",
      "Le milieu de semaine ne se négocie pas. Il se traverse.",
      "Vous êtes déjà en avance sur la personne que vous étiez lundi."
    ],

    // ── JEUDI (4) — presque au bout, densité, qualité ───────────────────────
    4: [
      "Le jeudi est le jour où les séances comptent double. Par la fatigue et par le sens.",
      "Vous approchez. Ne ralentissez pas. Resserrez.",
      "L'effort d'aujourd'hui pèse plus qu'hier. C'est normal. C'est bon.",
      "Quatre jours tenus. Vous êtes désormais la référence, {prenom}.",
      "Le corps fatigué progresse mieux que le corps frais. À condition qu'il soit respecté.",
      "Les grandes semaines se gagnent les jeudis.",
      "Aujourd'hui, demandez-vous : est-ce que j'exécute, ou est-ce que je performe ?",
      "L'effort qui ne coûte pas n'a pas encore commencé.",
      "La qualité d'aujourd'hui se lira dans les résultats de dans six semaines.",
      "Le jeudi, on ne parle plus. On fait.",
      "Votre régularité depuis lundi est un acte rare. Honorez-la.",
      "Sept jours, c'est une semaine. Quatre jours, c'est déjà un engagement.",
      "Les abandons ne surviennent pas au début ni à la fin. Ils surviennent au jeudi. Pas vous.",
      "Ce que vous faites aujourd'hui, votre corps s'en souvient dans six mois.",
      "Le seuil n'est pas physique. Il est mental. Vous êtes du bon côté."
    ],

    // ── VENDREDI (5) — clôture, fierté, préparation du week-end ─────────────
    5: [
      "Vous arrivez au bout. Ni premier, ni dernier jour. Décisif.",
      "Le vendredi est le jour des derniers 10%. Ceux qui font la différence.",
      "Finir une semaine comme celle-ci, c'est déjà un accomplissement.",
      "Pas de relâchement pré-week-end. La semaine n'est pas encore terminée.",
      "Le vendredi soir, vous voudrez vous souvenir de ce vendredi matin.",
      "Cinq jours. Vous êtes un exemple pour qui vous étiez lundi.",
      "La fatigue accumulée est le meilleur carburant pour un effort propre.",
      "Vous n'êtes pas venu ici pour rien. Terminez la semaine comme vous l'avez ouverte.",
      "Aujourd'hui, clôturez votre semaine comme on clôture un contrat : avec soin.",
      "Le vendredi est un rite. Respectez-le, {prenom}.",
      "Ce que vous finirez aujourd'hui vous accompagnera tout le week-end.",
      "Les meilleures semaines sont celles dont le vendredi ressemble au lundi.",
      "Le dernier effort de la semaine est aussi le plus significatif.",
      "Terminez fort. Le repos n'en sera que plus mérité.",
      "Vous êtes plus solide qu'au premier jour. C'est cela, progresser."
    ],

    // ── SAMEDI (6) — liberté maîtrisée, plaisir lucide ──────────────────────
    6: [
      "Le samedi est un art. Celui de se reposer sans se perdre.",
      "La vraie détente n'est pas l'excès. C'est le choix assumé.",
      "Profitez. Mais profitez avec conscience, {prenom}.",
      "Ce que vous faites le samedi compte autant que ce que vous faites le mardi.",
      "Un écart choisi vaut mieux que dix écarts subis.",
      "Le week-end n'est pas une parenthèse. C'est une continuation.",
      "Le plaisir intelligent ne ruine rien. Il enrichit tout.",
      "Un jour de récupération n'est jamais un jour perdu.",
      "Le samedi matin dit beaucoup sur la semaine qui s'est écoulée. Et sur celle qui vient.",
      "Récupérer n'est pas arrêter. C'est choisir un autre type d'effort.",
      "Le corps réclame du repos comme l'esprit réclame de la lecture. Respectez cela.",
      "Aujourd'hui, mangez bien. Bougez doucement. Respirez complètement.",
      "Un samedi lucide prépare un dimanche serein.",
      "Le plaisir, oui. La dérive, non. Vous connaissez la différence.",
      "Le repos est un ingrédient. Pas une exception."
    ],

    // ── DIMANCHE (0) — bilan, préparation, sérénité ─────────────────────────
    0: [
      "Le dimanche, on regarde derrière sans nostalgie. Et devant sans précipitation.",
      "Une semaine se termine. Une autre se prépare. Tout est dans l'intervalle.",
      "Le dimanche est un jour de rangement. Mental, autant que physique.",
      "Ce que vous préparez aujourd'hui vous dispense d'improviser lundi.",
      "Prenez un temps pour vous, {prenom}. Vous l'avez mérité.",
      "Un dimanche calme vaut mille semaines chaotiques.",
      "Respirez. La semaine passée est gravée. Celle qui vient est à écrire.",
      "Anticipez sans vous presser. C'est la meilleure forme de maîtrise.",
      "Le dimanche est le jour des décisions calmes.",
      "Regardez votre plan de la semaine. Soyez fier de l'avoir tenu.",
      "Avant de projeter, savourez. Le présent aussi compte.",
      "La vraie performance se nourrit aussi de ces jours sans performance.",
      "Un dimanche bien vécu est déjà un lundi réussi.",
      "Ralentissez. C'est parfois la plus haute forme de discipline.",
      "Revoir, accepter, repartir. Le triptyque du dimanche."
    ]
  };

  // ─── 2. MODIFICATEURS — JOUR D'ENTRAÎNEMENT ─────────────────────────────────
  var TRAINING_DAY = [
    "Séance prévue aujourd'hui. Approchez-la comme un rendez-vous sérieux.",
    "Le corps est prêt. L'esprit aussi, si vous le décidez.",
    "Pas de séance parfaite. Juste des séances faites. Faites celle-ci, {prenom}.",
    "Préparez-vous physiquement. Préparez-vous mentalement. Les deux comptent.",
    "Votre programme d'aujourd'hui n'est pas une obligation. C'est un outil.",
    "Dix minutes d'échauffement évitent six mois de blessure.",
    "Chaque série de travail exécutée proprement est une série gagnée.",
    "Respirez, ancrez-vous, démarrez. Le reste viendra.",
    "Vous ne cherchez pas la performance. Vous cherchez la précision.",
    "Aujourd'hui, soyez l'athlète que vous admirez en silence."
  ];

  // ─── 3. MODIFICATEURS — JOUR DE REPOS ───────────────────────────────────────
  var REST_DAY = [
    "Jour de repos. Il fait partie du plan. Honorez-le autant qu'une séance.",
    "Le muscle ne grandit pas pendant l'effort. Il grandit maintenant.",
    "Dormir bien est une séance invisible. Dormez bien ce soir.",
    "Mangez proprement. Hydratez-vous. Marchez un peu. C'est votre vrai entraînement aujourd'hui.",
    "Le repos n'est jamais un luxe. C'est une exigence.",
    "Aujourd'hui, votre corps vous remercie pour hier et prépare demain.",
    "Rien à forcer. Rien à prouver. Juste à récupérer, {prenom}.",
    "Un jour de récupération intelligent vaut trois séances mal faites."
  ];

  // ─── 4. MILESTONES DE STREAK ────────────────────────────────────────────────
  // Prioritaires sur la rotation habituelle si le jour correspond à un palier
  var STREAK_MILESTONES = {
    3: [
      "Trois jours d'affilée. Une habitude commence à naître, {prenom}."
    ],
    7: [
      "Sept jours. Une semaine complète sans rompre la ligne. C'est rare.",
      "Sept jours consécutifs. Vous venez de passer la frontière."
    ],
    14: [
      "Deux semaines. Ce n'est plus une tentative. C'est un mode de vie.",
      "Quatorze jours. Vous êtes officiellement constant."
    ],
    21: [
      "Vingt-et-un jours. Le chiffre qu'on prête aux habitudes. Vous y êtes, {prenom}."
    ],
    30: [
      "Trente jours. Ce n'est plus de la motivation. C'est de la discipline.",
      "Un mois complet. Vous n'êtes plus le même qu'il y a trente jours."
    ],
    50: [
      "Cinquante jours. C'est ce qui sépare ceux qui essaient de ceux qui font."
    ],
    60: [
      "Deux mois. Votre corps et vos choix ne sont plus étrangers, {prenom}."
    ],
    100: [
      "Cent jours. C'est le chiffre que peu atteignent. Vous l'avez atteint.",
      "Cent jours. Vous avez franchi le seuil des sérieux."
    ],
    200: [
      "Deux cents jours. À ce stade, on ne parle plus d'effort. On parle d'identité."
    ],
    365: [
      "Un an. Une année entière sans lâcher. Vous êtes devenu la référence, {prenom}."
    ]
  };

  // ─── 5. FONCTIONS UTILITAIRES ───────────────────────────────────────────────

  // Remplace les templates {prenom}, {streak}, {goalName} dans le texte
  function applyTemplate(text, profile) {
    if (!text) return '';
    var prenom = (profile && profile.prenom) ? String(profile.prenom).trim() : '';
    var streak = (profile && typeof profile.streak === 'number') ? profile.streak : 0;
    var goalName = (profile && profile.goalName) ? profile.goalName : '';
    // Si pas de prénom, on retire le ", {prenom}" + nettoie les espaces doubles
    var out = text;
    if (prenom) {
      out = out.replace(/\{prenom\}/g, prenom);
    } else {
      // Supprimer ", {prenom}" ou " {prenom}" en respectant la ponctuation
      out = out.replace(/,?\s*\{prenom\}/g, '');
    }
    out = out.replace(/\{streak\}/g, String(streak));
    out = out.replace(/\{goalName\}/g, goalName);
    // Nettoie les espaces multiples et les ". ." résiduels
    out = out.replace(/\s+/g, ' ').replace(/\s+\./g, '.').trim();
    return out;
  }

  // Entier stable calculé depuis une date YYYY-MM-DD (pour sélection déterministe)
  function dateSeed(dateStr) {
    if (!dateStr) return 0;
    var hash = 0;
    for (var i = 0; i < dateStr.length; i++) {
      hash = ((hash << 5) - hash) + dateStr.charCodeAt(i);
      hash |= 0;
    }
    return Math.abs(hash);
  }

  // Retourne YYYY-MM-DD pour une Date (locale)
  function formatDate(d) {
    d = d || new Date();
    var y = d.getFullYear();
    var m = String(d.getMonth() + 1).padStart(2, '0');
    var day = String(d.getDate()).padStart(2, '0');
    return y + '-' + m + '-' + day;
  }

  // ─── 6. SÉLECTION DE LA PHRASE DU JOUR ──────────────────────────────────────
  // Entrée : profile = { prenom, streak, isTrainingDay, goalName, date? }
  // Sortie : { title: 'SmartFitCoach', body: '…phrase…' }
  //
  // Priorité (déterministe, pas de random) :
  //  1. Streak milestone si le streak correspond à un palier exact
  //  2. Training day boost (1 fois sur 3 environ pour varier)
  //  3. Rest day boost (1 fois sur 3 environ)
  //  4. Sinon : rotation weekday
  function getDailyMotivation(profile) {
    profile = profile || {};
    var now = profile.date ? new Date(profile.date) : new Date();
    var dateStr = formatDate(now);
    var seed = dateSeed(dateStr);
    var weekday = now.getDay(); // 0 = dimanche

    var streak = typeof profile.streak === 'number' ? profile.streak : 0;
    var isTraining = !!profile.isTrainingDay;
    var isRest = profile.isTrainingDay === false; // explicitement non-entraînement

    var pickedText = null;
    var source = 'weekday';

    // Locale-aware pool selection: if EN is active and the external dict is loaded,
    // use English pools from /i18n/motivations-en.json. Fallback to FR pools.
    var _enDict = null;
    try {
      if (window.isEnglish && window.isEnglish() &&
          window._extI18N && window._extI18N.motivations) {
        _enDict = window._extI18N.motivations;
      }
    } catch(e) {}

    var DAY_KEYS = ['sunday','monday','tuesday','wednesday','thursday','friday','saturday'];
    var byWeekday = BY_WEEKDAY;
    var trainingDay = TRAINING_DAY;
    var restDay = REST_DAY;
    var streakMilestones = STREAK_MILESTONES;
    if (_enDict) {
      byWeekday = {};
      for (var _i = 0; _i < 7; _i++) {
        var _arr = _enDict[DAY_KEYS[_i]];
        byWeekday[_i] = (Array.isArray(_arr) && _arr.length) ? _arr : BY_WEEKDAY[_i];
      }
      if (Array.isArray(_enDict.training_day) && _enDict.training_day.length) trainingDay = _enDict.training_day;
      if (Array.isArray(_enDict.rest_day)     && _enDict.rest_day.length)     restDay     = _enDict.rest_day;
      if (_enDict.streaks && typeof _enDict.streaks === 'object') {
        streakMilestones = {};
        for (var _k in _enDict.streaks) {
          if (_enDict.streaks.hasOwnProperty(_k)) {
            var _v = _enDict.streaks[_k];
            streakMilestones[_k] = Array.isArray(_v) ? _v : [String(_v)];
          }
        }
      }
    }

    // 1. Milestone streak prioritaire
    if (streak > 0 && streakMilestones[streak] && streakMilestones[streak].length) {
      pickedText = streakMilestones[streak][seed % streakMilestones[streak].length];
      source = 'streak-' + streak;
    }

    // 2. Boost training day (env. 1 fois sur 3)
    if (!pickedText && isTraining && seed % 3 === 0 && trainingDay.length) {
      pickedText = trainingDay[seed % trainingDay.length];
      source = 'training';
    }

    // 3. Boost rest day (env. 1 fois sur 3)
    if (!pickedText && isRest && seed % 3 === 0 && restDay.length) {
      pickedText = restDay[seed % restDay.length];
      source = 'rest';
    }

    // 4. Rotation weekday (défaut)
    if (!pickedText) {
      var pool = byWeekday[weekday] || byWeekday[1];
      pickedText = pool[seed % pool.length];
      source = 'weekday-' + weekday;
    }

    var body = applyTemplate(pickedText, profile);
    // Titre élégant, pas d'emoji, pas de majuscules criantes
    var title = 'SmartFitCoach';

    return { title: title, body: body, _source: source, _date: dateStr };
  }

  // ─── 7. CALCUL HORAIRE PROCHAINE NOTIF ──────────────────────────────────────
  // Règle : Lun–Ven = 8h30, Sam–Dim = 10h00
  function getNextMotivationTime(fromDate) {
    var now = fromDate ? new Date(fromDate) : new Date();
    var target = new Date(now);

    function applyHour(d) {
      var day = d.getDay(); // 0 = dim, 6 = sam
      if (day === 0 || day === 6) {
        d.setHours(10, 0, 0, 0); // week-end : 10h
      } else {
        d.setHours(8, 30, 0, 0); // lun-ven : 8h30
      }
      return d;
    }

    applyHour(target);

    // Si l'heure du jour est déjà passée, planifier pour demain
    if (target.getTime() <= now.getTime()) {
      target.setDate(target.getDate() + 1);
      applyHour(target);
    }
    return target;
  }

  // ─── 8. EXPOSITION ──────────────────────────────────────────────────────────
  window.MOTIVATION_LIBRARY = {
    getDailyMotivation: getDailyMotivation,
    getNextMotivationTime: getNextMotivationTime,
    applyTemplate: applyTemplate,
    // Exposés pour test unitaire / inspection
    _pools: { byWeekday: BY_WEEKDAY, trainingDay: TRAINING_DAY, restDay: REST_DAY, streakMilestones: STREAK_MILESTONES },
    _count: (function() {
      var n = TRAINING_DAY.length + REST_DAY.length;
      for (var d = 0; d < 7; d++) n += (BY_WEEKDAY[d] || []).length;
      for (var m in STREAK_MILESTONES) if (STREAK_MILESTONES.hasOwnProperty(m)) n += STREAK_MILESTONES[m].length;
      return n;
    })()
  };
})();
