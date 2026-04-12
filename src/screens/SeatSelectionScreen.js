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
  calculateBookingPrice,
  formatInr,
  getSeatTier,
  getTierLegend,
} from '../services/bookingCatalog';
import {
  getBookingErrorMessage,
  reserveSeatsAndCreateBooking,
} from '../services/bookings';
import { playSoundEffect, SOUND_EFFECT_KEYS } from '../services/soundEffects';
import { buildShowingId, subscribeToShowing } from '../services/showings';

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
    moviePoster = null,
    location,
    selectedDate,
    showTime = '7:30 PM',
  } = route.params ?? {};

  const seatPricing = location?.theaterDetails?.seatPricing || {};
  const priceDetails = useMemo(
    () => calculateBookingPrice(selectedSeats, seatPricing),
    [seatPricing, selectedSeats],
  );
  const tierLegend = useMemo(() => getTierLegend(seatPricing), [seatPricing]);

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
        Array.from({ length: SEATS_PER_ROW }, (_, index) => ({
          id: `${rowLabel}${index + 1}`,
          rowLabel,
        })),
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
        setSelectedSeats((current) => current.filter((seatId) => !showing.bookedSeats.includes(seatId)));
        setScreenError('');
        setLoadingSeats(false);
      },
      () => {
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
      const message = `You can select up to ${MAX_SELECTED_SEATS} seats per booking.`;
      setScreenError(message);
      playSoundEffect(SOUND_EFFECT_KEYS.ERROR);
      showToast(message, { type: 'error' });
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
      const message = 'Please sign in again before booking your seats.';
      setScreenError(message);
      showToast(message, { type: 'error' });
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
        moviePoster,
        date: selectedDate,
        time: showTime,
        theater: location?.theater,
        city: location?.city,
        state: location?.state,
        seats: selectedSeats,
        showingId,
        priceDetails,
        theaterFormats: location?.theaterDetails?.formats || [],
      });

      playSoundEffect(SOUND_EFFECT_KEYS.SUCCESS);
      showToast('Ticket booked successfully!', { type: 'success' });
      navigation.navigate('DigitalTicket', {
        movieId,
        movieTitle,
        moviePoster,
        location,
        selectedDate,
        showTime,
        seats: selectedSeats,
        showingId,
        ticketId: booking.ticketId,
        bookingId: booking.bookingId,
        pricing: priceDetails,
        theaterDetails: location?.theaterDetails,
      });
    } catch (error) {
      const errorMessage = getBookingErrorMessage(error);
      setScreenError(errorMessage);
      playSoundEffect(SOUND_EFFECT_KEYS.ERROR);
      showToast(errorMessage, { type: 'error' });
    } finally {
      setBookingInProgress(false);
    }
  };

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
          <Text style={styles.headerTitle}>Choose seats</Text>
          <Text style={styles.headerSubtitle}>
            {movieTitle}
            {selectedDate ? ` • ${showTime}` : ''}
          </Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.screen}>
          <View style={styles.screenLine} />
          <Text style={styles.screenLabel}>Screen this way</Text>
        </View>

        <View style={styles.legendContainer}>
          {tierLegend.map((tier) => (
            <View key={tier.tier} style={styles.legendTierCard}>
              <Text style={styles.legendTierName}>{tier.tier}</Text>
              <Text style={styles.legendTierMeta}>Rows {tier.rows}</Text>
              <Text style={styles.legendTierPrice}>{tier.price}</Text>
            </View>
          ))}
        </View>

        {loadingSeats ? (
          <View style={styles.loadingCard}>
            <ActivityIndicator size="large" color="#E50914" />
            <Text style={styles.loadingText}>Loading seat availability...</Text>
          </View>
        ) : (
          <View style={styles.seatContainer}>
            {seats.map((seat) => {
              const isBooked = bookedSeats.includes(seat.id);
              const isSelected = selectedSeats.includes(seat.id);
              const tier = getSeatTier(seat.id);

              return (
                <TouchableOpacity
                  key={seat.id}
                  style={[
                    styles.seat,
                    isBooked && styles.seatBooked,
                    isSelected && styles.seatSelected,
                    tier === 'Luxe' && styles.seatLuxe,
                    tier === 'Prime' && styles.seatPrime,
                  ]}
                  onPress={() => handleSeatTap(seat.id)}
                  disabled={isBooked || bookingInProgress}
                >
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
          </View>
        )}

        {screenError ? (
          <View style={styles.errorBanner}>
            <Ionicons name="alert-circle-outline" size={18} color="#FF6B6B" />
            <Text style={styles.errorText}>{screenError}</Text>
          </View>
        ) : null}

        <View style={styles.summaryContainer}>
          <Text style={styles.summaryTitle}>
            {selectedSeats.length} {selectedSeats.length === 1 ? 'Seat' : 'Seats'} Selected
          </Text>
          <Text style={styles.summarySubtitle}>
            {selectedSeats.length > 0 ? selectedSeats.join(', ') : `Select up to ${MAX_SELECTED_SEATS} seats`}
          </Text>
          <Text style={styles.summaryMeta}>
            {location?.theater} • {location?.city}
          </Text>
          <Text style={styles.summaryPrice}>{priceDetails.formattedTotal}</Text>
          {selectedSeats.length > 0 ? (
            <Text style={styles.summaryBreakdown}>
              {priceDetails.items.map((item) => `${item.seatId} (${item.tier})`).join(' • ')}
            </Text>
          ) : null}
        </View>
      </ScrollView>

      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[
            styles.proceedButton,
            selectedSeats.length > 0 && !loadingSeats ? styles.proceedButtonEnabled : styles.proceedButtonDisabled,
          ]}
          disabled={selectedSeats.length === 0 || loadingSeats || bookingInProgress}
          onPress={handleProceed}
        >
          {bookingInProgress ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <>
              <Ionicons name="card-outline" size={20} color="#FFFFFF" />
              <Text style={styles.proceedButtonText}>
                {selectedSeats.length > 0 ? `Pay ${priceDetails.formattedTotal}` : 'Proceed'}
              </Text>
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
    backgroundColor: '#05070B',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 58,
    paddingBottom: 12,
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
    fontWeight: '800',
  },
  headerSubtitle: {
    color: '#B0B0B0',
    marginTop: 4,
    fontSize: 13,
  },
  scrollView: {
    paddingBottom: 30,
  },
  screen: {
    paddingHorizontal: 20,
    paddingTop: 20,
    alignItems: 'center',
  },
  screenLine: {
    width: '100%',
    height: 8,
    borderRadius: 8,
    backgroundColor: '#E50914',
  },
  screenLabel: {
    color: '#B0B0B0',
    fontSize: 11,
    fontWeight: '700',
    marginTop: 10,
    letterSpacing: 0,
  },
  legendContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
    paddingHorizontal: 20,
    paddingTop: 22,
  },
  legendTierCard: {
    flex: 1,
    backgroundColor: '#101217',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  legendTierName: {
    color: '#FFFFFF',
    fontWeight: '800',
    textAlign: 'center',
  },
  legendTierMeta: {
    color: '#A0A0A8',
    fontSize: 11,
    textAlign: 'center',
    marginTop: 6,
  },
  legendTierPrice: {
    color: '#E50914',
    fontWeight: '800',
    textAlign: 'center',
    marginTop: 6,
  },
  loadingCard: {
    marginHorizontal: 20,
    marginTop: 22,
    padding: 24,
    borderRadius: 8,
    backgroundColor: '#101217',
    alignItems: 'center',
  },
  loadingText: {
    color: '#FFFFFF',
    marginTop: 12,
  },
  seatContainer: {
    marginHorizontal: 20,
    marginTop: 22,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 10,
  },
  seat: {
    width: '22.5%',
    borderRadius: 8,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F6F6F7',
  },
  seatLuxe: {
    backgroundColor: '#FFF0D1',
  },
  seatPrime: {
    backgroundColor: '#E4F1FF',
  },
  seatSelected: {
    backgroundColor: '#E50914',
  },
  seatBooked: {
    backgroundColor: '#303036',
  },
  seatLabel: {
    color: '#050505',
    fontWeight: '800',
  },
  seatLabelSelected: {
    color: '#FFFFFF',
  },
  seatLabelBooked: {
    color: 'rgba(255,255,255,0.4)',
  },
  errorBanner: {
    marginHorizontal: 20,
    marginTop: 18,
    padding: 14,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 107, 107, 0.1)',
    flexDirection: 'row',
  },
  errorText: {
    color: '#FF9090',
    marginLeft: 10,
    flex: 1,
  },
  summaryContainer: {
    marginHorizontal: 20,
    marginTop: 22,
    borderRadius: 8,
    backgroundColor: '#101217',
    padding: 20,
    alignItems: 'center',
  },
  summaryTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '800',
  },
  summarySubtitle: {
    color: '#D1D1D5',
    marginTop: 10,
    textAlign: 'center',
  },
  summaryMeta: {
    color: '#9A9A9F',
    marginTop: 8,
    textAlign: 'center',
  },
  summaryPrice: {
    color: '#FFFFFF',
    marginTop: 12,
    fontSize: 24,
    fontWeight: '800',
  },
  summaryBreakdown: {
    color: '#9A9A9F',
    marginTop: 8,
    textAlign: 'center',
    lineHeight: 20,
  },
  buttonContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  proceedButton: {
    borderRadius: 8,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  proceedButtonEnabled: {
    backgroundColor: '#E50914',
  },
  proceedButtonDisabled: {
    backgroundColor: '#353535',
  },
  proceedButtonText: {
    color: '#FFFFFF',
    fontWeight: '800',
    marginLeft: 10,
  },
});

export default SeatSelectionScreen;
