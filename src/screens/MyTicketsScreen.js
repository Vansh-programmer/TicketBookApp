import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { auth, firebaseConfigError } from '../config/firebase';
import { subscribeToUserBookings } from '../services/bookings';

const MyTicketsScreen = ({ navigation }) => {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!auth) {
      setError(firebaseConfigError || 'Firebase is not configured for this build.');
      setLoading(false);
      return;
    }

    const user = auth.currentUser;

    if (!user) {
      setError('Please sign in to view your tickets.');
      setLoading(false);
      return;
    }

    const unsubscribe = subscribeToUserBookings(
      user.uid,
      (bookings) => {
        setTickets(bookings);
        setError('');
        setLoading(false);
      },
      (subscriptionError) => {
        console.error('Error loading bookings:', subscriptionError);
        setError('Unable to load your tickets right now.');
        setLoading(false);
      },
    );

    return unsubscribe;
  }, []);

  const renderTicket = ({ item }) => (
    <View style={styles.ticketCard}>
      {item.moviePoster ? <Image source={{ uri: item.moviePoster }} style={styles.ticketPoster} /> : null}

      <View style={styles.ticketHeader}>
        <View style={styles.ticketBadge}>
          <Ionicons name="ticket-outline" size={16} color="#E50914" />
          <Text style={styles.ticketBadgeText}>{item.ticketId}</Text>
        </View>
        <Text style={styles.ticketTime}>{item.time}</Text>
      </View>

      <Text style={styles.movieTitle}>{item.movieTitle}</Text>

      <View style={styles.detailRow}>
        <Ionicons name="calendar-outline" size={16} color="#B0B0B0" />
        <Text style={styles.detailText}>{item.date}</Text>
      </View>

      <View style={styles.detailRow}>
        <Ionicons name="location-outline" size={16} color="#B0B0B0" />
        <Text style={styles.detailText}>
          {item.theater}
          {item.city ? ` • ${item.city}` : ''}
        </Text>
      </View>

      <View style={styles.detailRow}>
        <Ionicons name="apps-outline" size={16} color="#B0B0B0" />
        <Text style={styles.detailText}>Seats: {(item.seats || []).join(', ')}</Text>
      </View>

      {item.theaterFormats?.length ? (
        <View style={styles.formatRow}>
          {item.theaterFormats.map((format) => (
            <View key={format} style={styles.formatPill}>
              <Text style={styles.formatPillText}>{format}</Text>
            </View>
          ))}
        </View>
      ) : null}

      {item.priceDetails?.formattedTotal ? (
        <View style={styles.priceRow}>
          <Text style={styles.priceLabel}>Paid</Text>
          <Text style={styles.priceValue}>{item.priceDetails.formattedTotal}</Text>
        </View>
      ) : null}
    </View>
  );

  if (loading) {
    return (
      <View style={styles.centerState}>
        <ActivityIndicator size="large" color="#E50914" />
        <Text style={styles.stateText}>Loading your tickets...</Text>
      </View>
    );
  }

  const showBackButton = navigation.canGoBack();

  if (error) {
    return (
      <View style={styles.centerState}>
        <Text style={styles.stateText}>{error}</Text>
        <TouchableOpacity
          style={styles.backHomeButton}
          onPress={() => navigation.navigate('Home', { screen: 'Discover' })}
        >
          <Text style={styles.backHomeText}>Back to Home</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        {showBackButton ? (
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Ionicons name="chevron-back" size={24} color="#FFFFFF" />
          </TouchableOpacity>
        ) : (
          <View style={styles.backButtonPlaceholder} />
        )}
        <View style={styles.headerTextGroup}>
          <Text style={styles.headerTitle}>My Tickets</Text>
          <Text style={styles.headerSubtitle}>
            {showBackButton
              ? 'Booked reservations'
              : 'Your booking history'}
          </Text>
        </View>
      </View>

      <FlatList
        data={tickets}
        renderItem={renderTicket}
        keyExtractor={(item) => item.id}
        contentContainerStyle={tickets.length ? styles.listContent : styles.emptyContent}
        ListEmptyComponent={
          <View style={styles.centerState}>
            <Ionicons name="ticket-outline" size={56} color="#E50914" />
            <Text style={styles.stateTitle}>No tickets yet</Text>
            <Text style={styles.stateText}>Once you book a movie, your tickets will appear here.</Text>
          </View>
        }
        showsVerticalScrollIndicator={false}
      />
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
    paddingTop: 60,
    paddingBottom: 18,
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    marginRight: 15,
  },
  backButtonPlaceholder: {
    width: 24,
    marginRight: 15,
  },
  headerTextGroup: {
    flex: 1,
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '700',
  },
  headerSubtitle: {
    color: '#B0B0B0',
    fontSize: 13,
    marginTop: 4,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 30,
  },
  emptyContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  ticketCard: {
    backgroundColor: '#101217',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  ticketPoster: {
    width: '100%',
    height: 180,
    borderRadius: 8,
    marginBottom: 16,
  },
  ticketHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  ticketBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: 'rgba(229, 9, 20, 0.12)',
  },
  ticketBadgeText: {
    color: '#E50914',
    fontSize: 12,
    fontWeight: '700',
    marginLeft: 8,
  },
  ticketTime: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  movieTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 14,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  detailText: {
    color: '#B0B0B0',
    fontSize: 14,
    marginLeft: 10,
    flex: 1,
  },
  formatRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 6,
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
  priceRow: {
    marginTop: 14,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.08)',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  priceLabel: {
    color: '#B0B0B0',
    fontSize: 13,
    fontWeight: '600',
  },
  priceValue: {
    color: '#E50914',
    fontSize: 18,
    fontWeight: '800',
  },
  centerState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 28,
    backgroundColor: '#050505',
  },
  stateTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '700',
    marginTop: 18,
    marginBottom: 8,
  },
  stateText: {
    color: '#B0B0B0',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 14,
  },
  backHomeButton: {
    marginTop: 20,
    backgroundColor: '#E50914',
    borderRadius: 8,
    paddingHorizontal: 18,
    paddingVertical: 12,
  },
  backHomeText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
});

export default MyTicketsScreen;
