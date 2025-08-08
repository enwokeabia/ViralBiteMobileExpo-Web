import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, Alert, ScrollView } from 'react-native';
import { addAllRestaurants, checkExistingRestaurants, clearAllRestaurants } from '../utils/manualData';
import { testFirebaseConnection, testAddRestaurant } from '../utils/testConnection';

export default function AdminScreen() {
  const [isSeeding, setIsSeeding] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [restaurantCount, setRestaurantCount] = useState(0);

  useEffect(() => {
    checkRestaurants();
  }, []);

  const checkRestaurants = async () => {
    setIsChecking(true);
    try {
      const restaurants = await checkExistingRestaurants();
      setRestaurantCount(restaurants.length);
    } catch (error) {
      console.error('Error checking restaurants:', error);
    } finally {
      setIsChecking(false);
    }
  };

  const handleAddRestaurants = async () => {
    setIsSeeding(true);
    try {
      const results = await addAllRestaurants();
      const successCount = results.filter(r => r.success).length;
      
      Alert.alert(
        '✅ Success!',
        `Added ${successCount} restaurants to the database. Check your feed now!`,
        [{ text: 'OK' }]
      );
      
      // Refresh count
      await checkRestaurants();
    } catch (error) {
      Alert.alert(
        '❌ Error',
        'Failed to add restaurants. Check console for details.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsSeeding(false);
    }
  };

  const handleClearRestaurants = async () => {
    setIsClearing(true);
    try {
      await clearAllRestaurants();
      setRestaurantCount(0);
      Alert.alert(
        '🧹 Cleared!',
        'All restaurants have been removed from the database.',
        [{ text: 'OK' }]
      );
    } catch (error) {
      Alert.alert(
        '❌ Error',
        'Failed to clear restaurants. Check console for details.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsClearing(false);
    }
  };

  const handleTestConnection = async () => {
    setIsTesting(true);
    try {
      const result = await testFirebaseConnection();
      if (result.success) {
        Alert.alert(
          '✅ Connection Test Passed!',
          `Firebase is working! Found ${result.restaurantCount} restaurants.`,
          [{ text: 'OK' }]
        );
      } else {
        Alert.alert(
          '❌ Connection Test Failed',
          'Check console for details.',
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      Alert.alert(
        '❌ Test Error',
        'Connection test failed.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsTesting(false);
    }
  };

  const handleTestRestaurant = async () => {
    setIsTesting(true);
    try {
      const result = await testAddRestaurant();
      if (result.success) {
        Alert.alert(
          '✅ Restaurant Test Passed!',
          'Test restaurant added successfully!',
          [{ text: 'OK' }]
        );
        await checkRestaurants(); // Refresh count
      } else {
        Alert.alert(
          '❌ Restaurant Test Failed',
          'Check console for details.',
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      Alert.alert(
        '❌ Test Error',
        'Restaurant test failed.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>🍽️ Admin Panel</Text>
        <Text style={styles.subtitle}>Database Management</Text>
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🔧 Testing & Debugging</Text>
          <Text style={styles.description}>
            Test your Firebase connection and basic operations before adding data.
          </Text>
          
          <Pressable
            style={[styles.testButton, isTesting && styles.buttonDisabled]}
            onPress={handleTestConnection}
            disabled={isTesting}
          >
            <Text style={styles.testButtonText}>
              {isTesting ? '🔍 Testing...' : '🔍 Test Connection'}
            </Text>
          </Pressable>
          
          <Pressable
            style={[styles.testButton, isTesting && styles.buttonDisabled]}
            onPress={handleTestRestaurant}
            disabled={isTesting}
          >
            <Text style={styles.testButtonText}>
              {isTesting ? '🍽️ Testing...' : '🍽️ Test Restaurant'}
            </Text>
          </Pressable>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📊 Sample Data</Text>
          <Text style={styles.description}>
            Add sample restaurant data to Firebase. This will create 5 restaurants.
          </Text>
          
          <Text style={styles.statusText}>
            Current restaurants in database: {restaurantCount}
          </Text>
          
          <Pressable
            style={[styles.button, isSeeding && styles.buttonDisabled]}
            onPress={handleAddRestaurants}
            disabled={isSeeding}
          >
            <Text style={styles.buttonText}>
              {isSeeding ? '🌱 Adding...' : '🌱 Add Restaurants'}
            </Text>
          </Pressable>
          
          <Pressable
            style={[styles.clearButton, isClearing && styles.buttonDisabled]}
            onPress={handleClearRestaurants}
            disabled={isClearing}
          >
            <Text style={styles.clearButtonText}>
              {isClearing ? '🧹 Clearing...' : '🧹 Clear All'}
            </Text>
          </Pressable>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🌐 Web Admin Portal</Text>
          <Text style={styles.description}>
            For creating restaurants with vibe functionality, use the separate web admin portal:
          </Text>
          <Text style={styles.webPortalInfo}>
            📱 Open your browser and go to: {'\n'}
            <Text style={styles.webPortalUrl}>https://viralbitemobileadmin.vercel.app</Text>
          </Text>
          <Text style={styles.description}>
            The web portal allows you to create restaurants with full vibe support (Dining, Brunch, Happy Hour).
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>What's Included</Text>
          <View style={styles.featureList}>
            <Text style={styles.featureItem}>✅ 8 Restaurants (Modern American, Japanese, Italian, Mexican, Thai)</Text>
            <Text style={styles.featureItem}>✅ Real video URLs from Firebase Storage</Text>
            <Text style={styles.featureItem}>✅ Time slots for today and tomorrow</Text>
            <Text style={styles.featureItem}>✅ Discounts ranging from 15% to 45%</Text>
            <Text style={styles.featureItem}>✅ Ratings, price ranges, and descriptions</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Next Steps</Text>
          <Text style={styles.description}>
            After seeding, go back to the Feed tab to see the restaurants. You can also:
          </Text>
          <View style={styles.featureList}>
            <Text style={styles.featureItem}>• Test the vibe filters (Dining, Brunch, Happy Hour)</Text>
            <Text style={styles.featureItem}>• Try booking a table</Text>
            <Text style={styles.featureItem}>• Check the Bookings tab</Text>
            <Text style={styles.featureItem}>• Use the web admin portal for vibe-specific restaurants</Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  content: {
    padding: 20,
    paddingTop: 80,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 30,
  },
  section: {
    marginBottom: 30,
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 12,
  },
  description: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 16,
  },
  button: {
    backgroundColor: '#007AFF',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
  },
  buttonDisabled: {
    backgroundColor: '#ccc',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  featureList: {
    marginTop: 8,
  },
  featureItem: {
    fontSize: 14,
    color: '#666',
    marginBottom: 6,
    lineHeight: 20,
  },
  statusText: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 16,
  },
  clearButton: {
    backgroundColor: '#FF3B30',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 12,
  },
  clearButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  testButton: {
    backgroundColor: '#34C759',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 12,
  },
  testButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  webPortalInfo: {
    fontSize: 14,
    color: '#007AFF',
    lineHeight: 20,
    marginBottom: 16,
    textAlign: 'center',
  },
  webPortalUrl: {
    fontWeight: 'bold',
    textDecorationLine: 'underline',
  },
}); 