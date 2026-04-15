import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { getStreamThumbnail } from './streamCatalog';

const USERS_COLLECTION = 'users';
const ADMIN_STREAM_COLLECTION = 'adminStreamCatalog';
const ADMIN_THEATERS_COLLECTION = 'adminTheaters';
const FALLBACK_THEATER_FORMATS = ['2D'];
const FALLBACK_THEATER_SHOWTIMES = ['10:30 AM', '1:30 PM', '4:30 PM', '7:30 PM'];
const FALLBACK_SEAT_PRICING = {
  Luxe: 520,
  Prime: 320,
  Classic: 220,
};

const parseAdminEmails = () =>
  (process.env.EXPO_PUBLIC_ADMIN_EMAILS || '')
    .split(',')
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean);

const ADMIN_EMAILS = parseAdminEmails();

const normalizeText = (value) => value?.toString().trim() || '';

const normalizeCsvList = (value) =>
  normalizeText(value)
    .split(',')
    .map((entry) => entry.trim())
    .filter(Boolean);

const normalizePrice = (value) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? Math.round(parsed) : 0;
};

const normalizeHttpsUrl = (value) => {
  const input = normalizeText(value);

  if (!input) {
    return '';
  }

  try {
    const parsed = new URL(input);
    return parsed.protocol === 'https:' ? parsed.toString() : '';
  } catch (error) {
    return '';
  }
};

const normalizeThumbnailValue = (value) => {
  const input = normalizeText(value);

  if (!input) {
    return '';
  }

  if (/^data:image\/(png|jpe?g|webp|gif);base64,/i.test(input)) {
    return input;
  }

  return normalizeHttpsUrl(input);
};

const normalizeStreamPayload = (payload) => ({
  title: normalizeText(payload.title),
  description: normalizeText(payload.description),
  year: normalizePrice(payload.year),
  duration: normalizeText(payload.duration) || 'Trailer',
  genre: normalizeText(payload.genre) || 'Drama',
  language: normalizeText(payload.language) || 'Hindi',
  region: normalizeText(payload.region) || 'India',
  format: normalizeText(payload.format) || 'Trailer',
  mood: normalizeText(payload.mood) || 'Fresh',
  badge: normalizeText(payload.badge) || 'Admin pick',
  thumbnail: normalizeThumbnailValue(payload.thumbnailUrl || payload.thumbnail),
  embedUrl: normalizeHttpsUrl(payload.embedUrl),
});

const normalizeTheaterPayload = (payload) => ({
  state: normalizeText(payload.state),
  city: normalizeText(payload.city),
  name: normalizeText(payload.name),
  area: normalizeText(payload.area),
  experience: normalizeText(payload.experience),
  formats: normalizeCsvList(payload.formats),
  showtimes: normalizeCsvList(payload.showtimes),
  seatPricing: {
    Luxe: normalizePrice(payload.luxePrice),
    Prime: normalizePrice(payload.primePrice),
    Classic: normalizePrice(payload.classicPrice),
  },
});

export const isEmailAdmin = (email = '') =>
  ADMIN_EMAILS.includes(email.trim().toLowerCase());

export const ensureUserProfile = async (user) => {
  if (!db || !user?.uid) {
    return null;
  }

  const userRef = doc(db, USERS_COLLECTION, user.uid);
  const existingSnapshot = await getDoc(userRef);
  const existingData = existingSnapshot.data() || {};
  const normalizedEmail = (user.email || '').trim().toLowerCase();
  const role = existingData.role || (isEmailAdmin(normalizedEmail) ? 'admin' : 'user');

  await setDoc(
    userRef,
    {
      email: normalizedEmail,
      role,
      updatedAt: serverTimestamp(),
      lastSignInAt: serverTimestamp(),
      createdAt: existingData.createdAt || serverTimestamp(),
    },
    { merge: true },
  );

  return {
    id: user.uid,
    ...existingData,
    email: normalizedEmail,
    role,
  };
};

export const subscribeToUserProfile = (uid, onData, onError) => {
  if (!db || !uid) {
    onError?.({ code: 'firebase/not-configured' });
    return () => {};
  }

  return onSnapshot(
    doc(db, USERS_COLLECTION, uid),
    (snapshot) => {
      onData(snapshot.exists() ? { id: snapshot.id, ...snapshot.data() } : null);
    },
    onError,
  );
};

export const subscribeToAdminStreamEntries = (onData, onError) => {
  if (!db) {
    onError?.({ code: 'firebase/not-configured' });
    return () => {};
  }

  const streamQuery = query(
    collection(db, ADMIN_STREAM_COLLECTION),
    orderBy('updatedAt', 'desc'),
  );

  return onSnapshot(
    streamQuery,
    (snapshot) => {
      onData(snapshot.docs.map((docSnapshot) => ({ id: docSnapshot.id, ...docSnapshot.data() })));
    },
    onError,
  );
};

export const subscribeToAdminTheaters = (onData, onError) => {
  if (!db) {
    onError?.({ code: 'firebase/not-configured' });
    return () => {};
  }

  const theaterQuery = query(
    collection(db, ADMIN_THEATERS_COLLECTION),
    orderBy('updatedAt', 'desc'),
  );

  return onSnapshot(
    theaterQuery,
    (snapshot) => {
      onData(snapshot.docs.map((docSnapshot) => ({ id: docSnapshot.id, ...docSnapshot.data() })));
    },
    onError,
  );
};

export const createAdminStreamEntry = async (payload) => {
  if (!db) {
    throw new Error('Firebase is not configured for this build.');
  }

  const normalizedPayload = normalizeStreamPayload(payload);

  await addDoc(collection(db, ADMIN_STREAM_COLLECTION), {
    ...normalizedPayload,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
};

export const updateAdminStreamEntry = async (id, payload) => {
  if (!db || !id) {
    throw new Error('Firebase is not configured for this build.');
  }

  const normalizedPayload = normalizeStreamPayload(payload);

  await updateDoc(doc(db, ADMIN_STREAM_COLLECTION, id), {
    ...normalizedPayload,
    updatedAt: serverTimestamp(),
  });
};

export const deleteAdminStreamEntry = async (id) => {
  if (!db || !id) {
    throw new Error('Firebase is not configured for this build.');
  }

  await deleteDoc(doc(db, ADMIN_STREAM_COLLECTION, id));
};

export const createAdminTheater = async (payload) => {
  if (!db) {
    throw new Error('Firebase is not configured for this build.');
  }

  const normalizedPayload = normalizeTheaterPayload(payload);

  await addDoc(collection(db, ADMIN_THEATERS_COLLECTION), {
    ...normalizedPayload,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
};

export const updateAdminTheater = async (id, payload) => {
  if (!db || !id) {
    throw new Error('Firebase is not configured for this build.');
  }

  const normalizedPayload = normalizeTheaterPayload(payload);

  await updateDoc(doc(db, ADMIN_THEATERS_COLLECTION, id), {
    ...normalizedPayload,
    updatedAt: serverTimestamp(),
  });
};

export const deleteAdminTheater = async (id) => {
  if (!db || !id) {
    throw new Error('Firebase is not configured for this build.');
  }

  await deleteDoc(doc(db, ADMIN_THEATERS_COLLECTION, id));
};

export const mergeStreamCatalog = (defaultCatalog, adminEntries = []) => {
  const normalizedAdminEntries = adminEntries
    .filter((entry) => entry?.title && entry?.embedUrl)
    .map((entry) => ({
      ...(() => {
        const embedUrl = normalizeHttpsUrl(entry.embedUrl);
        const thumbnail = getStreamThumbnail(normalizeThumbnailValue(entry.thumbnail || entry.thumbnailUrl));

        return {
          embedUrl,
          thumbnail,
        };
      })(),
      id: `admin-stream-${entry.id}`,
      historyKey: `admin-stream-${entry.id}`,
      title: entry.title,
      description: entry.description || 'Freshly added by the admin team.',
      year: entry.year || new Date().getFullYear(),
      duration: entry.duration || 'Trailer',
      genre: entry.genre || 'Drama',
      language: entry.language || 'Hindi',
      region: entry.region || 'India',
      format: entry.format || 'Trailer',
      mood: entry.mood || 'Fresh',
      badge: entry.badge || 'Admin pick',
      playbackType: 'embed',
      source: 'admin',
    }));

  return [...normalizedAdminEntries, ...defaultCatalog];
};

export const mergeIndianLocationOptions = (defaultOptions, adminTheaters = []) => {
  const stateOrder = defaultOptions.map((entry) => entry.state);
  const stateMap = new Map(
    defaultOptions.map((entry) => [
      entry.state,
      {
        state: entry.state,
        cities: Object.fromEntries(
          Object.entries(entry.cities).map(([city, theaters]) => [
            city,
            theaters.map((theater) => ({
              ...theater,
              formats: [...(theater.formats || [])],
              showtimes: [...(theater.showtimes || [])],
              seatPricing: { ...(theater.seatPricing || {}) },
            })),
          ]),
        ),
      },
    ]),
  );

  adminTheaters.forEach((theater) => {
    if (!theater?.state || !theater?.city || !theater?.name) {
      return;
    }

    if (!stateMap.has(theater.state)) {
      stateMap.set(theater.state, { state: theater.state, cities: {} });
      stateOrder.push(theater.state);
    }

    const nextState = stateMap.get(theater.state);
    const nextCityEntries = [...(nextState.cities[theater.city] || [])];
    const normalizedFormats = Array.isArray(theater.formats)
      ? theater.formats.filter((value) => typeof value === 'string' && value.trim())
      : [];
    const normalizedShowtimes = Array.isArray(theater.showtimes)
      ? theater.showtimes.filter((value) => typeof value === 'string' && value.trim())
      : [];
    const seatPricing = {
      Luxe: Number(theater.seatPricing?.Luxe) || FALLBACK_SEAT_PRICING.Luxe,
      Prime: Number(theater.seatPricing?.Prime) || FALLBACK_SEAT_PRICING.Prime,
      Classic: Number(theater.seatPricing?.Classic) || FALLBACK_SEAT_PRICING.Classic,
    };

    const normalizedTheater = {
      id: theater.id,
      name: theater.name,
      area: theater.area || '',
      formats: normalizedFormats.length > 0 ? normalizedFormats : FALLBACK_THEATER_FORMATS,
      showtimes: normalizedShowtimes.length > 0 ? normalizedShowtimes : FALLBACK_THEATER_SHOWTIMES,
      experience: theater.experience || 'Custom theatre listing',
      seatPricing,
    };
    const existingIndex = nextCityEntries.findIndex((entry) => entry.name === normalizedTheater.name);

    if (existingIndex >= 0) {
      nextCityEntries[existingIndex] = normalizedTheater;
    } else {
      nextCityEntries.unshift(normalizedTheater);
    }

    nextState.cities[theater.city] = nextCityEntries;
  });

  return stateOrder.map((state) => stateMap.get(state)).filter(Boolean);
};
