import { Asset } from "expo-asset";
import * as FileSystem from "expo-file-system";
import ExpoSpatialiteRoomModule from "./ExpoSpatialiteRoomModule";
export * from "./ExpoSpatialiteRoom.types";
export { default as ExpoSpatialiteRoomModule } from "./ExpoSpatialiteRoomModule";

export type SQLiteProviderAssetSource = {
  assetId: number;
  forceOverwrite?: boolean;
};

/**
 * Creates a database path in the document directory
 */
export function createDatabasePath(databaseName: string, directory?: string): string {
  const documentsDirectory = FileSystem.documentDirectory;
  if (!documentsDirectory) {
    throw new Error("Document directory is not available");
  }

  const baseDir = directory ? `${documentsDirectory}${directory}/` : documentsDirectory;
  const fullPath = `${baseDir}${databaseName}`;

  // Return the path without file:// scheme for Android compatibility
  return fullPath.replace('file://', '');
}

/**
 * Imports an asset database into the SQLite database directory.
 *
 * @param databaseName The name of the database file
 * @param assetSource Asset source configuration
 * @param directory Optional subdirectory within the documents directory
 */
export async function importDatabaseFromAssetAsync(
  databaseName: string,
  assetSource: SQLiteProviderAssetSource,
  directory?: string
) {
  const asset = await Asset.fromModule(assetSource.assetId).downloadAsync();
  if (!asset.localUri) {
    throw new Error(`Unable to get the localUri from asset ${assetSource.assetId}`);
  }
  const path = createDatabasePath(databaseName, directory);
  return await ExpoSpatialiteRoomModule.importAssetDatabaseAsync(
    path,
    asset.localUri,
    assetSource.forceOverwrite ?? false
  );
}

/**
 * Initializes a Spatialite database from a path
 */
export async function initDatabase(dbPath: string) {
  return await ExpoSpatialiteRoomModule.initDatabase(dbPath);
}

/**
 * Executes a SQL query
 */
export async function executeQuery(query: string, params?: any[]) {
  return await ExpoSpatialiteRoomModule.executeQuery(query, params);
}

/**
 * Executes a SQL statement (INSERT, UPDATE, DELETE)
 */
export async function executeStatement(statement: string, params?: any[]) {
  return await ExpoSpatialiteRoomModule.executeStatement(statement, params);
}

/**
 * Creates a spatial table
 
 */
export async function createSpatialTable(
  tableName: string,
  geometryColumn: string,
  geometryType: string,
  srid: number
) {
  return await ExpoSpatialiteRoomModule.createSpatialTable(
    tableName,
    geometryColumn,
    geometryType,
    srid
  );
}

/**
 * Inserts a spatial point
 */
export async function insertSpatialPoint(
  tableName: string,
  geometryColumn: string,
  name: string,
  description: string,
  latitude: number,
  longitude: number
) {
  return await ExpoSpatialiteRoomModule.insertSpatialPoint(
    tableName,
    geometryColumn,
    name,
    description,
    latitude,
    longitude
  );
}

/**
 * Finds points within a radius
 */
export async function findPointsWithinRadius(
  tableName: string,
  geometryColumn: string,
  latitude: number,
  longitude: number,
  radiusMeters: number
) {
  return await ExpoSpatialiteRoomModule.findPointsWithinRadius(
    tableName,
    geometryColumn,
    latitude,
    longitude,
    radiusMeters
  );
}

/**
 * Closes the database
 */
export async function closeDatabase() {
  return await ExpoSpatialiteRoomModule.closeDatabase();
}
