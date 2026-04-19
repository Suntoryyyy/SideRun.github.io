const puppeteer = require('puppeteer');
(async () => {
  const browser = await puppeteer.launch({ args: ['--no-sandbox'] });
  const page = await browser.newPage();
  
  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  page.on('pageerror', error => console.log('PAGE ERROR:', error.message));

  await page.goto('http://127.0.0.1:8081', { waitUntil: 'networkidle2' });
  
  // Click "Runner Pro is live!"
  console.log('Finding Runner Pro list element...');
  await page.evaluate(() => {
    const texts = Array.from(document.querySelectorAll('*')).filter(el =>
      el.textContent && el.textContent.includes('Runner Pro is live!') && el.children.length === 0
    );
    if(texts.length > 0) {
      console.log("Clicking element and waiting");
      texts[0].click();
    } else {
      console.log("Could not find button");
    }
  });

  await new Promise(r => setTimeout(r, 4000));
  await browser.close();
})();
