import React, { createContext, memo, useContext, useEffect, useRef, useState } from "react";
import {
  initDatabase,
  executeQuery,
  executeStatement,
  importDatabaseFromAssetAsync,
  closeDatabase,
  createDatabasePath
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
  location?: string;

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
    initDatabase: (path: string) => Promise<any>;
    executeQuery: (sql: string, params?: any[]) => Promise<any>;
    executeStatement: (sql: string, params?: any[]) => Promise<any>;
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

//#region Internals
type DatabaseInstanceType = Pick<
  ExpoSpatialiteProviderProps,
  "databaseName" | "location" | "assetSource" | "onInit"
> & {
  promise: Promise<any> | null;
};

let databaseInstance: DatabaseInstanceType | null = null;

function ExpoSpatialiteProviderSuspense({
  databaseName,
  location,
  assetSource,
  children,
  onInit,
}: Omit<ExpoSpatialiteProviderProps, "onError" | "useSuspense">) {
  const databasePromise = getDatabaseAsync({
    databaseName,
    location,
    assetSource,
    onInit,
  });

  const database = use(databasePromise);

  return (
    <ExpoSpatialiteContext.Provider 
      value={{ executeQuery, executeStatement, initDatabase }}
    >
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
      value={{ executeQuery, executeStatement, initDatabase }}
    >
      {children}
    </ExpoSpatialiteContext.Provider>
  );
}

async function setupDatabaseAsync({
  databaseName,
  location,
  assetSource,
  onInit,
}: Pick<ExpoSpatialiteProviderProps, "databaseName" | "location" | "assetSource" | "onInit">): Promise<string> {
  // Create database path
  const dbPath = location 
    ? `${location.replace(/\/$/, '')}/${databaseName}` 
    : createDatabasePath(databaseName);

  // Import asset database if specified
  if (assetSource != null) {
    await importDatabaseFromAssetAsync(
      databaseName,
      assetSource.assetId,
      assetSource.forceOverwrite ?? false,
      location
    );
  }

  // Initialize the Spatialite database
  await initDatabase(dbPath);

  // Run initialization hook if provided
  if (onInit != null) {
    await onInit({ initDatabase, executeQuery, executeStatement });
  }

  return dbPath;
}

function getDatabaseAsync({
  databaseName,
  location,
  assetSource,
  onInit,
}: Pick<ExpoSpatialiteProviderProps, "databaseName" | "location" | "assetSource" | "onInit">): Promise<any> {
  if (
    databaseInstance?.promise != null &&
    databaseInstance?.databaseName === databaseName &&
    databaseInstance?.location === location &&
    deepEqual(databaseInstance?.assetSource, assetSource) &&
    databaseInstance?.onInit === onInit
  ) {
    return databaseInstance.promise;
  }

  let promise: Promise<any>;

  if (databaseInstance?.promise != null) {
    promise = databaseInstance.promise
      .then(() => {
        return closeDatabase();
      })
      .then(() => {
        return setupDatabaseAsync({
          databaseName,
          location,
          assetSource,
          onInit,
        });
      });
  } else {
    promise = setupDatabaseAsync({ databaseName, location, assetSource, onInit });
  }

  databaseInstance = {
    databaseName,
    location,
    assetSource,
    onInit,
    promise,
  };

  return promise;
}

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

//#region Private Suspense API similar to `React.use`
// Referenced from https://github.com/vercel/swr/blob/1d8110900d1aee3747199bfb377b149b7ff6848e/_internal/src/types.ts#L27-L31
type ReactUsePromise<T, E extends Error = Error> = Promise<T> & {
  status?: "pending" | "fulfilled" | "rejected";
  value?: T;
  reason?: E;
};

/**
 * A custom hook like [`React.use`](https://react.dev/reference/react/use) hook using private Suspense implementation.
 */
function use<T>(promise: Promise<T> | ReactUsePromise<T>) {
  if (isReactUsePromise(promise)) {
    if (promise.status === "fulfilled") {
      if (promise.value === undefined) {
        throw new Error("[use] Unexpected undefined value from promise");
      }
      return promise.value;
    } else if (promise.status === "rejected") {
      throw promise.reason;
    } else if (promise.status === "pending") {
      throw promise;
    }
    throw new Error("[use] Promise is in an invalid state");
  }

  const suspensePromise = promise as ReactUsePromise<T>;
  suspensePromise.status = "pending";
  suspensePromise.then(
    (result: T) => {
      suspensePromise.status = "fulfilled";
      suspensePromise.value = result;
    },
    (reason) => {
      suspensePromise.status = "rejected";
      suspensePromise.reason = reason;
    }
  );
  throw suspensePromise;
}

function isReactUsePromise<T>(
  promise: Promise<T> | ReactUsePromise<T>
): promise is ReactUsePromise<T> {
  return typeof promise === "object" && promise !== null && "status" in promise;
}
//#endregion
