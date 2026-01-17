import { useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import type { TVLRange } from '@/vault-directory/vault-directory.types';
import {
  MIN_TVL_VALUE,
  MAX_TVL_VALUE,
  validateTVLRange,
} from '@/vault-directory/vault-directory.utils';
import { formatCurrency } from '@/lib/utils';

interface Props {
  value: TVLRange | null;
  onChange: (range: TVLRange | null) => void;
  min?: number;
  max?: number;
}

export const TVLRangeFilter = ({
  value,
  onChange,
  min = MIN_TVL_VALUE,
  max = MAX_TVL_VALUE,
}: Props) => {
  // Use a simpler linear mapping for better slider performance
  const convertToSliderValue = (tvlValue: number): number => {
    return ((tvlValue - min) / (max - min)) * 100;
  };

  const convertFromSliderValue = (sliderValue: number): number => {
    return min + (sliderValue / 100) * (max - min);
  };

  // Convert current TVL range to slider values
  const sliderValue = useMemo(() => {
    if (!value) return [0, 100];
    return [
      Math.max(0, convertToSliderValue(value.min)),
      Math.min(100, convertToSliderValue(value.max)),
    ];
  }, [value, min, max]);

  const handleSliderChange = (newValues: number[]) => {
    const [sliderMin, sliderMax] = newValues;

    // Convert slider values back to TVL values
    const tvlMin = convertFromSliderValue(sliderMin);
    const tvlMax = convertFromSliderValue(sliderMax);

    // Ensure min doesn't exceed max
    const finalMin = Math.min(tvlMin, tvlMax);
    const finalMax = Math.max(tvlMin, tvlMax);

    const range = { min: finalMin, max: finalMax };

    if (validateTVLRange(range)) {
      onChange(range);
    }
  };

  const handleClear = () => {
    onChange(null);
  };

  const formatDisplayValue = (value: number): string => {
    return formatCurrency(value);
  };

  const getDisplayText = (): string => {
    const minValue = value ? value.min : min;
    const maxValue = value ? value.max : max;
    const minFormatted = formatDisplayValue(minValue);
    const maxFormatted = formatDisplayValue(maxValue);
    if (minValue === min && maxValue === max) {
      return 'All TVL ranges';
    }
    return `${minFormatted} - ${maxFormatted}`;
  };

  return (
    <div className="space-y-4">
      {/* Slider */}
      <div className="px-2">
        <Slider
          value={sliderValue}
          onValueChange={handleSliderChange}
          min={0}
          max={100}
          step={1}
          className="w-full"
        />
      </div>

      {/* Range display and Clear button */}
      <div className="flex justify-between items-center text-xs text-muted-foreground gap-2">
        <span>{formatDisplayValue(min)}</span>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleClear}
          className="text-xs text-muted-foreground hover:text-foreground"
        >
          Clear
        </Button>
        <span>{formatDisplayValue(max)}</span>
      </div>

      {/* Always show current selection display */}
      <div className="text-sm text-center text-foreground bg-muted px-3 py-2 rounded-md">
        {getDisplayText()}
      </div>

      {/* Help text */}
      <p className="text-xs text-muted-foreground text-center">
        Drag the handles to set your TVL range
      </p>
    </div>
  );
};
