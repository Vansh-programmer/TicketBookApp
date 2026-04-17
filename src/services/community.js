import {
  addDoc,
  arrayUnion,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
  runTransaction,
  serverTimestamp,
  updateDoc,
} from 'firebase/firestore';
import { db } from '../config/firebase';

const COMMUNITY_POSTS_COLLECTION = 'communityPosts';

const parseStructuredString = (value) => {
  if (typeof value !== 'string') {
    return value;
  }

  const trimmedValue = value.trim();
  if (!trimmedValue.startsWith('{') && !trimmedValue.startsWith('[')) {
    return value;
  }

  try {
    return JSON.parse(trimmedValue);
  } catch (error) {
    return value;
  }
};

const getDisplayText = (value, fallback = '') => {
  const parsedValue = parseStructuredString(value);

  if (typeof parsedValue === 'string') {
    return parsedValue.trim() || fallback;
  }

  if (typeof parsedValue === 'number' || typeof parsedValue === 'boolean') {
    return String(parsedValue);
  }

  if (Array.isArray(parsedValue)) {
    const nextValue = parsedValue
      .map((entry) => getDisplayText(entry))
      .filter(Boolean)
      .join(' ');

    return nextValue || fallback;
  }

  if (parsedValue && typeof parsedValue === 'object') {
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
      const nextValue = getDisplayText(parsedValue[key]);
      if (nextValue) {
        return nextValue;
      }
    }

    const nextValue = Object.entries(parsedValue)
      .filter(([key]) => !['id', 'author', 'authorId', 'createdAt', 'createdAtMs', 'uid', 'userId'].includes(key))
      .map(([, entry]) => getDisplayText(entry))
      .filter(Boolean)
      .join(' ');

    if (nextValue) {
      return nextValue;
    }
  }

  return fallback;
};

const normalizeComment = (comment) => ({
  id: comment?.id || `comment-${Date.now()}`,
  author: getDisplayText(comment?.author, 'MovieMate'),
  text: getDisplayText(
    comment?.text ??
      comment?.message ??
      comment?.content ??
      comment?.body ??
      comment?.comment ??
      comment?.commentText ??
      comment,
    '',
  ),
  createdAtMs: comment?.createdAtMs || Date.now(),
});

const normalizePost = (docSnapshot) => {
  const data = docSnapshot.data();
  const likedBy = Array.isArray(data.likedBy)
    ? [...new Set(data.likedBy.filter((value) => typeof value === 'string' && value.trim()))]
    : [];

  return {
    id: docSnapshot.id,
    authorId: getDisplayText(data.authorId, ''),
    author: getDisplayText(data.author, 'MovieMate'),
    handle: getDisplayText(data.handle, '@moviemate'),
    topic: getDisplayText(data.topic, 'Movie chat'),
    text: getDisplayText(data.text, ''),
    imageUri: data.imageUri || null,
    mediaUrl: data.mediaUrl || data.imageUri || null,
    mediaType: data.mediaType || (data.imageUri ? 'image' : null),
    mediaLabel: getDisplayText(data.mediaLabel, ''),
    mediaAspectRatio:
      typeof data.mediaAspectRatio === 'number' && Number.isFinite(data.mediaAspectRatio)
        ? data.mediaAspectRatio
        : null,
    tenorPostId: data.tenorPostId || null,
    tenorAspectRatio: data.tenorAspectRatio || null,
    audioTitle: getDisplayText(data.audioTitle, ''),
    voiceNoteUrl: data.voiceNoteUrl || null,
    voiceNoteTitle: getDisplayText(data.voiceNoteTitle, ''),
    likedBy,
    likes: likedBy.length > 0 ? likedBy.length : typeof data.likes === 'number' ? data.likes : 0,
    createdAtMs:
      data.createdAtMs ||
      (data.createdAt?.seconds ? data.createdAt.seconds * 1000 : Date.now()),
    comments: Array.isArray(data.comments)
      ? data.comments.map(normalizeComment).sort((left, right) => left.createdAtMs - right.createdAtMs)
      : [],
  };
};

export const formatRelativeTime = (timestamp) => {
  const diffInMinutes = Math.max(1, Math.floor((Date.now() - timestamp) / (1000 * 60)));

  if (diffInMinutes < 60) {
    return `${diffInMinutes}m ago`;
  }

  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) {
    return `${diffInHours}h ago`;
  }

  const diffInDays = Math.floor(diffInHours / 24);
  return `${diffInDays}d ago`;
};

export const subscribeToCommunityPosts = (onData, onError) => {
  if (!db) {
    onError?.({
      code: 'firebase/not-configured',
      message: 'Firebase is not configured for this build.',
    });
    return () => {};
  }

  const communityPostsRef = collection(db, COMMUNITY_POSTS_COLLECTION);
  const communityPostsQuery = query(communityPostsRef, orderBy('createdAt', 'desc'));

  return onSnapshot(
    communityPostsQuery,
    (snapshot) => {
      onData(snapshot.docs.map(normalizePost));
    },
    onError,
  );
};

export const createCommunityPost = async ({
  authorId,
  author,
  handle,
  topic,
  text,
  imageData,
  mediaUrl,
  mediaType,
  mediaLabel,
  mediaAspectRatio,
  tenorPostId,
  tenorAspectRatio,
  audioTitle,
  voiceNoteUrl,
  voiceNoteTitle,
}) => {
  if (!db) {
    const error = new Error('Firebase is not configured for this build.');
    error.code = 'firebase/not-configured';
    throw error;
  }

  const createdAtMs = Date.now();

  await addDoc(collection(db, COMMUNITY_POSTS_COLLECTION), {
    authorId: authorId?.trim() || '',
    author,
    handle,
    topic: topic?.trim() || 'Movie chat',
    text: text?.trim() || '',
    imageUri: imageData || null,
    mediaUrl: imageData || mediaUrl || null,
    mediaType: imageData ? 'image' : mediaType || null,
    mediaLabel: mediaLabel || '',
    mediaAspectRatio:
      typeof mediaAspectRatio === 'number' && Number.isFinite(mediaAspectRatio)
        ? mediaAspectRatio
        : null,
    tenorPostId: tenorPostId || null,
    tenorAspectRatio: tenorAspectRatio || null,
    audioTitle: audioTitle || '',
    voiceNoteUrl: voiceNoteUrl || null,
    voiceNoteTitle: voiceNoteTitle || '',
    likes: 0,
    likedBy: [],
    comments: [],
    createdAtMs,
    createdAt: serverTimestamp(),
  });
};

export const addCommentToPost = async (postId, author, text) => {
  if (!db) {
    const error = new Error('Firebase is not configured for this build.');
    error.code = 'firebase/not-configured';
    throw error;
  }

  const nextComment = {
    id: `comment-${Date.now()}`,
    author,
    text: text.trim(),
    createdAtMs: Date.now(),
  };

  await updateDoc(doc(db, COMMUNITY_POSTS_COLLECTION, postId), {
    comments: arrayUnion(nextComment),
  });
};

export const deleteCommunityPost = async (postId) => {
  if (!db) {
    const error = new Error('Firebase is not configured for this build.');
    error.code = 'firebase/not-configured';
    throw error;
  }

  await deleteDoc(doc(db, COMMUNITY_POSTS_COLLECTION, postId));
};

export const likeCommunityPost = async (postId, userId) => {
  if (!db) {
    const error = new Error('Firebase is not configured for this build.');
    error.code = 'firebase/not-configured';
    throw error;
  }

  if (!userId?.trim()) {
    const error = new Error('A signed-in user is required to like a post.');
    error.code = 'auth/missing-user';
    throw error;
  }

  const postRef = doc(db, COMMUNITY_POSTS_COLLECTION, postId);

  return runTransaction(db, async (transaction) => {
    const snapshot = await transaction.get(postRef);

    if (!snapshot.exists()) {
      const error = new Error('This post no longer exists.');
      error.code = 'community/post-not-found';
      throw error;
    }

    const data = snapshot.data();
    const likedBy = Array.isArray(data.likedBy)
      ? [...new Set(data.likedBy.filter((value) => typeof value === 'string' && value.trim()))]
      : [];

    if (likedBy.includes(userId)) {
      return { alreadyLiked: true };
    }

    const nextLikedBy = [...likedBy, userId];
    const currentLikes =
      likedBy.length > 0 ? likedBy.length : typeof data.likes === 'number' ? data.likes : 0;

    transaction.update(postRef, {
      likedBy: nextLikedBy,
      likes: currentLikes + 1,
    });

    return { alreadyLiked: false };
  });
};
