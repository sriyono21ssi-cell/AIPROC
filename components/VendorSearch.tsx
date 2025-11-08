
import React from 'react';
import type { SearchResult, NewVendor } from 'types';
import { WhatsappIcon } from 'components/icons/WhatsappIcon';
import { MapPinIcon } from 'components/icons/MapPinIcon';
import { PriceTagIcon } from 'components/icons/PriceTagIcon';
import { SearchIcon } from 'components/icons/SearchIcon';
import { RefreshIcon } from 'components/icons/RefreshIcon';

interface VendorSearchProps {
    addVendor: (vendor: NewVendor) => void;
    categories: string[];
    // From useVendorSearch hook
    query: string; setQuery: (q: string) => void;
    category: string; setCategory: (c: string) => void;
    location: string; setLocation: (l: string) => void;
    useCurrentLocation: boolean; setUseCurrentLocation: (u: boolean) => void;
    isLoading: boolean;
    searchResults: SearchResult[];
    error: string;
    sortBy: string; setSortBy: (s: string) => void;
    minRating: number; setMinRating: (r: number) => void;
    handleSearch: (e: React.FormEvent) => Promise<void>;
    resetSearch: () => void;
    displayedResults: SearchResult[];
}

// Skeleton Card for loading state
const SkeletonCard: React.FC = () => (
    <div className="bg-white border border-base-200 rounded-lg p-5 shadow-md animate-pulse">
        <div className="h-6 bg-gray-200 rounded w-3/4 mb-2"></div>
        <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
        <div className="h-12 bg-gray-200 rounded w-full mb-4"></div>
        <div className="h-5 bg-gray-200 rounded w-full mb-2"></div>
        <div className="h-5 bg-gray-200 rounded w-5/6 mb-4"></div>
        <div className="flex justify-between items-center mt-6 pt-4 border-t">
            <div className="h-10 bg-gray-200 rounded-lg w-3/5"></div>
            <div className="flex space-x-2 w-2/5 justify-end">
                <div className="h-10 w-10 bg-gray-200 rounded-lg"></div>
                <div className="h-10 w-10 bg-gray-200 rounded-lg"></div>
            </div>
        </div>
    </div>
);

// Result Card component
const ResultCard: React.FC<{ 
    result: SearchResult; 
    onAdd: (result: SearchResult) => void;
    getMapsUrl: (result: SearchResult) => string;
    formatPhoneNumberForWhatsApp: (phone: string) => string | null;
}> = ({ result, onAdd, getMapsUrl, formatPhoneNumberForWhatsApp }) => {
    const formattedPhone = formatPhoneNumberForWhatsApp(result.phone);
    const isTopRated = result.rating >= 4.5 && result.reviewCount > 10;
    
    return (
         <div className="bg-white border border-base-200 rounded-lg p-5 flex flex-col justify-between shadow-md hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
            <div>
                <div className="flex justify-between items-start mb-2">
                    <h3 className="font-bold text-lg text-neutral pr-2">{result.name}</h3>
                    {isTopRated && (
                        <span className="bg-accent text-yellow-900 text-xs font-bold px-2.5 py-1 rounded-full whitespace-nowrap">Top Rated</span>
                    )}
                </div>

                {result.rating > 0 && (
                   <div className="flex items-center text-sm text-gray-600 mb-3">
                       <span className="text-yellow-500 mr-1">★</span>
                       <span className="font-semibold text-gray-800 mr-1">{result.rating.toFixed(1)}</span>
                       <span>({result.reviewCount} ulasan)</span>
                   </div>
                )}
                 <p className="text-sm text-gray-600 italic bg-base-100 p-3 rounded-md mb-4">"{result.description}"</p>
                
                <div className="space-y-2 text-sm text-gray-700 mb-4">
                    <div className="flex items-start">
                        <MapPinIcon className="w-4 h-4 mr-2 mt-0.5 text-gray-400 flex-shrink-0" />
                        <span>{result.address}</span>
                    </div>
                     <p className="flex items-center truncate">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 mr-2 text-gray-400 flex-shrink-0"><circle cx="12" cy="12" r="10"></circle><line x1="2" y1="12" x2="22" y2="12"></line><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path></svg>
                        Web: {result.website && result.website.toLowerCase() !== 'n/a' ? <a href={result.website.startsWith('http') ? result.website : `https://${result.website}`} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline ml-1 truncate">{result.website}</a> : 'N/A'}
                    </p>
                    <p className="flex items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 mr-2 text-gray-400 flex-shrink-0"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>
                        Telp: {result.phone}
                    </p>
                </div>
            </div>
            <div className="mt-auto pt-4 border-t border-base-200">
                <div className="flex items-center space-x-2">
                    <button onClick={() => onAdd(result)} className="flex-1 text-sm bg-primary text-white font-bold px-3 py-2.5 rounded-lg hover:bg-primary-focus transition-colors">
                        Tambah Vendor
                    </button>
                    <a href={getMapsUrl(result)} target="_blank" rel="noopener noreferrer" title="Lihat di Maps" className="p-2.5 rounded-lg bg-secondary text-white hover:bg-blue-600 transition-colors">
                        <MapPinIcon className="w-5 h-5"/>
                    </a>
                    {formattedPhone ? (
                        <a 
                            href={`https://wa.me/${formattedPhone}`} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            title="Chat di WhatsApp"
                            className="p-2.5 rounded-lg bg-green-500 text-white hover:bg-green-600 transition-colors"
                        >
                            <WhatsappIcon className="w-5 h-5"/>
                        </a>
                    ) : (
                         <button 
                            disabled 
                            title="WhatsApp tidak tersedia"
                            className="p-2.5 rounded-lg bg-gray-300 text-white cursor-not-allowed"
                        >
                            <WhatsappIcon className="w-5 h-5"/>
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};


const VendorSearch: React.FC<VendorSearchProps> = ({ 
    addVendor, 
    categories,
    query, setQuery,
    category, setCategory,
    location, setLocation,
    useCurrentLocation, setUseCurrentLocation,
    isLoading,
    searchResults,
    error,
    sortBy, setSortBy,
    minRating, setMinRating,
    handleSearch,
    resetSearch,
    displayedResults
}) => {

  const handleAddVendor = (result: SearchResult) => {
    const newVendor: NewVendor = {
        name: result.name,
        phone: result.phone && !result.phone.toLowerCase().includes('n/a') ? result.phone : '',
        email: '',
        address: result.address,
        category: category,
        produk: query,
        status: 'Aktif'
    };
    addVendor(newVendor);
    alert(`${result.name} telah ditambahkan ke data vendor.`);
  }
  
  const handleExportCSV = () => {
    if (displayedResults.length === 0) {
      alert("Tidak ada data untuk diekspor (sesuai filter saat ini).");
      return;
    }

    const headers = ['Name', 'Description', 'Address', 'Phone', 'Website', 'Rating', 'Review_Count', 'Maps_URL'];
    const rows = displayedResults.map(r => [
      `"${r.name.replace(/"/g, '""')}"`,
      `"${r.description.replace(/"/g, '""')}"`,
      `"${r.address.replace(/"/g, '""')}"`,
      `"${r.phone.replace(/"/g, '""')}"`,
      `"${r.website.replace(/"/g, '""')}"`,
      r.rating,
      r.reviewCount,
      `"${r.mapsUrl.replace(/"/g, '""')}"`,
    ].join(','));

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(','), ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "vendor_search_results.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getMapsUrl = (result: SearchResult) => {
    if (result.mapsUrl && result.mapsUrl.toLowerCase() !== 'n/a') {
        return result.mapsUrl;
    }
    // Fallback to searching by name and address if no direct URL is provided
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(result.name + ' ' + result.address)}`;
  };
  
  const formatPhoneNumberForWhatsApp = (phone: string): string | null => {
    if (!phone || phone.toLowerCase() === 'n/a') {
        return null;
    }
    // Remove all non-digit characters
    let cleaned = phone.replace(/\D/g, '');

    // Handle Indonesian numbers starting with 0
    if (cleaned.startsWith('0')) {
        cleaned = '62' + cleaned.substring(1);
    }
    
    // Basic validation for a reasonable length
    if (cleaned.length < 9) {
        return null;
    }
    
    return cleaned;
  };

  return (
    <div className="space-y-8">
      {/* Search Hero Section */}
      <div className="bg-white p-8 rounded-2xl shadow-lg border border-gray-200">
        <h2 className="text-3xl font-bold mb-2 text-center text-neutral">Temukan Vendor Terbaik untuk Bisnis Anda</h2>
        <p className="text-gray-600 mb-6 text-center">Cari berdasarkan barang, layanan, dan lokasi untuk mendapatkan rekomendasi vendor dari AI.</p>
        <form onSubmit={handleSearch} className="space-y-4 max-w-3xl mx-auto">
            {/* Row 1 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label htmlFor="query" className="block text-sm font-medium text-gray-700 mb-1">Nama Barang / Layanan</label>
                    <div className="relative">
                        <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                        <input id="query" type="text" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="cth: packaging, bahan kue" className="w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary bg-gray-100 text-black placeholder-gray-500" />
                    </div>
                </div>
                <div>
                    <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">Kategori</label>
                    <div className="relative">
                        <PriceTagIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                        <input id="category" list="category-options" value={category} onChange={(e) => setCategory(e.target.value)} placeholder="Pilih atau ketik baru" className="w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary bg-gray-100 text-black placeholder-gray-500" />
                        <datalist id="category-options">{categories.map(cat => <option key={cat} value={cat} />)}</datalist>
                    </div>
                </div>
            </div>
            
            {/* Row 2 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
                <div>
                    <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-1">Lokasi</label>
                    <div className="relative">
                        <MapPinIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                        <input id="location" type="text" value={location} onChange={(e) => setLocation(e.target.value)} placeholder="cth: Jakarta" disabled={useCurrentLocation} className="w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-md shadow-sm bg-gray-100 text-black disabled:bg-gray-200 disabled:text-gray-500 disabled:cursor-not-allowed" />
                    </div>
                </div>
                <div className="flex items-center pb-2.5">
                    <input id="useCurrentLocation" type="checkbox" checked={useCurrentLocation} onChange={(e) => setUseCurrentLocation(e.target.checked)} className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"/>
                    <label htmlFor="useCurrentLocation" className="ml-2 block text-sm text-gray-700 select-none cursor-pointer">Gunakan lokasi sekitar saya</label>
                </div>
            </div>

            {/* Row 3 */}
            <div className="grid grid-cols-2 gap-4 mt-2">
                <button type="button" onClick={resetSearch} disabled={isLoading} className="w-full bg-gray-500 text-white font-bold py-3 px-4 rounded-lg hover:bg-gray-600 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors text-lg flex items-center justify-center space-x-2">
                    <RefreshIcon className="w-5 h-5"/>
                    <span>Reset</span>
                </button>
                <button type="submit" disabled={isLoading} className="w-full bg-accent text-primary-focus font-bold py-3 px-4 rounded-lg hover:bg-yellow-400 disabled:bg-gray-500 disabled:text-gray-200 transition-colors text-lg flex items-center justify-center space-x-2">
                  <SearchIcon className="w-5 h-5"/>
                  <span>{isLoading ? 'Mencari...' : 'Cari Vendor'}</span>
                </button>
            </div>
        </form>
        {error && <p className="text-red-700 mt-4 bg-red-100 p-3 rounded-md max-w-3xl mx-auto">{error}</p>}
      </div>

      {/* Results Section */}
      <div className="space-y-4">
        {isLoading && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {Array(6).fill(0).map((_, i) => <SkeletonCard key={i} />)}
            </div>
        )}
        
        {!isLoading && searchResults.length > 0 && (
            <>
                <div className="bg-white p-4 rounded-xl shadow-md">
                    <div className="flex justify-between items-center flex-wrap gap-4">
                        <h2 className="text-2xl font-bold text-neutral">Hasil Pencarian ({displayedResults.length})</h2>
                        <div className="flex items-center space-x-4 flex-wrap">
                            <div>
                                <label htmlFor="filterRating" className="text-sm font-medium text-gray-700 mr-2">Rating:</label>
                                <select id="filterRating" value={minRating} onChange={(e) => setMinRating(Number(e.target.value))} className="rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary py-2 px-3 bg-gray-100 text-black">
                                    <option value={0}>Semua</option><option value={4}>4+</option><option value={3}>3+</option><option value={2}>2+</option><option value={1}>1+</option>
                                </select>
                            </div>
                            <div>
                                <label htmlFor="sortBy" className="text-sm font-medium text-gray-700 mr-2">Urutkan:</label>
                                <select id="sortBy" value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary py-2 px-3 bg-gray-100 text-black">
                                    <option value="relevance">Relevansi</option><option value="rating_desc">Rating Tertinggi</option><option value="rating_asc">Rating Terendah</option>
                                </select>
                            </div>
                            <button onClick={handleExportCSV} className="bg-success text-white font-bold py-2 px-4 rounded-lg hover:bg-green-600 transition-colors">
                                Export CSV
                            </button>
                        </div>
                    </div>
                </div>
            
                {displayedResults.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {displayedResults.map((result, index) => (
                            <ResultCard 
                                key={index} 
                                result={result} 
                                onAdd={handleAddVendor}
                                getMapsUrl={getMapsUrl}
                                formatPhoneNumberForWhatsApp={formatPhoneNumberForWhatsApp}
                            />
                        ))}
                    </div>
                 ) : (
                    <div className="text-center py-16 bg-white rounded-xl shadow-md">
                        <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                        <h3 className="mt-2 text-lg font-medium text-gray-900">Tidak Ada Hasil</h3>
                        <p className="mt-1 text-sm text-gray-500">Tidak ada vendor yang cocok dengan filter Anda. Coba sesuaikan filter.</p>
                    </div>
                 )}
            </>
        )}
        
        {!isLoading && searchResults.length === 0 && query.length === 0 && (
            <div className="text-center py-16 bg-white rounded-xl shadow-md">
                <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                <h3 className="mt-2 text-lg font-medium text-gray-900">Mulai Mencari</h3>
                <p className="mt-1 text-sm text-gray-500">Gunakan form di atas untuk menemukan vendor baru.</p>
            </div>
        )}
      </div>
    </div>
  );
};

export default VendorSearch;