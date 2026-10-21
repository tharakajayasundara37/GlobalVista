'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

export type CurrencyCode = 'USD' | 'EUR' | 'GBP' | 'LKR' | 'AUD' | 'JPY';

export interface CurrencyItem {
  code: CurrencyCode;
  symbol: string;
  name: string;
  flag: string;
  rate: number; // Rate relative to 1 USD (e.g. 1 USD = 0.891 EUR, 1 USD = 331.14 LKR)
}

export const INITIAL_CURRENCIES: Record<CurrencyCode, CurrencyItem> = {
  USD: { code: 'USD', symbol: '$', name: 'US Dollar', flag: '🇺🇸', rate: 1.0 },
  EUR: { code: 'EUR', symbol: '€', name: 'Euro', flag: '🇪🇺', rate: 0.891 },
  GBP: { code: 'GBP', symbol: '£', name: 'British Pound', flag: '🇬🇧', rate: 0.751 },
  LKR: { code: 'LKR', symbol: 'Rs', name: 'Sri Lankan Rupee', flag: '🇱🇰', rate: 331.14 },
  AUD: { code: 'AUD', symbol: 'A$', name: 'Australian Dollar', flag: '🇦🇺', rate: 1.433 },
  JPY: { code: 'JPY', symbol: '¥', name: 'Japanese Yen', flag: '🇯🇵', rate: 158.44 },
};

interface CurrencyContextType {
  currency: CurrencyCode;
  setCurrency: (code: CurrencyCode) => void;
  currencies: Record<CurrencyCode, CurrencyItem>;
  currentCurrency: CurrencyItem;
  convertPrice: (usdAmount: number, targetCode?: CurrencyCode) => number;
  formatPrice: (usdAmount: number, targetCode?: CurrencyCode) => string;
  isLiveRates: boolean;
  ratesUpdatedAt: string | null;
  refreshRates: () => Promise<void>;
  isConverterModalOpen: boolean;
  setIsConverterModalOpen: (open: boolean) => void;
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

export function CurrencyProvider({ children }: { children: React.ReactNode }) {
  const [currency, setCurrencyState] = useState<CurrencyCode>('USD');
  const [currencies, setCurrencies] = useState<Record<CurrencyCode, CurrencyItem>>(INITIAL_CURRENCIES);
  const [isLiveRates, setIsLiveRates] = useState(false);
  const [ratesUpdatedAt, setRatesUpdatedAt] = useState<string | null>(null);
  const [isConverterModalOpen, setIsConverterModalOpen] = useState(false);

  // Load saved preference
  useEffect(() => {
    try {
      const saved = localStorage.getItem('globalvista_currency') as CurrencyCode | null;
      if (saved && INITIAL_CURRENCIES[saved]) {
        setCurrencyState(saved);
      }
    } catch {}
  }, []);

  const setCurrency = (code: CurrencyCode) => {
    setCurrencyState(code);
    try {
      localStorage.setItem('globalvista_currency', code);
    } catch {}
  };

  const fetchLiveRates = async () => {
    try {
      const res = await fetch('https://open.er-api.com/v6/latest/USD', { cache: 'no-store' });
      if (!res.ok) return;
      const data = await res.json();
      if (data && data.rates) {
        setCurrencies((prev) => ({
          USD: { ...prev.USD, rate: 1.0 },
          EUR: { ...prev.EUR, rate: data.rates.EUR || prev.EUR.rate },
          GBP: { ...prev.GBP, rate: data.rates.GBP || prev.GBP.rate },
          LKR: { ...prev.LKR, rate: data.rates.LKR || prev.LKR.rate },
          AUD: { ...prev.AUD, rate: data.rates.AUD || prev.AUD.rate },
          JPY: { ...prev.JPY, rate: data.rates.JPY || prev.JPY.rate },
        }));
        setIsLiveRates(true);
        setRatesUpdatedAt(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
      }
    } catch (err) {
      console.warn('Using offline exchange rates fallback:', err);
    }
  };

  useEffect(() => {
    fetchLiveRates();
    // Refresh rates every 15 minutes
    const interval = setInterval(fetchLiveRates, 15 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const currentCurrency = currencies[currency] || currencies.USD;

  const convertPrice = (usdAmount: number, targetCode?: CurrencyCode): number => {
    const code = targetCode || currency;
    const item = currencies[code] || currencies.USD;
    return (usdAmount || 0) * (item.rate || 1);
  };

  const formatPrice = (usdAmount: number, targetCode?: CurrencyCode): string => {
    const code = targetCode || currency;
    const item = currencies[code] || currencies.USD;
    const converted = (usdAmount || 0) * (item.rate || 1);

    // Format according to currency style
    if (code === 'LKR' || code === 'JPY') {
      const rounded = Math.round(converted);
      return `${item.symbol} ${new Intl.NumberFormat('en-US').format(rounded)}`;
    }

    // For USD, EUR, GBP, AUD
    const rounded = Math.round(converted);
    if (code === 'EUR') {
      return `€${new Intl.NumberFormat('de-DE').format(rounded)}`;
    }
    if (code === 'GBP') {
      return `£${new Intl.NumberFormat('en-GB').format(rounded)}`;
    }
    if (code === 'AUD') {
      return `A$${new Intl.NumberFormat('en-US').format(rounded)}`;
    }

    return `$${new Intl.NumberFormat('en-US').format(rounded)}`;
  };

  return (
    <CurrencyContext.Provider
      value={{
        currency,
        setCurrency,
        currencies,
        currentCurrency,
        convertPrice,
        formatPrice,
        isLiveRates,
        ratesUpdatedAt,
        refreshRates: fetchLiveRates,
        isConverterModalOpen,
        setIsConverterModalOpen,
      }}
    >
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency() {
  const context = useContext(CurrencyContext);
  if (!context) {
    throw new Error('useCurrency must be used within a CurrencyProvider');
  }
  return context;
}
