/**
 * Example usage of the ExpoSpatialiteModule
 * 
 * This file demonstrates how to use the Expo-compatible Spatialite module
 * in a React Native application.
 */

import React, { useState, useEffect } from 'react';
import { View, Text, Button, StyleSheet, ScrollView } from 'react-native';
import ExpoSpatialiteModule, { 
  DatabaseParams, 
  ConnectionResult, 
  QueryResult 
} from 'expo-spatialite-module';

const SpatialiteExample = () => {
  const [connectionStatus, setConnectionStatus] = useState<string>('');
  const [queryResult, setQueryResult] = useState<string>('');
  const [error, setError] = useState<string>('');

  const connectToDatabase = async () => {
    try {
      setConnectionStatus('Connecting...');
      setError('');
      
      const params: DatabaseParams = {
        dbName: 'example.db',
        localPath: 'databases',
        readonly: false,
        spatial: true
      };
      
      const result: ConnectionResult = await ExpoSpatialiteModule.connect(params);
      setConnectionStatus(`Connected: ${JSON.stringify(result)}`);
    } catch (err) {
      setError(`Connection error: ${err.message}`);
      setConnectionStatus('Not connected');
    }
  };

  const executeQuery = async () => {
    try {
      setQueryResult('Executing query...');
      setError('');
      
      const result: QueryResult = await ExpoSpatialiteModule.executeQuery(
        'SELECT name FROM sqlite_master WHERE type="table"'
      );
      setQueryResult(`Query result: ${JSON.stringify(result, null, 2)}`);
    } catch (err) {
      setError(`Query error: ${err.message}`);
      setQueryResult('');
    }
  };

  const closeDatabase = async () => {
    try {
      setConnectionStatus('Closing...');
      setError('');
      
      const result: ConnectionResult = await ExpoSpatialiteModule.close();
      setConnectionStatus(`Closed: ${JSON.stringify(result)}`);
    } catch (err) {
      setError(`Close error: ${err.message}`);
      setConnectionStatus('Unknown');
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Expo Spatialite Module Example</Text>
      
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Connection</Text>
        <Text style={styles.status}>{connectionStatus}</Text>
        <Button title="Connect" onPress={connectToDatabase} />
        <Button title="Close" onPress={closeDatabase} />
      </View>
      
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Query</Text>
        <Text style={styles.result}>{queryResult}</Text>
        <Button title="Execute Query" onPress={executeQuery} />
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