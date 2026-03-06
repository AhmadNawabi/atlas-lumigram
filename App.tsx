import React, { useEffect, useState } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { ThemeProvider } from './src/contexts/ThemeContext';
import { AuthProvider } from './src/contexts/AuthContext';
import AppNavigator from './src/navigation';
import FlashMessage from 'react-native-flash-message';
import { StatusBar, LogBox, View, Text } from 'react-native';
import { useTheme } from './src/hooks/useTheme';
import * as SplashScreen from 'expo-splash-screen';
import { loadFonts } from './src/utils/fonts';
import { initializeFirebase } from './src/services/firebase';

// Ignore specific warnings
LogBox.ignoreLogs([
  'props.pointerEvents is deprecated',
  '"shadow*" style props are deprecated',
  'Image: style.tintColor is deprecated',
  'TouchableWithoutFeedback is deprecated',
  'Animated: `useNativeDriver` is not supported',
]);

// Keep splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync();

function AppContent() {
  const { theme } = useTheme();
  
  return (
    <>
      <StatusBar
        barStyle={theme.isDark ? 'light-content' : 'dark-content'}
        backgroundColor={theme.colors.background}
      />
      <AppNavigator />
      <FlashMessage 
        position="top"
        floating
        statusBarHeight={StatusBar.currentHeight}
        style={{
          marginTop: StatusBar.currentHeight,
          borderRadius: 10,
        }}
        titleStyle={{
          fontSize: 16,
          fontWeight: '600',
        }}
        textStyle={{
          fontSize: 14,
        }}
      />
    </>
  );
}

export default function App() {
  const [appIsReady, setAppIsReady] = useState(false);

  useEffect(() => {
    async function prepare() {
      try {
        // Initialize Firebase
        initializeFirebase();
        
        // Load fonts
        await loadFonts();
        
        // Small delay for smooth transition
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (e) {
        console.warn('Error loading app:', e);
      } finally {
        setAppIsReady(true);
        await SplashScreen.hideAsync();
      }
    }

    prepare();
  }, []);

  if (!appIsReady) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' }}>
        <Text>Loading Lumigram...</Text>
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ThemeProvider>
          <AuthProvider>
            <AppContent />
          </AuthProvider>
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
