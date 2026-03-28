/* ── SECURITY: Production hardening ── */
(function(){
  'use strict';
  var isProd = (typeof location !== 'undefined' &&
    location.hostname !== 'localhost' &&
    location.hostname !== '127.0.0.1' &&
    location.hostname !== '');
  if (isProd) {
    var noop = function(){};
    if (typeof console !== 'undefined') {
      console.log = noop;
      console.debug = noop;
      console.info = noop;
    }
  }

  if (isProd) {
    var devtoolsOpen = false;
    function detectDevTools() {
      var widthThreshold = window.outerWidth - window.innerWidth > 160;
      var heightThreshold = window.outerHeight - window.innerHeight > 160;
      if ((widthThreshold || heightThreshold) && !devtoolsOpen) {
        devtoolsOpen = true;
        if (typeof console !== 'undefined' && console.warn) {
          console.warn('[MTD] DevTools detected. This application is for personal use only.');
        }
      } else if (!widthThreshold && !heightThreshold) {
        devtoolsOpen = false;
      }
    }
    setInterval(detectDevTools, 1000);
  }
})();
