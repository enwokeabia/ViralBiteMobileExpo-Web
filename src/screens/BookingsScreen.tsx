import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import AuthGate from '../components/AuthGate';

interface BookingsScreenProps {
  onShowAuth: (mode?: 'signin' | 'signup') => void;
}

export default function BookingsScreen({ onShowAuth }: BookingsScreenProps) {
  const { isAuthenticated, userProfile } = useAuth();

  // Sample booking data - we'll replace with real data later
  const sampleBookings = [
    {
      id: '1',
      restaurantName: 'Sage Bistro',
      date: 'Today',
      time: '18:00',
      status: 'confirmed',
      discount: '-30%'
    },
    {
      id: '2',
      restaurantName: 'Ramen House',
      date: 'Tomorrow',
      time: '12:30',
      status: 'pending',
      discount: '-40%'
    }
  ];

  // Show authentication gate if user is not signed in
  if (!isAuthenticated) {
    return (
      <AuthGate
        title="Your Reservations"
        subtitle="Sign in to view and manage your upcoming restaurant bookings"
        ctaText="Sign In to View Bookings"
        onSignIn={() => onShowAuth('signin')}
        icon="calendar"
        gradient={['#5500DB', '#C384FF']}
      />
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>My Bookings</Text>
      <ScrollView style={styles.bookingsList}>
        {sampleBookings.map(booking => (
          <View key={booking.id} style={styles.bookingCard}>
            <View style={styles.bookingHeader}>
              <Text style={styles.restaurantName}>{booking.restaurantName}</Text>
              <View style={[styles.statusBadge, 
                booking.status === 'confirmed' ? styles.confirmedBadge : styles.pendingBadge]}>
                <Text style={styles.statusText}>{booking.status}</Text>
              </View>
            </View>
            <Text style={styles.bookingDetails}>
              {booking.date} at {booking.time}
            </Text>
            <Text style={styles.discount}>Saved {booking.discount}</Text>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    paddingTop: 80,
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 20,
  },
  bookingsList: {
    flex: 1,
  },
  bookingCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  bookingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  restaurantName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  confirmedBadge: {
    backgroundColor: '#4CAF50',
  },
  pendingBadge: {
    backgroundColor: '#FF9800',
  },
  statusText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  bookingDetails: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  discount: {
    fontSize: 14,
    color: '#4CAF50',
    fontWeight: 'bold',
  },
}); 