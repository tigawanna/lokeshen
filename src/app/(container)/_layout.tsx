import { LoadingFallback } from "@/components/state-screens/LoadingFallback";
import { useQuery } from "@tanstack/react-query";
import { Stack } from "expo-router";
import Spatilite from "@/modules/expo-spatialite-room";
import * as FileSystem from "expo-file-system";
import { Asset } from "expo-asset";
import {
  createDatabasePath,
  importDatabaseFromAssetAsync,
  initDatabase,
} from "@/modules/expo-spatialite-room/src";
import { Surface, Text } from "react-native-paper";

// this grouped routes  (contaner) layout exists because tanstcak query provider is defined in the root layout making it hard to useQuery in that layout

export default function ContainerLayout() {
  const { data, isPending } = useQuery({
    queryKey: ["db"],
    queryFn: async () => {
      try {
        // Step 1: Import the asset database (only needed once or when updating)
        await importDatabaseFromAssetAsync(
          "kenya_wards.db",
          {
            assetId: require("@/assets/kenya_wards.db"),
            forceOverwrite: false, // Won't overwrite if already exists
          },
          "data"
        );
        // Step 2: Initialize the database connection
        const dbPath = createDatabasePath("kenya_wards.db");
        const result = await initDatabase(dbPath);
        return {
          result,
          error: null,
        };
      } catch (error) {
        return {
          result: null,
          error: error instanceof Error ? error.message : "Unknown error loading database",
        };
      }
    },
  });

  console.log("db init result", data);

  if (isPending) {
    return <LoadingFallback />;
  }
  if (data?.error) {
    return (
      <Surface style={{ flex: 1, justifyContent: "center", alignItems: "center", padding: 20 }}>
        <Text variant="titleLarge">Error loading database</Text>
        <Text style={{ marginTop: 10, paddingHorizontal: 20 }}>{data.error}</Text>
      </Surface>
    );
  }

  return (
    <Stack>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
    </Stack>
  );
}
