import { ExpoSpatialiteProvider } from "@/lib/expo-spatialite/ExpoSpatialiteProvider";
import { Suspense } from "react";
import { Text } from "react-native";

export function ExpoSpatialiteWrapper({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<Text>Loading Spatialite database...</Text>}>
      <ExpoSpatialiteProvider
        databaseName="app.db"
        location=":memory"
        onInit={async ({ executeStatement }) => {
          // Performance optimizations
          await executeStatement("PRAGMA mmap_size=268435456"); // 256MB memory mapping
          await executeStatement("PRAGMA journal_mode=WAL"); // Write-Ahead Logging
          await executeStatement("PRAGMA synchronous=NORMAL"); // Faster writes
        }}
        onError={(error) => {
          console.error("\n ❌ Spatialite database error:", error);
          // Log to crash reporting service
          // Show user-friendly error message
        }}
      >
        {children}
      </ExpoSpatialiteProvider>
    </Suspense>
  );
}
