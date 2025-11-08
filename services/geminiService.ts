import type { Vendor, SearchResult, PricedItem, Tender, Bid, BidDetail, BidScore, Message, ComparisonProject } from 'types';

// This service is now a client-side wrapper for our secure backend APIs.

export const analyzeDashboardData = async (vendors: Vendor[], pricedItems: PricedItem[]): Promise<string> => {
  try {
    const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'dashboard', data: { vendors, pricedItems } }),
    });
    if (!response.ok) throw new Error('Failed to analyze dashboard data.');
    const result = await response.json();
    return result.text;
  } catch (error) {
    console.error("Error analyzing dashboard data:", error);
    return "Maaf, terjadi kesalahan saat menganalisis data. Silakan coba lagi.";
  }
};

export const analyzeSingleVendor = async (vendor: Vendor): Promise<string> => {
    try {
        const response = await fetch('/api/analyze', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ type: 'vendor', data: { vendor } }),
        });
        if (!response.ok) throw new Error('Failed to analyze vendor.');
        const result = await response.json();
        return result.text;
    } catch (error) {
        console.error("Error analyzing vendor data:", error);
        return "Gagal mendapatkan insight."
    }
}

export const searchVendors = async (query: string, locationText: string, coordinates?: GeolocationCoordinates): Promise<SearchResult[]> => {
  try {
    const response = await fetch('/api/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, locationText, coordinates }),
    });
    if (!response.ok) throw new Error('Vendor search failed.');
    return await response.json();
  } catch (error) {
    console.error("Error searching vendors:", error);
    return [];
  }
};

export const getChatResponse = async (
    history: Message[], 
    userInput: string,
    contextData: { vendors: Vendor[], pricedItems: PricedItem[], projects: ComparisonProject[] }
): Promise<string> => {
    try {
        const response = await fetch('/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ history, userInput, contextData }),
        });
        if (!response.ok) throw new Error('Failed to get chat response.');
        const result = await response.json();
        return result.text;
    } catch (error) {
        console.error("Chat API error:", error);
        return "Aduh, maaf, koneksi saya lagi kurang baik nih. Bisa coba tanya lagi nanti? 🙏";
    }
}


export const generateBidScores = async (
  tender: Tender,
  newBid: { vendor: Vendor; details: BidDetail[] },
  existingBids: Bid[]
): Promise<BidScore[]> => {
  try {
     const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'score_bids', data: { tender, newBid, existingBids } }),
    });
    if (!response.ok) throw new Error('Failed to generate bid scores.');
    return await response.json();
  } catch (error) {
    console.error("Error generating bid scores:", error);
    return [];
  }
};