import { ExpoSpatialiteProvider } from "@/lib/expo-spatialite/ExpoSpatialiteProvider";
import { Suspense } from "react";
import { Text } from "react-native";

export function ExpoSpatialiteWrapper({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<Text>Loading Spatialite database...</Text>}>
      <ExpoSpatialiteProvider
        databaseName="app.db"
        location="test"
        onInit={async ({ executeStatement, executeQuery,executePragmaQuery }) => {
          // await executeStatement("PRAGMA synchronous=NORMAL"); // Faster writes
          await executePragmaQuery("PRAGMA journal_mode=WAL"); // Write-Ahead Logging
          // await executeStatement("PRAGMA mmap_size=268435456"); // 256MB memory mapping
          const tables  = await executeQuery("SELECT name FROM sqlite_schema WHERE type='table' ORDER BY name;");
          // console.log("Existing tables:", JSON.stringify(tables,null,2));
          console.log("Existing tables:",tables.rowCount);
          // Performance optimizations
        }}
        onError={(error) => {
          console.error("\n ❌ Spatialite database error:", error);
          // Log to crash reporting service
          // Show user-friendly error message
        }}>
        {children}
      </ExpoSpatialiteProvider>
    </Suspense>
  );
}
