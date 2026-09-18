import puppeteer from 'puppeteer';
(async () => {
  const browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  const page = await browser.newPage();
  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  page.on('pageerror', err => console.log('PAGE ERROR:', err.toString()));
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle0' });
  await page.click('button:has-text("Carteiras & Mandatos")').catch(()=>console.log("No button"));
  // we can also just evaluate in page
  const text = await page.evaluate(() => document.body.innerText);
  console.log("BODY TEXT:", text.substring(0, 200));
  await browser.close();
})();
