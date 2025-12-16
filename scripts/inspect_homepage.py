from playwright.sync_api import sync_playwright

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page(viewport={'width': 1920, 'height': 1080})

    # Navigate to homepage with longer timeout
    page.goto('http://localhost:3000', timeout=60000)
    page.wait_for_timeout(5000)  # Wait for page to fully load

    # Screenshot 1: Hero section (top of page)
    page.screenshot(path='/tmp/homepage_hero.png')
    print("Screenshot 1: Hero section saved")

    # Screenshot 2: Scroll down to see quote section and next sections
    page.evaluate('window.scrollTo(0, window.innerHeight)')
    page.wait_for_timeout(1000)
    page.screenshot(path='/tmp/homepage_section2.png')
    print("Screenshot 2: Second section saved")

    # Screenshot 3: Scroll more for testimonials
    page.evaluate('window.scrollTo(0, window.innerHeight * 2)')
    page.wait_for_timeout(1000)
    page.screenshot(path='/tmp/homepage_section3.png')
    print("Screenshot 3: Third section saved")

    # Screenshot 4: Scroll more for carroceria/video
    page.evaluate('window.scrollTo(0, window.innerHeight * 3)')
    page.wait_for_timeout(1000)
    page.screenshot(path='/tmp/homepage_section4.png')
    print("Screenshot 4: Fourth section saved")

    # Screenshot 5: Scroll more for branches
    page.evaluate('window.scrollTo(0, window.innerHeight * 4)')
    page.wait_for_timeout(1000)
    page.screenshot(path='/tmp/homepage_section5.png')
    print("Screenshot 5: Fifth section saved")

    browser.close()
    print("Done!")
