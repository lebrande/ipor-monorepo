import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import type { NetFlowOption } from '@/vault-directory/vault-directory.types';

interface Props {
  value: NetFlowOption;
  onChange: (option: NetFlowOption) => void;
}

export const NetFlowFilter = ({ value, onChange }: Props) => {
  const options: { value: NetFlowOption; label: string }[] = [
    { value: 'all', label: 'All' },
    { value: 'positive', label: 'Positive' },
    { value: 'negative', label: 'Negative' },
  ];

  return (
    <ToggleGroup
      type="single"
      variant="outline"
      value={value}
      onValueChange={(newValue) => {
        if (newValue) {
          onChange(newValue as NetFlowOption);
        }
      }}
      className="w-full"
    >
      {options.map((option) => (
        <ToggleGroupItem
          key={option.value}
          value={option.value}
          className="flex-1"
        >
          {option.label}
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  );
};
