# Spatialite Integration for Lokeshen

This document explains how to use the Spatialite integration in the Lokeshen app for geospatial queries.

## Overview

The Lokeshen app uses Spatialite to perform geospatial queries on Kenya wards data. The integration is implemented through a custom Expo module called `expo-spatialite-room`.

## Components

### 1. Database Initialization
- `DatabaseInitializationScreen` - Handles copying the preloaded database from assets
- `useDatabaseInitialization` hook - Manages database initialization state

### 2. Data Loading (Fallback)
- `DataLoadingScreen` - Loads data at runtime if preloaded database is not available

### 3. Spatialite Manager
- `spatialiteManager` - Singleton class for database operations

## Usage

### Initializing the Database

```typescript
import { useDatabaseInitialization } from '../hooks/useDatabaseInitialization';

const MyComponent = () => {
  const { isDatabaseInitialized, isLoading, error } = useDatabaseInitialization();
  
  if (isLoading) {
    return <LoadingScreen />;
  }
  
  if (error) {
    return <ErrorScreen error={error} />;
  }
  
  if (!isDatabaseInitialized) {
    return <DatabaseInitializationScreen />;
  }
  
  return <MainApp />;
};
```

### Performing Geospatial Queries

```typescript
import { spatialiteManager } from '../lib/spatialiteManager';

// Find wards within a radius
const wards = await spatialiteManager.findWardsWithinRadius(
  latitude, 
  longitude, 
  radiusInMeters
);

// Find wards in a bounding box
const wards = await spatialiteManager.findWardsInBoundingBox(
  minLatitude,
  minLongitude,
  maxLatitude,
  maxLongitude
);

// Get all wards in a county
const wards = await spatialiteManager.getWardsByCounty('Nairobi');

// Get all counties
const counties = await spatialiteManager.getAllCounties();
```

## Database Schema

The `kenya_wards` table contains the following columns:

- `id` - Primary key
- `ward_code` - Ward code
- `ward` - Ward name
- `county` - County name
- `county_code` - County code
- `sub_county` - Sub-county name
- `constituency` - Constituency name
- `constituency_code` - Constituency code
- `geometry` - MultiPolygon geometry (spatial column)

## Error Handling

All Spatialite operations can throw errors. Always wrap calls in try-catch blocks:

```typescript
try {
  const wards = await spatialiteManager.findWardsWithinRadius(
    latitude, 
    longitude, 
    radiusInMeters
  );
} catch (error) {
  console.error('Error finding wards:', error);
  // Handle error appropriately
}
```

## Testing

Use the `SpatialiteTestScreen` component to verify that the Spatialite integration is working correctly.

## Build Process

To generate the preloaded database:

1. Run `pnpm run generate-preloaded-db`
2. The database will be created in the `assets` folder
3. The database will be bundled with the app

## Fallback Process

If the preloaded database is not available, the app will fall back to runtime loading using the `DataLoadingScreen` component.