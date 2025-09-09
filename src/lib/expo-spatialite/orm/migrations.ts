// migrations/MigrationHelper.ts
import { executeStatement } from "@/modules/expo-spatialite";

export class MigrationHelper {
  static async createTable(
    tableName: string,
    fields: Record<string, { type: string; primaryKey?: boolean; nullable?: boolean }>
  ): Promise<void> {
    const fieldDefinitions = Object.entries(fields).map(([name, config]) => {
      let definition = `${name} ${config.type}`;
      if (config.primaryKey) {
        definition += " PRIMARY KEY";
      }
      if (!config.nullable) {
        definition += " NOT NULL";
      }
      return definition;
    });

    const query = `CREATE TABLE IF NOT EXISTS ${tableName} (${fieldDefinitions.join(", ")})`;
    await executeStatement(query);
  }

  static async addSpatialIndex(tableName: string, geometryColumn: string): Promise<void> {
    const query = `SELECT CreateSpatialIndex('${tableName}', '${geometryColumn}')`;
    await executeStatement(query);
  }
}

// Example migration
export async function createUserTable() {
  await MigrationHelper.createTable("users", {
    id: { type: "INTEGER", primaryKey: true },
    name: { type: "TEXT", nullable: false },
    email: { type: "TEXT", nullable: false },
    location: { type: "GEOMETRY", nullable: true },
    created_at: { type: "TEXT", nullable: false },
  });

  await MigrationHelper.addSpatialIndex("users", "location");
}
