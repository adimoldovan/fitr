import { jest, describe, expect, test, beforeAll, afterAll, beforeEach } from '@jest/globals';
import { Transaction, TransactionType } from '../../types';
import { calculateTWR } from '../portfolioService';

// Mock date for consistent testing
beforeAll(() => {
  jest.useFakeTimers();
  jest.setSystemTime(new Date('2023-12-31'));
});

afterAll(() => {
  jest.useRealTimers();
});

describe('calculateTWR', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  test('should return 0 for empty transactions array', () => {
    const transactions: Transaction[] = [];
    const currentPrice = 100;
    
    const result = calculateTWR(transactions, currentPrice, new Date());
    
    expect(result).toBe(0);
  });
  
  test('should return 0 when currentPrice is 0 or negative', () => {
    const transactions: Transaction[] = [
      {
        date: '2023-01-01',
        type: TransactionType.BUY,
        quantity: 10,
        price: 150,
        fees: 0,
        notes: ''
      }
    ];
    
    expect(calculateTWR(transactions, 0, new Date())).toBe(0);
    expect(calculateTWR(transactions, -10, new Date())).toBe(0);
  });
  
  test('should return 0 when there are no relevant transactions', () => {
    const transactions: Transaction[] = [
      {
        date: '2023-01-01',
        type: TransactionType.DIVIDEND,
        quantity: 0,
        price: 0,
        fees: 0,
        notes: ''
      }
    ];
    
    const result = calculateTWR(transactions, 100, new Date());
    
    expect(result).toBe(0);
  });
  
  test('should calculate positive return correctly for a single buy transaction', () => {
    const transactions: Transaction[] = [
      {
        date: '2023-01-01',
        type: TransactionType.BUY,
        quantity: 10,
        price: 150,
        fees: 0,
        notes: ''
      }
    ];
    
    // Price increased by 10%
    const currentPrice = 165;
    
    const result = calculateTWR(transactions, currentPrice, new Date());
    
    // Expected return is 10%
    expect(result).toBeCloseTo(0.1, 5);
  });
  
  test('should calculate negative return correctly for a single buy transaction', () => {
    const transactions: Transaction[] = [
      {
        date: '2023-01-01',
        type: TransactionType.BUY,
        quantity: 10,
        price: 150,
        fees: 0,
        notes: ''
      }
    ];
    
    // Price decreased by 10%
    const currentPrice = 135;
    
    const result = calculateTWR(transactions, currentPrice, new Date());
    
    // Expected return is -10%
    expect(result).toBeCloseTo(-0.1, 5);
  });
  
  test('should handle multiple buy transactions correctly', () => {
    const transactions: Transaction[] = [
      {
        date: '2023-01-15',
        type: TransactionType.BUY,
        quantity: 2,
        price: 150,
        fees: 0,
        notes: ''
      },
      {
        date: '2023-03-10',
        type: TransactionType.BUY,
        quantity: 3,
        price: 160,
        fees: 0,
        notes: ''
      },
      {
        date: '2023-06-05',
        type: TransactionType.BUY,
        quantity: 2,
        price: 170,
        fees: 0,
        notes: ''
      },
      {
        date: '2023-09-20',
        type: TransactionType.BUY,
        quantity: 4,
        price: 180,
        fees: 0,
        notes: ''
      },
      {
        date: '2023-11-15',
        type: TransactionType.BUY,
        quantity: 1,
        price: 190,
        fees: 0,
        notes: ''
      }
    ];
    
    // Final price is 5% higher than the last purchase
    const currentPrice = 199.5;
    
    const result = calculateTWR(transactions, currentPrice, new Date());
    
    // Expected TWR calculation:
    // Period 1: 160/150 - 1 = 0.0667 (6.67% increase)
    // Period 2: 170/160 - 1 = 0.0625 (6.25% increase)
    // Period 3: 180/170 - 1 = 0.0588 (5.88% increase)
    // Period 4: 190/180 - 1 = 0.0556 (5.56% increase)
    // Period 5: 199.5/190 - 1 = 0.05 (5% increase)
    // TWR = (1 + 0.0667) * (1 + 0.0625) * (1 + 0.0588) * (1 + 0.0556) * (1 + 0.05) - 1
    // TWR ≈ 0.33 (33% total return)
    expect(result).toBeCloseTo(0.33, 2);
  });
  
  test('should handle buy and sell transactions correctly', () => {
    const transactions: Transaction[] = [
      {
        date: '2023-01-15',
        type: TransactionType.BUY,
        quantity: 10,
        price: 150,
        fees: 0,
        notes: 'Initial purchase'
      },
      {
        date: '2023-03-10',
        type: TransactionType.BUY,
        quantity: 5,
        price: 140,
        fees: 0,
        notes: 'Buying the dip'
      },
      {
        date: '2023-05-20',
        type: TransactionType.SELL,
        quantity: 3,
        price: 160,
        fees: 0,
        notes: 'Taking some profits'
      },
      {
        date: '2023-07-15',
        type: TransactionType.BUY,
        quantity: 8,
        price: 170,
        fees: 0,
        notes: 'Adding to position'
      },
      {
        date: '2023-09-05',
        type: TransactionType.SELL,
        quantity: 7,
        price: 185,
        fees: 0,
        notes: 'Taking more profits'
      },
      {
        date: '2023-11-20',
        type: TransactionType.BUY,
        quantity: 4,
        price: 175,
        fees: 0,
        notes: 'Final purchase of the year'
      }
    ];
    
    // Final price is about 10% higher than the last purchase
    const currentPrice = 192;
    
    const result = calculateTWR(transactions, currentPrice, new Date());
    
    // Expected TWR calculation with multiple buy/sell events:
    // Period 1 (Jan 15 - Mar 10): 140/150 = 0.933, HPR = -0.067 (6.7% decrease)
    // Period 2 (Mar 10 - May 20): 160/140 = 1.143, HPR = 0.143 (14.3% increase)
    // Period 3 (May 20 - Jul 15): 170/160 = 1.063, HPR = 0.063 (6.3% increase)
    // Period 4 (Jul 15 - Sep 05): 185/170 = 1.088, HPR = 0.088 (8.8% increase)
    // Period 5 (Sep 05 - Nov 20): 175/185 = 0.946, HPR = -0.054 (5.4% decrease)
    // Period 6 (Nov 20 - Dec 31): 192/175 = 1.097, HPR = 0.097 (9.7% increase)
    // TWR = (1 - 0.067) * (1 + 0.143) * (1 + 0.063) * (1 + 0.088) * (1 - 0.054) * (1 + 0.097) - 1
    // TWR ≈ 0.28 (28% total return)
    expect(result).toBeCloseTo(0.28, 2);
  });
  
  test('should handle transactions with extreme price changes within reasonable limits', () => {
    const transactions: Transaction[] = [
      {
        date: '2023-01-01',
        type: TransactionType.BUY,
        quantity: 10,
        price: 10,
        fees: 0,
        notes: ''
      }
    ];
    
    // Price increased by 500%
    const currentPrice = 60;
    
    const result = calculateTWR(transactions, currentPrice, new Date());
    
    // Expected return is 500%
    expect(result).toBeCloseTo(5.0, 5);
  });
  
  test('should handle transactions in non-chronological order', () => {
    const transactions: Transaction[] = [
      {
        date: '2023-06-01',
        type: TransactionType.BUY,
        quantity: 5,
        price: 180,
        fees: 0,
        notes: ''
      },
      {
        date: '2023-01-01',
        type: TransactionType.BUY,
        quantity: 5,
        price: 150,
        fees: 0,
        notes: ''
      }
    ];
    
    // Final price is 10% higher than the last purchase
    const currentPrice = 198;
    
    const result = calculateTWR(transactions, currentPrice, new Date());
    
    // Expected TWR should be the same as if transactions were in order
    // First period: 180/150 - 1 = 0.2 (20% increase)
    // Second period: 198/180 - 1 = 0.1 (10% increase)
    // TWR = (1 + 0.2) * (1 + 0.1) - 1 = 0.32 (32% total return)
    expect(result).toBeCloseTo(0.32, 5);
  });
  
  test('should handle a complete sell of all holdings', () => {
    const transactions: Transaction[] = [
      {
        date: '2023-01-01',
        type: TransactionType.BUY,
        quantity: 10,
        price: 150,
        fees: 0,
        notes: ''
      },
      {
        date: '2023-06-01',
        type: TransactionType.SELL,
        quantity: 10,
        price: 180,
        fees: 0,
        notes: ''
      }
    ];
    
    // Current price doesn't matter since all holdings were sold
    const currentPrice = 200;
    
    const result = calculateTWR(transactions, currentPrice, new Date());
    
    // Expected return is 20% (from the buy to sell)
    expect(result).toBeCloseTo(0.2, 5);
  });
});
