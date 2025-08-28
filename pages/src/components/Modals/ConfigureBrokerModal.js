import React, { useState } from 'react';

export const ConfigureBrokerModal = ({
  selectedBrokerForConfig,
  setIsConfigureBrokerModalOpen,
  setBrokers,
  themeClasses,
}) => {
  const [config, setConfig] = useState('');

  const handleSave = () => {
    // Example: update broker config (expand as needed)
    setBrokers(prev =>
      prev.map(b =>
        b.id === selectedBrokerForConfig.id
          ? { ...b, config }
          : b
      )
    );
    setIsConfigureBrokerModalOpen(false);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className={`${themeClasses.cardBg} rounded-lg p-6 w-full max-w-md`}>
        <h2 className={`text-lg font-bold mb-4 ${themeClasses.text}`}>Configure Broker</h2>
        <div className="mb-4">
          <div className="font-semibold mb-2">{selectedBrokerForConfig.name}</div>
          <label className="block mb-2 text-sm font-medium">Configuration</label>
          <input
            type="text"
            value={config}
            onChange={e => setConfig(e.target.value)}
            className="w-full px-3 py-2 border rounded-lg"
            placeholder="Enter configuration..."
          />
        </div>
        <div className="flex space-x-2">
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
          >
            Save
          </button>
          <button
            onClick={() => setIsConfigureBrokerModalOpen(false)}
            className="px-4 py-2 bg-gray-300 text-gray-800 rounded hover:bg-gray-400 transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};