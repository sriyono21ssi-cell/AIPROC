import React from 'react';
import type { PricedItem, PriceHistory, Vendor } from 'types';

interface PriceComparisonProps {
  item: PricedItem;
  vendors: Vendor[];
  onClose: () => void;
}

interface VendorPriceInfo {
    vendorId: string;
    vendorName: string;
    latestPrice: number;
    latestDate: string;
    history: PriceHistory[];
    vendorRating: number;
}

const PriceComparison: React.FC<PriceComparisonProps> = ({ item, vendors, onClose }) => {
    // 1. Process history to group by vendor
    const pricesByVendor = item.history.reduce((acc, record) => {
        if (!acc[record.vendorId]) {
            acc[record.vendorId] = [];
        }
        acc[record.vendorId].push(record);
        return acc;
    }, {} as Record<string, PriceHistory[]>);

    // 2. Create structured data for comparison
    // FIX: Explicitly type `vendorHistory` as `PriceHistory[]` to resolve TypeScript inference issue.
    const comparisonData: VendorPriceInfo[] = Object.values(pricesByVendor).map((vendorHistory: PriceHistory[]) => {
        // Sort by date to find the latest
        const sortedHistory = [...vendorHistory].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        const latestRecord = sortedHistory[0];
        const vendorDetails = vendors.find(v => v.id === latestRecord.vendorId);

        return {
            vendorId: latestRecord.vendorId,
            vendorName: latestRecord.vendorName,
            latestPrice: latestRecord.price,
            latestDate: latestRecord.date,
            history: sortedHistory,
            vendorRating: vendorDetails?.rating || 0,
        };
    }).sort((a, b) => a.latestPrice - b.latestPrice); // Sort by lowest price first

    const lowestPrice = comparisonData.length > 0 ? comparisonData[0].latestPrice : 0;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4" aria-modal="true" role="dialog">
            <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-2xl font-bold text-neutral">Perbandingan Harga: {item.name}</h2>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-800" aria-label="Close">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                    </button>
                </div>
                
                <div className="overflow-auto flex-1">
                    {comparisonData.length > 0 ? (
                        <div className="space-y-4">
                            {comparisonData.map((data) => (
                                <div key={data.vendorId} className={`border-2 rounded-lg p-4 ${data.latestPrice === lowestPrice ? 'border-green-500 bg-green-50' : 'border-base-200'}`}>
                                    {data.latestPrice === lowestPrice && (
                                        <div className="text-sm font-bold text-green-700 mb-2 flex items-center">
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                            </svg>
                                            HARGA TERBAIK
                                        </div>
                                    )}
                                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
                                        <div className="md:col-span-1">
                                            <h3 className="font-bold text-lg text-primary">{data.vendorName}</h3>
                                            <div className="flex items-center text-sm text-gray-600 mt-1">
                                                <span className="text-yellow-500 mr-1">★</span>
                                                <span className="font-semibold text-gray-800">{data.vendorRating.toFixed(1)}</span>
                                            </div>
                                        </div>
                                        <div className="md:col-span-1 text-left">
                                            <p className="text-sm text-gray-500">Harga Terakhir</p>
                                            <p className="text-2xl font-bold text-neutral">Rp {data.latestPrice.toLocaleString('id-ID')}</p>
                                        </div>
                                        <div className="md:col-span-1 text-left">
                                            <p className="text-sm text-gray-500">Tanggal Update</p>
                                            <p className="font-semibold">{data.latestDate}</p>
                                        </div>
                                        <div className="md:col-span-1 text-left">
                                            <p className="text-sm text-gray-500">Total Transaksi</p>
                                            <p className="font-semibold">{data.history.length} kali</p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-center text-gray-500">Tidak ada data riwayat harga yang cukup untuk perbandingan.</p>
                    )}
                </div>
                 <div className="flex justify-end pt-6 mt-4 border-t">
                    <button onClick={onClose} className="px-6 py-2 bg-primary text-white font-semibold rounded-lg hover:bg-primary-focus">Tutup</button>
                </div>
            </div>
        </div>
    );
};

export default PriceComparison;