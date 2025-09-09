// models/BaseModel.ts
import { executeQuery, executeStatement, executeRawQuery } from "@/modules/expo-spatialite";

export interface ModelField<T = any> {
  name: string;
  type: string;
  primaryKey?: boolean;
  nullable?: boolean;
  defaultValue?: T;
}

export abstract class BaseModel {
  protected tableName: string;
  protected fields: Record<string, ModelField>;

  constructor(tableName: string, fields: Record<string, ModelField>) {
    this.tableName = tableName;
    this.fields = fields;
  }

  /**
   * Find all records in the table
   * @example
   * ```ts
   * const users = await User.findAll<User>();
   * console.log(users); // First 100 records
   * 
   * // Get more records
   * const allUsers = await User.findAll<User>(500);
   * ```
   */
  async findAll<T extends Record<string, any>>(limit: number = 100): Promise<T[]> {
    const query = `SELECT * FROM ${this.tableName} LIMIT ?`;
    const result = await executeQuery<T>(query, [limit]);
    return result.data;
  }

  /**
   * Find a single record by its primary key
   * @example
   * ```ts
   * const user = await User.findById<User>(1);
   * if (user) {
   *   console.log(user.name); // "John"
   * }
   * ```
   */
  async findById<T extends Record<string, any>>(id: number | string): Promise<T | null> {
    const pkField = Object.values(this.fields).find((f) => f.primaryKey);
    if (!pkField) {
      throw new Error("No primary key defined");
    }

    const query = `SELECT * FROM ${this.tableName} WHERE ${pkField.name} = ?`;
    const result = await executeQuery<T>(query, [id]);
    return result.data[0] || null;
  }

  /**
   * Find records matching the given conditions
   * @example
   * ```ts
   * const activeUsers = await User.find<User>({ 
   *   status: 'active', 
   *   role: 'admin' 
   * });
   * console.log(activeUsers.length); // Number of active admin users
   * ```
   */
  async find<T extends Record<string, any>>(conditions: Record<string, any>): Promise<T[]> {
    const whereClause = Object.keys(conditions)
      .map((key) => `${key} = ?`)
      .join(" AND ");

    const values = Object.values(conditions);
    const query = `SELECT * FROM ${this.tableName} WHERE ${whereClause}`;

    const result = await executeQuery<T>(query, values);
    return result.data;
  }

  /**
   * Create a new record and return it
   * @example
   * ```ts
   * const newUser = await User.create<User>({
   *   name: "Jane Doe",
   *   email: "jane@example.com",
   *   status: "active"
   * });
   * console.log(newUser.id); // Auto-generated ID
   * ```
   */
  async create<T extends Record<string, any>>(data: Partial<T>): Promise<T> {
    const fields = Object.keys(data);
    const values = Object.values(data);
    const placeholders = fields.map(() => "?").join(", ");

    const query = `INSERT INTO ${this.tableName} (${fields.join(", ")}) VALUES (${placeholders})`;
    await executeStatement(query, values);

    // Return the created record
    const lastIdResult = await executeQuery<{ id: number }>("SELECT last_insert_rowid() as id");
    const id = lastIdResult.data[0].id;

    const created = await this.findById<T>(id);
    if (!created) {
      throw new Error('Failed to retrieve created record');
    }
    return created;
  }

  /**
   * Update a record by ID and return the updated record
   * @example
   * ```ts
   * const updatedUser = await User.update<User>(1, {
   *   name: "John Smith",
   *   status: "inactive"
   * });
   * if (updatedUser) {
   *   console.log(updatedUser.name); // "John Smith"
   * }
   * ```
   */
  async update<T extends Record<string, any>>(id: number | string, data: Partial<T>): Promise<T | null> {
    const pkField = Object.values(this.fields).find((f) => f.primaryKey);
    if (!pkField) {
      throw new Error("No primary key defined");
    }

    const fields = Object.keys(data);
    const values = [...Object.values(data), id];
    const setClause = fields.map((field) => `${field} = ?`).join(", ");

    const query = `UPDATE ${this.tableName} SET ${setClause} WHERE ${pkField.name} = ?`;
    await executeStatement(query, values);

    return this.findById<T>(id);
  }

  /**
   * Delete a record by ID
   * @example
   * ```ts
   * const deleted = await User.delete(1);
   * if (deleted) {
   *   console.log("User deleted successfully");
   * }
   * ```
   */
  async delete(id: number | string): Promise<boolean> {
    const pkField = Object.values(this.fields).find((f) => f.primaryKey);
    if (!pkField) {
      throw new Error("No primary key defined");
    }

    const query = `DELETE FROM ${this.tableName} WHERE ${pkField.name} = ?`;
    const result = await executeStatement(query, [id]);
    return result.rowsAffected > 0;
  }

  /**
   * Find records with cursor-based pagination
   * @example
   * ```ts
   * // First page
   * const firstBatch = await User.findPaginated<User>();
   * 
   * // Next page using last record's created_at
   * const lastRecord = firstBatch[firstBatch.length - 1];
   * const nextBatch = await User.findPaginated<User>(
   *   lastRecord.created_at, 
   *   10, 
   *   'created_at'
   * );
   * ```
   */
  async findPaginated<T extends Record<string, any>>(
    cursor?: string,
    limit: number = 20,
    cursorField: string = 'created_at'
  ): Promise<T[]> {
    let query = `SELECT * FROM ${this.tableName}`;
    const params: any[] = [];

    if (cursor) {
      query += ` WHERE ${cursorField} > ?`;
      params.push(cursor);
    }

    query += ` ORDER BY ${cursorField} ASC LIMIT ?`;
    params.push(limit);

    const result = await executeQuery<T>(query, params);
    return result.data;
  }

  /**
   * Execute raw SQL queries for complex operations
   * @example
   * ```ts
   * // Spatial query example
   * const nearbyUsers = await User.rawQuery<User & { distance: number }>(`
   *   SELECT *, ST_Distance(location, MakePoint(?, ?, 4326)) as distance
   *   FROM users 
   *   WHERE ST_Distance(location, MakePoint(?, ?, 4326)) < ?
   *   ORDER BY distance
   * `, [lng, lat, lng, lat, 1000]);
   * 
   * // Complex aggregation
   * const stats = await User.rawQuery<{ count: number; avg_age: number }>(`
   *   SELECT COUNT(*) as count, AVG(age) as avg_age FROM users WHERE active = 1
   * `);
   * ```
   */
  async rawQuery<T extends Record<string, any>>(query: string, params?: any[]): Promise<T[]> {
    const result = await executeRawQuery<T>(query, params);
    return result.data;
  }
}
