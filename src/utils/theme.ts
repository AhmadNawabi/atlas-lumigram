import { Dimensions, StyleSheet } from 'react-native';

export interface Theme {
  colors: {
    primary: string;
    background: string;
    surface: string;
    text: string;
    textSecondary: string;
    border: string;
    error: string;
    success: string;
    warning: string;
    info: string;
  };
  spacing: {
    xs: number;
    sm: number;
    md: number;
    lg: number;
    xl: number;
  };
  typography: {
    h1: {
      fontSize: number;
      fontWeight: '400' | '500' | '600' | '700';
      lineHeight: number;
    };
    h2: {
      fontSize: number;
      fontWeight: '400' | '500' | '600' | '700';
      lineHeight: number;
    };
    body: {
      fontSize: number;
      fontWeight: '400' | '500' | '600' | '700';
      lineHeight: number;
    };
    caption: {
      fontSize: number;
      fontWeight: '400' | '500' | '600' | '700';
      lineHeight: number;
    };
  };
}

// Light theme colors - explicitly defined
export const lightTheme: Theme = {
  colors: {
    primary: '#007AFF',
    background: '#FFFFFF',
    surface: '#F2F2F7',
    text: '#000000',
    textSecondary: '#8E8E93',
    border: '#C6C6C8',
    error: '#FF3B30',
    success: '#34C759',
    warning: '#FF9500',
    info: '#5856D6',
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
  },
  typography: {
    h1: {
      fontSize: 34,
      fontWeight: '700',
      lineHeight: 41,
    },
    h2: {
      fontSize: 28,
      fontWeight: '600',
      lineHeight: 34,
    },
    body: {
      fontSize: 17,
      fontWeight: '400',
      lineHeight: 22,
    },
    caption: {
      fontSize: 13,
      fontWeight: '400',
      lineHeight: 18,
    },
  },
};

// Dark theme colors
export const darkTheme: Theme = {
  colors: {
    primary: '#0A84FF',
    background: '#000000',
    surface: '#1C1C1E',
    text: '#FFFFFF',
    textSecondary: '#98989E',
    border: '#38383A',
    error: '#FF453A',
    success: '#32D74B',
    warning: '#FF9F0A',
    info: '#5E5CE6',
  },
  spacing: lightTheme.spacing,
  typography: lightTheme.typography,
};

// Helper function to create styles based on theme
export const createStyles = (theme: Theme) => {
  const { width } = Dimensions.get('window');
  const IMAGE_SIZE = (width - 32) / 3;

  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    centered: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    logoContainer: {
      alignItems: 'center',
      marginBottom: theme.spacing.xl,
    },
    logo: {
      width: 120,
      height: 120,
      marginBottom: theme.spacing.md,
    },
    title: {
      fontSize: 32,
      fontWeight: 'bold',
      color: theme.colors.text,
      marginBottom: theme.spacing.xs,
    },
    subtitle: {
      fontSize: 16,
      color: theme.colors.textSecondary,
    },
    form: {
      width: '100%',
      maxWidth: 400,
      alignSelf: 'center',
      padding: theme.spacing.md,
    },
    inputContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      borderWidth: 1,
      borderColor: theme.colors.border,
      borderRadius: 8,
      marginBottom: theme.spacing.sm,
      backgroundColor: theme.colors.surface,
    },
    inputIcon: {
      padding: theme.spacing.md,
    },
    input: {
      flex: 1,
      padding: theme.spacing.md,
      color: theme.colors.text,
      fontSize: 16,
    },
    inputError: {
      borderColor: theme.colors.error,
    },
    eyeIcon: {
      padding: theme.spacing.md,
    },
    errorText: {
      color: theme.colors.error,
      fontSize: 12,
      marginBottom: theme.spacing.sm,
      marginLeft: theme.spacing.sm,
    },
    button: {
      backgroundColor: theme.colors.primary,
      padding: theme.spacing.md,
      borderRadius: 8,
      alignItems: 'center',
      marginTop: theme.spacing.md,
    },
    buttonDisabled: {
      opacity: 0.5,
    },
    buttonText: {
      color: '#FFFFFF',
      fontSize: 16,
      fontWeight: '600',
    },
    linkButton: {
      padding: theme.spacing.md,
      alignItems: 'center',
    },
    linkText: {
      color: theme.colors.primary,
      fontSize: 14,
    },
    loadingFooter: {
      paddingVertical: theme.spacing.lg,
    },
    emptyContainer: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: theme.spacing.xl,
    },
    emptyText: {
      fontSize: 18,
      fontWeight: '600',
      color: theme.colors.text,
      marginTop: theme.spacing.md,
    },
    emptySubtext: {
      fontSize: 14,
      color: theme.colors.textSecondary,
      textAlign: 'center',
      marginTop: theme.spacing.sm,
    },
    listContent: {
      padding: theme.spacing.md,
    },
    addPostContainer: {
      flex: 1,
      padding: theme.spacing.md,
    },
    imagePickerContainer: {
      flexDirection: 'row',
      justifyContent: 'space-around',
      marginVertical: theme.spacing.xl,
    },
    imagePickerButton: {
      alignItems: 'center',
      padding: theme.spacing.lg,
      backgroundColor: theme.colors.surface,
      borderRadius: 12,
      width: '45%',
    },
    imagePickerText: {
      color: theme.colors.primary,
      marginTop: theme.spacing.sm,
      fontSize: 14,
      fontWeight: '500',
    },
    selectedImageContainer: {
      position: 'relative',
      marginBottom: theme.spacing.lg,
    },
    selectedImage: {
      width: '100%',
      height: 300,
      borderRadius: 12,
    },
    removeImageButton: {
      position: 'absolute',
      top: 10,
      right: 10,
      backgroundColor: 'rgba(0,0,0,0.5)',
      borderRadius: 15,
    },
    captionInput: {
      minHeight: 100,
      textAlignVertical: 'top',
      borderWidth: 1,
      borderColor: theme.colors.border,
      borderRadius: 8,
      padding: theme.spacing.md,
      marginBottom: theme.spacing.md,
      backgroundColor: theme.colors.surface,
      color: theme.colors.text,
    },
    progressContainer: {
      height: 30,
      backgroundColor: theme.colors.surface,
      borderRadius: 15,
      overflow: 'hidden',
      marginBottom: theme.spacing.md,
    },
    progressBar: {
      height: '100%',
      backgroundColor: theme.colors.primary,
    },
    progressText: {
      position: 'absolute',
      width: '100%',
      textAlign: 'center',
      lineHeight: 30,
      color: '#fff',
      fontSize: 12,
      fontWeight: '600',
    },
    profileHeader: {
      padding: theme.spacing.md,
    },
    profileInfo: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: theme.spacing.md,
    },
    profileImageContainer: {
      position: 'relative',
      marginRight: theme.spacing.lg,
    },
    profileImage: {
      width: 80,
      height: 80,
      borderRadius: 40,
    },
    profileImagePlaceholder: {
      backgroundColor: theme.colors.surface,
      justifyContent: 'center',
      alignItems: 'center',
    },
    editBadge: {
      position: 'absolute',
      bottom: 0,
      right: 0,
      backgroundColor: theme.colors.primary,
      width: 24,
      height: 24,
      borderRadius: 12,
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 2,
      borderColor: theme.colors.background,
    },
    profileStats: {
      flex: 1,
      flexDirection: 'row',
      justifyContent: 'space-around',
    },
    statItem: {
      alignItems: 'center',
    },
    statNumber: {
      fontSize: 18,
      fontWeight: 'bold',
      color: theme.colors.text,
    },
    statLabel: {
      fontSize: 12,
      color: theme.colors.textSecondary,
    },
    username: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.colors.text,
      marginBottom: theme.spacing.md,
    },
    editProfileButton: {
      borderWidth: 1,
      borderColor: theme.colors.border,
      borderRadius: 5,
      padding: theme.spacing.sm,
      alignItems: 'center',
    },
    editProfileButtonText: {
      color: theme.colors.text,
      fontSize: 14,
      fontWeight: '500',
    },
    profileContent: {
      paddingBottom: theme.spacing.md,
    },
    gridItem: {
      width: IMAGE_SIZE,
      height: IMAGE_SIZE,
      margin: 1,
    },
    gridImage: {
      width: '100%',
      height: '100%',
    },
    emptyGrid: {
      alignItems: 'center',
      justifyContent: 'center',
      padding: theme.spacing.xl,
      width: '100%',
    },
    editProfileContainer: {
      padding: theme.spacing.lg,
    },
    profileImageEdit: {
      width: 120,
      height: 120,
      borderRadius: 60,
      alignSelf: 'center',
      marginBottom: theme.spacing.sm,
    },
    cameraIconContainer: {
      position: 'absolute',
      bottom: 0,
      right: 0,
      backgroundColor: theme.colors.primary,
      width: 36,
      height: 36,
      borderRadius: 18,
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 3,
      borderColor: theme.colors.background,
    },
    changePhotoText: {
      textAlign: 'center',
      color: theme.colors.primary,
      fontSize: 14,
      marginBottom: theme.spacing.lg,
    },
    label: {
      fontSize: 14,
      fontWeight: '600',
      color: theme.colors.text,
      marginBottom: theme.spacing.xs,
    },
    disabledInput: {
      backgroundColor: theme.colors.surface,
      opacity: 0.7,
    },
    buttonContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginTop: theme.spacing.xl,
    },
    cancelButton: {
      backgroundColor: 'transparent',
      borderWidth: 1,
      borderColor: theme.colors.border,
      flex: 1,
      marginRight: theme.spacing.sm,
    },
    cancelButtonText: {
      color: theme.colors.text,
    },
    searchContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: theme.spacing.sm,
      margin: theme.spacing.md,
      backgroundColor: theme.colors.surface,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    searchInput: {
      flex: 1,
      padding: theme.spacing.sm,
      color: theme.colors.text,
      fontSize: 16,
      marginLeft: theme.spacing.xs,
    },
    searchResults: {
      padding: theme.spacing.md,
    },
    userItem: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: theme.spacing.md,
      backgroundColor: theme.colors.surface,
      borderRadius: 8,
      marginBottom: theme.spacing.sm,
    },
    userAvatar: {
      width: 50,
      height: 50,
      borderRadius: 25,
      marginRight: theme.spacing.md,
    },
    userAvatarPlaceholder: {
      backgroundColor: theme.colors.primary,
      justifyContent: 'center',
      alignItems: 'center',
    },
    userAvatarText: {
      color: '#FFFFFF',
      fontSize: 20,
      fontWeight: 'bold',
    },
    userInfo: {
      flex: 1,
    },
    userName: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.colors.text,
      marginBottom: 4,
    },
    userEmail: {
      fontSize: 14,
      color: theme.colors.textSecondary,
    },
    captionCount: {
    fontSize: 12,
    textAlign: 'right',
    marginBottom: theme.spacing.sm,
    marginRight: theme.spacing.xs,
    },
  });
};
