import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Platform, ProgressBarAndroid, StyleSheet, Text, View } from 'react-native';
import ExpoSpatialiteRoom from '../../../modules/expo-spatialite-room';
import { SUB_COUNTY_MAPPINGS } from '../../data/sub_county';
import { WARDS_GEOJSON } from '../../data/wards_geojson';

interface LoadingState {
  status: 'initializing' | 'loading' | 'completed' | 'error';
  progress: number;
  message: string;
  error: string | null;
}

interface DataLoadingScreenProps {
  onLoadingComplete: () => void;
  onError: (error: Error) => void;
}

const DataLoadingScreen = ({ onLoadingComplete, onError }: DataLoadingScreenProps) => {
  const [loadingState, setLoadingState] = useState<LoadingState>({
    status: 'initializing',
    progress: 0,
    message: 'Initializing database...',
    error: null,
  });

  useEffect(() => {
    loadWardsData();
  }, []);

  const updateLoadingState = (status: LoadingState['status'], progress: number, message: string, error: string | null = null) => {
    setLoadingState({
      status,
      progress,
      message,
      error,
    });
  };

  /**
   * Get sub-county information for a ward
   * @param ward - Ward name
   * @returns Sub-county name or null
   */
  const getSubCounty = (ward: string) => {
    const subCounty = SUB_COUNTY_MAPPINGS.find((item) => {
      const subCounties = Object.values(item.sub_counties).flat();
      const found = subCounties.some((subCountyWard) =>
        subCountyWard.toLowerCase().includes(ward.toLowerCase())
      );

      return found;
    });

    if (subCounty) {
      return subCounty.county_name;
    }
    return null;
  };

  const loadWardsData = async () => {
    try {
      updateLoadingState('initializing', 0, 'Initializing Spatialite database...', null);

      // Initialize the Spatialite database
      const initResult = await ExpoSpatialiteRoom.initDatabase('kenya_wards.db');
      if (!initResult.success) {
        throw new Error(`Failed to initialize database: ${initResult.spatialiteVersion}`);
      }

      updateLoadingState('loading', 0.1, 'Creating spatial table...', null);

      // Create the kenya_wards table with spatial column
      const createTableResult = await ExpoSpatialiteRoom.createSpatialTable(
        'kenya_wards',
        'geometry',
        'MULTIPOLYGON',
        4326
      );

      if (!createTableResult.success) {
        throw new Error(`Failed to create spatial table: ${createTableResult.message}`);
      }

      updateLoadingState('loading', 0.2, 'Adding table columns...', null);

      // Add additional columns for ward information
      try {
        const addColumnsSql = `
          ALTER TABLE kenya_wards ADD COLUMN ward_code TEXT;
          ALTER TABLE kenya_wards ADD COLUMN ward TEXT;
          ALTER TABLE kenya_wards ADD COLUMN county TEXT;
          ALTER TABLE kenya_wards ADD COLUMN county_code INTEGER;
          ALTER TABLE kenya_wards ADD COLUMN sub_county TEXT;
          ALTER TABLE kenya_wards ADD COLUMN constituency TEXT;
          ALTER TABLE kenya_wards ADD COLUMN constituency_code INTEGER;
        `;

        await ExpoSpatialiteRoom.executeStatement(addColumnsSql);
      } catch (error) {
        // Columns might already exist, which is fine
        console.log('Columns may already exist, continuing...');
      }

      // Get the features from the GeoJSON data
      const features = WARDS_GEOJSON.features;
      const totalWards = features.length;
      
      updateLoadingState('loading', 0.3, `Loading ${totalWards} wards... Starting...`, null);

      // Process features in batches to avoid blocking the UI
      const batchSize = 50;
      let processedCount = 0;
      
      for (let i = 0; i < features.length; i += batchSize) {
        const batch = features.slice(i, i + batchSize);
        
        // Process each feature in the batch
        for (let j = 0; j < batch.length; j++) {
          const feature = batch[j];
          const properties = feature.properties;
          
          try {
            // Get sub-county information
            const subCounty = getSubCounty(properties.ward) || 'Unknown';
            
            // Create the GeoJSON structure for MultiPolygon
            const geometry = {
              type: "MultiPolygon" as const,
              coordinates: feature.geometry.coordinates,
            };
            
            // Convert the geometry to a JSON string for insertion
            const geometryJson = JSON.stringify(geometry);
            
            // Prepare the INSERT statement
            const insertSql = `
              INSERT INTO kenya_wards (
                ward_code, ward, county, county_code, sub_county, 
                constituency, constituency_code, geometry
              ) VALUES (?, ?, ?, ?, ?, ?, ?, GeomFromGeoJSON(?))
            `;
            
            // Prepare the values for insertion
            const values: any[] = [
              properties.wardcode || '',
              properties.ward || '',
              properties.county || '',
              properties.countycode ? properties.countycode : -1,
              subCounty,
              properties.const || '',
              properties.constcode ? properties.constcode : -1,
              geometryJson
            ];
            
            // Execute the INSERT statement
            await ExpoSpatialiteRoom.executeStatement(insertSql, values);
            
            processedCount++;
            
            // Update progress every 50 wards or at the end
            if (processedCount % 50 === 0 || processedCount === totalWards) {
              const progress = 0.3 + (processedCount / totalWards) * 0.7;
              updateLoadingState(
                'loading', 
                progress, 
                `Loading wards... ${processedCount}/${totalWards} (${Math.round((processedCount/totalWards)*100).toString()}%)`,
                null
              );
            }
          } catch (insertError: any) {
            console.error(`Error inserting ward ${properties.ward}:`, insertError);
            // Continue with other wards even if one fails
          }
        }
        
        // Small delay to allow UI to update
        await new Promise(resolve => setTimeout(resolve, 10));
      }

      updateLoadingState('completed', 1, `Successfully loaded ${processedCount} wards!`, null);
      
      // Wait a moment before calling onLoadingComplete to show completion
      setTimeout(() => {
        onLoadingComplete();
      }, 1500);
    } catch (error: any) {
      console.error('Error loading wards data:', error);
      updateLoadingState('error', 0, 'Error loading data', error.message);
      onError(error);
    }
  };

  const renderProgressIndicator = () => {
    if (Platform.OS === 'android') {
      return (
        <ProgressBarAndroid
          styleAttr="Horizontal"
          indeterminate={false}
          progress={loadingState.progress}
          style={styles.progressBar}
        />
      );
    } else {
      // ProgressViewIOS is deprecated, using a simple view instead
      return (
        <View style={[styles.progressBar, { backgroundColor: '#e0e0e0' }]}>
          <View style={[styles.progressFill, { width: `${loadingState.progress * 100}%` }]} />
        </View>
      );
    }
  };

  const renderContent = () => {
    switch (loadingState.status) {
      case 'initializing':
      case 'loading':
        return (
          <View style={styles.content}>
            <ActivityIndicator size="large" color="#0000ff" />
            {renderProgressIndicator()}
            <Text style={styles.message}>{loadingState.message}</Text>
          </View>
        );
      case 'completed':
        return (
          <View style={styles.content}>
            <Text style={styles.successMessage}>{loadingState.message}</Text>
          </View>
        );
      case 'error':
        return (
          <View style={styles.content}>
            <Text style={styles.errorMessage}>Error: {loadingState.error}</Text>
            <Text style={styles.message}>{loadingState.message}</Text>
          </View>
        );
      default:
        return null;
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Loading Kenya Wards Data</Text>
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
  progressBar: {
    width: '100%',
    height: 20,
    marginVertical: 20,
    borderRadius: 10,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#0000ff',
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

export default DataLoadingScreen;
