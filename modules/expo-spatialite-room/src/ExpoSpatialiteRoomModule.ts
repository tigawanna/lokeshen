import { NativeModule, requireNativeModule } from 'expo';

import { ExpoSpatialiteRoomModuleEvents } from './ExpoSpatialiteRoom.types';

declare class ExpoSpatialiteRoomModule extends NativeModule<ExpoSpatialiteRoomModuleEvents> {
  PI: number;
  hello(): string;
  setValueAsync(value: string): Promise<void>;
}

// This call loads the native module object from the JSI.
export default requireNativeModule<ExpoSpatialiteRoomModule>('ExpoSpatialiteRoom');
