import { chromium } from "playwright-extra";
import stealth from "puppeteer-extra-plugin-stealth";
chromium.use(stealth());
import * as fs from "fs";

const PRODUCT_URL = "https://buycycle.com/es-es/product/endurace-cf-sl-8-aero-2022-41651";

async function main() {
    console.log(`Navigating to ${PRODUCT_URL}...`);
    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({
        userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        viewport: { width: 1280, height: 800 }
    });
    const page = await context.newPage();

    try {
        await page.goto(PRODUCT_URL, { waitUntil: "domcontentloaded", timeout: 30000 });
        await page.waitForTimeout(5000);
        const text = await page.evaluate(() => document.body.innerText);
        fs.writeFileSync("single_product_text.txt", text);
        console.log("Saved single_product_text.txt");
    } catch (error) {
        console.error("Error:", error);
    }
    await browser.close();
}

main().catch(console.error);
