import * as React from 'react';

import { ExpoSpatialiteViewProps } from './ExpoSpatialite.types';

export default function ExpoSpatialiteView(props: ExpoSpatialiteViewProps) {
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
