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
import { useToast } from '../components/ToastProvider';
import useFadeInUp from '../hooks/useFadeInUp';
import { useMovieLikes } from '../hooks/useMovieLikes';
import { useSession } from '../context/SessionProvider';
import {
  playSoundEffect,
  SOUND_EFFECT_KEYS,
} from '../services/soundEffects';
import {
  fetchIndianCinema,
  fetchNowPlaying,
  fetchPopular,
  fetchUpcoming,
  getImageUrl,
} from '../services/tmdb';

const HERO_HORIZONTAL_INSET = 14;
const HERO_CARD_GAP = 10;

const HomeScreen = () => {
  const navigation = useNavigation();
  const { isAdmin } = useSession();
  const { showToast } = useToast();
  const { isMovieLiked, toggleMovieLikeState } = useMovieLikes();
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
  const screenWidth = Dimensions.get('window').width;
  const heroWidth = screenWidth - HERO_HORIZONTAL_INSET * 2;
  const heroSnapInterval = heroWidth + HERO_CARD_GAP;

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
      const nextIndex = (heroIndexRef.current + 1) % featuredMovies.length;
      heroIndexRef.current = nextIndex;
      setCurrentHeroIndex(nextIndex);

      heroListRef.current?.scrollToIndex({
        index: nextIndex,
        animated: true,
        viewPosition: 0,
      });
    }, 3600);

    return () => clearInterval(interval);
  }, [featuredMovies]);

  const handleToggleMovieLike = async (event, movie) => {
    event?.stopPropagation?.();

    try {
      const nextLikedState = await toggleMovieLikeState(movie.id);
      const movieTitle = movie.title || movie.name || 'Movie';

      playSoundEffect(SOUND_EFFECT_KEYS.TAP);
      showToast(
        nextLikedState
          ? `${movieTitle} added to liked movies.`
          : `${movieTitle} removed from liked movies.`,
        { type: nextLikedState ? 'success' : 'info' },
      );
    } catch (error) {
      console.error('Unable to update movie like:', error);
      playSoundEffect(SOUND_EFFECT_KEYS.ERROR);
      showToast('Unable to update this like right now.', { type: 'error' });
    }
  };

  const renderMovie = ({ item }) => {
    const title = item.title || item.name;
    const rating = item.vote_average.toFixed(1);
    const backdrop = getImageUrl(item.backdrop_path);
    const liked = isMovieLiked(item.id);
    const releaseYear = item.release_date?.slice(0, 4) || 'TBA';

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
        <TouchableOpacity
          style={[styles.likeButton, liked && styles.likeButtonActive]}
          onPress={(event) => handleToggleMovieLike(event, item)}
          activeOpacity={0.85}
        >
          <Ionicons name={liked ? 'heart' : 'heart-outline'} size={18} color="#FFFFFF" />
        </TouchableOpacity>
        <View style={styles.movieGradient} />
        <View style={styles.movieOverlay}>
          <Text style={styles.movieTitle} numberOfLines={2}>{title}</Text>
          <View style={styles.movieMetaRow}>
            <Text style={styles.movieMetaPill}>IMDb {rating}</Text>
            <Text style={styles.movieMetaSecondary}>{releaseYear}</Text>
          </View>
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
    const liked = isMovieLiked(item.id);
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
        <View style={styles.featuredImageShade} />
        <TouchableOpacity
          style={[styles.featuredLikeButton, liked && styles.likeButtonActive]}
          onPress={(event) => handleToggleMovieLike(event, item)}
          activeOpacity={0.85}
        >
          <Ionicons name={liked ? 'heart' : 'heart-outline'} size={18} color="#FFFFFF" />
        </TouchableOpacity>
        <View style={styles.featuredOverlay}>
          <View style={styles.featuredEyebrowRow}>
            <Text style={styles.featuredEyebrow}>Featured</Text>
            <Text style={styles.featuredMiniMeta}>{item.release_date?.slice(0, 4) || 'New'}</Text>
          </View>
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
      <View pointerEvents="none" style={styles.backgroundOrbPrimary} />
      <View pointerEvents="none" style={styles.backgroundOrbSecondary} />
      <Animated.View style={headerAnimation}>
        <View style={styles.header}>
          <View style={styles.headerRow}>
            <View>
              <Text style={styles.userGreeting}>Hi, {userLabel}</Text>
              <Text style={styles.headerText}>Discover amazing movies</Text>
            </View>
            <View style={styles.avatarShell}>
              <Ionicons name="person-circle" size={34} color="#FFFFFF" />
            </View>
          </View>
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
              decelerationRate="fast"
              disableIntervalMomentum
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.heroListContent}
              ItemSeparatorComponent={() => <View style={{ width: HERO_CARD_GAP }} />}
              snapToInterval={heroSnapInterval}
              snapToAlignment="start"
              onMomentumScrollEnd={(event) => {
                const nextIndex = Math.round(event.nativeEvent.contentOffset.x / heroSnapInterval);
                heroIndexRef.current = nextIndex;
                setCurrentHeroIndex(nextIndex);
              }}
              getItemLayout={(_, index) => ({
                length: heroSnapInterval,
                offset: heroSnapInterval * index,
                index,
              })}
              onScrollToIndexFailed={({ index }) => {
                heroListRef.current?.scrollToOffset({
                  offset: heroSnapInterval * index,
                  animated: true,
                });
              }}
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
              <View style={styles.quickActionIconWrap}>
                <Ionicons name="ticket-outline" size={18} color="#FFFFFF" />
              </View>
              <Text style={styles.quickActionText}>My Tickets</Text>
            </TouchableOpacity>
          <TouchableOpacity
            style={styles.quickActionButton}
            onPress={() => {
              playSoundEffect(SOUND_EFFECT_KEYS.TAP);
              navigation.getParent()?.navigate('Movies', { section: 'now_playing' });
            }}
            >
              <View style={styles.quickActionIconWrap}>
                <Ionicons name="grid-outline" size={18} color="#FFFFFF" />
              </View>
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
              <View style={styles.quickActionIconWrap}>
                <Ionicons name="shield-outline" size={18} color="#FFFFFF" />
              </View>
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
              <View style={styles.quickActionIconWrap}>
                <Ionicons name="play-circle-outline" size={18} color="#FFFFFF" />
              </View>
              <Text style={styles.quickActionText}>Watch Now</Text>
            </TouchableOpacity>
          <TouchableOpacity
            style={styles.quickActionButton}
            onPress={() => {
              playSoundEffect(SOUND_EFFECT_KEYS.TAP);
              navigation.navigate('Community');
            }}
            >
              <View style={styles.quickActionIconWrap}>
                <Ionicons name="people-outline" size={18} color="#FFFFFF" />
              </View>
              <Text style={styles.quickActionText}>Community</Text>
            </TouchableOpacity>
        </View>
      </Animated.View>

      <Animated.View style={toolsAnimation}>
        <View style={styles.searchContainer}>
          <View style={styles.searchIconWrap}>
            <Ionicons name="search" size={18} color="#FFFFFF" />
          </View>
          <TextInput
            style={styles.searchInput}
            placeholder="Search movies"
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
            <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
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
    backgroundColor: '#06090E',
  },
  scrollContent: {
    paddingTop: 54,
    paddingBottom: 40,
  },
  backgroundOrbPrimary: {
    position: 'absolute',
    width: 260,
    height: 260,
    borderRadius: 130,
    backgroundColor: 'rgba(239, 68, 68, 0.13)',
    top: -20,
    right: -90,
  },
  backgroundOrbSecondary: {
    position: 'absolute',
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: 'rgba(56, 189, 248, 0.1)',
    top: 320,
    left: -80,
  },
  header: {
    padding: 20,
    marginBottom: 16,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  avatarShell: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.08)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  userGreeting: {
    fontSize: 14,
    color: '#BFC9D9',
    fontWeight: '600',
    marginBottom: 6,
  },
  headerText: {
    fontSize: 32,
    fontWeight: '800',
    color: '#FFFFFF',
    lineHeight: 38,
  },
  headerSubtext: {
    color: '#A6B0BF',
    fontSize: 14,
    lineHeight: 21,
    marginTop: 12,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(18,22,28,0.92)',
    borderRadius: 22,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginRight: 20,
    marginHorizontal: 20,
    marginBottom: 20,
    minHeight: 58,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  searchIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  quickActions: {
    paddingHorizontal: 20,
    marginBottom: 12,
    flexDirection: 'row',
    gap: 12,
  },
  heroSection: {
    marginBottom: 18,
  },
  heroListContent: {
    paddingHorizontal: HERO_HORIZONTAL_INSET,
  },
  featuredCard: {
    height: 256,
    borderRadius: 30,
    overflow: 'hidden',
    backgroundColor: '#141414',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  featuredImageShade: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(6, 9, 14, 0.18)',
  },
  featuredLikeButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(5, 5, 5, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2,
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
    backgroundColor: 'rgba(7, 10, 14, 0.82)',
  },
  featuredEyebrowRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  featuredEyebrow: {
    color: '#F7D27D',
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    marginBottom: 6,
    letterSpacing: 0.8,
  },
  featuredMiniMeta: {
    color: '#D0D6E2',
    fontSize: 12,
    fontWeight: '600',
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
    backgroundColor: 'rgba(18,22,28,0.92)',
    borderRadius: 22,
    paddingVertical: 15,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    flex: 1,
  },
  quickActionIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.08)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  quickActionText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  searchIconContainer: {
    marginLeft: 10,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E04A57',
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchInput: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 15,
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
    fontSize: 13,
    color: '#F7D27D',
    fontWeight: '600',
  },
  listContent: {
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  movieItem: {
    width: 166,
    marginHorizontal: 6,
    borderRadius: 22,
    overflow: 'hidden',
    backgroundColor: 'rgba(18, 20, 25, 0.98)',
    position: 'relative',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  likeButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(5, 5, 5, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2,
  },
  likeButtonActive: {
    backgroundColor: '#E50914',
  },
  backdropImage: {
    width: '100%',
    height: 210,
  },
  movieGradient: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(6, 9, 14, 0.18)',
  },
  movieOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 12,
    backgroundColor: 'rgba(8, 10, 14, 0.84)',
  },
  movieTitle: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 18,
  },
  movieMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  movieMetaPill: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 999,
  },
  movieMetaSecondary: {
    color: '#B3BECD',
    fontSize: 11,
    fontWeight: '600',
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
