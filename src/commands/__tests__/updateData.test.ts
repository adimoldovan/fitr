import { PricePoint, PriceSource } from '../../types';
import { mergePriceHistories } from '../updateData';
import { describe, test, expect } from '@jest/globals';

describe('mergePriceHistories', () => {
  test('should merge two price histories without duplicates', () => {
    const existingHistory: PricePoint[] = [
      { date: '2023-01-01', price: 100, source: PriceSource.YAHOO },
      { date: '2023-01-02', price: 101, source: PriceSource.YAHOO },
      { date: '2023-01-03', price: 102, source: PriceSource.YAHOO }
    ];
    
    const newHistory: PricePoint[] = [
      { date: '2023-01-03', price: 102, source: PriceSource.YAHOO }, // Duplicate
      { date: '2023-01-04', price: 103, source: PriceSource.YAHOO }, // New
      { date: '2023-01-05', price: 104, source: PriceSource.YAHOO }  // New
    ];
    
    const result = mergePriceHistories(existingHistory, newHistory);
    
    // Should contain 5 unique price points
    expect(result).toHaveLength(5);
    
    // Check that all dates are present
    const dates = result.map(p => p.date);
    expect(dates).toContain('2023-01-01');
    expect(dates).toContain('2023-01-02');
    expect(dates).toContain('2023-01-03');
    expect(dates).toContain('2023-01-04');
    expect(dates).toContain('2023-01-05');
    
    // Check that there are no duplicates
    const uniqueDates = new Set(dates);
    expect(uniqueDates.size).toBe(5);
  });

  test('should handle empty existing history', () => {
    const existingHistory: PricePoint[] = [];
    
    const newHistory: PricePoint[] = [
      { date: '2023-01-01', price: 100, source: PriceSource.YAHOO },
      { date: '2023-01-02', price: 101, source: PriceSource.YAHOO }
    ];
    
    const result = mergePriceHistories(existingHistory, newHistory);
    
    expect(result).toHaveLength(2);
    expect(result).toEqual(newHistory);
  });

  test('should handle empty new history', () => {
    const existingHistory: PricePoint[] = [
      { date: '2023-01-01', price: 100, source: PriceSource.YAHOO },
      { date: '2023-01-02', price: 101, source: PriceSource.YAHOO }
    ];
    
    const newHistory: PricePoint[] = [];
    
    const result = mergePriceHistories(existingHistory, newHistory);
    
    expect(result).toHaveLength(2);
    expect(result).toEqual(existingHistory);
  });

  test('should handle both empty histories', () => {
    const existingHistory: PricePoint[] = [];
    const newHistory: PricePoint[] = [];
    
    const result = mergePriceHistories(existingHistory, newHistory);
    
    expect(result).toHaveLength(0);
    expect(result).toEqual([]);
  });

  test('should keep existing price when date is duplicated', () => {
    const existingHistory: PricePoint[] = [
      { date: '2023-01-01', price: 100, source: PriceSource.YAHOO }
    ];
    
    const newHistory: PricePoint[] = [
      { date: '2023-01-01', price: 200, source: PriceSource.MANUAL } // Different price and source
    ];
    
    const result = mergePriceHistories(existingHistory, newHistory);
    
    expect(result).toHaveLength(1);
    expect(result[0]).toEqual(existingHistory[0]); // Should keep the existing price
  });
});
