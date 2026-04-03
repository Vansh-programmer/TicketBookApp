import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  fetchIndianCinema,
  fetchNowPlaying,
  fetchPopular,
  fetchUpcoming,
  getImageUrl,
} from '../services/tmdb';
import { useToast } from '../components/ToastProvider';
import { useMovieLikes } from '../hooks/useMovieLikes';

const MovieListScreen = ({ route, navigation }) => {
  const { section = 'now_playing' } = route.params ?? {};
  const { width } = useWindowDimensions();
  const { showToast } = useToast();
  const { isMovieLiked, toggleMovieLikeState } = useMovieLikes();
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const numColumns = width >= 940 ? 4 : width >= 680 ? 3 : 2;
  const horizontalPadding = 32;
  const cardGap = 12;
  const itemWidth = (width - horizontalPadding - cardGap * (numColumns - 1)) / numColumns;

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError('');

      try {
        let moviesData;

        if (section === 'now_playing') {
          moviesData = await fetchNowPlaying();
        } else if (section === 'upcoming') {
          moviesData = await fetchUpcoming();
        } else if (section === 'popular') {
          moviesData = await fetchPopular();
        } else {
          moviesData = await fetchIndianCinema();
        }
        setMovies((moviesData.results || []).filter((movie) => movie.backdrop_path || movie.poster_path));
      } catch (fetchError) {
        console.error('Error fetching movies:', fetchError);
        setError('Unable to load movies right now.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [section]);

  const screenTitle = useMemo(
    () => ({
      now_playing: 'Now Playing',
      upcoming: 'Upcoming Movies',
      popular: 'Popular on TicketBook',
      indian_spotlight: 'Indian Spotlight',
    }[section] || 'Movie Collection'),
    [section],
  );

  const renderMovie = ({ item }) => {
    const title = item.title || item.name;
    const rating = item.vote_average?.toFixed(1) || 'N/A';
    const releaseDate = item.release_date ? item.release_date.substring(0, 4) : 'TBD';
    const artwork = getImageUrl(item.poster_path || item.backdrop_path);
    const liked = isMovieLiked(item.id);

    const handleToggleLike = async (event) => {
      event?.stopPropagation?.();

      try {
        const nextLikedState = await toggleMovieLikeState(item.id);
        showToast(
          nextLikedState
            ? `${title} added to liked movies.`
            : `${title} removed from liked movies.`,
          { type: nextLikedState ? 'success' : 'info' },
        );
      } catch (error) {
        console.error('Unable to update movie like:', error);
        showToast('Unable to update this like right now.', { type: 'error' });
      }
    };

    return (
      <TouchableOpacity
        style={[styles.movieItem, { width: itemWidth }]}
        onPress={() => navigation.navigate('MovieDetails', { movieId: item.id })}
        activeOpacity={0.85}
      >
        <TouchableOpacity
          style={[styles.likeButton, liked && styles.likeButtonActive]}
          onPress={handleToggleLike}
          activeOpacity={0.85}
        >
          <Ionicons name={liked ? 'heart' : 'heart-outline'} size={18} color="#FFFFFF" />
        </TouchableOpacity>
        {artwork ? (
          <Image source={{ uri: artwork }} style={styles.posterImage} resizeMode="cover" />
        ) : (
          <View style={styles.posterFallback}>
            <Ionicons name="film-outline" size={30} color="#808080" />
          </View>
        )}
        <View style={styles.movieContent}>
          <Text style={styles.movieTitle} numberOfLines={2}>
            {title}
          </Text>
          <Text style={styles.movieMeta}>⭐ {rating}</Text>
          <Text style={styles.movieMeta}>{releaseDate}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <View style={styles.headerTextGroup}>
          <Text style={styles.headerTitle}>{screenTitle}</Text>
          <Text style={styles.headerSubtitle}>Browse all available titles</Text>
        </View>
      </View>

      {loading ? (
        <View style={styles.centerState}>
          <ActivityIndicator size="large" color="#E50914" />
          <Text style={styles.stateText}>Loading movies...</Text>
        </View>
      ) : error ? (
        <View style={styles.centerState}>
          <Text style={styles.stateText}>{error}</Text>
        </View>
      ) : (
        <FlatList
          key={numColumns}
          data={movies}
          renderItem={renderMovie}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.listContent}
          numColumns={numColumns}
          columnWrapperStyle={numColumns > 1 ? styles.row : undefined}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#050505',
  },
  header: {
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 18,
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    marginRight: 15,
  },
  headerTextGroup: {
    flex: 1,
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '700',
  },
  headerSubtitle: {
    color: '#B0B0B0',
    fontSize: 13,
    marginTop: 4,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 30,
  },
  row: {
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  movieItem: {
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#141414',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    position: 'relative',
  },
  likeButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(5, 5, 5, 0.72)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2,
  },
  likeButtonActive: {
    backgroundColor: '#E50914',
  },
  posterImage: {
    width: '100%',
    height: 220,
  },
  posterFallback: {
    width: '100%',
    height: 220,
    backgroundColor: '#1F1F1F',
    alignItems: 'center',
    justifyContent: 'center',
  },
  movieContent: {
    padding: 12,
  },
  movieTitle: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 8,
    minHeight: 38,
  },
  movieMeta: {
    color: '#B0B0B0',
    fontSize: 12,
    marginBottom: 4,
  },
  centerState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  stateText: {
    color: '#B0B0B0',
    fontSize: 14,
    marginTop: 12,
    textAlign: 'center',
  },
});

export default MovieListScreen;
