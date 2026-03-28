import {
  collection,
  doc,
  onSnapshot,
  query,
  runTransaction,
  serverTimestamp,
  where,
} from 'firebase/firestore';
import { db } from '../config/firebase';

const BOOKINGS_COLLECTION = 'bookings';
const SHOWINGS_COLLECTION = 'showings';

const parseShowDateValue = (date) => {
  const value = new Date(date).getTime();
  return Number.isNaN(value) ? Date.now() : value;
};

export const reserveSeatsAndCreateBooking = async ({
  userId,
  movieId,
  movieTitle,
  moviePoster,
  date,
  time,
  theater,
  city,
  state,
  seats,
  showingId,
  priceDetails,
  theaterFormats,
}) => {
  if (!db) {
    const error = new Error('Firebase is not configured for this build.');
    error.code = 'firebase/not-configured';
    throw error;
  }

  const showingRef = doc(db, SHOWINGS_COLLECTION, showingId);
  const bookingRef = doc(collection(db, BOOKINGS_COLLECTION));
  const ticketId = `TKT-${bookingRef.id.slice(0, 8).toUpperCase()}`;

  await runTransaction(db, async (transaction) => {
    const showingSnapshot = await transaction.get(showingRef);
    const currentShowingData = showingSnapshot.exists() ? showingSnapshot.data() : {};
    const currentBookedSeats = Array.isArray(currentShowingData.bookedSeats)
      ? currentShowingData.bookedSeats
      : [];

    const alreadyBookedSeats = seats.filter((seat) => currentBookedSeats.includes(seat));

    if (alreadyBookedSeats.length > 0) {
      const error = new Error(`Seats already taken: ${alreadyBookedSeats.join(', ')}`);
      error.code = 'showing/seats-unavailable';
      throw error;
    }

    const nextBookedSeats = [...new Set([...currentBookedSeats, ...seats])];

    transaction.set(
      showingRef,
      {
        movieId,
        movieTitle,
        date,
        time,
        theater,
        city,
        state,
        bookedSeats: nextBookedSeats,
        lastBookedBy: userId,
        updatedAt: serverTimestamp(),
        createdAt: currentShowingData.createdAt || serverTimestamp(),
      },
      { merge: true },
    );

    transaction.set(bookingRef, {
      userId,
      movieId,
      movieTitle,
      moviePoster: moviePoster || null,
      date,
      time,
      theater,
      city,
      state,
      seats,
      showingId,
      priceDetails: priceDetails || null,
      theaterFormats: theaterFormats || [],
      ticketId,
      showDateValue: parseShowDateValue(date),
      createdAt: serverTimestamp(),
    });
  });

  return {
    bookingId: bookingRef.id,
    ticketId,
  };
};

export const getBookingErrorMessage = (error) => {
  if (error?.code === 'showing/seats-unavailable') {
    return error.message;
  }

  if (error?.code === 'permission-denied') {
    return 'Firestore permission denied. Please update your rules for showings and bookings.';
  }

  if (error?.code === 'failed-precondition') {
    return 'Firestore is not fully set up yet. Please create the database in Firebase Console.';
  }

  if (error?.code === 'firebase/not-configured') {
    return 'This app build is missing Firebase configuration. Please reinstall the latest APK.';
  }

  if (error?.code === 'unavailable') {
    return 'Network issue while booking. Please check your connection and try again.';
  }

  return 'Unable to complete the booking right now. Please try again.';
};

export const subscribeToUserBookings = (userId, onData, onError) => {
  if (!db) {
    onError?.({
      code: 'firebase/not-configured',
      message: 'Firebase is not configured for this build.',
    });
    return () => {};
  }

  const bookingsRef = collection(db, BOOKINGS_COLLECTION);
  const bookingsQuery = query(bookingsRef, where('userId', '==', userId));

  return onSnapshot(
    bookingsQuery,
    (snapshot) => {
      const bookings = snapshot.docs
        .map((docSnapshot) => ({
          id: docSnapshot.id,
          ...docSnapshot.data(),
        }))
        .sort((a, b) => {
          if ((b.showDateValue || 0) !== (a.showDateValue || 0)) {
            return (b.showDateValue || 0) - (a.showDateValue || 0);
          }

          return (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0);
        });

      onData(bookings);
    },
    onError,
  );
};
