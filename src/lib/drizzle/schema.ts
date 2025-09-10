import { sqliteTable, integer, text, real } from "drizzle-orm/sqlite-core";
import { geometry } from "./drizzlespatialite-types";
import { sql } from "drizzle-orm";

export const kenyaWards = sqliteTable("kenya_wards", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  wardCode: text("ward_code"),
  ward: text("ward").notNull(),
  county: text("county").notNull(),
  countyCode: integer("county_code"),
  subCounty: text("sub_county"),
  constituency: text("constituency").notNull(),
  constituencyCode: integer("constituency_code"),
  geom: geometry("geom"),
});

export const notes = sqliteTable("notes", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  title: text("title"),
  content: text("content").notNull(),
  type: text("type").notNull().default("note"), // note, reminder, list, number
  value: real("value"), // for numeric values
  createdAt: text("created_at").notNull().default(sql`(CURRENT_TIMESTAMP)`),
  updatedAt: text("updated_at").notNull().default(sql`(CURRENT_TIMESTAMP)`),
  location: geometry("location"), // point geometry for location
});
