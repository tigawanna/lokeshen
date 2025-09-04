import { useSnackbar } from "@/components/react-native-paper/snackbar/global-snackbar-store";
import { pb } from "@/lib/pb/client";
import {
  quickAddToDefaultWatchlistMutationOptions,
  removeFromWatchListItemsMutationOptions,
} from "@/lib/tanstack/operations/watchlist-items/query-options";
// import { useIsInWatchlist } from "@/lib/tanstack/operations/watchlist/hooks";
// import { WatchlistItemUtils } from "./WatchlistItemUtils";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import React from "react";
import { Alert, StyleSheet, View } from "react-native";
import { IconButton, useTheme } from "react-native-paper";
import { UnifiedWatchlistItem } from "./types";
import { markWachedMutationOptions } from "@/lib/tanstack/operations/watchlist/operations-options";
import { TMDBDiscoverResponseWithWatched } from "@/lib/tanstack/operations/discover/tmdb-hooks";

interface WatchlistItemActionsProps {
  item: UnifiedWatchlistItem & { mediaType: string; watched?: boolean; inWatchList?: string[] };
  onToggleWatched?: (item: UnifiedWatchlistItem) => void;
  onRemove?: (item: UnifiedWatchlistItem) => void;
  onAdd?: (item: UnifiedWatchlistItem) => void;
  size?: "small" | "medium";
  layout?: "horizontal" | "vertical";
}

export function WatchlistItemActions({
  item,
  onToggleWatched,
  onRemove,
  onAdd,
  size = "medium",
  layout = "horizontal",
}: WatchlistItemActionsProps) {
  const { colors } = useTheme();
  const { showSnackbar } = useSnackbar();
  const qc = useQueryClient();
  const user = pb.authStore.record;
  const quickAddMutation = useMutation(quickAddToDefaultWatchlistMutationOptions(qc));
  const removeFromWatchlist = useMutation(removeFromWatchListItemsMutationOptions());
  const toggleWatchedStatus = useMutation(markWachedMutationOptions());

  // Use the hook to check if item is in watchlist based on TMDB ID
  // const tmdbId = item?.tmdb_id || (typeof item.id === "string" ? parseInt(item.id) : item.id);
  // const isInWatchlistFromHook = useIsInWatchlist({ tmdbId });

  const isWatched = item.watched;
  const isInWatchlist = item?.inWatchList && item?.inWatchList?.length > 0;

  const iconSize = size === "small" ? 18 : 20;

  // Check if any mutation is loading
  const isLoading =
    quickAddMutation.isPending || removeFromWatchlist.isPending || toggleWatchedStatus.isPending;

  const handleToggleWatched = async (event: any) => {
    event.stopPropagation();
    if (onToggleWatched) {
      onToggleWatched(item);
      return;
    }

    if (!user || !item.id) {
      showSnackbar("Unable to update watched status");
      return;
    }

    try {
      const itemId = typeof item.id === "string" ? item.id : String(item.id);
      await toggleWatchedStatus.mutateAsync({
        itemId,
        watched: !isWatched,
      });
      showSnackbar(`Marked as ${!isWatched ? "watched" : "unwatched"}`);
    } catch (error) {
      showSnackbar("Failed to update watched status");
      console.error("Toggle watched error:", error);
    }
  };

  const handleRemove = (event: any) => {
    event.stopPropagation();
    if (onRemove) {
      Alert.alert("Remove from Watchlist", `Remove "${item.title}" from your watchlist?`, [
        { text: "Cancel", style: "cancel" },
        {
          text: "Remove",
          style: "destructive",
          onPress: () => onRemove(item),
        },
      ]);
      return;
    }

    if (!item.id) {
      showSnackbar("Unable to remove item");
      return;
    }

    Alert.alert("Remove from Watchlist", `Remove "${item.title}" from your watchlist?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Remove",
        style: "destructive",
        onPress: async () => {
          try {
            const itemId = typeof item.id === "string" ? item.id : String(item.id);
            await removeFromWatchlist.mutateAsync({
              itemId,
            });
            showSnackbar("Removed from watchlist");
          } catch (error) {
            showSnackbar("Failed to remove from watchlist");
            console.log("Remove error:", error);
          }
        },
      },
    ]);
  };

  const handleAdd = async (event: any) => {
    event.stopPropagation();
    // console.log("Add to Watchlist === >> ", item);

    // const olditemsKeys = qc.getQueriesData({
    //   queryKey: ["tmdb", "discover", item.mediaType],
    //   type: "all",
    // });

    // const oldItemKey = olditemsKeys?.[0]?.[0]
    // qc.setQueryData(oldItemKey, (oldData: TMDBDiscoverResponseWithWatched) => {
    //   // Update the old data with the new item
    //   console.log("Old data === ", oldData);
    //   return {
    //     ...oldData,
    //     results: [...oldData?.results].map((oldItem) => {
    //       // console.log("== tmdbid == ",item.tmdb_id)
    //       // console.log("== Olditem == ", oldItem);
    //       if (oldItem.id === item.id) {
    //         console.log("Updating old item in TMDB Discover:", oldItem);
    //         return {
    //           ...oldItem,
    //           inWatchList: [...(oldItem.inWatchList || []), item.id],
    //           watched: true,
    //         };
    //       }
    //       return oldItem;
    //     }),
    //   };
    // });
    // const newItems = qc.getQueryData(oldItemKey);
    // console.log("New items in TMDB Discover:", newItems);
    // console.log("Old items in TMDB Discover:", oldItemKey);
    if (onAdd) {
      onAdd(item);
      return;
    }

    if (!user) {
      showSnackbar("Please sign in to add to watchlist");
      return;
    }

    const tmdbId = item?.tmdb_id || (typeof item.id === "string" ? parseInt(item.id) : item.id);

    try {
      await quickAddMutation.mutateAsync({
        userId: user.id,
        payload: {
          added_by: user.id,
          media_type: item.mediaType as any,
          tmdb_id: tmdbId,
          title: item.title,
          backdrop_path: item.backdrop_path || undefined,
          poster_path: item.poster_path || undefined,
          overview: item.overview || undefined,
          release_date: item.release_date || undefined,
          vote_average: item.vote_average || 0,
          genre_ids: item.genre_ids || [],
        },
      });
      showSnackbar("Added to watchlist");
    } catch (error) {
      showSnackbar("Failed to add to watchlist");
      console.log("Add error:", error);
    }
  };

  const containerStyle =
    layout === "vertical" ? styles.verticalContainer : styles.horizontalContainer;

  if (!isInWatchlist) {
    // Show add button for TMDB items not in watchlist
    return (
      <View style={containerStyle}>
        <IconButton
          icon={quickAddMutation.isPending ? "loading" : "bookmark-plus-outline"}
          size={iconSize}
          iconColor={colors.primary}
          onPress={handleAdd}
          disabled={isLoading}
          style={[styles.actionButton, isLoading && styles.loadingButton]}
        />
      </View>
    );
  }

  // Show toggle watched and remove buttons for watchlist items
  return (
    <View style={containerStyle}>
      <IconButton
        icon={
          toggleWatchedStatus.isPending
            ? "loading"
            : isWatched
            ? "check-circle"
            : "check-circle-outline"
        }
        size={iconSize}
        iconColor={isWatched ? colors.primary : colors.outline}
        onPress={handleToggleWatched}
        disabled={isLoading}
        style={[styles.actionButton, toggleWatchedStatus.isPending && styles.loadingButton]}
      />
      <IconButton
        icon={removeFromWatchlist.isPending ? "loading" : "delete-outline"}
        size={iconSize}
        iconColor={colors.error}
        onPress={handleRemove}
        disabled={isLoading}
        style={[styles.actionButton, removeFromWatchlist.isPending && styles.loadingButton]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  horizontalContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  verticalContainer: {
    flexDirection: "column",
    alignItems: "center",
  },
  actionButton: {
    margin: 0,
  },
  loadingButton: {
    opacity: 0.6,
  },
});
