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

        Constants {
            val defaultDatabaseDirectory = appContext.reactContext?.filesDir?.canonicalPath + File.separator + "Spatialite"
            mapOf(
                "defaultDatabaseDirectory" to defaultDatabaseDirectory
            )
        }

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
                    // Use Expo's pattern: resolve relative paths against app's files directory
                    val baseDir = context.filesDir
                    val dbFile = if (File(dbPath).isAbsolute) {
                        File(dbPath)
                    } else {
                        File(baseDir, "Spatialite" + File.separator + dbPath)
                    }

                    // Create parent directories if they don't exist
                    val parentDir = dbFile.parentFile
                    if (parentDir != null) {
                        if (!parentDir.exists()) {
                            Log.d(TAG, "Parent directory does not exist, attempting to create: ${parentDir.absolutePath}")
                            val dirsCreated = parentDir.mkdirs()
                            if (dirsCreated) {
                                Log.d(TAG, "Successfully created parent directories")
                            } else {
                                Log.w(TAG, "Failed to create parent directories, checking if they exist now...")
                                if (!parentDir.exists()) {
                                    Log.e(TAG, "Parent directories could not be created: ${parentDir.absolutePath}")
                                    throw IllegalStateException("Could not create parent directories for database path: ${dbFile.absolutePath}")
                                }
                            }
                        }
                    }

                    var isNewDatabase = false

                    // Check if database file exists
                    if (!dbFile.exists()) {
                        Log.d(TAG, "Database file does not exist, will be created at: ${dbFile.absolutePath}")
                        isNewDatabase = true
                    } else {
                        Log.d(TAG, "Database file exists, size: ${dbFile.length()} bytes")
                    }

                    // Open the database (will create if it doesn't exist)
                    database = SQLiteDatabase.openDatabase(
                        dbFile.absolutePath,
                        null,
                        SQLiteDatabase.OPEN_READWRITE or SQLiteDatabase.CREATE_IF_NECESSARY
                    )

                    // If it's a new database, initialize Spatialite metadata
                    if (isNewDatabase) {
                        try {
                            database?.execSQL("SELECT InitSpatialMetaData();")
                            Log.d(TAG, "Spatialite metadata initialized successfully for new database")
                        } catch (e: Exception) {
                            Log.d(TAG, "Spatialite metadata may already exist or failed to initialize", e)
                        }
                    }

                    databasePath = dbFile.absolutePath
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
                    "spatialiteVersion" to version,
                    "isNewDatabase" to (databasePath != ":memory:" && !File(databasePath ?: "").exists())
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

                // Use Expo's pattern: resolve relative paths against app's files directory
                val baseDir = context.filesDir
                val dbFile = if (File(databasePath).isAbsolute) {
                    File(databasePath)
                } else {
                    File(baseDir, "Spatialite" + File.separator + databasePath)
                }

                // Create parent directories if they don't exist
                val parentDir = dbFile.parentFile
                if (parentDir != null) {
                    if (!parentDir.exists()) {
                        Log.d(TAG, "Parent directory does not exist, attempting to create: ${parentDir.absolutePath}")
                        val dirsCreated = parentDir.mkdirs()
                        if (!dirsCreated && !parentDir.exists()) {
                            Log.e(TAG, "Could not create parent directories: ${parentDir.absolutePath}")
                            throw IllegalStateException("Could not create parent directories for path: ${dbFile.absolutePath}")
                        }
                    }
                }

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

        // Executes a SQL query (SELECT, WITH, PRAGMA queries) - returns data
        AsyncFunction("executeQuery") { query: String, params: List<Any?>? ->
            try {
                if (database == null) {
                    throw IllegalStateException("Database not initialized. Call initDatabase first.")
                }

                // Validate that this is actually a query that returns data
                val statementType = getStatementType(query)
                if (statementType == StatementType.MODIFY) {
                    throw IllegalArgumentException("Use executeStatement for INSERT, UPDATE, DELETE statements")
                }

                Log.d(TAG, "Executing query: $query with params: $params")

                val cursor = if (params != null && params.isNotEmpty() && hasPlaceholders(query)) {
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

        // Executes a SQL statement (INSERT, UPDATE, DELETE) - no data returned
        AsyncFunction("executeStatement") { statement: String, params: List<Any?>? ->
            try {
                if (database == null) {
                    throw IllegalStateException("Database not initialized. Call initDatabase first.")
                }

                // Validate that this is not a data-returning query
                val statementType = getStatementType(statement)
                if (statementType == StatementType.QUERY) {
                    throw IllegalArgumentException("Use executeQuery for statements that return data")
                }

                Log.d(TAG, "Executing statement: $statement with params: $params")

                val db = database!!
                var rowsAffected = 0

                db.beginTransaction()
                try {
                    if (params != null && params.isNotEmpty() && hasPlaceholders(statement)) {
                        db.execSQL(statement, convertParamsToArray(params))
                        // Get affected rows count for INSERT/UPDATE/DELETE
                        if (statementType == StatementType.MODIFY) {
                            try {
                                val cursor = db.rawQuery("SELECT changes();", null)
                                if (cursor.moveToFirst()) {
                                    rowsAffected = cursor.getInt(0)
                                }
                                cursor.close()
                            } catch (e: Exception) {
                                Log.w(TAG, "Could not get row count: ${e.message}")
                                rowsAffected = -1
                            }
                        } else {
                            rowsAffected = 0 // PRAGMA setters don't have row counts
                        }
                    } else {
                        db.execSQL(statement)
                        rowsAffected = if (statementType == StatementType.MODIFY) -1 else 0
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

        // Special function for PRAGMA queries that return values
        AsyncFunction("executePragmaQuery") { pragma: String ->
            try {
                if (database == null) {
                    throw IllegalStateException("Database not initialized. Call initDatabase first.")
                }

                Log.d(TAG, "Executing PRAGMA query: $pragma")

                // This is specifically for PRAGMA statements that return data
                val cursor = database?.rawQuery(pragma, null)
                val results = cursorToList(cursor)
                cursor?.close()

                mapOf(
                    "success" to true,
                    "data" to results
                )
            } catch (e: Exception) {
                Log.e(TAG, "Error executing PRAGMA query: $pragma", e)
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
                val context = appContext.reactContext ?: throw IllegalStateException("React context not available")

                // Use Expo's pattern for test files too
                val baseDir = context.filesDir
                val file = if (File(filePath).isAbsolute) {
                    File(filePath)
                } else {
                    File(baseDir, "Spatialite" + File.separator + filePath)
                }

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

    // Enum to categorize SQL statement types
    private enum class StatementType {
        QUERY,      // SELECT, WITH, PRAGMA queries - returns data
        MODIFY,     // INSERT, UPDATE, DELETE - modifies data
        PRAGMA_SET, // PRAGMA setters - no return data
        OTHER       // CREATE, DROP, etc.
    }

    // Helper function to determine statement type
    private fun getStatementType(sql: String): StatementType {
        val trimmedSql = sql.trim().uppercase()
        return when {
            trimmedSql.startsWith("SELECT") || trimmedSql.startsWith("WITH") -> StatementType.QUERY
            trimmedSql.startsWith("INSERT") || trimmedSql.startsWith("UPDATE") || trimmedSql.startsWith("DELETE") -> StatementType.MODIFY
            trimmedSql.startsWith("PRAGMA") -> {
                // Check if it's a query (returns data) or setter (no return data)
                if (trimmedSql.contains("=")) {
                    StatementType.PRAGMA_SET // PRAGMA name=value (setter)
                } else {
                    StatementType.QUERY // PRAGMA name (query)
                }
            }
            else -> StatementType.OTHER
        }
    }

    // Helper function to check if SQL statement has placeholders
    private fun hasPlaceholders(sql: String): Boolean {
        // Remove string literals and comments to avoid false positives
        val cleanedSql = sql
            .replace("'[^']*'".toRegex(), "") // Remove single quoted strings
            .replace("\"[^\"]*\"".toRegex(), "") // Remove double quoted strings
            .replace("--.*".toRegex(), "") // Remove single line comments
            .replace("/\\*[\\s\\S]*?\\*/".toRegex(), "") // Remove multi-line comments
        return cleanedSql.contains("?")
    }

    // Helper function to convert parameters list to array for rawQuery
    private fun convertParamsToArray(params: List<Any?>): Array<String?> {
        return params.map {
            when (it) {
                null -> null
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