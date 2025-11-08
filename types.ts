
export type View = 'dashboard' | 'vendors' | 'search' | 'chat' | 'pricing' | 'comparison';

export interface Vendor {
  id: string;
  name: string;
  phone: string;
  email: string;
  address: string;
  category: string;
  produk: string;
  rating: number;
  reviewCount: number;
  status: 'Aktif' | 'Nonaktif' | 'Blacklist';
  lastEvaluated: string;
  performanceTrend: 'up' | 'down' | 'stable';
  evaluations: Evaluation[];
}

export interface Evaluation {
  date: string;
  quality: number;
  price: number;
  delivery: number;
  communication: number;
  comment?: string;
}

export interface NewVendor {
  name: string;
  phone: string;
  email?: string;
  address: string;
  category: string;
  produk: string;
  status: 'Aktif' | 'Nonaktif' | 'Blacklist';
}

export interface SearchResult {
    name: string;
    description: string;
    website: string;
    phone: string;
    address: string;
    rating: number;
    reviewCount: number;
    mapsUrl: string;
}

// FIX: Add missing GoogleSheetSettings type
export interface GoogleSheetSettings {
    vendorSheetUrl: string;
    pricingSheetUrl: string;
}

// Chat Feature Types
export interface Message {
  sender: 'user' | 'ai';
  text: string;
}

// Pricing Feature Types
export interface PriceHistory {
  date: string;
  price: number;
  vendorId: string;
  vendorName: string;
}

export interface PricedItem {
  id: string;
  name: string;
  category: string;
  status: 'Aktif' | 'Nonaktif';
  lastPrice: number;
  lastVendorId: string;
  lastVendorName: string;
  lastUpdate: string;
  priceTrend: 'up' | 'down' | 'stable';
  history: PriceHistory[];
}

export interface NewPricedItem {
    name: string;
    category: string;
    status: 'Aktif' | 'Nonaktif';
    initialPrice: number;
    vendorId: string;
}

// Vendor Comparison Types
export interface Weights {
  price: number;          // Bobot untuk harga
  leadTime: number;       // Bobot untuk waktu pengiriman
  warranty: number;       // Bobot untuk garansi
  paymentTerms: number;   // Bobot untuk termin pembayaran
}

export interface ComparisonVendor {
  id: string;
  name: string;
  price: number;          // Harga penawaran
  leadTime: number;       // Waktu pengiriman (dalam hari)
  warranty: number;       // Masa garansi (dalam bulan)
  paymentTerms: number;   // Termin pembayaran (dalam hari)
}

// FIX: Add missing Tender-related types
// Tender Scoring Types
export interface BidScore {
  criterionId: string;
  score: number; // e.g., 1-10
}

export interface BidDetail {
  criterionId: string;
  value: string; // The vendor's submission for this criterion
}

export interface Bid {
  id: string;
  tenderId: string;
  vendorId: string;
  vendorName: string;
  submissionDate: string;
  price: number;
  details: BidDetail[];
  scores: BidScore[];
}

export interface ScoringCriterion {
  id: string;
  name: string;
  weight: number; // in percentage
}

export interface Tender {
  id: string;
  name: string;
  description: string;
  status: 'Open' | 'Closed' | 'Awarded';
  openDate: string;
  closeDate: string;
  criteria: ScoringCriterion[];
  bids: Bid[];
  winningVendorId?: string;
  winningVendorName?: string;
}

export interface ComparisonProject {
  id:string;
  name: string;
  description: string;
  weights: Weights;
  vendors: ComparisonVendor[];
  createdAt: string;
  deadline: string;
}