
import React, { useState, useMemo, useRef } from 'react';
import type { PricedItem, NewPricedItem, Vendor } from '../types';
import { TrendingUpIcon } from './icons/TrendingUpIcon';
import { TrendingDownIcon } from './icons/TrendingDownIcon';
import { MinusIcon } from './icons/MinusIcon';
import PriceComparison from './PriceComparison';

interface PricingProps {
  pricedItems: PricedItem[];
  vendors: Vendor[];
  addItem: (itemData: NewPricedItem) => void;
  updateItemPrice: (itemId: string, newPrice: number, vendorId: string) => void;
  editItem: (itemData: Omit<PricedItem, 'history' | 'priceTrend' | 'lastPrice' | 'lastUpdate' | 'lastVendorId' | 'lastVendorName'>) => void;
  deleteItem: (itemId: string) => void;
}

const parseCsvForPricing = (csv: string): any[] => {
    const lines = csv.split('\n').filter(line => line.trim() !== '');
    if (lines.length < 2) return [];
    const headers = lines[0].trim().split(',').map(h => h.trim().replace(/"/g, '').toLowerCase());
    
    // Use flexible naming for import to match common column names
    const headerMap: Record<string, string> = {
        'nama barang': 'name', 'name': 'name', 'item name': 'name',
        'kategori': 'category', 'category': 'category',
        'status': 'status',
        'harga terakhir': 'price', 'last price': 'price', 'price': 'price',
        'vendor terakhir': 'vendorName', 'last vendor': 'vendorName', 'vendor': 'vendorName'
    };

    const mappedHeaders = headers.map(h => Object.keys(headerMap).find(key => h.includes(key)) || h);
    
    const result: any[] = [];
    for (let i = 1; i < lines.length; i++) {
        const obj: Record<string, any> = {};
        const values = lines[i].trim().split(','); // Simple CSV split
        mappedHeaders.forEach((headerKey, index) => {
             const key = headerMap[headerKey] || headerKey;
             if (values[index]) obj[key] = values[index].trim();
        });
        if (obj.name && obj.price && obj.vendorName) {
            result.push(obj);
        }
    }
    return result;
}


const Pricing: React.FC<PricingProps> = ({ pricedItems, vendors, addItem, updateItemPrice, editItem, deleteItem }) => {
    const [showAddModal, setShowAddModal] = useState(false);
    const [showUpdateModal, setShowUpdateModal] = useState<PricedItem | null>(null);
    const [showHistoryModal, setShowHistoryModal] = useState<PricedItem | null>(null);
    const [editingItem, setEditingItem] = useState<PricedItem | null>(null);
    const [showCompareModal, setShowCompareModal] = useState<PricedItem | null>(null);

    // Form state for add/edit
    const [name, setName] = useState('');
    const [category, setCategory] = useState('');
    const [status, setStatus] = useState<'Aktif' | 'Nonaktif'>('Aktif');
    const [initialPrice, setInitialPrice] = useState('');
    const [initialVendor, setInitialVendor] = useState('');

    // Form state for update price
    const [newPrice, setNewPrice] = useState('');
    const [updateVendorId, setUpdateVendorId] = useState('');
    
    // Filter and search states
    const [searchQuery, setSearchQuery] = useState('');
    const [filterCategory, setFilterCategory] = useState('');
    const [filterStatus, setFilterStatus] = useState<'Aktif' | 'Nonaktif' | ''>('');
    const [filterVendor, setFilterVendor] = useState('');
    const [filterTrend, setFilterTrend] = useState<'up' | 'down' | 'stable' | ''>('');
    const fileInputRef = useRef<HTMLInputElement>(null);

    const categories = useMemo(() => {
        const allCategories = pricedItems.map(i => i.category);
        return [...new Set(allCategories)].sort();
    }, [pricedItems]);

    const uniqueVendors = useMemo(() => {
        const vendorIds = new Set(pricedItems.map(item => item.lastVendorId));
        return vendors.filter(v => vendorIds.has(v.id)).sort((a,b) => a.name.localeCompare(b.name));
    }, [pricedItems, vendors]);

    const filteredItems = useMemo(() => {
        return pricedItems.filter(item => {
            if (searchQuery && !item.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
            if (filterCategory && item.category !== filterCategory) return false;
            if (filterStatus && item.status !== filterStatus) return false;
            if (filterVendor && item.lastVendorId !== filterVendor) return false;
            if (filterTrend && item.priceTrend !== filterTrend) return false;
            return true;
        });
    }, [pricedItems, searchQuery, filterCategory, filterStatus, filterVendor, filterTrend]);
    
    const resetFilters = () => {
        setSearchQuery('');
        setFilterCategory('');
        setFilterStatus('');
        setFilterVendor('');
        setFilterTrend('');
    };

    const openAddModal = (itemToEdit: PricedItem | null = null) => {
        setEditingItem(itemToEdit);
        if (itemToEdit) {
            setName(itemToEdit.name);
            setCategory(itemToEdit.category);
            setStatus(itemToEdit.status);
            setInitialPrice(''); // Not editable here
            setInitialVendor('');
        } else {
            setName('');
            setCategory('');
            setStatus('Aktif');
            setInitialPrice('');
            setInitialVendor(vendors[0]?.id || '');
        }
        setShowAddModal(true);
    };

    const handleAddOrEditSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (editingItem) {
            editItem({ id: editingItem.id, name, category, status });
        } else {
            if (!initialPrice || !initialVendor) return;
            addItem({ name, category, status, initialPrice: parseFloat(initialPrice), vendorId: initialVendor });
        }
        setShowAddModal(false);
    };
    
    const openUpdateModal = (item: PricedItem) => {
        setNewPrice('');
        setUpdateVendorId(item.lastVendorId || vendors[0]?.id || '');
        setShowUpdateModal(item);
    };

    const handleUpdatePriceSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (showUpdateModal && newPrice) {
            updateItemPrice(showUpdateModal.id, parseFloat(newPrice), updateVendorId);
            setShowUpdateModal(null);
        }
    };
    
    const handleDelete = (item: PricedItem) => {
        if(window.confirm(`Yakin ingin menghapus data harga untuk "${item.name}"?`)) {
            deleteItem(item.id);
        }
    };

    const handleExportCSV = () => {
        if (filteredItems.length === 0) {
          alert("Tidak ada data harga untuk diekspor (sesuai filter saat ini).");
          return;
        }
    
        const headers = ['ID', 'Nama Barang', 'Kategori', 'Status', 'Harga Terakhir', 'Vendor Terakhir', 'Update Terakhir', 'Tren Harga'];
        const rows = filteredItems.map(i => [
          i.id,
          `"${i.name.replace(/"/g, '""')}"`,
          `"${i.category.replace(/"/g, '""')}"`,
          i.status,
          i.lastPrice,
          `"${i.lastVendorName.replace(/"/g, '""')}"`,
          i.lastUpdate,
          i.priceTrend
        ].join(','));
    
        const csvContent = "data:text/csv;charset=utf-8," + [headers.join(','), ...rows].join('\n');
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", "pricing_data.csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleImportCSV = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const text = e.target?.result as string;
                const newItemsData = parseCsvForPricing(text);
                if (newItemsData.length > 0) {
                    if (window.confirm(`Found ${newItemsData.length} items in the file. Do you want to add them? Invalid vendors will be skipped.`)) {
                        let importedCount = 0;
                        newItemsData.forEach(item => {
                            const vendor = vendors.find(v => v.name.toLowerCase() === item.vendorName?.toLowerCase());
                            if (vendor && item.name && item.price) {
                                const newItem: NewPricedItem = {
                                    name: item.name,
                                    category: item.category || 'Uncategorized',
                                    status: ['Aktif', 'Nonaktif'].includes(item.status) ? item.status : 'Aktif',
                                    initialPrice: parseFloat(item.price),
                                    vendorId: vendor.id,
                                };
                                addItem(newItem);
                                importedCount++;
                            }
                        });
                        alert(`${importedCount} of ${newItemsData.length} items imported successfully.`);
                    }
                } else {
                    alert("No valid item data found in the file or headers are incorrect.");
                }
            } catch (error) {
                console.error("CSV Import Error:", error);
                alert("An error occurred while parsing the file.");
            }
        };
        reader.readAsText(file);
        if (event.target) {
            event.target.value = '';
        }
    };

    const TrendIcon = ({ trend }: { trend: 'up' | 'down' | 'stable' }) => {
        const icon = {
            up: <TrendingUpIcon className="w-5 h-5 text-error" />,
            down: <TrendingDownIcon className="w-5 h-5 text-success" />,
            stable: <MinusIcon className="w-5 h-5 text-gray-500" />,
        }[trend];
        return <div className="flex items-center justify-center">{icon}</div>;
    };

    return (
        <div className="space-y-6">
            <input type="file" accept=".csv" ref={fileInputRef} onChange={handleImportCSV} className="hidden" />
            <div className="flex justify-between items-center flex-wrap gap-4">
                {/* Title removed as per request */}
                <div/>
                <div className="flex space-x-2">
                    <button onClick={() => fileInputRef.current?.click()} className="bg-blue-500 text-white font-bold py-2 px-4 rounded-lg hover:bg-blue-600 transition-colors">
                        Import CSV
                    </button>
                    <button onClick={handleExportCSV} className="bg-success text-white font-bold py-2 px-4 rounded-lg hover:bg-green-600 transition-colors">
                        Export CSV
                    </button>
                    <button onClick={() => openAddModal()} className="bg-primary text-white font-bold py-2 px-4 rounded-lg hover:bg-primary-focus transition-colors">
                        + Tambah Barang
                    </button>
                </div>
            </div>

            <div className="bg-white p-4 rounded-xl shadow-md space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-4 items-end">
                    <div className="xl:col-span-2">
                        <label htmlFor="search-item" className="block text-sm font-medium text-gray-700">Nama Barang</label>
                        <input id="search-item" type="text" placeholder="Cari nama barang..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm rounded-md bg-gray-100 text-black"/>
                    </div>
                    <div>
                        <label htmlFor="filter-category" className="block text-sm font-medium text-gray-700">Kategori</label>
                        <select id="filter-category" value={filterCategory} onChange={e => setFilterCategory(e.target.value)} className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm rounded-md bg-gray-100 text-black">
                            <option value="">Semua</option>
                            {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                        </select>
                    </div>
                    <div>
                        <label htmlFor="filter-status" className="block text-sm font-medium text-gray-700">Status</label>
                        <select id="filter-status" value={filterStatus} onChange={e => setFilterStatus(e.target.value as any)} className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm rounded-md bg-gray-100 text-black">
                            <option value="">Semua</option>
                            <option value="Aktif">Aktif</option>
                            <option value="Nonaktif">Nonaktif</option>
                        </select>
                    </div>
                    <div>
                        <label htmlFor="filter-vendor" className="block text-sm font-medium text-gray-700">Vendor Terakhir</label>
                        <select id="filter-vendor" value={filterVendor} onChange={e => setFilterVendor(e.target.value)} className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm rounded-md bg-gray-100 text-black">
                            <option value="">Semua</option>
                            {uniqueVendors.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
                        </select>
                    </div>
                    <div>
                        <label htmlFor="filter-trend" className="block text-sm font-medium text-gray-700">Tren Harga</label>
                        <select id="filter-trend" value={filterTrend} onChange={e => setFilterTrend(e.target.value as any)} className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm rounded-md bg-gray-100 text-black">
                            <option value="">Semua</option>
                            <option value="up">Naik</option>
                            <option value="down">Turun</option>
                            <option value="stable">Stabil</option>
                        </select>
                    </div>
                </div>
                 <div className="flex justify-between items-center flex-wrap gap-2 pt-4 border-t mt-4">
                    <span className="text-sm text-gray-600">
                        Menampilkan <strong>{filteredItems.length}</strong> dari <strong>{pricedItems.length}</strong> total barang.
                    </span>
                    <button onClick={resetFilters} className="bg-gray-500 text-white font-bold py-2 px-4 rounded-lg hover:bg-gray-600 transition-colors text-sm">
                        Reset Filter
                    </button>
                </div>
            </div>

            <div className="bg-white p-2 sm:p-6 rounded-xl shadow-md overflow-x-auto">
                <table className="w-full min-w-[1200px] text-left">
                    <thead>
                        <tr className="border-b-2 border-base-300 bg-base-100">
                            <th className="p-4 font-semibold text-neutral">Nama Barang</th>
                            <th className="p-4 font-semibold text-neutral">Kategori</th>
                            <th className="p-4 font-semibold text-center text-neutral">Status</th>
                            <th className="p-4 font-semibold text-neutral">Vendor Terakhir</th>
                            <th className="p-4 font-semibold text-center text-neutral">Tren Harga</th>
                            <th className="p-4 font-semibold text-neutral">Harga Terakhir</th>
                            <th className="p-4 font-semibold text-neutral">Update Terakhir</th>
                            <th className="p-4 font-semibold text-neutral">Aksi</th>
                        </tr>
                    </thead>
                    <tbody>
                       {filteredItems.map(item => {
                         const uniqueVendorsInHistory = new Set(item.history.map(h => h.vendorId)).size;
                         return (
                             <tr key={item.id} className="border-b border-base-200 hover:bg-gray-50">
                                <td className="p-4 text-black">{item.name}</td>
                                <td className="p-4 text-black">{item.category}</td>
                                <td className="p-4 text-center">
                                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${item.status === 'Aktif' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                                        {item.status}
                                    </span>
                                </td>
                                <td className="p-4 text-black">{item.lastVendorName}</td>
                                <td className="p-4"><TrendIcon trend={item.priceTrend} /></td>
                                <td className="p-4 font-semibold text-black">Rp {item.lastPrice.toLocaleString('id-ID')}</td>
                                <td className="p-4 text-black">{item.lastUpdate}</td>
                                <td className="p-4 space-x-2 whitespace-nowrap">
                                    <button onClick={() => openUpdateModal(item)} className="text-sm bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600">Update Harga</button>
                                    <button 
                                        onClick={() => setShowCompareModal(item)} 
                                        disabled={uniqueVendorsInHistory < 2}
                                        title={uniqueVendorsInHistory < 2 ? "Butuh riwayat dari min. 2 vendor" : "Bandingkan Harga"}
                                        className="text-sm bg-purple-500 text-white px-3 py-1 rounded hover:bg-purple-600 disabled:bg-gray-400 disabled:cursor-not-allowed"
                                    >
                                        Bandingkan
                                    </button>
                                    <button onClick={() => setShowHistoryModal(item)} className="text-sm bg-green-500 text-white px-3 py-1 rounded hover:bg-green-600">Riwayat</button>
                                    <button onClick={() => openAddModal(item)} className="text-sm bg-gray-500 text-white px-3 py-1 rounded hover:bg-gray-600">Edit</button>
                                    <button onClick={() => handleDelete(item)} className="text-sm bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600">Hapus</button>
                                </td>
                             </tr>  
                         )
                       })}
                    </tbody>
                </table>
                 {filteredItems.length === 0 && (
                    <div className="text-center p-8 text-gray-500">
                        Tidak ada barang yang cocok dengan kriteria pencarian/filter.
                    </div>
                 )}
            </div>

            {/* Add/Edit Item Modal */}
            {showAddModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
                    <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-md">
                        <h2 className="text-2xl font-bold mb-6">{editingItem ? 'Edit' : 'Tambah'} Barang</h2>
                        <form onSubmit={handleAddOrEditSubmit} className="space-y-4">
                            <input type="text" placeholder="Nama Barang" value={name} onChange={e => setName(e.target.value)} required className="w-full p-2 border rounded bg-gray-100 text-black" />
                            <input list="category-options" placeholder="Kategori Barang" value={category} onChange={e => setCategory(e.target.value)} required className="w-full p-2 border rounded bg-gray-100 text-black" />
                            <datalist id="category-options">
                                {categories.map(cat => <option key={cat} value={cat} />)}
                            </datalist>
                             <select value={status} onChange={e => setStatus(e.target.value as any)} className="w-full p-2 border rounded bg-gray-100 text-black">
                                <option value="Aktif">Aktif</option>
                                <option value="Nonaktif">Nonaktif</option>
                            </select>
                            {!editingItem && (
                                <>
                                    <input type="number" placeholder="Harga Awal" value={initialPrice} onChange={e => setInitialPrice(e.target.value)} required className="w-full p-2 border rounded bg-gray-100 text-black" />
                                    <select value={initialVendor} onChange={e => setInitialVendor(e.target.value)} required className="w-full p-2 border rounded bg-gray-100 text-black">
                                        <option value="" disabled>Pilih Vendor Awal</option>
                                        {vendors.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
                                    </select>
                                </>
                            )}
                            <div className="flex justify-end space-x-4 pt-4">
                                <button type="button" onClick={() => setShowAddModal(false)} className="px-4 py-2 bg-gray-200 rounded">Batal</button>
                                <button type="submit" className="px-4 py-2 bg-primary text-white rounded">{editingItem ? 'Simpan' : 'Tambah'}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
            
            {/* Update Price Modal */}
            {showUpdateModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
                    <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-md">
                        <h2 className="text-2xl font-bold mb-6">Update Harga: {showUpdateModal.name}</h2>
                        <form onSubmit={handleUpdatePriceSubmit} className="space-y-4">
                            <p className="text-sm">Harga terakhir: <strong>Rp {showUpdateModal.lastPrice.toLocaleString('id-ID')}</strong> dari <strong>{showUpdateModal.lastVendorName}</strong></p>
                            <input type="number" placeholder="Harga Baru" value={newPrice} onChange={e => setNewPrice(e.target.value)} required className="w-full p-2 border rounded bg-gray-100 text-black" />
                             <select value={updateVendorId} onChange={e => setUpdateVendorId(e.target.value)} required className="w-full p-2 border rounded bg-gray-100 text-black">
                                <option value="" disabled>Pilih Vendor</option>
                                {vendors.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
                            </select>
                            <div className="flex justify-end space-x-4 pt-4">
                                <button type="button" onClick={() => setShowUpdateModal(null)} className="px-4 py-2 bg-gray-200 rounded">Batal</button>
                                <button type="submit" className="px-4 py-2 bg-primary text-white rounded">Update</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* History Modal */}
            {showHistoryModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
                    <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-lg">
                        <h2 className="text-2xl font-bold mb-6">Riwayat Harga: {showHistoryModal.name}</h2>
                        <div className="max-h-96 overflow-y-auto">
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="border-b-2 border-base-300 bg-base-100">
                                        <th className="p-4 font-semibold text-neutral">Tanggal</th>
                                        <th className="p-4 font-semibold text-neutral">Vendor</th>
                                        <th className="p-4 font-semibold text-neutral">Harga</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {[...showHistoryModal.history].reverse().map((record, index) => (
                                        <tr key={index} className="border-b border-base-200">
                                            <td className="p-4 text-black">{record.date}</td>
                                            <td className="p-4 text-black">{record.vendorName}</td>
                                            <td className="p-4 text-black">Rp {record.price.toLocaleString('id-ID')}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        <div className="flex justify-end pt-6">
                            <button onClick={() => setShowHistoryModal(null)} className="px-4 py-2 bg-primary text-white rounded">Tutup</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Price Comparison Modal */}
            {showCompareModal && (
                <PriceComparison
                    item={showCompareModal}
                    vendors={vendors}
                    onClose={() => setShowCompareModal(null)}
                />
            )}
        </div>
    );
};

export default Pricing;