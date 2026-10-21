'use client';

import {
  ChangeEvent,
  FormEvent,
  useEffect,
  useRef,
  useState,
} from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  CheckCircle2,
  Globe2,
  ImagePlus,
  UploadCloud,
  Trash2,
  MapPin,
  Plus,
  Save,
  Star,
  X,
} from 'lucide-react';
import styles from './page.module.css';

// Only this Add Destination page uses this backend URL.
// No changes are required in frontend/.env.local or other modules.
const DESTINATION_API_URL = (process.env.NEXT_PUBLIC_API_URL || 'https://globalvista-d7uz.onrender.com');
const MAX_IMAGES = 5;
const MAX_FILE_BYTES = 5 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
]);

type SelectedImage = {
  file: File;
  previewUrl: string;
};

type DestinationForm = {
  name: string;
  country: string;
  description: string;
  rating: string;
  bestTimeToVisit: string;
  budget: string;
  latitude: string;
  longitude: string;
  activities: string;
  isActive: boolean;
};

const initialForm: DestinationForm = {
  name: '',
  country: '',
  description: '',
  rating: '0',
  bestTimeToVisit: '',
  budget: '',
  latitude: '',
  longitude: '',
  activities: '',
  isActive: true,
};

function getToken(): string | null {
  return (
    localStorage.getItem('globalvista_token') ||
    localStorage.getItem('token')
  );
}

function clearSession(): void {
  localStorage.removeItem('globalvista_token');
  localStorage.removeItem('globalvista_user');
  localStorage.removeItem('token');
  localStorage.removeItem('user');
}

function splitLines(value: string): string[] {
  return value
    .split('\n')
    .map((item) => item.trim())
    .filter(Boolean);
}

function getApiMessage(data: unknown, fallback: string): string {
  if (data && typeof data === 'object' && 'message' in data) {
    const message = (data as { message?: string | string[] }).message;
    if (Array.isArray(message)) return message.join(', ');
    if (typeof message === 'string' && message.trim()) return message;
  }
  return fallback;
}

// Images returned as /uploads/destinations/... must point to the NestJS server.
function publicImageUrl(image: string): string {
  const value = image.trim();
  if (/^https?:\/\//i.test(value)) return value;
  if (value.startsWith('/uploads/')) return `${DESTINATION_API_URL}${value}`;
  if (value.startsWith('uploads/')) return `${DESTINATION_API_URL}/${value}`;
  if (value.startsWith('/images/')) return value;
  return `${DESTINATION_API_URL}/uploads/destinations/${encodeURIComponent(value)}`;
}

export default function AddDestinationPage() {
  const router = useRouter();
  const [form, setForm] = useState<DestinationForm>(initialForm);
  const [selectedImages, setSelectedImages] = useState<SelectedImage[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [saveStage, setSaveStage] = useState<'uploading' | 'creating' | null>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const previewUrls = useRef<string[]>([]);

  useEffect(() => {
    return () => {
      previewUrls.current.forEach((url) => URL.revokeObjectURL(url));
      previewUrls.current = [];
    };
  }, []);

  const updateField = <K extends keyof DestinationForm>(
    key: K,
    value: DestinationForm[K],
  ) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const clearSelectedImages = () => {
    previewUrls.current.forEach((url) => URL.revokeObjectURL(url));
    previewUrls.current = [];
    setSelectedImages([]);
  };

  const resetForm = () => {
    setForm({ ...initialForm });
    clearSelectedImages();
    setError('');
    setSuccess('');
  };

  const handleImageSelect = (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []);
    event.target.value = '';
    if (!files.length) return;

    if (selectedImages.length + files.length > MAX_IMAGES) {
      setError(`Maximum ${MAX_IMAGES} images allowed per destination.`);
      return;
    }
    if (files.some((file) => !ALLOWED_IMAGE_TYPES.has(file.type))) {
      setError('Only JPG, PNG and WEBP image files are allowed.');
      return;
    }
    if (files.some((file) => file.size > MAX_FILE_BYTES)) {
      setError('Each image must be 5MB or smaller.');
      return;
    }

    const newImages = files.map((file) => ({
      file,
      previewUrl: URL.createObjectURL(file),
    }));
    previewUrls.current.push(...newImages.map((item) => item.previewUrl));
    setSelectedImages((current) => [...current, ...newImages]);
    setError('');
  };

  const removeSelectedImage = (previewUrl: string) => {
    URL.revokeObjectURL(previewUrl);
    previewUrls.current = previewUrls.current.filter((url) => url !== previewUrl);
    setSelectedImages((current) =>
      current.filter((item) => item.previewUrl !== previewUrl),
    );
  };

  const uploadSelectedImages = async (token: string): Promise<string[]> => {
    const uploadData = new FormData();
    selectedImages.forEach(({ file }) => uploadData.append('images', file));

    const response = await fetch(
      `${DESTINATION_API_URL}/destinations/upload-images`,
      {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: uploadData,
        // Do not manually set Content-Type when sending FormData.
      },
    );
    const data: unknown = await response.json().catch(() => null);

    if (response.status === 401 || response.status === 403) {
      clearSession();
      router.replace('/login');
      throw new Error('Session expired or access denied. Please log in again.');
    }
    if (!response.ok) {
      throw new Error(getApiMessage(data, 'Image upload failed.'));
    }

    const images =
      data && typeof data === 'object' && 'images' in data
        ? (data as { images?: unknown }).images
        : undefined;

    if (
      !Array.isArray(images) ||
      images.length !== selectedImages.length ||
      !images.every((url) => typeof url === 'string' && url.trim())
    ) {
      throw new Error('Upload response has no valid image URLs. Destination was not created.');
    }

    return (images as string[]).map(publicImageUrl);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (submitting) return;
    setError('');
    setSuccess('');

    const name = form.name.trim();
    const country = form.country.trim();
    if (!name || !country) {
      setError('Destination name and country are required.');
      return;
    }

    const rating = Number(form.rating);
    if (!Number.isFinite(rating) || rating < 0 || rating > 5) {
      setError('Rating must be between 0 and 5.');
      return;
    }

    const latitudeText = form.latitude.trim();
    const longitudeText = form.longitude.trim();
    const hasLatitude = latitudeText !== '';
    const hasLongitude = longitudeText !== '';
    if (hasLatitude !== hasLongitude) {
      setError('Latitude and longitude must both be entered.');
      return;
    }

    let latitude: number | undefined;
    let longitude: number | undefined;
    if (hasLatitude && hasLongitude) {
      latitude = Number(latitudeText);
      longitude = Number(longitudeText);
      if (!Number.isFinite(latitude) || latitude < -90 || latitude > 90) {
        setError('Latitude must be between -90 and 90.');
        return;
      }
      if (!Number.isFinite(longitude) || longitude < -180 || longitude > 180) {
        setError('Longitude must be between -180 and 180.');
        return;
      }
    }

    if (selectedImages.length === 0) {
      setError('Please select at least one destination image.');
      return;
    }

    const token = getToken();
    if (!token) {
      clearSession();
      router.replace('/login');
      return;
    }

    const payload: Record<string, unknown> = {
      name,
      country,
      description: form.description.trim(),
      rating,
      bestTimeToVisit: form.bestTimeToVisit.trim(),
      budget: form.budget.trim(),
      activities: splitLines(form.activities),
      isActive: form.isActive,
    };
    if (latitude !== undefined && longitude !== undefined) {
      payload.latitude = latitude;
      payload.longitude = longitude;
    }

    setSubmitting(true);
    try {
      setSaveStage('uploading');
      payload.images = await uploadSelectedImages(token);
      setSaveStage('creating');

      const response = await fetch(`${DESTINATION_API_URL}/destinations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });
      const data: unknown = await response.json().catch(() => null);

      if (response.status === 401 || response.status === 403) {
        clearSession();
        router.replace('/login');
        return;
      }
      if (!response.ok) {
        throw new Error(getApiMessage(data, 'Unable to create destination.'));
      }

      setSuccess('Destination created successfully.');
      window.setTimeout(() => router.push('/admin/destinations'), 700);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to create destination.');
    } finally {
      setSubmitting(false);
      setSaveStage(null);
    }
  };

  return (
    <main className={styles.page}>
      <section className={styles.shell}>
        <header className={styles.header}>
          <button
            type="button"
            className={styles.backButton}
            onClick={() => router.push('/admin/destinations')}
            aria-label="Back to destinations"
          >
            <ArrowLeft size={18} />
          </button>
          <div className={styles.headerContent}>
            <span>DESTINATION MANAGEMENT</span>
            <h1>Add Destination</h1>
            <p>Create a destination with images and real map coordinates for GlobalVista.</p>
          </div>
        </header>

        <form className={styles.formCard} onSubmit={handleSubmit}>
          <section className={styles.section}>
            <div className={styles.sectionHeading}>
              <div className={styles.sectionIcon}><Globe2 size={19} /></div>
              <div>
                <h2>Basic Information</h2>
                <p>Add the main destination details.</p>
              </div>
            </div>

            <div className={styles.formGrid}>
              <label className={styles.field}>
                <span>Destination Name *</span>
                <input
                  value={form.name}
                  onChange={(event) => updateField('name', event.target.value)}
                  placeholder="Sigiriya"
                  required
                />
              </label>
              <label className={styles.field}>
                <span>Country *</span>
                <input
                  value={form.country}
                  onChange={(event) => updateField('country', event.target.value)}
                  placeholder="Sri Lanka"
                  required
                />
              </label>
              <label className={styles.field}>
                <span>Rating</span>
                <div className={styles.iconInput}>
                  <Star size={15} />
                  <input
                    type="number"
                    min="0"
                    max="5"
                    step="0.1"
                    value={form.rating}
                    onChange={(event) => updateField('rating', event.target.value)}
                  />
                </div>
              </label>
              <label className={styles.field}>
                <span>Budget</span>
                <input
                  value={form.budget}
                  onChange={(event) => updateField('budget', event.target.value)}
                  placeholder="Medium"
                />
              </label>
              <label className={styles.field}>
                <span>Best Time to Visit</span>
                <input
                  value={form.bestTimeToVisit}
                  onChange={(event) => updateField('bestTimeToVisit', event.target.value)}
                  placeholder="March - April"
                />
              </label>
              <label className={`${styles.field} ${styles.fullWidth}`}>
                <span>Description</span>
                <textarea
                  rows={4}
                  value={form.description}
                  onChange={(event) => updateField('description', event.target.value)}
                  placeholder="Describe this destination..."
                />
              </label>
            </div>
          </section>

          <section className={`${styles.section} ${styles.locationSection}`}>
            <div className={styles.sectionHeading}>
              <div className={styles.locationIcon}><MapPin size={19} /></div>
              <div>
                <h2>Real Map Location</h2>
                <p>These coordinates place the destination on the homepage map.</p>
              </div>
            </div>
            <div className={styles.formGrid}>
              <label className={styles.field}>
                <span>Latitude</span>
                <input
                  type="number"
                  min="-90"
                  max="90"
                  step="any"
                  value={form.latitude}
                  onChange={(event) => updateField('latitude', event.target.value)}
                  placeholder="7.9570"
                />
                <small>Range: -90 to 90</small>
              </label>
              <label className={styles.field}>
                <span>Longitude</span>
                <input
                  type="number"
                  min="-180"
                  max="180"
                  step="any"
                  value={form.longitude}
                  onChange={(event) => updateField('longitude', event.target.value)}
                  placeholder="80.7603"
                />
                <small>Range: -180 to 180</small>
              </label>
            </div>
            {form.latitude.trim() && form.longitude.trim() && (
              <div className={styles.coordinatePreview}>
                <MapPin size={15} />
                <span>Coordinates: {form.latitude}, {form.longitude}</span>
              </div>
            )}
          </section>

          <section className={styles.section}>
            <div className={styles.sectionHeading}>
              <div className={styles.sectionIcon}><Plus size={19} /></div>
              <div>
                <h2>Activities</h2>
                <p>Enter one activity per line.</p>
              </div>
            </div>
            <label className={styles.field}>
              <textarea
                rows={5}
                value={form.activities}
                onChange={(event) => updateField('activities', event.target.value)}
                placeholder={'Sigiriya Rock Fortress\nSightseeing\nPhotography\nCultural Tours'}
              />
            </label>
          </section>

          <section className={styles.section}>
            <div className={styles.sectionHeading}>
              <div className={styles.sectionIcon}><ImagePlus size={19} /></div>
              <div>
                <h2>Destination Images</h2>
                <p>Choose up to 5 photos from your computer. Images will be uploaded and saved with this destination.</p>
              </div>
            </div>
            <label className={styles.imageUploadZone}>
              <UploadCloud size={27} />
              <strong>Select Destination Images</strong>
              <span>JPG, PNG or WEBP · Maximum 5 images · 5MB each</span>
              <span className={styles.imageUploadButton}>Choose Images</span>
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                multiple
                onChange={handleImageSelect}
                disabled={submitting || selectedImages.length >= MAX_IMAGES}
              />
            </label>
            {selectedImages.length > 0 && (
              <>
                <div className={styles.imagesCount}>
                  {selectedImages.length} of {MAX_IMAGES} images selected
                </div>
                <div className={styles.imagePreviewGrid}>
                  {selectedImages.map((item, index) => (
                    <div className={styles.imagePreview} key={item.previewUrl}>
                      {/* Previews are blob: URLs created in the browser. */}
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={item.previewUrl} alt={`Selected destination image ${index + 1}`} />
                      <button
                        type="button"
                        className={styles.removeImageButton}
                        onClick={() => removeSelectedImage(item.previewUrl)}
                        disabled={submitting}
                        aria-label={`Remove image ${index + 1}`}
                      >
                        <Trash2 size={15} />
                      </button>
                      <span className={styles.imageFilename} title={item.file.name}>
                        {item.file.name}
                      </span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </section>

          <button
            type="button"
            className={`${styles.activeCard} ${form.isActive ? styles.activeCardEnabled : ''}`}
            onClick={() => updateField('isActive', !form.isActive)}
            disabled={submitting}
          >
            <div className={styles.activeIcon}>
              {form.isActive ? <CheckCircle2 size={19} /> : <X size={19} />}
            </div>
            <div>
              <strong>{form.isActive ? 'Destination Active' : 'Destination Inactive'}</strong>
              <span>
                {form.isActive
                  ? 'This destination can appear on the public homepage map.'
                  : 'This destination will be hidden from public map data.'}
              </span>
            </div>
          </button>

          {error && <div className={styles.errorMessage} role="alert">{error}</div>}
          {success && (
            <div className={styles.successMessage} role="status">
              <CheckCircle2 size={16} /> {success}
            </div>
          )}
          <div className={styles.footerActions}>
            <button type="button" className={styles.resetButton} onClick={resetForm} disabled={submitting}>
              Reset
            </button>
            <button
              type="button"
              className={styles.cancelButton}
              onClick={() => router.push('/admin/destinations')}
              disabled={submitting}
            >
              Cancel
            </button>
            <button type="submit" className={styles.saveButton} disabled={submitting}>
              <Save size={16} />
              {saveStage === 'uploading'
                ? 'Uploading Images...'
                : saveStage === 'creating'
                  ? 'Saving Destination...'
                  : 'Create Destination'}
            </button>
          </div>
        </form>
      </section>
    </main>
  );
}
