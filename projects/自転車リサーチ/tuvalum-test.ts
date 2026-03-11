import { chromium } from "playwright-extra";
import stealth from "puppeteer-extra-plugin-stealth";
chromium.use(stealth());
import * as fs from "fs";

// Guessing Tuvalum URL structure for Canyon road bikes. If it 404s, we will look at the homepage DOM.
const TARGET_URL = "https://tuvalum.com/collections/bicicletas-canyon?filter.v.m.characteristics.uso=Carretera";
const FALLBACK_URL = "https://tuvalum.com/collections/bicicletas-canyon";

async function main() {
    console.log(`Navigating to Tuvalum...`);
    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({
        userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        viewport: { width: 1280, height: 800 }
    });
    const page = await context.newPage();

    let productData = [];

    try {
        let response = await page.goto(TARGET_URL, { waitUntil: "domcontentloaded", timeout: 30000 });
        if (response && response.status() === 404) {
            console.log("Got 404, falling back to basic URL to find links...");
            await page.goto(FALLBACK_URL, { waitUntil: "domcontentloaded", timeout: 30000 });
        }

        await page.waitForTimeout(5000);

        // Accept cookies if any prominent button exists
        try {
            await page.evaluate(() => {
                const buttons = Array.from(document.querySelectorAll('button'));
                const acceptBtn = buttons.find(b => b.innerText.toLowerCase().includes('aceptar') || b.innerText.toLowerCase().includes('accept'));
                if (acceptBtn) acceptBtn.click();
            });
        } catch (e) { }

        await page.waitForTimeout(3000);

        const htmlText = await page.evaluate(() => document.body.innerText);
        fs.writeFileSync("tuvalum_extracted_text.txt", htmlText);

        // Try to extract any product links
        productData = await page.$$eval('a', anchors => {
            return anchors.map(a => {
                return {
                    url: a.href,
                    text: (a as HTMLElement).innerText
                };
            }).filter(item => item.text && (item.text.toLowerCase().includes("canyon") || item.url.includes("canyon")));
        });

        // Deduplicate
        const uniqueProducts = Array.from(new Map(productData.map(item => [item.url, item])).values());
        fs.writeFileSync("tuvalum_links.json", JSON.stringify(uniqueProducts, null, 2));

        console.log(`Extracted ${uniqueProducts.length} Canyon-related links.`);

    } catch (error) {
        console.error("Navigation error:", error);
    }

    await browser.close();
}

main().catch(console.error);
