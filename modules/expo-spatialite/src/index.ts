import { Asset } from "expo-asset";
import * as FileSystem from "expo-file-system";
import ExpoSpatialiteModule from "./ExpoSpatialiteModule";

// Import types
import type {
  CloseDatabaseResult,
  ImportAssetDatabaseResult,
  InitDatabaseResult,
  QueryResult,
  SpatialiteParam,
  StatementResult,
  PragmaQueryResult,
} from "./ExpoSpatialiteModule";

// Re-export core types
export type {
  CloseDatabaseResult,
  ImportAssetDatabaseResult,
  InitDatabaseResult,
  QueryResult,
  SpatialiteParam,
  StatementResult,
  PragmaQueryResult,
} from "./ExpoSpatialiteModule";

// Export view props

/**
 * Get the Spatialite version
 * @returns The Spatialite version string
 */
export function getSpatialiteVersion(): string {
  return ExpoSpatialiteModule.getSpatialiteVersion();
}

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
  return fullPath.replace("file://", "");
}

/**
 * Imports an asset database into the SQLite database directory.
 *
 * @param databaseName The name of the database file
 * @param assetId The asset ID from require() or Asset.fromModule()
 * @param forceOverwrite Whether to overwrite existing database
 * @param directory Optional subdirectory within the documents directory
 */
export async function importDatabaseFromAssetAsync(
  databaseName: string,
  assetId: number,
  forceOverwrite: boolean = false,
  directory?: string
) {
  const asset = await Asset.fromModule(assetId).downloadAsync();
  if (!asset.localUri) {
    throw new Error(`Unable to get the localUri from asset ${assetId}`);
  }
  const path = createDatabasePath(databaseName, directory);
  return await ExpoSpatialiteModule.importAssetDatabaseAsync(
    path,
    asset.localUri.replace("file://", ""),
    forceOverwrite
  );
}

/**
 * Import a database from app assets to a specified path
 * @param databasePath The path where the database should be imported
 * @param assetDatabasePath The path to the database asset in the app bundle
 * @param forceOverwrite Whether to overwrite existing database
 * @returns Import result with success status and path
 */
export async function importAssetDatabaseAsync(
  databasePath: string,
  assetDatabasePath: string,
  forceOverwrite: boolean = false
): Promise<ImportAssetDatabaseResult> {
  const result = await ExpoSpatialiteModule.importAssetDatabaseAsync(
    databasePath,
    assetDatabasePath,
    forceOverwrite
  );

  return {
    success: result.success,
    message: result.message,
    path: result.path,
  };
}

/**
 * Initialize a Spatialite database from a file path
 * @param databasePath The path to the database file
 * @returns Initialization result with success status and version info
 */
export async function initDatabase(databasePath: string): Promise<InitDatabaseResult> {
  const result = await ExpoSpatialiteModule.initDatabase(databasePath);

  return {
    success: result.success,
    path: result.path || "",
    spatialiteVersion: result.spatialiteVersion,
  };
}

/**
 * Execute a SQL query and return results with generic type support
 * @param sql The SQL query to execute
 * @param params Optional parameters for the query
 * @returns Query result with rows of data
 */
export async function executeQuery<T extends Record<string, any> = Record<string, any>>(
  sql: string,
  params?: SpatialiteParam[]
): Promise<QueryResult<T>> {
  const result = await ExpoSpatialiteModule.executeQuery(sql, params);

  return {
    success: result.success,
    rowCount: result.rowCount,
    data: result.data as T[],
  };
}

/**
 * Execute a SQL statement that doesn't return results (INSERT, UPDATE, DELETE)
 * @param sql The SQL statement to execute
 * @param params Optional parameters for the statement
 * @returns Statement result with number of affected rows
 */
export async function executeStatement(
  sql: string,
  params?: SpatialiteParam[]
): Promise<StatementResult> {
  const result = await ExpoSpatialiteModule.executeStatement(sql, params);

  return {
    success: result.success,
    rowsAffected: result.rowsAffected,
  };
}

/**
 * Execute a PRAGMA query that returns results with generic type support
 * @param pragma The PRAGMA statement to execute
 * @returns PRAGMA query result with data
 */
export async function executePragmaQuery<T extends Record<string, any> = Record<string, any>>(
  pragma: string
): Promise<PragmaQueryResult<T>> {
  const result = await ExpoSpatialiteModule.executePragmaQuery(pragma);

  return {
    success: result.success,
    data: result.data as T[],
  };
}

/**
 * Close the currently open database
 * @returns Close result with success status
 */
export async function closeDatabase(): Promise<CloseDatabaseResult> {
  const result = await ExpoSpatialiteModule.closeDatabase();

  return {
    success: result.success,
    message: result.message,
  };
}
