import React, { useState, useEffect, useCallback } from 'react';
import { TrendingUp, TrendingDown, Activity, DollarSign, BarChart3, Settings, RefreshCw, X, Edit2, PieChart, History, Home, Building2, AlertCircle, CheckCircle } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart as RechartsPieChart, Cell, BarChart, Bar } from 'recharts';

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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Mock data for development (remove when API is ready)
  const mockData = {
    positions: [
      { 
        id: 1, 
        symbol: 'AAPL', 
        type: 'LONG', 
        quantity: 100, 
        entryPrice: 150.25, 
        currentPrice: 155.80, 
        pnl: 555, 
        pnlPercent: 3.69, 
        broker: 'TD Ameritrade', 
        status: 'OPEN',
        timestamp: '2024-01-15 09:30:00',
        stopLoss: 145.00,
        takeProfit: 160.00
      },
      { 
        id: 2, 
        symbol: 'TSLA', 
        type: 'SHORT', 
        quantity: 50, 
        entryPrice: 220.15, 
        currentPrice: 215.30, 
        pnl: 242.50, 
        pnlPercent: 2.20, 
        broker: 'Interactive Brokers', 
        status: 'OPEN',
        timestamp: '2024-01-15 10:45:00',
        stopLoss: 225.00,
        takeProfit: 210.00
      },
      { 
        id: 3, 
        symbol: 'MSFT', 
        type: 'LONG', 
        quantity: 75, 
        entryPrice: 380.90, 
        currentPrice: 375.20, 
        pnl: -427.50, 
        pnlPercent: -1.50, 
        broker: 'Zerodha', 
        status: 'OPEN',
        timestamp: '2024-01-15 11:20:00',
        stopLoss: 370.00,
        takeProfit: 390.00
      }
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
      { date: '2024-01-01', value: 100000, pnl: 0 },
      { date: '2024-01-08', value: 102500, pnl: 2500 },
      { date: '2024-01-15', value: 104800, pnl: 4800 },
      { date: '2024-01-22', value: 103200, pnl: 3200 },
      { date: '2024-01-29', value: 106500, pnl: 6500 },
    ],
    tradeHistory: [
      { id: 1, symbol: 'AAPL', type: 'LONG', quantity: 100, entryPrice: 145.20, exitPrice: 152.30, pnl: 710, broker: 'TD Ameritrade', date: '2024-01-10', duration: '2h 15m' },
      { id: 2, symbol: 'TSLA', type: 'SHORT', quantity: 50, entryPrice: 225.80, exitPrice: 220.15, pnl: 282.50, broker: 'Interactive Brokers', date: '2024-01-12', duration: '45m' },
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
      //const data = mockData.brokers;
      const data = await api.getBrokers();
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

  // Filter positions by selected broker
  const filteredPositions = selectedBroker === 'All' 
    ? positions 
    : positions.filter(pos => pos.broker === selectedBroker);

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

  // Components
  const PositionCard = ({ position, isOpen = true }) => (
    <div className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start mb-3">
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2">
            <span className="font-bold text-lg">{position.symbol}</span>
            <span className={`px-2 py-1 rounded text-xs font-medium ${
              position.type === 'LONG' 
                ? 'bg-green-100 text-green-800' 
                : 'bg-red-100 text-red-800'
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

      <div className="grid grid-cols-2 gap-4 text-sm text-gray-600 mb-3">
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
        <span className="text-xs text-gray-500">
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
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <div className="flex justify-between items-start mb-3">
        <div className="flex items-center space-x-3">
          <Building2 className="w-6 h-6 text-gray-600" />
          <span className="font-bold text-lg">{broker.broker}</span>
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

      <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
        <div>
          <span className="block">Balance: ${broker.balance.toLocaleString()}</span>
          <span className="block">Positions: {broker.positions}</span>
        </div>
        <div className="text-right">
          <button className="px-3 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700 transition-colors">
            Configure
          </button>
        </div>
      </div>
    </div>
  );

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
                <th className="text-left py-2">Symbol</th>
                <th className="text-left py-2">Type</th>
                <th className="text-left py-2">Quantity</th>
                <th className="text-left py-2">Entry</th>
                <th className="text-left py-2">Exit</th>
                <th className="text-left py-2">P&L</th>
                <th className="text-left py-2">Broker</th>
                <th className="text-left py-2">Duration</th>
              </tr>
            </thead>
            <tbody>
              {tradeHistory.map(trade => (
                <tr key={trade.id} className="border-b">
                  <td className="py-2 font-medium">{trade.symbol}</td>
                  <td className="py-2">
                    <span className={`px-2 py-1 rounded text-xs ${
                      trade.type === 'LONG' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {trade.type}
                    </span>
                  </td>
                  <td className="py-2">{trade.quantity}</td>
                  <td className="py-2">${trade.entryPrice}</td>
                  <td className="py-2">${trade.exitPrice}</td>
                  <td className={`py-2 font-medium ${trade.pnl >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    ${trade.pnl.toFixed(2)}
                  </td>
                  <td className="py-2 text-sm">{trade.broker}</td>
                  <td className="py-2 text-sm">{trade.duration}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const BrokersPage = () => (
    <div className="space-y-6">
      {/* Broker Status Overview */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-lg font-bold mb-4">Broker Status Overview</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {brokers.map(broker => (
            <BrokerCard key={broker.id} broker={broker} />
          ))}
        </div>
      </div>

      {/* Add New Broker */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-lg font-bold mb-4">Add New Broker</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Broker Name</label>
            <select className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
              <option>Select a broker...</option>
              <option>Finvasia</option>
              <option>Define Edge</option>
              <option>Dhan</option>
              <option>Flattrade</option>
              <option>Zerodha</option>
            </select>
          </div>
          <div className="flex items-end">
            <button className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors">
              Add Broker
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  const Navigation = () => (
    <nav className="bg-white border-b border-gray-200">
      <div className="flex space-x-8 px-6">
        <button
          onClick={() => setActivePage('dashboard')}
          className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
            activePage === 'dashboard'
              ? 'border-blue-500 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
          }`}
        >
          <Home className="w-4 h-4" />
          <span>Dashboard</span>
        </button>
        <button
          onClick={() => setActivePage('portfolio')}
          className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
            activePage === 'portfolio'
              ? 'border-blue-500 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
          }`}
        >
          <PieChart className="w-4 h-4" />
          <span>Portfolio</span>
        </button>
        <button
          onClick={() => setActivePage('history')}
          className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
            activePage === 'history'
              ? 'border-blue-500 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
          }`}
        >
          <History className="w-4 h-4" />
          <span>Trade History</span>
        </button>
        <button
          onClick={() => setActivePage('brokers')}
          className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
            activePage === 'brokers'
              ? 'border-blue-500 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
          }`}
        >
          <Building2 className="w-4 h-4" />
          <span>Brokers</span>
        </button>
      </div>
    </nav>
  );

  const TradeHistoryPage = () => (
    <div className="space-y-6">
      {/* Filters */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-lg font-bold mb-4">Trade History Filters</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Date Range</label>
            <select className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
              <option>Last 7 days</option>
              <option>Last 30 days</option>
              <option>Last 3 months</option>
              <option>Last year</option>
              <option>All time</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Symbol</label>
            <input
              type="text"
              placeholder="e.g., AAPL, TSLA"
              className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Trade Type</label>
            <select className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
              <option>All</option>
              <option>LONG</option>
              <option>SHORT</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Broker</label>
            <select className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
              <option>All Brokers</option>
              {brokers.map(broker => (
                <option key={broker.id}>{broker.broker}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Trade History Table */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-bold">All Trades</h2>
          <button className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors">
            Export CSV
          </button>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="border-b bg-gray-50">
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
                <tr key={trade.id} className="border-b hover:bg-gray-50">
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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <BarChart3 className="w-8 h-8 text-blue-600" />
              <h1 className="text-2xl font-bold text-gray-900">Options Warrior Dashboard</h1>
            </div>
            
            <select
              value={selectedBroker}
              onChange={(e) => setSelectedBroker(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="All">All Brokers</option>
              {brokers.filter(b => b.status === 'connected').map(broker => (
                <option key={broker.id} value={broker.broker}>{broker.broker}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-sm text-gray-600">Live Data</span>
            </div>
            <button 
              onClick={fetchPositions}
              className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
              disabled={loading}
            >
              <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors">
              <Settings className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <Navigation />

      {/* Error Display */}
      {error && (
        <div className="mx-6 mt-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
          <button
            onClick={() => setError(null)}
            className="float-right text-red-500 hover:text-red-700"
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
      </div>

      {/* Loading Overlay */}
      {loading && (
        <div className="fixed inset-0 bg-black bg-opacity-25 flex items-center justify-center z-40">
          <div className="bg-white rounded-lg p-6 flex items-center space-x-3">
            <RefreshCw className="w-5 h-5 animate-spin text-blue-600" />
            <span>Loading...</span>
          </div>
        </div>
      )}

      {/* Manage Position Modal */}
      {isManageModalOpen && selectedPosition && <ManagePositionModal />}
    </div>
  );
};

export default TradingDashboard;