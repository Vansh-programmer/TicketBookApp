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
import AnimatedPressable from '../components/AnimatedPressable';
import GlassSurface from '../components/GlassSurface';
import Loader from '../components/Loader';
import { useToast } from '../components/ToastProvider';
import useFadeInUp from '../hooks/useFadeInUp';
import { useMovieLikes } from '../hooks/useMovieLikes';
import { useSession } from '../context/SessionProvider';
import { playSoundEffect, SOUND_EFFECT_KEYS } from '../services/soundEffects';
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
  const [searchFocused, setSearchFocused] = useState(false);
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

  const featuredMovies = useMemo(
    () => nowPlaying.filter((movie) => movie?.backdrop_path || movie?.poster_path).slice(0, 8),
    [nowPlaying],
  );
  const normalizedSearchQuery = searchQuery.trim().toLowerCase();

  const matchesSearch = (movie) => {
    if (!normalizedSearchQuery) {
      return true;
    }

    const title = movie.title || movie.name || '';
    return title.toLowerCase().includes(normalizedSearchQuery);
  };

  const filteredNowPlaying = useMemo(() => nowPlaying.filter(matchesSearch), [nowPlaying, normalizedSearchQuery]);
  const filteredUpcoming = useMemo(() => upcoming.filter(matchesSearch), [upcoming, normalizedSearchQuery]);
  const filteredIndianSpotlight = useMemo(() => indianSpotlight.filter(matchesSearch), [indianSpotlight, normalizedSearchQuery]);
  const filteredPopularMovies = useMemo(() => popularMovies.filter(matchesSearch), [popularMovies, normalizedSearchQuery]);

  const searchResults = useMemo(() => {
    const merged = [
      ...filteredNowPlaying,
      ...filteredPopularMovies,
      ...filteredUpcoming,
      ...filteredIndianSpotlight,
    ];
    const unique = new Map();

    merged.forEach((movie) => {
      if (movie?.id && !unique.has(movie.id)) {
        unique.set(movie.id, movie);
      }
    });

    return Array.from(unique.values()).slice(0, 6);
  }, [filteredIndianSpotlight, filteredNowPlaying, filteredPopularMovies, filteredUpcoming]);

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
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Failed to load movies. Please try again later.');
      } finally {
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
    if (featuredMovies.length <= 1 || searchFocused || normalizedSearchQuery.length > 0) {
      heroIndexRef.current = 0;
      setCurrentHeroIndex(0);
      heroListRef.current?.scrollToOffset({ offset: 0, animated: false });
      return undefined;
    }

    const interval = setInterval(() => {
      const nextIndex = (heroIndexRef.current + 1) % featuredMovies.length;
      heroIndexRef.current = nextIndex;
      setCurrentHeroIndex(nextIndex);
      heroListRef.current?.scrollToOffset({
        offset: nextIndex * heroSnapInterval,
        animated: true,
      });
    }, 3600);

    return () => clearInterval(interval);
  }, [featuredMovies, heroSnapInterval, normalizedSearchQuery.length, searchFocused]);

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
    } catch (toggleError) {
      console.error('Unable to update movie like:', toggleError);
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
      <AnimatedPressable
        key={item.id}
        style={styles.movieItem}
        pressedScale={0.97}
        onPress={() => {
          playSoundEffect(SOUND_EFFECT_KEYS.TAP);
          navigation.navigate('MovieDetails', { movieId: item.id });
        }}
      >
        {backdrop ? (
          <Image source={{ uri: backdrop }} style={styles.backdropImage} resizeMode="cover" resizeMethod="resize" />
        ) : (
          <View style={styles.backdropFallback}>
            <Ionicons name="film-outline" size={22} color="#C7CEDA" />
          </View>
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
      </AnimatedPressable>
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
            initialNumToRender={4}
            maxToRenderPerBatch={4}
            windowSize={5}
            removeClippedSubviews
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
    const meta = [item.release_date?.slice(0, 4), `${item.vote_average?.toFixed(1) || 'NR'} IMDb`]
      .filter(Boolean)
      .join('  |  ');

    return (
      <AnimatedPressable
        style={[styles.featuredCard, { width: heroWidth }]}
        contentStyle={styles.featuredCardContent}
        pressedScale={0.975}
        onPress={() => {
          playSoundEffect(SOUND_EFFECT_KEYS.TAP);
          navigation.navigate('MovieDetails', { movieId: item.id });
        }}
      >
        {artwork ? (
          <Image source={{ uri: artwork }} style={styles.featuredImage} resizeMode="cover" resizeMethod="resize" />
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
          <Text style={styles.featuredTitle} numberOfLines={2}>{title}</Text>
          <Text style={styles.featuredMeta}>{meta}</Text>
        </View>
      </AnimatedPressable>
    );
  };

  useEffect(() => {
    heroIndexRef.current = 0;
    setCurrentHeroIndex(0);
    heroListRef.current?.scrollToOffset({ offset: 0, animated: false });
  }, [featuredMovies.length]);

  const renderSearchResult = ({ item }) => {
    const title = item.title || item.name;
    const year = item.release_date?.slice(0, 4) || 'TBA';
    const poster = getImageUrl(item.poster_path || item.backdrop_path);

    return (
      <View style={styles.searchResultRowWrap}>
        <AnimatedPressable
          pressedScale={0.985}
          onPress={() => {
            playSoundEffect(SOUND_EFFECT_KEYS.TAP);
            setSearchQuery('');
            setSearchFocused(false);
            navigation.navigate('MovieDetails', { movieId: item.id });
          }}
          style={styles.searchResultPressable}
        >
          <View style={styles.searchResultRow}>
            {poster ? (
              <Image source={{ uri: poster }} style={styles.searchResultPoster} resizeMode="cover" resizeMethod="resize" />
            ) : (
              <View style={styles.searchResultPosterFallback}>
                <Ionicons name="film-outline" size={18} color="#D5DCE8" />
              </View>
            )}
            <View style={styles.searchResultCopy}>
              <Text style={styles.searchResultTitle} numberOfLines={1}>{title}</Text>
              <Text style={styles.searchResultMeta} numberOfLines={1}>{year} | Details</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color="#7F8CA3" />
          </View>
        </AnimatedPressable>
      </View>
    );
  };

  const userLabel = auth?.currentUser?.email?.split('@')[0] || auth?.currentUser?.displayName || 'Guest';

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
          <View style={styles.headerRow}>
            <View>
              <Text style={styles.userGreeting}>Hi, {userLabel}</Text>
              <Text style={styles.headerText}>Now showing</Text>
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
              initialNumToRender={3}
              maxToRenderPerBatch={3}
              windowSize={3}
              onMomentumScrollEnd={(event) => {
                const nextIndex = Math.round(event.nativeEvent.contentOffset.x / heroSnapInterval);
                heroIndexRef.current = nextIndex;
                setCurrentHeroIndex(nextIndex);
              }}
              onScrollToIndexFailed={() => {
                heroListRef.current?.scrollToOffset({
                  offset: 0,
                  animated: true,
                });
              }}
            />
            <View style={styles.heroDots}>
              {featuredMovies.map((movie, index) => (
                <View key={movie.id} style={[styles.heroDot, index === currentHeroIndex && styles.heroDotActive]} />
              ))}
            </View>
          </View>
        </Animated.View>
      ) : null}

      {isAdmin ? (
        <Animated.View style={toolsAnimation}>
          <View style={styles.adminSection}>
            <TouchableOpacity
              onPress={() => {
                playSoundEffect(SOUND_EFFECT_KEYS.TAP);
                navigation.navigate('Admin');
              }}
            >
              <GlassSurface intensity={24} style={styles.adminBanner}>
                <View style={styles.adminBannerIconWrap}>
                  <Ionicons name="shield-outline" size={18} color="#FFFFFF" />
                </View>
                <View style={styles.adminBannerCopy}>
                  <Text style={styles.adminBannerTitle}>Admin Panel</Text>
                  <Text style={styles.adminBannerSubtitle}>Manage catalog, reports, and moderation.</Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color="#D5DCE8" />
              </GlassSurface>
            </TouchableOpacity>
          </View>
        </Animated.View>
      ) : null}

      <Animated.View style={toolsAnimation}>
        <View style={styles.searchSection}>
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
              onFocus={() => setSearchFocused(true)}
              onBlur={() => {
                if (!normalizedSearchQuery) {
                  setSearchFocused(false);
                }
              }}
              autoCorrect={false}
              autoCapitalize="none"
              returnKeyType="search"
              blurOnSubmit={false}
            />
            <TouchableOpacity
              style={styles.searchIconContainer}
              onPress={() => {
                playSoundEffect(SOUND_EFFECT_KEYS.TAP);
                navigation.getParent()?.navigate('Movies', { section: 'now_playing' });
              }}
            >
              <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
            </TouchableOpacity>
          </View>

          {searchFocused && normalizedSearchQuery ? (
            <View style={styles.searchDropdown}>
              <View style={styles.searchDropdownHeader}>
                <Text style={styles.searchDropdownTitle}>Search results</Text>
                <Text style={styles.searchDropdownCount}>{searchResults.length} titles</Text>
              </View>
              {searchResults.length > 0 ? (
                <FlatList
                  data={searchResults}
                  renderItem={renderSearchResult}
                  keyExtractor={(item) => item.id.toString()}
                  scrollEnabled={false}
                  keyboardShouldPersistTaps="handled"
                  ItemSeparatorComponent={() => <View style={styles.searchResultSeparator} />}
                />
              ) : (
                <View style={styles.searchDropdownEmpty}>
                  <Text style={styles.searchDropdownEmptyText}>No matches yet. Try a different title.</Text>
                </View>
              )}
            </View>
          ) : null}
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
      ListHeaderComponent={renderHeader()}
      ListFooterComponent={<View style={styles.footerSpacer} />}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
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
    paddingTop: 48,
    paddingBottom: 40,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 18,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  avatarShell: {
    width: 48,
    height: 48,
    borderRadius: 8,
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
    fontSize: 34,
    fontWeight: '800',
    color: '#FFFFFF',
    lineHeight: 40,
  },
  heroSection: {
    marginBottom: 18,
  },
  heroListContent: {
    paddingHorizontal: HERO_HORIZONTAL_INSET,
  },
  featuredCard: {
    height: 250,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#141414',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  featuredCardContent: {
    height: '100%',
  },
  featuredImage: {
    width: '100%',
    height: '100%',
  },
  featuredImageShade: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(6, 9, 14, 0.18)',
  },
  featuredFallback: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#141414',
  },
  featuredLikeButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: 'rgba(5, 5, 5, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2,
  },
  featuredOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 16,
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
    letterSpacing: 0,
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
  searchSection: {
    position: 'relative',
    marginBottom: 20,
    paddingHorizontal: 20,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(18,22,28,0.92)',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    minHeight: 58,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  searchIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 15,
  },
  searchIconContainer: {
    marginLeft: 10,
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: '#E04A57',
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchDropdown: {
    marginTop: 12,
    borderRadius: 8,
    backgroundColor: 'rgba(11, 14, 20, 0.98)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    overflow: 'hidden',
  },
  searchDropdownHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 10,
  },
  searchDropdownTitle: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
  searchDropdownCount: {
    color: '#7F8CA3',
    fontSize: 12,
    fontWeight: '600',
  },
  searchDropdownEmpty: {
    paddingHorizontal: 16,
    paddingVertical: 18,
  },
  searchDropdownEmptyText: {
    color: '#9AA6B8',
    fontSize: 13,
    lineHeight: 18,
  },
  searchResultRowWrap: {
    paddingHorizontal: 10,
  },
  searchResultPressable: {
    width: '100%',
  },
  searchResultRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 6,
  },
  searchResultPoster: {
    width: 42,
    height: 58,
    borderRadius: 8,
    backgroundColor: '#151A22',
  },
  searchResultPosterFallback: {
    width: 42,
    height: 58,
    borderRadius: 8,
    backgroundColor: '#151A22',
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchResultCopy: {
    flex: 1,
    paddingHorizontal: 12,
  },
  searchResultTitle: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 19,
  },
  searchResultMeta: {
    color: '#9AA6B8',
    fontSize: 12,
    fontWeight: '500',
    marginTop: 4,
  },
  searchResultSeparator: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.06)',
    marginLeft: 70,
  },
  sectionContainer: {
    marginBottom: 30,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
    paddingHorizontal: 20,
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
  emptySection: {
    backgroundColor: '#111113',
    borderRadius: 8,
    paddingVertical: 18,
    paddingHorizontal: 16,
    marginHorizontal: 20,
  },
  emptySectionText: {
    color: '#8F8F97',
    textAlign: 'center',
  },
  movieItem: {
    width: 166,
    marginHorizontal: 6,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: 'rgba(18, 20, 25, 0.98)',
    position: 'relative',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  backdropImage: {
    width: '100%',
    height: 210,
  },
  backdropFallback: {
    width: '100%',
    height: 210,
    backgroundColor: '#151A22',
    alignItems: 'center',
    justifyContent: 'center',
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
    borderRadius: 8,
  },
  movieMetaSecondary: {
    color: '#B3BECD',
    fontSize: 11,
    fontWeight: '600',
  },
  likeButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 34,
    height: 34,
    borderRadius: 8,
    backgroundColor: 'rgba(5, 5, 5, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2,
  },
  likeButtonActive: {
    backgroundColor: '#E50914',
  },
  adminSection: {
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  adminBanner: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 8,
    borderColor: 'rgba(255,255,255,0.08)',
    backgroundColor: 'rgba(18, 22, 28, 0.92)',
  },
  adminBannerIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  adminBannerCopy: {
    flex: 1,
  },
  adminBannerTitle: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
    marginBottom: 3,
  },
  adminBannerSubtitle: {
    color: '#AAB4C4',
    fontSize: 12,
    lineHeight: 17,
    fontWeight: '500',
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
    borderRadius: 8,
    marginTop: 20,
    alignSelf: 'center',
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
