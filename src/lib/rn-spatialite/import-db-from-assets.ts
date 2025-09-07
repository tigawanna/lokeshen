import { Asset } from "expo-asset";

export interface SQLiteProviderAssetSource {
  /**
   * The asset ID returned from the `require()` call.
   */
  assetId: number;

  /**
   * Force overwrite the local database file even if it already exists.
   * @default false
   */
  forceOverwrite?: boolean;
}

/**
 * Import a bundled database file from the specified asset module.
 * @example
 * ```ts
 * assetSource={{ assetId: require('./assets/db.db') }}
 * ```
 */
// assetSource?: SQLiteProviderAssetSource;

/**
 * Resolves the database directory from the given directory or the default directory.
 *
 * @hidden
 */

function resolveDbDirectory(directory: string | undefined, defaultDirectory: string): string {
  const resolvedDirectory = directory ?? defaultDirectory;
  if (resolvedDirectory === null) {
    throw new Error("Both provided directory and defaultDatabaseDirectory are null.");
  }
  return resolvedDirectory;
}

/**
 * Creates a normalized database path by combining the directory and database name.
 *
 * Ensures the directory does not end with a trailing slash and the database name
 * does not start with a leading slash, preventing redundant slashes in the final path.
 *
 * @hidden
 */
export function createDatabasePath({
  databaseName,
  directory,
  defaultDatabaseDirectory,
}: {
  databaseName: string;
  defaultDatabaseDirectory: string;
  directory?: string;
}): string {
  if (databaseName === ":memory:") return databaseName;
  const resolvedDirectory = resolveDbDirectory(directory, defaultDatabaseDirectory);

  function removeTrailingSlash(path: string): string {
    return path.replace(/\/*$/, "");
  }
  function removeLeadingSlash(path: string): string {
    return path.replace(/^\/+/, "");
  }

  return `${removeTrailingSlash(resolvedDirectory)}/${removeLeadingSlash(databaseName)}`;
}

/**
 * Imports an asset database into the SQLite database directory.
 *
 * Exposed only for testing purposes.
 * @hidden
 */
export async function importDatabaseFromAssetAsync(
  { databaseName, directory, defaultDatabaseDirectory }: {
    databaseName: string,
    directory?: string,
    defaultDatabaseDirectory: string
  },
  assetSource: SQLiteProviderAssetSource
) {
  const asset = await Asset.fromModule(assetSource.assetId).downloadAsync();
  if (!asset.localUri) {
    throw new Error(`Unable to get the localUri from asset ${assetSource.assetId}`);
  }
  const path = createDatabasePath({ databaseName, directory, defaultDatabaseDirectory });
  // await ExpoSQLite.importAssetDatabaseAsync(
  //   path,
  //   asset.localUri,
  //   assetSource.forceOverwrite ?? false
  // );
}
