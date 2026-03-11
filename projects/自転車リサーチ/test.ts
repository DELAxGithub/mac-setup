import { GoogleGenAI, Type, Schema } from "@google/genai";
import * as fs from "fs";
import * as dotenv from "dotenv";

dotenv.config();

const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
    console.error("GEMINI_API_KEY is missing in .env");
    process.exit(1);
}

const ai = new GoogleGenAI({ apiKey });

const bikeSchema: Schema = {
    type: Type.ARRAY,
    description: "List of bicycles extracted from the text.",
    items: {
        type: Type.OBJECT,
        properties: {
            is_target: {
                type: Type.BOOLEAN,
                description: "True if it matches ALL criteria: Road bike (Endurace or Ultimate models), Size S, Price strictly under 5000 EUR."
            },
            reason: {
                type: Type.STRING,
                description: "Reasoning for the is_target classification."
            },
            title: { type: Type.STRING, description: "Name/Model of the bike, e.g. 'Canyon Endurace CF 8 2022'" },
            price_eur: { type: Type.INTEGER, description: "Price in EUR" },
            size: { type: Type.STRING, description: "Frame size" },
            year: { type: Type.INTEGER, description: "Model year" },
            components: { type: Type.STRING, description: "Component group, e.g. 'Shimano Ultegra'" }
        },
        required: ["is_target", "reason", "title", "price_eur", "size"]
    }
};

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

Text:
${text}
`;

    console.log("Calling Gemini to extract and analyze bikes...");
    const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: bikeSchema,
            temperature: 0.1,
        }
    });

    console.log("=== GEMINI RESPONSE ===");
    console.log(response.text);
}

main().catch(console.error);
