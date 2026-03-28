import React, { useEffect, useMemo, useState } from 'react';
import {
  FlatList,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { auth } from '../config/firebase';
import {
  addCommentToPost,
  createCommunityPost,
  formatRelativeTime,
  likeCommunityPost,
  subscribeToCommunityPosts,
} from '../services/community';

const CommunityScreen = () => {
  const [posts, setPosts] = useState([]);
  const [postTopic, setPostTopic] = useState('');
  const [postText, setPostText] = useState('');
  const [selectedImage, setSelectedImage] = useState(null);
  const [commentDrafts, setCommentDrafts] = useState({});
  const [expandedPosts, setExpandedPosts] = useState({});
  const [submittingPost, setSubmittingPost] = useState(false);
  const [loadingFeed, setLoadingFeed] = useState(true);
  const [feedError, setFeedError] = useState('');

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

  const totalComments = useMemo(
    () => posts.reduce((count, post) => count + post.comments.length, 0),
    [posts],
  );

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
    }
  };

  const submitPost = async () => {
    if (!postText.trim() || submittingPost) {
      return;
    }

    setSubmittingPost(true);

    try {
      await createCommunityPost({
        author: userLabel,
        handle: `@${userLabel.toLowerCase().replace(/\s+/g, '')}`,
        topic: postTopic,
        text: postText,
        imageData: selectedImage?.dataUri || null,
      });

      setPostTopic('');
      setPostText('');
      setSelectedImage(null);
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
      await addCommentToPost(postId, userLabel, draft);
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

  const renderPost = ({ item }) => {
    const isExpanded = expandedPosts[item.id];

    return (
      <View style={styles.postCard}>
        <View style={styles.postHeader}>
          <View>
            <Text style={styles.author}>{item.author}</Text>
            <Text style={styles.handle}>
              {item.handle} • {formatRelativeTime(item.createdAtMs)}
            </Text>
          </View>
          <View style={styles.topicPill}>
            <Text style={styles.topicPillText}>{item.topic}</Text>
          </View>
        </View>

        <Text style={styles.postText}>{item.text}</Text>

        {item.imageUri ? (
          <Image source={{ uri: item.imageUri }} style={styles.postImage} resizeMode="cover" />
        ) : null}

        <View style={styles.postActions}>
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
            <Ionicons name="heart-outline" size={18} color="#FFFFFF" />
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
            <Ionicons name="chatbubble-ellipses-outline" size={18} color="#FFFFFF" />
            <Text style={styles.postActionText}>{item.comments.length}</Text>
          </TouchableOpacity>
        </View>

        {isExpanded ? (
          <View style={styles.commentsSection}>
            {item.comments.map((comment) => (
              <View key={comment.id} style={styles.commentBubble}>
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
                style={styles.commentInput}
              />
              <TouchableOpacity style={styles.commentSendButton} onPress={() => submitComment(item.id)}>
                <Ionicons name="send" size={16} color="#FFFFFF" />
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
            <Text style={styles.subtitle}>
              Share reactions, post images, and keep the conversation going after the credits roll.
            </Text>
          </View>

          <View style={styles.statsRow}>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{posts.length}</Text>
              <Text style={styles.statLabel}>Posts</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{totalComments}</Text>
              <Text style={styles.statLabel}>Replies</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{userLabel}</Text>
              <Text style={styles.statLabel}>Posting as</Text>
            </View>
          </View>

          <View style={styles.composerCard}>
            <Text style={styles.composerTitle}>Start a discussion</Text>
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
              placeholder="What are you watching, booking, or recommending?"
              placeholderTextColor="#75757C"
              style={styles.postInput}
              multiline
            />

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
                  (!postText.trim() || submittingPost) && styles.primaryButtonDisabled,
                ]}
                onPress={submitPost}
                disabled={!postText.trim() || submittingPost}
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
            <Text style={styles.emptyText}>
              Be the first one to post from this shared feed.
            </Text>
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
    color: '#B5B5BA',
    marginTop: 8,
    lineHeight: 21,
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
  },
  statValue: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
  },
  statLabel: {
    color: '#8A8A92',
    fontSize: 12,
    marginTop: 8,
  },
  composerCard: {
    backgroundColor: '#111113',
    borderRadius: 24,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.07)',
    marginBottom: 18,
  },
  composerTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 14,
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
    minHeight: 120,
    backgroundColor: '#18181C',
    borderRadius: 18,
    color: '#FFFFFF',
    paddingHorizontal: 14,
    paddingVertical: 14,
    textAlignVertical: 'top',
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
    backgroundColor: '#111113',
    borderRadius: 22,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.07)',
    marginBottom: 14,
  },
  postHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  author: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
  },
  handle: {
    color: '#8E8E95',
    marginTop: 4,
    fontSize: 12,
  },
  topicPill: {
    borderRadius: 999,
    backgroundColor: 'rgba(229,9,20,0.14)',
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  topicPillText: {
    color: '#FF6B72',
    fontSize: 11,
    fontWeight: '700',
  },
  postText: {
    color: '#ECECEF',
    marginTop: 14,
    lineHeight: 21,
  },
  postImage: {
    width: '100%',
    height: 220,
    borderRadius: 18,
    marginTop: 14,
  },
  postActions: {
    flexDirection: 'row',
    gap: 18,
    marginTop: 14,
  },
  postActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  postActionText: {
    color: '#FFFFFF',
    fontWeight: '700',
    marginLeft: 8,
  },
  commentsSection: {
    marginTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.06)',
    paddingTop: 14,
  },
  commentBubble: {
    backgroundColor: '#18181C',
    borderRadius: 16,
    padding: 12,
    marginBottom: 10,
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
    backgroundColor: '#18181C',
    borderRadius: 14,
    color: '#FFFFFF',
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  commentSendButton: {
    width: 46,
    height: 46,
    borderRadius: 14,
    backgroundColor: '#E50914',
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
  emptyText: {
    color: '#9C9CA4',
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 20,
  },
});

export default CommunityScreen;
