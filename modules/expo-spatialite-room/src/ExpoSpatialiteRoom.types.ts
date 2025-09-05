// Events payload types
export type ChangeEventPayload = {
  value: string;
};

export type OnLoadEventPayload = {
  url: string;
};

// Module events
export type ExpoSpatialiteRoomEvents = {
  onChange: (params: ChangeEventPayload) => void;
};

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

// Spatial table creation result
export type CreateTableResult = {
  success: boolean;
  message: string;
};

// Point insertion result
export type InsertPointResult = {
  success: boolean;
  message: string;
};

// Point within radius result
export type PointWithinRadius = {
  id: number;
  name: string;
  description: string;
  longitude: number;
  latitude: number;
  distance: number;
};

export type FindPointsResult = {
  success: boolean;
  points: PointWithinRadius[];
};

// Database closing result
export type CloseDatabaseResult = {
  success: boolean;
  message: string;
};
