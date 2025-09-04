import * as React from 'react';

import { ExpoSpatialiteModuleViewProps } from './ExpoSpatialiteModule.types';

export default function ExpoSpatialiteModuleView(props: ExpoSpatialiteModuleViewProps) {
  return (
    <div>
      <iframe
        style={{ flex: 1 }}
        src={props.url}
        onLoad={() => props.onLoad({ nativeEvent: { url: props.url } })}
      />
    </div>
  );
}
