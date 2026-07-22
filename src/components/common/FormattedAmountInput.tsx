import React, { useEffect, useState } from 'react';

/** Formats string/number with thousand commas (e.g. 147636 -> "147,636") */
export function formatInputWithCommas(value: number | string): string {
  if (value === '' || value === null || value === undefined) return '';
  const str = String(value).replace(/,/g, '');
  if (isNaN(Number(str)) && str !== '.') return str;
  const parts = str.split('.');
  const integerPart = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return parts.length > 1 ? `${integerPart}.${parts[1]}` : integerPart;
}

export function parseFormattedNumber(val: string): number {
  const cleaned = val.replace(/,/g, '');
  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? 0 : parsed;
}

export interface FormattedAmountInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'value'> {
  value: number | string;
  onValueChange: (numericValue: number) => void;
  max?: number;
}

export const FormattedAmountInput: React.FC<FormattedAmountInputProps> = ({
  value,
  onValueChange,
  max,
  className = '',
  onFocus,
  ...props
}) => {
  const [text, setText] = useState<string>(() =>
    value || value === 0 ? formatInputWithCommas(value) : ''
  );

  useEffect(() => {
    let numericProp = typeof value === 'number' ? value : parseFormattedNumber(value);
    if (max !== undefined && numericProp > max) {
      numericProp = max;
    }
    const numericText = parseFormattedNumber(text);
    if (numericProp !== numericText) {
      setText(numericProp || numericProp === 0 ? formatInputWithCommas(numericProp) : '');
    }
  }, [value, max]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    const cleaned = raw.replace(/[^0-9.]/g, '');
    const parts = cleaned.split('.');
    if (parts.length > 2) return;

    let num = parseFormattedNumber(cleaned);
    let finalCleaned = cleaned;
    if (max !== undefined && num > max) {
      num = max;
      finalCleaned = String(max);
    }

    const formatted = formatInputWithCommas(finalCleaned);
    setText(formatted);
    onValueChange(num);
  };

  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    e.target.select();
    if (onFocus) onFocus(e);
  };

  return (
    <input
      type="text"
      inputMode="decimal"
      pattern="[0-9.]*"
      value={text}
      onChange={handleChange}
      onFocus={handleFocus}
      className={className}
      {...props}
    />
  );
};

export default FormattedAmountInput;
