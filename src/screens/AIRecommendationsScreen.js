import React, { useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Linking,
  Platform,
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

const NativeWebView = Platform.OS === 'web' ? null : require('react-native-webview').WebView;

const QUICK_PROMPTS = [
  'Give me mind-bending sci-fi movies',
  'Recommend feel-good family movies',
  'Recommend horror movies',
  'Suggest satire movie/series',
];

const TENOR_EMBEDS = {
  horror: {
    title: 'Anime Uzumaki GIF',
    postId: '12013994626959537302',
    aspectRatio: '1.49102',
    primaryUrl: 'https://tenor.com/view/anime-uzumaki-junji-ito-horror-gif-12013994626959537302',
    secondaryLabel: 'Anime GIFs',
    secondaryUrl: 'https://tenor.com/search/anime-gifs',
  },
  satire: {
    title: 'Hasna Tha Sarcasm Sticker',
    postId: '2836167382193789847',
    aspectRatio: '0.801205',
    primaryUrl: 'https://tenor.com/view/hasna-tha-sarcasm-sarc-arjun-rampal-akshaye-khanna-gif-2836167382193789847',
    secondaryLabel: 'Hasna Tha Stickers',
    secondaryUrl: 'https://tenor.com/search/hasna+tha-stickers',
  },
  gangster: {
    title: 'Dhurandhar 2 Dhurandhar The Revenge Sticker',
    postId: '15464894884279485218',
    aspectRatio: '1.77857',
    primaryUrl: 'https://tenor.com/view/dhurandhar-2-dhurandhar-dhurandhar-the-revenge-dhurandhar-2-movie-dhurandhar-movie-gif-15464894884279485218',
    secondaryLabel: 'Dhurandhar 2 Stickers',
    secondaryUrl: 'https://tenor.com/search/dhurandhar+2-stickers',
  },
  romance: {
    title: 'Anime Romance GIF',
    postId: '25391369',
    aspectRatio: '1.71134',
    primaryUrl: 'https://tenor.com/view/anime-romance-gif-25391369',
    secondaryLabel: 'Romance GIFs',
    secondaryUrl: 'https://tenor.com/search/romance-gifs',
  },
  scifi: {
    title: 'Space Adventure Cobra Science Fiction GIF',
    postId: '23561424',
    aspectRatio: '1.79137',
    primaryUrl: 'https://tenor.com/view/space-adventure-cobra-science-fiction-future-city-green-hair-anime-gif-23561424',
    secondaryLabel: 'Science Fiction GIFs',
    secondaryUrl: 'https://tenor.com/search/science+fiction-gifs',
  },
  action: {
    title: 'Anime Action GIF',
    postId: '10778149853649875390',
    aspectRatio: '1.77857',
    primaryUrl: 'https://tenor.com/view/anime-action-accion-lycoris-recoil-chisato-nishikigi-gif-10778149853649875390',
    secondaryLabel: 'Action GIFs',
    secondaryUrl: 'https://tenor.com/search/action-gifs',
  },
  comedy: {
    title: 'Anime Comedy GIF',
    postId: '23704429',
    aspectRatio: '0.76506',
    primaryUrl: 'https://tenor.com/view/anime-comedy-gif-23704429',
    secondaryLabel: 'Comedy GIFs',
    secondaryUrl: 'https://tenor.com/search/comedy-gifs',
  },
  family: {
    title: 'Spy Family Anime Celebrate GIF',
    postId: '26140149',
    aspectRatio: '1.79137',
    primaryUrl: 'https://tenor.com/view/spy-family-anime-celebrate-anime-celebration-gif-26140149',
    secondaryLabel: 'Family GIFs',
    secondaryUrl: 'https://tenor.com/search/family-gifs',
  },
  default: {
    title: 'Usagi Chiikawa GIF',
    postId: '1141253056357562491',
    aspectRatio: '1',
    primaryUrl: 'https://tenor.com/view/usagi-chiikawa-leaving-walking-away-anime-gif-1141253056357562491',
    secondaryLabel: 'Usagi GIFs',
    secondaryUrl: 'https://tenor.com/search/usagi-gifs',
  },
};

const buildTenorEmbedHtml = (embed) => `<!DOCTYPE html>
<html>
  <head>
    <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
    <style>
      html, body {
        margin: 0;
        padding: 0;
        background: #101112;
        overflow: hidden;
      }
      .tenor-gif-embed {
        width: 100% !important;
      }
    </style>
  </head>
  <body>
    <div
      class="tenor-gif-embed"
      data-postid="${embed.postId}"
      data-share-method="host"
      data-aspect-ratio="${embed.aspectRatio}"
      data-width="100%"
    >
      <a href="${embed.primaryUrl}">${embed.title}</a>
      from
      <a href="${embed.secondaryUrl}">${embed.secondaryLabel}</a>
    </div>
    <script type="text/javascript" async src="https://tenor.com/embed.js"></script>
  </body>
</html>`;

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

  const getTenorEmbedForPrompt = () => {
    const normalizedPrompt = prompt.trim().toLowerCase();

    if (/(horror|scary|ghost|haunted|junji|uzumaki|creepy|slasher)/.test(normalizedPrompt)) {
      return TENOR_EMBEDS.horror;
    }

    if (/(satire|sarcasm|sarcastic|mockery|dark comedy|political comedy)/.test(normalizedPrompt)) {
      return TENOR_EMBEDS.satire;
    }

    if (/(gangster|mafia|mob|underworld|crime boss|gunda|dhurandhar)/.test(normalizedPrompt)) {
      return TENOR_EMBEDS.gangster;
    }

    if (/(romance|romantic|love story|love|heartbreak|couple|dating)/.test(normalizedPrompt)) {
      return TENOR_EMBEDS.romance;
    }

    if (/(sci[- ]?fi|science fiction|space|cyberpunk|future|time travel|alien)/.test(normalizedPrompt)) {
      return TENOR_EMBEDS.scifi;
    }

    if (/(action|fight|fighting|adrenaline|martial arts|revenge|explosive)/.test(normalizedPrompt)) {
      return TENOR_EMBEDS.action;
    }

    if (/(comedy|funny|laugh|laughing|goofy|silly|comic)/.test(normalizedPrompt)) {
      return TENOR_EMBEDS.comedy;
    }

    if (/(family|kids|children|wholesome|feel good|feel-good|warm|animated family)/.test(normalizedPrompt)) {
      return TENOR_EMBEDS.family;
    }

    return TENOR_EMBEDS.default;
  };

  const renderEmptyRecommendations = () => (
    <View style={styles.tenorCard}>
      {(() => {
        const selectedEmbed = getTenorEmbedForPrompt();
        const tenorEmbedHtml = buildTenorEmbedHtml(selectedEmbed);

        return Platform.OS === 'web' ? (
          <iframe
            title={selectedEmbed.title}
            srcDoc={tenorEmbedHtml}
            style={styles.tenorFrame}
          />
        ) : (
          <NativeWebView
            originWhitelist={['*']}
            source={{ html: tenorEmbedHtml }}
            style={styles.tenorWebView}
            scrollEnabled={false}
            javaScriptEnabled
            domStorageEnabled
            automaticallyAdjustContentInsets={false}
          />
        );
      })()}
    </View>
  );

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.heroCard}>
        <View style={styles.heroBadge}>
          <Ionicons name="sparkles" size={16} color="#FACC15" />
          <Text style={styles.heroBadgeText}>Gemini Movie Concierge</Text>
        </View>
        <Text style={styles.heroTitle}>Ask for movie picks in plain English</Text>

        {!isGeminiConfigured ? (
          <View style={styles.warningCard}>
            <Ionicons name="alert-circle-outline" size={18} color="#FACC15" />
            <Text style={styles.warningText}>
              Add `EXPO_PUBLIC_GEMINI_API_KEY`
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
              <Ionicons name="chatbubble-ellipses-outline" size={18} color="#FFFFFF" />
              <Text style={styles.primaryButtonText}>Get Recommendations</Text>
            </>
          )}
        </TouchableOpacity>

        {error ? <Text style={styles.errorText}>{error}</Text> : null}
      </View>

      <View style={styles.resultsHeader}>
        <Text style={styles.resultsTitle}>Recommended for you</Text>
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
                  {recommendation.voteAverage ? recommendation.voteAverage.toFixed(1) : 'N/A'}
                </Text>
              </View>
              <View style={styles.metaPill}>
                <Ionicons name="sparkles-outline" size={14} color="#60A5FA" />
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
  tenorCard: {
    borderRadius: 22,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    backgroundColor: '#101112',
    overflow: 'hidden',
  },
  tenorFrame: {
    width: '100%',
    height: 320,
    borderWidth: 0,
    backgroundColor: '#101112',
  },
  tenorWebView: {
    width: '100%',
    height: 320,
    backgroundColor: '#101112',
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
