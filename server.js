const puppeteer = require('puppeteer');
const fs = require('fs');

(async () => {
  const browser = await puppeteer.launch({ args: ['--no-sandbox'] });
  const page = await browser.newPage();

  // Read the list of URLs from the file
  const urls = fs.readFileSync('urls.txt', 'utf-8').split('\n').filter(Boolean);

  // Enable the network domain to intercept network requests
  await page.setRequestInterception(true);

  // Array to store network request URLs
  const networkRequests = [];

  // Listen to the request event and save the URL of each request
  page.on('request', (request) => {
    networkRequests.push(request.url());
    request.continue();
  });

  // Iterate through each URL and navigate to it
  for (const url of urls) {
    console.log('Navigating to:', url);
    await page.goto(url);

    // Wait for a while to capture network traffic for each URL
    await page.waitForTimeout(5000);
  }

  // Save the network requests to a file
  fs.writeFileSync('network-requests.txt', networkRequests.join('\n'));

  // Close the browser
  await browser.close();
})();

