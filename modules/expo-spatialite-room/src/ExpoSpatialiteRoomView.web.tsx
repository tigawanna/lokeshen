import * as React from 'react';

import { ExpoSpatialiteRoomViewProps } from './ExpoSpatialiteRoom.types';

export default function ExpoSpatialiteRoomView(props: ExpoSpatialiteRoomViewProps) {
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
