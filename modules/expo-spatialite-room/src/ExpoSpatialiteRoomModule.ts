import { NativeModule, requireNativeModule } from 'expo';

import { 
  ExpoSpatialiteRoomEvents,
  InitDatabaseResult,
  QueryResult,
  StatementResult,
  CreateTableResult,
  InsertPointResult,
  FindPointsResult,
  CloseDatabaseResult
} from './ExpoSpatialiteRoom.types';

declare class ExpoSpatialiteRoomModule extends NativeModule<ExpoSpatialiteRoomEvents> {
  initDatabase(dbName: string): Promise<InitDatabaseResult>;
  executeQuery(query: string, params?: any[]): Promise<QueryResult>;
  executeStatement(statement: string, params?: any[]): Promise<StatementResult>;
  createSpatialTable(tableName: string, geometryColumn: string, geometryType: string, srid: number): Promise<CreateTableResult>;
  insertSpatialPoint(tableName: string, geometryColumn: string, name: string, description: string, latitude: number, longitude: number): Promise<InsertPointResult>;
  findPointsWithinRadius(tableName: string, geometryColumn: string, latitude: number, longitude: number, radiusMeters: number): Promise<FindPointsResult>;
  closeDatabase(): Promise<CloseDatabaseResult>;
}

// This call loads the native module object from the JSI.
export default requireNativeModule<ExpoSpatialiteRoomModule>('ExpoSpatialiteRoom');
