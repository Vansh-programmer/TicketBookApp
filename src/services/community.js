import {
  addDoc,
  arrayUnion,
  collection,
  doc,
  increment,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
} from 'firebase/firestore';
import { db } from '../config/firebase';

const COMMUNITY_POSTS_COLLECTION = 'communityPosts';

const normalizeComment = (comment) => ({
  id: comment.id,
  author: comment.author,
  text: comment.text,
  createdAtMs: comment.createdAtMs || Date.now(),
});

const normalizePost = (docSnapshot) => {
  const data = docSnapshot.data();

  return {
    id: docSnapshot.id,
    author: data.author || 'MovieMate',
    handle: data.handle || '@moviemate',
    topic: data.topic || 'Movie chat',
    text: data.text || '',
    imageUri: data.imageUri || null,
    likes: typeof data.likes === 'number' ? data.likes : 0,
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
  author,
  handle,
  topic,
  text,
  imageData,
}) => {
  if (!db) {
    const error = new Error('Firebase is not configured for this build.');
    error.code = 'firebase/not-configured';
    throw error;
  }

  const createdAtMs = Date.now();

  await addDoc(collection(db, COMMUNITY_POSTS_COLLECTION), {
    author,
    handle,
    topic: topic?.trim() || 'Movie chat',
    text: text.trim(),
    imageUri: imageData || null,
    likes: 0,
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

export const likeCommunityPost = async (postId) => {
  if (!db) {
    const error = new Error('Firebase is not configured for this build.');
    error.code = 'firebase/not-configured';
    throw error;
  }

  await updateDoc(doc(db, COMMUNITY_POSTS_COLLECTION, postId), {
    likes: increment(1),
  });
};
