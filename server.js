const puppeteer = require('puppeteer');
const fs = require('fs');

(async () => {
  const browser = await puppeteer.launch({ args: ['--no-sandbox'], headless: true });
  const urls = fs.readFileSync('urls.txt', 'utf-8').split('\n').filter(Boolean);
  const allNetworkRequests = [];

  await Promise.all(
    urls.map(async (url) => {
      const page = await browser.newPage();
      await page.setRequestInterception(true);
      const networkRequests = [];

      page.on('request', (request) => {
        const url = request.url();
        
        // Exclude requests with specific file extensions and data: protocol
        if (!url.match(/\.(jpg|jpeg|gif|css|tif|tiff|png|ttf|woff|woff2|ico|pdf|svg)$/i) && !url.startsWith('data:')) {
          networkRequests.push(url);
          allNetworkRequests.push(url);
        }
        
        request.continue();
      });

      console.log('Navigating to:', url);
      await Promise.all([
        page.goto(url, { waitUntil: 'domcontentloaded' }),
        page.waitForTimeout(5000), // Adjust this as needed
      ]);

      // Define the clickOnButtons function inside page.evaluate
      await page.evaluate(async () => {
        const clickOnButtons = async () => {
          const buttons = await document.querySelectorAll('button');
          await Promise.all(Array.from(buttons).map((button) => button.click()));
        };

        await clickOnButtons();
      });

      await page.waitForTimeout(5000); // Adjust this as needed
      await page.close();
    })
  );

  fs.writeFileSync('all-network-requests.txt', allNetworkRequests.join('\n'));
  await browser.close();
})();
