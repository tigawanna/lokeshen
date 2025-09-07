import { NativeModule, registerWebModule } from 'expo';

import {
    ChangeEventPayload,
    CloseDatabaseResult,
    CreateTableResult,
    FindPointsResult,
    InitDatabaseResult,
    InsertPointResult,
    QueryResult,
    StatementResult
} from './ExpoSpatialiteRoom.types';

type ExpoSpatialiteRoomEvents = {
  onChange: (params: ChangeEventPayload) => void;
}

class ExpoSpatialiteRoomModule extends NativeModule<ExpoSpatialiteRoomEvents> {
  async importAssetDatabaseAsync(databasePath: string, assetDatabasePath: string, forceOverwrite: boolean): Promise<ImportAssetDatabaseResult> {
    console.warn('ExpoSpatialiteRoomModule: importAssetDatabaseAsync() is not supported on web');
    return { success: false, message: 'Not supported on web' };
  }
  
  async initDatabase(dbName: string): Promise<InitDatabaseResult> {
    console.warn('ExpoSpatialiteRoomModule: initDatabase() is not supported on web');
    return { success: false, path: '', spatialiteVersion: 'web' };
  }
  
  async executeQuery(query: string, params?: any[]): Promise<QueryResult> {
    console.warn('ExpoSpatialiteRoomModule: executeQuery() is not supported on web');
    return { success: false, rowCount: 0, data: [] };
  }
  
  async executeStatement(statement: string, params?: any[]): Promise<StatementResult> {
    console.warn('ExpoSpatialiteRoomModule: executeStatement() is not supported on web');
    return { success: false, rowsAffected: 0 };
  }
  
  async createSpatialTable(tableName: string, geometryColumn: string, geometryType: string, srid: number): Promise<CreateTableResult> {
    console.warn('ExpoSpatialiteRoomModule: createSpatialTable() is not supported on web');
    return { success: false, message: 'Not supported on web' };
  }
  
  async insertSpatialPoint(tableName: string, geometryColumn: string, name: string, description: string, latitude: number, longitude: number): Promise<InsertPointResult> {
    console.warn('ExpoSpatialiteRoomModule: insertSpatialPoint() is not supported on web');
    return { success: false, message: 'Not supported on web' };
  }
  
  async findPointsWithinRadius(tableName: string, geometryColumn: string, latitude: number, longitude: number, radiusMeters: number): Promise<FindPointsResult> {
    console.warn('ExpoSpatialiteRoomModule: findPointsWithinRadius() is not supported on web');
    return { success: false, points: [] };
  }
  
  async closeDatabase(): Promise<CloseDatabaseResult> {
    console.warn('ExpoSpatialiteRoomModule: closeDatabase() is not supported on web');
    return { success: false, message: 'Not supported on web' };
  }
};

export default registerWebModule(ExpoSpatialiteRoomModule, 'ExpoSpatialiteRoom');
