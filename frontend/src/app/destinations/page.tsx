'use client';
import {
  useEffect,
  useMemo,
  useState,
} from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  Globe2,
  MapPin,
  RefreshCw,
  Search,
  Star,
  Wallet,
} from 'lucide-react';
import styles from './page.module.css';
const API_URL = 'http://localhost:3001';

const HERO_VIDEOS = [
  '/videos/globalvista-hero-3.mp4',
  '/videos/globalvista-hero-4.mp4',
  '/videos/globalvista-hero-5.mp4',
] as const;
type Destination = {
  _id: string;
  name: string;
  country: string;
  description?: string;
  images?: string[];
  rating?: number;
  bestTimeToVisit?: string;
  activities?: string[];
  budget?: string;
  latitude?: number | null;
  longitude?: number | null;
  isActive?: boolean;
};
async function requestDestinations(): Promise<
  Destination[]
> {
  const response = await fetch(
    `${API_URL}/destinations`,
    {
      method: 'GET',
      cache: 'no-store',
    },
  );
  const data = await response
    .json()
    .catch(() => null);
  if (!response.ok) {
    throw new Error(
      'Unable to load destinations.',
    );
  }
  if (!Array.isArray(data)) {
    return [];
  }
  return data.filter(
    (destination: Destination) =>
      destination.isActive !== false,
  );
}
function getDestinationImage(
  destination: Destination,
) {
  const image =
    destination.images?.find(
      (item) =>
        typeof item === 'string' &&
        item.trim() !== '',
    );
  if (!image) {
    return '/images/globalvista-bg.png';
  }
  if (
    image.startsWith('http://') ||
    image.startsWith('https://')
  ) {
    return image;
  }
  if (image.startsWith('/')) {
    return image;
  }
  return `/images/${image}`;
}
function hasCoordinates(
  destination: Destination,
) {
  return (
    typeof destination.latitude ===
      'number' &&
    Number.isFinite(
      destination.latitude,
    ) &&
    typeof destination.longitude ===
      'number' &&
    Number.isFinite(
      destination.longitude,
    )
  );
}
export default function DestinationsPage() {
  const [heroVideoIndex, setHeroVideoIndex] = useState(0);

  const [
    destinations,
    setDestinations,
  ] = useState<Destination[]>([]);
  const [
    loading,
    setLoading,
  ] = useState(true);
  const [
    refreshing,
    setRefreshing,
  ] = useState(false);
  const [
    error,
    setError,
  ] = useState('');
  const [
    search,
    setSearch,
  ] = useState('');
  const [
    selectedCountry,
    setSelectedCountry,
  ] = useState('ALL');
  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const data =
          await requestDestinations();
        if (!cancelled) {
          setDestinations(data);
          setError('');
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error
              ? err.message
              : 'Unable to load destinations.',
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };
    void load();
    return () => {
      cancelled = true;
    };
  }, []);
  const handleRefresh =
    async () => {
      setRefreshing(true);
      setError('');
      try {
        const data =
          await requestDestinations();
        setDestinations(data);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : 'Unable to load destinations.',
        );
      } finally {
        setRefreshing(false);
      }
    };
  const countries =
    useMemo(() => {
      return Array.from(
        new Set(
          destinations
            .map(
              (destination) =>
                destination.country,
            )
            .filter(Boolean),
        ),
      ).sort(
        (a, b) =>
          a.localeCompare(b),
      );
    }, [destinations]);
  const filteredDestinations =
    useMemo(() => {
      const query =
        search
          .trim()
          .toLowerCase();
      return destinations.filter(
        (destination) => {
          const matchesSearch =
            !query ||
            destination.name
              .toLowerCase()
              .includes(query) ||
            destination.country
              .toLowerCase()
              .includes(query) ||
            (
              destination.description ||
              ''
            )
              .toLowerCase()
              .includes(query) ||
            destination.activities?.some(
              (activity) =>
                activity
                  .toLowerCase()
                  .includes(query),
            );
          const matchesCountry =
            selectedCountry ===
              'ALL' ||
            destination.country ===
              selectedCountry;
          return (
            Boolean(
              matchesSearch,
            ) &&
            matchesCountry
          );
        },
      );
    }, [
      destinations,
      search,
      selectedCountry,
    ]);
  return (
    <main
      className={styles.page}
    >
      <section
        className={styles.hero}
        style={{ position: 'relative', overflow: 'hidden' }}
      >
        <video
          key={heroVideoIndex}
          src={HERO_VIDEOS[heroVideoIndex]}
          autoPlay
          muted
          playsInline
          preload="auto"
          aria-hidden="true"
          onEnded={() =>
            setHeroVideoIndex((current) =>
              (current + 1) % HERO_VIDEOS.length,
            )
          }
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            zIndex: 0,
            pointerEvents: 'none',
          }}
        />
        <div
          className={
            styles.heroOverlay
          }
          style={{ zIndex: 1 }}
        />
        <div
          className={
            styles.heroContent
          }
          style={{ position: 'relative', zIndex: 2 }}
        >
          <Link
            href="/"
            className={
              styles.backLink
            }
          >
            <ArrowLeft
              size={16}
            />
            Back to Home
          </Link>
          <span
            className={
              styles.eyebrow
            }
          >
            GLOBALVISTA
            DESTINATIONS
          </span>
          <h1>
            Discover your next
            unforgettable journey
          </h1>
          <p>
            Explore beautiful
            destinations around the
            world and find the
            perfect place for your
            next adventure.
          </p>
          <div
            className={
              styles.heroStats
            }
          >
            <div
              className={
                styles.heroStat
              }
            >
              <Globe2
                size={21}
              />
              <div>
                <strong>
                  {
                    destinations.length
                  }
                </strong>
                <span>
                  Destinations
                </span>
              </div>
            </div>
            <div
              className={
                styles.heroStat
              }
            >
              <MapPin
                size={21}
              />
              <div>
                <strong>
                  {
                    countries.length
                  }
                </strong>
                <span>
                  Countries
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>
      <section
        className={styles.content}
      >
        <div
          className={
            styles.container
          }
        >
          <div
            className={
              styles.heading
            }
          >
            <div>
              <span>
                EXPLORE THE WORLD
              </span>
              <h2>
                Popular
                Destinations
              </h2>
              <p>
                Explore all active
                destinations
                available through
                GlobalVista.
              </p>
            </div>
            <button
              type="button"
              className={
                styles.refreshButton
              }
              onClick={() =>
                void handleRefresh()
              }
              disabled={
                refreshing
              }
            >
              <RefreshCw
                size={16}
                className={
                  refreshing
                    ? styles.spin
                    : ''
                }
              />
              Refresh
            </button>
          </div>
          <div
            className={
              styles.toolbar
            }
          >
            <div
              className={
                styles.searchBox
              }
            >
              <Search
                size={18}
              />
              <input
                type="text"
                value={search}
                onChange={(
                  event,
                ) =>
                  setSearch(
                    event.target
                      .value,
                  )
                }
                placeholder="Search destination, country or activity..."
              />
            </div>
            <select
              className={
                styles.countrySelect
              }
              value={
                selectedCountry
              }
              onChange={(
                event,
              ) =>
                setSelectedCountry(
                  event.target
                    .value,
                )
              }
            >
              <option value="ALL">
                All Countries
              </option>
              {countries.map(
                (country) => (
                  <option
                    key={
                      country
                    }
                    value={
                      country
                    }
                  >
                    {
                      country
                    }
                  </option>
                ),
              )}
            </select>
          </div>
          {!loading &&
            !error && (
              <div
                className={
                  styles.resultBar
                }
              >
                Showing{' '}
                <strong>
                  {
                    filteredDestinations.length
                  }
                </strong>{' '}
                destination
                {filteredDestinations.length !==
                1
                  ? 's'
                  : ''}
              </div>
            )}
          {loading && (
            <div
              className={
                styles.stateBox
              }
            >
              <RefreshCw
                size={30}
                className={
                  styles.spin
                }
              />
              <h3>
                Loading
                destinations...
              </h3>
            </div>
          )}
          {!loading &&
            error && (
              <div
                className={
                  styles.stateBox
                }
              >
                <Globe2
                  size={34}
                />
                <h3>
                  Unable to load
                  destinations
                </h3>
                <p>
                  {error}
                </p>
                <button
                  type="button"
                  className={
                    styles.retryButton
                  }
                  onClick={() =>
                    void handleRefresh()
                  }
                >
                  <RefreshCw
                    size={15}
                  />
                  Try Again
                </button>
              </div>
            )}
          {!loading &&
            !error &&
            filteredDestinations.length ===
              0 && (
              <div
                className={
                  styles.stateBox
                }
              >
                <Search
                  size={34}
                />
                <h3>
                  No destinations
                  found
                </h3>
              </div>
            )}
          {!loading &&
            !error &&
            filteredDestinations.length >
              0 && (
              <div
                className={
                  styles.destinationGrid
                }
              >
                {filteredDestinations.map(
                  (
                    destination,
                  ) => {
                    const mapped =
                      hasCoordinates(
                        destination,
                      );
                    return (
                      <article
                        key={
                          destination._id
                        }
                        className={
                          styles.destinationCard
                        }
                      >
                        <div
                          className={
                            styles.imageWrap
                          }
                        >
                          <img
                            src={getDestinationImage(
                              destination,
                            )}
                            alt={
                              destination.name
                            }
                            onError={(
                              event,
                            ) => {
                              event.currentTarget.onerror =
                                null;
                              event.currentTarget.src =
                                '/images/globalvista-bg.png';
                            }}
                          />
                          <div
                            className={
                              styles.imageShade
                            }
                          />
                          <span
                            className={
                              styles.countryBadge
                            }
                          >
                            <MapPin
                              size={12}
                            />
                            {
                              destination.country
                            }
                          </span>
                          <span
                            className={
                              styles.ratingBadge
                            }
                          >
                            <Star
                              size={13}
                              fill="currentColor"
                            />
                            {Number(
                              destination.rating ??
                                0,
                            ).toFixed(
                              1,
                            )}
                          </span>
                          <div
                            className={
                              styles.imageTitle
                            }
                          >
                            <h2>
                              {
                                destination.name
                              }
                            </h2>
                            <p>
                              {
                                destination.country
                              }
                            </p>
                          </div>
                        </div>
                        <div
                          className={
                            styles.cardBody
                          }
                        >
                          <p
                            className={
                              styles.description
                            }
                          >
                            {destination.description ||
                              `Explore ${destination.name}, ${destination.country}.`}
                          </p>
                          <div
                            className={
                              styles.infoGrid
                            }
                          >
                            <div
                              className={
                                styles.infoItem
                              }
                            >
                              <span
                                className={
                                  styles.infoIcon
                                }
                              >
                                <CalendarDays
                                  size={
                                    17
                                  }
                                />
                              </span>
                              <div>
                                <small>
                                  Best
                                  Time
                                </small>
                                <strong>
                                  {destination.bestTimeToVisit ||
                                    'Any time'}
                                </strong>
                              </div>
                            </div>
                            <div
                              className={
                                styles.infoItem
                              }
                            >
                              <span
                                className={
                                  styles.infoIcon
                                }
                              >
                                <Wallet
                                  size={
                                    17
                                  }
                                />
                              </span>
                              <div>
                                <small>
                                  Budget
                                </small>
                                <strong>
                                  {destination.budget ||
                                    'Not specified'}
                                </strong>
                              </div>
                            </div>
                          </div>
                          {destination.activities &&
                            destination
                              .activities
                              .length >
                              0 && (
                              <div
                                className={
                                  styles.activities
                                }
                              >
                                {destination.activities.map(
                                  (
                                    activity,
                                  ) => (
                                    <span
                                      key={
                                        activity
                                      }
                                    >
                                      {
                                        activity
                                      }
                                    </span>
                                  ),
                                )}
                              </div>
                            )}
                          <div
                            className={
                              styles.cardFooter
                            }
                          >
                            {mapped ? (
                              <a
                                className={
                                  styles.mapButton
                                }
                                href={`https://www.google.com/maps/search/?api=1&query=${destination.latitude},${destination.longitude}`}
                                target="_blank"
                                rel="noreferrer"
                              >
                                <MapPin
                                  size={
                                    15
                                  }
                                />
                                View Location
                              </a>
                            ) : (
                              <span
                                className={
                                  styles.noMap
                                }
                              >
                                <MapPin
                                  size={
                                    15
                                  }
                                />
                                No Location
                              </span>
                            )}
                            <Link
                              href={`/packages?destinationId=${encodeURIComponent(destination._id)}&destinationName=${encodeURIComponent(destination.name)}`}
                              className={
                                styles.packageButton
                              }
                            >
                              View Packages
                              <ArrowRight
                                size={
                                  15
                                }
                              />
                            </Link>
                          </div>
                        </div>
                      </article>
                    );
                  },
                )}
              </div>
            )}
        </div>
      </section>
    </main>
  );
}