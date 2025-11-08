
import { GoogleGenAI, Chat } from "@google/genai";
// FIX: Import missing Tender-related types
import type { Vendor, SearchResult, PricedItem, Tender, Bid, BidDetail, BidScore, ComparisonProject } from '../types';

const API_KEY = process.env.GEMINI_API_KEY;

if (!API_KEY) {
  throw new Error("GEMINI_API_KEY environment variable is not set");
}

const ai = new GoogleGenAI({ apiKey: API_KEY });

// Helper to extract JSON object from a string that might contain markdown or other text
const extractJsonObjectFromString = (str: string): any | null => {
    // First, try to find a JSON string within markdown ```json ... ``` or ``` ... ```
    const markdownMatch = str.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
    const textToParse = markdownMatch ? markdownMatch[1].trim() : str.trim();

    // The prompt asks for an array, so we look for it first.
    // Find the first '[' and the last ']'
    const firstBracket = textToParse.indexOf('[');
    const lastBracket = textToParse.lastIndexOf(']');

    if (firstBracket !== -1 && lastBracket !== -1 && lastBracket > firstBracket) {
        const jsonStr = textToParse.substring(firstBracket, lastBracket + 1);
        try {
            return JSON.parse(jsonStr);
        } catch (e) {
            console.error("Failed to parse extracted JSON array:", e);
            // Fallthrough to try object if array fails, just in case
        }
    }

    // Fallback: if no array is found, try to find a JSON object.
    const firstBrace = textToParse.indexOf('{');
    const lastBrace = textToParse.lastIndexOf('}');

    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
        const jsonStr = textToParse.substring(firstBrace, lastBrace + 1);
        try {
            return JSON.parse(jsonStr);
        } catch (e) {
            console.error("Failed to parse extracted JSON object:", e);
        }
    }

    console.error("No valid JSON object or array found in the string.", { originalString: str });
    return null;
};


export const analyzeDashboardData = async (vendors: Vendor[], pricedItems: PricedItem[]): Promise<string> => {
  try {
    const prompt = `Analisis data pengadaan berikut yang berisi data kinerja vendor dan data harga barang dalam Bahasa Indonesia. Berikan jawaban yang singkat dan to the point dengan struktur di bawah. Jangan tambahkan teks pembuka atau penutup.

Analisa Harga Umum:
[Ringkasan singkat tentang kondisi harga secara keseluruhan dalam 1-2 kalimat. Sebutkan jika ada tren umum naik atau turun.]

Analisa Tren Harga & Vendor:
[Analisa singkat barang dengan tren harga naik/turun yang signifikan. Jika relevan, hubungkan tren harga dengan kinerja vendor. Contoh: "Harga Tepung Terigu naik, namun vendornya (Sumber Bahan Baku) memiliki rating yang baik. Pertimbangkan negosiasi." dalam 1-2 kalimat]

Rekomendasi Utama:
[Satu atau dua rekomendasi konkret yang bisa ditindaklanjuti berdasarkan gabungan data vendor dan harga].

Data Vendor: ${JSON.stringify(vendors.map(v => ({ name: v.name, rating: v.rating, trend: v.performanceTrend, category: v.category })))}
Data Harga: ${JSON.stringify(pricedItems.map(p => ({ name: p.name, lastPrice: p.lastPrice, priceTrend: p.priceTrend, lastVendorName: p.lastVendorName })))}`;
    
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-pro',
      contents: prompt,
    });
    
    return response.text;
  } catch (error) {
    console.error("Error analyzing dashboard data:", error);
    return "Maaf, terjadi kesalahan saat menganalisis data. Silakan coba lagi.";
  }
};

export const analyzeSingleVendor = async (vendor: Vendor): Promise<string> => {
    try {
        const prompt = `Provide a very short, one-sentence insight about this vendor based on their latest data. Vendor: ${JSON.stringify({ name: vendor.name, rating: vendor.rating, trend: vendor.performanceTrend, recent_comment: vendor.evaluations[vendor.evaluations.length -1]?.comment })}`;

        const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: prompt,
        });

        return response.text;
    } catch (error) {
        console.error("Error analyzing vendor data:", error);
        return "Gagal mendapatkan insight."
    }
}

export const searchVendors = async (query: string, locationText: string, coordinates?: GeolocationCoordinates): Promise<SearchResult[]> => {
  try {
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

    if (jsonResult && Array.isArray(jsonResult)) {
        return jsonResult.filter(r => r.name && r.address && r.description).map(r => ({
            name: r.name || 'Nama tidak tersedia',
            address: r.address || 'Alamat tidak tersedia',
            phone: r.phone || 'N/A',
            website: r.website || 'N/A',
            description: r.description || 'Deskripsi tidak tersedia',
            rating: typeof r.rating === 'number' ? r.rating : 0,
            reviewCount: typeof r.reviewCount === 'number' ? r.reviewCount : 0,
            mapsUrl: r.mapsUrl || 'N/A',
        }));
    }

    console.warn("Could not parse valid JSON from model response.");
    return [];

  } catch (error) {
    console.error("Error searching vendors:", error);
    return [];
  }
};

export const createChatSession = (): Chat => {
    return ai.chats.create({
        model: 'gemini-2.5-flash',
        config: {
            systemInstruction: `Anda adalah AI Proc, asisten pengadaan yang ramah, ringan, dan sopan. Gaya bahasa Anda kasual namun tetap sopan. Gunakan emoji agar percakapan lebih menarik (misal: 👋, 👍, 💡, 📊). Tugas utama Anda adalah membantu pengguna mengelola data pengadaan mereka secara efisien. Anda dapat bertindak atas nama pengguna untuk memasukkan data.

TUGAS UTAMA:
1.  **Menjawab Pertanyaan**: Jawab pertanyaan pengguna secara detail berdasarkan data yang diberikan. Anda bisa mengakses data vendor, data harga (termasuk riwayat harga), dan proyek perbandingan. Contoh pertanyaan yang bisa Anda jawab:
    - "Siapa vendor terbaik untuk kategori Packaging?"
    - "Bagaimana tren kinerja PT Sejuk Abadi?"
    - "Tolong berikan riwayat harga untuk Karton Box."
    - "Berapa harga terakhir Tepung Terigu dan siapa vendornya?"
    - "Tampilkan semua data tentang vendor CV Logistik Cepat"

2.  **Input Data**: Bantu pengguna memasukkan data baru. Jika pengguna memberikan informasi yang tidak lengkap, Anda WAJIB bertanya untuk melengkapi data yang kurang sebelum melakukan tindakan.
3.  **Format Respons**:
    *   Untuk percakapan biasa atau permintaan informasi (seperti riwayat harga), jawablah dalam format teks biasa yang komunikatif.
    *   Ketika Anda memiliki data yang CUKUP untuk melakukan tindakan (menambah/memperbarui data), jawab HANYA dengan objek JSON yang valid. Jangan tambahkan teks atau markdown lain.

CONTOH INTERAKSI:
- **Riwayat Harga (Teks Biasa)**:
  User: "Berikan riwayat harga item karton box?"
  Anda: "Siap, riwayat harga nya sebagai berikut:\nharga terakhir 2.600 update 28 oct 2025,\nharga sebelumnya 2.500 update 7 Juli 2025,\ncukup itu saja, atau mau saya tampilkan harga sebelumnya juga?"

- **Input Data (Meminta Info Tambahan)**:
  User: "tolong tambahkan vendor baru PT Maju Jaya"
  Anda: "Tentu! 👍 Boleh minta info tambahan untuk PT Maju Jaya? Saya butuh nomor telepon, alamat, kategori, dan produk utamanya."

- **Input Data (Format JSON)**:
  User: "vendornya PT Maju Jaya, telpon 021-12345, alamat Jl. Sudirman No 1, kategori Packaging, produknya Kardus"
  Anda: \`\`\`json
  {
    "action": "ADD_VENDOR",
    "data": {
      "name": "PT Maju Jaya",
      "phone": "021-12345",
      "address": "Jl. Sudirman No 1",
      "category": "Packaging",
      "produk": "Kardus",
      "status": "Aktif"
    }
  }
  \`\`\`

TINDAKAN JSON YANG DIDUKUNG:

1.  **ADD_VENDOR**: Menambah vendor baru.
    - Data yang dibutuhkan: \`name\`, \`phone\`, \`address\`, \`category\`, \`produk\`. Status default ke 'Aktif'.
    - Format: \`{ "action": "ADD_VENDOR", "data": { ... } }\`

2.  **ADD_PRICED_ITEM**: Menambah barang baru di daftar harga.
    - Data yang dibutuhkan: \`name\`, \`category\`, \`initialPrice\`, \`vendorName\` (untuk mencari vendorId).
    - Format: \`{ "action": "ADD_PRICED_ITEM", "data": { ... } }\`

3.  **UPDATE_ITEM_PRICE**: Memperbarui harga barang.
    - Data yang dibutuhkan: \`itemName\`, \`newPrice\`, \`vendorName\`.
    - Format: \`{ "action": "UPDATE_ITEM_PRICE", "data": { ... } }\`
    
4.  **ADD_PROJECT**: Menambah proyek perbandingan baru.
    - Data yang dibutuhkan: \`name\`, \`description\`, \`deadline\`. Bobot default akan digunakan.
    - Format: \`{ "action": "ADD_PROJECT", "data": { ... } }\`

5.  **ADD_VENDOR_TO_PROJECT**: Menambah vendor ke proyek perbandingan.
    - Data yang dibutuhkan: \`projectName\`, \`vendorName\`, \`price\`, \`leadTime\`, \`warranty\`, \`paymentTerms\`.
    - Format: \`{ "action": "ADD_VENDOR_TO_PROJECT", "data": { ... } }\`

Selalu pastikan Anda memiliki informasi yang cukup sebelum mengirimkan JSON.`,
        }
    });
}

// FIX: Add missing generateBidScores function
export const generateBidScores = async (
  tender: Tender,
  newBid: { vendor: Vendor; details: BidDetail[] },
  existingBids: Bid[]
): Promise<BidScore[]> => {
  try {
    const criteriaMap = new Map(tender.criteria.map(c => [c.id, c.name]));
    
    const newBidDetailsFormatted = newBid.details
      .map(d => `- ${criteriaMap.get(d.criterionId) || 'Unknown Criterion'}: ${d.value}`)
      .join('\n');
      
    const existingBidsFormatted = existingBids.map(bid => {
        const details = bid.details.map(d => `- ${criteriaMap.get(d.criterionId) || 'Unknown Criterion'}: ${d.value}`).join('\n');
        return `Vendor: ${bid.vendorName}\nSkor yang sudah ada: ${JSON.stringify(bid.scores)}\nDetail:\n${details}`;
    }).join('\n\n');

    const prompt = `
Sebagai seorang manajer pengadaan ahli, tugas Anda adalah memberikan penilaian objektif untuk penawaran (bid) baru dalam sebuah tender.
Berikan skor dari 0 (sangat buruk) hingga 10 (sangat baik) untuk SETIAP kriteria penilaian. Jawaban HARUS HANYA dalam format array JSON yang valid, tanpa teks atau markdown tambahan.

Format JSON yang Diharapkan:
[
  { "criterionId": "ID_Kriteria_1", "score": Angka_Skor_1 },
  { "criterionId": "ID_Kriteria_2", "score": Angka_Skor_2 },
  ...
]

---
DETAIL TENDER
Nama Tender: ${tender.name}
Deskripsi: ${tender.description}

KRITERIA PENILAIAN & BOBOT:
${tender.criteria.map(c => `- ID: ${c.id}, Nama: ${c.name}, Bobot: ${c.weight}%`).join('\n')}
Catatan: Untuk Harga, skor lebih tinggi berarti harga lebih baik (lebih rendah). Untuk Waktu Pengiriman, skor lebih tinggi berarti waktu lebih baik (lebih cepat).

---
PENAWARAN (BID) BARU YANG PERLU DINILAI
Vendor: ${newBid.vendor.name} (Rating: ${newBid.vendor.rating}/5, Tren Kinerja: ${newBid.vendor.performanceTrend})
Detail Penawaran:
${newBidDetailsFormatted}

---
PENAWARAN LAIN YANG SUDAH ADA (SEBAGAI PEMBANDING)
${existingBids.length > 0 ? existingBidsFormatted : 'Belum ada penawaran lain.'}

---
TUGAS ANDA:
Analisis penawaran baru dengan mempertimbangkan semua kriteria, reputasi vendor, dan data pembanding dari penawaran lain (jika ada). Berikan skor untuk setiap kriteria untuk vendor "${newBid.vendor.name}". Pastikan untuk memberikan skor untuk kriteria reputasi vendor berdasarkan data rating dan tren kinerja yang diberikan.
Kembalikan HANYA array JSON dengan skor tersebut.
`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-pro',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      }
    });

    const jsonResult = extractJsonObjectFromString(response.text);

    if (jsonResult && Array.isArray(jsonResult)) {
      // Validate that the result matches the BidScore[] structure
      const validScores = jsonResult.filter(s => s.criterionId && typeof s.score === 'number');
      if (validScores.length > 0) { // Check if at least one score is returned
          return validScores;
      }
    }
    
    console.warn("Could not parse valid JSON scores from model response or score count mismatch.");
    return [];

  } catch (error) {
    console.error("Error generating bid scores:", error);
    return [];
  }
};