import { renderHook, act, waitFor } from '@testing-library/react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { useFilterReservations } from '@/components/React/Hooks/Incomes/useFilterReservations';

describe('useFilterReservations', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('should initialize with current year and month', async () => {
    const { result } = renderHook(() => useFilterReservations({ userId: 123 }));

    await waitFor(() => {
      expect(result.current.selectedYear).toBeTruthy();
      expect(result.current.selectedMonth).toBeTruthy();
    });

    const now = new Date();
    const currentYear = String(now.getFullYear());
    const currentMonth = String(now.getMonth() + 1).padStart(2, '0');

    expect(result.current.selectedYear).toBe(currentYear);
    expect(result.current.selectedMonth).toBe(currentMonth);
  });

  it('should restore values from localStorage', async () => {
    localStorage.setItem('host:123:incomes:selectedYear', '2025');
    localStorage.setItem('host:123:incomes:selectedMonth', '10');

    const { result } = renderHook(() => useFilterReservations({ userId: 123 }));

    await waitFor(() => {
      expect(result.current.selectedYear).toBe('2025');
      expect(result.current.selectedMonth).toBe('10');
    });
  });

  it('should use custom storage keys', async () => {
    localStorage.setItem('host:123:incomes:customYear', '2024');
    localStorage.setItem('host:123:incomes:customMonth', '12');

    const { result } = renderHook(() =>
      useFilterReservations({
        userId: 123,
        yearStorageKey: 'customYear',
        monthStorageKey: 'customMonth',
      })
    );

    await waitFor(() => {
      expect(result.current.selectedYear).toBe('2024');
      expect(result.current.selectedMonth).toBe('12');
    });
  });

  it('should handle filter reservations and save to localStorage', async () => {
    const { result } = renderHook(() => useFilterReservations({ userId: 123 }));

    await waitFor(() => {
      expect(result.current.selectedYear).toBeTruthy();
    });

    act(() => {
      result.current.handleFilterReservations('11', '2025');
    });

    await waitFor(() => {
      expect(result.current.selectedMonth).toBe('11');
      expect(result.current.selectedYear).toBe('2025');
    });

    expect(localStorage.getItem('host:123:incomes:selectedYear')).toBe('2025');
    expect(localStorage.getItem('host:123:incomes:selectedMonth')).toBe('11');
  });

  it('should update selectedMonth with setSelectedMonth', async () => {
    const { result } = renderHook(() => useFilterReservations({ userId: 123 }));

    await waitFor(() => {
      expect(result.current.selectedMonth).toBeTruthy();
    });

    act(() => {
      result.current.setSelectedMonth('09');
    });

    await waitFor(() => {
      expect(result.current.selectedMonth).toBe('09');
    });
  });

  it('should update selectedYear with setSelectedYear', async () => {
    const { result } = renderHook(() => useFilterReservations({ userId: 123 }));

    await waitFor(() => {
      expect(result.current.selectedYear).toBeTruthy();
    });

    act(() => {
      result.current.setSelectedYear('2024');
    });

    await waitFor(() => {
      expect(result.current.selectedYear).toBe('2024');
    });
  });

  it('should work without userId', async () => {
    const { result } = renderHook(() =>
      useFilterReservations({ userId: undefined })
    );

    await waitFor(() => {
      expect(result.current.selectedYear).toBeTruthy();
      expect(result.current.selectedMonth).toBeTruthy();
    });

    const now = new Date();
    const currentYear = String(now.getFullYear());
    const currentMonth = String(now.getMonth() + 1).padStart(2, '0');

    expect(result.current.selectedYear).toBe(currentYear);
    expect(result.current.selectedMonth).toBe(currentMonth);
  });

  it('should not save to localStorage if userId is not provided', async () => {
    const { result } = renderHook(() =>
      useFilterReservations({ userId: undefined })
    );

    await waitFor(() => {
      expect(result.current.selectedYear).toBeTruthy();
    });

    act(() => {
      result.current.handleFilterReservations('10', '2025');
    });

    await waitFor(() => {
      expect(result.current.selectedMonth).toBe('10');
    });

    expect(
      localStorage.getItem('host:undefined:incomes:selectedYear')
    ).toBeNull();
    expect(
      localStorage.getItem('host:undefined:incomes:selectedMonth')
    ).toBeNull();
  });

  it('should handle localStorage read errors gracefully', async () => {
    // Mock localStorage.getItem to throw an error
    const originalGetItem = localStorage.getItem;
    localStorage.getItem = vi.fn(() => {
      throw new Error('Storage error');
    });

    const { result } = renderHook(() => useFilterReservations({ userId: 123 }));

    await waitFor(() => {
      expect(result.current.selectedYear).toBeTruthy();
    });

    // Should default to current year and month
    const now = new Date();
    const currentYear = String(now.getFullYear());
    const currentMonth = String(now.getMonth() + 1).padStart(2, '0');

    expect(result.current.selectedYear).toBe(currentYear);
    expect(result.current.selectedMonth).toBe(currentMonth);

    // Restore original
    localStorage.getItem = originalGetItem;
  });

  it('should handle localStorage write errors gracefully', async () => {
    // Mock localStorage.setItem to throw an error
    const originalSetItem = localStorage.setItem;
    localStorage.setItem = vi.fn(() => {
      throw new Error('Storage error');
    });

    const { result } = renderHook(() => useFilterReservations({ userId: 123 }));

    await waitFor(() => {
      expect(result.current.selectedYear).toBeTruthy();
    });

    // Should still update state even if localStorage fails
    act(() => {
      result.current.handleFilterReservations('11', '2026');
    });

    await waitFor(() => {
      expect(result.current.selectedMonth).toBe('11');
      expect(result.current.selectedYear).toBe('2026');
    });

    // Restore original
    localStorage.setItem = originalSetItem;
  });

  it('should pad month with leading zero', async () => {
    const { result } = renderHook(() => useFilterReservations({ userId: 123 }));

    await waitFor(() => {
      expect(result.current.selectedYear).toBeTruthy();
    });

    // Assuming current month is October (10)
    const currentMonth = result.current.selectedMonth;
    expect(currentMonth.length).toBe(2);
  });
});
