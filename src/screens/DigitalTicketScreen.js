import React, { useEffect } from 'react';
import {
  Animated,
  ScrollView,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useToast } from '../components/ToastProvider';
import useFadeInUp from '../hooks/useFadeInUp';
import {
  playSoundEffect,
  SOUND_EFFECT_KEYS,
} from '../services/soundEffects';

const DigitalTicketScreen = ({ navigation, route }) => {
  const {
    movieTitle,
    location,
    selectedDate,
    showTime = '7:30 PM',
    seats = [],
    showingId,
    ticketId,
  } = route.params ?? {};
  const contentAnimation = useFadeInUp({ delay: 0 });
  const { showToast } = useToast();
  const ticketData = {
    event: movieTitle || 'Movie Reservation',
    theater: location?.theater || 'Downtown Cinema 1',
    date: selectedDate || 'Date to be confirmed',
    time: showTime,
    row: seats[0]?.charAt(0) || 'G',
    seat: seats.length ? seats.join(', ') : '12-14',
    price: `$${(Math.max(seats.length, 1) * 15).toFixed(2)}`,
  };

  useEffect(() => {
    playSoundEffect(SOUND_EFFECT_KEYS.SUCCESS);
  }, []);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
    >
      <Animated.View style={contentAnimation}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => {
              playSoundEffect(SOUND_EFFECT_KEYS.TAP);
              navigation.goBack();
            }}
          >
            <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Your Reservation</Text>
        </View>

        <View style={styles.successContainer}>
          <View style={styles.successIcon}>
            <Ionicons name="checkmark-circle" size={50} color="#00C853" />
          </View>
          <Text style={styles.successMessage}>Your Reservation has been made!</Text>
          <Text style={styles.successSubtext}>
            {location?.city ? `${location.city}, ${location.state}` : 'A confirmation email has been sent to your inbox'}
          </Text>
        </View>

        <View style={styles.ticketContainer}>
          <View style={styles.ticketHeader}>
            <View style={styles.theaterBadge}>
              <Ionicons name="business" size={16} color="#E50914" />
              <Text style={styles.theaterBadgeText}>{ticketData.theater}</Text>
            </View>
          </View>

          <View style={styles.ticketBody}>
            <Text style={styles.eventTitle}>{ticketData.event}</Text>

            <View style={styles.detailsGrid}>
              <View style={styles.detailItem}>
                <Ionicons name="calendar" size={18} color="#000000" />
                <Text style={styles.detailValue}>{ticketData.date}</Text>
              </View>
              <View style={styles.detailItem}>
                <Ionicons name="time" size={18} color="#000000" />
                <Text style={styles.detailValue}>{ticketData.time}</Text>
              </View>
              <View style={styles.detailItem}>
                <Ionicons name="tv" size={18} color="#000000" />
                <Text style={styles.detailValue}>Row {ticketData.row}, Seat {ticketData.seat}</Text>
              </View>
              <View style={styles.detailItem}>
                <Ionicons name="pricetag" size={18} color="#000000" />
                <Text style={styles.detailValue}>{ticketData.price}</Text>
              </View>
            </View>

            <View style={styles.barcodeContainer}>
              <View style={styles.barcode}>
                {[...Array(20)].map((_, i) => (
                  <View
                    key={i}
                    style={[
                      styles.barcodeLine,
                      {
                        width: i % 3 === 0 ? 6 : 2,
                        marginLeft: i % 2 === 0 ? 0 : 1,
                        marginRight: i % 2 === 0 ? 0 : 1,
                      },
                    ]}
                  />
                ))}
              </View>
              <Text style={styles.barcodeText}>Scan at entrance</Text>
            </View>
          </View>

          <View style={styles.ticketFooter}>
            <Ionicons name="qr-code" size={60} color="#000000" />
            <Text style={styles.footerText}>
              Ticket ID: {ticketId || (showingId ? showingId.slice(0, 18).toUpperCase() : `RES-${new Date().getFullYear()}-${Math.floor(Math.random() * 1000)}`)}
            </Text>
          </View>
        </View>

        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={styles.downloadButton}
            onPress={() => {
              playSoundEffect(SOUND_EFFECT_KEYS.SUCCESS);
              showToast('PDF export can be connected when you are ready.', { type: 'info' });
            }}
          >
            <Ionicons name="download" size={18} color="#000000" />
            <Text style={styles.downloadButtonText}>Download PDF</Text>
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
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
  successContainer: {
    alignItems: 'center',
    paddingVertical: 30,
    paddingHorizontal: 20,
  },
  successIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(0, 200, 83, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 15,
  },
  successMessage: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 8,
    textAlign: 'center',
  },
  successSubtext: {
    color: '#B0B0B0',
    fontSize: 13,
    textAlign: 'center',
  },
  ticketContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    marginBottom: 40,
    overflow: 'hidden',
    maxWidth: 320,
    alignSelf: 'center',
    borderWidth: 2,
    borderColor: '#E50914',
    shadowColor: '#000000',
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
  },
  ticketHeader: {
    backgroundColor: '#1A1A1A',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 2,
    borderBottomColor: '#E50914',
  },
  theaterBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(229, 9, 20, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    alignSelf: 'center',
  },
  theaterBadgeText: {
    color: '#E50914',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
  ticketBody: {
    padding: 24,
  },
  eventTitle: {
    color: '#000000',
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 20,
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  detailsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  detailItem: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 8,
    marginHorizontal: 2,
  },
  detailValue: {
    color: '#000000',
    fontSize: 14,
    fontWeight: '500',
    marginTop: 4,
    textAlign: 'center',
  },
  barcodeContainer: {
    alignItems: 'center',
    marginVertical: 20,
  },
  barcode: {
    height: 40,
    backgroundColor: '#FFFFFF',
    borderRadius: 4,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  barcodeLine: {
    height: '100%',
    backgroundColor: '#000000',
    flex: 1,
    minHeight: 2,
  },
  barcodeText: {
    color: '#000000',
    fontSize: 12,
    fontWeight: '500',
  },
  ticketFooter: {
    padding: 20,
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  footerText: {
    color: '#000000',
    fontSize: 11,
    marginTop: 8,
    textAlign: 'center',
  },
  buttonContainer: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  downloadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    paddingVertical: 16,
    paddingHorizontal: 40,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#000000',
    shadowColor: '#000000',
    shadowOffset: {
      width: 0,
      height: 5,
    },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  downloadButtonText: {
    color: '#000000',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 10,
  },
});

export default DigitalTicketScreen;
