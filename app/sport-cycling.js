// ─── CYCLING INTENSITY ENGINE ───
// Extracted from app-sport.js — DO NOT edit directly; edit this module.

// ─── CYCLING ZONE INTENSITY FACTORS (Coggan) ───
// FTP path: calibrated from Coggan zone midpoints (z1≈50% FTP, z4≈98% FTP)
var CYCLING_ZONE_FACTORS_FTP   = { 1: 0.5, 2: 0.75, 3: 1.0, 4: 1.35, 5: 1.6 };
// No-FTP fallback: conservative duration-based proxy
var CYCLING_ZONE_FACTORS_NOFTP = { 1: 0.5, 2: 0.7,  3: 0.9, 4: 1.25, 5: 1.5 };


// ═══════════════════════════════════════
// CYCLISME MODULE
// ═══════════════════════════════════════


function cyclingKcal(durationMin, zone, weightKg) {
 var met = CYCLING_MET[Math.min(zone - 1, 4)] || 7;
 return Math.round(met * weightKg * (durationMin / 60));
}


// ── Cyclisme v2 — plan personnalisé par objectif + FTP ────────────────────────
function _cyclingFtpFallback(level) {
 return { debutant: 155, intermediaire: 205, avance: 265 }[level] || 200;
}
function _cyclingZoneWatts(ftp) {
 return {
  z1: { min: Math.round(ftp * 0.45), max: Math.round(ftp * 0.55) },
  z2: { min: Math.round(ftp * 0.56), max: Math.round(ftp * 0.75) },
  z3: { min: Math.round(ftp * 0.76), max: Math.round(ftp * 0.90) },
  z4: { min: Math.round(ftp * 0.91), max: Math.round(ftp * 1.05) },
  z5: { min: Math.round(ftp * 1.06), max: Math.round(ftp * 1.20) }
 };
}
function _cyclingApplyVol(sessions, vf) {
 return sessions.map(function(s) {
  return { day: s.day, type: s.type, duration: Math.max(15, Math.round(s.duration * vf)), zone: s.zone, desc: s.desc };
 });
}
function _cyclingPickSessions(templates, numDays) {
 return templates.slice(0, Math.min(numDays, templates.length));
}
function _cyclingBuildPlan(weekPhases, templates, numDays) {
 var plan = [];
 for (var w = 1; w <= 8; w++) {
  var wp = weekPhases[w] || weekPhases[1];
  plan.push({
   week: w, phase: wp.name, phaseColor: wp.color,
   focus: wp.focus, isDeload: !!wp.isDeload,
   sessions: _cyclingApplyVol(_cyclingPickSessions(templates, numDays), wp.volFactor)
  });
 }
 return plan;
}
function _cyclingPlanWeightloss(level, numDays, ftp, z) {
 var weekPhases = {
  1: { name:'Adaptation métabolique', color:'#3E5C3A', focus:'Habituer le corps à puiser dans les graisses en Z2', volFactor:0.70, isDeload:false },
  2: { name:'Adaptation métabolique', color:'#3E5C3A', focus:'Consolider base Z2 — rythme conversationnel', volFactor:0.75, isDeload:false },
  3: { name:'Volume calorique', color:'#1A3A6A', focus:'Maximiser la dépense énergétique sur longues sorties Z2', volFactor:1.0, isDeload:false },
  4: { name:'Volume calorique', color:'#1A3A6A', focus:'Décharge — volume ↓ 40%, maintien fréquence', volFactor:0.60, isDeload:true },
  5: { name:'Volume calorique', color:'#1A3A6A', focus:'Consolidation Z2 + intro tempo Z3', volFactor:1.05, isDeload:false },
  6: { name:'Pic de volume', color:'#7A3B0E', focus:'Sorties longues + tempo Z3 pour varier les substrats', volFactor:1.15, isDeload:false },
  7: { name:'Pic de volume', color:'#7A3B0E', focus:'Volume élevé — objectif calorique hebdo maximal', volFactor:1.20, isDeload:false },
  8: { name:'Récupération active', color:'#3E5C3A', focus:'Réduction volume — maintien fréquence', volFactor:0.65, isDeload:true }
 };
 var t = [
  { day:'Mardi',    type:'Endurance Z2',    duration:70,  zone:2, desc:'Z2 ('+z.z2.min+'–'+z.z2.max+'W) — rythme conversationnel, brûleur de graisses principal' },
  { day:'Jeudi',    type:'Tempo Z3',        duration:55,  zone:3, desc:'2×15min Z3 ('+z.z3.min+'–'+z.z3.max+'W) + 5min récup — métabolisme élevé post-effort' },
  { day:'Samedi',   type:'Sortie longue Z2',duration:110, zone:2, desc:'Z2 ('+z.z2.min+'–'+z.z2.max+'W) — sortie principale, hydratation 500ml/h' },
  { day:'Lundi',    type:'Récupération Z1', duration:35,  zone:1, desc:'Z1 ('+z.z1.min+'–'+z.z1.max+'W) — jambes légères, récupération active' },
  { day:'Dimanche', type:'Endurance Z2',    duration:60,  zone:2, desc:'Z2 ('+z.z2.min+'–'+z.z2.max+'W) — volume additionnel, cadence libre' },
  { day:'Mercredi', type:'Endurance Z2',    duration:50,  zone:2, desc:'Z2 ('+z.z2.min+'–'+z.z2.max+'W) — session intermédiaire' }
 ];
 return _cyclingBuildPlan(weekPhases, t, numDays);
}
function _cyclingPlanFitness(level, numDays, ftp, z) {
 var weekPhases = {
  1: { name:'Base aérobie', color:'#1A3A6A', focus:'Développer le moteur Z2 — qualité > quantité', volFactor:0.75, isDeload:false },
  2: { name:'Base aérobie', color:'#1A3A6A', focus:'Consolider la base aérobie', volFactor:0.80, isDeload:false },
  3: { name:'Développement', color:'#7A3B0E', focus:'Introduire tempo et sweet spot Z3-Z4', volFactor:1.0, isDeload:false },
  4: { name:'Développement', color:'#7A3B0E', focus:'Décharge — volume ↓ 40%', volFactor:0.60, isDeload:true },
  5: { name:'Développement', color:'#7A3B0E', focus:'Consolidation tempo, charge progressive', volFactor:1.05, isDeload:false },
  6: { name:'Spécifique', color:'#7A1F1F', focus:'Intervalles seuil et sweet spot FTP', volFactor:1.10, isDeload:false },
  7: { name:'Spécifique', color:'#7A1F1F', focus:'Pic de charge — endurance + intensité', volFactor:1.15, isDeload:false },
  8: { name:'Affûtage', color:'#3E5C3A', focus:'Réduction volume — maintien intensité', volFactor:0.60, isDeload:true }
 };
 var t = [
  { day:'Mardi',    type:'Tempo',             duration:60,  zone:3, desc:'2×15min Z3 ('+z.z3.min+'–'+z.z3.max+'W) + 5min récup entre les blocs' },
  { day:'Jeudi',    type:'Sweet Spot',         duration:70,  zone:4, desc:'3×10min à 88-93% FTP ('+z.z4.min+'–'+z.z4.max+'W) — zone ROI maximale' },
  { day:'Samedi',   type:'Sortie longue',      duration:140, zone:2, desc:'Z2 ('+z.z2.min+'–'+z.z2.max+'W), 80% du temps — endurance fondamentale' },
  { day:'Lundi',    type:'Récupération active',duration:30,  zone:1, desc:'Z1 ('+z.z1.min+'–'+z.z1.max+'W) — jambes légères, rotation hanches' },
  { day:'Dimanche', type:'Endurance',          duration:60,  zone:2, desc:'Z2 ('+z.z2.min+'–'+z.z2.max+'W) — récupération active' },
  { day:'Mercredi', type:'Endurance Z2',       duration:50,  zone:2, desc:'Z2 ('+z.z2.min+'–'+z.z2.max+'W) — volume mid-semaine' }
 ];
 return _cyclingBuildPlan(weekPhases, t, numDays);
}
function _cyclingPlanCompetitive(level, numDays, ftp, z, goal) {
 var isGF = (goal === 'granfondo');
 var weekPhases = {
  1: { name:'Base aérobie', color:'#1A3A6A', focus:'Base aérobie — fondations avant intensité', volFactor:0.80, isDeload:false },
  2: { name:'Base aérobie', color:'#1A3A6A', focus:'Consolider Z2, introduire tempo', volFactor:0.85, isDeload:false },
  3: { name:'Développement seuil', color:'#7A3B0E', focus:'Intervalles FTP — amélioration du seuil', volFactor:1.0, isDeload:false },
  4: { name:'Développement seuil', color:'#7A3B0E', focus:'Décharge — maintien stimuli neuromusculaires', volFactor:0.60, isDeload:true },
  5: { name: isGF ? 'Endurance-puissance' : 'VO2max', color:'#7A1F1F',
       focus: isGF ? 'Longues sorties + sweet spot — spécifique cyclosportive' : 'Intervalles VO2max — puissance aérobie max',
       volFactor:1.05, isDeload:false },
  6: { name: isGF ? 'Endurance-puissance' : 'VO2max', color:'#7A1F1F',
       focus: isGF ? 'Volume élevé + intensité mesurée' : 'Pic VO2max + FTP — charge maximale',
       volFactor:1.10, isDeload:false },
  7: { name:'Affûtage', color:'#3E5C3A', focus:'Réduction volume — maintien intensité', volFactor:0.70, isDeload:false },
  8: { name:'Affûtage compétition', color:'#3E5C3A', focus:'Fraîcheur maximale — jambes prêtes', volFactor:0.50, isDeload:true }
 };
 var t = isGF ? [
  { day:'Mardi',    type:'Intervalles FTP',   duration:65,  zone:4, desc:'3×8min à 91-105% FTP ('+z.z4.min+'–'+z.z4.max+'W) + 5min récup — seuil lactate' },
  { day:'Jeudi',    type:'Sweet Spot',         duration:75,  zone:4, desc:'2×20min à 88-93% FTP ('+z.z4.min+'–'+z.z4.max+'W) — rendement max' },
  { day:'Samedi',   type:'Gran Fondo longue',  duration:180, zone:2, desc:'Z2 ('+z.z2.min+'–'+z.z2.max+'W) + Z3 sur ascensions — spécifique cyclosportive' },
  { day:'Lundi',    type:'Récupération',       duration:30,  zone:1, desc:'Z1 ('+z.z1.min+'–'+z.z1.max+'W) — décharge CNS' },
  { day:'Dimanche', type:'Endurance qualité',  duration:90,  zone:2, desc:'Z2 ('+z.z2.min+'–'+z.z2.max+'W) avec 15min Z3 — assimilation' },
  { day:'Mercredi', type:'Tempo Z3',           duration:55,  zone:3, desc:'3×12min Z3 ('+z.z3.min+'–'+z.z3.max+'W) — économie d\'effort' }
 ] : [
  { day:'Mardi',    type:'Intervalles FTP',    duration:65,  zone:4, desc:'3×8min à 91-105% FTP ('+z.z4.min+'–'+z.z4.max+'W) + 5min récup — élévation seuil' },
  { day:'Jeudi',    type:'VO2max',             duration:60,  zone:5, desc:'6×4min à 106-120% FTP ('+z.z5.min+'–'+z.z5.max+'W) + 4min récup — puissance aérobie max' },
  { day:'Samedi',   type:'Sortie longue qualité',duration:160,zone:2, desc:'Z2 ('+z.z2.min+'–'+z.z2.max+'W) + Z3 sur les côtes — endurance de base' },
  { day:'Lundi',    type:'Récupération',       duration:30,  zone:1, desc:'Z1 ('+z.z1.min+'–'+z.z1.max+'W) — récupération CNS post-VO2max' },
  { day:'Dimanche', type:'Sweet Spot',         duration:80,  zone:4, desc:'2×20min à 88-93% FTP ('+z.z4.min+'–'+z.z4.max+'W) — séance secondaire seuil' },
  { day:'Mercredi', type:'Tempo Z3',           duration:55,  zone:3, desc:'3×12min Z3 ('+z.z3.min+'–'+z.z3.max+'W) + 3min récup' }
 ];
 return _cyclingBuildPlan(weekPhases, t, numDays);
}
function _cyclingPlanTriathlon(level, numDays, ftp, z) {
 var weekPhases = {
  1: { name:'Base triathlon', color:'#1A3A6A', focus:'Efficacité pédalage Z2 — économie d\'énergie pour la course', volFactor:0.75, isDeload:false },
  2: { name:'Base triathlon', color:'#1A3A6A', focus:'Consolider base, intro tempo', volFactor:0.80, isDeload:false },
  3: { name:'Puissance FTP', color:'#7A3B0E', focus:'Intervalles FTP — améliorer le seuil segment vélo', volFactor:1.0, isDeload:false },
  4: { name:'Puissance FTP', color:'#7A3B0E', focus:'Décharge — maintien stimuli neuromusculaires', volFactor:0.60, isDeload:true },
  5: { name:'Spécifique triathlon', color:'#7A1F1F', focus:'Sweet spot + sorties brick vélo-course', volFactor:1.0, isDeload:false },
  6: { name:'Spécifique triathlon', color:'#7A1F1F', focus:'Pics d\'intensité + simulation segment vélo', volFactor:1.05, isDeload:false },
  7: { name:'Affûtage', color:'#3E5C3A', focus:'Réduction volume — maintien intensité', volFactor:0.70, isDeload:false },
  8: { name:'Affûtage course', color:'#3E5C3A', focus:'Fraîcheur — jambes prêtes pour la transition', volFactor:0.50, isDeload:true }
 };
 var t = [
  { day:'Mardi',    type:'Sweet Spot',       duration:60,  zone:4, desc:'2×15min à 88-93% FTP ('+z.z4.min+'–'+z.z4.max+'W) — économie pédalage triathlon' },
  { day:'Jeudi',    type:'Intervalles FTP',  duration:55,  zone:4, desc:'3×6min à 95-105% FTP ('+z.z4.min+'–'+z.z4.max+'W) + 4min récup — seuil spécifique' },
  { day:'Samedi',   type:'Sortie brick Z2',  duration:90,  zone:2, desc:'Z2 ('+z.z2.min+'–'+z.z2.max+'W) + 20min Z3 — simulation segment + transition optionnelle' },
  { day:'Lundi',    type:'Récupération',     duration:30,  zone:1, desc:'Z1 ('+z.z1.min+'–'+z.z1.max+'W) — récupération active' },
  { day:'Dimanche', type:'Endurance Z2',     duration:75,  zone:2, desc:'Z2 ('+z.z2.min+'–'+z.z2.max+'W) — assimilation semaine, brick optionnel' },
  { day:'Mercredi', type:'Tempo Z3',         duration:45,  zone:3, desc:'3×10min Z3 ('+z.z3.min+'–'+z.z3.max+'W) — zone de course triathlon' }
 ];
 return _cyclingBuildPlan(weekPhases, t, numDays);
}

// Point d'entrée — supporte signature objet {level,days,goal,ftp} ET legacy (level, days)
function generateCyclingPlan(levelOrOpts, daysLegacy) {
 var opts = (typeof levelOrOpts === 'object' && levelOrOpts !== null)
  ? levelOrOpts : { level: levelOrOpts, days: daysLegacy };
 var level   = opts.level || 'intermediaire';
 var numDays = Math.max(2, Math.min(6, parseInt(opts.days) || 3));
 var goal    = opts.goal || 'fitness';
 var ftp     = (opts.ftp && opts.ftp > 75) ? opts.ftp : _cyclingFtpFallback(level);
 var z       = _cyclingZoneWatts(ftp);
 if (goal === 'weightloss') return _cyclingPlanWeightloss(level, numDays, ftp, z);
 if (goal === 'competitive' || goal === 'granfondo') return _cyclingPlanCompetitive(level, numDays, ftp, z, goal);
 if (goal === 'triathlon') return _cyclingPlanTriathlon(level, numDays, ftp, z);
 return _cyclingPlanFitness(level, numDays, ftp, z); // fitness + endurance
}
