import React from 'react';

export const DashboardPage = ({
  filteredPositions,
  totalPnL,
  totalValue,
  winRate,
  handleManagePosition,
  themeClasses,
}) => (
  <div className="space-y-6">
    {/* Metrics Cards */}
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">Total P&L</p>
            <p className={`text-2xl font-bold ${totalPnL >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              ${totalPnL.toFixed(2)}
            </p>
          </div>
        </div>
      </div>
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">Portfolio Value</p>
            <p className="text-2xl font-bold text-gray-900">${totalValue.toLocaleString()}</p>
          </div>
        </div>
      </div>
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">Active Positions</p>
            <p className="text-2xl font-bold text-gray-900">{filteredPositions.length}</p>
          </div>
        </div>
      </div>
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">Win Rate</p>
            <p className="text-2xl font-bold text-gray-900">{winRate}%</p>
          </div>
        </div>
      </div>
    </div>

    {/* Positions Grid */}
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <h2 className="text-lg font-bold mb-4">Open Positions</h2>
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredPositions.map(position => (
          <div key={position.id} className="p-4 border rounded-lg">
            <div className="flex justify-between items-center">
              <span className="font-bold">{position.symbol}</span>
              <span className={position.pnl >= 0 ? 'text-green-600' : 'text-red-600'}>
                ${position.pnl.toFixed(2)}
              </span>
            </div>
            <button
              onClick={() => handleManagePosition(position)}
              className="mt-2 px-3 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700 transition-colors"
            >
              Manage
            </button>
          </div>
        ))}
        {filteredPositions.length === 0 && (
          <div className="col-span-full text-center py-8 text-gray-500">
            No open positions found
          </div>
        )}
      </div>
    </div>
  </div>
);