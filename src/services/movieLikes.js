import AsyncStorage from '@react-native-async-storage/async-storage';

const LIKED_MOVIES_STORAGE_KEY = '@ticketbook/liked-movies';

const parseStoredMovieIds = (rawValue) => {
  if (!rawValue) {
    return [];
  }

  try {
    const parsed = JSON.parse(rawValue);

    return Array.isArray(parsed)
      ? parsed.map((movieId) => String(movieId)).filter(Boolean)
      : [];
  } catch (error) {
    console.error('Unable to parse liked movie ids:', error);
    return [];
  }
};

export const getLikedMovieIds = async () => {
  const rawValue = await AsyncStorage.getItem(LIKED_MOVIES_STORAGE_KEY);
  return parseStoredMovieIds(rawValue);
};

export const saveLikedMovieIds = async (movieIds) => {
  const normalizedMovieIds = [...new Set(movieIds.map((movieId) => String(movieId)).filter(Boolean))];
  await AsyncStorage.setItem(LIKED_MOVIES_STORAGE_KEY, JSON.stringify(normalizedMovieIds));
  return normalizedMovieIds;
};

export const toggleLikedMovie = async (movieId) => {
  const normalizedMovieId = String(movieId);
  const currentMovieIds = await getLikedMovieIds();
  const isLiked = currentMovieIds.includes(normalizedMovieId);
  const nextMovieIds = isLiked
    ? currentMovieIds.filter((entry) => entry !== normalizedMovieId)
    : [...currentMovieIds, normalizedMovieId];

  await saveLikedMovieIds(nextMovieIds);

  return !isLiked;
};

