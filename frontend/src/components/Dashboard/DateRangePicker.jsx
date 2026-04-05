import React, { useState } from 'react';
import { DateRange } from 'react-date-range';
import { format } from 'date-fns';
import { Calendar, ChevronDown } from 'lucide-react';
import 'react-date-range/dist/styles.css';
import 'react-date-range/dist/theme/default.css';

const DateRangePicker = ({ onRangeChange }) => {
  const [showPicker, setShowPicker] = useState(false);
  const [selectedRange, setSelectedRange] = useState({
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
    endDate: new Date(),
    key: 'selection'
  });

  const presets = {
    'Last 7d': () => ({
      startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      endDate: new Date(),
      key: 'selection'
    }),
    'Last 30d': () => ({
      startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      endDate: new Date(),
      key: 'selection'
    }),
    'Last 90d': () => ({
      startDate: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000),
      endDate: new Date(),
      key: 'selection'
    })
  };

  const handlePreset = (preset) => {
    const newRange = presets[preset]();
    setSelectedRange(newRange);
    onRangeChange(newRange);
    setShowPicker(false);
  };

  const handleSelect = (ranges) => {
    setSelectedRange(ranges.selection);
    onRangeChange(ranges.selection);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setShowPicker(!showPicker)}
        className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
      >
        <Calendar size={16} />
        <span className="text-sm">
          {format(selectedRange.startDate, 'MMM dd')} - {format(selectedRange.endDate, 'MMM dd, yyyy')}
        </span>
        <ChevronDown size={16} />
      </button>

      {showPicker && (
        <div className="absolute top-full mt-2 right-0 z-50 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex gap-4 mb-4">
            {Object.keys(presets).map(preset => (
              <button
                key={preset}
                onClick={() => handlePreset(preset)}
                className="px-3 py-1 text-sm bg-gray-100 dark:bg-gray-700 rounded hover:bg-gray-200 dark:hover:bg-gray-600"
              >
                {preset}
              </button>
            ))}
          </div>
          <DateRange
            ranges={[selectedRange]}
            onChange={handleSelect}
            moveRangeOnFirstSelection={false}
            className="custom-date-range"
          />
        </div>
      )}
    </div>
  );
};

export default DateRangePicker;