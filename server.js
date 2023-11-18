const puppeteer = require('puppeteer');
const fs = require('fs');

(async () => {
  const browser = await puppeteer.launch({ args: ['--no-sandbox'], headless: 'new' });

  // Read the list of URLs from the file
  const urls = fs.readFileSync('urls.txt', 'utf-8').split('\n').filter(Boolean);

  // Array to store all network requests
  const allNetworkRequests = [];

  // Iterate through each URL and navigate to it
  for (const url of urls) {
    const page = await browser.newPage();

    // Enable the network domain to intercept network requests
    await page.setRequestInterception(true);

    // Array to store network requests for each URL
    const networkRequests = [];

    // Listen to the request event and save the URL of each request
    page.on('request', (request) => {
      networkRequests.push(request.url());
      allNetworkRequests.push(request.url()); // Save to the global array as well
      request.continue();
    });

    console.log('Navigating to:', url);
    await page.goto(url);

    // Wait for a while to capture network traffic for each URL
    await page.waitForTimeout(5000);

    // Run JavaScript code to click on all buttons
    const clickOnButtons = async () => {
      const buttons = await document.querySelectorAll('button');
      for (const button of buttons) {
        button.click();
      }
    };

    await page.evaluate(clickOnButtons);

    // Wait for additional network requests triggered by button clicks
    await page.waitForTimeout(5000);

    // Close the page after each iteration
    await page.close();
  }

  // Save all network requests to a file
  fs.writeFileSync('all-network-requests.txt', allNetworkRequests.join('\n'));

  // Close the browser
  await browser.close();
})();
