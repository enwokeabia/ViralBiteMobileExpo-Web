import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface SoundContextType {
  isMuted: boolean;
  toggleMute: () => void;
  setMuted: (muted: boolean) => void;
  activeVibe: string;
  setActiveVibe: (vibe: string) => void;
}

const SoundContext = createContext<SoundContextType | undefined>(undefined);

export const useSoundContext = () => {
  const context = useContext(SoundContext);
  if (!context) {
    throw new Error('useSoundContext must be used within a SoundProvider');
  }
  return context;
};

interface SoundProviderProps {
  children: ReactNode;
}

const SOUND_PREFERENCE_KEY = '@viralbite_sound_muted';

export const SoundProvider: React.FC<SoundProviderProps> = ({ children }) => {
  const [isMuted, setIsMuted] = useState(false); // Default: unmuted
  const [activeVibe, setActiveVibe] = useState('dining'); // Default: dining

  // Load sound preference on app start
  useEffect(() => {
    const loadSoundPreference = async () => {
      try {
        const savedPreference = await AsyncStorage.getItem(SOUND_PREFERENCE_KEY);
        if (savedPreference !== null) {
          setIsMuted(JSON.parse(savedPreference));
        }
      } catch (error) {
        console.log('Error loading sound preference:', error);
      }
    };

    loadSoundPreference();
  }, []);

  // Save preference whenever it changes
  const saveSoundPreference = async (muted: boolean) => {
    try {
      await AsyncStorage.setItem(SOUND_PREFERENCE_KEY, JSON.stringify(muted));
    } catch (error) {
      console.log('Error saving sound preference:', error);
    }
  };

  const toggleMute = () => {
    const newMutedState = !isMuted;
    setIsMuted(newMutedState);
    saveSoundPreference(newMutedState);
  };

  const setMuted = (muted: boolean) => {
    setIsMuted(muted);
    saveSoundPreference(muted);
  };

  const value: SoundContextType = {
    isMuted,
    toggleMute,
    setMuted,
    activeVibe,
    setActiveVibe,
  };

  return (
    <SoundContext.Provider value={value}>
      {children}
    </SoundContext.Provider>
  );
};
