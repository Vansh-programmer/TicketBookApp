import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { auth, firebaseConfigError } from '../config/firebase';
import { useToast } from '../components/ToastProvider';
import {
  getBookingErrorMessage,
  reserveSeatsAndCreateBooking,
} from '../services/bookings';
import {
  playSoundEffect,
  SOUND_EFFECT_KEYS,
} from '../services/soundEffects';
import {
  buildShowingId,
  subscribeToShowing,
} from '../services/showings';

const ROW_LABELS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
const SEATS_PER_ROW = 8;
const MAX_SELECTED_SEATS = 8;

const SeatSelectionScreen = ({ navigation, route }) => {
  const [selectedSeats, setSelectedSeats] = useState([]);
  const [bookedSeats, setBookedSeats] = useState([]);
  const [loadingSeats, setLoadingSeats] = useState(true);
  const [bookingInProgress, setBookingInProgress] = useState(false);
  const [screenError, setScreenError] = useState('');
  const { showToast } = useToast();

  const {
    movieId,
    movieTitle = 'Selected Movie',
    location,
    selectedDate,
    showTime = '7:30 PM',
  } = route.params ?? {};

  const showingId = useMemo(
    () =>
      buildShowingId({
        movieId,
        date: selectedDate,
        time: showTime,
        theater: location?.theater,
      }),
    [location?.theater, movieId, selectedDate, showTime],
  );

  const seats = useMemo(
    () =>
      ROW_LABELS.flatMap((rowLabel) =>
        Array.from({ length: SEATS_PER_ROW }, (_, index) => {
          const seatNumber = index + 1;
          const seatId = `${rowLabel}${seatNumber}`;

          return {
            id: seatId,
            rowLabel,
            seatNumber,
          };
        }),
      ),
    [],
  );

  useEffect(() => {
    if (!movieId || !selectedDate || !location?.theater) {
      setScreenError('Missing showing details. Please choose your movie and date again.');
      setLoadingSeats(false);
      return;
    }

    if (!auth) {
      setScreenError(firebaseConfigError || 'Firebase is not configured for this build.');
      setLoadingSeats(false);
      return;
    }

    const unsubscribe = subscribeToShowing(
      showingId,
      (showing) => {
        setBookedSeats(showing.bookedSeats);
        setSelectedSeats((current) =>
          current.filter((seatId) => !showing.bookedSeats.includes(seatId)),
        );
        setScreenError('');
        setLoadingSeats(false);
      },
      (error) => {
        console.error('Error subscribing to showing:', error);
        setScreenError('Unable to load live seat status right now.');
        setLoadingSeats(false);
      },
    );

    return unsubscribe;
  }, [location?.theater, movieId, selectedDate, showingId]);

  const handleSeatTap = (seatId) => {
    if (bookingInProgress || loadingSeats || bookedSeats.includes(seatId)) {
      return;
    }

    setScreenError('');

    if (selectedSeats.includes(seatId)) {
      setSelectedSeats((current) => current.filter((id) => id !== seatId));
      return;
    }

    if (selectedSeats.length >= MAX_SELECTED_SEATS) {
      setScreenError(`You can select up to ${MAX_SELECTED_SEATS} seats per booking.`);
      playSoundEffect(SOUND_EFFECT_KEYS.ERROR);
      showToast(`You can select up to ${MAX_SELECTED_SEATS} seats per booking.`, { type: 'error' });
      return;
    }

    playSoundEffect(SOUND_EFFECT_KEYS.TAP);
    setSelectedSeats((current) => [...current, seatId]);
  };

  const handleProceed = async () => {
    if (selectedSeats.length === 0 || bookingInProgress) {
      return;
    }

    const user = auth?.currentUser;

    if (!user) {
      setScreenError('Please sign in again before booking your seats.');
      playSoundEffect(SOUND_EFFECT_KEYS.ERROR);
      showToast('Please sign in again before booking your seats.', { type: 'error' });
      navigation.replace('Login');
      return;
    }

    setBookingInProgress(true);
    setScreenError('');

    try {
      const booking = await reserveSeatsAndCreateBooking({
        userId: user.uid,
        movieId,
        movieTitle,
        date: selectedDate,
        time: showTime,
        theater: location?.theater,
        city: location?.city,
        state: location?.state,
        seats: selectedSeats,
        showingId,
      });

      playSoundEffect(SOUND_EFFECT_KEYS.SUCCESS);
      showToast('Ticket booked successfully!', { type: 'success' });
      navigation.navigate('DigitalTicket', {
        movieId,
        movieTitle,
        location,
        selectedDate,
        showTime,
        seats: selectedSeats,
        showingId,
        ticketId: booking.ticketId,
        bookingId: booking.bookingId,
      });
    } catch (error) {
      console.error('Error booking seats:', error);
      const errorMessage = getBookingErrorMessage(error);
      setScreenError(errorMessage);
      playSoundEffect(SOUND_EFFECT_KEYS.ERROR);
      showToast(errorMessage, { type: 'error' });
    } finally {
      setBookingInProgress(false);
    }
  };

  const renderScreen = () => (
    <View style={styles.screen}>
      <View style={styles.screenContainer}>
        <View style={styles.screenLine} />
      </View>
    </View>
  );

  const renderSeatGrid = () => (
    <View style={styles.seatContainer}>
      <ScrollView
        contentContainerStyle={styles.gridScroll}
        showsVerticalScrollIndicator={false}
      >
        {seats.map((seat) => {
          const isBooked = bookedSeats.includes(seat.id);
          const isSelected = selectedSeats.includes(seat.id);

          return (
            <TouchableOpacity
              key={seat.id}
              style={[
                styles.seat,
                isBooked && styles.seatBooked,
                isSelected && styles.seatSelected,
              ]}
              onPress={() => handleSeatTap(seat.id)}
              disabled={isBooked || loadingSeats || bookingInProgress}
              activeOpacity={0.7}
            >
              <Ionicons
                name={isBooked ? 'tv-outline' : 'tv'}
                size={20}
                color={isBooked ? 'rgba(255, 255, 255, 0.25)' : isSelected ? '#FFFFFF' : '#050505'}
              />
              <Text
                style={[
                  styles.seatLabel,
                  isBooked && styles.seatLabelBooked,
                  isSelected && styles.seatLabelSelected,
                ]}
              >
                {seat.id}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );

  const renderLegend = () => (
    <View style={styles.legendContainer}>
      <View style={styles.legendItem}>
        <View style={[styles.legendSwatch, styles.legendAvailable]} />
        <Text style={styles.legendText}>Available</Text>
      </View>
      <View style={styles.legendItem}>
        <View style={[styles.legendSwatch, styles.legendSelected]} />
        <Text style={styles.legendText}>Selected</Text>
      </View>
      <View style={styles.legendItem}>
        <View style={[styles.legendSwatch, styles.legendBooked]} />
        <Text style={styles.legendText}>Booked</Text>
      </View>
    </View>
  );

  const renderSummary = () => (
    <View style={styles.summaryContainer}>
      <Text style={styles.summaryTitle}>
        {selectedSeats.length} {selectedSeats.length === 1 ? 'Seat' : 'Seats'} Selected
      </Text>
      <Text style={styles.summarySubtitle}>
        {selectedSeats.length > 0 ? selectedSeats.join(', ') : `Select up to ${MAX_SELECTED_SEATS} seats`}
      </Text>
      <Text style={styles.summaryMeta}>
        Showing: {showTime} • {location?.theater || 'Theater not selected'}
      </Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => {
            playSoundEffect(SOUND_EFFECT_KEYS.TAP);
            navigation.goBack();
          }}
        >
          <Ionicons name="chevron-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <View style={styles.headerTextGroup}>
          <Text style={styles.headerTitle}>Select Seats</Text>
          <Text style={styles.headerSubtitle}>
            {movieTitle}
            {selectedDate ? ` • ${selectedDate}` : ''}
          </Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        {renderScreen()}
        {renderLegend()}

        {loadingSeats ? (
          <View style={styles.loadingCard}>
            <ActivityIndicator size="large" color="#E50914" />
            <Text style={styles.loadingText}>Loading live seat availability...</Text>
          </View>
        ) : (
          renderSeatGrid()
        )}

        {screenError ? (
          <View style={styles.errorBanner}>
            <Ionicons name="alert-circle-outline" size={18} color="#FF6B6B" />
            <Text style={styles.errorText}>{screenError}</Text>
          </View>
        ) : null}

        {renderSummary()}
      </ScrollView>

      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[
            styles.proceedButton,
            selectedSeats.length > 0 && !loadingSeats
              ? styles.proceedButtonEnabled
              : styles.proceedButtonDisabled,
          ]}
          disabled={selectedSeats.length === 0 || loadingSeats || bookingInProgress}
          onPress={handleProceed}
        >
          {bookingInProgress ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <>
              <Ionicons
                name={selectedSeats.length > 0 ? 'arrow-forward' : 'ellipsis-horizontal'}
                size={20}
                color="#FFFFFF"
              />
              <Text style={styles.proceedButtonText}>PROCEED</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#050505',
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 15,
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    marginRight: 15,
  },
  headerTextGroup: {
    flex: 1,
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
  headerSubtitle: {
    color: '#B0B0B0',
    fontSize: 13,
    marginTop: 4,
  },
  scrollView: {
    paddingVertical: 20,
    paddingHorizontal: 20,
  },
  screen: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  screenContainer: {
    width: '80%',
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1A1A1A',
    marginBottom: 10,
  },
  screenLine: {
    width: '100%',
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FFFFFF',
    transform: [{ rotate: '-5deg' }],
  },
  legendContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 20,
    gap: 16,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  legendSwatch: {
    width: 14,
    height: 14,
    borderRadius: 4,
    marginRight: 8,
  },
  legendAvailable: {
    backgroundColor: '#FFFFFF',
  },
  legendSelected: {
    backgroundColor: '#E50914',
  },
  legendBooked: {
    backgroundColor: '#2A2A2A',
  },
  legendText: {
    color: '#B0B0B0',
    fontSize: 12,
  },
  loadingCard: {
    backgroundColor: '#1A1A1A',
    borderRadius: 16,
    paddingVertical: 30,
    paddingHorizontal: 20,
    alignItems: 'center',
    marginBottom: 20,
  },
  loadingText: {
    color: '#B0B0B0',
    marginTop: 14,
    fontSize: 14,
  },
  seatContainer: {
    paddingVertical: 15,
  },
  gridScroll: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 10,
  },
  seat: {
    width: 58,
    height: 58,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#1A1A1A',
  },
  seatSelected: {
    backgroundColor: '#E50914',
    borderColor: '#E50914',
  },
  seatBooked: {
    backgroundColor: '#2A2A2A',
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  seatLabel: {
    color: '#050505',
    fontSize: 10,
    fontWeight: '700',
    marginTop: 4,
  },
  seatLabelSelected: {
    color: '#FFFFFF',
  },
  seatLabelBooked: {
    color: '#8A8A8A',
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 107, 107, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255, 107, 107, 0.25)',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginTop: 8,
    marginBottom: 18,
  },
  errorText: {
    color: '#FFD7D7',
    fontSize: 14,
    marginLeft: 10,
    flex: 1,
  },
  summaryContainer: {
    paddingHorizontal: 20,
    paddingVertical: 18,
    backgroundColor: '#1A1A1A',
    borderRadius: 16,
    alignItems: 'center',
  },
  summaryTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  summarySubtitle: {
    color: '#B0B0B0',
    fontSize: 12,
    textAlign: 'center',
  },
  summaryMeta: {
    color: '#E50914',
    fontSize: 12,
    marginTop: 8,
    fontWeight: '600',
    textAlign: 'center',
  },
  buttonContainer: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  proceedButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E50914',
    paddingVertical: 16,
    paddingHorizontal: 40,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E50914',
    minHeight: 58,
  },
  proceedButtonEnabled: {
    backgroundColor: '#E50914',
    borderColor: '#E50914',
  },
  proceedButtonDisabled: {
    backgroundColor: 'rgba(229, 9, 20, 0.3)',
    borderColor: 'rgba(229, 9, 20, 0.5)',
  },
  proceedButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
    marginLeft: 10,
  },
});

export default SeatSelectionScreen;
