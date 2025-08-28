import React from 'react';

export const BrokerDropdown = ({
  selectedBroker,
  setSelectedBroker,
  brokers,
  themeClasses,
}) => (
  <div>
    <label className="mr-2 text-sm font-medium">Broker:</label>
    <select
      value={selectedBroker}
      onChange={e => setSelectedBroker(e.target.value)}
      className={`px-3 py-2 rounded-lg border ${themeClasses.input} focus:outline-none`}
    >
      <option value="All">All</option>
      {brokers.map(broker => (
        <option key={broker.id} value={broker.name}>
          {broker.name}
        </option>
      ))}
    </select>
  </div>
);