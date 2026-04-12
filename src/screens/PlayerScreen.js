import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Linking,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import * as ScreenOrientation from 'expo-screen-orientation';
import {
  extractYouTubeVideoId,
  getStreamHistoryKey,
  getYouTubeEmbedUrl,
  getYouTubeWatchUrl,
  saveToWatchHistory,
} from '../services/streamCatalog';

const NativeWebView = Platform.OS === 'web' ? null : require('react-native-webview').WebView;

const normalizeHttpsUrl = (value) => {
  if (typeof value !== 'string' || !value.trim()) {
    return '';
  }

  try {
    const parsed = new URL(value.trim());
    return parsed.protocol === 'https:' ? parsed.toString() : '';
  } catch (error) {
    return '';
  }
};

const getHostname = (url) => {
  try {
    return new URL(url).hostname.toLowerCase();
  } catch (error) {
    return '';
  }
};

const isAllowedHost = (url, trustedHost) => {
  const requestedHost = getHostname(url);
  if (!requestedHost || !trustedHost) {
    return false;
  }

  return requestedHost === trustedHost || requestedHost.endsWith(`.${trustedHost}`);
};

const PlayerScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const {
    streamId,
    historyKey,
    embedUrl: rawEmbedUrl,
    playbackType,
    thumbnail,
    videoId: rawVideoId,
    title = 'Now Playing',
    description = '',
    subtitle,
    badge,
  } = route.params ?? {};
  const [playerError, setPlayerError] = useState(false);
  const [redirectBlocked, setRedirectBlocked] = useState(false);
  const windowSize = useWindowDimensions();

  const customEmbedUrl = useMemo(() => normalizeHttpsUrl(rawEmbedUrl), [rawEmbedUrl]);
  const videoId = useMemo(() => extractYouTubeVideoId(rawVideoId), [rawVideoId]);
  const isFullscreenLandscape = Platform.OS !== 'web' && windowSize.width > windowSize.height;
  const playerHeight = Math.min(windowSize.width * 0.58, 300);
  const embedUrl = useMemo(
    () => customEmbedUrl || (videoId ? getYouTubeEmbedUrl(videoId) : ''),
    [customEmbedUrl, videoId],
  );
  const trustedHost = useMemo(() => getHostname(embedUrl), [embedUrl]);
  const usesCustomEmbed = Boolean(customEmbedUrl || (playbackType && playbackType !== 'youtube'));
  const watchUrl = useMemo(() => (videoId ? getYouTubeWatchUrl(videoId) : ''), [videoId]);

  useEffect(() => {
    if (!embedUrl && !videoId) {
      return;
    }

    saveToWatchHistory({
      id: streamId,
      historyKey: historyKey || getStreamHistoryKey({ id: streamId, videoId, embedUrl, title }),
      title,
      description,
      subtitle,
      badge,
      embedUrl: customEmbedUrl,
      playbackType: usesCustomEmbed ? 'embed' : 'youtube',
      thumbnail,
      videoId,
    });
  }, [
    badge,
    customEmbedUrl,
    description,
    embedUrl,
    historyKey,
    streamId,
    subtitle,
    thumbnail,
    title,
    usesCustomEmbed,
    videoId,
  ]);

  useEffect(() => {
    setRedirectBlocked(false);
    setPlayerError(false);
  }, [embedUrl]);

  useEffect(() => {
    if (Platform.OS === 'web') {
      return undefined;
    }

    const lockLandscape = async () => {
      try {
        await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.LANDSCAPE);
      } catch (error) {
        console.warn('Unable to lock player orientation:', error);
      }
    };

    void lockLandscape();

    return () => {
      ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.DEFAULT).catch((error) => {
        console.warn('Unable to restore orientation after player close:', error);
      });
    };
  }, []);

  const handleWebViewNavigation = (request) => {
    const url = request?.url || '';

    if (!url || url === 'about:blank') {
      return true;
    }

    if (url.startsWith('blob:') || url.startsWith('data:')) {
      return true;
    }

    if (usesCustomEmbed && trustedHost) {
      const allowed = isAllowedHost(url, trustedHost);
      if (!allowed) {
        setRedirectBlocked(true);
      }
      return allowed;
    }

    if (
      url.startsWith('https://www.youtube-nocookie.com/embed/') ||
      url.startsWith('https://www.youtube.com/embed/')
    ) {
      return true;
    }

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
    <ScrollView
      style={styles.container}
      contentContainerStyle={[styles.content, isFullscreenLandscape && styles.contentLandscape]}
      scrollEnabled={!isFullscreenLandscape}
    >
      {isFullscreenLandscape ? (
        <TouchableOpacity style={styles.landscapeBackButton} onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={22} color="#FFFFFF" />
        </TouchableOpacity>
      ) : (
        <View style={styles.headerRow}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Ionicons name="chevron-back" size={22} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Player</Text>
          <View style={styles.headerSpacer} />
        </View>
      )}

      <View
        style={[
          styles.playerShell,
          isFullscreenLandscape ? styles.playerShellLandscape : { height: playerHeight },
        ]}
      >
        {embedUrl && !playerError ? (
          Platform.OS === 'web' ? (
            <iframe
              src={embedUrl}
              title={title}
              allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
              allowFullScreen
              referrerPolicy="no-referrer"
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
              {embedUrl ? 'In-app playback unavailable' : 'Video unavailable'}
            </Text>
            <Text style={styles.unavailableText}>
              {embedUrl
                ? 'This movie could not be loaded inside the app right now.'
                : 'This item does not have a valid embed source yet.'}
            </Text>
            {watchUrl && !usesCustomEmbed ? (
              <TouchableOpacity style={styles.fallbackButton} onPress={handleOpenInYouTube}>
                <Ionicons name="logo-youtube" size={16} color="#050505" />
                <Text style={styles.fallbackButtonText}>Open in YouTube</Text>
              </TouchableOpacity>
            ) : null}
          </View>
        )}
      </View>

      {!isFullscreenLandscape && redirectBlocked ? (
        <View style={styles.redirectNotice}>
          <Ionicons name="shield-checkmark-outline" size={16} color="#F9C56E" />
          <Text style={styles.redirectNoticeText}>
            Redirect blocked for safety. Only the original streaming domain is allowed.
          </Text>
        </View>
      ) : null}

      {!isFullscreenLandscape && watchUrl && !usesCustomEmbed ? (
        <TouchableOpacity style={styles.externalOpenButton} onPress={handleOpenInYouTube}>
          <Ionicons name="logo-youtube" size={18} color="#FFFFFF" />
          <Text style={styles.externalOpenButtonText}>Playback fallback: Open in YouTube</Text>
        </TouchableOpacity>
      ) : null}

      {!isFullscreenLandscape ? (
        <View style={styles.metaCard}>
          {badge ? <Text style={styles.badge}>{badge}</Text> : null}
          <Text style={styles.title}>{title}</Text>
          {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
          {description ? <Text style={styles.description}>{description}</Text> : null}
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
    paddingTop: 56,
    paddingHorizontal: 16,
    paddingBottom: 32,
  },
  contentLandscape: {
    paddingTop: 0,
    paddingHorizontal: 0,
    paddingBottom: 0,
    flexGrow: 1,
  },
  landscapeBackButton: {
    position: 'absolute',
    top: 18,
    left: 14,
    zIndex: 12,
    width: 40,
    height: 40,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(8, 12, 18, 0.72)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.14)',
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
  playerShellLandscape: {
    flex: 1,
    borderRadius: 0,
    borderWidth: 0,
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
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
  redirectNotice: {
    marginTop: 14,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(249, 197, 110, 0.4)',
    backgroundColor: 'rgba(249, 197, 110, 0.12)',
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  redirectNoticeText: {
    flex: 1,
    color: '#F2DEB0',
    fontSize: 12,
    lineHeight: 18,
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
