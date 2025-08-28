import React from 'react';

export const Navigation = ({ activePage, setActivePage, themeClasses }) => {
  const tabs = [
    { key: 'dashboard', label: 'Dashboard' },
    { key: 'portfolio', label: 'Portfolio' },
    { key: 'history', label: 'History' },
    { key: 'brokers', label: 'Brokers' },
    { key: 'settings', label: 'Settings' },
  ];

  return (
    <nav className="flex border-b border-gray-200 dark:border-gray-700 bg-transparent px-6 mb-2">
      {tabs.map(tab => (
        <button
          key={tab.key}
          className={`relative px-6 py-3 font-semibold transition-all focus:outline-none
            ${activePage === tab.key
              ? 'text-blue-700 dark:text-blue-400 bg-blue-100 dark:bg-gray-900 rounded-t-lg shadow'
              : 'text-gray-600 dark:text-gray-300 hover:text-blue-700 dark:hover:text-blue-400'}
          `}
          onClick={() => setActivePage(tab.key)}
          aria-selected={activePage === tab.key}
          role="tab"
        >
          {tab.label}
          {activePage === tab.key && (
            <span className="absolute left-2 right-2 -bottom-1 h-1 bg-blue-600 dark:bg-blue-400 rounded"></span>
          )}
        </button>
      ))}
    </nav>
  );
};