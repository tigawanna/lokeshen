import { MaterialIcons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Text, useTheme } from 'react-native-paper';
import { UnifiedWatchlistItem } from './types';
import { WatchlistItemUtils } from './WatchlistItemUtils';

interface WatchlistItemStatusProps {
  item: UnifiedWatchlistItem;
  size?: "small" | "medium";
  showText?: boolean;
}

export function WatchlistItemStatus({ 
  item, 
  size = 'medium',
  showText = true 
}: WatchlistItemStatusProps) {
  const { colors } = useTheme();
  const isWatched = item.watched;
  const isInWatchlist = item?.inWatchList && item?.inWatchList?.length > 0;
  console.log('WatchlistItemStatus', { item, isWatched, isInWatchlist });
  const getStatusColor = () => {
    if (!isInWatchlist) return colors.outline;
    return isWatched ? colors.primary : colors.secondary;
  };

  const getStatusIcon = () => {
    if (!isInWatchlist) return 'bookmark-outline';
    return isWatched ? 'check-circle' : 'bookmark';
  };

  const getStatusText = () => {
    if (!isInWatchlist) return 'Not in Watchlist';
    return isWatched ? 'Watched' : 'To Watch';
  };

  const fontSize = size === 'small' ? 10 : 12;
  const iconSize = size === 'small' ? 12 : 16;
  const statusColor = getStatusColor();
  
  return (
    <View style={styles.statusContainer}>
      <MaterialIcons
        name={getStatusIcon()}
        size={iconSize}
        color={statusColor}
      />
      {showText && (
        <Text style={[
          styles.statusText,
          { color: statusColor, fontSize }
        ]}>
          {getStatusText()}
        </Text>
      )}
    </View>
  );
}

interface WatchlistItemRatingProps {
  item: UnifiedWatchlistItem;
  type: 'personal' | 'tmdb';
  size?: 'small' | 'medium';
}

export function WatchlistItemRating({ 
  item, 
  type, 
  size = 'medium' 
}: WatchlistItemRatingProps) {
  const { colors } = useTheme();
  
  const rating = type === 'personal' 
    ? WatchlistItemUtils.getPersonalRating(item)
    : item.vote_average || 0;

  if (!rating || rating === 0) return null;

  const iconSize = size === 'small' ? 12 : 16;
  // const textSize = size === 'small' ? 10 : 12;

  if (type === 'personal') {
    // Show star rating for personal ratings (1-10 scale converted to 1-5 stars)
    const stars = Math.round(rating / 2);
    return (
      <View style={styles.ratingContainer}>
        {[1, 2, 3, 4, 5].map((star) => (
          <MaterialIcons
            key={star}
            name={star <= stars ? 'star' : 'star-border'}
            size={iconSize}
            color={colors.primary}
          />
        ))}
      </View>
    );
  }

  // Show TMDB rating with star icon
  return (
    <View style={styles.tmdbRatingContainer}>
      <MaterialIcons 
        name="star" 
        size={iconSize} 
        color={colors.primary} 
      />
      <View style={[
        styles.tmdbRatingBadge,
        { backgroundColor: colors.surfaceVariant }
      ]}>
        <MaterialIcons 
          name="star" 
          size={iconSize - 2} 
          color="#FFD700" 
        />
        <Text style={styles.tmdbRatingText}>
          {rating.toFixed(1)}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statusText: {
    fontWeight: '500',
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 1,
  },
  tmdbRatingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  tmdbRatingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 4,
    gap: 2,
  },
  tmdbRatingText: {
    fontSize: 10,
    fontWeight: 'bold',
  },
});
