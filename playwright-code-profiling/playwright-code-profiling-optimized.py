import asyncio
import itertools
from playwright.async_api import Playwright, async_playwright


async def extract_data(page):
    print(f"Extracting data for {page.url}")
    # we are using sleep instead of extracting all the data
    await asyncio.sleep(2)


async def process_product_page(context, url, sem):
    """Extract data from a single product page"""
    async with sem:
        page = await context.new_page()
        try:
            await page.goto(url, timeout=60000)
        except Exception:
            # Retrying once to account for network errors
            await page.goto(url, timeout=60000)
        await extract_data(page)
        await page.close()


async def process_listing_page(context, url, sem):
    """Extract data from a single listing page"""
    async with sem:
        page = await context.new_page()
        await page.goto(url, timeout=60000)
        products = page.locator('li.product a[class*=product__link]')
        product_anchor_elements = await products.element_handles()
        product_urls = await asyncio.gather(*[
            i.get_attribute('href') for i in product_anchor_elements
        ])
        await page.close()
        return product_urls


async def intercept(route):
    if route.request.resource_type in {"stylesheet", 'image', 'fonts', 'script'}:
        await route.abort()
    else:
        await route.continue_()


async def run(playwright: Playwright) -> None:
    browser = await playwright.chromium.launch()
    context = await browser.new_context()
    
    # request interception
    await context.route('**/*', intercept)

    sem = asyncio.Semaphore(5)

    max_pagination = 5
    # list is initialised with starting url
    listing_urls = ["https://scrapeme.live/shop/"]
    for page_no in range(2, max_pagination + 2):
        listing_urls.append(f"https://scrapeme.live/shop/page/{page_no}")

    product_urls = []
    listing_coro = []
    for url in listing_urls:
        listing_coro.append(process_listing_page(context, url, sem))
    # product urls will be a list containing list of urls
    product_urls = await asyncio.gather(*listing_coro)

    product_coros = []
    # using itertools.chain to loop over product urls
    for url in itertools.chain(*product_urls):
        product_coros.append(process_product_page(context, url, sem))

    await asyncio.gather(*product_coros)

    # ---------------------
    await context.close()
    await browser.close()


async def main():
    async with async_playwright() as playwright:
        await run(playwright) 


asyncio.run(main())
