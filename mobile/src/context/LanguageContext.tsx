import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type LanguageCode = 'EN' | 'SI' | 'FR' | 'DE';

export interface MobileTranslations {
  tabHome: string;
  tabExplore: string;
  tabTrips: string;
  tabProfile: string;
  searchPlaceholder: string;
  featuredEscape: string;
  startingFrom: string;
  viewItinerary: string;
  reserveTrip: string;
  popularDestinations: string;
  explorePackages: string;
  viewAll: string;
  perPerson: string;
  itineraryTitle: string;
  includedAmenities: string;
  bookNow: string;
  myBookings: string;
  noBookings: string;
  signInToView: string;
  signIn: string;
  signOut: string;
  register: string;
  chatWhatsApp: string;
  conciergeOnline: string;
  currencyPreference: string;
  languagePreference: string;
}

const TRANSLATIONS: Record<LanguageCode, MobileTranslations> = {
  EN: {
    tabHome: 'Home',
    tabExplore: 'Explore',
    tabTrips: 'My Trips',
    tabProfile: 'Profile',
    searchPlaceholder: 'Search destinations, escapes...',
    featuredEscape: 'FEATURED ESCAPE',
    startingFrom: 'Starting from',
    viewItinerary: 'Itinerary',
    reserveTrip: 'Reserve This Trip',
    popularDestinations: 'Popular Destinations',
    explorePackages: 'Handcrafted Packages',
    viewAll: 'View All',
    perPerson: 'per person',
    itineraryTitle: 'Day-by-Day Itinerary',
    includedAmenities: 'Included Amenities',
    bookNow: 'Book Now',
    myBookings: 'My Expeditions',
    noBookings: 'You have no active bookings yet.',
    signInToView: 'Sign in to access your itinerary vouchers and booking history.',
    signIn: 'Sign In',
    signOut: 'Sign Out',
    register: 'Create Account',
    chatWhatsApp: 'Chat with VIP Concierge',
    conciergeOnline: 'CONCIERGE ONLINE',
    currencyPreference: 'Display Currency',
    languagePreference: 'App Language',
  },
  SI: {
    tabHome: 'මුල් පිටුව',
    tabExplore: 'ගවේෂණය',
    tabTrips: 'මගේ චාරිකා',
    tabProfile: 'ගිණුම',
    searchPlaceholder: 'ගමනාන්ත, පැකේජ සොයන්න...',
    featuredEscape: 'විශේෂිත සංචාරය',
    startingFrom: 'ආරම්භක මිල',
    viewItinerary: 'දින සැලැස්ම',
    reserveTrip: 'මෙම සංචාරය වෙන්කරන්න',
    popularDestinations: 'ජනප්‍රිය ගමනාන්ත',
    explorePackages: 'සුඛෝපභෝගී පැකේජ',
    viewAll: 'සියල්ල බලන්න',
    perPerson: 'එක් අයෙකුට',
    itineraryTitle: 'දිනෙන් දින සංචාර සැලැස්ම',
    includedAmenities: 'ඇතුළත් පහසුකම්',
    bookNow: 'දැන් වෙන්කරන්න',
    myBookings: 'මගේ වෙන්කිරීම්',
    noBookings: 'ඔබට තවමත් සක්‍රීය වෙන්කිරීම් නොමැත.',
    signInToView: 'ඔබගේ සංචාරක ටිකට්පත් බැලීමට ප්‍රථමයෙන් ගිණුමට ඇතුල් වන්න.',
    signIn: 'ඇතුල් වන්න',
    signOut: 'ඉවත් වන්න',
    register: 'නව ගිණුමක් තනන්න',
    chatWhatsApp: 'WhatsApp Concierge සහය',
    conciergeOnline: 'සජීවී සහය සක්‍රීයයි',
    currencyPreference: 'මුදල් ඒකකය තෝරන්න',
    languagePreference: 'භාෂාව තෝරන්න',
  },
  FR: {
    tabHome: 'Accueil',
    tabExplore: 'Explorer',
    tabTrips: 'Mes Voyages',
    tabProfile: 'Profil',
    searchPlaceholder: 'Rechercher des destinations...',
    featuredEscape: 'ÉVASION EN VEDETTE',
    startingFrom: 'À partir de',
    viewItinerary: 'Itinéraire',
    reserveTrip: 'Réserver Ce Voyage',
    popularDestinations: 'Destinations Populaires',
    explorePackages: 'Forfaits d’Exception',
    viewAll: 'Voir Tout',
    perPerson: 'par personne',
    itineraryTitle: 'Itinéraire Jour par Jour',
    includedAmenities: 'Prestations Incluses',
    bookNow: 'Réserver',
    myBookings: 'Mes Réservations',
    noBookings: 'Aucune réservation en cours.',
    signInToView: 'Connectez-vous pour voir vos réservations.',
    signIn: 'Connexion',
    signOut: 'Déconnexion',
    register: 'Créer un compte',
    chatWhatsApp: 'Conciergerie WhatsApp',
    conciergeOnline: 'CONCIERGE EN LIGNE',
    currencyPreference: 'Devise d’affichage',
    languagePreference: 'Langue de l’application',
  },
  DE: {
    tabHome: 'Start',
    tabExplore: 'Entdecken',
    tabTrips: 'Meine Reisen',
    tabProfile: 'Profil',
    searchPlaceholder: 'Reiseziele suchen...',
    featuredEscape: 'HIGHLIGHT-REISE',
    startingFrom: 'Ab',
    viewItinerary: 'Reiseplan',
    reserveTrip: 'Diese Reise buchen',
    popularDestinations: 'Beliebte Reiseziele',
    explorePackages: 'Exklusive Reisepakete',
    viewAll: 'Alle anzeigen',
    perPerson: 'pro Person',
    itineraryTitle: 'Tag-für-Tag Ablauf',
    includedAmenities: 'Inklusive Leistungen',
    bookNow: 'Jetzt buchen',
    myBookings: 'Meine Buchungen',
    noBookings: 'Keine aktiven Buchungen.',
    signInToView: 'Melden Sie sich an, um Buchungen einzusehen.',
    signIn: 'Anmelden',
    signOut: 'Abmelden',
    register: 'Konto erstellen',
    chatWhatsApp: 'WhatsApp Concierge',
    conciergeOnline: 'CONCIERGE ONLINE',
    currencyPreference: 'Währung',
    languagePreference: 'Sprache',
  },
};

interface LanguageContextType {
  language: LanguageCode;
  setLanguage: (l: LanguageCode) => void;
  t: MobileTranslations;
}

const LanguageContext = createContext<LanguageContextType>({
  language: 'EN',
  setLanguage: () => {},
  t: TRANSLATIONS.EN,
});

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<LanguageCode>('EN');

  useEffect(() => {
    AsyncStorage.getItem('globalvista_mobile_language').then((saved) => {
      if (saved && saved in TRANSLATIONS) {
        setLanguageState(saved as LanguageCode);
      }
    });
  }, []);

  const setLanguage = async (newLang: LanguageCode) => {
    setLanguageState(newLang);
    await AsyncStorage.setItem('globalvista_mobile_language', newLang);
  };

  return (
    <LanguageContext.Provider
      value={{
        language,
        setLanguage,
        t: TRANSLATIONS[language] || TRANSLATIONS.EN,
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => useContext(LanguageContext);
