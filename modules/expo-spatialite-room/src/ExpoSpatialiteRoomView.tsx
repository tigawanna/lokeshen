import { requireNativeView } from 'expo';
import * as React from 'react';

import { ExpoSpatialiteRoomViewProps } from './ExpoSpatialiteRoom.types';

const NativeView: React.ComponentType<ExpoSpatialiteRoomViewProps> =
  requireNativeView('ExpoSpatialiteRoom');

export default function ExpoSpatialiteRoomView(props: ExpoSpatialiteRoomViewProps) {
  return <NativeView {...props} />;
}
