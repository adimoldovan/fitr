export interface Asset {
    name: string;
    type: AssetType;
    currency: string;
    symbol: string;
    quantity: number;
    avgCost: number;
    lastPrice: number;
    totalCost: number;
    currentValue: number;
    profit: number;
    profitPercentage: number;
    lastUpdated: string;
}

export enum AssetType {
    STOCK = 'stock',
    ETF = 'etf',
    CRYPTO = 'crypto',
    BOND = 'bond',
    OTHER = 'other'
}

export interface PortfolioSummary {
    assets: Asset[];
    cost: number;
    value: number;
    profit: number;
    profitPercentage: number;
    lastUpdated: string;
}

export interface AssetDetail {
    asset: Asset;
    transactions: Transaction[];
    priceHistory: PricePoint[];
}

export interface Transaction {
    date: string;
    type: TransactionType;
    quantity: number;
    price: number;
    fees?: number;
    notes?: string;
}

export enum TransactionType {
    BUY = 'buy',
    SELL = 'sell',
    DIVIDEND = 'dividend',
    SPLIT = 'split'
}

export interface PricePoint {
    date: string;
    price: number;
    source: PriceSource;
}

export enum PriceSource {
    YAHOO = 'yahoo',
    MANUAL = 'manual',
    CALCULATED = 'calculated'
}
