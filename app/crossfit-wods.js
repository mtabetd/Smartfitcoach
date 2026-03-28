// crossfit-wods.js — 100 WODs CrossFit Programming Elite
// 100 WODs Games-Level — Phase 1-20 complète avec scaling et RX+
(function(){
'use strict';

window.CF_WODS_FULL = [
// ============ WEEK 1-17 ============
{
  day: 1, week: 1, name: 'IGNITION', theme: 'Haltéro Lourd + Aérobie Base',
  haltero: { name: 'Back Squat', desc: 'Montée progressive en 5 séries. Focus: descent contrôlée 3 secondes, position du dos irréprochable, drive des hanches. Repos complet entre les séries.', scheme: 'E3MOM 15min — 5 sets x 5 reps @ 65-70% 1RM', weights: 'back_squat' },
  wod: { name: 'IGNITION', type: 'AMRAP 20', movements: [{name: 'Calories Row', reps: 15, special: 'row_cal'}, {name: 'Thruster', reps: 10, weight: 'thruster'}, {name: 'Toes-to-Bar', reps: 10, gymnastics: 'toes_to_bar'}], notes: 'Pace conversationnel sur le rower — 15 calories à environ 85% effort, tu dois pouvoir parler. Les thrusters RX à 43/29kg restent ininterrompus les 3-4 premiers rounds. TTB en sets de 5-5 si nécessaire. Objectif: 6-8 rounds complets. Ne pars jamais à 100% en semaine 1 — cette base aérobie te servira semaines 8-12. Cible: sortir du WOD à 80% d\'effort max.' },
  gym: { name: 'Skill: Hollow Body + Kipping', drills: ['Hollow rock hold: 4 x 20 secondes, serrer abs et fessiers, lombaires au sol', 'Arch rock: 4 x 20 secondes, bras et jambes tendus, position inverse', 'Kipping swing sur barre: 3 x 10 swings contrôlés, focus amplitude', 'Kipping pull-up progressif: 3 x 5 reps, touch-and-go, no butterfly yet'] },
  scaled: { movements: [{name: 'Calories Row', reps: 12, note: '→ même intensité, volume réduit'}, {name: 'Thruster', reps: 8, note: '→ poids léger technique, 20-25kg'}, {name: 'Hanging Knee Raise', reps: 10, note: '→ genoux à la poitrine au lieu de TTB'}], note: 'Scaled: conserver le même rythme aérobie, pas de pause entre les mouvements.' },
  rxPlus: { note: 'RX+ : 20 cal row / 15 thrusters / 15 TTB — ajouter 5kg sur le thruster standard.' }
},
{
  day: 2, week: 1, name: 'GROUNDWORK', theme: 'Haltéro Technique + Gymnast',
  haltero: { name: 'Hang Power Clean', desc: 'Technique hang position: barbell au-dessus des genoux, shrug explosif, coudes hauts et rapides. 3 reps par set, pause 2 sec en hang entre chaque. Vidéo chaque série si possible.', scheme: 'Every 90s x 10 sets — 3 reps @ 60-65% 1RM', weights: 'hang_clean' },
  wod: { name: 'GROUNDWORK', type: 'For Time (cap 18min)', movements: [{name: 'Double Unders', reps: 100, gymnastics: 'double_unders'}, {name: 'Deadlift', reps: 21, weight: 'deadlift'}, {name: 'Pull-ups', reps: 21, gymnastics: 'pullups'}, {name: 'Double Unders', reps: 75, gymnastics: 'double_unders'}, {name: 'Deadlift', reps: 15, weight: 'deadlift'}, {name: 'Pull-ups', reps: 15, gymnastics: 'pullups'}, {name: 'Double Unders', reps: 50, gymnastics: 'double_unders'}, {name: 'Deadlift', reps: 9, weight: 'deadlift'}, {name: 'Pull-ups', reps: 9, gymnastics: 'pullups'}], notes: 'Cible élite: sous 12 minutes. DL à 102/70kg — hips back, jamais arrondir le dos, surtout en fatigue. DU en sets non-stop si possible: 100 unbroken = 90 secondes, pas de panique si tu trébuches. Pull-ups en grandes séries: 15-6 / 10-5 / 9 unbroken. Le set de 9 final doit partir en sprint. Gestion clé: ne jamais te reposer plus de 15 secondes sur les DL.' },
  gym: { name: 'Skill: Handstand Walk Fondamentaux', drills: ['Box handstand hold: 3 x 30 secondes, corps aligné, regard entre les mains', 'Kick-up contre mur: 3 x 10, focus engagement épaules actives', 'Shoulder tap contre mur: 3 x 8 chaque côté, contrôle latéral', 'Handstand push-up négatif: 4 x 3 reps, 5 secondes de descente'] },
  scaled: { movements: [{name: 'Single Unders', reps: 150, note: '→ x1.5 le volume en singles'}, {name: 'Deadlift', reps: 21, note: '→ 60-70% du poids RX, priorité dos droit'}, {name: 'Ring Row ou Band Pull-up', reps: 21, note: '→ maintenir l\'horizontalité du corps en ring row'}], note: 'Scaled: le principal est de finir avant le cap avec de bonnes positions.' },
  rxPlus: { note: 'RX+ : ajouter 10kg sur le deadlift, butterfly pull-ups obligatoires, DU unbroken chaque set ou recommencer.' }
},
{
  day: 3, week: 1, name: 'ATLAS', theme: 'Chipper Complet',
  haltero: { name: 'Overhead Squat', desc: 'Snatch grip, barre au-dessus de la tête verrouillée, descent lente 3 secondes. Focus: lat engagement, genoux tracking, regard droit devant. Ne pas laisser les coudes plier.', scheme: 'E2MOM 12min — 6 sets x 3 reps @ 55-60% 1RM', weights: 'overhead_squat' },
  wod: { name: 'ATLAS', type: 'For Time (cap 25min)', movements: [{name: 'Calories Assault Bike', reps: 30, special: 'assault_bike'}, {name: 'Wall Ball', reps: 40, gymnastics: 'wall_ball'}, {name: 'Box Jump', reps: 30, gymnastics: 'box_jump'}, {name: 'KB Swing', reps: 40, gymnastics: 'kb_swing'}, {name: 'Burpee', reps: 20, gymnastics: 'burpee'}, {name: 'Wall Ball', reps: 30, gymnastics: 'wall_ball'}, {name: 'Calories Assault Bike', reps: 20, special: 'assault_bike'}], notes: 'Le chipper est une course contre ta gestion de l\'énergie. Assault Bike: commencer à 70-75 RPM, pas plus. Wall Ball: sets de 10-10-10-10, toucher la cible à chaque rep. Box Jump: step down si nécessaire pour préserver les jambes. KB Swing: russe ou américain selon programme — hanches, pas les bras. Burpees: pace constant 10-12/min. La seconde moitié du chipper doit être exécutée sans arrêt. Cible: sous 20 min.' },
  gym: { name: 'Skill: Rope Climb Technique', drills: ['Foot lock drilling au sol: 10 reps chaque pied, S-wrap et J-hook', 'Squat à la corde: 5 montées à mi-hauteur, focus pieds seuls', 'Rope climb complet avec jambes: 3 montées technique lente', 'Legless negative: descente lente sans jambes x 3, force core'] },
  scaled: { movements: [{name: 'Calories Assault Bike', reps: 20, note: '→ 2/3 du volume'}, {name: 'Wall Ball', reps: 30, note: '→ balle plus légère, 6kg'}, {name: 'Box Jump', reps: 25, note: '→ box step-up si sauts non maîtrisés'}, {name: 'KB Swing', reps: 30, note: '→ swing russe uniquement, 16/12kg'}, {name: 'Burpee', reps: 15, note: '→ pace détendu, qualité du mouvement'}], note: 'Scaled: réduire le volume global de 25-30%, garder l\'intention de compléter sans cap.' },
  rxPlus: { note: 'RX+ : doubler les calories bike (60/40), ajouter 10 muscle-ups anneaux après les 40 KB swing, finir par 20 HSPU.' }
},
{
  day: 4, week: 1, name: 'VELOCITY', theme: 'Sprint / Intervals',
  haltero: { name: 'Push Press', desc: 'Dip-drive-press explosif. 3 séries légères, puis intervalles intenses. Focus: lockout complet au-dessus, jambes se verrouillent avant les bras poussent, pas de re-dip.', scheme: 'Every 2min x 8 sets — 5 reps @ 65% 1RM, explosif', weights: 'push_press' },
  wod: { name: 'VELOCITY', type: 'EMOM 20 (5 rounds x 4 mouvements)', movements: [{name: 'Calories Row', reps: 12, special: 'row_cal'}, {name: 'Thruster', reps: 9, weight: 'thruster'}, {name: 'Toes-to-Bar', reps: 12, gymnastics: 'toes_to_bar'}, {name: 'Rest', reps: 1, note: 'Minute de repos'}], notes: 'EMOM format: chaque minute a 1 mouvement + repos sur la 4ème minute. Objectif: terminer chaque mouvement en 40-45 secondes MAX pour avoir 15-20 sec de repos. Si tu déborde sur la minute suivante, scale immédiatement. Le rower à fond pour 12 cal = 25-30 secondes. 9 thrusters = 20-25 sec. 12 TTB = 25-30 sec. Totale: 18-20 sec de repos par round. Ce format EMOM développe la capacité à répéter des efforts intenses. Cible: maintenir le même rythme du round 1 au round 5.' },
  gym: { name: 'Skill: Double Unders Consistency', drills: ['Singles rapides: 100 unbroken en rythme, focus poignets', 'DU par 5: 10 séries de 5 DU avec 5 singles entre, corde petite', 'DU par 10: 8 séries de 10 DU, récup 30 sec', 'DU par 30: 3 séries, tester le rythme de compétition'] },
  scaled: { movements: [{name: 'Calories Row', reps: 8, note: '→ pace identique, volume réduit'}, {name: 'Thruster', reps: 7, note: '→ réduire charge de 30%, garder vitesse'}, {name: 'Hanging Knee Raise', reps: 10, note: '→ position hollow body maintenue'}], note: 'Scaled EMOM: l\'essentiel est de finir chaque mouvement en moins de 45 secondes.' },
  rxPlus: { note: 'RX+ : 15 cal row / 12 thrusters avec +5kg / 15 TTB — objectif 0 sec de repos, enchaîner direct sans pause.' }
},
{
  day: 5, week: 1, name: 'BEDROCK', theme: 'AMRAP Aérobie Long',
  haltero: { name: 'Front Squat', desc: 'Clean grip ou croix-bras. Position: coudes hauts, dos droit, descent parallèle ou sous. 5 reps controlled, pause 1 sec en bas. Temps de repos généreux entre sets.', scheme: 'E3MOM 15min — 5 sets x 5 reps @ 65% 1RM', weights: 'front_squat' },
  wod: { name: 'BEDROCK', type: 'AMRAP 30', movements: [{name: 'Run 400m', reps: 1, special: 'run_400'}, {name: 'Pull-ups', reps: 15, gymnastics: 'pullups'}, {name: 'Deadlift', reps: 15, weight: 'deadlift'}], notes: 'AMRAP 30 minutes = entraînement de capacité aérobie pure. Le 400m doit être couru à un pace que tu peux maintenir 30 min — environ 5:00-5:30/km pour les élites. Pull-ups en sets larges: 15 unbroken ou 10-5. DL: dos toujours droit, ne jamais sacrifier la position pour la vitesse. Objectif: 6-8 rounds complets. Conserve la même vitesse de course du round 1 au dernier. Si tu ralentis plus de 15 sec sur le 400m, tu es parti trop vite. Ce WOD teste ta base aérobie et ton capacity à tenir une charge de travail constante.' },
  gym: { name: 'Skill: Pistol Squat Progression', drills: ['Box pistol: 3 x 5 chaque jambe sur box basse, talon sur bord', 'Pistol assisté élastique: 3 x 5 chaque jambe, tension légère', 'Pistol with counterweight: 3 x 3 chaque jambe, haltère 5kg devant', 'Pistol complet tentative: 3 x max reps chaque jambe'] },
  scaled: { movements: [{name: 'Run 400m', reps: 1, note: '→ marche rapide si cardio insuffisant'}, {name: 'Ring Row', reps: 15, note: '→ corps horizontal ou incliné 45°'}, {name: 'Deadlift', reps: 12, note: '→ 60% RX, focus technique chaque rep'}], note: 'Scaled AMRAP 30: l\'objectif est de ne jamais s\'arrêter. Rythme lent mais constant.' },
  rxPlus: { note: 'RX+ : remplacer pull-ups par muscle-ups anneaux (10 reps), ajouter 10kg sur le deadlift, run à pace soutenu 4:30/km.' }
},
{
  day: 6, week: 2, name: 'THUNDERSTRIKE', theme: 'Haltéro Lourd + Gymnast',
  haltero: { name: 'Power Clean', desc: 'Position de départ irréprochable: barre sur les tibias, dos plat, lat engagés. Pull explosif, hanche à la barre, catch en quarter squat. Pas de muscle clean.', scheme: 'E2MOM 14min — 7 sets x 3 reps @ 65-70% 1RM', weights: 'power_clean' },
  wod: { name: 'THUNDERSTRIKE', type: 'For Time (cap 20min)', movements: [{name: 'HSPU', reps: 21, gymnastics: 'hspu'}, {name: 'Power Clean', reps: 15, weight: 'power_clean'}, {name: 'HSPU', reps: 15, gymnastics: 'hspu'}, {name: 'Power Clean', reps: 12, weight: 'power_clean'}, {name: 'HSPU', reps: 9, gymnastics: 'hspu'}, {name: 'Power Clean', reps: 9, weight: 'power_clean'}], notes: 'Descend: 21-15-9 HSPU avec 15-12-9 power clean. Cible élite: sous 14 minutes. HSPU: tête au sol entre les mains, lockout complet au-dessus. En semaine 2, sets de 5-5-5-6 pour les 21, puis 5-5-5 pour les 15. Power clean: single reps si nécessaire, ne jamais rounded back sous fatigue. Le grip va fatiguer — utiliser la chalk. La transition HSPU vers clean est le moment le plus difficile — 5 respirations profondes max. Dernier set de 9 doit partir unbroken.' },
  gym: { name: 'Skill: Muscle-up Transition', drills: ['False grip rowing: 3 x 10, anneaux bas, corps horizontal', 'Transition drill avec jump: 5 x 3, sauter en catch-dip sur anneaux', 'Dip profond sur anneaux: 3 x 5, descent sous les mains', 'Muscle-up avec band: 3 x 3, focus transition fluide'] },
  scaled: { movements: [{name: 'Pike Push-up', reps: 21, note: '→ jambes sur box pour simuler HSPU'}, {name: 'Power Clean', reps: 15, note: '→ 50% 1RM ou hang power clean léger'}, {name: 'Pike Push-up', reps: 15, note: '→ maintenir la verticalité du dos'}, {name: 'Power Clean', reps: 12, note: '→ focus sur la vitesse des coudes'}], note: 'Scaled: le but est de maintenir la mécanique du mouvement, jamais la chaise.' },
  rxPlus: { note: 'RX+ : strict HSPU (pas de kipping) + 10kg supplémentaire sur le clean. 21-15-9-6 au lieu de 21-15-9.' }
},
{
  day: 7, week: 2, name: 'IRON WILL', theme: 'AMRAP + Haltéro',
  haltero: { name: 'Back Squat', desc: 'Cette semaine: montée en intensité. Même protocole que semaine 1 mais 3-5kg de plus. Qualité identique requise: descent 3 secondes, pause 1 sec en bas, drive explosif.', scheme: 'E3MOM 15min — 5 sets x 5 reps @ 70-75% 1RM', weights: 'back_squat' },
  wod: { name: 'IRON WILL', type: 'AMRAP 18', movements: [{name: 'Thruster', reps: 7, weight: 'thruster'}, {name: 'Toes-to-Bar', reps: 7, gymnastics: 'toes_to_bar'}, {name: 'Box Jump', reps: 7, gymnastics: 'box_jump'}], notes: 'Triple 7 = rythme constant et régulier. Cible élite: 10-12 rounds. Chaque mouvement en sets unbroken — c\'est l\'objectif principal de la phase BASE. Thruster: pas de pause en bas, rebond du squat direct en press. TTB: rythme de balancier kipping régulier, ne pas casser le set pour les 7 premières reps. Box jump: deux pieds ensemble à la réception, redescendre en step-down pour préserver les tendons d\'Achille. Si tu es à 80%+ effort au round 5, tu es parti trop vite. Pace: 45-50 sec par round.' },
  gym: { name: 'Skill: Kipping HSPU', drills: ['Wall plank kipping: 3 x 10 swings contre le mur, genoux à poitrine', 'HSPU kipping tentative: 5 x 2 reps, focus timing de la poussée', 'Negative strict HSPU: 4 x 3, 4 secondes de descent', 'HSPU box: 3 x 5 sur box basse, hauteur progressive'] },
  scaled: { movements: [{name: 'Thruster', reps: 7, note: '→ poids où tu peux faire 15+ unbroken frais'}, {name: 'Hanging Knee Raise', reps: 7, note: '→ knees to elbow ou à la poitrine'}, {name: 'Box Step-up', reps: 7, note: '→ alternance jambes, même box height'}], note: 'Scaled AMRAP: conserver les 7 reps par mouvement, réduire les charges.' },
  rxPlus: { note: 'RX+ : 10-10-10 reps avec +5kg thruster, TTB remplacés par bar muscle-ups.' }
},
{
  day: 8, week: 2, name: 'TEMPEST', theme: 'Chipper Long',
  haltero: { name: 'Snatch', desc: 'Power snatch ou squat snatch selon niveau. Position de départ identique au clean. Sweep de la barre le long des jambes, hip extension maximale, catch overhead stable.', scheme: 'Every 90s x 12 sets — 2 reps @ 60-65% 1RM', weights: 'snatch' },
  wod: { name: 'TEMPEST', type: 'For Time (cap 30min)', movements: [{name: 'Calories Ski Erg', reps: 40, special: 'ski_erg'}, {name: 'Wall Ball', reps: 50, gymnastics: 'wall_ball'}, {name: 'Pull-ups', reps: 40, gymnastics: 'pullups'}, {name: 'KB Swing', reps: 50, gymnastics: 'kb_swing'}, {name: 'Burpee', reps: 30, gymnastics: 'burpee'}, {name: 'Double Unders', reps: 100, gymnastics: 'double_unders'}, {name: 'Calories Ski Erg', reps: 20, special: 'ski_erg'}], notes: 'Grand chipper de la semaine. Cible élite: sous 22 minutes. Ski erg: tirer des hanches, pas des bras, maintenir 55-60 pulls/min. Wall ball: sets de 10, toucher la cible, hips full depth. Pull-ups: butterfly si possible, sets de 10-8-7-8-7. KB swing américain: lockout complet overhead, lat engagement. Burpees: marche rapide si nécessaire, jamais s\'allonger en pause. DU: 50-25-25 ou 100 unbroken pour les élites. Le ski final à 20 cal est ton sprint — tout lâcher.' },
  gym: { name: 'Skill: Toes-to-Bar Advanced', drills: ['TTB strict: 3 x 5, force abdominale pure, pas de swing', 'TTB kipping sets: 5 x 8, focus rythme et relâchement', 'TTB en fatigue: 100 TTB for time comme benchmark', 'L-hang hold: 3 x 20 secondes, jambes parallèles au sol'] },
  scaled: { movements: [{name: 'Calories Ski Erg', reps: 25, note: '→ rythme aérobie conversation'}, {name: 'Wall Ball', reps: 35, note: '→ balle plus légère'}, {name: 'Ring Row', reps: 30, note: '→ corps incliné, tirer les coudes'}, {name: 'KB Swing', reps: 35, note: '→ swing russe, 16/12kg'}, {name: 'Burpee', reps: 20, note: '→ step out si sauts douloureux'}], note: 'Scaled: réduire chaque station de 25-30%, maintenir le flux du chipper.' },
  rxPlus: { note: 'RX+ : ajouter 20 ring muscle-ups après les pull-ups, ski erg initial à 60 cal, DU 150 unbroken.' }
},
{
  day: 9, week: 2, name: 'SURGE', theme: 'Intervals Sprint',
  haltero: { name: 'Deadlift', desc: 'Semaine 2: montée progressive. Barbell sur le sol à chaque rep, pas de touch-and-go. Position avant de soulever: barre au-dessus des orteils, dos droit, regard devant. Contrôlé vers le bas.', scheme: 'E2MOM 12min — 6 sets x 4 reps @ 70-75% 1RM', weights: 'deadlift' },
  wod: { name: 'SURGE', type: '10 Rounds For Time (cap 20min)', movements: [{name: 'Calories Assault Bike', reps: 10, special: 'assault_bike'}, {name: 'Wall Ball', reps: 10, gymnastics: 'wall_ball'}, {name: 'Toes-to-Bar', reps: 5, gymnastics: 'toes_to_bar'}], notes: '10 rounds = effort répété et régulier. Cible élite: sous 16 minutes = 96 sec/round. Assault bike: attaque à fond 10 cals = 25-30 secondes max. Wall ball enchaîne IMMÉDIATEMENT, 10 reps unbroken toujours. 5 TTB = toujours unbroken, c\'est 5 reps seulement. Repos max 5-10 secondes entre les stations, jamais entre les rounds. Le round 7-8 sera le plus dur mentalement — ne pas céder. L\'objectif est la régularité: le round 10 doit être aussi rapide que le round 1. C\'est le test de ta capacité de répétition.' },
  gym: { name: 'Skill: Rope Climb Speed', drills: ['Rope climb legless x 2: pur force, monter en 4 pulls max', 'Rope climb technique: 3 montées chronométrées avec pieds', 'Rope descent controlled: descendre lentement en 6 sec', 'Rope climb competition: 5 montées for time avec repos minimal'] },
  scaled: { movements: [{name: 'Calories Assault Bike', reps: 7, note: '→ sprint court, pas de pace'}, {name: 'Wall Ball', reps: 10, note: '→ même volume, balle plus légère'}, {name: 'Hanging Knee Raise', reps: 7, note: '→ genoux au dessus de la hanche'}], note: 'Scaled intervals: maintenir le sprint à chaque round, c\'est l\'intention principale.' },
  rxPlus: { note: 'RX+ : 15 cal bike / 15 wall ball / 10 TTB — pace identique mais volume +50%. Chaque round sous 2 minutes.' }
},
{
  day: 10, week: 2, name: 'FORTRESS', theme: 'AMRAP Aérobie + Force',
  haltero: { name: 'Front Squat', desc: 'Progression depuis semaine 1. Coudes hauts impérativement, barre sur les épaules frontales. Squat complet sous la parallèle. Chaque rep part d\'un stop complet en bas.', scheme: 'E3MOM 15min — 5 sets x 4 reps @ 70% 1RM', weights: 'front_squat' },
  wod: { name: 'FORTRESS', type: 'AMRAP 25', movements: [{name: 'Run 400m', reps: 1, special: 'run_400'}, {name: 'Thruster', reps: 12, weight: 'thruster'}, {name: 'Pull-ups', reps: 12, gymnastics: 'pullups'}], notes: 'Classic triplet AMRAP longue durée. Cible élite: 7+ rounds. 400m à pace comfortable mais soutenu — 1:45-2:00 par lap. Thrusters: ne jamais poser la barre avant 12 reps les premiers rounds. Pull-ups: sets de 6-6 ou 8-4. En semaine 2, le focus est de battre ton score de semaine 1 sur BEDROCK (même structure). Chaque round doit être à 2-3 secondes d\'intervalle. Si le 400m commence à ralentir de 15+ secondes, c\'est le signal de scale. Respiration profonde en courant.' },
  gym: { name: 'Skill: Handstand Walk Progression', drills: ['Handstand chest-to-wall: 3 x 30 sec, corps parfaitement aligné', 'Shoulder tap latéral: 3 x 8 chaque côté en handstand wall', 'HS walk contre mur: avancer les mains à 10-15cm du mur x 3', 'HS walk libre: 3 tentatives de distance maximale'] },
  scaled: { movements: [{name: 'Run 400m', reps: 1, note: '→ pace confortable, 3:00/km si besoin'}, {name: 'Thruster', reps: 9, note: '→ réduire charge à 70% RX'}, {name: 'Ring Row', reps: 12, note: '→ corps horizontal, tirage complet'}], note: 'Scaled AMRAP 25: focaliser sur la continuité, jamais s\'arrêter plus de 20 sec.' },
  rxPlus: { note: 'RX+ : 800m run au lieu de 400m, 15 thrusters +5kg, 15 muscle-ups ring au lieu de pull-ups.' }
},
{
  day: 11, week: 3, name: 'COLOSSUS', theme: 'Haltéro Lourd + Aérobie',
  haltero: { name: 'Squat Clean', desc: 'Le mouvement reine. Départ au sol, premier pull lent et puissant, second pull explosif, catch en squat complet. Phase 3 = monter le squat clean en puissance. 2 reps par set, focus sur la réception basse.', scheme: 'E2MOM 16min — 8 sets x 2 reps @ 70-75% 1RM', weights: 'squat_clean' },
  wod: { name: 'COLOSSUS', type: 'For Time (cap 22min)', movements: [{name: 'Thruster', reps: 30, weight: 'thruster'}, {name: 'Toes-to-Bar', reps: 30, gymnastics: 'toes_to_bar'}, {name: 'Thruster', reps: 20, weight: 'thruster'}, {name: 'Toes-to-Bar', reps: 20, gymnastics: 'toes_to_bar'}, {name: 'Thruster', reps: 10, weight: 'thruster'}, {name: 'Toes-to-Bar', reps: 10, gymnastics: 'toes_to_bar'}], notes: 'Descend classic 30-20-10. Cible élite: sous 15 minutes. 30 thrusters = sets de 10-10-10 max, ne jamais aller à l\'échec. 30 TTB = sets de 8-8-7-7. Transition thruster-TTB: 3 respirations max, puis repartir. Les 20 thrusters peuvent être 10-10. Les 10 finaux doivent être unbroken si tu gères bien le pacing. TTB finaux: unbroken si possible — dernier effort. Attention à la grip fatigue combinée: thrusters et TTB taxent les avants-bras différemment mais les deux épuisent.' },
  gym: { name: 'Skill: Bar Muscle-up Fondamentaux', drills: ['Kipping pull-up haut: 3 x 5, barre doit toucher poitrine', 'Swing agressif + pull: 3 x 5, focus timing de la poussée des hanches', 'Chest-to-bar pull-up: 3 x 8, préparation directe au muscle-up', 'Bar muscle-up avec band: 3 x 3, focus transition au-dessus de la barre'] },
  scaled: { movements: [{name: 'Thruster', reps: 21, note: '→ 30-20-10 réduit à 21-15-9, 70% charge RX'}, {name: 'Hanging Knee Raise', reps: 21, note: '→ genoux à la poitrine, kipping autorisé'}, {name: 'Thruster', reps: 15, note: '→ jamais poser la barre avant la moitié du set'}, {name: 'Hanging Knee Raise', reps: 15, note: '→ sets de 7-8'}, {name: 'Thruster', reps: 9, note: '→ unbroken si possible'}, {name: 'Hanging Knee Raise', reps: 9, note: '→ unbroken final'}], note: 'Scaled: 21-15-9 avec charges et mouvements adaptés.' },
  rxPlus: { note: 'RX+ : remplacer TTB par bar muscle-ups (même volume), +5kg sur thruster. Objectif sous 12 minutes.' }
},
{
  day: 12, week: 3, name: 'RAMPAGE', theme: 'AMRAP Haute Intensité',
  haltero: { name: 'Push Press', desc: 'Semaine 3: charges légèrement plus lourdes. Focus: dip rapide et court (5-7cm), drive des jambes transmis à la barre, bras finish le lockout. Heads through au sommet.', scheme: 'Every 90s x 12 sets — 4 reps @ 70% 1RM, focus vitesse', weights: 'push_press' },
  wod: { name: 'RAMPAGE', type: 'AMRAP 15', movements: [{name: 'Calories Row', reps: 10, special: 'row_cal'}, {name: 'Deadlift', reps: 10, weight: 'deadlift'}, {name: 'Burpee', reps: 5, gymnastics: 'burpee'}], notes: 'AMRAP 15 plus court = intensité plus haute. Cible élite: 10-12 rounds. 10 cal row à fond = 25 secondes max. DL: hips drive, pas de rounded back même en fatigue. 5 burpees = toujours sprint, 5 reps c\'est jouable non-stop. Ce triplet classique demande de gérer la tension du grip: DL puis row = avants-bras sollicités en continu. Stratégie: rower les 10 cal en 25-28 sec, DL 15-20 sec, burpees 20-25 sec = round en 60-75 sec. La clé: ne jamais s\'arrêter entre les mouvements.' },
  gym: { name: 'Skill: Gymnastic Conditioning', drills: ['Ring dip: 4 x 8, descent contrôlée sous épaules, lockout complet', 'L-sit progressif: 3 x 15 secondes, jambes droites si possible', 'Hollow rock: 4 x 20 reps, qualité > vitesse', 'Arch hold: 4 x 20 sec à plat ventre, bras et jambes levés'] },
  scaled: { movements: [{name: 'Calories Row', reps: 8, note: '→ même sprint, volume réduit'}, {name: 'Deadlift', reps: 8, note: '→ 60% 1RM, priorité dos'}, {name: 'Burpee', reps: 5, note: '→ même volume, step-out si problème genoux'}], note: 'Scaled AMRAP: la clé est de ne jamais s\'arrêter, adapter les charges.' },
  rxPlus: { note: 'RX+ : 15 cal / 15 DL +15kg / 10 burpees. Objectif: 8+ rounds.' }
},
{
  day: 13, week: 3, name: 'REAPER', theme: 'Chipper Technique',
  haltero: { name: 'Overhead Squat', desc: 'Semaine 3: montée en volume. 4 reps au lieu de 3. Barre lockée, lat engagés, descent lente. Si les épaules fatiguent, réduire le poids immédiatement.', scheme: 'E2MOM 14min — 7 sets x 4 reps @ 60-65% 1RM', weights: 'overhead_squat' },
  wod: { name: 'REAPER', type: 'For Time (cap 28min)', movements: [{name: 'Double Unders', reps: 150, gymnastics: 'double_unders'}, {name: 'Thruster', reps: 30, weight: 'thruster'}, {name: 'Pull-ups', reps: 30, gymnastics: 'pullups'}, {name: 'Box Jump', reps: 30, gymnastics: 'box_jump'}, {name: 'Wall Ball', reps: 30, gymnastics: 'wall_ball'}, {name: 'Double Unders', reps: 100, gymnastics: 'double_unders'}], notes: 'Chipper de milieu de semaine. 150 DU d\'ouverture: gérer le rythme, sets de 50-50-50 si pas sûr de ton unbroken. 30 thrusters: sets de 10-10-10 maximum, ne pose pas la barre avant 10. Pull-ups 30 reps: butterfly 10-10-10 ou kipping 8-7-8-7. Box jump: step-down systématique, 30 reps = risque tendons. Wall ball: sets de 10. DU final: sprint pur, tout ce qu\'il reste en réserve. Cible élite: sous 20 minutes.' },
  gym: { name: 'Skill: Snatch Technique', drills: ['PVC snatch: 20 reps, focus positions de départ et de réception', 'Snatch balance: 5 x 3 avec barre vide, vitesse descent sous', 'Hang snatch: 5 x 2 léger, focus extension hanche complète', 'Overhead squat avec snatch grip: 5 x 5 poids léger, stabilité'] },
  scaled: { movements: [{name: 'Double Unders', reps: 100, note: '→ ou 200 singles équivalent'}, {name: 'Thruster', reps: 21, note: '→ réduire volume et charge 70%'}, {name: 'Ring Row', reps: 21, note: '→ body row horizontal'}, {name: 'Box Step-up', reps: 21, note: '→ alternate legs, même hauteur'}, {name: 'Wall Ball', reps: 21, note: '→ balle plus légère'}, {name: 'Double Unders', reps: 50, note: '→ sprint final'}], note: 'Scaled: réduire volumes à 21 reps, maintenir l\'enchaînement.' },
  rxPlus: { note: 'RX+ : DU 200/150, thrusters +5kg, remplacer pull-ups par bar muscle-ups (20 reps).' }
},
{
  day: 14, week: 3, name: 'SHOCKWAVE', theme: 'Intervals Force-Cardio',
  haltero: { name: 'Hang Clean', desc: 'Variante hang pour forcer l\'extension hanche. Commencer juste au-dessus des genoux. 3 reps par set, pas de repos entre les reps, pose la barre entre les sets.', scheme: 'E2MOM 12min — 6 sets x 3 reps @ 65-70% 1RM', weights: 'hang_clean' },
  wod: { name: 'SHOCKWAVE', type: '6 Rounds For Time (cap 18min)', movements: [{name: 'Calories Assault Bike', reps: 12, special: 'assault_bike'}, {name: 'Hang Clean', reps: 6, weight: 'hang_clean'}, {name: 'HSPU', reps: 8, gymnastics: 'hspu'}], notes: 'Triplet intense avec 6 rounds. Cible élite: sous 14 minutes. Assault bike: 12 cal à fond — 30 secondes max — ne rien garder en réserve. Hang clean: 6 reps touch-and-go si possible, même charge que l\'haltéro. HSPU: 8 reps en 2 sets maximum (5-3 ou 6-2). Le défi majeur: transition bike-clean. Le rythme cardiaque est à 95% quand tu arrives à la barre — respire 3 fois, puis attaque. Ne jamais dépasser 2 min par round. Dernier round: tout lâcher sur le bike.' },
  gym: { name: 'Skill: Pistol Squat Force', drills: ['Pistol bulgare: 3 x 5 chaque jambe, pied arrière sur box', 'Pistol avec haltère goblet: 3 x 3, contrepoids 8kg', 'Pistol avec bande en résistance: 3 x 5, augmenter la tension', 'Pistol complet 1 jambe: max reps chaque côté, benchmark'] },
  scaled: { movements: [{name: 'Calories Assault Bike', reps: 8, note: '→ volume réduit, même intensité sprint'}, {name: 'Hang Clean', reps: 6, note: '→ 50% 1RM, technique avant tout'}, {name: 'Pike Push-up', reps: 8, note: '→ jambes sur box, simuler HSPU'}], note: 'Scaled intervals: l\'intensité est la priorité, adapter les charges.' },
  rxPlus: { note: 'RX+ : 15 cal bike / 8 touch-and-go clean +5kg / 10 strict HSPU. Objectif sous 12 min.' }
},
{
  day: 15, week: 3, name: 'LEVIATHAN', theme: 'AMRAP Force Endurance',
  haltero: { name: 'Back Squat', desc: 'Semaine 3: introduction du tempo ascendant. Descent 3 sec, pause 1 sec en bas, remontée EXPLOSIVE. Charge modérée mais vitesse de montée maximale.', scheme: 'E3MOM 18min — 6 sets x 4 reps @ 70% 1RM, ascension explosive', weights: 'back_squat' },
  wod: { name: 'LEVIATHAN', type: 'AMRAP 22', movements: [{name: 'KB Swing', reps: 15, gymnastics: 'kb_swing'}, {name: 'Box Jump', reps: 12, gymnastics: 'box_jump'}, {name: 'Double Unders', reps: 30, gymnastics: 'double_unders'}, {name: 'Pull-ups', reps: 9, gymnastics: 'pullups'}], notes: 'AMRAP 22 min avec 4 mouvements variés. Cible élite: 8-10 rounds. KB swing américain: hips, hips, hips — bras ne font que suivre. Box jump: step-down systématique, pace régulier 1 saut/3-4 sec. DU 30: unbroken systématiquement si tu gères — 30 DU = 30 secondes. Pull-ups 9: unbroken les 5 premiers rounds, puis 5-4 si nécessaire. Ce WOD teste la coordination cardiovasculaire: 4 mouvements différents mais chacun sollicite quelque chose de distinct — cardio, puissance, coordination, traction.' },
  gym: { name: 'Skill: Handstand Push-up Strict', drills: ['Handstand hold contre mur: 3 x 45 secondes, position parfaite', 'Negative strict HSPU: 4 x 3 reps, 6 secondes de descent', 'HSPU assisté: 3 x 5 avec band, focus lockout', 'HSPU max: 3 tentatives de max reps strict, benchmark semaine 3'] },
  scaled: { movements: [{name: 'KB Swing', reps: 12, note: '→ swing russe, 16/12kg'}, {name: 'Box Step-up', reps: 12, note: '→ alternance jambes'}, {name: 'Double Unders', reps: 20, note: '→ ou 40 singles'}, {name: 'Ring Row', reps: 9, note: '→ inclinaison appropriée au niveau'}], note: 'Scaled AMRAP: ajuster les volumes pour maintenir 8+ rounds.' },
  rxPlus: { note: 'RX+ : KB swing 32/24kg, 15 box jump (box plus haute +5cm), 50 DU, 12 muscle-ups ring.' }
},
{
  day: 16, week: 4, name: 'WARLORD', theme: 'Haltéro Lourd + Capacity',
  haltero: { name: 'Squat Clean', desc: 'Progression semaine 4: charges plus lourdes, volume réduit. Travailler à 75-80% 1RM. La réception basse doit devenir automatique. Chaque set = 2 reps parfaites, pas de compromis.', scheme: 'E3MOM 15min — 5 sets x 2 reps @ 75-80% 1RM', weights: 'squat_clean' },
  wod: { name: 'WARLORD', type: 'For Time (cap 20min)', movements: [{name: 'Calories Row', reps: 50, special: 'row_cal'}, {name: 'Thruster', reps: 40, weight: 'thruster'}, {name: 'Toes-to-Bar', reps: 30, gymnastics: 'toes_to_bar'}, {name: 'Box Jump', reps: 20, gymnastics: 'box_jump'}, {name: 'Calories Row', reps: 10, special: 'row_cal'}], notes: 'Chipper décroissant avec bookend row. 50 cal row: pace aérobie 85%, 2:30-3:00 totales. 40 thrusters: JAMAIS unbroken — sets de 10-10-10-10, repos 15 sec entre. 30 TTB: 8-8-7-7. 20 box jump: step down, réservez les jambes. 10 cal row final: sprint pur. Cible élite: sous 16 minutes. La clé de ce WOD: ne pas bruler les thrusters trop vite. Si tu fais les 40 en 2 sets, tu vas mourir sur les TTB. Patience = performance.' },
  gym: { name: 'Skill: Clean Technique Breakdown', drills: ['Deadlift position: 5 x 5 reps lentes, focus start position', 'High pull: 5 x 3, tirer les coudes au maximum en hauteur', 'Muscle clean: 5 x 3, pas de drop sous la barre', 'Full squat clean léger: 5 x 3, focus réception active'] },
  scaled: { movements: [{name: 'Calories Row', reps: 35, note: '→ pace identical, volume réduit'}, {name: 'Thruster', reps: 28, note: '→ 70% RX weight, sets de 7'}, {name: 'Hanging Knee Raise', reps: 21, note: '→ knees to elbow'}, {name: 'Box Jump', reps: 15, note: '→ step-up si problèmes de sauts'}, {name: 'Calories Row', reps: 7, note: '→ sprint final identique'}], note: 'Scaled: chipper proportionnel, maintenir l\'enchaînement sans pause.' },
  rxPlus: { note: 'RX+ : 60 cal / 50 thrusters +5kg / 40 TTB / 30 box jump / 15 cal row. Objectif sous 18 min.' }
},
{
  day: 17, week: 4, name: 'TITAN', theme: 'AMRAP Force Pure',
  haltero: { name: 'Deadlift', desc: 'Semaine 4: charges lourdes et contrôlées. Pas de touch-and-go. Chaque rep = reset complet. Position: jambes à largeur d\'épaules, double overhand ou mix grip, lat engagement avant de soulever.', scheme: 'E3MOM 15min — 5 sets x 3 reps @ 80% 1RM, reps lentes et contrôlées', weights: 'deadlift' },
  wod: { name: 'TITAN', type: 'AMRAP 12', movements: [{name: 'Deadlift', reps: 5, weight: 'deadlift'}, {name: 'Burpee', reps: 5, gymnastics: 'burpee'}, {name: 'Box Jump', reps: 5, gymnastics: 'box_jump'}, {name: 'Pull-ups', reps: 5, gymnastics: 'pullups'}], notes: 'Tout à 5 reps = WOD de puissance répétée. Cible élite: 15-18 rounds. Deadlift à charge WOD (102/70kg) = touch-and-go possible, 5 reps = 10-12 secondes. Burpees: chest-to-ground, saut deux pieds, frappe des mains overhead. Box jump: step-down obligatoire pour 15+ rounds. Pull-ups: 5 toujours unbroken. Le format "5" permet un pace très élevé: objectif 45-50 sec par round complet. Si tu dépasses 60 sec par round, scale les charges. Ce WOD favorise la densité d\'entraînement.' },
  gym: { name: 'Skill: Double Unders Volume', drills: ['DU 50 unbroken: 3 tentatives, focus relâchement des épaules', 'DU avec fatigue: après 20 air squat, tenter 30 DU unbroken', 'DU alternés: 5 DU, 5 singles x 20, coordination', 'DU max: 1 tentative de max reps, benchmark personnel'] },
  scaled: { movements: [{name: 'Deadlift', reps: 5, note: '→ 60% 1RM, touch-and-go léger'}, {name: 'Burpee', reps: 5, note: '→ step-out si douleurs genoux'}, {name: 'Box Step-up', reps: 5, note: '→ alternance jambes rapide'}, {name: 'Ring Row', reps: 5, note: '→ horizontal, tirage complet'}], note: 'Scaled AMRAP 12: objectif 12+ rounds avec volumes adaptés.' },
  rxPlus: { note: 'RX+ : 8 reps de chaque mouvement, DL +15kg, box jump (box plus haute 75cm homme), muscle-ups ring à la place de pull-ups.' }
},
{
  day: 18, week: 4, name: 'CYCLONE', theme: 'Chipper Grand Volume',
  haltero: { name: 'Snatch', desc: 'Semaine 4: travailler la technique sous fatigue. 3 reps par set à charge modérée, mais après 5 min de cardio léger. Catch stable prioritaire sur la vitesse.', scheme: 'Every 90s x 10 sets — 3 reps @ 65% 1RM', weights: 'snatch' },
  wod: { name: 'CYCLONE', type: 'For Time (cap 35min)', movements: [{name: 'Calories Ski Erg', reps: 50, special: 'ski_erg'}, {name: 'Wall Ball', reps: 50, gymnastics: 'wall_ball'}, {name: 'Rope Climb', reps: 5, gymnastics: 'rope_climb'}, {name: 'Double Unders', reps: 100, gymnastics: 'double_unders'}, {name: 'Thruster', reps: 30, weight: 'thruster'}, {name: 'Rope Climb', reps: 5, gymnastics: 'rope_climb'}, {name: 'Wall Ball', reps: 30, gymnastics: 'wall_ball'}, {name: 'Calories Ski Erg', reps: 25, special: 'ski_erg'}], notes: 'Grand chipper symétrique. Cible élite: sous 25 minutes. Ski erg 50 cal: pace régulier, 2:30-3:00 minutes. Wall ball 50: sets de 10-10-10-10-10. Rope climb: 5 montées technique, descente lente. DU 100: essayer 50-50. Thrusters 30: 10-10-10 avec 15 sec repos. Rope climb final: si les bras sont fatigués, utiliser MAXIMUM les pieds. Wall ball 30: sets de 10. Ski final 25 cal = dernier sprint. Ne jamais oublier: chaque mouvement a une fin — garde la tête dans le mouvement présent.' },
  gym: { name: 'Skill: Kipping Pull-up Efficiency', drills: ['Kipping swing: 3 x 15 swings, amplitude maximale', 'Pull-up kipping singles: 3 x 10, touch-and-go', 'Pull-up kipping rapide: 3 x 15, rythme de compétition', 'Butterfly pull-up: 3 x 5-10 si maîtrisé, focus timing'] },
  scaled: { movements: [{name: 'Calories Ski Erg', reps: 35, note: '→ pace aérobie conversation'}, {name: 'Wall Ball', reps: 35, note: '→ balle légère, cible plus basse'}, {name: 'Rope Climb', reps: 3, note: '→ avec assistance jambes'}, {name: 'Double Unders', reps: 60, note: '→ ou 120 singles'}, {name: 'Thruster', reps: 20, note: '→ 70% RX, sets de 5-5-5-5'}, {name: 'Rope Climb', reps: 3, note: '→ même technique'}, {name: 'Wall Ball', reps: 20, note: '→ même balle légère'}, {name: 'Calories Ski Erg', reps: 15, note: '→ sprint final identique'}], note: 'Scaled: réduire volumes, maintenir la structure du chipper.' },
  rxPlus: { note: 'RX+ : ski 60 cal, wall ball 60/40, 8 rope climb à chaque station, DU 150, thrusters +5kg.' }
},
{
  day: 19, week: 4, name: 'INFERNAL-I', theme: 'Intervals Puissance',
  haltero: { name: 'Power Clean', desc: 'Semaine 4: singles lourds en intervalles. Chaque rep doit être parfaite. Reset complet entre les reps. Augmenter progressivement jusqu\'à 80-85% 1RM sur les derniers sets.', scheme: 'E2MOM 16min — 8 sets x 1-2 reps @ 80-85% 1RM', weights: 'power_clean' },
  wod: { name: 'INFERNAL-I', type: 'EMOM 24 (8 rounds x 3 min)', movements: [{name: 'Calories Assault Bike', reps: 15, special: 'assault_bike'}, {name: 'Wall Ball', reps: 15, gymnastics: 'wall_ball'}, {name: 'Toes-to-Bar', reps: 10, gymnastics: 'toes_to_bar'}, {name: 'Rest', reps: 1, note: '→ récupération restante de la minute'}], notes: 'Format EMOM 3 minutes: 15 cal bike + 15 wall ball + 10 TTB en moins de 2 min 30, récup 30 sec. 8 rounds = 24 minutes totales. Cal bike: 15 cal en 35-40 sec max. Wall ball: 15 unbroken obligatoire. TTB: 10 en 2 sets max (6-4). Si tu dépasses 2:30 sur un round, scale immédiatement les reps. Le but: accumuler 8 rounds parfaits avec récup minimale mais réelle. Semaine 4 = test de la capacité à répéter haute intensité avec gestion du temps.' },
  gym: { name: 'Skill: Muscle-up Complet', drills: ['Ring muscle-up avec band: 5 x 2, focus dip profond', 'Ring muscle-up strict: 3 x 1-3 si possible, force pure', 'Bar muscle-up kipping: 5 x 2-3, timing parfait', 'Muscle-up transition drill: 5 x 5, focus passage au-dessus'] },
  scaled: { movements: [{name: 'Calories Assault Bike', reps: 10, note: '→ sprint mais volume adapté'}, {name: 'Wall Ball', reps: 12, note: '→ balle légère unbroken'}, {name: 'Hanging Knee Raise', reps: 10, note: '→ knees to chest, kipping'}], note: 'Scaled EMOM: objectif 45+ secondes de récupération par round.' },
  rxPlus: { note: 'RX+ : 20 cal bike / 20 wall ball / 15 TTB en moins de 2:20 avec 40 sec de récup. 8 rounds identiques.' }
},
{
  day: 20, week: 4, name: 'PHANTOM', theme: 'AMRAP Technique Long',
  haltero: { name: 'Front Squat', desc: 'Semaine 4: triples lourds. Coudes hauts, barre sur les clavicules, squat complet. Montée depuis le bas sans bounce. Tempo: 2 sec descent, 0 pause, drive explosif.', scheme: 'E3MOM 15min — 5 sets x 3 reps @ 75-80% 1RM', weights: 'front_squat' },
  wod: { name: 'PHANTOM', type: 'AMRAP 28', movements: [{name: 'Run 400m', reps: 1, special: 'run_400'}, {name: 'KB Swing', reps: 15, gymnastics: 'kb_swing'}, {name: 'HSPU', reps: 10, gymnastics: 'hspu'}, {name: 'Double Unders', reps: 30, gymnastics: 'double_unders'}], notes: 'AMRAP 28 minutes: capacité aérobie longue durée. Cible élite: 6-7 rounds. Run 400m: pace conversationnel mais soutenu, 1:50-2:10 selon niveau. KB swing américain: 15 reps unbroken, hips à fond. HSPU: 5-5 ou 10 unbroken — en phase 4 tu devrais tenir 10 unbroken. DU 30: unbroken systématiquement. Ce WOD teste la durabilité: 28 min de travail mixte exige une gestion précise du cardio. Jamais accélérer le 400m — c\'est la tentation principale. Comparé à BEDROCK (semaine 1) et FORTRESS (semaine 2) — est-ce que tu notes le progrès?' },
  gym: { name: 'Skill: Snatch Complex Drill', drills: ['Snatch pull: 4 x 4 reps, timing du pull du sol à la hanche', 'Hang power snatch: 4 x 3, catch en quarter squat', 'Snatch balance: 4 x 3, vitesse du descent', 'Power snatch complet: 4 x 2, intégration de tous les éléments'] },
  scaled: { movements: [{name: 'Run 400m', reps: 1, note: '→ marche rapide ou réduit à 200m'}, {name: 'KB Swing', reps: 12, note: '→ swing russe 16/12kg'}, {name: 'Pike Push-up', reps: 10, note: '→ jambes sur box pour HSPU'}, {name: 'Double Unders', reps: 20, note: '→ ou 40 singles'}], note: 'Scaled AMRAP 28: l\'endurance prime, ne jamais s\'arrêter plus de 20 sec.' },
  rxPlus: { note: 'RX+ : run 800m, KB swing 32/24kg, 15 strict HSPU, DU 50 unbroken.' }
},
{
  day: 21, week: 5, name: 'OLYMPUS', theme: 'Test Benchmark Haltéro',
  haltero: { name: 'Squat Clean', desc: 'Semaine 5: premier test de force. Montée à 85-90% 1RM possible. 1 rep par set sur les derniers sets. Focus: la réception doit être parfaite même lourd. Ne jamais forward lean excessif.', scheme: 'Rampe 10min: 3-2-2-1-1-1 avec montée progressive jusqu\'à 85-90% 1RM', weights: 'squat_clean' },
  wod: { name: 'OLYMPUS', type: 'For Time (cap 22min)', movements: [{name: 'Thruster', reps: 21, weight: 'thruster'}, {name: 'Pull-ups', reps: 21, gymnastics: 'pullups'}, {name: 'Run 400m', reps: 1, special: 'run_400'}, {name: 'Thruster', reps: 15, weight: 'thruster'}, {name: 'Pull-ups', reps: 15, gymnastics: 'pullups'}, {name: 'Run 400m', reps: 1, special: 'run_400'}, {name: 'Thruster', reps: 9, weight: 'thruster'}, {name: 'Pull-ups', reps: 9, gymnastics: 'pullups'}, {name: 'Run 400m', reps: 1, special: 'run_400'}], notes: 'Fran + Run: le classique revisité. Cible élite: sous 16 minutes. 21 thrusters: 12-9 ou 11-10, jamais unbroken sauf élite absolu. 21 pull-ups: butterfly 15-6 ou 10-7-4. Run 400m: récupération active, 2:00-2:15. 15 thrusters: 8-7. 15 pull-ups: 8-7 ou 15 unbroken si tu te sens bien. Run 400m: légèrement plus vite. 9 thrusters + 9 pull-ups: SPRINT FINAL, tout ce qui reste. Le run final = donner tout. En semaine 5, tu dois sentir la différence avec semaine 1.' },
  gym: { name: 'Skill: Handstand Walk Distance', drills: ['HS walk mur: aller-retour 2m x 5, pieds détachés du mur', 'HS walk libre: 5 tentatives de max distance en ligne droite', 'HS walk avec obstacle: passer au-dessus d\'un objet 10cm', 'HS walk 10m: benchmark week 5 — noter le temps'] },
  scaled: { movements: [{name: 'Thruster', reps: 21, note: '→ 70% RX weight'}, {name: 'Ring Row', reps: 21, note: '→ ou pull-up avec élastique épais'}, {name: 'Run 400m', reps: 1, note: '→ maintenir même allure chaque run'}, {name: 'Thruster', reps: 15, note: '→ même charge'}, {name: 'Ring Row', reps: 15, note: '→'}, {name: 'Run 400m', reps: 1, note: '→'}, {name: 'Thruster', reps: 9, note: '→ sprint final'}, {name: 'Ring Row', reps: 9, note: '→ sprint'}, {name: 'Run 400m', reps: 1, note: '→ sprint complet'}], note: 'Scaled: Fran-run accessible, maintenir la structure 21-15-9.' },
  rxPlus: { note: 'RX+ : thrusters +7kg, pull-ups remplacés par bar muscle-ups. Run à 4:00/km minimum.' }
},
{
  day: 22, week: 5, name: 'GLADIATOR', theme: 'AMRAP Test Semaine 5',
  haltero: { name: 'Push Press', desc: 'Semaine 5: test de force sur le push press. Montée progressive avec sets de descente de reps. Focus sur le lockout overhead impeccable et la stabilité du tronc.', scheme: 'Rampe 12min: 5-4-3-2-1-1 jusqu\'à 85% 1RM', weights: 'push_press' },
  wod: { name: 'GLADIATOR', type: 'AMRAP 20', movements: [{name: 'Calories Row', reps: 15, special: 'row_cal'}, {name: 'Power Clean', reps: 8, weight: 'power_clean'}, {name: 'Box Jump', reps: 12, gymnastics: 'box_jump'}, {name: 'Toes-to-Bar', reps: 12, gymnastics: 'toes_to_bar'}], notes: 'Cible élite: 7-9 rounds en 20 minutes. Comparer avec IGNITION semaine 1 (même durée, structure similaire) — tu dois noter une amélioration claire. Row: 15 cal à rythme soutenu mais contrôlé, 30-35 sec. Power clean 8 reps: 5-3 ou 8 unbroken si possible, charge modérée. Box jump: step-down, 1 saut/3 sec. TTB: 8-4 ou 12 unbroken. Stratégie: ne jamais t\'arrêter entre les mouvements — la transition est l\'ennemi. Mesure le progrès: nombre de rounds, temps de completion, récupération entre rounds.' },
  gym: { name: 'Skill: TTB Unbroken Volume', drills: ['TTB 10 unbroken: 5 séries avec 30 sec repos', 'TTB 15 unbroken: 3 séries avec 45 sec repos', 'TTB 20 unbroken: 2 tentatives, benchmark semaine 5', 'TTB Fran: 21-15-9 TTB for time — note ton temps'] },
  scaled: { movements: [{name: 'Calories Row', reps: 12, note: '→ même pace, volume adapté'}, {name: 'Power Clean', reps: 6, note: '→ 60% 1RM, focus technique'}, {name: 'Box Step-up', reps: 10, note: '→ alternance jambes'}, {name: 'Hanging Knee Raise', reps: 10, note: '→ knees à la poitrine'}], note: 'Scaled AMRAP 20: objectif 8+ rounds avec mouvements adaptés.' },
  rxPlus: { note: 'RX+ : 20 cal row / 10 clean +5kg / 15 box jump (box haute) / 15 TTB. Objectif 6+ rounds.' }
},
{
  day: 23, week: 5, name: 'VORTEX', theme: 'Chipper Test',
  haltero: { name: 'Overhead Squat', desc: 'Semaine 5: test de mobilité et force sur OHS. Tentative sur 75-80% 1RM pour des sets de 2. La posture doit être irréprochable même lourd — c\'est le test de la mobilité construite en phase base.', scheme: 'Rampe 10min: 5-3-2-2-1 jusqu\'à 75-80% 1RM', weights: 'overhead_squat' },
  wod: { name: 'VORTEX', type: 'For Time (cap 30min)', movements: [{name: 'Double Unders', reps: 200, gymnastics: 'double_unders'}, {name: 'Deadlift', reps: 40, weight: 'deadlift'}, {name: 'Wall Ball', reps: 40, gymnastics: 'wall_ball'}, {name: 'Pull-ups', reps: 30, gymnastics: 'pullups'}, {name: 'Burpee', reps: 20, gymnastics: 'burpee'}, {name: 'Thruster', reps: 15, weight: 'thruster'}, {name: 'Calories Assault Bike', reps: 30, special: 'assault_bike'}], notes: 'Chipper de test semaine 5. Volume total élevé. Cible élite: sous 22 minutes. 200 DU: sets de 50-50-50-50 ou 100-100 si possible. DL 40: sets de 10, dos parfait, never rush. WB 40: 10-10-10-10. Pull-ups 30: butterfly 10-10-10. Burpees 20: pace constant 12/min. Thrusters 15: 8-7 ou 15 unbroken si tank encore plein. Bike 30 cal: dernier sprint, TOUT DONNER. Compare avec TEMPEST (semaine 2): même structure chipper — cherche l\'amélioration.' },
  gym: { name: 'Skill: Rope Climb Efficiency', drills: ['Rope climb J-hook: 5 montées avec chrono, noter les temps', 'Rope climb legless: 3 montées pour les élites', 'Rope climb descent sans mains: 2 descentes contrôlées pieds seuls', 'Rope climb relay: 10 montées totales for time, benchmark'] },
  scaled: { movements: [{name: 'Double Unders', reps: 120, note: '→ ou 200 singles'}, {name: 'Deadlift', reps: 28, note: '→ 70% RX, dos droit priorité'}, {name: 'Wall Ball', reps: 28, note: '→ balle plus légère'}, {name: 'Pull-ups', reps: 20, note: '→ ou ring rows'}, {name: 'Burpee', reps: 15, note: '→ step-out si nécessaire'}, {name: 'Thruster', reps: 10, note: '→ 70% RX'}, {name: 'Calories Assault Bike', reps: 20, note: '→ sprint identique'}], note: 'Scaled: réduire volumes de 30%, maintenir la structure du chipper.' },
  rxPlus: { note: 'RX+ : DU 300, DL +10kg, WB +2kg balle, 40 pull-ups butterfly, thrusters +7kg, bike 40 cal.' }
},
{
  day: 24, week: 5, name: 'NEMESIS', theme: 'Intervals Test',
  haltero: { name: 'Hang Clean', desc: 'Semaine 5: complexe technique sous fatigue. 3 hang clean suivis immédiatement de 3 front squat = un set. Développe la capacité à enchaîner les mouvements lourds.', scheme: 'E3MOM 15min — 5 sets x (3 hang clean + 3 front squat) @ 70-75% 1RM', weights: 'hang_clean' },
  wod: { name: 'NEMESIS', type: '8 Rounds For Time (cap 20min)', movements: [{name: 'Calories Ski Erg', reps: 12, special: 'ski_erg'}, {name: 'KB Swing', reps: 12, gymnastics: 'kb_swing'}, {name: 'HSPU', reps: 8, gymnastics: 'hspu'}, {name: 'Run 200m', reps: 1, special: 'run_200'}], notes: 'Intervals de 4 mouvements sur 8 rounds. Cible élite: sous 18 minutes = 2:15 par round max. Ski 12 cal: 30-35 secondes, tirer des hanches fort. KB swing américain: 12 unbroken obligatoire. HSPU: 8 reps en 2 sets max (5-3). Run 200m: sprint réel, 45-55 secondes. Le 200m est ta récupération active — pace plus vite que confortable mais pas maximal. Semaine 5 = tu dois sentir l\'adaptation: le même effort demande moins de récupération qu\'en semaine 1. Note ton temps, compare dans 5 semaines.' },
  gym: { name: 'Skill: Gymnastic Flow', drills: ['Pull-up + dip ring enchaîné: 3 x 5 chaque, flux continu', 'HSPU + hand walk: 3 x (5 HSPU + 5m marche), coordination', 'TTB + box jump enchaîné: 3 x (10 TTB + 5 box jump), transition', 'Gymnastic circuit: 5 pull-up + 5 dip + 5 TTB x 5 rounds, for time'] },
  scaled: { movements: [{name: 'Calories Ski Erg', reps: 8, note: '→ sprint identique, volume réduit'}, {name: 'KB Swing', reps: 10, note: '→ swing russe 16/12kg'}, {name: 'Pike Push-up', reps: 8, note: '→ sur box pour simuler HSPU'}, {name: 'Run 200m', reps: 1, note: '→ même effort relatif'}], note: 'Scaled: 8 rounds identiques, adapter les charges. Régularité = succès.' },
  rxPlus: { note: 'RX+ : 15 cal ski / 15 KB swing 32/24kg / 10 strict HSPU / 400m run. 8 rounds sous 22 min.' }
},
{
  day: 25, week: 5, name: 'PHOENIX', theme: 'AMRAP Bilan Phase 1',
  haltero: { name: 'Back Squat', desc: 'Bilan de la phase BASE: montée à 80-85% 1RM pour des doubles. Comparer avec le jour 1 (65-70%). L\'amélioration doit être notable. Chaque rep = qualité absolue, descent contrôlée, drive explosif.', scheme: 'Rampe 15min: 5-5-4-3-2-1-1 jusqu\'à 82-85% 1RM', weights: 'back_squat' },
  wod: { name: 'PHOENIX', type: 'AMRAP 30', movements: [{name: 'Run 400m', reps: 1, special: 'run_400'}, {name: 'Thruster', reps: 10, weight: 'thruster'}, {name: 'Pull-ups', reps: 10, gymnastics: 'pullups'}, {name: 'Double Unders', reps: 30, gymnastics: 'double_unders'}], notes: 'WOD de clôture phase BASE/ACCUMULATION. 30 minutes = test complet de ta base aérobie construite en 5 semaines. Cible élite: 8-10 rounds. Compare avec BEDROCK (semaine 1) et FORTRESS (semaine 2): même structure 30 min. Run: pace soutenu et constant, 1:50-2:05 par 400m. Thrusters 10: unbroken systématiquement en phase 1. Pull-ups 10: unbroken systématiquement. DU 30: unbroken systématiquement. Si tu maintiens tout unbroken, c\'est le signe que la PHASE BASE a fonctionné. Après ce WOD, note tes scores: rounds, temps par round, sensations. Ces données guideront la Phase 2 (Développement).' },
  gym: { name: 'Skill: Bilan Benchmarks Phase 1', drills: ['Max pull-ups unbroken: 1 tentative, noter le score', 'Max HSPU strict: 1 tentative, noter le score', 'Max DU unbroken: 1 tentative, noter le score', 'Handstand walk max distance: 1 tentative, noter en mètres'] },
  scaled: { movements: [{name: 'Run 400m', reps: 1, note: '→ ou 250m si cardio encore limité'}, {name: 'Thruster', reps: 8, note: '→ 70% RX, unbroken priorité'}, {name: 'Ring Row', reps: 10, note: '→ ou pull-up assisté'}, {name: 'Double Unders', reps: 20, note: '→ ou 40 singles unbroken'}], note: 'Scaled AMRAP 30 final: évaluer les progrès depuis le jour 1. Tout doit se sentir plus facile.' },
  rxPlus: { note: 'RX+ : 800m run, 15 thrusters +5kg, 15 muscle-ups ring, 50 DU. Objectif 5+ rounds. Bilan élite de la phase.' }
},
{
  day: 26, week: 6, name: 'TITAN-II', theme: 'Force/Volume — Hang Clean + Interval Sprint',
  haltero: { name: 'Hang Clean Heavy', desc: 'Hang Clean 2-2-2-2-2 @80-85% — Réception franche, coudes hauts, tirage vertical', scheme: 'E2MOM 10min — Build lourd', weights: 'hang_clean' },
  wod: { name: 'TITAN-II', type: '5 Rounds For Time (cap 20min)', movements: [
    {name: 'Hang Cleans', reps: 8, weight: 'hang_clean'},
    {name: 'Box Jumps', reps: 12, gymnastics: 'box_jump'},
    {name: 'Cal Row', reps: 15, special: 'row_cal'}
  ], notes: 'Phase Force/Volume S6: les Hang Cleans restent à 70-75% du 1RM (légèrement en dessous du travail haltéro). Stratégie: rounds 1-2 en touch-and-go si possible par groupes de 4+4, rounds 3-5 en singles si la barre sort du chemin. Box Jumps step-down dès le round 2 pour ménager les ischio-jambiers. Row 15 cal à 1:50-1:55/500m, ne sprintez pas. Transitions rapides = gagnez 5s par round. Élite sub 14min, Avancé sub 18min. Chalk obligatoire dès le round 1.' },
  gym: { name: 'Skill: Toes-to-bar Efficiency', drills: ['3x10 Kipping TTB unbroken', '3x5 Strict TTB (amplitude complète)', '3x15 V-ups (activation core)', '2min Max TTB unbroken attempt'] },
  scaled: { movements: [{name: 'Hang Cleans', reps: 8, note: '→ 6 reps ou 70% du poids RX'}, {name: 'Box Jumps', reps: 12, note: '→ Step-ups 50cm ou box 55cm'}], note: 'Scaling S6: Cleans accessibles pour maintenir touch-and-go sur les 3 premiers rounds. Step-ups si genou douloureux.' },
  rxPlus: { note: 'RX+: Hang Cleans = Hang Squat Cleans, Box Jumps 80/65cm, Row 18/15 cal. Target sub 13min.' }
},
{
  day: 27, week: 6, name: 'CRUSHER', theme: 'Force/Volume — Thruster + Chipper Pyramidal',
  haltero: { name: 'Thruster Lourd', desc: 'Thruster 5-5-3-3-1 @78-85% — Dip vertical strict, lockout total overhead', scheme: '14min — Ascending heavy', weights: 'thruster' },
  wod: { name: 'CRUSHER', type: '1-2-3-4-5-4-3-2-1 Pyramid For Time (cap 18min)', movements: [
    {name: 'Thrusters', reps: '1→5→1', weight: 'thruster'},
    {name: 'Rope Climbs', reps: '1→5→1', gymnastics: 'rope_climb'}
  ], notes: 'Pyramid 1-2-3-4-5-4-3-2-1: 25 Thrusters + 25 Rope Climbs au total. Phase montante: conservez-vous, n\'épuisez pas les épaules. Sommet (round 5+5): Thrusters unbroken, Rope Climbs technique J-hook efficace. Phase descendante: accélérez progressivement — chaque round devient plus court. Thrusters à 70-75% pour maintenir unbroken. Rope Climbs = 3 tractions max par montée. Élite sub 11min, Avancé sub 15min.' },
  gym: { name: 'Skill: Ring Dips Weighted', drills: ['3x5 Ring Dips weighted (5-10kg vest)', '3x8 Strict Bar Dips', '3x10 Push-ups deficit (plates)', '3x15 Tricep Pushdowns banded'] },
  scaled: { movements: [{name: 'Thrusters', note: '→ 65% du poids RX ou goblet thruster KB'}, {name: 'Rope Climbs', note: '→ 3x Ring Rows par montée ou Pull-ups x5 banded'}], note: 'Scaling pyramid: garder le schème 1-2-3-4-5-4-3-2-1. Réduire uniquement la charge et le mode du movement.' },
  rxPlus: { note: 'RX+: Thrusters +10% du poids RX, Rope Climbs legless. Target sub 10min.' }
},
{
  day: 28, week: 6, name: 'OBLIVION', theme: 'Force/Volume — Deadlift + AMRAP Intense',
  haltero: { name: 'Deadlift Peak S6', desc: 'Deadlift 5x3 @85% — Concentrique explosif, excentrique contrôlé 2s. Verrouillage thoracique absolu', scheme: 'E3MOM 15min — Lourd', weights: 'deadlift' },
  wod: { name: 'OBLIVION', type: 'AMRAP 18', movements: [
    {name: 'Deadlifts', reps: 9, weight: 'deadlift'},
    {name: 'Double Unders', reps: 36, gymnastics: 'double_unders'},
    {name: 'Bar Muscle-ups', reps: 3, gymnastics: 'muscle_ups_bar'},
    {name: 'Burpees', reps: 6, gymnastics: 'burpee'}
  ], notes: 'AMRAP 18min — après 5x3 DL à 85%, la barre du WOD sera à 65-70%: restez là. Stratégie: DL 9 = 3-3-3 strict (dos neutre, chalk permanent), DU 36 = unbroken ou 18-18, BMU 1-2 répétitions unbroken (focus: kip précis + poitrine à la barre), Burpees rapides pour fermer le round. Chaque round cible ~3min. Grip = facteur limitant principal: serrez la barre différemment entre les reps. Élite 6+ rounds, Avancé 4+ rounds.' },
  gym: { name: 'Skill: Strict Gymnastics Volume', drills: ['3x5 Strict C2B Pull-ups lents', '3x5 Strict Ring Dips (pause bas)', '3x8 Strict HSPU ou pike HSPU', '3x10 Hollow Body Rocks'] },
  scaled: { movements: [{name: 'Deadlifts', reps: 9, note: '→ 6 reps ou 70% du poids RX'}, {name: 'Bar Muscle-ups', reps: 3, note: '→ 6 C2B Pull-ups ou 9 kipping Pull-ups'}], note: 'Scaling AMRAP: DL accessibles pour maintenir 9 reps/round sur 18min. BMU = toujours remplacer par C2B ou Pull-ups.' },
  rxPlus: { note: 'RX+: DL touch-and-go strict, BMU strict (no kip), DU 45, Burpees = box jump over. Target 7+ rounds.' }
},
{
  day: 29, week: 6, name: 'STORM', theme: 'Force/Volume — Front Squat + Chipper Lourd',
  haltero: { name: 'Front Squat Lourd', desc: 'Front Squat 5x2 @85-90% — Descent contrôlé, drive des coudes, amplitude complète', scheme: 'E3MOM 15min — Near-max', weights: 'front_squat' },
  wod: { name: 'STORM', type: 'For Time (cap 22min)', movements: [
    {name: 'Front Squats', reps: 30, weight: 'front_squat'},
    {name: 'KB Swings', reps: 40, gymnastics: 'kb_swing'},
    {name: 'Wall Balls', reps: 50, gymnastics: 'wall_ball'},
    {name: 'Cal Assault Bike', reps: 40, special: 'assault_bike'}
  ], notes: 'Chipper lourd 4 mouvements — jambes et poumons au maximum. FS en sets de 5 (pas plus: dos neutre, coudes hauts). KB Swings américains unbroken 15-15-10. Wall Balls 10-10-10-10-10 — hauteur cible obligatoire. Bike en finish line: ne ménagez plus rien. Phase Force/Volume = volume accru intentionnel. 120 reps de jambes + 40 cal. Élite sub 16min, Avancé sub 20min.' },
  gym: { name: 'Skill: Box Jump Plyométrie', drills: ['3x5 Box Jump hauteur max', '3x10 Box Jump Overs (rebond)', '3x8 Seated Box Jump (explosivité)', '3x12 Step-ups weighted DB'] },
  scaled: { movements: [{name: 'Front Squats', reps: 30, note: '→ 20 reps ou 65% du poids RX'}, {name: 'Wall Balls', reps: 50, note: '→ 35 reps ou 4/3 kg'}, {name: 'Cal Assault Bike', reps: 40, note: '→ 30 cal'}], note: 'Scaling chipper lourd: réduire le volume de 30% sur 2 mouvements maximum. Garder KB Swings identiques.' },
  rxPlus: { note: 'RX+: FS @75% (lourd), KB 32/24kg américains, WB 9/6kg, Bike 50/40 cal. Target sub 15min.' }
},
{
  day: 30, week: 6, name: 'NEMESIS-II', theme: 'Force/Volume — Snatch + Sprint Couplet',
  haltero: { name: 'Snatch Heavy S6', desc: 'Snatch 3-2-2-1-1-1 @78-88% — Tirage haut, troisième tirage agressif, réception stable', scheme: '16min — Build to max', weights: 'snatch' },
  wod: { name: 'NEMESIS-II', type: '3 Rounds For Time (cap 12min)', movements: [
    {name: 'Power Snatches', reps: 10, weight: 'snatch'},
    {name: 'HSPU', reps: 15, gymnastics: 'hspu'}
  ], notes: 'Couplet explosif 3 rounds — court mais d\'une intensité maximale. Snatches à 65-70% pour maintenir la qualité technique (touch-and-go rounds 1-2, singles acceptés round 3). HSPU: kipping pour les round 1-2 (7-8 unbroken), round 3 = tout donner. La récupération entre les rounds ne doit pas dépasser 30s. Visez un temps régulier par round — pas de sprint dès le départ qui tue le round 2. Élite sub 7min, Avancé sub 10min.' },
  gym: { name: 'Skill: Overhead Mobility Snatch', drills: ['3x5 Snatch Grip Push Press derrière nuque', '3x30s OHS hold position basse', '2x2min Banded Shoulder Distraction', '3x10 Snatch Grip Deadlift technique'] },
  scaled: { movements: [{name: 'Power Snatches', reps: 10, note: '→ 7 reps ou 55% du 1RM snatch'}, {name: 'HSPU', reps: 15, note: '→ Pike Push-ups x15 ou HSPU banded x8'}], note: 'Scaling: Snatches légers pour maintenir technique propre sur 3 rounds. HSPU → pike sur box si insuffisant.' },
  rxPlus: { note: 'RX+: Snatches squat snatch (full), HSPU strict (no kip). Target sub 6min.' }
},
{
  day: 31, week: 7, name: 'JUGGERNAUT', theme: 'Force/Volume — Back Squat + Long AMRAP',
  haltero: { name: 'Back Squat Volume S7', desc: 'Back Squat 5-5-5-3-3 @80-85% — Ascendant. Profondeur complète, barre haute, genoux en dehors', scheme: 'E3MOM 15min — Ascending', weights: 'back_squat' },
  wod: { name: 'JUGGERNAUT', type: 'AMRAP 22', movements: [
    {name: 'Wall Balls', reps: 18, gymnastics: 'wall_ball'},
    {name: 'Deadlifts', reps: 12, weight: 'deadlift'},
    {name: 'Pistols', reps: 8, gymnastics: 'pistols'},
    {name: 'Toes-to-bar', reps: 10, gymnastics: 'toes_to_bar'},
    {name: 'Cal Row', reps: 15, special: 'row_cal'}
  ], notes: 'AMRAP 22min — S7 Force/Volume, phase transmutation avancée. 5 mouvements en circuit oxydatif. Stratégie: WB 9-9 (hauteur impérative, pas de vitesse), DL 6-6 touch-and-go modéré (grip management: chalk entre chaque round), Pistols alternés 4/jambe (box pistols si mobilité insuffisante), TTB 5-5 (expirez à chaque rep), Row 15/12 cal à 1:55/500m. Temps de round cible ~4:15 = 5+ rounds cible. Régularité = performance. Élite 6+ rounds, Avancé 4-5.' },
  gym: { name: 'Skill: Kipping HSPU Volume', drills: ['3x Max Kipping HSPU unbroken', '3x5 Strict HSPU (contrôle)', '3x8 Pike HSPU pieds sur box', '3x10 DB Push Press strict'] },
  scaled: { movements: [{name: 'Wall Balls', reps: 18, note: '→ 12 reps ou 4/3 kg'}, {name: 'Pistols', reps: 8, note: '→ 8 Box Pistols ou 12 Goblet Squats'}, {name: 'Toes-to-bar', reps: 10, note: '→ Knees-to-chest ou 15 V-ups'}], note: 'Scaling AMRAP 22min: adapter 2 mouvements maximum. Conserver la structure 5 stations = intention du WOD maintenue.' },
  rxPlus: { note: 'RX+: WB 9/6kg, DL +10% du poids, Pistols sur rings, TTB strict, Row 20/15 cal. Target 6+ rounds.' }
},
{
  day: 32, week: 7, name: 'WARLORD-II', theme: 'Force/Volume — Power Clean + EMOM Rotatif',
  haltero: { name: 'Power Clean Heavy S7', desc: 'Power Clean 3x5 TnG @70%, puis 5x2 @82-88% heavy singles', scheme: 'E2MOM 14min — Build lourd', weights: 'power_clean' },
  wod: { name: 'WARLORD-II', type: 'EMOM 28 (7 rounds)', movements: [
    {name: 'Min 1: Power Cleans', reps: 6, weight: 'power_clean'},
    {name: 'Min 2: Toes-to-bar', reps: 10, gymnastics: 'toes_to_bar'},
    {name: 'Min 3: Double Unders', reps: 40, gymnastics: 'double_unders'},
    {name: 'Min 4: Burpee Box Jumps', reps: 6, gymnastics: 'burpee'}
  ], notes: 'EMOM 28min — 4 stations x 7 rounds. Objectif: terminer chaque minute en 42-45s maximum (15s de repos). Power Cleans @70% du 1RM = touch-and-go 6 reps, focus sur le tirage et la réception propre. TTB 10 unbroken = expirez à chaque rep, balancez les épaules. DU 40 = relâchez les poignets, ne sautez pas trop haut. Burpee Box Jumps 6 = rapides, step-down acceptable. Si une minute déborde: réduisez 1-2 reps la semaine suivante. Élite 42s/min, Avancé 48s/min.' },
  gym: { name: 'Skill: Ring Work Avancé', drills: ['3x10 Ring Push-ups (retournement progressif)', '3x5 Ring Support Turnout hold', '3x5 Skin the Cat contrôlé', '3x30s L-sit on rings'] },
  scaled: { movements: [{name: 'Power Cleans', reps: 6, note: '→ 4 reps ou 65% du poids RX'}, {name: 'Double Unders', reps: 40, note: '→ 25 DU ou 70 Single Unders'}, {name: 'Burpee Box Jumps', reps: 6, note: '→ 4 Burpees + step-up'}], note: 'Scaling EMOM: priorité = 15s de repos par minute. Réduire les reps plutôt que de déborder sur la minute suivante.' },
  rxPlus: { note: 'RX+: Power Cleans = Hang Squat Cleans, DU 50, Burpee Box Jumps 80cm. Target 40s/min max.' }
},
{
  day: 33, week: 7, name: 'COLOSSUS-II', theme: 'Force/Volume — Clean & Jerk + Descending 21-15-9',
  haltero: { name: 'Clean & Jerk Complex S7', desc: '1 Squat Clean + 1 Push Jerk + 1 Split Jerk @80-85% — Every 90s x 10 sets', scheme: 'Every 90s x 10 — Build lourd', weights: 'clean' },
  wod: { name: 'COLOSSUS-II', type: '21-15-9 For Time (cap 14min)', movements: [
    {name: 'Squat Cleans', reps: '21-15-9', weight: 'squat_clean'},
    {name: 'Ring Muscle-ups', reps: '7-5-3', gymnastics: 'muscle_ups_ring'}
  ], notes: 'Couplet classique décroissant avec un ratio 3:1. Squat Cleans à 65-70% (pas lourds: les épaules ont déjà travaillé). Round 21: cleans par groupes de 7-7-7, Ring MU par 2-2-2-1. Round 15: cleans 8-7, MU 2-2-1. Round 9: tout donner en unbroken si possible. Ring MU = technique de transition poitrine-hanches, pas de force brute. Respirez en haut après chaque MU. Élite sub 9min, Avancé sub 12min.' },
  gym: { name: 'Skill: Clean Technique Avancée', drills: ['3x5 Hang Muscle Clean (lent)', '3x3 Tall Clean (sans élan)', '3x5 Clean depuis blocks genoux', '3x5 Front Squat pause 2s en bas'] },
  scaled: { movements: [{name: 'Squat Cleans', note: '→ Power Cleans ou 60% du poids RX'}, {name: 'Ring Muscle-ups', reps: '7-5-3', note: '→ 14-10-6 C2B Pull-ups ou 21-15-9 kipping Pull-ups'}], note: 'Scaling: garder le schème décroissant 7-5-3 sur les MU. Ring MU → C2B ou pull-ups selon niveau.' },
  rxPlus: { note: 'RX+: Squat Cleans @75% 1RM, Ring MU strict. Target sub 8min.' }
},
{
  day: 34, week: 7, name: 'DESTROYER', theme: 'Force/Volume — OHS + Labyrinth Long',
  haltero: { name: 'Overhead Squat Max S7', desc: 'OHS 5-3-3-1-1-1 @78-88% — Depuis rack. Prise large, scapulaires actives, regard neutre. Max attempt final', scheme: '16min — Max attempt', weights: 'overhead_squat' },
  wod: { name: 'DESTROYER', type: 'For Time (cap 25min)', movements: [
    {name: 'OHS', reps: 15, weight: 'overhead_squat'},
    {name: 'Pull-ups', reps: 30, gymnastics: 'pullups'},
    {name: 'OHS', reps: 12, weight: 'overhead_squat'},
    {name: 'Double Unders', reps: 60, gymnastics: 'double_unders'},
    {name: 'OHS', reps: 9, weight: 'overhead_squat'},
    {name: 'Rope Climbs', reps: 6, gymnastics: 'rope_climb'}
  ], notes: 'Structure alternance OHS + cardio/gymnastics: OHS descend (15-12-9), cardio monte (Pull-ups-DU-Rope Climbs). OHS à 55-60% pour maintenir la qualité overhead — les épaules seront fatiguées après le haltéro lourd. Pull-ups kipping 10-10-10. DU unbroken ou 30-30. Rope Climbs J-hook 2 tractions. Restez stable en position overhead: si vous perdez le verrouillage, déposez. Élite sub 18min, Avancé sub 23min.' },
  gym: { name: 'Skill: Overhead Stability Profonde', drills: ['3x30s KB Overhead Hold single arm chaque côté', '3x5 Sots Press léger', '3x8 Snatch Balance (réception rapide)', '2x1min OHS hold position basse banded'] },
  scaled: { movements: [{name: 'OHS', reps: 15, note: '→ 10 reps ou Front Squat si mobilité insuffisante'}, {name: 'Rope Climbs', reps: 6, note: '→ 4 Rope Climbs ou 20 Ring Rows strictes'}], note: 'Scaling: OHS → Front Squat si overhead instable. Rope Climbs → Ring Rows si corde indisponible. DU → 120 SU.' },
  rxPlus: { note: 'RX+: OHS depuis le sol (snatch grip), Rope Climbs legless, Pull-ups C2B. Target sub 17min.' }
},
{
  day: 35, week: 7, name: 'BEHEMOTH', theme: 'Force/Volume — Hero WOD Style + Sumo DL',
  hero: true,
  haltero: { name: 'Sumo DL High Pull S7', desc: 'SDLHP 4x6 ascendant @78% — Explosivité hanches, coudes hauts au-dessus des épaules', scheme: 'E2MOM 8min', weights: 'deadlift' },
  wod: { name: 'BEHEMOTH', type: '4 Rounds For Time (cap 24min)', movements: [
    {name: 'Sumo DL High Pulls', reps: 12, weight: 'deadlift'},
    {name: 'Box Jumps', reps: 15, gymnastics: 'box_jump'},
    {name: 'HSPU', reps: 10, gymnastics: 'hspu'},
    {name: 'KB Swings', reps: 20, gymnastics: 'kb_swing'},
    {name: 'Cal Assault Bike', reps: 20, special: 'assault_bike'}
  ], notes: 'HERO WOD style: 4 rounds, 5 mouvements, 24min cap. Volume total élevé = 48 SDLHP + 60 Box Jumps + 40 HSPU + 80 KB + 80 cal. Stratégie: SDLHP @70% touch-and-go, coudes hauts impératif. Box Jumps step-down dès round 2. HSPU kipping 5-5 (ou 4-3-3). KB américains 10-10. Bike = finissez chaque round en sprint 45-50s. Objectif: rounds réguliers <5:30. Élite sub 19min, Avancé sub 23min.' },
  gym: { name: 'Skill: KB Mastery Avancé', drills: ['3x10 KB Turkish Get-up alternant', '3x12 KB Goblet Squat deep', '3x10 KB Single Arm Swing chaque côté', '3x8 KB Snatch chaque bras'] },
  scaled: { movements: [{name: 'SDLHP', reps: 12, note: '→ 8 reps ou remplacer par KB SDLHP'}, {name: 'HSPU', reps: 10, note: '→ 7 Pike Push-ups ou HSPU banded'}, {name: 'Cal Assault Bike', reps: 20, note: '→ 15 cal ou remplacer par Row'}], note: 'Scaling Hero: réduire 2 mouvements. Box Jumps = step-ups. Ne jamais réduire les 4 rounds — l\'intention Hero = aller jusqu\'au bout.' },
  rxPlus: { note: 'RX+: SDLHP = barre plus lourde +15%, HSPU strict, KB 32/24kg, Box Jumps 80/65cm, Bike +5cal. Target sub 20min.' }
},
{
  day: 36, week: 8, name: 'ECLIPSE', theme: 'Déload S2 — Clean Technique + Volume Réduit', deload: true,
  haltero: { name: 'Clean Complex Léger', desc: '1 Power Clean + 2 Front Squats @65% — Technique prioritaire. Chaque rep impeccable, pas de rush', scheme: 'E2MOM 10min — Volume réduit', weights: 'clean' },
  wod: { name: 'ECLIPSE-LIGHT', type: '20-15-10-5 For Time (cap 14min)', movements: [
    {name: 'Double Unders', reps: '60-45-30-15', gymnastics: 'double_unders'},
    {name: 'Wall Balls', reps: '20-15-10-5', gymnastics: 'wall_ball'},
    {name: 'Power Cleans', reps: '5-4-3-2', weight: 'power_clean'}
  ], notes: 'SEMAINE DÉLOAD S8: après 7 semaines de charges élevées, le système nerveux central doit récupérer. Volume divisé par 2, intensité à 60-65%. Chaque mouvement exécuté avec une qualité parfaite — pas de reps bâclées. DU unbroken si possible (rythme détendu). WB hauteur cible mais sans forcer. Cleans = technique parfaite, pas de vitesse. Sentez votre corps: si tout est douloureux, reposez-vous davantage. Récupération = performance future.' },
  gym: { name: 'Mobilité & Récupération Active', drills: ['5min Foam Roll dorsaux + mollets + ITB', '3x2min Hip Flexor Stretch chaque côté', '3x1min Overhead Mobility banded', '5min Easy Bike zone 1 (FC < 120)'] },
  scaled: { movements: [{name: 'Double Unders', note: '→ 120 Single Unders ou 30-22-15-8 DU'}, {name: 'Power Cleans', note: '→ 50% du poids habituel ou KB Power Clean'}], note: 'Déload: maintenez le mouvement sans pousser l\'intensité. L\'objectif est d\'activer sans fatiguer.' },
  rxPlus: { note: 'RX+ Déload: restez à @65% maximum. Ce n\'est PAS le jour d\'aller lourd.' }
},
{
  day: 37, week: 8, name: 'SPARTAN', theme: 'Déload S2 — Push Press Technique + Circuit Court', deload: true,
  haltero: { name: 'Push Press Technique Légère', desc: 'Push Press 5x3 @65% — Dip vertical strict, drive explosif des jambes, lockout complet overhead', scheme: 'E2MOM 10min — Léger', weights: 'push_press' },
  wod: { name: 'SPARTAN-LIGHT', type: '3 Rounds For Time (cap 12min)', movements: [
    {name: 'Push Press', reps: 6, weight: 'push_press'},
    {name: 'Pull-ups', reps: 8, gymnastics: 'pullups'},
    {name: 'Burpees', reps: 5, gymnastics: 'burpee'},
    {name: 'Cal Row', reps: 10, special: 'row_cal'}
  ], notes: 'DÉLOAD S8 — 3 rounds au lieu des 5-6 habituels. Chaque rep exécutée avec conscience: Push Press = dip-drive propre, Pull-ups = chin above bar strict, Burpees = position planche impeccable. Pace conversationnel — vous devez pouvoir parler pendant le WOD. L\'objectif n\'est pas le temps mais la qualité de mouvement et la récupération active. Notez vos sensations pour ajuster la prochaine phase.' },
  gym: { name: 'Skill: Strict Pull-ups Technique', drills: ['5x3 Strict Pull-ups (engagement scapulaire)', '3x8 Ring Rows (déprimer les omoplates)', '3x6 Tempo Pull-ups (4s descente contrôlée)', '3x10 Face Pulls avec bandes'] },
  scaled: { movements: [{name: 'Push Press', reps: 6, note: '→ 4 reps ou 55% du poids RX'}, {name: 'Pull-ups', reps: 8, note: '→ 5 reps banded ou 8 ring rows'}], note: 'Déload: tout accessible sans effort. Si quelque chose fait mal: arrêtez et consultez.' },
  rxPlus: { note: 'RX+ Déload: pas de plus-value ici. Restez léger. Profitez de la récupération.' }
},
{
  day: 38, week: 8, name: 'RAPTOR', theme: 'Déload S2 — Snatch Léger + Aérobie Douce', deload: true,
  haltero: { name: 'Snatch Technique Légère', desc: 'Power Snatch 5x3 @60% — Chaque rep parfaite. 3s de reset complet entre chaque. Technique > vitesse absolument', scheme: 'Every 90s x 5 — Léger', weights: 'snatch' },
  wod: { name: 'RAPTOR-LIGHT', type: '5 Rounds: 30s ON / 30s OFF — Zone 2', movements: [
    {name: 'Power Snatches', reps: 5, weight: 'snatch'},
    {name: 'Toes-to-bar', reps: 8, gymnastics: 'toes_to_bar'}
  ], notes: 'DÉLOAD S8: 30s de travail / 30s de repos x 5 rounds. Zone 2 stricte — FC cible 65-70% FCmax. Snatches: 3s de repositionnement entre chaque rep, technique parfaite est l\'unique critère de succès aujourd\'hui. TTB: expirez à chaque rep, contrôlez la descente. Si vous êtes dans le rouge: vous allez trop vite. Déload actif = activer le système sans le fatiguer. Corps et esprit se reconstruisent pendant le repos.' },
  gym: { name: 'Skill: Snatch Drills Technique', drills: ['3x5 Snatch High Pull lent (timing tirage)', '3x3 Hang Muscle Snatch (réception consciente)', '3x5 OHS pause 2s en bas (stabilité)', '5min Mobilité épaules + thoracique (band)'] },
  scaled: { movements: [{name: 'Power Snatches', reps: 5, note: '→ Hang Power Snatch @45% ou KB Snatch single arm'}, {name: 'Toes-to-bar', reps: 8, note: '→ Knees-to-chest ou Leg Raises'}], note: 'Déload: maintenez le mouvement sans forcer. L\'objectif est d\'activer les patterns moteurs sans fatigue.' },
  rxPlus: { note: 'RX+ Déload: restez à @65% max sur les snatches. Ce n\'est PAS le jour d\'aller lourd.' }
},
{
  day: 39, week: 8, name: 'FORTRESS-REBUILT', theme: 'Déload S2 — Back Squat Léger + Récupération Ciblée', deload: true,
  haltero: { name: 'Back Squat Technique Légère', desc: 'Back Squat 3x5 @65% — Descent lent 3s, explosif remontée. Focus sur la position parfaite en bas du squat', scheme: 'E3min x 3 sets — Volume réduit', weights: 'back_squat' },
  wod: { name: 'FORTRESS-REBUILT', type: 'For Time (cap 12min)', movements: [
    {name: 'Deadlifts', reps: 10, weight: 'deadlift'},
    {name: 'Handstand Walk', reps: 15, gymnastics: 'handstand_walk'},
    {name: 'Deadlifts', reps: 8, weight: 'deadlift'},
    {name: 'Handstand Walk', reps: 10, gymnastics: 'handstand_walk'}
  ], notes: 'DÉLOAD S8: DL à 60% du 1RM — chaque rep = technique parfaite, dos neutre, hip hinge complet, pas de rush entre les reps. HS Walk = focus proprioception, pas cardio. Si vous ne pouvez pas tenir 15m: faites 3x5 Wall Walks lents. Récupération active ciblée = activer les patterns sans créer de fatigue supplémentaire. Corps se consolide après 7 semaines de charge. Notez vos sensations générales: énergie, motivation, douleurs.' },
  gym: { name: 'Skill: HS Walk Technique Pure', drills: ['3x10m HS Walk contrôlé (pas de rush)', '3x5 Wall Walk lent (chaque position maintenue)', '3x10 Shoulder Taps en HS contre mur', '5min Foam Roll + étirements dorsaux complets'] },
  scaled: { movements: [{name: 'Deadlifts', reps: 10, note: '→ 50% bodyweight ou Romanian DL'}, {name: 'Handstand Walk', reps: 15, note: '→ 3x5 Wall Walk ou HS Hold 20s contre mur'}], note: 'Déload total: DL à 50% du bodyweight. Pas de HS Walk → Bear Crawl 15m. Écoutez votre corps.' },
  rxPlus: { note: 'RX+ Déload: HS Walk yeux fermés (sens proprioception). DL slow eccentric 5s par rep.' }
},
{
  day: 40, week: 8, name: 'FRAN-RETEST', theme: 'Déload S2 — Re-test Benchmark FRAN', benchmark: 'FRAN', deload: true, benchmark_retest: true,
  haltero: { name: 'Thruster Activation Légère', desc: 'Push Press 3x5 @55% + Thruster 3x3 @60% — Activation sans fatigue. Servez-vous uniquement', scheme: '8min — Activation pure', weights: 'thruster' },
  wod: { name: 'FRAN', type: 'For Time (cap 10min)', movements: [
    {name: 'Thrusters', reps: 21, weight: 'thruster'},
    {name: 'Pull-ups', reps: 21, gymnastics: 'pullups'},
    {name: 'Thrusters', reps: 15, weight: 'thruster'},
    {name: 'Pull-ups', reps: 15, gymnastics: 'pullups'},
    {name: 'Thrusters', reps: 9, weight: 'thruster'},
    {name: 'Pull-ups', reps: 9, gymnastics: 'pullups'}
  ], notes: 'RE-TEST FRAN S8: après 7 semaines de programme Force/Volume, comparez directement avec votre score de S2 (day 7). Votre Fran DOIT être plus rapide. Stratégie: 21 Thrusters unbroken — jambes d\'abord, finissez par la presse. Pull-ups kipping fluides 12-9 ou 21 unbroken. 9 = sprint absolu, réservez de l\'énergie. Respirez nasalement entre Thrusters et Pull-ups. Notez votre temps, comparez avec S2. Si pas d\'amélioration: analysez la nutrition et le sommeil.' },
  gym: { name: 'Post-FRAN Recovery Complète', drills: ['5min Foam Roll épaules + quads + ischio', '3x10 Band Face Pulls légers', '2x2min Pigeon Stretch chaque côté', '10min Easy Row zone 1 — cool down total'] },
  scaled: { movements: [{name: 'Thrusters', reps: 21, note: '→ 30/20 kg ou goblet squats avec KB'}, {name: 'Pull-ups', reps: 21, note: '→ Banded kipping ou jumping pull-ups x21'}], note: 'Scaling identique à S2. L\'objectif = battre votre temps précédent. Ne passez pas RX si ce n\'est pas encore acquis.' },
  rxPlus: { note: 'RX+ Fran: Thrusters 52/38kg (115/85lb), Pull-ups butterfly strict. Target sub 2:00.' }
},
{
  day: 41, week: 9, name: 'PHOENIX-REBORN', theme: 'Force/Volume — Squat Clean + Chipper Rebirth',
  haltero: { name: 'Squat Clean Max S9', desc: 'Squat Clean 2-2-1-1-1-1 @82-88% — E2MOM. Réception franche et basse, coudes hauts impératifs, drive sortie du trou explosif', scheme: 'E2MOM 12min — Max attempt', weights: 'squat_clean' },
  wod: { name: 'PHOENIX-REBORN', type: 'For Time (cap 26min)', movements: [
    {name: 'Cal Assault Bike', reps: 30, special: 'assault_bike'},
    {name: 'Squat Cleans', reps: 20, weight: 'squat_clean'},
    {name: 'Bar Muscle-ups', reps: 15, gymnastics: 'muscle_ups_bar'},
    {name: 'Thrusters', reps: 20, weight: 'thruster'},
    {name: 'Cal Assault Bike', reps: 30, special: 'assault_bike'}
  ], notes: 'Structure sandwich Bike-Barbell-Gymnastics-Barbell-Bike. S9 = phase Réalisation: intensité maximale. Bike ouverture: pace modéré (1:50-1:55/100m), gardez des jambes pour les cleans. Squat Cleans @65-70% par groupes de 4-5. BMU 3-3-3-3-3 (focus kip précis, poitrine à la barre). Thrusters @65% unbroken 10-10. Bike finale: SPRINT, rien dans les jambes de toute façon. Élite sub 20min, Avancé sub 25min.' },
  gym: { name: 'Skill: Bar Muscle-up Technique', drills: ['3x5 Chest-to-bar Pull-ups (grand kip)', '3x3 Glide Kip to Hip (transition)', '5x1-3 Bar MU attempts complets', '3x10 Lat Pulldowns lourd'] },
  scaled: { movements: [{name: 'Squat Cleans', reps: 20, note: '→ Power Cleans ou 60% du poids RX'}, {name: 'Bar Muscle-ups', reps: 15, note: '→ 30 C2B Pull-ups ou 45 kipping Pull-ups'}, {name: 'Cal Assault Bike', reps: 30, note: '→ 25 cal ou remplacer par Row 35/28 cal'}], note: 'Scaling S9: chipper long = gardez l\'intention. Réduire les poids et substituer les MU mais maintenez le volume global.' },
  rxPlus: { note: 'RX+: Bike 35/30 cal, Squat Cleans @75%, BMU strict, Thrusters +5kg. Target sub 19min.' }
},
{
  day: 42, week: 9, name: 'CATALYST', theme: 'Force/Volume — Deadlift + EMOM Mixte',
  haltero: { name: 'Deadlift Max S9', desc: 'Deadlift 5-3-2-2-1-1 @82-88% — Build near-max. Concentrique explosif, excentrique contrôlé. Verrouillage thoracique permanent', scheme: '16min — Build max', weights: 'deadlift' },
  wod: { name: 'CATALYST', type: 'EMOM 25 (5 rounds)', movements: [
    {name: 'Min 1: Deadlifts', reps: 8, weight: 'deadlift'},
    {name: 'Min 2: HSPU', reps: 8, gymnastics: 'hspu'},
    {name: 'Min 3: KB Swings', reps: 16, gymnastics: 'kb_swing'},
    {name: 'Min 4: Box Jumps', reps: 12, gymnastics: 'box_jump'},
    {name: 'Min 5: Cal Row', reps: 15, special: 'row_cal'}
  ], notes: 'EMOM 25min — 5 stations x 5 rounds. DL à 65-70% (après max haltéro = DL modéré dans le WOD). HSPU kipping 8 = 5+3 ou unbroken. KB 16 américains unbroken (hip drive). Box Jumps step-down rounds 3-5. Row 15/12 cal à 1:50/500m. Visez 40-42s de travail max par minute = 18-20s de repos minimum. EMOM long = discipline mentale: régularité sur 25min > sprint sur 1 round. Élite 40s/min, Avancé 45s/min.' },
  gym: { name: 'Skill: GHD Core Force', drills: ['3x20 GHD Sit-ups (pleine amplitude)', '3x15 GHD Hip Extensions', '3x10 GHD Back Extensions pause haut', '3x1min Hollow Hold parfait'] },
  scaled: { movements: [{name: 'Deadlifts', reps: 8, note: '→ 5 reps ou 65% du poids RX'}, {name: 'HSPU', reps: 8, note: '→ 5 Pike Push-ups ou HSPU banded'}, {name: 'KB Swings', reps: 16, note: '→ 12 reps ou russes 24/16kg'}], note: 'Scaling EMOM 25: priorité absolue = 15s de repos par minute. Réduire jusqu\'à ce que le repos soit garanti.' },
  rxPlus: { note: 'RX+: DL TnG strict, HSPU strict 8, KB 32/24kg américains, Box Jumps 80cm, Row 18/15 cal. Target 38s/min.' }
},
{
  day: 43, week: 9, name: 'HAVOC', theme: 'Force/Volume — Power Clean + Chipper Descendant',
  haltero: { name: 'Power Clean Clusters S9', desc: 'Power Clean clusters 1.1.1 x 8 sets @82% — 5s entre reps. Explosivité maximale à chaque tirage', scheme: 'Every 90s x 8 — Explosif', weights: 'power_clean' },
  wod: { name: 'HAVOC', type: 'For Time (cap 18min)', movements: [
    {name: 'Power Cleans', reps: 15, weight: 'power_clean'},
    {name: 'Pull-ups', reps: 30, gymnastics: 'pullups'},
    {name: 'Power Cleans', reps: 12, weight: 'power_clean'},
    {name: 'Toes-to-bar', reps: 24, gymnastics: 'toes_to_bar'},
    {name: 'Power Cleans', reps: 9, weight: 'power_clean'},
    {name: 'Burpees', reps: 18, gymnastics: 'burpee'}
  ], notes: 'Chipper à structure descendante: Cleans 15-12-9, gymnastics descendante aussi (30-24-18). La logique: chaque section se raccourcit = accélérez progressivement. Cleans @70% — groupes de 5 max (grip). Pull-ups kipping 10-10-10. TTB 8-8-8. Burpees finaux = lancez-vous au sol et relevez-vous vite, ne réfléchissez pas. Section 9 Cleans + 18 Burpees = sprint final. Élite sub 13min, Avancé sub 17min.' },
  gym: { name: 'Skill: Burpees Efficacité', drills: ['5x10 Burpees for speed (chronométré)', '3x8 Burpee Box Jump Overs', '3x6 Burpee Pull-ups enchaînés', '2x15 Burpees unbroken pace régulier'] },
  scaled: { movements: [{name: 'Power Cleans', reps: 15, note: '→ 10 reps ou 65% du poids RX'}, {name: 'Pull-ups', reps: 30, note: '→ 20 banded kipping ou 30 ring rows'}, {name: 'Toes-to-bar', reps: 24, note: '→ 16 Knees-to-chest ou V-ups'}], note: 'Scaling: garder la structure descendante. Adapter les poids et modes de mouvement mais maintenir les 3 blocs.' },
  rxPlus: { note: 'RX+: Power Cleans TnG, Pull-ups C2B, TTB strict, Burpees = box jump over 75cm. Target sub 12min.' }
},
{
  day: 44, week: 9, name: 'ATLAS-RELOADED', theme: 'Force/Volume — Front Squat + AMRAP Giant',
  haltero: { name: 'Front Squat Lourd S9', desc: 'Front Squat 3-3-2-2-1-1 @83-88% — Build near-max. Coudes hauts absolu en bas, drive explosif sortie', scheme: '15min — Build max', weights: 'front_squat' },
  wod: { name: 'ATLAS-RELOADED', type: 'AMRAP 22', movements: [
    {name: 'Front Squats', reps: 5, weight: 'front_squat'},
    {name: 'Handstand Walk', reps: 15, gymnastics: 'handstand_walk'},
    {name: 'Wall Balls', reps: 15, gymnastics: 'wall_ball'},
    {name: 'Rope Climbs', reps: 2, gymnastics: 'rope_climb'},
    {name: 'Cal Assault Bike', reps: 15, special: 'assault_bike'}
  ], notes: 'AMRAP 22min — 5 mouvements diversifiés. FS à 70-75% (lourd mais faisable x5 pendant 22min). HS Walk = récupération active entre barbell et cardio. WB 15 unbroken hauteur cible. Rope Climbs 2 = technique J-hook (2-3 tractions maximum). Bike 15 cal pace modéré ~50s. Cible: round complet toutes les 4:30 = 4+ rounds dans 22min. Grip management crucial: chalk avant chaque round. Élite 5+ rounds, Avancé 4 rounds.' },
  gym: { name: 'Skill: Rope Climb Speed', drills: ['3x3 Rope Climbs chronométrés', '3x1 Legless Rope Climb complet', '3x5 Strict Pull-ups towel grip', '3x30s Dead Hang (grip endurance)'] },
  scaled: { movements: [{name: 'Front Squats', reps: 5, note: '→ Goblet Squats ou 65% du poids RX'}, {name: 'Handstand Walk', reps: 15, note: '→ 3x5 Wall Walk ou Bear Crawl 15m'}, {name: 'Rope Climbs', reps: 2, note: '→ 6 Ring Rows strictes ou 1 Rope Climb assisté'}], note: 'Scaling AMRAP 22: FS accessibles pour maintenir x5 sur 22min. HS Walk → Wall Walk. Rope → Ring Rows.' },
  rxPlus: { note: 'RX+: FS @80%, HS Walk 20m, WB 9/6kg, Rope Climbs legless, Bike 18 cal. Target 5+ rounds.' }
},
{
  day: 45, week: 9, name: 'VENOM-I', theme: 'Force/Volume — Hang Clean + Hero WOD Style',
  hero: true,
  haltero: { name: 'Hang Squat Clean S9', desc: 'Hang Squat Clean 3x3 @80% + 3x2 @85% — Réception basse, drive des coudes, sortie active des hanches', scheme: 'E2MOM 12min — Heavy volume', weights: 'hang_clean' },
  wod: { name: 'VENOM-I', type: 'For Time (cap 22min)', movements: [
    {name: 'Run 800m', reps: 1, special: 'run_800'},
    {name: 'Hang Cleans', reps: 21, weight: 'hang_clean'},
    {name: 'Box Jumps', reps: 21, gymnastics: 'box_jump'},
    {name: 'Run 400m', reps: 1, special: 'run_400'},
    {name: 'Hang Cleans', reps: 15, weight: 'hang_clean'},
    {name: 'Toes-to-bar', reps: 15, gymnastics: 'toes_to_bar'},
    {name: 'Run 400m', reps: 1, special: 'run_400'},
    {name: 'Hang Cleans', reps: 9, weight: 'hang_clean'},
    {name: 'HSPU', reps: 9, gymnastics: 'hspu'}
  ], notes: 'HERO WOD style — Run intercalé pour tester la résilience mentale et l\'endurance oxydative. Run 800m à 80% — gardez des jambes pour les cleans. Hang Cleans @65-70% en groupes de 7. Box Jumps step-down. Run 400m à 85%. Hang Cleans 15 en 5-5-5. TTB 8-7. Run 400m sprint 90%. Derniers 9 Cleans + 9 HSPU = tout donner. Respirez profondément pendant les runs. Élite sub 17min, Avancé sub 21min.' },
  gym: { name: 'Skill: Pulling Endurance Volume', drills: ['Max Pull-ups en 5min (toutes pauses OK)', '3x8 Chest-to-bar Pull-ups kipping', '3x12 Ring Rows pieds surélevés', '3x20 Banded Pull Aparts (santé épaule)'] },
  scaled: { movements: [{name: 'Hang Cleans', reps: 21, note: '→ 15 reps ou 60% du poids RX'}, {name: 'Box Jumps', reps: 21, note: '→ Step-ups 50cm ou box 55cm'}, {name: 'HSPU', reps: 9, note: '→ Pike Push-ups x9 ou HSPU banded'}], note: 'Scaling Hero: ne jamais réduire les runs. Adapter barbell et gymnastics. L\'intention = aller jusqu\'au bout malgré la fatigue.' },
  rxPlus: { note: 'RX+: Run 800m + 600m + 400m, Hang Squat Cleans, TTB strict, HSPU strict. Target sub 16min.' }
},
{
  day: 46, week: 10, name: 'CENTURION', theme: 'Force/Volume — Back Squat + Century Challenge',
  haltero: { name: 'Back Squat Volume Culminant', desc: 'Back Squat 10-8-6-4-2 @75-85% — Ascendant. Peak de volume S10. Respirez profondément avant chaque série, bracing abdominal maximal', scheme: '15min — Volume max S10', weights: 'back_squat' },
  wod: { name: 'CENTURION', type: 'For Time (cap 25min)', movements: [
    {name: 'Thrusters', reps: 25, weight: 'thruster'},
    {name: 'Pull-ups', reps: 25, gymnastics: 'pullups'},
    {name: 'Push Press', reps: 25, weight: 'push_press'},
    {name: 'Box Jumps', reps: 25, gymnastics: 'box_jump'}
  ], notes: '100 reps total — 4 mouvements x 25. Phase finale Force/Volume S10. Thrusters @65% en groupes de 5-7. Pull-ups kipping en groupes de 5-8 selon endurance. Push Press unbroken si possible 12-13 ou 8-8-9. Box Jumps step-down après rep 15 pour ménager les ischio. Transitions rapides = économisez 20-30s. Le challenge centurion: ne poser la barre qu\'entre chaque mouvement, pas entre chaque set. Élite sub 17min, Avancé sub 22min.' },
  gym: { name: 'Skill: Explosive Power Box Jumps', drills: ['3x3 Box Jump hauteur maximale', '3x5 Depth Jumps (saut en hauteur depuis box)', '3x6 Broad Jumps (distance maximale)', '3x8 Jump Squats explosifs'] },
  scaled: { movements: [{name: 'Thrusters', reps: 25, note: '→ 20 reps ou 60% du poids RX'}, {name: 'Pull-ups', reps: 25, note: '→ 20 banded kipping ou ring rows'}, {name: 'Push Press', reps: 25, note: '→ 20 reps ou même poids que Thrusters'}], note: 'Scaling Century: réduire à 20 reps par mouvement si nécessaire (80 total). Garder les 4 mouvements = intention maintenue.' },
  rxPlus: { note: 'RX+: Thrusters @70%, Pull-ups C2B, Push Press @75%, Box Jumps 80/65cm. Target sub 15min.' }
},
{
  day: 47, week: 10, name: 'WRAITH', theme: 'Force/Volume — Snatch + Intervals Ghost',
  haltero: { name: 'Snatch Complex Peak S10', desc: '1 Snatch Deadlift + 1 Hang Snatch + 1 Full Snatch @80-86% — Chaque section est un mouvement distinct. Focus: maintenir position overhead', scheme: 'E2MOM 12min — Near-max', weights: 'snatch' },
  wod: { name: 'WRAITH', type: '10 Rounds: 1min ON / 1min OFF', movements: [
    {name: 'Power Snatches', reps: 3, weight: 'snatch'},
    {name: 'Double Unders', reps: 15, gymnastics: 'double_unders'},
    {name: 'HSPU', reps: 3, gymnastics: 'hspu'}
  ], notes: 'Intervalles ghost: 1min de travail / 1min de repos x 10 rounds. Score = rounds complétés (max 10). Dans la minute: 3 Snatches TnG @70%, 15 DU unbroken, 3 HSPU kipping. Total si complété: 30 Snatches + 150 DU + 30 HSPU. Stratégie: ne jamais rater les DU (cassage = temps perdu). Snatches singles si la barre sort du chemin. HSPU kipping efficaces. Rounds 8-10: maintenez la technique malgré la fatigue. Élite 10/10 rounds, Avancé 8-9/10.' },
  gym: { name: 'Skill: Double Under Speed Avancé', drills: ['5x50 DU for time (chronométré)', '3x20 High DU (saut plus haut)', '3x30 DU pied alternant', '1x100 DU unbroken attempt total'] },
  scaled: { movements: [{name: 'Power Snatches', reps: 3, note: '→ 2 reps ou 60% du 1RM snatch'}, {name: 'Double Unders', reps: 15, note: '→ 10 DU ou 30 Single Unders'}, {name: 'HSPU', reps: 3, note: '→ 3 Pike Push-ups ou 2 HSPU banded'}], note: 'Scaling intervals: adapter les reps pour terminer en 45-50s. Si vous débordez sur le repos: réduisez les reps.' },
  rxPlus: { note: 'RX+: Snatches = Full Snatch squat, DU 20 unbroken, HSPU strict. Target 10/10 rounds sub 45s.' }
},
{
  day: 48, week: 10, name: 'SOVEREIGN', theme: 'Force/Volume — Clean & Jerk + Royal Chipper',
  haltero: { name: 'Clean & Jerk Peak S10', desc: '1 Squat Clean + 1 Split Jerk @83-88% — Chaque levée = max effort technique. Split Jerk: réception en fente profonde, pieds alignés', scheme: 'Every 90s x 8 — Build near-max', weights: 'clean' },
  wod: { name: 'SOVEREIGN', type: 'For Time (cap 28min)', movements: [
    {name: 'Cal Row', reps: 50, special: 'row_cal'},
    {name: 'Shoulder-to-OH', reps: 30, weight: 'shoulder_to_oh'},
    {name: 'Toes-to-bar', reps: 30, gymnastics: 'toes_to_bar'},
    {name: 'Hang Cleans', reps: 20, weight: 'hang_clean'},
    {name: 'Ring Muscle-ups', reps: 10, gymnastics: 'muscle_ups_ring'},
    {name: 'Pistols', reps: 20, gymnastics: 'pistols'}
  ], notes: 'Chipper royal 6 mouvements — test complet de la phase Force/Volume. Row 50 cal = warm-up cardio intense, pace 1:55/500m. S2OH @65% en 6x5 (push jerk ou push press). TTB 10-10-10 (respirez). Hang Cleans @65% en 4-5. Ring MU 2-2-2-2-2 (focus transition hanches). Pistols alternés 10/jambe (box pistols si mobilité insuffisante). Pas de grand repos entre sections: 15-20s max. Élite sub 22min, Avancé sub 27min.' },
  gym: { name: 'Skill: Ring Dips Force', drills: ['3x8 Strict Ring Dips (amplitude complète)', '3x5 Weighted Ring Dips (+5-10kg)', '3x10 Push-ups on Rings (instabilité)', '3x15 Band Pushdowns Triceps'] },
  scaled: { movements: [{name: 'Cal Row', reps: 50, note: '→ 40 cal ou remplacer par Ski Erg 40 cal'}, {name: 'Ring Muscle-ups', reps: 10, note: '→ 20 C2B Pull-ups ou 30 kipping Pull-ups'}, {name: 'Pistols', reps: 20, note: '→ 20 Box Pistols ou 30 Goblet Squats'}], note: 'Scaling Royal Chipper: conserver les 6 mouvements = l\'essence du WOD. Adapter le mode et la charge sur 2-3 max.' },
  rxPlus: { note: 'RX+: Row 60 cal, S2OH = Split Jerk, TTB strict, Ring MU strict, Pistols sur rings. Target sub 21min.' }
},
{
  day: 49, week: 10, name: 'CRUCIBLE', theme: 'Force/Volume — Thruster + Test de Volonté',
  haltero: { name: 'Thruster Max S10', desc: 'Thruster 3-3-2-2-1-1 @83-88% — Heavy singles. Dip profond mais contrôlé, drive explosif des jambes, lockout overhead complet', scheme: '16min — Heavy singles max', weights: 'thruster' },
  wod: { name: 'CRUCIBLE', type: 'AMRAP 20', movements: [
    {name: 'Thrusters', reps: 7, weight: 'thruster'},
    {name: 'KB Swings', reps: 14, gymnastics: 'kb_swing'},
    {name: 'Burpee Box Jumps', reps: 7, gymnastics: 'burpee'},
    {name: 'Cal Row', reps: 12, special: 'row_cal'}
  ], notes: 'AMRAP 20min — test de volonté S10. Thrusters @60-65% (après max haltéro!): 7 unbroken ou 4+3. KB américains 14 unbroken (hip drive puissant). Burpee Box Jumps 7 = rapides mais step-down OK. Row 12/10 cal pace modéré 1:55/500m. Chaque round ~3:30-4min = 5+ rounds cible. Le vrai test commence après le round 4: c\'est là que la volonté prend le relais. Ne regardez pas le chrono — regardez le prochain mouvement. Élite 6+ rounds, Avancé 5 rounds.' },
  gym: { name: 'Skill: Conditioning Base Finale', drills: ['3x500m Row (repos 2min entre)', '3x1min Assault Bike sprint max cal', '2x400m Run à 85%', '3x30 Air Squats for speed (cadence)'] },
  scaled: { movements: [{name: 'Thrusters', reps: 7, note: '→ 60% du poids RX ou 5 reps'}, {name: 'KB Swings', reps: 14, note: '→ 16/12 kg russes ou 10 américains'}, {name: 'Burpee Box Jumps', reps: 7, note: '→ 5 Burpees + step-up box'}], note: 'Scaling AMRAP 20: adapter la charge pour maintenir un round toutes les 4min. Test de volonté = le volume reste élevé.' },
  rxPlus: { note: 'RX+: Thrusters @70%, KB 32/24kg américains, Burpee Box Jumps 80cm, Row 15/12 cal. Target 6+ rounds.' }
},
{
  day: 50, week: 10, name: 'OMEGA', theme: 'Force/Volume — Mixed Modal + Grand Final Phase 2',
  haltero: { name: 'Power Clean + Push Jerk Ascending', desc: '1 Power Clean + 1 Push Jerk x 10 sets @75-85% — Ascending. Chaque set plus lourd. Derniers 3 sets = near-max', scheme: 'Every 90s x 10 — Ascending heavy', weights: 'power_clean' },
  wod: { name: 'OMEGA', type: 'For Time (cap 30min)', movements: [
    {name: 'Deadlifts', reps: 30, weight: 'deadlift'},
    {name: 'HSPU', reps: 30, gymnastics: 'hspu'},
    {name: 'Wall Balls', reps: 30, gymnastics: 'wall_ball'},
    {name: 'Double Unders', reps: 100, gymnastics: 'double_unders'},
    {name: 'Power Cleans', reps: 20, weight: 'power_clean'},
    {name: 'Bar Muscle-ups', reps: 15, gymnastics: 'muscle_ups_bar'},
    {name: 'Rope Climbs', reps: 5, gymnastics: 'rope_climb'}
  ], notes: 'LE GRAND FINAL DE LA PHASE FORCE/VOLUME (S6-S10). Chipper monstre 7 mouvements — test complet de tout ce qui a été développé. DL 6x5 @70% (dos neutre, chalk). HSPU kipping 6x5 (5+5+5+5+5+5). WB 10-10-10 hauteur cible. DU 50-50 ou unbroken. Power Cleans 5x4 TnG. BMU 3-3-3-3-3. Rope Climbs 1 à la fois (repos 20s entre). Fractionnez TOUT. Aucun arrêt > 30s. Ce WOD marque la fin d\'un cycle — allez chercher ce que vous avez construit. Élite sub 24min, Avancé sub 29min.' },
  gym: { name: 'Skill: Full Body Recovery + Mobilité', drills: ['3x10 Strict Press léger (décompression épaules)', '3x10 Good Mornings (hamstrings)', '2x2min Pigeon Stretch chaque côté', '2x2min Couch Stretch chaque côté'] },
  scaled: { movements: [{name: 'Deadlifts', reps: 30, note: '→ 20 reps ou 65% du poids RX'}, {name: 'HSPU', reps: 30, note: '→ 20 Pike Push-ups ou 20 HSPU banded'}, {name: 'Bar Muscle-ups', reps: 15, note: '→ 30 C2B Pull-ups ou 45 kipping Pull-ups'}, {name: 'Rope Climbs', reps: 5, note: '→ 3 Rope Climbs ou 15 Ring Rows strictes'}], note: 'Scaling Grand Final: réduire volumes de 30% sur DL + HSPU + BMU. Maintenir les 7 mouvements = l\'identité du WOD.' },
  rxPlus: { note: 'RX+: DL TnG, HSPU strict, WB 9/6kg, DU 120, Cleans @78%, BMU strict, Rope Climbs legless. Target sub 23min.' }
},
{day:51,week:11,name:'APOCALYPSE-I',theme:'Puissance & Force Maximale',haltero:{name:'Clean & Jerk',desc:'Clean & Jerk lourd — travailler la vitesse sous la barre',scheme:'5x2 @85%',weights:'clean'},wod:{name:'APOCALYPSE-I',type:'AMRAP 18',movements:[{name:'Power Clean',reps:5,weight:'clean'},{name:'Bar Muscle-Up',reps:3,gymnastics:'muscle_ups_bar'},{name:'Assault Bike',reps:15,special:'assault_bike'}],notes:'APOCALYPSE-I marque l\'entrée en phase peak (S11-S15) — intensité maximale, récupération active requise. Contexte semaine 11 : vous avez construit 10 semaines de base, il est temps de convertir cette force en puissance exprimée sous fatigue. Power clean 75% : tirage explosif, extension hanche complète avant de tirer les coudes, ne jamais arrondir le dos même en fatigue. Bar Muscle-Up : enchaîner si possible les 3 en un set, utiliser le kip large pour économiser les épaules. Assault Bike 15 cal : partir en sprint puissant jambes-bras, objectif moins de 40 secondes par passage. Pacing AMRAP : rounds 1-2 à 85%, rounds 3-5 à 90%, round 6+ tout donner. Respiration : exhale forcé à chaque rep de clean, inspiration en montant sur le vélo. Vigilance : si le dos arrondit sur les cleans, réduire à 70% immédiatement — les lombaires ne pardonnent pas en fatigue. Scaling intelligent : Bar MU → C2B pull-ups x5 ou kipping pull-ups x7. Cible élite 7-8 rounds, RX 5-6 rounds.'},gym:{name:'Skill: Handstand Walk',drills:['Kick-up contre mur 3x10s','HS Walk contre mur latéral 5m','Free HS Walk 10m x5','Obstacle HS Walk (cone slalom)']},scaled:{movements:[{name:'Power Clean',reps:5,note:'→ 60% 1RM'},{name:'Chest-to-Bar',reps:3,note:'→ Pull-ups stricts'},{name:'Assault Bike',reps:1,note:'→ 12 cal'}],note:'Maintenir intensité sur vélo, réduire barre si form break'},rxPlus:{note:'RX+ Bar MU x5 + 20 cal Assault Bike'}},

{day:52,week:11,name:'VENOM-I',theme:'Haltérophilie Lourde & Gymnastics',haltero:{name:'Back Squat',desc:'Back squat lourd — tempo descendant 3s, explosion montée',scheme:'6x3 @87%',weights:'back_squat'},wod:{name:'VENOM-I',type:'For Time',movements:[{name:'Deadlift',reps:21,weight:'deadlift'},{name:'Toes-to-Bar',reps:21,gymnastics:'toes_to_bar'},{name:'Deadlift',reps:15,weight:'deadlift'},{name:'Toes-to-Bar',reps:15,gymnastics:'toes_to_bar'},{name:'Deadlift',reps:9,weight:'deadlift'},{name:'Toes-to-Bar',reps:9,gymnastics:'toes_to_bar'}],notes:'VENOM-I — format 21-15-9 haltérophilie-gymnastic en phase peak S11. Contexte semaine 11 : le Deadlift lourd est votre arme, les TTB votre gestion d\'effort. Points techniques DL : tirage des bras vers les hanches, barre contre les tibias, jamais relâcher la tension lombaire même à la descente. 21 reps en 3 séries de 7 avec respiration contrôlée entre séries (5s max). TTB : swing arrière engagé, pointer les orteils vers la barre en activation des abdos, groupes de 7-7-7 puis 8-7 puis 9. Stratégie pacing : les 21 reps DL définissent votre énergie pour la suite — ne pas partir trop vite. Transition barre TTB-barre DL : 5 secondes max, ne pas s\'asseoir. Respiration nasale profonde pendant les premiers DL pour oxygéner les lombaires. Vigilance : si les épaules basculent vers l\'avant sur le DL, réduire à 70%. Scaling : TTB → knees-to-chest, DL → 65% 1RM. Cible 8-12 min.'},gym:{name:'Skill: Pistols',drills:['Pistol assisté bande élastique 3x5/jambe','Box pistol descente lente','Pistol libre 3x3/jambe','Pistol avec kettlebell contrepoids']},scaled:{movements:[{name:'Deadlift',reps:21,note:'→ 70% 1RM'},{name:'Toes-to-Bar',reps:21,note:'→ Knees-to-Chest'}],note:'Couper les séries TTB tôt pour préserver la prise'},rxPlus:{note:'RX+ DL @115% BW + TTB strict'}},

{day:53,week:11,name:'IRON',theme:'Déload Actif — Technique & Fluidité',haltero:{name:'Snatch',desc:'Snatch technique — position de réception, balance',scheme:'8x1 @72%',weights:'snatch'},wod:{name:'IRON',type:'EMOM',movements:[{name:'Hang Power Snatch',reps:3,weight:'snatch'},{name:'Box Jump',reps:5,gymnastics:'box_jump'},{name:'Double Unders',reps:30,gymnastics:'double_unders'}],notes:'IRON — déload actif semaine 11, séance technique par excellence en pleine phase peak. Contexte : S11 pousse l\'intensité au maximum, ce WOD EMOM à 65% est votre outil de récupération intelligente. Hang Power Snatch : partir des genoux, extension explosive des hanches, tirer haut coudes larges, se glisser sous la barre. 65% permet de répéter la technique parfaite 3 fois sans dégradation. Chaque minute doit se terminer avec 15-20 secondes de repos — si non, réduire la charge. Box Jump 5 reps : rebond élastique depuis le bas, atterrissage pieds à plat, genoux dans l\'axe. Descente contrôlée pour préserver les tendons. DU 30 reps : corde détendue, poignets souples, rythme constant — éviter d\'accélérer en fin de série. Pacing EMOM : rester à 70-75% d\'effort maximum, objectif technique pure. Vigilance : si le snatch dérive en muscle snatch, réduire à 60%. Ne pas confondre déload avec facilité — qualité d\'exécution maximale. Cible : 15s de repos par minute sur 18 minutes.'},gym:{name:'Skill: Ring Muscle-Up',drills:['False grip rowing 3x8','Transition basse sur rings 5x3','Dip profond anneaux 3x5','Ring MU négatif lent 5x1']},scaled:{movements:[{name:'Hang Power Snatch',reps:3,note:'→ 55% 1RM'},{name:'Box Jump',reps:5,note:'→ 50cm'},{name:'Double Unders',reps:30,note:'→ 60 Single Unders'}],note:'Rester dans la fenêtre de repos, ne pas forcer le rythme'},rxPlus:{note:'RX+ Snatch @80% + Box 75cm + 50 DU'}},

{day:54,week:11,name:'REAPER-II',theme:'Puissance Métabolique & Endurance Force',haltero:{name:'Front Squat',desc:'Front squat lourd — rack position stricte, coudes hauts',scheme:'5x3 @85%',weights:'front_squat'},wod:{name:'REAPER-II',type:'For Time',movements:[{name:'Thruster',reps:15,weight:'thruster'},{name:'Run',reps:1,special:'run_400'},{name:'Thruster',reps:12,weight:'thruster'},{name:'Run',reps:1,special:'run_400'},{name:'Thruster',reps:9,weight:'thruster'},{name:'Run',reps:1,special:'run_400'}],notes:'REAPER-II — puissance métabolique en format décroissant thruster-run en pleine phase peak S11. Contexte : le thruster est le mouvement total par excellence, associer à la course crée une surcharge cardiovasculaire intense qui teste toute l\'athlète. Points techniques thruster : descente contrôlée cuisse parallèle, explosif depuis le bas, extension complète des hanches AVANT le push press, lockout complet en haut. 15 reps : séries de 5-5-5 idéal. 12 reps : 6-6 ou 4-4-4. 9 reps : unbroken si possible. Course 400m : allure 5K régulière (pas sprint), maintenir la respiration rythmée pour récupérer les épaules pendant la course. Transition course-barre : 5s maximum, respiration profonde. Pacing global : les jambes se partagent entre course et thruster — plus vous sprintez les 400m, plus les thrusters seront difficiles. Vigilance : si les genoux tombent en valgus sur les thrusters en fatigue, poser la barre. Scaling : 60% 1RM + 300m. Cible 15-20 min.'},gym:{name:'Skill: Handstand Walk',drills:['HS hold libre 30s x3','HS Walk 15m non-stop x3','HS Walk virage 90 degrés','HS Walk avec obstacle au sol']},scaled:{movements:[{name:'Thruster',reps:15,note:'→ 60% 1RM'},{name:'Run',reps:1,note:'→ 300m'}],note:'Thruster 15 en 2 séries max, ne jamais dépasser 3 séries'},rxPlus:{note:'RX+ Thruster @85% + Run 500m'}},

{day:55,week:11,name:'SAVAGE',theme:'Déload Force — Récupération Active',haltero:{name:'Overhead Squat',desc:'OHS contrôle total — stabilité overhead, pieds largeur snatch',scheme:'5x3 @70%',weights:'overhead_squat'},wod:{name:'SAVAGE',type:'AMRAP 15',movements:[{name:'Wall Ball',reps:10,gymnastics:'wall_ball'},{name:'Pistols',reps:5,gymnastics:'pistols'},{name:'KB Swing',reps:15,gymnastics:'kb_swing'}],notes:'SAVAGE — déload force semaine 11, récupération active entre deux séances intenses. Contexte phase peak : ce WOD à 70-75% effort sert à maintenir le système nerveux actif sans créer de fatigue supplémentaire. Wall Ball 10 reps : attraper la balle en haut à chaque rep, squat profond cuisse parallèle minimum, poussée explosive des jambes. Cible hauteur 3m/2.7m. Pistols 5 total (alternant) : atterrissage contrôlé sur le talon, genou dans l\'axe du pied, se lever sans oscillation latérale. Si difficile, bande élastique autorisée pour maintenir le mouvement complet. KB Swing russe : hanches et fessiers, pas les épaules — tension au sommet, retour contrôlé. Pacing AMRAP : rythme constant, ne jamais s\'essouffler complètement. 30 secondes de repos actif (marcher) entre rounds si nécessaire. Mobiliser hanches et épaules entre chaque round : 5 circles overhead et 5 hip rotations. Vigilance : si les pistols créent de la douleur genou, passer aux box pistols ou aux box squats unilatéraux. Cible déload 8-10 rounds confortables.'},gym:{name:'Skill: Pistols',drills:['Mobilité cheville banded 2x60s','Pistol tempo 3-1-3 x3/jambe','Pistol chaîné 5 reps/jambe x3','Pistol sur boîte surélevée x5/jambe']},scaled:{movements:[{name:'Wall Ball',reps:10,note:'→ 6kg balle'},{name:'Pistols',reps:5,note:'→ Box Pistols'},{name:'KB Swing',reps:15,note:'→ 16kg'}],note:'Maintenir mouvements fluides, priorité amplitude'},rxPlus:{note:'RX+ Wall Ball 10kg + Pistols holding KB 12kg'}},

{day:56,week:12,name:'BERSERKER',theme:'Force Maximale — Semaine Peak',haltero:{name:'Clean & Jerk',desc:'Clean & Jerk test lourd — approche 90% ou PR',scheme:'3x1 @90%',weights:'clean'},wod:{name:'BERSERKER',type:'For Time',movements:[{name:'Power Clean',reps:10,weight:'power_clean'},{name:'Handstand Walk',reps:1,gymnastics:'handstand_walk'},{name:'Power Clean',reps:8,weight:'power_clean'},{name:'Handstand Walk',reps:1,gymnastics:'handstand_walk'},{name:'Power Clean',reps:6,weight:'power_clean'},{name:'Handstand Walk',reps:1,gymnastics:'handstand_walk'}],notes:'BERSERKER — semaine 12 force maximale, premier WOD avec handstand walk sous fatigue. Contexte phase peak S12 : la semaine 12 pousse l\'intensité encore plus haut, combinant haltérophilie lourde et compétence gymnastics avancée. Power Clean 80% : 10 reps en 2 séries de 5 avec 10s de repos. 8 reps en 4-4. 6 reps : tenter unbroken. Chaque clean : tirage du sol explosif, extension hanche complète, coudes rapides en rack, squat partiel de réception. HS Walk 15m : bras bien tendus, regard au sol 20-30cm devant les mains, pas réguliers et contrôlés, hanches au-dessus des épaules. Si chute, retourner immédiatement à la position de départ sans panique — l\'hésitation coûte plus de temps que la chute. Pacing : les 6 cleans finaux sont votre chance d\'accélérer — sortir du mode survie et attaquer. Vigilance : ne jamais faire un HS Walk fatigué avec une technique compromise (épaules instables). Scaling : HS Walk → HS Hold 30s ou Bear Crawl 15m. Cible élite sub-12min, RX 12-16 min.'},gym:{name:'Skill: Ring Muscle-Up',drills:['Activation épaules bandes 2x15','Ring MU kipping 3x3','Ring MU strict 3x1','Ring MU + dip profond enchaîné x3']},scaled:{movements:[{name:'Power Clean',reps:10,note:'→ 70% 1RM'},{name:'Handstand Walk',reps:1,note:'→ HS Hold 30s ou Bear Crawl 15m'}],note:'Priorité maintenir bonne mécanique de clean'},rxPlus:{note:'RX+ Power Clean @87% + HS Walk 20m'}},

{day:57,week:12,name:'TITAN-FORCE',theme:'Puissance Explosive — Combiné Haltéro/Gym',haltero:{name:'Snatch',desc:'Snatch lourd — travailler pull sous barre, vitesse de tirage',scheme:'5x2 @87%',weights:'snatch'},wod:{name:'TITAN-FORCE',type:'AMRAP 20',movements:[{name:'Squat Clean',reps:3,weight:'squat_clean'},{name:'Ring Muscle-Up',reps:2,gymnastics:'muscle_ups_ring'},{name:'Assault Bike',reps:12,special:'assault_bike'}],notes:'TITAN-FORCE — AMRAP 20min puissance explosive, combiné haltéro-gymnastic-cardio en semaine 12 peak. Contexte S12 : ce WOD teste la capacité à maintenir la technique squat clean sous accumulation de fatigue cardiovasculaire du vélo. Squat Clean 75% : 3 reps touch-and-go si possible — barre qui touche le sol et repart immédiatement. Transition rack rapide, squat complet cuisse sous parallèle, recovery explosive. Ring Muscle-Up : false grip fermement maintenu, kip large engageant les hanches, transition fluide en bas des anneaux vers le dip profond. Ne pas relâcher le false grip entre les 2 reps. Assault Bike 12 cal : rythme constant jambes-bras (70% bras, 30% jambes), éviter de saturer les épaules pour les ring MU. Pacing AMRAP 20min : rounds 1-3 à 80%, rounds 4-6 à 85%, rounds 7+ tout donner. Repos stratégique de 15s avant chaque série de cleans pour récupérer la respiration. Vigilance : si le squat clean devient un power clean + squat séparé, réduire à 70%. Scaling : ring MU → bar MU ou pull-up + dip. Cible 7-9 rounds.'},gym:{name:'Skill: Handstand Walk',drills:['HS Walk 20m x5','HS Walk en pente légère x3','HS Walk tourner en marchant x4','HS Walk ramasser objet au sol x3']},scaled:{movements:[{name:'Squat Clean',reps:3,note:'→ 65% 1RM'},{name:'Ring Muscle-Up',reps:2,note:'→ Bar MU ou Pull-up + Dip'},{name:'Assault Bike',reps:1,note:'→ 10 cal'}],note:'Maintenir le rythme global, réduire cal vélo si nécessaire'},rxPlus:{note:'RX+ Squat Clean @82% + Ring MU x3 + 15 cal'}},

{day:58,week:12,name:'SPECTER-I',theme:'Endurance Force — Test Cardiovasculaire',haltero:{name:'Push Press',desc:'Push press lourd — drive jambes explosif, lockout complet',scheme:'6x3 @85%',weights:'push_press'},wod:{name:'SPECTER-I',type:'For Time',movements:[{name:'Shoulder-to-Overhead',reps:21,weight:'shoulder_to_oh'},{name:'Toes-to-Bar',reps:21,gymnastics:'toes_to_bar'},{name:'Run',reps:1,special:'run_800'},{name:'Shoulder-to-Overhead',reps:15,weight:'shoulder_to_oh'},{name:'Toes-to-Bar',reps:15,gymnastics:'toes_to_bar'},{name:'Run',reps:1,special:'run_800'},{name:'Shoulder-to-Overhead',reps:9,weight:'shoulder_to_oh'},{name:'Toes-to-Bar',reps:9,gymnastics:'toes_to_bar'},{name:'Run',reps:1,special:'run_400'}],notes:'SPECTER-I — test endurance force semaine 12, format STOH + TTB + Run en décroissant. Contexte phase peak S12 : le shoulder-to-overhead sous accumulation de course et TTB simule exactement les WODs Games où les épaules n\'ont jamais de repos complet. STOH 21 reps : push press strict ou jerk selon énergie. Séries de 7-7-7, jamais lâcher la barre au sol avant la fin d\'un set. 15 reps : 8-7 ou push jerk si fatigue apparaît. TTB : séries de 7 sur le 21, 5 sur le 15, 9 unbroken sur le 9. 800m allure 5K stable (4:30-5:00/km selon niveau) — ne pas sprinter, la récupération active sur la course est clé. 400m final : sprint si encore des ressources. Pacing global : les 2x800m définissent l\'issue — chaque mètre de sprinting inutile coûte des reps STOH. Vigilance : lockout STOH ne doit pas bloquer la circulation — bref verrouillage puis retour. Si épaules crampes, passer au push jerk. Scaling : 65% + knees-to-elbow + 600m. Cible 18-24 min.'},gym:{name:'Skill: Pistols',drills:['Single-leg squat profond avec bande x5','Pistol avec pause bas 3s x3/jambe','Pistol rebond enchaîné x5/jambe','Pistol lateral step x3/jambe']},scaled:{movements:[{name:'Shoulder-to-Overhead',reps:21,note:'→ 65% 1RM'},{name:'Toes-to-Bar',reps:21,note:'→ Knees-to-Elbow'},{name:'Run',reps:1,note:'→ 600m/600m/300m'}],note:'Conserver le push press même fatigué, éviter strict press'},rxPlus:{note:'RX+ STOH @90% + TTB strict + 800m x2 complet'}},

{day:59,week:12,name:'PHANTOM-II',theme:'Puissance Absolue — Complexe Lourd',haltero:{name:'Hang Clean',desc:'Hang clean + Front squat complexe — séquence explosive',scheme:'4x(2 Hang Clean + 2 Front Squat) @82%',weights:'hang_clean'},wod:{name:'PHANTOM-II',type:'For Time',movements:[{name:'Deadlift',reps:15,weight:'deadlift'},{name:'Burpee',reps:15,gymnastics:'burpee'},{name:'KB Swing',reps:20,gymnastics:'kb_swing'},{name:'Deadlift',reps:12,weight:'deadlift'},{name:'Burpee',reps:12,gymnastics:'burpee'},{name:'KB Swing',reps:20,gymnastics:'kb_swing'},{name:'Deadlift',reps:9,weight:'deadlift'},{name:'Burpee',reps:9,gymnastics:'burpee'},{name:'KB Swing',reps:20,gymnastics:'kb_swing'}],notes:'PHANTOM-II — complexe puissance absolue en semaine 12, combinant les 3 piliers de l\'effort CrossFit : haltéro lourd, capacité cardiaque, endurance musculaire. Contexte peak S12 : ce WOD simule la troisième journée d\'une compétition où tout est déjà fatigué. Deadlift @80% BW+ : séries de 5 strictement, respiration avant chaque rep (Valsalva), dos neutre impeccable même à la 5ème rep. Jamais dépasser 5 sans repositionnement. Burpee chest-to-floor : step-up autorisé si fréquence cardiaque dépasse 90% max. L\'objectif est de maintenir la cadence (1 burpee toutes les 3-4 secondes). KB Swing : idéalement américain (overhead) si maîtrisé, sinon russe. Ne jamais s\'arrêter plus de 10s sur les swings — c\'est le mouvement de récupération relative du WOD. Pacing : DL et Burpees sont les pièges, KB est la récupération. Accélérer systématiquement sur les 9 burpees finaux. Respiration : exhale forcé sur effort (montée DL, saut burpee, sommet KB). Vigilance : si le bas du dos brûle sur DL, stop immédiat et réduction de charge. Cible 15-20 min.'},gym:{name:'Skill: Ring Muscle-Up',drills:['Ring support hold 30s x3','Transition MU lente x5','Ring MU kipping 5x2','Ring MU + L-sit dip x3']},scaled:{movements:[{name:'Deadlift',reps:15,note:'→ 70% 1RM'},{name:'Burpee',reps:15,note:'→ Step-up burpee'},{name:'KB Swing',reps:20,note:'→ Russe 16kg'}],note:'Maintenir dos neutre sur DL même fatigué, réduire charge si nécessaire'},rxPlus:{note:'RX+ DL @90% BW + Burpee box jump over 60cm + KB américain 32kg'}},

{day:60,week:12,name:'FURY',theme:'Intensité Maximale — Semaine 12 Finale',haltero:{name:'Back Squat',desc:'Back squat test — tentative PR ou 95% 1RM actuel',scheme:'3-2-1 @88-92-95%',weights:'back_squat'},wod:{name:'FURY',type:'AMRAP 18',movements:[{name:'Thruster',reps:7,weight:'thruster'},{name:'Toes-to-Bar',reps:7,gymnastics:'toes_to_bar'},{name:'Double Unders',reps:50,gymnastics:'double_unders'},{name:'Assault Bike',reps:15,special:'assault_bike'}],notes:'AMRAP 18min. Cible 5-7 rounds. Thruster 75%: non-stop 7 reps. TTB enchaînés ou 4+3. DU rapide, ne pas trébucher — rythme constant surtout fatigué. Assault bike 15 cal effort 85%. Séquence exigeante cardio ET force. Identifier round critique 3-4 où tout ralentit: c est là maintenir le rythme. Conserver technique thruster même quand ça brûle.'},gym:{name:'Skill: Handstand Walk',drills:['HS Walk 25m sans pause x3','HS Walk descente pente x3','HS Walk push obstacle x4','HS Walk coordination bras x5']},scaled:{movements:[{name:'Thruster',reps:7,note:'→ 60% 1RM'},{name:'Toes-to-Bar',reps:7,note:'→ Hanging Knee Raise'},{name:'Double Unders',reps:50,note:'→ 100 Single Unders'},{name:'Assault Bike',reps:1,note:'→ 12 cal'}],note:'Priorité flux de mouvements sans arrêt, charge secondaire'},rxPlus:{note:'RX+ Thruster @82% + TTB strict + 75 DU + 18 cal'}},

{day:61,week:13,name:'BLAZE',theme:'Transition Phase — Force-Vitesse',haltero:{name:'Power Clean',desc:'Power clean vitesse maximale — barre légère, repositionnement ultra-rapide',scheme:'10x1 EMOM @75%',weights:'power_clean'},wod:{name:'BLAZE',type:'For Time',movements:[{name:'Hang Power Clean',reps:12,weight:'hang_clean'},{name:'Box Jump',reps:12,gymnastics:'box_jump'},{name:'Run',reps:1,special:'run_400'},{name:'Hang Power Clean',reps:10,weight:'hang_clean'},{name:'Box Jump',reps:10,gymnastics:'box_jump'},{name:'Run',reps:1,special:'run_400'},{name:'Hang Power Clean',reps:8,weight:'hang_clean'},{name:'Box Jump',reps:8,gymnastics:'box_jump'},{name:'Run',reps:1,special:'run_200'}],notes:'Cible 14-18 min. Hang power clean 70%: tirage haut agressif, coudes rapides. Box jump: rebond élastique sans pause en bas, step down autorisé en fatigue. 400m allure soutenue 5K. 200m final sprint. Maintenir cadence box jump même si les jambes brûlent — c est là que la puissance se développe. Ne jamais marcher sur les 200m, c est le finish.'},gym:{name:'Skill: Pistols',drills:['Pistol 5 reps continus/jambe x3','Pistol avec rotation tronc x3/jambe','Pistol saut depuis position basse x3','Pistol rebond alterné 10 total x3']},scaled:{movements:[{name:'Hang Power Clean',reps:12,note:'→ 60% 1RM'},{name:'Box Jump',reps:12,note:'→ 50cm step-up'},{name:'Run',reps:1,note:'→ 300m/300m/150m'}],note:'Vitesse sur transitions, ne pas s attarder entre mouvements'},rxPlus:{note:'RX+ HPC @82% + Box 75cm + 500m/500m/250m'}},

{day:62,week:13,name:'HURRICANE',theme:'Puissance Totale — Toutes Filières',haltero:{name:'Snatch',desc:'Snatch complexe — Power snatch + OHS, qualité maximale',scheme:'5x(1 Power Snatch + 2 OHS) @80%',weights:'snatch'},wod:{name:'HURRICANE',type:'For Time',movements:[{name:'Power Snatch',reps:10,weight:'snatch'},{name:'Ring Muscle-Up',reps:5,gymnastics:'muscle_ups_ring'},{name:'Assault Bike',reps:15,special:'assault_bike'},{name:'Power Snatch',reps:8,weight:'snatch'},{name:'Ring Muscle-Up',reps:4,gymnastics:'muscle_ups_ring'},{name:'Assault Bike',reps:15,special:'assault_bike'},{name:'Power Snatch',reps:6,weight:'snatch'},{name:'Ring Muscle-Up',reps:3,gymnastics:'muscle_ups_ring'},{name:'Assault Bike',reps:15,special:'assault_bike'}],notes:'Cible 16-22 min. Snatch 75%: chaque rep individuelle, reset complet si besoin. Ring MU: kipping contrôlé, transition basse engagée. Assault bike 15 cal sprint — effort maximal 30s. C est le WOD signature de clôture phase puissance. Tester ses limites sur le round final 6+3+15cal. Respiration: récupérer sur vélo pas après. Toute la phase de 12 semaines converge ici.'},gym:{name:'Skill: Ring Muscle-Up',drills:['Échauffement false grip 2x10','Ring MU x5 effort modéré','Ring MU + transition slow motion x3','Ring MU complexe: 1 MU + 3 dips x3']},scaled:{movements:[{name:'Power Snatch',reps:10,note:'→ 65% 1RM'},{name:'Ring Muscle-Up',reps:5,note:'→ Bar MU ou 3 Pull-up + 3 Dip'},{name:'Assault Bike',reps:1,note:'→ 12 cal'}],note:'WOD de référence phase — noter le score pour tracking progression'},rxPlus:{note:'RX+ Power Snatch @85% + Ring MU strict x3 + 20 cal Assault Bike'}},
{day:63,week:13,name:'CATACLYSM',theme:'Race Pace + Haltérophilie Lourde',haltero:{name:'Clean & Jerk',desc:'Complex Clean & Jerk – montée progressive vers 1RM journalier',scheme:'1-1-1-1-1',weights:'clean'},wod:{name:'CATACLYSM',type:'AMRAP 18',movements:[{name:'Assault Bike',reps:15,special:'assault_bike'},{name:'Clean',reps:5,weight:'clean'},{name:'Bar Muscle-Up',reps:3,gymnastics:'muscle_ups_bar'},{name:'Wall Ball',reps:10,gymnastics:'wall_ball'}],notes:'Maintenir un rythme Games dès la minute 1. Le vélo ouvre les poumons – partir à 85% puis ajuster dès le round 3. Les cleans doivent rester fluides, ne jamais s\'arrêter plus de 10 secondes entre répétitions. Les bar muscle-ups en série non-stop si possible. Objectif : 6+ rounds complets.'},gym:{name:'Skill: Bar Muscle-Up Efficiency',drills:['Kipping swing strict timing drill – 3x10 swings','False grip pull to hip drill – 3x5','Transition over bar drill – 3x3','Full bar muscle-up singles avec focus poignets – 3x5']},scaled:{movements:[{name:'Assault Bike',reps:12,note:'→ rower 15 cal'},{name:'Clean',reps:5,note:'→ 60% 1RM'},{name:'Bar Muscle-Up',reps:3,note:'→ jumping BMU ou chest-to-bar'},{name:'Wall Ball',reps:10,note:'→ 6kg/9kg'}],note:'Maintenir l\'intention de vitesse même en scaled'},rxPlus:{note:'RX+ Assault Bike 20 cal, Clean 80%1RM, Bar Muscle-Up 5 reps'}},

{day:64,week:13,name:'IRON-ELITE',theme:'Déload Actif – Technique & Mobilité',haltero:{name:'Snatch',desc:'Snatch technique – position basse, turnover, overhead stability',scheme:'3-3-3-3-3',weights:'snatch'},wod:{name:'IRON-ELITE',type:'For Time',movements:[{name:'Run 400m',reps:1,special:'run_400'},{name:'Toes to Bar',reps:21,gymnastics:'toes_to_bar'},{name:'Deadlift',reps:15,weight:'deadlift'},{name:'Double Unders',reps:50,gymnastics:'double_unders'},{name:'Run 400m',reps:1,special:'run_400'},{name:'Toes to Bar',reps:15,gymnastics:'toes_to_bar'},{name:'Deadlift',reps:10,weight:'deadlift'},{name:'Double Unders',reps:50,gymnastics:'double_unders'},{name:'Run 400m',reps:1,special:'run_400'},{name:'Toes to Bar',reps:9,gymnastics:'toes_to_bar'},{name:'Deadlift',reps:5,weight:'deadlift'},{name:'Double Unders',reps:50,gymnastics:'double_unders'}],notes:'Déload actif : charge modérée, technique prioritaire. Courir à allure régulière sans sprinter. Les toes-to-bar en séries contrôlées 7-7-7 puis 8-7, jamais d\'échec musculaire. Deadlift à 60% max, dos neutre impeccable. DU fluides sans rush. Objectif : rythme constant sur les 3 rounds, dernier round aussi propre que le premier.'},gym:{name:'Skill: Snatch Positioning',drills:['Snatch balance 5x3 léger – focus stabilité overhead','Overhead squat paused 3sec en bas – 4x5','Pull position drill avec bande – 3x8','Snatch drop drill depuis power position – 3x5']},scaled:{movements:[{name:'Run 400m',reps:1,note:'→ Row 500m'},{name:'Toes to Bar',reps:21,note:'→ knees to chest ou hanging knee raise'},{name:'Deadlift',reps:15,note:'→ 50% 1RM'},{name:'Double Unders',reps:50,note:'→ 100 single unders'}],note:'Déload : priorité à la récupération active et la fluidité'},rxPlus:{note:'RX+ Deadlift 110%BW, Toes to Bar strict, courir en moins de 2min/400m'}},

{day:65,week:13,name:'NEMESIS-ELITE',theme:'Chipper Élite – Mouvements Combinés',haltero:{name:'Front Squat',desc:'Front squat lourd – triples puis double puis single',scheme:'3-3-2-2-1-1',weights:'front_squat'},wod:{name:'NEMESIS-ELITE',type:'For Time',movements:[{name:'Ski Erg',reps:50,special:'ski_erg'},{name:'Squat Clean',reps:10,weight:'squat_clean'},{name:'Handstand Walk',reps:20,gymnastics:'handstand_walk'},{name:'Ski Erg',reps:40,special:'ski_erg'},{name:'Squat Clean',reps:8,weight:'squat_clean'},{name:'Toes to Bar',reps:20,gymnastics:'toes_to_bar'},{name:'Ski Erg',reps:30,special:'ski_erg'},{name:'Squat Clean',reps:6,weight:'squat_clean'},{name:'Ring Muscle-Up',reps:6,gymnastics:'muscle_ups_ring'}],notes:'Chipper d\'élite : gérer les ressources dès le départ. Ski erg à intensité Games (90%), ne pas exploser. Squat cleans en touch-and-go si possible, penser à respirer entre chaque répétition. Handstand walk en segments de 5m, regarder les mains pas devant. Ring muscle-ups en fin de chipper – réserver 20% d\'énergie pour eux. Cap 20 minutes.'},gym:{name:'Skill: Handstand Walk Distance',drills:['Wall handstand hold 3x30sec – focus ligne corporelle','Kick up to wall + shoulder taps – 3x10 taps','Handstand walk 5m segments – 5 passages','Freestanding HS hold 10sec – 5 tentatives']},scaled:{movements:[{name:'Ski Erg',reps:50,note:'→ Row 40 cal'},{name:'Squat Clean',reps:10,note:'→ power clean + front squat séparés'},{name:'Handstand Walk',reps:20,note:'→ bear crawl 20m ou wall walk 5'},{name:'Toes to Bar',reps:20,note:'→ knees to elbow'},{name:'Ring Muscle-Up',reps:6,note:'→ 12 ring dips + 12 pull-ups'}],note:'Réduire les charges de 20%, maintenir les mouvements techniques'},rxPlus:{note:'RX+ Ski Erg sprint max chaque segment, Squat Clean 85%1RM, Ring MU strict'}},

{day:66,week:14,name:'STORM-PEAK',theme:'Benchmark Re-Test – Fran Variante',haltero:{name:'Push Press',desc:'Push press – montée 5-5-3-3-1-1 vers 1RM journalier',scheme:'5-5-3-3-1-1',weights:'push_press'},wod:{name:'STORM-PEAK',type:'For Time',movements:[{name:'Thruster',reps:21,weight:'thruster'},{name:'Pull-Ups',reps:21,gymnastics:'pullups'},{name:'Thruster',reps:15,weight:'thruster'},{name:'Pull-Ups',reps:15,gymnastics:'pullups'},{name:'Thruster',reps:9,weight:'thruster'},{name:'Pull-Ups',reps:9,gymnastics:'pullups'}],notes:'Re-test du format Fran avec intention Games. Round de 21 : thrusters en 12-9 ou 15-6, pull-ups kipping en grand set. Round 15 : thrusters 9-6, pull-ups 10-5. Round 9 : tout d\'une traite si possible. La transition thruster-pull-up est cruciale – poser la barre, prendre 2 respirations, monter immédiatement. Objectif sub-4min pour les élites, sub-6min pour RX solide.'},gym:{name:'Skill: Kipping Pull-Up & Butterfly',drills:['Kipping swing timing 3x15 – rythme régulier','Butterfly pull-up drill 3x5 – entrée et sortie','Combo kipping 5 + butterfly 5 – 3 séries','High-rep pull-up set test 1x max unbroken']},scaled:{movements:[{name:'Thruster',reps:21,note:'→ 65% 1RM ou PVC technique'},{name:'Pull-Ups',reps:21,note:'→ bande élastique ou jumping pull-up'}],note:'Même structure 21-15-9, adapter la charge pour finir en moins de 10min'},rxPlus:{note:'RX+ Thruster 52.5kg/35kg, strict pull-ups, objectif sub-3min'}},

{day:67,week:14,name:'GLADIATOR-ELITE',theme:'Endurance Force – Long AMRAP',haltero:{name:'Hang Clean',desc:'Hang clean – séries courtes lourdes, technique sous fatigue',scheme:'3-3-3-3',weights:'hang_clean'},wod:{name:'GLADIATOR-ELITE',type:'AMRAP 25',movements:[{name:'Assault Bike',reps:20,special:'assault_bike'},{name:'Hang Clean',reps:5,weight:'hang_clean'},{name:'Box Jump',reps:10,gymnastics:'box_jump'},{name:'KB Swing',reps:15,gymnastics:'kb_swing'},{name:'Burpee',reps:8,gymnastics:'burpee'}],notes:'AMRAP 25 minutes : effort aérobie prolongé de type Games day 2. Assault bike à 75-80%, objectif 1min pour 20 cal. Hang cleans en séries de 5 non-stop, choisir un poids tenable 25min. Box jumps step-down pour préserver les tendons d\'Achille sur la durée. KB swings américains si maîtrisés. Burpees réguliers à 3-4 par respiration. Objectif 8+ rounds.'},gym:{name:'Skill: Box Jump Efficiency & Landing',drills:['Box jump step-down technique – 3x10','Depth jump rebond rapide – 3x8','Lateral box jump – 3x6 chaque côté','Box jump hauteur progressive – 60/70/75/80cm']},scaled:{movements:[{name:'Assault Bike',reps:15,note:'→ rower 15 cal'},{name:'Hang Clean',reps:5,note:'→ 55% 1RM'},{name:'Box Jump',reps:10,note:'→ 50cm ou step-up'},{name:'KB Swing',reps:15,note:'→ russe 24/16kg'},{name:'Burpee',reps:8,note:'→ 6 burpees'}],note:'Maintenir une intensité constante sur les 25 min, ne jamais aller à l\'échec'},rxPlus:{note:'RX+ Assault Bike 25 cal, Hang Clean 80%1RM, Box Jump 75cm, KB Swing américain 32/24kg'}},

{day:68,week:14,name:'WARRIOR',theme:'Haltéro Complexe + Gymnastics Pur',haltero:{name:'Snatch Complex',desc:'Power snatch + snatch balance + overhead squat – complex technique',scheme:'1+1+1 x 5 séries',weights:'snatch'},wod:{name:'WARRIOR',type:'For Time',movements:[{name:'HSPU',reps:30,gymnastics:'hspu'},{name:'Power Clean',reps:15,weight:'power_clean'},{name:'Rope Climb',reps:5,gymnastics:'rope_climb'},{name:'HSPU',reps:20,gymnastics:'hspu'},{name:'Power Clean',reps:12,weight:'power_clean'},{name:'Rope Climb',reps:4,gymnastics:'rope_climb'},{name:'HSPU',reps:10,gymnastics:'hspu'},{name:'Power Clean',reps:9,weight:'power_clean'},{name:'Rope Climb',reps:3,gymnastics:'rope_climb'}],notes:'Tripler gymnastics-haltéro-gymnastics en décroissant. HSPU strictes ou kipping selon niveau, gérer les séries dès le début : 10-10-10 pour le premier set. Power cleans touch-and-go, ne jamais dépasser 5 consécutifs sans respiration. Rope climb legless si possible pour le RX+. La transition sol-barre est psychologique : s\'imposer de ne pas traîner. Cap 25 minutes.'},gym:{name:'Skill: Strict HSPU Progression',drills:['Pike push-up strict 3x10','Déficit HSPU 5cm – 3x5','Tripod headstand balance 3x20sec','HSPU kipping timing drill 3x5']},scaled:{movements:[{name:'HSPU',reps:30,note:'→ pike push-up ou box HSPU'},{name:'Power Clean',reps:15,note:'→ 65% 1RM'},{name:'Rope Climb',reps:5,note:'→ 3 montées partielles ou 5 ring rows'}],note:'Adapter les déficits et hauteurs pour maintenir la fluidité'},rxPlus:{note:'RX+ HSPU strict déficit 10cm, Power Clean 85%1RM, Rope Climb legless'}},

{day:69,week:14,name:'CAESAR',theme:'Sprint Intervals – Race Pace Pur',haltero:{name:'Shoulder to Overhead',desc:'S2OH lourd – push press / push jerk / split jerk selon feeling',scheme:'5-3-3-1-1-1',weights:'shoulder_to_oh'},wod:{name:'CAESAR',type:'Intervals',movements:[{name:'Run 400m',reps:1,special:'run_400'},{name:'Thruster',reps:10,weight:'thruster'},{name:'Double Unders',reps:30,gymnastics:'double_unders'},{name:'Toes to Bar',reps:10,gymnastics:'toes_to_bar'}],notes:'5 rounds en intervalles 4min on / 1min off. Chaque round est un sprint complet. Run 400m à 90-95% – pas de jogging. Thrusters enchaînés en 10 non-stop, choisir un poids permettant cela 5 rounds. Double unders sans arrêt si possible. Toes-to-bar en 5-5. La minute de repos est active (marcher, respirer). Consigner le temps de chaque round, viser la régularité à ±15sec.'},gym:{name:'Skill: Double Unders Consistency',drills:['Single under rythme régulier 1x50','DU 10 consécutifs – 5 passages','DU 30 consécutifs – 3 passages','DU 50+ non-stop – objectif personnel']},scaled:{movements:[{name:'Run 400m',reps:1,note:'→ Row 500m'},{name:'Thruster',reps:10,note:'→ 65% 1RM'},{name:'Double Unders',reps:30,note:'→ 60 single unders'},{name:'Toes to Bar',reps:10,note:'→ knees to chest'}],note:'Maintenir l\'intention sprint à chaque intervalle'},rxPlus:{note:'RX+ Run 400m sous 1min40, Thruster 43kg/29kg, DU 50 reps par round'}},

{day:70,week:14,name:'MAXIMUS',theme:'Chipper Games – Test Complet',haltero:{name:'Back Squat',desc:'Back squat lourd – montée vers 3RM puis 1RM journalier',scheme:'5-3-3-1-1',weights:'back_squat'},wod:{name:'MAXIMUS',type:'For Time',movements:[{name:'Ski Erg',reps:80,special:'ski_erg'},{name:'Deadlift',reps:30,weight:'deadlift'},{name:'Wall Ball',reps:40,gymnastics:'wall_ball'},{name:'Assault Bike',reps:30,special:'assault_bike'},{name:'Pull-Ups',reps:30,gymnastics:'pullups'},{name:'Overhead Squat',reps:20,weight:'overhead_squat'},{name:'Burpee',reps:20,gymnastics:'burpee'},{name:'Rope Climb',reps:4,gymnastics:'rope_climb'}],notes:'Chipper final de semaine 14 – test d\'endurance mentale et physique. Ski erg en 2 segments 40+40 cal. Deadlifts en 10-10-10, dos neutre, jamais de fatigue lombaire. Wall balls 10-10-10-10 réguliers. Vélo à 80%. Pull-ups en séries de 10. OHS technique – choisir un poids maîtrisable. Burpees réguliers 5 par minute. Rope climb efficace 3+1. Cap 35 minutes. Ce WOD simule la réalité d\'un chipper Open ou Games.'},gym:{name:'Skill: Overhead Squat Stability',drills:['OHS avec PVC – 3x10 paused 3sec en bas','OHS avec barre vide – 3x8 slow tempo','Snatch grip press behind neck – 3x10','OHS 60% – 3x5 avec focus genoux-orteils']},scaled:{movements:[{name:'Ski Erg',reps:60,note:'→ Row 50 cal'},{name:'Deadlift',reps:30,note:'→ 60% 1RM'},{name:'Wall Ball',reps:30,note:'→ 6kg/9kg'},{name:'Assault Bike',reps:20,note:'→ Row 20 cal'},{name:'Pull-Ups',reps:30,note:'→ bande élastique'},{name:'Overhead Squat',reps:20,note:'→ PVC ou barre vide'},{name:'Burpee',reps:15,note:'→ 15 burpees'},{name:'Rope Climb',reps:4,note:'→ 8 ring rows'}],note:'Réduire volumes et charges pour finir en moins de 40 min'},rxPlus:{note:'RX+ Ski Erg sprint, Deadlift 100%BW, OHS 60%1RM snatch, Rope Climb legless'}},

{day:71,week:15,name:'THUNDER',theme:'Déload Semaine 15 – Activation Compétition',haltero:{name:'Clean',desc:'Clean technique déload – hang position, vitesse sous la barre',scheme:'3-3-3 à 70%',weights:'clean'},wod:{name:'THUNDER',type:'AMRAP 20',movements:[{name:'Run 200m',reps:1,special:'run_200'},{name:'KB Swing',reps:10,gymnastics:'kb_swing'},{name:'Box Jump',reps:8,gymnastics:'box_jump'},{name:'Pull-Ups',reps:6,gymnastics:'pullups'}],notes:'Déload semaine 15 : intensité modérée 65-70%, objectif activation et fraîcheur. Run 200m à allure confortable, non maximale. KB swings russes, légers et rapides. Box jumps à hauteur standard, focus sur la réception souple et l\'efficacité. Pull-ups kipping fluides. Ce WOD doit laisser la sensation de pouvoir recommencer – si on est épuisé c\'est qu\'on est allé trop vite. Idéal : 12-14 rounds en 20 minutes.'},gym:{name:'Skill: Activation & Mobilité Compét',drills:['Hip flexor stretch 2x90sec chaque côté','Thoracique mobilisation sur foam roller 2x2min','Shoulder CARs – 2x10 rotations contrôlées','Activation fessiers – clamshell 2x15 + pont 2x15']},scaled:{movements:[{name:'Run 200m',reps:1,note:'→ Row 250m'},{name:'KB Swing',reps:10,note:'→ 12/8kg russe'},{name:'Box Jump',reps:8,note:'→ 45cm step-up'},{name:'Pull-Ups',reps:6,note:'→ bande légère'}],note:'Déload total : écouter le corps, stopper si douleur articulaire'},rxPlus:{note:'RX+ Run 200m sous 50sec, KB Swing américain 32/24kg, Box Jump 75cm'}},

{day:72,week:15,name:'ZEUS',theme:'Benchmark Classique – Re-Test Cindy/Jackie',haltero:{name:'Power Clean',desc:'Power clean – activation compétition, 5 séries de 3 à 75-80%',scheme:'3-3-3-3-3',weights:'power_clean'},wod:{name:'ZEUS',type:'For Time',movements:[{name:'Row',reps:1000,special:'row_cal'},{name:'Thruster',reps:50,weight:'thruster'},{name:'Pull-Ups',reps:30,gymnastics:'pullups'}],notes:'Re-test Jackie modifié. Row 1000m à allure soutenue mais pas sprint – target 3min30-4min. Thrusters 50 reps en séries de 10, JAMAIS tomber en dessous de 7 reps par série. Transition barre-barre rapide, 5 secondes max de pause. Pull-ups en 10-10-10 butterfly ou kipping. Le piège est dans les thrusters : trop vite sur le row = bras morts sur les thrusters. Gestion de l\'énergie comme en compétition. Objectif sub-9min élite, sub-12min RX solide.'},gym:{name:'Skill: Row Technique Race Pace',drills:['Row 10x100m avec 30sec récup – focus drive','Row catch position drill – 3x2min focus','Sprints row 10sec tous les 1min – 8 rounds','Row 500m à allure cible compétition – 1 passage']},scaled:{movements:[{name:'Row',reps:1000,note:'→ Row 750m'},{name:'Thruster',reps:50,note:'→ 65% 1RM'},{name:'Pull-Ups',reps:30,note:'→ bande élastique'}],note:'Maintenir le format Jackie original, adapter la charge uniquement'},rxPlus:{note:'RX+ Row 1000m sub-3min30, Thruster 52.5kg/35kg, strict pull-ups'}},

{day:73,week:15,name:'KRONOS',theme:'Complex Élite – Mouvements Compétition',haltero:{name:'Squat Clean Thruster',desc:'Squat clean + thruster complex – 1+1 par série, lourd progressif',scheme:'1+1 x 6 montée',weights:'squat_clean'},wod:{name:'KRONOS',type:'For Time',movements:[{name:'Assault Bike',reps:25,special:'assault_bike'},{name:'Squat Clean',reps:7,weight:'squat_clean'},{name:'Ring Muscle-Up',reps:5,gymnastics:'muscle_ups_ring'},{name:'Ski Erg',reps:25,special:'ski_erg'},{name:'Squat Clean',reps:6,weight:'squat_clean'},{name:'Ring Muscle-Up',reps:5,gymnastics:'muscle_ups_ring'},{name:'Assault Bike',reps:20,special:'assault_bike'},{name:'Squat Clean',reps:5,weight:'squat_clean'},{name:'Ring Muscle-Up',reps:5,gymnastics:'muscle_ups_ring'}],notes:'WOD de sélection compétition niveau élite. Assault bike à 90% dès le départ. Squat cleans touch-and-go si possible, sinon hanche rapide et position basse immédiate. Ring muscle-ups : transition fluide, penser à s\'élever haut sur le kipping. Ski erg en sprint contrôlé. L\'alternance cardio-haltéro-gymnastic est l\'essence du CrossFit Games – simuler exactement cette réalité. Pas de repos inutile, chrono est roi. Cap 22 minutes.'},gym:{name:'Skill: Ring Muscle-Up Kipping',drills:['Ring support position 3x20sec – focus retournement','Kipping swing aux anneaux 3x10','Transition drill anneaux bas 3x5','Ring muscle-up singles avec focus extension hanche']},scaled:{movements:[{name:'Assault Bike',reps:20,note:'→ Row 20 cal'},{name:'Squat Clean',reps:7,note:'→ power clean + front squat'},{name:'Ring Muscle-Up',reps:5,note:'→ 10 pull-ups + 10 ring dips'},{name:'Ski Erg',reps:20,note:'→ Row 20 cal'}],note:'Maintenir l\'alternance cardio-force-gymnastic dans la structure'},rxPlus:{note:'RX+ Assault Bike 30 cal, Squat Clean 85%1RM, Ring MU strict, Ski Erg 30 cal'}},

{day:74,week:15,name:'ARES',theme:'Endurance Ultime – Simulation Games Day',haltero:{name:'Overhead Squat',desc:'OHS lourd – 5-5-3-3-1 montée vers maximum du jour',scheme:'5-5-3-3-1',weights:'overhead_squat'},wod:{name:'ARES',type:'For Time',movements:[{name:'Run 800m',reps:1,special:'run_800'},{name:'Deadlift',reps:21,weight:'deadlift'},{name:'HSPU',reps:21,gymnastics:'hspu'},{name:'Run 800m',reps:1,special:'run_800'},{name:'Deadlift',reps:15,weight:'deadlift'},{name:'HSPU',reps:15,gymnastics:'hspu'},{name:'Run 800m',reps:1,special:'run_800'},{name:'Deadlift',reps:9,weight:'deadlift'},{name:'HSPU',reps:9,gymnastics:'hspu'}],notes:'Simulation Games long WOD – 3 rounds de course + force + gymnastics. Run 800m : round 1 à 80%, round 2 à 85%, round 3 à 90% – progression inversée rare mais efficace. Deadlifts 21-15-9 en 7-7-7, 8-7, 9 : jamais de fatigue lombaire. HSPU kipping ou strictes selon niveau, gérer 10-6-5 au premier round. La deuxième course est psychologiquement la plus dure – elle définit les athlètes d\'élite. Objectif sub-28min élite, sub-35min RX.'},gym:{name:'Skill: Run 800m Pacing Strategy',drills:['Run 400m x4 avec récup 2min – noter splits','Cadence drill 180 pas/min – 2x400m','Hill run simulation – 2x200m montée/descente','Stride drill 6x50m accélération progressive']},scaled:{movements:[{name:'Run 800m',reps:1,note:'→ Row 1000m'},{name:'Deadlift',reps:21,note:'→ 60% 1RM'},{name:'HSPU',reps:21,note:'→ pike push-up ou box HSPU'}],note:'Réduire le volume de 30% si récupération insuffisante en semaine 15'},rxPlus:{note:'RX+ Run 800m sub-3min30, Deadlift 120%BW, HSPU strict déficit 10cm'}},

{day:75,week:15,name:'POSEIDON',theme:'Final Phase – Peak Performance Test',haltero:{name:'Clean & Jerk',desc:'Clean & Jerk – test 1RM final de phase, tout donner',scheme:'1-1-1-1-1 montée max',weights:'clean'},wod:{name:'POSEIDON',type:'For Time',movements:[{name:'Assault Bike',reps:30,special:'assault_bike'},{name:'Snatch',reps:10,weight:'snatch'},{name:'Toes to Bar',reps:20,gymnastics:'toes_to_bar'},{name:'Double Unders',reps:50,gymnastics:'double_unders'},{name:'Assault Bike',reps:25,special:'assault_bike'},{name:'Snatch',reps:8,weight:'snatch'},{name:'Toes to Bar',reps:15,gymnastics:'toes_to_bar'},{name:'Double Unders',reps:50,gymnastics:'double_unders'},{name:'Assault Bike',reps:20,special:'assault_bike'},{name:'Snatch',reps:6,weight:'snatch'},{name:'Toes to Bar',reps:10,gymnastics:'toes_to_bar'},{name:'Double Unders',reps:50,gymnastics:'double_unders'}],notes:'WOD final de la phase Compétition – test absolu de toutes les qualités développées sur 15 semaines. Assault bike à intensité maximale : c\'est la dernière fois cette phase, tout donner. Snatchs techniques même sous fatigue, positions parfaites plus importantes que la vitesse. Toes-to-bar en grand set dès que possible. DU : 50 reps sans faute, concentration totale. Ce WOD est un marqueur : comparer avec les performances des semaines 1-4. La progression est la preuve du travail accompli. Cap 30 minutes. Célébrer chaque répétition.'},gym:{name:'Skill: Snatch Under Fatigue',drills:['Snatch grip deadlift 5x3 – renforcement positions','Hang power snatch 3x5 à 60% – vitesse coudes','Snatch balance 4x3 – confiance overhead','Full snatch 70% x5 singles – application finale']},scaled:{movements:[{name:'Assault Bike',reps:20,note:'→ Row 20 cal'},{name:'Snatch',reps:10,note:'→ 60% 1RM power snatch'},{name:'Toes to Bar',reps:20,note:'→ knees to chest'},{name:'Double Unders',reps:50,note:'→ 100 single unders'}],note:'WOD final : donner 100% à son niveau, c\'est l\'intensité relative qui compte'},rxPlus:{note:'RX+ Assault Bike sprint 90sec max, Snatch 80%1RM, Toes to Bar strict, DU unbroken'}},
{
  day: 76, week: 16, name: 'GOLIATH', theme: 'Clean & Jerk Games + Hero Couplet',
  haltero: { name: 'Clean & Jerk', desc: 'Clean & Jerk: 5x1 @85%, 3x1 @90%+. Build to near-max single. Chaque rep explosive, barre rapide dans le dos.', scheme: 'E2MOM 16min — Intensité maximale', weights: 'clean' },
  wod: { name: 'GOLIATH', type: 'AMRAP 20', movements: [
    {name: 'Squat Cleans', reps: 5, weight: 'squat_clean'},
    {name: 'Ring Muscle-ups', reps: 5, gymnastics: 'muscle_ups_ring'},
    {name: 'Run 400m', reps: 1, special: 'run_400'}
  ], notes: 'GOLIATH — le géant est réveillé. Phase PEAK semaine 16, intensité Games-level absolue. Squat Cleans RX H 102kg / F 70kg. Stratégie: 5 Cleans TnG si possible — technique irréprochable, fond du squat profond. Ring MU: 2-2-1 ou singles si nécessaire, ne ratez PAS de rep. Run 400m à 85-90% — jamais sprint total, vous avez 20min entières. Cible: 6 rounds minimum (élite 8+). Régularité absolue entre rounds — un round >4:00 = réduire le poids. Grip va brûler après les Cleans, soufflez avant les RMU. Le run est la récup active entre les deux mouvements lourds. Élite Games pace: sub 3:20/round. Respirez dans le ventre sur chaque descente de Clean. Votre corps peut davantage que votre tête ne le croit — GOLIATH est vaincu par la régularité, pas par la force brute.' },
  gym: { name: 'Skill: Ring MU Efficiency', drills: ['3x3 Strict Ring MU (controlled negative 3s)', '5x2 False Grip Ring MU transition drill (speed)', '3x5 Deep Ring Dips (full ROM, pause au bas)', '3x10 Band Pull-Aparts (horizontal + overhead)'] },
  scaled: { movements: [{name: 'Squat Cleans', reps: 5, note: '→ Power Cleans à 70% du RX'}, {name: 'Ring Muscle-ups', reps: 5, note: '→ 8 C2B Pull-ups kipping ou 10 Pull-ups kipping'}], note: 'Scaling: RMU → C2B ou kipping pull-ups. Cleans = poids permettant TnG propre sur 5 reps. Garder 20min AMRAP et 400m runs intacts.' },
  rxPlus: { note: 'RX+: Squat Cleans H 115kg / F 79kg. Ring MU = strict uniquement. Target 9+ rounds.' }
},
{
  day: 77, week: 16, name: 'SPARTACUS', theme: 'Snatch Ladder + Games Chipper', hero: true,
  haltero: { name: 'Snatch', desc: 'Snatch: 3x2 @75%, 3x1 @82%, 2x1 @88%+. Explosivité maximale, barre rapide au-dessus de la tête.', scheme: 'E90s x 8 sets — Progression Games lourde', weights: 'snatch' },
  wod: { name: 'SPARTACUS', type: 'For Time (cap 22min) — HERO WOD', movements: [
    {name: 'Run 800m', reps: 1, special: 'run_800'},
    {name: 'Power Snatches', reps: 21, weight: 'snatch'},
    {name: 'Toes-to-bar', reps: 21, gymnastics: 'toes_to_bar'},
    {name: 'Bar Muscle-ups', reps: 12, gymnastics: 'muscle_ups_bar'},
    {name: 'Power Snatches', reps: 15, weight: 'snatch'},
    {name: 'Toes-to-bar', reps: 15, gymnastics: 'toes_to_bar'},
    {name: 'Bar Muscle-ups', reps: 8, gymnastics: 'muscle_ups_bar'},
    {name: 'Power Snatches', reps: 9, weight: 'snatch'},
    {name: 'Toes-to-bar', reps: 9, gymnastics: 'toes_to_bar'},
    {name: 'Bar Muscle-ups', reps: 4, gymnastics: 'muscle_ups_bar'},
    {name: 'Run 800m', reps: 1, special: 'run_800'}
  ], notes: 'SPARTACUS — Hero WOD dédié aux guerriers qui ne capitulent jamais. Run d\'ouverture à 80% (4:10-4:30/km), jamais un sprint — vous avez un chipper entier devant vous. Snatches RX H 61kg / F 43kg = touch-and-go 7-7-7 puis 5-5-5 puis unbroken sur les 9 dernier. TTB: séries de 7 dans le premier bloc, puis 5-5-5, puis 9 unbroken si grip tient. BMU: 3-3-3-3 premier bloc / 2-2-2-2 deuxième / 2-1-1 dernier. Run final: vider complètement les réservoirs — tout ce qui reste dans le moteur. Total reps: 800m + 45 snatches + 45 TTB + 24 BMU + 800m. Élite sub 17min. Avancé sub 21min. Ce WOD honore ceux qui se battent sans uniforme — chaque rep est un hommage.' },
  gym: { name: 'Skill: Bar Muscle-up Kip', drills: ['3x5 C2B kip drill (hanches à la barre)', '5x2 Bar MU fast kip transition', '3x8 Strict Chest-to-Bar Pull-ups (lent)', '3x10 Band Pull-Aparts overhead (rotation externe)'] },
  scaled: { movements: [{name: 'Power Snatches', reps: 21, note: '→ 40/27kg ou DB Snatches alternés'}, {name: 'Bar Muscle-ups', reps: 12, note: '→ C2B pull-ups x1.5 ou kipping pull-ups x2'}], note: 'Scaling: BMU → C2B ou kipping pull-ups. Snatches charge légère = TnG maintenu sur blocs de 7+. Run 800m = distance identique obligatoire.' },
  rxPlus: { note: 'RX+: Snatches H 70kg / F 47kg. BMU strict uniquement. Remplacer 2ème run par 3 Legless Rope Climbs. Target sub 15min.' }
},
{
  day: 78, week: 16, name: 'DOMINION', theme: 'Front Squat Lourd + Death by Intervals',
  haltero: { name: 'Front Squat', desc: 'Front Squat: 4x3 @80%, 3x2 @87%, 2x1 @93%+. Mobilité maximale, position rack parfaite, coudes hauts.', scheme: 'E2MOM 14min — Lourd Games-level', weights: 'front_squat' },
  wod: { name: 'DOMINION', type: '5 Rounds For Time (cap 22min)', movements: [
    {name: 'Front Squats', reps: 8, weight: 'front_squat'},
    {name: 'HSPU', reps: 10, gymnastics: 'hspu'},
    {name: 'Cal Assault Bike', reps: 18, special: 'assault_bike'},
    {name: 'Toes-to-bar', reps: 12, gymnastics: 'toes_to_bar'}
  ], notes: 'DOMINION — 5 rounds de domination totale après du lourd au rack. Front Squats RX H 80kg / F 55kg (70% 1RM). Stratégie: FS 4+4 ou unbroken si charge dans les clous — cuisses en feu = normal en phase PEAK. HSPU 5+5 kipping ou 10 unbroken si frais. Assault Bike 18/14 cal sprint 20-25s sans quitter le siège. TTB 6-6 ou 12 unbroken si core encore frais. Repos entre rounds: 30s MAX — discipline mentale requise. Les rounds 4 et 5 sont le vrai test caractère. Ralentissez les HSPU et TTB, explosez sur le Bike. Élite sub 17min, Avancé sub 21min. Les jambes accusent les FS après le travail lourd — c\'est le plan, c\'est la souffrance voulue. Cherchez la fluidité entre chaque mouvement, la respiration nasale entre FS et HSPU.' },
  gym: { name: 'Skill: HSPU Déficit', drills: ['3x5 Deficit HSPU (2 plaques 20kg au sol)', '3x3 Strict HSPU (descente 3s contrôlée)', '3x Max Kipping HSPU (test)', '3x20s Freestanding HS Hold tentatives']},
  scaled: { movements: [{name: 'Front Squats', reps: 8, note: '→ 60% du RX ou Goblet Squats à KB'}, {name: 'HSPU', reps: 10, note: '→ Pike HSPU sur box ou DB Strict Press 2x15kg'}, {name: 'Cal Assault Bike', note: '→ 14/10 cal'}, {name: 'Toes-to-bar', reps: 12, note: '→ Knees-to-chest ou strict leg raises'}], note: 'Scaling: FS léger = séries unbroken obligatoire. HSPU pike si nécessaire. Bike = même effort relatif. TTB → KTC.' },
  rxPlus: { note: 'RX+: FS H 95kg / F 65kg. HSPU strict 10 reps (no kip). Bike +4 cal. Target sub 15min.' }
},
{
  day: 79, week: 16, name: 'OVERLORD', theme: 'Deadlift Max + Barbell Triplet',
  haltero: { name: 'Deadlift', desc: 'Deadlift: 3x3 @80%, 2x2 @87%, 2x1 @92%+. Contrôle excentrique 2s, concentrique explosif. Engagement du grand dorsal.', scheme: 'E2MOM 14min — Near-max strength', weights: 'deadlift' },
  wod: { name: 'OVERLORD', type: '4 Rounds For Time (cap 20min)', movements: [
    {name: 'Deadlifts', reps: 10, weight: 'deadlift'},
    {name: 'Hang Power Cleans', reps: 8, weight: 'hang_clean'},
    {name: 'Push Press', reps: 6, weight: 'push_press'},
    {name: 'Double Unders', reps: 50, gymnastics: 'double_unders'},
    {name: 'Rope Climbs', reps: 2, gymnastics: 'rope_climb'}
  ], notes: 'OVERLORD — maître absolu de la force et du conditionnement. Barbell complex RX même charge pour DL + HPC + PP: H 70kg / F 47kg (le Push Press guide le poids choisi). Stratégie: DL 5+5 TnG (touch-and-go contrôlé), HPC 4+4 ou TnG si explosivité tient, PP 6 unbroken (hip drive!) puis soufflez. DU = 50 unbroken objectif — en cas d\'échec, reprenez immédiatement sans longue pause. Rope Climbs: technique de pieds (leglock), max 2 pulls forts par montée. Repos entre rounds: 45s MAX. Élite sub 14min, Avancé sub 18min. Pattern neuromusculaire DL → HPC → PP = brutal pour les reins et les trapèzes. Grip va brûler — soufflez 5s après les PP avant les DU. 4 rounds = 40 DL + 32 HPC + 24 PP + 200 DU + 8 rope climbs. Un volume de travail de champion.' },
  gym: { name: 'Skill: Rope Climb Legless', drills: ['3x1 Legless Rope Climb (ou max tentatives)', '3x3 Rope Climb technique jambes (leglock)', '3x8 Strict Pull-ups (prise large longue)', '3x30s Dead Hang (respiration contrôlée)'] },
  scaled: { movements: [{name: 'Deadlifts', reps: 10, note: '→ 60% du RX ou 8 reps'}, {name: 'Double Unders', reps: 50, note: '→ 100 Single Unders'}, {name: 'Rope Climbs', reps: 2, note: '→ 6 Ring Rows strictes ou 1 Rope Climb technique'}], note: 'Scaling: poids complex = Push Press guide. Rope Climbs → ring rows si non-acquis. DU → SU x2.' },
  rxPlus: { note: 'RX+: DL H 100kg / F 70kg. Rope Climbs legless. DU → 25 Triple Unders. Target sub 13min.' }
},
{
  day: 80, week: 16, name: 'LEVIATHAN', theme: 'OHS Lourd + Monstre des Profondeurs — AMRAP 22', hero: true,
  haltero: { name: 'Overhead Squat', desc: 'OHS: 4x3 @75%, 3x2 @82%, 2x1 @88%+. Prise large, hanches sous la barre, regard fixe.', scheme: 'E2MOM 14min — Force overhead Games', weights: 'overhead_squat' },
  wod: { name: 'LEVIATHAN', type: 'AMRAP 22 — HERO WOD', movements: [
    {name: 'Overhead Squats', reps: 7, weight: 'overhead_squat'},
    {name: 'Toes-to-bar', reps: 10, gymnastics: 'toes_to_bar'},
    {name: 'Cal Row', special: 'row_cal'},
    {name: 'Pistols', reps: 10, gymnastics: 'pistols'},
    {name: 'HSPU', reps: 8, gymnastics: 'hspu'}
  ], notes: 'LEVIATHAN — la bête des profondeurs qui dévore les faibles. Hero WOD AMRAP 22min Phase PEAK: 5 mouvements qui testent chaque fibre. OHS RX H 70kg / F 47kg = unbroken si technique solide, sinon 4+3. TTB 5-5 ou 10 unbroken (grip frais grâce aux OHS). Row 14/11 cal pace modéré (ne jamais sprinter sur les premières minutes). Pistols 5/jambe = balancez les bras, genou tracke le pied. HSPU 4+4 kipping ou strict si possible. Repos: respirez ENTRE les mouvements, jamais pendant. Cible: 4 rounds (élite 5+). Pace régulier = victoire sur LEVIATHAN. Le monstre déteste la régularité — montrez-lui que vous n\'avez pas peur. Row cal = 14/11 hommes/femmes. Chaque round ~5:00 = objectif parfait. Gardez le taux d\'effort à 80% les 12 premières minutes, puis libérez les 10 dernières.' },
  gym: { name: 'Skill: Pistol Squat Progressions', drills: ['3x5/jambe Pistol to box 40cm (travail excentrique)', '3x3/jambe Pistol complet (assisté si besoin)', '3x8/jambe Box Single Leg Squat (stepdown)', '3x10 Cossack Squat (mobilité adducteurs)'] },
  scaled: { movements: [{name: 'Overhead Squats', reps: 7, note: '→ 60% du RX ou Front Squats'}, {name: 'Pistols', reps: 10, note: '→ 10 Air Squats ou 5/jambe pistol assisté TRX'}, {name: 'HSPU', reps: 8, note: '→ Pike Push-ups ou DB Strict Press'}], note: 'Scaling: OHS → FS si mobilité insuffisante. Pistols → squat bulgare 5/jambe. HSPU → pike sur box. Row identique.' },
  rxPlus: { note: 'RX+: OHS H 84kg / F 57kg. Pistols = weighted (+5kg vest). HSPU strict 8 (no kip). Row +3 cal. Target 6+ rounds.' }
},
{
  day: 81, week: 17, name: 'TITAN-PEAK', theme: 'Squat Clean Max + Triplet Games',
  haltero: { name: 'Squat Clean', desc: 'Squat Clean: 3x2 @78%, 3x1 @85%, 2x1 @92%+. Full squat profond, catch bas, coudes rapides.', scheme: 'E2MOM 16min — Lourd Games-level progressif', weights: 'squat_clean' },
  wod: { name: 'TITAN-PEAK', type: '5 Rounds For Time (cap 20min)', movements: [
    {name: 'Squat Cleans', reps: 6, weight: 'squat_clean'},
    {name: 'Bar Muscle-ups', reps: 6, gymnastics: 'muscle_ups_bar'},
    {name: 'Run 400m', reps: 1, special: 'run_400'}
  ], notes: 'TITAN — force brute rencontre la beauté gymnique sur 5 rounds. Squat Cleans RX H 90kg / F 62kg. Stratégie: 6 Cleans en 2 séries de 3 TnG ou 3-2-1 selon fatigue — la profondeur du squat est non-négociable, pas de no-rep. Bar MU: 3-3 ou 2-2-2 selon le grip — kip efficace, transition nette des coudes. Run 400m à 88-92% — chaque run est un reset mental, respirez les 50 premiers mètres. Ne marchez JAMAIS sur le run. Repos entre rounds: 20-30s MAX. Round 4 et 5 = le caractère se révèle. Élite sub 15min, Avancé sub 19min. Le run permet de récupérer du grip mais brûle les cuisses pour les prochains Cleans — c\'est le piège de TITAN. Stratégie mentale: comptez vos reps à voix haute sur les MU, ça fixe la concentration. Respirez nasalement sur les runs.' },
  gym: { name: 'Skill: Bar MU Kip + Transition', drills: ['5x3 Kipping High Pull-ups (hanches à la barre)', '3x5 Bar MU transition drill (focus coudes)', '3x5 Strict C2B Pull-ups (lent)', '3x10 Strict Dips (parallettes ou barres)'] },
  scaled: { movements: [{name: 'Squat Cleans', reps: 6, note: '→ Power Cleans à 70% ou Hang Squat Cleans'}, {name: 'Bar Muscle-ups', reps: 6, note: '→ C2B Pull-ups x8 ou kipping pull-ups x10'}], note: 'Scaling: BMU → C2B kipping. Cleans = poids permettant 3 TnG minimum. Run = identique obligatoire.' },
  rxPlus: { note: 'RX+: Squat Cleans H 102kg / F 70kg. Bar MU strict. Target sub 14min.' }
},
{
  day: 82, week: 17, name: 'COLOSSUS-PEAK', theme: 'Snatch Lourd + AMRAP 20 Colosse',
  haltero: { name: 'Snatch', desc: 'Snatch: 4x2 @75%, 3x1 @82%, 2x1 @90%+. Tirage vertical maximal, catch amorti dans les genoux.', scheme: 'E90s x 9 sets — Volume + intensité Games', weights: 'snatch' },
  wod: { name: 'COLOSSUS-PEAK', type: 'AMRAP 20', movements: [
    {name: 'Power Snatches', reps: 5, weight: 'snatch'},
    {name: 'HSPU', reps: 8, gymnastics: 'hspu'},
    {name: 'Box Jumps', reps: 12, gymnastics: 'box_jump'},
    {name: 'Cal Assault Bike', reps: 15, special: 'assault_bike'},
    {name: 'Toes-to-bar', reps: 10, gymnastics: 'toes_to_bar'}
  ], notes: 'COLOSSUS — 5 mouvements, 20 minutes, intensité de stade. Snatches RX H 70kg / F 47kg = 5 singles rapides (pas de TnG lourd, focus technique propre). HSPU 4+4 kipping ou 8 unbroken si possible. Box Jumps 76/60cm step-down dès le round 3. Assault Bike 15/12 cal sprint 25-30s — gardez les talons bas sur les pédales. TTB 5-5 ou 10 unbroken. Pace global: 75-80% effort sur les 12 premières minutes, libérez tout sur les 8 dernières. Cible: 5 rounds (élite 7+). Gérez le système cardio-vasculaire: le Bike + la montée des TTB créent un pic d\'effort — soufflez 3s avant les snatches. Respirez sur les descentes de box jumps. N\'échouez jamais un snatch lourd par excès d\'ego — singles contrôlés > TnG ratés. Bike cal = 15/12.' },
  gym: { name: 'Skill: HSPU Kipping', drills: ['3x8 HSPU kipping (rythme)', '3x3 Strict HSPU (force pure)', '3x5 Deficit HSPU 1 abmat (mobilité épaule)', '3x20s Wall Walk (slow, controlé)'] },
  scaled: { movements: [{name: 'Power Snatches', reps: 5, note: '→ 50% du RX ou KB Snatch 5/bras'}, {name: 'HSPU', reps: 8, note: '→ Pike Push-ups ou DB Press debout'}, {name: 'Box Jumps', reps: 12, note: '→ Step-ups 50cm'}, {name: 'Cal Assault Bike', note: '→ 10/8 cal'}, {name: 'Toes-to-bar', reps: 10, note: '→ Knees-to-chest'}], note: 'Scaling: Snatches → charge permettant 5 singles solides. HSPU → pike. Box → step-ups. Garder 20min AMRAP.' },
  rxPlus: { note: 'RX+: Snatches H 80kg / F 54kg. HSPU strict 8. Box Jumps 84/72cm. Bike +4 cal. Target 8+ rounds.' }
},
{
  day: 83, week: 17, name: 'BEHEMOTH', theme: 'Back Squat + Mega-Chipper Games',
  haltero: { name: 'Back Squat', desc: 'Back Squat: 5x3 @80%, 3x2 @87%, 2x1 @94%+. Profondeur au-delà du parallèle, drive des genoux, plancher pelvien engagé.', scheme: 'E2MOM 16min — Near-max strength volume', weights: 'back_squat' },
  wod: { name: 'BEHEMOTH', type: 'For Time (cap 28min) — EPIC CHIPPER', movements: [
    {name: 'Run 800m', reps: 1, special: 'run_800'},
    {name: 'Wall Balls', reps: 50, gymnastics: 'wall_ball'},
    {name: 'Deadlifts', reps: 30, weight: 'deadlift'},
    {name: 'Double Unders', reps: 100, gymnastics: 'double_unders'},
    {name: 'Squat Cleans', reps: 20, weight: 'squat_clean'},
    {name: 'Toes-to-bar', reps: 30, gymnastics: 'toes_to_bar'},
    {name: 'HSPU', reps: 20, gymnastics: 'hspu'},
    {name: 'Ring Muscle-ups', reps: 10, gymnastics: 'muscle_ups_ring'},
    {name: 'Run 400m', reps: 1, special: 'run_400'}
  ], notes: 'BEHEMOTH — le chipper épique ultime de la phase PEAK. Ouverture Run 800m à 80% (ne JAMAIS sprinter). WB 20-20-10 (chair haute, balle au-dessus du target). DL 10-10-10 touche-et-pose. DU 50-50 ou unbroken (soufflez avant). Squat Cleans 5-5-5-5 singles (chaque rep compte). TTB 10-10-10. HSPU 5-5-5-5. Ring MU: 2-2-2-2-2 = 5 doublets, repos 15s entre chaque. Run final 400m: tout ce qu\'il reste dans le moteur. Volume total: 1200m run + 50 WB + 30 DL + 100 DU + 20 SC + 30 TTB + 20 HSPU + 10 RMU. Gestion du carburant critique: mangez votre pace WB et DL pour tenir en fin de chipper. Élite sub 22min. Avancé sub 26min. Ce chipper représente la synthèse de 83 jours d\'entraînement — chaque mouvement raconte une semaine de sueur.' },
  gym: { name: 'Skill: Ring MU Technique', drills: ['3x3 Strict Ring MU (faux grip)', '5x2 Kipping Ring MU (transition hips)', '3x5 Ring Dips profonds (pause bas)', '3x8 Ring Rows feet elevated (strict)'] },
  scaled: { movements: [{name: 'Wall Balls', reps: 50, note: '→ 35 reps ou 4/3 kg'}, {name: 'Deadlifts', reps: 30, note: '→ 20 reps ou 60% du RX'}, {name: 'Double Unders', reps: 100, note: '→ 200 Single Unders ou 60 DU'}, {name: 'Squat Cleans', reps: 20, note: '→ 15 Power Cleans ou 60% du poids'}, {name: 'HSPU', reps: 20, note: '→ 14 Pike Push-ups'}, {name: 'Ring Muscle-ups', reps: 10, note: '→ 15 C2B Pull-ups ou 20 kipping pull-ups'}], note: 'Scaling chipper: réduire volumes ET poids (-30%). Structure identique. Run = intouchable.' },
  rxPlus: { note: 'RX+: DL H 120kg / F 85kg. Squat Cleans H 90kg / F 60kg. HSPU strict 20. RMU strict 10. Target sub 19min.' }
},
{
  day: 84, week: 17, name: 'APOCALYPSE', theme: 'Deadlift Lourd + WOD de Jugement Dernier', hero: true,
  haltero: { name: 'Deadlift', desc: 'Deadlift: 3x5 @78%, 2x3 @85%, 3x1 @92%+. Barre collée aux tibias, drive talons, verrouillage haut complet.', scheme: 'E2MOM 16min — Force brute maximale', weights: 'deadlift' },
  wod: { name: 'APOCALYPSE', type: 'AMRAP 18 — HERO WOD', movements: [
    {name: 'Deadlifts', reps: 7, weight: 'deadlift'},
    {name: 'Burpees over bar', reps: 7, gymnastics: 'burpee'},
    {name: 'Rope Climbs', reps: 2, gymnastics: 'rope_climb'},
    {name: 'Cal Assault Bike', reps: 16, special: 'assault_bike'},
    {name: 'Handstand Walk', reps: 25, gymnastics: 'handstand_walk'}
  ], notes: 'APOCALYPSE — le WOD du Jugement Dernier. Hero WOD AMRAP 18min Phase PEAK semaine 17. Deadlifts RX H 120kg / F 82kg = touch-and-go 4+3 ou 7 singles si charge très lourde. Burpees over bar RAPIDES — élan, saut, landing, retournement. Rope Climbs: technique leglock, 2 pulls max par montée, descente contrôlée. Assault Bike 16/13 cal sprint 25s. Handstand Walk 25m ou 25 shoulder taps en HS si marche insuffisante. Cible: 4+ rounds (élite 6+). Gestion glycolytique: le Bike + les Rope Climbs sont les goulots d\'étranglement. Ne ratez JAMAIS un DL avec dos arrondi. Le Burpee est le reset mental entre chaque mouvement lourd. APOCALYPSE récompense ceux qui gardent la technique sous la fatigue. Élite sub 3:00/round. Votre legacy se construit ici.' },
  gym: { name: 'Skill: Handstand Walk', drills: ['5x5m Handstand Walk (focus balance latérale)', '3x3m Handstand Walk obstacle course', '3x30s Wall-Facing HS Hold (chest au mur)', '3x10 Shoulder Taps en HS (alternés)'] },
  scaled: { movements: [{name: 'Deadlifts', reps: 7, note: '→ 70% du RX ou 5 reps'}, {name: 'Rope Climbs', reps: 2, note: '→ 1 Rope Climb ou 8 Ring Rows strictes'}, {name: 'Handstand Walk', reps: 25, note: '→ 25 shoulder taps au mur ou 5 wall walks'}], note: 'Scaling: DL = back neutre obligatoire. Rope → ring rows si pas acquis. HS Walk → shoulder taps.' },
  rxPlus: { note: 'RX+: DL H 140kg / F 95kg. Rope Climbs legless. HS Walk 15m (no taps). Bike +4 cal. Target 7+ rounds.' }
},
{
  day: 85, week: 17, name: 'WARMASTER', theme: 'Push Press + Maître de la Guerre AMRAP 22',
  haltero: { name: 'Push Press', desc: 'Push Press: 4x3 @80%, 3x2 @87%, 2x1 @93%+. Dip rapide, drive des jambes, lock-out overhead parfait.', scheme: 'E2MOM 14min — Near-max overhead strength', weights: 'push_press' },
  wod: { name: 'WARMASTER', type: 'AMRAP 22', movements: [
    {name: 'Push Press', reps: 8, weight: 'push_press'},
    {name: 'Pull-ups', reps: 12, gymnastics: 'pullups'},
    {name: 'KB Swings', reps: 20, gymnastics: 'kb_swing'},
    {name: 'Box Jumps', reps: 15, gymnastics: 'box_jump'},
    {name: 'Double Unders', reps: 40, gymnastics: 'double_unders'},
    {name: 'Cal Row', special: 'row_cal'}
  ], notes: 'WARMASTER — 6 mouvements, 22 minutes, maîtrise absolue du conditionnement. Push Press RX H 75kg / F 52kg = 4+4 ou 8 unbroken si charge légère. Pull-ups butterfly 12 unbroken ou 6-6 kipping. KB Swings americains 32/24kg = 10-10 ou unbroken. Box Jumps 76/60cm step-down après round 3. DU 40 unbroken = objectif permanent, aucune pause. Row 14/11 cal pace aérobie (120 SPM). Stratégie globale: rounds à 3:30-3:45 = 6 rounds possibles. Élite 7+ rounds. N\'accélérez PAS sur le premier round — vous aurez 18+ min à gérer. Le Row est le seul moment de vraie récupération du système cardio. Respirez nasalement sur les KB Swings. La fatigue overhead (PP + pull-ups) va compromettre les DU — anticipez en soufflant 5s avant la corde. WARMASTER récompense la patience stratégique.' },
  gym: { name: 'Skill: Kipping Pull-up + Butterfly', drills: ['3x10 Kipping Pull-ups (rythme)', '3x5 Butterfly Pull-ups (drill lent)', '3x Max Butterfly unbroken (test)', '3x10 Band Pull-Aparts (récup épaules)'] },
  scaled: { movements: [{name: 'Push Press', reps: 8, note: '→ 60% du RX ou DB Push Press'}, {name: 'Pull-ups', reps: 12, note: '→ Banded kipping ou 15 ring rows'}, {name: 'KB Swings', reps: 20, note: '→ 16/12 kg russes'}, {name: 'Box Jumps', reps: 15, note: '→ Step-ups 50cm'}, {name: 'Double Unders', reps: 40, note: '→ 80 Single Unders'}, {name: 'Cal Row', note: '→ 10/8 cal'}], note: 'Scaling: toutes les charges à 60-70%. Garder 22min AMRAP = même durée, moins d\'intensité.' },
  rxPlus: { note: 'RX+: Push Press H 88kg / F 60kg. Pull-ups C2B. KB 40/28kg. Box 84/72cm. DU → 20 Triple Unders. Target 8+ rounds.' }
},
{
  day: 86, week: 18, name: 'ETERNAL', theme: 'Clean & Jerk + Éternel AMRAP 20',
  haltero: { name: 'Clean & Jerk', desc: 'Clean & Jerk: 1 Squat Clean + 1 Split Jerk, 5x1 @85%, 3x1 @92%+. Barre collée au corps, catch bas, split jerk profond.', scheme: 'E2MOM 16min — Complexe Games-level', weights: 'clean' },
  wod: { name: 'ETERNAL', type: 'AMRAP 20', movements: [
    {name: 'Squat Cleans', reps: 4, weight: 'squat_clean'},
    {name: 'HSPU', reps: 10, gymnastics: 'hspu'},
    {name: 'Toes-to-bar', reps: 12, gymnastics: 'toes_to_bar'},
    {name: 'Cal Assault Bike', reps: 15, special: 'assault_bike'},
    {name: 'Bar Muscle-ups', reps: 4, gymnastics: 'muscle_ups_bar'}
  ], notes: 'ETERNAL — le WOD qui ne finit jamais, la souffrance qui forge l\'éternité. Phase PEAK semaine 18, début de la phase finale. Squat Cleans RX H 95kg / F 65kg = 2+2 ou singles si très lourd. HSPU 5+5 kipping ou strict. TTB 6-6 ou 12 unbroken. Assault Bike 15/12 cal sprint 25s. Bar MU: 2-2 ou 4 unbroken si possible. Cible: 5 rounds (élite 7+). Gestion énergie critique: les Cleans fatigues les trapèzes et les avant-bras pour les BMU — ordre stratégique redoutable. Soufflez après les Cleans, repositionnez les mains avant les HSPU. Le Bike est le seul moment cyclique = récupération partielle. TTB avant le Bike = core déjà chaud. BMU en fin de round = technique pure nécessaire. Élite sub 2:50/round. ETERNAL teste si vous avez assimilé 86 jours de programmation — montrez que vous avez tout retenu.' },
  gym: { name: 'Skill: Bar MU + Clean Complex', drills: ['3x3 Clean Pull + Power Clean (focus barre au corps)', '5x2 Bar MU kip rapide', '3x5 Strict C2B (force latissimus)', '3x10 L-Sit Hold parallettes (core)'] },
  scaled: { movements: [{name: 'Squat Cleans', reps: 4, note: '→ Power Cleans à 70% ou Hang Squat Cleans'}, {name: 'HSPU', reps: 10, note: '→ Pike Push-ups sur box'}, {name: 'Bar Muscle-ups', reps: 4, note: '→ 6 C2B Pull-ups ou 8 kipping pull-ups'}, {name: 'Cal Assault Bike', note: '→ 11/9 cal'}], note: 'Scaling: Cleans = profondeur squat garde. HSPU → pike. BMU → C2B. Bike = effort relatif identique.' },
  rxPlus: { note: 'RX+: Squat Cleans H 108kg / F 74kg. HSPU strict 10. BMU strict. Bike +4 cal. Target 8+ rounds.' }
},
{
  day: 87, week: 18, name: 'INFERNAL', theme: 'Back Squat + Chipper Infernal Final', hero: true,
  haltero: { name: 'Back Squat', desc: 'Back Squat: 3x3 @85%, 2x2 @91%, 3x1 @96%+. Effort maximal absolu — test de force brute de la phase PEAK.', scheme: 'E2MOM 16min — Max strength test', weights: 'back_squat' },
  wod: { name: 'INFERNAL', type: 'For Time (cap 30min) — HERO EPIC CHIPPER', movements: [
    {name: 'Run 800m', reps: 1, special: 'run_800'},
    {name: 'Deadlifts', reps: 40, weight: 'deadlift'},
    {name: 'Wall Balls', reps: 50, gymnastics: 'wall_ball'},
    {name: 'Double Unders', reps: 150, gymnastics: 'double_unders'},
    {name: 'Power Cleans', reps: 30, weight: 'power_clean'},
    {name: 'Toes-to-bar', reps: 40, gymnastics: 'toes_to_bar'},
    {name: 'HSPU', reps: 25, gymnastics: 'hspu'},
    {name: 'Rope Climbs', reps: 5, gymnastics: 'rope_climb'},
    {name: 'Ring Muscle-ups', reps: 15, gymnastics: 'muscle_ups_ring'},
    {name: 'Run 400m', reps: 1, special: 'run_400'}
  ], notes: 'INFERNAL — le chipper final de la phase PEAK, le test ultime de 87 jours de programmation. Hero WOD intemporel. Run 800m à 78% (JAMAIS plus — vous avez un abîme devant vous). DL 40 reps H 100kg / F 68kg = séries de 10, repos 10s entre, dos NEUTRE TOUJOURS. WB 50 reps = 10-10-10-10-10. DU 150 unbroken objectif ou 50-50-50 avec pauses courtes. Power Cleans H 75kg / F 52kg = 5x6 TnG ou 10-10-10 singles. TTB 10-10-10-10. HSPU 5-5-5-5-5. Rope Climbs 1 à la fois, repos 20s entre, technique leglock. Ring MU 3-3-3-3-3 = 5 triplets, repos 15s. Run final 400m: vider absolument tout, rien en réserve. Volume colossal: 1200m run + 40 DL + 50 WB + 150 DU + 30 PC + 40 TTB + 25 HSPU + 5 Rope + 15 RMU + 400m. Élite sub 24min. Avancé sub 28min. INFERNAL n\'est pas vaincu par la force — il est vaincu par la stratégie, la patience et la volonté absolue. Vous avez tout ce qu\'il faut. Chaque mouvement raconte une semaine. Chaque rep vaut un entraînement entier.' },
  gym: { name: 'Skill: Full Body Recovery Activation', drills: ['3x5 Muscle Snatch léger (activation overhead)', '3x5 Deadlift @50% (activation dos)', '3x5 Kipping Pull-ups (activation gymnique)', '5min Row Zone 1 + 5min stretching dynamique'] },
  scaled: { movements: [{name: 'Deadlifts', reps: 40, note: '→ 25 reps ou 60% du RX'}, {name: 'Wall Balls', reps: 50, note: '→ 35 reps ou 4/3 kg'}, {name: 'Double Unders', reps: 150, note: '→ 300 SU ou 80 DU'}, {name: 'Power Cleans', reps: 30, note: '→ 20 reps ou 60% du RX'}, {name: 'Toes-to-bar', reps: 40, note: '→ 25 KTC ou leg raises strictes'}, {name: 'HSPU', reps: 25, note: '→ 15 Pike Push-ups ou 12 HSPU'}, {name: 'Rope Climbs', reps: 5, note: '→ 3 Rope Climbs ou 20 Ring Rows'}, {name: 'Ring Muscle-ups', reps: 15, note: '→ 20 C2B Pull-ups ou 25 kipping pull-ups'}], note: 'Scaling chipper INFERNAL: réduire tous les volumes de 30-40% ET les charges de 30%. Garder la structure chipper complète — 10 sections.' },
  rxPlus: { note: 'RX+: DL H 120kg / F 82kg. Power Cleans H 88kg / F 60kg. Rope Climbs legless. RMU strict. HSPU strict 25. Target sub 21min.' }
},

// ============ WEEK 18 — PEAK PHASE FINALE ============
{
  day: 88, week: 18, name: 'TSUNAMI', theme: 'Snatch Lourd + Intervalles Vagues',
  haltero: { name: 'Snatch Montée Max', desc: 'Snatch 2-2-1-1-1-1-1 — Build to 95%+. Technique parfaite. Chaque lift comme en compétition.', scheme: 'E2MOM 14min — Build agressif vers daily max', weights: 'snatch' },
  wod: { name: 'TSUNAMI', type: '5 Rounds — 2min ON / 1min REST', movements: [
    {name: 'Power Snatches', reps: 7, weight: 'snatch'},
    {name: 'Burpee over bar', reps: 9, gymnastics: 'burpee'},
    {name: 'Chest-to-Bar Pull-ups', reps: 9, gymnastics: 'c2b_pullups'}
  ], notes: 'Le tsunami — vagues explosives. Power Snatches 65-70% TnG. Burpees pace 12/min. C2B kipping efficace. Score = total reps. Pace identique chaque vague = champions.' },
  gym: { name: 'Skill: Snatch Turnover Speed', drills: ['5x2 Muscle Snatch @50% vitesse', '3x3 Power Snatch + 3 OHS complexe', '4x2 Snatch Grip Push Press', '3x1 Snatch from blocks @80%'] },
  scaled: { movements: [{name: 'Power Snatches', reps: 7, note: '55% du 1RM ou DB Snatch'}, {name: 'Burpee over bar', reps: 9, note: 'meme rythme, étape latérale OK'}, {name: 'C2B Pull-ups', reps: 9, note: 'Pull-ups kipping ou ring rows x12'}], note: 'Scaling: rythme constant 5 rounds priorité.' },
  rxPlus: { note: 'RX+: 9 Snatches @75%, 12 Burpees, 12 C2B strict. Target 70+ reps total.' }
},
{
  day: 89, week: 18, name: 'DARKSTAR', theme: 'Thruster Lourd + Dark Couplet Descend',
  haltero: { name: 'Thruster Peak', desc: 'Thruster 5-3-2-1-1 — Build vers max quotidien. TnG obligatoire. Descente contrôlée, drive explosif des hanches.', scheme: 'E2MOM 10min — Peak quotidien', weights: 'thruster' },
  wod: { name: 'DARKSTAR', type: 'For Time (cap 15min)', movements: [
    {name: 'Thrusters', reps: 30, weight: 'thruster'},
    {name: 'Legless Rope Climbs', reps: 5, gymnastics: 'rope_climb'},
    {name: 'Thrusters', reps: 20, weight: 'thruster'},
    {name: 'Rope Climbs', reps: 3, gymnastics: 'rope_climb'},
    {name: 'Thrusters', reps: 10, weight: 'thruster'},
    {name: 'Rope Climb', reps: 1, gymnastics: 'rope_climb'}
  ], notes: 'Darkstar — 63 reps descendo. Thrusters 43/29kg Games RX. 30=10-10-10. Legless rope climbs = test de force ultime. Sub 10min = CrossFit Games level. Sub 12min = excellent.' },
  gym: { name: 'Skill: Rope Climb Legless', drills: ['5x1 Legless Rope Climb puissant', '3x Rope Climb descent lente 4s', '3x3 L-sit Rope Climb', '3x8 Strict Weighted Pull-ups +10kg'] },
  scaled: { movements: [{name: 'Thrusters', reps: 30, note: '30kg/20kg'}, {name: 'Legless', reps: 5, note: 'Rope Climbs avec pieds x5'}, {name: 'Rope Climbs', reps: 3, note: '3 climbs ou 15 Ring Rows'}], note: 'Scaling: poids thrusters 60% RX.' },
  rxPlus: { note: 'RX+: Thrusters 52/35kg. Tous legless. HSPU x5 après chaque série rope. Target sub 11min.' }
},
{
  day: 90, week: 18, name: 'PRAETORIAN', theme: 'Complexe Clean & Jerk + Warrior Chipper',
  haltero: { name: 'Clean & Jerk Complex Lourd', desc: '1 Squat Clean + 1 Hang Squat Clean + 1 Split Jerk. Build vers 90-95%. Maîtrise technique sous charge max.', scheme: 'E2MOM 12min — Build to 90-95%', weights: 'clean' },
  wod: { name: 'PRAETORIAN', type: 'For Time (cap 28min)', movements: [
    {name: 'Cal Row', reps: 50, special: 'row_cal'},
    {name: 'Deadlifts', reps: 30, weight: 'deadlift'},
    {name: 'HSPU', reps: 20, gymnastics: 'hspu'},
    {name: 'Power Cleans', reps: 15, weight: 'power_clean'},
    {name: 'Bar Muscle-ups', reps: 10, gymnastics: 'muscle_ups_bar'},
    {name: 'Thrusters', reps: 5, weight: 'thruster'}
  ], notes: 'Praetorian — chipper 6 sections. Row 1:55/500m. DL 5x6 TnG. HSPU 4x5 unbroken. Power Cleans 5-5-5 à 80%. BMU 2-2-2-2-2. Thrusters unbroken. Sub 22min = niveau Games.' },
  gym: { name: 'Skill: Bar Muscle-up Endurance', drills: ['EMOM 12: Min1 3 BMU / Min2 5 HSPU / Min3 10 C2B', '3x3 Slow BMU transition 2s catch', '3x5 BMU kipping amplitude', '3x3 Strict BMU force'] },
  scaled: { movements: [{name: 'Cal Row', reps: 50, note: '40 cal'}, {name: 'HSPU', reps: 20, note: 'Pike Push-ups x25'}, {name: 'Bar Muscle-ups', reps: 10, note: '20 C2B ou 15 kipping pull-ups'}], note: 'Scaling: maintenir structure chipper, ajuster charges 30%.' },
  rxPlus: { note: 'RX+: Row 60 cal, HSPU strict x20, BMU strict x10, DL +10%. Target sub 19min.' }
},

// ============ WEEK 19 — PEAK ABSOLUTE ============
{
  day: 91, week: 19, name: 'ANVIL', theme: 'Front Squat 1RM + Forge Quintuplet',
  haltero: { name: 'Front Squat Daily Max', desc: 'Front Squat 3-2-1-1-1 — Nouveau PR quotidien. Position parfaite, coudes hauts. Descente 2s, drive explosif.', scheme: 'E3MOM 15min — Build vers 100%+', weights: 'front_squat' },
  wod: { name: 'ANVIL', type: '5 Rounds For Time (cap 18min)', movements: [
    {name: 'Front Squats', reps: 7, weight: 'front_squat'},
    {name: 'Handstand Push-ups', reps: 7, gymnastics: 'hspu'},
    {name: 'KB Swings', reps: 14, gymnastics: 'kb_swing'},
    {name: 'Toes-to-bar', reps: 7, gymnastics: 'toes_to_bar'}
  ], notes: 'Anvil — 5 rounds. Front Squats TnG 4-3. HSPU 3-2-2. KBS hanches explosives. TTB 5-2. Sub 14min = maîtrise absolue.' },
  gym: { name: 'Skill: Front Squat + HSPU', drills: ['3x5 Front Squat paused 3s @60%', '3x3 Strict HSPU', '3x5 Deficit HSPU 7.5cm', '5min Wrist + thoracic mobility'] },
  scaled: { movements: [{name: 'Front Squats', reps: 7, note: 'Goblet ou @60%'}, {name: 'HSPU', reps: 7, note: 'Pike Push-ups sur box'}, {name: 'KBS', reps: 14, note: 'KB russe si overhead limité'}], note: 'Scaling: 5 rounds complets est le seul objectif.' },
  rxPlus: { note: 'RX+: Front Squats +10kg, HSPU strict, KBS 32/24kg, TTB strict. Target sub 12min.' }
},
{
  day: 92, week: 19, name: 'SPECTER', theme: 'Snatch Complex + Phantom Chipper',
  haltero: { name: 'Snatch Complex Peak', desc: '1 Snatch Pull + 1 Low Hang Snatch + 1 Full Snatch. Build vers 90%. Chaque phase du snatch corrigée.', scheme: 'Every 90s x 10 sets — Build progressif', weights: 'snatch' },
  wod: { name: 'SPECTER', type: 'For Time (cap 22min)', movements: [
    {name: 'Power Snatches', reps: 21, weight: 'snatch'},
    {name: 'Pistol Squats', reps: 21, gymnastics: 'pistols'},
    {name: 'Cal Assault Bike', reps: 25, special: 'assault_bike'},
    {name: 'Handstand Walk', reps: '15m', gymnastics: 'handstand_walk'},
    {name: 'Wall Balls 9kg', reps: 30, gymnastics: 'wall_ball'}
  ], notes: 'Specter — 5 épreuves Games-level. Snatches 21 en 7-7-7. Pistols alternés. Assault Bike 85%. HS Walk 5m segments. WB 9kg en 10-10-10. Sub 18min = champion.' },
  gym: { name: 'Skill: Handstand Walk Précision', drills: ['5x5m HS Walk ligne droite', '3x HS Walk autour de 4 cônes', '3x Turn-around en HS Walk', '3x5m HS Walk yeux fermés'] },
  scaled: { movements: [{name: 'Power Snatches', reps: 21, note: '14 reps ou 65% RX'}, {name: 'Pistols', reps: 21, note: 'Box Pistols ou split squats'}, {name: 'HS Walk', reps: '15m', note: '15 HSPU ou box walk'}], note: 'Scaling: HS Walk remplacable, reste incontournable.' },
  rxPlus: { note: 'RX+: Snatches full squat x21. Pistols vest +10kg. HS Walk 20m. WB 11kg. Target sub 16min.' }
},
{
  day: 93, week: 19, name: 'HELLHOUND', theme: 'Deadlift Near-Max + AMRAP Sauvage',
  haltero: { name: 'Deadlift Peak Week', desc: 'Deadlift 3-2-1-1-1 — Build vers 97-100%+. Setup rituel, tension créée, back braced. PR potentiel = signal peak positif.', scheme: 'E3MOM 15min — Agressif et technique', weights: 'deadlift' },
  wod: { name: 'HELLHOUND', type: 'AMRAP 20min', movements: [
    {name: 'Deadlifts', reps: 10, weight: 'deadlift'},
    {name: 'Box Jumps 76cm', reps: 12, gymnastics: 'box_jump'},
    {name: 'Toes-to-bar', reps: 10, gymnastics: 'toes_to_bar'},
    {name: 'Cal Row', reps: 15, special: 'row_cal'}
  ], notes: 'Hellhound — AMRAP 20min brutal. DL modérés TnG 5-5. Box Jumps 76cm atterrissage souple. TTB 5-5. Row 1:55-2:00. 6+ rounds = CrossFit athlete. 7+ rounds = champion. Repos max 15 secondes.' },
  gym: { name: 'Skill: Toes-to-bar Efficiency', drills: ['3x15 TTB kipping unbroken', '3x10 Strict TTB', '3x10 L-hang pulses', '3x20 Hollow rocks'] },
  scaled: { movements: [{name: 'Deadlifts', reps: 10, note: '60-70% RX ou 8 reps'}, {name: 'Box Jumps', reps: 12, note: '60cm ou step-ups'}, {name: 'TTB', reps: 10, note: 'KTC ou leg raises'}], note: 'Scaling: 20min reste, réduire intensité pas durée.' },
  rxPlus: { note: 'RX+: DL +10%, Box Jumps 85cm, TTB strict, Row 20 cal. Target 8+ rounds.' }
},
{
  day: 94, week: 19, name: 'MOLTEN', theme: 'Hang Clean Max + Trio Explosif',
  haltero: { name: 'Hang Squat Clean Daily Max', desc: 'Hang Squat Clean 2-2-1-1-1-1 — Daily max. Objectif: 95%+ du squat clean du sol.', scheme: 'E2MOM 12min — Build agressif', weights: 'hang_clean' },
  wod: { name: 'MOLTEN', type: '4 Rounds For Time (cap 22min)', movements: [
    {name: 'Hang Squat Cleans', reps: 10, weight: 'hang_clean'},
    {name: 'Strict HSPU', reps: 8, gymnastics: 'hspu'},
    {name: 'Double Unders', reps: 60, gymnastics: 'double_unders'},
    {name: 'Chest-to-Bar Pull-ups', reps: 15, gymnastics: 'c2b_pullups'}
  ], notes: 'Molten — 4 rounds. Hang Cleans 5-5. Strict HSPU 4-2-2. DU unbroken 60 = maîtrise. C2B 5-5-5. Sub 18min. Dans 6 jours: RAGNAROK.' },
  gym: { name: 'Skill: Strict HSPU Progressions', drills: ['4x3 Strict HSPU', '3x3 Deficit Strict HSPU 5cm', '3x5 HSPU kipping', '3x20s HS Hold freestanding'] },
  scaled: { movements: [{name: 'Hang Squat Cleans', reps: 10, note: 'Power Hang Clean ou 60% RX'}, {name: 'Strict HSPU', reps: 8, note: 'HSPU kipping ou Pike Push-ups x12'}, {name: 'DU', reps: 60, note: '120 SU ou 40 DU'}, {name: 'C2B', reps: 15, note: 'Kipping Pull-ups ou band C2B'}], note: 'Scaling: 4 rounds complets est priorité.' },
  rxPlus: { note: 'RX+: +8kg, Strict HSPU x8, DU 60 unbroken, C2B butterfly strict. Target sub 15min.' }
},
{
  day: 95, week: 19, name: 'WARDOG', theme: 'Back Squat Peak 1RM + Final Boss',
  haltero: { name: 'Back Squat 1RM Absolu', desc: 'Back Squat 3-2-1-1-1-1-1 — PR attempt. Semaine 19 derniere chance avant taper. Neural drive maximal. Allez chercher un PR.', scheme: 'E3MOM 21min — Toutes tentatives comptent', weights: 'back_squat' },
  wod: { name: 'WARDOG', type: 'For Time (cap 22min)', movements: [
    {name: 'Back Squats', reps: 21, weight: 'back_squat'},
    {name: 'Bar Muscle-ups', reps: 12, gymnastics: 'muscle_ups_bar'},
    {name: 'Back Squats', reps: 15, weight: 'back_squat'},
    {name: 'Bar Muscle-ups', reps: 9, gymnastics: 'muscle_ups_bar'},
    {name: 'Back Squats', reps: 9, weight: 'back_squat'},
    {name: 'Bar Muscle-ups', reps: 6, gymnastics: 'muscle_ups_bar'}
  ], notes: 'Wardog — dernier WOD lourd avant taper. BS 70-75%. 21=7-7-7. 15=5-5-5. 9=unbroken. BMU 3-3-3-3. Sub 17min = guerrier. Chaque rep renforce pour Day 100.' },
  gym: { name: 'Skill: Bar Muscle-up Transitions', drills: ['3x3 Strict Bar Muscle-ups', '3x3 BMU negatives lentes', '5x1-2 BMU kipping puissant', '3x5 Weighted Dips +20kg'] },
  scaled: { movements: [{name: 'Back Squats', reps: 21, note: '60-65% RX ou 15 reps'}, {name: 'Bar Muscle-ups', reps: 12, note: '20 C2B ou 24 kipping'}, {name: 'BMU 9', reps: 9, note: '15 C2B ou banded BMU'}], note: 'Scaling: réduire charges et volumes. Finir sous le cap.' },
  rxPlus: { note: 'RX+: Back Squats @80%. BMU strict tous sets. Target sub 14min. Dernier boss avant taper.' }
},
// ============ WEEK 20 — TAPER + PEAK ============
// Semaine 20 = TAPER PEAK. Volume progressivement réduit S20 pour pic de performance.
// Principes: D96=volume -60%, D97=volume -50%, D98=activation légère, D99=prépa mentale+skill, D100=THE FINALE
// Ne pas ajouter de fatigue — conserver l'énergie pour le Day 100 ARMAGEDDON
{
  day: 96, week: 20, name: 'ODIN', theme: 'Taper J1 — Activation Clean & Jerk + EMOM Court', taper: true,
  haltero: { name: 'Clean & Jerk Technique', desc: 'Clean & Jerk 5x1 @70% — Chaque rep technique parfaite. Volume -60%, fraicheur maximale.', scheme: 'E3MOM x 5 — Recuperation complete entre sets', weights: 'clean' },
  wod: { name: 'ODIN', type: 'EMOM 10min', movements: [
    {name: 'Min 1-5: Power Cleans', reps: 3, weight: 'power_clean'},
    {name: 'Min 2-6: Toes-to-bar', reps: 5, gymnastics: 'toes_to_bar'},
    {name: 'Min 3-7: Wall Balls', reps: 7, gymnastics: 'wall_ball'},
    {name: 'Min 4-8: Double Unders', reps: 20, gymnastics: 'double_unders'},
    {name: 'Min 5-10: Pull-ups', reps: 5, gymnastics: 'pullups'}
  ], notes: 'TAPER Jour 1 — 4 jours avant RAGNAROK. Volume -60% intentionnel : votre corps accumule de l\'energie pour la bataille finale. EMOM 10min leger, pas de sprint. Chaque rep est executee avec precision et confiance. Vos systemes nerveux et musculaires se rechargent. Ressentez la puissance qui monte. Dans 4 jours, vous unleashcez tout ce travail accumule sur 100 jours.' },
  gym: { name: 'Skill: Rope Climb Technique', drills: ['3x1 Rope Climb (technique jambes — lent)', '3x5 Strict Pull-ups (activation lats)', '5min Foam Roll thoracique + epaules', '5min Visualisation: imaginez RAGNAROK section par section'] },
  scaled: { movements: [{name: 'Power Cleans', reps: 3, note: '-> 60% 1RM ou hang power clean'}, {name: 'Toes-to-bar', reps: 5, note: '-> Knees-to-chest decontractes'}, {name: 'Wall Balls', reps: 7, note: '-> 4/3 kg leger'}], note: 'Scaling Taper J1: tout doit rester confortable. Si un mouvement tire, reduire encore. Objectif = actif, pas fatigue.' },
  rxPlus: { note: 'RX+ Taper: memes reps, +5kg Power Clean uniquement. Ne pas aller plus loin — le taper est intentionnel.' }
},
{
  day: 97, week: 20, name: 'FREYR', theme: 'Taper J2 — Snatch Precision + WOD 8min', taper: true,
  haltero: { name: 'Snatch Technique de Precision', desc: 'Snatch 5x1 @65% — Volume -50%. Focus technique: position basse, reception stable, overhead solide.', scheme: 'E3MOM x 5 — Qualite absolue, zero fatigue', weights: 'snatch' },
  wod: { name: 'FREYR', type: 'For Time (cap 8min)', movements: [
    {name: 'Power Snatches', reps: 5, weight: 'snatch'},
    {name: 'Box Jumps', reps: 8, gymnastics: 'box_jump'},
    {name: 'Power Snatches', reps: 4, weight: 'snatch'},
    {name: 'Burpees over bar', reps: 6, gymnastics: 'burpee'},
    {name: 'Power Snatches', reps: 3, weight: 'snatch'},
    {name: 'Double Unders', reps: 30, gymnastics: 'double_unders'}
  ], notes: 'TAPER Jour 2 — 3 jours avant RAGNAROK. WOD 8min maximum : corps economise, systeme nerveux central preservé. Snatches legers a 65% = fluidite et rythme, pas d\'effort maximum. Box jumps explosifs mais controles. Le but est d\'activer les fibres rapides sans les epuiser. Ce soir : proteines 2g/kg, glucides complexes, sommeil 9 heures. Chaque heure de sommeil forge un guerrier pour RAGNAROK.' },
  gym: { name: 'Skill: Snatch Balance + Mobilite', drills: ['4x2 Snatch Balance @50% (vitesse sous la barre)', '3x5 OHS pause 3s en bas @40%', '5min Bandes epaules + thoracique', '5min Hanche + cheville mobilite active'] },
  scaled: { movements: [{name: 'Power Snatches', reps: 5, note: '-> 55% 1RM ou KB snatch'}, {name: 'Box Jumps', reps: 8, note: '-> Step-ups explosifs 50cm'}, {name: 'Double Unders', reps: 30, note: '-> 60 Single Unders'}], note: 'Scaling Taper J2: aucun mouvement ne doit brûler. Si c\'est dur, c\'est trop lourd. Taper = recharge, pas performance.' },
  rxPlus: { note: 'RX+ Taper: Snatch @70%, Box Jumps 75cm, DU unbroken 30. Cap 8min respecte imperative.' }
},
{
  day: 98, week: 20, name: 'THOR', theme: 'Taper J3 — Squat Clean @65% + AMRAP 8min Activation', taper: true,
  haltero: { name: 'Squat Clean Activation', desc: 'Squat Clean 4x1 @65% — Activation neuromusculaire pure. Jambes rechargées, explosivite conservée.', scheme: 'E3MOM x 4 — Leger mais explosif a chaque rep', weights: 'squat_clean' },
  wod: { name: 'THOR', type: 'AMRAP 8min', movements: [
    {name: 'Squat Cleans', reps: 2, weight: 'squat_clean'},
    {name: 'Toes-to-bar', reps: 4, gymnastics: 'toes_to_bar'},
    {name: 'Box Jumps', reps: 5, gymnastics: 'box_jump'},
    {name: 'Double Unders', reps: 15, gymnastics: 'double_unders'}
  ], notes: 'TAPER Jour 3 — 2 jours avant RAGNAROK. AMRAP 8min tres leger : 2 squat cleans seulement par round, tout reste frais. Squat Cleans @65% = activation parfaite sans brûler les quadriceps. Votre corps est une arme chargee a bloc. Ce soir, nutrition critique : 6g glucides/kg bodyweight (riz, pates, patate douce), 2g proteines/kg, 3L eau. Dormez 9 heures. Dans 48 heures commence la legende.' },
  gym: { name: 'Skill: Box Jump + Pistols Activation', drills: ['3x3 Box Jumps reactifs (focus atterrissage souple)', '3x3/jambe Pistols (activation mollets et fessiers)', '5min Easy Assault Bike zone 1', '10min Stretching complet + foam roll'] },
  scaled: { movements: [{name: 'Squat Cleans', reps: 2, note: '-> 60% 1RM ou goblet squat lourd'}, {name: 'Toes-to-bar', reps: 4, note: '-> Knees-to-chest ou sit-ups'}, {name: 'Double Unders', reps: 15, note: '-> 30 Single Unders'}], note: 'Scaling Taper J3: confort total. 8min ne doit jamais devenir un effort max. Corps repose = performance RAGNAROK.' },
  rxPlus: { note: 'RX+ Taper: Squat Cleans @70%, Box Jumps 75cm, Toes-to-bar strict. Meme duree 8min.' }
},
{
  day: 99, week: 20, name: 'VALHALLA', theme: 'Taper J4 — Activation Finale + Preparation Mentale', taper: true,
  haltero: { name: 'Thruster + Clean Activation', desc: '1 Squat Clean + 2 Thrusters @60% x 3 sets — Juste activer les patterns du RAGNAROK. Rien de plus.', scheme: 'E3MOM x 3 — Ultra leger, ultra propre', weights: 'thruster' },
  wod: { name: 'VALHALLA', type: '3 Rounds — AMRAP 3min / 1min REST', movements: [
    {name: 'Thrusters', reps: 4, weight: 'thruster'},
    {name: 'Burpees over bar', reps: 4, gymnastics: 'burpee'},
    {name: 'Double Unders', reps: 15, gymnastics: 'double_unders'},
    {name: 'Pull-ups', reps: 4, gymnastics: 'pullups'}
  ], notes: 'DEMAIN = RAGNAROK. Ce soir : mangez des glucides (pates, riz, pain complet), dormez 9 heures minimum. Couchez-vous tot. 3 rounds de 3min aujourd\'hui = activation pure, zero fatigue. Visualisez chaque mouvement du chipper final. Row 50 cal regulier. 40 DL par series de 8. 50 WB par 10. Vous avez accumule 99 jours de travail pour CE moment precis. Demain, vous n\'arretez jamais. Jamais plus de 20 secondes de repos. Valhalla vous attend.' },
  gym: { name: 'Skill: Mental Prep + Movements Cles', drills: ['3x Max DU unbroken (relaxe, pas de sprint)', '3x3 Rope Climb (rappel technique)', '5min Easy Row zone 1 (visualisation)', '15min Visualisation guidee : chaque section de RAGNAROK, rep par rep'] },
  scaled: { movements: [{name: 'Thrusters', reps: 4, note: '-> @55%, tres leger'}, {name: 'Double Unders', reps: 15, note: '-> 30 Single Unders'}, {name: 'Pull-ups', reps: 4, note: '-> Banded ou ring rows'}], note: 'Scaling Valhalla J4: tout confort. Si quoi que ce soit tire, arretez. Vous aurez besoin de tout demain pour RAGNAROK.' },
  rxPlus: { note: 'RX+ Valhalla: memes reps, +5% sur Thrusters. Pas plus. Dormez 9h, mangez des glucides. Demain = RAGNAROK.' }
},
{
  day: 100, week: 20, name: 'RAGNAROK', theme: 'THE FINAL BATTLE — 100 Days', finale: true,
  haltero: { name: 'Snatch + Clean & Jerk Primer', desc: 'Snatch 2x1 @70% + Clean & Jerk 2x1 @70% — Activation CNS pure avant le chipper. 4 reps totales, rien de plus.', scheme: 'E3MOM x 4 — Primer pre-competition, 12min', weights: 'snatch' },
  wod: { name: 'RAGNAROK', type: 'For Time (cap 35min)', movements: [
    {name: 'Cal Row', reps: 50, special: 'row_cal'},
    {name: 'Deadlifts', reps: 40, weight: 'deadlift'},
    {name: 'Wall Balls', reps: 50, gymnastics: 'wall_ball'},
    {name: 'Power Cleans', reps: 30, weight: 'power_clean'},
    {name: 'Toes-to-bar', reps: 30, gymnastics: 'toes_to_bar'},
    {name: 'Double Unders', reps: 100, gymnastics: 'double_unders'},
    {name: 'Thrusters', reps: 20, weight: 'thruster'},
    {name: 'Bar Muscle-ups', reps: 15, gymnastics: 'muscle_ups_bar'},
    {name: 'Squat Cleans', reps: 10, weight: 'squat_clean'},
    {name: 'Ring Muscle-ups', reps: 5, gymnastics: 'muscle_ups_ring'},
    {name: 'Rope Climb', reps: 1, gymnastics: 'rope_climb'}
  ], notes: 'RAGNAROK — 100 jours de sueur, de discipline et de sacrifices pour CE moment precis. Chaque rep que vous avez faite depuis le Jour 1 vous a construit pour aujourd\'hui. Vous n\'etes plus la personne qui a commence ce programme. Strategie chipper : Row 50 cal regulier (2:00/500m pace, pas de sprint). DL 8x5 TnG ou 5x8. WB 10x5 sets. Power Cleans 6-6-6-6-6 touch-and-go. TTB 6-6-6-5-5-5-3-3. DU unbroken ou 50-50. Thrusters 4-4-4-4-4. BMU singles ou 2-2-2-3-3-3. Squat Cleans 10 singles max effort — chaque rep est une victoire. RMU 2-2-1. Rope Climb finale = vous avez gagne. Ne vous arretez JAMAIS plus de 20 secondes. Regardez le chrono, pas la douleur. Vous etes un guerrier. Cent jours prouvent ce que vous valez.' },
  gym: { name: 'Skill: Victory Lap', drills: ['3x Max Strict Pull-ups (post-WOD fierte)', '3x Max Strict HSPU (celebration)', '1x Max Ring Muscle-ups attempt', '5min Easy Row Cool Down — vous avez tout donne'] },
  scaled: { movements: [{name: 'Bar Muscle-ups', reps: 15, note: '-> 30 Chest-to-bar Pull-ups ou 45 Pull-ups kipping'}, {name: 'Ring Muscle-ups', reps: 5, note: '-> 10 Strict Pull-ups ou 5 Bar MU'}, {name: 'Squat Cleans', reps: 10, note: '-> @75% du RX, memes reps'}, {name: 'Rope Climb', reps: 1, note: '-> 5 Ring Rows strictes ou 1 Rope Climb avec pieds'}], note: 'Scaling RAGNAROK: reduire les charges de 20-25% sur tous les mouvements barbell. Garder les reps identiques — la structure du chipper fait partie du defi. Le WOD scaled est tout aussi epique. Cent jours de travail, meme dignite.' },
  rxPlus: { note: 'RX+ RAGNAROK: DL +10%, TTB strict (no kip), BMU strict, Rope Climb legless, DU -> 50 Triple Unders, Squat Cleans +5kg. Target sub 27min. Legendaire.' }
}

];

// Replace inline WODs from app-core.js with the full 100 WOD database
if (window.CF_WODS_FULL && window.CF_WODS_FULL.length > 0) {
  window.CF_WODS = window.CF_WODS_FULL;
}

})();
