import ExpoSpatialiteModule, { 
  DatabaseParams, 
  ConnectionResult, 
  QueryResult 
} from './index';

// Example usage of the ExpoSpatialiteModule
async function example() {
  try {
    // Connect to the database
    const params: DatabaseParams = {
      dbName: 'example.db',
      localPath: 'databases',
      readonly: false,
      spatial: true
    };
    
    const connectionResult: ConnectionResult = await ExpoSpatialiteModule.connect(params);
    console.log('Connection result:', connectionResult);
    
    // Execute a query
    const queryResult: QueryResult = await ExpoSpatialiteModule.executeQuery('SELECT * FROM sqlite_master');
    console.log('Query result:', queryResult);
    
    // Close the database
    const closeResult: ConnectionResult = await ExpoSpatialiteModule.close();
    console.log('Close result:', closeResult);
  } catch (error) {
    console.error('Error:', error);
  }
}

export default example;
