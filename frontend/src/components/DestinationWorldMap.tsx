'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  CircleMarker,
  MapContainer,
  Popup,
  TileLayer,
  useMap,
} from 'react-leaflet';
import type { LatLngBoundsExpression } from 'leaflet';
import { MapPin, Star } from 'lucide-react';

const API_URL = (process.env.NEXT_PUBLIC_API_URL || 'https://globalvista-d7uz.onrender.com');

type MapDestination = {
  _id: string;
  name: string;
  country: string;
  description?: string;
  images?: string[];
  rating?: number;
  bestTimeToVisit?: string;
  activities?: string[];
  budget?: string;
  latitude: number;
  longitude: number;
};

function FitDestinationBounds({
  destinations,
}: {
  destinations: MapDestination[];
}) {
  const map = useMap();

  useEffect(() => {
    if (destinations.length === 0) {
      map.setView([20, 0], 1.6);
      return;
    }

    if (destinations.length === 1) {
      map.setView(
        [
          destinations[0].latitude,
          destinations[0].longitude,
        ],
        6,
      );
      return;
    }

    const bounds: LatLngBoundsExpression =
      destinations.map((destination) => [
        destination.latitude,
        destination.longitude,
      ]);

    map.fitBounds(bounds, {
      padding: [45, 45],
      maxZoom: 6,
    });
  }, [destinations, map]);

  return null;
}

function getImage(destination: MapDestination) {
  const firstImage = destination.images?.find(
    (image) => typeof image === 'string' && image.trim(),
  );

  return firstImage || '';
}

export default function DestinationWorldMap() {
  const [destinations, setDestinations] = useState<MapDestination[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const controller = new AbortController();

    async function loadDestinations() {
      try {
        setLoading(true);
        setError('');

        const response = await fetch(
          `${API_URL}/destinations/map`,
          {
            signal: controller.signal,
            cache: 'no-store',
          },
        );

        const data = await response
          .json()
          .catch(() => []);

        if (!response.ok) {
          throw new Error(
            Array.isArray(data?.message)
              ? data.message.join(', ')
              : data?.message ||
                  'Unable to load destination map.',
          );
        }

        const validDestinations = Array.isArray(data)
          ? data.filter(
              (destination): destination is MapDestination =>
                destination &&
                typeof destination._id === 'string' &&
                typeof destination.name === 'string' &&
                typeof destination.country === 'string' &&
                typeof destination.latitude === 'number' &&
                Number.isFinite(destination.latitude) &&
                destination.latitude >= -90 &&
                destination.latitude <= 90 &&
                typeof destination.longitude === 'number' &&
                Number.isFinite(destination.longitude) &&
                destination.longitude >= -180 &&
                destination.longitude <= 180,
            )
          : [];

        setDestinations(validDestinations);
      } catch (err) {
        if (
          err instanceof DOMException &&
          err.name === 'AbortError'
        ) {
          return;
        }

        setError(
          err instanceof Error
            ? err.message
            : 'Unable to load destination map.',
        );
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    void loadDestinations();

    return () => {
      controller.abort();
    };
  }, []);

  const mappedCountries = useMemo(
    () =>
      new Set(
        destinations.map((destination) =>
          destination.country.trim().toLowerCase(),
        ),
      ).size,
    [destinations],
  );

  if (loading) {
    return (
      <div className="realWorldMapState">
        <div className="realWorldMapLoader" />
        <span>Loading real destinations...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="realWorldMapState realWorldMapError">
        <MapPin size={25} />
        <strong>Map unavailable</strong>
        <span>{error}</span>
      </div>
    );
  }

  if (destinations.length === 0) {
    return (
      <div className="realWorldMapState">
        <MapPin size={26} />
        <strong>No mapped destinations yet</strong>
        <span>
          Add latitude and longitude from the admin destination page.
        </span>
      </div>
    );
  }

  return (
    <div className="realWorldMapWrap">
      <MapContainer
        key={`gv-map-${destinations.length}`}
        center={[20, 0]}
        zoom={1.6}
        minZoom={1}
        maxZoom={12}
        scrollWheelZoom={false}
        className="realWorldMap"
        worldCopyJump
      >
        <TileLayer
          attribution='&copy; OpenStreetMap contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <FitDestinationBounds destinations={destinations} />

        {destinations.map((destination) => {
          const image = getImage(destination);

          return (
            <CircleMarker
              key={destination._id}
              center={[
                destination.latitude,
                destination.longitude,
              ]}
              radius={8}
              pathOptions={{
                color: '#ffffff',
                weight: 3,
                fillColor: '#ff9f1c',
                fillOpacity: 1,
              }}
            >
              <Popup
                minWidth={220}
                maxWidth={260}
              >
                <article className="destinationMapPopup">
                  {image && (
                    <img
                      src={image}
                      alt={destination.name}
                      className="destinationMapPopupImage"
                    />
                  )}

                  <div className="destinationMapPopupBody">
                    <span className="destinationMapPopupCountry">
                      {destination.country}
                    </span>

                    <h3>{destination.name}</h3>

                    {typeof destination.rating === 'number' &&
                      destination.rating > 0 && (
                        <div className="destinationMapPopupRating">
                          <Star
                            size={13}
                            fill="currentColor"
                          />
                          <span>
                            {destination.rating.toFixed(1)}
                          </span>
                        </div>
                      )}

                    {destination.description && (
                      <p>
                        {destination.description.length > 120
                          ? `${destination.description.slice(
                              0,
                              120,
                            )}...`
                          : destination.description}
                      </p>
                    )}

                    <div className="destinationMapPopupMeta">
                      {destination.bestTimeToVisit && (
                        <span>
                          <strong>Best time:</strong>{' '}
                          {destination.bestTimeToVisit}
                        </span>
                      )}

                      {destination.budget && (
                        <span>
                          <strong>Budget:</strong>{' '}
                          {destination.budget}
                        </span>
                      )}
                    </div>

                    <a href="#destinations">
                      Explore Packages
                    </a>
                  </div>
                </article>
              </Popup>
            </CircleMarker>
          );
        })}
      </MapContainer>

      <div className="realWorldMapStats">
        <span>
          <strong>{destinations.length}</strong>
          {' '}mapped destinations
        </span>

        <span>
          <strong>{mappedCountries}</strong>
          {' '}countries
        </span>
      </div>
    </div>
  );
}
