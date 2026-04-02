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
// opts = { swimPace, bikeSpeed, runPace, raceDate, ftp }
function generateTriathlonProgram(goal, level, weakDiscipline, opts) {
  opts = opts || {};

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

  // ── Weeks from raceDate ────────────────────────────────────────────────────
  var totalWeeks = goalObj.weeks;
  if (opts.raceDate) {
    try {
      var raceDateMs = new Date(opts.raceDate).getTime();
      var nowMs = Date.now();
      var diff = raceDateMs - nowMs;
      if (diff > 0) {
        var weeksFromDate = Math.floor(diff / (7 * 24 * 3600 * 1000));
        if (weeksFromDate >= 4 && weeksFromDate <= 52) totalWeeks = weeksFromDate;
      }
    } catch(e) {}
  }

  var vf = levelObj.vol; // volume factor
  var program = [];

  // ── Training zones from pace/speed/FTP ────────────────────────────────────
  // Swim zones (from CSS — Critical Swim Speed)
  var swimZones = null;
  if (opts.swimPace) {
    try {
      var sp = opts.swimPace.toString().split(':');
      var cssSec = parseInt(sp[0]) * 60 + parseInt(sp[1] || 0); // seconds per 100m
      swimZones = {
        z1: formatPace(Math.round(cssSec * 1.30)) + '/100m',
        z2: formatPace(Math.round(cssSec * 1.15)) + '/100m',
        z3: formatPace(Math.round(cssSec * 1.05)) + '/100m',
        z4: formatPace(Math.round(cssSec * 1.00)) + '/100m',
        z5: formatPace(Math.round(cssSec * 0.93)) + '/100m',
        css: formatPace(cssSec) + '/100m'
      };
    } catch(e) {}
  }
  // Bike zones (from FTP or from bikeSpeed)
  var bikeZones = null;
  var ftpVal = opts.ftp ? parseFloat(opts.ftp) : 0;
  var bikeSpeedVal = opts.bikeSpeed ? parseFloat(opts.bikeSpeed) : 0;
  if (ftpVal > 0) {
    bikeZones = {
      z1: Math.round(ftpVal * 0.55) + 'W',
      z2: Math.round(ftpVal * 0.65) + '-' + Math.round(ftpVal * 0.75) + 'W',
      z3: Math.round(ftpVal * 0.76) + '-' + Math.round(ftpVal * 0.87) + 'W',
      z4: Math.round(ftpVal * 0.88) + '-' + Math.round(ftpVal * 0.95) + 'W',
      z5: Math.round(ftpVal * 0.96) + '-' + Math.round(ftpVal * 1.05) + 'W',
      sweetspot: Math.round(ftpVal * 0.88) + '-' + Math.round(ftpVal * 0.93) + 'W',
      racePace: Math.round(ftpVal * 0.70) + '-' + Math.round(ftpVal * 0.78) + 'W (70.3) / ' + Math.round(ftpVal * 0.65) + '-' + Math.round(ftpVal * 0.72) + 'W (IM)'
    };
  } else if (bikeSpeedVal > 0) {
    bikeZones = {
      z1: Math.round(bikeSpeedVal * 0.65) + 'km/h',
      z2: Math.round(bikeSpeedVal * 0.75) + '-' + Math.round(bikeSpeedVal * 0.82) + 'km/h',
      z3: Math.round(bikeSpeedVal * 0.83) + '-' + Math.round(bikeSpeedVal * 0.89) + 'km/h',
      z4: Math.round(bikeSpeedVal * 0.90) + '-' + Math.round(bikeSpeedVal * 0.96) + 'km/h',
      z5: Math.round(bikeSpeedVal * 0.97) + '-' + Math.round(bikeSpeedVal * 1.05) + 'km/h',
      sweetspot: Math.round(bikeSpeedVal * 0.90) + '-' + Math.round(bikeSpeedVal * 0.95) + 'km/h',
      racePace: Math.round(bikeSpeedVal * 0.85) + '-' + Math.round(bikeSpeedVal * 0.92) + 'km/h'
    };
  }
  // Run zones (from threshold pace)
  var runZones = null;
  if (opts.runPace) {
    try {
      var rp = opts.runPace.toString().split(':');
      var threshSec = parseInt(rp[0]) * 60 + parseInt(rp[1] || 0); // seconds per km at threshold
      runZones = {
        z1: formatPace(Math.round(threshSec * 1.35)) + '/km',
        z2: formatPace(Math.round(threshSec * 1.20)) + '/km',
        z3: formatPace(Math.round(threshSec * 1.08)) + '/km',
        z4: formatPace(Math.round(threshSec * 1.00)) + '/km',
        z5: formatPace(Math.round(threshSec * 0.92)) + '/km',
        marathon: formatPace(Math.round(threshSec * 1.10)) + '/km',
        halfIM: formatPace(Math.round(threshSec * 1.05)) + '/km'
      };
    } catch(e) {}
  }

  // ── Helper: format seconds as mm:ss ────────────────────────────────────────
  function formatPace(secs) {
    var m = Math.floor(secs / 60);
    var s = secs % 60;
    return m + ':' + (s < 10 ? '0' : '') + s;
  }

  // ── Zone annotation helpers ────────────────────────────────────────────────
  function swimZ(zone) {
    if (!swimZones) return '';
    if (zone === 'z1') return ' (' + swimZones.z1 + ')';
    if (zone === 'z2') return ' (' + swimZones.z2 + ')';
    if (zone === 'z4' || zone === 'css') return ' (' + swimZones.css + ')';
    return '';
  }
  function bikeZ(zone) {
    if (!bikeZones) return '';
    if (zone === 'z2') return ' (' + bikeZones.z2 + ')';
    if (zone === 'z3') return ' (' + bikeZones.z3 + ')';
    if (zone === 'z4') return ' (' + bikeZones.z4 + ')';
    if (zone === 'sweetspot') return ' (' + bikeZones.sweetspot + ')';
    if (zone === 'race') return ' (' + bikeZones.racePace + ')';
    return '';
  }
  function runZ(zone) {
    if (!runZones) return '';
    if (zone === 'z1') return ' (' + runZones.z1 + ')';
    if (zone === 'z2') return ' (' + runZones.z2 + ')';
    if (zone === 'z4') return ' (' + runZones.z4 + ')';
    if (zone === 'marathon') return ' (' + runZones.marathon + ')';
    if (zone === 'half') return ' (' + runZones.halfIM + ')';
    return '';
  }

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
    var z2ann = swimZ('z2');
    return {
      discipline: 'swim', icon: '🏊', type: 'Natation — Technique',
      zone: 'Z1-Z2', name: 'Nage Technique & Drills',
      duration: mins(45),
      desc: 'Améliorer l\'efficacité natatoire — base Jan Frodeno & Mark Allen',
      detail: 'Éch. 200m libre facile · 4×50m Catch-Up drill · 4×50m Single-Arm · 4×50m Finger-Drag · 8×50m Z2' + z2ann + ' focus glisse · 4×50m Kick · 100m récup. "La technique sauve plus de watts que la musculation" — Jan Frodeno'
    };
  }
  function swimEndurance(w) {
    var reps = Math.min(16, Math.round((10 + w) * vf));
    var z2ann = swimZ('z2');
    return {
      discipline: 'swim', icon: '🏊', type: 'Natation — Endurance',
      zone: 'Z2', name: 'Nage Endurance Aérobie',
      duration: mins(55),
      desc: '80% de la séance en Z2 — méthode 80/20 Matt Fitzgerald',
      detail: 'Éch. 300m · ' + reps + '×100m Z2' + z2ann + ' départ toutes 2min · 4×50m sprints fins · 200m récup · "Nager lentement pour nager vite en course" — Mark Allen'
    };
  }
  function swimThreshold(w) {
    var cssReps = Math.min(10, Math.round(6 * vf));
    var cssann = swimZ('css');
    return {
      discipline: 'swim', icon: '🏊', type: 'Natation — Seuil CSS',
      zone: 'Z4', name: 'Nage Intervalles CSS',
      duration: mins(55),
      desc: 'Critical Swim Speed — méthode des pros de World Triathlon',
      detail: 'Éch. 400m · ' + cssReps + '×100m @ CSS' + cssann + ' (allure où tu peux tenir mais pas confortablement) · Récup 20s · 4×50m @ CSS - 5s/100m · 200m cool-down · Note ton temps moyen'
    };
  }
  function swimRaceSim() {
    var z3ann = swimZones ? ' (' + swimZones.z3 + ')' : '';
    return {
      discipline: 'swim', icon: '🏊', type: 'Simulation Course',
      zone: 'Z3-Z4', name: 'Nage — Simulation Race Distance',
      duration: Math.round(goalObj.swimM / 35) + 'min',
      desc: 'Distance course non-stop, navigation sighting — Jan Frodeno teste cela toutes les 2 semaines en Peak',
      detail: goalObj.swimM + 'm continu @ allure course' + z3ann + ' · Pratiquer le sighting (lever la tête toutes les 8-10 brasses) · Porter néoprène si eau < 24°C · Simulation départ "open water" avec bouchées d\'eau'
    };
  }
  function swimPyramid(w) {
    var cssann = swimZ('css');
    return {
      discipline: 'swim', icon: '🏊', type: 'Natation — Pyramide',
      zone: 'Z2-Z4', name: 'Pyramide de Nage',
      duration: mins(50),
      desc: 'Séance pyramidale — variété d\'allures pour développer l\'endurance de vitesse',
      detail: 'Éch. 200m · 100m-200m-300m-400m-300m-200m-100m @ Z2-Z3-Z4-Z3-Z2' + cssann + ' · Récup 20s entre · Cool-down 200m · Total ~2000m · Variation clé du plan Jan Frodeno'
    };
  }
  function swimKick(w) {
    return {
      discipline: 'swim', icon: '🏊', type: 'Natation — Jambes',
      zone: 'Z2-Z3', name: 'Séance Battements & Propulsion',
      duration: mins(40),
      desc: 'Développer la propulsion et la position du corps — fondamental pour économiser de l\'énergie',
      detail: 'Éch. 200m · 8×50m kick avec planche (effort 6/10) · 4×100m fartlek : 25m sprint / 75m Z1 · 4×50m swim tempo · 200m récup · "Un bon battement = moins de fatigue sur le vélo" — Daniela Ryf'
    };
  }
  function swimOpenWater(w) {
    var z2ann = swimZ('z2');
    return {
      discipline: 'swim', icon: '🏊', type: 'Natation — Open Water Skills',
      zone: 'Z2-Z3', name: 'Simulation Eau Libre',
      duration: mins(50),
      desc: 'Compétences en eau libre — indispensables pour les transitions et le départ en masse',
      detail: 'Idéalement en lac/mer ou en piscine avec peu de lignes · 400m Z2' + z2ann + ' sans regarder les lignes (sighting toutes les 8 brasses) · 4×200m avec sighting · 4×50m "start sprint" (simuler départ) · "L\'open water est un sport à part entière" — Jan Frodeno'
    };
  }
  function swimDescending(w) {
    var cssann = swimZ('css');
    return {
      discipline: 'swim', icon: '🏊', type: 'Natation — Décroissant',
      zone: 'Z3-Z5', name: 'Intervalles Décroissants',
      duration: mins(55),
      desc: 'Intervalles en vitesse croissante — améliore le recrutement rapide de fibres musculaires',
      detail: 'Éch. 300m · 5×200m décroissant (chaque 200m plus vite que le précédent) · Dernier @ CSS' + cssann + ' ou mieux · Récup 30s · 4×50m hard · Cool-down 200m'
    };
  }
  function swimLong(w) {
    var longDist = Math.min(goalObj.swimM, Math.round(500 + w * 100));
    var z2ann = swimZ('z2');
    return {
      discipline: 'swim', icon: '🏊', type: 'Natation — Longue Distance',
      zone: 'Z2', name: 'Nage Longue Continue',
      duration: Math.round(longDist / 30) + 'min',
      desc: 'Endurance de fond — construire la capacité aérobie natation',
      detail: longDist + 'm continu Z2' + z2ann + ' · Pas d\'arrêt · Respiration bilatérale · Cadence 55-65 cycles/min · Nutrition : eau seulement · "Le fondamental de toute préparation" — Mark Allen'
    };
  }
  function swimVO2(w) {
    var reps = Math.min(8, Math.round(5 * vf));
    var z5ann = swimZones ? ' (' + swimZones.z5 + ')' : '';
    return {
      discipline: 'swim', icon: '🏊', type: 'Natation — VO2max',
      zone: 'Z5', name: 'Intervalles VO2max Nage',
      duration: mins(50),
      desc: 'Développer la puissance aérobie maximale en nage — séance haute intensité',
      detail: 'Éch. 400m · ' + reps + '×50m @ allure max' + z5ann + ' · Récup 45s · 4×100m Z3 · Cool-down 300m · Max 1×/semaine · "Les 50m intenses changent ton CSS" — Programme World Triathlon'
    };
  }
  function swimFartlek(w) {
    var cssann = swimZ('css');
    return {
      discipline: 'swim', icon: '🏊', type: 'Natation — Fartlek',
      zone: 'Z2-Z4', name: 'Fartlek Nage',
      duration: mins(45),
      desc: 'Entraînement varié — alternance d\'allures pour briser la monotonie et stimuler l\'adaptation',
      detail: 'Éch. 200m · 20min fartlek : 1min Z3-Z4' + cssann + ' / 1min Z1-Z2, répété · 400m Z2 steady · Cool-down 200m · Session mentalement engageante — évite la monotonie des bassins'
    };
  }
  function swimStrength(w) {
    return {
      discipline: 'swim', icon: '🏊', type: 'Natation — Force & Pull',
      zone: 'Z3-Z4', name: 'Séance Pull & Force Bras',
      duration: mins(45),
      desc: 'Développer la force propulsive des bras — critical pour iron distance où les jambes se fatiguent',
      detail: 'Éch. 200m · 8×100m pull buoy (jambes isolées) @ Z3 · 4×50m paddles seul · 4×50m paddles + buoy · Cool-down 200m · Attention : max 2x/semaine avec paddles (risque épaule) — Consensus entraîneurs World Triathlon'
    };
  }
  function swimNegSplit(w) {
    var z3ann = swimZones ? ' (' + swimZones.z3 + ')' : '';
    var distHalf = Math.round(goalObj.swimM / 2);
    return {
      discipline: 'swim', icon: '🏊', type: 'Natation — Negative Split',
      zone: 'Z2-Z3', name: 'Course Simulation Negative Split',
      duration: Math.round(goalObj.swimM / 32) + 'min',
      desc: 'Simulation course avec deuxième moitié plus rapide — stratégie gagnante en triathlon',
      detail: distHalf + 'm Z2 détendu · ' + distHalf + 'm Z3' + z3ann + ' plus fort · La 2e moitié doit être ~5-8s/100m plus rapide · "La négative split sur le swim préserve énergie pour vélo" — Patrick Lange'
    };
  }
  function swimTT(w) {
    var dist = Math.round(goalObj.swimM * 0.3);
    return {
      discipline: 'swim', icon: '🏊', type: 'Natation — Test Chrono',
      zone: 'Z4-Z5', name: 'Time Trial Natation',
      duration: Math.round(dist / 35) + 15 + 'min',
      desc: 'Mesurer les progrès et calibrer les zones d\'entraînement',
      detail: 'Éch. 300m · ' + dist + 'm time trial effort max soutenu · Chrono et note allure/100m · Cool-down 200m · Recalcule ton CSS = cette allure × 1.0 · Faire toutes les 4-6 semaines'
    };
  }
  function swimContinuous(w) {
    var dist = Math.round(goalObj.swimM * 0.6 + w * 30);
    var z2ann = swimZ('z2');
    return {
      discipline: 'swim', icon: '🏊', type: 'Natation — Continu Progressif',
      zone: 'Z2-Z3', name: 'Nage Continue Progressive',
      duration: Math.round(dist / 32) + 'min',
      desc: 'Endurance progressive — augmenter le volume au fil du programme',
      detail: dist + 'm en Z2' + z2ann + ' · Première 1/3 facile · Deuxième 1/3 Z2 soutenu · Dernier 1/3 légèrement plus fort · Aucun arrêt · "Le volume de nage fait la natation" — Daniela Ryf'
    };
  }

  function bikeZ2(w) {
    var h = Math.min(3.5, (1.0 + w * 0.08) * vf);
    var z2ann = bikeZ('z2');
    return {
      discipline: 'bike', icon: '🚴', type: 'Vélo — Endurance Z2',
      zone: 'Z2', name: 'Sortie Vélo Endurance',
      duration: h.toFixed(1) + 'h',
      desc: '80/20 : base aérobie Matt Fitzgerald — 80% du kilométrage vélo en Z2',
      detail: 'FC cible 65-75% FCmax · Z2' + z2ann + ' · Cadence 85-95 rpm · Conversation possible · Ravitaillement 1 gel/45min pour sorties > 1h · "Le vélo gagne l\'IRONMAN, le run le perd" — Daniela Ryf'
    };
  }
  function bikeSweetspot(w) {
    var ssann = bikeZ('sweetspot');
    return {
      discipline: 'bike', icon: '🚴', type: 'Vélo — Sweetspot',
      zone: 'Z3-Z4', name: 'Vélo Sweetspot (88-93% FTP)',
      duration: mins(75),
      desc: 'Zone la plus efficace pour développer le FTP — programme Jan Frodeno',
      detail: 'Éch. 15min Z1-Z2 · 2×20min @ 88-93% FTP' + ssann + ' ou effort 7.5/10 · Récup 3min Z1 entre chaque · 10min cool-down · Maintenir cadence 88-92 rpm · Sans capteur : "confortablement difficile"'
    };
  }
  function bikeThreshold(w) {
    var z4ann = bikeZ('z4');
    return {
      discipline: 'bike', icon: '🚴', type: 'Vélo — Seuil Lactique',
      zone: 'Z4', name: 'Intervalles Seuil Vélo',
      duration: mins(70),
      desc: 'Repousser le seuil lactique — clé de la performance sur le vélo IRONMAN',
      detail: 'Éch. 15min · 4×8min @ seuil' + z4ann + ' (FC 82-89% FCmax, effort 8/10) · Récup 4min Z1 entre · 10min cool-down · Cadence 90+ rpm · "4h au seuil change tout" — Patrick Lange'
    };
  }
  function bikeLong(w) {
    var maxH = { sprint: 1.5, olympic: 3.0, half: 4.5, ironman: 6.0 }[goal] || 4.0;
    var h = Math.min(maxH, (1.5 + w * 0.15) * vf);
    var z2ann = bikeZ('z2');
    return {
      discipline: 'bike', icon: '🚴', type: 'Long Ride',
      zone: 'Z2', name: 'Sortie Vélo Longue',
      duration: h.toFixed(1) + 'h',
      desc: 'Pilier de l\'IRONMAN — Jan Frodeno roule 6h en Z2 les samedis en préparation',
      detail: 'Majorité Z2' + z2ann + ' · 30 dernières min @ allure course · Glucides 60-90g/h · Hydratation 600ml/h · Dernier quart en test nutritionnel complet · Vérifier position aéro si TT/triathlon'
    };
  }
  function bikeRacePace(w) {
    var raceMins = Math.round((goalObj.bikeKm / 35) * 60 * 0.45);
    var raceann = bikeZ('race');
    return {
      discipline: 'bike', icon: '🚴', type: 'Allure Course Vélo',
      zone: 'Z3', name: 'Bloc Allure Course — Vélo',
      duration: raceMins + 'min',
      desc: 'Simulation allure compétition — calibrer son effort',
      detail: 'Éch. 20min · ' + Math.round(goalObj.bikeKm * 0.4) + 'km @ allure course cible' + raceann + ' · Cool-down 15min · Tester nutrition définitive · "Conserver 5-10% pour le run" — Jan Frodeno'
    };
  }
  function bikeVO2(w) {
    var reps = Math.min(6, Math.round(4 * vf));
    var z5ann = bikeZones ? ' (' + (bikeZones.z5 || '') + ')' : '';
    return {
      discipline: 'bike', icon: '🚴', type: 'Vélo — VO2max',
      zone: 'Z5', name: 'Intervalles VO2max Vélo',
      duration: mins(65),
      desc: 'Améliorer la puissance aérobie maximale — élève le plafond de toutes les zones',
      detail: 'Éch. 15min Z1-Z2 · ' + reps + '×3min @ VO2max' + z5ann + ' (effort 9/10) · Récup 3min Z1 · Cool-down 15min · Cadence libre · "Le VO2max élève toutes les zones" — Joe Friel'
    };
  }
  function bikeRecovery(w) {
    var z1ann = bikeZones ? ' (' + bikeZones.z1 + ')' : '';
    return {
      discipline: 'bike', icon: '🚴', type: 'Vélo — Récupération Active',
      zone: 'Z1', name: 'Vélo Récupération Facile',
      duration: mins(45),
      desc: 'Séance de récupération active — favoriser la circulation sanguine sans stress',
      detail: 'Z1 strict' + z1ann + ' · Cadence élevée 90-100 rpm · Jamais inconfortable · En home trainer si possible · "Une journée facile doit être vraiment facile" — Matt Fitzgerald'
    };
  }
  function bikeFTP(w) {
    var z4ann = bikeZ('z4');
    var desc = ftpVal > 0 ? 'FTP actuel : ' + ftpVal + 'W · Objectif +5% en 8 semaines' : 'Calibrer ton FTP — base de tout entraînement structuré vélo';
    return {
      discipline: 'bike', icon: '🚴', type: 'Vélo — Test FTP',
      zone: 'Z4-Z5', name: 'Test FTP 20min',
      duration: mins(60),
      desc: desc,
      detail: 'Éch. 15min progressif · 5min @ 95% FTP effort max · Récup 5min · 20min TIME TRIAL effort constant le plus fort possible · FTP = résultat × 0.95 · Cool-down 15min · Z4 cible' + z4ann + ' · Faire toutes les 4-6 semaines'
    };
  }
  function bikeTempo(w) {
    var z3ann = bikeZ('z3');
    return {
      discipline: 'bike', icon: '🚴', type: 'Vélo — Tempo',
      zone: 'Z3', name: 'Vélo Tempo Continu',
      duration: mins(70),
      desc: 'Zone d\'économie de course — développe l\'efficacité à allure triathlon',
      detail: 'Éch. 10min Z1 · 40min Z3 continu' + z3ann + ' · 10min cool-down · Cadence 85-90 rpm · Maintenir effort constant · Ne pas monter en Z4 · "Le tempo fait le triathlete d\'endurance" — Daniela Ryf'
    };
  }
  function bikeClimbs(w) {
    var z4ann = bikeZ('z4');
    return {
      discipline: 'bike', icon: '🚴', type: 'Vélo — Force & Côtes',
      zone: 'Z3-Z4', name: 'Répétitions en Côtes',
      duration: mins(75),
      desc: 'Développer la force musculaire et la puissance en côte — clé sur les courses vallonnées',
      detail: 'Éch. 15min plat · 6-8× côte 3-5min @ Z3-Z4' + z4ann + ' (cadence 60-70 rpm, force sur les pédales) · Redescente récup · 10min cool-down · Alternative home trainer : 8×3min 50 rpm @ Z4 · "La force de côte vient de la spécificité" — Jan Frodeno'
    };
  }
  function bikeAero(w) {
    var z2ann = bikeZ('z2');
    var z3ann = bikeZ('z3');
    return {
      discipline: 'bike', icon: '🚴', type: 'Vélo — Position Aéro',
      zone: 'Z2-Z3', name: 'Entraînement Position Aéro',
      duration: mins(80),
      desc: 'Habituer le corps à la position TT — réduire la résistance aérodynamique',
      detail: 'Éch. 10min position normale · 30min Z2-Z3 en position aéro' + z2ann + ' · 5min normale · 20min aéro Z3' + z3ann + ' · 15min cool-down · Alterner toutes les 10-15min au début · "Chaque % d\'aéro économisé sur le vélo = énergie pour le run" — Daniela Ryf champion Kona'
    };
  }
  function bikeSpikeIntervals(w) {
    var reps = Math.min(8, Math.round(5 * vf));
    var ssann = bikeZ('sweetspot');
    return {
      discipline: 'bike', icon: '🚴', type: 'Vélo — Over-Unders',
      zone: 'Z3-Z5', name: 'Over-Under Intervals (Seuil)',
      duration: mins(75),
      desc: 'Séance avancée — alterner au-dessus et en-dessous du seuil pour repousser les limites lactiques',
      detail: 'Éch. 15min · ' + reps + '×(2min Z5 + 3min Z2) · Récup 5min entre sets · Cool-down 15min · Sweetspot de référence' + ssann + ' · Séance Jan Frodeno "Over-Under" — signature Build 2'
    };
  }
  function bikeMountainRide(w) {
    var h = Math.min(4.0, (2.0 + w * 0.1) * vf);
    var z2ann = bikeZ('z2');
    return {
      discipline: 'bike', icon: '🚴', type: 'Vélo — Sortie Montagne',
      zone: 'Z2-Z3', name: 'Grande Sortie Vallonnée',
      duration: h.toFixed(1) + 'h',
      desc: 'Endurance avec dénivelé — renforcer la résistance musculaire et la technique de descente',
      detail: h.toFixed(1) + 'h majoritairement Z2' + z2ann + ' avec montées naturelles en Z3-Z4 · Technique descente prudente · Nutrition 60-90g glucides/h · Ravitaillement real-food si > 3h · "La vraie endurance se construit sur les routes vallonnées" — Frodeno Kona prep'
    };
  }
  function bikeShort(w) {
    var z2ann = bikeZ('z2');
    return {
      discipline: 'bike', icon: '🚴', type: 'Vélo — Activation',
      zone: 'Z1-Z2', name: 'Vélo d\'Activation Courte',
      duration: mins(35),
      desc: 'Séance courte d\'activation avant la course ou après une session intense',
      detail: 'Éch. 5min Z1 · 20min Z2' + z2ann + ' cadence 95-100 rpm · 8×30s accélérations douces · 5min Z1 · "Activer sans fatiguer" — Joe Friel dans Triathlon Training Bible'
    };
  }
  function bikePaceRaceSpecific(w) {
    var raceH = (goalObj.bikeKm / 35).toFixed(1);
    var raceann = bikeZ('race');
    return {
      discipline: 'bike', icon: '🚴', type: 'Vélo — Race Spécifique',
      zone: 'Z3', name: 'Bloc Spécifique Course ' + goalObj.name,
      duration: Math.round(parseFloat(raceH) * 0.6 * 60) + 'min',
      desc: 'Simulation de la portion vélo de votre course — calibrer allure et nutrition',
      detail: Math.round(goalObj.bikeKm * 0.55) + 'km @ allure course cible' + raceann + ' · Nutrition complète race day · Porter combi/casque · Allure objectif : ' + raceH + 'h pour ' + goalObj.bikeKm + 'km · "Réserver 10-15% d\'énergie pour le run" — Lange & Frodeno'
    };
  }

  function runEasy(w) {
    var m = Math.min(65, Math.round((28 + w * 3) * vf));
    var z2ann = runZ('z2');
    return {
      discipline: 'run', icon: '🏃', type: 'Run — Facile Z2',
      zone: 'Z1-Z2', name: 'Run Facile — Base Aérobie',
      duration: m + 'min',
      desc: 'Patrick Lange court 85% de ses km en Z2 même en préparation intensive',
      detail: 'FC < 75% FCmax · Z2' + z2ann + ' · Allure conversation · 4-6×20s "strides" à 90% allure en fin de sortie · "Si tu ne peux pas parler, tu vas trop vite" — Matt Fitzgerald'
    };
  }
  function runTempo(w) {
    var z4ann = runZ('z4');
    return {
      discipline: 'run', icon: '🏃', type: 'Run — Tempo',
      zone: 'Z3-Z4', name: 'Run Tempo',
      duration: mins(50),
      desc: 'Développe le seuil lactique course — Patrick Lange : "le seuil fait le coureur"',
      detail: 'Éch. 10min Z1 · 20-25min @ allure seuil' + z4ann + ' (7/10, parler difficile) · 10min cool-down Z1 · Alternative avancé : 2×15min tempo, 3min récup entre · FC cible 80-87% FCmax'
    };
  }
  function runIntervals(w) {
    var reps = Math.min(7, Math.round(5 * vf));
    var z5ann = runZones ? ' (' + runZones.z5 + ')' : '';
    return {
      discipline: 'run', icon: '🏃', type: 'Run — Intervalles',
      zone: 'Z4-Z5', name: 'Intervalles 1000m',
      duration: mins(55),
      desc: 'Améliorer VMA et économie de course — max 2×/semaine',
      detail: 'Éch. 15min · ' + reps + '×1000m @ allure 5K' + z5ann + ' (FC 85-92% FCmax) · Récup 90s trot · 10min cool-down · "Les intervalles sont la cerise sur le gâteau, le Z2 c\'est le gâteau" — Joe Friel'
    };
  }
  function runLong(w) {
    var maxMin = { sprint: 50, olympic: 80, half: 110, ironman: 150 }[goal] || 90;
    var m = Math.min(maxMin, Math.round((40 + w * 5) * vf));
    var z2ann = runZ('z2');
    return {
      discipline: 'run', icon: '🏃', type: 'Long Run',
      zone: 'Z2', name: 'Sortie Longue Course',
      duration: m + 'min',
      desc: 'Construire l\'endurance marathon de l\'IRONMAN — la clé de Patrick Lange',
      detail: 'Z2 tout au long' + z2ann + ' · Ravitaillement dès 45min · Marcher 1min si FC monte > 80% · 10 dernières min @ allure course · "Le long run en Z2 fait le marathonien IRONMAN" — Patrick Lange, 2× champion'
    };
  }
  function runRacePace(w) {
    var m = Math.round((goalObj.runKm / 10) * 6 * 0.5);
    var raceann = (goal === 'ironman' || goal === 'half') ? runZ('marathon') : runZ('z3');
    return {
      discipline: 'run', icon: '🏃', type: 'Allure Course Run',
      zone: 'Z3', name: 'Bloc Allure Course — Run',
      duration: m + 'min',
      desc: 'Calibrer l\'allure compétition, sentir son rythme cible',
      detail: Math.round(goalObj.runKm * 0.35) + 'km @ allure course cible' + raceann + ' · Nutrition identique à la course · Observer les sensations et la FC · Ne pas dépasser allure course'
    };
  }
  function runStrides(w) {
    var z2ann = runZ('z2');
    return {
      discipline: 'run', icon: '🏃', type: 'Run — Strides & Économie',
      zone: 'Z1-Z3', name: 'Run avec Strides — Économie de Course',
      duration: mins(40),
      desc: 'Améliorer l\'efficacité neurologique de la foulée — clé de l\'économie de course',
      detail: 'Éch. 15min Z1-Z2' + z2ann + ' · 8×20-25s "strides" (accélérations progressives à 85-90% max) · Récup 60s marche entre · 10min cool-down · Cadence cible 170-180 pas/min · "Les strides rendent le Z2 plus économique" — Matt Fitzgerald'
    };
  }
  function runHills(w) {
    var reps = Math.min(10, Math.round(6 * vf));
    return {
      discipline: 'run', icon: '🏃', type: 'Run — Force en Côtes',
      zone: 'Z3-Z4', name: 'Répétitions Côtes',
      duration: mins(55),
      desc: 'Développer la force et la puissance musculaire — améliore l\'économie de course sur plat',
      detail: 'Éch. 15min Z1-Z2 · ' + reps + '× côte 45-60s @ effort 8/10 (Z4) · Redescente jogging récup · 10min cool-down · Genoux hauts, corps incliné en avant · "La course en côte est du renforcement qui court" — Patrick Lange'
    };
  }
  function run400s(w) {
    var reps = Math.min(12, Math.round(8 * vf));
    var z5ann = runZones ? ' (' + runZones.z5 + ')' : '';
    return {
      discipline: 'run', icon: '🏃', type: 'Run — Intervalles Courts',
      zone: 'Z4-Z5', name: 'Répétitions 400m',
      duration: mins(50),
      desc: 'Développer la vitesse et VMA — améliore le plafond de toutes les zones',
      detail: 'Éch. 15min · ' + reps + '×400m @ allure 1500m' + z5ann + ' (FC 88-95% FCmax) · Récup 90s · 10min cool-down · Foulée haute, cadence rapide · 1× max / semaine en période Build'
    };
  }
  function runNegSplit(w) {
    var halfann = runZ('half');
    var dist = Math.round(goalObj.runKm * 0.35);
    return {
      discipline: 'run', icon: '🏃', type: 'Run — Negative Split',
      zone: 'Z2-Z3', name: 'Run Negative Split',
      duration: mins(55),
      desc: 'Apprendre à courir la 2e moitié plus vite — stratégie gagnante de Lange et Frodeno',
      detail: Math.round(dist / 2) + 'km Z2 · ' + Math.round(dist / 2) + 'km Z3' + halfann + ' progressif · Dernier 2km @ allure course · "Commencer lent et finir fort — pas l\'inverse" — Patrick Lange, marathon Kona 2:39'
    };
  }
  function runRecovery(w) {
    var z1ann = runZones ? ' (' + runZones.z1 + ')' : '';
    return {
      discipline: 'run', icon: '🏃', type: 'Run — Récupération',
      zone: 'Z1', name: 'Jogging de Récupération',
      duration: mins(30),
      desc: 'Favoriser la récupération active — circulation sanguine sans stress',
      detail: 'Z1 strict' + z1ann + ' · FC max 65% FCmax · Allure très facile · 4-5min marche si besoin · "La récupération active vaut mieux que le canapé" — Joe Friel'
    };
  }
  function runMarathonPace(w) {
    var marathonann = runZ('marathon');
    var dist = Math.round(goalObj.runKm * 0.4);
    return {
      discipline: 'run', icon: '🏃', type: 'Run — Allure Marathon/Course',
      zone: 'Z2-Z3', name: 'Blocs Allure Marathon (off-bike)',
      duration: mins(60),
      desc: 'Habituer les muscles à l\'allure course après effort vélo — préparation IRONMAN clé',
      detail: 'Éch. 10min · ' + dist + 'km @ allure marathon' + marathonann + ' · Cool-down 10min · Nutrition identique course · Chaussures de course · Simuler la fatigue du vélo en courant le soir d\'une sortie vélo matinale'
    };
  }
  function runFartlek(w) {
    var z4ann = runZ('z4');
    return {
      discipline: 'run', icon: '🏃', type: 'Run — Fartlek',
      zone: 'Z2-Z4', name: 'Fartlek Course',
      duration: mins(48),
      desc: 'Entraînement par effort perçu — sans montre, pure sensations',
      detail: 'Éch. 10min Z1 · 25min fartlek : accélérations 1-3min selon terrain/envie · Retour Z2 entre · Inclure 2-3 accélérations dures Z4' + z4ann + ' · Cool-down 10min · "Courir par plaisir reste la base" — Jan Frodeno'
    };
  }
  function runOffBike(w) {
    var z2ann = runZ('z2');
    return {
      discipline: 'run', icon: '🏃', type: 'Run Off the Bike',
      zone: 'Z1-Z2', name: 'Run de Transition (Post-Vélo)',
      duration: mins(25),
      desc: 'Habituer les jambes au passage vélo → course — neurologique et musculaire',
      detail: 'Immédiatement après vélo · 25min Z2 max' + z2ann + ' · Les 5 premières min semblent lourdes = NORMAL · Cadence 170+ pas/min · Objectif = sentir la transition, pas performer · "Le corps apprend à courir fatigué" — Jan Frodeno'
    };
  }
  function runVO2(w) {
    var reps = Math.min(5, Math.round(3 * vf));
    var z5ann = runZones ? ' (' + runZones.z5 + ')' : '';
    return {
      discipline: 'run', icon: '🏃', type: 'Run — VO2max',
      zone: 'Z5', name: 'Intervalles VO2max Course',
      duration: mins(55),
      desc: 'Développer la puissance aérobie maximale — plafond de progression',
      detail: 'Éch. 15min · ' + reps + '×5min @ allure 3K-5K' + z5ann + ' · Récup 3min Z1 · Cool-down 15min · Max 1×/semaine · Ne pas faire pendant Taper · "Le VO2 élève toute la courbe" — Joe Friel'
    };
  }
  function runT2Practice(w) {
    var z2ann = runZ('z2');
    return {
      discipline: 'run', icon: '🏃', type: 'Run — Pratique T2',
      zone: 'Z2', name: 'Entraînement Transition T2',
      duration: mins(35),
      desc: 'Optimiser la transition vélo-course — économiser 30-60s sur la course',
      detail: '3-4 répétitions de T2 · Simul. retrait chaussures vélo · Enfiler chaussures course · Casque/lunettes · Partir en courant Z2' + z2ann + ' · Chrono chaque T2 · Objectif : T2 < 90s · "Une bonne T2 peut faire ou défaire ta course" — Daniela Ryf'
    };
  }

  function brickShort(w) {
    var z2bikeann = bikeZ('z2');
    var z2runann = runZ('z2');
    return {
      discipline: 'brick', icon: '🔄', type: 'Brick Court',
      zone: 'Z2-Z3', name: 'Brick — Vélo + Run Transition',
      duration: '1h15',
      desc: 'LA séance signature du triathlon — Jan Frodeno fait un brick chaque semaine sans exception',
      detail: '45min vélo Z2-Z3' + z2bikeann + ' · T2 rapide (objectif < 90s) · 20min run off-the-bike Z2' + z2runann + ' · Les premières minutes les jambes sont lourdes → c\'est NORMAL · Observer comment la FC se stabilise · "Le brick hebdomadaire est non-négociable" — Jan Frodeno'
    };
  }
  function brickMedium(w) {
    var bikeH = { sprint: 1.0, olympic: 1.5, half: 2.0, ironman: 2.5 }[goal] || 2.0;
    var runMin = { sprint: 20, olympic: 25, half: 30, ironman: 35 }[goal] || 30;
    var bikeHScaled = (bikeH * vf).toFixed(1);
    var z2bikeann = bikeZ('z2');
    var z2runann = runZ('z2');
    return {
      discipline: 'brick', icon: '🔄', type: 'Brick Moyen',
      zone: 'Z2-Z3', name: 'Brick Spécifique Race',
      duration: bikeHScaled + 'h vélo + ' + runMin + 'min run',
      desc: 'Simulation partielle de course — test nutrition et transitions',
      detail: bikeHScaled + 'h vélo' + z2bikeann + ' dont 30 dernières min @ allure course · T2 optimisée · ' + runMin + 'min run Z2-Z3' + z2runann + ' · Tester nutrition complète (gels, barres, boissons) · Vêtements race day · Observer comment le corps passe du vélo au run'
    };
  }
  function brickLong(w) {
    var bikeH = { sprint: 1.5, olympic: 2.5, half: 3.5, ironman: 5.0 }[goal] || 3.5;
    var runMin = { sprint: 25, olympic: 30, half: 40, ironman: 45 }[goal] || 35;
    var bikeHScaled = (bikeH * vf).toFixed(1);
    var racebikeann = bikeZ('race');
    var marathonann = runZ('marathon');
    return {
      discipline: 'brick', icon: '🔄', type: 'Grand Brick',
      zone: 'Z2-Z3', name: 'Grand Brick — Race Simulation',
      duration: bikeHScaled + 'h vélo + ' + runMin + 'min run',
      desc: 'Entraînement le plus important de la semaine — "race day in training" Jan Frodeno',
      detail: bikeHScaled + 'h vélo @ allure course' + racebikeann + ' · T2 complète avec tout l\'équipement · ' + runMin + 'min run dont 20min @ allure course' + marathonann + ' · Valider toute la stratégie nutritionnelle · "Si la nutrition fonctionne ici, elle fonctionnera le jour J" — Daniela Ryf'
    };
  }
  function brickT1Practice(w) {
    var z2bikeann = bikeZ('z2');
    return {
      discipline: 'brick', icon: '🔄', type: 'Brick — Pratique T1',
      zone: 'Z2', name: 'Brick Transition T1 — Nage + Vélo',
      duration: '1h',
      desc: 'Optimiser la transition natation-vélo — souvent négligée, peut économiser 1-2 minutes',
      detail: '20min nage ou simulé · T1 complète (néoprène si applicable, casque, chaussures) · 35-40min vélo Z2' + z2bikeann + ' · Pratiquer T1 3× · Objectif T1 < 2min · "Une T1 parfaite se répète 100 fois à l\'entraînement" — Jan Frodeno'
    };
  }
  function brickRaceDay(w) {
    var racebikeann = bikeZ('race');
    var halfann = runZ('half');
    var bikeH = { sprint: 0.5, olympic: 1.0, half: 2.0, ironman: 3.5 }[goal] || 2.0;
    var runMin = { sprint: 15, olympic: 25, half: 35, ironman: 40 }[goal] || 30;
    return {
      discipline: 'brick', icon: '🔄', type: 'Brick — Race Day Complet',
      zone: 'Z3', name: 'Répétition Générale Race Day',
      duration: bikeH.toFixed(1) + 'h vélo + ' + runMin + 'min run',
      desc: 'Répétition générale complète — dernier grand test avant la course',
      detail: 'Équipement race day complet · ' + bikeH.toFixed(1) + 'h vélo @ allure course' + racebikeann + ' · T2 < 90s · ' + runMin + 'min run @ allure cible' + halfann + ' · Nutrition exacte du jour J · "Le jour le plus important de la préparation" — Jan Frodeno, 3× champion monde'
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
    // Rotation modulo to vary sessions within same phase across weeks
    var rot = w % 3; // 0, 1, 2

    // Jours : Lun Mar Mer Jeu Ven Sam Dim
    if (pname === 'Base') {
      if (rot === 0) {
        sessions = [
          Object.assign({ day: 'Lundi' }, swimTechnique(w)),
          Object.assign({ day: 'Mardi' }, bikeZ2(w)),
          Object.assign({ day: 'Mercredi' }, runEasy(w)),
          Object.assign({ day: 'Jeudi' }, swimEndurance(w)),
          Object.assign({ day: 'Vendredi' }, REST),
          Object.assign({ day: 'Samedi' }, brickShort(w)),
          Object.assign({ day: 'Dimanche' }, runLong(w))
        ];
      } else if (rot === 1) {
        sessions = [
          Object.assign({ day: 'Lundi' }, swimKick(w)),
          Object.assign({ day: 'Mardi' }, bikeRecovery(w)),
          Object.assign({ day: 'Mercredi' }, runStrides(w)),
          Object.assign({ day: 'Jeudi' }, swimLong(w)),
          Object.assign({ day: 'Vendredi' }, REST),
          Object.assign({ day: 'Samedi' }, brickShort(w)),
          Object.assign({ day: 'Dimanche' }, runLong(w))
        ];
      } else {
        sessions = [
          Object.assign({ day: 'Lundi' }, swimTechnique(w)),
          Object.assign({ day: 'Mardi' }, bikeAero(w)),
          Object.assign({ day: 'Mercredi' }, runEasy(w)),
          Object.assign({ day: 'Jeudi' }, swimOpenWater(w)),
          Object.assign({ day: 'Vendredi' }, REST),
          Object.assign({ day: 'Samedi' }, brickT1Practice(w)),
          Object.assign({ day: 'Dimanche' }, runLong(w))
        ];
      }
    } else if (pname === 'Build' || pname === 'Build 1') {
      if (rot === 0) {
        sessions = [
          Object.assign({ day: 'Lundi' }, swimEndurance(w)),
          Object.assign({ day: 'Mardi' }, bikeSweetspot(w)),
          Object.assign({ day: 'Mercredi' }, runTempo(w)),
          Object.assign({ day: 'Jeudi' }, swimThreshold(w)),
          Object.assign({ day: 'Vendredi' }, REST_LIGHT),
          Object.assign({ day: 'Samedi' }, brickMedium(w)),
          Object.assign({ day: 'Dimanche' }, runLong(w))
        ];
      } else if (rot === 1) {
        sessions = [
          Object.assign({ day: 'Lundi' }, swimFartlek(w)),
          Object.assign({ day: 'Mardi' }, bikeTempo(w)),
          Object.assign({ day: 'Mercredi' }, runHills(w)),
          Object.assign({ day: 'Jeudi' }, swimDescending(w)),
          Object.assign({ day: 'Vendredi' }, REST),
          Object.assign({ day: 'Samedi' }, brickMedium(w)),
          Object.assign({ day: 'Dimanche' }, runLong(w))
        ];
      } else {
        sessions = [
          Object.assign({ day: 'Lundi' }, swimPyramid(w)),
          Object.assign({ day: 'Mardi' }, bikeClimbs(w)),
          Object.assign({ day: 'Mercredi' }, runFartlek(w)),
          Object.assign({ day: 'Jeudi' }, swimStrength(w)),
          Object.assign({ day: 'Vendredi' }, REST_LIGHT),
          Object.assign({ day: 'Samedi' }, brickMedium(w)),
          Object.assign({ day: 'Dimanche' }, runMarathonPace(w))
        ];
      }
    } else if (pname === 'Build 2') {
      if (rot === 0) {
        sessions = [
          Object.assign({ day: 'Lundi' }, swimThreshold(w)),
          Object.assign({ day: 'Mardi' }, bikeThreshold(w)),
          Object.assign({ day: 'Mercredi' }, runIntervals(w)),
          Object.assign({ day: 'Jeudi' }, swimEndurance(w)),
          Object.assign({ day: 'Vendredi' }, REST),
          Object.assign({ day: 'Samedi' }, brickLong(w)),
          Object.assign({ day: 'Dimanche' }, runLong(w))
        ];
      } else if (rot === 1) {
        sessions = [
          Object.assign({ day: 'Lundi' }, swimVO2(w)),
          Object.assign({ day: 'Mardi' }, bikeSpikeIntervals(w)),
          Object.assign({ day: 'Mercredi' }, run400s(w)),
          Object.assign({ day: 'Jeudi' }, swimNegSplit(w)),
          Object.assign({ day: 'Vendredi' }, REST),
          Object.assign({ day: 'Samedi' }, brickLong(w)),
          Object.assign({ day: 'Dimanche' }, runNegSplit(w))
        ];
      } else {
        sessions = [
          Object.assign({ day: 'Lundi' }, swimContinuous(w)),
          Object.assign({ day: 'Mardi' }, bikeMountainRide(w)),
          Object.assign({ day: 'Mercredi' }, runVO2(w)),
          Object.assign({ day: 'Jeudi' }, swimThreshold(w)),
          Object.assign({ day: 'Vendredi' }, REST),
          Object.assign({ day: 'Samedi' }, brickLong(w)),
          Object.assign({ day: 'Dimanche' }, runLong(w))
        ];
      }
    } else if (pname === 'Peak') {
      if (rot === 0) {
        sessions = [
          Object.assign({ day: 'Lundi' }, swimRaceSim()),
          Object.assign({ day: 'Mardi' }, bikeRacePace(w)),
          Object.assign({ day: 'Mercredi' }, runTempo(w)),
          Object.assign({ day: 'Jeudi' }, swimThreshold(w)),
          Object.assign({ day: 'Vendredi' }, REST),
          Object.assign({ day: 'Samedi' }, brickLong(w)),
          Object.assign({ day: 'Dimanche' }, runRacePace(w))
        ];
      } else if (rot === 1) {
        sessions = [
          Object.assign({ day: 'Lundi' }, swimTT(w)),
          Object.assign({ day: 'Mardi' }, bikeFTP(w)),
          Object.assign({ day: 'Mercredi' }, runMarathonPace(w)),
          Object.assign({ day: 'Jeudi' }, swimRaceSim()),
          Object.assign({ day: 'Vendredi' }, REST),
          Object.assign({ day: 'Samedi' }, brickRaceDay(w)),
          Object.assign({ day: 'Dimanche' }, runRecovery(w))
        ];
      } else {
        sessions = [
          Object.assign({ day: 'Lundi' }, swimDescending(w)),
          Object.assign({ day: 'Mardi' }, bikePaceRaceSpecific(w)),
          Object.assign({ day: 'Mercredi' }, runIntervals(w)),
          Object.assign({ day: 'Jeudi' }, swimNegSplit(w)),
          Object.assign({ day: 'Vendredi' }, REST),
          Object.assign({ day: 'Samedi' }, brickLong(w)),
          Object.assign({ day: 'Dimanche' }, runNegSplit(w))
        ];
      }
    } else { // Taper / Race Week
      sessions = [
        Object.assign({ day: 'Lundi' }, swimTechnique(w)),
        Object.assign({ day: 'Mardi' }, bikeShort(w)),
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

    // Extra session pour discipline faible (hors Taper) — +1 session spécifique/semaine
    if (weakDiscipline && !isTaper && factor >= 1.0) {
      var bonusSessions = {
        swim: [swimEndurance, swimThreshold, swimPyramid, swimKick, swimFartlek],
        bike: [bikeLong, bikeSweetspot, bikeZ2, bikeTempo, bikeRecovery],
        run: [runEasy, runTempo, runStrides, runFartlek, runRecovery]
      };
      var bonusPool = bonusSessions[weakDiscipline];
      if (bonusPool) {
        var bonusFn = bonusPool[w % bonusPool.length];
        sessions.push(Object.assign({ day: 'Bonus ' + (weakDiscipline === 'swim' ? 'Natation' : weakDiscipline === 'bike' ? 'Vélo' : 'Run') }, bonusFn(w)));
      }
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
      notes = 'Affûtage : volume -40-50%, maintenir quelques séances d\'intensité. "Les jambes fraiches arrivent à Kona" — Jan Frodeno.';
    } else if (isDeload) {
      notes = 'Semaine de récupération : volume -35%. Normal de se sentir "rouillé". C\'est le corps qui s\'adapte et progresse.';
    } else if (pname === 'Base') {
      notes = 'Base : 80% en Z2. Si tu ne peux pas tenir une conversation, ralentis. "Low & slow builds the engine" — Mark Allen, 6× champion Kona.';
    } else if (pname === 'Build' || pname === 'Build 1') {
      notes = 'Build 1 : max 2 séances intenses/semaine. Le reste en Z2. Sommeil 8h minimum selon Jan Frodeno.';
    } else if (pname === 'Build 2') {
      notes = 'Build 2 : semaines les plus dures. "Train tired to race fresh" — Mirinda Carfrae, 3× championne Kona.';
    } else if (pname === 'Peak') {
      notes = 'Peak : simuler la course — nutrition, équipement, rythme doivent être validés. Pas d\'expérimentation le jour J.';
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

  // Attach zone reference to first week (for display in UI)
  if (program.length > 0) {
    program[0].zoneRef = {
      swim: swimZones || null,
      bike: bikeZones || null,
      run: runZones || null,
      ftp: ftpVal > 0 ? ftpVal : null
    };
    if (opts.raceDate) {
      program[0].raceDate = opts.raceDate;
    }
  }

  return program;
}

window.generateTriathlonProgram = generateTriathlonProgram;

})();
