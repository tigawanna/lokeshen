import { LoadingFallback } from "@/components/state-screens/LoadingFallback";
import { useQuery } from "@tanstack/react-query";
import { Stack } from "expo-router";
import Spatilite from "@/modules/expo-spatialite-room";

// this grouped routes  (contaner) layout exists because tanstcak query provider is defined in the root layout making it hard to useQuery in that layout

export default function ContainerLayout() {
  const { data, isPending } = useQuery({
    queryKey: ["db"],
    queryFn: async () => {
      try {
        const result = await Spatilite.initDatabase("assets/kenya_wards.db");
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
