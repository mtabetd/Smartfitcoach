/**
 * SmartFitCoach — Proprietary Software
 * Copyright (c) 2024-2026 SmartFitCoach. All rights reserved.
 * Unauthorized copying, modification, distribution, or use of this software
 * is strictly prohibited without explicit written permission.
 * Contact: contact@smartfitcoach.com
 */
// body-analysis.js — Analyse corporelle IA (vision Claude)
// Photos face + dos → analyse morphologique + programme personnalisé
(function() {
'use strict';

var FUNCTION_URL = '/.netlify/functions/body-analysis';
var _panelOpen = false;
var _analyzing = false;
var _photos = { face: null, dos: null }; // base64 strings

// ─── CSS ─────────────────────────────────────────────────────────────────────
var style = document.createElement('style');
style.textContent = [
  // Bouton entrée dans panel Coach IA
  '#ba-trigger{width:100%;padding:10px 16px;background:none;border:1px solid var(--border,#D8D8D0);border-radius:2px;font-family:"Helvetica Neue",Arial,sans-serif;font-size:9px;letter-spacing:3px;text-transform:uppercase;color:var(--black,#0A0A09);cursor:pointer;transition:all 0.2s ease;text-align:left;margin-bottom:8px;}',
  '#ba-trigger:hover{background:var(--black,#0A0A09);color:var(--ivory,#FAF9F6);border-color:var(--black,#0A0A09);}',

  // Panel principal
  '#ba-panel{position:fixed;top:0;left:0;right:0;bottom:0;z-index:9500;background:var(--ivory,#FAF9F6);display:flex;flex-direction:column;transform:translateY(100%);transition:transform 0.35s cubic-bezier(0.25,0.46,0.45,0.94);}',
  '#ba-panel.open{transform:translateY(0);}',

  // Header
  '#ba-header{padding:20px 24px;background:var(--black,#0A0A09);color:var(--ivory,#FAF9F6);display:flex;align-items:center;justify-content:space-between;flex-shrink:0;}',
  '#ba-header-title{font-family:"Helvetica Neue",Arial,sans-serif;font-size:9px;letter-spacing:5px;text-transform:uppercase;}',
  '#ba-header-sub{font-family:Georgia,serif;font-size:13px;font-style:italic;opacity:0.6;margin-top:3px;}',
  '#ba-close{background:none;border:none;color:var(--ivory,#FAF9F6);cursor:pointer;font-size:20px;padding:4px;opacity:0.6;transition:opacity 0.2s ease;line-height:1;min-width:44px;min-height:44px;display:flex;align-items:center;justify-content:center;}',
  '#ba-close:hover{opacity:1;}',

  // Contenu scrollable
  '#ba-content{flex:1;overflow-y:auto;padding:24px;max-width:680px;margin:0 auto;width:100%;}',

  // Upload zones
  '.ba-upload-grid{display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:24px;}',
  '.ba-upload-zone{border:1px dashed var(--border,#D8D8D0);border-radius:2px;padding:32px 16px;text-align:center;cursor:pointer;transition:all 0.2s ease;position:relative;min-height:160px;display:flex;flex-direction:column;align-items:center;justify-content:center;}',
  '.ba-upload-zone:hover{border-color:var(--black,#0A0A09);}',
  '.ba-upload-zone.filled{border-style:solid;border-color:var(--green,#1A4A1A);background:var(--greenbg,rgba(26,74,26,.06));}',
  '.ba-upload-label{font-family:"Helvetica Neue",Arial,sans-serif;font-size:9px;letter-spacing:3px;text-transform:uppercase;color:var(--grey,#6B6B65);margin-bottom:8px;}',
  '.ba-upload-sub{font-family:"Helvetica Neue",Arial,sans-serif;font-size:11px;color:var(--grey3,#9A9A90);}',
  '.ba-upload-preview{width:100%;height:120px;object-fit:cover;border-radius:2px;display:block;}',
  '.ba-upload-check{font-family:"Helvetica Neue",Arial,sans-serif;font-size:9px;letter-spacing:2px;text-transform:uppercase;color:var(--green,#1A4A1A);margin-top:8px;}',
  'input.ba-file-input{display:none;}',

  // Disclaimer
  '#ba-disclaimer{font-family:"Helvetica Neue",Arial,sans-serif;font-size:11px;color:var(--grey3,#9A9A90);line-height:1.6;padding:12px 16px;border:1px solid var(--border,#D8D8D0);border-radius:2px;margin-bottom:20px;border-left:2px solid var(--border,#D8D8D0);}',

  // Bouton analyser
  '#ba-btn{width:100%;padding:18px 28px;background:var(--black,#0A0A09);color:var(--ivory,#FAF9F6);border:1px solid var(--black,#0A0A09);border-radius:2px;font-family:"Helvetica Neue",Arial,sans-serif;font-size:9px;letter-spacing:6px;text-transform:uppercase;cursor:pointer;transition:all 0.2s ease;margin-bottom:24px;}',
  '#ba-btn:disabled{opacity:0.35;cursor:not-allowed;}',
  '#ba-btn:hover:not(:disabled){background:var(--ivory,#FAF9F6);color:var(--black,#0A0A09);}',

  // Loader
  '#ba-loader{text-align:center;padding:40px 0;display:none;}',
  '#ba-loader p{font-family:Georgia,serif;font-size:15px;font-style:italic;color:var(--grey,#6B6B65);margin-top:16px;}',
  '@keyframes baPulse{0%,100%{opacity:0.4;}50%{opacity:1;}}',
  '.ba-dot{display:inline-block;width:6px;height:6px;background:var(--black,#0A0A09);border-radius:50%;margin:0 3px;animation:baPulse 1.2s ease infinite;}',
  '.ba-dot:nth-child(2){animation-delay:0.2s;}.ba-dot:nth-child(3){animation-delay:0.4s;}',

  // Résultats
  '#ba-result{display:none;}',
  '.ba-section-label{font-family:"Helvetica Neue",Arial,sans-serif;font-size:9px;letter-spacing:5px;text-transform:uppercase;color:var(--grey,#6B6B65);border-bottom:1px solid var(--border,#D8D8D0);padding-bottom:6px;margin:32px 0 16px;}',
  '.ba-section-label:first-child{margin-top:0;}',
  '.ba-h2{font-family:Georgia,serif;font-size:20px;font-style:italic;color:var(--black,#0A0A09);margin:0 0 12px;}',
  '.ba-list-item{padding:10px 14px;border-left:2px solid var(--border,#D8D8D0);margin-bottom:8px;font-family:"Helvetica Neue",Arial,sans-serif;font-size:13px;color:var(--black,#0A0A09);line-height:1.5;}',
  '.ba-list-item.green{border-left-color:var(--green,#1A4A1A);background:var(--greenbg,rgba(26,74,26,.06));}',
  '.ba-list-item.blue{border-left-color:var(--blue,#1A3A6A);background:var(--bluebg,rgba(26,58,106,.06));}',
  '.ba-morpho{font-family:Georgia,serif;font-size:13px;font-style:italic;color:var(--black,#0A0A09);line-height:1.7;padding:14px 16px;background:var(--ivory2,#F4F4F0);border:1px solid var(--border,#D8D8D0);border-radius:2px;margin-bottom:8px;}',

  // Programme
  '.ba-prog-meta{display:flex;gap:16px;flex-wrap:wrap;margin-bottom:20px;}',
  '.ba-prog-badge{font-family:"Helvetica Neue",Arial,sans-serif;font-size:9px;letter-spacing:2px;text-transform:uppercase;color:var(--grey,#6B6B65);padding:6px 10px;border:1px solid var(--border,#D8D8D0);border-radius:2px;}',
  '.ba-week{border:1px solid var(--border,#D8D8D0);border-radius:2px;margin-bottom:12px;overflow:hidden;}',
  '.ba-week-header{padding:12px 16px;background:var(--ivory2,#F4F4F0);cursor:pointer;display:flex;justify-content:space-between;align-items:center;font-family:"Helvetica Neue",Arial,sans-serif;font-size:9px;letter-spacing:3px;text-transform:uppercase;}',
  '.ba-week-body{padding:16px;border-top:1px solid var(--border,#D8D8D0);display:none;}',
  '.ba-week-body.open{display:block;}',
  '.ba-seance{margin-bottom:16px;padding-bottom:16px;border-bottom:1px solid var(--border,#D8D8D0);}',
  '.ba-seance:last-child{margin-bottom:0;padding-bottom:0;border-bottom:none;}',
  '.ba-seance-title{font-family:Georgia,serif;font-size:15px;font-style:italic;margin-bottom:8px;color:var(--black,#0A0A09);}',
  '.ba-seance-day{font-family:"Helvetica Neue",Arial,sans-serif;font-size:9px;letter-spacing:3px;text-transform:uppercase;color:var(--grey,#6B6B65);margin-bottom:6px;}',
  '.ba-ex-row{display:flex;justify-content:space-between;align-items:flex-start;padding:8px 0;border-bottom:1px solid var(--ivory3,#EEEDE8);}',
  '.ba-ex-row:last-child{border-bottom:none;}',
  '.ba-ex-name{font-family:"Helvetica Neue",Arial,sans-serif;font-size:12px;color:var(--black,#0A0A09);flex:1;}',
  '.ba-ex-note{font-family:"Helvetica Neue",Arial,sans-serif;font-size:10px;color:var(--grey,#6B6B65);margin-top:2px;}',
  '.ba-ex-meta{font-family:Georgia,serif;font-size:12px;font-style:italic;color:var(--grey,#6B6B65);white-space:nowrap;margin-left:12px;}',

  // Message coach final
  '.ba-coach-msg{font-family:Georgia,serif;font-size:15px;font-style:italic;line-height:1.7;color:var(--black,#0A0A09);padding:20px;border-left:2px solid var(--black,#0A0A09);margin:24px 0;background:var(--ivory2,#F4F4F0);}',

  // Erreur
  '.ba-error{padding:14px 16px;background:var(--redbg,rgba(90,16,16,.06));border:1px solid rgba(90,16,16,0.15);border-radius:2px;font-family:"Helvetica Neue",Arial,sans-serif;font-size:12px;color:var(--red,#5A1010);}',

  // Recommencer
  '#ba-reset{width:100%;padding:12px 24px;background:transparent;color:var(--grey,#6B6B65);border:1px solid var(--border,#D8D8D0);border-radius:2px;font-family:"Helvetica Neue",Arial,sans-serif;font-size:9px;letter-spacing:4px;text-transform:uppercase;cursor:pointer;transition:all 0.2s ease;margin-top:8px;}',
  '#ba-reset:hover{border-color:var(--black,#0A0A09);color:var(--black,#0A0A09);}',

  // Responsive
  '@media(max-width:480px){.ba-upload-grid{grid-template-columns:1fr;}.ba-prog-meta{flex-direction:column;gap:8px;}}'
].join('');
document.head.appendChild(style);

// ─── HELPERS ─────────────────────────────────────────────────────────────────
function getExercisesList() {
  try {
    var exs = window.EXERCISES || {};
    var names = [];
    Object.keys(exs).forEach(function(group) {
      if (Array.isArray(exs[group])) {
        exs[group].forEach(function(ex) { if (ex.n) names.push(ex.n); });
      }
    });
    return names;
  } catch(e) { return []; }
}

function buildContext() {
  // Contexte minimal pour réduire les tokens envoyés au serveur
  var S = window.S || {};
  var user = null;
  try { user = window.AUTH && window.AUTH.getUser ? window.AUTH.getUser() : null; } catch(e) {}
  // FIX P0 stability 2026-04-17 : guard typeof avant .split()
  var _bodyFirst = '';
  if (user && typeof user.name === 'string' && user.name.trim()) {
    _bodyFirst = user.name.trim().split(/\s+/)[0] || '';
  }
  return {
    prenom: _bodyFirst || S.prenom || '',
    sex: S.sex || '',
    age: S.age || '',
    weight: S.weight || '',
    height: S.height || '',
    goal: S.goal || '',
    sportType: S.sportType || '',
    sportLevel: S.sportLevel || '',
    regime: S.regime || 0,
    allowPork: S.allowPork || false,
    allowAlcohol: S.allowAlcohol || false,
    allergies: S.allergies || [],
    intolerances: S.intolerances || [],
    medical: S.medical || [],
    pregnant: S.pregnant || false
  };
}

function compressImage(file, callback) {
  var reader = new FileReader();
  reader.onload = function(e) {
    var img = new Image();
    img.onload = function() {
      var canvas = document.createElement('canvas');
      var maxW = 1440, maxH = 1440;
      var w = img.width, h = img.height;
      if (w > maxW) { h = Math.round(h * maxW / w); w = maxW; }
      if (h > maxH) { w = Math.round(w * maxH / h); h = maxH; }
      canvas.width = w; canvas.height = h;
      canvas.getContext('2d').drawImage(img, 0, 0, w, h);
      var b64 = canvas.toDataURL('image/jpeg', 0.92);
      callback(b64);
    };
    img.src = e.target.result;
  };
  reader.readAsDataURL(file);
}

// ─── RENDU DES RÉSULTATS ──────────────────────────────────────────────────────
function renderResult(container, result) {
  container.innerHTML = '';
  if (!result || result.error) {
    var errEl = document.createElement('div');
    errEl.className = 'ba-error';
    errEl.textContent = result && result.error ? result.error : (window.isEnglish && window.isEnglish()) ? 'Analysis failed. Please check photo quality.' : 'Analyse impossible. Vérifiez la qualité des photos.';
    container.appendChild(errEl);
    return;
  }

  var analyse = result.analyse || {};
  var programme = result.programme || {};

  // ── ANALYSE ──
  var labelAnalyse = document.createElement('div');
  labelAnalyse.className = 'ba-section-label';
  labelAnalyse.textContent = (window.isEnglish && window.isEnglish()) ? 'Body composition analysis' : 'Analyse morphologique';
  container.appendChild(labelAnalyse);

  if (analyse.morphologie) {
    var morphEl = document.createElement('div');
    morphEl.className = 'ba-morpho';
    morphEl.textContent = analyse.morphologie;
    container.appendChild(morphEl);
  }

  if (analyse.pointsForts && analyse.pointsForts.length) {
    var h2pf = document.createElement('div');
    h2pf.className = 'ba-h2';
    h2pf.textContent = (window.isEnglish && window.isEnglish()) ? 'Strengths' : 'Points forts';
    container.appendChild(h2pf);
    analyse.pointsForts.forEach(function(pt) {
      var el = document.createElement('div');
      el.className = 'ba-list-item green';
      el.textContent = pt;
      container.appendChild(el);
    });
  }

  if (analyse.axesDeveloppement && analyse.axesDeveloppement.length) {
    var h2ax = document.createElement('div');
    h2ax.className = 'ba-h2';
    h2ax.style.marginTop = '16px';
    h2ax.textContent = (window.isEnglish && window.isEnglish()) ? 'Areas for improvement' : 'Axes de développement';
    container.appendChild(h2ax);
    analyse.axesDeveloppement.forEach(function(ax) {
      var el = document.createElement('div');
      el.className = 'ba-list-item blue';
      el.textContent = ax;
      container.appendChild(el);
    });
  }

  if (analyse.postureNotes) {
    var postureEl = document.createElement('div');
    postureEl.className = 'ba-list-item';
    postureEl.style.marginTop = '8px';
    postureEl.textContent = analyse.postureNotes;
    container.appendChild(postureEl);
  }

  // ── PROGRAMME ──
  if (programme.titre) {
    var labelProg = document.createElement('div');
    labelProg.className = 'ba-section-label';
    labelProg.textContent = (window.isEnglish && window.isEnglish()) ? 'Personalized program' : 'Programme personnalisé';
    container.appendChild(labelProg);

    var titreProg = document.createElement('h2');
    titreProg.className = 'ba-h2';
    titreProg.style.fontSize = '22px';
    titreProg.textContent = programme.titre;
    container.appendChild(titreProg);

    if (programme.objectif) {
      var objEl = document.createElement('p');
      objEl.style.cssText = 'font-family:Georgia,serif;font-size:13px;font-style:italic;color:var(--grey,#6B6B65);margin:0 0 16px;line-height:1.6;';
      objEl.textContent = programme.objectif;
      container.appendChild(objEl);
    }

    // Badges méta
    var metaDiv = document.createElement('div');
    metaDiv.className = 'ba-prog-meta';
    var badges = [];
    if (programme.disciplines && programme.disciplines.length) badges.push(programme.disciplines.join(' + '));
    if (programme.duree) badges.push(programme.duree);
    if (programme.frequence) badges.push(programme.frequence);
    badges.forEach(function(b) {
      var badge = document.createElement('div');
      badge.className = 'ba-prog-badge';
      badge.textContent = b;
      metaDiv.appendChild(badge);
    });
    container.appendChild(metaDiv);

    // Semaines accordion
    if (Array.isArray(programme.semaines)) {
      programme.semaines.forEach(function(sem) {
        var weekEl = document.createElement('div');
        weekEl.className = 'ba-week';

        var weekHeader = document.createElement('div');
        weekHeader.className = 'ba-week-header';
        // XSS fix: sem.focus comes from AI JSON response — use DOM construction
        var _whSpan1 = document.createElement('span');
        _whSpan1.textContent = ((window.isEnglish && window.isEnglish()) ? 'Week ' : 'Semaine ') + sem.numero + (sem.focus ? ' \u2014 ' + sem.focus : '');
        var _whSpan2 = document.createElement('span');
        _whSpan2.textContent = '+';
        weekHeader.appendChild(_whSpan1);
        weekHeader.appendChild(_whSpan2);
        weekEl.appendChild(weekHeader);

        var weekBody = document.createElement('div');
        weekBody.className = 'ba-week-body' + (sem.numero === 1 ? ' open' : '');

        if (Array.isArray(sem.seances)) {
          sem.seances.forEach(function(seance) {
            var seanceEl = document.createElement('div');
            seanceEl.className = 'ba-seance';

            var dayEl = document.createElement('div');
            dayEl.className = 'ba-seance-day';
            dayEl.textContent = (seance.jour || '') + (seance.discipline ? ' · ' + seance.discipline.toUpperCase() : '');
            seanceEl.appendChild(dayEl);

            if (seance.titre) {
              var titreEl = document.createElement('div');
              titreEl.className = 'ba-seance-title';
              titreEl.textContent = seance.titre;
              seanceEl.appendChild(titreEl);
            }

            if (Array.isArray(seance.exercices)) {
              seance.exercices.forEach(function(ex) {
                var row = document.createElement('div');
                row.className = 'ba-ex-row';
                var nameCol = document.createElement('div');
                var nameEl = document.createElement('div');
                nameEl.className = 'ba-ex-name';
                nameEl.textContent = ex.nom || '';
                nameCol.appendChild(nameEl);
                if (ex.note) {
                  var noteEl = document.createElement('div');
                  noteEl.className = 'ba-ex-note';
                  noteEl.textContent = ex.note;
                  nameCol.appendChild(noteEl);
                }
                row.appendChild(nameCol);
                var metaEl = document.createElement('div');
                metaEl.className = 'ba-ex-meta';
                metaEl.textContent = (ex.series || '') + '×' + (ex.reps || '') + (ex.repos ? ' · ' + ex.repos : '');
                row.appendChild(metaEl);
                seanceEl.appendChild(row);
              });
            }
            weekBody.appendChild(seanceEl);
          });
        }
        weekEl.appendChild(weekBody);

        // Accordion toggle
        weekHeader.addEventListener('click', function() {
          var isOpen = weekBody.classList.contains('open');
          weekBody.classList.toggle('open', !isOpen);
          weekHeader.querySelector('span:last-child').textContent = isOpen ? '+' : '−';
        });

        container.appendChild(weekEl);
      });
    }

    // Nutrition
    if (programme.conseilsNutrition) {
      var nutLabel = document.createElement('div');
      nutLabel.className = 'ba-section-label';
      nutLabel.textContent = (window.isEnglish && window.isEnglish()) ? 'Associated nutrition tips' : 'Conseils nutrition associés';
      container.appendChild(nutLabel);
      var nutEl = document.createElement('div');
      nutEl.className = 'ba-list-item blue';
      nutEl.textContent = programme.conseilsNutrition;
      container.appendChild(nutEl);
    }

    // Message coach
    if (programme.messageCoach) {
      var coachMsg = document.createElement('div');
      coachMsg.className = 'ba-coach-msg';
      coachMsg.textContent = programme.messageCoach;
      container.appendChild(coachMsg);
    }
  }

  // Bouton Partager (Web Share API)
  var shareWrap = document.createElement('div');
  shareWrap.style.cssText = 'margin-top:24px;text-align:center;';
  var shareBtn = document.createElement('button');
  shareBtn.id = 'ba-share-btn';
  shareBtn.textContent = (window.isEnglish && window.isEnglish()) ? '⤴ Share my analysis' : '⤴ Partager mon analyse';
  shareBtn.style.cssText = 'background:var(--black,#0A0A09);color:var(--ivory,#FAF9F6);border:none;padding:14px 28px;font-family:"Helvetica Neue",Arial,sans-serif;font-size:9px;letter-spacing:4px;text-transform:uppercase;cursor:pointer;border-radius:2px;transition:all 0.2s ease;';
  shareBtn.addEventListener('click', shareBodyAnalysis);
  shareWrap.appendChild(shareBtn);
  container.appendChild(shareWrap);

  // Signature Instagram — discrète, en fin d'analyse
  var igWrap = document.createElement('div');
  igWrap.style.cssText = 'margin-top:14px;text-align:center;';
  var igLink = document.createElement('a');
  igLink.href = 'https://instagram.com/smart.fitcoach';
  igLink.target = '_blank';
  igLink.rel = 'noopener noreferrer';
  igLink.textContent = '@smart.fitcoach';
  igLink.style.cssText = 'font-family:Georgia,serif;font-style:italic;font-size:10px;color:var(--grey,#6B6B65);text-decoration:none;letter-spacing:1px;';
  igWrap.appendChild(igLink);
  container.appendChild(igWrap);
}

function shareBodyAnalysis() {
  var shareData = {
    title: (window.isEnglish && window.isEnglish()) ? 'My Smart Fit Coach body analysis' : 'Mon analyse corporelle Smart Fit Coach',
    text: (window.isEnglish && window.isEnglish()) ? 'I just had my body composition analyzed by Smart Fit Coach AI. Personalized program generated in 60 seconds.' : 'Je viens de faire analyser ma composition corporelle par l\'IA Smart Fit Coach. Programme personnalisé généré en 60 secondes.',
    url: window.location.origin
  };
  if (navigator.share && navigator.canShare && navigator.canShare(shareData)) {
    navigator.share(shareData).catch(function(e) {
      if (e.name !== 'AbortError') console.error('[body-analysis] share error:', e);
    });
  } else if (navigator.clipboard) {
    navigator.clipboard.writeText(shareData.title + '\n' + shareData.text + '\n' + shareData.url)
      .then(function() { if (window.showToast) window.showToast((window.isEnglish && window.isEnglish()) ? 'Link copied' : 'Lien copié', 'success', 2200); })
      .catch(function() { if (window.showToast) window.showToast((window.isEnglish && window.isEnglish()) ? 'Sharing not available' : 'Partage non disponible', 'error', 2800); });
  } else {
    if (window.showToast) window.showToast((window.isEnglish && window.isEnglish()) ? 'Sharing not available on this browser' : 'Partage non disponible sur ce navigateur', 'error', 3000);
  }
}
window.shareBodyAnalysis = shareBodyAnalysis;

// ─── PANEL UI ─────────────────────────────────────────────────────────────────
function buildPanel() {
  // Panel principal
  var panel = document.createElement('div');
  panel.id = 'ba-panel';

  // Header
  var header = document.createElement('div');
  header.id = 'ba-header';
  var headerText = document.createElement('div');
  // Static-only header: built via DOM for CSP compliance
  var _baHeaderTitle = document.createElement('div');
  _baHeaderTitle.id = 'ba-header-title';
  _baHeaderTitle.textContent = (window.isEnglish && window.isEnglish()) ? 'AI Body Analysis' : 'Analyse corporelle IA';
  var _baHeaderSub = document.createElement('div');
  _baHeaderSub.id = 'ba-header-sub';
  _baHeaderSub.textContent = (window.isEnglish && window.isEnglish()) ? 'Morphology \u00b7 Tailored program' : 'Morphologie \u00b7 Programme sur mesure';
  headerText.appendChild(_baHeaderTitle);
  headerText.appendChild(_baHeaderSub);
  var closeBtn = document.createElement('button');
  closeBtn.id = 'ba-close';
  closeBtn.textContent = '×';
  closeBtn.setAttribute('aria-label', (window.isEnglish && window.isEnglish()) ? 'Close' : 'Fermer');
  closeBtn.addEventListener('click', closePanel);
  header.appendChild(headerText);
  header.appendChild(closeBtn);
  panel.appendChild(header);

  // Contenu
  var content = document.createElement('div');
  content.id = 'ba-content';

  // Disclaimer
  var disclaimer = document.createElement('div');
  disclaimer.id = 'ba-disclaimer';
  disclaimer.textContent = (window.isEnglish && window.isEnglish()) ? 'AI Analysis — not medical. Your photos are compressed locally and never stored. Consult a health professional for medical advice.' : 'Analyse IA — non médicale. Vos photos sont compressées localement et ne sont jamais stockées. Consultez un professionnel de santé pour tout avis médical.';
  content.appendChild(disclaimer);

  // Upload grid
  var uploadGrid = document.createElement('div');
  uploadGrid.className = 'ba-upload-grid';

  ['face', 'dos'].forEach(function(side) {
    var isEN = (window.isEnglish && window.isEnglish());
    var zone = document.createElement('div');
    zone.className = 'ba-upload-zone';
    zone.id = 'ba-zone-' + side;

    var label = document.createElement('div');
    label.className = 'ba-upload-label';
    label.textContent = 'Photo ' + (isEN ? (side === 'face' ? 'front' : 'back') : side);

    var sub = document.createElement('div');
    sub.className = 'ba-upload-sub';
    sub.textContent = isEN ? 'Click to select' : 'Cliquer pour sélectionner';

    var fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = 'image/*';
    fileInput.capture = 'environment';
    fileInput.className = 'ba-file-input';
    fileInput.id = 'ba-input-' + side;

    zone.appendChild(label);
    zone.appendChild(sub);
    zone.appendChild(fileInput);

    zone.addEventListener('click', function() { fileInput.click(); });

    fileInput.addEventListener('change', function(e) {
      var file = e.target.files[0];
      if (!file) return;
      if (!file.type.startsWith('image/')) {
        if (window.showToast) window.showToast((window.isEnglish && window.isEnglish()) ? 'Please select an image' : 'Veuillez sélectionner une image', 'error', 3000);
        return;
      }
      if (file.size > 10 * 1024 * 1024) {
        if (window.showToast) window.showToast((window.isEnglish && window.isEnglish()) ? 'Image too large (max 10\u00a0MB)' : 'Image trop volumineuse (max 10\u00a0MB)', 'error', 3000);
        return;
      }
      compressImage(file, function(b64) {
        _photos[side] = b64;
        // Afficher preview
        zone.innerHTML = '';
        var preview = document.createElement('img');
        preview.className = 'ba-upload-preview';
        preview.src = b64;
        var check = document.createElement('div');
        check.className = 'ba-upload-check';
        check.textContent = '✓ Photo ' + ((window.isEnglish && window.isEnglish()) ? (side === 'face' ? 'front' : 'back') + ' added' : side + ' ajoutée');
        zone.appendChild(preview);
        zone.appendChild(check);
        zone.classList.add('filled');
        updateBtn();
      });
    });

    uploadGrid.appendChild(zone);
  });
  content.appendChild(uploadGrid);

  // Consentement RGPD — photos envoyées à Anthropic
  // FIX Hermès : checkbox wrap 44×44 tap target (Apple HIG), checkbox visuelle 22px.
  var consentWrap = document.createElement('label');
  consentWrap.htmlFor = 'ba-consent';
  consentWrap.style.cssText = 'display:flex;align-items:flex-start;gap:12px;padding:14px;min-height:44px;border:1px solid var(--border,#D8D8D0);border-radius:2px;margin-bottom:16px;background:var(--ivory2,#F4F4F0);cursor:pointer;';
  var consentCb = document.createElement('input');
  consentCb.type = 'checkbox';
  consentCb.id = 'ba-consent';
  consentCb.style.cssText = 'margin-top:2px;min-width:22px;min-height:22px;width:22px;height:22px;cursor:pointer;accent-color:var(--black,#0A0A09);flex-shrink:0;';
  consentWrap.appendChild(consentCb);
  // FIX Hermès : span au lieu de label (label déjà autour via consentWrap).
  var consentLabel = document.createElement('span');
  consentLabel.style.cssText = 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:12px;color:var(--grey,#6B6B65);line-height:1.6;flex:1;';
  consentLabel.textContent = (window.isEnglish && window.isEnglish()) ? 'I consent to my photos being analyzed by artificial intelligence (Anthropic Claude). Photos are transmitted securely and are not retained after analysis.' : 'J\u2019accepte que mes photos soient analys\u00e9es par intelligence artificielle (Anthropic Claude). Les photos sont transmises de mani\u00e8re s\u00e9curis\u00e9e et ne sont pas conserv\u00e9es apr\u00e8s l\u2019analyse.';
  consentWrap.appendChild(consentLabel);
  content.appendChild(consentWrap);

  // Bouton analyser
  var btn = document.createElement('button');
  btn.id = 'ba-btn';
  btn.setAttribute('aria-label', (window.isEnglish && window.isEnglish()) ? 'Analyze my body composition' : 'Analyser ma composition corporelle');
  btn.textContent = (window.isEnglish && window.isEnglish()) ? 'Start analysis' : 'Lancer l\'analyse';
  btn.disabled = true;
  btn.addEventListener('click', function() {
    if (!consentCb.checked) { if (window.showToast) window.showToast((window.isEnglish && window.isEnglish()) ? 'Please accept the consent before analysis' : 'Veuillez accepter le consentement avant l\u2019analyse', 'error', 3500); return; }
    runAnalysis();
  });
  consentCb.addEventListener('change', function() { updateBtn(); });
  content.appendChild(btn);

  // Loader
  var loader = document.createElement('div');
  loader.id = 'ba-loader';
  // Static loader: built via DOM for CSP compliance
  var _loaderDots = document.createElement('div');
  ['ba-dot', 'ba-dot', 'ba-dot'].forEach(function() {
    var dot = document.createElement('span');
    dot.className = 'ba-dot';
    _loaderDots.appendChild(dot);
  });
  var _loaderTxt = document.createElement('p');
  _loaderTxt.textContent = (window.isEnglish && window.isEnglish()) ? 'AI analysis in progress\u2026 This may take 30 to 60 seconds.' : 'Analyse en cours par votre coach IA... Cela peut prendre 30 \u00e0 60 secondes.';
  loader.appendChild(_loaderDots);
  loader.appendChild(_loaderTxt);
  content.appendChild(loader);

  // Zone résultat
  var resultZone = document.createElement('div');
  resultZone.id = 'ba-result';
  content.appendChild(resultZone);

  // Bouton recommencer (caché par défaut)
  var resetBtn = document.createElement('button');
  resetBtn.id = 'ba-reset';
  resetBtn.textContent = (window.isEnglish && window.isEnglish()) ? 'New analysis' : 'Nouvelle analyse';
  resetBtn.style.display = 'none';
  resetBtn.addEventListener('click', resetAnalysis);
  content.appendChild(resetBtn);

  panel.appendChild(content);
  document.body.appendChild(panel);
}

function updateBtn() {
  var btn = document.getElementById('ba-btn');
  var cb = document.getElementById('ba-consent');
  if (!btn) return;
  btn.disabled = !(_photos.face && _photos.dos && cb && cb.checked);
}

function openPanel() {
  // Premium gate — body analysis = premium feature, server-verified
  window.safeUserStatusCheck({ force: true }).then(function(status) {
    if (!status.isPremium) {
      if (status.source === 'fallback' && window._showPremiumCheckFailed) { window._showPremiumCheckFailed(openPanel); return; }
      if (window.showPaywall) window.showPaywall('body', 'champion');
      return;
    }
    if (!(window.isPlanAtLeast && window.isPlanAtLeast('champion'))) {
      if (window.showPaywall) window.showPaywall('body', 'champion');
      return;
    }
    var panel = document.getElementById('ba-panel');
    if (!panel) { try { buildPanel(); panel = document.getElementById('ba-panel'); } catch(e) {} }
    if (panel) { panel.classList.add('open'); _panelOpen = true; }
  });
}

function closePanel() {
  var panel = document.getElementById('ba-panel');
  if (panel) { panel.classList.remove('open'); _panelOpen = false; }
}

function resetAnalysis() {
  _photos = { face: null, dos: null };
  _analyzing = false;

  var faceZone = document.getElementById('ba-zone-face');
  var dosZone = document.getElementById('ba-zone-dos');

  function rebuildZone(zone, side) {
    if (!zone) return;
    var isEN = (window.isEnglish && window.isEnglish());
    zone.className = 'ba-upload-zone';
    zone.innerHTML = '';
    var label = document.createElement('div');
    label.className = 'ba-upload-label';
    label.textContent = 'Photo ' + (isEN ? (side === 'face' ? 'front' : 'back') : side);
    var sub = document.createElement('div');
    sub.className = 'ba-upload-sub';
    sub.textContent = isEN ? 'Click to select' : 'Cliquer pour sélectionner';
    var fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = 'image/*';
    fileInput.capture = 'environment';
    fileInput.className = 'ba-file-input';
    fileInput.id = 'ba-input-' + side;
    zone.appendChild(label);
    zone.appendChild(sub);
    zone.appendChild(fileInput);
    zone.addEventListener('click', function() { fileInput.click(); });
    fileInput.addEventListener('change', function(e) {
      var file = e.target.files[0];
      if (!file || !file.type.startsWith('image/')) return;
      compressImage(file, function(b64) {
        _photos[side] = b64;
        zone.innerHTML = '';
        var preview = document.createElement('img');
        preview.className = 'ba-upload-preview';
        preview.src = b64;
        var check = document.createElement('div');
        check.className = 'ba-upload-check';
        check.textContent = '✓ Photo ' + (isEN ? (side === 'face' ? 'front' : 'back') + ' added' : side + ' ajoutée');
        zone.appendChild(preview);
        zone.appendChild(check);
        zone.classList.add('filled');
        updateBtn();
      });
    });
  }

  rebuildZone(faceZone, 'face');
  rebuildZone(dosZone, 'dos');

  var btn = document.getElementById('ba-btn');
  if (btn) { btn.disabled = true; btn.style.display = 'block'; }
  var loader = document.getElementById('ba-loader');
  if (loader) loader.style.display = 'none';
  var result = document.getElementById('ba-result');
  if (result) { result.style.display = 'none'; result.innerHTML = ''; }
  var reset = document.getElementById('ba-reset');
  if (reset) reset.style.display = 'none';
}

async function runAnalysis() {
  if (_analyzing) return;
  var images = [];
  if (_photos.face) images.push(_photos.face);
  if (_photos.dos) images.push(_photos.dos);
  if (!images.length) return;

  _analyzing = true;

  var btn = document.getElementById('ba-btn');
  var loader = document.getElementById('ba-loader');
  var resultZone = document.getElementById('ba-result');
  var reset = document.getElementById('ba-reset');

  if (btn) btn.style.display = 'none';
  if (loader) loader.style.display = 'block';
  if (resultZone) { resultZone.style.display = 'none'; resultZone.innerHTML = ''; }
  if (reset) reset.style.display = 'none';

  try {
    var ctx = buildContext();
    // Limiter à 30 exercices max pour réduire les tokens en entrée
    var exercisesDb = getExercisesList().slice(0, 30);

    // Timeout client 43s (marge 2s avant le timeout serveur Netlify 45s)
    var _baCtrl = typeof AbortController !== 'undefined' ? new AbortController() : null;
    var _baTimer = _baCtrl ? setTimeout(function() { _baCtrl.abort(); }, 43000) : null;
    var _baJwt = (window.AUTH && window.AUTH.getJWT) ? await window.AUTH.getJWT().catch(function() { return null; }) : null;
    var _baHdrs = { 'Content-Type': 'application/json' };
    if (_baJwt) _baHdrs['Authorization'] = 'Bearer ' + _baJwt;
    var resp = await fetch(FUNCTION_URL, {
      method: 'POST',
      headers: _baHdrs,
      body: JSON.stringify({ images: images, context: ctx, exercisesDb: exercisesDb }),
      signal: _baCtrl ? _baCtrl.signal : undefined
    });
    if (_baTimer) clearTimeout(_baTimer);

    if (!resp.ok) {
      if (resp.status === 401 || resp.status === 403) { if (window.showPaywall) window.showPaywall('body-analysis'); return; }
      var errBody = await resp.json().catch(function() { return {}; });
      throw new Error(errBody.error || ((window.isEnglish && window.isEnglish()) ? 'Server error HTTP ' : 'Erreur serveur HTTP ') + resp.status);
    }
    var data = await resp.json();

    if (loader) loader.style.display = 'none';
    if (resultZone) resultZone.style.display = 'block';
    if (reset) reset.style.display = 'block';

    if (data.error) {
      var errEl = document.createElement('div');
      errEl.className = 'ba-error';
      errEl.textContent = data.error;
      resultZone.appendChild(errEl);
    } else if (data.result) {
      renderResult(resultZone, data.result);
      if (window.SupaSync && window.SupaSync.saveBodyAnalysis) {
        try { window.SupaSync.saveBodyAnalysis(data.result.analyse, data.result.programme); } catch(e) {}
      }
    } else if (data.rawText) {
      var rawEl = document.createElement('div');
      rawEl.className = 'ba-morpho';
      rawEl.textContent = data.rawText;
      resultZone.appendChild(rawEl);
    }
  } catch(err) {
    if (_baTimer) clearTimeout(_baTimer);
    if (loader) loader.style.display = 'none';
    if (resultZone) {
      resultZone.style.display = 'block';
      var errEl2 = document.createElement('div');
      errEl2.className = 'ba-error';
      errEl2.textContent = (err && err.name === 'AbortError')
        ? ((window.isEnglish && window.isEnglish()) ? 'Analysis is taking too long. Please try again in a moment.' : 'L\'analyse prend trop de temps. Réessaie dans quelques instants.')
        : ((window.isEnglish && window.isEnglish()) ? 'Connection error. Check your network and try again.' : 'Erreur de connexion. Vérifiez votre réseau et réessayez.');
      resultZone.appendChild(errEl2);
    }
    if (reset) reset.style.display = 'block';
  } finally {
    _analyzing = false;
  }
}

// ─── BOUTON DÉCLENCHEUR (injecté dans panel Coach IA) ────────────────────────
function injectTrigger() {
  // Injecter dans la zone suggestions du panel Coach IA
  var suggestions = document.getElementById('ai-suggestions');
  if (suggestions && !document.getElementById('ba-trigger')) {
    var trigger = document.createElement('button');
    trigger.id = 'ba-trigger';
    trigger.setAttribute('aria-label', (window.isEnglish && window.isEnglish()) ? 'Analyze my body composition' : 'Analyser ma composition corporelle');
    trigger.textContent = (window.isEnglish && window.isEnglish()) ? '◆ AI Body Analysis' : '◆ Analyse corporelle IA';
    trigger.addEventListener('click', openPanel);
    suggestions.parentNode.insertBefore(trigger, suggestions);
  }
}

// ─── INIT ─────────────────────────────────────────────────────────────────────
function init() {
  try {
    var loggedIn = window.AUTH && window.AUTH.isLoggedIn && window.AUTH.isLoggedIn();
    if (!loggedIn) return;
    buildPanel();
    injectTrigger();
  } catch(e) {}
}

// Patch window.render pour init après login (même pattern que ai-coach.js)
var _origRender = null;
function _patchRender() {
  if (typeof window.render !== 'function') return;
  if (window.render._baPatched) return;
  var prevRender = window.render;
  window.render = function() {
    prevRender.apply(this, arguments);
    try {
      var loggedIn = window.AUTH && window.AUTH.isLoggedIn && window.AUTH.isLoggedIn();
      if (loggedIn && !document.getElementById('ba-panel')) {
        buildPanel();
      }
      if (loggedIn && !document.getElementById('ba-trigger')) {
        injectTrigger();
      }
      if (!loggedIn) {
        var panel = document.getElementById('ba-panel');
        if (panel) panel.remove();
        var trigger = document.getElementById('ba-trigger');
        if (trigger) trigger.remove();
      }
    } catch(e) {}
  };
  // Forward all patch flags from the previous render so other modules
  // don't re-patch an already-patched function when they check their own flag.
  if (prevRender._coachPatched) window.render._coachPatched = true;
  window.render._baPatched = true;
}

_patchRender();
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', _patchRender);
} else {
  _patchRender();
}

window.BODY_ANALYSIS = { open: openPanel, close: closePanel };

// WCAG 2.1 — Escape key closes the body-analysis modal
document.addEventListener('keydown', function(e) {
  if (e.key !== 'Escape') return;
  var panel = document.getElementById('ba-panel');
  if (panel && panel.classList.contains('open')) {
    closePanel();
  }
});

})();
