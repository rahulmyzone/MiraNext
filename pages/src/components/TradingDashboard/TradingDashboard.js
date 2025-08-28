import React, { useState, useEffect, useCallback } from 'react';
import { BarChart3, Settings, RefreshCw, X, Moon, Sun } from 'lucide-react';
import { Navigation } from './Navigation';
import { DashboardPage } from './DashboardPage';
import { PortfolioPage } from './PortfolioPage';
import { TradeHistoryPage } from './TradeHistoryPage';
import { BrokersPage } from './BrokersPage';
import { SettingsPage } from './SettingsPage';
import { ManagePositionModal } from './ManagePositionModal';
import { AddBrokerModal } from './AddBrokerModal';
import { ConfigureBrokerModal } from './ConfigureBrokerModal';
import { TradingAPI, mockData, availableBrokers } from './api';

const TradingDashboard = () => {
  // State management (same as your original code)
  const [positions, setPositions] = useState([]);
  const [closedPositions, setClosedPositions] = useState([]);
  const [portfolioMetrics, setPortfolioMetrics] = useState({});
  const [portfolioHistory, setPortfolioHistory] = useState([]);
  const [tradeHistory, setTradeHistory] = useState([]);
  const [brokers, setBrokers] = useState([]);
  const [brokerStatuses, setBrokerStatuses] = useState({});
  const [selectedBroker, setSelectedBroker] = useState('All');
  const [activePage, setActivePage] = useState('dashboard');
  const [selectedPosition, setSelectedPosition] = useState(null);
  const [isManageModalOpen, setIsManageModalOpen] = useState(false);
  const [isAddBrokerModalOpen, setIsAddBrokerModalOpen] = useState(false);
  const [isConfigureBrokerModalOpen, setIsConfigureBrokerModalOpen] = useState(false);
  const [selectedBrokerForConfig, setSelectedBrokerForConfig] = useState(null);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedAlgorithm, setSelectedAlgorithm] = useState('All');

  // Theme classes (same as your original code)
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

  // Data fetching functions (same as your original code)
  const api = new TradingAPI();
  const fetchPositions = useCallback(async () => {
    try {
      setLoading(true);
      const data = mockData.positions;
      setPositions(data);
    } catch (err) {
      setError('Failed to fetch positions');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [selectedBroker]);

  const fetchBrokers = useCallback(async () => {
    try {
      const data = mockData.brokers;
      setBrokers(data);
      const statuses = {};
      for (const broker of data) {
        statuses[broker.id] = broker.status;
      }
      setBrokerStatuses(statuses);
    } catch (err) {
      setError('Failed to fetch brokers');
      console.error(err);
    }
  }, []);

  const fetchPortfolioData = useCallback(async () => {
    try {
      setPortfolioHistory(mockData.portfolioHistory);
      setTradeHistory(mockData.tradeHistory);
    } catch (err) {
      setError('Failed to fetch portfolio data');
      console.error(err);
    }
  }, []);

  useEffect(() => {
    fetchPositions();
    fetchBrokers();
    fetchPortfolioData();
  }, [fetchPositions, fetchBrokers, fetchPortfolioData]);

  useEffect(() => {
    const interval = setInterval(fetchPositions, 30000);
    return () => clearInterval(interval);
  }, [fetchPositions]);

  // Filtering and metrics (same as your original code)
  const filteredPositions = positions.filter(pos =>
    (selectedBroker === 'All' || pos.broker === selectedBroker) &&
    (selectedAlgorithm === 'All' || pos.algorithm === selectedAlgorithm)
  );
  const filteredTradeHistory = tradeHistory.filter(trade =>
    (selectedBroker === 'All' || trade.broker === selectedBroker) &&
    (selectedAlgorithm === 'All' || trade.algorithm === selectedAlgorithm)
  );
  const filteredPortfolioHistory = portfolioHistory.filter(hist =>
    (selectedAlgorithm === 'All' || hist.algorithm === selectedAlgorithm)
  );
  const totalPnL = positions.reduce((sum, pos) => sum + pos.pnl, 0);
  const totalPositions = positions.length;
  const winningPositions = positions.filter(pos => pos.pnl > 0).length;
  const winRate = totalPositions > 0 ? ((winningPositions / totalPositions) * 100).toFixed(1) : 0;
  const totalValue = brokers.reduce((sum, broker) => sum + (broker.balance || 0), 0);

  // Position management functions (same as your original code)
  const handleClosePosition = async (positionId) => {
    try {
      const position = positions.find(p => p.id === positionId);
      if (position) {
        const closedPosition = {
          ...position,
          status: 'CLOSED',
          exitPrice: position.currentPrice,
          exitTime: new Date().toLocaleString()
        };
        setClosedPositions(prev => [closedPosition, ...prev]);
        setPositions(prev => prev.filter(p => p.id !== positionId));
        setIsManageModalOpen(false);
      }
    } catch (err) {
      setError('Failed to close position');
      console.error(err);
    }
  };

  const handleModifyPosition = async (positionId, modifications) => {
    try {
      setPositions(prev => prev.map(pos =>
        pos.id === positionId ? { ...pos, ...modifications } : pos
      ));
      setIsManageModalOpen(false);
    } catch (err) {
      setError('Failed to modify position');
      console.error(err);
    }
  };

  const handleManagePosition = (position) => {
    setSelectedPosition(position);
    setIsManageModalOpen(true);
  };

  const handleConfigureBroker = (broker) => {
    setSelectedBrokerForConfig(broker);
    setIsConfigureBrokerModalOpen(true);
  };

  // Render
  return (
    <div className={`min-h-screen ${themeClasses.bg}`}>
      {/* Header */}
      {/* ...header code unchanged, but move select dropdowns to their own components later... */}

      {/* Navigation */}
      <Navigation
        activePage={activePage}
        setActivePage={setActivePage}
        themeClasses={themeClasses}
      />

      {/* Error Display */}
      {error && (
        <div className="mx-6 mt-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded dark:bg-red-900 dark:border-red-700 dark:text-red-200">
          {error}
          <button
            onClick={() => setError(null)}
            className="float-right text-red-500 hover:text-red-700 dark:text-red-300 dark:hover:text-red-100"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Main Content */}
      <div className="px-6 py-6">
        {activePage === 'dashboard' && (
          <DashboardPage
            filteredPositions={filteredPositions}
            totalPnL={totalPnL}
            totalValue={totalValue}
            winRate={winRate}
            handleManagePosition={handleManagePosition}
            themeClasses={themeClasses}
          />
        )}
        {activePage === 'portfolio' && (
          <PortfolioPage
            portfolioHistory={filteredPortfolioHistory}
            brokers={brokers}
            positions={positions}
            tradeHistory={filteredTradeHistory}
            closedPositions={closedPositions}
            themeClasses={themeClasses}
          />
        )}
        {activePage === 'history' && (
          <TradeHistoryPage
            filteredTradeHistory={filteredTradeHistory}
            closedPositions={closedPositions}
            selectedAlgorithm={selectedAlgorithm}
            selectedBroker={selectedBroker}
            themeClasses={themeClasses}
          />
        )}
        {activePage === 'brokers' && (
          <BrokersPage
            brokers={brokers}
            handleConfigureBroker={handleConfigureBroker}
            setIsAddBrokerModalOpen={setIsAddBrokerModalOpen}
            themeClasses={themeClasses}
          />
        )}
        {activePage === 'settings' && (
          <SettingsPage themeClasses={themeClasses} />
        )}
      </div>

      {/* Loading Overlay */}
      {loading && (
        <div className="fixed inset-0 bg-black bg-opacity-25 flex items-center justify-center z-40">
          <div className={`${themeClasses.cardBg} rounded-lg p-6 flex items-center space-x-3`}>
            <RefreshCw className="w-5 h-5 animate-spin text-blue-600" />
            <span className={themeClasses.text}>Loading...</span>
          </div>
        </div>
      )}

      {/* Modals */}
      {isManageModalOpen && selectedPosition && (
        <ManagePositionModal
          selectedPosition={selectedPosition}
          setIsManageModalOpen={setIsManageModalOpen}
          handleModifyPosition={handleModifyPosition}
          handleClosePosition={handleClosePosition}
          themeClasses={themeClasses}
        />
      )}
      {isAddBrokerModalOpen && (
        <AddBrokerModal
          availableBrokers={availableBrokers}
          setBrokers={setBrokers}
          setIsAddBrokerModalOpen={setIsAddBrokerModalOpen}
          themeClasses={themeClasses}
        />
      )}
      {isConfigureBrokerModalOpen && selectedBrokerForConfig && (
        <ConfigureBrokerModal
          selectedBrokerForConfig={selectedBrokerForConfig}
          setIsConfigureBrokerModalOpen={setIsConfigureBrokerModalOpen}
          setBrokers={setBrokers}
          themeClasses={themeClasses}
        />
      )}
    </div>
  );
};

export default TradingDashboard;