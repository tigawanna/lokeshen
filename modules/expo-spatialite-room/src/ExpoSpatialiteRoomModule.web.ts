import { registerWebModule, NativeModule } from 'expo';

import { ChangeEventPayload } from './ExpoSpatialiteRoom.types';

type ExpoSpatialiteRoomModuleEvents = {
  onChange: (params: ChangeEventPayload) => void;
}

class ExpoSpatialiteRoomModule extends NativeModule<ExpoSpatialiteRoomModuleEvents> {
  PI = Math.PI;
  async setValueAsync(value: string): Promise<void> {
    this.emit('onChange', { value });
  }
  hello() {
    return 'Hello world! 👋';
  }
};

export default registerWebModule(ExpoSpatialiteRoomModule, 'ExpoSpatialiteRoomModule');
