'use client';

import React, { useState, useEffect } from 'react';
import {
  X,
  CalendarDays,
  Clock3,
  MapPin,
  Utensils,
  BedDouble,
  Lightbulb,
  Compass,
  ShieldCheck,
  Check,
  Printer,
  ArrowRight,
  Sparkles,
  Sun,
  Moon,
  Sunrise,
  Share2,
} from 'lucide-react';
import { FaWhatsapp } from 'react-icons/fa';
import { useCurrency } from '../context/CurrencyContext';

export type PackageAddOn = {
  _id: string;
  name: string;
  price: number;
  pricingType: 'PER_PERSON' | 'PER_BOOKING';
};

export type ApiPackage = {
  _id: string;
  destinationId?: string | { _id: string } | null;
  title: string;
  destination: string;
  country: string;
  duration: string;
  price: number;
  category: string;
  description: string;
  included: string[];
  addOns?: PackageAddOn[];
  images: string[];
  availability: boolean;
  isSpecialOffer?: boolean;
  originalPrice?: number;
  discountPercentage?: number;
  reviewInfo?: { averageRating: number; totalReviews: number };
};

export type ItineraryDay = {
  day: number;
  title: string;
  subtitle?: string;
  location: string;
  activities: {
    time: 'Morning' | 'Afternoon' | 'Evening';
    title: string;
    description: string;
  }[];
  meals: {
    breakfast: boolean;
    lunch: boolean;
    dinner: boolean;
  };
  stay: string;
  insiderTip?: string;
};

// Curated itineraries for signature destinations
const CURATED_ITINERARIES: Record<string, ItineraryDay[]> = {
  'sri lanka': [
    {
      day: 1,
      title: 'Arrival & Gateway to the Cultural Cradle',
      subtitle: 'VIP Airport Meet & Chauffeur Transfer',
      location: 'Bandaranaike Intl Airport → Sigiriya',
      activities: [
        {
          time: 'Morning',
          title: 'VIP Airport Welcome & Executive Chauffeur',
          description:
            'Touch down in Colombo (CMB) where your dedicated private chauffeur and English-speaking guide welcomes you with fresh king coconuts and chilled herbal towels.',
        },
        {
          time: 'Afternoon',
          title: 'Scenic Drive through Emerald Coconut Belts',
          description:
            'Traverse rural Sri Lankan country roads dotted with lotus-strewn paddy lakes and spice orchards on the journey north to the Cultural Triangle.',
        },
        {
          time: 'Evening',
          title: 'Check-in & Sunset Cocktails Facing the Rock',
          description:
            'Check in to your luxury water garden pavilion. Unwind with twilight cocktails as Sigiriya Rock Fortress reflects against the lagoon waters.',
        },
      ],
      meals: { breakfast: false, lunch: true, dinner: true },
      stay: 'Water Garden Sigiriya / Heritance Kandalama',
      insiderTip:
        'Rest early tonight—the morning climb of Sigiriya is coolest and most magical at sunrise.',
    },
    {
      day: 2,
      title: 'The Sky Fortress & Wild Elephant Gathering',
      subtitle: '5th-Century Wonder & Minneriya Safari',
      location: 'Sigiriya Rock & Minneriya National Park',
      activities: [
        {
          time: 'Morning',
          title: 'Sunrise Guided Ascent of Sigiriya Rock Fortress',
          description:
            'Ascend King Kashyapa’s 5th-century citadel. Marvel at the ancient water gardens, exquisite ceiling frescoes, mirror wall, and colossal Lion’s Paws.',
        },
        {
          time: 'Afternoon',
          title: 'Traditional Lake-Village Clay Pot Feast',
          description:
            'Experience authentic village cuisine prepared in woodfire clay pots, featuring heirloom red rice, tender jackfruit curry, and lotus root salads.',
        },
        {
          time: 'Evening',
          title: 'Private Open-Top 4x4 Safari in Minneriya',
          description:
            'Embark on a private sunset safari to witness the world-famous gathering of 200+ wild Asian elephants grazing around the ancient Minneriya reservoir.',
        },
      ],
      meals: { breakfast: true, lunch: true, dinner: true },
      stay: 'Water Garden Sigiriya / Heritance Kandalama',
      insiderTip:
        'Wear lightweight hiking shoes and carry a wide-angle lens for panoramic 360-degree summit photos.',
    },
    {
      day: 3,
      title: 'Dambulla Cave Temples & The Royal Hill Capital',
      subtitle: 'Gilded Sanctuaries & Sacred Tooth Relic',
      location: 'Dambulla → Kandy',
      activities: [
        {
          time: 'Morning',
          title: 'UNESCO Dambulla Golden Rock Cave Temples',
          description:
            'Explore 5 mystical cavern shrines carved into granite cliffs containing over 150 gold-leaf Buddha statues dating back to the 1st century BC.',
        },
        {
          time: 'Afternoon',
          title: 'Highland Spice Gardens & Sacred Kandy Lake',
          description:
            'Drive through misty cardamom hills into royal Kandy. Stroll around Kandy Lake and visit local gem lapidaries and batik workshops.',
        },
        {
          time: 'Evening',
          title: 'Private Viewing at the Temple of the Sacred Tooth',
          description:
            'Attend the evening puja ceremony with ceremonial drumming at Sri Dalada Maligawa, followed by a Kandyan cultural drum & fire dance performance.',
        },
      ],
      meals: { breakfast: true, lunch: true, dinner: true },
      stay: 'The Grand Kandyan / Earl’s Regency',
      insiderTip:
        'Modest attire covering shoulders and knees is strictly observed inside the sacred temple grounds.',
    },
    {
      day: 4,
      title: 'Scenic Observation Train to Misty Tea Valleys',
      subtitle: 'Colonial High Tea & Nine Arches Bridge',
      location: 'Kandy → Nuwara Eliya & Ella',
      activities: [
        {
          time: 'Morning',
          title: 'First-Class Scenic Highland Railway Journey',
          description:
            'Board Sri Lanka’s legendary hill-country train curving past thundering waterfalls, pine forests, and emerald Ceylon tea estates.',
        },
        {
          time: 'Afternoon',
          title: 'Heritage Tea Estate Tour & Master Tea Tasting',
          description:
            'Walk the slopes with an expert tea sommelier, witness traditional orthodox leaf plucking, and savor single-estate Orange Pekoes.',
        },
        {
          time: 'Evening',
          title: 'Trek to Demodara Nine Arches Bridge & Sunset',
          description:
            'Walk through eucalyptus groves to watch the vintage blue train cross the colonial stone viaduct framed by green hillsides.',
        },
      ],
      meals: { breakfast: true, lunch: true, dinner: true },
      stay: '98 Acres Resort & Spa / Grand Hotel Nuwara Eliya',
      insiderTip:
        'The right side of the train offers the finest waterfall and tea mountain vistas on this sector.',
    },
    {
      day: 5,
      title: 'Sunrise over Ella Gap & Coastal Farewell',
      subtitle: 'Little Adam’s Peak & Return Transfer',
      location: 'Ella → Colombo / Departure',
      activities: [
        {
          time: 'Morning',
          title: 'Sunrise Walk to Little Adam’s Peak',
          description:
            'A gentle 45-minute morning trek rewarded with panoramic views stretching to the southern coast on clear days.',
        },
        {
          time: 'Afternoon',
          title: 'Leisurely Breakfast & Private Chauffeur to Airport',
          description:
            'Enjoy a tropical breakfast of buffalo curd, treacle, and fresh fruit before comfortable southern expressway transit to Colombo / CMB Airport.',
        },
        {
          time: 'Evening',
          title: 'Departure Assistance & Farewell Gift',
          description:
            'Check-in assistance for your flight home, accompanied by a curated gift tin of pure Ceylon Golden Tips tea.',
        },
      ],
      meals: { breakfast: true, lunch: false, dinner: false },
      stay: 'Departure Flight / Extension Option',
      insiderTip:
        'Ask your chauffeur for a stop at the Dutch Hospital in Colombo for last-minute boutique souvenirs.',
    },
  ],

  japan: [
    {
      day: 1,
      title: 'Arrival in Tokyo: City of the Future',
      subtitle: 'Private Chauffeur & Sky Lounge Check-in',
      location: 'Haneda / Narita → Shinjuku, Tokyo',
      activities: [
        {
          time: 'Morning',
          title: 'VIP Airport Meet & Executive Transfer',
          description:
            'Touch down in Tokyo with private executive greeting, luggage handling, and transfer into the glittering neon heart of Shinjuku.',
        },
        {
          time: 'Afternoon',
          title: 'Check-in at High-Floor Luxury Tower Hotel',
          description:
            'Relax in your panoramic room overlooking the sprawling Tokyo metropolis with views of the Imperial Palace or Mt. Fuji.',
        },
        {
          time: 'Evening',
          title: 'Welcome Omakase Dinner in Shinjuku',
          description:
            'Begin your culinary exploration with a welcome dinner crafted by a master sushi chef featuring Tokyo Bay catch of the day.',
        },
      ],
      meals: { breakfast: false, lunch: false, dinner: true },
      stay: 'Keio Plaza Hotel Tokyo / Park Hyatt',
      insiderTip:
        'Pick up a Pasmo/Suica IC travel card for seamless transit throughout Japanese rail stations.',
    },
    {
      day: 2,
      title: 'Ancient Heritage to Neon Shibuya Crossing',
      subtitle: 'Asakusa Senso-ji & Digital Art Immersions',
      location: 'Tokyo City Highlights',
      activities: [
        {
          time: 'Morning',
          title: 'Senso-ji Temple & Nakamise Cultural Walk',
          description:
            'Stroll through Tokyo’s oldest Buddhist sanctuary in Asakusa under towering red lanterns, sampling warm melon-pan and freshly baked senbei crackers.',
        },
        {
          time: 'Afternoon',
          title: 'Imperial East Gardens & teamLab Planets',
          description:
            'Walk ancient moats and stone ramparts of the Edo Castle grounds, followed by barefoot immersion in digital light and orchid rooms at teamLab.',
        },
        {
          time: 'Evening',
          title: 'Iconic Shibuya Crossing & Izakaya Alleyways',
          description:
            'Cross the world’s busiest pedestrian scramble, visit Hachiko statue, and enjoy grilled yakitori skewers in atmospheric Omoide Yokocho.',
        },
      ],
      meals: { breakfast: true, lunch: true, dinner: true },
      stay: 'Keio Plaza Hotel Tokyo',
      insiderTip:
        'The rooftop terrace of Shibuya SKY provides the best birds-eye view of Shibuya Crossing at dusk.',
    },
    {
      day: 3,
      title: 'Mount Fuji, Alpine Lakes & Hot Spring Onsen',
      subtitle: 'Fuji 5th Station & Lake Kawaguchiko',
      location: 'Fuji-Hakone-Izu National Park',
      activities: [
        {
          time: 'Morning',
          title: 'Private Coach to Mount Fuji 5th Station',
          description:
            'Ascend 2,300 meters above sea level to the slopes of Japan’s sacred snowcapped volcano for breathtaking cloud ocean panoramas.',
        },
        {
          time: 'Afternoon',
          title: 'Lake Kawaguchiko Cruise & Oishi Park',
          description:
            'Cruise the calm waters of Lake Kawaguchiko and stroll purple lavender paths with postcard reflections of Mt. Fuji.',
        },
        {
          time: 'Evening',
          title: 'Traditional Ryokan Stay & Kaiseki Banquet',
          description:
            'Don traditional yukata robes for a multicourse seasonal Kaiseki banquet, followed by a deeply restorative soak in mineral hot springs.',
        },
      ],
      meals: { breakfast: true, lunch: true, dinner: true },
      stay: 'Fuji View Ryokan & Onsen Resort',
      insiderTip:
        'Remember to wash thoroughly before entering the hot spring waters—onsen etiquette is an ancient tradition.',
    },
    {
      day: 4,
      title: 'Hakone Volcanic Valley & Bullet Train Return',
      subtitle: 'Owakudani Ropeway & Lake Ashi Pirate Cruise',
      location: 'Hakone → Tokyo',
      activities: [
        {
          time: 'Morning',
          title: 'Hakone Ropeway over Bubbling Volcanic Geysers',
          description:
            'Glide over the sulfur vents of Owakudani. Taste the famous Kuro-tamago (black eggs) boiled in volcanic spring waters.',
        },
        {
          time: 'Afternoon',
          title: 'Lake Ashi Cruise & Torii Gate of Hakone Jinja',
          description:
            'Sail on a panoramic lake galleon, photographing the vermilion torii water gate standing gracefully along the lake shore.',
        },
        {
          time: 'Evening',
          title: '300 km/h Shinkansen Bullet Train Experience',
          description:
            'Board the world-famous Shinkansen bullet train back to Tokyo, gliding smoothly through the countryside in whisper-quiet comfort.',
        },
      ],
      meals: { breakfast: true, lunch: true, dinner: false },
      stay: 'Tokyo Luxury Bay Hotel',
      insiderTip:
        'Sit on the right side of the Shinkansen returning to Tokyo for one final glance at Mt. Fuji.',
    },
    {
      day: 5,
      title: 'Meiji Shrine, Ginza Glamour & Tokyo Bay Cruise',
      subtitle: 'Imperial Serenity & Lantern Boat Dining',
      location: 'Ginza & Tokyo Bay',
      activities: [
        {
          time: 'Morning',
          title: 'Meiji Jingu Shrine Cypress Forest Walk',
          description:
            'Enter towering wooden torii gates into 170 acres of tranquil sacred forest in the center of Harajuku.',
        },
        {
          time: 'Afternoon',
          title: 'Ginza Luxury Boutiques & Depachika Gourmet',
          description:
            'Explore world-renowned department store food halls (Depachika) with artisanal matcha sweets and square watermelons.',
        },
        {
          time: 'Evening',
          title: 'Yakatabune Traditional Dinner Cruise',
          description:
            'Savor freshly fried tempura and cold sake aboard an illuminated lantern boat floating beneath the Rainbow Bridge.',
        },
      ],
      meals: { breakfast: true, lunch: false, dinner: true },
      stay: 'Tokyo Luxury Bay Hotel',
      insiderTip:
        'Try the seasonal matcha parfaits at Ginza Six before heading to the evening boat cruise.',
    },
    {
      day: 6,
      title: 'Farewell Tokyo & Departure',
      subtitle: 'Souvenir Boutiques & Airport Chauffeur',
      location: 'Tokyo → Haneda / Narita Airport',
      activities: [
        {
          time: 'Morning',
          title: 'Leisurely Breakfast & Last-Minute Discoveries',
          description:
            'Enjoy a final Japanese breakfast of grilled salmon, miso soup, and tamagoyaki with time for tax-free shopping.',
        },
        {
          time: 'Afternoon',
          title: 'Private Chauffeur Airport Transfer',
          description:
            'Comfortable private executive transfer to the airport with priority check-in assistance for your departure journey.',
        },
      ],
      meals: { breakfast: true, lunch: false, dinner: false },
      stay: 'Departure Flight',
      insiderTip:
        'Tokyo airports have fantastic duty-free confectionary shops for Tokyo Banana and Royce nama chocolates.',
    },
  ],

  maldives: [
    {
      day: 1,
      title: 'Arrival in Paradise & Seaplane Flight',
      subtitle: 'Aerial Atoll Vistas & Villa Check-in',
      location: 'Male Airport → South Ari Atoll',
      activities: [
        {
          time: 'Morning',
          title: 'VIP Seaplane Lounge Reception',
          description:
            'Greeting at Velana International Airport and transfer to the private resort lounge with chilled champagne and refreshments.',
        },
        {
          time: 'Afternoon',
          title: 'Scenic 25-Minute Aerial Seaplane Transfer',
          description:
            'Soar above ring-shaped turquoise atolls, sandbanks, and coral lagoons before touching down beside your private island resort.',
        },
        {
          time: 'Evening',
          title: 'Overwater Pool Villa Check-in & Butler Intro',
          description:
            'Step onto the wooden boardwalks to your private Overwater Villa featuring an infinity plunge pool, glass floor panels, and 24-hr butler service.',
        },
      ],
      meals: { breakfast: false, lunch: false, dinner: true },
      stay: 'Luxury Overwater Pool Villa, South Ari Atoll',
      insiderTip:
        'Have your phone or camera handy on the seaplane—the aerial view of the Maldives atolls is iconic.',
    },
    {
      day: 2,
      title: 'Floating Breakfast & Coral Reef Snorkel Safari',
      subtitle: 'Marine Wildlife & Sunset Dolphin Cruise',
      location: 'Resort House Reef & Outer Atoll',
      activities: [
        {
          time: 'Morning',
          title: 'Signature Champagne Floating Breakfast',
          description:
            'Awaken to a luxurious teak tray floating in your private plunge pool loaded with fresh pastries, tropical fruits, and champagne.',
        },
        {
          time: 'Afternoon',
          title: 'Guided Snorkel Safari with Resident Biologist',
          description:
            'Encounter vibrant clownfish, harmless reef sharks, and gliding manta rays along the coral drop-off of the house reef.',
        },
        {
          time: 'Evening',
          title: 'Sunset Dolphin Champagne Catamaran Cruise',
          description:
            'Sail into the golden sunset while pods of wild spinner dolphins leap through the bow waves around your vessel.',
        },
      ],
      meals: { breakfast: true, lunch: true, dinner: true },
      stay: 'Luxury Overwater Pool Villa',
      insiderTip:
        'Use reef-safe sunscreen provided in your villa to protect the fragile coral ecosystem.',
    },
    {
      day: 3,
      title: 'Overwater Spa Sanctuary & Sandbank Dining',
      subtitle: 'Holistic Wellness & Starlight Dinner',
      location: 'Resort Lagoon & Private Sandbank',
      activities: [
        {
          time: 'Morning',
          title: 'Ocean-View Spa Pavilion Treatment',
          description:
            'Indulge in a 90-minute signature coconut oil and pearl powder massage while watching tropical fish through glass treatment room floors.',
        },
        {
          time: 'Afternoon',
          title: 'Crystal Kayaking & Stand-Up Paddleboarding',
          description:
            'Glide silently across calm turquoise lagoons in transparent canoes that allow seamless viewing of the sea life below.',
        },
        {
          time: 'Evening',
          title: 'Private Sandbank Candlelight Seafood Feast',
          description:
            'A castaway dining experience set on an isolated white sandbank illuminated by 50 tiki torches beneath a blanket of southern stars.',
        },
      ],
      meals: { breakfast: true, lunch: true, dinner: true },
      stay: 'Luxury Overwater Pool Villa',
      insiderTip:
        'The sandbank experience can be tailored with your choice of lobster, wagyu, or vegetarian culinary themes.',
    },
    {
      day: 4,
      title: 'Deep Sea Fishing, Sunset Yoga & Beach Cinema',
      subtitle: 'Lagoon Adventures & Cinema Under the Stars',
      location: 'Private Island Sanctuary',
      activities: [
        {
          time: 'Morning',
          title: 'Big Game or Traditional Maldivian Handline Fishing',
          description:
            'Experience traditional Maldivian fishing aboard a wooden dhoni craft, with the chef preparing your fresh catch for lunch.',
        },
        {
          time: 'Afternoon',
          title: 'Complimentary Palm-Shaded Island Biking',
          description:
            'Pedal along quiet white-sand pathways beneath swaying palms to explore the organic garden and orchid house.',
        },
        {
          time: 'Evening',
          title: 'Private Open-Air Beach Cinema Screening',
          description:
            'Sink into plush beanbags on the sand with artisan popcorn and cocktails for a private movie screening under the tropical night sky.',
        },
      ],
      meals: { breakfast: true, lunch: true, dinner: true },
      stay: 'Luxury Overwater Pool Villa',
      insiderTip:
        'Request your favorite movie choice through your butler by noon on Day 4.',
    },
    {
      day: 5,
      title: 'Reef Conservation & Seaplane Departure',
      subtitle: 'Coral Planting & International Flights',
      location: 'South Ari Atoll → Male Airport',
      activities: [
        {
          time: 'Morning',
          title: 'Personalized Coral Adoption Program',
          description:
            'Attach a living coral fragment with your name tag to a nursery frame with the marine biology team to support ocean restoration.',
        },
        {
          time: 'Afternoon',
          title: 'Scenic Return Seaplane to Male Airport',
          description:
            'Bid farewell to your island hosts and board your afternoon seaplane back to Male for onward international flight connections.',
        },
      ],
      meals: { breakfast: true, lunch: false, dinner: false },
      stay: 'Departure Flight',
      insiderTip:
        'You can track the growth of your adopted coral online via photo updates sent twice a year by the resort.',
    },
  ],

  switzerland: [
    {
      day: 1,
      title: 'Zurich Arrival & Glacier Train to Zermatt',
      subtitle: 'First-Class Scenic Alpine Transit',
      location: 'Zurich Airport → Zermatt',
      activities: [
        {
          time: 'Morning',
          title: 'Swiss Airport Greeting & First-Class Rail Pass',
          description:
            'Welcome greeting at Zurich International Airport with your Swiss Travel Pass and direct luxury transfer to the scenic alpine rail.',
        },
        {
          time: 'Afternoon',
          title: 'Glacier Express Route into Valais Valleys',
          description:
            'Panoramic train journey winding through the Rhone Valley into the car-free mountain haven of Zermatt.',
        },
        {
          time: 'Evening',
          title: 'Alpine Chalet Check-in & Fireside Fondue',
          description:
            'Arrive by electric horse carriage at your luxury alpine chalet hotel with direct views of the iconic Matterhorn peak.',
        },
      ],
      meals: { breakfast: false, lunch: false, dinner: true },
      stay: 'The Omnia / Mont Cervin Palace Zermatt',
      insiderTip:
        'Zermatt is strictly car-free; electric e-taxis and horse carriages provide quiet and charming transport.',
    },
    {
      day: 2,
      title: 'Gornergrat Cogwheel & Matterhorn Glacier Paradise',
      subtitle: '3,089m Summits & Ice Palaces',
      location: 'Gornergrat & Matterhorn Glacier',
      activities: [
        {
          time: 'Morning',
          title: 'Historic Gornergrat Cogwheel Railway',
          description:
            'Climb Europe’s highest open-air cogwheel train to Gornergrat summit facing 29 majestic four-thousand-meter Alpine peaks.',
        },
        {
          time: 'Afternoon',
          title: 'Matterhorn Glacier Paradise Ice Palace',
          description:
            'Take Europe’s highest cable car to 3,883 meters and walk through shimmering crystal ice tunnels and ice sculptures.',
        },
        {
          time: 'Evening',
          title: 'Swiss Alpine Dining & Thermal Wellness Spa',
          description:
            'Unwind tired muscles in an outdoor cedar hot tub facing the snowfields, followed by aged Swiss beef steaks and Valais wines.',
        },
      ],
      meals: { breakfast: true, lunch: true, dinner: true },
      stay: 'The Omnia / Mont Cervin Palace Zermatt',
      insiderTip:
        'Keep sunglasses on hand; alpine snow reflections at 3,800m are intensely bright even on overcast days.',
    },
    {
      day: 3,
      title: 'Private Helicopter Alps Safari & Gourmet Meadow Picnic',
      subtitle: 'Matterhorn Summit Ridge Flights',
      location: 'Zermatt Air Space & High Valleys',
      activities: [
        {
          time: 'Morning',
          title: 'Private Helicopter Flight over Matterhorn Peak',
          description:
            'Soar within meters of the rugged granite arêtes and hanging glaciers of the Matterhorn and Monte Rosa massif.',
        },
        {
          time: 'Afternoon',
          title: 'Alpine Meadow Cheese & Wine Picnic',
          description:
            'Touch down for a curated picnic of artisanal Gruyère, fresh mountain rye bread, and local cured air-dried meats.',
        },
        {
          time: 'Evening',
          title: 'Stroll Old Zermatt Historic Wooden Barns',
          description:
            'Explore 16th-century larch-wood chalets built on flat slate stones to keep grain safe from mountain marmots.',
        },
      ],
      meals: { breakfast: true, lunch: true, dinner: true },
      stay: 'The Omnia / Mont Cervin Palace Zermatt',
      insiderTip:
        'Helicopter flights are best scheduled in the early morning for ultra-smooth air currents.',
    },
    {
      day: 4,
      title: 'Jungfraujoch: Top of Europe & Interlaken Lakes',
      subtitle: 'Eiger Express & Sphinx Observatory',
      location: 'Zermatt → Interlaken & Grindelwald',
      activities: [
        {
          time: 'Morning',
          title: 'Scenic Train to Interlaken & Eiger Express',
          description:
            'Journey between emerald Lake Thun and Lake Brienz, then board the high-tech tri-cable Eiger Express gondola.',
        },
        {
          time: 'Afternoon',
          title: 'Sphinx Observatory at Jungfraujoch (3,454m)',
          description:
            'Stand atop the highest train station in Europe overlooking the 22km Aletsch Glacier, a UNESCO World Natural Heritage site.',
        },
        {
          time: 'Evening',
          title: 'Lakeside Grand Hotel Dining in Interlaken',
          description:
            'Check in to Victoria-Jungfrau Grand Hotel with elegant French-Swiss fusion dining overlooking the paragliders landing on the meadow.',
        },
      ],
      meals: { breakfast: true, lunch: true, dinner: true },
      stay: 'Victoria-Jungfrau Grand Hotel & Spa Interlaken',
      insiderTip:
        'Drink plenty of spring water at high altitude to prevent slight headaches at 3,454m.',
    },
    {
      day: 5,
      title: 'Lake Lucerne Steamship & Mount Pilatus Dragon Ride',
      subtitle: 'Steamboats, Cogwheels & Chocolate Masterclass',
      location: 'Interlaken → Lucerne',
      activities: [
        {
          time: 'Morning',
          title: 'Scenic GoldenPass Express to Historic Lucerne',
          description:
            'Travel along five turquoise mountain lakes through the Brunig Pass into the medieval city of Lucerne.',
        },
        {
          time: 'Afternoon',
          title: 'Historic Paddle Steamer & Mt Pilatus Cogwheel',
          description:
            'Cruise Lake Lucerne on a vintage Belle Époque steamship, then climb the world’s steepest cogwheel railway (48% gradient).',
        },
        {
          time: 'Evening',
          title: 'Exclusive Swiss Chocolate Tasting & Farewell Banquet',
          description:
            'Private masterclass with a master chocolatier, crafting bespoke truffles followed by an unforgettable farewell dinner.',
        },
      ],
      meals: { breakfast: true, lunch: true, dinner: true },
      stay: 'Bürgenstock Hotel & Alpine Spa Lucerne',
      insiderTip:
        'The Bürgenstock infinity pool offers an unbelievable 500-meter sheer drop view straight down to Lake Lucerne.',
    },
    {
      day: 6,
      title: 'Lucerne Chapel Bridge & Zurich Departure',
      subtitle: '14th-Century Heritage & Flight Departure',
      location: 'Lucerne → Zurich Airport',
      activities: [
        {
          time: 'Morning',
          title: 'Stroll Across 14th-Century Wooden Chapel Bridge',
          description:
            'Walk the flower-covered Kapellbrücke and visit the poignant Lion Monument carved into living sandstone.',
        },
        {
          time: 'Afternoon',
          title: 'Direct First-Class Rail to Zurich Airport',
          description:
            'Express 50-minute train directly inside Zurich Airport terminal for smooth departure flights home.',
        },
      ],
      meals: { breakfast: true, lunch: false, dinner: false },
      stay: 'Departure Flight',
      insiderTip:
        'Luggage can be checked in directly at Lucerne train station straight through to your final flight destination.',
    },
  ],

  thailand: [
    {
      day: 1,
      title: 'Arrival in Phuket & Andaman Sunset',
      subtitle: 'VIP Transfer & Cliffside Villa',
      location: 'Phuket International Airport → Kata / Kamala',
      activities: [
        {
          time: 'Morning',
          title: 'Private Chauffeur Airport Greeting',
          description:
            'Meet your dedicated driver at Phuket Airport with refreshing lemongrass towels and transfer to your luxury cliffside resort.',
        },
        {
          time: 'Afternoon',
          title: 'Check-in to Andaman Sea View Pool Villa',
          description:
            'Settle into your spacious oceanfront villa featuring private infinity pool, teak sundeck, and panoramic Andaman vistas.',
        },
        {
          time: 'Evening',
          title: 'Sunset Welcome Cocktails & Royal Thai Dining',
          description:
            'Enjoy chilled sundowners on the rocks followed by authentic Southern Thai specialties with fresh seafood and aromatic herbs.',
        },
      ],
      meals: { breakfast: false, lunch: false, dinner: true },
      stay: 'Kata Rocks / Trisara Phuket',
      insiderTip: 'Kata Rocks terrace is world-famous for dramatic golden hour sunset photography.',
    },
    {
      day: 2,
      title: 'Private Catamaran Charter to Phang Nga Bay',
      subtitle: 'James Bond Island & Sea Cave Kayaking',
      location: 'Phang Nga Bay Marine National Park',
      activities: [
        {
          time: 'Morning',
          title: 'Sail Past Soaring Limestone Karsts',
          description:
            'Board a private luxury catamaran charter gliding through emerald waters dotted with hundreds of dramatic limestone monoliths.',
        },
        {
          time: 'Afternoon',
          title: 'Guided Sea Cave Canoeing in Hong Island',
          description:
            'Glide silently in inflatable canoes through narrow limestone cave tunnels into hidden enclosed mangrove lagoons.',
        },
        {
          time: 'Evening',
          title: 'Gourmet Seafood Barbecue on Board',
          description:
            'Anchor in a secluded turquoise cove for freshly grilled Andaman tiger prawns, tropical salads, and chilled prosecco.',
        },
      ],
      meals: { breakfast: true, lunch: true, dinner: true },
      stay: 'Kata Rocks / Trisara Phuket',
      insiderTip:
        'Bring a waterproof pouch for your smartphone when entering the sea caves.',
    },
    {
      day: 3,
      title: 'Phi Phi Islands & Maya Bay Crystal Waters',
      subtitle: 'Early Morning Speedboat & Snorkel Safari',
      location: 'Phi Phi Don & Phi Phi Leh',
      activities: [
        {
          time: 'Morning',
          title: 'Early Arrival at Legendary Maya Bay',
          description:
            'Arrive at Maya Bay before the day-tripper boats to experience the pristine white sands and towering cliffs in serene silence.',
        },
        {
          time: 'Afternoon',
          title: 'Snorkel Coral Reefs at Pileh Lagoon',
          description:
            'Swim in 28°C crystal turquoise waters surrounded by vertical 100-meter karst cliffs and colorful butterfly fish.',
        },
        {
          time: 'Evening',
          title: 'Relaxing Evening at Resort Beach Club',
          description:
            'Return to your villa resort for acoustic live music, beachfront fire dancers, and handcrafted tropical cocktails.',
        },
      ],
      meals: { breakfast: true, lunch: true, dinner: false },
      stay: 'Kata Rocks / Trisara Phuket',
      insiderTip:
        'Swimming in Maya Bay itself is prohibited to protect baby reef sharks, but walking along the sand is unforgettable.',
    },
    {
      day: 4,
      title: 'Ethical Elephant Sanctuary & Sino-Portuguese Heritage',
      subtitle: 'Conservation & Old Phuket Town',
      location: 'Phuket Nature Reserve & Old Town',
      activities: [
        {
          time: 'Morning',
          title: 'Ethical Elephant Walk & Hydro-Mud Spa',
          description:
            'Walk alongside rescued elephants roaming freely in natural jungle reserves, assisting with their morning fruit feeding.',
        },
        {
          time: 'Afternoon',
          title: 'Historic Old Phuket Town Heritage Walk',
          description:
            'Explore colorful 19th-century Sino-Portuguese shophouses, boutique art galleries, and hidden courtyard cafes.',
        },
        {
          time: 'Evening',
          title: 'Michelin Bib Gourmand Street Food Tour',
          description:
            'Taste Hokkien noodles, crispy roti pancakes, and mango sticky rice with a passionate local foodie guide.',
        },
      ],
      meals: { breakfast: true, lunch: true, dinner: true },
      stay: 'Kata Rocks / Trisara Phuket',
      insiderTip:
        'Wear shoes that can get muddy at the sanctuary—water boots are also provided on site.',
    },
    {
      day: 5,
      title: 'Royal Thai Herbal Spa & Cooking Masterclass',
      subtitle: 'Organic Garden Harvest & Wellness',
      location: 'Resort Culinary Pavilion & Spa',
      activities: [
        {
          time: 'Morning',
          title: 'Organic Garden Tour & Thai Cooking Masterclass',
          description:
            'Pick fresh galangal, kaffir lime, and lemongrass to pound your own authentic green curry paste alongside a master chef.',
        },
        {
          time: 'Afternoon',
          title: '2-Hour Royal Thai Herbal Compress Massage',
          description:
            'Warm steamed herbal compresses infused with camphor and turmeric applied to relieve all muscle tension.',
        },
        {
          time: 'Evening',
          title: 'Candlelight Farewell Beach Dinner',
          description:
            'A romantic table set on the private beach with a 5-course tasting menu and illuminated floating sky lanterns.',
        },
      ],
      meals: { breakfast: true, lunch: true, dinner: true },
      stay: 'Kata Rocks / Trisara Phuket',
      insiderTip:
        'You will receive a printed recipe booklet and spice kit to take home.',
    },
    {
      day: 6,
      title: 'Tropical Breakfast & Airport Farewell',
      subtitle: 'Leisure Morning & Flight Transfer',
      location: 'Phuket → Departure Flight',
      activities: [
        {
          time: 'Morning',
          title: 'Leisurely Breakfast & Infinity Pool Swim',
          description:
            'Savor a final breakfast of fresh mangoes, passion fruit, and tropical smoothies overlooking the morning sea.',
        },
        {
          time: 'Afternoon',
          title: 'Private Chauffeur to Phuket Airport',
          description:
            'Luggage assistance and direct executive transfer to the international departure terminal.',
        },
      ],
      meals: { breakfast: true, lunch: false, dinner: false },
      stay: 'Departure Flight',
      insiderTip:
        'Phuket airport has excellent local cashew nut boutique shops for last-minute gifts.',
    },
  ],

  bali: [
    {
      day: 1,
      title: 'Arrival in Bali & Rainforest Sanctuary',
      subtitle: 'VIP Meet & Ubud Jungle Check-in',
      location: 'Ngurah Rai Airport → Ubud',
      activities: [
        {
          time: 'Morning',
          title: 'Traditional Frangipani Garland Welcome',
          description:
            'VIP airport greeting with fresh floral frangipani leis and private air-conditioned transfer into the lush highlands of Ubud.',
        },
        {
          time: 'Afternoon',
          title: 'Rainforest Pool Villa Check-in',
          description:
            'Arrive at your jungle sanctuary surrounded by misty river ravines, swaying bamboo groves, and singing birds.',
        },
        {
          time: 'Evening',
          title: 'Welcome Organic Dinner Overlooking the Valley',
          description:
            'Dine on farm-to-table Balinese dishes prepared with organic produce harvested straight from the resort’s gardens.',
        },
      ],
      meals: { breakfast: false, lunch: false, dinner: true },
      stay: 'Kamandalu Ubud / Viceroy Bali',
      insiderTip:
        'Ubud evenings can be cool and breezy—bring a light shawl for open-air dinners.',
    },
    {
      day: 2,
      title: 'Tegallalang Rice Terraces & Water Temple Blessing',
      subtitle: 'Spiritual Heritage & Emerald Valleys',
      location: 'Ubud & Tirta Empul',
      activities: [
        {
          time: 'Morning',
          title: 'Sunrise Walk through Tegallalang Terraces',
          description:
            'Walk the ancient Subak irrigation rice terraces in the quiet morning light before day visitors arrive.',
        },
        {
          time: 'Afternoon',
          title: 'Purification Water Blessing at Tirta Empul',
          description:
            'Participate in a centuries-old Melukat cleansing ritual in the holy spring waters with a local priest and sarong blessing.',
        },
        {
          time: 'Evening',
          title: 'Balinese Legong Dance & Royal Feast',
          description:
            'Watch the intricate finger movements and expressive eyes of Balinese Legong dancers at Ubud Royal Palace.',
        },
      ],
      meals: { breakfast: true, lunch: true, dinner: true },
      stay: 'Kamandalu Ubud / Viceroy Bali',
      insiderTip:
        'Bring a change of dry clothes for after the Tirta Empul water ritual.',
    },
    {
      day: 3,
      title: 'Mount Batur 4x4 Sunrise Jeep & Luwak Coffee',
      subtitle: 'Volcanic Calderas & Artisan Roasteries',
      location: 'Kintamani & Mount Batur',
      activities: [
        {
          time: 'Morning',
          title: 'Open-Top 4x4 Jeep Sunrise at Mount Batur',
          description:
            'Cruise across black lava fields in an open-top vintage jeep to watch the fiery sunrise above the sea of clouds.',
        },
        {
          time: 'Afternoon',
          title: 'Artisanal Coffee & Vanilla Plantation Tasting',
          description:
            'Taste freshly roasted Balinese single-origin coffees, herbal ginger teas, and cocoa overlooking deep tropical ravines.',
        },
        {
          time: 'Evening',
          title: 'Traditional Balinese Flower Bath Spa',
          description:
            'Soak in an expansive stone bath filled with thousands of scarlet rose and marigold petals accompanied by lemongrass tea.',
        },
      ],
      meals: { breakfast: true, lunch: true, dinner: false },
      stay: 'Kamandalu Ubud / Viceroy Bali',
      insiderTip:
        'The vintage jeep safari avoids the tiring 2-hour uphill trek while giving the exact same breathtaking views.',
    },
    {
      day: 4,
      title: 'Transfer to Uluwatu & Sunset Kecak Fire Dance',
      subtitle: 'Cliffside Ocean Vistas & Ancient Rhythms',
      location: 'Ubud → Uluwatu Cliffs',
      activities: [
        {
          time: 'Morning',
          title: 'Scenic Transfer South to the Bukit Peninsula',
          description:
            'Drive to the limestone cliffs of Uluwatu and check into your luxury cliffside pool villa towering 100 meters above crashing surf.',
        },
        {
          time: 'Afternoon',
          title: 'Leisure & Private Infinity Plunge Pool',
          description:
            'Swim to the edge of your infinity pool overlooking the endless Indian Ocean with views of peeling surf waves.',
        },
        {
          time: 'Evening',
          title: 'Kecak Fire Dance at Cliffside Uluwatu Temple',
          description:
            'Witness 50 chanting Balinese men performing the dramatic Ramayana epic as the orange sun sinks into the sea.',
        },
      ],
      meals: { breakfast: true, lunch: false, dinner: true },
      stay: 'Alila Villas Uluwatu / Bulgari Resort',
      insiderTip:
        'Watch out for the curious resident monkeys around Uluwatu Temple—keep sunglasses and hats in your bag.',
    },
    {
      day: 5,
      title: 'Private Yacht to Nusa Penida & Jimbaran Seafood',
      subtitle: 'Kelingking T-Rex Beach & Barefoot Dining',
      location: 'Nusa Penida & Jimbaran Bay',
      activities: [
        {
          time: 'Morning',
          title: 'Private Yacht Charter to Nusa Penida',
          description:
            'Sail to the dramatic Kelingking T-Rex cliff and swim with graceful giant manta rays in Crystal Bay.',
        },
        {
          time: 'Afternoon',
          title: 'Angel’s Billabong & Broken Beach Vistas',
          description:
            'Marvel at the natural limestone bridge and infinity tide pools carved by ocean waves over millennia.',
        },
        {
          time: 'Evening',
          title: 'Candlelight Seafood Barbecue on Jimbaran Sand',
          description:
            'Dine barefoot on the beach with grilled lobster, red snapper, and spicy sambal as acoustic guitar serenades your table.',
        },
      ],
      meals: { breakfast: true, lunch: true, dinner: true },
      stay: 'Alila Villas Uluwatu / Bulgari Resort',
      insiderTip:
        'Jimbaran tables fill quickly at dusk; our concierge reserves front-row ocean tables for your dinner.',
    },
    {
      day: 6,
      title: 'Tropical Farewell & Airport Departure',
      subtitle: 'Leisure Morning & Executive Transfer',
      location: 'Uluwatu → Denpasar Airport',
      activities: [
        {
          time: 'Morning',
          title: 'Final Floating Breakfast or Ocean Meditation',
          description:
            'Enjoy fresh dragon fruit, artisan toast, and espresso served over your infinity pool with a panoramic ocean horizon.',
        },
        {
          time: 'Afternoon',
          title: 'Executive Chauffeur to Ngurah Rai Airport',
          description:
            'Luggage assistance and express transit to the international departures hall with fond memories of Bali.',
        },
      ],
      meals: { breakfast: true, lunch: false, dinner: false },
      stay: 'Departure Flight',
      insiderTip:
        'Pack any delicate Balinese wood carvings or paintings in your carry-on luggage for safety.',
    },
  ],
};

// Universal Dynamic Itinerary Generator for any custom package
function generateDynamicItinerary(pkg: ApiPackage): ItineraryDay[] {
  // Parse days from duration string (e.g. "5 Days - 4 Nights", "6 Days / 5 Nights", "7 Days")
  const match = pkg.duration.match(/(\d+)\s*Days?/i);
  const totalDays = match ? Math.min(Math.max(parseInt(match[1], 10), 3), 10) : 5;

  const dest = pkg.destination || 'Destination';
  const country = pkg.country || pkg.destination || 'Region';
  const days: ItineraryDay[] = [];

  for (let i = 1; i <= totalDays; i++) {
    if (i === 1) {
      days.push({
        day: 1,
        title: `Arrival & VIP Welcome to ${dest}`,
        subtitle: 'Executive Airport Greeting & Hotel Check-in',
        location: `${country} · Arrival Gateway`,
        activities: [
          {
            time: 'Morning',
            title: `VIP Airport Greeting & Private Chauffeur`,
            description: `Arrive in ${country} with personalized luggage handling, refreshing welcome beverages, and executive transfer.`,
          },
          {
            time: 'Afternoon',
            title: `Luxury Hotel Check-in & Relaxation`,
            description: `Check into your curated boutique accommodations, unwind from your journey, and explore the resort grounds.`,
          },
          {
            time: 'Evening',
            title: `Welcome Dinner & Itinerary Briefing`,
            description: `Enjoy a welcome dinner featuring signature regional specialties with your concierge host reviewing upcoming highlights.`,
          },
        ],
        meals: { breakfast: false, lunch: false, dinner: true },
        stay: `Luxury Boutique Resort & Spa, ${dest}`,
        insiderTip: `Get a restful first night's sleep to acclimate comfortably for tomorrow's explorations.`,
      });
    } else if (i === totalDays) {
      days.push({
        day: totalDays,
        title: `Farewell ${dest} & Return Journey`,
        subtitle: 'Leisure Morning & Executive Airport Transfer',
        location: `${dest} → Departure Terminal`,
        activities: [
          {
            time: 'Morning',
            title: `Leisurely Breakfast & Souvenir Shopping`,
            description: `Savor a tranquil morning breakfast with time for boutique local crafts and duty-free souvenir browsing.`,
          },
          {
            time: 'Afternoon',
            title: `Executive Transfer to Departure Airport`,
            description: `Comfortable chauffeured transit to the international departure hall with full luggage assistance.`,
          },
        ],
        meals: { breakfast: true, lunch: false, dinner: false },
        stay: 'Departure Flight / Extension Option',
        insiderTip: `Our concierge team is available to assist with onward flights or destination extensions.`,
      });
    } else if (i === 2) {
      days.push({
        day: i,
        title: `Signature Heritage & Cultural Highlights of ${dest}`,
        subtitle: `Private Guided Exploration`,
        location: `${dest} · Historic Center`,
        activities: [
          {
            time: 'Morning',
            title: `Historic Landmarks & Guided Walking Tour`,
            description: `Explore iconic cultural monuments, ancient architecture, and UNESCO World Heritage sanctuaries with an expert guide.`,
          },
          {
            time: 'Afternoon',
            title: `Artisanal Regional Culinary Tasting`,
            description: `Delight your palate with authentic regional cuisine at a handpicked local restaurant away from the tourist crowds.`,
          },
          {
            time: 'Evening',
            title: `Sunset Viewpoint & Cultural Performance`,
            description: `Watch the sunset from a premier panoramic viewpoint, followed by traditional music and regional storytelling.`,
          },
        ],
        meals: { breakfast: true, lunch: true, dinner: true },
        stay: `Luxury Boutique Resort & Spa, ${dest}`,
        insiderTip: `Wear comfortable walking shoes and bring your camera for iconic historic viewpoints.`,
      });
    } else if (i === 3) {
      days.push({
        day: i,
        title: `Scenic Excursions & Nature Exploration`,
        subtitle: `Landscape Safari & Active Discovery`,
        location: `${dest} · Countryside & Wilderness`,
        activities: [
          {
            time: 'Morning',
            title: `Scenic Nature Excursion or Wildlife Safari`,
            description: `Embark on an outdoor adventure discovering pristine valleys, lakes, coastlines, or protected wildlife reserves.`,
          },
          {
            time: 'Afternoon',
            title: `Picnic Lunch in Nature & Photography Walk`,
            description: `Enjoy an artisan picnic prepared with local ingredients in a scenic lookout spot.`,
          },
          {
            time: 'Evening',
            title: `Restorative Spa Treatment & Leisure`,
            description: `Return to the resort for an herbal botanical massage or peaceful relaxation beside the pool.`,
          },
        ],
        meals: { breakfast: true, lunch: true, dinner: true },
        stay: `Luxury Boutique Resort & Spa, ${dest}`,
        insiderTip: `Pack sun protection and a light rain jacket for changing mountain or coastal weather.`,
      });
    } else {
      days.push({
        day: i,
        title: `Authentic Local Living & Bespoke Experiences`,
        subtitle: `Artisanal Crafts, Markets & Hidden Gems`,
        location: `${dest} · Artisan District`,
        activities: [
          {
            time: 'Morning',
            title: `Local Masterclass or Artisan Workshop`,
            description: `Engage directly with master local artisans, tea growers, or chefs for an intimate cultural exchange.`,
          },
          {
            time: 'Afternoon',
            title: `Free Exploration & Boutique Shopping`,
            description: `Personalized leisure time with curated recommendations from your concierge for hidden boutiques and cafes.`,
          },
          {
            time: 'Evening',
            title: `Chef’s Tasting Menu Under the Stars`,
            description: `An unforgettable fine-dining evening paired with sommelier-selected local beverages.`,
          },
        ],
        meals: { breakfast: true, lunch: true, dinner: true },
        stay: `Luxury Boutique Resort & Spa, ${dest}`,
        insiderTip: `Ask your guide for their favorite neighborhood bakery or coffee spot for a delightful midday pause.`,
      });
    }
  }

  return days;
}

// Resolver that picks curated itinerary or fallback dynamic
export function getPackageItinerary(pkg: ApiPackage): ItineraryDay[] {
  const query = `${pkg.destination} ${pkg.title} ${pkg.country}`.toLowerCase();

  if (query.includes('sri lanka') || query.includes('sigiriya')) {
    return CURATED_ITINERARIES['sri lanka'];
  }
  if (query.includes('japan') || query.includes('tokyo') || query.includes('fuji') || query.includes('kyoto')) {
    return CURATED_ITINERARIES['japan'];
  }
  if (query.includes('maldives')) {
    return CURATED_ITINERARIES['maldives'];
  }
  if (query.includes('switzer') || query.includes('zermatt') || query.includes('alpine') || query.includes('swiss')) {
    return CURATED_ITINERARIES['switzerland'];
  }
  if (query.includes('thailand') || query.includes('phuket')) {
    return CURATED_ITINERARIES['thailand'];
  }
  if (query.includes('bali') || query.includes('indonesia')) {
    return CURATED_ITINERARIES['bali'];
  }

  return generateDynamicItinerary(pkg);
}

interface PackageItineraryModalProps {
  packageData: ApiPackage | null;
  isOpen: boolean;
  onClose: () => void;
  onBookNow: (pkg: ApiPackage) => void;
}

export default function PackageItineraryModal({
  packageData,
  isOpen,
  onClose,
  onBookNow,
}: PackageItineraryModalProps) {
  const { formatPrice, currentCurrency } = useCurrency();
  const [selectedDayTab, setSelectedDayTab] = useState<number | 'all'>('all');
  const [copiedLink, setCopiedLink] = useState(false);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  // Reset tab when package changes
  useEffect(() => {
    setSelectedDayTab('all');
  }, [packageData?._id]);

  if (!isOpen || !packageData) return null;

  const itineraryDays = getPackageItinerary(packageData);
  const displayedDays =
    selectedDayTab === 'all'
      ? itineraryDays
      : itineraryDays.filter((d) => d.day === selectedDayTab);

  const handleShare = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const whatsappMessage = encodeURIComponent(
    `Hi GlobalVista VIP Concierge, I am interested in the day-by-day itinerary for "${packageData.title}" (${packageData.destination}, ${packageData.country}). Could you provide more details and availability?`
  );

  return (
    <div className="itineraryModalOverlay" onClick={onClose}>
      <div
        className="itineraryModal"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        {/* MODAL HEADER */}
        <div className="itineraryModalHeader">
          <div className="itineraryHeaderInfo">
            <div className="itineraryBadgeRow">
              <span className="itineraryTagBadge">
                <Compass size={13} />
                DAY-BY-DAY EXPEDITION ITINERARY
              </span>
              <span className="itineraryDurationBadge">
                <Clock3 size={13} />
                {packageData.duration}
              </span>
              <span className="itineraryCategoryBadge">
                {packageData.category || 'Luxury Odyssey'}
              </span>
            </div>

            <h2>{packageData.title}</h2>

            <p className="itineraryDestinationSubtitle">
              <MapPin size={14} />
              <span>
                {packageData.destination}, {packageData.country}
              </span>
              <span className="itineraryDotDivider">·</span>
              <span>Personalized Luxury Itinerary</span>
            </p>
          </div>

          <div className="itineraryHeaderActions">
            <button
              type="button"
              className="itineraryIconBtn"
              title="Share Itinerary"
              onClick={handleShare}
            >
              {copiedLink ? <Check size={16} color="#10b981" /> : <Share2 size={16} />}
            </button>
            <button
              type="button"
              className="itineraryIconBtn"
              title="Print Itinerary"
              onClick={handlePrint}
            >
              <Printer size={16} />
            </button>
            <button
              type="button"
              className="itineraryCloseBtn"
              aria-label="Close modal"
              onClick={onClose}
            >
              <X size={19} />
            </button>
          </div>
        </div>

        {/* QUICK STATS STRIP */}
        <div className="itineraryStatsStrip">
          <div className="itineraryStatItem">
            <span className="statLabel">Total Days</span>
            <strong className="statValue">
              <CalendarDays size={14} />
              {itineraryDays.length} Days Experience
            </strong>
          </div>
          <div className="itineraryStatItem">
            <span className="statLabel">Travel Pace</span>
            <strong className="statValue">
              <Sparkles size={14} />
              Curated Luxury & Leisure
            </strong>
          </div>
          <div className="itineraryStatItem">
            <span className="statLabel">Service Level</span>
            <strong className="statValue">
              <ShieldCheck size={14} />
              Private Guide & Concierge
            </strong>
          </div>
          <div className="itineraryStatItem">
            <span className="statLabel">Expedition Price</span>
            <strong className="statValue highlightPrice">
              {formatPrice(packageData.price)}
              <small> / person</small>
            </strong>
          </div>
        </div>

        {/* DAY SELECTOR TABS (STICKY) */}
        <div className="itineraryTabsBar">
          <div className="itineraryTabsScroll">
            <button
              type="button"
              className={`itineraryTabPill ${selectedDayTab === 'all' ? 'isActive' : ''}`}
              onClick={() => setSelectedDayTab('all')}
            >
              All Days ({itineraryDays.length})
            </button>

            {itineraryDays.map((d) => (
              <button
                key={d.day}
                type="button"
                className={`itineraryTabPill ${selectedDayTab === d.day ? 'isActive' : ''}`}
                onClick={() => setSelectedDayTab(d.day)}
              >
                Day {d.day < 10 ? `0${d.day}` : d.day}
              </button>
            ))}
          </div>
        </div>

        {/* TIMELINE BODY */}
        <div className="itineraryModalBody">
          <div className="itineraryTimeline">
            {displayedDays.map((dayItem) => (
              <article key={dayItem.day} className="itineraryDayCard">
                {/* TIMELINE CONNECTOR */}
                <div className="itineraryTimelineNode">
                  <div className="itineraryDayBadge">
                    <span>DAY</span>
                    <strong>{dayItem.day < 10 ? `0${dayItem.day}` : dayItem.day}</strong>
                  </div>
                  <div className="itineraryTimelineStem" />
                </div>

                {/* DAY CONTENT BOX */}
                <div className="itineraryDayContent">
                  <div className="itineraryDayHeader">
                    <div>
                      <span className="itineraryDayLoc">
                        <MapPin size={12} />
                        {dayItem.location}
                      </span>
                      <h3>{dayItem.title}</h3>
                      {dayItem.subtitle && (
                        <p className="itineraryDaySub">{dayItem.subtitle}</p>
                      )}
                    </div>
                  </div>

                  {/* TIME SLICES */}
                  <div className="itineraryTimeSlices">
                    {dayItem.activities.map((act, actIdx) => (
                      <div key={actIdx} className="itinerarySlice">
                        <div className="itinerarySliceTime">
                          {act.time === 'Morning' && <Sunrise size={13} className="timeIcon" />}
                          {act.time === 'Afternoon' && <Sun size={13} className="timeIcon" />}
                          {act.time === 'Evening' && <Moon size={13} className="timeIcon" />}
                          <span>{act.time}</span>
                        </div>
                        <div className="itinerarySliceBody">
                          <h4>{act.title}</h4>
                          <p>{act.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* DAY META (MEALS, STAY, TIP) */}
                  <div className="itineraryDayMeta">
                    {/* MEALS */}
                    <div className="itineraryMetaPill">
                      <Utensils size={13} />
                      <span className="metaLabel">Meals:</span>
                      <div className="mealTags">
                        <span className={`mealTag ${dayItem.meals.breakfast ? 'included' : 'excluded'}`}>
                          Breakfast {dayItem.meals.breakfast ? '✓' : '—'}
                        </span>
                        <span className={`mealTag ${dayItem.meals.lunch ? 'included' : 'excluded'}`}>
                          Lunch {dayItem.meals.lunch ? '✓' : '—'}
                        </span>
                        <span className={`mealTag ${dayItem.meals.dinner ? 'included' : 'excluded'}`}>
                          Dinner {dayItem.meals.dinner ? '✓' : '—'}
                        </span>
                      </div>
                    </div>

                    {/* STAY */}
                    <div className="itineraryMetaPill stayPill">
                      <BedDouble size={13} />
                      <span className="metaLabel">Stay:</span>
                      <strong className="stayValue">{dayItem.stay}</strong>
                    </div>

                    {/* INSIDER TIP */}
                    {dayItem.insiderTip && (
                      <div className="itineraryTipBanner">
                        <Lightbulb size={14} className="tipIcon" />
                        <div>
                          <strong>Concierge Insider Tip:</strong>
                          <span>{dayItem.insiderTip}</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </article>
            ))}
          </div>

          {/* INCLUSIONS & AMENITIES REASSURANCE */}
          {packageData.included && packageData.included.length > 0 && (
            <div className="itineraryInclusionsCard">
              <div className="inclusionsHeader">
                <Check size={18} className="checkGold" />
                <h4>Included Privileges in this Expedition</h4>
              </div>
              <div className="inclusionsGrid">
                {packageData.included.map((item, idx) => (
                  <div key={idx} className="inclusionItem">
                    <Check size={13} />
                    <span>{item}</span>
                  </div>
                ))}
                <div className="inclusionItem">
                  <Check size={13} />
                  <span>24/7 Dedicated Concierge Support</span>
                </div>
                <div className="inclusionItem">
                  <Check size={13} />
                  <span>VIP Baggage Handling & Chauffeur</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* MODAL FOOTER ACTIONS */}
        <div className="itineraryModalFooter">
          <div className="itineraryFooterPrice">
            <span>STARTING FROM</span>
            <div className="priceFigures">
              <strong>{formatPrice(packageData.price)}</strong>
              <small>{currentCurrency.code} / guest</small>
            </div>
          </div>

          <div className="itineraryFooterButtons">
            <a
              href={`https://wa.me/94770000000?text=${whatsappMessage}`}
              target="_blank"
              rel="noopener noreferrer"
              className="itineraryWhatsappBtn"
            >
              <FaWhatsapp size={15} />
              <span>Ask Concierge on WhatsApp</span>
            </a>

            <button
              type="button"
              className="itineraryBookBtn"
              onClick={() => {
                onClose();
                onBookNow(packageData);
              }}
            >
              <span>Book This Expedition</span>
              <ArrowRight size={15} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
