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

class ExpoSpatialiteRoomModule : Module() {
  private var database: SupportSQLiteDatabase? = null
  private var databasePath: String? = null
  private val coroutineScope = CoroutineScope(Dispatchers.Main)
  
  companion object {
    const val NAME = "ExpoSpatialiteRoom"
    const val TAG = "ExpoSpatialiteRoom"
  }

  // Each module class must implement the definition function. The definition consists of components
  // that describes the module's functionality and behavior.
  // See https://docs.expo.dev/modules/module-api for more details about available components.
  override fun definition() = ModuleDefinition {
    // Sets the name of the module that JavaScript code will use to refer to the module. Takes a string as an argument.
    // Can be inferred from module's class name, but it's recommended to set it explicitly for clarity.
    // The module will be accessible from `requireNativeModule('ExpoSpatialiteRoom')` in JavaScript.
    Name(NAME)

    // Defines a JavaScript function that initializes the Spatialite database
    AsyncFunction("initDatabase") { dbName: String ->
      try {
        val context = appContext.reactContext ?: throw IllegalStateException("React context not available")
        databasePath = context.getDatabasePath(dbName).absolutePath
        Log.d(TAG, "Initializing database at: $databasePath")
        
        // Create database directory if it doesn't exist
        val dbFile = File(databasePath)
        dbFile.parentFile?.mkdirs()
        
        // Initialize the database with Spatialite support
        val configuration = SupportSQLiteOpenHelper.Configuration.builder(context)
          .name(dbName)
          .callback(object : SupportSQLiteOpenHelper.Callback(1) {
            override fun onCreate(db: SupportSQLiteDatabase) {
              Log.d(TAG, "Creating new database")
              // Initialize Spatialite extension
              db.execSQL("SELECT InitSpatialMetaData();")
            }
            
            override fun onUpgrade(db: SupportSQLiteDatabase, oldVersion: Int, newVersion: Int) {
              Log.d(TAG, "Upgrading database from version $oldVersion to $newVersion")
            }
          })
          .build()
          
        val helper = FrameworkSQLiteOpenHelperFactory().create(configuration)
        database = helper.writableDatabase
        
        // Verify Spatialite is working
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
        Log.e(TAG, "Error initializing database", e)
        throw e
      }
    }

    // Defines a JavaScript function that executes a SQL query
    AsyncFunction("executeQuery") { query: String, params: List<Any>? ->
      try {
        if (database == null) {
          throw IllegalStateException("Database not initialized. Call initDatabase first.")
        }
        
        Log.d(TAG, "Executing query: $query")
        
        val cursor = if (params.isNullOrEmpty()) {
          database?.query(query)
        } else {
          // Handle parameterized queries
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
        Log.e(TAG, "Error executing query: $query", e)
        throw e
      }
    }

    // Defines a JavaScript function that executes a SQL statement (INSERT, UPDATE, DELETE)
    AsyncFunction("executeStatement") { statement: String, params: List<Any>? ->
      try {
        if (database == null) {
          throw IllegalStateException("Database not initialized. Call initDatabase first.")
        }
        
        Log.d(TAG, "Executing statement: $statement")
        
        val db = database!!
        var rowsAffected = 0
        
        if (params.isNullOrEmpty()) {
          rowsAffected = db.compileStatement(statement).use { stmt ->
            when {
              statement.trim().startsWith("INSERT", ignoreCase = true) -> {
                stmt.executeInsert().toInt()
                1 // For INSERT we return 1 to indicate success
              }
              else -> stmt.executeUpdateDelete()
            }
          }
        } else {
          // Handle parameterized statements
          db.execSQL(statement, params.map { it.toString() }.toTypedArray())
          rowsAffected = 1 // We can't get the exact count for parameterized statements
        }
        
        mapOf(
          "success" to true,
          "rowsAffected" to rowsAffected
        )
      } catch (e: Exception) {
        Log.e(TAG, "Error executing statement: $statement", e)
        throw e
      }
    }

    // Defines a JavaScript function that creates a spatial table
    AsyncFunction("createSpatialTable") {
       tableName: String, geometryColumn: String, geometryType: String, srid: Int ->
      try {
        if (database == null) {
          throw IllegalStateException("Database not initialized. Call initDatabase first.")
        }
        
        Log.d(TAG, "Creating spatial table: $tableName with geometry column: $geometryColumn")
        
        // Create the table with spatial column
        val createTableSql = """
          CREATE TABLE IF NOT EXISTS $tableName (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT,
            description TEXT
          );
        """.trimIndent()
        
        database?.execSQL(createTableSql)
        
        // Add the geometry column
        val addGeometrySql = """
          SELECT AddGeometryColumn('$tableName', '$geometryColumn', $srid, '$geometryType', 'XY');
        """.trimIndent()
        
        database?.execSQL(addGeometrySql)
        
        // Create a spatial index
        val createIndexSql = """
          SELECT CreateSpatialIndex('$tableName', '$geometryColumn');
        """.trimIndent()
        
        database?.execSQL(createIndexSql)
        
        mapOf(
          "success" to true,
          "message" to "Spatial table $tableName created successfully"
        )
      } catch (e: Exception) {
        Log.e(TAG, "Error creating spatial table: $tableName", e)
        throw e
      }
    }

    // Defines a JavaScript function that inserts a spatial point
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
        Log.e(TAG, "Error inserting spatial point", e)
        throw e
      }
    }

    // Defines a JavaScript function that finds points within radius
    AsyncFunction("findPointsWithinRadius") { tableName: String, geometryColumn: String, latitude: Double, longitude: Double, radiusMeters: Double ->
      try {
        if (database == null) {
          throw IllegalStateException("Database not initialized. Call initDatabase first.")
        }
        
        Log.d(TAG, "Finding points within $radiusMeters meters of ($latitude, $longitude)")
        
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
        Log.e(TAG, "Error finding points within radius", e)
        throw e
      }
    }

    // Defines a JavaScript function that closes the database
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
