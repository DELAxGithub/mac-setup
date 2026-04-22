import { execFileSync } from "child_process";
import * as fs from "fs";

const CLAUDE_MODEL = "claude-sonnet-4-6";

const OUTPUT_SCHEMA = `Return a JSON ARRAY where each element is:
{
  "is_target": boolean,   // true only if it matches ALL criteria
  "reason": string,
  "title": string,        // e.g. "Canyon Endurace CF 8 2022"
  "price_eur": integer,
  "size": string,
  "year": integer,        // or null if unknown
  "components": string    // e.g. "Shimano Ultegra"
}
Output ONLY the JSON array. No markdown fences, no prose.`;

async function main() {
    console.log("Reading buycycle_extracted_text.txt...");
    const text = fs.readFileSync("buycycle_extracted_text.txt", "utf-8");

    const prompt = `
You are an expert bicycle data extractor.
Extract all bicycles listed in the provided text.
Determine if each bike is a target for purchase based on the following criteria:
- Brand: Canyon
- Model: Endurace or Ultimate (Road bikes)
- Size: S
- Price: Strictly under 5000 EUR

${OUTPUT_SCHEMA}

Text:
${text}
`;

    console.log(`Calling Claude (${CLAUDE_MODEL}) to extract and analyze bikes...`);
    const raw = execFileSync('claude', [
        '-p',
        '--output-format', 'json',
        '--model', CLAUDE_MODEL,
        prompt,
    ], { encoding: 'utf-8', maxBuffer: 32 * 1024 * 1024 });

    const wrapped = JSON.parse(raw);
    if (wrapped.is_error) {
        throw new Error(`claude error: ${wrapped.api_error_status || 'unknown'}`);
    }
    const resultText = (wrapped.result ?? '').trim();
    const cleaned = resultText.replace(/^```(?:json)?\s*/, '').replace(/\s*```$/, '').trim();

    console.log("=== CLAUDE RESPONSE (cleaned) ===");
    console.log(cleaned);
    console.log("=== PARSED ===");
    const parsed = JSON.parse(cleaned);
    console.log(`items: ${parsed.length}, targets: ${parsed.filter((b: any) => b.is_target).length}`);
    console.log(`duration: ${wrapped.duration_ms}ms`);
}

main().catch(console.error);
