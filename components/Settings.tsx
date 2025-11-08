
import React from 'react';
import type { GoogleSheetSettings } from '../types';

interface SettingsProps {
    settings: GoogleSheetSettings;
    updateSettings: (newSettings: Partial<GoogleSheetSettings>) => void;
    onSync: () => void;
    isSyncing: boolean;
}

const Settings: React.FC<SettingsProps> = ({ settings, updateSettings, onSync, isSyncing }) => {
  return (
    <div className="space-y-6">
      <h1 className="text-4xl font-bold text-neutral">Settings</h1>
      
      <div className="bg-white p-8 rounded-xl shadow-md max-w-2xl">
        <h2 className="text-2xl font-semibold text-neutral mb-2">Google Sheets Integration</h2>
        <p className="text-gray-600 mb-6">
          Sinkronkan data Vendor dan Harga langsung dari Google Sheets. Pastikan pengaturan berbagi sheet Anda adalah <strong className="text-black">"Anyone with the link"</strong> can view.
        </p>
        
        <div className="space-y-4">
          <div>
            <label htmlFor="vendorSheetUrl" className="block text-sm font-medium text-gray-700">Vendor Sheet URL</label>
            <input
              id="vendorSheetUrl"
              type="url"
              placeholder="https://docs.google.com/spreadsheets/d/.../edit#gid=..."
              value={settings.vendorSheetUrl}
              onChange={(e) => updateSettings({ vendorSheetUrl: e.target.value })}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary bg-gray-50 text-black"
            />
             <p className="mt-1 text-xs text-gray-500">
                Buka tab Vendor di Google Sheet Anda, lalu salin URL lengkap dari address bar browser.
             </p>
          </div>

          <div>
            <label htmlFor="pricingSheetUrl" className="block text-sm font-medium text-gray-700">Pricing Sheet URL</label>
            <input
              id="pricingSheetUrl"
              type="url"
              placeholder="https://docs.google.com/spreadsheets/d/.../edit#gid=..."
              value={settings.pricingSheetUrl}
              onChange={(e) => updateSettings({ pricingSheetUrl: e.target.value })}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary bg-gray-50 text-black"
            />
             <p className="mt-1 text-xs text-gray-500">
                Buka tab Pricing di Google Sheet Anda, lalu salin URL lengkap dari address bar browser.
             </p>
          </div>
        </div>

        <div className="flex justify-end pt-6 mt-6 border-t">
          <button 
            onClick={onSync}
            disabled={isSyncing}
            className="bg-primary text-white font-bold py-2 px-6 rounded-lg hover:bg-primary-focus disabled:bg-gray-400 disabled:cursor-wait flex items-center"
          >
            {isSyncing ? (
                <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                    <span>Syncing...</span>
                </>
            ) : 'Sync Data'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Settings;
