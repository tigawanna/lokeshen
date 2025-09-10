import { initDb } from "./client.js";
// setup.ts - For initial table creation and Spatialite setup
async function createNotesTable() {
  try {
    const { db } = initDb();

    // Create the base table with BLOB support
    db.exec(`
      CREATE TABLE IF NOT EXISTS notes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT,
        content TEXT NOT NULL,
        content_html TEXT,
        type TEXT DEFAULT 'note' NOT NULL,
        status TEXT DEFAULT 'active',
        tags TEXT,
        metadata TEXT,
        image_path TEXT,
        image_blob BLOB, -- BLOB for storing images directly
        priority INTEGER DEFAULT 0,
        last_viewed TEXT,
        reminder_at TEXT,
        completed_at TEXT,
        due_date TEXT,
        created_at TEXT DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
        updated_at TEXT DEFAULT (CURRENT_TIMESTAMP) NOT NULL
      );
    `);

    // Add geometry column using Spatialite function
    try {
      db.exec("SELECT AddGeometryColumn('notes', 'location_point', 4326, 'POINT', 'XY');");
      console.log("Notes point geometry column added successfully.");
    } catch (error: any) {
      if (!error.message?.includes("already exists")) {
        throw error;
      }
      console.log("Notes point geometry column already exists.");
    }

    // Create spatial index
    const pointIndexCheck = db
      .prepare(
        `SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'idx_notes_location_point'`
      )
      .get();

    if (!pointIndexCheck) {
      try {
        db.exec("SELECT CreateSpatialIndex('notes', 'location_point');");
        console.log("Notes point spatial index created successfully.");
      } catch (error: any) {
        console.error("Error creating notes point spatial index:", error.message || error);
      }
    } else {
      console.log("Notes point spatial index already exists.");
    }

    // Create triggers for automatic timestamp updates
    try {
      db.exec(`
        CREATE TRIGGER IF NOT EXISTS update_notes_timestamp 
        AFTER UPDATE ON notes
        BEGIN
          UPDATE notes SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
        END;
      `);
      console.log("Notes timestamp trigger created successfully.");
    } catch (error: any) {
      console.error("Error creating notes timestamp trigger:", error.message || error);
    }

    return db;
  } catch (error) {
    console.error("Error creating notes table:", error);
    return null;
  }
}

createNotesTable();
