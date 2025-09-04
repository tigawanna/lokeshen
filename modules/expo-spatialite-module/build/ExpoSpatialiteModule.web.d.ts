import { NativeModule } from 'expo';
import { ChangeEventPayload, DatabaseParams, ConnectionResult, QueryResult } from './ExpoSpatialiteModule.types';
type ExpoSpatialiteModuleEvents = {
    onChange: (params: ChangeEventPayload) => void;
};
declare class ExpoSpatialiteModule extends NativeModule<ExpoSpatialiteModuleEvents> {
    connect(params: DatabaseParams): Promise<ConnectionResult>;
    close(): Promise<ConnectionResult>;
    executeQuery(query: string): Promise<QueryResult>;
}
declare const _default: typeof ExpoSpatialiteModule;
export default _default;
