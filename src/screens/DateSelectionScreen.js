import React, { useMemo, useState } from 'react';
import {
  Animated,
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import useFadeInUp from '../hooks/useFadeInUp';
import {
  playSoundEffect,
  SOUND_EFFECT_KEYS,
} from '../services/soundEffects';

const DEFAULT_SHOWTIME = '7:30 PM';

const DateSelectionScreen = ({ navigation, route }) => {
  const [selectedDate, setSelectedDate] = useState(null);
  const { movieId, movieTitle = 'Selected Movie', location } = route.params ?? {};
  const headerAnimation = useFadeInUp({ delay: 0 });
  const contentAnimation = useFadeInUp({ delay: 90 });

  const generateDates = () => {
    const today = new Date();
    return Array.from({ length: 7 }, (_, i) => {
      const date = new Date(today);
      date.setDate(today.getDate() + i);

      const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

      return {
        id: i,
        dateObj: date,
        day: dayNames[date.getDay()],
        dayNumber: date.getDate(),
        month: monthNames[date.getMonth()],
        year: date.getFullYear(),
        fullDate: date.toLocaleDateString('en-US', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        }),
      };
    });
  };

  const dates = useMemo(() => generateDates(), []);

  const renderDateCard = (date, index) => {
    const isSelected = selectedDate === date.id;

    return (
      <TouchableOpacity
        key={date.id}
        style={[
          styles.dateCard,
          isSelected && styles.dateCardSelected,
        ]}
        onPress={() => {
          playSoundEffect(SOUND_EFFECT_KEYS.TAP);
          setSelectedDate(date.id);
        }}
        activeOpacity={0.7}
      >
        <View style={styles.dateHeader}>
          <Text style={[styles.dateDay, isSelected && styles.dateDaySelected]}>
            {date.day}
          </Text>
          <Text style={[styles.dateNumber, isSelected && styles.dateNumberSelected]}>
            {date.dayNumber}
          </Text>
          <Text style={[styles.dateMonth, isSelected && styles.dateMonthSelected]}>
            {date.month}
          </Text>
        </View>
        <View style={styles.dateIndicator}>
          <Ionicons
            name={isSelected ? 'radio-button-on' : 'radio-button-off'}
            size={20}
            color={isSelected ? '#E50914' : '#B0B0B0'}
          />
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
    >
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
            <Text style={styles.headerTitle}>Select Date</Text>
            <Text style={styles.headerSubtitle}>{movieTitle}</Text>
          </View>
        </View>
      </Animated.View>

      <Animated.View style={contentAnimation}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.dateScrollView}
        >
          <View style={styles.dateContainer}>
            {dates.map(renderDateCard)}
          </View>
        </ScrollView>

        <View style={styles.detailsContainer}>
          {selectedDate !== null && (
            <View style={styles.detailsCard}>
              <View style={styles.detailsIcon}>
                <Ionicons name="calendar-outline" size={32} color="#E50914" />
              </View>
              <View style={styles.detailsContent}>
                <Text style={styles.detailsTitle}>Selected Date</Text>
                <Text style={styles.detailsDay}>
                  {dates.find((d) => d.id === selectedDate)?.day || ''}
                </Text>
                <Text style={styles.detailsFullDate}>
                  {dates.find((d) => d.id === selectedDate)?.fullDate || ''}
                </Text>
                <Text style={styles.detailsShowtime}>Showtime: {DEFAULT_SHOWTIME}</Text>
              </View>
            </View>
          )}
        </View>

        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[
              styles.bookButton,
              selectedDate !== null && styles.bookButtonEnabled,
              selectedDate === null && styles.bookButtonDisabled,
            ]}
            disabled={selectedDate === null}
            onPress={() => {
              const chosenDate = dates.find((date) => date.id === selectedDate);
              playSoundEffect(SOUND_EFFECT_KEYS.TAP);
              navigation.navigate('SeatSelection', {
                movieId,
                movieTitle,
                location,
                selectedDate: chosenDate?.fullDate,
                showTime: DEFAULT_SHOWTIME,
              });
            }}
          >
            {selectedDate !== null && (
              <Ionicons name="checkmark" size={20} color="#FFFFFF" />
            )}
            <Text style={styles.bookButtonText}>BOOK</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#050505',
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
    fontWeight: '600',
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
    width: 80,
    height: 100,
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    padding: 15,
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginRight: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  dateCardSelected: {
    backgroundColor: '#E50914',
    borderColor: '#E50914',
  },
  dateHeader: {
    flex: 1,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  dateDay: {
    color: '#B0B0B0',
    fontSize: 10,
    fontWeight: '500',
  },
  dateDaySelected: {
    color: '#FFFFFF',
  },
  dateNumber: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: '700',
  },
  dateNumberSelected: {
    color: '#FFFFFF',
  },
  dateMonth: {
    color: '#B0B0B0',
    fontSize: 10,
    fontWeight: '500',
  },
  dateMonthSelected: {
    color: '#FFFFFF',
  },
  dateIndicator: {
    marginBottom: 8,
  },
  detailsContainer: {
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  detailsCard: {
    backgroundColor: '#1A1A1A',
    borderRadius: 16,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailsIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(229, 9, 20, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  detailsContent: {
    flex: 1,
  },
  detailsTitle: {
    color: '#B0B0B0',
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 4,
  },
  detailsDay: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  detailsFullDate: {
    color: '#B0B0B0',
    fontSize: 13,
    marginTop: 2,
  },
  detailsShowtime: {
    color: '#E50914',
    fontSize: 13,
    marginTop: 6,
    fontWeight: '600',
  },
  buttonContainer: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  bookButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E50914',
    paddingVertical: 16,
    paddingHorizontal: 40,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E50914',
  },
  bookButtonEnabled: {
    backgroundColor: '#E50914',
    borderColor: '#E50914',
  },
  bookButtonDisabled: {
    backgroundColor: 'rgba(229, 9, 20, 0.3)',
    borderColor: 'rgba(229, 9, 20, 0.5)',
  },
  bookButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
    marginLeft: 10,
  },
});

export default DateSelectionScreen;
