const puppeteer = require('puppeteer');
const fs = require('fs');

async function isDownload(response) {
  const contentType = response.headers()['content-type'];
  const contentDisposition = response.headers()['content-disposition'];

  // Exclude based on headers
  return contentType && contentType.includes('application/octet-stream') &&
    contentDisposition && contentDisposition.includes('attachment');
}

async function scrapeUrl(browser, url, allNetworkRequests) {
  // Prepend 'http://' if the URL doesn't have a protocol
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    url = 'http://' + url;
  }

  const page = await browser.newPage();
  const networkRequests = [];

  page.on('response', async (response) => {
    if (await isDownload(response)) {
      // Skip download URLs
      return;
    }

    const url = response.url();

    // Exclude requests with specific file extensions and data: protocol
    if (!url.match(/\.(jpg|jpeg|gif|css|tif|tiff|png|ttf|woff|woff2|ico|pdf|svg)$/i) && !url.startsWith('data:')) {
      networkRequests.push(url);
      allNetworkRequests.push(url);
    }
  });

  console.log('Navigating to:', url);
  try {
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 120000 });

    // Define the clickOnButtons function inside page.evaluate
    await page.evaluate(async () => {
      const clickOnButtons = async () => {
        const buttons = await document.querySelectorAll('button');
        await Promise.all(Array.from(buttons).map((button) => button.click()));
      };

      await clickOnButtons();
    });

    await page.waitForTimeout(5000); // Adjust this as needed
  } catch (error) {
    console.error(`Error navigating to ${url}:`, error);
  } finally {
    // Close the page in the finally block to ensure it is always closed
    await page.close();
  }
}

(async () => {
  const browser = await puppeteer.launch({ args: ['--no-sandbox'], headless: true });
  const urls = fs.readFileSync('urls.txt', 'utf-8').split('\n').filter(Boolean);
  const allNetworkRequests = [];

  const concurrency = 20; // Set your desired concurrency level

  const chunks = Array.from({ length: Math.ceil(urls.length / concurrency) }, (_, index) => {
    const start = index * concurrency;
    return urls.slice(start, start + concurrency);
  });

  for (const chunk of chunks) {
    await Promise.all(chunk.map(url => scrapeUrl(browser, url, allNetworkRequests)));
  }

  fs.writeFileSync('all-network-requests.txt', allNetworkRequests.join('\n'));
  await browser.close();
})();
