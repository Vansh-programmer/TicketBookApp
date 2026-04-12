import AsyncStorage from '@react-native-async-storage/async-storage';

const WATCH_HISTORY_STORAGE_KEY = '@ticketbookapp/watch-history-v1';
const MAX_WATCH_HISTORY = 6;

export const STREAM_CATALOG = [
  {
    id: 'stream-1',
    title: "King Solomon's Mines",
    description: 'A classic jungle adventure feature from 1937 with expedition drama and old-school action.',
    year: 1937,
    duration: '1h 20m',
    genre: 'Adventure',
    language: 'English',
    region: 'Global',
    format: 'Full Movie',
    mood: 'Classic',
    badge: 'Feature film',
    videoId: 'kBGV-BbjxsA',
  },
  {
    id: 'stream-2',
    title: 'Robinson Crusoe',
    description: 'A full-length survival adventure adaptation with an isolated island setting.',
    year: 1954,
    duration: '1h 31m',
    genre: 'Adventure',
    language: 'English',
    region: 'Global',
    format: 'Full Movie',
    mood: 'Epic',
    badge: 'Classic adventure',
    videoId: 'qsdmwZ8beM0',
  },
  {
    id: 'stream-3',
    title: 'Cimarron',
    description: 'A full western drama set in frontier America with award-winning classic cinema tone.',
    year: 1931,
    duration: '2h 03m',
    genre: 'Drama',
    language: 'English',
    region: 'Global',
    format: 'Full Movie',
    mood: 'Late night',
    badge: 'Western classic',
    videoId: '7Z2N8nddNXw',
  },
  {
    id: 'stream-4',
    title: 'The Hound of the Baskervilles',
    description: 'A full Sherlock Holmes mystery film with gothic atmosphere and detective suspense.',
    year: 1939,
    duration: '1h 20m',
    genre: 'Thriller',
    language: 'English',
    region: 'Global',
    format: 'Full Movie',
    mood: 'Mystery',
    badge: 'Detective film',
    videoId: 'a422IrFm88I',
  },
  {
    id: 'stream-5',
    title: 'The City of the Dead',
    description: 'A classic horror feature with eerie occult themes and old-school suspense.',
    year: 1960,
    duration: '1h 16m',
    genre: 'Thriller',
    language: 'English',
    region: 'Global',
    format: 'Full Movie',
    mood: 'Moody',
    badge: 'Horror classic',
    videoId: '7BChuMtWjYY',
  },
  {
    id: 'stream-6',
    title: 'Carnival of Souls',
    description: 'A full psychological horror film with atmospheric black-and-white visuals.',
    year: 1962,
    duration: '1h 18m',
    genre: 'Thriller',
    language: 'English',
    region: 'Global',
    format: 'Full Movie',
    mood: 'Cult',
    badge: 'Cult horror',
    videoId: '9bUePiQJJCI',
  },
  {
    id: 'stream-ind-1',
    title: 'Mardaani 2',
    description: 'A Hindi crime thriller feature from YouTube Movies with an investigative police storyline.',
    year: 2019,
    duration: '1h 42m',
    genre: 'Thriller',
    language: 'Hindi',
    region: 'India',
    format: 'Full Movie',
    mood: 'Intense',
    badge: 'Hindi movie',
    videoId: 'uBCGinLrHWU',
  },
  {
    id: 'stream-ind-2',
    title: 'PINK',
    description: 'A Hindi courtroom drama feature known for a strong social-thriller narrative.',
    year: 2016,
    duration: '2h 16m',
    genre: 'Drama',
    language: 'Hindi',
    region: 'India',
    format: 'Full Movie',
    mood: 'Intense',
    badge: 'Hindi feature',
    videoId: 'VKGrQC6N3-E',
  },
  {
    id: 'stream-ind-3',
    title: 'Uppena',
    description: 'A Telugu romantic drama feature now used in place of trailer-only streaming picks.',
    year: 2021,
    duration: '2h 26m',
    genre: 'Drama',
    language: 'Telugu',
    region: 'India',
    format: 'Full Movie',
    mood: 'Emotional',
    badge: 'Telugu movie',
    videoId: 'HLWHkUQS-fU',
  },
  {
    id: 'stream-ind-4',
    title: 'Ee Nagaraniki Emaindi',
    description: 'A Telugu buddy-comedy drama feature with city-life energy and strong ensemble tone.',
    year: 2018,
    duration: '2h 20m',
    genre: 'Comedy',
    language: 'Telugu',
    region: 'India',
    format: 'Full Movie',
    mood: 'Feel-good',
    badge: 'Telugu feature',
    videoId: 'k2p4Eg-KP0g',
  },
  {
    id: 'stream-ind-5',
    title: 'Visaaranai',
    description: 'A Tamil crime drama feature known for gritty realism and intense performances.',
    year: 2015,
    duration: '1h 57m',
    genre: 'Drama',
    language: 'Tamil',
    region: 'India',
    format: 'Full Movie',
    mood: 'Gritty',
    badge: 'Tamil movie',
    videoId: '8cLShJJ0DME',
  },
  {
    id: 'stream-ind-6',
    title: 'Irumbuthirai',
    description: 'A Tamil techno-thriller feature with a cybercrime plot and fast pacing.',
    year: 2018,
    duration: '2h 40m',
    genre: 'Action',
    language: 'Tamil',
    region: 'India',
    format: 'Full Movie',
    mood: 'Moody',
    badge: 'Tamil feature',
    videoId: 'FdxcHUqhpkE',
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
