import React, { useEffect, useMemo, useRef, useState } from 'react';
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
import { createAudioPlayer, setAudioModeAsync } from 'expo-audio';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { auth } from '../config/firebase';
import { censorText, isBadWordsConfigured } from '../services/profanity';
import {
  addCommentToPost,
  createCommunityPost,
  formatRelativeTime,
  likeCommunityPost,
  subscribeToCommunityPosts,
} from '../services/community';

const NativeWebView = Platform.OS === 'web' ? null : require('react-native-webview').WebView;
const AUDIO_STATUS_EVENT = 'playbackStatusUpdate';
const IMAGE_URL_PATTERN = /\.(jpg|jpeg|png|webp|avif)(\?.*)?$/i;
const GIF_URL_PATTERN = /\.(gif)(\?.*)?$/i;
const AUDIO_URL_PATTERN = /\.(mp3|wav|m4a|aac|ogg|oga|webm)(\?.*)?$/i;

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

  return { error: 'Use a Tenor, GIF, image, or audio link.' };
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

const CommunityScreen = () => {
  const [posts, setPosts] = useState([]);
  const [postTopic, setPostTopic] = useState('');
  const [postText, setPostText] = useState('');
  const [postMediaInput, setPostMediaInput] = useState('');
  const [selectedImage, setSelectedImage] = useState(null);
  const [commentDrafts, setCommentDrafts] = useState({});
  const [expandedPosts, setExpandedPosts] = useState({});
  const [submittingPost, setSubmittingPost] = useState(false);
  const [loadingFeed, setLoadingFeed] = useState(true);
  const [feedError, setFeedError] = useState('');
  const [activeAudioPostId, setActiveAudioPostId] = useState(null);
  const audioPlayerRef = useRef(null);
  const audioSubscriptionRef = useRef(null);
  const activeAudioPostIdRef = useRef(null);

  const userLabel =
    auth?.currentUser?.displayName ||
    auth?.currentUser?.email?.split('@')[0] ||
    'MovieMate';

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
    },
    [],
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

  const pickImage = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
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
      setPostMediaInput('');
      setFeedError('');
    }
  };

  const submitPost = async () => {
    const trimmedText = postText.trim();
    const trimmedMediaInput = postMediaInput.trim();
    const hasSelectedImage = Boolean(selectedImage?.dataUri);
    const hasLinkAttachment = Boolean(trimmedMediaInput);

    if ((!trimmedText && !hasSelectedImage && !hasLinkAttachment) || submittingPost) {
      return;
    }

    const attachment =
      !hasSelectedImage && hasLinkAttachment ? getMediaAttachmentFromInput(trimmedMediaInput) : null;

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

      await createCommunityPost({
        author: userLabel,
        handle: `@${userLabel.toLowerCase().replace(/\s+/g, '')}`,
        topic: censoredTopic,
        text: censoredPostText,
        imageData: selectedImage?.dataUri || null,
        mediaUrl: attachment?.mediaUrl || null,
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
      setFeedError('');
    } catch (error) {
      console.error('Unable to create community post:', error);
      setFeedError(
        error?.code === 'permission-denied'
          ? 'Posting is blocked by Firestore rules.'
          : 'Unable to publish your post right now.',
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

  const renderMediaAttachment = (item, theme) => {
    if (item.mediaType === 'audio' && item.mediaUrl) {
      const isPlaying = activeAudioPostId === item.id;

      return (
        <TouchableOpacity
          style={[
            styles.audioCard,
            {
              backgroundColor: theme.surface,
              borderColor: theme.border,
            },
          ]}
          onPress={() => toggleAudioPost(item)}
        >
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
        </TouchableOpacity>
      );
    }

    const tenorEmbed = buildTenorEmbedFromPost(item);
    if (tenorEmbed) {
      const aspectRatio = Number(tenorEmbed.aspectRatio) || 1.15;
      const tenorEmbedHtml = buildTenorEmbedHtml(tenorEmbed);

      return (
        <View style={[styles.tenorShell, { aspectRatio }]}>
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
        </View>
      );
    }

    if (item.mediaUrl || item.imageUri) {
      const mediaUri = item.mediaUrl || item.imageUri;

      return (
        <View>
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

  const renderPost = ({ item }) => {
    const isExpanded = expandedPosts[item.id];
    const theme = getPostTheme(item);

    return (
      <View
        style={[
          styles.postCard,
          {
            backgroundColor: theme.card,
            borderColor: theme.border,
          },
        ]}
      >
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
          <View
            style={[
              styles.topicPill,
              {
                backgroundColor: theme.surface,
                borderColor: theme.border,
              },
            ]}
          >
            <Text style={[styles.topicPillText, { color: theme.accent }]}>{item.topic}</Text>
          </View>
        </View>

        {item.text ? <Text style={styles.postText}>{item.text}</Text> : null}
        {renderMediaAttachment(item, theme)}

        <View style={[styles.postActions, { borderTopColor: theme.border }]}>
          <TouchableOpacity
            style={styles.postActionButton}
            onPress={async () => {
              try {
                await likeCommunityPost(item.id);
              } catch (error) {
                console.error('Unable to like post:', error);
                setFeedError(
                  error?.code === 'permission-denied'
                    ? 'Liking is blocked by Firestore rules.'
                    : 'Unable to like this post right now.',
                );
              }
            }}
          >
            <View style={[styles.postActionIcon, { backgroundColor: theme.accentSoft }]}>
              <Ionicons name="heart" size={16} color={theme.accent} />
            </View>
            <Text style={styles.postActionText}>{item.likes}</Text>
          </TouchableOpacity>

          <TouchableOpacity
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
          </TouchableOpacity>
        </View>

        {isExpanded ? (
          <View style={[styles.commentsSection, { borderTopColor: theme.border }]}>
            {item.comments.map((comment) => (
              <View
                key={comment.id}
                style={[
                  styles.commentBubble,
                  {
                    backgroundColor: theme.surface,
                    borderColor: theme.border,
                  },
                ]}
              >
                <Text style={styles.commentAuthor}>{comment.author}</Text>
                <Text style={styles.commentText}>{comment.text}</Text>
              </View>
            ))}

            <View style={styles.commentComposer}>
              <TextInput
                value={commentDrafts[item.id] || ''}
                onChangeText={(value) =>
                  setCommentDrafts((current) => ({
                    ...current,
                    [item.id]: value,
                  }))
                }
                placeholder="Join the discussion"
                placeholderTextColor="#75757C"
                style={[styles.commentInput, { backgroundColor: theme.surface }]}
              />
              <TouchableOpacity
                style={[styles.commentSendButton, { backgroundColor: theme.accent }]}
                onPress={() => submitComment(item.id)}
              >
                <Ionicons name="send" size={16} color="#09090B" />
              </TouchableOpacity>
            </View>
          </View>
        ) : null}
      </View>
    );
  };

  return (
    <FlatList
      style={styles.container}
      contentContainerStyle={styles.content}
      data={posts}
      renderItem={renderPost}
      keyExtractor={(item) => item.id}
      ListHeaderComponent={
        <ScrollView scrollEnabled={false}>
          <View style={styles.header}>
            <Text style={styles.title}>Community</Text>
            <Text style={styles.subtitle}>Reactions shape the mood of each post.</Text>
          </View>

          <View style={styles.statsRow}>
            <View style={styles.statCard}>
              <Ionicons name="albums-outline" size={18} color="#FFFFFF" />
              <Text style={styles.statValue}>{posts.length}</Text>
            </View>
            <View style={styles.statCard}>
              <Ionicons name="chatbubble-ellipses-outline" size={18} color="#FFFFFF" />
              <Text style={styles.statValue}>{totalComments}</Text>
            </View>
            <View style={styles.statCard}>
              <Ionicons name="person-outline" size={18} color="#FFFFFF" />
              <Text style={styles.statValue} numberOfLines={1}>
                {userLabel}
              </Text>
            </View>
          </View>

          <View style={styles.composerCard}>
            <View style={styles.composerHeaderRow}>
              <Text style={styles.composerTitle}>Post</Text>
              {!isBadWordsConfigured ? (
                <View style={styles.moderationChip}>
                  <Ionicons name="shield-checkmark-outline" size={14} color="#D4B66E" />
                  <Text style={styles.moderationHint}>Local filter on</Text>
                </View>
              ) : null}
            </View>

            {feedError ? <Text style={styles.errorText}>{feedError}</Text> : null}

            <TextInput
              value={postTopic}
              onChangeText={setPostTopic}
              placeholder="Topic"
              placeholderTextColor="#75757C"
              style={styles.topicInput}
            />
            <TextInput
              value={postText}
              onChangeText={setPostText}
              placeholder="Share something..."
              placeholderTextColor="#75757C"
              style={styles.postInput}
              multiline
            />
            <TextInput
              value={postMediaInput}
              onChangeText={setPostMediaInput}
              placeholder="Tenor, GIF, image, or audio link"
              placeholderTextColor="#75757C"
              style={styles.mediaInput}
              autoCapitalize="none"
              autoCorrect={false}
            />

            <View style={styles.mediaHintRow}>
              <View style={styles.mediaHintChip}>
                <Ionicons name="sparkles-outline" size={14} color="#9AC6FF" />
                <Text style={styles.mediaHintText}>Tenor</Text>
              </View>
              <View style={styles.mediaHintChip}>
                <Ionicons name="image-outline" size={14} color="#A8FFCC" />
                <Text style={styles.mediaHintText}>GIF</Text>
              </View>
              <View style={styles.mediaHintChip}>
                <Ionicons name="musical-notes-outline" size={14} color="#FFB6B6" />
                <Text style={styles.mediaHintText}>Sound</Text>
              </View>
            </View>

            {selectedImage?.uri ? (
              <Image source={{ uri: selectedImage.uri }} style={styles.selectedImagePreview} />
            ) : null}

            <View style={styles.composerActions}>
              <TouchableOpacity style={styles.secondaryButton} onPress={pickImage}>
                <Ionicons name="image-outline" size={18} color="#FFFFFF" />
                <Text style={styles.secondaryButtonText}>
                  {selectedImage?.uri ? 'Change image' : 'Add image'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.primaryButton,
                  (!postText.trim() && !selectedImage?.dataUri && !postMediaInput.trim() || submittingPost) &&
                    styles.primaryButtonDisabled,
                ]}
                onPress={submitPost}
                disabled={
                  (!postText.trim() && !selectedImage?.dataUri && !postMediaInput.trim()) ||
                  submittingPost
                }
              >
                <Ionicons name="paper-plane-outline" size={18} color="#FFFFFF" />
                <Text style={styles.primaryButtonText}>
                  {submittingPost ? 'Posting...' : 'Post'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      }
      ListEmptyComponent={
        loadingFeed ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>Loading community...</Text>
          </View>
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>No community posts yet</Text>
          </View>
        )
      }
      showsVerticalScrollIndicator={false}
    />
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#050505',
  },
  content: {
    paddingTop: 58,
    paddingBottom: 36,
    paddingHorizontal: 16,
    gap: 14,
  },
  header: {
    marginBottom: 18,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 30,
    fontWeight: '800',
  },
  subtitle: {
    color: '#8C8E95',
    marginTop: 8,
    fontSize: 14,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 18,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#121214',
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    alignItems: 'center',
    gap: 8,
  },
  statValue: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
  },
  composerCard: {
    backgroundColor: '#111113',
    borderRadius: 24,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.07)',
    marginBottom: 18,
  },
  composerHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 14,
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
    backgroundColor: 'rgba(212,182,110,0.1)',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  topicInput: {
    backgroundColor: '#18181C',
    borderRadius: 14,
    color: '#FFFFFF',
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 12,
  },
  postInput: {
    minHeight: 112,
    backgroundColor: '#18181C',
    borderRadius: 18,
    color: '#FFFFFF',
    paddingHorizontal: 14,
    paddingVertical: 14,
    textAlignVertical: 'top',
  },
  mediaInput: {
    backgroundColor: '#18181C',
    borderRadius: 14,
    color: '#FFFFFF',
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginTop: 12,
  },
  mediaHintRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 12,
  },
  mediaHintChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: '#18181C',
  },
  mediaHintText: {
    color: '#D7D7DC',
    fontSize: 12,
    fontWeight: '700',
  },
  selectedImagePreview: {
    width: '100%',
    height: 190,
    borderRadius: 18,
    marginTop: 14,
  },
  composerActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
    marginTop: 14,
  },
  secondaryButton: {
    flex: 1,
    height: 48,
    borderRadius: 14,
    backgroundColor: '#1A1A1F',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  secondaryButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    marginLeft: 8,
  },
  primaryButton: {
    flex: 1,
    height: 48,
    borderRadius: 14,
    backgroundColor: '#E50914',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  primaryButtonDisabled: {
    backgroundColor: '#37373C',
  },
  errorText: {
    color: '#FF8E8E',
    marginBottom: 12,
    lineHeight: 20,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    marginLeft: 8,
  },
  postCard: {
    borderRadius: 24,
    padding: 16,
    borderWidth: 1,
    marginBottom: 14,
  },
  postHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  authorBlock: {
    flex: 1,
  },
  topicRow: {
    alignItems: 'center',
    marginTop: 12,
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
    borderRadius: 999,
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  interactionIndicatorDot: {
    width: 10,
    height: 10,
    borderRadius: 999,
  },
  topicPill: {
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderWidth: 1,
    minHeight: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  topicPillText: {
    fontSize: 12,
    fontWeight: '700',
    textAlign: 'center',
  },
  postText: {
    color: '#ECECEF',
    marginTop: 14,
    lineHeight: 21,
  },
  postImage: {
    width: '100%',
    height: 232,
    borderRadius: 18,
    marginTop: 14,
  },
  mediaTypeChip: {
    position: 'absolute',
    top: 24,
    right: 10,
    borderRadius: 999,
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
    borderRadius: 18,
    overflow: 'hidden',
    backgroundColor: '#0F1012',
  },
  tenorFrame: {
    width: '100%',
    height: '100%',
    borderWidth: 0,
    backgroundColor: '#0F1012',
  },
  tenorWebView: {
    flex: 1,
    backgroundColor: '#0F1012',
  },
  audioCard: {
    marginTop: 14,
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  audioIconWrap: {
    width: 42,
    height: 42,
    borderRadius: 999,
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
    gap: 18,
    marginTop: 14,
    paddingTop: 14,
    borderTopWidth: 1,
  },
  postActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  postActionIcon: {
    width: 30,
    height: 30,
    borderRadius: 999,
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
  },
  commentBubble: {
    borderRadius: 16,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
  },
  commentAuthor: {
    color: '#FFFFFF',
    fontWeight: '700',
    marginBottom: 4,
  },
  commentText: {
    color: '#C8C8CD',
    lineHeight: 19,
  },
  commentComposer: {
    flexDirection: 'row',
    gap: 10,
  },
  commentInput: {
    flex: 1,
    borderRadius: 14,
    color: '#FFFFFF',
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  commentSendButton: {
    width: 46,
    height: 46,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyState: {
    backgroundColor: '#111113',
    borderRadius: 22,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.07)',
    alignItems: 'center',
    marginBottom: 10,
  },
  emptyTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '800',
  },
});

export default CommunityScreen;
