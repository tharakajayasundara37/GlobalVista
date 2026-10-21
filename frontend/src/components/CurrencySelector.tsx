'use client';

import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check, Calculator, Sparkles } from 'lucide-react';
import { useCurrency, CurrencyCode } from '../context/CurrencyContext';

export default function CurrencySelector() {
  const {
    currency,
    setCurrency,
    currencies,
    setIsConverterModalOpen,
  } = useCurrency();

  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement | null>(null);

  // Close on outside click
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
    }
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, [isOpen]);

  const currencyList: CurrencyCode[] = ['USD', 'EUR', 'GBP', 'LKR', 'AUD', 'JPY'];
  const currentItem = currencies[currency] || currencies.USD;

  return (
    <div className="currencySelectorWrapper" ref={dropdownRef}>
      <button
        type="button"
        className={`currencySelectorBtn ${isOpen ? 'currencySelectorActive' : ''}`}
        aria-label="Currency selection"
        aria-expanded={isOpen}
        onClick={() => setIsOpen((prev) => !prev)}
      >
        <span className="currencyFlagSymbol">{currentItem.flag}</span>
        <span className="currencyCodeLabel">{currency}</span>
        <span className="currencySymbolBadge">{currentItem.symbol}</span>
        <ChevronDown
          size={13}
          strokeWidth={2.2}
          className={`currChevron ${isOpen ? 'currChevronOpen' : ''}`}
        />
      </button>

      {isOpen && (
        <div className="navbarCurrencyDropdown">
          <div className="currencyDropdownHeader">
            <span>Select Currency</span>
            <small>Live Auto-Conversion</small>
          </div>

          <div className="currencyList">
            {currencyList.map((code) => {
              const item = currencies[code];
              const isSelected = currency === code;

              return (
                <button
                  key={code}
                  type="button"
                  className={`currencyDropdownItem ${isSelected ? 'currencyItemActive' : ''}`}
                  onClick={() => {
                    setCurrency(code);
                    setIsOpen(false);
                  }}
                >
                  <div className="currencyItemLeft">
                    <span className="currencyFlag">{item.flag}</span>
                    <div className="currencyNames">
                      <strong>{code} ({item.symbol})</strong>
                      <small>{item.name}</small>
                    </div>
                  </div>

                  {isSelected ? (
                    <Check size={16} className="currencyCheckIcon" />
                  ) : (
                    <span className="currencyRateBadge">
                      {code === 'USD' ? 'Base' : `${item.rate > 10 ? item.rate.toFixed(0) : item.rate.toFixed(2)}`}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          <div className="currencyDropdownFooter">
            <button
              type="button"
              className="openFullCalculatorBtn"
              onClick={() => {
                setIsOpen(false);
                setIsConverterModalOpen(true);
              }}
            >
              <Calculator size={14} />
              <span>Open Currency Calculator</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
