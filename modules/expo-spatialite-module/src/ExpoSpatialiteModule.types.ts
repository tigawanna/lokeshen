import type { StyleProp, ViewStyle } from 'react-native';

// Events payload types
export type ChangeEventPayload = {
  value: string;
};

export type OnLoadEventPayload = {
  url: string;
};

// Module events
export type ExpoSpatialiteModuleEvents = {
  onChange: (params: ChangeEventPayload) => void;
};

// Database parameter types
export type DatabaseParams = {
  dbName: string;
  localPath?: string;
  readonly?: boolean;
  spatial?: boolean;
};

export type ConnectionResult = {
  isConnected: boolean;
  isSpatial?: boolean;
};

export type QueryResult = {
  rows: number;
  cols: number;
  data: any[];
};

// View props
export type ExpoSpatialiteModuleViewProps = {
  url: string;
  onLoad: (event: { nativeEvent: OnLoadEventPayload }) => void;
  style?: StyleProp<ViewStyle>;
};
