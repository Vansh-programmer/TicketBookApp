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
  getStreamHistoryKey,
  saveToWatchHistory,
} from '../services/streamCatalog';
import { playSoundEffect, SOUND_EFFECT_KEYS } from '../services/soundEffects';

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

const isSameHost = (url, host) => {
  const nextHost = getHostname(url);
  if (!nextHost || !host) {
    return false;
  }

  return nextHost === host || nextHost.endsWith(`.${host}`);
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
    title = 'Now Playing',
    description = '',
    subtitle,
    badge,
  } = route.params ?? {};
  const [playerError, setPlayerError] = useState(false);
  const [redirectBlocked, setRedirectBlocked] = useState(false);
  const [manualFullscreen, setManualFullscreen] = useState(false);
  const windowSize = useWindowDimensions();
  const resolvedSubtitle = useMemo(() => {
    const normalizedSubtitle = typeof subtitle === 'string' ? subtitle.trim() : '';
    return normalizedSubtitle && !normalizedSubtitle.includes('undefined') ? normalizedSubtitle : '';
  }, [subtitle]);

  const customEmbedUrl = useMemo(() => normalizeHttpsUrl(rawEmbedUrl), [rawEmbedUrl]);
  const isFullscreenLandscape = Platform.OS !== 'web' && windowSize.width > windowSize.height;
  const isFullscreenMode = manualFullscreen || isFullscreenLandscape;
  const playerHeight = Math.min(windowSize.width * 0.58, 300);
  const embedUrl = useMemo(() => customEmbedUrl, [customEmbedUrl]);
  const trustedHost = useMemo(() => getHostname(embedUrl), [embedUrl]);

  useEffect(() => {
    if (!embedUrl) {
      return;
    }

    saveToWatchHistory({
      id: streamId,
      historyKey: historyKey || getStreamHistoryKey({ id: streamId, embedUrl, title }),
      title,
      description,
      subtitle: resolvedSubtitle,
      badge,
      embedUrl: customEmbedUrl,
      playbackType: 'embed',
      thumbnail,
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
    resolvedSubtitle,
  ]);

  useEffect(() => {
    setRedirectBlocked(false);
    setPlayerError(false);
  }, [embedUrl]);

  useEffect(() => {
    if (Platform.OS === 'web') {
      return undefined;
    }

    return () => {
      ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.DEFAULT).catch((error) => {
        console.warn('Unable to restore orientation after player close:', error);
      });
    };
  }, []);

  const toggleFullscreen = async () => {
    playSoundEffect(SOUND_EFFECT_KEYS.TAP, { volume: 0.26 });

    if (Platform.OS === 'web') {
      setManualFullscreen((current) => !current);
      return;
    }

    try {
      if (!manualFullscreen) {
        await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.LANDSCAPE);
        setManualFullscreen(true);
      } else {
        await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP);
        setManualFullscreen(false);
      }
    } catch (error) {
      playSoundEffect(SOUND_EFFECT_KEYS.ERROR, { volume: 0.58, releaseAfterMs: 1700 });
      console.warn('Unable to toggle fullscreen mode:', error);
    }
  };

  const handleOpenExternally = async () => {
    if (!embedUrl) {
      return;
    }

    playSoundEffect(SOUND_EFFECT_KEYS.TAP, { volume: 0.3 });

    try {
      await Linking.openURL(embedUrl);
    } catch (error) {
      playSoundEffect(SOUND_EFFECT_KEYS.ERROR, { volume: 0.6, releaseAfterMs: 1800 });
      console.error('Unable to open external stream link:', error);
    }
  };

  const handleWebViewNavigation = (request) => {
    const url = request?.url || '';

    if (!url || url === 'about:blank') {
      return true;
    }

    if (url.startsWith('blob:') || url.startsWith('data:')) {
      return true;
    }

    if (trustedHost && isSameHost(url, trustedHost)) {
      return true;
    }

    setRedirectBlocked(true);
    return false;
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[styles.content, isFullscreenMode && styles.contentLandscape]}
      scrollEnabled={!isFullscreenMode}
    >
      {isFullscreenMode ? (
        <TouchableOpacity
          style={styles.landscapeBackButton}
          onPress={() => {
            playSoundEffect(SOUND_EFFECT_KEYS.TAP, { volume: 0.32 });
            navigation.goBack();
          }}
        >
          <Ionicons name="chevron-back" size={22} color="#FFFFFF" />
        </TouchableOpacity>
      ) : (
        <View style={styles.headerRow}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => {
              playSoundEffect(SOUND_EFFECT_KEYS.TAP, { volume: 0.32 });
              navigation.goBack();
            }}
          >
            <Ionicons name="chevron-back" size={22} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Player</Text>
          <View style={styles.headerSpacer} />
        </View>
      )}

      <View
        style={[
          styles.playerShell,
          isFullscreenMode ? styles.playerShellLandscape : { height: playerHeight },
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
              setSupportMultipleWindows={false}
              startInLoadingState
              renderLoading={() => (
                <View style={styles.loadingState}>
                  <ActivityIndicator size="large" color="#FFFFFF" />
                  <Text style={styles.loadingText}>Opening player...</Text>
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
                ? 'This movie should open externally in your browser.'
                : 'This item does not have a valid embed source yet.'}
            </Text>
            {embedUrl ? (
              <TouchableOpacity style={styles.fallbackButton} onPress={handleOpenExternally}>
                <Ionicons name="open-outline" size={16} color="#050505" />
                <Text style={styles.fallbackButtonText}>Open in browser</Text>
              </TouchableOpacity>
            ) : null}
          </View>
        )}
      </View>

      {!isFullscreenMode && redirectBlocked ? (
        <View style={styles.redirectNotice}>
          <Ionicons name="shield-checkmark-outline" size={16} color="#F9C56E" />
          <Text style={styles.redirectNoticeText}>Redirect blocked. Use Open in browser if needed.</Text>
        </View>
      ) : null}

      {embedUrl ? (
        <View style={[styles.controlRow, isFullscreenMode && styles.controlRowFullscreen]}>
          <TouchableOpacity style={styles.controlButton} onPress={toggleFullscreen}>
            <Ionicons name={isFullscreenMode ? 'contract-outline' : 'expand-outline'} size={18} color="#FFFFFF" />
            <Text style={styles.controlButtonText}>{isFullscreenMode ? 'Exit full screen' : 'Full screen'}</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.controlButton} onPress={handleOpenExternally}>
            <Ionicons name="open-outline" size={18} color="#FFFFFF" />
            <Text style={styles.controlButtonText}>Open in browser</Text>
          </TouchableOpacity>
        </View>
      ) : null}

      {!isFullscreenMode ? (
        <View style={styles.metaCard}>
          {badge ? <Text style={styles.badge}>{badge}</Text> : null}
          <Text style={styles.title}>{title}</Text>
          {resolvedSubtitle ? <Text style={styles.subtitle}>{resolvedSubtitle}</Text> : null}
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
    marginTop: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(249, 197, 110, 0.35)',
    backgroundColor: 'rgba(249, 197, 110, 0.08)',
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  redirectNoticeText: {
    color: '#E5C78A',
    fontSize: 12,
    flex: 1,
    lineHeight: 17,
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
  controlRow: {
    marginTop: 14,
    flexDirection: 'row',
    gap: 10,
  },
  controlRowFullscreen: {
    position: 'absolute',
    right: 14,
    bottom: 14,
    zIndex: 14,
    marginTop: 0,
  },
  controlButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.14)',
    backgroundColor: 'rgba(18, 21, 28, 0.92)',
    paddingHorizontal: 12,
    paddingVertical: 11,
  },
  controlButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 12,
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
