import { chromium } from "playwright-extra";
import stealth from "puppeteer-extra-plugin-stealth";
import * as fs from "fs";
import * as dotenv from "dotenv";
import { GoogleGenAI, Type, Schema } from "@google/genai";
import { execFileSync } from 'child_process';

dotenv.config();

chromium.use(stealth());

const TARGET_URL = "https://buycycle.com/es-es/shop/main-types/bikes/types/road-gravel/categories/road/brands/canyon/families/endurace,ultimate/frame-sizes/s";
const STATE_FILE = "notified_urls.json";
const RECIPIENT_EMAIL = "h.kodera@gmail.com";

const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
    console.error("GEMINI_API_KEY is missing in .env");
    process.exit(1);
}

const ai = new GoogleGenAI({ apiKey });

// Load state
let notifiedUrls: string[] = [];
if (fs.existsSync(STATE_FILE)) {
    notifiedUrls = JSON.parse(fs.readFileSync(STATE_FILE, "utf-8"));
}

function saveState() {
    fs.writeFileSync(STATE_FILE, JSON.stringify(notifiedUrls, null, 2));
}

function sendSummaryEmail(targets: any[]) {
    if (targets.length === 0) return;

    const rawSubject = `[Buycycle] 🚲 新着ターゲット物件サマリー (${targets.length}件)`;
    const subject = `=?UTF-8?B?${Buffer.from(rawSubject).toString('base64')}?=`;

    let body = `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 🚲 Buycycle Premium Monitoring Report
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

条件に合致する「至高の1台」候補が ${targets.length} 件見つかりました。
本日のターゲット物件リストをお届けします。

`;

    targets.forEach((bike, index) => {
        const tierLabel = bike.is_tier_one_plus ? "🌟 Tier 1+ (ULTIMATE TARGET)" : "✅ Tier 1 (Standard)";

        body += `【${index + 1}】 ${bike.brand} ${bike.model} (${bike.size})\n`;
        body += `STATUS: ${tierLabel}\n`;
        body += `PRICE : €${bike.price_eur.toLocaleString()}\n`;
        body += `COMP  : ${bike.components}\n`;
        body += `YEAR  : ${bike.year || 'N/A'}\n`;
        body += `\n`;
        body += `AI-JUDGE:\n${bike.reason}\n`;
        body += `\n`;
        body += `VIEW PRODUCT:\n${bike.url}\n`;
        body += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;
    });

    body += `\n※ このメールは自動送信されています。
※ 詳細は即座に上記URLよりご確認ください。早い者勝ちです。`;

    try {
        console.log(`Sending premium summary email with ${targets.length} items...`);
        const args = [
            'gmail', '+send',
            '--to', RECIPIENT_EMAIL,
            '--subject', subject,
            '--body', body.trim()
        ];
        execFileSync('gws', args, { encoding: 'utf-8' });
        console.log("✅ Summary email sent successfully.");
    } catch (error: any) {
        console.error("❌ Failed to send email:", error.message);
    }
}

const bikeSchema: Schema = {
    type: Type.ARRAY,
    items: {
        type: Type.OBJECT,
        properties: {
            is_target: { type: Type.BOOLEAN },
            is_tier_one_plus: { type: Type.BOOLEAN, description: "True if it meets the Tier 1+ (Top Priority) criteria." },
            reason: { type: Type.STRING },
            brand: { type: Type.STRING },
            model: { type: Type.STRING },
            price_eur: { type: Type.INTEGER },
            size: { type: Type.STRING },
            components: { type: Type.STRING },
            year: { type: Type.INTEGER },
            url_index: { type: Type.INTEGER }
        },
        required: ["is_target", "is_tier_one_plus", "reason", "brand", "model", "price_eur", "size", "components", "url_index"]
    }
};

const SYSTEM_PROMPT = `
You are an expert bicycle data evaluator for high-end used bikes.
Evaluate the list of Canyon listings and identify targets based on these strict rules.

--- CRITERIA ---
- Brand: Canyon ONLY.
- Model: Endurace or Ultimate ONLY.
- Size: S ONLY.

- Tier 1+ (Top Priority / "Bara-iro" Goal):
  - Ultimate (>=2023) or Endurace (>=2024), Grade: CF SLX or CFR.
  - Fully internal routing (Integrated cockpit like CP0018).
  - Wireless SRAM (Force, Rival, Red eTap AXS) is a massive plus.

- Budgets (Hard Limits):
  SRAM Force eTap AXS: <= 4500 EUR
  Shimano Ultegra Di2: <= 4000 EUR
  SRAM Rival eTap AXS: <= 3500 EUR
  Shimano 105 Di2: <= 3000 EUR

- EXCLUSIONS:
  - Mechanical shifting (unless Tier 1+ frameset).
  - Integrated cockpits with NO cable slack/adjustability (if obvious from text).

--- OUTPUT ---
Return a JSON array of is_target: true items. Be strict.
`;

async function main() {
    console.log(`Navigating to Buycycle...`);
    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({
        userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        viewport: { width: 1280, height: 800 }
    });
    const page = await context.newPage();

    try {
        await page.goto(TARGET_URL, { waitUntil: "domcontentloaded", timeout: 30000 });
        try {
            const cookieAcceptBtn = page.locator('#CybotCookiebotDialogBodyLevelButtonLevelOptinAllowAll');
            await cookieAcceptBtn.waitFor({ state: "visible", timeout: 3000 });
            await cookieAcceptBtn.click();
        } catch (e) { }
        await page.waitForTimeout(5000);

        const productData = await page.$$eval('a[href*="/product/"]', anchors => {
            return anchors.map(a => ({
                url: a.href,
                text: (a as HTMLElement).innerText
            })).filter(item => item.text && item.text.includes("Canyon"));
        });

        const uniqueProducts = Array.from(new Map(productData.map(item => [item.url, item])).values());
        const newProducts = uniqueProducts.filter(p => !notifiedUrls.includes(p.url));

        console.log(`Detected ${uniqueProducts.length} Canyon bikes. processing ${newProducts.length} candidates.`);

        if (newProducts.length > 0) {
            const combinedText = newProducts.map((p, i) => `[ID: ${i}] URL: ${p.url}\n${p.text}`).join("\n\n---\n\n");

            console.log("Requesting premium evaluation from Gemini...");
            const result = await ai.models.generateContent({
                model: "gemini-2.5-flash",
                contents: SYSTEM_PROMPT + "\n\n" + combinedText,
                config: {
                    responseMimeType: "application/json",
                    responseSchema: bikeSchema,
                    temperature: 0.1,
                }
            });

            const rawTargets = JSON.parse(result.text || "[]");
            const targetDetails = rawTargets.map((t: any) => ({
                ...t,
                url: newProducts[t.url_index]?.url
            })).filter((t: any) => t.is_target && t.url);

            console.log(`Found ${targetDetails.length} target bikes.`);

            if (targetDetails.length > 0) {
                sendSummaryEmail(targetDetails);
            }

            // Persistence
            newProducts.forEach(p => notifiedUrls.push(p.url));
            saveState();
        }

    } catch (error) {
        console.error("Workflow error:", error);
    } finally {
        await browser.close();
    }
    console.log("Execution Finished.");
}

main().catch(console.error);
