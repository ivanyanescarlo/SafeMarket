import React, { useState, useEffect, useRef } from 'react';
import { ChevronDown, Search, Check } from 'lucide-react';

const PANGASINAN_CITIES = [
  "Agno",
  "Aguilar",
  "Alaminos City",
  "Alcala",
  "Anda",
  "Asingan",
  "Balungao",
  "Bani",
  "Basista",
  "Bautista",
  "Bayambang",
  "Binalonan",
  "Binmaley",
  "Bolinao",
  "Bugallon",
  "Burgos",
  "Calasiao",
  "Dagupan City",
  "Dasol",
  "Infanta",
  "Labrador",
  "Laoac",
  "Lingayen",
  "Mabini",
  "Malasiqui",
  "Manaoag",
  "Mangaldan",
  "Mangatarem",
  "Mapandan",
  "Natividad",
  "Pozorrubio",
  "Rosales",
  "San Carlos City",
  "San Fabian",
  "San Jacinto",
  "San Manuel",
  "San Nicolas",
  "San Quintin",
  "Santa Barbara",
  "Santa Maria",
  "Santo Tomas",
  "Sison",
  "Sual",
  "Tayug",
  "Umingan",
  "Urbiztondo",
  "Urdaneta City",
  "Villasis"
];

function CustomScrollDropdown({
  label,
  value,
  placeholder,
  options = [],
  onSelect,
  disabled = false,
  required = false
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const dropdownRef = useRef(null);
  const searchInputRef = useRef(null);

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
        setSearchTerm('');
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Focus search input when dropdown opens
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isOpen]);

  const filteredOptions = options.filter((opt) =>
    opt.toLowerCase().includes(searchTerm.toLowerCase().trim())
  );

  return (
    <div className="relative" ref={dropdownRef}>
      <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
        {label}
        {required && <span className="text-rose-500 font-bold ml-1">*</span>}
      </label>

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
        }`}
      >
        <span className={`truncate ${!value ? 'text-slate-400' : 'font-medium text-slate-800'}`}>
          {value || placeholder}
        </span>
        <ChevronDown
          className={`w-4 h-4 text-slate-400 transition-transform duration-200 flex-shrink-0 ml-2 ${
            isOpen ? 'rotate-180 text-safegreen-600' : ''
          }`}
        />
      </button>

      {/* Hidden input for HTML form validation */}
      {required && (
        <input
          type="text"
          value={value || ''}
          onChange={() => {}}
          required={required}
          tabIndex={-1}
          className="opacity-0 pointer-events-none absolute bottom-0 left-0 w-full h-0"
        />
      )}

      {/* Popup Dropdown */}
      {isOpen && !disabled && (
        <div className="absolute top-full left-0 right-0 mt-1.5 z-50 bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden animate-fade-in">
          {/* Search box inside dropdown */}
          <div className="p-2 border-b border-slate-100 bg-slate-50/80">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                ref={searchInputRef}
                type="text"
                maxLength={50}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder={`Search ${label.toLowerCase()}...`}
                className="w-full pl-8 pr-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-safegreen-500"
              />
            </div>
          </div>

          {/* Scrollable List */}
          <div className="max-h-56 overflow-y-auto divide-y divide-slate-50 overscroll-contain">
            {filteredOptions.length === 0 ? (
              <div className="py-4 text-center text-xs text-slate-400">
                No matching location found.
              </div>
            ) : (
              filteredOptions.map((opt) => {
                const isSelected = value === opt;
                return (
                  <div
                    key={opt}
                    onClick={() => {
                      onSelect(opt);
                      setIsOpen(false);
                      setSearchTerm('');
                    }}
                    className={`px-3.5 py-2.5 text-xs sm:text-sm cursor-pointer transition-colors flex items-center justify-between ${
                      isSelected
                        ? 'bg-emerald-50 text-safegreen-800 font-bold'
                        : 'text-slate-700 hover:bg-slate-50 hover:text-slate-900'
                    }`}
                  >
                    <span>{opt}</span>
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

export default function LocationSelector({
  selectedProvince = 'Pangasinan',
  selectedCity = '',
  onChange,
  required = false,
  className = ''
}) {
  // Always enforce Pangasinan as the province
  useEffect(() => {
    if (selectedProvince !== 'Pangasinan') {
      onChange({
        province: 'Pangasinan',
        cityMunicipality: selectedCity
      });
    }
  }, [selectedProvince]);

  const handleCitySelect = (city) => {
    onChange({
      province: 'Pangasinan',
      cityMunicipality: city
    });
  };

  return (
    <div className={`grid grid-cols-1 gap-3.5 ${className}`}>
      {/* Province Dropdown - Fixed to Pangasinan */}
      <CustomScrollDropdown
        label="Province"
        value="Pangasinan"
        placeholder="Pangasinan"
        options={["Pangasinan"]}
        onSelect={() => {}}
        disabled={false}
        required={required}
      />

      {/* City / Municipality Dropdown - Pangasinan Cities & Municipalities */}
      <CustomScrollDropdown
        label="City / Municipality"
        value={selectedCity}
        placeholder="Select City / Municipality"
        options={PANGASINAN_CITIES}
        onSelect={handleCitySelect}
        disabled={false}
        required={required}
      />
    </div>
  );
}
