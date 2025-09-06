import ExpoSpatialiteRoom from '../../modules/expo-spatialite-room';

interface InitDatabaseResult {
  success: boolean;
  path: string;
  spatialiteVersion: string;
}

interface QueryResult {
  success: boolean;
  rowCount: number;
  data: Array<Record<string, any>>;
}

interface StatementResult {
  success: boolean;
  rowsAffected: number;
}

interface CreateTableResult {
  success: boolean;
  message: string;
}

interface CloseDatabaseResult {
  success: boolean;
  message: string;
}

/**
 * Utility functions for Spatialite database operations
 */
class SpatialiteManager {
  private dbName: string;
  private isInitialized: boolean;

  constructor(dbName: string = 'kenya_wards.db') {
    this.dbName = dbName;
    this.isInitialized = false;
  }

  /**
   * Initialize the Spatialite database
   */
  async initialize(): Promise<boolean> {
    try {
      if (this.isInitialized) {
        return true;
      }

      const result: InitDatabaseResult = await ExpoSpatialiteRoom.initDatabase(this.dbName);
      if (!result.success) {
        throw new Error(`Failed to initialize database: ${result.spatialiteVersion}`);
      }

      this.isInitialized = true;
      return true;
    } catch (error) {
      console.error('Error initializing Spatialite database:', error);
      throw error;
    }
  }

  /**
   * Check if a table exists in the database
   */
  async tableExists(tableName: string): Promise<boolean> {
    try {
      await this.initialize();
      
      const query = `
        SELECT name FROM sqlite_master 
        WHERE type='table' AND name=?;
      `;
      
      const result: QueryResult = await ExpoSpatialiteRoom.executeQuery(query, [tableName]);
      return result.rowCount > 0;
    } catch (error) {
      console.error('Error checking if table exists:', error);
      return false;
    }
  }

  /**
   * Find wards within a radius of a given point
   */
  async findWardsWithinRadius(
    latitude: number,
    longitude: number,
    radiusMeters: number
  ): Promise<any[]> {
    try {
      await this.initialize();
      
      // Check if the kenya_wards table exists
      const tableExists = await this.tableExists('kenya_wards');
      if (!tableExists) {
        throw new Error('kenya_wards table does not exist');
      }

      const query = `
        SELECT ward_code, ward, county, county_code, sub_county, 
               constituency, constituency_code,
               ST_X(ST_Centroid(geometry)) as longitude,
               ST_Y(ST_Centroid(geometry)) as latitude,
               ST_Distance(geometry, MakePoint(?, ?, 4326)) as distance
        FROM kenya_wards
        WHERE ST_Distance(geometry, MakePoint(?, ?, 4326)) <= ?
        ORDER BY distance;
      `;

      const result: QueryResult = await ExpoSpatialiteRoom.executeQuery(query, [
        longitude,
        latitude,
        longitude,
        latitude,
        radiusMeters,
      ]);

      if (result.success) {
        return result.data;
      } else {
        throw new Error('Failed to execute query');
      }
    } catch (error) {
      console.error('Error finding wards within radius:', error);
      throw error;
    }
  }

  /**
   * Find wards that intersect with a bounding box
   */
  async findWardsInBoundingBox(
    minLat: number,
    minLon: number,
    maxLat: number,
    maxLon: number
  ): Promise<any[]> {
    try {
      await this.initialize();
      
      // Check if the kenya_wards table exists
      const tableExists = await this.tableExists('kenya_wards');
      if (!tableExists) {
        throw new Error('kenya_wards table does not exist');
      }

      const query = `
        SELECT ward_code, ward, county, county_code, sub_county, 
               constituency, constituency_code,
               ST_X(ST_Centroid(geometry)) as longitude,
               ST_Y(ST_Centroid(geometry)) as latitude
        FROM kenya_wards
        WHERE ST_Intersects(
          geometry, 
          BuildMBR(?, ?, ?, ?, 4326)
        );
      `;

      const result: QueryResult = await ExpoSpatialiteRoom.executeQuery(query, [
        minLon,
        minLat,
        maxLon,
        maxLat,
      ]);

      if (result.success) {
        return result.data;
      } else {
        throw new Error('Failed to execute query');
      }
    } catch (error) {
      console.error('Error finding wards in bounding box:', error);
      throw error;
    }
  }

  /**
   * Get all wards in a specific county
   */
  async getWardsByCounty(county: string): Promise<any[]> {
    try {
      await this.initialize();
      
      // Check if the kenya_wards table exists
      const tableExists = await this.tableExists('kenya_wards');
      if (!tableExists) {
        throw new Error('kenya_wards table does not exist');
      }

      const query = `
        SELECT ward_code, ward, county, county_code, sub_county, 
               constituency, constituency_code,
               ST_X(ST_Centroid(geometry)) as longitude,
               ST_Y(ST_Centroid(geometry)) as latitude
        FROM kenya_wards
        WHERE county = ?
        ORDER BY ward;
      `;

      const result: QueryResult = await ExpoSpatialiteRoom.executeQuery(query, [county]);

      if (result.success) {
        return result.data;
      } else {
        throw new Error('Failed to execute query');
      }
    } catch (error) {
      console.error('Error getting wards by county:', error);
      throw error;
    }
  }

  /**
   * Get all unique counties
   */
  async getAllCounties(): Promise<string[]> {
    try {
      await this.initialize();
      
      // Check if the kenya_wards table exists
      const tableExists = await this.tableExists('kenya_wards');
      if (!tableExists) {
        throw new Error('kenya_wards table does not exist');
      }

      const query = `
        SELECT DISTINCT county
        FROM kenya_wards
        ORDER BY county;
      `;

      const result: QueryResult = await ExpoSpatialiteRoom.executeQuery(query, []);

      if (result.success) {
        return result.data.map(row => row.county);
      } else {
        throw new Error('Failed to execute query');
      }
    } catch (error) {
      console.error('Error getting all counties:', error);
      throw error;
    }
  }

  /**
   * Close the database connection
   */
  async close(): Promise<boolean> {
    try {
      const result: CloseDatabaseResult = await ExpoSpatialiteRoom.closeDatabase();
      this.isInitialized = false;
      return result.success;
    } catch (error) {
      console.error('Error closing database:', error);
      return false;
    }
  }
}

// Export a singleton instance
export const spatialiteManager = new SpatialiteManager();