import { chromium } from "playwright-extra";
import stealth from "puppeteer-extra-plugin-stealth";
chromium.use(stealth());
import * as fs from "fs";

// Broad search: Canyon, Road, eTap AXS or Di2, all sizes, sorted by newest or high end might be better, but let's just grab the whole page.
const TARGET_URL = "https://buycycle.com/es-es/shop/main-types/bikes/types/road-gravel/categories/road/brands/canyon/families/endurace,ultimate";

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
        } catch (e) { }

        // Scroll a few times to load more products if it's infinite scroll
        for (let i = 0; i < 3; i++) {
            await page.evaluate(() => window.scrollBy(0, document.body.scrollHeight));
            await page.waitForTimeout(3000);
        }

        productData = await page.$$eval('a[href*="/product/"]', anchors => {
            return anchors.map(a => {
                return {
                    url: a.href,
                    text: (a as HTMLElement).innerText
                };
            }).filter(item => item.text && item.text.includes("Canyon"));
        });

        const uniqueProducts = Array.from(new Map(productData.map(item => [item.url, item])).values());

        // Filter for SLX or CFR in the text, and >= 2023
        const highEndBikes = uniqueProducts.filter(p => {
            const hasGrade = p.text.includes("SLX") || p.text.includes("CFR");
            const hasRecentYear = p.text.includes("2023") || p.text.includes("2024") || p.text.includes("2025") || p.text.includes("2026");
            const hasWireless = p.text.includes("AXS") || p.text.includes("eTap");
            return hasGrade && hasRecentYear && hasWireless;
        });

        fs.writeFileSync("high_end_bikes.json", JSON.stringify(highEndBikes, null, 2));
        console.log(`Found ${highEndBikes.length} High-End SRAM bikes matching the tier 1+ criteria (ignoring price).`);

    } catch (error) {
        console.error("Navigation error:", error);
    }
    await browser.close();
}

main().catch(console.error);
