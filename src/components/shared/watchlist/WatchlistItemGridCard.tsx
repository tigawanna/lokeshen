import { MaterialIcons } from "@expo/vector-icons";
import { Image } from "expo-image";
import React from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { Card, Text, useTheme } from "react-native-paper";
import { UnifiedWatchlistItem } from "./types";
import { WatchlistItemUtils } from "./WatchlistItemUtils";
import { WatchlistItemActions } from "./WatchlistItemActions";

interface WatchlistItemGridCardProps {
  item: UnifiedWatchlistItem;
  onPress?: () => void;
  onLongPress?: () => void;
  onToggleWatched?: (item: UnifiedWatchlistItem) => void;
  onRemove?: (item: UnifiedWatchlistItem) => void;
  onAdd?: (item: UnifiedWatchlistItem) => void;
  isSelected?: boolean;
  showActions?: boolean;
  mediaTypeTab: "movie" | "tv";
}

export function WatchlistItemGridCard({
  item,
  onPress,
  onLongPress,
  onToggleWatched,
  onRemove,
  onAdd,
  isSelected = false,
  mediaTypeTab,
  showActions = true,
}: WatchlistItemGridCardProps) {

  // console.log(JSON.stringify(item, null, 2));

  const { colors } = useTheme();

  const posterUrl = WatchlistItemUtils.getPosterUrl(item);
  const releaseYear = WatchlistItemUtils.getReleaseYear(item);
  const isWatched = item.watched;
  const mediaType = WatchlistItemUtils.getMediaType(item,mediaTypeTab);

  const getStatusColor = () => {
    const isInWatchlist = WatchlistItemUtils.isInWatchlist(item);
    if (!isInWatchlist) return colors.outline;
    return isWatched ? colors.primary : colors.secondary;
  };

  const getStatusIcon = () => {
    const isInWatchlist = WatchlistItemUtils.isInWatchlist(item);
    if (!isInWatchlist) return "bookmark-outline";
    return isWatched ? "check-circle" : "bookmark";
  };

  const cardStyle = [
    styles.gridCard,
    isSelected && {
      borderColor: colors.primary,
      borderWidth: 2,
    },
    { backgroundColor: colors.surface },
  ];

  return (
    <Card style={cardStyle} mode="outlined">
      <View style={styles.gridContent}>
        <Pressable onPress={onPress} onLongPress={onLongPress} style={styles.pressableContent}>
          <View style={styles.posterContainer}>
            <Image
              source={
                posterUrl ? { uri: posterUrl } : require("@/assets/images/poster-placeholder.jpeg")
              }
              style={styles.gridPoster}
              contentFit="cover"
              placeholder={require("@/assets/images/poster-placeholder.jpeg")}
            />

            {/* Status indicator overlay */}
            <Pressable
              onPress={(e) => {
                e.stopPropagation();
                console.log("Status pressed", item.id);
              }}
              style={[styles.statusIndicator, { backgroundColor: getStatusColor() }]}>
              <MaterialIcons name={getStatusIcon()} size={16} color={colors.onPrimary} />
            </Pressable>

            {/* TMDB rating overlay */}
            {item?.vote_average && item?.vote_average > 0 ? (
              <View style={[styles.tmdbRatingOverlay, { backgroundColor: colors.surfaceVariant }]}>
                <MaterialIcons name="star" size={12} color="#FFD700" />
                <Text style={[styles.tmdbRatingText, { color: colors.onSurface }]}>
                  {item.vote_average.toFixed(1)}
                </Text>
              </View>
            ) : null}
          </View>

          <Card.Content style={styles.gridInfo}>
            <Text variant="titleSmall" numberOfLines={1} style={styles.gridTitle}>
              {item.title || "Untitled"}
            </Text>

            <Text variant="bodySmall" style={[styles.gridYear, { color: colors.onSurfaceVariant }]}>
              {releaseYear ? `${releaseYear} • ` : ""}
              {mediaType}
            </Text>

            {/* <View style={styles.statusRow}>
              <Text variant="bodySmall" style={[styles.statusText, { color: getStatusColor() }]}>
                {isWatched
                  ? "Watched"
                  : WatchlistItemUtils.isInWatchlist(item)
                  ? "To Watch"
                  : "Not Added"}
              </Text>
            </View> */}
          </Card.Content>
        </Pressable>

        {showActions && (
          <Pressable onPress={(e) => e.stopPropagation()} style={styles.actionsContainer}>
            <WatchlistItemActions
              item={{ ...item, mediaType }}
              onToggleWatched={onToggleWatched}
              onRemove={onRemove}
              onAdd={onAdd}
              size="small"
              layout="horizontal"
            />
          </Pressable>
        )}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  gridCard: {
    flex: 1,
    margin: 4,
    // maxWidth: "48%",
  },
  gridContent: {
    flex: 1,
  },
  pressableContent: {
    flex: 1,
  },
  posterContainer: {
    position: "relative",
    aspectRatio: 2 / 3,
  },
  gridPoster: {
    width: "100%",
    height: "100%",
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  statusIndicator: {
    position: "absolute",
    top: 8,
    right: 8,
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  tmdbRatingOverlay: {
    position: "absolute",
    bottom: 8,
    right: 8,
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 4,
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
  },
  tmdbRatingText: {
    fontSize: 10,
    fontWeight: "bold",
  },
  gridInfo: {
    flex: 1,
    paddingTop: 8,
    paddingBottom: 8,
  },
  gridTitle: {
    fontWeight: "600",
    marginBottom: 4,
  },
  gridYear: {
    marginBottom: 4,
  },
  actionsContainer: {
    paddingHorizontal: 12,
    paddingBottom: 8,
    borderTopWidth: 1,
    borderTopColor: "rgba(0,0,0,0.1)",
  },

});
