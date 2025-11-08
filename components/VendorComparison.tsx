
import React from 'react';
import type { Vendor } from 'types';
import { TrendingUpIcon } from 'components/icons/TrendingUpIcon';
import { TrendingDownIcon } from 'components/icons/TrendingDownIcon';
import { MinusIcon } from 'components/icons/MinusIcon';

interface VendorComparisonProps {
  vendors: Vendor[];
  onClose: () => void;
}

interface CalculatedMetrics {
    avgQuality: number;
    avgPrice: number;
    avgDelivery: number;
    avgCommunication: number;
}

const VendorComparison: React.FC<VendorComparisonProps> = ({ vendors, onClose }) => {
    
    const calculateMetrics = (vendor: Vendor): CalculatedMetrics => {
        if (vendor.evaluations.length === 0) {
            return { avgQuality: 0, avgPrice: 0, avgDelivery: 0, avgCommunication: 0 };
        }
        const totalEvals = vendor.evaluations.length;
        const sum = vendor.evaluations.reduce((acc, e) => ({
            quality: acc.quality + e.quality,
            price: acc.price + e.price,
            delivery: acc.delivery + e.delivery,
            communication: acc.communication + e.communication,
        }), { quality: 0, price: 0, delivery: 0, communication: 0 });
        
        return {
            avgQuality: sum.quality / totalEvals,
            avgPrice: sum.price / totalEvals,
            avgDelivery: sum.delivery / totalEvals,
            avgCommunication: sum.communication / totalEvals,
        };
    };
    
    const vendorDataWithMetrics = vendors.map(v => ({
        ...v,
        calculatedMetrics: calculateMetrics(v),
    }));

    const findBestValue = (metric: keyof Vendor | keyof CalculatedMetrics) => {
        if (vendors.length === 0) return null;

        if (metric === 'rating' || metric === 'reviewCount' || metric === 'avgQuality' || metric === 'avgDelivery' || metric === 'avgCommunication') {
             // The type assertion is complex here, so we use `any` as a safe fallback.
            return Math.max(...vendorDataWithMetrics.map(v => (metric in v ? (v as any)[metric] : v.calculatedMetrics[metric as keyof CalculatedMetrics])));
        }
        // For price, lower is better. Assuming 'price' refers to 'avgPrice'.
        if (metric === 'avgPrice') {
            const prices = vendorDataWithMetrics.map(v => v.calculatedMetrics.avgPrice).filter(p => p > 0);
            return prices.length > 0 ? Math.min(...prices) : null;
        }
        return null;
    };

    const bests = {
        rating: findBestValue('rating'),
        reviewCount: findBestValue('reviewCount'),
        avgQuality: findBestValue('avgQuality'),
        avgPrice: findBestValue('avgPrice'),
        avgDelivery: findBestValue('avgDelivery'),
        avgCommunication: findBestValue('avgCommunication'),
    };

    const metricRows = [
        { key: 'category', label: 'Kategori' },
        { key: 'rating', label: 'Rating', best: bests.rating },
        { key: 'reviewCount', label: 'Jumlah Ulasan', best: bests.reviewCount },
        { key: 'status', label: 'Status' },
        { key: 'lastEvaluated', label: 'Evaluasi Terakhir' },
        { key: 'performanceTrend', label: 'Tren Kinerja' },
    ];
    
    const evaluationRows = [
        { key: 'avgQuality', label: 'Kualitas', best: bests.avgQuality },
        { key: 'avgPrice', label: 'Harga (lower is better)', best: bests.avgPrice },
        { key: 'avgDelivery', label: 'Pengiriman', best: bests.avgDelivery },
        { key: 'avgCommunication', label: 'Komunikasi', best: bests.avgCommunication },
    ];

    const renderCellContent = (vendor: typeof vendorDataWithMetrics[0], key: string) => {
        let value: any;
        if (key in vendor.calculatedMetrics) {
            value = vendor.calculatedMetrics[key as keyof CalculatedMetrics];
            return value > 0 ? value.toFixed(2) : 'N/A';
        }

        value = vendor[key as keyof Vendor];

        switch (key) {
            case 'performanceTrend':
                return {
                    up: <TrendingUpIcon className="w-5 h-5 text-success mx-auto" />,
                    down: <TrendingDownIcon className="w-5 h-5 text-error mx-auto" />,
                    stable: <MinusIcon className="w-5 h-5 text-gray-500 mx-auto" />,
                }[value];
            case 'status':
                const statusColor = {
                    Aktif: 'bg-green-100 text-green-800',
                    Nonaktif: 'bg-yellow-100 text-yellow-800',
                    Blacklist: 'bg-red-100 text-red-800',
                }[value as 'Aktif' | 'Nonaktif' | 'Blacklist'];
                return <span className={`px-2 py-1 text-xs font-semibold rounded-full ${statusColor}`}>{value}</span>;
            case 'rating':
                return value.toFixed(1);
            default:
                return value;
        }
    };
    
    const getCellStyle = (value: any, bestValue: number | null, key: string) => {
        if (bestValue === null || value === 'N/A' || value === 0 || typeof value !== 'number') return '';
        const isBest = (key === 'avgPrice')
            ? value === bestValue
            : value === bestValue;
        
        return isBest ? 'bg-green-100 font-bold text-green-800' : '';
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4" aria-modal="true" role="dialog">
            <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-6xl max-h-[90vh] flex flex-col">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-2xl font-bold text-neutral">Perbandingan Vendor</h2>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-800" aria-label="Close">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                    </button>
                </div>
                
                {/* Desktop View */}
                <div className="overflow-auto flex-1 hidden lg:block">
                    <table className="w-full min-w-max text-left border-collapse">
                        <thead>
                            <tr className="bg-base-100">
                                <th className="p-4 font-semibold text-neutral border border-base-200 sticky left-0 bg-base-100 z-10">Metrik</th>
                                {vendorDataWithMetrics.map(vendor => (
                                    <th key={vendor.id} className="p-4 font-semibold text-neutral border border-base-200 text-center">{vendor.name}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {metricRows.map(row => (
                                <tr key={row.key} className="hover:bg-gray-50">
                                    <td className="p-4 font-medium text-gray-700 border border-base-200 sticky left-0 bg-white z-10">{row.label}</td>
                                    {vendorDataWithMetrics.map(vendor => {
                                        const value = vendor[row.key as keyof Vendor];
                                        return (
                                            <td key={vendor.id} className={`p-4 text-center border border-base-200 ${getCellStyle(value, row.best ?? null, row.key)}`}>
                                                {renderCellContent(vendor, row.key)}
                                            </td>
                                        )
                                    })}
                                </tr>
                            ))}
                            <tr className="bg-base-100">
                                <td colSpan={vendors.length + 1} className="p-4 font-semibold text-neutral border border-base-200 sticky left-0 bg-base-100 z-10">Detail Evaluasi (Rata-rata)</td>
                            </tr>
                             {evaluationRows.map(row => (
                                <tr key={row.key} className="hover:bg-gray-50">
                                    <td className="p-4 font-medium text-gray-700 border border-base-200 sticky left-0 bg-white z-10">{row.label}</td>
                                    {vendorDataWithMetrics.map(vendor => (
                                        <td key={vendor.id} className={`p-4 text-center border border-base-200 ${getCellStyle(vendor.calculatedMetrics[row.key as keyof CalculatedMetrics], row.best ?? null, row.key)}`}>
                                            {renderCellContent(vendor, row.key)}
                                        </td>
                                    ))}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Mobile View */}
                <div className="overflow-auto flex-1 block lg:hidden">
                    <div className="flex space-x-4 p-2 snap-x snap-mandatory overflow-x-auto">
                        {vendorDataWithMetrics.map(vendor => {
                            let value: any;
                             return (
                                <div key={vendor.id} className="flex-shrink-0 w-[85%] sm:w-[60%] snap-center bg-base-100 rounded-lg p-4 border border-base-300 shadow-sm">
                                    <h3 className="text-lg font-bold text-center text-primary mb-4">{vendor.name}</h3>
                                    
                                    <div className="space-y-1 text-sm">
                                        {metricRows.map(row => {
                                            value = vendor[row.key as keyof Vendor];
                                            const style = getCellStyle(value, row.best ?? null, row.key);
                                            return(
                                            <div key={row.key} className={`flex justify-between items-center p-2 rounded ${style}`}>
                                                <span className="text-gray-600">{row.label}</span>
                                                <div className="font-semibold text-right">{renderCellContent(vendor, row.key)}</div>
                                            </div>
                                        )})}
                                    </div>
        
                                    <h4 className="font-semibold text-neutral mt-6 mb-2 pt-2 border-t text-base">Evaluasi (Rata-rata)</h4>
                                    <div className="space-y-1 text-sm">
                                        {evaluationRows.map(row => {
                                            value = vendor.calculatedMetrics[row.key as keyof CalculatedMetrics];
                                            const style = getCellStyle(value, row.best ?? null, row.key);
                                            return(
                                            <div key={row.key} className={`flex justify-between items-center p-2 rounded ${style}`}>
                                                <span className="text-gray-600">{row.label}</span>
                                                <div className="font-semibold text-right">{renderCellContent(vendor, row.key)}</div>
                                            </div>
                                        )})}
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </div>

            </div>
        </div>
    );
};

export default VendorComparison;