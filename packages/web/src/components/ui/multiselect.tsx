import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Checkbox } from '@/components/ui/checkbox';
import { ChevronDownIcon, XIcon } from 'lucide-react';

interface Option {
  value: string;
  label: string;
}

interface Props {
  options: Option[];
  value: string[];
  onChange: (value: string[]) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  triggerText?: (selectedCount: number, selectedItems: Option[]) => string;
  className?: string;
  maxDisplayItems?: number;
}

export const MultiSelect = ({
  options,
  value,
  onChange,
  placeholder = 'Select items',
  searchPlaceholder = 'Search...',
  triggerText,
  className,
  maxDisplayItems = 3,
}: Props) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredOptions = options.filter((option) =>
    option.label.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const handleToggleItem = (itemValue: string) => {
    const newValue = value.includes(itemValue)
      ? value.filter((v) => v !== itemValue)
      : [...value, itemValue];
    onChange(newValue);
  };

  const handleClearAll = () => {
    onChange([]);
  };

  const handleSelectAll = () => {
    const allValues = filteredOptions.map((option) => option.value);
    onChange(allValues);
  };

  const selectedItems = options.filter((option) =>
    value.includes(option.value),
  );
  const selectedCount = value.length;

  const getTriggerText = () => {
    if (triggerText) {
      return triggerText(selectedCount, selectedItems);
    }

    if (selectedCount === 0) {
      return placeholder;
    }

    if (selectedCount === 1) {
      return selectedItems[0].label;
    }

    return `${selectedCount} items selected`;
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={`w-full justify-between text-left ${className || ''}`}
        >
          <span className="truncate">{getTriggerText()}</span>
          <ChevronDownIcon className="w-4 h-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="start">
        {/* Search Input */}
        <div className="p-3 border-b">
          <input
            type="text"
            placeholder={searchPlaceholder}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-3 py-2 border border-input rounded-lg text-sm focus:border-ring focus:ring-ring"
          />
        </div>

        {/* Actions */}
        <div className="p-2 border-b flex justify-between">
          <button
            onClick={handleSelectAll}
            className="text-sm text-primary hover:text-primary/80"
            disabled={filteredOptions.length === 0}
          >
            Select all
          </button>
          <button
            onClick={handleClearAll}
            className="text-sm text-muted-foreground hover:text-foreground"
            disabled={selectedCount === 0}
          >
            Clear all
          </button>
        </div>

        {/* Items List */}
        <div className="max-h-48 overflow-y-auto">
          {filteredOptions.length === 0 ? (
            <div className="p-4 text-sm text-muted-foreground text-center">
              No items found
            </div>
          ) : (
            filteredOptions.map((option) => (
              <label
                key={option.value}
                className="flex items-center px-4 py-2 hover:bg-accent cursor-pointer"
              >
                <Checkbox
                  checked={value.includes(option.value)}
                  onCheckedChange={() => handleToggleItem(option.value)}
                  className="mr-3"
                />
                <span className="text-sm text-foreground">{option.label}</span>
              </label>
            ))
          )}
        </div>

        {/* Selected Items Display */}
        {selectedCount > 0 && (
          <div className="p-2 border-t bg-muted">
            <div className="flex flex-wrap gap-1">
              {selectedItems.slice(0, maxDisplayItems).map((item) => (
                <span
                  key={item.value}
                  className="inline-flex items-center px-2 py-1 bg-primary/10 text-primary rounded-full text-xs"
                >
                  {item.label}
                  <button
                    onClick={() => handleToggleItem(item.value)}
                    className="ml-1 hover:text-primary/80"
                  >
                    <XIcon className="w-3 h-3" />
                  </button>
                </span>
              ))}
              {selectedCount > maxDisplayItems && (
                <span className="text-xs text-muted-foreground">
                  +{selectedCount - maxDisplayItems} more
                </span>
              )}
            </div>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
};
