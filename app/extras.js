/**
 * SmartFitCoach — Proprietary Software
 * Copyright (c) 2024-2026 SmartFitCoach. All rights reserved.
 * Unauthorized copying, modification, distribution, or use of this software
 * is strictly prohibited without explicit written permission.
 * Contact: contact@smartfitcoach.com
 */
/* ═══════════════════════════════════════════════════════════════
   EXTRAS.JS — Premium Feature Modules
   Smart Fit Coach
   Water Tracker, Meal Timer, Body Measurements, Sleep Tracker,
   Food Calculator, Weekly Summary
   Design: ivoire/noir editorial luxury minimalism
   Requires: window.AUTH, window.BLACKBOX
   ═══════════════════════════════════════════════════════════════ */

/* ── EMBEDDED STYLES ────────────────────────────────────────── */
(function(){
var style = document.createElement('style');
style.textContent = [
  '/* Water tracker */',
  '.water-section { padding:16px 0; }',
  '.water-title { font-family:Georgia,serif; font-size:15px; font-style:italic; margin-bottom:12px; color:var(--black,#0A0A09); }',
  '.water-row { display:flex; gap:10px; justify-content:center; margin:12px 0; padding:4px 0; }',
  '.water-glass { width:44px; height:44px; border:1px solid var(--border,#D8D8D0); background:var(--ivory2,#F4F4F0); cursor:pointer; transition:all 0.2s ease; display:flex; align-items:flex-end; overflow:hidden; border-radius:0 0 2px 2px; position:relative; flex-shrink:0; }',
  '.water-glass.filled { border-color:var(--blue,#1A3A6A); }',
  '.water-glass .water-fill { width:100%; background:rgba(26,58,106,0.15); transition:height 0.3s ease; }',
  '.water-glass.filled .water-fill { height:100%; }',
  '.water-glass:hover { transform:translateY(-2px); }',
  '.water-info { text-align:center; font-family:"Helvetica Neue",sans-serif; font-size:11px; color:var(--grey,#6B6B65); letter-spacing:1px; margin:8px 0; }',
  '.water-progress-bar { height:3px; background:var(--ivory3,#EEEDE8); margin:8px 0; overflow:hidden; }',
  '.water-progress-fill { height:100%; background:var(--blue,#1A3A6A); transition:width 0.4s ease; }',

  '/* Timer */',
  '.timer-section { padding:16px 0; text-align:center; }',
  '.timer-display { font-family:Georgia,serif; font-size:48px; font-style:italic; text-align:center; padding:20px; letter-spacing:2px; color:var(--black,#0A0A09); }',
  '.timer-display.running { color:var(--green,#1A4A1A); }',
  '.timer-recipe { font-family:"Helvetica Neue",sans-serif; font-size:11px; letter-spacing:2px; text-transform:uppercase; color:var(--grey,#6B6B65); margin-bottom:8px; }',
  '.timer-presets { display:flex; gap:8px; justify-content:center; margin:8px 0; flex-wrap:wrap; }',
  '.timer-preset { font-family:"Helvetica Neue",sans-serif; font-size:11px; padding:12px 16px; min-height:44px; box-sizing:border-box; border:1px solid var(--border,#D8D8D0); border-radius:2px; background:var(--ivory2,#F4F4F0); cursor:pointer; letter-spacing:1px; transition:all 0.2s ease; }',
  '.timer-preset:hover { border-color:var(--black,#0A0A09); }',
  '.timer-preset.active { background:var(--black,#0A0A09); color:var(--ivory,#FAF9F6); border-color:var(--black,#0A0A09); }',
  '.timer-btn { font-family:"Helvetica Neue",sans-serif; font-size:11px; letter-spacing:2px; text-transform:uppercase; padding:10px 28px; border:1px solid var(--black,#0A0A09); background:var(--black,#0A0A09); color:var(--ivory,#FAF9F6); cursor:pointer; margin-top:12px; transition:all 0.2s; }',
  '.timer-btn:hover { background:transparent; color:var(--black,#0A0A09); }',
  '.timer-btn.stop { background:transparent; color:var(--black,#0A0A09); }',
  '.timer-btn.stop:hover { background:var(--black,#0A0A09); color:var(--ivory,#FAF9F6); }',
  '@keyframes timerPulse { 0%,100%{ box-shadow:0 0 0 0 rgba(26,74,26,0); } 50%{ box-shadow:0 0 0 6px rgba(26,74,26,0.06); } }',
  '.timer-section.running { animation:timerPulse 2s infinite; border:1px solid var(--green,#1A4A1A); }',

  '/* Measurements */',
  '.measure-section { padding:16px 0; }',
  '.measure-title { font-family:Georgia,serif; font-size:15px; font-style:italic; margin-bottom:14px; color:var(--black,#0A0A09); }',
  '.measure-row { display:grid; grid-template-columns:1fr 80px 60px; gap:8px; align-items:center; padding:6px 0; border-bottom:1px solid var(--ivory3,#EEEDE8); }',
  '.measure-label { font-family:"Helvetica Neue",sans-serif; font-size:11px; color:var(--grey,#6B6B65); letter-spacing:0.5px; }',
  '.measure-input { font-family:Georgia,serif; font-size:16px; text-align:center; padding:8px; border:1px solid var(--border,#D8D8D0); border-radius:2px; background:var(--ivory,#FAF9F6); width:100%; box-sizing:border-box; outline:none; transition:border-color 0.2s; }',
  '.measure-input:focus { border-color:var(--black,#0A0A09); }',
  '.measure-delta { font-family:"Helvetica Neue",sans-serif; font-size:11px; text-align:center; letter-spacing:0.5px; }',
  '.measure-delta.positive { color:var(--red,#5A1010); }',
  '.measure-delta.negative { color:var(--green,#1A4A1A); }',
  '.measure-delta.neutral { color:var(--grey,#6B6B65); }',
  '.measure-btn { font-family:"Helvetica Neue",sans-serif; font-size:11px; letter-spacing:2px; text-transform:uppercase; padding:10px 24px; border:1px solid var(--black,#0A0A09); background:var(--black,#0A0A09); color:var(--ivory,#FAF9F6); cursor:pointer; margin-top:14px; width:100%; transition:all 0.2s; }',
  '.measure-btn:hover { background:transparent; color:var(--black,#0A0A09); }',
  '.measure-history { margin-top:16px; overflow-x:auto; -webkit-overflow-scrolling:touch; }',
  '.measure-history-row { display:grid; grid-template-columns:90px repeat(5,1fr); gap:4px; padding:5px 0; border-bottom:1px solid var(--ivory3,#EEEDE8); font-family:"Helvetica Neue",sans-serif; font-size:11px; text-align:center; min-width:360px; }',
  '.measure-history-header { font-weight:600; letter-spacing:1px; text-transform:uppercase; color:var(--grey,#6B6B65); }',

  '/* Sleep */',
  '.sleep-section { padding:16px 0; }',
  '.sleep-title { font-family:Georgia,serif; font-size:15px; font-style:italic; margin-bottom:12px; color:var(--black,#0A0A09); }',
  '.sleep-hours-row { display:flex; align-items:center; gap:12px; margin:10px 0; }',
  '.sleep-hours-label { font-family:"Helvetica Neue",sans-serif; font-size:11px; color:var(--grey,#6B6B65); flex:1; }',
  '.sleep-hours-input { font-family:Georgia,serif; font-size:18px; text-align:center; width:60px; padding:8px; border:1px solid var(--border,#D8D8D0); border-radius:2px; background:var(--ivory,#FAF9F6); outline:none; }',
  '.sleep-hours-input:focus { border-color:var(--black,#0A0A09); }',
  '.sleep-quality-row { display:flex; gap:8px; margin:12px 0; }',
  '.sleep-quality-card { flex:1; padding:12px 8px; border:1px solid var(--border,#D8D8D0); text-align:center; cursor:pointer; transition:all 0.2s; font-family:"Helvetica Neue",sans-serif; font-size:11px; letter-spacing:1px; }',
  '.sleep-quality-card:hover { border-color:var(--black,#0A0A09); }',
  '.sleep-quality-card.selected { background:var(--black,#0A0A09); color:var(--ivory,#FAF9F6); border-color:var(--black,#0A0A09); }',
  '.sleep-btn { font-family:"Helvetica Neue",sans-serif; font-size:11px; letter-spacing:2px; text-transform:uppercase; padding:10px 24px; border:1px solid var(--black,#0A0A09); background:var(--black,#0A0A09); color:var(--ivory,#FAF9F6); cursor:pointer; margin-top:10px; width:100%; transition:all 0.2s; }',
  '.sleep-btn:hover { background:transparent; color:var(--black,#0A0A09); }',
  '.sleep-stats { margin-top:14px; padding-top:12px; border-top:1px solid var(--ivory3,#EEEDE8); }',
  '.sleep-stat-row { display:flex; justify-content:space-between; padding:4px 0; font-family:"Helvetica Neue",sans-serif; font-size:11px; }',
  '.sleep-stat-label { color:var(--grey,#6B6B65); }',
  '.sleep-stat-value { font-family:Georgia,serif; }',

  '/* Food calc */',
  '.food-section { padding:16px 0; }',
  '.food-title { font-family:Georgia,serif; font-size:15px; font-style:italic; margin-bottom:12px; color:var(--black,#0A0A09); }',
  '.food-search { width:100%; padding:12px 16px; border:1px solid var(--border,#D8D8D0); border-radius:2px; font-family:"Helvetica Neue",sans-serif; font-size:16px; background:var(--ivory,#FAF9F6); outline:none; box-sizing:border-box; transition:border-color 0.2s ease; }',
  '.food-search:focus { border-color:var(--black,#0A0A09); }',
  '.food-results { max-height:200px; overflow-y:auto; border:1px solid var(--border,#D8D8D0); border-top:none; }',
  '.food-results:empty { display:none; }',
  '.food-result-item { padding:8px 14px; cursor:pointer; font-family:"Helvetica Neue",sans-serif; font-size:11px; border-bottom:1px solid var(--ivory3,#EEEDE8); display:flex; justify-content:space-between; transition:background 0.15s; }',
  '.food-result-item:hover { background:var(--ivory2,#F4F4F0); }',
  '.food-result-item:last-child { border-bottom:none; }',
  '.food-detail { margin-top:12px; padding:14px; border:1px solid var(--border,#D8D8D0); background:var(--ivory2,#F4F4F0); }',
  '.food-detail-name { font-family:Georgia,serif; font-size:13px; font-style:italic; margin-bottom:8px; }',
  '.food-detail-macros { display:grid; grid-template-columns:repeat(auto-fit,minmax(60px,1fr)); gap:8px; margin:10px 0; }',
  '.food-detail-macro { text-align:center; }',
  '.food-detail-macro-val { font-family:Georgia,serif; font-size:16px; display:block; }',
  '.food-detail-macro-label { font-family:"Helvetica Neue",sans-serif; font-size:9px; letter-spacing:1px; text-transform:uppercase; color:var(--grey,#6B6B65); }',
  '.food-qty-row { display:flex; align-items:center; gap:10px; margin-top:10px; }',
  '.food-qty-label { font-family:"Helvetica Neue",sans-serif; font-size:11px; color:var(--grey,#6B6B65); }',
  '.food-qty-input { font-family:Georgia,serif; font-size:16px; text-align:center; width:70px; padding:8px; border:1px solid var(--border,#D8D8D0); border-radius:2px; background:var(--ivory,#FAF9F6); outline:none; }',
  '.food-add-btn { font-family:"Helvetica Neue",sans-serif; font-size:9px; letter-spacing:1.5px; text-transform:uppercase; padding:12px 16px; min-height:44px; box-sizing:border-box; border:1px solid var(--border,#D8D8D0); border-radius:2px; background:transparent; cursor:pointer; margin-left:auto; transition:all 0.2s ease; }',
  '.food-add-btn:hover { border-color:var(--black,#0A0A09); background:var(--black,#0A0A09); color:var(--ivory,#FAF9F6); }',

  '/* Weekly summary */',
  '.weekly-section { padding:16px 0; }',
  '.weekly-title { font-family:Georgia,serif; font-size:15px; font-style:italic; margin-bottom:14px; color:var(--black,#0A0A09); }',
  '.week-dots { display:flex; gap:8px; justify-content:center; margin:12px 0; }',
  '.week-dot { width:24px; height:24px; border:1px solid var(--border,#D8D8D0); display:flex; align-items:center; justify-content:center; font-family:"Helvetica Neue",sans-serif; font-size:9px; color:var(--grey3,#C8C8C0); letter-spacing:0; transition:all 0.2s; }',
  '.week-dot.active { background:var(--black,#0A0A09); border-color:var(--black,#0A0A09); color:var(--ivory,#FAF9F6); }',
  '.week-dot.today { border-color:var(--black,#0A0A09); font-weight:600; color:var(--black,#0A0A09); }',
  '.summary-stat { display:flex; justify-content:space-between; padding:8px 0; border-bottom:1px solid var(--ivory3,#EEEDE8); font-family:"Helvetica Neue",sans-serif; font-size:11px; }',
  '.summary-stat:last-child { border-bottom:none; }',
  '.summary-stat-label { color:var(--grey,#6B6B65); letter-spacing:0.5px; }',
  '.summary-stat-value { font-family:Georgia,serif; color:var(--black,#0A0A09); }',
  '.summary-badge { display:inline-block; padding:4px 10px; font-family:"Helvetica Neue",sans-serif; font-size:9px; letter-spacing:1.5px; text-transform:uppercase; border:1px solid var(--border,#D8D8D0); margin-top:10px; }',
  '.summary-badge.earned { background:var(--black,#0A0A09); color:var(--ivory,#FAF9F6); border-color:var(--black,#0A0A09); }',

  '/* Shared */',
  '.extras-widget { border:1px solid var(--border,#D8D8D0); padding:18px; margin:12px 0; background:var(--ivory,#FAF9F6); }',
  '.extras-divider { height:1px; background:var(--ivory3,#EEEDE8); margin:14px 0; }',
  '.extras-empty { font-family:"Helvetica Neue",sans-serif; font-size:11px; color:var(--grey,#6B6B65); text-align:center; padding:16px 0; font-style:italic; }'
].join('\n');
document.head.appendChild(style);
})();


/* ── HELPERS ────────────────────────────────────────────────── */
(function(){
'use strict';

function uid() {
  var u = window.AUTH && window.AUTH.getUser ? window.AUTH.getUser() : null;
  return u ? u.id : 'anon';
}

function storageKey(module) {
  return 'mtd_' + module + '_' + uid();
}

function loadData(module) {
  try {
    var raw = localStorage.getItem(storageKey(module));
    return raw ? JSON.parse(raw) : null;
  } catch (e) { return null; }
}

function saveData(module, data) {
  try {
    localStorage.setItem(storageKey(module), JSON.stringify(data));
  } catch (e) { /* storage full */ }
}

function log(action, data) {
  if (window.BLACKBOX && window.BLACKBOX.log) {
    window.BLACKBOX.log(action, data || {});
  }
}

function todayKey() {
  var d = new Date();
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
}

function el(tag, cls, html) {
  var e = document.createElement(tag);
  if (cls) e.className = cls;
  if (html !== undefined) e.textContent = html; // XSS fix: textContent instead of innerHTML
  return e;
}
// elHTML: use only for trusted static HTML strings, never for user-provided content
function elHTML(tag, cls, html) {
  var e = document.createElement(tag);
  if (cls) e.className = cls;
  if (html !== undefined) e.innerHTML = html;
  return e;
}

function weekStart() {
  var now = new Date();
  var day = now.getDay();
  var diff = (day === 0 ? -6 : 1) - day;
  var mon = new Date(now);
  mon.setDate(now.getDate() + diff);
  mon.setHours(0, 0, 0, 0);
  return mon;
}


/* ═══════════════════════════════════════════════════════════════
   1. WATER TRACKER
   ═══════════════════════════════════════════════════════════════ */
window.WATER_TRACKER = {

  _key: function() { return storageKey('water'); },
  _TARGET: 8,

  // Calcule la cible en verres (250ml) depuis calcHydration() si disponible
  _getTarget: function() {
    if (window.calcHydration && window.S && window.S.weight) {
      var hyd = window.calcHydration();
      if (hyd && hyd.liters > 0) {
        return Math.max(8, Math.ceil(hyd.liters * 4)); // 1 verre = 250ml, min 8
      }
    }
    return this._TARGET;
  },

  _loadAll: function() {
    return loadData('water') || {};
  },

  _saveAll: function(all) {
    saveData('water', all);
  },

  getToday: function() {
    var all = this._loadAll();
    var today = todayKey();
    var glasses = (all[today] && typeof all[today] === 'number') ? all[today] : 0;
    var target = this._getTarget();
    return {
      glasses: glasses,
      target: target,
      percent: target > 0 ? Math.min(100, Math.round((glasses / target) * 100)) : 0
    };
  },

  addGlass: function() {
    var all = this._loadAll();
    var today = todayKey();
    var current = (all[today] && typeof all[today] === 'number') ? all[today] : 0;
    if (current < this._getTarget()) {
      all[today] = current + 1;
      this._saveAll(all);
      if (window.SupaSync) SupaSync.saveWater(today, all[today]);
      log('water_add', { glasses: all[today], date: today });
    }
    return this.getToday();
  },

  removeGlass: function() {
    var all = this._loadAll();
    var today = todayKey();
    var current = (all[today] && typeof all[today] === 'number') ? all[today] : 0;
    if (current > 0) {
      all[today] = current - 1;
      this._saveAll(all);
      if (window.SupaSync) SupaSync.saveWater(today, all[today]);
      log('water_remove', { glasses: all[today], date: today });
    }
    return this.getToday();
  },

  getWeekData: function() {
    var all = this._loadAll();
    var ws = weekStart();
    var result = [];
    for (var i = 0; i < 7; i++) {
      var d = new Date(ws);
      d.setDate(ws.getDate() + i);
      var key = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
      result.push({ date: key, glasses: all[key] || 0 });
    }
    return result;
  },

  renderWidget: function(container) {
    if (!container) return;
    var self = this;
    container.innerHTML = '';

    var wrap = el('div', 'extras-widget water-section');

    var title = el('div', 'water-title', window.t('extras.water'));
    wrap.appendChild(title);

    var row = el('div', 'water-row');
    var data = self.getToday();

    function buildGlasses() {
      row.innerHTML = '';
      data = self.getToday();
      for (var i = 0; i < self._getTarget(); i++) {
        (function(idx) {
          var glass = el('div', 'water-glass' + (idx < data.glasses ? ' filled' : ''));
          var fill = el('div', 'water-fill');
          fill.style.height = (idx < data.glasses) ? '100%' : '0%';
          glass.appendChild(fill);
          glass.addEventListener('click', function() {
            if (idx < data.glasses) {
              // Click filled glass: remove down to this level
              var all = self._loadAll();
              var today = todayKey();
              all[today] = idx;
              self._saveAll(all);
              if (window.SupaSync) SupaSync.saveWater(today, idx);
              log('water_set', { glasses: idx, date: today });
            } else {
              // Click empty glass: fill up to this level + 1
              var all = self._loadAll();
              var today = todayKey();
              all[today] = idx + 1;
              self._saveAll(all);
              if (window.SupaSync) SupaSync.saveWater(today, idx + 1);
              log('water_set', { glasses: idx + 1, date: today });
            }
            buildGlasses();
            updateInfo();
          });
          row.appendChild(glass);
        })(i);
      }
    }

    buildGlasses();
    wrap.appendChild(row);

    var info = el('div', 'water-info');
    var progressWrap = el('div', 'water-progress-bar');
    var progressFill = el('div', 'water-progress-fill');
    progressWrap.appendChild(progressFill);

    function updateInfo() {
      data = self.getToday();
      var litres = (data.glasses * 0.25).toFixed(2).replace(/\.?0+$/, '');
      info.textContent = data.glasses + ' / ' + data.target + ' verres (' + litres + ' L)';
      progressFill.style.width = data.percent + '%';
    }
    updateInfo();

    wrap.appendChild(info);
    wrap.appendChild(progressWrap);

    container.appendChild(wrap);
  }
};


/* ═══════════════════════════════════════════════════════════════
   2. MEAL PREP TIMER
   ═══════════════════════════════════════════════════════════════ */
window.MEAL_TIMER = {

  _interval: null,
  _endTime: null,
  _recipeName: '',
  _audioCtx: null,
  _listeners: [],

  _formatTime: function(totalSeconds) {
    var m = Math.floor(totalSeconds / 60);
    var s = totalSeconds % 60;
    return String(m).padStart(2, '0') + ':' + String(s).padStart(2, '0');
  },

  _beep: function() {
    try {
      var ctx = this._audioCtx || new (window.AudioContext || window.webkitAudioContext)();
      this._audioCtx = ctx;
      // Resume if suspended (Safari autoplay policy)
      if (ctx.state === 'suspended') { try { ctx.resume(); } catch(e) {} }
      // Play three short beeps
      var times = [0, 0.25, 0.5];
      for (var i = 0; i < times.length; i++) {
        (function(t) {
          var osc = ctx.createOscillator();
          var gain = ctx.createGain();
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.frequency.value = 880;
          osc.type = 'sine';
          gain.gain.setValueAtTime(0.3, ctx.currentTime + t);
          gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + t + 0.2);
          osc.start(ctx.currentTime + t);
          osc.stop(ctx.currentTime + t + 0.2);
        })(times[i]);
      }
    } catch (e) { /* Web Audio not available */ }
  },

  _notify: function() {
    this._beep();
    log('timer_done', { recipe: this._recipeName });
    for (var i = 0; i < this._listeners.length; i++) {
      this._listeners[i]('done');
    }
  },

  isRunning: function() {
    return this._interval !== null;
  },

  getRemaining: function() {
    if (!this._endTime) return 0;
    var rem = Math.max(0, Math.ceil((this._endTime - Date.now()) / 1000));
    return rem;
  },

  start: function(minutes, recipeName) {
    this.stop();
    this._recipeName = recipeName || '';
    this._endTime = Date.now() + (minutes * 60 * 1000);
    var self = this;
    // Pre-initialize AudioContext during user interaction (required by Safari autoplay policy).
    // If we wait until the timer fires (setInterval), Safari will block new AudioContext creation.
    if (!this._audioCtx) {
      try {
        this._audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      } catch(e) { /* Web Audio not available */ }
    }
    if (this._audioCtx && this._audioCtx.state === 'suspended') {
      try { this._audioCtx.resume(); } catch(e) {}
    }
    log('timer_start', { minutes: minutes, recipe: recipeName });

    this._interval = setInterval(function() {
      var rem = self.getRemaining();
      for (var i = 0; i < self._listeners.length; i++) {
        self._listeners[i]('tick', rem);
      }
      if (rem <= 0) {
        self.stop();
        self._notify();
      }
    }, 250);

    for (var i = 0; i < this._listeners.length; i++) {
      this._listeners[i]('start', minutes * 60);
    }
  },

  stop: function() {
    if (this._interval) {
      clearInterval(this._interval);
      this._interval = null;
      log('timer_stop', { recipe: this._recipeName });
      for (var i = 0; i < this._listeners.length; i++) {
        this._listeners[i]('stop');
      }
    }
    this._endTime = null;
  },

  onUpdate: function(fn) {
    this._listeners.push(fn);
  },

  renderWidget: function(container) {
    if (!container) return;
    var self = this;
    // Clear stale listeners from previous render cycles to prevent accumulation
    self._listeners = [];
    container.innerHTML = '';

    var wrap = el('div', 'extras-widget timer-section');
    var recipeLabel = el('div', 'timer-recipe', '\u00A0');
    wrap.appendChild(recipeLabel);

    var display = el('div', 'timer-display', '00:00');
    wrap.appendChild(display);

    // Presets
    var presets = [5, 10, 15, 20, 30];
    var presetsRow = el('div', 'timer-presets');
    var selectedMinutes = 10;

    for (var i = 0; i < presets.length; i++) {
      (function(min) {
        var btn = el('button', 'timer-preset' + (min === selectedMinutes ? ' active' : ''), min + ' min');
        btn.addEventListener('click', function() {
          if (self.isRunning()) return;
          selectedMinutes = min;
          var all = presetsRow.querySelectorAll('.timer-preset');
          for (var j = 0; j < all.length; j++) all[j].classList.remove('active');
          btn.classList.add('active');
          display.textContent = self._formatTime(min * 60);
        });
        presetsRow.appendChild(btn);
      })(presets[i]);
    }
    wrap.appendChild(presetsRow);

    // Display initial
    display.textContent = self._formatTime(selectedMinutes * 60);

    // Start/Stop button
    var actionBtn = el('button', 'timer-btn', window.t('extras.start'));
    var running = false;

    function setRunning(isRunning) {
      running = isRunning;
      if (running) {
        actionBtn.textContent = window.t('extras.stop');
        actionBtn.classList.add('stop');
        display.classList.add('running');
        wrap.classList.add('running');
      } else {
        actionBtn.textContent = window.t('extras.start');
        actionBtn.classList.remove('stop');
        display.classList.remove('running');
        wrap.classList.remove('running');
      }
    }

    actionBtn.addEventListener('click', function() {
      if (self.isRunning()) {
        self.stop();
        display.textContent = self._formatTime(selectedMinutes * 60);
        setRunning(false);
      } else {
        self.start(selectedMinutes, '');
        setRunning(true);
      }
    });
    wrap.appendChild(actionBtn);

    // Listen for updates
    self.onUpdate(function(event, data) {
      if (event === 'tick') {
        display.textContent = self._formatTime(data);
      } else if (event === 'done') {
        display.textContent = 'Termine !';
        setRunning(false);
        setTimeout(function() {
          display.textContent = self._formatTime(selectedMinutes * 60);
        }, 3000);
      } else if (event === 'stop') {
        setRunning(false);
      } else if (event === 'start') {
        setRunning(true);
      }
    });

    // If already running, sync
    if (self.isRunning()) {
      setRunning(true);
      display.textContent = self._formatTime(self.getRemaining());
    }

    container.appendChild(wrap);
  }
};


/* ═══════════════════════════════════════════════════════════════
   3. BODY MEASUREMENTS TRACKER
   ═══════════════════════════════════════════════════════════════ */
window.MEASUREMENTS = {

  _FIELDS: [
    { key: 'chest',  label: 'Tour de poitrine' },
    { key: 'waist',  label: 'Tour de taille' },
    { key: 'hips',   label: 'Tour de hanches' },
    { key: 'arms',   label: 'Tour de bras' },
    { key: 'thighs', label: 'Tour de cuisses' }
  ],

  save: function(data) {
    var history = this.getHistory();
    var entry = {
      date: todayKey(),
      timestamp: Date.now(),
      chest: parseFloat(data.chest) || 0,
      waist: parseFloat(data.waist) || 0,
      hips: parseFloat(data.hips) || 0,
      arms: parseFloat(data.arms) || 0,
      thighs: parseFloat(data.thighs) || 0
    };
    // Replace if same day
    var found = false;
    for (var i = 0; i < history.length; i++) {
      if (history[i].date === entry.date) {
        history[i] = entry;
        found = true;
        break;
      }
    }
    if (!found) history.push(entry);
    // Keep last 365
    if (history.length > 365) history = history.slice(-365);
    saveData('measurements', history);
    log('measurements_save', { date: entry.date });
    return entry;
  },

  getHistory: function() {
    return loadData('measurements') || [];
  },

  getLast: function() {
    var h = this.getHistory();
    return h.length > 0 ? h[h.length - 1] : null;
  },

  getPrevious: function() {
    var h = this.getHistory();
    return h.length > 1 ? h[h.length - 2] : null;
  },

  renderForm: function(container) {
    if (!container) return;
    var self = this;
    container.innerHTML = '';

    var wrap = el('div', 'extras-widget measure-section');
    var title = el('div', 'measure-title', window.t('extras.measures'));
    wrap.appendChild(title);

    var last = self.getLast();
    var prev = self.getPrevious();
    var inputs = {};

    for (var i = 0; i < self._FIELDS.length; i++) {
      var f = self._FIELDS[i];
      var row = el('div', 'measure-row');

      var label = el('div', 'measure-label', f.label + ' (cm)');
      row.appendChild(label);

      var input = el('input', 'measure-input');
      input.type = 'number';
      input.min = '20';
      input.max = '200';
      input.step = '0.5';
      input.placeholder = last ? String(last[f.key] != null ? last[f.key] : '--') : '--';
      if (last && last.date === todayKey() && last[f.key] != null) {
        input.value = last[f.key];
      }
      inputs[f.key] = input;
      row.appendChild(input);

      // Delta
      var delta = el('div', 'measure-delta');
      if (last && prev && last[f.key] != null && prev[f.key] != null) {
        var diff = last[f.key] - prev[f.key];
        if (diff > 0) {
          delta.className = 'measure-delta positive';
          delta.textContent = '+' + diff.toFixed(1);
        } else if (diff < 0) {
          delta.className = 'measure-delta negative';
          delta.textContent = diff.toFixed(1);
        } else {
          delta.className = 'measure-delta neutral';
          delta.textContent = '=';
        }
      } else {
        delta.textContent = '--';
        delta.className = 'measure-delta neutral';
      }
      row.appendChild(delta);

      wrap.appendChild(row);
    }

    var btn = el('button', 'measure-btn', window.t('common.save'));
    btn.addEventListener('click', function() {
      var data = {};
      var hasValue = false;
      for (var k in inputs) {
        var v = parseFloat(inputs[k].value);
        if (v && v > 0) {
          data[k] = v;
          hasValue = true;
        } else {
          // Keep previous if not filled
          if (last && last[k]) data[k] = last[k];
          else data[k] = 0;
        }
      }
      if (!hasValue) return;
      self.save(data);
      if (window.GAMIFICATION && window.GAMIFICATION.showToast) {
        window.GAMIFICATION.showToast('Mensurations enregistrées');
      }
      if (window.BLACKBOX) window.BLACKBOX.log('measurements_saved', data);
      self.renderForm(container);
    });
    wrap.appendChild(btn);

    container.appendChild(wrap);
  },

  renderHistory: function(container) {
    if (!container) return;
    var self = this;
    container.innerHTML = '';

    var wrap = el('div', 'extras-widget measure-history');
    var title = el('div', 'measure-title', 'Historique des mensurations');
    wrap.appendChild(title);

    var history = self.getHistory();
    if (history.length === 0) {
      wrap.appendChild(el('div', 'extras-empty', 'Aucune mesure enregistrée.'));
      container.appendChild(wrap);
      return;
    }

    // Header
    var header = el('div', 'measure-history-row measure-history-header');
    header.appendChild(el('div', '', 'Date'));
    header.appendChild(el('div', '', 'Poit.'));
    header.appendChild(el('div', '', 'Taille'));
    header.appendChild(el('div', '', 'Hanch.'));
    header.appendChild(el('div', '', 'Bras'));
    header.appendChild(el('div', '', 'Cuiss.'));
    wrap.appendChild(header);

    // Show last 20
    var start = Math.max(0, history.length - 20);
    for (var i = history.length - 1; i >= start; i--) {
      var entry = history[i];
      var row = el('div', 'measure-history-row');
      row.appendChild(el('div', '', entry.date));
      row.appendChild(el('div', '', entry.chest ? entry.chest.toFixed(1) : '--'));
      row.appendChild(el('div', '', entry.waist ? entry.waist.toFixed(1) : '--'));
      row.appendChild(el('div', '', entry.hips ? entry.hips.toFixed(1) : '--'));
      row.appendChild(el('div', '', entry.arms ? entry.arms.toFixed(1) : '--'));
      row.appendChild(el('div', '', entry.thighs ? entry.thighs.toFixed(1) : '--'));
      wrap.appendChild(row);
    }

    container.appendChild(wrap);
  }
};


/* ═══════════════════════════════════════════════════════════════
   4. SLEEP QUALITY TRACKER
   ═══════════════════════════════════════════════════════════════ */
window.SLEEP_TRACKER = {

  _QUALITIES: ['Mauvais', 'Moyen', 'Bon'],

  logSleep: function(hours, quality) {
    var h = parseFloat(hours);
    if (isNaN(h) || h < 0 || h > 24) return null;
    var q = String(quality);
    if (this._QUALITIES.indexOf(q) === -1) q = 'Moyen';

    var history = this.getHistory();
    var entry = {
      date: todayKey(),
      timestamp: Date.now(),
      hours: Math.round(h * 10) / 10,
      quality: q
    };

    // Replace same day
    var found = false;
    for (var i = 0; i < history.length; i++) {
      if (history[i].date === entry.date) {
        history[i] = entry;
        found = true;
        break;
      }
    }
    if (!found) history.push(entry);
    if (history.length > 365) history = history.slice(-365);
    saveData('sleep', history);
    log('sleep_log', { hours: entry.hours, quality: entry.quality, date: entry.date });
    return entry;
  },

  getHistory: function() {
    return loadData('sleep') || [];
  },

  getAverage: function(days) {
    var history = this.getHistory();
    if (history.length === 0) return null;
    var slice = days ? history.slice(-days) : history;
    var totalH = 0;
    var qualityMap = { 'Mauvais': 1, 'Moyen': 2, 'Bon': 3 };
    var totalQ = 0;
    for (var i = 0; i < slice.length; i++) {
      totalH += slice[i].hours;
      totalQ += (qualityMap[slice[i].quality] || 2);
    }
    return {
      hours: Math.round((totalH / slice.length) * 10) / 10,
      quality: totalQ / slice.length,
      count: slice.length
    };
  },

  getTrend: function() {
    var history = this.getHistory();
    if (history.length < 4) return 'neutral';
    var recent = history.slice(-3);
    var older = history.slice(-6, -3);
    if (older.length === 0) return 'neutral';
    var avgRecent = 0, avgOlder = 0;
    for (var i = 0; i < recent.length; i++) avgRecent += recent[i].hours;
    avgRecent /= recent.length;
    for (var j = 0; j < older.length; j++) avgOlder += older[j].hours;
    avgOlder /= older.length;
    if (avgRecent - avgOlder > 0.3) return 'up';
    if (avgOlder - avgRecent > 0.3) return 'down';
    return 'stable';
  },

  renderWidget: function(container) {
    if (!container) return;
    var self = this;
    container.innerHTML = '';

    var wrap = el('div', 'extras-widget sleep-section');
    var title = el('div', 'sleep-title', window.t('extras.sleep'));
    wrap.appendChild(title);

    // Hours input
    var hoursRow = el('div', 'sleep-hours-row');
    var hoursLabel = el('div', 'sleep-hours-label', 'Heures de sommeil cette nuit');
    hoursRow.appendChild(hoursLabel);
    var hoursInput = el('input', 'sleep-hours-input');
    hoursInput.type = 'number';
    hoursInput.min = '3';
    hoursInput.max = '14';
    hoursInput.step = '0.5';
    hoursInput.value = '7';

    // Pre-fill if already logged today
    var history = self.getHistory();
    var todayEntry = null;
    for (var t = 0; t < history.length; t++) {
      if (history[t].date === todayKey()) { todayEntry = history[t]; break; }
    }
    if (todayEntry) hoursInput.value = todayEntry.hours;

    hoursRow.appendChild(hoursInput);
    wrap.appendChild(hoursRow);

    // Quality cards
    var qualRow = el('div', 'sleep-quality-row');
    var selectedQuality = todayEntry ? todayEntry.quality : null;
    var qualCards = [];

    for (var i = 0; i < self._QUALITIES.length; i++) {
      (function(q) {
        var card = el('div', 'sleep-quality-card' + (selectedQuality === q ? ' selected' : ''), q);
        card.addEventListener('click', function() {
          selectedQuality = q;
          for (var j = 0; j < qualCards.length; j++) qualCards[j].classList.remove('selected');
          card.classList.add('selected');
        });
        qualCards.push(card);
        qualRow.appendChild(card);
      })(self._QUALITIES[i]);
    }
    wrap.appendChild(qualRow);

    // Save button
    var btn = el('button', 'sleep-btn', window.t('common.save'));
    btn.addEventListener('click', function() {
      if (!selectedQuality) return;
      var h = parseFloat(hoursInput.value);
      if (isNaN(h) || h < 3 || h > 14) return;
      self.logSleep(h, selectedQuality);
      self.renderWidget(container);
    });
    wrap.appendChild(btn);

    // Stats
    var avg = self.getAverage(7);
    if (avg && avg.count > 0) {
      var stats = el('div', 'sleep-stats');

      var avgRow = el('div', 'sleep-stat-row');
      avgRow.appendChild(el('span', 'sleep-stat-label', 'Moyenne (7 derniers jours)'));
      avgRow.appendChild(el('span', 'sleep-stat-value', avg.hours + 'h'));
      stats.appendChild(avgRow);

      var qualLabel = avg.quality >= 2.5 ? 'Bonne' : (avg.quality >= 1.5 ? 'Moyenne' : 'Mauvaise');
      var qualRow2 = el('div', 'sleep-stat-row');
      qualRow2.appendChild(el('span', 'sleep-stat-label', 'Qualite moyenne'));
      qualRow2.appendChild(el('span', 'sleep-stat-value', qualLabel));
      stats.appendChild(qualRow2);

      var trend = self.getTrend();
      var trendLabel = trend === 'up' ? 'En hausse' : (trend === 'down' ? 'En baisse' : 'Stable');
      var trendRow = el('div', 'sleep-stat-row');
      trendRow.appendChild(el('span', 'sleep-stat-label', 'Tendance'));
      trendRow.appendChild(el('span', 'sleep-stat-value', trendLabel));
      stats.appendChild(trendRow);

      var countRow = el('div', 'sleep-stat-row');
      countRow.appendChild(el('span', 'sleep-stat-label', 'Nuits enregistrées'));
      countRow.appendChild(el('span', 'sleep-stat-value', String(self.getHistory().length)));
      stats.appendChild(countRow);

      wrap.appendChild(stats);
    }

    container.appendChild(wrap);
  }
};


/* ═══════════════════════════════════════════════════════════════
   5. CALORIE CALCULATOR MINI — CIQUAL-inspired Food Database
   ═══════════════════════════════════════════════════════════════ */
window.FOOD_CALC = {

  /* Mini database: 100 common foods (French names)
     Format: [name, kcal/100g, protein g, carbs g, fat g] */
  _DB: [
    ['Poulet (blanc grillé)', 165, 31.0, 0.0, 3.6],
    ['Poulet (cuisse)', 209, 26.0, 0.0, 10.9],
    ['Dinde (escalope)', 135, 30.0, 0.0, 1.5],
    ['Bœuf (steak haché 5%)', 137, 26.0, 0.0, 3.5],
    ['Bœuf (steak haché 15%)', 218, 24.0, 0.0, 13.5],
    ['Bœuf (entrecôte)', 271, 25.0, 0.0, 19.0],
    ['Veau (escalope)', 143, 28.0, 0.0, 3.2],
    ['Agneau (côte)', 282, 25.0, 0.0, 20.0],
    ['Saumon (filet)', 208, 20.0, 0.0, 13.0],
    ['Thon (en boîte, naturel)', 116, 26.0, 0.0, 1.0],
    ['Thon (frais, grillé)', 144, 30.0, 0.0, 2.0],
    ['Cabillaud (filet)', 82, 18.0, 0.0, 0.7],
    ['Crevettes', 99, 21.0, 0.2, 1.7],
    ['Sardines (en boîte)', 208, 25.0, 0.0, 11.5],
    ['Maquereau (filet)', 205, 19.0, 0.0, 14.0],
    ['Œuf (entier)', 155, 13.0, 1.1, 11.0],
    ['Blanc d\'œuf', 52, 11.0, 0.7, 0.2],
    ['Riz blanc (cuit)', 130, 2.7, 28.0, 0.3],
    ['Riz complet (cuit)', 123, 2.6, 25.5, 1.0],
    ['Riz basmati (cuit)', 121, 3.5, 25.0, 0.4],
    ['Pâtes (cuites)', 131, 5.0, 25.0, 1.1],
    ['Pâtes complètes (cuites)', 124, 5.3, 23.0, 1.2],
    ['Semoule (cuite)', 112, 3.6, 23.0, 0.2],
    ['Boulgour (cuit)', 83, 3.1, 18.6, 0.2],
    ['Quinoa (cuit)', 120, 4.4, 21.3, 1.9],
    ['Pain blanc', 265, 8.5, 51.0, 3.2],
    ['Pain complet', 247, 10.0, 43.0, 3.5],
    ['Pain de mie', 268, 8.0, 48.0, 4.5],
    ['Baguette', 285, 9.0, 56.0, 1.5],
    ['Flocons d\'avoine', 367, 13.5, 58.0, 7.0],
    ['Muesli', 370, 9.0, 64.0, 8.0],
    ['Céréales petit-déjeuner', 380, 7.0, 80.0, 3.0],
    ['Pomme de terre (cuite)', 86, 1.7, 20.0, 0.1],
    ['Patate douce (cuite)', 90, 1.6, 20.7, 0.1],
    ['Lentilles (cuites)', 116, 9.0, 20.0, 0.4],
    ['Pois chiches (cuits)', 164, 8.9, 27.0, 2.6],
    ['Haricots rouges (cuits)', 127, 8.7, 22.8, 0.5],
    ['Haricots blancs (cuits)', 139, 9.7, 25.0, 0.5],
    ['Tofu (nature)', 76, 8.1, 1.9, 4.8],
    ['Banane', 89, 1.1, 23.0, 0.3],
    ['Pomme', 52, 0.3, 14.0, 0.2],
    ['Orange', 47, 0.9, 12.0, 0.1],
    ['Fraises', 33, 0.7, 7.7, 0.3],
    ['Myrtilles', 57, 0.7, 14.5, 0.3],
    ['Raisin', 69, 0.7, 18.0, 0.2],
    ['Mangue', 60, 0.8, 15.0, 0.4],
    ['Ananas', 50, 0.5, 13.0, 0.1],
    ['Kiwi', 61, 1.1, 15.0, 0.5],
    ['Poire', 57, 0.4, 15.0, 0.1],
    ['Pastèque', 30, 0.6, 7.6, 0.2],
    ['Melon', 34, 0.8, 8.2, 0.2],
    ['Dattes (séchées)', 282, 2.5, 75.0, 0.4],
    ['Avocat', 160, 2.0, 8.5, 14.7],
    ['Brocoli', 34, 2.8, 7.0, 0.4],
    ['Épinards (crus)', 23, 2.9, 3.6, 0.4],
    ['Épinards (cuits)', 23, 3.0, 3.8, 0.3],
    ['Tomate', 18, 0.9, 3.9, 0.2],
    ['Carotte', 41, 0.9, 10.0, 0.2],
    ['Courgette', 17, 1.2, 3.1, 0.3],
    ['Concombre', 15, 0.7, 3.6, 0.1],
    ['Poivron', 31, 1.0, 6.0, 0.3],
    ['Haricots verts', 31, 1.8, 7.0, 0.1],
    ['Champignons', 22, 3.1, 3.3, 0.3],
    ['Oignon', 40, 1.1, 9.3, 0.1],
    ['Ail', 149, 6.4, 33.0, 0.5],
    ['Chou-fleur', 25, 1.9, 5.0, 0.3],
    ['Salade verte', 15, 1.4, 2.9, 0.2],
    ['Maïs (en boîte)', 94, 2.9, 19.0, 1.2],
    ['Petits pois', 81, 5.4, 14.5, 0.4],
    ['Yaourt nature', 61, 3.5, 4.7, 3.3],
    ['Yaourt grec', 97, 9.0, 3.6, 5.0],
    ['Fromage blanc 0%', 46, 7.0, 4.0, 0.1],
    ['Fromage blanc 3%', 58, 6.5, 3.7, 3.0],
    ['Skyr', 63, 11.0, 4.0, 0.2],
    ['Lait demi-écrémé', 46, 3.3, 4.8, 1.6],
    ['Lait entier', 63, 3.2, 4.8, 3.5],
    ['Lait d\'amande (non sucré)', 13, 0.4, 0.3, 1.1],
    ['Emmental', 380, 28.0, 0.1, 29.7],
    ['Mozzarella', 280, 22.0, 2.2, 20.0],
    ['Camembert', 299, 20.0, 0.5, 24.0],
    ['Beurre', 717, 0.9, 0.1, 81.0],
    ['Huile d\'olive', 884, 0.0, 0.0, 100.0],
    ['Huile de coco', 862, 0.0, 0.0, 100.0],
    ['Amandes', 579, 21.2, 21.6, 49.9],
    ['Noix', 654, 15.2, 13.7, 65.2],
    ['Cacahuètes', 567, 25.8, 16.1, 49.2],
    ['Noix de cajou', 553, 18.2, 30.2, 43.9],
    ['Beurre de cacahuète', 588, 25.0, 20.0, 50.0],
    ['Graines de chia', 486, 17.0, 42.0, 31.0],
    ['Graines de lin', 534, 18.3, 29.0, 42.0],
    ['Miel', 304, 0.3, 82.0, 0.0],
    ['Confiture', 262, 0.4, 69.0, 0.1],
    ['Chocolat noir 70%', 598, 7.8, 46.0, 43.0],
    ['Chocolat au lait', 535, 7.0, 59.0, 30.0],
    ['Sucre blanc', 400, 0.0, 100.0, 0.0],
    ['Sirop d\'erable', 260, 0.0, 67.0, 0.2],
    ['Crème fraîche 30%', 292, 2.4, 3.0, 30.0],
    ['Houmous', 166, 7.9, 14.3, 9.6],
    ['Saucisse de poulet', 168, 18.0, 2.0, 10.0],
    ['Jambon blanc', 115, 21.0, 1.0, 3.0]
  ],

  _normalize: function(str) {
    return str.toLowerCase()
      .replace(/[àâä]/g, 'a')
      .replace(/[éèêë]/g, 'e')
      .replace(/[ïî]/g, 'i')
      .replace(/[ôö]/g, 'o')
      .replace(/[ùûü]/g, 'u')
      .replace(/ç/g, 'c')
      .replace(/[œ]/g, 'oe').replace(/[æ]/g, 'ae')
      // Apostrophes françaises (d', l', j', n', s', c', qu', m', t')
      // → remplacer par espace pour que les termes soient séparés
      .replace(/\b([dljnscmt]|qu)['']/gi, '$1 ')
      // Autres apostrophes (Domino's, Ben & Jerry's) → supprimer pour coller
      .replace(/['']/g, '')
      .replace(/[\-]/g, ' ');
  },

  // 2026-04 R3 : synonymes FR pour requêtes courantes (cacahuète/arachide/peanut, etc.)
  _SYNONYMS: {
    'cacahuete': 'arachide', 'cacahuetes': 'arachide', 'peanut': 'arachide',
    'courgette': 'zucchini', 'zucchini': 'courgette',
    'patate': 'pomme de terre', 'patates': 'pomme de terre',
    'mais': 'mais', 'tuna': 'thon', 'shrimp': 'crevette', 'shrimps': 'crevette',
    'beef': 'boeuf', 'pork': 'porc', 'chicken': 'poulet', 'salmon': 'saumon',
    'cheese': 'fromage', 'milk': 'lait', 'bread': 'pain', 'rice': 'riz',
    'pasta': 'pates', 'egg': 'oeuf', 'eggs': 'oeuf', 'apple': 'pomme',
    'banana': 'banane', 'orange': 'orange', 'water': 'eau'
  },

  // 2026-04 R3 : Levenshtein bornée 2 — early exit pour perf
  _lev: function(a, b, max) {
    var la = a.length, lb = b.length;
    if (Math.abs(la - lb) > max) return max + 1;
    if (la === 0) return lb;
    if (lb === 0) return la;
    var prev = new Array(lb + 1), cur = new Array(lb + 1);
    for (var j = 0; j <= lb; j++) prev[j] = j;
    for (var i = 1; i <= la; i++) {
      cur[0] = i;
      var rowMin = i;
      for (var jj = 1; jj <= lb; jj++) {
        var cost = a.charCodeAt(i - 1) === b.charCodeAt(jj - 1) ? 0 : 1;
        cur[jj] = Math.min(prev[jj] + 1, cur[jj - 1] + 1, prev[jj - 1] + cost);
        if (cur[jj] < rowMin) rowMin = cur[jj];
      }
      if (rowMin > max) return max + 1; // early exit
      var tmp = prev; prev = cur; cur = tmp;
    }
    return prev[lb];
  },

  search: function(query) {
    if (!query || query.length < 2) return [];
    var q = this._normalize(query);
    var qCompact = q.replace(/\s+/g, ''); // 2026-04 R3 B1 : "bigmac" matche "big mac"
    // 2026-04 R3 : tokens de longueur >=2 (alphabétique) OU >=1 (chiffre)
    var rawTerms = q.split(/\s+/);
    var terms = [];
    for (var rt = 0; rt < rawTerms.length; rt++) {
      var rTok = rawTerms[rt];
      if (rTok.length >= 2) terms.push(rTok);
      else if (rTok.length === 1 && /[0-9]/.test(rTok)) terms.push(rTok);
    }
    if (!terms.length) terms = [q];
    // 2026-04 R3 : enrichir tokens via synonymes FR (sans doublons)
    var synTerms = terms.slice();
    for (var s = 0; s < terms.length; s++) {
      var syn = this._SYNONYMS[terms[s]];
      if (syn && synTerms.indexOf(syn) === -1) synTerms.push(syn);
    }

    var full = [];
    var partial = [];
    var seen = Object.create(null); // 2026-04 R3 B2 : dédup par nom normalisé

    for (var i = 0; i < this._DB.length; i++) {
      var item = this._DB[i];
      var name = this._normalize(item[0]);
      if (seen[name]) continue; // skip exact duplicates
      seen[name] = 1;
      var nameCompact = name.replace(/\s+/g, '');
      var score = 0;
      var wordBoundaryBonus = 0;
      var startsWithBonus = 0;
      var matchedOriginal = 0;
      for (var t = 0; t < synTerms.length; t++) {
        var term = synTerms[t];
        var idx = name.indexOf(term);
        if (idx === -1) continue;
        score++;
        if (t < terms.length) matchedOriginal++;
        var charBefore = idx === 0 ? ' ' : name[idx - 1];
        var charAfter = (idx + term.length >= name.length) ? ' ' : name[idx + term.length];
        var isWordBoundaryStart = !/[a-z0-9]/i.test(charBefore);
        var isWordBoundaryEnd   = !/[a-z0-9]/i.test(charAfter);
        if (isWordBoundaryStart && isWordBoundaryEnd) wordBoundaryBonus += 2;
        if (idx === 0) startsWithBonus += 3;
      }
      // 2026-04 R3 B1 : compound match (bigmac → big mac)
      var compoundBonus = 0;
      if (score === 0 && qCompact.length >= 4 && nameCompact.indexOf(qCompact) !== -1) {
        score = 1;
        compoundBonus = 1;
      }
      if (score === 0) continue;
      var phraseBonus = (name.indexOf(q) !== -1) ? terms.length * 2 : 0;
      var finalScore = score + wordBoundaryBonus + startsWithBonus + phraseBonus + compoundBonus;
      var obj = { name: item[0], kcal: item[1], protein: item[2], carbs: item[3], fat: item[4] };
      if (matchedOriginal === terms.length || (compoundBonus && terms.length === 1)) {
        full.push({ obj: obj, score: finalScore, _alpha: name });
      } else {
        partial.push({ obj: obj, score: finalScore, _alpha: name });
      }
    }

    // 2026-04 R3 : Levenshtein fallback si AUCUN match — résout "yaouurt" → "yaourt"
    if (full.length === 0 && partial.length === 0 && terms.length === 1 && terms[0].length >= 4) {
      var fuzzyTerm = terms[0];
      var fuzzyMax = fuzzyTerm.length <= 5 ? 1 : 2;
      var fuzzySeen = Object.create(null);
      for (var fi = 0; fi < this._DB.length; fi++) {
        var fItem = this._DB[fi];
        var fName = this._normalize(fItem[0]);
        if (fuzzySeen[fName]) continue;
        fuzzySeen[fName] = 1;
        var nameTokens = fName.split(/\s+/);
        var bestDist = fuzzyMax + 1;
        for (var nt = 0; nt < nameTokens.length; nt++) {
          var d = this._lev(nameTokens[nt], fuzzyTerm, fuzzyMax);
          if (d < bestDist) bestDist = d;
        }
        if (bestDist <= fuzzyMax) {
          partial.push({
            obj: { name: fItem[0], kcal: fItem[1], protein: fItem[2], carbs: fItem[3], fat: fItem[4] },
            score: 5 - bestDist, _alpha: fName
          });
        }
      }
    }

    // 2026-04 R3 : tiebreak alphabétique stable (sinon ordre d'insertion = aléatoire)
    var byScoreThenAlpha = function(a, b) {
      if (b.score !== a.score) return b.score - a.score;
      return a._alpha < b._alpha ? -1 : (a._alpha > b._alpha ? 1 : 0);
    };
    full.sort(byScoreThenAlpha);
    partial.sort(byScoreThenAlpha);

    var results = full.concat(partial).map(function(r) { return r.obj; });
    return results.slice(0, 50);
  },

  renderWidget: function(container) {
    if (!container) return;
    var self = this;
    container.innerHTML = '';

    var wrap = el('div', 'extras-widget food-section');
    var title = el('div', 'food-title', 'Recherche nutritionnelle');
    wrap.appendChild(title);

    // Search input
    var searchInput = el('input', 'food-search');
    searchInput.type = 'text';
    searchInput.placeholder = 'Rechercher un aliment...';
    wrap.appendChild(searchInput);

    var resultsList = el('div', 'food-results');
    wrap.appendChild(resultsList);

    var detailPanel = el('div', 'food-detail');
    detailPanel.style.display = 'none';
    wrap.appendChild(detailPanel);

    var debounceTimer = null;

    function showDetail(food) {
      detailPanel.style.display = 'block';
      resultsList.innerHTML = '';
      log('food_view', { food: food.name });

      var qty = 100;
      detailPanel.innerHTML = '';

      var nameEl = el('div', 'food-detail-name', food.name);
      detailPanel.appendChild(nameEl);

      var macros = el('div', 'food-detail-macros');
      var fields = [
        { label: 'KCAL', val: food.kcal },
        { label: 'PROT.', val: food.protein },
        { label: 'GLUC.', val: food.carbs },
        { label: 'LIP.', val: food.fat }
      ];
      var valEls = [];
      for (var i = 0; i < fields.length; i++) {
        var macro = el('div', 'food-detail-macro');
        var valEl = el('span', 'food-detail-macro-val', fields[i].val.toFixed(1));
        macro.appendChild(valEl);
        var labelEl = el('span', 'food-detail-macro-label', fields[i].label);
        macro.appendChild(labelEl);
        macros.appendChild(macro);
        valEls.push({ el: valEl, base: fields[i].val });
      }
      detailPanel.appendChild(macros);

      // Quantity row
      var qtyRow = el('div', 'food-qty-row');
      var qtyLabel = el('span', 'food-qty-label', 'Quantite (g) :');
      qtyRow.appendChild(qtyLabel);

      var qtyInput = el('input', 'food-qty-input');
      qtyInput.type = 'number';
      qtyInput.min = '1';
      qtyInput.max = '2000';
      qtyInput.value = '100';
      qtyInput.addEventListener('input', function() {
        var g = parseFloat(qtyInput.value) || 100;
        var ratio = g / 100;
        for (var j = 0; j < valEls.length; j++) {
          valEls[j].el.textContent = (valEls[j].base * ratio).toFixed(1);
        }
      });
      qtyRow.appendChild(qtyInput);

      var addBtn = el('button', 'food-add-btn', 'Ajouter au journal');
      addBtn.addEventListener('click', function() {
        var g = parseFloat(qtyInput.value) || 100;
        // Calculer les macros scalées à la quantité saisie
        var ratio = g / 100;
        var kcal   = Math.round((food.energy_100g || food.kcal || 0) * ratio);
        var prot   = Math.round((food.proteins_100g || food.protein || food.p || 0) * ratio * 10) / 10;
        var carbs  = Math.round((food.carbohydrates_100g || food.carbs || food.g || 0) * ratio * 10) / 10;
        var fat    = Math.round((food.fat_100g || food.fat || food.l || 0) * ratio * 10) / 10;
        // Déterminer le repas selon l'heure
        var h = new Date().getHours();
        var mealSlot = h < 10 ? 'breakfast' : h < 14 ? 'lunch' : h < 17 ? 'snack' : 'dinner';
        if (window.FOOD_JOURNAL && window.FOOD_JOURNAL.addEntry) {
          window.FOOD_JOURNAL.addEntry(mealSlot, food.name, kcal, prot, carbs, fat, g + 'g', 'scanner');
        }
        log('food_add_journal', { food: food.name, quantity: g });
        if (window.TRACKER) window.TRACKER.track('meal_logged', { source: 'scanner', kcal: kcal });
        addBtn.textContent = 'Ajoute !';
        addBtn.style.borderColor = 'var(--green,#1A4A1A)';
        addBtn.style.color = 'var(--green,#1A4A1A)';
        setTimeout(function() {
          addBtn.textContent = 'Ajouter au journal';
          addBtn.style.borderColor = '';
          addBtn.style.color = '';
        }, 1500);
      });
      qtyRow.appendChild(addBtn);

      detailPanel.appendChild(qtyRow);
    }

    searchInput.addEventListener('input', function() {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(function() {
        var q = searchInput.value.trim();
        detailPanel.style.display = 'none';
        if (q.length < 2) {
          resultsList.innerHTML = '';
          return;
        }
        var results = self.search(q);
        resultsList.innerHTML = '';
        for (var i = 0; i < results.length; i++) {
          (function(food) {
            var item = el('div', 'food-result-item');
            item.appendChild(el('span', '', food.name));
            item.appendChild(el('span', '', food.kcal + ' kcal'));
            item.addEventListener('click', function() {
              searchInput.value = food.name;
              showDetail(food);
            });
            resultsList.appendChild(item);
          })(results[i]);
        }
        if (results.length === 0 && q.length >= 2) {
          var noResult = el('div', 'food-result-item');
          noResult.style.color = 'var(--grey,#6B6B65)';
          noResult.style.fontStyle = 'italic';
          noResult.textContent = 'Aucun résultat';
          resultsList.appendChild(noResult);
        }
      }, 250);
    });

    container.appendChild(wrap);
  }
};


/* ═══════════════════════════════════════════════════════════════
   6. WEEKLY SUMMARY
   ═══════════════════════════════════════════════════════════════ */
window.WEEKLY_SUMMARY = {

  _DAY_LABELS: ['L', 'M', 'M', 'J', 'V', 'S', 'D'],

  _getActiveDays: function() {
    // Check blackbox logs for activity this week
    var ws = weekStart();
    var days = [false, false, false, false, false, false, false];
    try {
      var userId = uid();
      var logs = (window.BLACKBOX && window.BLACKBOX.getUserLogs) ? window.BLACKBOX.getUserLogs(userId) : [];
      for (var i = 0; i < logs.length; i++) {
        var ts = logs[i].timestamp;
        if (ts >= ws.getTime()) {
          var d = new Date(ts);
          var dayIdx = d.getDay();
          dayIdx = dayIdx === 0 ? 6 : dayIdx - 1; // Mon=0 ... Sun=6
          days[dayIdx] = true;
        }
      }
    } catch (e) {}
    return days;
  },

  _getWaterWeekTotal: function() {
    if (!window.WATER_TRACKER) return null;
    var data = window.WATER_TRACKER.getWeekData();
    var total = 0;
    for (var i = 0; i < data.length; i++) total += data[i].glasses;
    return { total: total, litres: (total * 0.25).toFixed(1), avgPerDay: (total / 7).toFixed(1) };
  },

  _getSleepWeekAvg: function() {
    if (!window.SLEEP_TRACKER) return null;
    return window.SLEEP_TRACKER.getAverage(7);
  },

  _getStreak: function() {
    // FIX D6 COHÉRENCE STREAK 2026-04 : déléguer à GAMIFICATION (source de vérité unique)
    // Avant : extras recalculait le streak depuis BLACKBOX.getUserLogs (logique différente
    //         de GAMIFICATION qui lit mtd_streak_<uid>.current). Deux chiffres possibles
    //         pour le "streak" affichés sur des widgets différents (bilan hebdo vs dashboard).
    // Maintenant : GAMIFICATION.getStreak() est la source unique.
    try {
      if (window.GAMIFICATION && typeof window.GAMIFICATION.getStreak === 'function') {
        var g = window.GAMIFICATION.getStreak();
        if (g && typeof g.current === 'number') return g.current;
        if (typeof g === 'number') return g;
      }
      // Fallback localStorage direct (même store que GAMIFICATION)
      var userId = uid();
      var raw = localStorage.getItem('mtd_streak_' + userId);
      if (raw) {
        var parsed = JSON.parse(raw);
        if (parsed && typeof parsed.current === 'number') return parsed.current;
      }
    } catch(e) {}
    return 0;
  },

  _getMilestoneBadge: function(streak) {
    var milestones = [
      { days: 100, label: 'Centurion' },
      { days: 60,  label: 'Diamant' },
      { days: 30,  label: 'Or' },
      { days: 14,  label: 'Argent' },
      { days: 7,   label: 'Bronze' },
      { days: 3,   label: 'Débutant' }
    ];
    var current = null;
    var next = null;
    for (var i = 0; i < milestones.length; i++) {
      if (streak >= milestones[i].days) {
        current = milestones[i];
        next = (i > 0) ? milestones[i - 1] : null;
        break;
      }
    }
    if (!current) {
      current = null;
      next = milestones[milestones.length - 1];
    }
    return { current: current, next: next };
  },

  renderWidget: function(container) {
    if (!container) return;
    var self = this;
    container.innerHTML = '';

    var wrap = el('div', 'extras-widget weekly-section');
    var title = el('div', 'weekly-title', 'Résumé de la semaine');
    wrap.appendChild(title);

    // Day dots
    var dotsRow = el('div', 'week-dots');
    var activeDays = self._getActiveDays();
    var todayIdx = new Date().getDay();
    todayIdx = todayIdx === 0 ? 6 : todayIdx - 1;

    for (var i = 0; i < 7; i++) {
      var cls = 'week-dot';
      if (activeDays[i]) cls += ' active';
      if (i === todayIdx) cls += ' today';
      var dot = el('div', cls, self._DAY_LABELS[i]);
      dotsRow.appendChild(dot);
    }
    wrap.appendChild(dotsRow);

    var divider = el('div', 'extras-divider');
    wrap.appendChild(divider);

    // Active days count
    var activeCount = 0;
    for (var j = 0; j < activeDays.length; j++) if (activeDays[j]) activeCount++;
    var statActive = el('div', 'summary-stat');
    statActive.appendChild(el('span', 'summary-stat-label', 'Jours actifs'));
    statActive.appendChild(el('span', 'summary-stat-value', activeCount + ' / 7'));
    wrap.appendChild(statActive);

    // Water
    var waterData = self._getWaterWeekTotal();
    if (waterData) {
      var statWater = el('div', 'summary-stat');
      statWater.appendChild(el('span', 'summary-stat-label', 'Eau cette semaine'));
      statWater.appendChild(el('span', 'summary-stat-value', waterData.litres + ' L (' + waterData.total + ' verres)'));
      wrap.appendChild(statWater);
    }

    // Sleep
    var sleepData = self._getSleepWeekAvg();
    if (sleepData && sleepData.count > 0) {
      var statSleep = el('div', 'summary-stat');
      statSleep.appendChild(el('span', 'summary-stat-label', 'Sommeil moyen'));
      statSleep.appendChild(el('span', 'summary-stat-value', sleepData.hours + 'h / nuit'));
      wrap.appendChild(statSleep);
    }

    // Streak
    var streak = self._getStreak();
    var statStreak = el('div', 'summary-stat');
    statStreak.appendChild(el('span', 'summary-stat-label', 'Série en cours'));
    statStreak.appendChild(el('span', 'summary-stat-value', streak + ' jour' + (streak > 1 ? 's' : '')));
    wrap.appendChild(statStreak);

    // Measurements trend
    if (window.MEASUREMENTS) {
      var mLast = window.MEASUREMENTS.getLast();
      var mPrev = window.MEASUREMENTS.getPrevious();
      if (mLast && mPrev && mLast.waist && mPrev.waist) {
        var waistDiff = mLast.waist - mPrev.waist;
        var statWaist = el('div', 'summary-stat');
        statWaist.appendChild(el('span', 'summary-stat-label', 'Tour de taille'));
        var sign = waistDiff > 0 ? '+' : '';
        statWaist.appendChild(el('span', 'summary-stat-value', mLast.waist + ' cm (' + sign + waistDiff.toFixed(1) + ')'));
        wrap.appendChild(statWaist);
      }
    }

    // Badge
    var badge = self._getMilestoneBadge(streak);
    if (badge.current) {
      var badgeEl = el('div', 'summary-badge earned', badge.current.label);
      wrap.appendChild(badgeEl);
    }
    if (badge.next) {
      var nextInfo = el('div', 'summary-stat');
      nextInfo.appendChild(el('span', 'summary-stat-label', 'Prochain badge'));
      nextInfo.appendChild(el('span', 'summary-stat-value', badge.next.label + ' (' + badge.next.days + ' jours)'));
      wrap.appendChild(nextInfo);
    }

    log('weekly_summary_view', { activeDays: activeCount, streak: streak });
    container.appendChild(wrap);
  }
};


})();


/* ── REST TIMER (LEGACY — DISABLED) ──────────────────────────
   Désactivé : app-sport.js contient window.RestTimer qui gère
   le timer repos avec une UI plein écran + SVG + transitions.
   L'ancien code injectait du CSS conflictuel (transform:translateY(100%))
   qui cachait l'overlay du nouveau RestTimer.
   On conserve uniquement parseRestTime pour compatibilité.
   ──────────────────────────────────────────────────────────── */
window.REST_TIMER = (function(){
  function parseRestTime(restStr) {
    if (!restStr) return 60;
    var str = String(restStr).toLowerCase().trim();
    if (/(\d+)\s*min/.test(str)) return parseInt(RegExp.$1) * 60;
    if (/(\d+):(\d+)/.test(str)) return parseInt(RegExp.$1) * 60 + parseInt(RegExp.$2);
    if (/(\d+)-(\d+)/.test(str)) return Math.round((parseInt(RegExp.$1) + parseInt(RegExp.$2)) / 2);
    if (/(\d+)\s*s/.test(str)) return parseInt(RegExp.$1);
    var n = parseInt(str);
    return isNaN(n) ? 60 : (n > 10 ? n : n * 60);
  }
  // Stubs pour éviter les crashs si du code legacy appelle REST_TIMER.start/stop
  return {
    start: function() { if (window.RestTimer) window.RestTimer.start.apply(null, arguments); },
    stop: function() { if (window.RestTimer) window.RestTimer.stop(); },
    createButton: function() { return document.createElement('div'); },
    parseRestTime: parseRestTime,
    isActive: function() { return window.RestTimer ? window.RestTimer.getState().active : false; }
  };
})();


/* ═══════════════════════════════════════════════════════════════
   DAILY FOOD JOURNAL — Log meals & compare vs targets
   ═══════════════════════════════════════════════════════════════ */
window.FOOD_JOURNAL = {
  // Helper: date locale YYYY-MM-DD (évite le décalage UTC/local près de minuit)
  _localDateStr: function(d) {
    var dt = d || new Date();
    return dt.getFullYear() + '-' + String(dt.getMonth()+1).padStart(2,'0') + '-' + String(dt.getDate()).padStart(2,'0');
  },
  // Add a food entry
  addEntry: function(meal, name, kcal, protein, carbs, fat, quantity) {
    var user = window.AUTH ? window.AUTH.getUser() : null;
    var key = 'mtd_food_journal_' + (user ? user.id : 'anon');
    var journal = {}; try { journal = JSON.parse(localStorage.getItem(key) || '{}'); } catch(e) { journal = {}; }
    var today = this._localDateStr();
    if (!journal[today]) journal[today] = [];
    journal[today].push({
      meal: meal, // 'breakfast','lunch','snack','dinner'
      name: name,
      kcal: Math.round(kcal),
      p: Math.round(protein * 10) / 10,
      g: Math.round(carbs * 10) / 10,
      l: Math.round(fat * 10) / 10,
      qty: quantity || '100g',
      time: new Date().toLocaleTimeString('fr-FR', {hour:'2-digit', minute:'2-digit'}),
      source: arguments[7] || 'manual'
    });
    localStorage.setItem(key, JSON.stringify(journal));
    // Mise à jour du streak sur action réelle (pas seulement à la connexion)
    if (window.GAMIFICATION) { try { window.GAMIFICATION.updateStreak(); } catch(e) {} }
    // Streak nutrition + compteur repas (gamification)
    if (window.GAMIFICATION && window.GAMIFICATION.incrementMealsLogged) { try { window.GAMIFICATION.incrementMealsLogged(); } catch(e) {} }
    // Sync vers Supabase
    if (window.SupaSync) SupaSync.saveFoodEntry({
      date: today,
      meal: meal,
      name: name,
      kcal: Math.round(kcal),
      p: Math.round(protein * 10) / 10,
      g: Math.round(carbs * 10) / 10,
      l: Math.round(fat * 10) / 10,
      qty: quantity || '100g'
    });
    if (window.BLACKBOX) BLACKBOX.log('food_logged', {meal: meal, name: name, kcal: kcal});
  },

  removeEntry: function(date, index) {
    var user = window.AUTH ? window.AUTH.getUser() : null;
    var key = 'mtd_food_journal_' + (user ? user.id : 'anon');
    var journal = {}; try { journal = JSON.parse(localStorage.getItem(key) || '{}'); } catch(e) { journal = {}; }
    if (journal[date]) {
      journal[date].splice(index, 1);
      if (journal[date].length === 0) delete journal[date];
      localStorage.setItem(key, JSON.stringify(journal));
    }
  },

  getToday: function() {
    var user = window.AUTH ? window.AUTH.getUser() : null;
    var key = 'mtd_food_journal_' + (user ? user.id : 'anon');
    var journal = {}; try { journal = JSON.parse(localStorage.getItem(key) || '{}'); } catch(e) { journal = {}; }
    var today = this._localDateStr();
    return journal[today] || [];
  },

  getDayTotal: function(date) {
    var user = window.AUTH ? window.AUTH.getUser() : null;
    var key = 'mtd_food_journal_' + (user ? user.id : 'anon');
    var journal = {}; try { journal = JSON.parse(localStorage.getItem(key) || '{}'); } catch(e) { journal = {}; }
    var entries = journal[date || this._localDateStr()] || [];
    return entries.reduce(function(acc, e) {
      acc.kcal += (Number(e.kcal) || 0); acc.p += (Number(e.p) || 0); acc.g += (Number(e.g) || 0); acc.l += (Number(e.l) || 0);
      return acc;
    }, {kcal: 0, p: 0, g: 0, l: 0, count: entries.length});
  },

  // Purge automatique des entrées de journal > 6 mois (prévient saturation localStorage)
  // Appelé au chargement du widget ou sur demande explicite.
  purgeOldEntries: function() {
    try {
      var user = window.AUTH ? window.AUTH.getUser() : null;
      var key = 'mtd_food_journal_' + (user ? user.id : 'anon');
      var journal = {}; try { journal = JSON.parse(localStorage.getItem(key) || '{}'); } catch(e2) { return; }
      var cutoff = new Date(); cutoff.setMonth(cutoff.getMonth() - 6);
      var cutoffStr = this._localDateStr(cutoff);
      var changed = false;
      Object.keys(journal).forEach(function(dateKey) {
        if (dateKey < cutoffStr) { delete journal[dateKey]; changed = true; }
      });
      if (changed) { try { localStorage.setItem(key, JSON.stringify(journal)); } catch(e3) {} }
    } catch(e) {}
  },

  loadFromPlan: function() {
    var S = window.S;
    if (!S || !S.weekPlan) return;
    var today = new Date().getDay();
    var dayIdx = today === 0 ? 6 : today - 1;
    var dayPlan = S.weekPlan[dayIdx];
    if (!dayPlan) return;
    var todayStr = this._localDateStr();
    var user = window.AUTH ? window.AUTH.getUser() : null;
    var loadedKey = 'mtd_journal_loaded_' + (user ? user.id : 'anon');
    if (localStorage.getItem(loadedKey) === todayStr) return;
    var self = this;
    var slots = ['breakfast', 'lunch', 'snack', 'dinner'];
    slots.forEach(function(slotKey) {
      var recipe = dayPlan[slotKey];
      if (recipe && recipe.n) {
        self.addEntry(slotKey, recipe.n, recipe.k || 0, recipe.p || 0, recipe.g || 0, recipe.l || 0, '1 portion', 'plan');
      }
    });
    localStorage.setItem(loadedKey, todayStr);
  },

  renderWidget: function(container) {
    // Auto-load today's plan if available
    try { this.loadFromPlan(); } catch(e) {}
    // Inject CSS
    if (!document.getElementById('food-journal-css')) {
      var style = document.createElement('style');
      style.id = 'food-journal-css';
      style.textContent = '\
        .fj-section { margin:16px 0; }\
        .fj-add-row { display:flex; gap:6px; margin-bottom:8px; flex-wrap:wrap; }\
        .fj-add-row input, .fj-add-row select { padding:8px; border:1px solid var(--border,#D8D8D0); border-radius:2px; font-family:"Helvetica Neue",sans-serif; font-size:16px; background:var(--ivory,#FAF9F6); }\
        .fj-add-row input:focus { border-color:var(--black,#0A0A09); outline:none; }\
        .fj-add-btn { padding:8px 14px; background:var(--black,#0A0A09); color:var(--ivory,#FAF9F6); border:none; cursor:pointer; font-family:"Helvetica Neue",sans-serif; font-size:9px; letter-spacing:2px; text-transform:uppercase; }\
        .fj-entry { display:flex; justify-content:space-between; align-items:center; padding:8px 12px; border-bottom:1px solid var(--ivory3,#EEEDE8); font-family:"Helvetica Neue",sans-serif; font-size:11px; }\
        .fj-entry:hover { background:var(--ivory2,#F4F4F0); }\
        .fj-entry-name { flex:1; }\
        .fj-entry-macros { display:flex; gap:10px; color:var(--grey,#6B6B65); font-size:11px; }\
        .fj-entry-delete { cursor:pointer; color:var(--grey3,#C8C8C0); font-size:13px; padding:0 4px; }\
        .fj-entry-delete:hover { color:var(--red,#5A1010); }\
        .fj-total { display:flex; justify-content:space-between; padding:10px 12px; background:var(--ivory2,#F4F4F0); border:1px solid var(--border,#D8D8D0); margin-top:8px; font-family:"Helvetica Neue",sans-serif; font-size:11px; }\
        .fj-progress { height:4px; background:var(--border,#D8D8D0); margin-top:8px; }\
        .fj-progress-fill { height:4px; background:var(--black,#0A0A09); transition:width 0.3s; }\
        .fj-meal-label { font-family:"Helvetica Neue",sans-serif; font-size:9px; letter-spacing:3px; text-transform:uppercase; color:var(--grey,#6B6B65); margin:12px 0 6px; }\
      ';
      document.head.appendChild(style);
    }

    var self = this;
    var section = document.createElement('div');
    section.className = 'fj-section';

    // Section label
    var label = document.createElement('div');
    label.style.cssText = 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:9px;letter-spacing:4px;text-transform:uppercase;color:var(--grey,#6B6B65);margin-bottom:12px;padding-bottom:8px;border-bottom:1px solid var(--border,#D8D8D0)';
    label.textContent = 'Journal alimentaire du jour';
    section.appendChild(label);

    // Quick add form
    var addRow = document.createElement('div');
    addRow.className = 'fj-add-row';

    var mealSelect = document.createElement('select');
    [{v:'breakfast',l:'Petit-d\u00E9j'},{v:'lunch',l:'D\u00E9jeuner'},{v:'snack',l:'Collation'},{v:'dinner',l:'D\u00EEner'}].forEach(function(m){
      var opt = document.createElement('option');
      opt.value = m.v; opt.textContent = m.l;
      mealSelect.appendChild(opt);
    });
    addRow.appendChild(mealSelect);

    var nameInput = document.createElement('input');
    nameInput.type = 'text';
    nameInput.placeholder = 'Aliment...';
    nameInput.style.cssText = 'width:100%;padding:8px;border:1px solid var(--border,#D8D8D0);border-radius:2px;font-family:"Helvetica Neue",sans-serif;font-size:16px;background:transparent;box-sizing:border-box;';
    nameInput.setAttribute('autocomplete', 'off');

    var _acWrap = document.createElement('div');
    _acWrap.style.cssText = 'position:relative;flex:1;min-width:120px;';
    _acWrap.appendChild(nameInput);

    var _acDrop = document.createElement('div');
    _acDrop.style.cssText = 'display:none;position:absolute;top:100%;left:0;right:0;z-index:9999;background:var(--ivory,#FAF9F6);border:1px solid var(--border,#D8D8D0);border-top:none;max-height:220px;overflow-y:auto;box-shadow:0 4px 12px rgba(0,0,0,0.12);border-radius:0 0 2px 2px;';
    _acWrap.appendChild(_acDrop);

    var _acTimer = null;
    var _acAbort = null;

    nameInput.addEventListener('input', function() {
      clearTimeout(_acTimer);
      var q = nameInput.value.trim();
      if (q.length < 2) { _acDrop.style.display = 'none'; return; }
      _acTimer = setTimeout(function() {
        if (_acAbort) { try { _acAbort.abort(); } catch(e2) {} }
        var controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
        _acAbort = controller;
        var url = 'https://world.openfoodfacts.org/cgi/search.pl?action=process&search_terms='
          + encodeURIComponent(q)
          + '&json=true&page_size=6&lc=fr&cc=fr&fields=product_name,nutriments,quantity';
        fetch(url, controller ? { signal: controller.signal } : {})
          .then(function(r) { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); })
          .then(function(data) {
            while (_acDrop.firstChild) _acDrop.removeChild(_acDrop.firstChild);
            var products = (data.products || []).filter(function(prod) {
              return prod.product_name && prod.nutriments && (prod.nutriments['energy-kcal_100g'] || 0) > 0;
            });
            if (products.length === 0) { _acDrop.style.display = 'none'; return; }
            products.forEach(function(prod) {
              var item = document.createElement('div');
              item.style.cssText = 'padding:9px 12px;cursor:pointer;border-bottom:1px solid var(--ivory3,#EEEDE8);';
              var nm = document.createElement('div');
              nm.style.cssText = 'font-family:"Helvetica Neue",sans-serif;font-size:12px;font-weight:500;color:var(--black,#0A0A09);';
              nm.textContent = prod.product_name || '';
              item.appendChild(nm);
              var meta = document.createElement('div');
              meta.style.cssText = 'font-family:"Helvetica Neue",sans-serif;font-size:10px;color:var(--grey,#6B6B65);margin-top:2px;';
              var n = prod.nutriments;
              meta.textContent = Math.round(n['energy-kcal_100g'] || 0) + ' kcal'
                + ' \xB7 P:' + (Math.round((n['proteins_100g'] || 0) * 10) / 10) + 'g'
                + ' \xB7 G:' + (Math.round((n['carbohydrates_100g'] || 0) * 10) / 10) + 'g'
                + ' \xB7 L:' + (Math.round((n['fat_100g'] || 0) * 10) / 10) + 'g'
                + ' /100g';
              item.appendChild(meta);
              item.addEventListener('mouseover', function() { item.style.background = 'var(--ivory3,#EEEDE8)'; });
              item.addEventListener('mouseout', function() { item.style.background = 'transparent'; });
              item.addEventListener('mousedown', function(ev) {
                ev.preventDefault();
                nameInput.value = prod.product_name || '';
                kcalInput.value = Math.round(n['energy-kcal_100g'] || 0);
                pInput.value = Math.round((n['proteins_100g'] || 0) * 10) / 10;
                gInput.value = Math.round((n['carbohydrates_100g'] || 0) * 10) / 10;
                lInput.value = Math.round((n['fat_100g'] || 0) * 10) / 10;
                _acDrop.style.display = 'none';
              });
              _acDrop.appendChild(item);
            });
            _acDrop.style.display = 'block';
          })
          .catch(function(err) {
            if (err && err.name === 'AbortError') return;
            _acDrop.style.display = 'none';
          });
      }, 350);
    });

    nameInput.addEventListener('blur', function() {
      setTimeout(function() { _acDrop.style.display = 'none'; }, 200);
    });

    nameInput.addEventListener('keydown', function(ev) {
      if (ev.key === 'Escape') { _acDrop.style.display = 'none'; }
    });

    addRow.appendChild(_acWrap);

    var kcalInput = document.createElement('input');
    kcalInput.type = 'number'; kcalInput.placeholder = 'kcal'; kcalInput.style.width = '60px';
    addRow.appendChild(kcalInput);

    var pInput = document.createElement('input');
    pInput.type = 'number'; pInput.placeholder = 'P(g)'; pInput.style.width = '50px'; pInput.step = '0.1';
    addRow.appendChild(pInput);

    var gInput = document.createElement('input');
    gInput.type = 'number'; gInput.placeholder = 'G(g)'; gInput.style.width = '50px'; gInput.step = '0.1';
    addRow.appendChild(gInput);

    var lInput = document.createElement('input');
    lInput.type = 'number'; lInput.placeholder = 'L(g)'; lInput.style.width = '50px'; lInput.step = '0.1';
    addRow.appendChild(lInput);

    var addBtn = document.createElement('button');
    addBtn.className = 'fj-add-btn';
    addBtn.textContent = '+ Ajouter';
    addBtn.onclick = function() {
      var name = nameInput.value.trim();
      var kcal = parseFloat(kcalInput.value);
      if (!name || isNaN(kcal)) return;
      self.addEntry(mealSelect.value, name, kcal, parseFloat(pInput.value) || 0, parseFloat(gInput.value) || 0, parseFloat(lInput.value) || 0);
      if (window.APP_RENDER) APP_RENDER();
      else if (window.render) render();
    };
    addRow.appendChild(addBtn);
    section.appendChild(addRow);

    // Load plan button
    if (window.S && window.S.weekPlan) {
      var self2 = this;
      var loadBtn = document.createElement('div');
      loadBtn.style.cssText = 'padding:8px 14px;border:1px solid var(--border,#D8D8D0);background:var(--ivory2,#F4F4F0);cursor:pointer;font-family:"Helvetica Neue",sans-serif;font-size:11px;letter-spacing:1px;text-align:center;margin-bottom:10px';
      loadBtn.textContent = '\uD83D\uDCCB Charger le plan du jour';
      loadBtn.onclick = function() {
        var user2 = window.AUTH ? window.AUTH.getUser() : null;
        localStorage.removeItem('mtd_journal_loaded_' + (user2 ? user2.id : 'anon'));
        self2.loadFromPlan();
        if (window.APP_RENDER) APP_RENDER(); else if (window.render) render();
      };
      section.appendChild(loadBtn);
    }

    // Today's entries grouped by meal
    var today = new Date().toISOString().split('T')[0];
    var entries = this.getToday();
    var meals = {breakfast: [], lunch: [], snack: [], dinner: []};
    var mealLabels = {breakfast: 'Petit-d\u00E9jeuner', lunch: 'D\u00E9jeuner', snack: 'Collation', dinner: 'D\u00EEner'};

    entries.forEach(function(e, idx) {
      if (meals[e.meal]) meals[e.meal].push({entry: e, index: idx});
    });

    Object.keys(meals).forEach(function(mealKey) {
      var mealEntries = meals[mealKey];
      if (mealEntries.length === 0) return;

      var mealLabel = document.createElement('div');
      mealLabel.className = 'fj-meal-label';
      mealLabel.textContent = mealLabels[mealKey];
      section.appendChild(mealLabel);

      mealEntries.forEach(function(item) {
        var row = document.createElement('div');
        row.className = 'fj-entry';

        var nameSpan = document.createElement('span');
        nameSpan.className = 'fj-entry-name';
        nameSpan.textContent = item.entry.name + (item.entry.time ? ' \u00B7 ' + item.entry.time : '');
        row.appendChild(nameSpan);

        var macros = document.createElement('span');
        macros.className = 'fj-entry-macros';
        // XSS fix: use DOM construction — entry values come from localStorage (user-controlled)
        var kcalSpan = document.createElement('span'); kcalSpan.textContent = item.entry.kcal + ' kcal';
        var pSpan = document.createElement('span'); pSpan.textContent = 'P' + item.entry.p;
        var gSpan = document.createElement('span'); gSpan.textContent = 'G' + item.entry.g;
        var lSpan = document.createElement('span'); lSpan.textContent = 'L' + item.entry.l;
        macros.appendChild(kcalSpan); macros.appendChild(pSpan); macros.appendChild(gSpan); macros.appendChild(lSpan);
        row.appendChild(macros);

        var del = document.createElement('span');
        del.className = 'fj-entry-delete';
        del.textContent = '\u2715';
        del.onclick = function() {
          // 2026-04 NIVEAU 1 : confirmation avant suppression aliment (1 clic = perte macros)
          var entryName = (item.entry && item.entry.name) || 'cet aliment';
          if (!confirm('Retirer « ' + entryName + ' » du journal ?')) return;
          self.removeEntry(today, item.index);
          if (window.APP_RENDER) APP_RENDER();
          else if (window.render) render();
        };
        row.appendChild(del);

        section.appendChild(row);
      });
    });

    // Daily total vs target
    var total = this.getDayTotal();
    var target = window.calcTarget ? window.calcTarget() : 0;
    var targetMacros = window.calcMacros ? window.calcMacros() : {g:0, p:0, l:0};

    if (total.count > 0 || target > 0) {
      var totalRow = document.createElement('div');
      totalRow.className = 'fj-total';
      // XSS fix: use DOM construction — total values derive from localStorage entries
      var kcalSummary = document.createElement('span');
      var boldKcal = document.createElement('strong'); boldKcal.textContent = total.kcal;
      kcalSummary.appendChild(boldKcal);
      kcalSummary.appendChild(document.createTextNode(' / ' + target + ' kcal'));
      var macroSummary = document.createElement('span');
      // 2026-04 UX-2 : libellés lisibles (avant "P 165/180g" → incompréhensible ; maintenant "Prot 165/180g")
      macroSummary.textContent = 'Prot ' + total.p.toFixed(0) + '/' + targetMacros.p + 'g \u00B7 Gluc ' + total.g.toFixed(0) + '/' + targetMacros.g + 'g \u00B7 Lip ' + total.l.toFixed(0) + '/' + targetMacros.l + 'g';
      totalRow.appendChild(kcalSummary);
      totalRow.appendChild(macroSummary);
      section.appendChild(totalRow);

      // Progress bar
      if (target > 0) {
        var pct = Math.min(100, Math.round(total.kcal / target * 100));
        var progBar = document.createElement('div');
        progBar.className = 'fj-progress';
        var progFill = document.createElement('div');
        progFill.className = 'fj-progress-fill';
        progFill.style.width = pct + '%';
        progFill.style.background = pct > 110 ? 'var(--red,#5A1010)' : pct > 90 ? 'var(--green,#1A4A1A)' : 'var(--black,#0A0A09)';
        progBar.appendChild(progFill);
        section.appendChild(progBar);

        var pctLabel = document.createElement('div');
        pctLabel.style.cssText = 'text-align:center;font-family:"Helvetica Neue",sans-serif;font-size:11px;color:var(--grey);margin-top:4px';
        pctLabel.textContent = pct + '% de l\'objectif';
        section.appendChild(pctLabel);
      }
    }

    container.appendChild(section);
  }
};


/* ═══════════════════════════════════════════════════════════════
   PHOTO_PROGRESS — Progress Photos Comparison
   Save multiple progress photos over time and compare side by side.
   ═══════════════════════════════════════════════════════════════ */

window.PHOTO_PROGRESS = {
  // Save a photo with date
  savePhoto: function(type, dataURL) {
    // type: 'front' or 'back'
    var user = window.AUTH ? window.AUTH.getUser() : null;
    var key = 'mtd_progress_photos_' + (user ? user.id : 'anon');
    var photos = []; try { photos = JSON.parse(localStorage.getItem(key) || '[]'); } catch(e) { photos = []; }
    photos.push({
      type: type,
      date: new Date().toISOString().split('T')[0],
      data: dataURL
    });
    // Keep max 20 photos (localStorage size limit)
    if (photos.length > 20) photos = photos.slice(-20);
    try {
      localStorage.setItem(key, JSON.stringify(photos));
    } catch(e) {
      if (photos.length > 1) { photos.shift(); try { localStorage.setItem(key, JSON.stringify(photos)); } catch(e2) {} }
    }
    if (window.BLACKBOX) BLACKBOX.log('progress_photo_saved', {type: type});
  },

  getPhotos: function() {
    var user = window.AUTH ? window.AUTH.getUser() : null;
    var key = 'mtd_progress_photos_' + (user ? user.id : 'anon');
    try { return JSON.parse(localStorage.getItem(key) || '[]'); } catch(e) { return []; }
  },

  renderWidget: function(container) {
    // Inject CSS if not already
    if (!document.getElementById('photo-progress-css')) {
      var style = document.createElement('style');
      style.id = 'photo-progress-css';
      style.textContent = [
        '.progress-photos-section { margin:16px 0; }',
        '.photo-comparison { display:flex; gap:8px; margin:12px 0; overflow-x:auto; }',
        '.photo-entry { flex-shrink:0; width:140px; text-align:center; border:1px solid var(--border,#D8D8D0); background:var(--ivory2,#F4F4F0); padding:8px; }',
        '.photo-entry img { width:100%; height:180px; object-fit:cover; margin-bottom:6px; }',
        '.photo-entry .photo-date { font-family:"Helvetica Neue",sans-serif; font-size:9px; color:var(--grey,#6B6B65); letter-spacing:1px; }',
        '.photo-upload-btn { display:flex; align-items:center; justify-content:center; gap:8px; padding:12px; border:2px dashed var(--border,#D8D8D0); background:var(--ivory2,#F4F4F0); cursor:pointer; font-family:"Helvetica Neue",sans-serif; font-size:11px; letter-spacing:2px; text-transform:uppercase; color:var(--grey,#6B6B65); transition:all 0.2s; margin-bottom:8px; }',
        '.photo-upload-btn:hover { border-color:var(--black,#0A0A09); color:var(--black,#0A0A09); }',
        '.compare-slider { position:relative; width:100%; max-width:300px; margin:12px auto; overflow:hidden; height:400px; border:1px solid var(--border); }',
        '.compare-slider img { position:absolute; top:0; left:0; width:100%; height:100%; object-fit:cover; }',
        '.compare-slider .compare-overlay { position:absolute; top:0; left:0; width:50%; height:100%; overflow:hidden; border-right:2px solid var(--black,#0A0A09); }',
        '.compare-slider .compare-overlay img { width:200%; max-width:none; }'
      ].join('\n');
      document.head.appendChild(style);
    }

    var section = document.createElement('div');
    section.className = 'progress-photos-section';

    // Section label
    var label = document.createElement('div');
    label.style.cssText = 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:9px;letter-spacing:4px;text-transform:uppercase;color:var(--grey,#6B6B65);margin-bottom:12px;padding-bottom:8px;border-bottom:1px solid var(--border,#D8D8D0)';
    label.textContent = 'Photos de progression';
    section.appendChild(label);

    // Upload buttons
    var uploadRow = document.createElement('div');
    uploadRow.style.cssText = 'display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:12px';

    var self = this;
    ['front', 'back'].forEach(function(type) {
      var btn = document.createElement('div');
      btn.className = 'photo-upload-btn';
      btn.textContent = '\uD83D\uDCF7 Photo ' + (type === 'front' ? 'de face' : 'de dos');
      btn.onclick = function() {
        var input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        input.capture = 'environment';
        input.onchange = function(e) {
          var file = e.target.files[0];
          if (!file) return;
          var reader = new FileReader();
          reader.onload = function(ev) {
            // Resize image to save localStorage space
            var img = new Image();
            img.onload = function() {
              var canvas = document.createElement('canvas');
              var maxW = 400;
              var scale = Math.min(1, maxW / img.width);
              canvas.width = img.width * scale;
              canvas.height = img.height * scale;
              canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
              var resized = canvas.toDataURL('image/jpeg', 0.7);
              self.savePhoto(type, resized);
              if (window.GAMIFICATION) {
                GAMIFICATION.unlockBadge('first_photo');
                var photos = self.getPhotos();
                var hasFront = photos.some(function(p){ return p.type === 'front'; });
                var hasBack = photos.some(function(p){ return p.type === 'back'; });
                if (hasFront && hasBack) GAMIFICATION.unlockBadge('both_photos');
              }
              if (window.APP_RENDER) APP_RENDER();
              else if (window.render) render();
            };
            img.src = ev.target.result;
          };
          reader.readAsDataURL(file);
        };
        input.click();
      };
      uploadRow.appendChild(btn);
    });
    section.appendChild(uploadRow);

    // Show existing photos
    var photos = this.getPhotos();
    if (photos.length > 0) {
      // Front photos timeline
      var frontPhotos = photos.filter(function(p){ return p.type === 'front'; });
      var backPhotos = photos.filter(function(p){ return p.type === 'back'; });

      if (frontPhotos.length > 0) {
        var frontLabel = document.createElement('div');
        frontLabel.style.cssText = 'font-family:"Helvetica Neue",sans-serif;font-size:9px;color:var(--grey);margin:8px 0 4px;letter-spacing:2px;text-transform:uppercase';
        frontLabel.textContent = 'Face \u2014 ' + frontPhotos.length + ' photos';
        section.appendChild(frontLabel);

        var frontRow = document.createElement('div');
        frontRow.className = 'photo-comparison';
        frontPhotos.forEach(function(photo) {
          var entry = document.createElement('div');
          entry.className = 'photo-entry';
          var img = document.createElement('img');
          img.src = photo.data;
          img.alt = 'Face ' + photo.date;
          entry.appendChild(img);
          var date = document.createElement('div');
          date.className = 'photo-date';
          date.textContent = photo.date;
          entry.appendChild(date);
          frontRow.appendChild(entry);
        });
        section.appendChild(frontRow);
      }

      if (backPhotos.length > 0) {
        var backLabel = document.createElement('div');
        backLabel.style.cssText = 'font-family:"Helvetica Neue",sans-serif;font-size:9px;color:var(--grey);margin:8px 0 4px;letter-spacing:2px;text-transform:uppercase';
        backLabel.textContent = 'Dos \u2014 ' + backPhotos.length + ' photos';
        section.appendChild(backLabel);

        var backRow = document.createElement('div');
        backRow.className = 'photo-comparison';
        backPhotos.forEach(function(photo) {
          var entry = document.createElement('div');
          entry.className = 'photo-entry';
          var img = document.createElement('img');
          img.src = photo.data;
          img.alt = 'Dos ' + photo.date;
          entry.appendChild(img);
          var date = document.createElement('div');
          date.className = 'photo-date';
          date.textContent = photo.date;
          entry.appendChild(date);
          backRow.appendChild(entry);
        });
        section.appendChild(backRow);
      }

      // Before/After comparison if 2+ photos of same type
      if (frontPhotos.length >= 2) {
        var compLabel = document.createElement('div');
        compLabel.style.cssText = 'font-family:"Helvetica Neue",sans-serif;font-size:9px;color:var(--grey);margin:16px 0 8px;letter-spacing:2px;text-transform:uppercase';
        compLabel.textContent = 'Avant / Apr\u00E8s';
        section.appendChild(compLabel);

        var compGrid = document.createElement('div');
        compGrid.style.cssText = 'display:grid;grid-template-columns:1fr 1fr;gap:8px';

        var first = frontPhotos[0];
        var last = frontPhotos[frontPhotos.length - 1];

        [first, last].forEach(function(photo, idx) {
          var card = document.createElement('div');
          card.style.cssText = 'text-align:center;border:1px solid var(--border);padding:8px;background:var(--ivory2)';
          var img = document.createElement('img');
          img.src = photo.data;
          img.style.cssText = 'width:100%;height:250px;object-fit:cover;margin-bottom:6px';
          card.appendChild(img);
          var clabel = document.createElement('div');
          clabel.style.cssText = 'font-family:Georgia;font-size:13px;' + (idx === 0 ? 'color:var(--grey)' : 'color:var(--green,#1A4A1A)');
          clabel.textContent = idx === 0 ? 'D\u00E9but \u2014 ' + photo.date : 'Maintenant \u2014 ' + photo.date;
          card.appendChild(clabel);
          compGrid.appendChild(card);
        });
        section.appendChild(compGrid);
      }
    } else {
      var empty = document.createElement('div');
      empty.style.cssText = 'text-align:center;padding:20px;font-family:"Helvetica Neue",sans-serif;font-size:11px;color:var(--grey3,#C8C8C0)';
      empty.textContent = 'Prenez votre premi\u00E8re photo pour suivre votre progression';
      section.appendChild(empty);
    }

    container.appendChild(section);
  }
};
