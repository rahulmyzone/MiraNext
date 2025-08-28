// API Service Layer
export class TradingAPI {
  constructor(baseURL = '/api/v1') {
    this.baseURL = baseURL;
  }

  async request(endpoint, options = {}) {
    try {
      const response = await fetch(`${this.baseURL}${endpoint}`, {
        headers: {
          'Content-Type': 'application/json',
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

  async getPositions(brokerFilter = null) {
    const params = brokerFilter ? `?broker=${encodeURIComponent(brokerFilter)}` : '';
    return this.request(`/positions${params}`);
  }
}

// Mock data for development
export const mockData = {
  positions: [
    { id: 1, symbol: 'AAPL', type: 'LONG', quantity: 100, entryPrice: 150.25, currentPrice: 155.80, pnl: 555, broker: 'TD Ameritrade', algorithm: 'Mean Reversion', status: 'OPEN' },
    { id: 2, symbol: 'TSLA', type: 'SHORT', quantity: 50, entryPrice: 220.15, currentPrice: 215.30, pnl: 242.50, broker: 'Interactive Brokers', algorithm: 'Momentum', status: 'OPEN' },
    // ...more mock positions
  ],
  brokers: [
    { id: 'td', name: 'TD Ameritrade', status: 'connected', balance: 50000, positions: 5 },
    { id: 'ib', name: 'Interactive Brokers', status: 'connected', balance: 75000, positions: 3 },
    // ...more mock brokers
  ],
  portfolioHistory: [
    { date: '2024-01-01', value: 100000, pnl: 0, algorithm: 'Mean Reversion' },
    // ...more mock history
  ],
  tradeHistory: [
    { id: 1, symbol: 'AAPL', type: 'LONG', quantity: 100, entryPrice: 145.20, exitPrice: 152.30, pnl: 710, broker: 'TD Ameritrade', algorithm: 'Mean Reversion', date: '2024-01-10', duration: '2h 15m' },
    // ...more mock trades
  ]
};

export const availableBrokers = [
  'TD Ameritrade',
  'Interactive Brokers',
  'Charles Schwab',
  'Zerodha',
  'Alpaca',
  'Robinhood',
  'Fidelity',
  'E*TRADE'
];