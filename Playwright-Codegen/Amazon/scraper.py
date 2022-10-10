import csv
from datetime import datetime

from playwright.sync_api import Playwright, sync_playwright


def write_csv(data):
    with open("price_data.csv", "w") as f:
        writer = csv.DictWriter(f, ["price_date", "price"], quoting=csv.QUOTE_ALL)
        writer.writeheader()
        writer.writerow(data)


def run(playwright: Playwright) -> None:
    browser = playwright.chromium.launch(headless=False)
    context = browser.new_context()

    # Open new page
    page = context.new_page()

    # Go to https://www.amazon.com/Apple-MacBook-16-inch-10%E2%80%91core-32%E2%80%91core/dp/B09R34VZP6/
    page.goto(
        "https://www.amazon.com/Apple-MacBook-16-inch-10%E2%80%91core-32%E2%80%91core/dp/B09R34VZP6/",
        timeout=60000,
    )

    # Click text=Select your address
    page.click("text=Select your address")

    # Click [aria-label="or enter a US zip code"]
    page.click('[aria-label="or enter a US zip code"]')

    # Fill [aria-label="or enter a US zip code"]
    page.fill('[aria-label="or enter a US zip code"]', "10013")

    # Click text=ApplyPlease enter a valid US zip codeThis zip code is not currently available. P >> input[type="submit"]
    page.click(
        'text=ApplyPlease enter a valid US zip codeThis zip code is not currently available. P >> input[type="submit"]'
    )

    # wait for zipcode to change
    page.wait_for_selector("#GLUXZipConfirmationValue")

    # Click the Done button
    page.click('button:has-text("Done")')

    # reload the page
    page.reload(timeout=60000)

    # getting price
    price = page.inner_text("#corePrice_feature_div .a-price .a-offscreen")

    # collecting date
    price_date = str(datetime.now().date())

    # writing to a file
    write_csv({"price_date": price_date, "price": price})
    # ---------------------
    context.close()
    browser.close()


with sync_playwright() as playwright:
    run(playwright)
