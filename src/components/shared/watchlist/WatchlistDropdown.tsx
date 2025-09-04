import { addToWatchListItemsMutationOptions } from "@/lib/tanstack/operations/watchlist-items/query-options";
import { getUserWatchlistQueryOptions } from "@/lib/tanstack/operations/watchlist/operations-options";
import { unifiedMediaToWatchlistItem } from "@/lib/utils/watchlist-helpers";
import { useUserInfoStore } from "@/store/user-info-store";
import { UnifiedMediaItem } from "@/types/unified-media";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import { StyleSheet, View } from "react-native";
import { Button, HelperText, Text, useTheme } from "react-native-paper";
import { Dropdown } from "react-native-paper-dropdown";

interface WatchlistDropdownProps {
  mediaItem: UnifiedMediaItem;
  onAddToWatchlist?: (watchlistId: string, mediaItem: UnifiedMediaItem) => void;
  onSuccess?: () => void;
  size?: "small" | "medium" | "large";
  mode?: "icon" | "text" | "contained";
}

export function WatchlistDropdown({
  mediaItem,
  onAddToWatchlist,
  onSuccess,
  size = "medium",
  mode = "contained",
}: WatchlistDropdownProps) {
  const { colors } = useTheme();
  const router = useRouter();
  const { userInfo } = useUserInfoStore();
  const [selectedWatchlist, setSelectedWatchlist] = useState<string>("");

  const { data: watchlists, isLoading, error } = useQuery({
    ...getUserWatchlistQueryOptions({ userId: userInfo?.id }),
    enabled: !!userInfo?.id,
  });

  const addToWatchlistMutation = useMutation({
    ...addToWatchListItemsMutationOptions(),
    onSuccess: () => {
      setSelectedWatchlist("");
      onSuccess?.();
      if (onAddToWatchlist) {
        onAddToWatchlist(selectedWatchlist, mediaItem);
      }
    },
  });

  const handleAddToWatchlist = () => {
    if (selectedWatchlist && userInfo?.id) {
      const payload = unifiedMediaToWatchlistItem(mediaItem, userInfo.id);
      addToWatchlistMutation.mutate({ userId: userInfo.id, payload });
    }
  };

  const handleCreateWatchlist = () => {
    router.push("/(container)/(tabs)/profile?createWatchlist=true");
  };

  // If user is not authenticated
  if (!userInfo) {
    return (
      <Button
        mode="outlined"
        onPress={() => router.push("/(container)/(auth)/signin")}
        compact={size === "small"}
        style={styles.button}
      >
        Sign in to add
      </Button>
    );
  }

  // If loading watchlists
  if (isLoading) {
    return (
      <Button
        mode="outlined"
        loading
        disabled
        compact={size === "small"}
        style={styles.button}
      >
        Loading...
      </Button>
    );
  }

  // If error loading watchlists
  if (error) {
    return (
      <Button
        mode="outlined"
        onPress={() => router.push("/(container)/(tabs)/profile")}
        compact={size === "small"}
        style={styles.button}
      >
        View Profile
      </Button>
    );
  }

  // If no watchlists exist
  if (!watchlists?.items || watchlists.items.length === 0) {
    return (
      <View style={styles.container}>
        <Text variant="bodySmall" style={[styles.noWatchlistsText, { color: colors.onSurfaceVariant }]}>
          No watchlists found
        </Text>
        <Button
          mode="contained"
          onPress={handleCreateWatchlist}
          compact={size === "small"}
          style={styles.createButton}
        >
          Create Watchlist
        </Button>
      </View>
    );
  }

  // Convert watchlists to dropdown options
  const watchlistOptions = watchlists.items.map((watchlist) => ({
    label: watchlist.title || "Untitled Watchlist",
    value: watchlist.id,
  }));

  return (
    <View style={styles.container}>
      <Dropdown
        label="Add to Watchlist"
        placeholder="Select a watchlist"
        options={watchlistOptions}
        value={selectedWatchlist}
        onSelect={(value) => setSelectedWatchlist(value || "")}
      />
      
      <View style={styles.actionButtons}>
        <Button
          mode="contained"
          onPress={handleAddToWatchlist}
          disabled={!selectedWatchlist || addToWatchlistMutation.isPending}
          loading={addToWatchlistMutation.isPending}
          compact={size === "small"}
          style={[styles.addButton, { opacity: selectedWatchlist ? 1 : 0.6 }]}
        >
          Add
        </Button>
        
        <Button
          mode="outlined"
          onPress={handleCreateWatchlist}
          compact={size === "small"}
          style={styles.createButton}
        >
          Create New
        </Button>
      </View>

      {addToWatchlistMutation.isError ? (
        <HelperText type="error" visible>
          {addToWatchlistMutation.error?.message || "Failed to add to watchlist"}
        </HelperText>
      ) : null}

      {addToWatchlistMutation.isSuccess ? (
        <HelperText type="info" visible>
          Added to watchlist successfully!
        </HelperText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    minWidth: 200,
  },
  button: {
    marginVertical: 4,
  },
  noWatchlistsText: {
    textAlign: "center",
    marginBottom: 8,
  },
  actionButtons: {
    flexDirection: "row",
    gap: 8,
    marginTop: 8,
  },
  addButton: {
    flex: 1,
  },
  createButton: {
    flex: 1,
  },
});
