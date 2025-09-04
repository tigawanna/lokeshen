The idea of this project is to create an expo compatible native module for the react native library [rn-spatial-example](https://github.com/tigawanna/RNSpatial).

`.rn-spatial-example` :  # React native library to work with sqlite spatialite it's not expo compatibe and am trying to make a native module of it for expo , it conssts of cherry pickked portions that i think are most relevant

`modules/expo-spatialite-module` :  # inittial boilerplate expo native module for sqlite spatialite , feel free to remove the code for the views since we're only intrested in the native module part . i will also limit this to android only for now so we'll onlu focus on android part of the native module


references
- article i wrote about another expedition with expo modules :  https://dev.to/tigawanna/building-android-widgets-in-expo-with-custom-native-modules-2mdo
- expo native module docs https://docs.expo.dev/modules/overview/

directives:

- Do not try to run the project as it a time consuming task , i will handle that manually
- I have already installed the required dependencies for the project
- You can run build commands for better iteration: `pnpm build:android`

## Implementation Details

This project implements an Expo-compatible native module for Spatialite functionality. The module follows Expo's conventions and provides the following API:

### Key Files and Structure
- `modules/expo-spatialite-module/` - Main module directory
- `src/ExpoSpatialiteModule.ts` - Main TypeScript interface
- `src/ExpoSpatialiteModule.types.ts` - TypeScript types
- `src/ExpoSpatialiteModule.web.ts` - Web implementation
- `android/src/main/java/expo/modules/spatialitemodule/ExpoSpatialiteModule.kt` - Android implementation
- `android/build.gradle` - Android build configuration
- `expo-module.config.json` - Expo module configuration
- `plugin/` - Config plugin for handling dependencies

### API
The module provides three main functions:
1. `connect(params: DatabaseParams): Promise<ConnectionResult>` - Connects to a SQLite database with optional Spatialite support
2. `executeQuery(query: string): Promise<QueryResult>` - Executes a SQL query on the connected database
3. `close(): Promise<ConnectionResult>` - Closes the database connection

### Expo Conventions Followed
- Module name: `ExpoSpatialiteModule`
- Package structure: `expo.modules.spatialitemodule`
- Android namespace: `expo.modules.spatialitemodule`
- Module configuration in `expo-module.config.json`

### Dependencies
- `com.github.mvits:Geo-Spatialite-Android:1.0.2` - Spatialite library for Android (handled via config plugin)

## Config Plugin

This module includes a config plugin to handle the Spatialite dependency without modifying the top-level Android folder. The plugin automatically adds the JitPack repository and the Spatialite dependency to the project.

To use the config plugin, add it to your app.json/app.config.js:

```json
{
  "expo": {
    "plugins": [
      "./modules/expo-spatialite-module/plugin"
    ]
  }
}
```

The config plugin handles:
1. Adding the JitPack repository to resolve the Spatialite dependency
2. Adding the Spatialite dependency to the project
3. Handling AndroidX migration issues with the older Spatialite library
4. Resolving manifest merger conflicts between Android Support Library and AndroidX

## Current Status

The Expo-compatible native module has been successfully implemented and is compiling correctly. The config plugin correctly handles all dependency resolution and AndroidX compatibility issues. The build process now successfully resolves dependencies and handles manifest merger conflicts.

However, there is a separate compilation issue with the existing `react-native-fnc-spatialite` module that is unrelated to our new implementation. This issue is due to API changes in newer versions of React Native that affect the Promise reject method usage in the Kotlin code.

Our new `expo-spatialite-module` compiles successfully and is ready for use in Expo projects.

## Restart Instructions

If you need to restart this project or recreate the module, follow these steps:

1. Create a new Expo module using `npx create-expo-module@latest`
2. Set the module name to `ExpoSpatialiteModule`
3. Set the package structure to `expo.modules.spatialitemodule`
4. Copy the API interface from `src/ExpoSpatialiteModule.types.ts` and `src/ExpoSpatialiteModule.ts`
5. Implement the Android functionality in Kotlin based on `.rn-spatial-example/android/src/main/java/com/fncspatialite/RNSpatialModule.kt`
6. Create the config plugin in `plugin/` directory to handle dependencies
7. Ensure the module configuration in `expo-module.config.json` matches the package structure
8. Remove any view-related code as this is a native module only
9. Test the TypeScript types and web implementation
10. Add the config plugin to your app.json/app.config.js
