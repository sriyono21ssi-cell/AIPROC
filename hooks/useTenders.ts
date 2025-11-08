import { useState } from 'react';
import type { Tender, Bid, ScoringCriterion, BidScore } from 'types';

const initialTenders: Tender[] = [
    {
        id: 't1',
        name: 'Pengadaan ATK Kantor Pusat 2025',
        description: 'Pengadaan alat tulis kantor untuk kebutuhan operasional kantor pusat selama tahun 2025.',
        status: 'Open',
        openDate: '2024-08-01',
        closeDate: '2024-08-30',
        criteria: [
            { id: 'c1', name: 'Harga', weight: 40 },
            { id: 'c2', name: 'Kualitas Produk', weight: 30 },
            { id: 'c3', name: 'Waktu Pengiriman', weight: 20 },
            { id: 'c4', name: 'Reputasi Vendor', weight: 10 },
        ],
        bids: [
            {
                id: 'b1',
                tenderId: 't1',
                vendorId: 'v3',
                vendorName: 'Sumber Bahan Baku',
                submissionDate: '2024-08-10',
                price: 45000000,
                details: [
                    { criterionId: 'c1', value: '45000000' },
                    { criterionId: 'c2', value: 'Sesuai spesifikasi, sertifikasi ISO 9001' },
                    { criterionId: 'c3', value: '7 hari kerja' },
                ],
                scores: [
                    { criterionId: 'c1', score: 8 }, // Score 1-10
                    { criterionId: 'c2', score: 9 },
                    { criterionId: 'c3', score: 7 },
                    { criterionId: 'c4', score: 8 },
                ],
            },
            {
                id: 'b2',
                tenderId: 't1',
                vendorId: 'v4',
                vendorName: 'Toko Sembako Jaya',
                submissionDate: '2024-08-12',
                price: 42500000,
                 details: [
                    { criterionId: 'c1', value: '42500000' },
                    { criterionId: 'c2', value: 'Produk premium, garansi 2 tahun' },
                    { criterionId: 'c3', value: '5 hari kerja' },
                ],
                scores: [
                    { criterionId: 'c1', score: 9 },
                    { criterionId: 'c2', score: 8 },
                    { criterionId: 'c3', score: 8 },
                    { criterionId: 'c4', score: 9 },
                ],
            },
        ],
    },
    {
        id: 't2',
        name: 'Jasa Katering Makan Siang Karyawan',
        description: 'Penyediaan makan siang untuk 100 karyawan setiap hari kerja.',
        status: 'Closed',
        openDate: '2024-07-01',
        closeDate: '2024-07-15',
        criteria: [
            { id: 'c1', name: 'Harga per Porsi', weight: 50 },
            { id: 'c2', name: 'Rasa & Variasi Menu', weight: 30 },
            { id: 'c3', name: 'Kebersihan & Sertifikasi', weight: 20 },
        ],
        bids: [],
    },
];

export const useTenders = () => {
    const [tenders, setTenders] = useState<Tender[]>(initialTenders);

    const addTender = (tender: Omit<Tender, 'id' | 'bids'>) => {
        const newTender: Tender = {
            ...tender,
            id: `t${Date.now()}`,
            bids: [],
        };
        setTenders(prev => [newTender, ...prev]);
    };
    
    const updateTender = (updatedTender: Tender) => {
        setTenders(prev => prev.map(t => t.id === updatedTender.id ? updatedTender : t));
    };

    const addBid = (tenderId: string, bid: Omit<Bid, 'id' | 'tenderId'>) => {
        setTenders(prev => prev.map(t => {
            if (t.id === tenderId) {
                const newBid: Bid = { ...bid, id: `b${Date.now()}`, tenderId };
                return { ...t, bids: [...t.bids, newBid] };
            }
            return t;
        }));
    };

    const updateBidScores = (tenderId: string, bidId: string, scores: Bid['scores']) => {
        setTenders(prev => prev.map(t => {
            if (t.id === tenderId) {
                return {
                    ...t,
                    bids: t.bids.map(b => b.id === bidId ? { ...b, scores } : b),
                };
            }
            return t;
        }));
    };

    return { tenders, addTender, updateTender, addBid, updateBidScores };
};