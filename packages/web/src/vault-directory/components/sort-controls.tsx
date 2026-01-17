import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { SortOption } from '@/vault-directory/vault-directory.types';

interface Props {
  value: SortOption;
  onChange: (option: SortOption) => void;
  disabled?: boolean;
}

export const SortControls = ({ value, onChange, disabled = false }: Props) => {
  const sortOptions: { value: SortOption; label: string }[] = [
    { value: 'tvl', label: 'Total Value Locked' },
    { value: 'depositors', label: 'Depositor Count' },
    { value: 'age', label: 'Age (Newest First)' },
  ];

  return (
    <Select value={value} onValueChange={onChange} disabled={disabled}>
      <SelectTrigger className="w-48">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {sortOptions.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};
