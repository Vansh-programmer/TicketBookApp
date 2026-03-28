import AsyncStorage from '@react-native-async-storage/async-storage';

const WATCH_HISTORY_STORAGE_KEY = '@ticketbookapp/watch-history-v1';
const MAX_WATCH_HISTORY = 6;

export const STREAM_CATALOG = [
  {
    id: 'stream-1',
    title: 'Big Buck Bunny',
    description: 'A playful open movie with cinematic animation and easy family-watch energy.',
    year: 2008,
    duration: '10m',
    genre: 'Family',
    language: 'English',
    region: 'Global',
    format: 'Short',
    mood: 'Feel-good',
    badge: 'Open movie',
    videoId: 'aqz-KE-bpKQ',
  },
  {
    id: 'stream-2',
    title: 'Sintel',
    description: 'A fantasy adventure short that gives the streaming section a premium, story-first feel.',
    year: 2010,
    duration: '15m',
    genre: 'Adventure',
    language: 'English',
    region: 'Global',
    format: 'Short',
    mood: 'Epic',
    badge: 'Fantasy',
    videoId: 'eRsGyueVLvQ',
  },
  {
    id: 'stream-3',
    title: 'Tears of Steel',
    description: 'A sci-fi watch pick with action, visual effects, and a big-screen tone.',
    year: 2012,
    duration: '12m',
    genre: 'Sci-Fi',
    language: 'English',
    region: 'Global',
    format: 'Short',
    mood: 'Late night',
    badge: 'Sci-fi',
    videoId: 'R6MlUcmOul8',
  },
  {
    id: 'stream-4',
    title: 'Elephants Dream',
    description: 'A visually experimental watch for people who want something more art-house.',
    year: 2006,
    duration: '11m',
    genre: 'Drama',
    language: 'English',
    region: 'Global',
    format: 'Short',
    mood: 'Mind-bending',
    badge: 'Cult pick',
    videoId: 'bsXWczB2tC0',
  },
  {
    id: 'stream-5',
    title: 'Caminandes: Llamigos',
    description: 'A fast, fun animated short for quick mobile sessions between bookings.',
    year: 2016,
    duration: '3m',
    genre: 'Comedy',
    language: 'English',
    region: 'Global',
    format: 'Short',
    mood: 'Snackable',
    badge: 'Quick watch',
    videoId: 'Z4C82eyhwgU',
  },
  {
    id: 'stream-6',
    title: 'Caminandes: Gran Dillama',
    description: 'A colorful follow-up short to round out a Netflix-style mini collection.',
    year: 2013,
    duration: '2m',
    genre: 'Comedy',
    language: 'English',
    region: 'Global',
    format: 'Short',
    mood: 'Light',
    badge: 'Mini episode',
    videoId: 'Q1zjA8D3r5g',
  },
  {
    id: 'stream-ind-1',
    title: 'The RajaSaab',
    description: 'Official Hindi trailer from T-Series with a large-scale commercial fantasy tone.',
    year: 2025,
    duration: 'Trailer',
    genre: 'Fantasy',
    language: 'Hindi',
    region: 'India',
    format: 'Trailer',
    mood: 'Mass',
    badge: 'Hindi trailer',
    videoId: 'wT4HcYAeV5U',
  },
  {
    id: 'stream-ind-2',
    title: 'Assi',
    description: 'An official Hindi trailer with a grounded dramatic tone for the Indian spotlight row.',
    year: 2026,
    duration: 'Trailer',
    genre: 'Drama',
    language: 'Hindi',
    region: 'India',
    format: 'Trailer',
    mood: 'Intense',
    badge: 'Hindi trailer',
    videoId: '_fTMb1olDQY',
  },
  {
    id: 'stream-ind-3',
    title: 'Peddi Pehelwan',
    description: 'Official Telugu glimpse with a high-energy sports-action presentation.',
    year: 2025,
    duration: 'Glimpse',
    genre: 'Action',
    language: 'Telugu',
    region: 'India',
    format: 'Trailer',
    mood: 'Hyped',
    badge: 'Telugu spotlight',
    videoId: 'f4poVE-r8Ho',
  },
  {
    id: 'stream-ind-4',
    title: 'Ustaad Bhagat Singh',
    description: 'Official Telugu trailer pick for viewers who want a star-driven action row.',
    year: 2025,
    duration: 'Trailer',
    genre: 'Action',
    language: 'Telugu',
    region: 'India',
    format: 'Trailer',
    mood: 'Mass',
    badge: 'Telugu trailer',
    videoId: 'MLU5ZEp9YDo',
  },
  {
    id: 'stream-ind-5',
    title: 'Happy Raj',
    description: 'Official Tamil trailer with a lighter tone that helps broaden the stream mix.',
    year: 2025,
    duration: 'Trailer',
    genre: 'Drama',
    language: 'Tamil',
    region: 'India',
    format: 'Trailer',
    mood: 'Warm',
    badge: 'Tamil trailer',
    videoId: '3Av8GLKlWp4',
  },
  {
    id: 'stream-ind-6',
    title: 'Neelira',
    description: 'Official Tamil trailer with a moody thriller tone for genre-based browsing.',
    year: 2025,
    duration: 'Trailer',
    genre: 'Thriller',
    language: 'Tamil',
    region: 'India',
    format: 'Trailer',
    mood: 'Moody',
    badge: 'Tamil thriller',
    videoId: 'RAjraB7XF_Q',
  },
];

export const STREAM_FILTERS = [
  'All',
  'Indian',
  'Hindi',
  'Telugu',
  'Tamil',
  'Action',
  'Drama',
  'Comedy',
  'Sci-Fi',
  'Fantasy',
  'Thriller',
];

export const getStreamThumbnail = (videoId) =>
  `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;

export const getFeaturedStream = (catalog = STREAM_CATALOG) => catalog[0] || STREAM_CATALOG[0];

export const getStreamSections = (catalog = STREAM_CATALOG) => [
  {
    key: 'continue-watching',
    title: 'Continue Watching',
    items: catalog,
  },
  {
    key: 'indian-spotlight',
    title: 'Indian Spotlight',
    items: catalog.filter((item) => item.region === 'India'),
  },
  {
    key: 'hindi-now',
    title: 'Hindi Picks',
    items: catalog.filter((item) => item.language === 'Hindi'),
  },
  {
    key: 'south-cinema',
    title: 'South Cinema',
    items: catalog.filter((item) => ['Telugu', 'Tamil'].includes(item.language)),
  },
  {
    key: 'weekend-picks',
    title: 'Weekend Picks',
    items: catalog.filter((item) => ['Adventure', 'Sci-Fi', 'Drama', 'Thriller'].includes(item.genre)),
  },
  {
    key: 'quick-hits',
    title: 'Quick Hits',
    items: catalog.filter((item) => ['Comedy', 'Family'].includes(item.genre)),
  },
];

export const getYouTubeEmbedUrl = (videoId) =>
  `https://www.youtube-nocookie.com/embed/${videoId}?playsinline=1&controls=1&rel=0&modestbranding=1&fs=1`;

export const extractYouTubeVideoId = (input) => {
  if (!input) {
    return null;
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

  return null;
};

export const loadWatchHistory = async () => {
  try {
    const rawHistory = await AsyncStorage.getItem(WATCH_HISTORY_STORAGE_KEY);
    if (!rawHistory) {
      return [];
    }

    const parsedHistory = JSON.parse(rawHistory);
    return Array.isArray(parsedHistory) ? parsedHistory : [];
  } catch (error) {
    console.error('Unable to load watch history:', error);
    return [];
  }
};

export const saveToWatchHistory = async (item) => {
  try {
    const currentHistory = await loadWatchHistory();
    const nextHistory = [
      {
        ...item,
        watchedAt: Date.now(),
        thumbnail: item.thumbnail || getStreamThumbnail(item.videoId),
      },
      ...currentHistory.filter((entry) => entry.videoId !== item.videoId),
    ].slice(0, MAX_WATCH_HISTORY);

    await AsyncStorage.setItem(WATCH_HISTORY_STORAGE_KEY, JSON.stringify(nextHistory));
    return nextHistory;
  } catch (error) {
    console.error('Unable to save watch history:', error);
    return [];
  }
};
