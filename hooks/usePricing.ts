
import { useState, useMemo, useCallback } from 'react';
import type { PricedItem, NewPricedItem, Vendor } from 'types';

const initialItems: PricedItem[] = [
    {
        id: 'p1',
        name: 'Karton Box Ukuran Sedang',
        category: 'Packaging',
        status: 'Aktif',
        lastPrice: 2600,
        lastVendorId: 'v1',
        lastVendorName: 'PT Sejuk Abadi',
        lastUpdate: '2024-07-10',
        priceTrend: 'up',
        history: [
            { date: '2024-03-10', price: 2400, vendorId: 'v1', vendorName: 'PT Sejuk Abadi' },
            { date: '2024-05-12', price: 2500, vendorId: 'v1', vendorName: 'PT Sejuk Abadi' },
            { date: '2024-07-10', price: 2600, vendorId: 'v1', vendorName: 'PT Sejuk Abadi' }
        ]
    },
    {
        id: 'p2',
        name: 'Tepung Terigu Curah',
        category: 'Raw Materials',
        status: 'Aktif',
        lastPrice: 8300,
        lastVendorId: 'v4',
        lastVendorName: 'Toko Sembako Jaya',
        lastUpdate: '2024-07-20',
        priceTrend: 'down',
        history: [
            { date: '2024-02-15', price: 8000, vendorId: 'v3', vendorName: 'Sumber Bahan Baku' },
            { date: '2024-04-15', price: 8200, vendorId: 'v3', vendorName: 'Sumber Bahan Baku' },
            { date: '2024-06-15', price: 8500, vendorId: 'v3', vendorName: 'Sumber Bahan Baku' },
            { date: '2024-07-20', price: 8300, vendorId: 'v4', vendorName: 'Toko Sembako Jaya' }
        ]
    },
    {
        id: 'p3',
        name: 'Jasa Pengiriman Reguler',
        category: 'Logistics',
        status: 'Aktif',
        lastPrice: 10000,
        lastVendorId: 'v2',
        lastVendorName: 'CV Logistik Cepat',
        lastUpdate: '2024-07-01',
        priceTrend: 'stable',
        history: [
            { date: '2024-01-20', price: 9500, vendorId: 'v2', vendorName: 'CV Logistik Cepat' },
            { date: '2024-04-25', price: 10000, vendorId: 'v2', vendorName: 'CV Logistik Cepat' },
            { date: '2024-07-01', price: 10000, vendorId: 'v2', vendorName: 'CV Logistik Cepat' },
        ]
    }
];

export const usePricing = (vendors: Vendor[]) => {
    const [pricedItems, setPricedItems] = useState<PricedItem[]>(initialItems);
    
    const vendorMap = useMemo(() => {
        return new Map(vendors.map(v => [v.id, v.name]));
    }, [vendors]);

    const addItem = useCallback((itemData: NewPricedItem) => {
        const vendorName = vendorMap.get(itemData.vendorId) || 'Unknown Vendor';
        const date = new Date().toISOString().split('T')[0];

        const newItem: PricedItem = {
            id: `p${Date.now()}`,
            name: itemData.name,
            category: itemData.category,
            status: itemData.status,
            lastPrice: itemData.initialPrice,
            lastVendorId: itemData.vendorId,
            lastVendorName: vendorName,
            lastUpdate: date,
            priceTrend: 'stable',
            history: [
                { date, price: itemData.initialPrice, vendorId: itemData.vendorId, vendorName }
            ]
        };
        setPricedItems(prev => [newItem, ...prev]);
    }, [vendorMap]);
    
    const updateItemPrice = useCallback((itemId: string, newPrice: number, vendorId: string) => {
        setPricedItems(prev => prev.map(item => {
            if (item.id === itemId) {
                const date = new Date().toISOString().split('T')[0];
                const vendorName = vendorMap.get(vendorId) || 'Unknown Vendor';
                
                let trend: 'up' | 'down' | 'stable' = 'stable';
                if (newPrice > item.lastPrice) trend = 'up';
                if (newPrice < item.lastPrice) trend = 'down';

                return {
                    ...item,
                    lastPrice: newPrice,
                    lastVendorId: vendorId,
                    lastVendorName: vendorName,
                    lastUpdate: date,
                    priceTrend: trend,
                    // FIX: Removed duplicate vendorId property from the history object.
                    history: [...item.history, { date, price: newPrice, vendorId, vendorName }]
                };
            }
            return item;
        }));
    }, [vendorMap]);

    const editItem = useCallback((updatedItem: Omit<PricedItem, 'history' | 'priceTrend' | 'lastPrice' | 'lastUpdate' | 'lastVendorId' | 'lastVendorName'>) => {
         setPricedItems(prev => prev.map(item => {
            if (item.id === updatedItem.id) {
                return { ...item, ...updatedItem };
            }
            return item;
         }));
    }, []);

    const deleteItem = useCallback((itemId: string) => {
        setPricedItems(prev => prev.filter(item => item.id !== itemId));
    }, []);

    return { pricedItems, addItem, updateItemPrice, editItem, deleteItem };
};