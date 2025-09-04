// Reexport the native module. On web, it will be resolved to ExpoSpatialiteModule.web.ts
// and on native platforms to ExpoSpatialiteModule.ts
export { default } from './ExpoSpatialiteModule';
export * from './ExpoSpatialiteModule.types';
