import React, { useState } from 'react';

export const AddBrokerModal = ({
  availableBrokers,
  setBrokers,
  setIsAddBrokerModalOpen,
  themeClasses,
}) => {
  const [selectedBroker, setSelectedBroker] = useState('');

  const handleAdd = () => {
    if (selectedBroker) {
      setBrokers(prev => [...prev, { id: selectedBroker, name: selectedBroker, status: 'connected', balance: 0, positions: 0 }]);
      setIsAddBrokerModalOpen(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className={`${themeClasses.cardBg} rounded-lg p-6 w-full max-w-md`}>
        <h2 className={`text-lg font-bold mb-4 ${themeClasses.text}`}>Add Broker</h2>
        <div className="mb-4">
          <label className="block mb-2 text-sm font-medium">Select Broker</label>
          <select
            value={selectedBroker}
            onChange={e => setSelectedBroker(e.target.value)}
            className="w-full px-3 py-2 border rounded-lg"
          >
            <option value="">Choose...</option>
            {availableBrokers.map(broker => (
              <option key={broker} value={broker}>{broker}</option>
            ))}
          </select>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={handleAdd}
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
          >
            Add
          </button>
          <button
            onClick={() => setIsAddBrokerModalOpen(false)}
            className="px-4 py-2 bg-gray-300 text-gray-800 rounded hover:bg-gray-400 transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};