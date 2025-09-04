import { registerWebModule, NativeModule } from 'expo';

import { 
  ChangeEventPayload, 
  DatabaseParams, 
  ConnectionResult, 
  QueryResult 
} from './ExpoSpatialiteModule.types';

type ExpoSpatialiteModuleEvents = {
  onChange: (params: ChangeEventPayload) => void;
}

class ExpoSpatialiteModule extends NativeModule<ExpoSpatialiteModuleEvents> {
  async connect(params: DatabaseParams): Promise<ConnectionResult> {
    console.warn('ExpoSpatialiteModule: connect() is not supported on web');
    return { isConnected: false };
  }
  
  async close(): Promise<ConnectionResult> {
    console.warn('ExpoSpatialiteModule: close() is not supported on web');
    return { isConnected: false };
  }
  
  async executeQuery(query: string): Promise<QueryResult> {
    console.warn('ExpoSpatialiteModule: executeQuery() is not supported on web');
    return { rows: 0, cols: 0, data: [] };
  }
};

export default registerWebModule(ExpoSpatialiteModule, 'ExpoSpatialiteModule');
