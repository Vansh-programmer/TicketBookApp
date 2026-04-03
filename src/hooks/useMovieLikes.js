import { useCallback, useEffect, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { getLikedMovieIds, toggleLikedMovie } from '../services/movieLikes';

export const useMovieLikes = () => {
  const [likedMovieIds, setLikedMovieIds] = useState(new Set());

  const hydrateLikedMovieIds = useCallback(async () => {
    try {
      const movieIds = await getLikedMovieIds();
      setLikedMovieIds(new Set(movieIds));
    } catch (error) {
      console.error('Unable to load liked movies:', error);
    }
  }, []);

  useEffect(() => {
    hydrateLikedMovieIds();
  }, [hydrateLikedMovieIds]);

  useFocusEffect(
    useCallback(() => {
      hydrateLikedMovieIds();
    }, [hydrateLikedMovieIds]),
  );

  const toggleMovieLikeState = useCallback(async (movieId) => {
    const nextLikedState = await toggleLikedMovie(movieId);

    setLikedMovieIds((currentMovieIds) => {
      const nextMovieIds = new Set(currentMovieIds);

      if (nextLikedState) {
        nextMovieIds.add(String(movieId));
      } else {
        nextMovieIds.delete(String(movieId));
      }

      return nextMovieIds;
    });

    return nextLikedState;
  }, []);

  const isMovieLiked = useCallback(
    (movieId) => likedMovieIds.has(String(movieId)),
    [likedMovieIds],
  );

  return {
    likedMovieIds,
    isMovieLiked,
    toggleMovieLikeState,
    refreshLikedMovieIds: hydrateLikedMovieIds,
  };
};

