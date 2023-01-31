const { chromium } = require("playwright");

const MAX_CONCURRENCY = 5;

/** dummy function to simulate extract data
 @param {Page} page
*/
async function extractData(page) {
  console.log(`Extracting data from ${page.url()}`);
  // we are using sleep instead of extracting all the data
  await new Promise((r) => setTimeout(r, 2000));
}

/** Process a single product page
 * @param {BrowserContext} context
 * @param {String} url
 */
async function processProductPage(context, url) {
  let page = await context.newPage();
  try {
    await page.goto(url);
  } catch (r) {
    // retry once again to account for any network errors
    await page.goto(url);
  }
  await extractData(page);
  await page.close();
}

/** Processes a single listing page
 * @param {BrowserContext} context
 * @param {String} url
 */
async function processListingPage(context, url) {
  let products,
    productAnchorElems,
    productUrls = [];
  let page = await context.newPage();

  await page.goto(url, { timeout: 60000 });
  products = page.locator("li.product a[class*=product__link]");
  productAnchorElems = await products.elementHandles();
  for (index in productAnchorElems) {
    productUrls.push(await productAnchorElems[index].getAttribute("href"));
  }
  await page.close();
  return productUrls;
}

/** Process a batch of URLs simulataneously
 * @param {Function} task
 * @param {BrowserContext} context
 * @param {Array<String>} urls
 */
async function processBatches(task, context, urls) {
  let batches = [],
    results = [],
    promises;

  // splitting urls into batches
  for (let i = 0; i < urls.length; i += MAX_CONCURRENCY) {
    batches.push(urls.slice(i, i + MAX_CONCURRENCY));
  }
  for (let batchIdx in batches) {
    // resetting promises
    promises = [];
    // populating promises
    for (let argIdx in batches[batchIdx]) {
      let url = batches[batchIdx][argIdx];
      promises.push(task(context, url));
    }
    // waiting for batch to finish
    await Promise.all(promises).then((values) => results.push(...values));
  }
  return results;
}

async function intercept(route) {
  const unwantedResources = ["stylesheet", "image", "fonts", "script"];
  if (unwantedResources.includes(route.request().resourceType())) {
    await route.abort();
  } else {
    await route.continue();
  }
}

(async () => {
  const browser = await chromium.launch({
    headless: true,
  });
  const context = await browser.newContext();
  await context.route("**/*", intercept);

  let maxPagination = 5;

  // initializing the listingUrls with the start URL
  let listingUrls = ["https://scrapeme.live/shop/"];
  // populating the listing urls with the rest of pagination urls
  for (let pageNo = 2; pageNo < maxPagination + 2; pageNo++) {
    listingUrls.push(`https://scrapeme.live/shop/page/${pageNo}`);
  }

  // process listing page data
  let results = await processBatches(processListingPage, context, listingUrls);

  let productUrls = [];
  // results will be list of list of productUrls
  productUrls = productUrls.concat(...results);

  // process product pages
  await processBatches(processProductPage, context, productUrls);

  // ---------------------
  await context.close();
  await browser.close();
})();
