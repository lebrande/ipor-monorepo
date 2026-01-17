import React from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { DepositorRange } from '@/vault-directory/vault-directory.types';
import { DEPOSITOR_RANGES } from '@/vault-directory/vault-directory.utils';

interface Props {
  value: DepositorRange | null;
  onChange: (range: DepositorRange | null) => void;
}

export const DepositorCountFilter = ({ value, onChange }: Props) => {
  const handleValueChange = (selectedValue: string) => {
    if (selectedValue === 'all') {
      onChange(null);
    } else {
      const range = DEPOSITOR_RANGES.find((r) => r.label === selectedValue);
      if (range) {
        onChange(range);
      }
    }
  };

  return (
    <Select value={value?.label || 'all'} onValueChange={handleValueChange}>
      <SelectTrigger className="w-full">
        <SelectValue placeholder="All depositor counts" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">All depositor counts</SelectItem>
        {DEPOSITOR_RANGES.map((range) => (
          <SelectItem key={range.label} value={range.label}>
            {range.label} depositors
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};
