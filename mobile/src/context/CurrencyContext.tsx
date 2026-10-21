import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type CurrencyCode = 'USD' | 'LKR' | 'EUR' | 'GBP' | 'AUD' | 'JPY';

export interface CurrencyConfig {
  code: CurrencyCode;
  symbol: string;
  label: string;
  flag: string;
  rate: number;
}

export const CURRENCIES: Record<CurrencyCode, CurrencyConfig> = {
  USD: { code: 'USD', symbol: '$', label: 'US Dollar', flag: '🇺🇸', rate: 1.0 },
  LKR: { code: 'LKR', symbol: 'Rs. ', label: 'Sri Lankan Rupee', flag: '🇱🇰', rate: 308.5 },
  EUR: { code: 'EUR', symbol: '€', label: 'Euro', flag: '🇪🇺', rate: 0.92 },
  GBP: { code: 'GBP', symbol: '£', label: 'British Pound', flag: '🇬🇧', rate: 0.79 },
  AUD: { code: 'AUD', symbol: 'A$', label: 'Australian Dollar', flag: '🇦🇺', rate: 1.54 },
  JPY: { code: 'JPY', symbol: '¥', label: 'Japanese Yen', flag: '🇯🇵', rate: 154.2 },
};

interface CurrencyContextType {
  currency: CurrencyCode;
  setCurrency: (c: CurrencyCode) => void;
  formatPrice: (usdPrice: number) => string;
  currentCurrency: CurrencyConfig;
}

const CurrencyContext = createContext<CurrencyContextType>({
  currency: 'USD',
  setCurrency: () => {},
  formatPrice: (p) => `$${p}`,
  currentCurrency: CURRENCIES.USD,
});

export const CurrencyProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currency, setCurrencyState] = useState<CurrencyCode>('USD');

  useEffect(() => {
    AsyncStorage.getItem('globalvista_mobile_currency').then((saved) => {
      if (saved && saved in CURRENCIES) {
        setCurrencyState(saved as CurrencyCode);
      }
    });
  }, []);

  const setCurrency = async (newCurr: CurrencyCode) => {
    setCurrencyState(newCurr);
    await AsyncStorage.setItem('globalvista_mobile_currency', newCurr);
  };

  const formatPrice = (usdAmount: number): string => {
    const cfg = CURRENCIES[currency] || CURRENCIES.USD;
    const converted = usdAmount * cfg.rate;
    const formattedNum = new Intl.NumberFormat('en-US', {
      maximumFractionDigits: currency === 'JPY' ? 0 : 0,
    }).format(converted);
    return `${cfg.symbol}${formattedNum}`;
  };

  return (
    <CurrencyContext.Provider
      value={{
        currency,
        setCurrency,
        formatPrice,
        currentCurrency: CURRENCIES[currency] || CURRENCIES.USD,
      }}
    >
      {children}
    </CurrencyContext.Provider>
  );
};

export const useCurrency = () => useContext(CurrencyContext);
