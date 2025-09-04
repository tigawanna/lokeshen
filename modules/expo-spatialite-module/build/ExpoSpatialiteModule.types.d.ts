import type { StyleProp, ViewStyle } from 'react-native';
export type ChangeEventPayload = {
    value: string;
};
export type OnLoadEventPayload = {
    url: string;
};
export type ExpoSpatialiteModuleEvents = {
    onChange: (params: ChangeEventPayload) => void;
};
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
export type ExpoSpatialiteModuleViewProps = {
    url: string;
    onLoad: (event: {
        nativeEvent: OnLoadEventPayload;
    }) => void;
    style?: StyleProp<ViewStyle>;
};
