import asyncio
import csv
from playwright.async_api import Playwright, async_playwright


# Function to extract the data
async def extract_data(page):
    products = []
    all_items = await page.query_selector_all("li.product")
    # Looping through inner elements
    for item in all_items:
        product = {}
        name_el = await item.query_selector("h2")
        product["name"] = await name_el.inner_text()
        price_el = await item.query_selector("span.woocommerce-Price-amount")
        product["price"] = await price_el.text_content()
        image = await item.query_selector(
            "a.woocommerce-LoopProduct-link.woo" "commerce-loop-product__link > img"
        )
        product["image_url"] = await image.get_attribute("src")
        products.append(product)
    return products


# Function to save into csv
def save_to_csv(data):
    with open("listing_data_python.csv", "w", newline="") as csvfile:
        fieldnames = ["name", "price", "image_url"]
        writer = csv.DictWriter(csvfile, fieldnames=fieldnames, quoting=csv.QUOTE_ALL)
        writer.writeheader()
        writer.writerows(data)


async def run(playwright: Playwright) -> None:
    browser = await playwright.chromium.launch(headless=False)
    context = await browser.new_context()
    # Open new page
    page = await context.new_page()
    # Go to https://scrapeme.live/shop/
    await page.goto("https://scrapeme.live/shop/")
    data = []
    data.extend(await extract_data(page))
    # Looping through listing page
    for i in range(2):
        await page.locator("text=→").nth(1).click()
        data.extend(await extract_data(page))
        await page.wait_for_selector("li.product")
    await context.close()
    await browser.close()

    # Saving to csv
    save_to_csv(data)


async def main() -> None:
    async with async_playwright() as playwright:
        await run(playwright)


asyncio.run(main())
