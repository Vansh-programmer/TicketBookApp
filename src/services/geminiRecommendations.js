import { fetchMovieDetails, getImageUrl, searchMovies } from './tmdb';

const GEMINI_API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY;
const GEMINI_MODEL = process.env.EXPO_PUBLIC_GEMINI_MODEL || 'gemini-2.5-flash';
const GEMINI_BASE_URL = 'https://generativelanguage.googleapis.com/v1beta/models';

const buildRecommendationPrompt = (prompt) => `
You are a movie recommendation assistant for a cinema app.
Recommend exactly 5 real movies that best match the user's request.
Return only valid JSON with this shape:
{
  "recommendations": [
    {
      "title": "Movie title",
      "year": 2024,
      "reason": "Short reason in under 25 words"
    }
  ]
}

Rules:
- Recommend only released films.
- Prefer globally known titles with IMDb pages.
- Avoid TV shows, mini-series, anime seasons, and documentaries unless the user explicitly asks for them.
- Keep the reasons concise and user-friendly.

User request: ${prompt}
`.trim();

const extractResponseText = (payload) =>
  payload?.candidates?.[0]?.content?.parts?.map((part) => part.text || '').join('') || '';

const parseRecommendationsFromText = (text) => {
  const normalizedText = text.trim();
  const jsonMatch = normalizedText.match(/\{[\s\S]*\}/);
  const jsonText = jsonMatch ? jsonMatch[0] : normalizedText;
  const parsed = JSON.parse(jsonText);

  return Array.isArray(parsed.recommendations) ? parsed.recommendations : [];
};

const findBestMovieMatch = (results, recommendation) => {
  if (!Array.isArray(results) || results.length === 0) {
    return null;
  }

  const normalizedTitle = recommendation.title?.trim().toLowerCase();
  const targetYear = recommendation.year ? String(recommendation.year) : '';

  const exactMatch = results.find((movie) => {
    const movieTitle = (movie.title || movie.name || '').trim().toLowerCase();
    const releaseYear = movie.release_date?.slice(0, 4) || '';

    if (movieTitle !== normalizedTitle) {
      return false;
    }

    return !targetYear || releaseYear === targetYear;
  });

  return exactMatch || results[0];
};

const enrichRecommendation = async (recommendation) => {
  const searchResponse = await searchMovies(recommendation.title, 1);
  const matchedMovie = findBestMovieMatch(searchResponse.results || [], recommendation);

  if (!matchedMovie?.id) {
    return {
      id: recommendation.title,
      title: recommendation.title,
      year: recommendation.year || 'N/A',
      reason: recommendation.reason,
      imdbUrl: `https://www.imdb.com/find/?q=${encodeURIComponent(recommendation.title)}`,
      posterUrl: null,
      voteAverage: null,
      movieId: null,
    };
  }

  const movieDetails = await fetchMovieDetails(matchedMovie.id);
  const imdbUrl = movieDetails.imdb_id
    ? `https://www.imdb.com/title/${movieDetails.imdb_id}/`
    : `https://www.imdb.com/find/?q=${encodeURIComponent(recommendation.title)}`;

  return {
    id: matchedMovie.id,
    title: matchedMovie.title || matchedMovie.name || recommendation.title,
    year: matchedMovie.release_date?.slice(0, 4) || recommendation.year || 'N/A',
    reason: recommendation.reason,
    imdbUrl,
    posterUrl: getImageUrl(matchedMovie.poster_path || matchedMovie.backdrop_path),
    voteAverage: matchedMovie.vote_average || movieDetails.vote_average || null,
    movieId: matchedMovie.id,
  };
};

export const isGeminiConfigured = Boolean(GEMINI_API_KEY);

export const fetchGeminiMovieRecommendations = async (prompt) => {
  const trimmedPrompt = prompt?.trim();

  if (!trimmedPrompt) {
    return [];
  }

  if (!GEMINI_API_KEY) {
    throw new Error('Missing EXPO_PUBLIC_GEMINI_API_KEY in .env');
  }

  const response = await fetch(`${GEMINI_BASE_URL}/${GEMINI_MODEL}:generateContent`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-goog-api-key': GEMINI_API_KEY,
    },
    body: JSON.stringify({
      contents: [
        {
          role: 'user',
          parts: [
            {
              text: buildRecommendationPrompt(trimmedPrompt),
            },
          ],
        },
      ],
    }),
  });

  if (!response.ok) {
    throw new Error(`Gemini API returned ${response.status}`);
  }

  const payload = await response.json();
  const responseText = extractResponseText(payload);
  const recommendations = parseRecommendationsFromText(responseText).slice(0, 5);

  if (recommendations.length === 0) {
    throw new Error('Gemini did not return any movie recommendations.');
  }

  return Promise.all(recommendations.map(enrichRecommendation));
};

