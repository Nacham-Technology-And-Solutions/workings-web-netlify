import React, { useState, useEffect } from 'react';
import { ChevronLeftIcon, ChevronRightIcon } from './icons/IconComponents';

interface CalendarModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (date: Date) => void;
  onClear: () => void;
  initialDate: Date | null;
}

const CalendarModal: React.FC<CalendarModalProps> = ({ isOpen, onClose, onSubmit, onClear, initialDate }) => {
  const [displayDate, setDisplayDate] = useState(initialDate || new Date('2025-06-19'));
  const [selectedDate, setSelectedDate] = useState<Date | null>(initialDate);

  useEffect(() => {
    if (isOpen) {
        const dateToUse = initialDate || new Date('2025-06-19');
        setDisplayDate(dateToUse);
        setSelectedDate(initialDate);
    }
  }, [initialDate, isOpen]);

  const handleMonthChange = (offset: number) => {
    setDisplayDate(prev => {
      const newDate = new Date(prev);
      newDate.setDate(1); // Set to first of month to avoid issues with month lengths
      newDate.setMonth(newDate.getMonth() + offset);
      return newDate;
    });
  };

  const daysOfWeek = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month + 1, 0).getDate();
  };
  
  const getFirstDayOfMonth = (year: number, month: number) => {
    return new Date(year, month, 1).getDay();
  };

  const renderCalendarGrid = () => {
    const year = displayDate.getFullYear();
    const month = displayDate.getMonth();
    const daysInMonth = getDaysInMonth(year, month);
    const firstDay = getFirstDayOfMonth(year, month);

    const blanks = Array(firstDay).fill(null);
    const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
    const calendarDays = [...blanks, ...days];

    return calendarDays.map((day, index) => {
      if (!day) {
        return <div key={`blank-${index}`} className="w-10 h-10"></div>;
      }
      const date = new Date(year, month, day);
      const isSelected = selectedDate && date.toDateString() === selectedDate.toDateString();

      return (
        <button
          key={day}
          onClick={() => setSelectedDate(date)}
          className={`w-10 h-10 flex items-center justify-center rounded-full transition-colors font-medium
            ${isSelected ? 'bg-gray-800 text-white' : 'hover:bg-gray-100 text-gray-700'}`
          }
        >
          {day}
        </button>
      );
    });
  };

  const handleSubmit = () => {
    if (selectedDate) {
      onSubmit(selectedDate);
    }
  };
  
  const handleClear = () => {
    onClear();
  }

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
      aria-labelledby="calendar-title"
      role="dialog"
      aria-modal="true"
    >
      <div className="absolute inset-0 bg-black/50" onClick={onClose} aria-hidden="true"></div>
      <div className={`relative bg-white rounded-xl shadow-lg w-full max-w-xs mx-4 transition-transform transform duration-300 ${isOpen ? 'scale-100' : 'scale-95'}`}>
        <div className="p-4">
          <div className="flex items-center justify-between mb-4">
            <button onClick={() => handleMonthChange(-1)} className="p-2 text-gray-600 hover:bg-gray-100 rounded-full"><ChevronLeftIcon /></button>
            <h2 id="calendar-title" className="text-base font-bold text-gray-800">
              {displayDate.toLocaleString('en-US', { month: 'long', year: 'numeric' })}
            </h2>
            <button onClick={() => handleMonthChange(1)} className="p-2 text-gray-600 hover:bg-gray-100 rounded-full"><ChevronRightIcon /></button>
          </div>

          <div className="grid grid-cols-7 gap-y-2 text-center text-xs text-gray-500 font-semibold mb-2">
            {daysOfWeek.map(day => <div key={day}>{day}</div>)}
          </div>
          
          <div className="grid grid-cols-7 gap-y-1 justify-items-center">
            {renderCalendarGrid()}
          </div>
        </div>

        <div className="bg-gray-50 p-4 rounded-b-xl grid grid-cols-2 gap-3 border-t border-gray-200">
          <button
            onClick={handleClear}
            className="w-full py-2.5 bg-white text-gray-800 font-semibold rounded-lg border border-gray-300 hover:bg-gray-100 transition-colors"
          >
            Clear
          </button>
          <button
            onClick={handleSubmit}
            className="w-full py-2.5 bg-gray-800 text-white font-semibold rounded-lg hover:bg-gray-700 transition-colors"
          >
            Submit
          </button>
        </div>
      </div>
    </div>
  );
};

export default CalendarModal;
