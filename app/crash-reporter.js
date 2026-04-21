/* Crash reporter — envoie les erreurs JS vers Netlify Forms (zéro service tiers) */
(function () {
  var FORM_NAME = 'crash-report';
  var MAX_PER_SESSION = 5;
  var MIN_INTERVAL_MS = 30000; // 1 envoi toutes les 30s max

  var _count = 0;
  var _lastSent = 0;
  var _sent = {};

  function _key(msg, src, line) {
    return String(msg).slice(0, 80) + '|' + String(src).slice(-40) + '|' + line;
  }

  function _skip(msg) {
    var s = String(msg || '');
    if (!s) return true;
    // Erreurs d'extensions navigateur → ignorées
    if (/chrome-extension:|moz-extension:|safari-extension:|safari-web-extension:/.test(s)) return true;
    // Erreurs réseau hors notre contrôle
    if (/NetworkError|Failed to fetch|Load failed|net::ERR_/.test(s)) return true;
    return false;
  }

  function _send(msg, src, line, stack) {
    if (_skip(msg)) return;
    var k = _key(msg, src, line);
    if (_sent[k]) return;
    if (_count >= MAX_PER_SESSION) return;
    var now = Date.now();
    if (_count > 0 && now - _lastSent < MIN_INTERVAL_MS) return;

    _sent[k] = true;
    _count++;
    _lastSent = now;

    var body = new URLSearchParams();
    body.append('form-name', FORM_NAME);
    body.append('bot-field', '');
    body.append('message', String(msg).slice(0, 300));
    body.append('source', String(src || '').slice(-100));
    body.append('line', String(line || ''));
    body.append('stack', String(stack || '').slice(0, 600));
    body.append('ua', String(navigator.userAgent || '').slice(0, 200));
    body.append('url', String(window.location.pathname || ''));
    body.append('version', String(window.APP_VERSION || window.CACHE_VERSION || 'unknown'));
    body.append('ts', new Date().toISOString());

    fetch('/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: body.toString()
    }).catch(function () {});
  }

  window.onerror = function (msg, src, line, col, err) {
    _send(msg, src, line, err && err.stack ? err.stack : '');
    return false;
  };

  window.addEventListener('unhandledrejection', function (e) {
    var reason = e && e.reason;
    var msg = reason ? (reason.message || String(reason)) : 'UnhandledRejection';
    var stack = reason && reason.stack ? reason.stack : '';
    _send('UnhandledRejection: ' + msg, '', 0, stack);
  });
})();
