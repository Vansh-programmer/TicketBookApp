import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
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
const FALLBACK_BOOKING_ERROR_CODES = new Set([
  'permission-denied',
  'failed-precondition',
  'firebase/not-configured',
  'unavailable',
]);

const SeatSelectionScreen = ({ navigation, route }) => {
  const insets = useSafeAreaInsets();
  const [selectedSeats, setSelectedSeats] = useState([]);
  const [bookedSeats, setBookedSeats] = useState([]);
  const [selectedTierFilter, setSelectedTierFilter] = useState(null);
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

  const handleTierFilterTap = (tier) => {
    if (loadingSeats || bookingInProgress) {
      return;
    }

    playSoundEffect(SOUND_EFFECT_KEYS.TAP);
    setSelectedTierFilter((current) => (current === tier ? null : tier));
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

    const openDigitalTicket = ({ ticketId, bookingId, pendingSync }) => {
      navigation.navigate('DigitalTicket', {
        movieId,
        movieTitle,
        moviePoster,
        location,
        selectedDate,
        showTime,
        seats: selectedSeats,
        showingId,
        ticketId,
        bookingId,
        pricing: priceDetails,
        theaterDetails: location?.theaterDetails,
        pendingSync,
      });
    };

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
      openDigitalTicket({
        ticketId: booking.ticketId,
        bookingId: booking.bookingId,
        pendingSync: false,
      });
    } catch (error) {
      if (FALLBACK_BOOKING_ERROR_CODES.has(error?.code)) {
        const fallbackTicketId = `TMP-${Date.now().toString().slice(-8)}`;
        const warningMessage =
          'Booking server is temporarily unavailable. Opening your ticket preview now.';

        playSoundEffect(SOUND_EFFECT_KEYS.SUCCESS);
        showToast(warningMessage, { type: 'info' });
        openDigitalTicket({
          ticketId: fallbackTicketId,
          bookingId: null,
          pendingSync: true,
        });
        return;
      }

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

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollViewContent,
          {
            paddingBottom: 28,
          },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.screen}>
          <View style={styles.screenLine} />
          <Text style={styles.screenLabel}>Screen this way</Text>
        </View>

        <View style={styles.legendContainer}>
          {tierLegend.map((tier) => (
            <TouchableOpacity
              key={tier.tier}
              style={[
                styles.legendTierCard,
                selectedTierFilter === tier.tier && styles.legendTierCardActive,
              ]}
              onPress={() => handleTierFilterTap(tier.tier)}
              activeOpacity={0.85}
            >
              <Text style={styles.legendTierName}>{tier.tier}</Text>
              <Text style={styles.legendTierMeta}>Rows {tier.rows}</Text>
              <Text style={styles.legendTierPrice}>{tier.price}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.legendHintText}>
          {selectedTierFilter
            ? `${selectedTierFilter} selected. Tap again to show all tiers.`
            : 'Tap Prime, Luxe, or Classic to focus that seat tier.'}
        </Text>

        <View style={styles.inlineProceedWrap}>
          <Text style={styles.inlineProceedText}>
            {selectedSeats.length > 0
              ? `${selectedSeats.length} seat${selectedSeats.length === 1 ? '' : 's'} selected`
              : 'Select seats to continue'}
          </Text>
          <TouchableOpacity
            style={[
              styles.inlineProceedButton,
              selectedSeats.length > 0 && !loadingSeats ? styles.inlineProceedButtonEnabled : styles.inlineProceedButtonDisabled,
            ]}
            disabled={selectedSeats.length === 0 || loadingSeats || bookingInProgress}
            onPress={handleProceed}
          >
            {bookingInProgress ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <>
                <Ionicons name="arrow-forward" size={16} color="#FFFFFF" />
                <Text style={styles.inlineProceedButtonText}>Continue</Text>
              </>
            )}
          </TouchableOpacity>
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
              const isTierMatch = !selectedTierFilter || selectedTierFilter === tier;
              const isSeatDisabled = isBooked || bookingInProgress || (!isTierMatch && !isSelected);

              return (
                <TouchableOpacity
                  key={seat.id}
                  style={[
                    styles.seat,
                    tier === 'Luxe' && styles.seatLuxe,
                    tier === 'Prime' && styles.seatPrime,
                    !isTierMatch && !isSelected && styles.seatTierMuted,
                    isSelected && styles.seatSelected,
                    isBooked && styles.seatBooked,
                  ]}
                  onPress={() => handleSeatTap(seat.id)}
                  disabled={isSeatDisabled}
                >
                  <Text
                    style={[
                      styles.seatLabel,
                      tier === 'Luxe' && styles.seatLabelLuxe,
                      tier === 'Prime' && styles.seatLabelPrime,
                      !isTierMatch && !isSelected && styles.seatLabelMuted,
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

        <View style={styles.statusLegendRow}>
          <View style={styles.statusLegendItem}>
            <View style={[styles.statusSwatch, styles.statusSwatchAvailable]} />
            <Text style={styles.statusLegendText}>Available</Text>
          </View>
          <View style={styles.statusLegendItem}>
            <View style={[styles.statusSwatch, styles.statusSwatchSelected]} />
            <Text style={styles.statusLegendText}>Selected</Text>
          </View>
          <View style={styles.statusLegendItem}>
            <View style={[styles.statusSwatch, styles.statusSwatchBooked]} />
            <Text style={styles.statusLegendText}>Booked</Text>
          </View>
        </View>

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

      <View
        style={[
          styles.buttonContainer,
          {
            paddingBottom: Math.max(insets.bottom, 12),
          },
        ]}
      >
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
              <Ionicons name="checkmark-circle-outline" size={20} color="#FFFFFF" />
              <Text style={styles.proceedButtonText}>
                {selectedSeats.length > 0
                  ? `Confirm & Pay ${priceDetails.formattedTotal}`
                  : 'Confirm Seats'}
              </Text>
            </>
          )}
        </TouchableOpacity>
        <Text style={styles.proceedHint}>
          {selectedSeats.length > 0
            ? `Ready to book ${selectedSeats.length} seat${selectedSeats.length === 1 ? '' : 's'}.`
            : 'Select at least one seat to enable confirmation.'}
        </Text>
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
    flex: 1,
    minHeight: 0,
    flexShrink: 1,
  },
  scrollViewContent: {
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
  legendTierCardActive: {
    backgroundColor: '#1C2B21',
    borderColor: '#4AE0AE',
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
  legendHintText: {
    color: '#AEB8C7',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 10,
    paddingHorizontal: 20,
  },
  inlineProceedWrap: {
    marginTop: 12,
    marginHorizontal: 20,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    backgroundColor: 'rgba(16,18,23,0.9)',
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  inlineProceedText: {
    color: '#D7DCE8',
    fontSize: 12,
    fontWeight: '700',
    flex: 1,
  },
  inlineProceedButton: {
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 110,
  },
  inlineProceedButtonEnabled: {
    backgroundColor: '#0EA472',
  },
  inlineProceedButtonDisabled: {
    backgroundColor: '#2E3440',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  inlineProceedButtonText: {
    color: '#FFFFFF',
    fontWeight: '800',
    marginLeft: 6,
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
    backgroundColor: '#F7F7FA',
    borderWidth: 1,
    borderColor: 'rgba(20, 25, 35, 0.25)',
  },
  seatLuxe: {
    backgroundColor: '#2A2112',
    borderColor: '#FFCF74',
  },
  seatPrime: {
    backgroundColor: '#132433',
    borderColor: '#7EC0FF',
  },
  seatSelected: {
    backgroundColor: '#10B981',
    borderColor: '#74F0C5',
  },
  seatTierMuted: {
    opacity: 0.3,
  },
  seatBooked: {
    backgroundColor: '#2B2E37',
    borderColor: '#4A4E5B',
  },
  seatLabel: {
    color: '#1E2430',
    fontWeight: '800',
  },
  seatLabelLuxe: {
    color: '#FFE3AD',
  },
  seatLabelPrime: {
    color: '#C8E6FF',
  },
  seatLabelMuted: {
    color: 'rgba(255,255,255,0.42)',
  },
  seatLabelSelected: {
    color: '#FFFFFF',
  },
  seatLabelBooked: {
    color: 'rgba(255,255,255,0.4)',
  },
  statusLegendRow: {
    marginHorizontal: 20,
    marginTop: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statusLegendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusSwatch: {
    width: 14,
    height: 14,
    borderRadius: 4,
    borderWidth: 1,
  },
  statusSwatchAvailable: {
    backgroundColor: '#F7F7FA',
    borderColor: 'rgba(20, 25, 35, 0.25)',
  },
  statusSwatchSelected: {
    backgroundColor: '#10B981',
    borderColor: '#74F0C5',
  },
  statusSwatchBooked: {
    backgroundColor: '#2B2E37',
    borderColor: '#4A4E5B',
  },
  statusLegendText: {
    color: '#C7CCD7',
    fontSize: 12,
    fontWeight: '600',
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
    paddingTop: 12,
    backgroundColor: 'rgba(5, 7, 11, 0.96)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.08)',
    ...(Platform.OS === 'web'
      ? {
          position: 'sticky',
          bottom: 0,
          zIndex: 50,
        }
      : {}),
  },
  proceedButton: {
    borderRadius: 8,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  proceedButtonEnabled: {
    backgroundColor: '#0EA472',
  },
  proceedButtonDisabled: {
    backgroundColor: '#2E3440',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  proceedButtonText: {
    color: '#FFFFFF',
    fontWeight: '800',
    marginLeft: 10,
  },
  proceedHint: {
    marginTop: 8,
    textAlign: 'center',
    color: '#AAB2C0',
    fontSize: 12,
  },
});

export default SeatSelectionScreen;
