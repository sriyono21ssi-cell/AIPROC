import { GoogleGenAI } from "@google/genai";
import type { Vendor, PricedItem, Tender, Bid, BidDetail } from '../types';

// This is a Vercel serverless function, so process.env is secure.
const API_KEY = process.env.GEMINI_API_KEY;

if (!API_KEY) {
  throw new Error("GEMINI_API_KEY environment variable is not set");
}

const ai = new GoogleGenAI({ apiKey: API_KEY });

// Helper to extract JSON from a string
const extractJsonObjectFromString = (str: string): any | null => {
    const markdownMatch = str.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
    const textToParse = markdownMatch ? markdownMatch[1].trim() : str.trim();
    const firstBracket = textToParse.indexOf('[');
    const lastBracket = textToParse.lastIndexOf(']');
    if (firstBracket !== -1 && lastBracket !== -1) {
        try { return JSON.parse(textToParse.substring(firstBracket, lastBracket + 1)); } catch (e) {}
    }
    const firstBrace = textToParse.indexOf('{');
    const lastBrace = textToParse.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace !== -1) {
        try { return JSON.parse(textToParse.substring(firstBrace, lastBrace + 1)); } catch (e) {}
    }
    return null;
};

// All functions from the original service are now handled here, on the server.

const analyzeDashboardData = async (vendors: Vendor[], pricedItems: PricedItem[]): Promise<string> => {
  const prompt = `Analisis data pengadaan berikut yang berisi data kinerja vendor dan data harga barang dalam Bahasa Indonesia. Berikan jawaban yang singkat dan to the point dengan struktur di bawah. Jangan tambahkan teks pembuka atau penutup.

Analisa Harga Umum:
[Ringkasan singkat tentang kondisi harga secara keseluruhan dalam 1-2 kalimat. Sebutkan jika ada tren umum naik atau turun.]

Analisa Tren Harga & Vendor:
[Analisa singkat barang dengan tren harga naik/turun yang signifikan. Jika relevan, hubungkan tren harga dengan kinerja vendor. Contoh: "Harga Tepung Terigu naik, namun vendornya (Sumber Bahan Baku) memiliki rating yang baik. Pertimbangkan negosiasi." dalam 1-2 kalimat]

Rekomendasi Utama:
[Satu atau dua rekomendasi konkret yang bisa ditindaklanjuti berdasarkan gabungan data vendor dan harga].

Data Vendor: ${JSON.stringify(vendors.map(v => ({ name: v.name, rating: v.rating, trend: v.performanceTrend, category: v.category })))}
Data Harga: ${JSON.stringify(pricedItems.map(p => ({ name: p.name, lastPrice: p.lastPrice, priceTrend: p.priceTrend, lastVendorName: p.lastVendorName })))}`;
    
    const response = await ai.models.generateContent({ model: 'gemini-2.5-pro', contents: prompt });
    return response.text;
};

const analyzeSingleVendor = async (vendor: Vendor): Promise<string> => {
    const prompt = `Provide a very short, one-sentence insight about this vendor based on their latest data. Vendor: ${JSON.stringify({ name: vendor.name, rating: vendor.rating, trend: vendor.performanceTrend, recent_comment: vendor.evaluations[vendor.evaluations.length -1]?.comment })}`;
    const response = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: prompt });
    return response.text;
};

const generateBidScores = async (tender: Tender, newBid: { vendor: Vendor; details: BidDetail[] }, existingBids: Bid[]) => {
    const criteriaMap = new Map(tender.criteria.map(c => [c.id, c.name]));
    const newBidDetailsFormatted = newBid.details.map(d => `- ${criteriaMap.get(d.criterionId) || 'Unknown Criterion'}: ${d.value}`).join('\n');
    const existingBidsFormatted = existingBids.map(bid => `Vendor: ${bid.vendorName}\nSkor yang sudah ada: ${JSON.stringify(bid.scores)}\nDetail:\n${bid.details.map(d => `- ${criteriaMap.get(d.criterionId) || 'Unknown Criterion'}: ${d.value}`).join('\n')}`).join('\n\n');

    const prompt = `
Sebagai seorang manajer pengadaan ahli, tugas Anda adalah memberikan penilaian objektif untuk penawaran (bid) baru dalam sebuah tender.
Berikan skor dari 0 (sangat buruk) hingga 10 (sangat baik) untuk SETIAP kriteria penilaian. Jawaban HARUS HANYA dalam format array JSON yang valid, tanpa teks atau markdown tambahan.
Format JSON: [ { "criterionId": "ID_Kriteria_1", "score": Angka_Skor_1 }, ... ]
---
DETAIL TENDER: ${tender.name} (${tender.description})
KRITERIA PENILAIAN & BOBOT: ${tender.criteria.map(c => `- ID: ${c.id}, Nama: ${c.name}, Bobot: ${c.weight}%`).join('\n')}
Catatan: Untuk Harga, skor lebih tinggi berarti harga lebih baik (lebih rendah). Untuk Waktu Pengiriman, skor lebih tinggi berarti waktu lebih baik (lebih cepat).
---
PENAWARAN BARU: Vendor: ${newBid.vendor.name} (Rating: ${newBid.vendor.rating}/5, Tren Kinerja: ${newBid.vendor.performanceTrend}). Detail: ${newBidDetailsFormatted}
---
PENAWARAN PEMBANDING: ${existingBids.length > 0 ? existingBidsFormatted : 'Belum ada penawaran lain.'}
---
TUGAS: Analisis penawaran baru, berikan skor untuk setiap kriteria untuk vendor "${newBid.vendor.name}". Kembalikan HANYA array JSON dengan skor tersebut.`;

    const response = await ai.models.generateContent({ model: 'gemini-2.5-pro', contents: prompt, config: { responseMimeType: 'application/json' }});
    const jsonResult = extractJsonObjectFromString(response.text);
    return (jsonResult && Array.isArray(jsonResult)) ? jsonResult : [];
};

export default async function handler(request: Request) {
    if (request.method !== 'POST') {
        return new Response('Method Not Allowed', { status: 405 });
    }
    try {
        const { type, data } = await request.json();
        let result;

        switch (type) {
            case 'dashboard':
                result = await analyzeDashboardData(data.vendors, data.pricedItems);
                return new Response(JSON.stringify({ text: result }), { status: 200, headers: { 'Content-Type': 'application/json' } });
            case 'vendor':
                result = await analyzeSingleVendor(data.vendor);
                return new Response(JSON.stringify({ text: result }), { status: 200, headers: { 'Content-Type': 'application/json' } });
            case 'score_bids':
                result = await generateBidScores(data.tender, data.newBid, data.existingBids);
                return new Response(JSON.stringify(result), { status: 200, headers: { 'Content-Type': 'application/json' } });
            default:
                return new Response('Invalid analysis type', { status: 400 });
        }
    } catch (error) {
        console.error('Error in analysis API:', error);
        return new Response('Internal Server Error', { status: 500 });
    }
}

export const config = {
  runtime: 'edge',
};