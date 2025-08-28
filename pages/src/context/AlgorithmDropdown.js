import React from 'react';

export const AlgorithmDropdown = ({
  selectedAlgorithm,
  setSelectedAlgorithm,
  algorithms,
  themeClasses,
}) => (
  <div>
    <label className="mr-2 text-sm font-medium">Algorithm:</label>
    <select
      value={selectedAlgorithm}
      onChange={e => setSelectedAlgorithm(e.target.value)}
      className={`px-3 py-2 rounded-lg border ${themeClasses.input} focus:outline-none`}
    >
      <option value="All">All</option>
      {algorithms.map(algorithm => (
        <option key={algorithm} value={algorithm}>
          {algorithm}
        </option>
      ))}
    </select>
  </div>
);