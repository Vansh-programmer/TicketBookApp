import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  FlatList,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import {
  STREAM_CATALOG,
  STREAM_FILTERS,
  getFeaturedStream,
  getStreamSections,
  getStreamThumbnail,
  loadWatchHistory,
} from '../services/streamCatalog';
import {
  mergeStreamCatalog,
  subscribeToAdminStreamEntries,
} from '../services/adminCatalog';

const StreamScreen = ({ navigation }) => {
  const [catalog, setCatalog] = useState(STREAM_CATALOG);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('All');
  const [watchHistory, setWatchHistory] = useState([]);

  useEffect(() => {
    const unsubscribe = subscribeToAdminStreamEntries(
      (entries) => {
        setCatalog(mergeStreamCatalog(STREAM_CATALOG, entries));
      },
      (error) => {
        console.error('Unable to sync admin stream entries:', error);
        setCatalog(STREAM_CATALOG);
      },
    );

    return unsubscribe;
  }, []);

  useFocusEffect(
    useCallback(() => {
      let isMounted = true;

      const syncWatchHistory = async () => {
        const history = await loadWatchHistory();
        if (isMounted) {
          setWatchHistory(history);
        }
      };

      syncWatchHistory();

      return () => {
        isMounted = false;
      };
    }, []),
  );

  const normalizedQuery = searchQuery.trim().toLowerCase();
  const filteredCatalog = useMemo(
    () =>
      catalog.filter((item) => {
        const matchesFilter =
          activeFilter === 'All' ||
          (activeFilter === 'Indian' && item.region === 'India') ||
          item.genre === activeFilter ||
          item.language === activeFilter;
        const matchesQuery =
          !normalizedQuery ||
          item.title.toLowerCase().includes(normalizedQuery) ||
          item.description.toLowerCase().includes(normalizedQuery) ||
          item.mood.toLowerCase().includes(normalizedQuery) ||
          item.genre.toLowerCase().includes(normalizedQuery) ||
          item.language.toLowerCase().includes(normalizedQuery);

        return matchesFilter && matchesQuery;
      }),
    [activeFilter, catalog, normalizedQuery],
  );

  const featuredItem = filteredCatalog[0] || getFeaturedStream(catalog);
  const sections = useMemo(() => getStreamSections(filteredCatalog), [filteredCatalog]);

  const openPlayer = (item) => {
    navigation.getParent()?.navigate('Player', {
      videoId: item.videoId,
      title: item.title,
      description: item.description,
      subtitle: `${item.year} • ${item.duration} • ${item.genre}`,
      badge: item.badge,
    });
  };

  const renderStreamCard = ({ item }) => (
    <TouchableOpacity style={styles.streamCard} onPress={() => openPlayer(item)} activeOpacity={0.88}>
      <Image
        source={{ uri: item.thumbnail || getStreamThumbnail(item.videoId) }}
        style={styles.streamCardImage}
      />
      <View style={styles.streamCardBody}>
        <Text style={styles.streamCardBadge}>{item.badge}</Text>
        <Text style={styles.streamCardTitle} numberOfLines={2}>
          {item.title}
        </Text>
        <Text style={styles.streamCardMeta}>
          {item.year} • {item.duration} • {item.genre}
        </Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.heading}>Stream</Text>
        <Text style={styles.subheading}>
          Watch YouTube-powered picks without leaving the app, now with Indian titles and genre browsing.
        </Text>
      </View>

      <TouchableOpacity style={styles.featuredCard} activeOpacity={0.9} onPress={() => openPlayer(featuredItem)}>
        <Image
          source={{ uri: featuredItem.thumbnail || getStreamThumbnail(featuredItem.videoId) }}
          style={styles.featuredImage}
        />
        <View style={styles.featuredOverlay}>
          <Text style={styles.featuredBadge}>{featuredItem.badge}</Text>
          <Text style={styles.featuredTitle}>{featuredItem.title}</Text>
          <Text style={styles.featuredMeta}>
            {featuredItem.year} • {featuredItem.duration} • {featuredItem.genre}
          </Text>
          <Text style={styles.featuredDescription} numberOfLines={2}>
            {featuredItem.description}
          </Text>
          <View style={styles.playCta}>
            <Ionicons name="play" size={16} color="#050505" />
            <Text style={styles.playCtaText}>Play now</Text>
          </View>
        </View>
      </TouchableOpacity>

      <View style={styles.searchContainer}>
        <Ionicons name="search" size={18} color="#A0A0A0" />
        <TextInput
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Search by title, vibe, or genre"
          placeholderTextColor="#6F6F74"
          style={styles.searchInput}
        />
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.genreRow}>
        {STREAM_FILTERS.map((filterLabel) => {
          const isActive = activeFilter === filterLabel;
          return (
            <TouchableOpacity
              key={filterLabel}
              style={[styles.genreChip, isActive && styles.genreChipActive]}
              onPress={() => setActiveFilter(filterLabel)}
            >
              <Text style={[styles.genreChipText, isActive && styles.genreChipTextActive]}>
                {filterLabel}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {watchHistory.length > 0 ? (
        <View style={styles.sectionBlock}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Continue Watching</Text>
            <Text style={styles.sectionCaption}>Recently played in-app</Text>
          </View>
          <FlatList
            data={watchHistory}
            renderItem={renderStreamCard}
            keyExtractor={(item) => item.videoId}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.horizontalList}
          />
        </View>
      ) : null}

      {sections.map((section) => (
        section.items.length > 0 ? (
          <View style={styles.sectionBlock} key={section.key}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>{section.title}</Text>
              <Text style={styles.sectionCaption}>{section.items.length} titles</Text>
            </View>
            <FlatList
              data={section.items}
              renderItem={renderStreamCard}
              keyExtractor={(item) => `${section.key}-${item.id}`}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.horizontalList}
            />
          </View>
        ) : null
      ))}

      {!filteredCatalog.length ? (
        <View style={styles.emptyState}>
          <Ionicons name="search-outline" size={42} color="#7A7A7A" />
          <Text style={styles.emptyTitle}>Nothing matched that search</Text>
          <Text style={styles.emptyText}>Try a broader search or switch the genre chip.</Text>
        </View>
      ) : null}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#050505',
  },
  content: {
    paddingTop: 58,
    paddingBottom: 36,
  },
  header: {
    paddingHorizontal: 18,
    marginBottom: 18,
  },
  heading: {
    color: '#FFFFFF',
    fontSize: 30,
    fontWeight: '800',
  },
  subheading: {
    color: '#A4A4A8',
    fontSize: 14,
    lineHeight: 21,
    marginTop: 8,
  },
  featuredCard: {
    marginHorizontal: 18,
    height: 250,
    borderRadius: 26,
    overflow: 'hidden',
    backgroundColor: '#111113',
    marginBottom: 18,
  },
  featuredImage: {
    width: '100%',
    height: '100%',
  },
  featuredOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    padding: 18,
    backgroundColor: 'rgba(0,0,0,0.62)',
  },
  featuredBadge: {
    color: '#FFD66B',
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  featuredTitle: {
    color: '#FFFFFF',
    fontSize: 26,
    fontWeight: '800',
    marginTop: 6,
  },
  featuredMeta: {
    color: '#D6D6D9',
    marginTop: 8,
    fontSize: 13,
  },
  featuredDescription: {
    color: '#EFEFF1',
    marginTop: 8,
    lineHeight: 20,
  },
  playCta: {
    marginTop: 14,
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 9,
  },
  playCtaText: {
    color: '#050505',
    fontWeight: '800',
    marginLeft: 6,
  },
  searchContainer: {
    marginHorizontal: 18,
    marginBottom: 14,
    borderRadius: 16,
    backgroundColor: '#151518',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  searchInput: {
    flex: 1,
    color: '#FFFFFF',
    paddingVertical: 14,
    paddingLeft: 10,
  },
  genreRow: {
    paddingHorizontal: 18,
    paddingBottom: 8,
    gap: 10,
  },
  genreChip: {
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: '#141417',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  genreChipActive: {
    backgroundColor: '#E50914',
    borderColor: '#E50914',
  },
  genreChipText: {
    color: '#D0D0D5',
    fontWeight: '700',
  },
  genreChipTextActive: {
    color: '#FFFFFF',
  },
  sectionBlock: {
    marginTop: 18,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    paddingHorizontal: 18,
    marginBottom: 12,
  },
  sectionTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '800',
  },
  sectionCaption: {
    color: '#8B8B93',
    fontSize: 12,
  },
  horizontalList: {
    paddingHorizontal: 18,
    gap: 12,
  },
  streamCard: {
    width: 220,
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: '#111113',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  streamCardImage: {
    width: '100%',
    height: 124,
  },
  streamCardBody: {
    padding: 14,
  },
  streamCardBadge: {
    color: '#FFB547',
    fontWeight: '700',
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 0.7,
  },
  streamCardTitle: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '800',
    marginTop: 8,
  },
  streamCardMeta: {
    color: '#A4A4AA',
    marginTop: 8,
    fontSize: 12,
  },
  emptyState: {
    marginHorizontal: 18,
    marginTop: 24,
    backgroundColor: '#111113',
    borderRadius: 22,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  emptyTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
    marginTop: 12,
  },
  emptyText: {
    color: '#9A9AA0',
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 20,
  },
});

export default StreamScreen;
