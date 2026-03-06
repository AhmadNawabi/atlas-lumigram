import { Dimensions, StyleSheet } from 'react-native';

export interface Theme {
  isDark: boolean;
  colors: {
    primary: string;
    primaryLight: string;
    primaryDark: string;
    background: string;
    surface: string;
    surfaceLight: string;
    text: string;
    textSecondary: string;
    textTertiary: string;
    border: string;
    error: string;
    errorLight: string;
    success: string;
    successLight: string;
    warning: string;
    warningLight: string;
    info: string;
    infoLight: string;
    card: string;
    shadow: string;
  };
  spacing: {
    xs: number;
    sm: number;
    md: number;
    lg: number;
    xl: number;
    xxl: number;
  };
  borderRadius: {
    sm: number;
    md: number;
    lg: number;
    xl: number;
    round: number;
  };
  typography: {
    h1: { fontSize: number; fontWeight: any; lineHeight: number; };
    h2: { fontSize: number; fontWeight: any; lineHeight: number; };
    h3: { fontSize: number; fontWeight: any; lineHeight: number; };
    body: { fontSize: number; fontWeight: any; lineHeight: number; };
    bodySmall: { fontSize: number; fontWeight: any; lineHeight: number; };
    caption: { fontSize: number; fontWeight: any; lineHeight: number; };
  };
  shadows: {
    sm: any;
    md: any;
    lg: any;
  };
}

// Light theme
export const lightTheme: Theme = {
  isDark: false,
  colors: {
    primary: '#0095F6',
    primaryLight: '#4CB5F9',
    primaryDark: '#0074CC',
    background: '#FAFAFA',
    surface: '#FFFFFF',
    surfaceLight: '#F8F8F8',
    text: '#262626',
    textSecondary: '#8E8E8E',
    textTertiary: '#C7C7C7',
    border: '#DBDBDB',
    error: '#ED4956',
    errorLight: '#FFE2E4',
    success: '#00C853',
    successLight: '#D4EDDA',
    warning: '#FFB83B',
    warningLight: '#FFF3E0',
    info: '#5856D6',
    infoLight: '#E8E8FF',
    card: '#FFFFFF',
    shadow: '#000000',
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48,
  },
  borderRadius: {
    sm: 4,
    md: 8,
    lg: 12,
    xl: 20,
    round: 999,
  },
  typography: {
    h1: { fontSize: 34, fontWeight: '700', lineHeight: 41 },
    h2: { fontSize: 28, fontWeight: '600', lineHeight: 34 },
    h3: { fontSize: 22, fontWeight: '600', lineHeight: 28 },
    body: { fontSize: 16, fontWeight: '400', lineHeight: 22 },
    bodySmall: { fontSize: 14, fontWeight: '400', lineHeight: 20 },
    caption: { fontSize: 12, fontWeight: '400', lineHeight: 16 },
  },
  shadows: {
    sm: { shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 2 },
    md: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 4 },
    lg: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 8, elevation: 8 },
  },
};

// Dark theme
export const darkTheme: Theme = {
  isDark: true,
  colors: {
    primary: '#0095F6',
    primaryLight: '#4CB5F9',
    primaryDark: '#0074CC',
    background: '#000000',
    surface: '#1C1C1E',
    surfaceLight: '#2C2C2E',
    text: '#FFFFFF',
    textSecondary: '#98989E',
    textTertiary: '#636366',
    border: '#38383A',
    error: '#FF453A',
    errorLight: '#4C2A2C',
    success: '#32D74B',
    successLight: '#1E3A2A',
    warning: '#FF9F0A',
    warningLight: '#4F3B1A',
    info: '#5E5CE6',
    infoLight: '#2C2A4A',
    card: '#1C1C1E',
    shadow: '#000000',
  },
  spacing: lightTheme.spacing,
  borderRadius: lightTheme.borderRadius,
  typography: lightTheme.typography,
  shadows: {
    sm: { shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.2, shadowRadius: 2, elevation: 2 },
    md: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.3, shadowRadius: 4, elevation: 4 },
    lg: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 8, elevation: 8 },
  },
};

// Helper function to create styles
export const createStyles = (theme: Theme) => {
  const { width } = Dimensions.get('window');
  const GRID_SIZE = (width - 32) / 3;

  return StyleSheet.create({
    // Container Styles
    container: { flex: 1, backgroundColor: theme.colors.background },
    centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    
    // Auth Screen Styles
    loginContainer: { flexGrow: 1, justifyContent: 'center', padding: theme.spacing.xl },
    registerContainer: { flexGrow: 1, justifyContent: 'center', padding: theme.spacing.xl },
    logoContainer: { alignItems: 'center', marginBottom: theme.spacing.xl },
    logoWrapper: { 
      width: 100, height: 100, borderRadius: theme.borderRadius.xl, 
      backgroundColor: theme.colors.primary, justifyContent: 'center', 
      alignItems: 'center', marginBottom: theme.spacing.md, ...theme.shadows.md 
    },
    logo: { width: 60, height: 60, tintColor: '#FFFFFF' },
    title: { fontSize: 32, fontWeight: '700', color: theme.colors.text, marginBottom: theme.spacing.xs },
    subtitle: { fontSize: 16, color: theme.colors.textSecondary, textAlign: 'center' },
    
    // Form Styles
    form: { width: '100%' },
    inputContainer: { 
      flexDirection: 'row', alignItems: 'center', borderWidth: 1, 
      borderColor: theme.colors.border, borderRadius: theme.borderRadius.md, 
      backgroundColor: theme.colors.surface, ...theme.shadows.sm 
    },
    inputIcon: { padding: theme.spacing.md },
    input: { flex: 1, padding: theme.spacing.md, color: theme.colors.text, fontSize: 16 },
    inputError: { borderColor: theme.colors.error },
    eyeIcon: { padding: theme.spacing.md },
    errorText: { color: theme.colors.error, fontSize: 12, marginTop: theme.spacing.xs, marginLeft: theme.spacing.sm },
    
    // Button Styles
    loginButton: { 
      backgroundColor: theme.colors.primary, padding: theme.spacing.md, 
      borderRadius: theme.borderRadius.md, alignItems: 'center', marginTop: theme.spacing.lg, ...theme.shadows.md 
    },
    registerButton: { 
      backgroundColor: theme.colors.primary, padding: theme.spacing.md, 
      borderRadius: theme.borderRadius.md, alignItems: 'center', marginTop: theme.spacing.md, ...theme.shadows.md 
    },
    button: {
      backgroundColor: theme.colors.primary,
      padding: theme.spacing.md,
      borderRadius: theme.borderRadius.md,
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: theme.spacing.md,
      ...theme.shadows.md,
    },
    buttonOutline: {
      backgroundColor: 'transparent',
      borderWidth: 1,
      borderColor: theme.colors.primary,
      padding: theme.spacing.md,
      borderRadius: theme.borderRadius.md,
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: theme.spacing.md,
    },
    buttonDisabled: { opacity: 0.5 },
    buttonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '600' },
    
    // Divider
    divider: { flexDirection: 'row', alignItems: 'center', marginVertical: theme.spacing.lg },
    dividerLine: { flex: 1, height: 1, backgroundColor: theme.colors.border },
    dividerText: { marginHorizontal: theme.spacing.md, fontSize: 14, color: theme.colors.textSecondary },
    
    // Links
    registerText: { color: theme.colors.primary, fontSize: 14, fontWeight: '600' },
    loginLink: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: theme.spacing.lg },
    linkText: { fontSize: 14, color: theme.colors.textSecondary },
    
    // Add Post Screen
    addPostContainer: { flex: 1, padding: theme.spacing.lg },
    imagePickerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    imagePickerButton: { 
      alignItems: 'center', padding: theme.spacing.xl, backgroundColor: theme.colors.surface, 
      borderRadius: theme.borderRadius.lg, width: '80%', marginVertical: theme.spacing.md, ...theme.shadows.md 
    },
    imagePickerIconContainer: { 
      width: 80, height: 80, borderRadius: theme.borderRadius.xl, 
      backgroundColor: theme.colors.primaryLight + '20', justifyContent: 'center', 
      alignItems: 'center', marginBottom: theme.spacing.md 
    },
    imagePickerText: { color: theme.colors.primary, fontSize: 16, fontWeight: '600' },
    selectedImageContainer: { position: 'relative', marginBottom: theme.spacing.lg },
    selectedImage: { width: '100%', height: 300, borderRadius: theme.borderRadius.lg },
    removeImageButton: { 
      position: 'absolute', top: 10, right: 10, backgroundColor: 'rgba(0,0,0,0.5)', 
      borderRadius: theme.borderRadius.round, padding: 4 
    },
    captionSection: { flex: 1 },
    captionInput: { 
      minHeight: 100, borderWidth: 1, borderColor: theme.colors.border, 
      borderRadius: theme.borderRadius.md, padding: theme.spacing.md, marginBottom: theme.spacing.sm, 
      backgroundColor: theme.colors.surface, color: theme.colors.text, fontSize: 16, 
      textAlignVertical: 'top', ...theme.shadows.sm 
    },
    captionCount: { fontSize: 12, textAlign: 'right', marginBottom: theme.spacing.md, color: theme.colors.textSecondary },
    progressContainer: { 
      height: 40, backgroundColor: theme.colors.surface, borderRadius: theme.borderRadius.md, 
      overflow: 'hidden', marginBottom: theme.spacing.md, ...theme.shadows.sm 
    },
    progressBar: { height: '100%', backgroundColor: theme.colors.primary },
    progressText: { 
      position: 'absolute', width: '100%', textAlign: 'center', lineHeight: 40, 
      color: '#FFFFFF', fontSize: 14, fontWeight: '600' 
    },
    shareButton: { 
      flexDirection: 'row', backgroundColor: theme.colors.primary, padding: theme.spacing.md, 
      borderRadius: theme.borderRadius.md, alignItems: 'center', justifyContent: 'center', 
      marginTop: theme.spacing.md, ...theme.shadows.md 
    },
    
    // Feed Styles
    feedContainer: { flex: 1 },
    feedList: { padding: theme.spacing.md },
    listContent: { padding: theme.spacing.md },
    loadingFooter: { paddingVertical: theme.spacing.xl, alignItems: 'center' },
    loadingText: { 
      fontSize: 14, 
      textAlign: 'center', 
      marginTop: theme.spacing.sm,
      color: theme.colors.textSecondary 
    },
    
    // Empty States
    emptyContainer: { 
      alignItems: 'center', 
      justifyContent: 'center', 
      padding: theme.spacing.xl,
      minHeight: 400,
    },
    emptyText: { 
      fontSize: 18, 
      fontWeight: '600', 
      color: theme.colors.text, 
      marginTop: theme.spacing.md 
    },
    emptySubtext: { 
      fontSize: 14, 
      color: theme.colors.textSecondary, 
      textAlign: 'center', 
      marginTop: theme.spacing.sm,
      paddingHorizontal: theme.spacing.xl,
    },
    createPostButton: {
      backgroundColor: theme.colors.primary,
      paddingHorizontal: theme.spacing.lg,
      paddingVertical: theme.spacing.md,
      borderRadius: theme.borderRadius.md,
      marginTop: theme.spacing.lg,
      ...theme.shadows.sm,
    },
    createPostButtonText: {
      color: '#FFFFFF',
      fontSize: 16,
      fontWeight: '600',
    },
    
    // Stories Styles
    storiesContainer: {
      paddingHorizontal: theme.spacing.md,
      paddingVertical: theme.spacing.sm,
      flexDirection: 'row',
      backgroundColor: theme.colors.surface,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
    },
    storyGradient: {
      width: 70,
      height: 70,
      borderRadius: 35,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: theme.spacing.sm,
    },
    storyAvatar: {
      width: 64,
      height: 64,
      borderRadius: 32,
      overflow: 'hidden',
      backgroundColor: theme.colors.surface,
    },
    storyImage: {
      width: '100%',
      height: '100%',
    },
    storyPlaceholder: {
      backgroundColor: theme.colors.surfaceLight,
      justifyContent: 'center',
      alignItems: 'center',
    },
    storyText: {
      fontSize: 12,
      textAlign: 'center',
      marginTop: 4,
      color: theme.colors.text,
    },
    
    // Profile Styles
    profileHeader: { padding: theme.spacing.lg },
    profileInfo: { flexDirection: 'row', alignItems: 'center', marginBottom: theme.spacing.lg },
    profileImageContainer: { position: 'relative', marginRight: theme.spacing.xl },
    profileImage: { width: 80, height: 80, borderRadius: theme.borderRadius.round },
    profileImagePlaceholder: { 
      backgroundColor: theme.colors.surface, 
      justifyContent: 'center', 
      alignItems: 'center' 
    },
    editBadge: { 
      position: 'absolute', bottom: 0, right: 0, backgroundColor: theme.colors.primary, 
      width: 24, height: 24, borderRadius: theme.borderRadius.round, 
      justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: theme.colors.background 
    },
    profileStats: { flex: 1, flexDirection: 'row', justifyContent: 'space-around' },
    statItem: { alignItems: 'center' },
    statNumber: { fontSize: 18, fontWeight: '700', color: theme.colors.text },
    statLabel: { fontSize: 12, color: theme.colors.textSecondary, marginTop: theme.spacing.xs },
    username: { fontSize: 16, fontWeight: '600', color: theme.colors.text, marginBottom: theme.spacing.md },
    editProfileButton: { 
      borderWidth: 1, borderColor: theme.colors.border, borderRadius: theme.borderRadius.md, 
      padding: theme.spacing.sm, alignItems: 'center' 
    },
    editProfileButtonText: { color: theme.colors.text, fontSize: 14, fontWeight: '500' },
    profileContent: { paddingBottom: theme.spacing.md },
    
    // Grid Styles
    gridItem: { width: GRID_SIZE, height: GRID_SIZE, margin: 1 },
    gridImage: { width: '100%', height: '100%' },
    emptyGrid: { alignItems: 'center', justifyContent: 'center', padding: theme.spacing.xl, width: '100%' },
    
    // Edit Profile Styles
    editProfileContainer: { padding: theme.spacing.lg },
    profileImageEdit: { 
      width: 120, height: 120, borderRadius: theme.borderRadius.round, 
      alignSelf: 'center', marginBottom: theme.spacing.sm 
    },
    cameraIconContainer: { 
      position: 'absolute', bottom: 0, right: 0, backgroundColor: theme.colors.primary, 
      width: 36, height: 36, borderRadius: theme.borderRadius.round, 
      justifyContent: 'center', alignItems: 'center', borderWidth: 3, borderColor: theme.colors.background 
    },
    changePhotoText: { textAlign: 'center', color: theme.colors.primary, fontSize: 14, marginBottom: theme.spacing.lg },
    label: { fontSize: 14, fontWeight: '600', color: theme.colors.text, marginBottom: theme.spacing.xs },
    disabledInput: { backgroundColor: theme.colors.surfaceLight, opacity: 0.7 },
    buttonContainer: { flexDirection: 'row', justifyContent: 'space-between', marginTop: theme.spacing.xl },
    cancelButton: { 
      backgroundColor: 'transparent', borderWidth: 1, borderColor: theme.colors.border, 
      borderRadius: theme.borderRadius.md, padding: theme.spacing.md, flex: 1, 
      marginRight: theme.spacing.sm, alignItems: 'center' 
    },
    cancelButtonText: { color: theme.colors.text, fontSize: 16, fontWeight: '500' },
    
    // Search Styles
    searchContainer: { 
      flexDirection: 'row', alignItems: 'center', padding: theme.spacing.sm, 
      margin: theme.spacing.md, backgroundColor: theme.colors.surface, 
      borderRadius: theme.borderRadius.md, borderWidth: 1, borderColor: theme.colors.border, ...theme.shadows.sm 
    },
    searchInput: { 
      flex: 1, padding: theme.spacing.sm, color: theme.colors.text, 
      fontSize: 16, marginLeft: theme.spacing.xs 
    },
    searchResults: { padding: theme.spacing.md },
    userItem: { 
      flexDirection: 'row', alignItems: 'center', padding: theme.spacing.md, 
      backgroundColor: theme.colors.surface, borderRadius: theme.borderRadius.md, 
      marginBottom: theme.spacing.sm, ...theme.shadows.sm 
    },
    userAvatar: { width: 50, height: 50, borderRadius: theme.borderRadius.round, marginRight: theme.spacing.md },
    userAvatarPlaceholder: { 
      backgroundColor: theme.colors.primary, 
      justifyContent: 'center', 
      alignItems: 'center' 
    },
    userAvatarText: { color: '#FFFFFF', fontSize: 20, fontWeight: 'bold' },
    userInfo: { flex: 1 },
    userName: { fontSize: 16, fontWeight: '600', color: theme.colors.text, marginBottom: 4 },
    userEmail: { fontSize: 14, color: theme.colors.textSecondary },
    
    // Follow Button Styles
    followButton: {
      backgroundColor: theme.colors.primary,
      padding: theme.spacing.sm,
      borderRadius: theme.borderRadius.md,
      alignItems: 'center',
      marginTop: theme.spacing.md,
      ...theme.shadows.sm,
    },
    followingButton: {
      backgroundColor: theme.colors.surface,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    followButtonText: {
      color: '#FFFFFF',
      fontSize: 14,
      fontWeight: '600',
    },
    
    // Bio Text
    bio: {
      fontSize: 14,
      marginTop: theme.spacing.xs,
      marginBottom: theme.spacing.md,
      color: theme.colors.text,
    },
    
    // Body text style
    body: {
      fontSize: 14,
      color: theme.colors.text,
      lineHeight: 20,
    },
    
    // Comment Modal Styles
    modalContainer: {
      flex: 1,
      justifyContent: 'flex-end',
      backgroundColor: 'rgba(0,0,0,0.5)',
    },
    modalContent: {
      height: '80%',
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      padding: 16,
      backgroundColor: theme.colors.background,
    },
    modalHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 16,
    },
    modalTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: theme.colors.text,
    },
    commentsList: {
      flexGrow: 1,
    },
    commentItem: {
      flexDirection: 'row',
      marginBottom: 16,
    },
    commentAvatar: {
      width: 36,
      height: 36,
      borderRadius: 18,
      marginRight: 12,
    },
    commentAvatarPlaceholder: {
      backgroundColor: theme.colors.primary,
      justifyContent: 'center',
      alignItems: 'center',
    },
    commentAvatarText: {
      color: '#FFFFFF',
      fontSize: 16,
      fontWeight: 'bold',
    },
    commentContent: {
      flex: 1,
    },
    commentUsername: {
      fontSize: 14,
      fontWeight: '600',
      marginBottom: 4,
      color: theme.colors.text,
    },
    commentText: {
      fontSize: 14,
      marginBottom: 4,
      color: theme.colors.text,
    },
    commentTime: {
      fontSize: 12,
      color: theme.colors.textSecondary,
    },
    emptyComments: {
      padding: 32,
      alignItems: 'center',
    },
    emptyCommentsText: {
      fontSize: 14,
      textAlign: 'center',
      marginTop: 16,
      color: theme.colors.textSecondary,
    },
    commentInputContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 8,
      borderRadius: 8,
      marginTop: 8,
      backgroundColor: theme.colors.surface,
    },
    commentInput: {
      flex: 1,
      padding: 8,
      fontSize: 14,
      maxHeight: 80,
      color: theme.colors.text,
    },
    commentButton: {
      backgroundColor: theme.colors.primary,
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 4,
      marginLeft: 8,
    },
    commentButtonDisabled: {
      opacity: 0.5,
    },
    commentButtonText: {
      color: '#FFFFFF',
      fontWeight: '600',
    },
    
    // Options Modal Styles
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.5)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    optionsModal: {
      width: '80%',
      borderRadius: 12,
      padding: 16,
      backgroundColor: theme.colors.surface,
    },
    optionItem: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 16,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
    },
    optionText: {
      fontSize: 16,
      marginLeft: 16,
      color: theme.colors.text,
    },
    cancelOption: {
      justifyContent: 'center',
      borderBottomWidth: 0,
    },
    
    // Additional Feed Post Styles
    avatarGradient: {
      width: 40,
      height: 40,
      borderRadius: 20,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 10,
      padding: 2,
    },
    avatar: {
      width: 36,
      height: 36,
      borderRadius: 18,
    },
    avatarText: {
      fontSize: 18,
      fontWeight: 'bold',
      color: '#FFFFFF',
    },
    location: {
      fontSize: 12,
      color: theme.colors.textSecondary,
    },
    image: {
      width: '100%',
      height: 400,
    },
    heartOverlay: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      justifyContent: 'center',
      alignItems: 'center',
    },
    actions: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      padding: 12,
      paddingBottom: 8,
    },
    leftActions: {
      flexDirection: 'row',
    },
    actionButton: {
      marginRight: 16,
    },
    likesContainer: {
      paddingHorizontal: 12,
      paddingBottom: 8,
    },
    likesCount: {
      fontSize: 14,
      fontWeight: '600',
      color: theme.colors.text,
    },
    captionContainer: {
      paddingHorizontal: 12,
      paddingBottom: 8,
    },
    caption: {
      fontSize: 14,
      lineHeight: 20,
      color: theme.colors.text,
    },
    captionUsername: {
      fontWeight: '600',
    },
    commentsPreview: {
      paddingHorizontal: 12,
      paddingBottom: 12,
    },
    commentsPreviewText: {
      fontSize: 12,
      color: theme.colors.textSecondary,
    },
    
    // Comment Avatar Gradient
    commentAvatarGradient: {
      width: 36,
      height: 36,
      borderRadius: 18,
      marginRight: 12,
      justifyContent: 'center',
      alignItems: 'center',
    },
    profileTabs: {
  flexDirection: 'row',
  borderTopWidth: 1,
  borderTopColor: theme.colors.border,
  marginTop: theme.spacing.lg,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: theme.spacing.sm,
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: theme.colors.primary,
  },
  multipleImagesIndicator: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: theme.borderRadius.round,
    padding: 4,
  },
  });
};
