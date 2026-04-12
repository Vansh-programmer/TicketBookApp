import React, { useState } from 'react';
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
import { useNavigation } from '@react-navigation/native';
import { useToast } from '../components/ToastProvider';
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

const AIRecommendationsScreen = () => {
  const navigation = useNavigation();
  const { showToast } = useToast();
  const [prompt, setPrompt] = useState('');
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

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
      <Text style={styles.emptyTitle}>Tell us the mood</Text>
      <Text style={styles.emptyText}>
        Try a genre, occasion, actor, or pace. Your picks will appear here.
      </Text>
    </View>
  );

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.heroCard}>
        <View style={styles.heroBadge}>
          <Ionicons name="film-outline" size={16} color="#FACC15" />
          <Text style={styles.heroBadgeText}>Curated picks</Text>
        </View>
        <Text style={styles.heroTitle}>Find the right film for tonight</Text>

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
          placeholder="Romantic dramas, dark sci-fi, comfort movies..."
          placeholderTextColor="#75757C"
          multiline
          style={styles.promptInput}
        />

        <View style={styles.quickPromptRow}>
          {QUICK_PROMPTS.map((quickPrompt) => (
            <TouchableOpacity
              key={quickPrompt}
              style={styles.quickPromptChip}
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
          {loading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <>
              <Ionicons name="search-outline" size={18} color="#FFFFFF" />
              <Text style={styles.primaryButtonText}>Find matches</Text>
            </>
          )}
        </TouchableOpacity>

        {error ? <Text style={styles.errorText}>{error}</Text> : null}
      </View>

      <View style={styles.resultsHeader}>
        <Text style={styles.resultsTitle}>Your matches</Text>
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
                <Text style={styles.metaText} numberOfLines={1}>{recommendation.reason}</Text>
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
    backgroundColor: '#050505',
  },
  content: {
    padding: 20,
    paddingBottom: 28,
    gap: 18,
  },
  heroCard: {
    backgroundColor: '#101217',
    borderRadius: 8,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  heroBadge: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(250, 204, 21, 0.12)',
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
    fontSize: 24,
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
    minHeight: 110,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.09)',
    backgroundColor: '#16171A',
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
    backgroundColor: '#1E2024',
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  quickPromptText: {
    color: '#E8E8EA',
    fontSize: 12,
    fontWeight: '600',
  },
  primaryButton: {
    marginTop: 18,
    borderRadius: 8,
    backgroundColor: '#E50914',
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
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '800',
  },
  emptyCard: {
    alignItems: 'center',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    backgroundColor: '#101217',
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
    backgroundColor: '#101217',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
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
