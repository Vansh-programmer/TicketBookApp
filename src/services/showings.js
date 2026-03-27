import {
  doc,
  onSnapshot,
} from 'firebase/firestore';
import { db } from '../config/firebase';

const sanitizeSegment = (value) =>
  String(value || 'unknown')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

export const buildShowingId = ({ movieId, date, time, theater }) =>
  [
    sanitizeSegment(movieId),
    sanitizeSegment(date),
    sanitizeSegment(time),
    sanitizeSegment(theater),
  ].join('_');

export const subscribeToShowing = (showingId, onData, onError) => {
  const showingRef = doc(db, 'showings', showingId);

  return onSnapshot(
    showingRef,
    (snapshot) => {
      const data = snapshot.exists() ? snapshot.data() : {};

      onData({
        id: snapshot.id,
        ...data,
        bookedSeats: Array.isArray(data.bookedSeats) ? data.bookedSeats : [],
      });
    },
    onError,
  );
};
