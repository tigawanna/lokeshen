import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import * as FileSystem from 'expo-file-system';
import Constants from 'expo-constants';

interface InitializationState {
  status: 'checking' | 'copying' | 'completed' | 'error';
  message: string;
  error: string | null;
}

interface DatabaseInitializationScreenProps {
  onInitializationComplete: () => void;
  onError: (error: Error) => void;
}

const DatabaseInitializationScreen = ({ onInitializationComplete, onError }: DatabaseInitializationScreenProps) => {
  const [initializationState, setInitializationState] = useState<InitializationState>({
    status: 'checking',
    message: 'Checking database status...',
    error: null,
  });

  useEffect(() => {
    initializeDatabase();
  }, []);

  const updateInitializationState = (status: InitializationState['status'], message: string, error: string | null = null) => {
    setInitializationState({
      status,
      message,
      error,
    });
  };

  const initializeDatabase = async () => {
    try {
      updateInitializationState('checking', 'Checking if database exists...', null);

      // Check if database already exists in documents directory
      const dbPath = `${FileSystem.documentDirectory}kenya_wards.db`;
      const { exists: dbExists } = await FileSystem.getInfoAsync(dbPath);

      if (dbExists) {
        updateInitializationState('completed', 'Database already exists, ready to use!', null);
        setTimeout(() => {
          onInitializationComplete();
        }, 1000);
        return;
      }

      // Database doesn't exist, check if we have it in assets
      updateInitializationState('copying', 'Copying preloaded database from assets...', null);

      // Get the path to the asset
      // Note: This assumes the database is in the assets folder and has been bundled with the app
      const assetPath = `${Constants.assetUrlOverride || 'asset://'}assets/kenya_wards.db`;
      
      try {
        // Try to copy from assets
        await FileSystem.copyAsync({
          from: assetPath,
          to: dbPath,
        });
        
        updateInitializationState('completed', 'Database copied successfully, ready to use!', null);
        setTimeout(() => {
          onInitializationComplete();
        }, 1000);
      } catch (copyError: any) {
        // If copying from assets fails, we might need to generate the database
        console.log('Failed to copy from assets, database may need to be generated at runtime');
        updateInitializationState('error', 'Database not found in assets', copyError.message);
        onError(copyError);
      }
    } catch (error: any) {
      console.error('Error initializing database:', error);
      updateInitializationState('error', 'Error checking database status', error.message);
      onError(error);
    }
  };

  const renderContent = () => {
    switch (initializationState.status) {
      case 'checking':
      case 'copying':
        return (
          <View style={styles.content}>
            <ActivityIndicator size="large" color="#0000ff" />
            <Text style={styles.message}>{initializationState.message}</Text>
          </View>
        );
      case 'completed':
        return (
          <View style={styles.content}>
            <Text style={styles.successMessage}>{initializationState.message}</Text>
          </View>
        );
      case 'error':
        return (
          <View style={styles.content}>
            <Text style={styles.errorMessage}>Error: {initializationState.error}</Text>
            <Text style={styles.message}>{initializationState.message}</Text>
          </View>
        );
      default:
        return null;
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Initializing Database</Text>
      {renderContent()}
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
  content: {
    width: '100%',
    alignItems: 'center',
  },
  message: {
    fontSize: 16,
    textAlign: 'center',
    marginVertical: 10,
  },
  successMessage: {
    fontSize: 18,
    color: 'green',
    fontWeight: 'bold',
    textAlign: 'center',
  },
  errorMessage: {
    fontSize: 18,
    color: 'red',
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 10,
  },
});

export default DatabaseInitializationScreen;