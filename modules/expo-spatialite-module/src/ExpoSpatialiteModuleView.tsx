import { requireNativeView } from 'expo';
import * as React from 'react';

import { ExpoSpatialiteModuleViewProps } from './ExpoSpatialiteModule.types';

const NativeView: React.ComponentType<ExpoSpatialiteModuleViewProps> =
  requireNativeView('ExpoSpatialiteModule');

export default function ExpoSpatialiteModuleView(props: ExpoSpatialiteModuleViewProps) {
  return <NativeView {...props} />;
}
