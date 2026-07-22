import React, { useEffect, useState } from 'react';

/** Clean leading zeroes e.g. "0002" -> "2" */
export function normalizeQuantityString(val: string | number): string {
  if (val === '' || val === null || val === undefined) return '';
  const cleaned = String(val).replace(/[^0-9]/g, '');
  if (!cleaned) return '';
  const parsed = parseInt(cleaned, 10);
  return isNaN(parsed) ? '' : String(parsed);
}

export interface QuantityInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'value'> {
  value: number | string;
  onValueChange: (numericValue: number) => void;
  min?: number;
  max?: number;
}

export const QuantityInput: React.FC<QuantityInputProps> = ({
  value,
  onValueChange,
  min = 1,
  max = 1000,
  className = '',
  onFocus,
  onBlur,
  ...props
}) => {
  const [text, setText] = useState<string>(() => normalizeQuantityString(value));

  useEffect(() => {
    const numericProp = typeof value === 'number' ? value : parseInt(String(value), 10) || 0;
    const clampedProp = max !== undefined ? Math.min(max, numericProp) : numericProp;
    const numericText = parseInt(text, 10) || 0;
    if (clampedProp !== numericText) {
      setText(normalizeQuantityString(clampedProp));
    }
  }, [value, max]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    const normalized = normalizeQuantityString(raw);
    let parsed = parseInt(normalized, 10);
    if (!isNaN(parsed) && max !== undefined && parsed > max) {
      parsed = max;
      setText(String(max));
    } else {
      setText(normalized);
    }
    onValueChange(isNaN(parsed) ? 0 : parsed);
  };

  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    e.target.select();
    if (onFocus) onFocus(e);
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    if (text === '' && min !== undefined) {
      setText(String(min));
      onValueChange(min);
    }
    if (onBlur) onBlur(e);
  };

  return (
    <input
      type="text"
      inputMode="numeric"
      pattern="[0-9]*"
      value={text}
      onChange={handleChange}
      onFocus={handleFocus}
      onBlur={handleBlur}
      className={className}
      {...props}
    />
  );
};

export default QuantityInput;
