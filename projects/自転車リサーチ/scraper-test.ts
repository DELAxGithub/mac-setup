import { chromium } from "playwright-extra";
import stealth from "puppeteer-extra-plugin-stealth";
chromium.use(stealth());
import * as fs from "fs";

const TARGET_URL = "https://buycycle.com/es-es/shop/main-types/bikes/types/road-gravel/categories/road/brands/canyon/frame-sizes/s";

async function main() {
    console.log(`Starting Buycycle scraping test on ${TARGET_URL}`);

    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({
        userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        viewport: { width: 1280, height: 800 }
    });
    const page = await context.newPage();

    try {
        console.log("Navigating to the target page...");
        await page.goto(TARGET_URL, { waitUntil: "domcontentloaded", timeout: 30000 });

        console.log("Looking for cookie banner...");
        try {
            const cookieAcceptBtn = page.locator('#CybotCookiebotDialogBodyLevelButtonLevelOptinAllowAll');
            await cookieAcceptBtn.waitFor({ state: "visible", timeout: 5000 });
            await cookieAcceptBtn.click();
            console.log("Accepted cookies!");
        } catch (e) {
            console.log("No cookie banner found or timeout.");
        }

        console.log("Waiting for network requests to settle...");
        await page.waitForTimeout(8000);

        // Extract raw DOM text
        const bodyText = await page.evaluate(() => document.body.innerText);
        fs.writeFileSync("buycycle_extracted_text.txt", bodyText);
        console.log(`Successfully extracted ${bodyText.length} characters to buycycle_extracted_text.txt`);

    } catch (error) {
        console.error("Navigation error:", error);
    }

    await browser.close();
}

main().catch(console.error);
