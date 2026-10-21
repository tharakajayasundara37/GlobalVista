'use client';

import Link from 'next/link';
import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, ArrowRight, CalendarDays, Check, Clock3, Compass, MapPin, Minus, Plus, Search, Star, X } from 'lucide-react';
import PackageItineraryModal from '../../components/PackageItineraryModal';
import CurrencySelector from '../../components/CurrencySelector';
import { useCurrency } from '../../context/CurrencyContext';
import styles from './page.module.css';

const API_URL = 'http://localhost:3001';

type PackageAddOn = {
  _id: string;
  name: string;
  price: number;
  pricingType: 'PER_PERSON' | 'PER_BOOKING';
};
type ApiPackage = {
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
type BookingResponse = {
  _id?: string;
  totalPrice?: number;
  message?: string | string[];
};
type TravelPlan = {
  _id: string;
  name: string;
  price: number;
  priceSuffix: string;
  features: string[];
  isPopular: boolean;
  isActive: boolean;
  sortOrder: number;
};

const fallbackImages: Record<string, string> = {
  Maldives: '/images/maldives-package-1.jpg',
  'Sri Lanka': '/images/sri-lanka-tour-1.jpg',
  Japan: '/images/japan-tour-1.jpg',
  Switzerland: '/images/switzerland-tour-1.jpg',
  Bali: '/images/bali-honeymoon-1.jpg',
  Phuket: '/images/thailand-tour.jpg',
};
const defaultFallbackImage = '/images/default-travel.jpg';

function getPackageImage(pkg: ApiPackage) {
  const image = pkg.images?.[0];
  if (!image) return fallbackImages[pkg.destination] || defaultFallbackImage;
  if (image.startsWith('http://') || image.startsWith('https://')) return image;
  if (image.startsWith('/uploads/')) return `${API_URL}${image}`;
  if (image.startsWith('/images/')) return image;
  return `/images/${image}`;
}
function formatMoney(value: number) {
  return new Intl.NumberFormat('en-US', { maximumFractionDigits: 2 }).format(value);
}
function getTodayDate() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function PackagesContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const selectedDestinationId = searchParams.get('destinationId') || '';
  const selectedDestinationName = searchParams.get('destinationName') || '';

  const { formatPrice, currentCurrency } = useCurrency();
  const [packages, setPackages] = useState<ApiPackage[]>([]);
  const [packagesLoading, setPackagesLoading] = useState(true);
  const [packagesError, setPackagesError] = useState('');
  const [travelPlans, setTravelPlans] = useState<TravelPlan[]>([]);
  const [travelPlansLoading, setTravelPlansLoading] = useState(true);
  const [travelPlansError, setTravelPlansError] = useState('');
  const [selectedTravelPlanId, setSelectedTravelPlanId] = useState('');
  const [selectedPackage, setSelectedPackage] = useState<ApiPackage | null>(null);
  const [itineraryModalPackage, setItineraryModalPackage] = useState<ApiPackage | null>(null);
  const [isItineraryModalOpen, setIsItineraryModalOpen] = useState(false);
  const openItinerary = (pkg: ApiPackage) => {
    setItineraryModalPackage(pkg);
    setIsItineraryModalOpen(true);
  };
  const closeItinerary = () => {
    setIsItineraryModalOpen(false);
  };
  const [travelDate, setTravelDate] = useState('');
  const [numberOfPeople, setNumberOfPeople] = useState(1);
  const [selectedAddOnIds, setSelectedAddOnIds] = useState<string[]>([]);
  const [bookingSubmitting, setBookingSubmitting] = useState(false);
  const [bookingError, setBookingError] = useState('');
  const [bookingSuccess, setBookingSuccess] = useState('');
  const [createdBookingId, setCreatedBookingId] = useState<string>('');
  const [search, setSearch] = useState(searchParams.get('search') || '');

  useEffect(() => {
    const q = searchParams.get('search');
    if (q) {
      setSearch(q);
    }
  }, [searchParams]);

  useEffect(() => {
    const timer =
      window.setTimeout(
        () => {
          const storedPlanId =
            localStorage.getItem(
              'globalvista_selected_travel_plan',
            );

          if (
            storedPlanId
          ) {
            setSelectedTravelPlanId(
              storedPlanId,
            );
          }
        },
        0,
      );

    return () => {
      window.clearTimeout(
        timer,
      );
    };
  }, []);

  useEffect(() => {
    const loadPackages =
      async () => {
        try {
          setPackagesLoading(
            true,
          );

          setPackagesError(
            '',
          );

          const response =
            await fetch(
              `${API_URL}/packages`,
              {
                cache:
                  'no-store',
              },
            );

          if (
            !response.ok
          ) {
            throw new Error(
              `Failed to load packages: ${response.status}`,
            );
          }

          const data:
            ApiPackage[] =
            await response.json();

          setPackages(
            Array.isArray(
              data,
            )
              ? data
              : [],
          );
        } catch (
          error
        ) {
          console.error(
            'Package API error:',
            error,
          );

          setPackagesError(
            'Unable to load packages. Please try again.',
          );
        } finally {
          setPackagesLoading(
            false,
          );
        }
      };

    void loadPackages();
  }, []);

  useEffect(() => {
    const loadTravelPlans =
      async () => {
        try {
          setTravelPlansLoading(
            true,
          );

          setTravelPlansError(
            '',
          );

          const response =
            await fetch(
              `${API_URL}/travel-plans/active`,
              {
                cache:
                  'no-store',
              },
            );

          if (
            !response.ok
          ) {
            throw new Error(
              `Failed to load travel plans: ${response.status}`,
            );
          }

          const data:
            TravelPlan[] =
            await response.json();

          setTravelPlans(
            Array.isArray(
              data,
            )
              ? data
              : [],
          );
        } catch (
          error
        ) {
          console.error(
            'Travel plans API error:',
            error,
          );

          setTravelPlans(
            [],
          );

          setTravelPlansError(
            'Unable to load travel plans. Please try again.',
          );
        } finally {
          setTravelPlansLoading(
            false,
          );
        }
      };

    void loadTravelPlans();
  }, []);

  const persistTravelPlanSelection =
    (
      planId:
        string,
    ) => {
      setSelectedTravelPlanId(
        planId,
      );

      if (
        planId
      ) {
        localStorage.setItem(
          'globalvista_selected_travel_plan',
          planId,
        );
      } else {
        localStorage.removeItem(
          'globalvista_selected_travel_plan',
        );
      }

      setBookingError(
        '',
      );

      setBookingSuccess(
        '',
      );
      setCreatedBookingId('');
    };

  const openBooking =
    async (
      pkg: ApiPackage,
    ) => {
      if (
        !pkg.availability
      ) {
        return;
      }

      setSelectedPackage(
        pkg,
      );

      setTravelDate(
        '',
      );

      setNumberOfPeople(
        1,
      );

      setSelectedAddOnIds(
        [],
      );

      setBookingError(
        '',
      );

      setBookingSuccess(
        '',
      );

      try {
        const response =
          await fetch(
            `${API_URL}/packages/${pkg._id}`,
            {
              cache:
                'no-store',
            },
          );

        if (
          !response.ok
        ) {
          throw new Error(
            `Failed to refresh package: ${response.status}`,
          );
        }

        const latestPackage:
          ApiPackage =
          await response.json();

        setSelectedPackage(
          latestPackage,
        );

        setPackages(
          (
            current,
          ) =>
            current.map(
              (
                item,
              ) =>
                item._id ===
                latestPackage._id
                  ? latestPackage
                  : item,
            ),
        );
      } catch (
        error
      ) {
        console.error(
          'Package refresh error:',
          error,
        );

        setBookingError(
          'Could not refresh the latest package details. Please close and try again.',
        );
      }
    };

  const closeBooking =
    () => {
      if (
        bookingSubmitting
      ) {
        return;
      }

      setSelectedPackage(
        null,
      );

      setTravelDate(
        '',
      );

      setNumberOfPeople(
        1,
      );

      setSelectedAddOnIds(
        [],
      );

      setBookingError(
        '',
      );

      setBookingSuccess(
        '',
      );
    };

  const toggleAddOn =
    (
      addOnId:
        string,
    ) => {
      setBookingError(
        '',
      );

      setBookingSuccess(
        '',
      );

      setSelectedAddOnIds(
        (
          current,
        ) =>
          current.includes(
            addOnId,
          )
            ? current.filter(
                (
                  id,
                ) =>
                  id !==
                  addOnId,
              )
            : [
                ...current,
                addOnId,
              ],
      );
    };

  const selectedTravelPlan =
    travelPlans.find(
      (
        plan,
      ) =>
        plan._id ===
        selectedTravelPlanId,
    ) ??
    null;

  const travelPlanTotal =
    selectedTravelPlan
      ? selectedTravelPlan
          .price *
        numberOfPeople
      : 0;

  const baseTotal =
    selectedPackage
      ? selectedPackage
          .price *
        numberOfPeople
      : 0;

  const addOnsTotal =
    selectedPackage
      ? (
          selectedPackage
            .addOns ??
          []
        )
          .filter(
            (
              addOn,
            ) =>
              selectedAddOnIds.includes(
                addOn._id,
              ),
          )
          .reduce(
            (
              total,
              addOn,
            ) => {
              const quantity =
                addOn.pricingType ===
                'PER_PERSON'
                  ? numberOfPeople
                  : 1;

              return (
                total +
                addOn.price *
                  quantity
              );
            },
            0,
          )
      : 0;

  const estimatedTotal =
    baseTotal +
    travelPlanTotal +
    addOnsTotal;

  const createBooking =
    async () => {
      if (
        !selectedPackage
      ) {
        return;
      }

      setBookingError(
        '',
      );

      setBookingSuccess(
        '',
      );

      if (
        !selectedTravelPlan
      ) {
        setBookingError(
          'Please select a travel plan before confirming your booking.',
        );

        return;
      }

      if (
        !travelDate
      ) {
        setBookingError(
          'Please select your travel date.',
        );

        return;
      }

      if (
        travelDate <
        getTodayDate()
      ) {
        setBookingError(
          'Travel date cannot be in the past.',
        );

        return;
      }

      const token =
        localStorage.getItem(
          'globalvista_token',
        ) ||
        localStorage.getItem(
          'token',
        );

      const rawUser =
        localStorage.getItem(
          'globalvista_user',
        ) ||
        localStorage.getItem(
          'user',
        );

      if (
        !token ||
        !rawUser
      ) {
        router.push(
          '/login',
        );

        return;
      }

      let storedUser:
        {
          role?: string;
        } | null =
        null;

      try {
        storedUser =
          JSON.parse(
            rawUser,
          );
      } catch {
        storedUser =
          null;
      }

      if (storedUser?.role !== 'USER' && storedUser?.role !== 'ADMIN') {
        setBookingError('Please sign in as a traveller or administrator to book.');
        return;
      }

      try {
        setBookingSubmitting(
          true,
        );

        const response =
          await fetch(
            `${API_URL}/bookings`,
            {
              method:
                'POST',

              headers: {
                'Content-Type':
                  'application/json',

                Authorization:
                  `Bearer ${token}`,
              },

              body:
                JSON.stringify(
                  {
                    packageId:
                      selectedPackage._id,

                    travelPlanId:
                      selectedTravelPlan._id,

                    travelDate,

                    numberOfPeople,

                    selectedAddOnIds,
                  },
                ),
            },
          );

        const data:
          BookingResponse =
          await response
            .json()
            .catch(
              () =>
                ({}),
            );

        if (
          response.status ===
          401
        ) {
          localStorage.removeItem(
            'globalvista_token',
          );

          localStorage.removeItem(
            'globalvista_user',
          );

          localStorage.removeItem(
            'token',
          );

          localStorage.removeItem(
            'user',
          );

          router.push(
            '/login',
          );

          return;
        }

        if (
          !response.ok
        ) {
          const message =
            Array.isArray(
              data.message,
            )
              ? data.message.join(
                  ', ',
                )
              : data.message ||
                'Unable to create booking.';

          throw new Error(
            message,
          );
        }

        const confirmedTotal =
          typeof data
            .totalPrice ===
          'number'
            ? data.totalPrice
            : estimatedTotal;

        setBookingSuccess(
          `Booking created successfully. Total: $${formatMoney(
            confirmedTotal,
          )}`,
        );
      } catch (
        error
      ) {
        setBookingError(
          error instanceof
            Error
            ? error.message
            : 'Unable to create booking.',
        );
      } finally {
        setBookingSubmitting(
          false,
        );
      }
    };

  const normalizedSearch = search.trim().toLowerCase();
  const filteredPackages = packages.filter((pkg) => {
    const destinationId = typeof pkg.destinationId === 'string'
      ? pkg.destinationId
      : pkg.destinationId?._id;
    const matchesDestination = !selectedDestinationId || destinationId === selectedDestinationId;
    const matchesSearch = !normalizedSearch ||
      [pkg.title, pkg.destination, pkg.country, pkg.category].some((value) =>
        (value || '').toLowerCase().includes(normalizedSearch),
      );
    return matchesDestination && matchesSearch;
  });

  return (
    <main className={styles.page}>
      <section className={styles.hero}>
        <div className={styles.heroInner}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', marginBottom: '16px' }}>
            <Link className={styles.backLink} href="/">
              <ArrowLeft size={16} /> Back to Home
            </Link>
            <CurrencySelector />
          </div>
          <span className={styles.eyebrow}>GLOBALVISTA TRAVEL PACKAGES</span>
          <h1>{selectedDestinationId
            ? `Discover ${selectedDestinationName || 'Destination'} Packages`
            : 'Discover your next unforgettable journey'}</h1>
          <p>Find your perfect getaway, explore unique experiences and book with confidence.</p>
        </div>
      </section>

      <section className={styles.content}>
        <div className={styles.container}>
          <div className={styles.heading}>
            <div>
              <span>EXPLORE OUR JOURNEYS</span>
              <h2>{selectedDestinationId
                ? `Packages for ${selectedDestinationName || 'selected destination'}`
                : 'All Travel Packages'}</h2>
              <p>Explore travel packages created by GlobalVista.</p>
            </div>
            {selectedDestinationId && (
              <Link className={styles.showAll} href="/packages">
                Show All Packages <ArrowRight size={16} />
              </Link>
            )}
          </div>

          <div className={styles.toolbar}>
            <label className={styles.searchBox}>
              <Search size={19} />
              <input
                type="search"
                placeholder="Search packages, country or category..."
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
            </label>
            {!packagesLoading && !packagesError && (
              <p className={styles.resultCount}>
                Showing <strong>{filteredPackages.length}</strong> package{filteredPackages.length === 1 ? '' : 's'}
              </p>
            )}
          </div>

          {packagesLoading && <p className={styles.message}>Loading packages...</p>}
          {!packagesLoading && packagesError && <p className={styles.message}>{packagesError}</p>}
          {!packagesLoading && !packagesError && filteredPackages.length === 0 && (
            <div className={styles.emptyState}>
              <h3>No packages found</h3>
              <p>{selectedDestinationId
                ? 'No packages are linked to this destination yet, or your search has no matches.'
                : 'Try a different search or check back later.'}</p>
              {selectedDestinationId && (
                <Link href="/packages" className={styles.showAll}>Show All Packages <ArrowRight size={16}/></Link>
              )}
            </div>
          )}

          {!packagesLoading && !packagesError && filteredPackages.length > 0 && (
            <div className="destinationGrid">
              {filteredPackages.map((pkg) => {
                const rating = Number(pkg.reviewInfo?.averageRating || 0);
                const reviewCount = Number(pkg.reviewInfo?.totalReviews || 0);
                return (
                  <article className="destinationCard" key={pkg._id}>
                    <img
                      src={getPackageImage(pkg)}
                      alt={pkg.title}
                      onError={(event) => {
                        event.currentTarget.onerror = null;
                        event.currentTarget.src = fallbackImages[pkg.destination] || defaultFallbackImage;
                      }}
                    />
                    <div className="destinationShade" />
                    <div className="destinationContent">
                      <h3>{pkg.title}</h3>
                      <div className="destinationMeta">
                        <span><MapPin size={13} />{pkg.destination}</span>
                        <span><Clock3 size={13}/>{pkg.duration}</span>
                        <span><Star size={13} fill="currentColor" />
                          {rating > 0 ? `${rating.toFixed(1)} (${reviewCount})` : 'New'}
                        </span>
                      </div>
                      <div className="gvCardButtonsRow">
                        <button
                          type="button"
                          className="gvCardItineraryBtn"
                          onClick={(e) => {
                            e.stopPropagation();
                            openItinerary(pkg);
                          }}
                        >
                          <CalendarDays size={13} />
                          <span>Itinerary</span>
                        </button>
                        <button
                          type="button"
                          className="destinationBookButton"
                          disabled={!pkg.availability}
                          onClick={() => void openBooking(pkg)}
                        >
                          {pkg.availability ? 'View & Book' : 'Unavailable'}
                          {pkg.availability && <ArrowRight size={13} />}
                        </button>
                      </div>
                      <div className="destinationPrice">
                        <small>From</small>
                        <strong>{formatPrice(pkg.price)}</strong>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>
      </section>
      {selectedPackage && (
        <div
          className="bookingModalOverlay"
          onMouseDown={
            closeBooking
          }
        >
          <section
            className="bookingModal"
            onMouseDown={(
              event,
            ) =>
              event.stopPropagation()
            }
          >
            <div
              className="bookingModalHeader"
            >
              <div>
                <span>
                  BOOK YOUR TRIP
                </span>

                <h2>
                  {
                    selectedPackage.title
                  }
                </h2>

                <p>
                  {
                    selectedPackage.destination
                  }

                  {' · '}

                  {
                    selectedPackage.duration
                  }
                </p>

                <button
                  type="button"
                  className="bookingModalItineraryLink"
                  onClick={() => openItinerary(selectedPackage)}
                >
                  <Compass size={13} />
                  <span>Inspect Day-by-Day Itinerary</span>
                </button>
              </div>

              <button
                type="button"
                aria-label="Close booking"
                onClick={
                  closeBooking
                }
                disabled={
                  bookingSubmitting
                }
              >
                <X
                  size={
                    18
                  }
                />
              </button>
            </div>

            <div
              className="bookingModalBody"
            >
              <div
                className="bookingPackageSummary"
              >
                <img
                  src={getPackageImage(
                    selectedPackage,
                  )}
                  alt={
                    selectedPackage.title
                  }
                  onError={(
                    event,
                  ) => {
                    event.currentTarget.onerror =
                      null;

                    event.currentTarget.src =
                      fallbackImages[
                        selectedPackage
                          .destination
                      ] ||
                      defaultFallbackImage;
                  }}
                />

                <div>
                  <span>
                    PACKAGE PRICE
                  </span>

                  <strong>
                    {formatPrice(
                      selectedPackage.price,
                    )}

                    {' '}

                    <small>
                      / person
                    </small>
                  </strong>
                </div>
              </div>

              <div
                className="bookingIncluded"
              >
                <div
                  className="bookingSectionTitle"
                >
                  <div>
                    <span>
                      INCLUDED FREE
                    </span>

                    <h3>
                      Package inclusions
                    </h3>
                  </div>

                  <strong>
                    {
                      selectedPackage
                        .included
                        ?.length ??
                      0
                    }

                    /6 FREE
                  </strong>
                </div>

                <div
                  className="bookingIncludedGrid"
                >
                  {(selectedPackage
                    .included ??
                    []).map(
                    (
                      item,
                      index,
                    ) => (
                      <div
                        key={`${item}-${index}`}
                      >
                        <Check
                          size={
                            14
                          }
                        />

                        <span>
                          {
                            item
                          }
                        </span>
                      </div>
                    ),
                  )}

                  {!selectedPackage
                    .included
                    ?.length && (
                    <div>
                      No free included items listed.
                    </div>
                  )}
                </div>
              </div>

              <div
                className="bookingIncluded"
              >
                <div
                  className="bookingSectionTitle"
                >
                  <div>
                    <span>
                      TRAVEL PLAN
                    </span>

                    <h3>
                      Choose your service level
                    </h3>
                  </div>

                  {selectedTravelPlan && (
                    <strong>
                      {
                        selectedTravelPlan.name
                      }
                    </strong>
                  )}
                </div>

                <label
                  style={{
                    display:
                      'grid',
                    gap:
                      '8px',
                  }}
                >
                  <span
                    style={{
                      fontSize:
                        '12px',
                      fontWeight:
                        700,
                      color:
                        '#24343c',
                    }}
                  >
                    Selected Plan
                  </span>

                  <select
                    disabled={travelPlansLoading}
                    value={
                      selectedTravelPlanId
                    }
                    onChange={(
                      event,
                    ) =>
                      persistTravelPlanSelection(
                        event.target.value,
                      )
                    }
                    style={{
                      width:
                        '100%',
                      minHeight:
                        '46px',
                      border:
                        '1px solid #dfe7eb',
                      borderRadius:
                        '10px',
                      padding:
                        '0 14px',
                      background:
                        '#ffffff',
                      color:
                        '#17272f',
                      fontSize:
                        '14px',
                      outline:
                        'none',
                    }}
                  >
                    <option
                      value=""
                    >
                      {travelPlansLoading
                        ? 'Loading travel plans...'
                        : 'Select a travel plan'}
                    </option>

                    {travelPlans.map(
                      (
                        plan,
                      ) => (
                        <option
                          key={
                            plan._id
                          }
                          value={
                            plan._id
                          }
                        >
                          {plan.name} — ${formatMoney(
                            plan.price,
                          )} {plan.priceSuffix}
                        </option>
                      ),
                    )}
                  </select>
                </label>

                {travelPlansError && (
                  <p className="bookingMessage bookingError">
                    {travelPlansError}
                  </p>
                )}

                {selectedTravelPlan && (
                  <div
                    style={{
                      marginTop:
                        '14px',
                      padding:
                        '14px',
                      borderRadius:
                        '12px',
                      background:
                        '#f5f9fc',
                    }}
                  >
                    <div
                      style={{
                        display:
                          'flex',
                        justifyContent:
                          'space-between',
                        gap:
                          '12px',
                        alignItems:
                          'center',
                      }}
                    >
                      <strong>
                        {
                          selectedTravelPlan.name
                        }
                      </strong>

                      <strong>
                        $
                        {formatMoney(
                          travelPlanTotal,
                        )}
                      </strong>
                    </div>

                    <small
                      style={{
                        display:
                          'block',
                        marginTop:
                          '4px',
                        color:
                          '#6d7c84',
                      }}
                    >
                      $
                      {formatMoney(
                        selectedTravelPlan.price,
                      )}{' '}
                      {
                        selectedTravelPlan.priceSuffix
                      } ×{' '}
                      {
                        numberOfPeople
                      }
                    </small>

                    {selectedTravelPlan
                      .features
                      .length >
                      0 && (
                      <div
                        style={{
                          display:
                            'grid',
                          gap:
                            '6px',
                          marginTop:
                            '12px',
                        }}
                      >
                        {selectedTravelPlan.features.map(
                          (
                            feature,
                            index,
                          ) => (
                            <div
                              key={`${selectedTravelPlan._id}-modal-${index}`}
                              style={{
                                display:
                                  'flex',
                                alignItems:
                                  'center',
                                gap:
                                  '8px',
                                fontSize:
                                  '12px',
                                color:
                                  '#4e6069',
                              }}
                            >
                              <Check
                                size={
                                  14
                                }
                              />

                              {
                                feature
                              }
                            </div>
                          ),
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div
                className="bookingFormGrid"
              >
                <label>
                  <span>
                    Travel Date
                  </span>

                  <input
                    type="date"
                    min={
                      getTodayDate()
                    }
                    value={
                      travelDate
                    }
                    onChange={(
                      event,
                    ) => {
                      setTravelDate(
                        event
                          .target
                          .value,
                      );

                      setBookingError(
                        '',
                      );

                      setBookingSuccess(
                        '',
                      );
                    }}
                  />
                </label>

                <div
                  className="travellerField"
                >
                  <span>
                    Travellers
                  </span>

                  <div
                    className="travellerStepper"
                  >
                    <button
                      type="button"
                      aria-label="Remove traveller"
                      disabled={
                        numberOfPeople <=
                        1
                      }
                      onClick={() => {
                        setNumberOfPeople(
                          (
                            current,
                          ) =>
                            Math.max(
                              1,
                              current -
                                1,
                            ),
                        );

                        setBookingSuccess(
                          '',
                        );
                      }}
                    >
                      <Minus
                        size={
                          15
                        }
                      />
                    </button>

                    <strong>
                      {
                        numberOfPeople
                      }
                    </strong>

                    <button
                      type="button"
                      aria-label="Add traveller"
                      onClick={() => {
                        setNumberOfPeople(
                          (
                            current,
                          ) =>
                            current +
                            1,
                        );

                        setBookingSuccess(
                          '',
                        );
                      }}
                    >
                      <Plus
                        size={
                          15
                        }
                      />
                    </button>
                  </div>
                </div>
              </div>

              <div
                className="bookingAddOns"
              >
                <div
                  className="bookingSectionTitle"
                >
                  <div>
                    <span>
                      OPTIONAL EXTRAS
                    </span>

                    <h3>
                      Add to your trip
                    </h3>
                  </div>

                  <small>
                    {
                      selectedAddOnIds.length
                    }{' '}

                    selected
                  </small>
                </div>

                <div
                  className="bookingAddOnList"
                >
                  {(selectedPackage
                    .addOns ??
                    []).map(
                    (
                      addOn,
                    ) => {
                      const selected =
                        selectedAddOnIds.includes(
                          addOn._id,
                        );

                      const amount =
                        addOn.pricingType ===
                        'PER_PERSON'
                          ? addOn.price *
                            numberOfPeople
                          : addOn.price;

                      return (
                        <button
                          type="button"
                          key={
                            addOn._id
                          }
                          className={`bookingAddOn${
                            selected
                              ? ' selected'
                              : ''
                          }`}
                          onClick={() =>
                            toggleAddOn(
                              addOn._id,
                            )
                          }
                        >
                          <span
                            className="bookingAddOnCheck"
                          >
                            {selected && (
                              <Check
                                size={
                                  14
                                }
                              />
                            )}
                          </span>

                          <span
                            className="bookingAddOnInfo"
                          >
                            <strong>
                              {
                                addOn.name
                              }
                            </strong>

                            <small>
                              {addOn.pricingType ===
                              'PER_PERSON'
                                ? `$${formatMoney(
                                    addOn.price,
                                  )} per person`
                                : `$${formatMoney(
                                    addOn.price,
                                  )} per booking`}
                            </small>
                          </span>

                          <strong
                            className="bookingAddOnAmount"
                          >
                            +{formatPrice(
                              amount,
                            )}
                          </strong>
                        </button>
                      );
                    },
                  )}

                  {!selectedPackage
                    .addOns
                    ?.length && (
                    <p>
                      No optional add-ons available for this package.
                    </p>
                  )}
                </div>
              </div>

              <div
                className="bookingPriceSummary"
              >
                <div>
                  <span>
                    Package{' '}

                    ({formatPrice(
                      selectedPackage.price,
                    )}

                    {' × '}

                    {
                      numberOfPeople
                    }

                    )
                  </span>

                  <strong>
                    {formatPrice(
                      baseTotal,
                    )}
                  </strong>
                </div>

                <div>
                  <span>
                    Travel Plan{' '}

                    {selectedTravelPlan
                      ? `(${selectedTravelPlan.name} · $${formatMoney(
                          selectedTravelPlan.price,
                        )} × ${numberOfPeople})`
                      : '(Not selected)'}
                  </span>

                  <strong>
                    {selectedTravelPlan
                      ? `$${formatMoney(
                          travelPlanTotal,
                        )}`
                      : '—'}
                  </strong>
                </div>

                <div>
                  <span>
                    Optional Add-ons
                  </span>

                  <strong>
                    {formatPrice(
                      addOnsTotal,
                    )}
                  </strong>
                </div>

                <div
                  className="bookingGrandTotal"
                >
                  <span>
                    Estimated Total
                  </span>

                  <strong>
                    {formatPrice(
                      estimatedTotal,
                    )}
                  </strong>
                </div>
              </div>

              {bookingError && (
                <div
                  className="bookingMessage bookingError"
                >
                  {
                    bookingError
                  }
                </div>
              )}

              {bookingSuccess && (
                <div
                  className="bookingMessage bookingSuccess"
                >
                  {
                    bookingSuccess
                  }
                </div>
              )}
            </div>

            <div
              className="bookingModalFooter"
            >
              <button
                type="button"
                className="bookingCancelButton"
                onClick={
                  closeBooking
                }
                disabled={
                  bookingSubmitting
                }
              >
                Cancel
              </button>

              {bookingSuccess ? (
                <button
                  type="button"
                  className="bookingConfirmButton"
                  onClick={() => {
                    closeBooking();
                    router.push('/traveller');
                  }}
                  style={{ background: '#059669', borderColor: '#059669', color: '#fff', cursor: 'pointer' }}
                >
                  Go to My Trips →
                </button>
              ) : (
                <button
                  type="button"
                  className="bookingConfirmButton"
                  onClick={() =>
                    void createBooking()
                  }
                  disabled={
                    bookingSubmitting ||
                    !selectedTravelPlan
                  }
                >
                  {bookingSubmitting
                    ? 'Creating Booking...'
                    : 'Confirm Booking'}
                </button>
              )}
            </div>
          </section>
        </div>
      )}

      {/* Package Itinerary & Day-by-Day Breakdown Modal */}
      <PackageItineraryModal
        packageData={itineraryModalPackage}
        isOpen={isItineraryModalOpen}
        onClose={closeItinerary}
        onBookNow={(pkg) => {
          void openBooking(pkg);
        }}
      />
    </main>
  );
}

export default function PackagesPage() {
  return (
    <Suspense fallback={<main className={styles.page}><p className={styles.message}>Loading packages...</p></main>}>
      <PackagesContent />
    </Suspense>
  );
}
