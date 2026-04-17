import AsyncStorage from '@react-native-async-storage/async-storage';
import { fetchMovieDetails, getImageUrl } from './tmdb';

const WATCH_HISTORY_STORAGE_KEY = '@ticketbookapp/watch-history-v1';
const VID_SRC_CATALOG_CACHE_KEY = '@ticketbookapp/vidsrc-catalog-v1';
const TMDB_POSTER_CACHE_KEY = '@ticketbookapp/tmdb-poster-cache-v1';
const MAX_WATCH_HISTORY = 6;

export const STREAM_CATALOG = [
  {
    id: 'stream-1',
    title: "King Solomon's Mines",
    description: 'Classic jungle adventure with expedition drama and old-school action beats.',
    year: 1937,
    duration: 'Feature',
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
    description: 'Survival adventure adaptation set on a remote island.',
    year: 1954,
    duration: 'Feature',
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
    description: 'Frontier-era western drama with large-scale classic storytelling.',
    year: 1931,
    duration: 'Feature',
    genre: 'Western',
    language: 'English',
    region: 'Global',
    format: 'Full Movie',
    mood: 'Grand',
    badge: 'Western classic',
    videoId: '7Z2N8nddNXw',
  },
  {
    id: 'stream-4',
    title: 'The Hound of the Baskervilles',
    description: 'Sherlock Holmes mystery with gothic atmosphere and suspense.',
    year: 1939,
    duration: 'Feature',
    genre: 'Thriller',
    language: 'English',
    region: 'Global',
    format: 'Full Movie',
    mood: 'Mystery',
    badge: 'Sherlock',
    videoId: 'a422IrFm88I',
  },
  {
    id: 'stream-5',
    title: 'Sherlock Holmes and the Voice of Terror',
    description: 'Wartime detective thriller featuring Sherlock Holmes investigations.',
    year: 1942,
    duration: 'Feature',
    genre: 'Thriller',
    language: 'English',
    region: 'Global',
    format: 'Full Movie',
    mood: 'Tense',
    badge: 'Detective',
    videoId: 'TQgi-TOCjgI',
  },
  {
    id: 'stream-6',
    title: 'The City of the Dead',
    description: 'Classic horror feature with occult themes and eerie mood.',
    year: 1960,
    duration: 'Feature',
    genre: 'Thriller',
    language: 'English',
    region: 'Global',
    format: 'Full Movie',
    mood: 'Moody',
    badge: 'Horror classic',
    videoId: '7BChuMtWjYY',
  },
  {
    id: 'stream-7',
    title: 'Carnival of Souls',
    description: 'Cult psychological horror with haunting black-and-white visuals.',
    year: 1962,
    duration: 'Feature',
    genre: 'Thriller',
    language: 'English',
    region: 'Global',
    format: 'Full Movie',
    mood: 'Cult',
    badge: 'Cult horror',
    videoId: '9bUePiQJJCI',
  },
  {
    id: 'stream-8',
    title: 'The Broadway Melody',
    description: 'Golden-era Hollywood musical drama with old studio charm.',
    year: 1929,
    duration: 'Feature',
    genre: 'Drama',
    language: 'English',
    region: 'Global',
    format: 'Full Movie',
    mood: 'Vintage',
    badge: 'Oscar-era pick',
    videoId: 'Gd1Ml5Vdsls',
  },
  {
    id: 'stream-9',
    title: 'The Divorcee',
    description: 'Pre-code drama classic with bold relationship themes for its era.',
    year: 1930,
    duration: 'Feature',
    genre: 'Drama',
    language: 'English',
    region: 'Global',
    format: 'Full Movie',
    mood: 'Classic',
    badge: 'Golden era',
    videoId: 'rOgOLB3-aHU',
  },
  {
    id: 'stream-10',
    title: 'Detour',
    description: 'Lean and gritty noir road thriller packed with tension.',
    year: 1945,
    duration: 'Feature',
    genre: 'Thriller',
    language: 'English',
    region: 'Global',
    format: 'Full Movie',
    mood: 'Noir',
    badge: 'Film noir',
    videoId: 'SmdhHTXsEJE',
  },
  {
    id: 'stream-11',
    title: 'Fear in the Night',
    description: 'Classic noir suspense story driven by paranoia and danger.',
    year: 1947,
    duration: 'Feature',
    genre: 'Thriller',
    language: 'English',
    region: 'Global',
    format: 'Full Movie',
    mood: 'Noir',
    badge: 'Noir thriller',
    videoId: 'DY-LqcYxQ4w',
  },
  {
    id: 'stream-12',
    title: 'Two Dollar Bettor',
    description: 'Crime drama feature around race betting and double lives.',
    year: 1951,
    duration: 'Feature',
    genre: 'Crime',
    language: 'English',
    region: 'Global',
    format: 'Full Movie',
    mood: 'Urban',
    badge: 'Crime pick',
    videoId: 'tFDy5CnDBi0',
  },
  {
    id: 'stream-13',
    title: 'They Raid By Night',
    description: 'WWII-era war feature with resistance and sabotage storyline.',
    year: 1942,
    duration: 'Feature',
    genre: 'War',
    language: 'English',
    region: 'Global',
    format: 'Full Movie',
    mood: 'Gritty',
    badge: 'War classic',
    videoId: '0Ujf-vgjsGo',
  },
  {
    id: 'stream-14',
    title: "Gulliver's Travels",
    description: 'Animated family fantasy adaptation with timeless visual style.',
    year: 1939,
    duration: 'Feature',
    genre: 'Family',
    language: 'English',
    region: 'Global',
    format: 'Full Movie',
    mood: 'Light',
    badge: 'Family classic',
    videoId: 's6rgfBqPSaM',
  },
  {
    id: 'stream-15',
    title: 'The Hunchback of Notre Dame',
    description: 'Classic period drama adaptation set in medieval Paris.',
    year: 1939,
    duration: 'Feature',
    genre: 'Drama',
    language: 'English',
    region: 'Global',
    format: 'Full Movie',
    mood: 'Epic',
    badge: 'Literary classic',
    videoId: 'zakXTnke3m0',
  },
  {
    id: 'stream-16',
    title: 'The Snows of Kilimanjaro',
    description: 'Adventure drama with expedition backdrop and personal conflict.',
    year: 1952,
    duration: 'Feature',
    genre: 'Adventure',
    language: 'English',
    region: 'Global',
    format: 'Full Movie',
    mood: 'Epic',
    badge: 'Adventure drama',
    videoId: 'j6lDNnWBXDY',
  },
  {
    id: 'stream-17',
    title: 'Eminent Domain',
    description: 'Cold-war political thriller with espionage tension.',
    year: 1990,
    duration: 'Feature',
    genre: 'Thriller',
    language: 'English',
    region: 'Global',
    format: 'Full Movie',
    mood: 'Cold-war',
    badge: 'Political thriller',
    videoId: 'Qgmgy8ygU6A',
  },
  {
    id: 'stream-18',
    title: 'Istanbul',
    description: 'Vintage thriller with undercover intrigue in a foreign city.',
    year: 1957,
    duration: 'Feature',
    genre: 'Thriller',
    language: 'English',
    region: 'Global',
    format: 'Full Movie',
    mood: 'Stylish',
    badge: 'Spy vibe',
    videoId: 'EOfHcfPpx_k',
  },
  {
    id: 'stream-19',
    title: 'Scarlet Street',
    description: 'Essential noir crime drama from the classic Hollywood era.',
    year: 1945,
    duration: 'Feature',
    genre: 'Crime',
    language: 'English',
    region: 'Global',
    format: 'Full Movie',
    mood: 'Noir',
    badge: 'Noir essential',
    videoId: '9srGe68u4qQ',
  },
  {
    id: 'stream-20',
    title: 'Ride in Whirlwind',
    description: 'Dusty western with outlaw tension and survival stakes.',
    year: 1966,
    duration: 'Feature',
    genre: 'Western',
    language: 'English',
    region: 'Global',
    format: 'Full Movie',
    mood: 'Rugged',
    badge: 'Western',
    videoId: 'EescdIf1NKo',
  },
  {
    id: 'stream-21',
    title: 'One-Eyed Jacks',
    description: 'Revenge-driven western with classic landscapes and duels.',
    year: 1961,
    duration: 'Feature',
    genre: 'Western',
    language: 'English',
    region: 'Global',
    format: 'Full Movie',
    mood: 'Brooding',
    badge: 'Western drama',
    videoId: 'S_c3LQOQ_pw',
  },
  {
    id: 'stream-22',
    title: 'The Undercover Man',
    description: 'Investigation-led crime film about taking down an empire.',
    year: 1949,
    duration: 'Feature',
    genre: 'Crime',
    language: 'English',
    region: 'Global',
    format: 'Full Movie',
    mood: 'Procedural',
    badge: 'Crime procedural',
    videoId: 'g-_mfcFG9_0',
  },
  {
    id: 'stream-23',
    title: "The Devil's Party",
    description: 'Crime drama built around loyalty and criminal pressure.',
    year: 1938,
    duration: 'Feature',
    genre: 'Drama',
    language: 'English',
    region: 'Global',
    format: 'Full Movie',
    mood: 'Dark',
    badge: 'Crime drama',
    videoId: 'yhU1NNmhhTA',
  },
  {
    id: 'stream-24',
    title: 'Night of the Living Dead',
    description: 'Iconic independent zombie horror film in full-length format.',
    year: 1968,
    duration: 'Feature',
    genre: 'Horror',
    language: 'English',
    region: 'Global',
    format: 'Full Movie',
    mood: 'Cult',
    badge: 'Zombie classic',
    videoId: '3g97MFomInw',
  },
  {
    id: 'stream-25',
    title: 'The Terror',
    description: 'Gothic horror full movie with old-school castle atmosphere.',
    year: 1963,
    duration: 'Feature',
    genre: 'Horror',
    language: 'English',
    region: 'Global',
    format: 'Full Movie',
    mood: 'Gothic',
    badge: 'Gothic horror',
    videoId: 'lW3ZH6Rtta8',
  },
  {
    id: 'stream-26',
    title: 'The Palm Beach Story',
    description: 'Fast-paced screwball comedy from Hollywood classic era.',
    year: 1942,
    duration: 'Feature',
    genre: 'Comedy',
    language: 'English',
    region: 'Global',
    format: 'Full Movie',
    mood: 'Light',
    badge: 'Comedy classic',
    videoId: 'wTbc_exCaj4',
  },
  {
    id: 'stream-27',
    title: "Twelve O'Clock High",
    description: 'War drama centered on bomber command leadership and pressure.',
    year: 1949,
    duration: 'Feature',
    genre: 'War',
    language: 'English',
    region: 'Global',
    format: 'Full Movie',
    mood: 'Intense',
    badge: 'War drama',
    videoId: 'fUrt2zVNlzA',
  },
  {
    id: 'stream-28',
    title: 'Hell in the Pacific',
    description: 'Two-soldier survival and conflict drama set on a remote island.',
    year: 1968,
    duration: 'Feature',
    genre: 'War',
    language: 'English',
    region: 'Global',
    format: 'Full Movie',
    mood: 'Tense',
    badge: 'War survival',
    videoId: 'SWp5GupmC9s',
  },
  {
    id: 'stream-29',
    title: 'Battle of the Commandos',
    description: 'High-risk mission war feature with commandos behind enemy lines.',
    year: 1969,
    duration: 'Feature',
    genre: 'War',
    language: 'English',
    region: 'Global',
    format: 'Full Movie',
    mood: 'Action',
    badge: 'Commandos',
    videoId: 'm64S-A6078g',
  },
  {
    id: 'stream-30',
    title: 'The 39 Steps',
    description: 'Classic espionage thriller with chase-driven pacing.',
    year: 1959,
    duration: 'Feature',
    genre: 'Thriller',
    language: 'English',
    region: 'Global',
    format: 'Full Movie',
    mood: 'Suspense',
    badge: 'Spy thriller',
    videoId: '45-q05jbr7Q',
  },
  {
    id: 'stream-31',
    title: 'Ill Met by Moonlight',
    description: 'WWII covert-operation film based on a real mission.',
    year: 1957,
    duration: 'Feature',
    genre: 'War',
    language: 'English',
    region: 'Global',
    format: 'Full Movie',
    mood: 'Mission',
    badge: 'Covert mission',
    videoId: 'TOcWECaI4kQ',
  },
  {
    id: 'stream-32',
    title: 'The Outcast',
    description: 'Classic western with conflict over land, loyalty, and justice.',
    year: 1954,
    duration: 'Feature',
    genre: 'Western',
    language: 'English',
    region: 'Global',
    format: 'Full Movie',
    mood: 'Rugged',
    badge: 'Frontier classic',
    videoId: 'Empbj_TT2a8',
  },
  {
    id: 'stream-33',
    title: 'Tulsa',
    description: 'Oil-era western drama with business rivalry and revenge.',
    year: 1949,
    duration: 'Feature',
    genre: 'Western',
    language: 'English',
    region: 'Global',
    format: 'Full Movie',
    mood: 'Dramatic',
    badge: 'Western drama',
    videoId: 'avTxCKv4pLM',
  },
  {
    id: 'stream-34',
    title: 'Untamed',
    description: 'Period drama feature with romance, migration, and conflict.',
    year: 1955,
    duration: 'Feature',
    genre: 'Drama',
    language: 'English',
    region: 'Global',
    format: 'Full Movie',
    mood: 'Epic',
    badge: 'Period drama',
    videoId: 'nBH9i6YKIdE',
  },
  {
    id: 'stream-35',
    title: 'The Inn of the Sixth Happiness',
    description: 'War-era human drama featuring courage under extreme pressure.',
    year: 1958,
    duration: 'Feature',
    genre: 'Drama',
    language: 'English',
    region: 'Global',
    format: 'Full Movie',
    mood: 'Emotional',
    badge: 'War drama',
    videoId: 'wrFF-j8NuSU',
  },
  {
    id: 'stream-36',
    title: 'Distant Drums',
    description: 'Action-heavy western adventure set in dangerous terrain.',
    year: 1951,
    duration: 'Feature',
    genre: 'Western',
    language: 'English',
    region: 'Global',
    format: 'Full Movie',
    mood: 'Action',
    badge: 'Western action',
    videoId: 'rBp5ISatKHQ',
  },
  {
    id: 'stream-37',
    title: 'A Man Alone',
    description: 'Lone-gunman western with betrayal, pursuit, and redemption.',
    year: 1955,
    duration: 'Feature',
    genre: 'Western',
    language: 'English',
    region: 'Global',
    format: 'Full Movie',
    mood: 'Brooding',
    badge: 'Lone rider',
    videoId: 'vLqEdQAwQFM',
  },
  {
    id: 'stream-38',
    title: "Fury at Smugglers' Bay",
    description: 'Seafaring adventure with pirates, rescues, and sword fights.',
    year: 1961,
    duration: 'Feature',
    genre: 'Adventure',
    language: 'English',
    region: 'Global',
    format: 'Full Movie',
    mood: 'Swashbuckling',
    badge: 'Pirate adventure',
    videoId: 'IQ_aquhcQo0',
  },
  {
    id: 'stream-39',
    title: 'Diplomatic Courier',
    description: 'Cold-war espionage thriller with chases and coded secrets.',
    year: 1952,
    duration: 'Feature',
    genre: 'Thriller',
    language: 'English',
    region: 'Global',
    format: 'Full Movie',
    mood: 'Spy',
    badge: 'Espionage',
    videoId: 'yzLZUgxiwMs',
  },
  {
    id: 'stream-40',
    title: '5 Fingers',
    description: 'Spy-thriller feature about leaks, deception, and intelligence warfare.',
    year: 1952,
    duration: 'Feature',
    genre: 'Thriller',
    language: 'English',
    region: 'Global',
    format: 'Full Movie',
    mood: 'Spy',
    badge: 'Spy classic',
    videoId: 'gXbgwL9lUUc',
  },
  {
    id: 'stream-41',
    title: 'Love, the Italian Way',
    description: 'European romantic-comedy style feature from classic cinema period.',
    year: 1960,
    duration: 'Feature',
    genre: 'Comedy',
    language: 'English',
    region: 'Global',
    format: 'Full Movie',
    mood: 'Light',
    badge: 'Rom-com classic',
    videoId: '14rp3nrebKk',
  },
];

export const STREAM_FILTERS = [
  'All',
  'Classics',
  'Adventure',
  'Drama',
  'Crime',
  'Western',
  'War',
  'Comedy',
  'Thriller',
  'Horror',
  'Family',
];

const VID_SRC_DEFAULT_EMBED_HOST = 'vidsrc-embed.ru';
const VID_SRC_EMBED_HOSTS = [
  'vidsrc-embed.ru',
  'vsembed.ru',
  'vidsrc-embed.su',
  'vidsrcme.su',
  'vsrc.su',
];

const STREAM_PLACEHOLDER_THUMBNAIL =
  'https://placehold.co/1280x720/0b1220/ffffff/png?text=TicketBook+Stream';

let tmdbPosterCache = null;

const loadTmdbPosterCache = async () => {
  if (tmdbPosterCache) {
    return tmdbPosterCache;
  }

  try {
    const rawCache = await AsyncStorage.getItem(TMDB_POSTER_CACHE_KEY);
    tmdbPosterCache = rawCache ? JSON.parse(rawCache) : {};
  } catch (error) {
    console.error('Unable to load TMDB poster cache:', error);
    tmdbPosterCache = {};
  }

  return tmdbPosterCache;
};

const saveTmdbPosterCache = async () => {
  if (!tmdbPosterCache) {
    return;
  }

  try {
    await AsyncStorage.setItem(TMDB_POSTER_CACHE_KEY, JSON.stringify(tmdbPosterCache));
  } catch (error) {
    console.error('Unable to save TMDB poster cache:', error);
  }
};

const resolvePosterUrlForTmdbId = async (tmdbId) => {
  const normalizedTmdbId = normalizeVidSrcIdentifier(tmdbId);
  if (!normalizedTmdbId) {
    return '';
  }

  const cache = await loadTmdbPosterCache();
  if (cache[normalizedTmdbId]) {
    return cache[normalizedTmdbId];
  }

  try {
    const details = await fetchMovieDetails(Number(normalizedTmdbId));
    const posterUrl = getImageUrl(details?.poster_path || details?.backdrop_path, 'w500') || '';
    cache[normalizedTmdbId] = posterUrl || STREAM_PLACEHOLDER_THUMBNAIL;
    tmdbPosterCache = cache;
    void saveTmdbPosterCache();
    return cache[normalizedTmdbId];
  } catch (error) {
    cache[normalizedTmdbId] = STREAM_PLACEHOLDER_THUMBNAIL;
    tmdbPosterCache = cache;
    void saveTmdbPosterCache();
    return STREAM_PLACEHOLDER_THUMBNAIL;
  }
};

const getFirstTextValue = (input, keys = []) => {
  if (!input || typeof input !== 'object') {
    return '';
  }

  for (const key of keys) {
    const value = input[key];
    if (typeof value === 'string' && value.trim()) {
      return value.trim();
    }

    if (typeof value === 'number' && Number.isFinite(value)) {
      return String(value);
    }
  }

  return '';
};

const getFirstNumberValue = (input, keys = []) => {
  if (!input || typeof input !== 'object') {
    return null;
  }

  for (const key of keys) {
    const rawValue = input[key];
    const value = Number(rawValue);
    if (Number.isFinite(value) && value > 0) {
      return value;
    }
  }

  return null;
};

const normalizeHttpsUrl = (value) => {
  if (typeof value !== 'string' || !value.trim()) {
    return '';
  }

  try {
    const trimmed = value.trim();
    const normalizedInput = trimmed.startsWith('//')
      ? `https:${trimmed}`
      : trimmed.startsWith('http://')
      ? `https://${trimmed.slice('http://'.length)}`
      : trimmed;

    const parsed = new URL(normalizedInput);
    return parsed.protocol === 'https:' ? parsed.toString() : '';
  } catch (error) {
    return '';
  }
};

const normalizeVidSrcIdentifier = (value) => {
  if (typeof value !== 'string' && typeof value !== 'number') {
    return '';
  }

  return String(value).trim();
};

const extractListPayload = (payload) => {
  if (Array.isArray(payload)) {
    return payload;
  }

  if (!payload || typeof payload !== 'object') {
    return [];
  }

  const candidateKeys = ['result', 'results', 'items', 'data', 'movies', 'list'];
  for (const key of candidateKeys) {
    if (Array.isArray(payload[key])) {
      return payload[key];
    }
  }

  return [];
};

const parseJsonSafely = (value) => {
  if (typeof value !== 'string') {
    return null;
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }

  try {
    return JSON.parse(trimmed);
  } catch (error) {
    return null;
  }
};

const fetchVidSrcPagePayload = async ({ host, page, signal }) => {
  const response = await fetch(`https://${host}/movies/latest/page-${page}.json`, {
    method: 'GET',
    headers: {
      Accept: 'application/json, text/plain, */*',
    },
    signal,
  });

  if (!response.ok) {
    throw new Error(`Host ${host} responded with ${response.status}.`);
  }

  const rawText = await response.text();
  const payload = parseJsonSafely(rawText);
  if (!payload) {
    throw new Error(`Host ${host} returned non-JSON payload.`);
  }

  return payload;
};

export const getStreamThumbnail = (thumbnailUrl) =>
  normalizeHttpsUrl(thumbnailUrl) || STREAM_PLACEHOLDER_THUMBNAIL;

const isStreamPlaceholderThumbnail = (thumbnailUrl) => {
  const normalizedThumbnail = normalizeHttpsUrl(thumbnailUrl);
  if (!normalizedThumbnail) {
    return true;
  }

  if (normalizedThumbnail === STREAM_PLACEHOLDER_THUMBNAIL) {
    return true;
  }

  return (
    normalizedThumbnail.includes('dummyimage.com/') ||
    normalizedThumbnail.includes('placehold.co/')
  );
};

export const getFeaturedStream = (catalog = STREAM_CATALOG) => catalog[0] || null;

export const getStreamSections = (catalog = STREAM_CATALOG) => [
  {
    key: 'latest-movies',
    title: 'Latest Movies',
    items: catalog.slice(0, 50),
  },
  {
    key: 'trending-tonight',
    title: 'Trending Tonight',
    items: catalog.slice(0, 24),
  },
  {
    key: 'thrillers-noir',
    title: 'Thrillers and Noir',
    items: catalog.filter((item) => ['Thriller', 'Crime', 'Horror'].includes(item.genre)),
  },
  {
    key: 'western-frontier',
    title: 'Western Frontier',
    items: catalog.filter((item) => item.genre === 'Western'),
  },
  {
    key: 'war-command',
    title: 'War and Command',
    items: catalog.filter((item) => item.genre === 'War'),
  },
  {
    key: 'drama-essentials',
    title: 'Drama Essentials',
    items: catalog.filter((item) => item.genre === 'Drama'),
  },
  {
    key: 'light-watch',
    title: 'Light Watch',
    items: catalog.filter((item) => ['Comedy', 'Family'].includes(item.genre)),
  },
];

export const getYouTubeEmbedUrl = (videoId) =>
  `https://www.youtube.com/embed/${videoId}?playsinline=1&controls=1&rel=0&modestbranding=1&fs=1&autoplay=1`;

export const getYouTubeWatchUrl = (videoId) =>
  `https://www.youtube.com/watch?v=${videoId}`;

export const getVidSrcMovieEmbedUrl = ({ imdbId, tmdbId, autoplay = 1 } = {}) => {
  const normalizedImdbId = normalizeVidSrcIdentifier(imdbId);
  const normalizedTmdbId = normalizeVidSrcIdentifier(tmdbId);

  if (!normalizedImdbId && !normalizedTmdbId) {
    return '';
  }

  const params = new URLSearchParams();
  if (normalizedImdbId) {
    params.set('imdb', normalizedImdbId);
  } else {
    params.set('tmdb', normalizedTmdbId);
  }

  params.set('autoplay', autoplay ? '1' : '0');

  return `https://${VID_SRC_DEFAULT_EMBED_HOST}/embed/movie?${params.toString()}`;
};

export const isVidSrcEmbedUrl = (value) => {
  const normalized = normalizeHttpsUrl(value);
  if (!normalized) {
    return false;
  }

  try {
    const host = new URL(normalized).hostname.toLowerCase();
    return VID_SRC_EMBED_HOSTS.some(
      (allowedHost) => host === allowedHost || host.endsWith(`.${allowedHost}`),
    );
  } catch (error) {
    return false;
  }
};

const mapVidSrcMovieToStreamItem = (rawMovie = {}, page = 1, index = 0) => {
  const imdbId = normalizeVidSrcIdentifier(
    getFirstTextValue(rawMovie, ['imdb', 'imdb_id', 'imdbId', 'imdbID']),
  );
  const tmdbIdRaw =
    getFirstTextValue(rawMovie, ['tmdb', 'tmdb_id', 'tmdbId']) ||
    getFirstNumberValue(rawMovie, ['tmdb', 'tmdb_id', 'tmdbId']);
  const tmdbId = normalizeVidSrcIdentifier(tmdbIdRaw);
  const directEmbedUrl =
    normalizeHttpsUrl(getFirstTextValue(rawMovie, ['embed_url_tmdb', 'embed_url', 'embedUrl'])) || '';
  const embedUrl = directEmbedUrl || getVidSrcMovieEmbedUrl({ imdbId, tmdbId, autoplay: 1 });

  if (!embedUrl) {
    return null;
  }

  const title =
    getFirstTextValue(rawMovie, ['title', 'name', 'movie_title']) ||
    `Movie ${page}-${index + 1}`;
  const description =
    getFirstTextValue(rawMovie, ['overview', 'description', 'plot', 'summary']) ||
    'Stream now in the embedded player.';
  const genre =
    getFirstTextValue(rawMovie, ['genre', 'genres']) ||
    'Movie';
  const language =
    getFirstTextValue(rawMovie, ['language', 'original_language', 'lang']) ||
    'English';
  const yearValue =
    getFirstNumberValue(rawMovie, ['year']) ||
    Number(getFirstTextValue(rawMovie, ['release_year'])) ||
    null;
  const releaseDate = getFirstTextValue(rawMovie, ['release_date', 'releaseDate']);
  const yearFromRelease = releaseDate ? Number(releaseDate.slice(0, 4)) : null;
  const year = Number.isFinite(yearValue) && yearValue > 0
    ? yearValue
    : Number.isFinite(yearFromRelease) && yearFromRelease > 0
    ? yearFromRelease
    : new Date().getFullYear();

  const rawThumbnail = getFirstTextValue(rawMovie, [
    'poster',
    'poster_url',
    'posterUrl',
    'image',
    'thumbnail',
    'poster_path',
    'backdrop_path',
  ]);
  const thumbnail = rawThumbnail.startsWith('/')
    ? getImageUrl(rawThumbnail, 'w500') || ''
    : normalizeHttpsUrl(rawThumbnail) || '';

  const mood = getFirstTextValue(rawMovie, ['mood']) || 'Trending';
  const badge = getFirstTextValue(rawMovie, ['badge']) || 'VidSrc';
  const quality = getFirstTextValue(rawMovie, ['quality']);

  return {
    id: `vidsrc-${tmdbId || imdbId || `${page}-${index}`}`,
    historyKey: `vidsrc-${tmdbId || imdbId || `${page}-${index}`}`,
    title,
    description,
    year,
    duration: 'Feature',
    genre,
    language,
    region: 'Global',
    format: 'Movie',
    mood,
    badge,
    quality,
    thumbnail,
    embedUrl,
    playbackType: 'embed',
    source: 'vidsrc',
    imdbId: imdbId || null,
    tmdbId: tmdbId || null,
  };
};

const enrichMoviesWithThumbnails = async (movies = []) => {
  if (!Array.isArray(movies) || movies.length === 0) {
    return [];
  }

  return Promise.all(
    movies.map(async (movie) => {
      if (movie.thumbnail && !isStreamPlaceholderThumbnail(movie.thumbnail)) {
        return movie;
      }

      if (!normalizeVidSrcIdentifier(movie.tmdbId)) {
        return {
          ...movie,
          thumbnail: getStreamThumbnail(movie.thumbnail),
        };
      }

      const posterUrl = await resolvePosterUrlForTmdbId(movie.tmdbId);
      return {
        ...movie,
        thumbnail: posterUrl || STREAM_PLACEHOLDER_THUMBNAIL,
      };
    }),
  );
};

export const enrichStreamCatalogThumbnails = async (movies = []) => {
  const enrichedMovies = await enrichMoviesWithThumbnails(movies);
  return enrichedMovies.map((movie) => ({
    ...movie,
    thumbnail: movie.thumbnail || STREAM_PLACEHOLDER_THUMBNAIL,
  }));
};

const fetchLatestVidSrcPageMovies = async ({ page, signal }) => {
  const pageErrors = [];

  for (const host of VID_SRC_EMBED_HOSTS) {
    try {
      const pagePayload = await fetchVidSrcPagePayload({ host, page, signal });
      const list = extractListPayload(pagePayload);

      return list
        .map((movie, index) => mapVidSrcMovieToStreamItem(movie, page, index))
        .filter(Boolean);
    } catch (error) {
      if (error?.name === 'AbortError') {
        throw error;
      }

      pageErrors.push(error);
    }
  }

  if (pageErrors.length > 0) {
    throw pageErrors[pageErrors.length - 1];
  }

  return [];
};

export const fetchLatestVidSrcMovies = async ({ pages = [1], signal, includePosterEnrichment = false } = {}) => {
  const normalizedPages = Array.isArray(pages)
    ? [...new Set(pages.map((value) => Number(value)).filter((value) => Number.isFinite(value) && value > 0))]
    : [1];

  if (normalizedPages.length === 0) {
    return [];
  }

  const pageResults = await Promise.allSettled(
    normalizedPages.map((page) => fetchLatestVidSrcPageMovies({ page, signal })),
  );

  const fetchErrors = pageResults
    .filter((result) => result.status === 'rejected')
    .map((result) => result.reason)
    .filter(Boolean);

  const aggregatedMovies = pageResults
    .filter((result) => result.status === 'fulfilled')
    .flatMap((result) => result.value);

  // De-duplicate in case mirrors return overlapping records between pages.
  const dedupedMovies = Array.from(
    new Map(aggregatedMovies.map((movie) => [movie.historyKey || movie.id, movie])).values(),
  );

  if (dedupedMovies.length > 0) {
    if (!includePosterEnrichment) {
      return dedupedMovies;
    }

    return enrichMoviesWithThumbnails(dedupedMovies);
  }

  if (fetchErrors.length > 0) {
    throw fetchErrors[fetchErrors.length - 1];
  }

  return [];
};

export const loadVidSrcCatalogCache = async () => {
  try {
    const rawCache = await AsyncStorage.getItem(VID_SRC_CATALOG_CACHE_KEY);
    if (!rawCache) {
      return [];
    }

    const parsed = JSON.parse(rawCache);
    return Array.isArray(parsed)
      ? parsed.filter((item) => item && typeof item === 'object' && typeof item.embedUrl === 'string')
      : [];
  } catch (error) {
    console.error('Unable to load VidSrc catalog cache:', error);
    return [];
  }
};

export const saveVidSrcCatalogCache = async (items = []) => {
  if (!Array.isArray(items) || items.length === 0) {
    return;
  }

  try {
    const cappedItems = items.slice(0, 120);
    await AsyncStorage.setItem(VID_SRC_CATALOG_CACHE_KEY, JSON.stringify(cappedItems));
  } catch (error) {
    console.error('Unable to save VidSrc catalog cache:', error);
  }
};

export const getStreamHistoryKey = (item = {}) => {
  const explicitKey = typeof item.historyKey === 'string' ? item.historyKey.trim() : '';
  if (explicitKey) {
    return explicitKey;
  }

  const idKey = typeof item.id === 'string' ? item.id.trim() : '';
  if (idKey) {
    return idKey;
  }

  const videoKey = typeof item.videoId === 'string' ? item.videoId.trim() : '';
  if (videoKey) {
    return videoKey;
  }

  const embedKey = typeof item.embedUrl === 'string' ? item.embedUrl.trim() : '';
  if (embedKey) {
    return embedKey;
  }

  const titleKey = typeof item.title === 'string' ? item.title.trim().toLowerCase() : '';
  return titleKey || 'stream-item';
};

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
    const historyKey = getStreamHistoryKey(item);
    const nextHistory = [
      {
        ...item,
        historyKey,
        watchedAt: Date.now(),
        thumbnail: getStreamThumbnail(item.thumbnail),
      },
      ...currentHistory.filter((entry) => getStreamHistoryKey(entry) !== historyKey),
    ].slice(0, MAX_WATCH_HISTORY);

    await AsyncStorage.setItem(WATCH_HISTORY_STORAGE_KEY, JSON.stringify(nextHistory));
    return nextHistory;
  } catch (error) {
    console.error('Unable to save watch history:', error);
    return [];
  }
};
