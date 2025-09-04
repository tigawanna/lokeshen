import { NativeModule, requireNativeModule } from 'expo';

import { 
  ExpoSpatialiteModuleEvents, 
  DatabaseParams, 
  ConnectionResult, 
  QueryResult 
} from './ExpoSpatialiteModule.types';

declare class ExpoSpatialiteModule extends NativeModule<ExpoSpatialiteModuleEvents> {
  connect(params: DatabaseParams): Promise<ConnectionResult>;
  close(): Promise<ConnectionResult>;
  executeQuery(query: string): Promise<QueryResult>;
}

// This call loads the native module object from the JSI.
export default requireNativeModule<ExpoSpatialiteModule>('ExpoSpatialiteModule');
