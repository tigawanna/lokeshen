import { executeQuery } from "@/modules/expo-spatialite";

// query/QueryBuilder.ts
export class QueryBuilder<T extends Record<string, any>> {
  private tableName: string;
  private selectFields: string[] = ["*"];
  private whereConditions: { field: string; operator: string; value: any }[] = [];
  private joinClauses: string[] = [];
  private limitValue?: number;
  private offsetValue?: number;
  private orderByField?: string;
  private orderByDirection: "ASC" | "DESC" = "ASC";

  constructor(tableName: string) {
    this.tableName = tableName;
  }

  select(fields: string[]): QueryBuilder<T> {
    this.selectFields = fields;
    return this;
  }

  where(field: string, operator: string, value: any): QueryBuilder<T> {
    this.whereConditions.push({ field, operator, value });
    return this;
  }

  limit(limit: number): QueryBuilder<T> {
    this.limitValue = limit;
    return this;
  }

  offset(offset: number): QueryBuilder<T> {
    this.offsetValue = offset;
    return this;
  }

  orderBy(field: string, direction: "ASC" | "DESC" = "ASC"): QueryBuilder<T> {
    this.orderByField = field;
    this.orderByDirection = direction;
    return this;
  }

  join(table: string, condition: string): QueryBuilder<T> {
    this.joinClauses.push(`JOIN ${table} ON ${condition}`);
    return this;
  }

  leftJoin(table: string, condition: string): QueryBuilder<T> {
    this.joinClauses.push(`LEFT JOIN ${table} ON ${condition}`);
    return this;
  }

  innerJoin(table: string, condition: string): QueryBuilder<T> {
    this.joinClauses.push(`INNER JOIN ${table} ON ${condition}`);
    return this;
  }

  async execute(): Promise<T[]> {
    let query = `SELECT ${this.selectFields.join(", ")} FROM ${this.tableName}`;
    const params: any[] = [];

    if (this.joinClauses.length > 0) {
      query += ` ${this.joinClauses.join(" ")}`;
    }

    if (this.whereConditions.length > 0) {
      const whereClause = this.whereConditions
        .map((cond) => `${cond.field} ${cond.operator} ?`)
        .join(" AND ");
      query += ` WHERE ${whereClause}`;
      params.push(...this.whereConditions.map((cond) => cond.value));
    }

    if (this.orderByField) {
      query += ` ORDER BY ${this.orderByField} ${this.orderByDirection}`;
    }

    if (this.limitValue !== undefined) {
      query += ` LIMIT ${this.limitValue}`;
      if (this.offsetValue !== undefined) {
        query += ` OFFSET ${this.offsetValue}`;
      }
    }

    const result = await executeQuery<T>(query, params);
    return result.data;
  }
}



// // Simple operations
// const users = await User.findAll<User>();
// const user = await User.findById<User>(1);
// const newUser = await User.create<User>({ 
//   name: "John Doe", 
//   email: "john@example.com" 
// });

// // Spatial operations
// const nearbyUsers = await User.findNearby<User>(37.7749, -122.4194, 1000);

// // Custom queries
// const activeUsers = await new QueryBuilder<User>("users")
//   .select(["id", "name", "email"])
//   .where("created_at", ">", "2023-01-01")
//   .orderBy("name", "ASC")
//   .limit(10)
//   .execute();

// // Raw spatial queries
// const complexResult = await User.rawQuery<{ 
//   id: number; 
//   distance: number; 
//   location_text: string 
// }>(`
//   SELECT 
//     id, 
//     ST_Distance(location, MakePoint(?, ?, 4326)) as distance,
//     AsText(location) as location_text
//   FROM users 
//   WHERE ST_Distance(location, MakePoint(?, ?, 4326)) < ?
//   ORDER BY distance
// `, [-122.4194, 37.7749, -122.4194, 37.7749, 5000]);
