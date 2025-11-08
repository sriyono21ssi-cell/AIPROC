import { GoogleGenAI } from "@google/genai";

const API_KEY = process.env.GEMINI_API_KEY;

if (!API_KEY) {
  throw new Error("GEMINI_API_KEY environment variable is not set");
}

const ai = new GoogleGenAI({ apiKey: API_KEY });

const extractJsonObjectFromString = (str: string): any | null => {
    const markdownMatch = str.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
    const textToParse = markdownMatch ? markdownMatch[1].trim() : str.trim();
    const firstBracket = textToParse.indexOf('[');
    const lastBracket = textToParse.lastIndexOf(']');
    if (firstBracket !== -1 && lastBracket !== -1) {
        try { return JSON.parse(textToParse.substring(firstBracket, lastBracket + 1)); } catch (e) {
             console.error("Failed to parse JSON array from response", e);
        }
    }
    return null;
};

export default async function handler(request: Request) {
    if (request.method !== 'POST') {
        return new Response('Method Not Allowed', { status: 405 });
    }
    
    try {
        const { query, locationText, coordinates } = await request.json();

        const locationQuery = coordinates 
            ? `di sekitar lokasi saya saat ini (latitude: ${coordinates.latitude}, longitude: ${coordinates.longitude})`
            : (locationText ? `di ${locationText}` : 'di Indonesia');

        const prompt = `Sebagai ahli pengadaan, carikan hingga 10 vendor/supplier teratas untuk produk/layanan "${query}" di wilayah ${locationQuery}. Gunakan Google Search untuk menemukan vendor yang relevan dan Google Maps untuk mendapatkan detail lokasi, rating, ulasan, dan tautan langsung. Berikan jawaban HANYA dalam format array JSON yang valid, tanpa teks pembuka, penutup, atau markdown backticks (\`\`\`). Setiap objek JSON dalam array harus memiliki properti berikut: "name" (string), "address" (string), "phone" (string, isi "N/A" jika tidak ditemukan), "website" (string, isi "N/A" jika tidak ditemukan), "rating" (number, rating dari Google Maps, isi 0 jika tidak ada), "reviewCount" (number, jumlah ulasan dari Google Maps, isi 0 jika tidak ada), "mapsUrl" (string, tautan langsung ke lokasi vendor di Google Maps, contoh: 'https://maps.app.goo.gl/...' atau 'https://www.google.com/maps?cid=...', isi "N/A" jika tidak ditemukan), dan "description" (string, ringkasan singkat 1-2 kalimat mengapa vendor ini relevan). Pastikan deskripsi singkat ditulis dalam Bahasa Indonesia. Pastikan semua data yang diambil dari Google Maps (rating, ulasan, alamat, tautan maps) adalah data yang sebenarnya dan real.`;
        
        const toolConfig: any = {};
        if (coordinates) {
          toolConfig.retrievalConfig = {
            latLng: {
              latitude: coordinates.latitude,
              longitude: coordinates.longitude,
            },
          };
        }

        const response = await ai.models.generateContent({
          model: "gemini-2.5-flash",
          contents: prompt,
          config: {
            tools: [{googleSearch: {}}, {googleMaps: {}}],
            toolConfig: toolConfig,
          },
        });

        const jsonResult = extractJsonObjectFromString(response.text);

        const results = (jsonResult && Array.isArray(jsonResult)) ? jsonResult.filter(r => r.name && r.address && r.description).map(r => ({
            name: r.name || 'Nama tidak tersedia',
            address: r.address || 'Alamat tidak tersedia',
            phone: r.phone || 'N/A',
            website: r.website || 'N/A',
            description: r.description || 'Deskripsi tidak tersedia',
            rating: typeof r.rating === 'number' ? r.rating : 0,
            reviewCount: typeof r.reviewCount === 'number' ? r.reviewCount : 0,
            mapsUrl: r.mapsUrl || 'N/A',
        })) : [];

        return new Response(JSON.stringify(results), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
        });

    } catch (error) {
        console.error('Error in search API:', error);
        return new Response('Internal Server Error', { status: 500 });
    }
}

export const config = {
  runtime: 'edge',
};
