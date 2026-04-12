import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  Linking,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import {
  extractYouTubeVideoId,
  getYouTubeEmbedUrl,
  getYouTubeWatchUrl,
  saveToWatchHistory,
} from '../services/streamCatalog';

const NativeWebView = Platform.OS === 'web' ? null : require('react-native-webview').WebView;

const PlayerScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const {
    videoId: rawVideoId,
    title = 'Now Playing',
    description = '',
    subtitle,
    badge,
  } = route.params ?? {};
  const [playerError, setPlayerError] = useState(false);

  const videoId = useMemo(() => extractYouTubeVideoId(rawVideoId), [rawVideoId]);
  const playerHeight = Math.min(Dimensions.get('window').width * 0.58, 300);
  const embedUrl = useMemo(() => (videoId ? getYouTubeEmbedUrl(videoId) : ''), [videoId]);
  const watchUrl = useMemo(() => (videoId ? getYouTubeWatchUrl(videoId) : ''), [videoId]);

  useEffect(() => {
    if (!videoId) {
      return;
    }

    saveToWatchHistory({
      title,
      description,
      subtitle,
      badge,
      videoId,
    });
  }, [badge, description, subtitle, title, videoId]);

  const handleWebViewNavigation = (request) => {
    const url = request?.url || '';

    if (!url || url === 'about:blank') {
      return true;
    }

    if (
      url.startsWith('https://www.youtube-nocookie.com/embed/') ||
      url.startsWith('https://www.youtube.com/embed/')
    ) {
      return true;
    }

    Linking.openURL(url).catch((error) => {
      console.error('Unable to open external video link:', error);
    });

    return false;
  };

  const handleOpenInYouTube = async () => {
    if (!watchUrl) {
      return;
    }

    try {
      await Linking.openURL(watchUrl);
    } catch (error) {
      console.error('Unable to open YouTube link:', error);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.headerRow}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={22} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Player</Text>
        <View style={styles.headerSpacer} />
      </View>

      <View style={[styles.playerShell, { height: playerHeight }]}>
        {videoId && !playerError ? (
          Platform.OS === 'web' ? (
            <iframe
              src={embedUrl}
              title={title}
              allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
              allowFullScreen
              style={styles.webIframe}
            />
          ) : (
            <NativeWebView
              originWhitelist={['*']}
              source={{ uri: embedUrl }}
              style={styles.player}
              allowsFullscreenVideo
              allowsInlineMediaPlayback
              mediaPlaybackRequiresUserAction={false}
              javaScriptEnabled
              domStorageEnabled
              incognito
              setSupportMultipleWindows={false}
              startInLoadingState
              renderLoading={() => (
                <View style={styles.loadingState}>
                  <ActivityIndicator size="large" color="#FFFFFF" />
                  <Text style={styles.loadingText}>Opening player…</Text>
                </View>
              )}
              onShouldStartLoadWithRequest={handleWebViewNavigation}
              onError={() => setPlayerError(true)}
              onHttpError={() => setPlayerError(true)}
            />
          )
        ) : (
          <View style={styles.unavailableState}>
            <Ionicons name="videocam-off-outline" size={46} color="#8B8B8B" />
            <Text style={styles.unavailableTitle}>
              {videoId ? 'In-app playback unavailable' : 'Video unavailable'}
            </Text>
            <Text style={styles.unavailableText}>
              {videoId
                ? 'This movie could not be loaded inside the app right now.'
                : 'This item does not have a valid YouTube source yet.'}
            </Text>
            {watchUrl ? (
              <TouchableOpacity style={styles.fallbackButton} onPress={handleOpenInYouTube}>
                <Ionicons name="logo-youtube" size={16} color="#050505" />
                <Text style={styles.fallbackButtonText}>Open in YouTube</Text>
              </TouchableOpacity>
            ) : null}
          </View>
        )}
      </View>

      {watchUrl ? (
        <TouchableOpacity style={styles.externalOpenButton} onPress={handleOpenInYouTube}>
          <Ionicons name="logo-youtube" size={18} color="#FFFFFF" />
          <Text style={styles.externalOpenButtonText}>Playback fallback: Open in YouTube</Text>
        </TouchableOpacity>
      ) : null}

      <View style={styles.metaCard}>
        {badge ? <Text style={styles.badge}>{badge}</Text> : null}
        <Text style={styles.title}>{title}</Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
        {description ? <Text style={styles.description}>{description}</Text> : null}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#06090E',
  },
  content: {
    paddingTop: 56,
    paddingHorizontal: 16,
    paddingBottom: 32,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 18,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },
  headerSpacer: {
    width: 40,
  },
  playerShell: {
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: 'rgba(12, 14, 18, 0.88)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    ...(Platform.OS === 'web'
      ? {
          boxShadow: '0px 18px 28px rgba(0, 0, 0, 0.24)',
        }
      : {
          shadowColor: '#000000',
          shadowOffset: {
            width: 0,
            height: 18,
          },
          shadowOpacity: 0.24,
          shadowRadius: 28,
        }),
  },
  player: {
    flex: 1,
    backgroundColor: '#000000',
  },
  loadingState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#090909',
  },
  loadingText: {
    marginTop: 12,
    color: '#D2D6DC',
    fontWeight: '600',
  },
  webIframe: {
    width: '100%',
    height: '100%',
    borderWidth: 0,
    backgroundColor: '#000000',
  },
  unavailableState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  unavailableTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
    marginTop: 14,
  },
  unavailableText: {
    color: '#8B8B8B',
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 20,
  },
  fallbackButton: {
    marginTop: 14,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 8,
  },
  fallbackButtonText: {
    color: '#050505',
    fontWeight: '800',
  },
  externalOpenButton: {
    marginTop: 14,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    backgroundColor: 'rgba(18, 21, 28, 0.92)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    gap: 8,
  },
  externalOpenButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  metaCard: {
    marginTop: 18,
    backgroundColor: 'rgba(15, 18, 24, 0.86)',
    borderRadius: 8,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  badge: {
    color: '#FFB020',
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0,
    marginBottom: 10,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '800',
  },
  subtitle: {
    color: '#B8B8B8',
    fontSize: 13,
    marginTop: 8,
  },
  description: {
    color: '#D0D0D0',
    lineHeight: 22,
    marginTop: 14,
  },
});

export default PlayerScreen;
