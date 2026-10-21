import { API_BASE_URL } from '../constants/config';

export interface ApiPackage {
  _id: string;
  title: string;
  destination: string;
  country: string;
  duration: string;
  price: number;
  category: string;
  description: string;
  included: string[];
  addOns?: Array<{
    _id: string;
    name: string;
    price: number;
    pricingType: 'PER_PERSON' | 'PER_BOOKING';
  }>;
  images: string[];
  availability: boolean;
  isSpecialOffer?: boolean;
  originalPrice?: number;
  discountPercentage?: number;
  reviewInfo?: {
    averageRating: number;
    totalReviews: number;
  };
}

export interface ApiDestination {
  _id: string;
  name: string;
  country: string;
  images?: string[];
  rating?: number;
  bestTimeToVisit?: string;
  isActive?: boolean;
  description?: string;
}

export interface ApiTravelPlan {
  _id: string;
  name: string;
  price: number;
  priceSuffix?: string;
  features: string[];
  isPopular?: boolean;
  isActive?: boolean;
  sortOrder?: number;
}

export interface ApiUser {
  id: string;
  _id?: string;
  publicId?: string;
  name: string;
  email: string;
  role: 'USER' | 'GUIDE' | 'ADMIN';
  mobile?: string;
  country?: string;
  city?: string;
  languages?: string[];
  experienceYears?: number;
  guideStatus?: 'PENDING' | 'APPROVED' | 'REJECTED' | 'SUSPENDED' | null;
  profileImage?: string;
  about?: string;
}

export interface ApiBooking {
  _id: string;
  userId?: any;
  packageId?: ApiPackage | string;
  travelPlanId?: string;
  selectedTravelPlan?: {
    name: string;
    price: number;
    priceSuffix?: string;
    features?: string[];
    calculatedAmount?: number;
  };
  travelDate: string;
  numberOfPeople: number;
  basePrice?: number;
  baseTotal?: number;
  selectedAddOns?: Array<{
    addOnId?: string;
    name: string;
    price: number;
    pricingType?: string;
    quantity?: number;
    calculatedAmount?: number;
  }>;
  addOnsTotal?: number;
  totalPrice: number;
  status?: 'PENDING' | 'CONFIRMED' | 'CANCELLED';
  paymentStatus?: 'UNPAID' | 'PAID' | 'REFUNDED';
  paymentMethod?: string;
  createdAt?: string;
}

export interface ApiAdminStats {
  totalAccounts: number;
  totalUsers: number;
  totalGuides: number;
  pendingGuides: number;
  approvedGuides: number;
  rejectedGuides: number;
  totalPackages: number;
  totalBookings: number;
  totalPayments: number;
  totalRevenue: number;
  pendingBookings: number;
  confirmedBookings: number;
}

export interface ApiPayment {
  _id: string;
  bookingId: string;
  userId: string;
  amount: number;
  paymentMethod: string;
  transactionId: string;
  status: 'PENDING' | 'COMPLETED' | 'FAILED';
  createdAt: string;
}

const LUXURY_FALLBACKS: Record<string, string> = {
  japan: 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?auto=format&fit=crop&w=1200&q=80',
  kyoto: 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?auto=format&fit=crop&w=1200&q=80',
  tokyo: 'https://images.unsplash.com/photo-1503899036084-c55cdd92da26?auto=format&fit=crop&w=1200&q=80',
  fuji: 'https://images.unsplash.com/photo-1578637387939-43c525550085?auto=format&fit=crop&w=1200&q=80',
  maldives: 'https://images.unsplash.com/photo-1514282401047-d79a71a590e8?auto=format&fit=crop&w=1200&q=80',
  male: 'https://images.unsplash.com/photo-1514282401047-d79a71a590e8?auto=format&fit=crop&w=1200&q=80',
  switzerland: 'https://images.unsplash.com/photo-1530122037265-a5f1f91d3b99?auto=format&fit=crop&w=1200&q=80',
  interlaken: 'https://images.unsplash.com/photo-1530122037265-a5f1f91d3b99?auto=format&fit=crop&w=1200&q=80',
  alps: 'https://images.unsplash.com/photo-1530122037265-a5f1f91d3b99?auto=format&fit=crop&w=1200&q=80',
  'sri lanka': 'https://images.unsplash.com/photo-1588598198321-9735fd52455b?auto=format&fit=crop&w=1200&q=80',
  sigiriya: 'https://images.unsplash.com/photo-1588598198321-9735fd52455b?auto=format&fit=crop&w=1200&q=80',
  bali: 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?auto=format&fit=crop&w=1200&q=80',
  ubud: 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?auto=format&fit=crop&w=1200&q=80',
  thailand: 'https://images.unsplash.com/photo-1552465011-b4e21bf6e79a?auto=format&fit=crop&w=1200&q=80',
  phuket: 'https://images.unsplash.com/photo-1589394815804-964ed0be2eb5?auto=format&fit=crop&w=1200&q=80',
};

export const normalizeMediaUrl = (
  rawUrl: string | null | undefined,
  contextKeywords?: string
): string => {
  if (!rawUrl || typeof rawUrl !== 'string' || rawUrl.trim().length === 0) {
    if (contextKeywords) {
      const lower = contextKeywords.toLowerCase();
      for (const [key, fallback] of Object.entries(LUXURY_FALLBACKS)) {
        if (lower.includes(key)) return fallback;
      }
    }
    return 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80';
  }

  let url = rawUrl.trim();

  // If URL points to localhost/127.0.0.1, rewrite to API_BASE_URL (LAN IP for real devices)
  url = url.replace(/^http:\/\/(localhost|127\.0\.0\.1):3001/, API_BASE_URL);
  url = url.replace(/^http:\/\/(localhost|127\.0\.0\.1):3000/, API_BASE_URL);

  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }

  // Handle /images/... or images/... (public static)
  if (url.startsWith('/images/')) {
    return `${API_BASE_URL}/uploads${url.replace('/images', '')}`;
  }
  if (url.startsWith('images/')) {
    return `${API_BASE_URL}/uploads/${url.replace('images/', '')}`;
  }

  // Handle /uploads/... or uploads/...
  if (url.startsWith('/uploads/')) {
    return `${API_BASE_URL}${url}`;
  }
  if (url.startsWith('uploads/')) {
    return `${API_BASE_URL}/${url}`;
  }

  // Raw filename (e.g., 'japan-tour-1.jpg')
  return `${API_BASE_URL}/uploads/${url}`;
};

export const getPackageImage = (pkg: ApiPackage | null | undefined): string => {
  const keywords = `${pkg?.title || ''} ${pkg?.destination || ''} ${pkg?.country || ''}`;
  const firstImage = pkg?.images && pkg.images.length > 0 ? pkg.images[0] : null;
  return normalizeMediaUrl(firstImage, keywords);
};

export const getDestinationImage = (dest: ApiDestination | null | undefined): string => {
  const keywords = `${dest?.name || ''} ${dest?.country || ''}`;
  const firstImage = dest?.images && dest.images.length > 0 ? dest.images[0] : null;
  return normalizeMediaUrl(firstImage, keywords);
};

export const api = {
  async getPackages(search?: string): Promise<ApiPackage[]> {
    try {
      const url = search
        ? `${API_BASE_URL}/packages?search=${encodeURIComponent(search)}`
        : `${API_BASE_URL}/packages`;
      const res = await fetch(url);
      if (!res.ok) throw new Error('Failed to fetch packages');
      const data = await res.json();
      return Array.isArray(data) ? data : data.packages || [];
    } catch (err) {
      console.warn('API getPackages error:', err);
      return [];
    }
  },

  async getPackageById(id: string): Promise<ApiPackage | null> {
    try {
      const res = await fetch(`${API_BASE_URL}/packages/${id}`);
      if (!res.ok) throw new Error('Package not found');
      return await res.json();
    } catch (err) {
      console.warn('API getPackageById error:', err);
      return null;
    }
  },

  async getDestinations(): Promise<ApiDestination[]> {
    try {
      const res = await fetch(`${API_BASE_URL}/destinations`);
      if (!res.ok) throw new Error('Failed to fetch destinations');
      const data = await res.json();
      return Array.isArray(data) ? data : data.destinations || [];
    } catch (err) {
      console.warn('API getDestinations error:', err);
      return [];
    }
  },

  async getTravelPlans(): Promise<ApiTravelPlan[]> {
    try {
      const res = await fetch(`${API_BASE_URL}/travel-plans/active`);
      if (!res.ok) throw new Error('Failed to fetch travel plans');
      const data = await res.json();
      return Array.isArray(data) && data.length > 0
        ? data
        : [
            {
              _id: '6ac9cbd09a0ec138e6e680de',
              name: 'Basic',
              price: 555,
              priceSuffix: '/ person',
              features: ['3-star hotels', 'Airport transfers', 'Guided city tour', 'Breakfast included'],
              isPopular: false,
              isActive: true,
            },
            {
              _id: '6ac9cbea9a0ec138e6e680df',
              name: 'Premium',
              price: 999,
              priceSuffix: '/ person',
              features: ['5-star hotels', 'Premium transfers', 'Private guided tours', '24/7 travel support'],
              isPopular: true,
              isActive: true,
            },
            {
              _id: '6ac9cc1e9a0ec138e6e680e0',
              name: 'Luxury',
              price: 1999,
              priceSuffix: '/ person',
              features: ['Luxury resorts', 'Business-class transfer', 'Private experiences'],
              isPopular: false,
              isActive: true,
            },
          ];
    } catch (err) {
      console.warn('API getTravelPlans error:', err);
      return [
        {
          _id: '6ac9cbd09a0ec138e6e680de',
          name: 'Basic',
          price: 555,
          priceSuffix: '/ person',
          features: ['3-star hotels', 'Airport transfers', 'Guided city tour', 'Breakfast included'],
          isPopular: false,
          isActive: true,
        },
        {
          _id: '6ac9cbea9a0ec138e6e680df',
          name: 'Premium',
          price: 999,
          priceSuffix: '/ person',
          features: ['5-star hotels', 'Premium transfers', 'Private guided tours', '24/7 travel support'],
          isPopular: true,
          isActive: true,
        },
        {
          _id: '6ac9cc1e9a0ec138e6e680e0',
          name: 'Luxury',
          price: 1999,
          priceSuffix: '/ person',
          features: ['Luxury resorts', 'Business-class transfer', 'Private experiences'],
          isPopular: false,
          isActive: true,
        },
      ];
    }
  },

  async login(email: string, password: string): Promise<{ token: string; user: ApiUser }> {
    const res = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Invalid email or password');
    }
    const data = await res.json();
    return {
      token: data.access_token || data.token || '',
      user: data.user,
    };
  },

  async register(data: {
    name: string;
    email: string;
    password: string;
    mobile?: string;
    country?: string;
  }): Promise<{ token: string; user: ApiUser }> {
    const res = await fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: data.name,
        email: data.email,
        password: data.password,
        country: data.country?.trim() || 'Sri Lanka',
        mobile: data.mobile?.trim() || '+94771234567',
        role: 'USER',
      }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Registration failed');
    }
    const result = await res.json();
    return {
      token: result.access_token || result.token || '',
      user: result.user,
    };
  },

  async createBooking(
    bookingData: {
      packageId: string;
      travelPlanId: string;
      travelDate: string;
      numberOfPeople: number;
      selectedAddOnIds?: string[];
    },
    token: string
  ): Promise<any> {
    const res = await fetch(`${API_BASE_URL}/bookings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(bookingData),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      const msg = Array.isArray(err.message) ? err.message.join(', ') : (err.message || 'Booking submission failed');
      throw new Error(msg);
    }
    return await res.json();
  },

  async getUserBookings(token: string): Promise<ApiBooking[]> {
    try {
      let res = await fetch(`${API_BASE_URL}/bookings/my`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        res = await fetch(`${API_BASE_URL}/bookings/my-bookings`, {
          headers: { Authorization: `Bearer ${token}` },
        });
      }
      if (!res.ok) throw new Error('Failed to load bookings');
      return await res.json();
    } catch (err) {
      console.warn('API getUserBookings error:', err);
      return [];
    }
  },

  async createPayment(
    data: { bookingId: string; paymentMethod: string; transactionId: string },
    token: string
  ): Promise<any> {
    const res = await fetch(`${API_BASE_URL}/payments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Payment processing failed');
    }
    return await res.json();
  },

  async getBookingPayment(bookingId: string, token: string): Promise<ApiPayment | null> {
    try {
      const res = await fetch(`${API_BASE_URL}/payments/booking/${bookingId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) return null;
      return await res.json();
    } catch {
      return null;
    }
  },

  // ==========================================
  // GUIDE REGISTRATION
  // ==========================================
  async registerGuide(data: {
    name: string;
    email: string;
    password: string;
    country: string;
    city: string;
    mobile: string;
    languages: string[];
    experienceYears: number;
    governmentIdType: 'NIC' | 'PASSPORT';
    governmentIdNumber: string;
    about: string;
  }): Promise<{ message: string; user?: ApiUser }> {
    const res = await fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...data,
        acceptGuideTerms: true,
        role: 'GUIDE',
      }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      const msg = Array.isArray(err.message) ? err.message.join(', ') : (err.message || 'Guide registration failed');
      throw new Error(msg);
    }
    return await res.json();
  },

  // ==========================================
  // FULL ADMIN CONTROLLER SUITE (Matches Web Admin)
  // ==========================================
  async getAdminStats(token: string): Promise<ApiAdminStats | null> {
    try {
      const res = await fetch(`${API_BASE_URL}/admin-dashboard`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Failed to fetch admin stats');
      return await res.json();
    } catch (err) {
      console.warn('API getAdminStats error:', err);
      return null;
    }
  },

  async getAdminBookings(token: string): Promise<ApiBooking[]> {
    try {
      const res = await fetch(`${API_BASE_URL}/bookings`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Failed to fetch admin bookings');
      return await res.json();
    } catch (err) {
      console.warn('API getAdminBookings error:', err);
      return [];
    }
  },

  async updateBookingStatus(
    bookingId: string,
    status: 'CONFIRMED' | 'CANCELLED' | 'PENDING',
    token: string
  ): Promise<any> {
    const res = await fetch(`${API_BASE_URL}/bookings/${bookingId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ status }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Failed to update booking status');
    }
    return await res.json();
  },

  async deleteBooking(id: string, token: string): Promise<any> {
    const res = await fetch(`${API_BASE_URL}/bookings/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error('Failed to delete booking');
    return await res.json();
  },

  async getAdminGuides(token: string): Promise<ApiUser[]> {
    try {
      const res = await fetch(`${API_BASE_URL}/admin-dashboard/guides`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Failed to fetch guides');
      return await res.json();
    } catch (err) {
      console.warn('API getAdminGuides error:', err);
      return [];
    }
  },

  async approveGuide(guideId: string, token: string): Promise<any> {
    const res = await fetch(`${API_BASE_URL}/admin-dashboard/guides/${guideId}/approve`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Failed to approve guide');
    }
    return await res.json();
  },

  async rejectGuide(guideId: string, reason: string, token: string): Promise<any> {
    const res = await fetch(`${API_BASE_URL}/admin-dashboard/guides/${guideId}/reject`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ reason }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Failed to reject guide');
    }
    return await res.json();
  },

  async createPackage(data: any, token: string): Promise<any> {
    const res = await fetch(`${API_BASE_URL}/packages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      const msg = Array.isArray(err.message) ? err.message.join(', ') : (err.message || 'Failed to create package');
      throw new Error(msg);
    }
    return await res.json();
  },

  async updatePackage(id: string, data: any, token: string): Promise<any> {
    const res = await fetch(`${API_BASE_URL}/packages/${id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      const msg = Array.isArray(err.message) ? err.message.join(', ') : (err.message || 'Failed to update package');
      throw new Error(msg);
    }
    return await res.json();
  },

  async deletePackage(id: string, token: string): Promise<any> {
    const res = await fetch(`${API_BASE_URL}/packages/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error('Failed to delete package');
    return await res.json();
  },

  async createDestination(data: any, token: string): Promise<any> {
    const res = await fetch(`${API_BASE_URL}/destinations`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      const msg = Array.isArray(err.message) ? err.message.join(', ') : (err.message || 'Failed to create destination');
      throw new Error(msg);
    }
    return await res.json();
  },

  async deleteDestination(id: string, token: string): Promise<any> {
    const res = await fetch(`${API_BASE_URL}/destinations/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error('Failed to delete destination');
    return await res.json();
  },

  async getAdminUsers(token: string): Promise<ApiUser[]> {
    try {
      const res = await fetch(`${API_BASE_URL}/users`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Failed to fetch users');
      return await res.json();
    } catch (err) {
      console.warn('API getAdminUsers error:', err);
      return [];
    }
  },

  async deleteUser(id: string, token: string): Promise<any> {
    const res = await fetch(`${API_BASE_URL}/users/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error('Failed to delete user');
    return await res.json();
  },

  async getAdminPayments(token: string): Promise<ApiPayment[]> {
    try {
      const res = await fetch(`${API_BASE_URL}/payments`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Failed to fetch payments');
      return await res.json();
    } catch (err) {
      console.warn('API getAdminPayments error:', err);
      return [];
    }
  },

  async createTravelPlan(data: any, token: string): Promise<any> {
    const res = await fetch(`${API_BASE_URL}/travel-plans`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      const msg = Array.isArray(err.message) ? err.message.join(', ') : (err.message || 'Failed to create travel plan');
      throw new Error(msg);
    }
    return await res.json();
  },

  async deleteTravelPlan(id: string, token: string): Promise<any> {
    const res = await fetch(`${API_BASE_URL}/travel-plans/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error('Failed to delete travel plan');
    return await res.json();
  },
};
