'use client';

import React, { Component, useEffect, useMemo, useRef, useState } from 'react';
import type * as L from 'leaflet';
import { MapPin, Star } from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://globalvista-d7uz.onrender.com';

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

// Safe Error Boundary to prevent Leaflet or DOM errors from crashing React
class MapErrorBoundary extends Component<
  { children: React.ReactNode },
  { hasError: boolean }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: unknown) {
    console.warn('DestinationWorldMap caught error:', error);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="realWorldMapState">
          <MapPin size={26} color="#10b981" />
          <strong>GlobalVista Interactive Map</strong>
          <span>Explore signature havens and destinations worldwide.</span>
        </div>
      );
    }
    return this.props.children;
  }
}

function DestinationWorldMapInner() {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const [destinations, setDestinations] = useState<MapDestination[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // 1. Fetch map destinations from backend
  useEffect(() => {
    let mounted = true;
    const controller = new AbortController();

    async function loadDestinations() {
      try {
        setLoading(true);
        setError('');

        const response = await fetch(`${API_URL}/destinations/map`, {
          signal: controller.signal,
          cache: 'no-store',
        });

        const data = await response.json().catch(() => []);

        if (!response.ok) {
          throw new Error(
            Array.isArray(data?.message)
              ? data.message.join(', ')
              : data?.message || 'Unable to load destination map.'
          );
        }

        const validDestinations = Array.isArray(data)
          ? data.filter(
              (dest): dest is MapDestination =>
                dest &&
                typeof dest._id === 'string' &&
                typeof dest.name === 'string' &&
                typeof dest.country === 'string' &&
                typeof dest.latitude === 'number' &&
                Number.isFinite(dest.latitude) &&
                dest.latitude >= -90 &&
                dest.latitude <= 90 &&
                typeof dest.longitude === 'number' &&
                Number.isFinite(dest.longitude) &&
                dest.longitude >= -180 &&
                dest.longitude <= 180
            )
          : [];

        if (mounted) {
          setDestinations(validDestinations);
        }
      } catch (err: unknown) {
        if (err instanceof DOMException && err.name === 'AbortError') {
          return;
        }
        if (mounted) {
          setError(
            err instanceof Error ? err.message : 'Unable to load destination map.'
          );
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    void loadDestinations();

    return () => {
      mounted = false;
      controller.abort();
    };
  }, []);

  // 2. Client-side Leaflet rendering with 100% clean container reuse prevention
  useEffect(() => {
    if (loading || error || destinations.length === 0 || !mapContainerRef.current) {
      return;
    }

    let isCancelled = false;

    // Dynamically import Leaflet in browser only
    import('leaflet').then((leafletModule) => {
      if (isCancelled || !mapContainerRef.current) return;
      const L = leafletModule.default || leafletModule;

      // Clean up any existing map instance on this element
      if (mapInstanceRef.current) {
        try {
          mapInstanceRef.current.remove();
        } catch {}
        mapInstanceRef.current = null;
      }

      // CRITICAL FIX FOR LEAFLET CONTAINER REUSE:
      // Leaflet stores its internal ID on the DOM container (`_leaflet_id`).
      // Clearing it prevents "Error: Map container is being reused by another instance".
      const container = mapContainerRef.current as HTMLElement & { _leaflet_id?: number | string | null };
      if (container && container._leaflet_id) {
        try {
          delete container._leaflet_id;
        } catch {
          container._leaflet_id = null;
        }
      }

      try {
        const map = L.map(container, {
          center: [20, 0],
          zoom: 1.6,
          minZoom: 1,
          maxZoom: 12,
          scrollWheelZoom: false,
          worldCopyJump: true,
        });

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '&copy; OpenStreetMap contributors',
        }).addTo(map);

        destinations.forEach((dest) => {
          const marker = L.circleMarker([dest.latitude, dest.longitude], {
            color: '#ffffff',
            weight: 3,
            fillColor: '#ff9f1c',
            fillOpacity: 1,
            radius: 8,
          }).addTo(map);

          const firstImg = dest.images && dest.images[0] ? dest.images[0] : '';
          const imgHtml = firstImg
            ? `<img src="${firstImg}" alt="${dest.name}" class="destinationMapPopupImage" style="width:100%;height:110px;object-fit:cover;border-radius:10px;margin-bottom:8px;" />`
            : '';

          const ratingHtml =
            typeof dest.rating === 'number' && dest.rating > 0
              ? `<div class="destinationMapPopupRating" style="display:flex;align-items:center;gap:4px;font-size:12px;font-weight:700;color:#f59e0b;margin-bottom:4px;">★ ${dest.rating.toFixed(1)}</div>`
              : '';

          const descSnippet = dest.description
            ? dest.description.length > 120
              ? `${dest.description.slice(0, 120)}...`
              : dest.description
            : '';

          const popupContent = `
            <article class="destinationMapPopup" style="min-width:210px;max-width:250px;">
              ${imgHtml}
              <div class="destinationMapPopupBody">
                <span class="destinationMapPopupCountry" style="font-size:10px;font-weight:800;color:#10b981;text-transform:uppercase;letter-spacing:0.5px;">${dest.country}</span>
                <h3 style="font-size:14px;font-weight:800;margin:3px 0 4px;color:#18212f;">${dest.name}</h3>
                ${ratingHtml}
                ${descSnippet ? `<p style="font-size:11px;color:#64748b;line-height:15px;margin:4px 0 8px;">${descSnippet}</p>` : ''}
                <div class="destinationMapPopupMeta" style="font-size:10.5px;color:#475569;margin-bottom:8px;">
                  ${dest.bestTimeToVisit ? `<div><strong>Best time:</strong> ${dest.bestTimeToVisit}</div>` : ''}
                  ${dest.budget ? `<div><strong>Budget:</strong> ${dest.budget}</div>` : ''}
                </div>
                <a href="#destinations" style="display:inline-block;padding:5px 12px;background:#10b981;color:#ffffff;border-radius:6px;font-size:11px;font-weight:700;text-decoration:none;">Explore Packages &rarr;</a>
              </div>
            </article>
          `;

          marker.bindPopup(popupContent, { minWidth: 220, maxWidth: 260 });
        });

        // Fit bounds
        if (destinations.length === 1) {
          map.setView([destinations[0].latitude, destinations[0].longitude], 6);
        } else if (destinations.length > 1) {
          const bounds = L.latLngBounds(
            destinations.map((d) => [d.latitude, d.longitude])
          );
          map.fitBounds(bounds, { padding: [45, 45], maxZoom: 6 });
        }

        mapInstanceRef.current = map;
      } catch (initErr) {
        console.warn('Leaflet initialization caught:', initErr);
      }
    });

    return () => {
      isCancelled = true;
      if (mapInstanceRef.current) {
        try {
          mapInstanceRef.current.remove();
        } catch {}
        mapInstanceRef.current = null;
      }
      const container = mapContainerRef.current as HTMLElement & { _leaflet_id?: number | string | null };
      if (container && container._leaflet_id) {
        try {
          delete container._leaflet_id;
        } catch {
          container._leaflet_id = null;
        }
      }
    };
  }, [destinations, loading, error]);

  const mappedCountries = useMemo(
    () =>
      new Set(
        destinations.map((dest) => dest.country.trim().toLowerCase())
      ).size,
    [destinations]
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
        <span>Add latitude and longitude from the admin destination page.</span>
      </div>
    );
  }

  return (
    <div className="realWorldMapWrap">
      <div ref={mapContainerRef} className="realWorldMap" style={{ width: '100%', height: '100%', minHeight: '260px' }} />

      <div className="realWorldMapStats">
        <span>
          <strong>{destinations.length}</strong> mapped destinations
        </span>
        <span>
          <strong>{mappedCountries}</strong> countries
        </span>
      </div>
    </div>
  );
}

export default function DestinationWorldMap() {
  return (
    <MapErrorBoundary>
      <DestinationWorldMapInner />
    </MapErrorBoundary>
  );
}
