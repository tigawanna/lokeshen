// Reexport the native module. On web, it will be resolved to ExpoSpatialiteRoomModule.web.ts
// and on native platforms to ExpoSpatialiteRoomModule.ts
export { default } from './src/ExpoSpatialiteRoomModule';
export { default as ExpoSpatialiteRoomView } from './src/ExpoSpatialiteRoomView';
export * from  './src/ExpoSpatialiteRoom.types';
