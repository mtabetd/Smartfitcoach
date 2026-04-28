// ─── CROSSFIT INTENSITY ENGINE ───
// Extracted from app-sport.js — DO NOT edit directly; edit this module.

var CF_INTENSITY_FACTORS = { low: 0.8, moderate: 1.0, high: 1.3, very_high: 1.6 };

function computeSessionIntensity(wod) {
 if (!wod || !wod.type) return 'moderate';
 var t = (wod.type || '').toLowerCase();

 // Zone 2 / recovery keywords
 if (/zone\s*2|recovery|z2|aerobic base/.test(t)) return 'low';

 // AMRAP: > 20 min → moderate (sustained aerobic); ≤ 20 → high (glycolytic)
 var amrapM = t.match(/amrap\s+(\d+)/);
 if (amrapM) {
  var amrapMins = parseInt(amrapM[1], 10);
  return amrapMins > 20 ? 'moderate' : 'high';
 }

 // EMOM: heavy/strength keywords → high; standard interval → moderate
 if (/emom/.test(t)) {
  return /force|heavy|lourd/.test(t) ? 'high' : 'moderate';
 }

 // For Time with time cap — cap ≤ 12 min = sprint benchmark; ≤ 20 = high; > 20 = long chipper
 var capM = t.match(/cap\s+(\d+)/);
 if (capM) {
  var cap = parseInt(capM[1], 10);
  if (cap <= 12) return 'very_high';
  if (cap <= 20) return 'high';
  return 'moderate';
 }

 // N Rounds For Time: ≥ 10 rounds = high repeated effort
 var roundsM = t.match(/^(\d+)\s+rounds?/i);
 if (roundsM) {
  return parseInt(roundsM[1], 10) >= 10 ? 'high' : 'moderate';
 }

 // Plain For Time (no cap = long chipper → moderate)
 if (/for time/.test(t)) return 'moderate';

 return 'moderate';
}

function computeAdvancedIntensity(wod, baseIntensity) {
 try {
  var LEVELS = ['low', 'moderate', 'high', 'very_high'];
  var idx = LEVELS.indexOf(baseIntensity);
  if (idx === -1) idx = 2; // unknown base → default to 'high' position

  var movements = (wod && Array.isArray(wod.movements)) ? wod.movements : [];
  if (!movements.length) return baseIntensity; // no movements → nothing to refine

  var combined = ((wod && wod.type) || '') + ' ' + ((wod && wod.notes) || '');
  combined = combined.toLowerCase();

  // ─── Signal extraction ───
  var totalReps       = 0;
  var heavyBarbellN   = 0;
  var gymnasticN      = 0;
  var cardioN         = 0;
  var lowSkillN       = 0;

  var _HEAVY_LIFTS = /deadlift|clean|snatch|thruster|squat|jerk/;
  var _LOW_SKILL   = /air squat|sit.?up|push.?up|jumping jack|mountain climber|lunge/;
  var _CARDIO_NAME = /\b(row|run|bike|ski erg|double under|single under)\b/;

  movements.forEach(function(m) {
   if (typeof m.reps === 'number') totalReps += m.reps;
   var mn = (m.name || '').toLowerCase();
   if (m.weight) {
    if (_HEAVY_LIFTS.test(mn)) heavyBarbellN++;
   }
   if (m.gymnastics) gymnasticN++;
   if (m.special || _CARDIO_NAME.test(mn)) cardioN++;
   if (_LOW_SKILL.test(mn)) lowSkillN++;
  });

  // Heavy barbell keywords in type/notes also count
  if (/heavy|lourd|\d+%\s*(1rm|max)/.test(combined)) heavyBarbellN++;

  // ─── Adjustment rules ───
  var delta = 0;

  if (totalReps > 300)    delta += 1; // very high volume
  if (heavyBarbellN > 0)  delta += 1; // loaded barbell elevates CNS demand

  // Pure cardio: every movement is cardio and no barbell/gymnastics
  var isPureCardio = cardioN > 0 && cardioN === movements.length && !heavyBarbellN && !gymnasticN;
  if (isPureCardio) delta -= 1;

  // All movements are low-skill (calisthenics, no technique demand)
  if (lowSkillN > 0 && lowSkillN === movements.length) delta -= 1;

  idx = Math.max(0, Math.min(LEVELS.length - 1, idx + delta));
  return LEVELS[idx];
 } catch(e) {
  return baseIntensity; // safe fallback — never breaks the caller
 }
}

function computeFatigueFactor(durationMins) {
 if (!durationMins || isNaN(durationMins)) return 0.9; // unknown duration → conservative default
 if (durationMins <= 10) return 0.95; // short sprint — minimal fatigue decay
 if (durationMins <= 20) return 0.90; // standard WOD — moderate decay
 return 0.85;                          // long effort — significant output drop
}

function computeVolumeFactor(wod) {
 if (!wod) return 1.0;
 var t = (wod.type || '').toLowerCase();
 var movements = Array.isArray(wod.movements) ? wod.movements : [];

 var repSum = 0;
 movements.forEach(function(m) {
  if (typeof m.reps === 'number') repSum += m.reps;
 });
 if (!repSum) return 1.0; // no rep data → neutral factor

 // Estimate total reps based on WOD format
 var amrapM  = t.match(/amrap\s+(\d+)/);
 var roundsM = t.match(/^(\d+)\s+rounds?/i);
 var emomM   = t.match(/emom\s+(\d+)/);

 if (amrapM) {
  // 1 round ≈ 5 min is a conservative CrossFit estimate
  repSum = repSum * Math.ceil(parseInt(amrapM[1], 10) / 5);
 } else if (roundsM) {
  repSum = repSum * parseInt(roundsM[1], 10);
 } else if (emomM) {
  // Active movements per cycle (exclude rest minutes)
  var active = movements.filter(function(m) { return !/\brest\b/i.test(m.name || ''); }).length || 1;
  repSum = repSum * Math.ceil(parseInt(emomM[1], 10) / active);
 }
 // For Time (plain chipper): repSum is already the total

 // ─── FATIGUE CORRECTION ───
 // Reuse parsed duration from WOD format; fall back to cap for For Time
 var _capM  = t.match(/cap\s+(\d+)/);
 var _fatDur = amrapM  ? parseInt(amrapM[1], 10)
             : emomM   ? parseInt(emomM[1], 10)
             : _capM   ? parseInt(_capM[1],  10)
             : null;
 var repSumAdjusted = Math.round(repSum * computeFatigueFactor(_fatDur));

 if (repSumAdjusted < 50)  return 0.9; // low volume
 if (repSumAdjusted > 200) return 1.2; // high volume
 return 1.0;                            // normal
}

// ─── CROSSFIT REST FACTOR ───
function _cfParseRestSeconds(text) {
 // Returns array of every rest duration (in seconds) found in text.
 // Caller takes max → strongest reduction.
 var secs = [];
 var t = (text || '').toLowerCase();
 var m;

 // "rest 2min" / "rest 2 min" / "repos 2min"
 var reMinA = /(?:rest|repos)\s+(\d+)\s*min/g;
 while ((m = reMinA.exec(t)) !== null) secs.push(parseInt(m[1], 10) * 60);
 // "2min rest" / "2 min rest"
 var reMinB = /(\d+)\s*min\s+rest/g;
 while ((m = reMinB.exec(t)) !== null) secs.push(parseInt(m[1], 10) * 60);

 // "rest 30s" / "rest 60 sec" / "rest 60 seconds" / "repos 30s"
 // (?!\s*min) prevents matching the leading digit of "2min" patterns above
 var reSecA = /(?:rest|repos)\s+(\d+)\s*s(?:ec(?:ond)?s?)?(?!\s*min)/g;
 while ((m = reSecA.exec(t)) !== null) secs.push(parseInt(m[1], 10));
 // "30s rest" / "90 sec rest"
 var reSecB = /(\d+)\s*s(?:ec(?:ond)?s?)?\s+rest/g;
 while ((m = reSecB.exec(t)) !== null) secs.push(parseInt(m[1], 10));

 // "1:00 rest" / "1:30 rest"
 var reColon = /(\d+):(\d{2})\s*rest/g;
 while ((m = reColon.exec(t)) !== null) secs.push(parseInt(m[1], 10) * 60 + parseInt(m[2], 10));

 return secs;
}

function computeCrossfitRestFactor(wod, typeString, movements) {
 try {
  var movs = Array.isArray(movements) ? movements : [];
  var notes = (wod && wod.notes) ? (wod.notes + '') : '';

  var hasRest = movs.some(function(m) { return /\brest\b/i.test(m.name || ''); })
             || /\brest\b/i.test(typeString || '')
             || /\brest\b/i.test(notes);
  if (!hasRest) return 1.0;

  // Aggregate all text sources for duration parsing
  var allText = (typeString || '') + ' ' + notes + ' '
   + movs.map(function(m) { return (m.name || '') + ' ' + (m.note || '') + ' ' + (m.notes || ''); }).join(' ');

  var secs = _cfParseRestSeconds(allText);
  if (!secs.length) return 0.9; // rest present but no parseable duration → EMOM slot fallback

  var maxSecs = Math.max.apply(null, secs);
  if (maxSecs >= 120) return 0.75;
  if (maxSecs >= 90)  return 0.80;
  if (maxSecs >= 60)  return 0.85;
  if (maxSecs >= 30)  return 0.92;
  return 0.9; // < 30s — treat as EMOM rest slot
 } catch(e) {
  return 0.9; // safe fallback — never crashes
 }
}
