import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  FlatList,
  Image,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { auth } from '../config/firebase';
import Loader from '../components/Loader';
import useFadeInUp from '../hooks/useFadeInUp';
import { useSession } from '../context/SessionProvider';
import {
  playSoundEffect,
  SOUND_EFFECT_KEYS,
} from '../services/soundEffects';
import { getFeaturedStream } from '../services/streamCatalog';
import {
  fetchIndianCinema,
  fetchNowPlaying,
  fetchPopular,
  fetchUpcoming,
  getImageUrl,
} from '../services/tmdb';

const HomeScreen = () => {
  const navigation = useNavigation();
  const { isAdmin } = useSession();
  const [nowPlaying, setNowPlaying] = useState([]);
  const [upcoming, setUpcoming] = useState([]);
  const [indianSpotlight, setIndianSpotlight] = useState([]);
  const [popularMovies, setPopularMovies] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [currentHeroIndex, setCurrentHeroIndex] = useState(0);
  const headerAnimation = useFadeInUp({ delay: 0 });
  const toolsAnimation = useFadeInUp({ delay: 90 });
  const sectionAnimation = useFadeInUp({ delay: 180 });
  const heroListRef = useRef(null);
  const heroIndexRef = useRef(0);
  const heroWidth = Dimensions.get('window').width - 40;
  const featuredStream = getFeaturedStream();

  const featuredMovies = useMemo(() => nowPlaying.slice(0, 5), [nowPlaying]);
  const normalizedSearchQuery = searchQuery.trim().toLowerCase();
  const matchesSearch = (movie) => {
    if (!normalizedSearchQuery) {
      return true;
    }

    const title = movie.title || movie.name || '';
    return title.toLowerCase().includes(normalizedSearchQuery);
  };

  const filteredNowPlaying = useMemo(
    () => nowPlaying.filter(matchesSearch),
    [nowPlaying, normalizedSearchQuery],
  );
  const filteredUpcoming = useMemo(
    () => upcoming.filter(matchesSearch),
    [normalizedSearchQuery, upcoming],
  );
  const filteredIndianSpotlight = useMemo(
    () => indianSpotlight.filter(matchesSearch),
    [indianSpotlight, normalizedSearchQuery],
  );
  const filteredPopularMovies = useMemo(
    () => popularMovies.filter(matchesSearch),
    [normalizedSearchQuery, popularMovies],
  );
  const movieSections = useMemo(
    () => [
      { key: 'indian_spotlight', title: 'Indian Spotlight', movies: filteredIndianSpotlight },
      { key: 'now_playing', title: 'Now Playing', movies: filteredNowPlaying },
      { key: 'popular', title: 'Popular on TicketBook', movies: filteredPopularMovies },
      { key: 'upcoming', title: 'Upcoming', movies: filteredUpcoming },
    ],
    [filteredIndianSpotlight, filteredNowPlaying, filteredPopularMovies, filteredUpcoming],
  );

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [nowPlayingData, upcomingData, indianCinemaData, popularData] = await Promise.all([
          fetchNowPlaying(),
          fetchUpcoming(),
          fetchIndianCinema(),
          fetchPopular(),
        ]);

        setNowPlaying(nowPlayingData.results.slice(0, 20));
        setUpcoming(upcomingData.results.slice(0, 20));
        setIndianSpotlight((indianCinemaData.results || []).slice(0, 20));
        setPopularMovies((popularData.results || []).slice(0, 20));
        setError(null);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Failed to load movies. Please try again later.');
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      const [nowPlayingData, upcomingData, indianCinemaData, popularData] = await Promise.all([
        fetchNowPlaying(),
        fetchUpcoming(),
        fetchIndianCinema(),
        fetchPopular(),
      ]);
      setNowPlaying(nowPlayingData.results.slice(0, 20));
      setUpcoming(upcomingData.results.slice(0, 20));
      setIndianSpotlight((indianCinemaData.results || []).slice(0, 20));
      setPopularMovies((popularData.results || []).slice(0, 20));
    } catch (err) {
      console.error('Error refreshing data:', err);
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (featuredMovies.length <= 1) {
      heroIndexRef.current = 0;
      setCurrentHeroIndex(0);
      return undefined;
    }

    const interval = setInterval(() => {
      heroIndexRef.current = (heroIndexRef.current + 1) % featuredMovies.length;
      setCurrentHeroIndex(heroIndexRef.current);

      heroListRef.current?.scrollToOffset({
        offset: heroIndexRef.current * heroWidth,
        animated: true,
      });
    }, 3200);

    return () => clearInterval(interval);
  }, [featuredMovies, heroWidth]);

  const renderMovie = ({ item }) => {
    const title = item.title || item.name;
    const rating = item.vote_average.toFixed(1);
    const backdrop = getImageUrl(item.backdrop_path);

    return (
      <TouchableOpacity
        key={item.id}
        style={styles.movieItem}
        onPress={() => {
          playSoundEffect(SOUND_EFFECT_KEYS.TAP);
          navigation.navigate('MovieDetails', { movieId: item.id });
        }}
      >
        {backdrop && (
          <Image
            source={{ uri: backdrop }}
            style={styles.backdropImage}
            resizeMode="cover"
          />
        )}
        <View style={styles.movieOverlay}>
          <Text style={styles.movieTitle}>{title}</Text>
          <Text style={styles.movieRating}>⭐ {rating}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  const renderSection = ({ item }) => (
    <Animated.View style={sectionAnimation}>
      <View style={styles.sectionContainer}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>{item.title}</Text>
          <TouchableOpacity
            onPress={() => {
              playSoundEffect(SOUND_EFFECT_KEYS.TAP);
              navigation.getParent()?.navigate('Movies', { section: item.key });
            }}
          >
            <Text style={styles.sectionLink}>See all</Text>
          </TouchableOpacity>
        </View>
        {item.movies.length > 0 ? (
          <FlatList
            data={item.movies}
            renderItem={renderMovie}
            keyExtractor={(movie) => movie.id.toString()}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.listContent}
          />
        ) : (
          <View style={styles.emptySection}>
            <Text style={styles.emptySectionText}>No movies match that search yet.</Text>
          </View>
        )}
      </View>
    </Animated.View>
  );

  const renderFeaturedMovie = ({ item }) => {
    const title = item.title || item.name;
    const artwork = getImageUrl(item.backdrop_path || item.poster_path);
    const genres = [item.release_date?.slice(0, 4), `${item.vote_average?.toFixed(1) || 'N/A'} IMDb`]
      .filter(Boolean)
      .join(' • ');

    return (
      <TouchableOpacity
        style={[styles.featuredCard, { width: heroWidth }]}
        activeOpacity={0.92}
        onPress={() => {
          playSoundEffect(SOUND_EFFECT_KEYS.TAP);
          navigation.navigate('MovieDetails', { movieId: item.id });
        }}
      >
        {artwork ? (
          <Image source={{ uri: artwork }} style={styles.featuredImage} resizeMode="cover" />
        ) : (
          <View style={styles.featuredFallback}>
            <Ionicons name="film-outline" size={44} color="#B0B0B0" />
          </View>
        )}
        <View style={styles.featuredOverlay}>
          <Text style={styles.featuredEyebrow}>Featured</Text>
          <Text style={styles.featuredTitle} numberOfLines={2}>
            {title}
          </Text>
          <Text style={styles.featuredMeta}>{genres}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  const userLabel =
    auth?.currentUser?.email?.split('@')[0] || auth?.currentUser?.displayName || 'Movie fan';

  if (loading) {
    return <Loader label="Loading movies..." />;
  }

  if (error) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={onRefresh}>
          <Text style={styles.retryText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const renderHeader = () => (
    <>
      <Animated.View style={headerAnimation}>
        <View style={styles.header}>
          <View style={styles.userAvatar}>
            <Ionicons name="person-circle" size={40} color="#E50914" />
            <Text style={styles.userName}>Hi, {userLabel}</Text>
          </View>
          <Text style={styles.headerText}>Discover amazing movies</Text>
        </View>
      </Animated.View>

      {featuredMovies.length > 0 ? (
        <Animated.View style={toolsAnimation}>
          <View style={styles.heroSection}>
            <FlatList
              ref={heroListRef}
              data={featuredMovies}
              renderItem={renderFeaturedMovie}
              keyExtractor={(item) => item.id.toString()}
              horizontal
              pagingEnabled
              decelerationRate="fast"
              showsHorizontalScrollIndicator={false}
              snapToInterval={heroWidth}
              snapToAlignment="start"
              onMomentumScrollEnd={(event) => {
                const nextIndex = Math.round(event.nativeEvent.contentOffset.x / heroWidth);
                heroIndexRef.current = nextIndex;
                setCurrentHeroIndex(nextIndex);
              }}
              getItemLayout={(_, index) => ({
                length: heroWidth,
                offset: heroWidth * index,
                index,
              })}
            />
            <View style={styles.heroDots}>
              {featuredMovies.map((movie, index) => (
                <View
                  key={movie.id}
                  style={[
                    styles.heroDot,
                    index === currentHeroIndex && styles.heroDotActive,
                  ]}
                />
              ))}
            </View>
          </View>
        </Animated.View>
      ) : null}

      <Animated.View style={toolsAnimation}>
        <View style={styles.quickActions}>
          <TouchableOpacity
            style={styles.quickActionButton}
            onPress={() => {
              playSoundEffect(SOUND_EFFECT_KEYS.TAP);
              navigation.navigate('Tickets');
            }}
          >
            <Ionicons name="ticket-outline" size={18} color="#FFFFFF" />
            <Text style={styles.quickActionText}>My Tickets</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.quickActionButton}
            onPress={() => {
              playSoundEffect(SOUND_EFFECT_KEYS.TAP);
              navigation.getParent()?.navigate('Movies', { section: 'now_playing' });
            }}
          >
            <Ionicons name="grid-outline" size={18} color="#FFFFFF" />
            <Text style={styles.quickActionText}>Browse Movies</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>

      {isAdmin ? (
        <Animated.View style={toolsAnimation}>
          <View style={styles.quickActions}>
            <TouchableOpacity
              style={styles.quickActionButton}
              onPress={() => {
                playSoundEffect(SOUND_EFFECT_KEYS.TAP);
                navigation.navigate('Admin');
              }}
            >
              <Ionicons name="shield-outline" size={18} color="#FFFFFF" />
              <Text style={styles.quickActionText}>Admin Panel</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      ) : null}

      <Animated.View style={toolsAnimation}>
        <View style={styles.quickActions}>
          <TouchableOpacity
            style={styles.quickActionButton}
            onPress={() => {
              playSoundEffect(SOUND_EFFECT_KEYS.TAP);
              navigation.navigate('Stream');
            }}
          >
            <Ionicons name="play-circle-outline" size={18} color="#FFFFFF" />
            <Text style={styles.quickActionText}>Watch Now</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.quickActionButton}
            onPress={() => {
              playSoundEffect(SOUND_EFFECT_KEYS.TAP);
              navigation.navigate('Community');
            }}
          >
            <Ionicons name="people-outline" size={18} color="#FFFFFF" />
            <Text style={styles.quickActionText}>Community</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>

      <Animated.View style={toolsAnimation}>
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color="#808080" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search movies, then jump into streaming..."
            placeholderTextColor="#606060"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          <TouchableOpacity
            style={styles.searchIconContainer}
            onPress={() => {
              playSoundEffect(SOUND_EFFECT_KEYS.TAP);
              navigation.navigate('Stream');
            }}
          >
            <Ionicons name="play" size={20} color="#808080" />
          </TouchableOpacity>
        </View>
      </Animated.View>

      <Animated.View style={toolsAnimation}>
        <TouchableOpacity
          style={styles.discoveryCard}
          activeOpacity={0.92}
          onPress={() => {
            playSoundEffect(SOUND_EFFECT_KEYS.TAP);
            navigation.navigate('Stream');
          }}
        >
          <View style={styles.discoveryCardCopy}>
            <Text style={styles.discoveryEyebrow}>New in app</Text>
            <Text style={styles.discoveryTitle}>Stream with YouTube playback</Text>
            <Text style={styles.discoveryText}>
              Jump from booking into a Netflix-style watch area with mobile-friendly in-app playback.
            </Text>
            <Text style={styles.discoveryMeta}>
              Featured: {featuredStream.title} • {featuredStream.duration}
            </Text>
          </View>
          <View style={styles.discoveryIconBubble}>
            <Ionicons name="play-circle" size={34} color="#FFFFFF" />
          </View>
        </TouchableOpacity>
      </Animated.View>
    </>
  );

  return (
    <FlatList
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
      data={movieSections}
      renderItem={renderSection}
      keyExtractor={(item) => item.key}
      ListHeaderComponent={renderHeader}
      ListFooterComponent={<View style={styles.footerSpacer} />}
      showsVerticalScrollIndicator={false}
      refreshing={refreshing}
      onRefresh={onRefresh}
    />
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#050505',
  },
  scrollContent: {
    paddingTop: 54,
    paddingBottom: 36,
  },
  header: {
    padding: 20,
    marginBottom: 20,
  },
  userAvatar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 30,
    padding: 10,
    paddingHorizontal: 16,
  },
  userName: {
    fontSize: 14,
    color: '#E50914',
    fontWeight: '600',
    marginLeft: 10,
  },
  headerText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    marginTop: 14,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2A2A2A',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginRight: 20,
    marginHorizontal: 20,
    marginBottom: 20,
    height: 50,
    elevation: 2,
  },
  quickActions: {
    paddingHorizontal: 20,
    marginBottom: 12,
    flexDirection: 'row',
    gap: 12,
  },
  discoveryCard: {
    marginHorizontal: 20,
    marginBottom: 18,
    borderRadius: 22,
    padding: 18,
    backgroundColor: '#12161F',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    flexDirection: 'row',
    alignItems: 'center',
  },
  discoveryCardCopy: {
    flex: 1,
    paddingRight: 14,
  },
  discoveryEyebrow: {
    color: '#E50914',
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  discoveryTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '800',
    marginTop: 8,
  },
  discoveryText: {
    color: '#C8C8CC',
    fontSize: 13,
    lineHeight: 20,
    marginTop: 8,
  },
  discoveryMeta: {
    color: '#8A8A92',
    marginTop: 10,
    fontSize: 12,
    fontWeight: '600',
  },
  discoveryIconBubble: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: '#E50914',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroSection: {
    marginBottom: 22,
  },
  featuredCard: {
    height: 220,
    marginHorizontal: 20,
    borderRadius: 22,
    overflow: 'hidden',
    backgroundColor: '#141414',
  },
  featuredImage: {
    width: '100%',
    height: '100%',
  },
  featuredFallback: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#141414',
  },
  featuredOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 18,
    paddingVertical: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.58)',
  },
  featuredEyebrow: {
    color: '#E50914',
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    marginBottom: 6,
    letterSpacing: 0.8,
  },
  featuredTitle: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '800',
  },
  featuredMeta: {
    color: '#D4D4D4',
    fontSize: 13,
    marginTop: 6,
    fontWeight: '500',
  },
  heroDots: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 12,
  },
  heroDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    marginHorizontal: 4,
  },
  heroDotActive: {
    width: 24,
    backgroundColor: '#E50914',
  },
  quickActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#141414',
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    flex: 1,
  },
  quickActionText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
    marginLeft: 8,
  },
  searchIconContainer: {
    marginLeft: 'auto',
  },
  searchInput: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 16,
  },
  sectionContainer: {
    marginBottom: 30,
  },
  emptySection: {
    backgroundColor: '#111113',
    borderRadius: 16,
    paddingVertical: 18,
    paddingHorizontal: 16,
    marginHorizontal: 20,
  },
  emptySectionText: {
    color: '#8F8F97',
    textAlign: 'center',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  sectionLink: {
    fontSize: 14,
    color: '#E50914',
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
  listContent: {
    paddingVertical: 10,
  },
  movieItem: {
    width: 130,
    marginHorizontal: 5,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#1A1A1A',
    position: 'relative',
  },
  backdropImage: {
    width: '100%',
    height: 180,
  },
  movieOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  movieTitle: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
    lineHeight: 16,
  },
  movieRating: {
    color: '#E50914',
    fontSize: 10,
    fontWeight: '600',
    marginTop: 4,
  },
  errorText: {
    color: '#FFFFFF',
    fontSize: 16,
    textAlign: 'center',
    marginTop: 100,
  },
  retryButton: {
    backgroundColor: '#E50914',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    marginTop: 20,
  },
  retryText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  footerSpacer: {
    height: 12,
  },
});

export default HomeScreen;
