import { NativeModule, requireNativeModule } from 'expo';

export type SpatialiteRow = { [key: string]: any };
export type SpatialiteParam = string | number | boolean | null;

export type QueryResult = {
  success: boolean;
  rowCount: number;
  data: SpatialiteRow[];
};

export type StatementResult = {
  success: boolean;
  rowsAffected: number;
};

export type InitResult = {
  success: boolean;
  path: string | null;
  spatialiteVersion: string;
};

export type ImportResult = {
  success: boolean;
  message: string;
  path?: string;
};

export type CloseResult = {
  success: boolean;
  message: string;
};

declare class ExpoSpatialiteModule extends NativeModule {
  getSpatialiteVersion(): string;
  
  importAssetDatabaseAsync(
    databasePath: string,
    assetDatabasePath: string,
    forceOverwrite: boolean
  ): Promise<ImportResult>;
  
  initDatabase(databasePath: string): Promise<InitResult>;
  
  executeQuery(
    sql: string,
    params?: SpatialiteParam[]
  ): Promise<QueryResult>;
  
  executeStatement(
    sql: string,
    params?: SpatialiteParam[]
  ): Promise<StatementResult>;
  
  closeDatabase(): Promise<CloseResult>;
}

// This call loads the native module object from the JSI.
export default requireNativeModule<ExpoSpatialiteModule>('ExpoSpatialite');