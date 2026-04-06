(function() {
  'use strict';

  var _modalEl = null;
  var _generating = false;

  function buildProfileFromState() {
    var S = window.S || {};
    return {
      prenom: S.prenom || S.name || 'Athlète',
      age: S.age || null,
      sexe: S.sex === 'femme' ? 'femme' : 'homme',
      poids: S.weight || null,
      taille: S.height || null,
      objectif: window.GOALS && S.goal != null ? (window.GOALS[S.goal] && window.GOALS[S.goal].label) : 'hypertrophie',
      niveau: S.sportLevel || (S.activity >= 3 ? 'avancé' : S.activity >= 2 ? 'intermédiaire' : 'débutant'),
      joursDispo: S.muscuFreq || S.sportFreq || 4,
      dureeMaxSeance: S.muscuDuration || 60,
      equipement: S.equipement || S.gymType || 'salle complète',
      sommeil: S.sleep || 7,
      stress: S.stress || 5,
      blessures: Array.isArray(S.blessures) ? S.blessures : [],
      bench1RM: (S.muscu1RM && S.muscu1RM.bench) || null,
      squat1RM: (S.muscu1RM && S.muscu1RM.squat) || null,
      deadlift1RM: (S.muscu1RM && S.muscu1RM.deadlift) || null,
      ohp1RM: (S.muscu1RM && S.muscu1RM.ohp) || null,
      pointsForts: S.pointsForts || '',
      pointsFaibles: S.pointsFaibles || '',
      preferences: S.preferences || '',
      historique: S.historique || ''
    };
  }

  function ensureModal() {
    if (_modalEl) return _modalEl;
    _modalEl = document.createElement('div');
    _modalEl.id = 'muscu-program-modal';
    _modalEl.setAttribute('role', 'dialog');
    _modalEl.setAttribute('aria-modal', 'true');
    _modalEl.style.cssText = 'display:none;position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.6);z-index:9998;overflow-y:auto;padding:20px;';
    // Inject responsive styles for mobile (<480px)
    if (!document.getElementById('muscu-modal-styles')) {
      var styleEl = document.createElement('style');
      styleEl.id = 'muscu-modal-styles';
      styleEl.textContent = '@media(max-width:480px){#muscu-program-modal{padding:8px!important;}#muscu-program-modal .muscu-modal-inner{max-width:100%!important;padding:16px!important;margin:8px auto!important;}#muscu-program-modal h2{font-size:14px!important;}}';
      document.head.appendChild(styleEl);
    }
    _modalEl.innerHTML = '<div class="muscu-modal-inner" style="max-width:780px;margin:20px auto;background:var(--ivory,#FAF9F6);border-radius:2px;padding:24px;font-family:Georgia,serif;">' +
      '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;border-bottom:1px solid var(--border,#E5E5E0);padding-bottom:12px;">' +
        '<h2 style="margin:0;font-size:18px;letter-spacing:2px;text-transform:uppercase;">Programme Musculation</h2>' +
        '<button id="muscu-prog-close" aria-label="Fermer" style="background:transparent;border:none;font-size:24px;cursor:pointer;color:var(--grey,#6B6B65);">×</button>' +
      '</div>' +
      '<div id="muscu-prog-content" style="font-family:\'Helvetica Neue\',Arial,sans-serif;font-size:13px;line-height:1.7;color:var(--black,#0A0A09);"></div>' +
    '</div>';
    document.body.appendChild(_modalEl);
    document.getElementById('muscu-prog-close').addEventListener('click', closeModal);
    _modalEl.addEventListener('click', function(e) { if (e.target === _modalEl) closeModal(); });
    return _modalEl;
  }

  function closeModal() {
    if (_modalEl) _modalEl.style.display = 'none';
  }

  function openMuscuProgramGenerator() {
    ensureModal();
    var content = document.getElementById('muscu-prog-content');
    content.innerHTML = '<div style="text-align:center;padding:40px;">' +
      '<div style="font-size:11px;letter-spacing:3px;text-transform:uppercase;color:var(--grey,#6B6B65);margin-bottom:16px;">Programme 100% personnalisé</div>' +
      '<p style="font-size:13px;color:var(--grey3,#9B9B95);margin-bottom:24px;">Notre IA va analyser ton profil complet (1RM, objectif, équipement, contraintes, sommeil, stress) et générer un programme dérivé à 100% de tes données. Aucune ligne ne sera générique.</p>' +
      '<p style="font-size:11px;color:var(--grey3,#9B9B95);margin-bottom:24px;">⚠ Génération limitée à 1 par semaine (Sonnet IA = coûteux). Sois patient, ça prend 30-60 secondes.</p>' +
      '<button id="muscu-prog-generate" style="background:var(--accent,#1A4A1A);color:var(--ivory,#FAF9F6);border:none;padding:14px 32px;font-size:12px;letter-spacing:2px;text-transform:uppercase;cursor:pointer;border-radius:2px;font-family:Georgia,serif;">Construire mon programme</button>' +
    '</div>';
    _modalEl.style.display = 'block';
    document.getElementById('muscu-prog-generate').addEventListener('click', generateMuscuProgram);
  }

  function generateMuscuProgram() {
    if (_generating) return;
    _generating = true;
    var content = document.getElementById('muscu-prog-content');
    content.innerHTML = '<div style="text-align:center;padding:40px;">' +
      '<div style="font-size:11px;letter-spacing:3px;text-transform:uppercase;color:var(--grey,#6B6B65);margin-bottom:16px;">Génération en cours...</div>' +
      '<div style="display:inline-block;width:40px;height:40px;border:3px solid var(--border,#E5E5E0);border-top-color:var(--accent,#1A4A1A);border-radius:50%;animation:spin 1s linear infinite;"></div>' +
      '<p style="font-size:11px;color:var(--grey3,#9B9B95);margin-top:16px;">Analyse de tes 1RM, calcul des charges cibles, sélection des exercices...</p>' +
      '<style>@keyframes spin{to{transform:rotate(360deg)}}</style>' +
    '</div>';

    var profile = buildProfileFromState();
    fetch('/.netlify/functions/generate-muscu-program', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ profile: profile })
    })
    .then(function(r) {
      if (!r.ok) {
        return r.json().then(function(err) { throw new Error(err.error || 'Erreur HTTP ' + r.status); });
      }
      return r.json();
    })
    .then(function(data) {
      _generating = false;
      var html = (data.program || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\n/g, '<br>');
      content.innerHTML = '<div style="white-space:pre-wrap;font-family:\'Helvetica Neue\',Arial,sans-serif;font-size:13px;line-height:1.7;">' + html + '</div>' +
        '<div style="margin-top:24px;text-align:center;border-top:1px solid var(--border,#E5E5E0);padding-top:16px;">' +
          '<button onclick="window.print()" style="background:transparent;border:1px solid var(--accent,#1A4A1A);color:var(--accent,#1A4A1A);padding:10px 20px;font-size:11px;letter-spacing:2px;text-transform:uppercase;cursor:pointer;border-radius:2px;font-family:Georgia,serif;">Imprimer / PDF</button>' +
        '</div>';
      // Sauvegarder localement
      try { localStorage.setItem('mtd_muscu_program', JSON.stringify({ program: data.program, generatedAt: data.generatedAt })); } catch(e) { console.error('[muscu-prog] save fail:', e); }
    })
    .catch(function(err) {
      _generating = false;
      console.error('[muscu-prog] generation error:', err);
      content.innerHTML = '<div style="text-align:center;padding:40px;">' +
        '<div style="font-size:14px;color:var(--red,#5A1010);margin-bottom:16px;">⚠ ' + (err.message || 'Erreur de génération') + '</div>' +
        '<button onclick="window.openMuscuProgramGenerator()" style="background:transparent;border:1px solid var(--grey,#6B6B65);color:var(--grey,#6B6B65);padding:10px 20px;font-size:11px;letter-spacing:2px;text-transform:uppercase;cursor:pointer;border-radius:2px;">Réessayer</button>' +
      '</div>';
    });
  }

  window.openMuscuProgramGenerator = openMuscuProgramGenerator;
  window.generateMuscuProgram = generateMuscuProgram;
})();
