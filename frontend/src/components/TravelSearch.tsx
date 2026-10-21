'use client';

import { useState } from 'react';
import {
  Plane,
  Hotel,
  Car,
  Package,
  Compass,
  MapPin,
  CalendarDays,
  Users,
  Search
} from 'lucide-react';

const tabs = [
  { name: 'Flights', icon: Plane },
  { name: 'Hotels', icon: Hotel },
  { name: 'Cars', icon: Car },
  { name: 'Packages', icon: Package },
  { name: 'Experiences', icon: Compass }
];

export default function TravelSearch() {
  const [activeTab, setActiveTab] = useState('Packages');

  return (
    <div className="searchCard">
      <div className="searchTabs">
        {tabs.map(({ name, icon: Icon }) => (
          <button
            key={name}
            className={activeTab === name ? 'searchTab active' : 'searchTab'}
            onClick={() => setActiveTab(name)}
          >
            <Icon size={18} />
            {name}
          </button>
        ))}
      </div>

      <div className="searchFields">
        <div className="searchField">
          <MapPin size={20} />
          <div>
            <span>Destination</span>
            <strong>Where do you want to go?</strong>
          </div>
        </div>

        <div className="searchField">
          <CalendarDays size={20} />
          <div>
            <span>Travel Date</span>
            <strong>Select your dates</strong>
          </div>
        </div>

        <div className="searchField">
          <Users size={20} />
          <div>
            <span>Travellers</span>
            <strong>2 Guests</strong>
          </div>
        </div>

        <button className="searchButton">
          <Search size={20} />
          Search
        </button>
      </div>
    </div>
  );
}