import React, { useState, useEffect, useCallback } from 'react';
import { TrendingUp, TrendingDown, Activity, DollarSign, BarChart3, Settings, RefreshCw, X, Edit2, PieChart, History, Home, Building2, AlertCircle, CheckCircle, Moon, Sun, Plus } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart as RechartsPieChart, Cell, BarChart, Bar } from 'recharts';
import { ThemeProvider } from './src/styles/ThemeContext';

// API Service Layer
class TradingAPI {
  constructor(baseURL = '/api/v1') {
    this.baseURL = baseURL;
  }

  async request(endpoint, options = {}) {
    try {
      const response = await fetch(`${this.baseURL}${endpoint}`, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
          ...options.headers,
        },
        ...options,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  // Position endpoints
  async getPositions(brokerFilter = null) {
    const params = brokerFilter ? `?broker=${encodeURIComponent(brokerFilter)}` : '';
    return this.request(`/positions${params}`);
  }

  async getClosedPositions(brokerFilter = null, limit = 100) {
    const params = new URLSearchParams();
    if (brokerFilter) params.append('broker', brokerFilter);
    params.append('limit', limit);
    return this.request(`/positions/closed?${params}`);
  }

  async closePosition(positionId, options = {}) {
    return this.request(`/positions/${positionId}/close`, {
      method: 'POST',
      body: JSON.stringify(options),
    });
  }

  async modifyPosition(positionId, modifications) {
    return this.request(`/positions/${positionId}/modify`, {
      method: 'PUT',
      body: JSON.stringify(modifications),
    });
  }

  // Portfolio endpoints
  async getPortfolioMetrics(timeframe = '1M') {
    return this.request(`/portfolio/metrics?timeframe=${timeframe}`);
  }

  async getPortfolioHistory(timeframe = '1M') {
    return this.request(`/portfolio/history?timeframe=${timeframe}`);
  }

  async getTradeHistory(filters = {}) {
    const params = new URLSearchParams(filters);
    return this.request(`/trades/history?${params}`);
  }

  // Broker endpoints
  async getBrokers() {
    return this.request('/brokers');
  }

  async getBrokerStatus(brokerId) {
    return this.request(`/brokers/${brokerId}/status`);
  }

  async connectBroker(brokerConfig) {
    return this.request('/brokers/connect', {
      method: 'POST',
      body: JSON.stringify(brokerConfig),
    });
  }
}

const TradingDashboard = () => {
  // API instance
  const api = new TradingAPI();

  // State management
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

  // Theme classes
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

  // Available broker types for adding new brokers
  const availableBrokers = [
    { id: 'binance', name: 'Binance', type: 'crypto', fields: ['apiKey', 'apiSecret', 'sandbox'] },
    { id: 'coinbase', name: 'Coinbase Pro', type: 'crypto', fields: ['apiKey', 'apiSecret', 'passphrase'] },
    { id: 'kraken', name: 'Kraken', type: 'crypto', fields: ['apiKey', 'apiSecret'] },
    { id: 'oanda', name: 'OANDA', type: 'forex', fields: ['apiKey', 'accountId', 'environment'] },
    { id: 'dukascopy', name: 'Dukascopy', type: 'forex', fields: ['username', 'password', 'demo'] },
    { id: 'metatrader', name: 'MetaTrader 4/5', type: 'forex', fields: ['server', 'login', 'password'] },
    { id: 'custom', name: 'Custom Broker', type: 'custom', fields: ['name', 'apiEndpoint', 'apiKey'] }
  ];
  const mockData = {
    positions: [
      { id: 1, symbol: 'AAPL', type: 'LONG', quantity: 100, entryPrice: 150.25, currentPrice: 155.80, pnl: 555, pnlPercent: 3.69, broker: 'TD Ameritrade', algorithm: 'Mean Reversion', status: 'OPEN', timestamp: '2024-01-15 09:30:00', stopLoss: 145.00, takeProfit: 160.00 },
      { id: 2, symbol: 'TSLA', type: 'SHORT', quantity: 50, entryPrice: 220.15, currentPrice: 215.30, pnl: 242.50, pnlPercent: 2.20, broker: 'Interactive Brokers', algorithm: 'Momentum', status: 'OPEN', timestamp: '2024-01-15 10:45:00', stopLoss: 225.00, takeProfit: 210.00 },
      { id: 3, symbol: 'MSFT', type: 'LONG', quantity: 75, entryPrice: 380.90, currentPrice: 375.20, pnl: -427.50, pnlPercent: -1.50, broker: 'Zerodha', algorithm: 'Arbitrage', status: 'OPEN', timestamp: '2024-01-15 11:20:00', stopLoss: 370.00, takeProfit: 390.00 },
      { id: 4, symbol: 'GOOG', type: 'LONG', quantity: 30, entryPrice: 2800.00, currentPrice: 2825.00, pnl: 750, pnlPercent: 0.89, broker: 'Fidelity', algorithm: 'Mean Reversion', status: 'OPEN', timestamp: '2024-01-16 09:30:00', stopLoss: 2750.00, takeProfit: 2850.00 },
      { id: 5, symbol: 'AMZN', type: 'SHORT', quantity: 20, entryPrice: 3300.00, currentPrice: 3280.00, pnl: 400, pnlPercent: 0.61, broker: 'E*TRADE', algorithm: 'Momentum', status: 'OPEN', timestamp: '2024-01-16 10:00:00', stopLoss: 3350.00, takeProfit: 3250.00 }
    ],
    brokers: [
      { id: 'td', name: 'TD Ameritrade', status: 'connected', balance: 50000, positions: 5 },
      { id: 'ib', name: 'Interactive Brokers', status: 'connected', balance: 75000, positions: 3 },
      { id: 'schwab', name: 'Charles Schwab', status: 'disconnected', balance: 0, positions: 0 },
      { id: 'zerodha', name: 'Zerodha', status: 'connected', balance: 25000, positions: 2 },
      { id: 'alpaca', name: 'Alpaca', status: 'connected', balance: 30000, positions: 1 },
      { id: 'robinhood', name: 'Robinhood', status: 'disconnected', balance: 0, positions: 0 },
      { id: 'fidelity', name: 'Fidelity', status: 'connected', balance: 100000, positions: 4 },
      { id: 'etrade', name: 'E*TRADE', status: 'connected', balance: 40000, positions: 2 }
    ],
    portfolioHistory: [
      { date: '2024-01-01', value: 100000, pnl: 0, algorithm: 'Mean Reversion' },
      { date: '2024-01-08', value: 102500, pnl: 2500, algorithm: 'Momentum' },
      { date: '2024-01-15', value: 104800, pnl: 4800, algorithm: 'Arbitrage' },
      { date: '2024-01-22', value: 103200, pnl: 3200, algorithm: 'Mean Reversion' },
      { date: '2024-01-29', value: 106500, pnl: 6500, algorithm: 'Momentum' },
    ],
    tradeHistory: [
      { id: 1, symbol: 'AAPL', type: 'LONG', quantity: 100, entryPrice: 145.20, exitPrice: 152.30, pnl: 710, broker: 'TD Ameritrade', algorithm: 'Mean Reversion', date: '2024-01-10', duration: '2h 15m' },
      { id: 2, symbol: 'TSLA', type: 'SHORT', quantity: 50, entryPrice: 225.80, exitPrice: 220.15, pnl: 282.50, broker: 'Interactive Brokers', algorithm: 'Momentum', date: '2024-01-12', duration: '45m' },
      { id: 3, symbol: 'MSFT', type: 'LONG', quantity: 75, entryPrice: 370.00, exitPrice: 375.20, pnl: 390, broker: 'Zerodha', algorithm: 'Arbitrage', date: '2024-01-13', duration: '1h 10m' },
      { id: 4, symbol: 'GOOG', type: 'LONG', quantity: 30, entryPrice: 2800.00, exitPrice: 2825.00, pnl: 750, broker: 'Fidelity', algorithm: 'Mean Reversion', date: '2024-01-16', duration: '3h 5m' },
      { id: 5, symbol: 'AMZN', type: 'SHORT', quantity: 20, entryPrice: 3300.00, exitPrice: 3280.00, pnl: 400, broker: 'E*TRADE', algorithm: 'Momentum', date: '2024-01-16', duration: '2h 40m' }
    ]
  };

  // Data fetching functions
  const fetchPositions = useCallback(async () => {
    try {
      setLoading(true);
      // Replace with actual API call: const data = await api.getPositions(selectedBroker !== 'All' ? selectedBroker : null);
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
      // Replace with actual API call: const data = await api.getBrokers();
      const data = mockData.brokers;
      setBrokers(data);
      
      // Fetch broker statuses
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
      // Replace with actual API calls
      setPortfolioHistory(mockData.portfolioHistory);
      setTradeHistory(mockData.tradeHistory);
    } catch (err) {
      setError('Failed to fetch portfolio data');
      console.error(err);
    }
  }, []);

  // Initialize data
  useEffect(() => {
    fetchPositions();
    fetchBrokers();
    fetchPortfolioData();
  }, [fetchPositions, fetchBrokers, fetchPortfolioData]);

  // Auto-refresh positions every 30 seconds
  useEffect(() => {
    const interval = setInterval(fetchPositions, 30000);
    return () => clearInterval(interval);
  }, [fetchPositions]);

  // Filter positions by selected broker and algorithm
  const filteredPositions = positions.filter(pos =>
    (selectedBroker === 'All' || pos.broker === selectedBroker) &&
    (selectedAlgorithm === 'All' || pos.algorithm === selectedAlgorithm)
  );

  // Filter trades by selected broker and algorithm
  const filteredTradeHistory = tradeHistory.filter(trade =>
    (selectedBroker === 'All' || trade.broker === selectedBroker) &&
    (selectedAlgorithm === 'All' || trade.algorithm === selectedAlgorithm)
  );

  // Filter portfolio history by algorithm
  const filteredPortfolioHistory = portfolioHistory.filter(hist =>
    (selectedAlgorithm === 'All' || hist.algorithm === selectedAlgorithm)
  );

  // Calculate portfolio metrics
  const totalPnL = positions.reduce((sum, pos) => sum + pos.pnl, 0);
  const totalPositions = positions.length;
  const winningPositions = positions.filter(pos => pos.pnl > 0).length;
  const winRate = totalPositions > 0 ? ((winningPositions / totalPositions) * 100).toFixed(1) : 0;
  const totalValue = brokers.reduce((sum, broker) => sum + (broker.balance || 0), 0);

  // Position management functions
  const handleClosePosition = async (positionId) => {
    try {
      // Replace with actual API call: await api.closePosition(positionId);
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
      // Replace with actual API call: await api.modifyPosition(positionId, modifications);
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

  // Components
  const PositionCard = ({ position, isOpen = true }) => (
    <div className={`${themeClasses.cardBg} rounded-lg border ${themeClasses.border} p-4 hover:shadow-md transition-shadow`}>
      <div className="flex justify-between items-start mb-3">
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2">
            <span className={`font-bold text-lg ${themeClasses.text}`}>{position.symbol}</span>
            <span className={`px-2 py-1 rounded text-xs font-medium ${
              position.type === 'LONG' 
                ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' 
                : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
            }`}>
              {position.type}
            </span>
          </div>
        </div>
        <div className="text-right">
          <div className={`font-bold ${position.pnl >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {position.pnl >= 0 ? '+' : ''}${position.pnl.toFixed(2)}
          </div>
          <div className={`text-sm ${position.pnl >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            ({position.pnl >= 0 ? '+' : ''}{position.pnlPercent}%)
          </div>
        </div>
      </div>

      <div className={`grid grid-cols-2 gap-4 text-sm ${themeClasses.textSecondary} mb-3`}>
        <div>
          <span className="block">Quantity: {position.quantity}</span>
          <span className="block">Entry: ${position.entryPrice}</span>
          {isOpen && position.stopLoss && (
            <span className="block">Stop Loss: ${position.stopLoss}</span>
          )}
        </div>
        <div>
          <span className="block">Broker: {position.broker}</span>
          {isOpen ? (
            <span className="block">Current: ${position.currentPrice}</span>
          ) : (
            <span className="block">Exit: ${position.exitPrice}</span>
          )}
          {isOpen && position.takeProfit && (
            <span className="block">Take Profit: ${position.takeProfit}</span>
          )}
        </div>
      </div>

      <div className="flex justify-between items-center">
        <span className={`text-xs ${themeClasses.textSecondary}`}>
          {isOpen ? position.timestamp : `${position.entryTime} - ${position.exitTime}`}
        </span>
        {isOpen && (
          <button
            onClick={() => handleManagePosition(position)}
            className="px-3 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700 transition-colors flex items-center space-x-1"
          >
            <Edit2 className="w-3 h-3" />
            <span>Manage</span>
          </button>
        )}
      </div>
    </div>
  );

  const BrokerCard = ({ broker }) => (
    <div className={`${themeClasses.cardBg} rounded-lg border ${themeClasses.border} p-4`}>
      <div className="flex justify-between items-start mb-3">
        <div className="flex items-center space-x-3">
          <Building2 className={`w-6 h-6 ${themeClasses.textSecondary}`} />
          <span className={`font-bold text-lg ${themeClasses.text}`}>{broker.name}</span>
        </div>
        <div className="flex items-center space-x-2">
          {broker.status === 'connected' ? (
            <CheckCircle className="w-4 h-4 text-green-600" />
          ) : (
            <AlertCircle className="w-4 h-4 text-red-600" />
          )}
          <span className={`text-sm ${broker.status === 'connected' ? 'text-green-600' : 'text-red-600'}`}>
            {broker.status}
          </span>
        </div>
      </div>

      <div className={`grid grid-cols-2 gap-4 text-sm ${themeClasses.textSecondary} mb-3`}>
        <div>
          <span className="block">Balance: ${broker.balance.toLocaleString()}</span>
          <span className="block">Positions: {broker.positions}</span>
        </div>
      </div>

      <div className="flex space-x-2">
        <button 
          onClick={() => handleConfigureBroker(broker)}
          className="flex-1 px-3 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700 transition-colors"
        >
          Configure
        </button>
        {broker.status === 'disconnected' && (
          <button className="flex-1 px-3 py-1 bg-green-600 text-white rounded text-xs hover:bg-green-700 transition-colors">
            Connect
          </button>
        )}
      </div>
    </div>
  );

  const AddBrokerModal = () => {
    const [selectedBrokerType, setSelectedBrokerType] = useState('');
    const [brokerConfig, setBrokerConfig] = useState({});

    const selectedBrokerData = availableBrokers.find(b => b.id === selectedBrokerType);

    const handleSubmit = async (e) => {
      e.preventDefault();
      try {
        // Replace with actual API call
        const newBroker = {
          id: Date.now().toString(),
          name: selectedBrokerData?.name || brokerConfig.name,
          status: 'disconnected',
          balance: 0,
          positions: 0,
          config: brokerConfig
        };
        
        setBrokers(prev => [...prev, newBroker]);
        setIsAddBrokerModalOpen(false);
        setBrokerConfig({});
        setSelectedBrokerType('');
      } catch (err) {
        setError('Failed to add broker');
      }
    };

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className={`${themeClasses.modal} rounded-2xl p-8 w-full max-w-md max-h-[80vh] overflow-y-auto`}>
          <div className="flex justify-between items-center mb-4">
            <h3 className={`text-lg font-bold ${themeClasses.text}`}>Add New Broker</h3>
            <button
              onClick={() => setIsAddBrokerModalOpen(false)}
              className={`${themeClasses.textSecondary} hover:${themeClasses.text}`}
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className={`block text-sm font-medium ${themeClasses.text} mb-1`}>Select Broker Type</label>
              <select
                value={selectedBrokerType}
                onChange={(e) => setSelectedBrokerType(e.target.value)}
                className={`w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${themeClasses.input}`}
                required
              >
                <option value="">Choose a broker...</option>
                {availableBrokers.map(broker => (
                  <option key={broker.id} value={broker.id}>
                    {broker.name} ({broker.type})
                  </option>
                ))}
              </select>
            </div>

            {selectedBrokerData && (
              <div className="space-y-3">
                <h4 className={`font-medium ${themeClasses.text}`}>Configuration</h4>
                {selectedBrokerData.fields.map(field => (
                  <div key={field}>
                    <label className={`block text-sm font-medium ${themeClasses.text} mb-1 capitalize`}>
                      {field.replace(/([A-Z])/g, ' $1').trim()}
                    </label>
                    {field === 'sandbox' || field === 'demo' ? (
                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id={field}
                          checked={brokerConfig[field] || false}
                          onChange={(e) => setBrokerConfig(prev => ({ ...prev, [field]: e.target.checked }))}
                          className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                        />
                        <label htmlFor={field} className={`text-sm ${themeClasses.text}`}>
                          Use {field === 'sandbox' ? 'Sandbox' : 'Demo'} Environment
                        </label>
                      </div>
                    ) : field === 'environment' ? (
                      <select
                        value={brokerConfig[field] || ''}
                        onChange={(e) => setBrokerConfig(prev => ({ ...prev, [field]: e.target.value }))}
                        className={`w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${themeClasses.input}`}
                        required
                      >
                        <option value="">Select environment...</option>
                        <option value="practice">Practice</option>
                        <option value="live">Live</option>
                      </select>
                    ) : (
                      <input
                        type={field.includes('password') || field.includes('secret') ? 'password' : 'text'}
                        value={brokerConfig[field] || ''}
                        onChange={(e) => setBrokerConfig(prev => ({ ...prev, [field]: e.target.value }))}
                        className={`w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${themeClasses.input}`}
                        placeholder={`Enter ${field.replace(/([A-Z])/g, ' $1').trim().toLowerCase()}`}
                        required
                      />
                    )}
                  </div>
                ))}
              </div>
            )}

            <div className="flex space-x-3 pt-4">
              <button
                type="button"
                onClick={() => setIsAddBrokerModalOpen(false)}
                className={`flex-1 py-2 px-4 border ${themeClasses.border} ${themeClasses.text} rounded hover:${themeClasses.hover} transition-colors`}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!selectedBrokerType}
                className="flex-1 py-2 px-4 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Add Broker
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  const ConfigureBrokerModal = () => {
    const [config, setConfig] = useState(selectedBrokerForConfig?.config || {});

    const handleSubmit = async (e) => {
      e.preventDefault();
      try {
        // Replace with actual API call
        setBrokers(prev => prev.map(broker => 
          broker.id === selectedBrokerForConfig.id 
            ? { ...broker, config, status: 'connected' }
            : broker
        ));
        setIsConfigureBrokerModalOpen(false);
      } catch (err) {
        setError('Failed to update broker configuration');
      }
    };

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className={`${themeClasses.modal} rounded-2xl p-8 w-full max-w-md max-h-[80vh] overflow-y-auto`}>
          <div className="flex justify-between items-center mb-4">
            <h3 className={`text-lg font-bold ${themeClasses.text}`}>
              Configure {selectedBrokerForConfig?.name}
            </h3>
            <button
              onClick={() => setIsConfigureBrokerModalOpen(false)}
              className={`${themeClasses.textSecondary} hover:${themeClasses.text}`}
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className={`p-3 rounded ${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>Status: <span className={selectedBrokerForConfig?.status === 'connected' ? 'text-green-600' : 'text-red-600'}>
                  {selectedBrokerForConfig?.status}
                </span></div>
                <div>Balance: ${selectedBrokerForConfig?.balance.toLocaleString()}</div>
                <div>Positions: {selectedBrokerForConfig?.positions}</div>
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <label className={`block text-sm font-medium ${themeClasses.text} mb-1`}>API Key</label>
                <input
                  type="password"
                  value={config.apiKey || ''}
                  onChange={(e) => setConfig(prev => ({ ...prev, apiKey: e.target.value }))}
                  className={`w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${themeClasses.input}`}
                  placeholder="Enter API key"
                />
              </div>
              <div>
                <label className={`block text-sm font-medium ${themeClasses.text} mb-1`}>API Secret</label>
                <input
                  type="password"
                  value={config.apiSecret || ''}
                  onChange={(e) => setConfig(prev => ({ ...prev, apiSecret: e.target.value }))}
                  className={`w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${themeClasses.input}`}
                  placeholder="Enter API secret"
                />
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="testConnection"
                  checked={config.testConnection || false}
                  onChange={(e) => setConfig(prev => ({ ...prev, testConnection: e.target.checked }))}
                  className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                />
                <label htmlFor="testConnection" className={`text-sm ${themeClasses.text}`}>
                  Test connection before saving
                </label>
              </div>
            </div>

            <div className="flex space-x-3 pt-4">
              <button
                type="button"
                onClick={() => setIsConfigureBrokerModalOpen(false)}
                className={`flex-1 py-2 px-4 border ${themeClasses.border} ${themeClasses.text} rounded hover:${themeClasses.hover} transition-colors`}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 py-2 px-4 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
              >
                Save & Test
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  const ManagePositionModal = () => {
    const [stopLoss, setStopLoss] = useState(selectedPosition?.stopLoss || '');
    const [takeProfit, setTakeProfit] = useState(selectedPosition?.takeProfit || '');

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 w-full max-w-md">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-bold">Manage Position: {selectedPosition?.symbol}</h3>
            <button
              onClick={() => setIsManageModalOpen(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="space-y-4">
            <div className="bg-gray-50 p-3 rounded">
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>Type: {selectedPosition?.type}</div>
                <div>Quantity: {selectedPosition?.quantity}</div>
                <div>Entry: ${selectedPosition?.entryPrice}</div>
                <div>Current: ${selectedPosition?.currentPrice}</div>
                <div className="col-span-2">
                  P&L: <span className={selectedPosition?.pnl >= 0 ? 'text-green-600' : 'text-red-600'}>
                    ${selectedPosition?.pnl.toFixed(2)} ({selectedPosition?.pnlPercent}%)
                  </span>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Stop Loss</label>
                <input
                  type="number"
                  value={stopLoss}
                  onChange={(e) => setStopLoss(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter stop loss price"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Take Profit</label>
                <input
                  type="number"
                  value={takeProfit}
                  onChange={(e) => setTakeProfit(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter take profit price"
                />
              </div>
            </div>

            <div className="space-y-2">
              <button
                onClick={() => handleModifyPosition(selectedPosition?.id, { stopLoss: parseFloat(stopLoss), takeProfit: parseFloat(takeProfit) })}
                className="w-full py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
              >
                Update Position
              </button>
              <button
                onClick={() => handleClosePosition(selectedPosition?.id)}
                className="w-full py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
              >
                Close Position
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const DashboardPage = () => (
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
            <DollarSign className={`w-8 h-8 ${totalPnL >= 0 ? 'text-green-600' : 'text-red-600'}`} />
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Portfolio Value</p>
              <p className="text-2xl font-bold text-gray-900">${totalValue.toLocaleString()}</p>
            </div>
            <Activity className="w-8 h-8 text-blue-600" />
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Active Positions</p>
              <p className="text-2xl font-bold text-gray-900">{filteredPositions.length}</p>
            </div>
            <BarChart3 className="w-8 h-8 text-purple-600" />
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Win Rate</p>
              <p className="text-2xl font-bold text-gray-900">{winRate}%</p>
            </div>
            <TrendingUp className="w-8 h-8 text-green-600" />
          </div>
        </div>
      </div>

      {/* Positions Grid */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-lg font-bold mb-4">Open Positions</h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredPositions.map(position => (
            <PositionCard key={position.id} position={position} />
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

  const PortfolioPage = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Portfolio Performance Chart */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-lg font-bold mb-4">Portfolio Performance</h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={portfolioHistory}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="value" stroke="#3B82F6" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* P&L Distribution */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-lg font-bold mb-4">P&L by Broker</h2>
          <div className="space-y-3">
            {brokers.filter(b => b.status === 'connected').map(broker => {
              const brokerPositions = positions.filter(p => p.broker === broker.name);
              const brokerPnL = brokerPositions.reduce((sum, pos) => sum + pos.pnl, 0);
              
              return (
                <div key={broker.id} className="flex justify-between items-center">
                  <span className="text-sm">{broker.name}</span>
                  <span className={`font-medium ${brokerPnL >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    ${brokerPnL.toFixed(2)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Recent Trades */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-lg font-bold mb-4">Recent Trades</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left py-3 px-4">Date</th>
                <th className="text-left py-3 px-4">Symbol</th>
                <th className="text-left py-3 px-4">Type</th>
                <th className="text-left py-3 px-4">Quantity</th>
                <th className="text-left py-3 px-4">Entry Price</th>
                <th className="text-left py-3 px-4">Exit Price</th>
                <th className="text-left py-3 px-4">P&L</th>
                <th className="text-left py-3 px-4">P&L %</th>
                <th className="text-left py-3 px-4">Duration</th>
                <th className="text-left py-3 px-4">Broker</th>
                <th className="text-left py-3 px-4">Status</th>
              </tr>
            </thead>
            <tbody>
              {[...tradeHistory, ...closedPositions].map(trade => (
                <tr key={trade.id} className="border-b hover:bg-blue-50 dark:hover:bg-gray-800 transition-colors">
                  <td className="py-3 px-4 text-sm">{trade.date || trade.exitTime}</td>
                  <td className="py-3 px-4 font-medium">{trade.symbol}</td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-1 rounded text-xs ${
                      trade.type === 'LONG' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {trade.type}
                    </span>
                  </td>
                  <td className="py-3 px-4">{trade.quantity}</td>
                  <td className="py-3 px-4">${trade.entryPrice}</td>
                  <td className="py-3 px-4">${trade.exitPrice}</td>
                  <td className={`py-3 px-4 font-medium ${trade.pnl >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    ${trade.pnl.toFixed(2)}
                  </td>
                  <td className={`py-3 px-4 ${trade.pnlPercent >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {trade.pnlPercent ? trade.pnlPercent.toFixed(2) : ((trade.pnl / (trade.entryPrice * trade.quantity)) * 100).toFixed(2)}%
                  </td>
                  <td className="py-3 px-4 text-sm">{trade.duration || 'N/A'}</td>
                  <td className="py-3 px-4 text-sm">{trade.broker}</td>
                  <td className="py-3 px-4">
                    <span className="px-2 py-1 rounded text-xs bg-gray-100 text-gray-800">
                      CLOSED
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Trade Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold mb-2">Total Trades</h3>
          <p className="text-3xl font-bold text-gray-900">{tradeHistory.length + closedPositions.length}</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold mb-2">Win Rate</h3>
          <p className="text-3xl font-bold text-green-600">
            {(([...tradeHistory, ...closedPositions].filter(t => t.pnl > 0).length / (tradeHistory.length + closedPositions.length)) * 100).toFixed(1)}%
          </p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold mb-2">Total Realized P&L</h3>
          <p className="text-3xl font-bold text-blue-600">
            ${[...tradeHistory, ...closedPositions].reduce((sum, t) => sum + t.pnl, 0).toFixed(2)}
          </p>
        </div>
      </div>
    </div>
  );

  const TradeHistoryPage = () => {
    // Combine mock trade history and closed positions
    const allTrades = [...filteredTradeHistory, ...closedPositions.filter(pos =>
      (selectedAlgorithm === 'All' || pos.algorithm === selectedAlgorithm) &&
      (selectedBroker === 'All' || pos.broker === selectedBroker)
    )];

    // Calculate statistics
    const totalTrades = allTrades.length;
    const winRate =
      totalTrades > 0
        ? ((allTrades.filter(t => t.pnl > 0).length / totalTrades) * 100).toFixed(1)
        : '0.0';
    const totalPnL = allTrades.reduce((sum, t) => sum + t.pnl, 0);

    return (
      <div className="space-y-6">
        {/* Trade Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className={`${themeClasses.cardBg} rounded-lg border ${themeClasses.border} p-6`}>
            <h3 className={`text-lg font-semibold mb-2 ${themeClasses.text}`}>Total Trades</h3>
            <p className={`text-3xl font-bold ${themeClasses.text}`}>{totalTrades}</p>
          </div>
          <div className={`${themeClasses.cardBg} rounded-lg border ${themeClasses.border} p-6`}>
            <h3 className={`text-lg font-semibold mb-2 ${themeClasses.text}`}>Win Rate</h3>
            <p className="text-3xl font-bold text-green-600">{winRate}%</p>
          </div>
          <div className={`${themeClasses.cardBg} rounded-lg border ${themeClasses.border} p-6`}>
            <h3 className={`text-lg font-semibold mb-2 ${themeClasses.text}`}>Total Realized P&L</h3>
            <p className="text-3xl font-bold text-blue-600">${totalPnL.toFixed(2)}</p>
          </div>
        </div>

        {/* Trade History Table */}
        <div className={`${themeClasses.cardBg} rounded-lg border ${themeClasses.border} p-6`}>
          <h2 className={`text-lg font-bold mb-4 ${themeClasses.text}`}>Trade History</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className={`border-b ${themeClasses.textSecondary}`}>
                  <th className="text-left py-3 px-4">Date</th>
                  <th className="text-left py-3 px-4">Symbol</th>
                  <th className="text-left py-3 px-4">Type</th>
                  <th className="text-left py-3 px-4">Quantity</th>
                  <th className="text-left py-3 px-4">Entry Price</th>
                  <th className="text-left py-3 px-4">Exit Price</th>
                  <th className="text-left py-3 px-4">P&L</th>
                  <th className="text-left py-3 px-4">P&L %</th>
                  <th className="text-left py-3 px-4">Duration</th>
                  <th className="text-left py-3 px-4">Broker</th>
                  <th className="text-left py-3 px-4">Status</th>
                </tr>
              </thead>
              <tbody>
                {allTrades.length === 0 ? (
                  <tr>
                    <td colSpan={11} className={`text-center py-8 ${themeClasses.textSecondary}`}>
                      No trade history found
                    </td>
                  </tr>
                ) : (
                  allTrades.map(trade => (
                    <tr key={trade.id} className={`border-b ${themeClasses.hover} transition-colors`}>
                      <td className={`py-3 px-4 text-sm ${themeClasses.textSecondary}`}>{trade.date || trade.exitTime}</td>
                      <td className={`py-3 px-4 font-medium ${themeClasses.text}`}>{trade.symbol}</td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-1 rounded text-xs ${
                          trade.type === 'LONG'
                            ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                            : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                        }`}>
                          {trade.type}
                        </span>
                      </td>
                      <td className={`py-3 px-4 ${themeClasses.text}`}>{trade.quantity}</td>
                      <td className={`py-3 px-4 ${themeClasses.text}`}>${trade.entryPrice}</td>
                      <td className={`py-3 px-4 ${themeClasses.text}`}>${trade.exitPrice}</td>
                      <td className={`py-3 px-4 font-medium ${trade.pnl >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        ${trade.pnl.toFixed(2)}
                      </td>
                      <td className={`py-3 px-4 ${trade.pnlPercent >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {trade.pnlPercent
                          ? trade.pnlPercent.toFixed(2)
                          : ((trade.pnl / (trade.entryPrice * trade.quantity)) * 100).toFixed(2)}%
                      </td>
                      <td className={`py-3 px-4 text-sm ${themeClasses.textSecondary}`}>{trade.duration || 'N/A'}</td>
                      <td className={`py-3 px-4 text-sm ${themeClasses.textSecondary}`}>{trade.broker}</td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-1 rounded text-xs bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200">
                          CLOSED
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  const BrokersPage = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className={`text-lg font-bold ${themeClasses.text}`}>Brokers</h2>
        <button
          onClick={() => setIsAddBrokerModalOpen(true)}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Broker
        </button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {brokers.map(broker => (
          <div key={broker.id} className={`${themeClasses.cardBg} rounded-lg border ${themeClasses.border} p-6 flex flex-col justify-between`}>
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className={`font-bold text-xl ${themeClasses.text}`}>{broker.name}</span>
                <span className={`flex items-center space-x-2`}>
                  {broker.status === 'connected' ? (
                    <>
                      <CheckCircle className="w-4 h-4 text-green-600" />
                      <span className="text-green-600 text-xs">Connected</span>
                    </>
                  ) : (
                    <>
                      <AlertCircle className="w-4 h-4 text-red-600" />
                      <span className="text-red-600 text-xs">Disconnected</span>
                    </>
                  )}
                </span>
              </div>
              <div className={`text-sm ${themeClasses.textSecondary} mb-2`}>
                Balance: <span className="font-medium">${broker.balance.toLocaleString()}</span>
              </div>
              <div className={`text-sm ${themeClasses.textSecondary} mb-4`}>
                Positions: <span className="font-medium">{broker.positions}</span>
              </div>
            </div>
            <div className="flex space-x-2 mt-auto">
              <button
                onClick={() => handleConfigureBroker(broker)}
                className="flex-1 px-3 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700 transition-colors"
              >
                Configure
              </button>
              {broker.status === 'disconnected' && (
                <button
                  className="flex-1 px-3 py-1 bg-green-600 text-white rounded text-xs hover:bg-green-700 transition-colors"
                >
                  Connect
                </button>
              )}
            </div>
          </div>
        ))}
        {brokers.length === 0 && (
          <div className="col-span-full text-center py-8 text-gray-500">
            No brokers found. Add a broker to get started.
          </div>
        )}
      </div>
    </div>
  );

  const SettingsPage = () => {
    const [algorithms, setAlgorithms] = useState([
      { id: 1, name: 'Mean Reversion', enabled: true, params: { window: 20, threshold: 1.5 } },
      { id: 2, name: 'Momentum', enabled: false, params: { window: 10, minVolume: 1000 } },
      { id: 3, name: 'Arbitrage', enabled: false, params: { spread: 0.2 } }
    ]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingAlgo, setEditingAlgo] = useState(null);

    // Open modal for add or edit
    const handleAdd = () => {
      setEditingAlgo(null);
      setIsModalOpen(true);
    };
    const handleEdit = (algo) => {
      setEditingAlgo(algo);
      setIsModalOpen(true);
    };

    // Toggle enabled/disabled
    const handleToggle = (id) => {
      setAlgorithms(algs => algs.map(algo =>
        algo.id === id ? { ...algo, enabled: !algo.enabled } : algo
      ));
    };

    // Save algorithm (add or edit)
    const handleSaveAlgorithm = (algoData) => {
      if (editingAlgo) {
        // Edit existing
        setAlgorithms(algs => algs.map(algo =>
          algo.id === editingAlgo.id ? { ...algo, ...algoData } : algo
        ));
      } else {
        // Add new
        setAlgorithms(algs => [
          ...algs,
          { ...algoData, id: Date.now(), enabled: false }
        ]);
      }
      setIsModalOpen(false);
      setEditingAlgo(null);
    };

    // Configure Algorithm Modal (used for both add and edit)
    const ConfigureAlgorithmModal = ({ algo, onSave, onClose }) => {
      const [algoName, setAlgoName] = useState(algo?.name || '');
      const [params, setParams] = useState(algo ? Object.entries(algo.params) : []);
      const [paramKey, setParamKey] = useState('');
      const [paramValue, setParamValue] = useState('');

      // Add new param
      const handleAddParam = (e) => {
        e.preventDefault();
        if (!paramKey) return;
        setParams(prev => [...prev, [paramKey, paramValue]]);
        setParamKey('');
        setParamValue('');
      };

      // Update param value
      const handleParamChange = (idx, value) => {
        setParams(prev => prev.map((p, i) => i === idx ? [p[0], value] : p));
      };

      // Remove param
      const handleRemoveParam = (idx) => {
        setParams(prev => prev.filter((_, i) => i !== idx));
      };

      // Save algorithm
      const handleSave = (e) => {
        e.preventDefault();
        const paramsObj = Object.fromEntries(params);
        onSave({ name: algoName, params: paramsObj });
      };

      return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className={`${themeClasses.modal} rounded-2xl p-8 w-full max-w-md`}>
            <div className="flex justify-between items-center mb-4">
              <h3 className={`text-lg font-bold ${themeClasses.text}`}>
                {algo ? 'Configure Algorithm' : 'Add Algorithm'}
              </h3>
              <button
                onClick={onClose}
                className={`${themeClasses.textSecondary} hover:${themeClasses.text}`}
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className={`block text-sm font-medium ${themeClasses.text} mb-1`}>Algorithm Name</label>
                <input
                  type="text"
                  value={algoName}
                  onChange={e => setAlgoName(e.target.value)}
                  className={`w-full px-3 py-2 border rounded ${themeClasses.input}`}
                  required
                />
              </div>
              <div>
                <label className={`block text-sm font-medium ${themeClasses.text} mb-1`}>Parameters</label>
                <div className="space-y-2">
                  {params.map(([key, value], idx) => (
                    <div key={key} className="flex items-center space-x-2">
                      <input
                        type="text"
                        value={key}
                        disabled
                        className={`w-1/3 px-2 py-1 border rounded ${themeClasses.input} bg-gray-100`}
                      />
                      <input
                        type="text"
                        value={value}
                        onChange={e => handleParamChange(idx, e.target.value)}
                        className={`w-2/3 px-2 py-1 border rounded ${themeClasses.input}`}
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveParam(idx)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                  <div className="flex items-center space-x-2 mt-2">
                    <input
                      type="text"
                      value={paramKey}
                      onChange={e => setParamKey(e.target.value)}
                      placeholder="Parameter name"
                      className={`w-1/3 px-2 py-1 border rounded ${themeClasses.input}`}
                    />
                    <input
                      type="text"
                      value={paramValue}
                      onChange={e => setParamValue(e.target.value)}
                      placeholder="Value"
                      className={`w-2/3 px-2 py-1 border rounded ${themeClasses.input}`}
                    />
                    <button
                      type="button"
                      onClick={handleAddParam}
                      className="px-2 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
                    >
                      Add
                    </button>
                  </div>
                </div>
              </div>
              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={onClose}
                  className={`flex-1 py-2 px-4 border ${themeClasses.border} ${themeClasses.text} rounded hover:${themeClasses.hover} transition-colors`}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 px-4 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                >
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      );

    };

    return (
      <div className={`${themeClasses.cardBg} rounded-lg border ${themeClasses.border} p-6 max-w-2xl mx-auto`}>
        <div className="flex justify-between items-center mb-4">
          <h2 className={`text-lg font-bold ${themeClasses.text}`}>Algorithm Configuration</h2>
          <button
            onClick={handleAdd}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Algorithm
          </button>
        </div>
        <div className="space-y-4">
          {algorithms.map(algo => (
            <div key={algo.id} className={`flex items-center justify-between p-4 rounded border ${themeClasses.border} ${themeClasses.cardBg}`}>
              <div>
                <div className={`font-bold ${themeClasses.text}`}>{algo.name}</div>
                <div className={`text-xs ${themeClasses.textSecondary}`}>Params: {JSON.stringify(algo.params)}</div>
              </div>
              <div className="flex items-center space-x-2">
                <label className="flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={algo.enabled}
                    onChange={() => handleToggle(algo.id)}
                    className="form-checkbox h-5 w-5 text-blue-600"
                  />
                  <span className={`ml-2 text-sm ${algo.enabled ? 'text-green-600' : themeClasses.textSecondary}`}>
                    {algo.enabled ? 'Enabled' : 'Disabled'}
                  </span>
                </label>
                <button
                  onClick={() => handleEdit(algo)}
                  className="px-3 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700 transition-colors"
                >
                  Configure
                </button>
              </div>
            </div>
          ))}
          {algorithms.length === 0 && (
            <div className={`text-center py-8 ${themeClasses.textSecondary}`}>
              No algorithms configured.
            </div>
          )}
        </div>
        {isModalOpen && (
          <ConfigureAlgorithmModal
            algo={editingAlgo}
            onSave={handleSaveAlgorithm}
            onClose={() => setIsModalOpen(false)}
          />
        )}
      </div>
    );
  };

  const Navigation = () => {
    const tabs = [
      { key: 'dashboard', label: 'Dashboard' },
      { key: 'portfolio', label: 'Portfolio' },
      { key: 'history', label: 'History' },
      { key: 'brokers', label: 'Brokers' },
      { key: 'settings', label: 'Settings' }, // Add Settings tab
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

  return (
    <div className={`min-h-screen ${themeClasses.bg}`}>
      {/* Header */}
      <header className={`${themeClasses.cardBg} border-b ${themeClasses.border} px-6 py-4`}>
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <BarChart3 className="w-8 h-8 text-blue-600" />
              <h1 className={`text-2xl font-bold ${themeClasses.text}`}>AlgoTrader Dashboard</h1>
            </div>
            
            <div className="flex items-center space-x-4">
              <select
                value={selectedBroker}
                onChange={(e) => setSelectedBroker(e.target.value)}
                className={`px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${themeClasses.input}`}
              >
                <option value="All">All Brokers</option>
                {brokers.filter(b => b.status === 'connected').map(broker => (
                  <option key={broker.id} value={broker.name}>{broker.name}</option>
                ))}
              </select>
              <select
                value={selectedAlgorithm}
                onChange={(e) => setSelectedAlgorithm(e.target.value)}
                className={`px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${themeClasses.input}`}
              >
                <option value="All">All Algorithms</option>
                {['Mean Reversion', 'Momentum', 'Arbitrage'].map(algo => (
                  <option key={algo} value={algo}>{algo}</option>))}
              </select>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            {/* Theme Toggle */}
            <div className="flex items-center space-x-2">
              <input
                type="radio"
                id="light-theme"
                name="theme"
                checked={!isDarkMode}
                onChange={() => setIsDarkMode(false)}
                className="sr-only"
              />
              <label
                htmlFor="light-theme"
                className={`flex items-center justify-center w-8 h-8 rounded-lg cursor-pointer transition-colors ${
                  !isDarkMode 
                    ? 'bg-blue-600 text-white' 
                    : `${themeClasses.hover} ${themeClasses.textSecondary}`
                }`}
              >
                <Sun className="w-4 h-4" />
              </label>
              
              <input
                type="radio"
                id="dark-theme"
                name="theme"
                checked={isDarkMode}
                onChange={() => setIsDarkMode(true)}
                className="sr-only"
              />
              <label
                htmlFor="dark-theme"
                className={`flex items-center justify-center w-8 h-8 rounded-lg cursor-pointer transition-colors ${
                  isDarkMode 
                    ? 'bg-blue-600 text-white' 
                    : `${themeClasses.hover} ${themeClasses.textSecondary}`
                }`}
              >
                <Moon className="w-4 h-4" />
              </label>
            </div>

            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className={`text-sm ${themeClasses.textSecondary}`}>Live Data</span>
            </div>
            <button 
              onClick={fetchPositions}
              className={`p-2 ${themeClasses.textSecondary} hover:${themeClasses.text} ${themeClasses.hover} rounded-lg transition-colors`}
              disabled={loading}
            >
              <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button
              className={`p-2 ${themeClasses.textSecondary} hover:${themeClasses.text} ${themeClasses.hover} rounded-lg transition-colors`}
              onClick={() => setActivePage('settings')}
            >
              <Settings className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <Navigation />

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
        {activePage === 'dashboard' && <DashboardPage />}
        {activePage === 'portfolio' && <PortfolioPage />}
        {activePage === 'history' && <TradeHistoryPage />}
        {activePage === 'brokers' && <BrokersPage />}
        {activePage === 'settings' && <SettingsPage />}
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
      {isManageModalOpen && selectedPosition && <ManagePositionModal />}
      {isAddBrokerModalOpen && <AddBrokerModal />}
      {isConfigureBrokerModalOpen && selectedBrokerForConfig && <ConfigureBrokerModal />}
    </div>
  );
};

const DashboardPage = () => (
  <ThemeProvider>
    <TradingDashboard />
  </ThemeProvider>
);

export default DashboardPage;