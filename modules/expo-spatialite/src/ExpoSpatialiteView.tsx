import { requireNativeView } from 'expo';
import * as React from 'react';

import { ExpoSpatialiteViewProps } from './ExpoSpatialite.types';

const NativeView: React.ComponentType<ExpoSpatialiteViewProps> =
  requireNativeView('ExpoSpatialite');

export default function ExpoSpatialiteView(props: ExpoSpatialiteViewProps) {
  return <NativeView {...props} />;
}
