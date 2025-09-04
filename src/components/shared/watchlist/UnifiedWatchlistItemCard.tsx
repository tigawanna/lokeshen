import { getOptimizedImageUrl } from "@/lib/tmdb/sdk-via-pb";
import { UnifiedMediaItem, getDisplayTitle, getFormattedDateInfo, getMediaTypeText, getNavigationRoute } from "@/types/unified-media";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import React from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { Card, Text, useTheme } from "react-native-paper";
import { UnifiedWatchlistItem } from "./types";
import { WatchlistDropdown } from "./WatchlistDropdown";
import { WatchlistItemActions } from "./WatchlistItemActions";
import { WatchlistItemGridCard } from "./WatchlistItemGridCard";
import { WatchlistItemRating, WatchlistItemStatus } from "./WatchlistItemStatus";
import { WatchlistItemUtils } from "./WatchlistItemUtils";

interface UnifiedWatchlistItemCardProps {
  item: UnifiedWatchlistItem | UnifiedMediaItem;
  viewMode?: "grid" | "list";
  onPress?: (id: string | number) => void;
  onLongPress?: () => void;
  onToggleWatched?: (item: any) => void;
  onRemove?: (item: any) => void;
  onAdd?: (item: any) => void;
  onAddToWatchlist?: (watchlistId: string, item: UnifiedMediaItem) => void;
  isSelected?: boolean;
  showActions?: boolean;
  showWatchlistDropdown?: boolean;
  mediaTypeTab?: "movie" | "tv";
}

export function UnifiedWatchlistItemCard({
  item,
  viewMode = "grid",
  mediaTypeTab,
  onPress,
  onLongPress,
  onToggleWatched,
  onRemove,
  onAdd,
  onAddToWatchlist,
  isSelected = false,
  showActions = true,
  showWatchlistDropdown = false,
}: UnifiedWatchlistItemCardProps) {
  const { colors } = useTheme();
  const router = useRouter();

  // Check if this is a UnifiedMediaItem (from TMDB) or UnifiedWatchlistItem (from PocketBase)
  const isUnifiedMedia = (item: any): item is UnifiedMediaItem => {
    return typeof item.media_type === "string" && !("tmdb_id" in item);
  };

  // Get appropriate data based on item type
  const getItemData = () => {
    if (isUnifiedMedia(item)) {
      // New unified media item
      return {
        title: getDisplayTitle(item),
        posterUrl: getOptimizedImageUrl(item.poster_path, "poster", "medium"),
        dateInfo: getFormattedDateInfo(item),
        mediaTypeText: getMediaTypeText(item),
        navigationRoute: getNavigationRoute(item),
        overview: item.overview,
        rating: item.vote_average,
        notes: item.notes,
        addedDate: item.added_date ? new Date(item.added_date).toLocaleDateString() : null,
        personalRating: item.personal_rating || 0,
      };
    } else {
      // Legacy watchlist item
      return {
        title: item.title,
        posterUrl: WatchlistItemUtils.getPosterUrl(item),
        dateInfo: { displayText: WatchlistItemUtils.getReleaseYear(item)?.toString() || "Unknown" },
        mediaTypeText: WatchlistItemUtils.getMediaTypeText(item),
        navigationRoute: WatchlistItemUtils.getNavigationRoute(item),
        overview: item.overview,
        rating: item.vote_average,
        notes: WatchlistItemUtils.getNotes(item),
        addedDate: WatchlistItemUtils.getFormattedAddedDate(item),
        personalRating: WatchlistItemUtils.getPersonalRating(item),
      };
    }
  };

  const {
    title,
    posterUrl,
    dateInfo,
    mediaTypeText,
    navigationRoute,
    overview,
    rating,
    notes,
    addedDate,
    personalRating,
  } = getItemData();

  const handlePress = () => {
    if (onPress) {
      onPress(isUnifiedMedia(item) ? item.id : item.id);
    } else {
      router.push(navigationRoute as any);
    }
  };

  const handleLongPress = () => {
    if (onLongPress) {
      onLongPress();
    }
  };

  const cardStyle = [
    viewMode === "grid" ? styles.gridCard : styles.listCard,
    isSelected && {
      borderColor: colors.primary,
      borderWidth: 2,
    },
    { backgroundColor: colors.surface },
  ];

  if (viewMode === "list") {
    return (
      <Card style={cardStyle} mode="outlined">
        <Pressable onPress={handlePress} onLongPress={handleLongPress} style={styles.listContent}>
          <Image
            source={
              posterUrl ? { uri: posterUrl } : require("@/assets/images/poster-placeholder.jpeg")
            }
            style={styles.listPoster}
            contentFit="cover"
            placeholder={require("@/assets/images/poster-placeholder.jpeg")}
          />

          <View style={styles.listInfo}>
            <Text variant="titleMedium" numberOfLines={2} style={styles.title}>
              {title}
            </Text>

            <View style={styles.listMetadata}>
              <Text variant="bodySmall" style={[styles.year, { color: colors.onSurfaceVariant }]}>
                {dateInfo.displayText} • {mediaTypeText}
              </Text>

              <View style={styles.statusRow}>
                {/* Only show status for legacy items that have these components */}
                {!isUnifiedMedia(item) ? (
                  <>
                    <WatchlistItemStatus item={item} size="medium" />
                    <WatchlistItemRating item={item} type="personal" size="small" />
                  </>
                ) : (
                  <View style={styles.ratingContainer}>
                    {rating && rating > 0 ? (
                      <Text variant="bodySmall" style={{ color: colors.primary }}>
                        ⭐ {rating.toFixed(1)}
                      </Text>
                    ) : null}
                    {personalRating > 0 ? (
                      <Text variant="bodySmall" style={{ color: colors.secondary }}>
                        👤 {personalRating}/10
                      </Text>
                    ) : null}
                  </View>
                )}
              </View>

              {rating && rating > 0 && !personalRating ? (
                <Text variant="bodySmall" style={{ color: colors.primary }}>
                  ⭐ {rating.toFixed(1)} TMDB
                </Text>
              ) : null}
            </View>

            {addedDate ? (
              <Text
                variant="bodySmall"
                style={[styles.addedDate, { color: colors.onSurfaceVariant }]}>
                Added {addedDate}
              </Text>
            ) : null}

            {notes ? (
              <Text
                variant="bodySmall"
                numberOfLines={2}
                style={[styles.notes, { color: colors.onSurfaceVariant }]}>
                {notes}
              </Text>
            ) : null}

            {overview ? (
              <Text
                variant="bodySmall"
                numberOfLines={3}
                style={[styles.overview, { color: colors.onSurfaceVariant }]}>
                {overview}
              </Text>
            ) : null}
          </View>

          <View style={styles.actionColumn}>
            {showWatchlistDropdown && isUnifiedMedia(item) && onAddToWatchlist ? (
              <WatchlistDropdown
                mediaItem={item}
                onAddToWatchlist={onAddToWatchlist}
                size="small"
              />
            ) : null}

            {showActions ? (
              <WatchlistItemActions
                item={{ ...item, mediaType: isUnifiedMedia(item) ? item.media_type : WatchlistItemUtils.getMediaType(item, mediaTypeTab) } as any}
                onToggleWatched={onToggleWatched}
                onRemove={onRemove}
                onAdd={onAdd}
                size="medium"
                layout="vertical"
              />
            ) : null}
          </View>
        </Pressable>
      </Card>
    );
  }

  // Grid view
  return (
    <WatchlistItemGridCard
      mediaTypeTab={mediaTypeTab || "movie"}
      item={item as any}
      onPress={handlePress}
      onLongPress={handleLongPress}
      onToggleWatched={onToggleWatched}
      onRemove={onRemove}
      onAdd={onAdd}
      isSelected={isSelected}
      showActions={showActions}
    />
  );
}

const styles = StyleSheet.create({
  // List styles
  listCard: {
    marginVertical: 4,
    marginHorizontal: 8,
  },
  listContent: {
    flexDirection: "row",
    padding: 12,
  },
  listPoster: {
    width: 80,
    height: 120,
    borderRadius: 8,
    marginRight: 12,
  },
  listInfo: {
    flex: 1,
    justifyContent: "space-between",
  },
  title: {
    fontWeight: "600",
    marginBottom: 4,
  },
  listMetadata: {
    marginBottom: 4,
  },
  year: {
    marginBottom: 4,
  },
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 4,
  },
  ratingContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  addedDate: {
    marginBottom: 4,
  },
  notes: {
    fontStyle: "italic",
    marginBottom: 4,
  },
  overview: {
    lineHeight: 16,
  },
  actionColumn: {
    justifyContent: "space-between",
    alignItems: "flex-end",
    minWidth: 60,
  },

  // Grid styles (placeholder)
  gridCard: {
    flex: 1,
    margin: 4,
    maxWidth: "48%",
  },
});
