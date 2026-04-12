import React, { useEffect, useMemo, useState } from 'react';
import {
  Animated,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import useFadeInUp from '../hooks/useFadeInUp';
import { playSoundEffect, SOUND_EFFECT_KEYS } from '../services/soundEffects';
import { formatInr, getStartingPrice } from '../services/bookingCatalog';

const FALLBACK_SHOWTIMES = ['10:30 AM', '1:30 PM', '4:30 PM', '7:30 PM'];

const DateSelectionScreen = ({ navigation, route }) => {
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedShowtime, setSelectedShowtime] = useState(null);
  const {
    movieId,
    movieTitle = 'Selected Movie',
    moviePoster = null,
    location,
  } = route.params ?? {};
  const headerAnimation = useFadeInUp({ delay: 0 });
  const contentAnimation = useFadeInUp({ delay: 90 });
  const rawShowtimes = Array.isArray(location?.theaterDetails?.showtimes)
    ? location.theaterDetails.showtimes
    : [];
  const isUsingFallbackShowtimes = rawShowtimes.length === 0;
  const showtimes = isUsingFallbackShowtimes ? FALLBACK_SHOWTIMES : rawShowtimes;

  const dates = useMemo(() => {
    const today = new Date();
    return Array.from({ length: 7 }, (_, index) => {
      const date = new Date(today);
      date.setDate(today.getDate() + index);

      return {
        id: index,
        day: date.toLocaleDateString('en-US', { weekday: 'short' }),
        dayNumber: date.getDate(),
        month: date.toLocaleDateString('en-US', { month: 'short' }),
        fullDate: date.toLocaleDateString('en-US', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        }),
      };
    });
  }, []);

  const selectedDateLabel = dates.find((date) => date.id === selectedDate)?.fullDate;

  useEffect(() => {
    if (!selectedShowtime && showtimes.length > 0) {
      setSelectedShowtime(showtimes[0]);
    }
  }, [selectedShowtime, showtimes]);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer} showsVerticalScrollIndicator={false}>
      <Animated.View style={headerAnimation}>
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
            <Text style={styles.headerTitle}>Select date and time</Text>
            <Text style={styles.headerSubtitle}>{movieTitle}</Text>
          </View>
        </View>
      </Animated.View>

      <Animated.View style={contentAnimation}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.dateScrollView}>
          <View style={styles.dateContainer}>
            {dates.map((date) => {
              const isSelected = selectedDate === date.id;

              return (
                <TouchableOpacity
                  key={date.id}
                  style={[styles.dateCard, isSelected && styles.dateCardSelected]}
                  onPress={() => {
                    playSoundEffect(SOUND_EFFECT_KEYS.TAP);
                    setSelectedDate(date.id);
                  }}
                >
                  <Text style={[styles.dateDay, isSelected && styles.dateTextSelected]}>{date.day}</Text>
                  <Text style={[styles.dateNumber, isSelected && styles.dateTextSelected]}>{date.dayNumber}</Text>
                  <Text style={[styles.dateMonth, isSelected && styles.dateTextSelected]}>{date.month}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </ScrollView>

        <View style={styles.summaryCard}>
          <Text style={styles.summaryEyebrow}>Venue</Text>
          <Text style={styles.summaryTitle}>{location?.theater}</Text>
          <Text style={styles.summaryMeta}>
            {location?.city}, {location?.state}
          </Text>
          <Text style={styles.summaryPrice}>
            Starts at {formatInr(getStartingPrice(location?.theaterDetails?.seatPricing))}
          </Text>
          {selectedDateLabel ? <Text style={styles.summaryDate}>{selectedDateLabel}</Text> : null}
        </View>

        <View style={styles.showtimeSection}>
          <Text style={styles.showtimeSectionTitle}>Choose showtime</Text>
          {isUsingFallbackShowtimes ? (
            <Text style={styles.showtimeFallbackHint}>
              Live showtimes are unavailable for this theatre right now, so default showtimes are shown.
            </Text>
          ) : null}
          <View style={styles.showtimeGrid}>
            {showtimes.map((showtime) => {
              const isSelected = selectedShowtime === showtime;

              return (
                <TouchableOpacity
                  key={showtime}
                  style={[styles.showtimeChip, isSelected && styles.showtimeChipSelected]}
                  onPress={() => {
                    playSoundEffect(SOUND_EFFECT_KEYS.TAP);
                    setSelectedShowtime(showtime);
                  }}
                >
                  <Text style={[styles.showtimeChipText, isSelected && styles.showtimeChipTextSelected]}>
                    {showtime}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[
              styles.bookButton,
              selectedDate !== null && selectedShowtime ? styles.bookButtonEnabled : styles.bookButtonDisabled,
            ]}
            disabled={selectedDate === null || !selectedShowtime}
            onPress={() => {
              playSoundEffect(SOUND_EFFECT_KEYS.TAP);
              navigation.navigate('SeatSelection', {
                movieId,
                movieTitle,
                moviePoster,
                location,
                selectedDate: selectedDateLabel,
                showTime: selectedShowtime,
              });
            }}
          >
            <Ionicons name="arrow-forward" size={20} color="#FFFFFF" />
            <Text style={styles.bookButtonText}>Continue to seats</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#05070B',
  },
  contentContainer: {
    paddingTop: 60,
    paddingBottom: 40,
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
    fontWeight: '700',
  },
  headerSubtitle: {
    color: '#B0B0B0',
    fontSize: 13,
    marginTop: 4,
  },
  dateScrollView: {
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  dateContainer: {
    flexDirection: 'row',
  },
  dateCard: {
    width: 86,
    height: 104,
    backgroundColor: '#1A1A1A',
    borderRadius: 8,
    padding: 15,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  dateCardSelected: {
    backgroundColor: '#E50914',
    borderColor: '#E50914',
  },
  dateDay: {
    color: '#B0B0B0',
    fontSize: 12,
    fontWeight: '700',
  },
  dateNumber: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: '800',
    marginVertical: 4,
  },
  dateMonth: {
    color: '#B0B0B0',
    fontSize: 12,
    fontWeight: '700',
  },
  dateTextSelected: {
    color: '#FFFFFF',
  },
  summaryCard: {
    marginHorizontal: 20,
    marginTop: 18,
    backgroundColor: '#101217',
    borderRadius: 8,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  summaryEyebrow: {
    color: '#E50914',
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0,
  },
  summaryTitle: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '800',
    marginTop: 8,
  },
  summaryMeta: {
    color: '#A0A0A8',
    marginTop: 6,
  },
  summaryPrice: {
    color: '#FFFFFF',
    marginTop: 12,
    fontSize: 16,
    fontWeight: '800',
  },
  summaryDate: {
    color: '#CFCFD3',
    marginTop: 10,
    lineHeight: 20,
  },
  showtimeSection: {
    paddingHorizontal: 20,
    paddingTop: 22,
  },
  showtimeSectionTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 14,
  },
  showtimeFallbackHint: {
    color: '#A9B4C8',
    fontSize: 12,
    lineHeight: 18,
    marginBottom: 12,
  },
  showtimeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  showtimeChip: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#1A1A1A',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  showtimeChipSelected: {
    backgroundColor: '#E50914',
    borderColor: '#E50914',
  },
  showtimeChipText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  showtimeChipTextSelected: {
    color: '#FFFFFF',
  },
  buttonContainer: {
    paddingHorizontal: 20,
    paddingTop: 30,
    paddingBottom: 30,
  },
  bookButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 8,
  },
  bookButtonEnabled: {
    backgroundColor: '#E50914',
  },
  bookButtonDisabled: {
    backgroundColor: '#353535',
  },
  bookButtonText: {
    color: '#FFFFFF',
    fontWeight: '800',
    marginLeft: 10,
  },
});

export default DateSelectionScreen;
