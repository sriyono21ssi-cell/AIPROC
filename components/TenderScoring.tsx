
import React, { useState, useMemo, useEffect } from 'react';
import type { Tender, Vendor, Bid, ScoringCriterion, BidScore, BidDetail } from '../types';
import { generateBidScores } from '../services/geminiService';

interface TenderScoringProps {
    tenders: Tender[];
    vendors: Vendor[];
    addTender: (tender: Omit<Tender, 'id' | 'bids'>) => void;
    updateTender: (tender: Tender) => void;
    addBid: (tenderId: string, bid: Omit<Bid, 'id' | 'tenderId'>) => void;
    updateBidScores: (tenderId: string, bidId: string, scores: Bid['scores']) => void;
}

// Helper to calculate weighted score
const calculateWeightedScore = (bid: Bid, criteria: ScoringCriterion[]): number => {
    if (!bid.scores || bid.scores.length === 0 || criteria.length === 0) {
        return 0;
    }

    const criteriaMap = new Map(criteria.map(c => [c.id, c.weight]));
    
    let totalScore = 0;
    let totalWeight = 0;

    for (const score of bid.scores) {
        const weight = criteriaMap.get(score.criterionId);
        if (weight !== undefined) {
            // Assuming score is out of 10
            totalScore += (score.score / 10) * weight;
            totalWeight += weight;
        }
    }
    
    // Normalize in case total weight is not 100
    return totalWeight > 0 ? (totalScore / totalWeight) * 100 : 0;
};

// --- Sub-components defined outside the main component to prevent re-rendering issues ---

const TenderCard: React.FC<{ tender: Tender; onClick: () => void }> = ({ tender, onClick }) => (
    <div 
        className="bg-white p-6 rounded-xl shadow-md cursor-pointer hover:shadow-lg hover:border-primary border-2 border-transparent transition-all"
        onClick={onClick}
    >
        <div className="flex justify-between items-start">
            <h3 className="text-xl font-bold text-neutral">{tender.name}</h3>
            <span className={`px-3 py-1 text-sm font-semibold rounded-full ${
                tender.status === 'Open' ? 'bg-green-100 text-green-800' :
                tender.status === 'Closed' ? 'bg-yellow-100 text-yellow-800' :
                'bg-blue-100 text-blue-800'
            }`}>
                {tender.status}
            </span>
        </div>
        <p className="text-gray-600 mt-2 line-clamp-2">{tender.description}</p>
        <div className="flex justify-between items-end mt-4 text-sm text-gray-500">
            <div>
                <p>Tutup: <strong>{tender.closeDate}</strong></p>
                <p>Jumlah Penawaran: <strong>{tender.bids.length}</strong></p>
            </div>
            <button className="text-primary font-semibold hover:underline">Lihat Detail</button>
        </div>
    </div>
);

const TenderDetailView: React.FC<{
    tender: Tender;
    onBack: () => void;
    onEdit: () => void;
    onAddBid: () => void;
    onScoreBid: (bid: Bid) => void;
    onAward: () => void;
}> = ({ tender, onBack, onEdit, onAddBid, onScoreBid, onAward }) => {
    const rankedBids = useMemo(() => {
        return tender.bids
            .map(bid => ({
                ...bid,
                weightedScore: calculateWeightedScore(bid, tender.criteria),
            }))
            .sort((a, b) => b.weightedScore - a.weightedScore);
    }, [tender.bids, tender.criteria]);

    return (
         <div className="space-y-6">
            <button onClick={onBack} className="text-primary font-semibold hover:underline">&larr; Kembali ke Daftar Tender</button>
            <div className="bg-white p-6 rounded-xl shadow-md">
                <div className="flex justify-between items-start flex-wrap gap-4">
                    <div>
                        <h2 className="text-3xl font-bold text-neutral">{tender.name}</h2>
                        <p className="text-gray-600 mt-2">{tender.description}</p>
                        <div className="flex space-x-8 mt-4 text-sm">
                            <p>Status: <strong className="text-black">{tender.status}</strong></p>
                            <p>Tanggal Buka: <strong className="text-black">{tender.openDate}</strong></p>
                            <p>Tanggal Tutup: <strong className="text-black">{tender.closeDate}</strong></p>
                        </div>
                    </div>
                    <div className="flex items-center space-x-2 flex-shrink-0">
                        <button onClick={onEdit} className="bg-gray-200 text-gray-800 font-bold py-2 px-4 rounded-lg hover:bg-gray-300 transition-colors text-sm">
                            Edit Tender
                        </button>
                        {tender.status === 'Open' && rankedBids.length > 0 && (
                            <button onClick={onAward} className="bg-success text-white font-bold py-2 px-4 rounded-lg hover:bg-green-600 transition-colors text-sm">
                                Award Tender
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {tender.status === 'Awarded' && tender.winningVendorName && (
                <div className="bg-green-100 border-l-4 border-green-500 text-green-800 p-4 rounded-r-lg my-4" role="status">
                    <p className="font-bold text-lg flex items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        Pemenang Tender: {tender.winningVendorName}
                    </p>
                </div>
            )}

            <div className="bg-white p-6 rounded-xl shadow-md">
                <h3 className="text-2xl font-semibold text-neutral mb-4">Kriteria Penilaian</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                   {tender.criteria.map(c => (
                       <div key={c.id} className="bg-base-100 p-3 rounded-lg text-center">
                           <p className="font-semibold text-neutral">{c.name}</p>
                           <p className="text-2xl font-bold text-primary">{c.weight}%</p>
                       </div>
                   ))}
                </div>
            </div>

            <div className="bg-white p-2 sm:p-6 rounded-xl shadow-md overflow-x-auto">
                <div className="flex justify-between items-center mb-4 px-4 sm:px-0">
                    <h3 className="text-2xl font-semibold text-neutral">Hasil Penilaian Penawaran</h3>
                    {tender.status === 'Open' && (
                        <button onClick={onAddBid} className="bg-secondary text-white font-bold py-2 px-4 rounded-lg hover:bg-blue-600 transition-colors text-sm">
                            + Tambah Penawaran
                        </button>
                    )}
                </div>
                <table className="w-full min-w-[1000px] text-left">
                     <thead>
                        <tr className="border-b-2 border-base-300 bg-base-100">
                            <th className="p-4 font-semibold text-neutral">Peringkat</th>
                            <th className="p-4 font-semibold text-neutral">Nama Vendor</th>
                            <th className="p-4 font-semibold text-neutral">Harga Penawaran</th>
                            {tender.criteria.map(c => <th key={c.id} className="p-4 font-semibold text-center text-neutral">{c.name}</th>)}
                            <th className="p-4 font-semibold text-center text-neutral">Skor Akhir</th>
                            <th className="p-4 font-semibold text-neutral">Aksi</th>
                        </tr>
                    </thead>
                    <tbody>
                        {rankedBids.map((bid, index) => {
                            const bidScores = new Map(bid.scores.map(s => [s.criterionId, s.score]));
                            const isWinner = index === 0 && bid.weightedScore > 0 && tender.status !== 'Open';
                            return (
                            <tr key={bid.id} className={`border-b border-base-200 hover:bg-gray-50 ${isWinner ? 'bg-green-50' : ''}`}>
                                <td className="p-4 font-bold text-lg text-center text-black">
                                    {isWinner ? '🏆' : ''} {index + 1}
                                </td>
                                <td className="p-4 font-semibold text-black">{bid.vendorName}</td>
                                <td className="p-4 text-black">Rp {bid.price.toLocaleString('id-ID')}</td>
                                {tender.criteria.map(c => (
                                    <td key={c.id} className="p-4 text-center text-black">{bidScores.get(c.id) || '-'}</td>
                                ))}
                                <td className="p-4 font-bold text-xl text-center text-primary">{bid.weightedScore.toFixed(2)}</td>
                                <td className="p-4">
                                    <button onClick={() => onScoreBid(bid)} className="text-sm bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600 disabled:bg-gray-400" disabled={tender.status !== 'Open'}>
                                        Nilai
                                    </button>
                                </td>
                            </tr>
                        )})}
                    </tbody>
                </table>
                 {rankedBids.length === 0 && (
                    <div className="text-center p-8 text-gray-500">
                        Belum ada penawaran yang masuk untuk tender ini.
                    </div>
                 )}
            </div>
        </div>
    );
};

const TenderScoring: React.FC<TenderScoringProps> = ({ tenders, vendors, addTender, updateTender, addBid, updateBidScores }) => {
    const [selectedTender, setSelectedTender] = useState<Tender | null>(null);

    // Modal states
    const [showAddTenderModal, setShowAddTenderModal] = useState(false);
    const [editingTender, setEditingTender] = useState<Tender | null>(null);
    const [showAddBidModal, setShowAddBidModal] = useState(false);
    const [showScoreBidModal, setShowScoreBidModal] = useState<Bid | null>(null);

    // Add/Edit Tender form state
    const [tenderName, setTenderName] = useState('');
    const [tenderDesc, setTenderDesc] = useState('');
    const [tenderStatus, setTenderStatus] = useState<'Open' | 'Closed' | 'Awarded'>('Open');
    const [tenderOpenDate, setTenderOpenDate] = useState(new Date().toISOString().split('T')[0]);
    const [tenderCloseDate, setTenderCloseDate] = useState(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);
    const [tenderCriteria, setTenderCriteria] = useState<ScoringCriterion[]>([{ id: `c${Date.now()}`, name: 'Harga', weight: 100 }]);

    // Add Bid form state
    const [bidVendorId, setBidVendorId] = useState('');
    const [bidDetails, setBidDetails] = useState<Record<string, string>>({});
    const [isSubmittingBid, setIsSubmittingBid] = useState(false);

    // Score Bid form state
    const [currentScores, setCurrentScores] = useState<BidScore[]>([]);

    const totalWeight = useMemo(() => tenderCriteria.reduce((sum, c) => sum + (Number(c.weight) || 0), 0), [tenderCriteria]);

    // FIX: Add useEffect to keep selectedTender in sync with the master 'tenders' list from props.
    // This ensures the view updates automatically after actions like adding a bid or awarding the tender.
    useEffect(() => {
        if (selectedTender) {
            const updatedTenderInList = tenders.find(t => t.id === selectedTender.id);
            if (updatedTenderInList) {
                // Prevent infinite loops by comparing stringified versions.
                if (JSON.stringify(selectedTender) !== JSON.stringify(updatedTenderInList)) {
                    setSelectedTender(updatedTenderInList);
                }
            } else {
                // If the tender is no longer in the list (e.g., deleted), reset the view.
                setSelectedTender(null);
            }
        }
    }, [tenders, selectedTender?.id]);

    // --- Tender Modal Handlers ---
    const handleOpenAddTenderModal = (tenderToEdit: Tender | null = null) => {
        setEditingTender(tenderToEdit);
        if (tenderToEdit) {
            setTenderName(tenderToEdit.name);
            setTenderDesc(tenderToEdit.description);
            setTenderStatus(tenderToEdit.status);
            setTenderOpenDate(tenderToEdit.openDate);
            setTenderCloseDate(tenderToEdit.closeDate);
            setTenderCriteria(tenderToEdit.criteria.length > 0 ? tenderToEdit.criteria : [{ id: `c${Date.now()}`, name: 'Harga', weight: 100 }]);
        } else {
            setTenderName('');
            setTenderDesc('');
            setTenderStatus('Open');
            setTenderOpenDate(new Date().toISOString().split('T')[0]);
            setTenderCloseDate(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);
            setTenderCriteria([{ id: `c${Date.now()}`, name: 'Harga', weight: 100 }]);
        }
        setShowAddTenderModal(true);
    };

    const handleTenderSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (totalWeight !== 100) {
            alert('Total bobot kriteria harus 100%.');
            return;
        }
        const tenderData = { name: tenderName, description: tenderDesc, status: tenderStatus, openDate: tenderOpenDate, closeDate: tenderCloseDate, criteria: tenderCriteria };
        if (editingTender) {
            updateTender({ ...editingTender, ...tenderData });
        } else {
            addTender(tenderData);
        }
        setShowAddTenderModal(false);
    };
    
    // --- Criteria Handlers (in Tender Modal) ---
    const handleCriterionChange = (index: number, field: 'name' | 'weight', value: string) => {
        const newCriteria = [...tenderCriteria];
        newCriteria[index] = { ...newCriteria[index], [field]: field === 'weight' ? Number(value) : value };
        setTenderCriteria(newCriteria);
    };
    const handleAddCriterion = () => {
        setTenderCriteria([...tenderCriteria, { id: `c${Date.now()}`, name: '', weight: 0 }]);
    };
    const handleRemoveCriterion = (index: number) => {
        if (tenderCriteria.length > 1) {
            setTenderCriteria(tenderCriteria.filter((_, i) => i !== index));
        } else {
            alert("Harus ada minimal satu kriteria.");
        }
    };
    
    // --- Bid Modal Handlers ---
    const handleOpenAddBidModal = () => {
        if (!selectedTender) return;
        setBidVendorId(vendors.length > 0 ? vendors[0].id : '');
        
        const initialDetails: Record<string, string> = {};
        selectedTender.criteria.forEach(c => {
            if (!c.name.toLowerCase().includes('reputasi')) {
                 initialDetails[c.id] = '';
            }
        });
        setBidDetails(initialDetails);
        setShowAddBidModal(true);
    };

    const handleBidDetailChange = (criterionId: string, value: string) => {
        setBidDetails(prev => ({ ...prev, [criterionId]: value }));
    };

    const handleAddBidSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedTender || !bidVendorId) return;

        const vendor = vendors.find(v => v.id === bidVendorId);
        if (!vendor) return;

        setIsSubmittingBid(true);

        try {
            // FIX: Explicitly convert the value from `Object.entries` to a string to satisfy the BidDetail type.
            const detailsArray: BidDetail[] = Object.entries(bidDetails).map(([criterionId, value]) => ({
                criterionId,
                value: String(value),
            }));
            
            const priceCriterion = selectedTender.criteria.find(c => c.name.toLowerCase().includes('harga'));
            const priceValue = priceCriterion ? Number(bidDetails[priceCriterion.id] || 0) : 0;
            
            const generatedScores = await generateBidScores(
                selectedTender, 
                { vendor, details: detailsArray }, 
                selectedTender.bids
            );

            if (generatedScores.length === 0) {
                alert("Gagal mendapatkan skor otomatis dari AI. Silakan coba lagi atau nilai secara manual.");
                setIsSubmittingBid(false);
                return;
            }

            const newBidData: Omit<Bid, 'id' | 'tenderId'> = {
                vendorId: bidVendorId,
                vendorName: vendor.name,
                submissionDate: new Date().toISOString().split('T')[0],
                price: priceValue,
                details: detailsArray,
                scores: generatedScores,
            };

            addBid(selectedTender.id, newBidData);
            setShowAddBidModal(false);

        } catch (error) {
            console.error("Failed to add bid:", error);
            alert("Terjadi kesalahan saat menambahkan penawaran.");
        } finally {
            setIsSubmittingBid(false);
        }
    };

    // --- Score Modal Handlers ---
    const handleOpenScoreModal = (bid: Bid) => {
        setCurrentScores(bid.scores);
        setShowScoreBidModal(bid);
    };

    const handleScoreChange = (criterionId: string, scoreValue: number) => {
        setCurrentScores(prevScores => {
            const existingScoreIndex = prevScores.findIndex(s => s.criterionId === criterionId);
            if (existingScoreIndex > -1) {
                const updatedScores = [...prevScores];
                updatedScores[existingScoreIndex] = { ...updatedScores[existingScoreIndex], score: scoreValue };
                return updatedScores;
            } else {
                return [...prevScores, { criterionId, score: scoreValue }];
            }
        });
    };

    const handleScoreSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (selectedTender && showScoreBidModal) {
            updateBidScores(selectedTender.id, showScoreBidModal.id, currentScores);
        }
        setShowScoreBidModal(null);
    };

    const handleAwardTender = () => {
        if (!selectedTender || selectedTender.bids.length === 0) return;

        const rankedBids = selectedTender.bids
            .map(bid => ({
                ...bid,
                weightedScore: calculateWeightedScore(bid, selectedTender.criteria),
            }))
            .sort((a, b) => b.weightedScore - a.weightedScore);

        const winner = rankedBids[0];
        if (!winner || winner.weightedScore === 0) {
            alert("Tidak dapat menentukan pemenang. Pastikan penawaran sudah dinilai.");
            return;
        }

        if (window.confirm(`Yakin ingin memberikan tender ini kepada ${winner.vendorName}? Tindakan ini akan mengubah status tender menjadi "Awarded" dan tidak dapat dibatalkan.`)) {
            const updatedTenderData: Tender = {
                ...selectedTender,
                status: 'Awarded',
                winningVendorId: winner.vendorId,
                winningVendorName: winner.vendorName,
            };
            updateTender(updatedTenderData);
        }
    };
    
    return (
        <>
            <div className="space-y-6">
                {selectedTender ? (
                    <TenderDetailView 
                        tender={selectedTender} 
                        onBack={() => setSelectedTender(null)}
                        onEdit={() => handleOpenAddTenderModal(selectedTender)}
                        onAddBid={handleOpenAddBidModal}
                        onScoreBid={handleOpenScoreModal}
                        onAward={handleAwardTender}
                    />
                ) : (
                    <>
                        <div className="flex justify-between items-center">
                            <h1 className="text-4xl font-bold text-neutral">Tender Scoring</h1>
                            <button onClick={() => handleOpenAddTenderModal()} className="bg-primary text-white font-bold py-2 px-4 rounded-lg hover:bg-primary-focus transition-colors">
                                + Buat Tender Baru
                            </button>
                        </div>
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {tenders.map(tender => <TenderCard key={tender.id} tender={tender} onClick={() => setSelectedTender(tender)} />)}
                        </div>
                    </>
                )}
            </div>

            {/* Add/Edit Tender Modal */}
            {showAddTenderModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
                    <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col">
                        <h2 className="text-2xl font-bold mb-6 text-neutral flex-shrink-0">{editingTender ? 'Edit' : 'Buat'} Tender</h2>
                        <form onSubmit={handleTenderSubmit} className="flex-1 flex flex-col min-h-0">
                            <div className="space-y-4 overflow-y-auto flex-1 pr-2">
                                <input type="text" placeholder="Nama Tender" value={tenderName} onChange={e => setTenderName(e.target.value)} required className="w-full p-2 border rounded bg-gray-100 text-black" />
                                <textarea placeholder="Deskripsi Tender" value={tenderDesc} onChange={e => setTenderDesc(e.target.value)} required className="w-full p-2 border rounded bg-gray-100 text-black h-24"></textarea>
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                    <select value={tenderStatus} onChange={e => setTenderStatus(e.target.value as any)} className="w-full p-2 border rounded bg-gray-100 text-black">
                                        <option value="Open">Open</option>
                                        <option value="Closed">Closed</option>
                                        <option value="Awarded">Awarded</option>
                                    </select>
                                    <div>
                                        <label className="text-sm">Tanggal Buka</label>
                                        <input type="date" value={tenderOpenDate} onChange={e => setTenderOpenDate(e.target.value)} required className="w-full p-2 border rounded bg-gray-100 text-black" />
                                    </div>
                                     <div>
                                        <label className="text-sm">Tanggal Tutup</label>
                                        <input type="date" value={tenderCloseDate} onChange={e => setTenderCloseDate(e.target.value)} required className="w-full p-2 border rounded bg-gray-100 text-black" />
                                    </div>
                                </div>
                                
                                <div className="pt-4">
                                    <h3 className="text-lg font-semibold mb-2">Kriteria Penilaian (Total Bobot: <span className={totalWeight === 100 ? 'text-success' : 'text-error'}>{totalWeight}%</span>)</h3>
                                    {tenderCriteria.map((c, index) => (
                                        <div key={c.id} className="flex items-center space-x-2 mb-2">
                                            <input type="text" placeholder="Nama Kriteria" value={c.name} onChange={e => handleCriterionChange(index, 'name', e.target.value)} required className="flex-1 p-2 border rounded bg-gray-100 text-black" />
                                            <input type="number" placeholder="Bobot %" value={c.weight} onChange={e => handleCriterionChange(index, 'weight', e.target.value)} required className="w-24 p-2 border rounded bg-gray-100 text-black" />
                                            <button type="button" onClick={() => handleRemoveCriterion(index)} className="p-2 bg-red-500 text-white rounded">&times;</button>
                                        </div>
                                    ))}
                                    <button type="button" onClick={handleAddCriterion} className="text-sm text-primary font-semibold mt-2">+ Tambah Kriteria</button>
                                </div>
                            </div>
                            <div className="flex justify-end space-x-4 pt-6 flex-shrink-0">
                                <button type="button" onClick={() => setShowAddTenderModal(false)} className="px-4 py-2 bg-gray-200 rounded">Batal</button>
                                <button type="submit" className="px-4 py-2 bg-primary text-white rounded">{editingTender ? 'Simpan' : 'Buat'}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
            
            {/* Add Bid Modal */}
            {showAddBidModal && selectedTender && (
                 <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
                   <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-lg max-h-[90vh] flex flex-col">
                     <h2 className="text-2xl font-bold mb-6 text-neutral">Tambah Penawaran</h2>
                     <form onSubmit={handleAddBidSubmit} className="flex-1 flex flex-col min-h-0">
                        <div className="space-y-4 overflow-y-auto flex-1 pr-2">
                            <div>
                                <label htmlFor="bid-vendor" className="block text-sm font-medium text-gray-700">Vendor</label>
                                <select id="bid-vendor" value={bidVendorId} onChange={e => setBidVendorId(e.target.value)} required className="w-full p-2 border rounded bg-gray-100 text-black mt-1">
                                    <option value="" disabled>Pilih Vendor</option>
                                    {vendors.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
                                </select>
                            </div>
                            
                            {selectedTender.criteria
                                .filter(c => !c.name.toLowerCase().includes('reputasi'))
                                .map(criterion => (
                                <div key={criterion.id}>
                                    <label htmlFor={`bid-detail-${criterion.id}`} className="block text-sm font-medium text-gray-700">{criterion.name}</label>
                                    <input
                                        id={`bid-detail-${criterion.id}`}
                                        type={criterion.name.toLowerCase().includes('harga') ? 'number' : 'text'}
                                        placeholder={`Input untuk ${criterion.name}`}
                                        value={bidDetails[criterion.id] || ''}
                                        onChange={e => handleBidDetailChange(criterion.id, e.target.value)}
                                        required
                                        className="w-full p-2 border rounded bg-gray-100 text-black mt-1"
                                    />
                                </div>
                            ))}
                        </div>
                       <div className="flex justify-end space-x-4 pt-6 flex-shrink-0">
                         <button type="button" onClick={() => setShowAddBidModal(false)} className="px-4 py-2 bg-gray-200 rounded">Batal</button>
                         <button type="submit" disabled={isSubmittingBid} className="px-4 py-2 bg-primary text-white rounded w-28">
                            {isSubmittingBid ? (
                                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mx-auto"></div>
                            ) : 'Tambah'}
                         </button>
                       </div>
                     </form>
                   </div>
                 </div>
            )}
            
            {/* Score Bid Modal */}
            {showScoreBidModal && selectedTender && (
                 <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
                   <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-lg max-h-[90vh] flex flex-col">
                     <h2 className="text-2xl font-bold mb-2">Beri Nilai: {showScoreBidModal.vendorName}</h2>
                     <p className="mb-6 text-gray-600">Tender: {selectedTender.name}</p>
                     <form onSubmit={handleScoreSubmit} className="flex-1 flex flex-col min-h-0">
                        <div className="space-y-4 overflow-y-auto flex-1 pr-2">
                            {selectedTender.criteria.map(criterion => {
                               const currentScore = currentScores.find(s => s.criterionId === criterion.id)?.score || 0;
                               return (
                                   <div key={criterion.id}>
                                       <label className="block mb-1 font-semibold">{criterion.name} ({criterion.weight}%): <span className="text-primary font-bold">{currentScore}</span></label>
                                       <input 
                                           type="range" 
                                           min="0" max="10" step="1" 
                                           value={currentScore}
                                           onChange={e => handleScoreChange(criterion.id, parseInt(e.target.value))}
                                           className="w-full"
                                        />
                                   </div>
                               )
                            })}
                        </div>
                        <div className="flex justify-end space-x-4 pt-6 flex-shrink-0">
                             <button type="button" onClick={() => setShowScoreBidModal(null)} className="px-4 py-2 bg-gray-200 rounded">Batal</button>
                             <button type="submit" className="px-4 py-2 bg-primary text-white rounded">Simpan Nilai</button>
                        </div>
                     </form>
                   </div>
                 </div>
            )}
        </>
    );
};

export default TenderScoring;