/**
 * Example usage of the ExpoSpatialiteRoom module
 * 
 * This file demonstrates how to use the Expo-compatible Spatialite module
 * in a React Native application for geospatial operations.
 */

import React, { useState, useEffect } from 'react';
import { View, Text, Button, StyleSheet, ScrollView, Alert } from 'react-native';
import ExpoSpatialiteRoom, { 
  InitDatabaseResult, 
  FindPointsResult, 
  QueryResult 
} from 'expo-spatialite-room';

const SpatialiteExample = () => {
  const [databaseStatus, setDatabaseStatus] = useState<string>('');
  const [queryResult, setQueryResult] = useState<string>('');
  const [nearbyPoints, setNearbyPoints] = useState<string>('');
  const [error, setError] = useState<string>('');

  const initializeDatabase = async () => {
    try {
      setDatabaseStatus('Initializing database...');
      setError('');
      
      const result: InitDatabaseResult = await ExpoSpatialiteRoom.initDatabase('kenya_locations.db');
      setDatabaseStatus(`Database initialized: ${JSON.stringify(result)}`);
    } catch (err) {
      setError(`Database initialization error: ${err.message}`);
      setDatabaseStatus('Not initialized');
    }
  };

  const createLocationsTable = async () => {
    try {
      setDatabaseStatus('Creating locations table...');
      setError('');
      
      await ExpoSpatialiteRoom.createSpatialTable('locations', 'geometry', 'POINT', 4326);
      setDatabaseStatus('Locations table created successfully');
    } catch (err) {
      setError(`Table creation error: ${err.message}`);
    }
  };

  const insertSampleLocations = async () => {
    try {
      setDatabaseStatus('Inserting sample locations...');
      setError('');
      
      // Insert some sample locations in Kenya
      await ExpoSpatialiteRoom.insertSpatialPoint(
        'locations', 
        'geometry', 
        'Nairobi Museum', 
        'National museum of Kenya', 
        -1.2892, 
        36.8267
      );
      
      await ExpoSpatialiteRoom.insertSpatialPoint(
        'locations', 
        'geometry', 
        'Kenya National Theatre', 
        'Cultural center in Nairobi', 
        -1.2971, 
        36.8147
      );
      
      await ExpoSpatialiteRoom.insertSpatialPoint(
        'locations', 
        'geometry', 
        'Maasai Mara', 
        'Famous wildlife reserve', 
        -1.5767, 
        35.1790
      );
      
      setDatabaseStatus('Sample locations inserted successfully');
    } catch (err) {
      setError(`Location insertion error: ${err.message}`);
    }
  };

  const findNearbyLocations = async () => {
    try {
      setNearbyPoints('Searching for nearby locations...');
      setError('');
      
      // Find locations within 10km of Nairobi center
      const result: FindPointsResult = await ExpoSpatialiteRoom.findPointsWithinRadius(
        'locations', 
        'geometry', 
        -1.2921, // Nairobi center latitude
        36.8219, // Nairobi center longitude
        10000 // 10km radius
      );
      
      setNearbyPoints(`Found ${result.points.length} locations:\n${JSON.stringify(result.points, null, 2)}`);
    } catch (err) {
      setError(`Search error: ${err.message}`);
      setNearbyPoints('');
    }
  };

  const executeCustomQuery = async () => {
    try {
      setQueryResult('Executing custom query...');
      setError('');
      
      const result: QueryResult = await ExpoSpatialiteRoom.executeQuery(
        'SELECT name, description FROM locations WHERE name LIKE ?', 
        ['%Museum%']
      );
      
      setQueryResult(`Query result: ${JSON.stringify(result, null, 2)}`);
    } catch (err) {
      setError(`Query error: ${err.message}`);
      setQueryResult('');
    }
  };

  const closeDatabase = async () => {
    try {
      setDatabaseStatus('Closing database...');
      setError('');
      
      await ExpoSpatialiteRoom.closeDatabase();
      setDatabaseStatus('Database closed successfully');
    } catch (err) {
      setError(`Close error: ${err.message}`);
      setDatabaseStatus('Unknown');
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Expo Spatialite Room Example</Text>
      
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Database Operations</Text>
        <Text style={styles.status}>{databaseStatus}</Text>
        <Button title="Initialize Database" onPress={initializeDatabase} />
        <Button title="Create Locations Table" onPress={createLocationsTable} />
        <Button title="Insert Sample Locations" onPress={insertSampleLocations} />
        <Button title="Close Database" onPress={closeDatabase} />
      </View>
      
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Spatial Queries</Text>
        <Text style={styles.result}>{nearbyPoints}</Text>
        <Button title="Find Nearby Locations" onPress={findNearbyLocations} />
      </View>
      
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Custom Queries</Text>
        <Text style={styles.result}>{queryResult}</Text>
        <Button title="Execute Custom Query" onPress={executeCustomQuery} />
      </View>
      
      {error ? (
        <View style={styles.section}>
          <Text style={styles.error}>Error: {error}</Text>
        </View>
      ) : null}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginVertical: 20,
  },
  section: {
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 8,
    marginBottom: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  status: {
    fontSize: 16,
    marginBottom: 15,
    color: '#333',
  },
  result: {
    fontSize: 14,
    marginBottom: 15,
    color: '#333',
    fontFamily: 'monospace',
  },
  error: {
    fontSize: 16,
    color: 'red',
    textAlign: 'center',
  },
});

export default SpatialiteExample;