import type { SupportedLanguages } from '@/utils/i18n';
import { getTranslation } from '@/utils/i18n';
import Modal from '@/components/React/Common/Modal';
import { useState, useEffect } from 'react';
import XMarkMini from '/src/icons/x-mark-mini.svg?react';
import ChevronDown from '/src/icons/chevron-down.svg?react';
import { isAfter, isBefore, startOfMonth, parse } from 'date-fns';
import { generateYears } from '@/utils/dateUtils';

interface Props {
  open: boolean;
  onClose: () => void;
  onApply: (month: string, year: string) => void;
  lang?: SupportedLanguages;
  selectedMonth?: string;
  selectedYear?: string;
  /**
   * Determines which selections are required to enable the apply button:
   * - 'both': Both year and month must be selected (default)
   * - 'year-only': Only year is required, month is optional
   * - 'none': No selection required (always enabled)
   */
  requiredSelection?: 'both' | 'year-only' | 'none';
}

export default function ModalFilterReservations({
  open,
  onClose,
  onApply,
  lang = 'es',
  selectedMonth,
  selectedYear,
  requiredSelection = 'both',
}: Props) {
  const t = getTranslation(lang);

  // Application launch date: October 2025 (minimum selectable date)
  const MIN_YEAR = 2025;
  const MIN_MONTH = 10;
  const MIN_DATE = new Date(MIN_YEAR, MIN_MONTH - 1, 1);

  // Use state to avoid hydration issues with dynamic date
  const [currentYear, setCurrentYear] = useState<number>(2025);
  const [currentMonth, setCurrentMonth] = useState<number>(11);

  // Maximum date: Current month of current year (no future dates allowed)
  const MAX_DATE = new Date(currentYear, currentMonth, 1);

  const [selectedMonthValue, setSelectedMonthValue] = useState<string>(
    selectedMonth || ''
  );
  const [selectedYearValue, setSelectedYearValue] = useState<string>(
    selectedYear || ''
  );

  // Set current year and month on mount
  useEffect(() => {
    const now = new Date();
    setCurrentYear(now.getFullYear());
    setCurrentMonth(now.getMonth()); // getMonth() returns 0-based month (0 = January, 10 = November)
  }, []);

  const months = [
    { value: '01', label: t.incomes.months.january },
    { value: '02', label: t.incomes.months.february },
    { value: '03', label: t.incomes.months.march },
    { value: '04', label: t.incomes.months.april },
    { value: '05', label: t.incomes.months.may },
    { value: '06', label: t.incomes.months.june },
    { value: '07', label: t.incomes.months.july },
    { value: '08', label: t.incomes.months.august },
    { value: '09', label: t.incomes.months.september },
    { value: '10', label: t.incomes.months.october },
    { value: '11', label: t.incomes.months.november },
    { value: '12', label: t.incomes.months.december },
  ];

  // Generate years dynamically
  const years = generateYears(MIN_YEAR, currentYear);

  useEffect(() => {
    if (open) {
      setSelectedMonthValue(selectedMonth || '');
      setSelectedYearValue(selectedYear || '');
    }
  }, [open, selectedMonth, selectedYear]);

  // Validate date range
  const isValidSelection = (month: string, year: string): boolean => {
    if (!month || !year) return false;
    try {
      const selectedDate = parse(
        `${year}-${month}-01`,
        'yyyy-MM-dd',
        new Date()
      );
      const selectedStart = startOfMonth(selectedDate);
      return (
        !isBefore(selectedStart, startOfMonth(MIN_DATE)) &&
        !isAfter(selectedStart, startOfMonth(MAX_DATE))
      );
    } catch {
      return false;
    }
  };

  // Filter months based on selected year
  const getAvailableMonths = () => {
    if (!selectedYearValue) return months;
    const year = parseInt(selectedYearValue);

    // For minimum year (2025), only show months from October onwards
    if (year === MIN_YEAR) {
      const minMonths = months.filter((m) => parseInt(m.value) >= MIN_MONTH);

      // If it's also the current year, limit to current month
      if (year === currentYear) {
        return minMonths.filter((m) => parseInt(m.value) <= currentMonth + 1); // +1 because getMonth() is 0-based
      }
      return minMonths;
    }

    // For current year, only show months up to current month
    if (year === currentYear) {
      return months.filter((m) => parseInt(m.value) <= currentMonth + 1); // +1 because getMonth() is 0-based
    }

    return months;
  };

  // Determine if the apply button should be enabled based on requiredSelection
  const isApplyEnabled = () => {
    switch (requiredSelection) {
      case 'none':
        return true;
      case 'year-only':
        if (!selectedYearValue) return false;
        // If month is also selected, validate the combination
        if (selectedMonthValue) {
          return isValidSelection(selectedMonthValue, selectedYearValue);
        }
        return true;
      case 'both':
      default:
        return (
          selectedMonthValue &&
          selectedYearValue &&
          isValidSelection(selectedMonthValue, selectedYearValue)
        );
    }
  };

  const handleApply = () => {
    if (isApplyEnabled()) {
      onApply(selectedMonthValue, selectedYearValue);
      onClose();
    }
  };

  return (
    <Modal
      open={open}
      title={t.incomes.filterByDates}
      TitleSubtitleContentClass="flex-col items-start mt-4"
      titleClass="text-lg font-semibold"
      onClose={onClose}
      topLeftButton={false}
      topRightAction={
        <button
          onClick={onClose}
          className="mt-8 flex cursor-pointer items-center justify-center md:mr-10"
        >
          <XMarkMini className="h-5 w-5" />
        </button>
      }
      footer={
        <div className="flex w-full gap-2">
          <button
            onClick={handleApply}
            className="btn btn-primary flex-1 rounded-full text-sm font-medium"
            disabled={!isApplyEnabled()}
          >
            {t.incomes.apply}
          </button>
        </div>
      }
      lang={lang}
      widthClass="max-w-md"
    >
      <div className="pointer-events-auto flex w-full flex-col gap-4 px-2">
        {/* Year Selection */}
        <div className="flex w-full flex-col gap-1">
          <label className="text-base-content/70 px-1 text-xs">
            {t.incomes.selectYear || 'Select Year'}
          </label>
          <div className="pointer-events-auto relative z-20">
            <select
              value={selectedYearValue}
              onChange={(e) => {
                setSelectedYearValue(e.target.value);
                if (!isValidSelection(selectedMonthValue, e.target.value)) {
                  setSelectedMonthValue('');
                }
              }}
              className="select select-bordered border-primary/40 pointer-events-auto w-full cursor-pointer appearance-none rounded-full pr-10 text-sm font-semibold"
            >
              {/* Show placeholder only when year selection is completely optional ('none') */}
              {requiredSelection === 'none' ? (
                <option value="">
                  {t.incomes.selectAYear || 'Select a year'}
                </option>
              ) : null}

              {years.map((year) => (
                <option key={year.value} value={year.value}>
                  {year.label}
                </option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute top-1/2 right-3 h-4 w-4 -translate-y-1/2" />
          </div>
        </div>

        {/* Month Selection */}
        <div className="flex w-full flex-col gap-1">
          <label className="text-base-content/70 px-1 text-xs">
            {t.incomes.selectMonth || 'Select Month'}
          </label>
          <div className="pointer-events-auto relative z-20">
            <select
              value={selectedMonthValue}
              onChange={(e) => setSelectedMonthValue(e.target.value)}
              className="select select-bordered border-primary/40 pointer-events-auto w-full cursor-pointer appearance-none rounded-full pr-10 text-sm font-semibold"
              disabled={requiredSelection !== 'none' && !selectedYearValue}
            >
              {/* Show placeholder when month is not strictly required ('none' or 'year-only') */}
              {requiredSelection !== 'both' ? (
                <option value="">
                  {t.incomes.selectAMonth || 'Select a month'}
                </option>
              ) : null}

              {getAvailableMonths().map((month) => (
                <option key={month.value} value={month.value}>
                  {month.label}
                </option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute top-1/2 right-3 h-4 w-4 -translate-y-1/2" />
          </div>
        </div>
      </div>
    </Modal>
  );
}
