import React from 'react';
import { Image, StyleSheet } from 'react-native';

interface ShareIconProps {
  size?: number;
  color?: string;
}

export default function ShareIcon({ size = 24, color = 'white' }: ShareIconProps) {
  return (
    <Image
      source={require('../../assets/share-arrow.png')}
      style={[
        styles.icon,
        {
          width: size,
          height: size,
          tintColor: color,
        },
      ]}
      resizeMode="contain"
    />
  );
}

const styles = StyleSheet.create({
  icon: {
    width: 30,
    height: 30,
  },
});
