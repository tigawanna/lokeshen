import React, { useState } from 'react';
import { View, Text, StyleSheet, Button } from 'react-native';
import ExpoSpatialiteRoom from '@/modules/expo-spatialite-room';

interface TestResult {
  success: boolean;
  initResult?: any;
  createResult?: any;
  insertResult?: any;
  queryResult?: any;
  error?: string;
}

const SpatialiteTestScreen = () => {
  const [testResult, setTestResult] = useState<TestResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const runTest = async () => {
    setIsLoading(true);
    setTestResult(null);
    
    try {
      // Initialize the database
      const initResult = await ExpoSpatialiteRoom.initDatabase('test.db');
      console.log('Init result:', initResult);
      
      if (!initResult.success) {
        throw new Error('Failed to initialize database');
      }
      
      // Create a simple table
      const createTableSql = `
        CREATE TABLE IF NOT EXISTS test_table (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL
        );
      `;
      
      const createResult = await ExpoSpatialiteRoom.executeStatement(createTableSql);
      console.log('Create table result:', createResult);
      
      if (!createResult.success) {
        throw new Error('Failed to create table');
      }
      
      // Insert some test data
      const insertSql = `
        INSERT INTO test_table (name) VALUES (?);
      `;
      
      const insertResult = await ExpoSpatialiteRoom.executeStatement(insertSql, ['Test Entry']);
      console.log('Insert result:', insertResult);
      
      if (!insertResult.success) {
        throw new Error('Failed to insert data');
      }
      
      // Query the data
      const querySql = `
        SELECT * FROM test_table;
      `;
      
      const queryResult = await ExpoSpatialiteRoom.executeQuery(querySql);
      console.log('Query result:', queryResult);
      
      if (!queryResult.success) {
        throw new Error('Failed to query data');
      }
      
      setTestResult({
        success: true,
        initResult,
        createResult,
        insertResult,
        queryResult
      });
    } catch (error: any) {
      console.error('Test error:', error);
      setTestResult({
        success: false,
        error: error.message
      });
    } finally {
      setIsLoading(false);
    }
  };

  const renderResult = () => {
    if (!testResult) return null;
    
    if (testResult.success) {
      return (
        <View style={styles.resultContainer}>
          <Text style={styles.successText}>Test Successful!</Text>
          <Text>Rows retrieved: {testResult.queryResult?.rowCount}</Text>
          <Text>Data: {JSON.stringify(testResult.queryResult?.data)}</Text>
        </View>
      );
    } else {
      return (
        <View style={styles.resultContainer}>
          <Text style={styles.errorText}>Test Failed!</Text>
          <Text>Error: {testResult.error}</Text>
        </View>
      );
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Spatialite Test</Text>
      <Button 
        title={isLoading ? "Running Test..." : "Run Spatialite Test"} 
        onPress={runTest} 
        disabled={isLoading}
      />
      {renderResult()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 30,
    textAlign: 'center',
  },
  resultContainer: {
    marginTop: 20,
    padding: 15,
    backgroundColor: 'white',
    borderRadius: 5,
    width: '100%',
  },
  successText: {
    fontSize: 18,
    color: 'green',
    fontWeight: 'bold',
    marginBottom: 10,
  },
  errorText: {
    fontSize: 18,
    color: 'red',
    fontWeight: 'bold',
    marginBottom: 10,
  },
});

export default SpatialiteTestScreen;
