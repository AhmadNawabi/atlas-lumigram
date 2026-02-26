import React from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { Post } from '../../types';
import { useTheme } from '../../hooks/useTheme';
import Icon from 'react-native-vector-icons/Ionicons';
import { formatDistanceToNow } from 'date-fns';

interface PostCardProps {
  post: Post;
  onPress?: () => void;
  onLongPress?: () => void;
  showActions?: boolean;
}

export const PostCard: React.FC<PostCardProps> = ({
  post,
  onPress,
  onLongPress,
  showActions = true,
}) => {
  const { theme } = useTheme();

  return (
    <TouchableOpacity
      onPress={onPress}
      onLongPress={onLongPress}
      delayLongPress={500}
      style={[styles.container, { backgroundColor: theme.colors.surface }]}
    >
      <Image source={{ uri: post.imageUrl }} style={styles.image} />
      
      <View style={styles.overlay}>
        {showActions && (
          <View style={styles.actions}>
            <Icon 
              name={post.isFavorited ? 'heart' : 'heart-outline'} 
              size={24} 
              color={post.isFavorited ? theme.colors.error : '#fff'} 
            />
          </View>
        )}
        
        <View style={styles.footer}>
          <Text style={styles.caption} numberOfLines={2}>
            {post.caption}
          </Text>
          <Text style={styles.timestamp}>
            {formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 16,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  image: {
    width: '100%',
    height: 300,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'space-between',
    padding: 12,
  },
  actions: {
    alignSelf: 'flex-end',
  },
  footer: {
    backgroundColor: 'rgba(0,0,0,0.5)',
    padding: 12,
    borderRadius: 8,
  },
  caption: {
    color: '#fff',
    fontSize: 14,
    marginBottom: 4,
  },
  timestamp: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 12,
  },
});
