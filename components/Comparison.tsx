
import React, { useState, useMemo } from 'react';
import type { ComparisonProject, ComparisonVendor, Weights } from 'types';
import { useComparisonProjects } from 'hooks/useComparisonProjects';
import { ScaleIcon } from 'components/icons/ScaleIcon';

type ComparisonProps = ReturnType<typeof useComparisonProjects>;

const Comparison: React.FC<ComparisonProps> = (props) => {
    const { projects, addProject, updateProject, deleteProject, addVendorToProject, updateVendorInProject, deleteVendorFromProject, getRankedVendors } = props;

    const [selectedProjectId, setSelectedProjectId] = useState<string | null>(projects.length > 0 ? projects[0].id : null);

    // Modal states
    const [isProjectModalOpen, setProjectModalOpen] = useState(false);
    const [editingProject, setEditingProject] = useState<ComparisonProject | null>(null);
    const [isVendorModalOpen, setVendorModalOpen] = useState(false);
    const [editingVendor, setEditingVendor] = useState<ComparisonVendor | null>(null);
    
    const selectedProject = useMemo(() => {
        return projects.find(p => p.id === selectedProjectId) || null;
    }, [projects, selectedProjectId]);

    const rankedVendors = useMemo(() => {
        return getRankedVendors(selectedProject);
    }, [selectedProject, getRankedVendors]);

    const handleOpenProjectModal = (project: ComparisonProject | null = null) => {
        setEditingProject(project);
        setProjectModalOpen(true);
    };

    const handleOpenVendorModal = (vendor: ComparisonVendor | null = null) => {
        if (!selectedProject) return;
        setEditingVendor(vendor);
        setVendorModalOpen(true);
    };
    
    const handleDeleteProject = (project: ComparisonProject) => {
        if (window.confirm(`Yakin ingin menghapus proyek "${project.name}"?`)) {
            if (selectedProjectId === project.id) {
                setSelectedProjectId(projects.length > 1 ? projects.find(p => p.id !== project.id)!.id : null);
            }
            deleteProject(project.id);
        }
    };

    const handleDeleteVendor = (vendor: ComparisonVendor) => {
        if (!selectedProject) return;
        if (window.confirm(`Yakin ingin menghapus vendor "${vendor.name}" dari proyek ini?`)) {
            deleteVendorFromProject(selectedProject.id, vendor.id);
        }
    };

    const handleExportCSV = () => {
        if (!selectedProject || rankedVendors.length === 0) {
            alert("Tidak ada data untuk diekspor.");
            return;
        }
    
        const headers = ['Peringkat', 'Nama Vendor', 'Harga Penawaran', 'Waktu Kirim (hari)', 'Garansi (bulan)', 'Termin (hari)', 'Skor Akhir'];
        const rows = rankedVendors.map(v => [
            v.rank,
            `"${v.name.replace(/"/g, '""')}"`,
            v.price,
            v.leadTime,
            v.warranty,
            v.paymentTerms,
            v.finalScore.toFixed(2)
        ].join(','));
    
        const csvContent = "data:text/csv;charset=utf-8," + [headers.join(','), ...rows].join('\n');
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `${selectedProject.name.replace(/ /g, "_")}_comparison.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };
    
    // Render Project List View
    const renderProjectList = () => (
        <div className="bg-white p-6 rounded-xl shadow-md">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold text-neutral">Proyek Perbandingan</h2>
                <button onClick={() => handleOpenProjectModal()} className="bg-primary text-white font-bold py-2 px-4 rounded-lg hover:bg-primary-focus transition-colors">
                    + Buat Proyek Baru
                </button>
            </div>
             <div className="space-y-4">
                {projects.length > 0 ? projects.map(p => {
                    const today = new Date();
                    today.setHours(0, 0, 0, 0);
                    const deadlineDate = new Date(p.deadline);
                    deadlineDate.setHours(0, 0, 0, 0);
                    const isOverdue = deadlineDate < today;

                    return (
                    <div key={p.id} className={`p-4 rounded-lg border-2 cursor-pointer transition-colors ${selectedProjectId === p.id ? 'bg-blue-50 border-primary' : 'bg-gray-50 border-transparent hover:border-secondary'}`} onClick={() => setSelectedProjectId(p.id)}>
                        <div className="flex justify-between items-start">
                           <div>
                                <h3 className="font-bold text-lg text-neutral">{p.name}</h3>
                                <p className="text-sm text-gray-500 flex items-center flex-wrap gap-x-3">
                                    <span>{p.vendors.length} vendor</span>
                                    <span>•</span>
                                    <span>Dibuat: {p.createdAt}</span>
                                    <span>•</span>
                                    <span className="flex items-center">
                                       <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1.5"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
                                       Batas Akhir: {p.deadline}
                                    </span>
                                    {isOverdue && <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-red-100 text-red-800">Terlewat</span>}
                                </p>
                           </div>
                            <div className="flex-shrink-0 space-x-2">
                                <button onClick={(e) => { e.stopPropagation(); handleOpenProjectModal(p);}} className="text-sm text-blue-600 hover:underline">Edit</button>
                                <button onClick={(e) => { e.stopPropagation(); handleDeleteProject(p);}} className="text-sm text-red-600 hover:underline">Hapus</button>
                            </div>
                        </div>
                    </div>
                )}) : (
                    <div className="text-center py-8 text-gray-500">
                        <ScaleIcon className="w-12 h-12 mx-auto text-gray-400 mb-2"/>
                        <p>Belum ada proyek. Klik "Buat Proyek Baru" untuk memulai.</p>
                    </div>
                )}
            </div>
        </div>
    );
    
    // Render Selected Project Detail View
    const renderProjectDetail = () => {
        if (!selectedProject) return null;
        
        return (
            <div className="bg-white p-2 sm:p-6 rounded-xl shadow-md space-y-6">
                 <div className="flex justify-between items-center flex-wrap gap-4 px-4 sm:px-0">
                    <h3 className="text-2xl font-semibold text-neutral">Tabel Perbandingan: {selectedProject.name}</h3>
                    <div className="flex items-center space-x-2">
                        <button onClick={handleExportCSV} className="bg-success text-white font-bold py-2 px-4 rounded-lg hover:bg-green-600 transition-colors text-sm">
                            Download CSV
                        </button>
                        <button onClick={() => handleOpenVendorModal()} className="bg-secondary text-white font-bold py-2 px-4 rounded-lg hover:bg-blue-600 transition-colors text-sm">
                            + Tambah Vendor
                        </button>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full min-w-[1000px] text-left">
                        <thead>
                            <tr className="border-b-2 border-base-300 bg-base-100">
                                <th className="p-4 font-semibold text-neutral">Peringkat</th>
                                <th className="p-4 font-semibold text-neutral">Nama Vendor</th>
                                <th className="p-4 font-semibold text-neutral">Harga Penawaran</th>
                                <th className="p-4 font-semibold text-neutral">Waktu Kirim (hari)</th>
                                <th className="p-4 font-semibold text-neutral">Garansi (bulan)</th>
                                <th className="p-4 font-semibold text-neutral">Termin (hari)</th>
                                <th className="p-4 font-semibold text-center text-neutral">SKOR AKHIR</th>
                                <th className="p-4 font-semibold text-neutral">Aksi</th>
                            </tr>
                        </thead>
                        <tbody>
                            {rankedVendors.map((vendor, index) => (
                                <tr key={vendor.id} className={`border-b border-base-200 hover:bg-gray-50 ${index === 0 ? 'bg-green-50' : ''}`}>
                                    <td className="p-4 font-bold text-lg text-center text-black">
                                        {index === 0 ? '🏆' : ''} {vendor.rank}
                                    </td>
                                    <td className="p-4 font-semibold text-black">{vendor.name}</td>
                                    <td className="p-4 text-black">Rp {vendor.price.toLocaleString('id-ID')}</td>
                                    <td className="p-4 text-black">{vendor.leadTime}</td>
                                    <td className="p-4 text-black">{vendor.warranty}</td>
                                    <td className="p-4 text-black">{vendor.paymentTerms}</td>
                                    <td className="p-4 font-bold text-xl text-center text-primary">{vendor.finalScore.toFixed(2)}</td>
                                    <td className="p-4 space-x-2 whitespace-nowrap">
                                        <button onClick={() => handleOpenVendorModal(vendor)} className="text-sm text-blue-600 hover:underline">Edit</button>
                                        <button onClick={() => handleDeleteVendor(vendor)} className="text-sm text-red-600 hover:underline">Hapus</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {rankedVendors.length === 0 && (
                        <div className="text-center p-8 text-gray-500">
                            Belum ada vendor yang ditambahkan ke proyek ini. Klik "+ Tambah Vendor" untuk memulai.
                        </div>
                    )}
                </div>
            </div>
        );
    };

    return (
        <div className="space-y-6">
            {renderProjectList()}
            {selectedProject && renderProjectDetail()}

            {isProjectModalOpen && (
                <ProjectModal
                    project={editingProject}
                    onClose={() => setProjectModalOpen(false)}
                    onSave={(data) => {
                        if (editingProject) {
                            updateProject(editingProject.id, data);
                        } else {
                            addProject(data);
                        }
                    }}
                />
            )}

            {isVendorModalOpen && selectedProject && (
                <VendorModal
                    vendor={editingVendor}
                    onClose={() => setVendorModalOpen(false)}
                    onSave={(data) => {
                        if (editingVendor) {
                            updateVendorInProject(selectedProject.id, editingVendor.id, data);
                        } else {
                            addVendorToProject(selectedProject.id, data);
                        }
                    }}
                />
            )}
        </div>
    );
};

// --- MODAL COMPONENTS ---

interface ProjectModalProps {
    project: ComparisonProject | null;
    onClose: () => void;
    onSave: (data: Omit<ComparisonProject, 'id' | 'vendors' | 'createdAt'>) => void;
}

const ProjectModal: React.FC<ProjectModalProps> = ({ project, onClose, onSave }) => {
    const [name, setName] = useState(project?.name || '');
    const [description, setDescription] = useState(project?.description || '');
    const [deadline, setDeadline] = useState(project?.deadline || new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);
    const [weights, setWeights] = useState<Weights>(project?.weights || { price: 40, leadTime: 20, warranty: 20, paymentTerms: 20 });
    const [error, setError] = useState('');

    const totalWeight = useMemo(() => {
        // FIX: The `w` parameter from `Object.values` can be inferred as `unknown`, causing a type error.
        // Explicitly cast `w` to a number to ensure the sum operation is valid.
        return Object.values(weights).reduce((sum, w) => sum + Number(w), 0);
    }, [weights]);

    const handleWeightChange = (key: keyof Weights, value: string) => {
        const numValue = parseInt(value, 10) || 0;
        setWeights(prev => ({ ...prev, [key]: numValue }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (totalWeight !== 100) {
            setError('Total bobot harus 100.');
            return;
        }
        onSave({ name, description, weights, deadline });
        onClose();
    };

    const weightFields: { key: keyof Weights, label: string, info: string }[] = [
        { key: 'price', label: 'Harga', info: 'Semakin rendah, semakin baik.' },
        { key: 'leadTime', label: 'Waktu Pengiriman', info: 'Semakin cepat (hari lebih sedikit), semakin baik.' },
        { key: 'warranty', label: 'Garansi', info: 'Semakin lama (bulan lebih banyak), semakin baik.' },
        { key: 'paymentTerms', label: 'Termin Pembayaran', info: 'Semakin lama (hari lebih banyak), semakin baik.' },
    ];

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
            <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col">
                <h2 className="text-2xl font-bold mb-6 flex-shrink-0">{project ? 'Edit' : 'Buat'} Proyek Perbandingan</h2>
                <form onSubmit={handleSubmit} className="flex-1 flex flex-col min-h-0">
                   <div className="space-y-4 overflow-y-auto flex-1 pr-2">
                        <input type="text" placeholder="Nama Proyek" value={name} onChange={e => setName(e.target.value)} required className="w-full p-2 border rounded bg-gray-100 text-black" />
                        <textarea placeholder="Deskripsi Proyek" value={description} onChange={e => setDescription(e.target.value)} required className="w-full p-2 border rounded bg-gray-100 text-black h-24"></textarea>
                        <div>
                            <label htmlFor="deadline" className="block text-sm font-medium text-gray-700">Batas Akhir</label>
                            <input id="deadline" type="date" value={deadline} onChange={e => setDeadline(e.target.value)} required className="w-full p-2 border rounded bg-gray-100 text-black mt-1" />
                        </div>
                        <div className="pt-4">
                            <h3 className="text-lg font-semibold mb-2">Bobot Kriteria (Total: <span className={totalWeight === 100 ? 'text-success' : 'text-error'}>{totalWeight}%</span>)</h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {weightFields.map(({ key, label, info }) => (
                                    <div key={key}>
                                        <label htmlFor={`weight-${key}`} className="block text-sm font-medium text-gray-700">{label}</label>
                                        <input id={`weight-${key}`} type="number" value={weights[key]} onChange={e => handleWeightChange(key, e.target.value)} required className="w-full p-2 border rounded bg-gray-100 text-black mt-1" />
                                        <p className="text-xs text-gray-500 mt-1">{info}</p>
                                    </div>
                                ))}
                            </div>
                            {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
                        </div>
                   </div>
                    <div className="flex justify-end space-x-4 pt-6 flex-shrink-0">
                        <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 rounded">Batal</button>
                        <button type="submit" className="px-4 py-2 bg-primary text-white rounded">{project ? 'Simpan' : 'Buat'}</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

interface VendorModalProps {
    vendor: ComparisonVendor | null;
    onClose: () => void;
    onSave: (data: Omit<ComparisonVendor, 'id'>) => void;
}

const VendorModal: React.FC<VendorModalProps> = ({ vendor, onClose, onSave }) => {
    const [name, setName] = useState(vendor?.name || '');
    const [price, setPrice] = useState(vendor?.price.toString() || '');
    const [leadTime, setLeadTime] = useState(vendor?.leadTime.toString() || '');
    const [warranty, setWarranty] = useState(vendor?.warranty.toString() || '');
    const [paymentTerms, setPaymentTerms] = useState(vendor?.paymentTerms.toString() || '');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const vendorData = {
            name,
            price: parseFloat(price) || 0,
            leadTime: parseInt(leadTime, 10) || 0,
            warranty: parseInt(warranty, 10) || 0,
            paymentTerms: parseInt(paymentTerms, 10) || 0
        };
        onSave(vendorData);
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
            <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-lg">
                <h2 className="text-2xl font-bold mb-6">{vendor ? 'Edit' : 'Tambah'} Vendor</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <input type="text" placeholder="Nama Vendor" value={name} onChange={e => setName(e.target.value)} required className="w-full p-2 border rounded bg-gray-100 text-black" />
                    <input type="number" placeholder="Harga Penawaran" value={price} onChange={e => setPrice(e.target.value)} required className="w-full p-2 border rounded bg-gray-100 text-black" />
                    <input type="number" placeholder="Waktu Pengiriman (hari)" value={leadTime} onChange={e => setLeadTime(e.target.value)} required className="w-full p-2 border rounded bg-gray-100 text-black" />
                    <input type="number" placeholder="Masa Garansi (bulan)" value={warranty} onChange={e => setWarranty(e.target.value)} required className="w-full p-2 border rounded bg-gray-100 text-black" />
                    <input type="number" placeholder="Termin Pembayaran (hari)" value={paymentTerms} onChange={e => setPaymentTerms(e.target.value)} required className="w-full p-2 border rounded bg-gray-100 text-black" />
                    <div className="flex justify-end space-x-4 pt-4">
                        <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 rounded">Batal</button>
                        <button type="submit" className="px-4 py-2 bg-primary text-white rounded">{vendor ? 'Simpan' : 'Tambah'}</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default Comparison;