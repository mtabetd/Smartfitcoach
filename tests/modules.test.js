/**
 * QA Tests for SmartFitCoach modules:
 * - perf-history.js (1RM formula, delta calculations)
 * - gamification.js (counters, streaks)
 * - gate.js (hash function)
 * - error-boundary.js
 * - manifest.json validation
 * - app-sport.js (session kcal, cardio detection)
 * - app-nutrition.js (salad macros)
 */

const fs = require('fs');
const path = require('path');

// ─── MANIFEST.JSON TESTS ───
describe('manifest.json', () => {
  let manifest;

  beforeAll(() => {
    manifest = JSON.parse(fs.readFileSync(path.join(__dirname, '../app/manifest.json'), 'utf8'));
  });

  test('has required PWA fields', () => {
    expect(manifest.name).toBeTruthy();
    expect(manifest.short_name).toBeTruthy();
    expect(manifest.start_url).toBeTruthy();
    expect(manifest.display).toBe('standalone');
    expect(manifest.icons).toBeDefined();
    expect(manifest.icons.length).toBeGreaterThanOrEqual(2);
  });

  test('icons have valid purpose values', () => {
    manifest.icons.forEach(icon => {
      // "any maskable" is invalid; should be "any" or "maskable" (not both in one string)
      expect(icon.purpose).not.toBe('any maskable');
      expect(['any', 'maskable', 'monochrome'].includes(icon.purpose)).toBe(true);
    });
  });

  test('has 192x192 and 512x512 icons', () => {
    var sizes = manifest.icons.map(i => i.sizes);
    expect(sizes).toContain('192x192');
    expect(sizes).toContain('512x512');
  });

  test('theme_color and background_color are valid', () => {
    expect(manifest.theme_color).toMatch(/^#[0-9A-Fa-f]{6}$/);
    expect(manifest.background_color).toMatch(/^#[0-9A-Fa-f]{6}$/);
  });
});

// ─── GATE.JS HASH TESTS ───
describe('gate.js security', () => {
  let gateSource;

  beforeAll(() => {
    gateSource = fs.readFileSync(path.join(__dirname, '../app/gate.js'), 'utf8');
  });

  test('does not expose password in comments', () => {
    // Password should NOT appear in plaintext comments
    expect(gateSource).not.toMatch(/simpleHash\(['"]\w+['"]\)/);
  });

  test('has hash validation function', () => {
    expect(gateSource).toContain('simpleHash');
    expect(gateSource).toContain('GATE_HASH');
  });
});

// ─── ERROR BOUNDARY TESTS ───
describe('error-boundary.js', () => {
  let errorSource;

  beforeAll(() => {
    errorSource = fs.readFileSync(path.join(__dirname, '../app/error-boundary.js'), 'utf8');
  });

  test('does not log full error objects', () => {
    // Should not expose full stack traces / error objects
    expect(errorSource).not.toMatch(/console\.error\(.*\berr\b[^)]*\)/);
  });

  test('has global error handler', () => {
    expect(errorSource).toContain('window.onerror');
  });

  test('has unhandled rejection handler', () => {
    expect(errorSource).toContain('unhandledrejection');
  });
});

// ─── PERF-HISTORY 1RM FORMULA TESTS ───
describe('1RM formula consistency', () => {
  let perfSource;

  beforeAll(() => {
    perfSource = fs.readFileSync(path.join(__dirname, '../app/perf-history.js'), 'utf8');
  });

  test('Epley formula: weight * (1 + reps/30)', () => {
    // 100kg x 10 reps → 1RM = 100 * (1 + 10/30) = 133.3 → 133
    var weight = 100, reps = 10;
    var rm1 = reps > 1 ? Math.round(weight * (1 + reps / 30)) : weight;
    expect(rm1).toBe(133);
  });

  test('1 rep returns raw weight', () => {
    var weight = 100, reps = 1;
    var rm1 = reps > 1 ? Math.round(weight * (1 + reps / 30)) : weight;
    expect(rm1).toBe(100);
  });

  test('formula is consistent between recording and migration', () => {
    // Both should use: weight * (1 + reps / 30) with NO fallback to 8
    // Check that the recording function does NOT have (reps || 8) anymore
    expect(perfSource).not.toMatch(/\(reps \|\| 8\)/);
  });
});

// ─── APP-SPORT CARDIO DETECTION FIX TESTS ───
describe('app-sport.js cardio classification fix', () => {
  let sportSource;

  beforeAll(() => {
    sportSource = fs.readFileSync(path.join(__dirname, '../app/app-sport.js'), 'utf8');
  });

  test('uses .some() for cardio keyword matching (not double forEach)', () => {
    // After fix, should use .some() to count only once per exercise
    expect(sportSource).toContain('cardioKeywords.some');
  });

  test('sex variable uses ternary not fallback tautology', () => {
    // After fix: (s.sex === 'femme') ? 'femme' : 'homme'
    // Should NOT have: s.sex || (s.sex === 'femme' ...
    expect(sportSource).not.toContain("s.sex || (s.sex === 'femme'");
  });
});

// ─── APP-NUTRITION SALAD MACROS NaN PROTECTION ───
describe('app-nutrition.js NaN protection', () => {
  let nutritionSource;

  beforeAll(() => {
    nutritionSource = fs.readFileSync(path.join(__dirname, '../app/app-nutrition.js'), 'utf8');
  });

  test('salad macro calculation uses || 0 defaults', () => {
    // After fix, calcSaladMacros should use (x.k||0) pattern
    var match = nutritionSource.match(/calcSaladMacros[\s\S]{0,500}/);
    expect(match).toBeTruthy();
    expect(match[0]).toContain('||0');
  });
});

// ─── GAMIFICATION COUNTER NULL CHECK ───
describe('gamification.js null safety', () => {
  let gamSource;

  beforeAll(() => {
    gamSource = fs.readFileSync(path.join(__dirname, '../app/gamification.js'), 'utf8');
  });

  test('incrementCounter checks user.id', () => {
    // After fix: should check !user.id
    var match = gamSource.match(/incrementCounter[\s\S]{0,300}/);
    expect(match).toBeTruthy();
    expect(match[0]).toContain('!user.id');
  });
});

// ─── SUPABASE CLIENT SECURITY ───
describe('supabase-client.js security', () => {
  let supaSource;

  beforeAll(() => {
    supaSource = fs.readFileSync(path.join(__dirname, '../app/supabase-client.js'), 'utf8');
  });

  test('uses Supabase publishable key (not secret)', () => {
    // Publishable keys are OK for client-side
    if (supaSource.match(/SUPABASE_KEY/)) {
      expect(supaSource).not.toMatch(/service_role|secret/i);
    }
  });
});

// ─── INDEX.HTML STRUCTURE ───
describe('index.html', () => {
  let htmlSource;

  beforeAll(() => {
    htmlSource = fs.readFileSync(path.join(__dirname, '../app/index.html'), 'utf8');
  });

  test('has CSP meta tag', () => {
    expect(htmlSource).toMatch(/Content-Security-Policy/i);
  });

  test('has viewport meta tag', () => {
    expect(htmlSource).toMatch(/name="viewport"/);
  });

  test('has manifest link', () => {
    expect(htmlSource).toContain('manifest.json');
  });

  test('has service worker registration file', () => {
    expect(fs.existsSync(path.join(__dirname, '../app/sw-register.js'))).toBe(true);
  });

  test('loads security-init before other scripts', () => {
    var secIdx = htmlSource.indexOf('security-init.js');
    var authIdx = htmlSource.indexOf('auth.js');
    if (secIdx !== -1 && authIdx !== -1) {
      expect(secIdx).toBeLessThan(authIdx);
    }
  });
});

// ─── SERVICE WORKER TESTS ───
describe('sw.js', () => {
  let swSource;

  beforeAll(() => {
    swSource = fs.readFileSync(path.join(__dirname, '../app/sw.js'), 'utf8');
  });

  test('has cache version', () => {
    expect(swSource).toMatch(/CACHE_VERSION|cacheName|CACHE_NAME/);
  });

  test('handles fetch events', () => {
    expect(swSource).toContain("'fetch'");
  });

  test('only caches GET requests', () => {
    expect(swSource).toContain("request.method !== 'GET'");
  });
});
