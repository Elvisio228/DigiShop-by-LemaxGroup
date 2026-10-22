import React, { useState, useEffect, useRef, useMemo } from 'react';
import { ChevronDown, Search, Check } from 'lucide-react';

export interface CountryItem {
  code: string;       // ISO 2-letter code (e.g., 'TG', 'BJ', 'FR')
  name: string;       // Country name in French (e.g., 'Togo')
  dialCode: string;   // Calling code with plus (e.g., '+228')
  flag: string;       // Emoji flag (e.g., '🇹🇬')
  sample: string;     // Placeholder sample (e.g., '90 12 34 56')
}

export const COUNTRIES: CountryItem[] = [
  // West & Central Africa (Primary for Digishop mobile money)
  { code: 'TG', name: 'Togo', dialCode: '+228', flag: '🇹🇬', sample: '90 12 34 56' },
  { code: 'BJ', name: 'Bénin', dialCode: '+229', flag: '🇧🇯', sample: '97 12 34 56' },
  { code: 'CI', name: "Côte d'Ivoire", dialCode: '+225', flag: '🇨🇮', sample: '07 12 34 56 78' },
  { code: 'SN', name: 'Sénégal', dialCode: '+221', flag: '🇸🇳', sample: '77 123 45 67' },
  { code: 'BF', name: 'Burkina Faso', dialCode: '+226', flag: '🇧🇫', sample: '70 12 34 56' },
  { code: 'ML', name: 'Mali', dialCode: '+223', flag: '🇲🇱', sample: '65 12 34 56' },
  { code: 'NE', name: 'Niger', dialCode: '+227', flag: '🇳🇪', sample: '90 12 34 56' },
  { code: 'GN', name: 'Guinée', dialCode: '+224', flag: '🇬🇳', sample: '622 12 34 56' },
  { code: 'CM', name: 'Cameroun', dialCode: '+237', flag: '🇨🇲', sample: '6 91 23 45 67' },
  { code: 'GA', name: 'Gabon', dialCode: '+241', flag: '🇬🇦', sample: '074 12 34 56' },
  { code: 'CG', name: 'Congo-Brazzaville', dialCode: '+242', flag: '🇨🇬', sample: '06 123 4567' },
  { code: 'CD', name: 'RD Congo', dialCode: '+243', flag: '🇨🇩', sample: '81 123 4567' },
  { code: 'TD', name: 'Tchad', dialCode: '+235', flag: '🇹🇩', sample: '66 12 34 56' },
  { code: 'CF', name: 'Centrafrique', dialCode: '+236', flag: '🇨🇫', sample: '70 12 34 56' },
  { code: 'MR', name: 'Mauritanie', dialCode: '+222', flag: '🇲🇷', sample: '45 12 34 56' },
  { code: 'GH', name: 'Ghana', dialCode: '+233', flag: '🇬🇭', sample: '24 123 4567' },
  { code: 'NG', name: 'Nigeria', dialCode: '+234', flag: '🇳🇬', sample: '802 123 4567' },
  { code: 'RW', name: 'Rwanda', dialCode: '+250', flag: '🇷🇼', sample: '788 123 456' },
  { code: 'BI', name: 'Burundi', dialCode: '+257', flag: '🇧🇮', sample: '79 12 34 56' },
  { code: 'MG', name: 'Madagascar', dialCode: '+261', flag: '🇲🇬', sample: '34 12 345 67' },
  // North Africa
  { code: 'MA', name: 'Maroc', dialCode: '+212', flag: '🇲🇦', sample: '6 12 34 56 78' },
  { code: 'DZ', name: 'Algérie', dialCode: '+213', flag: '🇩🇿', sample: '5 50 12 34 56' },
  { code: 'TN', name: 'Tunisie', dialCode: '+216', flag: '🇹🇳', sample: '20 123 456' },
  // Europe
  { code: 'FR', name: 'France', dialCode: '+33', flag: '🇫🇷', sample: '6 12 34 56 78' },
  { code: 'BE', name: 'Belgique', dialCode: '+32', flag: '🇧🇪', sample: '470 12 34 56' },
  { code: 'CH', name: 'Suisse', dialCode: '+41', flag: '🇨🇭', sample: '78 123 45 67' },
  { code: 'LU', name: 'Luxembourg', dialCode: '+352', flag: '🇱🇺', sample: '621 123 456' },
  { code: 'DE', name: 'Allemagne', dialCode: '+49', flag: '🇩🇪', sample: '151 12345678' },
  { code: 'GB', name: 'Royaume-Uni', dialCode: '+44', flag: '🇬🇧', sample: '7911 123456' },
  { code: 'ES', name: 'Espagne', dialCode: '+34', flag: '🇪🇸', sample: '612 34 56 78' },
  { code: 'IT', name: 'Italie', dialCode: '+39', flag: '🇮🇹', sample: '312 345 6789' },
  { code: 'PT', name: 'Portugal', dialCode: '+351', flag: '🇵🇹', sample: '912 345 678' },
  { code: 'NL', name: 'Pays-Bas', dialCode: '+31', flag: '🇳🇱', sample: '6 12345678' },
  { code: 'SE', name: 'Suède', dialCode: '+46', flag: '🇸🇪', sample: '70 123 45 67' },
  { code: 'NO', name: 'Norvège', dialCode: '+47', flag: '🇳🇴', sample: '412 34 567' },
  { code: 'DK', name: 'Danemark', dialCode: '+45', flag: '🇩🇰', sample: '20 12 34 56' },
  { code: 'FI', name: 'Finlande', dialCode: '+358', flag: '🇫🇮', sample: '40 1234567' },
  // Americas
  { code: 'CA', name: 'Canada', dialCode: '+1', flag: '🇨🇦', sample: '514 123-4567' },
  { code: 'US', name: 'États-Unis', dialCode: '+1', flag: '🇺🇸', sample: '202 555-0143' },
  { code: 'HT', name: 'Haïti', dialCode: '+509', flag: '🇭🇹', sample: '34 12 3456' },
  { code: 'GP', name: 'Guadeloupe', dialCode: '+590', flag: '🇬🇵', sample: '690 12 34 56' },
  { code: 'MQ', name: 'Martinique', dialCode: '+596', flag: '🇲🇶', sample: '696 12 34 56' },
  { code: 'GF', name: 'Guyane française', dialCode: '+594', flag: '🇬🇫', sample: '694 12 34 56' },
  { code: 'RE', name: 'La Réunion', dialCode: '+262', flag: '🇷🇪', sample: '692 12 34 56' },
  { code: 'BR', name: 'Brésil', dialCode: '+55', flag: '🇧🇷', sample: '11 91234-5678' },
  // Middle East & Asia
  { code: 'AE', name: 'Émirats Arabes Unis', dialCode: '+971', flag: '🇦🇪', sample: '50 123 4567' },
  { code: 'SA', name: 'Arabie Saoudite', dialCode: '+966', flag: '🇸🇦', sample: '50 123 4567' },
  { code: 'QA', name: 'Qatar', dialCode: '+974', flag: '🇶🇦', sample: '3312 3456' },
  { code: 'TR', name: 'Turquie', dialCode: '+90', flag: '🇹🇷', sample: '532 123 4567' },
  { code: 'IN', name: 'Inde', dialCode: '+91', flag: '🇮🇳', sample: '98765 43210' },
  { code: 'CN', name: 'Chine', dialCode: '+86', flag: '🇨🇳', sample: '138 0013 8000' },
  { code: 'JP', name: 'Japon', dialCode: '+81', flag: '🇯🇵', sample: '90 1234 5678' }
];

interface PhoneInputWithCountryProps {
  value: string;
  onChange: (fullPhoneNumber: string) => void;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
  id?: string;
  name?: string;
  defaultCountryCode?: string;
  autoFocus?: boolean;
}

export const PhoneInputWithCountry: React.FC<PhoneInputWithCountryProps> = ({
  value,
  onChange,
  placeholder,
  required = false,
  disabled = false,
  className = '',
  id,
  name,
  defaultCountryCode = 'TG',
  autoFocus = false
}) => {
  // Parse incoming value into dialCode and localNumber
  const findCountryFromValue = (val: string): CountryItem => {
    if (!val) {
      return COUNTRIES.find(c => c.code === defaultCountryCode) || COUNTRIES[0];
    }
    const clean = val.trim();
    if (clean.startsWith('+')) {
      // Find longest matching dialCode
      const sortedByLength = [...COUNTRIES].sort((a, b) => b.dialCode.length - a.dialCode.length);
      for (const country of sortedByLength) {
        if (clean.startsWith(country.dialCode)) {
          return country;
        }
      }
    }
    return COUNTRIES.find(c => c.code === defaultCountryCode) || COUNTRIES[0];
  };

  const [selectedCountry, setSelectedCountry] = useState<CountryItem>(() => findCountryFromValue(value));
  const [localNumber, setLocalNumber] = useState<string>(() => {
    if (!value) return '';
    const clean = value.trim();
    if (clean.startsWith(selectedCountry.dialCode)) {
      return clean.slice(selectedCountry.dialCode.length).trim();
    }
    return clean;
  });

  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Sync state if external value changes drastically
  useEffect(() => {
    if (!value) {
      setLocalNumber('');
      return;
    }
    const matched = findCountryFromValue(value);
    if (matched.code !== selectedCountry.code) {
      setSelectedCountry(matched);
    }
    const clean = value.trim();
    if (clean.startsWith(matched.dialCode)) {
      const rest = clean.slice(matched.dialCode.length).trim();
      setLocalNumber(rest);
    } else {
      setLocalNumber(clean);
    }
  }, [value]);

  // Click outside listener
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Filter countries by search query
  const filteredCountries = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return COUNTRIES;
    return COUNTRIES.filter(c =>
      c.name.toLowerCase().includes(q) ||
      c.dialCode.includes(q) ||
      c.code.toLowerCase().includes(q)
    );
  }, [searchQuery]);

  // Select a country
  const handleSelectCountry = (country: CountryItem) => {
    setSelectedCountry(country);
    setIsOpen(false);
    setSearchQuery('');
    
    // Combine new dialCode with current localNumber
    const cleanedLocal = localNumber.trim();
    const full = cleanedLocal ? `${country.dialCode} ${cleanedLocal}` : country.dialCode;
    onChange(full);

    // Focus phone input field
    setTimeout(() => {
      inputRef.current?.focus();
    }, 50);
  };

  // Change phone number text
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let raw = e.target.value;

    // Check if the user pasted a full number with country code like +228...
    if (raw.startsWith('+')) {
      const matched = findCountryFromValue(raw);
      setSelectedCountry(matched);
      const rest = raw.slice(matched.dialCode.length).trim();
      setLocalNumber(rest);
      onChange(`${matched.dialCode} ${rest}`);
      return;
    }

    // Strip out non-digit or non-spacing characters
    const sanitized = raw.replace(/[^\d\s-]/g, '');
    setLocalNumber(sanitized);

    const full = sanitized.trim() ? `${selectedCountry.dialCode} ${sanitized.trim()}` : '';
    onChange(full);
  };

  return (
    <div className={`relative w-full ${className}`} ref={dropdownRef}>
      <div className="flex items-center rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 focus-within:ring-2 focus-within:ring-sky-500 focus-within:border-sky-500 transition-all overflow-hidden shadow-sm">
        
        {/* Country Selector Dropdown Trigger Button */}
        <button
          type="button"
          disabled={disabled}
          onClick={() => setIsOpen(!isOpen)}
          aria-haspopup="listbox"
          aria-expanded={isOpen}
          className="flex items-center gap-1.5 px-3 py-2.5 bg-slate-100 hover:bg-slate-200/80 dark:bg-slate-800 dark:hover:bg-slate-700/80 border-r border-slate-300 dark:border-slate-700 text-xs font-semibold text-slate-800 dark:text-slate-200 transition-colors select-none shrink-0"
          title={`Pays sélectionné: ${selectedCountry.name} (${selectedCountry.dialCode})`}
        >
          <span className="text-base leading-none" role="img" aria-label={selectedCountry.name}>
            {selectedCountry.flag}
          </span>
          <span className="font-mono text-slate-900 dark:text-white font-bold tracking-tight">
            {selectedCountry.dialCode}
          </span>
          <ChevronDown className={`w-3.5 h-3.5 text-slate-500 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
        </button>

        {/* National Number Input Field */}
        <input
          ref={inputRef}
          type="tel"
          id={id}
          name={name}
          required={required}
          disabled={disabled}
          autoFocus={autoFocus}
          value={localNumber}
          onChange={handlePhoneChange}
          placeholder={placeholder || `Ex: ${selectedCountry.sample}`}
          className="flex-1 w-full px-3 py-2.5 text-xs bg-transparent text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none font-mono"
        />
      </div>

      {/* Floating Dropdown List of Countries */}
      {isOpen && (
        <div className="absolute left-0 top-full mt-1.5 w-72 sm:w-80 max-h-72 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-2xl z-50 overflow-hidden flex flex-col animate-in fade-in slide-in-from-top-2 duration-150">
          
          {/* Search bar inside dropdown */}
          <div className="p-2 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 sticky top-0">
            <div className="relative flex items-center">
              <Search className="w-3.5 h-3.5 absolute left-2.5 text-slate-400 pointer-events-none" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Rechercher pays ou indicatif (+228, Togo...)"
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-sky-500"
              />
            </div>
          </div>

          {/* List of Countries */}
          <div className="overflow-y-auto max-h-60 p-1 divide-y divide-slate-100/50 dark:divide-slate-800/50">
            {filteredCountries.length === 0 ? (
              <div className="py-6 text-center text-xs text-slate-400">
                Aucun pays trouvé pour "{searchQuery}"
              </div>
            ) : (
              filteredCountries.map((c) => {
                const isSelected = c.code === selectedCountry.code;
                return (
                  <button
                    key={c.code}
                    type="button"
                    onClick={() => handleSelectCountry(c)}
                    className={`w-full flex items-center justify-between px-3 py-2 text-xs rounded-lg text-left transition-colors ${
                      isSelected
                        ? 'bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 font-semibold'
                        : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="text-base shrink-0 leading-none" role="img" aria-label={c.name}>
                        {c.flag}
                      </span>
                      <span className="truncate">{c.name}</span>
                    </div>

                    <div className="flex items-center gap-2 shrink-0 font-mono text-[11px]">
                      <span className="text-slate-500 dark:text-slate-400 font-bold">{c.dialCode}</span>
                      {isSelected && <Check className="w-3.5 h-3.5 text-sky-500" />}
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};
