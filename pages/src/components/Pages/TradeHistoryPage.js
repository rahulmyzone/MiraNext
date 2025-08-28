import React from 'react';

export const TradeHistoryPage = ({
  filteredTradeHistory,
  closedPositions,
  selectedAlgorithm,
  selectedBroker,
  themeClasses,
}) => (
  <div className="bg-white rounded-lg border border-gray-200 p-6">
    <h2 className="text-lg font-bold mb-4">Trade History</h2>
    <div className="overflow-x-auto">
      <table className="min-w-full text-sm">
        <thead>
          <tr>
            <th className="px-4 py-2 text-left">Symbol</th>
            <th className="px-4 py-2 text-left">Type</th>
            <th className="px-4 py-2 text-left">Quantity</th>
            <th className="px-4 py-2 text-left">Entry Price</th>
            <th className="px-4 py-2 text-left">Exit Price</th>
            <th className="px-4 py-2 text-left">P&L</th>
            <th className="px-4 py-2 text-left">Broker</th>
            <th className="px-4 py-2 text-left">Algorithm</th>
            <th className="px-4 py-2 text-left">Date</th>
            <th className="px-4 py-2 text-left">Duration</th>
          </tr>
        </thead>
        <tbody>
          {filteredTradeHistory.map(trade => (
            <tr key={trade.id}>
              <td className="px-4 py-2">{trade.symbol}</td>
              <td className="px-4 py-2">{trade.type}</td>
              <td className="px-4 py-2">{trade.quantity}</td>
              <td className="px-4 py-2">${trade.entryPrice}</td>
              <td className="px-4 py-2">${trade.exitPrice}</td>
              <td className={`px-4 py-2 ${trade.pnl >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                ${trade.pnl}
              </td>
              <td className="px-4 py-2">{trade.broker}</td>
              <td className="px-4 py-2">{trade.algorithm}</td>
              <td className="px-4 py-2">{trade.date}</td>
              <td className="px-4 py-2">{trade.duration}</td>
            </tr>
          ))}
          {filteredTradeHistory.length === 0 && (
            <tr>
              <td colSpan={10} className="text-center py-8 text-gray-500">
                No trade history found
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  </div>
);