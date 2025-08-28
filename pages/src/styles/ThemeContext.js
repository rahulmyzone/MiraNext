import React, { createContext, useState } from 'react';

export const ThemeContext = createContext({
  themeClasses: {},
  isDarkMode: false,
  setIsDarkMode: () => {},
});

export const ThemeProvider = ({ children }) => {
  const [isDarkMode, setIsDarkMode] = useState(false);

  const themeClasses = {
    bg: isDarkMode
      ? 'bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900'
      : 'bg-gradient-to-br from-blue-50 via-white to-blue-100',
    cardBg: isDarkMode ? 'bg-gray-800 shadow-lg' : 'bg-white shadow-lg',
    text: isDarkMode ? 'text-white' : 'text-gray-900',
    textSecondary: isDarkMode ? 'text-gray-300' : 'text-gray-600',
    border: isDarkMode ? 'border-gray-700' : 'border-gray-200',
    hover: isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-blue-50',
    input: isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300',
    modal: isDarkMode ? 'bg-gray-800 shadow-2xl' : 'bg-white shadow-2xl',
  };

  return (
    <ThemeContext.Provider value={{ themeClasses, isDarkMode, setIsDarkMode }}>
      {children}
    </ThemeContext.Provider>
  );
};