import { ExpoSpatialiteDrizzle } from "@/modules/expo-spatialite";
import { drizzle } from 'drizzle-orm/sqlite-proxy';
import * as schema  from './schema';
const { driver, batchDriver } = new ExpoSpatialiteDrizzle();

export const db = drizzle(driver, batchDriver,{
    schema
});

