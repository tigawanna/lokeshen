import { registerWebModule, NativeModule } from 'expo';

import { ChangeEventPayload } from './ExpoSpatialiteModule.types';

type ExpoSpatialiteModuleEvents = {
  onChange: (params: ChangeEventPayload) => void;
}

class ExpoSpatialiteModule extends NativeModule<ExpoSpatialiteModuleEvents> {
  PI = Math.PI;
  async setValueAsync(value: string): Promise<void> {
    this.emit('onChange', { value });
  }
  hello() {
    return 'Hello world! 👋';
  }
};

export default registerWebModule(ExpoSpatialiteModule, 'ExpoSpatialiteModule');
