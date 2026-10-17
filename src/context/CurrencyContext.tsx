import React, { createContext, useContext, useState, useEffect } from 'react';

export type CurrencyCode = 'EUR' | 'USD' | 'CFA';

export interface CurrencyConfig {
  code: CurrencyCode;
  label: string;
  name: string;
  symbol: string;
  flag: string;
  rateFromEur: number;
}

export const CURRENCIES: Record<CurrencyCode, CurrencyConfig> = {
  EUR: {
    code: 'EUR',
    label: 'EUR (€)',
    name: 'Euro',
    symbol: '€',
    flag: '🇪🇺',
    rateFromEur: 1.0
  },
  USD: {
    code: 'USD',
    label: 'USD ($)',
    name: 'Dollar US',
    symbol: '$',
    flag: '🇺🇸',
    rateFromEur: 1.08
  },
  CFA: {
    code: 'CFA',
    label: 'CFA (FCFA)',
    name: 'Franc CFA',
    symbol: 'FCFA',
    flag: '🌍',
    rateFromEur: 655.957
  }
};

interface CurrencyContextType {
  currency: CurrencyCode;
  setCurrency: (currency: CurrencyCode) => void;
  currencyConfig: CurrencyConfig;
  convertPrice: (amountInEur: number) => number;
  formatPrice: (amountInEur: number) => string;
  currencies: CurrencyConfig[];
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

export const CurrencyProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currency, setCurrencyState] = useState<CurrencyCode>(() => {
    const saved = localStorage.getItem('digishop_currency') as CurrencyCode;
    return saved && CURRENCIES[saved] ? saved : 'EUR';
  });

  const setCurrency = (c: CurrencyCode) => {
    if (CURRENCIES[c]) {
      setCurrencyState(c);
      localStorage.setItem('digishop_currency', c);
    }
  };

  const currencyConfig = CURRENCIES[currency];

  const convertPrice = (amountInEur: number): number => {
    if (isNaN(amountInEur) || amountInEur == null) return 0;
    const converted = amountInEur * currencyConfig.rateFromEur;
    if (currency === 'CFA') {
      return Math.round(converted);
    }
    return Math.round(converted * 100) / 100;
  };

  const formatPrice = (amountInEur: number): string => {
    if (isNaN(amountInEur) || amountInEur == null) return `0.00 ${currencyConfig.symbol}`;
    const val = convertPrice(amountInEur);
    
    if (currency === 'CFA') {
      // Franc CFA format: integer with spaces (e.g. 19 500 FCFA)
      return `${val.toLocaleString('fr-FR')} FCFA`;
    } else if (currency === 'USD') {
      // Dollar format: $29.90
      return `$${val.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    } else {
      // Euro format: 29,90 €
      return `${val.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €`;
    }
  };

  return (
    <CurrencyContext.Provider
      value={{
        currency,
        setCurrency,
        currencyConfig,
        convertPrice,
        formatPrice,
        currencies: Object.values(CURRENCIES)
      }}
    >
      {children}
    </CurrencyContext.Provider>
  );
};

export const useCurrency = () => {
  const context = useContext(CurrencyContext);
  if (!context) {
    throw new Error('useCurrency must be used within a CurrencyProvider');
  }
  return context;
};
