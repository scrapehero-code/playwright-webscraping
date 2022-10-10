const { chromium } = require("playwright");
const createCsvWriter = require("csv-writer").createObjectCsvWriter;

async function writeCsv(data) {
  const csvWriter = createCsvWriter({
    path: "price_data.csv",
    header: [
      { id: "price_date", title: "price_date" },
      { id: "price", title: "price" },
    ],
    alwaysQuote: true,
  });
  await csvWriter.writeRecords([data]);
}

(async () => {
  const browser = await chromium.launch({
    headless: false,
  });
  const context = await browser.newContext();

  // Open new page
  const page = await context.newPage();

  // Go to https://www.amazon.com/Apple-MacBook-16-inch-10%E2%80%91core-32%E2%80%91core/dp/B09R34VZP6/
  await page.goto(
    "https://www.amazon.com/Apple-MacBook-16-inch-10%E2%80%91core-32%E2%80%91core/dp/B09R34VZP6/",
    { timeout: 60000 }
  );

  // Click text=Select your address
  await page.click("text=Select your address");

  // Click [aria-label="or enter a US zip code"]
  await page.click('[aria-label="or enter a US zip code"]');

  // Fill [aria-label="or enter a US zip code"]
  await page.fill('[aria-label="or enter a US zip code"]', "10013");

  // Click text=ApplyPlease enter a valid US zip codeThis zip code is not currently available. P >> input[type="submit"]
  await page.click(
    'text=ApplyPlease enter a valid US zip codeThis zip code is not currently available. P >> input[type="submit"]'
  );

  // wait for zipcode to change
  await page.waitForSelector("#GLUXZipConfirmationValue");

  // Click the Done button
  await page.click('button:has-text("Done")');

  // reload the page
  await page.reload();

  // getting the price
  let price = await page.innerText(
    "#corePrice_feature_div .a-price .a-offscreen"
  );

  // collecting date
  let priceDate = new Date().toISOString().split("T")[0];
  // writing data to a csv file
  await writeCsv({ price: price, price_date: priceDate });

  // ---------------------
  await context.close();
  await browser.close();
})();
