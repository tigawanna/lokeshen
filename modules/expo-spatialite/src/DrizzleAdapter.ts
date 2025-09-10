import type { SpatialiteParam, TransactionStatement } from './ExpoSpatialiteModule';
import ExpoSpatialiteModule from './ExpoSpatialiteModule';

export type Sqlite3Method = 'run' | 'get' | 'all' | 'values';

export type RawResultData = {
  rows: any[];
};

export class ExpoSpatialiteDrizzle {
  async exec(sql: string, params: SpatialiteParam[] = [], method: Sqlite3Method = 'all'): Promise<RawResultData> {
    switch (method) {
      case 'run':
        await ExpoSpatialiteModule.executeStatement(sql, params);
        return { rows: [] };
      
      case 'get':
        const getResult = await ExpoSpatialiteModule.executeQuery(sql, params);
        return { rows: getResult.data.slice(0, 1) };
      
      case 'all':
      case 'values':
      default:
        const allResult = await ExpoSpatialiteModule.executeQuery(sql, params);
        return { rows: allResult.data };
    }
  }

  async execBatch(queries: { sql: string; params: SpatialiteParam[]; method: Sqlite3Method }[]): Promise<RawResultData[]> {
    const statements: TransactionStatement[] = queries.map(q => ({
      sql: q.sql,
      params: q.params,
      method: q.method
    }));
    
    const results = await ExpoSpatialiteModule.executeTransaction(statements, false);
    return results.map(result => ({
      rows: result.data ? (Array.isArray(result.data) ? result.data : [result.data]) : []
    }));
  }

  // Drizzle driver interface
  async driver(sql: string, params: unknown[], method: Sqlite3Method): Promise<RawResultData> {
    if (/^begin\b/i.test(sql)) {
      console.warn(
        "Drizzle's transaction method cannot isolate transactions from outside queries. It is recommended to use the transaction method of ExpoSpatialiteDrizzle instead."
      );
    }
    return this.exec(sql, params as SpatialiteParam[], method);
  }

  // Drizzle batch driver interface
  async batchDriver(queries: { sql: string; params: unknown[]; method: Sqlite3Method }[]): Promise<RawResultData[]> {
    return this.execBatch(queries.map(q => ({
      sql: q.sql,
      params: q.params as SpatialiteParam[],
      method: q.method
    })));
  }

  // Transaction method for proper isolation
  async transaction<T>(fn: (tx: ExpoSpatialiteDrizzle) => Promise<T>): Promise<T> {
    await ExpoSpatialiteModule.executeStatement('BEGIN');
    try {
      const result = await fn(this);
      await ExpoSpatialiteModule.executeStatement('COMMIT');
      return result;
    } catch (error) {
      await ExpoSpatialiteModule.executeStatement('ROLLBACK');
      throw error;
    }
  }
}
