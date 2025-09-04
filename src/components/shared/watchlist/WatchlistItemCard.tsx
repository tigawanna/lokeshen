import { Image } from "expo-image";
import { useRouter } from "expo-router";
import React from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { Card, Text, useTheme } from "react-native-paper";
import { UnifiedWatchlistItem } from "./types";
import { WatchlistItemActions } from "./WatchlistItemActions";
import { WatchlistItemGridCard } from "./WatchlistItemGridCard";
import { WatchlistItemRating, WatchlistItemStatus } from "./WatchlistItemStatus";
import { WatchlistItemUtils } from "./WatchlistItemUtils";

interface WatchlistItemCardProps {
  item: UnifiedWatchlistItem;
  viewMode?: "grid" | "list";
  onPress?: (id: string | number) => void;
  onLongPress?: () => void;
  onToggleWatched?: (item: UnifiedWatchlistItem) => void;
  onRemove?: (item: UnifiedWatchlistItem) => void;
  onAdd?: (item: UnifiedWatchlistItem) => void;
  isSelected?: boolean;
  showActions?: boolean;
  mediaTypeTab: "movie" | "tv";
}

export function WatchlistItemCard({
  item,
  viewMode = "grid",
  mediaTypeTab,
  onPress,
  onLongPress,
  onToggleWatched,
  onRemove,
  onAdd,
  isSelected = false,
  showActions = true,
}: WatchlistItemCardProps) {
  const { colors } = useTheme();
  const router = useRouter();

  const posterUrl = WatchlistItemUtils.getPosterUrl(item);
  const releaseYear = WatchlistItemUtils.getReleaseYear(item);
  const addedDate = WatchlistItemUtils.getFormattedAddedDate(item);
  const notes = WatchlistItemUtils.getNotes(item);
  const mediaType = WatchlistItemUtils.getMediaType(item, mediaTypeTab);

  const handlePress = () => {
    if (onPress) {
      onPress(item?.id);
    } else {
      const route = WatchlistItemUtils.getNavigationRoute(item);
      router.push(route);
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
              {item.title}
            </Text>

            <View style={styles.listMetadata}>
              <Text variant="bodySmall" style={[styles.year, { color: colors.onSurfaceVariant }]}>
                {releaseYear} • {WatchlistItemUtils.getMediaTypeText(item)}
              </Text>

              <View style={styles.statusRow}>
                <WatchlistItemStatus item={item} size="medium" />
                <WatchlistItemRating item={item} type="personal" size="small" />
              </View>

              {item.vote_average && item.vote_average > 0 && (
                <WatchlistItemRating item={item} type="tmdb" size="small" />
              )}
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

            {item.overview ? (
              <Text
                variant="bodySmall"
                numberOfLines={3}
                style={[styles.overview, { color: colors.onSurfaceVariant }]}>
                {item.overview}
              </Text>
            ) : null}
          </View>

          {showActions ? (
            <WatchlistItemActions
              item={{ ...item, mediaType }}
              onToggleWatched={onToggleWatched}
              onRemove={onRemove}
              onAdd={onAdd}
              size="medium"
              layout="vertical"
            />
          ) : null}
        </Pressable>
      </Card>
    );
  }

  // Grid view
  return (
    <WatchlistItemGridCard
     mediaTypeTab={mediaTypeTab}
      item={item}
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

  // Grid styles (placeholder)
  gridCard: {
    flex: 1,
    margin: 4,
    maxWidth: "48%",
  },
});
