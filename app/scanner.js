// scanner.js — Barcode Scanner & Food Analyzer
(function(){
'use strict';

// Inject CSS
var style = document.createElement('style');
style.textContent = `
  .scanner-container { margin:16px 0; }

  .scan-btn { display:flex; align-items:center; justify-content:center; gap:8px; width:100%; padding:14px; border:2px dashed var(--border,#D8D8D0); background:var(--ivory2,#F4F4F0); cursor:pointer; transition:all 0.2s; font-family:'Helvetica Neue',Arial,sans-serif; font-size:11px; letter-spacing:3px; text-transform:uppercase; color:var(--grey,#6B6B65); }
  .scan-btn:hover { border-color:var(--black,#0A0A09); color:var(--black,#0A0A09); }

  .camera-view { position:relative; width:100%; max-width:400px; margin:12px auto; background:#000; overflow:hidden; }
  .camera-view video { width:100%; display:block; }
  .camera-overlay { position:absolute; top:0; left:0; right:0; bottom:0; display:flex; align-items:center; justify-content:center; pointer-events:none; }
  .scan-frame { width:200px; height:120px; border:2px solid rgba(250,250,247,0.6); position:relative; }
  .scan-frame::before { content:''; position:absolute; top:0; left:0; right:0; height:2px; background:var(--green,#1A4A1A); animation:scanLine 2s ease-in-out infinite; }
  @keyframes scanLine { 0%,100% { top:0; } 50% { top:calc(100% - 2px); } }
  .camera-close { position:absolute; top:8px; right:8px; width:44px; height:44px; background:rgba(0,0,0,0.6); color:white; border:none; border-radius:2px; cursor:pointer; font-size:18px; display:flex; align-items:center; justify-content:center; pointer-events:auto; z-index:2; }

  .manual-barcode { display:flex; gap:8px; margin:8px 0; }
  .manual-barcode input { flex:1; padding:12px 16px; border:1px solid var(--border,#D8D8D0); border-radius:2px; font-family:'Helvetica Neue',sans-serif; font-size:16px; background:var(--ivory,#FAF9F6); outline:none; }
  .manual-barcode input:focus { border-color:var(--black,#0A0A09); }
  .manual-barcode button { padding:10px 16px; background:var(--black,#0A0A09); color:var(--ivory,#FAF9F6); border:none; cursor:pointer; font-family:'Helvetica Neue',sans-serif; font-size:9px; letter-spacing:3px; text-transform:uppercase; }

  .product-card { border:1px solid var(--border,#D8D8D0); background:var(--ivory2,#F4F4F0); padding:20px; margin:16px 0; }
  .product-header { display:flex; gap:16px; align-items:flex-start; margin-bottom:16px; }
  .product-image { width:80px; height:80px; object-fit:contain; background:white; border:1px solid var(--border,#D8D8D0); flex-shrink:0; }
  .product-info { flex:1; }
  .product-name { font-family:Georgia,serif; font-size:18px; margin-bottom:4px; }
  .product-brand { font-family:'Helvetica Neue',sans-serif; font-size:11px; color:var(--grey,#6B6B65); }
  .product-quantity { font-family:'Helvetica Neue',sans-serif; font-size:11px; color:var(--grey2,#9A9A90); margin-top:2px; }

  .health-score { text-align:center; padding:20px; margin:12px 0; border:1px solid var(--border,#D8D8D0); }
  .score-circle { width:100px; height:100px; border-radius:50%; display:flex; flex-direction:column; align-items:center; justify-content:center; margin:0 auto 12px; border:4px solid; }
  .score-value { font-family:Georgia,serif; font-size:24px; font-style:italic; }
  .score-label { font-family:'Helvetica Neue',sans-serif; font-size:9px; letter-spacing:3px; text-transform:uppercase; }
  .score-excellent { border-color:var(--green,#1A4A1A); color:var(--green,#1A4A1A); background:var(--greenbg,rgba(26,74,26,.06)); }
  .score-good { border-color:#4A7A1A; color:#4A7A1A; background:rgba(74,122,26,.06); }
  .score-average { border-color:var(--orange,#6A4A1A); color:var(--orange,#6A4A1A); background:var(--orangebg,rgba(106,74,26,.06)); }
  .score-poor { border-color:var(--red,#5A1010); color:var(--red,#5A1010); background:var(--redbg,rgba(90,16,16,.06)); }

  .nutri-grid { display:grid; grid-template-columns:repeat(auto-fit,minmax(60px,1fr)); gap:6px; margin:12px 0; }
  .nutri-cell { text-align:center; padding:10px 6px; border:1px solid var(--border,#D8D8D0); background:var(--ivory,#FAF9F6); }
  .nutri-cell .nv { font-family:Georgia,serif; font-size:16px; }
  .nutri-cell .nl { font-family:'Helvetica Neue',sans-serif; font-size:9px; letter-spacing:2px; text-transform:uppercase; color:var(--grey,#6B6B65); margin-top:2px; }

  .fit-verdict { padding:12px 16px; margin:12px 0; font-family:'Helvetica Neue',sans-serif; font-size:11px; line-height:1.6; }
  .fit-yes { border-left:3px solid var(--green,#1A4A1A); background:var(--greenbg,rgba(26,74,26,.06)); color:var(--green); }
  .fit-no { border-left:3px solid var(--red,#5A1010); background:var(--redbg,rgba(90,16,16,.06)); color:var(--red); }
  .fit-warning { border-left:3px solid var(--orange,#6A4A1A); background:var(--orangebg,rgba(106,74,26,.06)); color:var(--orange); }

  .alternatives-section { margin:16px 0; }
  .alt-item { display:flex; justify-content:space-between; align-items:center; padding:10px 14px; border:1px solid var(--border,#D8D8D0); background:var(--ivory,#FAF9F6); margin-bottom:4px; cursor:pointer; transition:all 0.2s; }
  .alt-item:hover { border-color:var(--green,#1A4A1A); }
  .alt-name { font-family:'Helvetica Neue',sans-serif; font-size:13px; }
  .alt-score { font-family:Georgia,serif; font-size:13px; font-style:italic; }

  .scan-loading { text-align:center; padding:30px; font-family:'Helvetica Neue',sans-serif; font-size:11px; color:var(--grey,#6B6B65); letter-spacing:2px; text-transform:uppercase; }
  .scan-error { text-align:center; padding:16px; font-family:'Helvetica Neue',sans-serif; font-size:11px; color:var(--red,#5A1010); border:1px solid var(--red); background:var(--redbg); margin:12px 0; }

  .scan-history { margin:16px 0; }
  .scan-history-item { display:flex; justify-content:space-between; align-items:center; padding:8px 12px; border-bottom:1px solid var(--ivory3,#EEEDE8); font-family:'Helvetica Neue',sans-serif; font-size:11px; }
`;
document.head.appendChild(style);

// ─── BARCODE DETECTION ───
// Use BarcodeDetector API (Chrome/Edge) with fallback to manual input
var barcodeDetector = null;
if ('BarcodeDetector' in window) {
  try {
    barcodeDetector = new BarcodeDetector({ formats: ['ean_13', 'ean_8', 'upc_a', 'upc_e', 'code_128'] });
  } catch(e) { /* fallback to manual */ }
}

// ─── SECURITY: API URL validation ───
var ALLOWED_API_DOMAIN = 'https://world.openfoodfacts.org/';
function isSafeApiUrl(url) {
  return typeof url === 'string' && url.indexOf(ALLOWED_API_DOMAIN) === 0;
}

// ─── SECURITY: Barcode validation ───
function isValidBarcode(barcode) {
  // EAN-8/EAN-13/UPC-A/UPC-E: digits only (8-13 chars)
  // Code128 fallback: digits + uppercase + limited special chars
  if (typeof barcode !== 'string') return false;
  var b = barcode.trim();
  return /^[0-9]{8,13}$/.test(b) || /^[0-9A-Z\-\.\ \/\+]{1,20}$/.test(b);
}

// ─── OPEN FOOD FACTS API ───
function lookupProduct(barcode, callback) {
  // Validate barcode before using it in URL
  if (!isValidBarcode(barcode)) {
    callback('Code-barres invalide', null);
    return;
  }
  var url = 'https://world.openfoodfacts.org/api/v2/product/' + encodeURIComponent(barcode.trim()) + '.json';
  // Validate constructed URL domain
  if (!isSafeApiUrl(url)) {
    callback('URL non autorisée', null);
    return;
  }
  // Timeout: 10 seconds via AbortController
  var controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
  var timeoutId = controller ? setTimeout(function() { controller.abort(); }, 10000) : null;
  fetch(url, controller ? { signal: controller.signal } : {})
    .then(function(r) {
      if (timeoutId) clearTimeout(timeoutId);
      return r.json();
    })
    .then(function(data) {
      // Guard against malformed API response
      if (data && data.status === 1 && data.product && typeof data.product === 'object') {
        callback(null, parseProduct(data.product));
      } else {
        callback('Produit non trouvé dans la base de données', null);
      }
    })
    .catch(function(err) {
      if (timeoutId) clearTimeout(timeoutId);
      var msg = err && err.name === 'AbortError' ? 'Délai dépassé (10s) — vérifiez votre connexion' : 'Erreur de connexion : ' + (err ? err.message : 'inconnue');
      callback(msg, null);
    });
}

function sanitizeText(s) {
  if (typeof s !== 'string') return '';
  // Strip any HTML tags and limit length
  return s.replace(/<[^>]*>/g, '').substring(0, 500);
}

function parseProduct(p) {
  var n = p.nutriments || {};
  // Validate and sanitize image URL — only allow https from openfoodfacts domains
  var rawImg = p.image_front_small_url || p.image_url || null;
  var safeImg = null;
  if (rawImg && typeof rawImg === 'string' &&
      (rawImg.indexOf('https://images.openfoodfacts.org/') === 0 ||
       rawImg.indexOf('https://world.openfoodfacts.org/') === 0)) {
    safeImg = rawImg;
  }
  return {
    name: sanitizeText(p.product_name || p.product_name_fr || 'Produit inconnu'),
    brand: sanitizeText(p.brands || ''),
    quantity: sanitizeText(p.quantity || ''),
    image: safeImg,
    barcode: sanitizeText(p.code || ''),
    // Nutriments per 100g — coerce to numbers to prevent injection
    kcal: Math.round(Number(n['energy-kcal_100g'] || n['energy-kcal'] || 0)),
    protein: Math.round(Number(n.proteins_100g || 0) * 10) / 10,
    carbs: Math.round(Number(n.carbohydrates_100g || 0) * 10) / 10,
    fat: Math.round(Number(n.fat_100g || 0) * 10) / 10,
    fiber: Math.round(Number(n.fiber_100g || 0) * 10) / 10,
    sugar: Math.round(Number(n.sugars_100g || 0) * 10) / 10,
    salt: Math.round(Number(n.salt_100g || 0) * 100) / 100,
    saturatedFat: Math.round(Number(n['saturated-fat_100g'] || 0) * 10) / 10,
    // Existing scores
    nutriscore: /^[a-e]$/.test(p.nutriscore_grade || p.nutrition_grades || '') ? (p.nutriscore_grade || p.nutrition_grades) : null,
    nova: Number(p.nova_group) >= 1 && Number(p.nova_group) <= 4 ? Number(p.nova_group) : null,
    ingredients: sanitizeText(p.ingredients_text_fr || p.ingredients_text || ''),
    additives: Array.isArray(p.additives_tags) ? p.additives_tags.length : 0,
    categories: sanitizeText(p.categories || ''),
    allergens: sanitizeText(p.allergens || '')
  };
}

// ─── HEALTH SCORE CALCULATION (0-100) ───
function calculateHealthScore(product) {
  var score = 50; // Start neutral

  // POSITIVE factors
  if (product.protein > 10) score += 10;
  else if (product.protein > 5) score += 5;

  if (product.fiber > 5) score += 10;
  else if (product.fiber > 3) score += 5;

  // NEGATIVE factors
  if (product.sugar > 20) score -= 20;
  else if (product.sugar > 10) score -= 10;
  else if (product.sugar > 5) score -= 5;

  if (product.saturatedFat > 10) score -= 15;
  else if (product.saturatedFat > 5) score -= 8;

  if (product.salt > 2) score -= 10;
  else if (product.salt > 1.5) score -= 5;

  if (product.kcal > 400) score -= 10;
  else if (product.kcal < 150) score += 5;

  if (product.additives > 5) score -= 10;
  else if (product.additives > 3) score -= 5;
  else if (product.additives === 0) score += 5;

  // Nutri-Score bonus
  if (product.nutriscore === 'a') score += 15;
  else if (product.nutriscore === 'b') score += 8;
  else if (product.nutriscore === 'd') score -= 8;
  else if (product.nutriscore === 'e') score -= 15;

  // NOVA bonus (processing level)
  if (product.nova === 1) score += 10; // unprocessed
  else if (product.nova === 4) score -= 15; // ultra-processed
  else if (product.nova === 3) score -= 5;

  // Clamp
  score = Math.max(0, Math.min(100, score));
  return score;
}

function getScoreClass(score) {
  if (score >= 80) return 'score-excellent';
  if (score >= 60) return 'score-good';
  if (score >= 40) return 'score-average';
  return 'score-poor';
}

function getScoreLabel(score) {
  if (score >= 80) return 'Excellent';
  if (score >= 60) return 'Bon';
  if (score >= 40) return 'Moyen';
  return 'À éviter';
}

// ─── FITNESS CHECK ───
function checkFitness(product) {
  var S = window.S;
  if (!S || S.goal === null) return { fits: true, message: 'Configurez votre profil nutrition pour une analyse personnalisée' };

  var macros = window.calcMacros ? window.calcMacros() : null;
  var target = window.calcTarget ? window.calcTarget() : 0;
  if (!macros || !target) return { fits: true, message: '' };

  var issues = [];
  var perMeal = target / (S.mealsPerDay || 3);

  // Check if one serving exceeds meal budget significantly
  if (product.kcal > perMeal * 0.8) {
    issues.push('Ce produit représente ' + Math.round(product.kcal / perMeal * 100) + '% de votre budget calorique par repas');
  }

  // Check macros alignment
  var goalKey = (window.GOALS && S.goal !== null && window.GOALS[S.goal]) ? window.GOALS[S.goal].key : 'maintain';

  if ((goalKey === 'cut' || goalKey === 'shred') && product.sugar > 15) {
    issues.push('Trop de sucres pour un objectif de ' + (goalKey === 'cut' ? 'perte de poids' : 'sèche'));
  }

  if ((goalKey === 'bulk' || goalKey === 'maintain') && product.protein < 5 && product.kcal > 200) {
    issues.push('Ratio protéines/calories faible pour votre objectif');
  }

  if (product.saturatedFat > 8) {
    issues.push('Riche en graisses saturées');
  }

  if (issues.length === 0) {
    return { fits: true, message: 'Ce produit est compatible avec votre plan nutritionnel (' + ((window.GOALS && window.GOALS[S.goal]) ? window.GOALS[S.goal].name : '') + ')' };
  }

  return { fits: false, message: issues.join('. ') + '.' };
}

// ─── FIND ALTERNATIVES ───
function findAlternatives(product, callback) {
  // Search for similar but healthier products in the same category
  var category = (product.categories || '').split(',')[0].trim();
  if (!category) { callback([]); return; }

  var url = 'https://world.openfoodfacts.org/cgi/search.pl?action=process&tagtype_0=categories&tag_contains_0=contains&tag_0=' + encodeURIComponent(category) + '&sort_by=nutriscore_score&page_size=10&json=1';

  // Validate URL domain
  if (!isSafeApiUrl(url)) { callback([]); return; }

  var altController = typeof AbortController !== 'undefined' ? new AbortController() : null;
  var altTimeout = altController ? setTimeout(function() { altController.abort(); }, 10000) : null;
  fetch(url, altController ? { signal: altController.signal } : {})
    .then(function(r) {
      if (altTimeout) clearTimeout(altTimeout);
      return r.json();
    })
    .then(function(data) {
      // Guard against malformed API response
      if (!data || !Array.isArray(data.products)) { callback([]); return; }
      var alts = data.products
        .map(function(p) { return parseProduct(p); })
        .filter(function(p) { return p.name && p.name !== product.name && p.kcal > 0; })
        .map(function(p) { p.score = calculateHealthScore(p); return p; })
        .filter(function(p) { return p.score > calculateHealthScore(product); })
        .sort(function(a, b) { return b.score - a.score; })
        .slice(0, 5);
      callback(alts);
    })
    .catch(function() { if (altTimeout) clearTimeout(altTimeout); callback([]); });
}

// ─── SCAN HISTORY ───
function getScanHistory() {
  var user = window.AUTH ? window.AUTH.getUser() : null;
  var key = 'mtd_scan_history_' + (user && user.id ? user.id : 'anon');
  try { return JSON.parse(localStorage.getItem(key) || '[]'); } catch(e) { return []; }
}

function addToScanHistory(product, score) {
  var user = window.AUTH ? window.AUTH.getUser() : null;
  var key = 'mtd_scan_history_' + (user && user.id ? user.id : 'anon');
  var history = getScanHistory();
  history.unshift({
    name: product.name,
    brand: product.brand,
    barcode: product.barcode,
    score: score,
    kcal: product.kcal,
    date: new Date().toISOString().split('T')[0]
  });
  if (history.length > 50) history = history.slice(0, 50);
  try { localStorage.setItem(key, JSON.stringify(history)); } catch(e) {}
}

// ─── CAMERA SCANNING ───
var cameraStream = null;
var scanning = false;
var scanInterval = null;
var _cameraInactivityTimer = null;

function startCamera(videoElement, onDetected, onError) {
  // Check if camera API is available
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    if (onError) onError('Votre navigateur ne supporte pas l\'accès caméra. Utilisez la saisie manuelle.');
    return;
  }

  // Check permission first
  if (navigator.permissions && navigator.permissions.query) {
    navigator.permissions.query({ name: 'camera' }).then(function(result) {
      if (result.state === 'denied') {
        if (onError) onError('Accès caméra refusé. Autorisez la caméra dans les paramètres de votre navigateur, puis réessayez.');
        return;
      }
      requestCamera();
    }).catch(function() {
      // permissions.query not supported for camera, try directly
      requestCamera();
    });
  } else {
    requestCamera();
  }

  function requestCamera() {
    navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } } })
      .then(function(stream) {
        cameraStream = stream;
        videoElement.srcObject = stream;
        videoElement.play();
        scanning = true;

        // Arrêt automatique après 60s d'inactivité (pas de scan détecté)
        if (_cameraInactivityTimer) clearTimeout(_cameraInactivityTimer);
        _cameraInactivityTimer = setTimeout(function() { stopCamera(); }, 60000);

        if (barcodeDetector) {
          scanInterval = setInterval(function() {
            if (!scanning) return;
            barcodeDetector.detect(videoElement)
              .then(function(barcodes) {
                if (barcodes.length > 0) {
                  stopCamera();
                  onDetected(barcodes[0].rawValue);
                }
              })
              .catch(function() {});
          }, 500);
        }
      })
      .catch(function(err) {
        console.warn('Camera error:', err);
        var msg = 'Impossible d\'accéder à la caméra.';
        if (err.name === 'NotAllowedError') msg = 'Vous avez refusé l\'accès à la caméra. Autorisez-la dans les paramètres de votre navigateur puis réessayez.';
        else if (err.name === 'NotFoundError') msg = 'Aucune caméra détectée sur cet appareil.';
        else if (err.name === 'NotReadableError') msg = 'La caméra est utilisée par une autre application.';
        else if (err.name === 'OverconstrainedError') msg = 'Caméra arrière non disponible, essai avec caméra frontale...';

        if (err.name === 'OverconstrainedError') {
          // Fallback: try front camera
          navigator.mediaDevices.getUserMedia({ video: true })
            .then(function(stream) {
              cameraStream = stream;
              videoElement.srcObject = stream;
              videoElement.play();
              scanning = true;
              if (_cameraInactivityTimer) clearTimeout(_cameraInactivityTimer);
              _cameraInactivityTimer = setTimeout(function() { stopCamera(); }, 60000);
              if (barcodeDetector) {
                scanInterval = setInterval(function() {
                  if (!scanning) return;
                  barcodeDetector.detect(videoElement).then(function(barcodes) {
                    if (barcodes.length > 0) { stopCamera(); onDetected(barcodes[0].rawValue); }
                  }).catch(function() {});
                }, 500);
              }
            })
            .catch(function() { if (onError) onError(msg); });
        } else {
          if (onError) onError(msg);
        }
      });
  }
}

function stopCamera() {
  scanning = false;
  if (_cameraInactivityTimer) { clearTimeout(_cameraInactivityTimer); _cameraInactivityTimer = null; }
  if (scanInterval) { clearInterval(scanInterval); scanInterval = null; }
  if (cameraStream) {
    cameraStream.getTracks().forEach(function(t) { t.stop(); });
    cameraStream = null;
  }
}

// ─── RENDER ───
window.SCANNER = {
  stopCamera: stopCamera,
  renderWidget: function(container) {
    stopCamera(); // Clean up any previous camera stream on re-render
    var scannerDiv = document.createElement('div');
    scannerDiv.className = 'scanner-container';

    // Section label
    var label = document.createElement('div');
    label.className = 'section-label';
    label.textContent = window.t('scan.scan');
    label.style.cssText = 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:9px;letter-spacing:4px;text-transform:uppercase;color:var(--grey,#6B6B65);margin-bottom:12px;padding-bottom:8px;border-bottom:1px solid var(--border,#D8D8D0)';
    scannerDiv.appendChild(label);

    // State
    var currentProduct = null;
    var currentScore = null;
    var alternatives = [];
    var isLoading = false;
    var error = null;
    var showCamera = false;
    var resultContainer = document.createElement('div');

    // Scan button
    var scanBtn = document.createElement('div');
    scanBtn.className = 'scan-btn';
    scanBtn.textContent = '\uD83D\uDCF7 ' + window.t('scan.scan');
    scanBtn.onclick = function() {
      showCamera = true;
      renderCameraView();
    };
    scannerDiv.appendChild(scanBtn);

    // Manual input
    var manualDiv = document.createElement('div');
    manualDiv.className = 'manual-barcode';
    var manualInput = document.createElement('input');
    manualInput.type = 'text';
    manualInput.placeholder = window.t('scan.barcode_placeholder');
    manualInput.inputMode = 'numeric';
    manualDiv.appendChild(manualInput);
    var manualBtn = document.createElement('button');
    manualBtn.textContent = window.t('scan.search');
    manualBtn.onclick = function() {
      var code = manualInput.value.trim();
      if (isValidBarcode(code)) lookupAndAnalyze(code);
    };
    manualDiv.appendChild(manualBtn);
    scannerDiv.appendChild(manualDiv);

    // Camera container
    var cameraContainer = document.createElement('div');
    scannerDiv.appendChild(cameraContainer);

    // Results container
    scannerDiv.appendChild(resultContainer);

    // Scan history
    var history = getScanHistory();
    var histSection = document.createElement('div');
    histSection.className = 'scan-history';
    var histLabel = document.createElement('div');
    histLabel.style.cssText = 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:9px;letter-spacing:3px;text-transform:uppercase;color:var(--grey,#6B6B65);margin:16px 0 8px;padding-bottom:6px;border-bottom:1px solid var(--border,#D8D8D0)';
    histLabel.textContent = window.t('scan.history');
    histSection.appendChild(histLabel);
    if (history.length > 0) {

      history.slice(0, 5).forEach(function(item) {
        var row = document.createElement('div');
        row.className = 'scan-history-item';
        // XSS fix: use DOM construction instead of innerHTML — item.name/brand come from OpenFoodFacts (external) stored in localStorage
        var nameSpan = document.createElement('span');
        var nameText = document.createTextNode(item.name + ' ');
        nameSpan.appendChild(nameText);
        var brandSpan = document.createElement('span');
        brandSpan.style.color = 'var(--grey2)';
        brandSpan.textContent = item.brand || '';
        nameSpan.appendChild(brandSpan);
        var scoreSpan = document.createElement('span');
        scoreSpan.className = getScoreClass(item.score);
        scoreSpan.style.cssText = 'font-family:Georgia;font-style:italic;padding:2px 8px;font-size:13px';
        scoreSpan.textContent = item.score + '%';
        row.appendChild(nameSpan);
        row.appendChild(scoreSpan);
        row.style.cursor = 'pointer';
        row.onclick = function() { lookupAndAnalyze(item.barcode); };
        histSection.appendChild(row);
      });
    } else {
      var emptyHistMsg = document.createElement('div');
      emptyHistMsg.className = 'empty-state';
      emptyHistMsg.style.cssText = 'margin:0;padding:20px 16px;';
      var emptyHistIcon = document.createElement('span');
      emptyHistIcon.className = 'empty-state-icon';
      emptyHistIcon.textContent = '\uD83D\uDD0D';
      var emptyHistTitle = document.createElement('p');
      emptyHistTitle.className = 'empty-state-title';
      emptyHistTitle.textContent = window.t('scan.no_history');
      var emptyHistText = document.createElement('p');
      emptyHistText.textContent = 'Scannez votre premier produit pour voir l\'historique ici.';
      emptyHistMsg.appendChild(emptyHistIcon);
      emptyHistMsg.appendChild(emptyHistTitle);
      emptyHistMsg.appendChild(emptyHistText);
      histSection.appendChild(emptyHistMsg);
    }
    scannerDiv.appendChild(histSection);

    container.appendChild(scannerDiv);

    // ─── Internal functions ───

    function renderCameraView() {
      cameraContainer.innerHTML = '';
      if (!showCamera) return;

      var view = document.createElement('div');
      view.className = 'camera-view';

      var video = document.createElement('video');
      video.setAttribute('playsinline', '');
      video.setAttribute('autoplay', '');
      view.appendChild(video);

      var overlay = document.createElement('div');
      overlay.className = 'camera-overlay';
      var frame = document.createElement('div');
      frame.className = 'scan-frame';
      overlay.appendChild(frame);
      view.appendChild(overlay);

      var closeBtn = document.createElement('button');
      closeBtn.className = 'camera-close';
      closeBtn.textContent = '\u2715';
      closeBtn.onclick = function() {
        stopCamera();
        showCamera = false;
        cameraContainer.innerHTML = '';
      };
      overlay.appendChild(closeBtn);

      cameraContainer.appendChild(view);

      if (!barcodeDetector) {
        // No native barcode support - show message and skip camera
        var msg = document.createElement('div');
        msg.style.cssText = 'text-align:center;padding:12px;font-family:"Helvetica Neue",sans-serif;font-size:11px;color:var(--grey)';
        msg.textContent = 'Scan automatique non supporté sur ce navigateur. Utilisez la saisie manuelle ci-dessous.';
        cameraContainer.appendChild(msg);
      } else {

      startCamera(video, function(barcode) {
        showCamera = false;
        cameraContainer.innerHTML = '';
        manualInput.value = barcode;
        lookupAndAnalyze(barcode);
      }, function(errorMsg) {
        // Show error to user
        stopCamera();
        showCamera = false;
        cameraContainer.innerHTML = '';
        var errDiv = document.createElement('div');
        errDiv.className = 'scan-error';
        errDiv.textContent = errorMsg;
        cameraContainer.appendChild(errDiv);
      });
      } // end else (barcodeDetector exists)
    }

    function lookupAndAnalyze(barcode) {
      resultContainer.innerHTML = '';
      var loading = document.createElement('div');
      loading.className = 'scan-loading';
      loading.textContent = window.t('common.loading');
      resultContainer.appendChild(loading);

      if (window.BLACKBOX) BLACKBOX.log('barcode_scanned', { barcode: barcode });

      lookupProduct(barcode, function(err, product) {
        resultContainer.innerHTML = '';

        if (err) {
          var errDiv = document.createElement('div');
          errDiv.className = 'scan-error';
          errDiv.textContent = err;
          resultContainer.appendChild(errDiv);
          return;
        }

        currentProduct = product;
        currentScore = calculateHealthScore(product);
        addToScanHistory(product, currentScore);

        renderProductResult();

        // Find alternatives if score < 75
        if (currentScore < 75) {
          findAlternatives(product, function(alts) {
            alternatives = alts;
            if (alts.length > 0) renderAlternatives();
          });
        }
      });
    }

    function renderProductResult() {
      var p = currentProduct;
      var score = currentScore;

      // Product card
      var card = document.createElement('div');
      card.className = 'product-card';

      var header = document.createElement('div');
      header.className = 'product-header';

      if (p.image) {
        var img = document.createElement('img');
        img.className = 'product-image';
        img.src = p.image;
        img.alt = p.name;
        img.onerror = function() { this.style.display = 'none'; };
        header.appendChild(img);
      }

      var info = document.createElement('div');
      info.className = 'product-info';
      var name = document.createElement('div');
      name.className = 'product-name';
      name.textContent = p.name;
      info.appendChild(name);
      if (p.brand) {
        var brand = document.createElement('div');
        brand.className = 'product-brand';
        brand.textContent = p.brand;
        info.appendChild(brand);
      }
      if (p.quantity) {
        var qty = document.createElement('div');
        qty.className = 'product-quantity';
        qty.textContent = p.quantity;
        info.appendChild(qty);
      }
      header.appendChild(info);
      card.appendChild(header);

      // Health Score
      var scoreDiv = document.createElement('div');
      scoreDiv.className = 'health-score';
      var circle = document.createElement('div');
      circle.className = 'score-circle ' + getScoreClass(score);
      var val = document.createElement('div');
      val.className = 'score-value';
      val.textContent = score + '%';
      circle.appendChild(val);
      var lab = document.createElement('div');
      lab.className = 'score-label';
      lab.textContent = getScoreLabel(score);
      circle.appendChild(lab);
      scoreDiv.appendChild(circle);

      // Nutri-Score badge if available
      if (p.nutriscore) {
        var ns = document.createElement('div');
        ns.style.cssText = 'font-family:"Helvetica Neue",sans-serif;font-size:11px;color:var(--grey);margin-top:8px';
        ns.textContent = 'Nutri-Score : ' + p.nutriscore.toUpperCase() + (p.nova ? ' \u00b7 NOVA ' + p.nova : '');
        scoreDiv.appendChild(ns);
      }

      card.appendChild(scoreDiv);

      // Macros grid
      var grid = document.createElement('div');
      grid.className = 'nutri-grid';
      [
        { v: p.kcal, l: 'KCAL' },
        { v: p.protein + 'g', l: 'PROT\u00c9INES' },
        { v: p.carbs + 'g', l: 'GLUCIDES' },
        { v: p.fat + 'g', l: 'LIPIDES' }
      ].forEach(function(m) {
        var cell = document.createElement('div');
        cell.className = 'nutri-cell';
        // XSS fix: use DOM construction — m.v are numeric values but defense-in-depth
        var vDiv = document.createElement('div'); vDiv.className = 'nv'; vDiv.textContent = m.v;
        var lDiv = document.createElement('div'); lDiv.className = 'nl'; lDiv.textContent = m.l;
        cell.appendChild(vDiv); cell.appendChild(lDiv);
        grid.appendChild(cell);
      });
      card.appendChild(grid);

      // Detail row (sugar, fiber, salt, sat fat)
      var detailGrid = document.createElement('div');
      detailGrid.className = 'nutri-grid';
      [
        { v: p.sugar + 'g', l: 'SUCRES' },
        { v: p.fiber + 'g', l: 'FIBRES' },
        { v: p.salt + 'g', l: 'SEL' },
        { v: p.saturatedFat + 'g', l: 'GRAS SAT.' }
      ].forEach(function(m) {
        var cell = document.createElement('div');
        cell.className = 'nutri-cell';
        // XSS fix: use DOM construction
        var vDiv = document.createElement('div'); vDiv.className = 'nv'; vDiv.style.fontSize = '14px'; vDiv.textContent = m.v;
        var lDiv = document.createElement('div'); lDiv.className = 'nl'; lDiv.textContent = m.l;
        cell.appendChild(vDiv); cell.appendChild(lDiv);
        detailGrid.appendChild(cell);
      });
      card.appendChild(detailGrid);

      // Fitness verdict
      var fitness = checkFitness(p);
      var verdict = document.createElement('div');
      verdict.className = 'fit-verdict ' + (fitness.fits ? 'fit-yes' : (score >= 40 ? 'fit-warning' : 'fit-no'));
      // XSS fix: fitness.message is JS-constructed but textContent is always safer
      verdict.textContent = (fitness.fits ? '\u2713 ' : '\u26A0 ') + fitness.message;
      card.appendChild(verdict);

      resultContainer.appendChild(card);
    }

    function renderAlternatives() {
      if (!alternatives.length) return;

      var section = document.createElement('div');
      section.className = 'alternatives-section';

      var alabel = document.createElement('div');
      alabel.style.cssText = 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:9px;letter-spacing:3px;text-transform:uppercase;color:var(--grey,#6B6B65);margin-bottom:8px;padding-bottom:6px;border-bottom:1px solid var(--border,#D8D8D0)';
      alabel.textContent = 'Alternatives plus saines';
      section.appendChild(alabel);

      alternatives.forEach(function(alt) {
        var item = document.createElement('div');
        item.className = 'alt-item';
        var nameDiv = document.createElement('div');
        nameDiv.className = 'alt-name';
        nameDiv.textContent = alt.name + (alt.brand ? ' \u2014 ' + alt.brand : '');
        item.appendChild(nameDiv);
        var scoreSpan = document.createElement('span');
        scoreSpan.className = 'alt-score ' + getScoreClass(alt.score);
        scoreSpan.textContent = alt.score + '%';
        item.appendChild(scoreSpan);
        section.appendChild(item);
      });

      resultContainer.appendChild(section);
    }
  }
};

// Libérer la caméra si l'utilisateur ferme ou quitte la page
window.addEventListener('pagehide', function() { stopCamera(); });
window.addEventListener('beforeunload', function() { stopCamera(); });

})();
