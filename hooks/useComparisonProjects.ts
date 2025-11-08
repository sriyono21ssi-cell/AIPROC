import { useState, useEffect, useCallback, useMemo } from 'react';
import type { ComparisonProject, ComparisonVendor, Weights } from '../types';

const LOCAL_STORAGE_KEY = 'ai-procure-comparison-projects';

const initialProjects: ComparisonProject[] = [
    {
        id: 'proj-1',
        name: 'Pengadaan Laptop Kantor 2025',
        description: 'Mencari pemasok untuk 50 unit laptop baru dengan spesifikasi mid-range untuk kebutuhan karyawan.',
        weights: { price: 50, leadTime: 20, warranty: 20, paymentTerms: 10 },
        createdAt: '2024-07-28',
        deadline: '2024-08-30',
        vendors: [
            { id: 'v-1-1', name: 'PT Sinar Jaya Komputer', price: 12500000, leadTime: 14, warranty: 24, paymentTerms: 30 },
            { id: 'v-1-2', name: 'CV Mitra Teknologi', price: 12000000, leadTime: 21, warranty: 12, paymentTerms: 60 },
            { id: 'v-1-3', name: 'Toko IT Cepat', price: 13000000, leadTime: 7, warranty: 24, paymentTerms: 15 },
        ]
    }
];

// Helper to get projects from localStorage
const getInitialState = (): ComparisonProject[] => {
    try {
        const item = window.localStorage.getItem(LOCAL_STORAGE_KEY);
        return item ? JSON.parse(item) : initialProjects;
    } catch (error) {
        console.error("Error reading from localStorage", error);
        return initialProjects;
    }
};

export const useComparisonProjects = () => {
    const [projects, setProjects] = useState<ComparisonProject[]>(getInitialState);

    useEffect(() => {
        try {
            window.localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(projects));
        } catch (error) {
            console.error("Error writing to localStorage", error);
        }
    }, [projects]);

    const addProject = useCallback((projectData: Omit<ComparisonProject, 'id' | 'vendors' | 'createdAt'>) => {
        const newProject: ComparisonProject = {
            ...projectData,
            id: `proj-${Date.now()}`,
            vendors: [],
            createdAt: new Date().toISOString().split('T')[0],
        };
        setProjects(prev => [newProject, ...prev]);
    }, []);

    const updateProject = useCallback((projectId: string, projectData: Partial<Omit<ComparisonProject, 'id'| 'vendors'>>) => {
        setProjects(prev => prev.map(p => p.id === projectId ? { ...p, ...projectData } : p));
    }, []);
    
    const deleteProject = useCallback((projectId: string) => {
        setProjects(prev => prev.filter(p => p.id !== projectId));
    }, []);
    
    const addVendorToProject = useCallback((projectId: string, vendorData: Omit<ComparisonVendor, 'id'>) => {
        const newVendor: ComparisonVendor = { ...vendorData, id: `v-${projectId}-${Date.now()}` };
        setProjects(prev => prev.map(p => {
            if (p.id === projectId) {
                return { ...p, vendors: [...p.vendors, newVendor] };
            }
            return p;
        }));
    }, []);

    const updateVendorInProject = useCallback((projectId: string, vendorId: string, vendorData: Partial<Omit<ComparisonVendor, 'id'>>) => {
        setProjects(prev => prev.map(p => {
            if (p.id === projectId) {
                const updatedVendors = p.vendors.map(v => v.id === vendorId ? { ...v, ...vendorData } : v);
                return { ...p, vendors: updatedVendors };
            }
            return p;
        }));
    }, []);

    const deleteVendorFromProject = useCallback((projectId: string, vendorId: string) => {
        setProjects(prev => prev.map(p => {
            if (p.id === projectId) {
                return { ...p, vendors: p.vendors.filter(v => v.id !== vendorId) };
            }
            return p;
        }));
    }, []);

    const getRankedVendors = useCallback((project?: ComparisonProject | null) => {
        if (!project || project.vendors.length < 1) {
            return [];
        }

        const { vendors, weights } = project;
        if (vendors.length === 1) {
            return [{...vendors[0], finalScore: 100, rank: 1, scores: { price: 100, leadTime: 100, warranty: 100, paymentTerms: 100 }}]
        }
        
        const metrics = {
            price: vendors.map(v => v.price),
            leadTime: vendors.map(v => v.leadTime),
            warranty: vendors.map(v => v.warranty),
            paymentTerms: vendors.map(v => v.paymentTerms),
        };

        const minMax = {
            price: { min: Math.min(...metrics.price), max: Math.max(...metrics.price) },
            leadTime: { min: Math.min(...metrics.leadTime), max: Math.max(...metrics.leadTime) },
            warranty: { min: Math.min(...metrics.warranty), max: Math.max(...metrics.warranty) },
            paymentTerms: { min: Math.min(...metrics.paymentTerms), max: Math.max(...metrics.paymentTerms) },
        };

        const scoredVendors = vendors.map(vendor => {
            // Lower is better for price, leadTime, paymentTerms
            const normPrice = minMax.price.max === minMax.price.min ? 1 : (minMax.price.max - vendor.price) / (minMax.price.max - minMax.price.min);
            const normLeadTime = minMax.leadTime.max === minMax.leadTime.min ? 1 : (minMax.leadTime.max - vendor.leadTime) / (minMax.leadTime.max - minMax.leadTime.min);
            const normPaymentTerms = minMax.paymentTerms.max === minMax.paymentTerms.min ? 1 : (minMax.paymentTerms.max - vendor.paymentTerms) / (minMax.paymentTerms.max - minMax.paymentTerms.min);
            
            // Higher is better for warranty
            const normWarranty = minMax.warranty.max === minMax.warranty.min ? 1 : (vendor.warranty - minMax.warranty.min) / (minMax.warranty.max - minMax.warranty.min);

            const scores = {
                price: normPrice * weights.price,
                leadTime: normLeadTime * weights.leadTime,
                warranty: normWarranty * weights.warranty,
                paymentTerms: normPaymentTerms * weights.paymentTerms,
            };
            
            const finalScore = Object.values(scores).reduce((sum, score) => sum + score, 0);

            return { ...vendor, finalScore, scores };
        });

        return scoredVendors
            .sort((a, b) => b.finalScore - a.finalScore)
            .map((vendor, index) => ({ ...vendor, rank: index + 1 }));

    }, []);

    return { 
        projects, 
        addProject, 
        updateProject, 
        deleteProject, 
        addVendorToProject, 
        updateVendorInProject, 
        deleteVendorFromProject,
        getRankedVendors
    };
};