import React, { useRef, useState, useEffect } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Alert,
  TextInput,
  Modal,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  ActionSheetIOS,
} from 'react-native';
import { GestureDetector, Gesture } from 'react-native-gesture-handler';
import { Post, Comment } from '../../types';
import { useTheme } from '../../hooks/useTheme';
import { useAuth } from '../../hooks/useAuth';
import { commentService } from '../../services/comment.service';
import { favoritesService } from '../../services/favorites.service';
import Icon from 'react-native-vector-icons/Ionicons';
import { formatDistanceToNow } from 'date-fns';
import { LinearGradient } from 'expo-linear-gradient';

interface FeedPostProps {
  post: Post;
  onDoubleTap: () => void;
  onLike: () => void;
  onLongPress: () => void;
  onUserPress: () => void;
  onComment: () => void;
  onShare: () => void;
  onDelete?: () => void;
  currentUserId?: string;
}

// Helper to ensure a value is a number (not an increment object)
const ensureNumber = (value: any, defaultValue: number = 0): number => {
  if (typeof value === 'number') return value;
  if (value && typeof value === 'object') {
    if ('type' in value && value.type === 'increment') {
      console.warn('⚠️ Increment object detected in FeedPost, replacing with', defaultValue);
      return defaultValue;
    }
  }
  const parsed = Number(value);
  return isNaN(parsed) ? defaultValue : parsed;
};

export const FeedPost: React.FC<FeedPostProps> = ({
  post,
  onDoubleTap,
  onLike,
  onLongPress,
  onUserPress,
  onComment,
  onShare,
  onDelete,
  currentUserId,
}) => {
  const { theme } = useTheme();
  const { user } = useAuth();
  const scaleValue = useRef(new Animated.Value(0)).current;
  const [showHeart, setShowHeart] = useState(false);

  const [isLiked, setIsLiked] = useState(post.isLiked || false);
  const [likesCount, setLikesCount] = useState(ensureNumber(post.likesCount));

  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [showOptions, setShowOptions] = useState(false);

  useEffect(() => {
    setIsLiked(post.isLiked || false);
    setLikesCount(ensureNumber(post.likesCount));
  }, [post.isLiked, post.likesCount]);

  // Gesture handlers
  const doubleTap = Gesture.Tap()
    .numberOfTaps(2)
    .onStart(() => {
      handleLike();
      (async () => {
        if (user) {
          try {
            await favoritesService.toggleFavorite(user.uid, post.id, true);
          } catch (error) {
            console.error('Error favoriting post:', error);
          }
        }
        onDoubleTap();
      })();
    });

  const longPress = Gesture.LongPress()
    .minDuration(500)
    .onStart(() => {
      onLongPress();
      if (Platform.OS === 'ios') {
        showOptionsIOS();
      } else {
        setShowOptions(true);
      }
    });

  const composed = Gesture.Race(doubleTap, longPress);

  const showOptionsIOS = () => {
    const options = ['Cancel'];
    if (post.userId === currentUserId) {
      options.unshift('Delete Post');
    }
    options.unshift('Save Post', 'Report');

    ActionSheetIOS.showActionSheetWithOptions(
      {
        options,
        cancelButtonIndex: options.length - 1,
        destructiveButtonIndex: post.userId === currentUserId ? 1 : undefined,
      },
      (buttonIndex) => {
        if (buttonIndex === 0 && post.userId === currentUserId) {
          onDelete?.();
        } else if (buttonIndex === (post.userId === currentUserId ? 1 : 0)) {
          Alert.alert('Saved', 'Post saved to collection');
        } else if (buttonIndex === (post.userId === currentUserId ? 2 : 1)) {
          Alert.alert('Report', 'Post reported');
        }
      }
    );
  };

  const handleLike = () => {
    const newLikedState = !isLiked;
    setIsLiked(newLikedState);
    setLikesCount((prev) => (newLikedState ? prev + 1 : Math.max(0, prev - 1)));

    setShowHeart(true);
    Animated.sequence([
      Animated.spring(scaleValue, {
        toValue: 1,
        useNativeDriver: true,
        damping: 10,
      }),
      Animated.delay(500),
      Animated.spring(scaleValue, {
        toValue: 0,
        useNativeDriver: true,
      }),
    ]).start(() => setShowHeart(false));

    onLike();
  };

  const loadComments = async () => {
    try {
      const result = await commentService.getPostComments(post.id);
      setComments(result.comments);
    } catch (error) {
      console.error('Error loading comments:', error);
    }
  };

  const handleAddComment = async () => {
    if (!user || !newComment.trim()) return;
    setIsSubmittingComment(true);
    try {
      await commentService.addComment(post.id, user.uid, user.email || '', newComment.trim());
      setNewComment('');
      await loadComments();
      onComment();
    } catch (error) {
      Alert.alert('Error', 'Failed to add comment');
    } finally {
      setIsSubmittingComment(false);
    }
  };

  const formatDate = (date: any): string => {
    try {
      if (!date) return 'some time ago';
      if (date && typeof date.toDate === 'function') return formatDistanceToNow(date.toDate(), { addSuffix: true });
      const dateObj = date instanceof Date ? date : new Date(date);
      if (isNaN(dateObj.getTime())) return 'some time ago';
      return formatDistanceToNow(dateObj, { addSuffix: true });
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'some time ago';
    }
  };

  const getUsername = (item: Comment) => item.username || item.userEmail?.split('@')[0] || 'user';

  const renderComment = ({ item }: { item: Comment }) => (
    <View style={styles.commentItem}>
      <TouchableOpacity onPress={onUserPress}>
        <LinearGradient colors={['#f09433', '#e6683c', '#dc2743']} style={styles.commentAvatarGradient}>
          {item.userProfileImage ? (
            <Image source={{ uri: item.userProfileImage }} style={styles.commentAvatar} />
          ) : (
            <Text style={styles.commentAvatarText}>{getUsername(item).charAt(0).toUpperCase()}</Text>
          )}
        </LinearGradient>
      </TouchableOpacity>
      <View style={styles.commentContent}>
        <Text style={[styles.commentUsername, { color: theme.colors.text }]}>{getUsername(item)}</Text>
        <Text style={[styles.commentText, { color: theme.colors.text }]}>{item.content}</Text>
        <Text style={[styles.commentTime, { color: theme.colors.textSecondary }]}>{formatDate(item.createdAt)}</Text>
      </View>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.surface }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.userInfo} onPress={onUserPress}>
          <LinearGradient colors={['#f09433', '#e6683c', '#dc2743']} style={styles.avatarGradient}>
            {post.userProfileImage ? (
              <Image source={{ uri: post.userProfileImage }} style={styles.avatar} />
            ) : (
              <Text style={styles.avatarText}>{(post.username || post.userEmail || 'U').charAt(0).toUpperCase()}</Text>
            )}
          </LinearGradient>
          <View>
            <Text style={[styles.username, { color: theme.colors.text }]}>
              {post.username || post.userEmail?.split('@')[0] || 'user'}
            </Text>
            <Text style={[styles.location, { color: theme.colors.textSecondary }]}>{formatDate(post.createdAt)}</Text>
          </View>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setShowOptions(true)}>
          <Icon name="ellipsis-horizontal" size={20} color={theme.colors.text} />
        </TouchableOpacity>
      </View>

      {/* Image with gestures */}
      <GestureDetector gesture={composed}>
        <View>
          <Image source={{ uri: post.imageUrl }} style={styles.image} resizeMode="cover" />
          {showHeart && (
            <Animated.View style={[styles.heartOverlay, { transform: [{ scale: scaleValue }] }]}>
              <Icon name="heart" size={80} color="#fff" />
            </Animated.View>
          )}
        </View>
      </GestureDetector>

      {/* Actions */}
      <View style={styles.actions}>
        <View style={styles.leftActions}>
          <TouchableOpacity onPress={handleLike} style={styles.actionButton}>
            <Icon name={isLiked ? 'heart' : 'heart-outline'} size={26} color={isLiked ? theme.colors.error : theme.colors.text} />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => {
              setShowComments(true);
              loadComments();
            }}
            style={styles.actionButton}
          >
            <Icon name="chatbubble-outline" size={24} color={theme.colors.text} />
          </TouchableOpacity>

          <TouchableOpacity onPress={onShare} style={styles.actionButton}>
            <Icon name="paper-plane-outline" size={24} color={theme.colors.text} />
          </TouchableOpacity>
        </View>
        <TouchableOpacity>
          <Icon name="bookmark-outline" size={24} color={theme.colors.text} />
        </TouchableOpacity>
      </View>

      {/* Likes */}
      <View style={styles.likesContainer}>
        <Text style={[styles.likesCount, { color: theme.colors.text }]}>
          {likesCount} {likesCount === 1 ? 'like' : 'likes'}
        </Text>
      </View>

      {/* Caption */}
      <View style={styles.captionContainer}>
        <Text style={[styles.caption, { color: theme.colors.text }]}>
          <Text style={styles.captionUsername} onPress={onUserPress}>
            {post.username || post.userEmail?.split('@')[0] || 'user'}{' '}
          </Text>
          {post.caption}
        </Text>
      </View>

      {/* Comments preview */}
      <TouchableOpacity
        onPress={() => {
          setShowComments(true);
          loadComments();
        }}
        style={styles.commentsPreview}
      >
        <Text style={[styles.commentsPreviewText, { color: theme.colors.textSecondary }]}>
          View all {ensureNumber(post.commentsCount)} comments
        </Text>
      </TouchableOpacity>

      {/* Options Modal (Android) */}
      <Modal visible={showOptions} transparent animationType="fade" onRequestClose={() => setShowOptions(false)}>
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setShowOptions(false)}>
          <View style={[styles.optionsModal, { backgroundColor: theme.colors.surface }]}>
            {post.userId === currentUserId && (
              <TouchableOpacity
                style={styles.optionItem}
                onPress={() => {
                  setShowOptions(false);
                  onDelete?.();
                }}
              >
                <Icon name="trash-outline" size={24} color={theme.colors.error} />
                <Text style={[styles.optionText, { color: theme.colors.error }]}>Delete Post</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={styles.optionItem}
              onPress={() => {
                setShowOptions(false);
                Alert.alert('Saved', 'Post saved to collection');
              }}
            >
              <Icon name="bookmark-outline" size={24} color={theme.colors.text} />
              <Text style={[styles.optionText, { color: theme.colors.text }]}>Save Post</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.optionItem}
              onPress={() => {
                setShowOptions(false);
                Alert.alert('Report', 'Post reported');
              }}
            >
              <Icon name="flag-outline" size={24} color={theme.colors.text} />
              <Text style={[styles.optionText, { color: theme.colors.text }]}>Report</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.optionItem, styles.cancelOption]} onPress={() => setShowOptions(false)}>
              <Text style={[styles.optionText, { color: theme.colors.textSecondary }]}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Comments Modal */}
      <Modal visible={showComments} animationType="slide" transparent onRequestClose={() => setShowComments(false)}>
        <KeyboardAvoidingView style={styles.modalContainer} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <View style={[styles.modalContent, { backgroundColor: theme.colors.background }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: theme.colors.text }]}>Comments ({comments.length})</Text>
              <TouchableOpacity onPress={() => setShowComments(false)}>
                <Icon name="close" size={24} color={theme.colors.text} />
              </TouchableOpacity>
            </View>

            <FlatList
              data={comments}
              renderItem={renderComment}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.commentsList}
              ListEmptyComponent={
                <View style={styles.emptyComments}>
                  <Icon name="chatbubbles-outline" size={48} color={theme.colors.textSecondary} />
                  <Text style={[styles.emptyCommentsText, { color: theme.colors.textSecondary }]}>
                    No comments yet. Be the first to comment!
                  </Text>
                </View>
              }
            />

            <View style={[styles.commentInputContainer, { backgroundColor: theme.colors.surface }]}>
              <TextInput
                style={[styles.commentInput, { color: theme.colors.text }]}
                placeholder="Add a comment..."
                placeholderTextColor={theme.colors.textSecondary}
                value={newComment}
                onChangeText={setNewComment}
                multiline
              />
              <TouchableOpacity
                onPress={handleAddComment}
                disabled={!newComment.trim() || isSubmittingComment}
                style={[styles.commentButton, (!newComment.trim() || isSubmittingComment) && styles.commentButtonDisabled]}
              >
                <Text style={styles.commentButtonText}>Post</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { marginBottom: 16, borderRadius: 12, overflow: 'hidden', elevation: 3, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 12 },
  userInfo: { flexDirection: 'row', alignItems: 'center' },
  avatarGradient: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center', marginRight: 10, padding: 2 },
  avatar: { width: 36, height: 36, borderRadius: 18 },
  avatarText: { fontSize: 18, fontWeight: 'bold', color: '#fff' },
  username: { fontSize: 14, fontWeight: '600' },
  location: { fontSize: 12 },
  image: { width: '100%', height: 400 },
  heartOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, justifyContent: 'center', alignItems: 'center' },
  actions: { flexDirection: 'row', justifyContent: 'space-between', padding: 12, paddingBottom: 8 },
  leftActions: { flexDirection: 'row' },
  actionButton: { marginRight: 16 },
  likesContainer: { paddingHorizontal: 12, paddingBottom: 8 },
  likesCount: { fontSize: 14, fontWeight: '600' },
  captionContainer: { paddingHorizontal: 12, paddingBottom: 8 },
  caption: { fontSize: 14, lineHeight: 20 },
  captionUsername: { fontWeight: '600' },
  commentsPreview: { paddingHorizontal: 12, paddingBottom: 12 },
  commentsPreviewText: { fontSize: 12 },
  modalContainer: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.5)' },
  modalContent: { height: '80%', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 16 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  modalTitle: { fontSize: 18, fontWeight: '600' },
  commentsList: { flexGrow: 1 },
  commentItem: { flexDirection: 'row', marginBottom: 16 },
  commentAvatarGradient: { width: 36, height: 36, borderRadius: 18, marginRight: 12, justifyContent: 'center', alignItems: 'center' },
  commentAvatar: { width: 32, height: 32, borderRadius: 16 },
  commentAvatarText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  commentContent: { flex: 1 },
  commentUsername: { fontSize: 14, fontWeight: '600', marginBottom: 4 },
  commentText: { fontSize: 14, marginBottom: 4 },
  commentTime: { fontSize: 12 },
  emptyComments: { padding: 32, alignItems: 'center' },
  emptyCommentsText: { fontSize: 14, textAlign: 'center', marginTop: 16 },
  commentInputContainer: { flexDirection: 'row', alignItems: 'center', padding: 8, borderRadius: 8, marginTop: 8 },
  commentInput: { flex: 1, padding: 8, fontSize: 14, maxHeight: 80 },
  commentButton: { backgroundColor: '#0095F6', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 4, marginLeft: 8 },
  commentButtonDisabled: { opacity: 0.5 },
  commentButtonText: { color: '#fff', fontWeight: '600' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  optionsModal: { width: '80%', borderRadius: 12, padding: 16 },
  optionItem: { flexDirection: 'row', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: '#ddd' },
  optionText: { fontSize: 16, marginLeft: 16 },
  cancelOption: { justifyContent: 'center', borderBottomWidth: 0 },
});
