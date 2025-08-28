import React from 'react';

export const SettingsPage = ({ themeClasses }) => (
  <div className="bg-white rounded-lg border border-gray-200 p-6">
    <h2 className="text-lg font-bold mb-4">Settings</h2>
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Algorithm Configuration</label>
        <input
          type="text"
          className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          placeholder="Algorithm settings..."
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Other Settings</label>
        <input
          type="text"
          className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          placeholder="Other settings..."
        />
      </div>
    </div>
  </div>
);