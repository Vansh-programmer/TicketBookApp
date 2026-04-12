import React, { useEffect } from 'react';
import {
  Animated,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useToast } from '../components/ToastProvider';
import useFadeInUp from '../hooks/useFadeInUp';
import { formatInr } from '../services/bookingCatalog';
import { playSoundEffect, SOUND_EFFECT_KEYS } from '../services/soundEffects';

const DigitalTicketScreen = ({ navigation, route }) => {
  const {
    movieTitle,
    moviePoster,
    location,
    selectedDate,
    showTime = '7:30 PM',
    seats = [],
    showingId,
    ticketId,
    pricing,
    theaterDetails,
    pendingSync = false,
  } = route.params ?? {};
  const contentAnimation = useFadeInUp({ delay: 0 });
  const { showToast } = useToast();

  useEffect(() => {
    playSoundEffect(SOUND_EFFECT_KEYS.SUCCESS);
  }, []);

  const totalPrice = pricing?.formattedTotal || formatInr(seats.length * 250);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer} showsVerticalScrollIndicator={false}>
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
          <Text style={styles.headerTitle}>Your Ticket</Text>
        </View>

        <View style={styles.successContainer}>
          <View style={styles.successIcon}>
            <Ionicons name="checkmark-circle" size={50} color="#00C853" />
          </View>
          <Text style={styles.successMessage}>Booking Confirmed</Text>
          <Text style={styles.successSubtext}>
            {location?.city ? `${location.city}, ${location.state}` : 'Seats secured'}
          </Text>
        </View>

        <View style={styles.ticketContainer}>
          <View style={styles.ticketTop}>
            {moviePoster ? <Image source={{ uri: moviePoster }} style={styles.posterImage} /> : null}
            <Text style={styles.ticketEyebrow}>Digital Pass</Text>
            <Text style={styles.movieTitle}>{movieTitle}</Text>
            <Text style={styles.theaterText}>{location?.theater}</Text>

            {pendingSync ? (
              <View style={styles.pendingSyncBanner}>
                <Ionicons name="cloud-offline-outline" size={14} color="#FFD66B" />
                <Text style={styles.pendingSyncText}>Pending server sync</Text>
              </View>
            ) : null}

            <View style={styles.formatRow}>
              {(theaterDetails?.formats || []).map((format) => (
                <View key={format} style={styles.formatPill}>
                  <Text style={styles.formatPillText}>{format}</Text>
                </View>
              ))}
            </View>
          </View>

          <View style={styles.ticketBody}>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Date</Text>
              <Text style={styles.detailValue}>{selectedDate}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Time</Text>
              <Text style={styles.detailValue}>{showTime}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Seats</Text>
              <Text style={styles.detailValue}>{seats.join(', ')}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Total</Text>
              <Text style={styles.detailPrice}>{totalPrice}</Text>
            </View>
          </View>

          <View style={styles.barcodeContainer}>
            {[...Array(24)].map((_, index) => (
              <View
                key={index}
                style={[
                  styles.barcodeLine,
                  { width: index % 3 === 0 ? 5 : 2 },
                ]}
              />
            ))}
          </View>

          <View style={styles.ticketFooter}>
            <Text style={styles.ticketId}>
              Ticket ID: {ticketId || (showingId ? showingId.slice(0, 18).toUpperCase() : 'TKT-PREVIEW')}
            </Text>
            <Text style={styles.footerNote}>Show at entry</Text>
          </View>
        </View>

        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={styles.downloadButton}
            onPress={() => {
              playSoundEffect(SOUND_EFFECT_KEYS.TAP);
              showToast('Ticket saved in My Tickets.', { type: 'success' });
              navigation.navigate('MyTickets');
            }}
          >
            <Ionicons name="ticket-outline" size={18} color="#050505" />
            <Text style={styles.downloadButtonText}>View tickets</Text>
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
    paddingTop: 58,
    paddingBottom: 15,
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    marginRight: 15,
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },
  successContainer: {
    alignItems: 'center',
    paddingVertical: 24,
    paddingHorizontal: 20,
  },
  successIcon: {
    width: 80,
    height: 80,
    borderRadius: 8,
    backgroundColor: 'rgba(0, 200, 83, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 15,
  },
  successMessage: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '800',
    marginBottom: 8,
  },
  successSubtext: {
    color: '#B0B0B0',
    fontSize: 13,
    textAlign: 'center',
  },
  ticketContainer: {
    marginHorizontal: 20,
    backgroundColor: '#101217',
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  ticketTop: {
    padding: 22,
    backgroundColor: '#101217',
  },
  posterImage: {
    width: '100%',
    height: 180,
    borderRadius: 8,
    marginBottom: 16,
  },
  ticketEyebrow: {
    color: '#E50914',
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0,
  },
  movieTitle: {
    color: '#FFFFFF',
    fontSize: 26,
    fontWeight: '800',
    marginTop: 10,
  },
  theaterText: {
    color: '#D6D6D9',
    marginTop: 8,
  },
  pendingSyncBanner: {
    marginTop: 12,
    alignSelf: 'flex-start',
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 214, 107, 0.14)',
    borderWidth: 1,
    borderColor: 'rgba(255, 214, 107, 0.38)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    gap: 6,
  },
  pendingSyncText: {
    color: '#FFD66B',
    fontSize: 12,
    fontWeight: '700',
  },
  formatRow: {
    marginTop: 14,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  formatPill: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  formatPillText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  ticketBody: {
    padding: 22,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  detailLabel: {
    color: '#AAB4C4',
    fontWeight: '700',
  },
  detailValue: {
    color: '#FFFFFF',
    fontWeight: '700',
    flex: 1,
    textAlign: 'right',
    marginLeft: 20,
  },
  detailPrice: {
    color: '#E50914',
    fontWeight: '800',
    fontSize: 18,
  },
  barcodeContainer: {
    height: 44,
    marginHorizontal: 22,
    marginBottom: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  barcodeLine: {
    height: '100%',
    backgroundColor: '#FFFFFF',
  },
  ticketFooter: {
    padding: 20,
    backgroundColor: '#151821',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.08)',
  },
  ticketId: {
    color: '#FFFFFF',
    fontWeight: '800',
    textAlign: 'center',
  },
  footerNote: {
    color: '#AAB4C4',
    textAlign: 'center',
    marginTop: 8,
  },
  buttonContainer: {
    paddingHorizontal: 20,
    paddingTop: 24,
  },
  downloadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    paddingVertical: 16,
    borderRadius: 8,
  },
  downloadButtonText: {
    color: '#050505',
    fontWeight: '800',
    marginLeft: 10,
  },
});

export default DigitalTicketScreen;
