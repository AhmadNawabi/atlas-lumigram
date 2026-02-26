import React, { useRef } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  Animated,
} from 'react-native';
import { GestureDetector, Gesture } from 'react-native-gesture-handler';
import { Post } from '../../types';
import { useTheme } from '../../hooks/useTheme';
import Icon from 'react-native-vector-icons/Ionicons';
import { formatDistanceToNow } from 'date-fns';

interface FeedPostProps {
  post: Post;
  onDoubleTap: () => void;
  onLongPress: () => void;
}

export const FeedPost: React.FC<FeedPostProps> = ({
  post,
  onDoubleTap,
  onLongPress,
}) => {
  const { theme } = useTheme();
  const scaleValue = useRef(new Animated.Value(1)).current;

  const doubleTap = Gesture.Tap()
    .numberOfTaps(2)
    .onStart(() => {
      Animated.sequence([
        Animated.spring(scaleValue, {
          toValue: 1.2,
          useNativeDriver: true,
        }),
        Animated.spring(scaleValue, {
          toValue: 1,
          useNativeDriver: true,
        }),
      ]).start();
      onDoubleTap();
    });

  const longPress = Gesture.LongPress()
    .minDuration(500)
    .onStart(() => {
      onLongPress();
    });

  const composed = Gesture.Race(doubleTap, longPress);

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.surface }]}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.userInfo}>
          <View style={[styles.avatar, { backgroundColor: theme.colors.border }]}>
            <Text style={styles.avatarText}>
              {post.userEmail?.charAt(0).toUpperCase()}
            </Text>
          </View>
          <Text style={[styles.username, { color: theme.colors.text }]}>
            {post.userEmail?.split('@')[0]}
          </Text>
        </View>
        <TouchableOpacity>
          <Icon name="ellipsis-horizontal" size={20} color={theme.colors.text} />
        </TouchableOpacity>
      </View>

      {/* Image with gestures */}
      <GestureDetector gesture={composed}>
        <View>
          <Image source={{ uri: post.imageUrl }} style={styles.image} />
          <Animated.View
            style={[
              styles.heartOverlay,
              {
                transform: [{ scale: scaleValue }],
              },
            ]}
          >
            <Icon
              name="heart"
              size={80}
              color={post.isFavorited ? theme.colors.error : 'transparent'}
            />
          </Animated.View>
        </View>
      </GestureDetector>

      {/* Actions */}
      <View style={styles.actions}>
        <View style={styles.leftActions}>
          <TouchableOpacity onPress={onDoubleTap} style={styles.actionButton}>
            <Icon
              name={post.isFavorited ? 'heart' : 'heart-outline'}
              size={24}
              color={post.isFavorited ? theme.colors.error : theme.colors.text}
            />
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton}>
            <Icon name="chatbubble-outline" size={22} color={theme.colors.text} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton}>
            <Icon name="paper-plane-outline" size={22} color={theme.colors.text} />
          </TouchableOpacity>
        </View>
        <TouchableOpacity>
          <Icon name="bookmark-outline" size={22} color={theme.colors.text} />
        </TouchableOpacity>
      </View>

      {/* Caption */}
      <View style={styles.captionContainer}>
        <Text style={[styles.caption, { color: theme.colors.text }]}>
          <Text style={styles.captionUsername}>
            {post.userEmail?.split('@')[0]}{' '}
          </Text>
          {post.caption}
        </Text>
        <Text style={[styles.timestamp, { color: theme.colors.textSecondary }]}>
          {formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
    borderRadius: 12,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  avatarText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  username: {
    fontSize: 14,
    fontWeight: '600',
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
  },
  leftActions: {
    flexDirection: 'row',
  },
  actionButton: {
    marginRight: 16,
  },
  captionContainer: {
    paddingHorizontal: 12,
    paddingBottom: 12,
  },
  caption: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 4,
  },
  captionUsername: {
    fontWeight: '600',
  },
  timestamp: {
    fontSize: 12,
  },
});
