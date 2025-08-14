import React, { useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import TabNavigator from './src/navigation/TabNavigator';
import SplashScreen from './src/components/SplashScreen';
import AuthModal from './src/components/AuthModal';
import { AuthProvider } from './src/contexts/AuthContext';
import { SoundProvider } from './src/contexts/SoundContext';

export default function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [authModalVisible, setAuthModalVisible] = useState(false);
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin');

  const handleSplashFinish = () => {
    setIsLoading(false);
  };

  const handleShowAuth = (mode?: 'signin' | 'signup') => {
    setAuthMode(mode || 'signin');
    setAuthModalVisible(true);
  };

  const handleAuthClose = () => {
    setAuthModalVisible(false);
  };

  const handleAuthSuccess = () => {
    setAuthModalVisible(false);
  };

  if (isLoading) {
    return <SplashScreen onFinish={handleSplashFinish} />;
  }

  return (
    <SafeAreaProvider>
      <SoundProvider>
        <AuthProvider>
          <NavigationContainer>
            <TabNavigator onShowAuth={handleShowAuth} />
            <AuthModal
              visible={authModalVisible}
              onClose={handleAuthClose}
              onSuccess={handleAuthSuccess}
              initialMode={authMode}
            />
          </NavigationContainer>
        </AuthProvider>
      </SoundProvider>
    </SafeAreaProvider>
  );
}