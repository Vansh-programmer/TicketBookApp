import axios from 'axios';

const TMDB_BASE_URL = 'https://api.themoviedb.org/3';
const TMDB_API_TOKEN = process.env.EXPO_PUBLIC_TMDB_API_TOKEN;

const tmdbClient = axios.create({
  baseURL: TMDB_BASE_URL,
  timeout: 10000,
  headers: {
    Accept: 'application/json',
    ...(TMDB_API_TOKEN
      ? {
          Authorization: `Bearer ${TMDB_API_TOKEN}`,
        }
      : {}),
  },
});

const request = async (url, params = {}) => {
  if (!TMDB_API_TOKEN) {
    throw new Error('Missing EXPO_PUBLIC_TMDB_API_TOKEN in .env');
  }

  const response = await tmdbClient.get(url, {
    params: {
      language: 'en-US',
      ...params,
    },
  });

  return response.data;
};

export const fetchNowPlaying = (page = 1) =>
  request('/movie/now_playing', { page });

export const fetchUpcoming = (page = 1) =>
  request('/movie/upcoming', { page });

export const fetchTopRated = (page = 1) =>
  request('/movie/top_rated', { page });

export const fetchPopular = (page = 1) =>
  request('/movie/popular', { page });

export const discoverMovies = (params = {}) =>
  request('/discover/movie', params);

export const fetchIndianCinema = (page = 1) =>
  discoverMovies({
    page,
    region: 'IN',
    sort_by: 'popularity.desc',
    with_origin_country: 'IN',
    include_adult: false,
  });

export const fetchMovieDetails = (movieId, includeVideos = false) =>
  request(`/movie/${movieId}`, {
    append_to_response: includeVideos ? 'videos' : undefined,
  });

export const fetchMovieCast = (movieId) =>
  request(`/movie/${movieId}/credits`);

export const fetchMovieVideos = (movieId) =>
  request(`/movie/${movieId}/videos`);

export const searchMovies = (query, page = 1) =>
  request('/search/movie', { query, page });

export const getTrailerUrl = (videos = []) => {
  const trailer = videos.find(
    (video) =>
      video.site === 'YouTube' &&
      video.key &&
      (video.type === 'Trailer' || video.type === 'Teaser'),
  );

  return trailer ? `https://www.youtube.com/watch?v=${trailer.key}` : null;
};

export const getImageUrl = (path, size = 'w500') =>
  path ? `https://image.tmdb.org/t/p/${size}${path}` : null;

export default {
  fetchNowPlaying,
  fetchUpcoming,
  fetchTopRated,
  fetchPopular,
  fetchIndianCinema,
  discoverMovies,
  fetchMovieDetails,
  fetchMovieCast,
  fetchMovieVideos,
  searchMovies,
  getTrailerUrl,
  getImageUrl,
};
