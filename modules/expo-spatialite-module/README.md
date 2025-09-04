# Expo Spatialite Module

An Expo-compatible native module for working with SQLite and Spatialite databases.

## Installation

This module is intended to be used as part of the lokeshen project. It is not published as a standalone package.

## Configuration

This module requires a config plugin to handle dependencies. Add the following to your app.json or app.config.js:

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
- Adding the JitPack repository to resolve the Spatialite dependency
- Adding the Spatialite dependency to the project
- Handling AndroidX migration issues with the older Spatialite library
- Resolving manifest merger conflicts between Android Support Library and AndroidX

## Usage

```typescript
import ExpoSpatialiteModule, { 
  DatabaseParams, 
  ConnectionResult, 
  QueryResult 
} from 'expo-spatialite-module';

// Connect to the database
const params: DatabaseParams = {
  dbName: 'example.db',
  localPath: 'databases',
  readonly: false,
  spatial: true
};

const connectionResult: ConnectionResult = await ExpoSpatialiteModule.connect(params);

// Execute a query
const queryResult: QueryResult = await ExpoSpatialiteModule.executeQuery('SELECT * FROM sqlite_master');

// Close the database
const closeResult: ConnectionResult = await ExpoSpatialiteModule.close();
```

## API

### `connect(params: DatabaseParams): Promise<ConnectionResult>`

Connects to a SQLite database with optional Spatialite support.

### `executeQuery(query: string): Promise<QueryResult>`

Executes a SQL query on the connected database.

### `close(): Promise<ConnectionResult>`

Closes the database connection.

## Types

### DatabaseParams
- `dbName`: string - The name of the database file
- `localPath?`: string - Optional path to store the database file
- `readonly?`: boolean - Whether to open the database in read-only mode
- `spatial?`: boolean - Whether to enable Spatialite support

### ConnectionResult
- `isConnected`: boolean - Whether the connection was successful
- `isSpatial?`: boolean - Whether Spatialite support is enabled

### QueryResult
- `rows`: number - Number of rows in the result
- `cols`: number - Number of columns in the result
- `data`: any[] - Array of row data

## Current Status

The Expo-compatible native module has been successfully implemented and the config plugin correctly handles all dependency resolution and AndroidX compatibility issues. The build process now successfully resolves dependencies and handles manifest merger conflicts.

However, there is a separate compilation issue with the existing `react-native-fnc-spatialite` module that is unrelated to our new implementation. This issue is due to API changes in newer versions of React Native that affect the Promise reject method usage in the Kotlin code.