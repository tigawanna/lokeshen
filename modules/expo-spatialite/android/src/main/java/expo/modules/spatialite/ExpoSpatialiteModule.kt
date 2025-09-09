package expo.modules.spatialite

import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import android.content.Context
import android.util.Log
import org.spatialite.database.SQLiteDatabase
import org.spatialite.database.SQLiteStatement
import android.database.Cursor
import java.io.File
import java.io.FileOutputStream
import android.net.Uri
import android.os.Build
import androidx.annotation.RequiresApi
import androidx.core.net.toUri

class ExpoSpatialiteModule : Module() {
    private var database: SQLiteDatabase? = null
    private var databasePath: String? = null

    companion object {
        const val NAME = "ExpoSpatialite"
        const val TAG = "ExpoSpatialite"
    }

    @RequiresApi(Build.VERSION_CODES.HONEYCOMB)
    override fun definition() = ModuleDefinition {
        Name(NAME)

        // Function to get the Spatialite version
        Function("getSpatialiteVersion") {
            try {
                // For Android, SpatiaLite should already be loaded with the library
                val db = SQLiteDatabase.openOrCreateDatabase(":memory:", null)

                // Check if SpatiaLite functions are available
                val cursor = db.rawQuery("SELECT spatialite_version()", null)
                cursor.moveToFirst()
                val version = cursor.getString(0)
                cursor.close()
                db.close()
                version
            } catch (e: Exception) {
                Log.e(TAG, "Error getting Spatialite version", e)
                "unknown"
            }
        }

        // Initializes the Spatialite database from a full file path
        AsyncFunction("initDatabase") { dbPath: String ->
            try {
                val context = appContext.reactContext ?: throw IllegalStateException("React context not available")

                Log.d(TAG, "Initializing database from path: $dbPath")

                // Handle special :memory: case
                if (dbPath == ":memory:") {
                    Log.d(TAG, "Creating in-memory database")
                    databasePath = dbPath
                    database = SQLiteDatabase.openOrCreateDatabase(":memory:", null)
                } else {
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
                    database = SQLiteDatabase.openDatabase(dbPath, null, SQLiteDatabase.OPEN_READWRITE)
                }

                // Initialize Spatialite metadata if needed
                try {
                    // SpatiaLite should already be loaded - no need for load_extension
                    database?.execSQL("SELECT InitSpatialMetaData();")
                    Log.d(TAG, "Spatialite metadata initialized successfully")
                } catch (e: Exception) {
                    Log.d(TAG, "Spatialite metadata may already exist or failed to initialize", e)
                }

                // Verify Spatialite is working
                val cursor = database?.rawQuery("SELECT spatialite_version();", null)
                var version = "unknown"
                if (cursor != null && cursor.moveToFirst()) {
                    version = cursor.getString(0)
                    cursor.close()
                }

                Log.d(TAG, "Spatialite version: $version")

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

        // Imports an asset database to the specified path
        AsyncFunction("importAssetDatabaseAsync") { databasePath: String, assetDatabasePath: String, forceOverwrite: Boolean ->
            try {
                val context = appContext.reactContext ?: throw IllegalStateException("React context not available")

                Log.d(TAG, "Importing asset database from: $assetDatabasePath to: $databasePath")

                // Handle both URI and regular file paths for destination
                val destinationPath = if (databasePath.startsWith("file://")) {
                    databasePath.toUri().path ?: throw IllegalArgumentException("Invalid destination path")
                } else {
                    databasePath
                }

                val dbFile = File(destinationPath)

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

                // Open the asset file as a stream
                val assetStream = context.assets.open(assetDatabasePath)

                // Copy the asset file to the destination
                FileOutputStream(dbFile).use { output ->
                    assetStream.copyTo(output)
                }

                Log.d(TAG, "Database imported successfully to: ${dbFile.absolutePath}")

                mapOf(
                    "success" to true,
                    "message" to "Database imported successfully",
                    "path" to dbFile.absolutePath
                )
            } catch (e: Exception) {
                Log.e(TAG, "Error importing asset database from: $assetDatabasePath to: $databasePath", e)
                throw e
            }
        }

        // Executes a SQL query
        AsyncFunction("executeQuery") { query: String, params: List<Any>? ->
            try {
                if (database == null) {
                    throw IllegalStateException("Database not initialized. Call initDatabase first.")
                }

                Log.d(TAG, "Executing query: $query with params: $params")

                val cursor = if (params != null && params.isNotEmpty()) {
                    database?.rawQuery(query, convertParamsToArray(params))
                } else {
                    database?.rawQuery(query, null)
                }

                val results = cursorToList(cursor)
                cursor?.close()

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
                    if (params != null && params.isNotEmpty()) {
                        db.execSQL(statement, convertParamsToArray(params))
                        // Get affected rows count
                        val cursor = db.rawQuery("SELECT changes();", null)
                        if (cursor.moveToFirst()) {
                            rowsAffected = cursor.getInt(0)
                        }
                        cursor.close()
                    } else {
                        db.execSQL(statement)
                        rowsAffected = -1 // Unable to determine
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

        // Simple test method for file handling
        AsyncFunction("testFileHandling") { filePath: String ->
            try {
                val file = File(filePath)
                var fileCreated = false

                if (!file.exists()) {
                    // Create the file and parent directories
                    file.parentFile?.mkdirs()
                    file.createNewFile()
                    fileCreated = true
                }

                if (file.isDirectory) {
                    throw IllegalArgumentException("Path is a directory, not a file")
                }

                // Read current lines
                val lines = file.readLines().toMutableList()

                // If file is empty or was just created, add "new file"
                if (lines.isEmpty() || fileCreated) {
                    lines.add("new file")
                    file.appendText("new file\n")
                }

                mapOf(
                    "success" to true,
                    "lines" to lines,
                    "fileCreated" to fileCreated
                )
            } catch (e: Exception) {
                Log.e(TAG, "Error handling file", e)
                mapOf(
                    "success" to false,
                    "error" to (e.message ?: "Unknown error occurred")
                )
            }
        }
    }

    // Helper function to convert parameters list to array for rawQuery
    private fun convertParamsToArray(params: List<Any>): Array<String> {
        return params.map {
            when (it) {
                is Boolean -> if (it) "1" else "0"
                else -> it.toString()
            }
        }.toTypedArray()
    }

    // Helper function to convert Cursor to List of Maps
    @RequiresApi(Build.VERSION_CODES.HONEYCOMB)
    private fun cursorToList(cursor: Cursor?): List<Map<String, Any?>> {
        val result = mutableListOf<Map<String, Any?>>()

        if (cursor != null && cursor.moveToFirst()) {
            do {
                val row = mutableMapOf<String, Any?>()
                for (i in 0 until cursor.columnCount) {
                    val columnName = cursor.getColumnName(i)
                    row[columnName] = when (cursor.getType(i)) {
                        Cursor.FIELD_TYPE_NULL -> null
                        Cursor.FIELD_TYPE_INTEGER -> cursor.getLong(i)
                        Cursor.FIELD_TYPE_FLOAT -> cursor.getDouble(i)
                        Cursor.FIELD_TYPE_STRING -> cursor.getString(i)
                        Cursor.FIELD_TYPE_BLOB -> cursor.getBlob(i)
                        else -> null
                    }
                }
                result.add(row)
            } while (cursor.moveToNext())
        }

        return result
    }
}