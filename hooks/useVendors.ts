
import { useState, useCallback } from 'react';
import type { Vendor, Evaluation, NewVendor } from 'types';

const initialVendors: Vendor[] = [
  {
    id: 'v1',
    name: 'PT Sejuk Abadi',
    phone: '021-555-0101',
    email: 'contact@sejukabadi.com',
    address: 'Jl. Industri No. 1, Jakarta',
    category: 'Packaging',
    produk: 'Karton Box Ukuran Sedang',
    rating: 3.8,
    reviewCount: 2,
    status: 'Aktif',
    lastEvaluated: '2024-06-15',
    performanceTrend: 'down',
    evaluations: [
        { date: '2024-04-15', quality: 4, price: 4, delivery: 4, communication: 5 },
        { date: '2024-06-15', quality: 4, price: 3, delivery: 3, communication: 5, comment: 'Slight delay in last shipment.' }
    ],
  },
  {
    id: 'v2',
    name: 'CV Logistik Cepat',
    phone: '081234567890',
    email: 'cs@logistikcepat.com',
    address: 'Jl. Raya Logistik 2, Surabaya',
    category: 'Logistics',
    produk: 'Jasa Pengiriman Reguler',
    rating: 4.8,
    reviewCount: 3,
    status: 'Aktif',
    lastEvaluated: '2024-07-01',
    performanceTrend: 'up',
    evaluations: [
        { date: '2024-03-01', quality: 4, price: 4, delivery: 5, communication: 5 },
        { date: '2024-05-01', quality: 5, price: 4, delivery: 5, communication: 5 },
        { date: '2024-07-01', quality: 5, price: 4, delivery: 5, communication: 5, comment: 'Excellent service!' }
    ],
  },
  {
    id: 'v3',
    name: 'Sumber Bahan Baku',
    phone: '022-720-9988',
    email: 'sales@sumberbahan.co.id',
    address: 'Jl. Kimia No. 3, Bandung',
    category: 'Raw Materials',
    produk: 'Tepung Terigu, Gula Pasir',
    rating: 4.2,
    reviewCount: 2,
    status: 'Aktif',
    lastEvaluated: '2024-06-20',
    performanceTrend: 'stable',
    evaluations: [
        { date: '2024-02-20', quality: 4, price: 5, delivery: 4, communication: 4 },
        { date: '2024-06-20', quality: 4, price: 5, delivery: 4, communication: 4 }
    ],
  },
  {
    id: 'v4',
    name: 'Toko Sembako Jaya',
    phone: '021-888-1234',
    email: 'info@sembakojaya.com',
    address: 'Jl. Pangan No. 10, Jakarta',
    category: 'Raw Materials',
    produk: 'Minyak Goreng, Beras',
    rating: 4.5,
    reviewCount: 2,
    status: 'Aktif',
    lastEvaluated: '2024-07-10',
    performanceTrend: 'up',
    evaluations: [
        { date: '2024-05-10', quality: 4, price: 4, delivery: 4, communication: 5 },
        { date: '2024-07-10', quality: 5, price: 4, delivery: 4, communication: 5, comment: 'Harga bersaing, pengiriman cepat.' }
    ],
  },
];

export const useVendors = () => {
  const [vendors, setVendors] = useState<Vendor[]>(initialVendors);

  const addVendor = useCallback((vendorData: NewVendor) => {
    const newVendor: Vendor = {
      ...vendorData,
      email: vendorData.email || '',
      id: `v${Date.now()}`,
      rating: 0,
      reviewCount: 0,
      lastEvaluated: new Date().toISOString().split('T')[0],
      performanceTrend: 'stable',
      evaluations: [],
    };
    setVendors(prev => [newVendor, ...prev]);
  }, []);

  const evaluateVendor = useCallback((vendorId: string, evaluation: Omit<Evaluation, 'date'>) => {
    setVendors(prev =>
      prev.map(vendor => {
        if (vendor.id === vendorId) {
          const newEvals = [...vendor.evaluations, { ...evaluation, date: new Date().toISOString().split('T')[0] }];
          const totalEvals = newEvals.length;
          
          const avgQuality = newEvals.reduce((sum, e) => sum + e.quality, 0) / totalEvals;
          const avgPrice = newEvals.reduce((sum, e) => sum + e.price, 0) / totalEvals;
          const avgDelivery = newEvals.reduce((sum, e) => sum + e.delivery, 0) / totalEvals;
          const avgComm = newEvals.reduce((sum, e) => sum + e.communication, 0) / totalEvals;

          const newRating = (avgQuality + avgPrice + avgDelivery + avgComm) / 4;
          
          let trend: 'up' | 'down' | 'stable' = 'stable';
          if (newRating > vendor.rating) trend = 'up';
          if (newRating < vendor.rating) trend = 'down';

          return {
            ...vendor,
            rating: parseFloat(newRating.toFixed(2)),
            reviewCount: totalEvals,
            lastEvaluated: new Date().toISOString().split('T')[0],
            evaluations: newEvals,
            performanceTrend: trend,
          };
        }
        return vendor;
      })
    );
  }, []);
  
  const updateVendor = useCallback((updatedVendor: Vendor) => {
    setVendors(prev => prev.map(v => v.id === updatedVendor.id ? updatedVendor : v));
  }, []);
  
  const deleteVendor = useCallback((vendorId: string) => {
    setVendors(prev => prev.filter(v => v.id !== vendorId));
  }, []);

  return { vendors, addVendor, evaluateVendor, updateVendor, deleteVendor };
};