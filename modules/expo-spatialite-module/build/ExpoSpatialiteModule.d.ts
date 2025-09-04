import { NativeModule } from 'expo';
import { ExpoSpatialiteModuleEvents, DatabaseParams, ConnectionResult, QueryResult } from './ExpoSpatialiteModule.types';
declare class ExpoSpatialiteModule extends NativeModule<ExpoSpatialiteModuleEvents> {
    connect(params: DatabaseParams): Promise<ConnectionResult>;
    close(): Promise<ConnectionResult>;
    executeQuery(query: string): Promise<QueryResult>;
}
declare const _default: ExpoSpatialiteModule;
export default _default;
