import { cn } from '@/lib/utils';
import { useVaultDetailsContext } from '@/vault-details/vault-details.context';
import {
  TIME_RANGE_LABELS,
  VALID_TIME_RANGES,
} from '@/vault-details/vault-details.utils';
import type { TimeRange } from '@/vault-details/vault-details.types';

export const GlobalTimeSelector = () => {
  const { selectedTimeRange, setSelectedTimeRange } = useVaultDetailsContext();

  const handleTimeRangeChange = (range: TimeRange) => {
    setSelectedTimeRange(range);
  };

  const handleKeyDown = (event: React.KeyboardEvent, range: TimeRange) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      handleTimeRangeChange(range);
    }
  };

  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground">Time Range:</span>
        <div className="flex items-center gap-1 p-1 bg-muted rounded-lg">
          {VALID_TIME_RANGES.map((range) => {
            const isActive = selectedTimeRange === range;
            const label = TIME_RANGE_LABELS[range];

            return (
              <button
                key={range}
                onClick={() => handleTimeRangeChange(range)}
                onKeyDown={(e) => handleKeyDown(e, range)}
                className={cn(
                  'px-3 py-1 text-sm font-medium rounded-md transition-all duration-200',
                  'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
                  'hover:bg-background hover:text-foreground',
                  isActive
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'text-muted-foreground',
                )}
                aria-pressed={isActive}
                aria-label={`Select ${label} time range`}
              >
                {label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Additional info about selected range */}
      <div className="text-sm text-muted-foreground">
        Showing data for the last{' '}
        {TIME_RANGE_LABELS[selectedTimeRange].toLowerCase()}
      </div>
    </div>
  );
};
