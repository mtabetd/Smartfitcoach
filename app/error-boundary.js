// Global error boundary — catch unhandled JS errors and show user-friendly message
window.onerror = function(msg, url, line, col, err) {
  var app = document.getElementById('app');
  if (app) {
    var wrap = document.createElement('div');
    wrap.style.cssText = 'padding:40px;text-align:center;font-family:\'Helvetica Neue\',Arial,sans-serif';
    var h2 = document.createElement('h2');
    h2.style.fontFamily = 'Georgia,serif';
    h2.textContent = 'Une erreur est survenue';
    var p = document.createElement('p');
    p.style.cssText = 'color:#666;margin:16px 0';
    p.textContent = msg || '';
    var btn = document.createElement('button');
    btn.style.cssText = 'padding:10px 24px;background:#0A0A09;color:#fff;border:none;cursor:pointer;font-size:14px';
    btn.textContent = 'Recharger';
    btn.onclick = function(){ location.reload(); };
    wrap.appendChild(h2);
    wrap.appendChild(p);
    wrap.appendChild(btn);
    app.innerHTML = '';
    app.appendChild(wrap);
  }
  console.error('GLOBAL ERROR:', msg, '(line ' + line + ')');
  return true;
};
window.addEventListener('unhandledrejection', function(event) {
  console.error('UNHANDLED PROMISE REJECTION:', event.reason && event.reason.message ? event.reason.message : 'unknown');
});
