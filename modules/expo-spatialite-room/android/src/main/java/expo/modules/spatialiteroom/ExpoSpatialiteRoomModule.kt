package expo.modules.spatialiteroom

import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import android.content.Context
import android.util.Log
import androidx.sqlite.db.SupportSQLiteDatabase
import androidx.sqlite.db.SupportSQLiteOpenHelper
import androidx.sqlite.db.framework.FrameworkSQLiteOpenHelperFactory
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import java.io.File
import java.io.FileOutputStream
import android.net.Uri

class ExpoSpatialiteRoomModule : Module() {
    private var database: SupportSQLiteDatabase? = null
    private var databasePath: String? = null
    private val coroutineScope = CoroutineScope(Dispatchers.Main)
    
    companion object {
        const val NAME = "ExpoSpatialiteRoom"
        const val TAG = "ExpoSpatialiteRoom"
        const val DATABASE_VERSION = 1 // Current database version
    }

    override fun definition() = ModuleDefinition {
        Name(NAME)

        // Imports an asset database to the specified path
        AsyncFunction("importAssetDatabaseAsync") { databasePath: String, assetDatabasePath: String, forceOverwrite: Boolean ->
            try {
                val context = appContext.reactContext ?: throw IllegalStateException("React context not available")
                
                Log.d(TAG, "Importing asset database from: $assetDatabasePath to: $databasePath")
                
                val dbFile = File(databasePath)
                
                // Create parent directories if they don't exist
                dbFile.parentFile?.mkdirs()
                
                // Check if database already exists and forceOverwrite is false
                if (dbFile.exists() && !forceOverwrite) {
                    Log.d(TAG, "Database already exists and forceOverwrite is false, skipping import")
                    return@AsyncFunction mapOf(
                        "success" to true,
                        "message" to "Database already exists, skipping import"
                    )
                }
                
                // Parse the asset URI and get the file
                val assetUri = Uri.parse(assetDatabasePath)
                val assetFile = File(assetUri.path ?: throw IllegalArgumentException("Invalid asset path"))
                
                if (!assetFile.isFile) {
                    throw IllegalStateException("Asset file does not exist: $assetDatabasePath")
                }
                
                Log.d(TAG, "Asset file exists, size: ${assetFile.length()} bytes")
                
                // Copy the asset file to the destination
                assetFile.copyTo(dbFile, forceOverwrite)
                
                Log.d(TAG, "Database imported successfully to: $databasePath")
                
                mapOf(
                    "success" to true,
                    "message" to "Database imported successfully",
                    "path" to databasePath
                )
            } catch (e: Exception) {
                Log.e(TAG, "Error importing asset database from: $assetDatabasePath to: $databasePath", e)
                throw e
            }
        }

        // Initializes the Spatialite database from a full file path
        AsyncFunction("initDatabase") { dbPath: String ->
            try {
                val context = appContext.reactContext ?: throw IllegalStateException("React context not available")
                
                Log.d(TAG, "Initializing database from path: $dbPath")
                
                // Use the provided path directly
                databasePath = dbPath
                val dbFile = File(dbPath)
                
                // Create parent directories if they don't exist
                dbFile.parentFile?.mkdirs()
                
                // Check if database file exists
                if (!dbFile.exists()) {
                    Log.e(TAG, "Database file does not exist at: $dbPath")
                    throw IllegalStateException("Database file not found at: $dbPath")
                }
                
                Log.d(TAG, "Database file exists, size: ${dbFile.length()} bytes")
                
                // Extract just the filename for SQLiteOpenHelper
                val dbName = dbFile.name
                
                // Initialize the database with Spatialite support
                val configuration = SupportSQLiteOpenHelper.Configuration.builder(context)
                    .name(dbName) // Use just the filename here
                    .callback(object : SupportSQLiteOpenHelper.Callback(DATABASE_VERSION) {
                        override fun onCreate(db: SupportSQLiteDatabase) {
                            Log.d(TAG, "onCreate called for database")
                            // Check if Spatialite metadata exists
                            val cursor = db.query("SELECT name FROM sqlite_master WHERE type='table' AND name='geometry_columns';")
                            if (cursor.count == 0) {
                                Log.d(TAG, "Initializing Spatialite metadata")
                                db.execSQL("SELECT InitSpatialMetaData();")
                            } else {
                                Log.d(TAG, "Spatialite metadata already exists")
                            }
                            cursor.close()
                        }
                        
                        override fun onUpgrade(db: SupportSQLiteDatabase, oldVersion: Int, newVersion: Int) {
                            Log.d(TAG, "Upgrading database from version $oldVersion to $newVersion")
                            // Add migration logic here
                        }
                        
                        override fun onOpen(db: SupportSQLiteDatabase) {
                            Log.d(TAG, "Database opened")
                            // Verify database integrity
                            val cursor = db.query("PRAGMA integrity_check;")
                            if (cursor.moveToFirst() && cursor.getString(0) != "ok") {
                                cursor.close()
                                throw IllegalStateException("Database integrity check failed")
                            }
                            cursor.close()
                            
                            // Verify Spatialite is loaded
                            try {
                                val versionCursor = db.query("SELECT spatialite_version();")
                                if (versionCursor.moveToFirst()) {
                                    Log.d(TAG, "Spatialite version: ${versionCursor.getString(0)}")
                                }
                                versionCursor.close()
                            } catch (e: Exception) {
                                throw IllegalStateException("Spatialite extension not loaded", e)
                            }
                        }
                        
                        override fun onDowngrade(db: SupportSQLiteDatabase, oldVersion: Int, newVersion: Int) {
                            Log.d(TAG, "Downgrading database from version $oldVersion to $newVersion")
                            // Handle downgrade
                        }
                    })
                    .build()
                
                val helper = FrameworkSQLiteOpenHelperFactory().create(configuration)
                database = helper.writableDatabase
                
                // Verify Spatialite version
                val cursor = database?.query("SELECT spatialite_version();")
                var version = "unknown"
                if (cursor != null && cursor.moveToFirst()) {
                    version = cursor.getString(0)
                    cursor.close()
                }
                
                mapOf(
                    "success" to true,
                    "path" to databasePath,
                    "spatialiteVersion" to version
                )
            } catch (e: Exception) {
                Log.e(TAG, "Error initializing database from path: $dbPath", e)
                throw e
            }
        }

        // Keep all the other functions the same (executeQuery, executeStatement, createSpatialTable, etc.)
        // Executes a SQL query
        AsyncFunction("executeQuery") { query: String, params: List<Any>? ->
            try {
                if (database == null) {
                    throw IllegalStateException("Database not initialized. Call initDatabase first.")
                }
                
                Log.d(TAG, "Executing query: $query with params: $params")
                
                val cursor = if (params.isNullOrEmpty()) {
                    database?.query(query)
                } else {
                    val selectionArgs = params.map { it.toString() }.toTypedArray()
                    database?.query(query, selectionArgs)
                }
                
                val results = mutableListOf<Map<String, Any?>>()
                
                if (cursor != null) {
                    val columnCount = cursor.columnCount
                    while (cursor.moveToNext()) {
                        val row = mutableMapOf<String, Any?>()
                        for (i in 0 until columnCount) {
                            val columnName = cursor.getColumnName(i)
                            when (cursor.getType(i)) {
                                0 -> row[columnName] = null // NULL
                                1 -> row[columnName] = cursor.getInt(i) // INTEGER
                                2 -> row[columnName] = cursor.getFloat(i) // FLOAT
                                3 -> row[columnName] = cursor.getString(i) // STRING
                                4 -> row[columnName] = cursor.getBlob(i) // BLOB
                                else -> row[columnName] = cursor.getString(i)
                            }
                        }
                        results.add(row)
                    }
                    cursor.close()
                }
                
                mapOf(
                    "success" to true,
                    "rowCount" to results.size,
                    "data" to results
                )
            } catch (e: Exception) {
                Log.e(TAG, "Error executing query: $query with params: $params", e)
                throw e
            }
        }

        // Executes a SQL statement (INSERT, UPDATE, DELETE)
        AsyncFunction("executeStatement") { statement: String, params: List<Any>? ->
            try {
                if (database == null) {
                    throw IllegalStateException("Database not initialized. Call initDatabase first.")
                }
                
                Log.d(TAG, "Executing statement: $statement with params: $params")
                
                val db = database!!
                var rowsAffected = 0
                
                db.beginTransaction()
                try {
                    if (params.isNullOrEmpty()) {
                        rowsAffected = db.compileStatement(statement).use { stmt ->
                            when {
                                statement.trim().startsWith("INSERT", ignoreCase = true) -> {
                                    val rowId = stmt.executeInsert()
                                    if (rowId >= 0) 1 else 0
                                }
                                else -> stmt.executeUpdateDelete()
                            }
                        }
                    } else {
                        val selectionArgs = params.map { it.toString() }.toTypedArray()
                        db.execSQL(statement, selectionArgs)
                        // Query sqlite_master to get affected rows for parameterized statements
                        val cursor = db.query("SELECT changes();")
                        if (cursor.moveToFirst()) {
                            rowsAffected = cursor.getInt(0)
                        }
                        cursor.close()
                    }
                    db.setTransactionSuccessful()
                } finally {
                    db.endTransaction()
                }
                
                mapOf(
                    "success" to true,
                    "rowsAffected" to rowsAffected
                )
            } catch (e: Exception) {
                Log.e(TAG, "Error executing statement: $statement with params: $params", e)
                throw e
            }
        }

        // Creates a spatial table
        AsyncFunction("createSpatialTable") { tableName: String, geometryColumn: String, geometryType: String, srid: Int ->
            try {
                if (database == null) {
                    throw IllegalStateException("Database not initialized. Call initDatabase first.")
                }
                
                Log.d(TAG, "Creating spatial table: $tableName with geometry column: $geometryColumn, type: $geometryType, srid: $srid")
                
                val createTableSql = """
                    CREATE TABLE IF NOT EXISTS $tableName (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        name TEXT,
                        description TEXT
                    );
                """.trimIndent()
                
                database?.execSQL(createTableSql)
                
                // Check if geometry column already exists
                val geomCheck = database?.query("SELECT COUNT(*) FROM geometry_columns WHERE f_table_name = ? AND f_geometry_column = ?;", arrayOf(tableName, geometryColumn))
                if (geomCheck != null && geomCheck.moveToFirst() && geomCheck.getInt(0) == 0) {
                    val addGeometrySql = """
                        SELECT AddGeometryColumn('$tableName', '$geometryColumn', $srid, '$geometryType', 'XY');
                    """.trimIndent()
                    database?.execSQL(addGeometrySql)
                }
                geomCheck?.close()
                
                // Check if spatial index exists
                val indexCheck = database?.query("SELECT name FROM sqlite_master WHERE type = 'table' AND name = ?;", arrayOf("idx_${tableName}_${geometryColumn}"))
                if (indexCheck != null && indexCheck.count == 0) {
                    val createIndexSql = """
                        SELECT CreateSpatialIndex('$tableName', '$geometryColumn');
                    """.trimIndent()
                    database?.execSQL(createIndexSql)
                }
                indexCheck?.close()
                
                mapOf(
                    "success" to true,
                    "message" to "Spatial table $tableName created successfully"
                )
            } catch (e: Exception) {
                Log.e(TAG, "Error creating spatial table: $tableName, geometry: $geometryColumn", e)
                throw e
            }
        }

        // Inserts a spatial point
        AsyncFunction("insertSpatialPoint") { tableName: String, geometryColumn: String, name: String, description: String, latitude: Double, longitude: Double ->
            try {
                if (database == null) {
                    throw IllegalStateException("Database not initialized. Call initDatabase first.")
                }
                
                Log.d(TAG, "Inserting spatial point into $tableName: $name at ($latitude, $longitude)")
                
                val insertSql = """
                    INSERT INTO $tableName (name, description, $geometryColumn)
                    VALUES (?, ?, MakePoint(?, ?, 4326));
                """.trimIndent()
                
                database?.execSQL(insertSql, arrayOf(name, description, longitude, latitude))
                
                mapOf(
                    "success" to true,
                    "message" to "Point inserted successfully"
                )
            } catch (e: Exception) {
                Log.e(TAG, "Error inserting spatial point into $tableName at ($latitude, $longitude)", e)
                throw e
            }
        }

        // Finds points within a radius
        AsyncFunction("findPointsWithinRadius") { tableName: String, geometryColumn: String, latitude: Double, longitude: Double, radiusMeters: Double ->
            try {
                if (database == null) {
                    throw IllegalStateException("Database not initialized. Call initDatabase first.")
                }
                
                Log.d(TAG, "Finding points within $radiusMeters meters of ($latitude, $longitude) in $tableName")
                
                val query = """
                    SELECT id, name, description, 
                           ST_X($geometryColumn) as longitude, 
                           ST_Y($geometryColumn) as latitude,
                           ST_Distance($geometryColumn, MakePoint(?, ?, 4326)) as distance
                    FROM $tableName
                    WHERE ST_Distance($geometryColumn, MakePoint(?, ?, 4326)) <= ?
                    ORDER BY distance;
                """.trimIndent()
                
                val cursor = database?.query(
                    query, 
                    arrayOf(longitude.toString(), latitude.toString(), longitude.toString(), latitude.toString(), radiusMeters.toString())
                )
                
                val results = mutableListOf<Map<String, Any?>>()
                
                if (cursor != null) {
                    while (cursor.moveToNext()) {
                        val row = mutableMapOf<String, Any?>()
                        row["id"] = cursor.getInt(cursor.getColumnIndexOrThrow("id"))
                        row["name"] = cursor.getString(cursor.getColumnIndexOrThrow("name"))
                        row["description"] = cursor.getString(cursor.getColumnIndexOrThrow("description"))
                        row["longitude"] = cursor.getDouble(cursor.getColumnIndexOrThrow("longitude"))
                        row["latitude"] = cursor.getDouble(cursor.getColumnIndexOrThrow("latitude"))
                        row["distance"] = cursor.getDouble(cursor.getColumnIndexOrThrow("distance"))
                        results.add(row)
                    }
                    cursor.close()
                }
                
                mapOf(
                    "success" to true,
                    "points" to results
                )
            } catch (e: Exception) {
                Log.e(TAG, "Error finding points within $radiusMeters meters in $tableName", e)
                throw e
            }
        }

        // Closes the database
        AsyncFunction("closeDatabase") {
            try {
                Log.d(TAG, "Closing database")
                database?.close()
                database = null
                databasePath = null
                
                mapOf(
                    "success" to true,
                    "message" to "Database closed successfully"
                )
            } catch (e: Exception) {
                Log.e(TAG, "Error closing database", e)
                throw e
            }
        }
    }
}
