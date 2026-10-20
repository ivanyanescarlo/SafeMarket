import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown, Check } from 'lucide-react';

/**
 * CustomSelect Component
 * 
 * Always opens its menu downward, with a height constrained to available
 * space, and supports outside-click closing and custom option rendering.
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
  const [menuPosition, setMenuPosition] = useState(null);
  const dropdownRef = useRef(null);
  const menuRef = useRef(null);

  // Close when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (
        !dropdownRef.current?.contains(event.target) &&
        !menuRef.current?.contains(event.target)
      ) {
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

  const toggleDropdown = () => {
    if (disabled) return;
    if (isOpen) {
      setIsOpen(false);
      return;
    }

    const rect = dropdownRef.current?.getBoundingClientRect();
    if (rect) {
      const gap = 6;
      let top = rect.bottom + gap;
      const neededHeight = Math.min(224, normalizedOptions.length * 40);
      if (top + neededHeight > window.innerHeight && rect.top > neededHeight) {
        window.scrollBy({ top: top + neededHeight - window.innerHeight + 12, behavior: 'auto' });
      }
      const updatedRect = dropdownRef.current?.getBoundingClientRect();
      if (updatedRect) {
        top = updatedRect.bottom + gap;
        setMenuPosition({
          top,
          left: updatedRect.left,
          width: updatedRect.width,
          maxHeight: Math.max(40, Math.min(224, window.innerHeight - top - 8))
        });
      }
    }
    setIsOpen(true);
  };

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
        onClick={toggleDropdown}
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

      {isOpen && !disabled && (
        createPortal(
          <div
            ref={menuRef}
            className="fixed z-[9999] bg-white rounded-xl shadow-xl border border-slate-200 overflow-hidden animate-fade-in"
            style={menuPosition}
          >
            <div className="max-h-full overflow-y-auto overscroll-contain divide-y divide-slate-50">
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
          ,
          document.body
        )
      )}
    </div>
  );
}
