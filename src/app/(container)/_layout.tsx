import { LoadingFallback } from "@/components/state-screens/LoadingFallback";
import { useQuery } from "@tanstack/react-query";
import { Stack } from "expo-router";
import Spatilite from "@/modules/expo-spatialite-room";
import * as FileSystem from "expo-file-system";
import { Asset } from "expo-asset";

// this grouped routes  (contaner) layout exists because tanstcak query provider is defined in the root layout making it hard to useQuery in that layout

export default function ContainerLayout() {

const { data, isPending } = useQuery({
  queryKey: ["db"],
  queryFn: async () => {
    try {
      // Load the asset
      const asset = Asset.fromModule(require("@/assets/kenya_wards.db"));
      await asset.downloadAsync();

      if (!asset.localUri) {
        throw new Error("Asset local URI is null");
      }

      console.log("\n\n\ Database asset local URI:", asset.localUri);
      console.log("Document directory:", FileSystem.documentDirectory);
      // Copy to a writable location
      const destinationUri = `${FileSystem.documentDirectory}kenya_wards.db`;

      const fileInfo = await FileSystem.getInfoAsync(destinationUri);
      if (!fileInfo.exists) {
        await FileSystem.copyAsync({
          from: asset.localUri,
          to: destinationUri,
        });
      }

      // Now initialize with the full path
      const result = await Spatilite.initDatabase(asset.localUri);

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

  return (
    <Stack>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
    </Stack>
  );
}
