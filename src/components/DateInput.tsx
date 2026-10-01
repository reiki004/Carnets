import React from 'react';

interface DateInputProps {
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  className?: string;
  id?: string;
}

export const DateInput: React.FC<DateInputProps> = ({
  value,
  onChange,
  placeholder = 'dd/mm/aaaa',
  className = '',
  id,
}) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawDigits = e.target.value.replace(/\D/g, '').slice(0, 8);
    let formatted = rawDigits;

    if (rawDigits.length > 4) {
      formatted = `${rawDigits.slice(0, 2)}/${rawDigits.slice(2, 4)}/${rawDigits.slice(4)}`;
    } else if (rawDigits.length > 2) {
      formatted = `${rawDigits.slice(0, 2)}/${rawDigits.slice(2)}`;
    }

    onChange(formatted);
  };

  return (
    <input
      type="text"
      id={id}
      value={value}
      onChange={handleChange}
      placeholder={placeholder}
      maxLength={10}
      className={className}
    />
  );
};
