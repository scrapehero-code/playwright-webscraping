const { chromium } = require("playwright");
const ObjectsToCsv = require("objects-to-csv");

(async () => {
  const browser = await chromium.launch({
    headless: false,
  });
  const context = await browser.newContext();
  // Open new page
  const page = await context.newPage();
  // Go to https://scrapeme.live/shop/
  await page.goto("https://scrapeme.live/shop/", (waitUnitil = "networkidle0"));
  data = [];
  data = data.concat(await extract_data(page));
  // Looping through listing page
  for (let i = 0; i < 2; i++) {
    await page.locator("text=→").nth(1).click();
    data = data.concat(await extract_data(page));
    await page.waitForSelector("li.product");
  }
  // ---------------------
  await context.close();
  await browser.close();

  // Saving to csv
  save_to_csv(data);
})();

// Function to save into csv
function save_to_csv(data) {
  const csv = new ObjectsToCsv(data);
  csv.toDisk("listing_data_JS.csv");
}

// Function to extract the data
async function extract_data(page) {
  products = [];
  products = products.concat(
    await page.$$eval("li.product", (all_items) => {
      const data_list = [];
      // Looping through inner elements
      all_items.forEach((product) => {
        const name = product.querySelector("h2").innerText;
        const price = product.querySelector(
          "span.woocommerce-Price-amount"
        ).textContent;
        const image = product
          .querySelector(
            "a.woocommerce-LoopProduct-link.woocommerce-loop-product__link > img"
          )
          .getAttribute("src");
        data_list.push({ name, price, image });
      });
      return data_list;
    })
  );
  return products;
}
