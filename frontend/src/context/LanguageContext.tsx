'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

export type LanguageCode = 'EN' | 'SI' | 'FR' | 'DE' | 'IT' | 'ES' | 'JA';

export interface LanguageItem {
  code: LanguageCode;
  label: string;
  region: string;
  flag: string;
}

export const AVAILABLE_LANGUAGES: LanguageItem[] = [
  { code: 'EN', label: 'English', region: 'Global (US)', flag: '🇺🇸' },
  { code: 'SI', label: 'සිංහල', region: 'Sri Lanka', flag: '🇱🇰' },
  { code: 'FR', label: 'Français', region: 'France', flag: '🇫🇷' },
  { code: 'DE', label: 'Deutsch', region: 'Deutschland', flag: '🇩🇪' },
  { code: 'IT', label: 'Italiano', region: 'Italia', flag: '🇮🇹' },
  { code: 'ES', label: 'Español', region: 'España', flag: '🇪🇸' },
  { code: 'JA', label: '日本語', region: 'Japan', flag: '🇯🇵' },
];

export interface TranslationDictionary {
  nav: {
    destinations: string;
    experiences: string;
    specialOffers: string;
    reflections: string;
    plans: string;
    signIn: string;
    register: string;
    bookEscape: string;
    searchPlaceholder: string;
    myAccount: string;
    signOut: string;
  };
  hero: {
    tag: string;
    title: string;
    subtitle: string;
    exploreBtn: string;
    watchVideo: string;
    featuredEscape: string;
    reserveTrip: string;
    viewItinerary: string;
    startingFrom: string;
    perPerson: string;
    topRated: string;
    liveScene: string;
    pauseTour: string;
    playTour: string;
  };
  search: {
    whereTo: string;
    selectDestination: string;
    season: string;
    allSeasons: string;
    style: string;
    allStyles: string;
    findBtn: string;
    spring: string;
    summer: string;
    autumn: string;
    winter: string;
    luxury: string;
    adventure: string;
    honeymoon: string;
    culture: string;
  };
  stats: {
    curated: string;
    satisfaction: string;
    protected: string;
    concierge: string;
  };
  destinations: {
    eyebrow: string;
    title: string;
    subtitle: string;
    viewBook: string;
    itinerary: string;
    from: string;
    unavailable: string;
  };
  offers: {
    eyebrow: string;
    title: string;
    subtitle: string;
    bookNow: string;
    saveUpTo: string;
  };
  reflections: {
    eyebrow: string;
    title: string;
    subtitle: string;
    shareExperience: string;
    verifiedTraveller: string;
  };
  plans: {
    eyebrow: string;
    title: string;
    subtitle: string;
    popular: string;
    selectPlan: string;
  };
  footer: {
    contactUs: string;
    heading: string;
    name: string;
    email: string;
    message: string;
    sendMessage: string;
    sending: string;
    inquiryReceived: string;
    thankYou: string;
    sendAnother: string;
    whatsappDesk: string;
    placeholderName: string;
    placeholderEmail: string;
    placeholderMessage: string;
    secureBooking: string;
    premiumExperiences: string;
    conciergeResponse: string;
    copyright: string;
  };
  whatsapp: {
    conciergeOnline: string;
    chatWhatsApp: string;
  };
}

export const TRANSLATIONS: Record<LanguageCode, TranslationDictionary> = {
  EN: {
    nav: {
      destinations: 'Destinations',
      experiences: 'Experiences',
      specialOffers: 'Special Offers',
      reflections: 'Reflections',
      plans: 'Plans',
      signIn: 'Sign In',
      register: 'Register',
      bookEscape: 'Book Your Escape',
      searchPlaceholder: 'Search Escapes & Destinations...',
      myAccount: 'Traveller Portal',
      signOut: 'Sign Out',
    },
    hero: {
      tag: 'EXCLUSIVE LUXURY EXPEDITIONS',
      title: 'Discover Beyond Ordinary Horizons.',
      subtitle: 'Curated private journeys, overwater sanctuaries, and alpine chalets designed for discerning explorers.',
      exploreBtn: 'Explore Collections',
      watchVideo: 'Watch Film',
      featuredEscape: 'FEATURED ESCAPE',
      reserveTrip: 'Reserve This Trip',
      viewItinerary: 'View Day-by-Day Itinerary',
      startingFrom: 'Starting From',
      perPerson: 'per person',
      topRated: 'Top Rated',
      liveScene: 'LIVE DESTINATION SCENE',
      pauseTour: 'Pause Auto-Tour',
      playTour: 'Resume Auto-Tour',
    },
    search: {
      whereTo: 'Where would you like to travel?',
      selectDestination: 'Select destination',
      season: 'Preferred Season',
      allSeasons: 'All Seasons',
      style: 'Travel Style',
      allStyles: 'All Styles',
      findBtn: 'Find Expeditions',
      spring: 'Spring Awakening',
      summer: 'Summer Sun',
      autumn: 'Golden Autumn',
      winter: 'Winter Alpine',
      luxury: 'Ultra Luxury & Private Island',
      adventure: 'Adventure & Safari',
      honeymoon: 'Romantic Honeymoon',
      culture: 'Cultural & Heritage Odyssey',
    },
    stats: {
      curated: 'Curated Journeys',
      satisfaction: 'Guest Satisfaction',
      protected: 'Protected Sanctuaries',
      concierge: 'VIP Concierge Desk',
    },
    destinations: {
      eyebrow: 'CURATED SANCTUARIES',
      title: 'Signature Luxury Expeditions',
      subtitle: 'Handcrafted expeditions across pristine islands, cultural citadels, and alpine heights.',
      viewBook: 'View & Book',
      itinerary: 'Itinerary',
      from: 'From',
      unavailable: 'Unavailable',
    },
    offers: {
      eyebrow: 'LIMITED PRIVILEGE ESCAPES',
      title: 'Exclusive Promotional Privileges',
      subtitle: 'Privileged seasonal fares for luxury villas and expedition packages with bespoke concierge privileges.',
      bookNow: 'Book Now',
      saveUpTo: 'Save up to',
    },
    reflections: {
      eyebrow: 'DISPATCHES FROM SANCTUARIES',
      title: 'What Our Travellers Say',
      subtitle: 'Reflections and memories shared by discerning voyagers who explored the world with GlobalVista.',
      shareExperience: 'Share Your Experience',
      verifiedTraveller: 'Verified Voyageur',
    },
    plans: {
      eyebrow: 'CONCIERGE MEMBERSHIPS',
      title: 'Tiered Travel Memberships',
      subtitle: 'Unlock complimentary upgrades, dedicated private aviation access, and priority reservations.',
      popular: 'MOST POPULAR',
      selectPlan: 'Select Membership',
    },
    footer: {
      contactUs: 'CONTACT US',
      heading: 'Plan your next adventure with us.',
      name: 'NAME',
      email: 'EMAIL',
      message: 'MESSAGE',
      sendMessage: 'Send Message',
      sending: 'Sending Inquiry...',
      inquiryReceived: 'INQUIRY RECEIVED',
      thankYou: 'Thank you',
      sendAnother: 'Send Another Message',
      whatsappDesk: 'WhatsApp VIP Desk',
      placeholderName: 'Your name',
      placeholderEmail: 'you@email.com',
      placeholderMessage: 'Tell us about your dream trip (destinations, dates, group size)...',
      secureBooking: '256-Bit Encrypted Booking',
      premiumExperiences: 'Handcrafted Luxury Itineraries',
      conciergeResponse: 'Concierge response in under 2 hours',
      copyright: 'All rights reserved. Designed for luxury travel.',
    },
    whatsapp: {
      conciergeOnline: 'CONCIERGE ONLINE',
      chatWhatsApp: 'Chat on WhatsApp',
    },
  },

  SI: {
    nav: {
      destinations: 'ගමනාන්ත',
      experiences: 'අත්දැකීම්',
      specialOffers: 'විශේෂ දීමනා',
      reflections: 'සංචාරක මතක',
      plans: 'සැලසුම්',
      signIn: 'ඇතුල් වන්න',
      register: 'ලියාපදිංචි වන්න',
      bookEscape: 'චාරිකාව වෙන්කරන්න',
      searchPlaceholder: 'ගමනාන්ත සහ සංචාර සොයන්න...',
      myAccount: 'සංචාරක ගිණුම',
      signOut: 'පිටවන්න',
    },
    hero: {
      tag: 'සුවිශේෂී සුඛෝපභෝගී චාරිකා',
      title: 'සාමාන්‍ය සීමාවන්ගෙන් ඔබ්බට ලොව සොයා යන්න.',
      subtitle: 'ඔබ වෙනුවෙන්ම සැකසූ පෞද්ගලික සංචාර, දියමත පිහිටි සුඛෝපභෝගී විලා සහ ඇල්පයින් කඳුකර නවාතැන්.',
      exploreBtn: 'සංචාර ගවේෂණය',
      watchVideo: 'වීඩියෝව නරඹන්න',
      featuredEscape: 'විශේෂිත සංචාරය',
      reserveTrip: 'දැන්ම වෙන්කරගන්න',
      viewItinerary: 'දිනෙන් දින සැලැස්ම',
      startingFrom: 'ආරම්භක මිල',
      perPerson: 'එක් අයෙකුට',
      topRated: 'ඉහළම ඇගයීම්',
      liveScene: 'සජීවී ගමනාන්ත දසුන්',
      pauseTour: 'ස්වයංක්‍රීය චාරිකාව නවත්වන්න',
      playTour: 'ස්වයංක්‍රීය චාරිකාව ක්‍රියාත්මක කරන්න',
    },
    search: {
      whereTo: 'ඔබ යාමට කැමති කොහේද?',
      selectDestination: 'ගමනාන්තය තෝරන්න',
      season: 'කැමති කාලසීමාව',
      allSeasons: 'සියලුම කාලසීමා',
      style: 'සංචාරක විලාසය',
      allStyles: 'සියලුම විලාසයන්',
      findBtn: 'සංචාර සොයන්න',
      spring: 'වසන්ත සමය',
      summer: 'ගිම්හාන හිරු',
      autumn: 'සරත් සමය',
      winter: 'ශීත ඍතුව',
      luxury: 'අතිසුඛෝපභෝගී සහ පෞද්ගලික දූපත්',
      adventure: 'ත්‍රාසජනක සහ සෆාරි',
      honeymoon: 'රොමෑන්ටික් මධුසමය',
      culture: 'සංස්කෘතික සහ ඓතිහාසික චාරිකා',
    },
    stats: {
      curated: 'සුවිශේෂී සංචාර',
      satisfaction: 'සංචාරක තෘප්තිය',
      protected: 'සුරක්ෂිත ගමනාන්ත',
      concierge: '24/7 VIP සහය',
    },
    destinations: {
      eyebrow: 'සුවිශේෂී ගමනාන්ත',
      title: 'ප්‍රමුඛතම සුඛෝපභෝගී සංචාර',
      subtitle: 'සුන්දර දූපත්, ඓතිහාසික නගර සහ ඇල්පයින් කඳු මුදුන් හරහා විශේෂයෙන් සැලසුම් කළ චාරිකා.',
      viewBook: 'විස්තර සහ වෙන්කරගන්න',
      itinerary: 'සැලැස්ම',
      from: 'සිට',
      unavailable: 'දැනට නොමැත',
    },
    offers: {
      eyebrow: 'සීමිත කාලීන වට්ටම්',
      title: 'විශේෂ ප්‍රවර්ධන දීමනා',
      subtitle: 'සුඛෝපභෝගී විලා සහ සංචාරක පැකේජ සඳහා විශේෂ වට්ටම් සහිත මිල ගණන්.',
      bookNow: 'දැන්ම වෙන්කරන්න',
      saveUpTo: 'ඉතිරි කරගන්න',
    },
    reflections: {
      eyebrow: 'සංචාරක අත්දැකීම්',
      title: 'අපගේ සංචාරකයින්ගේ අදහස්',
      subtitle: 'GlobalVista සමඟ ලොව වටා සංචාරය කළ අමුත්තන් බෙදාගත් සැබෑ මතක සහ අත්දැකීම්.',
      shareExperience: 'ඔබේ අත්දැකීම බෙදාගන්න',
      verifiedTraveller: 'තහවුරු කළ සංචාරකයා',
    },
    plans: {
      eyebrow: 'සංචාරක සාමාජිකත්ව',
      title: 'සාමාජිකත්ව සැලසුම්',
      subtitle: 'නොමිලේ ලැබෙන අමතර වරප්‍රසාද, විශේෂ ප්‍රවේශ සහ ප්‍රමුඛතා වෙන්කිරීම් ලබාගන්න.',
      popular: 'වඩාත් ජනප්‍රිය',
      selectPlan: 'සාමාජිකත්වය තෝරන්න',
    },
    footer: {
      contactUs: 'අප අමතන්න',
      heading: 'ඔබගේ ඊළඟ සිහින සංචාරය අප සමඟ සැලසුම් කරන්න.',
      name: 'නම',
      email: 'ඊමේල් ලිපිනය',
      message: 'පණිවිඩය',
      sendMessage: 'පණිවිඩය යවන්න',
      sending: 'යවමින් පවතී...',
      inquiryReceived: 'විමසීම සාර්ථකව ලැබුණි',
      thankYou: 'ස්තූතියි',
      sendAnother: 'වෙනත් පණිවිඩයක් යවන්න',
      whatsappDesk: 'WhatsApp සජීවී සහය',
      placeholderName: 'ඔබගේ නම',
      placeholderEmail: 'you@email.com',
      placeholderMessage: 'ඔබගේ සිහින සංචාරය පිළිබඳ විස්තර (ගමනාන්ත, දිනයන්, පිරිස)...',
      secureBooking: '256-Bit සුරක්ෂිත වෙන්කිරීම්',
      premiumExperiences: 'සුවිශේෂී සුඛෝපභෝගී සංචාර',
      conciergeResponse: 'පැය 2ක් ඇතුළත පිළිතුරු සැපයීම',
      copyright: 'සියලුම හිමිකම් ඇවිරිණි. GlobalVista සුඛෝපභෝගී සංචාර.',
    },
    whatsapp: {
      conciergeOnline: 'සජීවී සහය ක්‍රියාත්මකයි',
      chatWhatsApp: 'WhatsApp මඟින් කතාබස් කරන්න',
    },
  },

  FR: {
    nav: {
      destinations: 'Destinations',
      experiences: 'Expériences',
      specialOffers: 'Offres Spéciales',
      reflections: 'Témoignages',
      plans: 'Forfaits',
      signIn: 'Connexion',
      register: "S'inscrire",
      bookEscape: 'Réserver une Évasion',
      searchPlaceholder: 'Rechercher des évasions...',
      myAccount: 'Espace Voyageur',
      signOut: 'Déconnexion',
    },
    hero: {
      tag: 'EXPÉDITIONS DE LUXE EXCLUSIVES',
      title: 'Découvrez au-delà des horizons ordinaires.',
      subtitle: 'Voyages privés sur mesure, sanctuaires sur pilotis et chalets alpins pour explorateurs avertis.',
      exploreBtn: 'Explorer la Collection',
      watchVideo: 'Regarder la Vidéo',
      featuredEscape: 'ÉVASION VEDETTE',
      reserveTrip: 'Réserver Ce Voyage',
      viewItinerary: "Voir l'itinéraire jour par jour",
      startingFrom: 'À partir de',
      perPerson: 'par personne',
      topRated: 'Mieux Noté',
      liveScene: 'SCÈNE EN DIRECT',
      pauseTour: 'Pause Visite Auto',
      playTour: 'Reprendre Visite Auto',
    },
    search: {
      whereTo: 'Où souhaitez-vous voyager ?',
      selectDestination: 'Sélectionner une destination',
      season: 'Saison préférée',
      allSeasons: 'Toutes les saisons',
      style: 'Style de voyage',
      allStyles: 'Tous les styles',
      findBtn: 'Trouver des Expéditions',
      spring: 'Réveil Printanier',
      summer: 'Soleil d’Été',
      autumn: 'Automne Doré',
      winter: 'Hiver Alpin',
      luxury: 'Ultra Luxe & Île Privée',
      adventure: 'Aventure & Safari',
      honeymoon: 'Lune de Miel Romantique',
      culture: 'Odyssée Culturelle & Patrimoine',
    },
    stats: {
      curated: 'Voyages d’Exception',
      satisfaction: 'Satisfaction Client',
      protected: 'Sanctuaires Protégés',
      concierge: 'Conciergerie VIP 24/7',
    },
    destinations: {
      eyebrow: 'SANCTUAIRES D’EXCEPTION',
      title: 'Expéditions de Prestige',
      subtitle: 'Expéditions artisanales sur des îles vierges, citadelles culturelles et sommets alpins.',
      viewBook: 'Voir & Réserver',
      itinerary: 'Itinéraire',
      from: 'À partir de',
      unavailable: 'Indisponible',
    },
    offers: {
      eyebrow: 'OFFRES PRIVILÈGES LIMITÉES',
      title: 'Privilèges Promotionnels Exclusifs',
      subtitle: 'Tarifs saisonniers privilégiés pour villas de luxe et séjours d’exception.',
      bookNow: 'Réserver',
      saveUpTo: 'Économisez jusqu’à',
    },
    reflections: {
      eyebrow: 'TÉMOIGNAGES DE SANCTUAIRES',
      title: 'Ce que Disent nos Voyageurs',
      subtitle: 'Souvenirs partagés par les voyageurs qui ont exploré le monde avec GlobalVista.',
      shareExperience: 'Partagez Votre Expérience',
      verifiedTraveller: 'Voyageur Vérifié',
    },
    plans: {
      eyebrow: 'ABONNEMENTS CONCIERGE',
      title: 'Abonnements de Voyage',
      subtitle: 'Accédez à des surclassements, à l’aviation privée et à des réservations prioritaires.',
      popular: 'PLUS POPULAIRE',
      selectPlan: 'Sélectionner',
    },
    footer: {
      contactUs: 'CONTACTEZ-NOUS',
      heading: 'Planifiez votre prochaine aventure avec nous.',
      name: 'NOM',
      email: 'E-MAIL',
      message: 'MESSAGE',
      sendMessage: 'Envoyer le Message',
      sending: 'Envoi en cours...',
      inquiryReceived: 'DEMANDE REÇUE',
      thankYou: 'Merci',
      sendAnother: 'Envoyer un autre message',
      whatsappDesk: 'Desk VIP WhatsApp',
      placeholderName: 'Votre nom',
      placeholderEmail: 'vous@email.com',
      placeholderMessage: 'Parlez-nous de votre voyage de rêve...',
      secureBooking: 'Réservation sécurisée 256 bits',
      premiumExperiences: 'Itinéraires de luxe sur mesure',
      conciergeResponse: 'Réponse sous 2 heures',
      copyright: 'Tous droits réservés. GlobalVista Voyages de Luxe.',
    },
    whatsapp: {
      conciergeOnline: 'CONCIERGE EN LIGNE',
      chatWhatsApp: 'Discuter sur WhatsApp',
    },
  },

  DE: {
    nav: {
      destinations: 'Reiseziele',
      experiences: 'Erlebnisse',
      specialOffers: 'Sonderangebote',
      reflections: 'Erfahrungen',
      plans: 'Reisepläne',
      signIn: 'Anmelden',
      register: 'Registrieren',
      bookEscape: 'Reise Buchen',
      searchPlaceholder: 'Reisen & Ziele suchen...',
      myAccount: 'Reise-Portal',
      signOut: 'Abmelden',
    },
    hero: {
      tag: 'EXKLUSIVE LUXUSREISEN',
      title: 'Entdecken Sie jenseits gewöhnlicher Horizonte.',
      subtitle: 'Maßgeschneiderte Privatreisen, Überwasser-Villen und alpine Chalets für anspruchsvolle Entdecker.',
      exploreBtn: 'Kollektion Entdecken',
      watchVideo: 'Film Ansehen',
      featuredEscape: 'HIGHLIGHT-REISE',
      reserveTrip: 'Jetzt Reservieren',
      viewItinerary: 'Tagesprogramm ansehen',
      startingFrom: 'Ab',
      perPerson: 'pro Person',
      topRated: 'Top Bewertet',
      liveScene: 'LIVE-REISEZIEL',
      pauseTour: 'Auto-Tour Anhalten',
      playTour: 'Auto-Tour Starten',
    },
    search: {
      whereTo: 'Wohin möchten Sie reisen?',
      selectDestination: 'Ziel wählen',
      season: 'Bevorzugte Reisezeit',
      allSeasons: 'Alle Jahreszeiten',
      style: 'Reisestil',
      allStyles: 'Alle Stile',
      findBtn: 'Reisen Finden',
      spring: 'Frühlingserwachen',
      summer: 'Sommersonne',
      autumn: 'Goldener Herbst',
      winter: 'Winter-Alpin',
      luxury: 'Ultra-Luxus & Privatinsel',
      adventure: 'Abenteuer & Safari',
      honeymoon: 'Romantische Flitterwochen',
      culture: 'Kultur & Kulturerbe',
    },
    stats: {
      curated: 'Kuratierte Reisen',
      satisfaction: 'Gästezufriedenheit',
      protected: 'Geschützte Reiseziele',
      concierge: 'VIP-Concierge-Desk',
    },
    destinations: {
      eyebrow: 'KURATIERTE REISEZIELE',
      title: 'Signature Luxusreisen',
      subtitle: 'Handverlesene Reisen zu unberührten Inseln, historischen Zitadellen und alpinen Gipfeln.',
      viewBook: 'Ansehen & Buchen',
      itinerary: 'Reiseplan',
      from: 'Ab',
      unavailable: 'Nicht verfügbar',
    },
    offers: {
      eyebrow: 'ZEITLICH BEGRENZTE ANGEBOTE',
      title: 'Exklusive Sonderkonditionen',
      subtitle: 'Privilegierte Saisonpreise für Luxusvillen und Pauschalreisen mit Concierge-Privilegien.',
      bookNow: 'Jetzt Buchen',
      saveUpTo: 'Sparen Sie bis zu',
    },
    reflections: {
      eyebrow: 'BERICHTE AUS DEN REVIEREN',
      title: 'Was Unsere Reisenden Sagen',
      subtitle: 'Erinnerungen geteilt von anspruchsvollen Reisenden, die die Welt mit GlobalVista erkundet haben.',
      shareExperience: 'Erfahrung Teilen',
      verifiedTraveller: 'Verifizierter Reisender',
    },
    plans: {
      eyebrow: 'CONCIERGE-MITGLIEDSCHAFTEN',
      title: 'Reise-Mitgliedschaften',
      subtitle: 'Kostenlose Upgrades, Zugang zu Privatjets und Prioritätsreservierungen freischalten.',
      popular: 'AM BELIEBTESTEN',
      selectPlan: 'Plan Wählen',
    },
    footer: {
      contactUs: 'KONTAKTIEREN SIE UNS',
      heading: 'Planen Sie Ihr nächstes Abenteuer mit uns.',
      name: 'NAME',
      email: 'E-MAIL',
      message: 'NACHRICHT',
      sendMessage: 'Nachricht Senden',
      sending: 'Wird gesendet...',
      inquiryReceived: 'ANFRAGE ERHALTEN',
      thankYou: 'Vielen Dank',
      sendAnother: 'Weitere Nachricht senden',
      whatsappDesk: 'WhatsApp VIP Desk',
      placeholderName: 'Ihr Name',
      placeholderEmail: 'sie@email.com',
      placeholderMessage: 'Erzählen Sie uns von Ihrer Traumreise...',
      secureBooking: '256-Bit-Verschlüsselte Buchung',
      premiumExperiences: 'Handgefertigte Luxus-Reiserouten',
      conciergeResponse: 'Concierge-Antwort unter 2 Stunden',
      copyright: 'Alle Rechte vorbehalten. GlobalVista Luxusreisen.',
    },
    whatsapp: {
      conciergeOnline: 'CONCIERGE ONLINE',
      chatWhatsApp: 'Auf WhatsApp Chatten',
    },
  },

  IT: {
    nav: {
      destinations: 'Destinazioni',
      experiences: 'Esperienze',
      specialOffers: 'Offerte Speciali',
      reflections: 'Recensioni',
      plans: 'Piani',
      signIn: 'Accedi',
      register: 'Registrati',
      bookEscape: 'Prenota Viaggio',
      searchPlaceholder: 'Cerca destinazioni...',
      myAccount: 'Portale Viaggiatore',
      signOut: 'Esci',
    },
    hero: {
      tag: 'SPEDIZIONI DI LUSSO ESCLUSIVE',
      title: 'Oltre gli orizzonti ordinari.',
      subtitle: 'Viaggi privati su misura, ville sull’acqua e chalet alpini per viaggiatori esigenti.',
      exploreBtn: 'Esplora Collezioni',
      watchVideo: 'Guarda Filmato',
      featuredEscape: 'FUGA IN PRIMO PIANO',
      reserveTrip: 'Prenota Questo Viaggio',
      viewItinerary: 'Visualizza itinerario',
      startingFrom: 'A partire da',
      perPerson: 'a persona',
      topRated: 'Più Votato',
      liveScene: 'SCENA DAL VIVO',
      pauseTour: 'Pausa Tour',
      playTour: 'Riprendi Tour',
    },
    search: {
      whereTo: 'Dove vorresti viaggiare?',
      selectDestination: 'Seleziona destinazione',
      season: 'Stagione preferita',
      allSeasons: 'Tutte le stagioni',
      style: 'Stile di viaggio',
      allStyles: 'Tutti gli stili',
      findBtn: 'Trova Spedizioni',
      spring: 'Risveglio Primaverile',
      summer: 'Sole Estivo',
      autumn: 'Autunno Dorato',
      winter: 'Inverno Alpino',
      luxury: 'Ultra Lusso & Isola Privata',
      adventure: 'Avventura & Safari',
      honeymoon: 'Luna di Miele Romantica',
      culture: 'Cultura & Patrimonio',
    },
    stats: {
      curated: 'Viaggi Curati',
      satisfaction: 'Soddisfazione Ospiti',
      protected: 'Destinazioni Protette',
      concierge: 'Concierge VIP 24/7',
    },
    destinations: {
      eyebrow: 'SANTUARI CURATI',
      title: 'Spedizioni di Lusso',
      subtitle: 'Spedizioni artigianali tra isole incontaminate, cittadelle storiche e vette alpine.',
      viewBook: 'Vedi e Prenota',
      itinerary: 'Itinerario',
      from: 'Da',
      unavailable: 'Non disponibile',
    },
    offers: {
      eyebrow: 'OFFERTE SPECIALI LIMITATE',
      title: 'Privilegi Promozionali Esclusivi',
      subtitle: 'Tariffe stagionali speciali per ville di lusso e pacchetti spedizione.',
      bookNow: 'Prenota Ora',
      saveUpTo: 'Risparmia fino a',
    },
    reflections: {
      eyebrow: 'MEMORIE DAI SANTUARI',
      title: 'Cosa Dicono i Nostri Viaggiatori',
      subtitle: 'Riflessioni condivise da viaggiatori che hanno esplorato il mondo con GlobalVista.',
      shareExperience: 'Condividi la Tua Esperienza',
      verifiedTraveller: 'Viaggiatore Verificato',
    },
    plans: {
      eyebrow: 'MEMBERSHIP CONCIERGE',
      title: 'Piani di Abbonamento',
      subtitle: 'Sblocca upgrade gratuiti, accesso all’aviazione privata e prenotazioni prioritarie.',
      popular: 'PIÙ POPOLARE',
      selectPlan: 'Seleziona Piano',
    },
    footer: {
      contactUs: 'CONTATTACI',
      heading: 'Pianifica la tua prossima avventura con noi.',
      name: 'NOME',
      email: 'E-MAIL',
      message: 'MESSAGGIO',
      sendMessage: 'Invia Messaggio',
      sending: 'Invio in corso...',
      inquiryReceived: 'RICHIESTA RICEVUTA',
      thankYou: 'Grazie',
      sendAnother: 'Invia un altro messaggio',
      whatsappDesk: 'Desk VIP WhatsApp',
      placeholderName: 'Il tuo nome',
      placeholderEmail: 'tu@email.com',
      placeholderMessage: 'Raccontaci del tuo viaggio da sogno...',
      secureBooking: 'Prenotazione crittografata a 256 bit',
      premiumExperiences: 'Itinerari di lusso personalizzati',
      conciergeResponse: 'Risposta concierge entro 2 ore',
      copyright: 'Tutti i diritti riservati. GlobalVista Viaggi di Lusso.',
    },
    whatsapp: {
      conciergeOnline: 'CONCIERGE ONLINE',
      chatWhatsApp: 'Chatta su WhatsApp',
    },
  },

  ES: {
    nav: {
      destinations: 'Destinos',
      experiences: 'Experiencias',
      specialOffers: 'Ofertas Especiales',
      reflections: 'Reflexiones',
      plans: 'Planes',
      signIn: 'Iniciar Sesión',
      register: 'Registrarse',
      bookEscape: 'Reservar Viaje',
      searchPlaceholder: 'Buscar escapadas y destinos...',
      myAccount: 'Portal del Viajero',
      signOut: 'Cerrar Sesión',
    },
    hero: {
      tag: 'EXPEDICIONES DE LUJO EXCLUSIVAS',
      title: 'Descubra más allá de los horizontes.',
      subtitle: 'Viajes privados a medida, villas sobre el agua y chalets alpinos para exploradores exigentes.',
      exploreBtn: 'Explorar Colección',
      watchVideo: 'Ver Película',
      featuredEscape: 'ESCAPADA DESTACADA',
      reserveTrip: 'Reservar Este Viaje',
      viewItinerary: 'Ver itinerario día a día',
      startingFrom: 'Desde',
      perPerson: 'por persona',
      topRated: 'Mejor Valorado',
      liveScene: 'DESTINO EN VIVO',
      pauseTour: 'Pausar Tour',
      playTour: 'Reanudar Tour',
    },
    search: {
      whereTo: '¿A dónde le gustaría viajar?',
      selectDestination: 'Seleccionar destino',
      season: 'Temporada preferida',
      allSeasons: 'Todas las temporadas',
      style: 'Estilo de viaje',
      allStyles: 'Todos los estilos',
      findBtn: 'Buscar Expediciones',
      spring: 'Despertar Primaveral',
      summer: 'Sol de Verano',
      autumn: 'Otoño Dorado',
      winter: 'Invierno Alpino',
      luxury: 'Ultra Lujo e Isla Privada',
      adventure: 'Aventura y Safari',
      honeymoon: 'Luna de Miel Romántica',
      culture: 'Odisea Cultural y Patrimonio',
    },
    stats: {
      curated: 'Viajes Curados',
      satisfaction: 'Satisfacción del Huésped',
      protected: 'Destinos Protegidos',
      concierge: 'Mesa VIP de Conserjería',
    },
    destinations: {
      eyebrow: 'SANTUARIOS EXCLUSIVOS',
      title: 'Expediciones Emblemáticas de Lujo',
      subtitle: 'Expediciones artesanales a través de islas vírgenes, ciudadelas culturales y cumbres alpinas.',
      viewBook: 'Ver y Reservar',
      itinerary: 'Itinerario',
      from: 'Desde',
      unavailable: 'No disponible',
    },
    offers: {
      eyebrow: 'PRIVILEGIOS PROMOCIONALES',
      title: 'Privilegios Promocionales Exclusivos',
      subtitle: 'Tarifas de temporada privilegiadas para villas de lujo y paquetes de expedición.',
      bookNow: 'Reservar',
      saveUpTo: 'Ahorre hasta un',
    },
    reflections: {
      eyebrow: 'RELATOS DE NUESTROS VIAJEROS',
      title: 'Lo que Dicen Nuestros Viajeros',
      subtitle: 'Recuerdos compartidos por viajeros que exploraron el mundo con GlobalVista.',
      shareExperience: 'Comparte Tu Experiencia',
      verifiedTraveller: 'Viajero Verificado',
    },
    plans: {
      eyebrow: 'MEMBRESÍAS CONCIERGE',
      title: 'Membresías de Viaje',
      subtitle: 'Desbloquee mejoras de cortesía, acceso a aviación privada y reservas prioritarias.',
      popular: 'MÁS POPULAR',
      selectPlan: 'Seleccionar Membresía',
    },
    footer: {
      contactUs: 'CONTÁCTENOS',
      heading: 'Planee su próxima aventura con nosotros.',
      name: 'NOMBRE',
      email: 'CORREO',
      message: 'MENSAJE',
      sendMessage: 'Enviar Mensaje',
      sending: 'Enviando...',
      inquiryReceived: 'CONSULTA RECIBIDA',
      thankYou: 'Gracias',
      sendAnother: 'Enviar otro mensaje',
      whatsappDesk: 'Mesa VIP de WhatsApp',
      placeholderName: 'Su nombre',
      placeholderEmail: 'usted@correo.com',
      placeholderMessage: 'Cuéntenos sobre el viaje de sus sueños...',
      secureBooking: 'Reserva cifrada de 256 bits',
      premiumExperiences: 'Itinerarios de lujo a medida',
      conciergeResponse: 'Respuesta en menos de 2 horas',
      copyright: 'Todos los derechos reservados. Viajes de Lujo GlobalVista.',
    },
    whatsapp: {
      conciergeOnline: 'CONSERJE EN LÍNEA',
      chatWhatsApp: 'Chatear en WhatsApp',
    },
  },

  JA: {
    nav: {
      destinations: '目的地',
      experiences: '体験',
      specialOffers: '特別オファー',
      reflections: '旅行者の声',
      plans: 'プラン',
      signIn: 'ログイン',
      register: '新規登録',
      bookEscape: '旅を予約',
      searchPlaceholder: '目的地やツアーを検索...',
      myAccount: 'マイページ',
      signOut: 'ログアウト',
    },
    hero: {
      tag: '高級ラグジュアリー探検ツアー',
      title: '日常を超えた旅の発見。',
      subtitle: '洗練された旅行者のための、プライベートな水上ヴィラや山岳リゾートシャレー。',
      exploreBtn: 'コレクションを見る',
      watchVideo: '映像を見る',
      featuredEscape: '注目の旅',
      reserveTrip: 'この旅を予約',
      viewItinerary: '日程表を見る',
      startingFrom: '開始価格',
      perPerson: '1名あたり',
      topRated: '最高評価',
      liveScene: 'ライブ旅行先',
      pauseTour: '自動ツアー一時停止',
      playTour: '自動ツアー再開',
    },
    search: {
      whereTo: 'どこへ旅行したいですか？',
      selectDestination: '目的地を選択',
      season: '希望の季節',
      allSeasons: 'すべての季節',
      style: '旅行スタイル',
      allStyles: 'すべてのスタイル',
      findBtn: 'ツアーを探す',
      spring: '春の目覚め',
      summer: '夏の太陽',
      autumn: '黄金の秋',
      winter: '冬のアルプス',
      luxury: 'ウルトララグジュアリー＆プライベートアイランド',
      adventure: '冒険＆サファリ',
      honeymoon: 'ロマンチックハネムーン',
      culture: '文化遺産の旅',
    },
    stats: {
      curated: '厳選された旅',
      satisfaction: '顧客満足度',
      protected: '保護された目的地',
      concierge: '24/7 VIPデスク',
    },
    destinations: {
      eyebrow: '厳選されたリゾート',
      title: 'シグネチャー探検ツアー',
      subtitle: '美しい島々、歴史的城塞、アルプスの高嶺を巡る特注の旅。',
      viewBook: '詳細と予約',
      itinerary: '日程表',
      from: 'から',
      unavailable: '現在利用不可',
    },
    offers: {
      eyebrow: '期間限定特別プロモーション',
      title: '限定プロモーション特典',
      subtitle: '高級ヴィラとツアーパッケージの特別シーズン料金。',
      bookNow: '今すぐ予約',
      saveUpTo: '最大割引',
    },
    reflections: {
      eyebrow: '旅行者からの声',
      title: '旅行者の体験談',
      subtitle: 'GlobalVistaで世界を旅したお客様の貴重な思い出と感想。',
      shareExperience: '体験をシェアする',
      verifiedTraveller: '確認済み旅行者',
    },
    plans: {
      eyebrow: 'コンシェルジュメンバーシップ',
      title: 'メンバーシッププラン',
      subtitle: '無料アップグレード、プライベートジェットの手配、優先予約特典。',
      popular: '一番人気',
      selectPlan: 'プランを選択',
    },
    footer: {
      contactUs: 'お問い合わせ',
      heading: '私たちと次の冒険を計画しましょう。',
      name: 'お名前',
      email: 'メールアドレス',
      message: 'メッセージ',
      sendMessage: '送信する',
      sending: '送信中...',
      inquiryReceived: 'お問い合わせ完了',
      thankYou: 'ありがとうございます',
      sendAnother: '別のメッセージを送信',
      whatsappDesk: 'WhatsApp VIPデスク',
      placeholderName: 'お名前',
      placeholderEmail: 'you@email.com',
      placeholderMessage: '理想の旅についてお聞かせください...',
      secureBooking: '256ビット暗号化予約',
      premiumExperiences: '厳選された高級旅程',
      conciergeResponse: '2時間以内のコンシェルジュ対応',
      copyright: '無断複写・転載を禁じます。GlobalVista Luxury Travel.',
    },
    whatsapp: {
      conciergeOnline: 'オンラインコンシェルジュ',
      chatWhatsApp: 'WhatsAppでチャット',
    },
  },
};

interface LanguageContextType {
  language: LanguageCode;
  setLanguage: (code: LanguageCode) => void;
  availableLanguages: LanguageItem[];
  currentLanguage: LanguageItem;
  t: TranslationDictionary;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<LanguageCode>('EN');

  useEffect(() => {
    try {
      const saved = localStorage.getItem('globalvista_language') as LanguageCode | null;
      if (saved && TRANSLATIONS[saved]) {
        setLanguageState(saved);
      }
    } catch {}
  }, []);

  const setLanguage = (code: LanguageCode) => {
    setLanguageState(code);
    try {
      localStorage.setItem('globalvista_language', code);
    } catch {}
  };

  const currentLanguage =
    AVAILABLE_LANGUAGES.find((l) => l.code === language) || AVAILABLE_LANGUAGES[0];
  const t = TRANSLATIONS[language] || TRANSLATIONS.EN;

  return (
    <LanguageContext.Provider
      value={{
        language,
        setLanguage,
        availableLanguages: AVAILABLE_LANGUAGES,
        currentLanguage,
        t,
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
