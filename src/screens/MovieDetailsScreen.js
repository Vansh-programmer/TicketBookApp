import React, { useEffect, useState } from 'react';
import {
  Animated,
  FlatList,
  Linking,
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

  const handleWatchTrailer = async () => {
    if (!trailerUrl) {
      playSoundEffect(SOUND_EFFECT_KEYS.ERROR);
      showToast('Trailer is not available for this movie yet.', { type: 'error' });
      return;
    }

    try {
      playSoundEffect(SOUND_EFFECT_KEYS.TRAILER);
      await Linking.openURL(trailerUrl);
    } catch (openError) {
      console.error('Unable to open trailer:', openError);
      playSoundEffect(SOUND_EFFECT_KEYS.ERROR);
      showToast('Unable to open the trailer right now.', { type: 'error' });
    }
  };

  const trailerVideoId = extractYouTubeVideoId(trailerUrl);

  const handlePlayTrailerInApp = () => {
    if (!trailerVideoId) {
      playSoundEffect(SOUND_EFFECT_KEYS.ERROR);
      showToast('In-app playback is not available for this trailer yet.', { type: 'error' });
      return;
    }

    playSoundEffect(SOUND_EFFECT_KEYS.TRAILER);
    navigation.navigate('Player', {
      videoId: trailerVideoId,
      title: movie.title || movie.name,
      subtitle: 'Trailer • In-app playback',
      description: movie.overview,
      badge: 'Trailer',
    });
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
    >
      <Animated.View style={headerAnimation}>
        <View style={styles.posterContainer}>
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
        </View>
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
                  <Text style={styles.metaText}>{movie.vote_average?.toFixed(1) || 'N/A'}</Text>
                </View>
              </View>
            </View>
          </View>

          <View style={styles.overviewContainer}>
            <Text style={styles.overviewTitle}>Overview</Text>
            <Text style={styles.overviewText}>{movie.overview}</Text>
            <View style={styles.actionRow}>
              <TouchableOpacity
                style={[styles.trailerButton, !trailerVideoId && styles.trailerButtonDisabled]}
                onPress={handlePlayTrailerInApp}
                disabled={!trailerVideoId}
                activeOpacity={0.85}
              >
                <Ionicons name="play-circle-outline" size={20} color="#FFFFFF" />
                <Text style={styles.trailerButtonText}>
                  {trailerVideoId ? 'Play In App' : 'In-App Unavailable'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.secondaryButton, !trailerUrl && styles.trailerButtonDisabled]}
                onPress={handleWatchTrailer}
                disabled={!trailerUrl}
                activeOpacity={0.85}
              >
                <Ionicons name="logo-youtube" size={20} color="#FFFFFF" />
                <Text style={styles.trailerButtonText}>
                  {trailerUrl ? 'Open Trailer' : 'Trailer Unavailable'}
                </Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={styles.streamButton}
              onPress={() => navigation.navigate('Home', { screen: 'Stream' })}
              activeOpacity={0.85}
            >
              <Ionicons name="sparkles-outline" size={18} color="#FFFFFF" />
              <Text style={styles.streamButtonText}>Explore the new Stream tab</Text>
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

      <View style={styles.footerContainer}>
        <TouchableOpacity
          style={styles.footerButton}
          onPress={() => {
            playSoundEffect(SOUND_EFFECT_KEYS.TAP);
            navigation.navigate('LocationSelection', {
              movieTitle: movie.title || movie.name,
              movieId,
              moviePoster: movie.poster_path ? getImageUrl(movie.poster_path) : null,
            });
          }}
        >
          <Ionicons name="ticket-outline" size={24} color="#FFFFFF" />
          <Text style={styles.footerButtonText}>Book Ticket</Text>
        </TouchableOpacity>
      </View>
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
  cardContainer: {
    marginTop: -50, // Pull card up
    backgroundColor: '#1A1A1A',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    paddingBottom: 100, // Space for footer
  },
  titleContainer: {
    marginBottom: 15,
  },
  movieTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 10,
  },
  infoContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
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
    borderRadius: 16,
  },
  genreText: {
    color: '#B0B0B0',
    fontSize: 12,
  },
  metaContainer: {
    flexDirection: 'row',
    gap: 16,
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
    borderRadius: 60,
    marginBottom: 10,
  },
  castPlaceholder: {
    width: 100,
    height: 140,
    borderRadius: 60,
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
  footerContainer: {
    padding: 15,
  },
  footerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E50914',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
  },
  footerButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    marginLeft: 10,
  },
  errorText: {
    color: '#FFFFFF',
    fontSize: 16,
    textAlign: 'center',
    marginTop: 200,
  },
  trailerButton: {
    marginTop: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E50914',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignSelf: 'flex-start',
  },
  actionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 18,
  },
  secondaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#26262B',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignSelf: 'flex-start',
  },
  trailerButtonDisabled: {
    backgroundColor: '#383838',
  },
  trailerButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    marginLeft: 8,
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
