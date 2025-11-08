
import React, { useState, useMemo } from 'react';
import type { Vendor, PricedItem } from '../types';
import { analyzeDashboardData } from '../services/geminiService';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { TrendingUpIcon } from './icons/TrendingUpIcon';
import { TrendingDownIcon } from './icons/TrendingDownIcon';
import { MinusIcon } from './icons/MinusIcon';


interface DashboardProps {
  vendors: Vendor[];
  pricedItems: PricedItem[];
}

const Dashboard: React.FC<DashboardProps> = ({ vendors, pricedItems }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [analysis, setAnalysis] = useState('');

  const vendorStats = useMemo(() => {
    const totalVendors = vendors.length;
    if (totalVendors === 0) {
        return {
            totalVendors,
            topVendor: null,
            lowestVendor: null,
        };
    }
    
    const topVendor = vendors.reduce((top, current) => 
        (current.rating > top.rating ? current : top)
    );
    
    const reviewedVendors = vendors.filter(v => v.reviewCount > 0);
    const lowestVendor = reviewedVendors.length > 0 
        ? reviewedVendors.reduce((lowest, current) => (current.rating < lowest.rating ? current : lowest))
        : null;

    return {
        totalVendors,
        topVendor,
        lowestVendor,
    };
  }, [vendors]);

  const priceStats = useMemo(() => {
    const totalItems = pricedItems.length;
    
    const trends = pricedItems.reduce((acc, item) => {
        acc[item.priceTrend] = (acc[item.priceTrend] || 0) + 1;
        return acc;
    }, {} as Record<'up' | 'down' | 'stable', number>);

    let avgTrend: 'Naik' | 'Turun' | 'Stabil' = 'Stabil';
    if ((trends.up || 0) > (trends.down || 0) && (trends.up || 0) > (trends.stable || 0)) {
        avgTrend = 'Naik';
    } else if ((trends.down || 0) > (trends.up || 0)) {
        avgTrend = 'Turun';
    }

    return {
        totalItems,
        avgTrend,
    };
  }, [pricedItems]);
  
  const vendorRatingChartData = useMemo(() => {
    const allEvals = vendors.flatMap(v => v.evaluations.map(e => {
        const date = new Date(e.date);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        const rating = (e.quality + e.price + e.delivery + e.communication) / 4;
        return { monthKey, rating };
    }));

    if (allEvals.length === 0) return [];
    
    const ratingsByMonth = allEvals.reduce((acc, { monthKey, rating }) => {
        if (!acc[monthKey]) {
            acc[monthKey] = [];
        }
        acc[monthKey].push(rating);
        return acc;
    }, {} as Record<string, number[]>);

    const sortedMonthKeys = Object.keys(ratingsByMonth).sort();

    const data = sortedMonthKeys.map(monthKey => {
        const ratings = ratingsByMonth[monthKey];
        const avgRating = ratings.reduce((sum, r) => sum + r, 0) / ratings.length;
        const date = new Date(monthKey + '-02'); // Use day 2 to avoid timezone issues
        return {
            name: date.toLocaleString('default', { month: 'short' }),
            'Avg Rating': parseFloat(avgRating.toFixed(2)),
        };
    });

    return data.slice(-7); // show last 7 months max
  }, [vendors]);

  const priceIndexChartData = useMemo(() => {
    const allHistoryPointsWithIndex = pricedItems.flatMap(item => {
        // Find the earliest history point to use as a baseline
        const sortedHistory = [...item.history].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        const firstPrice = sortedHistory[0]?.price;
        if (!firstPrice || firstPrice === 0) return [];
        
        return sortedHistory.map(h => {
            const date = new Date(h.date);
            const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
            return {
                monthKey,
                index: (h.price / firstPrice) * 100,
            };
        });
    });

    if (allHistoryPointsWithIndex.length === 0) return [];

    const indicesByMonth = allHistoryPointsWithIndex.reduce((acc, point) => {
        if (!acc[point.monthKey]) {
            acc[point.monthKey] = [];
        }
        acc[point.monthKey].push(point.index);
        return acc;
    }, {} as Record<string, number[]>);

    const sortedMonthKeys = Object.keys(indicesByMonth).sort();

    const data = sortedMonthKeys.map(monthKey => {
        const indices = indicesByMonth[monthKey];
        const avgIndex = indices.reduce((sum, i) => sum + i, 0) / indices.length;
        const date = new Date(monthKey + '-02');
        return {
            name: date.toLocaleString('default', { month: 'short' }),
            'Price Index': parseFloat(avgIndex.toFixed(2)),
        };
    });
    
    return data.slice(-7); // show last 7 months max
  }, [pricedItems]);


  const handleAnalyze = async () => {
    setIsLoading(true);
    setAnalysis('');
    const result = await analyzeDashboardData(vendors, pricedItems);
    setAnalysis(result);
    setIsLoading(false);
  };

  const StatCard: React.FC<{ title: string; value: string | number; children?: React.ReactNode }> = ({ title, value, children }) => (
    <div className="bg-white p-6 rounded-xl shadow-md flex flex-col justify-between">
      <div>
        <h3 className="text-lg font-medium text-gray-500">{title}</h3>
        <p className="text-4xl font-bold text-neutral mt-2 truncate">{value}</p>
      </div>
      {children && <div className="mt-4">{children}</div>}
    </div>
  );

  return (
    <div className="space-y-8">
      <h2 className="text-2xl font-semibold text-neutral">Ringkasan Umum</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6">
        <StatCard title="Total Vendor Terdaftar" value={vendorStats.totalVendors} />
        <StatCard title="Vendor Rating Tertinggi" value={vendorStats.topVendor?.name || 'N/A'}>
            {vendorStats.topVendor && <div className="text-sm text-gray-700 flex items-center"><span className="text-yellow-500 mr-1 text-lg">★</span>Rating: {vendorStats.topVendor.rating.toFixed(1)}</div>}
        </StatCard>
        <StatCard title="Vendor Rating Terendah" value={vendorStats.lowestVendor?.name || 'N/A'}>
            {vendorStats.lowestVendor && <div className="text-sm text-gray-700 flex items-center"><TrendingDownIcon className="w-5 h-5 mr-2 text-error"/>Rating: {vendorStats.lowestVendor.rating.toFixed(1)}</div>}
        </StatCard>
        <StatCard title="Total item barang" value={priceStats.totalItems} />
        <StatCard title="Tren Harga Rata-rata" value={priceStats.avgTrend}>
            <div className="text-sm flex items-center">
               {priceStats.avgTrend === 'Naik' && <TrendingUpIcon className="w-5 h-5 mr-2 text-error"/>}
               {priceStats.avgTrend === 'Turun' && <TrendingDownIcon className="w-5 h-5 mr-2 text-success"/>}
               {priceStats.avgTrend === 'Stabil' && <MinusIcon className="w-5 h-5 mr-2 text-gray-500"/>}
               Harga secara umum cenderung {priceStats.avgTrend.toLowerCase()}.
            </div>
        </StatCard>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
            <div className="bg-white p-6 rounded-xl shadow-md">
              <h3 className="text-xl font-semibold mb-4 text-neutral">Grafik Tren Rating Vendor</h3>
              {vendorRatingChartData.length > 1 ? (
                <ResponsiveContainer width="100%" height={250}>
                  <LineChart data={vendorRatingChartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis domain={['dataMin - 0.5', 'dataMax + 0.5']} />
                    <Tooltip formatter={(value: number) => value.toFixed(2)} />
                    <Legend />
                    <Line type="monotone" dataKey="Avg Rating" stroke="#0D47A1" strokeWidth={2} activeDot={{ r: 8 }} />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                 <div className="flex items-center justify-center h-[250px] text-gray-500">
                    Tidak ada data evaluasi yang cukup untuk menampilkan grafik.
                 </div>
              )}
            </div>
            <div className="bg-white p-6 rounded-xl shadow-md">
                <h3 className="text-xl font-semibold mb-4 text-neutral">Grafik Tren Indeks Harga</h3>
                {priceIndexChartData.length > 1 ? (
                    <ResponsiveContainer width="100%" height={250}>
                        <LineChart data={priceIndexChartData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" />
                            <YAxis domain={['dataMin - 5', 'dataMax + 5']} />
                            <Tooltip formatter={(value: number) => `${value.toFixed(2)}`} />
                            <Legend />
                            <Line type="monotone" dataKey="Price Index" name="Price Index (Base 100)" stroke="#4CAF50" strokeWidth={2} activeDot={{ r: 8 }} />
                        </LineChart>
                    </ResponsiveContainer>
                ) : (
                    <div className="flex items-center justify-center h-[250px] text-gray-500">
                        Tidak ada riwayat harga yang cukup untuk menampilkan grafik tren.
                    </div>
                )}
            </div>
        </div>
        

        <div className="bg-white p-6 rounded-xl shadow-md flex flex-col">
          <h3 className="text-xl font-semibold mb-4 text-neutral">Analisis Otomatis AI</h3>
          <div className="flex-1 p-4 bg-base-100 rounded-lg overflow-y-auto">
            {isLoading ? (
              <div className="flex items-center justify-center h-full">
                 <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : analysis ? (
              <p className="text-gray-700" style={{whiteSpace: 'pre-wrap'}}>{analysis}</p>
            ) : (
              <p className="text-gray-500">Klik tombol di bawah untuk mendapatkan insight dari AI.</p>
            )}
          </div>
          <button
            onClick={handleAnalyze}
            disabled={isLoading}
            className="mt-4 w-full bg-primary text-white font-bold py-3 px-4 rounded-lg hover:bg-primary-focus focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:bg-gray-400 transition-colors duration-200"
          >
            {isLoading ? 'Menganalisis...' : 'Analisa oleh AI'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
