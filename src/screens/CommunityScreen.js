import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  FlatList,
  Image,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import {
  createAudioPlayer,
  RecordingPresets,
  requestRecordingPermissionsAsync,
  setAudioModeAsync,
  useAudioRecorder,
  useAudioRecorderState,
} from 'expo-audio';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { getDownloadURL, ref as storageRef, uploadBytes } from 'firebase/storage';
import AnimatedPressable from '../components/AnimatedPressable';
import GlassSurface from '../components/GlassSurface';
import NeonGlowButton from '../components/NeonGlowButton';
import ShimmerSkeletonCard from '../components/ShimmerSkeletonCard';
import { auth, storage } from '../config/firebase';
import { censorText, isBadWordsConfigured } from '../services/profanity';
import {
  addCommentToPost,
  createCommunityPost,
  deleteCommunityPost,
  formatRelativeTime,
  likeCommunityPost,
  subscribeToCommunityPosts,
} from '../services/community';

const NativeWebView = Platform.OS === 'web' ? null : require('react-native-webview').WebView;
const AUDIO_STATUS_EVENT = 'playbackStatusUpdate';
const IMAGE_URL_PATTERN = /\.(jpg|jpeg|png|webp|avif)(\?.*)?$/i;
const GIF_URL_PATTERN = /\.(gif)(\?.*)?$/i;
const AUDIO_URL_PATTERN = /\.(mp3|wav|m4a|aac|ogg|oga|webm)(\?.*)?$/i;
const MIN_VOICE_NOTE_DURATION_MS = 700;
const MAX_INLINE_WEB_AUDIO_BYTES = 700 * 1024;

const INTERACTION_THEMES = [
  {
    maxScore: 2,
    card: '#111317',
    border: 'rgba(138, 176, 255, 0.18)',
    accent: '#8EB5FF',
    accentSoft: 'rgba(142, 181, 255, 0.16)',
    surface: '#181C22',
    muted: '#97A4BC',
  },
  {
    maxScore: 8,
    card: '#141217',
    border: 'rgba(200, 133, 255, 0.2)',
    accent: '#C98BFF',
    accentSoft: 'rgba(201, 139, 255, 0.16)',
    surface: '#1B1820',
    muted: '#B6A5C5',
  },
  {
    maxScore: 16,
    card: '#171112',
    border: 'rgba(255, 119, 129, 0.26)',
    accent: '#FF7781',
    accentSoft: 'rgba(255, 119, 129, 0.16)',
    surface: '#211719',
    muted: '#C9ABAF',
  },
  {
    maxScore: Infinity,
    card: '#17130F',
    border: 'rgba(248, 199, 107, 0.28)',
    accent: '#F8C76B',
    accentSoft: 'rgba(248, 199, 107, 0.16)',
    surface: '#201A14',
    muted: '#D3BF97',
  },
];

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

const extractTenorPostId = (value) => {
  const matchedPostId =
    value.match(/data-postid=["']?(\d+)/i)?.[1] ||
    value.match(/postid=(\d+)/i)?.[1] ||
    value.match(/-(\d+)(?:[/?#]|$)/)?.[1];

  return matchedPostId || null;
};

const extractTenorAspectRatio = (value) =>
  value.match(/data-aspect-ratio=["']?([0-9.]+)/i)?.[1] || '1.15';

const extractTenorPrimaryUrl = (value, fallbackPostId) => {
  if (/^https?:\/\//i.test(value.trim())) {
    return value.trim();
  }

  const hrefMatch = value.match(/href=["']([^"']*tenor\.com\/[^"']+)["']/i)?.[1];
  if (hrefMatch) {
    return hrefMatch;
  }

  return fallbackPostId ? `https://tenor.com/view/community-gif-${fallbackPostId}` : 'https://tenor.com';
};

const getLabelFromUrl = (value) => {
  try {
    const path = new URL(value).pathname;
    const fileName = decodeURIComponent(path.split('/').pop() || '');

    return fileName.replace(/\.[^.]+$/, '').replace(/[-_]+/g, ' ').trim() || 'Media';
  } catch (error) {
    return 'Media';
  }
};

const getMediaAttachmentFromInput = (value) => {
  const trimmedValue = value.trim();

  if (!trimmedValue) {
    return null;
  }

  if (/tenor\.com|tenor-gif-embed/i.test(trimmedValue)) {
    const tenorPostId = extractTenorPostId(trimmedValue);

    if (!tenorPostId) {
      return { error: 'Paste a full Tenor link or embed snippet.' };
    }

    return {
      mediaType: 'tenor',
      mediaUrl: extractTenorPrimaryUrl(trimmedValue, tenorPostId),
      mediaLabel: 'Tenor GIF',
      tenorPostId,
      tenorAspectRatio: extractTenorAspectRatio(trimmedValue),
    };
  }

  if (!/^https?:\/\//i.test(trimmedValue)) {
    return { error: 'Media links need to start with http:// or https://.' };
  }

  if (AUDIO_URL_PATTERN.test(trimmedValue)) {
    return {
      mediaType: 'audio',
      mediaUrl: trimmedValue,
      mediaLabel: 'Sound clip',
      audioTitle: getLabelFromUrl(trimmedValue),
    };
  }

  if (GIF_URL_PATTERN.test(trimmedValue)) {
    return {
      mediaType: 'gif',
      mediaUrl: trimmedValue,
      mediaLabel: 'GIF',
    };
  }

  if (IMAGE_URL_PATTERN.test(trimmedValue)) {
    return {
      mediaType: 'image',
      mediaUrl: trimmedValue,
      mediaLabel: 'Image',
    };
  }

  return { error: 'Use a Tenor embed/link, GIF, image, or audio link.' };
};

const getPostTheme = (post) => {
  const interactionScore = post.likes * 2 + post.comments.length * 3;
  return INTERACTION_THEMES.find((theme) => interactionScore <= theme.maxScore) || INTERACTION_THEMES[0];
};

const buildTenorEmbedFromPost = (post) => {
  if (post.mediaType !== 'tenor' || !post.tenorPostId) {
    return null;
  }

  return {
    title: post.mediaLabel || 'Tenor GIF',
    postId: post.tenorPostId,
    aspectRatio: post.tenorAspectRatio || '1.15',
    primaryUrl: post.mediaUrl || 'https://tenor.com',
    secondaryLabel: 'Tenor GIFs',
    secondaryUrl: 'https://tenor.com/search/gifs',
  };
};

const getCurrentUserIdentity = () => {
  const email = auth?.currentUser?.email?.trim().toLowerCase();
  return auth?.currentUser?.uid || email || '';
};

const formatDurationLabel = (durationMs) => {
  const totalSeconds = Math.max(1, Math.floor((durationMs || 0) / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${String(seconds).padStart(2, '0')}`;
};

const blobToDataUrl = (blob) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result);
    reader.onerror = () => reject(new Error('Unable to read recorded voice note.'));
    reader.readAsDataURL(blob);
  });

const getDisplayValue = (value, fallback = '') => {
  if (typeof value === 'string') {
    const trimmedValue = value.trim();
    if (!trimmedValue) {
      return fallback;
    }

    if (trimmedValue.startsWith('{') || trimmedValue.startsWith('[')) {
      try {
        const parsedValue = JSON.parse(trimmedValue);
        return getDisplayValue(parsedValue, fallback);
      } catch (error) {
        return trimmedValue;
      }
    }

    return trimmedValue;
  }

  if (typeof value === 'number' || typeof value === 'boolean') {
    return String(value);
  }

  if (Array.isArray(value)) {
    const nextValue = value
      .map((entry) => getDisplayValue(entry))
      .filter(Boolean)
      .join(' ');

    return nextValue || fallback;
  }

  if (value && typeof value === 'object') {
    const preferredKeys = [
      'text',
      'message',
      'content',
      'body',
      'comment',
      'commentText',
      'reply',
      'description',
      'censored_content',
      'censored_string',
      'result',
      'value',
      'label',
      'name',
      'title',
    ];

    for (const key of preferredKeys) {
      const nextValue = getDisplayValue(value[key]);
      if (nextValue) {
        return nextValue;
      }
    }

    const nextValue = Object.entries(value)
      .filter(([key]) => !['id', 'author', 'authorId', 'createdAt', 'createdAtMs', 'uid', 'userId'].includes(key))
      .map(([, entry]) => getDisplayValue(entry))
      .filter(Boolean)
      .join(' ');

    if (nextValue) {
      return nextValue;
    }
  }

  return fallback;
};

const CommunityLoadingState = () => (
  <View style={styles.loadingWrap}>
    <Animated.View entering={FadeInDown.duration(500)} style={styles.header}>
      <Text style={styles.title}>Community</Text>
      <Text style={styles.heroCaption}>Movie discussions.</Text>
    </Animated.View>

    <View style={styles.statsRow}>
      {Array.from({ length: 3 }).map((_, index) => (
        <GlassSurface key={`stat-skeleton-${index}`} style={styles.statCard}>
          <View style={styles.statSkeletonInner}>
            <View style={styles.statSkeletonIcon} />
            <View style={styles.statSkeletonValue} />
          </View>
        </GlassSurface>
      ))}
    </View>

    <GlassSurface style={styles.composerCard}>
      <View style={styles.composerLoadingInner}>
        <View style={styles.topicSkeleton} />
        <View style={styles.composerLineLong} />
        <View style={styles.composerLineShort} />
        <View style={styles.composerActionRow}>
          <View style={styles.composerActionGhost} />
          <View style={styles.composerActionGhostPrimary} />
        </View>
      </View>
    </GlassSurface>

    {Array.from({ length: 3 }).map((_, index) => (
      <Animated.View
        key={`community-skeleton-${index}`}
        entering={FadeInUp.delay(index * 90).duration(420)}
      >
        <ShimmerSkeletonCard />
      </Animated.View>
    ))}
  </View>
);

const CommunityScreen = () => {
  const [posts, setPosts] = useState([]);
  const [postTopic, setPostTopic] = useState('');
  const [postText, setPostText] = useState('');
  const [postMediaInput, setPostMediaInput] = useState('');
  const [selectedImage, setSelectedImage] = useState(null);
  const [recordedVoiceNote, setRecordedVoiceNote] = useState(null);
  const [isRecordingVoice, setIsRecordingVoice] = useState(false);
  const [voiceError, setVoiceError] = useState('');
  const [commentDrafts, setCommentDrafts] = useState({});
  const [expandedPosts, setExpandedPosts] = useState({});
  const [submittingPost, setSubmittingPost] = useState(false);
  const [loadingFeed, setLoadingFeed] = useState(true);
  const [feedError, setFeedError] = useState('');
  const [activeAudioPostId, setActiveAudioPostId] = useState(null);
  const voiceRecorder = useAudioRecorder(RecordingPresets.LOW_QUALITY);
  const voiceRecorderState = useAudioRecorderState(voiceRecorder, 180);
  const audioPlayerRef = useRef(null);
  const audioSubscriptionRef = useRef(null);
  const activeAudioPostIdRef = useRef(null);
  const voiceCaptureStartedAtRef = useRef(0);

  const userLabel =
    auth?.currentUser?.displayName ||
    auth?.currentUser?.email?.split('@')[0] ||
    'MovieMate';
  const currentUserLikeId = getCurrentUserIdentity();
  const recordingDurationLabel = useMemo(
    () => formatDurationLabel(voiceRecorderState.durationMillis),
    [voiceRecorderState.durationMillis],
  );

  useEffect(() => {
    const unsubscribe = subscribeToCommunityPosts(
      (nextPosts) => {
        setPosts(nextPosts);
        setFeedError('');
        setLoadingFeed(false);
      },
      (error) => {
        console.error('Unable to subscribe to community posts:', error);
        setFeedError(
          error?.code === 'permission-denied'
            ? 'Community permissions are blocked in Firestore rules.'
            : 'Unable to load the shared community feed right now.',
        );
        setLoadingFeed(false);
      },
    );

    return unsubscribe;
  }, []);

  useEffect(
    () => () => {
      if (audioSubscriptionRef.current) {
        try {
          audioSubscriptionRef.current.remove();
        } catch (error) {
          console.warn('Unable to clean up community audio listener:', error);
        }
      }

      if (audioPlayerRef.current) {
        try {
          audioPlayerRef.current.pause();
        } catch (error) {
          console.warn('Unable to pause community audio during cleanup:', error);
        }

        try {
          audioPlayerRef.current.release();
        } catch (error) {
          console.warn('Unable to release community audio during cleanup:', error);
        }
      }

      voiceRecorder.stop().catch((error) => {
        console.warn('Unable to stop voice recorder during cleanup:', error);
      });
    },
    [voiceRecorder],
  );

  const totalComments = useMemo(
    () => posts.reduce((count, post) => count + post.comments.length, 0),
    [posts],
  );

  const stopAudioPlayback = () => {
    if (audioSubscriptionRef.current) {
      try {
        audioSubscriptionRef.current.remove();
      } catch (error) {
        console.warn('Unable to remove community audio listener:', error);
      }
      audioSubscriptionRef.current = null;
    }

    if (audioPlayerRef.current) {
      try {
        audioPlayerRef.current.pause();
      } catch (error) {
        console.warn('Unable to pause community audio:', error);
      }

      try {
        audioPlayerRef.current.release();
      } catch (error) {
        console.warn('Unable to release community audio:', error);
      }

      audioPlayerRef.current = null;
    }

    activeAudioPostIdRef.current = null;
    setActiveAudioPostId(null);
  };

  const toggleAudioPost = async (post) => {
    const isCurrentPostActive =
      activeAudioPostIdRef.current === post.id && audioPlayerRef.current?.playing;

    if (isCurrentPostActive) {
      stopAudioPlayback();
      return;
    }

    stopAudioPlayback();

    try {
      await setAudioModeAsync({
        playsInSilentMode: true,
        shouldPlayInBackground: false,
      });

      const player = createAudioPlayer(post.mediaUrl);
      player.volume = 0.88;

      audioSubscriptionRef.current = player.addListener(AUDIO_STATUS_EVENT, (status) => {
        const hasFinished =
          !status.playing &&
          !status.isBuffering &&
          status.isLoaded &&
          status.duration > 0 &&
          status.currentTime >= status.duration - 0.25;

        if (hasFinished && activeAudioPostIdRef.current === post.id) {
          stopAudioPlayback();
        }
      });

      audioPlayerRef.current = player;
      activeAudioPostIdRef.current = post.id;
      setActiveAudioPostId(post.id);
      player.play();
    } catch (error) {
      console.error('Unable to play community audio:', error);
      stopAudioPlayback();
      setFeedError('Unable to play this sound right now.');
    }
  };

  const uploadVoiceNoteToStorage = async (voiceNote) => {
    if (!voiceNote?.uri) {
      return null;
    }

    const response = await fetch(voiceNote.uri);
    const blob = await response.blob();

    if (Platform.OS === 'web') {
      if (blob.size > MAX_INLINE_WEB_AUDIO_BYTES) {
        throw new Error('Voice note is too long for web posting right now. Keep it under about 25 seconds.');
      }

      return blobToDataUrl(blob);
    }

    if (!storage) {
      throw new Error('Firebase Storage is not configured for voice notes.');
    }

    const safeAuthorId = (currentUserLikeId || 'guest').replace(/[^a-zA-Z0-9_-]/g, '_');
    const fileRef = storageRef(storage, `communityVoice/${safeAuthorId}/voice-${Date.now()}.m4a`);

    await uploadBytes(fileRef, blob, {
      contentType: blob.type || 'audio/m4a',
    });

    return getDownloadURL(fileRef);
  };

  const startVoiceCapture = async () => {
    if (submittingPost || isRecordingVoice || voiceRecorderState.isRecording) {
      return;
    }

    try {
      const permission = await requestRecordingPermissionsAsync();
      if (!permission.granted) {
        setVoiceError('Microphone permission is required to send voice notes.');
        return;
      }

      await setAudioModeAsync({
        allowsRecording: true,
        playsInSilentMode: true,
        shouldPlayInBackground: false,
      });

      await voiceRecorder.prepareToRecordAsync();
      voiceRecorder.record();

      voiceCaptureStartedAtRef.current = Date.now();
      setIsRecordingVoice(true);
      setRecordedVoiceNote(null);
      setSelectedImage(null);
      setPostMediaInput('');
      setVoiceError('');
      setFeedError('');
    } catch (error) {
      console.error('Unable to start voice recording:', error);
      setVoiceError('Unable to start recording.');
      setIsRecordingVoice(false);
    }
  };

  const stopVoiceCapture = async () => {
    if (!isRecordingVoice && !voiceRecorderState.isRecording) {
      return;
    }

    setIsRecordingVoice(false);

    try {
      await voiceRecorder.stop();
    } catch (error) {
      console.error('Unable to stop voice recording:', error);
      setVoiceError('Unable to finish recording.');
      return;
    } finally {
      try {
        await setAudioModeAsync({
          allowsRecording: false,
          playsInSilentMode: true,
          shouldPlayInBackground: false,
        });
      } catch (error) {
        console.warn('Unable to restore audio mode after recording:', error);
      }
    }

    const recorderStatus = voiceRecorder.getStatus();
    const durationMs = Math.max(
      recorderStatus?.durationMillis || 0,
      Date.now() - voiceCaptureStartedAtRef.current,
    );
    const voiceUri = recorderStatus?.url || voiceRecorder.uri;

    if (!voiceUri) {
      setVoiceError('Unable to save this recording.');
      return;
    }

    if (durationMs < MIN_VOICE_NOTE_DURATION_MS) {
      setRecordedVoiceNote(null);
      setVoiceError('Hold the mic a little longer to record a voice note.');
      return;
    }

    setRecordedVoiceNote({
      uri: voiceUri,
      durationMs,
      title: `Voice note (${formatDurationLabel(durationMs)})`,
    });
    setVoiceError('');
    setFeedError('');
  };

  const removeVoiceAttachment = () => {
    setRecordedVoiceNote(null);
    setVoiceError('');
  };

  const pickImage = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [4, 5],
      quality: 0.35,
      base64: true,
    });

    const selectedAsset = result.assets?.[0];

    if (!result.canceled && selectedAsset?.uri) {
      setSelectedImage({
        uri: selectedAsset.uri,
        dataUri: selectedAsset.base64
          ? `data:${selectedAsset.mimeType || 'image/jpeg'};base64,${selectedAsset.base64}`
          : null,
      });
      setRecordedVoiceNote(null);
      setVoiceError('');
      setPostMediaInput('');
      setFeedError('');
    }
  };

  const submitPost = async () => {
    const trimmedText = postText.trim();
    const trimmedMediaInput = postMediaInput.trim();
    const hasSelectedImage = Boolean(selectedImage?.dataUri);
    const hasVoiceAttachment = Boolean(recordedVoiceNote?.uri);
    const hasLinkAttachment = Boolean(trimmedMediaInput);

    if ((!trimmedText && !hasSelectedImage && !hasLinkAttachment && !hasVoiceAttachment) || submittingPost) {
      return;
    }

    let attachment = null;

    if (!hasSelectedImage && hasLinkAttachment) {
      attachment = getMediaAttachmentFromInput(trimmedMediaInput);
    } else if (!hasSelectedImage && hasVoiceAttachment) {
      attachment = {
        mediaType: 'audio',
        mediaUrl: null,
        mediaLabel: 'Voice note',
        audioTitle: recordedVoiceNote.title,
      };
    }

    if (attachment?.error) {
      setFeedError(attachment.error);
      return;
    }

    setSubmittingPost(true);

    try {
      const [censoredTopic, censoredPostText] = await Promise.all([
        censorText(postTopic),
        censorText(postText),
      ]);

      let uploadedVoiceUrl = attachment?.mediaUrl || null;
      if (attachment?.mediaType === 'audio' && hasVoiceAttachment) {
        uploadedVoiceUrl = await uploadVoiceNoteToStorage(recordedVoiceNote);
      }

      await createCommunityPost({
        authorId: currentUserLikeId,
        author: userLabel,
        handle: `@${userLabel.toLowerCase().replace(/\s+/g, '')}`,
        topic: censoredTopic,
        text: censoredPostText,
        imageData: selectedImage?.dataUri || null,
        mediaUrl: uploadedVoiceUrl,
        mediaType: attachment?.mediaType || null,
        mediaLabel: attachment?.mediaLabel || '',
        tenorPostId: attachment?.tenorPostId || null,
        tenorAspectRatio: attachment?.tenorAspectRatio || null,
        audioTitle: attachment?.audioTitle || '',
      });

      setPostTopic('');
      setPostText('');
      setPostMediaInput('');
      setSelectedImage(null);
      setRecordedVoiceNote(null);
      setVoiceError('');
      setFeedError('');
    } catch (error) {
      console.error('Unable to create community post:', error);
      setFeedError(
        error?.code === 'permission-denied'
          ? 'Posting is blocked by Firestore rules.'
          : error?.message || 'Unable to publish your post right now.',
      );
    } finally {
      setSubmittingPost(false);
    }
  };

  const submitComment = async (postId) => {
    const draft = commentDrafts[postId]?.trim();
    if (!draft) {
      return;
    }

    try {
      const censoredDraft = await censorText(draft);
      await addCommentToPost(postId, userLabel, censoredDraft);
      setCommentDrafts((current) => ({
        ...current,
        [postId]: '',
      }));
    } catch (error) {
      console.error('Unable to add comment:', error);
      setFeedError(
        error?.code === 'permission-denied'
          ? 'Commenting is blocked by Firestore rules.'
          : 'Unable to send your reply right now.',
      );
    }
  };

  const requestDeletePost = (post) => {
    const confirmDelete = async () => {
      try {
        await deleteCommunityPost(post.id);
        setFeedError('');
      } catch (error) {
        console.error('Unable to delete post:', error);
        setFeedError(
          error?.code === 'permission-denied'
            ? 'Deleting is blocked by Firestore rules.'
            : 'Unable to delete this post right now.',
        );
      }
    };

    if (Platform.OS === 'web' && typeof window !== 'undefined' && typeof window.confirm === 'function') {
      if (window.confirm('Delete this post?')) {
        void confirmDelete();
      }
      return;
    }

    Alert.alert('Delete post', 'Delete this post?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          void confirmDelete();
        },
      },
    ]);
  };

  const renderMediaAttachment = (item, theme) => {
    if (item.mediaType === 'audio' && item.mediaUrl) {
      const isPlaying = activeAudioPostId === item.id;

      return (
        <AnimatedPressable onPress={() => toggleAudioPost(item)} style={styles.audioCard}>
          <GlassSurface style={styles.audioCardSurface}>
            <View style={styles.audioCardInner}>
              <View style={[styles.audioIconWrap, { backgroundColor: theme.accentSoft }]}>
                <Ionicons name={isPlaying ? 'pause' : 'play'} size={20} color={theme.accent} />
              </View>
              <View style={styles.audioMeta}>
                <Text style={styles.audioTitle} numberOfLines={1}>
                  {item.audioTitle || item.mediaLabel || 'Community sound'}
                </Text>
                <Text style={[styles.audioHint, { color: theme.muted }]}>
                  {isPlaying ? 'Tap to stop' : 'Tap to play'}
                </Text>
              </View>
              <Ionicons name="musical-notes-outline" size={18} color={theme.accent} />
            </View>
          </GlassSurface>
        </AnimatedPressable>
      );
    }

    const tenorEmbed = buildTenorEmbedFromPost(item);
    if (tenorEmbed) {
      const aspectRatio = Number(tenorEmbed.aspectRatio) || 1.15;
      const tenorEmbedHtml = buildTenorEmbedHtml(tenorEmbed);

      return (
        <GlassSurface style={[styles.tenorShell, { aspectRatio }]}>
          {Platform.OS === 'web' ? (
            <iframe
              title={tenorEmbed.title}
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
          )}
        </GlassSurface>
      );
    }

    if (item.mediaUrl || item.imageUri) {
      const mediaUri = item.mediaUrl || item.imageUri;

      return (
        <View style={styles.mediaWrap}>
          <Image source={{ uri: mediaUri }} style={styles.postImage} resizeMode="cover" />
          {item.mediaType === 'gif' ? (
            <View style={[styles.mediaTypeChip, { backgroundColor: theme.accentSoft }]}>
              <Text style={[styles.mediaTypeChipText, { color: theme.accent }]}>GIF</Text>
            </View>
          ) : null}
        </View>
      );
    }

    return null;
  };

  const renderPost = ({ item, index }) => {
    const isExpanded = expandedPosts[item.id];
    const theme = getPostTheme(item);
    const hasLikedPost = item.likedBy?.includes(currentUserLikeId);
    const canDeletePost =
      Boolean(currentUserLikeId) &&
      (item.authorId === currentUserLikeId ||
        item.handle === `@${userLabel.toLowerCase().replace(/\s+/g, '')}`);

    return (
      <Animated.View
        entering={FadeInUp.delay(120 + index * 85).duration(520)}
        style={styles.postItemWrap}
      >
        <GlassSurface style={styles.postCard}>
          <LinearGradient
            colors={[`${theme.accent}7A`, 'rgba(255,255,255,0)']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.postTopAccent}
          />

          <View style={styles.postInner}>
            <View style={styles.postHeader}>
              <View style={styles.authorBlock}>
                <Text style={styles.author}>{item.author}</Text>
                <Text style={[styles.handle, { color: theme.muted }]}>
                  {item.handle} • {formatRelativeTime(item.createdAtMs)}
                </Text>
              </View>

              <View style={[styles.interactionIndicator, { backgroundColor: theme.accentSoft }]}>
                <View style={[styles.interactionIndicatorDot, { backgroundColor: theme.accent }]} />
              </View>
            </View>

            <View style={styles.topicRow}>
              <LinearGradient
                colors={[`${theme.accent}26`, 'rgba(255,255,255,0.03)']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.topicPill}
              >
                <Text style={[styles.topicPillText, { color: theme.accent }]}>{item.topic}</Text>
              </LinearGradient>
            </View>

            {item.text ? <Text style={styles.postText}>{item.text}</Text> : null}
            {renderMediaAttachment(item, theme)}

            <View style={styles.postActions}>
              <AnimatedPressable
                style={styles.postActionButton}
                onPress={async () => {
                  if (hasLikedPost) {
                    return;
                  }

                  try {
                    await likeCommunityPost(item.id, currentUserLikeId);
                  } catch (error) {
                    console.error('Unable to like post:', error);
                    setFeedError(
                      error?.code === 'auth/missing-user'
                        ? 'Please sign in to like posts.'
                        : error?.code === 'permission-denied'
                        ? 'Liking is blocked by Firestore rules.'
                        : 'Unable to like this post right now.',
                    );
                  }
                }}
                disabled={hasLikedPost}
              >
                <View
                  style={[
                    styles.postActionIcon,
                    { backgroundColor: hasLikedPost ? theme.accent : theme.accentSoft },
                  ]}
                >
                  <Ionicons
                    name={hasLikedPost ? 'heart' : 'heart-outline'}
                    size={16}
                    color={hasLikedPost ? '#09090B' : theme.accent}
                  />
                </View>
                <Text style={styles.postActionText}>{item.likes}</Text>
              </AnimatedPressable>

              <AnimatedPressable
                style={styles.postActionButton}
                onPress={() =>
                  setExpandedPosts((current) => ({
                    ...current,
                    [item.id]: !current[item.id],
                  }))
                }
              >
                <View style={[styles.postActionIcon, { backgroundColor: theme.surface }]}>
                  <Ionicons name="chatbubble-ellipses-outline" size={16} color={theme.accent} />
                </View>
                <Text style={styles.postActionText}>{item.comments.length}</Text>
              </AnimatedPressable>

              {canDeletePost ? (
                <AnimatedPressable
                  style={styles.postActionButton}
                  onPress={() => requestDeletePost(item)}
                >
                  <View
                    style={[
                      styles.postActionIcon,
                      { backgroundColor: 'rgba(229, 9, 20, 0.16)' },
                    ]}
                  >
                    <Ionicons name="trash-outline" size={16} color="#E50914" />
                  </View>
                  <Text style={styles.postActionText}>Delete</Text>
                </AnimatedPressable>
              ) : null}
            </View>

            {isExpanded ? (
              <View style={styles.commentsSection}>
                {item.comments.length === 0 ? (
                  <Text style={[styles.emptyCommentsText, { color: theme.muted }]}>
                    No comments yet.
                  </Text>
                ) : null}
                {item.comments.map((comment) => (
                  <GlassSurface key={comment.id} style={styles.commentBubble}>
                    <View style={styles.commentBubbleInner}>
                      <Text style={styles.commentAuthor}>
                        {getDisplayValue(comment.author, 'MovieMate')}
                      </Text>
                      <Text style={styles.commentText}>{getDisplayValue(comment.text, '')}</Text>
                    </View>
                  </GlassSurface>
                ))}

                <View style={styles.commentComposer}>
                  <GlassSurface style={styles.commentInputShell}>
                    <TextInput
                      value={commentDrafts[item.id] || ''}
                      onChangeText={(value) =>
                        setCommentDrafts((current) => ({
                          ...current,
                          [item.id]: value,
                        }))
                      }
                      placeholder="Join the discussion"
                      placeholderTextColor="#7A7C88"
                      style={styles.commentInput}
                    />
                  </GlassSurface>
                  <AnimatedPressable
                    style={styles.commentSendButtonWrap}
                    onPress={() => submitComment(item.id)}
                  >
                    <LinearGradient
                      colors={[theme.accent, '#FFFFFF']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={styles.commentSendButton}
                    >
                      <Ionicons name="send" size={16} color="#09090B" />
                    </LinearGradient>
                  </AnimatedPressable>
                </View>
              </View>
            ) : null}
          </View>
        </GlassSurface>
      </Animated.View>
    );
  };

  return (
    <>
      <FlatList
        style={styles.container}
        contentContainerStyle={styles.content}
        data={posts}
        renderItem={renderPost}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={loadingFeed && posts.length === 0 ? null : (
          <View>
            <Animated.View entering={FadeInDown.duration(520)} style={styles.header}>
              <Text style={styles.title}>Community</Text>
              <Text style={styles.heroCaption}>Posts, reactions, and media from the community.</Text>
            </Animated.View>

            <View style={styles.statsRow}>
              <Animated.View entering={FadeInUp.delay(50).duration(500)} style={styles.statCardWrap}>
                <GlassSurface style={styles.statCard}>
                  <View style={styles.statInner}>
                    <LinearGradient colors={['#34D399', '#0EA5E9']} style={styles.statIconAura}>
                      <Ionicons name="albums-outline" size={16} color="#FFFFFF" />
                    </LinearGradient>
                    <Text style={styles.statValue}>{posts.length}</Text>
                    <Text style={styles.statLabel}>Posts</Text>
                  </View>
                </GlassSurface>
              </Animated.View>
              <Animated.View entering={FadeInUp.delay(110).duration(500)} style={styles.statCardWrap}>
                <GlassSurface style={styles.statCard}>
                  <View style={styles.statInner}>
                    <LinearGradient colors={['#60A5FA', '#C084FC']} style={styles.statIconAura}>
                      <Ionicons name="chatbubble-ellipses-outline" size={16} color="#FFFFFF" />
                    </LinearGradient>
                    <Text style={styles.statValue}>{totalComments}</Text>
                    <Text style={styles.statLabel}>Replies</Text>
                  </View>
                </GlassSurface>
              </Animated.View>
              <Animated.View entering={FadeInUp.delay(170).duration(500)} style={styles.statCardWrap}>
                <GlassSurface style={styles.statCard}>
                  <View style={styles.statInner}>
                    <LinearGradient colors={['#F472B6', '#F59E0B']} style={styles.statIconAura}>
                      <Ionicons name="person-outline" size={16} color="#FFFFFF" />
                    </LinearGradient>
                    <Text style={styles.statValue} numberOfLines={1}>
                      {userLabel}
                    </Text>
                    <Text style={styles.statLabel}>You</Text>
                  </View>
                </GlassSurface>
              </Animated.View>
            </View>

            <Animated.View entering={FadeInUp.delay(220).duration(520)}>
              <GlassSurface style={styles.composerCard}>
                <LinearGradient
                  colors={['rgba(42,250,223,0.22)', 'rgba(76,131,255,0.08)', 'rgba(0,0,0,0)']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={[styles.composerAccent, { pointerEvents: 'none' }]}
                />
                <View style={styles.composerHeaderRow}>
                  <Text style={styles.composerTitle}>Post</Text>
                  {!isBadWordsConfigured ? (
                    <GlassSurface style={styles.moderationChip}>
                      <Ionicons name="shield-checkmark-outline" size={14} color="#D4B66E" />
                      <Text style={styles.moderationHint}>Local filter on</Text>
                    </GlassSurface>
                  ) : null}
                </View>

                {feedError ? <Text style={styles.errorText}>{feedError}</Text> : null}

                <GlassSurface style={styles.inputShell}>
                  <TextInput
                    value={postTopic}
                    onChangeText={setPostTopic}
                    placeholder="Topic"
                    placeholderTextColor="#75757C"
                    style={styles.topicInput}
                  />
                </GlassSurface>
                <GlassSurface style={styles.textAreaShell}>
                  <TextInput
                    value={postText}
                    onChangeText={setPostText}
                    placeholder="Share something..."
                    placeholderTextColor="#75757C"
                    style={styles.postInput}
                    multiline
                  />
                </GlassSurface>
                <GlassSurface style={styles.inputShell}>
                  <TextInput
                    value={postMediaInput}
                    onChangeText={setPostMediaInput}
                    placeholder="Paste Tenor embed/link, GIF, image, or audio link (optional)"
                    placeholderTextColor="#75757C"
                    style={styles.mediaInput}
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                </GlassSurface>

                <View style={styles.voiceCaptureRow}>
                  <AnimatedPressable
                    style={styles.voiceCaptureWrap}
                    onPressIn={startVoiceCapture}
                    onPressOut={stopVoiceCapture}
                  >
                    <GlassSurface
                      style={[
                        styles.secondaryButton,
                        (isRecordingVoice || voiceRecorderState.isRecording) && styles.voiceCaptureActive,
                      ]}
                    >
                      <View style={styles.secondaryButtonInner}>
                        <Ionicons
                          name={(isRecordingVoice || voiceRecorderState.isRecording) ? 'radio-button-on' : 'mic'}
                          size={18}
                          color={(isRecordingVoice || voiceRecorderState.isRecording) ? '#FF7A7A' : '#FFFFFF'}
                        />
                        <Text style={styles.secondaryButtonText}>
                          {(isRecordingVoice || voiceRecorderState.isRecording)
                            ? `Recording ${recordingDurationLabel}`
                            : 'Hold to talk'}
                        </Text>
                      </View>
                    </GlassSurface>
                  </AnimatedPressable>
                </View>

                {voiceError ? <Text style={styles.voiceErrorText}>{voiceError}</Text> : null}

                {recordedVoiceNote ? (
                  <GlassSurface style={styles.voiceAttachmentCard}>
                    <View style={styles.voiceAttachmentInner}>
                      <View style={styles.voiceAttachmentMeta}>
                        <Ionicons name="mic" size={18} color="#9AC6FF" />
                        <View>
                          <Text style={styles.voiceAttachmentTitle}>Voice note ready</Text>
                          <Text style={styles.voiceAttachmentSubtitle}>
                            Duration {formatDurationLabel(recordedVoiceNote.durationMs)}
                          </Text>
                        </View>
                      </View>
                      <AnimatedPressable onPress={removeVoiceAttachment} style={styles.voiceAttachmentRemoveWrap}>
                        <GlassSurface style={styles.voiceAttachmentRemove}>
                          <Ionicons name="trash-outline" size={16} color="#FF9B9B" />
                        </GlassSurface>
                      </AnimatedPressable>
                    </View>
                  </GlassSurface>
                ) : null}

                {selectedImage?.uri ? (
                  <Image source={{ uri: selectedImage.uri }} style={styles.selectedImagePreview} />
                ) : null}

                <View style={styles.composerActions}>
                  <AnimatedPressable style={styles.secondaryButtonWrap} onPress={pickImage}>
                    <GlassSurface style={styles.secondaryButton}>
                      <View style={styles.secondaryButtonInner}>
                        <Ionicons name="image-outline" size={18} color="#FFFFFF" />
                        <Text style={styles.secondaryButtonText}>
                          {selectedImage?.uri ? 'Change image' : 'Add image'}
                        </Text>
                      </View>
                    </GlassSurface>
                  </AnimatedPressable>

                  <NeonGlowButton
                    style={styles.primaryButtonWrap}
                    onPress={submitPost}
                    iconName="paper-plane-outline"
                    label={submittingPost ? 'Posting...' : 'Post'}
                    disabled={
                      (!postText.trim() && !selectedImage?.dataUri && !postMediaInput.trim() && !recordedVoiceNote?.uri) ||
                      submittingPost
                    }
                  />
                </View>
              </GlassSurface>
            </Animated.View>
          </View>
        )}
        ListEmptyComponent={
          loadingFeed ? (
            <CommunityLoadingState />
          ) : (
            <GlassSurface style={styles.emptyState}>
              <View style={styles.emptyStateInner}>
                <Text style={styles.emptyTitle}>No community posts yet</Text>
                <Text style={styles.emptyBody}>Start the first discussion.</Text>
              </View>
            </GlassSurface>
          )
        }
        showsVerticalScrollIndicator={false}
      />

    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  content: {
    paddingTop: 58,
    paddingBottom: 40,
    paddingHorizontal: 16,
  },
  loadingWrap: {
    paddingBottom: 24,
  },
  header: {
    marginBottom: 18,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 32,
    fontWeight: '800',
    letterSpacing: 0.4,
  },
  heroCaption: {
    color: '#9DA3B4',
    marginTop: 8,
    fontSize: 14,
    lineHeight: 21,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 18,
  },
  statCardWrap: {
    flex: 1,
  },
  statCard: {
    flex: 1,
    borderRadius: 8,
  },
  statInner: {
    minHeight: 104,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
    paddingVertical: 16,
  },
  statIconAura: {
    width: 38,
    height: 38,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  statValue: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
    textAlign: 'center',
  },
  statLabel: {
    color: '#8F97AA',
    fontSize: 12,
    marginTop: 6,
    textTransform: 'uppercase',
    letterSpacing: 0,
  },
  statSkeletonInner: {
    minHeight: 104,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  statSkeletonIcon: {
    width: 34,
    height: 34,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  statSkeletonValue: {
    width: 52,
    height: 12,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  composerCard: {
    borderRadius: 8,
    marginBottom: 18,
  },
  composerAccent: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 8,
  },
  composerHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 16,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  composerTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '800',
  },
  moderationHint: {
    color: '#D4B66E',
    fontSize: 12,
  },
  moderationChip: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  errorText: {
    color: '#FF8E8E',
    marginBottom: 12,
    lineHeight: 20,
    paddingHorizontal: 16,
  },
  inputShell: {
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 8,
  },
  textAreaShell: {
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 8,
  },
  topicInput: {
    color: '#FFFFFF',
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: 'transparent',
  },
  postInput: {
    minHeight: 112,
    color: '#FFFFFF',
    paddingHorizontal: 14,
    paddingVertical: 14,
    textAlignVertical: 'top',
    backgroundColor: 'transparent',
  },
  mediaInput: {
    color: '#FFFFFF',
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: 'transparent',
  },
  voiceCaptureRow: {
    marginHorizontal: 16,
    marginTop: 2,
  },
  voiceCaptureWrap: {
    width: '100%',
  },
  voiceCaptureActive: {
    borderWidth: 1,
    borderColor: 'rgba(255,122,122,0.44)',
  },
  voiceErrorText: {
    color: '#FF9B9B',
    marginTop: 8,
    marginHorizontal: 16,
    lineHeight: 19,
  },
  voiceAttachmentCard: {
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 8,
  },
  voiceAttachmentInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  voiceAttachmentMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  voiceAttachmentTitle: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
  voiceAttachmentSubtitle: {
    marginTop: 4,
    color: '#A9B4CA',
    fontSize: 12,
  },
  voiceAttachmentRemoveWrap: {
    width: 34,
    height: 34,
  },
  voiceAttachmentRemove: {
    width: 34,
    height: 34,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectedImagePreview: {
    alignSelf: 'stretch',
    height: 190,
    borderRadius: 8,
    marginTop: 14,
    marginHorizontal: 16,
  },
  composerActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 16,
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  secondaryButtonWrap: {
    flex: 1,
  },
  primaryButtonWrap: {
    flex: 1,
  },
  secondaryButton: {
    borderRadius: 8,
  },
  secondaryButtonInner: {
    minHeight: 52,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    marginLeft: 8,
  },
  composerLoadingInner: {
    padding: 16,
    gap: 12,
  },
  topicSkeleton: {
    width: '36%',
    height: 16,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  composerLineLong: {
    width: '100%',
    height: 52,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  composerLineShort: {
    width: '100%',
    height: 48,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  composerActionRow: {
    flexDirection: 'row',
    gap: 12,
  },
  composerActionGhost: {
    flex: 1,
    height: 52,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  composerActionGhostPrimary: {
    flex: 1,
    height: 52,
    borderRadius: 8,
    backgroundColor: 'rgba(74,144,255,0.2)',
  },
  postItemWrap: {
    marginBottom: 14,
  },
  postCard: {
    borderRadius: 8,
  },
  postTopAccent: {
    height: 1.5,
    width: '100%',
  },
  postInner: {
    padding: 16,
  },
  postHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  authorBlock: {
    flex: 1,
  },
  author: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
  },
  handle: {
    marginTop: 4,
    fontSize: 12,
  },
  interactionIndicator: {
    borderRadius: 8,
    width: 30,
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  interactionIndicatorDot: {
    width: 10,
    height: 10,
    borderRadius: 8,
  },
  topicRow: {
    alignItems: 'flex-start',
    marginTop: 12,
  },
  topicPill: {
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
    minHeight: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  topicPillText: {
    fontSize: 12,
    fontWeight: '700',
    textAlign: 'center',
    letterSpacing: 0.4,
  },
  postText: {
    color: '#E5E7EE',
    marginTop: 14,
    lineHeight: 22,
  },
  mediaWrap: {
    marginTop: 14,
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#ffffff22',
    backgroundColor: 'rgba(255,255,255,0.03)',
  },
  postImage: {
    width: '100%',
    height: 232,
  },
  mediaTypeChip: {
    position: 'absolute',
    top: 12,
    right: 12,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  mediaTypeChipText: {
    fontSize: 11,
    fontWeight: '800',
  },
  tenorShell: {
    width: '100%',
    marginTop: 14,
    borderRadius: 8,
    overflow: 'hidden',
  },
  tenorFrame: {
    width: '100%',
    height: '100%',
    borderWidth: 0,
    backgroundColor: 'transparent',
  },
  tenorWebView: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  audioCard: {
    marginTop: 14,
  },
  audioCardSurface: {
    borderRadius: 8,
  },
  audioCardInner: {
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  audioIconWrap: {
    width: 42,
    height: 42,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  audioMeta: {
    flex: 1,
  },
  audioTitle: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
  audioHint: {
    marginTop: 4,
    fontSize: 12,
  },
  postActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 14,
    marginTop: 16,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: '#ffffff14',
  },
  postActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  postActionIcon: {
    width: 30,
    height: 30,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  postActionText: {
    color: '#FFFFFF',
    fontWeight: '700',
    marginLeft: 8,
  },
  commentsSection: {
    marginTop: 16,
    borderTopWidth: 1,
    paddingTop: 14,
    borderTopColor: '#ffffff14',
  },
  emptyCommentsText: {
    marginBottom: 10,
    lineHeight: 19,
  },
  commentBubble: {
    marginBottom: 10,
    borderRadius: 8,
  },
  commentBubbleInner: {
    padding: 12,
  },
  commentAuthor: {
    color: '#FFFFFF',
    fontWeight: '700',
    marginBottom: 4,
  },
  commentText: {
    color: '#CED3DD',
    lineHeight: 19,
  },
  commentComposer: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
  },
  commentInputShell: {
    flex: 1,
    borderRadius: 8,
  },
  commentInput: {
    flex: 1,
    color: '#FFFFFF',
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: 'transparent',
  },
  commentSendButtonWrap: {
    width: 48,
    height: 48,
  },
  commentSendButton: {
    width: 48,
    height: 48,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyState: {
    borderRadius: 8,
    marginBottom: 10,
  },
  emptyStateInner: {
    alignItems: 'center',
    padding: 22,
  },
  emptyTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '800',
  },
  emptyBody: {
    color: '#9198AA',
    marginTop: 8,
    textAlign: 'center',
    lineHeight: 20,
  },
});

export default CommunityScreen;
