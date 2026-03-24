// crossfit-wods.js — 100 WODs CrossFit Programming
// Part 1: Days 1-25 (other parts appended)
(function(){
'use strict';

window.CF_WODS_FULL = [
// ============ WEEK 1 ============
{
  day: 1, week: 1, name: 'FORGE', theme: 'Force + Conditioning',
  haltero: { name: 'Clean Complex', desc: '1 Power Clean + 1 Hang Clean + 1 Full Clean', scheme: 'E2MOM 12min', weights: 'clean' },
  wod: { name: 'FORGE', type: 'AMRAP 15', movements: [
    {name: 'Thrusters', reps: 10, weight: 'thruster'},
    {name: 'Toes-to-bar', reps: 12, gymnastics: 'toes_to_bar'},
    {name: 'Box Jumps', reps: 14, gymnastics: 'box_jump'},
    {name: 'Cal Row', special: 'row_cal'}
  ], notes: 'Pacing 70-80%. Respirez sur les TTB. Rounds réguliers = victoire. 🔥' },
  gym: { name: 'Skill: Kipping Pull-ups', drills: ['3x5 Strict Pull-ups', '3x8 Kipping Pull-ups', '3x Max Butterfly attempts', '2min Hollow Hold'] }
},
{
  day: 2, week: 1, name: 'THUNDER', theme: 'Snatch + Chipper',
  haltero: { name: 'Snatch Progression', desc: '1 Hang Snatch + 1 Power Snatch + 1 OHS', scheme: 'Every 90s x 10 sets', weights: 'snatch' },
  wod: { name: 'THUNDER', type: 'For Time (cap 18min)', movements: [
    {name: 'Wall Balls', reps: 50, gymnastics: 'wall_ball'},
    {name: 'Double Unders', reps: 100, gymnastics: 'double_unders'},
    {name: 'Power Snatches', reps: 30, weight: 'snatch'},
    {name: 'Double Unders', reps: 100, gymnastics: 'double_unders'},
    {name: 'Wall Balls', reps: 50, gymnastics: 'wall_ball'}
  ], notes: 'Chipper sandwich. Brisez les Wall Balls 25-25, Snatches 10-10-10. Restez calme. ⚡' },
  gym: { name: 'Skill: Handstand Walk', drills: ['5x30s Wall-Facing Handstand Hold', '3x5 Wall Walk (slow descent)', '5x3m HS Walk attempts', '3x20 Shoulder Taps en HS'] }
},
{
  day: 3, week: 1, name: 'BLITZ', theme: 'Front Squat + Sprint',
  haltero: { name: 'Front Squat', desc: 'Front Squat 5-5-3-3-1-1', scheme: '15min — Build to heavy single', weights: 'front_squat' },
  wod: { name: 'BLITZ', type: '5 Rounds For Time (cap 20min)', movements: [
    {name: 'Deadlift', reps: 12, weight: 'deadlift'},
    {name: 'Burpees over bar', reps: 9, gymnastics: 'burpee'},
    {name: 'Pull-ups', reps: 6, gymnastics: 'pullups'},
    {name: 'Run 200m', reps: 1, special: 'run_200'}
  ], notes: 'Sprint les burpees, steady sur les deadlifts. Run 200m = récupération active entre rounds. Grip management crucial! 💀🏃' },
  gym: { name: 'Skill: Ring Muscle-ups', drills: ['3x5 Strict Ring Dips', '3x3 Kipping Swing to Hip (rings)', '5x1-3 Ring Muscle-up attempts', 'Accumulate 1min L-sit on rings'] }
},
{
  day: 4, week: 1, name: 'MAYHEM', theme: 'Squat Clean + Long AMRAP',
  haltero: { name: 'Clean & Jerk Complex', desc: '1 Squat Clean + 1 Push Jerk + 1 Split Jerk', scheme: 'E2MOM 14min', weights: 'squat_clean' },
  wod: { name: 'MAYHEM', type: 'AMRAP 20', movements: [
    {name: 'KB Swings', reps: 15, gymnastics: 'kb_swing'},
    {name: 'Box Jumps', reps: 12, gymnastics: 'box_jump'},
    {name: 'Thrusters', reps: 9, weight: 'thruster'},
    {name: 'Bar Muscle-ups', reps: 3, gymnastics: 'muscle_ups_bar'}
  ], notes: 'Long grinder. Respirez sur les KB swings. BMU = petites séries. Visez 5+ rounds. 🦍' },
  gym: { name: 'Skill: HSPU', drills: ['3x5 Strict HSPU (ou pike push-ups)', '3x5 Kipping HSPU', 'Max unbroken HSPU test', '3x15 DB Strict Press léger'] }
},
{
  day: 5, week: 1, name: 'INFERNO', theme: 'OHS + Long Chipper',
  haltero: { name: 'Overhead Squat', desc: 'OHS 3-3-3-2-2-1', scheme: '15min — Mobilité + force overhead', weights: 'overhead_squat' },
  wod: { name: 'INFERNO', type: 'For Time (cap 25min)', movements: [
    {name: 'Run 800m', reps: 1, special: 'run_800'},
    {name: 'Power Cleans', reps: 30, weight: 'power_clean'},
    {name: 'Toes-to-bar', reps: 30, gymnastics: 'toes_to_bar'},
    {name: 'Push Press', reps: 30, weight: 'push_press'},
    {name: 'Double Unders', reps: 100, gymnastics: 'double_unders'},
    {name: 'Rope Climbs', reps: 5, gymnastics: 'rope_climb'}
  ], notes: 'Energy descendante. Partez contrôlé sur le row, gardez de l\'énergie pour la fin. 🔥' },
  gym: { name: 'Skill: Rope Climb + Core', drills: ['3x1-2 Rope Climb (legless si RX)', '4x8 Strict Toes-to-bar', '3x15 GHD Sit-ups', '3x20 Hollow Rocks'] }
},

// ============ WEEK 2 ============
{
  day: 6, week: 2, name: 'WARHORSE', theme: 'Deadlift + Intervals',
  haltero: { name: 'Deadlift', desc: 'Deadlift 5-5-3-3-3', scheme: 'E3MOM 15min — Build heavy', weights: 'deadlift' },
  wod: { name: 'WARHORSE', type: 'EMOM 20 (5 rounds)', movements: [
    {name: 'Min 1: Power Cleans', reps: 5, weight: 'power_clean'},
    {name: 'Min 2: Burpees', reps: 10, gymnastics: 'burpee'},
    {name: 'Min 3: Wall Balls', reps: 15, gymnastics: 'wall_ball'},
    {name: 'Min 4: Cal Assault Bike', special: 'assault_bike'}
  ], notes: 'Finissez chaque minute en 45s max. Si vous débordez, baissez l\'intensité. Régularité > vitesse. ⚔️' },
  gym: { name: 'Skill: Double Unders', drills: ['5x30 Double Unders unbroken', '3x50 Double Unders for time', '2min Max DU practice', '3x15 Calf Raises (explosif)'] }
},
{
  day: 7, week: 2, name: 'TITAN', theme: 'Back Squat + Fran Benchmark', benchmark: 'FRAN',
  haltero: { name: 'Back Squat', desc: 'Back Squat 5x5 @75-85%', scheme: 'Every 3min x 5 sets', weights: 'back_squat' },
  wod: { name: 'FRAN', type: 'For Time (cap 10min)', movements: [
    {name: 'Thrusters', reps: 21, weight: 'thruster', note: 'RX H: 43kg (95lb) / F: 29kg (65lb)'},
    {name: 'Pull-ups', reps: 21, gymnastics: 'pullups'},
    {name: 'Thrusters', reps: 15, weight: 'thruster'},
    {name: 'Pull-ups', reps: 15, gymnastics: 'pullups'},
    {name: 'Thrusters', reps: 9, weight: 'thruster'},
    {name: 'Pull-ups', reps: 9, gymnastics: 'pullups'}
  ], notes: '🏅 BENCHMARK FRAN: Le WOD CrossFit le plus iconique. Standards: Élite H sub 2:30 / F sub 3:00. Avancé H sub 4:00 / F sub 5:00. Thrusters: essayez unbroken au 21. Pull-ups kipping fluides. Le 9 = sprint total. ⚠️ NOTEZ votre temps — vous re-testerez en semaine 12 et 20! 🏛️' },
  gym: { name: 'Skill: L-Sit + Core', drills: ['3x20s L-Sit Hold (parallettes ou anneaux)', '3x10 Strict Leg Raises', '3x15 V-ups', '2min Plank Hold'] }
},
{
  day: 8, week: 2, name: 'SCORPION', theme: 'Hang Clean + Tabata',
  haltero: { name: 'Hang Clean', desc: '3 Hang Cleans every 90s x 8 sets', scheme: 'Every 90s x 8', weights: 'hang_clean' },
  wod: { name: 'SCORPION', type: 'Tabata x 8 rounds (32min total)', movements: [
    {name: 'Tabata 1: KB Swings', reps: 'max', gymnastics: 'kb_swing'},
    {name: 'Tabata 2: Box Jumps', reps: 'max', gymnastics: 'box_jump'},
    {name: 'Tabata 3: Toes-to-bar', reps: 'max', gymnastics: 'toes_to_bar'},
    {name: 'Tabata 4: Cal Row', special: 'row_cal'}
  ], notes: '20s ON / 10s OFF x 8 rounds par mouvement. 1min rest entre chaque Tabata. Score = total reps. 🦂' },
  gym: { name: 'Skill: Pistol Squat', drills: ['3x5/leg Pistol Squats (assisté si nécessaire)', '3x10 Bulgarian Split Squats', '3x30s Single Leg Balance', '3x8 Box Pistols'] }
},
{
  day: 9, week: 2, name: 'PHANTOM', theme: 'Push Press + Sprint WOD',
  haltero: { name: 'Push Press', desc: 'Push Press 5-3-3-1-1-1', scheme: '12min — Heavy singles', weights: 'push_press' },
  wod: { name: 'PHANTOM', type: '3 Rounds For Time (cap 12min)', movements: [
    {name: 'Shoulder-to-OH', reps: 12, weight: 'shoulder_to_oh'},
    {name: 'HSPU', reps: 9, gymnastics: 'hspu'},
    {name: 'Cal Assault Bike', special: 'assault_bike'}
  ], notes: 'Sprint court mais brutal. Unbroken si possible. Gas pedal à fond dès le départ! 👻' },
  gym: { name: 'Skill: Strict Pull-ups + Weighted', drills: ['5x3 Weighted Strict Pull-ups', '3x Max Strict Pull-ups', '3x8 Tempo Pull-ups (3s descente)', '3x10 Ring Rows (pieds surélevés)'] }
},
{
  day: 10, week: 2, name: 'AVALANCHE', theme: 'Snatch + Descending Ladder',
  haltero: { name: 'Snatch Complex', desc: '1 Snatch Pull + 1 Power Snatch + 1 Hang Snatch', scheme: 'E2MOM 10min', weights: 'snatch' },
  wod: { name: 'AVALANCHE', type: '10-8-6-4-2 For Time (cap 15min)', movements: [
    {name: 'Power Snatches', reps: '10-8-6-4-2', weight: 'snatch'},
    {name: 'Bar Muscle-ups', reps: '5-4-3-2-1', gymnastics: 'muscle_ups_bar'},
    {name: 'Box Jumps', reps: '20-16-12-8-4', gymnastics: 'box_jump'}
  ], notes: 'Descending ladder. Ça devient plus facile chaque round. Snatches singles, pas de risque. 🏔️' },
  gym: { name: 'Skill: Handstand Hold + Walk', drills: ['3x45s Freestanding HS Hold attempts', '5x5m Handstand Walk', '3x5 Wall Walk strict', '3x10 Pike HSPU (on box)'] }
},

// ============ WEEK 3 ============
{
  day: 11, week: 3, name: 'VORTEX', theme: 'Clean + Chipper Long',
  haltero: { name: 'Squat Clean', desc: 'Squat Clean 3-3-2-2-1-1', scheme: '15min — Build to heavy', weights: 'squat_clean' },
  wod: { name: 'VORTEX', type: 'For Time (cap 30min)', movements: [
    {name: 'Run 800m', reps: 1, special: 'run_800'},
    {name: 'Wall Balls', reps: 50, gymnastics: 'wall_ball'},
    {name: 'Deadlifts', reps: 40, weight: 'deadlift'},
    {name: 'Pull-ups', reps: 30, gymnastics: 'pullups'},
    {name: 'Hang Cleans', reps: 20, weight: 'hang_clean'},
    {name: 'HSPU', reps: 10, gymnastics: 'hspu'}
  ], notes: 'Gros chipper 50-50-40-30-20-10. Fractionnez intelligemment. C\'est un marathon, pas un sprint. 🌪️' },
  gym: { name: 'Skill: Rope Climb', drills: ['3x2 Rope Climbs (focus technique de pieds)', '3x1 Legless Rope Climb attempts', '3x5 Strict Pull-ups (supination)', '3x10 Barbell Curls léger'] }
},
{
  day: 12, week: 3, name: 'RECKONING', theme: 'Sumo DL HP + EMOM',
  haltero: { name: 'Sumo Deadlift High Pull', desc: 'SDLHP 5x5', scheme: 'Every 2min x 5 sets', weights: 'sumo_dl_hp' },
  wod: { name: 'RECKONING', type: 'EMOM 24 (8 rounds)', movements: [
    {name: 'Min 1: Sumo DL HP', reps: 8, weight: 'sumo_dl_hp'},
    {name: 'Min 2: Double Unders', reps: 30, gymnastics: 'double_unders'},
    {name: 'Min 3: Pistols', reps: 8, gymnastics: 'pistols'}
  ], notes: 'EMOM 3 stations. Gardez 15s de repos minimum par minute. Consistent = smart. ⚖️' },
  gym: { name: 'Skill: Ring Muscle-ups', drills: ['3x3 Strict Ring Dips', '3x5 Hip to Ring Kip Swings', '5x1-2 Ring MU attempts', 'Accumulate 45s Ring Support Hold'] }
},
{
  day: 13, week: 3, name: 'RAMPAGE', theme: 'Front Squat + Classic',
  haltero: { name: 'Front Squat', desc: 'Front Squat 3x3 @80% + 2x1 @90%', scheme: '12min', weights: 'front_squat' },
  wod: { name: 'RAMPAGE', type: '15-12-9 For Time (cap 12min)', movements: [
    {name: 'Front Squats', reps: '15-12-9', weight: 'front_squat'},
    {name: 'Burpee Box Jump Overs', reps: '15-12-9', gymnastics: 'burpee'},
    {name: 'Toes-to-bar', reps: '15-12-9', gymnastics: 'toes_to_bar'}
  ], notes: 'Couplet descendant. FS légers (55-65%). TTB en max sets possibles unbroken. Envoyez le steak! 🐏' },
  gym: { name: 'Skill: HSPU Variations', drills: ['3x5 Strict HSPU', '3x3 Deficit HSPU (on plates)', '3x8 DB Z-Press', '3x Max Kipping HSPU unbroken'] }
},
{
  day: 14, week: 3, name: 'BLACKOUT', theme: 'Power Clean + Dark WOD',
  haltero: { name: 'Power Clean', desc: 'Power Clean 5x3 touch & go', scheme: 'E2MOM 10min', weights: 'power_clean' },
  wod: { name: 'BLACKOUT', type: 'AMRAP 12', movements: [
    {name: 'Power Cleans', reps: 7, weight: 'power_clean'},
    {name: 'Ring Muscle-ups', reps: 4, gymnastics: 'muscle_ups_ring'},
    {name: 'Double Unders', reps: 40, gymnastics: 'double_unders'}
  ], notes: 'Court et intense. Cleans touch & go, MU par 2, DU unbroken. Soyez agressif! 🖤' },
  gym: { name: 'Skill: Double Unders Advanced', drills: ['3x75 DU unbroken', '5x10 Triple Under attempts', '3x30 Crossover DU', '2min Max DU no miss'] }
},
{
  day: 15, week: 3, name: 'VENDETTA', theme: 'Overhead Squat + Hero Style',
  haltero: { name: 'Overhead Squat', desc: 'OHS 5-5-3-3-3 from rack', scheme: '15min — Patience en bas', weights: 'overhead_squat' },
  wod: { name: 'VENDETTA', type: 'For Time (cap 28min)', movements: [
    {name: 'Run 400m', reps: 1, special: 'run_400'},
    {name: 'KB Swings', reps: 30, gymnastics: 'kb_swing'},
    {name: 'Run 400m', reps: 1, special: 'run_400'},
    {name: 'Thrusters', reps: 25, weight: 'thruster'},
    {name: 'Run 400m', reps: 1, special: 'run_400'},
    {name: 'Rope Climbs', reps: 5, gymnastics: 'rope_climb'}
  ], notes: 'Hero-style grinder. Le run 400m intercalé va vous tester mentalement + aérobie. Respirez, avancez. Course à 80% max. 🎯🏃' },
  gym: { name: 'Skill: Pistol Squat + Mobility', drills: ['4x5/leg Pistols (full ROM)', '3x8/leg Single Leg RDL', '2x2min Couch Stretch', '3x30s Bottom of Pistol Hold'] }
},

// ============ WEEK 4 — DÉLOAD + BENCHMARKS ============
// Semaine 4 = récupération CNS + tests benchmarks pour mesurer la progression
// Volume réduit de 50% — intensité modérée — focus technique + scores de référence
{
  day: 16, week: 4, name: 'DELOAD-RECOVER', theme: 'Déload S1 — Technique & Récupération Active', deload: true,
  haltero: { name: 'Back Squat Technique', desc: 'Back Squat 5x3 @65% — Qualité > quantité. Descent 3s, explosive remontée', scheme: 'Every 3min x 5 sets — contrôlé', weights: 'back_squat' },
  wod: { name: 'RECOVER', type: 'AMRAP 10 — Effort modéré (zone 2)', movements: [
    {name: 'Air Squats', reps: 15, gymnastics: 'air_squat'},
    {name: 'Push-ups', reps: 10, gymnastics: 'pushups'},
    {name: 'Sit-ups', reps: 15, gymnastics: 'situps'},
    {name: 'Cal Row', special: 'row_cal', note: '10/8 cal — rythme conversationnel'}
  ], notes: '🔄 SEMAINE DÉLOAD: Après 3 semaines de charge maximale, votre CNS (système nerveux central) a besoin de récupérer. Volume -50%, intensité -30%. Aérobie facile. Respirez. Votre corps reconstruit pendant le repos. Récupération = performance future. 💤' },
  gym: { name: 'Mobilité & Régénération', drills: ['5min Foam Roll complet (quads, fessiers, dorsaux)', '3x2min Pigeon Stretch chaque côté', '3x1min Couch Stretch chaque côté', '5min Easy Row zone 1 (FC < 130)'] }
},
{
  day: 17, week: 4, name: 'HELEN', theme: 'Benchmark officiel — Helen (Course + KB + Pull-ups)', benchmark: 'HELEN', deload: true,
  haltero: { name: 'Snatch Technique Légère', desc: 'Power Snatch technique 5x3 @60% — Connexion sol-barre', scheme: '10min — Focus sur le timing', weights: 'snatch' },
  wod: { name: 'HELEN', type: '3 Rounds For Time (cap 15min)', movements: [
    {name: 'Run 400m', reps: 1, special: 'run_400'},
    {name: 'KB Swings American', reps: 21, gymnastics: 'kb_swing', note: 'H: 24kg / F: 16kg'},
    {name: 'Pull-ups', reps: 12, gymnastics: 'pullups'}
  ], notes: '🏅 BENCHMARK HELEN: Course + KB + Gymnastics. Standards CrossFit Games. Objectifs: Élite H sub 9:00 / F sub 10:30. Avancé H sub 10:30 / F sub 12:00. Course à 85% effort. KB swings unbroken si possible. Pull-ups kipping. ⚠️ NOTEZ votre score — vous re-testerez en Week 12 et Week 20! 🏃‍♂️' },
  gym: { name: 'Skill: Running Economy', drills: ['3x200m Run @85% (récup 90s entre)', '3x20 High Knees + Butt Kicks', '3x10 Single Leg Bounds', '5min Easy Walk — cool down complet'] }
},
{
  day: 18, week: 4, name: 'ISABEL', theme: 'Benchmark officiel — Isabel (30 Snatches)', benchmark: 'ISABEL', deload: true,
  haltero: { name: 'Snatch Warm-up', desc: 'Montée activation: 3x3 @50%, 3x2 @65%, 2x1 @75% — Préparez le PR', scheme: '12min — Progression', weights: 'snatch' },
  wod: { name: 'ISABEL', type: 'For Time (cap 8min)', movements: [
    {name: 'Power Snatches', reps: 30, weight: 'snatch', note: 'RX H: 61kg (135lb) / F: 43kg (95lb) — ou 65-70% de votre 1RM'}
  ], notes: '🏅 BENCHMARK ISABEL: 30 snatches, le plus vite possible. Standards CrossFit Games. Objectifs: Élite H sub 1:30 / F sub 2:00. Avancé H sub 2:30 / F sub 3:00. Touch-and-go tant que technique = parfaite. Singles dès que ça se dégrade. Poids > timing. ⚠️ NOTEZ votre temps et le poids utilisé! ⚡' },
  gym: { name: 'Skill: Snatch Efficiency', drills: ['3x5 Snatch High Pull (connexion tirage)', '3x3 Muscle Snatch (technique overhead)', '3x3 Snatch Balance (réception rapide)', '5min Band stretches épaules + thoracique'] }
},
{
  day: 19, week: 4, name: 'CINDY', theme: 'Benchmark officiel — Cindy (Pure Gymnastics AMRAP)', benchmark: 'CINDY', deload: true,
  haltero: { name: 'Push Press Activation', desc: 'Push Press 3x8 @55% — Léger, warm-up pour le WOD', scheme: '8min — Activation légère', weights: 'push_press' },
  wod: { name: 'CINDY', type: 'AMRAP 20', movements: [
    {name: 'Pull-ups', reps: 5, gymnastics: 'pullups'},
    {name: 'Push-ups', reps: 10, gymnastics: 'pushups'},
    {name: 'Air Squats', reps: 15, gymnastics: 'air_squat'}
  ], notes: '🏅 BENCHMARK CINDY: Gymnastics pur — aucun équipement nécessaire. Standards CrossFit Games. Objectifs: Élite H 25+ rounds / F 20+ rounds. Avancé H 20+ / F 16+. Pull-ups CHIN ABOVE BAR. Push-ups CHEST TO GROUND. Squats full depth. PACE RÉGULIER = plus de rounds. ⚠️ NOTEZ votre score! 💪' },
  gym: { name: 'Skill: Gymnastics Fondations', drills: ['3x5 Strict Pull-ups (weighted si >25 rounds Cindy)', '3x10 Ring Push-ups', '3x15 Air Squats tempo (3s descente)', '3x1min Hollow Body Hold'] }
},
{
  day: 20, week: 4, name: 'ANNIE', theme: 'Benchmark officiel — Annie (Double Unders + Sit-ups)', benchmark: 'ANNIE', deload: true,
  haltero: { name: 'Deadlift Technique', desc: 'Deadlift 3x5 @60% — Position impeccable, chaque rep identique', scheme: '10min — Qualité technique', weights: 'deadlift' },
  wod: { name: 'ANNIE', type: '50-40-30-20-10 For Time (cap 12min)', movements: [
    {name: 'Double Unders', reps: '50-40-30-20-10', gymnastics: 'double_unders'},
    {name: 'Abmat Sit-ups', reps: '50-40-30-20-10', gymnastics: 'situps'}
  ], notes: '🏅 BENCHMARK ANNIE: DU + Core. Standards CrossFit Games. Objectifs: Élite H sub 5:00 / F sub 5:30. Avancé H sub 7:00 / F sub 8:00. DU unbroken au maximum. Sit-ups: ancrez les pieds, touchez les orteils en haut. Alternez round par round. ⚠️ NOTEZ votre score! 🎯 FIN SEMAINE 4 DÉLOAD = batteries rechargées pour les semaines 5-7! 🔋' },
  gym: { name: 'Skill: Double Under Mastery', drills: ['5x30 DU unbroken', '3x50 DU for time', '3x Max DU no miss attempts', '5min Easy Bike — récupération finale S4'] }
},

// ============ WEEK 5 ============
{
  day: 21, week: 5, name: 'WILDFIRE', theme: 'Squat Clean + Sprint',
  haltero: { name: 'Squat Clean', desc: '1 Squat Clean + 1 Front Squat every 90s', scheme: 'Every 90s x 10 sets', weights: 'squat_clean' },
  wod: { name: 'WILDFIRE', type: 'For Time (cap 8min)', movements: [
    {name: 'Squat Cleans', reps: 15, weight: 'squat_clean'},
    {name: 'Bar Muscle-ups', reps: 15, gymnastics: 'muscle_ups_bar'},
    {name: 'Squat Cleans', reps: 10, weight: 'squat_clean'},
    {name: 'Bar Muscle-ups', reps: 10, gymnastics: 'muscle_ups_bar'},
    {name: 'Squat Cleans', reps: 5, weight: 'squat_clean'},
    {name: 'Bar Muscle-ups', reps: 5, gymnastics: 'muscle_ups_bar'}
  ], notes: 'Sprint pur. 15-10-5 couplet. Léger sur les cleans. BMU en max sets. Tout donner! 🔥🔥' },
  gym: { name: 'Skill: Ring Muscle-ups Progression', drills: ['3x5 Strict Ring Dips', '3x3 Banded Ring MU Transitions', '5x1-2 Ring Muscle-ups', '3x10s Ring Support (turnout)'] }
},
{
  day: 22, week: 5, name: 'COLOSSUS', theme: 'Back Squat + Volume',
  haltero: { name: 'Back Squat', desc: 'Back Squat 10-8-6-4-2', scheme: '15min — Ascending weight', weights: 'back_squat' },
  wod: { name: 'COLOSSUS', type: 'AMRAP 18', movements: [
    {name: 'Front Squats', reps: 8, weight: 'front_squat'},
    {name: 'Toes-to-bar', reps: 10, gymnastics: 'toes_to_bar'},
    {name: 'Wall Balls', reps: 14, gymnastics: 'wall_ball'},
    {name: 'Cal Row', special: 'row_cal'}
  ], notes: 'Legs lourdes après le back squat. Contrôlez le pace. Wall Balls unbroken = votre objectif. 🗿' },
  gym: { name: 'Skill: Handstand Walk + Balance', drills: ['5x10m Handstand Walk', '3x HS Walk around cones', '3x5 HS Walk to wall', '3x30s Freestanding HS Hold'] }
},
{
  day: 23, week: 5, name: 'HELLFIRE', theme: 'Clean & Jerk + Descending',
  haltero: { name: 'Clean & Jerk', desc: '1 Clean + 2 Jerks', scheme: 'E2MOM 12min — Build to heavy', weights: 'clean' },
  wod: { name: 'HELLFIRE', type: '21-15-9 For Time (cap 14min)', movements: [
    {name: 'Hang Cleans', reps: '21-15-9', weight: 'hang_clean'},
    {name: 'HSPU', reps: '21-15-9', gymnastics: 'hspu'},
    {name: 'Cal Assault Bike', special: 'assault_bike', note: '21-15-9 cal'}
  ], notes: '21-15-9 triplet. Fractionnez les HSPU: 7-7-7 / 5-5-5 / unbroken. Le bike va brûler. 🔥💀' },
  gym: { name: 'Skill: Core Strength', drills: ['4x10 Strict Toes-to-bar', '3x15 GHD Sit-ups', '3x20 Russian Twists (KB)', '3x1min Hollow Body Hold'] }
},
{
  day: 24, week: 5, name: 'SENTINEL', theme: 'Shoulder-to-OH + Mixed Modal',
  haltero: { name: 'Shoulder-to-OH', desc: 'Push Press + Push Jerk combo 3+2 x 5 sets', scheme: 'E2MOM 10min', weights: 'shoulder_to_oh' },
  wod: { name: 'SENTINEL', type: 'EMOM 30 (6 rounds)', movements: [
    {name: 'Min 1: Shoulder-to-OH', reps: 8, weight: 'shoulder_to_oh'},
    {name: 'Min 2: Pull-ups', reps: 12, gymnastics: 'pullups'},
    {name: 'Min 3: KB Swings', reps: 15, gymnastics: 'kb_swing'},
    {name: 'Min 4: Double Unders', reps: 40, gymnastics: 'double_unders'},
    {name: 'Min 5: Burpees', reps: 8, gymnastics: 'burpee'}
  ], notes: '30min EMOM. Restez dans la zone de 40-45s de travail par minute. C\'est un long game. 🛡️⚡' },
  gym: { name: 'Skill: Pistols + Single Leg', drills: ['4x5/leg Pistol Squats', '3x8/leg Step-up (heavy DB)', '3x10/leg Single Leg Glute Bridge', '2x1min/leg Couch Stretch'] }
},
{
  day: 25, week: 5, name: 'LEVIATHAN', theme: 'Power Clean + Monster WOD',
  haltero: { name: 'Power Clean', desc: 'Power Clean clusters 2.2.2 x 5 sets', scheme: 'E2MOM 10min — 10s rest between reps', weights: 'power_clean' },
  wod: { name: 'LEVIATHAN', type: 'For Time (cap 30min)', movements: [
    {name: 'Double Unders', reps: 100, gymnastics: 'double_unders'},
    {name: 'Thrusters', reps: 50, weight: 'thruster'},
    {name: 'Pull-ups', reps: 40, gymnastics: 'pullups'},
    {name: 'Power Cleans', reps: 30, weight: 'power_clean'},
    {name: 'Ring Muscle-ups', reps: 20, gymnastics: 'muscle_ups_ring'},
    {name: 'Rope Climbs', reps: 10, gymnastics: 'rope_climb'}
  ], notes: 'Le monstre. 100-50-40-30-20-10. Fractionnez TOUT. Thrusters 10x5, Pull-ups 8x5, Cleans 6x5. Survivez. 🐉' },
  gym: { name: 'Skill: Muscle-ups + Pulling Strength', drills: ['3x3 Ring Muscle-ups (or attempts)', '3x5 Weighted Pull-ups', '3x8 Strict C2B Pull-ups', 'Accumulate 1min L-sit'] }
},
// --- END PART 1 (days 1-25) --- PART 2 CONTINUES ---

// ============ WEEK 6 ============
{
  day: 26, week: 6, name: 'BARRACUDA', theme: 'Hang Clean + Interval Sprint',
  haltero: { name: 'Hang Clean', desc: 'Hang Clean 2-2-2-2-2 @80%+', scheme: 'E2MOM 10min', weights: 'hang_clean' },
  wod: { name: 'BARRACUDA', type: '5 Rounds For Time (cap 18min)', movements: [
    {name: 'Hang Cleans', reps: 8, weight: 'hang_clean'},
    {name: 'Box Jumps', reps: 12, gymnastics: 'box_jump'},
    {name: 'Cal Row', special: 'row_cal'}
  ], notes: 'Sprint each round, rest between. Row 15/12 cal per round. Touch & go cleans if possible.' },
  gym: { name: 'Skill: Toes-to-bar Efficiency', drills: ['3x10 Kipping TTB', '3x5 Strict TTB', '3x15 V-ups', '2min Max TTB unbroken attempt'] }
},
{
  day: 27, week: 6, name: 'UPRISING', theme: 'Thruster + Pyramid',
  haltero: { name: 'Thruster', desc: 'Thruster 5-5-3-3-1', scheme: '12min — Build to heavy single', weights: 'thruster' },
  wod: { name: 'UPRISING', type: '1-2-3-4-5-4-3-2-1 Pyramid (cap 16min)', movements: [
    {name: 'Thrusters', reps: '1-2-3-4-5-4-3-2-1', weight: 'thruster'},
    {name: 'Rope Climbs', reps: '1-2-3-4-5-4-3-2-1', gymnastics: 'rope_climb'}
  ], notes: 'Pyramid montante puis descendante. Thrusters moderes. Rope climbs rapides. Le round 5 est le sommet.' },
  gym: { name: 'Skill: Weighted Dips', drills: ['3x5 Weighted Ring Dips', '3x8 Strict Bar Dips', '3x10 Push-ups (deficit)', '3x15 Tricep Kickbacks'] }
},
{
  day: 28, week: 6, name: 'PREDATOR', theme: 'Deadlift + Dark AMRAP',
  haltero: { name: 'Deadlift', desc: 'Deadlift 5x3 @85%', scheme: 'E3MOM 15min', weights: 'deadlift' },
  wod: { name: 'PREDATOR', type: 'AMRAP 14', movements: [
    {name: 'Deadlifts', reps: 9, weight: 'deadlift'},
    {name: 'Double Unders', reps: 36, gymnastics: 'double_unders'},
    {name: 'Bar Muscle-ups', reps: 3, gymnastics: 'muscle_ups_bar'},
    {name: 'Burpees', reps: 6, gymnastics: 'burpee'}
  ], notes: 'Grip sera un facteur limitant. DL en sets de 3 si necessaire. BMU frais entre les DU et burpees.' },
  gym: { name: 'Skill: Strict Gymnastics', drills: ['3x5 Strict C2B Pull-ups', '3x5 Strict Ring Dips', '3x8 Strict HSPU (or pike)', '3x10 Hollow Body Rocks'] }
},
{
  day: 29, week: 6, name: 'GRIZZLY', theme: 'Front Squat + Bear Complex',
  haltero: { name: 'Front Squat', desc: 'Front Squat 5x2 @85-90%', scheme: 'E3MOM 15min', weights: 'front_squat' },
  wod: { name: 'GRIZZLY', type: 'For Time (cap 20min)', movements: [
    {name: 'Front Squats', reps: 30, weight: 'front_squat'},
    {name: 'KB Swings', reps: 40, gymnastics: 'kb_swing'},
    {name: 'Wall Balls', reps: 50, gymnastics: 'wall_ball'},
    {name: 'Cal Assault Bike', special: 'assault_bike', note: '40/30 cal'}
  ], notes: 'Chipper lourd. FS en sets de 5. KB unbroken si possible. Wall Balls 10-10-10-10-10. Bike = finish line.' },
  gym: { name: 'Skill: Box Jump Variations', drills: ['3x5 Box Jump (max height)', '3x10 Box Jump Overs', '3x8 Seated Box Jump', '3x12 Step-ups (weighted)'] }
},
{
  day: 30, week: 6, name: 'NEMESIS', theme: 'Snatch + Sprint Couplet',
  haltero: { name: 'Snatch', desc: 'Snatch 3-2-2-1-1-1', scheme: '15min — Build to max', weights: 'snatch' },
  wod: { name: 'NEMESIS', type: '3 Rounds For Time (cap 10min)', movements: [
    {name: 'Power Snatches', reps: 10, weight: 'snatch'},
    {name: 'HSPU', reps: 15, gymnastics: 'hspu'}
  ], notes: 'Court et explosif. Snatches singles OK. HSPU en gros sets. Sprint total chaque round.' },
  gym: { name: 'Skill: Overhead Mobility', drills: ['3x5 Snatch Grip Push Press (behind neck)', '3x30s Overhead Squat Hold (bottom)', '2x2min Banded Shoulder Stretch', '3x10 Snatch Grip Deadlift'] }
},

// ============ WEEK 7 ============
{
  day: 31, week: 7, name: 'JUGGERNAUT', theme: 'Back Squat + Long Grinder',
  haltero: { name: 'Back Squat', desc: 'Back Squat 5-5-5-3-3', scheme: 'E3MOM 15min — Ascending', weights: 'back_squat' },
  wod: { name: 'JUGGERNAUT', type: 'AMRAP 22', movements: [
    {name: 'Wall Balls', reps: 18, gymnastics: 'wall_ball'},
    {name: 'Deadlifts', reps: 12, weight: 'deadlift'},
    {name: 'Pistols', reps: 8, gymnastics: 'pistols'},
    {name: 'Toes-to-bar', reps: 10, gymnastics: 'toes_to_bar'},
    {name: 'Cal Row', special: 'row_cal'}
  ], notes: '22min de travail. Pace regulier. Wall Balls en 9-9. DL moderé pour garder le grip. Visez 4+ rounds.' },
  gym: { name: 'Skill: Handstand Push-ups Kipping', drills: ['3x Max Kipping HSPU', '3x5 Strict HSPU', '3x8 Pike HSPU (feet on box)', '3x10 DB Push Press'] }
},
{
  day: 32, week: 7, name: 'CYCLONE', theme: 'Power Clean + Rotating EMOM',
  haltero: { name: 'Power Clean', desc: 'Power Clean 3x5 touch & go', scheme: 'E2MOM 6min then 5x2 heavy', weights: 'power_clean' },
  wod: { name: 'CYCLONE', type: 'EMOM 28 (7 rounds)', movements: [
    {name: 'Min 1: Power Cleans', reps: 6, weight: 'power_clean'},
    {name: 'Min 2: Toes-to-bar', reps: 10, gymnastics: 'toes_to_bar'},
    {name: 'Min 3: Double Unders', reps: 40, gymnastics: 'double_unders'},
    {name: 'Min 4: Burpee Box Jumps', reps: 6, gymnastics: 'burpee'}
  ], notes: '28min EMOM rotatif. Visez 45s de travail max par minute. Ajustez les reps si besoin.' },
  gym: { name: 'Skill: Ring Work', drills: ['3x10 Ring Push-ups', '3x5 Ring Support Turnout', '3x5 Skin the Cat', '3x30s L-sit on Rings'] }
},
{
  day: 33, week: 7, name: 'WOLVERINE', theme: 'Clean & Jerk + Classic 21-15-9',
  haltero: { name: 'Clean & Jerk', desc: '1 Clean + 1 Jerk every 90s x 10', scheme: 'Every 90s x 10 — Build to heavy', weights: 'clean' },
  wod: { name: 'WOLVERINE', type: '21-15-9 For Time (cap 11min)', movements: [
    {name: 'Squat Cleans', reps: '21-15-9', weight: 'squat_clean'},
    {name: 'Ring Muscle-ups', reps: '7-5-3', gymnastics: 'muscle_ups_ring'}
  ], notes: 'Squat Cleans legers. Ring MU en petites series. Couplet classique avec volume descendant sur les MU.' },
  gym: { name: 'Skill: Clean Technique', drills: ['3x5 Hang Muscle Clean', '3x3 Tall Clean', '3x5 Clean from blocks', '3x5 Front Squat (pause 2s)'] }
},
{
  day: 34, week: 7, name: 'MINOTAUR', theme: 'Overhead Squat + Labyrinth',
  haltero: { name: 'Overhead Squat', desc: 'OHS 5-3-3-1-1-1', scheme: '15min — Max attempt', weights: 'overhead_squat' },
  wod: { name: 'MINOTAUR', type: 'For Time (cap 24min)', movements: [
    {name: 'OHS', reps: 15, weight: 'overhead_squat'},
    {name: 'Pull-ups', reps: 30, gymnastics: 'pullups'},
    {name: 'OHS', reps: 12, weight: 'overhead_squat'},
    {name: 'Double Unders', reps: 60, gymnastics: 'double_unders'},
    {name: 'OHS', reps: 9, weight: 'overhead_squat'},
    {name: 'Rope Climbs', reps: 6, gymnastics: 'rope_climb'}
  ], notes: 'OHS legers (50-60%). Alternance force overhead et cardio. Chaque section descend en OHS. Restez stable.' },
  gym: { name: 'Skill: Overhead Stability', drills: ['3x30s Overhead KB Hold (single arm)', '3x5 Sots Press', '3x8 Snatch Balance', '2x1min Overhead Squat Hold (bottom)'] }
},
{
  day: 35, week: 7, name: 'HYDRA', theme: 'Sumo DL HP + Multi-Head WOD',
  haltero: { name: 'Sumo Deadlift High Pull', desc: 'SDLHP 4x6 ascending', scheme: 'E2MOM 8min', weights: 'sumo_dl_hp' },
  wod: { name: 'HYDRA', type: '4 Rounds For Time (cap 22min)', movements: [
    {name: 'Sumo DL HP', reps: 10, weight: 'sumo_dl_hp'},
    {name: 'Box Jumps', reps: 12, gymnastics: 'box_jump'},
    {name: 'HSPU', reps: 8, gymnastics: 'hspu'},
    {name: 'KB Swings', reps: 16, gymnastics: 'kb_swing'},
    {name: 'Cal Assault Bike', special: 'assault_bike'}
  ], notes: '5 mouvements par round. Rythme soutenu mais pas de sprint. Chaque tete de l\'hydre est un mouvement.' },
  gym: { name: 'Skill: KB Mastery', drills: ['3x10 KB Turkish Get-up (alternating)', '3x12 KB Goblet Squat', '3x10/arm KB Single Arm Swing', '3x8 KB Snatch (each arm)'] }
},

// ============ WEEK 8 — DÉLOAD ============
// Deload #2 — Récupération après 7 semaines de charge. CNS = priorité absolue.
// Volume -50%, intensité @65-70%, focus technique + mobilité
{
  day: 36, week: 8, name: 'ECLIPSE-DELOAD', theme: 'Déload S2 — Clean Technique + Volume Réduit', deload: true,
  haltero: { name: 'Clean Complex Léger', desc: '1 Power Clean + 2 Front Squats @65% — Technique prioritaire', scheme: 'E2MOM 10min — Léger', weights: 'clean' },
  wod: { name: 'ECLIPSE-LIGHT', type: '20-15-10-5 For Time (cap 12min)', movements: [
    {name: 'Double Unders', reps: '60-45-30-15', gymnastics: 'double_unders'},
    {name: 'Wall Balls', reps: '20-15-10-5', gymnastics: 'wall_ball'},
    {name: 'Power Cleans', reps: '5-4-3-2', weight: 'power_clean', note: '@60% — technique propre'}
  ], notes: '🔄 DÉLOAD S8: Volume divisé par 2. Mêmes mouvements, moitié moins de reps. Rythme conversationnel. Respirez. Votre corps consolide les adaptations des S5-7. 💤' },
  gym: { name: 'Mobilité & Récupération Active', drills: ['5min Foam Roll (dorsaux, mollets, ITB)', '3x2min Hip Flexor Stretch', '3x1min Overhead Mobility (band)', '5min Easy Bike zone 1'] }
},
{
  day: 37, week: 8, name: 'SPARTAN-DELOAD', theme: 'Déload S2 — Push Press Technique + Circuit Court', deload: true,
  haltero: { name: 'Push Press Technique', desc: 'Push Press 5x3 @65% — Dip vertical, drive explosif', scheme: 'E2MOM 10min — Léger', weights: 'push_press' },
  wod: { name: 'SPARTAN-LIGHT', type: '3 Rounds For Time (cap 12min)', movements: [
    {name: 'Push Press', reps: 6, weight: 'push_press', note: '@60%'},
    {name: 'Pull-ups', reps: 8, gymnastics: 'pullups'},
    {name: 'Burpees', reps: 5, gymnastics: 'burpee'},
    {name: 'Cal Row', special: 'row_cal', note: '10/8 cal — pace modéré'}
  ], notes: '🔄 DÉLOAD S8: 3 rounds au lieu de 6. Poids réduits. Pas de PR, pas de compétition. Mouvement fluide = objectif. 💤' },
  gym: { name: 'Skill: Strict Pull-ups Technique', drills: ['5x3 Strict Pull-ups (focus scapulaire)', '3x8 Ring Rows (contrôle)', '3x6 Tempo Pull-ups (4s descente)', '3x10 Face Pulls (bandes)'] }
},
{
  day: 38, week: 8, name: 'RAPTOR-DELOAD', theme: 'Déload S2 — Snatch Léger + Aérobie', deload: true,
  haltero: { name: 'Snatch Technique', desc: 'Power Snatch 5x3 @60% — Chaque rep parfaite, pas de rush', scheme: 'E90s x 5 — Léger', weights: 'snatch' },
  wod: { name: 'RAPTOR-LIGHT', type: '5 Rounds: 30s ON / 30s OFF — Zone 2', movements: [
    {name: 'Power Snatches', reps: 'max contrôlé', weight: 'snatch', note: '@55% — technique > vitesse'},
    {name: 'Toes-to-bar', reps: 'max contrôlé', gymnastics: 'toes_to_bar'}
  ], notes: '🔄 DÉLOAD S8: 5 rounds au lieu de 8. Intensité zone 2 (conversationnel). Snatches avec 3s de reset entre chaque rep. TTB qualité. Déload = actif, pas inactif. 💤' },
  gym: { name: 'Skill: Snatch Drills', drills: ['3x5 Snatch High Pull (slow)', '3x3 Hang Muscle Snatch', '3x5 OHS (pause 2s en bas)', '5min Mobilité épaules + thoracique'] }
},
{
  day: 39, week: 8, name: 'FORTRESS-DELOAD', theme: 'Déload S2 — Back Squat Léger + Récupération', deload: true,
  haltero: { name: 'Back Squat Technique', desc: 'Back Squat 3x5 @65% — Descent lent 3s, explosif remontée', scheme: 'E3min x 3 sets — Léger', weights: 'back_squat' },
  wod: { name: 'FORTRESS-LIGHT', type: 'For Time (cap 10min)', movements: [
    {name: 'Deadlifts', reps: 10, weight: 'deadlift', note: '@60%'},
    {name: 'Handstand Walk', reps: '15m', gymnastics: 'handstand_walk'},
    {name: 'Deadlifts', reps: 8, weight: 'deadlift'},
    {name: 'Handstand Walk', reps: '10m', gymnastics: 'handstand_walk'}
  ], notes: '🔄 DÉLOAD S8: Volume DL réduit de 50%. HS walk = skill focus, pas cardiovasculaire. Pace détendu. Grip management. 💤' },
  gym: { name: 'Skill: HS Walk Technique', drills: ['3x10m HS Walk contrôlé', '3x5 Wall Walk (slow)', '3x10 Shoulder Taps en HS', '5min Foam Roll + étirements dorsaux'] }
},
{
  day: 40, week: 8, name: 'KRONOS-DELOAD', theme: 'Déload S2 — S2OH + AMRAP Court', deload: true,
  haltero: { name: 'Shoulder-to-OH Technique', desc: 'S2OH 3x3 @65% (push press ou push jerk)', scheme: 'E2MOM 6min — Léger', weights: 'shoulder_to_oh' },
  wod: { name: 'KRONOS-LIGHT', type: 'AMRAP 10 — Zone 2', movements: [
    {name: 'Shoulder-to-OH', reps: 5, weight: 'shoulder_to_oh', note: '@60%'},
    {name: 'Ring Dips', reps: 5, gymnastics: 'ring_dips'},
    {name: 'Pistols', reps: 6, gymnastics: 'pistols'},
    {name: 'Double Unders', reps: 30, gymnastics: 'double_unders'}
  ], notes: '🔄 DÉLOAD S8: 10min au lieu de 16min. Reps réduits. DU = 30 au lieu de 50. Aérobie facile. FIN DÉLOAD S8 — rechargé pour S9-11! 🔋' },
  gym: { name: 'Récupération Active Finale S8', drills: ['3x5/leg Pistol Squats (focus technique)', '3x8 Ring Dips contrôlés', '5x20 DU relaxés', '10min Easy Row ou Bike zone 1'] }
},

// ============ WEEK 9 ============
{
  day: 41, week: 9, name: 'PHOENIX', theme: 'Squat Clean + Rebirth Chipper',
  haltero: { name: 'Squat Clean', desc: 'Squat Clean 2-2-1-1-1-1', scheme: 'E2MOM 12min — Max effort', weights: 'squat_clean' },
  wod: { name: 'PHOENIX', type: 'For Time (cap 26min)', movements: [
    {name: 'Cal Assault Bike', special: 'assault_bike', note: '30/25 cal'},
    {name: 'Squat Cleans', reps: 20, weight: 'squat_clean'},
    {name: 'Bar Muscle-ups', reps: 15, gymnastics: 'muscle_ups_bar'},
    {name: 'Thrusters', reps: 20, weight: 'thruster'},
    {name: 'Cal Assault Bike', special: 'assault_bike', note: '30/25 cal'}
  ], notes: 'Sandwich: Bike-Barbell-Gymnastics-Barbell-Bike. Fractionnez les cleans 4x5. BMU 3-3-3-3-3.' },
  gym: { name: 'Skill: Bar Muscle-up Technique', drills: ['3x5 Chest-to-bar Pull-ups (big kip)', '3x3 Glide Kip to Hip', '5x1-3 Bar MU attempts', '3x10 Lat Pulldowns'] }
},
{
  day: 42, week: 9, name: 'CATALYST', theme: 'Deadlift + Mixed Intervals',
  haltero: { name: 'Deadlift', desc: 'Deadlift 5-3-3-1-1-1', scheme: '15min — Build to max', weights: 'deadlift' },
  wod: { name: 'CATALYST', type: 'EMOM 20 (4 rounds)', movements: [
    {name: 'Min 1: Deadlifts', reps: 8, weight: 'deadlift'},
    {name: 'Min 2: HSPU', reps: 8, gymnastics: 'hspu'},
    {name: 'Min 3: KB Swings', reps: 16, gymnastics: 'kb_swing'},
    {name: 'Min 4: Box Jumps', reps: 12, gymnastics: 'box_jump'},
    {name: 'Min 5: Cal Row', special: 'row_cal'}
  ], notes: '5 stations, 4 rounds. DL modere pour proteger le dos. HSPU fractionnez si besoin. Steady state.' },
  gym: { name: 'Skill: GHD + Core', drills: ['3x20 GHD Sit-ups', '3x15 GHD Hip Extensions', '3x10 GHD Back Extensions', '3x1min Hollow Hold'] }
},
{
  day: 43, week: 9, name: 'HAVOC', theme: 'Power Clean + Chaos WOD',
  haltero: { name: 'Power Clean', desc: 'Power Clean clusters 1.1.1 x 8 sets', scheme: 'E90s x 8 — 5s rest between', weights: 'power_clean' },
  wod: { name: 'HAVOC', type: 'For Time (cap 15min)', movements: [
    {name: 'Power Cleans', reps: 15, weight: 'power_clean'},
    {name: 'Pull-ups', reps: 30, gymnastics: 'pullups'},
    {name: 'Power Cleans', reps: 12, weight: 'power_clean'},
    {name: 'Toes-to-bar', reps: 24, gymnastics: 'toes_to_bar'},
    {name: 'Power Cleans', reps: 9, weight: 'power_clean'},
    {name: 'Burpees', reps: 18, gymnastics: 'burpee'}
  ], notes: 'Cleans descending, gymnastics descending. Chaque section plus courte. Accelerez au fil du WOD.' },
  gym: { name: 'Skill: Burpee Efficiency', drills: ['5x10 Burpees for speed', '3x8 Burpee Box Jump Overs', '3x6 Burpee Pull-ups', '2x15 Burpees unbroken (pace)'] }
},
{
  day: 44, week: 9, name: 'ATLAS', theme: 'Front Squat + Giant Set',
  haltero: { name: 'Front Squat', desc: 'Front Squat 3-3-2-2-1-1', scheme: '15min — Build to heavy', weights: 'front_squat' },
  wod: { name: 'ATLAS', type: 'AMRAP 20', movements: [
    {name: 'Front Squats', reps: 5, weight: 'front_squat'},
    {name: 'Handstand Walk', reps: '10m', gymnastics: 'handstand_walk'},
    {name: 'Wall Balls', reps: 15, gymnastics: 'wall_ball'},
    {name: 'Rope Climbs', reps: 2, gymnastics: 'rope_climb'},
    {name: 'Cal Assault Bike', special: 'assault_bike'}
  ], notes: '20min grinder. FS heavy mais peu de reps. HS Walk = repos actif. Visez 4+ rounds complets.' },
  gym: { name: 'Skill: Rope Climb Speed', drills: ['3x3 Rope Climbs for time', '3x1 Legless Rope Climb', '3x5 Strict Pull-ups (towel grip)', '3x30s Dead Hang'] }
},
{
  day: 45, week: 9, name: 'VENOM', theme: 'Hang Clean + Toxic Triplet',
  haltero: { name: 'Hang Clean', desc: 'Hang Squat Clean 3x3 + 3x2 ascending', scheme: 'E2MOM 12min', weights: 'hang_clean' },
  wod: { name: 'VENOM', type: '12-9-6 For Time (cap 12min)', movements: [
    {name: 'Hang Cleans', reps: '12-9-6', weight: 'hang_clean'},
    {name: 'Bar Muscle-ups', reps: '6-4-2', gymnastics: 'muscle_ups_bar'},
    {name: 'Assault Bike Cal', special: 'assault_bike', note: '18-12-6 cal'}
  ], notes: 'Triplet descendant. Cleans touch & go round 1, singles OK round 2-3. BMU grandes series.' },
  gym: { name: 'Skill: Pulling Endurance', drills: ['Max Pull-ups in 5min', '3x8 Chest-to-bar Pull-ups', '3x12 Ring Rows (feet elevated)', '3x20 Banded Pull Aparts'] }
},

// ============ WEEK 10 ============
{
  day: 46, week: 10, name: 'CENTURION', theme: 'Back Squat + Century Challenge',
  haltero: { name: 'Back Squat', desc: 'Back Squat 10-8-6-4-2 ascending', scheme: '15min', weights: 'back_squat' },
  wod: { name: 'CENTURION', type: 'For Time (cap 25min)', movements: [
    {name: 'Thrusters', reps: 25, weight: 'thruster'},
    {name: 'Pull-ups', reps: 25, gymnastics: 'pullups'},
    {name: 'Push Press', reps: 25, weight: 'push_press'},
    {name: 'Box Jumps', reps: 25, gymnastics: 'box_jump'}
  ], notes: '100 reps total, 4 mouvements x 25. Pace soutenu. Thrusters 5x5. Pull-ups en sets de 5-8.' },
  gym: { name: 'Skill: Box Jump Height', drills: ['3x3 Box Jump (max height)', '3x5 Depth Jumps', '3x6 Broad Jumps', '3x8 Jump Squats'] }
},
{
  day: 47, week: 10, name: 'WRAITH', theme: 'Snatch + Ghost Intervals',
  haltero: { name: 'Snatch Complex', desc: '1 Snatch Deadlift + 1 Hang Snatch + 1 OHS', scheme: 'E2MOM 12min', weights: 'snatch' },
  wod: { name: 'WRAITH', type: '10 Rounds: 1min ON / 1min OFF', movements: [
    {name: 'Power Snatches', reps: 3, weight: 'snatch'},
    {name: 'Double Unders', reps: 15, gymnastics: 'double_unders'},
    {name: 'HSPU', reps: 3, gymnastics: 'hspu'}
  ], notes: '1min de travail, 1min de repos x 10 rounds. Completez les 3 mouvements dans la minute. Score = rounds completed.' },
  gym: { name: 'Skill: Double Under Speed', drills: ['5x50 DU for time', '3x20 High DU (jump higher)', '3x30 Alternating foot DU', '1x100 DU unbroken attempt'] }
},
{
  day: 48, week: 10, name: 'SOVEREIGN', theme: 'Clean + Royal Chipper',
  haltero: { name: 'Clean & Jerk', desc: '1 Squat Clean + 1 Split Jerk x 8 sets', scheme: 'E90s x 8 — Build to heavy', weights: 'clean' },
  wod: { name: 'SOVEREIGN', type: 'For Time (cap 28min)', movements: [
    {name: 'Cal Row', special: 'row_cal', note: '50/40 cal'},
    {name: 'Shoulder-to-OH', reps: 30, weight: 'shoulder_to_oh'},
    {name: 'Toes-to-bar', reps: 30, gymnastics: 'toes_to_bar'},
    {name: 'Hang Cleans', reps: 20, weight: 'hang_clean'},
    {name: 'Ring Muscle-ups', reps: 10, gymnastics: 'muscle_ups_ring'},
    {name: 'Pistols', reps: 20, gymnastics: 'pistols'}
  ], notes: 'Chipper royal. Row = warm-up. S2OH en 6x5. TTB en 5x6. Hang Cleans 4x5. Ring MU 5x2.' },
  gym: { name: 'Skill: Ring Dips + Pressing', drills: ['3x8 Strict Ring Dips', '3x5 Weighted Ring Dips', '3x10 Push-ups on Rings', '3x15 Band Push Downs'] }
},
{
  day: 49, week: 10, name: 'CRUCIBLE', theme: 'Thruster + Test of Will',
  haltero: { name: 'Thruster', desc: 'Thruster 3-3-2-2-1-1', scheme: '15min — Heavy singles', weights: 'thruster' },
  wod: { name: 'CRUCIBLE', type: 'AMRAP 18', movements: [
    {name: 'Thrusters', reps: 7, weight: 'thruster'},
    {name: 'KB Swings', reps: 14, gymnastics: 'kb_swing'},
    {name: 'Burpee Box Jumps', reps: 7, gymnastics: 'burpee'},
    {name: 'Cal Row', special: 'row_cal'}
  ], notes: 'Test de volonte. Thrusters legers (60%). KB unbroken. Burpee BJ = pace soutenu. Row 12/10 cal.' },
  gym: { name: 'Skill: Conditioning Base', drills: ['3x500m Row (rest 2min)', '3x1min Assault Bike sprint', '2x400m Run', '3x30 Air Squats for speed'] }
},
{
  day: 50, week: 10, name: 'OMEGA', theme: 'Mixed Modal + Final Stand',
  haltero: { name: 'Power Clean + Push Jerk', desc: '1 Power Clean + 1 Push Jerk x 10 sets ascending', scheme: 'Every 90s x 10', weights: 'power_clean' },
  wod: { name: 'OMEGA', type: 'For Time (cap 30min)', movements: [
    {name: 'Deadlifts', reps: 30, weight: 'deadlift'},
    {name: 'HSPU', reps: 30, gymnastics: 'hspu'},
    {name: 'Wall Balls', reps: 30, gymnastics: 'wall_ball'},
    {name: 'Double Unders', reps: 100, gymnastics: 'double_unders'},
    {name: 'Power Cleans', reps: 20, weight: 'power_clean'},
    {name: 'Bar Muscle-ups', reps: 15, gymnastics: 'muscle_ups_bar'},
    {name: 'Rope Climbs', reps: 5, gymnastics: 'rope_climb'}
  ], notes: 'Le grand final de Part 2. Chipper monstre. Fractionnez tout. DL 6x5. HSPU 6x5. WB 6x5. Cleans 4x5. BMU 3x5. Finissez fort!' },
  gym: { name: 'Skill: Full Body Recovery', drills: ['3x10 Strict Press (light)', '3x10 Good Mornings', '2x2min Pigeon Stretch', '2x2min Couch Stretch', '3x1min Hang from Bar'] }
},
// --- END PART 2 (days 26-50) --- PART 3 CONTINUES ---

// ============ WEEK 11 ============
{
  day: 51, week: 11, name: 'RAGNAROK', theme: 'Deadlift + End of Days',
  haltero: { name: 'Deadlift Build', desc: 'Deadlift 5-3-3-2-1-1', scheme: '15min — Build to heavy single', weights: 'deadlift' },
  wod: { name: 'RAGNAROK', type: 'For Time (cap 20min)', movements: [
    {name: 'Deadlifts', reps: 30, weight: 'deadlift'},
    {name: 'Handstand Push-ups', reps: 30, gymnastics: 'hspu'},
    {name: 'KB Swings', reps: 30, gymnastics: 'kb_swing'},
    {name: 'Pistols', reps: 30, gymnastics: 'pistols'},
    {name: 'Cal Row', special: 'row_cal', note: '30/25 cal'}
  ], notes: 'Le crépuscule des dieux. Sets de 10 sur tout. HSPU fractionnés 5-5. Gardez les pistols propres. Pas de repos > 15s.' },
  gym: { name: 'Skill: Pistol Squats', drills: ['3x5/leg Pistol to Box', '3x3/leg Full Pistol', '3x8/leg Bulgarian Split Squat', '2x20 Air Squats tempo 3-1-1'] }
},
{
  day: 52, week: 11, name: 'TEMPEST', theme: 'Snatch + Storm Intervals',
  haltero: { name: 'Snatch Doubles', desc: '2 Power Snatch + 1 OHS', scheme: 'E2MOM 12min — Build', weights: 'snatch' },
  wod: { name: 'TEMPEST', type: 'EMOM 24 (6 rounds)', movements: [
    {name: 'Min 1: Power Snatches', reps: 5, weight: 'snatch'},
    {name: 'Min 2: Toes-to-bar', reps: 10, gymnastics: 'toes_to_bar'},
    {name: 'Min 3: Double Unders', reps: 30, gymnastics: 'double_unders'},
    {name: 'Min 4: Burpees', reps: 8, gymnastics: 'burpee'}
  ], notes: 'La tempête monte. Finissez chaque minute en 40s. Si les snatches ralentissent, baissez la charge. Score = rounds complets.' },
  gym: { name: 'Skill: Toes-to-bar Efficiency', drills: ['3x8 Strict TTB', '3x12 Kipping TTB', 'Max unbroken TTB test', '3x15 V-ups'] }
},
{
  day: 53, week: 11, name: 'GOLIATH', theme: 'Back Squat + Giant Couplet',
  haltero: { name: 'Back Squat', desc: 'Back Squat 3x5 @80% then 2x3 @85%', scheme: 'Every 3min x 5 sets', weights: 'back_squat' },
  wod: { name: 'GOLIATH', type: '5 Rounds For Time (cap 22min)', movements: [
    {name: 'Front Squats', reps: 10, weight: 'front_squat'},
    {name: 'Bar Muscle-ups', reps: 5, gymnastics: 'muscle_ups_bar'},
    {name: 'Cal Assault Bike', special: 'assault_bike', note: '15/12 cal'}
  ], notes: 'Géant de fer. Les squats vont brûler après le haltéro. BMU en singles si nécessaire. Bike = sprint court.' },
  gym: { name: 'Skill: Bar Muscle-ups', drills: ['3x5 Strict Chest-to-bar Pull-ups', '3x3 Kipping BMU', '5x1-2 BMU attempts (strict)', 'Accumulate 30s Active Hang'] }
},
{
  day: 54, week: 11, name: 'FIRESTORM', theme: 'Clean + Ascending Burner',
  haltero: { name: 'Clean Complex', desc: '1 Power Clean + 2 Front Squats', scheme: 'E2MOM 10min', weights: 'clean' },
  wod: { name: 'FIRESTORM', type: 'For Time — 3-6-9-12-15-18 (cap 18min)', movements: [
    {name: 'Squat Cleans', reps: 'ladder', weight: 'squat_clean'},
    {name: 'Ring Muscle-ups', reps: 'ladder', gymnastics: 'muscle_ups_ring'},
    {name: 'Box Jumps', reps: 'ladder', gymnastics: 'box_jump'}
  ], notes: 'Ladder ascendante qui brûle tout. Cleans unbroken jusqu\'au 9, puis cassez. RMU = petites séries dès le 6. Box jumps = step down.' },
  gym: { name: 'Skill: Ring Muscle-ups', drills: ['3x5 Ring Dips (strict)', '3x3 Kipping Swing to Hip', '5x1-2 RMU attempts', '3x10 Ring Push-ups'] }
},
{
  day: 55, week: 11, name: 'OUTLAW', theme: 'Push Press + Renegade WOD',
  haltero: { name: 'Push Press', desc: 'Push Press 5-5-3-3-2', scheme: 'E2MOM 10min — Build heavy', weights: 'push_press' },
  wod: { name: 'OUTLAW', type: 'AMRAP 18', movements: [
    {name: 'Wall Balls', reps: 20, gymnastics: 'wall_ball'},
    {name: 'Push Press', reps: 10, weight: 'push_press'},
    {name: 'Pull-ups', reps: 15, gymnastics: 'pullups'},
    {name: 'Double Unders', reps: 40, gymnastics: 'double_unders'}
  ], notes: 'Hors-la-loi du fitness. WB en 2 sets max. Push Press léger = unbroken. Pull-ups kipping fluides. Visez 4+ rounds.' },
  gym: { name: 'Skill: Butterfly Pull-ups', drills: ['3x5 Strict Pull-ups', '3x8 Kipping Pull-ups', '3x5 Butterfly Pull-ups', 'Max unbroken Butterfly test'] }
},

// ============ WEEK 12 — DÉLOAD ============
// Deload #3 — Mi-programme (60 jours parcourus). Phase critique de récupération.
// Semaine technique: consolidation des acquis S9-11, réduction volume 50%
{
  day: 56, week: 12, name: 'BANSHEE-DELOAD', theme: 'Déload S3 — Squat Clean Technique + WOD Court', deload: true,
  haltero: { name: 'Squat Clean Technique', desc: 'Squat Clean 3x3 @65% — Vitesse sous la barre, réception active', scheme: '10min — Léger et technique', weights: 'squat_clean' },
  wod: { name: 'BANSHEE-LIGHT', type: 'For Time (cap 9min)', movements: [
    {name: 'Squat Cleans', reps: 8, weight: 'squat_clean', note: '@60%'},
    {name: 'Burpees over bar', reps: 8, gymnastics: 'burpee'},
    {name: 'Squat Cleans', reps: 6, weight: 'squat_clean'},
    {name: 'Burpees over bar', reps: 6, gymnastics: 'burpee'}
  ], notes: '🔄 DÉLOAD S12: Volume -50%. 8-6 au lieu de 15-12-9. Cleans techniques, unbroken visé. Burpees sans sprint. Respirez et profitez du volume réduit. 💤' },
  gym: { name: 'Squat Clean Drills & Mobilité', drills: ['3x5 Tall Cleans (barre vide, focus réception)', '3x3 Hang Squat Clean @50%', '3x2min Thoracic Mobility (band)', '3x1min Wrist Stretch (front rack)'] }
},
{
  day: 57, week: 12, name: 'MAMMOTH-DELOAD', theme: 'Déload S3 — Deadlift Léger + Chipper Réduit', deload: true,
  haltero: { name: 'Deadlift Technique', desc: 'Deadlift 3x3 @65% — Focus position dos neutre', scheme: 'E3min x 3 sets — Léger', weights: 'deadlift' },
  wod: { name: 'MAMMOTH-LIGHT', type: 'For Time (cap 15min)', movements: [
    {name: 'Cal Row', special: 'row_cal', note: '25/20 cal — pace modéré'},
    {name: 'Deadlifts', reps: 20, weight: 'deadlift', note: '@60%'},
    {name: 'Wall Balls', reps: 25, gymnastics: 'wall_ball'},
    {name: 'Toes-to-bar', reps: 15, gymnastics: 'toes_to_bar'},
    {name: 'Handstand Walk', reps: '50ft', gymnastics: 'handstand_walk'}
  ], notes: '🔄 DÉLOAD S12: Tous les volumes divisés par 2. Row à 2:10/500m. DL par 5 sets techniques. WB en 2 sets. TTB qualité. HS Walk focus skill. 💤' },
  gym: { name: 'Skill: HS Walk + Récupération', drills: ['5x30s HS Hold freestanding', '3x5 Wall Walk (slow)', '5x5m HS Walk précis', '5min Foam Roll complet'] }
},
{
  day: 58, week: 12, name: 'BASILISK-DELOAD', theme: 'Déload S3 — Hang Clean Léger + EMOM Court', deload: true,
  haltero: { name: 'Hang Clean Léger', desc: '2 Hang Cleans @65% x 6 sets', scheme: 'Every 90s x 6 — Léger', weights: 'hang_clean' },
  wod: { name: 'BASILISK-LIGHT', type: 'EMOM 12 (3 rounds)', movements: [
    {name: 'Min 1: Hang Cleans', reps: 4, weight: 'hang_clean', note: '@60%'},
    {name: 'Min 2: HSPU', reps: 5, gymnastics: 'hspu'},
    {name: 'Min 3: KB Swings', reps: 10, gymnastics: 'kb_swing'},
    {name: 'Min 4: Rope Climb', reps: 1, gymnastics: 'rope_climb'}
  ], notes: '🔄 DÉLOAD S12: 12min au lieu de 20min. Reps réduits. Finissez chaque minute en 35s. Rope climbs = technique J-hook ou S-wrap parfaite. 💤' },
  gym: { name: 'Skill: Rope Climb Maîtrise', drills: ['3x2 Rope Climbs (focus technique pieds)', '3x1 Legless attempts (si compétent)', '3x5 Towel Pull-ups (grip)', '5min Mobilité dorsaux + épaules'] }
},
{
  day: 59, week: 12, name: 'PALADIN-DELOAD', theme: 'Déload S3 — Front Squat Léger + Triplet Court', deload: true,
  haltero: { name: 'Front Squat Léger', desc: 'Front Squat 3x5 @65% — Coudes hauts, position solide', scheme: 'E2MOM 8min — Léger', weights: 'front_squat' },
  wod: { name: 'PALADIN-LIGHT', type: '2 Rounds For Time (cap 10min)', movements: [
    {name: 'Front Squats', reps: 6, weight: 'front_squat', note: '@60%'},
    {name: 'Rope Climbs', reps: 2, gymnastics: 'rope_climb'},
    {name: 'Double Unders', reps: 30, gymnastics: 'double_unders'}
  ], notes: '🔄 DÉLOAD S12: 2 rounds au lieu de 4. DU 30 au lieu de 50. Squats légers et fluides. Rope climbs = technique impeccable. Zen mode total. 💤' },
  gym: { name: 'Skill: DU + Mobilité', drills: ['5x30 DU unbroken (relaxé)', '3x20 Single Under drill', '3x1min Pigeon Stretch', '3x1min Couch Stretch'] }
},
{
  day: 60, week: 12, name: 'MARAUDER-DELOAD', theme: 'Déload S3 — S2OH Léger + Chipper Court', deload: true,
  haltero: { name: 'Shoulder-to-OH Léger', desc: 'S2OH 3x5 @65% (push press)', scheme: 'E2MOM 6min — Léger', weights: 'shoulder_to_oh' },
  wod: { name: 'MARAUDER-LIGHT', type: 'For Time (cap 12min)', movements: [
    {name: 'Shoulder-to-OH', reps: 10, weight: 'shoulder_to_oh', note: '@60%'},
    {name: 'Pull-ups', reps: 20, gymnastics: 'pullups'},
    {name: 'Box Jumps', reps: 15, gymnastics: 'box_jump'},
    {name: 'Power Cleans', reps: 10, weight: 'power_clean', note: '@60%'}
  ], notes: '🔄 DÉLOAD S12: Volume réduit de 50%. Pas de Bike finale pour ménager le système nerveux. FIN DÉLOAD S12 — mi-programme accompli! 30 jours pour le finish! 🔋' },
  gym: { name: 'Récupération Active Finale S12', drills: ['3x5 Strict HSPU (contrôle pur)', '3x8 Kipping HSPU technique', '5min Easy Row zone 1', '10min Stretching global complet'] }
},

// ============ WEEK 13 ============
{
  day: 61, week: 13, name: 'DRAGONFIRE', theme: 'Power Clean + Breath of Fire',
  haltero: { name: 'Power Clean', desc: 'Power Clean 3-3-2-2-1-1', scheme: '15min — Build heavy', weights: 'power_clean' },
  wod: { name: 'DRAGONFIRE', type: 'AMRAP 12', movements: [
    {name: 'Power Cleans', reps: 7, weight: 'power_clean'},
    {name: 'Burpees', reps: 7, gymnastics: 'burpee'},
    {name: 'Toes-to-bar', reps: 7, gymnastics: 'toes_to_bar'}
  ], notes: 'Souffle du dragon. Court et violent. Cleans touch-and-go si possible. Burpees rapides. TTB unbroken = le but. 6+ rounds.' },
  gym: { name: 'Skill: Touch-and-Go Cleans', drills: ['5x3 TnG Power Clean @70%', '3x5 TnG Power Clean @65%', '3x8 RDL (clean grip)', '3x10 Hang Muscle Clean'] }
},
{
  day: 62, week: 13, name: 'BEHEMOTH', theme: 'Back Squat + Beast Mode',
  haltero: { name: 'Back Squat', desc: 'Back Squat 5-5-5-3-3', scheme: 'E3MOM 15min — Build', weights: 'back_squat' },
  wod: { name: 'BEHEMOTH', type: 'For Time — 21-15-9 (cap 15min)', movements: [
    {name: 'Thrusters', reps: '21-15-9', weight: 'thruster'},
    {name: 'Chest-to-bar Pull-ups', reps: '21-15-9', gymnastics: 'pullups'}
  ], notes: 'Fran on stéroïdes. Thrusters 7-7-7 au 21, essayez unbroken au 9. C2B en plus gros sets possibles. RX = heavy Fran vibes.' },
  gym: { name: 'Skill: Chest-to-bar Pull-ups', drills: ['3x5 Strict C2B', '3x8 Kipping C2B', 'Max unbroken C2B test', '3x8 Supinated BB Row'] }
},
{
  day: 63, week: 13, name: 'SERPENT', theme: 'OHS + Slithering Intervals',
  haltero: { name: 'Overhead Squat', desc: 'OHS 3-3-2-2-1-1', scheme: '15min — Mobilité + heavy single', weights: 'overhead_squat' },
  wod: { name: 'SERPENT', type: '6 Rounds — 2min ON / 1min OFF', movements: [
    {name: 'Overhead Squats', reps: 5, weight: 'overhead_squat'},
    {name: 'Wall Balls', reps: 10, gymnastics: 'wall_ball'},
    {name: 'Cal Row', special: 'row_cal', note: 'max cal remaining'}
  ], notes: 'Le serpent frappe vite. OHS léger = unbroken. WB rapides. Tout le temps restant = row pour cals. Score = total cals row.' },
  gym: { name: 'Skill: Overhead Position', drills: ['3x10 Snatch Grip Press (behind neck)', '3x5 Sots Press', '3x30s OH Hold (heavy)', '2x2min Banded Shoulder Stretch'] }
},
{
  day: 64, week: 13, name: 'WARLORD', theme: 'Sumo DL HP + Conqueror WOD',
  haltero: { name: 'Sumo Deadlift High Pull', desc: 'SDLHP 5x5 — Build', scheme: 'E2MOM 10min', weights: 'sumo_dl_hp' },
  wod: { name: 'WARLORD', type: 'AMRAP 20', movements: [
    {name: 'Sumo DL High Pull', reps: 12, weight: 'sumo_dl_hp'},
    {name: 'Box Jumps', reps: 12, gymnastics: 'box_jump'},
    {name: 'KB Swings', reps: 12, gymnastics: 'kb_swing'},
    {name: 'Burpees', reps: 12, gymnastics: 'burpee'}
  ], notes: 'Le seigneur de guerre ne s\'arrête jamais. 4 mouvements x 12 reps = rythme constant. SDLHP = hip drive! Visez 5+ rounds.' },
  gym: { name: 'Skill: Hip Power', drills: ['3x10 SDLHP (light, technique)', '3x10 KB Sumo Deadlift', '3x8 Barbell Hip Thrust', '3x10 Broad Jumps'] }
},
{
  day: 65, week: 13, name: 'ABYSS', theme: 'Clean + Deep Water WOD',
  haltero: { name: 'Clean & Jerk', desc: '1 Clean + 1 Front Squat + 1 Jerk', scheme: 'E2MOM 14min', weights: 'clean' },
  wod: { name: 'ABYSS', type: 'For Time (cap 24min)', movements: [
    {name: 'Run 800m', reps: 1, special: 'run_800'},
    {name: 'Muscle-ups (ring)', reps: 15, gymnastics: 'muscle_ups_ring'},
    {name: 'Squat Cleans', reps: 15, weight: 'squat_clean'},
    {name: 'Muscle-ups (ring)', reps: 10, gymnastics: 'muscle_ups_ring'},
    {name: 'Squat Cleans', reps: 10, weight: 'squat_clean'},
    {name: 'Muscle-ups (ring)', reps: 5, gymnastics: 'muscle_ups_ring'},
    {name: 'Squat Cleans', reps: 5, weight: 'squat_clean'}
  ], notes: 'Les profondeurs. Row = 1:45 pace. RMU en 3-2 dès le début. Cleans par 5. Le volume descend = accélérez en fin. Sortez de l\'abysse.' },
  gym: { name: 'Skill: Ring Work', drills: ['3x10 Ring Rows (feet elevated)', '3x5 Ring Dips (strict)', '3x3 False Grip Pull-ups', '3x10 Ring Push-ups (deep)'] }
},

// ============ WEEK 14 ============
{
  day: 66, week: 14, name: 'TYPHOON', theme: 'Thruster + Category 5',
  haltero: { name: 'Thruster Build', desc: 'Thruster 5-3-3-2-1', scheme: 'E2MOM 10min — Build heavy', weights: 'thruster' },
  wod: { name: 'TYPHOON', type: '3 Rounds For Time (cap 18min)', movements: [
    {name: 'Run 400m', reps: 1, special: 'run_400'},
    {name: 'Thrusters', reps: 15, weight: 'thruster'},
    {name: 'Pull-ups', reps: 15, gymnastics: 'pullups'}
  ], notes: 'Catégorie 5. Course d\'ouverture à 85%. Thrusters light = gros sets. Pull-ups butterfly si possible. Le run entre chaque triplet va tester votre aérobie + jambes. 🏃💨' },
  gym: { name: 'Skill: Thruster Efficiency', drills: ['3x10 Thruster @50% (fast)', '3x5 Paused Front Squat + Press', '3x8 Push Jerk', '3x5 Squat to Press (slow)'] }
},
{
  day: 67, week: 14, name: 'VALKYRIE', theme: 'Snatch + Warrior Goddess',
  haltero: { name: 'Snatch Complex', desc: '1 Hang Snatch + 1 Power Snatch + 1 Snatch Balance', scheme: 'Every 90s x 10 sets', weights: 'snatch' },
  wod: { name: 'VALKYRIE', type: 'EMOM 30 (6 rounds)', movements: [
    {name: 'Min 1: Power Snatches', reps: 4, weight: 'snatch'},
    {name: 'Min 2: HSPU', reps: 8, gymnastics: 'hspu'},
    {name: 'Min 3: Double Unders', reps: 40, gymnastics: 'double_unders'},
    {name: 'Min 4: Pistols', reps: 8, gymnastics: 'pistols'},
    {name: 'Min 5: Cal Row', special: 'row_cal', note: '12/10 cal'}
  ], notes: 'La Valkyrie choisit ses guerriers. 30 min de combat contrôlé. 5 mouvements variés. Respectez le pacing ou le EMOM vous mange.' },
  gym: { name: 'Skill: Snatch Balance', drills: ['5x3 Snatch Balance (light)', '3x3 Heaving Snatch Balance', '3x5 Drop Snatch', '3x30s OHS Hold (heavy)'] }
},
{
  day: 68, week: 14, name: 'IRONSIDE', theme: 'Deadlift + Viking Grinder',
  haltero: { name: 'Deadlift', desc: 'Deadlift 3-3-2-2-1-1', scheme: '15min — Build to heavy single', weights: 'deadlift' },
  wod: { name: 'IRONSIDE', type: 'AMRAP 16', movements: [
    {name: 'Deadlifts', reps: 8, weight: 'deadlift'},
    {name: 'Handstand Push-ups', reps: 8, gymnastics: 'hspu'},
    {name: 'Toes-to-bar', reps: 12, gymnastics: 'toes_to_bar'},
    {name: 'Cal Row', special: 'row_cal', note: '12/10 cal'}
  ], notes: 'Viking de fer. DL = touch-and-go par 4. HSPU = 4+4 ou unbroken. TTB = sets de 6. Row = 1:40 pace. 5+ rounds = guerrier.' },
  gym: { name: 'Skill: Strict HSPU + Pressing', drills: ['3x3 Strict HSPU (deficit)', '3x5 Strict HSPU', '3x8 DB Strict Press', '3x10 Pike Push-ups'] }
},
{
  day: 69, week: 14, name: 'OBLIVION', theme: 'Front Squat + Forgotten WOD',
  haltero: { name: 'Front Squat', desc: 'Front Squat 5x2 @88%', scheme: 'Every 2:30 x 5 sets', weights: 'front_squat' },
  wod: { name: 'OBLIVION', type: 'For Time — 10-8-6-4-2 (cap 16min)', movements: [
    {name: 'Squat Cleans', reps: 'ladder', weight: 'squat_clean'},
    {name: 'Bar Muscle-ups', reps: 'ladder', gymnastics: 'muscle_ups_bar'},
    {name: 'Wall Balls', reps: '20-16-12-8-4', gymnastics: 'wall_ball'}
  ], notes: 'Descente vers l\'oubli. Le volume descend mais la fatigue monte. Cleans par 2 si nécessaire. BMU singles OK. Finissez avant le cap!' },
  gym: { name: 'Skill: Squat Mobility', drills: ['3x10 Goblet Squat (paused 3s)', '2x2min Ankle Stretch', '2x2min Hip Flexor Stretch', '3x5 Cossack Squat/side'] }
},
{
  day: 70, week: 14, name: 'HARBINGER', theme: 'Power Clean + Omen WOD',
  haltero: { name: 'Power Clean + Push Jerk', desc: '2 Power Clean + 1 Push Jerk', scheme: 'E2MOM 12min', weights: 'power_clean' },
  wod: { name: 'HARBINGER', type: 'For Time (cap 20min)', movements: [
    {name: 'Power Cleans', reps: 10, weight: 'power_clean'},
    {name: 'Rope Climbs', reps: 4, gymnastics: 'rope_climb'},
    {name: 'Power Cleans', reps: 10, weight: 'power_clean'},
    {name: 'Handstand Walk', reps: '50ft', gymnastics: 'handstand_walk'},
    {name: 'Power Cleans', reps: 10, weight: 'power_clean'},
    {name: 'Rope Climbs', reps: 4, gymnastics: 'rope_climb'},
    {name: 'Power Cleans', reps: 10, weight: 'power_clean'},
    {name: 'Handstand Walk', reps: '50ft', gymnastics: 'handstand_walk'}
  ], notes: 'Le présage. 40 cleans total = grip management critique. TnG par 5. Rope climbs lents et contrôlés. HS Walk = 5x10ft segments.' },
  gym: { name: 'Skill: Grip Endurance', drills: ['3x45s Dead Hang', '3x20 Farmer Carry (heavy, 30m)', '3x8 Towel Pull-ups', '3x10 Wrist Curls (both directions)'] }
},

// ============ WEEK 15 ============
{
  day: 71, week: 15, name: 'GLADIATOR', theme: 'Clean + Arena Couplet',
  haltero: { name: 'Clean Pull + Clean', desc: '1 Clean Pull + 1 Clean', scheme: 'E2MOM 12min — Build', weights: 'clean' },
  wod: { name: 'GLADIATOR', type: '7 Rounds For Time (cap 24min)', movements: [
    {name: 'Squat Cleans', reps: 3, weight: 'squat_clean'},
    {name: 'Ring Muscle-ups', reps: 3, gymnastics: 'muscle_ups_ring'},
    {name: 'Burpees over bar', reps: 6, gymnastics: 'burpee'},
    {name: 'Cal Row', special: 'row_cal', note: '10/8 cal'}
  ], notes: 'L\'arène vous attend. 7 rounds = pacing intelligent. Cleans heavy = singles OK. RMU = focus technique. Row = sprint de 30s.' },
  gym: { name: 'Skill: Clean Technique', drills: ['3x5 Muscle Clean', '3x3 Tall Clean', '3x3 No-foot Clean', '3x5 Clean Pull @100%'] }
},
{
  day: 72, week: 15, name: 'RIPTIDE', theme: 'Hang Clean + Pulling Current',
  haltero: { name: 'Hang Clean', desc: 'Hang Squat Clean 3-3-2-2-1', scheme: 'E2MOM 10min', weights: 'hang_clean' },
  wod: { name: 'RIPTIDE', type: 'Tabata x 6 rounds (24min total)', movements: [
    {name: 'Tabata 1: Hang Cleans', reps: 'max', weight: 'hang_clean'},
    {name: 'Tabata 2: Toes-to-bar', reps: 'max', gymnastics: 'toes_to_bar'},
    {name: 'Tabata 3: Box Jumps', reps: 'max', gymnastics: 'box_jump'},
    {name: 'Tabata 4: KB Swings', reps: 'max', gymnastics: 'kb_swing'},
    {name: 'Tabata 5: Burpees', reps: 'max', gymnastics: 'burpee'},
    {name: 'Tabata 6: Cal Assault Bike', special: 'assault_bike'}
  ], notes: 'Le courant vous emporte. 20s ON / 10s OFF x 6. 1min repos entre chaque Tabata. Score = total reps. Le bike en dernier = tout donner.' },
  gym: { name: 'Skill: Conditioning Test', drills: ['1K Row for time', '2min rest', '40 Cal Assault Bike for time', '2min rest', '400m Run for time'] }
},
{
  day: 73, week: 15, name: 'RONIN', theme: 'Snatch + Lone Warrior',
  haltero: { name: 'Snatch Singles', desc: 'Snatch 1-1-1-1-1-1', scheme: 'Every 90s x 6 — Build to max', weights: 'snatch' },
  wod: { name: 'RONIN', type: 'For Time — 15-12-9 (cap 18min)', movements: [
    {name: 'Power Snatches', reps: '15-12-9', weight: 'snatch'},
    {name: 'HSPU', reps: '15-12-9', gymnastics: 'hspu'},
    {name: 'Cal Row', special: 'row_cal', note: '15-12-9 cal'}
  ], notes: 'Le samouraï sans maître. Snatches légers = TnG. HSPU fractionnés: 5-5-5 au 15, unbroken au 9. Row = push the pace.' },
  gym: { name: 'Skill: Snatch Technique', drills: ['5x3 Snatch from High Hang', '3x3 Snatch from Knee', '3x2 Snatch Pull + Snatch', '3x5 Overhead Squat (paused)'] }
},
{
  day: 74, week: 15, name: 'CITADEL', theme: 'Back Squat + Fortress WOD',
  haltero: { name: 'Back Squat', desc: 'Back Squat 3-3-3-1-1', scheme: 'E3MOM 15min — Build to heavy single', weights: 'back_squat' },
  wod: { name: 'CITADEL', type: 'AMRAP 22', movements: [
    {name: 'Back Squats', reps: 5, weight: 'back_squat'},
    {name: 'Strict HSPU', reps: 5, gymnastics: 'hspu'},
    {name: 'Pistols', reps: 10, gymnastics: 'pistols'},
    {name: 'Double Unders', reps: 50, gymnastics: 'double_unders'},
    {name: 'Cal Assault Bike', special: 'assault_bike', note: '12/10 cal'}
  ], notes: 'La citadelle. Long grinder. Squats modérés = unbroken. Strict HSPU = pas de kipping, montrez la force. Pistols alternés. DU zen. 4+ rounds.' },
  gym: { name: 'Skill: Strict Gymnastics', drills: ['3x3 Strict Muscle-up (bar or ring)', '3x5 Strict HSPU', '3x5 Strict C2B Pull-ups', '3x15 Hollow Rocks'] }
},
{
  day: 75, week: 15, name: 'EXODUS', theme: 'Mixed Modal + Grand Departure',
  haltero: { name: 'Clean & Jerk', desc: '1 Clean + 1 Hang Clean + 1 Jerk', scheme: 'E2MOM 14min — Build', weights: 'clean' },
  wod: { name: 'EXODUS', type: 'For Time (cap 28min)', movements: [
    {name: 'Deadlifts', reps: 30, weight: 'deadlift'},
    {name: 'HSPU', reps: 30, gymnastics: 'hspu'},
    {name: 'Cal Row', special: 'row_cal', note: '40/35 cal'},
    {name: 'Double Unders', reps: 100, gymnastics: 'double_unders'},
    {name: 'Power Cleans', reps: 20, weight: 'power_clean'},
    {name: 'Ring Muscle-ups', reps: 15, gymnastics: 'muscle_ups_ring'},
    {name: 'Wall Balls', reps: 50, gymnastics: 'wall_ball'},
    {name: 'Rope Climbs', reps: 5, gymnastics: 'rope_climb'}
  ], notes: 'Le grand exode de Part 3. Chipper épique. DL 6x5. HSPU 6x5. Row 2:00 pace. DU unbroken. Cleans 4x5. RMU 3-3-3-3-3. WB 10x5. Rope = finish line.' },
  gym: { name: 'Skill: Full Body Recovery', drills: ['3x10 Good Mornings', '2x2min Pigeon Stretch', '2x2min Couch Stretch', '3x1min Hang from Bar', '5min Easy Row or Bike'] }
},
// --- END PART 3 (days 51-75) --- PART 4 CONTINUES ---

// ============ PART 4: DAYS 76-100 (WEEKS 16-20) ============

// ============ WEEK 16 — DÉLOAD ============
// Deload #4 — Dernier déload avant la phase finale S17-20.
// CNS = priorité. Corps rechargé = performances maximales S17+
// Volume -50%, technique parfaite, récupération maximale
{
  day: 76, week: 16, name: 'CERBERUS-DELOAD', theme: 'Déload S4 — Clean Complex Léger + AMRAP Court', deload: true,
  haltero: { name: 'Clean Complex Léger', desc: '1 Power Clean + 1 Front Squat @65% — Technique fluide', scheme: 'E2MOM 8min — Léger', weights: 'clean' },
  wod: { name: 'CERBERUS-LIGHT', type: 'AMRAP 10 — Zone 2', movements: [
    {name: 'Power Cleans', reps: 6, weight: 'power_clean', note: '@60%'},
    {name: 'Box Jumps', reps: 8, gymnastics: 'box_jump'},
    {name: 'Toes-to-bar', reps: 8, gymnastics: 'toes_to_bar'},
    {name: 'Cal Assault Bike', special: 'assault_bike', note: '8/6 cal — effort modéré'}
  ], notes: '🔄 DÉLOAD S16: 10min au lieu de 18min. Reps réduits. Zone 2 aérobie. Pas de compétition. Dernière recharge avant la phase finale! 💤' },
  gym: { name: 'Mobilité & Récupération Active', drills: ['3x5 Strict Pull-ups (focus scapulaire)', '3x8 Kipping Pull-ups (contrôle)', '3x20 Hollow Rocks', '10min Foam Roll + stretching complet'] }
},
{
  day: 77, week: 16, name: 'TRIDENT-DELOAD', theme: 'Déload S4 — Snatch Technique + Triplet Court', deload: true,
  haltero: { name: 'Snatch Technique', desc: '1 Hang Snatch + 1 Snatch @65% x 6 sets', scheme: 'Every 90s x 6 — Léger', weights: 'snatch' },
  wod: { name: 'TRIDENT-LIGHT', type: '3 Rounds For Time (cap 10min)', movements: [
    {name: 'Power Snatches', reps: 5, weight: 'snatch', note: '@60%'},
    {name: 'Burpees over bar', reps: 5, gymnastics: 'burpee'},
    {name: 'Pull-ups', reps: 10, gymnastics: 'pullups'}
  ], notes: '🔄 DÉLOAD S16: 3 rounds au lieu de 5. Snatches techniques. Burpees au rythme. Pull-ups kipping propres. 💤' },
  gym: { name: 'Skill: Bar MU Technique', drills: ['3x5 Chest-to-bar Pull-ups (gros kip)', '3x3 Kip to Hip drill', '5x1-2 Bar MU attempts (contrôle)', '3x10 Strict Dips (contrôle)'] }
},
{
  day: 78, week: 16, name: 'IRONWOLF-DELOAD', theme: 'Déload S4 — Deadlift Léger + Couplet Court', deload: true,
  haltero: { name: 'Deadlift Technique', desc: 'Deadlift 3x5 @65% — Dos neutre, hip hinge parfait', scheme: 'E3min x 3 sets — Léger', weights: 'deadlift' },
  wod: { name: 'IRONWOLF-LIGHT', type: 'For Time (cap 12min)', movements: [
    {name: 'Deadlifts', reps: 10, weight: 'deadlift', note: '@60%'},
    {name: 'HSPU', reps: 8, gymnastics: 'hspu'},
    {name: 'Deadlifts', reps: 8, weight: 'deadlift'},
    {name: 'HSPU', reps: 6, gymnastics: 'hspu'},
    {name: 'Deadlifts', reps: 6, weight: 'deadlift'},
    {name: 'HSPU', reps: 4, gymnastics: 'hspu'}
  ], notes: '🔄 DÉLOAD S16: Volumes divisés par 2. DL techniques, pas de PR. HSPU = strict si possible. Pace détendu. 💤' },
  gym: { name: 'Skill: HS Walk + Récupération', drills: ['5x30s Wall-Facing HS Hold', '3x5 Wall Walk (slow)', '5x5m HS Walk (focus)', '5min Mobilité épaules + thoracique'] }
},
{
  day: 79, week: 16, name: 'STINGRAY-DELOAD', theme: 'Déload S4 — Squat Clean Léger + AMRAP Court', deload: true,
  haltero: { name: 'Squat Clean Léger', desc: 'Squat Clean 3x3 @65% — Vitesse sous la barre', scheme: 'E2MOM 8min — Léger', weights: 'squat_clean' },
  wod: { name: 'STINGRAY-LIGHT', type: 'AMRAP 10 — Zone 2', movements: [
    {name: 'Squat Cleans', reps: 3, weight: 'squat_clean', note: '@60%'},
    {name: 'Ring Dips', reps: 5, gymnastics: 'ring_dips'},
    {name: 'Double Unders', reps: 25, gymnastics: 'double_unders'},
    {name: 'Cal Row', special: 'row_cal', note: '10/8 cal — pace modéré'}
  ], notes: '🔄 DÉLOAD S16: 10min au lieu de 20min. Reps réduits. Ring dips = technique. DU 25 au lieu de 40. Zone 2 confortables. 💤' },
  gym: { name: 'Skill: Ring MU Préparation', drills: ['3x5 Strict Ring Dips (full ROM)', '3x3 Kip Swing to Hip (rings)', '5x1-2 Ring MU (contrôle complet)', '2min Ring Support Hold'] }
},
{
  day: 80, week: 16, name: 'WARHAMMER-DELOAD', theme: 'Déload S4 — S2OH Léger + Chipper Réduit', deload: true,
  haltero: { name: 'Push Press Léger', desc: 'Push Press 3x5 @65% — Dip minimal, drive explosif', scheme: 'E2MOM 6min — Léger', weights: 'push_press' },
  wod: { name: 'WARHAMMER-LIGHT', type: 'For Time (cap 12min)', movements: [
    {name: 'Shoulder-to-OH', reps: 15, weight: 'shoulder_to_oh', note: '@60%'},
    {name: 'Wall Balls', reps: 20, gymnastics: 'wall_ball'},
    {name: 'Rope Climbs', reps: 2, gymnastics: 'rope_climb'},
    {name: 'KB Swings', reps: 15, gymnastics: 'kb_swing'}
  ], notes: '🔄 DÉLOAD S16: Volume -50%. Pas de Pistols ni de Bike pour ménager les jambes. FIN DÉLOAD S16 — 4 semaines de phase finale devant vous! Corps = rechargé, mental = affûté. 🔋💥' },
  gym: { name: 'Récupération Active Finale S16', drills: ['3x Rope Climb technique parfaite', '3x15 Strict Toes-to-bar', '5min Easy Row zone 1', '15min Stretching complet + visualisation'] }
},

// ============ WEEK 17 ============
{
  day: 81, week: 17, name: 'MAKO', theme: 'Clean + Sprint Intervals',
  haltero: { name: 'Hang Clean', desc: 'Hang Clean 3-3-2-2-1-1', scheme: 'Every 90s x 6 sets', weights: 'hang_clean' },
  wod: { name: 'MAKO', type: '4 Rounds For Time (cap 16min)', movements: [
    {name: 'Hang Cleans', reps: 8, weight: 'hang_clean'},
    {name: 'Burpees', reps: 8, gymnastics: 'burpee'},
    {name: 'Toes-to-bar', reps: 8, gymnastics: 'toes_to_bar'}
  ], notes: 'Le requin mako. Vitesse pure. Cleans légers = TnG. Burpees rapides. TTB unbroken. Sub 12min = prédateur.' },
  gym: { name: 'Skill: Toes-to-bar', drills: ['3x10 Kipping Swings', '3x5 Knees-to-elbows', '3x8 Toes-to-bar', '3x10 Strict Leg Raises'] }
},
{
  day: 82, week: 17, name: 'SANDSTORM', theme: 'Overhead Squat + Long AMRAP',
  haltero: { name: 'Overhead Squat', desc: 'OHS 3-3-3-2-2', scheme: 'E2MOM 10min — Build', weights: 'overhead_squat' },
  wod: { name: 'SANDSTORM', type: 'AMRAP 22', movements: [
    {name: 'Overhead Squats', reps: 7, weight: 'overhead_squat'},
    {name: 'Pull-ups', reps: 12, gymnastics: 'pullups'},
    {name: 'KB Swings', reps: 15, gymnastics: 'kb_swing'},
    {name: 'Box Jumps', reps: 12, gymnastics: 'box_jump'},
    {name: 'Cal Row', special: 'row_cal', note: '15/12 cal'}
  ], notes: 'La tempête de sable. OHS légers = unbroken. Pull-ups 6-6. KBS unbroken. Box jumps step down. Row steady. 4+ rounds.' },
  gym: { name: 'Skill: Overhead Mobility', drills: ['3x5 Snatch Grip Behind Neck Press', '3x5 Snatch Balance', '3x3 Paused OHS (3s bottom)', '2x1min Overhead Band Stretch'] }
},
{
  day: 83, week: 17, name: 'THUNDERBOLT', theme: 'Front Squat + Couplet',
  haltero: { name: 'Front Squat', desc: 'Front Squat 5-3-3-1-1-1', scheme: '15min — Build to max', weights: 'front_squat' },
  wod: { name: 'THUNDERBOLT', type: '21-15-9 For Time (cap 12min)', movements: [
    {name: 'Thrusters', reps: '21-15-9', weight: 'thruster'},
    {name: 'Bar Muscle-ups', reps: '9-6-3', gymnastics: 'muscle_ups_bar'}
  ], notes: 'La foudre. Court et intense. Thrusters légers = TnG. BMU 3-3-3 au 9, puis unbroken. Sub 8min = elite. Respirez entre les sets.' },
  gym: { name: 'Skill: Bar Muscle-ups', drills: ['5x2 Strict C2B Pull-ups', '3x5 Kipping High Pull-ups', '5x1-3 Bar Muscle-ups', '3x10 Strict Dips'] }
},
{
  day: 84, week: 17, name: 'COBRA', theme: 'Power Clean + Gymnastics',
  haltero: { name: 'Power Clean', desc: 'Power Clean 3-3-2-2-1-1', scheme: 'Every 90s x 6 sets', weights: 'power_clean' },
  wod: { name: 'COBRA', type: 'EMOM 24 (8 rounds)', movements: [
    {name: 'Min 1: Power Cleans', reps: 5, weight: 'power_clean'},
    {name: 'Min 2: HSPU', reps: 8, gymnastics: 'hspu'},
    {name: 'Min 3: Double Unders', reps: 40, gymnastics: 'double_unders'}
  ], notes: 'Le cobra frappe vite. 8 rounds de 3 minutes. Cleans TnG. HSPU unbroken. DU sans faute. Minimum 15s de repos par minute.' },
  gym: { name: 'Skill: HSPU', drills: ['3x5 Strict HSPU', '3x8 Kipping HSPU', '3x3 Deficit HSPU (1 abmat)', '3x20s Freestanding HS Hold'] }
},
{
  day: 85, week: 17, name: 'NIGHTFALL', theme: 'Sumo DL HP + Dark Chipper',
  haltero: { name: 'Sumo DL High Pull', desc: 'Sumo DL HP 5-5-5-3-3', scheme: 'E2MOM 10min', weights: 'sumo_dl_hp' },
  wod: { name: 'NIGHTFALL', type: 'For Time (cap 25min)', movements: [
    {name: 'Sumo DL High Pull', reps: 25, weight: 'sumo_dl_hp'},
    {name: 'Burpees', reps: 25, gymnastics: 'burpee'},
    {name: 'Wall Balls', reps: 50, gymnastics: 'wall_ball'},
    {name: 'Double Unders', reps: 100, gymnastics: 'double_unders'},
    {name: 'Cal Assault Bike', special: 'assault_bike', note: '30/25 cal'}
  ], notes: 'La nuit tombe. SDLHP 5x5. Burpees 5x5. WB 10x5. DU unbroken ou 50-50. Bike = sprint final. Pace the first half.' },
  gym: { name: 'Skill: Double Unders', drills: ['3x30 Single Unders (fast)', '5x20 Double Unders', '3x30 Unbroken DU', '2x50 DU for time'] }
},

// ============ WEEK 18 ============
{
  day: 86, week: 18, name: 'MAGMA', theme: 'Clean & Jerk + Lava Flow',
  haltero: { name: 'Clean & Jerk', desc: '1 Clean + 2 Jerks', scheme: 'E2MOM 14min — Build to heavy', weights: 'clean' },
  wod: { name: 'MAGMA', type: '3 Rounds For Time (cap 18min)', movements: [
    {name: 'Run 400m', reps: 1, special: 'run_400'},
    {name: 'Squat Cleans', reps: 10, weight: 'squat_clean'},
    {name: 'Ring Muscle-ups', reps: 5, gymnastics: 'muscle_ups_ring'}
  ], notes: 'La lave qui coule. Run ouverture à 85%. Cleans modérés = 2-2-2-2-2. RMU 2-2-1. Le run entre rounds teste la résistance aérobie. Rounds réguliers. Sub 15min = volcanique. 🏃🌋' },
  gym: { name: 'Skill: Ring Work', drills: ['3x5 Strict Ring Dips', '3x10 Ring Rows (feet elevated)', '3x5 Ring Push-ups (deep)', '2x30s Ring Support Hold'] }
},
{
  day: 87, week: 18, name: 'STEELHEART', theme: 'Back Squat + Engine Builder',
  haltero: { name: 'Back Squat', desc: 'Back Squat 5-3-3-1-1-1', scheme: '15min — Build to max', weights: 'back_squat' },
  wod: { name: 'STEELHEART', type: 'AMRAP 20', movements: [
    {name: 'Back Squats', reps: 5, weight: 'back_squat'},
    {name: 'Toes-to-bar', reps: 10, gymnastics: 'toes_to_bar'},
    {name: 'Box Jumps', reps: 15, gymnastics: 'box_jump'},
    {name: 'Double Unders', reps: 30, gymnastics: 'double_unders'}
  ], notes: 'Coeur d\'acier. Squats modérés = unbroken chaque round. TTB 5-5. Box jumps step down. DU unbroken. 5+ rounds = champion.' },
  gym: { name: 'Skill: Pistol Squats', drills: ['3x5/leg Pistols to box', '3x3/leg Full Pistols', '3x8/leg Bulgarian Split Squats', '3x10 Air Squats (paused 3s)'] }
},
{
  day: 88, week: 18, name: 'TSUNAMI', theme: 'Snatch + Wave Intervals',
  haltero: { name: 'Snatch', desc: 'Snatch 2-2-1-1-1-1', scheme: 'Every 90s x 6 — Build to max', weights: 'snatch' },
  wod: { name: 'TSUNAMI', type: '5 Rounds — 2min ON / 1min OFF', movements: [
    {name: 'Power Snatches', reps: 5, weight: 'snatch'},
    {name: 'Burpees over bar', reps: 7, gymnastics: 'burpee'},
    {name: 'Pull-ups', reps: 9, gymnastics: 'pullups'}
  ], notes: 'Le tsunami. Vagues d\'effort. Sprint chaque 2min. Snatches TnG légers. Burpees rapides. Pull-ups unbroken. Score = total reps si incomplet.' },
  gym: { name: 'Skill: Snatch Technique', drills: ['5x3 Muscle Snatch', '3x3 Power Snatch + OHS', '3x2 Snatch from blocks', '3x5 Snatch Grip Push Press'] }
},
{
  day: 89, week: 18, name: 'DARKSTAR', theme: 'Thruster + Dark Couplet',
  haltero: { name: 'Thruster', desc: 'Thruster 5-5-3-3-1', scheme: 'E2MOM 10min — Build', weights: 'thruster' },
  wod: { name: 'DARKSTAR', type: 'For Time (cap 15min)', movements: [
    {name: 'Thrusters', reps: 30, weight: 'thruster'},
    {name: 'Rope Climbs', reps: 5, gymnastics: 'rope_climb'},
    {name: 'Thrusters', reps: 20, weight: 'thruster'},
    {name: 'Rope Climbs', reps: 3, gymnastics: 'rope_climb'},
    {name: 'Thrusters', reps: 10, weight: 'thruster'},
    {name: 'Rope Climb', reps: 1, gymnastics: 'rope_climb'}
  ], notes: 'L\'étoile noire. Thrusters légers. 30 = 10-10-10. 20 = 10-10. 10 = unbroken. Rope climbs = récup active entre les sets.' },
  gym: { name: 'Skill: Rope Climb', drills: ['5x1 Legless Rope Climb', '3x Rope Climb (slow descent)', '3x3 L-Rope Climb', '3x10 Strict Pull-ups'] }
},
{
  day: 90, week: 18, name: 'PRAETORIAN', theme: 'Mixed Modal + Warrior Test',
  haltero: { name: 'Clean Complex', desc: '1 Power Clean + 1 Hang Squat Clean + 1 Jerk', scheme: 'E2MOM 12min', weights: 'clean' },
  wod: { name: 'PRAETORIAN', type: 'For Time (cap 28min)', movements: [
    {name: 'Cal Row', special: 'row_cal', note: '50/40 cal'},
    {name: 'Deadlifts', reps: 30, weight: 'deadlift'},
    {name: 'HSPU', reps: 20, gymnastics: 'hspu'},
    {name: 'Power Cleans', reps: 15, weight: 'power_clean'},
    {name: 'Bar Muscle-ups', reps: 10, gymnastics: 'muscle_ups_bar'},
    {name: 'Thrusters', reps: 5, weight: 'thruster'}
  ], notes: 'Le garde prétorien. Chipper descendant. Row 2:00 pace. DL 6x5. HSPU 4x5. Cleans 5-5-5. BMU 2-2-2-2-2. Thrusters = finish unbroken.' },
  gym: { name: 'Skill: Gymnastics Endurance', drills: ['EMOM 12: Min1: 5 Strict Pull-ups, Min2: 10 Push-ups, Min3: 15 Air Squats'] }
},

// ============ WEEK 19 ============
{
  day: 91, week: 19, name: 'ANVIL', theme: 'Front Squat + Forge Couplet',
  haltero: { name: 'Front Squat', desc: 'Front Squat 3-3-2-2-1-1', scheme: 'E2MOM 12min — Build', weights: 'front_squat' },
  wod: { name: 'ANVIL', type: '7 Rounds For Time (cap 21min)', movements: [
    {name: 'Front Squats', reps: 5, weight: 'front_squat'},
    {name: 'Burpees', reps: 7, gymnastics: 'burpee'},
    {name: 'KB Swings', reps: 12, gymnastics: 'kb_swing'}
  ], notes: 'L\'enclume. 7 rounds courts et rapides. Squats modérés = unbroken. Burpees rapides. KBS unbroken. Sub 16min = forgé.' },
  gym: { name: 'Skill: Strict Press Strength', drills: ['3x5 Strict Press', '3x5 Push Press', '3x3 Push Jerk', '3x10 DB Strict Press'] }
},
{
  day: 92, week: 19, name: 'SPECTER', theme: 'Snatch + Ghost Chipper',
  haltero: { name: 'Snatch Pulls + Snatch', desc: '2 Snatch Pulls + 1 Snatch', scheme: 'Every 90s x 8 sets', weights: 'snatch' },
  wod: { name: 'SPECTER', type: 'For Time (cap 22min)', movements: [
    {name: 'Power Snatches', reps: 15, weight: 'snatch'},
    {name: 'Pistols', reps: 30, gymnastics: 'pistols'},
    {name: 'Cal Assault Bike', special: 'assault_bike', note: '25/20 cal'},
    {name: 'Handstand Walk', reps: '50ft', gymnastics: 'handstand_walk'},
    {name: 'Wall Balls', reps: 30, gymnastics: 'wall_ball'}
  ], notes: 'Le spectre. Snatches 5-5-5. Pistols alternés. Bike push hard. HS Walk 10ft segments. WB 10-10-10. Tout est mental.' },
  gym: { name: 'Skill: Handstand Walk', drills: ['3x5m HS Walk', '3x HS Walk around cone', '5x3m HS Walk with turn', '3x20s Freestanding HS Hold'] }
},
{
  day: 93, week: 19, name: 'HELLHOUND', theme: 'Deadlift + Savage AMRAP',
  haltero: { name: 'Deadlift', desc: 'Deadlift 3-3-2-2-1-1', scheme: '15min — Build to heavy', weights: 'deadlift' },
  wod: { name: 'HELLHOUND', type: 'AMRAP 18', movements: [
    {name: 'Deadlifts', reps: 8, weight: 'deadlift'},
    {name: 'Wall Balls', reps: 12, gymnastics: 'wall_ball'},
    {name: 'Toes-to-bar', reps: 8, gymnastics: 'toes_to_bar'},
    {name: 'Cal Row', special: 'row_cal', note: '12/10 cal'}
  ], notes: 'Le chien des enfers. DL modérés = TnG. WB unbroken. TTB 4-4. Row 1:00 pace. 5+ rounds = bête sauvage.' },
  gym: { name: 'Skill: Toes-to-bar', drills: ['3x10 Kipping Swings', '3x8 Knees-to-chest', '3x10 Toes-to-bar', '3x15 V-ups'] }
},
{
  day: 94, week: 19, name: 'MOLTEN', theme: 'Hang Clean + Meltdown',
  haltero: { name: 'Hang Clean', desc: 'Hang Squat Clean 2-2-2-1-1-1', scheme: 'E2MOM 12min', weights: 'hang_clean' },
  wod: { name: 'MOLTEN', type: '3 Rounds For Time (cap 20min)', movements: [
    {name: 'Hang Cleans', reps: 12, weight: 'hang_clean'},
    {name: 'HSPU', reps: 9, gymnastics: 'hspu'},
    {name: 'Double Unders', reps: 60, gymnastics: 'double_unders'},
    {name: 'Pull-ups', reps: 15, gymnastics: 'pullups'}
  ], notes: 'En fusion. Cleans légers = TnG 6-6. HSPU 3-3-3. DU unbroken. Pull-ups 5-5-5. Chaque round plus dur. Stay composed.' },
  gym: { name: 'Skill: HSPU Variations', drills: ['3x5 Strict HSPU', '3x3 Deficit HSPU', '3x8 Pike HSPU on box', '3x20s HS Hold (nose to wall)'] }
},
{
  day: 95, week: 19, name: 'WARDOG', theme: 'Back Squat + All-Out Finish',
  haltero: { name: 'Back Squat', desc: 'Back Squat 5-3-1-1-1', scheme: 'E3MOM 15min — Max out', weights: 'back_squat' },
  wod: { name: 'WARDOG', type: 'For Time (cap 20min)', movements: [
    {name: 'Back Squats', reps: 15, weight: 'back_squat'},
    {name: 'Bar Muscle-ups', reps: 9, gymnastics: 'muscle_ups_bar'},
    {name: 'Back Squats', reps: 12, weight: 'back_squat'},
    {name: 'Bar Muscle-ups', reps: 6, gymnastics: 'muscle_ups_bar'},
    {name: 'Back Squats', reps: 9, weight: 'back_squat'},
    {name: 'Bar Muscle-ups', reps: 3, gymnastics: 'muscle_ups_bar'}
  ], notes: 'Le chien de guerre. Squats modérés. 15 = 5-5-5. BMU 3-3-3 au 9. Descending = chaque set plus facile. Push les derniers sets.' },
  gym: { name: 'Skill: Muscle-up Transitions', drills: ['3x3 Strict C2B Pull-ups', '3x3 Slow Bar MU negatives', '5x1-2 Strict Bar MU', '3x5 Weighted Dips'] }
},

// ============ WEEK 20 — TAPER + PEAK ============
// Semaine 20 = TAPER PEAK. Volume progressivement réduit S20 pour pic de performance.
// Principes: D96=volume -60%, D97=volume -50%, D98=activation légère, D99=prépa mentale+skill, D100=THE FINALE
// Ne pas ajouter de fatigue — conserver l'énergie pour le Day 100 ARMAGEDDON
{
  day: 96, week: 20, name: 'TAPER-TECHNIQUE', theme: 'Taper J1 — Clean & Jerk Technique + EMOM Court', taper: true,
  haltero: { name: 'Clean & Jerk Technique', desc: 'Clean & Jerk 5x1 @75% — Technique parfaite, pas de fatigue. Concentrez-vous sur chaque détail', scheme: 'E3MOM x 5 — Récupération complète entre sets', weights: 'clean' },
  wod: { name: 'TAPER-1', type: 'EMOM 10 (3 rounds)', movements: [
    {name: 'Min 1: Power Cleans', reps: 4, weight: 'power_clean', note: '@65% — technique TnG'},
    {name: 'Min 2: Ring Muscle-ups', reps: 3, gymnastics: 'muscle_ups_ring'},
    {name: 'Min 3: Wall Balls', reps: 10, gymnastics: 'wall_ball'},
    {name: 'Min 4: Cal Assault Bike', special: 'assault_bike', note: '10/8 cal — aérobie léger'}
  ], notes: '⚡ TAPER S20 Jour 1: 10min au lieu de 20min. Reps -40%. Pace conversationnel. Corps = conservé pour ARMAGEDDON. Objectif: rester actif, pas se fatiguer. Concentrez-vous sur la qualité des mouvements. 4 jours jusqu\'au finale! 💪' },
  gym: { name: 'Activation + Récupération', drills: ['3x3 Strict Ring Dips (contrôle pur)', '3x5 Kipping Ring MU (facile)', '5min Foam Roll complet', '5min Visualisation: imaginez ARMAGEDDON'] }
},
{
  day: 97, week: 20, name: 'TAPER-SNATCH', theme: 'Taper J2 — Snatch Précision + WOD Court', taper: true,
  haltero: { name: 'Snatch Technique de Précision', desc: 'Snatch 5x1 @70% — Chaque rep = parfaite. Montée progressive légère', scheme: 'E3MOM x 5 — Qualité > quantité', weights: 'snatch' },
  wod: { name: 'TAPER-2', type: 'For Time (cap 10min)', movements: [
    {name: 'Power Snatches', reps: 6, weight: 'snatch', note: '@65%'},
    {name: 'Rope Climbs', reps: 2, gymnastics: 'rope_climb'},
    {name: 'Power Snatches', reps: 4, weight: 'snatch'},
    {name: 'Rope Climb', reps: 1, gymnastics: 'rope_climb'}
  ], notes: '⚡ TAPER S20 Jour 2: WOD court. Snatches légers = TnG contrôlés. Rope climbs techniques. Pas de sprint. Corps conservé. 3 jours pour ARMAGEDDON. Mangez bien, dormez 9h. 💤' },
  gym: { name: 'Snatch Skill + Mobilité', drills: ['5x2 Hang Snatch paused catch @55%', '3x3 Snatch Balance @50%', '5min Band stretches épaules', '5min Thoracic + hip mobility'] }
},
{
  day: 98, week: 20, name: 'TAPER-ACTIVATION', theme: 'Taper J3 — Squat Clean Léger + Activation Courte', taper: true,
  haltero: { name: 'Squat Clean Activation', desc: 'Squat Clean 4x1 @70% — Activation neuromusculaire légère', scheme: 'E3MOM x 4 — Léger mais explosif', weights: 'squat_clean' },
  wod: { name: 'TAPER-3', type: 'AMRAP 8 — Activation Pure', movements: [
    {name: 'Squat Cleans', reps: 2, weight: 'squat_clean', note: '@65%'},
    {name: 'HSPU', reps: 3, gymnastics: 'hspu'},
    {name: 'Box Jumps', reps: 5, gymnastics: 'box_jump'},
    {name: 'Toes-to-bar', reps: 5, gymnastics: 'toes_to_bar'}
  ], notes: '⚡ TAPER S20 Jour 3: 8min d\'activation. Reps minimaux. Garder les muscles actifs sans fatiguer. 2 jours pour ARMAGEDDON. Nutrition optimale: glucides 5-6g/kg, protéines 2g/kg. Hydratation +++. 💧' },
  gym: { name: 'Activation Gymnique + Récupération', drills: ['3x3 Strict MU (activation pure)', '3x5 Strict HSPU', '3x3/leg Pistols (activation)', '10min Easy Row zone 1 + stretching'] }
},
{
  day: 99, week: 20, name: 'TAPER-FINAL-PREP', theme: 'Taper J4 — Activation Finale + Préparation Mentale', taper: true,
  haltero: { name: 'Thruster Activation', desc: '1 Squat Clean + 3 Thrusters @65% x 4 sets — Juste activer les patterns', scheme: 'E3MOM x 4 — Ultra léger', weights: 'thruster' },
  wod: { name: 'TAPER-4', type: '3 Rounds AMRAP 3min / 1min REST', movements: [
    {name: 'Thrusters', reps: 5, weight: 'thruster', note: '@60% — explosifs'},
    {name: 'Burpees over bar', reps: 5, gymnastics: 'burpee'},
    {name: 'Double Unders', reps: 20, gymnastics: 'double_unders'}
  ], notes: '⚡ TAPER S20 Jour 4: VEILLE DE L\'ARMAGEDDON. Activation pure — pas de fatigue. 3 rounds de 3min, pas plus. Couchez-vous tôt ce soir. Mangez des glucides complexes. Visualisez chaque mouvement d\'ARMAGEDDON. Vous avez travaillé 99 jours pour CE moment. Demain = votre jour. 🔥💪🏆' },
  gym: { name: 'Préparation Mentale & Skill Final', drills: ['3x Max DU unbroken (relaxé)', '3x10 Strict Pull-ups (activation)', '5min Easy Bike (activation corps entier)', '15min Visualisation + mental preparation pour Day 100'] }
},
{
  day: 100, week: 20, name: 'ARMAGEDDON', theme: 'The Final Battle — Ultimate WOD',
  haltero: { name: 'Clean & Jerk', desc: 'Clean & Jerk — Build to 1RM', scheme: 'E2MOM 14min — Every rep counts', weights: 'clean' },
  wod: { name: 'ARMAGEDDON', type: 'For Time (cap 35min)', movements: [
    {name: 'Cal Row', special: 'row_cal', note: '50/40 cal'},
    {name: 'Deadlifts', reps: 40, weight: 'deadlift'},
    {name: 'Wall Balls', reps: 50, gymnastics: 'wall_ball'},
    {name: 'Power Cleans', reps: 30, weight: 'power_clean'},
    {name: 'HSPU', reps: 25, gymnastics: 'hspu'},
    {name: 'Double Unders', reps: 100, gymnastics: 'double_unders'},
    {name: 'Thrusters', reps: 20, weight: 'thruster'},
    {name: 'Bar Muscle-ups', reps: 15, gymnastics: 'muscle_ups_bar'},
    {name: 'Squat Cleans', reps: 10, weight: 'squat_clean'},
    {name: 'Ring Muscle-ups', reps: 5, gymnastics: 'muscle_ups_ring'},
    {name: 'Rope Climb', reps: 1, gymnastics: 'rope_climb'}
  ], notes: 'ARMAGEDDON. Le WOD final. 100 jours pour ça. Row 2:00. DL 8x5. WB 10x5. Cleans 5x6. HSPU 5x5. DU unbroken. Thrusters 4x5. BMU 3-3-3-3-3. SqCl singles. RMU 2-2-1. Last rope climb = victoire. Vous êtes des guerriers.' },
  gym: { name: 'Skill: Victory Lap', drills: ['3x Max Strict Pull-ups', '3x Max Strict HSPU', '1x Max Ring Muscle-ups', '1x Max Unbroken Double Unders', '5min Easy Row — Cool Down'] }
}
];

// Replace inline WODs from app-core.js with the full 100 WOD database
if (window.CF_WODS_FULL && window.CF_WODS_FULL.length > 0) {
  window.CF_WODS = window.CF_WODS_FULL;
}

})();
