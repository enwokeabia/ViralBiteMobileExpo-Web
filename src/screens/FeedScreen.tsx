import React from 'react';
import { View, StyleSheet } from 'react-native';
import RestaurantFeed from '../components/RestaurantFeed';

interface FeedScreenProps {
  onShowAuth: (mode?: 'signin' | 'signup') => void;
}

export default function FeedScreen({ onShowAuth }: FeedScreenProps) {
  return (
    <View style={styles.container}>
      <RestaurantFeed onShowAuth={onShowAuth} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'black',
  },
}); 