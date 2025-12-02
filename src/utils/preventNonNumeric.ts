import type { KeyboardEvent } from 'react';

export type NumericKeyBlockOptions = {
  allowNegative?: boolean;
  allowDecimal?: boolean;
  blockExponent?: boolean;
};

const DEFAULTS: Required<NumericKeyBlockOptions> = {
  allowNegative: false,
  allowDecimal: false,
  blockExponent: true,
};

export function preventNonNumericKeydown(
  e: KeyboardEvent<HTMLInputElement>,
  opts?: NumericKeyBlockOptions
): void {
  const { allowNegative, allowDecimal, blockExponent } = {
    ...DEFAULTS,
    ...opts,
  };

  if (e.ctrlKey || e.metaKey || e.altKey) return;

  const k = e.key;

  if (blockExponent && (k === 'e' || k === 'E')) {
    e.preventDefault();
    return;
  }

  if (!allowNegative && (k === '+' || k === '-')) {
    e.preventDefault();
    return;
  }

  if (!allowDecimal && (k === '.' || k === ',')) {
    e.preventDefault();
  }
}

export function handleIntegerKeydown(e: KeyboardEvent<HTMLInputElement>): void {
  preventNonNumericKeydown(e, {
    allowNegative: false,
    allowDecimal: false,
    blockExponent: true,
  });
}

/**
 * Filters a string to only allow numeric characters (0-9).
 * Use this in onChange handlers to restrict input to numbers only.
 *
 * @param value - The input value to filter
 * @returns The filtered value containing only digits, or empty string
 *
 * @example
 * ```tsx
 * <input
 *   value={phoneNumber}
 *   onChange={(e) => setPhoneNumber(filterNumericInput(e.target.value))}
 * />
 * ```
 */
export function filterNumericInput(value: string): string {
  if (value === '') return '';
  // Remove all non-digit characters
  return value.replace(/\D/g, '');
}

/**
 * Checks if a value contains only numeric characters.
 *
 * @param value - The value to check
 * @returns true if the value is empty or contains only digits
 */
export function isNumericInput(value: string): boolean {
  return value === '' || /^\d+$/.test(value);
}
