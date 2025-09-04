// Reexport the native module. On web, it will be resolved to ExpoSpatialiteModule.web.ts
// and on native platforms to ExpoSpatialiteModule.ts
export { default } from './src/ExpoSpatialiteModule';
export { default as ExpoSpatialiteModuleView } from './src/ExpoSpatialiteModuleView';
export * from  './src/ExpoSpatialiteModule.types';
