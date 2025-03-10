import { formatDate, getDateForPeriod } from '../dateUtils';

beforeAll(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date(2023, 4, 15));
});

afterAll(() => {
    jest.useRealTimers();
});


describe('formatDate', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('formats a Date object correctly', () => {
    const testDate = new Date(2023, 0, 15); // January 15, 2023
    const result = formatDate(testDate);
    expect(result).toBe('Jan 15, 2023');
  });

  test('parses and formats a date string correctly', () => {
    const dateString = '2023-02-20';
    const result = formatDate(dateString);
    expect(result).toBe('Feb 20, 2023');
  });
});

describe('getDateForPeriod', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('returns correct date for "day" period', () => {
    const result = getDateForPeriod('day');
    expect(result).toBe('2023-05-14');
  });

  test('returns correct date for "week" period', () => {
    const result = getDateForPeriod('week');
    expect(result).toBe('2023-05-08');
  });

  test('returns correct date for "month" period', () => {
    const result = getDateForPeriod('month');
    expect(result).toBe('2023-04-15');
  });

  test('returns correct date for "year" period', () => {
    const result = getDateForPeriod('year');
    expect(result).toBe('2022-05-15');
  });

  test('returns correct date for "ytd" period', () => {
    const result = getDateForPeriod('ytd');
    expect(result).toBe('2023-01-01');
  });

  test('returns today for unknown period', () => {
    // @ts-expect-error Testing invalid input
    const result = getDateForPeriod('invalid');
    expect(result).toBe('2023-05-15');
  });
}); 