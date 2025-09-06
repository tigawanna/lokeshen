import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useDatabaseInitialization } from '../../hooks/useDatabaseInitialization';
import SpatialiteTestScreen from './SpatialiteTestScreen';
import DatabaseInitializationScreen from './DatabaseInitializationScreen';
import DataLoadingScreen from './DataLoadingScreen';

const SpatialiteExample = () => {
  const { 
    isDatabaseInitialized, 
    isLoading, 
    error, 
    markDatabaseAsInitialized,
    resetDatabaseInitialization 
  } = useDatabaseInitialization();
  
  const [showTestData, setShowTestData] = useState(false);

  const handleInitializationComplete = () => {
    markDatabaseAsInitialized();
  };

  const handleInitializationError = (error: Error) => {
    console.error('Database initialization error:', error);
    // Handle error appropriately
  };

  const handleLoadingComplete = () => {
    markDatabaseAsInitialized();
  };

  const handleLoadingError = (error: Error) => {
    console.error('Data loading error:', error);
    // Handle error appropriately
  };

  if (showTestData) {
    return (
      <View style={styles.container}>
        <SpatialiteTestScreen />
      </View>
    );
  }

  if (isLoading) {
    return (
      <View style={styles.container}>
        <DatabaseInitializationScreen 
          onInitializationComplete={handleInitializationComplete}
          onError={handleInitializationError}
        />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <DatabaseInitializationScreen 
          onInitializationComplete={handleInitializationComplete}
          onError={handleInitializationError}
        />
      </View>
    );
  }

  if (!isDatabaseInitialized) {
    // For demo purposes, we'll show the data loading screen
    // In a real app, you would first try to copy from assets
    return (
      <View style={styles.container}>
        <DataLoadingScreen 
          onLoadingComplete={handleLoadingComplete}
          onError={handleLoadingError}
        />
      </View>
    );
  }

  // Database is initialized, show the main app or test screen
  return (
    <View style={styles.container}>
      <SpatialiteTestScreen />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
});

export default SpatialiteExample;
