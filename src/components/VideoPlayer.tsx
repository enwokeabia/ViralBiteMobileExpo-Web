import React, { useEffect, useRef } from 'react';
import { Video, ResizeMode } from 'expo-av';
import { useSoundContext } from '../contexts/SoundContext';

interface VideoPlayerProps {
  source: { uri: string };
  style: any;
  shouldPlay: boolean;
  isCurrentVideo: boolean;
  vibe: string; // e.g., 'dining', 'brunch', 'happy-hour'
}

export default function VideoPlayer({ source, style, shouldPlay, isCurrentVideo, vibe }: VideoPlayerProps) {
  const videoRef = useRef<Video>(null);
  const { isMuted, activeVibe } = useSoundContext();
  
  // Video should be muted if: globally muted OR not in the active vibe
  const shouldBeMuted = isMuted || activeVibe !== vibe;

  // Update video mute state when global mute state or active vibe changes
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.setIsMutedAsync(shouldBeMuted);
    }
  }, [shouldBeMuted, isCurrentVideo]);

  return (
    <Video
      ref={videoRef}
      source={source}
      style={style}
      shouldPlay={shouldPlay}
      isLooping
      isMuted={shouldBeMuted}
      resizeMode={ResizeMode.COVER}
      useNativeControls={false}
      volume={shouldBeMuted ? 0 : 1}
    />
  );
}
