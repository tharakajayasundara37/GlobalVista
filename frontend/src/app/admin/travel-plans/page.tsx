'use client';

import {
  FormEvent,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';

import {
  useRouter,
} from 'next/navigation';

import {
  ArrowLeft,
  BadgeDollarSign,
  Check,
  CheckCircle2,
  Crown,
  Edit3,
  Eye,
  EyeOff,
  ListChecks,
  Plus,
  RefreshCw,
  Search,
  Trash2,
  X,
  XCircle,
} from 'lucide-react';

import styles from './page.module.css';

const API_URL =
  'http://localhost:3001';

/* =========================
   TYPES
========================= */

type TravelPlan = {
  _id: string;

  name: string;

  price: number;

  priceSuffix: string;

  features: string[];

  isPopular: boolean;

  isActive: boolean;

  sortOrder: number;

  createdAt?: string;

  updatedAt?: string;
};

type TravelPlanForm = {
  name: string;

  price: string;

  priceSuffix: string;

  features: string[];

  isPopular: boolean;

  isActive: boolean;

  sortOrder: string;
};

type StatusFilter =
  | 'ALL'
  | 'ACTIVE'
  | 'INACTIVE';

/* =========================
   DEFAULT FORM
========================= */

const emptyForm:
  TravelPlanForm = {
    name: '',

    price: '',

    priceSuffix:
      '/ person',

    features: [
      '',
    ],

    isPopular:
      false,

    isActive:
      true,

    sortOrder:
      '0',
  };

/* =========================
   HELPERS
========================= */

function getToken() {
  if (
    typeof window ===
    'undefined'
  ) {
    return '';
  }

  return (
    localStorage.getItem(
      'globalvista_token',
    ) ||
    localStorage.getItem(
      'token',
    ) ||
    ''
  );
}

function clearSession() {
  if (
    typeof window ===
    'undefined'
  ) {
    return;
  }

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
}

function formatMoney(
  value: number,
) {
  return new Intl.NumberFormat(
    'en-US',
    {
      minimumFractionDigits:
        0,

      maximumFractionDigits:
        2,
    },
  ).format(
    Number(
      value || 0,
    ),
  );
}

async function getApiError(
  response: Response,
) {
  try {
    const data =
      await response.json();

    if (
      Array.isArray(
        data?.message,
      )
    ) {
      return data.message.join(
        ', ',
      );
    }

    if (
      typeof data?.message ===
      'string'
    ) {
      return data.message;
    }
  } catch {
    //
  }

  return `Request failed (${response.status})`;
}

/* =========================
   PAGE
========================= */

export default function TravelPlansAdminPage() {
  const router =
    useRouter();

  /* =========================
     DATA STATE
  ========================= */

  const [
    plans,
    setPlans,
  ] =
    useState<
      TravelPlan[]
    >([]);

  const [
    loading,
    setLoading,
  ] =
    useState(
      true,
    );

  const [
    refreshing,
    setRefreshing,
  ] =
    useState(
      false,
    );

  const [
    pageError,
    setPageError,
  ] =
    useState(
      '',
    );

  /* =========================
     FILTER STATE
  ========================= */

  const [
    search,
    setSearch,
  ] =
    useState(
      '',
    );

  const [
    statusFilter,
    setStatusFilter,
  ] =
    useState<StatusFilter>(
      'ALL',
    );

  /* =========================
     FORM STATE
  ========================= */

  const [
    formOpen,
    setFormOpen,
  ] =
    useState(
      false,
    );

  const [
    editingPlan,
    setEditingPlan,
  ] =
    useState<
      TravelPlan | null
    >(
      null,
    );

  const [
    form,
    setForm,
  ] =
    useState<TravelPlanForm>(
      emptyForm,
    );

  const [
    formError,
    setFormError,
  ] =
    useState(
      '',
    );

  const [
    submitting,
    setSubmitting,
  ] =
    useState(
      false,
    );

  /* =========================
     DELETE STATE
  ========================= */

  const [
    deletingPlan,
    setDeletingPlan,
  ] =
    useState<
      TravelPlan | null
    >(
      null,
    );

  const [
    deleting,
    setDeleting,
  ] =
    useState(
      false,
    );

  /* =========================
     LOAD PLANS
  ========================= */

  const loadPlans =
    useCallback(
      async (
        showRefresh =
          false,
      ) => {
        /*
         * Keeps the initial
         * effect asynchronous,
         * avoiding synchronous
         * setState in useEffect.
         */
        const token =
          getToken();

        if (
          !token
        ) {
          clearSession();

          router.replace(
            '/login',
          );

          return;
        }

        try {
          if (
            showRefresh
          ) {
            setRefreshing(
              true,
            );
          }

          setPageError(
            '',
          );

          const response =
            await fetch(
              `${API_URL}/travel-plans`,
              {
                method:
                  'GET',

                headers: {
                  Authorization:
                    `Bearer ${token}`,
                },

                cache:
                  'no-store',
              },
            );

          if (
            response.status ===
              401 ||
            response.status ===
              403
          ) {
            clearSession();

            router.replace(
              '/login',
            );

            return;
          }

          if (
            !response.ok
          ) {
            throw new Error(
              await getApiError(
                response,
              ),
            );
          }

          const data:
            TravelPlan[] =
            await response.json();

          setPlans(
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
            'Travel plans load error:',
            error,
          );

          setPageError(
            error instanceof Error
              ? error.message
              : 'Unable to load travel plans.',
          );
        } finally {
          setLoading(
            false,
          );

          setRefreshing(
            false,
          );
        }
      },
      [
        router,
      ],
    );

useEffect(() => {
  const timer =
    window.setTimeout(
      () => {
        void loadPlans();
      },
      0,
    );

  return () => {
    window.clearTimeout(
      timer,
    );
  };
}, [
  loadPlans,
]);

  /* =========================
     FILTERED DATA
  ========================= */

  const filteredPlans =
    useMemo(
      () => {
        const query =
          search
            .trim()
            .toLowerCase();

        return plans.filter(
          (
            plan,
          ) => {
            const matchesSearch =
              !query ||
              [
                plan.name,
                plan.priceSuffix,
                ...(
                  plan.features ||
                  []
                ),
              ].some(
                (
                  value,
                ) =>
                  String(
                    value ||
                      '',
                  )
                    .toLowerCase()
                    .includes(
                      query,
                    ),
              );

            const matchesStatus =
              statusFilter ===
                'ALL' ||
              (
                statusFilter ===
                'ACTIVE'
              ) ===
                Boolean(
                  plan.isActive,
                );

            return (
              matchesSearch &&
              matchesStatus
            );
          },
        );
      },
      [
        plans,
        search,
        statusFilter,
      ],
    );

  /* =========================
     SUMMARY
  ========================= */

  const activeCount =
    plans.filter(
      (
        plan,
      ) =>
        plan.isActive,
    ).length;

  const inactiveCount =
    plans.length -
    activeCount;

  const popularPlan =
    plans.find(
      (
        plan,
      ) =>
        plan.isPopular,
    );

  /* =========================
     OPEN CREATE
  ========================= */

  const openCreate =
    () => {
      setEditingPlan(
        null,
      );

      setForm({
        ...emptyForm,

        features: [
          '',
        ],
      });

      setFormError(
        '',
      );

      setFormOpen(
        true,
      );
    };

  /* =========================
     OPEN EDIT
  ========================= */

  const openEdit =
    (
      plan:
        TravelPlan,
    ) => {
      setEditingPlan(
        plan,
      );

      setForm({
        name:
          plan.name,

        price:
          String(
            plan.price,
          ),

        priceSuffix:
          plan.priceSuffix ||
          '/ person',

        features:
          plan.features
            ?.length
            ? [
                ...plan.features,
              ]
            : [
                '',
              ],

        isPopular:
          Boolean(
            plan.isPopular,
          ),

        isActive:
          Boolean(
            plan.isActive,
          ),

        sortOrder:
          String(
            plan.sortOrder ??
              0,
          ),
      });

      setFormError(
        '',
      );

      setFormOpen(
        true,
      );
    };

  /* =========================
     CLOSE FORM
  ========================= */

  const closeForm =
    () => {
      if (
        submitting
      ) {
        return;
      }

      setFormOpen(
        false,
      );

      setEditingPlan(
        null,
      );

      setFormError(
        '',
      );
    };

  /* =========================
     FEATURE MANAGEMENT
  ========================= */

  const updateFeature =
    (
      index:
        number,

      value:
        string,
    ) => {
      setForm(
        (
          current,
        ) => ({
          ...current,

          features:
            current.features.map(
              (
                feature,
                featureIndex,
              ) =>
                featureIndex ===
                index
                  ? value
                  : feature,
            ),
        }),
      );
    };

  const addFeature =
    () => {
      if (
        form.features
          .length >=
        10
      ) {
        setFormError(
          'Maximum 10 features are allowed.',
        );

        return;
      }

      setForm(
        (
          current,
        ) => ({
          ...current,

          features: [
            ...current.features,
            '',
          ],
        }),
      );

      setFormError(
        '',
      );
    };

  const removeFeature =
    (
      index:
        number,
    ) => {
      setForm(
        (
          current,
        ) => {
          const updated =
            current.features.filter(
              (
                _,
                featureIndex,
              ) =>
                featureIndex !==
                index,
            );

          return {
            ...current,

            features:
              updated.length >
              0
                ? updated
                : [
                    '',
                  ],
          };
        },
      );
    };

  /* =========================
     SET ONLY ONE POPULAR PLAN

     Frontend enforces one
     featured plan.

     We can additionally enforce
     this in backend later.
  ========================= */

  const clearOtherPopularPlans =
    async (
      currentPlanId:
        string,
    ) => {
      const token =
        getToken();

      const others =
        plans.filter(
          (
            plan,
          ) =>
            plan._id !==
              currentPlanId &&
            plan.isPopular,
        );

      await Promise.all(
        others.map(
          (
            plan,
          ) =>
            fetch(
              `${API_URL}/travel-plans/${plan._id}`,
              {
                method:
                  'PATCH',

                headers: {
                  Authorization:
                    `Bearer ${token}`,

                  'Content-Type':
                    'application/json',
                },

                body:
                  JSON.stringify(
                    {
                      isPopular:
                        false,
                    },
                  ),
              },
            ),
        ),
      );
    };

  /* =========================
     SUBMIT FORM
  ========================= */

  const handleSubmit =
    async (
      event:
        FormEvent<HTMLFormElement>,
    ) => {
      event.preventDefault();

      setFormError(
        '',
      );

      const name =
        form.name.trim();

      const price =
        Number(
          form.price,
        );

      const sortOrder =
        Number(
          form.sortOrder,
        );

      const priceSuffix =
        form.priceSuffix.trim() ||
        '/ person';

      const features =
        form.features
          .map(
            (
              feature,
            ) =>
              feature.trim(),
          )
          .filter(
            Boolean,
          );

      if (
        !name
      ) {
        setFormError(
          'Plan name is required.',
        );

        return;
      }

      if (
        !Number.isFinite(
          price,
        ) ||
        price <
          0
      ) {
        setFormError(
          'Enter a valid plan price.',
        );

        return;
      }

      if (
        features.length ===
        0
      ) {
        setFormError(
          'Add at least one plan feature.',
        );

        return;
      }

      if (
        !Number.isInteger(
          sortOrder,
        ) ||
        sortOrder <
          0
      ) {
        setFormError(
          'Sort order must be 0 or a positive whole number.',
        );

        return;
      }

      const token =
        getToken();

      if (
        !token
      ) {
        clearSession();

        router.replace(
          '/login',
        );

        return;
      }

      setSubmitting(
        true,
      );

      try {
        const payload = {
          name,

          price,

          priceSuffix,

          features,

          isPopular:
            form.isPopular,

          isActive:
            form.isActive,

          sortOrder,
        };

        const url =
          editingPlan
            ? `${API_URL}/travel-plans/${editingPlan._id}`
            : `${API_URL}/travel-plans`;

        const response =
          await fetch(
            url,
            {
              method:
                editingPlan
                  ? 'PATCH'
                  : 'POST',

              headers: {
                Authorization:
                  `Bearer ${token}`,

                'Content-Type':
                  'application/json',
              },

              body:
                JSON.stringify(
                  payload,
                ),
            },
          );

        if (
          response.status ===
            401 ||
          response.status ===
            403
        ) {
          clearSession();

          router.replace(
            '/login',
          );

          return;
        }

        if (
          !response.ok
        ) {
          throw new Error(
            await getApiError(
              response,
            ),
          );
        }

        const savedPlan:
          TravelPlan =
          await response.json();

        if (
          form.isPopular
        ) {
          await clearOtherPopularPlans(
            savedPlan._id,
          );
        }

        setFormOpen(
          false,
        );

        setEditingPlan(
          null,
        );

        await loadPlans();
      } catch (
        error
      ) {
        console.error(
          'Save travel plan error:',
          error,
        );

        setFormError(
          error instanceof Error
            ? error.message
            : 'Unable to save travel plan.',
        );
      } finally {
        setSubmitting(
          false,
        );
      }
    };

  /* =========================
     QUICK ACTIVE TOGGLE
  ========================= */

  const toggleActive =
    async (
      plan:
        TravelPlan,
    ) => {
      const token =
        getToken();

      if (
        !token
      ) {
        router.replace(
          '/login',
        );

        return;
      }

      try {
        const response =
          await fetch(
            `${API_URL}/travel-plans/${plan._id}`,
            {
              method:
                'PATCH',

              headers: {
                Authorization:
                  `Bearer ${token}`,

                'Content-Type':
                  'application/json',
              },

              body:
                JSON.stringify(
                  {
                    isActive:
                      !plan.isActive,
                  },
                ),
            },
          );

        if (
          response.status ===
            401 ||
          response.status ===
            403
        ) {
          clearSession();

          router.replace(
            '/login',
          );

          return;
        }

        if (
          !response.ok
        ) {
          throw new Error(
            await getApiError(
              response,
            ),
          );
        }

        await loadPlans();
      } catch (
        error
      ) {
        setPageError(
          error instanceof Error
            ? error.message
            : 'Unable to update plan status.',
        );
      }
    };

  /* =========================
     QUICK POPULAR TOGGLE
  ========================= */

  const makePopular =
    async (
      plan:
        TravelPlan,
    ) => {
      const token =
        getToken();

      if (
        !token
      ) {
        router.replace(
          '/login',
        );

        return;
      }

      try {
        const response =
          await fetch(
            `${API_URL}/travel-plans/${plan._id}`,
            {
              method:
                'PATCH',

              headers: {
                Authorization:
                  `Bearer ${token}`,

                'Content-Type':
                  'application/json',
              },

              body:
                JSON.stringify(
                  {
                    isPopular:
                      !plan.isPopular,
                  },
                ),
            },
          );

        if (
          response.status ===
            401 ||
          response.status ===
            403
        ) {
          clearSession();

          router.replace(
            '/login',
          );

          return;
        }

        if (
          !response.ok
        ) {
          throw new Error(
            await getApiError(
              response,
            ),
          );
        }

        if (
          !plan.isPopular
        ) {
          await clearOtherPopularPlans(
            plan._id,
          );
        }

        await loadPlans();
      } catch (
        error
      ) {
        setPageError(
          error instanceof Error
            ? error.message
            : 'Unable to update popular plan.',
        );
      }
    };

  /* =========================
     DELETE
  ========================= */

  const handleDelete =
    async () => {
      if (
        !deletingPlan
      ) {
        return;
      }

      const token =
        getToken();

      if (
        !token
      ) {
        router.replace(
          '/login',
        );

        return;
      }

      setDeleting(
        true,
      );

      try {
        const response =
          await fetch(
            `${API_URL}/travel-plans/${deletingPlan._id}`,
            {
              method:
                'DELETE',

              headers: {
                Authorization:
                  `Bearer ${token}`,
              },
            },
          );

        if (
          response.status ===
            401 ||
          response.status ===
            403
        ) {
          clearSession();

          router.replace(
            '/login',
          );

          return;
        }

        if (
          !response.ok
        ) {
          throw new Error(
            await getApiError(
              response,
            ),
          );
        }

        setDeletingPlan(
          null,
        );

        await loadPlans();
      } catch (
        error
      ) {
        setPageError(
          error instanceof Error
            ? error.message
            : 'Unable to delete travel plan.',
        );
      } finally {
        setDeleting(
          false,
        );
      }
    };

  /* =========================
     LOADING
  ========================= */

  if (
    loading
  ) {
    return (
      <main
        className={
          styles.loadingPage
        }
      >
        <div
          className={
            styles.loader
          }
        />

        <span>
          Loading travel
          plans...
        </span>
      </main>
    );
  }

  /* =========================
     UI
  ========================= */

  return (
    <main
      className={
        styles.page
      }
    >
      <section
        className={
          styles.shell
        }
      >
        {/* HEADER */}

        <header
          className={
            styles.header
          }
        >
          <div
            className={
              styles.headerLeft
            }
          >
            <button
              type="button"
              className={
                styles.backButton
              }
              onClick={() =>
                router.push(
                  '/admin',
                )
              }
              aria-label="Back to admin dashboard"
            >
              <ArrowLeft
                size={
                  18
                }
              />
            </button>

            <div>
              <span>
                PRICING &
                SERVICES
              </span>

              <h1>
                Travel Plans
                Management
              </h1>

              <p>
                Manage
                GlobalVista
                travel plans,
                pricing,
                features and
                availability.
              </p>
            </div>
          </div>

          <div
            className={
              styles.headerActions
            }
          >
            <button
              type="button"
              className={
                styles.refreshButton
              }
              onClick={() =>
                void loadPlans(
                  true,
                )
              }
              disabled={
                refreshing
              }
            >
              <RefreshCw
                size={
                  16
                }
                className={
                  refreshing
                    ? styles.spin
                    : ''
                }
              />

              Refresh
            </button>

            <button
              type="button"
              className={
                styles.addButton
              }
              onClick={
                openCreate
              }
            >
              <Plus
                size={
                  17
                }
              />

              Add Plan
            </button>
          </div>
        </header>

        {/* SUMMARY */}

        <section
          className={
            styles.summaryGrid
          }
        >
          <article
            className={
              styles.summaryCard
            }
          >
            <div
              className={`${styles.summaryIcon} ${styles.blueIcon}`}
            >
              <ListChecks
                size={
                  20
                }
              />
            </div>

            <div>
              <span>
                Total Plans
              </span>

              <strong>
                {
                  plans.length
                }
              </strong>
            </div>
          </article>

          <article
            className={
              styles.summaryCard
            }
          >
            <div
              className={`${styles.summaryIcon} ${styles.greenIcon}`}
            >
              <CheckCircle2
                size={
                  20
                }
              />
            </div>

            <div>
              <span>
                Active
              </span>

              <strong>
                {
                  activeCount
                }
              </strong>
            </div>
          </article>

          <article
            className={
              styles.summaryCard
            }
          >
            <div
              className={`${styles.summaryIcon} ${styles.redIcon}`}
            >
              <XCircle
                size={
                  20
                }
              />
            </div>

            <div>
              <span>
                Inactive
              </span>

              <strong>
                {
                  inactiveCount
                }
              </strong>
            </div>
          </article>

          <article
            className={
              styles.summaryCard
            }
          >
            <div
              className={`${styles.summaryIcon} ${styles.goldIcon}`}
            >
              <Crown
                size={
                  20
                }
              />
            </div>

            <div>
              <span>
                Most Popular
              </span>

              <strong
                className={
                  styles.summaryTextValue
                }
              >
                {popularPlan
                  ?.name ||
                  'None'}
              </strong>
            </div>
          </article>
        </section>

        {/* ERROR */}

        {pageError && (
          <div
            className={
              styles.errorBanner
            }
          >
            <XCircle
              size={
                18
              }
            />

            <span>
              {
                pageError
              }
            </span>

            <button
              type="button"
              onClick={() =>
                setPageError(
                  '',
                )
              }
            >
              <X
                size={
                  16
                }
              />
            </button>
          </div>
        )}

        {/* TOOLBAR */}

        <section
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
              size={
                17
              }
            />

            <input
              type="text"
              placeholder="Search plans or features..."
              value={
                search
              }
              onChange={(
                event,
              ) =>
                setSearch(
                  event
                    .target
                    .value,
                )
              }
            />
          </div>

          <div
            className={
              styles.filterGroup
            }
          >
            <button
              type="button"
              className={
                statusFilter ===
                'ALL'
                  ? styles.filterActive
                  : styles.filterButton
              }
              onClick={() =>
                setStatusFilter(
                  'ALL',
                )
              }
            >
              All
            </button>

            <button
              type="button"
              className={
                statusFilter ===
                'ACTIVE'
                  ? styles.filterActive
                  : styles.filterButton
              }
              onClick={() =>
                setStatusFilter(
                  'ACTIVE',
                )
              }
            >
              Active
            </button>

            <button
              type="button"
              className={
                statusFilter ===
                'INACTIVE'
                  ? styles.filterActive
                  : styles.filterButton
              }
              onClick={() =>
                setStatusFilter(
                  'INACTIVE',
                )
              }
            >
              Inactive
            </button>
          </div>
        </section>

        {/* PLANS */}

        {filteredPlans.length ===
        0 ? (
          <section
            className={
              styles.emptyState
            }
          >
            <ListChecks
              size={
                42
              }
            />

            <h3>
              No travel plans
              found
            </h3>

            <p>
              Change the
              filters or create
              a new travel
              plan.
            </p>

            <button
              type="button"
              onClick={
                openCreate
              }
            >
              <Plus
                size={
                  16
                }
              />

              Add Travel Plan
            </button>
          </section>
        ) : (
          <section
            className={
              styles.plansGrid
            }
          >
            {filteredPlans.map(
              (
                plan,
              ) => (
                <article
                  key={
                    plan._id
                  }
                  className={`${styles.planCard} ${
                    plan.isPopular
                      ? styles.popularCard
                      : ''
                  }`}
                >
                  {plan.isPopular && (
                    <div
                      className={
                        styles.popularBadge
                      }
                    >
                      <Crown
                        size={
                          13
                        }
                      />

                      MOST POPULAR
                    </div>
                  )}

                  <div
                    className={
                      styles.cardTop
                    }
                  >
                    <div>
                      <span
                        className={
                          styles.planLabel
                        }
                      >
                        TRAVEL PLAN
                      </span>

                      <h2>
                        {
                          plan.name
                        }
                      </h2>
                    </div>

                    <span
                      className={
                        plan.isActive
                          ? styles.activeBadge
                          : styles.inactiveBadge
                      }
                    >
                      {plan.isActive
                        ? 'Active'
                        : 'Inactive'}
                    </span>
                  </div>

                  <div
                    className={
                      styles.priceBlock
                    }
                  >
                    <BadgeDollarSign
                      size={
                        21
                      }
                    />

                    <strong>
                      $
                      {formatMoney(
                        plan.price,
                      )}
                    </strong>

                    <span>
                      {
                        plan.priceSuffix
                      }
                    </span>
                  </div>

                  <div
                    className={
                      styles.features
                    }
                  >
                    <span
                      className={
                        styles.featureTitle
                      }
                    >
                      Included
                      features
                    </span>

                    {plan.features.map(
                      (
                        feature,
                        index,
                      ) => (
                        <div
                          key={`${plan._id}-${index}`}
                          className={
                            styles.featureItem
                          }
                        >
                          <Check
                            size={
                              15
                            }
                          />

                          <span>
                            {
                              feature
                            }
                          </span>
                        </div>
                      ),
                    )}
                  </div>

                  <div
                    className={
                      styles.cardMeta
                    }
                  >
                    <span>
                      Display
                      order
                    </span>

                    <strong>
                      #
                      {
                        plan.sortOrder
                      }
                    </strong>
                  </div>

                  <div
                    className={
                      styles.cardActions
                    }
                  >
                    <button
                      type="button"
                      className={
                        styles.editButton
                      }
                      onClick={() =>
                        openEdit(
                          plan,
                        )
                      }
                    >
                      <Edit3
                        size={
                          15
                        }
                      />

                      Edit
                    </button>

                    <button
                      type="button"
                      className={
                        styles.iconButton
                      }
                      onClick={() =>
                        void toggleActive(
                          plan,
                        )
                      }
                      title={
                        plan.isActive
                          ? 'Make inactive'
                          : 'Make active'
                      }
                    >
                      {plan.isActive ? (
                        <Eye
                          size={
                            16
                          }
                        />
                      ) : (
                        <EyeOff
                          size={
                            16
                          }
                        />
                      )}
                    </button>

                    <button
                      type="button"
                      className={`${styles.iconButton} ${
                        plan.isPopular
                          ? styles.popularAction
                          : ''
                      }`}
                      onClick={() =>
                        void makePopular(
                          plan,
                        )
                      }
                      title="Set most popular"
                    >
                      <Crown
                        size={
                          16
                        }
                      />
                    </button>

                    <button
                      type="button"
                      className={`${styles.iconButton} ${styles.deleteButton}`}
                      onClick={() =>
                        setDeletingPlan(
                          plan,
                        )
                      }
                      title="Delete plan"
                    >
                      <Trash2
                        size={
                          16
                        }
                      />
                    </button>
                  </div>
                </article>
              ),
            )}
          </section>
        )}
      </section>

      {/* =====================
          CREATE / EDIT MODAL
      ===================== */}

      {formOpen && (
        <div
          className={
            styles.modalBackdrop
          }
          onMouseDown={(
            event,
          ) => {
            if (
              event.target ===
              event.currentTarget
            ) {
              closeForm();
            }
          }}
        >
          <section
            className={
              styles.modal
            }
          >
            <header
              className={
                styles.modalHeader
              }
            >
              <div>
                <span>
                  {editingPlan
                    ? 'EDIT TRAVEL PLAN'
                    : 'NEW TRAVEL PLAN'}
                </span>

                <h2>
                  {editingPlan
                    ? `Edit ${editingPlan.name}`
                    : 'Create Travel Plan'}
                </h2>

                <p>
                  Configure the
                  plan pricing,
                  features and
                  visibility.
                </p>
              </div>

              <button
                type="button"
                onClick={
                  closeForm
                }
                disabled={
                  submitting
                }
              >
                <X
                  size={
                    20
                  }
                />
              </button>
            </header>

            <form
              onSubmit={
                handleSubmit
              }
              className={
                styles.form
              }
            >
              {formError && (
                <div
                  className={
                    styles.formError
                  }
                >
                  <XCircle
                    size={
                      17
                    }
                  />

                  {
                    formError
                  }
                </div>
              )}

              <div
                className={
                  styles.formGrid
                }
              >
                <label
                  className={
                    styles.field
                  }
                >
                  <span>
                    Plan Name
                  </span>

                  <input
                    type="text"
                    placeholder="Premium"
                    maxLength={
                      60
                    }
                    value={
                      form.name
                    }
                    onChange={(
                      event,
                    ) =>
                      setForm(
                        (
                          current,
                        ) => ({
                          ...current,

                          name:
                            event
                              .target
                              .value,
                        }),
                      )
                    }
                  />
                </label>

                <label
                  className={
                    styles.field
                  }
                >
                  <span>
                    Price
                  </span>

                  <div
                    className={
                      styles.moneyInput
                    }
                  >
                    <strong>
                      $
                    </strong>

                    <input
                      type="number"
                      min={
                        0
                      }
                      step="0.01"
                      placeholder="999"
                      value={
                        form.price
                      }
                      onChange={(
                        event,
                      ) =>
                        setForm(
                          (
                            current,
                          ) => ({
                            ...current,

                            price:
                              event
                                .target
                                .value,
                          }),
                        )
                      }
                    />
                  </div>
                </label>

                <label
                  className={
                    styles.field
                  }
                >
                  <span>
                    Price Suffix
                  </span>

                  <input
                    type="text"
                    placeholder="/ person"
                    maxLength={
                      40
                    }
                    value={
                      form.priceSuffix
                    }
                    onChange={(
                      event,
                    ) =>
                      setForm(
                        (
                          current,
                        ) => ({
                          ...current,

                          priceSuffix:
                            event
                              .target
                              .value,
                        }),
                      )
                    }
                  />
                </label>

                <label
                  className={
                    styles.field
                  }
                >
                  <span>
                    Display Order
                  </span>

                  <input
                    type="number"
                    min={
                      0
                    }
                    step={
                      1
                    }
                    placeholder="1"
                    value={
                      form.sortOrder
                    }
                    onChange={(
                      event,
                    ) =>
                      setForm(
                        (
                          current,
                        ) => ({
                          ...current,

                          sortOrder:
                            event
                              .target
                              .value,
                        }),
                      )
                    }
                  />
                </label>
              </div>

              {/* FEATURES */}

              <section
                className={
                  styles.featuresEditor
                }
              >
                <div
                  className={
                    styles.featuresEditorHeader
                  }
                >
                  <div>
                    <span>
                      Plan
                      Features
                    </span>

                    <small>
                      Maximum 10
                      features
                    </small>
                  </div>

                  <button
                    type="button"
                    onClick={
                      addFeature
                    }
                    disabled={
                      form.features
                        .length >=
                      10
                    }
                  >
                    <Plus
                      size={
                        15
                      }
                    />

                    Add Feature
                  </button>
                </div>

                <div
                  className={
                    styles.featureInputs
                  }
                >
                  {form.features.map(
                    (
                      feature,
                      index,
                    ) => (
                      <div
                        key={
                          index
                        }
                        className={
                          styles.featureInputRow
                        }
                      >
                        <div
                          className={
                            styles.featureNumber
                          }
                        >
                          {
                            index +
                            1
                          }
                        </div>

                        <input
                          type="text"
                          maxLength={
                            120
                          }
                          placeholder="e.g. 5-star hotels"
                          value={
                            feature
                          }
                          onChange={(
                            event,
                          ) =>
                            updateFeature(
                              index,
                              event
                                .target
                                .value,
                            )
                          }
                        />

                        <button
                          type="button"
                          onClick={() =>
                            removeFeature(
                              index,
                            )
                          }
                          aria-label="Remove feature"
                        >
                          <Trash2
                            size={
                              15
                            }
                          />
                        </button>
                      </div>
                    ),
                  )}
                </div>
              </section>

              {/* SWITCHES */}

              <section
                className={
                  styles.switchGrid
                }
              >
                <button
                  type="button"
                  className={`${styles.switchCard} ${
                    form.isActive
                      ? styles.switchCardActive
                      : ''
                  }`}
                  onClick={() =>
                    setForm(
                      (
                        current,
                      ) => ({
                        ...current,

                        isActive:
                          !current.isActive,
                      }),
                    )
                  }
                >
                  <div
                    className={
                      styles.switchCardIcon
                    }
                  >
                    <Eye
                      size={
                        18
                      }
                    />
                  </div>

                  <div>
                    <strong>
                      Active Plan
                    </strong>

                    <span>
                      Show this
                      plan to
                      travellers
                    </span>
                  </div>

                  <div
                    className={`${styles.toggle} ${
                      form.isActive
                        ? styles.toggleOn
                        : ''
                    }`}
                  >
                    <span />
                  </div>
                </button>

                <button
                  type="button"
                  className={`${styles.switchCard} ${
                    form.isPopular
                      ? styles.switchCardPopular
                      : ''
                  }`}
                  onClick={() =>
                    setForm(
                      (
                        current,
                      ) => ({
                        ...current,

                        isPopular:
                          !current.isPopular,
                      }),
                    )
                  }
                >
                  <div
                    className={
                      styles.switchCardIcon
                    }
                  >
                    <Crown
                      size={
                        18
                      }
                    />
                  </div>

                  <div>
                    <strong>
                      Most Popular
                    </strong>

                    <span>
                      Highlight this
                      plan on the
                      homepage
                    </span>
                  </div>

                  <div
                    className={`${styles.toggle} ${
                      form.isPopular
                        ? styles.toggleOn
                        : ''
                    }`}
                  >
                    <span />
                  </div>
                </button>
              </section>

              {/* ACTIONS */}

              <footer
                className={
                  styles.modalFooter
                }
              >
                <button
                  type="button"
                  className={
                    styles.cancelButton
                  }
                  onClick={
                    closeForm
                  }
                  disabled={
                    submitting
                  }
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className={
                    styles.saveButton
                  }
                  disabled={
                    submitting
                  }
                >
                  {submitting ? (
                    <>
                      <RefreshCw
                        size={
                          16
                        }
                        className={
                          styles.spin
                        }
                      />

                      Saving...
                    </>
                  ) : (
                    <>
                      <Check
                        size={
                          16
                        }
                      />

                      {editingPlan
                        ? 'Save Changes'
                        : 'Create Plan'}
                    </>
                  )}
                </button>
              </footer>
            </form>
          </section>
        </div>
      )}

      {/* =====================
          DELETE MODAL
      ===================== */}

      {deletingPlan && (
        <div
          className={
            styles.modalBackdrop
          }
        >
          <section
            className={
              styles.deleteModal
            }
          >
            <div
              className={
                styles.deleteIcon
              }
            >
              <Trash2
                size={
                  24
                }
              />
            </div>

            <h2>
              Delete Travel
              Plan?
            </h2>

            <p>
              You are about to
              delete{' '}
              <strong>
                {
                  deletingPlan.name
                }
              </strong>
              . This action
              cannot be undone.
            </p>

            <div
              className={
                styles.deleteActions
              }
            >
              <button
                type="button"
                className={
                  styles.cancelButton
                }
                onClick={() =>
                  setDeletingPlan(
                    null,
                  )
                }
                disabled={
                  deleting
                }
              >
                Cancel
              </button>

              <button
                type="button"
                className={
                  styles.confirmDeleteButton
                }
                onClick={() =>
                  void handleDelete()
                }
                disabled={
                  deleting
                }
              >
                {deleting ? (
                  <>
                    <RefreshCw
                      size={
                        16
                      }
                      className={
                        styles.spin
                      }
                    />

                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2
                      size={
                        16
                      }
                    />

                    Delete Plan
                  </>
                )}
              </button>
            </div>
          </section>
        </div>
      )}
    </main>
  );
}