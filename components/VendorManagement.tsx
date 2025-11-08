
import React, { useState, useMemo, useRef } from 'react';
import type { Vendor, Evaluation, NewVendor } from 'types';
import { analyzeSingleVendor } from 'services/geminiService';
import { TrendingUpIcon } from 'components/icons/TrendingUpIcon';
import { TrendingDownIcon } from 'components/icons/TrendingDownIcon';
import { MinusIcon } from 'components/icons/MinusIcon';
import VendorComparison from 'components/VendorComparison';

interface VendorManagementProps {
  vendors: Vendor[];
  addVendor: (vendor: NewVendor) => void;
  evaluateVendor: (vendorId: string, evaluation: Omit<Evaluation, 'date'>) => void;
  updateVendor: (vendor: Vendor) => void;
  deleteVendor: (vendorId: string) => void;
}

const VendorRow: React.FC<{ vendor: Vendor; onEvaluate: (vendor: Vendor) => void; onAnalyze: (vendor: Vendor) => void; onDelete: (vendor: Vendor) => void; onEdit: (vendor: Vendor) => void; isSelected: boolean; onSelect: (vendorId: string) => void; }> = ({ vendor, onEvaluate, onAnalyze, onDelete, onEdit, isSelected, onSelect }) => {
  const TrendIcon = {
    up: <TrendingUpIcon className="w-5 h-5 text-success" />,
    down: <TrendingDownIcon className="w-5 h-5 text-error" />,
    stable: <MinusIcon className="w-5 h-5 text-gray-500" />,
  }[vendor.performanceTrend];

  const statusColor = {
    Aktif: 'bg-green-100 text-green-800',
    Nonaktif: 'bg-yellow-100 text-yellow-800',
    Blacklist: 'bg-red-100 text-red-800',
  }[vendor.status];


  return (
    <tr className="border-b border-base-200 hover:bg-gray-50">
      <td className="p-4">
        <input
            type="checkbox"
            checked={isSelected}
            onChange={() => onSelect(vendor.id)}
            className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
        />
      </td>
      <td className="p-4 text-black">{vendor.name}</td>
      <td className="p-4 text-black">{vendor.phone}</td>
      <td className="p-4 text-black">{vendor.email}</td>
      <td className="p-4 text-black">{vendor.category}</td>
      <td className="p-4 text-black">{vendor.produk}</td>
      <td className="p-4 font-semibold text-center text-black">{vendor.rating.toFixed(1)} ({vendor.reviewCount})</td>
      <td className="p-4 text-center">
        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${statusColor}`}>
          {vendor.status}
        </span>
      </td>
      <td className="p-4 text-center">{TrendIcon}</td>
      <td className="p-4 text-black">{vendor.lastEvaluated}</td>
      <td className="p-4 space-x-2 whitespace-nowrap">
        <button onClick={() => onEvaluate(vendor)} className="text-sm bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600">Evaluasi</button>
        <button onClick={() => onAnalyze(vendor)} className="text-sm bg-indigo-500 text-white px-3 py-1 rounded hover:bg-indigo-600">Analisa</button>
        <button onClick={() => onEdit(vendor)} className="text-sm bg-gray-500 text-white px-3 py-1 rounded hover:bg-gray-600">Edit</button>
        <button onClick={() => onDelete(vendor)} className="text-sm bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600">Hapus</button>
      </td>
    </tr>
  );
};


const parseCsvForVendors = (csv: string): Partial<NewVendor>[] => {
    const lines = csv.split('\n').filter(line => line.trim() !== '');
    if (lines.length < 2) return [];
    
    const headers = lines[0].trim().split(',').map(h => h.trim().replace(/"/g, '').toLowerCase());
    
    // Define flexible headers mapping
    const headerMap: Record<string, keyof NewVendor> = {
        'name': 'name', 'nama': 'name', 'nama vendor': 'name',
        'phone': 'phone', 'telepon': 'phone',
        'email': 'email',
        'address': 'address', 'alamat': 'address',
        'category': 'category', 'kategori': 'category',
        'produk': 'produk', 'product': 'produk',
        'status': 'status'
    };
    
    const mappedHeaders = headers.map(h => headerMap[h] || h);

    const result: Partial<NewVendor>[] = [];
    for (let i = 1; i < lines.length; i++) {
        const obj: any = {};
        const values = lines[i].trim().split(','); // Simple split, assumes no commas in values
        mappedHeaders.forEach((header, index) => {
            if (values[index]) obj[header] = values[index].trim();
        });
        if (obj.name && obj.phone && obj.category && obj.status) {
            result.push(obj);
        }
    }
    return result;
}


const VendorManagement: React.FC<VendorManagementProps> = ({ vendors, addVendor, evaluateVendor, updateVendor, deleteVendor }) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEvalModal, setShowEvalModal] = useState<Vendor | null>(null);
  const [showAnalysisModal, setShowAnalysisModal] = useState<Vendor | null>(null);
  const [analysisResult, setAnalysisResult] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  
  // States for evaluation form
  const [quality, setQuality] = useState(3);
  const [price, setPrice] = useState(3);
  const [delivery, setDelivery] = useState(3);
  const [communication, setCommunication] = useState(3);
  const [comment, setComment] = useState('');

  // States for add/edit vendor form
  const [editingVendor, setEditingVendor] = useState<Vendor | null>(null);
  const [vendorName, setVendorName] = useState('');
  const [vendorPhone, setVendorPhone] = useState('');
  const [vendorEmail, setVendorEmail] = useState('');
  const [vendorAddress, setVendorAddress] = useState('');
  const [vendorCategory, setVendorCategory] = useState('');
  const [vendorProduk, setVendorProduk] = useState('');
  const [vendorStatus, setVendorStatus] = useState<'Aktif' | 'Nonaktif' | 'Blacklist'>('Aktif');

  // State for vendor comparison
  const [selectedVendors, setSelectedVendors] = useState<string[]>([]);
  const [showCompareModal, setShowCompareModal] = useState(false);
  
  // Filter states
  const [filterCategory, setFilterCategory] = useState('');
  const [filterStatus, setFilterStatus] = useState<'Aktif' | 'Nonaktif' | 'Blacklist' | ''>('');
  const [filterRating, setFilterRating] = useState(0);
  const [filterTrend, setFilterTrend] = useState<'up' | 'down' | 'stable' | ''>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const categories = useMemo(() => {
    const allCategories = vendors.map(v => v.category);
    const defaultCategories = ['Logistics', 'Raw Materials', 'Packaging', 'IT Services', 'Office Supplies', 'Sayuran', 'Komputer'];
    return [...new Set([...defaultCategories, ...allCategories])].sort();
  }, [vendors]);

  const filteredVendors = useMemo(() => {
    return vendors.filter(vendor => {
      if (filterCategory && vendor.category !== filterCategory) return false;
      if (filterStatus && vendor.status !== filterStatus) return false;
      if (filterRating > 0 && vendor.rating < filterRating) return false;
      if (filterTrend && vendor.performanceTrend !== filterTrend) return false;
      return true;
    });
  }, [vendors, filterCategory, filterStatus, filterRating, filterTrend]);

  const resetFilters = () => {
    setFilterCategory('');
    setFilterStatus('');
    setFilterRating(0);
    setFilterTrend('');
  };


  const handleOpenAddModal = (vendorToEdit: Vendor | null = null) => {
    setEditingVendor(vendorToEdit);
    if(vendorToEdit) {
      setVendorName(vendorToEdit.name);
      setVendorPhone(vendorToEdit.phone);
      setVendorEmail(vendorToEdit.email);
      setVendorAddress(vendorToEdit.address);
      setVendorCategory(vendorToEdit.category);
      setVendorProduk(vendorToEdit.produk);
      setVendorStatus(vendorToEdit.status);
    } else {
      setVendorName('');
      setVendorPhone('');
      setVendorEmail('');
      setVendorAddress('');
      setVendorCategory('');
      setVendorProduk('');
      setVendorStatus('Aktif');
    }
    setShowAddModal(true);
  }

  const handleAddOrUpdateVendor = (e: React.FormEvent) => {
    e.preventDefault();
    const vendorData: NewVendor = { name: vendorName, phone: vendorPhone, email: vendorEmail, address: vendorAddress, category: vendorCategory, produk: vendorProduk, status: vendorStatus };

    if (editingVendor) {
      updateVendor({ ...editingVendor, ...vendorData });
    } else {
      addVendor(vendorData);
    }
    setShowAddModal(false);
  };
  
  const handleEvaluate = (vendor: Vendor) => {
    setQuality(3);
    setPrice(3);
    setDelivery(3);
    setCommunication(3);
    setComment('');
    setShowEvalModal(vendor);
  }

  const handleEvaluationSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (showEvalModal) {
      evaluateVendor(showEvalModal.id, { quality, price, delivery, communication, comment });
      setShowEvalModal(null);
    }
  };

  const handleAnalyze = async (vendor: Vendor) => {
    setShowAnalysisModal(vendor);
    setIsAnalyzing(true);
    const result = await analyzeSingleVendor(vendor);
    setAnalysisResult(result);
    setIsAnalyzing(false);
  };
  
  const handleDelete = (vendor: Vendor) => {
    if(window.confirm(`Yakin ingin menghapus vendor ${vendor.name}?`)) {
      deleteVendor(vendor.id);
    }
  }

  const handleExportCSV = () => {
    if (vendors.length === 0) {
      alert("No vendor data to export.");
      return;
    }

    const headers = ['ID', 'Name', 'Phone', 'Email', 'Address', 'Category', 'Produk', 'Rating', 'Review Count', 'Status', 'Last Evaluated', 'Performance Trend'];
    const rows = vendors.map(v => [
      v.id,
      `"${v.name.replace(/"/g, '""')}"`,
      `"${v.phone.replace(/"/g, '""')}"`,
      `"${v.email.replace(/"/g, '""')}"`,
      `"${v.address.replace(/"/g, '""')}"`,
      v.category,
      `"${v.produk.replace(/"/g, '""')}"`,
      v.rating,
      v.reviewCount,
      v.status,
      v.lastEvaluated,
      v.performanceTrend
    ].join(','));

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(','), ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "vendors.csv");
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
              const newVendorData = parseCsvForVendors(text);
              if (newVendorData.length > 0) {
                  if (window.confirm(`Found ${newVendorData.length} new vendors in the file. Do you want to add them?`)) {
                      newVendorData.forEach(vendor => {
                          const status = ['Aktif', 'Nonaktif', 'Blacklist'].includes(vendor.status as string) 
                            ? vendor.status as 'Aktif' | 'Nonaktif' | 'Blacklist' 
                            : 'Aktif';
                          
                          const fullVendorData: NewVendor = {
                              name: vendor.name!,
                              phone: vendor.phone!,
                              email: vendor.email || '',
                              address: vendor.address || 'N/A',
                              category: vendor.category!,
                              produk: vendor.produk || 'N/A',
                              status: status
                          };
                          addVendor(fullVendorData);
                      });
                      alert(`${newVendorData.length} vendors imported successfully.`);
                  }
              } else {
                  alert("No valid vendor data found in the file or headers are incorrect.");
              }
          } catch (error) {
              alert("An error occurred while parsing the file.");
              console.error("CSV Parse Error:", error);
          }
      };
      reader.readAsText(file);
      // Reset file input value to allow re-uploading the same file
      if (event.target) {
        event.target.value = '';
      }
  };

  const handleSelectVendor = (vendorId: string) => {
    setSelectedVendors(prev => 
      prev.includes(vendorId) 
        ? prev.filter(id => id !== vendorId)
        : [...prev, vendorId]
    );
  };

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedVendors(filteredVendors.map(v => v.id));
    } else {
      setSelectedVendors([]);
    }
  };

  const vendorsToCompare = useMemo(() => {
    return vendors.filter(v => selectedVendors.includes(v.id));
  }, [selectedVendors, vendors]);

  return (
    <div className="space-y-6">
      <input type="file" accept=".csv" ref={fileInputRef} onChange={handleImportCSV} className="hidden" />
      <div className="flex justify-between items-center flex-wrap gap-4">
        {/* Title removed as per request */}
        <div className="flex space-x-2">
            <button 
              onClick={() => setShowCompareModal(true)} 
              disabled={selectedVendors.length < 2}
              className="bg-secondary text-white font-bold py-2 px-4 rounded-lg hover:bg-blue-600 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              Compare ({selectedVendors.length})
            </button>
            <button onClick={() => fileInputRef.current?.click()} className="bg-blue-500 text-white font-bold py-2 px-4 rounded-lg hover:bg-blue-600 transition-colors">
                Import CSV
            </button>
            <button onClick={handleExportCSV} className="bg-success text-white font-bold py-2 px-4 rounded-lg hover:bg-green-600 transition-colors">
                Export CSV
            </button>
            <button onClick={() => handleOpenAddModal()} className="bg-primary text-white font-bold py-2 px-4 rounded-lg hover:bg-primary-focus transition-colors">
                + Tambah Vendor
            </button>
        </div>
      </div>
      
      <div className="bg-white p-4 rounded-xl shadow-md space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 items-end">
            <div>
                <label htmlFor="filter-category" className="block text-sm font-medium text-gray-700">Kategori</label>
                <select id="filter-category" value={filterCategory} onChange={e => setFilterCategory(e.target.value)} className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm rounded-md bg-gray-100 text-black">
                    <option value="">Semua Kategori</option>
                    {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                </select>
            </div>
            <div>
                <label htmlFor="filter-status" className="block text-sm font-medium text-gray-700">Status</label>
                <select id="filter-status" value={filterStatus} onChange={e => setFilterStatus(e.target.value as any)} className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm rounded-md bg-gray-100 text-black">
                    <option value="">Semua Status</option>
                    <option value="Aktif">Aktif</option>
                    <option value="Nonaktif">Nonaktif</option>
                    <option value="Blacklist">Blacklist</option>
                </select>
            </div>
            <div>
                <label htmlFor="filter-rating" className="block text-sm font-medium text-gray-700">Rating Minimal</label>
                <select id="filter-rating" value={filterRating} onChange={e => setFilterRating(Number(e.target.value))} className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm rounded-md bg-gray-100 text-black">
                    <option value="0">Semua Rating</option>
                    <option value="4">4+</option>
                    <option value="3">3+</option>
                    <option value="2">2+</option>
                    <option value="1">1+</option>
                </select>
            </div>
            <div>
                <label htmlFor="filter-trend" className="block text-sm font-medium text-gray-700">Tren Kinerja</label>
                <select id="filter-trend" value={filterTrend} onChange={e => setFilterTrend(e.target.value as any)} className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm rounded-md bg-gray-100 text-black">
                    <option value="">Semua Tren</option>
                    <option value="up">Up</option>
                    <option value="down">Down</option>
                    <option value="stable">Stable</option>
                </select>
            </div>
            <div>
                <button onClick={resetFilters} className="w-full bg-gray-500 text-white font-bold py-2 px-4 rounded-lg hover:bg-gray-600 transition-colors">
                Reset Filter
                </button>
            </div>
        </div>
        <div className="flex justify-between items-center text-sm text-gray-600 pt-2 border-t">
            <span>
                Menampilkan <strong>{filteredVendors.length}</strong> dari <strong>{vendors.length}</strong> total vendor.
            </span>
        </div>
      </div>

      <div className="bg-white p-2 sm:p-6 rounded-xl shadow-md overflow-x-auto">
        <table className="w-full min-w-[1500px] text-left">
          <thead>
            <tr className="border-b-2 border-base-300 bg-base-100">
              <th className="p-4">
                  <input
                      type="checkbox"
                      onChange={handleSelectAll}
                      checked={filteredVendors.length > 0 && selectedVendors.length === filteredVendors.length}
                      ref={input => {
                          if (input) {
                              input.indeterminate = selectedVendors.length > 0 && selectedVendors.length < filteredVendors.length;
                          }
                      }}
                      className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                  />
              </th>
              <th className="p-4 font-semibold text-neutral">Nama Vendor</th>
              <th className="p-4 font-semibold text-neutral">Telepon</th>
              <th className="p-4 font-semibold text-neutral">Email</th>
              <th className="p-4 font-semibold text-neutral">Kategori</th>
              <th className="p-4 font-semibold text-neutral">Produk</th>
              <th className="p-4 font-semibold text-center text-neutral">Rating (Ulasan)</th>
              <th className="p-4 font-semibold text-center text-neutral">Status</th>
              <th className="p-4 font-semibold text-center text-neutral">Trend</th>
              <th className="p-4 font-semibold text-neutral">Tgl Update</th>
              <th className="p-4 font-semibold text-neutral">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {filteredVendors.map(vendor => (
              <VendorRow key={vendor.id} vendor={vendor} onEvaluate={handleEvaluate} onAnalyze={handleAnalyze} onDelete={handleDelete} onEdit={handleOpenAddModal} isSelected={selectedVendors.includes(vendor.id)} onSelect={handleSelectVendor} />
            ))}
          </tbody>
        </table>
         {filteredVendors.length === 0 && (
            <div className="text-center p-8 text-gray-500">
                Tidak ada vendor yang cocok dengan filter yang diterapkan.
            </div>
         )}
      </div>

      {/* Add/Edit Vendor Modal */}
      {showAddModal && (
         <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
           <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-md">
             <h2 className="text-2xl font-bold mb-6">{editingVendor ? 'Edit' : 'Tambah'} Vendor</h2>
             <form onSubmit={handleAddOrUpdateVendor} className="space-y-4">
                <input type="text" placeholder="Nama Vendor" value={vendorName} onChange={e => setVendorName(e.target.value)} required className="w-full p-2 border rounded bg-gray-100 text-black" />
                <input type="tel" placeholder="Nomor Telepon" value={vendorPhone} onChange={e => setVendorPhone(e.target.value)} required className="w-full p-2 border rounded bg-gray-100 text-black" />
                <input type="email" placeholder="Alamat Email (Opsional)" value={vendorEmail} onChange={e => setVendorEmail(e.target.value)} className="w-full p-2 border rounded bg-gray-100 text-black" />
                <input type="text" placeholder="Alamat / Lokasi" value={vendorAddress} onChange={e => setVendorAddress(e.target.value)} required className="w-full p-2 border rounded bg-gray-100 text-black" />
                <div>
                  <input list="category-options" placeholder="Kategori Bisnis / Produk" value={vendorCategory} onChange={e => setVendorCategory(e.target.value)} required className="w-full p-2 border rounded bg-gray-100 text-black" />
                  <datalist id="category-options">
                    {categories.map(cat => <option key={cat} value={cat} />)}
                  </datalist>
                </div>
                <input type="text" placeholder="Produk/Layanan Utama" value={vendorProduk} onChange={e => setVendorProduk(e.target.value)} required className="w-full p-2 border rounded bg-gray-100 text-black" />
                <select value={vendorStatus} onChange={e => setVendorStatus(e.target.value as any)} className="w-full p-2 border rounded bg-gray-100 text-black">
                  <option value="Aktif">Aktif</option>
                  <option value="Nonaktif">Nonaktif</option>
                  <option value="Blacklist">Blacklist</option>
                </select>
               <div className="flex justify-end space-x-4 pt-4">
                 <button type="button" onClick={() => setShowAddModal(false)} className="px-4 py-2 bg-gray-200 rounded">Batal</button>
                 <button type="submit" className="px-4 py-2 bg-primary text-white rounded">{editingVendor ? 'Update' : 'Tambah'}</button>
               </div>
             </form>
           </div>
         </div>
       )}

      {/* Evaluation Modal */}
      {showEvalModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
          <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-lg">
            <h2 className="text-2xl font-bold mb-6">Evaluasi: {showEvalModal.name}</h2>
            <form onSubmit={handleEvaluationSubmit} className="space-y-4">
              {['Kualitas', 'Harga', 'Pengiriman', 'Komunikasi'].map((crit, idx) => (
                <div key={crit}>
                  <label className="block mb-1">{crit}: { [quality, price, delivery, communication][idx] }</label>
                  <input type="range" min="1" max="5" step="1" value={[quality, price, delivery, communication][idx]}
                    onChange={e => [setQuality, setPrice, setDelivery, setCommunication][idx](parseInt(e.target.value))}
                    className="w-full" />
                </div>
              ))}
              <textarea placeholder="Catatan / Komentar (opsional)" value={comment} onChange={e => setComment(e.target.value)} className="w-full p-2 border rounded h-24 bg-gray-100 text-black"></textarea>
              <div className="flex justify-end space-x-4 pt-4">
                <button type="button" onClick={() => setShowEvalModal(null)} className="px-4 py-2 bg-gray-200 rounded">Batal</button>
                <button type="submit" className="px-4 py-2 bg-primary text-white rounded">Kirim Evaluasi</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Analysis Modal */}
      {showAnalysisModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
          <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-md">
            <h2 className="text-2xl font-bold mb-4">Analisa AI: {showAnalysisModal.name}</h2>
            <div className="p-4 bg-base-100 rounded-lg min-h-[100px] flex items-center justify-center">
              {isAnalyzing ? (
                 <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              ) : (
                <p className="text-gray-700 italic">"{analysisResult}"</p>
              )}
            </div>
            <div className="flex justify-end pt-6">
              <button onClick={() => setShowAnalysisModal(null)} className="px-4 py-2 bg-primary text-white rounded">Tutup</button>
            </div>
          </div>
        </div>
      )}

      {/* Comparison Modal */}
      {showCompareModal && (
        <VendorComparison 
          vendors={vendorsToCompare} 
          onClose={() => setShowCompareModal(false)}
        />
      )}
    </div>
  );
};

export default VendorManagement;