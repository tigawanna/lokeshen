import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system';

/**
 * Hook to manage database initialization state
 */
export const useDatabaseInitialization = () => {
  const [isDatabaseInitialized, setIsDatabaseInitialized] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    checkDatabaseInitialization();
  }, []);

  const checkDatabaseInitialization = async () => {
    try {
      // Check if we've already initialized the database
      const initialized = await AsyncStorage.getItem('database_initialized');
      
      if (initialized === 'true') {
        setIsDatabaseInitialized(true);
        setIsLoading(false);
        return;
      }

      // Check if database file exists
      const dbPath = `${FileSystem.documentDirectory}kenya_wards.db`;
      const { exists } = await FileSystem.getInfoAsync(dbPath);
      
      if (exists) {
        // Database file exists, mark as initialized
        await AsyncStorage.setItem('database_initialized', 'true');
        setIsDatabaseInitialized(true);
        setIsLoading(false);
        return;
      }

      // Database not initialized and file doesn't exist
      setIsDatabaseInitialized(false);
      setIsLoading(false);
    } catch (err: any) {
      console.error('Error checking database initialization:', err);
      setError(err);
      setIsLoading(false);
    }
  };

  const markDatabaseAsInitialized = async () => {
    try {
      await AsyncStorage.setItem('database_initialized', 'true');
      setIsDatabaseInitialized(true);
    } catch (err: any) {
      console.error('Error marking database as initialized:', err);
      setError(err);
    }
  };

  const resetDatabaseInitialization = async () => {
    try {
      await AsyncStorage.removeItem('database_initialized');
      setIsDatabaseInitialized(false);
      
      // Optionally remove the database file
      const dbPath = `${FileSystem.documentDirectory}kenya_wards.db`;
      const { exists } = await FileSystem.getInfoAsync(dbPath);
      
      if (exists) {
        await FileSystem.deleteAsync(dbPath);
      }
    } catch (err: any) {
      console.error('Error resetting database initialization:', err);
      setError(err);
    }
  };

  return {
    isDatabaseInitialized,
    isLoading,
    error,
    markDatabaseAsInitialized,
    resetDatabaseInitialization,
  };
};