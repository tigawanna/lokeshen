import { registerWebModule, NativeModule } from 'expo';
class ExpoSpatialiteModule extends NativeModule {
    async connect(params) {
        console.warn('ExpoSpatialiteModule: connect() is not supported on web');
        return { isConnected: false };
    }
    async close() {
        console.warn('ExpoSpatialiteModule: close() is not supported on web');
        return { isConnected: false };
    }
    async executeQuery(query) {
        console.warn('ExpoSpatialiteModule: executeQuery() is not supported on web');
        return { rows: 0, cols: 0, data: [] };
    }
}
;
export default registerWebModule(ExpoSpatialiteModule, 'ExpoSpatialiteModule');
