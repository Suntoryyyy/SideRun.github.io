const puppeteer = require('puppeteer');
(async () => {
  const browser = await puppeteer.launch({ args: ['--no-sandbox'] });
  const page = await browser.newPage();
  
  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  page.on('pageerror', error => console.log('PAGE ERROR:', error.message));
  
  await page.goto('http://127.0.0.1:8094', { waitUntil: 'networkidle2' });
  
  // Try finding Friends tab to see if it renders
  await page.evaluate(() => {
    // Attempt clicking 'FRIENDS' in bottom tab
  });

  await new Promise(r => setTimeout(r, 2000));
  await browser.close();
})();
