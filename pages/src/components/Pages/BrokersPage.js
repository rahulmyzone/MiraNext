import React from 'react';

export const BrokersPage = ({
  brokers,
  handleConfigureBroker,
  setIsAddBrokerModalOpen,
  themeClasses,
}) => (
  <div className="bg-white rounded-lg border border-gray-200 p-6">
    <h2 className="text-lg font-bold mb-4">Brokers</h2>
    <ul>
      {brokers.map(broker => (
        <li key={broker.id} className="py-2 flex justify-between items-center border-b last:border-b-0">
          <span>{broker.name}</span>
          <span className={broker.status === 'connected' ? 'text-green-600' : 'text-red-600'}>
            {broker.status}
          </span>
          <button
            onClick={() => handleConfigureBroker(broker)}
            className="ml-4 px-3 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700 transition-colors"
          >
            Configure
          </button>
        </li>
      ))}
      {brokers.length === 0 && (
        <li className="text-center py-8 text-gray-500">No brokers found</li>
      )}
    </ul>
    <button
      onClick={() => setIsAddBrokerModalOpen(true)}
      className="mt-6 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
    >
      Add Broker
    </button>
  </div>
);