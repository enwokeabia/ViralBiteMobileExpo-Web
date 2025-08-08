import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

interface AuthGateProps {
  title: string;
  subtitle: string;
  ctaText: string;
  onSignIn: () => void;
  icon?: string;
  gradient?: string[];
}

export default function AuthGate({ 
  title, 
  subtitle, 
  ctaText, 
  onSignIn, 
  icon = 'lock-closed',
  gradient = ['#5500DB', '#C384FF']
}: AuthGateProps) {
  return (
    <View style={styles.container}>
      <LinearGradient
        colors={gradient as [string, string]}
        style={styles.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.content}>
          {/* Icon */}
          <View style={styles.iconContainer}>
            <Ionicons name={icon as any} size={48} color="white" />
          </View>

          {/* Title */}
          <Text style={styles.title}>{title}</Text>

          {/* Subtitle */}
          <Text style={styles.subtitle}>{subtitle}</Text>

          {/* Benefits */}
          <View style={styles.benefitsContainer}>
            <View style={styles.benefitItem}>
              <Ionicons name="checkmark-circle" size={20} color="white" />
              <Text style={styles.benefitText}>Save up to 50% on meals</Text>
            </View>
            <View style={styles.benefitItem}>
              <Ionicons name="checkmark-circle" size={20} color="white" />
              <Text style={styles.benefitText}>Track your dining history</Text>
            </View>
            <View style={styles.benefitItem}>
              <Ionicons name="checkmark-circle" size={20} color="white" />
              <Text style={styles.benefitText}>Exclusive member perks</Text>
            </View>
          </View>

          {/* CTA Button */}
          <Pressable style={styles.ctaButton} onPress={onSignIn}>
            <LinearGradient
              colors={['rgba(255,255,255,0.2)', 'rgba(255,255,255,0.1)']}
              style={styles.ctaGradient}
            >
              <Text style={styles.ctaText}>{ctaText}</Text>
              <Ionicons name="arrow-forward" size={20} color="white" />
            </LinearGradient>
          </Pressable>

          {/* Footer text */}
          <Text style={styles.footerText}>
            Join thousands of food lovers saving money on great meals
          </Text>
        </View>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  content: {
    alignItems: 'center',
    maxWidth: 300,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
    marginBottom: 12,
    lineHeight: 34,
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 22,
  },
  benefitsContainer: {
    marginBottom: 40,
    width: '100%',
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  benefitText: {
    color: 'white',
    fontSize: 16,
    marginLeft: 12,
    fontWeight: '500',
  },
  ctaButton: {
    width: '100%',
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 24,
  },
  ctaGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
  },
  ctaText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    marginRight: 8,
  },
  footerText: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
});
