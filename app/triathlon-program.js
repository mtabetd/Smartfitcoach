// ─── TRIATHLON / IRONMAN PROGRAM ───────────────────────────────────────────
// Méthodes basées sur :
//   • Jan Frodeno   — 3× champion du monde IRONMAN (polarisé, brick hebdo)
//   • Patrick Lange — 2× champion du monde, record marathon Kona 2:39
//   • Daniela Ryf   — 5× championne IRONMAN, dominance vélo
//   • Mark Allen    — 6× champion Kona (méthode Maffetone, Z2 aérobie)
//   • Matt Fitzgerald — 80/20 Triathlon (80% Z1-Z2, 20% intensité)
//   • Joe Friel     — Triathlete's Training Bible (périodisation Base→Build→Peak)
// ─────────────────────────────────────────────────────────────────────────
(function() {

var TRIATHLON_GOALS = [
  {
    id: 'sprint', name: 'Sprint', icon: '⚡',
    desc: '750m nage · 20km vélo · 5km run',
    weeks: 8, swimM: 750, bikeKm: 20, runKm: 5,
    tag: '8 semaines · Idéal premier triathlon'
  },
  {
    id: 'olympic', name: 'Olympique', icon: '🏅',
    desc: '1,5km nage · 40km vélo · 10km run',
    weeks: 12, swimM: 1500, bikeKm: 40, runKm: 10,
    tag: '12 semaines · Distance officielle JO'
  },
  {
    id: 'half', name: 'Half IRONMAN 70.3', icon: '🔱',
    desc: '1,9km nage · 90km vélo · 21,1km run',
    weeks: 20, swimM: 1900, bikeKm: 90, runKm: 21.1,
    tag: '20 semaines · Le vrai défi d\'endurance'
  },
  {
    id: 'ironman', name: 'IRONMAN 140.6', icon: '🦁',
    desc: '3,8km nage · 180km vélo · 42,2km run',
    weeks: 24, swimM: 3800, bikeKm: 180, runKm: 42.2,
    tag: '24 semaines · La course la plus dure du monde'
  }
];

var TRIATHLON_LEVELS = [
  {
    id: 'beginner', name: 'Débutant', icon: '🟢',
    desc: 'Premier triathlon — objectif finisher, maîtriser les transitions',
    vol: 0.7
  },
  {
    id: 'intermediate', name: 'Intermédiaire', icon: '🔵',
    desc: 'Améliorer ses chronos, régularité sur les 3 disciplines',
    vol: 1.0
  },
  {
    id: 'advanced', name: 'Avancé', icon: '🟠',
    desc: 'Podium AG · Qualification Kona · Sub-10h IRONMAN',
    vol: 1.3
  },
  {
    id: 'elite', name: 'Elite', icon: '🔴',
    desc: 'Programme Jan Frodeno / Patrick Lange / Daniela Ryf',
    vol: 1.6
  }
];

window.TRIATHLON_GOALS = TRIATHLON_GOALS;
window.TRIATHLON_LEVELS = TRIATHLON_LEVELS;

// ─── PROGRAMME GENERATOR ────────────────────────────────────────────────────
function generateTriathlonProgram(goal, level, weakDiscipline) {
  var goalObj = null;
  for (var gi = 0; gi < TRIATHLON_GOALS.length; gi++) {
    if (TRIATHLON_GOALS[gi].id === goal) { goalObj = TRIATHLON_GOALS[gi]; break; }
  }
  if (!goalObj) goalObj = TRIATHLON_GOALS[1];

  var levelObj = null;
  for (var li = 0; li < TRIATHLON_LEVELS.length; li++) {
    if (TRIATHLON_LEVELS[li].id === level) { levelObj = TRIATHLON_LEVELS[li]; break; }
  }
  if (!levelObj) levelObj = TRIATHLON_LEVELS[1];

  var totalWeeks = goalObj.weeks;
  var vf = levelObj.vol; // volume factor
  var program = [];

  // ── Phase resolver ────────────────────────────────────────────────────────
  function getPhase(w) {
    var r = w / totalWeeks;
    if (totalWeeks <= 8) {
      if (w <= 2) return { name: 'Base', color: '#1A3A6A' };
      if (w <= 5) return { name: 'Build', color: '#E67E22' };
      if (w <= 7) return { name: 'Peak', color: '#C0392B' };
      return { name: 'Taper', color: '#27AE60' };
    }
    if (r <= 0.25) return { name: 'Base', color: '#1A3A6A' };
    if (r <= 0.50) return { name: 'Build 1', color: '#E67E22' };
    if (r <= 0.70) return { name: 'Build 2', color: '#D35400' };
    if (r <= 0.85) return { name: 'Peak', color: '#C0392B' };
    if (w < totalWeeks) return { name: 'Taper', color: '#27AE60' };
    return { name: 'Race Week', color: '#27AE60' };
  }

  // ── Volume-scaled duration helper ────────────────────────────────────────
  function mins(base) { return Math.round(base * vf) + 'min'; }
  function hours(base) {
    var h = (base * vf);
    if (h > Math.floor(h) + 0.05) return h.toFixed(1) + 'h';
    return Math.round(h) + 'h';
  }

  // ── Session builders ──────────────────────────────────────────────────────
  function swimTechnique(w) {
    return {
      discipline: 'swim', icon: '🏊', type: 'Natation — Technique',
      zone: 'Z1-Z2', name: 'Nage Technique & Drills',
      duration: mins(45),
      desc: 'Améliorer l\'efficacité natatoire — base Jan Frodeno & Mark Allen',
      detail: 'Éch. 200m libre facile · 4×50m Catch-Up drill · 4×50m Single-Arm · 4×50m Finger-Drag · 8×50m Z2 focus glisse · 4×50m Kick · 100m récup. "La technique sauve plus de watts que la musculation" — Jan Frodeno'
    };
  }
  function swimEndurance(w) {
    var reps = Math.min(16, Math.round((10 + w) * vf));
    return {
      discipline: 'swim', icon: '🏊', type: 'Natation — Endurance',
      zone: 'Z2', name: 'Nage Endurance Aérobie',
      duration: mins(55),
      desc: '80% de la séance en Z2 — méthode 80/20 Matt Fitzgerald',
      detail: 'Éch. 300m · ' + reps + '×100m Z2 départ toutes 2min · 4×50m sprints fins · 200m récup · "Nager lentement pour nager vite en course" — Mark Allen'
    };
  }
  function swimThreshold(w) {
    var cssReps = Math.min(10, Math.round(6 * vf));
    return {
      discipline: 'swim', icon: '🏊', type: 'Natation — Seuil CSS',
      zone: 'Z4', name: 'Nage Intervalles CSS',
      duration: mins(55),
      desc: 'Critical Swim Speed — méthode des pros de World Triathlon',
      detail: 'Éch. 400m · ' + cssReps + '×100m @ CSS (allure où tu peux tenir mais pas confortablement) · Récup 20s · 4×50m @ CSS - 5s/100m · 200m cool-down · Note ton temps moyen'
    };
  }
  function swimRaceSim() {
    return {
      discipline: 'swim', icon: '🏊', type: 'Simulation Course',
      zone: 'Z3-Z4', name: 'Nage — Simulation Race Distance',
      duration: Math.round(goalObj.swimM / 35) + 'min',
      desc: 'Distance course non-stop, navigation sighting — Jan Frodeno teste cela toutes les 2 semaines en Peak',
      detail: goalObj.swimM + 'm continu @ allure course · Pratiquer le sighting (lever la tête toutes les 8-10 brasses) · Porter néoprène si eau < 24°C · Simulation départ "open water" avec bouchées d\'eau'
    };
  }

  function bikeZ2(w) {
    var h = Math.min(3.5, (1.0 + w * 0.08) * vf);
    return {
      discipline: 'bike', icon: '🚴', type: 'Vélo — Endurance Z2',
      zone: 'Z2', name: 'Sortie Vélo Endurance',
      duration: h.toFixed(1) + 'h',
      desc: '80/20 : base aérobie Matt Fitzgerald — 80% du kilométrage vélo en Z2',
      detail: 'FC cible 65-75% FCmax · Cadence 85-95 rpm · Conversation possible · Ravitaillement 1 gel/45min pour sorties > 1h · "Le vélo gagne l\'IRONMAN, le run le perd" — Daniela Ryf'
    };
  }
  function bikeSweetspot(w) {
    return {
      discipline: 'bike', icon: '🚴', type: 'Vélo — Sweetspot',
      zone: 'Z3-Z4', name: 'Vélo Sweetspot (88-93% FTP)',
      duration: mins(75),
      desc: 'Zone la plus efficace pour développer le FTP — programme Jan Frodeno',
      detail: 'Éch. 15min Z1-Z2 · 2×20min @ 88-93% FTP ou effort 7.5/10 · Récup 3min Z1 entre chaque · 10min cool-down · Maintenir cadence 88-92 rpm · Sans capteur : "confortablement difficile"'
    };
  }
  function bikeThreshold(w) {
    return {
      discipline: 'bike', icon: '🚴', type: 'Vélo — Seuil Lactique',
      zone: 'Z4', name: 'Intervalles Seuil Vélo',
      duration: mins(70),
      desc: 'Repousser le seuil lactique — clé de la performance sur le vélo IRONMAN',
      detail: 'Éch. 15min · 4×8min @ seuil (FC 82-89% FCmax, effort 8/10) · Récup 4min Z1 entre · 10min cool-down · Cadence 90+ rpm · "4h au seuil change tout" — Patrick Lange'
    };
  }
  function bikeLong(w) {
    var maxH = { sprint: 1.5, olympic: 3.0, half: 4.5, ironman: 6.0 }[goal] || 4.0;
    var h = Math.min(maxH, (1.5 + w * 0.15) * vf);
    return {
      discipline: 'bike', icon: '🚴', type: 'Long Ride',
      zone: 'Z2', name: 'Sortie Vélo Longue',
      duration: h.toFixed(1) + 'h',
      desc: 'Pilier de l\'IRONMAN — Jan Frodeno roule 6h en Z2 les samedis en préparation',
      detail: 'Majorité Z2 · 30 dernières min @ allure course · Glucides 60-90g/h · Hydratation 600ml/h · Dernier quart en test nutritionnel complet · Vérifier position aéro si TT/triathlon'
    };
  }
  function bikeRacePace(w) {
    var raceMins = Math.round((goalObj.bikeKm / 35) * 60 * 0.45);
    return {
      discipline: 'bike', icon: '🚴', type: 'Allure Course Vélo',
      zone: 'Z3', name: 'Bloc Allure Course — Vélo',
      duration: raceMins + 'min',
      desc: 'Simulation allure compétition — calibrer son effort',
      detail: 'Éch. 20min · ' + Math.round(goalObj.bikeKm * 0.4) + 'km @ allure course cible · Cool-down 15min · Tester nutrition définitive · "Conserver 5-10% pour le run" — Jan Frodeno'
    };
  }

  function runEasy(w) {
    var m = Math.min(65, Math.round((28 + w * 3) * vf));
    return {
      discipline: 'run', icon: '🏃', type: 'Run — Facile Z2',
      zone: 'Z1-Z2', name: 'Run Facile — Base Aérobie',
      duration: m + 'min',
      desc: 'Patrick Lange court 85% de ses km en Z2 même en préparation intensive',
      detail: 'FC < 75% FCmax · Allure conversation · 4-6×20s "strides" à 90% allure en fin de sortie · "Si tu ne peux pas parler, tu vas trop vite" — Matt Fitzgerald'
    };
  }
  function runTempo(w) {
    return {
      discipline: 'run', icon: '🏃', type: 'Run — Tempo',
      zone: 'Z3-Z4', name: 'Run Tempo',
      duration: mins(50),
      desc: 'Développe le seuil lactique course — Patrick Lange : "le seuil fait le coureur"',
      detail: 'Éch. 10min Z1 · 20-25min @ allure seuil (7/10, parler difficile) · 10min cool-down Z1 · Alternative avancé : 2×15min tempo, 3min récup entre · FC cible 80-87% FCmax'
    };
  }
  function runIntervals(w) {
    var reps = Math.min(7, Math.round(5 * vf));
    return {
      discipline: 'run', icon: '🏃', type: 'Run — Intervalles',
      zone: 'Z4-Z5', name: 'Intervalles 1000m',
      duration: mins(55),
      desc: 'Améliorer VMA et économie de course — max 2×/semaine',
      detail: 'Éch. 15min · ' + reps + '×1000m @ allure 5K (FC 85-92% FCmax) · Récup 90s trot · 10min cool-down · "Les intervalles sont la cerise sur le gâteau, le Z2 c\'est le gâteau" — Joe Friel'
    };
  }
  function runLong(w) {
    var maxMin = { sprint: 50, olympic: 80, half: 110, ironman: 150 }[goal] || 90;
    var m = Math.min(maxMin, Math.round((40 + w * 5) * vf));
    return {
      discipline: 'run', icon: '🏃', type: 'Long Run',
      zone: 'Z2', name: 'Sortie Longue Course',
      duration: m + 'min',
      desc: 'Construire l\'endurance marathon de l\'IRONMAN — la clé de Patrick Lange',
      detail: 'Z2 tout au long · Ravitaillement dès 45min · Marcher 1min si FC monte > 80% · 10 dernières min @ allure course · "Le long run en Z2 fait le marathonien IRONMAN" — Patrick Lange, 2× champion'
    };
  }
  function runRacePace(w) {
    var m = Math.round((goalObj.runKm / 10) * 6 * 0.5);
    return {
      discipline: 'run', icon: '🏃', type: 'Allure Course Run',
      zone: 'Z3', name: 'Bloc Allure Course — Run',
      duration: m + 'min',
      desc: 'Calibrer l\'allure compétition, sentir son rythme cible',
      detail: Math.round(goalObj.runKm * 0.35) + 'km @ allure course cible · Nutrition identique à la course · Observer les sensations et la FC · Ne pas dépasser allure course'
    };
  }

  function brickShort(w) {
    return {
      discipline: 'brick', icon: '🔄', type: 'Brick Court',
      zone: 'Z2-Z3', name: 'Brick — Vélo + Run Transition',
      duration: '1h15',
      desc: 'LA séance signature du triathlon — Jan Frodeno fait un brick chaque semaine sans exception',
      detail: '45min vélo Z2-Z3 · T2 rapide (objectif < 90s) · 20min run off-the-bike Z2 · Les premières minutes les jambes sont lourdes → c\'est NORMAL · Observer comment la FC se stabilise · "Le brick hebdomadaire est non-négociable" — Jan Frodeno'
    };
  }
  function brickMedium(w) {
    var bikeH = { sprint: 1.0, olympic: 1.5, half: 2.0, ironman: 2.5 }[goal] || 2.0;
    var runMin = { sprint: 20, olympic: 25, half: 30, ironman: 35 }[goal] || 30;
    var bikeHScaled = (bikeH * vf).toFixed(1);
    return {
      discipline: 'brick', icon: '🔄', type: 'Brick Moyen',
      zone: 'Z2-Z3', name: 'Brick Spécifique Race',
      duration: bikeHScaled + 'h vélo + ' + runMin + 'min run',
      desc: 'Simulation partielle de course — test nutrition et transitions',
      detail: bikeHScaled + 'h vélo dont 30 dernières min @ allure course · T2 optimisée · ' + runMin + 'min run Z2-Z3 · Tester nutrition complète (gels, barres, boissons) · Vêtements race day · Observer comment le corps passe du vélo au run'
    };
  }
  function brickLong(w) {
    var bikeH = { sprint: 1.5, olympic: 2.5, half: 3.5, ironman: 5.0 }[goal] || 3.5;
    var runMin = { sprint: 25, olympic: 30, half: 40, ironman: 45 }[goal] || 35;
    var bikeHScaled = (bikeH * vf).toFixed(1);
    return {
      discipline: 'brick', icon: '🔄', type: 'Grand Brick',
      zone: 'Z2-Z3', name: 'Grand Brick — Race Simulation',
      duration: bikeHScaled + 'h vélo + ' + runMin + 'min run',
      desc: 'Entraînement le plus important de la semaine — "race day in training" Jan Frodeno',
      detail: bikeHScaled + 'h vélo @ allure course · T2 complète avec tout l\'équipement · ' + runMin + 'min run dont 20min @ allure course · Valider toute la stratégie nutritionnelle · "Si la nutrition fonctionne ici, elle fonctionnera le jour J" — Daniela Ryf'
    };
  }

  var REST = {
    discipline: 'rest', icon: '😴', type: 'Repos Complet',
    zone: '', name: 'Repos / Récupération',
    duration: '—',
    desc: 'Récupération complète. C\'est ici que l\'adaptation se produit.',
    detail: 'Optionnel : marche 20-30min, yoga, mobilité. Aucune intensité. "Le repos est un entraînement" — Jan Frodeno'
  };

  var REST_LIGHT = {
    discipline: 'rest', icon: '🧘', type: 'Repos Actif',
    zone: 'Z1', name: 'Récupération Active',
    duration: '20-30min',
    desc: 'Marche légère, mobilité, yoga — favoriser la récupération sans fatigue',
    detail: 'Marche 20min + mobilité hanches/épaules 10min ou yoga récupération'
  };

  // ── Weekly template builder ───────────────────────────────────────────────
  function buildWeek(w, phase, isDeload, isTaper) {
    var pname = phase.name;
    var factor = isTaper ? 0.5 : isDeload ? 0.65 : 1.0;
    var sessions = [];

    // Jours : Lun Mar Mer Jeu Ven Sam Dim
    if (pname === 'Base') {
      sessions = [
        Object.assign({ day: 'Lundi' }, swimTechnique(w)),
        Object.assign({ day: 'Mardi' }, bikeZ2(w)),
        Object.assign({ day: 'Mercredi' }, runEasy(w)),
        Object.assign({ day: 'Jeudi' }, swimEndurance(w)),
        Object.assign({ day: 'Vendredi' }, REST),
        Object.assign({ day: 'Samedi' }, brickShort(w)),
        Object.assign({ day: 'Dimanche' }, runLong(w))
      ];
    } else if (pname === 'Build' || pname === 'Build 1') {
      sessions = [
        Object.assign({ day: 'Lundi' }, swimEndurance(w)),
        Object.assign({ day: 'Mardi' }, bikeSweetspot(w)),
        Object.assign({ day: 'Mercredi' }, runTempo(w)),
        Object.assign({ day: 'Jeudi' }, swimThreshold(w)),
        Object.assign({ day: 'Vendredi' }, REST_LIGHT),
        Object.assign({ day: 'Samedi' }, brickMedium(w)),
        Object.assign({ day: 'Dimanche' }, runLong(w))
      ];
    } else if (pname === 'Build 2') {
      sessions = [
        Object.assign({ day: 'Lundi' }, swimThreshold(w)),
        Object.assign({ day: 'Mardi' }, bikeThreshold(w)),
        Object.assign({ day: 'Mercredi' }, runIntervals(w)),
        Object.assign({ day: 'Jeudi' }, swimEndurance(w)),
        Object.assign({ day: 'Vendredi' }, REST),
        Object.assign({ day: 'Samedi' }, brickLong(w)),
        Object.assign({ day: 'Dimanche' }, runLong(w))
      ];
    } else if (pname === 'Peak') {
      sessions = [
        Object.assign({ day: 'Lundi' }, swimRaceSim()),
        Object.assign({ day: 'Mardi' }, bikeRacePace(w)),
        Object.assign({ day: 'Mercredi' }, runTempo(w)),
        Object.assign({ day: 'Jeudi' }, swimThreshold(w)),
        Object.assign({ day: 'Vendredi' }, REST),
        Object.assign({ day: 'Samedi' }, brickLong(w)),
        Object.assign({ day: 'Dimanche' }, runRacePace(w))
      ];
    } else { // Taper / Race Week
      sessions = [
        Object.assign({ day: 'Lundi' }, swimTechnique(w)),
        Object.assign({ day: 'Mardi' }, bikeZ2(w)),
        Object.assign({ day: 'Mercredi' }, runEasy(w)),
        Object.assign({ day: 'Jeudi' }, swimRaceSim()),
        Object.assign({ day: 'Vendredi' }, REST),
        Object.assign({ day: 'Samedi' }, brickShort(w)),
        Object.assign({ day: 'Dimanche' }, {
          discipline: 'rest', icon: '🧘', type: 'Repos / Visualisation',
          zone: '', name: 'Récupération & Préparation Mentale',
          duration: '—',
          day: 'Dimanche',
          desc: 'Récupération totale — visualiser la course, préparer le matériel',
          detail: 'Repos complet · Vérifier équipement · Stratégie nutritionnelle finalisée · Visualisation positive (départ, T1, vélo, T2, run, arrivée) · "Les jambes qui demandent à courir = bon signe" — Jan Frodeno'
        })
      ];
    }

    // Extra session pour discipline faible (hors Taper)
    if (weakDiscipline && !isTaper && factor >= 1.0) {
      var bonusMap = {
        swim: Object.assign({ day: 'Bonus Natation' }, swimEndurance(w)),
        bike: Object.assign({ day: 'Bonus Vélo' }, bikeLong(w)),
        run: Object.assign({ day: 'Bonus Run' }, runEasy(w))
      };
      if (bonusMap[weakDiscipline]) sessions.push(bonusMap[weakDiscipline]);
    }

    // Réduction volume Taper / Deload
    if (factor < 1.0) {
      sessions = sessions.map(function(s) {
        var s2 = Object.assign({}, s);
        if (s2.duration && s2.duration !== '—') {
          var mMatch = s2.duration.match(/^(\d+)min/);
          if (mMatch) s2.duration = Math.round(parseInt(mMatch[1]) * factor) + 'min';
          var hMatch = s2.duration.match(/^(\d+(?:\.\d+)?)h/);
          if (hMatch) s2.duration = (parseFloat(hMatch[1]) * factor).toFixed(1) + 'h';
        }
        return s2;
      });
    }

    // Volume estimation
    var totalMins = 0;
    sessions.forEach(function(s) {
      if (!s.duration || s.duration === '—') return;
      var hm = s.duration.match(/(\d+(?:\.\d+)?)h/);
      if (hm) totalMins += parseFloat(hm[1]) * 60;
      var mm = s.duration.match(/(\d+)min/);
      if (mm) totalMins += parseInt(mm[1]);
    });

    // Notes de semaine
    var notes = '';
    if (isTaper) {
      notes = '🎯 Affûtage : volume -40-50%, maintenir quelques séances d\'intensité. "Les jambes fraiches arrivent à Kona" — Jan Frodeno.';
    } else if (isDeload) {
      notes = '📉 Semaine de récupération : volume -35%. Normal de se sentir "rouillé". C\'est le corps qui s\'adapte et progresse.';
    } else if (pname === 'Base') {
      notes = '🔷 Base : 80% en Z2. Si tu ne peux pas tenir une conversation, ralentis. "Low & slow builds the engine" — Mark Allen, 6× champion Kona.';
    } else if (pname === 'Build' || pname === 'Build 1') {
      notes = '🟡 Build 1 : max 2 séances intenses/semaine. Le reste en Z2. Sommeil 8h minimum selon Jan Frodeno.';
    } else if (pname === 'Build 2') {
      notes = '🟠 Build 2 : semaines les plus dures. "Train tired to race fresh" — Mirinda Carfrae, 3× championne Kona.';
    } else if (pname === 'Peak') {
      notes = '🔴 Peak : simuler la course — nutrition, équipement, rythme doivent être validés. Pas d\'expérimentation le jour J.';
    }

    return {
      week: w,
      phase: pname,
      phaseColor: phase.color,
      totalHours: (totalMins / 60).toFixed(1) + 'h',
      isDeload: isDeload,
      isTaper: isTaper,
      sessions: sessions,
      notes: notes
    };
  }

  // ── Generate all weeks ────────────────────────────────────────────────────
  for (var w = 1; w <= totalWeeks; w++) {
    var phase = getPhase(w);
    var pname = phase.name;
    // Masters 40+ : décharge toutes les 3 semaines (ACSM 2018) au lieu de 4
    var deloadFreq = (window.getAge && window.getAge() >= 40) ? 3 : 4;
    var isDeload = (w % deloadFreq === 0) && pname !== 'Taper' && pname !== 'Race Week' && pname !== 'Peak';
    var isTaper = pname === 'Taper' || pname === 'Race Week';
    // Masters 40+ : réduction volume 10% (récupération inter-session 72h minimum)
    if (window.getAge && window.getAge() >= 40 && !isTaper) vf = Math.min(vf, levelObj.vol * 0.9);
    program.push(buildWeek(w, phase, isDeload, isTaper));
  }

  return program;
}

window.generateTriathlonProgram = generateTriathlonProgram;

})();
