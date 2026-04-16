import React, { useEffect, useState } from 'react';
import {
  Animated,
  FlatList,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import Loader from '../components/Loader';
import { useToast } from '../components/ToastProvider';
import useFadeInUp from '../hooks/useFadeInUp';
import { useMovieLikes } from '../hooks/useMovieLikes';
import {
  playSoundEffect,
  SOUND_EFFECT_KEYS,
} from '../services/soundEffects';
import {
  fetchMovieDetails,
  fetchMovieCast,
  fetchMovieVideos,
  getImageUrl,
  getTrailerUrl,
} from '../services/tmdb';
import { extractYouTubeVideoId } from '../services/streamCatalog';
import { LinearGradient } from 'expo-linear-gradient';

const MovieDetailsScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { movieId } = route.params ?? {};

  const [movie, setMovie] = useState(null);
  const [cast, setCast] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [trailerUrl, setTrailerUrl] = useState(null);
  const headerAnimation = useFadeInUp({ delay: 0 });
  const contentAnimation = useFadeInUp({ delay: 120 });
  const { showToast } = useToast();
  const { isMovieLiked, toggleMovieLikeState } = useMovieLikes();

  useEffect(() => {
    const fetchData = async () => {
      if (!movieId) {
        setError('Movie not found.');
        setLoading(false);
        return;
      }

      try {
        const [movieData, castData] = await Promise.all([
          fetchMovieDetails(movieId),
          fetchMovieCast(movieId),
        ]);
        const videoData = await fetchMovieVideos(movieId);

        setMovie(movieData);
        setCast((castData.cast || []).slice(0, 10));
        setTrailerUrl(getTrailerUrl(videoData.results || []));
        setLoading(false);
      } catch (err) {
        console.error('Error fetching movie data:', err);
        setError('Failed to load movie details');
        setLoading(false);
      }
    };

    fetchData();
  }, [movieId]);

  const renderCastMember = ({ item }) => {
    return (
      <View style={styles.castItem}>
        {item.profile_path ? (
          <Image
            source={{ uri: getImageUrl(item.profile_path, 'w185') }}
            style={styles.castImage}
          />
        ) : (
          <View style={styles.castPlaceholder}>
            <Ionicons name="person-circle-outline" size={60} color="#606060" />
          </View>
        )}
        <Text style={styles.castName}>{item.name}</Text>
        <Text style={styles.castCharacter}>{item.character}</Text>
      </View>
    );
  };

  if (loading) {
    return <Loader label="Loading movie details..." />;
  }

  if (error) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  if (!movieId) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Movie not found.</Text>
      </View>
    );
  }

  const trailerVideoId = extractYouTubeVideoId(trailerUrl);
  const liked = isMovieLiked(movieId);

  const handlePlayTrailer = () => {
    if (!trailerVideoId) {
      playSoundEffect(SOUND_EFFECT_KEYS.ERROR, { volume: 0.64, releaseAfterMs: 1900 });
      showToast('Trailer is not available for this movie yet.', { type: 'error' });
      return;
    }

    playSoundEffect(SOUND_EFFECT_KEYS.TRAILER, { volume: 0.9, releaseAfterMs: 12000 });
    navigation.navigate('Player', {
      videoId: trailerVideoId,
      title: movie.title || movie.name,
      subtitle: 'Trailer • In-app playback',
      description: movie.overview,
      badge: 'Trailer',
    });
  };

  const handleToggleLike = async () => {
    if (!movieId) {
      return;
    }

    try {
      const nextLikedState = await toggleMovieLikeState(movieId);
      const movieTitle = movie?.title || movie?.name || 'Movie';

      playSoundEffect(nextLikedState ? SOUND_EFFECT_KEYS.SUCCESS : SOUND_EFFECT_KEYS.TAP, {
        volume: nextLikedState ? 0.72 : 0.3,
      });
      showToast(
        nextLikedState
          ? `${movieTitle} added to liked movies.`
          : `${movieTitle} removed from liked movies.`,
        { type: nextLikedState ? 'success' : 'info' },
      );
    } catch (error) {
      console.error('Unable to update movie like:', error);
      playSoundEffect(SOUND_EFFECT_KEYS.ERROR, { volume: 0.62, releaseAfterMs: 1900 });
      showToast('Unable to update this like right now.', { type: 'error' });
    }
  };

  const handleBookTicket = () => {
    playSoundEffect(SOUND_EFFECT_KEYS.TAP, { volume: 0.34 });
    navigation.navigate('LocationSelection', {
      movieTitle: movie.title || movie.name,
      movieId,
      moviePoster: movie.poster_path ? getImageUrl(movie.poster_path) : null,
    });
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
    >
      <Animated.View style={headerAnimation}>
        <TouchableOpacity
          style={styles.posterContainer}
          onPress={handlePlayTrailer}
          activeOpacity={0.92}
        >
          {movie.poster_path ? (
            <Image
              source={{
                uri: getImageUrl(movie.poster_path),
              }}
              style={styles.posterImage}
              resizeMode="cover"
            />
          ) : (
            <View style={styles.posterFallback}>
              <Ionicons name="film-outline" size={56} color="#606060" />
            </View>
          )}
          <View style={styles.posterOverlay}>
            <View style={[styles.posterPlayButton, !trailerVideoId && styles.posterPlayButtonDisabled]}>
              <Ionicons
                name={trailerVideoId ? 'play' : 'videocam-off-outline'}
                size={22}
                color="#FFFFFF"
              />
            </View>
            <Text style={styles.posterHint}>
              {trailerVideoId ? 'Play trailer' : 'Trailer unavailable'}
            </Text>
          </View>
        </TouchableOpacity>
      </Animated.View>

      <Animated.View style={contentAnimation}>
        <View style={styles.cardContainer}>
          <View style={styles.titleContainer}>
            <Text style={styles.movieTitle}>{movie.title || movie.name}</Text>
            <View style={styles.infoContainer}>
              <View style={styles.genreContainer}>
                {(movie.genres || []).map((genre) => (
                  <View key={genre.id} style={styles.genrePill}>
                    <Text style={styles.genreText}>{genre.name}</Text>
                  </View>
                ))}
              </View>
              <View style={styles.metaContainer}>
                <View style={styles.metaItem}>
                  <Ionicons name="time-outline" size={14} color="#B0B0B0" />
                  <Text style={styles.metaText}>{movie.runtime || '--'} min</Text>
                </View>
                <View style={styles.metaItem}>
                  <Ionicons name="star" size={14} color="#E50914" />
                  <Text style={styles.metaText}>{movie.vote_average?.toFixed(1) || 'NR'}</Text>
                </View>
              </View>
            </View>
          </View>

          <View style={styles.overviewContainer}>
            <Text style={styles.overviewTitle}>Overview</Text>
            <Text style={styles.overviewText}>{movie.overview}</Text>
            <View style={styles.actionRow}>
              <TouchableOpacity
                style={[styles.secondaryButton, liked && styles.likeButtonActive]}
                onPress={handleToggleLike}
                activeOpacity={0.85}
              >
                <Ionicons name={liked ? 'heart' : 'heart-outline'} size={20} color="#FFFFFF" />
                <Text style={styles.secondaryButtonText}>{liked ? 'Liked' : 'Like Movie'}</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.bookInlineButton}
                onPress={handleBookTicket}
                activeOpacity={0.88}
              >
                <LinearGradient
                  colors={['#FF5D5D', '#E50914']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.bookInlineButtonGradient}
                >
                  <Ionicons name="ticket-outline" size={20} color="#FFFFFF" />
                  <Text style={styles.bookInlineButtonText}>Book Ticket</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={styles.streamButton}
              onPress={() => navigation.navigate('Home', { screen: 'Stream' })}
              activeOpacity={0.85}
            >
              <Ionicons name="play-circle-outline" size={18} color="#FFFFFF" />
              <Text style={styles.streamButtonText}>Watch options</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.myTicketsLinkWrap}
              onPress={() => {
                playSoundEffect(SOUND_EFFECT_KEYS.TAP, { volume: 0.3 });
                navigation.navigate('MyTickets');
              }}
            >
              <Ionicons name="receipt-outline" size={15} color="#AFC8FF" />
              <Text style={styles.myTicketsLinkText}>View My Tickets</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.castContainer}>
            <Text style={styles.castTitle}>Cast</Text>
            <FlatList
              data={cast}
              renderItem={renderCastMember}
              keyExtractor={(item) => item.id.toString()}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.castListContent}
            />
          </View>
        </View>
      </Animated.View>

    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#050505',
  },
  contentContainer: {
    paddingBottom: 28,
  },
  posterContainer: {
    height: 300, // Adjust height based on device
    width: '100%',
    position: 'relative',
  },
  posterImage: {
    width: '100%',
    height: '100%',
  },
  posterFallback: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#121212',
  },
  posterOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.28)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  posterPlayButton: {
    width: 68,
    height: 68,
    borderRadius: 8,
    backgroundColor: 'rgba(229, 9, 20, 0.88)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.22)',
  },
  posterPlayButtonDisabled: {
    backgroundColor: 'rgba(56, 56, 56, 0.88)',
  },
  posterHint: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
    marginTop: 12,
    backgroundColor: 'rgba(0,0,0,0.34)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  cardContainer: {
    marginTop: -44,
    backgroundColor: '#11141A',
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
    padding: 20,
    paddingBottom: 100, // Space for footer
  },
  titleContainer: {
    marginBottom: 15,
  },
  movieTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 10,
  },
  infoContainer: {
    gap: 12,
  },
  genreContainer: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  genrePill: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  genreText: {
    color: '#B0B0B0',
    fontSize: 12,
  },
  metaContainer: {
    flexDirection: 'row',
    gap: 14,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metaText: {
    color: '#B0B0B0',
    fontSize: 12,
    marginLeft: 4,
    fontWeight: '500',
  },
  overviewContainer: {
    marginTop: 20,
  },
  overviewTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 10,
  },
  overviewText: {
    color: '#B0B0B0',
    fontSize: 14,
    lineHeight: 20,
  },
  castContainer: {
    marginTop: 30,
  },
  castTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 15,
  },
  castListContent: {
    paddingBottom: 20,
  },
  castItem: {
    width: 120,
    marginRight: 15,
    alignItems: 'center',
  },
  castImage: {
    width: 100,
    height: 140,
    borderRadius: 8,
    marginBottom: 10,
  },
  castPlaceholder: {
    width: 100,
    height: 140,
    borderRadius: 8,
    backgroundColor: '#2A2A2A',
    marginBottom: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  castName: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },
  castCharacter: {
    color: '#808080',
    fontSize: 11,
    textAlign: 'center',
    marginTop: 2,
  },
  bookInlineButton: {
    marginLeft: 10,
    borderRadius: 8,
    overflow: 'hidden',
    alignSelf: 'flex-start',
  },
  bookInlineButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  bookInlineButtonText: {
    color: '#FFFFFF',
    fontWeight: '800',
    marginLeft: 8,
  },
  myTicketsLinkWrap: {
    marginTop: 12,
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 6,
  },
  myTicketsLinkText: {
    color: '#AFC8FF',
    fontSize: 13,
    fontWeight: '700',
  },
  errorText: {
    color: '#FFFFFF',
    fontSize: 16,
    textAlign: 'center',
    marginTop: 200,
  },
  actionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 18,
  },
  secondaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#26262B',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignSelf: 'flex-start',
  },
  secondaryButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    marginLeft: 8,
  },
  likeButtonActive: {
    backgroundColor: '#B91C1C',
  },
  streamButton: {
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingVertical: 8,
  },
  streamButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    marginLeft: 8,
  },
});

export default MovieDetailsScreen;
