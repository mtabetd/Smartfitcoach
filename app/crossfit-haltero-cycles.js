// crossfit-haltero-cycles.js — 6-Week Weightlifting Periodization for CrossFit
(function(){
'use strict';

// ─── PERIODIZATION TEMPLATES ───
// Percentages are based on the athlete's estimated 1RM
// For beginners (scaled), use RPE-based guidance instead of percentages

var PERIODIZATION = [
  // Week 1: Accumulation
  { week: 1, phase: 'Accumulation', sets_reps_pct: [
    { sets: 5, reps: 5, pct: 70, rest: '2min', note: 'Focus technique. Chaque rep doit être parfaite.' },
    { sets: 4, reps: 4, pct: 72, rest: '2min', note: 'Contrôle la descente. Position de départ identique à chaque rep.' }
  ]},
  // Week 2: Accumulation+
  { week: 2, phase: 'Accumulation', sets_reps_pct: [
    { sets: 5, reps: 5, pct: 72, rest: '2min', note: 'Même volume, un chouïa plus lourd. Gardez la qualité.' },
    { sets: 4, reps: 4, pct: 75, rest: '2:30', note: 'La barre doit accélérer au 2ème tirage, pas ralentir.' }
  ]},
  // Week 3: Transmutation
  { week: 3, phase: 'Transmutation', sets_reps_pct: [
    { sets: 5, reps: 3, pct: 78, rest: '2:30', note: 'On réduit les reps, on monte en charge. Chaque triple = explosion.' },
    { sets: 4, reps: 3, pct: 80, rest: '3min', note: '80% doit être fluide. Si c\'est dur, la technique lâche avant la force.' }
  ]},
  // Week 4: Transmutation+
  { week: 4, phase: 'Transmutation', sets_reps_pct: [
    { sets: 4, reps: 3, pct: 82, rest: '3min', note: 'Semaine pivot. Le corps s\'adapte aux charges lourdes.' },
    { sets: 3, reps: 3, pct: 85, rest: '3min', note: '85% = sérieux. Reset complet entre chaque rep si besoin.' }
  ]},
  // Week 5: Realization
  { week: 5, phase: 'Réalisation', sets_reps_pct: [
    { sets: 5, reps: 2, pct: 87, rest: '3min', note: 'Volume minimal, intensité haute. Chaque double compte.' },
    { sets: 3, reps: 2, pct: 90, rest: '3-4min', note: '90% = zone PR. Concentration maximale. Visualisez avant de lifter.' }
  ]},
  // Week 6: Test
  { week: 6, phase: 'Test / Max Out', sets_reps_pct: [
    { sets: 3, reps: 1, pct: 93, rest: '3-4min', note: 'Échauffement long. Montée progressive.' },
    { sets: 2, reps: 1, pct: 95, rest: '4min', note: 'Si c\'est propre → tentez 100%.' },
    { sets: 1, reps: 1, pct: 100, rest: '5min', note: 'Tentative de PR. Confiance. Agressivité. ALLEZ !' }
  ]}
];

// ─── LIFT CYCLES ───
// 4 cycles de 6 semaines qui tournent
var HALTERO_CYCLES = [
  {
    id: 'cycle_a',
    name: 'Cycle A — Clean & Jerk + Snatch',
    focus: 'Les deux mouvements olympiques complets',
    duration: '6 semaines',
    lifts: [
      {
        name: 'Clean & Jerk',
        day: 1,
        warmup: [
          '3x5 Muscle Clean (barre vide)',
          '3x3 Front Squat (montée progressive)',
          '3x3 Push Jerk (montée progressive)',
          '3x2 Squat Clean @50%',
          '2x2 Clean & Jerk @60%'
        ],
        accessory: [
          '3x5 Clean Pull @90% du Clean',
          '3x8 Front Rack Lunges',
          '3x10 Bent Over Row'
        ],
        standards_key: 'squat_clean',
        jerk_key: 'shoulder_to_oh',
        progression_notes: [
          'S1-2: Focus réception basse et rebond',
          'S3-4: Accélération du 2ème tirage',
          'S5: Timing du jerk après le clean',
          'S6: PR day — 1 Clean & Jerk'
        ]
      },
      {
        name: 'Snatch',
        day: 2,
        warmup: [
          '3x5 Snatch Grip Deadlift',
          '3x5 Overhead Squat (barre vide)',
          '3x3 Hang Power Snatch @50%',
          '3x2 Power Snatch @60%',
          '2x1 Squat Snatch @65%'
        ],
        accessory: [
          '3x3 Snatch Pull @100% du Snatch',
          '3x5 Snatch Balance',
          '3x8 Snatch Grip Romanian Deadlift'
        ],
        standards_key: 'snatch',
        progression_notes: [
          'S1-2: Patience au genou, ne tirez pas trop tôt',
          'S3-4: Agressivité sous la barre',
          'S5: Confiance en overhead',
          'S6: PR day — 1RM Snatch'
        ]
      }
    ]
  },
  {
    id: 'cycle_b',
    name: 'Cycle B — Front Squat + Overhead Squat',
    focus: 'Force de squat et stabilité overhead',
    duration: '6 semaines',
    lifts: [
      {
        name: 'Front Squat',
        day: 1,
        warmup: [
          '2x10 Air Squat',
          '2x8 Goblet Squat',
          '3x5 Front Squat (montée progressive)',
          '2x3 @60%'
        ],
        accessory: [
          '3x8 Bulgarian Split Squat',
          '3x10 Leg Press (ou Wall Sit 3x45s)',
          '3x12 Hip Thrust'
        ],
        standards_key: 'front_squat',
        progression_notes: [
          'S1-2: Travailler la position rack (coudes hauts)',
          'S3-4: Tempo squat 3s descente, explosif remontée',
          'S5: Pause squat 2s en bas',
          'S6: PR day — 1RM Front Squat'
        ]
      },
      {
        name: 'Overhead Squat',
        day: 2,
        warmup: [
          '3x5 Pass-throughs (PVC)',
          '3x5 Snatch Grip Press en OHS',
          '3x5 OHS @barre vide',
          '3x3 @50%',
          '2x2 @60%'
        ],
        accessory: [
          '3x5 Snatch Balance',
          '3x30s Overhead Hold @70%',
          '3x8 Snatch Grip Deadlift'
        ],
        standards_key: 'overhead_squat',
        progression_notes: [
          'S1-2: Mobilité thoracique et épaules',
          'S3-4: Stabilité au fond du squat',
          'S5: Confiance avec charges lourdes',
          'S6: PR day — 1RM OHS'
        ]
      }
    ]
  },
  {
    id: 'cycle_c',
    name: 'Cycle C — Squat Clean + Push/Split Jerk',
    focus: 'Réception basse et technique de jerk',
    duration: '6 semaines',
    lifts: [
      {
        name: 'Squat Clean',
        day: 1,
        warmup: [
          '3x5 Clean Deadlift (slow)',
          '3x3 Hang Squat Clean @50%',
          '3x2 Squat Clean @60%',
          '2x1 @70%'
        ],
        accessory: [
          '3x3 Clean Pull @105%',
          '3x5 Pause Front Squat (3s pause)',
          '3x8 Pendlay Row'
        ],
        standards_key: 'squat_clean',
        progression_notes: [
          'S1-2: Vitesse sous la barre',
          'S3-4: Réception active en bas du squat',
          'S5: Stand up du squat = force pure',
          'S6: PR day — 1RM Squat Clean'
        ]
      },
      {
        name: 'Jerk (Push + Split)',
        day: 2,
        warmup: [
          '3x5 Push Press (montée progressive)',
          '3x3 Push Jerk @50%',
          '3x2 Split Jerk @60%',
          '2x1 @70%'
        ],
        accessory: [
          '3x5 Jerk Dip + Drive (sans lâcher)',
          '3x5 Behind Neck Jerk',
          '3x8 DB Z-Press'
        ],
        standards_key: 'push_press',
        progression_notes: [
          'S1-2: Dip droit, drive vertical',
          'S3-4: Timing du lockout',
          'S5: Split position stable',
          'S6: PR day — 1RM Jerk'
        ]
      }
    ]
  },
  {
    id: 'cycle_d',
    name: 'Cycle D — Deadlift + Hang Snatch',
    focus: 'Force de tirage et position de hang',
    duration: '6 semaines',
    lifts: [
      {
        name: 'Deadlift',
        day: 1,
        warmup: [
          '2x10 Good Morning (PVC)',
          '3x5 Romanian Deadlift (montée)',
          '3x5 Deadlift (montée progressive)',
          '2x3 @60%'
        ],
        accessory: [
          '3x5 Deficit Deadlift (5cm)',
          '3x8 Barbell Hip Thrust',
          '3x12 Back Extension'
        ],
        standards_key: 'deadlift',
        progression_notes: [
          'S1-2: Position du dos — neutre toujours',
          'S3-4: Lockout puissant, hips through',
          'S5: Grip training (mixed ou hook)',
          'S6: PR day — 1RM Deadlift'
        ]
      },
      {
        name: 'Hang Snatch',
        day: 2,
        warmup: [
          '3x5 Snatch Grip RDL',
          '3x5 Hang Muscle Snatch',
          '3x3 Hang Power Snatch @50%',
          '3x2 Hang Squat Snatch @60%'
        ],
        accessory: [
          '3x3 Snatch Pull from hang @100%',
          '3x5 OHS @70%',
          '3x8 Bent Over Snatch Grip Row'
        ],
        standards_key: 'snatch',
        progression_notes: [
          'S1-2: Tension en position de hang',
          'S3-4: Extension agressive des hanches',
          'S5: Réception rapide et stable',
          'S6: PR day — 1RM Hang Snatch'
        ]
      }
    ]
  },
  {
    id: 'cycle_e',
    name: 'Cycle E — Back Squat + Power Clean',
    focus: 'Force maximale arrière + transfert en clean',
    duration: '6 semaines',
    notes: 'Cycle manquant critique: le Back Squat est la base de tous les mouvements olympiques. Sans Back Squat solide, le squat clean et le front squat plafonnent. Ce cycle cible la force maximale de squat + puissance de tirage.',
    lifts: [
      {
        name: 'Back Squat',
        day: 1,
        warmup: [
          '2x10 Air Squat (activation)',
          '3x5 Back Squat (barre vide — warm-up)',
          '3x3 @50%',
          '2x2 @65%',
          '1x1 @75%'
        ],
        accessory: [
          '3x8 Romanian Deadlift @60%',
          '3x10 Walking Lunges (DB ou barre)',
          '3x12 Hip Thrust (fort activation fessiers)'
        ],
        standards_key: 'back_squat',
        progression_notes: [
          'S1-2: Brace profond (360° expansion), tibia vertical',
          'S3-4: Pause squat 1s en bas — force excentrique',
          'S5: Tempo 3-0-X-0 (3s descente, explosion remontée)',
          'S6: PR day — 1RM Back Squat (testez-vous!)'
        ]
      },
      {
        name: 'Power Clean',
        day: 2,
        warmup: [
          '3x5 Clean Deadlift (lent, focus position)',
          '3x5 Hang Muscle Clean (activation)',
          '3x3 Hang Power Clean @50%',
          '3x2 Power Clean @60%',
          '2x1 @70%'
        ],
        accessory: [
          '3x5 Clean Pull @100% du Power Clean',
          '3x6 Front Squat @80% du Power Clean',
          '3x10 DB Bent Over Row (grip + dorsaux)'
        ],
        standards_key: 'power_clean',
        progression_notes: [
          'S1-2: Position genoux au 1er tirage — pas de rebond prématuré',
          'S3-4: Extension complète hanches+genoux+orteils avant le tirage sous',
          'S5: Réception haute et agressive — code = vitesse sous la barre',
          'S6: PR day — 1RM Power Clean (touch & go interdit, chaque rep = full reset)'
        ]
      }
    ]
  }
];

// ─── INTER-CYCLE DELOAD PROTOCOL ───
// Entre chaque cycle de 6 semaines: 1 semaine de déload obligatoire (ISSN 2017)
// Volume -60%, intensité -40%. Focus: mobilité, technique légère, récupération CNS
var INTER_CYCLE_DELOAD = {
  description: 'Semaine de transition entre les cycles (semaine 7, 13, 19...)',
  protocol: [
    { day: 1, focus: 'Mobilité + Technique clean légère', desc: '3x5 Clean technique @55%. 20min foam roll + stretching.' },
    { day: 2, focus: 'Aérobie Zone 2', desc: '30-40min Rowing ou Run à FC 60-70% FCmax. Aucune charge.' },
    { day: 3, focus: 'Squat technique légère', desc: '3x5 Front Squat @55%. 3x5 OHS @50% (mobilité overhead).' },
    { day: 4, focus: 'REPOS ACTIF', desc: 'Yoga, natation légère, marche 45min. Zéro barre.' },
    { day: 5, focus: 'Récapitulatif cycle + préparation suivant', desc: '1RM estimé à 90% effort (pas de PR). Plan du cycle suivant.' }
  ],
  notes: 'NE PAS SAUTER le déload inter-cycle. Recherches ISSN 2017: un déload de 7 jours après 6 semaines de charge augmente le PR suivant de 3-8% vs athlètes qui ne déloadent pas. Le muscle grandit pendant le repos, pas pendant l\'entraînement.'
};

// ─── OHS PERCENTAGE CORRECTION ───
// Note: L\'OHS (Overhead Squat) nécessite des pourcentages RÉDUITS vs les autres lifts
// En raison de la demande de stabilité overhead, les % standard de la PERIODIZATION doivent être ajustés:
// OHS_FACTOR = 0.88 (ex: S3 @78% → appliquer 78% * 0.88 = 69% de l\'OHS 1RM)
// Référence: Haff & Triplett 2016 "NSCA Essentials of Strength Training and Conditioning"
var OHS_PERCENTAGE_FACTOR = 0.88;

// ─── HELPER FUNCTIONS ───

// Get current cycle based on total weeks of training
function getCurrentCycle(totalWeeks) {
  var cycleIndex = Math.floor((totalWeeks - 1) / 6) % HALTERO_CYCLES.length;
  var weekInCycle = ((totalWeeks - 1) % 6) + 1;
  return {
    cycle: HALTERO_CYCLES[cycleIndex],
    cycleNumber: cycleIndex + 1,
    weekInCycle: weekInCycle,
    periodization: PERIODIZATION[weekInCycle - 1],
    totalCycles: HALTERO_CYCLES.length
  };
}

// Calculate working weight based on percentage and level
function calcWorkingWeight(standardsKey, sex, level, percentage) {
  // Check user's 1RM first
  if (window.S && window.S.crossfit1RM && window.S.crossfit1RM[standardsKey]) {
    return Math.round(window.S.crossfit1RM[standardsKey] * percentage / 100);
  }

  var standards = window.CF_STANDARDS;
  if (!standards || !standards[standardsKey]) return '?';
  var sexKey = sex === 'homme' ? 'm' : 'f';
  var lvlIdx = level === 'scaled' ? 0 : level === 'inter' ? 1 : 2;

  if (!standards[standardsKey][sexKey]) return '?';
  var maxEstimate = standards[standardsKey][sexKey][lvlIdx];

  // For scaled, the standards ARE the working weights (not 1RM)
  // So for scaled, the percentages represent RPE guidance instead
  if (level === 'scaled') {
    return Math.round(maxEstimate * percentage / 100);
  }

  // For inter and rx, standards are closer to working weights
  // Estimate 1RM as ~115% of the standard (standards = comfortable working weight)
  var estimated1RM = Math.round(maxEstimate * 1.15);
  return Math.round(estimated1RM * percentage / 100);
}

// Get today's haltero session
function getHalteroSession(totalWeeks, dayIndex) {
  // dayIndex: 0 = first haltero day of week, 1 = second haltero day
  var info = getCurrentCycle(totalWeeks);
  var lift = info.cycle.lifts[Math.min(dayIndex, info.cycle.lifts.length - 1)];
  var weekData = info.periodization;

  return {
    cycleName: info.cycle.name,
    cycleFocus: info.cycle.focus,
    cycleNumber: info.cycleNumber,
    weekInCycle: info.weekInCycle,
    phase: weekData.phase,
    lift: lift,
    sets_reps_pct: weekData.sets_reps_pct,
    isTestWeek: info.weekInCycle === 6
  };
}

// Render haltero cycle info for display
function renderCycleInfo(container, totalWeeks, sex, level) {
  var info = getCurrentCycle(totalWeeks);
  var weekData = info.periodization;

  var h = window.h || function(tag, attrs, content) {
    var el = document.createElement(tag);
    if (attrs) { for (var k in attrs) { if (k === 'class') el.className = attrs[k]; else if (k === 'style') el.style.cssText = attrs[k]; else if (k === 'html') el.innerHTML = attrs[k]; else if (k.indexOf('on') === 0) el.addEventListener(k.slice(2), attrs[k]); else el.setAttribute(k, attrs[k]); } }
    if (typeof content === 'string') el.textContent = content;
    else if (Array.isArray(content)) content.forEach(function(c){ if(c) el.appendChild(c); });
    else if (content && content.nodeType) el.appendChild(content);
    return el;
  };

  // Cycle overview card
  var card = h('div', {style: 'border:1px solid var(--border,#D8D8D0);background:var(--ivory2,#F4F4F0);padding:16px;margin:12px 0'});

  // Header
  card.appendChild(h('div', {style: 'font-family:"Helvetica Neue",sans-serif;font-size:9px;letter-spacing:3px;text-transform:uppercase;color:var(--blue,#1A3A6A);margin-bottom:8px'}, 'Cycle Haltérophilie'));
  card.appendChild(h('div', {style: 'font-family:Georgia,serif;font-size:18px;margin-bottom:4px'}, info.cycle.name));
  card.appendChild(h('div', {style: 'font-family:"Helvetica Neue",sans-serif;font-size:11px;color:var(--grey,#6B6B65);margin-bottom:12px'}, info.cycle.focus));

  // Progress bar (6 weeks)
  var progWrap = h('div', {style: 'display:flex;gap:4px;margin-bottom:12px'});
  for (var w = 1; w <= 6; w++) {
    var segStyle = 'flex:1;height:4px;background:' + (w <= info.weekInCycle ? (w === 6 ? 'var(--red,#5A1010)' : 'var(--black,#0A0A09)') : 'var(--border,#D8D8D0)') + ';';
    progWrap.appendChild(h('div', {style: segStyle}));
  }
  card.appendChild(progWrap);

  // Week info
  card.appendChild(h('div', {style: 'font-family:"Helvetica Neue",sans-serif;font-size:10px;color:var(--grey)'},
    'Semaine ' + info.weekInCycle + '/6 — Phase : ' + weekData.phase));

  // Both lifts for this cycle
  info.cycle.lifts.forEach(function(lift, idx) {
    var liftDiv = h('div', {style: 'margin-top:12px;padding-top:12px;border-top:1px solid var(--border,#D8D8D0)'});

    liftDiv.appendChild(h('div', {style: 'font-family:Georgia,serif;font-size:15px;margin-bottom:4px'},
      (idx === 0 ? 'Jour A' : 'Jour B') + ' — ' + lift.name));

    // Show sets/reps/percentage for this week
    weekData.sets_reps_pct.forEach(function(srp) {
      // Apply OHS correction factor for overhead squat
      var effectivePct = (lift.standards_key === 'overhead_squat') ? Math.round(srp.pct * OHS_PERCENTAGE_FACTOR) : srp.pct;
      var weight = calcWorkingWeight(lift.standards_key, sex, level, effectivePct);
      var has1RM = window.S && window.S.crossfit1RM && window.S.crossfit1RM[lift.standards_key];
      var setLine = h('div', {style: 'font-family:"Helvetica Neue",sans-serif;font-size:11px;color:var(--black,#0A0A09);padding:4px 0'});
      var displayPct = (lift.standards_key === 'overhead_squat') ? effectivePct + '% (OHS corrigé)' : srp.pct + '%';
      var lineText = srp.sets + '\u00D7' + srp.reps + ' @' + displayPct + ' (' + weight + 'kg)';
      if (has1RM) lineText += ' \u2014 1RM: ' + window.S.crossfit1RM[lift.standards_key] + 'kg';
      lineText += ' \u2014 Repos ' + srp.rest;
      setLine.textContent = lineText;
      liftDiv.appendChild(setLine);

      // Coach note
      liftDiv.appendChild(h('div', {style: 'font-family:"Helvetica Neue",sans-serif;font-size:9px;color:var(--grey2,#9A9A94);font-style:italic;padding-left:8px;margin-bottom:4px'}, srp.note));
    });

    // Progression note for current week
    if (lift.progression_notes && lift.progression_notes[Math.min(info.weekInCycle - 1, lift.progression_notes.length - 1)]) {
      var pNote = h('div', {style: 'font-family:"Helvetica Neue",sans-serif;font-size:10px;color:var(--green,#1A4A1A);margin-top:6px;padding:6px 10px;background:var(--greenbg,rgba(26,74,26,.06));border-left:2px solid var(--green,#1A4A1A)'});
      pNote.textContent = lift.progression_notes[Math.min(info.weekInCycle - 1, lift.progression_notes.length - 1)];
      liftDiv.appendChild(pNote);
    }

    card.appendChild(liftDiv);
  });

  // Test week special note
  if (info.weekInCycle === 6) {
    var testNote = h('div', {style: 'margin-top:12px;padding:10px 14px;background:var(--redbg,rgba(90,16,16,.06));border-left:2px solid var(--red,#5A1010);font-family:"Helvetica Neue",sans-serif;font-size:11px;color:var(--red,#5A1010)'});
    testNote.textContent = 'SEMAINE DE TEST — C\'est le moment de tout donner. Échauffement long, montée progressive, tentative de PR !';
    card.appendChild(testNote);
  }

  container.appendChild(card);
}

// ─── PUBLIC API ───
window.HALTERO_CYCLES = {
  PERIODIZATION: PERIODIZATION,
  CYCLES: HALTERO_CYCLES,
  INTER_CYCLE_DELOAD: INTER_CYCLE_DELOAD,
  OHS_PERCENTAGE_FACTOR: OHS_PERCENTAGE_FACTOR,
  getCurrentCycle: getCurrentCycle,
  getHalteroSession: getHalteroSession,
  calcWorkingWeight: calcWorkingWeight,
  renderCycleInfo: renderCycleInfo
};

})();
