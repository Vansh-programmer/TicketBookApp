import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  FlatList,
  Image,
  Platform,
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

const STREAM_HORIZONTAL_INSET = 14;

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
          (activeFilter === 'Classics' && ['Classic', 'Vintage', 'Cult'].includes(item.mood)) ||
          item.genre === activeFilter ||
          item.language === activeFilter ||
          item.format === activeFilter;
        const matchesQuery =
          !normalizedQuery ||
          item.title.toLowerCase().includes(normalizedQuery) ||
          item.description.toLowerCase().includes(normalizedQuery) ||
          item.mood.toLowerCase().includes(normalizedQuery) ||
          item.genre.toLowerCase().includes(normalizedQuery) ||
          item.language.toLowerCase().includes(normalizedQuery) ||
          item.badge.toLowerCase().includes(normalizedQuery);

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
      </View>

      <TouchableOpacity style={styles.featuredCard} activeOpacity={0.9} onPress={() => openPlayer(featuredItem)}>
        <Image
          source={{ uri: featuredItem.thumbnail || getStreamThumbnail(featuredItem.videoId) }}
          style={styles.featuredImage}
        />
        <View style={styles.featuredOverlay}>
          <Text style={styles.featuredBadge}>{featuredItem.badge}</Text>
          <Text style={styles.featuredTitle}>{featuredItem.title}</Text>
          <View style={styles.featuredMetaRow}>
            <View style={styles.featuredMetaChip}>
              <Ionicons name="calendar-outline" size={12} color="#FFFFFF" />
              <Text style={styles.featuredMetaChipText}>{featuredItem.year}</Text>
            </View>
            <View style={styles.featuredMetaChip}>
              <Ionicons name="time-outline" size={12} color="#FFFFFF" />
              <Text style={styles.featuredMetaChipText}>{featuredItem.duration}</Text>
            </View>
            <View style={styles.featuredMetaChip}>
              <Ionicons name="albums-outline" size={12} color="#FFFFFF" />
              <Text style={styles.featuredMetaChipText}>{featuredItem.genre}</Text>
            </View>
          </View>
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
          placeholder="Search titles"
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
        </View>
      ) : null}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#06090E',
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
  featuredCard: {
    marginHorizontal: STREAM_HORIZONTAL_INSET,
    height: 270,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: 'rgba(17, 19, 24, 0.96)',
    marginBottom: 18,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    ...(Platform.OS === 'web'
      ? {
          boxShadow: '0px 18px 24px rgba(0, 0, 0, 0.24)',
        }
      : {
          shadowColor: '#000000',
          shadowOffset: {
            width: 0,
            height: 18,
          },
          shadowOpacity: 0.24,
          shadowRadius: 24,
        }),
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
    backgroundColor: 'rgba(6,8,14,0.84)',
  },
  featuredBadge: {
    color: '#FFD66B',
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0,
  },
  featuredTitle: {
    color: '#FFFFFF',
    fontSize: 26,
    fontWeight: '800',
    marginTop: 6,
  },
  featuredMetaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 10,
  },
  featuredMetaChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  featuredMetaChipText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
    marginLeft: 6,
  },
  playCta: {
    marginTop: 14,
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 9,
  },
  playCtaText: {
    color: '#050505',
    fontWeight: '800',
    marginLeft: 6,
  },
  searchContainer: {
    marginHorizontal: STREAM_HORIZONTAL_INSET,
    marginBottom: 14,
    borderRadius: 8,
    backgroundColor: 'rgba(18,22,28,0.92)',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  searchInput: {
    flex: 1,
    color: '#FFFFFF',
    paddingVertical: 14,
    paddingLeft: 10,
  },
  genreRow: {
    paddingHorizontal: STREAM_HORIZONTAL_INSET,
    paddingBottom: 8,
    gap: 10,
  },
  genreChip: {
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  genreChipActive: {
    backgroundColor: '#FFFFFF',
    borderColor: '#FFFFFF',
  },
  genreChipText: {
    color: '#D0D0D5',
    fontWeight: '700',
  },
  genreChipTextActive: {
    color: '#091018',
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
  horizontalList: {
    paddingHorizontal: STREAM_HORIZONTAL_INSET,
    gap: 12,
  },
  streamCard: {
    width: 268,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: 'rgba(15, 18, 24, 0.96)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  streamCardImage: {
    width: '100%',
    height: 148,
  },
  streamCardBody: {
    padding: 14,
  },
  streamCardBadge: {
    color: '#FFB547',
    fontWeight: '700',
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 0,
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
    marginHorizontal: STREAM_HORIZONTAL_INSET,
    marginTop: 24,
    backgroundColor: 'rgba(15, 18, 24, 0.96)',
    borderRadius: 8,
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
});

export default StreamScreen;
