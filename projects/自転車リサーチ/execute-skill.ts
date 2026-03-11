import { chromium } from "playwright-extra";
import stealth from "puppeteer-extra-plugin-stealth";
chromium.use(stealth());
import * as fs from "fs";

const TARGET_URL = "https://buycycle.com/es-es/shop/main-types/bikes/types/road-gravel/categories/road/brands/canyon/families/endurace,ultimate/frame-sizes/s";

async function main() {
    console.log(`Navigating to ${TARGET_URL}...`);
    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({
        userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        viewport: { width: 1280, height: 800 }
    });
    const page = await context.newPage();

    let productData = [];

    try {
        await page.goto(TARGET_URL, { waitUntil: "domcontentloaded", timeout: 30000 });

        try {
            const cookieAcceptBtn = page.locator('#CybotCookiebotDialogBodyLevelButtonLevelOptinAllowAll');
            await cookieAcceptBtn.waitFor({ state: "visible", timeout: 5000 });
            await cookieAcceptBtn.click();
        } catch (e) {
            // ignore
        }

        await page.waitForTimeout(8000);

        // Extract links and text that look like products
        productData = await page.$$eval('a[href*="/product/"]', anchors => {
            return anchors.map(a => {
                return {
                    url: a.href,
                    text: (a as HTMLElement).innerText
                };
            }).filter(item => item.text && item.text.includes("Canyon"));
        });

        // Deduplicate by URL
        const uniqueProducts = Array.from(new Map(productData.map(item => [item.url, item])).values());
        productData = uniqueProducts;

        console.log(`Extracted ${productData.length} unique products.`);

    } catch (error) {
        console.error("Navigation error:", error);
    }

    await browser.close();

    fs.writeFileSync("productData_with_urls.json", JSON.stringify(productData, null, 2));
    console.log("Extraction complete. Antigravity will now process productData_with_urls.json");
}

main().catch(console.error);
