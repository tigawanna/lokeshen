import { NativeModule, requireNativeModule } from 'expo';

import { ExpoSpatialiteModuleEvents } from './ExpoSpatialiteModule.types';

declare class ExpoSpatialiteModule extends NativeModule<ExpoSpatialiteModuleEvents> {
  PI: number;
  hello(): string;
  setValueAsync(value: string): Promise<void>;
}

// This call loads the native module object from the JSI.
export default requireNativeModule<ExpoSpatialiteModule>('ExpoSpatialiteModule');
