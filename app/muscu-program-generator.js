(function() {
  'use strict';

  var _modalEl = null;
  var _generating = false;
  var _loadingInterval = null;
  var _previousFocus = null;

  var LOADING_PHRASES = [
    'Lecture de tes 1RM. Calcul de tes ratios squat, bench, deadlift, overhead.',
    'Sélection du split adapté à tes jours, ton équipement, tes blessures.',
    'Calibrage des charges cibles, semaine par semaine, kilo par kilo.',
    'Écriture de ton diagnostic. Encore quelques secondes.'
  ];

  var FOOTER_QUOTES = [
    'Donne ce programme à quelqu\u2019un d\u2019autre. Il ne fonctionnera pas.',
    'Le sur-mesure n\u2019est pas une option. C\u2019est la seule manière de progresser.'
  ];

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
    // Focus trap : empêche le tab de sortir de la modal
    _modalEl.addEventListener('keydown', function(e) {
      if (_modalEl.style.display === 'none') return;
      if (e.key === 'Escape') {
        closeModal();
        return;
      }
      if (e.key !== 'Tab') return;
      var focusables = _modalEl.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
      if (focusables.length === 0) return;
      var first = focusables[0];
      var last = focusables[focusables.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    });
    return _modalEl;
  }

  function closeModal() {
    if (_loadingInterval) { clearInterval(_loadingInterval); _loadingInterval = null; }
    if (_modalEl) _modalEl.style.display = 'none';
    if (_previousFocus && _previousFocus.focus) {
      try { _previousFocus.focus(); } catch(e) {}
    }
  }

  function openMuscuProgramGenerator() {
    ensureModal();
    _previousFocus = document.activeElement;
    if (_loadingInterval) { clearInterval(_loadingInterval); _loadingInterval = null; }
    var content = document.getElementById('muscu-prog-content');
    content.innerHTML = '<div style="text-align:center;padding:40px 24px;">' +
      '<div style="font-size:10px;letter-spacing:4px;text-transform:uppercase;color:var(--grey,#6B6B65);margin-bottom:24px;font-family:Georgia,serif;">UN PROGRAMME. LE TIEN. PERSONNE D\u2019AUTRE.</div>' +
      '<h3 style="font-family:Georgia,serif;font-size:24px;font-weight:normal;letter-spacing:1px;color:var(--black,#0A0A09);margin:0 0 20px 0;">Ton programme t\u2019attend.</h3>' +
      '<p style="font-family:\'Helvetica Neue\',Arial,sans-serif;font-size:13px;line-height:1.7;color:var(--grey,#6B6B65);margin:0 auto 24px auto;max-width:520px;">Nous allons croiser tes 1RM, tes disponibilités, ton équipement et ton historique pour construire douze semaines qui n\u2019existent que pour toi. Aucune ligne ne sera générique. Aucune charge ne sera approximative.</p>' +
      '<p style="font-family:\'Helvetica Neue\',Arial,sans-serif;font-size:11px;color:var(--grey3,#9A9A90);margin-bottom:28px;">Génération limitée à une fois par semaine. Compte 30 à 60 secondes.</p>' +
      '<button id="muscu-prog-generate" style="background:var(--accent,#1A4A1A);color:var(--ivory,#FAF9F6);border:none;padding:14px 32px;font-size:12px;letter-spacing:2px;text-transform:uppercase;cursor:pointer;border-radius:2px;font-family:Georgia,serif;">Construire mon programme</button>' +
    '</div>';
    _modalEl.style.display = 'block';
    document.getElementById('muscu-prog-generate').addEventListener('click', generateMuscuProgram);
    setTimeout(function() {
      var firstBtn = _modalEl.querySelector('button');
      if (firstBtn) firstBtn.focus();
    }, 50);
  }

  function generateMuscuProgram() {
    if (_generating) return;
    _generating = true;
    var content = document.getElementById('muscu-prog-content');
    content.innerHTML = '<div style="text-align:center;padding:48px 24px;">' +
      '<div style="font-size:10px;letter-spacing:4px;text-transform:uppercase;color:var(--grey,#6B6B65);margin-bottom:24px;font-family:Georgia,serif;">GÉNÉRATION EN COURS</div>' +
      '<div style="display:inline-block;width:40px;height:40px;border:2px solid var(--border,#E5E5E0);border-top-color:var(--accent,#1A4A1A);border-radius:50%;animation:spin 1s linear infinite;"></div>' +
      '<p id="muscu-prog-loading-text" style="font-family:\'Helvetica Neue\',Arial,sans-serif;font-size:12px;line-height:1.7;color:var(--grey,#6B6B65);margin:24px auto 0 auto;max-width:480px;min-height:34px;transition:opacity 0.4s ease;">' + LOADING_PHRASES[0] + '</p>' +
      '<style>@keyframes spin{to{transform:rotate(360deg)}}</style>' +
    '</div>';

    if (_loadingInterval) clearInterval(_loadingInterval);
    var idx = 0;
    _loadingInterval = setInterval(function() {
      var el = document.getElementById('muscu-prog-loading-text');
      if (!el) { clearInterval(_loadingInterval); _loadingInterval = null; return; }
      idx = (idx + 1) % LOADING_PHRASES.length;
      el.style.opacity = '0';
      setTimeout(function() {
        var el2 = document.getElementById('muscu-prog-loading-text');
        if (el2) { el2.textContent = LOADING_PHRASES[idx]; el2.style.opacity = '1'; }
      }, 400);
    }, 8000);

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
      if (_loadingInterval) { clearInterval(_loadingInterval); _loadingInterval = null; }
      var html = (data.program || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\n/g, '<br>');
      var footerQuote = FOOTER_QUOTES[Math.floor(Math.random() * FOOTER_QUOTES.length)];
      content.innerHTML = '<div style="text-align:center;padding:8px 0 24px 0;border-bottom:1px solid var(--border,#E5E5E0);margin-bottom:24px;">' +
          '<p style="font-family:Georgia,serif;font-style:italic;font-size:16px;line-height:1.6;color:var(--accent,#1A4A1A);margin:0 auto;max-width:520px;">Voici douze semaines. Elles n\u2019appartiennent qu\u2019à toi.</p>' +
        '</div>' +
        '<div style="white-space:pre-wrap;font-family:\'Helvetica Neue\',Arial,sans-serif;font-size:13px;line-height:1.7;">' + html + '</div>' +
        '<div style="margin-top:24px;text-align:center;border-top:1px solid var(--border,#E5E5E0);padding-top:16px;display:flex;gap:12px;justify-content:center;flex-wrap:wrap;">' +
          '<button onclick="window.print()" style="background:transparent;border:1px solid var(--accent,#1A4A1A);color:var(--accent,#1A4A1A);padding:10px 20px;font-size:11px;letter-spacing:2px;text-transform:uppercase;cursor:pointer;border-radius:2px;font-family:Georgia,serif;">Imprimer / PDF</button>' +
          '<button id="muscu-prog-share" style="background:var(--accent,#1A4A1A);color:var(--ivory,#FAF9F6);border:none;padding:10px 20px;font-size:11px;letter-spacing:2px;text-transform:uppercase;cursor:pointer;border-radius:2px;font-family:Georgia,serif;">⤴ Partager</button>' +
        '</div>' +
        '<div style="margin-top:20px;text-align:center;">' +
          '<p style="font-family:Georgia,serif;font-style:italic;font-size:11px;color:var(--grey3,#9A9A90);margin:0;letter-spacing:0.3px;">' + footerQuote + '</p>' +
        '</div>';
      // Attache le listener du bouton Partager (pas d'inline onclick pour éviter XSS)
      var shareBtn = document.getElementById('muscu-prog-share');
      if (shareBtn) {
        shareBtn.addEventListener('click', function() { shareMuscuProgram(data.program); });
      }
      // Sauvegarder localement
      try { localStorage.setItem('mtd_muscu_program', JSON.stringify({ program: data.program, generatedAt: data.generatedAt })); } catch(e) { console.error('[muscu-prog] save fail:', e); }
    })
    .catch(function(err) {
      _generating = false;
      if (_loadingInterval) { clearInterval(_loadingInterval); _loadingInterval = null; }
      console.error('[muscu-prog] generation error:', err);
      content.innerHTML = '<div style="text-align:center;padding:40px;">' +
        '<div style="font-size:14px;color:var(--red,#5A1010);margin-bottom:16px;">⚠ ' + (err.message || 'Erreur de génération') + '</div>' +
        '<button onclick="window.openMuscuProgramGenerator()" style="background:transparent;border:1px solid var(--grey,#6B6B65);color:var(--grey,#6B6B65);padding:10px 20px;font-size:11px;letter-spacing:2px;text-transform:uppercase;cursor:pointer;border-radius:2px;">Réessayer</button>' +
      '</div>';
    });
  }

  function shareMuscuProgram(programText) {
    var shareData = {
      title: 'Mon programme musculation Smart Fit Coach',
      text: 'Voici mon programme 100% personnalisé généré par Smart Fit Coach — 12 semaines, calculées au kilo près.',
      url: window.location.origin
    };
    if (navigator.share && navigator.canShare && navigator.canShare(shareData)) {
      navigator.share(shareData).catch(function(e) {
        if (e.name !== 'AbortError') console.error('[muscu-prog] share error:', e);
      });
    } else {
      // Fallback : copier dans le presse-papier
      var fallbackText = shareData.title + '\n\n' + shareData.text + '\n\n' + shareData.url;
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(fallbackText).then(function() {
          alert('Lien copié dans le presse-papier !');
        }).catch(function() {
          alert('Partage non disponible sur ce navigateur.');
        });
      } else {
        alert('Partage non disponible sur ce navigateur.');
      }
    }
  }

  window.openMuscuProgramGenerator = openMuscuProgramGenerator;
  window.generateMuscuProgram = generateMuscuProgram;
  window.shareMuscuProgram = shareMuscuProgram;
})();
