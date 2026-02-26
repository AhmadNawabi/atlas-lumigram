import * as Font from 'expo-font';

export const loadFonts = async () => {
  try {
    await Font.loadAsync({
      // Add any custom fonts here if needed
      // If you don't have custom fonts, this can be a no-op function
    });
    console.log('Fonts loaded successfully');
  } catch (error) {
    console.error('Error loading fonts:', error);
  }
};
