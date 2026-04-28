import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  page.on('console', msg => console.log('BROWSER CONSOLE:', msg.text()));
  page.on('pageerror', err => console.error('BROWSER ERROR:', err));
  
  await page.goto('http://localhost:5174'); // note: starting npm run dev above bounded to 5174 usually, or we can just start it here
  await page.waitForTimeout(5000);
  await browser.close();
  console.log("Done");
})();
