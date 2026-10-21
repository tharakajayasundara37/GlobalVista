'use client';

import React, { useState, useEffect } from 'react';
import {
  X,
  ArrowRightLeft,
  RefreshCw,
  Sparkles,
  TrendingUp,
  Check,
  Globe2,
} from 'lucide-react';
import { useCurrency, CurrencyCode } from '../context/CurrencyContext';

export default function CurrencyConverterModal() {
  const {
    currency,
    setCurrency,
    currencies,
    isConverterModalOpen,
    setIsConverterModalOpen,
    isLiveRates,
    ratesUpdatedAt,
    refreshRates,
  } = useCurrency();

  const [inputAmount, setInputAmount] = useState<number>(1000);
  const [baseCurrency, setBaseCurrency] = useState<CurrencyCode>('USD');
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Close on Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsConverterModalOpen(false);
    };
    if (isConverterModalOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isConverterModalOpen, setIsConverterModalOpen]);

  if (!isConverterModalOpen) return null;

  // Convert inputAmount in baseCurrency to USD first, then to target
  const baseRate = currencies[baseCurrency]?.rate || 1.0;
  const amountInUSD = inputAmount / baseRate;

  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    await refreshRates();
    setTimeout(() => setIsRefreshing(false), 600);
  };

  const currencyList: CurrencyCode[] = ['USD', 'EUR', 'GBP', 'LKR', 'AUD', 'JPY'];

  return (
    <div
      className="currencyModalOverlay"
      onClick={() => setIsConverterModalOpen(false)}
      role="dialog"
      aria-modal="true"
    >
      <div className="currencyModal" onClick={(e) => e.stopPropagation()}>
        {/* HEADER */}
        <div className="currencyModalHeader">
          <div className="currencyHeaderTitleWrap">
            <div className="currencyModalTag">
              <Sparkles size={13} />
              <span>GLOBAL EXCHANGE DESK</span>
            </div>
            <h2>Live Travel Currency Converter</h2>
            <p>
              Real-time foreign exchange rates for luxury GlobalVista itineraries and expeditions.
            </p>
          </div>

          <button
            type="button"
            className="currencyModalClose"
            onClick={() => setIsConverterModalOpen(false)}
            aria-label="Close currency modal"
          >
            <X size={18} />
          </button>
        </div>

        {/* LIVE RATES STATUS STRIP */}
        <div className="currencyRateStatusStrip">
          <div className="rateStatusBadge">
            <span className="liveRateGreenDot" />
            <strong>{isLiveRates ? 'Live Market Rates Active' : 'Verified Reference Rates'}</strong>
            {ratesUpdatedAt && <small>· Updated {ratesUpdatedAt}</small>}
          </div>

          <button
            type="button"
            className={`currencyRefreshBtn ${isRefreshing ? 'isRefreshing' : ''}`}
            onClick={handleManualRefresh}
            title="Refresh exchange rates"
          >
            <RefreshCw size={13} className={isRefreshing ? 'spinIcon' : ''} />
            <span>Refresh Rates</span>
          </button>
        </div>

        {/* INPUT CALCULATOR ROW */}
        <div className="currencyCalculatorBody">
          <div className="currencyInputCard">
            <span className="calculatorLabel">ENTER AMOUNT TO CONVERT</span>
            <div className="currencyInputGroup">
              <input
                type="number"
                min="1"
                step="any"
                value={inputAmount || ''}
                onChange={(e) => setInputAmount(parseFloat(e.target.value) || 0)}
                placeholder="1000"
                className="currencyNumberInput"
              />

              <div className="currencyBaseSelectWrap">
                <select
                  value={baseCurrency}
                  onChange={(e) => setBaseCurrency(e.target.value as CurrencyCode)}
                  className="currencySelectDropdown"
                >
                  {currencyList.map((code) => {
                    const item = currencies[code];
                    return (
                      <option key={code} value={code}>
                        {item.flag} {code} ({item.symbol})
                      </option>
                    );
                  })}
                </select>
              </div>
            </div>
          </div>

          {/* QUICK TARGET COMPARISON TILES */}
          <div className="currencyTilesGrid">
            {currencyList.map((code) => {
              const item = currencies[code];
              const convertedVal = amountInUSD * item.rate;
              const isSelectedSiteCurrency = currency === code;
              const isCurrentBase = baseCurrency === code;

              let formatted = '';
              if (code === 'LKR' || code === 'JPY') {
                formatted = `${item.symbol} ${new Intl.NumberFormat('en-US').format(Math.round(convertedVal))}`;
              } else if (code === 'EUR') {
                formatted = `€${new Intl.NumberFormat('de-DE').format(Math.round(convertedVal))}`;
              } else if (code === 'GBP') {
                formatted = `£${new Intl.NumberFormat('en-GB').format(Math.round(convertedVal))}`;
              } else {
                formatted = `${item.symbol}${new Intl.NumberFormat('en-US').format(Math.round(convertedVal))}`;
              }

              return (
                <div
                  key={code}
                  className={`currencyTile ${isSelectedSiteCurrency ? 'tileActiveSite' : ''} ${isCurrentBase ? 'tileBase' : ''}`}
                >
                  <div className="currencyTileTop">
                    <div className="tileFlagWrap">
                      <span className="tileFlag">{item.flag}</span>
                      <div>
                        <strong>{code}</strong>
                        <small>{item.name}</small>
                      </div>
                    </div>
                    {isSelectedSiteCurrency && (
                      <span className="siteCurrencyActiveBadge">
                        <Check size={11} /> Site Active
                      </span>
                    )}
                  </div>

                  <div className="currencyTileValue">
                    <strong>{formatted}</strong>
                  </div>

                  <div className="currencyTileFooter">
                    <span className="exchangeRateHint">
                      1 USD = {code === 'LKR' || code === 'JPY' ? item.rate.toFixed(2) : item.rate.toFixed(4)} {code}
                    </span>

                    {!isSelectedSiteCurrency && (
                      <button
                        type="button"
                        className="applySiteCurrencyBtn"
                        onClick={() => {
                          setCurrency(code);
                        }}
                      >
                        Set for Site
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* POPULAR TRAVEL EXAMPLES */}
          <div className="currencyPresetsCard">
            <span className="presetsHeading">QUICK TRIP BUDGET ESTIMATES:</span>
            <div className="presetsRow">
              <button
                type="button"
                className="presetPill"
                onClick={() => {
                  setBaseCurrency('USD');
                  setInputAmount(500);
                }}
              >
                $500 · Weekend Escape
              </button>
              <button
                type="button"
                className="presetPill"
                onClick={() => {
                  setBaseCurrency('USD');
                  setInputAmount(1999);
                }}
              >
                $1,999 · Sigiriya Expedition
              </button>
              <button
                type="button"
                className="presetPill"
                onClick={() => {
                  setBaseCurrency('USD');
                  setInputAmount(2500);
                }}
              >
                $2,500 · Maldives Luxury Villa
              </button>
              <button
                type="button"
                className="presetPill"
                onClick={() => {
                  setBaseCurrency('USD');
                  setInputAmount(4000);
                }}
              >
                $4,000 · Swiss Alpine Chalet
              </button>
            </div>
          </div>
        </div>

        {/* FOOTER */}
        <div className="currencyModalFooter">
          <div className="footerCurrencyHint">
            <Globe2 size={15} />
            <span>
              Currently viewing website packages in <strong>{currencies[currency]?.flag} {currency} ({currencies[currency]?.symbol})</strong>.
            </span>
          </div>

          <button
            type="button"
            className="currencyDoneBtn"
            onClick={() => setIsConverterModalOpen(false)}
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
