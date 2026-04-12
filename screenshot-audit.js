const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({
    executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const profile = {
    sex: 'homme', age: 28, weight: 80, height: 178,
    goal: 0, activity: 3, sportDays: 4, mealsPerDay: 3,
    regime: 0, allergies: [], intolerances: [],
    whey: true, wantsDessert: false,
    sportType: 'musculation', sportLevel: 'intermediate',
    trainingDaysSelected: [0,1,3,4],
    appMode: 'both', firstName: 'Alex'
  };

  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const page = await ctx.newPage();
  
  await page.goto('http://127.0.0.1:3000');
  await page.waitForTimeout(1000);
  
  // Bypass gate
  await page.evaluate(() => {
    sessionStorage.setItem('mtd_gate_access', '1gs8uk7');
  });
  await page.reload();
  await page.waitForTimeout(3000);
  
  // Delete profile to trigger onboarding
  await page.evaluate(() => {
    localStorage.removeItem('sfc_profile');
    localStorage.removeItem('sfc_onboarding_done');
  });
  await page.reload();
  await page.waitForTimeout(3000);
  
  // 3. Nutrition step 1 — onboarding
  await page.screenshot({ path: '/home/user/Smartfitcoach/visual-screenshots/design-audit/nutrition-step1.png', fullPage: true });
  console.log('nutrition-step1 done');

  // Check what's on page
  const title = await page.title();
  const bodyText = await page.evaluate(() => document.body.innerText.slice(0, 200));
  console.log('Page title:', title);
  console.log('Body text:', bodyText);

  // Look for input
  const inputCount = await page.evaluate(() => document.querySelectorAll('input').length);
  console.log('Input count:', inputCount);
  
  // Navigate forward — click any visible primary button
  let stepped = 0;
  for (let i = 0; i < 10; i++) {
    const btnVisible = await page.evaluate(() => {
      const btn = document.querySelector('.btn-primary:not([disabled])');
      return btn ? btn.textContent.trim() : null;
    });
    console.log('Step', i, 'btn:', btnVisible);
    
    const stepText = await page.evaluate(() => {
      const si = document.querySelector('.step-indicator');
      return si ? si.textContent.trim() : '?';
    });
    console.log('Step indicator:', stepText);
    
    if (i === 0) {
      // Fill name if present
      const nameInput = await page.evaluate(() => {
        const inp = document.querySelector('input[type="text"], input:not([type])');
        if (inp) { inp.value = 'Alex'; inp.dispatchEvent(new Event('input')); return true; }
        return false;
      });
      console.log('Filled name:', nameInput);
    }
    
    // Click primary button
    const clicked = await page.evaluate(() => {
      const btn = document.querySelector('.btn-primary:not([disabled])');
      if (btn) { btn.click(); return true; }
      return false;
    });
    if (!clicked) break;
    await page.waitForTimeout(800);
    stepped++;
    
    if (i === 6) {
      await page.screenshot({ path: '/home/user/Smartfitcoach/visual-screenshots/design-audit/nutrition-step8.png', fullPage: true });
      console.log('nutrition-step8 done');
    }
    if (i === 7) {
      await page.screenshot({ path: '/home/user/Smartfitcoach/visual-screenshots/design-audit/nutrition-step9-day0.png', fullPage: true });
      console.log('nutrition-step9 done');
    }
  }
  
  await browser.close();
  console.log('DONE, stepped:', stepped);
})().catch(e => { console.error(e); process.exit(1); });
