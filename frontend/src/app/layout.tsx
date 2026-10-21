import type { Metadata } from 'next';
import './globals.css';
import { CurrencyProvider } from '../context/CurrencyContext';
import { LanguageProvider } from '../context/LanguageContext';
import CurrencyConverterModal from '../components/CurrencyConverterModal';

export const metadata: Metadata = {
  title: 'GlobalVista | Explore Beyond',
  description: 'Discover unforgettable destinations and travel experiences.'
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <LanguageProvider>
          <CurrencyProvider>
            {children}
            <CurrencyConverterModal />
          </CurrencyProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}