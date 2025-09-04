# Expo Spatialite Module

An Expo-compatible native module for working with SQLite and Spatialite databases.

## Installation

This module is intended to be used as part of the lokeshen project. It is not published as a standalone package.

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