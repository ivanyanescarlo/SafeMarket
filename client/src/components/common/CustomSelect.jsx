import React, { useState, useEffect, useRef } from 'react';
import { ChevronDown, Check } from 'lucide-react';

/**
 * CustomSelect Component
 * 
 * Specifically designed to:
 * 1. ALWAYS pop DOWNWARDS (top-full mt-1.5 z-50), never pop upwards to block the screen.
 * 2. Constrain vertical height (max-h-56) with smooth scrolling so it won't cover the entire screen.
 * 3. Support clean outside-click closing and custom option rendering.
 */
export default function CustomSelect({
  label,
  name,
  value,
  onChange,
  options = [],
  placeholder = 'Select an option...',
  disabled = false,
  required = false,
  className = '',
  buttonClassName = ''
}) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Format options: normalize array of strings or { label, value }
  const normalizedOptions = options.map((opt) => {
    if (typeof opt === 'object' && opt !== null) {
      return { label: opt.label || opt.value, value: opt.value };
    }
    return { label: opt, value: opt };
  });

  const selectedOption = normalizedOptions.find((opt) => opt.value === value);

  const handleSelect = (optValue) => {
    if (onChange) {
      // Support both direct value callback and event-like object for standard form handlers
      onChange({
        target: {
          name: name || '',
          value: optValue
        }
      });
    }
    setIsOpen(false);
  };

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      {label && (
        <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
          {label}
        </label>
      )}

      {/* Trigger Button */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => {
          if (!disabled) setIsOpen(!isOpen);
        }}
        className={`w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-sm text-slate-800 flex items-center justify-between text-left transition-all shadow-xs focus:outline-none focus:ring-2 focus:ring-safegreen-500 ${
          disabled
            ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed'
            : 'hover:border-slate-400 cursor-pointer'
        } ${buttonClassName}`}
      >
        <span className={`truncate ${!selectedOption ? 'text-slate-400' : 'font-medium text-slate-800'}`}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <ChevronDown
          className={`w-4 h-4 text-slate-400 transition-transform duration-200 flex-shrink-0 ml-2 ${
            isOpen ? 'rotate-180 text-safegreen-600' : ''
          }`}
        />
      </button>

      {/* Hidden input for HTML5 form validation */}
      {required && (
        <input
          type="text"
          name={name}
          value={value || ''}
          onChange={() => {}}
          required={required}
          tabIndex={-1}
          className="opacity-0 pointer-events-none absolute bottom-0 left-0 w-full h-0"
        />
      )}

      {/* 
        Downward Dropdown Popup:
        - ALWAYS pops DOWN (top-full mt-1.5), NEVER pops top.
        - Scrollable and constrained to max-h-56 so it won't cover the screen.
      */}
      {isOpen && !disabled && (
        <div className="absolute top-full left-0 right-0 mt-1.5 z-50 bg-white rounded-xl shadow-xl border border-slate-200 overflow-hidden animate-fade-in">
          <div className="max-h-56 overflow-y-auto overscroll-contain divide-y divide-slate-50">
            {normalizedOptions.length === 0 ? (
              <div className="py-3 px-4 text-center text-xs text-slate-400">
                No options available
              </div>
            ) : (
              normalizedOptions.map((opt) => {
                const isSelected = opt.value === value;
                return (
                  <div
                    key={opt.value}
                    onClick={() => handleSelect(opt.value)}
                    className={`px-3.5 py-2.5 text-xs sm:text-sm cursor-pointer transition-colors flex items-center justify-between ${
                      isSelected
                        ? 'bg-emerald-50 text-safegreen-800 font-bold'
                        : 'text-slate-700 hover:bg-slate-50 hover:text-slate-900'
                    }`}
                  >
                    <span>{opt.label}</span>
                    {isSelected && <Check className="w-4 h-4 text-safegreen-600 flex-shrink-0" />}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
