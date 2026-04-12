import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { useToast } from '../components/ToastProvider';
import {
  formatRelativeTime,
  subscribeToCommunityPosts,
} from '../services/community';
import {
  fetchGeminiMovieRecommendations,
  isGeminiConfigured,
} from '../services/geminiRecommendations';

const QUICK_PROMPTS = [
  'Thoughtful sci-fi',
  'Family night',
  'Modern horror',
  'Sharp satire',
];

const QUICK_PROMPT_ACCENTS = [
  { backgroundColor: 'rgba(96, 165, 250, 0.18)', borderColor: 'rgba(96, 165, 250, 0.38)' },
  { backgroundColor: 'rgba(74, 222, 128, 0.16)', borderColor: 'rgba(74, 222, 128, 0.34)' },
  { backgroundColor: 'rgba(248, 113, 113, 0.16)', borderColor: 'rgba(248, 113, 113, 0.35)' },
  { backgroundColor: 'rgba(251, 191, 36, 0.16)', borderColor: 'rgba(251, 191, 36, 0.34)' },
];

const AIRecommendationsScreen = () => {
  const navigation = useNavigation();
  const { showToast } = useToast();
  const [prompt, setPrompt] = useState('');
  const [recommendations, setRecommendations] = useState([]);
  const [communityRecommendations, setCommunityRecommendations] = useState([]);
  const [communityLoaded, setCommunityLoaded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const getCompactReason = (reason = '') => {
    const normalized = reason.replace(/\s+/g, ' ').trim();
    if (!normalized) {
      return 'AI pick';
    }

    return normalized.length > 24 ? `${normalized.slice(0, 24)}...` : normalized;
  };

  useEffect(() => {
    const unsubscribe = subscribeToCommunityPosts(
      (posts) => {
        const recommendationPattern = /(movie|series|show|watch|recommend|suggest|must watch)/i;

        const mappedPosts = posts
          .filter((post) => {
            const searchableText = `${post.topic || ''} ${post.text || ''}`;
            return recommendationPattern.test(searchableText);
          })
          .map((post) => ({
            id: post.id,
            title: (post.topic || 'Community recommendation').trim(),
            text: (post.text || '').trim(),
            likes: post.likes || 0,
            commentsCount: Array.isArray(post.comments) ? post.comments.length : 0,
            createdAtMs: post.createdAtMs || Date.now(),
          }))
          .slice(0, 6);

        setCommunityRecommendations(mappedPosts);
        setCommunityLoaded(true);
      },
      () => {
        setCommunityRecommendations([]);
        setCommunityLoaded(true);
      },
    );

    return unsubscribe;
  }, []);

  const shouldShowCommunityEmpty = useMemo(
    () => communityLoaded && communityRecommendations.length === 0,
    [communityLoaded, communityRecommendations.length],
  );

  const openCommunity = () => {
    const routeNames = navigation.getState?.()?.routeNames || [];

    if (routeNames.includes('Community')) {
      navigation.navigate('Community');
      return;
    }

    navigation.getParent()?.navigate('Home', { screen: 'Community' });
  };

  const requestRecommendations = async (nextPrompt = prompt) => {
    const trimmedPrompt = nextPrompt.trim();

    if (!trimmedPrompt || loading) {
      return;
    }

    setLoading(true);
    setError('');

    try {
      const nextRecommendations = await fetchGeminiMovieRecommendations(trimmedPrompt);
      setRecommendations(nextRecommendations);
    } catch (requestError) {
      console.error('Unable to fetch Gemini recommendations:', requestError);
      setError(
        requestError?.message?.includes('EXPO_PUBLIC_GEMINI_API_KEY')
          ? 'Picks are offline in this build.'
          : 'Picks are unavailable right now.',
      );
    } finally {
      setLoading(false);
    }
  };

  const openImdb = async (url) => {
    try {
      await Linking.openURL(url);
    } catch (error) {
      console.error('Unable to open IMDb link:', error);
      showToast('Unable to open IMDb right now.', { type: 'error' });
    }
  };

  const renderEmptyRecommendations = () => (
    <View style={styles.emptyCard}>
      <View style={styles.emptyIcon}>
        <Ionicons name="film-outline" size={24} color="#F7D27D" />
      </View>
      <Text style={styles.emptyTitle}>Start with a mood</Text>
      <Text style={styles.emptyText}>Your picks appear here.</Text>
    </View>
  );

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.heroCard}>
        <View style={styles.heroBadge}>
          <Ionicons name="film-outline" size={16} color="#FACC15" />
          <Text style={styles.heroBadgeText}>Picks</Text>
        </View>
        <Text style={styles.heroTitle}>Pick your vibe</Text>

        {!isGeminiConfigured ? (
          <View style={styles.warningCard}>
            <Ionicons name="alert-circle-outline" size={18} color="#FACC15" />
            <Text style={styles.warningText}>
              Picks are offline in this build.
            </Text>
          </View>
        ) : null}

        <TextInput
          value={prompt}
          onChangeText={setPrompt}
          placeholder="Mood, genre, actor..."
          placeholderTextColor="#75757C"
          multiline
          style={styles.promptInput}
        />

        <View style={styles.quickPromptRow}>
          {QUICK_PROMPTS.map((quickPrompt, index) => (
            <TouchableOpacity
              key={quickPrompt}
              style={[styles.quickPromptChip, QUICK_PROMPT_ACCENTS[index % QUICK_PROMPT_ACCENTS.length]]}
              onPress={() => {
                setPrompt(quickPrompt);
                requestRecommendations(quickPrompt);
              }}
              activeOpacity={0.85}
            >
              <Text style={styles.quickPromptText}>{quickPrompt}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity
          style={[styles.primaryButton, loading && styles.primaryButtonDisabled]}
          onPress={() => requestRecommendations()}
          disabled={loading}
          activeOpacity={0.88}
        >
          <LinearGradient
            colors={['#F43F5E', '#EF4444', '#EC4899']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.primaryButtonGradient}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <>
                <Ionicons name="search-outline" size={18} color="#FFFFFF" />
                <Text style={styles.primaryButtonText}>Search</Text>
              </>
            )}
          </LinearGradient>
        </TouchableOpacity>

        {error ? <Text style={styles.errorText}>{error}</Text> : null}
      </View>

      <View style={styles.resultsHeader}>
        <Text style={styles.resultsTitle}>Community recommended series/movies</Text>
        <Text style={styles.resultsSubtitle}>Posts from community recommendations.</Text>
      </View>

      {communityRecommendations.map((item) => (
        <TouchableOpacity
          key={item.id}
          style={styles.communityCard}
          onPress={openCommunity}
          activeOpacity={0.86}
        >
          <View style={styles.communityCardTopRow}>
            <Text style={styles.communityTitle} numberOfLines={1}>{item.title}</Text>
            <Text style={styles.communityTime}>{formatRelativeTime(item.createdAtMs)}</Text>
          </View>
          <Text style={styles.communityText} numberOfLines={2}>
            {item.text || 'Open Community to read this recommendation.'}
          </Text>
          <View style={styles.communityMetaRow}>
            <View style={styles.communityMetaPill}>
              <Ionicons name="heart-outline" size={13} color="#FCA5A5" />
              <Text style={styles.communityMetaText}>{item.likes}</Text>
            </View>
            <View style={styles.communityMetaPill}>
              <Ionicons name="chatbubble-ellipses-outline" size={13} color="#93C5FD" />
              <Text style={styles.communityMetaText}>{item.commentsCount}</Text>
            </View>
            <View style={styles.communityCtaWrap}>
              <Text style={styles.communityCtaText}>Open community</Text>
              <Ionicons name="arrow-forward" size={13} color="#F7D27D" />
            </View>
          </View>
        </TouchableOpacity>
      ))}

      {shouldShowCommunityEmpty ? (
        <View style={styles.emptyCard}>
          <View style={styles.emptyIcon}>
            <Ionicons name="people-outline" size={24} color="#F7D27D" />
          </View>
          <Text style={styles.emptyTitle}>Community recommendations</Text>
          <Text style={styles.emptyText}>Recommended series/movie posts will show here.</Text>
        </View>
      ) : null}

      <View style={styles.resultsHeader}>
        <Text style={styles.resultsTitle}>AI picks</Text>
      </View>

      {recommendations.length === 0 && !loading ? (
        renderEmptyRecommendations()
      ) : null}

      {recommendations.map((recommendation) => (
        <View key={recommendation.id} style={styles.resultCard}>
          {recommendation.posterUrl ? (
            <Image source={{ uri: recommendation.posterUrl }} style={styles.posterImage} resizeMode="cover" />
          ) : (
            <View style={styles.posterFallback}>
              <Ionicons name="film-outline" size={28} color="#7A7A7A" />
            </View>
          )}

          <View style={styles.resultBody}>
            <Text style={styles.resultTitle}>
              {recommendation.title} <Text style={styles.resultYear}>({recommendation.year})</Text>
            </Text>

            <View style={styles.metaRow}>
              <View style={styles.metaPill}>
                <Ionicons name="star" size={14} color="#F87171" />
                <Text style={styles.metaText}>
                  {recommendation.voteAverage ? recommendation.voteAverage.toFixed(1) : 'NR'}
                </Text>
              </View>
              <View style={styles.metaPill}>
                <Ionicons name="albums-outline" size={14} color="#60A5FA" />
                <Text style={styles.metaText} numberOfLines={1}>{getCompactReason(recommendation.reason)}</Text>
              </View>
            </View>

            <View style={styles.actionRow}>
              <TouchableOpacity
                style={styles.secondaryButton}
                onPress={() => openImdb(recommendation.imdbUrl)}
                activeOpacity={0.85}
              >
                <Ionicons name="open-outline" size={16} color="#FFFFFF" />
                <Text style={styles.secondaryButtonText}>IMDb</Text>
              </TouchableOpacity>

              {recommendation.movieId ? (
                <TouchableOpacity
                  style={styles.secondaryButton}
                  onPress={() => navigation.navigate('MovieDetails', { movieId: recommendation.movieId })}
                  activeOpacity={0.85}
                >
                  <Ionicons name="information-circle-outline" size={16} color="#FFFFFF" />
                  <Text style={styles.secondaryButtonText}>Details</Text>
                </TouchableOpacity>
              ) : null}
            </View>
          </View>
        </View>
      ))}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#05070B',
  },
  content: {
    padding: 20,
    paddingBottom: 28,
    gap: 14,
  },
  heroCard: {
    backgroundColor: '#101622',
    borderRadius: 8,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(126, 192, 255, 0.2)',
  },
  heroBadge: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(250, 204, 21, 0.14)',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 14,
  },
  heroBadgeText: {
    color: '#F8E7A2',
    fontSize: 12,
    fontWeight: '700',
  },
  heroTitle: {
    color: '#FFFFFF',
    fontSize: 30,
    fontWeight: '800',
    marginBottom: 16,
  },
  warningCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: 'rgba(250, 204, 21, 0.1)',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 14,
  },
  warningText: {
    flex: 1,
    color: '#F3D46B',
    fontSize: 13,
    fontWeight: '600',
  },
  promptInput: {
    minHeight: 84,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    backgroundColor: '#161C29',
    color: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 16,
    textAlignVertical: 'top',
    fontSize: 15,
  },
  quickPromptRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 14,
  },
  quickPromptChip: {
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  quickPromptText: {
    color: '#F0F4FB',
    fontSize: 12,
    fontWeight: '600',
  },
  primaryButton: {
    marginTop: 18,
    borderRadius: 8,
    overflow: 'hidden',
  },
  primaryButtonGradient: {
    paddingVertical: 15,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    gap: 10,
  },
  primaryButtonDisabled: {
    opacity: 0.7,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  errorText: {
    color: '#FF8A8A',
    fontSize: 13,
    marginTop: 12,
    lineHeight: 19,
  },
  resultsHeader: {
    gap: 6,
  },
  resultsTitle: {
    color: '#EAF0FF',
    fontSize: 20,
    fontWeight: '800',
  },
  resultsSubtitle: {
    color: '#8FA1BC',
    fontSize: 12,
    fontWeight: '600',
  },
  communityCard: {
    backgroundColor: '#101622',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(247, 210, 125, 0.2)',
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 8,
  },
  communityCardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  communityTitle: {
    flex: 1,
    color: '#F5F8FF',
    fontSize: 15,
    fontWeight: '800',
  },
  communityTime: {
    color: '#90A1BB',
    fontSize: 11,
    fontWeight: '600',
  },
  communityText: {
    color: '#C6D2E6',
    fontSize: 13,
    lineHeight: 19,
  },
  communityMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  communityMetaPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.05)',
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  communityMetaText: {
    color: '#E6ECF8',
    fontSize: 11,
    fontWeight: '700',
  },
  communityCtaWrap: {
    marginLeft: 'auto',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  communityCtaText: {
    color: '#F7D27D',
    fontSize: 12,
    fontWeight: '700',
  },
  emptyCard: {
    alignItems: 'center',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    backgroundColor: '#101622',
    paddingHorizontal: 22,
    paddingVertical: 28,
  },
  emptyIcon: {
    width: 48,
    height: 48,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(247, 210, 125, 0.12)',
    marginBottom: 14,
  },
  emptyTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 8,
  },
  emptyText: {
    color: '#AAB4C4',
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
  },
  resultCard: {
    flexDirection: 'row',
    backgroundColor: '#101622',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(126, 192, 255, 0.18)',
    padding: 14,
    gap: 14,
  },
  posterImage: {
    width: 92,
    height: 132,
    borderRadius: 8,
    backgroundColor: '#1D1D1F',
  },
  posterFallback: {
    width: 92,
    height: 132,
    borderRadius: 8,
    backgroundColor: '#1D1D1F',
    justifyContent: 'center',
    alignItems: 'center',
  },
  resultBody: {
    flex: 1,
  },
  resultTitle: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '800',
    lineHeight: 23,
  },
  resultYear: {
    color: '#B7B7BE',
    fontSize: 15,
    fontWeight: '600',
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 12,
  },
  metaPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  metaText: {
    color: '#F4F4F4',
    fontSize: 12,
    fontWeight: '700',
  },
  actionRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 14,
  },
  secondaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#1C1D20',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 11,
  },
  secondaryButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
});

export default AIRecommendationsScreen;
