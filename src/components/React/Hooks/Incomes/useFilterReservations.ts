import { useState, useEffect } from 'react';

interface UseFilterReservationsProps {
  userId?: string | number;
  monthStorageKey?: string;
  yearStorageKey?: string;
}

interface UseFilterReservationsReturn {
  selectedMonth: string;
  selectedYear: string;
  setSelectedMonth: React.Dispatch<React.SetStateAction<string>>;
  setSelectedYear: React.Dispatch<React.SetStateAction<string>>;
  handleFilterReservations: (month: string, year: string) => void;
}

/**
 * Custom hook to manage date filter state with localStorage persistence
 * @param userId - The user ID for scoping localStorage keys
 * @param monthStorageKey - Optional custom storage key for month (defaults to 'selectedMonth')
 * @param yearStorageKey - Optional custom storage key for year (defaults to 'selectedYear')
 */
export function useFilterReservations({
  userId,
  monthStorageKey = 'selectedMonth',
  yearStorageKey = 'selectedYear',
}: UseFilterReservationsProps): UseFilterReservationsReturn {
  const [selectedMonth, setSelectedMonth] = useState<string>('');
  const [selectedYear, setSelectedYear] = useState<string>('');

  // Load year and month from localStorage on mount
  useEffect(() => {
    const now = new Date();
    const currentYear = String(now.getFullYear());
    const currentMonth = String(now.getMonth() + 1).padStart(2, '0');

    if (typeof window !== 'undefined' && userId) {
      try {
        const savedYear = localStorage.getItem(
          `host:${userId}:incomes:${yearStorageKey}`
        );
        const savedMonth = localStorage.getItem(
          `host:${userId}:incomes:${monthStorageKey}`
        );

        // Default to current year and month if not found in localStorage
        setSelectedYear(savedYear || currentYear);
        setSelectedMonth(savedMonth || currentMonth);
      } catch (error) {
        console.error(
          '[useFilterReservations] Error reading localStorage:',
          error
        );
        // If there's an error, default to current year and month
        setSelectedYear(currentYear);
        setSelectedMonth(currentMonth);
      }
    } else {
      // If no user, still set current year and month
      setSelectedYear(currentYear);
      setSelectedMonth(currentMonth);
    }
  }, [userId, monthStorageKey, yearStorageKey]);

  // Handle filter application and persist to localStorage
  const handleFilterReservations = (month: string, year: string) => {
    setSelectedMonth(month);
    setSelectedYear(year);

    // Save to localStorage
    if (typeof window !== 'undefined' && userId) {
      try {
        localStorage.setItem(`host:${userId}:incomes:${yearStorageKey}`, year);
        localStorage.setItem(
          `host:${userId}:incomes:${monthStorageKey}`,
          month
        );
      } catch (error) {
        console.error(
          '[useFilterReservations] Error saving to localStorage:',
          error
        );
      }
    }
  };

  return {
    selectedMonth,
    selectedYear,
    setSelectedMonth,
    setSelectedYear,
    handleFilterReservations,
  };
}
