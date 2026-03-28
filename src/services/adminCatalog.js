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

const USERS_COLLECTION = 'users';
const ADMIN_STREAM_COLLECTION = 'adminStreamCatalog';
const ADMIN_THEATERS_COLLECTION = 'adminTheaters';

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

const normalizeVideoId = (value) => {
  const input = normalizeText(value);

  if (!input) {
    return '';
  }

  const plainIdMatch = input.match(/^[a-zA-Z0-9_-]{11}$/);
  if (plainIdMatch) {
    return input;
  }

  const patterns = [
    /[?&]v=([a-zA-Z0-9_-]{11})/,
    /youtu\.be\/([a-zA-Z0-9_-]{11})/,
    /embed\/([a-zA-Z0-9_-]{11})/,
  ];

  for (const pattern of patterns) {
    const match = input.match(pattern);
    if (match?.[1]) {
      return match[1];
    }
  }

  return input;
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
  videoId: normalizeVideoId(payload.videoId),
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
    .filter((entry) => entry?.title && entry?.videoId)
    .map((entry) => ({
      id: `admin-stream-${entry.id}`,
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
      videoId: entry.videoId,
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
    const normalizedTheater = {
      id: theater.id,
      name: theater.name,
      area: theater.area || '',
      formats: Array.isArray(theater.formats) ? theater.formats : [],
      showtimes: Array.isArray(theater.showtimes) ? theater.showtimes : [],
      experience: theater.experience || 'Custom theatre listing',
      seatPricing: {
        Luxe: Number(theater.seatPricing?.Luxe) || 0,
        Prime: Number(theater.seatPricing?.Prime) || 0,
        Classic: Number(theater.seatPricing?.Classic) || 0,
      },
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
