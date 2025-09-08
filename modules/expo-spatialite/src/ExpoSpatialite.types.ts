// Events payload types
export type ChangeEventPayload = {
  value: string;
};

export type OnLoadEventPayload = {
  url: string;
};

// Module events
export type ExpoSpatialiteEvents = {
  onChange: (params: ChangeEventPayload) => void;
};

// View props
export type ExpoSpatialiteViewProps = {
  url: string;
  onLoad: (event: { nativeEvent: OnLoadEventPayload }) => void;
};

// Database parameter type
export type SpatialiteParam = string | number | boolean | null;

// Database initialization result
export type InitDatabaseResult = {
  success: boolean;
  path: string;
  spatialiteVersion: string;
};

// Query execution result
export type QueryResult = {
  success: boolean;
  rowCount: number;
  data: Array<Record<string, any>>;
};

// Statement execution result
export type StatementResult = {
  success: boolean;
  rowsAffected: number;
};

// Database closing result
export type CloseDatabaseResult = {
  success: boolean;
  message: string;
};

// Asset database import result
export type ImportAssetDatabaseResult = {
  success: boolean;
  message: string;
  path?: string;
};

// File handling test result
export type TestFileHandlingResult = {
  success: boolean;
  lines?: string[];
  fileCreated?: boolean;
  error?: string;
};