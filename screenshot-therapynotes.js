// Run locally: npm install puppeteer && node screenshot-therapynotes.js
// Screenshots save to ./therapy-screenshots/

const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

const OUT_DIR = path.join(__dirname, 'therapy-screenshots');
if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });

const PAGES = [
  { name: '01-homepage',              url: 'https://www.therapynotes.com/' },
  { name: '02-features',              url: 'https://www.therapynotes.com/features/' },
  { name: '03-scheduling',            url: 'https://www.therapynotes.com/features/scheduling/' },
  { name: '04-notes',                 url: 'https://www.therapynotes.com/features/notes/' },
  { name: '05-billing',               url: 'https://www.therapynotes.com/features/billing/' },
  { name: '06-telehealth',            url: 'https://www.therapynotes.com/features/telehealth/' },
  { name: '07-client-portal',         url: 'https://www.therapynotes.com/features/client-portal/' },
  { name: '08-secure-messaging',      url: 'https://www.therapynotes.com/features/secure-messaging/' },
  { name: '09-wiley-practice-planners', url: 'https://www.therapynotes.com/features/wiley-practice-planners/' },
  { name: '10-electronic-health-records', url: 'https://www.therapynotes.com/features/electronic-health-records/' },
  { name: '11-mobile',                url: 'https://www.therapynotes.com/features/mobile/' },
  { name: '12-pricing',               url: 'https://www.therapynotes.com/pricing/' },
  { name: '13-about',                 url: 'https://www.therapynotes.com/about/' },
  { name: '14-careers',               url: 'https://www.therapynotes.com/careers/' },
  { name: '15-blog',                  url: 'https://www.therapynotes.com/blog/' },
  { name: '16-contact',               url: 'https://www.therapynotes.com/contact/' },
  { name: '17-login',                 url: 'https://www.therapynotes.com/login/' },
  { name: '18-signup',                url: 'https://www.therapynotes.com/signup/' },
  { name: '19-hipaa-compliant-ehr',   url: 'https://www.therapynotes.com/hipaa-compliant-ehr/' },
  { name: '20-security',              url: 'https://www.therapynotes.com/security/' },
  { name: '21-privacy-policy',        url: 'https://www.therapynotes.com/privacy-policy/' },
  { name: '22-terms-of-service',      url: 'https://www.therapynotes.com/terms-of-service/' },
  { name: '23-demo',                  url: 'https://www.therapynotes.com/demo/' },
  { name: '24-partners',              url: 'https://www.therapynotes.com/partners/' },
  { name: '25-integrations',          url: 'https://www.therapynotes.com/integrations/' },
];

async function screenshotPage(browser, { name, url }) {
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });

  try {
    console.log(`Capturing: ${url}`);
    const response = await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
    const status = response ? response.status() : 'unknown';

    // Remove chat/cookie pop-ups that obscure content
    await page.evaluate(() => {
      const selectors = [
        '[id*="cookie"]', '[class*="cookie"]',
        '[id*="chat"]', '[class*="intercom"]',
        '[id*="drift"]', '[class*="drift"]',
        '[id*="hubspot"]', '[class*="hubspot"]',
        '[id*="CookieBanner"]',
      ];
      selectors.forEach(s =>
        document.querySelectorAll(s).forEach(el => el.remove())
      );
    }).catch(() => {});

    // Scroll through the page to trigger lazy loading
    await page.evaluate(async () => {
      await new Promise(resolve => {
        let scrolled = 0;
        const id = setInterval(() => {
          window.scrollBy(0, 400);
          scrolled += 400;
          if (scrolled >= document.body.scrollHeight) {
            clearInterval(id);
            window.scrollTo(0, 0);
            resolve();
          }
        }, 100);
      });
    }).catch(() => {});

    await new Promise(r => setTimeout(r, 1000));

    const file = path.join(OUT_DIR, `${name}.png`);
    await page.screenshot({ path: file, fullPage: true });
    console.log(`  -> saved ${name}.png  [HTTP ${status}]`);
    return { name, url, status, file, ok: true };
  } catch (err) {
    console.error(`  ERROR ${name}: ${err.message}`);
    return { name, url, ok: false, error: err.message };
  } finally {
    await page.close();
  }
}

(async () => {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
    ignoreHTTPSErrors: true,
  });

  const results = [];
  for (const p of PAGES) {
    results.push(await screenshotPage(browser, p));
  }

  await browser.close();

  console.log('\n=== Results ===');
  const ok = results.filter(r => r.ok);
  const fail = results.filter(r => !r.ok);
  ok.forEach(r => console.log(`  [OK]   ${r.name} (HTTP ${r.status})`));
  fail.forEach(r => console.log(`  [FAIL] ${r.name}: ${r.error}`));
  console.log(`\nSaved ${ok.length}/${results.length} screenshots to: ${OUT_DIR}`);
})();
