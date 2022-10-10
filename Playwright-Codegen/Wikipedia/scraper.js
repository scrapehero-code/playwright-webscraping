const { chromium } = require("playwright");

const fs = require("fs");

/**
 * Saves raw html to name.html files.
 * @param {String} filename
 * @param {String} data
 * @returns
 */
async function writeToFile(filename, data) {
  fs.writeFile(filename, data, (err) => {
    if (err) throw err;
  });
}

(async () => {
  const browser = await chromium.launch({
    headless: false,
  });
  const context = await browser.newContext();

  let celebrityNames = [
    "Tom Cruise",
    "Johnny Depp",
    "Tom Holland",
    "Scarlett Johansson",
  ];

  // looping through all celebrities
  for (const celebrity of celebrityNames) {
    console.log(`Processing ${celebrity}`);
    // Open new page
    const page = await context.newPage();

    // Go to https://www.wikipedia.org/
    await page.goto("https://www.wikipedia.org/");

    // Click input[name="search"]
    await page.click('input[name="search"]');

    // Fill input[name="search"]
    await page.fill('input[name="search"]', celebrity);

    // Click #typeahead-suggestions a >> :nth-match(div, 2)
    await page.click("#typeahead-suggestions a >> :nth-match(div, 2)");

    // file names should be like tom_cruise.html
    let filename = celebrity.toLowerCase().split(" ").join("_") + ".html";

    // write the html to a file
    await writeToFile(filename, await page.content());

    await page.close();
    console.log(`Processing completed ${celebrity}`);
  }

  // ---------------------
  await context.close();
  await browser.close();
})();
