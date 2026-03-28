import React, { useEffect, useMemo } from 'react';
import {
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
  saveToWatchHistory,
} from '../services/streamCatalog';

const NativeWebView = Platform.OS === 'web' ? null : require('react-native-webview').WebView;

const PlayerScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const {
    videoId: rawVideoId,
    title = 'Now Playing',
    description = 'Watch directly inside the app.',
    subtitle,
    badge,
  } = route.params ?? {};

  const videoId = useMemo(() => extractYouTubeVideoId(rawVideoId), [rawVideoId]);
  const playerHeight = Math.min(Dimensions.get('window').width * 0.58, 300);
  const embedHtml = useMemo(() => {
    if (!videoId) {
      return '';
    }

    return `<!DOCTYPE html>
<html>
  <head>
    <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
    <style>
      html, body {
        margin: 0;
        padding: 0;
        background: #000;
        height: 100%;
        overflow: hidden;
      }
      .frame {
        border: 0;
        width: 100vw;
        height: 100vh;
      }
    </style>
  </head>
  <body>
    <iframe
      class="frame"
      src="${getYouTubeEmbedUrl(videoId)}"
      title="${title.replace(/"/g, '&quot;')}"
      allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
      allowfullscreen
    ></iframe>
  </body>
</html>`;
  }, [title, videoId]);

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

  const handleOpenYouTube = async () => {
    if (!videoId) {
      return;
    }

    try {
      await Linking.openURL(`https://www.youtube.com/watch?v=${videoId}`);
    } catch (error) {
      console.error('Unable to open YouTube:', error);
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
        {videoId ? (
          Platform.OS === 'web' ? (
            <iframe
              src={getYouTubeEmbedUrl(videoId)}
              title={title}
              allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
              allowFullScreen
              style={styles.webIframe}
            />
          ) : (
            <NativeWebView
              originWhitelist={['*']}
              source={{ html: embedHtml }}
              style={styles.player}
              allowsFullscreenVideo
              allowsInlineMediaPlayback
              mediaPlaybackRequiresUserAction={false}
              javaScriptEnabled
              domStorageEnabled
              setSupportMultipleWindows={false}
            />
          )
        ) : (
          <View style={styles.unavailableState}>
            <Ionicons name="videocam-off-outline" size={46} color="#8B8B8B" />
            <Text style={styles.unavailableTitle}>Video unavailable</Text>
            <Text style={styles.unavailableText}>
              This item does not have a valid YouTube source yet.
            </Text>
          </View>
        )}
      </View>

      <View style={styles.metaCard}>
        {badge ? <Text style={styles.badge}>{badge}</Text> : null}
        <Text style={styles.title}>{title}</Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
        <Text style={styles.description}>{description}</Text>

        <TouchableOpacity
          style={[styles.actionButton, !videoId && styles.actionButtonDisabled]}
          onPress={handleOpenYouTube}
          disabled={!videoId}
        >
          <Ionicons name="logo-youtube" size={18} color="#FFFFFF" />
          <Text style={styles.actionButtonText}>Open on YouTube</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#050505',
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
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#151515',
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
    borderRadius: 22,
    overflow: 'hidden',
    backgroundColor: '#101010',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  player: {
    flex: 1,
    backgroundColor: '#000000',
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
  metaCard: {
    marginTop: 18,
    backgroundColor: '#111113',
    borderRadius: 22,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  badge: {
    color: '#FFB020',
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
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
  actionButton: {
    marginTop: 20,
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E50914',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  actionButtonDisabled: {
    backgroundColor: '#353535',
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    marginLeft: 8,
  },
});

export default PlayerScreen;
