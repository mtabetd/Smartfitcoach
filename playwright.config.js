// @ts-check
const { defineConfig, devices } = require('@playwright/test');

module.exports = defineConfig({
  testDir: './tests/e2e',
  timeout: 30000,
  retries: 0,
  workers: 1, // séquentiel — moins de faux positifs sur app SPA
  reporter: [['list'], ['html', { outputFolder: 'playwright-report', open: 'never' }]],
  use: {
    baseURL: 'http://localhost:3000',
    headless: true,
    viewport: { width: 390, height: 844 }, // iPhone 14 — cible principale
    ignoreHTTPSErrors: true,
    serviceWorkers: 'block', // Bloque le SW pour éviter le reload silencieux en test
    // Bypass gate en injectant le token sessionStorage avant tout script
    storageState: undefined,
  },
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 390, height: 844 },
        launchOptions: {
          executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome',
          args: ['--no-sandbox', '--disable-setuid-sandbox'],
        },
      },
    },
  ],
  webServer: {
    command: 'http-server app -p 3000 -c-1 --cors -s',
    url: 'http://localhost:3000',
    reuseExistingServer: false,
    timeout: 15000,
  },
});
