// --- TRIATHLON / IRONMAN PROGRAM ---
// Methodes basees sur :
//   - Jan Frodeno   - 3x champion du monde IRONMAN (polarise, brick hebdo)
//   - Patrick Lange - 2x champion du monde, record marathon Kona 2:39
//   - Daniela Ryf   - 5x championne IRONMAN, dominance velo
//   - Mark Allen    - 6x champion Kona (methode Maffetone, Z2 aerobie)
//   - Matt Fitzgerald - 80/20 Triathlon (80% Z1-Z2, 20% intensite)
//   - Joe Friel     - Triathlete Training Bible (periodisation Base-Build-Peak)
// ---
(function() {

var TRIATHLON_GOALS = [
  {
    id: 'sprint', name: 'Sprint', icon: '\u26A1',
    desc: '750m nage \u00b7 20km v\u00e9lo \u00b7 5km run',
    weeks: 8, swimM: 750, bikeKm: 20, runKm: 5,
    tag: '8 semaines \u00b7 Id\u00e9al premier triathlon'
  },
  {
    id: 'olympic', name: 'Olympique', icon: '\uD83C\uDFC5',
    desc: '1,5km nage \u00b7 40km v\u00e9lo \u00b7 10km run',
    weeks: 12, swimM: 1500, bikeKm: 40, runKm: 10,
    tag: '12 semaines \u00b7 Distance officielle JO'
  },
  {
    id: 'half', name: 'Half IRONMAN 70.3', icon: '\uD83D\uDD31',
    desc: '1,9km nage \u00b7 90km v\u00e9lo \u00b7 21,1km run',
    weeks: 20, swimM: 1900, bikeKm: 90, runKm: 21.1,
    tag: '20 semaines \u00b7 Le vrai d\u00e9fi d\'endurance'
  },
  {
    id: 'ironman', name: 'IRONMAN 140.6', icon: '\uD83E\uDD81',
    desc: '3,8km nage \u00b7 180km v\u00e9lo \u00b7 42,2km run',
    weeks: 24, swimM: 3800, bikeKm: 180, runKm: 42.2,
    tag: '24 semaines \u00b7 La course la plus dure du monde'
  }
];

var TRIATHLON_LEVELS = [
  {
    id: 'beginner', name: 'D\u00e9butant', icon: '\uD83D\uDFE2',
    desc: 'Premier triathlon \u2014 objectif finisher, ma\u00eetriser les transitions',
    vol: 0.7
  },
  {
    id: 'intermediate', name: 'Interm\u00e9diaire', icon: '\uD83D\uDD35',
    desc: 'Am\u00e9liorer ses chronos, r\u00e9gularit\u00e9 sur les 3 disciplines',
    vol: 1.0
  },
  {
    id: 'advanced', name: 'Avanc\u00e9', icon: '\uD83D\uDFE0',
    desc: 'Podium AG \u00b7 Qualification Kona \u00b7 Sub-10h IRONMAN',
    vol: 1.3
  },
  {
    id: 'elite', name: 'Elite', icon: '\uD83D\uDD34',
    desc: 'Programme Jan Frodeno / Patrick Lange / Daniela Ryf',
    vol: 1.6
  }
];

window.TRIATHLON_GOALS = TRIATHLON_GOALS;
window.TRIATHLON_LEVELS = TRIATHLON_LEVELS;
// ==============================
// ZONE CALCULATORS
// ==============================

// Parse "m:ss" pace string to total seconds
function parsePace(paceStr) {
  if (!paceStr || typeof paceStr !== 'string') return 0;
  var parts = paceStr.replace(/\s/g, '').split(':');
  var mins = parseInt(parts[0], 10) || 0;
  var secs = parseInt(parts[1], 10) || 0;
  return mins * 60 + secs;
}

// Format seconds back to "m:ss"
function formatPace(totalSec) {
  if (!totalSec || totalSec <= 0) return '0:00';
  var m = Math.floor(totalSec / 60);
  var s = Math.round(totalSec % 60);
  if (s === 60) { m++; s = 0; }
  return m + ':' + (s < 10 ? '0' : '') + s;
}

// Swim zones from 100m pace (CSS approximation)
// Z1=CSS+15s, Z2=CSS+8s, Z3=CSS, Z4=CSS-5s
function calcSwimZones(paceStr) {
  var css = parsePace(paceStr);
  if (css <= 0) return null;
  return {
    Z1: formatPace(Math.round(css * 1.15)),
    Z2: formatPace(Math.round(css * 1.08)),
    Z3: formatPace(css),
    Z4: formatPace(Math.round(css * 0.95))
  };
}

// Default swim zones by level
function defaultSwimZones(level) {
  var defaults = {
    beginner:     { Z1: '2:30', Z2: '2:15', Z3: '2:00', Z4: '1:50' },
    intermediate: { Z1: '2:10', Z2: '1:55', Z3: '1:45', Z4: '1:35' },
    advanced:     { Z1: '1:50', Z2: '1:38', Z3: '1:30', Z4: '1:22' },
    elite:        { Z1: '1:35', Z2: '1:25', Z3: '1:18', Z4: '1:12' }
  };
  return defaults[level] || defaults.intermediate;
}

// Bike zones from speed (km/h) and optional FTP
// If FTP provided: Z1=55-75%, Z2=75-89%, Z3=90-105%, Z4=106-120%, Z5=121%+
// Speed zones: Z1=base*0.7, Z2=base*0.82, Z3=base*0.92, Z4=base, Z5=base*1.08
function calcBikeZones(speedKmh, ftp) {
  var spd = parseFloat(speedKmh);
  var ftpVal = parseFloat(ftp);
  if (ftpVal > 0) {
    return {
      Z1: Math.round(ftpVal * 0.55),
      Z2: Math.round(ftpVal * 0.75),
      Z3: Math.round(ftpVal * 0.90),
      Z4: Math.round(ftpVal * 1.05),
      Z5: Math.round(ftpVal * 1.20),
      unit: 'watts',
      ftp: ftpVal
    };
  }
  if (spd > 0) {
    return {
      Z1: Math.round(spd * 0.70),
      Z2: Math.round(spd * 0.82),
      Z3: Math.round(spd * 0.92),
      Z4: Math.round(spd * 1.00),
      Z5: Math.round(spd * 1.08),
      unit: 'km/h'
    };
  }
  return null;
}

// Default bike zones by level (km/h)
function defaultBikeZones(level) {
  var defaults = {
    beginner:     { Z1: 20, Z2: 24, Z3: 27, Z4: 30, Z5: 33, unit: 'km/h' },
    intermediate: { Z1: 24, Z2: 28, Z3: 32, Z4: 35, Z5: 38, unit: 'km/h' },
    advanced:     { Z1: 28, Z2: 32, Z3: 36, Z4: 39, Z5: 42, unit: 'km/h' },
    elite:        { Z1: 32, Z2: 36, Z3: 40, Z4: 43, Z5: 46, unit: 'km/h' }
  };
  return defaults[level] || defaults.intermediate;
}

// Run zones from min/km pace (threshold pace approximation)
// Z1=threshold+60s, Z2=threshold+35s, Z3=threshold+15s, Z4=threshold, Z5=threshold-15s
function calcRunZones(paceStr) {
  var threshold = parsePace(paceStr);
  if (threshold <= 0) return null;
  return {
    Z1: formatPace(threshold + 60),
    Z2: formatPace(threshold + 35),
    Z3: formatPace(threshold + 15),
    Z4: formatPace(threshold),
    Z5: formatPace(Math.max(threshold - 15, 120))
  };
}

// Default run zones by level
function defaultRunZones(level) {
  var defaults = {
    beginner:     { Z1: '7:00', Z2: '6:20', Z3: '5:50', Z4: '5:30', Z5: '5:00' },
    intermediate: { Z1: '6:15', Z2: '5:40', Z3: '5:15', Z4: '5:00', Z5: '4:30' },
    advanced:     { Z1: '5:30', Z2: '5:00', Z3: '4:35', Z4: '4:15', Z5: '3:50' },
    elite:        { Z1: '4:45', Z2: '4:15', Z3: '3:55', Z4: '3:40', Z5: '3:20' }
  };
  return defaults[level] || defaults.intermediate;
}
// ==============================
// PROGRAMME GENERATOR
// ==============================
function generateTriathlonProgram(goal, level, weakDiscipline, opts) {
  opts = opts || {};

  // --- Resolve goal ---
  var goalObj = null;
  for (var gi = 0; gi < TRIATHLON_GOALS.length; gi++) {
    if (TRIATHLON_GOALS[gi].id === goal) { goalObj = TRIATHLON_GOALS[gi]; break; }
  }
  if (!goalObj) goalObj = TRIATHLON_GOALS[1];

  // --- Resolve level ---
  var levelObj = null;
  for (var li = 0; li < TRIATHLON_LEVELS.length; li++) {
    if (TRIATHLON_LEVELS[li].id === level) { levelObj = TRIATHLON_LEVELS[li]; break; }
  }
  if (!levelObj) levelObj = TRIATHLON_LEVELS[1];

  var vf = levelObj.vol;
  var levelId = levelObj.id;

  // --- Compute zones ---
  var swimZones = calcSwimZones(opts.swimPace) || defaultSwimZones(levelId);
  var bikeZones = calcBikeZones(opts.bikeSpeed, opts.ftp) || defaultBikeZones(levelId);
  var runZones  = calcRunZones(opts.runPace) || defaultRunZones(levelId);

  // --- Total weeks & race date adaptation ---
  var baseWeeks = goalObj.weeks;
  var totalWeeks = baseWeeks;

  if (opts.raceDate) {
    var now = new Date();
    var race = new Date(opts.raceDate);
    if (!isNaN(race.getTime()) && race > now) {
      var diffMs = race.getTime() - now.getTime();
      var weeksAvail = Math.floor(diffMs / (7 * 24 * 60 * 60 * 1000));
      if (weeksAvail >= 4 && weeksAvail <= 52) {
        totalWeeks = weeksAvail;
      }
    }
  }

  // --- Phase boundaries (Joe Friel periodization) ---
  // Base 30%, Build 40%, Peak 20%, Race Prep 10%
  var baseEnd  = Math.max(2, Math.round(totalWeeks * 0.30));
  var buildEnd = Math.max(baseEnd + 2, Math.round(totalWeeks * 0.70));
  var peakEnd  = Math.max(buildEnd + 1, Math.round(totalWeeks * 0.90));
  // Race Prep = remaining weeks

  function getPhase(w) {
    if (w <= baseEnd) return { name: 'Base', color: '#1A3A6A' };
    if (w <= buildEnd) return { name: 'Build', color: '#E67E22' };
    if (w <= peakEnd) return { name: 'Peak', color: '#C0392B' };
    if (w < totalWeeks) return { name: 'Race Prep', color: '#27AE60' };
    return { name: 'Race Week', color: '#27AE60' };
  }

  // --- Volume helpers ---
  function mins(base) { return Math.round(base * vf) + 'min'; }

  function fmtDur(totalMin) {
    if (totalMin < 90) return Math.round(totalMin) + 'min';
    var h = totalMin / 60;
    return h.toFixed(1) + 'h';
  }

  // --- Bike power/speed display helper ---
  function bikeEffort(zone) {
    if (bikeZones.unit === 'watts') {
      return bikeZones[zone] + 'W';
    }
    return bikeZones[zone] + 'km/h';
  }

  function bikeRange(z1, z2) {
    if (bikeZones.unit === 'watts') {
      return bikeZones[z1] + '-' + bikeZones[z2] + 'W';
    }
    return bikeZones[z1] + '-' + bikeZones[z2] + 'km/h';
  }
  // ==============================
  // SWIM SESSIONS (10 types)
  // ==============================

  function swimTechnique(w) {
    return {
      discipline: 'swim', icon: '\uD83C\uDFCA', type: 'Technique',
      zone: 'Z1-Z2', duration: mins(45),
      detail: '\u00c9chauffement 200m libre facile \u00b7 4\u00d750m Catch-Up drill @ ' + swimZones.Z1 + '/100m \u00b7 4\u00d750m Single-Arm \u00b7 4\u00d750m Finger-Drag \u00b7 8\u00d750m Z2 focus glisse @ ' + swimZones.Z2 + '/100m \u00b7 4\u00d750m Kick \u00b7 100m r\u00e9cup. Objectif : efficacit\u00e9 et glisse.'
    };
  }

  function swimCSS(w) {
    var reps = Math.min(10, Math.round((5 + w * 0.4) * vf));
    return {
      discipline: 'swim', icon: '\uD83C\uDFCA', type: 'CSS/Seuil',
      zone: 'Z3-Z4', duration: mins(55),
      detail: '\u00c9ch. 400m \u00b7 ' + reps + '\u00d7100m @ CSS ' + swimZones.Z3 + '/100m, r\u00e9cup 15s \u00b7 4\u00d750m @ ' + swimZones.Z4 + '/100m, r\u00e9cup 20s \u00b7 200m cool-down. Note ton temps moyen.'
    };
  }

  function swimEndurance(w) {
    var reps = Math.min(20, Math.round((8 + w * 0.5) * vf));
    return {
      discipline: 'swim', icon: '\uD83C\uDFCA', type: 'Endurance Z2',
      zone: 'Z2', duration: mins(55),
      detail: '\u00c9ch. 300m \u00b7 ' + reps + '\u00d7100m Z2 @ ' + swimZones.Z2 + '/100m, d\u00e9part toutes 2min \u00b7 200m r\u00e9cup. M\u00e9thode 80/20 Matt Fitzgerald.'
    };
  }

  function swimSprints(w) {
    var reps = Math.min(12, Math.round(6 * vf));
    return {
      discipline: 'swim', icon: '\uD83C\uDFCA', type: 'Sprints',
      zone: 'Z4', duration: mins(40),
      detail: '\u00c9ch. 300m \u00b7 ' + reps + '\u00d750m sprint @ ' + swimZones.Z4 + '/100m, r\u00e9cup 30s \u00b7 4\u00d725m max effort \u00b7 200m cool-down. D\u00e9velopper la vitesse pure.'
    };
  }

  function swimOpenWater(w) {
    return {
      discipline: 'swim', icon: '\uD83C\uDFCA', type: 'Open Water Sim',
      zone: 'Z2-Z3', duration: mins(50),
      detail: Math.round(goalObj.swimM * 0.8) + 'm continu @ ' + swimZones.Z2 + '-' + swimZones.Z3 + '/100m \u00b7 Sighting toutes 8-10 brasses \u00b7 Pratiquer d\u00e9part group\u00e9 \u00b7 N\u00e9opr\u00e8ne si eau < 24\u00b0C.'
    };
  }

  function swimKick(w) {
    var reps = Math.min(10, Math.round(6 * vf));
    return {
      discipline: 'swim', icon: '\uD83C\uDFCA', type: 'Kick Sets',
      zone: 'Z2-Z3', duration: mins(40),
      detail: '\u00c9ch. 200m \u00b7 ' + reps + '\u00d750m kick avec planche @ effort mod\u00e9r\u00e9 \u00b7 4\u00d750m kick sans planche \u00b7 4\u00d750m nage compl\u00e8te Z2 @ ' + swimZones.Z2 + '/100m \u00b7 100m r\u00e9cup.'
    };
  }

  function swimPullBuoy(w) {
    var reps = Math.min(16, Math.round((8 + w * 0.4) * vf));
    return {
      discipline: 'swim', icon: '\uD83C\uDFCA', type: 'Pull Buoy Endurance',
      zone: 'Z2', duration: mins(50),
      detail: '\u00c9ch. 200m \u00b7 ' + reps + '\u00d7100m avec pull buoy @ ' + swimZones.Z2 + '/100m, focus rotation \u00e9paules et traction \u00b7 200m cool-down. Renforcer le haut du corps.'
    };
  }

  function swimPyramid(w) {
    return {
      discipline: 'swim', icon: '\uD83C\uDFCA', type: 'Pyramides',
      zone: 'Z2-Z4', duration: mins(55),
      detail: '\u00c9ch. 300m \u00b7 Pyramide : 50-100-200-400-200-100-50m @ allures progressives ' + swimZones.Z2 + ' \u00e0 ' + swimZones.Z4 + '/100m, r\u00e9cup 15-30s entre \u00b7 200m cool-down.'
    };
  }

  function swimOpenWaterSim(w) {
    return {
      discipline: 'swim', icon: '\uD83C\uDFCA', type: 'Sim Course Nage',
      zone: 'Z3', duration: Math.max(20, Math.round(goalObj.swimM / 35)) + 'min',
      detail: goalObj.swimM + 'm non-stop @ ' + swimZones.Z3 + '/100m \u00b7 Pratiquer le sighting \u00b7 Simulation d\u00e9part open water avec acc\u00e9l\u00e9rations.'
    };
  }

  function swimRecovery(w) {
    return {
      discipline: 'swim', icon: '\uD83C\uDFCA', type: 'Recovery Nage',
      zone: 'Z1', duration: mins(30),
      detail: '800-1000m continu @ ' + swimZones.Z1 + '/100m, tr\u00e8s facile \u00b7 Focus respiration bilat\u00e9rale \u00b7 Optionnel : 4\u00d750m drills l\u00e9gers. R\u00e9cup\u00e9ration active.'
    };
  }
  // ==============================
  // BIKE SESSIONS (10 types)
  // ==============================

  function bikeZ2Fond(w) {
    var durMin = Math.min(180, Math.round((60 + w * 5) * vf));
    return {
      discipline: 'bike', icon: '\uD83D\uDEB4', type: 'Z2 Fond',
      zone: 'Z2', duration: fmtDur(durMin),
      detail: 'Sortie fond @ ' + bikeRange('Z1', 'Z2') + ' \u00b7 Cadence 85-95 rpm \u00b7 Conversation possible \u00b7 Ravitaillement 1 gel/45min pour sorties > 1h.'
    };
  }

  function bikeSweetspot(w) {
    var reps = Math.min(3, Math.round(2 * vf));
    return {
      discipline: 'bike', icon: '\uD83D\uDEB4', type: 'Sweetspot',
      zone: 'Z3-Z4', duration: mins(75),
      detail: '\u00c9ch. 15min Z1-Z2 \u00b7 ' + reps + '\u00d720min @ 88-93% FTP (' + bikeRange('Z3', 'Z4') + ') \u00b7 R\u00e9cup 3min Z1 entre chaque \u00b7 10min cool-down. Cadence 88-92 rpm.'
    };
  }

  function bikeFTPIntervals(w) {
    var reps = Math.min(5, Math.round(3 * vf));
    return {
      discipline: 'bike', icon: '\uD83D\uDEB4', type: 'FTP Intervals',
      zone: 'Z4', duration: mins(70),
      detail: '\u00c9ch. 15min \u00b7 ' + reps + '\u00d78min @ 100-105% FTP (' + bikeEffort('Z4') + ') \u00b7 R\u00e9cup 4min Z1 \u00b7 10min cool-down. Repousser le seuil lactique.'
    };
  }

  function bikeVO2max(w) {
    var reps = Math.min(6, Math.round(4 * vf));
    return {
      discipline: 'bike', icon: '\uD83D\uDEB4', type: 'VO2max',
      zone: 'Z5', duration: mins(60),
      detail: '\u00c9ch. 15min \u00b7 ' + reps + '\u00d73min @ 106-120% FTP (' + bikeEffort('Z5') + ') \u00b7 R\u00e9cup 3min Z1 \u00b7 10min cool-down. D\u00e9velopper la puissance a\u00e9robie max.'
    };
  }

  function bikeCotes(w) {
    var reps = Math.min(8, Math.round(5 * vf));
    return {
      discipline: 'bike', icon: '\uD83D\uDEB4', type: 'C\u00f4tes/Force',
      zone: 'Z4-Z5', duration: mins(65),
      detail: '\u00c9ch. 15min \u00b7 ' + reps + '\u00d73min en c\u00f4te @ ' + bikeEffort('Z4') + ', cadence 55-65 rpm, assis \u00b7 Descente r\u00e9cup \u00b7 10min cool-down. Force sp\u00e9cifique v\u00e9lo.'
    };
  }

  function bikeTempo(w) {
    return {
      discipline: 'bike', icon: '\uD83D\uDEB4', type: 'Tempo Z3',
      zone: 'Z3', duration: mins(75),
      detail: '\u00c9ch. 15min \u00b7 40min continu @ ' + bikeEffort('Z3') + ' \u00b7 Cadence 85-90 rpm \u00b7 10min cool-down. Effort soutenu contr\u00f4l\u00e9.'
    };
  }

  function bikeLongRide(w) {
    var maxH = { sprint: 1.5, olympic: 3.0, half: 4.5, ironman: 6.0 };
    var durMin = Math.min((maxH[goal] || 4.0) * 60, Math.round((90 + w * 10) * vf));
    return {
      discipline: 'bike', icon: '\uD83D\uDEB4', type: 'Long Ride Z2',
      zone: 'Z2', duration: fmtDur(durMin),
      detail: 'Majorit\u00e9 Z2 @ ' + bikeRange('Z1', 'Z2') + ' \u00b7 30 derni\u00e8res min @ allure course \u00b7 Glucides 60-90g/h \u00b7 Hydratation 600ml/h. Le pilier de l\'IRONMAN.'
    };
  }

  function bikeBrickPortion(w) {
    var durMin = Math.min(120, Math.round((45 + w * 4) * vf));
    return {
      discipline: 'bike', icon: '\uD83D\uDEB4', type: 'Brick (v\u00e9lo)',
      zone: 'Z2-Z3', duration: fmtDur(durMin),
      detail: fmtDur(durMin) + ' @ ' + bikeRange('Z2', 'Z3') + ' \u00b7 Derniers 15min @ allure course. Encha\u00eener imm\u00e9diatement avec le run.'
    };
  }

  function bikeRaceSim(w) {
    var durMin = Math.round(Math.min(180, (goalObj.bikeKm / 30) * 60 * 0.5) * vf);
    return {
      discipline: 'bike', icon: '\uD83D\uDEB4', type: 'Race Pace Sim',
      zone: 'Z3', duration: fmtDur(durMin),
      detail: '\u00c9ch. 20min \u00b7 ' + Math.round(goalObj.bikeKm * 0.4) + 'km @ allure course ' + bikeEffort('Z3') + ' \u00b7 Cool-down 15min. Tester nutrition d\u00e9finitive.'
    };
  }

  function bikeRecovery(w) {
    return {
      discipline: 'bike', icon: '\uD83D\uDEB4', type: 'Recovery Spin',
      zone: 'Z1', duration: mins(35),
      detail: 'Sortie tr\u00e8s facile @ ' + bikeEffort('Z1') + ' \u00b7 Cadence 90+ rpm \u00b7 Aucune intensit\u00e9. R\u00e9cup\u00e9ration active jambes.'
    };
  }
  // ==============================
  // RUN SESSIONS (10 types)
  // ==============================

  function runZ2Facile(w) {
    var durMin = Math.min(65, Math.round((28 + w * 2.5) * vf));
    return {
      discipline: 'run', icon: '\uD83C\uDFC3', type: 'Z2 Facile',
      zone: 'Z1-Z2', duration: durMin + 'min',
      detail: 'Run facile @ ' + runZones.Z2 + '/km \u00b7 FC < 75% FCmax \u00b7 Conversation possible \u00b7 4-6\u00d720s strides en fin de sortie.'
    };
  }

  function runTempo(w) {
    var tempoMin = Math.min(30, Math.round(20 * vf));
    return {
      discipline: 'run', icon: '\uD83C\uDFC3', type: 'Tempo Z3',
      zone: 'Z3', duration: mins(50),
      detail: '\u00c9ch. 10min Z1 \u00b7 ' + tempoMin + 'min @ ' + runZones.Z3 + '/km (effort 7/10) \u00b7 10min cool-down Z1. D\u00e9velopper le seuil lactique.'
    };
  }

  function runIntervals400(w) {
    var reps = Math.min(10, Math.round(6 * vf));
    return {
      discipline: 'run', icon: '\uD83C\uDFC3', type: 'Intervals 400m',
      zone: 'Z4-Z5', duration: mins(45),
      detail: '\u00c9ch. 15min \u00b7 ' + reps + '\u00d7400m @ ' + runZones.Z5 + '/km \u00b7 R\u00e9cup 90s trot \u00b7 10min cool-down. Am\u00e9liorer VMA.'
    };
  }

  function runIntervals800(w) {
    var reps = Math.min(7, Math.round(5 * vf));
    return {
      discipline: 'run', icon: '\uD83C\uDFC3', type: 'Intervals 800m',
      zone: 'Z4', duration: mins(50),
      detail: '\u00c9ch. 15min \u00b7 ' + reps + '\u00d7800m @ ' + runZones.Z4 + '/km \u00b7 R\u00e9cup 2min trot \u00b7 10min cool-down. Endurance de vitesse.'
    };
  }

  function runAllureSemi(w) {
    var durMin = Math.min(50, Math.round(30 * vf));
    return {
      discipline: 'run', icon: '\uD83C\uDFC3', type: 'Allure Semi/Marathon',
      zone: 'Z3', duration: mins(55),
      detail: '\u00c9ch. 10min \u00b7 ' + durMin + 'min @ ' + runZones.Z3 + '/km (allure semi) \u00b7 10min cool-down. Calibrer l\'allure course.'
    };
  }

  function runFartlek(w) {
    return {
      discipline: 'run', icon: '\uD83C\uDFC3', type: 'Fartlek',
      zone: 'Z2-Z4', duration: mins(45),
      detail: '\u00c9ch. 10min \u00b7 25min fartlek : 2min rapide @ ' + runZones.Z4 + '/km + 2min facile @ ' + runZones.Z2 + '/km, en continu \u00b7 10min cool-down. Jeu de vitesse naturel.'
    };
  }

  function runHillRepeats(w) {
    var reps = Math.min(8, Math.round(5 * vf));
    return {
      discipline: 'run', icon: '\uD83C\uDFC3', type: 'Hill Repeats',
      zone: 'Z4-Z5', duration: mins(45),
      detail: '\u00c9ch. 15min \u00b7 ' + reps + '\u00d790s en c\u00f4te @ effort max \u00b7 Descente r\u00e9cup trot \u00b7 10min cool-down. Force et puissance course.'
    };
  }

  function runLong(w) {
    var maxMin = { sprint: 50, olympic: 80, half: 110, ironman: 150 };
    var durMin = Math.min(maxMin[goal] || 90, Math.round((40 + w * 4) * vf));
    return {
      discipline: 'run', icon: '\uD83C\uDFC3', type: 'Long Run',
      zone: 'Z2', duration: fmtDur(durMin),
      detail: 'Z2 tout au long @ ' + runZones.Z2 + '/km \u00b7 Ravitaillement d\u00e8s 45min \u00b7 10 derni\u00e8res min @ allure course ' + runZones.Z3 + '/km. Le pilier du marathon IRONMAN.'
    };
  }

  function runBrickRun(w, bikeDur) {
    var durMin = Math.min(45, Math.round((15 + w * 1.5) * vf));
    return {
      discipline: 'run', icon: '\uD83C\uDFC3', type: 'Brick Run',
      zone: 'Z2-Z3', duration: durMin + 'min',
      detail: 'Run post-v\u00e9lo @ ' + runZones.Z2 + '/km + 10s/km \u00b7 Les premi\u00e8res minutes les jambes sont lourdes, c\'est NORMAL \u00b7 Observer stabilisation FC. Transition rapide < 90s.'
    };
  }

  function runRecovery(w) {
    return {
      discipline: 'run', icon: '\uD83C\uDFC3', type: 'Recovery Jog',
      zone: 'Z1', duration: mins(25),
      detail: 'Trot tr\u00e8s facile @ ' + runZones.Z1 + '/km \u00b7 Aucune intensit\u00e9 \u00b7 Optionnel : marche 5min + trot 15min + marche 5min.'
    };
  }
  // ==============================
  // BRICK SESSIONS
  // ==============================

  function brickSession(w, phase) {
    // Progressive brick: short in Base, long in Peak
    var bikeMins, runMins, zoneLabel;

    if (phase === 'Base') {
      bikeMins = Math.round(Math.min(45, (30 + w * 2) * vf));
      runMins = Math.round(Math.min(20, (15 + w) * vf));
      zoneLabel = 'Z2';
    } else if (phase === 'Build') {
      bikeMins = Math.round(Math.min(90, (45 + w * 3) * vf));
      runMins = Math.round(Math.min(35, (20 + w * 1.5) * vf));
      zoneLabel = 'Z2-Z3';
    } else if (phase === 'Peak') {
      bikeMins = Math.round(Math.min(120, (60 + w * 4) * vf));
      runMins = Math.round(Math.min(45, (25 + w * 2) * vf));
      zoneLabel = 'Z3';
    } else {
      // Race Prep / Race Week - shorter
      bikeMins = Math.round(40 * vf);
      runMins = Math.round(15 * vf);
      zoneLabel = 'Z2';
    }

    // Scale for goal distance
    var goalScale = { sprint: 0.6, olympic: 0.8, half: 1.0, ironman: 1.3 };
    var gs = goalScale[goal] || 1.0;
    bikeMins = Math.round(bikeMins * gs);
    runMins = Math.round(runMins * gs);

    return {
      discipline: 'brick', icon: '\uD83D\uDD17', type: 'Brick V\u00e9lo\u2192Run',
      zone: zoneLabel, duration: fmtDur(bikeMins) + ' v\u00e9lo + ' + runMins + 'min run',
      detail: 'V\u00e9lo ' + fmtDur(bikeMins) + ' @ ' + bikeRange('Z2', 'Z3') + ' \u00b7 Transition rapide < 90s \u00b7 Run ' + runMins + 'min @ ' + runZones.Z2 + '/km + 10s/km \u00b7 Derni\u00e8res 5min @ allure course ' + runZones.Z3 + '/km. S\u00e9ance signature du triathlon \u2014 Jan Frodeno en fait une chaque semaine sans exception.'
    };
  }

  // ==============================
  // REST SESSIONS
  // ==============================

  var REST = {
    discipline: 'rest', icon: '\uD83D\uDE34', type: 'Repos Complet',
    zone: '', duration: '\u2014',
    detail: 'R\u00e9cup\u00e9ration compl\u00e8te. Optionnel : marche 20-30min, yoga, mobilit\u00e9. Aucune intensit\u00e9. C\'est ici que l\'adaptation se produit.'
  };

  var REST_LIGHT = {
    discipline: 'rest', icon: '\uD83E\uDDD8', type: 'Repos Actif',
    zone: 'Z1', duration: '20-30min',
    detail: 'Marche 20min + mobilit\u00e9 hanches/\u00e9paules 10min ou yoga r\u00e9cup\u00e9ration. Aucune intensit\u00e9.'
  };
  // ==============================
  // SWIM SESSION POOL BY PHASE
  // ==============================
  var swimPoolBase = [swimTechnique, swimEndurance, swimKick, swimPullBuoy, swimRecovery];
  var swimPoolBuild = [swimCSS, swimEndurance, swimSprints, swimPyramid, swimOpenWater, swimPullBuoy];
  var swimPoolPeak = [swimCSS, swimOpenWaterSim, swimSprints, swimPyramid, swimOpenWater];

  // BIKE SESSION POOL BY PHASE
  var bikePoolBase = [bikeZ2Fond, bikeLongRide, bikeTempo, bikeZ2Fond];
  var bikePoolBuild = [bikeSweetspot, bikeFTPIntervals, bikeCotes, bikeTempo, bikeLongRide, bikeZ2Fond];
  var bikePoolPeak = [bikeFTPIntervals, bikeVO2max, bikeRaceSim, bikeSweetspot, bikeLongRide];

  // RUN SESSION POOL BY PHASE
  var runPoolBase = [runZ2Facile, runFartlek, runRecovery, runZ2Facile];
  var runPoolBuild = [runTempo, runIntervals800, runLong, runFartlek, runHillRepeats, runAllureSemi];
  var runPoolPeak = [runIntervals400, runIntervals800, runAllureSemi, runLong, runTempo];

  function pickSession(pool, w, idx) {
    var i = (w + idx) % pool.length;
    return pool[i](w);
  }

  // ==============================
  // SIMPLE OBJECT ASSIGN POLYFILL
  // ==============================
  function assign(target) {
    if (target == null) target = {};
    for (var i = 1; i < arguments.length; i++) {
      var src = arguments[i];
      if (src != null) {
        for (var key in src) {
          if (src.hasOwnProperty(key)) {
            target[key] = src[key];
          }
        }
      }
    }
    return target;
  }

  // ==============================
  // WEEKLY TEMPLATE BUILDER
  // ==============================
  function buildWeek(w, phase, isDeload, isRacePrep) {
    var pname = phase.name;
    var sessions = [];
    var factor = isRacePrep ? 0.6 : isDeload ? 0.7 : 1.0;

    var swimPool, bikePool, runPool;
    if (pname === 'Base') {
      swimPool = swimPoolBase;
      bikePool = bikePoolBase;
      runPool = runPoolBase;
    } else if (pname === 'Build') {
      swimPool = swimPoolBuild;
      bikePool = bikePoolBuild;
      runPool = runPoolBuild;
    } else if (pname === 'Peak') {
      swimPool = swimPoolPeak;
      bikePool = bikePoolPeak;
      runPool = runPoolPeak;
    } else {
      // Race Prep / Race Week
      swimPool = [swimTechnique, swimEndurance, swimOpenWaterSim, swimRecovery];
      bikePool = [bikeZ2Fond, bikeRecovery, bikeRaceSim];
      runPool = [runZ2Facile, runRecovery, runAllureSemi];
    }

    var focusTexts = {
      'Base': 'Construire la base a\u00e9robie. 80% en Z1-Z2. Si tu ne peux pas tenir une conversation, ralentis.',
      'Build': 'Augmenter l\'intensit\u00e9 progressivement. Max 2-3 s\u00e9ances intenses/semaine. Le reste en Z2.',
      'Peak': 'Intensit\u00e9 maximale, sessions sp\u00e9cifiques course. Simuler nutrition, \u00e9quipement, rythme.',
      'Race Prep': 'Aff\u00fbtage : volume -40%, maintenir quelques s\u00e9ances d\'intensit\u00e9. Les jambes fra\u00eeches arrivent le jour J.',
      'Race Week': 'Semaine de course. R\u00e9cup\u00e9ration, visualisation, pr\u00e9paration mat\u00e9riel. Confiance.'
    };
    var focus = focusTexts[pname] || focusTexts['Base'];

    if (pname === 'Race Week') {
      // Minimal week before race
      sessions = [
        assign({ day: 'Lundi' }, swimTechnique(w)),
        assign({ day: 'Mardi' }, bikeRecovery(w)),
        assign({ day: 'Mercredi' }, runZ2Facile(w)),
        assign({ day: 'Jeudi' }, swimRecovery(w)),
        assign({ day: 'Vendredi' }, REST),
        assign({ day: 'Samedi' }, {
          discipline: 'rest', icon: '\uD83C\uDFC1', type: 'Activation',
          zone: 'Z1-Z2', duration: '20min',
          detail: '10min v\u00e9lo + 10min run, tr\u00e8s facile. Juste activer les jambes. Pr\u00e9parer l\'\u00e9quipement.'
        }),
        assign({ day: 'Dimanche' }, {
          discipline: 'rest', icon: '\uD83C\uDFC6', type: 'JOUR DE COURSE',
          zone: '', duration: '\u2014',
          detail: 'C\'est ton jour. Fais confiance \u00e0 ton entra\u00eenement. Ex\u00e9cute ton plan de course. Profite.'
        })
      ];
    } else {
      // Standard week layout
      // Lun: swim, Mar: bike, Mer: run, Jeu: swim, Ven: rest, Sam: brick, Dim: long
      var swim1 = pickSession(swimPool, w, 0);
      var swim2 = pickSession(swimPool, w, 1);
      var bike1 = pickSession(bikePool, w, 0);
      var run1 = pickSession(runPool, w, 0);
      var longSession;

      if (pname === 'Base') {
        longSession = runLong(w);
      } else if (w % 2 === 0) {
        longSession = runLong(w);
      } else {
        longSession = bikeLongRide(w);
      }

      // Brick mandatory in Build and Peak phases
      var hasBrick = (pname === 'Build' || pname === 'Peak');
      var satSession;
      if (hasBrick) {
        satSession = brickSession(w, pname);
      } else if (pname === 'Race Prep') {
        satSession = brickSession(w, 'Race Prep');
      } else {
        satSession = brickSession(w, 'Base');
      }

      sessions = [
        assign({ day: 'Lundi' }, swim1),
        assign({ day: 'Mardi' }, bike1),
        assign({ day: 'Mercredi' }, run1),
        assign({ day: 'Jeudi' }, swim2),
        assign({ day: 'Vendredi' }, REST),
        assign({ day: 'Samedi' }, satSession),
        assign({ day: 'Dimanche' }, longSession)
      ];
    }

    // Extra session for weak discipline
    if (weakDiscipline && !isRacePrep && pname !== 'Race Week' && factor >= 1.0) {
      var bonus;
      if (weakDiscipline === 'swim') {
        bonus = pickSession(swimPool, w, 2);
      } else if (weakDiscipline === 'bike') {
        bonus = pickSession(bikePool, w, 1);
      } else if (weakDiscipline === 'run') {
        bonus = pickSession(runPool, w, 1);
      }
      if (bonus) {
        sessions.push(assign({ day: 'Bonus ' + (weakDiscipline === 'swim' ? 'Natation' : weakDiscipline === 'bike' ? 'V\u00e9lo' : 'Run') }, bonus));
      }
    }

    // Apply deload / race prep volume reduction
    if (factor < 1.0) {
      for (var si = 0; si < sessions.length; si++) {
        var s2 = assign({}, sessions[si]);
        if (s2.duration && s2.duration !== '\u2014' && s2.duration !== '20-30min') {
          // Handle compound durations like "1.2h vélo + 25min run"
          s2.duration = s2.duration.replace(/(\d+(?:\.\d+)?)h/g, function(m, n) {
            return (parseFloat(n) * factor).toFixed(1) + 'h';
          });
          s2.duration = s2.duration.replace(/(\d+)min/g, function(m, n) {
            return Math.round(parseInt(n, 10) * factor) + 'min';
          });
        }
        sessions[si] = s2;
      }
    }

    // Calculate total volume
    var totalMins = 0;
    for (var ti = 0; ti < sessions.length; ti++) {
      var dur = sessions[ti].duration;
      if (!dur || dur === '\u2014' || dur === '20-30min') continue;
      var hm = dur.match(/(\d+(?:\.\d+)?)h/);
      if (hm) totalMins += parseFloat(hm[1]) * 60;
      var mm = dur.match(/(\d+)min/);
      if (mm) totalMins += parseInt(mm[1], 10);
    }

    // Phase notes
    var notes = '';
    if (isDeload) {
      notes = 'Semaine de r\u00e9cup\u00e9ration : volume -30%. Normal de se sentir rouill\u00e9. C\'est le corps qui s\'adapte et progresse.';
    } else if (isRacePrep) {
      notes = 'Aff\u00fbtage : volume -40%, maintenir quelques s\u00e9ances d\'intensit\u00e9. Les jambes fra\u00eeches arrivent le jour J.';
    } else if (pname === 'Base') {
      notes = 'Base : 80% en Z2. Low & slow builds the engine \u2014 Mark Allen, 6\u00d7 champion Kona.';
    } else if (pname === 'Build') {
      notes = 'Build : max 2-3 s\u00e9ances intenses/semaine. Le reste en Z2. Sommeil 8h minimum.';
    } else if (pname === 'Peak') {
      notes = 'Peak : simuler la course \u2014 nutrition, \u00e9quipement, rythme doivent \u00eatre valid\u00e9s. Pas d\'exp\u00e9rimentation le jour J.';
    }

    return {
      week: w,
      phase: pname,
      phaseColor: phase.color,
      isDeload: isDeload,
      isTaper: isRacePrep || pname === 'Race Week',
      focus: focus,
      totalHours: (totalMins / 60).toFixed(1) + 'h',
      sessions: sessions,
      notes: notes
    };
  }

  // ==============================
  // GENERATE ALL WEEKS
  // ==============================
  var program = [];

  for (var w = 1; w <= totalWeeks; w++) {
    var phase = getPhase(w);
    var pname = phase.name;

    // Deload every 4 weeks (every 3 for masters 40+)
    var deloadFreq = (window.getAge && window.getAge() >= 40) ? 3 : 4;
    var isDeload = (w % deloadFreq === 0) && pname !== 'Race Prep' && pname !== 'Race Week' && pname !== 'Peak';
    var isRacePrep = (pname === 'Race Prep');

    // Masters 40+: reduce volume 10%
    var savedVf = vf;
    if (window.getAge && window.getAge() >= 40 && !isRacePrep && pname !== 'Race Week') {
      vf = Math.min(vf, levelObj.vol * 0.9);
    }

    program.push(buildWeek(w, phase, isDeload, isRacePrep));
    vf = savedVf;
  }

  return program;
}

window.generateTriathlonProgram = generateTriathlonProgram;

})();
