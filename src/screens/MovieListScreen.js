import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { fetchNowPlaying, fetchUpcoming, getImageUrl } from '../services/tmdb';

const MovieListScreen = ({ route, navigation }) => {
  const { section = 'now_playing' } = route.params ?? {};
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError('');

      try {
        const moviesData =
          section === 'now_playing' ? await fetchNowPlaying() : await fetchUpcoming();
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
    () => (section === 'now_playing' ? 'Now Playing' : 'Upcoming Movies'),
    [section],
  );

  const renderMovie = ({ item }) => {
    const title = item.title || item.name;
    const rating = item.vote_average?.toFixed(1) || 'N/A';
    const releaseDate = item.release_date ? item.release_date.substring(0, 4) : 'TBD';
    const artwork = getImageUrl(item.poster_path || item.backdrop_path);

    return (
      <TouchableOpacity
        style={styles.movieItem}
        onPress={() => navigation.navigate('MovieDetails', { movieId: item.id })}
        activeOpacity={0.85}
      >
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
          data={movies}
          renderItem={renderMovie}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.listContent}
          numColumns={2}
          columnWrapperStyle={styles.row}
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
  },
  movieItem: {
    width: '48%',
    marginBottom: 16,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#141414',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
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
