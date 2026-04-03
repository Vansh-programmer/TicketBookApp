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
  'Give me mind-bending sci-fi movies',
  'Recommend feel-good family movies',
  'Suggest stylish thrillers like Gone Girl',
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
          ? 'Add your Gemini API key to start the chatbot. See docs/GEMINI_API_KEY.md.'
          : 'Unable to fetch recommendations right now. Please try again in a moment.',
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

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.heroCard}>
        <View style={styles.heroBadge}>
          <Ionicons name="sparkles" size={16} color="#FACC15" />
          <Text style={styles.heroBadgeText}>Gemini Movie Concierge</Text>
        </View>
        <Text style={styles.heroTitle}>Ask for movie picks in plain English</Text>
        <Text style={styles.heroSubtitle}>
          Tell the chatbot your mood, genre, or the kind of movie night you want and it will return real titles with IMDb links.
        </Text>

        {!isGeminiConfigured ? (
          <View style={styles.warningCard}>
            <Ionicons name="alert-circle-outline" size={18} color="#FACC15" />
            <Text style={styles.warningText}>
              Add `EXPO_PUBLIC_GEMINI_API_KEY` before using this screen.
            </Text>
          </View>
        ) : null}

        <TextInput
          value={prompt}
          onChangeText={setPrompt}
          placeholder="Example: Recommend emotional sci-fi movies with strong endings"
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
              <Ionicons name="chatbubble-ellipses-outline" size={18} color="#FFFFFF" />
              <Text style={styles.primaryButtonText}>Get Recommendations</Text>
            </>
          )}
        </TouchableOpacity>

        {error ? <Text style={styles.errorText}>{error}</Text> : null}
      </View>

      <View style={styles.resultsHeader}>
        <Text style={styles.resultsTitle}>Recommended for you</Text>
        <Text style={styles.resultsSubtitle}>
          Each result links out to IMDb and opens the movie details page inside the app when available.
        </Text>
      </View>

      {recommendations.length === 0 && !loading ? (
        <View style={styles.emptyCard}>
          <Ionicons name="film-outline" size={28} color="#8B8B8B" />
          <Text style={styles.emptyTitle}>No recommendations yet</Text>
          <Text style={styles.emptySubtitle}>
            Start with one of the quick prompts or describe the exact kind of movie you want.
          </Text>
        </View>
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
            <Text style={styles.resultReason}>{recommendation.reason}</Text>

            <View style={styles.metaRow}>
              <View style={styles.metaPill}>
                <Ionicons name="star" size={14} color="#F87171" />
                <Text style={styles.metaText}>
                  {recommendation.voteAverage ? recommendation.voteAverage.toFixed(1) : 'N/A'}
                </Text>
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
    backgroundColor: '#111214',
    borderRadius: 24,
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
    borderRadius: 999,
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
    marginBottom: 8,
  },
  heroSubtitle: {
    color: '#B7B7BE',
    fontSize: 14,
    lineHeight: 21,
    marginBottom: 16,
  },
  warningCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: 'rgba(250, 204, 21, 0.1)',
    borderRadius: 16,
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
    borderRadius: 18,
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
    borderRadius: 999,
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
    borderRadius: 18,
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
  resultsSubtitle: {
    color: '#9FA0A7',
    fontSize: 13,
    lineHeight: 19,
  },
  emptyCard: {
    borderRadius: 22,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    backgroundColor: '#101112',
    paddingHorizontal: 18,
    paddingVertical: 22,
    alignItems: 'center',
  },
  emptyTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    marginTop: 10,
  },
  emptySubtitle: {
    color: '#9FA0A7',
    fontSize: 13,
    lineHeight: 19,
    textAlign: 'center',
    marginTop: 6,
  },
  resultCard: {
    flexDirection: 'row',
    backgroundColor: '#101112',
    borderRadius: 22,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    padding: 14,
    gap: 14,
  },
  posterImage: {
    width: 92,
    height: 132,
    borderRadius: 16,
    backgroundColor: '#1D1D1F',
  },
  posterFallback: {
    width: 92,
    height: 132,
    borderRadius: 16,
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
  resultReason: {
    color: '#B7B7BE',
    fontSize: 13,
    lineHeight: 20,
    marginTop: 8,
  },
  metaRow: {
    flexDirection: 'row',
    marginTop: 12,
  },
  metaPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: 999,
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
    borderRadius: 14,
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

