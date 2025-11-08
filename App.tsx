
import React, { useState, useMemo, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import VendorManagement from './components/VendorManagement';
import VendorSearch from './components/VendorSearch';
import ChatAdmin from './components/ChatAdmin';
import Pricing from './components/Pricing';
import Comparison from './components/Comparison';
import { useVendors } from './hooks/useVendors';
import { usePricing } from './hooks/usePricing';
import { useChat } from './hooks/useChat';
import { useVendorSearch } from './hooks/useVendorSearch';
import { useComparisonProjects } from './hooks/useComparisonProjects';
import type { View } from './types';


const App: React.FC = () => {
  const [activeView, setActiveView] = useState<View>('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const vendorData = useVendors();
  const pricingData = usePricing(vendorData.vendors);
  const chatData = useChat();
  const searchData = useVendorSearch();
  const comparisonData = useComparisonProjects();
  

  const categories = useMemo(() => {
    const allCategories = vendorData.vendors.map(v => v.category);
    const defaultCategories = ['Logistics', 'Raw Materials', 'Packaging', 'IT Services', 'Office Supplies', 'Sayuran', 'Komputer'];
    return [...new Set([...defaultCategories, ...allCategories])].sort();
  }, [vendorData.vendors]);

  const renderContent = () => {
    switch (activeView) {
      case 'dashboard':
        return <Dashboard vendors={vendorData.vendors} pricedItems={pricingData.pricedItems} />;
      case 'vendors':
        return <VendorManagement {...vendorData} />;
      case 'search':
        return <VendorSearch 
                  addVendor={vendorData.addVendor} 
                  categories={categories}
                  {...searchData}
               />;
      case 'pricing':
        return <Pricing {...pricingData} vendors={vendorData.vendors} />;
      case 'comparison':
        return <Comparison {...comparisonData} />;
      case 'chat':
        return <ChatAdmin 
                  // Data context
                  vendors={vendorData.vendors} 
                  pricedItems={pricingData.pricedItems}
                  projects={comparisonData.projects}
                  // Chat state
                  messages={chatData.messages}
                  addMessage={chatData.addMessage}
                  resetChat={chatData.resetChat}
                  // Action functions
                  addVendor={vendorData.addVendor}
                  addItem={pricingData.addItem}
                  updateItemPrice={pricingData.updateItemPrice}
                  addProject={comparisonData.addProject}
                  addVendorToProject={comparisonData.addVendorToProject}
               />;
      default:
        return <Dashboard vendors={vendorData.vendors} pricedItems={pricingData.pricedItems} />;
    }
  };
  
  const viewTitles: Record<View, string> = {
    dashboard: 'Dashboard',
    vendors: 'Vendor Management',
    search: 'Vendor Search',
    pricing: 'Pricing',
    comparison: 'Vendor Comparison',
    chat: 'Chat Admin',
  };


  return (
    <div className="flex h-screen bg-base-100 text-gray-800 overflow-hidden">
      <Sidebar 
        activeView={activeView} 
        setActiveView={setActiveView} 
        isOpen={isSidebarOpen}
        setIsOpen={setIsSidebarOpen}
      />
      <div className="flex-1 flex flex-col min-w-0">
        <header className="flex items-center justify-between p-4 bg-white border-b border-base-200">
           <button
                onClick={() => setIsSidebarOpen(true)}
                aria-label="Open menu"
                className="text-gray-600 p-2 -ml-2 md:hidden"
           >
               <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>
           </button>
           <h1 className="text-xl font-bold text-primary">
             {viewTitles[activeView]}
           </h1>
           {/* Placeholder for potential header actions */}
           <div className="w-6 md:hidden"></div>
        </header>
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          {renderContent()}
        </main>
      </div>
    </div>
  );
};

export default App;
