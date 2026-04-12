import axios from 'axios';

const KLIPY_BASE_URL = 'https://api.klipy.com';
const KLIPY_API_KEY = process.env.EXPO_PUBLIC_KLIPY_API_KEY;

const SEARCH_ENDPOINTS = ['/api/v1/search/gifs', '/api/v1/media/gifs'];

const klipyClient = axios.create({
  baseURL: KLIPY_BASE_URL,
  timeout: 12000,
  headers: {
    Accept: 'application/json',
    ...(KLIPY_API_KEY
      ? {
          'x-api-key': KLIPY_API_KEY,
        }
      : {}),
  },
});

const getFirstString = (...values) =>
  values.find((value) => typeof value === 'string' && value.trim())?.trim() || '';

const getApiErrorMessage = (payload) => {
  const rawMessage = payload?.errors?.message;

  if (Array.isArray(rawMessage) && rawMessage.length > 0) {
    return rawMessage.join(' ');
  }

  if (typeof rawMessage === 'string') {
    return rawMessage;
  }

  return '';
};

const extractGifItems = (payload) => {
  const possibleLists = [
    payload?.data?.gifs,
    payload?.data?.items,
    payload?.data?.results,
    payload?.gifs,
    payload?.items,
    payload?.results,
    payload?.data,
  ];

  const matched = possibleLists.find((candidate) => Array.isArray(candidate));
  return matched || [];
};

const normalizeGif = (item, index) => {
  const mediaFormats = item?.media_formats || item?.mediaFormats || {};
  const images = item?.images || {};

  const originalAsset =
    mediaFormats.gif ||
    mediaFormats.mediumgif ||
    mediaFormats.tinygif ||
    images.original ||
    images.fixed_height ||
    images.fixed_width ||
    null;

  const previewAsset =
    mediaFormats.tinygif ||
    mediaFormats.nanogif ||
    images.preview_gif ||
    images.fixed_width_downsampled ||
    originalAsset;

  const url = getFirstString(
    originalAsset?.url,
    item?.url,
    item?.gifUrl,
    item?.content?.url,
    item?.media?.gif?.url,
  );
  if (!url) {
    return null;
  }

  const previewUrl = getFirstString(previewAsset?.url, item?.previewUrl, url);
  const width =
    Number(originalAsset?.dims?.[0] || originalAsset?.width || item?.width || previewAsset?.dims?.[0]) ||
    null;
  const height =
    Number(originalAsset?.dims?.[1] || originalAsset?.height || item?.height || previewAsset?.dims?.[1]) ||
    null;

  return {
    id: getFirstString(String(item?.id || item?.gif_id || item?.slug || ''), `klipy-gif-${index}`),
    title: getFirstString(item?.title, item?.name, item?.caption, 'GIF'),
    url,
    previewUrl,
    width,
    height,
    aspectRatio: width && height ? width / height : null,
  };
};

export const isKlipyConfigured = Boolean(KLIPY_API_KEY);

export const searchKlipyGifs = async (query, { limit = 24, offset = 0 } = {}) => {
  const trimmedQuery = query?.trim();

  if (!trimmedQuery) {
    return [];
  }

  if (!KLIPY_API_KEY) {
    throw new Error('Missing EXPO_PUBLIC_KLIPY_API_KEY in .env');
  }

  let lastError = null;

  for (const endpoint of SEARCH_ENDPOINTS) {
    try {
      const response = await klipyClient.get(endpoint, {
        params: {
          query: trimmedQuery,
          q: trimmedQuery,
          limit,
          offset,
        },
      });

      const payload = response.data || {};

      if (payload?.result === false) {
        throw new Error(getApiErrorMessage(payload) || 'Klipy API rejected this request.');
      }

      const normalized = extractGifItems(payload)
        .map((entry, index) => normalizeGif(entry, index))
        .filter(Boolean);

      return normalized;
    } catch (error) {
      lastError = error;

      const status = error?.response?.status;
      if (status === 401 || status === 403) {
        const apiMessage = getApiErrorMessage(error?.response?.data);
        if (/invalid\s+api\s+key/i.test(apiMessage)) {
          throw new Error('Klipy API key is invalid. Update EXPO_PUBLIC_KLIPY_API_KEY in .env.');
        }

        throw new Error(apiMessage || 'Klipy authorization failed. Check your API key.');
      }

      if (status === 404 || status === 405) {
        continue;
      }
    }
  }

  const fallbackMessage =
    getApiErrorMessage(lastError?.response?.data) || lastError?.message || 'Unable to load GIFs from Klipy.';

  throw new Error(fallbackMessage);
};
