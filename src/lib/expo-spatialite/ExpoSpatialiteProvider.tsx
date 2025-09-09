import React, { createContext, memo, useContext, useEffect, useRef, useState } from "react";
import {
  initDatabase,
  executeQuery,
  executeStatement,
  executePragmaQuery,
  importDatabaseFromAssetAsync,
  closeDatabase,
  createDatabasePath,
} from "@/modules/expo-spatialite";

export interface ExpoSpatialiteProviderAssetSource {
  /**
   * The asset ID from require() or Asset.fromModule()
   * @example require('../assets/databases/sample.db')
   */
  assetId: number;

  /**
   * Whether to force overwrite existing database
   * @default false
   */
  forceOverwrite?: boolean;
}

export interface ExpoSpatialiteProviderProps {
  /**
   * The name of the database file to open.
   */
  databaseName: string;

  /**
   * The location of the database file. Can be relative, absolute, or ':memory:' for in-memory database.
   * @default Uses FileSystem.documentDirectory
   */
  location?: ":memory:" | (string & {});

  /**
   * Import a bundled database file from assets.
   * @example
   * ```ts
   * assetSource={{ assetId: require('../assets/databases/sample.db') }}
   * ```
   */
  assetSource?: ExpoSpatialiteProviderAssetSource;

  /**
   * The children to render.
   */
  children: React.ReactNode;

  /**
   * A custom initialization handler to run before rendering the children.
   * You can use this to run database migrations or other setup tasks.
   */
  onInit?: (context: {
    initDatabase: typeof initDatabase;
    executeQuery: typeof executeQuery;
    executePragmaQuery: typeof executePragmaQuery;
    executeStatement: typeof executeStatement;
  }) => Promise<void>;

  /**
   * Handle errors from ExpoSpatialiteProvider.
   * @default rethrow the error
   */
  onError?: (error: Error) => void;

  /**
   * Enable [`React.Suspense`](https://react.dev/reference/react/Suspense) integration.
   * @default false
   */
  useSuspense?: boolean;
}

/**
 * Create a context for the Expo Spatialite database
 */
const ExpoSpatialiteContext = createContext<{
  executeQuery: (sql: string, params?: any[]) => Promise<any>;
  executeStatement: (sql: string, params?: any[]) => Promise<any>;
  executePragmaQuery: (pragma: string) => Promise<any>;
  initDatabase: (path: string) => Promise<any>;
} | null>(null);

/**
 * Context.Provider component that provides an Expo Spatialite database to all children.
 * All descendants of this component will be able to access the database using the [`useExpoSpatialiteContext`](#useexpospatialitecontext) hook.
 */
export const ExpoSpatialiteProvider = memo(
  function ExpoSpatialiteProvider({
    children,
    onError,
    useSuspense = false,
    ...props
  }: ExpoSpatialiteProviderProps) {
    if (onError != null && useSuspense) {
      throw new Error("Cannot use `onError` with `useSuspense`, use error boundaries instead.");
    }

    if (useSuspense) {
      return <ExpoSpatialiteProviderSuspense {...props}>{children}</ExpoSpatialiteProviderSuspense>;
    }

    return (
      <ExpoSpatialiteProviderNonSuspense {...props} onError={onError}>
        {children}
      </ExpoSpatialiteProviderNonSuspense>
    );
  },
  (prevProps: ExpoSpatialiteProviderProps, nextProps: ExpoSpatialiteProviderProps) =>
    prevProps.databaseName === nextProps.databaseName &&
    prevProps.location === nextProps.location &&
    deepEqual(prevProps.assetSource, nextProps.assetSource) &&
    prevProps.onInit === nextProps.onInit &&
    prevProps.onError === nextProps.onError &&
    prevProps.useSuspense === nextProps.useSuspense
);

/**
 * A global hook for accessing the Expo Spatialite database across components.
 * This hook should only be used within a [`<ExpoSpatialiteProvider>`](#expospatialiteprovider) component.
 *
 * @example
 * ```tsx
 * export default function App() {
 *   return (
 *     <ExpoSpatialiteProvider databaseName="test.db">
 *       <Main />
 *     </ExpoSpatialiteProvider>
 *   );
 * }
 *
 * export function Main() {
 *   const { executeQuery } = useExpoSpatialiteContext();
 *   const result = await executeQuery('SELECT spatialite_version()');
 *   console.log('spatialite version', result.data?.[0]);
 *   return <View />
 * }
 * ```
 */
export function useExpoSpatialiteContext() {
  const context = useContext(ExpoSpatialiteContext);
  if (context == null) {
    throw new Error("useExpoSpatialiteContext must be used within a <ExpoSpatialiteProvider>");
  }
  return context;
}




function ExpoSpatialiteProviderSuspense({
 children,
  onInit,
}: Omit<ExpoSpatialiteProviderProps, "onError" | "useSuspense">) {
  // const databasePromise = getDatabaseAsync({
  //   databaseName,
  //   location,
  //   assetSource,
  //   onInit,
  // });

  // const database = use(databasePromise);

  return (
    <ExpoSpatialiteContext.Provider
      value={{ executeQuery, executeStatement, initDatabase, executePragmaQuery }}>
      {children}
    </ExpoSpatialiteContext.Provider>
  );
}

function ExpoSpatialiteProviderNonSuspense({
  databaseName,
  location,
  assetSource,
  children,
  onInit,
  onError,
}: Omit<ExpoSpatialiteProviderProps, "useSuspense">) {
  const databaseRef = useRef<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    async function setup() {
      try {
        const dbPath = await setupDatabaseAsync({
          databaseName,
          location,
          assetSource,
          onInit,
        });
        databaseRef.current = dbPath;
        setLoading(false);
      } catch (e: any) {
        setError(e);
      }
    }

    async function teardown() {
      try {
        await closeDatabase();
      } catch (e: any) {
        setError(e);
      }
    }

    setup();

    return () => {
      teardown();
      databaseRef.current = null;
      setLoading(true);
    };
  }, [databaseName, location, assetSource, onInit]);

  if (error != null) {
    const handler =
      onError ??
      ((e) => {
        throw e;
      });
    handler(error);
  }

  if (loading) {
    return null;
  }

  return (
    <ExpoSpatialiteContext.Provider
      value={{ executeQuery, executeStatement, initDatabase, executePragmaQuery }}>
      {children}
    </ExpoSpatialiteContext.Provider>
  );
}

async function setupDatabaseAsync({
  databaseName,
  location,
  assetSource,
  onInit,
}: Pick<
  ExpoSpatialiteProviderProps,
  "databaseName" | "location" | "assetSource" | "onInit"
>): Promise<string> {
  let dbPath: string;

  // Handle in-memory database (simplest case)
  if (location === ":memory:") {
    if (assetSource != null) {
      console.warn("Cannot use :memory: with assetSource. Using file-based database instead.");
      // Fall through to file-based logic
    } else {
      dbPath = ":memory:";
      await initDatabase(dbPath);
      if (onInit != null) {
        await onInit({ initDatabase, executeQuery, executeStatement, executePragmaQuery });
      }
      return dbPath;
    }
  }

  // Handle file-based databases
  if (assetSource != null) {
    // Import asset database first
    try {
      await importDatabaseFromAssetAsync(
        databaseName,
        assetSource.assetId,
        assetSource.forceOverwrite ?? false,
        location // Pass location as directory parameter
      );
    } catch (error) {
      console.error("Failed to import database from asset:", error);
      throw error;
    }

    // Construct the correct path that matches what importDatabaseFromAssetAsync created
    dbPath = createDatabasePath(databaseName, location);
  } else {
    // No asset import - just create/open database at specified location
    dbPath = createDatabasePath(databaseName, location);
  }

  // Initialize the Spatialite database
  try {
    await initDatabase(dbPath);
  } catch (error) {
    console.error("Failed to initialize database at path:", dbPath, error);
    throw error;
  }

  // Run initialization hook if provided
  if (onInit != null) {
    await onInit({ initDatabase, executeQuery, executeStatement, executePragmaQuery });
  }

  return dbPath;
}

// function getDatabaseAsync({
//   databaseName,
//   location,
//   assetSource,
//   onInit,
// }: Pick<
//   ExpoSpatialiteProviderProps,
//   "databaseName" | "location" | "assetSource" | "onInit"
// >): Promise<any> {
//   if (
//     databaseInstance?.promise != null &&
//     databaseInstance?.databaseName === databaseName &&
//     databaseInstance?.location === location &&
//     deepEqual(databaseInstance?.assetSource, assetSource) &&
//     databaseInstance?.onInit === onInit
//   ) {
//     return databaseInstance.promise;
//   }

//   let promise: Promise<any>;

//   if (databaseInstance?.promise != null) {
//     promise = databaseInstance.promise
//       .then(() => {
//         return closeDatabase();
//       })
//       .then(() => {
//         return setupDatabaseAsync({
//           databaseName,
//           location,
//           assetSource,
//           onInit,
//         });
//       });
//   } else {
//     promise = setupDatabaseAsync({ databaseName, location, assetSource, onInit });
//   }

//   databaseInstance = {
//     databaseName,
//     location,
//     assetSource,
//     onInit,
//     promise,
//   };

//   return promise;
// }

/**
 * Compares two objects deeply for equality.
 */
function deepEqual(
  a: { [key: string]: any } | undefined,
  b: { [key: string]: any } | undefined
): boolean {
  if (a === b) {
    return true;
  }
  if (a == null || b == null) {
    return false;
  }
  if (typeof a !== "object" || typeof b !== "object") {
    return false;
  }
  return (
    Object.keys(a).length === Object.keys(b).length &&
    Object.keys(a).every((key) => deepEqual(a[key], b[key]))
  );
}





