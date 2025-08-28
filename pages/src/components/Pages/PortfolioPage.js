import React from 'react';

export const PortfolioPage = ({
  portfolioHistory,
  brokers,
  positions,
  tradeHistory,
  closedPositions,
  themeClasses,
}) => (
  <div className="space-y-6">
    {/* Portfolio History */}
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <h2 className="text-lg font-bold mb-4">Portfolio History</h2>
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr>
              <th className="px-4 py-2 text-left">Date</th>
              <th className="px-4 py-2 text-left">Value</th>
              <th className="px-4 py-2 text-left">P&L</th>
              <th className="px-4 py-2 text-left">Algorithm</th>
            </tr>
          </thead>
          <tbody>
            {portfolioHistory.map(item => (
              <tr key={item.date}>
                <td className="px-4 py-2">{item.date}</td>
                <td className="px-4 py-2">${item.value.toLocaleString()}</td>
                <td className={`px-4 py-2 ${item.pnl >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  ${item.pnl}
                </td>
                <td className="px-4 py-2">{item.algorithm}</td>
              </tr>
            ))}
            {portfolioHistory.length === 0 && (
              <tr>
                <td colSpan={4} className="text-center py-8 text-gray-500">
                  No portfolio history found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>

    {/* Brokers List */}
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <h2 className="text-lg font-bold mb-4">Brokers</h2>
      <ul>
        {brokers.map(broker => (
          <li key={broker.id} className="py-2 flex justify-between items-center border-b last:border-b-0">
            <span>{broker.name}</span>
            <span className={broker.status === 'connected' ? 'text-green-600' : 'text-red-600'}>
              {broker.status}
            </span>
          </li>
        ))}
        {brokers.length === 0 && (
          <li className="text-center py-8 text-gray-500">No brokers found</li>
        )}
      </ul>
    </div>
  </div>
);