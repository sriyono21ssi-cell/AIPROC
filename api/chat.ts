import { GoogleGenAI } from "@google/genai";
import type { Vendor, PricedItem, ComparisonProject, Message } from '../src/types';

const API_KEY = process.env.GEMINI_API_KEY;

if (!API_KEY) {
  throw new Error("GEMINI_API_KEY environment variable is not set");
}

const ai = new GoogleGenAI({ apiKey: API_KEY });
const model = ai.models['gemini-2.5-flash']; // Using a specific model instance

const SYSTEM_INSTRUCTION = `Anda adalah AI Proc, asisten pengadaan yang ramah, ringan, dan sopan. Gaya bahasa Anda kasual namun tetap sopan. Gunakan emoji agar percakapan lebih menarik (misal: 👋, 👍, 💡, 📊). Tugas utama Anda adalah membantu pengguna mengelola data pengadaan mereka secara efisien. Anda dapat bertindak atas nama pengguna untuk memasukkan data.

TUGAS UTAMA:
1.  **Menjawab Pertanyaan**: Jawab pertanyaan pengguna secara detail berdasarkan data yang diberikan. Anda bisa mengakses data vendor, data harga (termasuk riwayat harga), dan proyek perbandingan.
2.  **Input Data**: Bantu pengguna memasukkan data baru. Jika pengguna memberikan informasi yang tidak lengkap, Anda WAJIB bertanya untuk melengkapi data yang kurang sebelum melakukan tindakan.
3.  **Format Respons**:
    *   Untuk percakapan biasa atau permintaan informasi (seperti riwayat harga), jawablah dalam format teks biasa yang komunikatif.
    *   Ketika Anda memiliki data yang CUKUP untuk melakukan tindakan (menambah/memperbarui data), jawab HANYA dengan objek JSON yang valid. Jangan tambahkan teks atau markdown lain.

TINDAKAN JSON YANG DIDUKUNG: "ADD_VENDOR", "ADD_PRICED_ITEM", "UPDATE_ITEM_PRICE", "ADD_PROJECT", "ADD_VENDOR_TO_PROJECT".
Selalu pastikan Anda memiliki informasi yang cukup sebelum mengirimkan JSON.`;

export default async function handler(request: Request) {
    if (request.method !== 'POST') {
        return new Response('Method Not Allowed', { status: 405 });
    }

    try {
        const { history, userInput, contextData } = await request.json();
        const { vendors, pricedItems, projects } = contextData as { vendors: Vendor[], pricedItems: PricedItem[], projects: ComparisonProject[] };

        const vendorContext = `Data Vendor Saat Ini:\n${JSON.stringify(vendors.map(v => ({id: v.id, name: v.name, category: v.category, status: v.status})))}`;
        const pricingContext = `Data Harga Barang Saat Ini:\n${JSON.stringify(pricedItems.map(p => ({id: p.id, name: p.name, lastPrice: p.lastPrice, lastVendorName: p.lastVendorName, history: p.history})))}`;
        const projectContext = `Data Proyek Perbandingan Saat Ini:\n${JSON.stringify(projects.map(p => ({id: p.id, name: p.name, description: p.description})))}`;
        
        const fullPrompt = `Berikut adalah data yang relevan untuk membantumu menjawab pertanyaan:\n\n${vendorContext}\n\n${pricingContext}\n\n${projectContext}\n\n---\n\nPertanyaan User: ${userInput}`;

        // Reconstruct history for the model
        const contents = history.map((msg: Message) => ({
            role: msg.sender === 'user' ? 'user' : 'model',
            parts: msg.text,
        }));
        contents.push({ role: 'user', parts: fullPrompt });

        const response = await model.generateContent({
            contents,
            config: {
                systemInstruction: SYSTEM_INSTRUCTION,
            }
        });

        return new Response(JSON.stringify({ text: response.text }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
        });

    } catch (error) {
        console.error('Error in chat API:', error);
        return new Response('Internal Server Error', { status: 500 });
    }
}

export const config = {
  runtime: 'edge',
};
