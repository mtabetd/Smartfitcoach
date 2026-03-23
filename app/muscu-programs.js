// muscu-programs.js — Professional Bodybuilding Programs (NFC-inspired)
(function(){
'use strict';

var NFC_PROGRAMS = {
  pectoraux: {
    masse: {
      warmup: '5 min rameur + rotations \u00e9paules dynamiques',
      exercises: [
        {order:1, name:'\u00c9cart\u00e9 poulie basse', sets:3, reps:12, rest:'1min30', technique:'3s pic contraction', muscle:'pectoraux', type:'isolation', equipment:'poulie'},
        {order:2, name:'D\u00e9velopp\u00e9 couch\u00e9 barre', sets:4, reps:8, rest:'2min', technique:null, muscle:'pectoraux', type:'compound', equipment:'barre'},
        {order:3, name:'D\u00e9velopp\u00e9 inclin\u00e9 barre', sets:4, reps:8, rest:'2min', technique:null, muscle:'pectoraux', type:'compound', equipment:'barre'},
        {order:4, name:'D\u00e9velopp\u00e9 inclin\u00e9 halt\u00e8res', sets:3, reps:10, rest:'2min', technique:'3s pic contraction', muscle:'pectoraux', type:'compound', equipment:'halteres'},
        {order:5, name:'\u00c9cart\u00e9 couch\u00e9', sets:4, reps:10, rest:'1min30', technique:'3s pic contraction', muscle:'pectoraux', type:'isolation', equipment:'halteres'},
        {order:6, name:'Crunch banc d\u00e9clin\u00e9', sets:3, reps:15, rest:'1min', technique:null, muscle:'abdominaux', type:'isolation', equipment:'banc'}
      ],
      notes: 'Commencer par l\'isolation pour pr\u00e9-fatiguer le muscle. Contr\u00f4ler chaque rep.'
    },
    seche: {
      warmup: '5 min rameur + rotations \u00e9paules',
      exercises: [
        {order:1, name:'\u00c9cart\u00e9 poulie basse', sets:4, reps:15, rest:'45s', technique:'3s pic contraction', muscle:'pectoraux', type:'isolation', equipment:'poulie'},
        {order:2, name:'D\u00e9velopp\u00e9 couch\u00e9 barre', sets:4, reps:12, rest:'1min', technique:null, muscle:'pectoraux', type:'compound', equipment:'barre'},
        {order:3, name:'D\u00e9velopp\u00e9 inclin\u00e9 barre', sets:4, reps:12, rest:'1min', technique:null, muscle:'pectoraux', type:'compound', equipment:'barre'},
        {order:4, name:'D\u00e9velopp\u00e9 inclin\u00e9 halt\u00e8res', sets:3, reps:12, rest:'1min', technique:'3s pic contraction', muscle:'pectoraux', type:'compound', equipment:'halteres'},
        {order:5, name:'\u00c9cart\u00e9 couch\u00e9', sets:4, reps:12, rest:'45s', technique:'3s pic contraction', muscle:'pectoraux', type:'isolation', equipment:'halteres'},
        {order:6, name:'Crunch banc d\u00e9clin\u00e9', sets:4, reps:20, rest:'45s', technique:null, muscle:'abdominaux', type:'isolation', equipment:'banc'}
      ],
      notes: 'Repos courts, tempo rapide.'
    }
  },
  dos: {
    masse: {
      warmup: '5 min rameur + mobilit\u00e9 \u00e9paules',
      exercises: [
        {order:1, name:'Traction (lest\u00e9/PDC/assist\u00e9)', sets:4, reps:10, rest:'1min30', technique:null, muscle:'dos', type:'compound', equipment:'barre fixe'},
        {order:2, name:'T-barre (ou rowing barre)', sets:4, reps:8, rest:'2min', technique:null, muscle:'dos', type:'compound', equipment:'barre'},
        {order:3, name:'Tirage vertical prise large', sets:4, reps:10, rest:'2min', technique:'2s excentrique', muscle:'dos', type:'compound', equipment:'poulie'},
        {order:4, name:'Tirage genoux poulie haute', sets:4, reps:10, rest:'1min30', technique:'5s pic contraction x3', muscle:'dos', type:'isolation', equipment:'poulie'},
        {order:5, name:'Rowing halt\u00e8re chaise romaine', sets:5, reps:12, rest:'1min30', technique:null, muscle:'dos', type:'compound', equipment:'halteres'},
        {order:6, name:'Relev\u00e9 de jambes', sets:4, reps:'max', rest:'1min', technique:null, muscle:'abdominaux', type:'isolation', equipment:'barre fixe'}
      ],
      notes: 'Le dos est le plus grand muscle du haut du corps. Intensit\u00e9 maximale.'
    },
    seche: {
      warmup: '5 min rameur + mobilit\u00e9 \u00e9paules',
      exercises: [
        {order:1, name:'Traction PDC', sets:4, reps:12, rest:'1min', technique:null, muscle:'dos', type:'compound', equipment:'barre fixe'},
        {order:2, name:'T-barre', sets:4, reps:12, rest:'1min', technique:null, muscle:'dos', type:'compound', equipment:'barre'},
        {order:3, name:'Tirage vertical prise large', sets:4, reps:12, rest:'1min', technique:'2s excentrique', muscle:'dos', type:'compound', equipment:'poulie'},
        {order:4, name:'Tirage poulie haute', sets:4, reps:15, rest:'45s', technique:'pic contraction', muscle:'dos', type:'isolation', equipment:'poulie'},
        {order:5, name:'Rowing halt\u00e8re', sets:4, reps:15, rest:'45s', technique:null, muscle:'dos', type:'compound', equipment:'halteres'},
        {order:6, name:'Relev\u00e9 de jambes', sets:4, reps:'max', rest:'45s', technique:null, muscle:'abdominaux', type:'isolation', equipment:'barre fixe'}
      ],
      notes: 'Volume \u00e9lev\u00e9, repos courts.'
    }
  },
  bras: {
    masse: {
      warmup: '5 min rameur + rotations poignets',
      exercises: [
        {order:1, name:'Curl barre + Barre au front', sets:4, reps:'10+10', rest:'1min30', technique:'Superset', muscle:'biceps+triceps', type:'superset', equipment:'barre'},
        {order:2, name:'Curl pupitre + DC serr\u00e9', sets:4, reps:'10+10', rest:'1min30', technique:'Superset', muscle:'biceps+triceps', type:'superset', equipment:'barre'},
        {order:3, name:'Curl spider + Dips', sets:4, reps:'10+10', rest:'1min30', technique:'Superset', muscle:'biceps+triceps', type:'superset', equipment:'banc'},
        {order:4, name:'Curl concentr\u00e9 marteau', sets:4, reps:12, rest:'1min30', technique:'12 reps chaque bras', muscle:'biceps', type:'isolation', equipment:'halteres'},
        {order:5, name:'Crunch banc d\u00e9clin\u00e9', sets:4, reps:12, rest:'1min', technique:'3s excentrique', muscle:'abdominaux', type:'isolation', equipment:'banc'},
        {order:6, name:'Relev\u00e9 de jambes', sets:4, reps:'max', rest:'1min', technique:null, muscle:'abdominaux', type:'isolation', equipment:'barre fixe'},
        {order:7, name:'Obliques chaise romaine', sets:4, reps:12, rest:'1min', technique:'12 reps chaque c\u00f4t\u00e9', muscle:'abdominaux', type:'isolation', equipment:'chaise romaine'}
      ],
      notes: 'Supersets biceps/triceps = pump maximal. Agoniste/antagoniste.'
    },
    seche: {
      warmup: '5 min rameur + rotations poignets',
      exercises: [
        {order:1, name:'Curl barre + Barre au front', sets:4, reps:'12+12', rest:'1min', technique:'Superset', muscle:'biceps+triceps', type:'superset', equipment:'barre'},
        {order:2, name:'Curl pupitre + DC serr\u00e9', sets:4, reps:'12+12', rest:'1min', technique:'Superset', muscle:'biceps+triceps', type:'superset', equipment:'barre'},
        {order:3, name:'Curl spider + Dips', sets:4, reps:'12+12', rest:'1min', technique:'Superset', muscle:'biceps+triceps', type:'superset', equipment:'banc'},
        {order:4, name:'Curl marteau', sets:4, reps:15, rest:'45s', technique:null, muscle:'biceps', type:'isolation', equipment:'halteres'},
        {order:5, name:'Crunch', sets:4, reps:20, rest:'45s', technique:null, muscle:'abdominaux', type:'isolation', equipment:'banc'},
        {order:6, name:'Relev\u00e9 de jambes', sets:4, reps:'max', rest:'30s', technique:null, muscle:'abdominaux', type:'isolation', equipment:'barre fixe'},
        {order:7, name:'Obliques', sets:4, reps:15, rest:'30s', technique:null, muscle:'abdominaux', type:'isolation', equipment:'chaise romaine'}
      ],
      notes: 'Supersets + repos courts = cardio int\u00e9gr\u00e9.'
    }
  },
  jambes: {
    masse: {
      warmup: '5 min v\u00e9lo + squats \u00e0 vide + mobilit\u00e9 chevilles',
      exercises: [
        {order:1, name:'Squat barre', sets:4, reps:8, rest:'2min30', technique:null, muscle:'quadriceps+fessiers', type:'compound', equipment:'barre'},
        {order:2, name:'Fente bulgare', sets:4, reps:10, rest:'2min', technique:'10 reps chaque jambe', muscle:'quadriceps+fessiers', type:'compound', equipment:'halteres'},
        {order:3, name:'Presse', sets:4, reps:12, rest:'2min', technique:'4s excentrique', muscle:'quadriceps', type:'compound', equipment:'machine'},
        {order:4, name:'Leg extension', sets:4, reps:12, rest:'2min', technique:'4s excentrique', muscle:'quadriceps', type:'isolation', equipment:'machine'},
        {order:5, name:'Leg curl', sets:4, reps:12, rest:'2min', technique:'4s excentrique', muscle:'ischio-jambiers', type:'isolation', equipment:'machine'},
        {order:6, name:'Mollets presse', sets:4, reps:12, rest:'1min', technique:null, muscle:'mollets', type:'isolation', equipment:'machine'}
      ],
      notes: 'Ne n\u00e9gligez JAMAIS les jambes. Squat = roi des exercices.'
    },
    seche: {
      warmup: '5 min v\u00e9lo + squats \u00e0 vide',
      exercises: [
        {order:1, name:'Squat barre', sets:4, reps:12, rest:'1min30', technique:null, muscle:'quadriceps+fessiers', type:'compound', equipment:'barre'},
        {order:2, name:'Fente bulgare', sets:4, reps:12, rest:'1min30', technique:null, muscle:'quadriceps+fessiers', type:'compound', equipment:'halteres'},
        {order:3, name:'Presse', sets:4, reps:15, rest:'1min', technique:'3s excentrique', muscle:'quadriceps', type:'compound', equipment:'machine'},
        {order:4, name:'Leg extension', sets:4, reps:15, rest:'1min', technique:'3s excentrique', muscle:'quadriceps', type:'isolation', equipment:'machine'},
        {order:5, name:'Leg curl', sets:4, reps:15, rest:'1min', technique:'3s excentrique', muscle:'ischio-jambiers', type:'isolation', equipment:'machine'},
        {order:6, name:'Mollets presse', sets:4, reps:15, rest:'45s', technique:null, muscle:'mollets', type:'isolation', equipment:'machine'}
      ],
      notes: 'Les jambes br\u00fblent le plus de calories. Profitez-en en s\u00e8che.'
    }
  },
  epaules: {
    masse: {
      warmup: '5 min rameur + rotations \u00e9paules + bande \u00e9lastique',
      exercises: [
        {order:1, name:'\u00c9l\u00e9vation lat\u00e9rale', sets:4, reps:10, rest:'1min30', technique:'1 moiti\u00e9 + 1 compl\u00e8te = 1 rep', muscle:'\u00e9paules', type:'isolation', equipment:'halteres'},
        {order:2, name:'D\u00e9velopp\u00e9 Arnold', sets:4, reps:8, rest:'1min30', technique:null, muscle:'\u00e9paules', type:'compound', equipment:'halteres'},
        {order:3, name:'D\u00e9velopp\u00e9 militaire halt\u00e8res', sets:4, reps:10, rest:'1min30', technique:null, muscle:'\u00e9paules', type:'compound', equipment:'halteres'},
        {order:4, name:'\u00c9l\u00e9vation frontale + Face pull', sets:4, reps:'10+10', rest:'1min30', technique:'Superset: 3s excentrique', muscle:'\u00e9paules', type:'superset', equipment:'halteres+poulie'},
        {order:5, name:'Shrug barre', sets:4, reps:10, rest:'1min30', technique:null, muscle:'trap\u00e8zes', type:'isolation', equipment:'barre'},
        {order:6, name:'Abdos rouleau', sets:4, reps:12, rest:'1min', technique:null, muscle:'abdominaux', type:'isolation', equipment:'rouleau'},
        {order:7, name:'Relev\u00e9 de jambes', sets:4, reps:'max', rest:'1min', technique:null, muscle:'abdominaux', type:'isolation', equipment:'barre fixe'}
      ],
      notes: 'Les \u00e9paules donnent la forme en V. Travaillez les 3 faisceaux.'
    },
    seche: {
      warmup: '5 min rameur + rotations \u00e9paules',
      exercises: [
        {order:1, name:'\u00c9l\u00e9vation lat\u00e9rale', sets:4, reps:15, rest:'45s', technique:'1 moiti\u00e9 + 1 compl\u00e8te', muscle:'\u00e9paules', type:'isolation', equipment:'halteres'},
        {order:2, name:'D\u00e9velopp\u00e9 Arnold', sets:4, reps:12, rest:'1min', technique:null, muscle:'\u00e9paules', type:'compound', equipment:'halteres'},
        {order:3, name:'D\u00e9velopp\u00e9 militaire halt\u00e8res', sets:4, reps:12, rest:'1min', technique:null, muscle:'\u00e9paules', type:'compound', equipment:'halteres'},
        {order:4, name:'\u00c9l\u00e9vation frontale + Face pull', sets:4, reps:'12+12', rest:'1min', technique:'Superset', muscle:'\u00e9paules', type:'superset', equipment:'halteres+poulie'},
        {order:5, name:'Shrug barre', sets:4, reps:12, rest:'1min', technique:null, muscle:'trap\u00e8zes', type:'isolation', equipment:'barre'},
        {order:6, name:'Abdos rouleau', sets:4, reps:15, rest:'45s', technique:null, muscle:'abdominaux', type:'isolation', equipment:'rouleau'},
        {order:7, name:'Relev\u00e9 de jambes', sets:4, reps:'max', rest:'30s', technique:null, muscle:'abdominaux', type:'isolation', equipment:'barre fixe'}
      ],
      notes: '\u00c9paules + abdos en s\u00e8che = silhouette sculpt\u00e9e.'
    }
  },
  fessiers_dedied: {
    name: 'Programme Fessiers',
    exercises: [
      {order:1, name:'Hip Thrust barre', sets:4, reps:10, rest:'2min', technique:'3s pic contraction', muscle:'fessiers', type:'compound', equipment:'barre+banc'},
      {order:2, name:'Squat sumo', sets:4, reps:12, rest:'1min30', technique:null, muscle:'fessiers+adducteurs', type:'compound', equipment:'barre'},
      {order:3, name:'Fente arri\u00e8re halt\u00e8res', sets:4, reps:10, rest:'1min30', technique:'10 reps chaque jambe', muscle:'fessiers', type:'compound', equipment:'halteres'},
      {order:4, name:'Romanian Deadlift', sets:4, reps:10, rest:'2min', technique:'3s excentrique', muscle:'fessiers+ischio', type:'compound', equipment:'barre'},
      {order:5, name:'Abduction machine', sets:4, reps:15, rest:'1min', technique:'2s pic contraction', muscle:'fessiers (moyen)', type:'isolation', equipment:'machine'},
      {order:6, name:'Donkey kick poulie', sets:3, reps:15, rest:'1min', technique:'15 reps chaque jambe', muscle:'fessiers', type:'isolation', equipment:'poulie'}
    ],
    notes: 'Programme d\u00e9di\u00e9 fessiers. Id\u00e9al en compl\u00e9ment ou remplacement de la s\u00e9ance jambes.'
  },
  abdos_dedied: {
    name: 'Programme Abdominaux',
    exercises: [
      {order:1, name:'Crunch banc d\u00e9clin\u00e9', sets:4, reps:20, rest:'45s', technique:'3s excentrique', muscle:'grand droit', type:'isolation', equipment:'banc'},
      {order:2, name:'Relev\u00e9 de jambes', sets:4, reps:'max', rest:'45s', technique:null, muscle:'grand droit (bas)', type:'isolation', equipment:'barre fixe'},
      {order:3, name:'Planche', sets:3, reps:'45-60s', rest:'30s', technique:'Gainage statique', muscle:'transverse', type:'isometrique', equipment:'sol'},
      {order:4, name:'Russian twist', sets:4, reps:20, rest:'30s', technique:'Avec m\u00e9decine ball', muscle:'obliques', type:'isolation', equipment:'medecine ball'},
      {order:5, name:'Obliques chaise romaine', sets:4, reps:12, rest:'45s', technique:'12 reps chaque c\u00f4t\u00e9', muscle:'obliques', type:'isolation', equipment:'chaise romaine'},
      {order:6, name:'Ab wheel', sets:3, reps:12, rest:'1min', technique:'Contr\u00f4le total', muscle:'grand droit+transverse', type:'compound', equipment:'rouleau'}
    ],
    notes: 'Les abdos se r\u00e9v\u00e8lent avec un bon taux de masse grasse. Mais il faut les construire aussi !'
  },
  biceps_dedied: {
    name: 'Programme Biceps',
    exercises: [
      {order:1, name:'Curl barre droite', sets:4, reps:10, rest:'1min30', technique:null, muscle:'biceps', type:'compound', equipment:'barre'},
      {order:2, name:'Curl pupitre', sets:4, reps:10, rest:'1min30', technique:'3s excentrique', muscle:'biceps (chef court)', type:'isolation', equipment:'pupitre'},
      {order:3, name:'Curl inclin\u00e9 halt\u00e8res', sets:3, reps:12, rest:'1min30', technique:'Banc 45\u00b0, stretch max', muscle:'biceps (chef long)', type:'isolation', equipment:'halteres+banc'},
      {order:4, name:'Curl marteau', sets:3, reps:12, rest:'1min', technique:null, muscle:'brachial', type:'isolation', equipment:'halteres'},
      {order:5, name:'Curl concentr\u00e9', sets:3, reps:12, rest:'1min', technique:'3s pic contraction', muscle:'biceps (pic)', type:'isolation', equipment:'halteres'}
    ],
    notes: 'Variez les angles pour recruter tous les chefs du biceps.'
  },
  triceps_dedied: {
    name: 'Programme Triceps',
    exercises: [
      {order:1, name:'D\u00e9velopp\u00e9 couch\u00e9 prise serr\u00e9e', sets:4, reps:8, rest:'2min', technique:null, muscle:'triceps', type:'compound', equipment:'barre'},
      {order:2, name:'Barre au front (skull crushers)', sets:4, reps:10, rest:'1min30', technique:null, muscle:'triceps (chef long)', type:'isolation', equipment:'barre EZ'},
      {order:3, name:'Dips (lest\u00e9 si possible)', sets:4, reps:10, rest:'1min30', technique:null, muscle:'triceps', type:'compound', equipment:'barres'},
      {order:4, name:'Extension poulie haute (corde)', sets:4, reps:12, rest:'1min', technique:'3s pic contraction', muscle:'triceps', type:'isolation', equipment:'poulie'},
      {order:5, name:'Kickback halt\u00e8re', sets:3, reps:12, rest:'1min', technique:'2s pic contraction', muscle:'triceps', type:'isolation', equipment:'halteres'}
    ],
    notes: 'Les triceps = 2/3 du volume du bras. Ne les n\u00e9gligez pas !'
  }
};

var WEEKLY_SPLITS = {
  3: {name:'Full Body 3j', days:[{day:'Lundi',muscles:['pectoraux','dos'],label:'Haut du corps A'},{day:'Mercredi',muscles:['jambes','epaules'],label:'Bas + \u00c9paules'},{day:'Vendredi',muscles:['bras','abdos_dedied'],label:'Bras + Abdos'}]},
  4: {name:'Upper/Lower 4j', days:[{day:'Lundi',muscles:['pectoraux'],label:'Pectoraux'},{day:'Mardi',muscles:['dos'],label:'Dos'},{day:'Jeudi',muscles:['jambes'],label:'Jambes'},{day:'Vendredi',muscles:['epaules','bras'],label:'\u00c9paules + Bras'}]},
  5: {name:'Split 5j (Pro)', days:[{day:'Lundi',muscles:['pectoraux'],label:'Pectoraux'},{day:'Mardi',muscles:['dos'],label:'Dos'},{day:'Jeudi',muscles:['bras'],label:'Bras'},{day:'Vendredi',muscles:['jambes'],label:'Jambes'},{day:'Samedi',muscles:['epaules'],label:'\u00c9paules'}], notes:'Repos mercredi et dimanche. Espacer pectoraux et \u00e9paules de 48h min.'},
  6: {name:'PPL 6j', days:[{day:'Lundi',muscles:['pectoraux'],label:'Push: Pecs'},{day:'Mardi',muscles:['dos'],label:'Pull: Dos'},{day:'Mercredi',muscles:['jambes'],label:'Legs'},{day:'Jeudi',muscles:['epaules'],label:'Push: \u00c9paules'},{day:'Vendredi',muscles:['dos'],label:'Pull: Dos+Bras'},{day:'Samedi',muscles:['jambes','fessiers_dedied'],label:'Legs+Fessiers'}]}
};

function getPersonalizedProgram(muscleGroup, userProfile) {
  var S = userProfile || window.S || {};
  var goalKey = 'masse';
  if (S.sportGoals) {
    if (S.sportGoals.indexOf('shred') !== -1 || S.sportGoals.indexOf('weightloss') !== -1) goalKey = 'seche';
  }
  var program = NFC_PROGRAMS[muscleGroup];
  if (!program) return null;
  if (program.exercises) return JSON.parse(JSON.stringify(program));
  var template = program[goalKey] || program.masse;
  if (!template) return null;
  var result = JSON.parse(JSON.stringify(template));
  if (S.sex === 'femme') {
    result.exercises.forEach(function(ex) {
      if (ex.type === 'compound' && goalKey === 'masse' && typeof ex.reps === 'number') ex.reps = Math.min(ex.reps + 2, 15);
    });
  }
  if (S.sportLevel === 'beginner') {
    result.exercises = result.exercises.slice(0, 5);
    result.exercises.forEach(function(ex) { if (typeof ex.sets === 'number') ex.sets = Math.max(2, ex.sets - 1); ex.technique = null; });
    result.notes = (result.notes || '') + ' D\u00e9butant : concentrez-vous sur la technique avant les charges.';
  }
  if (S.sportFocus && typeof S.sportFocus === 'object') {
    var key = muscleGroup.replace('_dedied','');
    var pMap = {'pectoraux':'Poitrine','dos':'Dos','epaules':'\u00c9paules','bras':'Bras','jambes':'Jambes','fessiers':'Fessiers','abdos':'Abdominaux'};
    var zoneName = pMap[key] || key;
    var priority = S.sportFocus[zoneName] || 0;
    if (priority >= 4) {
      result.exercises.forEach(function(ex) { if (typeof ex.sets === 'number') ex.sets += 1; });
      result.notes = (result.notes || '') + ' \u2b50 Zone prioritaire : volume augment\u00e9.';
    }
  }
  return result;
}

function getWeeklySplit(daysPerWeek) { return WEEKLY_SPLITS[daysPerWeek] || WEEKLY_SPLITS[5]; }

window.NFC_PROGRAMS = NFC_PROGRAMS;
window.WEEKLY_SPLITS = WEEKLY_SPLITS;
window.getPersonalizedProgram = getPersonalizedProgram;
window.getWeeklySplit = getWeeklySplit;

})();
