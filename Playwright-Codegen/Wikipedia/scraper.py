from playwright.sync_api import Playwright, sync_playwright, Page


def write_to_file(filename: str, data: str):
    # Saves raw html to name.html files.
    with open(filename, "w") as f:
        f.write(data)


def run(playwright: Playwright) -> None:

    celebrity_names = ["Tom Cruise", "Johnny Depp", "Tom Holland", "Scarlett Johansson"]

    browser = playwright.chromium.launch(headless=False)
    context = browser.new_context()

    # looping through all celebrities
    for celebrity in celebrity_names:
        print(f"Processing {celebrity}")
        # Open new page
        page = context.new_page()

        # Go to https://www.wikipedia.org/
        page.goto("https://www.wikipedia.org/")

        # Click input[name="search"]
        page.click('input[name="search"]')

        # Fill input[name="search"]
        page.fill('input[name="search"]', celebrity)

        # Click #typeahead-suggestions a >> :nth-match(div, 2)
        page.click("#typeahead-suggestions a >> :nth-match(div, 2)")

        # file names should be like tom_cruise.html
        filename = "_".join(celebrity.lower().split()) + ".html"

        # write the html to a file
        write_to_file(filename, page.content())

        page.close()
        print(f"Processing completed for {celebrity}")

    # ---------------------
    context.close()
    browser.close()


with sync_playwright() as playwright:
    run(playwright)
