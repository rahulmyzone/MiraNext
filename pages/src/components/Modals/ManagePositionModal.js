import React from 'react';

export const ManagePositionModal = ({
  selectedPosition,
  setIsManageModalOpen,
  handleModifyPosition,
  handleClosePosition,
  themeClasses,
}) => (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
    <div className={`${themeClasses.cardBg} rounded-lg p-6 w-full max-w-md`}>
      <h2 className={`text-lg font-bold mb-4 ${themeClasses.text}`}>Manage Position</h2>
      <div className="mb-4">
        <div className="font-semibold">{selectedPosition.symbol}</div>
        <div>Type: {selectedPosition.type}</div>
        <div>Quantity: {selectedPosition.quantity}</div>
        <div>Entry Price: ${selectedPosition.entryPrice}</div>
        <div>Current Price: ${selectedPosition.currentPrice}</div>
        <div>P&L: <span className={selectedPosition.pnl >= 0 ? 'text-green-600' : 'text-red-600'}>${selectedPosition.pnl}</span></div>
      </div>
      <div className="flex space-x-2">
        <button
          onClick={() => handleClosePosition(selectedPosition.id)}
          className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
        >
          Close Position
        </button>
        <button
          onClick={() => setIsManageModalOpen(false)}
          className="px-4 py-2 bg-gray-300 text-gray-800 rounded hover:bg-gray-400 transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  </div>
);