// ==============================
// File: RestaurantFeed.tsx
// TikTok-style: Horizontal Pager (contexts) + Vertical paged feeds
// ==============================
import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Dimensions, ScrollView, Pressable, Animated } from 'react-native';
import { GestureHandlerRootView, NativeViewGestureHandler } from 'react-native-gesture-handler';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import PagerView from 'react-native-pager-view';
import VerticalFeed from './VerticalFeed';

const { height: screenHeight, width: screenWidth } = Dimensions.get('window');

const VIBES = ['Dining', 'Brunch', 'Happy Hour'] as const;
type VibeLabel = typeof VIBES[number];

// Constants for tab layout
const TAB_COUNT = VIBES.length;
const TAB_WIDTH = screenWidth / TAB_COUNT;
const underlineW = 40;

interface RestaurantFeedProps {
  onShowAuth: (mode?: 'signin' | 'signup') => void;
}

export default function RestaurantFeed({ onShowAuth }: RestaurantFeedProps) {
  const [selectedVibe, setSelectedVibe] = useState<VibeLabel>('Dining');
  const [selectedCuisine, setSelectedCuisine] = useState('All');

  // Safe area insets
  const insets = useSafeAreaInsets();

  // pager state
  const pagerRef = useRef<PagerView>(null);
  const [page, setPage] = useState<number>(0);

  // continuous underline animation
  const scrollX = useRef(new Animated.Value(0)).current;
  const underlineTranslateX = scrollX.interpolate({
    inputRange: [0, TAB_COUNT - 1],
    outputRange: [
      (TAB_WIDTH - underlineW) / 2,
      (TAB_WIDTH - underlineW) / 2 + TAB_WIDTH * (TAB_COUNT - 1)
    ],
    extrapolate: 'clamp',
  });

  useEffect(() => {
    const i = VIBES.indexOf(selectedVibe);
    if (i !== page) {
      pagerRef.current?.setPage(i);
      setPage(i);
    }
  }, [selectedVibe]);

  const handleTabPress = (v: VibeLabel) => {
    setSelectedVibe(v);
  };

  const cuisineTypes = ['All', 'Modern American', 'Japanese', 'Italian', 'Mexican', 'Thai'];

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      {/* Top gradient for readability */}
      <LinearGradient
        colors={['rgba(0,0,0,0.95)', 'transparent']}
        style={{
          position: 'absolute',
          top: -insets.top,
          left: 0,
          right: 0,
          height: insets.top + 80,
          zIndex: 999,
        }}
        pointerEvents="none"
      />

      {/* Vibe Tabs */}
      <View style={[styles.vibeFilterContainer, { top: insets.top + 8 }]}>
        <View style={styles.vibeFilterRow}>
          {VIBES.map((v) => (
            <Pressable 
              key={v} 
              style={[styles.vibeFilterItem, { width: TAB_WIDTH, height: 36 }]} 
              onPress={() => handleTabPress(v)}
            >
              <Text style={[styles.vibeFilterText, selectedVibe === v && styles.vibeFilterTextActive]}>{v}</Text>
            </Pressable>
          ))}
        </View>
        {/* continuous animated underline */}
        <Animated.View
          style={[
            styles.vibeFilterUnderline,
            { 
              width: underlineW, 
              transform: [{ translateX: underlineTranslateX }],
              position: 'absolute',
              bottom: 6,
            },
          ]}
        />
      </View>

      {/* Cuisine Filters - Only show when Dining is selected */}
      {selectedVibe === 'Dining' && (
        <View style={[styles.filterContainer, { top: insets.top + 8 + 36 + 8 }]}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
            {cuisineTypes.map((cuisine) => (
              <Pressable
                key={cuisine}
                style={[styles.filterChip, selectedCuisine === cuisine && styles.filterChipSelected]}
                onPress={() => setSelectedCuisine(cuisine)}
              >
                <Text style={[styles.filterText, selectedCuisine === cuisine && styles.filterTextSelected]}>{cuisine}</Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>
      )}

      {/* Horizontal Pager for contexts (Dining / Brunch / Happy Hour) */}
      <PagerView
        ref={pagerRef}
        style={{ flex: 1 }}
        initialPage={0}
        onPageScroll={(e) => {
          const { position, offset } = e.nativeEvent;
          scrollX.setValue(position + offset);
        }}
        onPageSelected={(e) => {
          const i = e.nativeEvent.position;
          setPage(i);
          setSelectedVibe(VIBES[i]);
        }}
        overScrollMode="never"
      >
        <View key="dining" style={{ flex: 1 }}>
          <VerticalFeed
            vibe="dining"
            selectedCuisine={selectedCuisine}
            onShowAuth={onShowAuth}
          />
        </View>
        <View key="brunch" style={{ flex: 1 }}>
          <VerticalFeed
            vibe="brunch"
            selectedCuisine={undefined} // cuisine ignored for brunch for now
            onShowAuth={onShowAuth}
          />
        </View>
        <View key="happy-hour" style={{ flex: 1 }}>
          <VerticalFeed
            vibe="happy-hour"
            selectedCuisine={undefined}
            onShowAuth={onShowAuth}
          />
        </View>
      </PagerView>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  vibeFilterContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    zIndex: 1000,
    paddingHorizontal: 16,
  },
  vibeFilterRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  vibeFilterItem: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    alignItems: 'center',
    position: 'relative',
  },
  vibeFilterText: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 16,
    fontWeight: '600',
  },
  vibeFilterTextActive: {
    color: 'white',
    fontWeight: 'bold',
  },
  vibeFilterUnderline: {
    height: 2,
    backgroundColor: 'white',
    borderRadius: 1,
  },
  filterContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    zIndex: 1000,
    paddingHorizontal: 16,
  },
  filterScroll: {
    flexGrow: 0,
  },
  filterChip: {
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginHorizontal: 4,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
    minWidth: 70,
  },
  filterChipSelected: {
    backgroundColor: 'white',
    borderColor: 'white',
  },
  filterText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'center',
  },
  filterTextSelected: {
    color: 'black',
  },
});