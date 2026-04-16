import puppeteer from 'puppeteer';

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  
  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  page.on('pageerror', error => console.log('PAGE ERROR:', error.message));
  page.on('requestfailed', request =>
    console.log(`REQUEST FAILED: ${request.url()} - ${request.failure().errorText}`)
  );

  console.log('Navigating to http://localhost:5173...');
  try {
    const response = await page.goto('http://localhost:5173', { waitUntil: 'networkidle0' });
    console.log(`Status: ${response.status()}`);
    console.log('HTML length:', (await page.content()).length);
  } catch (err) {
    console.error('Error navigating:', err);
  }

  await browser.close();
})();
